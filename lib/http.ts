import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';

/** Standard JSON success response. */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** Standard JSON error response. Message is safe to show to the user. */
export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/**
 * Rejects cross-site requests to cookie-authenticated mutations.
 *
 * Session cookies are SameSite=Lax, which already blocks cross-site POSTs from
 * forms, but Lax does not cover every case (and browsers vary). Comparing Origin
 * against Host is a cheap, stateless second line of defence against CSRF —
 * cheaper and less error-prone than issuing and tracking CSRF tokens.
 */
export function assertSameOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get('origin');

  // Same-origin fetch() from our own pages always sends Origin. A missing Origin
  // on a state-changing request means a non-browser client or an old browser —
  // reject rather than guess.
  if (!origin) {
    return fail('Missing Origin header. This request was blocked for security reasons.', 403);
  }

  const host = request.headers.get('host');
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return fail('Malformed Origin header.', 403);
  }

  if (!host || originHost !== host) {
    return fail('Cross-origin request blocked.', 403);
  }
  return null;
}

export type ParseResult<T> = { data: T; error: null } | { data: null; error: NextResponse };

/** Parses and validates a JSON body, turning Zod issues into a readable message. */
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { data: null, error: fail('Request body must be valid JSON.') };
  }

  try {
    return { data: schema.parse(raw), error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues
        .map((issue) => {
          const path = issue.path.join('.');
          return path ? `${path}: ${issue.message}` : issue.message;
        })
        .join('; ');
      return { data: null, error: fail(message, 422) };
    }
    return { data: null, error: fail('Invalid request body.') };
  }
}

/** Prisma's "can't reach database server" code. */
function isDatabaseUnreachable(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P1001'
  );
}

/**
 * Turns an unexpected exception into a safe JSON response.
 *
 * Stack traces, SQL and connection strings must never reach the client, so
 * everything collapses to a generic message — except an unreachable database,
 * which gets its own status and a message that actually tells you what to do.
 * That case is common enough during setup that a generic 500 wastes real time.
 */
export function routeError(error: unknown): NextResponse {
  if (isDatabaseUnreachable(error)) {
    console.error('[api] Database unreachable:', error);
    return fail(
      'Cannot reach the database. If you are setting the site up, configure DATABASE_URL in .env.local and run "npm run db:migrate && npm run seed" (see DEPLOYMENT.md).',
      503,
    );
  }

  console.error('[api] Unhandled route error:', error);
  return fail('Something went wrong. Please try again.', 500);
}

/**
 * Wraps a route handler so no exception escapes as an unhandled 500.
 *
 * Usage: `export const POST = route(async (request) => { ... })`
 */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return routeError(error);
    }
  };
}
