'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { formatINR } from '@/lib/format';
import { site, waLink } from '@/lib/site';

export default function CartPage() {
  const { detailed, subtotal, shipping, total, setQty, remove, count, ready } = useCart();

  const message =
    `Hello ${site.name}! 🌸\n\nI'd like to order:\n` +
    detailed
      .map((i) => `• ${i.name} (Qty: ${i.qty}) — ${formatINR(i.price * i.qty)}`)
      .join('\n') +
    `\n\nSubtotal: ${formatINR(subtotal)}` +
    `\nShipping: ${formatINR(shipping)}` +
    `\nTotal: ${formatINR(total)}` +
    `\n\nPlease confirm availability and share payment details.`;

  if (!ready) {
    return <div className="container-page py-20 text-center text-neutral-500">Loading cart…</div>;
  }

  if (count === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="section-title">Your cart is empty</h1>
        <p className="mt-3 text-neutral-500">Discover something beautiful for your next occasion.</p>
        <Link href="/products" className="btn-primary mt-6">Shop the collection</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <h1 className="section-title mb-8">Your Cart</h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {detailed.map((item) => (
            <div
              key={item.slug}
              className="flex gap-4 rounded-2xl border border-mist-200 bg-white p-4"
            >
              <Link
                href={`/products/${item.slug}`}
                className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-mist-100"
              >
                <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-serif text-lg font-semibold text-neutral-800 hover:text-denim-700"
                  >
                    {item.name}
                  </Link>
                  <button
                    onClick={() => remove(item.slug)}
                    className="text-neutral-400 hover:text-denim-700"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-denim-800">{formatINR(item.price)}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-mist-300">
                    <button
                      onClick={() => setQty(item.slug, item.qty - 1)}
                      className="px-3 py-1 text-denim-700"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                    <button
                      onClick={() => setQty(item.slug, item.qty + 1)}
                      className="px-3 py-1 text-denim-700"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-semibold text-neutral-800">
                    {formatINR(item.price * item.qty)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-mist-200 bg-white p-6">
          <h2 className="font-serif text-xl font-semibold text-denim-800">Order summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Subtotal</span>
              <span className="font-semibold">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Shipping</span>
              <span className="font-semibold">{formatINR(shipping)}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-mist-200 pt-4 text-lg font-bold text-denim-800">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">{site.shippingNote}</p>

          <a href={waLink(message)} target="_blank" rel="noreferrer" className="btn-whatsapp mt-6 w-full">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 0 0-8.7 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.6-1.4 1.2-2 1.3-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.3c-.1.1-.3.3-.1.6.1.3.7 1.1 1.4 1.8.9.8 1.7 1 2 1.2.3.1.5.1.6-.1l.6-.8c.2-.3.4-.2.6-.1l1.9.9c.2.1.4.2.5.3.1.2.1.7-.1 1.3Z" />
            </svg>
            Place order on WhatsApp
          </a>
          <Link href="/checkout" className="btn-outline mt-3 w-full">
            View payment details
          </Link>
          <Link href="/products" className="mt-4 block text-center text-sm text-denim-700 hover:underline">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
