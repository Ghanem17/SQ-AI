import { chat, errorResponse, parseJson } from '@/server/openrouter';
import { readBusiness } from '@/server/input';
import { captionSystem } from '@/server/prompts';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { business?: unknown; title?: unknown; platforms?: unknown; previous?: unknown };
    const title = typeof body.title === 'string' ? body.title.slice(0, 120) : 'ريل جديد';
    const platforms = Array.isArray(body.platforms) ? body.platforms.filter((p) => typeof p === 'string').join('، ') : 'إنستغرام';
    const previous = typeof body.previous === 'string' ? `\nاكتب نسخة مختلفة عن هذه:\n${body.previous.slice(0, 600)}` : '';
    const raw = await chat(
      [
        { role: 'system', content: captionSystem(readBusiness(body.business)) },
        { role: 'user', content: `فكرة الريل: ${title}\nالمنصات: ${platforms}${previous}` },
      ],
      { maxTokens: 400, temperature: 0.9 },
    );
    const { caption } = parseJson<{ caption?: string }>(raw);
    if (!caption) return Response.json({ error: 'Empty caption' }, { status: 502 });
    return Response.json({ caption });
  } catch (e) {
    return errorResponse(e);
  }
}
