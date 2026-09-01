"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, ShoppingBag, Loader2 } from "lucide-react";
import { useCartStore } from "@/store/cart";

// نفس regex الرقم المصري المستعمل فعليا فـ src/app/api/orders/route.ts —
// تحقق أولي هنا للـ UX فقط، التحقق النهائي الحقيقي يبقى فـ API.
const egyptianPhoneRegex = /^01[0125]\d{8}$/;

interface FormState {
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  street: string;
  building: string;
  notes: string;
}

const initialForm: FormState = {
  fullName: "",
  phone: "",
  governorate: "",
  city: "",
  street: "",
  building: "",
  notes: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const inputClass =
  "w-full rounded-lg border border-rafik-navy/20 px-4 py-2.5 text-sm text-rafik-ink focus:border-rafik-gold focus:outline-none";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal());
  const totalItems = useCartStore((state) => state.totalItems());
  const clearCart = useCartStore((state) => state.clearCart);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [form, setForm] = useState<FormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const SHIPPING_FEE_EGP = 0;
  const total = subtotal + SHIPPING_FEE_EGP;

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (form.fullName.trim().length < 2) {
      errors.fullName = "الاسم الكامل مطلوب";
    }
    if (!egyptianPhoneRegex.test(form.phone.trim())) {
      errors.phone = "رقم هاتف غير صحيح (مثال: 01012345678)";
    }
    if (form.governorate.trim().length < 2) {
      errors.governorate = "المحافظة مطلوبة";
    }
    if (form.city.trim().length < 1) {
      errors.city = "المدينة مطلوبة";
    }
    if (form.street.trim().length < 3) {
      errors.street = "العنوان بالتفصيل مطلوب";
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (isSubmitting) return;

    if (items.length === 0) {
      setApiError("السلة فارغة");
      return;
    }

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setApiError(null);
    setIsSubmitting(true);

    const payload = {
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      customer: {
        name: form.fullName.trim(),
        phone: form.phone.trim(),
      },
      shippingAddress: {
        governorate: form.governorate.trim(),
        city: form.city.trim(),
        street: form.street.trim(),
        ...(form.building.trim() ? { building: form.building.trim() } : {}),
      },
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    };

    let response: Response;
    try {
      response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      setApiError("تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت وحاول مرة أخرى");
      setIsSubmitting(false);
      return;
    }

    let data: { error?: string; orderNumber?: string; total?: number };
    try {
      data = await response.json();
    } catch {
      setApiError("حدث خطأ غير متوقع، حاول مرة أخرى");
      setIsSubmitting(false);
      return;
    }

    if (!response.ok) {
      setApiError(data.error ?? "حدث خطأ غير متوقع، حاول مرة أخرى");
      setIsSubmitting(false);
      return;
    }

    if (!data.orderNumber) {
      setApiError("حدث خطأ غير متوقع، حاول مرة أخرى");
      setIsSubmitting(false);
      return;
    }

    clearCart();
    router.push(
      `/order-confirmation?order=${encodeURIComponent(
        data.orderNumber
      )}&total=${encodeURIComponent(String(data.total ?? total))}`
    );
  }

  if (!mounted) {
    return (
      <div className="container-section">
        <div className="h-8 w-40 animate-pulse rounded bg-rafik-navy/10" />
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-rafik-navy/5" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-section flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rafik-gold/10">
          <ShoppingBag className="h-9 w-9 text-rafik-gold" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-rafik-navy">
          السلة فارغة
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-rafik-navy/60">
          لا يمكن إتمام الطلب بدون منتجات. تصفح المتجر وأضف ما يعجبك أولاً.
        </p>
        <Link href="/products" className="btn-accent mt-6 inline-block">
          العودة إلى المتجر
        </Link>
      </div>
    );
  }

  return (
    <div className="container-section">
      <h1 className="font-display text-2xl font-bold text-rafik-navy sm:text-3xl">
        إتمام الطلب
      </h1>

      {apiError && (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid gap-8 lg:grid-cols-3 lg:items-start"
        noValidate
      >
        <div className="space-y-4 rounded-2xl border border-rafik-gold/10 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-rafik-navy">
            بيانات التوصيل
          </h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-rafik-navy">
              الاسم الكامل
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              className={inputClass}
              aria-invalid={Boolean(fieldErrors.fullName)}
            />
            {fieldErrors.fullName && (
              <p className="mt-1 text-xs font-medium text-red-500">
                {fieldErrors.fullName}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-rafik-navy">
              رقم الهاتف
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="01012345678"
              className={inputClass}
              aria-invalid={Boolean(fieldErrors.phone)}
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs font-medium text-red-500">
                {fieldErrors.phone}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-rafik-navy">
                المحافظة
              </label>
              <input
                type="text"
                value={form.governorate}
                onChange={(e) => updateField("governorate", e.target.value)}
                className={inputClass}
                aria-invalid={Boolean(fieldErrors.governorate)}
              />
              {fieldErrors.governorate && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  {fieldErrors.governorate}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-rafik-navy">
                المدينة
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                className={inputClass}
                aria-invalid={Boolean(fieldErrors.city)}
              />
              {fieldErrors.city && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  {fieldErrors.city}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-rafik-navy">
              الشارع (العنوان بالتفصيل)
            </label>
            <input
              type="text"
              value={form.street}
              onChange={(e) => updateField("street", e.target.value)}
              className={inputClass}
              aria-invalid={Boolean(fieldErrors.street)}
            />
            {fieldErrors.street && (
              <p className="mt-1 text-xs font-medium text-red-500">
                {fieldErrors.street}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-rafik-navy">
              رقم المبنى{" "}
              <span className="font-normal text-rafik-navy/40">
                (اختياري)
              </span>
            </label>
            <input
              type="text"
              value={form.building}
              onChange={(e) => updateField("building", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-rafik-navy">
              ملاحظات{" "}
              <span className="font-normal text-rafik-navy/40">
                (اختياري)
              </span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="rounded-lg bg-rafik-cream/60 px-4 py-3 text-sm font-semibold text-rafik-navy">
            طريقة الدفع: الدفع عند الاستلام
          </div>
        </div>

        <div className="rounded-2xl border border-rafik-gold/10 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold text-rafik-navy">
            ملخص الطلب
          </h2>

          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-rafik-cream">
                  <Image
                    src={item.image ?? "/placeholder.png"}
                    alt={item.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-rafik-ink">
                    {item.name}
                  </p>
                  <p className="text-xs text-rafik-navy/50">
                    {item.quantity} × {item.price} ج.م
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-rafik-navy">
                  {item.price * item.quantity} ج.م
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-3 border-t border-rafik-navy/10 pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-rafik-navy/60">
                عدد المنتجات ({totalItems})
              </dt>
              <dd className="font-semibold text-rafik-navy">
                {subtotal} ج.م
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-rafik-navy/60">الشحن</dt>
              <dd className="font-semibold text-rafik-navy">
                {SHIPPING_FEE_EGP} ج.م
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-rafik-navy/10 pt-3">
              <dt className="font-bold text-rafik-navy">الإجمالي</dt>
              <dd className="price-tag">{total} ج.م</dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary mt-5 flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "جاري إرسال الطلب..." : "تأكيد الطلب"}
          </button>
        </div>
      </form>
    </div>
  );
}
