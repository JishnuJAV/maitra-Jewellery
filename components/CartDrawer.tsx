'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { formatINR } from '@/lib/format';
import { site, waLink } from '@/lib/site';

export default function CartDrawer() {
  const {
    isOpen,
    closeCart,
    detailed,
    subtotal,
    setQty,
    remove,
    count,
    ready,
  } = useCart();

  if (!isOpen) return null;

  // Delivery is priced from the address at checkout, so it isn't quoted here.
  const message =
    `Hello ${site.name}! 🌸\n\nI'd like to order:\n` +
    detailed
      .map((i) => `• ${i.name} (Qty: ${i.qty}) — ${formatINR(i.price * i.qty)}`)
      .join('\n') +
    `\n\nSubtotal: ${formatINR(subtotal)}` +
    `\n\nPlease confirm availability, delivery charges and payment details.`;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      {/* Overlay */}
      <div
        onClick={closeCart}
        className="animate-overlay-in absolute inset-0 bg-denim-900/40 backdrop-blur-sm"
      />

      {/* Panel */}
      <aside className="animate-drawer-in absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-mist-50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-mist-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-denim-700">
              <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
              <path d="M6 6 5 3H2" strokeLinecap="round" />
              <circle cx="9" cy="20" r="1.4" />
              <circle cx="18" cy="20" r="1.4" />
            </svg>
            <h2 className="font-serif text-xl font-semibold text-denim-800">Your Cart</h2>
            {count > 0 && (
              <span className="rounded-full bg-gradient-to-r from-denim-600 to-sky-500 px-2 py-0.5 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-mist-100 hover:text-denim-800"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {!ready ? (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
            Loading…
          </div>
        ) : count === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-mist-100">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-mist-500">
                <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
                <path d="M6 6 5 3H2" strokeLinecap="round" />
                <circle cx="9" cy="20" r="1.4" />
                <circle cx="18" cy="20" r="1.4" />
              </svg>
            </div>
            <div>
              <p className="font-serif text-lg font-semibold text-denim-800">Your cart is empty</p>
              <p className="mt-1 text-sm text-neutral-500">
                Discover something beautiful for your next occasion.
              </p>
            </div>
            <Link href="/products" onClick={closeCart} className="btn-primary mt-2">
              Shop the collection
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {detailed.map((item) => (
                <div
                  key={item.slug}
                  className="flex gap-3 rounded-2xl border border-mist-200 bg-white p-3 transition-shadow hover:shadow-sm"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeCart}
                    className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-mist-100"
                  >
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={closeCart}
                        className="font-serif text-[15px] font-semibold leading-snug text-neutral-800 hover:text-denim-700"
                      >
                        {item.name}
                      </Link>
                      <button
                        onClick={() => remove(item.slug)}
                        className="-mr-1 -mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-mist-100 hover:text-denim-700"
                        aria-label={`Remove ${item.name}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">{formatINR(item.price)} each</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-mist-300 bg-mist-50">
                        <button
                          onClick={() => setQty(item.slug, item.qty - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-denim-700 transition-colors hover:bg-mist-200"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-sm font-semibold tabular-nums">{item.qty}</span>
                        <button
                          onClick={() => setQty(item.slug, item.qty + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-denim-700 transition-colors hover:bg-mist-200"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-semibold text-denim-800">
                        {formatINR(item.price * item.qty)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer / summary */}
            <div className="border-t border-mist-200 bg-white px-5 pb-5 pt-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="font-semibold text-neutral-800">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Delivery</span>
                  <span className="text-neutral-500">Calculated at checkout</span>
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between border-t border-dashed border-mist-300 pt-3">
                <span className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  Subtotal
                </span>
                <span className="font-serif text-2xl font-bold text-gradient">
                  {formatINR(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-neutral-400">
                Delivery charges depend on your PIN code.
              </p>

              <Link href="/checkout" onClick={closeCart} className="btn-primary mt-4 w-full">
                Proceed to checkout
              </Link>
              <a
                href={waLink(message)}
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp mt-2 w-full"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 0 0-8.7 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.6-1.4 1.2-2 1.3-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.3c-.1.1-.3.3-.1.6.1.3.7 1.1 1.4 1.8.9.8 1.7 1 2 1.2.3.1.5.1.6-.1l.6-.8c.2-.3.4-.2.6-.1l1.9.9c.2.1.4.2.5.3.1.2.1.7-.1 1.3Z" />
                </svg>
                Ask on WhatsApp
              </a>
              <button
                onClick={closeCart}
                className="mt-2 w-full rounded-full py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-colors hover:text-denim-700"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
