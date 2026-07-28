import Link from 'next/link';
import { prisma } from '@/lib/db';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    select: { id: true, label: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/products" className="text-sm text-denim-600 hover:underline">
          ← Back to products
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-denim-800">Add product</h1>
      </div>

      <ProductForm
        categories={categories}
        initial={{
          slug: '',
          name: '',
          description: '',
          price: '',
          compareAt: '',
          stock: '',
          categoryId: '',
          highlights: '',
          featured: false,
          active: true,
          sortOrder: '0',
          media: [],
        }}
      />
    </div>
  );
}
