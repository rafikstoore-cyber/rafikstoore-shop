import {
  Search,
  ShoppingBag,
  Heart,
  User,
  ChevronLeft,
  ArrowLeft,
  Truck,
  ShieldCheck,
  RotateCcw,
  Star,
  Menu,
  Zap,
  Sparkles,
} from "lucide-react";

const categories = [
  { name: "إلكترونيات", icon: "📱" },
  { name: "المنزل والمطبخ", icon: "🏠" },
  { name: "الجمال والعناية", icon: "✨" },
  { name: "الموضة", icon: "👕" },
  { name: "إكسسوارات", icon: "⌚" },
  { name: "عروض اليوم", icon: "🔥" },
];


export default function Home() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#fafafa] text-[#111827]"
    >
      {/* Top announcement */}
      <div className="bg-[#111827] px-4 py-2.5 text-center text-xs font-medium text-white sm:text-sm">
        🚚 شحن سريع داخل مصر • اكتشف أفضل المنتجات المختارة لك
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Logo */}
            <a href="#" className="shrink-0">
              <div className="text-xl font-black tracking-tight sm:text-2xl">
                RAFIK<span className="text-[#f97316]">.</span>
              </div>
              <div className="-mt-1 text-[9px] font-semibold tracking-[0.25em] text-gray-500">
                STORE
              </div>
            </a>

            {/* Desktop navigation */}
            <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex">
              <a href="#" className="text-[#f97316]">
                الرئيسية
              </a>
              <a href="#categories" className="transition hover:text-[#f97316]">
                الأقسام
              </a>
              <a href="#products" className="transition hover:text-[#f97316]">
                المنتجات
              </a>
              <a href="#offers" className="transition hover:text-[#f97316]">
                العروض
              </a>
            </nav>

            {/* Search */}
            <div className="hidden max-w-sm flex-1 md:flex">
              <div className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                <Search size={18} className="text-gray-400" />
                <input
                  type="search"
                  placeholder="ابحث عن منتج..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                aria-label="البحث"
                className="rounded-xl p-2.5 transition hover:bg-gray-100 md:hidden"
              >
                <Search size={20} />
              </button>

              <button
                aria-label="المفضلة"
                className="hidden rounded-xl p-2.5 transition hover:bg-gray-100 sm:block"
              >
                <Heart size={20} />
              </button>

              <button
                aria-label="الحساب"
                className="hidden rounded-xl p-2.5 transition hover:bg-gray-100 sm:block"
              >
                <User size={20} />
              </button>

              <button
                aria-label="السلة"
                className="relative rounded-xl p-2.5 transition hover:bg-gray-100"
              >
                <ShoppingBag size={21} />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#f97316] text-[9px] font-bold text-white">
                  0
                </span>
              </button>

              <button
                aria-label="القائمة"
                className="rounded-xl p-2.5 transition hover:bg-gray-100 lg:hidden"
              >
                <Menu size={21} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#f3f4f6]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-2 lg:py-24">
          <div className="relative z-10 text-center lg:text-right">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700">
              <Sparkles size={15} />
              اختيارات ذكية • أسعار تستحق التجربة
            </div>

            <h1 className="text-4xl font-black leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
              اكتشف ما يستحق
              <span className="block text-[#f97316]">أن يكون لديك.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-gray-600 sm:text-lg lg:mx-0">
              منتجات مختارة بعناية لتجعل التسوق أسهل. اكتشف الجديد، قارن،
              واختر ما يناسبك بثقة.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <a
                href="#products"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f97316] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-600"
              >
                اكتشف المنتجات
                <ArrowLeft size={18} />
              </a>

              <a
                href="#categories"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-7 py-3.5 text-sm font-bold transition hover:bg-gray-50"
              >
                تصفح الأقسام
              </a>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-medium text-gray-500 lg:justify-start">
              <span>✓ اختيار منتجات بعناية</span>
              <span>✓ أسعار واضحة</span>
              <span>✓ تجربة سهلة</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-200/50 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-gray-300/60 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] bg-white p-3 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85"
                alt="منتجات مختارة من RAFIK STORE"
                className="h-[360px] w-full rounded-[1.5rem] object-cover sm:h-[440px]"
              />

              <div className="absolute bottom-7 right-7 left-7 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      اختيارات هذا الأسبوع
                    </p>
                    <p className="mt-1 font-black">منتجات تستحق الاكتشاف</p>
                  </div>
                  <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
                    <Zap size={21} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-100 px-4 py-6 sm:grid-cols-4">
          <div className="flex items-center justify-center gap-3 px-3 py-3 text-center sm:text-right">
            <Truck className="hidden text-[#f97316] sm:block" size={24} />
            <div>
              <p className="text-sm font-bold">شحن سريع</p>
              <p className="mt-1 text-[11px] text-gray-500">داخل مصر</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 border-t border-gray-100 px-3 py-3 text-center sm:border-t-0 sm:text-right">
            <ShieldCheck className="hidden text-[#f97316] sm:block" size={24} />
            <div>
              <p className="text-sm font-bold">اختيارات موثوقة</p>
              <p className="mt-1 text-[11px] text-gray-500">منتجات مختارة</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 border-gray-100 px-3 py-3 text-center sm:border-r sm:text-right">
            <RotateCcw className="hidden text-[#f97316] sm:block" size={24} />
            <div>
              <p className="text-sm font-bold">تجربة سهلة</p>
              <p className="mt-1 text-[11px] text-gray-500">من التصفح للشراء</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 border-t border-gray-100 px-3 py-3 text-center sm:border-t-0 sm:text-right">
            <Star className="hidden text-[#f97316] sm:block" size={24} />
            <div>
              <p className="text-sm font-bold">منتجات مميزة</p>
              <p className="mt-1 text-[11px] text-gray-500">اختيارات تتجدد</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold text-[#f97316]">اكتشف أكثر</p>
            <h2 className="text-2xl font-black sm:text-3xl">تسوق حسب القسم</h2>
          </div>
          <a
            href="#products"
            className="hidden items-center gap-1 text-sm font-bold text-gray-500 transition hover:text-[#f97316] sm:flex"
          >
            عرض الكل
            <ChevronLeft size={17} />
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <a
              key={category.name}
              href="#products"
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-center transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100"
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-2xl transition group-hover:bg-orange-50">
                {category.icon}
              </div>
              <p className="text-sm font-bold">{category.name}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold text-[#f97316]">
                مختارات RAFIK
              </p>
              <h2 className="text-2xl font-black sm:text-3xl">
                منتجات تستحق نظرتك
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                ابدأ بالأكثر جذبًا ثم اختر ما يناسبك.
              </p>
            </div>

            <a
              href="#"
              className="hidden items-center gap-1 text-sm font-bold text-gray-500 hover:text-[#f97316] sm:flex"
            >
              كل المنتجات
              <ChevronLeft size={17} />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {products.map((product) => (
              <article
                key={product.name}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-100"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold shadow-sm">
                    {product.tag}
                  </span>

                  <button
                    aria-label="إضافة للمفضلة"
                    className="absolute left-3 top-3 rounded-full bg-white/95 p-2 shadow-sm transition hover:bg-white"
                  >
                    <Heart size={16} />
                  </button>
                </div>

                <div className="p-3.5 sm:p-4">
                  <h3 className="line-clamp-1 text-sm font-bold sm:text-base">
                    {product.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <Star size={13} className="fill-orange-400 text-orange-400" />
                    <span>منتج مميز</span>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div>
                      <div className="text-base font-black sm:text-lg">
                        {product.price} ج.م
                      </div>
                      <div className="text-[11px] text-gray-400 line-through">
                        {product.oldPrice} ج.م
                      </div>
                    </div>

                    <button className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-[#f97316]">
                      شاهد المنتج
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Offer */}
      <section id="offers" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#111827] px-6 py-12 text-white sm:px-12 lg:px-16">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />

          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold">
                <Zap size={15} className="text-orange-400" />
                عروض مختارة
              </div>

              <h2 className="max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                لا تبحث في كل مكان.
                <span className="block text-orange-400">
                  ابدأ من هنا.
                </span>
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-gray-300 sm:text-base">
                نساعدك على اكتشاف المنتجات التي تستحق وقتك بدلًا من إغراقك
                بآلاف الخيارات.
              </p>
            </div>

            <a
              href="#products"
              className="shrink-0 rounded-xl bg-white px-6 py-3.5 text-sm font-black text-gray-900 transition hover:bg-orange-50"
            >
              استكشف الاختيارات
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="text-xl font-black">
                RAFIK<span className="text-[#f97316]">.</span> STORE
              </div>
              <p className="mt-2 text-xs text-gray-500">
                اكتشاف أسهل. اختيارات أذكى.
              </p>
            </div>

            <div className="flex flex-wrap gap-5 text-xs font-medium text-gray-500">
              <a href="#" className="hover:text-gray-900">
                من نحن
              </a>
              <a href="#" className="hover:text-gray-900">
                تواصل معنا
              </a>
              <a href="#" className="hover:text-gray-900">
                الخصوصية
              </a>
              <a href="#" className="hover:text-gray-900">
                الشروط
              </a>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6 text-center text-[11px] text-gray-400">
            © 2026 RAFIK STORE — جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </main>
  );
}
