// Emisi GRK sektor energi. SIGN SMART KLHK tidak terjangkau (DNS signsmart.menlhk.go.id tidak ditemukan); Climate Watch /api/ dilarang robots.txt.
// Yang terbuka dan sah: capaian MITIGASI GRK subbidang ketenagalistrikan nasional (Statistik Ketenagalistrikan 2024, Tabel 18). Itu mitigasi, BUKAN emisi.
// Pakai: node scripts/pipa/emisi_provinsi.mjs [pdf]
import path from 'node:path';
import { AKAR, TANGGAL, halamanPdf, tulis, angka } from './_panen_umum.mjs';

const URL_PDF = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/91fa8-buku-statistik-ketenagalistrikan-2024.pdf';

export function bangun(pdf) {
  const teks = halamanPdf(pdf, 29);
  const aw = teks.indexOf('MITIGASI GAS RUMAH KACA');
  const mitigasi = [...teks.slice(aw).matchAll(/\b(20\d\d)\s+(\d+,\d+)/g)].map(m => ({ tahun: +m[1], juta_ton_co2: angka(m[2]) }));
  return {
    jenis: 'emisi_provinsi', sumber: 'Statistik Ketenagalistrikan Tahun 2024, ESDM Gatrik, Tabel 18 hlm 15', url: URL_PDF,
    tanggal_ambil: TANGGAL, tingkat_bukti: 'situs-sendiri', lisensi: 'publikasi pemerintah terbuka; hanya angka, atribusi ESDM',
    nasional: {
      emisi_energi_per_subsektor: [],
      mitigasi_ketenagalistrikan: { satuan: 'juta ton CO2 (capaian tahun n dari perhitungan tahun n-1, per catatan sumber)', baris: mitigasi },
    },
    provinsi: [],
    meta: {
      catatan: 'provinsi sengaja kosong dan emisi nasional per subsektor kosong: tidak ada sumber emisi yang terbuka dan terjangkau. mitigasi BUKAN emisi dan tidak boleh ditampilkan sebagai emisi.',
      celah: [
        'SIGN SMART KLHK (signsmart.menlhk.go.id): host tidak ter-resolve dari lingkungan panen pada 2026-11-07; coba ulang dari jaringan lain.',
        'Climate Watch (WRI): /api/ dilarang robots.txt, tidak dipanggil.',
        'Emisi sektor energi per provinsi dan per subsektor nasional: tidak ada; perlu SIGN SMART atau Laporan Inventarisasi GRK/BUR (KLHK) yang diunduh manual.',
      ],
    },
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const pdf = process.argv.find(a => a.endsWith('.pdf')) || path.join(AKAR, 'pdf/statistik-ketenagalistrikan-2024.pdf');
  const o = bangun(pdf);
  tulis(path.join(AKAR, 'public/data/emisi_provinsi.json'), o);
  console.log('emisi_provinsi: mitigasi', JSON.stringify(o.nasional.mitigasi_ketenagalistrikan.baris));
}
