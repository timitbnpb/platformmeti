// Desa berlistrik per provinsi dari Statistik Ketenagalistrikan 2024 (ESDM/Ditjen Gatrik), Tabel 8-9 hlm 10 (PDF hlm 24).
// Pakai: node scripts/pipa/desa_listrik.mjs [pdf] [--tanggal=YYYY-MM-DD]   (PDF sudah diunduh di pdf/)
import path from 'node:path';
import { AKAR, TANGGAL, kodeProvinsi, halamanPdf, barisTabel, tulis, angka } from './_panen_umum.mjs';

export const SUMBER = {
  sumber: 'Statistik Ketenagalistrikan Tahun 2024, Ditjen Ketenagalistrikan ESDM, Tabel 8 dan 9 (hlm 10)',
  url: 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/91fa8-buku-statistik-ketenagalistrikan-2024.pdf',
  tanggal_ambil: TANGGAL,
  tingkat_bukti: 'situs-sendiri',
  lisensi: 'publikasi pemerintah terbuka; hanya angka, atribusi ESDM',
};

export function bangun(pdf) {
  const teks = halamanPdf(pdf, 24);
  const baris = [];
  for (const b of barisTabel(teks.split('\n').map(g => { const i = g.search(/\s\d{1,2}\s+[A-Za-z][^\d]*\s+(-|\d)/); return i < 0 ? '' : g.slice(i); }).join('\n'), 4)) {
    const p = kodeProvinsi(b.nama);
    if (!p) continue;
    const [pln, nonPln, jumlah, persen] = b.nilai;
    baris.push({ kode: p.kode, provinsi: p.nama, tahun: 2024, jumlah_desa: jumlah, desa_pln: pln, desa_non_pln: nonPln, desa_berlistrik: pln + nonPln,
      belum_berlistrik: jumlah - pln - nonPln, persen_berlistrik: persen, sumber_url: SUMBER.url, tanggal_periksa: TANGGAL, tingkat_bukti: SUMBER.tingkat_bukti });
  }
  const tot = teks.split('\n').find(g => /JUMLAH \/ TOTAL/.test(g)).trim().split(/\s+/).slice(-4).map(angka);
  const tren = [...teks.matchAll(/\b(20\d\d)\s+([\d.]+)\s+([\d.]+)\s+(\d+,\d+)/g)]
    .map(m => ({ tahun: +m[1], jumlah_desa: angka(m[2]), desa_terlistriki: angka(m[3]), persen: angka(m[4]) }));
  baris.sort((a, b) => a.kode.localeCompare(b.kode));
  return {
    ...SUMBER, jenis: 'desa_listrik',
    nasional: { tahun: 2024, jumlah_desa: tot[2], desa_pln: tot[0], desa_non_pln: tot[1], desa_berlistrik: tot[0] + tot[1], belum_berlistrik: tot[2] - tot[0] - tot[1], persen_berlistrik: tot[3], tren },
    meta: {
      catatan: 'jumlah_desa = kolom TOTAL DESA sumber; desa_berlistrik = PLN + non-PLN; belum_berlistrik = jumlah_desa - desa_berlistrik (turunan sederhana, bukan angka terbit; cocok dengan persen sumber). Tabel 9 memuat tahun 2024 saja.',
      celah: [
        'BPS Podes (desa belum berlistrik / non-PLN per kabupaten): bps.go.id adalah SPA tanpa JSON terbuka, API perlu kunci; tidak dipanen.',
        'Tingkat kabupaten dan lokasi desa 3T: tidak ada daftar terbuka yang ditemukan.',
        'Provinsi dengan desa non-PLN tinggi (Papua Pegunungan 2.084, Papua Tengah 903, Papua Barat Daya 434) = kandidat prioritas elektrifikasi, tetapi ini non-PLN (PLTS/diesel komunal), bukan desa gelap.',
      ],
    },
    baris,
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const pdf = process.argv.find(a => a.endsWith('.pdf')) || path.join(AKAR, 'pdf/statistik-ketenagalistrikan-2024.pdf');
  const o = bangun(pdf);
  tulis(path.join(AKAR, 'public/data/desa_listrik.json'), o);
  console.log('desa_listrik:', o.baris.length, 'provinsi');
}
