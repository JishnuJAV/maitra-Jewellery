import { z } from 'zod';
import { prisma } from '@/lib/db';
import { ok, parseBody, route } from '@/lib/http';
import { slugSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  slugs: z.array(slugSchema).max(50),
});

/**
 * Resolves cart slugs to current names, prices and images.
 *
 * The cart in localStorage only ever stores slugs and quantities — prices are
 * looked up here on every load, so a stale cart can never carry an old price
 * into checkout.
 */
export const POST = route(async (request: Request) => {
  const parsed = await parseBody(request, schema);
  if (parsed.error) return parsed.error;

  if (parsed.data.slugs.length === 0) return ok({ products: [] });

  const products = await prisma.product.findMany({
    where: { slug: { in: parsed.data.slugs }, active: true },
    select: {
      slug: true,
      name: true,
      price: true,
      stock: true,
      media: {
        where: { type: 'IMAGE' },
        orderBy: { position: 'asc' },
        take: 1,
        select: { url: true },
      },
    },
  });

  return ok({
    products: products.map((product) => ({
      slug: product.slug,
      name: product.name,
      price: product.price,
      stock: product.stock,
      image: product.media[0]?.url ?? null,
    })),
  });
});
