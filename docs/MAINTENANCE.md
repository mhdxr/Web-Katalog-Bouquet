# 🛠️ Mushida — Maintenance Documentation

Dokumentasi operasional untuk admin / pemilik toko Mushida. Pakai ini sebagai checklist rutin dan panduan saat ada hal yang perlu diperbaiki.

> Production URL: **https://mushida-craft.vercel.app**

---

## 📅 Routine Maintenance

Disarankan dijalankan minimal **seminggu sekali**, atau setelah ada perubahan besar (deploy baru, ubah env, restore database).

| # | Item | Cara cek |
|---|------|----------|
| 1 | Admin login | Buka `/admin/login`, login dengan akun admin → harus berhasil masuk ke `/admin/dashboard`. |
| 2 | CRUD produk | Tambah produk dummy → edit → hapus. Pastikan toast sukses dan list ter-update. |
| 3 | Upload gambar | Saat tambah/edit produk, klik **Pilih file gambar** → upload JPG/PNG/WEBP < 3MB. Preview muncul, gambar pertama di-tag **Cover**. |
| 4 | Katalog public | Buka `/` dan `/katalog` di **window incognito**. Produk available muncul, filter kategori & harga jalan. |
| 5 | Detail produk | Buka `/produk/<slug>` di incognito. Gambar tampil, tombol order WhatsApp jalan. |
| 6 | sitemap.xml | Buka `https://mushida-craft.vercel.app/sitemap.xml` → pastikan XML valid dan **hanya** berisi produk available + halaman statis. |
| 7 | WhatsApp link | Klik tombol **Order via WhatsApp** → `wa.me/<NEXT_PUBLIC_WHATSAPP_NUMBER>` terbuka dengan pesan terisi. |
| 8 | Supabase usage | Supabase Dashboard → **Settings → Usage**. Cek bandwidth, storage, dan database size masih di bawah quota plan. |
| 9 | Vercel deployment | Vercel Dashboard → Deployments. Latest deploy harus **Ready** (hijau), bukan **Error**. |

Catat hasilnya di catatan internal kalau perlu audit trail.

---

## 🌷 Product Maintenance

### Tambah produk

1. Login ke `/admin/dashboard`.
2. Klik **Tambah produk**.
3. Isi nama, harga, kategori, badge (opsional), deskripsi.
4. Klik **Pilih file gambar** → upload satu atau beberapa gambar (JPG/PNG/WEBP, ≤ 3 MB per file).
5. Gambar pertama otomatis jadi **Cover**. Klik ⭐ di gambar lain untuk pindah cover.
6. Centang **Tampil di publik** (default ON).
7. Klik **Simpan produk** → toast "Produk berhasil ditambahkan".

Produk akan muncul di `/katalog` dalam beberapa detik (revalidasi otomatis).

### Edit produk

1. Di tabel produk, klik tombol pensil (✏️) di baris produk.
2. Ubah field yang perlu.
3. Klik **Update produk**.

> Kalau **slug berubah** (karena nama diganti), URL lama (`/produk/<slug-lama>`) langsung 404 dan slug baru aktif. Server Action `revalidateProducts({slugs: [oldSlug, newSlug]})` mengurus refresh kedua path.

### Hapus produk

1. Klik tombol tong sampah (🗑️) di baris produk.
2. Konfirmasi dialog "Hapus produk ...?" → klik **OK**.
3. Toast "... dihapus" muncul, slug langsung 404 di public.

### Ganti gambar produk

1. Edit produk.
2. Di section gambar, klik 🗑️ pada gambar yang mau diganti.
3. Klik **Pilih file gambar** untuk upload pengganti.
4. Atur cover dengan klik ⭐ di gambar yang diinginkan.
5. **Simpan produk**.

> Catatan: object lama di Storage tidak otomatis terhapus (dianggap orphan). Untuk cleanup, hapus manual lewat Supabase Dashboard → Storage → product-images, atau pakai Server Action `deleteProductImage` dari script khusus.

### Tandai sold-out (tetap tampil, order disabled)

1. Edit produk.
2. Set **Badge** → **Sold Out**.
3. **Biarkan** checkbox **Tampil di publik** tetap aktif.
4. Simpan.

Produk masih kelihatan di katalog, tombol order otomatis jadi "Stok Habis" dan disabled.

### Sembunyikan produk dari public (hidden / unpublished)

1. Edit produk.
2. **Matikan** checkbox **Tampil di publik** (`is_available = false`).
3. Simpan.

Produk hilang dari `/katalog` dan `/produk/<slug>` jadi 404. Sitemap juga otomatis tidak include.

### Hidden vs Sold Out

