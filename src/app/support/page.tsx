export const metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Support</h1>
      <div className="mt-6 space-y-4 rounded-2xl border border-[#e7d5c3] bg-white p-8">
        <section>
          <h2 className="font-semibold">Order help</h2>
          <p className="mt-2 text-sm text-[#6f5a4f]">
            Orders placed from a browser are listed under My orders on that same browser. If something looks wrong, share your order ID with the kitchen team.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Payments</h2>
          <p className="mt-2 text-sm text-[#6f5a4f]">
            Payments are manual. Your order stays pending until our team confirms it and marks payment as paid.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Stock and availability</h2>
          <p className="mt-2 text-sm text-[#6f5a4f]">
            Items marked sold out cannot be added to the cart. Availability is refreshed from our kitchen sheet.
          </p>
        </section>
      </div>
    </div>
  );
}
