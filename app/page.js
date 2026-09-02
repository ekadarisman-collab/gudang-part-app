"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Warehouse, Package, ArrowDownCircle, ArrowUpCircle, History, Plus, Search,
  AlertTriangle, X, Trash2, Pencil, CheckCircle2, XCircle, Car, BatteryCharging,
  Fuel, Disc3, Wrench, CalendarDays, ChevronRight, Download, Upload, Printer,
  ArrowLeft, MoreVertical, LogOut, Settings, Lock, Mail, ShieldAlert, Database,
} from "lucide-react";
import * as XLSX from "xlsx";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function fmtDate(s) {
  if (!s) return "-";
  return new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function findKategori(list, id) {
  return (list || []).find((c) => c.kode === id) || { kode: id || "-", label: id || "Tidak diketahui", sub: "", icon: "wrench" };
}
function kategoriLabel(list, id) {
  const c = findKategori(list, id);
  return c.sub ? `${c.label} - ${c.sub}` : c.label;
}

function mapItemRow(d) {
  return { id: d.id, kode: d.kode, nama: d.nama, kategori: d.kategori, jenis: d.jenis, satuan: d.satuan, stok: d.stok, stokMin: d.stok_min };
}
function mapTxRow(d) {
  return {
    id: d.id, tipe: d.tipe, itemId: d.item_id, itemNama: d.item_nama, itemKode: d.item_kode,
    kategori: d.kategori, jenis: d.jenis, qty: d.qty, satuan: d.satuan, tanggal: d.tanggal,
    sumber: d.sumber, noRef: d.no_ref, peruntukan: d.peruntukan, unit: d.unit,
    digunakanUntuk: d.digunakan_untuk, diambilOleh: d.diambil_oleh, catatan: d.catatan,
    stokSesudah: d.stok_sesudah, createdAt: d.created_at,
  };
}
function mapKategoriRow(d) {
  return { id: d.id, kode: d.kode, label: d.label, sub: d.sub, icon: d.icon, urutan: d.urutan };
}
function mapJenisRow(d) {
  return { id: d.id, nama: d.nama };
}

function CatIcon({ icon, size = 14, className = "" }) {
  const p = { size, className };
  if (icon === "battery") return <BatteryCharging {...p} />;
  if (icon === "diesel") return <Fuel {...p} />;
  if (icon === "car") return <Car {...p} />;
  return <Wrench {...p} />;
}

function Plate({ kategoriList, kategoriId, compact }) {
  const c = findKategori(kategoriList, kategoriId);
  return (
    <div
      className={`inline-flex items-center gap-1.5 border-2 border-amber-500 bg-stone-900 text-amber-400 rounded-sm ${compact ? "px-1.5 py-0.5" : "px-2 py-1"}`}
      style={{ fontFamily: "monospace" }}
      title={kategoriLabel(kategoriList, kategoriId)}
    >
      <CatIcon icon={c.icon} size={compact ? 11 : 13} className="text-amber-400 shrink-0" />
      <span className={`font-bold tracking-wider leading-none ${compact ? "text-[10px]" : "text-xs"}`}>{c.kode}</span>
    </div>
  );
}

function JenisTag({ jenis }) {
  const isBan = String(jenis || "").toLowerCase() === "ban";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${isBan ? "bg-stone-800 text-stone-200 border-stone-700" : "bg-stone-100 text-stone-600 border-stone-300"}`}>
      {isBan ? <Disc3 size={10} /> : <Wrench size={10} />}
      {jenis}
    </span>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const ok = toast.type === "success";
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
      <div className={`flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg border text-sm font-medium ${ok ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-red-50 border-red-300 text-red-800"}`}>
        {ok ? <CheckCircle2 size={18} className="shrink-0" /> : <XCircle size={18} className="shrink-0" />}
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-stone-900/60 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wide">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-100">
            <X size={18} className="text-stone-500" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400";

function EmptyState({ text }) {
  return (
    <div className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center text-stone-400">
      <p className="text-xs font-medium">{text}</p>
    </div>
  );
}

function SetupNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-6">
      <div className="max-w-md bg-white border border-amber-300 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="text-amber-500" size={20} />
          <h1 className="font-bold text-stone-900">Supabase belum dikonfigurasi</h1>
        </div>
        <p className="text-sm text-stone-600 mb-3">
          Tambahkan variabel environment <code className="bg-stone-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
          <code className="bg-stone-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di file <code className="bg-stone-100 px-1 rounded">.env.local</code>{" "}
          (lokal) atau di Environment Variables project Vercel (produksi).
        </p>
        <p className="text-xs text-stone-400">Lihat README.md untuk panduan lengkap.</p>
      </div>
    </div>
  );
}

function LoadingScreen({ text }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100">
      <div className="flex flex-col items-center gap-3 text-stone-500">
        <Warehouse size={36} className="animate-pulse text-amber-500" />
        <span className="text-sm font-medium">{text}</span>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message === "Invalid login credentials" ? "Email atau password salah." : error.message);
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="bg-amber-500 rounded-md p-2">
            <Warehouse size={22} className="text-stone-900" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-stone-900 leading-none">GUDANG PART</h1>
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-0.5">Forklift &amp; Kendaraan Operasional</p>
          </div>
        </div>
        <form onSubmit={submit} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-stone-900 mb-4">Masuk ke Akun</h2>
          <Field label="Email">
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls + " pl-9"} placeholder="nama@perusahaan.com" />
            </div>
          </Field>
          <Field label="Password">
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls + " pl-9"} placeholder="********" />
            </div>
          </Field>
          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-amber-500 disabled:bg-stone-200 text-stone-900 font-bold py-2.5 rounded-lg text-sm">
            {loading ? "Memeriksa..." : "Masuk"}
          </button>
        </form>
        <p className="text-[11px] text-stone-400 text-center mt-4">Belum punya akun? Hubungi admin gudang untuk dibuatkan akses.</p>
      </div>
    </div>
  );
}

// ===================== EXPORT / IMPORT / TEMPLATE =====================

function exportToExcel(items, transaksi, kategoriList) {
  const wb = XLSX.utils.book_new();

  const itemsSheet = XLSX.utils.json_to_sheet(
    items.map((i) => ({
      Kode: i.kode,
      Nama: i.nama,
      Kategori: kategoriLabel(kategoriList, i.kategori),
      "Kode Kategori": i.kategori,
      Jenis: i.jenis,
      Satuan: i.satuan,
      Stok: i.stok,
      "Stok Minimum": i.stokMin,
      Status: i.stok <= i.stokMin ? "MENIPIS" : "AMAN",
    }))
  );
  XLSX.utils.book_append_sheet(wb, itemsSheet, "Data Barang");

  const txSheet = XLSX.utils.json_to_sheet(
    transaksi.map((t) => ({
      Tanggal: t.tanggal,
      Tipe: t.tipe === "masuk" ? "Penerimaan" : "Pemakaian",
      "Kode Barang": t.itemKode,
      "Nama Barang": t.itemNama,
      Jenis: t.jenis,
      Qty: t.qty,
      Satuan: t.satuan,
      "Sisa Stok": t.stokSesudah,
      "Sumber/Unit": t.tipe === "masuk" ? t.sumber || "" : kategoriLabel(kategoriList, t.unit || ""),
      "Peruntukan / No Unit": t.tipe === "masuk" ? (t.peruntukan ? kategoriLabel(kategoriList, t.peruntukan) : "") : t.digunakanUntuk || "",
      "No Ref": t.tipe === "masuk" ? t.noRef || "" : "",
      "Diambil Oleh": t.diambilOleh || "",
      Catatan: t.catatan || "",
    }))
  );
  XLSX.utils.book_append_sheet(wb, txSheet, "Riwayat Transaksi");

  XLSX.writeFile(wb, `gudang-part-export-${todayStr()}.xlsx`);
}

function downloadTemplate(kategoriList, jenisList) {
  const wb = XLSX.utils.book_new();
  const kode1 = kategoriList[0]?.kode || "UMU";
  const kode2 = kategoriList[1]?.kode || kode1;
  const jenis1 = jenisList[0]?.nama || "Sparepart";
  const jenis2 = jenisList[1]?.nama || jenis1;
  const contoh = [
    { Nama: "Filter Oli Forklift", Kategori: kode1, Jenis: jenis1, Satuan: "Pcs", "Stok Awal": 10, "Stok Minimum": 2 },
    { Nama: "Ban Depan", Kategori: kode2, Jenis: jenis2, Satuan: "Pcs", "Stok Awal": 4, "Stok Minimum": 1 },
  ];
  const ws = XLSX.utils.json_to_sheet(contoh);
  XLSX.utils.book_append_sheet(wb, ws, "Template Import");

  const daftarKategori = kategoriList.map((c) => ({ "Kode Kategori": c.kode, "Nama Kategori": kategoriLabel(kategoriList, c.kode) }));
  const ws2 = XLSX.utils.json_to_sheet(daftarKategori);
  XLSX.utils.book_append_sheet(wb, ws2, "Daftar Kode Kategori");

  const daftarJenis = jenisList.map((j) => ({ "Nama Jenis": j.nama }));
  const ws3 = XLSX.utils.json_to_sheet(daftarJenis);
  XLSX.utils.book_append_sheet(wb, ws3, "Daftar Jenis Barang");

  XLSX.writeFile(wb, "template-import-barang.xlsx");
}

