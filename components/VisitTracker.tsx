'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Records a page view on every client-side navigation.
 *
 * Fires once per path per session — re-visiting a page you've already seen in
 * this session doesn't inflate the count. Failures are swallowed: analytics must
 * never break the shopping experience.
 */
export default function VisitTracker() {
  const pathname = usePathname();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!pathname) return;
    // Admin routes are excluded at the layout level, but guard anyway.
    if (pathname.startsWith('/admin')) return;
    if (seen.current.has(pathname)) return;
    seen.current.add(pathname);

    const controller = new AbortController();

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer: document.referrer || null }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // Offline, blocked by an ad blocker, or navigated away — all fine.
    });

    return () => controller.abort();
  }, [pathname]);

  return null;
}
