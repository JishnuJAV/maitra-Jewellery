import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="font-serif text-6xl font-bold text-mist-400">404</p>
      <h1 className="mt-4 section-title">Page not found</h1>
      <p className="mt-3 text-neutral-500">The page you’re looking for doesn’t exist or has moved.</p>
      <Link href="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
