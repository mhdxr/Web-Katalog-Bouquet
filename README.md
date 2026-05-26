# 🌸 Mushida — Web Katalog Bouquet

Aplikasi web katalog profesional untuk toko bouquet/bucket bunga dengan fitur order via WhatsApp, custom request, dan demo admin dashboard. Dibangun dengan stack modern dan siap deploy ke Vercel.

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
- **Demo admin dashboard** — login email/password dari env, CRUD produk dengan localStorage. Diberi label "Demo Local Admin" agar tidak salah dianggap production.
- **SEO friendly** — metadata + Open Graph + Twitter card + JSON-LD, semuanya sentral di `siteConfig`.
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
NEXT_PUBLIC_WHATSAPP_NUMBER=6281234567890
ADMIN_EMAIL=admin@mushida.id
ADMIN_PASSWORD=changeme123
NEXT_PUBLIC_SITE_URL=https://mushida.vercel.app
```

> **Catatan**: `NEXT_PUBLIC_WHATSAPP_NUMBER` harus format internasional tanpa `+` (contoh: `6281234567890`). Di production, env wajib di-set; jika tidak valid, helper akan log warning dan tombol order tetap bisa diklik tetapi mengarah ke nomor dummy.

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
│   ├── auth.ts                # Session admin di localStorage
│   ├── product-store.ts       # Re-export tipis dari repositories (backward compat)
│   ├── repositories/          # ⭐ Layer data
│   │   ├── types.ts                          # Interface ProductRepository
│   │   ├── local-storage-product-repository.ts
│   │   ├── supabase-product-repository.ts    # STUB
│   │   └── index.ts                          # Factory chooseProductRepository()
│   ├── utils.ts
│   ├── validations.ts         # Schema Zod (productSchema pakai sentinel "none")
│   └── whatsapp.ts            # URL builder + validator nomor
└── types/
public/
└── images/
    └── placeholder-bouquet.svg   # ⭐ Fallback image saat URL kosong
```

---

## 🔐 Demo Admin Dashboard

URL: `/admin/login`

Login menggunakan kredensial dari `.env.local`:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Setelah login, kamu bisa:

- ✅ Tambah / edit / hapus produk
- ✅ Set badge (Best Seller / New / Sold Out)
- ✅ Toggle ketersediaan
- ✅ Reset data ke seed default

> **Penting**: Mode ini berlabel **Demo Local Admin**. Data produk hanya tersimpan di `localStorage` browser, hilang saat cache dibersihkan, dan tidak ter-sync antar user. Jangan dipakai sebagai admin production sebelum di-wire ke database (Supabase / Firebase) dan auth provider proper (NextAuth / Clerk / Firebase / Supabase Auth).

---

## 💾 Data Layer & Migrasi ke Database

Implementasi data product memakai pattern **Repository**. Interface di `src/lib/repositories/types.ts`:

```ts
export interface ProductRepository {
  list(): Promise<Product[]>;
  getById(id: string): Promise<Product | undefined>;
  create(input: Omit<Product, "id" | "createdAt">): Promise<Product>;
  update(id: string, input: Partial<Product>): Promise<Product | undefined>;
  remove(id: string): Promise<void>;
  reset(): Promise<void>;
}
```

Tiga adapter yang disediakan:

- `localStorageProductRepository` — default, data tersimpan di browser.
- `supabaseProductRepository` — **stub** (lihat komentar di file untuk panduan implementasi).
- `firebaseProductRepository` — boleh ditambahkan dengan pola yang sama.

Pemilihan dilakukan di `chooseProductRepository()` (lihat `src/lib/repositories/index.ts`). Database tidak diaktifkan kecuali env-nya tersedia, jadi aman dijalankan dengan config minimal.

---

## 📱 Order via WhatsApp

Di `src/lib/whatsapp.ts`:

- `buildProductOrderMessage(product)` — pesan order produk.
- `buildCustomOrderMessage(form)` — pesan custom request.
- `buildWhatsAppUrl(message)` — generate URL `wa.me/...`.
- `isValidWhatsAppNumber(input)` / `normalizeWhatsAppNumber(input)` — validator + helper format.

Nomor tujuan di-resolve `getWhatsAppNumber()`:
1. Pakai `NEXT_PUBLIC_WHATSAPP_NUMBER` jika valid.
2. Di production, log warning ke console kalau env tidak ada/invalid.
3. Di dev, fallback ke nomor dummy supaya UI tetap bisa dicoba.

---

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
