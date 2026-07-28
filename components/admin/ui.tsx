import type { ReactNode } from 'react';

/** Shared presentational primitives for the admin dashboard. */

export function Card({
  title,
  action,
  children,
  className = '',
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-mist-200 bg-white p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-serif text-lg font-semibold text-denim-800">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/**
 * KPI tile. A single headline number is a stat tile, not a one-bar chart —
 * the number itself is the visualisation.
 */
export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'accent' | 'warn';
}) {
  const valueTone =
    tone === 'accent' ? 'text-denim-800' : tone === 'warn' ? 'text-amber-700' : 'text-denim-800';

  return (
    <div className="rounded-2xl border border-mist-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`mt-2 font-serif text-3xl font-semibold tabular-nums ${valueTone}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  // Status colours are reserved for state and never reused as series colours.
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-sky-100 text-sky-600 border-sky-200',
  PACKED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  SHIPPED: 'bg-blue-50 text-blue-700 border-blue-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  UNPAID: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  AWAITING_CONFIRMATION: 'bg-amber-50 text-amber-800 border-amber-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REFUNDED: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {humanise(status)}
    </span>
  );
}

export function humanise(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-mist-300 px-4 py-10 text-center">
      <p className="text-sm font-medium text-neutral-600">{message}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
