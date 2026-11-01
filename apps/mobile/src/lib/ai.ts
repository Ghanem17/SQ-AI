// App-side calls to the SQ API routes. During development the routes run on
// the computer that serves the app, so the phone reaches them through the
// same address Expo Go loaded the app from.

import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useSession } from '@/state/session';

export function apiBase(): string {
  if (Platform.OS === 'web') return '';
  const host = Constants.expoConfig?.hostUri;
  if (!host) return '';
  // LAN addresses carry a port and plain http; tunnels are https on 443.
  return /:\d+$/.test(host) ? `http://${host}` : `https://${host}`;
}

export class AiUnavailable extends Error {
  constructor(
    readonly reason: 'noKey' | 'badKey' | 'credit' | 'network' | 'failed',
    message: string,
  ) {
    super(message);
  }
}

export const unavailableText: Record<AiUnavailable['reason'], string> = {
  noKey: 'الذكاء الاصطناعي غير مربوط بعد: أضف مفتاح fal على الكمبيوتر.',
  badKey: 'مفتاح fal غير صحيح أو ليس له صلاحية تشغيل النماذج.',
  credit: 'رصيد fal انتهى. اشحن الرصيد من fal.ai ثم جرّب.',
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
      headers: { 'Content-Type': 'application/json' },
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
  if (!res.ok) throw new AiUnavailable('failed', `status ${res.status}`);
  return (await res.json()) as T;
}

export function voiceUrl(text: string, voice = 'brian'): string {
  return `${apiBase()}/api/voice?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(text)}`;
}

export type AiStatus = 'checking' | 'online' | 'offline';

let cached: AiStatus | null = null;

// Whether the routes are reachable and have a key. Checked once per launch.
export function useAiStatus(): AiStatus {
  const [status, setStatus] = useState<AiStatus>(cached ?? 'checking');
  useEffect(() => {
    if (cached) return;
    let alive = true;
    fetch(`${apiBase()}/api/status`)
      .then((r) => (r.ok ? (r.json() as Promise<{ ai?: boolean }>) : { ai: false }))
      .then((d) => {
        cached = d.ai ? 'online' : 'offline';
        if (alive) setStatus(cached);
      })
      .catch(() => {
        cached = 'offline';
        if (alive) setStatus('offline');
      });
    return () => {
      alive = false;
    };
  }, []);
  return status;
}

export function useBusiness() {
  const { displayName, accountType } = useSession();
  return {
    name: displayName ?? (accountType === 'creator' ? 'نور' : 'مطعم بيت الريف'),
    kind: accountType === 'creator' ? ('creator' as const) : ('shop' as const),
  };
}
