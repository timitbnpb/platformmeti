#!/usr/bin/env node
// Angin (PLTB darat dan lepas pantai) ujung ke ujung -> public/data/angin.json.
// MERUJUK data yang sudah ada lewat id (proyek_terpadu, ruptl, lelang, regulasi, isu, organisasi, global/pemasok_lain, global/logistik,
// global/potensi_atlas, peluang, dagang_komponen, topik/bayu); sumber dan angka yang sudah ada dipinjam dari topik/bayu.json, bukan diketik ulang.
// Data baru hanya butir yang dibaca dari sumber publik tanggal T (tiap butir bersumber + bertingkat bukti); yang tidak ditemukan ditulis di `celah`.
// TIDAK mengarang. Angka hitungan (LCOE) berlabel EST/Hipotesis dan rumusnya ikut tersimpan. Pakai: --bangun | --selftest | --cek-url
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const j = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const T = '2026-11-08';
const S = (id, judul, penerbit, url, tahun, tb = 'media') => ({ id, judul, penerbit, url, tahun, tingkat_bukti: tb, tanggal_periksa: T });
const L = (id, en) => ({ id, en });

/** Sumber yang dipinjam dari topik/bayu.json (id sama). */
const PINJAM = ['etp1', 'etp2', 'ruen', 'p112', 'ruptl', 'stat', 'irena', 'ember', 'gem', 'esdm_sidrap', 'esdm_tolo', 'adb_tolo', 'gn_sidrap', 'bisnis_sidrap', 'bt_tl', 'bisnis_tl', 'li_tl', 'pm_tl', 'katadata277', 'esmap', 'iesr', 'gwec', 'irena_cost', 'jm_izin', 'perm30', 'konsul', 'iir_sk', 'owid'];
const BUKTI = { resmi: 'resmi', media: 'media', kajian: 'kajian', 'via-pihak-ketiga': 'via-pihak-ketiga', editorial: 'editorial' };

export const SUMBER_BARU = [
  S('ruptl-faq', 'FAQ RUPTL PLN 2025-2034 (tambahan 69,5 GW; PLTB 7,2 GW, PLTS 17,1 GW, PLTA 11,7 GW, PLTP 5,2 GW)', 'Ditjen Ketenagalistrikan, Kementerian ESDM', 'https://gatrik.esdm.go.id/assets/uploads/download_index/files/daa0b-faq-ruptl-pln-2025-2034.pdf', 2025, 'resmi'),
  S('target-5gw', 'Indonesia plans to enhance wind power capacity by 5 GW by 2030 (hanya cuplikan hasil pencarian; teks penuh belum dibaca)', 'Southeast Asia Infra', 'https://southeastasiainfra.com/plans-to-enhance-wind-power-capacity-by-5-gw-in-indonesia-by-2030/', 2025),
  S('chambers-2026', 'Renewable Energy 2026, Indonesia (Permen ESDM 5/2025 pedoman PPA, Permen ESDM 10/2025 peta jalan transisi; kapasitas bayu sekitar 151,5 MW; hanya cuplikan)', 'Chambers and Partners', 'https://practiceguides.chambers.com/practice-guides/renewable-energy-2026/indonesia/trends-and-developments/O27376', 2026),
  S('etp-izin', 'Permitting and Regulation Assessment for Onshore Wind v3.0 (kajian perizinan bayu darat; hanya judul dan cuplikan dibaca)', 'Energy Transition Partnership', 'https://www.energytransitionpartnership.org/wp-content/uploads/2024/06/Permitting-and-Regulation-Assessment-for-Onshore-Wind-v3.0-Final.pdf', 2024, 'kajian'),
  S('detik-sidrap', 'Kebun Angin Terbesar RI Resmi Beroperasi (Sidrap: 30 turbin, 75 MW, menara 80 m, bilah 57 m; tersambung April 2018, diresmikan 2 Juli 2018; komponen Tolo lewat Pelabuhan Soekarno-Hatta Makassar)', 'Detik Finance', 'https://finance.detik.com/energi/d-4095180/kebun-angin-terbesar-ri-resmi-beroperasi', 2018),
  S('windtech-gamesa', 'Gamesa to supply the turbines for Indonesia\'s first wind farm (30 turbin G114-2.5 MW untuk Sidrap; cuplikan)', 'Windtech International', 'https://www.windtech-international.com/projects-and-contracts/gamesa-to-supply-the-turbines-for-indonesias-first-wind-farm', 2017),
  S('petromindo-sg', 'Siemens Gamesa to supply turbines for Jeneponto, Sidrap wind power plants (cuplikan; isi berbayar tidak dibaca)', 'Petromindo', 'https://www.petromindo.com/news/article/siemens-gamesa-to-supply-turbines-for-jeneponto-sidrap-wind-power-plants', 2017, 'via-pihak-ketiga'),
  S('siemens-tolo', 'Siemens built grid connection for Indonesia wind farms (Tolo: 20 turbin SWT-3.6-130, sambungan 150 kV, dua trafo 45 MVA; cuplikan)', 'Siemens', 'https://news.siemens.com/et-ee/siemens-built-grid-connection-for-indonesia-wind-farms/', 2018, 'resmi'),
  S('kenertec', 'Mengenal Kenertec Power System, produsen menara angin dari Indonesia yang mendunia (Ciwandan, Cilegon; ekspor lima benua; TKDN bahan sekitar 30-40 persen; pemasok menara Sidrap)', 'Warta Ekonomi', 'https://wartaekonomi.co.id/read564569/mengenal-kenertec-power-system-produsen-menara-angin-dari-indonesia-yang-mendunia', 2025),
  S('tkdn-esdm11', 'Aturan TKDN infrastruktur ketenagalistrikan: Permen ESDM 11/2024 dan Permenperin 34/2024 (PLTB hanya disebut dalam daftar EBT; tanpa ambang angka per komponen)', 'Industry.co.id', 'https://www.industry.co.id/read/135224/sah-begini-penjelasan-permenperin-no-34-tahun-2024-dan-permen-esdm-no-11-tahun-2024-terkait-aturan-tkdn-dalam-pembangunan-infrastruktur-ketenagalistrikan-plts', 2024),
  S('tl-tarif', 'PLN menangkan tarif listrik PLTB terendah sepanjang sejarah (Tanah Laut; angka 5,5 sen US$/kWh dibaca dari ringkasan pencarian, bukan dari teks penuh)', 'Warta Ekonomi', 'https://wartaekonomi.co.id/read459973/pln-menangkan-tarif-listrik-pltb-terendah-sepanjang-sejarah', 2022),
  S('comtrade-angin', 'UN Comtrade, impor Indonesia HS 850231 (pembangkit listrik tenaga angin), lewat dagang_komponen.json', 'United Nations Statistics Division (UN Comtrade)', '/data/dagang_komponen.json', 2026, 'resmi'),
];