| Kondisi | `/katalog` | `/produk/[slug]` | Tombol order |
|--------|-----------|-----------------|--------------|
| `is_available = true` & badge ≠ sold-out | ✅ Tampil | ✅ 200 OK | ✅ Aktif |
| `is_available = true` & badge = sold-out | ✅ Tampil | ✅ 200 OK (status Sold Out) | ❌ Disabled |
| `is_available = false` (apapun badge-nya) | ❌ Disembunyikan | ❌ 404 | — |

---

## 🗄️ Supabase Maintenance

### Jalankan ulang `supabase/setup.sql`

File `supabase/setup.sql` **idempotent dan non-destructive**:

- Tidak ada `DROP TABLE`, `TRUNCATE`, atau `DELETE`.
- Seed produk pakai `on conflict (slug) do nothing` — produk yang sudah pernah diedit admin tidak ter-revert.
- RLS policy & trigger di-refresh (drop if exists + create) — data tidak tersentuh.
- Bucket Storage pakai `on conflict (id) do update` — settings di-sync, file existing aman.

**Cara**:
1. Supabase Dashboard → **SQL Editor → New query**.
2. Copy seluruh isi `supabase/setup.sql`.
3. Paste → **Run**.

Cocok dipakai saat: setup project Supabase baru, restore dari backup, atau setelah update RLS policy di repo.

### Tambah admin baru

1. Supabase Dashboard → **Authentication → Users → Add user**.
2. Isi email + password. Centang **Auto Confirm User** supaya bisa langsung login.
3. Catat **UUID** yang muncul setelah user dibuat.
4. Buka **SQL Editor** dan jalankan:
   ```sql
   insert into public.admin_users (user_id, email)
   values ('PASTE-UUID-DI-SINI', 'email-admin-baru@mushida.me')
   on conflict (user_id) do nothing;
   ```
5. Test login di `/admin/login`.

### Cek RLS policies

**SQL Editor**:
```sql
-- Semua policy di tabel products & admin_users
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('products', 'admin_users')
order by tablename, policyname;

-- Policy storage object untuk bucket product-images
select policyname, cmd, roles
from pg_policies
where schemaname = 'storage' and tablename = 'objects';
```

Yang **wajib ada** di `public.products`:
- `products_anon_select_available`
- `products_user_select_available`
- `products_admin_insert`
- `products_admin_update`
- `products_admin_delete`

Yang **wajib ada** di `public.admin_users`:
- `admin_users_self_select`

Yang **wajib ada** di `storage.objects` untuk bucket `product-images`:
- `product_images_public_read`
- `product_images_admin_insert`
- `product_images_admin_update`
- `product_images_admin_delete`

Kalau salah satu hilang, jalankan ulang `supabase/setup.sql`.

### Cek bucket `product-images`

Supabase Dashboard → **Storage → product-images**:
- **Public**: ON (icon mata terbuka).
- **File size limit**: 3 MB.
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`.

Kalau settings drift, jalankan ulang `supabase/setup.sql`.

### Cek storage usage

Supabase Dashboard → **Storage → Usage**. Pantau total bytes dan jumlah object. Bersihkan object orphan (URL tidak referensikan dari row produk manapun) secara berkala.

---

## ☁️ Deployment Maintenance

### Update env di Vercel

1. Vercel Dashboard → pilih project Mushida.
2. **Settings → Environment Variables**.
3. Edit / tambah variable yang dibutuhkan (lihat `.env.example` untuk daftar lengkap).
4. Pilih scope: **Production**, **Preview**, **Development** sesuai kebutuhan.
5. **Save**.

> ⚠️ **Setelah env berubah, WAJIB redeploy.** Vercel hanya inject env saat build & runtime baru. Cara redeploy: **Deployments → tiga titik di latest deployment → Redeploy**, atau push commit baru.

### Rollback deployment

1. Vercel Dashboard → **Deployments**.
2. Cari deployment **Ready** (hijau) sebelumnya yang ingin dijadikan production.
3. Klik tiga titik (**⋯**) → **Promote to Production**.
4. Tunggu 10-30 detik, traffic langsung pindah ke versi lama.

Cocok kalau deploy terbaru menyebabkan regresi & belum sempat fix di code.

### Cek build logs

1. Vercel Dashboard → **Deployments → klik deployment yang dimaksud**.
2. Tab **Build Logs** menampilkan output `npm ci`, `next build`, dll.
3. Kalau **Failed**: scroll ke baris merah pertama untuk root cause.

Issue umum:
- `[supabase] env belum lengkap.` → set `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` di Vercel.
- `[whatsapp] NEXT_PUBLIC_WHATSAPP_NUMBER tidak diset atau formatnya tidak valid` → set / perbaiki nomor WA.
- `Module not found` → kemungkinan dependency hilang dari `package.json`.

### Cek production URL

- Live: `https://mushida-craft.vercel.app/`
- Sitemap: `https://mushida-craft.vercel.app/sitemap.xml`
- Robots: `https://mushida-craft.vercel.app/robots.txt`
- Admin login: `https://mushida-craft.vercel.app/admin/login`

