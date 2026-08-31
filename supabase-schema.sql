-- ============================================================
-- SCHEMA: Gudang Part - Spare Part & Ban Forklift/Mobil
-- Jalankan script ini di Supabase: Project > SQL Editor > New query
-- ============================================================

create extension if not exists "pgcrypto";

-- Tabel master barang (sparepart & ban)
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  kode text not null,
  nama text not null,
  kategori text not null,        -- id kategori, cth: FL25B, FL3D, AVZ, HIC, GDM, UMU
  jenis text not null,           -- 'Sparepart' atau 'Ban'
  satuan text not null default 'Pcs',
  stok integer not null default 0,
  stok_min integer not null default 1,
  created_at timestamptz not null default now()
);

-- Tabel transaksi (penerimaan / pemakaian)
create table if not exists transaksi (
  id uuid primary key default gen_random_uuid(),
  tipe text not null check (tipe in ('masuk', 'keluar')),
  item_id uuid references items(id) on delete set null,
  item_nama text not null,       -- snapshot nama barang saat transaksi (tetap ada walau item dihapus)
  item_kode text not null,
  kategori text,
  jenis text,
  qty integer not null,
  satuan text,
  tanggal date not null,
  stok_sesudah integer not null,
  -- kolom khusus penerimaan
  sumber text,
  no_ref text,
  -- kolom khusus pemakaian
  unit text,
  digunakan_untuk text,
  diambil_oleh text,
  catatan text,
  created_at timestamptz not null default now()
);

create index if not exists idx_transaksi_item_id on transaksi(item_id);
create index if not exists idx_transaksi_created_at on transaksi(created_at desc);
create index if not exists idx_items_kategori on items(kategori);

-- ============================================================
-- ROW LEVEL SECURITY
-- Contoh di bawah ini membuka akses penuh untuk siapa saja yang
-- punya anon key (cukup untuk pemakaian internal tim kecil).
-- Kalau butuh login/otorisasi per pengguna, ganti policy ini
-- dengan pengecekan auth.uid() setelah menambahkan Supabase Auth.
-- ============================================================

alter table items enable row level security;
alter table transaksi enable row level security;

create policy "items_select_all" on items for select using (true);
create policy "items_insert_all" on items for insert with check (true);
create policy "items_update_all" on items for update using (true);
create policy "items_delete_all" on items for delete using (true);

create policy "transaksi_select_all" on transaksi for select using (true);
create policy "transaksi_insert_all" on transaksi for insert with check (true);
create policy "transaksi_update_all" on transaksi for update using (true);
create policy "transaksi_delete_all" on transaksi for delete using (true);
