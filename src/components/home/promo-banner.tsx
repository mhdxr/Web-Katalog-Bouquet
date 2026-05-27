import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { promoBanners, type PromoBanner } from "@/config/promo";
import { siteConfig } from "@/config/site";
import {
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
} from "@/lib/whatsapp";

/**
 * Resolve WhatsApp URL secara defensif (tidak throw walau env invalid).
 * Kalau env tidak valid, return null → tombol fall back ke /custom-order.
 */
function safeWhatsAppHref(message: string): string | null {
  const candidate =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || siteConfig.whatsappNumber;
  if (!candidate || !isValidWhatsAppNumber(candidate)) return null;
  const number = normalizeWhatsAppNumber(candidate);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

interface PromoBannerProps {
  banner?: PromoBanner;
}

/**
 * Banner promo statis (RSC). Mengambil entri pertama yang `enabled`
 * dari `src/config/promo.ts` kecuali di-override via prop.
 *
 * Render-nya RSC murni — tidak menyentuh DB, tidak interaktif, jadi
 * aman dipakai di homepage tanpa membuatnya dynamic.
 */
export function PromoBanner({ banner }: PromoBannerProps) {
  const active = banner ?? promoBanners.find((b) => b.enabled);
  if (!active) return null;

  const cta = active.cta;
  let href = "/katalog";
  let isExternal = false;
  let isWhatsApp = false;

  if (cta.target === "whatsapp" && cta.whatsappMessage) {
    const wa = safeWhatsAppHref(cta.whatsappMessage);
    if (wa) {
      href = wa;
      isExternal = true;
      isWhatsApp = true;
    } else {
      // Fallback graceful kalau env WA invalid → arahkan ke custom order.
      href = "/custom-order";
    }
  } else if (cta.target === "katalog") {
    href = "/katalog";
  } else if (cta.target === "custom-order") {
    href = "/custom-order";
  } else if (cta.target === "url" && cta.href) {
    href = cta.href;
    isExternal = /^https?:\/\//i.test(cta.href);
  }

  const Icon = isWhatsApp ? MessageCircle : ArrowRight;

  return (
    <section
      aria-label="Promo Mushida"
      className="container py-10 md:py-12"
    >
      <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-blush-50 via-white to-cream-50 p-6 shadow-sm sm:p-8 md:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur-sm">
              {active.emoji ?? "✨"} Promo
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-2xl font-semibold leading-snug tracking-tight md:text-3xl">
              {active.title}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {active.subtitle}
            </p>
          </div>
          <div className="flex md:justify-end">
            {isExternal ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <Icon className="h-4 w-4" />
                {cta.label}
              </a>
            ) : (
              <Link
                href={href}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <Icon className="h-4 w-4" />
                {cta.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
