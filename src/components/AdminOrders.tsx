"use client";

import { useEffect, useState } from "react";
import { clearClientCache, ORDERS_CACHE_KEY } from "@/lib/client-cache";
import { rupees, statusLabel, statusTone } from "@/lib/format";
import type { Order } from "@/lib/types";

const orderStatuses = ["PENDING", "APPROVED", "CANCELLED"];
const paymentStatuses = ["PENDING", "PAID"];

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/orders", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load orders");
        setOrders(((await response.json()) as { orders: Order[] }).orders || []);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load orders"))
      .finally(() => setLoading(false));
  }, []);

  async function update(orderId: number, field: "orderStatus" | "paymentStatus", value: string) {
    const previous = orders;
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, [field]: value } : order)),
    );
    setError("");
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not update order");
      }
      clearClientCache(ORDERS_CACHE_KEY);
    } catch (cause) {
      setOrders(previous);
      setError(cause instanceof Error ? cause.message : "Could not update order");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>
      {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-rose-900">{error}</p> : null}
      {loading ? <div className="mt-5 h-64 animate-pulse rounded-2xl bg-white" /> : null}

      {!loading && !orders.length ? (
        <p className="mt-5 rounded-2xl border border-[#e7d5c3] bg-white p-8 text-center">No orders found.</p>
      ) : null}

      {!loading && orders.length ? (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#e7d5c3] bg-white">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="bg-[#f6e7d4] text-xs uppercase tracking-wide text-[#6f5a4f]">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Order status</th>
                <th className="px-4 py-3">Payment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-[#e7d5c3]">
                  <td className="px-4 py-3 font-medium">#{order.id}</td>
                  <td className="px-4 py-3">
                    {(order.items?.length ? order.items : [{ itemId: order.itemId, qty: order.qty }])
                      .map((line) => `${line.name || `Item #${line.itemId}`} x ${line.qty}`)
                      .join(", ")}
                  </td>
                  <td className="px-4 py-3 font-medium">{rupees(order.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`mr-2 rounded-full px-2 py-1 text-xs ${statusTone(order.orderStatus)}`}>
                      {statusLabel(order.orderStatus)}
                    </span>
                    <select
                      aria-label={`Order status for ${order.id}`}
                      value={statusLabel(order.orderStatus)}
                      onChange={(event) => update(order.id, "orderStatus", event.target.value)}
                      className="rounded-lg border border-[#d9bca0] px-2 py-1 text-xs"
                    >
                      {orderStatuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`mr-2 rounded-full px-2 py-1 text-xs ${statusTone(order.paymentStatus)}`}>
                      {statusLabel(order.paymentStatus)}
                    </span>
                    <select
                      aria-label={`Payment status for ${order.id}`}
                      value={statusLabel(order.paymentStatus)}
                      onChange={(event) => update(order.id, "paymentStatus", event.target.value)}
                      className="rounded-lg border border-[#d9bca0] px-2 py-1 text-xs"
                    >
                      {paymentStatuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
