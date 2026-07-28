/**
 * Server-side environment access.
 *
 * Every value is exposed through a getter so it is only read — and only
 * validated — at the moment it is actually used. Eagerly validating at import
 * time would break `next build` on machines that don't have the production
 * secrets, and would drag server config into any module graph that touches it.
 *
 * Never import this from a Client Component. Only NEXT_PUBLIC_* values are safe
 * in the browser, and those are read directly from process.env where needed.
 */

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

export type OtpProvider = 'console' | 'msg91' | 'fast2sms';

export const serverEnv = {
  get databaseUrl() {
    return required('DATABASE_URL');
  },
  get authSecret() {
    const secret = required('AUTH_SECRET');
    if (secret.length < 32) {
      throw new Error('AUTH_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 48');
    }
    return secret;
  },
  get analyticsSalt() {
    return optional('ANALYTICS_SALT') || required('AUTH_SECRET');
  },

  // Admin bootstrap — only read by the seed script, never at request time.
  get adminUsername() {
    return optional('ADMIN_USERNAME', 'maitra@admin');
  },
  get adminPassword() {
    return required('ADMIN_PASSWORD');
  },

  // Cloudinary
  get cloudinary() {
    return {
      cloudName: required('CLOUDINARY_CLOUD_NAME'),
      apiKey: required('CLOUDINARY_API_KEY'),
      apiSecret: required('CLOUDINARY_API_SECRET'),
    };
  },
  get cloudinaryConfigured() {
    return Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET,
    );
  },

  // OTP delivery
  get otpProvider(): OtpProvider {
    const provider = optional('OTP_PROVIDER', 'console').toLowerCase();
    if (provider === 'msg91' || provider === 'fast2sms' || provider === 'console') {
      return provider;
    }
    throw new Error(`Invalid OTP_PROVIDER "${provider}". Expected one of: console, msg91, fast2sms.`);
  },
  get msg91() {
    return {
      authKey: required('MSG91_AUTH_KEY'),
      templateId: required('MSG91_TEMPLATE_ID'),
      senderId: optional('MSG91_SENDER_ID'),
    };
  },
  get fast2sms() {
    return {
      apiKey: required('FAST2SMS_API_KEY'),
      senderId: optional('FAST2SMS_SENDER_ID'),
      messageId: optional('FAST2SMS_MESSAGE_ID'),
    };
  },
} as const;

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
