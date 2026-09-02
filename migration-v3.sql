-- ============================================================
-- MIGRASI v3 — Tabel Admin (untuk fitur "Bersihkan Data")
-- Aman dijalankan di atas instalasi yang sudah pakai migration-v2.sql
-- Jalankan di: Supabase Project > SQL Editor > New query > Run
-- ============================================================

create table if not exists admins (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- Semua pengguna yang sudah login boleh MELIHAT daftar admin
-- (dipakai aplikasi untuk cek "apakah saya admin?"), tapi TIDAK
-- ada policy insert/update/delete di sini — artinya menambah/
-- menghapus admin HARUS lewat Supabase Table Editor langsung,
-- tidak bisa dari aplikasi. Ini sengaja, supaya orang biasa tidak
-- bisa menjadikan dirinya admin dari dalam aplikasi.
drop policy if exists "admins_select_authenticated" on admins;
create policy "admins_select_authenticated" on admins
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- WAJIB: ganti email di bawah dengan email akun login kamu
-- sendiri (yang sudah dibuat di Authentication > Users), supaya
-- kamu jadi admin pertama. Jalankan baris ini setelah membuat
-- akun user-nya.
-- ============================================================
insert into admins (email) values ('GANTI_DENGAN_EMAIL_KAMU@example.com')
on conflict (email) do nothing;

-- Untuk menambah admin lain nanti, cukup jalankan ulang query
-- serupa dengan email yang berbeda, atau tambah baris manual
-- lewat Table Editor > tabel "admins" > Insert row.
