import type { Metadata } from "next";
import Link from "next/link";
import { Wrench, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import {
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
} from "@/lib/whatsapp";

/**
 * =====================================================================
 * Halaman Maintenance — public route saat MAINTENANCE_MODE=true
 * =====================================================================
 * Middleware (`src/middleware.ts`) men-redirect seluruh route public ke
 * sini ketika `process.env.MAINTENANCE_MODE === "true"`. Halaman admin,
 * static asset, dan API tetap diakses normal.
 *
 * Halaman ini di-set:
 *   - `robots: noindex, nofollow`     → search engine tidak meng-index.
 *   - `dynamic = "force-static"`      → ringan & tidak menyentuh DB.
 *
 * Tombol WhatsApp ditampilkan hanya kalau env nomor WA valid — kalau
 * tidak, button di-hide supaya tidak crash di build production
 * (`getWhatsAppNumber()` throw kalau format tidak valid).
 * =====================================================================
 */

export const metadata: Metadata = {
  title: "Mushida sedang dalam perawatan",
  description:
    "Kami sedang melakukan pembaruan katalog agar pengalaman belanja lebih baik. Silakan kembali sebentar lagi.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/maintenance" },
};

export const dynamic = "force-static";

/**
 * Build WhatsApp URL secara defensif. Halaman maintenance sengaja TIDAK
 * memakai `buildWhatsAppUrl()` dari `whatsapp.ts` karena helper itu
 * throw di production kalau env nomor WA invalid. Di sini kita pakai
 * fallback graceful: kalau env invalid, tombol di-hide.
 */
function getSafeWhatsAppHref(): string | null {
  const candidate =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || siteConfig.whatsappNumber;
  if (!candidate || !isValidWhatsAppNumber(candidate)) return null;
  const number = normalizeWhatsAppNumber(candidate);
  const message = `Halo ${siteConfig.displayName}! Saya ingin tanya-tanya saat website maintenance.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export default function MaintenancePage() {
  const waHref = getSafeWhatsAppHref();

  return (
    <div className="container flex min-h-[80vh] flex-col items-center justify-center py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Wrench className="h-9 w-9" />
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Mode Perawatan
      </p>
      <h1 className="mt-2 max-w-2xl font-serif text-3xl font-semibold tracking-tight md:text-4xl">
        {siteConfig.displayName} sedang dalam perawatan
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
        Kami sedang melakukan pembaruan katalog agar pengalaman belanja lebih
        baik. Silakan kembali sebentar lagi — terima kasih atas kesabaran kamu.
      </p>

      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          <MessageCircle className="h-4 w-4" />
          Tetap order via WhatsApp
        </a>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Untuk admin:{" "}
        <Link
          href="/admin/login"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          login dashboard
        </Link>
      </p>
    </div>
  );
}
