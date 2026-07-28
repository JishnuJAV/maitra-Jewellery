'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MediaUploader, { type MediaItem } from '@/components/admin/MediaUploader';

export type ProductFormValues = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  price: string;
  compareAt: string;
  stock: string;
  categoryId: string;
  highlights: string;
  featured: boolean;
  active: boolean;
  sortOrder: string;
  media: MediaItem[];
};

export type CategoryOption = { id: string; label: string };

/** Turns a product name into a URL slug, matching the server-side slug rules. */
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ProductForm({
  initial,
  categories,
}: {
  initial: ProductFormValues;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const isEdit = Boolean(initial.id);

  const [values, setValues] = useState<ProductFormValues>(initial);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleNameChange(name: string) {
    setValues((current) => ({
      ...current,
      name,
      // Keep the slug in step with the name until the admin edits it by hand;
      // never auto-change a slug that's already live (it would break links).
      slug: slugTouched ? current.slug : slugify(name),
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    const price = Number(values.price);
    if (!Number.isInteger(price) || price < 0) {
      setError('Price must be a whole number of rupees.');
      return;
    }

    const compareAt = values.compareAt.trim() === '' ? null : Number(values.compareAt);
    if (compareAt !== null && (!Number.isInteger(compareAt) || compareAt < 0)) {
      setError('Compare-at price must be a whole number of rupees.');
      return;
    }
    if (compareAt !== null && compareAt <= price) {
      setError('Compare-at price should be higher than the selling price, or left empty.');
      return;
    }

    const stock = values.stock.trim() === '' ? null : Number(values.stock);
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      setError('Stock must be a whole number, or left empty if you do not track it.');
      return;
    }

    setBusy(true);

    const payload = {
      slug: values.slug,
      name: values.name,
      description: values.description,
      price,
      compareAt,
      stock,
      categoryId: values.categoryId || null,
      highlights: values.highlights
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      featured: values.featured,
      active: values.active,
      sortOrder: Number(values.sortOrder) || 0,
      media: values.media.map((item) => ({
        type: item.type,
        url: item.url,
        publicId: item.publicId,
        posterUrl: item.posterUrl,
        alt: item.alt,
        width: item.width,
        height: item.height,
      })),
    };

    try {
      const response = await fetch(
        isEdit ? `/api/admin/products/${initial.id}` : '/api/admin/products',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(body.error || 'Could not save the product.');
        setBusy(false);
        return;
      }

      router.push('/admin/products');
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-mist-200 bg-white p-5">
            <h2 className="mb-4 font-serif text-lg font-semibold text-denim-800">Details</h2>

            <div className="space-y-4">
              <Field label="Product name" htmlFor="name">
                <input
                  id="name"
                  required
                  maxLength={200}
                  value={values.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  className={inputClass}
                  placeholder="Royal Green Palakka Necklace Set"
                />
              </Field>

              <Field
                label="URL slug"
                htmlFor="slug"
                hint="Appears in the product link. Changing it breaks any shared links."
              >
                <input
                  id="slug"
                  required
                  value={values.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    update('slug', slugify(event.target.value));
                  }}
                  className={inputClass}
                  placeholder="green-palakka-necklace-set"
                />
              </Field>

              <Field label="Description" htmlFor="description">
                <textarea
                  id="description"
                  rows={5}
                  maxLength={5000}
                  value={values.description}
                  onChange={(event) => update('description', event.target.value)}
                  className={inputClass}
                  placeholder="Describe the piece, its finish, and what it pairs with."
                />
              </Field>

              <Field
                label="Highlights"
                htmlFor="highlights"
                hint="One per line. Shown as bullet points on the product page."
              >
                <textarea
                  id="highlights"
                  rows={4}
                  value={values.highlights}
                  onChange={(event) => update('highlights', event.target.value)}
                  className={inputClass}
                  placeholder={'Green palakka + red kemp stones\nAntique gold finish\nMatching earrings included'}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-mist-200 bg-white p-5">
            <h2 className="mb-1 font-serif text-lg font-semibold text-denim-800">
              Photos &amp; video
            </h2>
            <p className="mb-4 text-sm text-neutral-500">
              Add as many photos as you like, plus an optional video. The first item is used as the
              main image.
            </p>
            <MediaUploader items={values.media} onChange={(media) => update('media', media)} />
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-mist-200 bg-white p-5">
            <h2 className="mb-4 font-serif text-lg font-semibold text-denim-800">Pricing</h2>
            <div className="space-y-4">
              <Field label="Price (₹)" htmlFor="price">
                <input
                  id="price"
                  required
                  inputMode="numeric"
                  value={values.price}
                  onChange={(event) => update('price', event.target.value.replace(/\D/g, ''))}
                  className={inputClass}
                  placeholder="462"
                />
              </Field>
              <Field
                label="Compare-at price (₹)"
                htmlFor="compareAt"
                hint="Optional. Shown struck through to display a discount."
              >
                <input
                  id="compareAt"
                  inputMode="numeric"
                  value={values.compareAt}
                  onChange={(event) => update('compareAt', event.target.value.replace(/\D/g, ''))}
                  className={inputClass}
                  placeholder="615"
                />
              </Field>
              <Field
                label="Stock"
                htmlFor="stock"
                hint="Leave empty if you do not track stock for this item."
              >
                <input
                  id="stock"
                  inputMode="numeric"
                  value={values.stock}
                  onChange={(event) => update('stock', event.target.value.replace(/\D/g, ''))}
                  className={inputClass}
                  placeholder="—"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-mist-200 bg-white p-5">
            <h2 className="mb-4 font-serif text-lg font-semibold text-denim-800">Organisation</h2>
            <div className="space-y-4">
              <Field label="Category" htmlFor="categoryId">
                <select
                  id="categoryId"
                  value={values.categoryId}
                  onChange={(event) => update('categoryId', event.target.value)}
                  className={inputClass}
                >
                  <option value="">Uncategorised</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Sort order"
                htmlFor="sortOrder"
                hint="Lower numbers appear first in listings."
              >
                <input
                  id="sortOrder"
                  inputMode="numeric"
                  value={values.sortOrder}
                  onChange={(event) => update('sortOrder', event.target.value.replace(/\D/g, ''))}
                  className={inputClass}
                />
              </Field>

              <label className="flex items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.featured}
                  onChange={(event) => update('featured', event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-mist-300 text-denim-700"
                />
                <span>
                  <span className="font-medium text-denim-800">Featured</span>
                  <span className="block text-xs text-neutral-500">
                    Show in the homepage collection.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.active}
                  onChange={(event) => update('active', event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-mist-300 text-denim-700"
                />
                <span>
                  <span className="font-medium text-denim-800">Visible in store</span>
                  <span className="block text-xs text-neutral-500">
                    Uncheck to hide without deleting.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <div className="flex gap-3">
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
            </button>
            <Link href="/admin/products" className="btn-outline">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}

const inputClass =
  'w-full rounded-lg border border-mist-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-denim-500 focus:ring-2 focus:ring-denim-200';

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-denim-800">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
