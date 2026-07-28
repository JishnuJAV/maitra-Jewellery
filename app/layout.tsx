import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Dancing_Script } from 'next/font/google';
import './globals.css';
import { site } from '@/lib/site';

/**
 * Root layout — deliberately minimal.
 *
 * The storefront chrome (announcement bar, header, footer, cart drawer) lives in
 * the (storefront) route group instead, so /admin can render its own shell
 * without inheriting any of it.
 */

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-serif',
});
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const script = Dancing_Script({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-script',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: 'website',
    siteName: site.name,
    title: site.ogTitle,
    description: site.ogDescription,
    url: site.siteUrl,
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: site.ogTitle,
    description: site.ogDescription,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${script.variable}`}>
      {/*
        suppressHydrationWarning is scoped to this element's own attributes and
        does not affect any child. Browser extensions (Grammarly, password
        managers) inject attributes such as data-gr-ext-installed onto <body>
        before React hydrates, which React otherwise reports as a mismatch the
        app cannot fix.
      */}
      <body className="font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
