"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ImagePlus,
  Loader2,
  Save,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/data/categories";
import {
  BADGE_NONE,
  productSchema,
  type ProductSchema,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { uploadProductImage } from "@/app/admin/upload-actions";
import type { Product, ProductBadge, ProductCategory } from "@/types";

interface ProductFormProps {
  initial?: Product;
  onSubmit: (
    data: Omit<Product, "id" | "createdAt"> | Partial<Product>,
  ) => Promise<void>;
  onCancel: () => void;
}

const ACCEPT_MIME = "image/jpeg,image/png,image/webp";
const PLACEHOLDER = "/images/placeholder-bouquet.svg";

export function ProductForm({ initial, onSubmit, onCancel }: ProductFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductSchema>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      price: initial?.price ?? 0,
      category: initial?.category ?? "hand-bouquet",
      images: initial?.images.join("\n") ?? "",
      badge: initial?.badge ?? BADGE_NONE,
      isAvailable: initial?.isAvailable ?? true,
    },
  });

  useEffect(() => {
    if (initial) {
      reset({
        name: initial.name,
        description: initial.description,
        price: initial.price,
        category: initial.category,
        images: initial.images.join("\n"),
        badge: initial.badge ?? BADGE_NONE,
        isAvailable: initial.isAvailable,
      });
    }
  }, [initial, reset]);

  const category = watch("category");
  const badge = watch("badge");
  const isAvailable = watch("isAvailable");
  const imagesText = watch("images") ?? "";

  // Daftar URL gambar saat ini — di-derive dari field `images` di form.
  // Gambar pertama otomatis jadi cover di /katalog & /produk/[slug].
  const imageList = useMemo(
    () =>
      imagesText
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean),
    [imagesText],
  );

  /** Tulis ulang field `images` dari array URL. */
  const writeImages = (next: string[]) => {
    setValue("images", next.join("\n"), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleRemoveImage = (idx: number) => {
    writeImages(imageList.filter((_, i) => i !== idx));
  };

  const handleSetCover = (idx: number) => {
    if (idx <= 0) return;
    const target = imageList[idx];
    const rest = imageList.filter((_, i) => i !== idx);
    writeImages([target, ...rest]);
  };

  /**
   * Upload satu atau beberapa file ke Supabase Storage via Server
   * Action `uploadProductImage`. URL yang sukses langsung di-append ke
   * daftar `images` form. URL yang gagal ditampilkan via toast.
   *
   * Catatan: kita pakai `Promise.all` (paralel) supaya upload beberapa
   * file tidak terlalu lambat. Kalau di production trafik admin tinggi
   * dan ingin lebih hemat resource, ubah ke loop sequential.
   */
  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const results = await Promise.all(
        Array.from(files).map(async (file) => {
          const fd = new FormData();
          fd.append("file", file);
          const res = await uploadProductImage(fd);
          return { name: file.name, ...res };
        }),
      );
      const okUrls = results
        .filter((r) => r.ok && r.url)
        .map((r) => r.url as string);
      const failed = results.filter((r) => !r.ok);

      if (okUrls.length > 0) {
        writeImages([...imageList, ...okUrls]);
        toast.success(`${okUrls.length} gambar berhasil diunggah.`);
      }

      if (failed.length > 0) {
        const first = failed[0];
        const detail = first.error ?? "alasan tidak diketahui";
        const prefix =
          failed.length === 1
            ? `Gagal unggah "${first.name}"`
            : `${failed.length} gambar gagal diunggah`;
        toast.error(`${prefix}: ${detail}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload error";
      toast.error(`Gagal mengunggah gambar: ${msg}`);
    } finally {
      setIsUploading(false);
      // Reset input supaya admin bisa pilih file yang sama lagi.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handle = handleSubmit(async (data) => {
    const images = data.images
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    // Sentinel "none" → undefined (tidak ada badge).
    const badgeValue: ProductBadge | undefined =
      data.badge === BADGE_NONE ? undefined : (data.badge as ProductBadge);
    const payload = {
      name: data.name,
      description: data.description,
      price: Number(data.price),
      category: data.category,
      images,
      badge: badgeValue,
      isAvailable: data.isAvailable,
      slug: initial?.slug ?? slugify(data.name),
    };
    await onSubmit(payload);
  });

  return (
    <form onSubmit={handle} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Nama produk</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Harga (Rp)</Label>
          <Input
            id="price"
            type="number"
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Kategori</Label>
          <Select
            value={category}
            onValueChange={(v) =>
              setValue("category", v as ProductCategory, {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Badge</Label>
          <Select
            value={badge ?? BADGE_NONE}
            onValueChange={(v) =>
              setValue("badge", v as ProductSchema["badge"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tanpa badge" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={BADGE_NONE}>Tanpa badge</SelectItem>
              <SelectItem value="best-seller">Best Seller</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="sold-out">Sold Out</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <strong>Sold Out</strong> = produk tetap tampil di katalog,
            tombol order otomatis nonaktif. Kalau ingin produk benar-benar
            disembunyikan dari publik, matikan checkbox <em>Tampil di publik</em> di
            bawah.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Visibilitas publik</Label>
          <div className="flex h-11 items-center gap-3 rounded-xl border border-input bg-background px-4">
            <input
              id="isAvailable"
              type="checkbox"
              checked={isAvailable}
              onChange={(e) =>
                setValue("isAvailable", e.target.checked, {
                  shouldValidate: true,
                })
              }
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <label htmlFor="isAvailable" className="text-sm">
              Tampil di publik (
              <code className="rounded bg-secondary px-1 text-[10px]">
                is_available
              </code>
              )
            </label>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Matikan = produk <strong>disembunyikan</strong> dari /katalog &
            detail (404). Aktif = produk muncul; pakai badge <em>Sold Out</em> di
            atas kalau hanya ingin menonaktifkan tombol order.
          </p>
        </div>

        {/* === Section: Gambar Produk ================================== */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>Gambar produk</Label>
            <p className="text-[11px] text-muted-foreground">
              Format: JPG, PNG, WEBP. Maksimal 3MB per file.
            </p>
          </div>

          {/* File picker + tombol */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border/70 bg-secondary/30 p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_MIME}
              multiple
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
              id="product-image-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Pilih file gambar
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Bisa pilih beberapa file sekaligus. Gambar pertama akan
              menjadi cover produk.
            </p>
          </div>

          {/* Preview thumbnail */}
          {imageList.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {imageList.map((src, idx) => (
                <li
                  key={`${src}-${idx}`}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-secondary"
                >
                  <Image
                    src={src}
                    alt={`Preview ${idx + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 200px"
                    className="object-cover"
                    unoptimized={src.startsWith("data:")}
                  />
                  {idx === 0 && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
                      <Star className="h-3 w-3" />
                      Cover
                    </span>
                  )}
                  <div className="absolute inset-x-2 bottom-2 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    {idx > 0 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        onClick={() => handleSetCover(idx)}
                        aria-label="Jadikan cover"
                        title="Jadikan cover"
                        className="h-7 w-7"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => handleRemoveImage(idx)}
                      aria-label="Hapus gambar"
                      title="Hapus gambar dari daftar"
                      className="h-7 w-7"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-background p-8 text-center">
              <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-secondary">
                <Image
                  src={PLACEHOLDER}
                  alt="Placeholder"
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <ImagePlus className="h-3.5 w-3.5" />
                Belum ada gambar. Pilih file di atas atau tempel URL di bawah.
              </p>
            </div>
          )}

          {/* Fallback opsional: URL manual */}
          <details className="rounded-xl border border-border/60 bg-background/60 p-3">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              Atau tempel URL gambar manual (lanjut)
            </summary>
            <div className="mt-3 space-y-2">
              <Textarea
                id="images"
                rows={3}
                placeholder="https://...&#10;https://..."
                {...register("images")}
              />
              <p className="text-[11px] text-muted-foreground">
                Satu URL per baris. URL hasil upload juga muncul di sini —
                edit hati-hati.
              </p>
              {errors.images && (
                <p className="text-xs text-destructive">
                  {errors.images.message}
                </p>
              )}
            </div>
          </details>
        </div>
        {/* === /Section: Gambar Produk ================================ */}

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea id="description" rows={5} {...register("description")} />
          {errors.description && (
            <p className="text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4" />
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploading}>
          <Save className="h-4 w-4" />
          {isUploading
            ? "Tunggu upload selesai..."
            : initial
              ? "Update produk"
              : "Simpan produk"}
        </Button>
      </div>
    </form>
  );
}
