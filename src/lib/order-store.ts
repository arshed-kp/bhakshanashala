import { clearClientCache, ORDERS_CACHE_KEY } from "./client-cache";

const STORAGE_KEY = "bhakshannashala-order-ids";

export function readOrderIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);
  } catch {
    return [];
  }
}

export function rememberOrderIds(orderIds: number[]): void {
  const existing = readOrderIds();
  const merged = Array.from(new Set([...existing, ...orderIds]));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  clearClientCache(ORDERS_CACHE_KEY);
}
