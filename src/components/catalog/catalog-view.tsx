"use client";

import { useMemo } from "react";
import {
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { ProductGrid } from "@/components/product/product-grid";
import {
  CatalogFilters,
  type CatalogFiltersValue,
  type PriceRange,
  type CatalogSort,
  type CatalogBadgeFilter,
} from "@/components/catalog/catalog-filters";
import { EmptyState } from "@/components/catalog/empty-state";
import { useProducts } from "@/hooks/use-products";
import type { Product, ProductCategory } from "@/types";

const priceRanges: Record<PriceRange, [number, number]> = {
  all: [0, Number.POSITIVE_INFINITY],
  "under-300": [0, 300_000],
  "300-500": [300_000, 500_000],
  "500-700": [500_000, 700_000],
  "above-700": [700_000, Number.POSITIVE_INFINITY],
};

const categoryValues = [
  "all",
  "hand-bouquet",
  "wedding",
  "graduation",
  "anniversary",
  "money-bouquet",
  "dried-flower",
] as const;

const priceValues = [
  "all",
  "under-300",
  "300-500",
  "500-700",
  "above-700",
] as const;

const sortValues = [
  "newest",
  "price-low",
  "price-high",
  "name-asc",
] as const;

const badgeValues = ["all", "best-seller", "new", "sold-out"] as const;

const DEFAULTS = {
  q: "",
  category: "all" as (typeof categoryValues)[number],
  price: "all" as PriceRange,
  badge: "all" as CatalogBadgeFilter,
  sort: "newest" as CatalogSort,
};

/**
 * Sort produk sesuai pilihan user. `newest` pakai `createdAt` desc.
 * `name-asc` pakai locale "id" supaya urutan nama bouquet rasa lokal
 * (mis. accent "é" tidak nyasar ke akhir).
 */
function sortProducts(list: Product[], by: CatalogSort): Product[] {
  const copy = [...list];
  switch (by) {
    case "price-low":
      return copy.sort((a, b) => a.price - b.price);
    case "price-high":
      return copy.sort((a, b) => b.price - a.price);
    case "name-asc":
      return copy.sort((a, b) =>
        a.name.localeCompare(b.name, "id", { sensitivity: "base" }),
      );
    case "newest":
    default:
      return copy.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
  }
}

export function CatalogView() {
  // URL-driven state via nuqs. shallow=true (default) supaya tidak
  // re-render Server Component & tidak meng-invalidate ISR cache.
  // Filter ini full client-side — produknya sudah di-fetch sekali via
  // useProducts() di atas anon Supabase repository.
  const [query, setQuery] = useQueryStates(
    {
      q: parseAsString.withDefault(DEFAULTS.q),
      category: parseAsStringLiteral(categoryValues).withDefault(
        DEFAULTS.category,
      ),
      price: parseAsStringLiteral(priceValues).withDefault(DEFAULTS.price),
      badge: parseAsStringLiteral(badgeValues).withDefault(DEFAULTS.badge),
      sort: parseAsStringLiteral(sortValues).withDefault(DEFAULTS.sort),
    },
    { history: "replace", clearOnDefault: true },
  );

  const filtersValue = useMemo<CatalogFiltersValue>(
    () => ({
      search: query.q,
      category: query.category as ProductCategory | "all",
      price: query.price,
      badge: query.badge,
      sort: query.sort,
    }),
    [query.q, query.category, query.price, query.badge, query.sort],
  );

  const { products, isLoading, error } = useProducts();

  const filtered = useMemo(() => {
    const [min, max] = priceRanges[filtersValue.price];
    const q = filtersValue.search.trim().toLowerCase();
    const matched = products.filter((p) => {
      // is_available=false sudah di-filter RLS untuk anon. Kita tetap
      // filter defensif kalau hook ini dipakai di konteks admin.
      if (!p.isAvailable) return false;

      if (
        filtersValue.category !== "all" &&
        p.category !== filtersValue.category
      )
        return false;
      if (p.price < min || p.price > max) return false;

      if (filtersValue.badge !== "all" && p.badge !== filtersValue.badge)
        return false;

      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    return sortProducts(matched, filtersValue.sort);
  }, [products, filtersValue]);

  const handleChange = (next: CatalogFiltersValue) => {
    setQuery({
      q: next.search,
      category: next.category as (typeof categoryValues)[number],
      price: next.price,
      badge: next.badge,
      sort: next.sort,
    });
  };

  const handleReset = () => {
    setQuery({
      q: null,
      category: null,
      price: null,
      badge: null,
      sort: null,
    });
  };

  return (
    <div className="container py-10 md:py-14">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Katalog
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
          Jelajahi koleksi bouquet kami
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Setiap rangkaian dibuat tangan dengan bunga premium. Filter sesuai
          momen, budget, atau cari nama bouquet langsung.
        </p>
      </div>

      <div className="sticky top-16 z-30 -mx-4 mb-8 border-b border-border/40 bg-background/85 px-4 py-4 backdrop-blur-md md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <CatalogFilters
          value={filtersValue}
          onChange={handleChange}
          onReset={handleReset}
          total={filtered.length}
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive"
        >
          Gagal memuat produk: {error}. Coba refresh halaman.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse rounded-2xl bg-secondary"
              aria-hidden
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onReset={handleReset} />
      ) : (
        <ProductGrid products={filtered} />
      )}
    </div>
  );
}
