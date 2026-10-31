import { chat, errorResponse, parseJson } from '@/server/openrouter';
import { readBusiness, readMessages } from '@/server/input';
import { assistantSystem } from '@/server/prompts';

type Reply = {
  text?: string;
  ideas?: { title: string; hook: string; why: string }[];
  shots?: { title: string; hint: string; seconds: number; angle: string }[];
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { business?: unknown; messages?: unknown };
    const messages = readMessages(body.messages);
    if (messages.length === 0) return Response.json({ error: 'No message' }, { status: 400 });
    const raw = await chat([{ role: 'system', content: assistantSystem(readBusiness(body.business)) }, ...messages], { maxTokens: 1200 });
    const reply = parseJson<Reply>(raw);
    return Response.json({
      text: typeof reply.text === 'string' ? reply.text : '',
      ideas: Array.isArray(reply.ideas) ? reply.ideas.slice(0, 3) : undefined,
      shots: Array.isArray(reply.shots)
        ? reply.shots.slice(0, 6).map((s) => ({ ...s, seconds: Math.min(6, Math.max(2, Math.round(Number(s.seconds) || 3))) }))
        : undefined,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
