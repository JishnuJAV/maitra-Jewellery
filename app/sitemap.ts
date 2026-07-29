import type { MetadataRoute } from 'next';
import { products, categories } from '@/lib/products';
import { site } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.siteUrl.replace(/\/$/, '');
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = (
    [
      { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
      { url: `${base}/products`, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${base}/about`, changeFrequency: 'yearly', priority: 0.5 },
      { url: `${base}/contact`, changeFrequency: 'yearly', priority: 0.5 },
      { url: `${base}/shipping`, changeFrequency: 'yearly', priority: 0.3 },
      { url: `${base}/returns`, changeFrequency: 'yearly', priority: 0.3 },
      { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
      { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    ] satisfies MetadataRoute.Sitemap
  ).map((p) => ({ ...p, lastModified }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/products?category=${c.id}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
