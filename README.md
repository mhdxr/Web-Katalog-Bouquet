# 🌸 Mushida — Web Katalog Bouquet

Aplikasi web katalog profesional untuk toko bouquet/bucket bunga dengan fitur order via WhatsApp, custom request, dan **production admin dashboard** berbasis Supabase. Dibangun dengan stack modern dan siap deploy ke Vercel.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Fitur Utama

- **Landing page elegan** — hero, produk unggulan, kategori, testimoni, cara order, footer.
- **Katalog responsif** — grid produk, search, filter kategori & rentang harga, badge (Best Seller / New / Sold Out), empty state.
- **Detail produk** — gallery gambar (dengan fallback placeholder), deskripsi, status ketersediaan, tombol order WhatsApp, produk terkait.
- **Custom order page** — form Zod-validated, submit langsung mengarah ke WhatsApp dengan pesan otomatis.
- **Production admin dashboard** — Supabase Auth (`signInWithPassword`) + whitelist `admin_users`. CRUD produk langsung tersimpan ke Supabase, dan setiap perubahan men-trigger `revalidateTag("products")` + revalidasi path slug terkait sehingga `/katalog` & `/produk/[slug]` langsung fresh tanpa redeploy.
- **SEO friendly** — metadata + Open Graph + Twitter card + JSON-LD per produk, datanya di-fetch dari Supabase di Server Component.
- **UI premium** — palette soft pink, cream, gold; mobile-first; animasi halus dengan Framer Motion.

## 🛠️ Tech Stack

| Layer        | Library                                       |
| ------------ | --------------------------------------------- |
| Framework    | Next.js 14 (App Router)                       |
| Language     | TypeScript                                    |
| Styling      | Tailwind CSS + shadcn/ui                      |
| Animation    | Framer Motion                                 |
| Form         | React Hook Form + Zod                         |
| Icons        | Lucide React                                  |
| Fonts        | Inter + Playfair Display (next/font)          |

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Konfigurasi environment

Salin `.env.example` menjadi `.env.local` lalu isi nilainya:

```bash
cp .env.example .env.local
```

```env
# WhatsApp tujuan order (format internasional tanpa "+").
NEXT_PUBLIC_WHATSAPP_NUMBER=6285713254800

# URL produksi (untuk SEO + JSON-LD).
NEXT_PUBLIC_SITE_URL=https://mushida-craft.vercel.app

# Email admin (placeholder login saja — autentikasi sebenarnya pakai Supabase Auth).
ADMIN_EMAIL=admin@mushida.me

# Supabase (WAJIB untuk admin & data produk live).
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...   # anon/publishable key, bukan service role

# Sosial media (opsional, kosongkan untuk pakai default mushida.id).
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/mushida.id
NEXT_PUBLIC_FACEBOOK_URL=https://facebook.com/mushida.id
```

