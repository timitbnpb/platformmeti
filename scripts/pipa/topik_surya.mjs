// Naskah topik Surya (kerangka 42 bab) mengikuti docs/perencanaan/TOPIK-SKEMA.md.
// Menyusun public/data/topik/surya.json dari data repo (dihitung, bukan diketik) + sumber publik bertanggal.
// Pakai: node scripts/pipa/topik_surya.mjs [--selftest]
// Aturan: tiap angka bersumber (kunci peta sumber); analisis sendiri berlabel "analisis METI (Hipotesis)"; bab tanpa data dikosongkan.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const akar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TGL = '2026-11-08';
const baca = (p) => JSON.parse(fs.readFileSync(path.join(akar, p), 'utf8'));
const T = (id, en) => ({ id, en });
const S = (judul, penerbit, url, tanggal, bukti, lisensi) => ({ judul, penerbit, url, tanggal, tahun: Number(tanggal.slice(0, 4)), bukti, ...(lisensi ? { lisensi } : {}) });
const HIP = 'Analisis METI (Hipotesis): ';
const HIPE = 'METI analysis (Hypothesis): ';

export const SUMBER = {
  ed: { judul: 'Ringkasan editorial METI (penjelasan umum; bukan kutipan pasal)', penerbit: 'METI', tanggal: TGL, tahun: 2026, bukti: 'editorial' },
  kap: S('IRENA, kapasitas terpasang surya Indonesia (diolah repo: public/data/kapasitas_tren.json)', 'IRENA', 'https://www.irena.org/Data', TGL, 'resmi', 'IRENA data terbuka'),
  gsa: S('Global Solar Atlas 2.0, titik ibu kota provinsi (public/data/potensi_atlas.json)', 'World Bank Group / ESMAP, Solargis', 'https://globalsolaratlas.info/', TGL, 'via-pihak-ketiga', 'CC BY 4.0'),
  lcoe: S('IRENA LCOE dan harga modul via Our World in Data (public/data/biaya_listrik.json)', 'IRENA via Our World in Data', 'https://ourworldindata.org/grapher/levelized-cost-of-energy', TGL, 'via-pihak-ketiga', 'CC BY 4.0'),
  irena24: S('IRENA, Renewable Power Generation Costs in 2024 (angka lewat ringkasan pers: LCOE surya USD 0,043 per kWh; biaya terpasang USD 691 per kW)', 'IRENA', 'https://www.irena.org/Publications/2025/Jun/Renewable-Power-Generation-Costs-in-2024', '2025-06-01', 'resmi'),
  rantai: S('DJEBTKE ESDM, Daftar Pabrikan Modul Surya di Indonesia (public/data/rantai_plts.json)', 'DJEBTKE ESDM', 'https://ebtke.esdm.go.id/', '2026-11-07', 'resmi'),
  owid: S('Our World in Data energy-data, memuat Ember Yearly Electricity Data (public/data/asean_energi.json)', 'Ember via Our World in Data', 'https://github.com/owid/energy-data', TGL, 'via-pihak-ketiga', 'CC BY 4.0'),
  irenaasean: S('IRENASTAT kapasitas energi terbarukan ASEAN (public/data/asean.json)', 'IRENA', 'https://pxweb.irena.org/pxweb/en/IRENASTAT/IRENASTAT__Power%20Capacity%20and%20Generation/', TGL, 'resmi', 'IRENA data terbuka'),
  kebijakan: S('Target KEN, RUKN, RUPTL 2025-2034 (public/data/kebijakan_info.json; teks PP 40/2025, Kepmen 85.K/2025, RUPTL)', 'Pemerintah RI, ESDM, PLN', 'https://peraturan.bpk.go.id/Details/328789', TGL, 'resmi'),
  ruptl: S('RUPTL PT PLN (Persero) 2025-2034', 'PLN, ESDM', 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf', '2025-05-01', 'resmi'),
  hitung: S('Kalkulator PLTS atap METI: tarif PLN Q3 2026 dan asumsi berlabel Hipotesis (public/data/plts_atap_hitung.json)', 'METI, tarif PLN via Antara', 'https://www.antaranews.com/berita/5719805', '2026-09-30', 'media'),
  permen2: S('Permen ESDM 2/2024 tentang PLTS Atap (naskah BPK)', 'BPK JDIH', 'https://peraturan.bpk.go.id/Details/288519', '2024-01-29', 'resmi'),
  bisnis2: S('Kementerian ESDM terbitkan aturan PLTS atap: ekspor tidak dihitung, kuota Pasal 7 sampai 11, transisi 10 tahun Pasal 47 (ringkasan pers)', 'Kontan, Bisnis, detik', 'https://industri.kontan.co.id/news/kementerian-esdm-terbitkan-aturan-terkait-plts-atap', '2024-02-23', 'media'),
  iesr2: S('IESR sayangkan revisi Permen PLTS atap condong berpihak ke PLN', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20240223/44/1743527/iesr-sayangkan-revisi-permen-plts-atap-condong-berpihak-ke-pln', '2024-02-23', 'media'),
  perpres112: S('Perpres 112/2022 tentang Percepatan Pengembangan Energi Terbarukan untuk Penyediaan Tenaga Listrik', 'BPK JDIH', 'https://peraturan.bpk.go.id/Details/225308', '2022-09-13', 'resmi'),
  perpres112tarif: S('Perpres 112/2022: batas harga PLTS (ringkasan Databoks Katadata, USD 5,63 sen per kWh; tabel berjenjang perlu dicek di naskah)', 'Katadata Databoks', 'https://databoks.katadata.co.id/en/energy/statistics/35f260c297516a1/indonesias-renewable-energy-electricity-prices-cheap-or-expensive', TGL, 'media'),
  perpres112rev: S('Pemerintah mau tetapkan batas atas bawah tarif listrik EBT (revisi Perpres 112/2022)', 'CNBC Indonesia', 'https://www.cnbcindonesia.com/news/20260205161013-4-708547/siap-siap-pemerintah-mau-tetapkan-batas-atas-bawah-tarif-listrik-ebt', '2026-02-05', 'media'),
  tkdn: S('Permenperin 34/2024 tentang Tata Cara Penghitungan Nilai TKDN Produk Modul Surya', 'BPK JDIH', 'https://peraturan.bpk.go.id/Details/296131', '2024-07-25', 'resmi'),
  tkdn6: S('Permenperin 6/2022 tentang Spesifikasi, Peta Jalan, dan Penghitungan TKDN (PLTS)', 'BPK JDIH', 'https://peraturan.bpk.go.id/Details/227541', '2022-03-11', 'resmi'),
  regul: S('Basis regulasi METI (public/data/regulasi.json, naskah BPK)', 'BPK JDIH, METI', 'https://peraturan.bpk.go.id/', '2026-11-07', 'resmi'),
  tarifas: S('Bea masuk imbalan AS atas panel surya Indonesia 86 sampai 143 persen (public/data/rantai_plts.json)', 'ANTARA', 'https://www.antaranews.com/berita/5438654/panel-surya-ri-hingga-india-dikenakan-tarif-ratusan-persen-oleh-as', '2026-02-26', 'media'),
  plts100: S('Program PLTS 100 GWp (public/data/program.json; laporan Menteri ESDM kepada Presiden)', 'ESDM, METI', 'https://ebtke.esdm.go.id/', '2026-08-25', 'resmi'),
  itrpv: S('ITRPV: TOPCon melampaui PERC pada 2024 (ringkasan edisi 16 dan 17)', 'VDMA ITRPV via pv Europe', 'https://www.pveurope.eu/solar-modules/itrpv-topcon-technology-overcomes-perc-2024', '2025-04-15', 'kajian'),
  modul703: S('Pengapalan modul surya global 703 GW pada 2024', 'pv magazine', 'https://www.pv-magazine.com/2025/04/15/global-solar-module-shipments-hit-703-gw-in-2024/', '2025-04-15', 'media'),
  nrel: S('NREL, Best Research-Cell Efficiencies (revisi April 2024: tandem perovskit-silikon 33,9 persen)', 'NREL', 'https://www.nrel.gov/pv/assets/pdfs/best-research-cell-efficiencies.pdf', '2024-04-04', 'resmi'),
  masdar: S('Masdar: President of Indonesia inaugurates floating solar plant (9 Nov 2023)', 'Masdar', 'https://masdar.ae/en/news/newsroom/president-of-indonesia-inaugurates-floating-solar-plant', '2023-11-09', 'media'),
  cirata: S('Media Indonesia: kepemilikan PLN NR 51% dan Masdar 49%, PPA Januari 2020, ekspansi 500 MWac (Antara, Republika, Kompas)', 'Antara dan media', 'https://www.antaranews.com/berita/5350241/masdar-uae-harap-ekspansi-plts-cirata-capai-kemajuan-konkret-tahun-ini', TGL, 'media'),
  ikn: S('PLTS IKN 50 MW, Nusantara Sembcorp: PLN NR 51% Sembcorp 49%, USD 64 juta, BESS 14,2 MWh, tahap 1 sinkron 22 Feb 2024, diresmikan 20 Jan 2025', 'Listrik Indonesia, Katadata, Kontan, Bisnis', 'https://listrikindonesia.com/detail/15447/plts-50-mw-resmi-beroperasi-di-ikn', '2025-01-20', 'media'),
  benban: S('Benban Solar Park (ringkasan Wikipedia; rujukan pembiayaan IFC, EBRD, MIGA)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Benban_Solar_Park', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  ebrd: S('EBRD: Scaling up deployment of renewables, Egypt (Benban: USD 1,1 miliar di 16 PLTS 750 MW; lelang Kom Ombo USD 0,0247 per kWh)', 'EBRD', 'https://www.ebrd.com/home/who-we-are/ebrd-values/ebrd-environmental-social-sustainability/EBRD-green/green-case-studies/scaling-up-deployment-of-renewables-egypt.html', TGL, 'resmi'),
  cc: S('Clifford Chance, Egypt solar feed-in tariff round 2 (FiT putaran 1 USD 14,34 sen, putaran 2 USD 8,4 sen)', 'Clifford Chance', 'https://financialmarketstoolkit.cliffordchance.com/content/dam/cliffordchance/briefings/2018/02/egypt-solar-feedin-tariff-round-2.pdf', '2018-02-01', 'kajian'),
  dhafra: S('EDF, JinkoPower and partners close financing for 2GW solar project in Abu Dhabi', 'PV Tech', 'https://www.pv-tech.org/edf-jinkopower-and-partners-close-financing-for-2gw-solar-project-in-abu-dhabi', '2020-12-23', 'media'),
  dhafra2: S('Masdar, Al Dhafra Solar PV factsheet', 'Masdar', 'https://masdar.ae/-/media/corporate-revamp/projects/downloads/al-dhafra-solar-pv/al-dhafra-factsheet-en.pdf', TGL, 'media'),
  bhadla: S('Yet another India solar tariff record of 2.44 rupees in Rajasthan', 'PV Tech', 'https://www.pv-tech.org/yet-another-india-solar-tariff-record-of-2-44-rupees-in-rajasthan/', '2017-05-01', 'media'),
  bhadla2: S('Mercom India, Bhadla Solar Park', 'Mercom India', 'https://www.mercomindia.com/tag/bhadla-solar-park', TGL, 'media'),
  gea4: S('Philippines renewables auction awards 9.4 GW, short of 10.6 GW goal (GEA-4); angka akhir 10.195 MW atau 96 persen target', 'pv magazine, BusinessWorld', 'https://www.pv-magazine.com/2025/09/05/philippines-renewable-auction-awards-9-4-gw-short-of-10-6-gw-goal/', '2025-09-05', 'media'),
  gea4b: S('Fourth round of Green Energy Auction awards top 10,159 MW, 96% of target', 'BusinessWorld', 'https://www.bworldonline.com/?p=710655', '2025-11-07', 'media'),
  detik2016: S('Banyak PLTS rusak, ESDM: SDM untuk mengelola kurang siap (3 Feb 2016)', 'detikFinance', 'https://finance.detik.com/energi/d-3134143/banyak-plts-rusak-esdm-sdm-untuk-mengelola-kurang-siap', '2016-02-03', 'media'),
  detikbpk: S('BPK temukan pembangkit EBT Rp467 M kondisinya rusak (12 Des 2017)', 'detikFinance', 'https://finance.detik.com/energi/d-3766759/bpk-temukan-pembangkit-ebt-rp-467-m-kondisinya-rusak', '2017-12-12', 'media'),
  gajah: S('Padamnya listrik tenaga surya di Gajah Makmur (3 Okt 2020)', 'Mongabay Indonesia', 'https://mongabay.co.id/2020/10/03/padamnya-listrik-tenaga-surya-di-gajah-makmur/', '2020-10-03', 'media'),
  kpk: S('KPK wanti-wanti program PLTS 100 GWp, ingatkan praktik korupsi proyek serupa', 'Katadata', 'https://katadata.co.id/ekonomi-hijau/investasi-hijau/6ae841b1b79c8/kpk-sorot-proyek-plts-100-gwp-ingatkan-praktik-korupsi-proyek-serupa', '2026-11-02', 'media'),
  kubu: S('PLTS Rp26 miliar di Karangasem terbengkalai (31 Agu 2026)', 'Listrik Indonesia', 'https://listrikindonesia.com/detail/21049/plts-rp26-miliar-di-karangasem-terbengkalai-panel-surya-kini-ditelan-semak', '2026-08-31', 'media'),
  towea: S('Warga di Towea Muna keluhkan sudah 5 tahun PLTS tidak berfungsi normal', 'Antara Sultra', 'https://sultra.antaranews.com/berita/492426/warga-di-towea-muna-keluhkan-sudah-5-tahun-plts-tidak-berfungsi-normal', TGL, 'media'),
  karimun: S('Hampir semua PLTS di Parang Karimunjawa rusak sejak 2019', 'detikJateng', 'https://www.detik.com/jateng/berita/d-5979817/miris-hampir-semua-plts-di-parang-karimunjawa-rusak-sejak-2019', TGL, 'media'),
  iesrkop: S('Proyek PLTS untuk Koperasi Merah Putih, IESR ingatkan risiko mangkrak (3 Sep 2025)', 'Kompas.com Lestari', 'https://lestari.kompas.com/read/2025/09/03/081400186/proyek-plts-untuk-koperasi-merah-putih-iesr-ingatkan-risiko-mangkrak', '2025-09-03', 'media'),
  adbsumba: S('ADB support for Sumba transformation to 100% renewable energy island (21 Mei 2013)', 'Asian Development Bank', 'https://www.adb.org/news/adb-support-sumbas-transformation-100-renewable-energy-island', '2013-05-21', 'resmi'),
  mongsumba: S('Program listrik energi terbarukan Sumba, bagaimana perkembangannya? (10 Nov 2017)', 'Mongabay Indonesia', 'https://mongabay.co.id/2017/11/10/program-listrik-energi-terbarukan-sumba-bagaimana-perkembangannya/', '2017-11-10', 'media'),
  lelang17: S('Kesepakatan jual beli listrik EBT dengan PLN, 11 perusahaan mundur (4 Agu 2017)', 'Mongabay Indonesia', 'https://mongabay.co.id/2017/08/04/kesepakatan-jual-beli-listrik-energi-terbarukan-dengan-pt-pln-11-perusahaan-mundur/', '2017-08-04', 'media'),
  lelang17b: S('No companies interested in three PLN projects last year (23 Jan 2017)', 'The Jakarta Post', 'https://www.thejakartapost.com/news/2017/01/23/no-companies-interested-in-three-pln-projects-last-year.html', '2017-01-23', 'media'),
  samindo: S('Samindo Resources (MYOH) batal ikut proyek PLTS Bali (24 Sep 2019)', 'Bisnis.com', 'https://market.bisnis.com/read/20190924/192/1151838/samindo-resources-myoh-batal-ikut-proyek-plts-bali', '2019-09-24', 'media'),
  lelang23: S('ESDM soroti lambannya lelang proyek PLTS PLN (14 Nov 2023)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20231114/44/1714316/esdm-soroti-lambannya-lelang-proyek-plts-pln', '2023-11-14', 'media'),
  vnwiki: S('Solar power in Vietnam', 'Wikipedia', 'https://en.wikipedia.org/wiki/Solar_power_in_Vietnam', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  vnallens: S('Allens, Renewables in Vietnam 2022', 'Allens', 'https://www.allens.com.au/globalassets/pdfs/insights/asia/allens-vietnam-renewables-in-vietnam-2022.pdf', '2022-01-01', 'kajian'),
  vnvir: S('FiTs now at risk through retroactive cuts', 'Vietnam Investment Review', 'https://vir.com.vn/fits-now-at-risk-through-retroactive-cuts-131718.html', '2025-07-01', 'media'),
  eswiki: S('Solar power in Spain', 'Wikipedia', 'https://en.wikipedia.org/wiki/Solar_power_in_Spain', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  eiser: S('Spain loses its first renewable energy case in international courts (Eiser, 4 Mei 2017)', 'pv magazine', 'https://www.pv-magazine.com/2017/05/05/spain-loses-its-first-renewable-energy-case-in-international-courts/', '2017-05-05', 'media'),
  nextera: S('Spain ordered to pay EUR290m-plus over subsidy u-turn (6 Jun 2019)', 'PV Tech', 'https://www.pv-tech.org/spain-ordered-to-pay-290m-plus-over-subsidy-u-turn', '2019-06-06', 'media'),
  direktori: S('Direktori METI: organisasi, proyek, inovasi (irisan otomatis public/data/topik/dasar-surya.json)', 'METI', 'https://platformmeti.timitbnpb.workers.dev', '2026-11-07', 'via-pihak-ketiga'),
  pendanaan: S('Basis pendanaan METI (public/data/pendanaan.json, 338 skema dan proyek pendana)', 'METI, ADB, World Bank, AIIB dan lain-lain', 'https://www.adb.org/projects', '2026-11-08', 'via-pihak-ketiga'),
};

function dariRepo() {
  const kap = baca('public/data/kapasitas_tren.json').baris.filter((r) => r.taksonomi === 'surya').sort((a, b) => a.tahun - b.tahun);
  const pot = baca('public/data/potensi_atlas.json').baris.slice().sort((a, b) => b.pvout_kwh_per_kwp_tahun - a.pvout_kwh_per_kwp_tahun);
  const bl = baca('public/data/biaya_listrik.json');
  const modul = bl.modul.filter((m) => m.tahun >= 2000);
  const lc = (n, t) => bl.lcoe.find((x) => x.negara === n && x.teknologi === 'surya' && x.tahun === t)?.sen_usd_kwh;
  const rantai = baca('public/data/rantai_plts.json').ringkas;
  const asean = baca('public/data/asean_energi.json').baris;
  const asean2 = Object.fromEntries(baca('public/data/asean.json').baris.map((r) => [r.iso3, r]));
  const hit = baca('public/data/plts_atap_hitung.json');
  const keb = baca('public/data/kebijakan_info.json');
  const pend = baca('public/data/pendanaan.json');
  return { kap, pot, modul, lc, rantai, asean, asean2, hit, keb, pend };
}

const nama = { 'Viet Nam': 'Vietnam', 'Lao PDR': 'Laos', 'Brunei Darussalam': 'Brunei', Philippines: 'Filipina', Thailand: 'Thailand', Malaysia: 'Malaysia', Singapore: 'Singapura', Cambodia: 'Kamboja', Myanmar: 'Myanmar', Indonesia: 'Indonesia' };

export function susun() {
  const r = dariRepo();
  const rf = (n) => Math.round(n * 100) / 100;
  const k25 = r.kap.at(-1), k12 = r.kap.find((x) => x.tahun === 2012), k24 = r.kap.find((x) => x.tahun === 2024);
  const modul = Object.fromEntries(r.modul.map((m) => [m.tahun, m.usd_per_w]));
  const idn = r.asean.find((x) => x.iso3 === 'IDN');
  const vn = r.asean.find((x) => x.iso3 === 'VNM');
  const bab = {};
  const sm = (...k) => k;

  const kunci = [
    { label: T('Kapasitas surya terpasang Indonesia', 'Indonesia installed solar capacity'), nilai: k25.kapasitas_mw, d: 0, satuan: T('MW', 'MW'), sumber: 'kap', est: false },
    { label: T('Porsi surya dalam listrik Indonesia (2024)', 'Solar share of Indonesia electricity (2024)'), nilai: idn.bauran_listrik_persen.surya.nilai, d: 2, satuan: T('persen', 'percent'), sumber: 'owid', est: false },
    { label: T('Harga modul surya global (2025, USD 2025)', 'Global solar module price (2025, USD 2025)'), nilai: modul[2025], d: 2, satuan: T('USD per W', 'USD per W'), sumber: 'lcoe', est: false },
    { label: T('Kapasitas pabrikan modul di Indonesia', 'Module factory capacity in Indonesia'), nilai: r.rantai.total_mwp, d: 0, satuan: T('MWp per tahun', 'MWp per year'), sumber: 'rantai', est: false },
    { label: T('Target program PLTS 100 GWp', 'PLTS 100 GWp programme target'), nilai: 100, d: 0, satuan: T('GWp', 'GWp'), sumber: 'plts100', est: false },
  ];

  // A
  bab['2'] = { tipe: 'faq', sumber: sm('ed', 'permen2', 'bisnis2', 'rantai'), butir: [
    { t: T('Berapa kapasitas surya Indonesia?', 'How much solar capacity does Indonesia have?'), j: T(`${k25.kapasitas_mw} MW pada ${k25.tahun} menurut IRENA, naik dari ${k12.kapasitas_mw} MW pada ${k12.tahun}.`, `${k25.kapasitas_mw} MW in ${k25.tahun} per IRENA, up from ${k12.kapasitas_mw} MW in ${k12.tahun}.`) },
    { t: T('Apa bedanya MWp dan MWac?', 'What is the difference between MWp and MWac?'), j: T('MWp adalah kapasitas puncak panel (arus searah); MWac adalah daya keluaran inverter ke jaringan. Cirata 192 MWp setara 145 MWac.', 'MWp is peak panel capacity (DC); MWac is inverter output to the grid. Cirata 192 MWp equals 145 MWac.') },
    { t: T('Apakah listrik berlebih dari PLTS atap dibayar PLN?', 'Does PLN pay for surplus rooftop solar power?'), j: T('Tidak. Permen ESDM 2/2024 menghapus skema ekspor-impor; energi yang masuk ke jaringan tidak dihitung dalam tagihan. Pengguna lama boleh melanjutkan skema lama sampai 10 tahun (Pasal 47, menurut ringkasan pers).', 'No. Energy Ministry Regulation 2/2024 removed the export-import scheme; energy fed to the grid is not counted in bills. Existing users may keep the old scheme for 10 years (Article 47, per press summaries).') },
    { t: T('Apakah ada kuota PLTS atap?', 'Is there a rooftop solar quota?'), j: T('Ya. Pemegang IUPTLU menyusun kuota per sistem ketenagalistrikan untuk lima tahun dan mengevaluasinya tiap tahun (Pasal 7 sampai 11, menurut ringkasan pers).', 'Yes. Licensed utilities set quotas per power system for five years, evaluated annually (Articles 7 to 11, per press summaries).') },
    { t: T('Berapa harga modul surya sekarang?', 'How much do solar modules cost now?'), j: T(`Sekitar ${modul[2025]} USD per W pada 2025, dari ${modul[2010]} pada 2010 (USD 2025).`, `About ${modul[2025]} USD per W in 2025, from ${modul[2010]} in 2010 (USD 2025).`) },
    { t: T('Daerah mana paling cerah?', 'Which region is sunniest?'), j: T(`Menurut Global Solar Atlas, titik ibu kota ${r.pot[0].provinsi} tertinggi (${r.pot[0].pvout_kwh_per_kwp_tahun} kWh per kWp per tahun) dan ${r.pot.at(-1).provinsi} terendah (${r.pot.at(-1).pvout_kwh_per_kwp_tahun}).`, `Per Global Solar Atlas, the ${r.pot[0].provinsi} capital point is highest (${r.pot[0].pvout_kwh_per_kwp_tahun} kWh per kWp per year) and ${r.pot.at(-1).provinsi} lowest (${r.pot.at(-1).pvout_kwh_per_kwp_tahun}).`) },
    { t: T('Berapa pabrikan modul surya di Indonesia?', 'How many solar module factories are in Indonesia?'), j: T(`${r.rantai.pabrikan} pabrikan dengan total ${r.rantai.total_mwp} MWp per tahun; ${r.rantai.lokal_mwp} MWp untuk pasar lokal dan ${r.rantai.ekspor_mwp} MWp untuk ekspor (DJEBTKE).`, `${r.rantai.pabrikan} factories with ${r.rantai.total_mwp} MWp per year in total; ${r.rantai.lokal_mwp} MWp domestic and ${r.rantai.ekspor_mwp} MWp export (DJEBTKE).`) },
    { t: T('Kenapa banyak PLTS desa mati?', 'Why do many village solar plants die?'), j: T('Sumber menyebut pengelola belum siap, alih aset ke daerah tersendat, dan tak ada anggaran pemeliharaan. Lihat bab 40.', 'Sources cite unprepared operators, stalled asset transfers and no maintenance budget. See chapter 40.') },
  ] };
  bab['3'] = { tipe: 'glosarium', sumber: sm('ed'), butir: [
    ['PLTS', 'Pembangkit Listrik Tenaga Surya.', 'Solar power plant.'], ['PLTS atap', 'PLTS di atap bangunan, tersambung jaringan PLN atau mandiri.', 'Rooftop solar connected to the PLN grid or off-grid.'],
    ['MWp / kWp', 'Daya puncak panel pada kondisi uji standar.', 'Peak panel power at standard test conditions.'], ['MWac', 'Daya keluaran inverter ke jaringan.', 'Inverter output power to the grid.'],
    ['PVOUT', 'Produksi listrik tahunan per kWp terpasang (kWh per kWp per tahun) dari model Global Solar Atlas.', 'Annual electricity yield per installed kWp (kWh per kWp per year) from the Global Solar Atlas model.'],
    ['GHI', 'Radiasi matahari global horizontal (kWh per m2 per tahun).', 'Global horizontal irradiation (kWh per m2 per year).'], ['Faktor kapasitas', 'Produksi aktual dibagi produksi bila beroperasi penuh sepanjang tahun.', 'Actual output divided by output at full power all year.'],
    ['LCOE', 'Biaya listrik rata-rata sepanjang umur pembangkit (levelized cost of electricity).', 'Average cost of electricity over a plant life (levelized cost of electricity).'], ['PPA', 'Perjanjian jual beli tenaga listrik.', 'Power purchase agreement.'],
    ['IPP', 'Pengembang listrik swasta.', 'Independent power producer.'], ['FiT', 'Feed-in tariff, tarif tetap per kWh yang dijamin.', 'Feed-in tariff, a guaranteed fixed price per kWh.'],
    ['TKDN', 'Tingkat Komponen Dalam Negeri.', 'Local content level.'], ['RUPTL', 'Rencana Usaha Penyediaan Tenaga Listrik PLN.', 'PLN electricity supply business plan.'], ['RUKN', 'Rencana Umum Ketenagalistrikan Nasional.', 'National general electricity plan.'],
    ['BESS', 'Sistem penyimpanan energi baterai.', 'Battery energy storage system.'], ['Kurtailmen', 'Pembatasan produksi pembangkit karena jaringan atau permintaan tidak menyerap.', 'Forced reduction of plant output because the grid or demand cannot absorb it.'],
    ['IUPTLU', 'Izin Usaha Penyediaan Tenaga Listrik untuk Kepentingan Umum (misalnya PLN).', 'Electricity supply business licence for public interest (for example PLN).'], ['PLTS terapung', 'PLTS di permukaan waduk atau danau.', 'Solar on a reservoir or lake surface.'], ['Hibrida', 'PLTS digabung baterai atau genset diesel.', 'Solar combined with batteries or diesel generators.'],
  ].map(([i, a, e]) => ({ istilah: T(i, i), arti: T(a, e) })) };
  // B
  bab['4'] = { tipe: 'teks', sumber: sm('kap', 'irena24', 'masdar'), paragraf: [
    T('PLTS mengubah cahaya matahari langsung menjadi listrik lewat panel fotovoltaik. Pengembangan cepat karena modul murah, pemasangan modular, dan waktu bangun singkat dibanding pembangkit lain.', 'Solar PV turns sunlight directly into electricity with photovoltaic panels. Growth is fast because modules are cheap, installation is modular and build times are short compared to other generation.'),
    T(`Menurut IRENA, rata-rata global LCOE surya baru USD 0,043 per kWh pada 2024 (ringkasan pers). Di Indonesia kapasitasnya ${k25.kapasitas_mw} MW pada ${k25.tahun}, masih kecil dibanding potensi.`, `Per IRENA, the global average LCOE of new solar was USD 0.043 per kWh in 2024 (press summary). Indonesia has ${k25.kapasitas_mw} MW in ${k25.tahun}, still small relative to potential.`),
    T('Empat bentuk utama: skala utilitas di tanah, atap (rumah, gedung, industri), terapung di waduk, dan hibrida atau komunal untuk desa tanpa jaringan andal.', 'Four main forms: utility-scale ground-mounted, rooftop (homes, buildings, industry), floating on reservoirs, and hybrid or community systems for villages without reliable grids.'),
  ] };
  const tarifR = r.hit.tarif.find((t) => t.golongan === 'R-1/TR 2.200 VA');
  const asum = r.hit.asumsi;
  const pv = r.pot.find((p) => p.provinsi === 'Jawa Barat').pvout_kwh_per_kwp_tahun;
  const kwp = 3, prod = kwp * pv, pakai = asum.rumah.pakai_sendiri_persen.nilai / 100, hemat = prod * pakai * tarifR.tarif_idr_per_kwh, om = kwp * asum.rumah.harga_per_kwp_idr.nilai * asum.rumah.om_persen_per_tahun.nilai / 100, cap = kwp * asum.rumah.harga_per_kwp_idr.nilai;
  const bersih = hemat - om;
  bab['5'] = { tipe: 'rumus', sumber: sm('gsa', 'hitung', 'ed'), rumus: [
    T('Produksi tahunan (kWh) = Daya terpasang (kWp) x PVOUT (kWh per kWp per tahun)', 'Annual output (kWh) = Installed power (kWp) x PVOUT (kWh per kWp per year)'),
    T('Faktor kapasitas (persen) = PVOUT / 8.760 jam x 100', 'Capacity factor (percent) = PVOUT / 8,760 hours x 100'),
    T('Hemat tahunan (Rp) = Produksi x Persen pakai sendiri x Tarif (Rp per kWh) - Biaya O&M', 'Annual saving (IDR) = Output x Self-consumption share x Tariff (IDR per kWh) - O&M cost'),
    T('LCOE (Rp per kWh) = (Capex + nilai kini O&M) / nilai kini produksi sepanjang umur', 'LCOE (IDR per kWh) = (Capex + present value of O&M) / present value of lifetime output'),
  ], contoh: [
    T(`Contoh rumah ${kwp} kWp di Jawa Barat (PVOUT ${pv}): produksi ${rf(prod)} kWh per tahun, faktor kapasitas ${rf(pv / 87.6)} persen. EST.`, `Example ${kwp} kWp home in West Java (PVOUT ${pv}): ${rf(prod)} kWh per year, capacity factor ${rf(pv / 87.6)} percent. EST.`),
    T(`Dengan asumsi Hipotesis kalkulator METI (Rp ${asum.rumah.harga_per_kwp_idr.nilai.toLocaleString('id-ID')} per kWp, pakai sendiri ${asum.rumah.pakai_sendiri_persen.nilai} persen, O&M ${asum.rumah.om_persen_per_tahun.nilai} persen per tahun) dan tarif ${tarifR.golongan} Rp ${tarifR.tarif_idr_per_kwh}: hemat ${Math.round(hemat).toLocaleString('id-ID')} dikurangi O&M ${Math.round(om).toLocaleString('id-ID')} = Rp ${Math.round(bersih).toLocaleString('id-ID')} per tahun; modal Rp ${cap.toLocaleString('id-ID')} kembali sekitar ${rf(cap / bersih)} tahun tanpa diskonto dan degradasi. EST.`, `With the METI calculator Hypothesis assumptions (IDR ${asum.rumah.harga_per_kwp_idr.nilai.toLocaleString('en-US')} per kWp, ${asum.rumah.pakai_sendiri_persen.nilai} percent self-consumption, ${asum.rumah.om_persen_per_tahun.nilai} percent O&M per year) and tariff ${tarifR.golongan} IDR ${tarifR.tarif_idr_per_kwh}: saving ${Math.round(hemat).toLocaleString('en-US')} minus O&M ${Math.round(om).toLocaleString('en-US')} = IDR ${Math.round(bersih).toLocaleString('en-US')} per year; capex IDR ${cap.toLocaleString('en-US')} repaid in about ${rf(cap / bersih)} years without discounting or degradation. EST.`),
    T('Contoh LCOE dunia: IRENA mencatat USD 0,043 per kWh (2024) dan USD 691 per kW biaya terpasang (ringkasan pers; cek PDF IRENA).', 'World LCOE example: IRENA reports USD 0.043 per kWh (2024) and USD 691 per kW installed cost (press summary; check the IRENA PDF).'),
  ], catatan: T('Asumsi harga dan pakai sendiri berlabel Hipotesis, bukan data pasar tersumber.', 'Price and self-consumption assumptions are labelled Hypothesis, not sourced market data.') };
  bab['6'] = { tipe: 'langkah', sumber: sm('ed', 'rantai'), butir: [
    ['Pengembang dan EPC', 'Menyaring lokasi, mengurus izin, membangun, dan mengoperasikan.', 'Screens sites, handles permits, builds and operates.', 'Pengembang, kontraktor EPC'],
    ['Pabrikan modul', `${r.rantai.pabrikan} pabrikan modul terdaftar DJEBTKE, total ${r.rantai.total_mwp} MWp per tahun.`, `${r.rantai.pabrikan} module factories listed by DJEBTKE, ${r.rantai.total_mwp} MWp per year in total.`, 'Pabrikan'],
    ['Inverter, baterai, struktur', 'Komponen sistem; bagian lain dari TKDN.', 'System components; another part of local content.', 'Pemasok'],
    ['Pembeli listrik', 'PLN sebagai pembeli tunggal untuk IPP; pelanggan sendiri untuk atap dan captive.', 'PLN as single buyer for IPPs; the customer itself for rooftop and captive.', 'PLN, pelanggan'],
    ['Pemodal', 'Bank, lembaga pembangunan, investor ekuitas.', 'Banks, development institutions, equity investors.', 'Pendana'],
    ['Penetapan kebijakan', 'ESDM, Kemenperin (TKDN), Kemenkeu, pemda.', 'Energy Ministry, Industry Ministry (TKDN), Finance Ministry, local governments.', 'Pemerintah'],
  ].map(([a, b, c, d]) => ({ judul: T(a, a), isi: T(b, c), pelaku: T(d, d) })) };
  // C
  bab['7'] = { tipe: 'grafik', jenis: 'kolom', sumber: sm('kap'), label: T('Kapasitas surya terpasang Indonesia', 'Indonesia installed solar capacity'), satuan: 'MW', d: 0,
    seri: [{ nama: T('Kapasitas surya', 'Solar capacity'), sorot: true, titik: r.kap.map((x) => [String(x.tahun), x.kapasitas_mw]) }] };
  bab['8'] = { tipe: 'tabel', per: 10, sumber: sm('gsa'), catatan: T('Satu titik ibu kota per provinsi, bukan rata-rata provinsi; pakai sebagai indikasi relatif.', 'One capital point per province, not a provincial mean; use as a relative indication.'),
    kolom: [{ k: 'prov', l: T('Provinsi', 'Province') }, { k: 'pvout', l: T('PVOUT (kWh per kWp per tahun)', 'PVOUT (kWh per kWp per year)'), num: true, d: 0 }, { k: 'ghi', l: T('GHI (kWh per m2 per tahun)', 'GHI (kWh per m2 per year)'), num: true, d: 0 }, { k: 'url', l: T('Sumber', 'Source'), url: 'url' }],
    baris: r.pot.map((p) => ({ prov: p.provinsi, pvout: p.pvout_kwh_per_kwp_tahun, ghi: p.ghi_kwh_per_m2_tahun, url: p.url })) };
  // Blok dari irisan otomatis dasar-surya.json (dibangun topik_bangun.mjs); dikutip, bukan disunting tangan.
  const dasarP = 'public/data/topik/dasar-surya.json';
  const ds = fs.existsSync(path.join(akar, dasarP)) ? baca(dasarP) : null;
  if (ds) {
    bab['9'] = { tipe: 'tabel', per: 12, sumber: sm('direktori'), judul: T('Pemain surya di basis METI', 'Solar players in the METI base'),
      kolom: [{ k: 'nama', l: T('Organisasi', 'Organisation') }, { k: 'kategori', l: T('Kategori', 'Category') }, { k: 'peran', l: T('Peran rantai', 'Chain role') }, { k: 'proyek', l: T('Proyek tercatat', 'Recorded projects'), num: true, d: 0 }],
      baris: ds.pemain.map((x) => ({ nama: x.nama, kategori: x.kategori, peran: (x.peran || []).join(', '), proyek: x.proyek })) };
    bab['10'] = { tipe: 'tabel', per: 10, sumber: sm('direktori'), judul: T('Proyek surya terbesar di basis METI', 'Largest solar projects in the METI base'),
      catatan: T(`${ds.proyek.jumlah} proyek surya, ${ds.proyek.mw} MW, ${ds.proyek.beroperasi} beroperasi.`, `${ds.proyek.jumlah} solar projects, ${ds.proyek.mw} MW, ${ds.proyek.beroperasi} operating.`),
      kolom: [{ k: 'nama', l: T('Proyek', 'Project') }, { k: 'prov', l: T('Provinsi', 'Province') }, { k: 'mw', l: T('MW', 'MW'), num: true, d: 0 }, { k: 'status', l: T('Status', 'Status') }],
      baris: ds.proyek.daftar.map((x) => ({ nama: x.nama, prov: x.provinsi, mw: x.mw, status: x.status })) };
    bab['18'] = { tipe: 'tabel', per: 8, sumber: sm('direktori'), judul: T('Inovasi surya Indonesia', 'Indonesian solar innovation'),
      kolom: [{ k: 'nama', l: T('Inovasi', 'Innovation') }, { k: 'jenis', l: T('Jenis', 'Type') }, { k: 'status', l: T('Status', 'Status') }, { k: 'tahun', l: T('Tahun', 'Year') }],
      baris: ds.inovasi.map((x) => ({ nama: x.nama, jenis: x.jenis, status: x.status, tahun: String(x.tahun || '') })) };
  }
  bab['21'] = { tipe: 'teks', sumber: sm('ebrd', 'dhafra', 'bhadla', 'vnallens', 'eiser', 'ed'), paragraf: [
    T(HIP + 'tiga negara berhasil (Mesir, UEA, India) memakai jalur berbeda untuk risiko yang sama: Mesir lewat FiT lalu lelang dengan penjaminan lembaga pembangunan, UEA lewat lelang IPP dengan pembeli negara, India lewat taman surya dengan lahan dan evakuasi disiapkan negara. Rinci di bab 39.', HIPE + 'three successful countries (Egypt, UAE, India) used different routes for the same risk: Egypt via FiT then auctions with development-bank guarantees, UAE via IPP auctions with a state buyer, India via solar parks with land and evacuation prepared by the state. Details in chapter 39.'),
    T(HIP + 'kegagalan Vietnam dan Spanyol sama-sama berpangkal pada tarif tetap tinggi tanpa kuota dan degresi yang kemudian diubah, Vietnam dengan jaringan tertinggal. Rinci di bab 40.', HIPE + 'the Vietnam and Spain failures both stem from high fixed tariffs without caps and degression that were later changed, with Vietnam also facing lagging grids. Details in chapter 40.'),
  ] };
  const pvj = 1500, cf = pvj / 87.6, cap100 = 100, prod100 = cap100 * pvj / 1000;
  bab['25'] = { tipe: 'rumus', sumber: sm('gsa', 'perpres112tarif', 'ed'), rumus: [
    T('Produksi tahunan (GWh) = Kapasitas (MWp) x PVOUT (kWh per kWp per tahun) / 1.000', 'Annual output (GWh) = Capacity (MWp) x PVOUT (kWh per kWp per year) / 1,000'),
    T('Pendapatan tahunan (USD juta) = Produksi (GWh) x Tarif (sen USD per kWh) / 100', 'Annual revenue (USD million) = Output (GWh) x Tariff (USD cents per kWh) / 100'),
  ], contoh: [
    T(`Contoh ilustrasi (EST): PLTS ${cap100} MWp dengan PVOUT ${pvj} (faktor kapasitas ${rf(cf)} persen) menghasilkan ${prod100} GWh per tahun; pada tarif USD 5,63 sen per kWh (batas harga ringkasan Databoks; tabel berjenjang belum diverifikasi) pendapatan sekitar USD ${rf(prod100 * 5.63 / 100)} juta per tahun, belum dikurangi O&M dan degradasi.`, `Illustrative example (EST): a ${cap100} MWp plant at PVOUT ${pvj} (capacity factor ${rf(cf)} percent) yields ${prod100} GWh per year; at USD 5.63 cents per kWh (Databoks ceiling summary; tier tables unverified) revenue is about USD ${rf(prod100 * 5.63 / 100)} million per year, before O&M and degradation.`),
  ], catatan: T('Bukan data proyek nyata. Pendapatan tambahan kredit karbon dibahas di topik Karbon.', 'Not real project data. Carbon credit revenue is covered in the Carbon topic.') };
  bab['38'] = { tipe: 'teks', sumber: sm('ed'), paragraf: [
    T('Sumber: IRENA (kapasitas, biaya), Global Solar Atlas (PVOUT), Our World in Data dan Ember (porsi surya), JDIH BPK (aturan), berkas METI (proyek, tarif, pendanaan), rilis pemilik proyek (Masdar), EBRD, ADB, dan media kredibel. Angka dari media atau ringkasan pers diberi bukti media.', 'Sources: IRENA (capacity, cost), Global Solar Atlas (PVOUT), Our World in Data and Ember (solar share), JDIH BPK (regulations), METI files (projects, tariffs, funding), project owner releases (Masdar), EBRD, ADB and credible media. Figures from media or press summaries carry media evidence.'),
    T('Batas data: biaya dan tarif Cirata, hasil Sumba 2025, tarif Benban per kuartal, harga menang GEA-4, dan temuan BPK khusus PLTS terpusat tidak ditemukan; sengaja dikosongkan. Analisis berlabel Hipotesis. Pembacaan 8 Nov 2026.', 'Data limits: Cirata cost and tariff, Sumba 2025 outcomes, Benban quarterly tariffs, GEA-4 winning prices and BPK findings specific to centralised PLTS were not found; deliberately blank. Analysis is labelled Hypothesis. Read on 8 Nov 2026.'),
  ] };
  bab['11'] = { tipe: 'teks', sumber: sm('rantai', 'tarifas', 'hitung'), paragraf: [
    T(`Industri modul: ${r.rantai.pabrikan} pabrikan, ${r.rantai.total_mwp} MWp per tahun, ${r.rantai.lokal_mwp} MWp untuk pasar lokal, ${r.rantai.ekspor_mwp} MWp untuk ekspor (${r.rantai.ekspor_hanya_mwp} MWp khusus ekspor).`, `Module industry: ${r.rantai.pabrikan} factories, ${r.rantai.total_mwp} MWp per year, ${r.rantai.lokal_mwp} MWp domestic, ${r.rantai.ekspor_mwp} MWp export (${r.rantai.ekspor_hanya_mwp} MWp export-only).`),
    T('Pasar ekspor terpukul: AS menetapkan bea masuk imbalan sementara 86 sampai 143 persen atas panel surya Indonesia (ANTARA, 26 Feb 2026).', 'Export market hit: the US set provisional countervailing duties of 86 to 143 percent on Indonesian solar panels (ANTARA, 26 Feb 2026).'),
    T('Tarif PLN nonsubsidi Q3 2026: rumah R-1 2.200 VA Rp 1.444,7 per kWh, industri I-3 Rp 1.114,74, bisnis B-2 Rp 1.444,7; patokan penghematan PLTS atap.', 'PLN non-subsidised tariffs Q3 2026: home R-1 2,200 VA IDR 1,444.7 per kWh, industry I-3 IDR 1,114.74, business B-2 IDR 1,444.7; the benchmark for rooftop savings.'),
  ] };
  // D
  const reg = [
    ['permen-esdm-17-2013', 'Permen ESDM 17/2013 pembelian listrik dari PLTS (dicabut)', '2013-06-12'], ['permen-esdm-19-2016', 'Permen ESDM 19/2016 pembelian listrik PLTS fotovoltaik (dicabut)', '2016-06-28'],
    ['permen-esdm-49-2018', 'Permen ESDM 49/2018 PLTS atap konsumen PLN (dicabut)', '2018-11-15'], ['permen-esdm-26-2021', 'Permen ESDM 26/2021 PLTS atap (dicabut)', '2021-08-13'],
    ['perpres-112-2022', 'Perpres 112/2022 percepatan energi terbarukan', '2022-09-13'], ['permen-esdm-2-2024', 'Permen ESDM 2/2024 PLTS atap (berlaku)', '2024-01-29'], ['permen-kemenperin-34-2024', 'Permenperin 34/2024 TKDN modul surya (berlaku)', '2024-07-25'],
  ];
  bab['12'] = { tipe: 'tabel', per: 8, sumber: sm('regul', 'permen2', 'perpres112', 'tkdn'), kolom: [{ k: 'dok', l: T('Peraturan', 'Regulation') }, { k: 'tgl', l: T('Ditetapkan', 'Enacted') }, { k: 'isi', l: T('Pokok', 'Key point') }, { k: 'url', l: T('Naskah', 'Text'), url: 'url' }],
    baris: [
      { dok: T('Permen ESDM 2/2024', 'Energy Ministry Reg. 2/2024'), tgl: '2024-01-29', isi: T('PLTS atap tersambung jaringan IUPTLU; ekspor tidak dihitung; kuota per sistem; transisi 10 tahun bagi pengguna lama.', 'Rooftop solar connected to a licensed utility grid; exports not counted; quota per system; 10-year transition for existing users.'), url: 'https://peraturan.bpk.go.id/Details/288519' },
      { dok: T('Perpres 112/2022', 'Presidential Reg. 112/2022'), tgl: '2022-09-13', isi: T('Percepatan energi terbarukan; batas harga pembelian listrik EBT; dalam revisi sejak 2026.', 'Renewable acceleration; price ceilings for renewable power purchase; under revision since 2026.'), url: 'https://peraturan.bpk.go.id/Details/225308' },
      { dok: T('Permenperin 34/2024', 'Industry Ministry Reg. 34/2024'), tgl: '2024-07-25', isi: T('Tata cara menghitung TKDN modul surya.', 'Method for calculating local content of solar modules.'), url: 'https://peraturan.bpk.go.id/Details/296131' },
      { dok: T('Permenperin 6/2022', 'Industry Ministry Reg. 6/2022'), tgl: '2022-03-11', isi: T('Spesifikasi, peta jalan, dan penghitungan TKDN (termasuk PLTS).', 'Specification, roadmap and local content calculation (including PLTS).'), url: 'https://peraturan.bpk.go.id/Details/227541' },
      { dok: T('Permen ESDM 26/2021', 'Energy Ministry Reg. 26/2021'), tgl: '2021-08-13', isi: T('PLTS atap versi sebelumnya; dicabut oleh Permen 2/2024.', 'Previous rooftop regulation; replaced by Reg. 2/2024.'), url: 'https://peraturan.bpk.go.id/Details/257416' },
    ], catatan: T('Ringkasan pokok bukan kutipan pasal; cocokkan dengan naskah sebelum dikutip.', 'Key points are a summary, not article quotes; check against the text before citing.') };
  bab['13'] = { tipe: 'linimasa', sumber: sm('regul', 'plts100', 'perpres112rev'), butir: [
    ...reg.map(([id, judul, tgl]) => ({ tanggal: tgl, reg: id, judul: T(judul, judul) })),
    { tanggal: '2026-02-05', judul: T('ESDM merevisi Perpres 112/2022 (batas atas dan bawah tarif EBT)', 'Energy Ministry revising Perpres 112/2022 (upper and lower renewable tariff bounds)'), url: SUMBER.perpres112rev.url },
    { tanggal: '2026-08-25', judul: T('Peluncuran dan groundbreaking Program PLTS 100 GWp (tahap awal 5,3 GWp, 14 proyek)', 'Launch and groundbreaking of the PLTS 100 GWp programme (first stage 5.3 GWp, 14 projects)'), url: SUMBER.plts100.url },
  ] };
  bab['14'] = { tipe: 'teks', sumber: sm('permen2', 'bisnis2', 'perpres112tarif', 'tkdn', 'iesr2'), paragraf: [
    T('Insentif: batas harga PLTS Perpres 112/2022 sekitar USD 5,63 sen per kWh menurut ringkasan Databoks; tabel berjenjang dan faktor lokasi F harus dibaca dari naskah.', 'Incentive: the Perpres 112/2022 PLTS ceiling is about USD 5.63 cents per kWh per Databoks; tiered tables and location factor F must be read from the text.'),
    T('Pembatas: PLTS atap kini berkuota dan ekspor tidak dibayar; IESR menilai revisi condong berpihak ke PLN.', 'Constraints: rooftop solar is now quota-based and exports are unpaid; IESR says the revision leans toward PLN.'),
    T('Kewajiban TKDN modul dihitung berdasarkan Permenperin 34/2024 dan 6/2022.', 'Module local content is calculated under Industry Ministry Regs. 34/2024 and 6/2022.'),
  ] };
  bab['15'] = { tipe: 'langkah', sumber: sm('ed', 'permen2', 'bisnis2'), catatan: T('Ringkasan alur umum; durasi dan biaya belum bersumber dan sengaja tidak ditulis. Cek PLN dan naskah Permen ESDM 2/2024.', 'General flow summary; durations and costs are not sourced and deliberately omitted. Check PLN and the text of Reg. 2/2024.'), butir: [
    ['PLTS atap: cek kuota sistem', 'Pastikan kuota PLTS atap sistem ketenagalistrikan setempat masih tersedia (Pasal 7 sampai 11).', 'Check the local power system rooftop quota is still available (Articles 7 to 11).', 'Pelanggan'],
    ['PLTS atap: ajukan ke PLN', 'Ajukan permohonan pemasangan ke pemegang IUPTLU dan ikuti ketentuan teknis sambungan.', 'Apply to the licensed utility and follow interconnection technical rules.', 'Pelanggan, PLN'],
    ['PLTS atap: pasang dan operasikan', 'Kapasitas mengikuti kuota; energi ekspor tidak dihitung dalam tagihan.', 'Capacity follows the quota; exported energy is not counted in the bill.', 'Pelanggan, instalatir'],
    ['IPP: masuk daftar rencana', 'Proyek sesuai RUPTL PLN 2025-2034 atau program PLTS 100 GWp.', 'Projects fit the PLN RUPTL 2025-2034 or the PLTS 100 GWp programme.', 'Pengembang, PLN'],
    ['IPP: tarif dan PPA', 'Harga mengacu batas harga Perpres 112/2022 atau hasil negosiasi atau lelang.', 'Price refers to Perpres 112/2022 ceilings or negotiation or tender.', 'Pengembang, PLN'],
    ['IPP: izin, TKDN, pendanaan', 'Lengkapi perizinan, penuhi TKDN modul, tutup pendanaan, lalu konstruksi.', 'Complete permits, meet module local content, close financing, then construct.', 'Pengembang'],
  ].map(([a, b, c, d]) => ({ judul: T(a, a), isi: T(b, c), pelaku: T(d, d) })) };
  bab['16'] = { tipe: 'teks', sumber: sm('kebijakan', 'perpres112rev'), paragraf: [
    T('RUU Energi Baru dan Energi Terbarukan masih tahap pembahasan di Komisi XII DPR RI (arsip METI, September 2026). Situs DPR melarang perayap sehingga status tahap diambil dari arsip dan berita.', 'The New and Renewable Energy Bill is still in deliberation at Commission XII of the House (METI archive, September 2026). The House site forbids crawlers so stage status comes from archives and news.'),
    T('ESDM merevisi Perpres 112/2022 (CNBC Indonesia, 5 Februari 2026), termasuk harga dan hambatan proyek mangkrak.', 'The Energy Ministry is revising Perpres 112/2022 (CNBC Indonesia, 5 February 2026), covering prices and stalled-project bottlenecks.'),
  ] };
  // E
  bab['17'] = { tipe: 'teks', sumber: sm('itrpv', 'modul703', 'nrel', 'masdar'), paragraf: [
    T('Sel TOPCon (tipe-n) melampaui PERC pada 2024 menurut ITRPV; satu sumber menyebut sekitar 60 persen pengapalan 2024 (sumber lain 70 persen, definisi berbeda). Pengapalan modul global 703 GW pada 2024.', 'TOPCon (n-type) cells overtook PERC in 2024 per ITRPV; one source puts it near 60 percent of 2024 shipments (another says 70 percent, different definitions). Global module shipments were 703 GW in 2024.'),
    T('Tandem perovskit-silikon: bagan NREL revisi April 2024 mencatat 33,9 persen; rekor lebih baru dilaporkan tetapi belum saya konfirmasi di bagan langsung.', 'Perovskite-silicon tandem: the April 2024 NREL chart lists 33.9 percent; newer records are reported but not confirmed on the live chart.'),
    T('Terapung: panel dekat air lebih sejuk dan mengurangi penguapan menurut pemilik Cirata (Masdar).', 'Floating: panels near water run cooler and reduce evaporation per the Cirata owner (Masdar).'),
  ], catatan: T('Bifacial dan agrivoltaik belum bersumber di naskah ini; lihat blok Inovasi.', 'Bifacial and agrivoltaics are not sourced in this text; see the Innovation block.') };
  bab['19'] = { tipe: 'grafik', jenis: 'garis', sumber: sm('lcoe', 'irena24'), label: T('Harga modul surya global (USD 2025 per W)', 'Global solar module price (USD 2025 per W)'), satuan: 'USD per W', d: 2,
    seri: [{ nama: T('Harga modul', 'Module price'), sorot: true, titik: r.modul.filter((m) => m.tahun % 1 === 0 && m.tahun >= 2005).map((m) => [String(m.tahun), m.usd_per_w]) }],
    catatan: T(`LCOE surya (sen USD per kWh): India ${r.lc('India', 2010)} (2010) ke ${r.lc('India', 2025)} (2025); Thailand ${r.lc('Thailand', 2025)} (2025); dunia ${r.lc('Dunia', 2025)} (2025). LCOE surya Indonesia tidak ada di rilis IRENA yang dibaca.`, `Solar LCOE (USD cents per kWh): India ${r.lc('India', 2010)} (2010) to ${r.lc('India', 2025)} (2025); Thailand ${r.lc('Thailand', 2025)} (2025); world ${r.lc('Dunia', 2025)} (2025). Indonesia solar LCOE is not in the IRENA release read.`) };
  // F
  bab['20'] = { tipe: 'tabel', per: 10, sumber: sm('owid', 'irenaasean'), catatan: T('Porsi surya dalam pembangkitan listrik (Ember via Our World in Data); kapasitas EBT total (IRENA). Brunei tanpa data kapasitas.', 'Solar share of electricity generation (Ember via Our World in Data); total renewable capacity (IRENA). Brunei has no capacity data.'),
    kolom: [{ k: 'neg', l: T('Negara', 'Country') }, { k: 'surya', l: T('Porsi surya (persen)', 'Solar share (percent)'), num: true, d: 2 }, { k: 'th', l: T('Tahun data', 'Data year') }, { k: 'ebt', l: T('Porsi EBT total (persen)', 'Total renewable share (percent)'), num: true, d: 1 }, { k: 'kap', l: T('Kapasitas EBT (MW)', 'Renewable capacity (MW)'), num: true, d: 0 }],
    baris: r.asean.slice().sort((a, b) => b.bauran_listrik_persen.surya.nilai - a.bauran_listrik_persen.surya.nilai).map((x) => ({ neg: nama[x.nama] || x.nama, surya: x.bauran_listrik_persen.surya.nilai, th: String(x.bauran_listrik_persen.surya.tahun), ebt: x.bauran_listrik_persen.ebt_total.nilai, kap: r.asean2[x.iso3]?.kapasitas_ebt_mw?.nilai ?? '' })) };
  const kam = r.asean.find((x) => x.iso3 === 'KHM'), tha = r.asean.find((x) => x.iso3 === 'THA');
  bab['22'] = { tipe: 'teks', sumber: sm('owid'), paragraf: [
    T(`Porsi surya listrik Indonesia ${idn.bauran_listrik_persen.surya.nilai} persen (2024) berada di dasar ASEAN: Vietnam ${vn.bauran_listrik_persen.surya.nilai}, Kamboja ${kam.bauran_listrik_persen.surya.nilai}, Thailand ${tha.bauran_listrik_persen.surya.nilai} (2025). Vietnam sekitar ${Math.round(vn.bauran_listrik_persen.surya.nilai / idn.bauran_listrik_persen.surya.nilai)} kali lipat (EST, beda tahun data).`, `Indonesia's solar share of ${idn.bauran_listrik_persen.surya.nilai} percent (2024) sits near the bottom of ASEAN: Vietnam ${vn.bauran_listrik_persen.surya.nilai}, Cambodia ${kam.bauran_listrik_persen.surya.nilai}, Thailand ${tha.bauran_listrik_persen.surya.nilai} (2025). Vietnam is about ${Math.round(vn.bauran_listrik_persen.surya.nilai / idn.bauran_listrik_persen.surya.nilai)} times higher (EST, different data years).`),
  ] };
  const jetp = r.keb.jetp;
  bab['23'] = { tipe: 'teks', sumber: sm('kebijakan'), paragraf: [T(`Dua proyek surya tercatat disetujui pembiayaan JETP di basis METI: ${jetp.filter((j) => /PLTS|Surya/i.test(j.nama)).map((j) => `${j.nama} ${j.mw} MW (${j.provinsi})`).join('; ')}.`, `Surya projects recorded as JETP-financing approved in the METI base: ${jetp.filter((j) => /PLTS|Surya/i.test(j.nama)).map((j) => `${j.nama} ${j.mw} MW (${j.provinsi})`).join('; ')}.`)] };
  // G
  const pem = r.pend.ringkasan.nilai_per_pemberi.slice(0, 8);
  bab['24'] = { tipe: 'tabel', per: 8, sumber: sm('pendanaan'), catatan: T('Nilai untuk SELURUH energi terbarukan dan efisiensi di basis METI, bukan khusus surya; filter surya ada di blok Pendanaan.', 'Values cover ALL renewable energy and efficiency in the METI base, not solar only; the solar filter is in the Funding block.'),
    kolom: [{ k: 'p', l: T('Pemberi', 'Provider') }, { k: 'n', l: T('Jumlah proyek', 'Projects'), num: true, d: 0 }, { k: 'u', l: T('Total (USD)', 'Total (USD)'), num: true, d: 0 }],
    baris: pem.map((x) => ({ p: x.pemberi, n: x.jumlah_proyek, u: x.total_usd })) };
  bab['26'] = { tipe: 'tabel', per: 8, sumber: sm('cirata', 'masdar', 'ikn', 'dhafra'), kolom: [{ k: 'p', l: T('Proyek', 'Project') }, { k: 'o', l: T('Struktur kepemilikan', 'Ownership') }, { k: 'n', l: T('Nilai', 'Value') }],
    baris: [
      { p: 'PLTS Terapung Cirata 192 MWp', o: T('PLN Nusantara Renewables 51 persen, Masdar 49 persen (media)', 'PLN Nusantara Renewables 51 percent, Masdar 49 percent (media)'), n: T('Tidak ditemukan di sumber', 'Not found in sources') },
      { p: 'PLTS IKN 50 MW', o: T('PLN Nusantara Renewables 51 persen, Sembcorp 49 persen', 'PLN Nusantara Renewables 51 percent, Sembcorp 49 percent'), n: T('USD 64 juta (media)', 'USD 64 million (media)') },
      { p: 'Al Dhafra 2 GW (UEA)', o: T('TAQA 40 persen; Masdar, EDF, JinkoPower 20 persen masing-masing', 'TAQA 40 percent; Masdar, EDF, JinkoPower 20 percent each'), n: T('7 bank; jumlah tidak terkonfirmasi', '7 banks; amount unconfirmed') },
    ] };
  // H
  bab['27'] = { tipe: 'teks', sumber: sm('masdar', 'gajah', 'adbsumba'), paragraf: [
    T('Terapung: panel menekan penguapan waduk dan menghemat lahan menurut pemilik Cirata; dampak ekologis jangka panjang pada waduk belum bersumber di sini.', 'Floating: panels reduce reservoir evaporation and save land per the Cirata owner; long-term ecological effects on the reservoir are not sourced here.'),
    T('Desa: di Gajah Makmur, warga memakai genset solar Rp 200 ribu sampai Rp 500 ribu per bulan sebelum PLTS dan iuran Rp 30 ribu per rumah saat PLTS menyala.', 'Villages: at Gajah Makmur villagers spent IDR 200k to 500k per month on diesel before PLTS and paid IDR 30k per home when it ran.'),
    T('Sumba: ADB mencatat MoU 2011 antara pemerintah pusat, daerah, PLN, dan Hivos serta satuan tugas multipihak 2012 (pemerintah, swasta, universitas, masyarakat sipil).', 'Sumba: ADB records a 2011 MoU among national and local governments, PLN and Hivos and a 2012 multi-stakeholder taskforce (government, private sector, universities, civil society).'),
  ] };
  bab['28'] = { tipe: 'teks', sumber: sm('detik2016'), paragraf: [T('Pada 2016 ESDM mengakui SDM pengelola belum siap sehingga PLTS rusak; program Patriot Energi menempatkan mahasiswa teknik di lokasi terpencil untuk pemeliharaan berkala dan ESDM melatih operator bersamaan pembangunan. Data sertifikasi dan pelatihan lain belum bersumber.', 'In 2016 the Energy Ministry admitted unprepared operators left plants broken; the Patriot Energi programme places engineering students in remote sites for periodic maintenance and the ministry trains operators alongside construction. Other certification and training data is not yet sourced.')] };
  bab['29'] = { tipe: 'teks', sumber: sm('bisnis2', 'iesr2', 'tarifas', 'kpk'), paragraf: [
    T('Ekspor-impor PLTS atap: ESDM menghapusnya dan memberi kuota; IESR menilai revisi condong berpihak ke PLN dan dapat menyurutkan partisipasi publik.', 'Rooftop export-import: the ministry removed it and introduced quotas; IESR says the revision leans toward PLN and may dampen public participation.'),
    T('Panel Indonesia kena bea masuk AS 86 sampai 143 persen; Wamen ESDM menyatakan yang terkena ialah panel yang tidak diproduksi di Indonesia dan hanya dilabeli atau ditranshipment (ANTARA).', 'Indonesian panels face 86 to 143 percent US duties; the Deputy Energy Minister said the affected panels are not made in Indonesia and are only labelled or transshipped (ANTARA).'),
    T('KPK menemukan mark-up dan kolusi TKDN pada 629 PLTS ESDM 2023 dan mengingatkan risiko serupa pada PLTS 100 GWp.', 'KPK found mark-ups and TKDN collusion in 629 Energy Ministry PLTS in 2023 and warns of similar risks for PLTS 100 GWp.'),
  ] };
  // I
  const tg = (id) => r.keb.target.find((t) => t.id === id);
  bab['30'] = { tipe: 'tabel', per: 8, sumber: sm('kebijakan', 'ruptl'), kolom: [{ k: 'd', l: T('Dokumen dan ukuran', 'Document and measure') }, { k: 't', l: T('Tahun', 'Year') }, { k: 'n', l: T('Nilai', 'Value') }],
    baris: [
      { d: T('KEN PP 40/2025: bauran EBT energi primer', 'KEN PP 40/2025: renewable primary energy mix'), t: '2030', n: T('19 sampai 23 persen', '19 to 23 percent') },
      { d: T('KEN PP 40/2025: bauran EBT energi primer', 'KEN PP 40/2025: renewable primary energy mix'), t: '2040', n: T('36 sampai 40 persen', '36 to 40 percent') },
      { d: T('KEN PP 40/2025: bauran EBT energi primer', 'KEN PP 40/2025: renewable primary energy mix'), t: '2060', n: T('70 sampai 72 persen', '70 to 72 percent') },
      { d: T('RUPTL 2025-2034: tambahan EBT', 'RUPTL 2025-2034: added renewables'), t: '2034', n: T(`${tg('ruptl-2034-kapasitas').min.toLocaleString('id-ID')} MW dari total 69.512 MW`, `${tg('ruptl-2034-kapasitas').min.toLocaleString('en-US')} MW of 69,512 MW total`) },
      { d: T('RUPTL 2025-2034: bauran EBT pembangkitan', 'RUPTL 2025-2034: renewable generation mix'), t: '2034', n: T('34,3 persen', '34.3 percent') },
      { d: T('RUKN: PLTS 2060 (daya mampu total sekitar 443 GW)', 'RUKN: PLTS 2060 (total net capacity about 443 GW)'), t: '2060', n: T('108,7 GW', '108.7 GW') },
    ], catatan: T('Target surya per tahun 2030 dan 2045 belum ditemukan di sumber yang dibaca.', 'Solar targets for 2030 and 2045 were not found in the sources read.') };
  const cl = r.keb.celah.find((c) => c.target_id === 'ruptl-2034-kapasitas');
  bab['31'] = { tipe: 'teks', sumber: sm('kebijakan', 'ed'), paragraf: [
    T(`Tantangan: tambahan EBT RUPTL ${cl.celah_mw.toLocaleString('id-ID')} MW perlu ${cl.per_tahun_mw.toLocaleString('id-ID')} MW per tahun, ${cl.kali_laju_historis} kali laju 2015 sampai 2024 (${cl.laju_historis_mw_per_tahun_2015_2024} MW per tahun). EST.`, `Challenge: the RUPTL renewable addition of ${cl.celah_mw.toLocaleString('en-US')} MW needs ${cl.per_tahun_mw.toLocaleString('en-US')} MW per year, ${cl.kali_laju_historis} times the 2015 to 2024 pace (${cl.laju_historis_mw_per_tahun_2015_2024} MW per year). EST.`),
    T(HIP + 'pengembang butuh kepastian PPA dan jaringan; pemasok modul butuh pasar domestik karena ekspor ke AS terhambat; pemda perlu kapasitas mengelola aset; investor menilai risiko perubahan aturan (Spanyol, Vietnam).', HIPE + 'developers need PPA and grid certainty; module suppliers need a domestic market as US exports are blocked; local governments need asset management capacity; investors weigh regulatory-change risk (Spain, Vietnam).'),
  ] };
  bab['32'] = { tipe: 'teks', sumber: sm('perpres112rev', 'kpk', 'kebijakan', 'bisnis2', 'tarifas'), paragraf: [
    T('Revisi Perpres 112/2022 (harga EBT).', 'Revision of Perpres 112/2022 (renewable prices).'),
    T('Perpres PLTS 100 GWp: KPK mencatat belum disahkan; pantau tata kelola (ETGF).', 'PLTS 100 GWp presidential regulation: KPK notes it is not yet enacted; watch governance (ETGF).'),
    T('Evaluasi tahunan kuota PLTS atap dan keputusan bea masuk AS atas panel Indonesia.', 'Annual rooftop quota evaluation and the US duty decisions on Indonesian panels.'),
    T('Pembahasan RUU EBET di DPR.', 'Deliberation of the EBET bill in the House.'),
  ] };

  // K
  const kas = (o) => o;
  const mercusuar = [
    kas({ id: 'cirata', nama: 'PLTS Terapung Cirata', jenis: 'berhasil', negara: 'ID', lokasi: T('Waduk Cirata, Jawa Barat', 'Cirata Reservoir, West Java'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: '192 MWp / 145 MWac' }, { label: T('Pemilik', 'Owners'), nilai: T('PLN Nusantara Renewables 51 persen, Masdar 49 persen (media)', 'PLN Nusantara Renewables 51 percent, Masdar 49 percent (media)') }, { label: T('Peresmian', 'Inauguration'), nilai: '2023-11-09' }, { label: T('Pendana', 'Financiers'), nilai: T('Standard Chartered dan SMBC disebut dalam pembicaraan pendanaan; pendana akhir tidak terkonfirmasi', 'Standard Chartered and SMBC named in financing talks; final lenders unconfirmed') }, { label: T('Biaya dan tarif', 'Cost and tariff'), nilai: T('Tidak ditemukan di sumber', 'Not found in sources') }, { label: T('PPA', 'PPA'), nilai: T('Ditandatangani Januari 2020 (media)', 'Signed January 2020 (media)') }],
      tindakan: [T('Memakai 250 ha permukaan waduk PLTA yang sudah ada; menjual listrik ke PLN.', 'Used 250 ha of an existing hydropower reservoir surface; sells power to PLN.'), T('Perubahan aturan menaikkan porsi permukaan waduk yang boleh dipakai energi terbarukan menjadi 20 persen.', 'A rule change raised the usable share of reservoir surface for renewables to 20 percent.')],
      sebab: [T('Faktor yang dinyatakan pemilik: kemitraan global, teknologi, dan lahan terbatas diatasi dengan permukaan air.', 'Factors stated by the owner: global partnership, technology, and limited land addressed with water surface.'), T(HIP + 'waduk PLTA sudah punya transmisi dan pembeli tunggal (PLN) sehingga risiko jaringan dan offtake rendah; belum diverifikasi dokumen proyek.', HIPE + 'the hydropower reservoir already has transmission and a single buyer (PLN), lowering grid and offtake risk; not verified against project documents.')],
      angka: [{ label: T('Rumah terlayani (pemilik)', 'Homes served (owner)'), nilai: 50000, d: 0, satuan: '', sumber: 'masdar', est: false }, { label: T('CO2 terhindar (pemilik; tidak dinyatakan per tahun)', 'CO2 offset (owner; not stated as annual)'), nilai: 214000, d: 0, satuan: 't', sumber: 'masdar', est: false }],
      pelajaran: [T('Waduk eksisting, mitra internasional, dan pembeli PLN mempercepat proyek; ekspansi sampai 500 MWac masih tahap studi (April 2025).', 'Existing reservoir, an international partner and a PLN buyer speed delivery; expansion up to 500 MWac is still at study stage (April 2025).')],
      faktor: { lahan: true, ppa_tarif: true, pendanaan: true, kepastian_kebijakan: true }, sumber: ['masdar', 'cirata'] }),
    kas({ id: 'ikn', nama: 'PLTS IKN (Nusantara Sembcorp)', jenis: 'berhasil', negara: 'ID', lokasi: T('Ibu Kota Nusantara, Kalimantan Timur', 'Nusantara capital, East Kalimantan'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: T('50 MW, tahap 1: 13,5 MWp / 10 MWac; BESS 14,2 MWh', '50 MW, stage 1: 13.5 MWp / 10 MWac; BESS 14.2 MWh') }, { label: T('Kepemilikan', 'Ownership'), nilai: T('PLN Nusantara Renewables 51 persen, Sembcorp 49 persen', 'PLN Nusantara Renewables 51 percent, Sembcorp 49 percent') }, { label: T('Nilai proyek', 'Project value'), nilai: T('USD 64 juta (media)', 'USD 64 million (media)') }, { label: T('Operasi', 'Operation'), nilai: T('Tahap 1 sinkron 22 Feb 2024; diresmikan 20 Jan 2025', 'Stage 1 synchronised 22 Feb 2024; inaugurated 20 Jan 2025') }],
      tindakan: [T('Kemitraan BUMN dan swasta asing, tahap bertingkat dengan baterai untuk stabilitas.', 'State-owned and foreign private partnership, staged build with batteries for stability.')],
      sebab: [T(HIP + 'tahap 1 kecil di lahan 10 ha memberi bukti operasi cepat; penyimpanan baterai membantu kestabilan. Sumber tidak menyatakan faktor; target operasi penuh sempat mundur dari 22 Des 2024.', HIPE + 'a small stage 1 on 10 ha gave quick proof of operation; battery storage helps stability. Sources do not state factors; full operation slipped from the 22 Dec 2024 target.')],
      angka: [], pelajaran: [T('Kecepatan tahap awal tercapai, tetapi tarif, faktor kapasitas, dan produksi tidak ditemukan di sumber sehingga keberhasilan ekonomi belum dapat dinilai.', 'Stage 1 speed was met, but tariff, capacity factor and output were not found in sources so economic success cannot be judged.')],
      faktor: { pendanaan: true }, sumber: ['ikn'] }),
    kas({ id: 'benban', nama: 'Benban Solar Park', jenis: 'berhasil', negara: 'EG', lokasi: T('Aswan, Mesir', 'Aswan, Egypt'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: T('1.465 MW dikontrak (EBRD); 1.800 MW nominal (Wikipedia)', '1,465 MW contracted (EBRD); 1,800 MW nameplate (Wikipedia)') }, { label: T('Pendana', 'Financiers'), nilai: T('EBRD USD 1,1 miliar di 16 PLTS 750 MW; IFC USD 653 juta untuk 13 PLTS; MIGA USD 210 juta asuransi risiko politik', 'EBRD USD 1.1 billion in 16 plants 750 MW; IFC USD 653 million for 13 plants; MIGA USD 210 million political risk insurance') }, { label: T('Tarif FiT', 'FiT tariff'), nilai: T('Putaran 1 USD 14,34 sen; putaran 2 USD 8,4 sen per kWh', 'Round 1 USD 14.34 cents; round 2 USD 8.4 cents per kWh') }, { label: T('Tersambung jaringan', 'Grid connected'), nilai: '2019' }],
      tindakan: [T('Program FiT Nubian Suns: satu kawasan 41 petak untuk banyak pengembang; dokumen standar dan pemrosesan massal oleh IFC; EETC membangun gardu.', 'Nubian Suns FiT programme: one zone with 41 plots for many developers; standard documents and bulk processing by IFC; EETC builds substations.')],
      sebab: [T('Sumber menyatakan pergeseran dari FiT ke lelang membangun kepercayaan investor dan menurunkan harga (Kom Ombo USD 0,0247 per kWh).', 'Sources state the move from FiT to auctions built investor trust and lowered prices (Kom Ombo USD 0.0247 per kWh).'), T('Putaran 1 ditinggalkan investor karena klausul PPA; putaran 2 menambah arbitrase luar negeri dan menurunkan syarat dana asing USD dari 85 ke 70 persen (Clifford Chance).', 'Round 1 saw investors pull back over PPA clauses; round 2 added offshore arbitration and lowered the foreign USD funding requirement from 85 to 70 percent (Clifford Chance).')],
      angka: [{ label: T('Tarif lelang Kom Ombo', 'Kom Ombo auction tariff'), nilai: 2.47, d: 2, satuan: 'sen USD per kWh', sumber: 'ebrd', est: false }, { label: T('Penambahan kapasitas terpasang nasional', 'Addition to national installed capacity'), nilai: 2.65, d: 2, satuan: '%', sumber: 'ebrd', est: false }],
      pelajaran: [T('Kawasan terpadu, dokumen PPA standar yang diperbaiki, dan penjaminan risiko politik menurunkan risiko; FiT awal terlalu tinggi lalu diganti lelang.', 'An integrated zone, standard PPAs that were fixed and political risk cover lowered risk; the initial FiT was too high and was replaced by auctions.')],
      faktor: { lahan: true, ppa_tarif: true, pendanaan: true, jaringan: true, kepastian_kebijakan: true }, sumber: ['benban', 'ebrd', 'cc'] }),
    kas({ id: 'aldhafra', nama: 'Al Dhafra Solar PV', jenis: 'berhasil', negara: 'AE', lokasi: T('Abu Dhabi, Uni Emirat Arab', 'Abu Dhabi, United Arab Emirates'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: '2 GW' }, { label: T('Pemilik', 'Owners'), nilai: T('TAQA 40 persen; Masdar, EDF Renewables, JinkoPower 20 persen masing-masing', 'TAQA 40 percent; Masdar, EDF Renewables, JinkoPower 20 percent each') }, { label: T('Pendana', 'Financiers'), nilai: T('7 bank internasional; penutupan Desember 2020', '7 international banks; financial close December 2020') }, { label: T('Tarif', 'Tariff'), nilai: T('USD 1,35 sen per kWh (penawaran Mei 2020); Masdar: AED 4,85 (sekitar USD 1,32 sen) setelah penutupan pembiayaan', 'USD 1.35 cents per kWh (May 2020 bid); Masdar: AED 4.85 (about USD 1.32 cents) after financial close') }, { label: T('COD', 'COD'), nilai: T('Target 2022; satu sumber lemah menyebut 30 Jun 2023', 'Target 2022; one weak source says 30 Jun 2023') }],
      tindakan: [T('Lelang IPP kompetitif oleh EWEC dengan pembeli negara tunggal.', 'Competitive IPP tender by EWEC with a single state buyer.')],
      sebab: [T(HIP + 'tarif rendah dimungkinkan radiasi tinggi, lahan murah, pembeli negara berperingkat tinggi, dan biaya modal rendah. Sumber tidak menyatakan faktor.', HIPE + 'the low tariff is enabled by high irradiance, cheap land, a highly rated state buyer and low cost of capital. Sources do not state factors.')],
      angka: [{ label: T('Tarif penawaran menang', 'Winning bid tariff'), nilai: 1.35, d: 2, satuan: 'sen USD per kWh', sumber: 'dhafra', est: false }],
      pelajaran: [T('Lelang kompetitif dengan pembeli kredibel menghasilkan tarif sangat rendah; kondisi UEA tidak otomatis berlaku di Indonesia.', 'A competitive tender with a credible buyer yields very low tariffs; UAE conditions do not automatically transfer to Indonesia.')],
      faktor: { ppa_tarif: true, pendanaan: true, tata_kelola_pengadaan: true }, sumber: ['dhafra', 'dhafra2'] }),
    kas({ id: 'bhadla', nama: 'Bhadla Solar Park', jenis: 'berhasil', negara: 'IN', lokasi: T('Jodhpur, Rajasthan, India', 'Jodhpur, Rajasthan, India'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: T('2.245 MW (Mercom); Wikipedia 2.055 MW', '2,245 MW (Mercom); Wikipedia 2,055 MW') }, { label: T('Luas', 'Area'), nilai: T('lebih dari 14.000 acre', 'over 14,000 acres') }, { label: T('Pengembang', 'Developers'), nilai: T('RSPDCL 745 MW, Adani JV 500 MW, ACME, SB Energy dan lain-lain', 'RSPDCL 745 MW, Adani JV 500 MW, ACME, SB Energy and others') }, { label: T('Tarif lelang', 'Auction tariff'), nilai: T('INR 2,44 dan 2,45 per kWh (Mei 2017); INR 2,47 dan 2,48 (Des 2019)', 'INR 2.44 and 2.45 per kWh (May 2017); INR 2.47 and 2.48 (Dec 2019)') }, { label: T('Beroperasi penuh', 'Fully operational'), nilai: '2020-03' }],
      tindakan: [T('Taman surya milik negara dengan lelang SECI per tahap; pengembang hanya menawar tarif.', 'State-owned solar park with SECI tranche auctions; developers only bid tariffs.')],
      sebab: [T(HIP + 'lahan dan evakuasi disiapkan di muka sehingga lelang kompetitif; sumber hanya melaporkan hasil lelang.', HIPE + 'land and evacuation prepared upfront so auctions were competitive; sources only report auction results.')],
      angka: [{ label: T('Rekor tarif 2017 (belum terlampaui menurut Mercom)', '2017 record tariff (not breached per Mercom)'), nilai: 2.44, d: 2, satuan: 'INR per kWh', sumber: 'bhadla2', est: false }],
      pelajaran: [T('Model taman surya siap pakai dengan lelang bertahap mengurangi risiko lahan dan jaringan bagi pengembang.', 'A ready-made solar park with staged auctions removes land and grid risk for developers.')],
      faktor: { lahan: true, ppa_tarif: true, jaringan: true, tata_kelola_pengadaan: true }, sumber: ['bhadla', 'bhadla2'] }),
    kas({ id: 'gea4', nama: 'Lelang Green Energy Auction 4 (Filipina)', jenis: 'berhasil', negara: 'PH', lokasi: T('Filipina', 'Philippines'),
      profil: [{ label: T('Target dan hasil', 'Target and result'), nilai: T('Target sekitar 10.653 MW; hasil awal 9.423 MW (88 persen), angka akhir sekitar 10.195 MW (96 persen)', 'Target about 10,653 MW; preliminary 9,423 MW (88 percent), final about 10,195 MW (96 percent)') }, { label: T('Batas harga ERC (bukan harga menang)', 'ERC price ceilings (not winning prices)'), nilai: T('PLTS tanah PHP 4,4832; atap PHP 5,68; terapung PHP 6,528; surya dengan penyimpanan PHP 5,4028 per kWh', 'Ground-mounted PHP 4.4832; rooftop PHP 5.68; floating PHP 6.528; solar with storage PHP 5.4028 per kWh') }],
      tindakan: [T('Lelang energi hijau bertahap oleh DOE dengan batas harga dari regulator, memasukkan surya tanah, terapung, atap, dan surya dengan penyimpanan.', 'Staged green energy auctions by the DOE with regulator price caps, covering ground-mounted, floating, rooftop and solar plus storage.')],
      sebab: [T(HIP + 'volume besar dengan batas harga jelas menarik penawaran 9,4 GW. Sumber tidak menyatakan faktor; harga menang per kWh tidak ditemukan.', HIPE + 'large volume with clear price caps drew 9.4 GW of bids. Sources do not state factors; winning prices per kWh were not found.')],
      angka: [{ label: T('Kapasitas dialokasikan (akhir)', 'Capacity allocated (final)'), nilai: 10195, d: 0, satuan: 'MW', sumber: 'gea4b', est: false }],
      pelajaran: [T('Lelang berskala besar bisa berjalan, tetapi keberhasilan hanya terbukti bila proyek terbangun dan beroperasi (belum ada data).', 'Large auctions can work, but success only shows when projects are built and operating (no data yet).')],
      faktor: { ppa_tarif: true, tata_kelola_pengadaan: true }, sumber: ['gea4', 'gea4b'] }),
  ];
  const gagal = [
    kas({ id: 'plts-desa-esdm', nama: 'PLTS desa bantuan pemerintah yang mati setelah serah terima', jenis: 'gagal', negara: 'ID', lokasi: T('Bengkulu, Sulawesi Tenggara, Jawa Tengah dan lainnya', 'Bengkulu, Southeast Sulawesi, Central Java and others'),
      kronologi: [
        { tanggal: '2016-02-03', teks: T('Dirjen EBTKE mengakui SDM pengelola belum siap; UP3KN menyebut alih aset ke daerah tersendat dan daerah tak punya anggaran pemeliharaan.', 'The EBTKE director general admits operators were unprepared; UP3KN says asset transfers to regions stalled and regions lacked maintenance budgets.') },
        { tanggal: '2017-12-12', teks: T('BPK: 112 proyek EBT IPP (7,25 MW, Rp 467,078 miliar) rusak, Rp 305 miliar rusak berat; total temuan 142 proyek, 27,9 MW, Rp 1,17 triliun. Artikel tidak menyatakan semuanya PLTS.', 'BPK: 112 IPP renewable projects (7.25 MW, IDR 467.078 billion) damaged, IDR 305 billion severely; total finding 142 projects, 27.9 MW, IDR 1.17 trillion. The article does not say all are solar.') },
        { tanggal: '2020-10-03', teks: T('Gajah Makmur, Mukomuko: dibangun 2016, beroperasi awal 2017, mati akhir 2017, masih mati pada September 2020; kepemilikan dan tanggung jawab perawatan tidak jelas.', 'Gajah Makmur, Mukomuko: built 2016, running early 2017, dead by end 2017, still dead in September 2020; ownership and maintenance duty unclear.') },
        { tanggal: '2026-11-02', teks: T('KPK: sebagian besar dari 629 PLTS ESDM 2023 tidak berjalan; potensi kerugian negara Rp 2,5 triliun menurut perhitungan KPK; mark-up dan kolusi TKDN; vendor terkonsentrasi pada 20 perusahaan, 4 terlibat korupsi; revitalisasi mangkrak lagi.', 'KPK: most of 629 Energy Ministry PLTS (2023) not running; potential state loss IDR 2.5 trillion per KPK; mark-ups and TKDN collusion; vendors concentrated in 20 firms, 4 involved in corruption; revitalisation stalled again.') },
      ],
      sebab: [T('Faktor yang dinyatakan sumber: SDM pengelola belum siap, alih aset tersendat, tanpa anggaran operasional daerah, tanpa koordinasi sejak awal, keluaran tidak sesuai kebutuhan PLN, tanpa interkoneksi, pengadaan terkonsentrasi.', 'Factors stated by sources: unprepared operators, stalled asset transfers, no regional operating budget, no coordination from the start, output not matching PLN needs, no interconnection, concentrated procurement.')],
      terdampak: T('Warga yang kembali ke genset solar (Rp 200 ribu sampai Rp 500 ribu per bulan di Gajah Makmur) dan negara (potensi kerugian menurut KPK). Kasus per desa bukan sampel nasional dan tidak ada temuan BPK khusus PLTS terpusat yang ditemukan.', 'Villagers returning to diesel (IDR 200k to 500k per month at Gajah Makmur) and the state (loss potential per KPK). Village cases are not a national sample and no BPK finding specific to centralised PLTS was found.'),
      seharusnya: T(HIP + 'serah terima sah hanya bila ada operator terlatih, iuran atau anggaran O&M, dan kepemilikan aset tertulis, plus pemantauan pascaserah terima; selaras dengan rekomendasi KPK (tata kelola sejak perencanaan) dan peringatan IESR untuk program Koperasi Merah Putih.', HIPE + 'handover is valid only with a trained operator, an O&M fee or budget and written asset ownership, plus post-handover monitoring; consistent with KPK advice (governance from planning) and the IESR warning on the Koperasi Merah Putih programme.'),
      tanda_bahaya: [T('Dokumen serah terima tanpa nama pengelola dan anggaran O&M', 'Handover documents without a named operator and O&M budget'), T('Pengadaan terkonsentrasi pada sedikit vendor', 'Procurement concentrated on few vendors'), T('Tidak ada rencana interkoneksi atau pemakaian listrik', 'No interconnection or load plan')],
      faktor: { pengelola_om: true, tata_kelola_pengadaan: true, jaringan: true }, sumber: ['detik2016', 'detikbpk', 'gajah', 'towea', 'karimun', 'kpk', 'iesrkop'], hak_jawab: true }),
    kas({ id: 'kubu', nama: 'PLTS Kubu, Karangasem (Bali)', jenis: 'gagal', negara: 'ID', lokasi: T('Kubu, Karangasem, Bali', 'Kubu, Karangasem, Bali'),
      kronologi: [{ tanggal: '2013-01-01', teks: T('Dibangun dengan APBN sekitar Rp 26 miliar, rancangan hingga 1 MWp di lahan sekitar 1,2 ha (tahun 2013 menurut media).', 'Built with state budget about IDR 26 billion, designed up to 1 MWp on about 1.2 ha (year 2013 per media).') }, { tanggal: '2017-01-01', teks: T('ESDM menghibahkan aset ke Pemkab Karangasem.', 'The Energy Ministry grants the asset to the Karangasem regency.') }, { tanggal: '2026-08-28', teks: T('Pengamatan lapangan: panel tertutup semak, sebagian rusak, pagar digembok, hampir tidak berfungsi.', 'Field observation: panels overgrown, some damaged, fence padlocked, almost not functioning.') }],
      sebab: [T('Belum ada OPD pemkab yang bertugas di usaha kelistrikan; rencana pengalihan ke Perusda atau Perseroda belum jalan (perlu penyertaan modal dan penilaian aset KPKNL); belum ada kerja sama B2B PLN dan Pemkab sehingga listrik tidak bisa disalurkan.', 'No regency agency has an electricity-business mandate; the plan to move it to a regional company has not started (needs capital injection and KPKNL asset valuation); no PLN to regency B2B deal so power cannot be delivered.')],
      terdampak: T('Pemkab dan warga; aset senilai Rp 26 miliar tidak menghasilkan listrik (laporan media satu kali, 31 Agu 2026).', 'The regency and residents; an IDR 26 billion asset generates no power (single media report, 31 Aug 2026).'),
      seharusnya: T(HIP + 'tetapkan pengelola dan skema jual listrik ke PLN sebelum hibah.', HIPE + 'designate an operator and a power sale scheme to PLN before the grant.'),
      tanda_bahaya: [T('Hibah aset ke pemda tanpa lembaga pengelola', 'Asset grant to a local government without a managing entity'), T('Tidak ada perjanjian jual listrik ke PLN', 'No power sale agreement with PLN')],
      faktor: { pengelola_om: true, jaringan: true, ppa_tarif: true }, sumber: ['kubu'], hak_jawab: true }),
    kas({ id: 'lelang-plts-pln', nama: 'Lelang dan kontrak IPP energi terbarukan PLN yang sepi atau batal', jenis: 'gagal', negara: 'ID', lokasi: T('Nasional dan Bali', 'National and Bali'),
      kronologi: [
        { tanggal: '2017-01-23', teks: T('PLN: tidak ada perusahaan menyerahkan dokumen tender untuk tiga proyeknya tahun sebelumnya.', 'PLN: no company submitted tender documents for three of its projects the year before.') },
        { tanggal: '2017-08-04', teks: T('Sebanyak 11 dari 64 IPP energi terbarukan mundur dari kesepakatan jual beli listrik dengan PLN; PLN membantah memaksa kontrak.', '11 of 64 renewable IPPs withdrew from power purchase deals with PLN; PLN denied forcing contracts.') },
        { tanggal: '2019-09-24', teks: T('Samindo Resources mundur dari tender PLTS 50 MW di Bali; PLN sudah melelang ulang PLTS Bali Barat dan Timur 25 MW sejak Maret 2019.', 'Samindo Resources withdrew from the 50 MW Bali solar tender; PLN had re-tendered Bali West and East 25 MW each since March 2019.') },
        { tanggal: '2023-11-14', teks: T('ESDM menyoroti lambannya lelang PLTS PLN; salah satu sebab, tarif sulit disepakati dengan pengembang.', 'The Energy Ministry flags slow PLN solar tenders; one cause is tariffs hard to agree with developers.') },
      ],
      sebab: [T('Faktor yang dinyatakan sumber: klausul PPA dan tarif sulit disepakati, syarat pengalaman IPP PLTS. Sumber tidak menyajikan data pembatalan resmi; kasus ini kumpulan laporan media.', 'Factors stated by sources: PPA clauses and tariffs hard to agree, IPP solar experience requirement. Sources do not present official cancellation data; this case is a collection of media reports.')],
      terdampak: T('PLN, pengembang yang gugur, dan daerah yang menunggu pembangkit pengganti diesel.', 'PLN, developers who dropped out, and regions waiting for diesel-replacing plants.'),
      seharusnya: T(HIP + 'PPA standar dengan alokasi risiko yang bisa dibiayai bank dan tarif yang disepakati sebelum tender (bandingkan perbaikan PPA Mesir putaran 2).', HIPE + 'a standard PPA with bankable risk allocation and tariffs agreed before tendering (compare the Egypt round 2 PPA fixes).'),
      tanda_bahaya: [T('Tender tanpa satu pun peserta', 'A tender with no participants'), T('Peserta kualifikasi mundur menjelang kontrak', 'Qualified bidders withdrawing before contract')],
      faktor: { ppa_tarif: true, pendanaan: true, tata_kelola_pengadaan: true }, sumber: ['lelang17', 'lelang17b', 'samindo', 'lelang23'], hak_jawab: true }),
    kas({ id: 'vn-fit', nama: 'Ledakan FiT surya Vietnam 2019 sampai 2020 dan sengketa FiT', jenis: 'gagal', negara: 'VN', lokasi: T('Vietnam', 'Vietnam'),
      kronologi: [
        { tanggal: '2017-04-11', teks: T('Keputusan 11/2017/QD-TTg menetapkan FiT surya USD 9,35 sen per kWh selama 20 tahun untuk proyek beroperasi sebelum 30 Jun 2019.', 'Decision 11/2017/QD-TTg sets a solar FiT of USD 9.35 cents per kWh for 20 years for projects operating by 30 Jun 2019.') },
        { tanggal: '2019-06-30', teks: T('Sekitar 4,46 GW (82 pembangkit) terhubung pada tenggat; akhir 2019 sebagian proyek selatan mengalami kurtailmen harian hingga 80 persen (firma hukum).', 'About 4.46 GW (82 plants) connected by the deadline; late 2019 some southern projects saw daily curtailment up to 80 percent (law firm).') },
        { tanggal: '2023-12-01', teks: T('Audit Inspektorat Pemerintah: 14 proyek di Ninh Thuan menerima FiT tertinggi secara tidak tepat (akhir 2023).', 'Government Inspectorate audit: 14 Ninh Thuan projects wrongly received the top FiT (late 2023).') },
        { tanggal: '2025-07-01', teks: T('Investor menolak potensi pemotongan FiT retroaktif untuk proyek COD sebelum atau selama 2021 (sekitar 12 GW surya dan bayu menurut satu sumber); hasil akhir tidak terkonfirmasi.', 'Investors protest possible retroactive FiT cuts for projects with COD before or during 2021 (about 12 GW solar and wind per one source); final outcome unconfirmed.') },
      ],
      sebab: [T('Faktor menurut sumber: transmisi tertinggal dari ledakan kapasitas, kebijakan berbalik antara kementerian dan kantor PM, sengketa tafsir kelayakan FiT.', 'Factors per sources: transmission lagged the capacity boom, policy reversals between the ministry and PM office, FiT eligibility disputes.')],
      terdampak: T('Investor domestik dan asing, pemberi pinjaman, dan EVN sebagai pembeli.', 'Domestic and foreign investors, lenders and EVN as buyer.'),
      seharusnya: T(HIP + 'sinkronkan tenggat FiT dengan kesiapan transmisi dengan kuota bertahap; aturan penurunan tarif tidak berlaku surut.', HIPE + 'sync FiT deadlines with grid readiness using staged quotas; no retroactive tariff reductions.'),
      tanda_bahaya: [T('Tenggat FiT pendek dengan volume jauh di atas kapasitas jaringan', 'Short FiT deadline with volume far above grid capacity'), T('Kementerian menafsirkan kelayakan tarif secara berbeda', 'Ministries interpreting tariff eligibility differently')],
      faktor: { ppa_tarif: true, jaringan: true, kepastian_kebijakan: true, tata_kelola_pengadaan: true }, sumber: ['vnwiki', 'vnallens', 'vnvir'], hak_jawab: true }),
    kas({ id: 'es-retro', nama: 'Pemotongan retroaktif tarif energi terbarukan Spanyol', jenis: 'gagal', negara: 'ES', lokasi: T('Spanyol', 'Spain'),
      kronologi: [
        { tanggal: '2008-12-31', teks: T('Spanyol menambah rekor 2,6 GW PV pada 2008 hingga 3,5 GW.', 'Spain adds a record 2.6 GW PV in 2008 to reach 3.5 GW.') },
        { tanggal: '2010-12-31', teks: T('Pemerintah memotong subsidi proyek surya yang sudah ada secara retroaktif; asosiasi PV memperingatkan ratusan operator bisa bangkrut.', 'The government retroactively cuts subsidies for existing solar; the PV association warns hundreds of operators could go bankrupt.') },
        { tanggal: '2017-05-04', teks: T('ICSID (Eiser v Spain): perubahan 2013 melanggar Energy Charter Treaty, sekitar EUR 128 juta.', 'ICSID (Eiser v Spain): the 2013 changes breached the Energy Charter Treaty, about EUR 128 million.') },
        { tanggal: '2019-06-06', teks: T('ICSID: NextEra menang EUR 290,4 juta; Spanyol dilaporkan menempuh pembatalan alih-alih membayar.', 'ICSID: NextEra wins EUR 290.4 million; Spain reportedly pursued annulment rather than paying.') },
      ],
      sebab: [T('Faktor menurut sumber: ledakan kapasitas di bawah tarif tetap tinggi lalu tarif yang dijanjikan dipotong. Detail defisit tarif tidak ada di sumber yang dibaca.', 'Factors per sources: a capacity boom under high fixed tariffs followed by cuts to promised tariffs. Tariff deficit detail is not in the sources read.')],
      terdampak: T('Investor PV dan CSP (lebih dari 40 kasus sengketa dilaporkan 2017) dan kreditur.', 'PV and CSP investors (over 40 dispute cases reported in 2017) and lenders.'),
      seharusnya: T(HIP + 'kuota tahunan dan degresi tarif otomatis di muka agar tarif yang dikunci tidak perlu dipotong.', HIPE + 'annual caps and automatic upfront tariff degression so locked tariffs need not be cut.'),
      tanda_bahaya: [T('Tarif tetap tanpa kuota dan tanpa degresi', 'Fixed tariff without cap or degression'), T('Defisit pembeli listrik melebar', 'Widening buyer deficit')],
      faktor: { ppa_tarif: true, pendanaan: true, kepastian_kebijakan: true }, sumber: ['eswiki', 'eiser', 'nextera'], hak_jawab: true }),
  ];
  bab['39'] = { tipe: 'kasus', sumber: sm('masdar', 'ebrd', 'dhafra', 'bhadla', 'gea4', 'ikn'), catatan: T('Biaya dan tarif yang tidak ditemukan di sumber sengaja dikosongkan. Sumba (ADB 2013) belum menjadi kasus karena hasil 2025 dan kapasitas hibrida tidak ditemukan; program 1000 pulau tidak ditemukan sumbernya.', 'Costs and tariffs not found in sources are deliberately blank. Sumba (ADB 2013) is not yet a case because 2025 results and hybrid capacity were not found; no source found for the 1000-island programme.'), butir: mercusuar };
  bab['40'] = { tipe: 'kasus', sumber: sm('kpk', 'vnallens', 'eiser'), catatan: T('Hak jawab: pihak yang disebut dapat mengirim koreksi lewat formulir koreksi platform.', 'Right of reply: named parties can send corrections through the platform correction form.'), butir: gagal };
  bab['41'] = { tipe: 'pola', sumber: sm('ed'), catatan: T('Sel dibangun dari bendera faktor tiap kasus; pemetaan faktor ke kasus adalah analisis METI (Hipotesis) atas fakta di bab 39 dan 40.', 'Cells are built from each case factor flags; mapping factors to cases is METI analysis (Hypothesis) on facts in chapters 39 and 40.'),
    faktor: [['lahan', 'Lahan dan lokasi siap', 'Land and site ready'], ['perizinan', 'Perizinan jelas', 'Permitting clear'], ['ppa_tarif', 'PPA dan tarif disepakati', 'PPA and tariff agreed'], ['pendanaan', 'Pendanaan dan penjaminan', 'Financing and guarantees'], ['jaringan', 'Jaringan dan interkoneksi', 'Grid and interconnection'], ['pengelola_om', 'Pengelola dan O&M', 'Operator and O&M'], ['kepastian_kebijakan', 'Kepastian kebijakan', 'Policy certainty'], ['tata_kelola_pengadaan', 'Tata kelola pengadaan', 'Procurement governance']].map(([k, a, e]) => ({ k, l: T(a, e) })) };
  const L = (k, a, e) => ({ k, l: T(a, e) });
  const dasar = (peran, tahap, id, en, s) => ({ peran, tahap, teks: T(id, en), dasar: s });
  bab['42'] = { tipe: 'periksa', sumber: sm('ed'),
    peran: [L('pengembang', 'Pengembang', 'Developer'), L('investor', 'Investor', 'Investor'), L('pemda', 'Pemerintah daerah', 'Local government'), L('pusat', 'Pemerintah pusat', 'Central government'), L('pln', 'PLN', 'PLN'), L('meti', 'METI', 'METI')],
    tahap: [L('lokasi', 'Penyaringan lokasi', 'Site screening'), L('izin', 'Perizinan', 'Permitting'), L('ppa', 'PPA', 'PPA'), L('dana', 'Pendanaan', 'Financing'), L('bangun', 'Konstruksi', 'Construction'), L('operasi', 'Operasi', 'Operation')],
    butir: [
      dasar('pengembang', 'lokasi', 'Pertimbangkan permukaan waduk eksisting yang sudah punya transmisi dan pembeli (contoh Cirata).', 'Consider existing reservoir surfaces that already have transmission and a buyer (Cirata example).', 'masdar'),
      dasar('pengembang', 'lokasi', 'Cek PVOUT lokasi di Global Solar Atlas sebelum studi kelayakan.', 'Check site PVOUT in the Global Solar Atlas before the feasibility study.', 'gsa'),
      dasar('pengembang', 'dana', 'Pertimbangkan penjaminan risiko politik dan pembiayaan bersama lembaga pembangunan (contoh Benban).', 'Consider political risk cover and development-bank co-lending (Benban example).', 'ebrd'),
      dasar('pengembang', 'bangun', 'Hitung TKDN modul sesuai Permenperin 34/2024 sejak desain.', 'Calculate module local content under Industry Ministry Reg. 34/2024 from design.', 'tkdn'),
      dasar('pengembang', 'operasi', 'Tunjuk operator terlatih dan anggaran O&M tertulis sebelum serah terima.', 'Name a trained operator and a written O&M budget before handover.', 'detik2016'),
      dasar('investor', 'ppa', 'Periksa klausul perubahan hukum dan perlindungan investasi (Spanyol, Vietnam).', 'Check change-in-law clauses and investment protection (Spain, Vietnam).', 'eiser'),
      dasar('investor', 'dana', 'Tanyakan alokasi risiko kurtailmen dalam PPA.', 'Ask how curtailment risk is allocated in the PPA.', 'vnallens'),
      dasar('pemda', 'operasi', 'Catat kepemilikan aset dan alokasikan anggaran pemeliharaan sebelum menerima alih aset.', 'Record asset ownership and allocate maintenance budget before accepting a transfer.', 'detik2016'),
      dasar('pemda', 'lokasi', 'Tetapkan lembaga pengelola dan skema jual listrik ke PLN sebelum menerima hibah (kasus Kubu).', 'Designate a managing entity and a power sale scheme to PLN before accepting a grant (Kubu case).', 'kubu'),
      dasar('pusat', 'ppa', 'Sinkronkan tenggat insentif dengan kesiapan jaringan; hindari perubahan tarif surut.', 'Align incentive deadlines with grid readiness; avoid retroactive tariff changes.', 'vnallens'),
      dasar('pusat', 'bangun', 'Cegah konsentrasi vendor dan periksa kolusi TKDN sejak perencanaan (rekomendasi KPK: ETGF).', 'Prevent vendor concentration and check TKDN collusion from planning (KPK: ETGF).', 'kpk'),
      dasar('pln', 'ppa', 'Selesaikan PPA standar dan tarif sebelum tender agar lelang tidak sepi.', 'Finalise a standard PPA and tariff before tendering so auctions are not empty.', 'lelang23'),
      dasar('pln', 'bangun', 'Pastikan rencana interkoneksi dan kebutuhan keluaran sebelum proyek dibangun.', 'Confirm the interconnection plan and output needs before construction.', 'kpk'),
      dasar('meti', 'operasi', 'Pantau PLTS yang diserahterimakan dan beri ruang hak jawab bagi pihak yang disebut.', 'Monitor handed-over plants and give named parties a right of reply.', 'ed'),
    ] };
  return {
    id: 'surya', versi: 2, diperbarui: TGL, judul: T('Surya', 'Solar'),
    lead: T('PLTS skala utilitas, atap, terapung, dan hibrida desa: angka Indonesia, aturan, benchmark, dan pelajaran dari proyek berhasil dan gagal.', 'Utility-scale, rooftop, floating and village hybrid solar: Indonesia figures, rules, benchmarks and lessons from successful and failed projects.'),
    kunci,
    penting: [
      T(`Kapasitas surya ${k25.kapasitas_mw} MW (${k25.tahun}) baru ${idn.bauran_listrik_persen.surya.nilai} persen listrik (2024).`, `Solar capacity of ${k25.kapasitas_mw} MW (${k25.tahun}) is only ${idn.bauran_listrik_persen.surya.nilai} percent of electricity (2024).`),
      T('PLTS atap kini berkuota dan ekspor ke jaringan tidak dibayar (Permen ESDM 2/2024).', 'Rooftop solar is now quota-based and exports to the grid are unpaid (Energy Ministry Reg. 2/2024).'),
      T('Proyek besar berhasil bila PPA, jaringan, dan pengelola jelas; mangkrak bila serah terima tanpa pengelola dan anggaran O&M.', 'Large projects succeed with clear PPA, grid and operators; they stall when handed over without an operator and O&M budget.'),
    ],
    posisi: T(`Porsi surya listrik Indonesia ${idn.bauran_listrik_persen.surya.nilai} persen berada di dasar ASEAN, jauh di bawah Vietnam (${vn.bauran_listrik_persen.surya.nilai} persen).`, `Indonesia's solar share of ${idn.bauran_listrik_persen.surya.nilai} percent is near the bottom of ASEAN, far below Vietnam (${vn.bauran_listrik_persen.surya.nilai} percent).`),
    sumber: Object.fromEntries(Object.entries(SUMBER).filter(([id]) => JSON.stringify({ kunci, bab }).includes(`"${id}"`)).map(([id, s]) => [id, s])),
    bab,
  };
}

