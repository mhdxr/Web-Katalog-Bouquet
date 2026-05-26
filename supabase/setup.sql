-- =====================================================================
-- Mushida — Supabase Setup (single-file, idempotent, non-destructive)
-- =====================================================================
-- Cukup jalankan SATU file ini di Supabase Dashboard → SQL Editor untuk
-- menyiapkan seluruh backend Mushida:
--
--   1. Table  : products
--   2. Table  : admin_users
--   3. Trigger: updated_at di products
--   4. Helper : public.is_admin()  (SECURITY DEFINER)
--   5. RLS    : products            (public read available + admin CRUD)
--   6. RLS    : admin_users         (self-select only)
--   7. Storage: bucket product-images (create / update settings)
--   8. RLS    : storage.objects bucket product-images
--   9. Seed   : 12 produk awal (on conflict do nothing)
--  10. Template insert admin pertama (komentar — wajib edit manual)
--
-- 100% AMAN dijalankan ULANG di database yang sudah ada datanya:
--   - create table if not exists       → tidak menimpa tabel existing
--   - alter table add column if not exists → backfill kolom yang missing
--   - create index if not exists       → tidak menggandakan index
--   - create or replace function       → replace function tanpa drop
--   - drop policy if exists + create   → policy direfresh, tabel tidak
--                                        tersentuh
--   - drop trigger if exists + create  → trigger direfresh, data tidak
--                                        tersentuh
--   - insert ... on conflict (id) do update / do nothing → seed/bucket
--                                        tidak menggandakan & tidak
--                                        menimpa row existing (kolom
--                                        slug untuk products dipakai
--                                        sebagai conflict target supaya
--                                        produk yang sudah pernah diedit
--                                        admin TIDAK ter-revert ke seed).
--
-- Yang SECARA SENGAJA TIDAK dilakukan file ini:
--   - DROP TABLE / TRUNCATE / DELETE — tidak ada satu pun di file ini.
--     Data products & admin_users yang sudah ada AMAN.
--   - Membuat auth user lewat SQL. Akun admin tetap dibuat lewat
--     Supabase Dashboard → Authentication → Users → "Add user", lalu
--     copy UUID-nya ke section 10.
--   - Menggunakan service role key. Setup ini berjalan di SQL Editor
--     (postgres role), aplikasi runtime tetap pakai anon/publishable
--     key + cookie sesi — semua otorisasi di-enforce oleh RLS.
-- =====================================================================

-- Pastikan ekstensi UUID tersedia. Supabase sudah menyediakan pgcrypto
-- secara default, jadi `gen_random_uuid()` siap pakai.
create extension if not exists "pgcrypto";


-- =====================================================================
-- 1. TABLE: products
-- =====================================================================
-- Katalog produk yang tampil di /katalog dan /produk/[slug].
-- =====================================================================
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  description   text not null,
  price         integer not null check (price >= 0),
  category      text not null check (category in (
                  'hand-bouquet',
                  'wedding',
                  'graduation',
                  'anniversary',
                  'money-bouquet',
                  'dried-flower'
                )),
  images        text[] not null default '{}',
  badge         text check (badge in ('best-seller', 'new', 'sold-out')),
  is_available  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

comment on table public.products is
  'Katalog produk yang tampil di /katalog dan /produk/[slug].';

-- Backfill defensif: kalau tabel `products` sudah ada (dibuat manual
-- sebelum file ini eksis) dan ada kolom yang missing, tambahkan tanpa
-- menyentuh data. `add column if not exists` aman dijalankan ulang.
alter table public.products
  add column if not exists slug          text,
  add column if not exists name          text,
  add column if not exists description   text,
  add column if not exists price         integer,
  add column if not exists category      text,
  add column if not exists images        text[] not null default '{}',
  add column if not exists badge         text,
  add column if not exists is_available  boolean not null default true,
  add column if not exists created_at    timestamptz not null default now(),
  add column if not exists updated_at    timestamptz;

-- Index pendukung query katalog & sorting "terbaru".
create index if not exists products_category_idx
  on public.products (category);
create index if not exists products_is_available_idx
  on public.products (is_available);
create index if not exists products_created_at_idx
  on public.products (created_at desc);


