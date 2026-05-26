/**
 * Barrel + factory untuk product repository.
 *
 * `chooseProductRepository()` memilih implementasi yang tepat berdasarkan
 * env yang tersedia. Default: localStorage.
 *
 * Database tidak akan diaktifkan kecuali env-nya sudah diset, sehingga
 * aman dipanggil di kondisi minimal-config.
 */

import { localStorageProductRepository } from "./local-storage-product-repository";
import {
  isSupabaseConfigured,
  supabaseProductRepository,
} from "./supabase-product-repository";
import type { ProductRepository } from "./types";

export type { ProductRepository } from "./types";
export { localStorageProductRepository } from "./local-storage-product-repository";
export {
  supabaseProductRepository,
  isSupabaseConfigured,
} from "./supabase-product-repository";

/**
 * Pilih repository default. Untuk sekarang Supabase masih stub, jadi
 * meskipun env terdeteksi kita tetap pakai localStorage. Ubah pengecekan
 * di bawah saat implementasi Supabase selesai.
 */
export function chooseProductRepository(): ProductRepository {
  // Hooking up nantinya:
  // if (isSupabaseConfigured()) return supabaseProductRepository;
  void isSupabaseConfigured;
  void supabaseProductRepository;
  return localStorageProductRepository;
}