Kalau status 5xx persisten, cek **Logs** di Vercel (Functions / Edge / Build) untuk root cause.

---

## 🔒 Security Maintenance

Aturan yang **tidak boleh** dilanggar:

- **Jangan expose service role key.** Service role key (`service_role`) tidak boleh dipakai di repo, env `NEXT_PUBLIC_*`, atau di-commit ke git. Aplikasi ini cukup pakai **anon / publishable key** + cookie sesi admin. Otorisasi tulis di-enforce oleh RLS.
- **Jangan commit `.env.local`.** File ini sudah ada di `.gitignore`. Jangan ubah `.gitignore` untuk meng-include-nya.
- **Jangan taruh password admin di env.** Tidak ada `ADMIN_PASSWORD` di kode atau env. Password admin **selalu** dikelola di Supabase Auth (Authentication → Users), bukan di repo.
- **Admin guard harus tetap server-side.** Jangan pindahkan validasi admin (`getAdminUser()`) ke client. Hanya server yang bisa membaca cookie sesi sb-* dan query tabel `admin_users` dengan aman.
- **RLS harus tetap aktif** di tabel `products` dan `admin_users`. Jangan jalankan `alter table ... disable row level security`. Kalau perlu cek atau debug, pakai SQL Editor (postgres role bypass RLS) tanpa men-disable policy.
- **Bucket Storage tetap public read, admin-only write.** Jangan ubah policy `storage.objects` untuk mengizinkan anonymous insert/update/delete.

Kalau salah satu drift (mis. seseorang men-disable RLS), jalankan ulang `supabase/setup.sql` — file itu akan re-apply seluruh policy.

---

## 🚑 Troubleshooting

### "Supabase env belum lengkap" saat dev / build

**Gejala**: error `[supabase] env belum lengkap. Set NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ...`

**Fix**:
1. Lokal: pastikan `.env.local` ada dan diisi dari Supabase Dashboard → Settings → API.
2. Production: Vercel → Settings → Environment Variables, set kedua variable, lalu **redeploy**.
3. Restart dev server (`Ctrl+C` lalu `npm run dev`) — Next.js cache env saat startup.

### Login berhasil tapi akses admin ditolak

**Gejala**: setelah submit form login, muncul "Akun ini belum terdaftar sebagai admin. Hubungi pemilik toko untuk akses."

**Penyebab**: User valid di Supabase Auth tapi belum ada baris di `public.admin_users`.

