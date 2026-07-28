'use client';

import { useEffect, useRef, useState } from 'react';
import { formatINR } from '@/lib/format';

/**
 * PIN-code delivery estimate shown on the product page.
 *
 * The charge is always computed server-side from the admin's shipping rules, so
 * what's shown here matches what checkout will bill.
 *
 * The input is uncontrolled: its value is only read when the shopper asks for a
 * quote, so there's no need to mirror every keystroke into React state — and it
 * lets the saved PIN code be restored after hydration without a cascading
 * re-render.
 */
export default function ShippingEstimate({
  slug,
  className = '',
}: {
  slug: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [quote, setQuote] = useState<{
    fee: number;
    rateName: string;
    etaDays: string | null;
    freeApplied: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Restore the last PIN code so returning shoppers don't retype it.
  useEffect(() => {
    const saved = localStorage.getItem('maitra-pincode');
    if (saved && inputRef.current) inputRef.current.value = saved;
  }, []);

  async function check() {
    const pincode = inputRef.current?.value.trim() ?? '';

    if (!/^[1-9]\d{5}$/.test(pincode)) {
      setError('Enter a valid 6-digit PIN code.');
      setQuote(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode, items: [{ slug, qty: 1 }] }),
      });

      if (!response.ok) {
        setError('Could not check delivery for that PIN code.');
        return;
      }

      setQuote(await response.json());
      localStorage.setItem('maitra-pincode', pincode);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="pincode-check" className="sr-only">
          Delivery PIN code
        </label>
        <input
          id="pincode-check"
          ref={inputRef}
          inputMode="numeric"
          maxLength={6}
          onInput={(event) => {
            // Digits only, without round-tripping every keystroke through state.
            const target = event.currentTarget;
            target.value = target.value.replace(/\D/g, '');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void check();
            }
          }}
          placeholder="Delivery PIN code"
          className="w-40 rounded-full border border-mist-300 px-4 py-1.5 text-sm outline-none transition-colors focus:border-denim-500"
        />
        <button
          type="button"
          onClick={check}
          disabled={loading}
          className="rounded-full border border-denim-300 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-denim-700 transition-colors hover:bg-denim-50 disabled:opacity-60"
        >
          {loading ? 'Checking…' : 'Check'}
        </button>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}

      {quote && !error && (
        <p className="mt-1.5 text-xs text-neutral-600">
          {quote.fee === 0 ? (
            <span className="font-medium text-emerald-700">Free delivery</span>
          ) : (
            <>
              Delivery <span className="font-medium text-denim-800">{formatINR(quote.fee)}</span>
            </>
          )}
          {quote.etaDays && ` · arrives in ${quote.etaDays}`}
          {quote.freeApplied && ' (free shipping threshold reached)'}
        </p>
      )}
    </div>
  );
}
