#!/usr/bin/env node
// Panen sumber tambahan (R26) untuk Jaringan METI. Node stdlib + pdftotext (poppler).
//   node panen_tambahan.mjs --selftest   uji parser tanpa jaringan
//   node panen_tambahan.mjs --ambil      panen semua sumber (robots dicek, jeda >= 2 dtk), tulis keluaran + gagal
// Keluaran (data-panen/, tidak masuk repo):
//   karbon/climatetrace.jsonl  Climate TRACE sektor listrik Indonesia per fasilitas (CC BY 4.0)
//   karbon/idxcarbon.jsonl     IDXCarbon laporan bulanan resmi (ringkasan perdagangan)
//   wilayah/atlas.jsonl        Global Solar Atlas per provinsi (titik ibu kota provinsi; angin TIDAK ada, lihat gagal)
//   angka/outlook.jsonl        angka kunci IESR IETO 2026 (deck presentasi) dengan nomor halaman
//   tambahan_gagal.jsonl       sumber yang tidak bisa/ tidak boleh diambil, beserta alasan
// Aturan: UA jujur, jeda >= 2 dtk, robots dicek, 403/429 berhenti, tanpa login/formulir/CAPTCHA. Nilai tanpa sumber TIDAK diisi.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const GAP_MS = 2200;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DP = path.join(ROOT, 'data-panen');
const HARI_INI = process.env.TANGGAL_AMBIL || new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tulis = (f, rows) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''), 'utf8'); };

// ---------- parser murni (diuji --selftest) ----------
const BARIS_IDX = [
  ['proyek_terdaftar', /No\. of Listed Project\s+([\d,]+)/],
  ['unit_tersedia_tco2e', /Available Carbon Unit\s+ton CO2e\s+([\d,]+)/],
  ['unit_pensiun_tco2e', /Retired Carbon Unit\s+ton CO2e\s+([\d,]+)/],
  ['hari_bursa', /No\. of Trading Days\s+([\d,]+)/],
  ['volume_tco2e', /Total Volume\s+ton CO2e\s+([\d,]+)/],
  ['nilai_idr', /Total Value\s+IDR\s+([\d,]+)/],
  ['frekuensi', /Total Frequency\s+times\s+([\d,]+)/],
  ['volume_ytd_tco2e', /Total Volume \(YTD\)\s+ton CO2e\s+([\d,]+)/],
  ['nilai_ytd_idr', /Total Value \(YTD\)\s+IDR\s+([\d,]+)/],
  ['frekuensi_ytd', /Total Frequency \(YTD\)\s+times\s+([\d,]+)/],
  ['peserta', /No\. of Participant\s+([\d,]+)/],
];
export function idxRingkasan(teks) {
  const out = {};
  for (const [k, re] of BARIS_IDX) { const m = teks.match(re); out[k] = m ? Number(m[1].replace(/,/g, '')) : null; }
  return out.volume_tco2e === null ? null : out;
}
export function tautanBulanan(html) { // [{bulan, url}] dari tabel Data Bulanan IDXCarbon
  const hasil = [];
  for (const tr of html.split(/<tr\b/i)) {
    const b = tr.match(/<td[^>]*>\s*((?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember) \d{4})\s*<\/td>/i);
    const u = tr.match(/href="(https?:\/\/[^"]*document\/share\/[^"]+)"/i);
    if (b && u) hasil.push({ bulan: b[1], url: u[1] });
  }
  return hasil;
}
const BLN = { januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06', juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12' };
export const bulanIso = (s) => { const [b, t] = s.toLowerCase().split(' '); return BLN[b] ? `${t}-${BLN[b]}` : null; };

export function barisClimateTrace(a, tahun, urlApi) {
  const e = (a.EmissionsSummary || []).find((x) => x.Gas === 'co2e_100yr');
  const c = a.Centroid && a.Centroid.Geometry;
  if (!e || !c) return null;
  return {
    id: 'ct_' + a.Id, nama: a.Name, negara: a.Country, jenis_aset: a.AssetType, sektor_sumber: a.Sector,
    kapasitas_mw: e.Capacity ?? null, aktivitas_mwh: e.Activity ?? null, faktor_kapasitas_mwh_per_mw: e.CapacityFactor ?? null,
    emisi_tco2e: e.EmissionsQuantity ?? null, faktor_emisi_tco2e_per_mwh: e.EmissionsFactor ?? null, tahun,
    pemilik: (a.Owners || []).map((o) => o.CompanyName), lon: c[0], lat: c[1],
    sumber: 'Climate TRACE v6 API', sumber_url: urlApi, tanggal_periksa: HARI_INI, lisensi: 'CC BY 4.0',
    tingkat_bukti: 'via-pihak-ketiga', catatan: 'estimasi berbasis satelit/model Climate TRACE, bukan laporan resmi operator',
  };
}

