import type { Business } from './prompts';
import type { ChatMessage } from './ai';

// Request bodies come from the app; keep them small and well-formed before
// they cost anything upstream.
export function readBusiness(raw: unknown): Business {
  const b = (raw ?? {}) as { name?: unknown; kind?: unknown; info?: unknown; lang?: unknown };
  const lang = b.lang === 'en' ? 'en' : 'ar';
  const name = typeof b.name === 'string' && b.name.trim() ? b.name.trim().slice(0, 60) : lang === 'ar' ? 'حسابي' : 'My account';
  const info = typeof b.info === 'string' ? b.info.trim().slice(0, 2000) : '';
  return { name, kind: b.kind === 'creator' ? 'creator' : 'shop', info, lang };
}

export function readMessages(raw: unknown, max = 16): Exclude<ChatMessage, { role: 'system' }>[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is { role: 'user' | 'assistant'; content: string } => {
      const x = m as { role?: unknown; content?: unknown };
      return (x.role === 'user' || x.role === 'assistant') && typeof x.content === 'string' && x.content.trim().length > 0;
    })
    .slice(-max)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1200) }));
}
