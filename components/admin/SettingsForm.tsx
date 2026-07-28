'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/admin/ui';

export type SettingField = {
  key: string;
  label: string;
  hint?: string;
  multiline: boolean;
  value: string;
};

const inputClass =
  'w-full rounded-lg border border-mist-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-denim-500 focus:ring-2 focus:ring-denim-200';

export default function SettingsForm({ fields }: { fields: SettingField[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((field) => [field.key, field.value])),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: values }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(body.error || 'Could not save settings.');
        return;
      }

      setMessage('Settings saved.');
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
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

      <Card title="Store details">
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label htmlFor={field.key} className="mb-1.5 block text-sm font-medium text-denim-800">
                {field.label}
              </label>
              {field.multiline ? (
                <textarea
                  id={field.key}
                  rows={2}
                  maxLength={1000}
                  value={values[field.key] ?? ''}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                  className={inputClass}
                />
              ) : (
                <input
                  id={field.key}
                  maxLength={1000}
                  value={values[field.key] ?? ''}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                  className={inputClass}
                />
              )}
              {field.hint && <p className="mt-1 text-xs text-neutral-500">{field.hint}</p>}
            </div>
          ))}
        </div>
      </Card>

      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  );
}
