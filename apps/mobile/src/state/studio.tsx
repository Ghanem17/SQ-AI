// Everything the customer sets up and orders: the reel being prepared, past
// orders, the monthly plan and the automation rules. Saved on the phone until
// the server takes over in phase 2.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { promotionCost, reelPrice, type Platform, type PlanSize, type PromoLevel, type Tier } from '@sq/shared';

export type PublishWhen = { kind: 'best' } | { kind: 'now' } | { kind: 'custom'; day: number; hour: number; minute: number };

export type Draft = {
  title: string;
  captured: number[];
  tier: Tier;
  platforms: Platform[];
  when: PublishWhen;
  promo: PromoLevel;
  promoDays: number;
  caption: string;
};

export type OrderStatus = 'editing' | 'review' | 'scheduled' | 'published';

export type Order = {
  id: string;
  title: string;
  tier: Tier;
  platforms: Platform[];
  when: PublishWhen;
  promo: PromoLevel;
  promoDays: number;
  reelPrice: number;
  promoCost: number;
  createdAt: number;
  status: OrderStatus;
};

export type Goal = 'orders' | 'followers' | 'awareness';

export type Plan = {
  active: boolean;
  goal: Goal;
  reels: PlanSize;
  tier: Tier;
  platforms: Platform[];
  adBudget: number;
};

export type Automation = {
  enabled: boolean;
  approval: 'auto' | 'ask';
  bestTime: boolean;
  autoPromote: boolean;
  autoReply: boolean;
  escalate: boolean;
  monthlyCap: number;
};

type Saved = { orders: Order[]; plan: Plan; automation: Automation };

type Studio = Saved & {
  draft: Draft;
  startDraft: (title: string) => void;
  updateDraft: (patch: Partial<Draft>) => void;
  placeOrder: () => Order;
  savePlan: (plan: Plan) => void;
  setAutomation: (patch: Partial<Automation>) => void;
  spentThisMonth: number;
};

const STORAGE_KEY = 'sq.studio.v1';

export const defaultCaption =
  'دولمة بيت الريف، محشية على أصولها ومطبوخة على نار هادئة 🍋\nاطلبها الآن عبر الواتساب، التوصيل لكل مناطق بغداد.\n#بغداد #مطاعم_بغداد #دولمة';

const newDraft = (title: string): Draft => ({
  title,
  captured: [],
  tier: 'pro',
  platforms: ['instagram', 'facebook'],
  when: { kind: 'best' },
  promo: 'none',
  promoDays: 5,
  caption: defaultCaption,
});

const initialSaved: Saved = {
  orders: [],
  plan: { active: false, goal: 'orders', reels: 8, tier: 'pro', platforms: ['instagram', 'facebook', 'tiktok'], adBudget: 300000 },
  automation: {
    enabled: false,
    approval: 'ask',
    bestTime: true,
    autoPromote: false,
    autoReply: true,
    escalate: true,
    monthlyCap: 500000,
  },
};

// Spend already recorded this month on the sample account.
const SAMPLE_SPENT = 186000;

const StudioContext = createContext<Studio | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(initialSaved);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<Draft>(newDraft('صوّر صحن الدولمة'));

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as Partial<Saved>;
        setSaved({
          orders: parsed.orders ?? [],
          plan: { ...initialSaved.plan, ...parsed.plan },
          automation: { ...initialSaved.automation, ...parsed.automation },
        });
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

  const spentThisMonth = SAMPLE_SPENT + saved.orders.reduce((sum, o) => sum + o.reelPrice + o.promoCost, 0);

  const value: Studio = {
    ...saved,
    draft,
    spentThisMonth,
    startDraft: (title) => setDraft(newDraft(title)),
    updateDraft: (patch) => setDraft((prev) => ({ ...prev, ...patch })),
    placeOrder: () => {
      const order: Order = {
        id: `R-${Date.now().toString(36).toUpperCase()}`,
        title: draft.title,
        tier: draft.tier,
        platforms: draft.platforms,
        when: draft.when,
        promo: draft.promo,
        promoDays: draft.promoDays,
        reelPrice: reelPrice(draft.tier),
        promoCost: promotionCost(draft.promo, draft.promoDays),
        createdAt: Date.now(),
        status: 'editing',
      };
      setSaved((prev) => ({ ...prev, orders: [order, ...prev.orders] }));
      return order;
    },
    savePlan: (plan) => setSaved((prev) => ({ ...prev, plan })),
    setAutomation: (patch) => setSaved((prev) => ({ ...prev, automation: { ...prev.automation, ...patch } })),
  };

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio(): Studio {
  const studio = useContext(StudioContext);
  if (!studio) throw new Error('useStudio must be used inside StudioProvider');
  return studio;
}
