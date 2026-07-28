'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CatalogProduct } from '@/lib/catalog';
import { formatINR } from '@/lib/format';
import { useCart } from '@/components/CartProvider';

export default function ProductCard({ product }: { product: CatalogProduct }) {
  const { add, openCart } = useCart();

  // Cards show stills only; video lives on the product page where it has room.
  const images = product.media.filter((item) => item.type === 'IMAGE');
  const primary = images[0];
  const secondary = images[1];
  const hasVideo = product.media.some((item) => item.type === 'VIDEO');

  const discount = product.compareAt
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : 0;
  const soldOut = product.stock !== null && product.stock <= 0;

  function quickAdd() {
    add(product.slug, 1);
    openCart();
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-mist-300 hover:shadow-lg hover:shadow-denim-500/10">
      <Link
        href={`/products/${product.slug}`}
        className="absolute inset-0 z-10"
        aria-label={product.name}
      />

      <div className="relative aspect-square overflow-hidden bg-mist-100">
        {primary ? (
          <>
            <Image
              src={primary.url}
              alt={primary.alt || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
              className={`object-cover transition-all duration-500 group-hover:scale-105 ${
                secondary ? 'group-hover:opacity-0' : ''
              }`}
            />
            {secondary && (
              <Image
                src={secondary.url}
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
                className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
            No image
          </div>
        )}

        {discount > 0 && (
          <span className="badge-sale absolute left-3 top-3 z-20">{discount}% OFF</span>
        )}

        {hasVideo && (
          <span
            className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-denim-900/60 text-white"
            title="Includes a video"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        )}

        {soldOut ? (
          <span className="absolute inset-x-3 bottom-3 z-20 rounded-full bg-neutral-800/85 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-white">
            Sold out
          </span>
        ) : (
          <button
            onClick={quickAdd}
            aria-label={`Add ${product.name} to cart`}
            className="absolute inset-x-3 bottom-3 z-20 flex translate-y-3 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-denim-700 to-sky-500 py-2.5 text-xs font-semibold uppercase tracking-wide text-white opacity-0 shadow-md transition-all duration-300 hover:shadow-lg group-hover:translate-y-0 group-hover:opacity-100 max-lg:translate-y-0 max-lg:opacity-100"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
              <path d="M6 6 5 3H2" strokeLinecap="round" />
            </svg>
            Add to cart
          </button>
        )}
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
