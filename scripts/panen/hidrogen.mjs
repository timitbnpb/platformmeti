#!/usr/bin/env node
// Hidrogen dan amonia hijau ujung ke ujung -> public/data/hidrogen.json.
// Benih tersusun dari bacaan sumber publik tanggal 2026-11-08 (sumber: hidrogen_sumber.mjs); tiap butir bersumber + bertingkat bukti; TIDAK mengarang angka,
// yang tidak ditemukan ditulis di `celah`. Data yang sudah ada DIRUJUK saat runtime (energi_baru h2-*, topik/hidrogen, global/pemasok_lain segmen hidrogen,
// proyek, global/potensi_atlas, biaya_bangun, pendanaan_internasional, organisasi, regulasi), tidak disalin.
// Pakai: --bangun | --selftest | --cek-url (HEAD tiap sumber lewat _panen_sopan: UA sopan, robots, jeda >= 2 dtk, stop 403/429)
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { SUMBER, T } from './hidrogen_sumber.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const j = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const L = (id, en) => ({ id, en });

/* ---------- 1. Sumber listrik EBT dan lokasi potensial ---------- */
const LOKASI = [
  { id: 'ulubelu', nama: 'Ulubelu, Tanggamus', prov: '18', provinsi: 'Lampung', kab: '1802', sumber_listrik: ['panas-bumi'], proyek_id: 'pj_0249', peran: ['produksi'], enb: 'h2-ulubelu', org: ['p_dda1e51dae'], status: 'konstruksi',
    ket: L('Pilot elektrolisis berdaya listrik PLTP Ulubelu (110 MW), hingga 100 kg per hari; produksi ditargetkan akhir 2026.', 'Electrolysis pilot powered by the Ulubelu geothermal plant (110 MW), up to 100 kg/day; production targeted end-2026.'), sumber_id: 'ulu', tingkat_bukti: 'media' },
  { id: 'kamojang', nama: 'Kamojang, Jawa Barat', prov: '32', provinsi: 'Jawa Barat', kab: null, sumber_listrik: ['panas-bumi'], proyek_id: 'pj_0232', peran: ['produksi'], enb: 'h2-pln21', org: ['p_5a2e7d0c63', 'p_dda1e51dae'], status: 'beroperasi',
    ket: L('GHP PLN di PLTP Kamojang (sekitar 4,3 ton per tahun); PGE dan Pertamina NRE merencanakan pilot elektroliser uap 1 MW (p-SOEC) sampai akhir 2026.', 'PLN GHP at the Kamojang geothermal plant (about 4.3 t/year); PGE and Pertamina NRE plan a 1 MW steam electrolyser (p-SOEC) pilot through end-2026.'), sumber_id: 'ibp-kamojang', tingkat_bukti: 'media' },
  { id: 'muara-karang', nama: 'Muara Karang, Jakarta Utara', prov: '31', provinsi: 'DKI Jakarta', kab: '3175', sumber_listrik: ['surya', 'panas-bumi'], proyek_id: null, peran: ['produksi', 'permintaan'], enb: 'h2-pln21', org: ['p_5a2e7d0c63'], status: 'beroperasi',
    ket: L('GHP pertama (9 Oktober 2023, 51 ton per tahun): PLTS ditambah sertifikat energi terbarukan dari PLTP Kamojang.', 'First GHP (9 October 2023, 51 t/year): solar PV plus renewable energy certificates from the Kamojang geothermal plant.'), sumber_id: 'mc', tingkat_bukti: 'resmi' },
  { id: 'gresik-banyuwangi', nama: 'Gresik dan Banyuwangi', prov: '35', provinsi: 'Jawa Timur', kab: '3525', kab2: '3510', sumber_listrik: ['surya'], proyek_id: null, peran: ['produksi', 'permintaan'], enb: 'h2-gresik', org: ['su_ed074ff5', 'en_5455f1bbf9', 'p_0e6d34a26d'], status: 'kerja-sama',
    ket: L('PLN, ACWA Power, dan Pupuk Indonesia: PLTS di Banyuwangi dan pabrik hidrogen di Gresik; kapasitas dan keputusan investasi belum ditemukan di sumber.', 'PLN, ACWA Power and Pupuk Indonesia: solar in Banyuwangi and a hydrogen plant in Gresik; capacity and investment decision not found in sources.'), sumber_id: 'ghes', tingkat_bukti: 'media' },
  { id: 'bontang', nama: 'Bontang', prov: '64', provinsi: 'Kalimantan Timur', kab: '6474', sumber_listrik: [], proyek_id: null, peran: ['permintaan'], enb: null, org: ['en_5455f1bbf9'], status: 'rencana',
    ket: L('Pupuk Kaltim: rencana amonia hijau 1 juta ton per tahun (USD 4 miliar, MoU Mei 2023). Sumber listrik terbarukan belum ditetapkan di sumber.', 'Pupuk Kaltim: planned green ammonia of 1 Mt/year (USD 4 billion, May 2023 MoU). Renewable power source not set in the source.'), sumber_id: 'ibp-pkt', tingkat_bukti: 'media' },
  { id: 'cilegon', nama: 'Cilegon dan Banten', prov: '36', provinsi: 'Banten', kab: '3672', sumber_listrik: ['bayu', 'surya'], proyek_id: null, peran: ['permintaan'], enb: null, org: ['p_10e0dde689'], status: 'studi',
    ket: L('Studi Pertamina NRE, IGNIS, dan Krakatau Steel: pabrik hidrogen biru atau hijau di kawasan baja, 500 MWp sampai 1,5 GWp (surya dan angin lepas pantai).', 'Pertamina NRE, IGNIS and Krakatau Steel study: blue or green hydrogen plant at the steel estate, 500 MWp to 1.5 GWp (solar and offshore wind).'), sumber_id: 'pertamina-ignis', tingkat_bukti: 'kata-pihak' },
  { id: 'sumba-timur', nama: 'Sumba Timur', prov: '53', provinsi: 'Nusa Tenggara Timur', kab: '5302', sumber_listrik: ['surya', 'bayu'], proyek_id: null, peran: ['produksi'], enb: null, org: [], status: 'tak-jelas',
    ket: L('Disebut ESDM (Juni 2024) sebagai hidrogen hibrida surya dan angin; kapasitas dan status tidak dirinci.', 'Named by ESDM (June 2024) as hybrid solar and wind hydrogen; capacity and status not detailed.'), sumber_id: 'esdm-jepang-2024', tingkat_bukti: 'resmi' },
  { id: 'kaltara', nama: 'Kalimantan Utara', prov: '65', provinsi: 'Kalimantan Utara', kab: null, sumber_listrik: ['hidro'], proyek_id: null, peran: ['produksi'], enb: null, org: [], status: 'tak-jelas',
    ket: L('Disebut ESDM (Juni 2024) sebagai hidrogen berbasis PLTA; lokasi dan kapasitas tidak dirinci.', 'Named by ESDM (June 2024) as hydropower-based hydrogen; site and capacity not detailed.'), sumber_id: 'esdm-jepang-2024', tingkat_bukti: 'resmi' },
  { id: 'papua', nama: 'Papua', prov: '91', provinsi: 'Papua', kab: null, sumber_listrik: ['hidro'], proyek_id: null, peran: ['produksi'], enb: null, org: [], status: 'tak-jelas',
    ket: L('Disebut ESDM (Juni 2024) sebagai hidrogen berbasis PLTA; lokasi dan kapasitas tidak dirinci.', 'Named by ESDM (June 2024) as hydropower-based hydrogen; site and capacity not detailed.'), sumber_id: 'esdm-jepang-2024', tingkat_bukti: 'resmi' },
  { id: 'patimban', nama: 'Pelabuhan Patimban, Subang', prov: '32', provinsi: 'Jawa Barat', kab: null, sumber_listrik: [], proyek_id: null, peran: ['pelabuhan', 'permintaan'], enb: null, org: [], status: 'rencana',
    ket: L('Disebut dalam Hydrogen Day 2026 sebagai calon pusat permintaan hidrogen (pelabuhan hijau); bukan lokasi produksi.', 'Named at Hydrogen Day 2026 as a possible hydrogen demand hub (green port); not a production site.'), sumber_id: 'li-lokasi23', tingkat_bukti: 'media' },
];

