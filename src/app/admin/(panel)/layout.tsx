import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { isAdmin } from "@/lib/auth";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <AdminNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
