// App-side calls to the SQ API routes. During development the routes run on
// the computer that serves the app, so the phone reaches them through the
// same address Expo Go loaded the app from.

import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { accessHeaders, setAccessCode } from '@/lib/access';
import { useSession } from '@/state/session';

// Installed builds talk to the hosted server; Expo Go talks to the computer
// that serves the app.
const hosted = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export function apiBase(): string {
  if (Platform.OS === 'web') return '';
  if (hosted) return hosted;
  const host = Constants.expoConfig?.hostUri;
  if (!host) return '';
  // LAN addresses carry a port and plain http; tunnels are https on 443.
  return /:\d+$/.test(host) ? `http://${host}` : `https://${host}`;
}

export class AiUnavailable extends Error {
  constructor(
    readonly reason: 'noKey' | 'badKey' | 'credit' | 'access' | 'network' | 'failed',
    message: string,
  ) {
    super(message);
  }
}

export const unavailableText: Record<AiUnavailable['reason'], string> = {
  noKey: 'الذكاء الاصطناعي غير متاح الآن. جرّب بعد قليل.',
  badKey: 'خدمة الذكاء الاصطناعي متوقفة مؤقتًا. أبلغ صاحب الحساب.',
  credit: 'رصيد الذكاء الاصطناعي انتهى. يحتاج صاحب الحساب لشحن رصيد fal.',
  access: 'أدخل رمز الوصول من الإعدادات لتشغيل الذكاء الاصطناعي.',
  network: 'تعذر الاتصال بالكمبيوتر الذي يشغّل التطبيق.',
  failed: 'لم يكتمل الطلب. جرّب مرة أخرى.',
};

export async function postJson<T>(path: string, body: unknown, timeoutMs = 60000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...accessHeaders() },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new AiUnavailable('network', 'network');
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 503) throw new AiUnavailable('noKey', 'no key');
  if (res.status === 402) throw new AiUnavailable('credit', 'credit');
  if (res.status === 401) throw new AiUnavailable('badKey', 'bad key');
  if (res.status === 403) throw new AiUnavailable('access', 'access');
  if (!res.ok) throw new AiUnavailable('failed', `status ${res.status}`);
  return (await res.json()) as T;
}

export function voiceSource(text: string, voice = 'brian') {
  return { uri: `${apiBase()}/api/voice?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(text)}`, headers: accessHeaders() };
}

export type AiStatus = 'checking' | 'online' | 'offline' | 'locked';

// Checked once per access code per launch.
const statusByCode = new Map<string, AiStatus>();

// Whether the routes are reachable, have a provider key, and accept this
// tester's access code.
export function useAiStatus(): AiStatus {
  const { accessCode: code } = useSession();
  const [result, setResult] = useState<{ code: string; status: AiStatus } | null>(null);
  const known = statusByCode.get(code);

  useEffect(() => {
    if (statusByCode.has(code)) return;
    let alive = true;
    setAccessCode(code);
    fetch(`${apiBase()}/api/status`, { headers: accessHeaders() })
      .then((r) => (r.ok ? (r.json() as Promise<{ ai?: boolean; access?: boolean }>) : { ai: false, access: true }))
      .then((d): AiStatus => (!d.ai ? 'offline' : d.access === false ? 'locked' : 'online'))
      .catch((): AiStatus => 'offline')
      .then((status) => {
        statusByCode.set(code, status);
        if (alive) setResult({ code, status });
      });
    return () => {
      alive = false;
    };
  }, [code]);

  return known ?? (result?.code === code ? result.status : 'checking');
}

export function useBusiness() {
  const { displayName, accountType, businessInfo } = useSession();
  return {
    name: displayName ?? 'حسابي',
    kind: accountType === 'creator' ? ('creator' as const) : ('shop' as const),
    info: businessInfo,
  };
}
