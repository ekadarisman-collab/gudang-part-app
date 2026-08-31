"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Warehouse, Package, ArrowDownCircle, ArrowUpCircle, History, Plus, Search,
  AlertTriangle, X, Trash2, Pencil, CheckCircle2, XCircle, Car, BatteryCharging,
  Fuel, Disc3, Wrench, CalendarDays, ChevronRight, Download, Upload, Printer,
  ArrowLeft,
} from "lucide-react";
import * as XLSX from "xlsx";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const CATEGORIES = [
  { id: "FL25B", label: "Forklift 2.5T", sub: "Battery", plate: "2.5T", icon: "battery" },
  { id: "FL25D", label: "Forklift 2.5T", sub: "Diesel", plate: "2.5T", icon: "diesel" },
  { id: "FL3B", label: "Forklift 3T", sub: "Battery", plate: "3T", icon: "battery" },
  { id: "FL3D", label: "Forklift 3T", sub: "Diesel", plate: "3T", icon: "diesel" },
  { id: "FL5B", label: "Forklift 5T", sub: "Battery", plate: "5T", icon: "battery" },
  { id: "FL5D", label: "Forklift 5T", sub: "Diesel", plate: "5T", icon: "diesel" },
  { id: "AVZ", label: "Avanza", sub: "Mobil", plate: "AVZ", icon: "car" },
  { id: "HIC", label: "Hiace", sub: "Mobil", plate: "HIC", icon: "car" },
  { id: "GDM", label: "Grandmax PU", sub: "Mobil", plate: "GDM", icon: "car" },
  { id: "UMU", label: "Umum", sub: "Semua Unit", plate: "ALL", icon: "wrench" },
];

const JENIS_LIST = ["Sparepart", "Ban"];

