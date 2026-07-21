import Link from 'next/link';
import type { Metadata } from 'next';
import { products, categories, type Category } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

export const metadata: Metadata = { title: 'Shop All Jewellery' };

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const active = searchParams.category as Category | undefined;
  const activeCat = categories.find((c) => c.id === active);
  const list = active ? products.filter((p) => p.category === active) : products;

  return (
    <div className="container-page py-12">
      <div className="mb-8 text-center">
        <h1 className="section-title">{activeCat ? activeCat.label : 'All Jewellery'}</h1>
        <p className="mt-2 text-neutral-500">
          {activeCat ? activeCat.blurb : 'Explore our full handcrafted collection.'}
        </p>
      </div>

      {/* Filter pills */}
      <div className="mb-10 flex flex-wrap justify-center gap-3">
        <FilterPill href="/products" label="All" active={!active} />
        {categories.map((c) => (
          <FilterPill
            key={c.id}
            href={`/products?category=${c.id}`}
            label={c.label}
            active={active === c.id}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>

      {list.length === 0 && (
        <p className="py-16 text-center text-neutral-500">No products in this category yet.</p>
      )}
    </div>
  );
}

function FilterPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-denim-700 bg-denim-700 text-white'
          : 'border-mist-300 bg-white text-neutral-700 hover:bg-mist-100'
      }`}
    >
      {label}
    </Link>
  );
}
