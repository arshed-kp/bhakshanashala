import { NextResponse } from "next/server";
import { updateOrder } from "@/lib/apps-script";
import { isAdmin } from "@/lib/auth";
import { bad, fail, positiveInt, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!(await isAdmin())) return unauthorized();

  const orderId = positiveInt((await context.params).id);
  if (!orderId) return bad("Invalid order id");

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return bad("Invalid body");
  const values = body as Record<string, unknown>;

  const orderStatus = values.orderStatus === undefined ? undefined : String(values.orderStatus ?? "").trim().toUpperCase();
  const paymentStatus = values.paymentStatus === undefined ? undefined : String(values.paymentStatus ?? "").trim().toUpperCase();

  if (orderStatus === "" || paymentStatus === "") return bad("Invalid status");
  if (!orderStatus && !paymentStatus) return bad("No changes supplied");

  try {
    return NextResponse.json({
      ok: true,
      orderId: await updateOrder({ orderId, orderStatus, paymentStatus }),
    });
  } catch (cause) {
    return fail(cause);
  }
}
