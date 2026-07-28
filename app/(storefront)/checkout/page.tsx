'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { formatINR } from '@/lib/format';
import { site, waLink } from '@/lib/site';
import PaymentInfo from '@/components/PaymentInfo';

const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

type PlacedOrder = {
  orderNumber: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingRateName: string | null;
  etaDays: string | null;
  items: { name: string; qty: number; price: number; lineTotal: number }[];
};

const inputClass =
  'w-full rounded-lg border border-mist-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-denim-500 focus:ring-2 focus:ring-denim-200';

export default function CheckoutPage() {
  const { detailed, subtotal, count, ready, clear } = useCart();

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    customerNote: '',
  });

  const [quote, setQuote] = useState<{ fee: number; rateName: string; etaDays: string | null } | null>(
    null,
  );
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const cartSignature = useMemo(
    () => detailed.map((line) => `${line.slug}:${line.qty}`).join(','),
    [detailed],
  );

  // Re-quote delivery whenever the destination or cart changes. Debounced so
  // typing a PIN code doesn't fire six requests.
  const destinationKnown = /^[1-9]\d{5}$/.test(form.pincode) || Boolean(form.state);

  useEffect(() => {
    if (placed || !destinationKnown) return;
    if (detailed.length === 0) return;

    const timer = setTimeout(() => {
      fetch('/api/shipping/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: form.state || undefined,
          pincode: form.pincode || undefined,
          items: detailed.map((line) => ({ slug: line.slug, qty: line.qty })),
        }),
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((body) => setQuote(body))
        .catch(() => setQuote(null));
    }, 400);

    return () => clearTimeout(timer);
  }, [form.state, form.pincode, cartSignature, detailed, placed, destinationKnown]);

  // Derived rather than cleared in the effect: a quote is only meaningful while
  // the destination it was calculated for is still filled in.
  const activeQuote = destinationKnown ? quote : null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setPlacing(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          // Only slugs and quantities are sent — the server prices the order.
          items: detailed.map((line) => ({ slug: line.slug, qty: line.qty })),
        }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        order?: PlacedOrder;
      };

      if (!response.ok || !body.order) {
        setError(body.error || 'Could not place your order. Please try again.');
        return;
      }

      setPlaced(body.order);
      clear();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setPlacing(false);
    }
  }

  // ---- Order placed ----------------------------------------------------------
  if (placed) {
    const message =
      `Hello ${site.name}! 🌸\n\nI've just placed order ${placed.orderNumber}:\n` +
      placed.items.map((item) => `• ${item.name} (Qty: ${item.qty}) — ${formatINR(item.lineTotal)}`).join('\n') +
      `\n\nSubtotal: ${formatINR(placed.subtotal)}` +
      `\nDelivery: ${placed.shippingFee === 0 ? 'Free' : formatINR(placed.shippingFee)}` +
      `\nTotal: ${formatINR(placed.total)}` +
      `\n\nI'm ready to pay ${formatINR(placed.total)} via UPI/GPay.`;

    return (
      <div className="container-page py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <p className="font-serif text-2xl font-semibold text-emerald-800">
              Order {placed.orderNumber} received
            </p>
            <p className="mt-2 text-sm text-emerald-700">
              We&apos;ve saved your order. Send it on WhatsApp and pay to confirm — we&apos;ll
              dispatch as soon as payment is received.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-mist-200 bg-white p-6">
            <h2 className="font-serif text-xl font-semibold text-denim-800">Order summary</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {placed.items.map((item) => (
                <li key={item.name} className="flex justify-between gap-3">
                  <span className="text-neutral-600">
                    {item.name} × {item.qty}
                  </span>
                  <span className="tabular-nums">{formatINR(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-mist-200 pt-4 text-sm">
              <div className="flex justify-between text-neutral-600">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{formatINR(placed.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-neutral-600">
                <dt>Delivery {placed.shippingRateName && `(${placed.shippingRateName})`}</dt>
                <dd className="tabular-nums">
                  {placed.shippingFee === 0 ? 'Free' : formatINR(placed.shippingFee)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-mist-200 pt-2 text-base font-semibold text-denim-800">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatINR(placed.total)}</dd>
              </div>
            </dl>
            {placed.etaDays && (
              <p className="mt-3 text-xs text-neutral-500">
                Estimated delivery: {placed.etaDays}
              </p>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <a href={waLink(message)} target="_blank" rel="noreferrer" className="btn-whatsapp w-full">
              Send order on WhatsApp
            </a>
            <PaymentInfo amount={placed.total} />
            <Link href="/products" className="block text-center text-sm text-denim-700 hover:underline">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---- Empty cart ------------------------------------------------------------
  if (!ready) {
    return <div className="container-page py-20 text-center text-neutral-500">Loading…</div>;
  }

  if (count === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="section-title">Your cart is empty</h1>
        <p className="mt-3 text-neutral-500">Add something beautiful before checking out.</p>
        <Link href="/products" className="btn-primary mt-6">
          Shop the collection
        </Link>
      </div>
    );
  }

  // ---- Checkout form ---------------------------------------------------------
  const total = subtotal + (activeQuote?.fee ?? 0);

  return (
    <div className="container-page py-12">
      <h1 className="section-title mb-2">Checkout</h1>
      <p className="mb-8 max-w-2xl text-neutral-600">
        Enter your delivery details. We&apos;ll save your order, then you confirm and pay on
        WhatsApp.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <section className="rounded-2xl border border-mist-200 bg-white p-6">
            <h2 className="mb-4 font-serif text-xl font-semibold text-denim-800">Your details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="customerName" required>
                <input
                  id="customerName"
                  required
                  value={form.customerName}
                  onChange={(event) => update('customerName', event.target.value)}
                  className={inputClass}
                  autoComplete="name"
                />
              </Field>
              <Field label="Mobile number" htmlFor="phone" required>
                <input
                  id="phone"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value.replace(/\D/g, ''))}
                  className={inputClass}
                  placeholder="10-digit number"
                  autoComplete="tel-national"
                />
              </Field>
              <Field label="Email (optional)" htmlFor="email" className="sm:col-span-2">
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  className={inputClass}
                  autoComplete="email"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-mist-200 bg-white p-6">
            <h2 className="mb-4 font-serif text-xl font-semibold text-denim-800">
              Delivery address
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Address" htmlFor="addressLine1" required className="sm:col-span-2">
                <input
                  id="addressLine1"
                  required
                  value={form.addressLine1}
                  onChange={(event) => update('addressLine1', event.target.value)}
                  className={inputClass}
                  placeholder="House / flat, street"
                  autoComplete="address-line1"
                />
              </Field>
              <Field label="Landmark / area (optional)" htmlFor="addressLine2" className="sm:col-span-2">
                <input
                  id="addressLine2"
                  value={form.addressLine2}
                  onChange={(event) => update('addressLine2', event.target.value)}
                  className={inputClass}
                  autoComplete="address-line2"
                />
              </Field>
              <Field label="City" htmlFor="city" required>
                <input
                  id="city"
                  required
                  value={form.city}
                  onChange={(event) => update('city', event.target.value)}
                  className={inputClass}
                  autoComplete="address-level2"
                />
              </Field>
              <Field label="PIN code" htmlFor="pincode" required>
                <input
                  id="pincode"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(event) => update('pincode', event.target.value.replace(/\D/g, ''))}
                  className={inputClass}
                  autoComplete="postal-code"
                />
              </Field>
              <Field label="State" htmlFor="state" required className="sm:col-span-2">
                <select
                  id="state"
                  required
                  value={form.state}
                  onChange={(event) => update('state', event.target.value)}
                  className={inputClass}
                >
                  <option value="">Select your state</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Note for us (optional)" htmlFor="customerNote" className="sm:col-span-2">
                <textarea
                  id="customerNote"
                  rows={3}
                  value={form.customerNote}
                  onChange={(event) => update('customerNote', event.target.value)}
                  className={inputClass}
                  placeholder="Anything we should know about your order"
                />
              </Field>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-mist-200 bg-white p-6 lg:sticky lg:top-24">
          <h2 className="font-serif text-xl font-semibold text-denim-800">Your order</h2>

          <ul className="mt-4 space-y-3 text-sm">
            {detailed.map((line) => (
              <li key={line.slug} className="flex justify-between gap-3">
                <span className="text-neutral-600">
                  {line.name} × {line.qty}
                </span>
                <span className="tabular-nums">{formatINR(line.price * line.qty)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-mist-200 pt-4 text-sm">
            <div className="flex justify-between text-neutral-600">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-neutral-600">
              <dt>Delivery</dt>
              <dd className="tabular-nums">
                {activeQuote
                  ? activeQuote.fee === 0
                    ? 'Free'
                    : formatINR(activeQuote.fee)
                  : <span className="text-neutral-400">Enter PIN code</span>}
              </dd>
            </div>
            <div className="flex justify-between border-t border-mist-200 pt-2 text-lg font-bold text-denim-800">
              <dt>Total</dt>
              <dd className="font-serif tabular-nums text-gradient">{formatINR(total)}</dd>
            </div>
          </dl>

          {activeQuote?.etaDays && (
            <p className="mt-2 text-xs text-neutral-500">Estimated delivery: {activeQuote.etaDays}</p>
          )}

          <button type="submit" disabled={placing} className="btn-primary mt-6 w-full">
            {placing ? 'Placing order…' : 'Place order'}
          </button>

          <p className="mt-3 text-center text-xs text-neutral-500">
            You&apos;ll confirm and pay on WhatsApp in the next step.
          </p>

          <Link href="/cart" className="mt-4 block text-center text-sm text-denim-700 hover:underline">
            Back to cart
          </Link>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  className = '',
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-denim-800">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
