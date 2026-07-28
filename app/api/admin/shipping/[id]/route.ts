import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { assertSameOrigin, fail, ok, parseBody, route } from '@/lib/http';
import { requireAdmin } from '@/lib/auth/admin';
import { shippingRateUpdateSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: Request, { params }: Context) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = await parseBody(request, shippingRateUpdateSchema);
  if (parsed.error) return parsed.error;

  try {
    const rate = await prisma.$transaction(async (tx) => {
      if (parsed.data.isDefault) {
        await tx.shippingRate.updateMany({
          where: { isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
      }
      return tx.shippingRate.update({ where: { id }, data: parsed.data });
    });

    return ok({ rate });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return fail('Shipping rate not found.', 404);
    }
    throw error;
  }
});

export const DELETE = route(async (request: Request, { params }: Context) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const rate = await prisma.shippingRate.findUnique({ where: { id }, select: { isDefault: true } });
  if (!rate) return fail('Shipping rate not found.', 404);

  // Removing the fallback would leave out-of-region orders with no rule to match,
  // silently charging ₹0 shipping.
  if (rate.isDefault) {
    return fail(
      'This is the default rule used when nothing else matches. Make another region the default before deleting it.',
      409,
    );
  }

  await prisma.shippingRate.delete({ where: { id } });
  return ok({ deleted: true });
});
