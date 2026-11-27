import {
  assertOk,
  mutationId,
  normalizeCreateOrder,
  normalizeItems,
  normalizeOrders,
} from "./normalize";
import { getBill, getBills, saveBill, updateBillStatus } from "./bills";
import { getHiddenItemIds, hideItem, unhideItem } from "./hidden-items";
import { cachedRead, invalidateScriptCache } from "./script-cache";
import { clearStockOverride, getStockOverride, setStockOverride } from "./stock-overrides";
import type { Bill, CreateOrderResult, ItemInput, MenuItem, Order, OrderItem } from "./types";

const MENU_CACHE_KEY = "apps-script:menu";
const ORDERS_CACHE_KEY = "apps-script:orders";

function endpoint(): string {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) throw new Error("APPS_SCRIPT_URL is not configured");
  return url;
}

function secret(): string {
  const key = process.env.APPS_SCRIPT_KEY;
  if (!key) throw new Error("APPS_SCRIPT_KEY is not configured");
  return key;
}

async function parse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: text.slice(0, 200) };
  }
}

async function request(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const payload = await parse(response);
  assertOk(payload);
  return payload;
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const hidden = new Set(getHiddenItemIds());
  const items = await cachedRead(MENU_CACHE_KEY, async () => {
    const url = new URL(endpoint());
    url.searchParams.set("action", "available");
    url.searchParams.set("key", secret());
    return normalizeItems(await request(url.toString()));
  });
  return items
    .filter((item) => !hidden.has(item.id))
    .map((item) => {
      const override = getStockOverride(item.id);
      return override === undefined ? item : { ...item, stock: override };
    });
}

function applyStockOverrides(items: OrderItem[]): void {
  items.forEach(({ itemId, qty }) => {
    const override = getStockOverride(itemId);
    if (override !== undefined) setStockOverride(itemId, Math.max(0, override - qty));
  });
}

function groupOrdersWithBills(remote: Order[], bills: Bill[]): Order[] {
  const groupedIds = new Set<number>();
  const grouped = bills
    .map((bill) => {
      const members = remote.filter((order) => bill.orderIds.includes(order.id));
      if (!members.length) return null;
      members.forEach((order) => groupedIds.add(order.id));
      const items = bill.items?.length ? bill.items : members.flatMap((order) => order.items);
      const orderStatus = members.every((order) => order.orderStatus === members[0].orderStatus)
        ? members[0].orderStatus
        : bill.orderStatus || "PENDING";
      const paymentStatus = members.every((order) => order.paymentStatus === members[0].paymentStatus)
        ? members[0].paymentStatus
        : bill.paymentStatus || "PENDING";
      return {
        id: bill.id,
        itemId: items[0]?.itemId || members[0].itemId,
        qty: items.reduce((total, item) => total + item.qty, 0),
        total: bill.total || members.reduce((total, order) => total + order.total, 0),
        orderStatus,
        paymentStatus,
        items,
      } satisfies Order;
    })
    .filter((order): order is Order => order !== null);
  return [...remote.filter((order) => !groupedIds.has(order.id)), ...grouped].sort((a, b) => b.id - a.id);
}

export async function getOrders(): Promise<Order[]> {
  const remote = await cachedRead(ORDERS_CACHE_KEY, async () => {
    const url = new URL(endpoint());
    url.searchParams.set("action", "orders");
    url.searchParams.set("key", secret());
    return normalizeOrders(await request(url.toString()));
  });
  return groupOrdersWithBills(remote, getBills());
}

async function createSingleOrder(line: OrderItem): Promise<CreateOrderResult> {
  return normalizeCreateOrder(
    await request(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: line.itemId, qty: line.qty, action: "createOrder", key: secret() }),
    }),
  );
}

