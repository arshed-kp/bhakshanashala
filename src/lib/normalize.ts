import type { CreateOrderResult, MenuItem, Order, OrderItem } from "./types";

type RecordValue = Record<string, unknown>;

function compactKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function fieldMap(record: RecordValue): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  Object.entries(record).forEach(([key, value]) => {
    if (key.trim()) map[compactKey(key)] = value;
  });
  return map;
}

function field(record: RecordValue, names: string[]): unknown {
  const map = fieldMap(record);
  for (const name of names) {
    const key = compactKey(name);
    if (key in map && map[key] !== undefined && map[key] !== null) return map[key];
  }
  return undefined;
}

function asRecord(value: unknown): RecordValue | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as RecordValue;
}

function toNumber(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isFinite(numeric) ? numeric : 0;
}

function toText(value: unknown): string {
  return String(value ?? "").trim();
}

export function safeImage(value: unknown): string {
  const image = toText(value);
  if (!image) return "/placeholder-food.svg";
  try {
    const url = new URL(image);
    if (url.protocol !== "https:" || url.hostname !== "encrypted-tbn0.gstatic.com") {
      return "/placeholder-food.svg";
    }
    return url.toString();
  } catch {
    return "/placeholder-food.svg";
  }
}

export function assertOk(payload: unknown): void {
  const record = asRecord(payload);
  if (record && record.ok === false) {
    throw new Error(toText(record.error) || "Apps Script request failed");
  }
}

export function normalizeItems(payload: unknown): MenuItem[] {
  assertOk(payload);
  const record = asRecord(payload);
  const source = Array.isArray(payload)
    ? payload
    : record && Array.isArray(record.items)
      ? record.items
      : [];
  return source
    .map((value) => {
      const itemRecord = asRecord(value);
      if (!itemRecord) return null;
      const id = Math.trunc(toNumber(field(itemRecord, ["id", "itemId", "item id"])));
      const name = toText(field(itemRecord, ["name", "item", "item name"]));
      const price = toNumber(field(itemRecord, ["price", "amount"]));
      if (id <= 0 || !name || price <= 0) return null;
      return {
        id,
        name,
        price,
        stock: Math.max(0, Math.trunc(toNumber(field(itemRecord, ["stock", "available"])))),
        image: safeImage(field(itemRecord, ["image", "photo", "url"])),
      };
    })
    .filter((item): item is MenuItem => item !== null);
}

function normalizeOrderItems(value: unknown, fallbackItemId: number, fallbackQty: number): OrderItem[] {
  let source = value;
  if (typeof source === "string" && source.trim()) {
    try {
      source = JSON.parse(source) as unknown;
    } catch {
      source = [];
    }
  }
  if (!Array.isArray(source) || !source.length) {
    return fallbackItemId > 0 ? [{ itemId: fallbackItemId, qty: Math.max(1, fallbackQty) }] : [];
  }
  return source
    .map((entry) => {
      const record = asRecord(entry);
      if (!record) return null;
      const itemId = Math.trunc(toNumber(field(record, ["itemId", "id", "item id"])));
      const qty = Math.trunc(toNumber(field(record, ["qty", "quantity"])));
      if (itemId <= 0 || qty <= 0) return null;
      const name = toText(field(record, ["name", "itemName", "item name"]));
      const price = toNumber(field(record, ["price", "amount"]));
      const total = toNumber(field(record, ["total"]));
      return {
        itemId,
        qty,
        ...(name ? { name } : {}),
        ...(price > 0 ? { price } : {}),
        ...(total > 0 ? { total } : {}),
      };
    })
    .filter((item): item is OrderItem => item !== null);
}

export function normalizeOrders(payload: unknown): Order[] {
  assertOk(payload);
  const record = asRecord(payload);
  const source = Array.isArray(payload)
    ? payload
    : record && Array.isArray(record.orders)
      ? record.orders
      : [];
  return source
    .map((value) => {
      const orderRecord = asRecord(value);
      if (!orderRecord) return null;
      const id = Math.trunc(toNumber(field(orderRecord, ["id", "orderId", "order id"])));
      if (id <= 0) return null;
      return {
        id,
        itemId: Math.trunc(toNumber(field(orderRecord, ["itemId", "item id"]))),
        qty: Math.max(1, Math.trunc(toNumber(field(orderRecord, ["qty", "quantity"])))),
        total: toNumber(field(orderRecord, ["total", "amount"])),
        orderStatus: toText(field(orderRecord, ["orderStatus", "order status"])) || "PENDING",
        paymentStatus: toText(field(orderRecord, ["paymentStatus", "payment status"])) || "PENDING",
        items: normalizeOrderItems(
          field(orderRecord, ["items", "itemDetails", "item details", "orderItems", "order items"]),
          Math.trunc(toNumber(field(orderRecord, ["itemId", "item id"]))),
          Math.max(1, Math.trunc(toNumber(field(orderRecord, ["qty", "quantity"])))),
        ),
      };
    })
    .filter((order): order is Order => order !== null);
}

export function normalizeCreateOrder(payload: unknown): CreateOrderResult {
  assertOk(payload);
  if (typeof payload === "number" || typeof payload === "string") {
    const orderId = Math.trunc(toNumber(payload));
    return { orderId, total: 0, orderStatus: "PENDING", paymentStatus: "PENDING", items: [] };
  }
  const record = asRecord(payload);
  if (!record) throw new Error("Unexpected Apps Script response");
  return {
    orderId: Math.trunc(toNumber(field(record, ["orderId", "id", "order id"]))),
    total: toNumber(field(record, ["total"])),
        orderStatus: toText(field(record, ["orderStatus", "order status"])) || "PENDING",
    paymentStatus: toText(field(record, ["paymentStatus", "payment status"])) || "PENDING",
    items: normalizeOrderItems(
      field(record, ["items", "itemDetails", "item details", "orderItems", "order items"]),
      0,
      1,
    ),
  };
}

export function mutationId(
payload: unknown, name: string): number {
  assertOk(payload);
  if (typeof payload === "number" || typeof payload === "string") {
    return Math.trunc(toNumber(payload));
  }
  const record = asRecord(payload);
  if (!record) throw new Error("Unexpected Apps Script response");
  return Math.trunc(toNumber(field(record, [name, "id"])));
}
