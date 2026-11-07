#!/usr/bin/env node
// Panen korporasi dan keuangan EBET untuk Jaringan METI (R24). Node stdlib saja.
//   node panen_keuangan.mjs --ambil     unduh dokumen bukti resmi ke data-panen/keuangan/raw/ (resumable)
//   node panen_keuangan.mjs --tkdn      sapu sertifikat TKDN energi dari tkdn.kemenperin.go.id (resumable)
//   node panen_keuangan.mjs --bangun    tanpa jaringan: tulis semua jsonl keluaran + cek silang ke raw/
//   node panen_keuangan.mjs --selftest  uji parser tanpa jaringan
// Etika: UA jujur, 1 permintaan serentak, jeda >= 2 dtk, robots.txt dicek per host (Disallow di grup *),
// 403/429 berulang = berhenti. Tanpa login, CAPTCHA, atau pengiriman formulir. IDX (idx.co.id) menjawab 403
// Cloudflare ke UA jujur: TIDAK ditembus; angka emiten diambil dari situs IR/siaran pers dan media (tingkat_bukti sedang).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const GAP_MS = 2300;
const TGL = '2026-11-07';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../data-panen/keuangan');
const RAW = path.join(OUT, 'raw');
const PER = path.resolve(HERE, '../../data-panen/perusahaan');

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const tulis = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
const jsonl = (f, rows) => tulis(f, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');

// ---------- jaringan ----------
const robots = new Map();
async function bolehAmbil(url) {
  const u = new URL(url);
  if (!robots.has(u.host)) {
    let aturan = [];
    try {
      const r = await fetch(u.origin + '/robots.txt', { headers: { 'User-Agent': UA } });
      if (r.ok) aturan = parseRobots(await r.text());
      await tidur(GAP_MS);
    } catch { /* robots tak terjangkau: anggap tak ada aturan */ }
    robots.set(u.host, aturan);
  }
  return !robots.get(u.host).some((p) => p && (u.pathname + u.search).startsWith(p));
}
export function parseRobots(t) { // Disallow dari grup yang memuat User-agent: *
  const out = []; let aktif = false, awal = true;
  for (const l of t.split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Za-z-]+)\s*:\s*(.*?)\s*$/); if (!m) continue;
    const k = m[1].toLowerCase();
    if (k === 'user-agent') { if (!awal) aktif = false; if (m[2] === '*') aktif = true; awal = true; } else { awal = false; if (aktif && k === 'disallow' && m[2]) out.push(m[2]); }
  }
  return out;
}
let gagalBeruntun = 0;
async function ambil(url, { biner = false } = {}) {
  assert(await bolehAmbil(url), 'robots melarang ' + url);
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(90000) });
      await tidur(GAP_MS);
      if (r.status === 403 || r.status === 429) { if (++gagalBeruntun >= 2) throw new Error('berhenti: ' + r.status + ' ' + url); return null; }
      if (!r.ok) return null;
      gagalBeruntun = 0;
      const buf = Buffer.from(await r.arrayBuffer());
      if (r.headers.get('content-length') && buf.length < +r.headers.get('content-length')) throw new Error('terpotong');
      return biner ? buf : buf.toString('utf8');
    } catch (e) { if (/berhenti/.test(e.message)) throw e; await tidur(8000); }
  }
  return null;
}

// ---------- bukti resmi (--ambil) ----------
const BUKTI = [
  ['pge-2024.html', 'https://pge.pertamina.com/en/press-release/continuing-sustainable-performance-in-green-energy-development-pge-books-profit-of-usd160-30-million-in-2024'],
  ['esdm-biodiesel-2026.html', 'https://www.esdm.go.id/id/media-center/arsip-berita/pemerintah-tetapkan-alokasi-biodiesel-tahun-2026-sebesar-1565-juta-kl'],
  ['jetp-home.html', 'https://jetp-id.org/'],
  ['jetp-cipp.html', 'https://jetp-id.org/cipp'],
  ['jetp-news-2025.html', 'https://jetp-id.org/news/jetp-2025-report-public-consultation'],
  ['perpres-112-2022.pdf', 'https://peraturan.bpk.go.id/Download/219946/Perpres%20Nomor%20112%20Tahun%202022.pdf'],
  ['kepmen-169-2021-abstrak.pdf', 'https://jdih.esdm.go.id/storage/document/Abstrak%20Kepmen%20ESDM%20No.%20169.K_HK.02_MEM.M_2021.pdf'],
  ['green-sukuk-2025.pdf', 'https://api-djppr.kemenkeu.go.id/web/api/v1/media/8C2C3353-9134-43B3-9307-D465DE7C2CB8'],
  ['green-sukuk-2024.pdf', 'https://api-djppr.kemenkeu.go.id/web/api/v1/media/A99E2679-3F9D-4AA1-956C-D98CC2963BFD'],
];
async function cmdAmbil() {
  for (const [nama, url] of BUKTI) {
    const f = path.join(RAW, nama);
    if (fs.existsSync(f)) continue;
    const d = await ambil(url, { biner: true });
    if (d) { tulis(f, d); console.log('ok', nama, d.length); } else console.log('GAGAL', nama);
  }
}

