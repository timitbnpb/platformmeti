// public/data/pasar_listrik.json: HBA batubara, harga dan volume DMO, tarif listrik per golongan, subsidi/kompensasi, keandalan per wilayah
// (kosong bila tidak terbit) dan satu analisis turunan EST (biaya bahan bakar PLTU HBA vs DMO, dibanding LCOE EBT).
// Angka disalin dari dokumen yang dibaca (PDF resmi ESDM, siaran pers ESDM, berita): tiap baris membawa sumber_id, tanggal, tingkat_bukti.
// Turunan membaca berkas yang sudah ada (keandalan, biaya_bangun, karbon_pasar, sistem_pln, tarif_harga): tidak menggandakan.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
export const TGL = '2026-11-08';
const baca = (f) => JSON.parse(fs.readFileSync(AKAR + 'public/data/' + f, 'utf8'));
const S = (id, penerbit, judul, tahun, url, tingkat_bukti, catatan) => ({ id, penerbit, judul, tahun, url, tingkat_bukti, tanggal_akses: TGL, ...(catatan ? { catatan } : {}) });
const HESSI = 'https://esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2024.pdf';
const STAT = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/91fa8-buku-statistik-ketenagalistrikan-2024.pdf';

export const SUMBER = [
  S('hessi-2024', 'Kementerian ESDM', 'Handbook of Energy and Economic Statistics of Indonesia 2024 (rev. 9 Juli 2025): rata-rata HBA hlm 33, penjualan batubara dalam negeri Tabel 6.1.4 hlm 66, konsumsi bahan bakar pembangkit PLN Tabel 6.4.5 hlm 94', 2025, HESSI, 'resmi'),
  S('stat-gatrik-2024', 'Ditjen Ketenagalistrikan, Kementerian ESDM', 'Statistik Ketenagalistrikan Tahun 2024: Tabel 41 pelanggan, Tabel 44 nilai subsidi, Tabel 45 disparitas tarif, Tabel 47 SAIDI/SAIFI', 2025, STAT, 'resmi'),
  S('esdm-hba-2015', 'Kementerian ESDM', 'Harga Batubara Acuan Desember 2015 Turun Menjadi USD 53,51 (memuat HBA Januari sampai Desember 2015; terbit 13 Januari 2016)', 2016, 'https://www.esdm.go.id/id/media-center/arsip-berita/harga-batubara-acuan-desember-2015-turun-menjadi-usd-5351', 'resmi'),
  S('esdm-hba-2025-05', 'Kementerian ESDM', 'Pemerintah Tetapkan HBA Periode Pertama Mei 2025 (Kepmen 169.K/MB.01/MEM.B/2025; terbit 3 Mei 2025)', 2025, 'https://esdm.go.id/id/media-center/arsip-berita/pemerintah-tetapkan-hba-periode-pertama-mei-2025', 'resmi'),
  S('esdm-hba-2025-07', 'Kementerian ESDM', 'Harga Batubara Acuan Periode Pertama Juli 2025 Naik USD8,74 Per Ton (dasar Kepmen 72 Tahun 2025; terbit 11 Juli 2025; memuat HBA periode II Juni 2025 USD 98,61)', 2025, 'https://esdm.go.id/id/media-center/arsip-berita/harga-batubara-acuan-periode-pertama-juli-2025-naik-usd874-per-ton', 'resmi'),
  S('cnbc-hba-2025-11', 'CNBC Indonesia', 'Harga Batu Bara Acuan (HBA) RI November Turun US$ 103,75 per Ton (Kepmen 348.K/MB.01/MEM.B/2025; 3 November 2025; periode sebelumnya, awal September 2025: 105,33)', 2025, 'https://www.cnbcindonesia.com/news/20251103112445-4-681656/harga-batu-bara-acuan--hba--ri-november-turun-us--10375-per-ton/amp', 'media'),
  S('cnbc-hba-2026-02', 'CNBC Indonesia', 'Harga Batu Bara Acuan Periode I Februari 2026 Naik, Tembus US$ 106,11 (hanya judul dibaca)', 2026, 'https://www.cnbcindonesia.com/news/20260202100414-4-707245/harga-batu-bara-acuan-periode-i-februari-2026-naik-tembus-us--10611/amp', 'media'),
  S('bisnis-hba-2026', 'Bisnis.com', 'Seri berita HBA 2026 (judul): Periode II Mei 116,32; Juni 121,83 (Kepmen 227.K/MB.01/MEM.B/2026); Periode I Juli 126,58; Periode II Juli 131,85, kelas kalori tertinggi', 2026, 'https://ekonomi.bisnis.com/read/20260602/44/1977748/harga-batu-bara-acuan-hba-juni-2026-memanas-tertinggi-us12183-per-ton', 'media', 'Hanya judul dan ringkasan hasil pencarian dibaca; halaman berita membalas 403 pada pembacaan terpisah.'),
  S('ddtc-hba-2026-11', 'DDTC News', 'Harga Batu Bara Acuan Periode I November 2026 Turun jadi US$125,60/ton (periode sebelumnya, II Oktober 2026: 126,81; tanda Kepmen 409 atau 401 .K/MB.01/MEM.B/2026 tidak konsisten di artikel)', 2026, 'https://news.ddtc.co.id/data-alat/pungutan-komoditas/1823764/harga-batu-bara-acuan-periode-i-november-2026-turun-jadi-us12560ton', 'media'),
  S('kepmen-1395-2018', 'Kementerian ESDM', 'Kepmen ESDM 1395 K/30/MEM/2018 tanggal 9 Maret 2018: Harga Jual Batubara untuk Penyediaan Tenaga Listrik untuk Kepentingan Umum (teks keputusan)', 2018, 'https://jdih.esdm.go.id/storage/document/Kepmen-esdm-1395-Thn%202018.pdf', 'resmi'),
  S('esdm-dmo-2020', 'Kementerian ESDM', 'Per 1 Januari 2020, DMO Dipatok 25% dan Harga Jual ke Pembangkit USD 70 per Ton (Kepmen 261 K/30/MEM/2019; siaran pers 019.Pers/04/SJI/2020, 7 Januari 2020)', 2020, 'https://www.esdm.go.id/id/media-center/arsip-berita/per-1-januari-2020-dmo-dipatok-25-dan-harga-jual-ke-pembangkit-usd-70-per-ton', 'resmi'),
  S('kepmen-255-2020', 'Kementerian ESDM', 'Abstrak Kepmen ESDM 255 K/30/MEM/2020 (29 Desember 2020): Pemenuhan Kebutuhan Batubara Dalam Negeri Tahun 2021, harga USD 70 FOB vessel', 2020, 'https://jdih.esdm.go.id/storage/document/Abstrak%20Kepmen%20ESDM%20No.%20255%20K_30_MEM_2020.pdf', 'resmi'),
  S('warta-dmo-267', 'Warta Ekonomi', 'ESDM tegaskan harga DMO batu bara tetap US$70 per ton (menyebut dasar Kepmen ESDM 267.K/MB.01/MEM.B/2022; teks keputusan tidak ditemukan di JDIH)', 2022, 'https://wartaekonomi.co.id/read618336/esdm-tegaskan-harga-dmo-batu-bara-tetap-us70-per-ton-belum-berubah-tahun-ini', 'media', 'Nomor keputusan hanya dari ringkasan hasil pencarian; artikel tidak dibuka.'),
  S('bisnis-dmo-2026-02', 'Bisnis.com', 'ESDM Pastikan Tak Ada Kenaikan Harga DMO Batu Bara Tahun Ini (12 Februari 2026; ringkasan: harga listrik USD 70, semen dan pupuk USD 90, porsi DMO 25% ke 30%)', 2026, 'https://ekonomi.bisnis.com/read/20260212/12/1952562/esdm-pastikan-tak-ada-kenaikan-harga-dmo-batu-bara-tahun-ini', 'media', 'Halaman membalas 403; isi hanya dari ringkasan hasil pencarian.'),
  S('cnbc-dmo-2026-06', 'CNBC Indonesia', 'Harga Patokan DMO Batu Bara US$70/Ton Bakal Diubah? Ini Kata ESDM (22 Juni 2026: harga tidak berubah sejak 2018; Menteri ESDM menyebut rumus sedang dihitung ulang)', 2026, 'https://www.cnbcindonesia.com/news/20260622192933-4-744811/harga-patokan-dmo-batu-bara-us-70-ton-bakal-diubah-ini-kata-esdm/amp', 'media'),
  S('ima-dmo-2025', 'Indonesian Mining Association', 'Realisasi DMO Batu Bara Oktober 2025 Capai 180,98 Juta Ton (27,36% produksi nasional sampai Oktober)', 2025, 'https://ima-api.org/realisasi-dmo-batu-bara-oktober-2025-capai-18098-juta-ton/', 'media', 'Angka sampai Oktober, bukan setahun penuh.'),
  S('esdm-tarif-2019q1', 'Kementerian ESDM', 'Tarif Listrik Triwulan I Tahun 2019 Tidak Naik, Tidak Berubah Sejak 2017 (siaran pers 0008.Pers/04/SJI/2019, 3 Januari 2019)', 2019, 'https://esdm.go.id/id/media-center/arsip-berita/tarif-listrik-triwulan-i-tahun-2019-tidak-naik-tidak-berubah-sejak-2017', 'resmi'),
  S('esdm-tarif-2020q1', 'Kementerian ESDM', 'Tarif Listrik Triwulan I 2020 Tetap (siaran pers 004.Pers/04/SJI/2020, 2 Januari 2020)', 2020, 'https://esdm.go.id/en/media-center/news-archives/tarif-listrik-triwulan-i-2020-tetap', 'resmi'),
  S('esdm-tarif-2020q4', 'Kementerian ESDM', 'Menteri ESDM Tetapkan Tarif Listrik Pelanggan Tegangan Rendah Nonsubsidi Turun (siaran pers 264.Pers/04/SJI/2020, 1 September 2020; periode Oktober-Desember 2020)', 2020, 'https://www.esdm.go.id/id/media-center/arsip-berita/menteri-esdm-tetapkan-tarif-listrik-pelanggan-tegangan-rendah-nonsubsidi-turun', 'resmi'),
  S('esdm-tarif-2022q3', 'Kementerian ESDM', 'Pemerintah Terapkan Penyesuaian Tarif Listrik kepada Golongan Masyarakat Mampu Berdaya 3.500 VA ke Atas dan Golongan Pemerintah (siaran pers 227.Pers/04/SJI/2022, 13 Juni 2022; surat Menteri T-162/TL.04/MEM.L/2022)', 2022, 'https://esdm.go.id/id/media-center/arsip-berita/pemerintah-terapkan-penyesuaian-tarif-listrik-kepada-golongan-masyarakat-mampu-berdaya-3500-va-ke-atas-dan-golongan-pemerintah', 'resmi'),
  S('katadata-tarif-2025q4', 'Katadata', 'Pemerintah Putuskan Tarif Listrik sampai Akhir 2025 Tidak Naik (25 September 2025; pernyataan Plt. Dirjen Ketenagalistrikan)', 2025, 'https://katadata.co.id/amp/berita/energi/68d4c59e06b7f/pemerintah-putuskan-tarif-listrik-sampai-akhir-2025-tidak-naik/', 'media'),
  S('detik-900va-2017', 'Detik Finance', 'Tarif Listrik 18,7 Juta Pelanggan PLN 900 VA akan Naik Bertahap 3 Kali (jadwal 1 Januari, 1 Maret, 1 Mei 2017: Rp605 ke 791, 1.034, 1.352 per kWh)', 2017, 'https://finance.detik.com/energi/d-3322612/tarif-listrik-18-7-juta-pelanggan-pln-900-va-akan-naik-bertahap-3-kali', 'media', 'Angka dari ringkasan hasil pencarian; halaman tidak dibuka. Nilai akhir 1.352 sama dengan siaran pers ESDM 2019 dan 2020.'),
  S('katadata-subsidi-2026', 'Katadata', 'Tarif Listrik Ajeg sejak 2017, ESDM Sebut Jadi Beban Subsidi dan Kompensasi Naik (5 Juni 2026; Plt. Dirjen Ketenagalistrikan di Komisi XII DPR, 4 Juni 2026)', 2026, 'https://katadata.co.id/berita/energi/6a226e7bf3139/tarif-listrik-ajeg-sejak-2017-esdm-sebut-jadi-beban-subsidi-dan-kompensasi-naik', 'kata-pihak'),
  S('listrikindonesia-subsidi-2024', 'Listrik Indonesia', 'Menkeu: Subsidi Listrik Capai Rp75,8 Triliun (7 Januari 2025; pagu Rp75,83 triliun = Rp73,24 triliun tahun berjalan + Rp2,58 triliun kurang bayar 2022; lebih dari 42 juta pelanggan)', 2025, 'https://listrikindonesia.com/detail/15263/menkeu-subsidi-listrik-capai-rp758-triliun', 'kata-pihak'),
  S('investortrust-subsidi-2026', 'Investortrust', 'Subsidi Listrik 2026 Diusulkan Naik Jadi Rp 104 Triliun (30 Juni 2025; APBN 2025 Rp87,72 triliun; usulan 2026 Rp104,97 triliun untuk 44,88 juta pelanggan; Dirjen Ketenagalistrikan di Komisi XII DPR)', 2025, 'https://investortrust.id/business/71086/subsidi-listrik-2026-diusulkan-naik-jadi-rp-104-triliun-ini-3-hal-yang-mempengaruhi', 'kata-pihak'),
];

