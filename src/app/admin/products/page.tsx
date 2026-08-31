"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Filter,
  X,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Box,
  Tag,
  ArrowUpDown,
  ChevronDown,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name_ar: string;
  price: number;
  stock: number;
  is_active: boolean;
  images: string[] | null;
  category_id?: string | null;
  category?: {
    name_ar: string;
  } | null;
  slug?: string;
  created_at: string;
  updated_at: string;
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

type SortField =
  | "name_ar"
  | "price"
  | "stock"
  | "created_at"
  | "updated_at";

type SortOrder = "asc" | "desc";

type StatusFilter =
  | "all"
  | "active"
  | "inactive"
  | "low_stock"
  | "out_of_stock";

/* =========================================================
   Skeletons
========================================================= */

function SkeletonKPI() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-slate-100 mb-4" />
      <div className="h-7 w-16 rounded bg-slate-100 mb-2" />
      <div className="h-3 w-24 rounded bg-slate-100" />
    </div>
  );
}

function SkeletonProduct() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-100" />

        <div className="flex-1 min-w-0">
          <div className="h-4 w-3/4 rounded bg-slate-100 mb-3" />
          <div className="h-3 w-1/2 rounded bg-slate-100 mb-4" />

          <div className="flex gap-2">
            <div className="h-7 w-20 rounded-lg bg-slate-100" />
            <div className="h-7 w-20 rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Status
========================================================= */

function StatusBadge({
  stock,
  isActive,
}: {
  stock: number;
  isActive: boolean;
}) {
  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
        <XCircle className="h-3.5 w-3.5" />
        غير نشط
      </span>
    );
  }

  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
        <XCircle className="h-3.5 w-3.5" />
        نفد المخزون
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-600">
        <AlertTriangle className="h-3.5 w-3.5" />
        مخزون منخفض
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
      <CheckCircle2 className="h-3.5 w-3.5" />
      نشط
    </span>
  );
}

/* =========================================================
   Product Image
========================================================= */

function ProductImage({
  src,
  alt,
  large = false,
}: {
  src: string | null;
  alt: string;
  large?: boolean;
}) {
  const size = large
    ? "h-[84px] w-[84px] sm:h-24 sm:w-24"
    : "h-12 w-12";

  if (src) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-2xl bg-[#F5F0E8] ${size}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={large ? "96px" : "48px"}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-[#F5F0E8] ${size}`}
    >
      <Box className="h-7 w-7 text-[#C9A24B]/70" />
    </div>
  );
}

/* =========================================================
   KPI
========================================================= */

function KPICard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_12px_rgba(11,30,61,0.04)]">
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: bgColor }}
      >
        <Icon
          className="h-5 w-5"
          style={{ color }}
        />
      </div>

      <div className="text-xl font-black tracking-tight text-[#0B1E3D] sm:text-2xl">
        {value.toLocaleString("ar-SA")}
      </div>

      <div className="mt-1 text-[11px] font-medium text-slate-500 sm:text-xs">
        {label}
      </div>
    </div>
  );
}

/* =========================================================
   Delete Modal
========================================================= */