// ---------- TKDN ----------
const TKDN = 'https://tkdn.kemenperin.go.id';
const KUERI = ['modul surya', 'panel surya', 'sel surya', 'photovoltaic', 'inverter', 'baterai lithium', 'turbin angin', 'turbin air', 'turbin uap', 'pembangkit listrik tenaga', 'mikrohidro'];
const MAX_HAL = 8;
export function parseTkdn(html) {
  const h = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, '');
  const tok = h.replace(/<[^>]+>/g, '|').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').split('|').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const total = +((tok[tok.indexOf('Hasil pencarian sertifikat') + 1] || '0').replace(/\./g, '')) || 0;
  const idx = tok.map((t, i) => (/^KBLI \d+$/.test(t) ? i : -1)).filter((i) => i >= 0);
  const rows = idx.map((s, k) => {
    const b = tok.slice(s, idx[k + 1] ?? tok.length);
    const after = (lbl, n = 1) => { const i = b.indexOf(lbl); return i < 0 ? null : b[i + n]; };
    const tk = b.indexOf('Nilai TKDN');
    const bm = b.indexOf('Nilai BMP');
    const mt = (b[3] || '').match(/^Merk (.*?) · Tipe (.*)$/);
    const sp = b.indexOf('Spesifikasi');
    const kg = b.indexOf('Kelompok Barang');
    return {
      kbli: b[0].slice(5),
      perusahaan: b[2],
      merk: mt ? mt[1] : null, tipe: mt ? mt[2] : null,
      produk: b[4] && !b[4].startsWith('·') ? b[4] : null,
      lokasi: (b.find((x) => x.startsWith('· ')) || '').slice(2) || null,
      tkdn_persen: tk >= 0 ? +(b[tk + 1] + b[tk + 2].replace(',', '.').replace('%', '')) : null,
      bmp_persen: bm >= 0 && /^[\d,]+%$/.test(b[bm + 1]) ? +b[bm + 1].replace(',', '.').replace('%', '') : null,
      berlaku_sd: after('Berlaku s/d'),
      diterbitkan: after('Diterbitkan'),
      spesifikasi: sp >= 0 ? b.slice(sp + 1, kg >= 0 ? kg : undefined).filter((x) => !/^\+\d+ lainnya$/.test(x)).slice(0, 8) : [],
      kelompok_barang: after('Kelompok Barang'),
      provinsi: after('Provinsi'),
    };
  });
  return { total, rows };
}
async function cmdTkdn() {
  for (const q of KUERI) {
    const slug = q.replace(/\W+/g, '-');
    for (let p = 1; p <= MAX_HAL; p++) {
      const f = path.join(RAW, 'tkdn', `${slug}-${p}.json`);
      if (fs.existsSync(f)) { if (JSON.parse(fs.readFileSync(f, 'utf8')).rows.length < 10) break; continue; }
      const url = `${TKDN}/sertifikat?q=${encodeURIComponent(q)}${p > 1 ? '&page=' + p : ''}`;
      const html = await ambil(url);
      if (!html) { console.log('GAGAL', url); break; }
      const r = parseTkdn(html);
      tulis(f, JSON.stringify({ url, kueri: q, halaman: p, tanggal: TGL, ...r }));
      console.log(q, p, r.rows.length, 'dari', r.total);
      if (r.rows.length < 10) break;
    }
  }
}
const ENERGI = /surya|photovoltaic|\bpv\b|plts|turbin|mikrohidro|pltmh|pltp|pltb|bayu|panas bumi|solar/i;
const ENERGI_LISTRIK = /inverter|baterai|battery|lithium|\bbess\b/i; // hanya bila bukan pendingin/kendaraan
const BUKAN = /pendingin|air conditioner|\bac\b|kendaraan|mobil|motor listrik|sepeda|ambulan|karoseri|forklift|kesehatan|pelumas|mesin cuci|ventilator|cardiac|electrocardio|infusion|turboklin/i;
const BIDANG = [['surya', /surya|photovoltaic|\bpv\b|plts|solar/i], ['penyimpanan', /baterai|battery|lithium/i], ['bayu', /angin|bayu|pltb/i], ['hidro', /turbin air|mikrohidro|pltmh|hydro/i], ['panas-bumi', /uap|panas bumi|pltp/i], ['jaringan', /inverter|trafo|transformator|kabel/i]];
export function bangunTkdn(files) {
  const seen = new Set(), out = [];
  for (const f of files) {
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    for (const r of d.rows) {
      const teks = [r.produk, r.tipe, ...r.spesifikasi].join(' ');
      if (BUKAN.test(teks + " " + (r.kelompok_barang || ""))) continue;
      if (!(ENERGI.test(teks) || (ENERGI_LISTRIK.test(teks) && !BUKAN.test(teks + ' ' + (r.kelompok_barang || ''))))) continue;
      const kunci = [r.perusahaan, r.produk, r.tipe, r.berlaku_sd].join('|');
      if (seen.has(kunci)) continue; seen.add(kunci);
      out.push({
        perusahaan: r.perusahaan, produk: r.produk, merk: r.merk, tipe: r.tipe, lokasi: r.lokasi, provinsi: r.provinsi,
        kelompok_barang: r.kelompok_barang, tkdn_persen: r.tkdn_persen, bmp_persen: r.bmp_persen, berlaku_sd: r.berlaku_sd, diterbitkan: r.diterbitkan,
        kepakaran_usulan: BIDANG.filter(([, re]) => re.test(teks)).map(([k]) => k),
        kueri: d.kueri, sumber_url: d.url, tanggal: d.tanggal, tingkat_bukti: 'resmi',
      });
    }
  }
  return out.sort((a, b) => a.perusahaan.localeCompare(b.perusahaan) || (b.tkdn_persen ?? 0) - (a.tkdn_persen ?? 0));
}

