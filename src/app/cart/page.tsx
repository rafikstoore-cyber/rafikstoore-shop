"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cart";

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    totalItems,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#f8f6f1] px-4 py-10"
      >
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse rounded-2xl bg-white p-8 shadow-sm">
            جاري تحميل السلة...
          </div>
        </div>
      </main>
    );
  }

  const cartTotal = subtotal();
  const itemCount = totalItems();

  if (items.length === 0) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#f8f6f1] px-4 py-10"
      >
        <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center">
          <div className="w-full rounded-3xl bg-white p-8 text-center shadow-sm md:p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f3eee3] text-4xl">
              🛒
            </div>

            <h1 className="mb-3 text-2xl font-bold text-[#14213d] md:text-3xl">
              سلتك فارغة
            </h1>

            <p className="mb-8 text-gray-500">
              لم تضف أي منتج إلى السلة بعد.
            </p>

            <Link
              href="/"
              className="inline-flex rounded-xl bg-[#c9a34e] px-7 py-3 font-bold text-white transition hover:opacity-90"
            >
              اكتشف المنتجات
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f8f6f1] px-4 py-8 md:px-6 md:py-12"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex text-sm font-medium text-gray-500 hover:text-[#c9a34e]"
          >
            ← مواصلة التسوق
          </Link>

          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#14213d] md:text-4xl">
                سلة التسوق
              </h1>

              <p className="mt-2 text-gray-500">
                {itemCount} {itemCount === 1 ? "منتج" : "منتجات"} في السلة
              </p>
            </div>

            <button
              type="button"
              onClick={clearCart}
              className="text-sm font-medium text-red-500 hover:text-red-700"
            >
              إفراغ السلة
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Products */}
          <section className="space-y-4">
            {items.map((item) => {
              const maxStock =
                typeof item.stock === "number" && item.stock > 0
                  ? item.stock
                  : 99;

              return (
                <article
                  key={item.productId}
                  className="rounded-2xl bg-white p-4 shadow-sm md:p-5"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#f3eee3] md:h-32 md:w-32">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl">
                          🧴
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="line-clamp-2 text-base font-bold text-[#14213d] md:text-lg">
                            {item.name}
                          </h2>

                          <p className="mt-2 font-bold text-[#c9a34e]">
                            {item.price.toLocaleString("en-EG")} جنيه
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          aria-label={`حذف ${item.name}`}
                          className="text-xl text-gray-400 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>

                      {/* Quantity */}
                      <div className="mt-5 flex items-center justify-between">
                        <div className="flex items-center overflow-hidden rounded-xl border border-gray-200">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            disabled={item.quantity <= 1}
                            className="flex h-10 w-10 items-center justify-center text-lg font-bold hover:bg-gray-50 disabled:opacity-30"
                          >
                            −
                          </button>

                          <span className="flex h-10 min-w-10 items-center justify-center border-x border-gray-200 font-bold">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                Math.min(maxStock, item.quantity + 1)
                              )
                            }
                            disabled={item.quantity >= maxStock}
                            className="flex h-10 w-10 items-center justify-center text-lg font-bold hover:bg-gray-50 disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>

                        <p className="font-bold text-[#14213d]">
                          {(item.price * item.quantity).toLocaleString(
                            "en-EG"
                          )}{" "}
                          جنيه
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Summary */}
          <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="mb-6 text-xl font-bold text-[#14213d]">
              ملخص الطلب
            </h2>

            <div className="space-y-4 border-b border-gray-100 pb-5">
              <div className="flex justify-between text-gray-600">
                <span>عدد المنتجات</span>
                <span className="font-medium">{itemCount}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>المجموع الفرعي</span>
                <span className="font-medium">
                  {cartTotal.toLocaleString("en-EG")} جنيه
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>الشحن</span>
                <span className="font-medium">يُحسب عند الطلب</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-5">
              <span className="text-lg font-bold text-[#14213d]">
                الإجمالي
              </span>

              <span className="text-2xl font-bold text-[#c9a34e]">
                {cartTotal.toLocaleString("en-EG")} جنيه
              </span>
            </div>

            <Link
              href="/checkout"
              className="flex w-full items-center justify-center rounded-xl bg-[#14213d] px-5 py-4 text-center font-bold text-white transition hover:bg-[#1d3157]"
            >
              إتمام الطلب
            </Link>

            <p className="mt-4 text-center text-xs leading-5 text-gray-400">
              سيتم إدخال معلومات التوصيل والدفع في الخطوة التالية.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
