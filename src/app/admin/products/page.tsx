import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name_ar, price, stock, is_active, images")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-rafik-navy">
          المنتجات
        </h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-[#C9A24B] hover:bg-[#D4B05F] text-[#0B1E3D] font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة منتج
        </Link>
      </div>

      <div className="card p-6">
        {!products || products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-rafik-navy/50 mb-4">لا توجد منتجات حتى الآن</p>
            <Link
              href="/admin/products/new"
              className="inline-block bg-[#C9A24B] hover:bg-[#D4B05F] text-[#0B1E3D] font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              أضف أول منتج
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-rafik-navy/10 text-rafik-navy/60">
                  <th className="py-3 px-2">الصورة</th>
                  <th className="py-3 px-2">الاسم</th>
                  <th className="py-3 px-2">السعر</th>
                  <th className="py-3 px-2">المخزون</th>
                  <th className="py-3 px-2">الحالة</th>
                  <th className="py-3 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-rafik-navy/5">
                    <td className="py-3 px-2">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name_ar}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-rafik-navy/5 rounded-lg" />
                      )}
                    </td>
                    <td className="py-3 px-2 font-medium text-rafik-navy">
                      {product.name_ar}
                    </td>
                    <td className="py-3 px-2">{formatPrice(product.price)}</td>
                    <td className="py-3 px-2">{product.stock}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          product.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {product.is_active ? "مفعّل" : "غير مفعّل"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-left">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-rafik-navy/60 hover:text-[#C9A24B]"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
