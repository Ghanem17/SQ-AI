import { cleanParams, serviceOrder } from '@sq/shared';
import { denied, hasAccess } from '@/server/access';
import { chat, errorResponse, parseJson } from '@/server/ai';
import { readBusiness, readMessages } from '@/server/input';
import { plannerSystem, reviseSystem } from '@/server/prompts';

type Reply = { reply?: string; ready?: boolean; title?: string; params?: unknown };

// A change to a finished result: new parameters for the SAME service, worked
// out from the previous ones, a short note on the result, and the change.
async function revise(body: { business?: unknown; parent?: unknown; instruction?: unknown }): Promise<Response> {
  const parent = (body.parent ?? {}) as { kind?: unknown; params?: unknown; result?: unknown };
  const kind = serviceOrder.find((k) => k === parent.kind);
  const previous = cleanParams(parent.params);
  const instruction = typeof body.instruction === 'string' ? body.instruction.trim().slice(0, 600) : '';
  if (!kind || !previous || previous.kind !== kind || !instruction) return Response.json({ error: 'Bad request' }, { status: 400 });
  const result = typeof parent.result === 'string' ? parent.result.slice(0, 2000) : '';
  const raw = await chat(
    [
      { role: 'system', content: reviseSystem(readBusiness(body.business), kind, previous, result) },
      { role: 'user', content: instruction },
    ],
    { maxTokens: 1200, temperature: 0.3 },
  );
  const reply = parseJson<Reply>(raw);
  const cleaned = reply.ready ? cleanParams(reply.params) : null;
  // The change must stay the same service.
  const params = cleaned && cleaned.kind === kind ? cleaned : null;
  return Response.json({
    reply: typeof reply.reply === 'string' ? reply.reply : '',
    ready: Boolean(params),
    title: typeof reply.title === 'string' ? reply.title.slice(0, 80) : '',
    params,
  });
}

// Understands a one-off request and returns runnable parameters. The app
// turns them into tools, quantities and a price.
export async function POST(request: Request): Promise<Response> {
  if (!hasAccess(request)) return denied();
  try {
    const body = (await request.json()) as { business?: unknown; messages?: unknown; media?: unknown; service?: unknown; mode?: unknown; parent?: unknown; instruction?: unknown };
    if (body.mode === 'revise') return await revise(body);
    const messages = readMessages(body.messages, 20);
    if (messages.length === 0) return Response.json({ error: 'No message' }, { status: 400 });
    const m = body.media as { kind?: unknown; seconds?: unknown; count?: unknown } | null | undefined;
    const media =
      m && (m.kind === 'video' || m.kind === 'image')
        ? { kind: m.kind as 'video' | 'image', seconds: Number(m.seconds) || 0, count: Math.max(1, Math.min(10, Number(m.count) || 1)) }
        : null;
    // The service the customer picked in the app, if any.
    const service = serviceOrder.find((k) => k === body.service) ?? null;
    const raw = await chat([{ role: 'system', content: plannerSystem(readBusiness(body.business), media, service) }, ...messages], { maxTokens: 1200, temperature: 0.4 });
    const reply = parseJson<Reply>(raw);
    const params = reply.ready ? cleanParams(reply.params) : null;
    return Response.json({
      reply: typeof reply.reply === 'string' ? reply.reply : '',
      ready: Boolean(params),
      title: typeof reply.title === 'string' ? reply.title.slice(0, 80) : '',
      params,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
