import { prisma } from '@/lib/db';
import { formatINR } from '@/lib/format';
import { formatPhone } from '@/lib/phone';
import { Card, EmptyState } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      orders: { select: { total: true, status: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-denim-800">Customers</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Everyone who has signed in with their mobile number. Guest checkouts appear under Orders
          only.
        </p>
      </div>

      <Card>
        {customers.length === 0 ? (
          <EmptyState
            message="No registered customers yet"
            hint="Customers appear here once they sign in with an OTP."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mist-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="pb-2 pr-3 font-medium">Mobile</th>
                  <th className="pb-2 pr-3 font-medium">Name</th>
                  <th className="pb-2 pr-3 font-medium">Joined</th>
                  <th className="pb-2 pr-3 font-medium">Last sign-in</th>
                  <th className="pb-2 pr-3 font-medium">Orders</th>
                  <th className="pb-2 text-right font-medium">Lifetime value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist-100">
                {customers.map((customer) => {
                  const liveOrders = customer.orders.filter((order) => order.status !== 'CANCELLED');
                  const lifetime = liveOrders.reduce((sum, order) => sum + order.total, 0);

                  return (
                    <tr key={customer.id}>
                      <td className="py-3 pr-3">
                        <a
                          href={`https://wa.me/91${customer.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-denim-700 hover:underline"
                        >
                          {formatPhone(customer.phone)}
                        </a>
                        {customer.blocked && (
                          <span className="ml-2 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                            Blocked
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-neutral-600">
                        {customer.name ?? <span className="text-neutral-400">—</span>}
                      </td>
                      <td className="py-3 pr-3 text-neutral-600">
                        {customer.createdAt.toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 pr-3 text-neutral-600">
                        {customer.lastLoginAt
                          ? customer.lastLoginAt.toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 pr-3 tabular-nums text-neutral-600">
                        {liveOrders.length}
                      </td>
                      <td className="py-3 text-right font-medium tabular-nums text-denim-800">
                        {formatINR(lifetime)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
