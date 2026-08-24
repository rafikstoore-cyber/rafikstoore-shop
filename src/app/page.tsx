import Link from "next/link";
import { Search, Heart, ChevronLeft, ArrowLeft, Truck, ShieldCheck, RotateCcw, Star, Zap, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/types/database";

const categories = [
  { name: "العناية بالبشرة", icon: "✨" },
  { name: "المكياج", icon: "💄" },
  { name: "العناية بالشعر", icon: "💇‍♀️" },
  { name: "العطور", icon: "🌸" },
  { name: "أدوات التجميل", icon: "🧴" },
  { name: "عروض اليوم", icon: "🔥" },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .limit(8)
    .returns<Product[]>();

  return (
    <main dir="rtl" className="min-h-screen bg-rafik-cream text-rafik-ink">
      <div className="bg-rafik-navy px-4 py-2.5 text-center text-xs font-medium text-white sm:text-sm">
        🚚 شحن سريع داخل مصر • الدفع عند الاستلام
      </div>

      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-2 lg:py-24">
          <div className="relative z-10 text-center lg:text-right">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-rafik-gold/30 bg-rafik-gold/10 px-4 py-2 text-xs font-bold text-rafik-navy">
              <Sparkles size={15} />
              عناية فاخرة • جودة تستحق الثقة
            </div>

            <h1 className="text-4xl font-display font-black leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl text-rafik-navy">
              جمالك يستحق
              <span className="block text-rafik-gold">أفضل عناية.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-rafik-navy/70 sm:text-lg lg:mx-0">
              منتجات عناية وجمال مختارة بعناية، بجودة موثوقة والدفع عند الاستلام.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <a href="#products" className="btn-accent inline-flex items-center justify-center gap-2">
                اكتشف المنتجات
                <ArrowLeft size={18} />
              </a>
              <a href="#categories" className="btn-outline inline-flex items-center justify-center gap-2">
                تصفح الأقسام
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-rafik-gold/20 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-rafik-navy/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] bg-white p-3 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=85"
                alt="منتجات RAFIK STOORE"
                className="h-[360px] w-full rounded-[1.5rem] object-cover sm:h-[440px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-rafik-navy/10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-rafik-navy/10 px-4 py-6 sm:grid-cols-4">
          <div className="flex items-center justify-center gap-3 px-3 py-3 text-center sm:text-right">
            <Truck className="hidden text-rafik-gold sm:block" size={24} />
            <div>
              <p className="text-sm font-bold text-rafik-navy">شحن سريع</p>
              <p className="mt-1 text-[11px] text-rafik-navy/60">داخل مصر</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 border-t border-rafik-navy/10 px-3 py-3 text-center sm:border-t-0 sm:text-right">
            <ShieldCheck className="hidden text-rafik-gold sm:block" size={24} />
            <div>
              <p className="text-sm font-bold text-rafik-navy">جودة موثوقة</p>
              <p className="mt-1 text-[11px] text-rafik-navy/60">منتجات مختارة</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 border-rafik-navy/10 px-3 py-3 text-center sm:border-r sm:text-right">
            <RotateCcw className="hidden text-rafik-gold sm:block" size={24} />
            <div>
              <p className="text-sm font-bold text-rafik-navy">دفع عند الاستلام</p>
              <p className="mt-1 text-[11px] text-rafik-navy/60">بدون مخاطرة</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 border-t border-rafik-navy/10 px-3 py-3 text-center sm:border-t-0 sm:text-right">
            <Star className="hidden text-rafik-gold sm:block" size={24} />
            <div>
              <p className="text-sm font-bold text-rafik-navy">تقييمات موثقة</p>
              <p className="mt-1 text-[11px] text-rafik-navy/60">من عملاء حقيقيين</p>
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold text-rafik-gold">اكتشف أكثر</p>
            <h2 className="text-2xl font-display font-black text-rafik-navy sm:text-3xl">تسوق حسب القسم</h2>
          </div>
          <a href="#products" className="hidden items-center gap-1 text-sm font-bold text-rafik-navy/60 hover:text-rafik-gold sm:flex">
            عرض الكل
            <ChevronLeft size={17} />
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <a
              key={category.name}
              href="#products"
              className="group rounded-2xl border border-rafik-navy/10 bg-white p-5 text-center transition duration-300 hover:-translate-y-1 hover:border-rafik-gold/40 hover:shadow-gold"
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rafik-cream text-2xl transition group-hover:bg-rafik-gold/10">
                {category.icon}
              </div>
              <p className="text-sm font-bold text-rafik-navy">{category.name}</p>
            </a>
          ))}
        </div>
      </section>

      <section id="products" className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold text-rafik-gold">مختارات RAFIK STOORE</p>
              <h2 className="text-2xl font-display font-black text-rafik-navy sm:text-3xl">منتجات تستحق نظرتك</h2>
            </div>
          </div>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-rafik-navy/50 py-10">لا توجد منتجات متاحة حالياً</p>
          )}
        </div>
      </section>

      <section id="offers" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-rafik-navy px-6 py-12 text-white sm:px-12 lg:px-16">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-rafik-gold/20 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-rafik-gold/10 blur-3xl" />

          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold">
                <Zap size={15} className="text-rafik-gold" />
                عروض مختارة
              </div>
              <h2 className="max-w-2xl text-3xl font-display font-black leading-tight sm:text-4xl">
                لا تبحث فـ كل مكان.
                <span className="block text-rafik-gold">ابدأ من هنا.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
                اختيارات عناية وجمال موثوقة، بتوصيل سريع والدفع عند الاستلام.
              </p>
            </div>

            <a href="#products" className="shrink-0 rounded-xl bg-rafik-gold px-6 py-3.5 text-sm font-black text-rafik-navy transition hover:bg-rafik-goldLight">
              استكشف الاختيارات
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
