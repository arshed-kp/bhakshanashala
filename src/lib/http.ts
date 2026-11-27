import { NextResponse } from "next/server";

export function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Request failed";
}

export function fail(cause: unknown): NextResponse {
  return NextResponse.json({ error: errorMessage(cause) }, { status: 502 });
}

export function bad(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function positiveInt(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
}

export function nonNegativeInt(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : null;
}