/* ---------- 2. Elektroliser ---------- */
const ELEKTROLISER = {
  teknologi: [
    { k: 'ael', kwh: [50, 78], umur_jam: [50000, 80000], stack_usd_kw: [270, 400], kematangan: 'komersial', pangsa_bnef_2025: 54.6, ket: L('Alkalin cair: paling matang dan paling banyak dibangun; fleksibilitas beban lebih sempit.', 'Liquid alkaline: most mature and most deployed; narrower load flexibility.') },
    { k: 'pem', kwh: [50, 83], umur_jam: [50000, 80000], stack_usd_kw: [400, 400], kematangan: 'komersial', pangsa_bnef_2025: 55.1, ket: L('Membran polimer: respons cepat terhadap listrik surya dan angin, katalis logam mulia.', 'Polymer membrane: fast response to solar and wind power, precious-metal catalysts.') },
    { k: 'aem', kwh: [57, 69], umur_jam: [5000, 5000], stack_usd_kw: null, kematangan: 'awal', pangsa_bnef_2025: null, ket: L('Membran anion: tanpa logam mulia pada teori; umur stack saat ini sekitar 5.000 jam (target 100.000 jam).', 'Anion membrane: no precious metals in theory; stack life today about 5,000 h (target 100,000 h).') },
    { k: 'soec', kwh: [40, 50], umur_jam: [0, 20000], stack_usd_kw: [2000, 2000], kematangan: 'demonstrasi', pangsa_bnef_2025: null, ket: L('Oksida padat suhu tinggi: paling hemat listrik jika ada panas buangan atau uap (mis. panas bumi); umur masih di bawah 20.000 jam, stack lebih dari USD 2.000 per kW.', 'High-temperature solid oxide: most power-efficient when waste heat or steam is available (e.g. geothermal); life still under 20,000 h, stack above USD 2,000/kW.') },
  ],
  sumber_id: 'pmc-elektroliser', sumber_bnef: 'jc-bnef',
  harga_iea: [
    { k: 'luar-cina', usd_kw: [2000, 2600] },
    { k: 'cina-lokal', usd_kw: [600, 1200] },
    { k: 'cina-ekspor', usd_kw: [1500, 2400] },
  ],
  harga_sumber_id: 'iea-ghr25-ringkas',
  pabrik_dunia: { terpasang_gw_2024: 2, pangsa_terpasang_cn: 65, kapasitas_pabrik_cn_gw: 20, pangsa_pabrik_cn_persen: 60, permintaan_gw_2024: 2, sumber_id: 'iea-ghr25-ringkas', tingkat_bukti: 'resmi' },
  lokal: [
    { nama: 'PT Generator Pasifik Indonesia (GPI)', produk: L('Elektroliser TITAN EL-MW, hingga 1.071 kg hidrogen per hari; diperkenalkan di GHES 2025 (15 April 2025). Jenis (alkalin atau PEM), kandungan lokal, dan harga tidak disebut.', 'TITAN EL-MW electrolyser, up to 1,071 kg of hydrogen a day; introduced at GHES 2025 (15 April 2025). Type (alkaline or PEM), local content and price not stated.'), kg_hari: 1071, sumber_id: 'li-gpi', tingkat_bukti: 'media' },
  ],
  target: { mw: 328, tahun: 2035, catatan: L('Judul berita 2022; isi berlangganan sehingga angka lain tidak terbaca. Bukan angka RHAN 2025.', 'Headline from 2022; body is paywalled so no other figure was read. Not an RHAN 2025 figure.'), sumber_id: 'petromindo-328', tingkat_bukti: 'media' },
};

