import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const STORE_PATH = join(process.cwd(), "data", "hidden-items.json");

function readHidden(): number[] {
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);
  } catch {
    return [];
  }
}

function writeHidden(ids: number[]): void {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(Array.from(new Set(ids)), null, 2), "utf8");
}

export function getHiddenItemIds(): number[] {
  return readHidden();
}

export function hideItem(itemId: number): void {
  writeHidden([...readHidden(), itemId]);
}

export function unhideItem(itemId: number): void {
  writeHidden(readHidden().filter((value) => value !== itemId));
}
