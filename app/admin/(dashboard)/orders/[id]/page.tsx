import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatINR } from '@/lib/format';
import { formatPhone } from '@/lib/phone';
import { Card } from '@/components/admin/ui';
import OrderStatusControls from '@/components/admin/OrderStatusControls';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, customer: { select: { id: true, phone: true } } },
  });

  if (!order) notFound();

  const address = [
    order.addressLine1,
    order.addressLine2,
    `${order.city}, ${order.state} ${order.pincode}`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-denim-600 hover:underline">
          ← Back to orders
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-denim-800">
          {order.orderNumber}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Placed{' '}
          {order.createdAt.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card title="Items">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mist-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                    <th className="pb-2 pr-3 font-medium">Item</th>
                    <th className="pb-2 pr-3 font-medium">Price</th>
                    <th className="pb-2 pr-3 font-medium">Qty</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist-100">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-3">
                          {item.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          )}
                          <span className="text-neutral-700">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums text-neutral-600">
                        {formatINR(item.price)}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums text-neutral-600">{item.qty}</td>
                      <td className="py-2.5 text-right font-medium tabular-nums text-denim-800">
                        {formatINR(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-4 space-y-1.5 border-t border-mist-200 pt-4 text-sm">
              <Row label="Subtotal" value={formatINR(order.subtotal)} />
              <Row
                label={`Shipping${order.shippingRateName ? ` (${order.shippingRateName})` : ''}`}
                value={order.shippingFee === 0 ? 'Free' : formatINR(order.shippingFee)}
              />
              {order.discount > 0 && <Row label="Discount" value={`− ${formatINR(order.discount)}`} />}
              <div className="flex justify-between border-t border-mist-200 pt-2 text-base font-semibold text-denim-800">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatINR(order.total)}</dd>
              </div>
            </dl>
          </Card>

          {order.customerNote && (
            <Card title="Customer note">
              <p className="whitespace-pre-wrap text-sm text-neutral-700">{order.customerNote}</p>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card title="Customer">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-neutral-500">Name</dt>
                <dd className="text-neutral-700">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-neutral-500">Mobile</dt>
                <dd>
                  <a href={`tel:+91${order.phone}`} className="text-denim-600 hover:underline">
                    {formatPhone(order.phone)}
                  </a>
                  {' · '}
                  <a
                    href={`https://wa.me/91${order.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 hover:underline"
                  >
                    WhatsApp
                  </a>
                </dd>
              </div>
              {order.email && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-neutral-500">Email</dt>
                  <dd className="break-all text-neutral-700">{order.email}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase tracking-wide text-neutral-500">
                  Delivery address
                </dt>
                <dd className="whitespace-pre-wrap text-neutral-700">{address}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-neutral-500">Account</dt>
                <dd className="text-neutral-700">
                  {order.customer ? 'Signed-in customer' : 'Guest checkout'}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Status">
            <OrderStatusControls
              id={order.id}
              status={order.status}
              paymentStatus={order.paymentStatus}
              paymentRef={order.paymentRef ?? ''}
              adminNote={order.adminNote ?? ''}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-neutral-600">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
