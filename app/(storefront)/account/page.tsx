import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCustomerSession } from '@/lib/auth/otp';
import { formatINR } from '@/lib/format';
import { formatPhone } from '@/lib/phone';
import SignOutButton from '@/components/SignOutButton';

export const metadata: Metadata = {
  title: 'My account',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Awaiting confirmation',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default async function AccountPage() {
  const customer = await getCustomerSession();
  if (!customer) redirect('/login?next=/account');

  // Match on customerId for orders placed while signed in, and on the phone
  // number so guest orders placed with the same mobile still show up.
  const orders = await prisma.order.findMany({
    where: { OR: [{ customerId: customer.id }, { phone: customer.phone }] },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });

  return (
    <div className="container-page py-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="section-title">My account</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Signed in as {formatPhone(customer.phone)}
          </p>
        </div>
        <SignOutButton />
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-mist-300 px-6 py-16 text-center">
          <p className="font-serif text-xl text-denim-800">No orders yet</p>
          <p className="mt-2 text-sm text-neutral-500">
            When you place an order it will appear here with its delivery status.
          </p>
          <Link href="/products" className="btn-primary mt-6">
            Shop the collection
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-mist-200 bg-white p-5">
              <header className="flex flex-wrap items-start justify-between gap-3 border-b border-mist-100 pb-3">
                <div>
                  <p className="font-serif text-lg font-semibold text-denim-800">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Placed{' '}
                    {order.createdAt.toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-denim-800">{formatINR(order.total)}</p>
                  <p className="text-xs text-neutral-500">
                    {STATUS_LABEL[order.status] ?? order.status}
                  </p>
                </div>
              </header>

              <ul className="mt-3 space-y-2 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-neutral-700 hover:text-denim-700"
                    >
                      {item.name} × {item.qty}
                    </Link>
                    <span className="tabular-nums text-neutral-600">
                      {formatINR(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <footer className="mt-3 border-t border-mist-100 pt-3 text-xs text-neutral-500">
                Delivering to {order.city}, {order.state} {order.pincode}
                {order.shippingFee > 0 && ` · delivery ${formatINR(order.shippingFee)}`}
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
