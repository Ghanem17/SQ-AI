import { denied, hasAccess } from '@/server/access';
import { errorResponse, speech, voices, type VoiceId } from '@/server/ai';

// GET so the audio player can stream it straight from a URL.
export async function GET(request: Request): Promise<Response> {
  if (!hasAccess(request)) return denied();
  try {
    const url = new URL(request.url);
    const text = (url.searchParams.get('text') ?? '').trim().slice(0, 400);
    const asked = url.searchParams.get('voice') ?? 'brian';
    if (!text) return Response.json({ error: 'No text' }, { status: 400 });
    const voice: VoiceId = asked in voices ? (asked as VoiceId) : 'brian';
    const audio = await speech(text, voice);
    return new Response(audio, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=3600' } });
  } catch (e) {
    return errorResponse(e);
  }
}
