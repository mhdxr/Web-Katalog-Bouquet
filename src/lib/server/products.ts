import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createSupabaseAnonServerClient } from "@/lib/supabase/anon-server";
import { createSupabaseProductRepository } from "@/lib/repositories";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { products as seedProducts } from "@/data/products";
import type { Product } from "@/types";

/**
 * Server-side fetcher untuk produk publik.
 *
 * Strategi caching:
 *  - `unstable_cache` dengan tag `products` + `revalidate: 60` detik.
 *  - Setelah admin create/update/delete (lihat `src/app/admin/actions.ts`),
 *    `revalidateTag("products")` dipanggil → semua entry cache di bawah
 *    tag ini langsung invalid → request berikutnya fresh.
 *  - `revalidate: 60` jadi safety net kalau ada path yang lupa di-revalidate.
 *
 * Authentication:
 *  - Memakai anon (cookieless) client supaya bisa dipanggil dari konteks
 *    statis (`generateStaticParams`, sitemap, RSC). Tidak menyentuh
 *    `cookies()` dari `next/headers` yang akan memaksa halaman menjadi
 *    dynamic-rendered.
 *  - Otorisasi tetap di-enforce oleh RLS Supabase: anonim hanya bisa
 *    SELECT produk dengan `is_available = true`.
 *
 * Fallback env:
 *  - Production tanpa env Supabase → throw error jelas (jangan silent
 *    fallback ke seed di production).
 *  - Development tanpa env → fallback ke seed `src/data/products.ts`
 *    + warning ke console supaya developer tahu.
 *
 * `cache()` (React) dipakai untuk dedup pemanggilan dalam satu render
 * tree, di atas `unstable_cache` (Next) yang dedup lintas request.
 */

const PRODUCTS_TAG = "products" as const;
const REVALIDATE_SECONDS = 60;

function isProd() {
  return process.env.NODE_ENV === "production";
}

/**
 * Pastikan env Supabase tersedia. Return `true` kalau OK, `false` kalau
 * boleh fallback (development), throw kalau production.
 */
function ensureSupabaseConfigured(context: string): boolean {
  if (hasSupabaseEnv()) return true;
  if (isProd()) {
    throw new Error(
      `[products] ${context}: env Supabase belum di-set. ` +
        "Wajib set NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY " +
        "di Vercel Project Settings sebelum build production.",
    );
  }
  // eslint-disable-next-line no-console
  console.warn(
    `[products] ${context}: env Supabase belum di-set, fallback ke seed lokal (development only).`,
  );
  return false;
}

function repo() {
  return createSupabaseProductRepository(createSupabaseAnonServerClient());
}

/**
 * Inner fetchers di-bungkus `unstable_cache` agar bisa di-tag &
 * di-revalidate via `revalidateTag("products")`.
 */
const listProductsCached = unstable_cache(
  async (): Promise<Product[]> => repo().list(),
  ["products:all"],
  { tags: [PRODUCTS_TAG], revalidate: REVALIDATE_SECONDS },
);

const getProductBySlugCached = unstable_cache(
  async (slug: string): Promise<Product | null> => {
    const p = await repo().getBySlug(slug);
    return p ?? null;
  },
  ["products:by-slug"],
  { tags: [PRODUCTS_TAG], revalidate: REVALIDATE_SECONDS },
);

export const fetchAllProducts = cache(async (): Promise<Product[]> => {
  if (!ensureSupabaseConfigured("fetchAllProducts")) return seedProducts;
  try {
    return await listProductsCached();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[products] fetchAllProducts failed:", e);
    return [];
  }
});

export const fetchProductBySlug = cache(
  async (slug: string): Promise<Product | undefined> => {
    if (!ensureSupabaseConfigured("fetchProductBySlug")) {
      return seedProducts.find((p) => p.slug === slug);
    }
    try {
      return (await getProductBySlugCached(slug)) ?? undefined;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[products] fetchProductBySlug failed:", e);
      return undefined;
    }
  },
);

export const fetchFeaturedProducts = cache(
  async (limit = 4): Promise<Product[]> => {
    const all = await fetchAllProducts();
    return all.filter((p) => p.badge === "best-seller").slice(0, limit);
  },
);

export const fetchRelatedProducts = cache(
  async (current: Product, limit = 4): Promise<Product[]> => {
    const all = await fetchAllProducts();
    return all
      .filter((p) => p.category === current.category && p.id !== current.id)
      .slice(0, limit);
  },
);

/**
 * Tag yang dipakai untuk meng-invalidate cache produk. Diekspor agar
 * `src/app/admin/actions.ts` memakai konstanta yang sama.
 */
export const PRODUCTS_CACHE_TAG = PRODUCTS_TAG;
