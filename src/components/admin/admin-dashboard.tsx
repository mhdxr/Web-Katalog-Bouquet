"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LogOut, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/product-form";
import { ProductTable } from "@/components/admin/product-table";
import { useProducts } from "@/hooks/use-products";
import { clearAdminSession, getAdminSession } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import type { Product } from "@/types";

export function AdminDashboard() {
  const router = useRouter();
  const { products, isLoading, create, update, remove, reset } = useProducts();
  const [authChecked, setAuthChecked] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string>("");

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      router.replace("/admin/login");
      return;
    }
    setAdminEmail(session.email);
    setAuthChecked(true);
  }, [router]);

  if (!authChecked) {
    return (
      <div className="container py-20 text-center text-sm text-muted-foreground">
        Memuat dashboard...
      </div>
    );
  }

  const handleLogout = () => {
    clearAdminSession();
    router.push("/admin/login");
  };

  const handleCreate = async (
    data: Omit<Product, "id" | "createdAt"> | Partial<Product>,
  ) => {
    try {
      await create(data as Omit<Product, "id" | "createdAt">);
      setShowForm(false);
      setEditing(null);
      toast.success("Produk berhasil ditambahkan.");
    } catch {
      toast.error("Gagal menambahkan produk.");
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
    } catch {
      toast.error("Gagal memperbarui produk.");
    }
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Hapus produk "${p.name}"?`)) return;
    try {
      await remove(p.id);
      toast.success(`"${p.name}" dihapus.`);
    } catch {
      toast.error("Gagal menghapus produk.");
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Reset data ke seed default? Semua perubahan lokal akan hilang.",
      )
    )
      return;
    await reset();
    toast.info("Data produk direset ke seed default.");
  };

  return (
    <div className="container py-10 md:py-12">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Admin Dashboard
            </p>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              Demo Local Admin
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
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            Reset data
          </Button>
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

      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Mode demo lokal</p>
          <p className="text-xs leading-relaxed">
            Perubahan produk hanya tersimpan di <code>localStorage</code> browser
            ini. Data akan hilang saat cache dibersihkan dan tidak ter-sync ke
            user lain. Jangan dianggap sebagai admin production sampai database
            (Supabase / Firebase) di-wire up.
          </p>
        </div>
      </div>

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
          Memuat data produk...
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