-- =====================================================================
-- 2. TABLE: admin_users
-- =====================================================================
-- Whitelist user_id yang boleh mengakses admin dashboard.
-- Source of truth untuk otorisasi admin di sisi server (lihat
-- src/lib/auth.ts → getAdminUser()).
-- =====================================================================
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Whitelist user yang berhak akses admin dashboard Mushida.';

-- Backfill defensif (sama seperti products): kalau tabel sudah ada
-- dengan kolom missing, tambahkan tanpa men-drop apapun. Tidak akan
-- menghapus row admin yang sudah terdaftar.
alter table public.admin_users
  add column if not exists email      text,
  add column if not exists created_at timestamptz not null default now();


-- =====================================================================
-- 3. TRIGGER: updated_at
-- =====================================================================
-- Auto-set kolom products.updated_at setiap kali row di-update.
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_set_updated_at on public.products;
create trigger trg_products_set_updated_at
before update on public.products
for each row execute procedure public.set_updated_at();


-- =====================================================================
-- 4. HELPER: public.is_admin()
-- =====================================================================
-- SECURITY DEFINER supaya RLS policy bisa cek tabel admin_users tanpa
-- terkena policy-nya sendiri (mencegah recursive check). Hanya
-- mengembalikan boolean — tidak meng-expose data admin_users.
--
-- search_path di-pin ke `public` supaya tidak bisa di-hijack lewat
-- search_path injection.
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;


-- =====================================================================
-- 5. RLS: products
-- =====================================================================
-- Aturan akses:
--   - anon            : SELECT hanya row dengan is_available = true
--   - authenticated   : SELECT available, atau SEMUA jika admin
--   - admin only      : INSERT / UPDATE / DELETE
-- =====================================================================
alter table public.products enable row level security;

-- 5.1 Public/anon: hanya boleh SELECT produk yang available.
drop policy if exists "products_anon_select_available" on public.products;
create policy "products_anon_select_available"
on public.products
for select
to anon
using (is_available = true);

-- 5.2 Authenticated: same as anon, kecuali admin bisa lihat semua
--     (termasuk produk dengan is_available = false → draft / hidden).
drop policy if exists "products_user_select_available" on public.products;
create policy "products_user_select_available"
on public.products
for select
to authenticated
using (is_available = true or public.is_admin());

-- 5.3 Admin: full CRUD.
drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert"
on public.products
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update"
on public.products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete"
on public.products
for delete
to authenticated
using (public.is_admin());


-- =====================================================================
-- 6. RLS: admin_users
-- =====================================================================
-- User yang sudah login hanya boleh melihat row miliknya sendiri.
-- Tidak ada policy INSERT/UPDATE/DELETE → manajemen admin dilakukan
-- via SQL Editor (postgres role bypass RLS) supaya tidak bisa
-- escalate dari aplikasi.
-- =====================================================================
alter table public.admin_users enable row level security;

drop policy if exists "admin_users_self_select" on public.admin_users;
create policy "admin_users_self_select"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());


-- =====================================================================
-- 7. STORAGE: bucket `product-images`
-- =====================================================================
-- Buat bucket via SQL supaya setup-nya 100% reproducible — tidak perlu
-- klik manual di Dashboard. Idempoten via `on conflict (id) do update`
-- sehingga kalau bucket sudah ada, settings-nya akan disinkronkan.
--
-- Settings:
--   - public            : true       (getPublicUrl bisa diakses tanpa auth)
--   - file_size_limit   : 3 MiB      (3 * 1024 * 1024 byte)
--   - allowed_mime_types: jpeg, png, webp
--
-- RLS object-level di section 8 yang mengunci tulisan ke admin saja —
-- jadi public bucket TIDAK berarti siapa pun bisa upload.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public            = excluded.public,
    file_size_limit   = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;


-- =====================================================================
-- 8. RLS: storage.objects untuk bucket `product-images`
-- =====================================================================
-- Catatan: tabel storage.objects punya RLS yang aktif by default di
-- Supabase. Kita TIDAK memanggil `alter table ... enable row level
-- security` lagi (akan error karena bukan owner).
--
-- Aturan akses (scope-nya `bucket_id = 'product-images'` saja, bucket
-- lain di project ini tidak ikut terpengaruh):
--   - anon, authenticated : SELECT (read gambar publik)
--   - admin only          : INSERT / UPDATE / DELETE
-- =====================================================================

