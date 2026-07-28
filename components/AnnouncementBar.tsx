import { site } from '@/lib/site';
import { getSiteSettings } from '@/lib/catalog';

// Note: `export const revalidate` is only honoured in page/layout/route files,
// not in a component like this one. The 60s revalidate on the storefront layout
// that renders this bar is what keeps the announcement fresh.
export default async function AnnouncementBar() {
  const settings = await getSiteSettings();
  const announcement = settings.announcement ?? site.announcement;

  // An empty announcement hides the bar entirely rather than leaving a stripe.
  if (!announcement.trim()) return null;

  return (
    <div className="bg-denim-800 py-2 text-center text-xs font-semibold tracking-wide text-sun-300 sm:text-sm">
      🎉 {announcement}
    </div>
  );
}
