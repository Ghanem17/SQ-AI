import { denied, hasAccess } from '@/server/access';
import { errorResponse } from '@/server/ai';
import { uploadLink } from '@/server/fal';

const allowed = /^(video\/(mp4|quicktime|webm)|image\/(jpeg|png|webp|heic))$/;

// Returns a one-time link the phone uploads the customer's file to.
export async function POST(request: Request): Promise<Response> {
  if (!hasAccess(request)) return denied();
  try {
    const body = (await request.json()) as { fileName?: unknown; contentType?: unknown };
    const contentType = typeof body.contentType === 'string' ? body.contentType : '';
    if (!allowed.test(contentType)) return Response.json({ error: 'Unsupported file type' }, { status: 400 });
    const fileName = (typeof body.fileName === 'string' ? body.fileName : 'upload').replace(/[^\w.-]/g, '_').slice(0, 80);
    return Response.json(await uploadLink(fileName, contentType));
  } catch (e) {
    return errorResponse(e);
  }
}
