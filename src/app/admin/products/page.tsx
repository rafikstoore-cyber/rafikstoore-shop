"use client";

import {
  useState,
  useEffect,
  useCallback,
  Suspense,
  useMemo,
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Supabase
// ─────────────────────────────────────────────

const supabase = createClient();

// ─────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────

function SkeletonKPI() {
  return (
    <div className="rounded-2xl border border-[#0B1E3D]/5 bg-white p-4 shadow-sm animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-[#0B1E3D]/5" />
      <div className="mt-4 h-7 w-16 rounded-lg bg-[#0B1E3D]/5" />
      <div className="mt-2 h-3 w-24 rounded-lg bg-[#0B1E3D]/5" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[#0B1E3D]/5 bg-white p-4 shadow-sm animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 rounded-2xl bg-[#0B1E3D]/5" />

        <div className="min-w-0 flex-1">
          <div className="h-4 w-3/4 rounded-lg bg-[#0B1E3D]/5" />
          <div className="mt-2 h-3 w-1/2 rounded-lg bg-[#0B1E3D]/5" />
        </div>

        <div className="h-6 w-16 rounded-full bg-[#0B1E3D]/5" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="h-14 rounded-xl bg-[#0B1E3D]/5" />
        <div className="h-14 rounded-xl bg-[#0B1E3D]/5" />
      </div>

      <div className="mt-2 h-10 rounded-xl bg-[#0B1E3D]/5" />
      <div className="mt-3 h-11 rounded-xl bg-[#0B1E3D]/5" />
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 8 }).map((_, index) => (
        <td key={index} className="px-4 py-4">
          <div
            className={`h-4 rounded-lg bg-[#0B1E3D]/5 ${
              index === 0
                ? "w-12 h-12 rounded-xl"
                : index === 1
                ? "w-32"
                : index === 2
                ? "w-20"
                : index === 5
                ? "w-20 h-6 rounded-full"
                : "w-16"
            }`}
          />
        </td>
      ))}
    </tr>
  );
}

// ─────────────────────────────────────────────
// Product Image
// ─────────────────────────────────────────────

function ProductImage({
  src,
  alt,
  large = false,
}: {
  src: string | null;
  alt: string;
  large?: boolean;
}) {
  const sizeClass = large
    ? "h-16 w-16 rounded-2xl"
    : "h-12 w-12 rounded-xl";

  if (!src) {
    return (
      <div
        className={`${sizeClass} flex shrink-0 items-center justify-center bg-[#F5F0E8]`}
      >
        <Box
          className={
            large
              ? "h-6 w-6 text-[#C9A24B]"
              : "h-5 w-5 text-[#C9A24B]"
          }
        />
      </div>
    );
  }

  return (
    <div
      className={`relative ${sizeClass} shrink-0 overflow-hidden bg-[#F5F0E8]`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={large ? "64px" : "48px"}
        className="object-cover"
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────

function StatusBadge({
  stock,
  isActive,
}: {
  stock: number;
  isActive: boolean;
}) {
  if (!isActive) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-600">
        <XCircle className="h-3.5 w-3.5" />
        غير نشط
      </span>
    );
  }

  if (stock === 0) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        نفد المخزون
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        مخزون منخفض
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      نشط
    </span>
  );
}

// ─────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────

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
    <div className="rounded-2xl border border-[#0B1E3D]/5 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: bgColor }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>

      <div className="mt-4">
        <p className="text-2xl font-black tracking-tight text-[#0B1E3D]">
          {value.toLocaleString("ar-SA")}
        </p>

        <p className="mt-1 text-[11px] font-medium leading-5 text-gray-500 sm:text-sm">
          {label}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Delete Modal
