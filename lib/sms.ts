import { serverEnv, isProduction } from '@/lib/env';
import { toInternational } from '@/lib/phone';

/**
 * SMS delivery, behind a provider interface.
 *
 * Sending transactional SMS in India requires a TRAI DLT-registered sender ID
 * and message template, which takes days to approve. So the default provider is
 * `console`: the full OTP flow works end to end in development, with the code
 * printed to the server log instead of sent. Switch OTP_PROVIDER to msg91 or
 * fast2sms once registration completes — no code changes needed.
 */

export type SendResult = { delivered: boolean; devCode?: string };

async function sendViaMsg91(phone: string, code: string): Promise<SendResult> {
  const { authKey, templateId, senderId } = serverEnv.msg91;

  const url = new URL('https://control.msg91.com/api/v5/otp');
  url.searchParams.set('template_id', templateId);
  url.searchParams.set('mobile', toInternational(phone));
  url.searchParams.set('otp', code);
  url.searchParams.set('otp_expiry', '5');
  if (senderId) url.searchParams.set('sender', senderId);

  const response = await fetch(url, {
    method: 'POST',
    headers: { authkey: authKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const body = (await response.json().catch(() => ({}))) as { type?: string; message?: string };

  if (!response.ok || body.type === 'error') {
    throw new Error(`MSG91 rejected the message: ${body.message ?? response.statusText}`);
  }
  return { delivered: true };
}

async function sendViaFast2Sms(phone: string, code: string): Promise<SendResult> {
  const { apiKey, senderId, messageId } = serverEnv.fast2sms;

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: { authorization: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      route: 'dlt',
      sender_id: senderId,
      message: messageId,
      variables_values: code,
      numbers: phone,
      flash: '0',
    }),
  });

  const body = (await response.json().catch(() => ({}))) as { return?: boolean; message?: unknown };

  if (!response.ok || body.return === false) {
    const message = Array.isArray(body.message) ? body.message.join(', ') : String(body.message ?? response.statusText);
    throw new Error(`Fast2SMS rejected the message: ${message}`);
  }
  return { delivered: true };
}

export async function sendOtpSms(phone: string, code: string): Promise<SendResult> {
  const provider = serverEnv.otpProvider;

  if (provider === 'console') {
    if (isProduction) {
      // Refuse to run the dev stub in production — it would let anyone log in as
      // anyone by reading the code out of the API response.
      throw new Error(
        'OTP_PROVIDER is "console" in production. Configure MSG91 or Fast2SMS before going live.',
      );
    }
    console.info(`\n  ┌─ OTP (dev mode — not sent by SMS)\n  │  ${phone}: ${code}\n  └─\n`);
    return { delivered: false, devCode: code };
  }

  if (provider === 'msg91') return sendViaMsg91(phone, code);
  return sendViaFast2Sms(phone, code);
}
