"use client";

import {
  useCallback,
  useEffect,
  useState,
  Suspense,
} from "react";
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
  MoreVertical,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

/* =========================================================
   TYPES
========================================================= */

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
   HELPERS
========================================================= */

function formatDate(date: string) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value: number) {
  return value.toLocaleString("ar-EG");
}

/* =========================================================
   SKELETONS
========================================================= */

function SkeletonKPI() {
  return (
    <div className="rounded-2xl border border-[#0B1E3D]/5 bg-white p-4 animate-pulse">
      <div className="h-9 w-9 rounded-xl bg-[#0B1E3D]/5 mb-4" />
      <div className="h-7 w-16 rounded bg-[#0B1E3D]/5 mb-2" />
      <div className="h-3 w-24 rounded bg-[#0B1E3D]/5" />
    </div>
  );
}

function SkeletonProduct() {
  return (
    <div className="rounded-2xl border border-[#0B1E3D]/5 bg-white p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 rounded-xl bg-[#0B1E3D]/5" />

        <div className="flex-1">
          <div className="h-4 w-3/4 rounded bg-[#0B1E3D]/5 mb-3" />
          <div className="h-3 w-1/2 rounded bg-[#0B1E3D]/5 mb-3" />

          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-[#0B1E3D]/5" />
            <div className="h-5 w-14 rounded-full bg-[#0B1E3D]/5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="h-12 rounded-xl bg-[#0B1E3D]/5" />
        <div className="h-12 rounded-xl bg-[#0B1E3D]/5" />
      </div>

      <div className="h-10 rounded-xl bg-[#0B1E3D]/5 mt-3" />
    </div>
  );
}

/* =========================================================
   STATUS
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
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-600 whitespace-nowrap">
        <XCircle className="h-3.5 w-3.5" />
        غير نشط
      </span>
    );
  }

  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 whitespace-nowrap">
        <XCircle className="h-3.5 w-3.5" />
        نفد المخزون
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 whitespace-nowrap">
        <AlertTriangle className="h-3.5 w-3.5" />
        مخزون منخفض
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 whitespace-nowrap">
      <CheckCircle2 className="h-3.5 w-3.5" />
      نشط
    </span>
  );
}

/* =========================================================
   PRODUCT IMAGE
========================================================= */

function ProductImage({
  src,
  alt,
  size = "md",
}: {
  src: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm"
      ? "h-12 w-12 rounded-xl"
      : size === "lg"
      ? "h-20 w-20 rounded-2xl"
      : "h-16 w-16 rounded-xl";

  if (src) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden bg-[#F5F0E8] ${sizeClass}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-[#F5F0E8] ${sizeClass}`}
    >
      <Box className="h-6 w-6 text-[#C9A24B]/70" />
    </div>
  );
}

/* =========================================================
   KPI CARD
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
    <div className="min-w-0 rounded-2xl border border-[#0B1E3D]/5 bg-white p-4 shadow-[0_2px_10px_rgba(11,30,61,0.03)] transition-all hover:shadow-md sm:p-5">
      <div
        className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl sm:h-10 sm:w-10"
        style={{ backgroundColor: bgColor }}
      >
        <Icon
          className="h-4.5 w-4.5 sm:h-5 sm:w-5"
          style={{ color }}
        />
      </div>

      <p className="text-xl font-extrabold tracking-tight text-[#0B1E3D] sm:text-2xl">
        {formatNumber(value)}
      </p>

      <p className="mt-1 text-[11px] leading-4 text-gray-500 sm:text-sm">
        {label}
      </p>
    </div>
  );
}

/* =========================================================
   DELETE MODAL
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0B1E3D]/50 backdrop-blur-sm"
        onClick={isDeleting ? undefined : onClose}
      />

      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        dir="rtl"
      >
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>

            <div className="min-w-0">
              <h3 className="text-lg font-bold text-[#0B1E3D]">
                حذف المنتج
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#FAFAF8] p-4">
            <p className="text-sm leading-6 text-[#0B1E3D]">
              هل أنت متأكد من حذف:
            </p>

            <p className="mt-1 break-words font-bold text-[#0B1E3D]">
              {product.name_ar}
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              سيتم حذف المنتج نهائيًا من قاعدة البيانات.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="h-11 rounded-xl border border-[#0B1E3D]/10 bg-white px-4 text-sm font-bold text-[#0B1E3D] transition hover:bg-gray-50 disabled:opacity-50"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}

              {isDeleting ? "جارٍ الحذف..." : "حذف نهائي"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MOBILE PRODUCT CARD
========================================================= */

function MobileProductCard({
  product,
  onDeleteClick,
  onToggleStatus,
  isToggling,
}: {
  product: Product;
  onDeleteClick: (product: Product) => void;
  onToggleStatus: (
    id: string,
    currentStatus: boolean
  ) => void;
  isToggling: string | null;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#0B1E3D]/7 bg-white shadow-[0_2px_12px_rgba(11,30,61,0.04)]">
      {/* Product header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <ProductImage
            src={product.images?.[0] || null}
            alt={product.name_ar}
            size="md"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className="break-words text-sm font-extrabold leading-5 text-[#0B1E3D]"
                  dir="rtl"
                >
                  {product.name_ar}
                </h3>

                <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] text-gray-500">
                  <Tag className="h-3 w-3 shrink-0 text-[#C9A24B]" />

                  <span className="truncate">
                    {product.category?.name_ar ||
                      "بدون تصنيف"}
                  </span>
                </div>
              </div>

              <StatusBadge
                stock={product.stock}
                isActive={product.is_active}
              />
            </div>
          </div>
        </div>

        {/* Product stats */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#FAFAF8] px-3 py-2.5">
            <p className="text-[10px] font-medium text-gray-400">
              السعر
            </p>

            <p className="mt-0.5 truncate text-sm font-extrabold text-[#0B1E3D]">
              {formatPrice(product.price)}
            </p>
          </div>

          <div className="rounded-xl bg-[#FAFAF8] px-3 py-2.5">
            <p className="text-[10px] font-medium text-gray-400">
              المخزون
            </p>

            <p
              className={`mt-0.5 text-sm font-extrabold ${
                product.stock === 0
                  ? "text-red-600"
                  : product.stock <= 5
                  ? "text-orange-600"
                  : "text-[#0B1E3D]"
              }`}
            >
              {formatNumber(product.stock)}
            </p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-xl border border-[#0B1E3D]/5 px-3 py-2.5">
          <span className="text-[10px] text-gray-400">
            آخر تحديث
          </span>

          <span className="text-[11px] font-bold text-[#0B1E3D]">
            {formatDate(product.updated_at)}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
          <Link
            href={`/admin/products/${product.id}`}
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#0B1E3D] px-3 text-xs font-bold text-white transition hover:bg-[#102b55] active:scale-[0.98]"
          >
            <Pencil className="h-4 w-4" />
            تعديل
          </Link>

          <button
            type="button"
            onClick={() =>
              onToggleStatus(
                product.id,
                product.is_active
              )
            }
            disabled={isToggling === product.id}
            className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-bold transition active:scale-[0.98] disabled:opacity-50 ${
              product.is_active
                ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {isToggling === product.id ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : product.is_active ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}

            {product.is_active ? "تعطيل" : "تفعيل"}
          </button>

          <button
            type="button"
            onClick={() => onDeleteClick(product)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
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
   EMPTY STATE
========================================================= */

function EmptyState({
  hasFilters,
  clearFilters,
}: {
  hasFilters: boolean;
  clearFilters: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#0B1E3D]/5 bg-white px-5 py-14 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F0E8]">
        <ShoppingBag className="h-7 w-7 text-[#C9A24B]" />
      </div>

      <h3 className="text-lg font-extrabold text-[#0B1E3D]">
        {hasFilters
          ? "لا توجد نتائج مطابقة"
          : "لا توجد منتجات حتى الآن"}
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
        {hasFilters
          ? "جرّب تعديل البحث أو الفلاتر."
          : "ابدأ بإضافة منتجك الأول لإدارة متجرك."}
      </p>

      {hasFilters ? (
        <button
          type="button"
          onClick={clearFilters}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#0B1E3D] px-5 text-sm font-bold text-white"
        >
          <X className="h-4 w-4" />
          مسح الفلاتر
        </button>
      ) : (
        <Link
          href="/admin/products/new"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#C9A24B] px-5 text-sm font-extrabold text-[#0B1E3D]"
        >
          <Plus className="h-4 w-4" />
          إضافة أول منتج
        </Link>
      )}
    </div>
  );
}

/* =========================================================
   MAIN CONTENT
========================================================= */

function AdminProductsContent() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [kpi, setKpi] = useState<KPIData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || ""
  );

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>(() => {
      const value = searchParams.get("status");

      return value === "active" ||
        value === "inactive" ||
        value === "low_stock" ||
        value === "out_of_stock"
        ? value
        : "all";
    });

  const [categoryFilter, setCategoryFilter] =
    useState(searchParams.get("category") || "all");

  const [sortField, setSortField] =
    useState<SortField>(() => {
      const value = searchParams.get("sort");

      return value === "name_ar" ||
        value === "price" ||
        value === "stock" ||
        value === "created_at" ||
        value === "updated_at"
        ? value
        : "updated_at";
    });

  const [sortOrder, setSortOrder] =
    useState<SortOrder>(() => {
      return searchParams.get("order") === "asc"
        ? "asc"
        : "desc";
    });

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
     FETCH
  ======================================================= */

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      /* Categories */
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

      /* Products */
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
        query = query.eq("is_active", true);
      }

      if (statusFilter === "inactive") {
        query = query.eq("is_active", false);
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

      /*
       * IMPORTANT:
       * The database contains name_ar.
       * Do NOT use name_en here.
       */
      if (searchQuery.trim()) {
        query = query.ilike(
          "name_ar",
          `%${searchQuery.trim()}%`
        );
      }

      query = query.order(sortField, {
        ascending: sortOrder === "asc",
      });

      const {
        data: productsData,
        error: productsError,
      } = await query;

      if (productsError) {
        throw new Error(
          `PRODUCTS ERROR: ${productsError.message} | code=${productsError.code || ""} | details=${productsError.details || ""} | hint=${productsError.hint || ""}`
        );
      }

      const transformed: Product[] =
        (productsData || []).map(
          (product: any) => ({
            id: product.id,
            name_ar: product.name_ar,
            price: Number(product.price || 0),
            stock: Number(product.stock || 0),
            is_active: Boolean(
              product.is_active
            ),
            images: Array.isArray(product.images)
              ? product.images
              : null,
            category_id:
              product.category_id || null,
            category:
              product.category || null,
            slug: product.slug,
            created_at: product.created_at,
            updated_at: product.updated_at,
          })
        );

      setProducts(transformed);

      /* KPI */
      const {
        data: allProducts,
        error: kpiError,
      } = await supabase
        .from("products")
        .select("stock, is_active");

      if (kpiError) {
        throw new Error(
          `KPI ERROR: ${kpiError.message} | code=${kpiError.code || ""}`
        );
      }

      const safeProducts = allProducts || [];

      setKpi({
        total: safeProducts.length,

        active: safeProducts.filter(
          (p) => p.is_active
        ).length,

        inactive: safeProducts.filter(
          (p) => !p.is_active
        ).length,

        lowStock: safeProducts.filter(
          (p) =>
            p.is_active &&
            Number(p.stock) > 0 &&
            Number(p.stock) <= 5
        ).length,

        outOfStock: safeProducts.filter(
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
          "تعذر تحميل المنتجات. يرجى المحاولة مرة أخرى."
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
    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    if (categoryFilter !== "all") {
      params.set("category", categoryFilter);
    }

    if (sortField !== "updated_at") {
      params.set("sort", sortField);
    }

    if (sortOrder !== "desc") {
      params.set("order", sortOrder);
    }

    const queryString = params.toString();

    window.history.replaceState(
      null,
      "",
      queryString
        ? `/admin/products?${queryString}`
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
     DELETE
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

      setProducts((prev) =>
        prev.filter(
          (product) =>
            product.id !==
            deleteModalProduct.id
        )
      );

      setDeleteModalProduct(null);

      await fetchData();
    } catch (err: any) {
      console.error(
        "Delete product error:",
        err
      );

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
     TOGGLE
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
          is_active: !currentStatus,
        })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      setProducts((prev) =>
        prev.map((product) =>
          product.id === id
            ? {
                ...product,
                is_active: !currentStatus,
              }
            : product
        )
      );

      setKpi((prev) => {
        if (!prev) return prev;

        return {
          ...prev,

          active: currentStatus
            ? Math.max(0, prev.active - 1)
            : prev.active + 1,

          inactive: currentStatus
            ? prev.inactive + 1
            : Math.max(0, prev.inactive - 1),
        };
      });
    } catch (err: any) {
      console.error(
        "Toggle product error:",
        err
      );

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
     FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortField("updated_at");
    setSortOrder("desc");
  };

  const hasFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "all" ||
    categoryFilter !== "all";

  /* =======================================================
     SORT
  ======================================================= */

  const handleSort = (
    field: SortField
  ) => {
    if (sortField === field) {
      setSortOrder((prev) =>
        prev === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div
        className="min-h-[70vh] bg-[#FAFAF8] px-4 py-12"
        dir="rtl"
      >
        <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>

          <h2 className="text-xl font-extrabold text-[#0B1E3D]">
            فشل تحميل المنتجات
          </h2>

          <p className="mt-3 break-words text-sm leading-6 text-gray-500">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchData}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#0B1E3D] px-5 text-sm font-bold text-white transition hover:bg-[#102b55]"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#FAFAF8]"
      dir="rtl"
    >
      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <header className="border-b border-[#0B1E3D]/5 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1E3D]">
                  <Package className="h-4 w-4 text-[#C9A24B]" />
                </div>

                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A24B]">
                  Inventory
                </span>
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1E3D] sm:text-3xl">
                إدارة المنتجات
              </h1>

              <p className="mt-1 max-w-xl text-xs leading-5 text-gray-500 sm:text-sm">
                إدارة المنتجات والمخزون والأسعار والحالة من مكان واحد.
              </p>
            </div>

            <Link
              href="/admin/products/new"
              className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C9A24B] px-5 text-sm font-extrabold text-[#0B1E3D] shadow-sm transition hover:bg-[#D4B05F] active:scale-[0.98] sm:w-auto"
            >
              <Plus className="h-5 w-5" />
              إضافة منتج
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {/* =================================================
            KPI
        ================================================= */}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map(
              (_, index) => (
                <SkeletonKPI key={index} />
              )
            )}
          </div>
        ) : kpi ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <KPICard
              icon={Package}
              label="إجمالي المنتجات"
              value={kpi.total}
              color="#0B1E3D"
              bgColor="#0B1E3D08"
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
              color="#6B7280"
              bgColor="#6B728010"
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
            SEARCH / FILTER BAR
        ================================================= */}

        <section className="rounded-2xl border border-[#0B1E3D]/5 bg-white p-3.5 shadow-[0_2px_12px_rgba(11,30,61,0.03)] sm:p-4">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />

            <input
              type="search"
              inputMode="search"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              placeholder="ابحث باسم المنتج..."
              className="h-12 w-full rounded-xl border border-[#0B1E3D]/10 bg-[#FAFAF8] px-11 pl-11 text-sm font-medium text-[#0B1E3D] outline-none transition placeholder:text-gray-400 focus:border-[#C9A24B] focus:bg-white focus:ring-4 focus:ring-[#C9A24B]/10"
              dir="rtl"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="مسح البحث"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mobile filter button */}
          <button
            type="button"
            onClick={() =>
              setShowFilters((prev) => !prev)
            }
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#0B1E3D]/10 bg-white text-sm font-bold text-[#0B1E3D] transition hover:bg-gray-50 sm:hidden"
          >
            <Filter className="h-4 w-4" />
            الفلاتر والترتيب

            {hasFilters && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C9A24B] px-1 text-[10px] font-extrabold text-[#0B1E3D]">
                !
              </span>
            )}

            <ChevronDown
              className={`mr-auto h-4 w-4 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Desktop filters */}
          <div className="mt-3 hidden gap-2 sm:flex sm:flex-wrap">
            <FilterSelect
              value={statusFilter}
              onChange={(value) =>
                setStatusFilter(
                  value as StatusFilter
                )
              }
              options={[
                ["all", "كل الحالات"],
                ["active", "نشط"],
                ["inactive", "غير نشط"],
                ["low_stock", "مخزون منخفض"],
                ["out_of_stock", "نفد المخزون"],
              ]}
            />

            {categories.length > 0 && (
              <FilterSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={[
                  ["all", "كل التصنيفات"],
                  ...categories.map((category) => [
                    category.id,
                    category.name_ar,
                  ]),
                ]}
              />
            )}

            <FilterSelect
              value={`${sortField}|${sortOrder}`}
              onChange={(value) => {
                const [field, order] =
                  value.split("|");

                setSortField(
                  field as SortField
                );

                setSortOrder(
                  order as SortOrder
                );
              }}
              options={[
                ["updated_at|desc", "الأحدث أولاً"],
                ["updated_at|asc", "الأقدم أولاً"],
                ["name_ar|asc", "الاسم أ - ي"],
                ["name_ar|desc", "الاسم ي - أ"],
                ["price|asc", "السعر: الأقل"],
                ["price|desc", "السعر: الأعلى"],
                ["stock|asc", "المخزون: الأقل"],
                ["stock|desc", "المخزون: الأعلى"],
              ]}
            />

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-gray-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" />
                مسح
              </button>
            )}
          </div>

          {/* Mobile filters */}
          {showFilters && (
            <div className="mt-3 space-y-2 border-t border-[#0B1E3D]/5 pt-3 sm:hidden">
              <FilterSelect
                full
                value={statusFilter}
                onChange={(value) =>
                  setStatusFilter(
                    value as StatusFilter
                  )
                }
                options={[
                  ["all", "كل الحالات"],
                  ["active", "نشط"],
                  ["inactive", "غير نشط"],
                  ["low_stock", "مخزون منخفض"],
                  ["out_of_stock", "نفد المخزون"],
                ]}
              />

              {categories.length > 0 && (
                <FilterSelect
                  full
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={[
                    ["all", "كل التصنيفات"],
                    ...categories.map((category) => [
                      category.id,
                      category.name_ar,
                    ]),
                  ]}
                />
              )}

              <FilterSelect
                full
                value={`${sortField}|${sortOrder}`}
                onChange={(value) => {
                  const [field, order] =
                    value.split("|");

                  setSortField(
                    field as SortField
                  );

                  setSortOrder(
                    order as SortOrder
                  );
                }}
                options={[
                  ["updated_at|desc", "الأحدث أولاً"],
                  ["updated_at|asc", "الأقدم أولاً"],
                  ["name_ar|asc", "الاسم أ - ي"],
                  ["name_ar|desc", "الاسم ي - أ"],
                  ["price|asc", "السعر: الأقل"],
                  ["price|desc", "السعر: الأعلى"],
                  ["stock|asc", "المخزون: الأقل"],
                  ["stock|desc", "المخزون: الأعلى"],
                ]}
              />

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-xs font-bold text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                  مسح جميع الفلاتر
                </button>
              )}
            </div>
          )}
        </section>

        {/* =================================================
            RESULTS HEADER
        ================================================= */}

        {!loading && (
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-xs font-medium text-gray-500">
                المنتجات
              </p>

              <p className="mt-0.5 text-sm font-extrabold text-[#0B1E3D]">
                {products.length > 0
                  ? `${formatNumber(
                      products.length
                    )} منتج`
                  : "لا توجد نتائج"}
              </p>
            </div>

            {hasFilters && (
              <span className="rounded-full bg-[#F5F0E8] px-3 py-1 text-[10px] font-bold text-[#0B1E3D]">
                نتائج مفلترة
              </span>
            )}
          </div>
        )}

        {/* =================================================
            CONTENT
        ================================================= */}

        {loading ? (
          <>
            <div className="grid gap-3 lg:hidden">
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <SkeletonProduct
                    key={index}
                  />
                )
              )}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-[#0B1E3D]/5 bg-white lg:block">
              <div className="space-y-4 p-6">
                {Array.from({ length: 5 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-14 animate-pulse rounded-xl bg-[#0B1E3D]/5"
                    />
                  )
                )}
              </div>
            </div>
          </>
        ) : products.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            clearFilters={clearFilters}
          />
        ) : (
          <>
            {/* =================================================
                MOBILE
            ================================================= */}

            <div className="grid gap-3 lg:hidden">
              {products.map((product) => (
                <MobileProductCard
                  key={product.id}
                  product={product}
                  onDeleteClick={
                    setDeleteModalProduct
                  }
                  onToggleStatus={
                    handleToggleStatus
                  }
                  isToggling={isToggling}
                />
              ))}
            </div>

            {/* =================================================
                DESKTOP TABLE
            ================================================= */}

            <div className="hidden overflow-hidden rounded-2xl border border-[#0B1E3D]/5 bg-white shadow-[0_3px_16px_rgba(11,30,61,0.04)] lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead>
                    <tr className="border-b border-[#0B1E3D]/5 bg-[#FAFAF8]">
                      <TableHead>
                        الصورة
                      </TableHead>

                      <TableHead
                        sortable
                        active={
                          sortField === "name_ar"
                        }
                        order={sortOrder}
                        onClick={() =>
                          handleSort("name_ar")
                        }
                      >
                        الاسم
                      </TableHead>

                      <TableHead>
                        التصنيف
                      </TableHead>

                      <TableHead
                        sortable
                        active={
                          sortField === "price"
                        }
                        order={sortOrder}
                        onClick={() =>
                          handleSort("price")
                        }
                      >
                        السعر
                      </TableHead>

                      <TableHead
                        sortable
                        active={
                          sortField === "stock"
                        }
                        order={sortOrder}
                        onClick={() =>
                          handleSort("stock")
                        }
                      >
                        المخزون
                      </TableHead>

                      <TableHead>
                        الحالة
                      </TableHead>

                      <TableHead
                        sortable
                        active={
                          sortField === "updated_at"
                        }
                        order={sortOrder}
                        onClick={() =>
                          handleSort("updated_at")
                        }
                      >
                        التحديث
                      </TableHead>

                      <TableHead>
                        الإجراءات
                      </TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#0B1E3D]/5">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="group transition-colors hover:bg-[#FAFAF8]"
                      >
                        <td className="px-4 py-4">
                          <ProductImage
                            src={
                              product.images?.[0] ||
                              null
                            }
                            alt={
                              product.name_ar
                            }
                            size="sm"
                          />
                        </td>

                        <td className="max-w-[240px] px-4 py-4">
                          <p
                            className="truncate font-bold text-[#0B1E3D]"
                            dir="rtl"
                          >
                            {product.name_ar}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex max-w-[150px] items-center gap-1.5 truncate text-xs text-gray-600">
                            <Tag className="h-3.5 w-3.5 shrink-0 text-[#C9A24B]" />

                            <span className="truncate">
                              {product.category
                                ?.name_ar ||
                                "بدون تصنيف"}
                            </span>
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-extrabold text-[#0B1E3D]">
                          {formatPrice(
                            product.price
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`font-extrabold ${
                              product.stock === 0
                                ? "text-red-600"
                                : product.stock <= 5
                                ? "text-orange-600"
                                : "text-[#0B1E3D]"
                            }`}
                          >
                            {formatNumber(
                              product.stock
                            )}
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

                        <td className="whitespace-nowrap px-4 py-4 text-xs text-gray-500">
                          {formatDate(
                            product.updated_at
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#0B1E3D] transition hover:bg-[#0B1E3D]/5 hover:text-[#C9A24B]"
                              title="تعديل"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>

                            <button
                              type="button"
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
                              className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                                product.is_active
                                  ? "text-orange-600 hover:bg-orange-50"
                                  : "text-green-600 hover:bg-green-50"
                              } disabled:opacity-50`}
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
                              type="button"
                              onClick={() =>
                                setDeleteModalProduct(
                                  product
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      <DeleteModal
        product={deleteModalProduct}
        onClose={() =>
          setDeleteModalProduct(null)
        }
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </main>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  value,
  onChange,
  options,
  full = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[][];
  full?: boolean;
}) {
  return (
    <div
      className={`relative ${
        full ? "w-full" : ""
      }`}
    >
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className={`h-11 appearance-none rounded-xl border border-[#0B1E3D]/10 bg-white pr-3 pl-9 text-xs font-bold text-[#0B1E3D] outline-none transition focus:border-[#C9A24B] focus:ring-4 focus:ring-[#C9A24B]/10 ${
          full
            ? "w-full"
            : "min-w-[145px]"
        }`}
        dir="rtl"
      >
        {options.map(([optionValue, label]) => (
          <option
            key={optionValue}
            value={optionValue}
          >
            {label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

/* =========================================================
   TABLE HEAD
========================================================= */

function TableHead({
  children,
  sortable = false,
  active = false,
  order = "desc",
  onClick,
}: {
  children: React.ReactNode;
  sortable?: boolean;
  active?: boolean;
  order?: SortOrder;
  onClick?: () => void;
}) {
  return (
    <th className="px-4 py-3.5 text-right">
      <button
        type="button"
        onClick={onClick}
        disabled={!sortable}
        className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold transition ${
          sortable
            ? "cursor-pointer hover:text-[#C9A24B]"
            : "cursor-default"
        } ${
          active
            ? "text-[#0B1E3D]"
            : "text-gray-500"
        }`}
      >
        {children}

        {sortable && (
          <ArrowUpDown
            className={`h-3 w-3 ${
              active && order === "asc"
                ? "rotate-180"
                : ""
            }`}
          />
        )}
      </button>
    </th>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen bg-[#FAFAF8] px-4 py-5"
          dir="rtl"
        >
          <div className="mx-auto max-w-7xl space-y-5">
            <div className="h-28 animate-pulse rounded-2xl bg-white" />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map(
                (_, index) => (
                  <SkeletonKPI key={index} />
                )
              )}
            </div>

            <div className="h-24 animate-pulse rounded-2xl bg-white" />

            <div className="grid gap-3">
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <SkeletonProduct
                    key={index}
                  />
                )
              )}
            </div>
          </div>
        </div>
      }
    >
      <AdminProductsContent />
    </Suspense>
  );
}
