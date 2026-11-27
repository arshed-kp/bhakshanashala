import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#e7d5c3] bg-[#fffaf3]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-[#6f5a4f] sm:flex-row sm:items-center sm:justify-between">
        <p>Bhakshannashala — simple, honest food.</p>
        <div className="flex gap-4">
          <Link href="/orders" className="hover:text-[#b53a2b]">My orders</Link>
          <Link href="/support" className="hover:text-[#b53a2b]">Support</Link>
          <Link href="/admin" className="hover:text-[#b53a2b]">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