/* ---------- 3. Produksi H2 di Indonesia ---------- */
const PRODUKSI = [
  { id: 'pln-ghp22', nama: L('PLN: 22 pabrik hidrogen hijau (GHP)', 'PLN: 22 green hydrogen plants (GHP)'), org: ['su_ed074ff5', 'p_5a2e7d0c63', 'p_ff7a390a42'], prov: '31', ton_tahun: 203, status: 'beroperasi', tahun: 2023, enb: 'h2-pln21', sumber_id: 'hrs', tingkat_bukti: 'media', ket: L('Diresmikan 20 November 2023 (21 unit; 22 unit menurut pemberitaan lanjutan). 128 ton dialokasikan untuk transportasi.', 'Inaugurated 20 November 2023 (21 units; 22 per later reports). 128 t allocated to transport.') },
  { id: 'muara-karang', nama: L('GHP Muara Karang (pertama)', 'Muara Karang GHP (first)'), org: ['p_5a2e7d0c63'], prov: '31', ton_tahun: 51, status: 'beroperasi', tahun: 2023, enb: 'h2-pln21', sumber_id: 'mc', tingkat_bukti: 'resmi', ket: L('Beroperasi 9 Oktober 2023; listrik PLTS ditambah REC dari PLTP Kamojang.', 'Operating from 9 October 2023; solar power plus RECs from the Kamojang geothermal plant.') },
  { id: 'kamojang-pln', nama: L('GHP Kamojang (PLN)', 'Kamojang GHP (PLN)'), org: ['p_5a2e7d0c63'], prov: '32', ton_tahun: 4.3, status: 'beroperasi', tahun: 2023, enb: 'h2-pln21', sumber_id: 'ibp-kamojang', tingkat_bukti: 'media', ket: L('Pertama di ASEAN berbasis panas bumi; PLN berencana menambah kapasitas, angka tambahan tidak ditemukan.', 'First geothermal-based plant in ASEAN; PLN plans to expand, no capacity figure for the expansion found.') },
  { id: 'ulubelu-pge', nama: L('Pilot PGE Ulubelu', 'PGE Ulubelu pilot'), org: ['p_dda1e51dae', 'p_b1c52ad7b0'], prov: '18', ton_tahun: 36.5, hitung: true, status: 'konstruksi', tahun: 2026, enb: 'h2-ulubelu', sumber_id: 'ulu', tingkat_bukti: 'media', ket: L('Hingga 100 kg per hari (36,5 ton per tahun = 100 kg x 365, hitungan METI), USD 3 juta; groundbreaking 9 September 2025, target produksi akhir 2026. Calon pembeli: Toyota Indonesia sekitar 20 kg per hari dan anak usaha Pertamina sekitar 50 kg per hari.', 'Up to 100 kg/day (36.5 t/year = 100 kg x 365, METI arithmetic), USD 3 million; groundbreaking 9 September 2025, production targeted end-2026. Prospective offtakers: Toyota Indonesia about 20 kg/day and a Pertamina subsidiary about 50 kg/day.') },
  { id: 'kamojang-hyet', nama: L('Pilot PGE dan Pertamina NRE di Kamojang (p-SOEC 1 MW)', 'PGE and Pertamina NRE Kamojang pilot (1 MW p-SOEC)'), org: ['p_10e0dde689', 'p_dda1e51dae'], prov: '32', ton_tahun: null, status: 'studi', tahun: 2026, enb: null, sumber_id: 'pv-hyet', tingkat_bukti: 'media', ket: L('Term sheet tidak mengikat dengan HyET; lokasi masih dinilai. Dimaksudkan memberi data bagi fasilitas e-chemicals 10 MW.', 'Non-binding term sheet with HyET; site still being assessed. Meant to give data for a 10 MW e-chemicals facility.') },
  { id: 'gresik-acwa', nama: L('PLN, ACWA Power, Pupuk Indonesia: Gresik', 'PLN, ACWA Power, Pupuk Indonesia: Gresik'), org: ['su_ed074ff5', 'en_5455f1bbf9', 'p_0e6d34a26d'], prov: '35', ton_tahun: null, status: 'kerja-sama', tahun: null, enb: 'h2-gresik', sumber_id: 'ghes', tingkat_bukti: 'media', ket: L('Kapasitas dan keputusan investasi tidak ditemukan.', 'Capacity and investment decision not found.') },
  { id: 'pertamina-pupuk-mitsubishi', nama: L('Pertamina, Pupuk Indonesia, Mitsubishi Corporation', 'Pertamina, Pupuk Indonesia, Mitsubishi Corporation'), org: ['p_b1c52ad7b0', 'en_5455f1bbf9', 'en_bfe3751b62'], prov: null, ton_tahun: null, status: 'kerja-sama', tahun: 2022, enb: 'h2-pertamina-mitsubishi', sumber_id: 'hce-pupuk', tingkat_bukti: 'media', ket: L('Kesepakatan Maret 2022: rantai nilai hidrogen dan amonia hijau serta CCUS; hidrogen hijau dari fasilitas Pertamina NRE dipakai untuk amonia hijau. Kapasitas tidak ditemukan.', 'March 2022 agreement: green hydrogen and ammonia value chain plus CCUS; green hydrogen from a Pertamina NRE plant to make green ammonia. Capacity not found.') },
  { id: 'krakatau-ignis', nama: L('Studi Pertamina NRE, IGNIS, Krakatau Steel', 'Pertamina NRE, IGNIS, Krakatau Steel study'), org: ['p_10e0dde689'], prov: '36', ton_tahun: null, status: 'studi', tahun: 2022, enb: null, sumber_id: 'pertamina-ignis', tingkat_bukti: 'kata-pihak', ket: L('Studi pabrik hidrogen biru atau hijau di kawasan Krakatau Steel; 500 MWp sampai 1,5 GWp, potensi simpan CO2 61 juta ton (angka pihak).', 'Study of a blue or green hydrogen plant at the Krakatau Steel estate; 500 MWp to 1.5 GWp, CO2 storage potential 61 Mt (parties\' figure).') },
  { id: 'sumba-kaltara-papua', nama: L('Hibrida surya-angin Sumba Timur; PLTA Kalimantan Utara dan Papua', 'East Sumba solar-wind hybrid; North Kalimantan and Papua hydropower'), org: [], prov: '53', ton_tahun: null, status: 'tak-jelas', tahun: 2024, enb: null, sumber_id: 'esdm-jepang-2024', tingkat_bukti: 'resmi', ket: L('Disebut dalam siaran ESDM 5 Juni 2024 sebagai proyek hidrogen di Indonesia; kapasitas dan status tidak dirinci.', 'Named in the ESDM release of 5 June 2024 as hydrogen projects in Indonesia; capacity and status not detailed.') },
];

