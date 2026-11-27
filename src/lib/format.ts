export function rupees(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function statusLabel(value: string): string {
  return value ? value.trim().toUpperCase() : "PENDING";
}

export function statusTone(value: string): string {
  const status = statusLabel(value);
  if (status === "APPROVED" || status === "PAID") return "bg-emerald-100 text-emerald-900";
  if (status === "CANCELLED") return "bg-rose-100 text-rose-900";
  return "bg-amber-100 text-amber-900";
}