> **Catatan**:
> - `NEXT_PUBLIC_WHATSAPP_NUMBER` harus format internasional tanpa `+` (contoh: `6285713254800`). Di production env ini **wajib valid** — jika kosong / format salah, helper akan **throw error**. Di development boleh dikosongkan; otomatis pakai nomor dummy.
> - `NEXT_PUBLIC_SUPABASE_*` ambil dari Supabase Dashboard → **Settings → API**. Pakai **anon/publishable key**, bukan service role. Service role tidak boleh di-set di env `NEXT_PUBLIC_*` karena akan ter-expose ke browser.
> - Setup tabel + RLS: jalankan `supabase/schema.sql` lalu `supabase/seed.sql` di Supabase SQL Editor (lihat bagian [Setup Supabase](#-setup-supabase)).

### 3. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### 4. Build & start production

```bash
npm run build
npm run start
```

---

## 📁 Struktur Folder

```
src/
├── app/                       # Next.js App Router (pages, API, sitemap, robots)
├── components/
│   ├── admin/                 # LoginForm, ProductForm, ProductTable, AdminDashboard
│   ├── catalog/               # Filters, empty state, catalog view
│   ├── common/                # SectionHeading, WhatsAppFab, dll.
│   ├── custom-order/          # Custom order form
│   ├── home/                  # Hero, featured, kategori, testimoni, cara order
│   ├── layout/                # Navbar, Footer
│   ├── product/               # ProductCard, ProductGrid, Gallery, OrderButton
│   └── ui/                    # shadcn/ui primitives
├── config/
│   └── site.ts                # ⭐ Brand config terpusat (siteConfig + siteTitle)
├── data/                      # Seed produk, kategori, testimoni
├── hooks/
│   └── use-products.ts        # Memakai chooseProductRepository()
├── lib/
│   ├── auth.ts                # Server-side admin guard (Supabase Auth + admin_users)
│   ├── product-store.ts       # Re-export tipis dari repositories (backward compat)
│   ├── repositories/          # ⭐ Layer data
│   │   ├── types.ts                          # Interface ProductRepository
│   │   ├── local-storage-product-repository.ts  # fallback dev
│   │   ├── supabase-product-repository.ts       # implementasi production
│   │   └── index.ts                             # Factory chooseProductRepository()
│   ├── server/
│   │   └── products.ts        # ⭐ Fetcher RSC (cookieless anon → static-friendly)
│   ├── supabase/
│   │   ├── client.ts          # Browser client (signIn / signOut / RT subscriptions)
│   │   ├── server.ts          # Server client (baca cookie sesi)
│   │   ├── anon-server.ts     # Anon cookieless client (build-time + sitemap)
│   │   ├── proxy.ts           # Refresh sesi di edge middleware
│   │   ├── env.ts             # Validator env Supabase
│   │   └── types.ts           # Mapping snake_case ↔ camelCase
│   ├── utils.ts
│   ├── validations.ts         # Schema Zod (productSchema pakai sentinel "none")
│   └── whatsapp.ts            # URL builder + validator nomor
├── middleware.ts              # ⭐ Refresh Supabase session per request
└── types/
public/
└── images/
    └── placeholder-bouquet.svg   # ⭐ Fallback image saat URL kosong
supabase/
├── schema.sql                 # ⭐ Tabel + RLS + trigger updated_at
└── seed.sql                   # ⭐ 12 produk awal
```

---

## 🔐 Production Admin Dashboard

URL: `/admin/login`

Login pakai akun yang sudah dibuat di **Supabase Auth** dan terdaftar di tabel `admin_users`. Setelah login, kamu bisa:

- ✅ Tambah / edit / hapus produk — langsung tersimpan ke Supabase.
- ✅ Set badge (Best Seller / New / Sold Out).
- ✅ Toggle visibilitas publik (`is_available`) — lihat [Hidden vs Sold Out](#-hidden-vs-sold-out) di bawah.
- ✅ Logout via `supabase.auth.signOut()`.

**Cara membuat admin pertama:**

1. Buka Supabase Dashboard → **Authentication → Users → Add user** (Send invite OFF supaya bisa langsung set password). Catat user `id` (UUID).
2. Buka **SQL Editor** dan jalankan:

   ```sql
   insert into public.admin_users (user_id, email)
   values ('PASTE-UUID-DI-SINI', 'admin@mushida.me');
   ```

3. Login di `/admin/login` pakai email + password user tersebut.

> **Keamanan**: Session disimpan di cookie `sb-*` yang di-handle Supabase + middleware Next.js (`src/middleware.ts`). Tidak ada session di `localStorage`. Server guard (`getAdminUser()` di `src/lib/auth.ts`) memvalidasi user via `supabase.auth.getUser()` + lookup ke tabel `admin_users` di setiap request `/admin/dashboard`. RLS di tabel `products` jadi guard terakhir untuk operasi tulis.

---

## 👁️ Hidden vs Sold Out

Dua state yang sering tertukar — di Mushida keduanya **eksplisit dipisah**:

| Kondisi                                       | Tampil di `/katalog`?     | `/produk/[slug]` publik | Tombol order        | Use case                                     |
| --------------------------------------------- | ------------------------- | ----------------------- | ------------------- | -------------------------------------------- |
| `is_available = true` & `badge ≠ "sold-out"`  | ✅ Tampil                 | ✅ 200 OK               | ✅ Aktif            | Produk normal & ready order.                 |
| `is_available = true` & `badge = "sold-out"`  | ✅ Tampil                 | ✅ 200 OK (status Sold Out) | ❌ Disabled     | Stok habis sementara, biar tetap kelihatan supaya pengunjung tahu produknya ada. |
| `is_available = false` (badge apapun)         | ❌ Disembunyikan          | ❌ 404                  | —                   | Draft, produk lama, produk yang sudah tidak dijual. |

**Cara kerja di balik layar:**

- Visibility ditegakkan di **RLS Supabase**: anonim/publik hanya boleh `SELECT` row dengan `is_available = true`. Jadi kalau admin men-set `is_available = false`, query publik (`fetchAllProducts`, `fetchProductBySlug`, sitemap) tidak akan mendapatkan row tersebut → otomatis hilang dari katalog dan slug detail jadi `notFound() / 404`.
- Sold-out hanya berdasar field `badge`. Tombol order di `/produk/[slug]` & `<OrderButton>` di-disable kalau `badge === "sold-out"` (atau secara teknis `is_available = false`, walau case ini publik tidak pernah lihat).
- Sitemap (`/sitemap.xml`) ikut RLS — produk hidden otomatis tidak muncul di sitemap.

**Aksi admin:**

- Sembunyikan produk dari publik → matikan checkbox **"Tampil di publik"** di form produk (`is_available = false`).
- Tandai stok habis tapi tetap pamer → set badge **"Sold Out"** dan biarkan checkbox **"Tampil di publik"** tetap aktif.

---

## 🔁 Cache & Revalidation

Halaman publik di-render via Server Component dengan ISR (`revalidate = 60`) plus `unstable_cache` ber-tag `"products"`. Setelah admin create/update/delete, dashboard memanggil Server Action `revalidateProducts({ slugs })` yang melakukan:

- `revalidateTag("products")` — meng-invalidate semua entri `unstable_cache` yang men-tag `products` (list, by-slug, featured, related).
- `revalidatePath("/", "page")` & `revalidatePath("/katalog", "page")` — refresh landing & katalog.
- `revalidatePath("/produk/[slug]", "page")` — refresh seluruh detail produk yang sudah pernah di-render.
- `revalidatePath("/sitemap.xml")` — sitemap ikut fresh.
- `revalidatePath("/produk/<slug>", "page")` untuk slug spesifik — wajib saat **rename slug** (slug lama & baru) dan saat **delete** (slug lama langsung 404).

Server Action `revalidateProducts` di-guard dengan `getAdminUser()` (Supabase Auth + tabel `admin_users`) supaya tidak bisa dipanggil non-admin. Kegagalan revalidate ditampilkan ke admin via toast error sehingga admin tahu kalau perlu refresh manual.

---

## 💾 Data Layer

Implementasi data product memakai pattern **Repository**. Interface di `src/lib/repositories/types.ts`:

```ts
export interface ProductRepository {
  list(): Promise<Product[]>;
  getById(id: string): Promise<Product | undefined>;
  getBySlug(slug: string): Promise<Product | undefined>;
  create(input: Omit<Product, "id" | "createdAt">): Promise<Product>;
  update(id: string, input: Partial<Product>): Promise<Product | undefined>;
  remove(id: string): Promise<void>;
  reset(): Promise<void>;
}
```

Adapter yang tersedia:

- `supabaseProductRepository` — **default di production**. Bekerja di atas browser client (admin) maupun anon server client (public). Mapping snake_case ↔ camelCase ada di `src/lib/supabase/types.ts`.
- `localStorageProductRepository` — fallback dev kalau env Supabase belum di-set.

Server Components & sitemap memakai `src/lib/server/products.ts` yang berbasis **anon cookieless client** supaya halaman publik tetap bisa di-prerender statis. Operasi admin pakai browser/server client biasa yang membaca cookie sesi.

---

## 🗄️ Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor** lalu jalankan:
   - `supabase/schema.sql` — bikin tabel `admin_users` + `products`, trigger `updated_at`, **semua RLS policy** (database + storage).
   - `supabase/seed.sql` — masukkan 12 produk awal (idempoten, aman dijalankan ulang).
3. Buat bucket Storage `product-images` (lihat [Setup Supabase Storage](#-setup-supabase-storage)).
4. Buat user admin pertama (lihat bagian [Production Admin Dashboard](#-production-admin-dashboard)).
5. Salin URL + anon key ke `.env.local` / Vercel.

**RLS yang aktif di `products`:**

| Policy                              | Role             | Aksi                                                  |
| ----------------------------------- | ---------------- | ----------------------------------------------------- |
| `products_anon_select_available`    | anon             | SELECT hanya kalau `is_available = true`              |
| `products_user_select_available`    | authenticated    | SELECT semua jika admin, else hanya available         |
| `products_admin_insert/update/delete` | authenticated  | CRUD penuh, hanya jika `is_admin()` = true            |

`is_admin()` adalah `SECURITY DEFINER` function yang mengecek keberadaan `auth.uid()` di tabel `admin_users`.

---

## 🖼️ Setup Supabase Storage

Gambar produk di-upload langsung dari admin dashboard ke **Supabase Storage** (bucket `product-images`). Public read terbuka untuk semua orang; INSERT/UPDATE/DELETE dibatasi ke admin (cek `public.is_admin()`).

### 1. Bikin bucket

Supabase Dashboard → **Storage** → **New bucket**:

| Field                     | Nilai                                                |
| ------------------------- | ---------------------------------------------------- |
| **Name**                  | `product-images`                                     |
| **Public bucket**         | ✅ ON (supaya `getPublicUrl()` bisa diakses publik) |
| **File size limit**       | `3 MB` (opsional — server juga memvalidasi)          |
| **Allowed MIME types**    | `image/jpeg, image/png, image/webp` (opsional)       |

> **Kenapa public bucket?** Halaman katalog publik perlu menampilkan gambar tanpa auth. RLS object-level di bawah yang mengunci tulisan ke admin saja, jadi public bucket tidak berarti siapa pun bisa upload.

### 2. Apply policy storage

Policy SQL sudah ada di `supabase/schema.sql` bagian `7. STORAGE`. Kalau kamu menjalankan ulang `schema.sql`, policy ikut ter-apply. Kalau hanya ingin policy storage saja, copy-paste blok di bawah ke **SQL Editor**:

```sql
-- Public read
drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-images');

-- Admin INSERT
drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

-- Admin UPDATE
drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

-- Admin DELETE
drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin());
```

### 3. Whitelist hostname di Next.js

Setelah bucket aktif, `next.config.mjs` otomatis menambahkan hostname Supabase Storage ke `images.remotePatterns` berdasarkan `NEXT_PUBLIC_SUPABASE_URL`. Pathname dibatasi ke `/storage/v1/object/public/product-images/**` — tidak ada wildcard global yang bisa menyalahgunakan optimizer Next/Image.

Pastikan env `NEXT_PUBLIC_SUPABASE_URL` sudah di-set saat build, supaya pattern-nya ter-include.

### 4. Aturan upload

| Aturan                  | Nilai                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| Format file             | JPG, PNG, WEBP                                                                                 |
| Ukuran maksimum         | **3 MB per file**                                                                              |
| Object path             | `products/{timestamp}-{random}-{stem}.{ext}` (di-generate server, nama asli di-sanitasi)        |
| Authorization upload    | Server Action `uploadProductImage` → `getAdminUser()` + RLS storage (`public.is_admin()`)       |
| Service role key        | **TIDAK pernah dipakai** — server cuma anon key + cookie sesi admin                            |

Server Action upload-nya ada di `src/app/admin/upload-actions.ts`. UI-nya di `src/components/admin/product-form.tsx`. Lihat bagian [Production Admin Dashboard](#-production-admin-dashboard) untuk alur kerjanya.

---

## 📣 Sosial Media

Profil sosial media Mushida ditampilkan di footer (icon row + inline list di kolom Kontak) dan di section **Cara Order** sebagai CTA. Semuanya membaca dari `siteConfig.socialLinks` di `src/config/site.ts` — jangan hardcode URL Instagram/Facebook di komponen lain.

| Platform  | Default URL                              | Override env                    |
| --------- | ---------------------------------------- | ------------------------------- |
| Instagram | `https://instagram.com/mushida.id`       | `NEXT_PUBLIC_INSTAGRAM_URL`     |
| Facebook  | `https://facebook.com/mushida.id`        | `NEXT_PUBLIC_FACEBOOK_URL`      |

Komponen reusable: `<SocialLinks variant="icon" />` (default — bulat icon-only) dan `<SocialLinks variant="inline" />` (icon + handle text). URL kosong otomatis di-filter di config sehingga tidak perlu cek manual di komponen.

JSON-LD `Store` di `src/app/layout.tsx` ikut menambahkan `sameAs: [instagramUrl, facebookUrl]` (filtered) supaya search engine bisa kaitkan brand ke profile sosialnya.

---

## 📱 Order via WhatsApp

Di `src/lib/whatsapp.ts`:

- `buildProductOrderMessage(product)` — pesan order produk.
- `buildCustomOrderMessage(form)` — pesan custom request.
- `buildWhatsAppUrl(message)` — generate URL `wa.me/...`.
- `isValidWhatsAppNumber(input)` / `normalizeWhatsAppNumber(input)` — validator + helper format.

Nomor tujuan di-resolve `getWhatsAppNumber()`:
1. Pakai `NEXT_PUBLIC_WHATSAPP_NUMBER` kalau valid.
2. Di **production**, env wajib di-set & valid. Bila tidak: helper **throw `Error`** dengan pesan jelas (gagal saat build/runtime, tidak silent-fallback).
3. Di **development**, fallback ke nomor dummy supaya UI tetap bisa dicoba.

Validator: `isValidWhatsAppNumber(input)` cek format `^[1-9]\d{7,14}$` setelah `normalizeWhatsAppNumber()` (strip `+`, spasi, tanda hubung; konversi prefix `0` → `62`).

---

## 🛡️ Production Readiness Notes

- **Auth & data sudah production**: dashboard `/admin/dashboard` pakai Supabase Auth + RLS. Tidak ada session di `localStorage`. Perubahan produk dari admin langsung tampil di `/katalog` dan `/produk/[slug]` (RSC + ISR).
- **Service role key**: jangan pernah ditaruh di env `NEXT_PUBLIC_*`. Aplikasi ini cukup pakai anon/publishable key — semua otorisasi di-enforce oleh RLS.
- **Image storage**: gambar produk yang baru di-upload dari admin disimpan di **Supabase Storage** bucket `product-images` (lihat [Setup Supabase Storage](#-setup-supabase-storage)). Hostname Supabase otomatis di-whitelist di `next.config.mjs` lewat `NEXT_PUBLIC_SUPABASE_URL`. Seed Unsplash di `src/data/products.ts` masih dipakai untuk demo lokal — boleh di-replace setelah semua produk pakai Storage.
- **WhatsApp env wajib valid** di production — `getWhatsAppNumber()` akan throw `Error` saat build/runtime kalau env kosong / format salah.
- **Backup**: aktifkan Point-in-Time Recovery di Supabase (paid plan) atau jadwalkan dump berkala via `pg_dump` jika datanya sudah krusial.

## 🔒 Security Headers

`next.config.mjs` memasang baseline headers untuk semua route:

| Header                  | Nilai                                            |
| ----------------------- | ------------------------------------------------ |
| X-Frame-Options         | `DENY` (cegah clickjacking)                      |
| X-Content-Type-Options  | `nosniff`                                        |
| Referrer-Policy         | `strict-origin-when-cross-origin`                |
| Permissions-Policy      | `camera=(), microphone=(), geolocation=()`       |

Longgarkan kalau perlu fitur tertentu, jangan pukul rata.

## 🧪 CI

Workflow GitHub Actions di `.github/workflows/ci.yml` menjalankan `npm ci`, `npm run lint`, `npm run type-check`, dan `npm run build` untuk setiap push & PR ke `main`/`master`.

---

## ☁️ Deploy ke Vercel

1. Push repo ke GitHub.
2. Import project di [vercel.com](https://vercel.com).
3. Set environment variables sesuai `.env.example`.
4. Deploy.

---

## 🎨 Design System

**Color palette** (dapat diubah di `tailwind.config.ts` & `globals.css`):

| Token        | Nilai             | Penggunaan                    |
| ------------ | ----------------- | ----------------------------- |
| `primary`    | Soft pink (#f76e8c) | CTA, badge best-seller      |
| `accent`     | Gold (#c69c4f)    | Tag "New", highlight          |
| `cream`      | #fffdf8 / #fdf6e9 | Background lembut, footer     |
| `background` | #fffaf6           | Body                          |

**Typography**:

- **Sans**: Inter — body, UI
- **Serif**: Playfair Display — heading, brand

---

## 📜 Scripts

| Script               | Deskripsi                          |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Jalankan development server        |
| `npm run build`      | Build production                   |
| `npm run start`      | Jalankan production server         |
| `npm run lint`       | ESLint check                       |
| `npm run type-check` | TypeScript check tanpa emit        |

---

## 📄 License

MIT — silakan pakai dan modifikasi untuk kebutuhan toko bouquet kamu. 🌷
