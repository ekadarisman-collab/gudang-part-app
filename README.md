# Gudang Part — Aplikasi Pengelolaan Spare Part & Ban Forklift/Mobil

Aplikasi web untuk mengelola stok sparepart & ban forklift (2.5T/3T/5T, Battery/Diesel)
dan mobil operasional (Avanza, Hiace, Grandmax Pickup), dengan pencatatan penerimaan
(stok masuk) dan pemakaian (stok keluar). Bisa diakses dari browser HP maupun komputer.

Dibangun dengan **Next.js** (frontend) + **Supabase** (database/backend).

---

## 1. Setup Database (Supabase) — gratis

1. Buat akun & project baru di https://supabase.com
2. Di dashboard project, buka **SQL Editor** → **New query**
3. Copy seluruh isi file `supabase-schema.sql` di folder ini, paste, lalu klik **Run**
   (ini akan membuat tabel `items` dan `transaksi`)
4. Buka **Project Settings → API**, catat dua nilai ini:
   - **Project URL**
   - **anon public** key

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

- **Ringkasan** — total barang, alert stok menipis, jumlah transaksi hari ini
- **Barang** — data master sparepart & ban per kategori kendaraan, kode barang otomatis
- **Terima** — catat penerimaan stok (sumber, no. PO/faktur), stok otomatis bertambah
- **Pakai** — catat pemakaian ke unit tertentu, menolak transaksi jika stok tidak cukup
- **Riwayat** — log semua transaksi dengan pencarian & filter
- **Import** (ikon panah atas di header) — upload file Excel/CSV untuk menambah banyak
  barang sekaligus. Sediakan tombol "Download Template" agar formatnya pasti sesuai
- **Export** (ikon panah bawah di header) — unduh seluruh data barang & riwayat
  transaksi sebagai satu file Excel (2 sheet: Data Barang, Riwayat Transaksi)
- **Cetak** (ikon printer di header) — cetak Laporan Stok atau Laporan Riwayat
  Transaksi (bisa difilter rentang tanggal) dalam format siap print/PDF (A4)

### Cara pakai Import

1. Klik ikon panah-atas (Import) di pojok kanan atas
2. Klik **Download Template Excel** untuk contoh format & daftar kode kategori
3. Isi data barang di file itu (kolom: Nama, Kategori, Jenis, Satuan, Stok Awal,
   Stok Minimum) — kolom Kategori bisa diisi kode singkat (mis. `FL3D`) atau nama
   lengkap (mis. `Forklift 3T - Diesel`), lihat sheet "Daftar Kode Kategori"
4. Upload file yang sudah diisi, aplikasi akan menampilkan pratinjau baris yang
   valid/tidak valid sebelum benar-benar mengimpor
5. Klik **Import** untuk menyimpan ke database

### Cara pakai Cetak

1. Klik ikon printer di header
2. Pilih **Laporan Stok** (daftar semua barang & sisa stok saat ini) atau
   **Riwayat Transaksi** (bisa difilter tanggal)
3. Klik **Cetak Sekarang** — jendela print browser akan terbuka, pilih
   **Save as PDF** kalau ingin menyimpan sebagai file, atau kirim ke printer
