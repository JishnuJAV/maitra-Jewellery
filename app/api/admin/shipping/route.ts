import { prisma } from '@/lib/db';
import { assertSameOrigin, ok, parseBody, route } from '@/lib/http';
import { requireAdmin } from '@/lib/auth/admin';
import { shippingRateSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const rates = await prisma.shippingRate.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return ok({ rates });
});

export const POST = route(async (request: Request) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, shippingRateSchema);
  if (parsed.error) return parsed.error;

  const rate = await prisma.$transaction(async (tx) => {
    // Exactly one rule may be the fallback, or shipping resolution becomes
    // ambiguous — promoting a new default demotes the old one.
    if (parsed.data.isDefault) {
      await tx.shippingRate.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    return tx.shippingRate.create({ data: parsed.data });
  });

  return ok({ rate }, 201);
});
