"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useCartStore } from "@/store/cart";

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);

  const orderNumber = searchParams.get("order");
  const total = searchParams.get("total");

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f8f5ef] px-4 py-12"
    >
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-10 w-10 text-green-600"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 12 4 4L19 6"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            تم استلام طلبك بنجاح 🎉
          </h1>

          <p className="mt-4 text-gray-600">
            شكرًا لثقتك في RAFIK STOORE.
            <br />
            سنتواصل معك لتأكيد الطلب وتجهيز الشحن.
          </p>

          {orderNumber && (
            <div className="mt-8 rounded-2xl bg-[#f8f5ef] p-5">
              <p className="text-sm text-gray-500">
                رقم الطلب
              </p>

              <p className="mt-2 text-xl font-bold tracking-wide text-gray-900">
                {orderNumber}
              </p>
            </div>
          )}

          {total && (
            <div className="mt-4 flex items-center justify-center gap-2 text-lg">
              <span className="text-gray-600">
                إجمالي الطلب:
              </span>

              <span className="font-bold text-gray-900">
                {Number(total).toLocaleString("ar-EG")} جنيه
              </span>
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-right">
            <h2 className="font-bold text-gray-900">
              ماذا يحدث الآن؟
            </h2>

            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>✓ تم تسجيل طلبك.</li>
              <li>✓ الدفع عند الاستلام.</li>
              <li>✓ سيتم التواصل معك لتأكيد البيانات.</li>
              <li>✓ بعد التأكيد سيتم تجهيز الطلب للشحن.</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-xl bg-[#0b1f3a] px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              العودة إلى الرئيسية
            </Link>

            <Link
              href="/shop"
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              مواصلة التسوق
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
