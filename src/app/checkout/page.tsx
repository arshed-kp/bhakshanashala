"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { clearClientCache, MENU_CACHE_KEY } from "@/lib/client-cache";
import { rupees } from "@/lib/format";
import { normalizeCreateOrder } from "@/lib/normalize";
import { rememberOrderIds } from "@/lib/order-store";
import type { CreateOrderResult } from "@/lib/types";

export default function CheckoutPage() {
  const { items, clear, subtotal } = useCart();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CreateOrderResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((line) => ({ itemId: line.itemId, qty: line.qty })),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Could not place order");
      const placed = normalizeCreateOrder(payload);
      rememberOrderIds([placed.orderId]);
      clearClientCache(MENU_CACHE_KEY);
      clear();
      setResult(placed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
          <h1 className="text-2xl font-semibold text-emerald-950">Order placed</h1>
          <p className="mt-2 text-emerald-900">
            Order #{result.orderId} has been recorded as one bill. You can track it from My orders on this browser.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/orders" className="rounded-full bg-[#24150f] px-5 py-3 text-sm font-semibold text-white">
              Track my orders
            </Link>
            <Link href="/" className="rounded-full border border-[#d9bca0] px-5 py-3 text-sm font-semibold">
              Back to menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Checkout</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <form onSubmit={handleSubmit} className="h-fit space-y-5 rounded-2xl border border-[#e7d5c3] bg-white p-6">
          <div>
            <h2 className="font-semibold">Confirm your order</h2>
            <p className="mt-2 text-sm text-[#6f5a4f]">
              Your order is sent straight to our kitchen sheet. Payment and delivery are confirmed manually.
            </p>
          </div>
          {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-[#b53a2b] px-6 py-3 text-sm font-semibold text-white disabled:bg-[#c9bcb3]"
          >
            {busy ? "Placing order..." : "Place order"}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-[#e7d5c3] bg-white p-5">
          <h2 className="font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((line) => (
              <li key={line.itemId} className="flex justify-between gap-3">
                <span>{line.name} x {line.qty}</span>
                <span>{rupees(line.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-[#e7d5c3] pt-4 font-semibold">
            <span>Total</span>
            <span>{rupees(subtotal)}</span>
          </div>
          <Link href="/cart" className="mt-4 block text-center text-sm text-[#b53a2b] underline">
            Edit cart
          </Link>
        </aside>
      </div>
    </div>
  );
}
