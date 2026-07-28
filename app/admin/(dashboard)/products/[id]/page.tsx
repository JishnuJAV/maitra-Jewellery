import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { media: { orderBy: { position: 'asc' } } },
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      select: { id: true, label: true },
    }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/products" className="text-sm text-denim-600 hover:underline">
            ← Back to products
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-denim-800">{product.name}</h1>
        </div>
        <Link
          href={`/products/${product.slug}`}
          target="_blank"
          rel="noreferrer"
          className="btn-outline"
        >
          View in store
        </Link>
      </div>

      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          price: String(product.price),
          compareAt: product.compareAt === null ? '' : String(product.compareAt),
          stock: product.stock === null ? '' : String(product.stock),
          categoryId: product.categoryId ?? '',
          highlights: product.highlights.join('\n'),
          featured: product.featured,
          active: product.active,
          sortOrder: String(product.sortOrder),
          media: product.media.map((item) => ({
            key: item.id,
            type: item.type,
            url: item.url,
            publicId: item.publicId,
            posterUrl: item.posterUrl,
            alt: item.alt ?? '',
            width: item.width,
            height: item.height,
          })),
        }}
      />
    </div>
  );
}
