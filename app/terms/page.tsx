import type { Metadata } from 'next';
import PolicyPage from '@/components/PolicyPage';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'Terms & Conditions' };

export default function Terms() {
  return (
    <PolicyPage title="Terms & Conditions">
      <p>
        By browsing and ordering from {site.name}, you agree to the following terms.
      </p>
      <h2>Products</h2>
      <p>
        We make every effort to display product colours and details accurately. As pieces are
        handcrafted, slight variations in colour, stone and finish are natural and not defects.
      </p>
      <h2>Pricing</h2>
      <p>
        All prices are in Indian Rupees (₹) and are subject to change without notice. Shipping
        charges are additional and confirmed at the time of ordering.
      </p>
      <h2>Orders</h2>
      <p>
        Orders are confirmed once payment is received. We reserve the right to cancel any order due
        to stock unavailability, in which case a full refund is issued.
      </p>
      <h2>Intellectual property</h2>
      <p>
        All content and images on this site belong to {site.name} and may not be used without
        permission.
      </p>
      <h2>Contact</h2>
      <p>Questions about these terms? Email {site.email} or WhatsApp {site.phoneDisplay}.</p>
    </PolicyPage>
  );
}
