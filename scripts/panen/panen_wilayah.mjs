#!/usr/bin/env node
// Panen wilayah (provinsi + ASEAN) untuk Jaringan METI: JM-Q01 (potensi vs realisasi), JM-Q14 (ASEAN), JM-D05. Node stdlib + pdftotext (poppler).
//   node panen_wilayah.mjs --selftest   uji parser tanpa jaringan
//   node panen_wilayah.mjs --ambil      unduh PDF/CSV/JSON ke data-panen/wilayah/raw/ (robots dicek, jeda >= 2 dtk, resumable)
//   node panen_wilayah.mjs --teks       pdftotext -layout untuk PDF di raw/
//   node panen_wilayah.mjs --bangun     tulis provinsi.jsonl, asean.jsonl, gagal.jsonl, konflik.jsonl
// Sumber: HEESI 2025 + Statistik Ketenagalistrikan 2024 (ESDM), Perpres 22/2017 (RUEN) dan Perda RUED (peraturan.bpk.go.id),
//   OWID energy-data (turunan Ember, CC BY 4.0), IRENASTAT PxWeb, World Bank API (CC BY 4.0).
// Aturan: UA jujur, jeda >= 2 dtk, robots dicek, 403/429 berhenti. Nilai tanpa sumber TIDAK diisi. Data mentah tidak masuk repo.
// Wikidata dan Ember files-host TIDAK diambil: robots.txt mereka melarang (lihat R23-WILAYAH.md).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const GAP_MS = 2200;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'data-panen/wilayah');
const RAW = path.join(OUT, 'raw');
const HARI_INI = process.env.TANGGAL_AMBIL || new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bacaJsonl = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const tulis = (f, rows) => fs.writeFileSync(f, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''), 'utf8');

