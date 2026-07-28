import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'About Us' };

export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="section-title">About {site.name}</h1>
      <div className="mt-6 space-y-5 text-neutral-600">
        <p>
          {site.name} began with a simple love for traditional Indian jewellery — the kind that
          turns an ordinary day into a celebration. From the heart of {site.location}, we curate
          handcrafted necklace sets that blend timeless artistry with everyday wearability.
        </p>
        <p>
          Our collection spans authentic Kerala kemp and palakka sets, antique temple and mango
          designs, sparkling American diamond pieces and long-lasting micro gold plated malas.
          Every piece is handpicked and quality-checked before it reaches you.
        </p>
        <p>
          We keep things personal and simple: browse online, order on WhatsApp, and pay easily via
          UPI. No middlemen, no inflated prices — just beautiful jewellery at honest value,
          delivered across India.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/products" className="btn-primary">Explore the collection</Link>
        <Link href="/contact" className="btn-outline">Talk to us</Link>
      </div>
    </div>
  );
}
