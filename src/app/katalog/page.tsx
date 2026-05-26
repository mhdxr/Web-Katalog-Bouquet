import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/catalog-view";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Katalog Bouquet",
  description: `Jelajahi koleksi bouquet bunga ${siteConfig.displayName}. Filter berdasarkan kategori, harga, dan temukan rangkaian sempurna untuk momen spesialmu.`,
};

/**
 * ISR fallback: setiap 60 detik halaman katalog akan re-render dengan
 * data terbaru. Pada update admin yang berhasil, `revalidateTag("products")`
 * dipanggil sehingga refresh terjadi lebih cepat dari interval ini.
 */
export const revalidate = 60;

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="container py-10">Memuat...</div>}>
      <CatalogView />
    </Suspense>
  );
}
