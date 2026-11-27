"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { rupees, statusLabel, statusTone } from "@/lib/format";
import type { MenuItem, Order } from "@/lib/types";

export function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/orders", { cache: "no-store" }),
      fetch("/api/items", { cache: "no-store" }),
    ])
      .then(async ([orderResponse, itemResponse]) => {
        if (!orderResponse.ok || !itemResponse.ok) throw new Error("Could not load dashboard");
        setOrders(((await orderResponse.json()) as { orders: Order[] }).orders || []);
        setItems(((await itemResponse.json()) as { items: MenuItem[] }).items || []);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load dashboard"));
  }, []);

  const pending = orders.filter((order) => statusLabel(order.orderStatus) === "PENDING").length;
  const unpaid = orders.filter((order) => statusLabel(order.paymentStatus) !== "PAID").length;
  const lowStock = items.filter((item) => item.stock <= 5).length;
  const revenue = orders
    .filter((order) => statusLabel(order.orderStatus) !== "CANCELLED")
    .reduce((total, order) => total + order.total, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Overview</h1>
      {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-rose-900">{error}</p> : null}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#e7d5c3] bg-white p-5">
          <p className="text-sm text-[#6f5a4f]">Orders</p>
          <p className="mt-2 text-3xl font-semibold">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-[#e7d5c3] bg-white p-5">
          <p className="text-sm text-[#6f5a4f]">Pending approval</p>
          <p className="mt-2 text-3xl font-semibold">{pending}</p>
        </div>
        <div className="rounded-2xl border border-[#e7d5c3] bg-white p-5">
          <p className="text-sm text-[#6f5a4f]">Unpaid</p>
          <p className="mt-2 text-3xl font-semibold">{unpaid}</p>
        </div>
        <div className="rounded-2xl border border-[#e7d5c3] bg-white p-5">
          <p className="text-sm text-[#6f5a4f]">Recorded total</p>
          <p className="mt-2 text-3xl font-semibold">{rupees(revenue)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e7d5c3] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-[#b53a2b] underline">View all</Link>
          </div>
          <div className="mt-4 space-y-2">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-3 text-sm">
                <span>#{order.id} · {order.items?.length > 1 ? `${order.items.length} items` : `Item #${order.itemId}`}</span>
                <span className={`rounded-full px-2 py-1 text-xs ${statusTone(order.orderStatus)}`}>
                  {statusLabel(order.orderStatus)}
                </span>
              </div>
            ))}
            {!orders.length ? <p className="text-sm text-[#6f5a4f]">No orders yet.</p> : null}
          </div>
        </div>
        <div className="rounded-2xl border border-[#e7d5c3] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Inventory</h2>
            <Link href="/admin/items" className="text-sm text-[#b53a2b] underline">Manage</Link>
          </div>
          <p className="mt-4 text-sm text-[#6f5a4f]">{items.length} items on the menu.</p>
          <p className="mt-1 text-sm text-[#6f5a4f]">{lowStock} item(s) at 5 stock or below.</p>
        </div>
      </div>
    </div>
  );
}
