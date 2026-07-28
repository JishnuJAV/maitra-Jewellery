import { assertSameOrigin, fail, ok, parseBody, route } from '@/lib/http';
import { sendOtp } from '@/lib/auth/otp';
import { clientIp, hashIp } from '@/lib/rate-limit';
import { sendOtpSchema } from '@/lib/validation';
import { maskPhone } from '@/lib/phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = route(async (request: Request) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const parsed = await parseBody(request, sendOtpSchema);
  if (parsed.error) return parsed.error;

  const { phone } = parsed.data;
  const result = await sendOtp(phone, hashIp(clientIp(request.headers)));

  if (!result.ok) {
    return fail(result.message, result.retryAfterSeconds ? 429 : 400, {
      retryAfterSeconds: result.retryAfterSeconds,
    });
  }

  return ok({
    sent: true,
    maskedPhone: maskPhone(phone),
    // Present only when OTP_PROVIDER=console (development). sendOtpSms refuses
    // to run the console provider in production, so this can never leak live.
    devCode: result.devCode,
  });
});
