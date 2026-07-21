'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/components/CartProvider';
import { site } from '@/lib/site';
import { categories } from '@/lib/products';

export default function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  const nav = [
    { href: '/products', label: 'Shop All' },
    ...categories.map((c) => ({ href: `/products?category=${c.id}`, label: c.label })),
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-mist-200 bg-mist-50/95 backdrop-blur">
      <div className="container-page flex items-center justify-between gap-4 py-3">
        <button
          className="lg:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-denim-800">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>

        <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
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

        <nav className="hidden items-center gap-6 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="text-sm font-medium text-neutral-700 transition-colors hover:text-denim-700"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <Link href="/cart" className="relative flex items-center gap-1 text-denim-800" aria-label="Cart">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
            <path d="M6 6 5 3H2" strokeLinecap="round" />
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="18" cy="20" r="1.4" />
          </svg>
          {count > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-denim-700 px-1 text-[11px] font-bold text-white">
              {count}
            </span>
          )}
        </Link>
      </div>

      {open && (
        <nav className="border-t border-mist-200 bg-mist-50 lg:hidden">
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
