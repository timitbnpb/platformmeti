#!/usr/bin/env node
// Naskah topik Bayu (angin: PLTB darat dan lepas pantai) -> public/data/topik/bayu.json, skema docs/perencanaan/TOPIK-SKEMA.md.
// Tabel yang bisa dihitung dibangun dari berkas repo (peluang, proyek, ruptl, statistik_pln, kapasitas_tren, ember_bulanan,
// biaya_listrik, asean_energi, konsultasi); teks dan kasus ditulis tangan dari sumber yang dibaca 8 Nov 2026 (lihat peta SUMBER).
// Sintesis buatan sendiri diberi label "Analisis METI (Hipotesis)". Tanpa jaringan saat bangun: sumber web sudah dibaca dan dicatat di sini.
// Pakai: node scripts/pipa/topik_bayu.mjs [--selftest]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DATA = new URL('../../public/data/', import.meta.url);
const baca = (n) => JSON.parse(readFileSync(new URL(n, DATA), 'utf8'));
const t = (id, en) => ({ id, en });
const HARI = '2026-11-08';
const LBL = t('Analisis METI (Hipotesis): ', 'METI analysis (Hypothesis): ');
const H = (id, en) => t(LBL.id + id, LBL.en + en);
const ID_ISO = (x) => Number(x.toFixed(2));
const k = (x) => String(x).replace('.', ',');

