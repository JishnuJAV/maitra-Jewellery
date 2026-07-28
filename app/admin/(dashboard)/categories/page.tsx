import { prisma } from '@/lib/db';
import CategoryManager from '@/components/admin/CategoryManager';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-denim-800">Categories</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Group products so customers can browse by style. Categories appear in the shop filter.
        </p>
      </div>

      <CategoryManager
        initial={categories.map((category) => ({
          id: category.id,
          slug: category.slug,
          label: category.label,
          blurb: category.blurb,
          sortOrder: category.sortOrder,
          active: category.active,
          productCount: category._count.products,
        }))}
      />
    </div>
  );
}
