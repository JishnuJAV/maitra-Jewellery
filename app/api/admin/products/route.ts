import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { assertSameOrigin, fail, ok, parseBody, route } from '@/lib/http';
import { requireAdmin } from '@/lib/auth/admin';
import { productSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      category: { select: { id: true, label: true, slug: true } },
      media: { orderBy: { position: 'asc' } },
    },
  });

  return ok({ products });
});

export const POST = route(async (request: Request) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, productSchema);
  if (parsed.error) return parsed.error;

  const { media, ...fields } = parsed.data;

  try {
    const product = await prisma.product.create({
      data: {
        ...fields,
        media: {
          // Array order is the gallery order; index 0 is the primary image.
          create: media.map((item, position) => ({ ...item, position })),
        },
      },
      include: { media: { orderBy: { position: 'asc' } } },
    });

    return ok({ product }, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return fail('A product with that slug already exists. Choose a different one.', 409);
    }
    throw error;
  }
});
