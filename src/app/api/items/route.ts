import { NextResponse } from "next/server";
import { addItem, getMenuItems } from "@/lib/apps-script";
import { isAdmin } from "@/lib/auth";
import { bad, fail, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ items: await getMenuItems() });
  } catch (cause) {
    return fail(cause);
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return bad("Invalid body");
  const values = body as Record<string, unknown>;
  const name = String(values.name ?? "").trim();
  const price = Number(values.price);
  const stock = Number(values.stock);
  const image = String(values.image ?? "").trim();

  if (!name) return bad("Name is required");
  if (!Number.isFinite(price) || price <= 0) return bad("Invalid price");
  if (!Number.isInteger(stock) || stock < 0) return bad("Invalid stock");

  try {
    return NextResponse.json(
      { ok: true, itemId: await addItem({ name, price, stock, image }) },
      { status: 201 },
    );
  } catch (cause) {
    return fail(cause);
  }
}
