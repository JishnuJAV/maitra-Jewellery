import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth/admin';
import AdminShell from '@/components/admin/AdminShell';

/**
 * Authenticated admin chrome.
 *
 * The Edge proxy already redirects unauthenticated visitors, but this re-checks
 * against the database. Defence in depth: the proxy only validates the token
 * signature, while this confirms the admin account still exists.
 */
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  return <AdminShell username={admin.username}>{children}</AdminShell>;
}
