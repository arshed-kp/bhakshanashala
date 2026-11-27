"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ItemImage } from "./ItemImage";
import { clearClientCache, MENU_CACHE_KEY } from "@/lib/client-cache";
import { rupees } from "@/lib/format";
import type { MenuItem } from "@/lib/types";

export function AdminItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{ id: number; value: string } | null>(null);
  const [editError, setEditError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/items", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load items");
        setItems(((await response.json()) as { items: MenuItem[] }).items || []);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load items"))
      .finally(() => setLoading(false));
  }, []);

  async function saveStock(item: MenuItem) {
    if (!editing || editing.id !== item.id) return;
    const stock = Number(editing.value);
    if (!Number.isInteger(stock) || stock < 0) {
      setEditError("Enter a valid stock number.");
      return;
    }

    const previous = item.stock;
    setItems((current) => current.map((value) => (value.id === item.id ? { ...value, stock } : value)));
    setEditError("");
    setSavingId(item.id);

    try {
      const response = await fetch(`/api/items/${item.id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Could not update stock");
      clearClientCache(MENU_CACHE_KEY);
      setEditing(null);
    } catch (cause) {
      setItems((current) => current.map((value) => (value.id === item.id ? { ...value, stock: previous } : value)));
      setEditError(cause instanceof Error ? cause.message : "Could not update stock");
    } finally {
      setSavingId(null);
    }
  }

  async function removeItem(item: MenuItem) {
    if (!window.confirm(`Remove ${item.name}?`)) return;
    setError("");
    setRemovingId(item.id);
    try {
      const response = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Could not remove item");
      setItems((current) => current.filter((value) => value.id !== item.id));
      clearClientCache(MENU_CACHE_KEY);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove item");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Items</h1>
        <Link href="/admin/items/new" className="rounded-full bg-[#b53a2b] px-5 py-3 text-sm font-semibold text-white">
          Add item
        </Link>
      </div>
      {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-rose-900">{error}</p> : null}
      {loading ? <div className="mt-5 h-64 animate-pulse rounded-2xl bg-white" /> : null}

      {!loading && !items.length ? (
        <p className="mt-5 rounded-2xl border border-[#e7d5c3] bg-white p-8 text-center">No items found.</p>
      ) : null}

      {!loading && items.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const isEditing = editing?.id === item.id;
            return (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-[#e7d5c3] bg-white">
                <div className="pointer-events-none relative aspect-[4/3] bg-[#f6e7d4]">
                  <ItemImage src={item.image} alt={item.name} />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold">{item.name}</h2>
                    <span className="font-semibold text-[#b53a2b]">{rupees(item.price)}</span>
                  </div>
                  {isEditing ? (
                    <div className="mt-3 rounded-xl border border-[#d9bca0] p-3">
                      <label htmlFor={`stock-${item.id}`} className="text-xs text-[#6f5a4f]">
                        Stock quantity
                      </label>
                      <input
                        id={`stock-${item.id}`}
                        aria-label={`Stock for ${item.name}`}
                        type="number"
                        min="0"
                        value={editing.value}
                        onChange={(event) => setEditing({ id: item.id, value: event.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#d9bca0] px-3 py-2 outline-none focus:border-[#b53a2b]"
                      />
                      {editError ? <p className="mt-2 text-xs text-rose-700">{editError}</p> : null}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveStock(item)}
                          disabled={savingId === item.id}
                          aria-label={`Save stock for ${item.name}`}
                          className="rounded-full bg-[#b53a2b] px-4 py-2 text-xs font-semibold text-white disabled:bg-[#c9bcb3]"
                        >
                          {savingId === item.id ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(null);
                            setEditError("");
                          }}
                          aria-label={`Cancel stock edit for ${item.name}`}
                          className="rounded-full border border-[#d9bca0] px-4 py-2 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-[#6f5a4f]">Stock: {item.stock}</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing({ id: item.id, value: String(item.stock) });
                            setEditError("");
                          }}
                          aria-label={`Change stock for ${item.name}`}
                          className="rounded-full border border-[#d9bca0] px-3 py-1 text-xs font-semibold hover:bg-[#f1ddca]"
                        >
                          Change stock
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          disabled={removingId === item.id}
                          aria-label={`Remove ${item.name}`}
                          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-[#c9bcb3]"
                        >
                          {removingId === item.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
