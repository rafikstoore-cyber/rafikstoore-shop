"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("عمر البريد الإلكتروني وكلمة السر");
      return;
    }

    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("البريد الإلكتروني أو كلمة السر غير صحيحة");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      setError("هاد الحساب ماعندوش صلاحية الدخول للوحة التحكم");
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B1E3D] px-4 relative overflow-hidden">
      {/* خط ذهبي علوي - التوقيع البصري */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent" />

      {/* دوائر خلفية خفيفة للعمق */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#C9A24B]/5 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#C9A24B]/5 blur-3xl" />

      <div className="w-full max-w-sm relative z-10" dir="rtl">
        {/* شعار / اسم البراند */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-white tracking-wide">
            RAFIK <span className="text-[#C9A24B]">STOORE</span>
          </h1>
          <div className="w-12 h-[1px] bg-[#C9A24B]/50 mx-auto mt-3" />
          <p className="text-white/40 text-sm mt-3">لوحة تحكم الإدارة</p>
        </div>

        {/* البطاقة */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-white/70 text-sm mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rafikstoore.com"
                dir="ltr"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 text-right focus:outline-none focus:border-[#C9A24B]/60 focus:bg-white/[0.07] transition-colors"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">
                كلمة السر
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pl-11 text-white placeholder:text-white/30 text-right focus:outline-none focus:border-[#C9A24B]/60 focus:bg-white/[0.07] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-xs"
                >
                  {showPassword ? "إخفاء" : "إظهار"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A24B] hover:bg-[#D4B05F] disabled:opacity-50 disabled:cursor-not-allowed text-[#0B1E3D] font-semibold py-3 rounded-lg transition-colors mt-2"
            >
              {loading ? "جاري الدخول..." : "دخول"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/25 text-xs mt-6">
          RAFIK STOORE © 2026 — وصول محمي
        </p>
      </div>
    </div>
  );
}
