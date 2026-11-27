import { NextResponse } from "next/server";
import { clearAdminCookie, isAdmin, setAdminCookie, validAdminPassword } from "@/lib/auth";
import { bad } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ authenticated: await isAdmin() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return bad("Invalid body");
  const password = String((body as Record<string, unknown>).password ?? "");
  if (!validAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}
