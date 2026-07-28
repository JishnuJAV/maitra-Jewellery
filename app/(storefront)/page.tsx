import Link from 'next/link';
import Image from 'next/image';
import { getCategories, getProducts } from '@/lib/catalog';
import ProductCard from '@/components/ProductCard';
import TrustBadges from '@/components/TrustBadges';
import { site } from '@/lib/site';

export const revalidate = 60;

/** First still image for a product, if it has one. */
function coverImage(product: { media: { type: string; url: string }[] }) {
  return product.media.find((item) => item.type === 'IMAGE')?.url ?? null;
}

export default async function HomePage() {
  const [categories, featured, allProducts] = await Promise.all([
    getCategories(),
    getProducts({ featured: true }),
    getProducts(),
  ]);

  // Fall back to the newest products if nothing has been marked featured yet,
  // so the homepage is never empty.
  const showcase = featured.length > 0 ? featured : allProducts.slice(0, 8);
  const heroImages = showcase.map(coverImage).filter((url): url is string => url !== null);

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
              Handcrafted temple, kemp, palakka, American diamond and micro gold plated necklace
              sets — curated with love and offered at honest prices.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/products" className="btn-primary">
                Shop the collection
              </Link>
              {categories[0] && (
                <Link href={`/products?category=${categories[0].slug}`} className="btn-outline">
                  Explore {categories[0].label.toLowerCase()}
                </Link>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              {heroImages.slice(0, 4).map((url, index) => (
                <div
                  key={url}
                  className={`relative aspect-square overflow-hidden rounded-2xl border border-mist-200 shadow-sm ${
                    index % 2 === 1 ? 'translate-y-6' : ''
                  }`}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 45vw, 260px"
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <TrustBadges />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-page py-16">
          <div className="mb-10 text-center">
            <h2 className="section-title">Shop by category</h2>
            <p className="mt-2 text-neutral-500">Find the perfect set for every occasion.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => {
              const cover = coverImage(
                allProducts.find((product) => product.category?.slug === category.slug) ?? {
                  media: [],
                },
              );

              return (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-mist-200 bg-white"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-mist-100">
                    {cover && (
                      <Image
                        src={cover}
                        alt={category.label}
                        fill
                        sizes="(max-width: 1024px) 45vw, 260px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-denim-900/70 to-transparent" />
                    <div className="absolute bottom-0 p-4 text-white">
                      <h3 className="font-serif text-xl font-semibold">{category.label}</h3>
                      <p className="text-xs text-mist-100/80">{category.blurb}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured collection */}
      {showcase.length > 0 && (
        <section className="bg-mist-100/60 py-16">
          <div className="container-page">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="section-title">Trendy collection</h2>
                <p className="mt-2 text-neutral-500">Our most-loved handpicked sets.</p>
              </div>
              <Link
                href="/products"
                className="hidden text-sm font-semibold text-denim-700 hover:underline sm:block"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {showcase.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link href="/products" className="btn-outline">
                View all products
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
