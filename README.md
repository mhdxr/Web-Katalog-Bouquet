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
- **Production admin dashboard** — Supabase Auth (`signInWithPassword`) + whitelist `admin_users`. CRUD produk langsung tersimpan ke Supabase dan terlihat di `/katalog` real-time.
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
- ✅ Toggle ketersediaan (`is_available`) → mempengaruhi visibility di `/katalog`.
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
   - `supabase/schema.sql` — bikin tabel `admin_users` + `products`, trigger `updated_at`, dan **semua RLS policy**.
   - `supabase/seed.sql` — masukkan 12 produk awal (idempoten, aman dijalankan ulang).
3. Buat user admin pertama (lihat bagian [Production Admin Dashboard](#-production-admin-dashboard)).
4. Salin URL + anon key ke `.env.local` / Vercel.

**RLS yang aktif di `products`:**

| Policy                              | Role             | Aksi                                                  |
| ----------------------------------- | ---------------- | ----------------------------------------------------- |
| `products_anon_select_available`    | anon             | SELECT hanya kalau `is_available = true`              |
| `products_user_select_available`    | authenticated    | SELECT semua jika admin, else hanya available         |
| `products_admin_insert/update/delete` | authenticated  | CRUD penuh, hanya jika `is_admin()` = true            |

`is_admin()` adalah `SECURITY DEFINER` function yang mengecek keberadaan `auth.uid()` di tabel `admin_users`.

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
- **Image storage**: seed produk masih pakai Unsplash. Sebelum production yang serius, ganti `next.config.mjs` `images.remotePatterns` ke hostname storage final (Supabase Storage / Cloudinary / S3) lalu update URL gambar di tabel `products`.
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