// angka kunci IETO: tiap entri diverifikasi terhadap teks halaman PDF (frasa wajib ada), lalu halamannya dicatat
export const ANGKA_IETO = [
  { halaman: 4, kunci: /100% RE\s+in 2035 is not reflected/, indikator: 'target_ebt_2035_presiden_tak_ada_di_dokumen_formal', nilai: null, satuan: null, teks: 'Pernyataan Presiden tentang 100% EBT pada 2035 tidak tercermin dalam dokumen perencanaan formal mana pun (menurut IESR).' },
  { halaman: 4, kunci: /1\.5°C.*2\.0°C[\s\S]*2038[\s\S]*2044/, indikator: 'anggaran_karbon_habis', nilai: 'tahun-habis: 1.5C 2038, 2.0C 2044', satuan: 'tahun', teks: 'Anggaran karbon 1,5 derajat C habis secepat 2038 dan 2,0 derajat C secepat 2044, berdasar proyeksi emisi energi SNDC terbaru.' },
  { halaman: 6, kunci: /from 13\.1% to 11\.5%/, indikator: 'porsi_ebt_pembangkitan_on_grid', nilai: '13,1 (2020) ke 11,5 (2024)', satuan: 'persen', teks: 'Porsi EBT dalam bauran pembangkitan on-grid turun dari 13,1% (2020) ke 11,5% (2024), meleset dari target RUPTL 2021-2030.' },
  { halaman: 9, kunci: /316\.1 MtCO/, indikator: 'mitigasi_emisi_industri_2025_2050', nilai: 316.1, satuan: 'MtCO2e', teks: 'Peta Jalan Dekarbonisasi Industri Kemenperin: total emisi yang dimitigasi di sembilan sektor prioritas 2025-2050 sebesar 316,1 MtCO2e.' },
  { halaman: 9, kunci: /USD 260 billion/, indikator: 'kebutuhan_investasi_dekarbonisasi_industri_2025_2050', nilai: 260, satuan: 'miliar USD', teks: 'Kebutuhan investasi dekarbonisasi industri 2025-2050 diperkirakan sekitar USD 260 miliar.' },
  { halaman: 18, kunci: /USD\s*21\.4\s*B[\s\S]*JETP|JETP[\s\S]*USD\s*21\.4\s*B/, indikator: 'komitmen_internasional_jetp', nilai: 21.4, satuan: 'miliar USD', teks: 'Komitmen dukungan internasional JETP USD 21,4 miliar (angka batang pembanding; realisasi per tahun di grafik tidak diambil karena label tidak terbaca dari teks).' },
];
export function angkaOutlook(halamanTeks, sumberUrl) {
  const out = [];
  for (const a of ANGKA_IETO) {
    const t = halamanTeks[a.halaman - 1] || '';
    if (!a.kunci.test(t)) { out.push({ galat: `halaman ${a.halaman} tidak memuat penanda ${a.indikator}` }); continue; }
    out.push({
      id: 'ieto2026_' + a.indikator, laporan: 'IESR Indonesia Energy Transition Outlook (IETO) 2026, deck presentasi', penerbit: 'IESR', indikator: a.indikator,
      nilai: a.nilai, satuan: a.satuan, teks: a.teks, halaman: a.halaman, sumber_url: sumberUrl, tanggal_terbit: '2025-11-20', tanggal_periksa: HARI_INI,
      lisensi: 'hak cipta IESR; hanya angka kunci dan ringkasan, dikutip dengan atribusi', tingkat_bukti: 'via-pihak-ketiga',
    });
  }
  return out;
}

