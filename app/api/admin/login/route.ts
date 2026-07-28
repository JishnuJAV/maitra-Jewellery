import { z } from 'zod';
import { assertSameOrigin, fail, ok, parseBody, route } from '@/lib/http';
import { authenticateAdmin, startAdminSession } from '@/lib/auth/admin';
import { clientIp, hashIp, rateLimit, resetRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
// Never cache an authentication endpoint.
export const dynamic = 'force-dynamic';

const schema = z.object({
  username: z.string().min(1, 'Username is required').max(120),
  password: z.string().min(1, 'Password is required').max(200),
});

/** 8 attempts per 15 minutes per IP — slow enough to make brute force impractical. */
const LOGIN_LIMIT = { limit: 8, windowSeconds: 15 * 60 };

export const POST = route(async (request: Request) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const parsed = await parseBody(request, schema);
  if (parsed.error) return parsed.error;

  const ipHash = hashIp(clientIp(request.headers));
  const bucket = `admin-login:${ipHash}`;

  const limit = await rateLimit(bucket, LOGIN_LIMIT);
  if (!limit.ok) {
    return fail(
      `Too many sign-in attempts. Please try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).`,
      429,
      { retryAfterSeconds: limit.retryAfterSeconds },
    );
  }

  const admin = await authenticateAdmin(parsed.data.username, parsed.data.password);
  if (!admin) {
    // Deliberately vague: revealing which half was wrong helps an attacker
    // confirm valid usernames.
    return fail('Incorrect username or password.', 401);
  }

  await resetRateLimit(bucket);
  await startAdminSession(admin);

  return ok({ username: admin.username, name: admin.name });
});
