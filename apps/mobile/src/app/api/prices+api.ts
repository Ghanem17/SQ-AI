import { denied, hasAccess } from '@/server/access';
import { errorResponse } from '@/server/ai';
import { livePrices } from '@/server/fal';

// fal's current per-unit prices for the service tools, in dollars.
export async function GET(request: Request): Promise<Response> {
  if (!hasAccess(request)) return denied();
  try {
    return Response.json({ prices: await livePrices() });
  } catch (e) {
    return errorResponse(e);
  }
}
