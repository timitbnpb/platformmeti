// Pabrik ekstraksi dokumen resmi: PDF -> tabel berversi bersitasi halaman (FITUR-200 butir 2).
// Pakai: node scripts/pipa/ekstrak_pdf.mjs [--unduh] [--ocr] [--hanya=id,id] [--tanggal=YYYY-MM-DD]
//   PDF ada di data-panen/pdf/ (tidak di-commit); teks per halaman di data-panen/pdf/teks/<berkas>.txt (halaman dipisah \f).
//   --unduh : ambil PDF yang belum ada, hanya dari adapter.unduh_url (URL resmi), lewat _panen_sopan (robots, UA, jeda 2 dtk).
//             Diblokir/robots/403 = dicatat di galat, PDF diminta diunduh manual oleh pemilik.
//   --ocr   : jalankan ulang OCR Vision (scripts/pipa/ocr_pdf.swift) untuk adapter pindaian; tanpa bendera, pakai teks tersimpan.
// Adapter per dokumen: scripts/pipa/pdf/*.mjs (export default {id, judul, penerbit, tanggal_dokumen, versi, sumber_url, berkas, ocr?, unduh_url?, ekstrak(halaman)}).
// Keluaran: public/data/dokumen/<id>.json dan public/data/dokumen_data.json (indeks). Tiap baris WAJIB punya halaman (1-based, urutan PDF).
// Rumus tidak ada di sini: hanya pengurai teks. Angka tak terbaca = null + perlu_tinjau, bukan ditebak.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { AKAR } from './_panen_umum.mjs';

export const DIR_PDF = path.join(AKAR, 'data-panen/pdf');
export const DIR_TEKS = path.join(DIR_PDF, 'teks');
const arg = (k) => (process.argv.find((a) => a.startsWith('--' + k + '=')) || '').slice(k.length + 3);
export const TANGGAL = arg('tanggal') || '2026-11-08'; // dari masukan, bukan jam (R12 §8.6)

/* ---------- pengurai angka ---------- */
/** "1.349,72" -> 1349.72 ; "6.500" -> 6500 ; "-" / "n.a" -> null ; lain -> NaN. Format Indonesia. */
export function angkaId(s) {
  s = String(s).trim().replace(/\*+$/, '');
  if (s === '-' || /^n\.?a\.?$/i.test(s)) return null;
  if (!/^-?\d{1,3}(\.\d{3})*(,\d+)?$|^-?\d+(,\d+)?$/.test(s)) return NaN;
  return Number(s.replace(/\./g, '').replace(',', '.'));
}
/** "5,068.59" -> 5068.59 ; "-" / "n.a" -> null ; lain -> NaN. Format Inggris (HEESI). */
export function angkaEn(s) {
  s = String(s).trim().replace(/\*+$/, '');
  if (s === '-' || /^n\.?a\.?$/i.test(s)) return null;
  if (!/^-?\d{1,3}(,\d{3})*(\.\d+)?$|^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s.replace(/,/g, ''));
}
export const pecahSel = (baris) => String(baris).trim().split(/\s{2,}/);
export const token = (baris) => String(baris).trim().split(/\s+/).filter(Boolean);

/* ---------- teks per halaman ---------- */
export const halamanDariTeks = (txt) => { const h = String(txt).split('\f'); if (h.length > 1 && !h[h.length - 1].trim()) h.pop(); return h; };

