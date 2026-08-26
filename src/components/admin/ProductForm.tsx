"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Category = { id: string; name_ar: string };

export default function ProductForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [nameAr, setNameAr] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function slugify(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `product-${Date.now()}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nameAr || !name || !price || !stock) {
      setError("عمر جميع الحقول الإجبارية");
      return;
    }

    setLoading(true);

    let imageUrl = "";

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, imageFile);

      if (uploadError) {
        setError("فشل رفع الصورة: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;
    }

    const { error: insertError } = await supabase.from("products").insert({
      name,
      name_ar: nameAr,
      slug: slugify(name),
      description_ar: descriptionAr || null,
      price: Number(price),
      currency: "EGP",
      stock: Number(stock),
      images: imageUrl ? [imageUrl] : [],
      category_id: categoryId || null,
      is_active: true,
      is_featured: false,
    });

    if (insertError) {
      setError("فشل الحفظ: " + insertError.message);
      setLoading(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5">
      <div>
        <label className="block text-rafik-navy/70 text-sm mb-2">
          اسم المنتج (بالعربية) *
        </label>
        <input
          type="text"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          className="w-full border border-rafik-navy/20 rounded-lg px-4 py-2.5"
        />
      </div>

      <div>
        <label className="block text-rafik-navy/70 text-sm mb-2">
          اسم المنتج (بالإنجليزية) *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          dir="ltr"
          className="w-full border border-rafik-navy/20 rounded-lg px-4 py-2.5"
        />
      </div>

      <div>
        <label className="block text-rafik-navy/70 text-sm mb-2">
          الوصف (بالعربية)
        </label>
        <textarea
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
          rows={3}
          className="w-full border border-rafik-navy/20 rounded-lg px-4 py-2.5"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-rafik-navy/70 text-sm mb-2">
            السعر *
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border border-rafik-navy/20 rounded-lg px-4 py-2.5"
          />
        </div>
        <div>
          <label className="block text-rafik-navy/70 text-sm mb-2">
            المخزون *
          </label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full border border-rafik-navy/20 rounded-lg px-4 py-2.5"
          />
        </div>
      </div>

      <div>
        <label className="block text-rafik-navy/70 text-sm mb-2">
          الفئة
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full border border-rafik-navy/20 rounded-lg px-4 py-2.5"
        >
          <option value="">بدون فئة</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_ar}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-rafik-navy/70 text-sm mb-2">
          صورة المنتج
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#C9A24B] hover:bg-[#D4B05F] disabled:opacity-50 text-[#0B1E3D] font-semibold py-3 rounded-lg transition-colors"
      >
        {loading ? "جاري الحفظ..." : "حفظ المنتج"}
      </button>
    </form>
  );
}
