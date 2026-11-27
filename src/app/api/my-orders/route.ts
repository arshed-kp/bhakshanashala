import { NextResponse } from "next/server";
import { getOrders } from "@/lib/apps-script";
import { bad, fail, positiveInt } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return bad("Invalid body");
  const values = body as Record<string, unknown>;
  if (!Array.isArray(values.orderIds)) return bad("Invalid order ids");

  const orderIds = values.orderIds
    .map((value) => positiveInt(value))
    .filter((value): value is number => value !== null);

  if (!orderIds.length) return NextResponse.json({ orders: [] });

  try {
    const wanted = new Set(orderIds);
    const orders = await getOrders();
    return NextResponse.json({ orders: orders.filter((order) => wanted.has(order.id)) });
  } catch (cause) {
    return fail(cause);
  }
}
