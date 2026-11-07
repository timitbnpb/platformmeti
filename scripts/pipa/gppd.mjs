// Global Power Plant Database (WRI, CC BY 4.0), baris Indonesia -> public/data/gppd.json, dicocokkan ke proyek.json.
// Pakai: node scripts/pipa/gppd.mjs --ambil  (unduh sekali dari GitHub WRI ke data-panen/gppd.csv)  |  tanpa flag: bangun dari berkas lokal.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cocokkan, siapkanProyek } from './cocok_proyek.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CSV = path.join(ROOT, 'data-panen/gppd.csv');
const URL_CSV = 'https://raw.githubusercontent.com/wri/global-power-plant-database/master/output_database/global_power_plant_database.csv';
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const BAHAN = { Solar: 'solar', Wind: 'wind', Hydro: 'hydro', Geothermal: 'geothermal', Biomass: 'biomass', Waste: 'waste', Coal: 'coal', Gas: 'gas', Oil: 'diesel', Nuclear: 'nuclear' };

export function parseCsv(teks) { // RFC4180 sederhana (kutip ganda, koma, baris baru dalam kutip)
  const rows = []; let r = [], f = '', q = false;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (q) { if (c === '"') { if (teks[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { r.push(f); f = ''; }
    else if (c === '\n') { r.push(f.replace(/\r$/, '')); rows.push(r); r = []; f = ''; }
    else f += c;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  const [h, ...d] = rows; return d.filter((x) => x.length === h.length).map((x) => Object.fromEntries(h.map((k, i) => [k, x[i]])));
}
const angka = (v) => (v === '' || v == null || isNaN(+v) ? null : +v);

export function bangun(teksCsv, proyek, tanggal) {
  const daftar = siapkanProyek(proyek);
  const baris = parseCsv(teksCsv).filter((r) => r.country === 'IDN').map((r) => {
    const tek = BAHAN[r.primary_fuel] || r.primary_fuel.toLowerCase();
    const c = cocokkan({ nama: r.name, lat: +r.latitude, lng: +r.longitude, tek }, daftar);
    const gen = {}; for (let y = 2013; y <= 2019; y++) { const v = angka(r['generation_gwh_' + y]); if (v != null) gen[y] = v; }
    return {
      id: r.gppd_idnr, nama: r.name, bahan_bakar: r.primary_fuel, kapasitas_mw: angka(r.capacity_mw), lat: +r.latitude, lng: +r.longitude,
      tahun_operasi: angka(r.commissioning_year), pemilik: r.owner || null, pembangkitan_gwh: gen, sumber_data: r.source || null, url_sumber: r.url || null,
      proyek_id: c?.proyek_id ?? null, kecocokan: c?.kecocokan ?? null, jarak_km: c?.jarak_km ?? null,
    };
  });
  return {
    lapis: 'publik',
    sumber: [{ id: 'gppd', judul: 'Global Power Plant Database v1.3.0 (baris IDN)', penerbit: 'World Resources Institute', tahun: 2021, url: 'https://github.com/wri/global-power-plant-database', lisensi: 'CC BY 4.0' }],
    meta: {
      diperbarui: tanggal, jumlah: baris.length, tertaut_proyek: baris.filter((b) => b.proyek_id).length,
      celah: ['GPPD berhenti di v1.3.0 (2021): tidak memuat pembangkit baru sesudahnya.', 'Tidak ada baris surya/bayu untuk Indonesia di GPPD; hanya batubara, gas, minyak, panas bumi, hidro.', 'Pembangkitan hanya 2013-2019 dan sebagian estimasi WRI tidak disertakan.', 'Proyek METI berpresisi provinsi/kabupaten hanya cocok lewat nama (kecocokan "nama-saja", lemah).'],
    },
    baris,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--ambil')) {
    const r = await fetch(URL_CSV, { headers: { 'User-Agent': UA } }); if (!r.ok) throw new Error('GPPD ' + r.status);
    fs.mkdirSync(path.dirname(CSV), { recursive: true }); fs.writeFileSync(CSV, await r.text());
  }
  const proyek = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/proyek.json'), 'utf8')).baris;
  const out = bangun(fs.readFileSync(CSV, 'utf8'), proyek, fs.statSync(CSV).mtime.toISOString().slice(0, 10));
  fs.writeFileSync(path.join(ROOT, 'public/data/gppd.json'), JSON.stringify(out) + '\n');
  console.error('baris', out.meta.jumlah, 'tertaut', out.meta.tertaut_proyek);
}