const mk = (sumber_id, tingkat_bukti, extra = {}) => ({ ...extra, sumber_id, tingkat_bukti, tanggal: TGL });

// ---------- 1. HBA ----------
const HBA_TAHUN = { 2014: 72.62, 2015: 60.13, 2016: 61.84, 2017: 85.92, 2018: 98.96, 2019: 77.89, 2020: 58.17, 2021: 121.47, 2022: 276.58, 2023: 201.15, 2024: 121.48 };
const HBA_2015 = [63.84, 62.92, 67.76, 64.48, 61.08, 59.59, 59.16, 59.14, 58.21, 57.39, 54.43, 53.51];
// periode terbit (HBA kelas kalori 6.322 GAR; 2026 = kelas kalori tertinggi menurut judul berita)
const HBA_PERIODE = [
  ['2025-05-I', 121.15, '169.K/MB.01/MEM.B/2025', 'esdm-hba-2025-05', 'resmi'],
  ['2025-06-II', 98.61, null, 'esdm-hba-2025-07', 'resmi'],
  ['2025-07-I', 107.35, '72 Tahun 2025 (pedoman penetapan)', 'esdm-hba-2025-07', 'resmi'],
  ['2025-09-I', 105.33, null, 'cnbc-hba-2025-11', 'media'],
  ['2025-11-I', 103.75, '348.K/MB.01/MEM.B/2025', 'cnbc-hba-2025-11', 'media'],
  ['2026-02-I', 106.11, null, 'cnbc-hba-2026-02', 'media'],
  ['2026-05-II', 116.32, null, 'bisnis-hba-2026', 'media'],
  ['2026-06-I', 121.83, '227.K/MB.01/MEM.B/2026', 'bisnis-hba-2026', 'media'],
  ['2026-07-I', 126.58, '274 Tahun 2026 (menurut ringkasan pencarian)', 'bisnis-hba-2026', 'media'],
  ['2026-07-II', 131.85, null, 'bisnis-hba-2026', 'media'],
  ['2026-10-II', 126.81, null, 'ddtc-hba-2026-11', 'media'],
  ['2026-11-I', 125.6, '409.K/MB.01/MEM.B/2026 (artikel juga menyebut 401)', 'ddtc-hba-2026-11', 'media'],
];

