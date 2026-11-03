import { denied, hasAccess } from '@/server/access';
import { chat, errorResponse, parseJson } from '@/server/ai';
import { readBusiness, readMessages } from '@/server/input';
import { replySystem } from '@/server/prompts';

type Reply = { text?: string; order?: { items: string; total: number; area: string }; escalate?: boolean };

export async function POST(request: Request): Promise<Response> {
  if (!hasAccess(request)) return denied();
  try {
    const body = (await request.json()) as { business?: unknown; messages?: unknown };
    const messages = readMessages(body.messages, 20);
    if (messages.length === 0) return Response.json({ error: 'No message' }, { status: 400 });
    const raw = await chat([{ role: 'system', content: replySystem(readBusiness(body.business)) }, ...messages], { maxTokens: 500, temperature: 0.4 });
    const reply = parseJson<Reply>(raw);
    const order = reply.order && typeof reply.order.items === 'string' ? { items: reply.order.items, total: Number(reply.order.total) || 0, area: String(reply.order.area ?? '') } : undefined;
    return Response.json({ text: reply.text ?? '', order, escalate: reply.escalate === true });
  } catch (e) {
    return errorResponse(e);
  }
}