**Fix**: Lihat [Tambah admin baru](#tambah-admin-baru). Insert UUID user ke `admin_users`.

### Produk tidak muncul di katalog

Cek satu per satu:
1. **`is_available = true`?** Edit produk di admin, pastikan checkbox **Tampil di publik** aktif.
2. **Sudah ke-revalidate?** Tunggu sampai 60 detik (interval ISR safety net) atau klik **Update produk** sekali lagi untuk men-trigger `revalidateTag("products")`.
3. **RLS aktif?** Jalankan query di SQL Editor:
   ```sql
   select count(*) from public.products where is_available = true;
   ```
   Kalau 0, produk tidak akan muncul untuk anon.
4. **Cek public fetch**: buka `/katalog` di incognito. Kalau di browser admin tampil tapi incognito tidak, kemungkinan ada produk hidden yang admin lihat (RLS rule untuk authenticated admin: lihat semua).

### Gambar gagal upload

| Pesan | Penyebab | Fix |
|-------|---------|-----|
| `UNAUTHORIZED` | Admin belum login / sesi expired. | Login ulang di `/admin/login`. |
| `Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.` | Mime / ekstensi tidak match. | Convert ke JPG/PNG/WEBP. |
| `Ukuran file melebihi batas (3 MB).` | File > 3 MB. | Compress / resize sebelum upload. |
| `Tidak memiliki izin untuk upload (RLS). Pastikan akun admin sudah terdaftar.` | User login tapi tidak ada di `admin_users`. | Lihat [Tambah admin baru](#tambah-admin-baru). |
| `Gagal mengunggah file: ...` | Error generik dari Supabase Storage. | Cek dashboard Supabase → Storage → product-images, dan **Logs**. Kemungkinan bucket dihapus / quota habis. |

### Gambar tidak tampil di katalog/detail

Penyebab umum:
1. **URL hostname tidak whitelisted.** Pastikan `NEXT_PUBLIC_SUPABASE_URL` di-set saat build sehingga `next.config.mjs` auto-include hostname Supabase ke `images.remotePatterns`.
2. **Object di Storage terhapus / bucket di-private.** Buka URL gambar langsung di browser. Kalau 404 atau "permission denied", bucket harus public (`public = true`) dan object masih ada.
3. **URL invalid (typo).** Edit produk, hapus URL bermasalah dari daftar gambar, simpan ulang.

Fallback `placeholder-bouquet.svg` akan dipakai kalau array gambar kosong di komponen yang menggunakan `<ProductCard>`.

### Produk baru tidak langsung muncul

**Gejala**: setelah klik **Simpan produk**, produk belum kelihatan di `/katalog` atau slug masih 404.

**Fix**:
1. Tunggu 60 detik (ISR safety net otomatis revalidate).
2. Cek toast: kalau muncul "Cache publik gagal di-refresh ..." berarti Server Action `revalidateProducts` gagal — refresh manual halaman publik.
3. Buka `/katalog` di incognito (window admin terkadang menampilkan cached state berbeda).

### Sitemap tidak update

`/sitemap.xml` di-revalidate ISR setiap 60 detik dan otomatis di-revalidate setelah CRUD admin. Kalau masih basi:
1. Hard reload `Ctrl+F5` di browser.
2. Cek RLS — anon hanya bisa SELECT produk available, jadi kalau produk hidden, dia memang tidak masuk sitemap (by design).
3. Cek deployment terbaru sudah **Ready** di Vercel.

### WhatsApp link invalid / tombol tidak jalan

**Gejala**: error build `[whatsapp] NEXT_PUBLIC_WHATSAPP_NUMBER tidak diset atau formatnya tidak valid` atau `wa.me/...` 404.

**Fix**: env `NEXT_PUBLIC_WHATSAPP_NUMBER` harus format internasional tanpa `+`, 8-15 digit, **tidak boleh diawali 0**. Contoh valid: `6285713254800`. Kalau ada di sini, build gagal di production by design (validator throw) supaya tidak silent-fallback ke nomor dummy.

---

## 🚧 Maintenance Mode

Mushida punya **maintenance mode** opsional untuk menutup public site sementara saat ada update besar (mis. restore database, ganti banyak produk, migrasi gambar).

### Cara mengaktifkan

**Lokal**:
1. Edit `.env.local`:
   ```env
   MAINTENANCE_MODE=true
   ```
2. Restart dev server (`Ctrl+C` lalu `npm run dev`).
3. Buka `http://localhost:3000` → otomatis redirect ke `/maintenance`.

**Production (Vercel)**:
1. Vercel Dashboard → **Settings → Environment Variables**.
2. Set / edit `MAINTENANCE_MODE` = `true` (scope **Production**).
3. **Save**, lalu **Redeploy** deployment terbaru. Tanpa redeploy, env baru tidak ter-pickup.

### Cara mematikan

**Lokal**: `MAINTENANCE_MODE=false` (atau hapus baris itu) → restart dev server.

**Production (Vercel)**:
1. Set `MAINTENANCE_MODE` = `false` (atau **Remove** variable-nya).
2. **Redeploy**.

### Yang dilakukan saat maintenance mode aktif

| Path | Behavior |
|------|----------|
| `/`, `/katalog`, `/produk/[slug]`, `/custom-order` | Redirect ke `/maintenance`. |
| `/maintenance` | Halaman maintenance Mushida (judul + deskripsi + tombol WhatsApp). |
| `/admin/login`, `/admin/dashboard` | **Tetap berfungsi normal** — admin bisa login & update data. |
| `/api/*` | Tidak di-redirect (kalau ada route handler internal). |
| `/_next/*` (chunk JS, RSC payload) | Tidak di-redirect — dibutuhkan halaman maintenance untuk render. |
| `/sitemap.xml`, `/robots.txt` | Tidak di-redirect (tetap accessible). |
| Static asset (`/images/*`, file `.svg/.png/.jpg/.webp`) | Tidak kena middleware sama sekali (sudah di-exclude di matcher). |

### SEO selama maintenance

- Halaman `/maintenance` set `robots: noindex, nofollow` di metadata, jadi search engine tidak akan meng-index isi-nya.
- Sitemap **tidak** mencantumkan `/maintenance` sebagai entry valid — hanya halaman normal + produk available.
- Setelah maintenance selesai dan mode dimatikan, halaman normal tetap punya metadata SEO yang benar (sudah di-set sebelumnya).

### Tips operasional

- Kalau maintenance lama (≥ 30 menit), pertimbangkan kirim broadcast WhatsApp ke pelanggan tetap atau update bio Instagram.
- Kalau maintenance singkat (< 5 menit), sebenarnya tidak perlu mode ini — ISR + revalidate sudah cukup karena admin bisa update sambil public tetap melihat versi cached.
- **Test selalu** sebelum mengaktifkan: deploy preview di Vercel → set `MAINTENANCE_MODE=true` di preview env → cek behavior, baru di-promote ke production.

