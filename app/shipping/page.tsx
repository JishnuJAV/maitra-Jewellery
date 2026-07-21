import type { Metadata } from 'next';
import PolicyPage from '@/components/PolicyPage';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'Shipping & Delivery' };

export default function Shipping() {
  return (
    <PolicyPage title="Shipping & Delivery">
      <p>{site.shippingNote}</p>
      <h2>Processing time</h2>
      <p>Orders are packed and dispatched within 1–3 business days after payment is confirmed.</p>
      <h2>Delivery time</h2>
      <p>
        Delivery usually takes 4–8 business days depending on your location within India. You’ll
        receive tracking details on WhatsApp once your order ships.
      </p>
      <h2>Shipping charges</h2>
      <p>
        Shipping charges are calculated based on your location and order weight, and are confirmed
        when you place your order on WhatsApp before you pay.
      </p>
      <h2>Packaging</h2>
      <p>Every piece is carefully packed to reach you safely and ready to gift.</p>
    </PolicyPage>
  );
}
