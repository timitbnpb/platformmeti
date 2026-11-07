#!/usr/bin/env node
// public/data/insentif.json: insentif fiskal dan nonfiskal EBT. Tiap baris dicek ke halaman JDIH BPK pada 7 Nov 2026
// (judul, status berlaku). "basis_syarat" jujur: 'teks' = syarat dibaca dari PDF; 'judul' = hanya dari judul/status.
import { fileURLToPath } from 'node:url';
import { TGL, bacaAda, saring, bungkus, tulis, pilihSumber } from './dataset_lib.mjs';

export const SUMBER = { 's-bpk': { id: 's-bpk', lisensi: 'Dokumen peraturan perundang-undangan (publik); hanya fakta dan tautan', judul: 'JDIH BPK: Database Peraturan (peraturan.bpk.go.id)', penerbit: 'Badan Pemeriksa Keuangan RI', tahun: 2026, url: 'https://peraturan.bpk.go.id' } };
const D = (id) => 'https://peraturan.bpk.go.id/Details/' + id;
// [id, jenis, instrumen, nomor, regulasi_id, teknologi, syarat, status, basis, bpkId, catatan]
const DATA = [
  ['ins_tax_holiday', 'fiskal', 'tax holiday (pengurangan PPh badan)', 'PMK 130/PMK.010/2020', null, ['sesuai sektor pionir; cek apakah usaha pembangkit termasuk'], 'Pengurangan PPh badan bagi wajib pajak badan pelaku usaha pionir; besar dan jangka waktu menurut nilai investasi. Rincian persentase, ambang investasi, dan daftar sektor ada di teks (PDF pindai, tidak terbaca mesin).', 'berlaku', 'judul', '148016/pmk-no-130pmk0102020', 'Status "Berlaku" menurut JDIH BPK; belum dicek terhadap aturan pengganti.'],
  ['ins_bea_masuk_pembangkit', 'fiskal', 'pembebasan bea masuk barang modal pembangkitan listrik', 'PMK 66/PMK.010/2015', null, ['semua pembangkit IUPTL kepentingan umum (termasuk EBT)'], 'Badan usaha: PLN, pemegang IUPTL wilayah usaha, atau IUPTL pembangkitan dengan PJBL/FLA ke PLN atau ke pemegang IUPTL wilayah usaha. Barang modal belum diproduksi dalam negeri / belum memenuhi spesifikasi / belum mencukupi; kontrak tanpa bea masuk. Permohonan ke BKPM dengan izin prinsip, Rencana Impor Barang yang disahkan Dirjen Ketenagalistrikan, akta, NIK. Realisasi impor paling lama 24 bulan (dapat diperpanjang 12 bulan). Tidak mencakup transmisi, distribusi, suku cadang.', 'berlaku', 'teks', '146740/pmk-no-66pmk0102015', null],
  ['ins_bea_masuk_mesin', 'fiskal', 'pembebasan bea masuk mesin, barang, dan bahan investasi', 'PMK 176/PMK.011/2009 jo. PMK 188/PMK.010/2015', null, ['umum (penanaman modal, termasuk industri komponen EBT)'], 'Pembebasan bea masuk atas impor mesin serta barang dan bahan untuk pembangunan atau pengembangan industri dalam rangka penanaman modal; PMK 188/2015 adalah perubahan kedua. Syarat rinci ada di teks.', 'berlaku', 'judul', '167732/pmk-no-176pmk0112009', 'Judul dan status dari JDIH BPK; PMK 188/PMK.010/2015: ' + D('121785/pmk-no-188pmk0102015')],
  ['ins_ppn_panas_bumi', 'fiskal', 'PPN dibebaskan atas impor barang kontraktor panas bumi', 'PP 49/2022 (Bab V, Pasal 25)', null, ['panas bumi (pemanfaatan tidak langsung)'], 'PPN dibebaskan atas impor barang yang dipakai kontraktor kontrak kerja sama untuk penyelenggaraan panas bumi pemanfaatan tidak langsung (penugasan survei pendahuluan dan eksplorasi, eksplorasi, eksploitasi, pemanfaatan). Hasil tambang panas bumi diambil langsung dari sumbernya juga termasuk barang bukan BKP.', 'berlaku', 'teks', '232943/pp-no-49-tahun-2022', 'Dibaca dari PDF PP 49/2022; nomor huruf butir pasal belum dikunci.'],
  ['ins_tkdn_esdm', 'nonfiskal', 'kewajiban penggunaan produk dalam negeri (TKDN)', 'Permen ESDM 11/2024', null, ['infrastruktur ketenagalistrikan, termasuk pembangkit EBT'], 'Penggunaan produk dalam negeri untuk pembangunan infrastruktur ketenagalistrikan. Ambang TKDN per komponen belum dibaca (berkas BPK yang diunduh berupa rancangan, tidak dipakai).', 'berlaku', 'judul', '296563/permen-esdm-no-11-tahun-2024', null],
  ['ins_tkdn_perindustrian', 'nonfiskal', 'pedoman TKDN ketenagalistrikan (riwayat)', 'Permenperin 54/M-IND/PER/3/2012 jo. 5/M-IND/PER/2/2017, dicabut Permenperin 33/2024', null, ['infrastruktur ketenagalistrikan'], 'Pedoman penggunaan produk dalam negeri ketenagalistrikan. Permenperin 54/2012 berstatus tidak berlaku (dicabut Permenperin 33/2024).', 'dicabut', 'judul', '296084/permenperin-no-33-tahun-2024', 'Permenperin 54/2012: ' + D('268783/permenperin-no-54m-indper32012-tahun-2012') + '; 5/2017: ' + D('268784/permenperin-no-5m-indper22017-tahun-2017')],
  ['ins_harga_patokan_perpres112', 'nonfiskal', 'harga patokan tertinggi pembelian listrik EBT oleh PLN dan faktor lokasi F', 'Perpres 112/2022', 'perpres-112-2022', ['PLTA', 'PLTS', 'PLTB', 'PLTP', 'PLTBm/PLTBg', 'PLTSa'], 'Harga patokan tertinggi per teknologi dan kapasitas (Lampiran I) dengan faktor F per wilayah (Lampiran II). Nilai tarif per teknologi sudah ada di keuangan.json (kelompok tarif).', 'berlaku', 'judul', '225308/perpres-no-112-tahun-2022', null],
  ['ins_harga_pltp_esdm17', 'nonfiskal', 'harga pembelian listrik PLTP dan uap panas bumi oleh PLN (riwayat)', 'Permen ESDM 17/2014', 'permen-esdm-17-2014', ['panas bumi'], 'Pembelian tenaga listrik dari PLTP dan uap panas bumi untuk PLTP oleh PLN. Status "berlaku" mengikuti regulasi.json; kemungkinan sudah tergeser Perpres 112/2022 (belum diperiksa).', 'berlaku-belum-dicek', 'judul', '143716/permen-esdm-no-17-tahun-2014', null],
  ['ins_plts_atap_26_2021', 'nonfiskal', 'ekspor-impor listrik PLTS atap (riwayat)', 'Permen ESDM 26/2021', 'permen-esdm-26-2021', ['PLTS atap'], 'PLTS atap yang terhubung ke jaringan IUPTL umum. Berstatus tidak berlaku menurut JDIH BPK dan regulasi.json.', 'dicabut', 'judul', '257416/permen-esdm-no-26-tahun-2021', null],
  ['ins_plts_atap_49_2018', 'nonfiskal', 'penggunaan PLTS atap konsumen PLN (riwayat)', 'Permen ESDM 49/2018', 'permen-esdm-49-2018', ['PLTS atap'], 'PLTS atap oleh konsumen PLN. Berstatus tidak berlaku menurut JDIH BPK dan regulasi.json.', 'dicabut', 'judul', '142300/permen-esdm-no-49-tahun-2018', null],
  ['ins_bea_masuk_154_2008', 'fiskal', 'pembebasan bea masuk barang modal pembangkit (riwayat)', 'PMK 154/PMK.011/2008 (diubah 128/2009, 154/2012)', null, ['pembangkit untuk kepentingan umum'], 'Pendahulu PMK 66/PMK.010/2015. Berstatus tidak berlaku menurut JDIH BPK.', 'dicabut', 'judul', '146741/pmk-no-154pmk0112008', null],
  ['ins_bea_masuk_panas_bumi_177_2007', 'fiskal', 'pembebasan bea masuk barang hulu migas dan panas bumi (riwayat)', 'PMK 177/PMK.011/2007', null, ['panas bumi', 'hulu migas'], 'Pembebasan bea masuk atas impor barang untuk kegiatan usaha hulu migas dan panas bumi. Berstatus tidak berlaku menurut JDIH BPK.', 'dicabut', 'judul', '137071/pmk-no-177pmk0112007', null],
];