/* ---------- 4. Turunan: amonia, metanol, e-fuel ---------- */
const TURUNAN = {
  pabrik_amonia: [
    { id: 'pim', nama: 'Pupuk Iskandar Muda (Aceh)', org: 'en_5455f1bbf9', prov: '11', kt_tahun: 726, rincian: '330 + 396', sumber_id: 'cnbc-pupuk', tingkat_bukti: 'media' },
    { id: 'pusri', nama: 'Pusri (Palembang)', org: 'en_5455f1bbf9', prov: '16', kt_tahun: 660, rincian: null, sumber_id: 'cnbc-pupuk', tingkat_bukti: 'media' },
    { id: 'kaltim2', nama: 'Pupuk Kaltim, pabrik amonia 2 (Bontang)', org: 'en_5455f1bbf9', prov: '64', kt_tahun: 595, rincian: null, sumber_id: 'katadata-kaltim2', tingkat_bukti: 'media' },
  ],
  grup: { mt_tahun: 7, sumber_id: 'fortune-nh3-7jt', tingkat_bukti: 'media' },
  rencana: [
    { id: 'pkt-hijau', jenis: 'amonia', nama: L('Pupuk Kaltim: amonia hijau 1 juta ton per tahun', 'Pupuk Kaltim: green ammonia of 1 Mt/year'), org: ['en_5455f1bbf9', 'p_10e0dde689'], mt: 1, usd_miliar: 4, tahun: 2023, status: 'rencana', ket: L('MoU Mei 2023 dengan Topsoe, Copenhagen Atomics, Aalborg CSP, dan Alfa Laval; tanggal konstruksi tidak ada.', 'May 2023 MoU with Topsoe, Copenhagen Atomics, Aalborg CSP and Alfa Laval; no construction date.'), sumber_id: 'ibp-pkt', tingkat_bukti: 'media' },
    { id: 'pupuk-12jt', jenis: 'amonia', nama: L('Pupuk Indonesia: 12 juta ton amonia pada 2045', 'Pupuk Indonesia: 12 Mt of ammonia by 2045'), org: ['en_5455f1bbf9'], mt: 12, usd_miliar: null, tahun: 2045, status: 'rencana', ket: L('Dari 7 juta ton; amonia hibrida di Aceh (PIM) mulai 2030.', 'From 7 Mt; hybrid ammonia in Aceh (PIM) from 2030.'), sumber_id: 'fortune-nh3-12jt', tingkat_bukti: 'media' },
    { id: 'pupuk-biru', jenis: 'amonia', nama: L('Pupuk Indonesia: amonia biru 4,3 juta ton per tahun pada 2045', 'Pupuk Indonesia: blue ammonia of 4.3 Mt/year by 2045'), org: ['en_5455f1bbf9'], mt: 4.3, usd_miliar: null, tahun: 2045, status: 'rencana', ket: L('Berbasis CCS; angka target kelompok menurut Argus (versi lain menyebut 660.000 ton untuk satu pabrik Kaltim).', 'CCS-based; group target per Argus (another version cites 660,000 t for one Kaltim plant).'), sumber_id: 'argus-pupuk-2045', tingkat_bukti: 'media' },
    { id: 'sulteng-biru', jenis: 'amonia', nama: L('Konversi biru pabrik amonia Sulawesi Tengah (660.000 ton)', 'Blue conversion of a Central Sulawesi ammonia plant (660,000 t)'), org: [], mt: 0.66, usd_miliar: null, tahun: 2021, status: 'tertunda', ket: L('Konsorsium dipimpin Mitsubishi (Maret 2021); sumber 2022 menyebut jeda singkat, status terkini tidak jelas.', 'Mitsubishi-led consortium (March 2021); a 2022 source mentions a brief hiatus, current status unclear.'), sumber_id: 'ammonia-energy', tingkat_bukti: 'via-pihak-ketiga' },
    { id: 'hyet-efuel', jenis: 'efuel', nama: L('Pertamina NRE dan HyET: e-chemicals dan e-fuel', 'Pertamina NRE and HyET: e-chemicals and e-fuels'), org: ['p_10e0dde689'], mt: null, usd_miliar: null, tahun: 2026, status: 'studi', ket: L('Pilot elektroliser uap 1 MW dan elektroliser CO2 1 MW; hasilnya untuk fasilitas e-chemicals 10 MW.', 'A 1 MW steam electrolyser and a 1 MW CO2 electrolyser pilot; results feed a 10 MW e-chemicals facility.'), sumber_id: 'pv-hyet', tingkat_bukti: 'media' },
  ],
};

/* ---------- 5. Pemakaian ---------- */
const PEMAKAIAN = [
  { k: 'pupuk', ikon: 'industri', angka: L('4 juta ton per tahun', '4 Mt a year'), ket: L('Permintaan hidrogen Indonesia 2024 hampir seluruhnya hidrogen abu-abu untuk pupuk (amonia) dan kilang; di Asia Tenggara hampir separuh permintaan hidrogen adalah amonia.', 'Indonesia\'s 2024 hydrogen demand is almost all grey hydrogen for fertiliser (ammonia) and refineries; in Southeast Asia nearly half of hydrogen demand is ammonia.'), org: ['en_5455f1bbf9', 'p_b1c52ad7b0'], sumber_ids: ['dpr', 'ghr25sea'], tingkat_bukti: 'resmi' },
  { k: 'pltu', ikon: 'petir', angka: L('Uji PLTU Suralaya 5 sampai 7', 'Suralaya units 5 to 7 trial'), ket: L('MHI dan PLN Indonesia Power (1 November 2022): tiga studi, yaitu amonia di PLTU Suralaya, biomassa Suralaya, dan hidrogen di PLTGU Tanjung Priok; uji co-firing amonia direncanakan di Suralaya unit 5 sampai 7. Hasil uji tidak ditemukan.', 'MHI and PLN Indonesia Power (1 November 2022): three studies, ammonia at the Suralaya coal plant, Suralaya biomass, and hydrogen at the Tanjung Priok gas plant; an ammonia co-firing trial was planned at Suralaya units 5 to 7. No trial result found.'), org: ['p_5a2e7d0c63', 'in_c462bee334'], sumber_ids: ['mhi-pln', 'katadata-mhi'], tingkat_bukti: 'media' },
  { k: 'transportasi', ikon: 'mobil', angka: L('128 dari 203 ton', '128 of 203 t'), ket: L('SPBU hidrogen hijau PLN Senayan (21 Februari 2024) memakai hidrogen dari 22 GHP; 128 ton dari 203 ton dialokasikan untuk transportasi. Pertamina NRE merencanakan stasiun terpadu di SPBU Daan Mogot, Jakarta.', 'PLN\'s Senayan green hydrogen station (21 February 2024) uses hydrogen from the 22 GHP; 128 t of 203 t is allocated to transport. Pertamina NRE plans an integrated station at the Daan Mogot fuel station, Jakarta.'), org: ['p_5a2e7d0c63', 'p_10e0dde689'], sumber_ids: ['hrs', 'bisnis-hrs', 'petromindo-daan'], tingkat_bukti: 'media' },
  { k: 'baja', ikon: 'pabrik', angka: L('USD 5 sampai 7 lawan di bawah 1', 'USD 5 to 7 vs under 1'), ket: L('Krakatau Steel menilai hidrogen hijau kini sekitar USD 5 sampai 7 per kg, sedangkan baja butuh di bawah USD 1 per kg agar bersaing (kata pihak). Ada MoU pipa hidrogen dengan Pertamina NRE dan RAJA (Banten, Jawa Barat, November 2022).', 'Krakatau Steel puts green hydrogen at about USD 5 to 7/kg now, while steel needs under USD 1/kg to compete (the company\'s view). There is a hydrogen pipeline MoU with Pertamina NRE and RAJA (Banten, West Java, November 2022).'), org: ['p_10e0dde689'], sumber_ids: ['bcas-krakatau', 'pertamina-krakatau-pipa'], tingkat_bukti: 'kata-pihak' },
];

