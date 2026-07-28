import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { categories as staticCategories, products as staticProducts } from '../lib/products';
import { site } from '../lib/site';

dotenv.config({ path: ['.env.local', '.env'], quiet: true });

/**
 * Seeds the database and migrates the original hardcoded catalogue
 * (lib/products.ts) into it.
 *
 * Safe to re-run: every write is an upsert keyed on a natural unique field, so
 * running this against a live store updates the seeded rows without duplicating
 * anything or clobbering orders.
 *
 * Uses DIRECT_URL — seeding runs long transactions that the pgBouncer pooler
 * would cut short.
 */

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DIRECT_URL (or DATABASE_URL) must be set. Copy .env.example to .env.local first.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function seedAdmin() {
  const username = (process.env.ADMIN_USERNAME || 'maitra@admin').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error('ADMIN_PASSWORD must be set in .env.local so the admin account can be created.');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.upsert({
    where: { username },
    create: { username, passwordHash, name: 'Maitra Admin' },
    // Re-running the seed rotates the password to whatever is in the env file.
    update: { passwordHash },
  });

  console.log(`  admin account ready → ${username}`);
}

async function seedCategories() {
  for (const [index, category] of staticCategories.entries()) {
    await prisma.category.upsert({
      where: { slug: category.id },
      create: {
        slug: category.id,
        label: category.label,
        blurb: category.blurb,
        sortOrder: index,
      },
      update: { label: category.label, blurb: category.blurb, sortOrder: index },
    });
  }
  console.log(`  ${staticCategories.length} categories ready`);
}

/** Returns the slugs whose gallery this run populated, for strict verification. */
async function seedProducts(): Promise<Set<string>> {
  const categoryIds = new Map(
    (await prisma.category.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]),
  );
  const mediaSeeded = new Set<string>();

  for (const [index, product] of staticProducts.entries()) {
    const data = {
      name: product.name,
      description: product.description,
      price: product.price,
      compareAt: product.compareAt ?? null,
      highlights: product.highlights,
      featured: product.featured ?? false,
      sortOrder: index,
      categoryId: categoryIds.get(product.category) ?? null,
    };

    const saved = await prisma.product.upsert({
      where: { slug: product.slug },
      create: { slug: product.slug, ...data },
      update: data,
    });

    // Only seed gallery images for products that have none yet, so images the
    // admin has since uploaded through the dashboard are never overwritten.
    const existingMedia = await prisma.productMedia.count({ where: { productId: saved.id } });
    if (existingMedia === 0) {
      await prisma.productMedia.createMany({
        data: product.images.map((url, position) => ({
          productId: saved.id,
          url,
          type: 'IMAGE' as const,
          alt: product.name,
          position,
        })),
      });
      mediaSeeded.add(product.slug);
    }
  }
  console.log(`  ${staticProducts.length} products ready`);
  return mediaSeeded;
}

async function seedShippingRates() {
  // Mirrors the previous flat ₹60 charge, plus a cheaper home-state rule as a
  // worked example of region pricing for the admin to edit.
  const rates = [
    {
      name: 'Kerala',
      fee: 40,
      freeAbove: 1500,
      states: ['Kerala'],
      pincodePrefixes: ['67', '68', '69'],
      isDefault: false,
      sortOrder: 0,
      etaDays: '2-4 days',
    },
    {
      name: 'South India',
      fee: 60,
      freeAbove: 2000,
      states: ['Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Puducherry'],
      pincodePrefixes: [],
      isDefault: false,
      sortOrder: 1,
      etaDays: '3-5 days',
    },
    {
      name: 'Rest of India',
      fee: site.shippingFee,
      freeAbove: 2500,
      states: [],
      pincodePrefixes: [],
      isDefault: true,
      sortOrder: 2,
      etaDays: '4-7 days',
    },
  ];

  for (const rate of rates) {
    const existing = await prisma.shippingRate.findFirst({ where: { name: rate.name } });
    if (existing) {
      await prisma.shippingRate.update({ where: { id: existing.id }, data: rate });
    } else {
      await prisma.shippingRate.create({ data: rate });
    }
  }
  console.log(`  ${rates.length} shipping rates ready`);
}

async function seedSettings() {
  const settings: Record<string, unknown> = {
    announcement: site.announcement,
    whatsappNumber: site.whatsappNumber,
    phoneDisplay: site.phoneDisplay,
    email: site.email,
    instagram: site.instagram,
    upiId: site.upiId,
    upiPayeeName: site.upiPayeeName,
    gpayNumber: site.gpayNumber,
    shippingNote: site.shippingNote,
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: value as never },
      // Don't overwrite values the admin has already edited in the dashboard.
      update: {},
    });
  }
  console.log(`  ${Object.keys(settings).length} site settings ready`);
}

