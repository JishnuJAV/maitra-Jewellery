import Image from 'next/image';
import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign in — Maitra Admin',
  robots: { index: false, follow: false },
};

// Session state differs per request, so this page must never be cached.
export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/logo.jpg"
            alt="Maitra Jewellery"
            width={96}
            height={96}
            // h-24/w-24 match the 96px props — see the note in AdminShell.
            className="mx-auto h-24 w-24 rounded-2xl object-cover shadow-sm"
            priority
          />
          <h1 className="mt-5 font-serif text-3xl font-semibold text-denim-800">Admin Portal</h1>
          <p className="mt-1 text-sm text-neutral-500">Sign in to manage your store</p>
        </div>

        <div className="rounded-2xl border border-mist-200 bg-white p-6 shadow-sm">
          <LoginForm nextPath={next} />
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Authorised access only. Sign-in attempts are rate limited and logged.
        </p>
      </div>
    </div>
  );
}
