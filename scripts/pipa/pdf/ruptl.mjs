// Adapter RUPTL PT PLN 2025-2034: Tabel 5.80 (RE Base) dan 5.81 (ARED) kebutuhan tambahan pembangkit dan storage, seluruh Indonesia (MW).
// Daftar proyek bernama per provinsi tetap di scripts/panen/panen_proyek.mjs (public/data/ruptl.json); ini angka agregat nasional untuk rekonsiliasi.
import { token, angkaId, barisAntara } from '../ekstrak_pdf.mjs';

const TAHUN = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034];
const GRUP = { PLN: 'PLN', 'SH-PLN': 'SH-PLN', IPP: 'IPP', Total: 'Total', 'Kerjasama Wilus': 'Kerjasama Wilus' };
const JENIS = new Set(['PLTU', 'PLTU MT', 'PLTP', 'PLTN', 'PLTGU', 'PLTG', 'PLTMG', 'PLTD', 'PLTBg', 'PLTM', 'PLTA', 'PLTA PS', 'PLTS', 'PLTS+BESS', 'PLTB', 'PLTSa', 'PLTBM', 'PLTAL', 'BESS', 'PLT Lain', 'Jumlah']);

/** Baris "Jenis  v1 ... v10 jumlah" (11 sel) dengan grup berjalan. Penjumlahan tahun harus sama dengan kolom Jumlah, selain itu perlu_tinjau. */
export function barisTabelRuptl(potong) {
  const keluar = []; let grup = null;
  for (const { baris, halaman } of potong) {
    const t = token(baris);
    if (!t.length) continue;
    const kepala = Object.keys(GRUP).find((k) => baris.trim() === k);
    if (kepala) { grup = GRUP[kepala]; continue; }
    // jenis dapat berspasi ("PLTU MT", "PLTA PS", "PLT Lain"): ambil awalan terpanjang yang dikenal
    let n = Math.min(2, t.length - 1), jenis = null;
    for (; n >= 1; n--) if (JENIS.has(t.slice(0, n).join(' '))) { jenis = t.slice(0, n).join(' '); break; }
    const sel = jenis ? t.slice(n) : [];
    if (!grup || !jenis || sel.length !== 11) continue;
    const v = sel.map(angkaId);
    if (v.some(Number.isNaN)) continue;
    const bintang = sel.some((x) => x.endsWith('*'));
    const jumlah = v.slice(0, 10).reduce((a, b) => a + (b || 0), 0);
    const cocok = Math.abs(jumlah - (v[10] || 0)) <= 10; // pembulatan sel
    keluar.push({ kelompok: grup, jenis, ...Object.fromEntries(TAHUN.map((y, i) => [`y${y}`, v[i]])), jumlah: v[10], halaman, ...(cocok && !bintang ? {} : { perlu_tinjau: true, ...(bintang ? { catatan: 'bertanda * di sumber' } : {}) }) });
  }
  return keluar;
}

const kolom = [{ k: 'kelompok', label: 'Pengembang', tipe: 'teks' }, { k: 'jenis', label: 'Jenis', tipe: 'teks' }, ...TAHUN.map((y) => ({ k: `y${y}`, label: String(y), tipe: 'angka' })), { k: 'jumlah', label: 'Jumlah', tipe: 'angka' }];

export default {
  id: 'ruptl-2025-2034', judul: 'RUPTL PT PLN (Persero) 2025-2034', penerbit: 'PT PLN (Persero); disahkan Kementerian ESDM', tanggal_dokumen: '2025-05-26', versi: 'Kepmen ESDM 188.K/TL.03/MEM.L/2025',
  sumber_url: 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf',
  unduh_url: 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf',
  berkas: 'ruptl-2025-2034.pdf', catatan: 'Agregat nasional Tabel 5.80 dan 5.81. Daftar proyek bernama per provinsi ada di Direktori proyek (public/data/ruptl.json, 271 pembangkit EBT bernama).',
  ekstrak(halaman) {
    const a = barisAntara(halaman, /Tabel 5\.80\s+Kebutuhan Tambahan/, /Tabel 5\.81\s+Kebutuhan Tambahan/);
    const b = barisAntara(halaman, /Tabel 5\.81\s+Kebutuhan Tambahan/, /Tabel 5\.8[2-9]\s|Tabel 5\.9\d\s/);
    return [
      { id: 'tambahan-re-base', judul: 'Tambahan pembangkit dan storage, skenario RE Base, seluruh Indonesia', satuan: 'MW', catatan: 'Tabel 5.80', kolom, baris: barisTabelRuptl(a) },
      { id: 'tambahan-ared', judul: 'Tambahan pembangkit dan storage, skenario ARED, seluruh Indonesia', satuan: 'MW', catatan: 'Tabel 5.81', kolom, baris: barisTabelRuptl(b) },
    ];
  },
};
