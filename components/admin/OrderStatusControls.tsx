'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

const PAYMENT_STATUSES = ['UNPAID', 'AWAITING_CONFIRMATION', 'PAID', 'REFUNDED'] as const;

const inputClass =
  'w-full rounded-lg border border-mist-300 px-3 py-2 text-sm outline-none transition-colors focus:border-denim-500 focus:ring-2 focus:ring-denim-200';

function label(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function OrderStatusControls({
  id,
  status: initialStatus,
  paymentStatus: initialPaymentStatus,
  paymentRef: initialPaymentRef,
  adminNote: initialAdminNote,
}: {
  id: string;
  status: string;
  paymentStatus: string;
  paymentRef: string;
  adminNote: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [paymentRef, setPaymentRef] = useState(initialPaymentRef);
  const [adminNote, setAdminNote] = useState(initialAdminNote);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const dirty =
    status !== initialStatus ||
    paymentStatus !== initialPaymentStatus ||
    paymentRef !== initialPaymentRef ||
    adminNote !== initialAdminNote;

  async function save() {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          paymentStatus,
          paymentRef: paymentRef.trim() || null,
          adminNote: adminNote.trim() || null,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(body.error || 'Could not update the order.');
        return;
      }

      setMessage('Order updated.');
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-denim-800">Order status</span>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {label(value)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-denim-800">Payment status</span>
        <select
          value={paymentStatus}
          onChange={(event) => setPaymentStatus(event.target.value)}
          className={inputClass}
        >
          {PAYMENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {label(value)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-denim-800">Payment reference</span>
        <input
          value={paymentRef}
          onChange={(event) => setPaymentRef(event.target.value)}
          className={inputClass}
          placeholder="UPI transaction ID"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-denim-800">Internal note</span>
        <textarea
          rows={3}
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
          className={inputClass}
          placeholder="Only visible to you"
        />
      </label>

      <button onClick={save} disabled={busy || !dirty} className="btn-primary w-full">
        {busy ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}
