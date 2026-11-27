import { NextResponse } from "next/server";
import { updateStock } from "@/lib/apps-script";
import { isAdmin } from "@/lib/auth";
import { bad, fail, nonNegativeInt, positiveInt, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return unauthorized();

  const { id } = await params;
  const itemId = positiveInt(id);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return bad("Invalid body");

  const stock = nonNegativeInt((body as Record<string, unknown>).stock);
  if (!itemId) return bad("Invalid item");
  if (stock === null) return bad("Invalid stock");

  try {
    return NextResponse.json({ ok: true, itemId: await updateStock({ itemId, stock }) });
  } catch (cause) {
    return fail(cause);
  }
}
