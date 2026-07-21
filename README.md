# Maitra Jewellery

A Next.js (App Router) e-commerce storefront for traditional & fashion jewellery.
Browse the catalogue, add to cart, and order over WhatsApp with UPI / GPay / QR payment.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

To build for production:

```bash
npm run build
npm start
```

## Where to edit things

| What | File |
|------|------|
| Brand name, contact, WhatsApp no., UPI ID, GPay, shipping note | `lib/site.ts` |
| Products (name, price, images, description) | `lib/products.ts` |
| Product images | `public/products/` |
| Your UPI **QR code** | add `public/payment/qr.png` |
| Colours / theme | `tailwind.config.ts` |

## Ordering flow

1. Customer adds items to cart → **Checkout**.
2. "Send order on WhatsApp" opens WhatsApp to **7356775199** with the order prefilled.
3. Customer pays via UPI `anupapmnm@oksbi` / GPay / QR (shown on checkout page).
4. Customer shares the payment screenshot; you confirm and ship.

No online payment gateway or backend is required.

## Notes

- The "Free Shipping above ₹499" banner from the reference site was intentionally removed.
  Shipping is shown as "confirmed on WhatsApp". Change wording in `lib/site.ts` (`shippingNote`).
- Add your real UPI QR at `public/payment/qr.png` (see `public/payment/README.txt`).
