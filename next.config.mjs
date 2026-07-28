import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    /*
     * Next's own image optimizer does not run on Cloudflare, so images are
     * resized by Cloudinary (for uploaded media) or Cloudflare's /cdn-cgi/image
     * endpoint (for everything in /public). See image-loader.ts.
     *
     * Consequence: `remotePatterns` and `formats` are NOT applied by Next any
     * more. Allowed transformation origins are configured in the Cloudflare
     * dashboard under Images → Transformations.
     */
    loader: 'custom',
    loaderFile: './image-loader.ts',
    // Blocks SVG delivery through the optimiser (SVGs can carry script payloads).
    dangerouslyAllowSVG: false,
  },

  // Don't advertise the framework version to attackers scanning for known CVEs.
  poweredByHeader: false,

  // Trailing-slash-free canonical URLs, matching the existing links.
  trailingSlash: false,

  // Note: Next 16 removed the `eslint` config key along with `next lint`.
  // Linting now runs separately via `npm run lint` (eslint.config.mjs).

  typescript: {
    // Never ship a build that doesn't typecheck.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

// Makes Cloudflare bindings (Hyperdrive, ASSETS) available during `next dev`,
// so local development behaves like the deployed Worker.
initOpenNextCloudflareForDev();
