'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProductRowActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        archived?: boolean;
        message?: string;
      };

      if (!response.ok) {
        window.alert(body.error || 'Could not delete this product.');
      } else if (body.archived) {
        // The server hides rather than deletes products that appear in orders.
        window.alert(body.message);
      }
      router.refresh();
    } catch {
      window.alert('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        <span className="text-neutral-600">Delete “{name}”?</span>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="font-medium text-red-600 hover:underline disabled:opacity-60"
        >
          {busy ? 'Deleting…' : 'Yes'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="text-neutral-500 hover:underline"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-3 text-xs">
      <Link href={`/admin/products/${id}`} className="font-medium text-denim-600 hover:underline">
        Edit
      </Link>
      <button onClick={() => setConfirming(true)} className="text-red-600 hover:underline">
        Delete
      </button>
    </span>
  );
}
