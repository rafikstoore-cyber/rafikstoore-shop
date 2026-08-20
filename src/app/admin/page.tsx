"use client";

import { useState } from "react";

export default function AdminPage() {
  const [active, setActive] = useState("dashboard");

  const menu = [
    { id: "dashboard", name: "الرئيسية", icon: "📊" },
    { id: "products", name: "المنتجات", icon: "📦" },
    { id: "orders", name: "الطلبات", icon: "🛒" },
    { id: "customers", name: "العملاء", icon: "👥" },
    { id: "settings", name: "الإعدادات", icon: "⚙️" },
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-100 text-gray-900"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">
              لوحة تحكم RAFIK STORE
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              إدارة المتجر
            </p>
          </div>

          <a
            href="/"
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            مشاهدة المتجر
          </a>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-24 rounded-2xl border bg-white p-3 shadow-sm">
            {menu.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right transition ${
                  active === item.id
                    ? "bg-black text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <section className="min-w-0 flex-1">
          {active === "dashboard" && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold">
                  مرحبًا بك 👋
                </h2>
                <p className="mt-1 text-gray-500">
                  من هنا يمكنك التحكم في متجرك بالكامل.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                  title="المنتجات"
                  value="4"
                  icon="📦"
                />
                <Stat
                  title="الطلبات"
                  value="0"
                  icon="🛒"
                />
                <Stat
                  title="العملاء"
                  value="0"
                  icon="👥"
