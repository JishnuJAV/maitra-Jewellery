import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { assertSameOrigin, fail, ok, parseBody, route } from '@/lib/http';
import { requireAdmin } from '@/lib/auth/admin';
import { categoryUpdateSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: Request, { params }: Context) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = await parseBody(request, categoryUpdateSchema);
  if (parsed.error) return parsed.error;

  try {
    const category = await prisma.category.update({ where: { id }, data: parsed.data });
    return ok({ category });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') return fail('Category not found.', 404);
      if (error.code === 'P2002') return fail('A category with that slug already exists.', 409);
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

  const category = await prisma.category.findUnique({
    where: { id },
    select: { _count: { select: { products: true } } },
  });
  if (!category) return fail('Category not found.', 404);

  if (category._count.products > 0) {
    return fail(
      `This category still has ${category._count.products} product(s). Move them to another category first.`,
      409,
    );
  }

  await prisma.category.delete({ where: { id } });
  return ok({ deleted: true });
});