-- 8.1 Public/anon + authenticated: SELECT object di bucket product-images.
drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

-- 8.2 Admin: INSERT object ke bucket product-images.
drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and public.is_admin()
);

-- 8.3 Admin: UPDATE object di bucket product-images.
drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_admin()
)
with check (
  bucket_id = 'product-images'
  and public.is_admin()
);

-- 8.4 Admin: DELETE object di bucket product-images.
drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_admin()
);


-- =====================================================================
-- 9. SEED: 12 produk awal
-- =====================================================================
-- Idempoten via `on conflict (slug) do nothing`: aman dijalankan ulang,
-- produk yang sudah ada tidak akan tergores. Kalau ingin men-seed
-- ulang sebuah produk, hapus dulu row-nya manual lalu jalankan lagi.
--
-- Gambar default memakai Unsplash sebagai placeholder demo. Setelah
-- admin meng-upload gambar produk asli, kolom `images` akan tertimpa
-- dengan URL Supabase Storage (bucket product-images).
-- =====================================================================
insert into public.products (
  slug, name, description, price, category, images, badge, is_available, created_at
) values
(
  'rose-blush-classic',
  'Rose Blush Classic',
  'Hand bouquet klasik dengan 12 tangkai mawar pink premium, dipadukan baby breath dan eucalyptus. Dibungkus rapi dengan kertas Korean wrapping bernuansa cream dan pita satin.',
  285000,
  'hand-bouquet',
  array[
    'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=900&q=80',
    'https://images.unsplash.com/photo-1457089328389-e5d62b8c4d10?w=900&q=80'
  ],
  'best-seller',
  true,
  '2025-01-04T00:00:00Z'
),
(
  'white-elegance-wedding',
  'White Elegance Wedding',
  'Bouquet pengantin elegan berisi white roses, lisianthus, dan greenery. Sempurna untuk pernikahan bertema garden dan classic timeless.',
  750000,
  'wedding',
  array[
    'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=900&q=80',
    'https://images.unsplash.com/photo-1525772764200-be829a350797?w=900&q=80'
  ],
  'new',
  true,
  '2025-02-12T00:00:00Z'
),
(
  'graduation-sunshine',
  'Graduation Sunshine',
  'Bouquet wisuda ceria dengan kombinasi sunflower, baby yellow rose, dan daun salal. Hadiah penuh semangat untuk merayakan kelulusan tersayang.',
  235000,
  'graduation',
  array[
    'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=900&q=80',
    'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=900&q=80'
  ],
  'best-seller',
  true,
  '2025-03-01T00:00:00Z'
),
(
  'anniversary-rouge',
  'Anniversary Rouge',
  'Susunan red roses premium berukuran XL dengan aksen ranunculus dan greenery, dibungkus kertas marble. Cocok untuk anniversary dan momen romantis.',
  520000,
  'anniversary',
  array[
    'https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=900&q=80',
    'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=900&q=80'
  ],
  null,
  true,
  '2024-12-20T00:00:00Z'
),
(
  'money-bouquet-fortune',
  'Money Bouquet Fortune',
  'Bouquet uang kreatif berisi pecahan rupiah hingga Rp500.000 dipadu mawar artificial premium. Bisa custom nominal sesuai kebutuhan.',
  650000,
  'money-bouquet',
  array[
    'https://images.unsplash.com/photo-1606293459339-aa5d34a7b0e1?w=900&q=80',
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=900&q=80'
  ],
  'new',
  true,
  '2025-04-10T00:00:00Z'
),
(
  'dried-rustic-charm',
  'Dried Rustic Charm',
  'Bouquet dried flower dengan pampas grass, lavender kering, dan ruscus. Estetika rustic yang tahan hingga 1 tahun.',
  320000,
  'dried-flower',
  array[
    'https://images.unsplash.com/photo-1561181286-d5c2c1f56ff9?w=900&q=80',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=900&q=80'
  ],
  null,
  true,
  '2025-01-22T00:00:00Z'
),
(
  'peach-pearl-bouquet',
  'Peach Pearl Bouquet',
  'Hand bouquet warna peach lembut berisi peach roses, carnation, dan eucalyptus dengan ribbon emas. Cocok untuk hadiah profesional dan personal.',
  310000,
  'hand-bouquet',
  array[
    'https://images.unsplash.com/photo-1487070183336-b863922373d4?w=900&q=80',
    'https://images.unsplash.com/photo-1471696035578-3d8c78d99684?w=900&q=80'
  ],
  null,
  true,
  '2025-03-15T00:00:00Z'
),
(
  'lavender-dream-wedding',
  'Lavender Dream Wedding',
  'Bouquet pengantin nuansa ungu pastel dengan lisianthus, lavender, dan dusty miller. Hadiah pengiring yang menawan untuk wedding indoor.',
  820000,
  'wedding',
  array[
    'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=900&q=80',
    'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=900&q=80'
  ],
  null,
  true,
  '2025-02-28T00:00:00Z'
),
(
  'graduation-pastel-bliss',
  'Graduation Pastel Bliss',
  'Bouquet wisuda nuansa pastel pink dan cream dengan boneka mini graduation. Tersedia dalam ukuran medium dan jumbo.',
  285000,
  'graduation',
  array[
    'https://images.unsplash.com/photo-1530092285049-1c42085fd395?w=900&q=80',
    'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=900&q=80'
  ],
  'best-seller',
  true,
  '2025-03-22T00:00:00Z'
),
(
  'love-letter-anniversary',
  'Love Letter Anniversary',
  'Bouquet anniversary special edition dengan red & pink roses, kartu ucapan handlettering custom, serta box velvet eksklusif.',
  685000,
  'anniversary',
  array[
    'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=900&q=80',
    'https://images.unsplash.com/photo-1525772764200-be829a350797?w=900&q=80'
  ],
  'sold-out',
  false,
  '2025-01-30T00:00:00Z'
),
(
  'money-bouquet-mini',
  'Money Bouquet Mini',
  'Bouquet uang ukuran mini dengan nominal mulai Rp200.000. Cocok sebagai hadiah ulang tahun dan kado kejutan teman.',
  350000,
  'money-bouquet',
  array[
    'https://images.unsplash.com/photo-1612966769205-a3d76dffa7e8?w=900&q=80',
    'https://images.unsplash.com/photo-1606293459339-aa5d34a7b0e1?w=900&q=80'
  ],
  null,
  true,
  '2025-04-18T00:00:00Z'
),
(
  'dried-pampas-elegance',
  'Dried Pampas Elegance',
  'Bouquet pampas premium dengan ranting kering eucalyptus dan bunga statis ungu. Long-lasting hingga lebih dari 12 bulan.',
  425000,
  'dried-flower',
  array[
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=900&q=80',
    'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=900&q=80'
  ],
  'new',
  true,
  '2025-04-25T00:00:00Z'
)
on conflict (slug) do nothing;


