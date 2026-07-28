import { prisma } from '@/lib/db';

/**
 * Storefront catalogue queries.
 *
 * This replaces the hardcoded lib/products.ts as the source of truth. That file
 * is kept only so the seed script can import the original catalogue once.
 */

export type CatalogMedia = {
  type: 'IMAGE' | 'VIDEO';
  url: string;
  posterUrl: string | null;
  alt: string;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAt: number | null;
  highlights: string[];
  featured: boolean;
  stock: number | null;
  media: CatalogMedia[];
  category: { slug: string; label: string } | null;
};

export type CatalogCategory = {
  id: string;
  slug: string;
  label: string;
  blurb: string;
  productCount: number;
};

/**
 * Runs a storefront read, falling back to `empty` if the database is
 * unreachable.
 *
 * Shop pages should degrade to "nothing to show" rather than a 500 when
 * Postgres has a blip — and the same applies at build time, where an
 * unreachable database would otherwise fail the entire deployment.
 *
 * Deliberately NOT used by the admin dashboard: there, a database error must
 * surface rather than be silently rendered as an empty store.
 */
/** Placeholder host shipped in .env.example — a sure sign nothing was configured. */
const PLACEHOLDER_DB_HOST = 'aws-0-REGION';

/** Prisma's "can't reach database server". */
function isUnreachable(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P1001'
  );
}

/**
 * Only warn once per process. Every page renders several catalogue queries, so
 * without this a single misconfiguration floods the console (and Next's dev
 * overlay) with identical stack traces that bury the actual instruction.
 */
let warnedUnreachable = false;

function warnUnreachableOnce() {
  if (warnedUnreachable) return;
  warnedUnreachable = true;

  if ((process.env.DATABASE_URL ?? '').includes(PLACEHOLDER_DB_HOST)) {
    console.error(
      '\n[maitra] DATABASE_URL is still the placeholder from .env.example.\n' +
        '         The storefront will show an empty catalogue until it is set.\n' +
        '         1. Create a project at https://supabase.com\n' +
        '         2. In .env.local set DATABASE_URL to the pooled url (port 6543)\n' +
        '            and DIRECT_URL to the direct url (port 5432)\n' +
        '         3. Run: npm run db:migrate && npm run seed\n' +
        '         See DEPLOYMENT.md for the full walkthrough.\n',
    );
    return;
  }

  console.error(
    '\n[maitra] Cannot reach the database. The storefront is serving an empty\n' +
      '         catalogue until it recovers. Check DATABASE_URL and that the\n' +
      '         Supabase project is running (free projects pause when idle).\n',
  );
}

async function safeRead<T>(label: string, run: () => Promise<T>, empty: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (isUnreachable(error)) {
      warnUnreachableOnce();
      return empty;
    }
    console.error(`[catalog] ${label} failed — serving empty result:`, error);
    return empty;
  }
}

const productSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  price: true,
  compareAt: true,
  highlights: true,
  featured: true,
  stock: true,
  media: {
    orderBy: { position: 'asc' },
    select: { type: true, url: true, posterUrl: true, alt: true },
  },
  category: { select: { slug: true, label: true } },
} as const;

function toCatalogProduct(row: {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAt: number | null;
  highlights: string[];
  featured: boolean;
  stock: number | null;
  media: { type: string; url: string; posterUrl: string | null; alt: string | null }[];
  category: { slug: string; label: string } | null;
}): CatalogProduct {
  return {
    ...row,
    media: row.media.map((item) => ({
      type: item.type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
      url: item.url,
      posterUrl: item.posterUrl,
      alt: item.alt ?? row.name,
    })),
  };
}

export async function getProducts(options?: {
  category?: string;
  featured?: boolean;
  search?: string;
}): Promise<CatalogProduct[]> {
  return safeRead(
    'getProducts',
    async () => {
      const rows = await prisma.product.findMany({
        where: {
          active: true,
          ...(options?.category ? { category: { slug: options.category } } : {}),
          ...(options?.featured ? { featured: true } : {}),
          ...(options?.search
            ? {
                OR: [
                  { name: { contains: options.search, mode: 'insensitive' } },
                  { description: { contains: options.search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        select: productSelect,
      });

      return rows.map(toCatalogProduct);
    },
    [],
  );
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  return safeRead(
    'getProductBySlug',
    async () => {
      const row = await prisma.product.findFirst({
        where: { slug, active: true },
        select: productSelect,
      });
      return row ? toCatalogProduct(row) : null;
    },
    null,
  );
}

export async function getCategories(): Promise<CatalogCategory[]> {
  return safeRead(
    'getCategories',
    async () => {
      const rows = await prisma.category.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
        select: {
          id: true,
          slug: true,
          label: true,
          blurb: true,
          _count: { select: { products: { where: { active: true } } } },
        },
      });

      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        label: row.label,
        blurb: row.blurb,
        productCount: row._count.products,
      }));
    },
    [],
  );
}

/** Slugs of every active product — used to pre-render product pages. */
export async function getAllProductSlugs(): Promise<string[]> {
  return safeRead(
    'getAllProductSlugs',
    async () => {
      const rows = await prisma.product.findMany({
        where: { active: true },
        select: { slug: true },
      });
      return rows.map((row) => row.slug);
    },
    [],
  );
}

/**
 * Editable site settings, merged over the defaults in lib/site.ts so the
 * storefront still renders correctly before anything has been saved.
 */
export async function getSiteSettings(): Promise<Record<string, string>> {
  return safeRead(
    'getSiteSettings',
    async () => {
      const rows = await prisma.siteSetting.findMany();
      return Object.fromEntries(
        rows
          .filter((row) => typeof row.value === 'string')
          .map((row) => [row.key, row.value as string]),
      );
    },
    {},
  );
}