// ibu kota provinsi (koordinat pendekatan, derajat desimal) sebagai titik sampel Global Solar Atlas
export const IBUKOTA = {
  11: ['Aceh', 5.55, 95.32], 12: ['Sumatera Utara', 3.59, 98.67], 13: ['Sumatera Barat', -0.95, 100.35], 14: ['Riau', 0.51, 101.45], 15: ['Jambi', -1.61, 103.61],
  16: ['Sumatera Selatan', -2.99, 104.76], 17: ['Bengkulu', -3.80, 102.26], 18: ['Lampung', -5.43, 105.26], 19: ['Kepulauan Bangka Belitung', -2.13, 106.11],
  21: ['Kepulauan Riau', 0.92, 104.45], 31: ['DKI Jakarta', -6.21, 106.85], 32: ['Jawa Barat', -6.91, 107.61], 33: ['Jawa Tengah', -6.99, 110.42],
  34: ['DI Yogyakarta', -7.80, 110.36], 35: ['Jawa Timur', -7.26, 112.75], 36: ['Banten', -6.12, 106.15], 51: ['Bali', -8.65, 115.22],
  52: ['Nusa Tenggara Barat', -8.58, 116.12], 53: ['Nusa Tenggara Timur', -10.18, 123.61], 61: ['Kalimantan Barat', -0.03, 109.33], 62: ['Kalimantan Tengah', -2.21, 113.92],
  63: ['Kalimantan Selatan', -3.32, 114.59], 64: ['Kalimantan Timur', -0.50, 117.15], 65: ['Kalimantan Utara', 2.84, 117.37], 71: ['Sulawesi Utara', 1.47, 124.84],
  72: ['Sulawesi Tengah', -0.90, 119.87], 73: ['Sulawesi Selatan', -5.15, 119.43], 74: ['Sulawesi Tenggara', -3.97, 122.51], 75: ['Gorontalo', 0.54, 123.06],
  76: ['Sulawesi Barat', -2.68, 118.89], 81: ['Maluku', -3.70, 128.18], 82: ['Maluku Utara', 0.79, 127.38], 91: ['Papua', -2.53, 140.72],
  92: ['Papua Barat', -0.87, 134.08], 93: ['Papua Selatan', -8.49, 140.40], 94: ['Papua Tengah', -3.36, 135.50], 95: ['Papua Pegunungan', -4.10, 138.95], 96: ['Papua Barat Daya', -0.88, 131.26],
};
export function barisAtlas(kode, j, url) {
  const a = j && j.annual && j.annual.data;
  if (!a || typeof a.PVOUT_csi !== 'number') return null;
  const [nama, lat, lon] = IBUKOTA[kode];
  return {
    kode, provinsi: nama, titik: 'ibu kota provinsi (pendekatan)', lat, lon,
    surya_pvout_kwh_per_kwp_tahun: Math.round(a.PVOUT_csi), ghi_kwh_per_m2_tahun: Math.round(a.GHI), dni_kwh_per_m2_tahun: Math.round(a.DNI),
    gti_optimal_kwh_per_m2_tahun: Math.round(a.GTI_opta), sudut_optimal_derajat: a.OPTA ?? null, suhu_udara_c: a.TEMP ?? null,
    angin_kecepatan_ms: null, angin_rapat_daya_w_per_m2: null,
    sumber: 'Global Solar Atlas 2.0 (Solargis, World Bank/ESMAP), jangka panjang rata-rata', sumber_url: url, tanggal_periksa: HARI_INI, lisensi: 'CC BY 4.0',
    tingkat_bukti: 'via-pihak-ketiga', catatan: 'nilai satu titik (ibu kota), BUKAN rata-rata luas provinsi; pakai sebagai indikasi relatif',
  };
}