// ---------- tarif Perpres 112/2022 (transkripsi Lampiran I-II dari PDF BPK, hasil OCR; angka diperiksa silang antar tabel) ----------
const P112 = 'https://peraturan.bpk.go.id/Download/219946/Perpres%20Nomor%20112%20Tahun%202022.pdf';
const SKEMA = {
  PLTA: { kap: ['s.d. 1 MW', '>1-3 MW', '>3-5 MW', '>5-20 MW', '>20-50 MW', '>50-100 MW', '>100 MW'], a: [11.23, 10.92, 9.65, 9.09, 8.86, 7.81, 6.74], b: [7.02, 6.82, 6.03, 5.68, 5.54, 4.88, 4.21], bThn: 30, varian: { aliran: 1, 'multiguna (waduk/irigasi)': 0.8, ekspansi: 0.7 } },
  PLTS: { kap: ['s.d. 1 MW', '>1-3 MW', '>3-5 MW', '>5-10 MW', '>10-20 MW', '>20 MW'], a: [11.47, 9.94, 8.77, 8.26, 7.94, 6.95], b: [6.88, 5.97, 5.26, 4.96, 4.76, 4.17], bThn: 30, varian: { standar: 1, ekspansi: 0.8, 'lahan pemerintah': 0.95 } },
  PLTB: { kap: ['s.d. 5 MW', '>5-20 MW', '>20 MW'], a: [11.22, 10.26, 9.54], b: [6.73, 6.15, 5.73], bThn: 30, varian: { standar: 1, ekspansi: 0.7 } },
  PLTBm: { kap: ['s.d. 1 MW', '>1-3 MW', '>3-5 MW', '>5-10 MW', '>10 MW'], a: [11.55, 10.73, 10.2, 9.86, 9.29], b: [9.24, 8.59, 8.16, 7.89, 7.43], bThn: 25, varian: { standar: 1, ekspansi: 0.8 } },
  PLTBg: { kap: ['s.d. 1 MW', '>1-3 MW', '>3-5 MW', '>5-10 MW', '>10 MW'], a: [10.18, 9.81, 8.99, 8.51, 7.44], b: [6.11, 5.89, 5.39, 5.1, 4.46], bThn: 20, varian: { standar: 1, ekspansi: 0.8 } },
  PLTP: { kap: ['s.d. 10 MW', '>10-50 MW', '>50-100 MW', '>100 MW'], a: [9.76, 9.41, 8.64, 7.65], b: [8.3, 8.0, 7.35, 6.5], bThn: 30, varian: { 'listrik (seluruh/sebagian dibangun badan usaha atau pemerintah)': 1 } },
  'PLTP uap setara listrik': { kap: ['s.d. 10 MW', '>10-50 MW', '>50-100 MW', '>100 MW'], a: [6.6, 6.25, 5.48, 4.48], b: [5.6, 5.31, 4.65, 3.91], bThn: 30, varian: { 'pembelian uap': 1 }, cat: 'angka 3,91 (>100 MW thn 11+) terbaca samar di OCR' },
};
export function bangunTarif() {
  const rows = [];
  const dasar = { dasar_hukum: 'Perpres 112/2022 Lampiran I', sumber_url: P112, tanggal: TGL, tingkat_bukti: 'resmi', satuan: 'cent USD/kWh', catatan_umum: 'Thn 1-10 = nilai dasar x F x pengali (F = Lampiran II); thn 11 dst = nilai tetap x pengali, tanpa F. Transkripsi dari PDF hasil OCR; tarif dapat diubah lewat Kepmen ESDM sehingga cek ulang sebelum dikutip.' };
  for (const [tek, s] of Object.entries(SKEMA)) {
    for (const [varian, pengali] of Object.entries(s.varian)) {
      s.kap.forEach((kap, i) => rows.push({ teknologi: tek, varian, kapasitas: kap, thn_1_10_dasar: s.a[i], pakai_faktor_f: true, pengali, thn_11_dst: +(s.b[i] * pengali).toFixed(4), thn_11_sd: s.bThn, ...(s.cat ? { catatan: s.cat } : {}), ...dasar }));
    }
  }
  rows.push({ teknologi: 'PLTA', varian: 'excess power', kapasitas: 'semua', thn_1_10_dasar: +(5.8 * 0.7).toFixed(4), pakai_faktor_f: false, pengali: 0.7, ...dasar });
  rows.push({ teknologi: 'PLTBm', varian: 'excess power', kapasitas: 'semua', thn_1_10_dasar: 9.29, pakai_faktor_f: false, pengali: 1, ...dasar });
  rows.push({ teknologi: 'PLTBg', varian: 'excess power', kapasitas: 'semua', thn_1_10_dasar: 7.44, pakai_faktor_f: false, pengali: 1, ...dasar });
  for (const [t, v] of [['PLTA', 3.76], ['PLTS', 5.63], ['PLTB', 5.63], ['PLTBm', 9.29], ['PLTBg', 7.44]]) rows.push({ teknologi: t, varian: 'dibangun seluruhnya oleh pemerintah pusat/daerah (termasuk hibah)', kapasitas: 'semua', thn_1_10_dasar: v, pakai_faktor_f: false, pengali: 1, ...dasar });
  const F = [['Jawa, Madura, Bali', 1.0], ['Jawa/Madura/Bali pulau kecil', 1.1], ['Sumatera', 1.1], ['Kepulauan Riau', 1.2], ['Kalimantan', 1.1], ['Kalimantan pulau kecil', 1.15], ['Sulawesi', 1.1], ['Sulawesi pulau kecil', 1.15], ['Nusa Tenggara', 1.2], ['Nusa Tenggara pulau kecil', 1.25], ['Maluku Utara', 1.25], ['Maluku Utara pulau kecil', 1.3]];
  for (const [wilayah, f] of F) rows.push({ jenis: 'faktor_lokasi_F', wilayah, nilai_f: f, dasar_hukum: 'Perpres 112/2022 Lampiran II', sumber_url: P112, tanggal: TGL, tingkat_bukti: 'resmi', catatan: 'Maluku, Papua, Papua Barat, Mentawai tak terbaca andal di OCR: tidak dimasukkan' });
  return rows;
}

