import { assertSameOrigin, ok, route } from '@/lib/http';
import { endCustomerSession } from '@/lib/auth/otp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = route(async (request: Request) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  await endCustomerSession();
  return ok({ signedOut: true });
});
