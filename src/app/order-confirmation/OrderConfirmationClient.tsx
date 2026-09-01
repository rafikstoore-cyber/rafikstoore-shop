"use client";

import { ReactNode, useEffect } from "react";
import { useCartStore } from "@/store/cart";

interface OrderConfirmationClientProps {
  orderNumber?: string;
  total?: string;
  children: ReactNode;
}

export default function OrderConfirmationClient({
  children,
}: OrderConfirmationClientProps) {
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return <>{children}</>;
}