function resolveKategori(kategoriList, value) {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  let cat = kategoriList.find((c) => c.kode.toLowerCase() === v);
  if (cat) return cat.kode;
  cat = kategoriList.find((c) => `${c.label} - ${c.sub}`.toLowerCase() === v || c.label.toLowerCase() === v);
  return cat ? cat.kode : null;
}
function resolveJenis(jenisList, value) {
  const v = String(value || "").trim().toLowerCase();
  const j = jenisList.find((j) => j.nama.toLowerCase() === v);
  return j ? j.nama : null;
}
function parseImportRows(rawRows, kategoriList, jenisList) {
  const valid = [];
  const invalid = [];
  rawRows.forEach((r, idx) => {
    const nama = r["Nama"] ?? r["nama"] ?? r["Nama Barang"];
    const kategoriRaw = r["Kategori"] ?? r["kategori"] ?? r["Kode Kategori"];
    const jenisRaw = r["Jenis"] ?? r["jenis"];
    const satuan = r["Satuan"] ?? r["satuan"] ?? "Pcs";
    const stokAwal = r["Stok Awal"] ?? r["Stok"] ?? r["stok"] ?? 0;
    const stokMin = r["Stok Minimum"] ?? r["Stok Min"] ?? r["stokMin"] ?? 1;

    const kategori = resolveKategori(kategoriList, kategoriRaw);
    const jenis = resolveJenis(jenisList, jenisRaw);

    if (!nama || !String(nama).trim()) {
      invalid.push({ row: idx + 2, reason: "Nama barang kosong" });
    } else if (!kategori) {
      invalid.push({ row: idx + 2, reason: `Kategori "${kategoriRaw || "-"}" tidak dikenali` });
    } else if (!jenis) {
      invalid.push({ row: idx + 2, reason: `Jenis "${jenisRaw || "-"}" tidak dikenali (lihat sheet Daftar Jenis Barang)` });
    } else {
      valid.push({
        nama: String(nama).trim(),
        kategori,
        jenis,
        satuan: String(satuan).trim() || "Pcs",
        stokAwal: Number(stokAwal) || 0,
        stokMin: Number(stokMin) || 1,
      });
    }
  });
  return { valid, invalid };
}

