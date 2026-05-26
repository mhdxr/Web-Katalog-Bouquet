"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PRODUCTS_CACHE_TAG } from "@/lib/server/products";
import { getAdminUser } from "@/lib/auth";

/**
 * Server Action: invalidate seluruh cache produk setelah CRUD admin.
 *
 * Dipanggil oleh admin dashboard SETELAH operasi create/update/delete
 * berhasil (lihat `src/components/admin/admin-dashboard.tsx`). Efeknya:
 *
 *  1. `revalidateTag("products")` → semua entry `unstable_cache`
 *     dengan tag tersebut langsung kadaluarsa. Request berikutnya ke
 *     `fetchAllProducts` / `fetchProductBySlug` akan refetch dari
 *     Supabase tanpa menunggu interval ISR.
 *  2. `revalidatePath` untuk path-path yang me-render produk → memaksa
 *     ulang render Server Component & metadata, termasuk slug detail
 *     dan sitemap.
 *  3. Jika slug spesifik dikirim (oldSlug/newSlug), path slug tersebut
 *     juga di-invalidate — berguna saat slug berubah (rename produk)
 *     atau saat produk dihapus (supaya slug lama langsung 404).
 *
 * Guard:
 *  - Cek ulang admin di server (`getAdminUser`) supaya endpoint ini
 *    tidak bisa ditrigger oleh non-admin walau memanggil dari DevTools.
 *  - Jangan percaya data client untuk otorisasi.
 *
 * NOTE: Action ini hanya invalidate cache. Penulisan datanya sendiri
 * tetap dilakukan via Supabase client di sisi browser (RLS jadi guard
 * sebenarnya — tanpa cookie sesi admin, INSERT/UPDATE/DELETE di-tolak
 * Postgres).
 */
export interface RevalidateProductsInput {
  /** Slug yang berubah/baru/dihapus. Boleh dikirim 1-2 (mis. rename). */
  slugs?: string[];
}

export interface RevalidateProductsResult {
  ok: boolean;
  error?: string;
}

export async function revalidateProducts(
  input: RevalidateProductsInput = {},
): Promise<RevalidateProductsResult> {
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false, error: "UNAUTHORIZED" };
  }

  try {
    // Tag-based invalidation — paling kuat, mengenai semua entry
    // unstable_cache yang ditandai PRODUCTS_CACHE_TAG.
    revalidateTag(PRODUCTS_CACHE_TAG);

    // Path-level revalidation untuk halaman yang dibaca pengunjung.
    revalidatePath("/", "page");
    revalidatePath("/katalog", "page");
    // Semua slug detail yang sudah terprerender — pakai route pattern
    // resmi Next.js supaya satu panggilan menyentuh seluruh entri di
    // bawah `/produk/[slug]`.
    revalidatePath("/produk/[slug]", "page");
    revalidatePath("/sitemap.xml");

    // Slug spesifik (jika diketahui) — wajib dipanggil agar:
    //  - rename produk: slug LAMA & BARU sama-sama refresh.
    //  - delete produk: slug yang dihapus langsung 404 di request berikut.
    if (input.slugs?.length) {
      const unique = Array.from(
        new Set(input.slugs.map((s) => s.trim()).filter(Boolean)),
      );
      for (const slug of unique) {
        revalidatePath(`/produk/${slug}`, "page");
      }
    }

    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Revalidation failed";
    // eslint-disable-next-line no-console
    console.error("[admin][revalidateProducts] error:", message);
    return { ok: false, error: message };
  }
}