// ---------- BPP ----------
export function bangunBpp() {
  const ABS = 'https://jdih.esdm.go.id/storage/document/Abstrak%20Kepmen%20ESDM%20No.%20169.K_HK.02_MEM.M_2021.pdf';
  const MEDIA = 'https://www.ruangenergi.com/kementerian-esdm-terbitkan-aturan-bpp-pln-ini-isinya/';
  const t = [['Aceh', 1349.72, 9.26], ['Pulau Weh', 1995.8, 13.7], ['Pulau Simeulue', 2148.71, 14.75], ['Sumatera Utara', 1247.24, 8.56], ['Nias', 2805.5, 19.25], ['Sumatera Barat', 995.58, 6.83], ['Kepulauan Mentawai', 2319.63, 15.92], ['Riau', 1374.43, 9.43], ['Kepulauan Riau, Bintan', 1833.55, 12.58], ['Tanjung Balai Karimun', 1544.96, 10.6], ['Natuna', 1972.24, 13.53], ['Anambas', 1994.58, 13.69], ['Jawa-Bali', 908.15, 6.23]];
  const rows = [{ jenis: 'dokumen', dokumen: 'Kepmen ESDM 169.K/HK.02/MEM.M/2021 tentang Besaran BPP Pembangkitan PT PLN (Persero) Tahun 2020', ditetapkan: '2021-09-08', berlaku_sampai: '2022-03-31', sumber_url: ABS, tanggal: TGL, tingkat_bukti: 'resmi', catatan: 'Abstrak JDIH ESDM tanpa tabel lampiran. Kepmen BPP yang lebih baru (2022 dst) TIDAK ditemukan publik; angka di bawah kedaluwarsa, jangan dipakai sebagai BPP berlaku.' }];
  for (const [sistem, rp, cen] of t) rows.push({ jenis: 'bpp_sistem', sistem, bpp_rp_kwh: rp, bpp_cent_kwh: cen, tahun_dasar: 2020, dasar_hukum: 'Kepmen ESDM 169.K/HK.02/MEM.M/2021', berlaku_sampai: '2022-03-31', kedaluwarsa: true, sumber_url: MEDIA, tanggal: TGL, tingkat_bukti: 'sedang', via: 'media (ruangenergi.com, 16 Okt 2021); kutipan 13 dari seluruh sistem' });
  return rows;
}

