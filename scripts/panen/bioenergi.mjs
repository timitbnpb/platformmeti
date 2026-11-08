#!/usr/bin/env node
// Bioenergi dan bahan bakar nabati ujung ke ujung -> public/data/bioenergi.json.
// Benih tersusun dari bacaan sumber publik tanggal 2026-11-08 (tiap butir bersumber + bertingkat bukti); TIDAK mengarang angka:
// yang tidak ditemukan ditulis di `celah`. Data yang sudah ada di repo DIRUJUK (riset/biomassa, global/pemasok_lain, energi_baru, topik/bioenergi,
// kebijakan_info), tidak disalin: berkas ini hanya memuat data baru + kunci rujukan. Comtrade dibaca lewat --comtrade (UA sopan, robots, jeda >= 2 dtk, stop 403/429).
// Pakai: --bangun | --selftest | --cek-url (HEAD tiap sumber) | --comtrade (ambil ulang HS 440131 dan 230660 tahunan, simpan ke $BIOENERGI_MENTAH)
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const j = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const T = '2026-11-08';
const S = (id, judul, penerbit, url, tahun, tb = 'media') => ({ id, judul, penerbit, url, tahun, tingkat_bukti: tb, tanggal_periksa: T });
const L = (id, en) => ({ id, en });

export const SUMBER = [
  S('bps-jagung-2024', 'Luas panen jagung pipilan 2024 sekitar 2,55 juta ha, produksi 15,14 juta ton (KA 14%)', 'Badan Pusat Statistik', 'https://www.bps.go.id/id/pressrelease/2025/02/03/2412', 2025, 'resmi'),
  S('kementan-ubikayu', 'Statistik Pertanian 2025: produksi ubi kayu nasional 2024 sekitar 16,71 juta ton', 'Kementerian Pertanian', 'https://repository.pertanian.go.id/bitstreams/18d86d4e-c3da-4686-81cb-4d29f5a7cfc3/download', 2025, 'resmi'),
  S('satudata-ubikayu', 'Analisis kinerja perdagangan ubi kayu 2025: Lampung 47,32% produksi 2024', 'Pusdatin Kementan (Satu Data)', 'https://satudata.pertanian.go.id/details/publikasi/938', 2025, 'resmi'),
  S('databoks-tebu', 'Produksi tebu seluruh Indonesia 2024 (Kementan, via Databoks)', 'Databoks Katadata', 'https://databoks.katadata.co.id/en/demographics/multiple/bfa98644c7be700/sugar-cane-production-20132024-period', 2025, 'via-pihak-ketiga'),
  S('jawapos-sawit', 'Luas sawit 2024 16.005,1 ribu ha (BPS): kebun besar 9.222, rakyat 6.783,1 ribu ha', 'Jawa Pos', 'https://www.jawapos.com/nasional/2512110055/5-wilayah-dengan-lahan-sawit-paling-luas-di-indonesia-bukan-sumatera-justru-didominasi-pulau-kalimantan', 2025),
  S('esdm-alokasi-2023', 'Penetapan alokasi biodiesel 2023 sebesar 13,15 juta kiloliter', 'Kementerian ESDM', 'https://esdm.go.id/id/media-center/arsip-berita/penetapan-alokasi-biodiesel-tahun-2023-sebesar-1315-juta-kiloliter', 2023, 'resmi'),
  S('ibp-alokasi-2024', 'ESDM sets B35 biodiesel quota at 13.41 million for 2024', 'Indonesia Business Post', 'https://indonesiabusinesspost.com/1460/Politics/esdm-sets-b35-biodiesel-quota-at-1341-million-for-2024', 2024),
  S('cnbc-b40-2025', 'Mandatori 1 Januari 2025, kuota biodiesel B40 ditetapkan 15,6 juta kl', 'CNBC Indonesia', 'https://www.cnbcindonesia.com/news/20250103144325-4-600557/mandatori-1-januari-2025-kuota-biodiesel-b40-ditetapkan-156-juta-kl', 2025),
  S('li-tren-bd', 'Tren implementasi biodiesel selama empat tahun terakhir (realisasi 2020-2024)', 'listrikindonesia.com', 'https://listrikindonesia.com/detail/19046/tren-implementasi-biodiesel-selama-empat-tahun-terakhir-ini-angkanya', 2025),
  S('katadata-b40-sem1', 'Konsumsi biodiesel B40 RI 6,8 juta KL pada semester I 2025', 'Katadata', 'https://katadata.co.id/amp/berita/energi/689abd5f65f48/konsumsi-biodiesel-b40-ri-6-8-juta-kl-pada-semester-i-setengah-target-2025/', 2025),
  S('kontan-hip-jan', 'Harga biodiesel naik jadi Rp13.631 pada Januari 2026 (Desember 2025 Rp13.381)', 'Kontan', 'https://industri.kontan.co.id/news/harga-biodiesel-naik-jadi-rp-13631-pada-januari-2026', 2026),
  S('gnfi-hip-feb', 'Harga biodiesel dan bioetanol Februari 2026 ditetapkan', 'Good News from Indonesia', 'https://www.goodnewsfromindonesia.id/2026/02/11/harga-biodiesel-dan-bioetanol-februari-2026-ditetapkan-ini-rinciannya', 2026),
  S('bisnis-hip-mar', 'Harga biodiesel naik jadi Rp13.980 per liter pada Maret 2026', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20260307/44/1958588/harga-biodiesel-naik-jadi-rp13980-per-liter-pada-maret-2026', 2026),
  S('bisnis-hip-apr', 'Harga biodiesel dan bioetanol kompak naik pada April 2026', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20260404/44/1964210/harga-biodiesel-dan-bioetanol-kompak-naik-pada-april-2026', 2026),
  S('bisnis-hip-mei', 'Harga biodiesel dan bioetanol kompak naik pada Mei 2026', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20260510/44/1972718/harga-biodiesel-dan-bioetanol-kompak-naik-pada-mei-2026', 2026),
  S('it-hip-jun', 'Harga biodiesel naik ke Rp14.643 per liter, bioetanol Rp8.062 pada Juni 2026', 'Investortrust', 'https://investortrust.id/business/105177/harga-biodiesel-naik-ke-rp-14643-per-liter-bioetanol-dipatok-rp-8062-pada-juni-2026', 2026),
  S('li-hip-jul', 'Harga biodiesel Juli 2026 ditetapkan Rp14.562 per liter', 'listrikindonesia.com', 'https://listrikindonesia.com/detail/20556/harga-biodiesel-juli-2026-ditetapkan-rp14562-per-liter-ini-faktor-penentunya', 2026),
  S('bisnis-etanol-jul', 'Harga bioetanol melonjak ke Rp10.933 per liter pada Juli 2026', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20260707/44/1986135/harga-bioetanol-melonjak-ke-rp10933-per-liter-pada-juli-2026', 2026),
  S('it-hip-agu', 'ESDM tetapkan harga biodiesel Agustus 2026 Rp14.924 per liter', 'Investortrust', 'https://investortrust.id/business/112032/esdm-tetapkan-harga-biodiesel-agustus-2026-rp-14924-per-liter', 2026),
  S('bisnis-e10-1_4', 'Mandatori E10 mulai 2027, Bahlil: butuh etanol 1,4 juta kiloliter', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20251024/44/1923128/mandatori-e10-mulai-2027-bahlil-butuh-etanol-14-juta-kiloliter', 2025),
  S('bisnis-e10-molase', 'ESDM pastikan kebijakan bioetanol E10 tak ganggu produksi gula (bahan baku molase tebu)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20251030/44/1924837/esdm-pastikan-kebijakan-bioetanol-e10-tak-ganggu-produksi-gula', 2025),
  S('bisnis-e10-e20', 'Bahlil: pemerintah fokus terapkan E10 hingga 2027, E20 menunggu kesiapan industri etanol', 'Bisnis.com', 'https://kabar24.bisnis.com/read/20260728/15/1991787/bahlil-pemerintah-fokus-terapkan-e10-hingga-2027-e20-menunggu-kesiapan-industri-etanol', 2026),
  S('it-e10-2028', 'Bahlil pastikan mandatori E10 paling lambat jalan 2028', 'Investortrust', 'https://investortrust.id/business/90846/bahlil-pastikan-mandatori-e10-paling-lambat-jalan-2028', 2026),
  S('kontan-e10-roadmap', 'Kementerian ESDM siapkan roadmap mandatori bioetanol E10 pada 2027 (pasokan 70.500 kl vs kebutuhan 400-500 ribu kl menurut Dirjen EBTKE)', 'Kontan', 'https://industri.kontan.co.id/news/kementerian-esdm-siapkan-roadmap-mandatori-bioetanol-e10-pada-2027', 2026),
  S('gnfi-saf-2023', 'Pertamina dan Garuda Indonesia sukses uji terbang bioavtur (4 Oktober 2023, Boeing 737-800 PK-GFX)', 'Good News from Indonesia', 'https://www.goodnewsfromindonesia.id/2023/10/10/pertamina-garuda-indonesia-sukses-uji-terbang-pakai-bioavtur', 2023),
  S('cnn-saf-2023', 'SAF mengangkasa, bioavtur Pertamina bawa Garuda Indonesia terbang', 'CNN Indonesia', 'https://www.cnnindonesia.com/ekonomi/20231027175459-625-1016858/saf-mengangkasa-bioavtur-pertamina-bawa-garuda-indonesia-terbang', 2023),
  S('we-saf-uco', 'Pertamina kirim perdana bahan bakar pesawat dari minyak jelantah', 'Warta Ekonomi', 'https://wartaekonomi.co.id/read578619/pertamina-kirim-perdana-bahan-bakar-pesawat-dari-minyak-jelantah', 2025),
  S('bisnis-saf-2027', 'Pertamina genjot ekosistem bioavtur jelang mandatori SAF 1% mulai 2027', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20260724/44/1990683/pertamina-genjot-ekosistem-bioavtur-jelang-mandatori-saf-1-mulai-2027', 2026),
  S('li-uco-6000', 'Kilang Pertamina Internasional siap olah minyak jelantah 6.000 barel per hari', 'listrikindonesia.com', 'https://listrikindonesia.com/detail/15029/kilang-pertamina-internasional-siap-olah-minyak-jelantah-6000-barel-per-hari', 2024),
  S('it-biorefinery', 'Investasi US$1,1 miliar, biorefinery Cilacap ditargetkan produksi 887 KL biofuel per hari', 'Investortrust', 'https://investortrust.id/business/115854/investasi-us-1-1-miliar-biorefinery-cilacap-ditargetkan-produksi-887-kl-biofuel-per-hari', 2026),
  S('katadata-biorefinery', 'Pertamina targetkan proyek biorefinery Cilacap Rp19 triliun beroperasi 2029', 'Katadata', 'https://katadata.co.id/amp/berita/energi/6aa338c250f04/pertamina-targetkan-proyek-biorefinery-cilacap-rp19-triliun-beroperasi-2029', 2026),
  S('kontan-cofiring', 'Pasokan biomassa co-firing PLN EPI (rujukan butir pemasok_lain)', 'Kontan', 'https://industri.kontan.co.id/news/pln-epi-targetkan-pasokan-biomassa-co-firing-naik-jadi-407-juta-ton-pada-2027', 2026),
  S('gnfi-pltbg', 'PLTBg Sei Mangkei olah limbah POME jadi energi hijau (Pertamina NRE dan PTPN III)', 'Good News from Indonesia', 'https://www.goodnewsfromindonesia.id/2025/12/30/pltbg-sei-mangkei-24-mw-olah-limbah-pome-jadi-energi-hijau', 2025),
  S('katadata-biogas', 'Penggunaan biogas RI 28,5 juta meter kubik, 40% dari limbah sawit; potensi POME 5,2 miliar m3 per tahun', 'Katadata', 'https://katadata.co.id/amp/berita/energi/64e86e6b0008b/penggunaan-biogas-ri-28-5-juta-metrik-kubik-40-dari-limbah-sawit', 2023),
  S('li-biocng', 'PLN EPI bidik pengembangan bio-CNG dari limbah sawit (untuk PLTGU Belawan 1.184 MW)', 'listrikindonesia.com', 'https://listrikindonesia.com/detail/20271/pln-epi-bidik-pengembangan-bio-cng-dari-limbah-sawit', 2026),
  S('comtrade', 'UN Comtrade, ekspor tahunan Indonesia (reporter 360) HS 440131 pelet kayu dan HS 230660 bungkil inti sawit', 'United Nations Statistics Division', 'https://comtradeplus.un.org/', 2026, 'resmi'),
  S('kontan-pks-jepang', 'Produk biomassa asal Indonesia raup transaksi Rp10,4 triliun di Jepang (PKS 4,5 juta ton per tahun)', 'Kontan', 'https://industri.kontan.co.id/news/produk-biomassa-asal-indonesia-raup-transaksi-rp-104-triliun-di-jepang', 2025),
  S('mongabay-pelet', 'Hutan Indonesia di tengah ambisi biomassa Jepang dan Korsel (pelet kayu 2021-2024: Korsel 67,2%, Jepang 32,5%)', 'Mongabay Indonesia', 'https://mongabay.co.id/2025/03/16/hutan-indonesia-di-tengah-ambisi-biomassa-jepang-dan-korsel/', 2025),
  S('kontan-pelet', 'Pengusaha soroti black campaign wood pellet, ungkap tantangan dan peluang biomassa', 'Kontan', 'https://industri.kontan.co.id/news/pengusaha-soroti-black-campaign-wood-pellet-ungkap-tantangan-peluang-biomassa', 2025),
  S('it-pungutan-hist', 'Penerimaan pungutan ekspor sawit terus turun: Rp71 T (2021), Rp51 T (2022), Rp34 T (2023)', 'Investortrust', 'https://investortrust.id/business/30857/penerimaan-pungutan-ekspor-sawit-terus-turun-ini-sebabnya', 2024),
  S('it-pungutan-2024', 'BPDPKS pangkas penerimaan pungutan ekspor sawit jadi Rp24 triliun', 'Investortrust', 'https://investortrust.id/business/48488/bpdks-pangkas-peneriman-punguntan-ekspor-sawit-jadi-rp-24-triliun-ternyata-ini-pemicunya', 2024),
  S('cnn-pungutan-2026', 'BPDP ungkap penerimaan dari ekspor sawit tembus Rp22,7 T (hingga 30 Juni 2026)', 'CNN Indonesia', 'https://cnnindonesia.com/ekonomi/20260803102632-92-1387900/bpdp-ungkap-penerimaan-dari-ekspor-sawit-tembus-rp227-t', 2026),
  S('bisnis-b40-47t', 'Implementasi biodiesel B40 diproyeksi butuh dana Rp47 triliun pada 2025', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20241107/44/1814182/implementasi-biodiesel-b40-diproyeksi-butuh-dana-rp47-triliun-pada-2025', 2024),
  S('bisnis-subsidi-51t', 'ESDM ungkap alasan alokasi dana subsidi biodiesel B40 bertambah Rp16 triliun (total Rp51 triliun)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20250812/44/1901454/esdm-ungkap-alasan-alokasi-dana-subsidi-biodiesel-b40-bertambah-rp16-triliun/1', 2025),
  S('bisnis-insentif-2023', 'Biodiesel B35 sedot dana sawit Rp4,04 triliun pada semester I 2023', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20230809/44/1683069/biodiesel-b35-sedot-dana-sawit-rp404-triliun-siapa-penikmatnya', 2023),
  S('kontan-pmk30', 'Mulai 17 Mei 2025 pungutan ekspor CPO naik jadi 10% (PMK 30/2025)', 'Kontan', 'https://nasional.kontan.co.id/news/mulai-17-mei-2025-pungutan-ekspor-cpo-naik-jadi-10', 2025),
  S('metro-pangan', 'Bahlil pastikan B50 tak bikin stok minyak goreng jebol (kebutuhan CPO minyak goreng sekitar 4,99 juta ton per tahun)', 'Metro TV', 'https://www.metrotvnews.com/read/K5nC7VeY-bahlil-pastikan-b50-tak-bikin-stok-minyak-goreng-jebol', 2026),
  S('metro-b50', 'Kebijakan B50 diyakini tak ganggu pasokan CPO untuk minyak goreng (B50 sekitar 5,3 juta ton CPO; kajian BPDP 20,1 juta kl atau 18,69 juta ton CPO)', 'Metro TV', 'https://www.metrotvnews.com/read/koGCdMdv-kebijakan-b50-diyakini-tak-ganggu-pasokan-cpo-untuk-minyak-goreng', 2026),
  S('bisnis-b50-migor', 'Program B50 dinilai berisiko mengerek harga minyak goreng', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20260504/12/1971204/program-b50-dinilai-berisiko-mengerek-harga-minyak-goreng-ini-sebabnya', 2026),
  S('mongabay-b50', 'Menyoal mandatori biodiesel B50 (lahan tambahan 3,2 juta ha hingga 2035; Madani lebih dari 6 juta ha)', 'Mongabay Indonesia', 'https://mongabay.co.id/2026/07/11/menyoal-mandatori-biodiesel-b50', 2026),
  S('greenpeace-b50', 'Kebijakan B50 berpotensi memicu deforestasi dan kenaikan harga pangan nasional', 'Greenpeace Indonesia', 'https://www.greenpeace.org/indonesia/siaran-pers/66050/kebijakan-b50-berpotensi-memicu-deforestasi-dan-kenaikan-harga-pangan-nasional/', 2026, 'kata-pihak'),
  S('kontan-gapki', 'GAPKI: kenaikan tarif pungutan ekspor tekan harga TBS petani', 'Kontan', 'https://industri.kontan.co.id/news/gapki-kenaikan-tarif-ekspor-cpo-tekan-harga-tbs-petani', 2025, 'kata-pihak'),
  S('bisnis-peremajaan', 'Alasan di balik lambatnya peremajaan sawit rakyat (2023: Rp1,7 T untuk peremajaan dari Rp32,4 T)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20240829/12/1795102/alasan-di-balik-lambatnya-peremajaan-sawit-rakyat', 2024),
];

const A = (tahun, alokasi, realisasi, sa, sr, ket) => ({ tahun, alokasi_kl: alokasi, realisasi_kl: realisasi, sumber_alokasi: sa, sumber_realisasi: sr, catatan: ket });
const H = (bulan, bd, be, sd, se) => ({ bulan, biodiesel_rp_l: bd, bioetanol_rp_l: be ?? null, sumber_id: sd, sumber_etanol: se ?? null, tingkat_bukti: 'cuplikan' });

export function bangun() {
  const bio = j('public/data/riset/biomassa.json'), pl = j('public/data/global/pemasok_lain.json');
  const sawit = bio.baris.map((b) => b.kode_prov);
  return {
    lapis: 'bioenergi', dibangun_pada: T,
    rujukan: {
      note: 'Berkas ini merujuk, tidak menyalin. Pembaca (public/bio_*.js) membuka berkas rujukan saat runtime.',
      biomassa_provinsi: 'riset/biomassa.json', pemasok: 'global/pemasok_lain.json', cofiring: ['cf-nasional', 'cf-bangka', 'cf-kendari'], energi_baru: 'energi_baru.json',
      topik: 'bioenergi', program: 'b50', regulasi_id: ['permen-esdm-12-2023', 'perpres-112-2022'],
      produsen_fame: ['p_f9b341c0f2', 'p_6f8075d555', 'en_47d4add3f5', 'p_72cc04659c'], produsen_etanol: ['p_1a272e3233', 'p_cbc53a2908', 'p_10e0dde689'],
      pemasok_biomassa: ['en_7aaca4416c', 'en_659d53839c', 'en_2b3a981f9c'], operator: ['su_ed074ff5', 'p_ff7a390a42'], asosiasi: ['en_a12d603d3d'], pabrikan_global: ['en_50674f19eb', 'en_e258813aa4'],
      provinsi_sawit: sawit.length,
    },
    sumber: SUMBER,
    mandat: [
      { id: 'b30', kode: 'B30', jenis: 'biodiesel', persen: 30, mulai: '2020-01', sumber_ids: ['li-tren-bd'], tingkat_bukti: 'cuplikan', ket: L('Realisasi 2020 sampai 2022 mengikuti B30 (8,4; 9,3; 10,4 juta kl).', 'Actual 2020 to 2022 followed B30 (8.4, 9.3, 10.4 million kl).') },
      { id: 'b35', kode: 'B35', jenis: 'biodiesel', persen: 35, mulai: '2023-02', sumber_ids: ['esdm-alokasi-2023', 'li-tren-bd'], tingkat_bukti: 'resmi', ket: L('Alokasi 2023 13,15 juta kl; realisasi 2023 sekitar 12,2-12,3 juta kl.', '2023 allocation 13.15 million kl; actual about 12.2-12.3 million kl.') },
      { id: 'b40', kode: 'B40', jenis: 'biodiesel', persen: 40, mulai: '2025-01', sumber_ids: ['cnbc-b40-2025'], tingkat_bukti: 'cuplikan', ket: L('Berlaku 1 Januari 2025; kuota 2025 15,6 juta kl (PSO 7,55; non-PSO 8,07).', 'In force 1 January 2025; 2025 quota 15.6 million kl (PSO 7.55; non-PSO 8.07).') },
      { id: 'b50', kode: 'B50', jenis: 'biodiesel', persen: 50, mulai: '2026-07', sumber_ids: ['metro-b50'], tingkat_bukti: 'cuplikan', ket: L('Berlaku 1 Juli 2026 dengan masa transisi (rujukan: program b50 pada kebijakan_info). Kajian BPDP: 20,1 juta kl.', 'In force 1 July 2026 with a transition (see program b50 in kebijakan_info). BPDP study: 20.1 million kl.') },
      { id: 'e5', kode: 'E5', jenis: 'bioetanol', persen: 5, mulai: null, sumber_ids: ['bisnis-e10-e20'], tingkat_bukti: 'cuplikan', ket: L('Kontan/Bloomberg Technoz menyebut persiapan mandatori E5; tanggal berlaku belum terkonfirmasi di sumber yang dibaca.', 'Reports mention E5 preparation; the in-force date is not confirmed in the sources read.') },
      { id: 'e10', kode: 'E10', jenis: 'bioetanol', persen: 10, mulai: '2027', sumber_ids: ['bisnis-e10-1_4', 'it-e10-2028'], tingkat_bukti: 'cuplikan', ket: L('Target 2027, paling lambat 2028; kebutuhan etanol 1,4 juta kl.', 'Target 2027, no later than 2028; ethanol need 1.4 million kl.') },
      { id: 'saf1', kode: 'SAF 1%', jenis: 'saf', persen: 1, mulai: '2027', sumber_ids: ['bisnis-saf-2027'], tingkat_bukti: 'cuplikan', ket: L('Mandat SAF 1% dijadwalkan mulai 2027.', 'A 1% SAF mandate is scheduled from 2027.') },
    ],
    alokasi: [
      A(2020, null, 8400000, null, 'li-tren-bd', 'B30'), A(2021, null, 9300000, null, 'li-tren-bd', 'B30'), A(2022, null, 10400000, null, 'li-tren-bd', 'B30'),
      A(2023, 13148594, 12300000, 'esdm-alokasi-2023', 'li-tren-bd', 'B35'), A(2024, 13410000, 13200000, 'ibp-alokasi-2024', 'li-tren-bd', 'B35'),
      A(2025, 15600000, null, 'cnbc-b40-2025', null, 'B40; semester I 2025 terpakai 6,8 juta kl (Katadata)'),
      { ...A(2026, 15646372, null, null, null, 'B40/B50; alokasi dari butir pemasok_lain (siaran ESDM)'), rujuk_butir: { segmen: 'biofuel', jenis: 'kebijakan', org: null, cocok: '15.646.372' } },
    ],
    hip: [
      H('2025-12', 13381, null, 'kontan-hip-jan'), H('2026-01', 13631, null, 'kontan-hip-jan'), H('2026-02', 13856, null, 'gnfi-hip-feb'), H('2026-03', 13980, null, 'bisnis-hip-mar'),
      H('2026-04', 14262, null, 'bisnis-hip-apr'), H('2026-05', 14917, null, 'bisnis-hip-mei'), H('2026-06', 14643, 8062, 'it-hip-jun', 'it-hip-jun'),
      H('2026-07', 14562, 10933, 'li-hip-jul', 'bisnis-etanol-jul'), H('2026-08', 14924, null, 'it-hip-agu'),
    ],
    hip_rujuk: { rumus: 'global/pemasok_lain butir fame jenis harga (HIP biodiesel: (CPO KPB + US$85/ton) x 870 kg/m3 + ongkos angkut); Nov 2025 Rp14.036 dan HIP bioetanol Nov 2025 Rp9.013 ada di butir itu.' },
    bioetanol: {
      kebutuhan_e10_kl: 1400000, sumber_kebutuhan: 'bisnis-e10-1_4',
      pasokan_kl: 70500, kebutuhan_awal_kl: [400000, 500000], sumber_pasokan: 'kontan-e10-roadmap',
      bahan_baku: [{ k: 'molase-tebu', sumber_id: 'bisnis-e10-molase' }, { k: 'singkong', sumber_id: 'kontan-e10-roadmap' }, { k: 'jagung', sumber_id: 'kontan-e10-roadmap' }],
      kendala: [
        { k: 'pasokan', ket: L('Pasokan etanol fuel grade sekitar 70.500 kl berbanding kebutuhan awal 400-500 ribu kl (pernyataan Dirjen EBTKE); kebutuhan E10 penuh 1,4 juta kl.', 'Fuel-grade ethanol supply is about 70,500 kl against an initial need of 400-500 thousand kl; full E10 needs 1.4 million kl.'), sumber_id: 'kontan-e10-roadmap', tingkat_bukti: 'cuplikan' },
        { k: 'molase', ket: L('ESDM menyatakan E10 hanya memakai molase tebu (hasil samping gula) agar tidak mengganggu produksi gula.', 'ESDM says E10 will use only sugar-cane molasses (a sugar by-product) so sugar output is not disturbed.'), sumber_id: 'bisnis-e10-molase', tingkat_bukti: 'cuplikan' },
        { k: 'industri', ket: L('E20 menunggu kesiapan industri etanol; persiapan pabrik disebut butuh 1-2 tahun.', 'E20 awaits ethanol industry readiness; plant preparation is said to take 1-2 years.'), sumber_id: 'bisnis-e10-e20', tingkat_bukti: 'cuplikan' },
      ],
    },
    saf: {
      linimasa: [
        { tgl: '2021', jenis: 'uji', ket: L('Uji darat dan terbang J2.4 (minyak inti sawit RBDPKO) pada pesawat CN-235 PT Dirgantara Indonesia.', 'Ground and flight test of J2.4 (RBDPKO palm kernel oil) on a PT Dirgantara Indonesia CN-235.'), sumber_id: 'gnfi-saf-2023', tingkat_bukti: 'cuplikan' },
        { tgl: '2023-10-04', jenis: 'uji', ket: L('Uji terbang komersial Garuda Indonesia (Boeing 737-800 PK-GFX) dengan SAF dari Kilang Cilacap, jalur co-processing.', 'Garuda Indonesia commercial test flight (Boeing 737-800 PK-GFX) with SAF from the Cilacap refinery, co-processing route.'), sumber_id: 'gnfi-saf-2023', tingkat_bukti: 'cuplikan' },
        { tgl: '2023-10-27', jenis: 'komersial', ket: L('Penerbangan komersial berbahan SAF (liputan CNN Indonesia).', 'Commercial flight on SAF (CNN Indonesia coverage).'), sumber_id: 'cnn-saf-2023', tingkat_bukti: 'cuplikan' },
        { tgl: '2025', jenis: 'pasokan', ket: L('KPI Cilacap mengirim perdana bioavtur berbahan minyak jelantah (UCO); UCO dapat diolah sampai 3% bersama minyak bumi.', 'KPI Cilacap made its first shipment of used-cooking-oil (UCO) bio-jet; UCO can be processed up to 3% with crude.'), sumber_id: 'we-saf-uco', tingkat_bukti: 'cuplikan' },
        { tgl: '2027', jenis: 'mandat', ket: L('Mandat SAF 1% dijadwalkan; co-processing juga diuji di Dumai dan Balongan.', 'A 1% SAF mandate is scheduled; co-processing is also tested at Dumai and Balongan.'), sumber_id: 'bisnis-saf-2027', tingkat_bukti: 'cuplikan' },
        { tgl: '2029', jenis: 'kapasitas', ket: L('Biorefinery Cilacap (sekitar US$1,1 miliar, Rp19 triliun) ditargetkan beroperasi 2029: sekitar 887 kl biofuel per hari (desain SAF ~860 kl atau HVO ~870 kl per hari).', 'Cilacap biorefinery (about US$1.1 billion, Rp19 trillion) targeted for 2029: about 887 kl of biofuel per day (design SAF ~860 kl or HVO ~870 kl per day).'), sumber_id: 'it-biorefinery', tingkat_bukti: 'cuplikan' },
      ],
      kapasitas: [
        { k: 'uco', nilai: 6000, satuan: 'bph', ket: L('Kapasitas olah minyak jelantah KPI yang disiapkan (barel per hari).', 'KPI used-cooking-oil processing capacity prepared (barrels per day).'), sumber_id: 'li-uco-6000', tingkat_bukti: 'cuplikan' },
        { k: 'biorefinery', nilai: 887, satuan: 'kl/hari', ket: L('Target biorefinery Cilacap 2029.', 'Cilacap biorefinery target, 2029.'), sumber_id: 'it-biorefinery', tingkat_bukti: 'cuplikan' },
      ],
      org_ids: ['p_10e0dde689'],
    },
    cofiring: {
      unit: [
        { id: 'bangka', nama: L('PLTU Bangka Baru', 'Bangka Baru coal plant'), prov: '19', persen: '5-25', volume_ton: 16340, periode: '2025-04', org_id: 'p_ff7a390a42', rujuk: 'energi_baru#cf-bangka' },
        { id: 'kendari', nama: L('PLTU Kendari', 'Kendari coal plant'), prov: '74', persen: null, volume_ton: 4323, periode: '2025-04', org_id: 'p_ff7a390a42', rujuk: 'energi_baru#cf-kendari' },
        { id: 'belitung', nama: L('PLTU Belitung', 'Belitung coal plant'), prov: '19', persen: null, volume_ton: 3115, periode: '2025-04', org_id: 'p_ff7a390a42', rujuk: 'energi_baru#cf-kendari' },
        { id: 'ropa', nama: L('PLTU Ropa', 'Ropa coal plant'), prov: '53', persen: null, volume_ton: 273, periode: '2025-04', org_id: 'p_ff7a390a42', rujuk: 'energi_baru#cf-kendari' },
        { id: 'rembang', nama: L('PLTU Rembang', 'Rembang coal plant'), prov: '33', persen: '5-10', volume_ton: 185000, periode: null, org_id: 'su_ed074ff5', rujuk: 'pemasok_lain#PLTU Rembang' },
        { id: 'sintang', nama: L('PLTU Sintang', 'Sintang coal plant'), prov: '61', persen: '100', volume_ton: null, periode: '2022', org_id: 'su_ed074ff5', rujuk: 'pemasok_lain#PLTU Sintang' },
        { id: 'balikpapan', nama: L('PLTU Teluk Balikpapan', 'Teluk Balikpapan coal plant'), prov: '64', persen: null, volume_ton: 6700, periode: '2026-03', org_id: 'su_ed074ff5', rujuk: 'pemasok_lain#PLTU Teluk Balikpapan' },
        { id: 'tenayan', nama: L('PLTU Tenayan', 'Tenayan coal plant'), prov: '14', persen: null, volume_ton: 5000, periode: 'per bulan', org_id: 'en_7aaca4416c', rujuk: 'pemasok_lain#PLTU Tenayan' },
      ],
      komposisi: [{ k: 'sawdust', persen: 54.6 }, { k: 'woodchip', persen: 22.4 }, { k: 'lain', persen: 23 }],
      komposisi_rujuk: 'pemasok_lain#serbuk gergaji (sawdust) 54,6%', komposisi_catatan: 'lain = sisa (100 - 54,6 - 22,4), dihitung; bukan angka sumber.',
      tahunan: [{ tahun: 2023, volume_juta_t: null }, { tahun: 2025, volume_juta_t: 2.4, target: 10.2 }, { tahun: 2026, target: 3.65 }, { tahun: 2027, target: 4.07 }],
      tahunan_rujuk: 'pemasok_lain#Realisasi serapan biomassa co-firing 2025',
    },
    biogas: {
      pltbg: [
        { id: 'sei-mangkei', nama: L('PLTBg Sei Mangkei (POME)', 'Sei Mangkei biogas plant (POME)'), prov: '12', mw: 2.4, org_ids: ['p_10e0dde689'], sumber_id: 'gnfi-pltbg', tingkat_bukti: 'cuplikan', catatan: L('Alamat artikel menulis 24 MW, isi artikel 2,4 MW; dipakai 2,4 MW, perlu verifikasi.', 'The URL says 24 MW, the article text 2.4 MW; 2.4 MW used, to be verified.') },
      ],
      nasional: [
        { k: 'pemanfaatan', nilai: 28.5, satuan: 'juta m3', ket: L('Pemanfaatan biogas nasional (2023), 40% dari limbah sawit.', 'National biogas use (2023), 40% from palm waste.'), sumber_id: 'katadata-biogas', tingkat_bukti: 'cuplikan' },
        { k: 'potensi', nilai: 5.2, satuan: 'miliar m3/tahun', ket: L('Potensi biogas dari POME.', 'Biogas potential from POME.'), sumber_id: 'katadata-biogas', tingkat_bukti: 'cuplikan' },
      ],
      biocng: { ket: L('PLN EPI membidik POME menjadi biometana lalu bio-CNG untuk PLTGU Belawan (1.184 MW terpasang); kapasitas fasilitas bio-CNG belum disebut sumber.', 'PLN EPI targets POME to biomethane then bio-CNG for the Belawan combined-cycle plant (1,184 MW installed); the bio-CNG facility capacity is not stated.'), sumber_id: 'li-biocng', tingkat_bukti: 'cuplikan', org_ids: ['su_ed074ff5'] },
    },
    pelet: {
      comtrade: [
        { hs: '440131', tahun: 2022, usd: 62626107, ton: 506468, mitra: [{ iso: 'kr', ton: 456701 }, { iso: 'jp', ton: 48979 }] },
        { hs: '440131', tahun: 2023, usd: 74676074, ton: 615491, mitra: [{ iso: 'kr', ton: 535248 }, { iso: 'jp', ton: 77583 }] },
        { hs: '440131', tahun: 2024, usd: 96446229, ton: 840731, mitra: [{ iso: 'kr', ton: 676776 }, { iso: 'jp', ton: 161729 }] },
        { hs: '230660', tahun: 2022, usd: 1067160792, ton: 5463377, mitra: [{ iso: 'nl', ton: 1751625 }, { iso: 'nz', ton: 1376655 }, { iso: 'cn', ton: 579270 }, { iso: 'kr', ton: 647891 }, { iso: 'vn', ton: 569486 }] },
        { hs: '230660', tahun: 2023, usd: 854954600, ton: null, mitra: [{ iso: 'nl', ton: 1799687 }, { iso: 'nz', ton: 1063220 }, { iso: 'cn', ton: 786340 }, { iso: 'kr', ton: 677273 }, { iso: 'vn', ton: 616934 }] },
        { hs: '230660', tahun: 2024, usd: 622024238, ton: null, mitra: [{ iso: 'nl', ton: 1486396 }, { iso: 'nz', ton: 1157381 }, { iso: 'vn', ton: 551974 }, { iso: 'cn', ton: 457953 }, { iso: 'kr', ton: 434481 }] },
      ],
      comtrade_catatan: L('Nilai dunia 2023 dan 2024 untuk HS 230660 tanpa berat bersih agregat; mitra teratas memakai berat bersih per mitra. HS 230660 adalah bungkil inti sawit (pakan), BUKAN cangkang; cangkang (PKS) tidak punya subpos HS sendiri yang terbaca.', 'World totals for 2023 and 2024 for HS 230660 lack aggregate net weight; top partners use per-partner net weight. HS 230660 is palm kernel cake (feed), NOT kernel shells; shells (PKS) have no clear HS subheading of their own.'),
      industri: [
        { k: 'pks_jepang', nilai: 4.5, satuan: 'juta t/tahun', ket: L('Ekspor cangkang sawit (PKS) ke Jepang; produksi PKS nasional sekitar 14 juta ton, sekitar 35% diekspor.', 'Palm kernel shell (PKS) exports to Japan; national PKS output is about 14 million t, about 35% exported.'), sumber_id: 'kontan-pks-jepang', tingkat_bukti: 'cuplikan' },
        { k: 'pelet_porsi', nilai: 67.2, satuan: '% Korsel', ket: L('Pembagian ekspor pelet kayu 2021-2024: Korea Selatan 67,2%, Jepang 32,5% (riset yang dikutip Mongabay); sumber industri menyebut Jepang sekitar 80%.', 'Wood pellet export split 2021-2024: South Korea 67.2%, Japan 32.5% (research cited by Mongabay); an industry source says Japan about 80%.'), sumber_id: 'mongabay-pelet', tingkat_bukti: 'cuplikan' },
        { k: 'pelet_izin', nilai: 35, satuan: 'industri', ket: L('35 industri pelet kayu berizin 3,18 juta m3; produksi riil 2024 hanya 333.971 m3 (rujukan butir pemasok_lain).', '35 licensed wood-pellet plants with 3.18 million m3 of permits; actual 2024 output only 333,971 m3 (see pemasok_lain item).'), sumber_id: 'kontan-pelet', tingkat_bukti: 'cuplikan' },
      ],
      org_ids: ['en_2b3a981f9c', 'en_7aaca4416c', 'en_659d53839c'],
    },
    dana: {
      tarif: [
        { berlaku: '2025-05-17', cpo_persen: 10, sebelum_persen: 7.5, dasar: 'PMK 30/2025', sumber_id: 'kontan-pmk30', tingkat_bukti: 'cuplikan', ket: L('Turunan CPO 4,75-9,5% (sebelumnya 3-6%).', 'CPO derivatives 4.75-9.5% (previously 3-6%).') },
      ],
      penerimaan: [
        { tahun: 2021, triliun: 71, sumber_id: 'it-pungutan-hist', tingkat_bukti: 'cuplikan' }, { tahun: 2022, triliun: 51, sumber_id: 'it-pungutan-hist', tingkat_bukti: 'cuplikan' },
        { tahun: 2023, triliun: 34, sumber_id: 'it-pungutan-hist', tingkat_bukti: 'cuplikan', catatan: L('Bisnis.com menyebut Rp32,4 triliun.', 'Bisnis.com says Rp32.4 trillion.') },
        { tahun: 2024, triliun: 24, target: true, sumber_id: 'it-pungutan-2024', tingkat_bukti: 'cuplikan', catatan: L('Target revisi setelah PMK 62/2024, bukan realisasi.', 'Revised target after PMK 62/2024, not an outturn.') },
        { tahun: 2026, triliun: 22.7, parsial: 'semester I', sumber_id: 'cnn-pungutan-2026', tingkat_bukti: 'cuplikan', catatan: L('Hingga 30 Juni 2026; Kontan menyebut sekitar Rp21 triliun.', 'To 30 June 2026; Kontan says about Rp21 trillion.') },
      ],
      kebutuhan: [
        { tahun: 2025, k: 'proyeksi', triliun: 47, ket: L('Proyeksi kebutuhan dana B40 2025 (BPDPKS, Nov 2024); proyeksi pungutan hanya sekitar Rp21,5 T.', 'Projected B40 funding need for 2025 (BPDPKS, Nov 2024); projected levy only about Rp21.5 T.'), sumber_id: 'bisnis-b40-47t', tingkat_bukti: 'cuplikan' },
        { tahun: 2025, k: 'subsidi', triliun: 51, ket: L('Alokasi subsidi B40 2025 menjadi Rp51 T setelah tambahan Rp16 T (menutup utang 2024).', 'B40 2025 subsidy allocation rose to Rp51 T after an extra Rp16 T (covering 2024 carry-over).'), sumber_id: 'bisnis-subsidi-51t', tingkat_bukti: 'cuplikan' },
        { tahun: 2023, k: 'insentif-sem1', triliun: 4.04, ket: L('Insentif biodiesel B35 semester I 2023.', 'B35 biodiesel incentive, H1 2023.'), sumber_id: 'bisnis-insentif-2023', tingkat_bukti: 'cuplikan' },
      ],
      regulasi: [
        { id: 'permen-esdm-12-2023', teks: L('Permen ESDM 12/2023 Pemanfaatan Biomassa sebagai Bahan Bakar PLTU: harga patokan = harga batubara FOB x k (maks 1,2) x Fc.', 'Energy Ministry Reg. 12/2023 on biomass for coal plants: benchmark price = FOB coal price x k (max 1.2) x Fc.') },
        { id: 'perpres-112-2022', teks: L('Perpres 112/2022 Percepatan Pengembangan Energi Terbarukan untuk Penyediaan Tenaga Listrik.', 'Presidential Reg. 112/2022 on accelerating renewables for electricity supply.') },
        { id: null, nama: 'PMK 30/2025', teks: L('Tarif pungutan ekspor CPO 10% sejak 17 Mei 2025.', 'CPO export levy 10% from 17 May 2025.'), sumber_id: 'kontan-pmk30' },
        { id: null, nama: 'Kepmen ESDM 3.K/EK.05/DJE/2024', teks: L('Rumus HIP biodiesel: (harga CPO KPB + US$85/ton) x 870 kg/m3 + ongkos angkut.', 'Biodiesel HIP formula: (KPB CPO price + US$85/t) x 870 kg/m3 + freight.'), sumber_id: 'it-hip-agu' },
      ],
    },
    neraca: {
      cpo_ton_2023: bio.meta.cpo_ton_total, cpo_sumber: 'bps-sawit-2023 (rujukan riset/biomassa)',
      pangan_ton: 4990000, sumber_pangan: 'metro-pangan',
      energi_b50_kl: 20100000, energi_b50_cpo_ton: 18690000, sumber_b50: 'metro-b50',
      b50_pemerintah_cpo_ton: 5300000, alokasi_2026_kl: 15646372,
      faktor_cpo_per_kl: Math.round((18690000 / 20100000) * 1000) / 1000,
      catatan: L('Faktor CPO per kl biodiesel = 18,69 juta t / 20,1 juta kl (turunan dari kajian BPDP, Hipotesis). Energi B40 = alokasi 2026 x faktor. Sisa = produksi 2023 - pangan - energi, mengabaikan oleokimia, stok, dan tahun yang berbeda.', 'CPO per kl of biodiesel = 18.69 million t / 20.1 million kl (derived from the BPDP study, Hypothesis). B40 energy = 2026 allocation x factor. Remainder = 2023 output - food - energy, ignoring oleochemicals, stocks and year mismatch.'),
    },
    bahan_baku: {
      komoditas: [
        { k: 'jagung', luas_ha: 2550000, produksi_ton: 15140000, tahun: 2024, satuan_catatan: 'pipilan kering KA 14%', sumber_id: 'bps-jagung-2024', tingkat_bukti: 'resmi', pakai: L('Bahan baku etanol alternatif (dibahas pemerintah); bersaing dengan pakan.', 'Alternative ethanol feedstock (discussed by government); competes with feed.') },
        { k: 'singkong', luas_ha: null, produksi_ton: 16710000, tahun: 2024, sentra: 'Lampung 47,32%', sumber_id: 'kementan-ubikayu', tingkat_bukti: 'resmi', pakai: L('Bahan baku etanol, jenis tidak bersaing dengan pangan (mukibat) dipertimbangkan; pabrik belum ada.', 'Ethanol feedstock; non-food varieties (mukibat) considered; plant not yet built.') },
        { k: 'tebu', luas_ha: null, produksi_ton: 2465530, tahun: 2024, sumber_id: 'databoks-tebu', tingkat_bukti: 'via-pihak-ketiga', perlu_tinjau: true, pakai: L('Molase hasil samping gula = satu-satunya bahan baku E10 versi ESDM. Satuan angka perlu dicek (tampak produksi gula, bukan batang tebu).', 'Molasses from sugar is the only E10 feedstock per ESDM. Unit needs checking (looks like sugar output, not cane stalks).') },
        { k: 'sawit-luas', luas_ha: 16005100, produksi_ton: null, tahun: 2024, sumber_id: 'jawapos-sawit', tingkat_bukti: 'cuplikan', pakai: L('Luas sawit 2024 (BPS via Jawa Pos): kebun besar 9,22 juta ha, rakyat 6,78 juta ha. Produksi per provinsi: tabel BPS 2023 dari riset/biomassa.', 'Oil palm area 2024 (BPS via Jawa Pos): estates 9.22 million ha, smallholders 6.78 million ha. Output by province: BPS 2023 table in riset/biomassa.') },
      ],
    },
    isu: [
      { id: 'deforestasi', kat: 'deforestasi', pihak: L('Koalisi masyarakat sipil dan FWI', 'Civil-society coalition and FWI'), ket: L('Perkiraan tambahan lahan sekitar 5,36 juta ha hingga 2039 dengan potensi deforestasi 1,5 juta ha bila B50 dipenuhi dari sawit baru.', 'Estimated extra land of about 5.36 million ha to 2039 with up to 1.5 million ha of deforestation if B50 is met from new plantations.'), sumber_id: 'greenpeace-b50', tingkat_bukti: 'kata-pihak' },
      { id: 'lahan', kat: 'deforestasi', pihak: L('Peneliti dan Madani', 'Researchers and Madani'), ket: L('Tambahan sekitar 3,2 juta ha kebun sawit hingga 2035 (satu peneliti); Madani menyebut lebih dari 6 juta ha.', 'About 3.2 million ha of extra plantation to 2035 (one researcher); Madani says more than 6 million ha.'), sumber_id: 'mongabay-b50', tingkat_bukti: 'cuplikan' },
      { id: 'iluc', kat: 'iluc', pihak: L('Catatan platform', 'Platform note'), ket: L('Kajian ILUC (perubahan guna lahan tidak langsung) yang baku tidak ditemukan di sumber yang dibaca; angka lahan di atas adalah perkiraan dampak, bukan hasil kajian ILUC.', 'No standard ILUC (indirect land-use change) study was found in the sources read; the land figures above are impact estimates, not ILUC results.'), sumber_id: 'mongabay-b50', tingkat_bukti: 'hipotesis' },
      { id: 'migor-risiko', kat: 'minyak-goreng', pihak: L('Pengamat (Bisnis.com)', 'Analysts (Bisnis.com)'), ket: L('B50 dinilai berisiko mengerek harga minyak goreng; satu proyeksi menempatkan MinyaKita dari Rp15.700 (2025) ke sekitar Rp19.110 per liter (2035) bila produktivitas tidak membaik.', 'B50 is seen as a risk to cooking-oil prices; one projection puts MinyaKita from Rp15,700 (2025) to about Rp19,110 per litre (2035) if yields do not improve.'), sumber_id: 'bisnis-b50-migor', tingkat_bukti: 'kata-pihak' },
      { id: 'migor-jamin', kat: 'minyak-goreng', pihak: L('Pemerintah (ESDM)', 'Government (ESDM)'), ket: L('Pemerintah menyatakan pasokan CPO cukup: kebutuhan minyak goreng sekitar 4,99 juta ton CPO per tahun, tambahan B50 sekitar 5,3 juta ton CPO.', 'Government says CPO supply suffices: cooking oil needs about 4.99 million t of CPO a year, B50 adds about 5.3 million t.'), sumber_id: 'metro-pangan', tingkat_bukti: 'kata-pihak' },
      { id: 'petani-tbs', kat: 'petani', pihak: L('GAPKI', 'GAPKI'), ket: L('Kenaikan pungutan ekspor menurunkan harga TBS di tingkat petani; pungutan mendanai subsidi biodiesel.', 'A higher export levy lowers farm-gate FFB prices; the levy funds the biodiesel subsidy.'), sumber_id: 'kontan-gapki', tingkat_bukti: 'kata-pihak' },
      { id: 'petani-psr', kat: 'petani', pihak: L('Bisnis.com', 'Bisnis.com'), ket: L('Pada 2023 hanya sekitar Rp1,7 triliun dari dana pungutan Rp32,4 triliun dipakai untuk peremajaan sawit rakyat; insentif biodiesel mengambil sekitar Rp18,5 triliun.', 'In 2023 only about Rp1.7 trillion of the Rp32.4 trillion levy went to smallholder replanting; the biodiesel incentive took about Rp18.5 trillion.'), sumber_id: 'bisnis-peremajaan', tingkat_bukti: 'cuplikan' },
      { id: 'biomassa-hutan', kat: 'deforestasi', pihak: L('Mongabay, FWI', 'Mongabay, FWI'), ket: L('Ekspor pelet kayu ke Jepang dan Korea dikaitkan dengan deforestasi hutan alam; pengusaha menyebutnya kampanye hitam.', 'Wood-pellet exports to Japan and Korea are linked to natural-forest loss; businesses call it a black campaign.'), sumber_id: 'mongabay-pelet', tingkat_bukti: 'cuplikan' },
    ],
    celah: [
      L('Luas dan produksi per kabupaten (Ditjenbun) tidak terbuka; modul memakai tingkat provinsi (BPS 2023, riset/biomassa).', 'Area and output by district (Ditjenbun) are not open; the module uses province level (BPS 2023, riset/biomassa).'),
      L('Produksi tebu (batang), sekam padi, dan limbah kayu per tahun belum ditemukan dari BPS; singkong hanya dari Kementan.', 'Cane stalk output, rice husk and wood waste by year were not found from BPS; cassava only from Kementan.'),
      L('Alokasi biodiesel 2020-2022 dan realisasi 2025 penuh tidak ditemukan dengan tautan sumber; kolom dibiarkan kosong, tidak diisi tebakan.', 'Biodiesel allocation for 2020-2022 and full-year 2025 actuals were not found with a source link; cells are left blank, not guessed.'),
      L('Ekspor biodiesel (HS 3826) dan HIP September sampai November 2026 tidak terkonfirmasi (satu media memberi Rp15.072 untuk Oktober dan Rp14.312 untuk November, tanggalnya tidak konsisten).', 'Biodiesel exports (HS 3826) and HIP for September to November 2026 are unconfirmed (one outlet gives Rp15,072 for October and Rp14,312 for November, with inconsistent dating).'),
      L('Kapasitas PLTBm (biomassa) terpasang nasional dan daftar lengkap PLTU co-firing (48-52 lokasi) dengan persen campuran belum ada; hanya unit yang terbaca.', 'National installed biomass-plant capacity and the complete co-firing list (48-52 sites) with blend percentages are missing; only readable units are shown.'),
      L('Kapasitas HVO Cilacap yang berjalan beredar dengan angka berbeda antarsumber (3.000 hingga 9.000 barel per hari); tidak dimuat sebagai angka.', 'Running HVO capacity at Cilacap differs across sources (3,000 to 9,000 barrels per day); not shown as a number.'),
    ],
  };
}

export function periksa(d) {
  const sid = new Set(d.sumber.map((s) => s.id));
  assert.equal(sid.size, d.sumber.length, 'id sumber ganda');
  for (const s of d.sumber) assert.ok(/^https:\/\//.test(s.url) && s.judul && s.penerbit && s.tingkat_bukti, 'sumber cacat ' + s.id);
  const pakai = (x) => { if (x && !sid.has(x)) assert.fail('sumber tak dikenal: ' + x); };
  const jalan = (o) => { if (Array.isArray(o)) o.forEach(jalan); else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (/^sumber_id$|^sumber_alokasi$|^sumber_realisasi$|^sumber_kebutuhan$|^sumber_pasokan$|^sumber_pangan$|^sumber_b50$|^sumber_etanol$/.test(k)) pakai(v); else if (k === 'sumber_ids') v.forEach(pakai); else jalan(v); } };
  jalan(d);
  const org = new Set(j('public/data/organisasi.json').baris.map((b) => b.id));
  const r = d.rujukan;
  for (const id of [...r.produsen_fame, ...r.produsen_etanol, ...r.pemasok_biomassa, ...r.operator, ...r.asosiasi, ...r.pabrikan_global, ...d.cofiring.unit.map((u) => u.org_id), ...d.saf.org_ids, ...d.pelet.org_ids]) assert.ok(org.has(id), 'org tak ada: ' + id);
  const en = new Set(j('public/data/energi_baru.json').baris.map((b) => b.id));
  for (const id of r.cofiring) assert.ok(en.has(id), 'energi_baru tak ada: ' + id);
  const bio = j('public/data/riset/biomassa.json');
  assert.ok(bio.baris.length >= 20);
  const kode = new Set(bio.baris.map((b) => b.kode_prov));
  for (const u of d.cofiring.unit) {
    if (u.rujuk.startsWith('energi_baru#')) assert.ok(en.has(u.rujuk.split('#')[1]), u.id);
    else assert.ok(JSON.stringify(j('public/data/global/pemasok_lain.json').butir).includes(u.rujuk.split('#')[1]), 'butir tak ditemukan: ' + u.rujuk);
  }
  const pl = j('public/data/global/pemasok_lain.json').butir;
  for (const id of r.produsen_fame) assert.ok(pl.some((b) => b.organisasi_id === id && b.segmen === 'biofuel'), 'butir kapasitas tak ada: ' + id);
  for (const a of d.alokasi) assert.ok(a.alokasi_kl != null || a.realisasi_kl != null);
  assert.ok(d.hip.every((h) => h.biodiesel_rp_l > 10000 && /^\d{4}-\d{2}$/.test(h.bulan)));
  assert.ok(d.pelet.comtrade.every((c) => /^\d{6}$/.test(c.hs)));
  return { sumber: d.sumber.length, provinsi: kode.size };
}

async function cekUrl() {
  const { ambil } = await import('../pipa/_panen_sopan.mjs');
  for (const s of SUMBER) { try { await ambil(s.url, { method: 'HEAD' }); console.log('OK ', s.id); } catch (e) { console.log('GAGAL', s.id, e.message); if (/^403/.test(e.message) || /403 berhenti/.test(e.message)) break; } }
}
async function comtrade() {
  const { ambil } = await import('../pipa/_panen_sopan.mjs');
  const dir = (process.env.BIOENERGI_MENTAH || path.join(ROOT, 'data/bioenergi_mentah')) + '/'; fs.mkdirSync(dir, { recursive: true });
  for (const hs of ['440131', '230660']) for (const th of [2022, 2023, 2024]) {
    const f = `${dir}${hs}_X_${th}.json`; if (fs.existsSync(f)) continue;
    const r = await ambil(`https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=360&period=${th}&cmdCode=${hs}&flowCode=X`, { json: true });
    fs.writeFileSync(f, JSON.stringify({ hs, th, ambil: T, data: (r.data || []).map((x) => ({ p: x.partnerCode, v: x.primaryValue, w: x.netWgt })) })); console.log(hs, th, (r.data || []).length);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv[2];
  if (a === '--bangun') { const d = bangun(); console.log(periksa(d)); fs.writeFileSync(path.join(ROOT, 'public/data/bioenergi.json'), JSON.stringify(d, null, 1) + '\n'); }
  else if (a === '--selftest') console.log(periksa(bangun()));
  else if (a === '--cek-url') await cekUrl();
  else if (a === '--comtrade') await comtrade();
  else console.log('pakai: --bangun | --selftest | --cek-url | --comtrade');
}
