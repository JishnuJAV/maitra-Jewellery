import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db';
import { serverEnv } from '@/lib/env';

/**
 * Database-backed sliding-window rate limiter.
 *
 * Deliberately not in-memory: on Vercel each request may hit a different (or
 * cold) instance, so a module-level Map would reset constantly and an attacker
 * could bypass the limit just by generating load. Postgres is the only state
 * every instance agrees on.
 */

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export async function rateLimit(
  bucket: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000);

  const [hits] = await Promise.all([
    prisma.rateLimitHit.count({ where: { bucket, createdAt: { gte: windowStart } } }),
    // Opportunistic cleanup so the table doesn't grow without bound.
    prisma.rateLimitHit
      .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
      .catch(() => undefined),
  ]);

  if (hits >= limit) {
    const oldest = await prisma.rateLimitHit.findFirst({
      where: { bucket, createdAt: { gte: windowStart } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    const retryAfterSeconds = oldest
      ? Math.max(1, Math.ceil((oldest.createdAt.getTime() + windowSeconds * 1000 - Date.now()) / 1000))
      : windowSeconds;
    return { ok: false, remaining: 0, retryAfterSeconds };
  }

  await prisma.rateLimitHit.create({ data: { bucket } });
  return { ok: true, remaining: Math.max(0, limit - hits - 1), retryAfterSeconds: 0 };
}

/** Clears a bucket — call after a successful login so honest users aren't punished. */
export async function resetRateLimit(bucket: string) {
  await prisma.rateLimitHit.deleteMany({ where: { bucket } });
}

/**
 * Best-effort client IP. Vercel sets x-forwarded-for; the leftmost entry is the
 * client. Header values are attacker-controllable in general, so this is only
 * ever used hashed, for rate limiting and analytics — never for authorisation.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return headers.get('x-real-ip')?.trim() || 'unknown';
}

/** One-way hash so raw IP addresses are never written to the database. */
export function hashIp(ip: string): string {
  return createHash('sha256').update(`${serverEnv.analyticsSalt}:${ip}`).digest('hex').slice(0, 32);
}
