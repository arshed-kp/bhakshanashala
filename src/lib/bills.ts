import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Bill } from "./types";

const STORE_PATH = join(process.cwd(), "data", "bills.json");

function readBills(): Bill[] {
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((bill): bill is Bill => {
      if (!bill || typeof bill !== "object") return false;
      const value = bill as Partial<Bill>;
      return Number.isInteger(value.id) && Number(value.id) > 0 && Array.isArray(value.orderIds);
    });
  } catch {
    return [];
  }
}

function writeBills(bills: Bill[]): void {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(bills, null, 2), "utf8");
}

export function getBills(): Bill[] {
  return readBills();
}

export function getBill(id: number): Bill | undefined {
  return readBills().find((bill) => bill.id === id);
}

export function saveBill(bill: Bill): void {
  writeBills([...readBills().filter((value) => value.id !== bill.id), bill]);
}

export function updateBillStatus(
  id: number,
  field: "orderStatus" | "paymentStatus",
  value: string,
): void {
  writeBills(
    readBills().map((bill) => (bill.id === id ? { ...bill, [field]: value } : bill)),
  );
}
