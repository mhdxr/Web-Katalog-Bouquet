"use client";

import { Search, X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/data/categories";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/types";

export type PriceRange =
  | "all"
  | "under-300"
  | "300-500"
  | "500-700"
  | "above-700";

export type CatalogSort =
  | "newest"
  | "price-low"
  | "price-high"
  | "name-asc";

export type CatalogBadgeFilter =
  | "all"
  | "best-seller"
  | "new"
  | "sold-out";

export interface CatalogFiltersValue {
  search: string;
  category: ProductCategory | "all";
  price: PriceRange;
  badge: CatalogBadgeFilter;
  sort: CatalogSort;
}

interface CatalogFiltersProps {
  value: CatalogFiltersValue;
  onChange: (next: CatalogFiltersValue) => void;
  onReset: () => void;
  total: number;
}

const priceOptions: { value: PriceRange; label: string }[] = [
  { value: "all", label: "Semua harga" },
  { value: "under-300", label: "Di bawah Rp300.000" },
  { value: "300-500", label: "Rp300.000 - Rp500.000" },
  { value: "500-700", label: "Rp500.000 - Rp700.000" },
  { value: "above-700", label: "Di atas Rp700.000" },
];

const sortOptions: { value: CatalogSort; label: string }[] = [
  { value: "newest", label: "Terbaru" },
  { value: "price-low", label: "Harga termurah" },
  { value: "price-high", label: "Harga tertinggi" },
  { value: "name-asc", label: "Nama A–Z" },
];

const badgeOptions: { value: CatalogBadgeFilter; label: string }[] = [
  { value: "all", label: "Semua status" },
  { value: "best-seller", label: "Best Seller" },
  { value: "new", label: "New" },
  { value: "sold-out", label: "Sold Out" },
];

/**
 * Filter & sort katalog. Search field selalu visible (UX paling sering
 * dipakai). Pilihan lain di-collapse di mobile untuk memberi ruang
 * grid produk.
 *
 * State sebenarnya disimpan di URL via `useCatalogQuery` di parent
 * (catalog-view.tsx) — jadi filter dapat di-bookmark/share dan SEO-
 * friendly tetap terjaga karena server bisa baca query param di sitemap
 * kalau dibutuhkan di masa depan.
 */
export function CatalogFilters({
  value,
  onChange,
  onReset,
  total,
}: CatalogFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isFiltered =
    value.search.length > 0 ||
    value.category !== "all" ||
    value.price !== "all" ||
    value.badge !== "all" ||
    value.sort !== "newest";

  return (
    <div className="space-y-3">
      {/* Search bar (selalu tampil) + tombol filter mobile */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama bouquet atau kata kunci..."
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            className="pl-10"
            type="search"
            aria-label="Cari produk"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="catalog-filter-panel"
          onClick={() => setMobileOpen((s) => !s)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Panel filter — collapsible di mobile, selalu tampil di desktop */}
      <div
        id="catalog-filter-panel"
        className={cn(
          "grid gap-3 md:grid-cols-3 lg:grid-cols-4",
          mobileOpen ? "grid" : "hidden md:grid",
        )}
      >
        <Select
          value={value.category}
          onValueChange={(v) =>
            onChange({
              ...value,
              category: v as CatalogFiltersValue["category"],
            })
          }
        >
          <SelectTrigger aria-label="Kategori">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kategori</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.price}
          onValueChange={(v) => onChange({ ...value, price: v as PriceRange })}
        >
          <SelectTrigger aria-label="Rentang harga">
            <SelectValue placeholder="Rentang harga" />
          </SelectTrigger>
          <SelectContent>
            {priceOptions.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.badge}
          onValueChange={(v) =>
            onChange({ ...value, badge: v as CatalogBadgeFilter })
          }
        >
          <SelectTrigger aria-label="Status produk">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {badgeOptions.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.sort}
          onValueChange={(v) => onChange({ ...value, sort: v as CatalogSort })}
        >
          <SelectTrigger aria-label="Urutkan">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-sm text-muted-foreground">
          Menampilkan{" "}
          <strong className="text-foreground">{total}</strong> produk
        </p>
        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            aria-label="Reset semua filter"
          >
            <X className="h-3.5 w-3.5" />
            Reset filter
          </Button>
        )}
      </div>
    </div>
  );
}
