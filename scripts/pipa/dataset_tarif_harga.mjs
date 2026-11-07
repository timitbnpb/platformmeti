#!/usr/bin/env node
// public/data/tarif_harga.json: tarif listrik PLN nonsubsidi (triwulan III 2026 + keputusan per triwulan) dan harga BBM Pertamina (Jabodetabek).
// Sumber media (ANTARA) mengutip ESDM dan laman Pertamina; angka dibaca dari artikel 7 Nov 2026.
import { fileURLToPath } from 'node:url';
import { TGL, saring, bungkus, tulis, pilihSumber } from './dataset_lib.mjs';

export const SUMBER = { 's-antara': { id: 's-antara', lisensi: 'Hak cipta ANTARA; hanya judul, angka kunci, dan tautan (isi tidak disalin)', judul: 'Berita ANTARA (tarif listrik ESDM/PLN dan harga BBM Pertamina; angka kunci dan tautan)', penerbit: 'ANTARA', tahun: 2026, url: 'https://www.antaranews.com' } };
const A = (id) => 'https://www.antaranews.com/berita/' + id;
const LISTRIK_Q3 = [
  ['R-1/TR 450 VA (subsidi)', 'rumah tangga', 415], ['R-1/TR 900 VA (subsidi)', 'rumah tangga', 605], ['R-1/TR 900 VA-RTM', 'rumah tangga', 1352],
  ['R-1/TR 1.300 VA', 'rumah tangga', 1444.7], ['R-1/TR 2.200 VA', 'rumah tangga', 1444.7], ['R-2/TR 3.500-5.500 VA', 'rumah tangga', 1699.53], ['R-3/TR 6.600 VA ke atas', 'rumah tangga', 1699.53],
  ['B-2/TR 6.600 VA-200 kVA', 'bisnis', 1444.7], ['B-3/TM di atas 200 kVA', 'bisnis', 1114.74],
  ['I-3/TM di atas 200 kVA', 'industri', 1114.74], ['I-4/TT 30.000 kVA ke atas', 'industri', 996.74],
  ['P-1/TR 6.600 VA-200 kVA', 'pemerintah', 1699.53], ['P-2/TM di atas 200 kVA', 'pemerintah', 1522.88], ['P-3/TR', 'pemerintah', 1699.53], ['L/TR, TM, TT', 'layanan khusus', 1644.52],
];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
// Keputusan triwulanan tarif nonsubsidi (semua "tetap"); ANTARA 5131540, 5329981, 5504869, 5629497.
const KEPUTUSAN = [
  ['2025-Q4', '2025-10-01', '2025-12-31', '5131540', '2025-09-16'], ['2026-Q1', '2026-01-01', '2026-03-31', '5329981', '2026-01-01'],
  ['2026-Q2', '2026-04-01', '2026-06-30', '5504869', '2026-04-01'], ['2026-Q3', '2026-07-01', '2026-09-30', '5629497', '2026-06-30'],
];
// [produk, jenis, harga, sebelumnya, berlaku_sejak, berlaku_sampai, antara_id, tanggal_sumber, catatan]
const BBM = [
  ['Pertamax (RON 92)', 'nonsubsidi', 16250, null, null, '2026-07-31', '5677420', '2026-08-03', 'Harga sebelum 1 Agustus 2026.'],
  ['Pertamax (RON 92)', 'nonsubsidi', 15950, 16250, '2026-08-01', null, '5824411', '2026-11-01', 'Tak berubah sampai 1 Nov 2026.'],
  ['Pertamax Turbo (RON 98)', 'nonsubsidi', 19300, null, null, '2026-07-31', '5677420', '2026-08-03', null],
  ['Pertamax Turbo (RON 98)', 'nonsubsidi', 18300, 19300, '2026-08-01', '2026-08-31', '5677420', '2026-08-03', null],
  ['Pertamax Turbo (RON 98)', 'nonsubsidi', 19600, 18300, '2026-09-01', null, '5719721', '2026-08-31', 'ANTARA 5729277 menyebut berlaku 2 Sep 2026; selisih tanggal belum diselesaikan.'],
  ['Pertamax Green 95', 'nonsubsidi', 17000, null, null, '2026-07-31', '5677420', '2026-08-03', null],
  ['Pertamax Green 95', 'nonsubsidi', 16600, 17000, '2026-08-01', '2026-09-01', '5677420', '2026-08-03', 'Tanggal akhir mengikuti 5729277 (naik 2 Sep); artikel 5719721 menyebut Pertamax Green tak berubah per 1 Sep.'],
  ['Pertamax Green 95', 'nonsubsidi', 19150, 16600, '2026-09-02', null, '5729277', '2026-09-07', 'Tak berubah sampai 1 Nov 2026 (ANTARA 5824411).'],
  ['Dexlite (CN 51)', 'nonsubsidi', 19700, null, '2026-08-01', '2026-08-31', '5718107', '2026-08-31', 'Harga Agustus 2026; sebelum itu tidak dibaca.'],
  ['Dexlite (CN 51)', 'nonsubsidi', 23700, 19700, '2026-09-01', null, '5719721', '2026-08-31', 'Tak berubah sampai 1 Nov 2026.'],
  ['Pertamina Dex (CN 53)', 'nonsubsidi', 21150, null, '2026-08-01', '2026-08-31', '5718107', '2026-08-31', 'Harga Agustus 2026; sebelum itu tidak dibaca.'],
  ['Pertamina Dex (CN 53)', 'nonsubsidi', 25200, 21150, '2026-09-01', null, '5719721', '2026-08-31', 'Tak berubah sampai 1 Nov 2026.'],
  ['Pertalite (RON 90)', 'penugasan', 10000, null, '2026-08-01', null, '5824411', '2026-11-01', 'Tetap Rp10.000 sejak sebelum Agustus; riwayat sebelum itu tidak dibaca.'],
  ['Biosolar / Solar subsidi', 'subsidi', 6800, null, '2026-08-01', null, '5824411', '2026-11-01', 'Tetap Rp6.800; riwayat sebelum Agustus tidak dibaca.'],
];
export function bangun() {
  const baris = [];
  for (const [gol, kel, tarif] of LISTRIK_Q3) baris.push({
    id: 'tl_2026q3_' + slug(gol), kelompok: 'tarif_listrik', golongan: gol, kelompok_pelanggan: kel, tarif_idr_per_kwh: tarif, periode: '2026-Q3', berlaku_sejak: '2026-07-01', berlaku_sampai: '2026-09-30',
    dasar_hukum: 'Permen ESDM 7/2024 (tariff adjustment triwulanan)', catatan: 'Triwulan IV 2026 belum terverifikasi; ini tarif terbaru yang punya sumber.',
    sumber_id: 's-antara', sumber_url: A('5719805'), tanggal_sumber: '2026-09-01', tanggal: TGL, tingkat_bukti: 'media' });
  for (const [per, a, b, id, tgl] of KEPUTUSAN) baris.push({
    id: 'tk_' + per.toLowerCase().replace('-', ''), kelompok: 'keputusan_tarif', periode: per, keputusan: 'tetap (tidak naik)', berlaku_sejak: a, berlaku_sampai: b,
    cakupan: 'pelanggan nonsubsidi (13 golongan menurut berita Q3 2026); golongan bersubsidi juga tidak berubah menurut berita Q3 2026', dasar_hukum: 'Permen ESDM 7/2024',
    sumber_id: 's-antara', sumber_url: A(id), tanggal_sumber: tgl, tanggal: TGL, tingkat_bukti: 'media' });
  BBM.forEach(([produk, jenis, harga, sblm, dari, sampai, id, tgl, cat], i) => baris.push({
    id: `bbm_${slug(produk)}_${dari || 'sebelum'}_${i}`, kelompok: 'harga_bbm', produk, jenis, harga_idr_per_liter: harga, harga_sebelumnya: sblm, berlaku_sejak: dari, berlaku_sampai: sampai,
    wilayah: 'Jabodetabek (laman Pertamina)', catatan: cat ?? undefined, sumber_id: 's-antara', sumber_url: A(id), tanggal_sumber: tgl, tanggal: TGL, tingkat_bukti: 'media' }));
  return baris.map((b) => Object.fromEntries(Object.entries(b).filter(([, v]) => v !== undefined)));
}
export const CELAH = [
  'Tarif listrik triwulan IV 2026 (Okt-Des) tidak ditemukan di sumber yang dibaca (web.pln.co.id dan gatrik.esdm.go.id tidak terjangkau dari lingkungan ini, koneksi gagal); tarif terbaru bersumber triwulan III 2026. Nilai Q4 mungkin sama (keputusan Q4 2025 hingga Q3 2026 semuanya "tetap") tetapi belum diverifikasi.',
  'Hanya 15 golongan yang dimuat berita Antara; 13 golongan nonsubsidi dan 24 golongan bersubsidi lengkap menurut Permen ESDM tidak tersedia dari sumber resmi yang dibaca. Biaya beban, tarif waktu pemakaian, dan tarif prabayar/pascabayar tidak dicakup.',
  'Riwayat tarif sebelum triwulan IV 2025 tidak dimuat; keputusan per triwulan hanya mencatat "tetap", bukan nilai per golongan.',
  'Harga BBM hanya dari berita Antara (mengutip laman Pertamina) untuk Jabodetabek, mulai Agustus 2026; riwayat sebelum itu (mis. kenaikan Juni 2026 yang disebut CORE) tidak dibaca. pertamina.com/id/pricing-bbm dirender JavaScript dan tidak berisi harga di HTML.',
  'Tanggal berlaku kenaikan 1 vs 2 September 2026 berbeda antarartikel; keduanya dicatat. Antara melarang crawling otomatis untuk AI: hanya angka kunci dan tautan yang disimpan.',
  'Harga Shell dan bp tidak dimuat.',
];
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { ok, ditolak } = saring(bangun());
  console.log(tulis('tarif_harga', bungkus({ baris: ok, sumber: pilihSumber(SUMBER, ok), celah: CELAH, ditolak })), ok.length, 'baris');
}
