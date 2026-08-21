import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold text-rafik-navy">
          غير مصرح لك بالوصول لهاد الصفحة
        </h1>
      </div>
    );
  }

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-rafik-navy">
          لوحة التحكم
        </h1>

        <a href="/admin/products" className="btn-outline">
          إدارة المنتجات
        </a>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="card p-6">
          <p className="text-sm text-rafik-navy/60">
            إجمالي الطلبات
          </p>
          <p className="mt-1 text-2xl font-bold text-rafik-navy">
            {orders?.length ?? 0}
          </p>
        </div>

        <div className="card p-6">
          <p className="text-sm text-rafik-navy/60">
            المنتجات
          </p>
          <p className="mt-1 text-2xl font-bold text-rafik-navy">
            {productCount ?? 0}
          </p>
        </div>

        <div className="card p-6">
          <p className="text-sm text-rafik-navy/60">
            إجمالي المبيعات
          </p>
          <p className="mt-1 text-2xl font-bold text-rafik-navy">
            {formatPrice(totalRevenue)}
          </p>
        </div>
      </div>

      <h2 className="mb-4 font-display text-xl font-bold text-rafik-navy">
        آخر الطلبات
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rafik-navy/10 text-start text-rafik-navy/60">
              <th className="py-2 text-start">رقم الطلب</th>
              <th className="py-2 text-start">العميل</th>
              <th className="py-2 text-start">الحالة</th>
              <th className="py-2 text-start">المجموع</th>
            </tr>
          </thead>

          <tbody>
            {orders?.map((o) => (
              <tr
                key={o.id}
                className="border-b border-rafik-navy/5"
              >
                <td className="py-3 font-semibold text-rafik-navy">
                  {o.order_number}
                </td>

                <td className="py-3">
                  {o.customer_name}
                </td>

                <td className="py-3">
                  {o.status}
                </td>

                <td className="py-3">
                  {formatPrice(o.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-rafik-navy/40">
        باش تدير حساب admin بدل role ديال profile ف Supabase table editor لـ "admin".
      </p>
    </div>
  );
}
