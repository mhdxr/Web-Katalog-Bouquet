"use client";

import { products as seedProducts } from "@/data/products";
import type { Product } from "@/types";
import type { ProductRepository } from "./types";

/**
 * Implementasi ProductRepository berbasis localStorage.
 * Data di-seed dari src/data/products.ts saat pertama kali dipanggil.
 *
 * NOTE: Hanya tersedia di browser. Saat dijalankan di server (SSR/RSC),
 * `list()` akan langsung mengembalikan seed default tanpa menyentuh storage.
 */

const STORAGE_KEY = "mushida:products:v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function readAll(): Product[] {
  if (!isBrowser()) return seedProducts;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedProducts));
      return seedProducts;
    }
    return JSON.parse(raw) as Product[];
  } catch {
    return seedProducts;
  }
}

function writeAll(items: Product[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const localStorageProductRepository: ProductRepository = {
  async list() {
    return readAll();
  },
  async getById(id) {
    return readAll().find((p) => p.id === id);
  },
  async getBySlug(slug) {
    return readAll().find((p) => p.slug === slug);
  },
  async create(input) {
    const items = readAll();
    const newProduct: Product = {
      ...input,
      id: `p${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const next = [newProduct, ...items];
    writeAll(next);
    return newProduct;
  },
  async update(id, input) {
    const items = readAll();
    const idx = items.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    const updated = { ...items[idx], ...input };
    items[idx] = updated;
    writeAll(items);
    return updated;
  },
  async remove(id) {
    const items = readAll().filter((p) => p.id !== id);
    writeAll(items);
  },
  async reset() {
    writeAll(seedProducts);
  },
};