// ---------- IDX / emiten ----------
// Nilai media = sedang (via pihak ketiga, D5). Emiten PGEO dari siaran pers perusahaan = resmi. IDX 403 ke UA jujur.
const R = (kode, perusahaan, jenis, tahun, metrik, nilai, satuan, sumber_url, tingkat_bukti, extra = {}) => ({ kode, perusahaan, jenis, tahun, metrik, nilai, satuan, sumber_url, tanggal: TGL, tingkat_bukti, ...(tingkat_bukti === 'sedang' ? { via: 'media', perlu_verifikasi_idx: true } : {}), ...extra });
export function bangunIdx() {
  const PGE = 'https://pge.pertamina.com/en/press-release/continuing-sustainable-performance-in-green-energy-development-pge-books-profit-of-usd160-30-million-in-2024';
  const pg = (m, n, s, e) => R('PGEO', 'PT Pertamina Geothermal Energy Tbk', 'keuangan', 2024, m, n, s, PGE, 'resmi', e);
  const BR = 'https://market.bisnis.com/read/20250321/192/1863580/barito-renewables-energy-bren-kantongi-laba-bersih-rp197-triliun-pada-2024';
  const BRS = 'https://stockwatch.id/kinerja-keuangan-solid-laba-bersih-barito-renewables-us155-juta-pada-2024';
  const MD = 'https://indonesiabusinesspost.com/4039/energy-and-resources/medco-energi-books-strong-financial-operational-performance-in-2024';
  const TB = 'https://investortrust.id/market/59472/laba-tbs-energi-melesat-260-saat-pendapatan-turun-kok-bisa';
  const AR = 'https://www.kabarbursa.com/carbon-trading/tak-ada-dividen-apa-yang-menarik-dari-arko';
  return [
    pg('pendapatan', 407.12, 'USD juta', { pembanding_2023: 406.29 }),
    pg('laba bersih', 160.3, 'USD juta', { pembanding_2023: 163.57, catatan: 'laporan keuangan audit dipublikasikan 2025-03-25' }),
    pg('total aset', 2990, 'USD juta', { pembanding_2023: 2960 }),
    pg('total liabilitas', 988.65, 'USD juta', { pembanding_2023: 992.89 }),
    R('PGEO', 'PT Pertamina Geothermal Energy Tbk', 'pengurus', 2024, 'Direktur Utama', 'Julfi Hadi', null, PGE, 'resmi', { catatan: 'hanya dua pengurus tersebut di siaran pers; susunan lengkap ada di laporan tahunan 2024 (belum diunduh)' }),
    R('PGEO', 'PT Pertamina Geothermal Energy Tbk', 'pengurus', 2024, 'Direktur Keuangan', 'Yurizki Rio', null, PGE, 'resmi'),
    R('PGEO', 'PT Pertamina Geothermal Energy Tbk', 'aksi_korporasi', 2025, 'Rencana COD Lumut Balai Unit 2', 55, 'MW', PGE, 'resmi', { catatan: 'rencana tahun 2025 menurut siaran pers' }),
    R('BREN', 'PT Barito Renewables Energy Tbk', 'keuangan', 2024, 'pendapatan', 596.82, 'USD juta', BR, 'sedang'),
    R('BREN', 'PT Barito Renewables Energy Tbk', 'keuangan', 2024, 'laba bersih diatribusikan ke pemilik induk', 122.1, 'USD juta', BR, 'sedang', { konflik: 'Stockwatch/EmitenNews menulis laba bersih USD155 juta; kemungkinan laba konsolidasi vs diatribusikan, belum direkonsiliasi' }),
    R('BREN', 'PT Barito Renewables Energy Tbk', 'keuangan', 2024, 'laba bersih (angka lain)', 155, 'USD juta', BRS, 'sedang', { konflik: 'lihat baris laba diatribusikan 122,1' }),
    R('BREN', 'PT Barito Renewables Energy Tbk', 'keuangan', 2024, 'EBITDA', 515, 'USD juta', BR, 'sedang'),
    R('BREN', 'PT Barito Renewables Energy Tbk', 'aksi_korporasi', 2025, 'Tambahan kapasitas panas bumi', 41, 'MW', 'https://market.bisnis.com/read/20250116/192/1832150/barito-renewables-bren-tambah-kapasitas-setrum-panas-bumi-41-mw', 'sedang'),
    R('KEEN', 'PT Kencana Energi Lestari Tbk', 'keuangan', 2024, 'pendapatan', 37.87, 'USD juta', 'https://market.bisnis.com/read/20250213/192/1839303/kencana-energi-lestari-keen-bidik-laba-rp1799-miliar-di-2025', 'sedang', { catatan: 'turun 21,15% y/y; laba bersih 2024 TIDAK terkonfirmasi (2023: USD12,91 juta Kontan vs 14,82 juta Bisnis)' }),
    R('KEEN', 'PT Kencana Energi Lestari Tbk', 'keuangan', 2024, 'pendapatan konsesi PLTA', 14, 'USD juta', 'https://tanahair.net/?p=10949', 'sedang', { catatan: '37% dari pendapatan; sumber laporan keuangan audit' }),
    R('KEEN', 'PT Kencana Energi Lestari Tbk', 'aksi_korporasi', 2024, 'PLTA Ordi Hulu beroperasi (April 2024); PLTA mini Salu Noling 10 MW dalam konstruksi', null, null, 'https://tanahair.net/?p=10949', 'sedang'),
    R('MEDC', 'PT Medco Energi Internasional Tbk', 'keuangan', 2024, 'laba bersih diatribusikan', 367.4, 'USD juta', MD, 'sedang', { catatan: 'perusahaan migas dan tenaga; sisi EBT lewat Medco Power (Ijen PLTP, East Bali PLTS)' }),
    R('MEDC', 'PT Medco Energi Internasional Tbk', 'keuangan', 2024, 'pendapatan', 2400, 'USD juta', MD, 'sedang'),
    R('MEDC', 'PT Medco Energi Internasional Tbk', 'aksi_korporasi', 2025, 'PLTP Ijen 35 MW beroperasi komersial (Feb 2025); PLTS East Bali COD Juli 2025', null, null, 'https://www.medcoenergi.com/en/our-sustainability/climate-change/transition-to-low-carbon-energy/', 'sedang'),
    R('TOBA', 'PT TBS Energi Utama Tbk', 'keuangan', 2024, 'laba bersih diatribusikan', 28.47, 'USD juta', TB, 'sedang', { catatan: 'naik 260,37% y/y; transisi dari batu bara ke EBT dan waste-to-energy' }),
    R('TOBA', 'PT TBS Energi Utama Tbk', 'keuangan', 2024, 'pendapatan', 445.65, 'USD juta', 'https://stockanalysis.com/quote/idx/TOBA/financials', 'rendah', { via: 'agregator data', perlu_verifikasi_idx: true, pembanding_2023: 501.26 }),
    R('TOBA', 'PT TBS Energi Utama Tbk', 'aksi_korporasi', 2025, 'Dividen dari laba 2024', 10, 'USD juta', 'https://www.investortrust.id/market/64044/tbs-energi-toba-bagi-dividen-tertinggi-sejak-ipo-segini-totalnya', 'sedang', { catatan: 'setara Rp168,84 miliar' }),
    R('ARKO', 'PT Arkora Hydro Tbk', 'keuangan', 2024, 'laba bersih', 39800, 'IDR juta', AR, 'sedang', { konflik: 'basis pembanding laporan 2025 mengisyaratkan ~Rp41,8 miliar' }),
    R('ARKO', 'PT Arkora Hydro Tbk', 'keuangan', 2024, 'pendapatan', 238910, 'IDR juta', 'https://investortrust.id/market/96617/laba-arkora-arko-melesat-52-84-pertumbuhan-ditopang-ini', 'sedang'),
    R('ARKO', 'PT Arkora Hydro Tbk', 'aksi_korporasi', 2024, 'PLTA Yaentu beroperasi sejak kuartal IV 2024', null, null, 'https://market.bisnis.com/read/20241230/192/1827820/arkora-hydro-arko-targetkan-laba-bersih-naik-34-akhir-2024', 'rendah', { catatan: 'atribusi sumber dari ringkasan pencarian' }),
    R('ARKO', 'PT Arkora Hydro Tbk', 'aksi_korporasi', 2025, 'Perjanjian jual beli listrik PLTA dengan Nosu Hydro', null, null, 'https://market.bisnis.com/read/20250910/192/1910183/arkora-arko-teken-perjanjian-jual-beli-listrik-plta-dengan-nosu-hydro', 'sedang'),
  ];
}

