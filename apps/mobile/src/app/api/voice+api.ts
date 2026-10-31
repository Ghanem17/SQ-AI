import { errorResponse, speech } from '@/server/openrouter';

const voices = new Set(['adam', 'george', 'brian', 'daniel', 'sarah', 'alice', 'lily', 'matilda']);

// GET so the audio player can stream it straight from a URL.
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const text = (url.searchParams.get('text') ?? '').trim().slice(0, 400);
    const voice = url.searchParams.get('voice') ?? 'adam';
    if (!text) return Response.json({ error: 'No text' }, { status: 400 });
    const audio = await speech(text, voices.has(voice) ? voice : 'adam');
    return new Response(audio, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=3600' } });
  } catch (e) {
    return errorResponse(e);
  }
}
