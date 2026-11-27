import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const STORE_PATH = join(process.cwd(), "data", "stock-overrides.json");

type Overrides = Record<string, number>;

function readOverrides(): Overrides {
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: Overrides = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
      if (Number.isInteger(value) && Number(value) >= 0) result[key] = Number(value);
    });
    return result;
  } catch {
    return {};
  }
}

function writeOverrides(overrides: Overrides): void {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(overrides, null, 2), "utf8");
}

export function getStockOverride(itemId: number): number | undefined {
  return readOverrides()[String(itemId)];
}

export function setStockOverride(itemId: number, stock: number): void {
  const overrides = readOverrides();
  overrides[String(itemId)] = stock;
  writeOverrides(overrides);
}

export function clearStockOverride(itemId: number): void {
  const overrides = readOverrides();
  delete overrides[String(itemId)];
  writeOverrides(overrides);
}
