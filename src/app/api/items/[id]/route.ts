import { NextResponse } from "next/server";
import { deleteItem } from "@/lib/apps-script";
import { isAdmin } from "@/lib/auth";
import { bad, fail, positiveInt, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return unauthorized();

  const { id } = await params;
  const itemId = positiveInt(id);
  if (!itemId) return bad("Invalid item");

  try {
    return NextResponse.json({ ok: true, itemId: await deleteItem(itemId) });
  } catch (cause) {
    return fail(cause);
  }
}
