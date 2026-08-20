"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: string;
  oldPrice: string;
  image: string;
  tag: string;
  active: boolean;
};

type Order = {
  id: number;
  customer: string;
  phone: string;
  total: string;
  status: string;
};

const defaultProducts: Product[] = [
  {
    id: 1,
    name: "سماعات لاسلكية Pro",
    price: "899",
    oldPrice: "1,199",
    image:
      "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=800&q=80",
    tag: "الأكثر طلبًا",
    active: true,
  },
  {
    id: 2,
    name: "ساعة ذكية رياضية",
    price: "1,299",
    oldPrice: "1,699",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    tag: "عرض مميز",
    active: true,
  },
  {
    id: 3,
    name: "حقيبة ظهر عصرية",
    price: "749",
    oldPrice: "999",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    tag: "جديد",
    active: true,
  },
];

const defaultOrders: Order[] = [
  {
    id: 1001,
    customer: "محمد علي",
    phone: "06XXXXXXXX",
    total: "899",
    status: "جديد",
  },
  {
    id: 1002,
    customer: "أحمد",
    phone: "06XXXXXXXX",
    total: "1,299",
    status: "قيد المعالجة",
  },
];

export default function AdminPage() {
  const [tab, setTab] = useState("dashboard");

  const [products, setProducts] =
    useState<Product[]>(defaultProducts);

  const [orders, setOrders] =
    useState<Order[]>(defaultOrders);

  const [storeName, setStoreName] =
    useState("متجر رافيك");

  const [phone, setPhone] =
    useState("06XXXXXXXX");

  const [showProductForm, setShowProductForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [newProduct, setNewProduct] =
    useState({
      name: "",
      price: "",
      oldPrice: "",
      image: "",
      tag: "جديد",
    });

  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem(
        "rafikstore_products"
      );

      const savedOrders = localStorage.getItem(
        "rafikstore_orders"
      );

      const savedSettings = localStorage.getItem(
        "rafikstore_settings"
      );

      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }

      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }

      if (savedSettings) {
        const settings = JSON.parse(savedSettings);

        if (settings.storeName) {
          setStoreName(settings.storeName);
        }

        if (settings.phone) {
          setPhone(settings.phone);
        }
      }
    } catch {
      console.log("تعذر تحميل البيانات");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "rafikstore_products",
      JSON.stringify(products)
    );
  }, [products]);

  useEffect(() => {
    localStorage.setItem(
      "rafikstore_orders",
      JSON.stringify(orders)
    );
  }, [orders]);

  function saveSettings() {
    localStorage.setItem(
      "rafikstore_settings",
      JSON.stringify({
        storeName,
        phone,
      })
    );

    alert("تم حفظ إعدادات المتجر");
  }

  function openAddProduct() {
    setEditingId(null);

    setNewProduct({
      name: "",
      price: "",
      oldPrice: "",
      image: "",
      tag: "جديد",
    });

    setShowProductForm(true);
  }

  function openEditProduct(product: Product) {
    setEditingId(product.id);

    setNewProduct({
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      image: product.image,
      tag: product.tag,
    });

    setShowProductForm(true);
  }

  function saveProduct() {
    if (!newProduct.name || !newProduct.price) {
      alert("أدخل اسم المنتج والسعر");
      return;
    }

    if (editingId
