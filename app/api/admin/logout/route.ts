import { assertSameOrigin, ok, route } from '@/lib/http';
import { endAdminSession } from '@/lib/auth/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = route(async (request: Request) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  // Unconditional: clearing a cookie is safe whether or not a session existed.
  await endAdminSession();
  return ok({ signedOut: true });
});