// ---------- 2. DMO ----------
const DMO_ATURAN = [
  { id: 'dmo-2018', berlaku: '2018-03-09', sampai: '2019-12-31', harga_usd_ton: 70, keputusan: 'Kepmen ESDM 1395 K/30/MEM/2018 (9 Maret 2018)', persen_dmo: null, batas_volume_juta_t: 100, uraian: 'USD 70/ton FOB vessel (6.322 kcal/kg GAR, TM 8%, TS 0,8%, ash 15%). Spesifikasi lain dihitung dengan rumus Lampiran I bila HBA >= 70 atau Lampiran II bila HBA < 70. Berlaku 2018 dan 2019, volume paling banyak 100 juta ton per tahun.', ...mk('kepmen-1395-2018', 'resmi') },
  { id: 'dmo-2020', berlaku: '2020-01-01', sampai: '2020-12-31', harga_usd_ton: 70, keputusan: 'Kepmen ESDM 261 K/30/MEM/2019', persen_dmo: 25, batas_volume_juta_t: null, uraian: 'DMO minimal 25% dari rencana produksi 2020; harga jual ke pembangkit USD 70/ton FOB, jadi plafon bila HBA lebih tinggi; sama dengan tahun sebelumnya. Kompensasi kekurangan dibayar sebagai ganti pemangkasan kuota produksi tahun berikutnya.', ...mk('esdm-dmo-2020', 'resmi') },
  { id: 'dmo-2021', berlaku: '2021-01-01', sampai: '2021-12-31', harga_usd_ton: 70, keputusan: 'Kepmen ESDM 255 K/30/MEM/2020 (29 Desember 2020)', persen_dmo: null, batas_volume_juta_t: null, uraian: 'Harga jual batubara untuk penyediaan tenaga listrik untuk kepentingan umum USD 70/ton FOB vessel. Dampak pandemi 2020: kewajiban kompensasi kekurangan DMO 2020 dibebaskan.', ...mk('kepmen-255-2020', 'resmi') },
  { id: 'dmo-2022', berlaku: '2022-01-01', sampai: null, harga_usd_ton: 70, keputusan: 'Kepmen ESDM 267.K/MB.01/MEM.B/2022 (menurut media)', persen_dmo: null, batas_volume_juta_t: null, uraian: 'Harga khusus batubara untuk PLTU USD 70/ton; nomor keputusan tahun 2022 sampai 2025 dari berita, teks tidak ditemukan di JDIH.', ...mk('warta-dmo-267', 'media') },
  { id: 'dmo-2026', berlaku: '2026-01-01', sampai: null, harga_usd_ton: 70, keputusan: 'tidak diketahui (berita)', persen_dmo: 30, batas_volume_juta_t: null, uraian: 'Berita Februari 2026: harga DMO listrik tetap USD 70 tahun ini (semen dan pupuk USD 90), porsi DMO naik 25% ke 30%. Juni 2026: pemerintah mengkaji ulang rumus; belum ada perubahan harga.', ...mk('bisnis-dmo-2026-02', 'media') },
];