// ─────────────────────────────────────────────

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
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={isDeleting ? undefined : onClose}
      />

      <div
        dir="rtl"
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>

            <div className="min-w-0">
              <h3 className="text-lg font-black text-[#0B1E3D]">
                حذف المنتج
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FAFAF8] p-4">
            <p className="text-sm leading-7 text-[#0B1E3D]">
              هل أنت متأكد من حذف:
            </p>

            <p className="mt-1 break-words text-sm font-black text-[#0B1E3D]">
              {product.name_ar}
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
              {isDeleting && (
                <RefreshCw className="h-4 w-4 animate-spin" />
              )}

              {isDeleting ? "جارٍ الحذف..." : "حذف المنتج"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Mobile Product Card
// ─────────────────────────────────────────────

function MobileProductCard({
  product,
  categoryName,
  onDelete,
  onToggle,
  isToggling,
}: {
  product: Product;
  categoryName: string;
  onDelete: () => void;
  onToggle: () => void;
  isToggling: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#0B1E3D]/5 bg-white shadow-sm">
      <div className="p-4">
        {/* Product heading */}
        <div className="flex items-start gap-3">
          <ProductImage
            src={product.images?.[0] || null}
            alt={product.name_ar}
            large
          />

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[15px] font-black leading-6 text-[#0B1E3D]">
              {product.name_ar}
            </h3>

            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
              <Tag className="h-3.5 w-3.5 shrink-0 text-[#C9A24B]" />

              <span className="truncate">
                {categoryName || "بدون تصنيف"}
              </span>
            </div>

            <div className="mt-2.5">
              <StatusBadge
                stock={product.stock}
                isActive={product.is_active}
              />
            </div>
          </div>
        </div>

        {/* Product stats */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#FAFAF8] px-3 py-3">
            <p className="text-[10px] font-medium text-gray-400">
              السعر
            </p>

            <p className="mt-1 text-sm font-black text-[#0B1E3D]">
              {formatPrice(product.price)}
            </p>
          </div>

          <div className="rounded-2xl bg-[#FAFAF8] px-3 py-3">
            <p className="text-[10px] font-medium text-gray-400">
              المخزون
            </p>

            <p
              className={`mt-1 text-sm font-black ${
                product.stock === 0
                  ? "text-red-600"
                  : product.stock <= 5
                  ? "text-orange-600"
                  : "text-[#0B1E3D]"
              }`}
            >
              {product.stock}
            </p>
          </div>
        </div>

        {/* Updated date */}
        <div className="mt-2 flex items-center justify-between rounded-2xl bg-[#FAFAF8] px-3 py-3">
          <span className="text-[10px] font-medium text-gray-400">
            آخر تحديث
          </span>

          <span className="text-xs font-bold text-[#0B1E3D]">
            {new Date(
              product.updated_at
            ).toLocaleDateString("ar-MA", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
          <Link
            href={`/admin/products/${product.id}`}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B1E3D] px-3 text-xs font-black text-white transition hover:bg-[#132b54]"
          >
            <Pencil className="h-4 w-4" />
            تعديل المنتج
          </Link>

          <button
            type="button"
            onClick={onToggle}
            disabled={isToggling}
            aria-label={
              product.is_active
                ? "تعطيل المنتج"
                : "تفعيل المنتج"
            }
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition disabled:opacity-50 ${
              product.is_active
                ? "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
                : "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
            }`}
          >
            {isToggling ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : product.is_active ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onDelete}
            aria-label="حذف المنتج"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

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
    useState<StatusFilter>(
      (searchParams.get("status") as StatusFilter) || "all"
    );

  const [categoryFilter, setCategoryFilter] =
    useState(searchParams.get("category") || "all");

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

  // ─────────────────────────────────────────────
  // Category map
  // ─────────────────────────────────────────────

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();

    for (const category of categories) {
      map.set(category.id, category.name_ar);
    }

    return map;
  }, [categories]);

  // ─────────────────────────────────────────────
  // Fetch
  // ─────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Categories
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

      // Products
      let query = supabase
        .from("products")
        .select(
          "id, name_ar, price, stock, is_active, images, category_id, slug, created_at, updated_at"
        );

      // Category filter
      if (categoryFilter !== "all") {
        query = query.eq(
          "category_id",
          categoryFilter
        );
      }

      // Status filter
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

      // Search
      const search = searchQuery.trim();

      if (search) {
        query = query.ilike(
          "name_ar",
          `%${search}%`
        );
      }

      // Sort
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
        (productsData || []).map((product: any) => ({
          id: product.id,
          name_ar: product.name_ar,
          price: Number(product.price || 0),
          stock: Number(product.stock || 0),
          is_active: Boolean(product.is_active),
          images: Array.isArray(product.images)
            ? product.images
            : null,
          category_id:
            product.category_id || null,
          category: null,
          slug: product.slug,
          created_at: product.created_at,
          updated_at: product.updated_at,
        }));

      setProducts(transformed);

      // KPI
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

      const rows = allProducts || [];

      setKpi({
        total: rows.length,

        active: rows.filter(
          (p) => p.is_active
        ).length,

        inactive: rows.filter(
          (p) => !p.is_active
        ).length,

        lowStock: rows.filter(
          (p) =>
            p.is_active &&
            p.stock > 0 &&
            p.stock <= 5
        ).length,

        outOfStock: rows.filter(
          (p) =>
            p.is_active &&
            p.stock === 0
        ).length,
      });
    } catch (err) {
      console.error(
        "ADMIN PRODUCTS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "تعذر تحميل المنتجات."
      );
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    statusFilter,
    categoryFilter,
    sortField,
    sortOrder,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─────────────────────────────────────────────
  // URL
  // ─────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.set("q", searchQuery);
    }

    if (statusFilter !== "all") {
      params.set(
        "status",
        statusFilter
      );
    }

    if (categoryFilter !== "all") {
      params.set(
        "category",
        categoryFilter
      );
    }

    if (sortField !== "updated_at") {
      params.set(
        "sort",
        sortField
      );
    }

    if (sortOrder !== "desc") {
      params.set(
        "order",
        sortOrder
      );
    }

    const value = params.toString();

    window.history.replaceState(
      null,
      "",
      value
        ? `/admin/products?${value}`
        : "/admin/products"
    );
  }, [
    searchQuery,
    statusFilter,
    categoryFilter,
    sortField,
    sortOrder,
  ]);

  // ─────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────

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
        throw new Error(
          `DELETE ERROR: ${deleteError.message}`
        );
      }

      setProducts((current) =>
        current.filter(
          (product) =>
            product.id !==
            deleteModalProduct.id
        )
      );

      setDeleteModalProduct(null);

      await fetchData();
    } catch (err) {
      console.error(
        "Delete product error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "فشل حذف المنتج."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ─────────────────────────────────────────────
  // Toggle
  // ─────────────────────────────────────────────

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
        throw new Error(
          `STATUS ERROR: ${updateError.message}`
        );
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === id
            ? {
                ...product,
                is_active:
                  !currentStatus,
              }
            : product
        )
      );

      await fetchData();
    } catch (err) {
      console.error(
        "Toggle status error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "فشل تغيير حالة المنتج."
      );
    } finally {
      setIsToggling(null);
    }
  };

  // ─────────────────────────────────────────────
  // Filters
  // ─────────────────────────────────────────────

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

  const handleSort = (
    field: SortField
  ) => {
    if (sortField === field) {
      setSortOrder((current) =>
        current === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // ─────────────────────────────────────────────
  // Error
  // ─────────────────────────────────────────────

  if (error) {
    return (
      <main
        dir="rtl"
        className="min-h-[70vh] bg-[#FAFAF8] px-4 py-8"
      >
        <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center">
          <div className="w-full rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>

            <h2 className="mt-5 text-xl font-black text-[#0B1E3D]">
              تعذر تحميل المنتجات
            </h2>

            <div
              dir="ltr"
              className="mt-5 rounded-2xl bg-red-50 p-4 text-left text-xs leading-6 text-red-700"
            >
              {error}
            </div>

            <button
              type="button"
              onClick={fetchData}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B1E3D] px-5 text-sm font-bold text-white"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#FAFAF8]"
    >
      {/* PAGE HEADER */}
      <header className="border-b border-[#0B1E3D]/5 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1E3D]">
                  <Package className="h-5 w-5 text-[#C9A24B]" />
                </div>

                <div>
                  <h1 className="text-xl font-black tracking-tight text-[#0B1E3D] sm:text-3xl">
                    إدارة المنتجات
                  </h1>

                  <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                    إدارة المخزون والأسعار وحالة المنتجات
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/admin/products/new"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#C9A24B] px-5 text-sm font-black text-[#0B1E3D] shadow-sm transition hover:bg-[#D4B05F] sm:w-auto"
            >
              <Plus className="h-5 w-5" />
              إضافة منتج
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
        {/* KPI */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map(
              (_, index) => (
                <SkeletonKPI key={index} />
              )
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <KPICard
              icon={Package}
              label="إجمالي المنتجات"
              value={kpi?.total ?? 0}
              color="#0B1E3D"
              bgColor="#0B1E3D0A"
            />

            <KPICard
              icon={CheckCircle2}
              label="المنتجات النشطة"
              value={kpi?.active ?? 0}
              color="#16A34A"
              bgColor="#16A34A0D"
            />

            <KPICard
              icon={XCircle}
              label="غير النشطة"
              value={kpi?.inactive ?? 0}
              color="#6B7280"
              bgColor="#6B72800D"
            />

            <KPICard
              icon={AlertTriangle}
              label="مخزون منخفض"
              value={kpi?.lowStock ?? 0}
              color="#EA580C"
              bgColor="#EA580C0D"
            />

            <KPICard
              icon={XCircle}
              label="نفد المخزون"
              value={kpi?.outOfStock ?? 0}
              color="#DC2626"
              bgColor="#DC26260D"
            />
          </div>
        )}

        {/* SEARCH + FILTERS */}
        <section className="rounded-2xl border border-[#0B1E3D]/5 bg-white p-3 shadow-sm sm:p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="ابحث عن اسم المنتج..."
              className="h-12 w-full rounded-xl border border-[#0B1E3D]/10 bg-[#FAFAF8] pr-10 pl-10 text-sm font-medium text-[#0B1E3D] outline-none transition placeholder:text-gray-400 focus:border-[#C9A24B] focus:bg-white focus:ring-2 focus:ring-[#C9A24B]/20"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() =>
                  setSearchQuery("")
                }
                aria-label="مسح البحث"
                className="absolute left-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={() =>
              setShowFilters(
                (current) => !current
              )
            }
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#0B1E3D]/10 bg-white text-sm font-bold text-[#0B1E3D] transition hover:bg-gray-50 sm:hidden"
          >
            <Filter className="h-4 w-4" />

            <span>الفلاتر والفرز</span>

            {hasFilters && (
              <span className="h-2 w-2 rounded-full bg-[#C9A24B]" />
            )}

            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showFilters
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          {/* Filter panel */}
          <div
            className={`mt-3 grid gap-2 border-t border-[#0B1E3D]/5 pt-3 ${
              showFilters
                ? "grid"
                : "hidden sm:grid"
            } sm:grid-cols-4`}
          >
            {/* Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as StatusFilter
                  )
                }
                className="h-11 w-full appearance-none rounded-xl border border-[#0B1E3D]/10 bg-white px-3 pl-9 text-sm font-medium text-[#0B1E3D] outline-none focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20"
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

              <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Category */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value
                  )
                }
                className="h-11 w-full appearance-none rounded-xl border border-[#0B1E3D]/10 bg-white px-3 pl-9 text-sm font-medium text-[#0B1E3D] outline-none focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20"
              >
                <option value="all">
                  كل التصنيفات
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name_ar}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(event) => {
                  const [
                    field,
                    order,
                  ] =
                    event.target.value.split(
                      "-"
                    );

                  setSortField(
                    field as SortField
                  );

                  setSortOrder(
                    order as SortOrder
                  );
                }}
                className="h-11 w-full appearance-none rounded-xl border border-[#0B1E3D]/10 bg-white px-3 pl-9 text-sm font-medium text-[#0B1E3D] outline-none focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20"
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

              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Clear */}
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="h-11 rounded-xl border border-[#0B1E3D]/10 bg-white px-4 text-sm font-bold text-gray-500 transition hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <X className="h-4 w-4" />
                مسح الفلاتر
              </span>
            </button>
          </div>
        </section>

        {/* RESULTS */}
        {!loading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-black text-[#0B1E3D]">
                {products.length}
              </span>{" "}
              منتج
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold text-[#C9A24B] hover:underline"
              >
                إزالة الفلاتر
              </button>
            )}
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <>
            <div className="space-y-3 lg:hidden">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <SkeletonCard
                  key={index}
                />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-[#0B1E3D]/5 bg-white lg:block">
              <table className="w-full">
                <tbody>
                  {Array.from({
                    length: 6,
                  }).map((_, index) => (
                    <SkeletonTableRow
                      key={index}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : products.length === 0 ? (
          /* EMPTY */
          <div className="rounded-3xl border border-[#0B1E3D]/5 bg-white px-5 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F0E8]">
              <ShoppingBag className="h-8 w-8 text-[#C9A24B]" />
            </div>

            <h3 className="mt-5 text-lg font-black text-[#0B1E3D]">
              {hasFilters
                ? "لا توجد نتائج مطابقة"
                : "لا توجد منتجات حتى الآن"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              {hasFilters
                ? "جرب تغيير معايير البحث أو إزالة الفلاتر."
                : "ابدأ بإضافة أول منتج إلى متجرك."}
            </p>

            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B1E3D] px-5 text-sm font-bold text-white"
              >
                <X className="h-4 w-4" />
                مسح الفلاتر
              </button>
            ) : (
              <Link
                href="/admin/products/new"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#C9A24B] px-5 text-sm font-black text-[#0B1E3D]"
              >
                <Plus className="h-4 w-4" />
                إضافة أول منتج
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* MOBILE CARDS */}
            <div className="space-y-3 lg:hidden">
              {products.map((product) => (
                <MobileProductCard
                  key={product.id}
                  product={product}
                  categoryName={
                    product.category_id
                      ? categoryMap.get(
                          product.category_id
                        ) || ""
                      : ""
                  }
                  isToggling={
                    isToggling === product.id
                  }
                  onToggle={() =>
                    handleToggleStatus(
                      product.id,
                      product.is_active
                    )
                  }
                  onDelete={() =>
                    setDeleteModalProduct(
                      product
                    )
                  }
                />
              ))}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden overflow-hidden rounded-2xl border border-[#0B1E3D]/5 bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#0B1E3D]/5 bg-[#FAFAF8]">
                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-500">
                        الصورة
                      </th>

                      <th
                        onClick={() =>
                          handleSort("name_ar")
                        }
                        className="cursor-pointer px-4 py-4 text-right text-xs font-bold text-gray-500 transition hover:text-[#0B1E3D]"
                      >
                        <span className="inline-flex items-center gap-1">
                          الاسم
                          {sortField ===
                            "name_ar" && (
                            <ArrowUpDown className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </th>

                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-500">
                        التصنيف
                      </th>

                      <th
                        onClick={() =>
                          handleSort("price")
                        }
                        className="cursor-pointer px-4 py-4 text-right text-xs font-bold text-gray-500 transition hover:text-[#0B1E3D]"
                      >
                        <span className="inline-flex items-center gap-1">
                          السعر
                          {sortField ===
                            "price" && (
                            <ArrowUpDown className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </th>

                      <th
                        onClick={() =>
                          handleSort("stock")
                        }
                        className="cursor-pointer px-4 py-4 text-right text-xs font-bold text-gray-500 transition hover:text-[#0B1E3D]"
                      >
                        <span className="inline-flex items-center gap-1">
                          المخزون
                          {sortField ===
                            "stock" && (
                            <ArrowUpDown className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </th>

                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-500">
                        الحالة
                      </th>

                      <th
                        onClick={() =>
                          handleSort("updated_at")
                        }
                        className="cursor-pointer px-4 py-4 text-right text-xs font-bold text-gray-500 transition hover:text-[#0B1E3D]"
                      >
                        <span className="inline-flex items-center gap-1">
                          التحديث
                          {sortField ===
                            "updated_at" && (
                            <ArrowUpDown className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </th>

                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-500">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#0B1E3D]/5">
                    {products.map(
                      (product) => {
                        const categoryName =
                          product.category_id
                            ? categoryMap.get(
                                product.category_id
                              ) ||
                              "بدون تصنيف"
                            : "بدون تصنيف";

                        return (
                          <tr
                            key={product.id}
                            className="group transition hover:bg-[#FAFAF8]"
                          >
                            <td className="px-4 py-4">
                              <ProductImage
                                src={
                                  product
                                    .images?.[0] ||
                                  null
                                }
                                alt={
                                  product.name_ar
                                }
                              />
                            </td>

                            <td className="px-4 py-4">
                              <div className="font-bold text-[#0B1E3D]">
                                {
                                  product.name_ar
                                }
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                                <Tag className="h-3.5 w-3.5 text-[#C9A24B]" />
                                {
                                  categoryName
                                }
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span className="font-bold text-[#0B1E3D]">
                                {formatPrice(
                                  product.price
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`font-bold ${
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

                            <td className="px-4 py-4 text-xs text-gray-500">
                              {new Date(
                                product.updated_at
                              ).toLocaleDateString(
                                "ar-MA",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1 opacity-60 transition group-hover:opacity-100">
                                <Link
                                  href={`/admin/products/${product.id}`}
                                  title="تعديل المنتج"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[#0B1E3D] transition hover:bg-[#0B1E3D]/5 hover:text-[#C9A24B]"
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
                                  title={
                                    product.is_active
                                      ? "تعطيل"
                                      : "تفعيل"
                                  }
                                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition disabled:opacity-50 ${
                                    product.is_active
                                      ? "text-orange-600 hover:bg-orange-50"
                                      : "text-green-600 hover:bg-green-50"
                                  }`}
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
                                  title="حذف المنتج"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <DeleteModal
        product={deleteModalProduct}
        onClose={() =>
          !isDeleting &&
          setDeleteModalProduct(null)
        }
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </main>
  );
}

// ─────────────────────────────────────────────
// Page Export
// ─────────────────────────────────────────────

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div
          dir="rtl"
          className="min-h-screen bg-[#FAFAF8] px-4 py-5"
        >
          <div className="mx-auto max-w-7xl space-y-5">
            <div className="h-28 animate-pulse rounded-2xl bg-white" />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map(
                (_, index) => (
                  <SkeletonKPI
                    key={index}
                  />
                )
              )}
            </div>

            <div className="h-28 animate-pulse rounded-2xl bg-white" />

            <div className="space-y-3 lg:hidden">
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <SkeletonCard
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
