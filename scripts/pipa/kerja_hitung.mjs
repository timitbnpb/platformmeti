#!/usr/bin/env node
// Kebutuhan tenaga kerja EBT (EST) dari pipeline RUPTL: kapasitas x faktor kerja per MW. Menulis bagian `analisis`, `faktor`, `sumber`, `lsp` di public/data/kerja.json.
//   node scripts/pipa/kerja_hitung.mjs [--selftest]
// Faktor: Rutovitz, Dominish, Downes (2015), "Calculating global energy sector jobs: 2015 methodology update", UTS Institute for Sustainable Futures
// (untuk Greenpeace International), Tabel 1 (faktor OECD, dasar metode ketenagakerjaan IRENA) dan Tabel 6 (pengali regional Non-OECD Asia 2015 = 2,4).
//   konstruksi = job-years per MW (konstruksi + instalasi), tersebar rata selama masa konstruksi sebelum COD
//   om         = jobs per MW sejak COD (operasi dan pemeliharaan, berkelanjutan)
// Manufaktur modul/turbin tidak dihitung (rantai pasok impor), baterai penyimpanan tidak punya faktor di tabel itu (dikeluarkan).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { PROV } from '../../public/inti/prov_singkat.js';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const OUT = AKAR + 'public/data/kerja.json';
export const TAHUN = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034];
export const PENGALI_ASIA = 2.4;
// teknologi RUPTL -> faktor (Tabel 1). hidro dipecah kecil (PLTM/PLTMH) dan besar menurut nama proyek.
export const FAKTOR = {
  surya: { baris: 'Solar Photovoltaics', tahun_bangun: 1, konstruksi: 13.0, om: 0.7 },
  bayu: { baris: 'Wind onshore', tahun_bangun: 2, konstruksi: 3.2, om: 0.3 },
  'hidro-besar': { baris: 'Hydro-large', tahun_bangun: 2, konstruksi: 7.4, om: 0.2 },
  'hidro-kecil': { baris: 'Hydro-small', tahun_bangun: 2, konstruksi: 15.8, om: 4.9 },
  'panas-bumi': { baris: 'Geothermal', tahun_bangun: 2, konstruksi: 6.8, om: 0.4 },
  bioenergi: { baris: 'Biomass', tahun_bangun: 2, konstruksi: 14.0, om: 1.5 },
  'biomassa-sampah': { baris: 'Biomass', tahun_bangun: 2, konstruksi: 14.0, om: 1.5 },
  nuklir: { baris: 'Nuclear', tahun_bangun: 10, konstruksi: 11.8, om: 0.6 },
};
export const kunciFaktor = (r) => (r.teknologi === 'hidro' ? (/PLTM|PLTMH|mikro/i.test(r.nama) ? 'hidro-kecil' : 'hidro-besar') : r.teknologi);
const TEK_TAMPIL = (k) => (k.startsWith('hidro') ? 'hidro' : k);
const KODE = Object.fromEntries(Object.entries(PROV).map(([k, [n]]) => [n, k]));

export function hitung(ruptl) {
  const tek = {}, prov = {}, dikeluarkan = { penyimpanan_mw: 0, tanpa_cod: 0, tanpa_cod_mw: 0 };
  const buat = () => Object.fromEntries(TAHUN.map((y) => [y, { konstruksi: 0, om: 0 }]));
  let proyek = 0, mw = 0;
  for (const r of ruptl.baris) {
    const mwr = Number(r.kapasitas_mw) || 0;
    if (r.teknologi === 'penyimpanan') { dikeluarkan.penyimpanan_mw += mwr; continue; }
    const f = FAKTOR[kunciFaktor(r)];
    const cod = (r.cod_tahun || []).filter((c) => Number.isInteger(c));
    if (!f || !mwr) continue;
    if (!cod.length) { dikeluarkan.tanpa_cod++; dikeluarkan.tanpa_cod_mw += mwr; continue; }
    proyek++; mw += mwr;
    const t = TEK_TAMPIL(kunciFaktor(r)), pk = KODE[r.provinsi] || 'tanpa';
    tek[t] ??= buat(); prov[pk] ??= buat();
    for (const c of cod) {
      const m = mwr / cod.length;
      for (let y = c - f.tahun_bangun; y < c; y++) if (tek[t][y]) { const v = (m * f.konstruksi) / f.tahun_bangun; tek[t][y].konstruksi += v; prov[pk][y].konstruksi += v; }
      for (const y of TAHUN) if (y >= c) { const v = m * f.om; tek[t][y].om += v; prov[pk][y].om += v; }
    }
  }
  const bulat = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Object.fromEntries(TAHUN.map((y) => [y, { konstruksi: Math.round(v[y].konstruksi), om: Math.round(v[y].om) }]))]));
  return { proyek, mw: Math.round(mw), dikeluarkan: { ...dikeluarkan, penyimpanan_mw: Math.round(dikeluarkan.penyimpanan_mw), tanpa_cod_mw: Math.round(dikeluarkan.tanpa_cod_mw) }, per_teknologi: bulat(tek), per_provinsi: bulat(prov) };
}

