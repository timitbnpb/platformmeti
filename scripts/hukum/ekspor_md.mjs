#!/usr/bin/env node
// ekspor_md.mjs (JM-U01/U06): seed D1 lokal (hasil hukum.py urai) -> hukum/<jenis>/<tahun>/<id>.md + _indeks.json + _status.json.
// Pakai: node scripts/hukum/ekspor_md.mjs [--tanggal=2026-11-11] [--batas=N] [--ke=hukum]
// Membaca saja: data/hukum/seed*.sql, data-panen/hukum/{indeks.json,teks/,pdf/} (semua di-.gitignore). Tidak ada jaringan.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tulisFrontmatter, badanDariSegmen, adaDataPribadi } from "./md.mjs";

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split("=")[1];
const TGL = arg("tanggal", "2026-11-11");
const BATAS = Number(arg("batas", 0)) || Infinity;
const KE = resolve(AKAR, arg("ke", "hukum"));
const MAKS_BYTE = 60 * 1024 * 1024, MAKS_BERKAS = 10 * 1024 * 1024;
const sha = (b) => createHash("sha256").update(b).digest("hex");
const norm = (id) => id.replace(/-{2,}/g, "-");
const rapat = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// 1. muat seed ke SQLite memori
const db = new DatabaseSync(":memory:");
const dirSeed = join(AKAR, "data/hukum");
db.exec(readFileSync(join(AKAR, "migrations/0029_hukum.sql"), "utf-8"));
db.exec(readFileSync(join(dirSeed, "seed.sql"), "utf-8"));
for (const f of readdirSync(dirSeed).filter((x) => /^seed-\d+\.sql$/.test(x)).sort()) db.exec(readFileSync(join(dirSeed, f), "utf-8"));

const panen = join(AKAR, "data-panen/hukum");
const indeks = JSON.parse(readFileSync(join(panen, "indeks.json"), "utf-8"));
const perUrl = new Map(Object.values(indeks).filter((e) => e.pdf_ok).map((e) => [e.url, e]));
const topikKat = new Map(JSON.parse(readFileSync(join(AKAR, "public/data/hukum/katalog.json"), "utf-8")).dok.map((d) => [d.id, d.topik || []]));

// 2. relasi mentah
const relasi = db.prepare("SELECT dari, ke, jenis FROM hukum_relasi ORDER BY dari, jenis, ke").all();
const keluar = new Map();   // id -> {jenis: [ke]}
for (const r of relasi) {
  const d = norm(r.dari), k = norm(r.ke);
  if (d === k) continue;
  const m = keluar.get(d) || {};
  (m[r.jenis] ||= []).push(k);
  keluar.set(d, m);
}

// 3. dokumen
const status = { dibuat: TGL, perlu_ocr: [], gagal: [], antrean_kurator: [] };
const dokumen = [];
const dokSemua = db.prepare("SELECT * FROM hukum_dok ORDER BY id").all();
const segStmt = db.prepare("SELECT jenis, label, bab, teks FROM hukum_segmen WHERE dok = ? ORDER BY urut");
for (const d of dokSemua) {
  const e = perUrl.get(d.url);
  if (!e) { status.gagal.push({ id: d.id, alasan: "tanpa entri panen pdf_ok" }); continue; }
  const t = JSON.parse(readFileSync(join(panen, "teks", `${e.slug}.json`), "utf-8"));
  if ((t.butuh_ocr || []).length) { status.perlu_ocr.push({ id: d.id, halaman_butuh_ocr: t.butuh_ocr.length }); continue; }
  const segs = segStmt.all(d.id);
  if (!segs.length) { status.gagal.push({ id: d.id, alasan: "tanpa segmen" }); continue; }
  const badan = badanDariSegmen(segs);
  if (adaDataPribadi(badan)) { status.gagal.push({ id: d.id, alasan: "pola data pribadi tersisa" }); continue; }
  const pdfPath = join(panen, "pdf", `${e.slug}.pdf`);
  const nid = norm(d.id);
  const judulSeg = segs.find((s) => s.jenis === "judul")?.teks || "";
  // beda dengan katalog panen -> antrean kurator (JM-U05), tidak dibetulkan
  if (String(e.nomor) !== String(d.nomor) || Number(e.tahun) !== Number(d.tahun))
    status.antrean_kurator.push({ id: nid, jenis: "nomor_beda", seed: `${d.nomor}/${d.tahun}`, katalog: `${e.nomor}/${e.tahun}` });
  const a = rapat(d.judul), b = rapat(e.judul);
  if (a !== b && !a.includes(b) && !b.includes(a)) status.antrean_kurator.push({ id: nid, jenis: "judul_beda", seed: d.judul, katalog: e.judul });
  const jenis = nid.split("-")[0];
  dokumen.push({ d, nid, jenis, badan, judulSeg, sha_pdf: existsSync(pdfPath) ? sha(readFileSync(pdfPath)) : null, pdf_n: t.halaman?.length ?? d.halaman });
}
dokumen.sort((x, y) => (x.nid < y.nid ? -1 : 1));
const ada = new Set(dokumen.map((x) => x.nid));

