import Link from 'next/link';
import { formatINR } from '@/lib/format';
import {
  getDailySeries,
  getDashboardStats,
  getOrdersByStatus,
  getRecentOrders,
  getTopPages,
  getTopProducts,
} from '@/lib/analytics';
import BarTimeSeries from '@/components/admin/BarTimeSeries';
import { Card, EmptyState, StatCard, StatusBadge, humanise } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

/** Single-hue series colours, each ≥3:1 against the white card surface. */
const VISITS_COLOR = '#1789a8';
const ORDERS_COLOR = '#434b62';

export default async function AdminDashboardPage() {
  const [stats, series, byStatus, recentOrders, topProducts, topPages] = await Promise.all([
    getDashboardStats(),
    getDailySeries(14),
    getOrdersByStatus(),
    getRecentOrders(8),
    getTopProducts(5),
    getTopPages(6),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-denim-800">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Store performance at a glance. Figures update as orders and visits come in.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatINR(stats.revenue)}
          hint={`${formatINR(stats.paidRevenue)} confirmed paid`}
        />
        <StatCard
          label="Orders"
          value={String(stats.orderCount)}
          hint={`${stats.pendingOrders} awaiting confirmation`}
          tone={stats.pendingOrders > 0 ? 'warn' : 'default'}
        />
        <StatCard
          label="Site visits"
          value={stats.totalVisits.toLocaleString('en-IN')}
          hint={`${stats.visitsToday} today`}
        />
        <StatCard
          label="Unique visitors"
          value={stats.uniqueVisitors.toLocaleString('en-IN')}
          hint={`${stats.customerCount} registered customers`}
        />
      </div>

      {/* Two single-series charts rather than one dual-axis chart: visits and
          orders differ by orders of magnitude and don't share a scale. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Visits — last 14 days">
          <BarTimeSeries
            label="Daily visits"
            color={VISITS_COLOR}
            data={series.map((point) => ({ date: point.date, value: point.visits }))}
            unit="visit"
          />
        </Card>
        <Card title="Orders — last 14 days">
          <BarTimeSeries
            label="Daily orders"
            color={ORDERS_COLOR}
            data={series.map((point) => ({ date: point.date, value: point.orders }))}
            unit="order"
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <Card
          title="Recent orders"
          className="lg:col-span-2"
          action={
            <Link href="/admin/orders" className="text-sm font-medium text-denim-600 hover:underline">
              View all
            </Link>
          }
        >
          {recentOrders.length === 0 ? (
            <EmptyState
              message="No orders yet"
              hint="Orders placed through checkout will appear here automatically."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mist-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                    <th className="pb-2 pr-3 font-medium">Order</th>
                    <th className="pb-2 pr-3 font-medium">Customer</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 font-medium">Payment</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-denim-700 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="text-neutral-700">{order.customerName}</div>
                        <div className="text-xs text-neutral-500">{order.phone}</div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-2.5 pr-3">
                        <StatusBadge status={order.paymentStatus} />
                      </td>
                      <td className="py-2.5 text-right font-medium tabular-nums text-denim-800">
                        {formatINR(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Orders by status */}
        <Card title="Orders by status">
          {byStatus.length === 0 ? (
            <EmptyState message="Nothing to summarise yet" />
          ) : (
            <ul className="space-y-2.5">
              {byStatus.map((row) => (
                <li key={row.status} className="flex items-center justify-between gap-3">
                  <StatusBadge status={row.status} />
                  <span className="text-sm font-medium tabular-nums text-neutral-700">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Best sellers">
          {topProducts.length === 0 ? (
            <EmptyState message="No sales recorded yet" />
          ) : (
            <ul className="divide-y divide-mist-100">
              {topProducts.map((product) => (
                <li key={product.slug} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0 truncate text-sm text-neutral-700">{product.name}</span>
                  <span className="shrink-0 text-sm text-neutral-500">
                    <span className="font-medium text-denim-800">{product.qty}</span> sold ·{' '}
                    {formatINR(product.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Most visited pages">
          {topPages.length === 0 ? (
            <EmptyState message="No visits recorded yet" />
          ) : (
            <ul className="divide-y divide-mist-100">
              {topPages.map((page) => (
                <li key={page.path} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0 truncate font-mono text-xs text-neutral-600">
                    {page.path}
                  </span>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-denim-800">
                    {page.views.toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="text-xs text-neutral-400">
        Revenue counts every order that has not been cancelled. {humanise('PAID')} figures reflect
        payments you have marked as confirmed.
      </p>
    </div>
  );
}
