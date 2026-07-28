import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { assertSameOrigin, fail, ok, parseBody, route } from '@/lib/http';
import { requireAdmin } from '@/lib/auth/admin';
import { categorySchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    include: { _count: { select: { products: true } } },
  });

  return ok({ categories });
});

export const POST = route(async (request: Request) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, categorySchema);
  if (parsed.error) return parsed.error;

  try {
    const category = await prisma.category.create({ data: parsed.data });
    return ok({ category }, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return fail('A category with that slug already exists.', 409);
    }
    throw error;
  }
});