// 4. relasi dua arah (turunan)
const dicabutOleh = new Map(), diubahOleh = new Map();
const tambah = (m, k, v) => m.set(k, [...(m.get(k) || []), v]);
for (const x of dokumen) {
  const r = keluar.get(x.nid) || {};
  for (const k of r.mencabut || []) if (ada.has(k)) tambah(dicabutOleh, k, x.nid);
  for (const k of r.mengubah || []) if (ada.has(k)) tambah(diubahOleh, k, x.nid);
}
const mulaiDari = new Map(dokumen.map((x) => [x.nid, x.d.tgl_undang || x.d.tgl_tetap || null]));

// 5. tulis
const sorted = (a) => [...new Set(a || [])].sort();
const berkas = [];
let total = 0;
for (const x of dokumen.slice(0, BATAS)) {
  const { d } = x;
  const r = keluar.get(x.nid) || {};
  const co = sorted(dicabutOleh.get(x.nid)), uo = sorted(diubahOleh.get(x.nid));
  if (co.length && d.status !== "dicabut") status.antrean_kurator.push({ id: x.nid, jenis: "status_vs_relasi", status: d.status || null, dicabut_oleh: co });
  const mulai = d.tgl_undang || d.tgl_tetap || null;
  const sel = co.map((k) => mulaiDari.get(k)).filter(Boolean).sort()[0] || null;
  const fm = {
    id: x.nid, id_lama: x.nid === d.id ? null : d.id, regulasi_id: d.regulasi_id || null,
    jenis: d.jenis, nomor: String(d.nomor), tahun: d.tahun, judul: d.judul,
    tgl_tetap: d.tgl_tetap || null, tgl_undang: d.tgl_undang || null,
    status: d.status || "tidak_diketahui", status_per: TGL, mulai, mulai_perkiraan: !!mulai && !d.tgl_undang, selesai: sel,
    mencabut: sorted(r.mencabut), mengubah: sorted(r.mengubah), mengganti: sorted(r.mengganti),
    mengingat: sorted(r.mengingat), merujuk: sorted(r.merujuk),
    dicabut_oleh: co.length ? co : null, diubah_oleh: uo,
    topik: topikKat.get(d.id) || (d.subjek ? [d.subjek] : []),
    sumber: { situs: d.sumber, url: d.url, pdf_sha256: x.sha_pdf, diambil: TGL },
    ekstraksi: { metode: "pdftotext", halaman: d.halaman, halaman_ocr: 0, mutu: d.mutu, perlu_tinjau: false },
    resmi: false,
    lisensi: { dasar: "UU 28/2014 Pasal 42", diperiksa_naskah: true },
    md_sha256: sha(x.badan),
  };
  const isi = tulisFrontmatter(fm) + x.badan;
  if (Buffer.byteLength(isi) > MAKS_BERKAS) { status.gagal.push({ id: x.nid, alasan: "berkas > 10 MB" }); continue; }
  total += Buffer.byteLength(isi);
  if (total > MAKS_BYTE) throw new Error(`hukum/ > 60 MB: berhenti; jalankan dengan --batas=50`);
  berkas.push({ jalur: `${x.jenis}/${d.tahun}/${x.nid}.md`, isi, fm });
}

for (const n of existsSync(KE) ? readdirSync(KE) : []) if (n !== "README.md") rmSync(join(KE, n), { recursive: true, force: true });
for (const b of berkas) { const p = join(KE, b.jalur); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, b.isi, "utf-8"); }
const idx = berkas.map(({ fm }) => ({
  id: fm.id, jenis: fm.id.split("-")[0], tahun: fm.tahun, status: fm.status,
  relasi: Object.fromEntries(["mencabut", "mengubah", "mengganti", "mengingat", "merujuk"].map((k) => [k, fm[k].map((i) => ({ id: i, terdaftar: ada.has(i) }))])),
}));
writeFileSync(join(KE, "_indeks.json"), JSON.stringify({ dibuat: TGL, jumlah: idx.length, dok: idx }, null, 1) + "\n");
for (const k of ["perlu_ocr", "gagal", "antrean_kurator"]) status[k].sort((a, b) => (a.id < b.id ? -1 : 1));
writeFileSync(join(KE, "_status.json"), JSON.stringify({ ...status, jumlah_berkas: berkas.length, bytes: total }, null, 1) + "\n");
console.log(JSON.stringify({ berkas: berkas.length, MB: +(total / 1048576).toFixed(1), perlu_ocr: status.perlu_ocr.length, gagal: status.gagal.length, antrean: status.antrean_kurator.length }));
