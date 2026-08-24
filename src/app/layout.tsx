import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Header from "@/components/layout/Header";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RAFIK STOORE | منتجات العناية والجمال",
  description:
    "متجر رفيق ستور — منتجات العناية بالبشرة والجمال، الدفع عند الاستلام.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${playfair.variable} ${inter.variable} font-body`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        {/* Footer غادي يتزاد ملي نديروه */}
      </body>
    </html>
  );
}
