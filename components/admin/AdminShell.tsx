'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '◧' },
  { href: '/admin/orders', label: 'Orders', icon: '▤' },
  { href: '/admin/products', label: 'Products', icon: '◈' },
  { href: '/admin/categories', label: 'Categories', icon: '▣' },
  { href: '/admin/shipping', label: 'Shipping', icon: '➤' },
  { href: '/admin/customers', label: 'Customers', icon: '☺' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙' },
];

export default function AdminShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => undefined);
    router.replace('/admin/login');
    router.refresh();
  }

  function isActive(href: string) {
    // Exact match for the dashboard root, prefix match for sections, so
    // /admin/products/new still highlights "Products".
    return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        // Flex column rather than an absolutely-positioned footer: the sidebar is
        // `lg:static` on desktop, so an absolute child would escape it and pin
        // itself to the bottom of the page instead of the sidebar.
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col border-r border-mist-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-mist-200 px-5 py-4">
          {/* h-9/w-9 match the 36px width/height props. Tailwind's preflight sets
              `height: auto` on images, so without an explicit CSS height Next
              warns that only one dimension was modified. */}
          <Image src="/logo.jpg" alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="truncate font-serif text-lg font-semibold leading-tight text-denim-800">
              Maitra
            </p>
            <p className="truncate text-xs text-neutral-500">Admin Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-denim-700 text-white'
                  : 'text-neutral-600 hover:bg-mist-100 hover:text-denim-800'
              }`}
            >
              <span aria-hidden className="w-4 text-center opacity-80">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto shrink-0 border-t border-mist-200 p-3">
          <p className="truncate px-3 pb-2 text-xs text-neutral-500">
            Signed in as <span className="font-medium text-denim-700">{username}</span>
          </p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full rounded-lg border border-mist-300 px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Backdrop for the mobile drawer */}
      {menuOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-denim-900/30 lg:hidden"
        />
      )}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-mist-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="rounded-lg border border-mist-300 px-3 py-1.5 text-lg leading-none text-denim-700"
          >
            ☰
          </button>
          <span className="font-serif text-lg font-semibold text-denim-800">Maitra Admin</span>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
