import type { CustomOrderForm, Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/**
 * Format yang valid: angka 8-15 digit, optional prefix "+" / "00" sudah dihapus.
 * Contoh valid: "6281234567890".
 */
const WA_NUMBER_REGEX = /^[1-9]\d{7,14}$/;

/**
 * Normalisasi nomor WhatsApp: hilangkan spasi, tanda hubung, dan prefix "+".
 * Konversi nomor lokal yang diawali "0" menjadi "62...".
 */
export function normalizeWhatsAppNumber(input: string): string {
  const cleaned = input.replace(/[\s\-()]/g, "").replace(/^\+/, "");
  if (cleaned.startsWith("0")) {
    return `62${cleaned.slice(1)}`;
  }
  return cleaned;
}

/**
 * Validasi format nomor WhatsApp internasional (tanpa "+").
 */
export function isValidWhatsAppNumber(input: string): boolean {
  const normalized = normalizeWhatsAppNumber(input);
  return WA_NUMBER_REGEX.test(normalized);
}

/**
 * Ambil nomor WhatsApp tujuan order.
 * - Di production (NODE_ENV === "production"), env wajib di-set & valid.
 *   Kalau tidak: log warning dan tetap kembalikan nomor (tapi user akan tahu
 *   karena pesan errornya jelas saat tombol diklik atau via console).
 * - Di development, fallback ke nomor dummy aman supaya UI tetap bisa dicoba.
 */
export function getWhatsAppNumber(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim();
  if (fromEnv && isValidWhatsAppNumber(fromEnv)) {
    return normalizeWhatsAppNumber(fromEnv);
  }

  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-console
    console.warn(
      "[whatsapp] NEXT_PUBLIC_WHATSAPP_NUMBER tidak diset atau formatnya tidak valid. " +
        "Set env yang benar (format: 62xxxxxxxxxxx) sebelum deploy ke production.",
    );
  }

  return normalizeWhatsAppNumber(siteConfig.whatsappNumber);
}

export function buildWhatsAppUrl(message: string): string {
  const number = getWhatsAppNumber();
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encoded}`;
}

export function buildProductOrderMessage(product: Product): string {
  return [
    `Halo ${siteConfig.displayName}! 🌸`,
    "",
    "Saya tertarik dengan produk berikut:",
    `• Nama: ${product.name}`,
    `• Harga: ${formatCurrency(product.price)}`,
    `• Kategori: ${product.category}`,
    "",
    "Boleh info lebih lanjut untuk pemesanannya? Terima kasih.",
  ].join("\n");
}

export function buildCustomOrderMessage(form: CustomOrderForm): string {
  return [
    `Halo ${siteConfig.displayName}! 🌸`,
    "Saya ingin request *Custom Bouquet* dengan detail berikut:",
    "",
    `• Nama: ${form.name}`,
    `• WhatsApp: ${form.whatsapp}`,
    `• Jenis bouquet: ${form.bouquetType}`,
    `• Budget: ${form.budget}`,
    `• Tanggal dibutuhkan: ${form.neededDate}`,
    form.notes ? `• Catatan: ${form.notes}` : "",
    "",
    "Mohon dibantu ya, terima kasih banyak!",
  ]
    .filter(Boolean)
    .join("\n");
}
