// Pembangkitan listrik Indonesia per sumber dari Ember (CC BY 4.0) -> public/data/ember_bulanan.json.
// Berkas bulanan global Ember TIDAK memuat Indonesia (diperiksa 2026-11-07: tak ada ISO IDN), jadi resolusi = tahunan 2015-terbaru
// dari berkas yearly publik. Bila bulanan kelak memuat IDN, tambahkan baris resolusi "bulanan" (bidang `bulan`).
// Pakai: node scripts/pipa/ember_bulanan.mjs --ambil | tanpa flag (dari data-panen/ember_tahunan.csv)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './gppd.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CSV = path.join(ROOT, 'data-panen/ember_tahunan.csv');
const URL_TAHUNAN = 'https://files.ember-energy.org/public-downloads/generation/outputs/release_generation_yearly_global.csv';
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const n = (v) => (v === '' || v == null || isNaN(+v) ? null : +v);

export function bangun(teksCsv, tanggal) {
  const baris = parseCsv(teksCsv).filter((r) => r['ISO 3 code'] === 'IDN' && +r.Year >= 2015 && r['Area type'] === 'Country or economy' && r['Is aggregated source'] === 'False' || (r['ISO 3 code'] === 'IDN' && +r.Year >= 2015 && r['Electricity source'] === 'Total generation'))
    .map((r) => ({ tahun: +r.Year, sumber_listrik: r['Electricity source'], agregat: r['Is aggregated source'] === 'True', generasi_twh: n(r['Generation (TWh)']), porsi_persen: n(r['Share of generation (%)']), kapasitas_gw: n(r['Capacity (GW)']), emisi_mtco2e: n(r['Emissions (MtCO2e)']), sumber_id: 'ember-tahunan' }))
    .sort((a, b) => a.tahun - b.tahun || a.sumber_listrik.localeCompare(b.sumber_listrik));
  const tahun = baris.map((b) => b.tahun);
  return {
    lapis: 'publik', resolusi: 'tahunan',
    sumber: [{ id: 'ember-tahunan', judul: 'Ember Yearly Electricity Data (release_generation_yearly_global), baris Indonesia', penerbit: 'Ember', tahun: Math.max(...tahun), url: 'https://ember-energy.org/data/yearly-electricity-data/', lisensi: 'CC BY 4.0' }],
    meta: {
      diperbarui: tanggal, jumlah: baris.length, tahun_awal: Math.min(...tahun), tahun_akhir: Math.max(...tahun),
      celah: ['Bulanan tidak tersedia untuk Indonesia: berkas bulanan Ember tidak memuat IDN; API Ember butuh kunci. Berkas ini tahunan.', 'Panas bumi tidak dipisah (masuk "Other renewables").', 'Angka tahun terbaru bisa estimasi/sementara menurut Ember.', 'Berkas diunduh dari files.ember-energy.org yang robots.txt-nya melarang perayapan; satu unduhan berkas publik yang ditautkan Ember, tanpa perayapan.'],
    },
    baris,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--ambil')) {
    const r = await fetch(URL_TAHUNAN, { headers: { 'User-Agent': UA } }); if (!r.ok) throw new Error('Ember ' + r.status);
    fs.mkdirSync(path.dirname(CSV), { recursive: true }); fs.writeFileSync(CSV, await r.text());
  }
  const out = bangun(fs.readFileSync(CSV, 'utf8'), fs.statSync(CSV).mtime.toISOString().slice(0, 10));
  fs.writeFileSync(path.join(ROOT, 'public/data/ember_bulanan.json'), JSON.stringify(out) + '\n');
  console.error('baris', out.meta.jumlah, out.meta.tahun_awal, out.meta.tahun_akhir);
}
