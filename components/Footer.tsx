import Link from 'next/link';
import { site } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-mist-200 bg-denim-900 text-mist-100">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-2xl font-bold text-mist-100">{site.name}</p>
          <p className="mt-3 max-w-xs text-sm text-mist-200/80">{site.description}</p>
          <p className="mt-4 text-sm text-mist-200/80">{site.location}</p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mist-300">Shop</h4>
          <ul className="space-y-2 text-sm text-mist-200/80">
            <li><Link href="/products" className="hover:text-white">All Products</Link></li>
            <li><Link href="/products?category=kemp-palakka" className="hover:text-white">Kemp & Palakka</Link></li>
            <li><Link href="/products?category=antique-temple" className="hover:text-white">Antique & Temple</Link></li>
            <li><Link href="/products?category=american-diamond" className="hover:text-white">American Diamond</Link></li>
            <li><Link href="/products?category=micro-gold" className="hover:text-white">Micro Gold Plated</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mist-300">Information</h4>
          <ul className="space-y-2 text-sm text-mist-200/80">
            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/shipping" className="hover:text-white">Shipping & Delivery</Link></li>
            <li><Link href="/returns" className="hover:text-white">Return & Exchange</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms & Conditions</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mist-300">Get in touch</h4>
          <ul className="space-y-2 text-sm text-mist-200/80">
            <li>
              WhatsApp / Call:{' '}
              <a href={`tel:${site.phoneDisplay.replace(/\s/g, '')}`} className="hover:text-white">
                {site.phoneDisplay}
              </a>
            </li>
            <li>
              Email: <a href={`mailto:${site.email}`} className="hover:text-white">{site.email}</a>
            </li>
            <li>
              <a href={site.instagram} target="_blank" rel="noreferrer" className="hover:text-white">
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <p className="container-page text-center text-xs text-mist-200/70">
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
