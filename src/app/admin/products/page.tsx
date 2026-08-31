"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Box,
  ShoppingBag,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name_ar: string;
  name_en?: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  images: string[] | null;
  category_id?: string | null;
  slug?: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    name_ar: string;
  } | null;
}

interface Category {
  id: string;
  name_ar: string;
}

interface KPIData {
  total: number;
  active: number;
  inactive: number;
  lowStock: number;
  outOfStock: number;
}

const supabase = createClient();

function ProductImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="w-14 h-14 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
        <Box className="w-6 h-6 text-[#C9A24B]" />
      </div>
    );
  }

  return (
    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#F5F0E8]">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="56px"
        className="object-cover"
      />
    </div>
  );
}

function StatusBadge({
  active,
  stock,
}: {
  active: boolean;
  stock: number;
}) {
  if (!active) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">
        <XCircle className="w-3 h-3" />
        غير نشط
      </span>
    );
  }

  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs">
        <XCircle className="w-3 h-3" />
        نفد المخزون
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs">
        <AlertTriangle className="w-3 h-3" />
        مخزون منخفض
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs">
      <CheckCircle2 className="w-3 h-3" />
      نشط
    </span>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [kpi, setKpi] = useState<KPIData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("=== ADMIN PRODUCTS DEBUG START ===");

      // ------------------------------------------------
      // 1. AUTH CHECK
      // ------------------------------------------------

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("AUTH USER:", user);
      console.log("AUTH ERROR:", authError);

      if (authError) {
        throw new Error(
          `AUTH ERROR: ${authError.message}`
        );
      }

      if (!user) {
        throw new Error(
          "AUTH ERROR: لا توجد جلسة مستخدم في المتصفح."
        );
      }

      // ------------------------------------------------
      // 2. CATEGORIES
      // ------------------------------------------------

      console.log("STEP 1: loading categories...");

      const {
        data: categoriesData,
        error: categoriesError,
      } = await supabase
        .from("categories")
        .select("id, name_ar")
        .order("name_ar", { ascending: true });

      console.log("CATEGORIES DATA:", categoriesData);
      console.log("CATEGORIES ERROR:", categoriesError);

      if (categoriesError) {
        throw new Error(
          `CATEGORIES ERROR: ${categoriesError.message} | code=${categoriesError.code}`
        );
      }

      setCategories(categoriesData || []);

      // ------------------------------------------------
      // 3. PRODUCTS
      // ------------------------------------------------

      console.log("STEP 2: loading products...");

      const {
        data: productsData,
        error: productsError,
      } = await supabase
        .from("products")
        .select(`
          id,
          name_ar,
          name_en,
          price,
          stock,
          is_active,
          images,
          category_id,
          slug,
          created_at,
          updated_at,
          category:categories (
            name_ar
          )
        `)
        .order("updated_at", { ascending: false });

      console.log("PRODUCTS DATA:", productsData);
      console.log("PRODUCTS ERROR:", productsError);

      if (productsError) {
        throw new Error(
          `PRODUCTS ERROR: ${productsError.message} | code=${productsError.code} | details=${productsError.details || ""} | hint=${productsError.hint || ""}`
        );
      }

      const normalizedProducts: Product[] =
        (productsData || []).map((product: any) => ({
          ...product,
          category: product.category || null,
        }));

      setProducts(normalizedProducts);

      // ------------------------------------------------
      // 4. KPI
      // ------------------------------------------------

      console.log("STEP 3: loading KPI...");

      const {
        data: allProducts,
        error: kpiError,
      } = await supabase
        .from("products")
        .select("stock, is_active");

      console.log("KPI DATA:", allProducts);
      console.log("KPI ERROR:", kpiError);

      if (kpiError) {
        throw new Error(
          `KPI ERROR: ${kpiError.message} | code=${kpiError.code}`
        );
      }

      const rows = allProducts || [];

      setKpi({
        total: rows.length,
        active: rows.filter((p) => p.is_active).length,
        inactive: rows.filter((p) => !p.is_active).length,
        lowStock: rows.filter(
          (p) => p.is_active && p.stock > 0 && p.stock <= 5
        ).length,
        outOfStock: rows.filter(
          (p) => p.is_active && p.stock === 0
        ).length,
      });

      console.log("=== ADMIN PRODUCTS DEBUG SUCCESS ===");
    } catch (err: any) {
      console.error("=== ADMIN PRODUCTS DEBUG FAILED ===");
      console.error(err);

      setError(
        err?.message ||
          "حدث خطأ غير معروف أثناء تحميل المنتجات."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.trim().toLowerCase();

      result = result.filter((product) => {
        return (
          product.name_ar?.toLowerCase().includes(q) ||
          product.name_en?.toLowerCase().includes(q)
        );
      });
    }

    if (category !== "all") {
      result = result.filter(
        (product) => product.category_id === category
      );
    }

    if (status === "active") {
      result = result.filter((product) => product.is_active);
    }

    if (status === "inactive") {
      result = result.filter((product) => !product.is_active);
    }

    if (status === "low_stock") {
      result = result.filter(
        (product) =>
          product.is_active &&
          product.stock > 0 &&
          product.stock <= 5
      );
    }

    if (status === "out_of_stock") {
      result = result.filter(
        (product) =>
          product.is_active &&
          product.stock === 0
      );
    }

    return result;
  }, [products, search, category, status]);

  async function toggleStatus(product: Product) {
    setToggling(product.id);

    try {
      const { error } = await supabase
        .from("products")
        .update({
          is_active: !product.is_active,
        })
        .eq("id", product.id);

      if (error) {
        throw error;
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                is_active: !product.is_active,
              }
            : item
        )
      );
    } catch (err: any) {
      alert(
        `فشل تغيير حالة المنتج:\n${err.message}`
      );
    } finally {
      setToggling(null);
    }
  }

  async function deleteProduct() {
    if (!deleteId) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", deleteId);

      if (error) {
        throw error;
      }

      setProducts((current) =>
        current.filter((product) => product.id !== deleteId)
      );

      setDeleteId(null);

      await loadProducts();
    } catch (err: any) {
      alert(
        `فشل حذف المنتج:\n${err.message}`
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#FAFAF8] flex items-center justify-center"
      >
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#C9A24B] animate-spin mx-auto mb-4" />

          <h2 className="text-lg font-bold text-[#0B1E3D]">
            جاري تحميل المنتجات...
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            يتم الاتصال بقاعدة البيانات
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4"
      >
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 max-w-xl w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          <h1 className="text-xl font-bold text-[#0B1E3D]">
            فشل الاتصال بالبيانات
          </h1>

          <p className="text-gray-500 mt-2">
            الخطأ الحقيقي من Supabase:
          </p>

          <div
            dir="ltr"
            className="mt-5 p-4 rounded-xl bg-red-50 border border-red-100 text-left text-sm text-red-700 whitespace-pre-wrap break-words"
          >
            {error}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={loadProducts}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0B1E3D] text-white font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </button>

            <Link
              href="/admin"
              className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl border border-[#0B1E3D]/10 text-[#0B1E3D] font-medium"
            >
              لوحة التحكم
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#FAFAF8]"
    >
      <header className="bg-white border-b border-[#0B1E3D]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1E3D]">
                إدارة المنتجات
              </h1>

              <p className="text-gray-500 mt-1 text-sm">
                إدارة المنتجات والمخزون والأسعار
              </p>
            </div>

            <Link
              href="/admin/products/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#C9A24B] text-[#0B1E3D] font-bold"
            >
              <Plus className="w-5 h-5" />
              إضافة منتج
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl p-5 border border-[#0B1E3D]/5">
            <p className="text-2xl font-bold text-[#0B1E3D]">
              {kpi?.total ?? 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              إجمالي المنتجات
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#0B1E3D]/5">
            <p className="text-2xl font-bold text-green-600">
              {kpi?.active ?? 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              المنتجات النشطة
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#0B1E3D]/5">
            <p className="text-2xl font-bold text-gray-500">
              {kpi?.inactive ?? 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              غير النشطة
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#0B1E3D]/5">
            <p className="text-2xl font-bold text-orange-600">
              {kpi?.lowStock ?? 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              مخزون منخفض
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#0B1E3D]/5">
            <p className="text-2xl font-bold text-red-600">
              {kpi?.outOfStock ?? 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              نفد المخزون
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-[#0B1E3D]/5 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن منتج..."
                className="w-full pr-10 pl-4 py-3 rounded-lg border border-[#0B1E3D]/10 outline-none focus:border-[#C9A24B]"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-3 rounded-lg border border-[#0B1E3D]/10 bg-white"
            >
              <option value="all">
                كل التصنيفات
              </option>

              {categories.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name_ar}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-3 rounded-lg border border-[#0B1E3D]/10 bg-white"
            >
              <option value="all">
                كل الحالات
              </option>

              <option value="active">
                نشط
              </option>

              <option value="inactive">
                غير نشط
              </option>

              <option value="low_stock">
                مخزون منخفض
              </option>

              <option value="out_of_stock">
                نفد المخزون
              </option>
            </select>

          </div>
        </div>

        {/* Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-[#0B1E3D]">
              {filteredProducts.length}
            </span>{" "}
            منتج
          </p>
        </div>

        {/* Products */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#0B1E3D]/5 py-16 text-center">
            <ShoppingBag className="w-10 h-10 text-[#C9A24B] mx-auto mb-4" />

            <h2 className="font-bold text-[#0B1E3D]">
              لا توجد منتجات
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              لا توجد منتجات تطابق البحث الحالي.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#0B1E3D]/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAFAF8] border-b border-[#0B1E3D]/5">
                  <tr>
                    <th className="text-right p-4 text-xs text-gray-500">
                      المنتج
                    </th>

                    <th className="text-right p-4 text-xs text-gray-500">
                      التصنيف
                    </th>

                    <th className="text-right p-4 text-xs text-gray-500">
                      السعر
                    </th>

                    <th className="text-right p-4 text-xs text-gray-500">
                      المخزون
                    </th>

                    <th className="text-right p-4 text-xs text-gray-500">
                      الحالة
                    </th>

                    <th className="text-right p-4 text-xs text-gray-500">
                      الإجراءات
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#0B1E3D]/5">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-[#FAFAF8]"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={product.images?.[0] || null}
                            alt={product.name_ar}
                          />

                          <div>
                            <p className="font-semibold text-[#0B1E3D]">
                              {product.name_ar}
                            </p>

                            {product.name_en && (
                              <p
                                dir="ltr"
                                className="text-xs text-gray-400 mt-1"
                              >
                                {product.name_en}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-sm text-gray-600">
                        {product.category?.name_ar || "بدون تصنيف"}
                      </td>

                      <td className="p-4 font-semibold text-[#0B1E3D]">
                        {formatPrice(product.price)}
                      </td>

                      <td className="p-4">
                        <span
                          className={
                            product.stock === 0
                              ? "text-red-600 font-bold"
                              : product.stock <= 5
                              ? "text-orange-600 font-bold"
                              : "text-[#0B1E3D] font-semibold"
                          }
                        >
                          {product.stock}
                        </span>
                      </td>

                      <td className="p-4">
                        <StatusBadge
                          active={product.is_active}
                          stock={product.stock}
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">

                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-2 rounded-lg text-[#0B1E3D] hover:bg-[#0B1E3D]/5"
                            title="تعديل"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() =>
                              toggleStatus(product)
                            }
                            disabled={
                              toggling === product.id
                            }
                            className="p-2 rounded-lg text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                            title={
                              product.is_active
                                ? "تعطيل"
                                : "تفعيل"
                            }
                          >
                            {toggling === product.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : product.is_active ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() =>
                              setDeleteId(product.id)
                            }
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() =>
              !deleting && setDeleteId(null)
            }
          />

          <div className="relative bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-[#0B1E3D]">
              حذف المنتج
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.
            </p>

            <div className="flex gap-3 mt-6">

              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl border border-gray-200"
              >
                إلغاء
              </button>

              <button
                onClick={deleteProduct}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white flex items-center justify-center gap-2"
              >
                {deleting && (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}

                {deleting
                  ? "جارٍ الحذف..."
                  : "حذف المنتج"}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
