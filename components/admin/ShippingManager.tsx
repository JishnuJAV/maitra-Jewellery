'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatINR } from '@/lib/format';
import { Card, EmptyState } from '@/components/admin/ui';

export type ShippingRow = {
  id: string;
  name: string;
  fee: number;
  freeAbove: number | null;
  states: string[];
  pincodePrefixes: string[];
  isDefault: boolean;
  active: boolean;
  sortOrder: number;
  etaDays: string | null;
};

const inputClass =
  'w-full rounded-lg border border-mist-300 px-3 py-2 text-sm outline-none transition-colors focus:border-denim-500 focus:ring-2 focus:ring-denim-200';

export default function ShippingManager({ initial }: { initial: ShippingRow[] }) {
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

  const hasDefault = initial.some((rate) => rate.isDefault && rate.active);

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!hasDefault && initial.length > 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No active default rule. Orders from regions you have not listed will be charged ₹0
          shipping. Mark one region as the default.
        </p>
      )}

      <Card
        title="Delivery regions"
        action={
          !creating && (
            <button onClick={() => setCreating(true)} className="btn-primary !px-4 !py-2 !text-xs">
              Add region
            </button>
          )
        }
      >
        {creating && (
          <div className="mb-4">
            <RateEditor
              busy={busy}
              onCancel={() => setCreating(false)}
              onSave={async (values) => {
                const done = await send('/api/admin/shipping', 'POST', values);
                if (done) setCreating(false);
              }}
            />
          </div>
        )}

        {initial.length === 0 && !creating ? (
          <EmptyState
            message="No shipping regions yet"
            hint="Add at least one default region so every order gets a delivery charge."
          />
        ) : (
          <ul className="divide-y divide-mist-100">
            {initial.map((rate) =>
              editingId === rate.id ? (
                <li key={rate.id} className="py-3">
                  <RateEditor
                    initial={rate}
                    busy={busy}
                    onCancel={() => setEditingId(null)}
                    onSave={async (values) => {
                      const done = await send(`/api/admin/shipping/${rate.id}`, 'PATCH', values);
                      if (done) setEditingId(null);
                    }}
                  />
                </li>
              ) : (
                <li key={rate.id} className="flex flex-wrap items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-denim-800">
                      {rate.name}
                      {rate.isDefault && (
                        <span className="ml-2 rounded-full border border-sky-200 bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-600">
                          Default
                        </span>
                      )}
                      {!rate.active && (
                        <span className="ml-2 rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                          Inactive
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-600">
                      {rate.fee === 0 ? 'Free delivery' : `${formatINR(rate.fee)} delivery`}
                      {rate.freeAbove !== null && ` · free over ${formatINR(rate.freeAbove)}`}
                      {rate.etaDays && ` · ${rate.etaDays}`}
                    </p>
                    {(rate.states.length > 0 || rate.pincodePrefixes.length > 0) && (
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {rate.states.length > 0 && `States: ${rate.states.join(', ')}`}
                        {rate.states.length > 0 && rate.pincodePrefixes.length > 0 && ' · '}
                        {rate.pincodePrefixes.length > 0 &&
                          `PIN codes starting: ${rate.pincodePrefixes.join(', ')}`}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs">
                    <button
                      onClick={() => setEditingId(rate.id)}
                      className="font-medium text-denim-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete the “${rate.name}” shipping rule?`)) {
                          void send(`/api/admin/shipping/${rate.id}`, 'DELETE');
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

function RateEditor({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial?: ShippingRow;
  busy: boolean;
  onSave: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [fee, setFee] = useState(String(initial?.fee ?? 0));
  const [freeAbove, setFreeAbove] = useState(
    initial?.freeAbove === null || initial?.freeAbove === undefined ? '' : String(initial.freeAbove),
  );
  const [states, setStates] = useState((initial?.states ?? []).join(', '));
  const [prefixes, setPrefixes] = useState((initial?.pincodePrefixes ?? []).join(', '));
  const [etaDays, setEtaDays] = useState(initial?.etaDays ?? '');
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [active, setActive] = useState(initial?.active ?? true);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));

  function splitList(value: string) {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return (
    <div className="rounded-xl border border-mist-200 bg-mist-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-denim-800">Region name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
            placeholder="Kerala"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-denim-800">Delivery charge (₹)</span>
          <input
            inputMode="numeric"
            value={fee}
            onChange={(event) => setFee(event.target.value.replace(/\D/g, ''))}
            className={inputClass}
            placeholder="60"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-denim-800">
            Free delivery above (₹)
          </span>
          <input
            inputMode="numeric"
            value={freeAbove}
            onChange={(event) => setFreeAbove(event.target.value.replace(/\D/g, ''))}
            className={inputClass}
            placeholder="Leave empty for never"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-denim-800">Delivery estimate</span>
          <input
            value={etaDays}
            onChange={(event) => setEtaDays(event.target.value)}
            className={inputClass}
            placeholder="3-5 days"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-denim-800">States</span>
          <input
            value={states}
            onChange={(event) => setStates(event.target.value)}
            className={inputClass}
            placeholder="Tamil Nadu, Karnataka, Telangana"
          />
          <span className="mt-1 block text-xs text-neutral-500">
            Comma separated. Matched against the state chosen at checkout.
          </span>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-denim-800">PIN code prefixes</span>
          <input
            value={prefixes}
            onChange={(event) => setPrefixes(event.target.value)}
            className={inputClass}
            placeholder="67, 68, 69"
          />
          <span className="mt-1 block text-xs text-neutral-500">
            Comma separated. The longest matching prefix wins, so “682” overrides “68”.
          </span>
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
        <div className="flex items-end gap-4 pb-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(event) => setIsDefault(event.target.checked)}
              className="h-4 w-4 rounded border-mist-300 text-denim-700"
            />
            <span className="text-denim-800">Default</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
              className="h-4 w-4 rounded border-mist-300 text-denim-700"
            />
            <span className="text-denim-800">Active</span>
          </label>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() =>
            onSave({
              name,
              fee: Number(fee) || 0,
              freeAbove: freeAbove.trim() === '' ? null : Number(freeAbove),
              states: splitList(states),
              pincodePrefixes: splitList(prefixes),
              etaDays: etaDays.trim() === '' ? null : etaDays.trim(),
              isDefault,
              active,
              sortOrder: Number(sortOrder) || 0,
            })
          }
          disabled={busy || !name.trim()}
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
