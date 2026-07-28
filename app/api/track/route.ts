import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { ok, parseBody, route } from '@/lib/http';
import { clientIp, hashIp } from '@/lib/rate-limit';
import { isProduction } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_COOKIE = 'mj_sid';
const SESSION_TTL_SECONDS = 60 * 30; // 30 minutes of inactivity ends the session

const schema = z.object({
  path: z.string().min(1).max(512),
  referrer: z.string().max(1024).nullable().optional(),
});

/**
 * Page-view ingest.
 *
 * Privacy: no raw IP is ever stored. `visitorHash` is a salted SHA-256 of
 * IP + user agent, which is enough to count unique visitors but can't be
 * reversed into an identity. No cross-site tracking, no third-party pixels.
 *
 * Deliberately unauthenticated (it has to be — it tracks anonymous visitors),
 * so treat the numbers as best-effort rather than tamper-proof.
 */
export const POST = route(async (request: Request) => {
  const parsed = await parseBody(request, schema);
  // Never surface validation errors to the storefront; just drop bad payloads.
  if (parsed.error) return ok({ tracked: false });

  try {
    const store = await cookies();
    let sessionId = store.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      sessionId = randomUUID();
    }
    // Re-set on every view so the 30-minute window slides with activity.
    store.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });

    const userAgent = request.headers.get('user-agent') ?? '';

    // Skip obvious crawlers so the dashboard reflects real people.
    if (/bot|crawler|spider|crawling|preview|facebookexternalhit|slurp/i.test(userAgent)) {
      return ok({ tracked: false });
    }

    await prisma.pageView.create({
      data: {
        path: parsed.data.path.slice(0, 512),
        sessionId,
        visitorHash: hashIp(`${clientIp(request.headers)}|${userAgent}`),
        referrer: parsed.data.referrer?.slice(0, 1024) ?? null,
        userAgent: userAgent.slice(0, 512),
      },
    });

    return ok({ tracked: true });
  } catch (error) {
    console.error('[track] Failed to record page view:', error);
    // Analytics failures must never surface to the shopper.
    return ok({ tracked: false });
  }
});
