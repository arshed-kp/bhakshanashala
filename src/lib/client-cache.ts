export const MENU_CACHE_KEY = "bhakshannashala-menu-cache";
export const ORDERS_CACHE_KEY = "bhakshannashala-orders-cache";

type CachedValue<T> = {
  savedAt: number;
  value: T;
};

export function readClientCache<T>(key: string, ttl: number): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedValue<T>;
    if (!Number.isFinite(cached.savedAt) || Date.now() - cached.savedAt > ttl) return null;
    return cached.value;
  } catch {
    return null;
  }
}

export function writeClientCache<T>(key: string, value: T): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), value }));
  } catch {
    return;
  }
}

export function clearClientCache(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    return;
  }
}
