import type { Metadata } from 'next';
import PolicyPage from '@/components/PolicyPage';
import { getShippingRules } from '@/lib/shipping';
import { getSiteSettings } from '@/lib/catalog';
import { formatINR } from '@/lib/format';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'Shipping & Delivery' };

export const revalidate = 60;

export default async function Shipping() {
  // Published straight from the rules the admin edits, so this page can never
  // contradict what checkout actually charges.
  const [rules, settings] = await Promise.all([
    getShippingRules().catch(() => []),
    getSiteSettings(),
  ]);

  const note = settings.shippingNote ?? site.shippingNote;

  return (
    <PolicyPage title="Shipping & Delivery">
      {note && <p>{note}</p>}

      <h2>Delivery charges</h2>
      {rules.length === 0 ? (
        <p>
          Delivery charges are calculated from your PIN code at checkout and confirmed before you
          pay.
        </p>
      ) : (
        <>
          <p>
            Charges are calculated automatically from your PIN code at checkout. Current rates:
          </p>
          <table>
            <thead>
              <tr>
                <th>Region</th>
                <th>Delivery charge</th>
                <th>Free delivery</th>
                <th>Estimated time</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    {rule.name}
                    {rule.isDefault && ' (everywhere else)'}
                  </td>
                  <td>{rule.fee === 0 ? 'Free' : formatINR(rule.fee)}</td>
                  <td>{rule.freeAbove === null ? '—' : `Orders over ${formatINR(rule.freeAbove)}`}</td>
                  <td>{rule.etaDays ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Processing time</h2>
      <p>Orders are packed and dispatched within 1–3 business days after payment is confirmed.</p>

      <h2>Tracking</h2>
      <p>
        You&apos;ll receive tracking details on WhatsApp once your order ships. You can also see
        every order and its current status under <a href="/account">My Orders</a>.
      </p>

      <h2>Packaging</h2>
      <p>Every piece is carefully packed to reach you safely and ready to gift.</p>
    </PolicyPage>
  );
}
