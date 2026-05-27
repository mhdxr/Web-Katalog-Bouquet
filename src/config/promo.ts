/**
 * Konfigurasi promo banner & marketing CTA.
 *
 * Disimpan sebagai TypeScript config (bukan database) supaya:
 *  - Edit cukup di repo + redeploy → tidak butuh tabel/RLS baru.
 *  - Public pages tetap fully static (tidak ada query tambahan).
 *  - Versioning lewat git, mudah di-rollback.
 *
 * Cara non-aktifkan promo: set `enabled: false` di entri yang dimaksud
 * (atau biarkan array kosong).
 */

import { siteConfig } from "@/config/site";

export type PromoCtaTarget = "whatsapp" | "katalog" | "custom-order" | "url";

export interface PromoCta {
  /** Label tombol. */
  label: string;
  /** Tujuan tombol. `whatsapp` membuka chat WA dengan pesan template. */
  target: PromoCtaTarget;
  /** Hanya dipakai kalau target === "url". */
  href?: string;
  /** Pesan WhatsApp template. Hanya dipakai kalau target === "whatsapp". */
  whatsappMessage?: string;
}

export interface PromoBanner {
  id: string;
  enabled: boolean;
  /** Headline pendek (≤ 70 karakter rekomendasi). */
  title: string;
  /** Sub-text 1 baris. */
  subtitle: string;
  /** Emoji prefix opsional, ditampilkan di kiri title. */
  emoji?: string;
  /** Tombol CTA utama. */
  cta: PromoCta;
}

/**
 * Daftar banner aktif. Komponen `<PromoBanner />` mengambil entri
 * pertama yang `enabled = true`. Kalau ingin rotate beberapa promo,
 * komponen bisa di-extend untuk pakai random/index.
 */
export const promoBanners: PromoBanner[] = [
  {
    id: "custom-bouquet",
    enabled: true,
    emoji: "🌸",
    title: "Custom bouquet untuk wisuda, ulang tahun, dan anniversary.",
    subtitle:
      "Konsultasi gratis via WhatsApp — kirim foto referensi & budget, kami bantu rangkaikan.",
    cta: {
      label: "Konsultasi via WhatsApp",
      target: "whatsapp",
      whatsappMessage: `Halo ${siteConfig.displayName}! Saya tertarik untuk custom bouquet. Bisa konsultasi dulu?`,
    },
  },
];

/**
 * Trust signal yang muncul di hero section. Pendek, factual, tidak
 * berlebihan. Kalau ingin mengubah, edit array ini saja.
 */
export interface TrustSignal {
  emoji: string;
  label: string;
}

export const heroTrustSignals: TrustSignal[] = [
  { emoji: "🌷", label: "Custom bouquet" },
  { emoji: "💐", label: "Fresh flowers" },
  { emoji: "💬", label: "Order via WhatsApp" },
];