export function bangun(regIds = null) {
  return DATA.map(([id, jenis, instrumen, nomor, reg, teknologi, syarat, status, basis, bpk, catatan]) => ({
    id, kelompok: 'insentif', jenis, instrumen, nomor_aturan: nomor, regulasi_id: reg && (regIds === null || regIds.has(reg)) ? reg : null,
    teknologi, syarat_ringkas: syarat, berlaku_sampai: null, status_berlaku: status, basis_syarat: basis, catatan: catatan ?? undefined,
    sumber_id: 's-bpk', sumber_url: D(bpk), tanggal: TGL, tingkat_bukti: 'resmi',
  }));
}
export const CELAH = [
  'PP 78/2019 (tax allowance) dan PMK 11/PMK.010/2020: tidak ditemukan di JDIH BPK dan belum ada sumber terbuka lain yang dibaca; tidak dimasukkan, tidak ditebak. JDIH Kemenkeu/BKPM tidak dipanen pada putaran ini.',
  'Insentif PPN tidak dipungut untuk pembangkit EBT (selain panas bumi di PP 49/2022), insentif khusus panas bumi terbaru (pasca PMK 177/2007), dan harga patokan panas bumi terbaru belum teridentifikasi dengan nomor pasti.',
  'berlaku_sampai bernilai null: tidak ada batas akhir yang dibaca dari teks; kolom status_berlaku dari JDIH BPK dan tidak menjamin tidak ada aturan pengganti.',
  'basis_syarat "judul" berarti syarat belum dibaca dari teks (PDF pindai tanpa OCR atau tidak diunduh); baca teks sebelum dikutip.',
  'Hanya PMK 66/2015 dan PP 49/2022 yang syaratnya dibaca dari PDF; nilai persentase tax holiday tidak dicantumkan karena belum terbaca.',
];
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const reg = bacaAda('public/data/regulasi.json');
  const { ok, ditolak } = saring(bangun(reg ? new Set(reg.baris.map((r) => r.id)) : null));
  console.log(tulis('insentif', bungkus({ baris: ok, sumber: pilihSumber(SUMBER, ok), celah: CELAH, ditolak })), ok.length, 'baris');
}