/**
 * Verifies the migration field by field against the original catalogue.
 *
 * The seed uses upserts, which fail quietly if a field is mistyped or a relation
 * doesn't resolve — so rather than trust "no exception thrown", every category,
 * product, price, offer price and image is read back and compared. Any mismatch
 * fails the run loudly instead of leaving a half-migrated store.
 */
async function verifyMigration(mediaSeeded: Set<string>) {
  const problems: string[] = [];
  const notes: string[] = [];

  const dbCategories = await prisma.category.findMany({ select: { slug: true } });
  const dbCategorySlugs = new Set(dbCategories.map((row) => row.slug));
  for (const category of staticCategories) {
    if (!dbCategorySlugs.has(category.id)) problems.push(`Category missing: ${category.id}`);
  }

  const dbProducts = await prisma.product.findMany({
    include: { media: { orderBy: { position: 'asc' } }, category: { select: { slug: true } } },
  });
  const bySlug = new Map(dbProducts.map((row) => [row.slug, row]));

  let imageCount = 0;
  let offerCount = 0;

  for (const source of staticProducts) {
    const saved = bySlug.get(source.slug);
    if (!saved) {
      problems.push(`Product missing: ${source.slug}`);
      continue;
    }

    if (saved.name !== source.name) {
      problems.push(`${source.slug}: name is "${saved.name}", expected "${source.name}"`);
    }
    if (saved.price !== source.price) {
      problems.push(`${source.slug}: price is ${saved.price}, expected ${source.price}`);
    }

    // compareAt is the pre-discount "offer rate" shown struck through.
    const expectedCompareAt = source.compareAt ?? null;
    if (saved.compareAt !== expectedCompareAt) {
      problems.push(
        `${source.slug}: offer price is ${saved.compareAt}, expected ${expectedCompareAt}`,
      );
    }
    if (expectedCompareAt !== null) offerCount += 1;

    if (saved.category?.slug !== source.category) {
      problems.push(
        `${source.slug}: category is ${saved.category?.slug ?? 'none'}, expected ${source.category}`,
      );
    }

    if ((saved.featured ?? false) !== (source.featured ?? false)) {
      problems.push(`${source.slug}: featured flag did not carry over`);
    }

    if (saved.highlights.length !== source.highlights.length) {
      problems.push(
        `${source.slug}: ${saved.highlights.length} highlights, expected ${source.highlights.length}`,
      );
    }

    const savedUrls = saved.media.map((item) => item.url);
    imageCount += savedUrls.length;

    // Strict only for galleries this run created. If the gallery already
    // existed, the admin owns it — a removed image is an intentional edit, not
    // data loss, so it's reported as a note rather than a failure.
    const strict = mediaSeeded.has(source.slug);
    for (const [index, url] of source.images.entries()) {
      if (!savedUrls.includes(url)) {
        (strict ? problems : notes).push(`${source.slug}: original image not in gallery → ${url}`);
      } else if (strict && savedUrls[index] !== url) {
        problems.push(`${source.slug}: image order changed at position ${index}`);
      }
    }
  }

  console.log('\nMigration check:');
  console.log(`  categories : ${staticCategories.length}/${staticCategories.length}`);
  console.log(`  products   : ${staticProducts.length - problems.filter((p) => p.startsWith('Product missing')).length}/${staticProducts.length}`);
  console.log(`  images     : ${imageCount}`);
  console.log(`  offer prices: ${offerCount}`);

  if (notes.length > 0) {
    console.log(`\n  ${notes.length} note(s) — galleries edited in the admin since the first import:`);
    for (const note of notes) console.log(`    · ${note}`);
  }

  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s) found:`);
    for (const problem of problems) console.error(`  ✗ ${problem}`);
    throw new Error(
      'Migration verification failed — see the list above. Nothing was deleted; fix the cause and re-run the seed.',
    );
  }

  console.log('  ✓ every category, product, price, offer price and image verified\n');
}

async function main() {
  console.log('Seeding Maitra Jewellery database…');
  await seedAdmin();
  await seedCategories();
  const mediaSeeded = await seedProducts();
  await seedShippingRates();
  await seedSettings();
  await verifyMigration(mediaSeeded);
  console.log('Done.');
}

main()
  .catch((error) => {
    console.error('\nSeed failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