export async function createOrder(input: { items: OrderItem[] }): Promise<CreateOrderResult> {
  const items = input.items.filter((line) => line.itemId > 0 && line.qty > 0);
  if (!items.length) throw new Error("Invalid item");

  try {
    const result = normalizeCreateOrder(
      await request(endpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, action: "createOrder", key: secret() }),
      }),
    );
    if (!result.orderId) throw new Error("Invalid item");
    applyStockOverrides(items);
    saveBill({
      id: result.orderId,
      orderIds: [result.orderId],
      items: result.items?.length ? result.items : items,
      total: result.total,
      orderStatus: result.orderStatus,
      paymentStatus: result.paymentStatus,
    });
    invalidateScriptCache(MENU_CACHE_KEY);
    invalidateScriptCache(ORDERS_CACHE_KEY);
    return result;
  } catch (cause) {
    if (!(cause instanceof Error) || !/unknown action|invalid item/i.test(cause.message)) throw cause;

    const placed: CreateOrderResult[] = [];
    for (const line of items) placed.push(await createSingleOrder(line));
    const billId = Math.min(...placed.map((result) => result.orderId));
    const bill: Bill = {
      id: billId,
      orderIds: placed.map((result) => result.orderId),
      items,
      total: placed.reduce((total, result) => total + result.total, 0),
      orderStatus: placed[0].orderStatus,
      paymentStatus: placed[0].paymentStatus,
    };
    applyStockOverrides(items);
    saveBill(bill);
    invalidateScriptCache(MENU_CACHE_KEY);
    invalidateScriptCache(ORDERS_CACHE_KEY);
    return {
      orderId: billId,
      total: bill.total,
      orderStatus: bill.orderStatus || "PENDING",
      paymentStatus: bill.paymentStatus || "PENDING",
      items,
    };
  }
}

export async function updateOrder(input: {
  orderId: number;
  orderStatus?: string;
  paymentStatus?: string;
}): Promise<number> {
  const bill = getBill(input.orderId);
  const orderIds = bill?.orderIds || [input.orderId];
  for (const orderId of orderIds) {
    mutationId(
      await request(endpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, orderStatus: input.orderStatus, paymentStatus: input.paymentStatus, action: "updateOrder", key: secret() }),
      }),
      "orderId",
    );
  }
  if (bill) {
    if (input.orderStatus) updateBillStatus(bill.id, "orderStatus", input.orderStatus);
    if (input.paymentStatus) updateBillStatus(bill.id, "paymentStatus", input.paymentStatus);
  }
  invalidateScriptCache(ORDERS_CACHE_KEY);
  return input.orderId;
}

export async function addItem(input: ItemInput): Promise<number> {
  const itemId = mutationId(
    await request(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, action: "addItem", key: secret() }),
    }),
    "itemId",
  );
  invalidateScriptCache(MENU_CACHE_KEY);
  return itemId;
}

export async function updateStock(input: { itemId: number; stock: number }): Promise<number> {
  try {
    const itemId = mutationId(
      await request(endpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, action: "updateStock", key: secret() }),
      }),
      "itemId",
    );
    if (!itemId) throw new Error("Unknown action");
    clearStockOverride(input.itemId);
    invalidateScriptCache(MENU_CACHE_KEY);
    return itemId;
  } catch (cause) {
    if (cause instanceof Error && /unknown action/i.test(cause.message)) {
      setStockOverride(input.itemId, input.stock);
      invalidateScriptCache(MENU_CACHE_KEY);
      return input.itemId;
    }
    throw cause;
  }
}

export async function deleteItem(itemId: number): Promise<number> {
  try {
    const deletedId = mutationId(
      await request(endpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, action: "deleteItem", key: secret() }),
      }),
      "itemId",
    );
    if (!deletedId) throw new Error("Unknown action");
    unhideItem(itemId);
    invalidateScriptCache(MENU_CACHE_KEY);
    return deletedId;
  } catch (cause) {
    if (cause instanceof Error && /unknown action/i.test(cause.message)) {
      hideItem(itemId);
      invalidateScriptCache(MENU_CACHE_KEY);
      return itemId;
    }
    throw cause;
  }
}
