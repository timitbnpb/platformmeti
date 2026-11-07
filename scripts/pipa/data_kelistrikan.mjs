// public/data/kelistrikan.json: 38 provinsi. Tanpa jaringan; tanggal dari masukan.
// Masukan: data/strategis/kelistrikan_2024.json (Statistik Ketenagalistrikan 2024: Tabel 7, 37, 42, 38) + public/data/wilayah.json (penduduk, PDRB, kapasitas).
//   node scripts/pipa/data_kelistrikan.mjs <tgl>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const URL_STAT = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/91fa8-buku-statistik-ketenagalistrikan-2024.pdf';
export const SUMBER = [
  { id: 'stat-ketenagalistrikan-2024', judul: 'Statistik Ketenagalistrikan Tahun 2024 (Tabel 7, 22, 37, 38, 42)', penerbit: 'Direktorat Jenderal Ketenagalistrikan, Kementerian ESDM', tahun: 2024, url: URL_STAT },
  { id: 'wilayah-json', judul: 'Penduduk dan PDRB provinsi (public/data/wilayah.json; Wikipedia id mengutip BPS)', penerbit: 'METI Network (via Wikipedia, sumber asli BPS)', tahun: 2025, url: '/data/wilayah.json' },
];
export function bangun(seed, wilayah, tanggal) {
  const wp = new Map(); for (const g of seed.wilayah_pln) for (const p of g.provinsi) if (g.id !== 'batam') wp.set(p, g);
  const wil = new Map(wilayah.baris.map((b) => [b.nama, b]));
  const baris = seed.rasio_elektrifikasi.map((r) => {
    const w = wil.get(r.provinsi); const g = wp.get(r.provinsi); const tunggal = g && g.provinsi.length === 1;
    const penduduk = w?.identitas?.penduduk ?? null;
    // PLN Batam menjual di Kepulauan Riau tetapi tercatat terpisah: Kepri tidak dihitung tunggal (Riau+Kepri sudah gabungan).
    const penjualan = tunggal ? g.penjualan_gwh : null;
    return {
      kode: w?.kode ?? null, provinsi: r.provinsi, tahun: seed.tahun,
      rasio_elektrifikasi_persen: r.rasio_persen, rumah_tangga_berlistrik_pln: r.rt_pln, rumah_tangga_berlistrik_non_pln: r.rt_non_pln, rumah_tangga_berlistrik_jumlah: r.rt_jumlah,
      wilayah_pln_id: g?.id ?? null, wilayah_pln_gabungan: g ? !tunggal : null,
      penjualan_pln_gwh: penjualan, pelanggan_pln: tunggal ? g.pelanggan : null,
      penduduk, penduduk_tahun: w?.identitas?.penduduk_tahun ?? null, pdrb_triliun_rp: w?.identitas?.pdrb?.triliun ?? null, pdrb_tahun: w?.identitas?.pdrb?.tahun ?? null,
      kapasitas_terpasang_mw: w?.listrik?.kapasitas_jenis_mw?.total ?? null, kapasitas_tahun: w?.listrik?.kapasitas_jenis_mw?.tahun ?? null,
      konsumsi_per_kapita_kwh_est: penjualan && penduduk ? Math.round((penjualan * 1e6) / penduduk) : null,
      sumber: { rasio_elektrifikasi: { sumber_id: 'stat-ketenagalistrikan-2024', tahun: 2024, halaman: seed.halaman.rasio }, penjualan_pelanggan: { sumber_id: 'stat-ketenagalistrikan-2024', tahun: 2024, halaman: seed.halaman.penjualan + '; ' + seed.halaman.pelanggan }, penduduk_pdrb: { sumber_id: 'wilayah-json', tahun: 2025 }, kapasitas: { sumber_id: 'stat-ketenagalistrikan-2024', tahun: 2024, halaman: 'Tabel 22 hlm 22' } },
      tingkat_bukti: 'resmi',
    };
  });
  return {
    meta: {
      diperbarui: tanggal, tahun_data: seed.tahun, jumlah: baris.length,
      nasional: { rasio_elektrifikasi_persen: seed.total.rasio_nasional, penjualan_pln_gwh: seed.total.penjualan_pln_gwh, pelanggan_pln: seed.total.pelanggan, rumah_tangga_berlistrik: seed.total.rt_berlistrik, konsumsi_per_kapita: seed.konsumsi_per_kapita_nasional, sumber_id: 'stat-ketenagalistrikan-2024' },
      wilayah_pln: seed.wilayah_pln,
      rumus: { konsumsi_per_kapita_kwh_est: 'penjualan_pln_gwh x 1.000.000 / penduduk (EST; penjualan PLN 2024, penduduk 2025; tanpa listrik non-PLN)' },
      celah: [
        'Penjualan (GWh) dan pelanggan hanya terbit per wilayah PLN (Tabel 37 dan 42), sebagian gabungan beberapa provinsi; provinsi di wilayah gabungan bernilai null dan menunjuk wilayah_pln_id (lihat meta.wilayah_pln). Jumlah pelanggan dan penjualan tahun 2024 saja.',
        'Konsumsi per kapita resmi hanya nasional (1.411 kWh, 2024); angka provinsi di sini EST dari penjualan PLN per penduduk, hanya untuk wilayah PLN satu provinsi, dan lebih rendah dari konsumsi sebenarnya (tanpa non-PLN).',
        'Penduduk dan PDRB berasal dari Wikipedia yang mengutip BPS (via pihak ketiga); BPS tidak dipanen langsung (API butuh kunci, halaman tabel SPA).',
        'Rasio elektrifikasi PLN Batam termasuk Kepulauan Riau; Kepulauan Riau digabung dengan Riau pada wilayah PLN.',
      ],
    },
    sumber: SUMBER, baris,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tgl = process.argv[2]; if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) throw new Error('pakai: data_kelistrikan.mjs YYYY-MM-DD');
  fs.writeFileSync(path.join(ROOT, 'public/data/kelistrikan.json'), JSON.stringify(bangun(baca('data/strategis/kelistrikan_2024.json'), baca('public/data/wilayah.json'), tgl)) + '\n');
  console.log('kelistrikan.json ok');
}
