import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { assertSameOrigin, fail, ok, parseBody, route } from '@/lib/http';
import { requireAdmin } from '@/lib/auth/admin';
import { orderUpdateSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: Request, { params }: Context) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = await parseBody(request, orderUpdateSchema);
  if (parsed.error) return parsed.error;

  try {
    const order = await prisma.order.update({
      where: { id },
      data: parsed.data,
      include: { items: true },
    });
    return ok({ order });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return fail('Order not found.', 404);
    }
    throw error;
  }
});
