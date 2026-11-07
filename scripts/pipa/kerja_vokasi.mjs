#!/usr/bin/env node
// Pasokan SDM vokasi untuk /kerja -> public/data/kerja_vokasi.json.
//   prodi : daftar kurasi dari halaman resmi kampus / Kementerian ESDM (setiap baris bertautan sumber + tanggal periksa).
//           PDDikti TIDAK dipanen: situsnya SPA yang memanggil api-pddikti tanpa kredensial (401) dan robots melarang /search/ (lihat meta.celah).
//   lsp   : LSP berlisensi BNSP bersekema EBT/konservasi energi, dari public/data/prodi_pelatihan.json (panen BNSP 8 Nov 2026), dipetakan ke provinsi lewat alamat badan.
//   smk   : kosong; Dapodik/referensi Kemdikbud tidak terjangkau dan belum ada sumber publik terstruktur yang sopan (meta.celah).
//   node scripts/pipa/kerja_vokasi.mjs [--selftest]
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { kodeProvLokasi } from './kerja_panen.mjs';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const TGL = '2026-11-08';
const ESDM = 'https://esdm.go.id/id/media-center/arsip-berita/program-d4-spesialisasi-1-tahun-energi-terbarukan-dibuka-di-5-politeknik-ini';
export const PRODI = [
  { nama: 'D4 Spesialisasi Energi Terbarukan (1 tahun)', kampus: 'Politeknik Negeri Bali', jenis: 'politeknik', provinsi: '51', sumber_url: ESDM, catatan: 'Spesialisasi surya, hidro, dan hibrida bagi lulusan D3 teknik; kuliah perdana September 2022' },
  { nama: 'D4 Spesialisasi Energi Terbarukan (1 tahun)', kampus: 'Politeknik Energi dan Mineral Akamigas Cepu', jenis: 'politeknik', provinsi: '33', sumber_url: ESDM, catatan: 'Spesialisasi surya, hidro, dan hibrida bagi lulusan D3 teknik; kuliah perdana September 2022' },
  { nama: 'D4 Spesialisasi Energi Terbarukan (1 tahun)', kampus: 'Politeknik Negeri Jakarta', jenis: 'politeknik', provinsi: '31', sumber_url: ESDM, catatan: 'Spesialisasi surya, hidro, dan hibrida bagi lulusan D3 teknik; kuliah perdana September 2022' },
  { nama: 'D4 Spesialisasi Energi Terbarukan (1 tahun)', kampus: 'Politeknik Negeri Manado', jenis: 'politeknik', provinsi: '71', sumber_url: ESDM, catatan: 'Spesialisasi surya, hidro, dan hibrida bagi lulusan D3 teknik; kuliah perdana September 2022' },
  { nama: 'D4 Spesialisasi Energi Terbarukan (1 tahun)', kampus: 'Politeknik Negeri Ujung Pandang', jenis: 'politeknik', provinsi: '73', sumber_url: ESDM, catatan: 'Spesialisasi surya, hidro, dan hibrida bagi lulusan D3 teknik; kuliah perdana September 2022' },
  { nama: 'D4 Teknologi Rekayasa Konversi Energi', kampus: 'Institut Teknologi Sepuluh Nopember (Departemen Teknik Mesin Industri)', jenis: 'perguruan-tinggi', provinsi: '35', sumber_url: 'https://www.its.ac.id/tmi/?p=6614', catatan: 'Pembangkitan energi listrik dan energi terbarukan' },
  { nama: 'D4 Teknologi Pembangkit Tenaga Listrik', kampus: 'Politeknik Negeri Bandung', jenis: 'politeknik', provinsi: '32', sumber_url: 'https://www.polban.ac.id/upload/profil/D4_Teknologi_Pembangkit_Tenaga%20Listrik_POLBAN.pdf', catatan: 'Profil lulusan mencakup energi baru dan terbarukan' },
  { nama: 'D4 Teknologi Rekayasa Pembangkit Energi', kampus: 'Politeknik Negeri Batam', jenis: 'politeknik', provinsi: '21', sumber_url: 'https://polibatam.ac.id/wp-content/uploads/2021/12/Sarjana-Terapan-Teknologi-Rekayasa-Pembangkit-Energi.pdf', catatan: '' },
  { nama: 'D4 Teknik Energi Terbarukan', kampus: 'Politeknik Negeri Jember', jenis: 'politeknik', provinsi: '35', sumber_url: 'https://sipora.polije.ac.id/view/divisions/tet-3/2021.default.html', catatan: 'Sumber hanya repositori publikasi prodi; periksa langsung ke kampus' },
].map((p) => ({ ...p, lulusan_per_tahun: null, tanggal_periksa: TGL, tingkat_bukti: 'resmi' }));

export function lspBaris(pp) {
  return pp.lsp.filter((l) => l.status_lisensi === 'Aktif' && l.skema_ebt?.length).map((l) => ({
    nama: l.nama, jenis: l.jenis, provinsi: kodeProvLokasi(l.alamat) || '', skema_ebt: l.skema_ebt.slice(0, 6),
    sumber_url: l.sumber_url, tanggal_periksa: l.tanggal_periksa, tingkat_bukti: 'resmi',
  }));
}

function utama() {
  const pp = JSON.parse(fs.readFileSync(AKAR + 'public/data/prodi_pelatihan.json', 'utf8'));
  const lsp = lspBaris(pp);
  const out = {
    diperbarui: TGL, prodi: PRODI, lsp, smk: [],
    sumber: [
      { id: 'esdm-d4', judul: 'Program D4 spesialisasi 1 tahun energi terbarukan dibuka di 5 politeknik', penerbit: 'Kementerian ESDM', url: ESDM },
      { id: 'bnsp', judul: 'Daftar LSP berlisensi', penerbit: 'BNSP', url: 'https://bnsp.go.id/lsp' },
    ],
    meta: { catatan: 'Titik pasokan = prodi tercatat + LSP aktif bersekema EBT per provinsi. Bukan jumlah lulusan; jumlah lulusan tidak diterbitkan di sumber yang dipakai (lulusan_per_tahun = null). Daftar prodi adalah kurasi, bukan sensus lengkap.',
      celah: ['PDDikti tidak dipanen: SPA yang memanggil api-pddikti (401 tanpa kredensial) dan robots melarang /search/. Daftar prodi lengkap dan jumlah lulusan menunggu data terbuka resmi atau izin tertulis.', 'SMK program keahlian energi terbarukan: Dapodik dan referensi Kemdikbud tidak terjangkau/tanpa sumber publik terstruktur; belum ada baris.', `${lsp.filter((l) => !l.provinsi).length} LSP tanpa provinsi terbaca dari alamat badan.`] },
  };
  fs.writeFileSync(AKAR + 'public/data/kerja_vokasi.json', JSON.stringify(out, null, 1) + '\n');
  console.log('prodi', PRODI.length, 'lsp', lsp.length, 'tanpa provinsi', lsp.filter((l) => !l.provinsi).length);
}
function selftest() {
  assert.ok(PRODI.every((p) => /^https:\/\//.test(p.sumber_url) && /^\d{2}$/.test(p.provinsi)));
  assert.equal(lspBaris({ lsp: [{ nama: 'X', status_lisensi: 'Aktif', skema_ebt: ['a'], alamat: 'Jl. A, Bandung', sumber_url: 'u' }, { nama: 'Y', status_lisensi: 'Mati', skema_ebt: ['a'], alamat: '' }] })[0].provinsi, '32');
  console.log('selftest ok');
}
if (process.argv.includes('--selftest')) selftest(); else if (process.argv[1] === fileURLToPath(import.meta.url)) utama();
