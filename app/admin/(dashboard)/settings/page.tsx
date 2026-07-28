import { prisma } from '@/lib/db';
import { site } from '@/lib/site';
import SettingsForm from '@/components/admin/SettingsForm';

export const dynamic = 'force-dynamic';

/** Fields the dashboard can edit, with the code default used as a fallback. */
const FIELDS = [
  { key: 'announcement', label: 'Announcement bar', fallback: site.announcement, multiline: true },
  { key: 'whatsappNumber', label: 'WhatsApp number', fallback: site.whatsappNumber, hint: 'International format, digits only — e.g. 918714051245' },
  { key: 'phoneDisplay', label: 'Phone (as displayed)', fallback: site.phoneDisplay },
  { key: 'email', label: 'Contact email', fallback: site.email },
  { key: 'instagram', label: 'Instagram URL', fallback: site.instagram },
  { key: 'upiId', label: 'UPI ID', fallback: site.upiId },
  { key: 'upiPayeeName', label: 'UPI payee name', fallback: site.upiPayeeName },
  { key: 'gpayNumber', label: 'GPay number', fallback: site.gpayNumber },
  { key: 'shippingNote', label: 'Shipping note', fallback: site.shippingNote, multiline: true },
] as const;

export default async function AdminSettingsPage() {
  const rows = await prisma.siteSetting.findMany();
  const stored = new Map(rows.map((row) => [row.key, row.value]));

  const fields = FIELDS.map((field) => {
    const value = stored.get(field.key);
    return {
      key: field.key,
      label: field.label,
      hint: 'hint' in field ? field.hint : undefined,
      multiline: 'multiline' in field ? Boolean(field.multiline) : false,
      value: typeof value === 'string' ? value : field.fallback,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-denim-800">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Contact and payment details shown across the storefront. Changes take effect immediately.
        </p>
      </div>

      <SettingsForm fields={fields} />
    </div>
  );
}
