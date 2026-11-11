#!/usr/bin/env node
// public/data/tarif_harga.json: tarif listrik PLN nonsubsidi (triwulan III 2026 + keputusan per triwulan) dan harga BBM Pertamina (Jabodetabek).
// K21/JM-S04: hanya baris yang terverifikasi ke pengumuman resmi ESDM yang dipertahankan (dibaca 11 Nov 2026 di esdm.go.id, robots dihormati).
// Dibuang karena tak ada sumber resmi terbaca: 10 golongan tarif listrik, 14 baris harga BBM (laman Pertamina dirender JavaScript/Blazor).
import { fileURLToPath } from 'node:url';
import { TGL, saring, bungkus, tulis, pilihSumber } from './dataset_lib.mjs';

const ESDM = 'https://www.esdm.go.id/id/media-center/arsip-berita/';
export const SUMBER = {
  's-esdm-2022': { id: 's-esdm-2022', lisensi: 'Informasi publik pemerintah; hanya angka kunci dan tautan', judul: 'Siaran pers ESDM 227.Pers/04/SJI/2022 (13 Jun 2022): penyesuaian tarif golongan R2, R3, P1, P2, P3', penerbit: 'Kementerian ESDM', tahun: 2022, url: ESDM + 'pemerintah-terapkan-penyesuaian-tarif-listrik-kepada-golongan-masyarakat-mampu-berdaya-3500-va-ke-atas-dan-golongan-pemerintah' },
  's-esdm-keputusan': { id: 's-esdm-keputusan', lisensi: 'Informasi publik pemerintah; hanya angka kunci dan tautan', judul: 'Siaran pers ESDM keputusan tarif tenaga listrik triwulanan (Q4 2025 sampai Q3 2026)', penerbit: 'Kementerian ESDM', tahun: 2026, url: ESDM + 'jaga-daya-beli-menteri-esdm-tarif-listrik-tidak-naik' },
};
// Hanya golongan yang disebut nilainya di siaran pers ESDM 2022 (R2, R3, P1, P2, P3). Nilai tetap sejak itu: keputusan triwulanan Q4 2025 sampai Q3 2026 semuanya "tetap".
const LISTRIK_Q3 = [
  ['R-2/TR 3.500-5.500 VA', 'rumah tangga', 1699.53], ['R-3/TR 6.600 VA ke atas', 'rumah tangga', 1699.53],
  ['P-1/TR 6.600 VA-200 kVA', 'pemerintah', 1699.53], ['P-2/TM di atas 200 kVA', 'pemerintah', 1522.88], ['P-3/TR', 'pemerintah', 1699.53],
];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
// Keputusan triwulanan tarif nonsubsidi (semua "tetap").
const KEPUTUSAN = [   // [periode, mulai, akhir, slug rilis ESDM, tanggal rilis]
  ['2025-Q4', '2025-10-01', '2025-12-31', 'pemerintah-putuskan-tarif-listrik-triwulan-iv-2025-tetap-', '2025-09-24'],
  ['2026-Q1', '2026-01-01', '2026-03-31', 'jaga-stabilitas-awal-tahun-2026-pemerintah-putuskan-tarif-listrik-tidak-naik', '2025-12-31'],
  ['2026-Q2', '2026-04-01', '2026-06-30', 'lebaran-tenang-tarif-listrik-triwulan-ii-2026-tidak-naik', '2026-03-17'],
  ['2026-Q3', '2026-07-01', '2026-09-30', 'jaga-daya-beli-menteri-esdm-tarif-listrik-tidak-naik', '2026-06-30'],
];
export function bangun() {
  const baris = [];
  for (const [gol, kel, tarif] of LISTRIK_Q3) baris.push({
    id: 'tl_2026q3_' + slug(gol), kelompok: 'tarif_listrik', golongan: gol, kelompok_pelanggan: kel, tarif_idr_per_kwh: tarif, periode: '2026-Q3', berlaku_sejak: '2026-07-01', berlaku_sampai: '2026-09-30',
    dasar_hukum: 'Permen ESDM 7/2024 (tariff adjustment triwulanan)', catatan: 'Angka dari siaran pers ESDM 13 Jun 2022 (tarif disesuaikan sejak itu); berlaku di 2026-Q3 hanya lewat inferensi: keputusan triwulanan Q4 2025 sampai Q3 2026 menyatakan tarif nonsubsidi tetap. Bukan angka dari rilis 2026. Triwulan IV 2026 belum terverifikasi.',
    sumber_id: 's-esdm-2022', sumber_url: SUMBER['s-esdm-2022'].url, tanggal_sumber: '2022-06-13', tanggal: TGL, tingkat_bukti: 'turunan' });
  for (const [per, a, b, slugRilis, tgl] of KEPUTUSAN) baris.push({
    id: 'tk_' + per.toLowerCase().replace('-', ''), kelompok: 'keputusan_tarif', periode: per, keputusan: 'tetap (tidak naik)', berlaku_sejak: a, berlaku_sampai: b,
    cakupan: 'pelanggan nonsubsidi (13 golongan); golongan bersubsidi (24 golongan) tidak berubah menurut siaran pers Q3 2026', dasar_hukum: 'Permen ESDM 7/2024',
    sumber_id: 's-esdm-keputusan', sumber_url: ESDM + slugRilis, tanggal_sumber: tgl, tanggal: TGL, tingkat_bukti: 'resmi' });
  return baris.map((b) => Object.fromEntries(Object.entries(b).filter(([, v]) => v !== undefined)));
}
export const CELAH = [
  'Golongan R-1 (rumah tangga 450 sampai 2.200 VA, termasuk subsidi) TIDAK ADA di data: tak ada pengumuman resmi terbaca yang memuat angkanya. Layar harus memperingatkan bahwa tarif R-1 tidak tersedia, bukan memakai angka R-2.',
  'Tarif listrik triwulan IV 2026 (Okt-Des) belum diumumkan pada sumber yang dibaca; keputusan Q4 2025 sampai Q3 2026 semuanya "tetap".',
  'Hanya 5 golongan (R2, R3, P1, P2, P3) yang nilainya tertulis di pengumuman resmi ESDM yang dapat dibaca. 10 golongan lain (R1, B2, B3, I3, I4, L, dan golongan bersubsidi) DIBUANG: nilai sebelumnya hanya bersumber dari kantor berita (K21) dan laman PLN tidak terjangkau dari lingkungan panen.',
  'Harga BBM Pertamina (14 baris) DIBUANG: laman pertamina.com/id/pricing-bbm dan pertaminapatraniaga.com dirender JavaScript (tanpa harga di HTML) dan sebelumnya hanya bersumber dari kantor berita. Dibangun lagi bila ada sumber resmi yang dapat dibaca.',
  'Biaya beban, tarif waktu pemakaian, dan tarif prabayar/pascabayar tidak dicakup.',
  'Riwayat tarif sebelum triwulan IV 2025 tidak dimuat; keputusan per triwulan hanya mencatat "tetap".',
];
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { ok, ditolak } = saring(bangun());
  console.log(tulis('tarif_harga', bungkus({ baris: ok, sumber: pilihSumber(SUMBER, ok), celah: CELAH, ditolak, tambahMeta: { golongan_tidak_tersedia: ['R-1', 'B-2', 'B-3', 'I-3', 'I-4', 'L', 'subsidi'] } })), ok.length, 'baris');
}
