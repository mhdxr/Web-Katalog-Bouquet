/**
 * Konfigurasi brand terpusat.
 * Semua hardcoded text/metadata yang berhubungan dengan brand harus mengambil
 * value dari sini supaya konsisten dan mudah diubah.
 */

const FALLBACK_WA_NUMBER = "6285713254800";
const FALLBACK_SITE_URL = "https://mushida-craft.vercel.app";
const FALLBACK_INSTAGRAM_URL = "https://instagram.com/mushida.id";
const FALLBACK_FACEBOOK_URL = "https://facebook.com/mushida.id";

export type SocialPlatform = "instagram" | "facebook";

export interface SocialLink {
  platform: SocialPlatform;
  /** Label untuk aria-label & tooltip. */
  label: string;
  /** Handle / nama display tanpa "@" / URL. */
  handle: string;
  /** URL absolut. Kosong = tidak ditampilkan. */
  url: string;
}

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
  /** URL profil Instagram (absolute). */
  instagramUrl: string;
  /** Nama page Facebook (display). */
  facebookPageName: string;
  /** URL page Facebook (absolute). */
  facebookUrl: string;
  /**
   * Daftar sosial media yang aktif. Komponen UI cukup map array ini
   * untuk render link/icon — JANGAN hardcode URL di komponen lain.
   * Entri dengan `url` kosong di-filter otomatis.
   */
  socialLinks: SocialLink[];
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

const rawInstagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim();
const instagramUrl =
  rawInstagramUrl && rawInstagramUrl.length > 0
    ? rawInstagramUrl
    : FALLBACK_INSTAGRAM_URL;

const rawFacebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim();
const facebookUrl =
  rawFacebookUrl && rawFacebookUrl.length > 0
    ? rawFacebookUrl
    : FALLBACK_FACEBOOK_URL;

const instagramHandle = "mushida.id";
const facebookPageName = "Mushida";

/**
 * Single source of truth untuk daftar sosial media yang aktif.
 * URL kosong otomatis di-filter — komponen UI tidak perlu cek manual.
 */
const socialLinks: SocialLink[] = (
  [
    {
      platform: "instagram",
      label: "Instagram Mushida",
      handle: instagramHandle,
      url: instagramUrl,
    },
    {
      platform: "facebook",
      label: "Facebook Mushida",
      handle: facebookPageName,
      url: facebookUrl,
    },
  ] as SocialLink[]
).filter((s) => s.url.length > 0);

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
  contactEmail: "hello@mushida.me",
  instagramHandle,
  instagramUrl,
  facebookPageName,
  facebookUrl,
  socialLinks,
  adminEmailPlaceholder: "admin@mushida.me",
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