export function validasi(d) {
  const err = [];
  const SID = new Set(Object.keys(d.sumber));
  const kar = /[—·→←]/;
  const cekT = (t, p) => { if (!t || typeof t.id !== 'string' || typeof t.en !== 'string' || !t.id || !t.en) err.push('teks id/en ' + p); };
  const cekS = (arr, p) => (arr || []).forEach((s) => { if (!SID.has(s)) err.push('sumber ' + s + ' di ' + p); });
  if (d.kunci.length !== 5) err.push('kunci != 5');
  d.kunci.forEach((k, i) => { cekT(k.label, 'kunci' + i); if (!SID.has(k.sumber)) err.push('sumber kunci ' + i); });
  d.penting.forEach((t, i) => cekT(t, 'penting' + i)); cekT(d.posisi, 'posisi'); cekT(d.lead, 'lead');
  for (const [n, b] of Object.entries(d.bab)) {
    if (!(+n >= 2 && +n <= 42)) err.push('nomor bab ' + n);
    cekS(b.sumber, 'bab' + n);
    if (!b.sumber?.length) err.push('bab tanpa sumber ' + n);
    for (const x of b.butir || []) {
      for (const f of ['t', 'j', 'istilah', 'arti', 'judul', 'isi', 'teks']) if (x[f] && typeof x[f] === 'object' && !('id' in x[f] && 'en' in x[f]) && f !== 'judul') err.push('bentuk ' + n);
      if (b.tipe === 'kasus') {
        cekT({ id: x.nama, en: x.nama }, x.id);
        if (!x.sumber?.length) err.push('kasus tanpa sumber ' + x.id); cekS(x.sumber, x.id);
        if (b.tipe === 'kasus' && n === '40' && x.hak_jawab !== true) err.push('hak_jawab ' + x.id);
        for (const a of x.angka || []) if (!SID.has(a.sumber)) err.push('angka tanpa sumber ' + x.id);
        for (const f of ['tindakan', 'sebab', 'pelajaran', 'tanda_bahaya']) (x[f] || []).forEach((t) => cekT(t, x.id + f));
        (x.kronologi || []).forEach((k) => cekT(k.teks, x.id + 'kron'));
        if (n === '39' && !x.pelajaran?.length) err.push('pelajaran ' + x.id);
      }
      if (b.tipe === 'periksa' && !SID.has(x.dasar)) err.push('dasar periksa');
    }
    (b.paragraf || []).forEach((t) => cekT(t, 'par' + n));
  }
  if (kar.test(JSON.stringify(d))) err.push('karakter terlarang (em dash, titik tengah, panah)');
  for (const [id, s] of Object.entries(d.sumber)) if (id !== 'ed' && (!/^https:\/\//.test(s.url) || !s.tanggal || !s.bukti)) err.push('sumber cacat ' + id);
  return err;
}

export function selftest() {
  const d = susun(); const e = validasi(d);
  if (e.length) throw new Error(e.join('\n'));
  const b = structuredClone(d); b.bab['2'].sumber = ['tak-ada'];
  if (!validasi(b).length) throw new Error('validasi tidak menangkap sumber palsu');
  const c = structuredClone(d); c.penting[0].id = 'a — b';
  if (!validasi(c).length) throw new Error('validasi tidak menangkap em dash');
  return d;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) { selftest(); console.log('selftest ok'); }
  else {
    const d = susun(); const e = validasi(d); if (e.length) { console.error(e.join('\n')); process.exit(1); }
    fs.writeFileSync(path.join(akar, 'public/data/topik/surya.json'), JSON.stringify(d, null, 1) + '\n');
    console.log(`bab naskah ${Object.keys(d.bab).length}/41 (+bab 1); mercusuar ${d.bab['39'].butir.length}; gagal ${d.bab['40'].butir.length}; sumber ${Object.keys(d.sumber).length}`);
  }
}
