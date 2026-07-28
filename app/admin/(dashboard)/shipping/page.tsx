import { prisma } from '@/lib/db';
import ShippingManager from '@/components/admin/ShippingManager';

export const dynamic = 'force-dynamic';

export default async function AdminShippingPage() {
  const rates = await prisma.shippingRate.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-denim-800">Shipping charges</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Set delivery charges by region. Rules are matched most-specific-first: a PIN code prefix
          beats a state, and a state beats the default rule.
        </p>
      </div>

      <ShippingManager
        initial={rates.map((rate) => ({
          id: rate.id,
          name: rate.name,
          fee: rate.fee,
          freeAbove: rate.freeAbove,
          states: rate.states,
          pincodePrefixes: rate.pincodePrefixes,
          isDefault: rate.isDefault,
          active: rate.active,
          sortOrder: rate.sortOrder,
          etaDays: rate.etaDays,
        }))}
      />
    </div>
  );
}