// Tabel 6.1.4 (penjualan batubara dalam negeri, ton) dan 6.4.5 (batubara dikonsumsi pembangkit PLN, ton), Handbook ESDM 2024
const JUAL_DN = { 2014: [76180001, 63054000], 2015: [86814099, 70080000], 2016: [90550000, 75400000], 2017: [97030000, 83000000], 2018: [115080000, 91140000], 2019: [138418192, 98550260], 2020: [131886643, 104829892], 2021: [133043362, 112133733], 2022: [215813239, 129226621], 2023: [212867547, 121197161], 2024: [232640000, 133470000] };
const PLN_BATUBARA = { 2014: 44604981, 2015: 48995169, 2016: 50556446, 2017: 54711847, 2018: 60481245, 2019: 67008829, 2020: 66158000, 2021: 67860420, 2022: 69876930, 2023: 69222936, 2024: 71719964 };

// ---------- 3. Tarif ----------
// Statistik Ketenagalistrikan 2024 Tabel 45. tarif [2020..2024] Rp/kWh; ek = tarif keekonomian (BPP penyediaan + margin) tegangan TR/TM/TT
const EK = { TR: [1498.52, 1530.32, 1639.53, 1734.98, 1772.22], TRn: [1498.72, 1530.52, 1639.73, 1734.12, 1772.42], TM: [1227.53, 1284.71, 1469.11, 1558.03, 1599.82], TT: [1135.93, 1196.31, 1409.38, 1477.51, 1518.65] };
const c5 = (v) => [v, v, v, v, v];
const G = (kode, nama, tegangan, subsidi, tarif, ek, stk) => ({ kode, nama, tegangan, subsidi, tarif_rp_kwh: tarif, keekonomian_rp_kwh: ek, ...(stk ? { catatan: stk } : {}), ...mk('stat-gatrik-2024', 'resmi') });
const TARIF = [
  G('R-1/450', 'Rumah tangga 450 VA', 'TR', true, c5(415), EK.TR), G('R-1/900', 'Rumah tangga 900 VA', 'TR', true, c5(605), EK.TR),
  G('S-2/450', 'Sosial 450 VA', 'TR', true, c5(325), EK.TR), G('S-2/900', 'Sosial 900 VA', 'TR', true, c5(455), EK.TR),
  G('S-2/1300', 'Sosial 1.300 VA', 'TR', true, c5(708), EK.TR), G('S-2/2200', 'Sosial 2.200 VA', 'TR', true, c5(760), EK.TR), G('S-2/3500', 'Sosial 3.500 VA sampai 200 kVA', 'TR', true, c5(900), EK.TR),
  G('B-1/450', 'Bisnis kecil 450 VA', 'TR', true, c5(535), EK.TR), G('B-1/900', 'Bisnis kecil 900 VA', 'TR', true, c5(630), EK.TR), G('B-1/1300', 'Bisnis kecil 1.300 VA', 'TR', true, c5(966), EK.TR), G('B-1/2200', 'Bisnis kecil 2.200 sampai 5.500 VA', 'TR', true, c5(1100), EK.TR),
  G('I-1/450', 'Industri kecil 450 VA', 'TR', true, c5(485), EK.TR), G('I-1/900', 'Industri kecil 900 VA', 'TR', true, c5(600), EK.TR), G('I-1/1300', 'Industri kecil 1.300 VA', 'TR', true, c5(930), EK.TR), G('I-1/2200', 'Industri kecil 2.200 VA', 'TR', true, c5(960), EK.TR), G('I-1/3500', 'Industri kecil 3.500 VA sampai 14 kVA', 'TR', true, c5(1112), EK.TR), G('I-2/14kVA', 'Industri 14 sampai 200 kVA', 'TR', true, c5(1057), EK.TR),
  G('P-1/450', 'Kantor pemerintah 450 VA', 'TR', true, c5(685), EK.TR), G('P-1/900', 'Kantor pemerintah 900 VA', 'TR', true, c5(760), EK.TR), G('P-1/1300', 'Kantor pemerintah 1.300 VA', 'TR', true, c5(1049), EK.TR), G('P-1/2200', 'Kantor pemerintah 2.200 sampai 5.500 VA', 'TR', true, c5(1076), EK.TR),
  G('R-1M/900', 'Rumah tangga mampu 900 VA (RTM)', 'TR', false, c5(1352), EK.TRn),
  G('R-1/1300', 'Rumah tangga 1.300 VA', 'TR', false, [1467.28, 1444.7, 1444.7, 1444.7, 1444.7], EK.TRn), G('R-1/2200', 'Rumah tangga 2.200 VA', 'TR', false, [1467.28, 1444.7, 1444.7, 1444.7, 1444.7], EK.TRn),
  G('R-2', 'Rumah tangga 3.500 sampai 5.500 VA', 'TR', false, [1467.28, 1444.7, 1699.53, 1699.53, 1699.53], EK.TRn), G('R-3', 'Rumah tangga 6.600 VA ke atas', 'TR', false, [1467.28, 1444.7, 1699.53, 1699.53, 1699.53], EK.TRn),
  G('B-2', 'Bisnis 6.600 VA sampai 200 kVA', 'TR', false, [1467.28, 1444.7, 1444.7, 1444.7, 1444.7], EK.TRn),
  G('B-3', 'Bisnis di atas 200 kVA', 'TM', false, c5(1122.1), EK.TM, 'Buku statistik menulis 1.122,10; siaran pers ESDM 2019, 2020, 2022 dan data tarif_harga 2026 menulis 1.114,74. Selisih tidak terjelaskan; grafik triwulan memakai 1.114,74.'),
  G('I-3', 'Industri di atas 200 kVA', 'TM', false, c5(1122.1), EK.TM, 'Sama dengan B-3: buku statistik 1.122,10, data tarif_harga 2026 1.114,74.'),
  G('I-4', 'Industri 30.000 kVA ke atas', 'TT', false, c5(996.74), EK.TT),
  G('P-1', 'Kantor pemerintah 6.600 VA sampai 200 kVA', 'TR', false, [1467.28, 1444.7, 1699.53, 1699.53, 1699.53], EK.TRn), G('P-2', 'Kantor pemerintah di atas 200 kVA', 'TM', false, [1122.1, 1122.1, 1522.88, 1522.88, 1522.88], EK.TM, 'Siaran pers ESDM Juni 2022 menulis tarif lama P-2 1.114,74.'),
  G('P-3', 'Penerangan jalan umum', 'TR', false, [1467.28, 1444.7, 1699.53, 1699.53, 1699.53], EK.TRn), G('L', 'Layanan khusus', 'TR/TM/TT', false, c5(1644.52), c5(1650)),
];
const TARIF_TAHUN = [2020, 2021, 2022, 2023, 2024];

