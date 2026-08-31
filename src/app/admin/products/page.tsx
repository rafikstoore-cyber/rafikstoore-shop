"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Eye,
  Trash2,
  Filter,
  X,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ChevronDown,
  ArrowUpDown,
  RefreshCw,
  Box,
  Tag,
  DollarSign,
  Layers,
  ShoppingBag,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────
interface Product {
  id: string;
  name_ar: string;
  name_en?: string;
  price: number;
  stock: number;
  is_active: boolean;
  images: string[] | null;
  category_id?: string | null;
  category?: { name_ar: string } | null;
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

type SortField = "name_ar" | "price" | "stock" | "created_at" | "updated_at";
type SortOrder = "asc" | "desc";
type StatusFilter = "all" | "active" | "inactive" | "low_stock" | "out_of_stock";

// ─── Colors ─────────────────────────────────────────────
const COLORS = {
  navy: "#0B1E3D",
  gold: "#C9A24B",
  goldLight: "#D4B05F",
  cream: "#F5F0E8",
  white: "#FFFFFF",
  red: "#DC2626",
  redLight: "#FEF2F2",
  green: "#16A34A",
  greenLight: "#F0FDF4",
  orange: "#EA580C",
  orangeLight: "#FFF7ED",
  gray: "#6B7280",
  grayLight: "#F3F4F6",
};

// ─── Skeleton Components ───────────────────────────────
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
        <div className="h-8 w-8 bg-[#0B1E3D]/5 rounded-lg" />
        <div className="h-4 w-12 bg-[#0B1E3D]/5 rounded" />
      </div>
      <div className="h-7 w-16 bg-[#0B1E3D]/5 rounded mb-2" />
      <div className="h-3 w-20 bg-[#0B1E3D]/5 rounded" />
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-4 px-4"><div className="h-12 w-12 bg-[#0B1E3D]/5 rounded-lg" /></td>
      <td className="py-4 px-4"><div className="h-4 bg-[#0B1E3D]/5 rounded w-32" /></td>
      <td className="py-4 px-4"><div className="h-4 bg-[#0B1E3D]/5 rounded w-20" /></td>
      <td className="py-4 px-4"><div className="h-4 bg-[#0B1E3D]/5 rounded w-16" /></td>
      <td className="py-4 px-4"><div className="h-4 bg-[#0B1E3D]/5 rounded w-12" /></td>
      <td className="py-4 px-4"><div className="h-6 bg-[#0B1E3D]/5 rounded w-16" /></td>
      <td className="py-4 px-4"><div className="h-4 bg-[#0B1E3D]/5 rounded w-20" /></td>
      <td className="py-4 px-4"><div className="h-8 bg-[#0B1E3D]/5 rounded w-20" /></td>
    </tr>
  );
}

