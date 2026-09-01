-- ============================================================
-- SCHEMA: Gudang Part v2 - dengan Login, Kategori/Jenis dinamis
-- Untuk INSTALASI BARU (project Supabase kosong).
-- Kalau project Supabase kamu SUDAH berjalan dengan data lama,
-- JANGAN pakai file ini — pakai migration-v2.sql sebagai gantinya.
-- Jalankan di: Supabase Project > SQL Editor > New query > Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Master Kategori Kendaraan ----------
create table if not exists kategori (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  label text not null,
  sub text not null default '',
  icon text not null default 'wrench',   -- battery | diesel | car | wrench
  urutan integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Master Jenis Barang ----------
create table if not exists jenis_barang (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  created_at timestamptz not null default now()
);

-- ---------- Data Barang ----------
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  kode text not null,
  nama text not null,
  kategori text not null,        -- merujuk ke kategori.kode
  jenis text not null,           -- merujuk ke jenis_barang.nama
  satuan text not null default 'Pcs',
  stok integer not null default 0,
  stok_min integer not null default 1,
  created_at timestamptz not null default now()
);

-- ---------- Transaksi (penerimaan / pemakaian) ----------
create table if not exists transaksi (
  id uuid primary key default gen_random_uuid(),
  tipe text not null check (tipe in ('masuk', 'keluar')),
  item_id uuid references items(id) on delete set null,
  item_nama text not null,
  item_kode text not null,
  kategori text,
  jenis text,
  qty integer not null,
  satuan text,
  tanggal date not null,
  stok_sesudah integer not null,
  -- khusus penerimaan
  sumber text,
  no_ref text,
  peruntukan text,               -- rencana pakai (kode kategori), khusus penerimaan
  -- khusus pemakaian
  unit text,
  digunakan_untuk text,
  diambil_oleh text,
  catatan text,
  created_at timestamptz not null default now()
);

create index if not exists idx_transaksi_item_id on transaksi(item_id);
create index if not exists idx_transaksi_created_at on transaksi(created_at desc);
create index if not exists idx_items_kategori on items(kategori);

-- ---------- Seed data awal kategori & jenis ----------
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

insert into jenis_barang (nama) values ('Sparepart'), ('Ban')
on conflict (nama) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY — WAJIB LOGIN (authenticated) untuk akses
-- ============================================================

alter table items enable row level security;
alter table transaksi enable row level security;
alter table kategori enable row level security;
alter table jenis_barang enable row level security;

create policy "items_auth_all" on items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "transaksi_auth_all" on transaksi
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "kategori_auth_all" on kategori
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "jenis_auth_all" on jenis_barang
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- Setelah menjalankan script ini, buat akun login pengguna di:
-- Supabase Dashboard > Authentication > Users > Add user
-- (isi email & password manual — tidak ada pendaftaran publik
-- di aplikasi ini, jadi cuma orang yang kamu buatkan akun yang
-- bisa login)
-- ============================================================
