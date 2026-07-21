'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { site, waLink } from '@/lib/site';
import { formatINR } from '@/lib/format';
import type { Product } from '@/lib/products';

export default function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add(product.slug, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  const orderMessage =
    `Hello ${site.name}! 🌸\n\nI'd like to order:\n` +
    `• ${product.name} (Qty: ${qty}) — ${formatINR(product.price * qty)}\n\n` +
    `Please share payment & delivery details.`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-neutral-600">Quantity</span>
        <div className="flex items-center rounded-full border border-mist-300">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3 py-1.5 text-lg text-denim-700"
            aria-label="Decrease"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-semibold">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="px-3 py-1.5 text-lg text-denim-700"
            aria-label="Increase"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={handleAdd} className="btn-outline flex-1">
          {added ? '✓ Added to cart' : 'Add to Cart'}
        </button>
        <button
          onClick={() => {
            add(product.slug, qty);
            router.push('/cart');
          }}
          className="btn-primary flex-1"
        >
          Buy Now
        </button>
      </div>

      <a href={waLink(orderMessage)} target="_blank" rel="noreferrer" className="btn-whatsapp w-full">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.7 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.6-1.4 1.2-2 1.3-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.3c-.1.1-.3.3-.1.6.1.3.7 1.1 1.4 1.8.9.8 1.7 1 2 1.2.3.1.5.1.6-.1l.6-.8c.2-.3.4-.2.6-.1l1.9.9c.2.1.4.2.5.3.1.2.1.7-.1 1.3Z" />
        </svg>
        Order this on WhatsApp
      </a>
    </div>
  );
}