// ---------- green finance, JETP ----------
export function bangunGreen() {
  const G = 'https://api-djppr.kemenkeu.go.id/web/api/v1/media/8C2C3353-9134-43B3-9307-D465DE7C2CB8';
  const base = { sumber_url: G, dokumen: '2025 Green Sukuk Allocation and Impact Report (DJPPR Kemenkeu)', tanggal: TGL, tingkat_bukti: 'resmi' };
  return [
    { jenis: 'penerbitan', instrumen: 'Global Sovereign Green Sukuk SNI 0754', isin: 'USY68613AC56', nilai: 600, satuan: 'USD juta', tenor_tahun: 30, kupon_persen: 5.5, tanggal_terbit: '2024-07-02', ...base },
    { jenis: 'penerbitan', instrumen: 'Green Sukuk wholesale domestik PBSG001', isin: 'IDP000005308', nilai: 8.95, satuan: 'IDR triliun', tenor_tahun: 4, kupon_persen: 6.55, kupon_jenis: 'floating', tahun: 2024, ...base },
    { jenis: 'alokasi_kumulatif_2018_2024', sektor: 'Renewable Energy', idr: 5963932111693, usd: 414319614, porsi_persen: 3.59, ...base },
    { jenis: 'alokasi_kumulatif_2018_2024', sektor: 'Energy Efficiency', idr: 4643134415114, usd: 317186796, porsi_persen: 2.75, ...base },
    { jenis: 'alokasi_kumulatif_2018_2024', pemilik_proyek: 'Kementerian ESDM', idr: 3433936835827, usd: 242305780, porsi_persen: 2.1, ...base },
    { jenis: 'celah', catatan: 'Green bond / sustainability-linked bond emiten energi di IDX tidak terambil: idx.co.id menolak (403 Cloudflare) UA jujur. Sumber alternatif: OJK/KSEI pengumuman efek bersifat utang.', tanggal: TGL, tingkat_bukti: 'tidak-ada' },
  ];
}
export function bangunJetp() {
  const H = 'https://jetp-id.org/', C = 'https://jetp-id.org/cipp', N = 'https://jetp-id.org/news/jetp-2025-report-public-consultation';
  const b = (sumber_url, extra) => ({ sumber_url, tanggal: TGL, tingkat_bukti: 'resmi', ...extra });
  return [
    b(H, { jenis: 'komitmen', uraian: 'Komitmen awal JETP Indonesia', total_usd_miliar: 20, ipg_usd_miliar: 10, gfanz_usd_miliar: 10 }),
    b(C, { jenis: 'dokumen', uraian: 'CIPP diluncurkan 21 November 2023; unduhan EN dan ID di jetp-id.org/cipp', tanggal_terbit: '2023-11-21', catatan: 'daftar proyek CIPP ada di PDF laporan penuh; unduhan PDF terpotong oleh server (98 KB) sehingga daftar belum terbaca' }),
    b(N, { jenis: 'dokumen', uraian: 'Konsultasi publik JETP Progress Report 2025: 24 Okt-24 Nov 2025, 250 masukan', versi_final: 'belum terbit saat pemeriksaan' }),
    b(H, { jenis: 'portofolio', proyek: 'MRT Jakarta East-West Line', nilai_usd_juta: 1027, skema: 'pinjaman lunak JICA disetujui 2024, diklaim sebagai JETP', catatan: 'bukan proyek EBT; masuk pos elektrifikasi/transportasi' }),
    b(H, { jenis: 'portofolio', proyek: 'Grant for Patuha Unit-2 Geothermal Power Generation Project', teknologi: 'panas-bumi', nilai_usd_juta: null }),
    b(H, { jenis: 'portofolio', proyek: 'IKI-Flex JETP Support Package', nilai_usd_juta: null }),
    b(H, { jenis: 'portofolio', proyek: 'European Fund for Sustainable Development Plus (EFSD+) untuk persiapan proyek energi', nilai_usd_juta: null }),
  ];
}

