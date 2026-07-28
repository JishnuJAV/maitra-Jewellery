import { z } from 'zod';
import { assertSameOrigin, fail, ok, parseBody, route } from '@/lib/http';
import { requireAdmin } from '@/lib/auth/admin';
import { createSignedUpload } from '@/lib/cloudinary';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  resourceType: z.enum(['image', 'video']),
});

/**
 * Issues a short-lived Cloudinary upload signature.
 *
 * Admin-only: without this guard anyone could obtain signatures and dump files
 * into the store's Cloudinary account at the owner's expense.
 */
export const POST = route(async (request: Request) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  if (!serverEnv.cloudinaryConfigured) {
    return fail(
      'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to your environment.',
      503,
    );
  }

  const parsed = await parseBody(request, schema);
  if (parsed.error) return parsed.error;

  return ok(createSignedUpload(parsed.data.resourceType));
});
