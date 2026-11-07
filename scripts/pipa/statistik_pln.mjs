// Statistik PLN/ESDM per provinsi: kapasitas terpasang (Tabel 22), produksi PLN (Tabel 35), penjualan + pelanggan per wilayah PLN (Tabel 37, 42).
// Sumber: Statistik Ketenagalistrikan Tahun 2024 (ESDM Gatrik). Pakai: node scripts/pipa/statistik_pln.mjs [pdf]
// Tabel 37/42 berbentuk sel gabungan per wilayah PLN (bukan provinsi): disalin dari data/strategis/kelistrikan_2024.json (sudah diaudit terhadap total nasional).
import path from 'node:path';
import { AKAR, TANGGAL, kodeProvinsi, halamanPdf, barisTabel, tulis, bacaRef } from './_panen_umum.mjs';

const URL_PDF = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/91fa8-buku-statistik-ketenagalistrikan-2024.pdf';
const JENIS_KAP = ['PLTU/MT', 'PLTG/GU/MG/MGU', 'PLTD', 'PLTA/M', 'PLTB', 'PLT Bio', 'PLTP', 'PLTS', 'PLTGB', 'PLT Lain', 'total'];
const JENIS_PROD = ['PLTA', 'PLTB', 'PLTBg', 'PLTBm', 'PLTD', 'PLTG', 'PLTGU', 'PLTM', 'PLTMG', 'PLTMH', 'PLTP', 'PLTS', 'PLTSa', 'PLTU', 'total'];
const peta = (kunci, nilai) => Object.fromEntries(kunci.map((k, i) => [k, nilai[i]]));

export function bangun(pdf) {
  const kap = barisTabel(halamanPdf(pdf, 36), 11);
  const prod = barisTabel(halamanPdf(pdf, 57), 15);
  const wilayah = bacaRef('data/strategis/kelistrikan_2024.json').wilayah_pln;
  const wilOf = nama => wilayah.filter(w => w.provinsi.includes(nama) && w.id !== 'batam').map(w => w.id);
  const per = new Map();
  const ambil = (nama) => { const p = kodeProvinsi(nama); if (!p) return null; if (!per.has(p.kode)) per.set(p.kode, { kode: p.kode, provinsi: p.nama }); return per.get(p.kode); };
  for (const b of kap) { const r = ambil(b.nama); if (r) r.kapasitas_terpasang_mw = peta(JENIS_KAP, b.nilai); }
  for (const b of prod) { const r = ambil(b.nama); if (r) r.produksi_pln_gwh = peta(JENIS_PROD, b.nilai); }
  const baris = [...per.values()].sort((a, b) => a.kode.localeCompare(b.kode)).map(r => ({
    ...r, tahun: 2024, wilayah_pln: wilOf(r.provinsi),
    beban_puncak_mw: null, bpp_rp_per_kwh: null,
    sumber_url: URL_PDF, tanggal_periksa: TANGGAL, tingkat_bukti: 'situs-sendiri',
  }));
  return {
    sumber: 'Statistik Ketenagalistrikan Tahun 2024, Ditjen Ketenagalistrikan ESDM (Tabel 22 hlm 22, 35 hlm 43, 37 hlm 45, 42 hlm 52)',
    url: URL_PDF, tanggal_ambil: TANGGAL, tingkat_bukti: 'situs-sendiri', lisensi: 'publikasi pemerintah terbuka; hanya angka, atribusi ESDM', tahun: 2024,
    satuan: { kapasitas_terpasang_mw: 'MW (semua pengusaha: PLN + non-PLN)', produksi_pln_gwh: 'GWh (produksi PLN termasuk sewa dan beli IPP, termasuk PLN Batam)', penjualan_gwh: 'GWh', pelanggan: 'jumlah' },
    wilayah_pln: wilayah,
    meta: {
      catatan: 'Penjualan dan pelanggan hanya tersedia per wilayah PLN (gabungan beberapa provinsi), maka berada di wilayah_pln, bukan di tiap provinsi; baris provinsi menunjuk id wilayah_pln. Pelanggan PLN Batam tidak terbit terpisah.',
      celah: [
        'Beban puncak per sistem/provinsi dan BPP per sistem: tidak ada di buku ESDM 2024; web.pln.co.id (Statistik PLN) tidak dapat diakses (DNS tidak ditemukan dari lingkungan panen), RUPTL tidak dipanen. Dibiarkan null.',
        'Hanya tahun 2024. Buku 2020-2023 tersedia di gatrik (daftar di download-index) tetapi belum diurai.',
      ],
    },
    baris,
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const pdf = process.argv.find(a => a.endsWith('.pdf')) || path.join(AKAR, 'pdf/statistik-ketenagalistrikan-2024.pdf');
  const o = bangun(pdf);
  tulis(path.join(AKAR, 'public/data/statistik_pln.json'), o);
  console.log('statistik_pln:', o.baris.length, 'provinsi');
}
