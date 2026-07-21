// Central place to edit all brand + contact + payment details.
export const site = {
  name: 'Maitra Jewellery',
  shortName: 'Maitra',
  tagline: 'Handcrafted traditional & fashion jewellery',
  description:
    'Maitra Jewellery — handcrafted temple, kemp, palakka, American diamond and micro gold plated necklace sets. Curated pieces at honest prices, delivered across India.',
  // Contact / order details
  whatsappNumber: '917356775199', // international format, no + or spaces (used in wa.me links)
  phoneDisplay: '+91 73567 75199',
  email: 'maitrajewellery@gmail.com',
  instagram: 'https://instagram.com/',
  location: 'Kerala, India',
  // Payment
  upiId: 'anupapmnm@oksbi',
  gpayNumber: '+91 73567 75199',
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
