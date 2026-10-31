// Server-only: runs inside Expo's API routes on the developer's computer (and
// later on the VPS). The OpenRouter key never reaches the phone.

import { tools } from '@sq/shared';

const BASE = process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';

export const textModel = process.env.OPENROUTER_TEXT_MODEL ?? tools.claude.model!;
export const voiceModel = process.env.OPENROUTER_VOICE_MODEL ?? tools.elevenlabs.model!;

export function hasKey(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export class AiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function headers(): Record<string, string> {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) throw new AiError('OPENROUTER_API_KEY is not set', 503);
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://samaqasioun.com',
    'X-Title': 'SQ AI',
  };
}

async function upstreamError(res: Response): Promise<AiError> {
  let detail = '';
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    detail = body.error?.message ?? '';
  } catch {
    // Non-JSON error bodies carry nothing useful for the app.
  }
  // 402 means the key is out of credit; pass it on so the app can say so.
  return new AiError(detail || `OpenRouter returned ${res.status}`, res.status === 402 ? 402 : 502);
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function chat(messages: ChatMessage[], opts: { maxTokens?: number; temperature?: number } = {}): Promise<string> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model: textModel,
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

export async function speech(input: string, voice: string): Promise<ArrayBuffer> {
  const res = await fetch(`${BASE}/audio/speech`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ model: voiceModel, input, voice, response_format: 'mp3' }),
  });
  if (!res.ok) throw await upstreamError(res);
  return res.arrayBuffer();
}

export function errorResponse(e: unknown): Response {
  const status = e instanceof AiError ? e.status : 500;
  const message = e instanceof Error ? e.message : 'Unknown error';
  return Response.json({ error: message }, { status });
}
