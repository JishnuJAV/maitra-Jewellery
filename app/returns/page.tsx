import type { Metadata } from 'next';
import PolicyPage from '@/components/PolicyPage';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'Return & Exchange' };

export default function Returns() {
  return (
    <PolicyPage title="Return & Exchange">
      <p>
        We want you to love your jewellery. If something isn’t right, reach out to us on WhatsApp
        at {site.phoneDisplay} within 48 hours of delivery.
      </p>
      <h2>Damaged or wrong item</h2>
      <p>
        If you receive a damaged, defective or incorrect item, please share an unboxing video and
        photos within 48 hours. We’ll arrange a replacement or refund.
      </p>
      <h2>Exchange</h2>
      <p>
        Exchanges are accepted for unused items in original condition within 3 days of delivery.
        Return shipping for non-defective exchanges is borne by the customer.
      </p>
      <h2>Non-returnable</h2>
      <ul>
        <li>Items that have been used, worn or damaged after delivery</li>
        <li>Items without original packaging</li>
        <li>Sale or clearance items (unless defective)</li>
      </ul>
      <h2>Refunds</h2>
      <p>Approved refunds are processed to your original payment method within 5–7 business days.</p>
    </PolicyPage>
  );
}