/** Teks per halaman. Tersimpan di DIR_TEKS; dibuat dengan pdftotext -layout (atau OCR Vision bila ocr). */
export function teksPdf(berkas, { ocr = false, ulang = false } = {}) {
  const pdf = path.join(DIR_PDF, berkas), txt = path.join(DIR_TEKS, berkas.replace(/\.pdf$/i, '.txt'));
  if (!fs.existsSync(pdf)) return null;
  if (ulang || !fs.existsSync(txt)) {
    fs.mkdirSync(DIR_TEKS, { recursive: true });
    const keluar = ocr
      ? execFileSync('swift', [path.join(AKAR, 'scripts/pipa/ocr_pdf.swift'), pdf], { encoding: 'utf-8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] })
      : execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf-8', maxBuffer: 1 << 29, stdio: ['ignore', 'pipe', 'ignore'] });
    fs.writeFileSync(txt, keluar, 'utf-8');
  }
  return halamanDariTeks(fs.readFileSync(txt, 'utf-8'));
}

/** Cari tabel yang membentang beberapa halaman: baris dari penanda awal sampai penanda akhir -> [{baris, halaman}]. Segmen < 5 baris (daftar isi) dilewati. */
export function barisAntara(halaman, awal, akhir) {
  const keluar = []; let aktif = false;
  for (let i = 0; i < halaman.length; i++) {
    for (const g of halaman[i].split('\n')) {
      if (!aktif && awal.test(g)) { aktif = true; continue; }
      if (aktif && akhir.test(g)) { if (keluar.length >= 5) return keluar; aktif = false; keluar.length = 0; continue; } // daftar isi: penanda akhir langsung menyusul, lewati
      if (aktif) keluar.push({ baris: g, halaman: i + 1 });
    }
  }
  return keluar;
}

/* ---------- bentuk dokumen ---------- */
export const tautHalaman = (url, h) => `${String(url).split('#')[0]}#page=${h}`;

/** Susun dokumen dari spek adapter + tabel. Tabel: {id, judul, satuan?, catatan?, kolom:[{k,label,tipe}], baris:[{..., halaman}]} */
export function susunDokumen(spek, tabel, { halamanTotal, metode }) {
  return {
    id: spek.id, judul: spek.judul, penerbit: spek.penerbit, tanggal_dokumen: spek.tanggal_dokumen, versi: spek.versi,
    sumber_url: spek.sumber_url, lisensi: spek.lisensi || 'publikasi pemerintah; hanya angka, atribusi penerbit', tingkat_bukti: 'resmi',
    halaman_total: halamanTotal, metode, diekstrak: TANGGAL, catatan: spek.catatan || '',
    tabel: tabel.map((t) => ({ ...t, jumlah_baris: t.baris.length, halaman: [...new Set(t.baris.map((b) => b.halaman))].sort((a, b) => a - b) })),
  };
}

/** Daftar galat bentuk; kosong = layak diunggah. Baris tanpa halaman, tanpa sumber, atau tabel kosong ditolak (KP D5). */
export function validasiDokumen(d) {
  const g = [];
  for (const k of ['id', 'judul', 'penerbit', 'tanggal_dokumen', 'versi']) if (!d[k]) g.push(`${d.id || '?'}: ${k} kosong`);
  if (!/^https:\/\//.test(d.sumber_url || '')) g.push(`${d.id}: sumber_url bukan https`);
  if (!d.tabel?.length) g.push(`${d.id}: tanpa tabel`);
  for (const t of d.tabel || []) {
    if (!t.baris.length) g.push(`${d.id}/${t.id}: tabel kosong`);
    const kunci = new Set(t.kolom.map((c) => c.k));
    t.baris.forEach((b, i) => {
      if (!Number.isInteger(b.halaman) || b.halaman < 1 || b.halaman > d.halaman_total) g.push(`${d.id}/${t.id}[${i}]: halaman ${b.halaman} tidak valid`);
      if (b.sumber_url && !/^https:\/\//.test(b.sumber_url)) g.push(`${d.id}/${t.id}[${i}]: sumber_url baris bukan https`);
      for (const c of t.kolom) if (c.tipe === 'angka' && b[c.k] != null && !Number.isFinite(b[c.k])) g.push(`${d.id}/${t.id}[${i}].${c.k}: bukan angka`);
      for (const k of Object.keys(b)) if (!kunci.has(k) && !['halaman', 'perlu_tinjau', 'sumber_url', 'kutipan', 'catatan'].includes(k)) g.push(`${d.id}/${t.id}[${i}]: kunci ${k} di luar kolom`);
    });
  }
  return g;
}

export const ringkasIndeks = (dokumen) => ({
  lapis: 'publik', dibangun_pada: TANGGAL,
  jumlah_dokumen: dokumen.length, jumlah_tabel: dokumen.reduce((n, d) => n + d.tabel.length, 0), jumlah_baris: dokumen.reduce((n, d) => n + d.tabel.reduce((m, t) => m + t.jumlah_baris, 0), 0),
  dokumen: dokumen.map((d) => ({
    id: d.id, judul: d.judul, penerbit: d.penerbit, tanggal_dokumen: d.tanggal_dokumen, versi: d.versi, sumber_url: d.sumber_url, metode: d.metode, halaman_total: d.halaman_total, catatan: d.catatan,
    tabel: d.tabel.map((t) => ({ id: t.id, judul: t.judul, jumlah_baris: t.jumlah_baris, halaman: t.halaman, perlu_tinjau: t.baris.filter((b) => b.perlu_tinjau).length })),
  })),
});

const tulisJson = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o) + '\n', 'utf-8'); };

export async function muatAdapter(hanya) {
  const dir = path.join(AKAR, 'scripts/pipa/pdf');
  const daftar = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.mjs')).sort()) {
    const a = (await import(path.join(dir, f))).default;
    if (!hanya.length || hanya.includes(a.id)) daftar.push(a);
  }
  return daftar;
}