/* ---------- peta sumber ---------- */
const S = (judul, penerbit, url, tanggal, tahun, bukti, lisensi) => ({ judul, penerbit, url, tanggal, tahun, bukti, ...(lisensi ? { lisensi } : {}) });
const peluang0 = baca('peluang.json'), ruptl0 = baca('ruptl.json'), stat0 = baca('statistik_pln.json'), kap0 = baca('kapasitas_tren.json');
const URL_HEESI = peluang0.sumber.find((s) => s.id === 'heesi2025').url;
const URL_RUPTL = ruptl0.sumber.find((s) => s.id === 'ruptl-2025').url;
export const SUMBER = {
  etp1: S('Roadmap Onshore Wind Energy Development in Indonesia v5.0 (13 Des 2023)', 'Energy Transition Partnership (inisiatif Kementerian ESDM, dikelola UNOPS)', 'https://www.energytransitionpartnership.org/wp-content/uploads/2024/09/20240919-Roadmap-Onshore-Wind-Energy-v5.0-EN.pdf', HARI, 2023, 'kajian'),
  etp2: S('Wind Energy Development in Indonesia: Investment Plan, Final Report v2.0 (23 Sep 2024)', 'Energy Transition Partnership', 'https://www.energytransitionpartnership.org/wp-content/uploads/2024/09/20240906-Final-Report-Wind-Energy-Development-in-Indonesia-Investment-Plan-v2.0.pdf', HARI, 2024, 'kajian'),
  ruen: S('Perpres 22/2017 tentang Rencana Umum Energi Nasional (Lampiran I, Tabel 46 potensi bayu per provinsi)', 'Pemerintah RI', 'https://peraturan.bpk.go.id/Details/68772', '2026-11-07', 2017, 'resmi'),
  p112: S('Perpres 112/2022 tentang Percepatan Pengembangan Energi Terbarukan untuk Penyediaan Tenaga Listrik (Lampiran I dan II)', 'Pemerintah RI', 'https://peraturan.bpk.go.id/Details/225308', '2026-11-07', 2022, 'resmi'),
  ruptl: S('RUPTL PLN 2025-2034 (Kepmen ESDM 188.K/TL.03/MEM.L/2025, 26 Mei 2025), tabel proyek bayu', 'PT PLN (Persero); disahkan Kementerian ESDM', URL_RUPTL, '2026-11-07', 2025, 'resmi'),
  stat: S('Statistik Ketenagalistrikan 2024 (kapasitas terpasang dan produksi PLN per provinsi)', 'Ditjen Ketenagalistrikan, Kementerian ESDM', stat0.url, '2026-11-07', 2024, 'resmi', 'publikasi pemerintah terbuka; hanya angka'),
  heesi: S('Handbook of Energy and Economic Statistics of Indonesia 2025, Tabel 6.4.9', 'Kementerian ESDM', URL_HEESI, '2026-11-07', 2025, 'resmi'),
  irena: S('IRENASTAT Renewable Energy Statistics 2026, Indonesia (kapasitas bayu darat)', 'International Renewable Energy Agency (IRENA)', 'https://pxweb.irena.org/pxweb/en/IRENASTAT/IRENASTAT__Power%20Capacity%20and%20Generation/', HARI, 2026, 'resmi', 'bebas dipakai dengan atribusi IRENASTAT'),
  ember: S('Ember Yearly Electricity Data, baris Indonesia, sumber listrik Wind', 'Ember', 'https://ember-energy.org/data/yearly-electricity-data/', '2026-11-07', 2025, 'kajian', 'CC BY 4.0'),
  owid: S('Levelized cost of energy (IRENA Renewable Power Generation Costs), diolah Our World in Data; USD harga tetap 2025', 'Our World in Data / IRENA', 'https://ourworldindata.org/grapher/levelized-cost-of-energy', HARI, 2025, 'via-pihak-ketiga', 'CC BY 4.0'),
  owid_bauran: S('Our World in Data energy-data (Ember Yearly Electricity Data), porsi angin dalam bauran listrik', 'Our World in Data / Ember', 'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv', HARI, 2025, 'via-pihak-ketiga', 'CC BY 4.0'),
  gem: S('Global Wind Power Tracker 2026-02', 'Global Energy Monitor', 'https://globalenergymonitor.org/projects/global-wind-power-tracker/', '2026-11-08', 2026, 'kajian', 'CC BY 4.0'),
  esdm_sidrap: S('PLTB Sidrap: Proyek Energi untuk Masyarakat, Pemerintah dan Investor (2 Sep 2019)', 'Ditjen EBTKE, Kementerian ESDM', 'https://www.esdm.go.id/id/berita-unit/direktorat-jenderal-ebtke/pltb-sidrap-proyek-energi-untuk-masyarakat-pemerintah-dan-investor', HARI, 2019, 'resmi'),
  esdm_tolo: S('PLTB Tolo Sukses Beroperasi Komersial, Tahap II Siap Dikembangkan (6 Sep 2019)', 'Kementerian ESDM', 'https://esdm.go.id/en/media-center/news-archives/pltb-tolo-sukses-beroperasi-komersial-tahap-ii-siap-dikembangkan', HARI, 2019, 'resmi'),
  adb_tolo: S('The Tolo Wind Power Project represents a new frontier in Indonesia\'s quest to increase renewable energy generation (hanya judul dibaca)', 'Asian Development Bank', 'https://www.adb.org/node/516476', HARI, null, 'resmi'),
  gn_sidrap: S('Bersiap Memetik Angin di Kebun Angin Terbesar di Indonesia', 'Good News from Indonesia', 'https://www.goodnewsfromindonesia.id/indonesiana/iptek/bersiap-memetik-angin-di-kebun-angin-terbesar-di-indonesia', HARI, 2018, 'media'),
  bisnis_sidrap: S('Profil PLTB Sidrap yang Mau Diakuisisi BREN, Investasi Rp2,3 Triliun (8 Des 2023)', 'Bisnis.com', 'https://market.bisnis.com/read/20231208/192/1722287/profil-pltb-sidrap-yang-mau-diakuisisi-bren-investasi-rp23-triliun', HARI, 2023, 'media'),
  bt_tl: S('Bayang-bayang terminasi pembangkit angin Total Alamtri (ADRO) (1 Jul 2025)', 'Bloomberg Technoz', 'https://www.bloombergtechnoz.com/detail-news/75713/bayang-bayang-terminasi-pembangkit-angin-total-alamtri-adro', HARI, 2025, 'media'),
  bisnis_tl: S('Total Eren & Adaro Pasok Listrik Tenaga Angin ke PLN, Termurah Dalam Sejarah (16 Nov 2022)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20221116/44/1598936/total-eren-adaro-pasok-listrik-tenaga-angin-ke-pln-termurah-dalam-sejarah', HARI, 2022, 'media'),
  li_tl: S('PLN, Total Eren, Adaro Power, PJBI Tandatangani PJBTL PLTB dengan Teknologi BESS Pertama di Indonesia (Mei 2023)', 'Listrik Indonesia', 'https://listrikindonesia.com/detail/10980/pln-total-eren-adaro-power-pjbi-tandatangani-pjbtl-pltb-dengan-teknologi-bess-pertama-di-indonesia', HARI, 2023, 'media'),
  pm_tl: S('Tanah Laut wind power project delayed amid permitting setbacks (isi berbayar; hanya judul dibaca)', 'Petromindo', 'https://www.petromindo.com/news/article/tanah-laut-wind-power-project-delayed-amid-permitting-setbacks', HARI, null, 'media'),
  mongabay_np: S('Refleksi dari Monumen Kegagalan Proyek Energi Bersih di Bali (26 Okt 2020)', 'Mongabay Indonesia', 'https://www.mongabay.co.id/2020/10/26/refleksi-dari-monumen-kegagalan-proyek-energi-bersih-di-bali/', HARI, 2020, 'media'),
  esdm_pandan: S('Tamasya Energi Hibrida di Daerah Istimewa (tanggal artikel tidak terbaca)', 'Kementerian ESDM', 'https://esdm.go.id/id/media-center/arsip-berita/tamasya-energi-hibrida-di-daerah-istimewa', HARI, null, 'resmi'),
  antara_sk: S('Pemkab Sukabumi dukung penambahan kuota kapasitas PLTB dari 60 MW jadi 150 MW (6 Jun 2023)', 'ANTARA Megapolitan', 'https://megapolitan.antaranews.com/berita/245658/pemkab-sukabumi-dukung-penambahan-kuota-kapasitas-pltb-dari-60-mw-jadi-150-mw', HARI, 2023, 'media'),
  iir_sk: S('UPC Renewables negotiates PPA for Sukabumi windfarm in Indonesia (30 Nov 2022)', 'Industrial Info Resources', 'https://www.industrialinfo.com/news/article/upc-renewables-negotiates-ppa-for-sukabumi-windfarm-in-indonesia--316223', HARI, 2022, 'media'),
  wiki_ltwp: S('Lake Turkana Wind Power', 'Wikipedia (ringkasan berbagai laporan media Kenya)', 'https://en.wikipedia.org/wiki/Lake_Turkana_Wind_Power', HARI, 2025, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  ea_ltwp: S('Kenyans face higher bills over $54m fine in stalled wind power line project (hanya judul dibaca)', 'The EastAfrican', 'https://www.theeastafrican.co.ke/tea/business-tech/kenyans-face-higher-bills-over-54m-fine-in-stalled-wind-power-line-project-1375976', HARI, null, 'media'),
  vnexpress: S('Wind power investors claim bankruptcy looms without incentive tariffs (6 Jan 2022)', 'VnExpress International', 'https://e.vnexpress.net/news/business/industries/wind-power-investors-claim-bankruptcy-looms-without-incentive-tariffs-4412885.html', HARI, 2022, 'media'),
  aljaz: S("After renewables frenzy, Vietnam's solar energy goes to waste (18 Mei 2022)", 'Al Jazeera', 'https://www.aljazeera.com/economy/2022/5/18/after-renewables-push-vietnam-has-too-much-energy-to-handle', HARI, 2022, 'media'),
  orsted23: S('Orsted ceases development of its US offshore wind projects Ocean Wind 1 and 2 (1 Nov 2023)', 'Orsted A/S', 'https://orsted.com/en/company-announcement-list/2023/10/oersted-ceases-development-of-its-us-offshore-wind-73751', HARI, 2023, 'resmi'),
  ci_h4: S('Danes cancel Hornsea 4 (8 Mei 2025)', 'Construction Index', 'https://www.theconstructionindex.co.uk/news/view/danes-cancel-hornsea-4', HARI, 2025, 'media'),
  cms_ar6: S('UK Government publishes results to the Contract for Difference Allocation Round Six', 'CMS Law', 'https://cms.law/en/gbr/legal-updates/uk-government-publishes-results-to-the-contract-for-difference-allocation-round-six', HARI, 2024, 'via-pihak-ketiga'),
  rw_india: S('Lowest bid of Rs 2.44 per kWh discovered in SECI wind auction (6 Mar 2018)', 'Renewable Watch', 'https://renewablewatch.in/2018/03/06/lowest-bid-rs-2-44-per-kwh-discovered-seci-wind-auction', HARI, 2018, 'media'),
  gem_chai: S('Chaiyaphum wind farm (EGCO)', 'Global Energy Monitor wiki', 'https://gem.wiki/Chaiyaphum_wind_farm', HARI, 2026, 'kajian', 'CC BY 4.0'),
  twp_th: S('Thailand wind power statistics', 'The Wind Power', 'https://www.thewindpower.net/country_en_102_thailand.php', HARI, 2026, 'via-pihak-ketiga'),
  pvtech_cl: S('Chile curtailed 6TWh of solar PV and wind power in 2024', 'PV Tech', 'https://www.pv-tech.org/chile-curtailed-6twh-of-solar-pv-and-wind-power-in-2024/', HARI, 2025, 'media'),
  gwec: S('Global Wind Report 2025', 'Global Wind Energy Council (GWEC)', 'https://www.gwec.net/reports/globalwindreport/2025', HARI, 2025, 'kajian'),
  irena_cost: S('Renewable Power Generation Costs in 2024 (angka dibaca dari ringkasan pihak ketiga, bukan PDF primer)', 'IRENA', 'https://www.irena.org/Publications/2025/Jun/Renewable-Power-Generation-Costs-in-2024', HARI, 2025, 'via-pihak-ketiga'),
  katadata277: S('Indonesia Miliki 277 GW Potensi Energi Angin Lepas Pantai yang Belum Tersentuh (mengutip Bank Dunia)', 'Katadata', 'https://katadata.co.id/ekonomi-hijau/energi-baru/6a27fd9abe1b4/indonesia-miliki-277-gw-potensi-energi-angin-lepas-pantai-yang-belum-tersentuh', HARI, 2026, 'media'),
  esmap: S('Offshore Wind Technical Potential: Analysis and Maps (peta Indonesia)', 'ESMAP, Bank Dunia', 'https://esmap.org/esmap_offshorewind_techpotential_analysis_maps', HARI, 2020, 'resmi'),
  iesr: S("Unlocking Indonesia's Renewables Future: The Economic Case of 333 GW of Solar, Wind, and Hydro (Feb 2025; ringkasan di Pustaka METI)", 'Institute for Essential Services Reform (IESR)', 'https://iesr.or.id/', '2026-11-07', 2025, 'kajian'),
  konsul: S('Berita: METI minta RUU EBET segera disahkan (arsip Konsultasi METI)', 'Liputan6', 'https://www.liputan6.com/bisnis/read/6312024/meti-minta-ruu-ebet-segera-disahkan', '2026-11-08', 2026, 'media'),
  perm30: S('Permen ESDM 30/2006 tentang standar kompetensi tenaga teknik pembangkitan EBT termasuk PLTB (status dicabut menurut basis regulasi METI)', 'Kementerian ESDM', 'https://peraturan.bpk.go.id/Details/143855', '2026-11-07', 2006, 'resmi'),
  meti: S('Analisis METI (Hipotesis): sintesis dari sumber-sumber di naskah ini, bukan fakta terverifikasi', 'Jaringan METI', 'https://platformmeti.timitbnpb.workers.dev', HARI, 2026, 'editorial'),
};

/* ---------- angka turunan dari berkas repo ---------- */
const sul = stat0.baris.find((b) => b.provinsi === 'Sulawesi Selatan');
const prodSul = sul.produksi_pln_gwh.PLTB, kapSul = sul.kapasitas_terpasang_mw.PLTB;
const totProd = Object.entries(sul.produksi_pln_gwh).filter(([k]) => k !== 'total').reduce((a, [, v]) => a + (v || 0), 0);
const fkSul = ID_ISO((prodSul / (kapSul * 8.76)) * 100);
const pangsaProdSul = ID_ISO((prodSul / totProd) * 100);
const pangsaKapSul = ID_ISO((kapSul / sul.kapasitas_terpasang_mw.total) * 100);
const bayuIrena = Object.fromEntries(kap0.baris.filter((b) => b.teknologi === 'bayu').map((b) => [b.tahun, b.kapasitas_mw]));
const ember = baca('ember_bulanan.json').baris.filter((b) => b.sumber_listrik === 'Wind').reduce((a, b) => ({ ...a, [b.tahun]: b.generasi_twh }), {});
const kap2024 = bayuIrena[2024];
const gen2024 = ember[2024] * 1000;
const fkNas2024 = ID_ISO((gen2024 / (kap2024 * 8.76)) * 100);
const capexSidrap = ID_ISO(150 / 75);
const gwhSidrap = ID_ISO(75 * 8.76 * (fkSul / 100));
const rpSidrapUsd = ID_ISO(gwhSidrap * 0.11);

/* ---------- tabel dinamis ---------- */
function tabelAtlas() {
  const ukur = { 'Jawa Barat': 'Sukabumi 7,0 m/s', 'Sulawesi Selatan': 'Bantaeng 4,66 m/s', 'Sulawesi Utara': 'Pulau Sangihe 6,4 m/s', Papua: 'Jayapura 3,05 m/s' };
  const ukurEn = { 'Jawa Barat': 'Sukabumi 7.0 m/s', 'Sulawesi Selatan': 'Bantaeng 4.66 m/s', 'Sulawesi Utara': 'Sangihe Island 6.4 m/s', Papua: 'Jayapura 3.05 m/s' };
  const lapan = new Set(['Nusa Tenggara Timur', 'Nusa Tenggara Barat', 'Sulawesi Selatan']);
  const baris = peluang0.baris.filter((b) => b.potensi.bayu.mw != null).sort((a, z) => z.potensi.bayu.mw - a.potensi.bayu.mw).map((b) => {
    const pot = b.potensi.bayu.mw, ter = b.terpasang.bayu.mw ?? 0;
    return {
      provinsi: b.nama, potensi_mw: pot, terpasang_mw: ter, rasio_persen: ter > 0 ? ID_ISO((ter / pot) * 100) : 0,
      terukur: ukur[b.nama] ? t(ukur[b.nama], ukurEn[b.nama]) : t('belum ada ukuran terbuka', 'no open measurement'),
      lapan: lapan.has(b.nama) ? t('di atas 5 m/s', 'above 5 m/s') : t('-', '-'),
    };
  });
  return {
    tipe: 'tabel', per: 10,
    kolom: [
      { k: 'provinsi', l: t('Provinsi', 'Province') }, { k: 'potensi_mw', l: t('Potensi RUEN (MW)', 'RUEN potential (MW)'), num: true, d: 0 },
      { k: 'terpasang_mw', l: t('Terpasang 2025 (MW)', 'Installed 2025 (MW)'), num: true, d: 2 }, { k: 'rasio_persen', l: t('Terpasang / potensi (persen, EST)', 'Installed / potential (percent, EST)'), num: true, d: 2 },
      { k: 'terukur', l: t('Ukuran angin terbuka (30-50 m, 2017)', 'Open wind measurement (30-50 m, 2017)') }, { k: 'lapan', l: t('Indikasi LAPAN (rata-rata tahunan)', 'LAPAN indication (annual mean)') },
    ],
    baris,
    sumber: ['ruen', 'heesi', 'etp1'],
    catatan: t(
      `Potensi RUEN bertahun data 2015 (34 provinsi); provinsi hasil pemekaran Papua belum punya angka sendiri sehingga tidak ditampilkan. Kecepatan angin rata-rata per provinsi tidak tersedia sebagai tabel terbuka: Global Wind Atlas hanya terbuka sebagai raster atau peta (tidak ada API ringkasan per wilayah yang terdokumentasi), jadi kolom ukuran hanya memuat empat lokasi yang pernah diukur Balai Besar Survei dan Pengujian KEBTKE selama setahun. Menurut ETP, kecepatan angin Indonesia umumnya 3 sampai 6 m/s, dan Global Wind Atlas menunjukkan dominasi 4 sampai 5 m/s pada ketinggian 100 m; LAPAN (via EBTKE 2017) menyebut NTT, NTB, Sulawesi Selatan, dan pantai selatan Jawa di atas 5 m/s. Kolom rasio dihitung METI (EST). Di Sulawesi Selatan, PLTB menyumbang sekitar ${k(pangsaKapSul)} persen kapasitas terpasang dan ${k(pangsaProdSul)} persen produksi PLN pada 2024 (EST, Statistik Ketenagalistrikan 2024): ini satu-satunya sistem dengan angin berarti, dan angka batas serap resmi per sistem tidak ditemukan sebagai dokumen terbuka.`,
      `RUEN potential uses 2015 data (34 provinces); the new Papua provinces have no figure of their own and are omitted. Provincial mean wind speed is not available as an open table: Global Wind Atlas is open only as rasters or maps (no documented per-region summary API), so the measurement column holds only four locations measured for one year by the KEBTKE testing centre. According to ETP, Indonesian wind speeds are typically 3 to 6 m/s and Global Wind Atlas is dominated by 4 to 5 m/s at 100 m; LAPAN (via EBTKE 2017) cites East Nusa Tenggara, West Nusa Tenggara, South Sulawesi and the south coast of Java above 5 m/s. The ratio column is computed by METI (EST). In South Sulawesi wind provided about ${pangsaKapSul} percent of installed capacity and ${pangsaProdSul} percent of PLN production in 2024 (EST, Electricity Statistics 2024): it is the only system with significant wind, and no official per-system absorption limit was found as an open document.`,
    ),
  };
}

const CATATAN_PROYEK = {
  pj_0005: t('Diduga plant yang sama dengan Tolo (72 MW); dihitung sekali', 'Likely the same plant as Tolo (72 MW); count once'),
  gem_wind_L100000901004: t('PLTB Tolo; beroperasi komersial 14 Mei 2019 (ESDM)', 'Tolo wind farm; commercial operation 14 May 2019 (ESDM)'),
  pj_0006: t('PLTB Sidrap I; COD 5 Apr 2018 (ESDM)', 'Sidrap I wind farm; COD 5 Apr 2018 (ESDM)'),
  pj_0004: t('Pengadaan; lihat kasus Tanah Laut (bab 40)', 'Procurement; see Tanah Laut case (chapter 40)'),
  gem_wind_L100000916669: t('Titik koordinat GEM tidak cocok dengan nama (jatuh di Papua Barat); lokasi sebenarnya perlu diverifikasi', 'GEM coordinates do not match the name (they fall in West Papua); real location needs verification'),
  gem_wind_L100000916656: t('Titik koordinat GEM tidak cocok dengan nama (jatuh di Jawa Timur); verifikasi', 'GEM coordinates do not match the name (they fall in East Java); verify'),
  gem_wind_L100001062465: t('Status konstruksi menurut GEM tidak cocok dengan RUPTL 2025-2034 (tidak ada PLTB 597 MW di tabel RUPTL); verifikasi sebelum dikutip', 'GEM construction status does not match RUPTL 2025-2034 (no 597 MW wind farm in the RUPTL table); verify before quoting'),
  gem_wind_L100001062466: t('Tidak ada di tabel PLTB RUPTL 2025-2034', 'Not in the RUPTL 2025-2034 wind table'),
  gem_wind_L100000901313: t('Tidak ada di tabel PLTB RUPTL 2025-2034', 'Not in the RUPTL 2025-2034 wind table'),
  gem_wind_L100000901337: t('ETP 2023 hanya mencatat dua PLTB utilitas (Sulawesi Selatan); status operasi 10 MW ini menurut GEM perlu diverifikasi', 'ETP 2023 lists only two utility wind farms (South Sulawesi); this 10 MW operating status per GEM needs verification'),
};
function tabelProyek() {
  const bayu = baca('proyek.json').baris.filter((p) => p.teknologi === 'bayu');
  const baris = bayu.map((p) => ({
    nama: p.nama, provinsi: p.lokasi?.provinsi ?? '-', mw: p.kapasitas?.[0]?.nilai ?? null, status: p.status?.[0]?.nilai ?? '-',
    cod: (p.cod_aktual?.[0]?.nilai ?? p.cod_target?.map((c) => c.nilai).join(' dan ')) ?? '-', bukti: p.tingkat_bukti ?? '-',
    catatan: CATATAN_PROYEK[p.id] ?? t('-', '-'), sumber_url: p.sumber?.[0]?.url?.replace(/#.*$/, '') ?? '',
  })).sort((a, z) => (z.mw || 0) - (a.mw || 0));
  return {
    tipe: 'tabel', per: 15,
    kolom: [
      { k: 'nama', l: t('Proyek', 'Project'), url: 'sumber_url' }, { k: 'provinsi', l: t('Provinsi', 'Province') }, { k: 'mw', l: t('MW', 'MW'), num: true, d: 0 },
      { k: 'status', l: t('Status', 'Status') }, { k: 'cod', l: t('COD (aktual atau target)', 'COD (actual or target)') }, { k: 'bukti', l: t('Tingkat bukti', 'Evidence level') }, { k: 'catatan', l: t('Catatan METI', 'METI note') },
    ],
    baris, sumber: ['ruptl', 'gem', 'etp1'],
    catatan: t(
      'Direktori proyek bayu METI per 8 Nov 2026 (RUPTL PLN 2025-2034 dan Global Energy Monitor). Hanya dua PLTB utilitas yang beroperasi (Sidrap dan Tolo, Sulawesi Selatan, total 147 MW terpasang); sisanya rencana. Baris GEM berstatus "kandidat" dan beberapa memiliki koordinat atau status yang tidak cocok; kolom catatan menandainya. RUPTL 2025-2034 hanya memuat empat proyek PLTB (460 MW) dan satu tahap pengadaan.',
      'METI wind project directory as of 8 Nov 2026 (PLN RUPTL 2025-2034 and Global Energy Monitor). Only two utility wind farms operate (Sidrap and Tolo, South Sulawesi, 147 MW installed in total); the rest are plans. GEM rows are "candidates" and some have mismatched coordinates or status; the note column flags them. RUPTL 2025-2034 lists only four wind projects (460 MW) and one procurement stage.',
    ),
  };
}

function tabelProduksi() {
  const baris = [2019, 2020, 2021, 2022, 2023, 2024, 2025].map((th) => ({
    tahun: String(th), gwh: ID_ISO(ember[th] * 1000), mw: bayuIrena[th], fk: ID_ISO(((ember[th] * 1000) / (bayuIrena[th] * 8.76)) * 100),
  }));
  return {
    tipe: 'tabel', per: 8,
    kolom: [
      { k: 'tahun', l: t('Tahun', 'Year') }, { k: 'gwh', l: t('Produksi bayu (GWh, Ember)', 'Wind generation (GWh, Ember)'), num: true, d: 0 },
      { k: 'mw', l: t('Kapasitas akhir tahun (MW, IRENA)', 'Year-end capacity (MW, IRENA)'), num: true, d: 1 }, { k: 'fk', l: t('Faktor kapasitas (persen, EST)', 'Capacity factor (percent, EST)'), num: true, d: 1 },
    ],
    baris, sumber: ['ember', 'irena'],
    catatan: t(
      'Faktor kapasitas = produksi / (kapasitas x 8.760 jam), dihitung METI (EST) dari dua sumber berbeda sehingga selisih definisi (on-grid dan off-grid, kapasitas akhir tahun) ikut masuk. Tahun 2025 sementara. Seluruh produksi bayu nasional berasal dari dua PLTB Sulawesi Selatan; pembeli tunggalnya PLN, sehingga pasar dalam negeri praktis satu pembeli dan dua penjual utilitas. Harga: 11 sen USD per kWh selama 30 tahun untuk PPA Sidrap dan Tolo (ETP, mengutip PLN 2021).',
      'Capacity factor = generation / (capacity x 8,760 hours), computed by METI (EST) from two different sources, so definitional differences (on-grid and off-grid, year-end capacity) are included. 2025 is provisional. All national wind generation comes from two South Sulawesi wind farms; the only buyer is PLN, so the domestic market is effectively one buyer and two utility sellers. Price: 11 US cents per kWh for 30 years in the Sidrap and Tolo PPAs (ETP, citing PLN 2021).',
    ),
  };
}

function grafikKapasitas() {
  const th = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const ruen = { 2017: 74, 2018: 204, 2019: 399, 2020: 600, 2021: 820, 2022: 1049, 2023: 1290, 2024: 1540, 2025: 1800 };
  return {
    tipe: 'grafik', jenis: 'garis', label: t('Kapasitas bayu terpasang vs target RUEN', 'Installed wind capacity vs RUEN target'), satuan: 'MW', d: 0,
    seri: [
      { nama: t('Terpasang (IRENASTAT)', 'Installed (IRENASTAT)'), sorot: true, titik: th.map((y) => [String(y), bayuIrena[y]]) },
      { nama: t('Target RUEN 2017 (dibaca dari grafik ETP)', 'RUEN 2017 target (read from ETP chart)'), titik: Object.entries(ruen) },
    ],
    sumber: ['irena', 'etp1'],
    catatan: t(
      'Kapasitas nasional naik dari nol ke sekitar 143 MW pada 2018 (Sidrap) lalu 154 MW pada 2019 (Tolo), dan tidak bertambah sejak itu. Target RUEN (1,8 GW pada 2025) dibaca dari Gambar 7 ETP (nilai tahunan dibaca dari grafik, bukan tabel resmi); selisih 2025 kira-kira 1,65 GW.',
      'National capacity rose from zero to about 143 MW in 2018 (Sidrap) and 154 MW in 2019 (Tolo), and has not grown since. The RUEN target (1.8 GW in 2025) is read from ETP Figure 7 (yearly values read off the chart, not an official table); the 2025 gap is roughly 1.65 GW.',
    ),
  };
}

function grafikLcoe() {
  const baris = baca('biaya_listrik.json').lcoe.filter((r) => r.teknologi === 'bayu-darat');
  const seri = (neg, en) => ({ nama: t(neg, en), titik: baris.filter((r) => r.negara === neg || (neg === 'Dunia' && r.negara === 'Dunia')).filter((r) => r.negara === neg).sort((a, z) => a.tahun - z.tahun).filter((r) => r.tahun >= 2012).map((r) => [String(r.tahun), r.sen_usd_kwh]) });
  const s = [seri('Dunia', 'World'), seri('India', 'India'), seri('Vietnam', 'Vietnam'), seri('Filipina', 'Philippines'), seri('Indonesia', 'Indonesia')];
  s[0].sorot = true;
  s[4].nama = t('Indonesia (hanya 2017 sampai 2020)', 'Indonesia (2017 to 2020 only)');
  return {
    tipe: 'grafik', jenis: 'garis', label: t('LCOE bayu darat (USD harga tetap 2025)', 'Onshore wind LCOE (constant 2025 USD)'), satuan: t('sen USD/kWh', 'US cents/kWh'), d: 2, seri: s, sumber: ['owid', 'irena_cost'],
    catatan: t(
      'Titik Indonesia memantul (13,98 pada 2017 ke 7,36 pada 2018) karena sampelnya sangat kecil (dua PLTB) dan IRENA hanya merilis 2017 sampai 2020. Biaya terpasang global 2024: USD 1.041 per kW bayu darat dan USD 2.852 per kW lepas pantai; LCOE global bayu darat USD 0,034 per kWh (IRENA, dibaca via ringkasan pihak ketiga).',
      'The Indonesian points jump (13.98 in 2017 to 7.36 in 2018) because the sample is tiny (two wind farms) and IRENA released only 2017 to 2020. Global installed cost 2024: USD 1,041 per kW onshore and USD 2,852 per kW offshore; global onshore LCOE USD 0.034 per kWh (IRENA, read via a third-party summary).',
    ),
  };
}

/* ---------- bab tulisan tangan ---------- */
const FAKTOR = [
  { k: 'ppa_tarif', l: t('PPA dan tarif layak dibiayai', 'Bankable PPA and tariff') },
  { k: 'pendanaan', l: t('Kepastian pendanaan (financial close)', 'Funding certainty (financial close)') },
  { k: 'jaringan', l: t('Sambungan dan kapasitas jaringan', 'Grid connection and capacity') },
  { k: 'lahan_izin', l: t('Lahan, tata ruang, perizinan', 'Land, spatial plan, permits') },
  { k: 'logistik', l: t('Jalan, pelabuhan, pengangkutan', 'Roads, ports, transport') },
  { k: 'teknologi_om', l: t('Teknologi, suku cadang, pengelola O&M', 'Technology, spare parts, O&M operator') },
  { k: 'sosial', l: t('Penerimaan masyarakat dan lahan adat', 'Community acceptance and land rights') },
  { k: 'data_angin', l: t('Data angin terukur dan andal', 'Reliable measured wind data') },
  { k: 'kebijakan_pasar', l: t('Kebijakan dan desain pasar stabil', 'Stable policy and market design') },
  { k: 'biaya_makro', l: t('Biaya modal dan rantai pasok', 'Cost of capital and supply chain') },
];

const KASUS_BERHASIL = [
  {
    id: 'sidrap', nama: 'PLTB Sidrap I', jenis: 'berhasil', negara: 'ID', lokasi: t('Sidenreng Rappang, Sulawesi Selatan', 'Sidenreng Rappang, South Sulawesi'),
    foto: { src: '/img/beranda/bayu-sidrap.webp', alt: t('Deretan turbin PLTB Sidrap di perbukitan', 'Row of Sidrap wind turbines on the hills'), kredit: 'USAID Indonesia, domain publik (Wikimedia Commons)' },
    profil: [
      { label: t('Kapasitas', 'Capacity'), nilai: 75, satuan: 'MW' }, { label: t('Turbin', 'Turbines'), nilai: t('30 unit Gamesa 2,5 MW, menara 80 m, bilah 57 m (sekitar 15 ton per bilah)', '30 Gamesa 2.5 MW units, 80 m tower, 57 m blades (about 15 tonnes each)') },
      { label: t('Pemilik/pengembang', 'Owner/developer'), nilai: t('PT UPC Sidrap Bayu Energi (konsorsium UPC Renewables, Binatek, dan mitra)', 'PT UPC Sidrap Bayu Energi (UPC Renewables, Binatek and partners consortium)') },
      { label: t('Investasi', 'Investment'), nilai: 150, satuan: t('juta USD (ESDM); media menyebut Rp2,3 triliun', 'USD million (ESDM); media cite IDR 2.3 trillion') },
      { label: t('Konstruksi sampai COD', 'Construction to COD'), nilai: t('Agustus 2015 sampai Maret 2018; COD 5 April 2018; diresmikan 2 Juli 2018', 'August 2015 to March 2018; COD 5 April 2018; inaugurated 2 July 2018') },
      { label: t('Tarif dan PPA', 'Tariff and PPA'), nilai: t('sekitar 11 sen USD per kWh, 30 tahun (PLN 2021 via ETP); dibeli PLN tanpa lelang karena diajukan sebelum 2017', 'about 11 US cents per kWh, 30 years (PLN 2021 via ETP); procured by PLN without tender because proposed before 2017') },
      { label: t('Lokasi tapak', 'Site'), nilai: t('Desa Mattirotasi dan Lainungan, Kecamatan Watang Pulu', 'Mattirotasi and Lainungan villages, Watang Pulu district') },
    ],
    tindakan: [
      t('Pengembang asing berpengalaman bermitra dengan mitra lokal dan mengajukan proyek sebelum aturan lelang 2017 berlaku.', 'An experienced foreign developer partnered with local firms and proposed the project before the 2017 tender rules applied.'),
      t('PPA 30 tahun dengan PLN pada tarif sekitar 11 sen USD per kWh yang bisa dibiayai bank.', 'A 30-year PPA with PLN at about 11 US cents per kWh that lenders could finance.'),
      t('Pelabuhan dimodifikasi karena kapasitas bongkar dan simpan tidak cukup; satu bilah butuh sekitar 10 jam dari pelabuhan ke lokasi turbin.', 'The port was modified because offloading and storage capacity were insufficient; one blade took about 10 hours from port to turbine site.'),
      t('Pekerja lokal diprioritaskan: 709 pekerja, sekitar 95 persen WNI.', 'Local hiring was prioritised: 709 workers, about 95 percent Indonesian.'),
    ],
    sebab: [
      t('Tarif dan masa kontrak membuat arus kas bisa dibiayai (PPA 30 tahun), sebelum tarif turun ke 5,5 sen pada lelang Tanah Laut.', 'The tariff and contract term made cash flows financeable (30-year PPA), before tariffs fell to 5.5 cents in the Tanah Laut tender.'),
      t('Sistem Sulawesi Selatan terhubung ke jaringan 150 kV lewat gardu induk Jeneponto sehingga energi tersalurkan.', 'The South Sulawesi system is connected to the 150 kV grid via the Jeneponto substation, so energy could be evacuated.'),
      t('Terbit dua PLTB berturut-turut di tempat yang sama (Sidrap lalu Tolo) memungkinkan mobilisasi logistik dan tenaga kerja dipakai ulang.', 'Two wind farms back to back in the same region (Sidrap then Tolo) allowed logistics and workforce to be reused.'),
    ],
    angka: [
      { label: t('Investasi per MW', 'Investment per MW'), nilai: capexSidrap, d: 1, satuan: t('juta USD/MW', 'USD million/MW'), sumber: 'esdm_sidrap', est: true },
      { label: t('Faktor kapasitas gabungan PLTB Sulsel 2024', 'Combined capacity factor, South Sulawesi wind 2024'), nilai: fkSul, d: 1, satuan: '%', sumber: 'stat', est: true },
      { label: t('Pelanggan 900 VA terlayani', '900 VA customers served'), nilai: 70000, d: 0, satuan: t('lebih dari', 'more than'), sumber: 'esdm_sidrap', est: false },
    ],
    pelajaran: [
      H('PPA jangka panjang dengan tarif yang menutup biaya modal adalah syarat pertama; penurunan tarif lelang berikutnya harus diuji ulang terhadap kemampuan dibiayai.', 'A long PPA with a tariff covering cost of capital is the first requirement; later lower auction tariffs must be re-tested for bankability.'),
      H('Rencanakan logistik bilah dan menara dari awal: pelabuhan dan jalan bisa menjadi 15 sampai 30 persen biaya investasi menurut ETP.', 'Plan blade and tower logistics from day one: ports and roads can reach 15 to 30 percent of investment cost per ETP.'),
    ],
    faktor: { ppa_tarif: true, pendanaan: true, jaringan: true },
    sumber: ['esdm_sidrap', 'etp1', 'gn_sidrap', 'bisnis_sidrap', 'stat'],
  },
  {
    id: 'tolo', nama: 'PLTB Tolo I (Jeneponto)', jenis: 'berhasil', negara: 'ID', lokasi: t('Jeneponto, Sulawesi Selatan', 'Jeneponto, South Sulawesi'),
    profil: [
      { label: t('Kapasitas', 'Capacity'), nilai: 72, satuan: 'MW' }, { label: t('Turbin', 'Turbines'), nilai: t('20 unit 3,6 MW; menara 133 m, bilah 63 m', '20 units of 3.6 MW; 133 m tower, 63 m blades') },
      { label: t('Pemilik/pengembang', 'Owner/developer'), nilai: t('PT Energi Bayu Jeneponto (Vena Energy)', 'PT Energi Bayu Jeneponto (Vena Energy)') },
      { label: t('COD', 'COD'), nilai: t('14 Mei 2019', '14 May 2019') },
      { label: t('Tarif dan PPA', 'Tariff and PPA'), nilai: t('sekitar 11 sen USD per kWh, 30 tahun (PLN 2021 via ETP)', 'about 11 US cents per kWh, 30 years (PLN 2021 via ETP)') },
      { label: t('Penghematan', 'Saving'), nilai: t('Rp577 per kWh lebih murah dari PLTD (ESDM)', 'IDR 577 per kWh cheaper than diesel plants (ESDM)') },
    ],
    tindakan: [
      t('Memakai turbin lebih besar dari Sidrap (3,6 MW dan menara 133 m) sehingga jumlah unit dan pondasi lebih sedikit.', 'Used bigger turbines than Sidrap (3.6 MW and 133 m towers), so fewer units and foundations.'),
      t('Menyiapkan tahap II dengan sistem penyimpanan energi dan harga di bawah BPP sesuai arahan pemerintah.', 'Prepared phase II with energy storage and a price below BPP, as the government asked.'),
    ],
    sebab: [
      t('Mengikuti pola Sidrap: PPA 30 tahun, jaringan Sulawesi Selatan yang sudah terhubung, dan pengembang internasional dengan pendanaan multilateral (Bank Pembangunan Asia tercatat mengenai proyek ini).', 'Followed the Sidrap pattern: 30-year PPA, an already connected South Sulawesi grid, and an international developer with multilateral funding (the Asian Development Bank lists the project).'),
    ],
    angka: [
      { label: t('Kapasitas per turbin', 'Capacity per turbine'), nilai: 3.6, d: 1, satuan: 'MW', sumber: 'esdm_tolo', est: false },
      { label: t('Setara rumah 900 VA (klaim ESDM)', '900 VA household equivalent (ESDM claim)'), nilai: 300000, d: 0, satuan: '', sumber: 'esdm_tolo', est: false },
    ],
    pelajaran: [H('Satu klaster dua PLTB berhasil karena sistem tuan rumah punya jaringan dan beban yang cukup; replikasi di sistem kecil butuh baterai atau perkuatan jaringan.', 'The two-farm cluster worked because the host system had enough grid and load; replication in small systems needs batteries or grid reinforcement.')],
    faktor: { ppa_tarif: true, pendanaan: true },
    sumber: ['esdm_tolo', 'etp1', 'adb_tolo'],
  },
  {
    id: 'turkana', nama: 'Lake Turkana Wind Power', jenis: 'berhasil', negara: 'KE', lokasi: t('Loiyangalani, Marsabit, Kenya', 'Loiyangalani, Marsabit, Kenya'),
    profil: [
      { label: t('Kapasitas', 'Capacity'), nilai: 310.25, satuan: 'MW' }, { label: t('Turbin', 'Turbines'), nilai: t('365 unit Vestas V52 850 kW di area sekitar 160 km2', '365 Vestas V52 850 kW units over about 160 km2') },
      { label: t('Biaya proyek', 'Project cost'), nilai: t('sekitar KSh70 miliar; paket pembiayaan USD 853 juta', 'about KSh70 billion; financing package USD 853 million') },
      { label: t('PPA', 'PPA'), nilai: t('20 tahun, 7,52 sen euro per kWh', '20 years, 7.52 euro cents per kWh') },
      { label: t('Tenaga kerja', 'Workforce'), nilai: t('2.500 saat konstruksi, 200 tetap', '2,500 in construction, 200 permanent') },
    ],
    tindakan: [t('Membangun ladang angin terbesar di Afrika dengan pendanaan campuran (pinjaman lembaga pembangunan, hibah, jaminan risiko).', 'Built Africa\'s largest wind farm with blended funding (development lender loans, grants, risk guarantee).')],
    sebab: [t('Sumber angin kuat dan stabil: pada 19 Juli 2019 rata-rata keluaran 199 MW atau 64 persen kapasitas.', 'Strong, steady wind: on 19 July 2019 average output was 199 MW or 64 percent of capacity.')],
    angka: [
      { label: t('Keluaran rata-rata pada hari pengukuran', 'Average output on the measured day'), nilai: 64, d: 0, satuan: '%', sumber: 'wiki_ltwp', est: false },
      { label: t('Pembayaran Kenya Power FY2019', 'Kenya Power payment FY2019'), nilai: 1.1, d: 1, satuan: 'TWh (KSh11 miliar)', sumber: 'wiki_ltwp', est: false },
    ],
    pelajaran: [H('Sumber angin kelas dunia tidak cukup: tanpa jalur transmisi tepat waktu, hasilnya menjadi denda (lihat bab 40).', 'A world-class wind resource is not enough: without timely transmission it becomes a penalty (see chapter 40).')],
    faktor: { ppa_tarif: true, pendanaan: true, data_angin: true },
    sumber: ['wiki_ltwp'],
  },
  {
    id: 'vietnam-fit', nama: 'Vietnam: tarif tetap 2017-2021', jenis: 'berhasil', negara: 'VN', lokasi: t('Ninh Thuan, Bac Lieu, Gia Lai, dan lainnya', 'Ninh Thuan, Bac Lieu, Gia Lai and others'),
    profil: [
      { label: t('Skema', 'Scheme'), nilai: t('tarif tetap 20 tahun: 8,5 sen USD per kWh darat, 9,8 sen lepas pantai, untuk pembangkit beroperasi sebelum 1 November 2021', '20-year fixed tariff: 8.5 US cents per kWh onshore, 9.8 offshore, for plants operating before 1 November 2021') },
      { label: t('Contoh awal', 'Early example'), nilai: t('Bac Lieu dekat pantai: 99,2 MW, 62 turbin GE 1,6 MW; tahap pertama tersambung Mei 2013', 'Bac Lieu near-shore: 99.2 MW, 62 GE 1.6 MW turbines; first phase connected May 2013') },
      { label: t('Biaya investasi', 'Investment cost'), nilai: t('rata-rata VND45 miliar (sekitar USD 1,9 juta) per MW', 'average VND45 billion (about USD 1.9 million) per MW') },
    ],
    tindakan: [t('Pemerintah menjamin harga tetap 20 tahun dengan tenggat jelas, sehingga bank dan pengembang berlomba membangun.', 'The government guaranteed a fixed 20-year price with a clear deadline, so banks and developers rushed to build.')],
    sebab: [t('Kepastian harga dan tenggat memecahkan masalah bankability; Vietnam menyalip Thailand sebagai pasar surya dan angin terbesar Asia Tenggara pada 2019.', 'Price certainty and a deadline solved bankability; Vietnam overtook Thailand as Southeast Asia\'s biggest solar and wind market in 2019.')],
    angka: [
      { label: t('Tarif darat', 'Onshore tariff'), nilai: 8.5, d: 1, satuan: t('sen USD/kWh', 'US cents/kWh'), sumber: 'vnexpress', est: false },
      { label: t('Biaya investasi', 'Investment cost'), nilai: 1.9, d: 1, satuan: t('juta USD/MW', 'USD million/MW'), sumber: 'vnexpress', est: false },
    ],
    pelajaran: [H('Tarif tetap yang cepat bisa memicu pembangunan massal, tetapi harus disinkronkan dengan transmisi (lihat kegagalan Vietnam, bab 40).', 'A fast fixed tariff can trigger mass build-out but must be synchronised with transmission (see Vietnam failure, chapter 40).')],
    faktor: { ppa_tarif: true, kebijakan_pasar: true, pendanaan: true },
    sumber: ['vnexpress', 'aljaz'],
  },
  {
    id: 'thailand-chaiyaphum', nama: 'Thailand: Chaiyaphum (EGCO)', jenis: 'berhasil', negara: 'TH', lokasi: t('Chaiyaphum, Thailand timur laut', 'Chaiyaphum, north-east Thailand'),
    profil: [
      { label: t('Kapasitas', 'Capacity'), nilai: 80, satuan: 'MW' }, { label: t('Turbin', 'Turbines'), nilai: t('32 unit Goldwind', '32 Goldwind units') }, { label: t('Operasi', 'Operation'), nilai: '2016' },
      { label: t('Kapasitas bayu nasional Thailand', 'Thailand national wind capacity'), nilai: t('sekitar 1,5 sampai 1,6 GW (dua angka berbeda dari satu basis data)', 'about 1.5 to 1.6 GW (two different figures from one database)') },
    ],
    tindakan: [t('Pengembang listrik swasta memakai turbin pabrikan Tiongkok untuk proyek angin pertama berskala puluhan MW.', 'A private power producer used Chinese-made turbines for a first project at tens of MW.')],
    sebab: [t('Sumber penyebab keberhasilan tidak diverifikasi dari dokumen resmi; dicatat sebagai pembanding regional saja.', 'The causes of success were not verified from official documents; recorded as a regional comparator only.')],
    angka: [{ label: t('Porsi angin dalam bauran listrik Thailand 2025', 'Wind share of Thailand electricity 2025'), nilai: 1.81, d: 2, satuan: '%', sumber: 'owid_bauran', est: false }],
    pelajaran: [H('Thailand dengan sekitar 1,5 GW dan porsi 1,81 persen sudah lebih jauh dari Indonesia (0,13 persen); jarak itu dibangun dengan puluhan proyek kecil sampai menengah, bukan satu proyek besar.', 'Thailand, with about 1.5 GW and a 1.81 percent share, is far ahead of Indonesia (0.13 percent); the gap was built from dozens of small to mid-size projects, not one large one.')],
    faktor: {}, sumber: ['gem_chai', 'twp_th', 'owid_bauran'],
  },
  {
    id: 'india-lelang', nama: 'India: lelang angin kompetitif', jenis: 'berhasil', negara: 'IN', lokasi: t('Gujarat, Tamil Nadu, dan lainnya', 'Gujarat, Tamil Nadu and others'),
    profil: [
      { label: t('Harga terendah negara bagian', 'Lowest state auction'), nilai: t('Rs2,43 per kWh (GUVNL, Desember 2017)', 'Rs2.43 per kWh (GUVNL, December 2017)') },
      { label: t('Lelang SECI Maret 2018', 'SECI auction March 2018'), nilai: t('terendah Rs2,44 per kWh; rata-rata Rs2,51; 1.435 MW dilelang dari 2 GW', 'lowest Rs2.44 per kWh; average Rs2.51; 1,435 MW awarded of 2 GW') },
      { label: t('LCOE bayu darat India 2023', 'India onshore wind LCOE 2023'), nilai: 4.83, satuan: t('sen USD/kWh (harga tetap 2025)', 'US cents/kWh (constant 2025 USD)') },
    ],
    tindakan: [t('Lembaga lelang nasional dan negara bagian memakai lelang terbalik dengan jadwal rutin sehingga pasokan dan pemasok bisa direncanakan.', 'National and state agencies ran reverse auctions on a regular schedule, so supply and suppliers could plan.')],
    sebab: [t('Jadwal lelang rutin dan pasar pemasok turbin dalam negeri yang matang menekan harga sampai sekitar sepertiga tarif Indonesia 2019.', 'Regular auctions and a mature domestic turbine supplier base pushed prices to roughly a third of Indonesia\'s 2019 tariff.')],
    angka: [{ label: t('Tarif terendah SECI', 'Lowest SECI tariff'), nilai: 2.44, d: 2, satuan: 'Rs/kWh', sumber: 'rw_india', est: false }],
    pelajaran: [H('Lelang rutin yang bisa diprediksi menurunkan harga jauh lebih besar daripada lelang tunggal; Indonesia baru punya satu lelang PLTB utilitas dalam satu dekade.', 'Predictable regular auctions cut prices far more than a single auction; Indonesia has had only one utility wind auction in a decade.')],
    faktor: { kebijakan_pasar: true, ppa_tarif: true }, sumber: ['rw_india', 'owid'],
  },
  {
    id: 'uk-cfd', nama: 'Inggris: CfD lepas pantai (AR6)', jenis: 'berhasil', negara: 'GB', lokasi: t('Laut Utara dan perairan Inggris', 'North Sea and UK waters'),
    profil: [
      { label: t('Hasil AR6 (3 Sep 2024)', 'AR6 result (3 Sep 2024)'), nilai: t('sekitar 5,3 GW bayu lepas pantai mendapat kontrak', 'about 5.3 GW offshore wind awarded contracts') },
      { label: t('Harga kliring tetap', 'Fixed-bottom clearing price'), nilai: 58.87, satuan: t('GBP/MWh harga 2012 (sekitar GBP 82 harga kini)', 'GBP/MWh 2012 prices (about GBP 82 in today\'s money)') },
      { label: t('Terapung', 'Floating'), nilai: 139.93, satuan: t('GBP/MWh harga 2012 (satu proyek)', 'GBP/MWh 2012 prices (one project)') },
    ],
    tindakan: [t('Pemerintah memakai kontrak selisih (CfD) dua arah yang menjamin harga tetap bagi pengembang dan memulangkan kelebihan pendapatan ke konsumen.', 'The government used two-way contracts for difference (CfD) that fix revenue for developers and return excess to consumers.')],
    sebab: [t('Putaran lelang yang terulang dengan pagu harga, dan harga kliring 19 persen di bawah pagu, menunjukkan pasar bersaing.', 'Repeated rounds with a price cap and a clearing price 19 percent below the cap indicate a competitive market.')],
    angka: [{ label: t('Biaya terpasang global lepas pantai 2024', 'Global offshore installed cost 2024'), nilai: 2852, d: 0, satuan: 'USD/kW', sumber: 'irena_cost', est: false }],
    pelajaran: [H('Desain pasar (CfD, putaran rutin) membuat biaya modal rendah; tetapi hasil yang sama di Indonesia butuh pembeli kredibel dan kurs terlindungi, yang belum ada untuk lepas pantai.', 'Market design (CfD, regular rounds) keeps capital cost low; the same in Indonesia needs a credible buyer and protected currency, which does not yet exist for offshore.')],
    faktor: { kebijakan_pasar: true, ppa_tarif: true }, sumber: ['cms_ar6', 'irena_cost'],
  },
];

const HAK = t('Hak jawab: pihak yang disebut dipersilakan mengoreksi lewat formulir koreksi METI; koreksi bersumber akan dimuat berdampingan dengan teks ini.', 'Right of reply: named parties may correct this through the METI correction form; sourced corrections will be published alongside this text.');
const KASUS_GAGAL = [
  {
    id: 'tanah-laut', nama: 'PLTB Tanah Laut (70 MW + baterai)', jenis: 'mundur', negara: 'ID', lokasi: t('Tanah Laut, Kalimantan Selatan', 'Tanah Laut, South Kalimantan'),
    profil: [
      { label: t('Kapasitas', 'Capacity'), nilai: t('70 MW dengan baterai 10 MW/10 MWh', '70 MW with a 10 MW/10 MWh battery') },
      { label: t('Penawaran menang', 'Winning bid'), nilai: t('5,5 sen USD per kWh (terendah untuk PLTB di Indonesia saat itu)', '5.5 US cents per kWh (lowest for Indonesian wind at the time)') },
      { label: t('Pemegang saham menurut Bloomberg Technoz', 'Shareholders per Bloomberg Technoz'), nilai: t('PT Tata Alam Baru: BELL 70 persen, PLN Nusantara Renewables 30 persen (mitra wajib PLN)', 'PT Tata Alam Baru: BELL 70 percent, PLN Nusantara Renewables 30 percent (PLN mandatory partner)') },
      { label: t('Status RUPTL 2025-2034', 'RUPTL 2025-2034 status'), nilai: t('Pengadaan, COD skenario RE Base 2026', 'Procurement, RE Base scenario COD 2026') },
    ],
    kronologi: [
      { tanggal: '2022-07-01', teks: t('PLN menerbitkan draf PPA untuk tender (ETP: Juli 2022; tanggal tepat tidak disebut). Investor dan pemberi pinjaman menyebut 10 isu bankability pada draf itu.', 'PLN issues the draft PPA for the tender (ETP: July 2022; exact day not stated). Investors and lenders flag 10 bankability issues in the draft.') },
      { tanggal: '2022-11-15', teks: t('Surat niat ditandatangani di Bali dengan konsorsium Total Eren dan Adaro Power; penawaran 5,5 sen USD per kWh.', 'Letter of intent signed in Bali with the Total Eren and Adaro Power consortium; bid 5.5 US cents per kWh.') },
      { tanggal: '2023-05-04', teks: t('PPA ditandatangani; konstruksi ditargetkan awal 2024 dan COD 2025.', 'PPA signed; construction targeted for early 2024 and COD for 2025.') },
      { tanggal: '2023-12-13', teks: t('ETP mencatat proyek dimenangkan tetapi belum dibangun.', 'ETP records the project as awarded but not yet under construction.') },
      { tanggal: '2025-05-26', teks: t('RUPTL 2025-2034 masih memuat Tanah Laut 70 MW berstatus pengadaan.', 'RUPTL 2025-2034 still lists Tanah Laut 70 MW at procurement status.') },
      { tanggal: '2025-07-01', teks: t('Bloomberg Technoz: PLN menimbang terminasi karena proyek lama molor dan konsorsium belum financial close pada semester pertama 2025.', 'Bloomberg Technoz: PLN weighs termination because the project is long delayed and the consortium had not reached financial close in the first half of 2025.') },
    ],
    sebab: [
      t('Pendanaan: financial close belum tercapai (Bloomberg Technoz, 1 Jul 2025).', 'Funding: financial close not reached (Bloomberg Technoz, 1 Jul 2025).'),
      t('PPA: ETP mencatat isu bankability pada draf PPA Tanah Laut (energi kontrak tahunan, hak PLN membeli proyek kapan saja, risiko force majeure dibagi, hasil kredit karbon ke PLN, mitra wajib).', 'PPA: ETP notes bankability issues in the Tanah Laut PPA draft (annual contracted energy, PLN pre-emptive right to buy, shared force majeure risk, carbon proceeds to PLN, mandatory partner).'),
      t('Data angin: lokasi berbukit; peta menunjukkan 8,12 m/s tetapi ketidakpastian tinggi tanpa pengukuran lokasi (ETP, Gambar 9).', 'Wind data: rugged site; the map shows 8.12 m/s but uncertainty is high without on-site measurement (ETP, Figure 9).'),
      t('Izin: judul Petromindo menyebut penundaan karena kendala perizinan (isi berbayar; rincian tidak dibaca).', 'Permits: a Petromindo headline cites delay from permitting setbacks (paywalled; details not read).'),
    ],
    terdampak: t('PLN (rencana pasokan sistem Kalimantan), konsorsium yang menanggung biaya pengukuran dan persiapan, serta konsumen di sistem yang menunggu pasokan terbarukan. Struktur kepemilikan berubah dari Total Eren/Adaro (2022-2023) ke Tata Alam Baru (2025); alasan perubahan tidak dijelaskan sumber yang dibaca.', 'PLN (Kalimantan system supply plan), the consortium bearing measurement and preparation costs, and consumers in a system waiting for renewable supply. Ownership changed from Total Eren/Adaro (2022-2023) to Tata Alam Baru (2025); the reason is not explained in the sources read.'),
    seharusnya: H('Menutup isu bankability PPA sebelum penandatanganan (ACE dan hak beli PLN), memberi jadwal financial close yang mengikat dengan sanksi seimbang, dan menyaring peserta lelang dengan bukti pendanaan, bukan hanya harga terendah.', 'Close PPA bankability issues before signing (ACE and PLN buy-out right), set a binding financial-close schedule with balanced sanctions, and screen bidders on proof of funding, not only lowest price.'),
    tanda_bahaya: [
      t('Harga penawaran sekitar setengah tarif proyek pembanding (5,5 vs 11 sen) tanpa penyesuaian biaya modal.', 'Bid price about half the comparable tariff (5.5 vs 11 cents) with no adjustment for cost of capital.'),
      t('Peserta menang tanpa pengukuran angin lokasi yang kuat di medan berbukit.', 'Winner without strong on-site wind measurement in rugged terrain.'),
      t('Jarak antara PPA dan financial close melebihi dua tahun tanpa kemajuan terbuka.', 'More than two years between PPA and financial close with no public progress.'),
    ],
    faktor: { ppa_tarif: true, pendanaan: true, data_angin: true, lahan_izin: true },
    sumber: ['bt_tl', 'bisnis_tl', 'li_tl', 'etp1', 'ruptl', 'pm_tl'], hak_jawab: true, hak_jawab_catatan: HAK,
  },
  {
    id: 'sukabumi', nama: 'PLTB Sukabumi (UPC Renewables)', jenis: 'mundur', negara: 'ID', lokasi: t('Ciemas, Sukabumi, Jawa Barat', 'Ciemas, Sukabumi, West Java'),
    profil: [
      { label: t('Kapasitas diajukan', 'Capacity proposed'), nilai: t('60 MW lalu diminta 150 MW (Juni 2023)', '60 MW, then 150 MW requested (June 2023)') },
      { label: t('Pengembang', 'Developer'), nilai: 'PT UPC Sukabumi Bayu Energi / UPC Renewables Indonesia' },
      { label: t('Angin terukur', 'Measured wind'), nilai: t('7,0 m/s di Sukabumi (30-50 m, 2017)', '7.0 m/s at Sukabumi (30-50 m, 2017)') },
      { label: t('Status di RUPTL 2025-2034', 'Status in RUPTL 2025-2034'), nilai: t('tidak tercantum di tabel PLTB (EST dari pembacaan tabel)', 'not in the wind table (EST from reading the table)') },
    ],
    kronologi: [
      { tanggal: '2022-11-30', teks: t('UPC Renewables disebut masuk tahap negosiasi PPA dengan PLN (Industrial Info).', 'UPC Renewables reported to be in PPA negotiation with PLN (Industrial Info).') },
      { tanggal: '2023-06-06', teks: t('Pemkab Sukabumi mendukung permintaan UPC menaikkan kuota dari 60 ke 150 MW; lokasi di kawasan UNESCO Global Geopark Ciletuh-Palabuhanratu.', 'Sukabumi regency backs UPC request to raise the quota from 60 to 150 MW; site inside the UNESCO Global Geopark Ciletuh-Palabuhanratu.') },
      { tanggal: '2023-12-13', teks: t('ETP mencatat gardu 70 kV terdekat di Pelabuhan Ratu dan menyebut perlu saluran sub-transmisi lebih dari 20 km.', 'ETP notes the nearest 70 kV substation at Pelabuhan Ratu and a sub-transmission line of more than 20 km.') },
      { tanggal: '2025-05-26', teks: t('RUPTL 2025-2034 tidak memuat PLTB Sukabumi pada tabel bayunya.', 'RUPTL 2025-2034 does not list Sukabumi in its wind table.') },
    ],
    sebab: [
      t('PPA belum tercapai walau negosiasi dilaporkan sejak 2022; tanpa tempat di RUPTL tidak ada jalur pengadaan PLN.', 'No PPA despite negotiation reported since 2022; without a RUPTL slot there is no PLN procurement path.'),
      t('Jaringan: saluran sub-transmisi lebih dari 20 km ke gardu yang harus punya feeder kosong (ETP).', 'Grid: a sub-transmission line of more than 20 km to a substation that must have a free feeder (ETP).'),
      t('Lahan dan tata ruang: lokasi di dalam kawasan geopark UNESCO sehingga perizinan dan tata ruang menjadi kunci (ANTARA).', 'Land and spatial plan: site inside a UNESCO geopark, so permits and zoning are decisive (ANTARA).'),
    ],
    terdampak: t('Sistem Jawa-Bali yang butuh pasokan terbarukan, pengembang yang menanggung biaya pengembangan sejak 2015, dan pemda yang sudah memberi dukungan perizinan.', 'The Java-Bali system that needs renewable supply, a developer bearing development costs since 2015, and the local government that has offered permitting support.'),
    seharusnya: H('PLN dan ESDM menyatakan jelas apakah Sukabumi masuk jalur pengadaan atau tidak, dan memilih jalur lelang atau penunjukan agar investor tidak menunggu tanpa kepastian.', 'PLN and ESDM should state clearly whether Sukabumi is in the procurement path or not, choosing tender or direct selection so investors do not wait without certainty.'),
    tanda_bahaya: [
      t('Kuota diminta naik tanpa PPA dan tanpa slot RUPTL.', 'Quota raised without a PPA and without a RUPTL slot.'),
      t('Target selesai (2024 menurut pemberitaan) lewat tanpa konstruksi.', 'Target completion (2024 per reporting) passes without construction.'),
    ],
    faktor: { ppa_tarif: true, jaringan: true, lahan_izin: true },
    sumber: ['iir_sk', 'antara_sk', 'etp1', 'ruptl'], hak_jawab: true, hak_jawab_catatan: HAK,
  },
  {
    id: 'nusa-penida', nama: 'PLTB Puncak Mundi, Nusa Penida (skala kecil)', jenis: 'mati', negara: 'ID', lokasi: t('Nusa Penida, Bali', 'Nusa Penida, Bali'),
    profil: [
      { label: t('Instalasi', 'Installation'), nilai: t('9 kincir setinggi 30 m, target sekitar 700 kW', '9 turbines 30 m tall, targeted at about 700 kW') },
      { label: t('Dibangun', 'Built'), nilai: '2007' },
    ],
    kronologi: [
      { tanggal: '2007-11-01', teks: t('Diresmikan menjelang konferensi iklim akhir 2007 (bulan November; tanggal tepat tidak disebut). Berhenti total kurang dari dua tahun kemudian dengan alasan tidak ada suku cadang.', 'Inaugurated ahead of the late-2007 climate conference (November; exact day not stated). Stopped completely less than two years later, reason cited: no spare parts.') },
      { tanggal: '2020-10-26', teks: t('Mongabay menyebutnya monumen kegagalan; tetap mangkrak.', 'Mongabay calls it a monument to failure; still idle.') },
    ],
    sebab: [
      t('Suku cadang tidak tersedia setelah masa awal (Mongabay).', 'No spare parts after the early period (Mongabay).'),
      t('Pengelola jangka panjang tidak jelas: ESDM menyerahkan, tetapi tak ada Perusda yang mengelola setelah peresmian (Mongabay 2018 via pencarian).', 'Unclear long-term operator: ESDM handed it over, but no regional company ran it after inauguration (Mongabay 2018 via search).'),
    ],
    terdampak: t('Warga Puncak Mundi dan sistem 3 Nusa yang tetap bergantung pada pembangkit diesel; uang negara yang dibelanjakan untuk aset yang tidak menghasilkan.', 'Puncak Mundi residents and the 3 Nusa system, which stays dependent on diesel; public money spent on an asset that produces nothing.'),
    seharusnya: H('Proyek hibah skala kecil perlu kontrak O&M, dana suku cadang, dan pengelola yang ditetapkan sebelum serah terima, bukan sesudahnya.', 'Small grant projects need an O&M contract, a spare-parts fund and a designated operator before handover, not after.'),
    tanda_bahaya: [
      t('Peresmian cepat tanpa pengelola tetap.', 'Rapid inauguration without a permanent operator.'),
      t('Pemasok turbin asing atau satu-satunya tanpa kontrak suku cadang.', 'A single or foreign turbine supplier without a spare-parts contract.'),
    ],
    faktor: { teknologi_om: true }, sumber: ['mongabay_np', 'esdm_pandan'], hak_jawab: true, hak_jawab_catatan: HAK,
  },
  {
    id: 'turkana-jaringan', nama: 'Lake Turkana: jalur transmisi terlambat, denda deemed energy', jenis: 'mundur', negara: 'KE', lokasi: t('Loiyangalani sampai Suswa, Kenya', 'Loiyangalani to Suswa, Kenya'),
    profil: [
      { label: t('Jalur', 'Line'), nilai: t('sekitar 430 km, 400 kV, dibangun KETRACO (Loiyangalani-Suswa)', 'about 430 km, 400 kV, built by KETRACO (Loiyangalani-Suswa)') },
      { label: t('Mekanisme', 'Mechanism'), nilai: t('klausul deemed generated energy: Kenya Power membayar kapasitas yang siap tetapi tak dapat disalurkan', 'deemed generated energy clause: Kenya Power pays for capacity ready but unable to deliver') },
    ],
    kronologi: [
      { tanggal: '2017-03-09', teks: t('Seluruh 365 turbin berdiri; jalur transmisi belum selesai. Pada 2017 dilaporkan penagihan kapasitas sekitar KSh700 juta per bulan (bulan tepat tidak disebut).', 'All 365 turbines erected; transmission line not finished. In 2017 a capacity charge of about KSh700 million per month was reported (exact month not stated).') },
      { tanggal: '2018-09-24', teks: t('Jalur disebut tersambung ke jaringan (satu sumber); sumber yang sama juga menyebut peresmian jalur 19 Juli 2019. Kedua tanggal belum direkonsiliasi.', 'Line said to be connected to the grid (one source); the same source also gives inauguration of the line on 19 July 2019. The two dates are not reconciled.') },
      { tanggal: '2019-07-19', teks: t('Peresmian resmi jalur Loiyangalani-Suswa; keluaran rata-rata 199 MW (64 persen).', 'Official commissioning of the Loiyangalani-Suswa line; average output 199 MW (64 percent).') },
    ],
    sebab: [
      t('Jalur transmisi tidak selesai bersamaan dengan pembangkit; masalah kontraktor dan hak lintas (wayleave) disebut dalam pemberitaan.', 'The transmission line was not finished with the plant; contractor and wayleave problems are cited in reporting.'),
      t('Kontrak PPA menggeser risiko jaringan ke pembeli publik.', 'The PPA shifted grid risk to the public buyer.'),
    ],
    angka: [
      { label: t('Total denda keterlambatan', 'Total delay penalties'), nilai: 14.5, d: 1, satuan: t('miliar KSh (Wikipedia); judul EastAfrican menyebut USD 52,5 sampai 54 juta; angka lain dari audit parlemen tidak direkonsiliasi', 'KSh billion (Wikipedia); EastAfrican headlines cite USD 52.5 to 54 million; other parliamentary audit figures are not reconciled'), sumber: 'wiki_ltwp', est: false },
      { label: t('Cicilan bulanan disepakati', 'Agreed monthly instalment'), nilai: 78.6, d: 1, satuan: t('juta KSh selama enam tahun', 'KSh million over six years'), sumber: 'wiki_ltwp', est: false },
    ],
    terdampak: t('Konsumen listrik Kenya yang menanggung pembayaran lewat tagihan, dan investor yang menunggu pembayaran listrik yang tak bisa disalurkan.', 'Kenyan electricity consumers who bore payments through their bills, and investors who waited while energy could not be delivered.'),
    seharusnya: H('Sinkronkan tanggal COD pembangkit dengan jalur transmisi lewat kontrak yang mengikat kedua pihak, dan jangan memberi satu BUMN risiko tanpa batas; di Indonesia ini relevan untuk PLTB yang butuh saluran sub-transmisi.', 'Synchronise plant COD with the transmission line through a contract binding both sides, and do not give one state firm unlimited risk; in Indonesia this applies to wind farms needing sub-transmission lines.'),
    tanda_bahaya: [t('Pembangkit dan jalur dikontrak terpisah dengan jadwal tidak terhubung.', 'Plant and line contracted separately with unlinked schedules.'), t('Hak lintas jalur belum diamankan saat pembangkit mulai dibangun.', 'Right of way not secured when plant construction starts.')],
    faktor: { jaringan: true }, sumber: ['wiki_ltwp', 'ea_ltwp'], hak_jawab: true, hak_jawab_catatan: HAK,
  },
  {
    id: 'vietnam-kurtailmen', nama: 'Vietnam: tenggat tarif dan kurtailmen', jenis: 'mundur', negara: 'VN', lokasi: t('Ninh Thuan, Gia Lai, Binh Thuan', 'Ninh Thuan, Gia Lai, Binh Thuan'),
    profil: [
      { label: t('Tenggat', 'Deadline'), nilai: t('31 Oktober 2021 untuk tarif tetap', '31 October 2021 for the fixed tariff') },
      { label: t('Proyek terlewat', 'Projects missed'), nilai: t('sekitar 4.100 MW menurut investor; 62 proyek menurut Al Jazeera', 'about 4,100 MW per investors; 62 projects per Al Jazeera') },
    ],
    kronologi: [
      { tanggal: '2021-10-31', teks: t('Tenggat tarif tetap berakhir; sebagian proyek belum selesai karena penguncian COVID-19 (peralatan tertahan di pelabuhan empat bulan, ahli asing tak bisa masuk, bank menunda pencairan).', 'Fixed-tariff deadline ends; some projects unfinished due to COVID-19 lockdowns (equipment stranded in port for four months, foreign experts unable to enter, banks slowed disbursement).') },
      { tanggal: '2022-01-06', teks: t('Investor memperingatkan kebangkrutan bila tenggat tak diperpanjang; meminta perpanjangan 3 sampai 6 bulan.', 'Investors warn of bankruptcy unless the deadline is extended; ask for 3 to 6 months.') },
      { tanggal: '2022-05-18', teks: t('Al Jazeera: proyek yang selesai setelah tenggat tak bisa menjual listrik karena belum ada kebijakan harga pengganti; di Ninh Thuan pembangkit surya 450 MW tak bisa menjual 40 persen kapasitas karena kurtailmen.', 'Al Jazeera: projects finished after the deadline cannot sell power because no replacement price policy exists; in Ninh Thuan a 450 MW solar farm cannot sell 40 percent of its capacity due to curtailment.') },
    ],
    sebab: [
      t('Transmisi: jalur butuh sekitar tiga tahun, ladang angin sekitar satu tahun (kutipan Minh Ha Duong di Al Jazeera).', 'Transmission: a line takes about three years, a wind farm about one (Minh Ha Duong quoted by Al Jazeera).'),
      t('Kebijakan: tarif tetap berakhir mendadak tanpa pengganti; pendanaan dan logistik terhenti oleh COVID-19.', 'Policy: the fixed tariff ended abruptly with no replacement; funding and logistics stalled with COVID-19.'),
    ],
    terdampak: t('Pengembang yang meminjam untuk proyek yang selesai setelah tenggat, bank pemberi pinjaman, dan konsumen yang membayar kapasitas tak termanfaatkan.', 'Developers who borrowed for projects finished after the deadline, lending banks, and consumers paying for unused capacity.'),
    seharusnya: H('Mengikat target pembangunan pembangkit dengan target transmisi, dan memberi masa transisi tarif yang jelas sebelum kebijakan lama berakhir.', 'Link generation build-out targets to transmission targets, and give a clear tariff transition period before the old policy ends.'),
    tanda_bahaya: [t('Tarif tetap dengan tenggat keras tanpa perhitungan kapasitas jaringan.', 'Fixed tariff with a hard deadline without grid capacity planning.'), t('Pembatasan keluaran (kurtailmen) mulai muncul pada pembangkit surya di wilayah yang sama.', 'Curtailment begins on solar plants in the same region.')],
    faktor: { jaringan: true, kebijakan_pasar: true, pendanaan: true, logistik: true },
    sumber: ['vnexpress', 'aljaz'], hak_jawab: true, hak_jawab_catatan: HAK,
  },
  {
    id: 'hornsea4', nama: 'Hornsea 4 (Orsted, 2,4 GW, Inggris)', jenis: 'dibatalkan', negara: 'GB', lokasi: t('Laut Utara, Inggris', 'North Sea, UK'),
    profil: [
      { label: t('Kapasitas', 'Capacity'), nilai: 2.4, satuan: 'GW' }, { label: t('Kontrak', 'Contract'), nilai: t('CfD AR6 (September 2024)', 'AR6 CfD (September 2024)') },
    ],
    kronologi: [
      { tanggal: '2024-09-03', teks: t('Hasil AR6 diumumkan; Hornsea 4 memperoleh kontrak selisih.', 'AR6 results announced; Hornsea 4 gets a contract for difference.') },
      { tanggal: '2025-05-07', teks: t('Orsted menghentikan proyek dalam bentuk saat ini: biaya rantai pasok naik, suku bunga lebih tinggi, risiko pembangunan meningkat; hak proyek disimpan.', 'Orsted stops the project in its current form: supply chain costs up, higher interest rates, higher construction risk; project rights retained.') },
    ],
    sebab: [t('Biaya rantai pasok, suku bunga, dan risiko konstruksi membuat kontrak yang dimenangkan tidak lagi menguntungkan (Orsted).', 'Supply chain cost, interest rates and construction risk made the awarded contract uneconomic (Orsted).')],
    terdampak: t('Pemegang saham Orsted, rantai pasok yang kontraknya diakhiri, dan target kapasitas Inggris.', 'Orsted shareholders, supply chain firms whose contracts were terminated, and the UK capacity target.'),
    seharusnya: H('Untuk lepas pantai di Indonesia: kontrak pembelian perlu indeksasi biaya atau jendela renegosiasi agar guncangan bunga dan rantai pasok tidak berujung pembatalan.', 'For offshore in Indonesia: purchase contracts need cost indexation or a renegotiation window so interest-rate and supply-chain shocks do not end in cancellation.'),
    tanda_bahaya: [t('Kontrak harga tetap berusia lebih dari satu tahun sebelum keputusan investasi akhir.', 'A fixed-price contract more than a year old before final investment decision.')],
    faktor: { biaya_makro: true }, sumber: ['ci_h4', 'cms_ar6'], hak_jawab: true, hak_jawab_catatan: HAK,
  },
  {
    id: 'ocean-wind', nama: 'Ocean Wind 1 dan 2 (Orsted, Amerika Serikat)', jenis: 'dibatalkan', negara: 'US', lokasi: t('New Jersey, AS', 'New Jersey, USA'),
    profil: [
      { label: t('Kapasitas', 'Capacity'), nilai: t('Ocean Wind 1 sekitar 1.100 MW dan Ocean Wind 2 sekitar 1.148 MW (S&P Global)', 'Ocean Wind 1 about 1,100 MW and Ocean Wind 2 about 1,148 MW (S&P Global)') },
      { label: t('Penurunan nilai', 'Impairment'), nilai: t('DKK 28,4 miliar sembilan bulan 2023, DKK 19,9 miliar untuk Ocean Wind 1', 'DKK 28.4 billion in nine months of 2023, DKK 19.9 billion for Ocean Wind 1') },
    ],
    kronologi: [{ tanggal: '2023-11-01', teks: t('Orsted menghentikan pengembangan Ocean Wind 1 dan 2, sambil mengambil keputusan investasi untuk Revolution Wind (704 MW).', 'Orsted ceases development of Ocean Wind 1 and 2 while taking the investment decision for Revolution Wind (704 MW).') }],
    sebab: [t('Keterlambatan rantai pasok, suku bunga lebih tinggi, dan tidak adanya penyesuaian kredit energi terbarukan lepas pantai (OREC) pada proyek tetangga (Orsted).', 'Supply chain delays, higher interest rates, and the absence of an offshore renewable energy credit (OREC) adjustment on a sister project (Orsted).')],
    terdampak: t('Pemegang saham Orsted dan program energi bersih negara bagian New Jersey.', 'Orsted shareholders and New Jersey\'s clean energy programme.'),
    seharusnya: H('Menunda keputusan investasi sampai rantai pasok kapal dan turbin terkunci, atau memasukkan klausul penyesuaian harga ke kontrak.', 'Defer investment decision until vessel and turbine supply is locked, or write price adjustment clauses into the contract.'),
    tanda_bahaya: [t('Kapal pemasang tidak terjamin pada tahun konstruksi.', 'Installation vessels not secured for the construction year.')],
    faktor: { biaya_makro: true, logistik: true }, sumber: ['orsted23'], hak_jawab: true, hak_jawab_catatan: HAK,
  },
  {
    id: 'chile-kurtailmen', nama: 'Chile: kurtailmen di utara', jenis: 'mundur', negara: 'CL', lokasi: t('Atacama dan wilayah utara, Chile', 'Atacama and northern Chile'),
    profil: [
      { label: t('Kurtailmen 2024', 'Curtailment 2024'), nilai: 5909, satuan: t('GWh surya dan angin, naik 121 persen (ACERA)', 'GWh of solar and wind, up 121 percent (ACERA)') },
      { label: t('Kapasitas bayu', 'Wind capacity'), nilai: t('hampir 6 GW (15,5 persen kapasitas) pada 2025', 'almost 6 GW (15.5 percent of capacity) in 2025') },
    ],
    kronologi: [{ tanggal: '2025-01-01', teks: t('Pembatasan keluaran melonjak 121 persen pada 2024 karena kemacetan transmisi di utara (tanggal 1 Januari 2025 mewakili laporan tahun 2024).', 'Curtailment jumped 121 percent in 2024 due to transmission congestion in the north (1 January 2025 stands for the 2024 report).') }],
    sebab: [t('Kemacetan transmisi, aturan dispatch kaku, dan penyimpanan yang belum cukup (PV Tech/Ember).', 'Transmission congestion, rigid dispatch rules and insufficient storage (PV Tech/Ember).')],
    terdampak: t('Pengembang yang kehilangan pendapatan; satu sumber menyebut proyek angin Cabo Leones II mengalami tekanan keuangan (tidak diverifikasi lebih lanjut).', 'Developers who lost revenue; one source says the Cabo Leones II wind farm came under financial strain (not verified further).'),
    seharusnya: H('Rencanakan transmisi dan penyimpanan sebelum menambah kapasitas variabel; relevan untuk Sulawesi Selatan dan Jawa-Bali.', 'Plan transmission and storage before adding variable capacity; relevant for South Sulawesi and Java-Bali.'),
    tanda_bahaya: [t('Pembangkit variabel terkonsentrasi di satu wilayah dengan satu koridor transmisi.', 'Variable generation concentrated in one region with one transmission corridor.')],
    faktor: { jaringan: true }, sumber: ['pvtech_cl'], hak_jawab: true, hak_jawab_catatan: HAK,
  },
];

/* ---------- bab 42: daftar periksa ---------- */
const PERAN = [
  { k: 'pengembang', l: t('Pengembang', 'Developer') }, { k: 'investor', l: t('Investor dan pemberi pinjaman', 'Investor and lender') }, { k: 'pemda', l: t('Pemerintah daerah', 'Local government') },
  { k: 'pusat', l: t('Pemerintah pusat', 'Central government') }, { k: 'pln', l: t('PLN', 'PLN') }, { k: 'meti', l: t('METI', 'METI') },
];
const TAHAP = [
  { k: 'lokasi', l: t('Penyaringan lokasi', 'Site screening') }, { k: 'pengukuran', l: t('Pengukuran angin (1 sampai 2 tahun)', 'Wind measurement (1 to 2 years)') }, { k: 'izin', l: t('Perizinan dan AMDAL', 'Permits and EIA') },
  { k: 'jaringan', l: t('Jaringan dan interkoneksi', 'Grid and interconnection') }, { k: 'ppa', l: t('PPA dan tarif', 'PPA and tariff') }, { k: 'pendanaan', l: t('Pendanaan', 'Financing') },
  { k: 'logistik', l: t('Logistik dan konstruksi', 'Logistics and construction') }, { k: 'operasi', l: t('Operasi', 'Operations') },
];
const B = (peran, tahap, id, en, dasar) => ({ peran, tahap, teks: t(id, en), dasar });
const PERIKSA = [
  B('pengembang', 'lokasi', 'Saring lokasi dengan peta angin 100 m lalu cek jalan, pelabuhan, titik sambung PLN terdekat, status hutan, dan tata ruang sebelum membeli data angin.', 'Screen sites with the 100 m wind map, then check roads, port, nearest PLN connection point, forest status and zoning before buying wind data.', 'etp1'),
  B('pengembang', 'pengukuran', 'Pasang menara ukur, SODAR, atau LiDAR sesuai IEC 61400 dan MEASNET minimal satu tahun menerus; anggarkan sekitar Rp1,5 sampai 2 miliar per menara; pada medan berbukit pasang lebih dari satu.', 'Install a met mast, SODAR or LiDAR per IEC 61400 and MEASNET for at least one continuous year; budget about IDR 1.5 to 2 billion per mast; install more than one in rugged terrain.', 'etp1'),
  B('pengembang', 'pengukuran', 'Korelasikan data pendek ke data jangka panjang (ERA5, MERRA-2) dan minta konsultan independen menghitung produksi P50 dan P90 untuk pemberi pinjaman.', 'Correlate short data to long-term data (ERA5, MERRA-2) and have an independent consultant compute P50 and P90 yield for lenders.', 'etp1'),
  B('pengembang', 'izin', 'Siapkan dokumen lingkungan menurut kapasitas (SPPL di bawah 1 MW, UKL-UPL 1 sampai 50 MW, AMDAL 50 MW ke atas) dan telaah dampak burung dan kelelawar, bising, bayangan kedip, serta jarak ke permukiman.', 'Prepare environmental documents by size (SPPL under 1 MW, UKL-UPL 1 to 50 MW, AMDAL 50 MW and above) and assess bird and bat impact, noise, shadow flicker and distance to settlements.', 'etp1'),
  B('pengembang', 'izin', 'Ajukan KKPR untuk lahan di atas 1 ha sejak dini lewat OSS dan cek tumpang tindih hak lahan, tambang, bandara, dan kawasan konservasi.', 'File KKPR early for land over 1 ha via OSS and check overlap with land rights, mining, airports and conservation areas.', 'etp1'),
  B('pengembang', 'jaringan', 'Minta studi sambungan: jarak ke gardu, ketersediaan feeder, kapasitas saluran, dan kebutuhan penguatan; jangan asumsikan saluran dekat lokasi masih kosong.', 'Request a connection study: distance to substation, feeder availability, line capacity and reinforcement needs; do not assume a nearby line is free.', 'etp1'),
  B('pengembang', 'ppa', 'Telaah draf PPA terhadap 10 isu bankability (energi kontrak tahunan, hak beli PLN, force majeure, kredit karbon, mitra wajib, arbitrase, TKDN) sebelum menawar.', 'Review the draft PPA against the 10 bankability issues (annual contracted energy, PLN buy-out right, force majeure, carbon credits, mandatory partner, arbitration, local content) before bidding.', 'etp1'),
  B('pengembang', 'logistik', 'Survei rute dari pelabuhan ke tapak (bilah 70 sampai 80 m, nacelle 150 sampai 200 ton, lengkung dan jembatan) dan anggarkan 15 sampai 30 persen biaya investasi untuk jalan dan pelabuhan.', 'Survey the port-to-site route (70 to 80 m blades, 150 to 200 tonne nacelles, bends and bridges) and budget 15 to 30 percent of investment cost for roads and ports.', 'etp1'),
  B('pengembang', 'operasi', 'Kontrak O&M dengan pemasok turbin, stok suku cadang, dan alat prakiraan 5 sampai 15 menit untuk PLN.', 'Contract O&M with the turbine supplier, hold spare parts, and provide 5 to 15 minute forecasting for PLN.', 'etp1'),
  B('investor', 'pengukuran', 'Minta laporan produksi P50/P90 dari konsultan independen sebelum menyetujui pembiayaan non-recourse.', 'Require an independent P50/P90 yield report before approving non-recourse financing.', 'etp1'),
  B('investor', 'ppa', 'Nilai kecukupan tarif terhadap biaya modal; waspadai penawaran sekitar setengah tarif proyek pembanding (5,5 vs 11 sen USD) tanpa penjelasan.', 'Test tariff adequacy against cost of capital; beware bids at about half the comparable tariff (5.5 vs 11 US cents) without explanation.', 'meti'),
  B('investor', 'pendanaan', 'Tetapkan jadwal financial close dengan pemicu terminasi yang adil; cek bahwa mitra wajib PLN dan struktur pemegang saham tidak memicu konflik biaya.', 'Set a financial-close schedule with fair termination triggers; check that PLN mandatory partner and shareholder structure do not cause cost conflicts.', 'etp1'),
  B('investor', 'logistik', 'Cek lindung nilai kurs dan harga turbin; belajar dari pembatalan Hornsea 4 dan Ocean Wind: biaya rantai pasok dan bunga mengubah ekonomi proyek.', 'Check currency and turbine price hedges; learn from Hornsea 4 and Ocean Wind: supply chain and interest rates changed project economics.', 'ci_h4'),
  B('pemda', 'lokasi', 'Petakan lokasi berangin dalam RTRW dan RUED-P, tandai hutan, geopark, dan permukiman agar KKPR tidak berlarut.', 'Map windy sites in RTRW and RUED-P, mark forests, geoparks and settlements so KKPR does not drag on.', 'etp1'),
  B('pemda', 'izin', 'Bentuk satu pintu perizinan daerah dan jadwalkan musyawarah desa sebelum lahan dibebaskan.', 'Create a single regional permit desk and schedule village consultations before land is released.', 'meti'),
  B('pemda', 'logistik', 'Gabungkan perbaikan jalan dan pelabuhan dengan kebutuhan ekonomi daerah agar tidak hanya melayani satu proyek.', 'Combine road and port upgrades with regional economic needs so they do not serve a single project.', 'etp2'),
  B('pusat', 'lokasi', 'Terbitkan peta angin terbuka berbasis pengukuran dan unggah data pengukuran ke basis data nasional.', 'Publish an open wind map based on measurements and upload measurement data to a national database.', 'etp1'),
  B('pusat', 'izin', 'Tetapkan pedoman dampak PLTB (jarak ke permukiman, bising, bayangan kedip, burung) karena belum ada acuan khusus.', 'Issue wind farm impact guidelines (distance to settlements, noise, shadow flicker, birds) since no specific guidance exists.', 'etp1'),
  B('pusat', 'ppa', 'Selaraskan Permen ESDM 10/2017 dan 10/2018 dengan sifat energi terbarukan, dan rujuk TKDN: belum ada TKDN khusus bayu.', 'Align Permen ESDM 10/2017 and 10/2018 with the nature of renewable energy; note there is no wind-specific local content rule yet.', 'etp1'),
  B('pusat', 'pendanaan', 'Siapkan jaminan atau dukungan pemerintah untuk proyek yang kena risiko jaringan atau kebijakan.', 'Prepare guarantees or government support for projects exposed to grid or policy risk.', 'etp2'),
  B('pln', 'jaringan', 'Sinkronkan perluasan jaringan dengan daftar proyek RUPTL dan tetapkan kapasitas serap per sistem yang diumumkan.', 'Synchronise grid expansion with RUPTL projects and publish per-system absorption capacity.', 'etp2'),
  B('pln', 'ppa', 'Bahas ulang isu bankability PPA sebelum tender berikutnya dan umumkan jadwal lelang tahunan agar harga turun seperti di India.', 'Revisit PPA bankability before the next tender and announce an annual tender calendar so prices fall as in India.', 'etp1'),
  B('pln', 'operasi', 'Siapkan pusat kendali dan alat prakiraan pembangkit variabel untuk sistem luar Jawa; tetapkan siapa menanggung biaya cadangan dan kurtailmen.', 'Set up control centres and variable generation forecasting for systems outside Java; decide who bears reserve and curtailment costs.', 'etp1'),
  B('meti', 'lokasi', 'Pertahankan direktori proyek bayu dan tandai data yang tidak cocok (lihat bab 10).', 'Maintain the wind project directory and flag mismatched data (see chapter 10).', 'meti'),
  B('meti', 'ppa', 'Kumpulkan masukan anggota tentang draf PPA dan RUU EBET lalu serahkan kepada ESDM dan DPR.', 'Collect member input on PPA drafts and the EBET bill and submit it to ESDM and DPR.', 'konsul'),
  B('meti', 'operasi', 'Terima koreksi dan hak jawab pada bab 40 dan perbarui kasus bila ada sumber baru.', 'Accept corrections and rights of reply on chapter 40 and update cases when new sources appear.', 'meti'),
];

/* ---------- perakitan ---------- */
export function bangun() {
  const bab = {};
  bab['2'] = { tipe: 'faq', butir: [
    { t: t('Berapa besar PLTB di Indonesia sekarang?', 'How large is wind power in Indonesia today?'), j: t(`Kapasitas terpasang sekitar ${k(kap2024)} MW (IRENA), seluruhnya dua PLTB utilitas di Sulawesi Selatan (Sidrap 75 MW dan Tolo 72 MW) plus turbin kecil di Bali. Produksi 2024 sekitar ${Math.round(gen2024)} GWh (Ember).`, `Installed capacity is about ${kap2024} MW (IRENA), essentially two utility wind farms in South Sulawesi (Sidrap 75 MW and Tolo 72 MW) plus small turbines in Bali. 2024 generation was about ${Math.round(gen2024)} GWh (Ember).`) },
    { t: t('Berapa potensi anginnya?', 'What is the wind potential?'), j: t('RUEN menyebut 60,6 GW bayu darat (angin di atas 4 m/s pada 50 m, data 2015); BBSP KEBTKE 2023 menambah 94,2 GW lepas pantai sehingga total sekitar 155 GW. Kajian lain memberi rentang 17 sampai 155 GW. Bank Dunia (via Katadata) menyebut potensi teknis lepas pantai 277 GW, angka teoretis dari kecepatan angin dan kedalaman laut saja.', 'RUEN gives 60.6 GW onshore (wind above 4 m/s at 50 m, 2015 data); BBSP KEBTKE 2023 adds 94.2 GW offshore for about 155 GW in total. Other studies give a range of 17 to 155 GW. The World Bank (via Katadata) cites 277 GW technical offshore potential, a theoretical figure from wind speed and sea depth only.') },
    { t: t('Mengapa begitu sedikit dimanfaatkan?', 'Why is so little used?'), j: t('ETP menyebut kendala: data angin jangka panjang terbatas, tarif dan PPA yang sulit dibiayai, jaringan, lahan dan izin, serta logistik. Tidak ada tambahan kapasitas sejak Tolo I pada 2019.', 'ETP lists the barriers: limited long-term wind data, hard-to-finance tariffs and PPAs, grid, land and permits, and logistics. No capacity has been added since Tolo I in 2019.') },
    { t: t('Berapa tarif PLTB?', 'What is the wind tariff?'), j: t('Perpres 112/2022: tahun 1 sampai 10 = koefisien x faktor lokasi F, lalu nilai tetap; untuk di atas 20 MW 9,54 sen USD per kWh x F pada 10 tahun pertama dan 5,73 sen sesudahnya. Sidrap dan Tolo dikontrak sekitar 11 sen selama 30 tahun; penawaran Tanah Laut 5,5 sen.', 'Perpres 112/2022: years 1 to 10 = coefficient x location factor F, then a fixed value; above 20 MW it is 9.54 US cents per kWh x F for the first 10 years and 5.73 cents after. Sidrap and Tolo were contracted at about 11 cents for 30 years; the Tanah Laut bid was 5.5 cents.') },
    { t: t('Apakah harus mengukur angin sendiri?', 'Must I measure wind myself?'), j: t('Untuk ikut tender PLN, ya: minimal satu tahun pengukuran menerus di lokasi. Satu menara ukur berbiaya sekitar Rp1,5 sampai 2 miliar menurut ETP.', 'To bid in a PLN tender, yes: at least one continuous year on site. A mast costs about IDR 1.5 to 2 billion per ETP.') },
    { t: t('Apakah PLTB perlu AMDAL?', 'Does a wind farm need an EIA?'), j: t('Menurut Permen LHK 4/2021 (via ETP): AMDAL untuk 50 MW ke atas, UKL-UPL untuk 1 sampai 50 MW, SPPL di bawah 1 MW.', 'Per Environment Ministry Regulation 4/2021 (via ETP): AMDAL for 50 MW and above, UKL-UPL for 1 to 50 MW, SPPL below 1 MW.') },
    { t: t('Apakah ada TKDN untuk turbin?', 'Is there a local content rule for turbines?'), j: t('Belum ada TKDN khusus bayu (ETP 2023), tetapi pengembang khawatir akan diberlakukan padahal rotor, bilah, dan generator belum diproduksi di Indonesia; baru menara yang dibuat untuk ekspor.', 'There is no wind-specific local content rule yet (ETP 2023), but developers fear one, while rotors, blades and generators are not made in Indonesia; only towers are made, for export.') },
    { t: t('Mengapa Sulawesi Selatan?', 'Why South Sulawesi?'), j: t('Dua PLTB utilitas dibangun di sana (Sidrap dan Tolo), diajukan sebelum 2017 dan dibeli PLN tanpa lelang. Lokasinya juga tercatat di atas 5 m/s menurut LAPAN.', 'Both utility wind farms are there (Sidrap and Tolo), proposed before 2017 and bought by PLN without a tender. LAPAN also lists it above 5 m/s.') },
    { t: t('Bagaimana dengan lepas pantai?', 'What about offshore?'), j: t('Belum ada proyek lepas pantai di Indonesia. Biaya terpasang global lepas pantai USD 2.852 per kW dibanding USD 1.041 per kW darat (IRENA 2024), dan Orsted membatalkan Hornsea 4 dan Ocean Wind karena biaya, sehingga pembelajaran luar negeri menekankan risiko biaya.', 'There is no offshore project in Indonesia yet. Global offshore installed cost is USD 2,852 per kW against USD 1,041 per kW onshore (IRENA 2024), and Orsted cancelled Hornsea 4 and Ocean Wind over costs, so foreign lessons stress cost risk.') },
    { t: t('Apa itu kurtailmen?', 'What is curtailment?'), j: t('Pembatasan keluaran pembangkit oleh operator jaringan karena kelebihan pasokan atau saluran penuh. Chile membatasi 5.909 GWh surya dan angin pada 2024 dan Vietnam mengalaminya di Ninh Thuan.', 'Operator-ordered limits on plant output due to oversupply or full lines. Chile curtailed 5,909 GWh of solar and wind in 2024 and Vietnam saw it in Ninh Thuan.') },
    { t: t('Bagaimana angin skala kecil?', 'What about small-scale wind?'), j: t('Contoh 2007 di Nusa Penida berhenti kurang dari dua tahun karena suku cadang; hibrida Pandansimo (Bantul) disebut hanya dua pertiga turbin berputar. Pelajaran: kontrak O&M dan pengelola harus ada sebelum serah terima.', 'The 2007 Nusa Penida example stopped within two years because of spare parts; the Pandansimo hybrid (Bantul) is reported to have only two thirds of its turbines turning. Lesson: O&M contracts and an operator must exist before handover.') },
  ] };
  bab['3'] = { tipe: 'glosarium', butir: [
    ['PLTB', 'Pembangkit Listrik Tenaga Bayu (angin)', 'Wind power plant'], ['RUEN', 'Rencana Umum Energi Nasional (Perpres 22/2017)', 'National General Energy Plan (Perpres 22/2017)'],
    ['RUPTL', 'Rencana Usaha Penyediaan Tenaga Listrik PLN, daftar proyek yang boleh diadakan PLN', 'PLN electricity supply business plan, the list of projects PLN may procure'],
    ['PPA', 'Perjanjian jual beli listrik antara PLN dan pengembang', 'Power purchase agreement between PLN and a developer'],
    ['DPT', 'Daftar Penyedia Terseleksi, prakualifikasi IPP di PLN', 'Selected Provider List, PLN pre-qualification for IPPs'],
    ['KKPR', 'Kesesuaian Kegiatan Pemanfaatan Ruang, izin tata ruang lahan di atas 1 ha', 'Spatial utilisation conformity permit, for land over 1 ha'],
    ['AMDAL, UKL-UPL, SPPL', 'Tiga tingkat dokumen lingkungan menurut kapasitas', 'Three tiers of environmental documents by capacity'],
    ['WRA', 'Wind Resource Assessment, kajian sumber angin dari pengukuran dan model', 'Wind Resource Assessment from measurement and models'],
    ['P50 dan P90', 'Produksi tahunan yang dilampaui dengan peluang 50 persen dan 90 persen', 'Annual yield exceeded with 50 percent and 90 percent probability'],
    ['Faktor kapasitas', 'Produksi sebenarnya dibagi produksi maksimum teoretis dalam setahun', 'Actual output divided by theoretical maximum over a year'],
    ['Kurtailmen', 'Pembatasan keluaran pembangkit oleh operator jaringan', 'Operator-ordered limitation of plant output'],
    ['Deemed energy', 'Klausul yang membuat pembeli membayar energi yang siap diproduksi tetapi tidak dapat disalurkan', 'Clause making the buyer pay for energy ready but undeliverable'],
    ['CfD', 'Contract for difference, kontrak selisih harga dua arah', 'Contract for difference, a two-way price contract'],
    ['COD', 'Commercial operation date, tanggal operasi komersial', 'Commercial operation date'],
    ['BESS', 'Battery energy storage system, sistem baterai', 'Battery energy storage system'],
    ['LCOE', 'Levelized cost of energy, biaya energi rata-rata sepanjang umur proyek', 'Levelized cost of energy over project life'],
    ['TKDN', 'Tingkat Komponen Dalam Negeri', 'Local content level'],
    ['BPP', 'Biaya Pokok Penyediaan listrik, patokan harga beli PLN', 'PLN cost of supply, a benchmark for purchase price'],
    ['Nacelle', 'Rumah generator dan gearbox di puncak menara', 'Housing for generator and gearbox atop the tower'],
    ['MEASNET', 'Jaringan lembaga yang menyeragamkan pengukuran angin', 'Network harmonising wind measurement standards'],
  ].map(([i, a, b]) => ({ istilah: t(i, i), arti: t(a, b) })) };
  bab['4'] = { tipe: 'teks', sumber: ['etp1', 'ruen', 'irena_cost'], paragraf: [
    t('Pembangkit listrik tenaga bayu mengubah energi gerak angin menjadi listrik lewat bilah yang memutar generator. Untuk Indonesia, angin kuat bersifat setempat: kecepatan umumnya 3 sampai 6 m/s, dan Global Wind Atlas menunjukkan dominasi 4 sampai 5 m/s pada 100 m, sehingga lokasi bagus terkonsentrasi di punggung bukit dan selat (NTT, NTB, Sulawesi Selatan, pantai selatan Jawa).', 'A wind power plant converts the kinetic energy of wind into electricity through blades that drive a generator. In Indonesia strong wind is local: speeds are typically 3 to 6 m/s and Global Wind Atlas is dominated by 4 to 5 m/s at 100 m, so good sites cluster on ridges and straits (East and West Nusa Tenggara, South Sulawesi, south coast of Java).'),
    t('Relevansinya untuk energi terbarukan: bayu darat adalah sumber baru termurah di dunia (LCOE global USD 0,034 per kWh, IRENA 2024) dan melengkapi surya karena profil produksinya berbeda; tetapi di Indonesia pemanfaatannya kurang dari 0,1 persen potensi.', 'Relevance for renewables: onshore wind is the cheapest new source in the world (global LCOE USD 0.034 per kWh, IRENA 2024) and complements solar because its output profile differs; but in Indonesia use is under 0.1 percent of potential.'),
    t('Komponen utama berukuran raksasa: bilah 57 sampai 80 m, nacelle 150 sampai 200 ton, menara hingga 133 m. Karena itu logistik jalan dan pelabuhan menentukan, bukan hanya kecepatan angin.', 'Key components are enormous: blades 57 to 80 m, nacelles 150 to 200 tonnes, towers up to 133 m. Road and port logistics therefore matter as much as wind speed.'),
  ] };
  bab['5'] = { tipe: 'rumus', sumber: ['stat', 'etp1', 'esdm_sidrap'], rumus: [
    t('Daya dari angin: P = 0,5 x kerapatan udara x luas sapuan rotor x v kubik x Cp; Cp dibatasi batas Betz.', 'Power in wind: P = 0.5 x air density x rotor swept area x v cubed x Cp; Cp is capped by the Betz limit.'),
    t('Energi tahunan (GWh) = kapasitas (MW) x 8,76 x faktor kapasitas.', 'Annual energy (GWh) = capacity (MW) x 8.76 x capacity factor.'),
    t('Faktor kapasitas (persen) = produksi (GWh) / (kapasitas MW x 8,76) x 100.', 'Capacity factor (percent) = generation (GWh) / (capacity MW x 8.76) x 100.'),
    t('Perhatian: karena v dipangkatkan tiga, selisih kecil kecepatan angin menggandakan produksi; itu sebabnya pengukuran lokasi wajib.', 'Note: because v is cubed, small differences in wind speed double production; that is why on-site measurement is mandatory.'),
  ], contoh: [
    t(`Contoh dari data resmi: PLTB Sulawesi Selatan 2024 memproduksi ${prodSul} GWh dari ${kapSul} MW. Faktor kapasitas = ${prodSul} / (${kapSul} x 8,76) x 100 = ${k(fkSul)} persen (EST).`, `Example from official data: South Sulawesi wind produced ${prodSul} GWh from ${kapSul} MW in 2024. Capacity factor = ${prodSul} / (${kapSul} x 8.76) x 100 = ${fkSul} percent (EST).`),
    t(`Contoh nasional: ${Math.round(gen2024)} GWh (Ember) dari ${kap2024} MW (IRENA) memberi ${k(fkNas2024)} persen (EST).`, `National example: ${Math.round(gen2024)} GWh (Ember) from ${kap2024} MW (IRENA) gives ${fkNas2024} percent (EST).`),
    t(`Proyeksi Sidrap pada faktor kapasitas ${k(fkSul)} persen: 75 x 8,76 x ${k(fkSul / 100)} = sekitar ${k(gwhSidrap)} GWh per tahun (EST, ilustrasi).`, `Sidrap projection at ${fkSul} percent capacity factor: 75 x 8.76 x ${fkSul / 100} = about ${gwhSidrap} GWh per year (EST, illustration).`),
  ] };
  bab['6'] = { tipe: 'langkah', sumber: ['etp1', 'etp2', 'esdm_sidrap'], butir: [
    { judul: t('Penyusun kebijakan dan perencana', 'Policy makers and planners'), isi: t('ESDM, DEN, dan PLN menyusun RUEN dan RUPTL; proyek harus terdaftar di RUPTL sebelum PLN mengadakannya.', 'ESDM, DEN and PLN draft RUEN and RUPTL; a project must be in the RUPTL before PLN procures it.'), pelaku: t('ESDM, DEN, PLN', 'ESDM, DEN, PLN') },
    { judul: t('Pengukuran dan kajian angin', 'Wind measurement and assessment'), isi: t('Pengembang memasang menara ukur atau LiDAR minimal satu tahun, lalu konsultan independen memvalidasi.', 'Developers install masts or LiDAR for at least a year, then an independent consultant validates.'), pelaku: t('Pengembang, konsultan WRA', 'Developer, WRA consultant') },
    { judul: t('Pengembang dan pemilik proyek', 'Developers and project owners'), isi: t('Pengembang internasional dengan mitra lokal (mis. UPC Renewables, Vena Energy); PLN mewajibkan mitra tertentu di tender terbaru.', 'International developers with local partners (e.g. UPC Renewables, Vena Energy); PLN requires a specific partner in recent tenders.'), pelaku: t('IPP, PLN Nusantara Renewables', 'IPPs, PLN Nusantara Renewables') },
    { judul: t('Pembeli', 'Buyer'), isi: t('PLN adalah pembeli tunggal; PPA lewat penunjukan langsung atau lelang setelah prakualifikasi DPT.', 'PLN is the single buyer; PPA through direct selection or tender after DPT pre-qualification.'), pelaku: t('PLN', 'PLN') },
    { judul: t('Pendanaan', 'Financing'), isi: t('Bank dan lembaga pembangunan menilai PPA, laporan P50/P90, dan jaringan; pembiayaan non-recourse menuntut konsultan independen.', 'Banks and development lenders assess the PPA, P50/P90 report and grid; non-recourse financing requires an independent consultant.'), pelaku: t('Bank, lembaga pembangunan', 'Banks, development lenders') },
    { judul: t('Pemasok turbin dan rantai pasok', 'Turbine supply and supply chain'), isi: t('Rotor, bilah, hub, gearbox, dan generator diimpor; baru menara yang dibuat di Indonesia (untuk ekspor).', 'Rotors, blades, hubs, gearboxes and generators are imported; only towers are made in Indonesia (for export).'), pelaku: t('Pabrikan turbin, produsen menara', 'Turbine makers, tower makers') },
    { judul: t('Pelabuhan dan logistik', 'Ports and logistics'), isi: t('Di Sidrap pelabuhan dimodifikasi untuk bongkar dan simpan; satu bilah 57 m (15 ton) butuh sekitar 10 jam ke lokasi; jalan dan pelabuhan bisa 15 sampai 30 persen investasi.', 'At Sidrap the port was modified for offloading and storage; one 57 m (15 tonne) blade took about 10 hours to site; roads and ports can be 15 to 30 percent of investment.'), pelaku: t('Otoritas pelabuhan, pengembang, pemda', 'Port authorities, developer, local government') },
    { judul: t('Konstruksi dan interkoneksi', 'Construction and interconnection'), isi: t('Sidrap dibangun Agustus 2015 sampai Maret 2018 (sekitar 31 bulan, EST) dan tersambung ke jaringan 150 kV.', 'Sidrap was built August 2015 to March 2018 (about 31 months, EST) and connected to the 150 kV grid.'), pelaku: t('EPC, PLN', 'EPC, PLN') },
    { judul: t('Operasi dan pemeliharaan', 'Operations and maintenance'), isi: t('Kontrak O&M dengan pemasok, prakiraan keluaran untuk operator sistem; pelajaran Nusa Penida: tanpa suku cadang turbin berhenti.', 'O&M contract with the supplier, output forecasts for the system operator; Nusa Penida lesson: without spares turbines stop.'), pelaku: t('IPP, PLN', 'IPP, PLN') },
  ] };
  bab['7'] = grafikKapasitas();
  bab['8'] = tabelAtlas();
  bab['9'] = { tipe: 'tabel', per: 12, sumber: ['etp1', 'esdm_sidrap', 'esdm_tolo', 'bt_tl', 'gn_sidrap'], kolom: [
    { k: 'nama', l: t('Pemain', 'Player') }, { k: 'peran', l: t('Peran', 'Role') }, { k: 'catatan', l: t('Catatan bersumber', 'Sourced note') },
  ], baris: [
    { nama: 'Kementerian ESDM (Ditjen EBTKE, Ditjen Ketenagalistrikan)', peran: t('regulator dan penyusun RUEN/RUPTL', 'regulator and RUEN/RUPTL approver'), catatan: t('mengesahkan RUPTL 2025-2034; BBSP KEBTKE mengukur angin 2017', 'approved RUPTL 2025-2034; BBSP KEBTKE measured wind in 2017') },
    { nama: 'PT PLN (Persero)', peran: t('pembeli tunggal dan pengadaan', 'single buyer and procurement'), catatan: t('mengadakan lewat DPT dan penunjukan langsung/lelang; kini meminta mitra wajib dan baterai di sistem kecil', 'procures via DPT and direct selection/tender; now requires a mandatory partner and batteries in small systems') },
    { nama: 'PLN Nusantara Renewables / PLN Nusantara Power', peran: t('mitra wajib PLN', 'PLN mandatory partner'), catatan: t('memegang 30 persen di PT Tata Alam Baru (Tanah Laut) menurut Bloomberg Technoz', 'holds 30 percent of PT Tata Alam Baru (Tanah Laut) per Bloomberg Technoz') },
    { nama: 'UPC Renewables / PT UPC Sidrap Bayu Energi', peran: t('pengembang Sidrap dan Sukabumi', 'developer of Sidrap and Sukabumi'), catatan: t('Sidrap 75 MW; Sukabumi dalam negosiasi PPA', 'Sidrap 75 MW; Sukabumi in PPA negotiation') },
    { nama: 'Vena Energy / PT Energi Bayu Jeneponto', peran: t('pengembang Tolo', 'Tolo developer'), catatan: t('Tolo I 72 MW, COD 14 Mei 2019; tahap II direncanakan dengan penyimpanan', 'Tolo I 72 MW, COD 14 May 2019; phase II planned with storage') },
    { nama: 'Total Eren dan Adaro Power (konsorsium awal)', peran: t('pemenang lelang Tanah Laut', 'Tanah Laut tender winner'), catatan: t('LOI 15 Nov 2022; struktur pemilik berubah ke Tata Alam Baru pada 2025', 'LOI 15 Nov 2022; ownership structure changed to Tata Alam Baru in 2025') },
    { nama: 'Gamesa (Siemens Gamesa)', peran: t('pemasok turbin Sidrap', 'Sidrap turbine supplier'), catatan: t('30 unit 2,5 MW', '30 units of 2.5 MW') },
    { nama: 'PT Grand Sains dan PT Dwida Jaya Tama', peran: t('manufaktur dalam negeri (anggota/pemain di direktori METI)', 'domestic manufacturers (members/players in the METI directory)'), catatan: t('profil terinci ada di direktori; belum ada sumber produksi bilah/turbin utuh', 'detailed profiles are in the directory; no source yet for whole blade/turbine production') },
    { nama: 'Energy Transition Partnership', peran: t('pendana kajian dan peta jalan', 'funder of studies and roadmap'), catatan: t('menerbitkan peta jalan bayu darat (13 Des 2023) dan rencana investasi (23 Sep 2024)', 'published the onshore wind roadmap (13 Dec 2023) and investment plan (23 Sep 2024)') },
  ], catatan: t('Daftar lengkap pemain otomatis di lapisan Direktori (24 organisasi bertag bayu). Baris di atas hanya yang punya sumber peran yang dibaca.', 'The full list of players is automatic in the Directory layer (24 organisations tagged wind). Rows above include only those with a sourced role.') };
  bab['10'] = tabelProyek();
  bab['11'] = tabelProduksi();
  bab['12'] = { tipe: 'tabel', per: 10, sumber: ['etp1', 'p112', 'ruen', 'ruptl'], kolom: [
    { k: 'instrumen', l: t('Instrumen', 'Instrument') }, { k: 'isi', l: t('Isi kunci untuk PLTB', 'Key content for wind') }, { k: 'status', l: t('Status', 'Status') },
  ], baris: [
    { instrumen: t('Perpres 22/2017 (RUEN)', 'Perpres 22/2017 (RUEN)'), isi: t('Target bayu 1,8 GW pada 2025 dan 28 GW pada 2050; potensi 60,6 GW darat (di atas 4 m/s pada 50 m)', 'Wind target 1.8 GW in 2025 and 28 GW in 2050; 60.6 GW onshore potential (above 4 m/s at 50 m)'), status: t('berlaku', 'in force') },
    { instrumen: t('Perpres 112/2022', 'Perpres 112/2022'), isi: t('Tarif bertingkat per kapasitas: sampai 5 MW 11,22; di atas 5 sampai 20 MW 10,26; di atas 20 MW 9,54 sen USD per kWh x F pada tahun 1 sampai 10, lalu 6,73 / 6,15 / 5,73; masa kontrak maks 30 tahun', 'Tiered tariffs by size: up to 5 MW 11.22; above 5 to 20 MW 10.26; above 20 MW 9.54 US cents per kWh x F for years 1 to 10, then 6.73 / 6.15 / 5.73; contract up to 30 years'), status: t('berlaku (ditetapkan 13 Sep 2022)', 'in force (enacted 13 Sep 2022)') },
    { instrumen: t('Permen ESDM 50/2017', 'Permen ESDM 50/2017'), isi: t('Tarif EBT mengacu BPP daerah; investor menilai BPP berubah tiap tahun dan tidak pasti', 'RE tariffs referenced regional BPP; investors saw annual BPP changes as uncertain'), status: t('digantikan sebagian oleh Perpres 112/2022 (menurut ETP)', 'partly replaced by Perpres 112/2022 (per ETP)') },
    { instrumen: t('Permen ESDM 10/2017 dan 10/2018', 'Permen ESDM 10/2017 and 10/2018'), isi: t('Dasar PPA konvensional dan EBT yang berlaku bersamaan sehingga skema PPA tidak sesuai bayu', 'Basis for conventional and RE PPAs applied together, so the PPA scheme fits wind poorly'), status: t('berlaku (menurut ETP 2023)', 'in force (per ETP 2023)') },
    { instrumen: t('Kepmen ESDM 188.K/TL.03/MEM.L/2025 (RUPTL 2025-2034)', 'Kepmen ESDM 188.K/TL.03/MEM.L/2025 (RUPTL 2025-2034)'), isi: t('Memuat empat proyek PLTB (460 MW) pada tahun 2026 sampai 2030', 'Lists four wind projects (460 MW) for 2026 to 2030'), status: t('berlaku; disahkan 26 Mei 2025', 'in force; approved 26 May 2025') },
    { instrumen: t('Permen LHK 4/2021', 'Environment Ministry Reg. 4/2021'), isi: t('Dokumen lingkungan menurut kapasitas: SPPL (di bawah 1 MW), UKL-UPL (1 sampai 50 MW), AMDAL (50 MW ke atas)', 'Environmental documents by size: SPPL (under 1 MW), UKL-UPL (1 to 50 MW), AMDAL (50 MW and above)'), status: t('berlaku (menurut ETP)', 'in force (per ETP)') },
    { instrumen: t('Permenperin 48/2010, 54/2012, 23/2023', 'Industry Reg. 48/2010, 54/2012, 23/2023'), isi: t('TKDN pembangkit: persentase khusus hanya untuk surya, belum ada untuk bayu', 'Local content for power plants: specific percentage only for solar, none for wind yet'), status: t('berlaku (menurut ETP)', 'in force (per ETP)') },
    { instrumen: t('Perpres 98/2021 (nilai ekonomi karbon)', 'Perpres 98/2021 (carbon economic value)'), isi: t('Kerangka kredit karbon; dalam draf PPA PLN, hasil instrumen berbasis pasar (kredit karbon, REC) menjadi hak PLN', 'Carbon credit framework; in PLN PPA drafts, proceeds of market-based instruments (carbon credits, RECs) go to PLN'), status: t('berlaku', 'in force') },
    { instrumen: t('Permen ESDM 30/2006', 'Permen ESDM 30/2006'), isi: t('Standar kompetensi tenaga teknik pembangkitan EBT termasuk PLTB', 'Competence standards for RE generation technicians including wind'), status: t('dicabut (basis regulasi METI)', 'revoked (METI regulation base)') },
  ] };
  bab['13'] = { tipe: 'linimasa', sumber: ['esdm_sidrap', 'esdm_tolo', 'etp1', 'ruptl', 'bt_tl', 'p112', 'mongabay_np', 'bisnis_tl'], butir: [
    { tanggal: '2007-11-01', judul: t('PLTB skala kecil Puncak Mundi, Nusa Penida diresmikan (berhenti kurang dari dua tahun)', 'Small Puncak Mundi wind farm in Nusa Penida inaugurated (stops within two years)'), url: SUMBER.mongabay_np.url },
    { tanggal: '2015-08-01', judul: t('Konstruksi PLTB Sidrap dimulai', 'Sidrap wind farm construction starts'), url: SUMBER.esdm_sidrap.url },
    { tanggal: '2018-04-05', judul: t('PLTB Sidrap I beroperasi komersial; diresmikan 2 Juli 2018', 'Sidrap I enters commercial operation; inaugurated 2 July 2018'), url: SUMBER.esdm_sidrap.url },
    { tanggal: '2019-05-14', judul: t('PLTB Tolo I beroperasi komersial', 'Tolo I enters commercial operation'), url: SUMBER.esdm_tolo.url },
    { tanggal: '2022-09-13', judul: t('Perpres 112/2022 ditetapkan (tarif bertingkat EBT)', 'Perpres 112/2022 enacted (tiered RE tariffs)'), url: SUMBER.p112.url },
    { tanggal: '2022-11-15', judul: t('Surat niat PLTB Tanah Laut ditandatangani di Bali', 'Tanah Laut letter of intent signed in Bali'), url: SUMBER.bisnis_tl.url },
    { tanggal: '2023-05-04', judul: t('PPA Tanah Laut ditandatangani', 'Tanah Laut PPA signed'), url: SUMBER.bt_tl.url },
    { tanggal: '2023-12-13', judul: t('Peta jalan bayu darat ETP terbit (v5.0)', 'ETP onshore wind roadmap published (v5.0)'), url: SUMBER.etp1.url },
    { tanggal: '2025-05-26', judul: t('Kepmen RUPTL 2025-2034 disahkan', 'RUPTL 2025-2034 decree approved'), url: SUMBER.ruptl.url },
    { tanggal: '2025-07-01', judul: t('PLN dilaporkan menimbang terminasi PLTB Tanah Laut', 'PLN reported to weigh termination of Tanah Laut wind farm'), url: SUMBER.bt_tl.url },
    { tanggal: '2026-01-01', judul: t('Target COD tahun 2026 di RUPTL (Bayu Sumatera tahap pertama dan Tanah Laut, skenario RE Base)', 'RUPTL COD target year 2026 (Bayu Sumatera first stage and Tanah Laut, RE Base scenario)'), url: SUMBER.ruptl.url },
    { tanggal: '2028-01-01', judul: t('Target COD tahun 2028 di RUPTL (PLTB Banten 100 MW dan Bayu Sumatera tahap kedua)', 'RUPTL COD target year 2028 (Banten 100 MW and Bayu Sumatera second stage)'), url: SUMBER.ruptl.url },
    { tanggal: '2029-01-01', judul: t('Target COD tahun 2029 sampai 2030 di RUPTL (PLTB Banten 180 MW, status tidak diketahui)', 'RUPTL COD target years 2029 to 2030 (Banten 180 MW, status unknown)'), url: SUMBER.ruptl.url },
  ], catatan: t('Entri berdata tahun saja memakai 1 Januari sebagai penanda; tanggal tepat tidak disebut sumber.', 'Entries with year-only data use 1 January as a marker; exact dates are not stated by the sources.') };
  bab['14'] = { tipe: 'teks', sumber: ['etp1', 'p112'], paragraf: [
    t('Kewajiban: dokumen lingkungan menurut kapasitas (AMDAL untuk 50 MW ke atas), pengukuran angin minimal satu tahun di lokasi untuk tender PLN, prakualifikasi DPT, dan pada tender terbaru mitra wajib yang ditunjuk PLN. PLN juga meminta baterai di sistem kecil dengan kompensasi tarif tambahan.', 'Obligations: environmental documents by size (AMDAL for 50 MW and above), at least one year of on-site wind measurement for PLN tenders, DPT pre-qualification and, in recent tenders, a PLN-designated mandatory partner. PLN also asks for batteries in small systems with an additional tariff as compensation.'),
    t('Sanksi dan risiko: pelanggaran TKDN bila kelak diberlakukan dapat didenda sebesar selisih nilai komponen lokal dan impor (draf PPA Tanah Laut menurut ETP); PLN bisa menerminasi dan membeli proyek sedikitnya sebesar utang senior.', 'Sanctions and risk: any local content breach, if later imposed, may be fined at the value difference between local and imported components (Tanah Laut PPA draft per ETP); PLN may terminate and buy the project at no less than senior debt.'),
    t('Insentif: tarif bertingkat Perpres 112/2022 (9,54 sampai 11,22 sen USD per kWh x F pada tahun 1 sampai 10). Insentif fiskal terperinci khusus bayu tidak ditemukan dalam sumber yang dibaca; lihat lapisan Insentif METI.', 'Incentives: tiered tariffs under Perpres 112/2022 (9.54 to 11.22 US cents per kWh x F in years 1 to 10). Detailed wind-specific fiscal incentives were not found in the sources read; see the METI Incentives layer.'),
  ] };
  bab['15'] = { tipe: 'langkah', sumber: ['etp1', 'etp2'], butir: [
    { judul: t('Pastikan proyek masuk RUPTL', 'Make sure the project is in RUPTL'), isi: t('Tanpa tercantum di RUPTL, PLN tidak membuka jalur pengadaan.', 'Without a RUPTL listing PLN does not open a procurement path.'), pelaku: t('PLN, ESDM', 'PLN, ESDM') },
    { judul: t('Prakualifikasi DPT', 'DPT pre-qualification'), isi: t('Serahkan dokumen hukum, portofolio, dan stabilitas keuangan.', 'Submit legal documents, portfolio and financial stability.'), pelaku: t('Pengembang', 'Developer') },
    { judul: t('Pengukuran angin minimal 1 tahun', 'At least 1 year of wind measurement'), isi: t('Biaya sekitar Rp1,5 sampai 2 miliar per menara atau sewa LiDAR/SODAR yang setara; risiko hangus bila kalah tender.', 'Cost about IDR 1.5 to 2 billion per mast or equivalent LiDAR/SODAR rental; sunk if the tender is lost.'), pelaku: t('Pengembang', 'Developer') },
    { judul: t('Izin lahan (KKPR) dan lingkungan', 'Land permit (KKPR) and environmental'), isi: t('KKPR untuk lahan di atas 1 ha dikelola pusat lewat OSS dan KATR/BPN dengan antrean panjang; AMDAL untuk 50 MW ke atas.', 'KKPR for land over 1 ha is handled centrally via OSS and KATR/BPN with a long queue; AMDAL for 50 MW and above.'), pelaku: t('KATR/BPN, KLHK, pemda', 'KATR/BPN, Environment Ministry, local government') },
    { judul: t('Tender atau penunjukan, PPA', 'Tender or direct selection, PPA'), isi: t('Telaah draf PPA; tanda tangan PPA tidak sama dengan pendanaan.', 'Review the draft PPA; PPA signature is not financing.'), pelaku: t('PLN, pengembang', 'PLN, developer') },
    { judul: t('Financial close', 'Financial close'), isi: t('Syarat: PPA yang bisa dibiayai, laporan P50/P90 independen, jalur jaringan, dan izin.', 'Requires a bankable PPA, independent P50/P90 report, grid path and permits.'), pelaku: t('Pengembang, pemberi pinjaman', 'Developer, lenders') },
    { judul: t('Konstruksi dan COD', 'Construction and COD'), isi: t('Sidrap memakan sekitar 31 bulan (EST).', 'Sidrap took about 31 months (EST).'), pelaku: t('EPC, PLN', 'EPC, PLN') },
  ], catatan: t('Lama dan biaya yang disebut berasal dari ETP dan ESDM; durasi tiap izin tidak dipublikasikan sumber yang dibaca.', 'Durations and costs cited come from ETP and ESDM; the duration of each permit is not published in the sources read.') };
  const kons = baca('konsultasi.json').baris.find((b) => b.id === 'ruu-ebet');
  bab['16'] = { tipe: 'teks', sumber: ['konsul'], paragraf: [
    t(`RUU Energi Baru dan Energi Terbarukan (RUU EBET) berstatus ${kons.tahap} di ${kons.instansi} per ${kons.tanggal}; METI meminta pengesahan segera. Forum Konsultasi METI memuat posisi lengkap. Belum ada konsultasi publik khusus bayu yang terverifikasi per ${HARI}.`, `The New and Renewable Energy bill (RUU EBET) is in deliberation at DPR Commission XII as of ${kons.tanggal}; METI urged swift passage. The METI Consultation forum holds the full position. No wind-specific public consultation was verified as of ${HARI}.`),
  ] };
  bab['17'] = { tipe: 'teks', sumber: ['gwec', 'irena_cost', 'cms_ar6', 'etp1', 'li_tl', 'esdm_sidrap', 'esdm_tolo'], paragraf: [
    t('Dunia memasang rekor 117 GW bayu pada 2024 (109 GW darat dan 8 GW lepas pantai), sehingga total 1.136 GW; GWEC dan Mercom melaporkan sekitar 165 GW pada 2025. Biaya terpasang global 2024 sekitar USD 1.041 per kW darat dan USD 2.852 per kW lepas pantai, dengan LCOE darat USD 0,034 per kWh (IRENA, via ringkasan pihak ketiga).', 'The world installed a record 117 GW of wind in 2024 (109 GW onshore, 8 GW offshore) for 1,136 GW in total; GWEC and Mercom report about 165 GW in 2025. Global installed costs in 2024 were about USD 1,041 per kW onshore and USD 2,852 per kW offshore, with onshore LCOE at USD 0.034 per kWh (IRENA, via third-party summary).'),
    t('Dalam negeri, ukuran turbin sudah berubah dalam setahun: Sidrap memakai 2,5 MW dengan menara 80 m dan bilah 57 m, sedangkan Tolo memakai 3,6 MW dengan menara 133 m dan bilah 63 m. Tanah Laut direncanakan dengan baterai 10 MW/10 MWh, yang disebut PPA bayu dengan BESS pertama di Indonesia.', 'Domestically, turbine size changed within a year: Sidrap used 2.5 MW with an 80 m tower and 57 m blades, while Tolo used 3.6 MW with a 133 m tower and 63 m blades. Tanah Laut was planned with a 10 MW/10 MWh battery, described as Indonesia\'s first wind PPA with BESS.'),
    t('Lepas pantai terapung baru mendapat satu kontrak CfD di Inggris pada AR6 (GBP 139,93 per MWh harga 2012). Alat prakiraan produksi 5 sampai 15 menit belum tersedia untuk PLTB Indonesia (ETP). Tingkat kematangan teknologi (TRL) tidak dimuat karena tidak ada sumber bertanggal.', 'Floating offshore received a single CfD in the UK in AR6 (GBP 139.93 per MWh 2012 prices). 5 to 15 minute output forecasting is not yet available for Indonesian wind farms (ETP). Technology readiness levels (TRL) are not given because no dated source was read.'),
  ] };
  bab['18'] = { tipe: 'teks', sumber: ['etp1', 'etp2', 'mongabay_np', 'esdm_pandan'], paragraf: [
    t('Rantai pasok: hanya menara turbin yang diproduksi di Indonesia, untuk ekspor; rotor, bilah, hub, gearbox, dan generator masih impor. ETP mengingatkan bahwa TKDN yang terlalu dini dapat mengurangi pasokan dan bankability, dan menyarankan analisis biaya-manfaat sebelum membangun pabrik komponen. Direktori METI mencatat PT Grand Sains dan PT Dwida Jaya Tama sebagai manufaktur terkait bayu.', 'Supply chain: only turbine towers are made in Indonesia, for export; rotors, blades, hubs, gearboxes and generators are still imported. ETP warns that premature local content can cut supply and bankability and advises a cost-benefit analysis before building component factories. The METI directory lists PT Grand Sains and PT Dwida Jaya Tama as wind-related manufacturers.'),
    t('Angin skala kecil: contoh Puncak Mundi (sembilan kincir 30 m, target sekitar 700 kW, 2007) berhenti kurang dari dua tahun karena suku cadang; hibrida Pandansimo, Bantul, disebut ESDM hanya dua pertiga turbinnya berputar, dengan baterai dan inverter jadi sumber masalah (tanggal artikel tidak terbaca). Di Bali, ETP mencatat tiga unit 0,3 MW (PLN) dan satu unit 0,6 MW (IPP) di sistem Tiga Nusa.', 'Small-scale wind: Puncak Mundi (nine 30 m turbines, about 700 kW target, 2007) stopped within two years over spare parts; ESDM says only two thirds of the turbines at the Pandansimo hybrid, Bantul, turn, with batteries and inverters the problem (article date not readable). In Bali ETP records three 0.3 MW units (PLN) and one 0.6 MW unit (IPP) in the Tiga Nusa system.'),
    H('Skala kecil hanya masuk akal bersama kontrak O&M, stok suku cadang, dan pengelola; tanpa itu hasilnya adalah monumen, bukan pembangkit.', 'Small scale only makes sense with an O&M contract, spare parts stock and an operator; without them the result is a monument, not a plant.'),
  ] };
  bab['19'] = grafikLcoe();
  bab['20'] = { tipe: 'tabel', per: 8, sumber: ['owid_bauran', 'owid', 'rw_india', 'cms_ar6', 'p112', 'vnexpress'], kolom: [
    { k: 'negara', l: t('Negara', 'Country') }, { k: 'porsi', l: t('Porsi angin dalam listrik (persen)', 'Wind share of electricity (percent)'), num: true, d: 2 },
    { k: 'lcoe', l: t('LCOE bayu darat (sen USD/kWh)', 'Onshore wind LCOE (US cents/kWh)'), num: true, d: 2 }, { k: 'mekanisme', l: t('Mekanisme harga', 'Price mechanism') },
  ], baris: [
    { negara: 'Indonesia', porsi: 0.13, lcoe: 8.75, mekanisme: t('tarif bertingkat Perpres 112/2022; PPA dengan PLN (LCOE tahun 2020)', 'tiered tariffs under Perpres 112/2022; PPA with PLN (LCOE for 2020)') },
    { negara: 'Vietnam', porsi: 4.64, lcoe: 5.31, mekanisme: t('tarif tetap 8,5 sen USD/kWh sampai 31 Okt 2021; sesudahnya belum ada pengganti (Mei 2022)', 'fixed 8.5 US cents/kWh until 31 Oct 2021; no replacement afterwards (May 2022)') },
    { negara: 'Thailand', porsi: 1.81, lcoe: null, mekanisme: t('tidak ada sumber bertanggal yang dibaca', 'no dated source read') },
    { negara: 'Filipina', porsi: 1.19, lcoe: 6.07, mekanisme: t('tidak ada sumber bertanggal yang dibaca', 'no dated source read') },
    { negara: 'Malaysia', porsi: 0, lcoe: null, mekanisme: t('belum ada bayu skala utilitas pada data OWID 2025', 'no utility wind in OWID 2025 data') },
    { negara: 'India', porsi: null, lcoe: 4.83, mekanisme: t('lelang terbalik: terendah Rs2,43 (Gujarat, 2017) dan Rs2,44 (SECI, 2018)', 'reverse auctions: lowest Rs2.43 (Gujarat, 2017) and Rs2.44 (SECI, 2018)') },
    { negara: t('Inggris', 'United Kingdom'), porsi: null, lcoe: null, mekanisme: t('CfD lepas pantai; kliring GBP 58,87/MWh harga 2012 (AR6, 2024)', 'offshore CfD; clearing GBP 58.87/MWh 2012 prices (AR6, 2024)') },
    { negara: t('Rata-rata dunia', 'World average'), porsi: null, lcoe: 3.31, mekanisme: t('LCOE IRENA 2023, USD harga tetap 2025', 'IRENA 2023 LCOE, constant 2025 USD') },
  ], catatan: t('Negara lain pada kerangka (Tiongkok, Jepang, Korea, Uni Eropa, AS, Australia, Brasil, Afrika Selatan) tidak dimuat karena belum ada data bayu bersumber dalam repo METI; sel kosong berarti tidak ada data, bukan nol.', 'Other countries in the framework (China, Japan, Korea, EU, US, Australia, Brazil, South Africa) are omitted because no sourced wind data is in the METI repo yet; blank cell means no data, not zero.') };
  bab['21'] = { tipe: 'tabel', per: 6, sumber: ['vnexpress', 'aljaz', 'rw_india', 'cms_ar6', 'wiki_ltwp'], kolom: [
    { k: 'negara', l: t('Negara', 'Country') }, { k: 'jenis', l: t('Hasil', 'Outcome') }, { k: 'inti', l: t('Inti kasus', 'Case in brief') }, { k: 'pelajaran', l: t('Pelajaran bagi Indonesia', 'Lesson for Indonesia') },
  ], baris: [
    { negara: 'India', jenis: t('berhasil', 'success'), inti: t('lelang kompetitif rutin menekan tarif ke Rs2,43 sampai 2,51', 'regular competitive auctions pushed tariffs to Rs2.43 to 2.51'), pelajaran: H('jadwal lelang yang dapat diprediksi', 'a predictable auction calendar') },
    { negara: t('Inggris', 'United Kingdom'), jenis: t('berhasil dengan catatan', 'success with caveats'), inti: t('CfD AR6 5,3 GW, tetapi Orsted membatalkan Hornsea 4 pada 2025 karena biaya', 'AR6 CfD 5.3 GW, but Orsted cancelled Hornsea 4 in 2025 over costs'), pelajaran: H('kontrak harga tetap perlu indeksasi biaya', 'fixed-price contracts need cost indexation') },
    { negara: 'Vietnam', jenis: t('berhasil lalu terganjal', 'success then stalled'), inti: t('tarif tetap memicu pembangunan, lalu tenggat dan kurtailmen', 'a fixed tariff triggered build-out, then deadline and curtailment'), pelajaran: H('sinkronkan pembangkit dengan transmisi', 'synchronise generation with transmission') },
    { negara: 'Kenya', jenis: t('gagal sebagian', 'partial failure'), inti: t('Lake Turkana siap, jalur transmisi terlambat, denda deemed energy', 'Lake Turkana ready, transmission late, deemed energy penalty'), pelajaran: H('jangan pisahkan jadwal pembangkit dan jalur', 'do not separate plant and line schedules') },
  ] };
  bab['22'] = { tipe: 'teks', sumber: ['owid_bauran', 'irena', 'gwec'], paragraf: [
    t('Porsi angin dalam listrik Indonesia 0,13 persen (2024) dibanding Vietnam 4,64 persen (2025), Thailand 1,81 persen, Filipina 1,19 persen, dan Malaysia 0 persen (OWID/Ember). Di ASEAN, Indonesia di atas Malaysia, Laos, Myanmar, dan Brunei, tetapi jauh di bawah Vietnam, Thailand, dan Filipina (EST dari tabel ini).', 'The wind share of Indonesian electricity is 0.13 percent (2024) versus Vietnam 4.64 percent (2025), Thailand 1.81 percent, the Philippines 1.19 percent and Malaysia 0 percent (OWID/Ember). Within ASEAN Indonesia is above Malaysia, Laos, Myanmar and Brunei but far below Vietnam, Thailand and the Philippines (EST from this table).'),
    t('Secara global, 1.136 GW terpasang pada 2024; kapasitas Indonesia sekitar 0,15 GW atau sekitar 0,013 persen (EST).', 'Globally 1,136 GW was installed by 2024; Indonesian capacity of about 0.15 GW is about 0.013 percent (EST).'),
  ] };
  bab['23'] = { tipe: 'teks', sumber: ['etp1', 'etp2', 'esmap'], paragraf: [
    t('Energy Transition Partnership, kemitraan multi-donor yang dikelola UNOPS atas inisiatif Kementerian ESDM, membiayai peta jalan bayu darat dan rencana investasi. Pusat Global Wind Atlas Universitas Teknik Denmark dan peta teknis lepas pantai ESMAP/Bank Dunia menyediakan data sumber angin terbuka. Perjanjian perdagangan atau pengakuan timbal balik khusus bayu tidak ditemukan; lihat topik Transisi berkeadilan dan Pembiayaan hijau untuk JETP.', 'The Energy Transition Partnership, a multi-donor partnership run by UNOPS at the initiative of the Energy Ministry, funded the onshore wind roadmap and investment plan. The Technical University of Denmark\'s Global Wind Atlas and the ESMAP/World Bank offshore technical maps provide open resource data. No wind-specific trade or mutual recognition agreement was found; see the Just Transition and Green Finance topics for JETP.'),
  ] };
  bab['24'] = { tipe: 'teks', sumber: ['etp1', 'etp2', 'esdm_sidrap', 'esdm_tolo'], paragraf: [
    t('Pembiayaan proyek PLTB bergantung pada PPA yang bisa dibiayai dan laporan produksi independen. Sidrap berinvestasi sekitar USD 150 juta (ESDM) tanpa lelang; Tolo melibatkan pendanaan pembangunan multilateral (ADB tercatat). Hambatan: sebagian isu PPA (hak beli PLN, pembagian force majeure, mitra wajib) menaikkan risiko; ETP merekomendasikan jaminan, asesmen insentif baterai, dan sinergi jalan/pelabuhan multi-pihak.', 'Wind project finance depends on a bankable PPA and an independent yield report. Sidrap invested about USD 150 million (ESDM) without a tender; Tolo involved multilateral development funding (ADB listed). Constraints: several PPA terms (PLN buy-out right, split force majeure, mandatory partner) raise risk; ETP recommends guarantees, an assessment of battery incentives and multi-user road and port synergies.'),
    H('Pendana kecil sulit masuk selama pengukuran dan pengembangan dibiayai pengembang sebagai biaya hangus; fasilitas pengukuran bersama dapat menurunkan hambatan.', 'Small funders find it hard to enter while measurement and development are sunk costs for developers; shared measurement facilities could lower the barrier.'),
  ] };
  bab['25'] = { tipe: 'rumus', sumber: ['esdm_sidrap', 'etp1', 'stat', 'irena_cost'], rumus: [
    t('Investasi per MW = investasi total / kapasitas.', 'Investment per MW = total investment / capacity.'),
    t('Pendapatan kotor tahunan = energi (kWh) x tarif per kWh.', 'Annual gross revenue = energy (kWh) x tariff per kWh.'),
    t('Tambahan pendapatan dari kredit karbon tidak dihitung: dalam draf PPA PLN hasilnya menjadi hak PLN (ETP).', 'Carbon credit revenue is not counted: in PLN PPA drafts the proceeds go to PLN (ETP).'),
  ], contoh: [
    t(`Sidrap: USD 150 juta / 75 MW = USD ${k(capexSidrap)} juta per MW (EST); bandingkan USD 1,04 juta per MW darat global (IRENA 2024) dan USD 1,9 juta per MW Vietnam.`, `Sidrap: USD 150 million / 75 MW = USD ${capexSidrap} million per MW (EST); compare USD 1.04 million per MW global onshore (IRENA 2024) and USD 1.9 million per MW in Vietnam.`),
    t(`Sidrap pada faktor kapasitas ${k(fkSul)} persen menghasilkan sekitar ${k(gwhSidrap)} GWh per tahun; pada sekitar 11 sen USD per kWh pendapatan kotornya sekitar USD ${k(rpSidrapUsd)} juta per tahun (EST kasar; tarif 11 sen adalah tarif kontrak pada kapasitas kontrak 70 MW, dan biaya O&M serta pajak belum dikurangkan).`, `At a ${fkSul} percent capacity factor Sidrap yields about ${gwhSidrap} GWh a year; at about 11 US cents per kWh gross revenue is about USD ${rpSidrapUsd} million a year (rough EST; 11 cents is the contract tariff on 70 MW of contract capacity, and O&M and taxes are not deducted).`),
    t('Perbandingan: penawaran Tanah Laut 5,5 sen USD per kWh adalah sekitar setengah tarif Sidrap/Tolo (EST).', 'Comparison: the Tanah Laut bid of 5.5 US cents per kWh is about half the Sidrap/Tolo tariff (EST).'),
  ] };
  bab['26'] = { tipe: 'teks', sumber: ['bisnis_sidrap', 'iir_sk', 'orsted23', 'ci_h4'], paragraf: [
    t('Transaksi: Bisnis.com (8 Des 2023) melaporkan PLTB Sidrap hendak diakuisisi BREN dengan investasi proyek Rp2,3 triliun; penyelesaian akuisisi tidak diverifikasi. Industrial Info Resources (30 Nov 2022) melacak 12 proyek angin UPC Renewables lain di Indonesia senilai USD 1,45 miliar.', 'Transactions: Bisnis.com (8 Dec 2023) reported that BREN planned to acquire the Sidrap wind farm, with project investment of IDR 2.3 trillion; completion of the acquisition was not verified. Industrial Info Resources (30 Nov 2022) tracked 12 other UPC Renewables wind projects in Indonesia worth USD 1.45 billion.'),
    t('Pembanding luar negeri: Orsted mencatat penurunan nilai DKK 28,4 miliar pada sembilan bulan 2023 (DKK 19,9 miliar untuk Ocean Wind 1) dan menghentikan Hornsea 4 pada 2025.', 'Foreign comparators: Orsted booked DKK 28.4 billion of impairments in nine months of 2023 (DKK 19.9 billion for Ocean Wind 1) and stopped Hornsea 4 in 2025.'),
  ] };
  bab['27'] = { tipe: 'teks', sumber: ['etp1', 'esdm_sidrap', 'wiki_ltwp', 'antara_sk'], paragraf: [
    t('Manfaat: pengganti diesel (Tolo menghemat Rp577 per kWh dibanding PLTD), emisi operasi nol, dan lapangan kerja (Sidrap 709 pekerja, 95 persen WNI). Risiko yang harus ditelaah: kematian burung dan kelelawar, bising, bayangan kedip, keselamatan, dan dampak pada penghidupan; ETP mencatat belum ada pedoman khusus Indonesia dan jarak minimum ke permukiman belum ditetapkan.', 'Benefits: displacing diesel (Tolo saves IDR 577 per kWh against diesel plants), zero operating emissions and jobs (Sidrap 709 workers, 95 percent Indonesian). Risks to assess: bird and bat deaths, noise, shadow flicker, safety and livelihood impacts; ETP notes there is no Indonesia-specific guideline and no minimum distance to settlements has been set.'),
    t('Hak masyarakat dan pengamanan: Lake Turkana digugat atas lahan (Oktober 2014; pengadilan menolak menghentikan proyek November 2016) dan Bank Dunia mundur pada 2012; PLTB Sukabumi berada di kawasan geopark UNESCO sehingga tata ruang dan konservasi menjadi kunci. Konsultasi desa dan kompensasi lahan perlu didokumentasikan sebelum pembebasan.', 'Community rights and safeguards: Lake Turkana faced a land lawsuit (October 2014; the court declined to halt the project in November 2016) and the World Bank withdrew in 2012; the Sukabumi project sits in a UNESCO geopark so zoning and conservation are decisive. Village consultation and land compensation should be documented before acquisition.'),
  ] };
  bab['28'] = { tipe: 'teks', sumber: ['etp1', 'esdm_sidrap', 'wiki_ltwp', 'perm30'], paragraf: [
    t('Lapangan kerja: Sidrap memakai 709 pekerja saat konstruksi (95 persen WNI); Lake Turkana 2.500 saat konstruksi dan 200 tetap. ETP menilai tenaga kerja Indonesia belum punya kompetensi untuk pembangunan besar karena baru sekitar 154 MW terpasang, dan menyarankan program alih pengetahuan.', 'Jobs: Sidrap used 709 workers in construction (95 percent Indonesian); Lake Turkana 2,500 in construction and 200 permanent. ETP judges the Indonesian workforce lacks competencies for large roll-out as only about 154 MW is installed, and recommends knowledge-transfer programmes.'),
    t('Sertifikasi: Permen ESDM 30/2006 pernah menetapkan standar kompetensi tenaga teknik PLTB tetapi berstatus dicabut di basis regulasi METI; standar penggantinya tidak diverifikasi. Pelatihan dan LSP terkait tercantum di lapisan Pelatihan.', 'Certification: Permen ESDM 30/2006 once set competence standards for wind technicians but is revoked in the METI regulation base; its replacement was not verified. Related training and professional certification bodies are in the Training layer.'),
  ] };
  bab['29'] = { tipe: 'tabel', per: 6, sumber: ['etp1', 'wiki_ltwp', 'ci_h4', 'cms_ar6', 'antara_sk'], kolom: [
    { k: 'isu', l: t('Isu', 'Issue') }, { k: 'sisi_a', l: t('Sisi pendukung', 'Supporting side') }, { k: 'sisi_b', l: t('Sisi yang mempertanyakan', 'Questioning side') },
  ], baris: [
    { isu: t('TKDN bayu', 'Wind local content'), sisi_a: t('melindungi industri dan lapangan kerja dalam negeri (Permenperin 48/2010 dan perubahannya)', 'protects domestic industry and jobs (Industry Reg. 48/2010 and amendments)'), sisi_b: t('komponen utama belum ada pabriknya sehingga TKDN dini bisa menghambat pasokan dan bankability (ETP)', 'main components have no factory yet so early local content may block supply and bankability (ETP)') },
    { isu: t('Proyek di kawasan konservasi', 'Projects in conservation areas'), sisi_a: t('Pemkab Sukabumi mendukung perizinan dan tata ruang untuk PLTB di Ciemas', 'Sukabumi regency supports permits and zoning for the Ciemas wind farm'), sisi_b: t('ETP mewajibkan telaah dampak biodiversitas dan kawasan konservasi sebelum tapak dipilih', 'ETP requires biodiversity and conservation-area assessment before site selection') },
    { isu: t('Lepas pantai: biaya vs potensi', 'Offshore: cost vs potential'), sisi_a: t('AR6 Inggris kliring GBP 58,87/MWh dan potensi Indonesia 94,2 GW (BBSP KEBTKE)', 'UK AR6 cleared at GBP 58.87/MWh and Indonesian potential is 94.2 GW (BBSP KEBTKE)'), sisi_b: t('Orsted membatalkan Hornsea 4 dan Ocean Wind karena biaya; biaya terpasang USD 2.852/kW', 'Orsted cancelled Hornsea 4 and Ocean Wind over costs; installed cost USD 2,852/kW') },
    { isu: t('Proyek besar di wilayah terpencil', 'Large projects in remote areas'), sisi_a: t('Lake Turkana menghemat bahan bakar hingga USD 120 juta per tahun (perkiraan)', 'Lake Turkana saves up to USD 120 million of fuel a year (estimate)'), sisi_b: t('denda keterlambatan KSh14,5 miliar dan gugatan lahan; Bank Dunia mundur 2012 soal kelebihan daya', 'KSh14.5 billion delay penalties and a land lawsuit; World Bank withdrew in 2012 over excess power') },
  ] };
  bab['30'] = { tipe: 'tabel', per: 8, sumber: ['etp1', 'ruptl', 'ruen'], kolom: [
    { k: 'dok', l: t('Dokumen', 'Document') }, { k: 'target', l: t('Target', 'Target') }, { k: 'realisasi', l: t('Pembacaan realisasi (METI)', 'Realisation reading (METI)') },
  ], baris: [
    { dok: t('RUEN 2017', 'RUEN 2017'), target: t('1,8 GW pada 2025; 28 GW pada 2050 (46 persen potensi)', '1.8 GW in 2025; 28 GW in 2050 (46 percent of potential)'), realisasi: t('sekitar 0,15 GW pada 2025 (EST selisih sekitar 1,65 GW)', 'about 0.15 GW in 2025 (EST gap about 1.65 GW)') },
    { dok: t('RUPTL 2021-2030', 'RUPTL 2021-2030'), target: t('597 MW bayu (tidak ada penambahan setelah 2026)', '597 MW wind (no additions after 2026)'), realisasi: t('0 MW tambahan sejak 2021 saat ETP menulis (Des 2023)', '0 MW added since 2021 when ETP wrote (Dec 2023)') },
    { dok: t('RUPTL 2025-2034', 'RUPTL 2025-2034'), target: t('460 MW dalam empat proyek, COD 2026 sampai 2030 (EST jumlah dari tabel)', '460 MW in four projects, COD 2026 to 2030 (EST sum from the table)'), realisasi: t('belum ada yang beroperasi per 8 Nov 2026', 'none operating as of 8 Nov 2026') },
    { dok: t('BBSP KEBTKE 2023', 'BBSP KEBTKE 2023'), target: t('potensi 60,6 GW darat dan 94,2 GW lepas pantai', 'potential 60.6 GW onshore and 94.2 GW offshore'), realisasi: t('pemanfaatan di bawah 0,1 persen', 'use below 0.1 percent') },
    { dok: t('Skenario 2045 dan 2060', '2045 and 2060 scenarios'), target: t('tidak ada target bayu spesifik yang ditemukan dalam sumber yang dibaca', 'no wind-specific target found in the sources read'), realisasi: t('-', '-') },
  ] };
  bab['31'] = { tipe: 'tabel', per: 8, sumber: ['meti', 'etp1', 'etp2'], kolom: [
    { k: 'peran', l: t('Peran', 'Role') }, { k: 'peluang', l: t('Peluang', 'Opportunity') }, { k: 'tantangan', l: t('Tantangan', 'Challenge') },
  ], baris: [
    { peran: t('Pengembang', 'Developer'), peluang: H('biaya darat global terendah dan permintaan listrik naik', 'lowest global onshore cost and rising electricity demand'), tantangan: H('biaya pengukuran hangus, PPA sulit dibiayai, jaringan', 'sunk measurement cost, hard-to-finance PPA, grid') },
    { peran: t('Pemasok', 'Supplier'), peluang: H('rantai pasok menara sudah ada untuk ekspor; bilah dan nacelle belum ada', 'tower supply chain exists for export; blades and nacelles do not'), tantangan: H('permintaan terlalu kecil untuk pabrik lokal', 'demand too small for local factories') },
    { peran: t('Investor', 'Investor'), peluang: H('proyek tersertifikasi tarif dan PPA 30 tahun', 'projects with a certified tariff and 30-year PPA'), tantangan: H('risiko kebijakan dan keputusan jadwal PLN', 'policy risk and PLN scheduling decisions') },
    { peran: t('Pemda', 'Local government'), peluang: H('lapangan kerja dan infrastruktur jalan/pelabuhan bersama', 'jobs and shared road/port infrastructure'), tantangan: H('KKPR terpusat dan tumpang tindih lahan', 'centralised KKPR and land overlaps') },
    { peran: t('Akademisi', 'Academia'), peluang: H('model angin medan kompleks dan prakiraan keluaran', 'complex-terrain wind models and output forecasting'), tantangan: H('data pengukuran bersifat tertutup', 'measurement data are proprietary') },
  ] };
  bab['32'] = { tipe: 'tabel', per: 8, sumber: ['meti', 'ruptl', 'bt_tl', 'konsul'], kolom: [
    { k: 'butir', l: t('Yang dipantau', 'To watch') }, { k: 'indikator', l: t('Indikator', 'Indicator') }, { k: 'mengapa', l: t('Mengapa penting', 'Why it matters') },
  ], baris: [
    { butir: t('Nasib PLTB Tanah Laut', 'Fate of Tanah Laut'), indikator: t('keputusan PLN terminasi atau financial close', 'PLN decision to terminate or financial close'), mengapa: H('satu-satunya proyek lelang bayu PLN dalam satu dekade', 'the only PLN wind tender in a decade') },
    { butir: t('Proyek RUPTL 2025-2034', 'RUPTL 2025-2034 projects'), indikator: t('PPA dan konstruksi Bayu Sumatera, Banten', 'PPA and construction of Bayu Sumatera, Banten'), mengapa: H('menentukan apakah 460 MW berwujud', 'determines whether 460 MW materialises') },
    { butir: t('RUU EBET', 'EBET bill'), indikator: t('pengesahan di DPR Komisi XII', 'passage at DPR Commission XII'), mengapa: H('mengubah kerangka pembelian dan insentif', 'changes purchase framework and incentives') },
    { butir: t('TKDN bayu', 'Wind local content'), indikator: t('terbitnya aturan khusus bayu', 'issuance of a wind-specific rule'), mengapa: H('bisa menghambat atau memicu pabrik komponen', 'could block or trigger component factories') },
    { butir: t('Pengumuman lelang tahunan', 'Annual tender calendar'), indikator: t('daftar lelang PLN bayu 2027', 'PLN 2027 wind tender list'), mengapa: H('model India: jadwal rutin menurunkan harga', 'India model: a regular calendar lowers prices') },
  ] };
  bab['33'] = { tipe: 'tabel', per: 8, sumber: ['etp1', 'iesr', 'esmap'], kolom: [
    { k: 'lembaga', l: t('Lembaga', 'Institution'), url: 'url' }, { k: 'peran', l: t('Peran terkait bayu', 'Wind-related role') },
  ], baris: [
    { lembaga: 'BBSP KEBTKE (Kementerian ESDM)', peran: t('pengukuran angin 2017 dan perhitungan potensi 2023', '2017 wind measurement and 2023 potential estimate'), url: SUMBER.etp1.url },
    { lembaga: 'Energy Transition Partnership', peran: t('peta jalan bayu darat dan rencana investasi', 'onshore wind roadmap and investment plan'), url: SUMBER.etp2.url },
    { lembaga: 'IESR', peran: t('kajian 333 GW surya, bayu, hidro (Feb 2025)', '333 GW solar, wind, hydro study (Feb 2025)'), url: SUMBER.iesr.url },
    { lembaga: 'ESMAP (Bank Dunia)', peran: t('peta potensi teknis lepas pantai', 'offshore technical potential maps'), url: SUMBER.esmap.url },
  ], catatan: t('Pakar perorangan dan pusat studi otomatis dari lapisan Riset (12 pakar bertag bayu pada dasar).', 'Individual experts and study centres come automatically from the Research layer (12 experts tagged wind in the base).') };
  bab['36'] = { tipe: 'tabel', per: 8, sumber: ['etp1', 'etp2', 'gwec', 'irena_cost', 'iesr'], kolom: [
    { k: 'judul', l: t('Dokumen', 'Document'), url: 'url' }, { k: 'penerbit', l: t('Penerbit', 'Publisher') }, { k: 'tahun', l: t('Tahun', 'Year') },
  ], baris: [
    { judul: SUMBER.etp1.judul, penerbit: 'ETP', tahun: '2023', url: SUMBER.etp1.url },
    { judul: SUMBER.etp2.judul, penerbit: 'ETP', tahun: '2024', url: SUMBER.etp2.url },
    { judul: SUMBER.gwec.judul, penerbit: 'GWEC', tahun: '2025', url: SUMBER.gwec.url },
    { judul: SUMBER.irena_cost.judul, penerbit: 'IRENA', tahun: '2025', url: SUMBER.irena_cost.url },
    { judul: SUMBER.iesr.judul, penerbit: 'IESR', tahun: '2025', url: SUMBER.iesr.url },
  ] };
  bab['38'] = { tipe: 'teks', paragraf: [
    t(`Metode: angka resmi dan data repo dihitung ulang tanpa suntingan tangan (faktor kapasitas, rasio, investasi per MW diberi label EST). Teks kasus ditulis dari sumber web yang dibaca ${HARI} (UA METI-Network-research/0.1, robots dibaca, jeda 2 detik, berhenti pada 403/429); sumber yang gagal dibaca penuh (EastAfrican 403, Petromindo berbayar) hanya dipakai judulnya dan ditandai.`, `Method: official figures and repo data are recomputed without hand edits (capacity factor, ratio, investment per MW are labelled EST). Case texts were written from web sources read on ${HARI} (METI-Network-research/0.1 UA, robots read, 2 second delay, stop on 403/429); sources that could not be read in full (EastAfrican 403, Petromindo paywall) are used by headline only and flagged.`),
    t('Celah: (1) kecepatan angin rata-rata per provinsi tidak tersedia terbuka (Global Wind Atlas tanpa API ringkasan; unduhan raster ratusan MB tidak dilakukan); (2) kapasitas serap EBT variabel per sistem PLN tidak ditemukan sebagai dokumen terbuka; (3) tarif dan nilai investasi Tolo, serta faktor kapasitas resmi, tidak ditemukan; (4) PLTB Samas (Bantul) dan Lombok Timur 115 MW: tidak ada sumber yang menunjukkan kegagalan atau kemajuan, jadi tidak dimasukkan sebagai kasus; (5) Thailand, India, Chile ditulis ringkas dari ringkasan pihak ketiga; (6) angka denda Lake Turkana berbeda antarsumber dan belum direkonsiliasi; (7) data GEM untuk proyek Indonesia punya koordinat dan status yang tidak cocok (lihat bab 10).', 'Gaps: (1) mean wind speed per province is not openly available (Global Wind Atlas has no summary API; the raster download of hundreds of MB was not done); (2) variable renewable absorption capacity per PLN system was not found as an open document; (3) Tolo tariff and investment value, and official capacity factors, were not found; (4) PLTB Samas (Bantul) and Lombok Timur 115 MW: no source shows failure or progress, so they are not included as cases; (5) Thailand, India and Chile are written briefly from third-party summaries; (6) the Lake Turkana penalty figures differ across sources and are not reconciled; (7) GEM data for Indonesian projects have mismatched coordinates and status (see chapter 10).'),
  ] };
  bab['39'] = { tipe: 'kasus', butir: KASUS_BERHASIL, catatan: t('Hanya dua PLTB utilitas yang berhasil beroperasi di Indonesia (Sidrap, Tolo); pembanding luar negeri melengkapi tiga sampai lima contoh.', 'Only two utility wind farms operate successfully in Indonesia (Sidrap, Tolo); foreign comparators complete the three to five examples.') };
  bab['40'] = { tipe: 'kasus', butir: KASUS_GAGAL, catatan: t('Kasus ini disusun dari sumber publik dan bukan putusan hukum. Penyebab resmi proyek Indonesia belum dipublikasikan pihak terkait; faktor yang dicatat adalah yang disebut sumber. Pihak yang disebut dapat memakai hak jawab.', 'These cases are compiled from public sources and are not legal findings. Official causes of the Indonesian projects have not been published by the parties; the factors recorded are those the sources mention. Named parties may use their right of reply.') };
  bab['41'] = { tipe: 'pola', faktor: FAKTOR, sumber: ['meti'], catatan: H('Kolom diisi hanya bila sumber menyebut faktornya; sel kosong berarti tanpa data. Faktor yang paling sering muncul pada kasus gagal Indonesia: PPA/tarif, pendanaan, dan jaringan.', 'Cells are filled only when a source mentions the factor; blank means no data. The factors most frequent in Indonesian failure cases: PPA/tariff, financing and grid.') };
  bab['42'] = { tipe: 'periksa', peran: PERAN, tahap: TAHAP, butir: PERIKSA, sumber: ['etp1', 'etp2', 'meti'] };

  const kunci = [
    { label: t('Potensi bayu darat (RUEN)', 'Onshore wind potential (RUEN)'), nilai: 60.6, d: 1, satuan: t('GW', 'GW'), sumber: 'etp1', est: false },
    { label: t('Kapasitas bayu terpasang 2024', 'Installed wind capacity 2024'), nilai: kap2024, d: 1, satuan: 'MW', sumber: 'irena', est: false },
    { label: t('Produksi bayu 2024', 'Wind generation 2024'), nilai: Math.round(gen2024), d: 0, satuan: 'GWh', sumber: 'ember', est: false },
    { label: t('Faktor kapasitas nasional 2024', 'National capacity factor 2024'), nilai: fkNas2024, d: 1, satuan: '%', sumber: 'ember', est: true },
    { label: t('Potensi lepas pantai (BBSP KEBTKE 2023)', 'Offshore potential (BBSP KEBTKE 2023)'), nilai: 94.2, d: 1, satuan: t('GW', 'GW'), sumber: 'etp1', est: false },
  ];
  return {
    id: 'bayu', versi: 1, diperbarui: HARI,
    judul: t('Bayu (angin)', 'Wind'),
    lead: t('Indonesia punya potensi bayu darat 60,6 GW dan lepas pantai 94,2 GW, tetapi baru sekitar 0,15 GW terpasang, seluruhnya di Sulawesi Selatan, dan tidak bertambah sejak 2019.', 'Indonesia has 60.6 GW of onshore and 94.2 GW of offshore wind potential, but only about 0.15 GW is installed, all in South Sulawesi, with no addition since 2019.'),
    kunci,
    penting: [
      t('Hanya dua PLTB utilitas beroperasi (Sidrap 75 MW dan Tolo 72 MW), keduanya diajukan sebelum 2017 dan dibeli PLN tanpa lelang pada tarif sekitar 11 sen USD per kWh.', 'Only two utility wind farms operate (Sidrap 75 MW and Tolo 72 MW), both proposed before 2017 and bought by PLN without a tender at about 11 US cents per kWh.'),
      t('Satu-satunya lelang PLN (Tanah Laut 70 MW, 5,5 sen) belum mencapai financial close dan PLN dilaporkan menimbang terminasi per 1 Juli 2025.', 'The only PLN tender (Tanah Laut 70 MW, 5.5 cents) has not reached financial close and PLN was reported to weigh termination on 1 July 2025.'),
      t('Pelajaran luar negeri: harga yang bisa dibiayai (India, Inggris) dan pembangkit yang disinkronkan dengan transmisi (Kenya, Vietnam, Chile) menentukan.', 'Foreign lessons: a financeable price (India, UK) and plants synchronised with transmission (Kenya, Vietnam, Chile) decide outcomes.'),
    ],
    posisi: t('Porsi angin dalam listrik Indonesia 0,13 persen (2024), jauh di bawah Vietnam 4,64 persen dan Thailand 1,81 persen.', 'The wind share of Indonesian electricity is 0.13 percent (2024), far below Vietnam at 4.64 percent and Thailand at 1.81 percent.'),
    sumber: SUMBER, bab,
  };
}

/* ---------- pemeriksaan bentuk (dipakai --selftest dan tests/topik_bayu.test.mjs) ---------- */
export function periksa(D) {
  const e = [];
  const dua = (o, p) => {
    if (o && typeof o === 'object' && !Array.isArray(o)) {
      const k = Object.keys(o);
      if (k.length === 2 && k.includes('id') && k.includes('en')) { for (const b of ['id', 'en']) if (typeof o[b] !== 'string' || !o[b].trim()) e.push(`${p}.${b} kosong`); return; }
      for (const [a, v] of Object.entries(o)) dua(v, `${p}.${a}`);
    } else if (Array.isArray(o)) o.forEach((v, i) => dua(v, `${p}[${i}]`));
  };
  dua(D, 'D');
  const teks = JSON.stringify(D);
  if (/[—·→]|&rarr;/.test(teks)) e.push('karakter terlarang (em dash, titik tengah, panah)');
  if (/\b[A-Z]{2,}( [A-Z]{2,}){2,}\b/.test(teks)) e.push('kapital penuh >= 3 kata');
  for (const k of ['id', 'versi', 'diperbarui', 'judul', 'lead', 'kunci', 'penting', 'posisi', 'sumber', 'bab']) if (!(k in D)) e.push('kunci hilang: ' + k);
  if (D.kunci?.length !== 5) e.push('kunci harus 5 butir');
  if (D.penting?.length !== 3) e.push('penting harus 3 butir');
  const bukti = new Set(['resmi', 'kajian', 'media', 'via-pihak-ketiga', 'editorial']);
  for (const [k, s] of Object.entries(D.sumber)) {
    if (!/^https:\/\//.test(s.url)) e.push('url sumber ' + k); if (!/^\d{4}-\d{2}-\d{2}$/.test(s.tanggal)) e.push('tanggal sumber ' + k); if (!bukti.has(s.bukti)) e.push('bukti sumber ' + k);
  }
  const rujuk = (x, p) => { for (const r of [].concat(x ?? [])) if (typeof r === 'string' && !D.sumber[r]) e.push(`rujukan sumber hilang ${p}: ${r}`); };
  for (const k of D.kunci) { rujuk(k.sumber, 'kunci'); if (k.est === undefined) e.push('kunci tanpa est'); }
  const FAK = new Set(), PER = new Set(), TAH = new Set();
  for (const [n, b] of Object.entries(D.bab)) {
    const num = Number(n); if (!(num >= 2 && num <= 42)) e.push('nomor bab di luar rentang ' + n);
    rujuk(b.sumber, 'bab ' + n);
    if (b.tipe === 'teks') { for (const p of b.paragraf) if ((b.sumber || []).length && b.sumber.every((s) => D.sumber[s]?.bukti === 'editorial') && !/^Analisis METI \(Hipotesis\)|^METI analysis \(Hypothesis\)/.test(p.id + p.en)) e.push('paragraf editorial tanpa label bab ' + n); }
    if (b.tipe === 'tabel') for (const r of b.baris) for (const c of b.kolom) if (!(c.k in r)) e.push(`bab ${n} sel hilang ${c.k}`);
    if (b.tipe === 'grafik') for (const s of b.seri) { if (!s.titik.length) e.push(`bab ${n} seri kosong`); for (const [, v] of s.titik) if (!Number.isFinite(v)) e.push(`bab ${n} titik bukan angka`); }
    if (b.tipe === 'kasus') {
      for (const k of b.butir) {
        rujuk(k.sumber, k.id); (k.angka || []).forEach((a) => { rujuk(a.sumber, k.id); if (a.est === undefined) e.push(`angka tanpa est ${k.id}`); });
        if (!k.sumber?.length) e.push('kasus tanpa sumber ' + k.id);
        for (const f of Object.keys(k.faktor || {})) FAK.add(f);
        if (k.jenis !== 'berhasil') {
          if (n !== '40') e.push('kasus gagal di bab selain 40 ' + k.id);
          for (const f of ['kronologi', 'sebab', 'tanda_bahaya']) if (!k[f]?.length) e.push(`kasus ${k.id} tanpa ${f}`);
          if (!k.seharusnya || !k.terdampak) e.push(`kasus ${k.id} tanpa seharusnya/terdampak`);
          if (k.hak_jawab !== true) e.push(`kasus ${k.id} tanpa hak_jawab`);
          for (const r of k.kronologi) if (!/^\d{4}-\d{2}-\d{2}$/.test(r.tanggal)) e.push('tanggal kronologi ' + k.id);
        } else if (n !== '39') e.push('kasus berhasil di bab selain 39 ' + k.id);
        for (const x of [...(k.pelajaran || []), ...(k.seharusnya ? [k.seharusnya] : [])]) if (!/^Analisis METI \(Hipotesis\)/.test(x.id)) e.push(`pelajaran/seharusnya tanpa label ${k.id}`);
      }
    }
    if (b.tipe === 'pola') b.faktor.forEach((f) => { if (!FAK.has(f.k) && n === '41') FAK.add('__ada:' + f.k); });
    if (b.tipe === 'periksa') {
      b.peran.forEach((p) => PER.add(p.k)); b.tahap.forEach((p) => TAH.add(p.k));
      const pp = new Set(b.butir.map((x) => x.peran)), tt = new Set(b.butir.map((x) => x.tahap));
      for (const p of PER) if (!pp.has(p)) e.push('peran tanpa butir ' + p);
      for (const x of b.butir) { if (!PER.has(x.peran) || !TAH.has(x.tahap)) e.push('butir peran/tahap tak dikenal'); rujuk(x.dasar, 'periksa'); }
      void tt;
    }
  }
  const polaK = new Set((D.bab['41']?.faktor || []).map((f) => f.k));
  for (const b of [D.bab['39'], D.bab['40']]) for (const k of b.butir) for (const f of Object.keys(k.faktor || {})) if (!polaK.has(f)) e.push(`faktor tak terdaftar ${k.id}.${f}`);
  if (!D.bab['40'].butir.some((k) => k.negara === 'ID') || !D.bab['40'].butir.some((k) => k.negara !== 'ID')) e.push('bab 40 butuh kasus Indonesia dan luar negeri');
  if (D.bab['39'].butir.filter((k) => k.negara === 'ID').length < 2) e.push('bab 39 butuh kasus Indonesia');
  if (!D.bab['39'].butir.some((k) => k.negara !== 'ID')) e.push('bab 39 butuh luar negeri');
  return e;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const D = bangun();
  const e = periksa(D);
  if (e.length) { console.error('GAGAL:\n' + e.join('\n')); process.exit(1); }
  if (process.argv.includes('--selftest')) { console.log(`OK topik bayu: ${Object.keys(D.bab).length} bab, ${Object.keys(D.sumber).length} sumber`); process.exit(0); }
  mkdirSync(new URL('topik/', DATA), { recursive: true });
  writeFileSync(new URL('topik/bayu.json', DATA), JSON.stringify(D, null, 1) + '\n');
  console.log(`ditulis public/data/topik/bayu.json (${Object.keys(D.bab).length} bab)`);
}
