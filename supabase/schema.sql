-- =====================================================================
-- Mushida — Production Schema
-- =====================================================================
-- Jalankan file ini sekali di Supabase SQL Editor (Database → SQL Editor)
-- untuk menyiapkan tabel `admin_users`, `products`, trigger updated_at,
-- dan seluruh RLS policy.
--
-- Idempoten: aman dijalankan ulang. Tabel/policy/trigger yang sudah ada
-- akan dilewati atau direplace.
-- =====================================================================

-- Pastikan ekstensi UUID tersedia (Supabase sudah menyediakan pgcrypto
-- secara default, jadi `gen_random_uuid()` bisa langsung dipakai).
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. TABLE: admin_users
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

-- =====================================================================
-- 2. TABLE: products
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

create index if not exists products_category_idx
  on public.products (category);
create index if not exists products_is_available_idx
  on public.products (is_available);
create index if not exists products_created_at_idx
  on public.products (created_at desc);

-- =====================================================================
-- 3. TRIGGER: updated_at
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
-- 4. HELPER: is_admin()
-- =====================================================================
-- Function SECURITY DEFINER supaya RLS policy bisa cek tabel
-- admin_users tanpa terkena policy-nya sendiri (mencegah recursive
-- check). Hanya men-expose boolean.
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
-- 5. RLS: admin_users
-- =====================================================================
alter table public.admin_users enable row level security;

drop policy if exists "admin_users_self_select" on public.admin_users;
create policy "admin_users_self_select"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

-- =====================================================================
-- 6. RLS: products
-- =====================================================================
alter table public.products enable row level security;

-- Public/anon: hanya boleh SELECT produk yang available.
drop policy if exists "products_anon_select_available" on public.products;
create policy "products_anon_select_available"
on public.products
for select
to anon
using (is_available = true);

-- Authenticated non-admin: sama seperti anon (hanya available).
drop policy if exists "products_user_select_available" on public.products;
create policy "products_user_select_available"
on public.products
for select
to authenticated
using (is_available = true or public.is_admin());

-- Admin: full CRUD.
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
-- 7. CARA MENAMBAH ADMIN PERTAMA
-- =====================================================================
-- 1. Buat user baru di Supabase Dashboard → Authentication → Users →
--    "Add user" → isi email + password. Catat user_id (UUID).
-- 2. Insert ke admin_users:
--
--    insert into public.admin_users (user_id, email)
--    values ('PASTE-UUID-DI-SINI', 'admin@mushida.me');
--
-- 3. Login ke /admin/login pakai email + password tersebut.
-- =====================================================================