-- =====================================================================
-- 10. TEMPLATE: insert admin pertama
-- =====================================================================
-- File ini SENGAJA tidak membuat auth user lewat SQL — pembuatan akun
-- harus tetap melewati Supabase Auth supaya password ter-hash dengan
-- benar dan email confirmation flow tetap konsisten.
--
-- Langkah-langkah membuat admin pertama:
--
--   1. Buka Supabase Dashboard → Authentication → Users → "Add user".
--      - Isi email + password.
--      - "Auto Confirm User" boleh ON supaya bisa langsung login.
--      - Catat user `id` (UUID) yang muncul setelah user dibuat.
--
--   2. Kembali ke SQL Editor, edit blok di bawah ini:
--      - Ganti 'PASTE-UUID-DI-SINI' dengan UUID user di atas.
--      - Ganti 'admin@mushida.me'   dengan email yang sama.
--      Lalu uncomment (hapus dua dash di awal baris) dan jalankan.
--
--   3. Login di /admin/login pakai email + password tersebut.
--
-- Idempoten via `on conflict (user_id) do nothing` — aman dijalankan
-- ulang, row admin yang sudah ada tidak akan tertulis ulang.
-- =====================================================================

-- insert into public.admin_users (user_id, email)
-- values ('PASTE-UUID-DI-SINI', 'admin@mushida.me')
-- on conflict (user_id) do nothing;
