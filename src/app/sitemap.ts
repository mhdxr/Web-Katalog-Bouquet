import type { MetadataRoute } from "next";
import { fetchAllProducts } from "@/lib/server/products";
import { categories } from "@/data/categories";
import { siteConfig } from "@/config/site";

const siteUrl = siteConfig.url;

/**
 * ISR: sitemap re-generate setiap 60 detik. `revalidateTag("products")`
 * dari admin action juga otomatis meng-invalidate cache fetcher di
 * dalamnya, jadi sitemap segera fresh setelah produk baru ditambahkan.
 */
export const revalidate = 60;

/**
 * Sitemap mengambil daftar produk dari Supabase (RLS akan memastikan
 * hanya produk `is_available = true` yang muncul untuk anonim). Kalau
 * env Supabase belum di-set, helper akan fallback ke seed lokal supaya
 * `next build` tidak gagal.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const products = await fetchAllProducts();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, priority: 1 },
    { url: `${siteUrl}/katalog`, lastModified: now, priority: 0.9 },
    { url: `${siteUrl}/custom-order`, lastModified: now, priority: 0.8 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${siteUrl}/produk/${p.slug}`,
    lastModified: p.createdAt ? new Date(p.createdAt) : now,
    priority: 0.7,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${siteUrl}/katalog?category=${c.id}`,
    lastModified: now,
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
