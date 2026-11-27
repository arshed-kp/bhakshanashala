"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ORDERS_CACHE_KEY, readClientCache } from "@/lib/client-cache";
import { rupees, statusLabel, statusTone } from "@/lib/format";
import { readOrderIds } from "@/lib/order-store";
import type { MenuItem, Order } from "@/lib/types";

const CACHE_TTL = 60_000;

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const orderIds = readOrderIds();
    if (!orderIds.length) {
      const frame = window.requestAnimationFrame(() => setLoading(false));
      return () => {
        window.cancelAnimationFrame(frame);
        controller.abort();
      };
    }

    let hadCache = false;
    const frame = window.requestAnimationFrame(() => {
      const cached = readClientCache<{ orders: Order[]; items: MenuItem[] }>(ORDERS_CACHE_KEY, CACHE_TTL);
      const cachedOrder = cached?.orders?.find((value) => String(value.id) === params.id);
      if (cachedOrder) {
        hadCache = true;
        setOrder(cachedOrder);
        setLoading(false);
      }
    });

    fetch("/api/my-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load order");
        return response.json() as Promise<{ orders: Order[] }>;
      })
      .then((data) => setOrder((data.orders || []).find((value) => String(value.id) === params.id) || null))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        if (!hadCache) setOrder(null);
      })
      .finally(() => setLoading(false));

    return () => {
      window.cancelAnimationFrame(frame);
      controller.abort();
    };
  }, [params.id]);

  if (loading) return <div className="mx-auto mt-10 h-48 max-w-3xl animate-pulse rounded-2xl bg-white px-4" />;

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-[#e7d5c3] bg-white p-8">
          <h1 className="text-2xl font-semibold">Order not found</h1>
          <p className="mt-2 text-sm text-[#6f5a4f]">Check My orders for the orders saved in this browser.</p>
          <Link href="/orders" className="mt-5 inline-block rounded-full bg-[#b53a2b] px-5 py-3 text-sm font-semibold text-white">
            My orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/orders" className="text-sm text-[#b53a2b] underline">Back to orders</Link>
      <div className="mt-4 rounded-2xl border border-[#e7d5c3] bg-white p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Order #{order.id}</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.orderStatus)}`}>
            {statusLabel(order.orderStatus)}
          </span>
        </div>
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-[#6f5a4f]">Items in this bill</h2>
          <ul className="mt-2 space-y-2">
            {(order.items?.length ? order.items : [{ itemId: order.itemId, qty: order.qty }]).map((line, index) => (
              <li key={`${line.itemId}-${index}`} className="flex justify-between gap-3 rounded-xl bg-[#f6e7d4] px-4 py-3 text-sm">
                <span>{line.name || `Item #${line.itemId}`} x {line.qty}</span>
                <span>{line.total !== undefined ? rupees(line.total) : line.price !== undefined ? rupees(line.price * line.qty) : ""}</span>
              </li>
            ))}
          </ul>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6f5a4f]">Item ID</dt>
            <dd className="font-medium">{order.itemId}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6f5a4f]">Quantity</dt>
            <dd className="font-medium">{order.qty}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6f5a4f]">Payment</dt>
            <dd className={`font-medium ${statusTone(order.paymentStatus)} rounded-full px-3 py-1 inline-block`}>
              {statusLabel(order.paymentStatus)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#6f5a4f]">Total</dt>
            <dd className="font-medium">{rupees(order.total)}</dd>
          </div>
        </dl>
        <p className="mt-6 rounded-xl bg-[#f6e7d4] p-4 text-sm">
          Payment is handled manually. The admin panel updates order and payment status in the same sheet.
        </p>
      </div>
    </div>
  );
}
