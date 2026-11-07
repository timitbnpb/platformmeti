// Papan RUED dibanding realisasi per provinsi -> public/data/rued_capaian.json.
// Pakai: node scripts/pipa/rued_capaian.mjs [--tanggal=YYYY-MM-DD]
// Metode (terbuka, ditulis juga di keluaran.metode): target = bauran energi primer EBT 2025 menurut Perda RUED (public/data/rued.json);
// realisasi = pangsa KAPASITAS terpasang EBT (PLTA, PLTB, PLT bio, PLTP, PLTS) dari Statistik Ketenagalistrikan 2024. Dua ukuran berbeda
// (bauran energi vs kapasitas), jadi rasio hanya pendekatan dan SELALU berlabel Hipotesis. Target jenis pemodelan/ruen juga ditandai perlu tinjau.
// Status: tercapai bila rasio >= 1; di jalur bila >= 0,75; tertinggal bila < 0,75. Tanpa target = tanpa status (bukan nol).
import fs from 'node:fs';
import path from 'node:path';
import { AKAR, TANGGAL, tulis } from './_panen_umum.mjs';

export const AMBANG_JALUR = 0.75;
export const statusDari = (rasio) => (rasio == null ? null : rasio >= 1 ? 'tercapai' : rasio >= AMBANG_JALUR ? 'di-jalur' : 'tertinggal');
const bulat = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

export function bangun(rued) {
  const baris = rued.baris.map((b) => {
    const t25 = b.target?.ebt_2025_persen ?? null, real = b.realisasi?.pangsa_kapasitas_persen ?? null;
    const rasio = t25 && real != null ? real / t25 : null;
    return {
      kode: b.kode, provinsi: b.provinsi, perda: b.perda,
      target_2025_persen: t25, target_akhir: b.target?.ebt_akhir ?? null, jenis_target: b.target?.jenis ?? null,
      realisasi_persen: real, realisasi_tahun: b.realisasi?.tahun ?? null, ebt_mw: b.realisasi?.ebt_mw ?? null, total_mw: b.realisasi?.total_mw ?? null,
      selisih_poin: t25 != null && real != null ? bulat(real - t25) : null,
      rasio_persen: rasio == null ? null : bulat(rasio * 100, 0),
      status: statusDari(rasio),
      hipotesis: true, perlu_tinjau: ['pemodelan', 'ruen'].includes(b.target?.jenis) || null,
      alasan_kosong: t25 == null ? (b.kutipan || 'Perda tidak memuat angka persentase target') : real == null ? 'Statistik 2024 tidak memuat provinsi ini' : null,
      sumber_url: b.sumber_url, url_pdf: b.url_pdf, realisasi_sumber_url: b.realisasi?.sumber_url ?? null, tanggal_periksa: b.tanggal_periksa,
    };
  });
  const dgn = baris.filter((b) => b.status);
  return {
    lapis: 'publik', dibangun_pada: TANGGAL,
    metode: 'Target: bauran energi primer EBT 2025 menurut Perda RUED. Realisasi: pangsa kapasitas terpasang EBT 2024 (Statistik Ketenagalistrikan). Rasio = realisasi dibagi target; ukuran berbeda, maka Hipotesis. Tercapai bila rasio 1 atau lebih, di jalur bila 0,75 atau lebih, tertinggal bila kurang.',
    ambang_jalur: AMBANG_JALUR, jumlah: baris.length, dengan_status: dgn.length,
    ringkas: { tercapai: dgn.filter((b) => b.status === 'tercapai').length, 'di-jalur': dgn.filter((b) => b.status === 'di-jalur').length, tertinggal: dgn.filter((b) => b.status === 'tertinggal').length },
    baris,
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const o = bangun(JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data/rued.json'), 'utf-8')));
  tulis(path.join(AKAR, 'public/data/rued_capaian.json'), o);
  console.log('rued_capaian:', o.dengan_status, 'dari', o.jumlah, JSON.stringify(o.ringkas));
}
