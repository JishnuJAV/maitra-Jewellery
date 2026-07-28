import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin — Maitra Jewellery',
  // Keep the dashboard out of search results entirely.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Bare wrapper for everything under /admin.
 *
 * The authenticated chrome (sidebar, header) lives in the (dashboard) route
 * group instead, so /admin/login can render without it.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-mist-100 text-neutral-800">{children}</div>;
}
