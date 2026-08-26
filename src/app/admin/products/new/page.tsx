import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name_ar")
    .order("name_ar");

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-rafik-navy mb-8">
        إضافة منتج جديد
      </h1>
      <ProductForm categories={categories ?? []} />
    </div>
  );
}
