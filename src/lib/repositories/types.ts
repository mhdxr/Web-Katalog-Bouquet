import type { Product } from "@/types";

/**
 * Interface kontrak untuk semua product repository.
 *
 * Implementasi yang tersedia:
 * - localStorageProductRepository  → default (data tersimpan di browser)
 * - supabaseProductRepository      → stub, aktifkan setelah env Supabase di-set
 * - firebaseProductRepository      → stub, aktifkan setelah env Firebase di-set
 *
 * Semua method async sehingga UI tidak peduli backend yang dipakai.
 */
export interface ProductRepository {
  list(): Promise<Product[]>;
  getById(id: string): Promise<Product | undefined>;
  getBySlug(slug: string): Promise<Product | undefined>;
  create(input: Omit<Product, "id" | "createdAt">): Promise<Product>;
  update(id: string, input: Partial<Product>): Promise<Product | undefined>;
  remove(id: string): Promise<void>;
  reset(): Promise<void>;
}
