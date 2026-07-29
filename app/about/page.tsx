import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About Us',
  description: `The story behind ${site.name} — handcrafted temple, kemp, palakka and micro gold plated jewellery, curated in Kerala and delivered across India.`,
  alternates: { canonical: '/about' },
};

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
      <div className="mt-10 rounded-2xl border border-mist-200 bg-white p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-denim-800">{site.name}</h2>
        <p className="mt-3 leading-relaxed text-neutral-600">{site.description}</p>
        <p className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="flex-shrink-0 text-sky-600"
          >
            <path
              d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {site.location}
        </p>
        <p className="mt-5 border-t border-mist-200 pt-5 font-serif text-lg font-semibold text-gradient">
          {site.ogTitle}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/products" className="btn-primary">Explore the collection</Link>
        <Link href="/contact" className="btn-outline">Talk to us</Link>
      </div>
    </div>
  );
}