function catById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}
function catById_label(id) {
  const c = catById(id);
  return `${c.label} (${c.sub})`;
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function fmtDate(s) {
  if (!s) return "-";
  return new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function mapItemRow(d) {
  return { id: d.id, kode: d.kode, nama: d.nama, kategori: d.kategori, jenis: d.jenis, satuan: d.satuan, stok: d.stok, stokMin: d.stok_min };
}
function mapTxRow(d) {
  return {
    id: d.id, tipe: d.tipe, itemId: d.item_id, itemNama: d.item_nama, itemKode: d.item_kode,
    kategori: d.kategori, jenis: d.jenis, qty: d.qty, satuan: d.satuan, tanggal: d.tanggal,
    sumber: d.sumber, noRef: d.no_ref, unit: d.unit, digunakanUntuk: d.digunakan_untuk,
    diambilOleh: d.diambil_oleh, catatan: d.catatan, stokSesudah: d.stok_sesudah, createdAt: d.created_at,
  };
}

// ===================== EXPORT / IMPORT / TEMPLATE =====================

function exportToExcel(items, transaksi) {
  const wb = XLSX.utils.book_new();

  const itemsSheet = XLSX.utils.json_to_sheet(
    items.map((i) => ({
      Kode: i.kode,
      Nama: i.nama,
      "Kategori": `${catById(i.kategori).label} - ${catById(i.kategori).sub}`,
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
      "Sumber/Unit": t.tipe === "masuk" ? t.sumber || "" : catById_label(t.unit || ""),
      "No Ref / No Unit": t.tipe === "masuk" ? t.noRef || "" : t.digunakanUntuk || "",
      "Diambil Oleh": t.diambilOleh || "",
      Catatan: t.catatan || "",
    }))
  );
  XLSX.utils.book_append_sheet(wb, txSheet, "Riwayat Transaksi");

  XLSX.writeFile(wb, `gudang-part-export-${todayStr()}.xlsx`);
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const contoh = [
    { Nama: "Filter Oli Forklift 2.5T", Kategori: "FL25B", Jenis: "Sparepart", Satuan: "Pcs", "Stok Awal": 10, "Stok Minimum": 2 },
    { Nama: "Ban Depan Forklift 3T Diesel", Kategori: "FL3D", Jenis: "Ban", Satuan: "Pcs", "Stok Awal": 4, "Stok Minimum": 1 },
    { Nama: "Aki Avanza", Kategori: "AVZ", Jenis: "Sparepart", Satuan: "Unit", "Stok Awal": 2, "Stok Minimum": 1 },
  ];
  const ws = XLSX.utils.json_to_sheet(contoh);
  XLSX.utils.book_append_sheet(wb, ws, "Template Import");

  const daftarKategori = CATEGORIES.map((c) => ({ "Kode Kategori": c.id, "Nama Kategori": `${c.label} - ${c.sub}` }));
  const ws2 = XLSX.utils.json_to_sheet(daftarKategori);
  XLSX.utils.book_append_sheet(wb, ws2, "Daftar Kode Kategori");

  XLSX.writeFile(wb, "template-import-barang.xlsx");
}

function resolveKategori(value) {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  let cat = CATEGORIES.find((c) => c.id.toLowerCase() === v);
  if (cat) return cat.id;
  cat = CATEGORIES.find((c) => `${c.label} - ${c.sub}`.toLowerCase() === v);
  if (cat) return cat.id;
  cat = CATEGORIES.find((c) => c.label.toLowerCase() === v);
  return cat ? cat.id : null;
}

function resolveJenis(value) {
  const v = String(value || "").trim().toLowerCase();
  return JENIS_LIST.find((j) => j.toLowerCase() === v) || null;
}

function parseImportRows(rawRows) {
  const valid = [];
  const invalid = [];
  rawRows.forEach((r, idx) => {
    const nama = r["Nama"] ?? r["nama"] ?? r["Nama Barang"];
    const kategoriRaw = r["Kategori"] ?? r["kategori"] ?? r["Kode Kategori"];
    const jenisRaw = r["Jenis"] ?? r["jenis"];
    const satuan = r["Satuan"] ?? r["satuan"] ?? "Pcs";
    const stokAwal = r["Stok Awal"] ?? r["Stok"] ?? r["stok"] ?? 0;
    const stokMin = r["Stok Minimum"] ?? r["Stok Min"] ?? r["stokMin"] ?? 1;

    const kategori = resolveKategori(kategoriRaw);
    const jenis = resolveJenis(jenisRaw);

    if (!nama || !String(nama).trim()) {
      invalid.push({ row: idx + 2, reason: "Nama barang kosong" });
    } else if (!kategori) {
      invalid.push({ row: idx + 2, reason: `Kategori "${kategoriRaw || "-"}" tidak dikenali` });
    } else if (!jenis) {
      invalid.push({ row: idx + 2, reason: `Jenis harus "Sparepart" atau "Ban" (isi: "${jenisRaw || "-"}")` });
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

function CatIcon({ icon, size = 14, className = "" }) {
  const props = { size, className };
  if (icon === "battery") return <BatteryCharging {...props} />;
  if (icon === "diesel") return <Fuel {...props} />;
  if (icon === "car") return <Car {...props} />;
  return <Wrench {...props} />;
}

function Plate({ kategoriId, compact }) {
  const c = catById(kategoriId);
  return (
    <div
      className={`inline-flex items-center gap-1.5 border-2 border-amber-500 bg-stone-900 text-amber-400 rounded-sm ${compact ? "px-1.5 py-0.5" : "px-2 py-1"}`}
      style={{ fontFamily: "monospace" }}
      title={`${c.label} - ${c.sub}`}
    >
      <CatIcon icon={c.icon} size={compact ? 11 : 13} className="text-amber-400 shrink-0" />
      <span className={`font-bold tracking-wider leading-none ${compact ? "text-[10px]" : "text-xs"}`}>{c.plate}</span>
    </div>
  );
}

function JenisTag({ jenis }) {
  const isB = jenis === "Ban";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${isB ? "bg-stone-800 text-stone-200 border-stone-700" : "bg-stone-100 text-stone-600 border-stone-300"}`}>
      {isB ? <Disc3 size={10} /> : <Wrench size={10} />}
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
          (lokal) atau di Environment Variables project Vercel (produksi), lalu jalankan <code className="bg-stone-100 px-1 rounded">supabase-schema.sql</code> di Supabase SQL Editor.
        </p>
        <p className="text-xs text-stone-400">Lihat README.md untuk panduan lengkap.</p>
      </div>
    </div>
  );
}

function PrintView({ type, items, transaksi, dateFrom, dateTo, onClose }) {
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
      <p className="text-xs text-stone-500 mb-1">Forklift & Kendaraan Operasional</p>
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
                <td className="py-1 pr-2">{catById_label(i.kategori)}</td>
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
                <td className="py-1 pr-2">{t.tipe === "masuk" ? t.sumber || "-" : catById_label(t.unit || "")}</td>
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

function ImportModal({ onClose, onConfirm }) {
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
        setParsed(parseImportRows(rows));
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
      <button type="button" onClick={downloadTemplate} className="w-full mb-3 border border-stone-300 text-stone-700 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5">
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

export default function Page() {
  const [tab, setTab] = useState("dashboard");
  const [items, setItems] = useState([]);
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [searchBarang, setSearchBarang] = useState("");
  const [filterKategori, setFilterKategori] = useState("ALL");
  const [filterJenis, setFilterJenis] = useState("ALL");

  const [txFilterTipe, setTxFilterTipe] = useState("ALL");
  const [txSearch, setTxSearch] = useState("");

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printMode, setPrintMode] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured) init();
    else setLoading(false);
    // eslint-disable-next-line
  }, []);

  async function init() {
    setLoading(true);
    await Promise.all([loadItems(), loadTransaksi()]);
    setLoading(false);
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

  function generateKode(kategoriId, jenis) {
    const prefix = jenis === "Ban" ? "BAN" : "SP";
    const count = items.filter((i) => i.kategori === kategoriId && i.jenis === jenis).length + 1;
    return `${prefix}-${kategoriId}-${String(count).padStart(3, "0")}`;
  }

  async function handleAddItem(data) {
    const kode = generateKode(data.kategori, data.jenis);
    const { data: row, error } = await supabase
      .from("items")
      .insert({
        kode,
        nama: data.nama,
        kategori: data.kategori,
        jenis: data.jenis,
        satuan: data.satuan || "Pcs",
        stok: Number(data.stokAwal) || 0,
        stok_min: Number(data.stokMin) || 1,
      })
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
        tanggal: data.tanggal, sumber: data.sumber, no_ref: data.noRef, catatan: data.catatan,
        stok_sesudah: newStok,
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

  async function handleBulkImport(rows) {
    const counters = {};
    items.forEach((i) => {
      const key = `${i.kategori}|${i.jenis}`;
      counters[key] = (counters[key] || 0) + 1;
    });
    const payload = rows.map((r) => {
      const key = `${r.kategori}|${r.jenis}`;
      counters[key] = (counters[key] || 0) + 1;
      const prefix = r.jenis === "Ban" ? "BAN" : "SP";
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

  if (printMode) {
    return (
      <PrintView
        type={printMode.type}
        items={items}
        transaksi={transaksi}
        dateFrom={printMode.dateFrom}
        dateTo={printMode.dateTo}
        onClose={() => setPrintMode(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="flex flex-col items-center gap-3 text-stone-500">
          <Warehouse size={36} className="animate-pulse text-amber-500" />
          <span className="text-sm font-medium">Memuat data gudang...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <Toast toast={toast} />

      <header className="bg-stone-900 text-white px-4 pt-4 pb-3 sticky top-0 z-30 shadow-md">
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
            <button onClick={() => exportToExcel(items, transaksi)} title="Export ke Excel" className="p-2 rounded-lg hover:bg-stone-800 text-stone-300">
              <Download size={17} />
            </button>
            <button onClick={() => setShowPrintModal(true)} title="Cetak Laporan" className="p-2 rounded-lg hover:bg-stone-800 text-stone-300">
              <Printer size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4 max-w-lg w-full mx-auto">
        {tab === "dashboard" && <Dashboard items={items} transaksi={transaksi} lowStockItems={lowStockItems} goTo={setTab} />}
        {tab === "barang" && (
          <DataBarang
            filteredItems={filteredItems}
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
        {tab === "terima" && <Penerimaan items={items} onSubmit={submitPenerimaan} recent={transaksi.filter((t) => t.tipe === "masuk").slice(0, 6)} />}
        {tab === "pakai" && <Pemakaian items={items} onSubmit={submitPemakaian} recent={transaksi.filter((t) => t.tipe === "keluar").slice(0, 6)} />}
        {tab === "riwayat" && (
          <Riwayat filteredTx={filteredTx} txFilterTipe={txFilterTipe} setTxFilterTipe={setTxFilterTipe} txSearch={txSearch} setTxSearch={setTxSearch} />
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
          onClose={() => { setShowItemModal(false); setEditingItem(null); }}
          onAdd={handleAddItem}
          onUpdate={handleUpdateItem}
        />
      )}

      {showPrintModal && (
        <PrintModal
          onClose={() => setShowPrintModal(false)}
          onPrint={(opts) => {
            setShowPrintModal(false);
            setPrintMode(opts);
          }}
        />
      )}

      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} onConfirm={handleBulkImport} />}

      {confirmDelete && (
        <Modal title="Hapus Barang" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-stone-600 mb-4">
            Yakin ingin menghapus <span className="font-semibold text-stone-900">{confirmDelete.nama}</span> ({confirmDelete.kode})?
            Riwayat transaksi barang ini akan tetap tersimpan di Riwayat.
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

function Dashboard({ items, transaksi, lowStockItems, goTo }) {
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
                  <Plate kategoriId={i.kategori} compact />
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
          <div className="space-y-2">{recent.map((t) => <TxRow key={t.id} t={t} />)}</div>
        )}
      </div>
    </div>
  );
}

function TxRow({ t }) {
  const masuk = t.tipe === "masuk";
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-3 flex items-center gap-3">
      <div className={`rounded-full p-1.5 shrink-0 ${masuk ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
        {masuk ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-stone-900 truncate">{t.itemNama}</p>
        <p className="text-[11px] text-stone-500 truncate">
          {masuk ? `dari ${t.sumber || "-"}` : `untuk ${t.unit ? catById_label(t.unit) : t.digunakanUntuk || "-"}`} &middot; {fmtDate(t.tanggal)}
        </p>
      </div>
      <div className={`text-sm font-extrabold shrink-0 ${masuk ? "text-emerald-600" : "text-red-600"}`} style={{ fontFamily: "monospace" }}>
        {masuk ? "+" : "-"}{t.qty} {t.satuan}
      </div>
    </div>
  );
}

function DataBarang({ filteredItems, search, setSearch, filterKategori, setFilterKategori, filterJenis, setFilterJenis, onAdd, onEdit, onDelete }) {
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
          {JENIS_LIST.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
        <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} className="text-xs border border-stone-300 rounded-lg px-2 py-1.5 bg-white shrink-0">
          <option value="ALL">Semua Kategori</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label} - {c.sub}</option>)}
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
                    <Plate kategoriId={i.kategori} compact />
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

function ItemFormModal({ editingItem, onClose, onAdd, onUpdate }) {
  const [nama, setNama] = useState(editingItem?.nama || "");
  const [kategori, setKategori] = useState(editingItem?.kategori || CATEGORIES[0].id);
  const [jenis, setJenis] = useState(editingItem?.jenis || JENIS_LIST[0]);
  const [satuan, setSatuan] = useState(editingItem?.satuan || "Pcs");
  const [stokAwal, setStokAwal] = useState(editingItem ? editingItem.stok : 0);
  const [stokMin, setStokMin] = useState(editingItem?.stokMin ?? 1);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!nama.trim() || saving) return;
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
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label} - {c.sub}</option>)}
        </select>
      </Field>
      <Field label="Jenis Barang">
        <div className="grid grid-cols-2 gap-2">
          {JENIS_LIST.map((j) => (
            <button type="button" key={j} onClick={() => setJenis(j)} className={`py-2 rounded-lg text-sm font-semibold border ${jenis === j ? "bg-stone-900 text-amber-400 border-stone-900" : "bg-white text-stone-600 border-stone-300"}`}>{j}</button>
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
      <button onClick={submit} disabled={!nama.trim() || saving} className="w-full mt-2 bg-amber-500 disabled:bg-stone-200 disabled:text-stone-400 text-stone-900 font-bold py-2.5 rounded-lg text-sm">
        {saving ? "Menyimpan..." : editingItem ? "Simpan Perubahan" : "Tambah Barang"}
      </button>
    </Modal>
  );
}

function ItemPicker({ items, value, onChange }) {
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
              <Plate kategoriId={i.kategori} compact />
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

function Penerimaan({ items, onSubmit, recent }) {
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");
  const [tanggal, setTanggal] = useState(todayStr());
  const [sumber, setSumber] = useState("");
  const [noRef, setNoRef] = useState("");
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setItemId(""); setQty(""); setSumber(""); setNoRef(""); setCatatan(""); setTanggal(todayStr());
  }

  async function submit() {
    if (!itemId || !qty || saving) return;
    setSaving(true);
    const ok = await onSubmit({ itemId, qty, tanggal, sumber, noRef, catatan });
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
          <Field label="Pilih Barang"><ItemPicker items={items} value={itemId} onChange={setItemId} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jumlah Masuk"><input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} /></Field>
            <Field label="Tanggal"><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="Sumber / Supplier"><input value={sumber} onChange={(e) => setSumber(e.target.value)} className={inputCls} placeholder="cth. PT Sumber Sparepart" /></Field>
          <Field label="No. Referensi (PO/Faktur) - opsional"><input value={noRef} onChange={(e) => setNoRef(e.target.value)} className={inputCls} /></Field>
          <Field label="Catatan - opsional"><input value={catatan} onChange={(e) => setCatatan(e.target.value)} className={inputCls} /></Field>
          <button onClick={submit} disabled={!itemId || !qty || saving} className="w-full bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold py-2.5 rounded-lg text-sm">
            {saving ? "Menyimpan..." : "Catat Penerimaan"}
          </button>
        </div>
      )}

      <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Penerimaan Terbaru</h3>
      {recent.length === 0 ? <EmptyState text="Belum ada riwayat penerimaan." /> : <div className="space-y-2">{recent.map((t) => <TxRow key={t.id} t={t} />)}</div>}
    </div>
  );
}

function Pemakaian({ items, onSubmit, recent }) {
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");
  const [tanggal, setTanggal] = useState(todayStr());
  const [unit, setUnit] = useState(CATEGORIES[0].id);
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
          <Field label="Pilih Barang"><ItemPicker items={items} value={itemId} onChange={setItemId} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jumlah Keluar"><input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} /></Field>
            <Field label="Tanggal"><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="Digunakan Untuk Unit">
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label} - {c.sub}</option>)}
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
      {recent.length === 0 ? <EmptyState text="Belum ada riwayat pemakaian." /> : <div className="space-y-2">{recent.map((t) => <TxRow key={t.id} t={t} />)}</div>}
    </div>
  );
}

function Riwayat({ filteredTx, txFilterTipe, setTxFilterTipe, txSearch, setTxSearch }) {
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
                <div className={`text-sm font-extrabold shrink-0 ${t.tipe === "masuk" ? "text-emerald-600" : "text-red-600"}`} style={{ fontFamily: "monospace" }}>
                  {t.tipe === "masuk" ? "+" : "-"}{t.qty} {t.satuan}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span className="flex items-center gap-1"><CalendarDays size={11} /> {fmtDate(t.tanggal)}</span>
                <span>Sisa stok: <span className="font-semibold text-stone-800">{t.stokSesudah}</span></span>
              </div>
              {t.tipe === "masuk" ? (
                <p className="text-[11px] text-stone-500 mt-1">Dari: {t.sumber || "-"} {t.noRef ? `(${t.noRef})` : ""}</p>
              ) : (
                <p className="text-[11px] text-stone-500 mt-1">Unit: {catById_label(t.unit)} {t.digunakanUntuk ? `- ${t.digunakanUntuk}` : ""} {t.diambilOleh ? `\u00b7 oleh ${t.diambilOleh}` : ""}</p>
              )}
              {t.catatan && <p className="text-[11px] text-stone-400 italic mt-0.5">"{t.catatan}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
