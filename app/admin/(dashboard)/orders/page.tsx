import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatINR } from '@/lib/format';
import { formatPhone } from '@/lib/phone';
import { Card, EmptyState, StatusBadge } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

const STATUSES = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = STATUSES.find((candidate) => candidate === status);

  const orders = await prisma.order.findMany({
    where: activeStatus ? { status: activeStatus } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { items: { select: { id: true, qty: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-denim-800">Orders</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Every order placed through checkout, with the customer&apos;s phone number and delivery
          address.
        </p>
      </div>

      {/* Filters sit in a single row above the table. */}
      <div className="flex flex-wrap gap-2">
        <FilterLink href="/admin/orders" label="All" active={!activeStatus} />
        {STATUSES.map((candidate) => (
          <FilterLink
            key={candidate}
            href={`/admin/orders?status=${candidate}`}
            label={candidate.charAt(0) + candidate.slice(1).toLowerCase()}
            active={activeStatus === candidate}
          />
        ))}
      </div>

      <Card>
        {orders.length === 0 ? (
          <EmptyState
            message={activeStatus ? 'No orders with this status' : 'No orders yet'}
            hint="Orders placed through checkout appear here immediately."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mist-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="pb-2 pr-3 font-medium">Order</th>
                  <th className="pb-2 pr-3 font-medium">Placed</th>
                  <th className="pb-2 pr-3 font-medium">Customer</th>
                  <th className="pb-2 pr-3 font-medium">Deliver to</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 font-medium">Payment</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist-100">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-3 pr-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-denim-700 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <div className="text-xs text-neutral-500">
                        {order.items.reduce((sum, item) => sum + item.qty, 0)} item(s)
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-neutral-600">
                      {order.createdAt.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="text-neutral-700">{order.customerName}</div>
                      <a
                        href={`tel:+91${order.phone}`}
                        className="text-xs text-denim-600 hover:underline"
                      >
                        {formatPhone(order.phone)}
                      </a>
                    </td>
                    <td className="py-3 pr-3 text-xs text-neutral-600">
                      {order.city}, {order.state}
                      <div className="text-neutral-400">{order.pincode}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="py-3 text-right font-medium tabular-nums text-denim-800">
                      {formatINR(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-denim-700 bg-denim-700 text-white'
          : 'border-mist-300 bg-white text-neutral-600 hover:border-denim-300 hover:text-denim-700'
      }`}
    >
      {label}
    </Link>
  );
}
