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

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = getProduct(params.slug);
  if (!product) return { title: 'Product not found' };
  return { title: product.name, description: product.description };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);
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
        <ProductGallery images={product.images} name={product.name} />

        <div>
          {cat && (
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">{cat.label}</p>
          )}
          <h1 className="mt-2 font-serif text-3xl font-bold text-denim-800 sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-3xl font-bold text-denim-800">{formatINR(product.price)}</span>
            {product.compareAt && (
              <>
                <span className="text-lg text-neutral-400 line-through">
                  {formatINR(product.compareAt)}
                </span>
                <span className="rounded-full bg-sun-200 px-2 py-0.5 text-sm font-semibold text-denim-800">
                  {discount}% off
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-500">{site.shippingNote}</p>

          <p className="mt-6 text-neutral-600">{product.description}</p>

          <ul className="mt-6 space-y-2">
            {product.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm text-neutral-700">
                <span className="text-mist-600">◆</span> {h}
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
