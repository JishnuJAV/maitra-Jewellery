'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { products } from '@/lib/products';
import { site } from '@/lib/site';

export type CartItem = { slug: string; qty: number };

type CartContextType = {
  items: CartItem[];
  add: (slug: string, qty?: number) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  detailed: { slug: string; qty: number; name: string; price: number; image: string }[];
  ready: boolean;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = 'maitra-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  function add(slug: string, qty = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === slug);
      if (existing) {
        return prev.map((i) => (i.slug === slug ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { slug, qty }];
    });
  }

  function remove(slug: string) {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }

  function setQty(slug: string, qty: number) {
    if (qty <= 0) return remove(slug);
    setItems((prev) => prev.map((i) => (i.slug === slug ? { ...i, qty } : i)));
  }

  function clear() {
    setItems([]);
  }

  const detailed = useMemo(
    () =>
      items
        .map((i) => {
          const p = products.find((prod) => prod.slug === i.slug);
          if (!p) return null;
          return { slug: i.slug, qty: i.qty, name: p.name, price: p.price, image: p.images[0] };
        })
        .filter(Boolean) as CartContextType['detailed'],
    [items]
  );

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = detailed.reduce((n, i) => n + i.price * i.qty, 0);
  const shipping = count > 0 ? site.shippingFee : 0;
  const total = subtotal + shipping;

  const value: CartContextType = {
    items,
    add,
    remove,
    setQty,
    clear,
    count,
    subtotal,
    shipping,
    total,
    detailed,
    ready,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
