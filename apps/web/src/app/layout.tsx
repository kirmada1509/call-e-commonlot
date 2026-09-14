import type { Metadata } from "next";

import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  description:
    "Assemble feasible shared purchases through clear, private buyer conversations.",
  title: {
    default: "CommonLot — Shared purchasing, made workable",
    template: "%s — CommonLot",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <a
            className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-transform focus:translate-y-0"
            href="#main-content"
          >
            Skip to content
          </a>
          <Header />
          <main className="min-h-svh pt-16" id="main-content">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
