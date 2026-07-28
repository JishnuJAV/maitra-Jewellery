import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { serverEnv, isProduction } from '@/lib/env';

/**
 * Session tokens.
 *
 * `jose` is used rather than `jsonwebtoken` because these tokens are verified in
 * Edge middleware, which has no Node crypto. Everything here is therefore
 * Edge-safe — no bcrypt, no Node built-ins.
 */

export const ADMIN_COOKIE = 'mj_admin_session';
export const CUSTOMER_COOKIE = 'mj_customer_session';

/** Admin sessions are short — an unattended dashboard shouldn't stay open all week. */
const ADMIN_TTL_SECONDS = 60 * 60 * 8; // 8 hours
/** Customers shouldn't have to re-request an OTP constantly. */
const CUSTOMER_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type AdminSession = {
  sub: string;
  username: string;
  role: 'admin';
};

export type CustomerSession = {
  sub: string;
  phone: string;
  role: 'customer';
};

let cachedKey: Uint8Array | null = null;
function secretKey(): Uint8Array {
  if (!cachedKey) {
    cachedKey = new TextEncoder().encode(serverEnv.authSecret);
  }
  return cachedKey;
}

async function sign(payload: JWTPayload, ttlSeconds: number): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('maitra-jewellery')
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secretKey());
}

async function verify<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: 'maitra-jewellery',
      algorithms: ['HS256'],
    });
    return payload as T;
  } catch {
    // Expired, tampered with, or signed by a rotated secret — all mean "no session".
    return null;
  }
}

export function createAdminToken(session: Omit<AdminSession, 'role'>) {
  return sign({ ...session, role: 'admin' }, ADMIN_TTL_SECONDS);
}

export function verifyAdminToken(token: string | undefined) {
  return verify<AdminSession & JWTPayload>(token).then((p) =>
    p && p.role === 'admin' ? p : null,
  );
}

export function createCustomerToken(session: Omit<CustomerSession, 'role'>) {
  return sign({ ...session, role: 'customer' }, CUSTOMER_TTL_SECONDS);
}

export function verifyCustomerToken(token: string | undefined) {
  return verify<CustomerSession & JWTPayload>(token).then((p) =>
    p && p.role === 'customer' ? p : null,
  );
}

/** Shared cookie flags. httpOnly keeps the token out of reach of any XSS. */
export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export const ADMIN_COOKIE_MAX_AGE = ADMIN_TTL_SECONDS;
export const CUSTOMER_COOKIE_MAX_AGE = CUSTOMER_TTL_SECONDS;
