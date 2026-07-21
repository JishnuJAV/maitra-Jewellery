import Link from 'next/link';
import Image from 'next/image';
import { categories, featuredProducts, products } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import TrustBadges from '@/components/TrustBadges';
import { site } from '@/lib/site';

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-mist-100 to-mist-50">
        <div className="container-page grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
              {site.location}
            </p>
            <h1 className="font-serif text-4xl font-bold leading-tight text-denim-800 sm:text-5xl lg:text-6xl">
              Timeless jewellery for every celebration
            </h1>
            <p className="mt-5 max-w-md text-base text-neutral-600">
              Handcrafted temple, kemp, palakka, American diamond and micro gold plated
              necklace sets — curated with love and offered at honest prices.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/products" className="btn-primary">Shop the collection</Link>
              <Link href="/products?category=kemp-palakka" className="btn-outline">
                Explore kemp & palakka
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              {featuredProducts.slice(0, 4).map((p, i) => (
                <div
                  key={p.slug}
                  className={`relative aspect-square overflow-hidden rounded-2xl border border-mist-200 shadow-sm ${
                    i % 2 === 1 ? 'translate-y-6' : ''
                  }`}
                >
                  <Image
                    src={p.images[0]}
                    alt={p.name}
                    fill
                    sizes="(max-width: 1024px) 45vw, 260px"
                    className="object-cover"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <TrustBadges />

      {/* Categories */}
      <section className="container-page py-16">
        <div className="mb-10 text-center">
          <h2 className="section-title">Shop by category</h2>
          <p className="mt-2 text-neutral-500">Find the perfect set for every occasion.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => {
            const cover = products.find((p) => p.category === c.id);
            return (
              <Link
                key={c.id}
                href={`/products?category=${c.id}`}
                className="group relative overflow-hidden rounded-2xl border border-mist-200 bg-white"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-mist-100">
                  {cover && (
                    <Image
                      src={cover.images[0]}
                      alt={c.label}
                      fill
                      sizes="(max-width: 1024px) 45vw, 260px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-denim-900/70 to-transparent" />
                  <div className="absolute bottom-0 p-4 text-white">
                    <h3 className="font-serif text-xl font-semibold">{c.label}</h3>
                    <p className="text-xs text-mist-100/80">{c.blurb}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured / Trendy collection */}
      <section className="bg-mist-100/60 py-16">
        <div className="container-page">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="section-title">Trendy collection</h2>
              <p className="mt-2 text-neutral-500">Our most-loved handpicked sets.</p>
            </div>
            <Link href="/products" className="hidden text-sm font-semibold text-denim-700 hover:underline sm:block">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/products" className="btn-outline">View all products</Link>
          </div>
        </div>
      </section>
    </>
  );
}
