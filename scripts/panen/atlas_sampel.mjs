#!/usr/bin/env node
// Sampel potensi surya (PVOUT, kWh/kWp/tahun; Global Solar Atlas, CC BY 4.0) dan angin 100 m (m/s; Global Wind Atlas, CC BY 4.0)
// di tiap gardu kembaran + statistik per provinsi -> data/kembaran/atlas.json. Pakai gdallocationinfo (GDAL CLI), tanpa dependensi repo.
// Berkas mentah dari scripts/panen/atlas_unduh.py. Provinsi: grid 0.05 derajat (~5,5 km) di dalam poligon public/geo/provinsi.json
// (disederhanakan): rata-rata dan persentil titik grid, BUKAN rata-rata raster penuh. Gardu: nilai piksel di koordinat gardu OSM.
// Pakai: node scripts/panen/atlas_sampel.mjs <dirMentah/atlas> [tanggalAmbil]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { siapProv, provDi, provDekat } from '../pipa/graf_jaringan.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const LAPIS = { pvout: { f: 'GSA_PVOUT.tif', min: 300, maks: 2600, d: 0, px: 0.0083333333 }, angin: { f: 'IDN_wind-speed_100m.tif', min: 0.05, maks: 40, d: 2, px: 0.0025 } };
const R = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
export function sampel(lapis, titik, dir) { // titik [[x,y]] -> nilai | null (di luar raster, nodata, atau di luar rentang wajar)
  const r = spawnSync('gdallocationinfo', ['-valonly', '-wgs84', path.join(dir, LAPIS[lapis].f)], { input: titik.map(([x, y]) => x + ' ' + y).join('\n') + '\n', maxBuffer: 1 << 28, encoding: 'utf8' });
  if (r.status !== 0) throw new Error('gdallocationinfo gagal: ' + r.stderr);
  const out = r.stdout.split('\n'); if (out.length < titik.length) throw new Error(`gdallocationinfo mengembalikan ${out.length} baris untuk ${titik.length} titik`);
  return titik.map((_, i) => { const v = parseFloat(out[i]); return Number.isFinite(v) && v >= LAPIS[lapis].min && v <= LAPIS[lapis].maks ? R(v, LAPIS[lapis].d) : null; });
}
export const median = (a) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; };
export const darat = (idx, x, y) => !!(provDi(idx, x, y) || provDekat(idx, x, y, 1000)); // poligon provinsi disederhanakan: toleransi 1 km dari titik poligon
export function sampelDarat(lapis, gardu /* [{x,y}] */, idx, dir) { // median piksel 3x3 yang jatuh di darat; tanpa piksel darat -> null
  const px = LAPIS[lapis].px, off = [-1, 0, 1], titik = [], milik = [];
  gardu.forEach((g, i) => { for (const a of off) for (const b of off) { const x = R(g.x + a * px, 5), y = R(g.y + b * px, 5); if (darat(idx, x, y)) { titik.push([x, y]); milik.push(i); } } });
  const v = sampel(lapis, titik, dir), per = gardu.map(() => []); v.forEach((x, j) => per[milik[j]].push(x));
  return per.map((a) => { const m = median(a); return m == null ? null : R(m, LAPIS[lapis].d); });
}
const kuantil = (a, q) => a[Math.min(a.length - 1, Math.floor(q * a.length))];
const ringkas = (v, d) => { const a = v.filter((x) => x != null).sort((x, y) => x - y); return a.length ? { n: a.length, rata: R(a.reduce((s, x) => s + x, 0) / a.length, d), p10: kuantil(a, 0.1), p50: kuantil(a, 0.5), p90: kuantil(a, 0.9) } : null; };
const [dir, tgl = '2026-11-25'] = process.argv.slice(2);
if (process.argv[1] === fileURLToPath(import.meta.url)) {
if (!dir) { console.log('pakai: atlas_sampel.mjs <dirMentah/atlas> [YYYY-MM-DD]'); process.exit(1); }
const gi = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/geo/kembaran.json'), 'utf8')).gi;
const idx = siapProv(JSON.parse(fs.readFileSync(path.join(ROOT, 'public/geo/provinsi.json'), 'utf8')));
const STEP = 0.05, grid = new Map(idx.map((p) => [p.kode, []]));
for (let y = -11.5; y <= 6.5; y += STEP) for (let x = 94.5; x <= 141.5; x += STEP) { const px = R(x, 4), py = R(y, 4), p = provDi(idx, px, py); if (p) grid.get(p.kode).push([px, py]); }
const gardu = {}, prov = {}, semua = [...grid].filter(([, t]) => t.length), flat = semua.flatMap(([, t]) => t);
for (const l of Object.keys(LAPIS)) {
  const vg = sampelDarat(l, gi, idx, dir); gi.forEach((g, i) => { (gardu[g.id] ??= [null, null])[l === 'pvout' ? 0 : 1] = vg[i]; });
  const v = sampel(l, flat, dir); let o = 0; for (const [k, t] of semua) { (prov[k] ??= {})[l] = ringkas(v.slice(o, o + t.length), LAPIS[l].d); o += t.length; }
}
const sumber = [
  { id: 'gsa-pvout', judul: 'Global Solar Atlas 2.0 (World Bank Group, Solargis): potensi listrik PV (PVOUT) rata-rata jangka panjang, kWh/kWp per tahun, Indonesia (1999-2018 Sumatera dan sekitarnya, 2007-2018 pulau lain), resolusi 30 detik busur', penerbit: 'World Bank Group / Solargis', url: 'https://globalsolaratlas.info/download/indonesia', lisensi: 'CC BY 4.0', tanggal_data: '2019', tanggal_ambil: tgl },
  { id: 'gwa-100m', judul: 'Global Wind Atlas (DTU Wind Energy, World Bank Group): kecepatan angin rata-rata 100 m (m/s), GeoTIFF negara Indonesia, resolusi 250 m', penerbit: 'DTU Wind Energy / World Bank Group', url: 'https://globalwindatlas.info/en/download/gis-files', lisensi: 'CC BY 4.0', tanggal_data: null, tanggal_ambil: tgl },
];
const hasil = { meta: { tanggal_ambil: tgl, grid_derajat: STEP, satuan: { pvout: 'kWh/kWp/tahun', angin: 'm/s pada 100 m' }, catatan: 'Provinsi: sampel grid 0,05 derajat di dalam poligon yang disederhanakan (bukan rata-rata raster penuh; pesisir bisa terpotong). Gardu: median piksel 3x3 yang berada di darat (poligon provinsi, toleransi 1 km); tanpa piksel darat = null. null = di luar raster atau nodata. PVOUT adalah potensi PV teoretis, bukan produksi terukur.', gardu_disampel: gi.length, provinsi_disampel: semua.length }, sumber, gardu, provinsi: Object.fromEntries(Object.entries(prov).sort(([a], [b]) => (a < b ? -1 : 1))) };
fs.writeFileSync(path.join(ROOT, 'data/kembaran/atlas.json'), JSON.stringify(hasil) + '\n');
console.log('data/kembaran/atlas.json', gi.length, 'gardu', semua.length, 'provinsi', flat.length, 'titik grid');
}
