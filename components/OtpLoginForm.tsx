'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Two-step phone + OTP sign-in.
 *
 * In development (OTP_PROVIDER=console) the API returns the code so the flow can
 * be tested without an SMS account; the server refuses to do this in production.
 */
export default function OtpLoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Countdown before "Resend code" becomes available again.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'code') codeInputRef.current?.focus();
  }, [step]);

  async function requestCode(event?: FormEvent) {
    event?.preventDefault();
    setError('');
    setBusy(true);

    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        maskedPhone?: string;
        devCode?: string;
      };

      if (!response.ok) {
        setError(body.error || 'Could not send the code. Please try again.');
        return;
      }

      setMaskedPhone(body.maskedPhone ?? phone);
      setDevCode(body.devCode ?? null);
      setStep('code');
      setCooldown(30);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(body.error || 'That code was not accepted.');
        return;
      }

      const safeNext =
        nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/account';
      router.replace(safeNext);
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (step === 'phone') {
    return (
      <form onSubmit={requestCode} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-denim-800">
            Mobile number
          </label>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-mist-300 bg-mist-50 px-3 py-2.5 text-sm text-neutral-600">
              +91
            </span>
            <input
              id="phone"
              required
              autoFocus
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel-national"
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
              className="w-full rounded-lg border border-mist-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-denim-500 focus:ring-2 focus:ring-denim-200"
              placeholder="10-digit number"
            />
          </div>
        </div>

        <button type="submit" disabled={busy || phone.length !== 10} className="btn-primary w-full">
          {busy ? 'Sending…' : 'Send code'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyCode} className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="text-sm text-neutral-600">
        We sent a 6-digit code to <span className="font-medium text-denim-800">{maskedPhone}</span>.
      </p>

      {devCode && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Development mode — your code is <span className="font-mono font-bold">{devCode}</span>.
          Configure an SMS provider before going live.
        </p>
      )}

      <div>
        <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-denim-800">
          Verification code
        </label>
        <input
          id="code"
          ref={codeInputRef}
          required
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          className="w-full rounded-lg border border-mist-300 px-3 py-2.5 text-center font-mono text-lg tracking-[0.4em] outline-none transition-colors focus:border-denim-500 focus:ring-2 focus:ring-denim-200"
          placeholder="000000"
        />
      </div>

      <button type="submit" disabled={busy || code.length !== 6} className="btn-primary w-full">
        {busy ? 'Verifying…' : 'Verify & sign in'}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setStep('phone');
            setCode('');
            setDevCode(null);
            setError('');
          }}
          className="text-denim-600 hover:underline"
        >
          Change number
        </button>
        <button
          type="button"
          onClick={() => void requestCode()}
          disabled={busy || cooldown > 0}
          className="text-denim-600 hover:underline disabled:text-neutral-400 disabled:no-underline"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