function utama() {
  const ruptl = JSON.parse(fs.readFileSync(AKAR + 'public/data/ruptl.json', 'utf8'));
  let d = {}; try { d = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch { /* baru */ }
  d.diperbarui = new Date().toISOString().slice(0, 10);
  d.tahun = TAHUN;
  d.faktor = { pengali_asia: PENGALI_ASIA, tabel: FAKTOR, ambang_hidro_kecil: 'nama proyek memuat PLTM/PLTMH/mikro (asumsi METI)' };
  d.analisis = { dasar: 'ruptl-2025', ...hitung(ruptl) };
  d.sumber = [
    { id: 'rutovitz-2015', judul: 'Calculating global energy sector jobs: 2015 methodology update (Tabel 1 dan Tabel 6)', penerbit: 'Rutovitz, Dominish, Downes; UTS Institute for Sustainable Futures untuk Greenpeace International', tahun: 2015, url: 'https://opus.lib.uts.edu.au/bitstream/10453/43718/1/Rutovitzetal2015Calculatingglobalenergysectorjobsmethodology.pdf', tingkat_bukti: 'riset' },
    { id: 'ruptl-2025', judul: 'RUPTL PT PLN (Persero) 2025-2034 (Kepmen ESDM 188.K/TL.03/MEM.L/2025)', penerbit: 'PT PLN (Persero); Kementerian ESDM', tahun: 2025, url: ruptl.sumber[0].url, tingkat_bukti: 'resmi' },
    { id: 'irena-jobs', judul: 'Renewable Energy and Jobs: Annual Review 2025', penerbit: 'IRENA dan ILO', tahun: 2025, url: 'https://www.ilo.org/publications/renewable-energy-and-jobs-annual-review-2025', tingkat_bukti: 'resmi' },
  ];
  d.lsp = [
    { id: 'lsp-bpsdm-esdm', nama: 'LSP BPSDM ESDM', lingkup: 'Sertifikasi kompetensi tenaga teknik sub sektor EBTKE dan ketenagalistrikan', lisensi: 'Lisensi BNSP Kep.0597/BNSP/III/2021 (perluasan Maret 2021)', teknologi: ['surya', 'bayu', 'hidro', 'panas-bumi', 'bioenergi'], url: 'https://www.esdm.go.id/id/berita-unit/badan-pengembangan-sumber-daya-manusia/membangun-kompetensi-tenaga-teknik-ketenagalistrikan-bersama-lsp-ppsdm-kebtke', diperiksa: '2026-11-08' },
    { id: 'ppsdm-kebtke', nama: 'PPSDM KEBTKE (Kementerian ESDM)', lingkup: 'Diklat dan sertifikasi operator dan pemeliharaan PLTS, termasuk PLTS atap dan PLTS terpusat', lisensi: 'Penyelenggara diklat resmi; skema sertifikasi lewat LSP BPSDM ESDM', teknologi: ['surya'], url: 'https://www.esdm.go.id/id/berita-unit/badan-pengembangan-sumber-daya-manusia/ppsdm-kebtke-selenggarakan-diklat-dan-sertifikasi-operator-plts-bagi-masyarakat-', diperiksa: '2026-11-08' },
    { id: 'bnsp', nama: 'BNSP: daftar LSP berlisensi', lingkup: 'Rujukan resmi status lisensi LSP lain (mis. LSP pihak ketiga energi terbarukan); periksa sebelum mendaftar', lisensi: 'Badan Nasional Sertifikasi Profesi', teknologi: [], url: 'https://bnsp.go.id', diperiksa: '2026-11-08' },
  ];
  fs.writeFileSync(OUT, JSON.stringify(d, null, 1) + '\n');
  const a = d.analisis;
  console.log('proyek', a.proyek, 'MW', a.mw, 'dikeluarkan', JSON.stringify(a.dikeluarkan));
}

function selftest() {
  const r = hitung({ baris: [
    { nama: 'PLTS A', teknologi: 'surya', provinsi: 'Bali', kapasitas_mw: 100, cod_tahun: [2027] },
    { nama: 'PLTM B', teknologi: 'hidro', provinsi: 'Aceh', kapasitas_mw: 10, cod_tahun: [2030, 2032] },
    { nama: 'BESS', teknologi: 'penyimpanan', provinsi: 'Bali', kapasitas_mw: 50, cod_tahun: [2027] },
    { nama: 'PLTB tanpa cod', teknologi: 'bayu', provinsi: null, kapasitas_mw: 20, cod_tahun: [] },
  ] });
  assert.equal(r.per_teknologi.surya[2026].konstruksi, 1300); // 100 MW x 13 job-years, 1 tahun bangun
  assert.equal(r.per_teknologi.surya[2027].om, 70); // 100 x 0,7
  assert.equal(r.per_teknologi.hidro[2028].konstruksi, Math.round(5 * 15.8 / 2)); // tahap 2030: 2028-2029
  assert.equal(r.per_teknologi.hidro[2034].om, Math.round(10 * 4.9)); // 2 tahap x 5 MW x 4,9
  assert.equal(r.dikeluarkan.penyimpanan_mw, 50); assert.equal(r.dikeluarkan.tanpa_cod, 1);
  assert.equal(r.proyek, 2);
  console.log('selftest ok');
}
if (process.argv.includes('--selftest')) selftest();
else if (process.argv[1] === fileURLToPath(import.meta.url)) utama();
