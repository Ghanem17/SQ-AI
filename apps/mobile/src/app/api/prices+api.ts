import { denied, hasAccess } from '@/server/access';
import { errorResponse } from '@/server/ai';
import { livePrices } from '@/server/fal';

// fal rate-limits its pricing API, so prices are kept for an hour per server
// instance; a failed refresh keeps serving the last good prices.
const TTL_MS = 60 * 60 * 1000;
let cached: { at: number; prices: Awaited<ReturnType<typeof livePrices>> } | null = null;

// fal's current per-unit prices for the service tools, in dollars.
export async function GET(request: Request): Promise<Response> {
  if (!hasAccess(request)) return denied();
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return Response.json({ prices: cached.prices });
  try {
    const prices = await livePrices();
    cached = { at: now, prices };
    return Response.json({ prices });
  } catch (e) {
    if (cached) return Response.json({ prices: cached.prices });
    return errorResponse(e);
  }
}
