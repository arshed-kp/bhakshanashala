"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CartLine, MenuItem } from "@/lib/types";

const STORAGE_KEY = "bhakshannashala-cart";

type CartContextValue = {
  items: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (item: MenuItem, qty?: number) => void;
  setQty: (itemId: number, qty: number) => void;
  remove: (itemId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStored(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((line): line is CartLine => {
        if (!line || typeof line !== "object") return false;
        const value = line as Partial<CartLine>;
        return Number.isInteger(value.itemId) && Number.isInteger(value.qty) && Number(value.qty) > 0;
      })
      .map((line) => ({
        itemId: Number(line.itemId),
        name: String(line.name || "Item"),
        price: Number(line.price) || 0,
        image: String(line.image || "/placeholder-food.svg"),
        stock: Math.max(1, Number(line.stock) || 99),
        qty: Number(line.qty),
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setItems(readStored());
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback((item: MenuItem, qty = 1) => {
    setItems((previous) => {
      const existing = previous.find((line) => line.itemId === item.id);
      const nextQty = Math.min(item.stock, (existing?.qty ?? 0) + qty);
      if (nextQty <= 0) return previous;
      if (existing) {
        return previous.map((line) =>
          line.itemId === item.id ? { ...line, stock: item.stock, qty: nextQty } : line,
        );
      }
      return [
        ...previous,
        {
          itemId: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          stock: item.stock,
          qty: nextQty,
        },
      ];
    });
  }, []);

  const setQty = useCallback((itemId: number, qty: number) => {
    setItems((previous) =>
      previous
        .map((line) =>
          line.itemId === itemId ? { ...line, qty: Math.min(line.stock, Math.max(1, qty)) } : line,
        )
        .filter((line) => line.qty > 0),
    );
  }, []);

  const remove = useCallback((itemId: number) => {
    setItems((previous) => previous.filter((line) => line.itemId !== itemId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      ready,
      count: items.reduce((total, line) => total + line.qty, 0),
      subtotal: items.reduce((total, line) => total + line.qty * line.price, 0),
      add,
      setQty,
      remove,
      clear,
    };
  }, [items, ready, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
