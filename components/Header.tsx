'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/components/CartProvider';
import { site } from '@/lib/site';
import { categories } from '@/lib/products';

export default function Header() {
  const { count, openCart } = useCart();
  const [open, setOpen] = useState(false);

  const nav = [
    { href: '/products', label: 'Shop All' },
    ...categories.map((c) => ({ href: `/products?category=${c.id}`, label: c.label })),
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-mist-200 bg-mist-50/95 backdrop-blur">
      <div className="container-page flex items-center gap-3 py-3 sm:gap-4">
        <button
          className="shrink-0 xl:hidden"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-denim-800">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>

        {/* shrink-0 keeps the wordmark from being squeezed into the nav when
            space gets tight — that overlap was the visible symptom. */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label={`${site.name} home`}
        >
          {/* Three-dot brandmark from the Maitra logo */}
          <span className="flex items-center -space-x-1.5">
            <span className="h-4 w-4 rounded-full bg-denim-500/85" />
            <span className="h-4 w-4 rounded-full bg-sky-400/85" />
            <span className="h-4 w-4 rounded-full bg-sun-400/90" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-script text-3xl font-bold text-denim-800">{site.shortName}</span>
            <span className="-mt-0.5 text-[9px] uppercase tracking-[0.35em] text-mist-600">
              Jewellery
            </span>
          </span>
        </Link>

        {/*
          Desktop nav appears at xl (1280px), not lg (1024px). These eight items
          need roughly 1140px alongside the logo and cart, so showing them at
          1024px is what forced the labels to wrap onto two lines. Below xl the
          hamburger takes over.

          `whitespace-nowrap` is the other half of the fix: without it a label
          like "Shop All" breaks at the space regardless of available width.

          The overflow-x fallback only matters if a very long category name is
          added later — it scrolls instead of breaking the header.
        */}
        <nav className="no-scrollbar hidden min-w-0 flex-1 items-center justify-center gap-5 overflow-x-auto xl:flex 2xl:gap-7">
          {nav.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="whitespace-nowrap text-sm font-medium text-neutral-700 transition-colors hover:text-denim-700"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Spacer so the cart stays hard right when the nav is hidden. */}
        <div className="flex-1 xl:hidden" />

        <button
          onClick={openCart}
          className="relative flex shrink-0 items-center gap-1 text-denim-800 transition-transform hover:scale-105"
          aria-label={`Cart${count > 0 ? ` (${count} items)` : ''}`}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
            <path d="M6 6 5 3H2" strokeLinecap="round" />
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="18" cy="20" r="1.4" />
          </svg>
          {count > 0 && (
            <span
              key={count}
              className="animate-pop-in absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-denim-600 to-sky-500 px-1 text-[11px] font-bold text-white shadow-sm"
            >
              {count}
            </span>
          )}
        </button>
      </div>

      {open && (
        // max-height + scroll so the menu never runs off a short screen
        // (landscape phones especially).
        <nav className="max-h-[70vh] overflow-y-auto border-t border-mist-200 bg-mist-50 xl:hidden">
          <div className="container-page flex flex-col py-2">
            {nav.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-neutral-700"
              >
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
