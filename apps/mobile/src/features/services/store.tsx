// One-off service orders and how they are priced: the owner's margin and
// exchange rate, live fal prices, and any per-tool price the owner sets by
// hand. Saved on the phone until the server keeps accounts.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { defaultPricing, planLines, quote, type PricingSettings, type Quote, type ServiceKind, type ServiceParams, type ServiceTier, type ServiceToolKey } from '@sq/shared';
import { getJson } from '@/lib/ai';

export type JobResult = { type: 'text'; text: string } | { type: 'audio' | 'video'; url: string } | { type: 'image'; url: string; urls?: string[] };

// A file the customer attached, as kept with the order.
export type MediaRecord = { uri: string; kind: 'video' | 'image'; mimeType: string; seconds: number; fileName: string; bytes?: number; estimated?: boolean };

export type ServiceJob = {
  id: string;
  kind: ServiceKind;
  title: string;
  params: ServiceParams;
  tier: ServiceTier;
  media: MediaRecord | null;
  // All photos of a video-from-photos order, in order; `media` is the first.
  images?: MediaRecord[];
  // The files' fal URLs once uploaded, so later versions reuse them.
  sourceUrls?: string[];
  // Every change to a result is a new order in the same thread: `rootId` is
  // the first order, `parentId` the version it changes, `version` counts from 1.
  rootId?: string;
  parentId?: string;
  version?: number;
  // The customer's own words: the request, or the change they asked for.
  request?: string;
  // What a change works from: the design it edits or the text it rewrites.
  revise?: { instruction: string; imageUrl?: string; text?: string };
  quote: Quote;
  status: 'pending' | 'running' | 'done' | 'failed';
  // A runner step key while it runs.
  step: string;
  progress: number;
  result?: JobResult;
  // 'interrupted' when the app closed mid-run; otherwise a message.
  error?: string;
  createdAt: number;
};

type Saved = {
  jobs: ServiceJob[];
  settings: PricingSettings;
  // Prices the owner typed in, per unit in dollars; they win over live ones.
  manual: Partial<Record<ServiceToolKey, number>>;
};

type Services = Saved & {
  live: Partial<Record<ServiceToolKey, number>>;
  liveStatus: 'loading' | 'ok' | 'failed';
  refreshLive: () => void;
  priceFor: (params: ServiceParams, mediaSeconds: number, tier: ServiceTier, mediaBytes?: number) => Quote;
  addJob: (job: ServiceJob) => void;
  updateJob: (id: string, patch: Partial<ServiceJob>) => void;
  removeJob: (id: string) => void;
  setSettings: (s: Partial<PricingSettings>) => void;
  setManual: (tool: ServiceToolKey, usd: number | null) => void;
};

// v2 added levels; v1 orders are dropped, its prices and margins are kept.
const STORAGE_KEY = 'sq.services.v2';
const OLD_KEY = 'sq.services.v1';
const initial: Saved = { jobs: [], settings: defaultPricing, manual: {} };
const Ctx = createContext<Services | null>(null);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(initial);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState<Partial<Record<ServiceToolKey, number>>>({});
  const [liveStatus, setLiveStatus] = useState<'loading' | 'ok' | 'failed'>('loading');
  const [liveTick, setLiveTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(OLD_KEY)])
      .then(([raw, old]) => {
        if (cancelled || !(raw || old)) return;
        const p = raw ? (JSON.parse(raw) as Partial<Saved>) : { ...(JSON.parse(old as string) as Partial<Saved>), jobs: [] };
        // A job cut off by closing the app is marked so it can be retried.
        const jobs = (p.jobs ?? []).map((j) => (j.status === 'running' ? { ...j, status: 'failed' as const, error: 'interrupted' } : j));
        setSaved({ jobs, settings: { ...defaultPricing, ...p.settings }, manual: p.manual ?? {} });
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved)).catch(() => undefined);
  }, [saved, ready]);

  useEffect(() => {
    let alive = true;
    getJson<{ prices: Partial<Record<ServiceToolKey, number>> }>('/api/prices')
      .then((d) => {
        if (!alive) return;
        setLive(d.prices ?? {});
        setLiveStatus('ok');
      })
      .catch(() => {
        if (alive) setLiveStatus('failed');
      });
    return () => {
      alive = false;
    };
  }, [liveTick]);

  const value: Services = {
    ...saved,
    live,
    liveStatus,
    refreshLive: () => {
      setLiveStatus('loading');
      setLiveTick((t) => t + 1);
    },
    priceFor: (params, mediaSeconds, tier, mediaBytes = 0) => quote(planLines(params, mediaSeconds, tier, mediaBytes), saved.settings, { ...live, ...saved.manual }, tier),
    addJob: (job) => setSaved((s) => ({ ...s, jobs: [job, ...s.jobs].slice(0, 50) })),
    updateJob: (id, patch) => setSaved((s) => ({ ...s, jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) })),
    removeJob: (id) => setSaved((s) => ({ ...s, jobs: s.jobs.filter((j) => j.id !== id) })),
    setSettings: (patch) => setSaved((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    setManual: (tool, usd) =>
      setSaved((s) => {
        const manual = { ...s.manual };
        if (usd === null) delete manual[tool];
        else manual[tool] = usd;
        return { ...s, manual };
      }),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// The thread an order belongs to, first version first.
export function threadOf(jobs: ServiceJob[], job: ServiceJob): ServiceJob[] {
  const root = job.rootId ?? job.id;
  return jobs.filter((j) => j.id === root || j.rootId === root).sort((a, b) => (a.version ?? 1) - (b.version ?? 1) || a.createdAt - b.createdAt);
}

// One entry per thread, its latest version, newest first.
export function latestVersions(jobs: ServiceJob[]): ServiceJob[] {
  const seen = new Map<string, ServiceJob>();
  for (const j of jobs) {
    const root = j.rootId ?? j.id;
    const kept = seen.get(root);
    if (!kept || (j.version ?? 1) > (kept.version ?? 1)) seen.set(root, j);
  }
  return [...seen.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function useServices(): Services {
  const v = useContext(Ctx);
  if (!v) throw new Error('useServices must be used inside ServicesProvider');
  return v;
}
