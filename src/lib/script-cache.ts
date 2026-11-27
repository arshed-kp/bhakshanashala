const CACHE_TTL = 30_000;

type CacheEntry = {
  value?: unknown;
  savedAt: number;
  promise?: Promise<unknown>;
  version: number;
};

type CacheState = {
  entries: Map<string, CacheEntry>;
  versions: Map<string, number>;
};

const globalState = globalThis as typeof globalThis & { __bhakshannashalaScriptCache?: CacheState };
const state: CacheState = globalState.__bhakshannashalaScriptCache ?? {
  entries: new Map<string, CacheEntry>(),
  versions: new Map<string, number>(),
};
globalState.__bhakshannashalaScriptCache = state;

const entries = state.entries;
const versions = state.versions;

function versionOf(key: string): number {
  return versions.get(key) ?? 0;
}

function currentEntry(key: string, version: number): CacheEntry | undefined {
  const entry = entries.get(key);
  return entry?.version === version ? entry : undefined;
}

function finish(key: string, version: number, value: unknown): unknown {
  const latest = currentEntry(key, version);
  if (latest) {
    latest.value = value;
    latest.savedAt = Date.now();
    latest.promise = undefined;
  }
  return value;
}

function fail(key: string, version: number, cause: unknown): never {
  const latest = currentEntry(key, version);
  if (latest) latest.promise = undefined;
  throw cause;
}

export async function cachedRead<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const version = versionOf(key);
  const entry = currentEntry(key, version);

  if (entry?.value !== undefined) {
    if (Date.now() - entry.savedAt < CACHE_TTL) return entry.value as T;
    if (!entry.promise) {
      entry.promise = loader()
        .then((value) => finish(key, version, value))
        .catch((cause: unknown) => fail(key, version, cause));
    }
    return entry.value as T;
  }

  if (entry?.promise) return entry.promise as Promise<T>;

  const promise = loader()
    .then((value) => finish(key, version, value))
    .catch((cause: unknown) => fail(key, version, cause));
  entries.set(key, { savedAt: Date.now(), version, promise });
  return promise as Promise<T>;
}

export function invalidateScriptCache(key: string): void {
  versions.set(key, versionOf(key) + 1);
  entries.delete(key);
}
