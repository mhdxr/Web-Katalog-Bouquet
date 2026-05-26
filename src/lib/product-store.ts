/**
 * Backward-compatibility re-export.
 *
 * Implementasi sebenarnya pindah ke `src/lib/repositories/`.
 * File ini hanya men-forward agar import lama tetap jalan.
 */
export type { ProductRepository } from "@/lib/repositories";
export {
  chooseProductRepository,
  localStorageProductRepository,
  localStorageProductRepository as localProductRepository,
} from "@/lib/repositories";
