import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import { CartProvider } from "@/components/CartProvider";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Bhakshannashala",
    template: "%s | Bhakshannashala",
  },
  description: "Simple, honest food delivered to your door.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Suspense fallback={<div className="h-15 border-b border-[#e7d5c3]" />}>
              <SiteHeader />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
