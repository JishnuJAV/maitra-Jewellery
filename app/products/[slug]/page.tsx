import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getProduct, products, categories } from '@/lib/products';
import { formatINR } from '@/lib/format';
import { site } from '@/lib/site';
import ProductGallery from '@/components/ProductGallery';
import AddToCart from '@/components/AddToCart';
import ProductCard from '@/components/ProductCard';

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: 'Product not found' };
  return { title: product.name, description: product.description };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const cat = categories.find((c) => c.id === product.category);
  const related = products
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .slice(0, 4);
  const discount = product.compareAt
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : 0;

  return (
    <div className="container-page py-10">
      <nav className="mb-6 text-sm text-neutral-500">
        <Link href="/" className="hover:text-denim-700">Home</Link> /{' '}
        <Link href="/products" className="hover:text-denim-700">Shop</Link> /{' '}
        {cat && (
          <>
            <Link href={`/products?category=${cat.id}`} className="hover:text-denim-700">
              {cat.label}
            </Link>{' '}
            /{' '}
          </>
        )}
        <span className="text-neutral-700">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div>
          {cat && (
            <Link
              href={`/products?category=${cat.id}`}
              className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-600 transition-colors hover:bg-sky-200"
            >
              {cat.label}
            </Link>
          )}
          <h1 className="mt-3 font-serif text-3xl font-bold text-denim-800 sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="font-serif text-4xl font-bold text-gradient">
              {formatINR(product.price)}
            </span>
            {product.compareAt && (
              <>
                <span className="text-lg text-neutral-400 line-through">
                  {formatINR(product.compareAt)}
                </span>
                <span className="badge-sale">{discount}% OFF</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-500">{site.shippingNote}</p>

          <p className="mt-6 leading-relaxed text-neutral-600">{product.description}</p>

          <ul className="mt-6 space-y-2.5">
            {product.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2.5 text-sm text-neutral-700">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          <div className="mt-8 rounded-xl border border-mist-200 bg-mist-100/50 p-4 text-sm text-neutral-600">
            <p className="font-semibold text-denim-800">How ordering works</p>
            <p className="mt-1">
              Add to cart and checkout, or tap “Order on WhatsApp”. We confirm availability,
              share the total (incl. shipping) and payment details — pay via GPay / UPI / QR.
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="section-title mb-8 text-center">You may also like</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