// ---------- jaringan ----------
let terakhir = 0;
const gagal = [];
const robotsCache = new Map();
async function tunggu(u, opsi = {}) {
  const d = Date.now() - terakhir;
  if (d < GAP_MS) await sleep(GAP_MS - d);
  terakhir = Date.now();
  return fetch(u, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(opsi.timeout || 60000) });
}
async function robotsOk(u) {
  const { origin, pathname } = new URL(u);
  if (!robotsCache.has(origin)) {
    const tolak = [];
    try {
      const r = await tunggu(origin + '/robots.txt', { timeout: 20000 });
      if (r.status === 200 && /text\/plain|^null$/.test(r.headers.get('content-type') || 'null')) {
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
const catatGagal = (sumber, url, alasan) => gagal.push({ sumber, url, tanggal: HARI_INI, alasan });
async function ambilTeks(u, sumber, tipe = 'text') {
  if (!(await robotsOk(u))) { catatGagal(sumber, u, 'robots.txt melarang'); return null; }
  try {
    let r = await tunggu(u);
    for (let i = 0; i < 2 && r.status !== 200 && r.status !== 403 && r.status !== 429; i++) { await sleep(6000); r = await tunggu(u); } // IDXCarbon kadang 404 sesaat
    if (r.status === 403 || r.status === 429) { catatGagal(sumber, u, 'HTTP ' + r.status + ' (berhenti, tidak dilewati)'); return null; }
    if (r.status !== 200) { catatGagal(sumber, u, 'HTTP ' + r.status); return null; }
    return tipe === 'json' ? await r.json() : tipe === 'buf' ? Buffer.from(await r.arrayBuffer()) : await r.text();
  } catch (e) { catatGagal(sumber, u, String(e.cause?.code || e.message || e)); return null; }
}
const pdfTeks = (buf, nama) => {
  const f = path.join(DP, 'karbon/raw', nama);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, buf);
  return execFileSync('pdftotext', ['-layout', f, '-'], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
};

async function climateTrace() {
  const rows = []; const tahun = 2024;
  for (let off = 0; off < 2000; off += 100) {
    const u = `https://api.climatetrace.org/v6/assets?sectors=power&countries=IDN&limit=100&offset=${off}&year=${tahun}`;
    const j = await ambilTeks(u, 'Climate TRACE', 'json');
    if (!j || !Array.isArray(j.assets)) break;
    for (const a of j.assets) { const b = barisClimateTrace(a, tahun, u); if (b) rows.push(b); }
    if (j.assets.length < 100) break;
  }
  tulis(path.join(DP, 'karbon/climatetrace.jsonl'), rows);
  return rows.length;
}
async function idxcarbon() {
  const hal = 'https://idxcarbon.co.id/id/data-monthly';
  const html = await ambilTeks(hal, 'IDXCarbon');
  if (!html) return 0;
  const rows = [];
  for (const { bulan, url } of tautanBulanan(html)) {
    const buf = await ambilTeks(url, 'IDXCarbon laporan ' + bulan, 'buf');
    if (!buf) continue;
    let ring;
    try { ring = idxRingkasan(pdfTeks(buf, 'idx-' + bulanIso(bulan) + '.pdf')); } catch (e) { catatGagal('IDXCarbon laporan ' + bulan, url, 'pdftotext: ' + e.message); continue; }
    if (!ring) { catatGagal('IDXCarbon laporan ' + bulan, url, 'ringkasan perdagangan tidak terbaca (format PDF berbeda)'); continue; }
    rows.push({ id: 'idxc_' + bulanIso(bulan), periode: bulanIso(bulan), ...ring, sumber: 'IDXCarbon, Monthly Report (Carbon Market Trading Summary)', sumber_url: url, halaman_sumber: hal, tanggal_periksa: HARI_INI, lisensi: 'data publik Bursa Efek Indonesia; dikutip dengan atribusi', tingkat_bukti: 'resmi' });
  }
  tulis(path.join(DP, 'karbon/idxcarbon.jsonl'), rows);
  return rows.length;
}
async function atlas() {
  const rows = [];
  for (const kode of Object.keys(IBUKOTA)) {
    const [, lat, lon] = IBUKOTA[kode];
    const u = `https://api.globalsolaratlas.info/data/lta?loc=${lat},${lon}`;
    const j = await ambilTeks(u, 'Global Solar Atlas', 'json');
    if (!j) { if (gagal.filter((g) => g.sumber === 'Global Solar Atlas').length >= 3) break; continue; }
    const b = barisAtlas(+kode, j, `https://globalsolaratlas.info/map?c=${lat},${lon},9&s=${lat},${lon}`);
    if (b) rows.push(b);
  }
  tulis(path.join(DP, 'wilayah/atlas.jsonl'), rows);
  return rows.length;
}
async function outlook() {
  const u = 'https://iesr.or.id/wp-content/uploads/2025/12/Presentasi-Indonesia-Energy-Transition-Outlook-IETO-2026-IESR.pdf';
  const buf = await ambilTeks(u, 'IESR IETO 2026', 'buf');
  if (!buf) return 0;
  const hal = pdfTeks(buf, 'ieto-2026.pdf').split('\f');
  const hasil = angkaOutlook(hal, u);
  for (const h of hasil.filter((x) => x.galat)) catatGagal('IESR IETO 2026', u, h.galat);
  const rows = hasil.filter((x) => !x.galat);
  tulis(path.join(DP, 'angka/outlook.jsonl'), rows);
  return rows.length;
}
// sumber yang diperiksa tetapi tidak bisa diambil secara sah; dicatat dengan bukti pemeriksaan hari ini
async function periksaTertutup() {
  if (!(await robotsOk('https://geoportal.esdm.go.id/arcgis/rest/services'))) catatGagal('ESDM Geoportal / One Map', 'https://geoportal.esdm.go.id/robots.txt', 'robots.txt: Disallow / untuk semua agen; REST ArcGIS /arcgis dan /server juga 404; tidak diambil');
  if (!(await robotsOk('https://den.go.id/'))) catatGagal('DEN Outlook Energi Indonesia', 'https://den.go.id/robots.txt', 'robots.txt: Disallow / untuk semua agen; tidak diambil');
  try {
    const r = await tunggu('https://api-pddikti.kemdiktisaintek.go.id/', { timeout: 20000 });
    catatGagal('PDDikti', 'https://api-pddikti.kemdiktisaintek.go.id/', `API HTTP ${r.status} (butuh kunci/sesi); situs web melarang /search/ dan /hasil-pp di robots.txt; tidak ada jalur publik tanpa login`);
  } catch (e) { catatGagal('PDDikti', 'https://api-pddikti.kemdiktisaintek.go.id/', String(e.cause?.code || e.message)); }
  try { await tunggu('https://srn.menlhk.go.id/robots.txt', { timeout: 15000 }); } catch (e) { catatGagal('SRN PPI KLHK', 'https://srn.menlhk.go.id/', `${e.cause?.code || e.message}; SRN PPI digantikan SRUK (POJK 10/2026) dan registri butuh login`); }
  try { await tunggu('https://nswi.bkpm.go.id/data_statistik', { timeout: 15000 }); catatGagal('BKPM realisasi investasi per provinsi', 'https://nswi.bkpm.go.id/data_statistik', 'terjangkau tetapi tidak diperiksa lebih lanjut'); } catch (e) { catatGagal('BKPM realisasi investasi per provinsi', 'https://nswi.bkpm.go.id/data_statistik', `${e.cause?.code || e.message}; situs bkpm.go.id memuat tabel lewat skrip dinamis tanpa berkas PDF/CSV; rincian provinsi x sektor listrik tak ditemukan di rilis publik`); }
  catatGagal('Global Wind Atlas', 'https://globalwindatlas.info/', 'tidak ada API publik terdokumentasi; endpoint tebakan HTTP 400 / timeout; unduhan GeoTIFF negara (ratusan MB) butuh pengolahan raster di luar lingkup; kolom angin atlas.jsonl dikosongkan');
}

async function ambil() {
  const hasil = {};
  hasil.climatetrace = await climateTrace();
  hasil.idxcarbon = await idxcarbon();
  hasil.atlas = await atlas();
  hasil.outlook = await outlook();
  await periksaTertutup();
  tulis(path.join(DP, 'tambahan_gagal.jsonl'), gagal);
  console.log(JSON.stringify({ baris: hasil, gagal: gagal.length }));
}

function selftest() {
  assert.equal(idxRingkasan('Total Volume   ton CO2e   2,928   1,009\nTotal Value   IDR  232,544,000  66,950,000\nNo. of Listed Project  10  10').volume_tco2e, 2928);
  assert.equal(idxRingkasan('Total Volume (YTD)   ton CO2e   169,404   166,476\nTotal Volume   ton CO2e   2,928').volume_tco2e, 2928);
  assert.equal(idxRingkasan('tidak ada'), null);
  assert.deepEqual(tautanBulanan('<tr><td>1</td><td style="x">Oktober 2026</td><td><a href="https://www.idxcarbon.co.id/document/share/189/abc">x</a></td></tr>'), [{ bulan: 'Oktober 2026', url: 'https://www.idxcarbon.co.id/document/share/189/abc' }]);
  assert.equal(bulanIso('Oktober 2026'), '2026-10');
  const ct = barisClimateTrace({ Id: 1, Name: 'X', Country: 'IDN', AssetType: 'coal', Sector: 's', EmissionsSummary: [{ Gas: 'co2e_100yr', Capacity: 10, Activity: 5, EmissionsQuantity: 7 }], Centroid: { Geometry: [110, -6] } }, 2024, 'u');
  assert.equal(ct.lat, -6); assert.equal(ct.emisi_tco2e, 7);
  assert.equal(barisClimateTrace({ Id: 2, EmissionsSummary: [] }, 2024, 'u'), null);
  const at = barisAtlas(31, { annual: { data: { PVOUT_csi: 1312.67, GHI: 1641.3, DNI: 855.1, GTI_opta: 1655.98, OPTA: 9, TEMP: 26.4 } } }, 'u');
  assert.equal(at.surya_pvout_kwh_per_kwp_tahun, 1313); assert.equal(at.angin_kecepatan_ms, null);
  assert.equal(Object.keys(IBUKOTA).length, 38);
  assert.equal(angkaOutlook(['x'], 'u').every((x) => x.galat), true);
  console.log('selftest ok');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else if (process.argv.includes('--ambil')) await ambil();
  else console.log('pakai --selftest atau --ambil');
}
