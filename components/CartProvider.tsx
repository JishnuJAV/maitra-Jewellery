'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  addItem,
  clearItems,
  getServerSnapshot,
  getSnapshot,
  hydration,
  removeItem,
  setItemQty,
  subscribe,
  type CartItem,
} from '@/lib/cart-store';

export type { CartItem };

export type CartLine = {
  slug: string;
  qty: number;
  name: string;
  price: number;
  image: string | null;
  stock: number | null;
};

type CartContextType = {
  items: CartItem[];
  add: (slug: string, qty?: number) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  detailed: CartLine[];
  /** False during server render and until hydration completes. */
  ready: boolean;
  /** True while prices are being resolved from the server. */
  loading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

/**
 * Cart state.
 *
 * The cart itself lives in an external localStorage-backed store (lib/cart-store)
 * and is read through `useSyncExternalStore`, so nothing is copied into state
 * inside an effect.
 *
 * The store holds only slugs and quantities. Names, prices and images are
 * fetched from the server whenever the set of slugs changes, so the catalogue
 * stays the single source of truth for pricing and a stale cart can't carry an
 * old price into checkout. Shipping is deliberately absent — it depends on the
 * delivery address and is quoted at checkout.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(
    hydration.subscribe,
    hydration.getSnapshot,
    hydration.getServerSnapshot,
  );

  const [lines, setLines] = useState<Omit<CartLine, 'qty'>[]>([]);
  /** Which slug set `lines` corresponds to; drives the derived loading flag. */
  const [loadedKey, setLoadedKey] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const slugKey = useMemo(
    () =>
      items
        .map((item) => item.slug)
        .sort()
        .join(','),
    [items],
  );

  // Re-resolve product details whenever the set of slugs changes.
  useEffect(() => {
    if (!ready || slugKey === '') return;

    const controller = new AbortController();

    fetch('/api/products/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs: slugKey.split(',') }),
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('lookup'))))
      .then((body: { products: Omit<CartLine, 'qty'>[] }) => {
        setLines(body.products);
        setLoadedKey(slugKey);
      })
      .catch(() => {
        // Keep the previous lines rather than emptying the cart on a transient
        // network failure.
      });

    return () => controller.abort();
  }, [slugKey, ready]);

  // Derived rather than stored, so no setState runs in the effect body above.
  const loading = ready && slugKey !== '' && loadedKey !== slugKey;

  // Join quantities onto the server-resolved details. Products the server didn't
  // return (deleted or hidden since) drop out of the cart automatically.
  const detailed = useMemo<CartLine[]>(() => {
    const bySlug = new Map(lines.map((line) => [line.slug, line]));
    return items
      .map((item) => {
        const line = bySlug.get(item.slug);
        return line ? { ...line, qty: item.qty } : null;
      })
      .filter((line): line is CartLine => line !== null);
  }, [items, lines]);

  const count = detailed.reduce((total, line) => total + line.qty, 0);
  const subtotal = detailed.reduce((total, line) => total + line.price * line.qty, 0);

  const value: CartContextType = {
    items,
    add: addItem,
    remove: removeItem,
    setQty: setItemQty,
    clear: clearItems,
    count,
    subtotal,
    detailed,
    ready,
    loading,
    isOpen,
    openCart,
    closeCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
