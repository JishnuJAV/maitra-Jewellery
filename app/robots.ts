import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const base = site.siteUrl.replace(/\/$/, '');

  return {
    // Cart and checkout stay crawlable on purpose: they carry `noindex` in their
    // layouts, and a robots.txt block would stop Google from ever reading it.
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${base}/sitemap.xml`,
  };
}
