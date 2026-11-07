#!/usr/bin/env node
// public/data/taksonomi_ojk.json: TKBI (Taksonomi untuk Keuangan Berkelanjutan Indonesia) OJK, sektor Energi: kerangka + kriteria teknis (TSC) hijau/transisi.
// Isi disusun TANGAN (ringkasan) dari Buku TKBI Versi 2 (Bahasa, 428 hlm) dan DIJAGA oleh --bangun: tiap butir wajib punya frasa bukti pada
// halaman PDF-nya; frasa hilang = gagal. Halaman dicari otomatis. Buku v3 (Feb 2026) tidak punya PDF di halaman OJK yang dibaca: sektor energi tidak berubah selain PLTSa.
//   node scripts/pipa/taksonomi_ojk.mjs --bangun <buku-tkbi-v2.pdf> | --selftest
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { bungkus, tulis, saring } from './dataset_lib.mjs';

export const TGL = '2026-11-08';
const BUKU = 'https://keuanganberkelanjutan.ojk.go.id/keuanganberkelanjutan/Attachment/Migrasi/uploads/berita/files/file_cf2525ca-1f6a-47bf-b1bd-91d85e7f733f-23022025110322.pdf';
const HAL = 'https://keuanganberkelanjutan.ojk.go.id/keuanganberkelanjutan/ArticleList/View/1786/taksonomi-untuk-keuangan-berkelanjutan-indonesia-tkbi-versi-2';
const SUMBER = [
  { id: 's-tkbi2', judul: 'Taksonomi untuk Keuangan Berkelanjutan Indonesia (TKBI) Versi 2, Bahasa Indonesia', penerbit: 'Otoritas Jasa Keuangan', tahun: 2025, url: BUKU, halaman_rilis: HAL, lisensi: 'Publikasi OJK terbuka; ringkasan kriteria dengan atribusi, bukan salinan buku', tanggal_akses: TGL },
  { id: 's-tkbi3', judul: 'TKBI Versi 3 (siaran OJK, 5 Februari 2026)', penerbit: 'Otoritas Jasa Keuangan', tahun: 2026, url: 'https://keuanganberkelanjutan.ojk.go.id/keuanganberkelanjutan/ArticleList/View/2045/taksonomi-untuk-keuangan-berkelanjutan-indonesia-tkbi-versi-3', lisensi: 'Publikasi OJK terbuka', tanggal_akses: TGL },
];
// [id, aktivitas, kbli2017, kategori_induk, hijau, transisi, frasa_bukti (harus ada di PDF), catatan]
const T100 = 'Lifecycle emissions seluruh fasilitas < 100 gCO2e/kWh';
const T510 = 'Lifecycle emissions seluruh fasilitas >= 100 dan < 510 gCO2e/kWh';
export const AKTIVITAS = [
  ['tk_plts', 'Pembangkit listrik tenaga surya', '35101', 'pembangkit', 'Memenuhi EO1 (ATSF v2); wajib izin usaha ketenagalistrikan (IUPTLU/IUPTLS)', null, 'Jika sumber energi berasal dari tenaga surya: Telah memenuhi EO1', null],
  ['tk_pltb', 'Pembangkit listrik tenaga angin', '35101', 'pembangkit', 'Memenuhi EO1 (ATSF v2); wajib izin usaha ketenagalistrikan', null, 'Jika sumber energi berasal dari tenaga angin: Telah memenuhi EO1', null],
  ['tk_gelombang', 'Pembangkit listrik tenaga gelombang laut', '35101', 'pembangkit', 'Memenuhi EO1 (ATSF v2); wajib izin usaha ketenagalistrikan', null, 'Jika sumber energi berasal dari tenaga gelombang laut: Telah memenuhi EO1', null],
  ['tk_plta', 'Pembangkit listrik tenaga air', '35101', 'pembangkit', 'Salah satu: run-of-river; atau waduk dengan power density > 4 W/m2; atau ' + T100, T510, 'Menggunakan waduk dengan power density >4 W/m2', 'TSC PLTA disesuaikan di versi 2 mengikuti ATSF.'],
  ['tk_pltp', 'Pembangkit listrik tenaga panas bumi', '35101', 'pembangkit', T100 + ' selama jangka waktu PPA', T510 + ' selama jangka waktu PPA', 'Jika sumber energi berasal dari tenaga panas bumi', null],
  ['tk_bio', 'Pembangkit listrik tenaga bioenergi', '35101', 'pembangkit', T100 + '; sertifikasi keberlanjutan bioenergi; prosedur pemantauan kebocoran metana bila biogas; pengelolaan pasokan biomassa berkelanjutan bila kebun energi', T510 + '; prosedur kebocoran metana bila biogas', 'Jika sumber energi berasal dari tenaga bioenergi', null],
  ['tk_gas', 'Pembangkit listrik tenaga gas (termasuk gas dan uap)', '35101', 'pembangkit', T100 + '; memenuhi kriteria CCS bila memakai CCS', T510 + '; memenuhi kriteria CCS bila memakai CCS', 'Jika sumber energi berasal dari tenaga gas (termasuk gas dan uap)', null],
  ['tk_pltu', 'Pembangkit listrik tenaga uap batu bara (PLTU): percepatan pengakhiran, PLTU baru, PLTU eksisting', '35101', 'pembangkit',
    'Hanya percepatan pengakhiran: berakhir paling lama 2040; financial close sebelum 31 Des 2022; durasi operasi maks 35 tahun; terverifikasi independen/diakui program (mis. ADB ETM, JETP). PLTU baru dan eksisting: tidak ada klasifikasi hijau',
    'Percepatan pengakhiran paling lama 2050 (FC sebelum 31 Des 2022, maks 35 tahun). PLTU baru (masuk RUPTL sebelum Perpres 112/2022, atau terintegrasi industri dan dibangun paling lambat 2030) dan PLTU eksisting: komitmen kurangi emisi GRK >= 35% dalam 10 tahun terhadap rata-rata PLTU 2021; PROPER minimal Hijau; beroperasi paling lama 2050 dengan rencana transisi',
    'Percepatan pengakhiran masa operasional pembangkit batu bara dilakukan paling lama tahun 2040', 'Kriteria PLTU diringkas; baca teks buku sebelum dipakai untuk keputusan pembiayaan.'],
  ['tk_nuklir', 'Pembangkit listrik tenaga nuklir', '35101', 'pembangkit', T100 + '; standar keselamatan/keamanan/garda aman; desain reaktor teruji; dosis publik < 1 mSv/tahun; jaminan dekomisioning', null, 'dosis masyarakat <1mSv/tahun', null],
  ['tk_hidrogen', 'Pembangkit listrik tenaga gas hidrogen', '35101', 'pembangkit', T100, T510, 'Jika sumber energi berasal dari tenaga gas hidrogen', null],
  ['tk_storage', 'Penyimpanan tenaga listrik (termasuk pumped storage) terhubung jaringan', '35101', 'penyimpanan', 'Konstruksi dan pengoperasian penyimpanan terhubung jaringan (mekanis, termal, elektrokimia, pumped); EO2 hijau bila menerapkan solusi adaptasi iklim (CRVA)', null, 'Storage of electricity (termasuk pumped storage)', null],
  ['tk_td', 'Transmisi dan distribusi tenaga listrik', '35102/35103', 'jaringan', null, null, 'Aktivitas Transmisi dan Distribusi Tenaga Listrik', 'Kriteria teknis pada halaman berikutnya tidak terbaca mesin (halaman gambar); menggunakan TSC ATSF v2 dan kebijakan nasional menurut Tabel 5. Tidak diringkas di sini.'],
  ['tk_penunjang', 'Penunjang kelistrikan dan jasa konservasi/efisiensi energi', '35104', 'efisiensi', 'Melakukan efisiensi energi menurut PP 33/2023; jasa efisiensi: audit energi berstandar investasi, pembiayaan proyek efisiensi, instalasi/monitoring proyek efisiensi, O&M instalasi energi, atau pengukuran dan verifikasi kinerja energi', null, 'Pelaksanaan Audit Energi Berstandar Investasi', null],
  ['tk_uap', 'Pengadaan uap/air panas dan dingin (surya, panas bumi, bahan bakar non-fosil terbarukan, limbah panas, pompa panas listrik)', '35301', 'panas', 'Surya: memenuhi EO1; panas bumi dan bahan bakar gas/cair terbarukan: lifecycle < 28 gCO2e/MJ; limbah panas; pompa panas listrik dengan GWP refrigeran <= 675', null, 'Lifecycle emissions GRK <28 gCO2e/MJ', null],
  ['tk_mineral', 'Pertambangan mineral kritis pendukung teknologi energi bersih (15 komoditas: tembaga, nikel, lithium, kobal, bauksit, dll)', '072xx/08995/08999', 'mineral', null, 'Klasifikasi tertinggi "Transisi": roadmap pengurangan emisi tervalidasi dan lifecycle emissions turun >= 12,5% dari BAU pada 2030 (Enhanced NDC), plus kriteria kualitatif peraturan', 'lima belas jenis mineral kritis', 'Pertambangan di luar 15 mineral itu tidak masuk TKBI.'],
];
export const KERANGKA = {
  versi: 'TKBI Versi 2 (11 Feb 2025) dengan rujukan ke Versi 3 (5 Feb 2026)',
  hasil_penilaian: ['Hijau', 'Transisi', 'Tidak Memenuhi Klasifikasi'],
  tujuan_lingkungan: ['EO1 Mitigasi Perubahan Iklim', 'EO2 Adaptasi Perubahan Iklim', 'EO3 Perlindungan Ekosistem Sehat dan Keanekaragaman Hayati', 'EO4 Ketahanan Sumber Daya dan Transisi ke Ekonomi Sirkular'],
  kriteria_esensial: ['EC1 Do No Significant Harm', 'EC2 Remedial Measure to Transition', 'EC3 Aspek Sosial'],
  pendekatan: { 'non-UMKM': 'Technical Screening Criteria (TSC)', UMKM: 'Sector Agnostic Decision Tree (SDT)' },
  sektor_per_versi: { v1_feb2024: 'Energi', v2_feb2025: 'Konstruksi dan Real Estat, Transportasi dan Penyimpanan, sebagian pertanian/kehutanan (+ Energi)', v3_feb2026: 'AFF lanjutan, Manufaktur, Air/Limbah (WSSWMR), dan sektor pendukung TI-Komunikasi dan Jasa Profesional; menambah TSC PLTSa' },
  referensi_utama: 'ASEAN Taxonomy for Sustainable Finance (ATSF) dan kebijakan nasional',
};
export function halamanFrasa(teksPerHalaman, frasa, mulai = 80) { // halaman 1-berindeks pertama (>= mulai) yang memuat frasa, spasi dinormalkan
  const n = (s) => s.replace(/\s+/g, ' ');
  const f = n(frasa);
  const i = teksPerHalaman.findIndex((p, k) => k + 1 >= mulai && n(p).includes(f));
  return i < 0 ? null : i + 1;
}
export function bangun(teksPerHalaman) {
  return AKTIVITAS.map(([id, aktivitas, kbli, induk, hijau, transisi, frasa, catatan]) => {
    const h = halamanFrasa(teksPerHalaman, frasa);
    if (!h) throw new Error('frasa bukti tidak ditemukan: ' + id);
    return { id, kelompok: 'taksonomi-energi', aktivitas, kbli_2017: kbli, jenis: induk, klasifikasi_hijau_eo1: hijau, klasifikasi_transisi_eo1: transisi || 'N/A atau tidak ada',
      kriteria_terbaca: !!(hijau || transisi), halaman_pdf: h, catatan: catatan ?? undefined, sumber_id: 's-tkbi2', sumber_url: BUKU + '#page=' + h, tanggal: TGL, tingkat_bukti: 'resmi' };
  });
}
export const CELAH = [
  'Hanya sektor Energi (Lampiran 3 bagian D) dan ringkasan EO1 (mitigasi); EO2-EO4, DNSH (EC1) dan aspek sosial (EC3) per aktivitas tidak diringkas. Sektor non-energi (konstruksi, transportasi, pertanian) tidak dimasukkan.',
  'Sumber TSC = Buku TKBI Versi 2 (Feb 2025). Buku Versi 3 (5 Feb 2026) tidak punya PDF yang dapat dibaca dari halaman OJK; menurut siaran OJK, perubahan sektor energi di v3 hanya penambahan TSC PLTSa dan penyesuaian KBLI CCS/CCUS. TSC PLTSa belum ada di sini.',
  'Ringkasan dituliskan ulang; angka ambang diperiksa terhadap teks PDF lewat frasa bukti, bukan seluruh kalimat. Kriteria T&D berada pada halaman gambar dan tidak dibaca.',
  'Taxonomy Navigator (gapura.ojk.go.id/taxonavi) menjawab 403: berhenti, tidak dipanen. ExplorerTKBI di situs OJK memakai grid dinamis yang tidak dipanen.',
  'TKBI bukan hukum; klasifikasi akhir ditentukan penilaian per entitas/aktivitas menurut OJK.',
];
function selftest() {
  const hal = Array.from({ length: 100 }, (_, i) => (i === 94 ? 'Jika sumber energi berasal dari tenaga   surya: Telah memenuhi EO1' : ''));
  assert.equal(halamanFrasa(hal, 'tenaga surya: Telah memenuhi EO1'), 95);
  assert.equal(halamanFrasa(hal, 'tidak ada'), null);
  assert.throws(() => bangun(hal), /frasa bukti/);
  assert.equal(new Set(AKTIVITAS.map((a) => a[0])).size, AKTIVITAS.length);
  assert.ok(AKTIVITAS.every((a) => a[6]));
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--selftest') selftest();
  else if (process.argv[2] === '--bangun' && process.argv[3]) {
    const teks = execFileSync('pdftotext', ['-layout', process.argv[3], '-'], { encoding: 'utf-8', maxBuffer: 1 << 28 }).split('\f');
    const { ok, ditolak } = saring(bangun(teks));
    const o = bungkus({ baris: ok, sumber: SUMBER, celah: CELAH, ditolak, tambahMeta: { kerangka: KERANGKA } });
    o.dibangun_pada = TGL; o.meta.diperbarui = TGL;
    console.log(tulis('taksonomi_ojk', o), ok.length, 'aktivitas');
  } else console.log('pakai: --bangun <pdf> | --selftest');
}
