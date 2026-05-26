/**
 * Konfigurasi brand terpusat.
 * Semua hardcoded text/metadata yang berhubungan dengan brand harus mengambil
 * value dari sini supaya konsisten dan mudah diubah.
 */

const FALLBACK_WA_NUMBER = "6281234567890";
const FALLBACK_SITE_URL = "https://mushida.vercel.app";

export interface SiteConfig {
  /** Slug / identifier brand (lowercase). */
  name: string;
  /** Display name yang dipakai di heading / metadata. */
  displayName: string;
  /** Tagline pendek di header / hero. */
  tagline: string;
  /** Deskripsi default untuk SEO meta description. */
  description: string;
  /** Deskripsi singkat untuk Open Graph / Twitter card. */
  shortDescription: string;
  /** URL produksi (boleh di-override via NEXT_PUBLIC_SITE_URL). */
  url: string;
  /** Locale id_ID. */
  locale: string;
  /** Nomor WA tujuan order (format internasional tanpa "+"). */
  whatsappNumber: string;
  /** Format harga untuk metadata Store. */
  priceRange: string;
  /** Currency. */
  currency: string;
  /** Email kontak publik. */
  contactEmail: string;
  /** Handle Instagram (tanpa "@"). */
  instagramHandle: string;
  /** Email default placeholder utk form login admin. */
  adminEmailPlaceholder: string;
  /** Keywords SEO. */
  keywords: string[];
  /** Author. */
  author: string;
  /** Theme color browser bar. */
  themeColor: string;
  /** Path image OG default (relative ke public). */
  ogImagePath: string;
}

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const siteUrl =
  rawSiteUrl && rawSiteUrl.length > 0 ? rawSiteUrl : FALLBACK_SITE_URL;

export const siteConfig: SiteConfig = {
  name: "mushida",
  displayName: "Mushida",
  tagline: "Hand-tied Bouquet Artisan",
  description:
    "Katalog bouquet bunga premium untuk wedding, graduation, anniversary, dan momen spesial lainnya. Order mudah via WhatsApp.",
  shortDescription:
    "Katalog bouquet bunga premium untuk setiap momen spesialmu.",
  url: siteUrl,
  locale: "id_ID",
  whatsappNumber:
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || FALLBACK_WA_NUMBER,
  priceRange: "Rp200.000 - Rp2.000.000",
  currency: "IDR",
  contactEmail: "hello@mushida.id",
  instagramHandle: "mushida.id",
  adminEmailPlaceholder: "admin@mushida.id",
  keywords: [
    "bouquet bunga",
    "toko bunga online",
    "hand bouquet",
    "wedding bouquet",
    "graduation bouquet",
    "money bouquet",
    "dried flower",
    "Mushida",
  ],
  author: "Mushida",
  themeColor: "#fff8f5",
  ogImagePath: "/og-image.jpg",
};

/**
 * Helper untuk title metadata bertemplate "Foo | Mushida".
 */
export const siteTitle = {
  default: `${siteConfig.displayName} — ${siteConfig.tagline}`,
  template: `%s | ${siteConfig.displayName}`,
};
