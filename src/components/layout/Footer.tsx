import Link from "next/link";
import { Instagram, MessageCircle, Mail, Lock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-rafik-navy text-rafik-cream mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* عن البراند */}
        <div>
          <h3 className="text-xl font-display font-bold text-rafik-gold mb-3">
            RAFIK STOORE
          </h3>
          <p className="text-sm text-rafik-cream/80 leading-relaxed">
            جودة • سرعة • ثقة – منتجاتنا مختارة بعناية لتمنحك أفضل تجربة تسوق.
          </p>
        </div>

        {/* روابط سريعة */}
        <div>
          <h4 className="font-semibold text-rafik-gold mb-3">روابط سريعة</h4>
          <ul className="space-y-2 text-sm text-rafik-cream/80">
            <li><Link href="/products">المنتجات</Link></li>
            <li><Link href="/about">من نحن</Link></li>
            <li><Link href="/policy">سياسة الاسترجاع</Link></li>
            <li><Link href="/contact">اتصل بنا</Link></li>
          </ul>
        </div>

        {/* تواصل */}
        <div>
          <h4 className="font-semibold text-rafik-gold mb-3">تواصل معنا</h4>
          <div className="flex gap-4">
            <a href="https://wa.me/212726234905" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-5 h-5 text-rafik-cream hover:text-rafik-gold" />
            </a>
            <a href="https://instagram.com/rafikstoore" target="_blank" rel="noopener noreferrer">
              <Instagram className="w-5 h-5 text-rafik-cream hover:text-rafik-gold" />
            </a>
            <a href="mailto:rafikstoore@gmail.com">
              <Mail className="w-5 h-5 text-rafik-cream hover:text-rafik-gold" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-rafik-cream/20 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-center text-xs text-rafik-cream/60">
        <span>© {new Date().getFullYear()} RAFIK STOORE. جميع الحقوق محفوظة.</span>
        <Link
          href="/admin-login"
          className="flex items-center text-rafik-cream/30 hover:text-rafik-gold transition-colors"
          aria-label="Admin"
        >
          <Lock className="w-3 h-3" />
        </Link>
      </div>
    </footer>
  );
}
