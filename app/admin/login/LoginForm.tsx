'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Admin sign-in.
 *
 * The username field is intentionally `type="text"`, not `type="email"` — the
 * configured account ("maitra@admin") is an identifier, not a deliverable email
 * address, and browsers reject it under email validation.
 */
export default function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const body = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(body.error || 'Sign in failed. Please try again.');
        setBusy(false);
        return;
      }

      // Only allow same-origin redirects — a relative path starting with a
      // single "/" — so ?next= can't be used to bounce an admin off-site.
      const safeNext =
        nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/admin';

      router.replace(safeNext);
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div>
        <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-denim-800">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          autoFocus
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-lg border border-mist-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-denim-500 focus:ring-2 focus:ring-denim-200"
          placeholder="maitra@admin"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-denim-800">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-mist-300 px-3 py-2.5 pr-16 text-sm outline-none transition-colors focus:border-denim-500 focus:ring-2 focus:ring-denim-200"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-semibold uppercase tracking-wide text-denim-600 hover:text-denim-800"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
