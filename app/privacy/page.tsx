import type { Metadata } from 'next';
import PolicyPage from '@/components/PolicyPage';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function Privacy() {
  return (
    <PolicyPage title="Privacy Policy">
      <p>
        {site.name} respects your privacy. This policy explains what information we collect and how
        we use it.
      </p>
      <h2>Information we collect</h2>
      <p>
        When you place an order, we collect the details you share with us on WhatsApp — your name,
        delivery address and phone number — solely to process and deliver your order.
      </p>
      <h2>How we use it</h2>
      <ul>
        <li>To confirm, pack and ship your orders</li>
        <li>To communicate about your order and offers (only if you opt in)</li>
        <li>To handle returns, exchanges and support requests</li>
      </ul>
      <h2>Payments</h2>
      <p>
        Payments are made directly through your UPI app. We do not store your card, bank or UPI
        credentials.
      </p>
      <h2>Sharing</h2>
      <p>
        We never sell your data. We share only what’s necessary with our delivery partners to ship
        your order.
      </p>
      <h2>Contact</h2>
      <p>For any privacy questions, email us at {site.email}.</p>
    </PolicyPage>
  );
}
