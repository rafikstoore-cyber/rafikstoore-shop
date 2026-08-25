import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "يجب تسجيل الدخول لإضافة تقييم" },
      { status: 401 }
    );
  }

  const { product_id, rating, comment } = await req.json();

  if (!product_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "بيانات التقييم غير صحيحة" },
      { status: 400 }
    );
  }

  // تأكد بلي الزبون شرى المنتج فعلا واستلمو (verified purchase)
  const { data: purchaseCheck } = await supabase
    .from("orders")
    .select("id, order_items!inner(product_id)")
    .eq("user_id", user.id)
    .eq("status", "delivered")
    .eq("order_items.product_id", product_id)
    .limit(1);

  if (!purchaseCheck || purchaseCheck.length === 0) {
    return NextResponse.json(
      { error: "يمكنك التقييم فقط بعد استلام المنتج" },
      { status: 403 }
    );
  }

  // تأكد ما قيمش المنتج من قبل
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", product_id)
    .maybeSingle();

  if (existingReview) {
    return NextResponse.json(
      { error: "لقد قمت بتقييم هذا المنتج من قبل" },
      { status: 409 }
    );
  }

  const { error: insertError } = await supabase.from("reviews").insert({
    product_id,
    user_id: user.id,
    rating,
    comment: comment || null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // تحديث متوسط التقييم وعدد المراجعات فجدول المنتج
  const { data: allReviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", product_id);

  if (allReviews && allReviews.length > 0) {
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await supabase
      .from("products")
      .update({
        rating: Math.round(avgRating * 10) / 10,
        review_count: allReviews.length,
      })
      .eq("id", product_id);
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const productId = req.nextUrl.searchParams.get("product_id");

  if (!productId) {
    return NextResponse.json({ error: "product_id مطلوب" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, profiles(full_name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data });
}


