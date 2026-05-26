import type { ProductRepository } from "./types";

/**
 * STUB Supabase product repository.
 *
 * Belum diaktifkan. Untuk menggunakan:
 * 1. `npm install @supabase/supabase-js`
 * 2. Set env:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 3. Buat tabel `products` dengan kolom:
 *    id, slug, name, description, price, category, images,
 *    badge, isAvailable, createdAt
 * 4. Implementasikan body method-method di bawah memakai supabase client.
 * 5. Lewati pemilih `chooseProductRepository` di `index.ts` agar mengarah
 *    ke repository ini ketika env Supabase tersedia.
 *
 * Selama belum dikonfigurasi, factory `chooseProductRepository()` tidak
 * akan memilih repository ini. Memanggil method-nya langsung akan throw.
 */
function notImplemented(method: string): never {
  throw new Error(
    `[supabaseProductRepository] ${method}() belum diimplementasikan. ` +
      `Set env Supabase dan implementasikan body method ini terlebih dahulu.`,
  );
}

export const supabaseProductRepository: ProductRepository = {
  async list() {
    return notImplemented("list");
  },
  async getById() {
    return notImplemented("getById");
  },
  async create() {
    return notImplemented("create");
  },
  async update() {
    return notImplemented("update");
  },
  async remove() {
    return notImplemented("remove");
  },
  async reset() {
    return notImplemented("reset");
  },
};

/**
 * Cek apakah env Supabase tersedia. Pakai pengecekan ini di factory
 * sebelum mengembalikan supabaseProductRepository.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
