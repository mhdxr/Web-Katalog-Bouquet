"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";

/**
 * =====================================================================
 * Upload gambar produk — Server Action (admin only)
 * =====================================================================
 * File ini meng-handle upload gambar produk ke Supabase Storage bucket
 * `product-images`. Semua operasi:
 *
 *  1. Diawali cek admin via `getAdminUser()` — cookie sesi Supabase Auth
 *     + lookup tabel `admin_users`. Non-admin langsung ditolak.
 *  2. Memakai client server (anon key) yang membaca cookie sesi admin —
 *     RLS Storage akan menolak INSERT/UPDATE/DELETE kalau kita salah
 *     memanggil dari sesi non-admin. KITA TIDAK PERNAH PAKAI SERVICE
 *     ROLE KEY di sini.
 *  3. Validasi tipe file (MIME + ekstensi) dan ukuran file (≤ 3 MB).
 *  4. Generate object path acak supaya nama file tidak bisa di-tebak
 *     atau di-collide oleh admin lain.
 *
 * Bucket `product-images` harus dibuat manual sekali saja di Supabase
 * Dashboard → Storage → New bucket (lihat README.md → "Setup Supabase
 * Storage"), dengan policy SQL yang ada di `supabase/schema.sql`.
 * =====================================================================
 */

const BUCKET = "product-images";
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB

/**
 * MIME type yang diperbolehkan untuk gambar produk.
 *
 * Penting: kita TIDAK boleh hanya percaya MIME type yang dikirim
 * browser (mudah dipalsukan). Karena itu kita pasangkan dengan whitelist
 * ekstensi di `EXT_BY_MIME` agar nama file akhir di Supabase Storage
 * pasti memiliki ekstensi yang sesuai.
 */
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedMime = (typeof ALLOWED_MIME)[number];

/** Mapping MIME → ekstensi file yang dipakai untuk path object. */
const EXT_BY_MIME: Record<AllowedMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Mapping ekstensi (lowercase) yang dianggap match dengan MIME tertentu. */
const VALID_EXT_BY_MIME: Record<AllowedMime, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

export interface UploadProductImageResult {
  ok: boolean;
  /** Public URL di Supabase Storage (kalau sukses). */
  url?: string;
  /** Object path relatif terhadap bucket (kalau sukses). */
  path?: string;
  /** Pesan error human-readable (kalau gagal). */
  error?: string;
}

/**
 * Sanitasi nama file dari user.
 *
 * - Lowercase + buang path traversal (`..`, `/`, `\`).
 * - Sisakan hanya alfanumerik, dash, underscore, titik.
 * - Pangkas panjang supaya path tidak meledak.
 *
 * NOTE: nama hasil sanitasi TIDAK kita pakai sebagai object path utama
 * (kita pakai random ID), tapi kita tetap sanitize untuk berjaga-jaga
 * kalau di masa depan ingin menyimpan nama asli sebagai metadata.
 */
function sanitizeFileNameStem(name: string): string {
  const stem = name
    .toLowerCase()
    .replace(/[\\/]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 40);
  return stem || "image";
}

/** Generate suffix random pendek untuk object path. */
function randomSuffix(): string {
  // 8 byte hex (16 char) cukup untuk anti-collision tanpa keluar dari
  // batasan panjang path Supabase (1024 byte).
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Server Action: upload satu gambar produk.
 *
 * Konvensi:
 *  - FormData harus berisi field `file` (Blob/File).
 *  - Return `{ ok: true, url, path }` saat sukses.
 *  - Return `{ ok: false, error }` dengan pesan jelas saat gagal.
 *  - Jangan pernah throw — caller (client) akan men-handle pesan error
 *    via toast.
 */
export async function uploadProductImage(
  formData: FormData,
): Promise<UploadProductImageResult> {
  // --- 1. Admin guard ----------------------------------------------------
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false, error: "UNAUTHORIZED" };
  }

  // --- 2. Ambil & validasi file -----------------------------------------
  const raw = formData.get("file");
  if (!raw || !(raw instanceof Blob)) {
    return { ok: false, error: "Field 'file' tidak ditemukan." };
  }
  const file = raw as File;

  if (file.size <= 0) {
    return { ok: false, error: "File kosong." };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: `Ukuran file melebihi batas (${(MAX_BYTES / 1024 / 1024).toFixed(0)} MB).`,
    };
  }

  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED_MIME.includes(mime as AllowedMime)) {
    return {
      ok: false,
      error: "Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.",
    };
  }

  // Validasi ekstensi dari nama asli supaya tidak hanya percaya MIME.
  const originalName = typeof file.name === "string" ? file.name : "";
  const dot = originalName.lastIndexOf(".");
  const rawExt =
    dot >= 0 ? originalName.slice(dot + 1).toLowerCase() : "";
  const validExts = VALID_EXT_BY_MIME[mime as AllowedMime];
  if (!rawExt || !validExts.includes(rawExt)) {
    return {
      ok: false,
      error: "Ekstensi file tidak cocok dengan tipe gambar.",
    };
  }

  // --- 3. Build object path aman ---------------------------------------
  const ext = EXT_BY_MIME[mime as AllowedMime];
  const stem = sanitizeFileNameStem(originalName.slice(0, dot >= 0 ? dot : originalName.length));
  const objectPath = `products/${Date.now()}-${randomSuffix()}-${stem}.${ext}`;

  // --- 4. Upload ke Supabase Storage -----------------------------------
  // Pakai server client biasa — RLS storage.objects akan men-cek admin
  // via fungsi `public.is_admin()` (lihat supabase/schema.sql). Service
  // role TIDAK kita pakai supaya bypass RLS tidak mungkin terjadi.
  const supabase = createSupabaseServerClient();

  // Convert File → ArrayBuffer supaya bisa dipakai server-side.
  const arrayBuf = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, bytes, {
      contentType: mime,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    // eslint-disable-next-line no-console
    console.error("[admin][upload] supabase error:", uploadError.message);
    // Pesan dari Supabase kadang teknis ("new row violates row-level
    // security policy"), kita ringkas untuk admin.
    const msg = /row-level security|not authorized|permission/i.test(
      uploadError.message,
    )
      ? "Tidak memiliki izin untuk upload (RLS). Pastikan akun admin sudah terdaftar."
      : `Gagal mengunggah file: ${uploadError.message}`;
    return { ok: false, error: msg };
  }

  // --- 5. Resolve public URL --------------------------------------------
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(objectPath);

  if (!urlData?.publicUrl) {
    return {
      ok: false,
      error: "Upload sukses tapi gagal mengambil public URL.",
    };
  }

  return { ok: true, url: urlData.publicUrl, path: objectPath };
}

/**
 * Server Action opsional: hapus object di Supabase Storage.
 *
 * Tidak dipanggil dari ProductForm saat ini — admin cukup menghapus URL
 * dari daftar `images` produk dan Supabase Storage akan menyimpan
 * file-nya (orphan). Disediakan untuk pemakaian future (mis. cleanup
 * job).
 *
 * Tetap admin-only via `getAdminUser` + RLS storage.
 */
export interface DeleteProductImageResult {
  ok: boolean;
  error?: string;
}

export async function deleteProductImage(
  path: string,
): Promise<DeleteProductImageResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "UNAUTHORIZED" };

  // Defensif: jangan menerima path absolut atau path traversal.
  if (
    !path ||
    typeof path !== "string" ||
    path.startsWith("/") ||
    path.includes("..")
  ) {
    return { ok: false, error: "Path tidak valid." };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    // eslint-disable-next-line no-console
    console.error("[admin][upload] delete error:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
