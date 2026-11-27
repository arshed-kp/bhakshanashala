"use client";

import { useCart } from "./CartProvider";
import { ItemImage } from "./ItemImage";
import { rupees } from "@/lib/format";
import type { MenuItem } from "@/lib/types";

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { items, add, setQty, remove } = useCart();
  const soldOut = item.stock <= 0;
  const line = items.find((value) => value.itemId === item.id);

  return (
    <article className="overflow-hidden rounded-2xl border border-[#e7d5c3] bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-[#f6e7d4]">
        <ItemImage src={item.image} alt={item.name} />
        {!soldOut && item.stock <= 20 ? (
          <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-900 shadow-sm">
            <span aria-hidden="true" className="mr-1 font-bold">!</span>
            Limited stock
          </span>
        ) : null}
        {soldOut ? (
          <div className="absolute inset-0 grid place-items-center bg-white/70 font-semibold text-[#6f5a4f]">
            Sold out
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-tight">{item.name}</h3>
          <span className="whitespace-nowrap font-semibold text-[#b53a2b]">{rupees(item.price)}</span>
        </div>
        {!soldOut && item.stock <= 20 ? (
          <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
            <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full bg-amber-200 text-[11px] font-bold">
              !
            </span>
            Only {item.stock} left — grab fast
          </p>
        ) : null}
        {line ? (
          <div className="flex items-center justify-between rounded-full border border-[#d9bca0] px-2 py-1">
            <button
              type="button"
              aria-label={`Remove one ${item.name}`}
              onClick={() => (line.qty <= 1 ? remove(item.id) : setQty(item.id, line.qty - 1))}
              className="grid size-8 place-items-center rounded-full text-lg hover:bg-[#f1ddca]"
            >
              -
            </button>
            <span className="text-sm font-semibold" aria-label={`${line.qty} in cart`}>
              {line.qty}
            </span>
            <button
              type="button"
              aria-label={`Add one ${item.name}`}
              onClick={() => add(item, 1)}
              disabled={line.qty >= item.stock}
              className="grid size-8 place-items-center rounded-full text-lg hover:bg-[#f1ddca] disabled:cursor-not-allowed disabled:text-[#c9bcb3]"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => add(item, 1)}
            disabled={soldOut}
            className="rounded-full bg-[#24150f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#b53a2b] disabled:cursor-not-allowed disabled:bg-[#c9bcb3]"
          >
            {soldOut ? "Unavailable" : "Add to cart"}
          </button>
        )}
      </div>
    </article>
  );
}