async function utama() {
  const hanya = arg('hanya').split(',').filter(Boolean), unduh = process.argv.includes('--unduh'), ocr = process.argv.includes('--ocr');
  const hasil = [], galat = [], manual = [];
  for (const a of await muatAdapter(hanya)) {
    const berkas = [].concat(a.berkas);
    if (unduh && a.unduh_url) {
      const { ambil } = await import('./_panen_sopan.mjs');
      for (const [i, b] of berkas.entries()) {
        const url = [].concat(a.unduh_url)[i]; if (!url || fs.existsSync(path.join(DIR_PDF, b))) continue;
        try { fs.mkdirSync(DIR_PDF, { recursive: true }); fs.writeFileSync(path.join(DIR_PDF, b), await ambil(url, { buf: true })); } catch (e) { galat.push(`${a.id}: unduh ${url}: ${e.message}`); }
      }
    }
    if (!berkas.every((b) => fs.existsSync(path.join(DIR_PDF, b)))) { manual.push({ id: a.id, url: [].concat(a.unduh_url || a.sumber_url).slice(0, 2).join(' ') + (berkas.length > 1 ? ` (+${berkas.length - 1} berkas)` : ''), simpan_di: berkas.map((b) => 'data-panen/pdf/' + b) }); continue; }
    const halaman = a.berkas instanceof Array ? berkas.map((b) => teksPdf(b, { ocr: !!a.ocr, ulang: ocr && !!a.ocr })) : teksPdf(a.berkas, { ocr: !!a.ocr, ulang: ocr && !!a.ocr });
    const tabel = a.ekstrak(halaman);
    const total = a.berkas instanceof Array ? Math.max(...halaman.map((h) => h.length)) : halaman.length;
    const d = susunDokumen(a, tabel, { halamanTotal: total, metode: a.ocr ? 'ocr-vision' : 'pdftotext-layout' });
    const g = validasiDokumen(d);
    if (g.length) { galat.push(...g.slice(0, 20)); continue; }
    hasil.push(d);
    tulisJson(path.join(AKAR, 'public/data/dokumen', a.id + '.json'), d);
  }
  if (hasil.length && !hanya.length) tulisJson(path.join(AKAR, 'public/data/dokumen_data.json'), ringkasIndeks(hasil));
  else if (hasil.length) { // gabung ke indeks lama
    const f = path.join(AKAR, 'public/data/dokumen_data.json'), lama = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf-8')).dokumen : [];
    const peta = new Map(lama.map((d) => [d.id, d])); for (const d of ringkasIndeks(hasil).dokumen) peta.set(d.id, d);
    const semua = [...peta.values()];
    tulisJson(f, { lapis: 'publik', dibangun_pada: TANGGAL, jumlah_dokumen: semua.length, jumlah_tabel: semua.reduce((n, d) => n + d.tabel.length, 0), jumlah_baris: semua.reduce((n, d) => n + d.tabel.reduce((m, t) => m + t.jumlah_baris, 0), 0), dokumen: semua });
  }
  for (const d of hasil) console.log(`${d.id}: ${d.tabel.length} tabel, ${d.tabel.reduce((n, t) => n + t.jumlah_baris, 0)} baris, ${[...new Set(d.tabel.flatMap((t) => t.halaman))].length} halaman`);
  for (const m of manual) console.log(`PERLU UNDUH MANUAL ${m.id}: ${m.url} -> ${m.simpan_di.join(', ')}`);
  for (const g of galat) console.error('GALAT ' + g);
  if (galat.length) process.exitCode = 1;
}
if (process.argv[1] === new URL(import.meta.url).pathname) utama(); // tanpa await: adapter mengimpor modul ini (siklus)
