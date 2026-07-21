import { site } from '@/lib/site';

export default function AnnouncementBar() {
  return (
    <div className="bg-denim-800 py-2 text-center text-xs font-semibold tracking-wide text-sun-300 sm:text-sm">
      🎉 {site.announcement}
    </div>
  );
}
