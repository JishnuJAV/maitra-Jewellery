import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * OpenNext Cloudflare adapter configuration.
 *
 * No incremental cache override is set: the storefront pages use short
 * `revalidate` windows (60s) rather than long-lived ISR, so the default
 * in-Worker cache is sufficient and avoids an R2 bucket dependency.
 *
 * If you later add long-lived ISR pages, wire up the R2 incremental cache:
 *
 *   import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
 *   export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache });
 *
 * and add an R2 bucket binding named NEXT_INC_CACHE_R2_BUCKET in wrangler.jsonc.
 */
export default defineCloudflareConfig();
