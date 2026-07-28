import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/**
 * Flat config. eslint-config-next 16 exports flat arrays natively, so the
 * @eslint/eslintrc FlatCompat bridge isn't needed (and breaks under ESLint 10).
 */
const config = [
  {
    // Generated clients and build output are not ours to lint.
    ignores: [
      'lib/generated/**',
      '.next/**',
      '.open-next/**',
      '.wrangler/**',
      'node_modules/**',
      'next-env.d.ts',
      'cloudflare-env.d.ts',
    ],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Deliberate in a few places: admin thumbnails and order line items render
      // Cloudinary URLs with a plain <img>, where next/image adds no value.
      '@next/next/no-img-element': 'warn',
    },
  },
];

export default config;
