'use client';

import { useState } from 'react';
import { site } from '@/lib/site';

export default function PaymentInfo() {
  const [copied, setCopied] = useState(false);
  const [qrOk, setQrOk] = useState(true);

  function copyUpi() {
    navigator.clipboard?.writeText(site.upiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* UPI / GPay details */}
      <div className="rounded-2xl border border-mist-200 bg-white p-6">
        <h3 className="font-serif text-xl font-semibold text-denim-800">Pay via UPI / GPay</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-neutral-500">Payee name</dt>
            <dd className="font-semibold text-neutral-800">{site.upiPayeeName}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">UPI ID</dt>
            <dd className="flex items-center gap-2">
              <span className="font-semibold text-neutral-800">{site.upiId}</span>
              <button
                onClick={copyUpi}
                className="rounded-full border border-mist-300 px-2 py-0.5 text-xs text-denim-700 hover:bg-mist-100"
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">GPay / Phone</dt>
            <dd className="font-semibold text-neutral-800">{site.gpayNumber}</dd>
          </div>
        </dl>
        <p className="mt-4 rounded-lg bg-mist-100 p-3 text-xs text-neutral-600">
          After paying, please share the payment screenshot on WhatsApp so we can confirm and
          dispatch your order.
        </p>
      </div>

      {/* QR code */}
      <div className="flex flex-col items-center rounded-2xl border border-mist-200 bg-white p-6 text-center">
        <h3 className="font-serif text-xl font-semibold text-denim-800">Scan & Pay</h3>
        <div className="mt-4 flex h-56 w-56 items-center justify-center overflow-hidden rounded-xl border border-mist-200 bg-mist-50">
          {qrOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={site.qrImage}
              alt="UPI QR code"
              className="h-full w-full object-contain"
              onError={() => setQrOk(false)}
            />
          ) : (
            <div className="p-4 text-xs text-neutral-400">
              <p className="mb-2 text-3xl">▢</p>
              Add your QR image at
              <br />
              <code className="text-[11px]">/public/payment/qr.png</code>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Scan with any UPI app (GPay, PhonePe, Paytm) to pay {site.upiPayeeName}.
        </p>
      </div>
    </div>
  );
}
