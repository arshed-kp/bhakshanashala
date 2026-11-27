import { NextResponse } from "next/server";
import { createOrder, getOrders } from "@/lib/apps-script";
import { isAdmin } from "@/lib/auth";
import { bad, fail, positiveInt } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ orders: await getOrders() });
  } catch (cause) {
    return fail(cause);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return bad("Invalid body");
  const values = body as Record<string, unknown>;

  const rawItems = Array.isArray(values.items)
    ? values.items
    : [{ itemId: values.itemId, qty: values.qty }];
  const items = rawItems.map((value) => {
    const record = value as Record<string, unknown>;
    return {
      itemId: positiveInt(record?.itemId),
      qty: positiveInt(record?.qty),
    };
  });

  if (!items.length || items.some((item) => !item.itemId || !item.qty)) return bad("Invalid items");

  try {
    return NextResponse.json(
      await createOrder({ items: items.map((item) => ({ itemId: item.itemId as number, qty: item.qty as number })) }),
      { status: 201 },
    );
  } catch (cause) {
    return fail(cause);
  }
}
