import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import ReviewsSection from "@/components/product/ReviewsSection";
import type { Product } from "@/types/database";

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .maybeSingle();

  const product = data as Product | null;

  if (!product) {
    notFound();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-rafik-cream text-rafik-ink">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <ProductDetailClient product={product} />
        <ReviewsSection productId={product.id} />
      </div>
    </main>
  );
}
