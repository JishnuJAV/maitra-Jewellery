import { cache } from 'react';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { serverEnv, isProduction } from '@/lib/env';

/**
 * Prisma client.
 *
 * Two very different lifetimes, because the two runtimes have opposite rules:
 *
 * - **Cloudflare Workers**: a pooled connection may NOT be reused across
 *   requests — doing so makes later requests fail. So the client is built per
 *   request (`maxUses: 1`), memoised with React's `cache()` so that everything
 *   within a single request still shares one connection.
 *
 * - **Node (local dev, `next dev`)**: the opposite problem. A fresh client per
 *   request, plus hot-reload re-evaluating modules on every edit, would exhaust
 *   Postgres connection slots. So it's cached on globalThis.
 *
 * Pinned to Prisma 6.19 — Prisma 7 compiles its query-compiler WASM at runtime,
 * which Workers forbid. See https://github.com/prisma/prisma/issues/28657
 */

/** Cloudflare's Workers runtime identifies itself through navigator.userAgent. */
function isCloudflareWorkers(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    (navigator as { userAgent?: string }).userAgent === 'Cloudflare-Workers'
  );
}

/**
 * Connection string, preferring a Hyperdrive binding when one is configured.
 *
 * Hyperdrive pools connections at the edge, which matters because a Worker
 * otherwise opens a fresh Postgres connection on every single request.
 */
function connectionString(): string {
  try {
    const env = getCloudflareContext().env as unknown as {
      HYPERDRIVE?: { connectionString: string };
    };
    if (env?.HYPERDRIVE?.connectionString) return env.HYPERDRIVE.connectionString;
  } catch {
    // Not running inside a Cloudflare context (plain `next dev`, the seed
    // script, CI) — fall through to the plain connection string.
  }
  return serverEnv.databaseUrl;
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: connectionString(),
    // One connection per client. On Workers the client is per-request, so this
    // guarantees a connection is never carried into a later request.
    max: 1,
    maxUses: isCloudflareWorkers() ? 1 : undefined,
    // Without these, an unreachable database hangs every query indefinitely
    // instead of erroring into the graceful fallback in lib/catalog.ts.
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 20_000,
  });

  return new PrismaClient({
    adapter,
    // 'error' is deliberately omitted: Prisma logs failures in addition to
    // throwing them, so enabling it double-reports every error — once through
    // our own handling and again as a raw stack trace in the dev overlay.
    log: ['warn'],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Per-request on Workers (via cache()), process-wide singleton on Node. */
const getClient = cache((): PrismaClient => {
  if (isCloudflareWorkers()) return createPrismaClient();

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
});

/**
 * Proxy so every existing `prisma.model.findMany()` call site keeps working
 * while the underlying instance is resolved per request. Without this, swapping
 * to a per-request client would mean rewriting every query in the codebase.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export { isProduction };
export * from '@prisma/client';
