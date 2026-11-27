"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { ItemImage } from "@/components/ItemImage";
import { rupees } from "@/lib/format";

export default function CartPage() {
  const { items, ready, setQty, remove, clear, subtotal } = useCart();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Your cart</h1>
        {items.length ? (
          <button type="button" onClick={clear} className="text-sm text-[#b53a2b] underline">
            Clear cart
          </button>
        ) : null}
      </div>

      {!ready ? <div className="h-40 animate-pulse rounded-2xl bg-white" /> : null}

      {ready && !items.length ? (
        <div className="rounded-2xl border border-[#e7d5c3] bg-white p-10 text-center">
          <p className="text-lg font-semibold">Your cart is empty.</p>
          <p className="mt-1 text-sm text-[#6f5a4f]">Add something from the menu to get started.</p>
          <Link href="/" className="mt-5 inline-block rounded-full bg-[#b53a2b] px-5 py-3 text-sm font-semibold text-white">
            Browse menu
          </Link>
        </div>
      ) : null}

      {ready && items.length ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-3">
            {items.map((line) => (
              <article key={line.itemId} className="flex gap-4 rounded-2xl border border-[#e7d5c3] bg-white p-4">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-[#f6e7d4]">
                  <ItemImage src={line.image} alt={line.name} className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{line.name}</h2>
                      <p className="text-sm text-[#6f5a4f]">{rupees(line.price)} each</p>
                    </div>
                    <button type="button" onClick={() => remove(line.itemId)} className="text-sm text-[#b53a2b] underline">
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-full border border-[#d9bca0]">
                      <button
                        type="button"
                        aria-label={`Decrease ${line.name}`}
                        onClick={() => setQty(line.itemId, line.qty - 1)}
                        className="size-9 rounded-full hover:bg-[#f1ddca]"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">{line.qty}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${line.name}`}
                        onClick={() => setQty(line.itemId, line.qty + 1)}
                        className="size-9 rounded-full hover:bg-[#f1ddca]"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-semibold">{rupees(line.price * line.qty)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-[#e7d5c3] bg-white p-5">
            <h2 className="font-semibold">Summary</h2>
            <div className="mt-4 flex justify-between border-t border-[#e7d5c3] pt-4">
              <span>Subtotal</span>
              <span className="font-semibold">{rupees(subtotal)}</span>
            </div>
            <p className="mt-3 text-xs text-[#6f5a4f]">Payment is collected manually after confirmation.</p>
            <Link href="/checkout" className="mt-5 block rounded-full bg-[#b53a2b] py-3 text-center text-sm font-semibold text-white">
              Continue to checkout
            </Link>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
