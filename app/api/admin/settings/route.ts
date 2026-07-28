import { z } from 'zod';
import { prisma } from '@/lib/db';
import { assertSameOrigin, ok, parseBody, route } from '@/lib/http';
import { requireAdmin } from '@/lib/auth/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Editable site content. Keys are whitelisted so the dashboard can't be used to
 * write arbitrary rows into the settings table.
 */
const EDITABLE_KEYS = [
  'announcement',
  'whatsappNumber',
  'phoneDisplay',
  'email',
  'instagram',
  'upiId',
  'upiPayeeName',
  'gpayNumber',
  'shippingNote',
] as const;

const schema = z.object({
  settings: z.record(z.enum(EDITABLE_KEYS), z.string().max(1000)),
});

export const GET = route(async () => {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const rows = await prisma.siteSetting.findMany();
  const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return ok({ settings, editableKeys: EDITABLE_KEYS });
});

export const PATCH = route(async (request: Request) => {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, schema);
  if (parsed.error) return parsed.error;

  const entries = Object.entries(parsed.data.settings);

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  );

  return ok({ updated: entries.length });
});
