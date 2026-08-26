import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { Package, ShoppingCart, DollarSign } from "lucide-react";
import SalesChart from "@/components/admin/SalesChart";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  const totalRevenue =
    orders
      ?.filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

  // بناء بيانات آخر 7 أيام للرسم البياني
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const chartData = last7Days.map((day) => {
    const dayTotal =
      orders
        ?.filter((o) => o.created_at?.slice(0, 10) === day && o.status !== "cancelled")
        .reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
    return {
      date: day.slice(5), // MM-DD
      المبيعات: dayTotal,
    };
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-rafik-navy">
          لوحة التحكم
        </h1>
        <a href="/admin/products" className="btn-outline">
          إدارة المنتجات
        </a>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#0B1E3D]/10 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-rafik-navy" />
          </div>
          <div>
            <p className="text-sm text-rafik-navy/60">إجمالي الطلبات</p>
            <p className="mt-1 text-2xl font-bold text-rafik-navy">
              {orders?.length ?? 0}
            </p>
          </div>
        </div>

        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#0B1E3D]/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-rafik-navy" />
          </div>
          <div>
            <p className="text-sm text-rafik-navy/60">المنتجات</p>
            <p className="mt-1 text-2xl font-bold text-rafik-navy">
              {productCount ?? 0}
            </p>
          </div>
        </div>

        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#C9A24B]/15 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-[#C9A24B]" />
          </div>
          <div>
            <p className="text-sm text-rafik-navy/60">إجمالي المبيعات</p>
            <p className="mt-1 text-2xl font-bold text-rafik-navy">
              {formatPrice(totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* الرسم البياني */}
      <div className="card p-6 mb-10">
        <h2 className="mb-4 font-semibold text-rafik-navy">
          المبيعات خلال آخر 7 أيام
        </h2>
        <SalesChart data={chartData} />
      </div>

      {/* آخر الطلبات */}
      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-rafik-navy">آخر الطلبات</h2>
        {!orders || orders.length === 0 ? (
          <p className="text-sm text-rafik-navy/50 text-center py-8">
            لا توجد طلبات حتى الآن
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-rafik-navy/10 text-rafik-navy/60">
                  <th className="py-2 px-2">رقم الطلب</th>
                  <th className="py-2 px-2">العميل</th>
                  <th className="py-2 px-2">الحالة</th>
                  <th className="py-2 px-2">المجموع</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="border-b border-rafik-navy/5">
                    <td className="py-2 px-2">{order.id.slice(0, 8)}</td>
                    <td className="py-2 px-2">{order.customer_name ?? "-"}</td>
                    <td className="py-2 px-2">{order.status}</td>
                    <td className="py-2 px-2">{formatPrice(order.total)}</td>
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
