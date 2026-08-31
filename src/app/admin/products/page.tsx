"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  useRef,
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
  ChevronDown,
  ArrowUpDown,
  RefreshCw,
  Box,
  Tag,
  ShoppingBag,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name_ar: string;
  name_en: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  images: string[] | null;
  category_id: string | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
  category: {
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

const supabase = createClient();

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#0B1E3D]/5 p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-[#0B1E3D]/5 rounded-lg shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-[#0B1E3D]/5 rounded w-3/4" />
          <div className="h-3 bg-[#0B1E3D]/5 rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-3 bg-[#0B1E3D]/5 rounded w-16" />
            <div className="h-3 bg-[#0B1E3D]/5 rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonKPI() {
  return (
    <div className="bg-white rounded-xl border border-[#0B1E3D]/5 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-10 w-10 bg-[#0B1E3D]/5 rounded-lg" />
      </div>
      <div className="h-7 w-16 bg-[#0B1E3D]/5 rounded mb-2" />
      <div className="h-3 w-20 bg-[#0B1E3D]/5 rounded" />
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-4 px-4">
        <div className="h-12 w-12 bg-[#0B1E3D]/5 rounded-lg" />
      </td>
      <td className="py-4 px-4">
        <div className="h-4 bg-[#0B1E3D]/5 rounded w-32" />
      </td>
      <td className="py-4 px-4">
        <div className="h-4 bg-[#0B1E3D]/5 rounded w-20" />
      </td>
      <td className="py-4 px-4">
        <div className="h-4 bg-[#0B1E3D]/5 rounded w-20" />
      </td>
      <td className="py-4 px-4">
        <div className="h-4 bg-[#0B1E3D]/5 rounded w-12" />
      </td>
      <td className="py-4 px-4">
        <div className="h-6 bg-[#0B1E3D]/5 rounded w-20" />
      </td>
      <td className="py-4 px-4">
        <div className="h-4 bg-[#0B1E3D]/5 rounded w-20" />
      </td>
      <td className="py-4 px-4">
        <div className="h-8 bg-[#0B1E3D]/5 rounded w-20" />
      </td>
    </tr>
  );
}

function StatusBadge({
  stock,
  isActive,
}: {
  stock: number;
  isActive: boolean;
}) {
  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
        <XCircle className="w-3 h-3" />
        غير نشط
      </span>
    );
  }

  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
        <XCircle className="w-3 h-3" />
        نفد المخزون
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
        <AlertTriangle className="w-3 h-3" />
        مخزون منخفض
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
      <CheckCircle2 className="w-3 h-3" />
      نشط
    </span>
  );
}

function ProductImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  if (src) {
    return (
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#F5F0E8] shrink-0">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-lg bg-[#F5F0E8] flex items-center justify-center shrink-0">
      <Box className="w-5 h-5 text-[#C9A24B]/60" />
    </div>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={isDeleting ? undefined : onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-[#0B1E3D]/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#0B1E3D]">
              حذف المنتج
            </h3>

            <p className="text-sm text-gray-500">
              هذا الإجراء لا يمكن التراجع عنه
            </p>
          </div>
        </div>

        <p className="text-[#0B1E3D] mb-6 leading-relaxed">
          هل أنت متأكد من حذف المنتج{" "}
          <span className="font-bold">
            "{product.name_ar}"
          </span>
          ؟

          <br />

          <span className="text-sm text-gray-500">
            سيتم حذف المنتج نهائياً من قاعدة البيانات.
          </span>
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#0B1E3D]/10 text-[#0B1E3D] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>

          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}

            {isDeleting ? "جارٍ الحذف..." : "حذف نهائي"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div className="bg-white rounded-xl border border-[#0B1E3D]/5 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <Icon
            className="w-5 h-5"
            style={{ color }}
          />
        </div>
      </div>

      <p className="text-2xl font-bold text-[#0B1E3D] mb-1">
        {value.toLocaleString("ar-SA")}
      </p>

      <p className="text-sm text-gray-500">
        {label}
      </p>
    </div>
  );
}

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
    <div className="bg-white rounded-xl border border-[#0B1E3D]/5 p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3 mb-3">
        <ProductImage
          src={product.images?.[0] || null}
          alt={product.name_ar}
        />

        <div className="flex-1 min-w-0">
          <h3
            className="font-bold text-[#0B1E3D] text-sm leading-tight truncate"
            dir="rtl"
          >
            {product.name_ar}
          </h3>

          <p className="text-xs text-gray-400 mt-0.5">
            {product.category?.name_ar || "بدون تصنيف"}
          </p>
        </div>

        <StatusBadge
          stock={product.stock}
          isActive={product.is_active}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="bg-[#F5F0E8]/50 rounded-lg p-2">
          <p className="text-[10px] text-gray-400 mb-0.5">
            السعر
          </p>
          <p className="text-sm font-bold text-[#0B1E3D]">
            {formatPrice(product.price)}
          </p>
        </div>

        <div className="bg-[#F5F0E8]/50 rounded-lg p-2">
          <p className="text-[10px] text-gray-400 mb-0.5">
            المخزون
          </p>

          <p
            className={`text-sm font-bold ${
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

        <div className="bg-[#F5F0E8]/50 rounded-lg p-2">
          <p className="text-[10px] text-gray-400 mb-0.5">
            التحديث
          </p>

          <p className="text-sm font-bold text-[#0B1E3D]">
            {new Date(product.updated_at).toLocaleDateString(
              "ar-SA",
              {
                month: "short",
                day: "numeric",
              }
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/admin/products/${product.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1E3D] text-white text-xs font-medium hover:bg-[#0B1E3D]/90 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
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
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
            product.is_active
              ? "border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100"
              : "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
          } disabled:opacity-50`}
        >
          {isToggling === product.id ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : product.is_active ? (
            <XCircle className="w-3.5 h-3.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}

          {product.is_active ? "تعطيل" : "تفعيل"}
        </button>

        <button
          onClick={() => onDeleteClick(product)}
          className="flex items-center justify-center px-3 py-2 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          aria-label={`حذف ${product.name_ar}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

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

  const [searchInput, setSearchInput] =
    useState(searchParams.get("q") || "");

  const [searchQuery, setSearchQuery] =
    useState(searchParams.get("q") || "");

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

  const requestIdRef = useRef(0);

  // Debounced search
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput);
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const [
        categoriesResult,
        productsResult,
        allProductsResult,
      ] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name_ar")
          .order("name_ar", {
            ascending: true,
          }),

        (() => {
          let query = supabase
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
            const value =
              searchQuery
                .trim()
                .replace(/[%_]/g, (char) => `\\${char}`)
                .replace(/,/g, "\\,");

            query = query.or(
              `name_ar.ilike.%${value}%,name_en.ilike.%${value}%`
            );
          }

          return query.order(sortField, {
            ascending: sortOrder === "asc",
          });
        })(),

        supabase
          .from("products")
          .select("stock, is_active"),
      ]);

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (categoriesResult.error) {
        throw new Error(
          `categories: ${categoriesResult.error.message}`
        );
      }

      if (productsResult.error) {
        throw new Error(
          `products: ${productsResult.error.message}`
        );
      }

      if (allProductsResult.error) {
        throw new Error(
          `kpi: ${allProductsResult.error.message}`
        );
      }

      setCategories(
        categoriesResult.data || []
      );

      const rawProducts =
        productsResult.data || [];

      const transformed: Product[] =
        rawProducts.map((product) => {
          const categoryValue =
            product.category;

          let category: {
            name_ar: string;
          } | null = null;

          if (
            Array.isArray(categoryValue)
          ) {
            category =
              categoryValue[0] || null;
          } else if (
            categoryValue &&
            typeof categoryValue === "object"
          ) {
            category = categoryValue as {
              name_ar: string;
            };
          }

          return {
            id: product.id,
            name_ar: product.name_ar,
            name_en: product.name_en,
            price: Number(product.price) || 0,
            stock: Number(product.stock) || 0,
            is_active: Boolean(
              product.is_active
            ),
            images: product.images,
            category_id:
              product.category_id,
            slug: product.slug,
            created_at:
              product.created_at,
            updated_at:
              product.updated_at,
            category,
          };
        });

      setProducts(transformed);

      const allProducts =
        allProductsResult.data || [];

      setKpi({
        total: allProducts.length,

        active: allProducts.filter(
          (product) =>
            product.is_active
        ).length,

        inactive: allProducts.filter(
          (product) =>
            !product.is_active
        ).length,

        lowStock: allProducts.filter(
          (product) =>
            product.is_active &&
            product.stock > 0 &&
            product.stock <= 5
        ).length,

        outOfStock: allProducts.filter(
          (product) =>
            product.is_active &&
            product.stock === 0
        ).length,
      });
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error(
        "Admin products fetch error:",
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : "Unknown error";

      setError(
        `تعذر تحميل المنتجات. ${message}`
      );
    } finally {
      if (
        requestId === requestIdRef.current
      ) {
        setLoading(false);
      }
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

  useEffect(() => {
    const params =
      new URLSearchParams();

    if (searchInput.trim()) {
      params.set(
        "q",
        searchInput.trim()
      );
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

    const query =
      params.toString();

    window.history.replaceState(
      null,
      "",
      query
        ? `/admin/products?${query}`
        : "/admin/products"
    );
  }, [
    searchInput,
    statusFilter,
    categoryFilter,
    sortField,
    sortOrder,
  ]);

  const handleDelete = async () => {
    if (!deleteModalProduct) {
      return;
    }

    setIsDeleting(true);

    try {
      const { error } =
        await supabase
          .from("products")
          .delete()
          .eq(
            "id",
            deleteModalProduct.id
          );

      if (error) {
        throw error;
      }

      setProducts((previous) =>
        previous.filter(
          (product) =>
            product.id !==
            deleteModalProduct.id
        )
      );

      setKpi((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          total: Math.max(
            0,
            previous.total - 1
          ),
          active:
            deleteModalProduct.is_active
              ? Math.max(
                  0,
                  previous.active - 1
                )
              : previous.active,
          inactive:
            !deleteModalProduct.is_active
              ? Math.max(
                  0,
                  previous.inactive - 1
                )
              : previous.inactive,
          lowStock:
            deleteModalProduct.is_active &&
            deleteModalProduct.stock > 0 &&
            deleteModalProduct.stock <= 5
              ? Math.max(
                  0,
                  previous.lowStock - 1
                )
              : previous.lowStock,
          outOfStock:
            deleteModalProduct.is_active &&
            deleteModalProduct.stock === 0
              ? Math.max(
                  0,
                  previous.outOfStock - 1
                )
              : previous.outOfStock,
        };
      });

      setDeleteModalProduct(null);
    } catch (err) {
      console.error(
        "Delete product error:",
        err
      );

      alert(
        err instanceof Error
          ? `فشل حذف المنتج: ${err.message}`
          : "فشل حذف المنتج."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (
    id: string,
    currentStatus: boolean
  ) => {
    setIsToggling(id);

    try {
      const newStatus =
        !currentStatus;

      const { error } =
        await supabase
          .from("products")
          .update({
            is_active: newStatus,
          })
          .eq("id", id);

      if (error) {
        throw error;
      }

      setProducts((previous) =>
        previous.map((product) =>
          product.id === id
            ? {
                ...product,
                is_active:
                  newStatus,
              }
            : product
        )
      );

      setKpi((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          active: newStatus
            ? previous.active + 1
            : Math.max(
                0,
                previous.active - 1
              ),
          inactive: newStatus
            ? Math.max(
                0,
                previous.inactive - 1
              )
            : previous.inactive,
        };
      });
    } catch (err) {
      console.error(
        "Toggle product status error:",
        err
      );

      alert(
        err instanceof Error
          ? `فشل تغيير الحالة: ${err.message}`
          : "فشل تغيير الحالة."
      );
    } finally {
      setIsToggling(null);
    }
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortField("updated_at");
    setSortOrder("desc");
  };

  const hasFilters = useMemo(
    () =>
      Boolean(
        searchInput.trim() ||
          statusFilter !== "all" ||
          categoryFilter !== "all"
      ),
    [
      searchInput,
      statusFilter,
      categoryFilter,
    ]
  );

  const handleSort = (
    field: SortField
  ) => {
    if (sortField === field) {
      setSortOrder((previous) =>
        previous === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  if (error) {
    return (
      <div
        className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4"
        dir="rtl"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-xl font-bold text-[#0B1E3D] mb-2">
          تعذر تحميل المنتجات
        </h2>

        <p className="text-gray-500 mb-6 max-w-lg break-words">
          {error}
        </p>

        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1E3D] text-white font-medium hover:bg-[#0B1E3D]/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#FAFAF8]"
      dir="rtl"
    >
      <div className="bg-white border-b border-[#0B1E3D]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1E3D] tracking-tight">
                إدارة المنتجات
              </h1>

              <p className="text-gray-500 mt-1 text-sm">
                إدارة مخزونك، تتبع المنتجات،
                وتحديث الأسعار بكل سهولة
              </p>
            </div>

            <Link
              href="/admin/products/new"
              className="inline-flex items-center justify-center gap-2 bg-[#C9A24B] hover:bg-[#D4B05F] text-[#0B1E3D] font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] shrink-0"
            >
              <Plus className="w-5 h-5" />
              إضافة منتج
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <SkeletonKPI
                key={index}
              />
            ))}
          </div>
        ) : kpi ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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

        <div className="bg-white rounded-xl border border-[#0B1E3D]/5 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="text"
                placeholder="ابحث باسم المنتج..."
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
                className="w-full pr-10 pl-10 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-sm text-[#0B1E3D] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] transition-all bg-[#FAFAF8]"
                dir="rtl"
              />

              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="مسح البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() =>
                setShowFilters(
                  (previous) =>
                    !previous
                )
              }
              className="sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-[#0B1E3D] text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              الفلاتر

              {hasFilters && (
                <span className="w-2 h-2 rounded-full bg-[#C9A24B]" />
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value as StatusFilter
                    )
                  }
                  className="appearance-none pl-8 pr-3 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-sm text-[#0B1E3D] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] cursor-pointer min-w-[130px]"
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

                <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {categories.length > 0 && (
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(
                        event.target.value
                      )
                    }
                    className="appearance-none pl-8 pr-3 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-sm text-[#0B1E3D] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] cursor-pointer min-w-[130px]"
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

                  <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}

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
                  className="appearance-none pl-8 pr-3 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-sm text-[#0B1E3D] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] cursor-pointer min-w-[140px]"
                >
                  <option value="updated_at-desc">
                    الأحدث أولاً
                  </option>

                  <option value="updated_at-asc">
                    الأقدم أولاً
                  </option>

                  <option value="name_ar-asc">
                    الاسم أ-ي
                  </option>

                  <option value="name_ar-desc">
                    الاسم ي-أ
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

                <ArrowUpDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                >
                  <X className="w-3.5 h-3.5" />
                  مسح
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="sm:hidden mt-3 pt-3 border-t border-[#0B1E3D]/5 space-y-3">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value as StatusFilter
                    )
                  }
                  className="w-full appearance-none pl-8 pr-3 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-sm text-[#0B1E3D] bg-white"
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

                <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {categories.length > 0 && (
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(
                        event.target.value
                      )
                    }
                    className="w-full appearance-none pl-8 pr-3 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-sm text-[#0B1E3D] bg-white"
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

                  <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}

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
                  className="w-full appearance-none pl-8 pr-3 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-sm text-[#0B1E3D] bg-white"
                >
                  <option value="updated_at-desc">
                    الأحدث أولاً
                  </option>

                  <option value="updated_at-asc">
                    الأقدم أولاً
                  </option>

                  <option value="name_ar-asc">
                    الاسم أ-ي
                  </option>

                  <option value="name_ar-desc">
                    الاسم ي-أ
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

                <ArrowUpDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm text-red-600 bg-red-50 border border-red-100"
                >
                  <X className="w-3.5 h-3.5" />
                  مسح جميع الفلاتر
                </button>
              )}
            </div>
          )}
        </div>

        {!loading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {products.length > 0 ? (
                <>
                  <span className="font-bold text-[#0B1E3D]">
                    {products.length}
                  </span>{" "}
                  منتج
                  {hasFilters &&
                    " (نتائج البحث)"}
                </>
              ) : (
                "لا توجد نتائج"
              )}
            </p>
          </div>
        )}

        {loading ? (
          <>
            <div className="lg:hidden space-y-3">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <SkeletonCard
                  key={index}
                />
              ))}
            </div>

            <div className="hidden lg:block bg-white rounded-xl border border-[#0B1E3D]/5 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#0B1E3D]/5 bg-[#FAFAF8]">
                    {[
                      "الصورة",
                      "الاسم",
                      "التصنيف",
                      "السعر",
                      "المخزون",
                      "الحالة",
                      "التحديث",
                      "الإجراءات",
                    ].map((title) => (
                      <th
                        key={title}
                        className="py-3 px-4 text-right text-xs font-semibold text-gray-500"
                      >
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {Array.from({
                    length: 5,
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
          <div className="bg-white rounded-xl border border-[#0B1E3D]/5 py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F5F0E8] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-[#C9A24B]" />
            </div>

            <h3 className="text-lg font-bold text-[#0B1E3D] mb-2">
              {hasFilters
                ? "لا توجد نتائج مطابقة"
                : "لا توجد منتجات حتى الآن"}
            </h3>

            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              {hasFilters
                ? "جرب تعديل معايير البحث أو مسح الفلاتر للعثور على ما تبحث عنه"
                : "ابدأ بإضافة منتجك الأول لإدارة مخزونك وعرضه في المتجر"}
            </p>

            {hasFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1E3D] text-white font-medium hover:bg-[#0B1E3D]/90 transition-colors"
              >
                <X className="w-4 h-4" />
                مسح الفلاتر
              </button>
            ) : (
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A24B] hover:bg-[#D4B05F] text-[#0B1E3D] font-bold transition-colors"
              >
                <Plus className="w-4 h-4" />
                إضافة أول منتج
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="lg:hidden space-y-3">
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

            <div className="hidden lg:block bg-white rounded-xl border border-[#0B1E3D]/5 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#0B1E3D]/5 bg-[#FAFAF8]">
                      <th className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500">
                        الصورة
                      </th>

                      <th
                        className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500 cursor-pointer select-none"
                        onClick={() =>
                          handleSort(
                            "name_ar"
                          )
                        }
                      >
                        <span className="inline-flex items-center gap-1">
                          الاسم

                          {sortField ===
                            "name_ar" && (
                            <ArrowUpDown
                              className={`w-3 h-3 ${
                                sortOrder ===
                                "asc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                        </span>
                      </th>

                      <th className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500">
                        التصنيف
                      </th>

                      <th
                        className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500 cursor-pointer select-none"
                        onClick={() =>
                          handleSort(
                            "price"
                          )
                        }
                      >
                        <span className="inline-flex items-center gap-1">
                          السعر

                          {sortField ===
                            "price" && (
                            <ArrowUpDown
                              className={`w-3 h-3 ${
                                sortOrder ===
                                "asc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                        </span>
                      </th>

                      <th
                        className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500 cursor-pointer select-none"
                        onClick={() =>
                          handleSort(
                            "stock"
                          )
                        }
                      >
                        <span className="inline-flex items-center gap-1">
                          المخزون

                          {sortField ===
                            "stock" && (
                            <ArrowUpDown
                              className={`w-3 h-3 ${
                                sortOrder ===
                                "asc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                        </span>
                      </th>

                      <th className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500">
                        الحالة
                      </th>

                      <th
                        className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500 cursor-pointer select-none"
                        onClick={() =>
                          handleSort(
                            "updated_at"
                          )
                        }
                      >
                        <span className="inline-flex items-center gap-1">
                          التحديث

                          {sortField ===
                            "updated_at" && (
                            <ArrowUpDown
                              className={`w-3 h-3 ${
                                sortOrder ===
                                "asc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          )}
                        </span>
                      </th>

                      <th className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#0B1E3D]/5">
                    {products.map(
                      (product) => (
                        <tr
                          key={product.id}
                          className="group hover:bg-[#F5F0E8]/30 transition-colors"
                        >
                          <td className="py-4 px-4">
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

                          <td className="py-4 px-4">
                            <div
                              className="font-medium text-[#0B1E3D]"
                              dir="rtl"
                            >
                              {
                                product.name_ar
                              }
                            </div>

                            {product.name_en && (
                              <div
                                className="text-xs text-gray-400 mt-0.5"
                                dir="ltr"
                              >
                                {
                                  product.name_en
                                }
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                              <Tag className="w-3 h-3 text-[#C9A24B]" />

                              {product
                                .category
                                ?.name_ar ||
                                "—"}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-semibold text-[#0B1E3D]">
                              {formatPrice(
                                product.price
                              )}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className={`font-semibold ${
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

                          <td className="py-4 px-4">
                            <StatusBadge
                              stock={
                                product.stock
                              }
                              isActive={
                                product.is_active
                              }
                            />
                          </td>

                          <td className="py-4 px-4 text-xs text-gray-500">
                            {new Date(
                              product.updated_at
                            ).toLocaleDateString(
                              "ar-SA",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link
                                href={`/admin/products/${product.id}`}
                                className="p-1.5 rounded-lg text-[#0B1E3D] hover:bg-[#0B1E3D]/5 hover:text-[#C9A24B] transition-colors"
                                title="تعديل"
                              >
                                <Pencil className="w-4 h-4" />
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
                                className={`p-1.5 rounded-lg transition-colors ${
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
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : product.is_active ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                              </button>

                              <button
                                onClick={() =>
                                  setDeleteModalProduct(
                                    product
                                  )
                                }
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
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
      </div>

      <DeleteModal
        product={
          deleteModalProduct
        }
        onClose={() =>
          setDeleteModalProduct(null)
        }
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAF8] p-4">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="h-20 bg-white rounded-xl border border-[#0B1E3D]/5 animate-pulse" />

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({
                length: 5,
              }).map((_, index) => (
                <SkeletonKPI
                  key={index}
                />
              ))}
            </div>

            <div className="h-16 bg-white rounded-xl border border-[#0B1E3D]/5 animate-pulse" />

            <div className="space-y-3">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <SkeletonCard
                  key={index}
                />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <AdminProductsContent />
    </Suspense>
  );
}
