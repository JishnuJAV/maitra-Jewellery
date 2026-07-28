import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { fail } from '@/lib/http';
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  cookieOptions,
  createAdminToken,
  verifyAdminToken,
} from '@/lib/auth/session';

/**
 * Admin authentication (Node runtime only — bcrypt and Prisma are unavailable
 * on the Edge, which is why the proxy does signature-only checks and this module
 * does the authoritative ones).
 */

/** Cost 12 ≈ 250ms per hash: slow enough to make offline cracking expensive. */
const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/**
 * Validates credentials. Returns null for both "no such user" and "wrong
 * password", and always runs a bcrypt comparison, so response timing doesn't
 * reveal whether a username exists.
 */
export async function authenticateAdmin(username: string, password: string) {
  const admin = await prisma.adminUser.findUnique({
    where: { username: username.trim().toLowerCase() },
  });

  if (!admin) {
    // Dummy compare against a real bcrypt hash to keep timing constant.
    await bcrypt.compare(password, '$2b$12$C6UzMDM.H6dfI/f/IKcEe.9Y8pM5fT5xVxQzKZ9qYQ8Zk5cH3vGVe');
    return null;
  }

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) return null;

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  return admin;
}

export async function startAdminSession(admin: { id: string; username: string }) {
  const token = await createAdminToken({ sub: admin.id, username: admin.username });
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, cookieOptions(ADMIN_COOKIE_MAX_AGE));
}

export async function endAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, '', cookieOptions(0));
}

/** Current admin, re-checked against the database. Null if not signed in. */
export async function getAdminSession() {
  const store = await cookies();
  const payload = await verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
  if (!payload) return null;

  // The token could outlive the account it names, so confirm the admin still exists.
  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true, name: true },
  });
  return admin;
}

export type AdminGuard =
  | { ok: false; response: NextResponse; admin?: undefined }
  | { ok: true; admin: NonNullable<Awaited<ReturnType<typeof getAdminSession>>>; response?: undefined };

/**
 * Guard for admin route handlers. Returns either the admin or a 401 response
 * to return directly:
 *
 *   const auth = await requireAdmin();
 *   if (!auth.ok) return auth.response;
 *
 * Uses an explicit `ok` discriminant rather than an `in` check: since TS 4.9,
 * `'response' in auth` does not *exclude* union members that lack the key, so
 * `auth.response` would widen to include `undefined` and callers would fail to
 * typecheck against a `Promise<Response>` signature.
 */
export async function requireAdmin(): Promise<AdminGuard> {
  const admin = await getAdminSession();
  if (!admin) {
    return { ok: false, response: fail('Not authenticated. Please sign in again.', 401) };
  }
  return { ok: true, admin };
}
