"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { chooseProductRepository } from "@/lib/repositories";
import type { Product } from "@/types";

export function useProducts() {
  const repository = useMemo(() => chooseProductRepository(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await repository.list();
      setProducts(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal memuat produk.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: Omit<Product, "id" | "createdAt">): Promise<Product> => {
      const created = await repository.create(input);
      await refresh();
      return created;
    },
    [refresh, repository],
  );

  const update = useCallback(
    async (
      id: string,
      input: Partial<Product>,
    ): Promise<Product | undefined> => {
      const updated = await repository.update(id, input);
      await refresh();
      return updated;
    },
    [refresh, repository],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await repository.remove(id);
      await refresh();
    },
    [refresh, repository],
  );

  const reset = useCallback(async () => {
    await repository.reset();
    await refresh();
  }, [refresh, repository]);

  return { products, isLoading, error, refresh, create, update, remove, reset };
}
