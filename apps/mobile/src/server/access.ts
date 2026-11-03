// Server-only gate in front of every AI route. When APP_ACCESS_CODE is set
// (on the hosted server), only requests carrying that code reach fal, so a
// stranger who finds the URL cannot spend the account's credit. Without it
// (a developer's own computer) every request passes.

const HEADER = 'x-sq-access';

function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function accessRequired(): boolean {
  return Boolean(process.env.APP_ACCESS_CODE?.trim());
}

export function hasAccess(request: Request): boolean {
  const code = process.env.APP_ACCESS_CODE?.trim();
  if (!code) return true;
  const sent = request.headers.get(HEADER) ?? new URL(request.url).searchParams.get('access') ?? '';
  return same(sent.trim(), code);
}

export function denied(): Response {
  return Response.json({ error: 'Access code required' }, { status: 403 });
}
