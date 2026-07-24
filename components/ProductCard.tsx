'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/products';
import { formatINR } from '@/lib/format';
import { useCart } from '@/components/CartProvider';

export default function ProductCard({ product }: { product: Product }) {
  const { add, openCart } = useCart();
  const discount = product.compareAt
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : 0;
  const hasHover = product.images.length > 1;

  function quickAdd() {
    add(product.slug, 1);
    openCart();
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-mist-300 hover:shadow-lg hover:shadow-denim-500/10">
      {/* Full-card link (below the quick-add button in stacking order) */}
      <Link
        href={`/products/${product.slug}`}
        className="absolute inset-0 z-10"
        aria-label={product.name}
      />

      <div className="relative aspect-square overflow-hidden bg-mist-100">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
          className={`object-cover transition-all duration-500 group-hover:scale-105 ${
            hasHover ? 'group-hover:opacity-0' : ''
          }`}
        />
        {hasHover && (
          <Image
            src={product.images[1]}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        {discount > 0 && (
          <span className="badge-sale absolute left-3 top-3 z-20">{discount}% OFF</span>
        )}

        {/* Quick add — slides up on hover (desktop), always visible on touch */}
        <button
          onClick={quickAdd}
          aria-label={`Add ${product.name} to cart`}
          className="absolute inset-x-3 bottom-3 z-20 flex translate-y-3 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-denim-700 to-sky-500 py-2.5 text-xs font-semibold uppercase tracking-wide text-white opacity-0 shadow-md transition-all duration-300 hover:shadow-lg group-hover:translate-y-0 group-hover:opacity-100 max-lg:translate-y-0 max-lg:opacity-100"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
            <path d="M6 6 5 3H2" strokeLinecap="round" />
          </svg>
          Add to cart
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-lg font-semibold leading-snug text-neutral-800 transition-colors group-hover:text-denim-700">
          {product.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-denim-800">{formatINR(product.price)}</span>
          {product.compareAt && (
            <span className="text-sm text-neutral-400 line-through">
              {formatINR(product.compareAt)}
            </span>
          )}
          {discount > 0 && (
            <span className="ml-auto text-xs font-semibold text-sky-600">Save {discount}%</span>
          )}
        </div>
      </div>
    </div>
  );
}
