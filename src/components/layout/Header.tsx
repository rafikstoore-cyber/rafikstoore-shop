"use client";

import Link from "next/link";
import { ShoppingBag, Heart, User, Search } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useEffect, useState } from "react";

export default function Header() {
  const totalItems = useCartStore((s) => s.totalItems());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 border-b border-rafik-navy/10 bg-rafik-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-black tracking-tight text-rafik-navy">
            رفيق <span className="text-rafik-gold">ستور</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 font-semibold text-rafik-navy md:flex">
          <Link href="/products" className="hover:text-rafik-gold">
            المنتجات
          </Link>
          <Link href="/products?featured=true" className="hover:text-rafik-gold">
            الأكثر مبيعاً
          </Link>
          <Link href="/account/orders" className="hover:text-rafik-gold">
            طلباتي
          </Link>
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <button aria-label="بحث" className="rounded-full p-2 hover:bg-rafik-navy/5">
            <Search className="h-5 w-5 text-rafik-navy" />
          </button>
          <Link
            href="/account/wishlist"
            aria-label="المفضلة"
            className="rounded-full p-2 hover:bg-rafik-navy/5"
          >
            <Heart className="h-5 w-5 text-rafik-navy" />
          </Link>
          <Link
            href="/cart"
            aria-label="السلة"
            className="relative rounded-full p-2 hover:bg-rafik-navy/5"
          >
            <ShoppingBag className="h-5 w-5 text-rafik-navy" />
            {mounted && totalItems > 0 && (
              <span className="absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rafik-gold text-[11px] font-bold text-rafik-navy">
                {totalItems}
              </span>
            )}
          </Link>
          <Link
            href="/account"
            aria-label="حسابي"
            className="rounded-full p-2 hover:bg-rafik-navy/5"
          >
            <User className="h-5 w-5 text-rafik-navy" />
          </Link>
        </div>
      </div>
    </header>
  );
}
