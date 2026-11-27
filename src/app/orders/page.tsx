"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearClientCache, ORDERS_CACHE_KEY, readClientCache, writeClientCache } from "@/lib/client-cache";
import { statusLabel, statusTone } from "@/lib/format";
import { readOrderIds } from "@/lib/order-store";
import type { MenuItem, Order } from "@/lib/types";

type OrdersView = { orders: Order[]; items: MenuItem[] };

const CACHE_TTL = 60_000;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const orderIds = readOrderIds();
    if (!orderIds.length) {
      clearClientCache(ORDERS_CACHE_KEY);
      const frame = window.requestAnimationFrame(() => setLoading(false));
      return () => {
        window.cancelAnimationFrame(frame);
        controller.abort();
      };
    }

    let hadCache = false;
    const frame = window.requestAnimationFrame(() => {
      const cached = readClientCache<OrdersView>(ORDERS_CACHE_KEY, CACHE_TTL);
      if (cached) {
        hadCache = true;
        setOrders(cached.orders || []);
        setItems(cached.items || []);
        setLoading(false);
      }
    });

    Promise.all([
      fetch("/api/my-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds }),
        signal: controller.signal,
      }),
      fetch("/api/items", { cache: "no-store", signal: controller.signal }),
    ])
      .then(async ([orderResponse, itemResponse]) => {
        if (!orderResponse.ok || !itemResponse.ok) throw new Error("Could not load orders");
        const orderData = (await orderResponse.json()) as { orders: Order[] };
        const itemData = (await itemResponse.json()) as { items: MenuItem[] };
        const next = { orders: orderData.orders || [], items: itemData.items || [] };
        setOrders(next.orders);
        setItems(next.items);
        writeClientCache(ORDERS_CACHE_KEY, next);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        if (!hadCache) setError(cause instanceof Error ? cause.message : "Could not load orders");
      })
      .finally(() => setLoading(false));

    return () => {
      window.cancelAnimationFrame(frame);
      controller.abort();
    };
  }, []);

  const names = new Map(items.map((item) => [item.id, item.name]));

  function describeOrder(order: Order): string {
    const lines = order.items?.length ? order.items : [{ itemId: order.itemId, qty: order.qty }];
    return lines
      .map((line) => `${names.get(line.itemId) || line.name || `Item #${line.itemId}`} x ${line.qty}`)
      .join(", ");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">My orders</h1>
      <p className="mt-2 text-sm text-[#6f5a4f]">Orders placed from this browser are listed here.</p>

      {loading ? <div className="mt-6 h-48 animate-pulse rounded-2xl bg-white" /> : null}
      {error ? <p className="mt-6 rounded-2xl bg-rose-50 p-4 text-rose-900">{error}</p> : null}

      {!loading && !error && !orders.length ? (
        <div className="mt-6 rounded-2xl border border-[#e7d5c3] bg-white p-10 text-center">
          <p className="font-semibold">No orders placed from this browser yet.</p>
          <Link href="/" className="mt-4 inline-block rounded-full bg-[#b53a2b] px-5 py-3 text-sm font-semibold text-white">
            Browse menu
          </Link>
        </div>
      ) : null}

      {!loading && orders.length ? (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-2xl border border-[#e7d5c3] bg-white p-5 transition hover:border-[#b53a2b]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Order #{order.id}</p>
                  <p className="text-sm text-[#6f5a4f]">{describeOrder(order)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.orderStatus)}`}>
                    {statusLabel(order.orderStatus)}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.paymentStatus)}`}>
                    {statusLabel(order.paymentStatus)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
