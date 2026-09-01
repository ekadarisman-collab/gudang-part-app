# Gudang Part — Aplikasi Pengelolaan Spare Part & Ban Forklift/Mobil

Aplikasi web untuk mengelola stok sparepart & ban forklift (2.5T/3T/5T, Battery/Diesel)
dan mobil operasional (Avanza, Hiace, Grandmax Pickup), dengan pencatatan penerimaan
(stok masuk) dan pemakaian (stok keluar). Bisa diakses dari browser HP maupun komputer.

Dibangun dengan **Next.js** (frontend) + **Supabase** (database/backend).

---

## 1. Setup Database (Supabase) — gratis

1. Buat akun & project baru di https://supabase.com
2. Di dashboard project, buka **SQL Editor** → **New query**
3. **Instalasi baru** (project kosong): copy seluruh isi `supabase-schema.sql`, paste, klik **Run**.
   **Sudah pernah pakai versi lama** (sudah ada data): copy isi `migration-v2.sql` sebagai gantinya, paste, klik **Run**.
4. Buka **Project Settings → API**, catat dua nilai ini:
   - **Project URL**
   - **anon public** key (di tab "Legacy anon, service_role API keys" kalau Supabase menampilkan tab API keys baru)
5. Buat akun login (wajib, karena aplikasi ini butuh login): **Authentication → Users → Add user → Create new user**, isi email & password, centang **Auto Confirm User**

## 2. Jalankan di komputer (opsional, untuk uji coba)

```bash
npm install
cp .env.local.example .env.local
```

Edit `.env.local`, isi dengan nilai dari langkah 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi-anon-key-kamu
```

Lalu jalankan:

```bash
npm run dev
```

Buka `http://localhost:3000` di browser.

## 3. Deploy supaya bisa diakses dari browser mana saja (Vercel — gratis)

1. Upload folder project ini ke repository GitHub baru (bisa lewat web GitHub:
   "Add file → Upload files", atau lewat `git push` jika familiar dengan git)
2. Buka https://vercel.com → login/daftar → **Add New Project**
3. Pilih/import repository GitHub yang baru dibuat
4. Saat konfigurasi, isi **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL dari Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key dari Supabase
5. Klik **Deploy**. Setelah selesai (1-2 menit), Vercel akan memberi URL, contoh:
   `https://gudang-part-app.vercel.app`
6. URL ini bisa dibuka dari browser HP mana saja, tanpa perlu install apa-apa.
   Bisa juga di-*Add to Home Screen* di HP supaya terasa seperti aplikasi.

## Struktur Project

```
gudang-part-app/
├── app/
│   ├── layout.js        # kerangka halaman & judul
│   ├── page.js          # seluruh tampilan & logika aplikasi
│   └── globals.css      # styling Tailwind
├── lib/
│   └── supabaseClient.js  # koneksi ke database Supabase
├── supabase-schema.sql   # skema tabel database (jalankan sekali di Supabase)
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.local.example
```

## Catatan Keamanan

Skema database saat ini membuka akses baca/tulis untuk siapa saja yang memegang
`anon key` (cukup untuk pemakaian internal tim kecil yang saling percaya). Kalau ke
depannya butuh login per pengguna (misal: hanya admin gudang yang bisa hapus barang),
tambahkan **Supabase Auth** dan perbarui *policy* di `supabase-schema.sql` agar
memeriksa `auth.uid()`. Beri tahu saya kalau butuh bantuan menambahkan ini.

## Fitur

- **Login wajib** — aplikasi hanya bisa diakses setelah masuk dengan akun yang dibuatkan admin (lihat bagian "Membuat Akun Pengguna" di bawah)
- **Ringkasan** — total barang, alert stok menipis, jumlah transaksi hari ini
- **Barang** — data master sparepart & ban, dengan tambah/edit/hapus, kode barang otomatis
- **Terima** — catat penerimaan stok (sumber, no. PO/faktur, dan **peruntukan/rencana pakai** — dropdown pilih untuk unit mana barang ini rencananya dipakai), stok otomatis bertambah
- **Pakai** — catat pemakaian ke unit tertentu, menolak transaksi jika stok tidak cukup
- **Riwayat** — log semua transaksi dengan pencarian & filter, serta **tombol edit** di tiap baris untuk mengubah atau menghapus transaksi (stok otomatis disesuaikan ulang)
- **Kelola Kategori & Jenis** (menu titik-tiga di header) — tambah/edit/hapus kategori kendaraan (mis. tambah "Forklift 6T") dan jenis barang (mis. tambah "Oli") sendiri, tanpa perlu ubah kode
- **Import** (ikon panah atas di header) — upload file Excel/CSV untuk menambah banyak barang sekaligus
- **Export** (ikon panah bawah di header) — unduh seluruh data barang & riwayat transaksi sebagai file Excel
- **Cetak** (ikon printer di header) — cetak Laporan Stok atau Laporan Riwayat Transaksi (bisa difilter rentang tanggal)

### Membuat Akun Pengguna (WAJIB sebelum bisa login)

Aplikasi ini tidak punya halaman pendaftaran publik — hanya orang yang kamu buatkan akun yang bisa masuk. Caranya:

1. Buka Supabase Dashboard → project kamu → **Authentication** (ikon kunci di sidebar) → **Users**
2. Klik **Add user** → **Create new user**
3. Isi **Email** dan **Password**, lalu **centang "Auto Confirm User"** (supaya tidak perlu verifikasi email)
4. Klik **Create user**
5. Berikan email & password itu ke orang yang akan pakai aplikasi — mereka login lewat halaman login aplikasi

Ulangi langkah di atas untuk setiap orang yang butuh akses (misal: admin gudang, staf gudang).

### Kalau Sudah Punya Instalasi Lama (upgrade dari versi sebelumnya)

Kalau project Supabase kamu sudah berjalan dengan data (barang & transaksi sudah ada), **JANGAN** jalankan `supabase-schema.sql` lagi. Jalankan **`migration-v2.sql`** sebagai gantinya di SQL Editor Supabase — script ini aman dan tidak menghapus data yang sudah ada, hanya menambahkan tabel & kolom baru. Setelah itu, ikuti langkah "Membuat Akun Pengguna" di atas, lalu upload ulang file project yang baru ke GitHub.

### Cara pakai Import

1. Klik ikon panah-atas (Import) di pojok kanan atas
2. Klik **Download Template Excel** untuk contoh format & daftar kode kategori/jenis yang berlaku
3. Isi data barang, upload, cek pratinjau, lalu klik **Import**

### Cara pakai Cetak

1. Klik ikon printer di header
2. Pilih **Laporan Stok** atau **Riwayat Transaksi** (bisa difilter tanggal)
3. Klik **Cetak Sekarang** — pilih **Save as PDF** atau kirim ke printer

### Catatan tentang Edit/Hapus Transaksi

Mengedit atau menghapus transaksi akan otomatis menyesuaikan ulang stok barang saat ini. Namun kolom "sisa stok" yang tercatat pada transaksi-transaksi lain yang sudah lebih dulu tercatat tidak dihitung ulang secara retroaktif — ini keterbatasan yang wajar untuk aplikasi sederhana, dan tidak memengaruhi angka stok barang yang sebenarnya (yang selalu akurat).
