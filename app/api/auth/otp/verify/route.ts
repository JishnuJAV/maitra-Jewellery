import { assertSameOrigin, fail, ok, parseBody, route } from '@/lib/http';
import { startCustomerSession, verifyOtp } from '@/lib/auth/otp';
import { verifyOtpSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = route(async (request: Request) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const parsed = await parseBody(request, verifyOtpSchema);
  if (parsed.error) return parsed.error;

  const result = await verifyOtp(parsed.data.phone, parsed.data.code);
  if (!result.ok) return fail(result.message, 401);

  await startCustomerSession({ id: result.customerId, phone: result.phone });

  return ok({ signedIn: true, phone: result.phone, isNewCustomer: result.isNewCustomer });
});