function PrintView({ type, items, transaksi, kategoriList, dateFrom, dateTo, onClose }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 350);
    function handleAfterPrint() {
      onClose();
    }
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
    // eslint-disable-next-line
  }, []);

  const filteredTx = transaksi.filter((t) => {
    if (dateFrom && t.tanggal < dateFrom) return false;
    if (dateTo && t.tanggal > dateTo) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white text-stone-900 p-6 print:p-0">
      <div className="print:hidden mb-5">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm font-semibold text-stone-600 border border-stone-300 rounded-lg px-3 py-1.5">
          <ArrowLeft size={14} /> Kembali ke Aplikasi
        </button>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <Warehouse size={20} />
        <h1 className="text-lg font-extrabold tracking-tight">GUDANG PART</h1>
      </div>
      <p className="text-xs text-stone-500 mb-1">Forklift & Kendaraan Operasional v01</p>
      <p className="text-xs font-semibold text-stone-700 mb-4">
        {type === "stok" ? "LAPORAN STOK BARANG" : "LAPORAN RIWAYAT TRANSAKSI"}
        {type === "riwayat" && (dateFrom || dateTo) ? ` (${dateFrom || "awal"} s/d ${dateTo || "sekarang"})` : ""}
        {" "}&middot; dicetak {fmtDate(todayStr())}
      </p>

      {type === "stok" ? (
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b-2 border-stone-900">
              <th className="text-left py-1.5 pr-2">Kode</th>
              <th className="text-left py-1.5 pr-2">Nama Barang</th>
              <th className="text-left py-1.5 pr-2">Kategori</th>
              <th className="text-left py-1.5 pr-2">Jenis</th>
              <th className="text-right py-1.5 pr-2">Stok</th>
              <th className="text-right py-1.5">Min</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-stone-300">
                <td className="py-1 pr-2">{i.kode}</td>
                <td className="py-1 pr-2">{i.nama}</td>
                <td className="py-1 pr-2">{kategoriLabel(kategoriList, i.kategori)}</td>
                <td className="py-1 pr-2">{i.jenis}</td>
                <td className={`py-1 pr-2 text-right font-semibold ${i.stok <= i.stokMin ? "text-red-600" : ""}`}>{i.stok} {i.satuan}</td>
                <td className="py-1 text-right">{i.stokMin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b-2 border-stone-900">
              <th className="text-left py-1.5 pr-2">Tanggal</th>
              <th className="text-left py-1.5 pr-2">Tipe</th>
              <th className="text-left py-1.5 pr-2">Barang</th>
              <th className="text-right py-1.5 pr-2">Qty</th>
              <th className="text-left py-1.5 pr-2">Keterangan</th>
              <th className="text-right py-1.5">Sisa Stok</th>
            </tr>
          </thead>
          <tbody>
            {filteredTx.map((t) => (
              <tr key={t.id} className="border-b border-stone-300">
                <td className="py-1 pr-2">{fmtDate(t.tanggal)}</td>
                <td className="py-1 pr-2">{t.tipe === "masuk" ? "Terima" : "Pakai"}</td>
                <td className="py-1 pr-2">{t.itemNama} ({t.itemKode})</td>
                <td className="py-1 pr-2 text-right">{t.qty} {t.satuan}</td>
                <td className="py-1 pr-2">
                  {t.tipe === "masuk" ? t.sumber || "-" : kategoriLabel(kategoriList, t.unit || "")}
                  {t.tipe === "masuk" && t.peruntukan ? ` (untuk ${kategoriLabel(kategoriList, t.peruntukan)})` : ""}
                </td>
                <td className="py-1 text-right">{t.stokSesudah}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="text-[10px] text-stone-400 mt-6 print:fixed print:bottom-4">Gudang Part App &middot; {items.length} barang terdaftar</p>
    </div>
  );
}

function PrintModal({ onClose, onPrint }) {
  const [type, setType] = useState("stok");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  return (
    <Modal title="Cetak Laporan" onClose={onClose}>
      <Field label="Jenis Laporan">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setType("stok")} className={`py-2 rounded-lg text-sm font-semibold border ${type === "stok" ? "bg-stone-900 text-amber-400 border-stone-900" : "bg-white text-stone-600 border-stone-300"}`}>
            Laporan Stok
          </button>
          <button type="button" onClick={() => setType("riwayat")} className={`py-2 rounded-lg text-sm font-semibold border ${type === "riwayat" ? "bg-stone-900 text-amber-400 border-stone-900" : "bg-white text-stone-600 border-stone-300"}`}>
            Riwayat Transaksi
          </button>
        </div>
      </Field>
      {type === "riwayat" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dari Tanggal (opsional)">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Sampai Tanggal (opsional)">
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
          </Field>
        </div>
      )}
      <button onClick={() => onPrint({ type, dateFrom, dateTo })} className="w-full mt-2 bg-stone-900 text-amber-400 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2">
        <Printer size={16} /> Cetak Sekarang
      </button>
    </Modal>
  );
}

function ImportModal({ kategoriList, jenisList, onClose, onConfirm }) {
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setError("");
    setParsed(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (rows.length === 0) {
          setError("File kosong atau format tidak sesuai template.");
          return;
        }
        setParsed(parseImportRows(rows, kategoriList, jenisList));
      } catch (err) {
        setError("Gagal membaca file. Pastikan formatnya .xlsx, .xls, atau .csv sesuai template.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function confirm() {
    if (!parsed || parsed.valid.length === 0 || importing) return;
    setImporting(true);
    await onConfirm(parsed.valid);
    setImporting(false);
  }

  return (
    <Modal title="Import Data Barang" onClose={onClose}>
      <p className="text-xs text-stone-500 mb-3">
        Unggah file Excel/CSV sesuai template untuk menambah banyak barang sekaligus. Barang akan ditambahkan sebagai data baru.
      </p>
      <button type="button" onClick={() => downloadTemplate(kategoriList, jenisList)} className="w-full mb-3 border border-stone-300 text-stone-700 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5">
        <Download size={13} /> Download Template Excel
      </button>
      <Field label="Pilih File (.xlsx / .csv)">
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="text-xs w-full border border-stone-300 rounded-lg p-2" />
      </Field>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      {parsed && (
        <div className="mb-3 text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5">
          <p className="text-emerald-700 font-semibold">✓ {parsed.valid.length} baris siap diimpor dari "{fileName}"</p>
          {parsed.invalid.length > 0 && (
            <div className="mt-1.5 text-red-600">
              <p className="font-semibold">{parsed.invalid.length} baris dilewati:</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 max-h-24 overflow-y-auto">
                {parsed.invalid.slice(0, 10).map((r, idx) => (
                  <li key={idx}>Baris {r.row}: {r.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <button
        onClick={confirm}
        disabled={!parsed || parsed.valid.length === 0 || importing}
        className="w-full bg-amber-500 disabled:bg-stone-200 disabled:text-stone-400 text-stone-900 font-bold py-2.5 rounded-lg text-sm"
      >
        {importing ? "Mengimpor..." : `Import ${parsed ? parsed.valid.length : 0} Barang`}
      </button>
    </Modal>
  );
}

function MasterDataView({ kategoriList, jenisList, items, onClose, onAddKategori, onUpdateKategori, onDeleteKategori, onAddJenis, onUpdateJenis, onDeleteJenis }) {
  const [tab, setTab] = useState("kategori");
  const [showKatModal, setShowKatModal] = useState(false);
  const [editingKat, setEditingKat] = useState(null);
  const [showJenisModal, setShowJenisModal] = useState(false);
  const [editingJenis, setEditingJenis] = useState(null);

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-stone-900 text-white px-4 pt-4 pb-3 sticky top-0 z-30">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm font-semibold text-stone-300 mb-2">
          <ArrowLeft size={15} /> Kembali
        </button>
        <h1 className="font-extrabold text-base">Kelola Kategori & Jenis</h1>
      </header>
      <div className="max-w-lg mx-auto p-4">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("kategori")} className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${tab === "kategori" ? "bg-stone-900 text-amber-400 border-stone-900" : "bg-white text-stone-600 border-stone-300"}`}>
            Kategori Kendaraan
          </button>
          <button onClick={() => setTab("jenis")} className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${tab === "jenis" ? "bg-stone-900 text-amber-400 border-stone-900" : "bg-white text-stone-600 border-stone-300"}`}>
            Jenis Barang
          </button>
        </div>

        {tab === "kategori" ? (
          <div>
            <button onClick={() => { setEditingKat(null); setShowKatModal(true); }} className="w-full mb-3 bg-amber-500 text-stone-900 font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-1.5">
              <Plus size={15} /> Tambah Kategori
            </button>
            <div className="space-y-2">
              {kategoriList.map((c) => {
                const used = items.filter((i) => i.kategori === c.kode).length;
                return (
                  <div key={c.id} className="bg-white border border-stone-200 rounded-lg p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Plate kategoriList={kategoriList} kategoriId={c.kode} compact />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-900 truncate">{c.label}{c.sub ? ` - ${c.sub}` : ""}</p>
                        <p className="text-[10px] text-stone-400">{used} barang pakai kategori ini</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditingKat(c); setShowKatModal(true); }} className="p-1.5 rounded-md hover:bg-stone-100 text-stone-500"><Pencil size={14} /></button>
                      <button onClick={() => onDeleteKategori(c, used)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
              {kategoriList.length === 0 && <EmptyState text="Belum ada kategori. Tambahkan dulu sebelum bisa input barang." />}
            </div>
          </div>
        ) : (
          <div>
            <button onClick={() => { setEditingJenis(null); setShowJenisModal(true); }} className="w-full mb-3 bg-amber-500 text-stone-900 font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-1.5">
              <Plus size={15} /> Tambah Jenis
            </button>
            <div className="space-y-2">
              {jenisList.map((j) => {
                const used = items.filter((i) => i.jenis === j.nama).length;
                return (
                  <div key={j.id} className="bg-white border border-stone-200 rounded-lg p-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{j.nama}</p>
                      <p className="text-[10px] text-stone-400">{used} barang pakai jenis ini</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditingJenis(j); setShowJenisModal(true); }} className="p-1.5 rounded-md hover:bg-stone-100 text-stone-500"><Pencil size={14} /></button>
                      <button onClick={() => onDeleteJenis(j, used)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
              {jenisList.length === 0 && <EmptyState text="Belum ada jenis barang. Tambahkan dulu sebelum bisa input barang." />}
            </div>
          </div>
        )}
      </div>

      {showKatModal && (
        <KategoriFormModal
          editing={editingKat}
          onClose={() => { setShowKatModal(false); setEditingKat(null); }}
          onAdd={onAddKategori}
          onUpdate={onUpdateKategori}
        />
      )}
      {showJenisModal && (
        <JenisFormModal
          editing={editingJenis}
          onClose={() => { setShowJenisModal(false); setEditingJenis(null); }}
          onAdd={onAddJenis}
          onUpdate={onUpdateJenis}
        />
      )}
    </div>
  );
}

function KategoriFormModal({ editing, onClose, onAdd, onUpdate }) {
  const [kode, setKode] = useState(editing?.kode || "");
  const [label, setLabel] = useState(editing?.label || "");
  const [sub, setSub] = useState(editing?.sub || "");
  const [icon, setIcon] = useState(editing?.icon || "wrench");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!kode.trim() || !label.trim() || saving) return;
    setSaving(true);
    if (editing) await onUpdate(editing.id, { label, sub, icon });
    else await onAdd({ kode: kode.trim().toUpperCase(), label, sub, icon });
    setSaving(false);
  }

  return (
    <Modal title={editing ? "Edit Kategori" : "Tambah Kategori"} onClose={onClose}>
      <Field label="Kode Singkat (unik, tanpa spasi)">
        <input value={kode} onChange={(e) => setKode(e.target.value)} disabled={!!editing} className={inputCls + (editing ? " bg-stone-100 text-stone-400" : "")} placeholder="cth. FL6B" />
      </Field>
      <Field label="Nama Kendaraan">
        <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} placeholder="cth. Forklift 6T" />
      </Field>
      <Field label="Sub / Tipe">
        <input value={sub} onChange={(e) => setSub(e.target.value)} className={inputCls} placeholder="cth. Battery" />
      </Field>
      <Field label="Ikon">
        <div className="grid grid-cols-4 gap-2">
          {[["battery", BatteryCharging], ["diesel", Fuel], ["car", Car], ["wrench", Wrench]].map(([key, Icon]) => (
            <button type="button" key={key} onClick={() => setIcon(key)} className={`py-2 rounded-lg border flex items-center justify-center ${icon === key ? "bg-stone-900 border-stone-900 text-amber-400" : "bg-white border-stone-300 text-stone-500"}`}>
              <Icon size={16} />
            </button>
          ))}
        </div>
      </Field>
      <button onClick={submit} disabled={!kode.trim() || !label.trim() || saving} className="w-full mt-2 bg-amber-500 disabled:bg-stone-200 disabled:text-stone-400 text-stone-900 font-bold py-2.5 rounded-lg text-sm">
        {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Kategori"}
      </button>
    </Modal>
  );
}

function JenisFormModal({ editing, onClose, onAdd, onUpdate }) {
  const [nama, setNama] = useState(editing?.nama || "");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!nama.trim() || saving) return;
    setSaving(true);
    if (editing) await onUpdate(editing.id, nama.trim());
    else await onAdd(nama.trim());
    setSaving(false);
  }

  return (
    <Modal title={editing ? "Edit Jenis Barang" : "Tambah Jenis Barang"} onClose={onClose}>
      <Field label="Nama Jenis">
        <input value={nama} onChange={(e) => setNama(e.target.value)} className={inputCls} placeholder="cth. Oli / Alat Bengkel" />
      </Field>
      <button onClick={submit} disabled={!nama.trim() || saving} className="w-full mt-2 bg-amber-500 disabled:bg-stone-200 disabled:text-stone-400 text-stone-900 font-bold py-2.5 rounded-lg text-sm">
        {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Jenis"}
      </button>
    </Modal>
  );
}

function TransaksiEditModal({ tx, kategoriList, onClose, onSave, onDelete }) {
  const [qty, setQty] = useState(tx.qty);
  const [tanggal, setTanggal] = useState(tx.tanggal);
  const [sumber, setSumber] = useState(tx.sumber || "");
  const [noRef, setNoRef] = useState(tx.noRef || "");
  const [peruntukan, setPeruntukan] = useState(tx.peruntukan || "");
  const [unit, setUnit] = useState(tx.unit || "");
  const [digunakanUntuk, setDigunakanUntuk] = useState(tx.digunakanUntuk || "");
  const [diambilOleh, setDiambilOleh] = useState(tx.diambilOleh || "");
  const [catatan, setCatatan] = useState(tx.catatan || "");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function submit() {
    if (!qty || saving) return;
    setSaving(true);
    await onSave(tx, { qty: Number(qty), tanggal, sumber, noRef, peruntukan, unit, digunakanUntuk, diambilOleh, catatan });
    setSaving(false);
  }

  if (confirmingDelete) {
    return (
      <Modal title="Hapus Transaksi" onClose={() => setConfirmingDelete(false)}>
        <p className="text-sm text-stone-600 mb-4">
          Yakin hapus transaksi <strong>{tx.itemNama}</strong> ({tx.tipe === "masuk" ? "Penerimaan" : "Pemakaian"} {tx.qty} {tx.satuan})? Stok barang akan otomatis disesuaikan kembali.
        </p>
        <div className="flex gap-2">
          <button onClick={() => setConfirmingDelete(false)} className="flex-1 py-2 rounded-lg border border-stone-300 text-stone-700 text-sm font-semibold">Batal</button>
          <button onClick={() => onDelete(tx)} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold">Hapus</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Edit ${tx.tipe === "masuk" ? "Penerimaan" : "Pemakaian"}`} onClose={onClose}>
      <p className="text-xs text-stone-500 mb-3">{tx.itemNama} ({tx.itemKode})</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Jumlah"><input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} /></Field>
        <Field label="Tanggal"><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputCls} /></Field>
      </div>
      {tx.tipe === "masuk" ? (
        <>
          <Field label="Sumber / Supplier"><input value={sumber} onChange={(e) => setSumber(e.target.value)} className={inputCls} /></Field>
          <Field label="No. Referensi"><input value={noRef} onChange={(e) => setNoRef(e.target.value)} className={inputCls} /></Field>
          <Field label="Peruntukan (Rencana Pakai)">
            <select value={peruntukan} onChange={(e) => setPeruntukan(e.target.value)} className={inputCls}>
              <option value="">- Tidak ditentukan -</option>
              {kategoriList.map((c) => <option key={c.kode} value={c.kode}>{kategoriLabel(kategoriList, c.kode)}</option>)}
            </select>
          </Field>
        </>
      ) : (
        <>
          <Field label="Digunakan Untuk Unit">
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls}>
              {kategoriList.map((c) => <option key={c.kode} value={c.kode}>{kategoriLabel(kategoriList, c.kode)}</option>)}
            </select>
          </Field>
          <Field label="Nomor Unit / Plat"><input value={digunakanUntuk} onChange={(e) => setDigunakanUntuk(e.target.value)} className={inputCls} /></Field>
          <Field label="Diambil Oleh"><input value={diambilOleh} onChange={(e) => setDiambilOleh(e.target.value)} className={inputCls} /></Field>
        </>
      )}
      <Field label="Catatan"><input value={catatan} onChange={(e) => setCatatan(e.target.value)} className={inputCls} /></Field>
      <div className="flex gap-2 mt-2">
        <button onClick={() => setConfirmingDelete(true)} className="flex-1 border border-red-300 text-red-600 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5">
          <Trash2 size={14} /> Hapus
        </button>
        <button onClick={submit} disabled={!qty || saving} className="flex-[2] bg-amber-500 disabled:bg-stone-200 disabled:text-stone-400 text-stone-900 font-bold py-2.5 rounded-lg text-sm">
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </Modal>
  );
}

function ClearConfirmModal({ title, description, count, onClose, onConfirm }) {
  const [text, setText] = useState("");
  const [working, setWorking] = useState(false);
  const ready = text.trim().toUpperCase() === "HAPUS";

  async function confirm() {
    if (!ready || working) return;
    setWorking(true);
    await onConfirm();
    setWorking(false);
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-red-700">{description}</p>
        <p className="text-xs text-red-600 mt-2 font-semibold">{count} data akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.</p>
      </div>
      <Field label='Ketik "HAPUS" untuk konfirmasi'>
        <input value={text} onChange={(e) => setText(e.target.value)} className={inputCls} placeholder="HAPUS" />
      </Field>
      <button onClick={confirm} disabled={!ready || working} className="w-full bg-red-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2">
        <Trash2 size={15} /> {working ? "Menghapus..." : "Ya, Hapus Permanen"}
      </button>
    </Modal>
  );
}

function AdminDataView({ transaksi, onClose, onClear }) {
  const [confirming, setConfirming] = useState(null); // "masuk" | "keluar" | "semua" | null
  const countMasuk = transaksi.filter((t) => t.tipe === "masuk").length;
  const countKeluar = transaksi.filter((t) => t.tipe === "keluar").length;

  const options = [
    { key: "masuk", title: "Bersihkan Riwayat Penerimaan", desc: "Menghapus semua catatan transaksi penerimaan (stok masuk). Stok barang saat ini tidak berubah.", count: countMasuk },
    { key: "keluar", title: "Bersihkan Riwayat Pengeluaran", desc: "Menghapus semua catatan transaksi pemakaian (stok keluar). Stok barang saat ini tidak berubah.", count: countKeluar },
    { key: "semua", title: "Bersihkan Semua Riwayat", desc: "Menghapus SEMUA catatan penerimaan & pengeluaran sekaligus. Ringkasan Aktivitas Terbaru akan kosong kembali. Stok barang saat ini tidak berubah.", count: transaksi.length },
  ];

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-stone-900 text-white px-4 pt-4 pb-3 sticky top-0 z-30">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm font-semibold text-stone-300 mb-2">
          <ArrowLeft size={15} /> Kembali
        </button>
        <h1 className="font-extrabold text-base flex items-center gap-2"><ShieldAlert size={18} className="text-amber-400" /> Kelola Data (Admin)</h1>
      </header>
      <div className="max-w-lg mx-auto p-4">
        <p className="text-xs text-stone-500 mb-4">
          Fitur ini hanya untuk admin. Membersihkan riwayat hanya menghapus catatan transaksi (yang muncul di Ringkasan & Riwayat) — data master Barang dan angka stok saat ini tidak ikut terhapus.
        </p>
        <div className="space-y-3">
          {options.map((o) => (
            <div key={o.key} className="bg-white border border-stone-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-stone-900">{o.title}</p>
              <p className="text-xs text-stone-500 mt-1">{o.desc}</p>
              <p className="text-xs text-stone-400 mt-1">{o.count} transaksi saat ini</p>
              <button
                onClick={() => setConfirming(o.key)}
                disabled={o.count === 0}
                className="mt-2 w-full border border-red-300 disabled:border-stone-200 disabled:text-stone-300 text-red-600 font-semibold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5"
              >
                <Trash2 size={13} /> {o.count === 0 ? "Tidak ada data" : "Bersihkan"}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-stone-50 border border-stone-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5"><Database size={13} /> Butuh akses lebih detail?</p>
          <p className="text-[11px] text-stone-500">
           </p>
        </div>
      </div>

      {confirming && (
        <ClearConfirmModal
          title={options.find((o) => o.key === confirming).title}
          description={options.find((o) => o.key === confirming).desc}
          count={options.find((o) => o.key === confirming).count}
          onClose={() => setConfirming(null)}
          onConfirm={async () => {
            await onClear(confirming === "semua" ? null : confirming);
            setConfirming(null);
          }}
        />
      )}
    </div>
  );
}

export default function Page() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [tab, setTab] = useState("dashboard");
  const [items, setItems] = useState([]);
  const [transaksi, setTransaksi] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [jenisList, setJenisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingTx, setEditingTx] = useState(null);

  const [searchBarang, setSearchBarang] = useState("");
  const [filterKategori, setFilterKategori] = useState("ALL");
  const [filterJenis, setFilterJenis] = useState("ALL");

  const [txFilterTipe, setTxFilterTipe] = useState("ALL");
  const [txSearch, setTxSearch] = useState("");

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printMode, setPrintMode] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMasterData, setShowMasterData] = useState(false);
  const [showAdminData, setShowAdminData] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) init();
    else {
      setItems([]);
      setTransaksi([]);
      setKategoriList([]);
      setJenisList([]);
    }
    // eslint-disable-next-line
  }, [session]);

  async function init() {
    setLoading(true);
    await Promise.all([loadKategori(), loadJenis(), loadItems(), loadTransaksi(), loadIsAdmin()]);
    setLoading(false);
  }

  async function loadIsAdmin() {
    const email = session?.user?.email;
    if (!email) {
      setIsAdmin(false);
      return;
    }
    const { data, error } = await supabase.from("admins").select("email").eq("email", email).maybeSingle();
    if (error) {
      setIsAdmin(false);
      return;
    }
    setIsAdmin(!!data);
  }

  async function handleClearTransaksi(tipeFilter) {
    let query = supabase.from("transaksi").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (tipeFilter) query = query.eq("tipe", tipeFilter);
    const { error } = await query;
    if (error) {
      showToast("Gagal membersihkan riwayat: " + error.message, "error");
      return;
    }
    if (tipeFilter) setTransaksi((prev) => prev.filter((t) => t.tipe !== tipeFilter));
    else setTransaksi([]);
    showToast("Riwayat berhasil dibersihkan", "success");
  }

  async function loadKategori() {
    const { data, error } = await supabase.from("kategori").select("*").order("urutan");
    if (error) {
      showToast("Gagal memuat kategori: " + error.message, "error");
      return;
    }
    setKategoriList((data || []).map(mapKategoriRow));
  }

  async function loadJenis() {
    const { data, error } = await supabase.from("jenis_barang").select("*").order("nama");
    if (error) {
      showToast("Gagal memuat jenis barang: " + error.message, "error");
      return;
    }
    setJenisList((data || []).map(mapJenisRow));
  }

  async function loadItems() {
    const { data, error } = await supabase.from("items").select("*").order("nama");
    if (error) {
      showToast("Gagal memuat data barang: " + error.message, "error");
      return;
    }
    setItems((data || []).map(mapItemRow));
  }

  async function loadTransaksi() {
    const { data, error } = await supabase.from("transaksi").select("*").order("created_at", { ascending: false });
    if (error) {
      showToast("Gagal memuat riwayat transaksi: " + error.message, "error");
      return;
    }
    setTransaksi((data || []).map(mapTxRow));
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  function generateKode(kategoriId, jenis) {
    const prefix = String(jenis).toLowerCase() === "ban" ? "BAN" : "SP";
    const count = items.filter((i) => i.kategori === kategoriId && i.jenis === jenis).length + 1;
    return `${prefix}-${kategoriId}-${String(count).padStart(3, "0")}`;
  }

  async function handleAddItem(data) {
    const kode = generateKode(data.kategori, data.jenis);
    const { data: row, error } = await supabase
      .from("items")
      .insert({ kode, nama: data.nama, kategori: data.kategori, jenis: data.jenis, satuan: data.satuan || "Pcs", stok: Number(data.stokAwal) || 0, stok_min: Number(data.stokMin) || 1 })
      .select()
      .single();
    if (error) {
      showToast("Gagal menambah barang: " + error.message, "error");
      return;
    }
    setItems((prev) => [...prev, mapItemRow(row)].sort((a, b) => a.nama.localeCompare(b.nama)));
    showToast(`Barang "${data.nama}" ditambahkan (${kode})`, "success");
    setShowItemModal(false);
  }

  async function handleUpdateItem(id, data) {
    const { data: row, error } = await supabase
      .from("items")
      .update({ nama: data.nama, kategori: data.kategori, jenis: data.jenis, satuan: data.satuan, stok_min: Number(data.stokMin) })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      showToast("Gagal memperbarui barang: " + error.message, "error");
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? mapItemRow(row) : i)));
    showToast("Data barang diperbarui", "success");
    setEditingItem(null);
    setShowItemModal(false);
  }

  async function handleDeleteItem(id) {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) {
      showToast("Gagal menghapus barang: " + error.message, "error");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast("Barang dihapus", "success");
    setConfirmDelete(null);
  }

  async function submitPenerimaan(data) {
    const item = items.find((i) => i.id === data.itemId);
    if (!item) return false;
    const qty = Number(data.qty);
    if (!qty || qty <= 0) {
      showToast("Jumlah harus lebih dari 0", "error");
      return false;
    }
    const newStok = item.stok + qty;

    const { error: upErr } = await supabase.from("items").update({ stok: newStok }).eq("id", item.id);
    if (upErr) {
      showToast("Gagal memperbarui stok: " + upErr.message, "error");
      return false;
    }
    const { data: row, error: txErr } = await supabase
      .from("transaksi")
      .insert({
        tipe: "masuk", item_id: item.id, item_nama: item.nama, item_kode: item.kode,
        kategori: item.kategori, jenis: item.jenis, qty, satuan: item.satuan,
        tanggal: data.tanggal, sumber: data.sumber, no_ref: data.noRef, peruntukan: data.peruntukan || null,
        catatan: data.catatan, stok_sesudah: newStok,
      })
      .select()
      .single();
    if (txErr) {
      showToast("Gagal mencatat transaksi: " + txErr.message, "error");
      return false;
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, stok: newStok } : i)));
    setTransaksi((prev) => [mapTxRow(row), ...prev]);
    showToast(`Penerimaan ${qty} ${item.satuan} "${item.nama}" tercatat`, "success");
    return true;
  }

  async function submitPemakaian(data) {
    const item = items.find((i) => i.id === data.itemId);
    if (!item) return false;
    const qty = Number(data.qty);
    if (!qty || qty <= 0) {
      showToast("Jumlah harus lebih dari 0", "error");
      return false;
    }
    if (qty > item.stok) {
      showToast(`Stok tidak cukup. Sisa stok "${item.nama}": ${item.stok} ${item.satuan}`, "error");
      return false;
    }
    const newStok = item.stok - qty;

    const { error: upErr } = await supabase.from("items").update({ stok: newStok }).eq("id", item.id);
    if (upErr) {
      showToast("Gagal memperbarui stok: " + upErr.message, "error");
      return false;
    }
    const { data: row, error: txErr } = await supabase
      .from("transaksi")
      .insert({
        tipe: "keluar", item_id: item.id, item_nama: item.nama, item_kode: item.kode,
        kategori: item.kategori, jenis: item.jenis, qty, satuan: item.satuan,
        tanggal: data.tanggal, unit: data.unit, digunakan_untuk: data.digunakanUntuk,
        diambil_oleh: data.diambilOleh, catatan: data.catatan, stok_sesudah: newStok,
      })
      .select()
      .single();
    if (txErr) {
      showToast("Gagal mencatat transaksi: " + txErr.message, "error");
      return false;
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, stok: newStok } : i)));
    setTransaksi((prev) => [mapTxRow(row), ...prev]);
    showToast(`Pemakaian ${qty} ${item.satuan} "${item.nama}" tercatat`, "success");
    return true;
  }

  async function handleSaveTx(tx, data) {
    const item = items.find((i) => i.id === tx.itemId);
    if (!item) {
      showToast("Barang terkait sudah dihapus, tidak bisa diedit", "error");
      return;
    }
    const oldQty = tx.qty;
    const newQty = Number(data.qty);
    let stok = item.stok;
    stok = tx.tipe === "masuk" ? stok - oldQty : stok + oldQty;
    stok = tx.tipe === "masuk" ? stok + newQty : stok - newQty;
    if (stok < 0) {
      showToast("Perubahan ini membuat stok menjadi minus, tidak bisa disimpan", "error");
      return;
    }
    const updatePayload = tx.tipe === "masuk"
      ? { qty: newQty, tanggal: data.tanggal, sumber: data.sumber, no_ref: data.noRef, peruntukan: data.peruntukan || null, catatan: data.catatan, stok_sesudah: stok }
      : { qty: newQty, tanggal: data.tanggal, unit: data.unit, digunakan_untuk: data.digunakanUntuk, diambil_oleh: data.diambilOleh, catatan: data.catatan, stok_sesudah: stok };

    const { error: txErr } = await supabase.from("transaksi").update(updatePayload).eq("id", tx.id);
    if (txErr) {
      showToast("Gagal menyimpan perubahan: " + txErr.message, "error");
      return;
    }
    const { error: itemErr } = await supabase.from("items").update({ stok }).eq("id", item.id);
    if (itemErr) {
      showToast("Gagal memperbarui stok: " + itemErr.message, "error");
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, stok } : i)));
    setTransaksi((prev) => prev.map((t) => (t.id === tx.id ? { ...t, qty: newQty, tanggal: data.tanggal, sumber: data.sumber, noRef: data.noRef, peruntukan: data.peruntukan, unit: data.unit, digunakanUntuk: data.digunakanUntuk, diambilOleh: data.diambilOleh, catatan: data.catatan, stokSesudah: stok } : t)));
    showToast("Transaksi berhasil diperbarui", "success");
    setEditingTx(null);
  }

  async function handleDeleteTx(tx) {
    const item = items.find((i) => i.id === tx.itemId);
    if (item) {
      const stok = tx.tipe === "masuk" ? item.stok - tx.qty : item.stok + tx.qty;
      if (stok < 0) {
        showToast("Tidak bisa dihapus: akan membuat stok minus", "error");
        return;
      }
      const { error: itemErr } = await supabase.from("items").update({ stok }).eq("id", item.id);
      if (itemErr) {
        showToast("Gagal memperbarui stok: " + itemErr.message, "error");
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, stok } : i)));
    }
    const { error } = await supabase.from("transaksi").delete().eq("id", tx.id);
    if (error) {
      showToast("Gagal menghapus transaksi: " + error.message, "error");
      return;
    }
    setTransaksi((prev) => prev.filter((t) => t.id !== tx.id));
    showToast("Transaksi dihapus & stok disesuaikan", "success");
    setEditingTx(null);
  }

  async function handleBulkImport(rows) {
    const counters = {};
    items.forEach((i) => {
      const key = `${i.kategori}|${i.jenis}`;
      counters[key] = (counters[key] || 0) + 1;
    });
    const payload = rows.map((r) => {
      const key = `${r.kategori}|${r.jenis}`;
      counters[key] = (counters[key] || 0) + 1;
      const prefix = String(r.jenis).toLowerCase() === "ban" ? "BAN" : "SP";
      const kode = `${prefix}-${r.kategori}-${String(counters[key]).padStart(3, "0")}`;
      return { kode, nama: r.nama, kategori: r.kategori, jenis: r.jenis, satuan: r.satuan, stok: r.stokAwal, stok_min: r.stokMin };
    });
    const { data, error } = await supabase.from("items").insert(payload).select();
    if (error) {
      showToast("Gagal mengimpor: " + error.message, "error");
      return;
    }
    setItems((prev) => [...prev, ...data.map(mapItemRow)].sort((a, b) => a.nama.localeCompare(b.nama)));
    showToast(`${data.length} barang berhasil diimpor`, "success");
    setShowImportModal(false);
  }

  async function handleAddKategori(data) {
    const { data: row, error } = await supabase.from("kategori").insert({ kode: data.kode, label: data.label, sub: data.sub, icon: data.icon, urutan: kategoriList.length + 1 }).select().single();
    if (error) {
      showToast("Gagal menambah kategori: " + error.message, "error");
      return;
    }
    setKategoriList((prev) => [...prev, mapKategoriRow(row)]);
    showToast("Kategori ditambahkan", "success");
  }

  async function handleUpdateKategori(id, data) {
    const { data: row, error } = await supabase.from("kategori").update(data).eq("id", id).select().single();
    if (error) {
      showToast("Gagal memperbarui kategori: " + error.message, "error");
      return;
    }
    setKategoriList((prev) => prev.map((c) => (c.id === id ? mapKategoriRow(row) : c)));
    showToast("Kategori diperbarui", "success");
  }

  async function handleDeleteKategori(kat, used) {
    if (used > 0) {
      showToast(`Tidak bisa dihapus, masih dipakai ${used} barang`, "error");
      return;
    }
    const { error } = await supabase.from("kategori").delete().eq("id", kat.id);
    if (error) {
      showToast("Gagal menghapus: " + error.message, "error");
      return;
    }
    setKategoriList((prev) => prev.filter((c) => c.id !== kat.id));
    showToast("Kategori dihapus", "success");
  }

  async function handleAddJenis(nama) {
    const { data: row, error } = await supabase.from("jenis_barang").insert({ nama }).select().single();
    if (error) {
      showToast("Gagal menambah jenis: " + error.message, "error");
      return;
    }
    setJenisList((prev) => [...prev, mapJenisRow(row)]);
    showToast("Jenis ditambahkan", "success");
  }

  async function handleUpdateJenis(id, nama) {
    const { data: row, error } = await supabase.from("jenis_barang").update({ nama }).eq("id", id).select().single();
    if (error) {
      showToast("Gagal memperbarui jenis: " + error.message, "error");
      return;
    }
    setJenisList((prev) => prev.map((j) => (j.id === id ? mapJenisRow(row) : j)));
    showToast("Jenis diperbarui", "success");
  }

  async function handleDeleteJenis(j, used) {
    if (used > 0) {
      showToast(`Tidak bisa dihapus, masih dipakai ${used} barang`, "error");
      return;
    }
    const { error } = await supabase.from("jenis_barang").delete().eq("id", j.id);
    if (error) {
      showToast("Gagal menghapus: " + error.message, "error");
      return;
    }
    setJenisList((prev) => prev.filter((x) => x.id !== j.id));
    showToast("Jenis dihapus", "success");
  }

  const lowStockItems = useMemo(() => items.filter((i) => i.stok <= i.stokMin), [items]);

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      if (filterKategori !== "ALL" && i.kategori !== filterKategori) return false;
      if (filterJenis !== "ALL" && i.jenis !== filterJenis) return false;
      if (searchBarang && !`${i.nama} ${i.kode}`.toLowerCase().includes(searchBarang.toLowerCase())) return false;
      return true;
    });
  }, [items, filterKategori, filterJenis, searchBarang]);

  const filteredTx = useMemo(() => {
    return transaksi.filter((t) => {
      if (txFilterTipe !== "ALL" && t.tipe !== txFilterTipe) return false;
      if (txSearch && !`${t.itemNama} ${t.itemKode}`.toLowerCase().includes(txSearch.toLowerCase())) return false;
      return true;
    });
  }, [transaksi, txFilterTipe, txSearch]);

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (authLoading) return <LoadingScreen text="Memeriksa sesi login..." />;
  if (!session) return <LoginScreen />;

  if (printMode) {
    return (
      <PrintView
        type={printMode.type}
        items={items}
        transaksi={transaksi}
        kategoriList={kategoriList}
        dateFrom={printMode.dateFrom}
        dateTo={printMode.dateTo}
        onClose={() => setPrintMode(null)}
      />
    );
  }

  if (showMasterData) {
    return (
      <MasterDataView
        kategoriList={kategoriList}
        jenisList={jenisList}
        items={items}
        onClose={() => setShowMasterData(false)}
        onAddKategori={handleAddKategori}
        onUpdateKategori={handleUpdateKategori}
        onDeleteKategori={handleDeleteKategori}
        onAddJenis={handleAddJenis}
        onUpdateJenis={handleUpdateJenis}
        onDeleteJenis={handleDeleteJenis}
      />
    );
  }

  if (showAdminData) {
    return <AdminDataView transaksi={transaksi} onClose={() => setShowAdminData(false)} onClear={handleClearTransaksi} />;
  }

  if (loading) return <LoadingScreen text="Memuat data gudang..." />;

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <Toast toast={toast} />

      <header className="bg-stone-900 text-white px-4 pt-4 pb-3 sticky top-0 z-30 shadow-md relative">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-amber-500 rounded-md p-1.5 shrink-0">
              <Warehouse size={18} className="text-stone-900" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold tracking-tight text-base leading-none">GUDANG PART</h1>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-0.5 truncate">Forklift &amp; Kendaraan Operasional</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setShowImportModal(true)} title="Import Data" className="p-2 rounded-lg hover:bg-stone-800 text-stone-300">
              <Upload size={17} />
            </button>
            <button onClick={() => exportToExcel(items, transaksi, kategoriList)} title="Export ke Excel" className="p-2 rounded-lg hover:bg-stone-800 text-stone-300">
              <Download size={17} />
            </button>
            <button onClick={() => setShowPrintModal(true)} title="Cetak Laporan" className="p-2 rounded-lg hover:bg-stone-800 text-stone-300">
              <Printer size={17} />
            </button>
            <button onClick={() => setShowMenu((v) => !v)} title="Menu Lainnya" className="p-2 rounded-lg hover:bg-stone-800 text-stone-300">
              <MoreVertical size={17} />
            </button>
          </div>
        </div>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
            <div className="absolute right-4 top-16 bg-white rounded-lg shadow-lg border border-stone-200 z-40 overflow-hidden w-60">
              {session?.user?.email && (
                <div className="px-4 py-2.5 border-b border-stone-100 text-[11px] text-stone-400 truncate">Masuk sebagai {session.user.email}</div>
              )}
              <button onClick={() => { setShowMenu(false); setShowMasterData(true); }} className="w-full text-left px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2">
                <Settings size={15} /> Kelola Kategori & Jenis
              </button>
              {isAdmin && (
                <button onClick={() => { setShowMenu(false); setShowAdminData(true); }} className="w-full text-left px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2 border-t border-stone-100">
                  <ShieldAlert size={15} className="text-amber-500" /> Kelola Data (Admin)
                </button>
              )}
              <button onClick={() => { setShowMenu(false); handleLogout(); }} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-stone-100">
                <LogOut size={15} /> Keluar
              </button>
            </div>
          </>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4 max-w-lg w-full mx-auto">
        {tab === "dashboard" && <Dashboard items={items} transaksi={transaksi} lowStockItems={lowStockItems} goTo={setTab} kategoriList={kategoriList} />}
        {tab === "barang" && (
          <DataBarang
            filteredItems={filteredItems}
            kategoriList={kategoriList}
            jenisList={jenisList}
            search={searchBarang}
            setSearch={setSearchBarang}
            filterKategori={filterKategori}
            setFilterKategori={setFilterKategori}
            filterJenis={filterJenis}
            setFilterJenis={setFilterJenis}
            onAdd={() => { setEditingItem(null); setShowItemModal(true); }}
            onEdit={(it) => { setEditingItem(it); setShowItemModal(true); }}
            onDelete={(it) => setConfirmDelete(it)}
          />
        )}
        {tab === "terima" && <Penerimaan items={items} kategoriList={kategoriList} onSubmit={submitPenerimaan} recent={transaksi.filter((t) => t.tipe === "masuk").slice(0, 6)} />}
        {tab === "pakai" && <Pemakaian items={items} kategoriList={kategoriList} onSubmit={submitPemakaian} recent={transaksi.filter((t) => t.tipe === "keluar").slice(0, 6)} />}
        {tab === "riwayat" && (
          <Riwayat
            filteredTx={filteredTx}
            kategoriList={kategoriList}
            txFilterTipe={txFilterTipe}
            setTxFilterTipe={setTxFilterTipe}
            txSearch={txSearch}
            setTxSearch={setTxSearch}
            onEditTx={(t) => setEditingTx(t)}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-stone-900 border-t border-stone-800 z-30">
        <div className="max-w-lg mx-auto grid grid-cols-5">
          <NavBtn icon={<Warehouse size={19} />} label="Ringkasan" active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
          <NavBtn icon={<Package size={19} />} label="Barang" active={tab === "barang"} onClick={() => setTab("barang")} />
          <NavBtn icon={<ArrowDownCircle size={19} />} label="Terima" active={tab === "terima"} onClick={() => setTab("terima")} />
          <NavBtn icon={<ArrowUpCircle size={19} />} label="Pakai" active={tab === "pakai"} onClick={() => setTab("pakai")} />
          <NavBtn icon={<History size={19} />} label="Riwayat" active={tab === "riwayat"} onClick={() => setTab("riwayat")} />
        </div>
      </nav>

      {showItemModal && (
        <ItemFormModal
          editingItem={editingItem}
          kategoriList={kategoriList}
          jenisList={jenisList}
          onClose={() => { setShowItemModal(false); setEditingItem(null); }}
          onAdd={handleAddItem}
          onUpdate={handleUpdateItem}
        />
      )}

      {editingTx && (
        <TransaksiEditModal
          tx={editingTx}
          kategoriList={kategoriList}
          onClose={() => setEditingTx(null)}
          onSave={handleSaveTx}
          onDelete={handleDeleteTx}
        />
      )}

      {showPrintModal && (
        <PrintModal
          onClose={() => setShowPrintModal(false)}
          onPrint={(opts) => { setShowPrintModal(false); setPrintMode(opts); }}
        />
      )}

      {showImportModal && (
        <ImportModal kategoriList={kategoriList} jenisList={jenisList} onClose={() => setShowImportModal(false)} onConfirm={handleBulkImport} />
      )}

      {confirmDelete && (
        <Modal title="Hapus Barang" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-stone-600 mb-4">
            Yakin ingin menghapus <span className="font-semibold text-stone-900">{confirmDelete.nama}</span> ({confirmDelete.kode})? Riwayat transaksi barang ini akan tetap tersimpan di Riwayat.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-lg border border-stone-300 text-stone-700 text-sm font-semibold">Batal</button>
            <button onClick={() => handleDeleteItem(confirmDelete.id)} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold">Hapus</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${active ? "text-amber-400" : "text-stone-500"}`}>
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon, tone = "stone" }) {
  const toneMap = { stone: "bg-white text-stone-900", amber: "bg-amber-500 text-stone-900", red: "bg-red-600 text-white" };
  return (
    <div className={`rounded-xl p-3 shadow-sm border border-stone-200 ${toneMap[tone]}`}>
      <div className="flex items-center justify-between mb-1 opacity-80">{icon}</div>
      <div className="text-2xl font-extrabold leading-none" style={{ fontFamily: "monospace" }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide font-semibold mt-1 opacity-80">{label}</div>
    </div>
  );
}

function Dashboard({ items, transaksi, lowStockItems, goTo, kategoriList }) {
  const today = todayStr();
  const txHariIni = transaksi.filter((t) => t.tanggal === today).length;
  const recent = transaksi.slice(0, 6);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard label="Total Barang" value={items.length} icon={<Package size={16} />} />
        <StatCard label="Stok Menipis" value={lowStockItems.length} icon={<AlertTriangle size={16} />} tone={lowStockItems.length > 0 ? "red" : "stone"} />
        <StatCard label="Transaksi Hari Ini" value={txHariIni} icon={<History size={16} />} tone="amber" />
      </div>

      {lowStockItems.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle size={14} className="text-red-600" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-red-700">Perlu Segera Diisi Ulang</h2>
          </div>
          <div className="space-y-2">
            {lowStockItems.map((i) => (
              <div key={i.id} className="bg-white border border-red-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Plate kategoriList={kategoriList} kategoriId={i.kategori} compact />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{i.nama}</p>
                    <p className="text-[11px] text-stone-500" style={{ fontFamily: "monospace" }}>{i.kode}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <p className="text-sm font-extrabold text-red-600" style={{ fontFamily: "monospace" }}>{i.stok} {i.satuan}</p>
                  <p className="text-[10px] text-stone-400">min {i.stokMin}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500">Aktivitas Terbaru</h2>
          <button onClick={() => goTo("riwayat")} className="text-[11px] font-semibold text-amber-600 flex items-center gap-0.5">
            Lihat semua <ChevronRight size={12} />
          </button>
        </div>
        {recent.length === 0 ? <EmptyState text="Belum ada transaksi. Mulai catat penerimaan atau pemakaian barang." /> : (
          <div className="space-y-2">{recent.map((t) => <TxRow key={t.id} t={t} kategoriList={kategoriList} />)}</div>
        )}
      </div>
    </div>
  );
}

function TxRow({ t, kategoriList, onEdit }) {
  const masuk = t.tipe === "masuk";
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-3 flex items-center gap-3">
      <div className={`rounded-full p-1.5 shrink-0 ${masuk ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
        {masuk ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-stone-900 truncate">{t.itemNama}</p>
        <p className="text-[11px] text-stone-500 truncate">
          {masuk ? `dari ${t.sumber || "-"}` : `untuk ${t.unit ? kategoriLabel(kategoriList, t.unit) : t.digunakanUntuk || "-"}`} &middot; {fmtDate(t.tanggal)}
        </p>
      </div>
      <div className={`text-sm font-extrabold shrink-0 ${masuk ? "text-emerald-600" : "text-red-600"}`} style={{ fontFamily: "monospace" }}>
        {masuk ? "+" : "-"}{t.qty} {t.satuan}
      </div>
      {onEdit && (
        <button onClick={() => onEdit(t)} className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 shrink-0">
          <Pencil size={13} />
        </button>
      )}
    </div>
  );
}

function DataBarang({ filteredItems, kategoriList, jenisList, search, setSearch, filterKategori, setFilterKategori, filterJenis, setFilterJenis, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama / kode barang" className="w-full border border-stone-300 rounded-lg pl-8 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <button onClick={onAdd} className="bg-amber-500 text-stone-900 rounded-lg px-3 flex items-center gap-1 font-bold text-sm shrink-0">
          <Plus size={16} /> Baru
        </button>
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="text-xs border border-stone-300 rounded-lg px-2 py-1.5 bg-white shrink-0">
          <option value="ALL">Semua Jenis</option>
          {jenisList.map((j) => <option key={j.id} value={j.nama}>{j.nama}</option>)}
        </select>
        <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} className="text-xs border border-stone-300 rounded-lg px-2 py-1.5 bg-white shrink-0">
          <option value="ALL">Semua Kategori</option>
          {kategoriList.map((c) => <option key={c.id} value={c.kode}>{kategoriLabel(kategoriList, c.kode)}</option>)}
        </select>
      </div>

      {filteredItems.length === 0 ? <EmptyState text="Belum ada barang yang cocok. Tambahkan barang baru dengan tombol 'Baru'." /> : (
        <div className="space-y-2">
          {filteredItems.map((i) => {
            const low = i.stok <= i.stokMin;
            return (
              <div key={i.id} className="bg-white border border-stone-200 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <Plate kategoriList={kategoriList} kategoriId={i.kategori} compact />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">{i.nama}</p>
                      <p className="text-[11px] text-stone-500" style={{ fontFamily: "monospace" }}>{i.kode}</p>
                      <div className="mt-1"><JenisTag jenis={i.jenis} /></div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-base font-extrabold ${low ? "text-red-600" : "text-stone-900"}`} style={{ fontFamily: "monospace" }}>{i.stok}</p>
                    <p className="text-[10px] text-stone-400">{i.satuan} &middot; min {i.stokMin}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 pt-2 border-t border-stone-100">
                  <button onClick={() => onEdit(i)} className="flex-1 text-xs font-semibold text-stone-600 flex items-center justify-center gap-1 py-1 rounded-md hover:bg-stone-50"><Pencil size={12} /> Edit</button>
                  <button onClick={() => onDelete(i)} className="flex-1 text-xs font-semibold text-red-600 flex items-center justify-center gap-1 py-1 rounded-md hover:bg-red-50"><Trash2 size={12} /> Hapus</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ItemFormModal({ editingItem, kategoriList, jenisList, onClose, onAdd, onUpdate }) {
  const [nama, setNama] = useState(editingItem?.nama || "");
  const [kategori, setKategori] = useState(editingItem?.kategori || kategoriList[0]?.kode || "");
  const [jenis, setJenis] = useState(editingItem?.jenis || jenisList[0]?.nama || "");
  const [satuan, setSatuan] = useState(editingItem?.satuan || "Pcs");
  const [stokAwal, setStokAwal] = useState(editingItem ? editingItem.stok : 0);
  const [stokMin, setStokMin] = useState(editingItem?.stokMin ?? 1);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!nama.trim() || !kategori || !jenis || saving) return;
    setSaving(true);
    if (editingItem) await onUpdate(editingItem.id, { nama, kategori, jenis, satuan, stokMin: Number(stokMin) });
    else await onAdd({ nama, kategori, jenis, satuan, stokAwal, stokMin });
    setSaving(false);
  }

  return (
    <Modal title={editingItem ? "Edit Barang" : "Tambah Barang"} onClose={onClose}>
      <Field label="Nama Barang">
        <input value={nama} onChange={(e) => setNama(e.target.value)} className={inputCls} placeholder="cth. Filter Oli Forklift 2.5T" />
      </Field>
      <Field label="Kategori / Unit">
        <select value={kategori} onChange={(e) => setKategori(e.target.value)} className={inputCls}>
          {kategoriList.map((c) => <option key={c.id} value={c.kode}>{kategoriLabel(kategoriList, c.kode)}</option>)}
        </select>
      </Field>
      <Field label="Jenis Barang">
        <div className="flex flex-wrap gap-2">
          {jenisList.map((j) => (
            <button type="button" key={j.id} onClick={() => setJenis(j.nama)} className={`px-3 py-2 rounded-lg text-sm font-semibold border ${jenis === j.nama ? "bg-stone-900 text-amber-400 border-stone-900" : "bg-white text-stone-600 border-stone-300"}`}>
              {j.nama}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Satuan">
          <input value={satuan} onChange={(e) => setSatuan(e.target.value)} className={inputCls} placeholder="Pcs / Unit / Set" />
        </Field>
        <Field label="Stok Minimum">
          <input type="number" min="0" value={stokMin} onChange={(e) => setStokMin(e.target.value)} className={inputCls} />
        </Field>
      </div>
      {!editingItem && (
        <Field label="Stok Awal">
          <input type="number" min="0" value={stokAwal} onChange={(e) => setStokAwal(e.target.value)} className={inputCls} />
        </Field>
      )}
      <button onClick={submit} disabled={!nama.trim() || !kategori || !jenis || saving} className="w-full mt-2 bg-amber-500 disabled:bg-stone-200 disabled:text-stone-400 text-stone-900 font-bold py-2.5 rounded-lg text-sm">
        {saving ? "Menyimpan..." : editingItem ? "Simpan Perubahan" : "Tambah Barang"}
      </button>
    </Modal>
  );
}

function ItemPicker({ items, kategoriList, value, onChange }) {
  const [q, setQ] = useState("");
  const filtered = items.filter((i) => `${i.nama} ${i.kode}`.toLowerCase().includes(q.toLowerCase()));
  const selected = items.find((i) => i.id === value);
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / kode barang..." className={inputCls + " mb-2"} />
      <div className="max-h-40 overflow-y-auto border border-stone-200 rounded-lg divide-y divide-stone-100">
        {filtered.length === 0 && <p className="text-xs text-stone-400 p-3">Barang tidak ditemukan.</p>}
        {filtered.map((i) => (
          <button type="button" key={i.id} onClick={() => onChange(i.id)} className={`w-full flex items-center justify-between gap-2 p-2 text-left ${value === i.id ? "bg-amber-50" : "bg-white"}`}>
            <div className="flex items-center gap-2 min-w-0">
              <Plate kategoriList={kategoriList} kategoriId={i.kategori} compact />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-900 truncate">{i.nama}</p>
                <p className="text-[10px] text-stone-500" style={{ fontFamily: "monospace" }}>{i.kode}</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-stone-500 shrink-0" style={{ fontFamily: "monospace" }}>{i.stok} {i.satuan}</span>
          </button>
        ))}
      </div>
      {selected && (
        <p className="text-[11px] text-stone-500 mt-1.5">
          Dipilih: <span className="font-semibold text-stone-800">{selected.nama}</span> &middot; stok saat ini {selected.stok} {selected.satuan}
        </p>
      )}
    </div>
  );
}

function Penerimaan({ items, kategoriList, onSubmit, recent }) {
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");
  const [tanggal, setTanggal] = useState(todayStr());
  const [sumber, setSumber] = useState("");
  const [noRef, setNoRef] = useState("");
  const [peruntukan, setPeruntukan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setItemId(""); setQty(""); setSumber(""); setNoRef(""); setPeruntukan(""); setCatatan(""); setTanggal(todayStr());
  }

  async function submit() {
    if (!itemId || !qty || saving) return;
    setSaving(true);
    const ok = await onSubmit({ itemId, qty, tanggal, sumber, noRef, peruntukan, catatan });
    setSaving(false);
    if (ok) reset();
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-emerald-100 text-emerald-700 rounded-full p-1.5"><ArrowDownCircle size={16} /></div>
        <h2 className="font-bold text-stone-900 text-sm uppercase tracking-wide">Penerimaan Barang</h2>
      </div>

      {items.length === 0 ? <EmptyState text="Belum ada barang terdaftar. Tambahkan barang di menu Barang terlebih dahulu." /> : (
        <div className="bg-white border border-stone-200 rounded-xl p-3 mb-4">
          <Field label="Pilih Barang"><ItemPicker items={items} kategoriList={kategoriList} value={itemId} onChange={setItemId} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jumlah Masuk"><input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} /></Field>
            <Field label="Tanggal"><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="Sumber / Supplier"><input value={sumber} onChange={(e) => setSumber(e.target.value)} className={inputCls} placeholder="cth. PT Sumber Sparepart" /></Field>
          <Field label="No. Referensi (PO/Faktur) - opsional"><input value={noRef} onChange={(e) => setNoRef(e.target.value)} className={inputCls} /></Field>
          <Field label="Peruntukan (Rencana Pakai) - opsional">
            <select value={peruntukan} onChange={(e) => setPeruntukan(e.target.value)} className={inputCls}>
              <option value="">- Stok umum / belum ditentukan -</option>
              {kategoriList.map((c) => <option key={c.id} value={c.kode}>{kategoriLabel(kategoriList, c.kode)}</option>)}
            </select>
          </Field>
          <Field label="Catatan - opsional"><input value={catatan} onChange={(e) => setCatatan(e.target.value)} className={inputCls} /></Field>
          <button onClick={submit} disabled={!itemId || !qty || saving} className="w-full bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold py-2.5 rounded-lg text-sm">
            {saving ? "Menyimpan..." : "Catat Penerimaan"}
          </button>
        </div>
      )}

      <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Penerimaan Terbaru</h3>
      {recent.length === 0 ? <EmptyState text="Belum ada riwayat penerimaan." /> : <div className="space-y-2">{recent.map((t) => <TxRow key={t.id} t={t} kategoriList={kategoriList} />)}</div>}
    </div>
  );
}

function Pemakaian({ items, kategoriList, onSubmit, recent }) {
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");
  const [tanggal, setTanggal] = useState(todayStr());
  const [unit, setUnit] = useState(kategoriList[0]?.kode || "");
  const [digunakanUntuk, setDigunakanUntuk] = useState("");
  const [diambilOleh, setDiambilOleh] = useState("");
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setItemId(""); setQty(""); setDigunakanUntuk(""); setDiambilOleh(""); setCatatan(""); setTanggal(todayStr());
  }

  async function submit() {
    if (!itemId || !qty || saving) return;
    setSaving(true);
    const ok = await onSubmit({ itemId, qty, tanggal, unit, digunakanUntuk, diambilOleh, catatan });
    setSaving(false);
    if (ok) reset();
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-red-100 text-red-700 rounded-full p-1.5"><ArrowUpCircle size={16} /></div>
        <h2 className="font-bold text-stone-900 text-sm uppercase tracking-wide">Pemakaian / Pengeluaran</h2>
      </div>

      {items.length === 0 ? <EmptyState text="Belum ada barang terdaftar. Tambahkan barang di menu Barang terlebih dahulu." /> : (
        <div className="bg-white border border-stone-200 rounded-xl p-3 mb-4">
          <Field label="Pilih Barang"><ItemPicker items={items} kategoriList={kategoriList} value={itemId} onChange={setItemId} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jumlah Keluar"><input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} /></Field>
            <Field label="Tanggal"><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="Digunakan Untuk Unit">
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls}>
              {kategoriList.map((c) => <option key={c.id} value={c.kode}>{kategoriLabel(kategoriList, c.kode)}</option>)}
            </select>
          </Field>
          <Field label="Nomor Unit / Plat - opsional"><input value={digunakanUntuk} onChange={(e) => setDigunakanUntuk(e.target.value)} className={inputCls} placeholder="cth. FL-03 atau B 1234 XY" /></Field>
          <Field label="Diambil Oleh - opsional"><input value={diambilOleh} onChange={(e) => setDiambilOleh(e.target.value)} className={inputCls} placeholder="Nama teknisi/operator" /></Field>
          <Field label="Catatan - opsional"><input value={catatan} onChange={(e) => setCatatan(e.target.value)} className={inputCls} placeholder="cth. Servis rutin / ban bocor" /></Field>
          <button onClick={submit} disabled={!itemId || !qty || saving} className="w-full bg-red-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold py-2.5 rounded-lg text-sm">
            {saving ? "Menyimpan..." : "Catat Pemakaian"}
          </button>
        </div>
      )}

      <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Pemakaian Terbaru</h3>
      {recent.length === 0 ? <EmptyState text="Belum ada riwayat pemakaian." /> : <div className="space-y-2">{recent.map((t) => <TxRow key={t.id} t={t} kategoriList={kategoriList} />)}</div>}
    </div>
  );
}

function Riwayat({ filteredTx, kategoriList, txFilterTipe, setTxFilterTipe, txSearch, setTxSearch, onEditTx }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <History size={16} className="text-stone-700" />
        <h2 className="font-bold text-stone-900 text-sm uppercase tracking-wide">Riwayat Transaksi</h2>
      </div>

      <div className="relative mb-2">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input value={txSearch} onChange={(e) => setTxSearch(e.target.value)} placeholder="Cari nama / kode barang" className="w-full border border-stone-300 rounded-lg pl-8 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>

      <div className="flex gap-2 mb-3">
        {[{ id: "ALL", label: "Semua" }, { id: "masuk", label: "Penerimaan" }, { id: "keluar", label: "Pemakaian" }].map((f) => (
          <button key={f.id} onClick={() => setTxFilterTipe(f.id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${txFilterTipe === f.id ? "bg-stone-900 text-amber-400 border-stone-900" : "bg-white text-stone-600 border-stone-300"}`}>{f.label}</button>
        ))}
      </div>

      {filteredTx.length === 0 ? <EmptyState text="Tidak ada transaksi yang cocok." /> : (
        <div className="space-y-2">
          {filteredTx.map((t) => (
            <div key={t.id} className="bg-white border border-stone-200 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className={`rounded-full p-1.5 shrink-0 ${t.tipe === "masuk" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {t.tipe === "masuk" ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{t.itemNama}</p>
                    <p className="text-[10px] text-stone-500" style={{ fontFamily: "monospace" }}>{t.itemKode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className={`text-sm font-extrabold ${t.tipe === "masuk" ? "text-emerald-600" : "text-red-600"}`} style={{ fontFamily: "monospace" }}>
                    {t.tipe === "masuk" ? "+" : "-"}{t.qty} {t.satuan}
                  </div>
                  <button onClick={() => onEditTx(t)} className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400"><Pencil size={13} /></button>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span className="flex items-center gap-1"><CalendarDays size={11} /> {fmtDate(t.tanggal)}</span>
                <span>Sisa stok: <span className="font-semibold text-stone-800">{t.stokSesudah}</span></span>
              </div>
              {t.tipe === "masuk" ? (
                <p className="text-[11px] text-stone-500 mt-1">
                  Dari: {t.sumber || "-"} {t.noRef ? `(${t.noRef})` : ""}
                  {t.peruntukan ? ` · Rencana pakai: ${kategoriLabel(kategoriList, t.peruntukan)}` : ""}
                </p>
              ) : (
                <p className="text-[11px] text-stone-500 mt-1">
                  Unit: {kategoriLabel(kategoriList, t.unit)} {t.digunakanUntuk ? `- ${t.digunakanUntuk}` : ""} {t.diambilOleh ? `\u00b7 oleh ${t.diambilOleh}` : ""}
                </p>
              )}
              {t.catatan && <p className="text-[11px] text-stone-400 italic mt-0.5">"{t.catatan}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
