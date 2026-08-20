"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  name: string;
  price: string;
  oldPrice?: string;
  image: string;
  badge?: string;
};

const emptyProduct: Product = {
  name: "",
  price: "",
  oldPrice: "",
  image: "",
  badge: "",
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<Product>(emptyProduct);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        setMessage("تعذر تحميل المنتجات");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return products;

    return products.filter((product) =>
      product.name.toLowerCase().includes(value)
    );
  }, [products, search]);

  function handleChange(
    field: keyof Product,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEdit(index: number) {
    const product = products[index];

    setForm({
      name: product.name || "",
      price: product.price || "",
      oldPrice: product.oldPrice || "",
      image: product.image || "",
      badge: product.badge || "",
    });

    setEditingIndex(index);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingIndex(null);
    setForm(emptyProduct);
    setMessage("");
  }

  function saveProduct() {
    if (!form.name.trim()) {
      setMessage("اكتب اسم المنتج أولًا");
      return;
    }

    if (!form.price.trim()) {
      setMessage("اكتب سعر المنتج");
      return;
    }

    if (editingIndex === null) {
      setProducts((current) => [...current, form]);
      setMessage("تمت إضافة المنتج إلى القائمة");
    } else {
      setProducts((current) =>
        current.map((product, index) =>
          index === editingIndex ? form : product
        )
      );

      setMessage("تم تعديل المنتج");
    }

    setForm(emptyProduct);
    setEditingIndex(null);
  }

  function deleteProduct(index: number) {
    const product = products[index];

    const confirmed = window.confirm(
      `هل تريد حذف "${product.name}"؟`
    );

    if (!confirmed) return;

    setProducts((current) =>
      current.filter((_, productIndex) => productIndex !== index)
    );

    setMessage("تم حذف المنتج من القائمة");
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-100 text-gray-900"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">
              لوحة تحكم متجر رافيك
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              إدارة المنتجات والأسعار والعروض
            </p>
          </div>

          <a
            href="/"
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold transition hover:bg-gray-50"
          >
            مشاهدة المتجر
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Statistics */}
        <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">المنتجات</p>
            <p className="mt-2 text-3xl font-bold">
              {products.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">العروض</p>
            <p className="mt-2 text-3xl font-bold">
              {products.filter((p) => p.oldPrice).length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">منتجات عليها شارة</p>
            <p className="mt-2 text-3xl font-bold">
              {products.filter((p) => p.badge).length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">الحالة</p>
            <p className="mt-2 font-bold text-green-600">
              لوحة التحكم
            </p>
          </div>
        </section>

        {/* Product form */}
        <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                {editingIndex === null
                  ? "إضافة منتج جديد"
                  : "تعديل المنتج"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                أدخل معلومات المنتج ثم احفظها.
              </p>
            </div>

            {editingIndex !== null && (
              <button
                onClick={cancelEdit}
                className="rounded-xl border px-4 py-2 text-sm"
              >
                إلغاء التعديل
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                اسم المنتج
              </label>

              <input
                value={form.name}
                onChange={(e) =>
                  handleChange("name", e.target.value)
                }
                placeholder="مثال: سماعات لاسلكية"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                السعر
              </label>

              <input
                value={form.price}
                onChange={(e) =>
                  handleChange("price", e.target.value)
                }
                placeholder="مثال: 899"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                السعر القديم
              </label>

              <input
                value={form.oldPrice}
                onChange={(e) =>
                  handleChange("oldPrice", e.target.value)
                }
                placeholder="مثال: 1199"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                الشارة
              </label>

              <input
                value={form.badge}
                onChange={(e) =>
                  handleChange("badge", e.target.value)
                }
                placeholder="مثال: عرض خاص"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                رابط