/* ---------- 6. Ekspor dan koridor ---------- */
const EKSPOR = {
  negara: [
    { iso2: 'jp', nama: L('Jepang', 'Japan'), target_mt: [{ tahun: 2024, mt: 2, ket: 'pasokan saat ini' }, { tahun: 2030, mt: 3 }, { tahun: 2040, mt: 12 }, { tahun: 2050, mt: 20 }], instrumen: L('UU Promosi Masyarakat Hidrogen (17 Mei 2024) dan kontrak selisih harga (CfD) 15 tahun lewat JOGMEC; elektroliser 15 GW pada 2030 di dalam dan luar negeri. Pembangkit listrik saja tidak memenuhi syarat CfD (sumber pasar).', 'Hydrogen Society Promotion Act (17 May 2024) and 15-year contracts for difference (CfD) via JOGMEC; 15 GW of electrolysers by 2030 at home and abroad. Power generation alone does not qualify for the CfD (market source).'), sumber_ids: ['jp-basic-white', 'jp-12jt', 'spglobal-cfd'], tingkat_bukti: 'media' },
    { iso2: 'kr', nama: L('Korea Selatan', 'South Korea'), target_mt: [], instrumen: L('Lelang listrik hidrogen bersih (CHPS) berdasar UU Ekonomi Hidrogen 2021. Putaran pertama hanya KOEN yang memperoleh kontrak (750 GWh); pemberitahuan lelang berikutnya dibatalkan beberapa jam sebelum tenggat dan pasar mengulang.', 'Clean hydrogen power bidding (CHPS) under the 2021 Hydrogen Economy Act. In the first round only KOEN won a contract (750 GWh); the next tender notice was cancelled hours before the deadline and the market reset.'), sumber_ids: ['joongang-chps', 'spglobal-cfd'], tingkat_bukti: 'media' },
  ],
  nota: [
    { tgl: '2022-03', iso2: 'jp', org: ['p_b1c52ad7b0', 'en_5455f1bbf9', 'en_bfe3751b62'], teks: L('Pertamina, Pupuk Indonesia, dan Mitsubishi Corporation: rantai nilai hidrogen dan amonia hijau serta CCUS.', 'Pertamina, Pupuk Indonesia and Mitsubishi Corporation: green hydrogen and ammonia value chain plus CCUS.'), sumber_id: 'hce-pupuk', tingkat_bukti: 'media' },
    { tgl: '2022-11-01', iso2: 'jp', org: ['p_5a2e7d0c63', 'in_c462bee334'], teks: L('MHI dan PLN Indonesia Power: tiga studi co-firing amonia, biomassa, dan hidrogen.', 'MHI and PLN Indonesia Power: three studies on ammonia, biomass and hydrogen co-firing.'), sumber_id: 'mhi-pln', tingkat_bukti: 'kata-pihak' },
    { tgl: '2024-05-31', iso2: 'jp', org: ['l_7278e0528a'], teks: L('Memorandum kerja sama JICA, ESDM, BRIN, dan IFHE: kebijakan, standar, promosi, dan peningkatan kapasitas; JICA merencanakan survei rantai pasok akhir 2024.', 'Memorandum of cooperation among JICA, ESDM, BRIN and IFHE: policy, standards, promotion and capacity building; JICA planned a supply chain survey for late 2024.'), sumber_id: 'esdm-jepang-2024', tingkat_bukti: 'resmi' },
    { tgl: '2026-02-03', iso2: 'jp', org: ['l_7278e0528a'], teks: L('Forum Percepatan Hidrogen dan Amonia Indonesia-Jepang ke-4: peta jalan kolaborasi HASI melengkapi RHAN.', '4th Indonesia-Japan Hydrogen Ammonia Development Acceleration Forum: the HASI collaboration roadmap complements RHAN.'), sumber_id: 'esdm-asta-cita', tingkat_bukti: 'resmi' },
  ],
  koridor: [
    { id: 'selat-malaka', nama: L('Selat Malaka', 'Strait of Malacca'), iso2: 'id', ket: L('ESDM menyebut posisi dekat Selat Malaka strategis untuk ekspor hidrogen hijau ke Asia-Pasifik; tidak ada pelabuhan yang disebut.', 'ESDM says the position near the Strait of Malacca is strategic for green hydrogen exports to Asia-Pacific; no port is named.'), sumber_id: 'esdm-jepang-2024', tingkat_bukti: 'resmi' },
    { id: 'patimban', nama: L('Pelabuhan Patimban', 'Patimban Port'), iso2: 'id', ket: L('Calon pusat permintaan hidrogen (pelabuhan hijau), bukan koridor ekspor yang terikat kontrak.', 'Possible hydrogen demand hub (green port), not a contracted export corridor.'), sumber_id: 'li-lokasi23', tingkat_bukti: 'media' },
  ],
};

/* ---------- 7. Biaya ---------- */
const BIAYA = {
  lcoh: [
    { k: 'dpr', usd_kg: [4.3, 8.3], ket: L('Biaya produksi hidrogen hijau di Indonesia; batas bawah dari PLTS.', 'Green hydrogen production cost in Indonesia; lower bound from solar PV.'), sumber_id: 'dpr', tingkat_bukti: 'resmi' },
    { k: 'krakatau', usd_kg: [5, 7], ket: L('Harga hidrogen hijau saat ini menurut COO Krakatau Steel (Mei 2026).', 'Current green hydrogen price per the Krakatau Steel COO (May 2026).'), sumber_id: 'bcas-krakatau', tingkat_bukti: 'kata-pihak' },
    { k: 'baja', usd_kg: [0, 1], ket: L('Ambang agar hidrogen bersaing untuk baja (kata pihak: di bawah USD 1 per kg).', 'Threshold for hydrogen to compete in steel (the company\'s view: under USD 1/kg).'), sumber_id: 'bcas-krakatau', tingkat_bukti: 'kata-pihak' },
  ],
  listrik: { kwh_per_kg: 54.6, sumber_id: 'jc-bnef', tarif_usd_kwh: [0.02, 0.04, 0.06, 0.08] },
  jepang_cif: { yen_nm3: { 2030: 30, 2050: 20 }, sumber_id: 'jp-basic-white', tingkat_bukti: 'media' },
  pendanaan_ids: ['pi_KR_GOV_120_1480000_2026_005', 'pi_NL_KVK_27378529_CERF24ID4I', 'pi_NL_KVK_27378529_CERF25ID2O'],
};

