import { randomInt } from 'node:crypto';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { fail } from '@/lib/http';
import { sendOtpSms } from '@/lib/sms';
import { rateLimit } from '@/lib/rate-limit';
import {
  CUSTOMER_COOKIE,
  CUSTOMER_COOKIE_MAX_AGE,
  cookieOptions,
  createCustomerToken,
  verifyCustomerToken,
} from '@/lib/auth/session';

/**
 * Phone-number OTP login.
 *
 * Security properties:
 *  - The code is never stored, only a bcrypt hash, so a database leak doesn't
 *    hand over live login codes.
 *  - Codes expire after 5 minutes and allow 5 wrong guesses; a 6-digit code has
 *    a 1-in-200,000 chance per attempt within that budget.
 *  - Requesting a new code invalidates all previous ones for that number.
 *  - Send and verify are both rate limited per phone number and per IP.
 */

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
/** Cheaper than the admin password cost — these live for 5 minutes, not forever. */
const OTP_BCRYPT_ROUNDS = 8;

export const OTP_SEND_LIMIT = { limit: 5, windowSeconds: 60 * 60 };
export const OTP_IP_LIMIT = { limit: 20, windowSeconds: 60 * 60 };
export const OTP_VERIFY_LIMIT = { limit: 10, windowSeconds: 15 * 60 };

function generateCode(): string {
  // randomInt is cryptographically secure; Math.random is not and would make
  // codes predictable from a handful of observed values.
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export type SendOtpOutcome =
  | { ok: true; devCode?: string }
  | { ok: false; message: string; retryAfterSeconds?: number };

export async function sendOtp(phone: string, ipHash: string): Promise<SendOtpOutcome> {
  const perPhone = await rateLimit(`otp-send:${phone}`, OTP_SEND_LIMIT);
  if (!perPhone.ok) {
    return {
      ok: false,
      message: `Too many code requests for this number. Try again in ${Math.ceil(perPhone.retryAfterSeconds / 60)} minute(s).`,
      retryAfterSeconds: perPhone.retryAfterSeconds,
    };
  }

  const perIp = await rateLimit(`otp-send-ip:${ipHash}`, OTP_IP_LIMIT);
  if (!perIp.ok) {
    return {
      ok: false,
      message: 'Too many code requests from this device. Please try again later.',
      retryAfterSeconds: perIp.retryAfterSeconds,
    };
  }

  const customer = await prisma.customer.findUnique({ where: { phone }, select: { blocked: true } });
  if (customer?.blocked) {
    return { ok: false, message: 'This number cannot sign in. Please contact us for help.' };
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, OTP_BCRYPT_ROUNDS);

  // Consume any outstanding codes so only the newest one works.
  await prisma.otpCode.updateMany({
    where: { phone, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.otpCode.create({
    data: { phone, codeHash, expiresAt: new Date(Date.now() + OTP_TTL_MS), ipHash },
  });

  try {
    const result = await sendOtpSms(phone, code);
    return { ok: true, devCode: result.devCode };
  } catch (error) {
    console.error('[otp] SMS delivery failed:', error);
    return { ok: false, message: 'We could not send the code right now. Please try again shortly.' };
  }
}

export type VerifyOtpOutcome =
  | { ok: true; customerId: string; phone: string; isNewCustomer: boolean }
  | { ok: false; message: string };

export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpOutcome> {
  const limit = await rateLimit(`otp-verify:${phone}`, OTP_VERIFY_LIMIT);
  if (!limit.ok) {
    return { ok: false, message: 'Too many incorrect attempts. Please request a new code shortly.' };
  }

  const record = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return { ok: false, message: 'That code has expired. Please request a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
    return { ok: false, message: 'Too many incorrect attempts. Please request a new code.' };
  }

  const matches = await bcrypt.compare(code, record.codeHash);
  if (!matches) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    const left = MAX_ATTEMPTS - record.attempts - 1;
    return {
      ok: false,
      message: left > 0 ? `Incorrect code. ${left} attempt(s) left.` : 'Incorrect code. Please request a new one.',
    };
  }

  // Single-use: burn the code before issuing a session.
  await prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });

  const existing = await prisma.customer.findUnique({ where: { phone }, select: { id: true } });
  const customer = await prisma.customer.upsert({
    where: { phone },
    create: { phone, lastLoginAt: new Date() },
    update: { lastLoginAt: new Date() },
    select: { id: true, phone: true },
  });

  return { ok: true, customerId: customer.id, phone: customer.phone, isNewCustomer: !existing };
}

export async function startCustomerSession(customer: { id: string; phone: string }) {
  const token = await createCustomerToken({ sub: customer.id, phone: customer.phone });
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, token, cookieOptions(CUSTOMER_COOKIE_MAX_AGE));
}

export async function endCustomerSession() {
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, '', cookieOptions(0));
}

/** Current signed-in customer, re-checked against the database. */
export async function getCustomerSession() {
  const store = await cookies();
  const payload = await verifyCustomerToken(store.get(CUSTOMER_COOKIE)?.value);
  if (!payload) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: payload.sub },
    select: { id: true, phone: true, name: true, email: true, blocked: true },
  });
  if (!customer || customer.blocked) return null;
  return customer;
}

export type CustomerGuard =
  | { ok: false; response: NextResponse; customer?: undefined }
  | {
      ok: true;
      customer: NonNullable<Awaited<ReturnType<typeof getCustomerSession>>>;
      response?: undefined;
    };

/** See requireAdmin for why this uses an explicit `ok` discriminant. */
export async function requireCustomer(): Promise<CustomerGuard> {
  const customer = await getCustomerSession();
  if (!customer) {
    return { ok: false, response: fail('Please sign in to continue.', 401) };
  }
  return { ok: true, customer };
}
