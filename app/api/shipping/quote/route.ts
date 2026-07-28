import { prisma } from '@/lib/db';
import { ok, parseBody, route } from '@/lib/http';
import { shippingQuoteSchema } from '@/lib/validation';
import { quoteShipping } from '@/lib/shipping';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Live shipping estimate for the checkout form, so the customer sees the charge
 * update as they type their state / PIN code.
 *
 * Read-only and advisory — the authoritative figure is recomputed when the
 * order is actually placed.
 */
export const POST = route(async (request: Request) => {
  const parsed = await parseBody(request, shippingQuoteSchema);
  if (parsed.error) return parsed.error;

  const { state, pincode, items } = parsed.data;

  // Subtotal is recomputed from database prices so that a tampered cart can't
  // fake its way past a free-shipping threshold.
  let subtotal = 0;
  if (items.length > 0) {
    const products = await prisma.product.findMany({
      where: { slug: { in: items.map((item) => item.slug) }, active: true },
      select: { slug: true, price: true },
    });
    const priceBySlug = new Map(products.map((product) => [product.slug, product.price]));
    subtotal = items.reduce((sum, item) => sum + (priceBySlug.get(item.slug) ?? 0) * item.qty, 0);
  }

  const quote = await quoteShipping({ state, pincode, subtotal });

  return ok({ ...quote, subtotal, total: subtotal + quote.fee });
});