/* ---------- 8. Kebijakan ---------- */
const KEBIJAKAN = {
  linimasa: [
    { tgl: '2007', teks: L('UU 30/2007 tentang Energi: hidrogen termasuk energi baru.', 'Law 30/2007 on Energy: hydrogen counts as new energy.'), sumber_id: 'ghes', tingkat_bukti: 'media', regulasi: null },
    { tgl: '2022', teks: L('Perpres 112/2022: percepatan energi terbarukan untuk tenaga listrik (dasar harga patokan dan percepatan perizinan).', 'Presidential Regulation 112/2022: accelerating renewables for power (basis for benchmark prices and faster permitting).'), sumber_id: 'ghes', tingkat_bukti: 'media', regulasi: 'perpres-112-2022' },
    { tgl: '2023-12', teks: L('Strategi Hidrogen Nasional diluncurkan.', 'National Hydrogen Strategy launched.'), sumber_id: 'ghes', tingkat_bukti: 'media', regulasi: null },
    { tgl: '2024-06', teks: L('ESDM menyiapkan Standar Hidrogen Indonesia dan standar klasifikasi usaha hidrogen.', 'ESDM prepares an Indonesian Hydrogen Standard and a hydrogen business classification standard.'), sumber_id: 'esdm-jepang-2024', tingkat_bukti: 'resmi', regulasi: null },
    { tgl: '2025-04-15', teks: L('Peta Jalan Hidrogen dan Amonia Nasional (RHAN) diluncurkan: inisiasi 2025-2034, pengembangan dan integrasi 2035-2045, akselerasi 2045-2060.', 'National Hydrogen and Ammonia Roadmap (RHAN) launched: initiation 2025-2034, development and integration 2035-2045, acceleration 2045-2060.'), sumber_id: 'esdm-asta-cita', tingkat_bukti: 'resmi', regulasi: null },
    { tgl: '2025', teks: L('PP 40/2025 tentang Kebijakan Energi Nasional memasukkan hidrogen dan RHAN dalam kerangka kebijakan.', 'Government Regulation 40/2025 on National Energy Policy puts hydrogen and RHAN in the policy framework.'), sumber_id: 'dpr', tingkat_bukti: 'resmi', regulasi: 'pp-40-2025' },
    { tgl: '2025-10', teks: L('Kajian DPR mencatat belum ada insentif fiskal, standar sertifikasi, atau kewajiban pemanfaatan hidrogen.', 'A DPR study notes there is no fiscal incentive, certification standard or use mandate for hydrogen yet.'), sumber_id: 'dpr', tingkat_bukti: 'resmi', regulasi: null },
    { tgl: '2026-02-03', teks: L('ESDM menargetkan hidrogen hijau tersedia di pasar sekitar 200 ton per tahun (KPI Dirjen EBTKE); peta jalan kolaborasi HASI dengan Jepang.', 'ESDM targets about 200 t/year of green hydrogen on the market (DG EBTKE KPI); HASI collaboration roadmap with Japan.'), sumber_id: 'esdm-asta-cita', tingkat_bukti: 'resmi', regulasi: null },
  ],
  fase: [
    { k: 'inisiasi', dari: 2025, sampai: 2034 }, { k: 'pengembangan', dari: 2035, sampai: 2045 }, { k: 'akselerasi', dari: 2045, sampai: 2060 },
  ],
  target_2060: { mt: 9.9, alternatif_mt: 11.7, sumber_id: 'ibp', tingkat_bukti: 'media' },
  insentif: [
    { k: 'fiskal', status: 'belum', ket: L('Belum ada insentif fiskal khusus hidrogen menurut kajian DPR Oktober 2025.', 'No hydrogen-specific fiscal incentive yet per the DPR study of October 2025.'), sumber_id: 'dpr', tingkat_bukti: 'resmi' },
    { k: 'sertifikasi', status: 'disiapkan', ket: L('Belum ada standar sertifikasi (DPR 2025); Standar Hidrogen Indonesia disiapkan ESDM (2024).', 'No certification standard yet (DPR 2025); an Indonesian Hydrogen Standard is being prepared by ESDM (2024).'), sumber_id: 'dpr', tingkat_bukti: 'resmi' },
    { k: 'mandat', status: 'belum', ket: L('Belum ada kewajiban pemanfaatan; PLN mengusulkan meniru lelang Jepang dengan syarat pabrik elektroliser di Indonesia.', 'No use mandate yet; PLN proposes copying Japan\'s auction with a condition to build electrolyser factories in Indonesia.'), sumber_id: 'kompas-pln-mahal', tingkat_bukti: 'media' },
    { k: 'pembiayaan', status: 'disebut', ket: L('ESDM menyebut peningkatan pembiayaan publik dan mitigasi risiko tahap awal, tanpa nilai; kerja sama JICA.', 'ESDM cites more public financing and early-stage risk mitigation, with no amount; JICA cooperation.'), sumber_id: 'esdm-asta-cita', tingkat_bukti: 'resmi' },
  ],
};

/* ---------- 9. Proyek dunia pembanding ---------- */
const DUNIA = {
  proyek: [
    { id: 'neom', iso2: 'sa', nama: L('NEOM Green Hydrogen (ACWA Power)', 'NEOM Green Hydrogen (ACWA Power)'), status: 'konstruksi', ket: L('Sekitar 600 ton hidrogen per hari; investasi USD 8,5 miliar; konstruksi selesai, komisioning, operasi komersial 2027.', 'About 600 t of hydrogen a day; USD 8.5 billion; construction complete, commissioning, commercial operation 2027.'), kapasitas_ton_hari: 600, sumber_ids: ['neom', 'neomceo', 'neom80'], tingkat_bukti: 'media', org: ['p_0e6d34a26d'] },
    { id: 'kuqa', iso2: 'cn', nama: L('Sinopec Kuqa, Xinjiang', 'Sinopec Kuqa, Xinjiang'), status: 'beroperasi', ket: L('260 MW, 20.000 ton per tahun; beroperasi 30 Agustus 2023, kenaikan produksi lebih lambat dari rencana.', '260 MW, 20,000 t/year; operating since 30 August 2023, ramp-up slower than planned.'), kapasitas_ton_tahun: 20000, sumber_ids: ['kuqa', 'kuqa2'], tingkat_bukti: 'media', org: [] },
    { id: 'fh2r', iso2: 'jp', nama: L('Fukushima Hydrogen Energy Research Field', 'Fukushima Hydrogen Energy Research Field'), status: 'beroperasi', ket: L('PLTS 10 MW, hingga 1.200 Nm3 per jam; diresmikan 2020.', '10 MW solar, up to 1,200 Nm3/hour; opened 2020.'), kapasitas_ton_tahun: null, sumber_ids: ['fh2r'], tingkat_bukti: 'via-pihak-ketiga', org: [] },
    { id: 'townsville', iso2: 'au', nama: L('Townsville (Queensland)', 'Townsville (Queensland)'), status: 'dibatalkan', ket: L('Dibatalkan karena tidak menemukan pembeli.', 'Cancelled after failing to find buyers.'), kapasitas_ton_tahun: null, sumber_ids: ['tville'], tingkat_bukti: 'media', org: [] },
    { id: 'gladstone', iso2: 'au', nama: L('Fortescue, PEM50 Gladstone', 'Fortescue, PEM50 Gladstone'), status: 'dibatalkan', ket: L('Dibatalkan setelah keputusan investasi; pemerintah Australia meminta hibah dikembalikan.', 'Cancelled after the investment decision; the Australian government asked for the grant to be repaid.'), kapasitas_ton_tahun: null, sumber_ids: ['fort', 'fort2', 'repay'].filter((x) => x !== 'fort2'), tingkat_bukti: 'media', org: [] },
    { id: 'bp-au', iso2: 'au', nama: L('BP, rencana 26 GW (Australia)', 'BP, 26 GW plan (Australia)'), status: 'dibatalkan', ket: L('BP mundur dari rencana hidrogen hijau 26 GW pada 28 Juli 2025.', 'BP backed out of its 26 GW green hydrogen plan on 28 July 2025.'), kapasitas_ton_tahun: null, sumber_ids: ['bp'], tingkat_bukti: 'media', org: [] },
  ],
  iea: { fid_2030_mt: 4.2, diumumkan_2030_mt: 37, diumumkan_2030_mt_tahun_lalu: 49, rendah_emisi_2025_mt: 1, sumber_id: 'iea-ghr25-ringkas', tingkat_bukti: 'resmi' },
};

