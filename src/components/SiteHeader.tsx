"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";

const links = [
  { href: "/", label: "Menu" },
  { href: "/orders", label: "My orders" },
  { href: "/support", label: "Support" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const { count } = useCart();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#e7d5c3] bg-[#fff8ef]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-[#b53a2b] text-sm text-white">B</span>
          <span className="text-base sm:text-lg">Bhakshannashala</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Main navigation">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-2 transition ${
                  active ? "bg-[#b53a2b] text-white" : "hover:bg-[#f1ddca]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/cart"
            className="relative rounded-full border border-[#d9bca0] px-3 py-2 hover:bg-[#f1ddca]"
            aria-label={`Cart with ${count} items`}
          >
            Cart
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#b53a2b] text-[11px] text-white">
                {count}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}
