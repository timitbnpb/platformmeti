#!/usr/bin/env node
// public/data/biaya_listrik.json (FITUR-200 A06, A18, B04, L11, J10): LCOE dunia dan negara, harga modul surya, BPP per sistem.
//   node scripts/pipa/biaya_listrik.mjs ambil   (jaringan: ourworldindata.org; UA jujur, robots, jeda >= 2 dtk) -> data/biaya_listrik/*.csv
//   node scripts/pipa/biaya_listrik.mjs bangun  (offline) -> public/data/biaya_listrik.json
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ambil } from './_panen_sopan.mjs';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const TGL = '2026-11-08';
const OWID = 'https://ourworldindata.org/grapher/';
const Q = '.csv?v=1&csvType=full&useColumnShortNames=false';
const TEK = ['bioenergi', 'panas-bumi', 'bayu-laut', 'surya', 'surya-termal', 'air', 'bayu-darat'];
const NEGARA = { 'OWID_WRL': 'Dunia', IDN: 'Indonesia', VNM: 'Vietnam', THA: 'Thailand', PHL: 'Filipina', IND: 'India', MYS: 'Malaysia', KHM: 'Kamboja', LAO: 'Laos' };
export const SUMBER = [
  { id: 's-irena-lcoe', judul: 'IRENA, Renewable Power Generation Costs in 2025/2024/2023 (LCOE, harga tetap USD 2025 per kWh), diolah dan diterbitkan Our World in Data', penerbit: 'IRENA via Our World in Data', tahun: 2026, url: 'https://ourworldindata.org/grapher/levelized-cost-of-energy', lisensi: 'CC BY 4.0 (OWID); data asal IRENA', tingkat_bukti: 'via-pihak-ketiga' },
  { id: 's-irena-modul', judul: 'IRENA, Renewable Power Generation Costs in 2025 (harga modul surya, tolok Eropa pvXchange), diolah Our World in Data', penerbit: 'IRENA via Our World in Data', tahun: 2026, url: 'https://ourworldindata.org/grapher/solar-pv-prices', lisensi: 'CC BY 4.0 (OWID); data asal IRENA', tingkat_bukti: 'via-pihak-ketiga' },
  { id: 's-bpp', judul: 'Kepmen ESDM Besaran Biaya Pokok Penyediaan Pembangkitan PT PLN (Persero), 2016 sampai 2020 (transkripsi data/peluang/bpp.json)', penerbit: 'Kementerian ESDM', tahun: 2021, url: 'https://jdih.esdm.go.id', lisensi: 'Dokumen peraturan (publik)', tingkat_bukti: 'resmi' },
];
export const CELAH = [
  'LCOE Indonesia dari IRENA hanya ada untuk bayu darat 2017 sampai 2020; surya, panas bumi, dan air Indonesia tidak ada di rilis yang dibaca. LCOE Indonesia versi IESR dan Agora berupa PDF: belum tersedia (menunggu dokumen sumber).',
  'Harga baterai dan inverter dari waktu ke waktu tidak tersedia terbuka (seri BNEF tidak boleh disebarkan ulang; Our World in Data menolak CSV-nya). belum tersedia (menunggu dokumen sumber): laporan IRENA Electricity Storage Costs atau IEA.',
  'Harga modul mulai 2010 adalah tolok pasar Eropa (pvXchange), bukan harga impor Indonesia; impor Indonesia (BPS) belum tersedia (menunggu dokumen sumber).',
  'LCOE pembangkit fosil tidak dimuat (rilis IRENA yang dibaca hanya EBT); BPP nasional dipakai sebagai pembanding campuran, bukan LCOE fosil. Subsidi fosil (IESR) belum tersedia (menunggu dokumen sumber).',
  'BPP hanya tersedia untuk tahun 2016, 2017, 2018, dan 2020 (berkas Kepmen yang diterima); tahun 2015, 2019, dan 2021 ke atas belum ada.',
  'Harga indikatif pasar per teknologi (J10) tidak ada sumber publik bertanggal yang dibaca; tarif Perpres 112/2022 sudah ada di data keuangan.',
];
const csv = (f) => fs.readFileSync(AKAR + f, 'utf8').trim().split('\n').slice(1).map((l) => l.split(','));
export async function ambilSemua() {
  fs.writeFileSync(AKAR + 'data/biaya_listrik/lcoe.csv', await ambil(OWID + 'levelized-cost-of-energy' + Q));
  fs.writeFileSync(AKAR + 'data/biaya_listrik/modul.csv', await ambil(OWID + 'solar-pv-prices' + Q));
}
export function bangun() {
  const lcoe = [];
  for (const r of csv('data/biaya_listrik/lcoe.csv')) {
    const kode = r[1]; if (!NEGARA[kode]) continue;
    const tahun = +r[2]; if (tahun < 2010) continue;
    r.slice(3).forEach((v, i) => { if (v !== '') lcoe.push({ negara: NEGARA[kode], iso3: kode === 'OWID_WRL' ? 'WLD' : kode, teknologi: TEK[i], tahun, sen_usd_kwh: Math.round(+v * 1e4) / 100, sumber_id: 's-irena-lcoe', tingkat_bukti: 'via-pihak-ketiga', tanggal: TGL }); });
  }
  const modul = csv('data/biaya_listrik/modul.csv').filter((r) => r[1] === 'OWID_WRL').map((r) => ({ tahun: +r[2], usd_per_w: Math.round(+r[3] * 1e3) / 1e3, sumber_id: 's-irena-modul', tingkat_bukti: 'via-pihak-ketiga', tanggal: TGL }));
  const B = JSON.parse(fs.readFileSync(AKAR + 'data/peluang/bpp.json', 'utf8'));
  const nasional = Object.entries(B.tahun).map(([th, t]) => ({ tahun: +th, rp_kwh: t.nasional.rp_kwh, sen_usd_kwh: t.nasional.sen_usd_kwh, kurs_rp_usd: t.kurs_rp_usd, kepmen: t.kepmen, tanggal_penetapan: t.tanggal_penetapan, sumber_id: 's-bpp', tingkat_bukti: 'resmi', tanggal: TGL }));
  const peta = new Map();
  for (const [th, t] of Object.entries(B.tahun)) for (const r of t.baris) {
    const s = B.sistem[r.kunci]; if (!s || s.tingkat !== 'sistem') continue;
    if (!peta.has(r.kunci)) peta.set(r.kunci, { kunci: r.kunci, nama: s.nama, provinsi: s.provinsi, rp_kwh: {} });
    peta.get(r.kunci).rp_kwh[th] = r.rp_kwh;
  }
  const bpp_sistem = [...peta.values()].map((x) => ({ ...x, sumber_id: 's-bpp', tingkat_bukti: 'resmi', tanggal: TGL }));
  return { lapis: 'publik', dibangun_pada: TGL, tahun_dasar_usd: 2025, sumber: SUMBER, lcoe, modul, bpp_nasional: nasional, bpp_sistem, meta: { diperbarui: TGL, celah: CELAH } };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'ambil') await ambilSemua();
  else { const d = bangun(); fs.writeFileSync(AKAR + 'public/data/biaya_listrik.json', JSON.stringify(d) + '\n'); console.log('lcoe', d.lcoe.length, 'modul', d.modul.length, 'bpp sistem', d.bpp_sistem.length); }
}
