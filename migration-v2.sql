-- ============================================================
-- MIGRASI v2 — untuk project Supabase yang SUDAH BERJALAN
-- (sudah punya tabel items & transaksi dengan data).
-- Script ini AMAN dijalankan, tidak menghapus data yang ada.
-- Jalankan di: Supabase Project > SQL Editor > New query > Run
-- ============================================================

create extension if not exists "pgcrypto";

-- 1) Buat tabel kategori & jenis_barang (kalau belum ada)
create table if not exists kategori (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  label text not null,
  sub text not null default '',
  icon text not null default 'wrench',
  urutan integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists jenis_barang (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  created_at timestamptz not null default now()
);

-- 2) Isi kategori & jenis dari data lama yang sudah ada di tabel items,
--    supaya tidak ada barang yang "kehilangan" kategorinya
insert into kategori (kode, label, sub, icon, urutan)
select distinct kategori,
  case kategori
    when 'FL25B' then 'Forklift 2.5T' when 'FL25D' then 'Forklift 2.5T'
    when 'FL3B' then 'Forklift 3T' when 'FL3D' then 'Forklift 3T'
    when 'FL5B' then 'Forklift 5T' when 'FL5D' then 'Forklift 5T'
    when 'AVZ' then 'Avanza' when 'HIC' then 'Hiace' when 'GDM' then 'Grandmax PU'
    else kategori end,
  case kategori
    when 'FL25B' then 'Battery' when 'FL25D' then 'Diesel'
    when 'FL3B' then 'Battery' when 'FL3D' then 'Diesel'
    when 'FL5B' then 'Battery' when 'FL5D' then 'Diesel'
    when 'AVZ' then 'Mobil' when 'HIC' then 'Mobil' when 'GDM' then 'Mobil'
    else 'Semua Unit' end,
  case when kategori like 'FL%B' then 'battery' when kategori like 'FL%D' then 'diesel'
    when kategori in ('AVZ','HIC','GDM') then 'car' else 'wrench' end,
  100
from items
on conflict (kode) do nothing;

-- 3) Pastikan 10 kategori standar tetap ada (kalau belum pernah dipakai di items)
insert into kategori (kode, label, sub, icon, urutan) values
  ('FL25B', 'Forklift 2.5T', 'Battery', 'battery', 1),
  ('FL25D', 'Forklift 2.5T', 'Diesel', 'diesel', 2),
  ('FL3B',  'Forklift 3T',   'Battery', 'battery', 3),
  ('FL3D',  'Forklift 3T',   'Diesel', 'diesel', 4),
  ('FL5B',  'Forklift 5T',   'Battery', 'battery', 5),
  ('FL5D',  'Forklift 5T',   'Diesel', 'diesel', 6),
  ('AVZ',   'Avanza',        'Mobil', 'car', 7),
  ('HIC',   'Hiace',         'Mobil', 'car', 8),
  ('GDM',   'Grandmax PU',   'Mobil', 'car', 9),
  ('UMU',   'Umum',          'Semua Unit', 'wrench', 10)
on conflict (kode) do nothing;

insert into jenis_barang (nama)
select distinct jenis from items where jenis is not null
on conflict (nama) do nothing;

insert into jenis_barang (nama) values ('Sparepart'), ('Ban')
on conflict (nama) do nothing;

-- 4) Tambah kolom baru di transaksi (aman walau sudah ada isinya)
alter table transaksi add column if not exists peruntukan text;

-- 5) Perbarui Row Level Security supaya WAJIB LOGIN
--    (sebelumnya semua orang yang punya anon key bisa akses;
--    sekarang hanya yang sudah login)
drop policy if exists "items_select_all" on items;
drop policy if exists "items_insert_all" on items;
drop policy if exists "items_update_all" on items;
drop policy if exists "items_delete_all" on items;
drop policy if exists "transaksi_select_all" on transaksi;
drop policy if exists "transaksi_insert_all" on transaksi;
drop policy if exists "transaksi_update_all" on transaksi;
drop policy if exists "transaksi_delete_all" on transaksi;

alter table kategori enable row level security;
alter table jenis_barang enable row level security;

drop policy if exists "items_auth_all" on items;
drop policy if exists "transaksi_auth_all" on transaksi;
drop policy if exists "kategori_auth_all" on kategori;
drop policy if exists "jenis_auth_all" on jenis_barang;

create policy "items_auth_all" on items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "transaksi_auth_all" on transaksi
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "kategori_auth_all" on kategori
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "jenis_auth_all" on jenis_barang
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- PENTING — setelah menjalankan script ini:
-- 1. Buat akun login di: Authentication > Users > Add user
--    (isi email & password, centang "Auto Confirm User")
-- 2. Upload ulang file app/page.js dan lib/supabaseClient.js
--    (versi baru) ke GitHub, lalu Vercel akan redeploy otomatis
-- 3. Buka aplikasi -> akan muncul halaman login -> masuk pakai
--    email & password yang baru dibuat
-- ============================================================