function sumberGabung() {
  const tp = j('public/data/topik/bayu.json').sumber, out = [];
  for (const id of PINJAM) {
    const s = tp[id]; if (!s) throw new Error('sumber topik tidak ada: ' + id);
    out.push({ id, judul: s.judul, penerbit: s.penerbit, url: s.url, tahun: s.tahun, tingkat_bukti: BUKTI[s.bukti] || 'media', tanggal_periksa: s.tanggal || T });
  }
  return out.concat(SUMBER_BARU);
}

const ORG = { upc: 'en_bce3927f4a', vena: 'p_ef20787d46', eren: 'en_9699f6cf4b', adaro: 'p_7f829f524e', pln: 'su_ed074ff5', sg: 'en_9013c0f215', kenertec: 'en_0bab89da0f', siemensId: 'en_9589eebc35' };
const KOMPONEN = [['bilah', ['bilah']], ['menara', ['menara']], ['nacelle', ['nacelle']], ['turbin', ['turbin-lengkap']], ['drivetrain', ['gearbox', 'generator', 'bantalan']], ['instalasi', ['kapal-instalasi']]];

/** LCOE sederhana (US sen/kWh) = capex x (CRF + opex%) / (87,6 x FK). CRF = r(1+r)^n / ((1+r)^n - 1). */
export function lcoe({ capex_usd_kw, opex_persen, wacc, umur, fk }) {
  const r = wacc / 100, crf = (r * (1 + r) ** umur) / ((1 + r) ** umur - 1);
  return Math.round(((capex_usd_kw * (crf + opex_persen / 100)) / (87.6 * fk)) * 100) / 100;
}

