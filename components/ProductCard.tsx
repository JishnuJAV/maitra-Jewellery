import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/products';
import { formatINR } from '@/lib/format';

export default function ProductCard({ product }: { product: Product }) {
  const discount = product.compareAt
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-mist-100">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-sun-400 px-2.5 py-1 text-xs font-bold text-denim-900">
            {discount}% OFF
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-lg font-semibold leading-snug text-neutral-800 group-hover:text-denim-700">
          {product.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-denim-800">{formatINR(product.price)}</span>
          {product.compareAt && (
            <span className="text-sm text-neutral-400 line-through">
              {formatINR(product.compareAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