// ─── Status Badge ──────────────────────────────────────
function StatusBadge({ stock, isActive }: { stock: number; isActive: boolean }) {
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

// ─── Delete Confirmation Modal ─────────────────────────
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-[#0B1E3D]/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0B1E3D]">حذف المنتج</h3>
            <p className="text-sm text-gray-500">هذا الإجراء لا يمكن التراجع عنه</p>
          </div>
        </div>
        <p className="text-[#0B1E3D] mb-6 leading-relaxed">
          هل أنت متأكد من حذف المنتج <span className="font-bold">"{product.name_ar}"</span>؟
          <br />
          <span className="text-sm text-gray-500">سيتم حذف المنتج نهائياً من قاعدة البيانات.</span>
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

// ─── Product Image ─────────────────────────────────────
function ProductImage({ src, alt }: { src: string | null; alt: string }) {
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

// ─── Mobile Product Card ───────────────────────────────
function MobileProductCard({
  product,
  onDeleteClick,
  onToggleStatus,
  isToggling,
}: {
  product: Product;
  onDeleteClick: (p: Product) => void;
  onToggleStatus: (id: string, current: boolean) => void;
  isToggling: string | null;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#0B1E3D]/5 p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3 mb-3">
        <ProductImage src={product.images?.[0] || null} alt={product.name_ar} />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#0B1E3D] text-sm leading-tight truncate" dir="rtl">
            {product.name_ar}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {product.category?.name_ar || "بدون تصنيف"}
          </p>
        </div>
        <StatusBadge stock={product.stock} isActive={product.is_active} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="bg-[#F5F0E8]/50 rounded-lg p-2">
          <p className="text-[10px] text-gray-400 mb-0.5">السعر</p>
          <p className="text-sm font-bold text-[#0B1E3D]">{formatPrice(product.price)}</p>
        </div>
        <div className="bg-[#F5F0E8]/50 rounded-lg p-2">
          <p className="text-[10px] text-gray-400 mb-0.5">المخزون</p>
          <p className={`text-sm font-bold ${product.stock === 0 ? "text-red-600" : product.stock <= 5 ? "text-orange-600" : "text-[#0B1E3D]"}`}>
            {product.stock}
          </p>
        </div>
        <div className="bg-[#F5F0E8]/50 rounded-lg p-2">
          <p className="text-[10px] text-gray-400 mb-0.5">التحديث</p>
          <p className="text-sm font-bold text-[#0B1E3D]">
            {new Date(product.updated_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
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
          onClick={() => onToggleStatus(product.id, product.is_active)}
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
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────
function KPICard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
  borderColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#0B1E3D]/5 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-[#0B1E3D] mb-1">{value.toLocaleString("ar-SA")}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

// ─── Main Content Component ────────────────────────────
function AdminProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // ── State ────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get("status") as StatusFilter) || "all"
  );
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all");
  const [sortField, setSortField] = useState<SortField>(
    (searchParams.get("sort") as SortField) || "updated_at"
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get("order") as SortOrder) || "desc"
  );

  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ── Fetch Data ───────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories
      const { data: catsData } = await supabase
        .from("categories")
        .select("id, name_ar")
        .order("name_ar", { ascending: true });
      setCategories(catsData || []);

      // Build query
      let query = supabase
        .from("products")
        .select(`
          id, name_ar, name_en, price, stock, is_active, images, category_id, slug, created_at, updated_at,
          category:categories(name_ar)
        `);

      // Apply category filter
      if (categoryFilter !== "all") {
        query = query.eq("category_id", categoryFilter);
      }

      // Apply status filter
      if (statusFilter === "active") {
        query = query.eq("is_active", true);
      } else if (statusFilter === "inactive") {
        query = query.eq("is_active", false);
      } else if (statusFilter === "low_stock") {
        query = query.eq("is_active", true).gt("stock", 0).lte("stock", 5);
      } else if (statusFilter === "out_of_stock") {
        query = query.eq("is_active", true).eq("stock", 0);
      }

      // Apply search
      if (searchQuery.trim()) {
        query = query.or(`name_ar.ilike.%${searchQuery.trim()}%,name_en.ilike.%${searchQuery.trim()}%`);
      }

      // Apply sort
      query = query.order(sortField, { ascending: sortOrder === "asc" });

      const { data: productsData, error: productsError } = await query;

      if (productsError) throw productsError;

      // Transform data
      const transformed: Product[] = (productsData || []).map((p: any) => ({
        ...p,
        category: p.category || null,
      }));

      setProducts(transformed);

      // Calculate KPIs (from all products, not filtered)
      const { data: allProducts } = await supabase
        .from("products")
        .select("stock, is_active");

      if (allProducts) {
        const kpis: KPIData = {
          total: allProducts.length,
          active: allProducts.filter((p) => p.is_active).length,
          inactive: allProducts.filter((p) => !p.is_active).length,
          lowStock: allProducts.filter((p) => p.is_active && p.stock > 0 && p.stock <= 5).length,
          outOfStock: allProducts.filter((p) => p.is_active && p.stock === 0).length,
        };
        setKpi(kpis);
      }
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError("تعذر تحميل المنتجات. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, [supabase, searchQuery, statusFilter, categoryFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Update URL ───────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (sortField !== "updated_at") params.set("sort", sortField);
    if (sortOrder !== "desc") params.set("order", sortOrder);

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    window.history.replaceState(null, "", `/admin/products${newUrl}`);
  }, [searchQuery, statusFilter, categoryFilter, sortField, sortOrder]);

  // ── Actions ──────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteModalProduct) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", deleteModalProduct.id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== deleteModalProduct.id));
      setDeleteModalProduct(null);
      // Refresh KPIs
      fetchData();
    } catch (err: any) {
      alert("فشل حذف المنتج: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setIsToggling(id);
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      if (error) throw error;
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p))
      );
    } catch (err: any) {
      alert("فشل تغيير الحالة: " + err.message);
    } finally {
      setIsToggling(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortField("updated_at");
    setSortOrder("desc");
  };

  const hasFilters = searchQuery || statusFilter !== "all" || categoryFilter !== "all";

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // ── Render ───────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-[#0B1E3D] mb-2">تعذر تحميل المنتجات</h2>
        <p className="text-gray-500 mb-6 max-w-sm">{error}</p>
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
    <div className="min-h-screen bg-[#FAFAF8]" dir="rtl">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="bg-white border-b border-[#0B1E3D]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1E3D] tracking-tight">
                إدارة المنتجات
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                إدارة مخزونك، تتبع المنتجات، وتحديث الأسعار بكل سهولة
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
        {/* ── KPI Section ─────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonKPI key={i} />
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
              borderColor="#0B1E3D10"
            />
            <KPICard
              icon={CheckCircle2}
              label="المنتجات النشطة"
              value={kpi.active}
              color="#16A34A"
              bgColor="#16A34A10"
              borderColor="#16A34A20"
            />
            <KPICard
              icon={XCircle}
              label="غير النشطة"
              value={kpi.inactive}
              color="#6B7280"
              bgColor="#6B728010"
              borderColor="#6B728020"
            />
            <KPICard
              icon={AlertTriangle}
              label="مخزون منخفض"
              value={kpi.lowStock}
              color="#EA580C"
              bgColor="#EA580C10"
              borderColor="#EA580C20"
            />
            <KPICard
              icon={XCircle}
              label="نفد المخزون"
              value={kpi.outOfStock}
              color="#DC2626"
              bgColor="#DC262610"
              borderColor="#DC262620"
            />
          </div>
        ) : null}

        {/* ── Search & Filters Toolbar ────────────────── */}
        <div className="bg-white rounded-xl border border-[#0B1E3D]/5 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث باسم المنتج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-sm text-[#0B1E3D] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] transition-all bg-[#FAFAF8]"
                dir="rtl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-[#0B1E3D] text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              الفلاتر
              {hasFilters && (
                <span className="w-2 h-2 rounded-full bg-[#C9A24B]" />
              )}
            </button>

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="appearance-none pl-8 pr-3 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-sm text-[#0B1E3D] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] cursor-pointer min-w-[130px]"
                >
                  <option value="all">كل الحالات</option>
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                  <option value="low_stock">مخزون منخفض</option>
                  <option value="out_of_stock">نفد المخزون</option>
                </select>
                <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="appearance-none pl-8 pr-3 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-sm text-[#0B1E3D] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] cursor-pointer min-w-[130px]"
                  >
                    <option value="all">كل التصنيفات</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name_ar}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}

              {/* Sort */}
              <div className="relative">
                <select
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortField(field as SortField);
                    setSortOrder(order as SortOrder);
                  }}
                  className="appearance-none pl-8 pr-3 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-sm text-[#0B1E3D] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] cursor-pointer min-w-[140px]"
                >
                  <option value="updated_at-desc">الأحدث أولاً</option>
                  <option value="updated_at-asc">الأقدم أولاً</option>
                  <option value="name_ar-asc">الاسم أ-ي</option>
                  <option value="name_ar-desc">الاسم ي-أ</option>
                  <option value="price-asc">السعر: الأقل</option>
                  <option value="price-desc">السعر: الأعلى</option>
                  <option value="stock-asc">المخزون: الأقل</option>
                  <option value="stock-desc">المخزون: الأعلى</option>
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

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="sm:hidden mt-3 pt-3 border-t border-[#0B1E3D]/5 space-y-3">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full appearance-none pl-8 pr-3 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-sm text-[#0B1E3D] bg-white"
                >
                  <option value="all">كل الحالات</option>
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                  <option value="low_stock">مخزون منخفض</option>
                  <option value="out_of_stock">نفد المخزون</option>
                </select>
                <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {categories.length > 0 && (
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full appearance-none pl-8 pr-3 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-sm text-[#0B1E3D] bg-white"
                  >
                    <option value="all">كل التصنيفات</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name_ar}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}

              <div className="relative">
                <select
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortField(field as SortField);
                    setSortOrder(order as SortOrder);
                  }}
                  className="w-full appearance-none pl-8 pr-3 py-2.5 rounded-lg border border-[#0B1E3D]/10 text-sm text-[#0B1E3D] bg-white"
                >
                  <option value="updated_at-desc">الأحدث أولاً</option>
                  <option value="updated_at-asc">الأقدم أولاً</option>
                  <option value="name_ar-asc">الاسم أ-ي</option>
                  <option value="name_ar-desc">الاسم ي-أ</option>
                  <option value="price-asc">السعر: الأقل</option>
                  <option value="price-desc">السعر: الأعلى</option>
                  <option value="stock-asc">المخزون: الأقل</option>
                  <option value="stock-desc">المخزون: الأعلى</option>
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

        {/* ── Results Count ────────────────────────────── */}
        {!loading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {products.length > 0 ? (
                <>
                  <span className="font-bold text-[#0B1E3D]">{products.length}</span> منتج
                  {hasFilters && " (نتائج البحث)"}
                </>
              ) : (
                "لا توجد نتائج"
              )}
            </p>
          </div>
        )}

        {/* ── Loading State ────────────────────────────── */}
        {loading ? (
          <>
            {/* Mobile Skeleton */}
            <div className="lg:hidden space-y-3">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            {/* Desktop Skeleton */}
            <div className="hidden lg:block bg-white rounded-xl border border-[#0B1E3D]/5 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#0B1E3D]/5 bg-[#FAFAF8]">
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500">الصورة</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500">الاسم</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500">التصنيف</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500">السعر</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500">المخزون</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500">الحالة</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500">التحديث</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <SkeletonTableRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : products.length === 0 ? (
          /* ── Empty State ───────────────────────────── */
          <div className="bg-white rounded-xl border border-[#0B1E3D]/5 py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F5F0E8] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-[#C9A24B]" />
            </div>
            <h3 className="text-lg font-bold text-[#0B1E3D] mb-2">
              {hasFilters ? "لا توجد نتائج مطابقة" : "لا توجد منتجات حتى الآن"}
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
            {/* ── Mobile Cards ───────────────────────── */}
            <div className="lg:hidden space-y-3">
              {products.map((product) => (
                <MobileProductCard
                  key={product.id}
                  product={product}
                  onDeleteClick={setDeleteModalProduct}
                  onToggleStatus={handleToggleStatus}
                  isToggling={isToggling}
                />
              ))}
            </div>

            {/* ── Desktop Table ──────────────────────── */}
            <div className="hidden lg:block bg-white rounded-xl border border-[#0B1E3D]/5 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#0B1E3D]/5 bg-[#FAFAF8]">
                      <th className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        الصورة
                      </th>
                      <th
                        className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-[#0B1E3D] transition-colors select-none"
                        onClick={() => handleSort("name_ar")}
                      >
                        <span className="inline-flex items-center gap-1">
                          الاسم
                          {sortField === "name_ar" && (
                            <ArrowUpDown className={`w-3 h-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                          )}
                        </span>
                      </th>
                      <th className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        التصنيف
                      </th>
                      <th
                        className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-[#0B1E3D] transition-colors select-none"
                        onClick={() => handleSort("price")}
                      >
                        <span className="inline-flex items-center gap-1">
                          السعر
                          {sortField === "price" && (
                            <ArrowUpDown className={`w-3 h-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                          )}
                        </span>
                      </th>
                      <th
                        className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-[#0B1E3D] transition-colors select-none"
                        onClick={() => handleSort("stock")}
                      >
                        <span className="inline-flex items-center gap-1">
                          المخزون
                          {sortField === "stock" && (
                            <ArrowUpDown className={`w-3 h-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                          )}
                        </span>
                      </th>
                      <th className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        الحالة
                      </th>
                      <th
                        className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-[#0B1E3D] transition-colors select-none"
                        onClick={() => handleSort("updated_at")}
                      >
                        <span className="inline-flex items-center gap-1">
                          التحديث
                          {sortField === "updated_at" && (
                            <ArrowUpDown className={`w-3 h-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                          )}
                        </span>
                      </th>
                      <th className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0B1E3D]/5">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="group hover:bg-[#F5F0E8]/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <ProductImage src={product.images?.[0] || null} alt={product.name_ar} />
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-[#0B1E3D]" dir="rtl">
                            {product.name_ar}
                          </div>
                          {product.name_en && (
                            <div className="text-xs text-gray-400 mt-0.5" dir="ltr">
                              {product.name_en}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                            <Tag className="w-3 h-3 text-[#C9A24B]" />
                            {product.category?.name_ar || "—"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-[#0B1E3D]">{formatPrice(product.price)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`font-semibold ${
                              product.stock === 0
                                ? "text-red-600"
                                : product.stock <= 5
                                ? "text-orange-600"
                                : "text-[#0B1E3D]"
                            }`}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge stock={product.stock} isActive={product.is_active} />
                        </td>
                        <td className="py-4 px-4 text-xs text-gray-500">
                          {new Date(product.updated_at).toLocaleDateString("ar-SA", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
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
                              onClick={() => handleToggleStatus(product.id, product.is_active)}
                              disabled={isToggling === product.id}
                              className={`p-1.5 rounded-lg transition-colors ${
                                product.is_active
                                  ? "text-orange-600 hover:bg-orange-50"
                                  : "text-green-600 hover:bg-green-50"
                              } disabled:opacity-50`}
                              title={product.is_active ? "تعطيل" : "تفعيل"}
                            >
                              {isToggling === product.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : product.is_active ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteModalProduct(product)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
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
          </>
        )}
      </div>

      {/* ── Delete Modal ─────────────────────────────── */}
      <DeleteModal
        product={deleteModalProduct}
        onClose={() => setDeleteModalProduct(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

// ─── Page Export ───────────────────────────────────────
export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAF8] p-4">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="h-20 bg-white rounded-xl border border-[#0B1E3D]/5 animate-pulse" />
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {[...Array(5)].map((_, i) => (
                <SkeletonKPI key={i} />
              ))}
            </div>
            <div className="h-16 bg-white rounded-xl border border-[#0B1E3D]/5 animate-pulse" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
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
