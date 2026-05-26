# 🌸 Bloomera — Web Katalog Bouquet

Aplikasi web katalog profesional untuk toko bouquet/bucket bunga dengan fitur order via WhatsApp, custom request, dan admin dashboard sederhana. Dibangun dengan stack modern dan siap deploy ke Vercel.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Fitur Utama

- **Landing page elegan** — hero, produk unggulan, kategori, testimoni, cara order, footer
- **Katalog responsif** — grid produk, search, filter kategori & rentang harga, badge (Best Seller / New / Sold Out), empty state
- **Detail produk** — gallery gambar, deskripsi, status ketersediaan, tombol order WhatsApp, produk terkait
- **Custom order page** — form lengkap (Zod-validated), submit langsung mengarahkan ke WhatsApp dengan pesan otomatis
- **Admin dashboard** — login email/password dari env, CRUD produk dengan localStorage (siap migrasi ke Firebase/Supabase)
- **SEO friendly** — metadata lengkap, Open Graph, dynamic per-produk
- **UI premium** — palette soft pink, cream, gold; mobile-first; animasi halus dengan Framer Motion

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
ADMIN_EMAIL=admin@bloomera.id
ADMIN_PASSWORD=changeme123
NEXT_PUBLIC_SITE_URL=https://bloomera.vercel.app
```

> **Catatan**: `NEXT_PUBLIC_WHATSAPP_NUMBER` menggunakan format internasional tanpa tanda `+` (contoh: `6281234567890`).

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
├── app/                      # Next.js App Router
│   ├── admin/
│   │   ├── login/            # /admin/login
│   │   ├── dashboard/        # /admin/dashboard
│   │   └── page.tsx          # redirect ke /admin/login
│   ├── api/
│   │   └── admin/login/      # POST /api/admin/login (cek kredensial dari env)
│   ├── custom-order/         # /custom-order
│   ├── katalog/              # /katalog
│   ├── produk/[slug]/        # /produk/:slug (SSG)
│   ├── globals.css
│   ├── layout.tsx            # Root layout + SEO metadata
│   ├── not-found.tsx
│   └── page.tsx              # Landing page
├── components/
│   ├── admin/                # Login form, product form, table, dashboard
│   ├── catalog/              # Filters, empty state, catalog view
│   ├── common/               # SectionHeading, dll.
│   ├── custom-order/         # Custom order form
│   ├── home/                 # Hero, featured, kategori, testimoni, cara order
│   ├── layout/               # Navbar, Footer
│   ├── product/              # ProductCard, ProductGrid, Gallery, OrderButton
│   └── ui/                   # shadcn/ui primitives (Button, Input, dll.)
├── data/
│   ├── categories.ts         # Master kategori
│   ├── products.ts           # 12 produk dummy + helpers
│   └── testimonials.ts
├── hooks/
│   └── use-products.ts       # Hook CRUD ke ProductRepository
├── lib/
│   ├── auth.ts               # Session admin di localStorage
│   ├── product-store.ts      # ProductRepository + localStorage adapter
│   ├── utils.ts              # cn, formatCurrency, slugify, truncate
│   ├── validations.ts        # Skema Zod (custom order, login, product)
│   └── whatsapp.ts           # Builder URL & pesan WA
└── types/
    └── index.ts              # Type definitions
```

---

## 🔐 Admin Dashboard

URL: `/admin/login`

Login menggunakan kredensial dari `.env.local`:

- `ADMIN_EMAIL` — email admin
- `ADMIN_PASSWORD` — password admin

Setelah login, kamu bisa:

- ✅ Tambah / edit / hapus produk
- ✅ Set badge (Best Seller / New / Sold Out)
- ✅ Toggle ketersediaan
- ✅ Reset data ke seed default

> **Penting**: Saat ini autentikasi menggunakan validasi server-side sederhana via API route + session di localStorage. **Untuk production, ganti dengan auth provider proper** (NextAuth, Clerk, atau Firebase/Supabase Auth).

---

## 💾 Data Layer & Migrasi ke Database

Saat ini data produk disimpan di **localStorage** browser, di-seed dari `src/data/products.ts`.

Struktur data terabstraksi melalui `ProductRepository` interface di `src/lib/product-store.ts`:

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

### Migrasi ke Firebase / Supabase

Cukup buat implementasi baru dari interface tersebut, contoh:

```ts
// src/lib/product-store-firebase.ts
export const firebaseProductRepository: ProductRepository = {
  async list() { /* query firestore */ },
  async create(input) { /* addDoc */ },
  // ...
};
```

Lalu ganti import `localProductRepository` di `src/hooks/use-products.ts`. Komponen UI tidak perlu diubah.

---

## 📱 Order via WhatsApp

Tombol "Order via WhatsApp" otomatis membuka WhatsApp dengan pesan terformat. Lihat `src/lib/whatsapp.ts`:

- `buildProductOrderMessage(product)` — pesan order produk
- `buildCustomOrderMessage(form)` — pesan custom request
- `buildWhatsAppUrl(message)` — generate URL `wa.me/...`

Nomor tujuan diambil dari `NEXT_PUBLIC_WHATSAPP_NUMBER`.

---

## ☁️ Deploy ke Vercel

1. Push repo ke GitHub
2. Import project di [vercel.com](https://vercel.com)
3. Set environment variables sesuai `.env.example`
4. Deploy 🚀

Build sudah diverifikasi:

- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 errors
- ✅ Production build sukses (22 static pages)

---

## 🎨 Design System

**Color palette** (dapat diubah di `tailwind.config.ts` & `globals.css`):

| Token        | Nilai            | Penggunaan                    |
| ------------ | ---------------- | ----------------------------- |
| `primary`    | Soft pink (#f76e8c) | CTA, badge best-seller    |
| `accent`     | Gold (#c69c4f)   | Tag "New", highlight          |
| `cream`      | #fffdf8 / #fdf6e9 | Background lembut, footer    |
| `background` | #fffaf6          | Body                          |

**Typography**:

- **Sans**: Inter — body, UI
- **Serif**: Playfair Display — heading, brand

---

## 📜 Scripts

| Script             | Deskripsi                          |
| ------------------ | ---------------------------------- |
| `npm run dev`      | Jalankan development server        |
| `npm run build`    | Build production                   |
| `npm run start`    | Jalankan production server         |
| `npm run lint`     | ESLint check                       |
| `npm run type-check` | TypeScript check tanpa emit      |

---

## 📄 License

MIT — silakan pakai dan modifikasi untuk kebutuhan toko bouquet kamu. 🌷
