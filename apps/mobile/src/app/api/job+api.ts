import { denied, hasAccess } from '@/server/access';
import { errorResponse } from '@/server/ai';
import { isJobTool, pollJob, submitJob } from '@/server/fal';

// Starts a fal job for one service tool, or checks on one already started.
export async function POST(request: Request): Promise<Response> {
  if (!hasAccess(request)) return denied();
  try {
    const body = (await request.json()) as { action?: unknown; tool?: unknown; input?: unknown; statusUrl?: unknown; responseUrl?: unknown };
    if (body.action === 'poll') return Response.json(await pollJob(body.statusUrl, body.responseUrl));
    if (body.action !== 'submit' || !isJobTool(body.tool)) return Response.json({ error: 'Bad request' }, { status: 400 });
    const input = body.input && typeof body.input === 'object' ? (body.input as Record<string, unknown>) : {};
    if (JSON.stringify(input).length > 20000) return Response.json({ error: 'Input too large' }, { status: 400 });
    return Response.json(await submitJob(body.tool, input));
  } catch (e) {
    return errorResponse(e);
  }
}
