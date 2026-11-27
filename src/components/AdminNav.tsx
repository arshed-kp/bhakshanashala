"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/items", label: "Items" },
];

export function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <nav aria-label="Admin navigation" className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7d5c3] pb-4">
      <div className="flex flex-wrap gap-1">
        {links.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-2 text-sm ${
                active
                  ? "bg-transparent font-semibold text-[#b53a2b] underline decoration-2 underline-offset-4"
                  : "hover:bg-[#f1ddca]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      <button type="button" onClick={logout} className="text-sm text-[#b53a2b] underline">
        Log out
      </button>
    </nav>
  );
}
