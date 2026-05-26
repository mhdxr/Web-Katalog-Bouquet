/**
 * Barrel + factories untuk product repository.
 *
 * Default factory `chooseProductRepository()` dipakai oleh hook UI
 * (`useProducts`) di sisi client. Saat env Supabase tersedia, factory
 * akan otomatis mengembalikan repository Supabase yang berjalan di atas
 * browser client. Kalau belum ada env, fallback ke localStorage.
 *
 * Untuk Server Components & Server Actions, pakai
 * `getServerProductRepository()` yang membungkus Supabase server client.
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { localStorageProductRepository } from "./local-storage-product-repository";
import {
  createSupabaseProductRepository,
  isSupabaseConfigured,
} from "./supabase-product-repository";
import type { ProductRepository } from "./types";

export type { ProductRepository } from "./types";
export { localStorageProductRepository } from "./local-storage-product-repository";
export {
  createSupabaseProductRepository,
  isSupabaseConfigured,
} from "./supabase-product-repository";

/**
 * Factory client-side. Dipakai oleh hook `useProducts()` di komponen
 * `"use client"`.
 *
 * - Kalau env Supabase tersedia → repository Supabase (browser client).
 * - Kalau tidak → fallback ke localStorage.
 *
 * NOTE: `client.ts` punya directive `"use client"` sehingga modul ini
 * juga otomatis hanya boleh dipakai di client component graph.
 * Untuk Server Components / Server Actions, pakai server client + panggil
 * `createSupabaseProductRepository(serverClient)` langsung.
 */
export function chooseProductRepository(): ProductRepository {
  if (isSupabaseConfigured()) {
    return createSupabaseProductRepository(createSupabaseBrowserClient());
  }
  return localStorageProductRepository;
}
