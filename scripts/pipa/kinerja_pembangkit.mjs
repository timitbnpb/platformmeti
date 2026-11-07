#!/usr/bin/env node
// public/data/kinerja_pembangkit.json: faktor kapasitas aktual 2024 = produksi / (kapasitas x 8760), per teknologi (nasional) dan per provinsi.
//   node scripts/pipa/kinerja_pembangkit.mjs   (offline; membaca public/data/statistik_pln.json) -> public/data/kinerja_pembangkit.json
// Tidak ada data produksi per unit di repo: tingkat terendah = jenis x provinsi. Angka RUPTL ditranskripsi dari PDF (lihat SUMBER).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const TGL = '2026-11-08';
const JAM = 8760;
export const SUMBER = [
  { id: 's-esdm', judul: 'Statistik Ketenagalistrikan Tahun 2024: kapasitas terpasang (semua pengusaha) dan produksi PLN per jenis pembangkit per provinsi', penerbit: 'Ditjen Ketenagalistrikan, Kementerian ESDM', tahun: 2025, url: 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/91fa8-buku-statistik-ketenagalistrikan-2024.pdf', tingkat_bukti: 'resmi' },
  { id: 's-ruptl-kap', judul: 'RUPTL PLN 2025-2034, Tabel 4.19 Realisasi Kapasitas Terpasang Pembangkit Indonesia (MW), kolom 2024 sampai Oktober (milik sendiri + sewa + IPP/excess power; tanpa Batam, tanpa pembangkit proyek)', penerbit: 'PT PLN (Persero); disahkan Kementerian ESDM', tahun: 2025, url: 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf', tingkat_bukti: 'resmi' },
  { id: 's-ruptl-energi', judul: 'RUPTL PLN 2025-2034, Tabel 5.128 Komposisi Produksi Energi Listrik Berdasarkan Jenis Bahan Bakar Indonesia (GWh), Skenario RE Base, tahun 2025 (hlm V-234)', penerbit: 'PT PLN (Persero); disahkan Kementerian ESDM', tahun: 2025, url: 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf', tingkat_bukti: 'resmi' },
];
// id teknologi -> kolom produksi (statistik_pln.produksi_pln_gwh), kolom kapasitas ESDM, kapasitas RUPTL 2024 (MW), energi rencana RUPTL 2025 (GWh).
// Kapasitas RUPTL = penjumlahan kolom Milik Sendiri + Sewa + Excess/IPP pada Tabel 4.19 (2024).
export const TEK = [
  { id: 'pltu', grup: 'fosil', prod: ['PLTU'], kap: 'PLTU/MT', ruptl_mw: [19441.9, 105, 18892.9, 1585], rencana_gwh: 241418, rencana_pakai: true, rencana_ket: 'RUPTL batubara 2025' },
  { id: 'gas', grup: 'fosil', prod: ['PLTG', 'PLTGU', 'PLTMG'], kap: 'PLTG/GU/MG/MGU', ruptl_mw: [2798.7, 119, 809, 12797.7, 2700.6, 2045.1, 253.6, 156.6], rencana_gwh: 56912, rencana_pakai: true, rencana_ket: 'RUPTL gas dan LNG 2025' },
  { id: 'pltd', grup: 'fosil', prod: ['PLTD'], kap: 'PLTD', ruptl_mw: [3351.3, 816.3], rencana_gwh: 14035, rencana_pakai: false, alasan: 'bbm' },
  { id: 'air', grup: 'ebt', prod: ['PLTA', 'PLTM', 'PLTMH'], kap: 'PLTA/M', ruptl_mw: [3597, 2222.2], rencana_gwh: 24742, rencana_pakai: true, rencana_ket: 'RUPTL air 2025' },
  { id: 'panas', grup: 'ebt', prod: ['PLTP'], kap: 'PLTP', ruptl_mw: [579.3, 1758.8], rencana_gwh: 17122, rencana_pakai: true, rencana_ket: 'RUPTL panas bumi 2025' },
  { id: 'surya', grup: 'ebt', prod: ['PLTS'], kap: 'PLTS', ruptl_mw: [32.6, 0.8, 209.1], rencana_gwh: 2357, rencana_pakai: false, alasan: 'tumbuh' },
  { id: 'bayu', grup: 'ebt', prod: ['PLTB'], kap: 'PLTB', ruptl_mw: [0.2, 130.6], rencana_gwh: 477, rencana_pakai: false, alasan: 'tumbuh' },
  { id: 'bio', grup: 'ebt', prod: ['PLTBg', 'PLTBm', 'PLTSa'], kap: 'PLT Bio', ruptl_mw: [0.5, 152.2], rencana_gwh: 3871, rencana_pakai: false, alasan: 'cakupan' },
];
export const CELAH = [
  'Produksi per unit atau per pembangkit tidak ada di data repo (GEM hanya memuat kapasitas; laporan operator tidak dipanen), maka tingkat terendah adalah jenis pembangkit per provinsi, bukan per unit.',
  'Produksi Statistik ESDM 2024 hanya produksi PLN (termasuk sewa dan beli IPP), sedangkan kapasitas ESDM mencakup semua pengusaha (termasuk captive dan non-PLN): faktor kapasitas per provinsi adalah batas bawah, terutama PLTS (PLTS atap dan captive tidak masuk produksi PLN) dan biomassa.',
  'Faktor kapasitas nasional memakai kapasitas sistem PLN dari RUPTL (Oktober 2024, tanpa Batam) dan produksi ESDM setahun penuh yang memuat Batam; kapasitas akhir tahun tidak diketahui, jadi angka tetap EST.',
  'Pembanding rencana RUPTL = energi rencana 2025 (skenario RE Base) dibagi kapasitas 2024 dan 8760 jam. Hanya dihitung untuk jenis yang armadanya relatif tetap (PLTU, gas, air, panas bumi); untuk PLTS, PLTB, biomassa, dan PLTD dibiarkan kosong karena kapasitas tumbuh cepat atau cakupannya berbeda, sehingga hasilnya menyesatkan.',
  'Asumsi faktor kapasitas rencana dari IRENA atau RUPTL per proyek tidak dibaca: RUPTL tidak menyebut angka faktor kapasitas per jenis, dan rilis IRENA tidak diunduh dalam gelombang ini. Laporan emiten tidak tersedia di data repo.',
  'Produksi yang melebihi kapasitas terpasang (PLTA Kalimantan Barat: 962 GWh dari 6 MW, diduga listrik impor yang tercatat pada jenis air) ditandai anomali dan tidak dihitung.',
  'PLTGB (450 MW) dan PLT Lain (18 MW) pada kapasitas ESDM tidak dipetakan ke jenis mana pun.',
];
const r1 = (v) => Math.round(v * 10) / 10;
const jum = (o, ks) => ks.reduce((s, k) => s + (o[k] || 0), 0);
export const fk = (gwh, mw) => (mw > 0 && gwh >= 0 ? r1((gwh * 1000) / (mw * JAM) * 100) : null);
export function bangun() {
  const S = JSON.parse(fs.readFileSync(AKAR + 'public/data/statistik_pln.json', 'utf8'));
  const nas = [];
  for (const T of TEK) {
    const produksi = Math.round(S.baris.reduce((s, b) => s + jum(b.produksi_pln_gwh, T.prod), 0) * 100) / 100;
    const kapEsdm = S.baris.reduce((s, b) => s + (b.kapasitas_terpasang_mw[T.kap] || 0), 0);
    const kapRuptl = Math.round(T.ruptl_mw.reduce((a, b) => a + b, 0) * 10) / 10;
    nas.push({ id: T.id, grup: T.grup, produksi_gwh: produksi, kapasitas_ruptl_mw: kapRuptl, kapasitas_esdm_mw: kapEsdm, fk_aktual: fk(produksi, kapRuptl), fk_batas_bawah: fk(produksi, kapEsdm),
      rencana_gwh_2025: T.rencana_gwh, fk_rencana: T.rencana_pakai ? fk(T.rencana_gwh, kapRuptl) : null, alasan_rencana_kosong: T.rencana_pakai ? null : T.alasan,
      sumber_ids: ['s-esdm', 's-ruptl-kap', 's-ruptl-energi'], tingkat_bukti: 'resmi', tanggal: TGL });
  }
  const wilayah = S.baris.map((b) => ({ kode: b.kode, provinsi: b.provinsi, tek: Object.fromEntries(TEK.map((T) => {
    const kap = b.kapasitas_terpasang_mw[T.kap] || 0, p = Math.round(jum(b.produksi_pln_gwh, T.prod) * 100) / 100;
    const f = fk(p, kap), ganjil = f != null && f > 100; // produksi melebihi kapasitas (mis. listrik impor Sarawak tercatat sebagai PLTA Kalbar): bukan faktor kapasitas
    return [T.id, { kap_mw: kap, prod_gwh: p, fk: ganjil ? null : f, ...(ganjil ? { anomali: true } : {}) }];
  })), sumber_ids: ['s-esdm'], tingkat_bukti: 'resmi', tanggal: TGL }));
  return { lapis: 'publik', dibangun_pada: TGL, tahun_data: 2024, jam_setahun: JAM, sumber: SUMBER, nasional: nas, wilayah, meta: { diperbarui: TGL, celah: CELAH } };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const d = bangun(); fs.writeFileSync(AKAR + 'public/data/kinerja_pembangkit.json', JSON.stringify(d) + '\n');
  console.log(d.nasional.map((n) => `${n.id} ${n.fk_aktual}/${n.fk_batas_bawah}/${n.fk_rencana}`).join(' | '), 'wilayah', d.wilayah.length);
}
