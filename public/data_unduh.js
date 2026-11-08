/* Pembantu murni portal data (tanpa DOM, bisa diuji di Node): konversi larik datar ke CSV dan perakit sitasi. */

/** Nilai sel: skalar apa adanya, larik skalar digabung "; ", objek bersarang dikosongkan (bukan array datar). */
const sel = (v) => {
  if (v == null) return "";
  if (Array.isArray(v)) return v.every((e) => e == null || typeof e !== "object") ? v.join("; ") : "";
  return typeof v === "object" ? "" : String(v);
};
const kutip = (s) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** rows: larik objek. Kolom = gabungan kunci skalar (urutan kemunculan). Awalan BOM agar Excel membaca UTF-8. */
export function keCsv(rows) {
  const kolom = [];
  const lihat = new Set();
  for (const r of rows) {
    if (!r || typeof r !== "object" || Array.isArray(r)) continue;
    for (const [k, v] of Object.entries(r)) if (!lihat.has(k) && (v == null || typeof v !== "object" || (Array.isArray(v) && v.every((e) => e == null || typeof e !== "object")))) { lihat.add(k); kolom.push(k); }
  }
  const baris = [kolom.map(kutip).join(",")];
  for (const r of rows) baris.push(kolom.map((k) => kutip(sel(r?.[k]))).join(","));
  return "﻿" + baris.join("\r\n") + "\r\n";
}

/** Ambil larik dari JSON menurut jalur katalog ("" = akar, "baris" = kunci). */
export const barisDari = (data, jalur) => (jalur === "" ? data : data?.[jalur]);

/** Sitasi dari entri katalog: {sumber, tahun, judul, tanggal (dibangun), url, akses}; string ditata pemanggil lewat kamus. */
export function bahanSitasi(b, { origin, akses, bahasa = "id" }) {
  const judul = b.judul?.[bahasa] ?? b.judul?.id ?? b.berkas;
  const tgl = b.dibangun || akses;
  return { sumber: b.sumber?.nama || "METI Network", tahun: String(tgl).slice(0, 4), judul, tanggal: tgl, url: `${origin}/data/${b.berkas}`, akses };
}
