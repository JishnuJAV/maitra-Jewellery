import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/auth/session';

/**
 * Edge middleware.
 *
 * Two jobs:
 *   1. Gate everything under /admin and /api/admin behind a valid admin session.
 *   2. Attach security headers, including a nonce-based CSP, to every response.
 *
 * Runs on the Edge runtime — no Node APIs, no Prisma. Session checks here are
 * signature-only; route handlers still re-verify against the database before
 * doing anything privileged, so a deleted admin can't keep using a live token.
 *
 * NOTE ON THE FILE NAME
 * Next 16 renamed this convention to `proxy.ts` and marks `middleware.ts` as
 * deprecated — but a `proxy.ts` is forced onto the Node.js runtime, which the
 * Cloudflare adapter cannot run ("Node.js middleware is not currently
 * supported"). So while this app targets Cloudflare it must stay as
 * `middleware.ts`. Expect a deprecation warning on every build; that is
 * expected, not a misconfiguration.
 */

/** Admin pages reachable without a session. */
const PUBLIC_ADMIN_PATHS = ['/admin/login'];
/** Admin APIs reachable without a session — the login endpoint would otherwise lock itself out. */
const PUBLIC_ADMIN_APIS = ['/api/admin/login', '/api/admin/logout'];

function buildCsp(nonce: string, isDev: boolean): string {
  const cloudinary = 'https://res.cloudinary.com https://api.cloudinary.com';

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // 'strict-dynamic' lets Next's nonce'd bootstrap script load the rest of the
    // bundle, without us having to whitelist every chunk URL.
    // Dev needs 'unsafe-eval' because the HMR runtime evals modules.
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])],
    // Tailwind and React inject inline <style> tags; there is no nonce hook for them.
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', cloudinary],
    'media-src': ["'self'", 'blob:', cloudinary],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", cloudinary, ...(isDev ? ['ws:', 'wss:'] : [])],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'worker-src': ["'self'", 'blob:'],
  };

  if (!isDev) directives['upgrade-insecure-requests'] = [];

  return Object.entries(directives)
    .map(([key, values]) => (values.length ? `${key} ${values.join(' ')}` : key))
    .join('; ');
}

function applySecurityHeaders(response: NextResponse, csp: string) {
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  );
  // HSTS only over HTTPS — sending it in local development would pin
  // http://localhost to https and make the dev server unreachable.
  if (process.env.NODE_ENV !== 'development') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isDev = process.env.NODE_ENV === 'development';

  const nonce = crypto.randomUUID().replace(/-/g, '');
  const csp = buildCsp(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  // Next reads the nonce out of the Content-Security-Policy on the *request*
  // headers (server/app-render: getScriptNonceFromHeader) and stamps it onto the
  // script tags it emits. Setting it only on the response would leave those
  // scripts un-nonced, and 'strict-dynamic' would then block the entire bundle.
  requestHeaders.set('Content-Security-Policy', csp);

  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminApi = pathname.startsWith('/api/admin') && !PUBLIC_ADMIN_APIS.includes(pathname);
  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.includes(pathname);

  if ((isAdminPage && !isPublicAdminPath) || isAdminApi) {
    const session = await verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);

    if (!session) {
      if (isAdminApi) {
        return applySecurityHeaders(
          NextResponse.json(
            { error: 'Not authenticated. Please sign in again.' },
            { status: 401 },
          ) as NextResponse,
          csp,
        );
      }
      const loginUrl = new URL('/admin/login', request.url);
      // Remember where they were headed so login can send them back.
      if (pathname !== '/admin') loginUrl.searchParams.set('next', `${pathname}${search}`);
      return applySecurityHeaders(NextResponse.redirect(loginUrl), csp);
    }
  }

  // Already signed in and visiting the login page — go straight to the dashboard.
  if (isPublicAdminPath) {
    const session = await verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);
    if (session) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL('/admin', request.url)),
        csp,
      );
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return applySecurityHeaders(response, csp);
}

export const config = {
  matcher: [
    /*
     * Everything except Next's build output and static files in /public.
     *
     * Static assets are matched by FILE EXTENSION, not by folder. Excluding
     * "products/" would also exclude the /products/[slug] storefront route,
     * leaving product pages with no CSP and no security headers.
     *
     * Note: prefetch requests are deliberately NOT excluded. Router prefetches
     * of an /admin route return its RSC payload, so skipping them would hand
     * dashboard data to unauthenticated visitors.
     */
    /*
     * `cdn-cgi` is Cloudflare's reserved path — it serves the image
     * transformations produced by image-loader.ts, and must never be routed
     * through the Worker.
     */
    '/((?!_next/static|_next/image|cdn-cgi/|.*\\.(?:jpg|jpeg|png|gif|svg|webp|avif|ico|mp4|webm|mov|woff2?|txt|xml)$).*)',
  ],
};
