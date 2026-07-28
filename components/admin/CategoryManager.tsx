'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, EmptyState } from '@/components/admin/ui';

export type CategoryRow = {
  id: string;
  slug: string;
  label: string;
  blurb: string;
  sortOrder: number;
  active: boolean;
  productCount: number;
};

const inputClass =
  'w-full rounded-lg border border-mist-300 px-3 py-2 text-sm outline-none transition-colors focus:border-denim-500 focus:ring-2 focus:ring-denim-200';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function CategoryManager({ initial }: { initial: CategoryRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function send(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(payload.error || 'Something went wrong.');
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError('Could not reach the server. Please try again.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Card
        title="All categories"
        action={
          !creating && (
            <button onClick={() => setCreating(true)} className="btn-primary !px-4 !py-2 !text-xs">
              Add category
            </button>
          )
        }
      >
        {creating && (
          <CategoryEditor
            busy={busy}
            onCancel={() => setCreating(false)}
            onSave={async (values) => {
              const done = await send('/api/admin/categories', 'POST', values);
              if (done) setCreating(false);
            }}
          />
        )}

        {initial.length === 0 && !creating ? (
          <EmptyState message="No categories yet" hint="Add one to start organising your products." />
        ) : (
          <ul className="divide-y divide-mist-100">
            {initial.map((category) =>
              editingId === category.id ? (
                <li key={category.id} className="py-3">
                  <CategoryEditor
                    initial={category}
                    busy={busy}
                    onCancel={() => setEditingId(null)}
                    onSave={async (values) => {
                      const done = await send(`/api/admin/categories/${category.id}`, 'PATCH', values);
                      if (done) setEditingId(null);
                    }}
                  />
                </li>
              ) : (
                <li key={category.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-denim-800">
                      {category.label}
                      {!category.active && (
                        <span className="ml-2 rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                          Hidden
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      /{category.slug} · {category.productCount} product
                      {category.productCount === 1 ? '' : 's'}
                      {category.blurb && ` · ${category.blurb}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs">
                    <button
                      onClick={() => setEditingId(category.id)}
                      className="font-medium text-denim-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete “${category.label}”? Products must be moved to another category first.`,
                          )
                        ) {
                          void send(`/api/admin/categories/${category.id}`, 'DELETE');
                        }
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </Card>
    </div>
  );
}

function CategoryEditor({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial?: CategoryRow;
  busy: boolean;
  onSave: (values: {
    slug: string;
    label: string;
    blurb: string;
    sortOrder: number;
    active: boolean;
  }) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [blurb, setBlurb] = useState(initial?.blurb ?? '');
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [active, setActive] = useState(initial?.active ?? true);

  return (
    <div className="rounded-xl border border-mist-200 bg-mist-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-denim-800">Label</span>
          <input
            value={label}
            onChange={(event) => {
              setLabel(event.target.value);
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
            className={inputClass}
            placeholder="Kemp & Palakka"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-denim-800">Slug</span>
          <input
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            className={inputClass}
            placeholder="kemp-palakka"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-denim-800">Short description</span>
          <input
            value={blurb}
            onChange={(event) => setBlurb(event.target.value)}
            className={inputClass}
            placeholder="Kerala-style green palakka and ruby kemp stone sets."
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-denim-800">Sort order</span>
          <input
            inputMode="numeric"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value.replace(/\D/g, ''))}
            className={inputClass}
          />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            className="h-4 w-4 rounded border-mist-300 text-denim-700"
          />
          <span className="text-denim-800">Visible in store</span>
        </label>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onSave({ slug, label, blurb, sortOrder: Number(sortOrder) || 0, active })}
          disabled={busy || !label.trim() || !slug.trim()}
          className="btn-primary !px-4 !py-2 !text-xs"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} disabled={busy} className="btn-outline !px-4 !py-2 !text-xs">
          Cancel
        </button>
      </div>
    </div>
  );
}
