'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      onClick={async () => {
        setBusy(true);
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
        router.replace('/');
        router.refresh();
      }}
      disabled={busy}
      className="btn-outline !px-5 !py-2 !text-xs"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
