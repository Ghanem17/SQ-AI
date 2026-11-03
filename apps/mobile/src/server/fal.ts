// Server-only: fal's queue, storage and pricing APIs. Only endpoints listed
// in the service tools can be called, and only fal URLs are followed, so the
// routes cannot be used to reach anything else with the account's key.

import { serviceTools, type ServiceToolKey } from '@sq/shared';
import { AiError } from './ai';

const QUEUE = process.env.FAL_QUEUE_URL ?? 'https://queue.fal.run';
const REST = process.env.FAL_REST_URL ?? 'https://rest.fal.ai';
const PLATFORM = process.env.FAL_PLATFORM_URL ?? 'https://api.fal.ai';

function key(): string {
  const k = process.env.FAL_KEY?.trim();
  if (!k) throw new AiError('No AI key: set FAL_KEY', 503);
  return k;
}

function headers(): Record<string, string> {
  return { Authorization: `Key ${key()}`, 'Content-Type': 'application/json' };
}

async function fail(res: Response): Promise<AiError> {
  let detail = '';
  try {
    const body = (await res.json()) as { detail?: unknown };
    detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail ?? '');
  } catch {
    // Non-JSON error bodies carry nothing useful for the app.
  }
  const text = detail.toLowerCase();
  if (res.status === 402 || /balance|top_up|exhausted|insufficient/.test(text)) return new AiError(detail || 'Out of credit', 402);
  if (res.status === 401 || res.status === 403) return new AiError(detail || 'Key rejected', 401);
  if (res.status === 422) return new AiError(detail || 'Invalid input', 422);
  return new AiError(detail || `fal returned ${res.status}`, 502);
}

// Tools that run as queued jobs (Claude runs through the chat route).
const jobTools: ServiceToolKey[] = ['image', 'klingVideo', 'veoVideo', 'captions', 'music', 'voice', 'trim', 'mergeAudio'];

export function isJobTool(tool: unknown): tool is ServiceToolKey {
  return typeof tool === 'string' && (jobTools as string[]).includes(tool);
}

export async function submitJob(tool: ServiceToolKey, input: Record<string, unknown>) {
  const res = await fetch(`${QUEUE}/${serviceTools[tool].endpoint}`, { method: 'POST', headers: headers(), body: JSON.stringify(input) });
  if (!res.ok) throw await fail(res);
  const data = (await res.json()) as { request_id?: string; status_url?: string; response_url?: string };
  if (!data.request_id || !data.status_url || !data.response_url) throw new AiError('fal did not queue the job', 502);
  return { requestId: data.request_id, statusUrl: data.status_url, responseUrl: data.response_url };
}

function falUrl(u: unknown): string {
  if (typeof u !== 'string') throw new AiError('Bad job link', 400);
  const url = new URL(u);
  const queue = new URL(QUEUE);
  if (url.protocol !== queue.protocol || url.host !== queue.host) throw new AiError('Bad job link', 400);
  return url.toString();
}

export type JobState = { status: 'queued' | 'running' | 'done' | 'failed'; result?: unknown; error?: string };

export async function pollJob(statusUrl: unknown, responseUrl: unknown): Promise<JobState> {
  const res = await fetch(falUrl(statusUrl), { headers: headers() });
  if (!res.ok) throw await fail(res);
  const s = (await res.json()) as { status?: string; error?: string };
  if (s.status === 'IN_QUEUE') return { status: 'queued' };
  if (s.status === 'IN_PROGRESS') return { status: 'running' };
  if (s.status !== 'COMPLETED') return { status: 'failed', error: s.error ?? s.status ?? 'unknown' };
  const out = await fetch(falUrl(responseUrl), { headers: headers() });
  if (!out.ok) {
    const e = await fail(out);
    return { status: 'failed', error: e.message };
  }
  return { status: 'done', result: await out.json() };
}

// A one-time upload link: the phone sends the file straight to fal storage.
export async function uploadLink(fileName: string, contentType: string) {
  const res = await fetch(`${REST}/storage/upload/initiate?storage_type=fal-cdn-v3`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ content_type: contentType, file_name: fileName }),
  });
  if (!res.ok) throw await fail(res);
  const data = (await res.json()) as { upload_url?: string; file_url?: string };
  if (!data.upload_url || !data.file_url) throw new AiError('fal did not return an upload link', 502);
  return { uploadUrl: data.upload_url, fileUrl: data.file_url };
}

// fal's current list price per unit for each service tool, in dollars.
export async function livePrices(): Promise<Partial<Record<ServiceToolKey, number>>> {
  const tools = Object.values(serviceTools);
  const query = tools.map((t) => `endpoint_id=${encodeURIComponent(t.endpoint)}`).join('&');
  const res = await fetch(`${PLATFORM}/v1/models/pricing?${query}`, { headers: headers() });
  if (!res.ok) throw await fail(res);
  const data = (await res.json()) as { prices?: { endpoint_id: string; unit_price: number }[] };
  const out: Partial<Record<ServiceToolKey, number>> = {};
  for (const p of data.prices ?? []) {
    const tool = tools.find((t) => t.endpoint === p.endpoint_id);
    if (tool && typeof p.unit_price === 'number') out[tool.key] = p.unit_price;
  }
  return out;
}