export function bangun() {
  const pt = j('public/data/proyek_terpadu.json').baris.filter((b) => b.tek === 'bayu');
  const ruptl = j('public/data/ruptl.json').baris.filter((b) => b.teknologi === 'bayu');
  const topik = j('public/data/topik/bayu.json');
  const prov = topik.bab['8'].baris.map((r) => ({ kode: r.kode, provinsi: r.provinsi, potensi_mw: r.potensi_mw, terpasang_mw: r.terpasang_mw }));
  const skenario = [
    { k: 'darat_global', capex_usd_kw: 1041, opex_persen: 2.5, wacc: 8, umur: 25, fk: 0.3, capex_sumber_id: 'irena_cost', capex_bukti: 'via-pihak-ketiga' },
    { k: 'darat_id_sidrap', capex_usd_kw: 2000, opex_persen: 2.5, wacc: 10, umur: 25, fk: 0.35, capex_sumber_id: 'esdm_sidrap', capex_bukti: 'media' },
    { k: 'darat_id_murah', capex_usd_kw: 1400, opex_persen: 2.5, wacc: 9, umur: 25, fk: 0.35, capex_sumber_id: 'irena_cost', capex_bukti: 'editorial' },
    { k: 'lepas_global', capex_usd_kw: 2852, opex_persen: 3, wacc: 8, umur: 25, fk: 0.4, capex_sumber_id: 'irena_cost', capex_bukti: 'via-pihak-ketiga' },
  ].map((s) => ({ ...s, lcoe_sen: lcoe(s) }));

  const pemain = [
    { org_id: ORG.upc, peran: ['pengembang'], proyek_ids: ['pj_0006'], fakta: [
      { teks: L('Konsorsium PT UPC Sidrap Bayu Energi membangun PLTB Sidrap 75 MW (30 turbin); COD 5 April 2018 dan diresmikan 2 Juli 2018.', 'The PT UPC Sidrap Bayu Energi consortium built the 75 MW Sidrap wind farm (30 turbines); COD 5 April 2018, inaugurated 2 July 2018.'), sumber_id: 'esdm_sidrap', tingkat_bukti: 'resmi' },
      { teks: L('Industrial Info Resources (30 November 2022) melacak 12 proyek angin UPC Renewables lain di Indonesia (Sukabumi termasuk).', 'Industrial Info Resources (30 November 2022) tracked 12 other UPC Renewables wind projects in Indonesia (Sukabumi included).'), sumber_id: 'iir_sk', tingkat_bukti: 'media' }] },
    { org_id: ORG.vena, peran: ['pengembang', 'operator'], proyek_ids: ['pj_0005', 'gem_wind_L100000901004'], fakta: [
      { teks: L('PT Energi Bayu Jeneponto (Vena Energy) mengoperasikan PLTB Tolo 72 MW; COD 14 Mei 2019, dibiayai antara lain ADB.', 'PT Energi Bayu Jeneponto (Vena Energy) operates the 72 MW Tolo wind farm; COD 14 May 2019, financed in part by ADB.'), sumber_id: 'esdm_tolo', tingkat_bukti: 'resmi' },
      { teks: L('ADB membiayai Tolo sebagai batas baru transisi energi Indonesia.', 'ADB financed Tolo as a new frontier in Indonesia\'s energy transition.'), sumber_id: 'adb_tolo', tingkat_bukti: 'resmi' }] },
    { org_id: ORG.eren, peran: ['pengembang'], proyek_ids: ['pj_0004'], fakta: [
      { teks: L('Total Eren dan Adaro Power memenangkan tender PLTB Tanah Laut 70 MW dengan baterai 10 MWh; PJBTL ditandatangani Mei 2023.', 'Total Eren and Adaro Power won the 70 MW Tanah Laut tender with a 10 MWh battery; the PPA was signed in May 2023.'), sumber_id: 'li_tl', tingkat_bukti: 'media' },
      { teks: L('Tarif menang dilaporkan 5,5 sen US$ per kWh, terendah untuk PLTB di Indonesia saat itu.', 'The winning tariff was reported at US 5.5 cents per kWh, the lowest for Indonesian wind at the time.'), sumber_id: 'tl-tarif', tingkat_bukti: 'media' }] },
    { org_id: ORG.adaro, peran: ['pengembang'], proyek_ids: ['pj_0004'], fakta: [
      { teks: L('Bloomberg Technoz (1 Juli 2025) melaporkan bayang-bayang terminasi PLTB Tanah Laut; keputusan akhir belum diverifikasi.', 'Bloomberg Technoz (1 July 2025) reported the shadow of termination over the Tanah Laut wind farm; the final decision is unverified.'), sumber_id: 'bt_tl', tingkat_bukti: 'media' }] },
    { org_id: ORG.pln, peran: ['pembeli', 'perencana'], proyek_ids: ['pj_0001', 'pj_0002', 'pj_0003'], fakta: [
      { teks: L('RUPTL 2025-2034 menargetkan tambahan PLTB 7,2 GW dari total 69,5 GW; tabel rincian per provinsi hanya memuat proyek bernama dengan jumlah jauh lebih kecil.', 'RUPTL 2025-2034 targets 7.2 GW of added wind out of 69.5 GW in total; the per-province detail tables name far fewer projects.'), sumber_id: 'ruptl-faq', tingkat_bukti: 'resmi' }] },
    { org_id: ORG.sg, peran: ['pemasok'], proyek_ids: ['pj_0006', 'gem_wind_L100000901004'], fakta: [
      { teks: L('Memasok 30 turbin G114-2.5 MW untuk Sidrap dan 20 turbin 3,6 MW untuk Tolo.', 'Supplied 30 G114-2.5 MW turbines for Sidrap and 20 turbines of 3.6 MW for Tolo.'), sumber_id: 'petromindo-sg', tingkat_bukti: 'via-pihak-ketiga' },
      { teks: L('Pesanan Gamesa untuk pembangkit pertama Indonesia berupa 30 turbin G114-2.5 MW.', 'Gamesa\'s order for Indonesia\'s first wind farm was 30 G114-2.5 MW turbines.'), sumber_id: 'windtech-gamesa', tingkat_bukti: 'media' }] },
    { org_id: ORG.siemensId, peran: ['kontraktor'], proyek_ids: ['gem_wind_L100000901004'], fakta: [
      { teks: L('Membangun sambungan jaringan 150 kV, panel 33 kV, dua trafo 45 MVA, dan otomasi gardu untuk Tolo.', 'Built the 150 kV grid connection, 33 kV panels, two 45 MVA transformers and substation automation for Tolo.'), sumber_id: 'siemens-tolo', tingkat_bukti: 'resmi' }] },
    { org_id: ORG.kenertec, peran: ['pemasok'], proyek_ids: ['pj_0006'], fakta: [
      { teks: L('Pabrik menara di Ciwandan, Cilegon (Banten); mengekspor ke lima benua dan disebut memasok menara untuk Sidrap; TKDN bahan sekitar 30 sampai 40 persen.', 'Tower plant in Ciwandan, Cilegon (Banten); exports to five continents and is reported to have supplied Sidrap towers; local material content about 30 to 40 percent.'), sumber_id: 'kenertec', tingkat_bukti: 'media' }] },
  ];

  return {
    lapis: 'angin', dibangun_pada: T, tanggal: T,
    keterangan: 'Modul angin (PLTB darat dan lepas pantai) ujung ke ujung. Berkas ini hanya memuat rujukan id ke data yang sudah ada dan butir baru bersumber; angka proyek, RUPTL, lelang, pemasok, pelabuhan, atlas, isu, regulasi dibaca dari berkas aslinya saat runtime.',
    sumber: sumberGabung(),
    rujukan: {
      proyek_ids: pt.map((b) => b.id),
      ruptl_ids: ruptl.map((b) => b.id),
      lelang_ids: ['lel_hijaunesia_2023', 'lel_pltb_sulbagsel_2025'],
      regulasi_ids: ['uu-30-2009', 'pp-40-2025', 'perpres-22-2017', 'perpres-112-2022', 'permen-esdm-11-2021', 'permen-esdm-5-2025', 'permen-esdm-10-2025', 'permen-esdm-30-2006'],
      isu_ids: ['oversupply-take-or-pay', 'proyek-henti-11', 'proyek-henti-15', 'proyek-henti-61'],
      kasus_sukses: ['sidrap', 'tolo'], kasus_gagal: ['tanah-laut', 'sukabumi', 'nusa-penida'],
      pemasok_segmen: 'bayu', hs: '850231', pelabuhan_ids: ['makassar', 'priok', 'perak', 'belawan', 'batam', 'patimban'],
      pembangkit_status_urut: ['beroperasi', 'konstruksi', 'izin', 'rencana', 'ditunda', 'tidak-diketahui', 'dibatalkan'],
    },
    potensi: {
      darat_gw: { nilai: 60.6, sumber_id: 'ruen', tingkat_bukti: 'resmi', ket: L('Potensi darat menurut RUEN (di atas 4 m/s pada 50 m).', 'Onshore potential per RUEN (above 4 m/s at 50 m).') },
      lepas_gw: { nilai: 94.2, sumber_id: 'etp1', tingkat_bukti: 'kajian', ket: L('Potensi lepas pantai yang dikutip kajian ETP (angka pemerintah).', 'Offshore potential quoted by the ETP study (government figure).') },
      lepas_wb_gw: { nilai: 277, sumber_id: 'katadata277', tingkat_bukti: 'media', ket: L('Estimasi Bank Dunia yang dikutip media; jauh di atas angka pemerintah dan tidak dijumlahkan dengan angka lain.', 'World Bank estimate quoted by media; far above the government figure and not added to other figures.') },
      terpasang_mw: [
        { nilai: 152.3, tahun: 2025, sumber_id: 'irena', tingkat_bukti: 'resmi', ket: L('IRENASTAT: angka utama; Sidrap 75 MW dan Tolo 72 MW plus turbin kecil.', 'IRENASTAT: headline figure; Sidrap 75 MW and Tolo 72 MW plus small turbines.') },
        { nilai: 151.5, tahun: 2025, sumber_id: 'chambers-2026', tingkat_bukti: 'media', ket: L('Panduan hukum yang menyebut sekitar 0,15 persen dari kapasitas nasional (cuplikan).', 'Legal guide citing about 0.15 percent of national capacity (excerpt).') },
      ],
      target: [
        { k: 'ruen', nilai_mw: 1800, tahun: 2025, sumber_id: 'ruen', tingkat_bukti: 'resmi' },
        { k: 'ruptl', nilai_mw: 7200, tahun: 2034, sumber_id: 'ruptl-faq', tingkat_bukti: 'resmi' },
        { k: 'g5', nilai_mw: 5000, tahun: 2030, sumber_id: 'target-5gw', tingkat_bukti: 'media' },
        { k: 'ruen50', nilai_mw: 28000, tahun: 2050, sumber_id: 'ruen', tingkat_bukti: 'resmi' },
      ],
      provinsi: prov, provinsi_sumber_id: 'etp1',
      atlas_sumber_id: 'global-wind-atlas',
      catatan_beda: L('Potensi dan target berbeda menurut sumber (RUEN, RUPTL, media); semua ditampilkan, tidak ada yang dipilih diam-diam.', 'Potential and targets differ by source (RUEN, RUPTL, media); all are shown, none chosen silently.'),
    },
    proyek: {
      unggulan: [
        { k: 'sidrap', proyek_id: 'pj_0006', kasus: 'sidrap', pemasok_org: ORG.sg, model: 'G114-2.5 MW', jumlah: 30, mw_unit: 2.5, menara_m: 80, bilah_m: 57, sumber_ids: ['esdm_sidrap', 'detik-sidrap', 'windtech-gamesa'] },
        { k: 'tolo', proyek_id: 'gem_wind_L100000901004', proyek_ganda_id: 'pj_0005', kasus: 'tolo', pemasok_org: ORG.sg, model: 'SWT-3.6-130', jumlah: 20, mw_unit: 3.6, menara_m: 133, bilah_m: 63, sumber_ids: ['esdm_tolo', 'siemens-tolo', 'adb_tolo'] },
        { k: 'tanah-laut', proyek_id: 'pj_0004', kasus: 'tanah-laut', pemasok_org: null, model: '', jumlah: null, mw_unit: null, menara_m: null, bilah_m: null, sumber_ids: ['li_tl', 'tl-tarif', 'bt_tl'] },
      ],
      lepas_pantai: { proyek_tercatat: 0, ket: L('Tidak ada proyek lepas pantai di basis proyek terpadu; potensinya baru kajian peta (ESMAP, Bank Dunia).', 'No offshore project exists in the integrated project base; the potential is only mapped (ESMAP, World Bank).'), sumber_id: 'esmap', tingkat_bukti: 'resmi' },
    },
    rantai: {
      komponen: KOMPONEN.map(([k, sub]) => ({ k, subsegmen: sub })),
      domestik: [
        { k: 'menara', org_id: ORG.kenertec, ket: L('Satu-satunya komponen utama yang dibuat di Indonesia, sebagian besar untuk ekspor.', 'The only major component made in Indonesia, mostly for export.'), sumber_id: 'kenertec', tingkat_bukti: 'media' },
        { k: 'bilah', org_id: null, ket: L('Belum ditemukan pabrik bilah di Indonesia; bilah Sidrap dan Tolo diimpor (57 m dan 63 m).', 'No blade factory found in Indonesia; Sidrap and Tolo blades were imported (57 m and 63 m).'), sumber_id: 'detik-sidrap', tingkat_bukti: 'media' },
        { k: 'turbin', org_id: null, ket: L('Nacelle, rotor, gearbox, dan generator masih impor menurut ETP (analisis rantai pasok).', 'Nacelle, rotor, gearbox and generator are still imported per ETP (supply chain analysis).'), sumber_id: 'etp2', tingkat_bukti: 'kajian' },
      ],
      unit_pemasok: [
        { proyek_id: 'pj_0006', org_pemasok: ORG.sg, unit: L('30 turbin G114-2.5 MW', '30 G114-2.5 MW turbines'), sumber_id: 'windtech-gamesa', tingkat_bukti: 'media' },
        { proyek_id: 'gem_wind_L100000901004', org_pemasok: ORG.sg, unit: L('20 turbin 3,6 MW (SWT-3.6-130)', '20 turbines of 3.6 MW (SWT-3.6-130)'), sumber_id: 'siemens-tolo', tingkat_bukti: 'resmi' },
      ],
    },
    biaya: {
      skenario,
      rumus: L('LCOE (sen/kWh) = capex x (CRF + opex%) / (87,6 x FK), CRF = r(1+r)^n / ((1+r)^n - 1). Hasil berlabel Estimasi/Hipotesis; bukan tarif PLN.', 'LCOE (cents/kWh) = capex x (CRF + opex%) / (87.6 x CF), CRF = r(1+r)^n / ((1+r)^n - 1). Results are labelled Estimate/Hypothesis; not a PLN tariff.'),
      tarif_kasus: [
        { k: 'sidrap', sen: 11, tahun: 2018, sumber_id: 'etp1', tingkat_bukti: 'kajian' },
        { k: 'tolo', sen: 11, tahun: 2019, sumber_id: 'etp1', tingkat_bukti: 'kajian' },
        { k: 'tanah-laut', sen: 5.5, tahun: 2022, sumber_id: 'tl-tarif', tingkat_bukti: 'media' },
      ],
      patokan_sumber_id: 'p112',
    },
    lelang: {
      tkdn: [
        { k: 'permen', teks: L('Permen ESDM 11/2024 dan Permenperin 34/2024 mengatur penggunaan produk dalam negeri di infrastruktur ketenagalistrikan; PLTB hanya disebut dalam daftar EBT, tanpa ambang per komponen yang bisa dibaca.', 'ESDM Reg. 11/2024 and Industry Reg. 34/2024 govern domestic products in power infrastructure; wind is only named in the renewables list, with no readable per-component threshold.'), sumber_id: 'tkdn-esdm11', tingkat_bukti: 'media' },
        { k: 'etp', teks: L('ETP memperingatkan TKDN yang terlalu dini dapat mengurangi pasokan dan bankability karena komponen utama belum ada pabriknya.', 'ETP warns that premature local content can cut supply and bankability because major components have no factory yet.'), sumber_id: 'etp2', tingkat_bukti: 'kajian' },
        { k: 'menara', teks: L('Menara buatan Kenertec memuat sekitar 30 sampai 40 persen bahan dalam negeri (klaim pemberitaan, bukan sertifikat TKDN).', 'Kenertec towers carry about 30 to 40 percent domestic material (press claim, not a TKDN certificate).'), sumber_id: 'kenertec', tingkat_bukti: 'media' },
      ],
    },
    logistik: {
      kasus: [
        { k: 'sidrap_pelabuhan', teks: L('Pelabuhan dimodifikasi karena kapasitas bongkar dan simpan tidak cukup; satu bilah butuh sekitar 10 jam dari pelabuhan ke tapak (topik bayu, kasus Sidrap).', 'The port was modified because offloading and storage capacity were insufficient; one blade took about 10 hours from port to site (wind topic, Sidrap case).'), sumber_id: 'etp1', tingkat_bukti: 'kajian' },
        { k: 'tolo_makassar', teks: L('Komponen Tolo diangkut lewat Pelabuhan Soekarno-Hatta, Makassar, ke lokasi di Jeneponto lewat medan sulit.', 'Tolo components were moved through Soekarno-Hatta Port, Makassar, to the Jeneponto site over difficult terrain.'), sumber_id: 'detik-sidrap', tingkat_bukti: 'media' },
        { k: 'dimensi', teks: L('Bilah 57 m (Sidrap) dan 63 m (Tolo), menara 80 m dan 133 m: dimensi menentukan rute darat, jembatan, dan tikungan.', 'Blades of 57 m (Sidrap) and 63 m (Tolo), towers of 80 m and 133 m: dimensions set road routes, bridges and bends.'), sumber_id: 'detik-sidrap', tingkat_bukti: 'media' },
      ],
    },
    kebijakan: {
      poin: [
        { k: 'ruptl', teks: L('RUPTL 2025-2034 menambah 69,5 GW; PLTB 7,2 GW (angka lain di media: 11 GW, belum direkonsiliasi).', 'RUPTL 2025-2034 adds 69.5 GW; wind 7.2 GW (another media figure: 11 GW, not reconciled).'), sumber_id: 'ruptl-faq', tingkat_bukti: 'resmi' },
        { k: 'ppa', teks: L('Permen ESDM 5/2025 memuat pedoman perjanjian jual beli tenaga listrik dari pembangkit EBT.', 'ESDM Reg. 5/2025 contains guidelines for power purchase agreements of renewable plants.'), sumber_id: 'chambers-2026', tingkat_bukti: 'media' },
        { k: 'izin', teks: L('Kewajiban lingkungan menurut kapasitas (AMDAL untuk 50 MW ke atas) dan pengukuran angin minimal setahun untuk tender PLN; kajian perizinan ETP tersedia.', 'Environmental obligations by capacity (EIA for 50 MW and above) and at least one year of wind measurement for PLN tenders; an ETP permitting assessment is available.'), sumber_id: 'etp-izin', tingkat_bukti: 'kajian' },
        { k: 'ruu', teks: L('RUU EBET masih dibahas DPR; METI meminta pengesahan segera.', 'The RUU EBET is still in DPR deliberation; METI asks for prompt passage.'), sumber_id: 'konsul', tingkat_bukti: 'media' },
      ],
    },
    isu_baru: [
      { k: 'jurang', status: 'aktif', teks: L('Jurang target dan realisasi: terpasang sekitar 152 MW, tidak bertambah sejak 2019, sementara RUPTL 2025-2034 menargetkan 7,2 GW.', 'Target versus delivery gap: about 152 MW installed, unchanged since 2019, while RUPTL 2025-2034 targets 7.2 GW.'), sumber_ids: ['irena', 'ruptl-faq'], tingkat_bukti: 'resmi' },
      { k: 'tarif', status: 'aktif', teks: L('Tarif turun dari sekitar 11 sen (Sidrap, Tolo) ke 5,5 sen (Tanah Laut), sementara proyek terakhir itu justru dibayangi terminasi.', 'Tariffs fell from about 11 cents (Sidrap, Tolo) to 5.5 cents (Tanah Laut), yet the latter is now shadowed by termination.'), sumber_ids: ['etp1', 'tl-tarif', 'bt_tl'], tingkat_bukti: 'media' },
      { k: 'tkdn', status: 'aktif', teks: L('TKDN dini versus bankability: hanya menara yang dibuat di dalam negeri.', 'Early local content versus bankability: only towers are made domestically.'), sumber_ids: ['etp2', 'kenertec'], tingkat_bukti: 'kajian' },
      { k: 'logistik', status: 'aktif', teks: L('Logistik bilah panjang: pelabuhan harus dimodifikasi dan jalan menuju tapak sulit.', 'Long-blade logistics: ports had to be modified and site access roads are difficult.'), sumber_ids: ['etp1', 'detik-sidrap'], tingkat_bukti: 'kajian' },
      { k: 'lepas', status: 'info', teks: L('Lepas pantai belum punya proyek, regulasi khusus, atau tarif patokan (Perpres 112/2022 tidak mengatur laut).', 'Offshore has no project, dedicated regulation or reference tariff (Perpres 112/2022 does not cover marine).'), sumber_ids: ['esmap', 'p112'], tingkat_bukti: 'resmi' },
    ],
    pemain,
    celah: [
      'Persentase TKDN minimum per komponen PLTB (bilah, menara, nacelle) tidak ditemukan di sumber yang boleh dibaca; tkdn_produk.json tidak memuat produk turbin angin.',
      'Pelabuhan bongkar bilah Sidrap tidak disebut sumber; hanya jalur Tolo lewat Pelabuhan Soekarno-Hatta Makassar dan catatan modifikasi pelabuhan yang tidak dinamai.',
      'Kapasitas produksi tahunan pabrik menara Kenertec tidak disebut sumber.',
      'Pabrik bilah, nacelle, dan perakitan turbin di Indonesia tidak ditemukan.',
      'Pemenang paket lelang PLTB Sulawesi Bagian Selatan 2025 (60 MW dan 70 MW) belum ditemukan; portal pengadaan PLN berCAPTCHA tidak dibaca.',
      'Status terbaru PLTB Tanah Laut (terminasi atau financial close) belum terverifikasi; sumber yang dibaca berhenti di bayang-bayang terminasi Juli 2025.',
      'Capex PLTB Indonesia tidak ada di biaya_bangun.json; LCOE dihitung dari capex global IRENA 2024 dan Sidrap (USD 2 juta/MW, EST), asumsi biaya modal dan opex berlabel Hipotesis.',
      'Tidak ada regulasi khusus lepas pantai, proyek lepas pantai, atau tarif patokan lepas pantai yang tercatat; potensi lepas pantai berbeda jauh (94,2 GW versus 277 GW).',
      'Potensi angin per kabupaten/kota dari Global Wind Atlas adalah satu titik pusat wilayah (rata-rata jendela 5x5 piksel), bukan statistik zonal; bukan studi kelayakan.',
      'Proyek terpadu memuat Tolo dua kali (pj_0005 Jeneponto, status tidak diketahui, dan Tolo GEM, beroperasi); modul tidak menjumlahkan keduanya.',
      'Tarif PLTB Sidrap dan Tolo (sekitar 11 sen) berasal dari kajian ETP, bukan dokumen PPA; angka 5,5 sen Tanah Laut dari ringkasan pencarian atas pemberitaan (teks penuh Bisnis.com menjawab 403 sehingga panen berhenti).',
    ],
  };
}

