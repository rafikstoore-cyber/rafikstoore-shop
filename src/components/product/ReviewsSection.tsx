"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export default function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/reviews?product_id=${productId}`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setLoading(false);
      });
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setMessage({ type: "error", text: "اختر تقييمك بالنجوم" });
      return;
    }
    setSubmitting(true);
    setMessage(null);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, rating, comment }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error });
    } else {
      setMessage({ type: "success", text: "شكرا لتقييمك! سيظهر بعد المراجعة" });
      setRating(0);
      setComment("");
    }
    setSubmitting(false);
  }

  return (
    <div className="mt-10 border-t border-rafik-gold/20 pt-8">
      <h2 className="text-xl font-display font-bold text-rafik-navy mb-6">
        تقييمات الزبناء ({reviews.length})
      </h2>

      {/* قائمة التقييمات */}
      {loading ? (
        <p className="text-sm text-gray-500">جاري التحميل...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500 mb-6">
          لا توجد تقييمات بعد. كن أول من يقيم هذا المنتج!
        </p>
      ) : (
        <div className="space-y-4 mb-8">
          {reviews.map((review) => (
            <div key={review.id} className="bg-rafik-cream/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-rafik-ink">
                  {review.profiles?.full_name || "زبون"}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString("ar-EG")}
                </span>
              </div>
              <div className="flex mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? "fill-rafik-gold text-rafik-gold"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
              {review.comment && (
                <p className="text-sm text-rafik-ink/80">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* فورم إضافة تقييم */}
      <div className="bg-white border border-rafik-gold/20 rounded-xl p-5">
        <h3 className="font-semibold text-rafik-navy mb-3">أضف تقييمك</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
              >
                <Star
                  className={`w-7 h-7 ${
                    star <= rating
                      ? "fill-rafik-gold text-rafik-gold"
                      : "text-gray-200"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="شاركنا رأيك فالمنتج..."
            className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
            rows={3}
          />
          {message && (
            <p
              className={`text-sm ${
                message.type === "success" ? "text-green-600" : "text-red-500"
              }`}
            >
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="bg-rafik-navy text-rafik-cream px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-rafik-gold hover:text-rafik-navy transition-colors disabled:opacity-50"
          >
            {submitting ? "جاري الإرسال..." : "إرسال التقييم"}
          </button>
        </form>
      </div>
    </div>
  );
}
