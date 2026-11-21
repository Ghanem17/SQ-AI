import { cleanParams, serviceTools, tierTools, type ServiceTier } from '@sq/shared';
import { denied, hasAccess } from '@/server/access';
import { chat, errorResponse } from '@/server/ai';
import { readBusiness } from '@/server/input';
import { writerSystem } from '@/server/prompts';

const formats = {
  post: 'A post for Instagram and Facebook',
  ad: 'Short sponsored-ad copy with a clear call to order',
  plan: 'A content plan for a full month',
} as const;

// The writer model follows the level the customer paid for. Each can be
// overridden per deployment, e.g. AI_WRITER_HIGH_MODEL.
function writerModel(tier: unknown): string | undefined {
  const level: ServiceTier = tier === 'low' || tier === 'high' ? tier : 'mid';
  const env = { low: process.env.AI_WRITER_LOW_MODEL, mid: process.env.AI_WRITER_MID_MODEL, high: process.env.AI_WRITER_HIGH_MODEL }[level];
  return env || serviceTools[tierTools.writer[level]].model;
}

export async function POST(request: Request): Promise<Response> {
  if (!hasAccess(request)) return denied();
  try {
    const body = (await request.json()) as { business?: unknown; params?: unknown; tier?: unknown; previous?: unknown; instruction?: unknown };
    const p = cleanParams(body.params);
    if (!p || p.kind !== 'copy') return Response.json({ error: 'Bad request' }, { status: 400 });
    // A change rewrites the customer's earlier text instead of starting over.
    const previous = typeof body.previous === 'string' ? body.previous.trim().slice(0, 6000) : '';
    const instruction = typeof body.instruction === 'string' ? body.instruction.trim().slice(0, 600) : '';
    const task = previous
      ? `Task: ${formats[p.format]}\nRewrite the previous text below, applying only the requested change and keeping everything else that still fits.\nRequested change: ${instruction || p.details || 'improve it'}\nPrevious text:\n${previous}`
      : `Task: ${formats[p.format]}\nTopic: ${p.topic}\nDetails: ${p.details || 'none'}`;
    const text = await chat(
      [
        { role: 'system', content: writerSystem(readBusiness(body.business)) },
        { role: 'user', content: task },
      ],
      { maxTokens: p.format === 'plan' ? 2500 : 900, temperature: 0.8, model: writerModel(body.tier) },
    );
    return Response.json({ text: text.trim() });
  } catch (e) {
    return errorResponse(e);
  }
}
