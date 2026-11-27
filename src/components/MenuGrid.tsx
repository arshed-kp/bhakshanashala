"use client";

import { useEffect, useState } from "react";
import { MenuItemCard } from "./MenuItemCard";
import { MENU_CACHE_KEY, readClientCache, writeClientCache } from "@/lib/client-cache";
import type { MenuItem } from "@/lib/types";

const CACHE_TTL = 5 * 60 * 1000;

export function MenuGrid() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let fresh = false;
    let hadCache = false;

    const frame = window.requestAnimationFrame(() => {
      const cached = readClientCache<MenuItem[]>(MENU_CACHE_KEY, CACHE_TTL);
      if (cached?.length && !fresh) {
        hadCache = true;
        setItems(cached);
        setLoading(false);
      }
    });

    fetch("/api/items", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "Could not load menu");
        return response.json() as Promise<{ items: MenuItem[] }>;
      })
      .then((data) => {
        fresh = true;
        const nextItems = data.items || [];
        setItems(nextItems);
        writeClientCache(MENU_CACHE_KEY, nextItems);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        if (!hadCache) setError(cause instanceof Error ? cause.message : "Could not load menu");
      })
      .finally(() => setLoading(false));

    return () => {
      window.cancelAnimationFrame(frame);
      controller.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((key) => (
          <div key={key} className="h-80 animate-pulse rounded-2xl border border-[#e7d5c3] bg-white/70" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
        <p className="font-semibold">Menu unavailable</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  if (!items.length) {
    return <p className="rounded-2xl border border-[#e7d5c3] bg-white p-6">No items are available right now.</p>;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <MenuItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