/** Pemeriksa: id rujukan hidup di berkas aslinya, sumber unik, bukti dikenal, URL https atau berkas lokal. */
export function periksa(d) {
  const ids = (rel, f = (x) => x.baris) => new Set(f(j(rel)).map((x) => x.id));
  const pt = ids('public/data/proyek_terpadu.json'), ru = ids('public/data/ruptl.json'), isu = ids('public/data/isu.json'), reg = ids('public/data/regulasi.json'), org = ids('public/data/organisasi.json');
  const lel = new Set(j('public/data/lelang.json').putaran.map((x) => x.id));
  const pel = new Set(j('public/data/global/logistik.json').pelabuhan.map((x) => x.id));
  const pl = j('public/data/global/pemasok_lain.json'), tb = j('public/data/topik/bayu.json');
  const kas = new Set([...tb.bab['39'].butir, ...tb.bab['40'].butir].map((x) => x.id));
  const must = (set, arr, nama) => { for (const i of arr) if (!set.has(i)) throw new Error(`${nama} tidak ada: ${i}`); };
  must(pt, d.rujukan.proyek_ids, 'proyek'); must(ru, d.rujukan.ruptl_ids, 'ruptl'); must(lel, d.rujukan.lelang_ids, 'lelang'); must(reg, d.rujukan.regulasi_ids, 'regulasi'); must(isu, d.rujukan.isu_ids, 'isu');
  must(kas, [...d.rujukan.kasus_sukses, ...d.rujukan.kasus_gagal], 'kasus'); must(pel, d.rujukan.pelabuhan_ids, 'pelabuhan');
  must(org, d.pemain.map((p) => p.org_id), 'org'); must(pt, d.pemain.flatMap((p) => p.proyek_ids), 'proyek pemain');
  must(org, d.rantai.unit_pemasok.map((u) => u.org_pemasok), 'org pemasok'); must(pt, d.rantai.unit_pemasok.map((u) => u.proyek_id), 'proyek pemasok');
  must(org, d.rantai.domestik.map((x) => x.org_id).filter(Boolean), 'org domestik'); must(pt, d.proyek.unggulan.map((u) => u.proyek_id), 'proyek unggulan');
  if (!pl.rantai.bayu) throw new Error('rantai bayu tiada di pemasok_lain');
  const subAda = new Set(pl.baris.filter((b) => (b.segmen || []).includes('bayu')).flatMap((b) => b.subsegmen || []));
  for (const k of d.rantai.komponen) if (!k.subsegmen.some((s) => subAda.has(s))) throw new Error('subsegmen tak ada pemasoknya: ' + k.k);
  const sid = new Set(d.sumber.map((s) => s.id));
  if (sid.size !== d.sumber.length) throw new Error('id sumber ganda');
  for (const s of d.sumber) { if (!/^https:\/\/|^\/data\//.test(s.url)) throw new Error('url ' + s.id); if (!['resmi', 'media', 'kajian', 'via-pihak-ketiga', 'editorial'].includes(s.tingkat_bukti)) throw new Error('bukti ' + s.id); if (/antaranews/.test(s.url)) throw new Error('Antara dilarang ' + s.id); }
  const pakai = [d.potensi.darat_gw, d.potensi.lepas_gw, d.potensi.lepas_wb_gw, ...d.potensi.terpasang_mw, ...d.potensi.target, d.proyek.lepas_pantai, ...d.rantai.domestik, ...d.rantai.unit_pemasok, ...d.biaya.tarif_kasus, ...d.lelang.tkdn, ...d.logistik.kasus, ...d.kebijakan.poin, ...d.pemain.flatMap((p) => p.fakta)];
  for (const x of pakai) if (x.sumber_id && !sid.has(x.sumber_id)) throw new Error('sumber_id tak dikenal: ' + x.sumber_id);
  for (const x of [...d.proyek.unggulan, ...d.isu_baru]) for (const s of x.sumber_ids || []) if (!sid.has(s)) throw new Error('sumber_ids tak dikenal: ' + s);
  if (d.potensi.provinsi.length !== 38) throw new Error('provinsi harus 38');
  return { sumber: d.sumber.length, proyek: d.rujukan.proyek_ids.length, ruptl: d.rujukan.ruptl_ids.length, pemain: d.pemain.length, celah: d.celah.length };
}

async function cekUrl() {
  const { ambil } = await import('../pipa/_panen_sopan.mjs');
  for (const s of sumberGabung().filter((x) => x.url.startsWith('https://'))) { try { await ambil(s.url, { method: 'HEAD' }); console.log('OK ', s.id); } catch (e) { console.log('GAGAL', s.id, e.message); if (/403|429/.test(e.message)) break; } }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv[2];
  if (a === '--bangun') { const d = bangun(); console.log(periksa(d)); fs.writeFileSync(path.join(ROOT, 'public/data/angin.json'), JSON.stringify(d, null, 1) + '\n'); }
  else if (a === '--selftest') console.log(periksa(bangun()));
  else if (a === '--cek-url') await cekUrl();
  else console.log('pakai: --bangun | --selftest | --cek-url');
}
