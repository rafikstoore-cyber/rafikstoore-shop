"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingBag, Heart } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import type { Product } from "@/types/database";

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const toggle = useWishlistStore((state) => state.toggle);
  const isWishlisted = useWishlistStore((state) =>
    state.isWishlisted(product.id)
  );

  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.price) /
          product.compare_at_price!) *
          100
      )
    : 0;

  const lowStock =
    product.stock !== undefined && product.stock > 0 && product.stock <= 5;

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-gold transition-shadow duration-300 overflow-hidden border border-rafik-gold/10">
      
      {/* Badges */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {hasDiscount && (
          <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            خصم {discountPercent}%
          </span>
        )}
      </div>

      {/* Wishlist */}
      <button
        onClick={() => toggle(product.id)}
        className="absolute top-3 left-3 z-10 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-rafik-gold/20 transition-colors"
        aria-label="أضف للمفضلة"
      >
        <Heart
          className={`w-4 h-4 ${
            isWishlisted ? "fill-red-500 text-red-500" : "text-rafik-navy"
          }`}
        />
      </button>

      {/* Image */}
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square bg-rafik-cream overflow-hidden">
          <Image
            src={product.images?.[0] ?? "/placeholder.png"}
            alt={product.name_ar || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-body text-sm font-semibold text-rafik-ink line-clamp-2 mb-2 hover:text-rafik-gold transition-colors">
            {product.name_ar || product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-rafik-navy">
            {product.price} ج.م
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {product.compare_at_price} ج.م
            </span>
          )}
        </div>

        {/* Low stock urgency */}
        {lowStock && (
          <p className="text-xs text-red-500 font-medium mb-2">
            باقي {product.stock} فقط بالمخزون!
          </p>
        )}

        {/* Add to cart */}
        <button
          onClick={() => addItem(product, 1)}
          disabled={product.stock === 0}
          className="w-full flex items-center justify-center gap-2 bg-rafik-navy text-rafik-cream py-2.5 rounded-lg text-sm font-medium hover:bg-rafik-gold hover:text-rafik-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShoppingBag className="w-4 h-4" />
          {product.stock === 0 ? "نفذت الكمية" : "أضف للسلة"}
        </button>
      </div>
    </div>
  );
}
