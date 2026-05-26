"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/product-form";
import { ProductTable } from "@/components/admin/product-table";
import { useProducts } from "@/hooks/use-products";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { revalidateProducts } from "@/app/admin/actions";
import type { Product } from "@/types";

interface AdminDashboardProps {
  /** Email admin yang sudah divalidasi di server. */
  adminEmail: string;
}

export function AdminDashboard({ adminEmail }: AdminDashboardProps) {
  const router = useRouter();
  const { products, isLoading, error, create, update, remove } = useProducts();
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  /**
   * Setelah CRUD berhasil, panggil server action untuk:
   *  1. revalidateTag("products") → invalidate cache `unstable_cache`.
   *  2. revalidatePath("/", "/katalog", "/produk", "/sitemap.xml") →
   *     paksa Server Component re-render saat user buka halaman publik
   *     berikutnya.
   * Hasilnya: perubahan admin langsung visible di public catalog tanpa
   * perlu redeploy.
   */
  const refreshPublicCache = async () => {
    try {
      const result = await revalidateProducts();
      if (!result.ok) {
        // eslint-disable-next-line no-console
        console.warn(
          "[admin] revalidateProducts gagal:",
          result.error ?? "unknown",
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[admin] revalidateProducts error:", e);
    }
  };

  const handleCreate = async (
    data: Omit<Product, "id" | "createdAt"> | Partial<Product>,
  ) => {
    try {
      await create(data as Omit<Product, "id" | "createdAt">);
      setShowForm(false);
      setEditing(null);
      toast.success("Produk berhasil ditambahkan.");
      await refreshPublicCache();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menambahkan produk.";
      toast.error(msg);
    }
  };

  const handleUpdate = async (
    data: Omit<Product, "id" | "createdAt"> | Partial<Product>,
  ) => {
    if (!editing) return;
    try {
      await update(editing.id, data as Partial<Product>);
      setShowForm(false);
      setEditing(null);
      toast.success("Produk berhasil diperbarui.");
      await refreshPublicCache();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal memperbarui produk.";
      toast.error(msg);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Hapus produk "${p.name}"?`)) return;
    try {
      await remove(p.id);
      toast.success(`"${p.name}" dihapus.`);
      await refreshPublicCache();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menghapus produk.";
      toast.error(msg);
    }
  };

  return (
    <div className="container py-10 md:py-12">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Admin Dashboard
            </p>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="h-3 w-3" />
              Production Admin
            </span>
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
            Kelola Produk
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Login sebagai{" "}
            <strong className="text-foreground">{adminEmail}</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Tambah produk
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Gagal memuat data dari Supabase</p>
            <p className="text-xs leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mb-8 rounded-2xl border border-border/60 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 font-serif text-lg font-semibold">
            {editing ? "Edit produk" : "Tambah produk baru"}
          </h2>
          <ProductForm
            initial={editing ?? undefined}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-border/60 bg-white p-10 text-center text-sm text-muted-foreground">
          Memuat data produk dari database...
        </div>
      ) : (
        <ProductTable
          products={products}
          onEdit={(p) => {
            setEditing(p);
            setShowForm(true);
          }}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
