// Central place to edit all brand + contact + payment details.
export const site = {
  name: 'Maitra Jewellery',
  shortName: 'Maitra',
  tagline: 'Handcrafted traditional & fashion jewellery',
  description:
    'Maitra Jewellery — handcrafted temple, kemp, palakka, American diamond and micro gold plated necklace sets. Curated pieces at honest prices, delivered across India.',
  // Public site URL — used to build absolute link-preview (Open Graph) URLs.
  // IMPORTANT: after deploying, set this to your real domain (or NEXT_PUBLIC_SITE_URL env var).
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://maitra-jewellery.vercel.app',
  // Text shown in the link-share preview card (WhatsApp / Instagram / social)
  ogTitle: 'Shop Budget-Friendly Premium Jewellery — Maitra',
  ogDescription:
    'Discover exquisite, budget-friendly premium jewellery at Maitra. Shop stunning necklaces, earrings, kemp, palakka, temple, American diamond & micro gold plated sets — delivered across India.',
  // Contact / order details
  whatsappNumber: '918714051245', // international format, no + or spaces (used in wa.me links)
  phoneDisplay: '+91 87140 51245',
  email: 'maitrajewellery@gmail.com',
  instagram: 'https://www.instagram.com/m_a_i_t_r_a_25?igsh=YmVtNmQ3dDBheGxm',
  location: 'Kerala, India',
  // Payment
  upiId: 'anupapmnm@oksbi',
  gpayNumber: '+91 87140 51245',
  upiPayeeName: 'Maitra Jewellery',
  // QR code image lives at /public/payment/qr.png — replace with your own.
  qrImage: '/payment/qr.png',
  // Policy
  shippingNote:
    'Shipping charges are extra and will be confirmed when you place your order on WhatsApp.',
};

export function waLink(message: string) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
