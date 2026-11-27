import { MenuGrid } from "@/components/MenuGrid";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-10 grid gap-6 rounded-3xl border border-[#e7d5c3] bg-white p-8 sm:p-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-[#b53a2b]">Fresh from our kitchen</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
            Good food, simply made.
          </h1>
          <p className="mt-4 max-w-xl text-[#6f5a4f]">
            Pick what you like and place your order in a few taps. Payment and delivery are confirmed manually by our team.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#menu" className="rounded-full bg-[#b53a2b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8f2f23]">
              Browse the menu
            </a>
            <a href="/support" className="rounded-full border border-[#d9bca0] px-5 py-3 text-sm font-semibold hover:bg-[#f1ddca]">
              Need help?
            </a>
          </div>
        </div>
        <div className="rounded-2xl bg-[#f6e7d4] p-6">
          <p className="font-semibold">How it works</p>
          <ol className="mt-3 space-y-2 text-sm text-[#6f5a4f]">
            <li>1. Add items to your cart.</li>
            <li>2. Confirm and place your order.</li>
            <li>3. Track it from My orders in this browser.</li>
            <li>4. Pay when we confirm your delivery.</li>
          </ol>
        </div>
      </section>

      <section id="menu">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Today&apos;s menu</h2>
            <p className="text-sm text-[#6f5a4f]">Available items are updated as stock changes.</p>
          </div>
        </div>
        <MenuGrid />
      </section>
    </div>
  );
}
