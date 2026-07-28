import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { assertSameOrigin, fail, ok, parseBody, route } from '@/lib/http';
import { checkoutSchema } from '@/lib/validation';
import { getCustomerSession } from '@/lib/auth/otp';
import { quoteShipping } from '@/lib/shipping';
import { clientIp, hashIp, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Generous enough for real shoppers, tight enough to stop order spam. */
const CHECKOUT_LIMIT = { limit: 10, windowSeconds: 60 * 60 };

/** e.g. MJ-2607-0042 — year, month, then a per-month sequence. */
async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const now = new Date();
  const prefix = `MJ-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const count = await tx.order.count({ where: { createdAt: { gte: monthStart } } });

  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

export const POST = route(async (request: Request) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const parsed = await parseBody(request, checkoutSchema);
  if (parsed.error) return parsed.error;

  const input = parsed.data;

  const limit = await rateLimit(`checkout:${hashIp(clientIp(request.headers))}`, CHECKOUT_LIMIT);
  if (!limit.ok) {
    return fail('Too many orders placed from this device. Please contact us on WhatsApp.', 429);
  }

  // Prices come from the database, never from the request. A client that sends
  // its own totals would otherwise be able to buy at any price it liked.
  const slugs = input.items.map((item) => item.slug);
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, active: true },
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      stock: true,
      media: { orderBy: { position: 'asc' }, take: 1, select: { url: true } },
    },
  });

  const bySlug = new Map(products.map((product) => [product.slug, product]));

  const missing = slugs.filter((slug) => !bySlug.has(slug));
  if (missing.length > 0) {
    return fail(
      `Some items are no longer available: ${missing.join(', ')}. Please review your cart.`,
      409,
    );
  }

  const lineItems = input.items.map((item) => {
    const product = bySlug.get(item.slug)!;
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      qty: item.qty,
      imageUrl: product.media[0]?.url ?? null,
      lineTotal: product.price * item.qty,
    };
  });

  const outOfStock = lineItems.filter((line) => {
    const product = bySlug.get(line.slug)!;
    return product.stock !== null && product.stock < line.qty;
  });
  if (outOfStock.length > 0) {
    return fail(
      `Not enough stock for: ${outOfStock.map((line) => line.name).join(', ')}.`,
      409,
    );
  }

  const subtotal = lineItems.reduce((sum, line) => sum + line.lineTotal, 0);
  const shipping = await quoteShipping({
    state: input.state,
    pincode: input.pincode,
    subtotal,
  });
  const total = subtotal + shipping.fee;

  // Attach the order to the signed-in customer when there is one; guest
  // checkout still works, which matters for a WhatsApp-first store.
  const customer = await getCustomerSession();

  let order;
  // Retry guards against two shoppers checking out in the same instant and
  // computing the same sequence number.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      order = await prisma.$transaction(async (tx) => {
        const orderNumber = await nextOrderNumber(tx);

        const created = await tx.order.create({
          data: {
            orderNumber,
            customerId: customer?.id ?? null,
            customerName: input.customerName,
            phone: input.phone,
            email: input.email || null,
            addressLine1: input.addressLine1,
            addressLine2: input.addressLine2 || null,
            city: input.city,
            state: input.state,
            pincode: input.pincode,
            subtotal,
            shippingFee: shipping.fee,
            total,
            shippingRateName: shipping.rateName,
            customerNote: input.customerNote || null,
            items: { create: lineItems },
          },
          include: { items: true },
        });

        // Decrement tracked stock inside the same transaction as the order.
        for (const line of lineItems) {
          const product = bySlug.get(line.slug)!;
          if (product.stock !== null) {
            await tx.product.update({
              where: { id: product.id },
              data: { stock: { decrement: line.qty } },
            });
          }
        }

        return created;
      });
      break;
    } catch (error) {
      const isDuplicate =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
      if (!isDuplicate || attempt === 2) throw error;
    }
  }

  if (!order) return fail('Could not place the order. Please try again.', 500);

  return ok(
    {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        total: order.total,
        shippingRateName: order.shippingRateName,
        etaDays: shipping.etaDays,
        freeShippingApplied: shipping.freeApplied,
        items: order.items.map((item) => ({
          name: item.name,
          qty: item.qty,
          price: item.price,
          lineTotal: item.lineTotal,
        })),
      },
    },
    201,
  );
});
