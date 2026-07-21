'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { formatINR } from '@/lib/format';
import { site, waLink } from '@/lib/site';
import PaymentInfo from '@/components/PaymentInfo';

export default function CheckoutPage() {
  const { detailed, subtotal, count, ready } = useCart();

  const message =
    `Hello ${site.name}! 🌸\n\nI'd like to order:\n` +
    detailed
      .map((i) => `• ${i.name} (Qty: ${i.qty}) — ${formatINR(i.price * i.qty)}`)
      .join('\n') +
    `\n\nSubtotal: ${formatINR(subtotal)}` +
    `\n\nI'm ready to pay via UPI/GPay. Please confirm shipping & total.`;

  return (
    <div className="container-page py-12">
      <h1 className="section-title mb-2">Checkout</h1>
      <p className="mb-8 max-w-2xl text-neutral-600">
        We take orders over WhatsApp so we can confirm availability and give you the exact total
        including shipping. Send your order, then pay using the details below.
      </p>

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {/* Step 1 */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-serif text-2xl font-semibold text-denim-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-denim-700 text-sm text-white">1</span>
              Send your order on WhatsApp
            </h2>
            {ready && count > 0 ? (
              <a href={waLink(message)} target="_blank" rel="noreferrer" className="btn-whatsapp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 0 0-8.7 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.6-1.4 1.2-2 1.3-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.3c-.1.1-.3.3-.1.6.1.3.7 1.1 1.4 1.8.9.8 1.7 1 2 1.2.3.1.5.1.6-.1l.6-.8c.2-.3.4-.2.6-.1l1.9.9c.2.1.4.2.5.3.1.2.1.7-.1 1.3Z" />
                </svg>
                Send order to {site.phoneDisplay}
              </a>
            ) : (
              <p className="text-sm text-neutral-500">
                Your cart is empty.{' '}
                <Link href="/products" className="text-denim-700 hover:underline">Shop now</Link>.
              </p>
            )}
          </div>

          {/* Step 2 */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-serif text-2xl font-semibold text-denim-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-denim-700 text-sm text-white">2</span>
              Pay securely
            </h2>
            <PaymentInfo />
          </div>

          {/* Step 3 */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-serif text-2xl font-semibold text-denim-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-denim-700 text-sm text-white">3</span>
              Share payment screenshot
            </h2>
            <p className="text-sm text-neutral-600">
              Send us the payment screenshot on WhatsApp. We’ll confirm and dispatch your order,
              and share tracking once shipped.
            </p>
          </div>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-2xl border border-mist-200 bg-white p-6">
          <h2 className="font-serif text-xl font-semibold text-denim-800">Your order</h2>
          {ready && count > 0 ? (
            <>
              <ul className="mt-4 space-y-3 text-sm">
                {detailed.map((i) => (
                  <li key={i.slug} className="flex justify-between gap-2">
                    <span className="text-neutral-600">
                      {i.name} × {i.qty}
                    </span>
                    <span className="font-semibold">{formatINR(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between border-t border-mist-200 pt-4 font-bold text-denim-800">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">+ shipping (confirmed on WhatsApp)</p>
            </>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">No items yet.</p>
          )}
          <Link href="/cart" className="mt-6 block text-center text-sm text-denim-700 hover:underline">
            Edit cart
          </Link>
        </aside>
      </div>
    </div>
  );
}
