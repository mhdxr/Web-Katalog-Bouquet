import { MessageCircle, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import {
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
} from "@/lib/whatsapp";

/**
 * CTA section: "Butuh bouquet custom?"
 *
 * Render Server Component — pesan WhatsApp di-encode di build time,
 * tidak ada JS client tambahan. Kalau env nomor WA tidak valid, tombol
 * fallback ke `/custom-order` (form Zod-validated) supaya UX tidak
 * patah.
 */

const MESSAGE = `Halo ${siteConfig.displayName}! Saya ingin konsultasi custom bouquet. Mohon dibantu rekomendasi & estimasi harganya.`;

function resolveCtaHref(): { href: string; isWhatsApp: boolean } {
  const candidate =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || siteConfig.whatsappNumber;
  if (candidate && isValidWhatsAppNumber(candidate)) {
    const number = normalizeWhatsAppNumber(candidate);
    return {
      href: `https://wa.me/${number}?text=${encodeURIComponent(MESSAGE)}`,
      isWhatsApp: true,
    };
  }
  return { href: "/custom-order", isWhatsApp: false };
}

export function CustomCtaSection() {
  const { href, isWhatsApp } = resolveCtaHref();

  return (
    <section className="container py-16 md:py-24">
      <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-primary/95 via-primary/90 to-blush-700 p-8 text-primary-foreground shadow-lg sm:p-12 md:p-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-white/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Custom Order
          </p>
          <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
            Butuh bouquet custom?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/90 md:text-base">
            Kirim foto referensi, momen, dan budget — kami bantu rangkaikan
            bouquet personal sesuai cerita kamu. Konsultasi gratis, langsung
            via WhatsApp.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {isWhatsApp ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-medium text-primary shadow-sm transition hover:bg-white/90"
              >
                <MessageCircle className="h-4 w-4" />
                Konsultasi via WhatsApp
              </a>
            ) : (
              <a
                href={href}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-medium text-primary shadow-sm transition hover:bg-white/90"
              >
                <MessageCircle className="h-4 w-4" />
                Buat permintaan custom
              </a>
            )}
            <a
              href="/katalog"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/40 bg-transparent px-7 text-sm font-medium text-primary-foreground transition hover:bg-white/10"
            >
              Lihat katalog
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
