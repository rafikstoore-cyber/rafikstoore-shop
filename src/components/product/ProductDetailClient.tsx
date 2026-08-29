"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Heart, ShoppingBag, Minus, Plus, Star } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import type { Product } from "@/types/database";

export default function ProductDetailClient({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  // Zustand's wishlist store is persisted to localStorage, which is not
  // available during server render. Reading it directly would make the
  // server-rendered HTML and the first client render disagree (hydration
  // mismatch). We wait for the post-hydration effect before trusting the
  // real value, same guard pattern already used in Header.tsx for the cart
  // count.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const addItem = useCartStore((state) => state.addItem);
  const toggle = useWishlistStore((state) => state.toggle);
  const isWishlisted = useWishlistStore((state) =>
    state.isWishlisted(product.id)
  );
  const showWishlisted = mounted && isWishlisted;

  const hasDiscount =
    product.compare_at_price != null && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.price) /
          product.compare_at_price!) *
          100
      )
    : 0;

  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const images =
    product.images && product.images.length > 0
      ? product.images
      : ["/placeholder.png"];

  function handleAddToCart() {
    addItem(product, quantity);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* Gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-rafik-gold/10 bg-white">
          <Image
            src={images[activeImage]}
            alt={product.name_ar || product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
          {hasDiscount && (
            <span className="absolute top-4 right-4 z-10 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
              خصم {discountPercent}%
            </span>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img + i}
                type="button"
                onClick={() => setActiveImage(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                  activeImage === i ? "border-rafik-gold" : "border-transparent"
                }`}
                aria-label={`صورة ${i + 1}`}
              >
                <Image src={img} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div>
        <h1 className="font-display text-2xl font-black text-rafik-navy sm:text-3xl">
          {product.name_ar || product.name}
        </h1>

        {product.review_count > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-rafik-gold text-rafik-gold" />
            <span className="text-sm font-semibold text-rafik-navy">
              {product.rating}
            </span>
            <span className="text-sm text-rafik-navy/50">
              ({product.review_count} تقييم)
            </span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <span className="text-2xl font-black text-rafik-navy">
            {product.price} ج.م
          </span>
          {hasDiscount && (
            <span className="text-base text-gray-400 line-through">
              {product.compare_at_price} ج.م
            </span>
          )}
        </div>

        {!outOfStock && lowStock && (
          <p className="mt-2 text-sm font-medium text-red-500">
            باقي {product.stock} فقط بالمخزون!
          </p>
        )}
        {outOfStock && (
          <p className="mt-2 text-sm font-medium text-red-500">نفذت الكمية</p>
        )}

        {(product.description_ar || product.description) && (
          <p className="mt-5 leading-7 text-rafik-navy/70">
            {product.description_ar || product.description}
          </p>
        )}

        {!outOfStock && (
          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm font-semibold text-rafik-navy">الكمية</span>
            <div className="flex items-center rounded-lg border border-rafik-navy/15">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 text-rafik-navy hover:text-rafik-gold"
                aria-label="تقليل الكمية"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold text-rafik-navy">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
                className="p-2.5 text-rafik-navy hover:text-rafik-gold"
                aria-label="زيادة الكمية"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rafik-navy py-3.5 text-sm font-bold text-rafik-cream transition-colors hover:bg-rafik-gold hover:text-rafik-navy disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingBag className="h-5 w-5" />
            {outOfStock ? "نفذت الكمية" : "أضف للسلة"}
          </button>

          <button
            type="button"
            onClick={() => toggle(product.id)}
            aria-label="أضف للمفضلة"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rafik-navy/15 hover:bg-rafik-gold/10"
          >
            <Heart
              className={`h-5 w-5 ${
                showWishlisted ? "fill-red-500 text-red-500" : "text-rafik-navy"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
