import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatINR } from '@/lib/format';
import { Card, EmptyState } from '@/components/admin/ui';
import ProductRowActions from '@/components/admin/ProductRowActions';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      category: { select: { label: true } },
      media: { orderBy: { position: 'asc' }, take: 1 },
      _count: { select: { media: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-denim-800">Products</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {products.length} product{products.length === 1 ? '' : 's'} in your catalogue
          </p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          Add product
        </Link>
      </div>

      <Card>
        {products.length === 0 ? (
          <EmptyState
            message="No products yet"
            hint="Add your first product, or run the seed script to import your existing catalogue."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mist-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="pb-2 pr-3 font-medium">Product</th>
                  <th className="pb-2 pr-3 font-medium">Category</th>
                  <th className="pb-2 pr-3 font-medium">Price</th>
                  <th className="pb-2 pr-3 font-medium">Stock</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist-100">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-mist-100">
                          {product.media[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.media[0].url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="block truncate font-medium text-denim-700 hover:underline"
                          >
                            {product.name}
                          </Link>
                          <span className="text-xs text-neutral-500">
                            {product._count.media} media
                            {product.featured && ' · Featured'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-neutral-600">
                      {product.category?.label ?? (
                        <span className="text-neutral-400">Uncategorised</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 tabular-nums text-neutral-700">
                      {formatINR(product.price)}
                      {product.compareAt && (
                        <span className="ml-1.5 text-xs text-neutral-400 line-through">
                          {formatINR(product.compareAt)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3 tabular-nums text-neutral-600">
                      {product.stock ?? <span className="text-neutral-400">Not tracked</span>}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          product.active
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-neutral-200 bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {product.active ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <ProductRowActions id={product.id} name={product.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
