// Server-only: runs inside Expo's API routes on the developer's computer (and
// later on the VPS). The provider key never reaches the phone.
//
// fal.ai is the main provider: Claude through fal's OpenAI-compatible router,
// ElevenLabs for voice. OPENROUTER_API_KEY still works as a fallback.

import { tools } from '@sq/shared';

const FAL_BASE = process.env.FAL_BASE_URL ?? 'https://fal.run';
const OPENROUTER_BASE = process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';

export const textModel = process.env.AI_TEXT_MODEL ?? tools.claude.model!;
export const falVoiceModel = process.env.FAL_VOICE_MODEL ?? tools.elevenlabs.model!;
const openrouterVoiceModel = 'elevenlabs/eleven-v4-turbo';

type Provider = { name: 'fal'; key: string } | { name: 'openrouter'; key: string };

function provider(): Provider | null {
  const fal = process.env.FAL_KEY?.trim();
  if (fal) return { name: 'fal', key: fal };
  const or = process.env.OPENROUTER_API_KEY?.trim();
  if (or) return { name: 'openrouter', key: or };
  return null;
}

export function providerName(): Provider['name'] | null {
  return provider()?.name ?? null;
}

export class AiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function need(): Provider {
  const p = provider();
  if (!p) throw new AiError('No AI key: set FAL_KEY in apps/mobile/.env', 503);
  return p;
}

function headers(p: Provider): Record<string, string> {
  return p.name === 'fal'
    ? { Authorization: `Key ${p.key}`, 'Content-Type': 'application/json' }
    : { Authorization: `Bearer ${p.key}`, 'Content-Type': 'application/json', 'X-Title': 'SQ AI' };
}

// Maps provider failures to what the app can explain: out of credit (402),
// a wrong or under-scoped key (401), or anything else (502).
async function upstreamError(res: Response): Promise<AiError> {
  let detail = '';
  try {
    const body = (await res.json()) as { detail?: unknown; error?: { message?: string } | string };
    detail =
      typeof body.detail === 'string'
        ? body.detail
        : typeof body.error === 'string'
          ? body.error
          : (body.error?.message ?? JSON.stringify(body.detail ?? ''));
  } catch {
    // Non-JSON error bodies carry nothing useful for the app.
  }
  const text = detail.toLowerCase();
  if (res.status === 402 || /balance|credit|exhausted|insufficient|top_up|top up/.test(text)) return new AiError(detail || 'Out of credit', 402);
  if (res.status === 401 || res.status === 403) return new AiError(detail || 'Key rejected', 401);
  return new AiError(detail || `Provider returned ${res.status}`, 502);
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function chat(messages: ChatMessage[], opts: { maxTokens?: number; temperature?: number; model?: string } = {}): Promise<string> {
  const p = need();
  const url = p.name === 'fal' ? `${FAL_BASE}/openrouter/router/openai/v1/chat/completions` : `${OPENROUTER_BASE}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(p),
    body: JSON.stringify({
      model: opts.model ?? textModel,
      messages,
      max_tokens: opts.maxTokens ?? 900,
      temperature: opts.temperature ?? 0.7,
    }),
  });
  if (!res.ok) throw await upstreamError(res);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new AiError('Empty reply from model', 502);
  return text;
}

// Models are told to answer in JSON; this takes the first JSON object out of
// the reply even if the model wrapped it in prose or a code fence.
export function parseJson<T>(text: string): T {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new AiError('Model reply was not JSON', 502);
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    throw new AiError('Model reply was not valid JSON', 502);
  }
}

// Voices offered in the app, by provider. fal uses ElevenLabs voice names.
export const voices = { brian: { fal: 'Brian', openrouter: 'brian' }, sarah: { fal: 'Sarah', openrouter: 'sarah' } } as const;
export type VoiceId = keyof typeof voices;

export async function speech(input: string, voice: VoiceId): Promise<ArrayBuffer> {
  const p = need();
  if (p.name === 'openrouter') {
    const res = await fetch(`${OPENROUTER_BASE}/audio/speech`, {
      method: 'POST',
      headers: headers(p),
      body: JSON.stringify({ model: openrouterVoiceModel, input, voice: voices[voice].openrouter, response_format: 'mp3' }),
    });
    if (!res.ok) throw await upstreamError(res);
    return res.arrayBuffer();
  }
  // fal answers with a link to the generated file; fetch it so the phone
  // only ever talks to our server.
  const res = await fetch(`${FAL_BASE}/${falVoiceModel}`, {
    method: 'POST',
    headers: headers(p),
    body: JSON.stringify({ text: input, voice: voices[voice].fal, language_code: 'ar', output_format: 'mp3_44100_128' }),
  });
  if (!res.ok) throw await upstreamError(res);
  const data = (await res.json()) as { audio?: { url?: string } };
  const url = data.audio?.url;
  if (!url) throw new AiError('No audio in reply', 502);
  const file = await fetch(url);
  if (!file.ok) throw new AiError(`Audio download failed: ${file.status}`, 502);
  return file.arrayBuffer();
}

export function errorResponse(e: unknown): Response {
  const status = e instanceof AiError ? e.status : 500;
  const message = e instanceof Error ? e.message : 'Unknown error';
  return Response.json({ error: message }, { status });
}
