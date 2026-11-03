import { denied, hasAccess } from '@/server/access';
import { chat, errorResponse, parseJson } from '@/server/ai';
import { readBusiness } from '@/server/input';
import { captionSystem } from '@/server/prompts';

export async function POST(request: Request): Promise<Response> {
  if (!hasAccess(request)) return denied();
  try {
    const body = (await request.json()) as { business?: unknown; title?: unknown; platforms?: unknown; previous?: unknown };
    const title = typeof body.title === 'string' ? body.title.slice(0, 120) : 'A new reel';
    const platforms = Array.isArray(body.platforms) ? body.platforms.filter((p) => typeof p === 'string').join(', ') : 'instagram';
    const previous = typeof body.previous === 'string' ? `\nWrite a version different from this one:\n${body.previous.slice(0, 600)}` : '';
    const raw = await chat(
      [
        { role: 'system', content: captionSystem(readBusiness(body.business)) },
        { role: 'user', content: `Reel idea: ${title}\nPlatforms: ${platforms}${previous}` },
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
