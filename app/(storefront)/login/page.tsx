import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth/otp';
import OtpLoginForm from '@/components/OtpLoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: true },
};

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Already signed in — nothing to do here.
  const customer = await getCustomerSession();
  if (customer) redirect(next && next.startsWith('/') && !next.startsWith('//') ? next : '/account');

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="section-title">Sign in</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Enter your mobile number and we&apos;ll text you a 6-digit code. No password needed.
          </p>
        </div>

        <div className="rounded-2xl border border-mist-200 bg-white p-6">
          <OtpLoginForm nextPath={next} />
        </div>
      </div>
    </div>
  );
}
