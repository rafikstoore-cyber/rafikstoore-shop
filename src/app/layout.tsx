import type { Metadata } from "next";
import { Cairo, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "RAFIK STORE - متجر إلكتروني",
  description: "أفضل المنتجات بأفضل الأسعار - متجر RAFIK STORE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} ${playfair.variable} font-body flex flex-col min-h-screen`}>
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