// 38 provinsi, kode Kemendagri (dipakai HEESI), nama baku
export const PROV = {
  11: 'Aceh', 12: 'Sumatera Utara', 13: 'Sumatera Barat', 14: 'Riau', 15: 'Jambi', 16: 'Sumatera Selatan', 17: 'Bengkulu', 18: 'Lampung',
  19: 'Kepulauan Bangka Belitung', 21: 'Kepulauan Riau', 31: 'DKI Jakarta', 32: 'Jawa Barat', 33: 'Jawa Tengah', 34: 'DI Yogyakarta', 35: 'Jawa Timur', 36: 'Banten',
  51: 'Bali', 52: 'Nusa Tenggara Barat', 53: 'Nusa Tenggara Timur', 61: 'Kalimantan Barat', 62: 'Kalimantan Tengah', 63: 'Kalimantan Selatan',
  64: 'Kalimantan Timur', 65: 'Kalimantan Utara', 71: 'Sulawesi Utara', 72: 'Sulawesi Tengah', 73: 'Sulawesi Selatan', 74: 'Sulawesi Tenggara',
  75: 'Gorontalo', 76: 'Sulawesi Barat', 81: 'Maluku', 82: 'Maluku Utara', 91: 'Papua', 92: 'Papua Barat', 93: 'Papua Selatan',
  94: 'Papua Tengah', 95: 'Papua Pegunungan', 96: 'Papua Barat Daya',
};
const NAMA_KODE = Object.fromEntries(Object.entries(PROV).map(([k, v]) => [v, +k]));
const ALIAS = {
  'north sumatera': 12, 'north sumatra': 12, 'west sumatera': 13, 'south sumatera': 16, 'bangka belitung islands': 19, 'riau islands': 21,
  'special capital region of jakarta': 31, 'dki jakarta': 31, 'special region of yogyakarta': 34, 'di yogyakarta': 34, 'west nusa tenggara': 52, 'east nusa tenggara': 53,
  'west kalimantan': 61, 'central kalimantan': 62, 'south kalimantan': 63, 'east kalimantan': 64, 'north kalimantan': 65, 'north sulawesi': 71, 'central sulawesi': 72,
  'south sulawesi': 73, 'southeast sulawesi': 74, 'west sulawesi': 76, 'north maluku': 82, 'west papua': 92, 'south papua': 93, 'central papua': 94, 'papua mountains': 95, 'southwest papua': 96,
  'daerah khusus ibukota jakarta': 31, 'daerah istimewa yogyakarta': 34, 'bangka belitung': 19, 'west java': 32, 'central java': 33, 'east java': 35, 'propinsi': 0,
};
export function kodeProv(nama) {
  const n = String(nama || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (ALIAS[n]) return ALIAS[n];
  for (const [k, v] of Object.entries(PROV)) if (v.toLowerCase() === n) return +k;
  if (n === 'dki jakarta' || n === 'dki') return 31;
  return null;
}

// ---------- parser angka ----------
// HEESI: "1,195.55" (koma ribuan, titik desimal), "-" = nol. Statistik DJK: "1.534.855" (titik ribuan), "99,99" (koma desimal).
export function angkaEn(s) {
  const t = String(s).trim();
  if (t === '-') return 0;
  if (!/^\d{1,3}(,\d{3})*(\.\d+)?$|^\d+(\.\d+)?$/.test(t)) return null;
  return Number(t.replace(/,/g, ''));
}
export function angkaId(s) {
  const t = String(s).trim();
  if (t === '-') return 0;
  if (!/^\d{1,3}(\.\d{3})*(,\d+)?$|^\d+(,\d+)?$/.test(t)) return null;
  return Number(t.replace(/\./g, '').replace(',', '.'));
}

// ---------- HEESI 6.4.9: kapasitas terpasang pembangkit per provinsi (MW) ----------
const KOLOM_649 = ['hidro', 'mini_hidro', 'mikro_hidro', 'panas_bumi', 'surya', 'bayu', 'biogas', 'biomassa']; // 8 kolom EBT bagian kiri
export function heesiTerpasang(teks) {
  const i = teks.indexOf('6.4.9 Power Plant Installed Capacity by Province', teks.indexOf('6.4.9 Power Plant Installed Capacity by Province') + 10);
  if (i < 0) throw new Error('tabel 6.4.9 tidak ditemukan');
  const blok = teks.slice(i, i + 9000).split('\n');
  const hasil = {};
  for (const l of blok) {
    const m = l.match(/^\s*(\d{2})\s{2,}(\S.*?)\s{2,}(.*)$/);
    if (!m || !PROV[+m[1]]) continue;
    const sel = m[3].trim().split(/\s+/).map((x) => angkaEn(x));
    if (sel.length !== 8 || sel.some((x) => x === null)) continue; // baris kiri saja (8 kolom EBT)
    hasil[+m[1]] = Object.fromEntries(KOLOM_649.map((k, j) => [k, sel[j]]));
  }
  return hasil;
}
// ---------- HEESI 6.5.1: panas bumi sumber daya + cadangan per provinsi (MW) ----------
export function heesiPanasBumi(teks) {
  const hasil = {};
  const re = /^\s*(\d{2})\s{2,}(?:(\S.*?)\s{2,})?([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s*$/;
  let dalam = false;
  for (const l of teks.split('\n')) {
    if (/6\.5\.1 Geothermal Resources and Reserves/.test(l)) dalam = true;
    else if (/6\.5\.2 Geothermal Power Plant Capacity/.test(l) && !/\.\.\./.test(l) && !/\s\d+\s*$/.test(l)) dalam = false;
    if (!dalam) continue;
    const m = l.match(re);
    if (!m || !PROV[+m[1]]) continue;
    const v = m.slice(3).map((x) => angkaEn(x));
    if (v.some((x) => x === null) || v[0] + v[1] + v[2] + v[3] + v[4] !== v[5]) continue; // jumlah komponen harus sama dengan Total
    hasil[+m[1]] = { spekulatif: v[0], hipotetik: v[1], mungkin: v[2], terduga: v[3], terbukti: v[4], total: v[5] };
  }
  return hasil;
}

// ---------- Statistik Ketenagalistrikan 2024, Tabel 7: rasio elektrifikasi per provinsi ----------
export function rasioElektrifikasi(teks) {
  const hasil = {}; const lepas = []; // baris angka yatim: nama provinsi tercetak terpisah oleh PDF
  const i = teks.indexOf('RASIO ELEKTRIFIKASI PER PROVINSI');
  const akhir = teks.indexOf('TOTAL INDONESIA', i);
  for (const l of teks.slice(i, akhir).split('\n')) {
    const m = l.match(/\b(\d{1,2})\s{2,}([A-Za-z][A-Za-z .]+?)\s{2,}([\d.]+|-)\s+([\d.]+|-)\s+([\d.]+)\s+(\d{2,3},\d{2})\s*$/);
    if (!m) { const n = l.match(/^\s{20,}([\d.]+|-)\s+([\d.]+|-)\s+([\d.]+)\s+(\d{2,3},\d{2})\s*$/); if (n) lepas.push(n); continue; }
    const kode = kodeProv(m[2].replace(/^Dki /i, 'DKI '));
    if (!kode) continue;
    const rt = angkaId(m[5]); const re = angkaId(m[6]);
    if (rt === null || re === null) continue;
    hasil[kode] = { rt_pln: angkaId(m[3]), rt_nonplan: angkaId(m[4]), rt_total: rt, rasio: re };
  }
  const hilang = Object.keys(PROV).filter((k) => !hasil[k]);
  if (hilang.length === 1 && lepas.length === 1) { const n = lepas[0]; hasil[hilang[0]] = { rt_pln: angkaId(n[1]), rt_nonplan: angkaId(n[2]), rt_total: angkaId(n[3]), rasio: angkaId(n[4]), catatan: 'baris dipasangkan karena nama tercetak terpisah di PDF' }; }
  return hasil;
}

// ---------- jaringan ----------
let terakhir = 0;
const robotsCache = new Map();
async function tunggu(u) {
  const d = Date.now() - terakhir;
  if (d < GAP_MS) await sleep(GAP_MS - d);
  terakhir = Date.now();
  return fetch(u, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(180000) });
}
async function robotsOk(u) {
  const { origin, pathname } = new URL(u);
  if (!robotsCache.has(origin)) {
    let tolak = [];
    try {
      const r = await tunggu(origin + '/robots.txt');
      if (r.status === 200) {
        let ua = false;
        for (const b of (await r.text()).split('\n')) {
          const m = b.match(/^\s*([a-z-]+)\s*:\s*(.*?)\s*(#.*)?$/i); if (!m) continue;
          const k = m[1].toLowerCase();
          if (k === 'user-agent') ua = m[2] === '*'; else if (ua && k === 'disallow' && m[2]) tolak.push(m[2]);
        }
      }
    } catch { /* robots tak terjangkau: perlakukan seperti tak ada */ }
    robotsCache.set(origin, tolak);
  }
  return !robotsCache.get(origin).some((p) => pathname.startsWith(p));
}
const gagal = [];
async function unduh(u, berkas, sumber) {
  const f = path.join(RAW, berkas);
  if (fs.existsSync(f) && fs.statSync(f).size > 0) return true;
  if (!(await robotsOk(u))) { gagal.push({ sumber, url: u, tanggal: HARI_INI, alasan: 'robots.txt melarang' }); return false; }
  try {
    const r = await tunggu(u);
    if (r.status === 403 || r.status === 429) { gagal.push({ sumber, url: u, tanggal: HARI_INI, alasan: 'HTTP ' + r.status + ' (berhenti, tidak dilewati)' }); return false; }
    if (r.status !== 200) { gagal.push({ sumber, url: u, tanggal: HARI_INI, alasan: 'HTTP ' + r.status }); return false; }
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    return true;
  } catch (e) { gagal.push({ sumber, url: u, tanggal: HARI_INI, alasan: String(e.message || e) }); return false; }
}
const GATRIK = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/';
const DAFTAR = [
  ['https://www.esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf', 'heesi-2025.pdf', 'HEESI 2025 (ESDM)'],
  ['https://www.esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2024.pdf', 'heesi-2024.pdf', 'HEESI 2024 (ESDM)'],
  [GATRIK + '91fa8-buku-statistik-ketenagalistrikan-2024.pdf', 'statgatrik-2024.pdf', 'Statistik Ketenagalistrikan 2024 (Ditjen Gatrik)'],
  ['https://peraturan.bpk.go.id/Download/254584/Perpres%20Nomor%2022%20Tahun%202017.pdf', 'perpres-22-2017.pdf', 'Perpres 22/2017 RUEN (BPK JDIH)'],
  ['https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv', 'owid-energy.csv', 'OWID energy-data (turunan Ember, CC BY 4.0)'],
];
async function ambil() {
  fs.mkdirSync(RAW, { recursive: true });
  for (const [u, b, s] of DAFTAR) await unduh(u, b, s);
  const reg = path.join(ROOT, 'data-panen/regulasi/regulasi.jsonl');
  if (fs.existsSync(reg)) {
    for (const r of bacaJsonl(reg)) {
      if (r.jenis !== 'perda' || !/rencana umum energi daerah/i.test(r.judul) && !/\bRUED\b/i.test(r.judul) || !r.url_pdf) continue;
      await unduh(r.url_pdf, 'rued-' + r.id + '.pdf', 'RUED ' + r.instansi_penerbit);
    }
  }
  // ASEAN
  const negara = 'IDN;VNM;PHL;THA;MYS;SGP;LAO;KHM;MMR;BRN';
  for (const ind of ['EG.ELC.ACCS.ZS', 'EG.ELC.RNEW.ZS', 'EG.USE.ELEC.KH.PC']) await unduh(`https://api.worldbank.org/v2/country/${negara}/indicator/${ind}?format=json&date=2014:2025&per_page=500`, 'wb-' + ind + '.json', 'World Bank ' + ind);
  await ambilIrena();
  if (gagal.length) fs.appendFileSync(path.join(OUT, 'gagal.jsonl'), gagal.map((g) => JSON.stringify(g)).join('\n') + '\n');
  console.error('ambil selesai; gagal:', gagal.length);
}
const IRENA_TABEL = 'https://pxweb.irena.org/api/v1/en/IRENASTAT/Power%20Capacity%20and%20Generation/Country_ELECSTAT_2026_H2_PX.px';
async function ambilIrena() {
  const f = path.join(RAW, 'irena-country.json');
  if (fs.existsSync(f)) return;
  if (!(await robotsOk(IRENA_TABEL))) { gagal.push({ sumber: 'IRENASTAT', url: IRENA_TABEL, tanggal: HARI_INI, alasan: 'robots.txt melarang' }); return; }
  const meta = await (await tunggu(IRENA_TABEL)).json();
  const v = (kode) => meta.variables.find((x) => x.code === kode);
  const negaraKode = v('Country/area').values.filter((c, i) => ['Cambodia', 'Indonesia', 'Lao PDR', 'Malaysia', 'Myanmar', 'Philippines', 'Singapore', 'Thailand', 'Viet Nam', 'Brunei Darussalam'].includes(v('Country/area').valueTexts[i]));
  const tahun = v('Year').values.slice(-12);
  const body = { query: [
    { code: 'Country/area', selection: { filter: 'item', values: negaraKode } }, { code: 'Technology', selection: { filter: 'all', values: ['*'] } },
    { code: 'Data Type', selection: { filter: 'item', values: ['1', '0'] } }, { code: 'Grid connection', selection: { filter: 'item', values: ['0'] } },
    { code: 'Year', selection: { filter: 'item', values: tahun } }], response: { format: 'json-stat2' } };
  const d = Date.now() - terakhir; if (d < GAP_MS) await sleep(GAP_MS - d); terakhir = Date.now();
  const r = await fetch(IRENA_TABEL, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(120000) });
  if (r.status !== 200) { gagal.push({ sumber: 'IRENASTAT', url: IRENA_TABEL, tanggal: HARI_INI, alasan: 'HTTP ' + r.status }); return; }
  fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
}
function teks() {
  for (const f of fs.readdirSync(RAW).filter((x) => x.endsWith('.pdf'))) {
    const t = path.join(RAW, f.replace(/\.pdf$/, '.txt'));
    if (fs.existsSync(t)) continue;
    try { execFileSync('pdftotext', ['-layout', path.join(RAW, f), t], { stdio: 'ignore' }); } catch { console.error('pdftotext gagal', f); }
  }
}

// ---------- RUED-P: kandidat target bauran EBT (heuristik, WAJIB ditinjau) ----------
export function targetRued(teks, namaProv) {
  const t = teks.replace(/\s+/g, ' ');
  const kunci = String(namaProv).toLowerCase().replace(/^(di|dki|kepulauan)\s+/, '');
  const out = [];
  for (const k of t.split(/(?<=[.;:])\s+(?=[A-Z0-9])/)) {
    if (k.length > 600 || !/(bauran|porsi|target|sasaran|kontribusi)/i.test(k) || !/(\bEBT\b|energi baru|terbarukan)/i.test(k)) continue;
    if (/nasional/i.test(k) || !k.toLowerCase().includes(kunci)) continue; // kalimat nasional atau tanpa nama provinsi bukan target daerah
    const re = /(?:tahun\s+)?(2025|2030|2050)\b[^.%]{0,60}?(\d{1,2}(?:,\d+)?)\s?(?:%|persen)|(\d{1,2}(?:,\d+)?)\s?(?:%|persen)[^.%]{0,60}?(?:tahun\s+)?(2025|2030|2050)\b/g;
    for (const m of k.matchAll(re)) out.push({ tahun: +(m[1] || m[4]), persen: Number((m[2] || m[3]).replace(',', '.')), kutipan: k.slice(0, 280) });
  }
  const seen = new Set();
  return out.filter((x) => { const s = x.tahun + '|' + x.persen; if (seen.has(s)) return false; seen.add(s); return true; });
}

// ---------- perakitan ----------
const Q = (v, satuan, tahun, s, hal) => ({ nilai: v, satuan, tahun, sumber_url: s.url, sumber: s.nama, halaman: hal || null, tanggal_periksa: HARI_INI, tingkat_bukti: 'resmi' });
const S_HEESI = { nama: 'HEESI 2025, Kementerian ESDM', url: 'https://www.esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf' };
const S_STAT = { nama: 'Statistik Ketenagalistrikan 2024, Ditjen Ketenagalistrikan ESDM', url: GATRIK + '91fa8-buku-statistik-ketenagalistrikan-2024.pdf' };
const baca = (f) => fs.readFileSync(path.join(RAW, f), 'utf8');
const ada = (f) => fs.existsSync(path.join(RAW, f));

function bangunProvinsi(gagalBaru, konflik) {
  const heesi = baca('heesi-2025.txt'); const stat = baca('statgatrik-2024.txt');
  const terpasang = heesiTerpasang(heesi); const geo = heesiPanasBumi(heesi); const re = rasioElektrifikasi(stat);
  // uji silang: jumlah provinsi per kolom vs baris Total tercetak
  const tot = heesi.slice(heesi.indexOf('6.4.9 Power Plant Installed Capacity by Province', heesi.indexOf('6.4.9 Power Plant Installed Capacity by Province') + 10)).split('\n').find((l) => /^\s*Total\s+[\d,]/.test(l));
  if (tot) {
    const cetak = tot.trim().split(/\s+/).slice(1, 9).map(angkaEn);
    KOLOM_649.forEach((k, j) => { const jml = +Object.values(terpasang).reduce((a, p) => a + p[k], 0).toFixed(2); if (Math.abs(jml - cetak[j]) > 0.5) konflik.push({ jenis: 'jumlah-provinsi-beda-total-tercetak', kolom: k, jumlah: jml, tercetak: cetak[j], sumber: S_HEESI.url }); });
  }
  const reg = fs.existsSync(path.join(ROOT, 'data-panen/regulasi/regulasi.jsonl')) ? bacaJsonl(path.join(ROOT, 'data-panen/regulasi/regulasi.jsonl')).filter((r) => r.jenis === 'perda' && (/rencana umum energi daerah/i.test(r.judul) || /\bRUED\b/i.test(r.judul))) : [];
  const rued = {};
  for (const r of reg) {
    const k = kodeProv(String(r.instansi_penerbit || '').replace(/^Pemerintah Provinsi /i, ''));
    if (k) (rued[k] ||= []).push(r);
  }
  const hasil = [];
  for (const [kode, nama] of Object.entries(PROV)) {
    const p = terpasang[kode];
    const baris = { kode: +kode, nama, jenis: 'provinsi', diperbarui: HARI_INI };
    // potensi: hanya panas bumi (Badan Geologi lewat HEESI); teknologi lain belum terbaca
    const g = geo[kode];
    baris.potensi = {
      'panas-bumi': g ? { sumber_daya_mw: g.spekulatif + g.hipotetik, cadangan_mw: g.mungkin + g.terduga + g.terbukti, total_mw: g.total, rincian: g, ...Q(g.total, 'MW', 2025, S_HEESI, 'Tabel 6.5.1 hlm 120-121 (per Desember 2025; Badan Geologi)') } : { ...Q(0, 'MW', 2025, S_HEESI, 'Tabel 6.5.1'), catatan: 'provinsi tidak tercantum di tabel sumber daya panas bumi' },
    };
    for (const t of ['surya', 'bayu', 'hidro', 'bioenergi', 'biomassa-sampah', 'laut']) baris.potensi[t] = { nilai: null, alasan_kosong: 'potensi per provinsi ada di RUEN (Perpres 22/2017) Lampiran dan RUED, tetapi lampiran berupa gambar/tabel tak terbaca otomatis; perlu entri manual dari sumber resmi', tanggal_periksa: HARI_INI };
    baris.terpasang = p ? {
      per_teknologi_mw: {
        hidro: p.hidro + p.mini_hidro + p.mikro_hidro, 'panas-bumi': p.panas_bumi, surya: p.surya, bayu: p.bayu,
        bioenergi: +(p.biogas + p.biomassa).toFixed(2),
      },
      rincian_hidro_mw: { besar: p.hidro, mini: p.mini_hidro, mikro: p.mikro_hidro },
      rincian_bioenergi_mw: { biogas: p.biogas, biomassa: p.biomassa },
      ebt_total_mw: +Object.values(p).reduce((a, b) => a + b, 0).toFixed(2),
      ...Q(+Object.values(p).reduce((a, b) => a + b, 0).toFixed(2), 'MW', 2025, S_HEESI, 'Tabel 6.4.9 hlm 118'),
      catatan: 'ebt_total_mw = jumlah kolom EBT tabel 6.4.9 (hidro, mini/mikro hidro, panas bumi, surya, bayu, biogas, biomassa); satuan MW diasumsikan dari kolom total tabel yang sama (kolom fosil bersatuan MW)',
    } : null;
    const e = re[kode];
    baris.rasio_elektrifikasi = e ? { ...Q(e.rasio, '%', 2024, S_STAT, 'Tabel 7 hlm 9'), rumah_tangga_berlistrik: e.rt_total, rumah_tangga_pln: e.rt_pln, rumah_tangga_non_pln: e.rt_nonplan } : { nilai: null, alasan_kosong: 'baris provinsi tidak terbaca', tanggal_periksa: HARI_INI };
    baris.bpp = { nilai: null, alasan_kosong: 'BPP per sistem (Kepmen ESDM) belum terambil: jdih.esdm.go.id menolak (403); lihat gagal.jsonl. Angka nasional ada di meta', tanggal_periksa: HARI_INI };
    // RUED
    const rr = rued[kode] || [];
    if (!rr.length) baris.rued = { nilai: null, alasan_kosong: 'Perda RUED provinsi ini tidak ada di data regulasi (belum dipanen atau belum terbit)', tanggal_periksa: HARI_INI };
    else {
      const terbaru = rr.sort((x, y) => (y.tahun || 0) - (x.tahun || 0))[0];
      const f = `rued-${terbaru.id}.txt`;
      const teksR = ada(f) ? baca(f) : '';
      const cand = teksR.length > 5000 ? targetRued(teksR, nama) : [];
      const per = {};
      for (const y of [2025, 2030, 2050]) {
        const v = [...new Set(cand.filter((c) => c.tahun === y).map((c) => c.persen))];
        per[y] = v.length === 1 ? v[0] : null;
      }
      baris.rued = {
        perda: `${terbaru.nomor}/${terbaru.tahun}`, url_sumber: terbaru.url_sumber, url_pdf: terbaru.url_pdf, semua_perda: rr.map((x) => `${x.nomor}/${x.tahun}`),
        target_ebt_persen: null, kandidat_seragam_per_tahun: per, kandidat: cand.slice(0, 8), ekstraksi: teksR.length > 5000 ? 'heuristik-kalimat: target_ebt_persen SENGAJA null sampai ditinjau manusia (uji menunjukkan angka nasional/skenario ikut terambil); kandidat_seragam_per_tahun hanya bila semua kutipan satu tahun berangka sama' : 'PDF tanpa lapisan teks atau tak terunduh; baca manual',
        tingkat_bukti: 'resmi', tanggal_periksa: HARI_INI, sumber_url: terbaru.url_pdf,
      };
      if (teksR.length <= 5000) gagalBaru.push({ sumber: `RUED ${nama}`, url: terbaru.url_pdf, tanggal: HARI_INI, alasan: 'PDF hasil pindai tanpa lapisan teks (pdftotext kosong) atau tak terunduh', tindak_lanjut: 'baca manual atau OCR' });
    }
    hasil.push(baris);
  }
  return hasil;
}

// ---------- ASEAN ----------
const ASEAN = { IDN: 'Indonesia', VNM: 'Viet Nam', PHL: 'Philippines', THA: 'Thailand', MYS: 'Malaysia', SGP: 'Singapore', LAO: 'Lao PDR', KHM: 'Cambodia', MMR: 'Myanmar', BRN: 'Brunei Darussalam' };
const IRENA_NAMA = { IDN: 'Indonesia', VNM: 'Viet Nam', PHL: 'Philippines', THA: 'Thailand', MYS: 'Malaysia', SGP: 'Singapore', LAO: 'Lao PDR', KHM: 'Cambodia', MMR: 'Myanmar', BRN: 'Brunei Darussalam' };
const OWID_KOLOM = ['electricity_generation', 'renewables_electricity', 'renewables_share_elec', 'solar_electricity', 'wind_electricity', 'hydro_electricity', 'biofuel_electricity', 'fossil_share_elec', 'per_capita_electricity', 'carbon_intensity_elec'];
export function irenaRingkas(d) {
  const lab = (k) => Object.values(d.dimension[k].category.label);
  const [neg, tek, jen, , thn] = d.id.map(lab);
  const n = d.size; const idx = (a, b, c, e) => ((a * n[1] + b) * n[2] + c) * n[3] * n[4] + e; // grid connection ukuran 1
  const hasil = {};
  neg.forEach((nama, a) => {
    hasil[nama] = {};
    tek.forEach((tk, b) => jen.forEach((jn, c) => {
      const deret = thn.map((y, e) => ({ tahun: +y, nilai: d.value[idx(a, b, c, e)] })).filter((x) => x.nilai != null);
      if (deret.length) (hasil[nama][jn] ||= {})[tk] = deret;
    }));
  });
  return hasil;
}
function bangunAsean(gagalBaru) {
  const owid = ada('owid-energy.csv') ? baca('owid-energy.csv').split('\n').filter(Boolean) : [];
  const hdr = owid[0] ? owid[0].split(',') : [];
  const ix = Object.fromEntries(hdr.map((h, i) => [h, i]));
  const dataOwid = {};
  for (const l of owid.slice(1)) { const c = l.split(','); if (ASEAN[c[ix.iso_code]]) (dataOwid[c[ix.iso_code]] ||= []).push(c); }
  const irena = ada('irena-country.json') ? irenaRingkas(JSON.parse(baca('irena-country.json'))) : {};
  const wb = {};
  for (const ind of ['EG.ELC.ACCS.ZS', 'EG.ELC.RNEW.ZS', 'EG.USE.ELEC.KH.PC']) {
    if (!ada(`wb-${ind}.json`)) continue;
    for (const r of JSON.parse(baca(`wb-${ind}.json`))[1] || []) if (r.value != null) ((wb[r.countryiso3code] ||= {})[ind] ||= []).push({ tahun: +r.date, nilai: r.value });
  }
  const baris = [];
  for (const [iso, nama] of Object.entries(ASEAN)) {
    const b = { iso3: iso, nama, jenis: 'negara-asean', diperbarui: HARI_INI };
    const rows = (dataOwid[iso] || []).filter((c) => +c[ix.year] >= 2014).sort((x, y) => +x[ix.year] - +y[ix.year]);
    const ambilAngka = (c, k) => (c[ix[k]] === '' || c[ix[k]] === undefined ? null : Number(c[ix[k]]));
    const lengkap = rows.filter((c) => ambilAngka(c, 'electricity_generation') != null);
    const akhir = lengkap[lengkap.length - 1];
    b.ember_via_owid = akhir ? {
      tahun_terbaru: +akhir[ix.year],
      nilai_terbaru: Object.fromEntries(OWID_KOLOM.map((k) => [k, ambilAngka(akhir, k)])),
      tren: lengkap.map((c) => ({ tahun: +c[ix.year], ...Object.fromEntries(OWID_KOLOM.map((k) => [k, ambilAngka(c, k)])) })),
      satuan: { electricity_generation: 'TWh', renewables_electricity: 'TWh', solar_electricity: 'TWh', wind_electricity: 'TWh', hydro_electricity: 'TWh', biofuel_electricity: 'TWh', renewables_share_elec: '%', fossil_share_elec: '%', per_capita_electricity: 'kWh/orang', carbon_intensity_elec: 'gCO2/kWh' },
      sumber_url: 'https://github.com/owid/energy-data', sumber: 'Our World in Data energy-data (memuat Ember Yearly Electricity Data; CC BY 4.0)', lisensi: 'CC BY 4.0', tanggal_periksa: HARI_INI, tingkat_bukti: 'terbit',
    } : { nilai: null, alasan_kosong: 'negara tidak ada di OWID', tanggal_periksa: HARI_INI };
    const ir = irena[IRENA_NAMA[iso]];
    if (ir && ir['Electrical Installed Capacity (MW)']) {
      const cap = ir['Electrical Installed Capacity (MW)'];
      b.irena = { kapasitas_terpasang_mw: Object.fromEntries(['Total Renewable', 'Total Non-Renewable', 'Solar photovoltaic', 'Onshore wind energy', 'Renewable hydropower', 'Geothermal energy', 'Solid biofuels', 'Mixed hydropower', 'Pure hydropower'].filter((k) => cap[k]).map((k) => [k, cap[k]])), satuan: 'MW', sumber_url: 'https://pxweb.irena.org/pxweb/en/IRENASTAT/IRENASTAT__Power%20Capacity%20and%20Generation/', sumber: 'IRENASTAT Renewable Energy Statistics 2026 (H2), Country_ELECSTAT', lisensi: 'IRENA data terbuka, atribusi diwajibkan', tanggal_periksa: HARI_INI, tingkat_bukti: 'resmi' };
    } else { b.irena = { nilai: null, alasan_kosong: 'negara tidak tercantum di tabel IRENASTAT Country_ELECSTAT', tanggal_periksa: HARI_INI }; gagalBaru.push({ sumber: 'IRENASTAT', url: IRENA_TABEL, tanggal: HARI_INI, alasan: `${nama} tidak ada di tabel negara`, }); }
    b.world_bank = wb[iso] ? { akses_listrik_persen: (wb[iso]['EG.ELC.ACCS.ZS'] || []).sort((x, y) => x.tahun - y.tahun), listrik_terbarukan_persen_keluaran: (wb[iso]['EG.ELC.RNEW.ZS'] || []).sort((x, y) => x.tahun - y.tahun), konsumsi_kwh_per_kapita: (wb[iso]['EG.USE.ELEC.KH.PC'] || []).sort((x, y) => x.tahun - y.tahun), sumber_url: 'https://api.worldbank.org/v2/country/' + iso, sumber: 'World Bank WDI: EG.ELC.ACCS.ZS, EG.ELC.RNEW.ZS, EG.USE.ELEC.KH.PC', lisensi: 'CC BY 4.0', tanggal_periksa: HARI_INI, tingkat_bukti: 'terbit' } : { nilai: null, alasan_kosong: 'tanpa data', tanggal_periksa: HARI_INI };
    baris.push(b);
  }
  return baris;
}

function bangun() {
  const gagalBaru = []; const konflik = [];
  const prov = bangunProvinsi(gagalBaru, konflik);
  const asean = bangunAsean(gagalBaru);
  gagalBaru.push(
    { sumber: 'Wikidata SPARQL (JM-D05, pembangkit)', url: 'https://query.wikidata.org/sparql', tanggal: HARI_INI, alasan: 'robots.txt: Disallow /sparql dan /w/ untuk agen *; tidak diambil', tindak_lanjut: 'pemilik memutuskan; panen_proyek.mjs --wikidata siap dengan WIKIDATA_IZIN_PEMILIK=1' },
    { sumber: 'Ember files host', url: 'https://files.ember-energy.org/public-downloads/', tanggal: HARI_INI, alasan: 'robots.txt: Disallow / (hanya *.pdf boleh); CSV Ember dipakai lewat OWID energy-data (CC BY 4.0)', tindak_lanjut: 'izin/ekspor manual dari ember-energy.org/data bila angka Ember asli diperlukan' },
    { sumber: 'DEN RUED provinsi / potensi', url: 'https://www.den.go.id/publikasi/rued-provinsi', tanggal: HARI_INI, alasan: 'robots.txt www.den.go.id: Disallow / untuk semua agen', tindak_lanjut: 'tidak diambil' },
    { sumber: 'BPS API', url: 'https://api.bps.go.id/', tanggal: HARI_INI, alasan: 'HTTP 403 tanpa kunci API; WebAPI BPS butuh key', tindak_lanjut: 'pemilik mendaftar key (gratis) lalu produksi/konsumsi listrik per provinsi bisa diambil' },
    { sumber: 'BPP per sistem (Kepmen ESDM)', url: 'https://jdih.esdm.go.id/', tanggal: HARI_INI, alasan: 'HTTP 403 (WAF) dan robots Allow:/Blocked; tabel BPP per sistem tidak ditemukan di sumber lain', tindak_lanjut: 'pemilik mengunduh Kepmen BPP pembangkitan terbaru manual' },
    { sumber: 'Potensi EBT per provinsi (surya, bayu, hidro, bio, laut)', url: 'https://ebtke.esdm.go.id/', tanggal: HARI_INI, alasan: 'situs EBTKE dan sidata-ebtke berupa SPA tanpa daftar berkas statis yang ditemukan (sidata-ebtke tak terjangkau); lampiran RUEN Perpres 22/2017 tak berlapis teks', tindak_lanjut: 'entri manual dari RUEN Lampiran atau Buku Potensi EBT' },
    { sumber: 'IRENASTAT', url: 'https://www.irena.org/Data', tanggal: HARI_INI, alasan: 'www.irena.org 403 untuk klien non-peramban; dipakai pxweb.irena.org (API terbuka)' },
  );
  tulis(path.join(OUT, 'provinsi.jsonl'), prov);
  tulis(path.join(OUT, 'asean.jsonl'), asean);
  const lama = fs.existsSync(path.join(OUT, 'gagal.jsonl')) ? bacaJsonl(path.join(OUT, 'gagal.jsonl')) : [];
  const kunciG = (g) => g.sumber + '|' + g.url + '|' + g.alasan;
  const gabung = new Map(); for (const g of [...lama, ...gagalBaru]) gabung.set(kunciG(g), g);
  tulis(path.join(OUT, 'gagal.jsonl'), [...gabung.values()]);
  tulis(path.join(OUT, 'konflik.jsonl'), konflik);
  const n = (f) => prov.filter(f).length;
  console.log(JSON.stringify({
    provinsi: prov.length, terpasang: n((p) => p.terpasang), rasio: n((p) => p.rasio_elektrifikasi.nilai != null), panas_bumi_potensi_positif: n((p) => p.potensi['panas-bumi'].nilai > 0),
    rued_perda: n((p) => p.rued.perda), rued_kandidat_seragam: n((p) => p.rued.kandidat_seragam_per_tahun && Object.values(p.rued.kandidat_seragam_per_tahun).some((x) => x != null)), rued_kandidat: n((p) => p.rued.kandidat?.length),
    asean: asean.length, asean_irena: asean.filter((a) => a.irena.kapasitas_terpasang_mw).length, konflik: konflik.length, gagal: gabung.size,
  }, null, 1));
}

async function main() {
  const a = new Set(process.argv.slice(2));
  if (a.has('--selftest')) return selftest();
  fs.mkdirSync(RAW, { recursive: true });
  if (a.has('--ambil')) await ambil();
  if (a.has('--teks')) teks();
  if (a.has('--bangun')) bangun();
}
function selftest() {
  assert.equal(angkaEn('1,195.55'), 1195.55); assert.equal(angkaEn('-'), 0); assert.equal(angkaEn('abc'), null);
  assert.equal(angkaId('4.332.947'), 4332947); assert.equal(angkaId('99,83'), 99.83);
  assert.equal(kodeProv('Special Region of Yogyakarta'), 34); assert.equal(kodeProv('Dki Jakarta'), 31); assert.equal(kodeProv('Papua Pegunungan'), 95); assert.equal(kodeProv('Nowhere'), null);
  assert.equal(Object.keys(PROV).length, 38);
  const t = '6.4.9 Power Plant Installed Capacity by Province 2025\n6.4.9 Power Plant Installed Capacity by Province 2025\n    11     Aceh                                  10.00        23.40        4.45          -       1.46          -            -     25.10\n';
  assert.deepEqual(heesiTerpasang(t)[11], { hidro: 10, mini_hidro: 23.4, mikro_hidro: 4.45, panas_bumi: 0, surya: 1.46, bayu: 0, biogas: 0, biomassa: 25.1 });
  const g = '6.5.1 Geothermal Resources and Reserves\n    11        Aceh                                324              159     523            25          0    1,031\n    12        X                                 1 1 1 1 1 9\n';
  assert.deepEqual(heesiPanasBumi(g)[11], { spekulatif: 324, hipotetik: 159, mungkin: 523, terduga: 25, terbukti: 0, total: 1031 });
  console.log('selftest OK');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
