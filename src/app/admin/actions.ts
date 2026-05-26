"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PRODUCTS_CACHE_TAG } from "@/lib/server/products";
import { getAdminUser } from "@/lib/auth";

/**
 * Server Action: invalidate seluruh cache produk.
 *
 * Dipanggil oleh admin dashboard SETELAH operasi CRUD berhasil
 * (lihat `src/components/admin/admin-dashboard.tsx`). Efeknya:
 *
 *  1. `revalidateTag("products")` → semua entry `unstable_cache`
 *     dengan tag tersebut langsung kadaluarsa. Request berikutnya ke
 *     `fetchAllProducts` / `fetchProductBySlug` akan refetch dari
 *     Supabase.
 *  2. `revalidatePath` untuk path-path yang me-render produk → memaksa
 *     ulang render Server Component & metadata, termasuk slug detail
 *     dan sitemap.
 *
 * Guard:
 *  - Cek ulang admin di server (`getAdminUser`) supaya endpoint ini
 *    tidak bisa di-trigger oleh non-admin walau diketahui dari DevTools.
 *
 * NOTE: Action ini hanya invalidate cache. Penulisan datanya sendiri
 * tetap dilakukan via Supabase client di sisi browser (RLS jadi guard
 * sebenarnya — tanpa cookie sesi admin, INSERT/UPDATE/DELETE di-tolak
 * Postgres).
 */
export async function revalidateProducts(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false, error: "UNAUTHORIZED" };
  }

  revalidateTag(PRODUCTS_CACHE_TAG);
  // Path-level revalidation untuk halaman yang dibaca pengunjung.
  // Slug-level (`/produk/[slug]`) di-cover oleh tag, tapi kita panggil
  // path utama untuk memastikan list view benar-benar fresh.
  revalidatePath("/", "page");
  revalidatePath("/katalog", "page");
  revalidatePath("/produk", "layout");
  revalidatePath("/sitemap.xml");

  return { ok: true };
}
