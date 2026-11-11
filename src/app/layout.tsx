import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KASA — Modular White-Label POS & Cashflow OS UMKM",
  description: "Sistem kasir cerdas dan pembukuan arus kas tanpa jargon untuk UMKM Indonesia",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-amber-100 selection:text-amber-900">
        {children}
      </body>
    </html>
  );
}
