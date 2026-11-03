import { cleanParams } from '@sq/shared';
import { denied, hasAccess } from '@/server/access';
import { chat, errorResponse, parseJson } from '@/server/ai';
import { readBusiness, readMessages } from '@/server/input';
import { plannerSystem } from '@/server/prompts';

type Reply = { reply?: string; ready?: boolean; title?: string; params?: unknown };

// Understands a one-off request and returns runnable parameters. The app
// turns them into tools, quantities and a price.
export async function POST(request: Request): Promise<Response> {
  if (!hasAccess(request)) return denied();
  try {
    const body = (await request.json()) as { business?: unknown; messages?: unknown; media?: unknown };
    const messages = readMessages(body.messages, 20);
    if (messages.length === 0) return Response.json({ error: 'No message' }, { status: 400 });
    const m = body.media as { kind?: unknown; seconds?: unknown } | null | undefined;
    const media = m && (m.kind === 'video' || m.kind === 'image') ? { kind: m.kind as 'video' | 'image', seconds: Number(m.seconds) || 0 } : null;
    const raw = await chat([{ role: 'system', content: plannerSystem(readBusiness(body.business), media) }, ...messages], { maxTokens: 1200, temperature: 0.4 });
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
