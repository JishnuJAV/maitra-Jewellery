import type { Metadata } from 'next';
import { site, waLink } from '@/lib/site';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="section-title">Get in touch</h1>
      <p className="mt-4 text-neutral-600">
        Have a question about a product, sizing, or your order? We’re happiest on WhatsApp and
        usually reply within a few hours.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <a
          href={waLink(`Hello ${site.name}! I have a question.`)}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border border-mist-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="font-serif text-xl font-semibold text-denim-800">WhatsApp / Call</h2>
          <p className="mt-2 text-neutral-600">{site.phoneDisplay}</p>
          <p className="mt-1 text-sm text-[#25D366]">Chat with us →</p>
        </a>

        <a
          href={`mailto:${site.email}`}
          className="rounded-2xl border border-mist-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="font-serif text-xl font-semibold text-denim-800">Email</h2>
          <p className="mt-2 text-neutral-600">{site.email}</p>
          <p className="mt-1 text-sm text-denim-700">Send an email →</p>
        </a>

        <a
          href={site.instagram}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border border-mist-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="font-serif text-xl font-semibold text-denim-800">Instagram</h2>
          <p className="mt-2 text-neutral-600">See our latest designs</p>
          <p className="mt-1 text-sm text-denim-700">Follow us →</p>
        </a>

        <div className="rounded-2xl border border-mist-200 bg-white p-6">
          <h2 className="font-serif text-xl font-semibold text-denim-800">Location</h2>
          <p className="mt-2 text-neutral-600">{site.location}</p>
          <p className="mt-1 text-sm text-neutral-500">Shipping across India</p>
        </div>
      </div>
    </div>
  );
}