/* ---------- 10. Isu ---------- */
const ISU = [
  { id: 'i1', kat: 'biaya', pihak: L('Krakatau Steel (COO)', 'Krakatau Steel (COO)'), ket: L('Hidrogen hijau sekitar USD 5 sampai 7 per kg, sedangkan baja butuh di bawah USD 1 per kg.', 'Green hydrogen is about USD 5 to 7/kg while steel needs under USD 1/kg.'), sumber_id: 'bcas-krakatau', tingkat_bukti: 'kata-pihak' },
  { id: 'i2', kat: 'biaya', pihak: L('PLN', 'PLN'), ket: L('Hidrogen hijau mahal; PLN meminta pemerintah meniru lelang Jepang, termasuk kewajiban membangun pabrik elektroliser di Indonesia.', 'Green hydrogen is expensive; PLN asks the government to copy Japan\'s auction, including a duty to build electrolyser factories in Indonesia.'), sumber_id: 'kompas-pln-mahal', tingkat_bukti: 'kata-pihak' },
  { id: 'i3', kat: 'kebijakan', pihak: L('Pusat Analisis DPR RI', 'DPR RI Analysis Centre'), ket: L('Belum ada insentif fiskal, standar sertifikasi, atau kewajiban pemanfaatan hidrogen.', 'No fiscal incentive, certification standard or use mandate for hydrogen yet.'), sumber_id: 'dpr', tingkat_bukti: 'resmi' },
  { id: 'i4', kat: 'permintaan', pihak: L('Pemberitaan Townsville', 'Townsville reporting'), ket: L('Proyek hidrogen tanpa pembeli dibatalkan; proyek dengan pembeli dekat (Kuqa, NEOM) maju. Pelajaran bagi proyek ekspor Indonesia.', 'Hydrogen projects without buyers are cancelled; those with nearby buyers (Kuqa, NEOM) advance. A lesson for Indonesian export projects.'), sumber_id: 'tville', tingkat_bukti: 'media' },
  { id: 'i5', kat: 'jadwal', pihak: L('Direktori METI (energi_baru)', 'METI directory (energi_baru)'), ket: L('Pilot Ulubelu semula ditargetkan 2023, kini akhir 2026; GHP PLN sekitar 203 ton per tahun setara sekitar 0,005 persen permintaan 4 juta ton.', 'The Ulubelu pilot was first targeted for 2023, now end-2026; PLN GHPs at about 203 t/year are about 0.005 percent of the 4 Mt demand.'), sumber_id: 'ulu', tingkat_bukti: 'media' },
  { id: 'i6', kat: 'teknologi', pihak: L('Tinjauan teknoekonomi', 'Techno-economic review'), ket: L('Umur stack SOEC masih di bawah 20.000 jam dan AEM sekitar 5.000 jam, jauh di bawah AEL dan PEM (50.000 sampai 80.000 jam).', 'SOEC stack life is still under 20,000 h and AEM about 5,000 h, far below AEL and PEM (50,000 to 80,000 h).'), sumber_id: 'pmc-elektroliser', tingkat_bukti: 'via-pihak-ketiga' },
  { id: 'i7', kat: 'rantai', pihak: L('IEA', 'IEA'), ket: L('Tiongkok memegang hampir 60 persen kapasitas pabrik elektroliser dunia; pabrikan lokal Indonesia yang ditemukan baru satu (GPI) dan data TKDN tidak ditemukan.', 'China holds nearly 60 percent of world electrolyser manufacturing capacity; only one Indonesian maker was found (GPI) and no TKDN data.'), sumber_id: 'iea-ghr25-ringkas', tingkat_bukti: 'resmi' },
  { id: 'i8', kat: 'pasar', pihak: L('Korea JoongAng Daily', 'Korea JoongAng Daily'), ket: L('Lelang listrik hidrogen bersih Korea lemah dan pemberitahuan berikutnya dibatalkan; pembeli ekspor belum pasti.', 'Korea\'s clean hydrogen power auction was weak and the next notice was cancelled; export buyers are not certain.'), sumber_id: 'joongang-chps', tingkat_bukti: 'media' },
  { id: 'i9', kat: 'data', pihak: L('ESDM dan media', 'ESDM and media'), ket: L('Dua angka kebutuhan hidrogen 2060 beredar (9,9 dan 11,7 juta ton per tahun) dan belum dipastikan mana yang resmi.', 'Two 2060 hydrogen demand figures circulate (9.9 and 11.7 Mt/year) and which one is official is unconfirmed.'), sumber_id: 'ibp', tingkat_bukti: 'media' },
];

const CELAH = [
  L('Harga elektroliser (USD per kW) dan LCOH untuk lokasi Indonesia belum ada sumber resmi Indonesia; rentang di sini dari IEA (global) dan DPR (Indonesia). biaya_bangun.json masih mengosongkan sel hidrogen.', 'No Indonesian official source for electrolyser prices (USD/kW) or site-specific LCOH; ranges here come from the IEA (global) and DPR (Indonesia). biaya_bangun.json still leaves the hydrogen cell empty.'),
  L('Kapasitas amonia per pabrik Pupuk Kujang dan Petrokimia Gresik tidak ditemukan; angka kelompok (7 juta ton) dan pabrik lain dari tahun sumber berbeda.', 'Per-plant ammonia capacity for Pupuk Kujang and Petrokimia Gresik was not found; the group figure (7 Mt) and other plants come from different source years.'),
  L('Metanol hijau dan e-fuel: tidak ada proyek Indonesia berkapasitas yang ditemukan selain pilot e-chemicals Pertamina NRE dan HyET.', 'Green methanol and e-fuels: no Indonesian project with a stated capacity was found besides the Pertamina NRE and HyET e-chemicals pilot.'),
  L('Tidak ditemukan kontrak pembelian ekspor hidrogen atau amonia hijau dari Indonesia ke Jepang atau Korea, dan tidak ada pelabuhan ekspor yang disebut sumber.', 'No export offtake contract for Indonesian green hydrogen or ammonia to Japan or Korea was found, and no source names an export port.'),
  L('Target Korea Selatan (permintaan hidrogen bersih 2030 dan 2050) tidak berhasil dibaca; hanya mekanisme CHPS.', 'South Korea\'s clean hydrogen demand targets (2030, 2050) could not be read; only the CHPS mechanism.'),
  L('Daftar 23 lokasi potensial PLN dan ESDM disebut jumlahnya saja; nama lokasinya tidak diumumkan di sumber.', 'The 23 PLN and ESDM potential sites are given only as a count; site names are not published in the source.'),
  L('Metode, kandungan lokal, dan harga elektroliser GPI tidak disebut; belum ada sumber tentang TKDN elektroliser.', 'GPI electrolyser type, local content and price are not stated; no source on electrolyser TKDN.'),
];

