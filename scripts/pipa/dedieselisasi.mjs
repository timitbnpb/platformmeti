#!/usr/bin/env node
// public/data/dedieselisasi.json: pelacak dedieselisasi per provinsi (PLTD, BPP sistem terisolasi, proyek dedieselisasi RUPTL, harga solar).
//   node scripts/pipa/dedieselisasi.mjs bangun  (offline) -> public/data/dedieselisasi.json
// Penghematan BBM dihitung di layar dari public/radar_rumus.js (rumus terbuka, asumsi HIPOTESIS); berkas ini memuat data bersumber dan prioritas.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { minmaks, ASUMSI } from '../../public/radar_rumus.js';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const TGL = '2026-11-08';
const J = (f) => JSON.parse(fs.readFileSync(AKAR + f, 'utf8'));
const BOBOT = { pangsa: 0.4, liter: 0.3, bpp: 0.2, pvout: 0.1 };

export function bangun() {
  const ST = J('public/data/statistik_pln.json'), PEL = J('public/data/peluang.json'), ATL = J('public/data/potensi_atlas.json'), TAR = J('public/data/tarif_harga.json'), RUP = J('public/data/ruptl.json');
  const atl = new Map(ATL.baris.map((b) => [b.kode, b.pvout_kwh_per_kwp_tahun]));
  const bpp = new Map(PEL.baris.map((b) => [b.kode, b.bpp]));
  const dex = TAR.baris.filter((r) => r.kelompok === 'harga_bbm' && /^Dexlite/.test(r.produk) && r.berlaku_sejak).sort((a, z) => z.berlaku_sejak.localeCompare(a.berlaku_sejak))[0];
  const bio = TAR.baris.filter((r) => r.kelompok === 'harga_bbm' && /^Biosolar/.test(r.produk)).sort((a, z) => String(z.berlaku_sejak).localeCompare(String(a.berlaku_sejak)))[0];
  const dedies = new Map();
  for (const r of RUP.baris) if (/dedieselisasi|isolated/i.test(r.nama) && r.provinsi) {
    const kode = PEL.baris.find((b) => b.nama === r.provinsi)?.kode; if (!kode) continue;
    if (!dedies.has(kode)) dedies.set(kode, []);
    dedies.get(kode).push({ id: r.id, nama: r.nama, teknologi: r.teknologi, mw: r.kapasitas_mw, status: r.status, proyek_id: r.proyek_id || null, halaman: r.halaman });
  }
  const sistemTerisolasi = [];
  const baris = ST.baris.map((b) => {
    const pltdMw = b.kapasitas_terpasang_mw?.PLTD ?? null, pltdGwh = b.produksi_pln_gwh?.PLTD ?? null, tot = b.produksi_pln_gwh?.total ?? null;
    const sis = (bpp.get(b.kode)?.sistem || []).filter((x) => x.tingkat === 'sub' || x.tingkat === 'generik');
    for (const x of sis.filter((y) => y.tingkat === 'sub')) sistemTerisolasi.push({ kode: b.kode, provinsi: b.provinsi, nama: x.nama, bpp_rp_kwh: x.rp_kwh, sen_usd: x.sen_usd });
    const pr = dedies.get(b.kode) || [];
    return { kode: b.kode, provinsi: b.provinsi, pltd_mw: pltdMw, pltd_gwh: pltdGwh, total_gwh: tot, pangsa_pltd: pltdGwh !== null && tot ? Math.round((pltdGwh / tot) * 10000) / 100 : null,
      pvout: atl.get(b.kode) ?? null, bpp_nasional_rp_kwh: PEL.baris.find((p) => p.kode === b.kode)?.bpp?.nasional_rp_kwh ?? null, bpp_maks_terisolasi: sis.some((x) => x.tingkat === 'sub') ? Math.max(...sis.filter((x) => x.tingkat === 'sub').map((x) => x.rp_kwh)) : null, sistem_terisolasi: sis.filter((x) => x.tingkat === 'sub').map((x) => x.nama),
      proyek: pr, proyek_mw: Math.round(pr.reduce((a, p) => a + (p.mw || 0), 0) * 100) / 100 };
  });
  /* prioritas 0-100 (HIPOTESIS): pangsa PLTD, liter BBM (log produksi PLTD), BPP terisolasi tertinggi, PVOUT; komponen kosong dikeluarkan, bobot dinormalkan ulang */
  const n = { pangsa: minmaks(baris.map((b) => b.pangsa_pltd)), liter: minmaks(baris.map((b) => (b.pltd_gwh ? Math.log1p(b.pltd_gwh) : null))), bpp: minmaks(baris.map((b) => b.bpp_maks_terisolasi)), pvout: minmaks(baris.map((b) => b.pvout)) };
  baris.forEach((b, i) => {
    if (!b.pltd_gwh) { b.prioritas = null; return; }
    const ada = Object.keys(BOBOT).filter((k) => n[k][i] !== null), w = ada.reduce((s, k) => s + BOBOT[k], 0);
    b.prioritas = Math.round((ada.reduce((s, k) => s + n[k][i] * BOBOT[k], 0) / w) * 1000) / 10;
  });
  return {
    lapis: 'publik', dibangun_pada: TGL, tahun_data: ST.tahun, tingkat_bukti: 'hipotesis', jumlah: baris.length,
    harga_solar: { produk: dex.produk, rp_per_liter: dex.harga_idr_per_liter, berlaku_sejak: dex.berlaku_sejak, wilayah: dex.wilayah, sumber_url: dex.sumber_url, pembanding_subsidi: { produk: bio.produk, rp_per_liter: bio.harga_idr_per_liter, berlaku_sejak: bio.berlaku_sejak } },
    asumsi: ASUMSI, bobot_prioritas: BOBOT,
    metode: {
      rumus: ['Energi diganti (kWh) = produksi PLTD tahunan (GWh) x 1 juta x pangsa diganti.', 'Solar hemat (liter) = energi diganti x konsumsi spesifik PLTD (liter per kWh).', 'Hemat BBM (Rp) = solar hemat x harga Dexlite terbaru.', 'Biaya PLTS + baterai (Rp) = energi diganti x biaya (sen USD per kWh) x kurs.', 'Hemat bersih = hemat BBM dikurangi biaya PLTS + baterai.', 'PLTS dibutuhkan (MWp) = energi diganti / (PVOUT provinsi x efisiensi sistem) / 1000.'],
      prioritas: 'Skor 0-100 = rata-rata berbobot dari pangsa PLTD dalam produksi PLN (0,4), log produksi PLTD (0,3), BPP tertinggi sistem terisolasi (0,2), dan PVOUT (0,1), masing-masing min-maks antar provinsi; komponen kosong dikeluarkan dan bobot dihitung ulang.',
    },
    sumber: [
      { id: 'stat', judul: 'Statistik Ketenagalistrikan 2024, Ditjen Ketenagalistrikan ESDM (kapasitas dan produksi PLTD per provinsi)', url: ST.url, tanggal: ST.tanggal_ambil },
      { id: 'bpp', judul: 'Kepmen ESDM 169.K/HK.02/MEM.M/2021 (BPP 2020 per sistem dan sub sistem terisolasi), lewat peluang.json', url: '/investasi#peluang', tanggal: '2026-11-07' },
      { id: 'ruptl', judul: 'RUPTL PLN 2025-2034: proyek bernama Dedieselisasi atau Isolated', url: 'https://gatrik.esdm.go.id/', tanggal: '2026-11-07' },
      { id: 'solar', judul: 'Harga Dexlite dan Biosolar (laman Pertamina lewat tarif_harga.json)', url: dex.sumber_url, tanggal: dex.tanggal },
      { id: 'atlas', judul: 'Global Solar Atlas 2.0 (PVOUT), satu titik per provinsi', url: 'https://globalsolaratlas.info/', tanggal: '2026-11-08' },
    ],
    celah: [
      'Kapasitas diesel dan produksi PLTD hanya ada per provinsi (Statistik Ketenagalistrikan 2024); tidak ada per sistem terisolasi. Sistem terisolasi hanya memiliki BPP (Kepmen 2020).',
      'Statistik PLN per sistem (web.pln.co.id) tidak terjangkau dan RUPTL per pulau tidak dipanen; angka per pulau belum ada.',
      'Biaya PLTS + baterai, konsumsi spesifik PLTD, kurs, dan efisiensi sistem adalah asumsi HIPOTESIS terbuka (tidak ada seri harga baterai terbuka di repo); harga solar memakai Dexlite Jabodetabek sebagai tolok, bukan harga beli PLN.',
      'Produksi PLTD yang diganti memakai pangsa seragam; kebutuhan baterai (MWh) tidak dihitung.',
    ],
    baris, sistem_terisolasi: sistemTerisolasi.sort((a, z) => z.bpp_rp_kwh - a.bpp_rp_kwh),
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2] === 'bangun') {
  const d = bangun(); fs.writeFileSync(AKAR + 'public/data/dedieselisasi.json', JSON.stringify(d) + '\n');
  console.log(d.jumlah, 'provinsi;', d.sistem_terisolasi.length, 'sistem terisolasi;', d.baris.filter((b) => b.proyek.length).length, 'provinsi dengan proyek dedieselisasi');
}
