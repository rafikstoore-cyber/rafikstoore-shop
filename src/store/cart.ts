"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Heart } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price?: number | null;
  image_url: string;
  stock: number;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isWishlisted = useWishlistStore((state) =>
    state.items.some((item) => item.id === product.id)
  );

  const isOutOfStock = product.stock <= 0;
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.price) /
          product.compare_at_price!) *
          100
      )
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1,
    });
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(product);
  };

  return (
    <Link href={`/products/${product.slug}`} className="product-card group block">
      <div className="relative aspect-square overflow-hidden bg-rafik-cream">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />

        {hasDiscount && (
          <span className="badge-gold absolute top-2 right-2">
            خصم {discountPercent}%
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-rafik-navy font-semibold text-sm">
              نفذت الكمية
            </span>
          </div>
        )}

        <button
          onClick={handleWishlistClick}
          className="absolute top-2 left-2 bg-white/90 p-2 rounded-full hover:bg-white transition-colors"
          aria-label="أضف للمفضلة"
        >
          <Heart
            size={18}
            className={isWishlisted ? "fill-rafik-gold text-rafik-gold" : "text-rafik-navy"}
          />
        </button>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="text-sm font-medium text-rafik-ink line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-center gap-2">
          <span className="price-tag">{product.price} جنيه</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {product.compare_at_price} جنيه
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="btn-accent w-full flex items-center justify-center gap-2 text-sm py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShoppingBag size={16} />
          {isOutOfStock ? "نفذت الكمية" : "زيد للسلة"}
        </button>
      </div>
    </Link>
  );
}
