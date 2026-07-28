export type CartItem = { slug: string; qty: number };

/**
 * localStorage-backed cart store.
 *
 * Exposed as an external store so components can read it through
 * `useSyncExternalStore` rather than copying it into state inside an effect.
 * That's the pattern React provides for exactly this case: it handles the
 * server/client snapshot split, avoids the cascading re-render that
 * setState-in-an-effect causes, and gives cross-tab sync for free.
 */

const STORAGE_KEY = 'maitra-cart';

/**
 * Cached snapshot. `useSyncExternalStore` compares snapshots by reference and
 * will loop forever if getSnapshot() builds a new array each call, so this is
 * only reassigned when the cart genuinely changes.
 */
let snapshot: CartItem[] = [];
let initialised = false;

/** Stable empty array for SSR — a fresh [] each call would break hydration. */
const SERVER_SNAPSHOT: CartItem[] = [];

const listeners = new Set<() => void>();

function parse(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is CartItem =>
        typeof entry?.slug === 'string' && Number.isFinite(entry?.qty) && entry.qty > 0,
    );
  } catch {
    // Corrupt storage — start empty rather than crashing the shop.
    return [];
  }
}

function load() {
  if (typeof window === 'undefined') return;
  snapshot = parse(window.localStorage.getItem(STORAGE_KEY));
  initialised = true;
}

function emit() {
  for (const listener of listeners) listener();
}

function handleStorage(event: StorageEvent) {
  // Another tab changed the cart — adopt its version.
  if (event.key !== STORAGE_KEY) return;
  snapshot = parse(event.newValue);
  emit();
}

export function subscribe(listener: () => void) {
  if (!initialised) load();

  if (listeners.size === 0 && typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

export function getSnapshot(): CartItem[] {
  if (!initialised) load();
  return snapshot;
}

export function getServerSnapshot(): CartItem[] {
  return SERVER_SNAPSHOT;
}

function commit(next: CartItem[]) {
  snapshot = next;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private browsing or a full quota — the cart still works for this session.
    }
  }
  emit();
}

export function addItem(slug: string, qty = 1) {
  const current = getSnapshot();
  const existing = current.find((item) => item.slug === slug);
  commit(
    existing
      ? current.map((item) => (item.slug === slug ? { ...item, qty: item.qty + qty } : item))
      : [...current, { slug, qty }],
  );
}

export function removeItem(slug: string) {
  commit(getSnapshot().filter((item) => item.slug !== slug));
}

export function setItemQty(slug: string, qty: number) {
  if (qty <= 0) return removeItem(slug);
  commit(getSnapshot().map((item) => (item.slug === slug ? { ...item, qty } : item)));
}

export function clearItems() {
  commit([]);
}

/**
 * Subscribe/snapshot pair that reports whether hydration has happened.
 * Lets the UI show a placeholder instead of briefly flashing "cart is empty"
 * during server render, without tracking it in state.
 */
export const hydration = {
  subscribe: () => () => {},
  getSnapshot: () => true,
  getServerSnapshot: () => false,
};