// peristiwa: [golongan_seri, tanggal berlaku, nilai, sumber_id, bukti]. Seri dipakai untuk deret triwulan (nilai pada hari pertama triwulan, EST: nilai terakhir dibawa maju).
const SERI = [
  { id: 'r1m-900', nama: 'R-1M 900 VA (rumah tangga mampu)', golongan: ['R-1M/900'], awal: [['2017-01-01', 791, 'detik-900va-2017', 'media'], ['2017-03-01', 1034, 'detik-900va-2017', 'media'], ['2017-05-01', 1352, 'esdm-tarif-2019q1', 'resmi']] },
  { id: 'r1-b2-pju', nama: 'R-1 1.300/2.200 VA, B-2 (rumah tangga dan bisnis tegangan rendah)', golongan: ['R-1/1300', 'R-1/2200', 'B-2'], awal: [['2017-01-01', 1467.28, 'esdm-tarif-2019q1', 'resmi'], ['2020-10-01', 1444.7, 'esdm-tarif-2020q4', 'resmi']] },
  { id: 'r2-r3-p1-p3', nama: 'R-2, R-3, P-1, P-3 (rumah tangga 3.500 VA ke atas, pemerintah tegangan rendah)', golongan: ['R-2', 'R-3', 'P-1', 'P-3'], awal: [['2017-01-01', 1467.28, 'esdm-tarif-2019q1', 'resmi'], ['2020-10-01', 1444.7, 'esdm-tarif-2020q4', 'resmi'], ['2022-07-01', 1699.53, 'esdm-tarif-2022q3', 'resmi']] },
  { id: 'b3-i3', nama: 'B-3, I-3 (bisnis dan industri tegangan menengah)', golongan: ['B-3', 'I-3'], awal: [['2017-01-01', 1114.74, 'esdm-tarif-2020q1', 'resmi']] },
  { id: 'p2', nama: 'P-2 (pemerintah tegangan menengah)', golongan: ['P-2'], awal: [['2017-01-01', 1114.74, 'esdm-tarif-2020q1', 'resmi'], ['2022-07-01', 1522.88, 'esdm-tarif-2022q3', 'resmi']] },
  { id: 'i4', nama: 'I-4 (industri besar tegangan tinggi)', golongan: ['I-4'], awal: [['2017-01-01', 996.74, 'esdm-tarif-2020q1', 'resmi']] },
];
const TRIWULAN = []; for (let y = 2017; y <= 2026; y++) for (let q = 1; q <= (y === 2026 ? 3 : 4); q++) TRIWULAN.push([y, q]);
const mulaiQ = (y, q) => `${y}-${String((q - 1) * 3 + 1).padStart(2, '0')}-01`;
function deretTriwulan() {
  return TRIWULAN.map(([y, q]) => {
    const t = mulaiQ(y, q), nilai = {};
    for (const s of SERI) nilai[s.id] = s.awal.filter((e) => e[0] <= t).at(-1)[1];
    return { periode: `${y}-Q${q}`, berlaku_sejak: t, nilai_rp_kwh: nilai };
  });
}

