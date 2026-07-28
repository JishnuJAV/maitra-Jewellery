import { CartProvider } from '@/components/CartProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnnouncementBar from '@/components/AnnouncementBar';
import CartDrawer from '@/components/CartDrawer';
import VisitTracker from '@/components/VisitTracker';
import { getCategories } from '@/lib/catalog';

// Categories come from the database, so refresh the nav on the same cadence as
// the catalogue pages.
export const revalidate = 60;

/**
 * Storefront chrome. Everything a customer sees lives under this layout;
 * /admin deliberately sits outside it.
 */
export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();

  return (
    <CartProvider>
      <AnnouncementBar />
      <Header categories={categories.map(({ slug, label }) => ({ slug, label }))} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <CartDrawer />
      {/* Records page views for the admin analytics. Customer pages only. */}
      <VisitTracker />
    </CartProvider>
  );
}