function DeleteModal({
  product,
  onClose,
  onConfirm,
  isDeleting,
}: {
  product: Product | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-[#0B1E3D]/50 backdrop-blur-sm"
        onClick={isDeleting ? undefined : onClose}
      />

      <div
        className="relative w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl"
        dir="rtl"
      >
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>

            <div>
              <h3 className="text-lg font-black text-[#0B1E3D]">
                حذف المنتج
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                هذا الإجراء لا يمكن التراجع عنه
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            هل أنت متأكد من حذف المنتج{" "}
            <strong className="text-[#0B1E3D]">
              "{product.name_ar}"
            </strong>
            ؟
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="h-12 rounded-xl border border-slate-200 bg-white text-sm font-bold text-[#0B1E3D] transition hover:bg-slate-50 disabled:opacity-50"
            >
              إلغاء
            </button>

            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}

              {isDeleting ? "جارٍ الحذف..." : "حذف المنتج"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Mobile Product Card
========================================================= */

function MobileProductCard({
  product,
  onDeleteClick,
  onToggleStatus,
  isToggling,
}: {
  product: Product;
  onDeleteClick: (product: Product) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  isToggling: string | null;
}) {
  return (
    <article className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_2px_14px_rgba(11,30,61,0.04)]">
      {/* Product header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <ProductImage
            src={product.images?.[0] || null}
            alt={product.name_ar}
            large
          />

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3
                dir="rtl"
                className="line-clamp-2 text-sm font-black leading-5 text-[#0B1E3D]"
              >
                {product.name_ar}
              </h3>

              <StatusBadge
                stock={product.stock}
                isActive={product.is_active}
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Tag className="h-3.5 w-3.5 text-[#C9A24B]" />

              <span className="truncate">
                {product.category?.name_ar ||
                  "بدون تصنيف"}
              </span>
            </div>
          </div>
        </div>

        {/* Product data */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#FAFAF8] p-3">
            <div className="mb-1 text-[10px] font-bold text-slate-400">
              السعر
            </div>

            <div className="truncate text-sm font-black text-[#0B1E3D]">
              {formatPrice(product.price)}
            </div>
          </div>

          <div className="rounded-2xl bg-[#FAFAF8] p-3">
            <div className="mb-1 text-[10px] font-bold text-slate-400">
              المخزون
            </div>

            <div
              className={`text-sm font-black ${
                product.stock === 0
                  ? "text-red-600"
                  : product.stock <= 5
                  ? "text-orange-600"
                  : "text-[#0B1E3D]"
              }`}
            >
              {product.stock}
            </div>
          </div>
        </div>

        {/* Updated */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>آخر تحديث</span>

          <span className="font-semibold text-slate-500">
            {new Date(
              product.updated_at
            ).toLocaleDateString("ar-SA", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-slate-100 bg-slate-50/70 p-3">
        <div className="grid grid-cols-[1fr_1fr_48px] gap-2">
          <Link
            href={`/admin/products/${product.id}`}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B1E3D] text-xs font-bold text-white transition active:scale-[0.98]"
          >
            <Pencil className="h-4 w-4" />
            تعديل
          </Link>

          <button
            onClick={() =>
              onToggleStatus(
                product.id,
                product.is_active
              )
            }
            disabled={isToggling === product.id}
            className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition active:scale-[0.98] disabled:opacity-50 ${
              product.is_active
                ? "border-orange-200 bg-orange-50 text-orange-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {isToggling === product.id ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : product.is_active ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}

            {product.is_active
              ? "تعطيل"
              : "تفعيل"}
          </button>

          <button
            onClick={() =>
              onDeleteClick(product)
            }
            className="flex h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition active:scale-[0.98]"
            aria-label="حذف المنتج"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   Main
========================================================= */

function AdminProductsContent() {
  const searchParams = useSearchParams();

  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [kpi, setKpi] =
    useState<KPIData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [searchQuery, setSearchQuery] =
    useState(
      searchParams.get("q") || ""
    );

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>(
      (searchParams.get("status") as StatusFilter) ||
        "all"
    );

  const [categoryFilter, setCategoryFilter] =
    useState(
      searchParams.get("category") || "all"
    );

  const [sortField, setSortField] =
    useState<SortField>(
      (searchParams.get("sort") as SortField) ||
        "updated_at"
    );

  const [sortOrder, setSortOrder] =
    useState<SortOrder>(
      (searchParams.get("order") as SortOrder) ||
        "desc"
    );

  const [deleteModalProduct, setDeleteModalProduct] =
    useState<Product | null>(null);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [isToggling, setIsToggling] =
    useState<string | null>(null);

  const [showFilters, setShowFilters] =
    useState(false);

  const [supabase] = useState(() =>
    createClient()
  );

  /* =======================================================
     Fetch
  ======================================================= */

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: catsData,
        error: categoriesError,
      } = await supabase
        .from("categories")
        .select("id, name_ar")
        .order("name_ar", {
          ascending: true,
        });

      if (categoriesError) {
        throw new Error(
          `CATEGORIES ERROR: ${categoriesError.message}`
        );
      }

      setCategories(catsData || []);

      let query = supabase
        .from("products")
        .select(`
          id,
          name_ar,
          price,
          stock,
          is_active,
          images,
          category_id,
          slug,
          created_at,
          updated_at,
          category:categories(name_ar)
        `);

      if (categoryFilter !== "all") {
        query = query.eq(
          "category_id",
          categoryFilter
        );
      }

      if (statusFilter === "active") {
        query = query.eq(
          "is_active",
          true
        );
      }

      if (statusFilter === "inactive") {
        query = query.eq(
          "is_active",
          false
        );
      }

      if (statusFilter === "low_stock") {
        query = query
          .eq("is_active", true)
          .gt("stock", 0)
          .lte("stock", 5);
      }

      if (statusFilter === "out_of_stock") {
        query = query
          .eq("is_active", true)
          .eq("stock", 0);
      }

      if (searchQuery.trim()) {
        query = query.ilike(
          "name_ar",
          `%${searchQuery.trim()}%`
        );
      }

      query = query.order(
        sortField,
        {
          ascending:
            sortOrder === "asc",
        }
      );

      const {
        data: productsData,
        error: productsError,
      } = await query;

      if (productsError) {
        throw new Error(
          `PRODUCTS ERROR: ${productsError.message} | code=${productsError.code || ""}`
        );
      }

      const transformed: Product[] =
        (productsData || []).map(
          (product: any) => ({
            id: product.id,
            name_ar: product.name_ar,
            price: Number(
              product.price || 0
            ),
            stock: Number(
              product.stock || 0
            ),
            is_active:
              Boolean(product.is_active),
            images:
              Array.isArray(product.images)
                ? product.images
                : null,
            category_id:
              product.category_id || null,
            category:
              product.category || null,
            slug: product.slug,
            created_at:
              product.created_at,
            updated_at:
              product.updated_at,
          })
        );

      setProducts(transformed);

      const {
        data: allProducts,
        error: kpiError,
      } = await supabase
        .from("products")
        .select(
          "stock, is_active"
        );

      if (kpiError) {
        throw new Error(
          `KPI ERROR: ${kpiError.message}`
        );
      }

      const safeProducts =
        allProducts || [];

      setKpi({
        total: safeProducts.length,

        active: safeProducts.filter(
          (p) => p.is_active
        ).length,

        inactive: safeProducts.filter(
          (p) => !p.is_active
        ).length,

        lowStock:
          safeProducts.filter(
            (p) =>
              p.is_active &&
              Number(p.stock) > 0 &&
              Number(p.stock) <= 5
          ).length,

        outOfStock:
          safeProducts.filter(
            (p) =>
              p.is_active &&
              Number(p.stock) === 0
          ).length,
      });
    } catch (err: any) {
      console.error(
        "Admin Products Error:",
        err
      );

      setError(
        err?.message ||
          "تعذر تحميل المنتجات."
      );
    } finally {
      setLoading(false);
    }
  }, [
    supabase,
    searchQuery,
    statusFilter,
    categoryFilter,
    sortField,
    sortOrder,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* =======================================================
     URL
  ======================================================= */

  useEffect(() => {
    const params =
      new URLSearchParams();

    if (searchQuery)
      params.set("q", searchQuery);

    if (statusFilter !== "all")
      params.set(
        "status",
        statusFilter
      );

    if (categoryFilter !== "all")
      params.set(
        "category",
        categoryFilter
      );

    if (sortField !== "updated_at")
      params.set(
        "sort",
        sortField
      );

    if (sortOrder !== "desc")
      params.set(
        "order",
        sortOrder
      );

    const qs = params.toString();

    window.history.replaceState(
      null,
      "",
      qs
        ? `/admin/products?${qs}`
        : "/admin/products"
    );
  }, [
    searchQuery,
    statusFilter,
    categoryFilter,
    sortField,
    sortOrder,
  ]);

  /* =======================================================
     Delete
  ======================================================= */

  const handleDelete = async () => {
    if (!deleteModalProduct) return;

    setIsDeleting(true);

    try {
      const {
        error: deleteError,
      } = await supabase
        .from("products")
        .delete()
        .eq(
          "id",
          deleteModalProduct.id
        );

      if (deleteError) {
        throw deleteError;
      }

      setDeleteModalProduct(null);

      await fetchData();
    } catch (err: any) {
      console.error(err);

      alert(
        "فشل حذف المنتج: " +
          (err?.message ||
            "خطأ غير معروف")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  /* =======================================================
     Toggle
  ======================================================= */

  const handleToggleStatus = async (
    id: string,
    currentStatus: boolean
  ) => {
    setIsToggling(id);

    try {
      const {
        error: updateError,
      } = await supabase
        .from("products")
        .update({
          is_active:
            !currentStatus,
        })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      await fetchData();
    } catch (err: any) {
      console.error(err);

      alert(
        "فشل تغيير حالة المنتج: " +
          (err?.message ||
            "خطأ غير معروف")
      );
    } finally {
      setIsToggling(null);
    }
  };

  /* =======================================================
     Filters
  ======================================================= */

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortField("updated_at");
    setSortOrder("desc");
  };

  const hasFilters =
    Boolean(searchQuery) ||
    statusFilter !== "all" ||
    categoryFilter !== "all";

  /* =======================================================
     Error
  ======================================================= */

  if (error) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[70vh] items-center justify-center bg-[#FAFAF8] px-4"
      >
        <div className="w-full max-w-lg rounded-[24px] border border-red-100 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>

          <h2 className="text-lg font-black text-[#0B1E3D]">
            تعذر تحميل المنتجات
          </h2>

          <p className="mt-2 break-words text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            onClick={fetchData}
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B1E3D] px-5 text-sm font-bold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full overflow-x-hidden bg-[#FAFAF8]"
    >
      {/* =================================================
          Header
      ================================================= */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B1E3D]">
                  <Package className="h-4.5 w-4.5 text-[#C9A24B]" />
                </div>

                <h1 className="truncate text-xl font-black tracking-tight text-[#0B1E3D] sm:text-3xl">
                  إدارة المنتجات
                </h1>
              </div>

              <p className="hidden text-sm text-slate-500 sm:block">
                تحكم كامل في المنتجات والمخزون والأسعار
              </p>
            </div>

            <Link
              href="/admin/products/new"
              className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C9A24B] px-4 text-xs font-black text-[#0B1E3D] shadow-sm transition active:scale-[0.98] sm:h-12 sm:px-5 sm:text-sm"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>إضافة منتج</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        {/* =================================================
            KPI
        ================================================= */}

        {loading ? (
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map(
              (_, i) => (
                <SkeletonKPI key={i} />
              )
            )}
          </div>
        ) : kpi ? (
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <KPICard
              icon={Package}
              label="إجمالي المنتجات"
              value={kpi.total}
              color="#0B1E3D"
              bgColor="#0B1E3D0D"
            />

            <KPICard
              icon={CheckCircle2}
              label="المنتجات النشطة"
              value={kpi.active}
              color="#16A34A"
              bgColor="#16A34A10"
            />

            <KPICard
              icon={XCircle}
              label="غير النشطة"
              value={kpi.inactive}
              color="#64748B"
              bgColor="#64748B10"
            />

            <KPICard
              icon={AlertTriangle}
              label="مخزون منخفض"
              value={kpi.lowStock}
              color="#EA580C"
              bgColor="#EA580C10"
            />

            <KPICard
              icon={XCircle}
              label="نفد المخزون"
              value={kpi.outOfStock}
              color="#DC2626"
              bgColor="#DC262610"
            />
          </div>
        ) : null}

        {/* =================================================
            Search / Controls
        ================================================= */}

        <section className="mb-5 rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_2px_14px_rgba(11,30,61,0.04)] sm:p-4">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            {/* Search */}
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(
                    e.target.value
                  )
                }
                placeholder="ابحث باسم المنتج..."
                dir="rtl"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-10 text-sm font-medium text-[#0B1E3D] outline-none transition placeholder:text-slate-400 focus:border-[#C9A24B] focus:bg-white focus:ring-4 focus:ring-[#C9A24B]/10"
              />

              {searchQuery && (
                <button
                  onClick={() =>
                    setSearchQuery("")
                  }
                  className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="مسح البحث"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={() =>
                setShowFilters(
                  !showFilters
                )
              }
              className={`flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition sm:w-auto ${
                showFilters
                  ? "border-[#0B1E3D] bg-[#0B1E3D] text-white"
                  : "border-slate-200 bg-white text-[#0B1E3D] hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              الفلاتر

              {hasFilters && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C9A24B] px-1 text-[10px] font-black text-[#0B1E3D]">
                  !
                </span>
              )}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-3 grid grid-cols-1 gap-2.5 border-t border-slate-100 pt-3 sm:grid-cols-3">
              {/* Status */}
              <div className="relative">
                <label className="mb-1.5 block px-1 text-[11px] font-bold text-slate-500">
                  حالة المنتج
                </label>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as StatusFilter
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pl-9 text-sm font-medium text-[#0B1E3D] outline-none focus:border-[#C9A24B] focus:bg-white"
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

                <ChevronDown className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-slate-400" />
              </div>

              {/* Category */}
              {categories.length > 0 && (
                <div className="relative">
                  <label className="mb-1.5 block px-1 text-[11px] font-bold text-slate-500">
                    التصنيف
                  </label>

                  <select
                    value={categoryFilter}
                    onChange={(e) =>
                      setCategoryFilter(
                        e.target.value
                      )
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pl-9 text-sm font-medium text-[#0B1E3D] outline-none focus:border-[#C9A24B] focus:bg-white"
                  >
                    <option value="all">
                      كل التصنيفات
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name_ar}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-slate-400" />
                </div>
              )}

              {/* Sort */}
              <div className="relative">
                <label className="mb-1.5 block px-1 text-[11px] font-bold text-slate-500">
                  ترتيب المنتجات
                </label>

                <select
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [
                      field,
                      order,
                    ] =
                      e.target.value.split(
                        "-"
                      );

                    setSortField(
                      field as SortField
                    );

                    setSortOrder(
                      order as SortOrder
                    );
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pl-9 text-sm font-medium text-[#0B1E3D] outline-none focus:border-[#C9A24B] focus:bg-white"
                >
                  <option value="updated_at-desc">
                    الأحدث أولاً
                  </option>
                  <option value="updated_at-asc">
                    الأقدم أولاً
                  </option>
                  <option value="name_ar-asc">
                    الاسم أ - ي
                  </option>
                  <option value="name_ar-desc">
                    الاسم ي - أ
                  </option>
                  <option value="price-asc">
                    السعر: الأقل
                  </option>
                  <option value="price-desc">
                    السعر: الأعلى
                  </option>
                  <option value="stock-asc">
                    المخزون: الأقل
                  </option>
                  <option value="stock-desc">
                    المخزون: الأعلى
                  </option>
                </select>

                <ArrowUpDown className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-slate-400" />
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="h-11 rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100 sm:col-span-3"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <X className="h-4 w-4" />
                    مسح جميع الفلاتر
                  </span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* =================================================
            Results bar
        ================================================= */}

        {!loading && (
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-[#0B1E3D]">
                {products.length.toLocaleString(
                  "ar-SA"
                )}
              </span>

              <span className="text-xs text-slate-500">
                منتج
              </span>
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-bold text-[#C9A24B]"
              >
                إزالة الفلاتر
              </button>
            )}
          </div>
        )}

        {/* =================================================
            Loading
        ================================================= */}

        {loading ? (
          <div className="space-y-3">
            {Array.from({
              length: 4,
            }).map((_, i) => (
              <SkeletonProduct key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          /* =================================================
             Empty
          ================================================= */

          <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F0E8]">
              <ShoppingBag className="h-7 w-7 text-[#C9A24B]" />
            </div>

            <h3 className="text-lg font-black text-[#0B1E3D]">
              {hasFilters
                ? "لا توجد نتائج مطابقة"
                : "لا توجد منتجات حتى الآن"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {hasFilters
                ? "جرّب تغيير معايير البحث أو إزالة الفلاتر."
                : "ابدأ بإضافة أول منتج إلى متجرك."}
            </p>

            <div className="mt-6">
              {hasFilters ? (
                <button
                  onClick={clearFilters}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0B1E3D] px-5 text-sm font-bold text-white"
                >
                  <X className="h-4 w-4" />
                  مسح الفلاتر
                </button>
              ) : (
                <Link
                  href="/admin/products/new"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#C9A24B] px-5 text-sm font-black text-[#0B1E3D]"
                >
                  <Plus className="h-4 w-4" />
                  إضافة أول منتج
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* =================================================
                Mobile / Tablet
            ================================================= */}

            <div className="grid grid-cols-1 gap-3 lg:hidden">
              {products.map(
                (product) => (
                  <MobileProductCard
                    key={product.id}
                    product={product}
                    onDeleteClick={
                      setDeleteModalProduct
                    }
                    onToggleStatus={
                      handleToggleStatus
                    }
                    isToggling={
                      isToggling
                    }
                  />
                )
              )}
            </div>

            {/* =================================================
                Desktop Table
            ================================================= */}

            <div className="hidden overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-4 text-right text-xs font-black text-slate-500">
                        المنتج
                      </th>

                      <th className="px-4 py-4 text-right text-xs font-black text-slate-500">
                        التصنيف
                      </th>

                      <th className="px-4 py-4 text-right text-xs font-black text-slate-500">
                        السعر
                      </th>

                      <th className="px-4 py-4 text-right text-xs font-black text-slate-500">
                        المخزون
                      </th>

                      <th className="px-4 py-4 text-right text-xs font-black text-slate-500">
                        الحالة
                      </th>

                      <th className="px-4 py-4 text-right text-xs font-black text-slate-500">
                        التحديث
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-black text-slate-500">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {products.map(
                      (product) => (
                        <tr
                          key={product.id}
                          className="transition hover:bg-[#FAFAF8]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <ProductImage
                                src={
                                  product.images?.[0] ||
                                  null
                                }
                                alt={
                                  product.name_ar
                                }
                              />

                              <div className="min-w-0">
                                <div
                                  dir="rtl"
                                  className="max-w-[230px] truncate font-bold text-[#0B1E3D]"
                                >
                                  {
                                    product.name_ar
                                  }
                                </div>

                                <div className="mt-1 text-[11px] text-slate-400">
                                  ID:{" "}
                                  {product.id.slice(
                                    0,
                                    8
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                              <Tag className="h-3.5 w-3.5 text-[#C9A24B]" />
                              {product.category
                                ?.name_ar ||
                                "بدون تصنيف"}
                            </span>
                          </td>

                          <td className="px-4 py-4 font-black text-[#0B1E3D]">
                            {formatPrice(
                              product.price
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`font-black ${
                                product.stock ===
                                0
                                  ? "text-red-600"
                                  : product.stock <=
                                    5
                                  ? "text-orange-600"
                                  : "text-[#0B1E3D]"
                              }`}
                            >
                              {
                                product.stock
                              }
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <StatusBadge
                              stock={
                                product.stock
                              }
                              isActive={
                                product.is_active
                              }
                            />
                          </td>

                          <td className="px-4 py-4 text-xs font-medium text-slate-500">
                            {new Date(
                              product.updated_at
                            ).toLocaleDateString(
                              "ar-SA",
                              {
                                year:
                                  "numeric",
                                month:
                                  "short",
                                day:
                                  "numeric",
                              }
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/admin/products/${product.id}`}
                                className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-[#0B1E3D] transition hover:bg-slate-100"
                              >
                                <Pencil className="h-4 w-4" />
                                تعديل
                              </Link>

                              <button
                                onClick={() =>
                                  handleToggleStatus(
                                    product.id,
                                    product.is_active
                                  )
                                }
                                disabled={
                                  isToggling ===
                                  product.id
                                }
                                className={`flex h-9 items-center justify-center rounded-lg px-2 transition disabled:opacity-50 ${
                                  product.is_active
                                    ? "text-orange-600 hover:bg-orange-50"
                                    : "text-emerald-600 hover:bg-emerald-50"
                                }`}
                                title={
                                  product.is_active
                                    ? "تعطيل"
                                    : "تفعيل"
                                }
                              >
                                {isToggling ===
                                product.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : product.is_active ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </button>

                              <button
                                onClick={() =>
                                  setDeleteModalProduct(
                                    product
                                  )
                                }
                                className="flex h-9 items-center justify-center rounded-lg px-2 text-red-500 transition hover:bg-red-50"
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <DeleteModal
        product={deleteModalProduct}
        onClose={() =>
          setDeleteModalProduct(null)
        }
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

/* =========================================================
   Page
========================================================= */

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div
          dir="rtl"
          className="min-h-screen bg-[#FAFAF8] px-4 py-5"
        >
          <div className="mx-auto max-w-7xl space-y-4">
            <div className="h-16 animate-pulse rounded-2xl bg-white" />

            <div className="grid grid-cols-2 gap-3">
              {Array.from({
                length: 5,
              }).map((_, i) => (
                <SkeletonKPI key={i} />
              ))}
            </div>

            <div className="h-16 animate-pulse rounded-2xl bg-white" />

            {Array.from({
              length: 4,
            }).map((_, i) => (
              <SkeletonProduct key={i} />
            ))}
          </div>
        </div>
      }
    >
      <AdminProductsContent />
    </Suspense>
  );
}
