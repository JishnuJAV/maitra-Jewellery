/**
 * Custom next/image loader.
 *
 * Next's built-in image optimizer does not run on Cloudflare, so a loader is
 * required — but the right answer differs per environment:
 *
 *  - **Cloudinary URLs** (product media uploaded through the admin) always get
 *    Cloudinary's own transformation parameters. Cloudinary is already a CDN and
 *    works identically in dev and production.
 *
 *  - **Local files** (/public: the 34 seeded product photos, the logo) can only
 *    use Cloudflare's /cdn-cgi/image/ endpoint when it actually exists. It does
 *    NOT exist on localhost, and it does NOT exist on *.workers.dev — Image
 *    Transformations require a zone, i.e. a custom domain. Using it anywhere
 *    else 404s every image.
 *
 *    So it is opt-in via NEXT_PUBLIC_CF_IMAGE_TRANSFORMS, and the safe default
 *    is to serve the original file. An unoptimized image is a minor cost; a
 *    broken one is not.
 */

type LoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

const DEFAULT_QUALITY = 75;

/**
 * Set NEXT_PUBLIC_CF_IMAGE_TRANSFORMS=true only once the site is served from a
 * custom domain on Cloudflare with Images → Transformations enabled.
 * Inlined at build time, so it must be a build variable, not a runtime secret.
 */
const cloudflareTransformsEnabled = process.env.NEXT_PUBLIC_CF_IMAGE_TRANSFORMS === 'true';

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  const q = quality ?? DEFAULT_QUALITY;

  // Pass through anything that isn't a fetchable path.
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;

  // Cloudinary: inject transformations into the delivery URL.
  // .../image/upload/<transforms>/<public_id>
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    return src.replace('/upload/', `/upload/f_auto,q_${q},w_${width},c_limit/`);
  }

  // Other absolute URLs are served as-is; we can't resize a third-party origin.
  if (src.startsWith('http://') || src.startsWith('https://')) return src;

  const normalised = src.startsWith('/') ? src : `/${src}`;

  if (!cloudflareTransformsEnabled) {
    // Dev, or a workers.dev deployment: serve the original file untouched.
    return normalised;
  }

  const params = [`width=${width}`, `quality=${q}`, 'format=auto', 'fit=scale-down'].join(',');
  return `/cdn-cgi/image/${params}${normalised}`;
}