// ---------- tambahan perusahaan ----------
export function bangunBubbn() {
  const E26 = 'https://www.esdm.go.id/id/media-center/arsip-berita/pemerintah-tetapkan-alokasi-biodiesel-tahun-2026-sebesar-1565-juta-kl';
  const B = { tanggal: TGL, tingkat_bukti: 'resmi' };
  return [
    { jenis: 'alokasi', dasar_hukum: 'Kepmen ESDM 439.K/EK.01/MEM.E/2025', tahun: 2026, total_kl: 15646372, pso_kl: 7454600, non_pso_kl: 8191772, sumber_url: E26, ...B },
    { jenis: 'alokasi', dasar_hukum: 'Kepmen ESDM 341.K/EK.01/MEM.E/2024 (mandatori B40)', tahun: 2025, total_kl: 15600000, pso_kl: 7550000, non_pso_kl: 8070000, sumber_url: 'https://www.esdm.go.id/en/media-center/news-archives/wujudkan-ketahanan-energi-dan-kurangi-impor-menteri-esdm-mandatori-b40-berlaku-1-januari-2025', tanggal: TGL, tingkat_bukti: 'sedang', via: 'ringkasan pencarian atas rilis ESDM; angka dibulatkan' },
    { jenis: 'jumlah_badan_usaha', tahun: 2026, bu_bbn: 26, bu_bbm: 32, sumber_url: 'https://listrikindonesia.com/detail/18805/kepmen-esdm-terbit-alokasi-biodiesel-2026-capai-156-juta-kl', tanggal: TGL, tingkat_bukti: 'sedang', via: 'media', catatan: 'jumlah beda antar sumber (24/26/28/32 untuk tahun berbeda)' },
    ...['Wilmar', 'Apical', 'KPN', 'Musim Mas'].map((g) => ({ jenis: 'pemasok_utama', grup: g, volume_kl: null, sumber_url: 'https://www.argusmedia.com/en/news-and-insights/latest-market-news/2516291-indonesia-s-2024-biodiesel-allocations-set-higher', tanggal: TGL, tingkat_bukti: 'rendah', via: 'media (Argus)', catatan: 'disebut pemasok biodiesel terbesar; nama badan usaha dan volume per BU ada di lampiran Kepmen (belum terunduh)' })),
    { jenis: 'celah', catatan: 'Daftar nama 26 BU BBN dan alokasi per BU ada di lampiran Kepmen 439/2025 dan 341/2024; tidak ada di rilis ESDM maupun liputan media. Ambil dari JDIH ESDM/peraturan.go.id. Bioetanol: belum ada alokasi (Kepmen 113.K/EK.05/MEM.E/2026 mengatur penahapan).', tanggal: TGL, tingkat_bukti: 'tidak-ada' },
  ];
}
export function bangunIuptl() {
  return [{ jenis: 'celah', catatan: 'Tidak ada daftar publik pemegang IUPTL EBT di gatrik.esdm.go.id maupun ebtke.esdm.go.id (hasil pencarian 7 Nov 2026). Kewenangan: Menteri (BUMN, lintas provinsi) dan gubernur (satu provinsi) via OSS. Jalur: permintaan informasi PPID ESDM atau OSS.', sumber_url: 'https://gatrik.esdm.go.id/assets/uploads/download_index/files/5b143-panduan-perizinan-berusaha-penyediaan-tenaga-listrik.pdf', tanggal: TGL, tingkat_bukti: 'tidak-ada' }];
}

