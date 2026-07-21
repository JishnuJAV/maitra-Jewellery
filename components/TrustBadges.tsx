const badges = [
  {
    title: 'Handpicked Quality',
    text: 'Every piece checked before it ships.',
    icon: 'M12 3l2.5 5 5.5.8-4 3.9 1 5.5L12 15.8 6.5 18l1-5.5-4-3.9L9 8z',
  },
  {
    title: 'Easy WhatsApp Ordering',
    text: 'Order in seconds — we confirm on chat.',
    icon: 'M12 2a10 10 0 0 0-8.7 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z',
  },
  {
    title: 'Secure UPI Payments',
    text: 'Pay easily via GPay / UPI / QR.',
    icon: 'M12 1l9 4v6c0 5-3.8 9.4-9 11-5.2-1.6-9-6-9-11V5z',
  },
  {
    title: 'Pan-India Delivery',
    text: 'Shipped safely across India.',
    icon: 'M3 13h13V6H3zM16 8h4l1 4v3h-5zM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  },
];

export default function TrustBadges() {
  return (
    <section className="border-y border-mist-200 bg-white">
      <div className="container-page grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
        {badges.map((b) => (
          <div key={b.title} className="flex flex-col items-center text-center">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-mist-600">
              <path d={b.icon} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <h3 className="mt-3 text-sm font-semibold text-denim-800">{b.title}</h3>
            <p className="mt-1 text-xs text-neutral-500">{b.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