export function bangun() {
  return {
    lapis: 'hidrogen', dibangun_pada: T,
    catatan: L('Benih modul /hidrogen. Data yang sudah ada dirujuk saat runtime, tidak disalin. Tiap butir membawa sumber dan tingkat bukti; angka hitungan METI ditandai.', 'Seed for the /hidrogen module. Existing data is referenced at runtime, not copied. Every item carries a source and evidence level; METI arithmetic is marked.'),
    sumber: SUMBER,
    rujukan: { energi_baru: ['h2-rhan', 'h2-pln21', 'h2-ulubelu', 'h2-gresik', 'h2-pertamina-mitsubishi'], pemasok_segmen: 'hidrogen', topik: 'hidrogen', biaya_bangun: 'celah', pendanaan_internasional: BIAYA.pendanaan_ids, potensi_atlas: 'global/potensi_atlas.json', proyek: 'proyek.json' },
    kunci: { permintaan_mt_2024: 4, pln_ton_tahun: 203, lcoh_usd_kg: [4.3, 8.3], target_2060_mt: 9.9, kpi_2026_ton: 200, sumber_ids: { permintaan: 'dpr', pln: 'hrs', lcoh: 'dpr', target: 'ibp', kpi: 'esdm-asta-cita' } },
    lokasi: LOKASI, lokasi_potensial_jumlah: { n: 23, sumber_id: 'li-lokasi23', tingkat_bukti: 'media' },
    elektroliser: ELEKTROLISER, produksi: PRODUKSI, turunan: TURUNAN, pemakaian: PEMAKAIAN, ekspor: EKSPOR, biaya: BIAYA, kebijakan: KEBIJAKAN, dunia: DUNIA, isu: ISU, celah: CELAH,
  };
}

const TINGKAT = ['resmi', 'media', 'cuplikan', 'via-pihak-ketiga', 'kata-pihak'];
export function periksa(d) {
  const sid = new Set(d.sumber.map((s) => s.id));
  assert.equal(sid.size, d.sumber.length, 'id sumber ganda');
  for (const s of d.sumber) { assert.ok(/^https:\/\//.test(s.url) && s.judul && s.penerbit, 'sumber cacat ' + s.id); assert.ok(TINGKAT.includes(s.tingkat_bukti), 'tingkat ' + s.id); }
  const pakai = (x, w) => assert.ok(sid.has(x), 'sumber tak dikenal: ' + x + ' di ' + w);
  const jalan = (o, w) => { if (Array.isArray(o)) o.forEach((x) => jalan(x, w)); else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (k === 'sumber_id' || k === 'harga_sumber_id' || k === 'sumber_bnef') pakai(v, w + '.' + k); else if (k === 'sumber_ids' && Array.isArray(v)) v.forEach((x) => pakai(x, w)); else jalan(v, w + '.' + k); } };
  jalan(d, 'd');
  for (const v of Object.values(d.kunci.sumber_ids)) pakai(v, 'kunci');
  const org = new Set(j('public/data/organisasi.json').baris.map((b) => b.id));
  const semuaOrg = [];
  const kumpul = (o) => { if (Array.isArray(o)) o.forEach(kumpul); else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (k === 'org' && Array.isArray(v)) semuaOrg.push(...v); else if (k === 'org' && typeof v === 'string') semuaOrg.push(v); else kumpul(v); } };
  kumpul(d);
  for (const id of semuaOrg) assert.ok(org.has(id), 'org tak ada: ' + id);
  const en = new Set(j('public/data/energi_baru.json').baris.map((b) => b.id));
  for (const id of d.rujukan.energi_baru) assert.ok(en.has(id), 'energi_baru tak ada: ' + id);
  for (const l of d.lokasi) { if (l.enb) assert.ok(en.has(l.enb), l.id); }
  for (const p of d.produksi) { if (p.enb) assert.ok(en.has(p.enb), p.id); }
  const pj = new Set(j('public/data/proyek.json').baris.map((b) => b.id));
  for (const l of d.lokasi) if (l.proyek_id) assert.ok(pj.has(l.proyek_id), 'proyek tak ada: ' + l.proyek_id);
  const atlas = new Set(j('public/data/global/potensi_atlas.json').baris.map((b) => b.kode));
  for (const l of d.lokasi) for (const k of [l.kab, l.kab2]) if (k) assert.ok(atlas.has(k), 'kab tak ada di atlas: ' + k);
  const reg = new Set(j('public/data/regulasi.json').baris.map((b) => b.id));
  for (const x of d.kebijakan.linimasa) if (x.regulasi) assert.ok(reg.has(x.regulasi), 'regulasi tak ada: ' + x.regulasi);
  const pi = new Set(j('public/data/pendanaan_internasional.json').baris.map((b) => b.id));
  for (const id of d.biaya.pendanaan_ids) assert.ok(pi.has(id), 'pendanaan tak ada: ' + id);
  const pl = j('public/data/global/pemasok_lain.json').baris.filter((b) => b.segmen.includes('hidrogen'));
  assert.ok(pl.length >= 10, 'pemasok hidrogen kurang');
  for (const k of ['ael', 'pem', 'aem', 'soec']) assert.ok(d.elektroliser.teknologi.some((t) => t.k === k), k);
  for (const t of d.elektroliser.teknologi) assert.ok(t.kwh[0] <= t.kwh[1], t.k);
  const ep = d.produksi.find((p) => p.id === 'ulubelu-pge'); assert.equal(ep.ton_tahun, 100 * 365 / 1000);
  assert.ok(d.produksi.find((p) => p.id === 'pln-ghp22').ton_tahun > d.produksi.find((p) => p.id === 'muara-karang').ton_tahun);
  const bk = j('public/data/biaya_bangun.json'); assert.ok(JSON.stringify(bk.celah).includes('Hidrogen'), 'celah biaya_bangun hidrogen sudah berubah, tinjau ulang tab Biaya');
  assert.equal(d.elektroliser.pabrik_dunia.terpasang_gw_2024, 2);
  for (const t of Object.values(d)) void t;
  return { sumber: d.sumber.length, lokasi: d.lokasi.length, pemasok_hidrogen: pl.length };
}

async function cekUrl() {
  const { ambil } = await import('../pipa/_panen_sopan.mjs');
  for (const s of SUMBER) { try { await ambil(s.url, { method: 'HEAD' }); console.log('OK ', s.id); } catch (e) { console.log('GAGAL', s.id, e.message); if (/^403/.test(e.message) || /403 berhenti|429/.test(e.message)) break; } }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv[2];
  if (a === '--bangun') { const d = bangun(); console.log(periksa(d)); fs.writeFileSync(path.join(ROOT, 'public/data/hidrogen.json'), JSON.stringify(d, null, 1) + '\n'); }
  else if (a === '--selftest') console.log(periksa(bangun()));
  else if (a === '--cek-url') await cekUrl();
  else console.log('pakai: --bangun | --selftest | --cek-url');
}
