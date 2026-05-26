import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/types";
import {
  productToInsertRow,
  productToUpdateRow,
  rowToProduct,
  type ProductRow,
} from "@/lib/supabase/types";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { ProductRepository } from "./types";

const TABLE = "products";

/**
 * Factory: bikin ProductRepository yang berjalan di atas Supabase.
 *
 * Supabase client bisa berupa:
 *  - browser client (dari `createSupabaseBrowserClient()`) — untuk
 *    operasi admin di sisi client.
 *  - server client (dari `createSupabaseServerClient()`) — untuk
 *    Server Components / Server Actions.
 *
 * RLS yang aktif di tabel `products`:
 *  - anonim hanya bisa SELECT row dengan `is_available = true`.
 *  - admin (user yang ada di tabel `admin_users`) bisa CRUD penuh.
 */
export function createSupabaseProductRepository(
  client: SupabaseClient,
): ProductRepository {
  return {
    async list() {
      const { data, error } = await client
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => rowToProduct(row as ProductRow));
    },

    async getById(id: string) {
      const { data, error } = await client
        .from(TABLE)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToProduct(data as ProductRow) : undefined;
    },

    async getBySlug(slug: string) {
      const { data, error } = await client
        .from(TABLE)
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToProduct(data as ProductRow) : undefined;
    },

    async create(input: Omit<Product, "id" | "createdAt">) {
      const payload = productToInsertRow(input);
      const { data, error } = await client
        .from(TABLE)
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return rowToProduct(data as ProductRow);
    },

    async update(id: string, input: Partial<Product>) {
      const payload = productToUpdateRow(input);
      if (Object.keys(payload).length === 0) {
        // Tidak ada perubahan — kembalikan data current.
        const { data } = await client
          .from(TABLE)
          .select("*")
          .eq("id", id)
          .maybeSingle();
        return data ? rowToProduct(data as ProductRow) : undefined;
      }
      const { data, error } = await client
        .from(TABLE)
        .update(payload)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data ? rowToProduct(data as ProductRow) : undefined;
    },

    async remove(id: string) {
      const { error } = await client.from(TABLE).delete().eq("id", id);
      if (error) throw error;
    },

    async reset() {
      // Reset destruktif tidak diizinkan dari aplikasi. Kalau perlu seed
      // ulang, jalankan SQL seed manual dari Supabase SQL editor.
      throw new Error(
        "[supabaseProductRepository] reset() dinonaktifkan di Supabase. " +
          "Jalankan SQL seed manual jika perlu reset data.",
      );
    },
  };
}

/** Helper backward-compat: cek apakah env Supabase sudah lengkap. */
export function isSupabaseConfigured(): boolean {
  return hasSupabaseEnv();
}
