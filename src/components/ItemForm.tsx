"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearClientCache, MENU_CACHE_KEY } from "@/lib/client-cache";

export function ItemForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: Number(price),
          stock: Number(stock),
          image: image.trim(),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Could not save item");
      clearClientCache(MENU_CACHE_KEY);
      router.push("/admin/items");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save item");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Add item</h1>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-2xl border border-[#e7d5c3] bg-white p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">Name</label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[#d9bca0] px-4 py-3 outline-none focus:border-[#b53a2b]"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="block text-sm font-medium">Price</label>
            <input
              id="price"
              type="number"
              min="1"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#d9bca0] px-4 py-3 outline-none focus:border-[#b53a2b]"
            />
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium">Stock</label>
            <input
              id="stock"
              type="number"
              min="0"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#d9bca0] px-4 py-3 outline-none focus:border-[#b53a2b]"
            />
          </div>
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-medium">Image URL</label>
          <input
            id="image"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[#d9bca0] px-4 py-3 outline-none focus:border-[#b53a2b]"
          />
          <p className="mt-2 text-xs text-[#6f5a4f]">Only configured image hosts are displayed; others show a placeholder.</p>
        </div>
        {error ? <p className="rounded-xl bg-rose-50 p-3 text-rose-900">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-[#b53a2b] px-6 py-3 text-sm font-semibold text-white disabled:bg-[#c9bcb3]"
        >
          {busy ? "Saving..." : "Save item"}
        </button>
      </form>
    </div>
  );
}
