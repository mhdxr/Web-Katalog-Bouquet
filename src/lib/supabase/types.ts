/**
 * Tipe baris database Supabase. Snake_case sesuai konvensi PostgreSQL.
 * Dipakai di sisi server (repository) untuk diparsing ke domain `Product`.
 */
import type { Product, ProductBadge, ProductCategory } from "@/types";

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  images: string[];
  badge: ProductBadge | null;
  is_available: boolean;
  created_at: string;
  updated_at: string | null;
}

/**
 * Konversi snake_case row → camelCase domain object yang dipakai UI.
 */
export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    images: Array.isArray(row.images) ? row.images : [],
    badge: row.badge ?? undefined,
    isAvailable: row.is_available,
    createdAt: row.created_at.slice(0, 10),
  };
}

/**
 * Konversi domain object → row payload untuk insert/update.
 * `id` & `created_at` di-handle Postgres (default uuid + now()).
 */
export function productToInsertRow(
  input: Omit<Product, "id" | "createdAt">,
): Omit<ProductRow, "id" | "created_at" | "updated_at"> {
  return {
    slug: input.slug,
    name: input.name,
    description: input.description,
    price: input.price,
    category: input.category,
    images: input.images,
    badge: input.badge ?? null,
    is_available: input.isAvailable,
  };
}

/**
 * Konversi partial domain → partial row untuk update. Hanya field yang
 * benar-benar diisi akan dikirim ke DB.
 */
export function productToUpdateRow(
  input: Partial<Product>,
): Partial<Omit<ProductRow, "id" | "created_at" | "updated_at">> {
  const out: Partial<Omit<ProductRow, "id" | "created_at" | "updated_at">> = {};
  if (input.slug !== undefined) out.slug = input.slug;
  if (input.name !== undefined) out.name = input.name;
  if (input.description !== undefined) out.description = input.description;
  if (input.price !== undefined) out.price = input.price;
  if (input.category !== undefined) out.category = input.category;
  if (input.images !== undefined) out.images = input.images;
  if (input.badge !== undefined) out.badge = input.badge ?? null;
  if (input.isAvailable !== undefined) out.is_available = input.isAvailable;
  return out;
}
