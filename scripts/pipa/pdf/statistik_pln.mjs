// Adapter Statistik Ketenagalistrikan 2024 (Ditjen Ketenagalistrikan ESDM; "Statistik PLN" per provinsi): Tabel 22 kapasitas terpasang per jenis per provinsi, Tabel 35 produksi PLN.
// Memakai pengurai baris yang sama dengan scripts/pipa/statistik_pln.mjs (barisTabel); beda: sitasi halaman per baris.
import { barisTabel, angka } from '../_panen_umum.mjs';

const KAP = [['pltu_mt', 'PLTU/MT'], ['pltg_gu', 'PLTG/GU/MG/MGU'], ['pltd', 'PLTD'], ['plta_m', 'PLTA/M'], ['pltb', 'PLTB'], ['plt_bio', 'PLT Bio'], ['pltp', 'PLTP'], ['plts', 'PLTS'], ['pltgb', 'PLTGB'], ['plt_lain', 'PLT Lain'], ['total', 'Total']];
const PROD = [['plta', 'PLTA'], ['pltb', 'PLTB'], ['pltbg', 'PLTBg'], ['pltbm', 'PLTBm'], ['pltd', 'PLTD'], ['pltg', 'PLTG'], ['pltgu', 'PLTGU'], ['pltm', 'PLTM'], ['pltmg', 'PLTMG'], ['pltmh', 'PLTMH'], ['pltp', 'PLTP'], ['plts', 'PLTS'], ['pltsa', 'PLTSa'], ['pltu', 'PLTU'], ['total', 'Total']];

/** Halaman bertabel: judul 'Tabel N' di baris awal. Mengembalikan indeks halaman (0-based) atau -1. */
const halamanTabel = (halaman, no) => halaman.findIndex((p) => new RegExp(`^\\s*Tabel ${no}\\s*$`, 'm').test(p.split('\n').slice(0, 6).join('\n')));

export function bangunTabel(teks, spek, nilaiN, halamanNo) {
  return barisTabel(teks, nilaiN).map((b) => ({ provinsi: b.nama, ...Object.fromEntries(spek.map(([k], i) => [k, b.nilai[i]])), halaman: halamanNo }));
}

export default {
  id: 'statistik-ketenagalistrikan-2024', judul: 'Statistik Ketenagalistrikan Tahun 2024', penerbit: 'Direktorat Jenderal Ketenagalistrikan, Kementerian ESDM', tanggal_dokumen: '2025-09-15', versi: 'edisi 2024 (data 2024)',
  sumber_url: 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/91fa8-buku-statistik-ketenagalistrikan-2024.pdf',
  unduh_url: 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/91fa8-buku-statistik-ketenagalistrikan-2024.pdf',
  berkas: 'statistik-ketenagalistrikan-2024.pdf', catatan: 'Tanggal dokumen dari metadata PDF. Statistik PLN (web.pln.co.id) tidak terjangkau dari lingkungan panen (DNS); buku ESDM ini memuat angka kelistrikan nasional termasuk PLN.',
  ekstrak(halaman) {
    const a = halamanTabel(halaman, 22), b = halamanTabel(halaman, 35);
    const tabel = [];
    const kol = (spek) => [{ k: 'provinsi', label: 'Provinsi', tipe: 'teks' }, ...spek.map(([k, label]) => ({ k, label, tipe: 'angka' }))];
    if (a >= 0) tabel.push({ id: 'kapasitas-provinsi', judul: 'Kapasitas terpasang pembangkit per jenis per provinsi, 2024', satuan: 'MW', catatan: 'Tabel 22; semua pengusaha (PLN dan non-PLN).', kolom: kol(KAP), baris: bangunTabel(halaman[a], KAP, 11, a + 1) });
    if (b >= 0) tabel.push({ id: 'produksi-pln-provinsi', judul: 'Produksi tenaga listrik PLN per jenis per provinsi, 2024', satuan: 'GWh', catatan: 'Tabel 35.', kolom: kol(PROD), baris: bangunTabel(halaman[b], PROD, 15, b + 1) });
    return tabel;
  },
};