// ---------- 4. Subsidi ----------
const SUBSIDI = { 2020: [47.99, 59002450857], 2021: [49.8, 61915963054], 2022: [58.83, 62247852488], 2023: [68.64, 66033828125], 2024: [77.04, 70807353149] };

export function bangun() {
  const kea = baca('keandalan.json'), bb = baca('biaya_bangun.json'), kp = baca('karbon_pasar.json'), sp = baca('sistem_pln.json'), th = baca('tarif_harga.json');
  const hbaBulanan = HBA_2015.map((v, i) => ({ periode: `2015-${String(i + 1).padStart(2, '0')}`, usd_ton: v, ...mk('esdm-hba-2015', 'resmi') }));
  const hbaTahunan = Object.entries(HBA_TAHUN).map(([y, v]) => ({ tahun: +y, usd_ton: v, ...mk('hessi-2024', 'resmi', { catatan: +y === 2015 ? 'Sama dengan rata-rata hitung 12 bulan siaran pers ESDM Januari 2016 (60,13).' : undefined }) }));
  const volume = Object.entries(JUAL_DN).map(([y, [tot, pltu]]) => ({ tahun: +y, penjualan_dalam_negeri_t: tot, ke_pembangkit_listrik_t: pltu, batubara_pembangkit_pln_t: PLN_BATUBARA[y], ...mk('hessi-2024', 'resmi', { catatan: +y === 2024 ? 'Angka 2024 dibulatkan oleh sumber.' : undefined }) }));
  volume.push({ tahun: 2025, penjualan_dalam_negeri_t: 180980000, ke_pembangkit_listrik_t: null, batubara_pembangkit_pln_t: null, parsial: 'sampai Oktober 2025', ...mk('ima-dmo-2025', 'media', { catatan: 'Realisasi DMO semua sektor sampai Oktober 2025; bukan setahun penuh dan tanpa rincian pembangkit.' }) });

  // analisis EST
  const KWH_TH_T = (6322 * 4.1868) / 3.6, ETA = 0.36, CAP = 70, ETAS = [0.33, 0.36, 0.4];
  const sen = (p, eta = ETA) => (p / (KWH_TH_T * eta)) * 100;
  const rd = (v, d = 2) => +v.toFixed(d);
  const tahunan = Object.keys(HBA_TAHUN).filter((y) => y >= 2018).map((y) => {
    const hba = HBA_TAHUN[y], vol = JUAL_DN[y][1] / 1e6, gap = Math.max(hba - CAP, 0), dmo = CAP;
    return { tahun: +y, hba_usd_ton: hba, harga_dmo_usd_ton: dmo, volume_pembangkit_juta_t: rd(vol, 2), biaya_bbm_hba_sen_kwh: rd(sen(hba)), biaya_bbm_dmo_sen_kwh: rd(sen(dmo)), selisih_sen_kwh: rd(sen(gap)), subsidi_tersirat_usd_miliar: rd((gap * vol) / 1000, 2), sensitivitas_selisih_sen_kwh: Object.fromEntries(ETAS.map((e) => [e, rd(sen(gap, e))])) };
  });
  const lcoeId = [['plts-utilitas-dunia', 'surya'], ['pltb-dunia', 'bayu-darat'], ['plta-dunia', 'air'], ['bioenergi-dunia', 'bioenergi'], ['pltp-indonesia', 'panas-bumi']];
  const ebt = lcoeId.map(([id, tek]) => { const s = bb.skala.find((x) => x.id === id), l = s.lcoe_usd_mwh; return { skala_id: id, teknologi: tek, kelas: s.kelas, lcoe_sen_kwh: rd(l.tengah / 10, 1), rentang_sen_kwh: [l.rendah, l.tinggi].every((v) => v != null) ? [l.rendah / 10, l.tinggi / 10] : null, sumber_id: l.sumber_id, tingkat_bukti: l.tingkat_bukti }; });
  const faktorEmisi = kp.faktor_emisi.pltu_batubara_t_per_mwh;

  const wilayah = kea.sistem.map((s) => ({ sistem_id: s.id, nama: s.nama, kode_bps: s.prov, saidi_jam: null, saifi_kali: null, alasan: 'Tidak terbit sebagai berkas terbuka per wilayah atau UID PLN: Statistik Ketenagalistrikan 2024 (Tabel 47) dan RUPTL hanya memuat angka nasional; tidak diisi, tidak dikarang.' }));
  const nasional = kea.tren_nasional.map((r) => ({ tahun: r.tahun, saidi_jam: r.saidi_jam, saifi_kali: r.saifi_kali, ikut: 'keandalan.json#tren_nasional', sumber_asal: r.sumber }));

  // tautan dua arah ke tarif_harga.json (Q3 2026)
  const peta = { 'r1m-900': ['tl_2026q3_r_1_tr_900_va_rtm'], 'r1-b2-pju': ['tl_2026q3_r_1_tr_1_300_va', 'tl_2026q3_r_1_tr_2_200_va', 'tl_2026q3_b_2_tr_6_600_va_200_kva'], 'r2-r3-p1-p3': ['tl_2026q3_r_2_tr_3_500_5_500_va', 'tl_2026q3_r_3_tr_6_600_va_ke_atas', 'tl_2026q3_p_1_tr_6_600_va_200_kva', 'tl_2026q3_p_3_tr'], 'b3-i3': ['tl_2026q3_b_3_tm_di_atas_200_kva', 'tl_2026q3_i_3_tm_di_atas_200_kva'], p2: ['tl_2026q3_p_2_tm_di_atas_200_kva'], i4: ['tl_2026q3_i_4_tt_30_000_kva_ke_atas'] };
  const seri = SERI.map((s) => ({ id: s.id, nama: s.nama, golongan: s.golongan, tarif_harga_id: peta[s.id], peristiwa: s.awal.map(([berlaku, rp_kwh, sumber_id, tingkat_bukti]) => ({ berlaku, rp_kwh, sumber_id, tingkat_bukti, tanggal: TGL })) }));

  return {
    lapis: 'publik', dibangun_pada: TGL, sumber: SUMBER,
    hba: { satuan: 'USD per ton, FOB vessel, kelas kalori acuan 6.322 kcal/kg GAR', tahunan: hbaTahunan, bulanan: hbaBulanan, periode: HBA_PERIODE.map(([p, v, kep, sid, tb]) => ({ periode: p, usd_ton: v, keputusan: kep, ...mk(sid, tb) })),
      catatan: 'HBA berubah rumus berkali-kali (rata-rata tahunan 2014-2024 dari Ditjen Minerba; sejak 2025 terbit dua kali sebulan). Angka 2025 dan 2026 hanya periode yang dibaca; bukan deret lengkap.' },
    dmo: { harga_usd_ton: 70, tidak_berubah_sejak: 2018, aturan: DMO_ATURAN, volume, regulasi: [{ id: 'permen-esdm-19-2017', peran: 'Pemanfaatan batubara untuk pembangkit listrik dan pembelian kelebihan tenaga listrik (Permen 19/2017)' }] },
    tarif: { golongan: TARIF, tahun: TARIF_TAHUN, seri, triwulan: deretTriwulan(), tingkat_triwulan: 'EST', catatan_triwulan: 'Nilai pada hari pertama triwulan = peristiwa tarif terakhir yang diketahui dibawa maju. Dasar: siaran pers ESDM bahwa tarif nonsubsidi tidak berubah sejak 2017 sampai penurunan Q4 2020 dan kenaikan Q3 2022, dan keputusan "tetap" Q4 2025 sampai Q3 2026. Q4 2026 belum diverifikasi.' },
    subsidi: {
      realisasi: Object.entries(SUBSIDI).map(([y, [t, kwh]]) => ({ tahun: +y, subsidi_rp_triliun: t, energi_bersubsidi_kwh: kwh, ...mk('stat-gatrik-2024', 'resmi') })),
      pagu_vs_realisasi: [
        { tahun: 2024, pagu_rp_triliun: 75.83, realisasi_rp_triliun: 77.04, catatan: 'Pagu Rp73,24 triliun tahun berjalan + Rp2,58 triliun kurang bayar 2022. Menkeu melaporkan Rp75,8 triliun sampai 24 Desember 2024; angka akhir buku statistik Rp77,04 triliun.', sumber_id: 'listrikindonesia-subsidi-2024', sumber_realisasi_id: 'stat-gatrik-2024', tingkat_bukti: 'kata-pihak', tanggal: TGL },
        { tahun: 2025, pagu_rp_triliun: 87.72, realisasi_rp_triliun: null, catatan: 'APBN 2025; realisasi 2025 belum dibaca.', sumber_id: 'investortrust-subsidi-2026', tingkat_bukti: 'kata-pihak', tanggal: TGL },
      ],
      subsidi_dan_kompensasi: [{ tahun: 2023, rp_triliun: 123 }, { tahun: 2024, rp_triliun: 177 }, { tahun: 2025, rp_triliun: 201 }].map((r) => ({ ...r, ...mk('katadata-subsidi-2026', 'kata-pihak', { catatan: 'Subsidi dan kompensasi digabung, menurut Kementerian ESDM di DPR; definisi cakupan tidak dirinci media.' }) })),
      pelanggan_bersubsidi_juta: [{ tahun: 2024, juta: 42, catatan: 'Lebih dari 42 juta pelanggan.', sumber_id: 'listrikindonesia-subsidi-2024', tingkat_bukti: 'kata-pihak', tanggal: TGL }, { tahun: 2026, juta: 44.88, catatan: 'Usulan ESDM untuk RAPBN 2026, bukan realisasi.', sumber_id: 'investortrust-subsidi-2026', tingkat_bukti: 'kata-pihak', tanggal: TGL }, { tahun: 2027, juta: 45.91, catatan: 'Sasaran usulan 2027 (sekitar 83,6 TWh penjualan bersubsidi).', sumber_id: 'katadata-subsidi-2026', tingkat_bukti: 'kata-pihak', tanggal: TGL }],
      pelanggan_total: [[2020, 79000033], [2021, 82543980], [2022, 85636198], [2023, 89153278], [2024, 92877292]].map(([tahun, jumlah]) => ({ tahun, jumlah, ...mk('stat-gatrik-2024', 'resmi') })),
    },
    keandalan: { nasional, wilayah, catatan: 'Angka nasional dirujuk dari keandalan.json, tidak disalin dua kali. Per wilayah/UID PLN kosong karena tidak terbit terbuka.' },
    analisis: {
      id: 'biaya-bbm-pltu-hba-dmo', tingkat_bukti: 'EST', tanggal: TGL,
      rumus: 'sen/kWh = harga_USD_per_ton / (kWh_termal_per_ton x efisiensi) x 100. Subsidi tersirat = max(HBA - 70, 0) x volume batubara ke pembangkit.',
      parameter: { kcal_kg_gar: 6322, kwh_termal_per_ton: rd(KWH_TH_T, 1), efisiensi: { nilai: ETA, rentang: [ETAS[0], ETAS[2]], tingkat_bukti: 'hipotesis', catatan: `Hipotesis armada PLTU (tidak diukur). Pembanding: faktor emisi ${faktorEmisi} tCO2/MWh (karbon_pasar.json, Climate TRACE) setara efisiensi sekitar 36% bila faktor emisi batubara 94,6 kgCO2/GJ. Efisiensi termal rata-rata semua pembangkit PLN di Handbook ESDM 2024 (23,93%) mencakup BBM dan gas siklus terbuka sehingga tidak dipakai.` }, plafon_dmo_usd_ton: CAP },
      tahunan, ebt, bpp_pembanding: { bpp_nasional_2025_rp_kwh: sp.bpp_nasional_2025.rp_kwh, keekonomian_2024_rp_kwh: 1772.22, sumber_id: 'stat-gatrik-2024' },
      catatan: ['HBA acuan 6.322 kcal/kg GAR (kalori tinggi); batubara PLTU umumnya berkalori lebih rendah dan lebih murah, sehingga selisih HBA - 70 dan subsidi tersirat adalah batas atas, bukan kerugian penambang yang terukur.', 'Biaya bahan bakar saja dibanding LCOE penuh EBT (modal + operasi + bahan bakar): tidak sebanding apel dengan apel; hanya menunjukkan seberapa jauh bahan bakar PLTU di bawah harga EBT.', 'HBA nominal USD tahun berjalan; LCOE EBT harga tetap USD 2024/2025.', 'Keputusan menetapkan USD 70 untuk spesifikasi acuan; pada 2020 HBA (58,17) di bawah 70 sehingga harga keputusan justru di atas HBA dan subsidi tersirat ditulis 0, bukan negatif. Plafon USD 70 berlaku sejak 9 Maret 2018; subsidi tersirat 2018 dihitung penuh setahun (melebih-lebihkan sedikit).'],
    },
    tautan: { kode_bps: ['00'], sistem_id: kea.sistem.map((s) => s.id), org_id: ['l_7278e0528a', 'l_7b43a2574c', 'su_ed074ff5'], regulasi_id: ['uu-30-2009', 'permen-esdm-19-2017'], berkas_terkait: ['biaya_listrik.json', 'biaya_bangun.json', 'keandalan.json', 'sistem_pln.json', 'statistik_pln.json', 'pltu.json', 'karbon_pasar.json', 'tarif_harga.json'], rujukan_hukum_belum_ada: ['Permen ESDM 28 Tahun 2016 (tarif tenaga listrik PLN)', 'Permen ESDM 3 Tahun 2020 dan 7 Tahun 2024 (tariff adjustment)', 'Kepmen ESDM 1395 K/30/MEM/2018, 261 K/30/MEM/2019, 255 K/30/MEM/2020, 267.K/MB.01/MEM.B/2022 (DMO)', 'Kepmen ESDM 72, 80, 268 Tahun 2025 (pedoman HBA)'], kode_bps_catatan: '00 = nasional. Per wilayah: sistem_id menunjuk keandalan.json dengan kode_bps provinsinya.' },
    meta: { diperbarui: TGL, tarif_harga_q3_2026_cocok: th.baris.filter((b) => b.kelompok === 'tarif_listrik').length,
      celah: [
        'HBA bulanan 2016 sampai 2024 tidak dimuat: portal minerba.esdm.go.id dalam perbaikan (halaman HBA tidak berisi data) dan keputusan bulanan tidak ditemukan terkumpul; hanya rata-rata tahunan Handbook ESDM 2014-2024, bulanan 2015, dan beberapa periode 2025-2026.',
        'Seri HBA 2025-2026 hanya periode yang tertangkap berita dan siaran pers; kelas kalori tinggi 2026 menurut judul berita; periode lain tidak ada.',
        'Teks Kepmen DMO 2022 sampai 2026 tidak ditemukan di JDIH; nomor 267.K/MB.01/MEM.B/2022 dan porsi 30% tahun 2026 berasal dari berita yang sebagian membalas 403.',
        'Volume DMO bukan target atau realisasi MODI per tahun: yang dimuat penjualan batubara dalam negeri ke pembangkit (Handbook ESDM) dan batubara terbakar di pembangkit PLN; realisasi terhadap target per tahun tidak dibaca.',
        'Tarif per golongan per triwulan 2017-2019 tidak ada tabel resmi per triwulan yang dibaca; deret triwulan dibawa maju dari peristiwa (EST). Golongan bersubsidi dimuat tetap sejak 2014 menurut buku statistik; tarif 24 golongan lengkap menurut Permen ESDM belum ditranskripsi.',
        'Selisih tarif B-3, I-3, P-2: buku statistik 1.122,10 versus siaran pers ESDM 1.114,74. Keduanya dicatat.',
        'Kompensasi listrik terpisah dari subsidi per tahun tidak dibaca dari Kemenkeu/LKPP (domain kemenkeu.go.id tidak dibuka); hanya angka gabungan ESDM 2023-2025 via media. Realisasi 2025 subsidi murni belum ada.',
        'Pelanggan bersubsidi: 2024 (lebih dari 42 juta), usulan 2026 dan 2027 saja; deret tahunan realisasi tidak ditemukan.',
        'SAIDI/SAIFI per wilayah atau UID PLN tidak terbit terbuka (diperiksa Statistik Ketenagalistrikan 2024 dan RUPTL); hanya nasional. Laporan Tahunan/Statistik PLN tidak dapat diakses dari lingkungan panen.',
        'Diskon tarif 50% Juni-Juli 2025 dan stimulus lain tidak dimodelkan.',
      ] },
  };
}