// ---------- cek silang ke raw ----------
const CEK = [
  ['pge-2024.html', '407.12'], ['pge-2024.html', '160.30'], ['pge-2024.html', 'Julfi Hadi'], ['pge-2024.html', 'Yurizki Rio'],
  ['esdm-biodiesel-2026.html', '15.646.372'], ['esdm-biodiesel-2026.html', '7.454.600'], ['jetp-home.html', 'US$20 billion'], ['jetp-home.html', '1,027 million'],
  ['jetp-cipp.html', '21 November 2023'], ['jetp-news-2025.html', '250 inputs'],
  ['green-sukuk-2025.pdf', '5,963,932,111,693'], ['green-sukuk-2025.pdf', '4,643,134,415,114'], ['green-sukuk-2025.pdf', '3,433,936,835,827'], ['green-sukuk-2025.pdf', 'USY68613AC56'], ['green-sukuk-2025.pdf', '8.95 trillion'],
  ['kepmen-169-2021-abstrak.pdf', '31 Maret 2022'],
];
function teksRaw(nama) {
  const f = path.join(RAW, nama);
  if (!fs.existsSync(f)) return null;
  if (!nama.endsWith('.pdf')) return fs.readFileSync(f, 'utf8');
  try { return execFileSync('pdftotext', ['-layout', f, '-'], { maxBuffer: 1 << 28 }).toString(); } catch { return null; }
}
function cekSilang() {
  const cache = {}; let ok = 0, gagal = 0, tanpa = 0;
  for (const [nama, s] of CEK) {
    cache[nama] ??= teksRaw(nama);
    if (cache[nama] == null) { tanpa++; continue; }
    if (cache[nama].includes(s)) ok++; else { gagal++; console.log('CEK GAGAL', nama, s); }
  }
  console.log(`cek silang raw: ok=${ok} gagal=${gagal} raw-tak-ada=${tanpa}`);
}

function cmdBangun() {
  const dir = path.join(RAW, 'tkdn');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f)) : [];
  const tk = bangunTkdn(files);
  const hasil = [
    ['idx.jsonl', bangunIdx()], ['green_finance.jsonl', bangunGreen()], ['tarif.jsonl', bangunTarif()], ['bpp.jsonl', bangunBpp()], ['jetp.jsonl', bangunJetp()],
  ];
  for (const [n, rows] of hasil) { jsonl(path.join(OUT, n), rows); console.log(n, rows.length); }
  jsonl(path.join(PER, 'tambahan_tkdn.jsonl'), tk); console.log('tambahan_tkdn.jsonl', tk.length, 'perusahaan', new Set(tk.map((r) => r.perusahaan)).size);
  jsonl(path.join(PER, 'tambahan_bubbn.jsonl'), bangunBubbn());
  jsonl(path.join(PER, 'tambahan_iuptl.jsonl'), bangunIuptl());
  cekSilang();
}

function selftest() {
  assert.deepEqual(parseRobots('User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /\nDisallow: /cari\nDisallow: /api/'), ['/cari', '/api/']);
  const html = '<p>Hasil pencarian sertifikat</p><b>55</b><div>KBLI 25119</div><span>Berlaku</span><b>PT Sankeindo</b><i>Merk SANKELUX · Tipe Rooftop Mounted</i><i>Penyangga Modul Surya</i><i>· Kabupaten Bogor</i><b>Nilai TKDN</b><b>85</b><b>,00%</b><b>Nilai BMP</b><b>4,65%</b><b>Berlaku s/d</b><b>04 Jun 2031</b><b>Spesifikasi</b><b>1x1 PV</b><b>Kelompok Barang</b><b>Peralatan Kelistrikan</b><b>Provinsi</b><b>Jawa Barat</b><b>Diterbitkan</b><b>04 Jun 2026</b>';
  const r = parseTkdn(html);
  assert.equal(r.total, 55); assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].perusahaan, 'PT Sankeindo'); assert.equal(r.rows[0].tkdn_persen, 85); assert.equal(r.rows[0].bmp_persen, 4.65);
  assert.equal(r.rows[0].provinsi, 'Jawa Barat'); assert.deepEqual(r.rows[0].spesifikasi, ['1x1 PV']);
  const t = bangunTarif(); assert.ok(t.find((x) => x.teknologi === 'PLTS' && x.varian === 'ekspansi' && x.kapasitas === '>20 MW' && x.thn_11_dst === +(4.17 * 0.8).toFixed(4)));
  for (const row of [...bangunIdx(), ...bangunBpp(), ...bangunGreen(), ...bangunJetp(), ...bangunBubbn(), ...bangunIuptl()]) assert.ok(row.tanggal && (row.sumber_url || row.jenis === 'celah'), JSON.stringify(row));
  console.log('selftest ok');
}

const arg = process.argv[2];
if (arg === '--selftest') selftest();
else if (arg === '--ambil') await cmdAmbil();
else if (arg === '--tkdn') await cmdTkdn();
else if (arg === '--bangun') cmdBangun();
else console.log('pakai: --ambil | --tkdn | --bangun | --selftest');
