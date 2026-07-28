import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { assertSameOrigin, fail, ok, parseBody, route } from '@/lib/http';
import { requireAdmin } from '@/lib/auth/admin';
import { productUpdateSchema } from '@/lib/validation';
import { deleteAsset } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const GET = route(async (_request: Request, { params }: Context) => {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { media: { orderBy: { position: 'asc' } } },
  });

  if (!product) return fail('Product not found.', 404);
  return ok({ product });
});

export const PATCH = route(async (request: Request, { params }: Context) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = await parseBody(request, productUpdateSchema);
  if (parsed.error) return parsed.error;

  const { media, ...fields } = parsed.data;

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true, media: { select: { publicId: true, url: true } } },
  });
  if (!existing) return fail('Product not found.', 404);

  try {
    const product = await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: fields });

      if (media) {
        // Replace the gallery wholesale — simpler and less error-prone than
        // diffing, and the payload always carries the full desired order.
        await tx.productMedia.deleteMany({ where: { productId: id } });
        await tx.productMedia.createMany({
          data: media.map((item, position) => ({ ...item, productId: id, position })),
        });
      }

      return tx.product.findUniqueOrThrow({
        where: { id },
        include: { media: { orderBy: { position: 'asc' } } },
      });
    });

    // Clean up Cloudinary assets that are no longer referenced. Done after the
    // transaction commits so a storage hiccup can't roll back the edit.
    if (media) {
      const keptUrls = new Set(media.map((item) => item.url));
      const orphaned = existing.media.filter((item) => item.publicId && !keptUrls.has(item.url));
      await Promise.all(
        orphaned.map((item) =>
          deleteAsset(item.publicId!, item.url.includes('/video/') ? 'video' : 'image').catch(
            () => undefined,
          ),
        ),
      );
    }

    return ok({ product });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return fail('A product with that slug already exists. Choose a different one.', 409);
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

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      media: { select: { publicId: true, url: true } },
      _count: { select: { orderItems: true } },
    },
  });
  if (!product) return fail('Product not found.', 404);

  // Products that appear in orders are archived rather than deleted, so order
  // history keeps its link to the real product record.
  if (product._count.orderItems > 0) {
    await prisma.product.update({ where: { id }, data: { active: false } });
    return ok({
      archived: true,
      message: 'This product appears in past orders, so it was hidden from the store instead of deleted.',
    });
  }

  await prisma.product.delete({ where: { id } });

  await Promise.all(
    product.media
      .filter((item) => item.publicId)
      .map((item) =>
        deleteAsset(item.publicId!, item.url.includes('/video/') ? 'video' : 'image').catch(
          () => undefined,
        ),
      ),
  );

  return ok({ deleted: true });
});
