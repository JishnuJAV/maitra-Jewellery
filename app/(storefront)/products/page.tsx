import Link from 'next/link';
import type { Metadata } from 'next';
import { getCategories, getProducts } from '@/lib/catalog';
import ProductCard from '@/components/ProductCard';

export const metadata: Metadata = { title: 'Shop All Jewellery' };

// Re-rendered at most once a minute, so catalogue edits in the admin appear
// quickly without hitting the database on every request.
export const revalidate = 60;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  const [categories, allProducts] = await Promise.all([getCategories(), getProducts()]);

  const activeCategory = categories.find((entry) => entry.slug === category);
  const search = q?.trim().toLowerCase() ?? '';

  const list = allProducts.filter((product) => {
    if (activeCategory && product.category?.slug !== activeCategory.slug) return false;
    if (search && !product.name.toLowerCase().includes(search)) return false;
    return true;
  });

  return (
    <div>
      <div className="border-b border-mist-200 bg-gradient-to-b from-mist-100 to-mist-50">
        <div className="container-page py-10 text-center sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
            Maitra Collection
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold sm:text-5xl">
            <span className="text-gradient">
              {activeCategory ? activeCategory.label : 'All Jewellery'}
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-neutral-500">
            {activeCategory ? activeCategory.blurb : 'Explore our full handcrafted collection.'}
          </p>
        </div>
      </div>

      <div className="container-page py-10">
        <div className="mb-8 flex flex-wrap justify-center gap-2.5 sm:gap-3">
          <FilterPill
            href="/products"
            label="All"
            count={allProducts.length}
            active={!activeCategory}
          />
          {categories.map((entry) => (
            <FilterPill
              key={entry.id}
              href={`/products?category=${entry.slug}`}
              label={entry.label}
              count={entry.productCount}
              active={activeCategory?.slug === entry.slug}
            />
          ))}
        </div>

        <p className="mb-6 text-center text-sm text-neutral-400">
          {list.length} {list.length === 1 ? 'piece' : 'pieces'}
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {list.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>

        {list.length === 0 && (
          <p className="py-16 text-center text-neutral-500">
            {allProducts.length === 0
              ? 'Our catalogue is being set up. Please check back shortly.'
              : 'No products in this category yet.'}
          </p>
        )}
      </div>
    </div>
  );
}

function FilterPill({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        active
          ? 'border-transparent bg-gradient-to-r from-denim-700 to-sky-500 text-white shadow-sm shadow-denim-500/25'
          : 'border-mist-300 bg-white text-neutral-700 hover:border-denim-300 hover:bg-mist-100'
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 text-[11px] font-semibold ${
          active ? 'bg-white/25 text-white' : 'bg-mist-100 text-neutral-500'
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
