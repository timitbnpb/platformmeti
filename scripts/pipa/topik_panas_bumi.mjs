// Bangun public/data/topik/panas_bumi.json (naskah terkurasi topik Panas bumi, skema docs/perencanaan/TOPIK-SKEMA.md).
// Bagian tulisan tangan ada di file ini (bersumber, bertanggal); bagian tabel/grafik diiris dari public/data (tanpa jaringan).
// Pakai: node scripts/pipa/topik_panas_bumi.mjs [--selftest]   (selftest: bangun di memori + validasi, tidak menulis berkas)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const AKAR = new URL("../../", import.meta.url);
const baca = (n) => JSON.parse(readFileSync(new URL("public/data/" + n + ".json", AKAR), "utf8"));
const T = (id, en) => ({ id, en });
const TGL = "2026-11-08";
const HIP = "Analisis METI (Hipotesis): ";
const HIP_EN = "METI analysis (Hypothesis): ";
const H = (id, en) => T(HIP + id, HIP_EN + en);

/* ---------------- sumber ---------------- */
const S = (judul, penerbit, url, tahun, bukti, lisensi = "Hak cipta penerbit; METI hanya mengutip fakta dan menautkan") => ({ judul, penerbit, url, tanggal: TGL, tahun, bukti, lisensi });
const sumber = {
  irena: S("IRENASTAT Renewable Energy Statistics 2026, kapasitas dan pembangkitan Indonesia (panas bumi)", "IRENA", "https://pxweb.irena.org/pxweb/en/IRENASTAT/IRENASTAT__Power%20Capacity%20and%20Generation/", 2026, "resmi", "IRENA: bebas dipakai dengan atribusi IRENASTAT"),
  perpres112: S("Perpres 112/2022 Percepatan Pengembangan Energi Terbarukan untuk Penyediaan Tenaga Listrik, Lampiran I (harga patokan tertinggi)", "JDIH BPK", "https://peraturan.bpk.go.id/Details/225308/perpres-no-112-tahun-2022", 2022, "resmi", "Dokumen publik pemerintah"),
  uu21: S("UU 21/2014 tentang Panas Bumi", "JDIH BPK", "https://peraturan.bpk.go.id/Details/38684", 2014, "resmi", "Dokumen publik pemerintah"),
  pp7: S("PP 7/2017 tentang Panas Bumi untuk Pemanfaatan Tidak Langsung", "JDIH BPK", "https://peraturan.bpk.go.id/Details/5827", 2017, "resmi", "Dokumen publik pemerintah"),
  pp49: S("PP 49/2022 (Bab V, Pasal 25), PPN dibebaskan atas impor barang kontraktor panas bumi", "JDIH BPK", "https://peraturan.bpk.go.id/Details/232943/pp-no-49-tahun-2022", 2022, "resmi", "Dokumen publik pemerintah"),
  wkp: S("Daftar kurasi WKP/PSPE panas bumi METI (public/data/wkp.json)", "METI Network", "/data/wkp.json", 2026, "editorial", "CC BY 4.0 (METI)"),
  proyek: S("Data proyek METI (public/data/proyek.json; Wikipedia/Wikidata/GEM/RUPTL)", "METI Network", "/data/proyek.json", 2026, "editorial", "CC BY 4.0 (METI)"),
  lelang: S("Investasi capai US$ 1,99 miliar, Kementerian ESDM lelang 3 WKP Panas Bumi dan 7 PSP", "Kontan", "https://industri.kontan.co.id/news/investasi-capai-us-199-miliar-kementerian-esdm-lelang-3-wkp-panas-bumi-dan-7-psp", 2025, "media"),
  lelang2: S("Bahlil Lelang 10 Wilayah Panas Bumi RI Tahun 2025, Ini Daftarnya", "CNBC Indonesia", "https://www.cnbcindonesia.com/news/20250917184934-4-667921/bahlil-lelang-10-wilayah-panas-bumi-ri-tahun-2025-ini-daftarnya", 2025, "media"),
  esmap: S("ESMAP, Harding-Newman, data pengeboran panas bumi (presentasi 2012)", "ESMAP / Bank Dunia", "https://esmap.org/sites/esmap.org/files/Harding_Drilling%20data_%28Day%203%29.pdf", 2012, "kajian", "Dokumen publik ESMAP"),
  stanford: S("Sanyal dkk., catatan tingkat sukses pengeboran panas bumi Indonesia (IGA standard db)", "Stanford Geothermal / IGA", "https://pangea.stanford.edu/ERE/db/IGAstandard/record_detail.php?id=7163", 2011, "kajian"),
  lemigas: S("Lemigas, studi kasus biaya sumur panas bumi (Scientific Contributions Oil & Gas)", "Lemigas / ESDM", "https://journal.lemigas.esdm.go.id/index.php/SCOG/article/download/1591/pdf", 2023, "kajian"),
  smi: S("PISP Fund Management Reports", "PT Sarana Multi Infrastruktur", "https://www.ptsmi.co.id/pisp-fund-management-reports", 2024, "resmi"),
  pmk80: S("PMK 80/2022 tentang Dana PISP", "KBLI.co.id (salinan peraturan)", "https://kbli.co.id/regulations/other-80-pmk-08-2022-2022", 2022, "via-pihak-ketiga"),
  wbpisp: S("World Bank, dokumen proyek PISP/Geothermal Resource Risk Mitigation (P155047)", "Bank Dunia", "https://ewsdata.rightsindevelopment.org/files/documents/47/WB-P155047.pdf", 2016, "resmi", "Dokumen publik Bank Dunia"),
  tgefund: S("New funding schemes in Jakarta, Indonesia to fund geothermal exploration", "ThinkGeoEnergy", "https://www.thinkgeoenergy.com/new-funding-schemes-in-jarkarta-indonesia-to-fund-geothermal-exploration/", 2016, "media"),
  waesano: S("SMI to provide $30m fund for Waesano geothermal exploration project", "Petromindo", "https://www.petromindo.com/news/article/smi-to-provide-30m-fund-for-waesano-geothermal-exploration-project", 2017, "media"),
  jica: S("JICA, siaran pers perjanjian pinjaman PLTP Hululais", "JICA", "https://www.jica.go.jp/english/information/press/2025/20260330_11.html", 2026, "resmi"),
  insentif: S("Katalog insentif METI (public/data/insentif.json)", "METI Network", "/data/insentif.json", 2026, "editorial", "CC BY 4.0 (METI)"),
  keuangan: S("Tarif Perpres 112/2022 Lampiran I, transkripsi METI (public/data/keuangan.json, kelompok tarif)", "METI Network", "/data/keuangan.json", 2026, "editorial", "CC BY 4.0 (METI)"),
  pge_q3: S("PGE, pendapatan US$318,86 juta s.d. Q3 2025, tambahan kapasitas Lumut Balai Unit 2", "PT Pertamina Geothermal Energy Tbk", "https://www.pge.pertamina.com/en/press-release/pge-posts-us318-86-million-in-revenue-through-q3-2025-with-additional-capacity-at-lumut-balai-unit-2-a-key-driver", 2025, "resmi"),
  pge_q1: S("PGE, pendapatan US$101,51 juta kuartal I 2025", "PT Pertamina Geothermal Energy Tbk", "https://www.pge.pertamina.com/en/siaran-pers/raih-pendapatan-us101-51-di-kuartal-i-2025-pge-dorong-hadirnya-ekosistem-energi-berkelanjutan", 2025, "resmi"),
  pge_1gw: S("PGE mempercepat ekspansi panas bumi menuju kapasitas 1 GW", "PT Pertamina Geothermal Energy Tbk", "https://www.pge.pertamina.com/en/press-release/maintaining-strong-financial-fundamentals-pge-accelerates-geothermal-expansion-to-1-gw-capacity", 2025, "resmi"),
  pge_kmj: S("PGE, Lapangan Kamojang", "PT Pertamina Geothermal Energy Tbk", "https://pge.pertamina.com/en/own-operation/kamojang", 2026, "resmi"),
  esdm_kmj: S("Lapangan Kamojang, PLTP Pertama di Indonesia", "Kementerian ESDM", "https://www.esdm.go.id/id/media-center/arsip-berita/lapangan-kamojang-pltp-pertama-di-indonesia", 2026, "resmi"),
  sarulla: S("Sarulla project secures $1.17 billion project financing", "ThinkGeoEnergy", "https://www.thinkgeoenergy.com/sarulla-project-secures-1-7-billion-project-financing/", 2014, "media"),
  sarulla2: S("Ormat, partners sign $1.17b Indonesian project financing", "Globes", "https://en.globes.co.il/en/article-ormat-partners-sign-117b-indonesia-project-financing-1000928039", 2014, "media"),
  sarulla3: S("JBIC dan ADB mendukung proyek panas bumi konsorsium Sarulla", "Energy Monitor", "https://www.energymonitor.ai/news/newsjbic-adb-to-support-sarulla-consortiums-geothermal-project-in-indonesia-4206154/", 2014, "media"),
  laboh_sc: S("Sumitomo Corporation, Muara Laboh mulai beroperasi komersial 16 Desember 2019", "Sumitomo Corporation", "https://www.sumitomocorp.com/en/jp/news/release/2019/group/12770", 2019, "resmi"),
  laboh_tge: S("Japanese funding to push development of geothermal project in West Sumatra", "ThinkGeoEnergy", "https://www.thinkgeoenergy.com/japanese-funding-to-push-development-of-geothermal-project-in-west-sumatra/", 2017, "media"),
  laboh_jbic: S("JBIC interview 62 (pinjaman ekspansi Muara Laboh, Januari 2025)", "JBIC", "https://www.jbic.go.jp/en/image/JBIC_interview62_en.pdf", 2025, "resmi"),
  laboh_bisnis: S("PLTP Muara Laboh 85 MW Mulai Beroperasi", "Bisnis.com", "https://ekonomi.bisnis.com/read/20191216/44/1181674/pltp-muara-laboh-85-mw-mulai-beroperasi", 2019, "media"),
  dedap_se: S("PT Supreme Energy Rantau Dedap starts commercial operation", "PT Supreme Energy", "https://www.supreme-energy.com/id/publication_/pt-supreme-energy-rantau-dedap-starts-commercial-operation-rantau-dedap-geothermal-power-plant-development", 2021, "resmi"),
  dedap_jp: S("Geothermal plant of 91 MW begins operations in S. Sumatra", "The Jakarta Post", "https://www.thejakartapost.com/paper/2022/01/09/geothermal-plant-of-91-mw-begins-operations-in-s-sumatra.html", 2022, "media"),
  dedap_loan: S("Rantau Dedap geothermal project secures $540M loan from JBIC, ADB and others", "ThinkGeoEnergy", "https://www.thinkgeoenergy.com/rantau-dedap-geothermal-projects-secures-540m-loan-from-jbic-adb-and-others/", 2018, "media"),
  dedap_ppa: S("PLN, Supreme Energy agree on adapted PPA for Rantau Dedap geothermal project", "ThinkGeoEnergy", "https://www.thinkgeoenergy.com/pln-supreme-energy-agree-on-adapted-ppa-for-rantau-dedap-geothermal-project/", 2017, "media"),
  wayang: S("Star Energy starts operations of W. Java geothermal plant 2nd unit", "Petromindo", "https://www.petromindo.com/news/article/star-energy-starts-operations-of-w-java-geothermal-plant-2nd-unit", 2008, "media"),
  wayang2: S("Star Energi gandeng ABB, modernisasi PLTP Wayang Windu", "Listrik Indonesia", "https://listrikindonesia.com/detail/18766/star-energi-gandeng-abb-dukung-transisi-energi-melalui-modernisasi-pltp-wayang-windu", 2025, "media"),
  kenya: S("Kenya's journey towards geothermal leadership and model for African peers", "ThinkGeoEnergy", "https://www.thinkgeoenergy.com/kenyas-journey-towards-geothermal-leadership-and-model-for-african-peers/", 2024, "media"),
  kengen: S("KenGen, Information Memorandum Olkaria PPP Geothermal Project", "KenGen", "https://www.kengen.co.ke/Procurement/public/archive/tenders/INFORMATION%20MEMORANDUM%20OLKARIA%20PPP%20GEOTHERMAL%20PROJECT.pdf", 2020, "resmi"),
  iceland_oecd: S("OECD, Environment at a Glance, catatan negara Islandia", "OECD", "https://www.oecd.org/en/publications/environment-at-a-glance-country-notes_59ce6fe6-en/iceland_ffb31d15-en.html", 2024, "resmi"),
  iceland_eea: S("EEA, sumber energi terbarukan Islandia", "European Environment Agency", "https://www.eea.europa.eu/en/europe-environment-2025/countries/iceland/renewable-energy-sources/", 2025, "resmi"),
  iceland_bb: S("Iceland shows the world how to run on reliable, clean energy", "EnergyConnects (sindikasi Bloomberg)", "https://www.energyconnects.com/news/renewables/2023/february/iceland-shows-europe-how-to-run-on-reliable-clean-energy", 2023, "media"),
  tiwi: S("40th anniversary of geothermal power generation at Tiwi, Philippines", "ThinkGeoEnergy", "https://www.thinkgeoenergy.com/40th-anniversary-of-geothermal-power-generation-at-tiwi-philippines/", 2019, "media"),
  tiwi2: S("Asia's first steam field continues to power homes", "The Manila Times (PressReader)", "https://www.pressreader.com/philippines/manila-times/20230129/281706913818124", 2023, "media"),
  ph_edc: S("Geothermal energy development in the Philippines", "ThinkGeoEnergy", "https://www.thinkgeoenergy.com/geothermal-energy-development-in-the-philippines/", 2020, "media"),
  tr_kapsarc: S("Turkiye's geothermal growth lessons, insights by KAPSARC", "ThinkGeoEnergy", "https://www.thinkgeoenergy.com/turkiyes-geothermal-growth-lessons-insights-by-kapsarc/", 2024, "media"),
  tr_2016: S("Geothermal represents 11% of electricity under Turkey's renewable FIT scheme in 2016", "ThinkGeoEnergy", "https://www.thinkgeoenergy.com/geothermal-represents-11-of-electricity-under-turkeys-renewable-fit-scheme-in-2016/", 2017, "media"),
  tr_rate: S("Turkey introduces updated geothermal energy feed-in-tariff rates", "ThinkGeoEnergy", "https://www.thinkgeoenergy.com/turkey-introduces-updated-geothermal-energy-feed-in-tariff-rates/", 2021, "media"),
  sorik_esdm: S("Investigasi paparan gas H2S, Kementerian ESDM hentikan sementara aktivitas PLTP Sorik Marapi", "Kementerian ESDM", "https://www.esdm.go.id/en/media-center/news-archives/investigasi-paparan-gas-h2s-kementerian-esdm-hentikan-sementara-aktivitas-pltp-sorik-marapi-", 2021, "resmi"),
  sorik_hrm: S("Dozens poisoned with hydrogen sulfide gas due to PT SMGP's operations in North Sumatra", "Human Rights Monitor", "https://humanrightsmonitor.org/case/dozens-poisoned-with-hydrogen-sulfide-gas-due-to-pt-smgps-operations-in-north-sumatra/", 2022, "via-pihak-ketiga"),
  sorik_jp: S("Activists call for better geothermal safety after accident", "The Jakarta Post", "https://www.thejakartapost.com/paper/2022/03/15/activists-call-for-better-geothermal-safety-after-accident", 2022, "media"),
  sorik_pm: S("Investigation reveals negligence in deadly incident at Sorik Merapi geothermal project", "Petromindo", "https://petromindo.com/news/article/investigation-reveals-negligence-in-deadly-incident-at-sorik-merapi-geothermal-project", 2021, "media"),
  sorik_pt: S("PT Sorik Marapi dukung penuh investigasi pemerintah dan kepolisian", "Listrik Indonesia", "https://listrikindonesia.com/detail/9465/pt-sorik-marapi-dukung-penuh-investigasi-pemerintah-dan-kepolisian", 2021, "media"),
  dieng_kabar: S("Ini penjelasan Geo Dipa soal kronologi keluarnya gas beracun di Dieng", "Bisnis.com (Kabar24)", "https://kabar24.bisnis.com/read/20220313/15/1509974/ini-penjelasan-geo-dipa-soal-kronologi-keluarnya-gas-beracun-di-dieng", 2022, "media"),
  dieng_detik: S("Kronologi kebocoran gas beracun di Dieng hingga tewaskan 1 pekerja", "detikFinance", "https://finance.detik.com/energi/d-5980605/kronologi-kebocoran-gas-beracun-di-dieng-hingga-tewaskan-1-pekerja", 2022, "media"),
  dieng_mb: S("Ancaman gas beracun di Dieng, bagaimana mitigasinya", "Mongabay Indonesia", "https://mongabay.co.id/2022/03/15/ancaman-gas-beracun-di-dieng-bagaimana-mitigasinya/", 2022, "media"),
  talang25: S("Mengapa warga kukuh tolak proyek PLTP Gunung Talang", "Mongabay Indonesia", "https://mongabay.co.id/2025/12/01/mengapa-warga-kukuh-tolak-proyek-pltp-gunung-talang/", 2025, "media"),
  talang26: S("Perempuan Gunung Talang kukuh menolak proyek panas bumi", "Mongabay Indonesia", "https://mongabay.co.id/2026/03/17/perempuan-gunung-talang-kukuh-menolak-proyek-panas-bumi/", 2026, "media"),
  talang17: S("Ketika warga di Solok protes pembangunan pembangkit panas bumi, mengapa?", "Mongabay Indonesia", "https://mongabay.co.id/2017/09/30/ketika-warga-di-solok-protes-pembagunan-pembangkit-panas-bumi-mengapa/", 2017, "media"),
  talang18: S("Arcandra heran ada penolakan proyek panas bumi di Sumbar", "Republika", "https://ekonomi.republika.co.id/berita/pj073p430/arcandra-heran-ada-penolakan-proyek-panas-bumi-di-sumbar", 2018, "media"),
  ungaran1: S("PLN sebut PLTP Gunung Ungaran masih tahap kajian", "Antara", "https://www.antaranews.com/berita/5728691/pln-sebut-pltp-gunung-ungaran-masih-tahap-kajian", 2026, "media"),
  ungaran2: S("Kementerian ESDM izinkan PLN kembangkan panas bumi Gunung Ungaran jadi PLTP", "Koran Jakarta", "https://koran-jakarta.com/2026-08-26/kementerian-esdm-izinkan-pln-kembangkan-panas-bumi-gunung-ungaran-jadi-pltp-perkuat-energi-bersih-nasional", 2026, "media"),
  ungaran3: S("Warga menolak, proyek panas bumi Ungaran terus berjalan", "Mongabay Indonesia", "https://mongabay.co.id/short-article/2026/09/warga-menolak-proyek-panas-bumi-ungaran-terus-berjalan/", 2026, "media"),
  puna_hei: S("Puna Geothermal Venture back online after 2.5 years, sends power to Hawaii Island grid", "Hawaiian Electric", "https://www.hawaiianelectric.com/puna-geothermal-venture-back-online-after-two-and-a-half-years-sends-power-to-hawaii-island-grid", 2020, "resmi"),
  puna_ap: S("Hawaii geothermal power plant pushes back relaunch", "Associated Press (Washington Times)", "https://www.washingtontimes.com/news/2020/may/15/hawaii-geothermal-power-plant-pushes-back-relaunch/", 2020, "media"),
  puna_tge: S("Puna Geothermal Venture (ThinkGeoEnergy)", "ThinkGeoEnergy", "https://www.thinkgeoenergy.com/no-geothermal-royalties-collected-in-hawaii-in-2020/", 2021, "media"),
  bren: S("Barito Renewables (BREN) tambah kapasitas setrum panas bumi 41 MW", "Bisnis.com", "https://market.bisnis.com/read/20250116/192/1832150/barito-renewables-bren-tambah-kapasitas-setrum-panas-bumi-41-mw", 2025, "media"),
  medco: S("Medco Energi, transisi ke energi rendah karbon (PLTP Ijen 35 MW beroperasi komersial Feb 2025)", "Medco Energi", "https://www.medcoenergi.com/en/our-sustainability/climate-change/transition-to-low-carbon-energy/", 2025, "resmi"),
  jetp: S("JETP Indonesia, portofolio (hibah PLTP Patuha Unit 2)", "Sekretariat JETP Indonesia", "https://jetp-id.org/", 2026, "resmi"),
  patuha: S("Raih satu juta jam kerja selamat, PLTP Patuha Unit 2", "JPNN Jabar", "https://jabar.jpnn.com/jabar-terkini/32740/raih-satu-juta-jam-kerja-selamat-pltp-patuha-unit-2-torehkan-prestasi-sebelum-beroperasi", 2026, "media"),
  mataloko: S("PLN UIP Nusra dorong penyerapan tenaga kerja lokal lewat pengembangan PLTP Mataloko", "Tribun Kupang", "https://kupang.tribunnews.com/adv/975061/pln-uip-nusra-dorong-penyerapan-tenaga-kerja-lokal-melalui-pengembangan-pltp-mataloko", 2026, "media"),
  geodipa: S("Geo Dipa bidik RI jadi negara berkapasitas panas bumi nomor 1 dunia", "CNN Indonesia", "https://www.cnnindonesia.com/ekonomi/20261106171043-85-1424202/geo-dipa-bidik-ri-jadi-negara-berkapasitas-panas-bumi-nomor-1-dunia", 2026, "media"),
  sdgone: S("SDG Indonesia One (PT SMI)", "PT Sarana Multi Infrastruktur", "https://www.ptsmi.co.id/", 2026, "resmi"),
  ruptl: S("RUPTL PT PLN (Persero) 2025-2034 (lampiran Kepmen ESDM 188.K/TL.03/MEM.L/2025)", "PT PLN (Persero); Kementerian ESDM", "https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf", 2025, "resmi"),
  geoportal: S("Catatan METI: Geoportal ESDM melarang robot (robots.txt Disallow /); koordinat WKP tidak dipanen", "METI Network", "/data/wkp.json", 2026, "editorial", "CC BY 4.0 (METI)"),
};

/* ---------------- data dari repo ---------------- */
function irisan() {
  const tren = baca("kapasitas_tren").baris.filter((b) => b.teknologi === "panas_bumi").sort((a, z) => a.tahun - z.tahun);
  const wkp = baca("wkp");
  const wkpSumber = Object.fromEntries(wkp.sumber.map((s) => [s.id, s]));
  const keu = baca("keuangan").baris.filter((b) => b.kelompok === "tarif" && /^PLTP/.test(b.teknologi));
  const proyek = baca("proyek").baris.filter((p) => p.teknologi === "panas-bumi");
  const dasar = baca("topik/dasar-panas-bumi");
  return { tren, wkp, wkpSumber, keu, proyek, dasar };
}
const mw = (p) => { const k = (p.kapasitas || [])[0]; return k && Number.isFinite(k.nilai) ? k.nilai : null; };
const st = (p) => (p.status || [])[0]?.nilai ?? null;
const nama = (s) => String(s || "");

/* ---------------- kasus ---------------- */
const kasusBerhasil = [
  {
    id: "kamojang", nama: "PLTP Kamojang", jenis: "berhasil", negara: "ID", lokasi: T("Jawa Barat", "West Java"),
    profil: [
      { label: T("Pengelola", "Operator"), nilai: T("PT Pertamina Geothermal Energy (PGE)", "PT Pertamina Geothermal Energy (PGE)") },
      { label: T("Kapasitas terpasang", "Installed capacity"), nilai: 235, satuan: "MW" },
      { label: T("Listrik pertama", "First electricity"), nilai: "1978" },
      { label: T("Unit 1 (30 MW), operasi komersial", "Unit 1 (30 MW), commercial operation"), nilai: "1983" },
    ],
    tindakan: [
      T("Survei dan pengeboran eksplorasi dimulai sejak masa kolonial (1926) lalu dilanjutkan program bersama Selandia Baru 1971-1979 dengan 14 sumur eksplorasi.", "Surveys and exploration drilling began in the colonial era (1926), followed by a joint programme with New Zealand in 1971-1979 with 14 exploration wells."),
      T("Skala dinaikkan bertahap: pembangkit percontohan 0,25 MW (1978), unit 1 30 MW, unit 2 dan 3 masing-masing 55 MW (1987-1988), unit 4 60 MW (2003-2007).", "Scaled up step by step: a 0.25 MW pilot (1978), a 30 MW unit 1, 55 MW units 2 and 3 (1987-1988), and a 60 MW unit 4 (2003-2007)."),
    ],
    sebab: [H("risiko eksplorasi ditanggung negara dan BUMN selama puluhan tahun, sehingga data reservoir sudah ada sebelum investasi besar masuk.", "exploration risk was carried by the state and a state company for decades, so reservoir data existed before large investment arrived.")],
    angka: [
      { label: T("Kapasitas terpasang saat ini (lima unit)", "Current installed capacity (five units)"), nilai: 235, d: 0, satuan: "MW", sumber: "pge_kmj", est: false },
      { label: T("Unit tertua yang masih berproduksi sejak", "Oldest unit still producing since"), nilai: 1983, d: 0, satuan: "", sumber: "esdm_kmj", est: false },
    ],
    pelajaran: [H("lapangan yang datanya matang dan diwariskan antar generasi menurunkan risiko tiap ekspansi; data sumur sangat bernilai bila dibuka kepada pengembang baru.", "a field with mature data passed between generations lowers the risk of each expansion; well data is highly valuable when opened to new developers.")],
    kronologi: [
      { tanggal: "1926-01-01", teks: T("Eksplorasi awal oleh pemerintah kolonial Belanda (tahun saja, tanggal tidak dirinci sumber).", "Early exploration by the Dutch colonial government (year only; the source gives no date).") },
      { tanggal: "1978-01-01", teks: T("Listrik pertama 0,25 MW dari Kamojang (tahun saja).", "First electricity, 0.25 MW, from Kamojang (year only).") },
      { tanggal: "1983-01-01", teks: T("Unit 1 30 MW diresmikan; sumber lain menyebut mulai beroperasi 1981-1982 (tahun saja).", "Unit 1 (30 MW) officially recognised; other sources say it started in 1981-1982 (year only).") },
    ],
    faktor: { risiko_eksplorasi: true, teknologi: true, ppa_tarif: true },
    sumber: ["esdm_kmj", "pge_kmj"], hak_jawab: false,
  },
  {
    id: "sarulla", nama: "PLTP Sarulla (330 MW)", jenis: "berhasil", negara: "ID", lokasi: T("Sumatera Utara", "North Sumatra"),
    profil: [
      { label: T("Kapasitas rencana", "Planned capacity"), nilai: 330, satuan: "MW" },
      { label: T("Struktur", "Structure"), nilai: T("tiga fase masing-masing 110 MW", "three phases of 110 MW each") },
      { label: T("Pemilik konsorsium", "Consortium owners"), nilai: T("Medco 37,25%, Itochu 25%, Kyushu 25%, Ormat 12,75%", "Medco 37.25%, Itochu 25%, Kyushu 25%, Ormat 12.75%") },
      { label: T("Pembiayaan", "Financing"), nilai: T("US$1,17 miliar, Maret 2014 (JBIC, ADB, bank komersial)", "US$1.17 billion, March 2014 (JBIC, ADB, commercial banks)") },
    ],
    tindakan: [
      T("Pembiayaan proyek (project finance) dengan pinjaman langsung JBIC dan ADB serta pinjaman bank swasta yang dijamin risiko politiknya oleh JBIC.", "Project finance with direct JBIC and ADB loans plus commercial bank loans backed by JBIC political risk guarantees."),
      T("Konsorsium gabungan operator Indonesia, trader Jepang, utilitas Jepang, dan penyedia teknologi (Ormat) yang menyebar risiko.", "A consortium of an Indonesian operator, a Japanese trader, a Japanese utility and a technology provider (Ormat) that spreads risk."),
    ],
    sebab: [H("kombinasi pendana pemerintah-multilateral yang sabar dan pemilik berpengalaman membuat struktur yang bisa dibiayai bank (bankable) walau proyeknya sangat besar.", "a mix of patient government and multilateral lenders and experienced owners made a bankable structure despite the very large size.")],
    angka: [
      { label: T("Nilai pembiayaan proyek", "Project financing value"), nilai: 1170, d: 0, satuan: "US$ juta", sumber: "sarulla", est: false },
      { label: T("Kapasitas total rencana", "Total planned capacity"), nilai: 330, d: 0, satuan: "MW", sumber: "sarulla", est: false },
    ],
    pelajaran: [
      H("proyek di atas 300 MW perlu konsorsium dan jaminan risiko politik; tiap fase dibangun dan dibiayai terpisah agar risiko tidak menumpuk.", "projects above 300 MW need a consortium and political risk cover; each phase is built and financed separately so risk does not pile up."),
      T("Catatan data: nilai pinjaman ADB dilaporkan berbeda antar media (US$250 juta atau US$350 juta), dan tanggal operasi komersial tiap fase belum diverifikasi dari sumber primer.", "Data note: the ADB loan amount is reported differently across media (US$250 million or US$350 million), and the commercial operation date of each phase has not been verified from a primary source."),
    ],
    kronologi: [{ tanggal: "2014-03-01", teks: T("Perjanjian pembiayaan US$1,17 miliar ditandatangani (bulan saja); first drawdown dilaporkan Mei 2014.", "US$1.17 billion financing agreements signed (month only); first drawdown reported in May 2014.") }],
    faktor: { pendanaan: true, risiko_eksplorasi: true, ppa_tarif: true },
    sumber: ["sarulla", "sarulla2", "sarulla3"], hak_jawab: false,
  },
  {
    id: "muara-laboh", nama: "PLTP Muara Laboh", jenis: "berhasil", negara: "ID", lokasi: T("Sumatera Barat", "West Sumatra"),
    profil: [
      { label: T("Kapasitas fase 1", "Phase 1 capacity"), nilai: 85, satuan: "MW" },
      { label: T("Pemilik", "Owners"), nilai: T("Supreme Energy 30%, ENGIE 35%, Sumitomo 35% (menurut satu sumber media)", "Supreme Energy 30%, ENGIE 35%, Sumitomo 35% (per one media source)") },
      { label: T("Operasi komersial", "Commercial operation"), nilai: "16 Desember 2019" },
      { label: T("Investasi fase 1", "Phase 1 investment"), nilai: "US$580 juta" },
    ],
    tindakan: [
      T("Pinjaman proyek sekitar US$439-440 juta: JBIC dari neracanya sendiri US$198 juta dan sindikasi bank komersial dipimpin ADB, didukung asuransi NEXI.", "Project loans of about US$439-440 million: JBIC's own US$198 million and a commercial bank syndicate led by ADB, with NEXI insurance."),
      T("Ekspansi: JBIC menandatangani pinjaman proyek hingga sekitar US$138 juta (porsi JBIC) pada Januari 2025.", "Expansion: JBIC signed a project loan of up to about US$138 million (JBIC portion) in January 2025."),
    ],
    sebab: [H("pengembang swasta yang konsisten memegang WKP lintas fase, dengan mitra utilitas dan perdagangan Jepang yang membawa akses pembiayaan murah.", "a private developer that kept the working area across phases, with Japanese utility and trading partners that brought cheap financing access.")],
    angka: [
      { label: T("Kapasitas fase 1", "Phase 1 capacity"), nilai: 85, d: 0, satuan: "MW", sumber: "laboh_sc", est: false },
      { label: T("Pinjaman JBIC dari neraca sendiri", "JBIC loan from own account"), nilai: 198, d: 0, satuan: "US$ juta", sumber: "laboh_tge", est: false },
    ],
    pelajaran: [
      T("Pelajaran: pemilik gabungan lokal dan asing dengan pendana bilateral dapat menuntaskan proyek di lokasi terpencil dalam sekitar satu dekade dari tonggak awal.", "Lesson: a mixed local and foreign ownership with bilateral lenders can finish a remote project in about a decade from its first milestone (a METI reading; the exact timeline is not documented here)."),
      T("Catatan data: tanggal COD tercatat 16 Desember (Sumitomo) dan 15 Desember 2019 (Bisnis.com); angka pinjaman bervariasi antar sumber.", "Data note: COD is recorded as 16 December (Sumitomo) and 15 December 2019 (Bisnis.com); loan figures vary across sources."),
    ],
    kronologi: [
      { tanggal: "2019-12-16", teks: T("Operasi komersial 85 MW.", "Commercial operation, 85 MW.") },
      { tanggal: "2025-01-01", teks: T("JBIC menandatangani pinjaman ekspansi (bulan Januari 2025).", "JBIC signs the expansion loan (January 2025).") },
    ],
    faktor: { pendanaan: true, risiko_eksplorasi: true, ppa_tarif: true },
    sumber: ["laboh_sc", "laboh_tge", "laboh_jbic", "laboh_bisnis"], hak_jawab: false,
  },
  {
    id: "rantau-dedap", nama: "PLTP Rantau Dedap", jenis: "berhasil", negara: "ID", lokasi: T("Sumatera Selatan", "South Sumatra"),
    profil: [
      { label: T("Kapasitas fase 1", "Phase 1 capacity"), nilai: 91.2, satuan: "MW" },
      { label: T("Pemilik", "Owners"), nilai: T("Supreme Energy, ENGIE, Marubeni, Tohoku Electric Power", "Supreme Energy, ENGIE, Marubeni, Tohoku Electric Power") },
      { label: T("Tutup keuangan fase 1", "Phase 1 financial close"), nilai: "Maret 2018" },
      { label: T("Operasi komersial", "Commercial operation"), nilai: "26 Desember 2021" },
    ],
    tindakan: [
      T("Perjanjian jual beli listrik (PPA) disesuaikan antara PLN dan Supreme Energy pada 2017 sebelum tutup keuangan.", "The power purchase agreement (PPA) was adapted between PLN and Supreme Energy in 2017 before financial close."),
      T("Pinjaman sekitar US$540 juta dari JBIC, ADB, dan bank lain; dibangun di lereng terjal sekitar 2.600 m dan selesai di tengah pandemi.", "Loans of about US$540 million from JBIC, ADB and other banks; built on steep terrain at about 2,600 m and completed during the pandemic."),
    ],
    sebab: [H("PPA yang diubah sampai bisa dibiayai bank (bankable) membuka pinjaman besar; fase 1 dibatasi supaya risiko terkendali.", "a PPA reworked until it was bankable unlocked the large loan; phase 1 was limited to keep risk contained.")],
    angka: [
      { label: T("Kapasitas fase 1 (semula direncanakan 86 MW)", "Phase 1 capacity (originally planned 86 MW)"), nilai: 91.2, d: 1, satuan: "MW", sumber: "dedap_se", est: false },
      { label: T("Nilai pinjaman proyek", "Project loan value"), nilai: 540, d: 0, satuan: "US$ juta", sumber: "dedap_loan", est: false },
    ],
    pelajaran: [H("negosiasi PPA yang terbuka terhadap penyesuaian adalah syarat tutup keuangan; jeda antara tutup keuangan (2018) dan COD (2021) menunjukkan masa konstruksi panas bumi di medan sulit.", "negotiating a PPA that can be adapted is a condition of financial close; the gap between financial close (2018) and COD (2021) shows the construction time of geothermal in difficult terrain.")],
    kronologi: [
      { tanggal: "2017-11-22", teks: T("Para pihak menyepakati perubahan PPA (berita Jakarta Post 22 November 2017).", "The parties agree to amend the PPA (Jakarta Post, 22 November 2017).") },
      { tanggal: "2018-03-01", teks: T("Tutup keuangan fase 1 (bulan saja).", "Phase 1 financial close (month only).") },
      { tanggal: "2021-12-26", teks: T("Operasi komersial fase 1.", "Phase 1 commercial operation.") },
    ],
    faktor: { ppa_tarif: true, pendanaan: true, risiko_eksplorasi: true },
    sumber: ["dedap_se", "dedap_jp", "dedap_loan", "dedap_ppa"], hak_jawab: false,
  },
  {
    id: "wayang-windu", nama: "PLTP Wayang Windu", jenis: "berhasil", negara: "ID", lokasi: T("Jawa Barat", "West Java"),
    profil: [
      { label: T("Kapasitas awal", "Initial capacity"), nilai: 227, satuan: "MW" },
      { label: T("Unit", "Units"), nilai: T("Unit 1 110 MW dan unit 2 117 MW", "Unit 1 110 MW and unit 2 117 MW") },
      { label: T("Pengelola", "Operator"), nilai: T("Star Energy (Magma Nusantara)", "Star Energy (Magma Nusantara)") },
      { label: T("Kapasitas terpasang setelah retrofit", "Installed after retrofit"), nilai: 230.5, satuan: "MW" },
    ],
    tindakan: [
      T("Unit 2 beroperasi sekitar 2008-2009 di atas kontrak operasi bersama (JOC) dengan PGE dan kontrak penjualan energi dengan Pertamina dan PLN.", "Unit 2 started around 2008-2009 under a joint operation contract (JOC) with PGE and an energy sales contract with Pertamina and PLN."),
      T("Retrofit unit 1 dan 2 telah selesai; tambahan 30 MW unit 3 ditargetkan akhir 2026.", "Retrofit of units 1 and 2 is complete; a further 30 MW from unit 3 is targeted by end 2026."),
    ],
    sebab: [H("lapangan berproduksi lebih dari dua dekade karena pengelola swasta berpengalaman mau menanam ulang modal untuk retrofit dan pengembangan unit baru.", "the field has produced for over two decades because an experienced private operator reinvests in retrofit and new units.")],
    angka: [
      { label: T("Kapasitas awal dua unit", "Initial capacity of two units"), nilai: 227, d: 0, satuan: "MW", sumber: "wayang", est: false },
      { label: T("Kapasitas terpasang setelah retrofit", "Installed capacity after retrofit"), nilai: 230.5, d: 1, satuan: "MW", sumber: "wayang2", est: false },
    ],
    pelajaran: [T("Skema JOC dengan PGE terbukti dapat menjaga kontinuitas lapangan ketika kepemilikan pengelola berganti; tanggal mulai operasi unit 1 berbeda antar sumber dan belum diverifikasi.", "A JOC with PGE has kept a field going as operator ownership changed; the start date of unit 1 differs across sources and is not verified.")],
    kronologi: [{ tanggal: "2008-12-01", teks: T("Laporan Petromindo: unit 2 mulai operasi komersial (bulan saja).", "Petromindo report: unit 2 starts commercial operation (month only).") }],
    faktor: { teknologi: true, ppa_tarif: true },
    sumber: ["wayang", "wayang2"], hak_jawab: false,
  },
  {
    id: "olkaria", nama: "Olkaria dan model GDC (Kenya)", jenis: "berhasil", negara: "KE", lokasi: T("Lembah Rift, Kenya", "Rift Valley, Kenya"),
    profil: [
      { label: T("Pengelola pembangkit", "Plant operator"), nilai: T("KenGen (milik negara) dan Ormat (Olkaria III, 150 MW)", "KenGen (state-owned) and Ormat (Olkaria III, 150 MW)") },
      { label: T("Pengembang uap", "Steam developer"), nilai: T("GDC, perusahaan milik pemerintah sejak 2009", "GDC, a government-owned company since 2009") },
      { label: T("Uap yang dijual GDC ke KenGen (Olkaria)", "Steam sold by GDC to KenGen (Olkaria)"), nilai: 320, satuan: "MW" },
      { label: T("Kapasitas uap GDC di Menengai", "GDC steam capacity at Menengai"), nilai: 170, satuan: "MW" },
    ],
    tindakan: [T("Negara membentuk GDC sebagai perusahaan khusus yang membor sumur, menanggung risiko eksplorasi, lalu menjual uap kepada pembangkit.", "The state created GDC as a special company that drills wells, carries exploration risk and sells steam to generators.")],
    sebab: [H("pemisahan risiko hulu (uap) dan hilir (pembangkit) membuat investor swasta cukup menanggung risiko pembangkit.", "separating upstream (steam) from downstream (generation) risk means private investors need only carry generation risk.")],
    angka: [
      { label: T("Uap GDC dijual ke KenGen", "GDC steam sold to KenGen"), nilai: 320, d: 0, satuan: "MW", sumber: "kenya", est: false },
      { label: T("Kapasitas uap Menengai", "Menengai steam capacity"), nilai: 170, d: 0, satuan: "MW", sumber: "kenya", est: false },
    ],
    pelajaran: [
      H("Indonesia punya padanan: pengeboran pemerintah lewat PISP/PT SMI. Perbedaannya, di Kenya uap dijual sebagai produk tetap; di Indonesia data sumur diserahkan ke pelelang.", "Indonesia has a counterpart: government drilling through PISP/PT SMI. The difference is that in Kenya steam is sold as a standing product; in Indonesia the well data is handed to the auction winner."),
      T("Catatan data: total kapasitas kompleks Olkaria berbeda antar sumber (573 MW sampai sekitar 810 MW) dan bergantung cakupan; tidak ditampilkan sebagai satu angka.", "Data note: total Olkaria complex capacity differs across sources (573 MW to about 810 MW) depending on scope; not shown as a single number."),
    ],
    kronologi: [{ tanggal: "2009-01-01", teks: T("Pemerintah Kenya membentuk GDC (tahun saja).", "The Government of Kenya forms GDC (year only).") }],
    faktor: { risiko_eksplorasi: true, pendanaan: true },
    sumber: ["kenya", "kengen"], hak_jawab: false,
  },
  {
    id: "islandia", nama: "Islandia: pemanfaatan langsung", jenis: "berhasil", negara: "IS", lokasi: T("Islandia", "Iceland"),
    profil: [
      { label: T("Pangsa panas bumi dalam keluaran pemanas", "Geothermal share of heating output"), nilai: 97, satuan: "%" },
      { label: T("Rumah dengan pemanas distrik dari air panas bumi", "Homes on district heating from geothermal water"), nilai: 90, satuan: "% (laporan media)" },
    ],
    tindakan: [T("Air panas dari sumur disalurkan langsung lewat jaringan pemanas distrik ke rumah; sisanya listrik dari hidro dan uap panas bumi.", "Hot water from wells is piped directly through district heating networks to homes; the rest is electricity from hydro and geothermal steam.")],
    sebab: [H("pemanfaatan langsung (panas, bukan listrik) memberi efisiensi jauh lebih tinggi untuk kebutuhan panas dan tidak bergantung tarif listrik.", "direct use (heat, not electricity) is far more efficient for heat demand and does not depend on an electricity tariff.")],
    angka: [
      { label: T("Pangsa panas bumi dalam keluaran pemanas", "Geothermal share of heating output"), nilai: 97, d: 0, satuan: "%", sumber: "iceland_oecd", est: false },
      { label: T("Rumah dengan pemanas distrik (laporan media)", "Homes on district heating (media report)"), nilai: 90, d: 0, satuan: "%", sumber: "iceland_bb", est: false },
    ],
    pelajaran: [
      H("untuk Indonesia, pemanfaatan langsung (pengeringan hasil pertanian, agrowisata, pemanas) layak dibahas sebagai pelengkap; iklim tropis menutup pasar pemanas ruang.", "for Indonesia direct use (crop drying, agro-tourism, process heat) deserves discussion as a complement; the tropical climate removes the space heating market."),
      T("Catatan data: sumber berbeda soal pangsa rumah (85-90%); EEA menyebut panas bumi dan hidro menyuplai hampir seluruh listrik dan pemanas.", "Data note: sources differ on the share of homes (85-90%); the EEA says geothermal and hydro supply almost all electricity and heating."),
    ],
    kronologi: [],
    faktor: { teknologi: true },
    sumber: ["iceland_oecd", "iceland_eea", "iceland_bb"], hak_jawab: false,
  },
  {
    id: "tiwi-makban", nama: "Tiwi dan Makban (Filipina)", jenis: "berhasil", negara: "PH", lokasi: T("Albay, Batangas, Laguna", "Albay, Batangas, Laguna"),
    profil: [
      { label: T("Operasi komersial Tiwi", "Tiwi commercial operation"), nilai: "Mei 1979" },
      { label: T("Kapasitas Tiwi", "Tiwi capacity"), nilai: 234, satuan: "MW" },
      { label: T("Badan negara pengembang", "State developer"), nilai: T("PNOC-EDC, dibentuk 1976", "PNOC-EDC, formed 1976") },
    ],
    tindakan: [
      T("Pemerintah membentuk PNOC-EDC (1976) untuk mengembangkan panas bumi sendiri tanpa swasta karena biaya awalnya tinggi.", "The government formed PNOC-EDC (1976) to develop geothermal itself, without the private sector, because of the high upfront cost."),
      T("EDC diprivatisasi lewat IPO pada 2006 dan diakuisisi Lopez Group; Tiwi dan Makban kini dijalankan perusahaan berbeda.", "EDC was privatised through an IPO in 2006 and acquired by the Lopez Group; Tiwi and Makban are now run by different companies."),
    ],
    sebab: [H("negara mengambil risiko eksplorasi di awal, membangun basis lapangan, baru kemudian melepas ke swasta ketika risiko sudah jelas.", "the state took exploration risk first, built the field base, and only then released it to the private sector once risk was clear.")],
    angka: [{ label: T("Kapasitas Tiwi (menurut The Manila Times, ketiga terbesar di Filipina)", "Tiwi capacity (per The Manila Times, third largest in the Philippines)"), nilai: 234, d: 0, satuan: "MW", sumber: "tiwi2", est: false }],
    pelajaran: [H("urutan negara membuka lapangan lalu swasta mengoperasikan terbukti bekerja; relevan bagi gagasan pengeboran pemerintah di Indonesia.", "the sequence of the state opening a field and then private operators running it has worked; relevant to government drilling in Indonesia.")],
    kronologi: [
      { tanggal: "1976-01-01", teks: T("PNOC-EDC dibentuk (tahun saja).", "PNOC-EDC is formed (year only).") },
      { tanggal: "1979-05-01", teks: T("Tiwi mulai operasi komersial (bulan saja).", "Tiwi starts commercial operation (month only).") },
    ],
    faktor: { risiko_eksplorasi: true, pendanaan: true },
    sumber: ["tiwi", "tiwi2", "ph_edc"], hak_jawab: false,
  },
  {
    id: "turki", nama: "Turki: tarif jual beli terjamin (FiT)", jenis: "berhasil", negara: "TR", lokasi: T("Turki", "Turkey"),
    profil: [
      { label: T("Tarif panas bumi YEKDEM (awal)", "Geothermal YEKDEM tariff (initial)"), nilai: "US$ 10,5 sen/kWh + 2,7 sen bonus komponen lokal" },
      { label: T("Kapasitas terpasang 2008", "Installed capacity 2008"), nilai: 80, satuan: "MW" },
      { label: T("Kapasitas terpasang April 2024", "Installed capacity April 2024"), nilai: 1691.4, satuan: "MW" },
    ],
    tindakan: [
      T("Tarif beli tetap berbasis dolar AS untuk panas bumi dengan bonus bagi peralatan buatan dalam negeri.", "A fixed US dollar feed-in tariff for geothermal, with a bonus for domestically made equipment."),
      T("Tarif direvisi turun sekitar 36% dengan batas atas US$0,086/kWh untuk pembangkit yang beroperasi 1 Juli 2021 sampai 31 Desember 2030.", "The tariff was revised down by about 36% with a cap of US$0.086/kWh for plants operating from 1 July 2021 to 31 December 2030."),
    ],
    sebab: [H("kepastian pembeli dan tarif membuat bank mau meminjam, sehingga pengembang swasta membor sendiri.", "a certain buyer and tariff let banks lend, so private developers drilled on their own.")],
    angka: [
      { label: T("Pembayaran FiT ke operator panas bumi 2016", "FiT payout to geothermal operators, 2016"), nilai: 695, d: 0, satuan: "US$ juta", sumber: "tr_2016", est: false },
      { label: T("Kapasitas terpasang April 2024", "Installed capacity April 2024"), nilai: 1691.4, d: 1, satuan: "MW", sumber: "tr_kapsarc", est: false },
    ],
    pelajaran: [
      H("tarif yang pasti cepat menarik modal, tetapi beban subsidi membengkak sehingga pemerintah memangkas tarif: Indonesia memilih harga patokan tertinggi, bukan FiT tetap.", "a certain tariff attracts capital fast, but the subsidy burden grows so the government cut it: Indonesia chose a ceiling price rather than a fixed FiT."),
      T("Catatan data: angka 752 MW (cakupan YEKDEM akhir 2016) dan 1.691 MW (nasional 2024) berbeda cakupan; tidak untuk dibandingkan langsung.", "Data note: 752 MW (YEKDEM scope, end 2016) and 1,691 MW (national, 2024) differ in scope and should not be compared directly."),
    ],
    kronologi: [],
    faktor: { ppa_tarif: true, pendanaan: true },
    sumber: ["tr_kapsarc", "tr_2016", "tr_rate"], hak_jawab: false,
  },
];

const HJ = T(
  "Pihak yang disebut berhak menanggapi. Kirim koreksi atau tanggapan lewat formulir koreksi METI; tanggapan yang diverifikasi dimuat berdampingan dengan teks ini.",
  "Parties named have a right of reply. Send corrections or responses through the METI correction form; verified responses are published alongside this text."
);
const kasusGagal = [
  {
    id: "sorik-marapi", nama: "PLTP Sorik Marapi: paparan gas H2S", jenis: "gagal", negara: "ID", lokasi: T("Mandailing Natal, Sumatera Utara", "Mandailing Natal, North Sumatra"),
    profil: [
      { label: T("Pengembang", "Developer"), nilai: T("PT Sorik Marapi Geothermal Power (SMGP)", "PT Sorik Marapi Geothermal Power (SMGP)") },
      { label: T("Unit I", "Unit I"), nilai: 45, satuan: "MW" },
      { label: T("Insiden 25 Januari 2021, korban meninggal", "25 January 2021 incident, deaths"), nilai: 5 },
    ],
    sebab: [
      T("Menurut rilis ESDM: gas diduga H2S dilepas saat uji alir (discharge) sumur SM T02 di unit II; pendeteksi gas di dekat lokasi tidak mencatat kebocoran; warga yang bekerja di sawah 300-500 m dari lokasi pingsan.", "Per the ESDM release: gas presumed to be H2S was released during discharge of well SM T02 at unit II; gas detectors near the site did not register a leak; villagers working in rice fields 300-500 m away collapsed."),
      T("Media melaporkan insiden berulang di lokasi yang sama pada 2021-2022 (Human Rights Monitor menghitung korban dirawat 87 orang pada akhir September 2022); penyebab pasti tiap insiden perlu dibaca dari hasil investigasi resmi.", "Media report repeated incidents at the same site in 2021-2022 (Human Rights Monitor counts 87 people hospitalised by late September 2022); the exact cause of each incident should be read from official investigations."),
    ],
    terdampak: T("Warga sekitar lokasi (sawah dan permukiman), dengan korban meninggal termasuk anak-anak menurut laporan media.", "Residents near the site (rice fields and homes), with deaths including children per media reports."),
    seharusnya: H("zona aman (buffer) dan sirene peringatan sebelum uji alir, jalur evakuasi yang diumumkan ke desa, serta detektor di arah angin, dilakukan sebelum sumur dibuka.", "a buffer zone and warning sirens before discharge, an evacuation route announced to villages, and detectors downwind should be in place before a well is opened."),
    tanda_bahaya: [
      T("Insiden gas yang berulang tanpa perbaikan prosedur yang diumumkan.", "Repeated gas incidents without an announced procedure fix."),
      T("Detektor di lokasi tidak mencatat apa pun padahal korban ada di luar pagar.", "On-site detectors register nothing while victims are outside the fence."),
    ],
    kronologi: [
      { tanggal: "2021-01-25", teks: T("Sekitar pukul 12.00 WIB uji alir sumur SM T02; sekitar 12.30 WIB warga di sawah pingsan.", "About 12:00 WIB discharge of well SM T02; about 12:30 WIB villagers in the fields collapse.") },
      { tanggal: "2021-01-26", teks: T("ESDM menghentikan sementara operasi unit I, pengeboran dua rig, dan pengembangan unit II; inspektur dikirim.", "ESDM suspends unit I operation, drilling with two rigs and unit II development; inspectors dispatched.") },
    ],
    faktor: { keselamatan: true, sosial: true },
    sumber: ["sorik_esdm", "sorik_hrm", "sorik_jp", "sorik_pm", "sorik_pt"],
    catatan: T("Tanggapan pengembang: SMGP menyatakan mendukung penuh investigasi pemerintah dan kepolisian (Listrik Indonesia, 2021). Hasil investigasi dan proses hukum perlu dibaca dari sumber resmi.", "Developer response: SMGP said it fully supports the government and police investigations (Listrik Indonesia, 2021). Investigation results and legal processes should be read from official sources."),
    hak_jawab: true,
  },
  {
    id: "dieng-2022", nama: "PLTP Dieng: kebocoran gas pad 28", jenis: "gagal", negara: "ID", lokasi: T("Banjarnegara, Jawa Tengah", "Banjarnegara, Central Java"),
    profil: [
      { label: T("Pengelola", "Operator"), nilai: T("PT Geo Dipa Energi", "PT Geo Dipa Energi") },
      { label: T("Tanggal", "Date"), nilai: "12 Maret 2022" },
      { label: T("Korban", "Casualties"), nilai: T("1 pekerja meninggal, 8 dirawat (menurut media)", "1 worker died, 8 hospitalised (per media)") },
    ],
    sebab: [
      T("Menurut penjelasan Geo Dipa: paparan terjadi saat katup pelepas (relief valve) terbuka otomatis di bawah tekanan standar ketika satu sumur produksi sedang diperbaiki (workover) oleh rig kontraktor.", "Per Geo Dipa's explanation: exposure occurred when a relief valve opened automatically below the standard pressure while a production well was being repaired (workover) by a contractor rig."),
      T("Geo Dipa menyatakan kejadian bukan ledakan sumur dan tidak terjadi pada sumur yang sedang dibor; polisi menyelidiki penyebab dan kepatuhan prosedur.", "Geo Dipa said the event was not a well blowout and did not occur at a well being drilled; police investigated the cause and procedural compliance."),
    ],
    terdampak: T("Pekerja kontraktor dan pengelola; korban dari kalangan warga tidak dilaporkan pada kejadian ini menurut penjelasan Geo Dipa.", "Contractor and operator workers; no resident casualties were reported for this event per Geo Dipa's explanation."),
    seharusnya: H("pekerjaan workover dengan sumur berpotensi H2S memerlukan izin kerja panas, pemantauan gas personel, dan penghentian pekerjaan bila tekanan menyimpang.", "workover on wells with potential H2S needs a permit to work, personal gas monitors and a stop-work trigger when pressure deviates."),
    tanda_bahaya: [
      T("Katup pelepas membuka di bawah tekanan yang ditetapkan.", "A relief valve opens below the set pressure."),
      T("Riwayat insiden lapangan yang sama diingatkan Mongabay (2007 dan 2016) sebagai konteks risiko lokasi.", "Mongabay recalls earlier incidents at the same field (2007 and 2016) as site risk context."),
    ],
    kronologi: [{ tanggal: "2022-03-12", teks: T("Gas beracun keluar di pad 28, satu pekerja meninggal, delapan dirawat di RSUD Wonosobo.", "Toxic gas released at pad 28, one worker dies, eight are treated at Wonosobo hospital.") }],
    faktor: { keselamatan: true, sosial: true },
    sumber: ["dieng_kabar", "dieng_detik", "dieng_mb"],
    catatan: T("Tanggapan pengelola: Geo Dipa menerangkan kronologi dan membantah adanya ledakan sumur (Bisnis.com, 13 Maret 2022). Proyek PLTP Dieng pengembangan (345 MW, status konstruksi menurut data METI) tidak berhenti total; status terkini perlu dikonfirmasi pengelola.", "Operator response: Geo Dipa explained the chronology and denied a well blowout (Bisnis.com, 13 March 2022). The Dieng expansion (345 MW, construction status per METI data) has not stopped altogether; the current status should be confirmed with the operator."),
    hak_jawab: true,
  },
  {
    id: "gunung-talang", nama: "PLTP Gunung Talang: penolakan warga", jenis: "mundur", negara: "ID", lokasi: T("Kabupaten Solok, Sumatera Barat", "Solok Regency, West Sumatra"),
    profil: [
      { label: T("Penolakan tercatat sejak", "Rejection recorded since"), nilai: "2016-2017" },
      { label: T("Sosialisasi terakhir yang diprotes", "Latest protested briefing"), nilai: "13 November 2025" },
      { label: T("Status terakhir", "Latest status"), nilai: T("belum dibatalkan; warga meminta izin dicabut (Mongabay, 1 Desember 2025)", "not cancelled; residents ask for the permit to be revoked (Mongabay, 1 December 2025)") },
    ],
    sebab: [
      T("Warga khawatir pencemaran air, hilangnya tanah dan lahan pertanian, risiko gas beracun, dan menyebut pengalaman di Sorik Marapi, Mataloko, serta Muara Laboh; sebagian menganggap gunung keramat.", "Residents fear water pollution, loss of land and farmland and toxic gas risk, citing experience at Sorik Marapi, Mataloko and Muara Laboh; some regard the mountain as sacred."),
      T("Warga menilai sosialisasi tidak transparan (hanya sisi positif) dan menunjuk materi paparan yang keliru; LBH Padang mengingatkan prinsip persetujuan bebas, didahulukan, dan diinformasikan (FPIC).", "Residents judged the briefing non-transparent (positives only) and pointed to an erroneous presentation slide; LBH Padang reminded of the free, prior and informed consent (FPIC) principle."),
    ],
    terdampak: T("Warga nagari di sekitar lokasi, termasuk petani; Mongabay dan lembaga masyarakat sipil menyorot peran perempuan penolak.", "Residents of nearby villages including farmers; Mongabay and civil society highlight the role of women opponents."),
    seharusnya: H("persetujuan warga didahulukan sebelum izin dan lelang diteruskan, materi sosialisasi diverifikasi bersama warga, dan kunjungan ke PLTP yang berjalan dibuka.", "resident consent should come before the permit and tender proceed, briefing material should be verified with residents, and visits to operating plants opened."),
    tanda_bahaya: [
      T("Protes sosialisasi dan pembakaran kendaraan perusahaan oleh oknum pada 2017 (menurut Mongabay).", "Protest at the briefing and burning of company vehicles by individuals in 2017 (per Mongabay)."),
      T("Pemerintah daerah menilai penolakan berasal dari sosialisasi yang minim, warga menilai informasi sudah berat sebelah: dua tafsir yang tidak dipertemukan.", "The provincial government attributes opposition to limited outreach, residents see the information as one-sided: two readings that were never reconciled."),
    ],
    kronologi: [
      { tanggal: "2017-09-15", teks: T("Ratusan warga berunjuk rasa ke kantor Bupati Solok (pertengahan September 2017, tanggal tepat tidak dirinci).", "Hundreds of residents rally at the Solok Regent's office (mid September 2017, exact date not given).") },
      { tanggal: "2018-11-30", teks: T("Mantan Menteri ESDM Arcandra Tahar menyayangkan penolakan dan menilai PLTP dapat menaikkan PAD (Republika).", "Former ESDM minister Arcandra Tahar regrets the opposition and says a plant could raise local revenue (Republika).") },
      { tanggal: "2025-11-13", teks: T("Sosialisasi di Nagari Batu Bajanjang diwarnai protes.", "Briefing in Nagari Batu Bajanjang met with protest.") },
    ],
    faktor: { sosial: true, perizinan: true },
    sumber: ["talang17", "talang18", "talang25", "talang26"],
    catatan: T("Tanggapan: perusahaan tidak menanggapi Mongabay hingga artikel 1 Desember 2025 terbit; Pemprov Sumbar pada Maret 2026 menyatakan tetap melanjutkan percepatan proyek (Mongabay, 17 Maret 2026). Nama pemegang izin tidak dimuat di artikel 2025.", "Response: the company did not respond to Mongabay by the 1 December 2025 article; the West Sumatra government said in March 2026 it still pursues the acceleration (Mongabay, 17 March 2026). The permit holder is not named in the 2025 article."),
    hak_jawab: true,
  },
  {
    id: "ungaran", nama: "PLTP Gunung Ungaran: tahap kajian dan penolakan", jenis: "mundur", negara: "ID", lokasi: T("Jawa Tengah", "Central Java"),
    profil: [
      { label: T("Potensi", "Potential"), nilai: 55, satuan: "MW" },
      { label: T("Pengembang", "Developer"), nilai: T("PLN", "PLN") },
      { label: T("Status per September 2026", "Status as of September 2026"), nilai: T("masih tahap kajian menurut PLN", "still at study stage per PLN") },
    ],
    sebab: [
      T("PLN menyatakan proyek masih tahap kajian (Antara, 6 September 2026) walau ESDM sudah mengizinkan PLN mengembangkan (Koran Jakarta, 25 Agustus 2026); Mongabay melaporkan penolakan warga sementara proyek terus berjalan.", "PLN says the project is still at study stage (Antara, 6 September 2026) even though ESDM allowed PLN to develop it (Koran Jakarta, 25 August 2026); Mongabay reports resident opposition while the project continues."),
    ],
    terdampak: T("Warga sekitar Gunung Ungaran; isi keberatan warga perlu dibaca pada laporan Mongabay yang ditautkan (METI baru membaca judul dan ringkasan).", "Residents around Mount Ungaran; the substance of objections should be read in the linked Mongabay report (METI has read only the headline and summary)."),
    seharusnya: H("status kajian dan izin diumumkan sejajar dengan sosialisasi supaya warga tidak membaca proyek sudah berjalan sementara pengembang menyebutnya kajian.", "study and permit status should be announced in step with outreach so residents do not read the project as proceeding while the developer calls it a study."),
    tanda_bahaya: [T("Dua pernyataan status yang berbeda dari pihak berbeda dalam sebulan.", "Two different status statements from different parties within a month.")],
    kronologi: [
      { tanggal: "2026-08-25", teks: T("Kementerian ESDM mengizinkan PLN mengembangkan panas bumi Gunung Ungaran (Koran Jakarta).", "The Ministry of ESDM allows PLN to develop Mount Ungaran geothermal (Koran Jakarta).") },
      { tanggal: "2026-09-06", teks: T("PLN menyebut masih tahap kajian (Antara).", "PLN says it is still at study stage (Antara).") },
    ],
    faktor: { sosial: true, perizinan: true },
    sumber: ["ungaran1", "ungaran2", "ungaran3"],
    catatan: T("Kasus ini masih berjalan; label \"tertunda\" bukan penilaian gagal. Tanggapan PLN dan warga dapat dikirim lewat formulir koreksi.", "This case is ongoing; the \"delayed\" label is not a failure judgement. PLN and resident responses can be sent via the correction form."),
    hak_jawab: true,
  },
  {
    id: "puna", nama: "Puna Geothermal Venture, Hawaii", jenis: "gagal", negara: "US", lokasi: T("Pulau Hawaii, AS", "Hawaii Island, USA"),
    profil: [
      { label: T("Kapasitas sebelum erupsi", "Capacity before eruption"), nilai: 38, satuan: "MW" },
      { label: T("Berhenti sejak", "Offline since"), nilai: "Mei 2018" },
      { label: T("Kembali beroperasi (terbatas)", "Back online (reduced)"), nilai: "November 2020" },
    ],
    sebab: [
      T("Erupsi Kilauea Mei 2018: lava menimpa gardu, gudang, dan sedikitnya tiga sumur serta memutus akses jalan; pembangkit dihentikan.", "Kilauea eruption May 2018: lava covered a substation, a warehouse and at least three wells and cut road access; the plant was shut."),
      T("Pembukaan kembali mundur dari target semula; menurut Ormat penyebabnya izin bangunan yang tertunda dan COVID-19, selain masalah peralatan saat mencoba menyala kembali.", "The restart slipped from the original target; per Ormat due to delayed building permits and COVID-19, besides equipment problems on restart attempts."),
    ],
    terdampak: T("Jaringan listrik Pulau Hawaii: pembangkit ini sekitar 15% kapasitas pasti pulau sebelum erupsi.", "The Hawaii Island grid: the plant was about 15% of firm generation capacity before the eruption."),
    seharusnya: H("risiko geologi lokasi (sesar, aliran lava) dinilai dalam pemilihan lokasi sumur dan gardu, dengan rencana pemulihan dan asuransi; bagi Indonesia relevan untuk lokasi dekat gunung api aktif.", "site geology risk (faults, lava flow) should be assessed in siting wells and substations, with a recovery plan and insurance; relevant to Indonesian sites near active volcanoes."),
    tanda_bahaya: [T("Pembangkit berada di zona rift gunung api aktif.", "A plant sited in the rift zone of an active volcano.")],
    kronologi: [
      { tanggal: "2018-05-01", teks: T("Erupsi Puna bawah; pembangkit dihentikan (bulan saja).", "Lower Puna eruption; the plant is shut (month only).") },
      { tanggal: "2020-11-01", teks: T("Beroperasi kembali dengan kapasitas terbatas, 2,5 tahun kemudian (bulan saja).", "Back online at reduced output about 2.5 years later (month only).") },
    ],
    faktor: { risiko_eksplorasi: true, teknologi: true, keselamatan: true },
    sumber: ["puna_hei", "puna_ap", "puna_tge"],
    catatan: T("Tanggapan pengembang: Ormat memaparkan alasan penundaan (izin dan COVID-19) lewat siaran pers; lihat sumber.", "Developer response: Ormat gave the reasons for delay (permits and COVID-19) in press statements; see sources."),
    hak_jawab: true,
  },
];

/* ---------------- bab ---------------- */
function bangun() {
  const { tren, wkp, wkpSumber, keu, proyek, dasar } = irisan();
  const akhir = tren[tren.length - 1], thn2024 = tren.find((t) => t.tahun === 2024), thn2015 = tren.find((t) => t.tahun === 2015);
  const cf2024 = thn2024.pembangkitan_gwh / (thn2024.kapasitas_mw * 8.76); // GWh / (MW x 8,76 ribu jam) = faktor kapasitas
  const tambah10 = akhir.kapasitas_mw - thn2015.kapasitas_mw;
  const f1 = (x) => Math.round(x * 10) / 10;

  const tarif = keu.map((b) => ({ varian: b.teknologi === "PLTP" ? T("Listrik (PLTP)", "Electricity (PLTP)") : T("Uap setara listrik", "Steam, electricity equivalent"), kap: b.kapasitas, d1: b.thn_1_10_dasar, d11: b.thn_11_dst }));
  const t50 = keu.find((b) => b.teknologi === "PLTP" && b.kapasitas === ">50-100 MW");
  const mwContoh = 55, gwhContoh = mwContoh * cf2024 * 8.76, usdContoh = gwhContoh * 1e6 * (t50.thn_1_10_dasar / 100) / 1e6; // juta USD, F = 1
  const wk = wkp.baris.map((b) => ({
    nama: b.nama, jenis: b.jenis, provinsi: b.provinsi, pemegang: b.pemegang || "-", status: b.status_asli, rencana_mw: b.rencana_mw, bukti: b.tingkat_bukti,
    url_sumber: (wkpSumber[b.sumber_ids?.[0]] || {}).url || "",
  }));
  const prTop = proyek.filter((p) => Number.isFinite(mw(p)) && mw(p) > 0).sort((a, z) => mw(z) - mw(a)).slice(0, 20)
    .map((p) => ({ nama: nama(p.nama), provinsi: p.lokasi?.provinsi || "-", mw: mw(p), status: st(p) || "-", bukti: p.tingkat_bukti || "-" }));
  const pemain = dasar.pemain.map((o) => ({ nama: o.nama, kategori: o.kategori || "-", peran: (o.peran || []).join(", ") || "-", proyek: o.proyek }));
  const reg = dasar.regulasi.map((r) => ({ judul: r.judul, aturan: `${r.jenis.toUpperCase()} ${r.nomor}/${r.tahun}`.replace(/^PERMEN/, "Permen").replace(/^PERPRES/, "Perpres").replace(/^KEPPRES/, "Keppres"), tanggal: r.tanggal || "", status: r.status, url: r.url }));

  const bab = {
    2: { tipe: "faq", butir: [
      { t: T("Apa itu panas bumi (PLTP)?", "What is geothermal (PLTP)?"), j: T("Energi panas dari dalam bumi. Uap atau air panas dari sumur dipakai memutar turbin (PLTP) atau dipakai langsung sebagai panas.", "Heat from within the earth. Steam or hot water from wells turns a turbine (PLTP) or is used directly as heat.") },
      { t: T("Mengapa panas bumi dianggap penting untuk Indonesia?", "Why is geothermal important for Indonesia?"), j: T("Indonesia berada di cincin gunung api sehingga banyak lapangan; panas bumi bisa jadi beban dasar yang stabil, tidak bergantung cuaca. Faktor kapasitas nasional rata-rata 2024 sekitar 72% (hitungan METI dari data IRENA).", "Indonesia sits on the ring of fire so many fields exist; geothermal can be stable baseload independent of weather. The 2024 national average capacity factor is about 72% (METI calculation from IRENA data).") },
      { t: T("Siapa yang boleh mengusahakan panas bumi?", "Who may develop geothermal?"), j: T("Badan usaha, koperasi, atau BUMN yang memegang izin panas bumi setelah menang lelang wilayah kerja atau mendapat penugasan, menurut UU 21/2014.", "Companies, cooperatives or state companies holding a geothermal permit after winning a working area auction or being assigned, per Law 21/2014.") },
      { t: T("Berapa harga jual listrik panas bumi ke PLN?", "What price does PLN pay for geothermal power?"), j: T("Perpres 112/2022 menetapkan harga patokan tertinggi, misalnya 9,76 sen US$/kWh untuk PLTP sampai 10 MW pada tahun 1-10 sebelum dikali faktor lokasi F. Lihat tabel di bab 11.", "Perpres 112/2022 sets ceiling prices, for example 9.76 US cents/kWh for PLTP up to 10 MW in years 1-10 before the location factor F. See the table in chapter 11.") },
      { t: T("Mengapa eksplorasi disebut berisiko?", "Why is exploration called risky?"), j: T("Biaya sumur besar dan hasilnya baru diketahui setelah dibor. ESMAP mencatat tingkat sukses sumur eksplorasi sekitar 59%; riset lain menyebut 63-73% untuk Indonesia (definisi sukses berbeda antar studi).", "Wells are costly and results are known only after drilling. ESMAP notes an exploration well success rate of about 59%; other research cites 63-73% for Indonesia (success definitions differ between studies).") },
      { t: T("Apa itu pengeboran pemerintah (government drilling)?", "What is government drilling?"), j: T("Pemerintah membiayai pengeboran eksplorasi di wilayah tertentu lewat dana PISP yang dikelola PT SMI, lalu data hasilnya ditawarkan kepada peserta lelang; bila tak ada pemenang, Kemenkeu memulihkan biaya.", "The government funds exploration drilling in certain areas through the PISP fund managed by PT SMI, then offers the data to auction bidders; if no winner emerges the Ministry of Finance recovers the cost.") },
      { t: T("Apakah PLTP aman bagi warga?", "Is a PLTP safe for residents?"), j: T("Risiko utama ialah gas H2S saat uji alir dan pengeboran. Insiden Sorik Marapi 2021 dan Dieng 2022 menunjukkan perlunya zona aman dan peringatan dini. Lihat bab 40.", "The main risk is H2S gas during discharge testing and drilling. The 2021 Sorik Marapi and 2022 Dieng incidents show the need for buffer zones and early warning. See chapter 40.") },
      { t: T("Apa bedanya penjualan uap dan penjualan listrik?", "What is the difference between selling steam and selling electricity?"), j: T("Pengembang hulu menjual uap ke pembangkit (PLN atau lain) pada harga uap; pengembang terpadu menjual listrik. Perpres 112/2022 memuat tarif keduanya.", "An upstream developer sells steam to a power plant (PLN or other) at a steam price; an integrated developer sells electricity. Perpres 112/2022 has tariffs for both.") },
      { t: T("Bisakah panas bumi dipakai tanpa listrik?", "Can geothermal be used without electricity?"), j: T("Bisa, sebagai pemanfaatan langsung: pengering hasil tani, pemanas proses, pariwisata. Islandia memenuhi hampir seluruh keluaran pemanas dari panas bumi (OECD).", "Yes, as direct use: crop drying, process heat, tourism. Iceland meets almost all heating output from geothermal (OECD).") },
      { t: T("Mengapa banyak proyek tertunda?", "Why are many projects delayed?"), j: T("Penyebab yang berulang dalam kasus bab 39 dan 40: tarif dan PPA, kawasan hutan, pendanaan eksplorasi, dan penerimaan warga. Tabel pola ada di bab 41.", "Recurring causes in chapters 39 and 40: tariff and PPA, forest area, exploration funding and resident acceptance. The pattern table is in chapter 41.") },
    ], sumber: ["uu21", "perpres112", "esmap", "stanford", "smi", "iceland_oecd", "irena"] },
    3: { tipe: "glosarium", butir: [
      { istilah: T("WKP (Wilayah Kerja Panas Bumi)", "WKP (geothermal working area)"), arti: T("Wilayah yang ditetapkan pemerintah untuk diusahakan panas bumi lewat lelang atau penugasan.", "An area designated by the government for geothermal development through auction or assignment.") },
      { istilah: T("PSPE (Penugasan Survei Pendahuluan dan Eksplorasi)", "PSPE (preliminary survey and exploration assignment)"), arti: T("Penugasan survei dan eksplorasi di area yang belum menjadi WKP.", "Assignment for survey and exploration in an area that is not yet a WKP.") },
      { istilah: T("IPB (Izin Panas Bumi)", "IPB (geothermal permit)"), arti: T("Izin yang diberikan kepada pemenang lelang WKP menurut UU 21/2014.", "The permit given to the WKP auction winner under Law 21/2014.") },
      { istilah: T("PPA (perjanjian jual beli listrik)", "PPA (power purchase agreement)"), arti: T("Kontrak penjualan listrik atau uap, umumnya ke PLN.", "A contract for selling electricity or steam, generally to PLN.") },
      { istilah: T("PISP", "PISP"), arti: T("Dana pembiayaan infrastruktur panas bumi (Geothermal Fund) yang dikelola PT SMI.", "Geothermal infrastructure financing fund (Geothermal Fund) managed by PT SMI.") },
      { istilah: T("Government drilling", "Government drilling"), arti: T("Pengeboran eksplorasi yang dibiayai pemerintah untuk mengurangi risiko pengembang.", "Exploration drilling funded by government to reduce developer risk.") },
      { istilah: T("JOC (kontrak operasi bersama)", "JOC (joint operation contract)"), arti: T("Skema kemitraan lapangan lama dengan PGE, misalnya Wayang Windu, Darajat, dan Salak.", "Partnership scheme of older fields with PGE, for example Wayang Windu, Darajat and Salak.") },
      { istilah: T("H2S", "H2S"), arti: T("Hidrogen sulfida, gas beracun yang dapat keluar dari sumur panas bumi.", "Hydrogen sulfide, a toxic gas that can escape from geothermal wells.") },
      { istilah: T("Workover", "Workover"), arti: T("Perbaikan sumur yang sudah ada, bukan pengeboran baru.", "Repair of an existing well rather than a new drilling.") },
      { istilah: T("Faktor F", "F factor"), arti: T("Pengali harga patokan menurut wilayah dalam Lampiran II Perpres 112/2022.", "Regional multiplier of the ceiling price in Annex II of Perpres 112/2022.") },
      { istilah: T("Faktor kapasitas", "Capacity factor"), arti: T("Energi yang dibangkitkan dibagi energi bila beroperasi penuh sepanjang tahun.", "Energy generated divided by energy at full output through the year.") },
      { istilah: T("Pemanfaatan langsung", "Direct use"), arti: T("Memakai panas bumi sebagai panas, tanpa dikonversi menjadi listrik.", "Using geothermal as heat, without converting it to electricity.") },
      { istilah: T("COD", "COD"), arti: T("Tanggal operasi komersial pembangkit.", "Commercial operation date of a plant.") },
      { istilah: T("FPIC", "FPIC"), arti: T("Persetujuan bebas, didahulukan, dan diinformasikan dari masyarakat terdampak.", "Free, prior and informed consent from affected communities.") },
    ], sumber: ["uu21", "pp7", "perpres112", "smi"] },
    4: { tipe: "teks", paragraf: [
      T("Panas bumi memanfaatkan panas dari dalam bumi. Sumur dibor sampai reservoir, uap atau air panas dialirkan ke turbin, lalu uap dikondensasi dan air diinjeksikan kembali ke reservoir. Karena panas bumi bekerja siang malam, ia cocok sebagai beban dasar bagi jaringan yang dipenuhi pembangkit surya dan bayu yang berfluktuasi.", "Geothermal uses heat from within the earth. Wells are drilled to a reservoir, steam or hot water goes to a turbine, then the steam is condensed and the water is injected back into the reservoir. Because geothermal works day and night it suits baseload for grids with more variable solar and wind."),
      T("Kapasitas terpasang Indonesia 2.743,76 MW pada 2025 (IRENA), naik dari 1.438,3 MW pada 2015. Pembangkitan 2024 sebesar 16.763 GWh.", "Indonesia's installed capacity was 2,743.76 MW in 2025 (IRENA), up from 1,438.3 MW in 2015. Generation in 2024 was 16,763 GWh."),
    ], sumber: ["irena"] },
    5: { tipe: "rumus", rumus: [
      T("Energi tahunan (GWh) = kapasitas (MW) x faktor kapasitas x 8,76", "Annual energy (GWh) = capacity (MW) x capacity factor x 8.76"),
      T("Peluang minimal satu sumur berhasil dari n sumur = 1 - (1 - p)^n, dengan p peluang sukses satu sumur", "Probability at least one of n wells succeeds = 1 - (1 - p)^n, with p the success probability of one well"),
      T("Pendapatan tahun 1-10 (US$) = energi (kWh) x harga dasar x F x pengali (Perpres 112/2022)", "Years 1-10 revenue (US$) = energy (kWh) x base price x F x multiplier (Perpres 112/2022)"),
    ], contoh: [
      T(`Faktor kapasitas nasional 2024 = 16.763 GWh / (2.638,76 MW x 8,76) = ${f1(cf2024 * 100)}% (EST METI dari data IRENA).`, `National 2024 capacity factor = 16,763 GWh / (2,638.76 MW x 8.76) = ${f1(cf2024 * 100)}% (METI EST from IRENA data).`),
      T("Bila p = 50% dan 5 sumur dibor, peluang minimal satu berhasil = 1 - 0,5^5 = 96,9% (risiko semua gagal sekitar 3%, selaras dengan analisis yang dikutip ESMAP). Asumsi bahwa sumur saling bebas adalah penyederhanaan.", "If p = 50% and 5 wells are drilled, probability of at least one success = 1 - 0.5^5 = 96.9% (all-fail risk about 3%, in line with the analysis cited by ESMAP). Assuming wells are independent is a simplification."),
    ], sumber: ["irena", "esmap", "perpres112"] },
    6: { tipe: "langkah", butir: [
      { judul: T("Survei pendahuluan dan penetapan WKP", "Preliminary survey and WKP designation"), isi: T("Pemerintah atau badan usaha yang ditugaskan memetakan potensi; wilayah ditetapkan sebagai WKP.", "The government or an assigned company maps the potential; the area is designated a WKP."), pelaku: T("Kementerian ESDM, Badan Geologi", "Ministry of ESDM, Geological Agency") },
      { judul: T("Lelang atau penugasan", "Auction or assignment"), isi: T("WKP dilelang kepada badan usaha, atau ditugaskan ke BUMN; pemenang memperoleh izin panas bumi.", "The WKP is auctioned to companies or assigned to a state company; the winner gets the geothermal permit."), pelaku: T("Kementerian ESDM, peserta lelang", "Ministry of ESDM, bidders") },
      { judul: T("Eksplorasi dan pengeboran", "Exploration and drilling"), isi: T("Survei rinci dan sumur eksplorasi untuk memastikan reservoir; tahap berisiko tinggi.", "Detailed surveys and exploration wells to confirm the reservoir; a high risk stage."), pelaku: T("Pengembang, kontraktor bor", "Developer, drilling contractors") },
      { judul: T("Studi kelayakan dan PPA", "Feasibility and PPA"), isi: T("Hitung biaya, negosiasi harga dengan PLN, tutup keuangan.", "Cost calculation, price negotiation with PLN, financial close."), pelaku: T("Pengembang, PLN, pendana", "Developer, PLN, lenders") },
      { judul: T("Pengembangan lapangan dan pembangkit", "Field and plant development"), isi: T("Sumur produksi dan injeksi, pipa uap, turbin, dan sambungan jaringan.", "Production and injection wells, steam pipes, turbine and grid connection."), pelaku: T("Pengembang, kontraktor EPC, pemasok turbin", "Developer, EPC contractors, turbine suppliers") },
      { judul: T("Operasi dan pemeliharaan", "Operation and maintenance"), isi: T("Pengelolaan reservoir, pengeboran isi ulang (make-up wells), dan pemantauan lingkungan.", "Reservoir management, make-up wells and environmental monitoring."), pelaku: T("Operator", "Operator") },
    ], sumber: ["uu21", "pp7"] },
    7: { tipe: "grafik", jenis: "garis", label: T("Kapasitas terpasang panas bumi Indonesia", "Installed geothermal capacity, Indonesia"), satuan: "MW", d: 0,
      seri: [{ nama: T("Kapasitas terpasang (IRENA)", "Installed capacity (IRENA)"), sorot: true, titik: tren.map((t) => [String(t.tahun), t.kapasitas_mw]) }],
      catatan: T(`Tambahan 2015 sampai 2025 sebesar ${f1(tambah10)} MW (EST METI dari selisih dua tahun IRENA).`, `Additions from 2015 to 2025 of ${f1(tambah10)} MW (METI EST, difference of two IRENA years).`), sumber: ["irena"] },
    8: { tipe: "tabel", per: 10, judul: T("Peta WKP dan status lelang (kurasi METI)", "WKP map and auction status (METI curation)"),
      kolom: [
        { k: "nama", l: T("Wilayah", "Area") }, { k: "jenis", l: T("Jenis", "Type") }, { k: "provinsi", l: T("Provinsi", "Province") }, { k: "pemegang", l: T("Pemegang", "Holder") },
        { k: "status", l: T("Status (menurut sumber)", "Status (per source)") }, { k: "rencana_mw", l: T("Rencana (MW)", "Plan (MW)"), num: true, d: 0 }, { k: "bukti", l: T("Bukti", "Evidence") },
        { k: "url_sumber", l: T("Sumber", "Source"), url: "url_sumber" },
      ], baris: wk,
      catatan: T("Daftar kurasi 19 WKP/PSPE dengan bukti publik, bukan seluruh WKP nasional. Koordinat tidak dipanen karena robots.txt Geoportal ESDM melarang robot; hasil lelang 2025 (pemenang) belum ditemukan; semua status berdasar berita (bukti media), bukan Kepmen.", "A curated list of 19 WKP/PSPE with public evidence, not all national WKP. Coordinates are not harvested because the ESDM Geoportal robots.txt disallows robots; 2025 auction results (winners) were not found; all statuses are based on news (media evidence), not ministerial decrees."),
      sumber: ["wkp", "lelang", "lelang2", "geoportal"] },
    9: { tipe: "tabel", per: 12, judul: T("Pemain panas bumi di basis METI", "Geothermal players in the METI base"),
      kolom: [{ k: "nama", l: T("Organisasi", "Organisation") }, { k: "kategori", l: T("Kategori", "Category") }, { k: "peran", l: T("Peran rantai", "Chain role") }, { k: "proyek", l: T("Proyek tercatat", "Recorded projects"), num: true, d: 0 }], baris: pemain,
      catatan: T("Pemain utama menurut berita dan sumber di bab ini: PGE (1.932 MW termasuk mitra JOC dalam rilis terbaru PGE yang terbaca; 727 MW dikelola sendiri), PLN dan PLN Indonesia Power, Geo Dipa, Star Energy, Supreme Energy, Medco, Barito Renewables, Sorik Marapi Geothermal Power.", "Main players per news and sources in this chapter: PGE (1,932 MW including JOC partners per the latest PGE release read; 727 MW self-operated), PLN and PLN Indonesia Power, Geo Dipa, Star Energy, Supreme Energy, Medco, Barito Renewables, Sorik Marapi Geothermal Power."),
      sumber: ["pge_q3", "pge_q1", "proyek", "bren", "medco"] },
    10: { tipe: "tabel", per: 10, judul: T("Proyek panas bumi terbesar di basis METI", "Largest geothermal projects in the METI base"),
      kolom: [{ k: "nama", l: T("Proyek", "Project") }, { k: "provinsi", l: T("Provinsi", "Province") }, { k: "mw", l: T("MW", "MW"), num: true, d: 0 }, { k: "status", l: T("Status", "Status") }, { k: "bukti", l: T("Bukti", "Evidence") }], baris: prTop,
      catatan: T("Satu lapangan dapat muncul lebih dari sekali (unit atau sumber berbeda). Entri \"FTP2\" dan \"2030\" adalah rencana, bukan operasi.", "One field can appear more than once (different units or sources). Entries marked \"FTP2\" and \"2030\" are plans, not operations."), sumber: ["proyek"] },
    11: { tipe: "tabel", per: 8, judul: T("Harga patokan tertinggi PLTP, Perpres 112/2022 (sen US$/kWh)", "PLTP ceiling prices, Perpres 112/2022 (US cents/kWh)"),
      kolom: [{ k: "varian", l: T("Varian", "Variant") }, { k: "kap", l: T("Kapasitas", "Capacity") }, { k: "d1", l: T("Tahun 1-10 (x F)", "Years 1-10 (x F)"), num: true, d: 2 }, { k: "d11", l: T("Tahun 11-30", "Years 11-30"), num: true, d: 2 }], baris: tarif,
      catatan: T("PLN adalah pembeli utama. Nilai adalah transkripsi METI dari PDF yang dibaca OCR; satu angka uap (3,91) terbaca samar. Tarif dapat diubah lewat Kepmen ESDM; cek ulang sebelum dikutip. Faktor lokasi F ada di Lampiran II.", "PLN is the main buyer. Values are a METI transcription from an OCR-read PDF; one steam figure (3.91) is faint. Tariffs can be changed by ministerial decree; re-check before citing. The location factor F is in Annex II."),
      sumber: ["keuangan", "perpres112"] },
    12: { tipe: "tabel", per: 8, judul: T("Kerangka hukum panas bumi", "Geothermal legal framework"),
      kolom: [{ k: "aturan", l: T("Aturan", "Instrument") }, { k: "judul", l: T("Judul", "Title") }, { k: "tanggal", l: T("Ditetapkan", "Enacted") }, { k: "status", l: T("Status", "Status") }, { k: "url", l: T("Sumber", "Source"), url: "url" }], baris: reg,
      catatan: T("Pasal kunci belum dirangkum di sini; UU 21/2014 menjadi payung, PP 7/2017 mengatur pemanfaatan tidak langsung, dan Perpres 112/2022 mengatur harga. Status mengikuti JDIH BPK per tanggal ambil.", "Key articles are not summarised here; Law 21/2014 is the umbrella, PP 7/2017 governs indirect use and Perpres 112/2022 governs price. Status follows JDIH BPK at harvest date."), sumber: ["uu21", "pp7", "perpres112"] },
    13: { tipe: "linimasa", butir: [
      { tanggal: "1978-01-01", judul: T("Kamojang menghasilkan listrik pertama 0,25 MW (tahun)", "Kamojang produces first electricity, 0.25 MW (year)"), url: "https://www.esdm.go.id/id/media-center/arsip-berita/lapangan-kamojang-pltp-pertama-di-indonesia" },
      { tanggal: "1983-01-01", judul: T("Unit 1 Kamojang 30 MW diresmikan (tahun)", "Kamojang unit 1, 30 MW, officially recognised (year)"), url: "https://pge.pertamina.com/en/own-operation/kamojang" },
      { tanggal: "2014-09-17", judul: T("UU 21/2014 tentang Panas Bumi ditetapkan", "Law 21/2014 on Geothermal enacted"), url: "https://peraturan.bpk.go.id/Details/38684" },
      { tanggal: "2017-02-21", judul: T("PP 7/2017 tentang pemanfaatan tidak langsung", "PP 7/2017 on indirect use"), url: "https://peraturan.bpk.go.id/Details/5827" },
      { tanggal: "2019-12-16", judul: T("Muara Laboh 85 MW beroperasi komersial", "Muara Laboh 85 MW enters commercial operation"), url: "https://www.sumitomocorp.com/en/jp/news/release/2019/group/12770" },
      { tanggal: "2021-01-25", judul: T("Insiden gas H2S Sorik Marapi", "Sorik Marapi H2S gas incident"), url: "https://www.esdm.go.id/en/media-center/news-archives/investigasi-paparan-gas-h2s-kementerian-esdm-hentikan-sementara-aktivitas-pltp-sorik-marapi-" },
      { tanggal: "2021-12-26", judul: T("Rantau Dedap fase 1 beroperasi komersial", "Rantau Dedap phase 1 enters commercial operation"), url: "https://www.supreme-energy.com/id/publication_/pt-supreme-energy-rantau-dedap-starts-commercial-operation-rantau-dedap-geothermal-power-plant-development" },
      { tanggal: "2022-03-12", judul: T("Kebocoran gas pad 28 Dieng", "Dieng pad 28 gas release"), url: "https://kabar24.bisnis.com/read/20220313/15/1509974/ini-penjelasan-geo-dipa-soal-kronologi-keluarnya-gas-beracun-di-dieng" },
      { tanggal: "2022-09-13", judul: T("Perpres 112/2022 ditetapkan", "Perpres 112/2022 enacted"), url: "https://peraturan.bpk.go.id/Details/225308/perpres-no-112-tahun-2022" },
      { tanggal: "2025-09-17", judul: T("Pemerintah mengumumkan lelang 3 WKP dan 7 PSPE", "Government announces auction of 3 WKP and 7 PSPE"), url: "https://www.cnbcindonesia.com/news/20250917184934-4-667921/bahlil-lelang-10-wilayah-panas-bumi-ri-tahun-2025-ini-daftarnya" },
      { tanggal: "2026-03-30", judul: T("Perjanjian pinjaman JICA untuk PLTP Hululais", "JICA loan agreement for PLTP Hululais"), url: "https://www.jica.go.jp/english/information/press/2025/20260330_11.html" },
    ], sumber: ["esdm_kmj", "uu21", "pp7", "laboh_sc", "sorik_esdm", "dedap_se", "dieng_kabar", "perpres112", "lelang2", "jica"] },
    14: { tipe: "teks", paragraf: [
      T("Insentif fiskal yang tercatat untuk panas bumi: PPN dibebaskan atas impor barang yang dipakai kontraktor panas bumi pemanfaatan tidak langsung (PP 49/2022, Pasal 25). Pembebasan bea masuk barang modal pembangkit diatur PMK 66/PMK.010/2015 dengan syarat barang belum diproduksi dalam negeri. Instrumen lama (PMK 177/PMK.011/2007) tercatat tidak berlaku menurut JDIH BPK.", "Fiscal incentives recorded for geothermal: VAT exemption on imports used by indirect-use geothermal contractors (PP 49/2022, Article 25). Import duty exemption for power plant capital goods is governed by PMK 66/PMK.010/2015 on condition the goods are not made domestically. The older instrument (PMK 177/PMK.011/2007) is recorded as no longer in force per JDIH BPK."),
      T("Insentif nonfiskal utama ialah harga patokan tertinggi Perpres 112/2022. Bonus produksi untuk daerah diatur PP 28/2016. Pemakaian produk dalam negeri (TKDN) diatur Permen ESDM 11/2024; ambang per komponen belum dibaca METI.", "The main non-fiscal incentive is the ceiling price in Perpres 112/2022. Production bonuses for regions are governed by PP 28/2016. Domestic content (TKDN) is governed by Permen ESDM 11/2024; thresholds per component have not been read by METI."),
    ], sumber: ["insentif", "pp49", "perpres112"] },
    15: { tipe: "langkah", butir: [
      { judul: T("Pastikan status wilayah", "Confirm area status"), isi: T("Cek apakah wilayah sudah WKP, sedang dilelang, atau masih PSPE; irisan dengan kawasan hutan dan konservasi.", "Check whether the area is a WKP, being auctioned, or still PSPE; overlap with forest and conservation areas."), pelaku: T("Calon pengembang", "Prospective developer") },
      { judul: T("Ikuti lelang dan peroleh izin panas bumi", "Join the auction and obtain the geothermal permit"), isi: T("Ikuti lelang WKP; pemenang menerima izin. Waktu dan biaya bergantung dokumen lelang, bukan angka tunggal.", "Join the WKP auction; the winner receives the permit. Time and cost depend on the tender documents, not a single figure."), pelaku: T("Pengembang, Kementerian ESDM", "Developer, Ministry of ESDM") },
      { judul: T("Izin lingkungan dan kawasan hutan", "Environmental and forest area permits"), isi: T("AMDAL dan izin penggunaan kawasan hutan bila lokasi di dalam kawasan hutan.", "AMDAL and forest area use permit if the site is inside forest area."), pelaku: T("Pengembang, KLH, Kementerian Kehutanan", "Developer, Ministry of Environment, Ministry of Forestry") },
      { judul: T("Eksplorasi, kelayakan, lalu PPA", "Exploration, feasibility, then PPA"), isi: T("Bor sumur eksplorasi, nyatakan cadangan, negosiasi harga dalam batas Perpres 112/2022.", "Drill exploration wells, declare reserves, negotiate price within Perpres 112/2022 limits."), pelaku: T("Pengembang, PLN", "Developer, PLN") },
      { judul: T("Pendanaan dan konstruksi", "Financing and construction"), isi: T("Tutup keuangan, konstruksi, uji, lalu COD.", "Financial close, construction, testing then COD."), pelaku: T("Pengembang, pendana, kontraktor", "Developer, lenders, contractors") },
    ], catatan: T("Alur umum menurut UU 21/2014 dan PP 7/2017; METI belum merinci lama dan biaya tiap izin karena aturan turunan perlu dibaca per kasus. Jangan dipakai sebagai nasihat hukum.", "A general flow per Law 21/2014 and PP 7/2017; METI has not detailed the time and cost of each permit because implementing rules need reading case by case. Not legal advice."), sumber: ["uu21", "pp7", "perpres112"] },
    19: { tipe: "teks", paragraf: [
      T("Biaya rata-rata satu sumur panas bumi sekitar US$5 juta (studi kasus Lemigas 2023); pengeboran dilaporkan memakan 35-40% biaya total proyek (dikutip dari ESMAP). Estimasi lama untuk Indonesia: US$300.000-400.000 per MW (Stanford, 2011).", "The average cost of one geothermal well is about US$5 million (Lemigas 2023 case study); drilling is reported to take 35-40% of total project cost (citing ESMAP). An older estimate for Indonesia: US$300,000-400,000 per MW (Stanford, 2011)."),
      T("Tingkat sukses sumur naik seiring pengalaman: ESMAP mencatat sekitar 59% pada eksplorasi, 74% pada pengembangan, dan 83% pada operasi.", "Well success rises with experience: ESMAP records about 59% in exploration, 74% in development and 83% in operation."),
    ], catatan: T("Angka biaya berasal dari studi yang usianya berbeda dan definisi sukses tidak seragam; periksa laporan asli sebelum dipakai untuk model keuangan.", "Cost figures come from studies of different ages and success definitions are not uniform; check original reports before using them in a financial model."), sumber: ["lemigas", "esmap", "stanford"] },
    20: { tipe: "tabel", per: 8, judul: T("Pembanding negara (kapasitas dan skema)", "Country comparison (capacity and scheme)"),
      kolom: [{ k: "negara", l: T("Negara", "Country") }, { k: "kap", l: T("Kapasitas (MW)", "Capacity (MW)"), num: true, d: 0 }, { k: "tahun", l: T("Tahun data", "Data year") }, { k: "skema", l: T("Skema kunci", "Key scheme") }, { k: "bukti", l: T("Bukti", "Evidence") }],
      baris: [
        { negara: T("Indonesia", "Indonesia"), kap: akhir.kapasitas_mw, tahun: "2025", skema: T("Harga patokan tertinggi (Perpres 112/2022), pengeboran pemerintah lewat PISP", "Ceiling price (Perpres 112/2022), government drilling through PISP"), bukti: "resmi" },
        { negara: T("Turki", "Turkey"), kap: 1691.4, tahun: "2024", skema: T("FiT YEKDEM dalam dolar AS dengan bonus komponen lokal", "YEKDEM FiT in US dollars with local content bonus"), bukti: "media" },
        { negara: T("Filipina", "Philippines"), kap: null, tahun: "-", skema: T("Badan negara membuka lapangan lalu diprivatisasi (EDC 2006)", "A state body opens fields then privatises (EDC 2006)"), bukti: "media" },
        { negara: T("Kenya", "Kenya"), kap: null, tahun: "-", skema: T("GDC milik negara menanggung risiko uap, KenGen dan Ormat membangkitkan", "State-owned GDC carries steam risk, KenGen and Ormat generate"), bukti: "media" },
        { negara: T("Islandia", "Iceland"), kap: null, tahun: "-", skema: T("Pemanfaatan langsung: 97% keluaran pemanas dari panas bumi", "Direct use: 97% of heating output from geothermal"), bukti: "resmi" },
      ],
      catatan: T("Sel kapasitas kosong berarti METI belum punya angka bersumber yang sebanding; sengaja tidak diisi. Tiongkok, India, Jepang, Korea, Uni Eropa, AS, Australia, Brasil, dan Afrika Selatan belum dipanen.", "An empty capacity cell means METI has no comparable sourced figure; deliberately left blank. China, India, Japan, Korea, EU, USA, Australia, Brazil and South Africa have not been harvested."),
      sumber: ["irena", "tr_kapsarc", "ph_edc", "kenya", "iceland_oecd"] },
    21: { tipe: "teks", paragraf: [
      H("tiga negara yang berhasil (Kenya, Filipina, Turki) menempuh tiga jalan berbeda untuk satu masalah yang sama, yakni siapa yang menanggung risiko eksplorasi: negara lewat GDC (Kenya), negara lewat badan nasional lalu privatisasi (Filipina), atau pasar lewat tarif beli terjamin (Turki). Indonesia kini menggabungkan dua: PISP untuk pengeboran pemerintah dan harga patokan tertinggi untuk pembeli.", "the three successful countries (Kenya, Philippines, Turkey) took three different roads to the same problem, namely who bears exploration risk: the state through GDC (Kenya), the state through a national body then privatisation (Philippines), or the market through a guaranteed tariff (Turkey). Indonesia now combines two: PISP for government drilling and a ceiling price for the buyer."),
      T("Negara yang gagal atau tertahan dibahas di bab 40 (kasus Puna, Hawaii). Selandia Baru belum dipanen untuk bab ini.", "Failed or stalled cases are in chapter 40 (the Puna, Hawaii case). New Zealand has not been harvested for this chapter."),
    ], sumber: ["kenya", "tiwi", "tr_kapsarc", "puna_hei"] },
    22: { tipe: "teks", paragraf: [
      T(`Kapasitas terpasang Indonesia ${akhir.kapasitas_mw} MW (IRENA 2025) melampaui Turki 1.691,4 MW (April 2024) dengan catatan beda tahun dan cakupan. Pangsa Indonesia dalam pembangkitan 2024 ialah 16.763 GWh.`, `Indonesia's installed capacity of ${akhir.kapasitas_mw} MW (IRENA 2025) exceeds Turkey's 1,691.4 MW (April 2024), with caveats on year and scope. Indonesia's 2024 generation was 16,763 GWh.`),
      T("Peringkat dunia belum dihitung METI dari satu sumber seragam; satu berita Geo Dipa (CNN Indonesia, 6 November 2026) menyebut cita-cita menjadi negara berkapasitas panas bumi nomor satu dunia.", "METI has not computed a world ranking from one uniform source; one Geo Dipa news item (CNN Indonesia, 6 November 2026) mentions the aspiration to be the world's number one in geothermal capacity."),
    ], sumber: ["irena", "tr_kapsarc", "geodipa"] },
    23: { tipe: "teks", paragraf: [
      T("Kerja sama yang tercatat: pinjaman lunak JICA untuk PLTP Hululais (perjanjian 30 Maret 2026); pembiayaan JBIC dan ADB untuk Sarulla, Muara Laboh, dan Rantau Dedap; Bank Dunia, Clean Technology Fund, dan GEF untuk dana mitigasi risiko eksplorasi (PISP); serta hibah JETP untuk PLTP Patuha unit 2.", "Recorded cooperation: JICA soft loan for PLTP Hululais (agreement 30 March 2026); JBIC and ADB financing for Sarulla, Muara Laboh and Rantau Dedap; the World Bank, Clean Technology Fund and GEF for the exploration risk mitigation fund (PISP); and a JETP grant for PLTP Patuha unit 2."),
    ], sumber: ["jica", "sarulla", "laboh_tge", "dedap_loan", "wbpisp", "tgefund", "jetp"] },
    24: { tipe: "teks", paragraf: [
      T("Geothermal Fund (PISP) adalah dana pembiayaan infrastruktur panas bumi pemerintah yang dikelola PT SMI; menurut PT SMI dana dipakai untuk eksplorasi, eksploitasi, dan pembangkit lewat pinjaman, penyertaan ekuitas, serta penyediaan data. Pengaturannya dalam PMK 80/2022. Laporan pengelolaan 2024 diaudit dan dipublikasikan.", "The Geothermal Fund (PISP) is the government's geothermal infrastructure financing fund managed by PT SMI; per PT SMI it is used for exploration, exploitation and power plants through loans, equity participation and data provision. It is regulated in PMK 80/2022. The 2024 management report is audited and published."),
      T("Skema pengeboran pemerintah: ESDM meminta pengeboran di lokasi tertentu, PT SMI mengontrak pengeboran dan sertifikasi data, lalu data diserahkan ke Kemenkeu; bila tak ada pemenang lelang, Kemenkeu memulihkan biaya. Proyek percontohan: Waesano (NTT) dan Jailolo (Maluku Utara). Satu laporan menyebut US$49 juta dari PISP disandingkan US$49 juta Clean Technology Fund dan hibah GEF US$6,25 juta (2016).", "Government drilling scheme: ESDM requests drilling at a site, PT SMI contracts drilling and data certification, then submits the data to the Ministry of Finance; if no auction winner emerges, the Ministry recovers the cost. Pilot projects: Waesano (NTT) and Jailolo (North Maluku). One report cites US$49 million from PISP matched by US$49 million from the Clean Technology Fund and a US$6.25 million GEF grant (2016)."),
      T("Skema lain di basis METI: pinjaman ODA JICA, SDG Indonesia One, Green Sukuk, dan pinjaman luar negeri lewat Green Book Bappenas.", "Other schemes in the METI base: JICA ODA loans, SDG Indonesia One, Green Sukuk, and foreign loans via the Bappenas Green Book."),
    ], catatan: T("Angka PISP berasal dari 2016-2017; besaran dan alokasi terkini perlu dicek di laporan PT SMI dan PMK 80/2022.", "PISP figures date from 2016-2017; current size and allocation should be checked in PT SMI reports and PMK 80/2022."), sumber: ["smi", "pmk80", "wbpisp", "tgefund", "waesano", "sdgone", "jica"] },
    25: { tipe: "rumus", rumus: [
      T("Pendapatan tahun 1-10 = kapasitas x faktor kapasitas x 8,76 x harga dasar x F", "Years 1-10 revenue = capacity x capacity factor x 8.76 x base price x F"),
    ], contoh: [
      T(`Contoh ilustrasi (EST): PLTP ${mwContoh} MW, faktor kapasitas ${f1(cf2024 * 100)}% (rata-rata nasional 2024), energi ${f1(gwhContoh)} GWh per tahun. Dengan harga dasar ${t50.thn_1_10_dasar} sen US$/kWh (kelas >50-100 MW) dan F = 1 (asumsi), pendapatan ${f1(usdContoh)} juta US$ per tahun. Harga patokan adalah batas atas; harga akhir hasil negosiasi dapat lebih rendah, dan F aktual menurut wilayah.`, `Illustrative example (EST): ${mwContoh} MW PLTP, capacity factor ${f1(cf2024 * 100)}% (2024 national average), energy ${f1(gwhContoh)} GWh a year. With a base price of ${t50.thn_1_10_dasar} US cents/kWh (the >50-100 MW class) and F = 1 (assumed), revenue is US$${f1(usdContoh)} million a year. The ceiling price is an upper bound; the negotiated price can be lower and the actual F depends on region.`),
      T("Tambahan pendapatan kredit karbon: proyek Ulubelu 3-4 (Gold Standard GS2297) telah menerbitkan 1.726.532 tCO2e kredit (registri); nilai uang tidak dilaporkan registri.", "Carbon credit revenue: the Ulubelu 3-4 project (Gold Standard GS2297) has issued 1,726,532 tCO2e of credits (registry); monetary value is not reported by the registry."),
    ], sumber: ["perpres112", "keuangan", "irena"] },
    26: { tipe: "teks", paragraf: [
      T("Investasi dan transaksi yang tercatat: lelang 2025 untuk 3 WKP dan 7 PSPE dengan nilai investasi sekitar US$1,99 miliar (Kontan); Barito Renewables (BREN) menambah kapasitas panas bumi 41 MW (Bisnis.com, 16 Januari 2025); PLTP Ijen 35 MW (Medco) beroperasi komersial Februari 2025; JBIC menandatangani pinjaman ekspansi Muara Laboh Januari 2025; PGE membukukan pendapatan US$318,86 juta sampai kuartal III 2025.", "Recorded investment and transactions: the 2025 auction of 3 WKP and 7 PSPE with investment of about US$1.99 billion (Kontan); Barito Renewables (BREN) added 41 MW of geothermal (Bisnis.com, 16 January 2025); the 35 MW Ijen PLTP (Medco) entered commercial operation in February 2025; JBIC signed the Muara Laboh expansion loan in January 2025; PGE booked revenue of US$318.86 million through Q3 2025."),
    ], catatan: T("Sebagian angka perusahaan berstatus media dan perlu diverifikasi dengan keterbukaan IDX.", "Some company figures are media-sourced and should be verified against IDX disclosures."), sumber: ["lelang", "bren", "medco", "laboh_jbic", "pge_q3"] },
    27: { tipe: "teks", paragraf: [
      T("Risiko lingkungan dan sosial yang tercatat dalam kasus: gas H2S (Sorik Marapi 2021, Dieng 2022), kekhawatiran air dan lahan pertanian (Gunung Talang), serta risiko geologi (Puna). Warga berhak atas informasi yang utuh dan persetujuan bebas, didahulukan, dan diinformasikan (FPIC) sebagaimana diingatkan LBH Padang.", "Environmental and social risks recorded in the cases: H2S gas (Sorik Marapi 2021, Dieng 2022), water and farmland concerns (Gunung Talang), and geological risk (Puna). Residents have the right to complete information and free, prior and informed consent (FPIC) as LBH Padang reminded."),
      T("Dari sisi pengembang, Patuha unit 2 mencatat satu juta jam kerja selamat sebelum beroperasi (JPNN, Agustus 2026), contoh praktik keselamatan kerja yang dapat ditiru.", "On the developer side, Patuha unit 2 logged one million safe working hours before operating (JPNN, August 2026), an example of work safety practice that can be copied."),
    ], sumber: ["sorik_esdm", "dieng_kabar", "talang25", "puna_hei", "patuha"] },
    28: { tipe: "teks", paragraf: [
      T("Pengembangan Mataloko oleh PLN UIP Nusra disebut mendorong penyerapan tenaga kerja lokal (Tribun Kupang, 10 Agustus 2026, konten iklan advertorial). Angka pekerja per MW belum tersedia dalam sumber yang METI baca, sehingga tidak ditampilkan.", "The Mataloko development by PLN UIP Nusra is said to boost local labour absorption (Tribun Kupang, 10 August 2026, advertorial content). Jobs-per-MW figures are not in the sources METI read, so none are shown."),
    ], sumber: ["mataloko"] },
    29: { tipe: "teks", paragraf: [
      T("Sisi pendukung: mantan Menteri ESDM Arcandra Tahar menilai PLTP dapat meningkatkan pendapatan asli daerah dan merupakan pembangkit paling ramah lingkungan (Republika, 30 November 2018).", "Supportive side: former ESDM minister Arcandra Tahar said a PLTP can raise local revenue and is the most environmentally friendly form of generation (Republika, 30 November 2018)."),
      T("Sisi penolak: warga Gunung Talang menyebut pencemaran air, hilangnya lahan, gas beracun, dan status keramat gunung; LBH Padang menilai protes sebagai hak konstitusional (Mongabay, 1 Desember 2025).", "Opposing side: Gunung Talang residents cite water pollution, land loss, toxic gas and the sacred status of the mountain; LBH Padang sees the protest as a constitutional right (Mongabay, 1 December 2025)."),
      H("kedua sisi sering benar pada hal berbeda: manfaat pendapatan daerah nyata, risiko lokal juga nyata. Yang sering hilang ialah forum bersama untuk memeriksa klaim.", "both sides are often right about different things: the local revenue benefit is real and the local risk is real. What is often missing is a shared forum to check claims."),
    ], sumber: ["talang18", "talang25"] },
    30: { tipe: "teks", paragraf: [
      T("Target resmi dari perusahaan: PGE menargetkan kapasitas yang dikelola sendiri 1 GW pada 2028 dan 1,8 GW pada 2034 (siaran pers PGE). Proyeksi nasional per tahun 2030, 2045, dan 2060 dari RUEN dan RUPTL 2025-2034 belum diekstrak METI ke bab ini.", "Official company targets: PGE targets self-operated capacity of 1 GW by 2028 and 1.8 GW by 2034 (PGE press release). National projections for 2030, 2045 and 2060 from RUEN and RUPTL 2025-2034 have not yet been extracted by METI into this chapter."),
    ], sumber: ["pge_1gw", "ruptl"] },
    31: { tipe: "teks", paragraf: [
      H("Pengembang: peluang terbesar ada di WKP lelang 2025 dan ekspansi lapangan yang sudah berproduksi (Muara Laboh, Wayang Windu unit 3), tantangan utamanya risiko eksplorasi dan penerimaan warga.", "Developers: the biggest opportunities are in the 2025 auction WKP and expansion of producing fields (Muara Laboh, Wayang Windu unit 3); the main challenges are exploration risk and resident acceptance."),
      H("Pemasok dan kontraktor: bor, turbin, dan pekerjaan sipil; kandungan dalam negeri (TKDN) dan keselamatan H2S menjadi pembeda.", "Suppliers and contractors: drilling, turbines and civil works; local content (TKDN) and H2S safety are the differentiators."),
      H("Investor dan pendana: struktur Sarulla dan Rantau Dedap menunjukkan pola pembiayaan; PISP dan dana multilateral menurunkan risiko hulu.", "Investors and lenders: the Sarulla and Rantau Dedap structures show financing patterns; PISP and multilateral funds lower upstream risk."),
      H("Pemda: bonus produksi (PP 28/2016) dan pendapatan daerah; bayarannya adalah komunikasi yang jujur kepada warga.", "Local governments: production bonuses (PP 28/2016) and local revenue; the price is honest communication to residents."),
      H("Akademisi: data reservoir, pemantauan kegempaan dan gas, serta pemanfaatan langsung.", "Academics: reservoir data, seismicity and gas monitoring, and direct use."),
    ], sumber: ["lelang", "wayang2", "sarulla", "dedap_loan", "smi"] },
    32: { tipe: "teks", paragraf: [
      T("Yang perlu dipantau: hasil lelang 3 WKP dan 7 PSPE 2025 (pemenang belum ditemukan METI); pembaruan harga patokan Perpres 112/2022 lewat Kepmen ESDM; pembukaan kembali sumur dan hasil proses hukum Sorik Marapi; keputusan Gunung Talang dan Ungaran; penyelesaian pinjaman JICA untuk Hululais; dan realisasi target PGE 1 GW pada 2028.", "To watch: results of the 2025 auction of 3 WKP and 7 PSPE (winners not found by METI); updates to the Perpres 112/2022 ceiling prices via ministerial decree; the outcome of legal processes at Sorik Marapi; decisions on Gunung Talang and Ungaran; the JICA loan for Hululais; and delivery of the PGE 1 GW target by 2028."),
    ], sumber: ["lelang2", "perpres112", "sorik_esdm", "talang26", "ungaran3", "jica", "pge_1gw"] },
    38: { tipe: "teks", paragraf: [
      T("Sumber: IRENASTAT (kapasitas dan pembangkitan), JDIH BPK (aturan), berkas METI (proyek, WKP, tarif, insentif), rilis PGE dan Sumitomo/Supreme Energy, ESDM, Bank Dunia/ESMAP, serta media kredibel (Bisnis.com, Kontan, Antara, Mongabay, ThinkGeoEnergy, Jakarta Post, detik). Panen sopan: UA METI-Network-research/0.1, hormati robots, jeda minimal 2 detik, berhenti pada 403/429, tanpa login atau media sosial.", "Sources: IRENASTAT (capacity and generation), JDIH BPK (rules), METI files (projects, WKP, tariffs, incentives), PGE and Sumitomo/Supreme Energy releases, ESDM, World Bank/ESMAP, and credible media (Bisnis.com, Kontan, Antara, Mongabay, ThinkGeoEnergy, Jakarta Post, detik). Polite harvesting: UA METI-Network-research/0.1, robots respected, at least 2 s delay, stop on 403/429, no login or social media."),
      T("Batas data: pencarian web dibaca lewat ringkasan; beberapa halaman media hanya terbaca judul. Tingkat bukti: resmi, kajian, media, via-pihak-ketiga, editorial. Sintesis METI diberi label \"Analisis METI (Hipotesis)\". Angka turunan diberi label EST.", "Data limits: web searches were read through summaries; some media pages were read by headline only. Evidence levels: official, study, media, third-party, editorial. METI synthesis is labelled \"METI analysis (Hypothesis)\". Derived figures are labelled EST."),
    ], sumber: ["irena", "wkp", "geoportal"] },
    39: { tipe: "kasus", butir: kasusBerhasil },
    40: { tipe: "kasus", butir: kasusGagal, catatan: HJ },
    41: { tipe: "pola", faktor: [
      { k: "risiko_eksplorasi", l: T("Risiko eksplorasi ditanggung pihak berkapasitas (negara, BUMN, atau dana)", "Exploration risk carried by a capable party (state, state company or fund)") },
      { k: "ppa_tarif", l: T("PPA dan tarif dapat dibiayai bank", "PPA and tariff bankable") },
      { k: "pendanaan", l: T("Pendanaan jangka panjang bunga rendah", "Long-term low-interest funding") },
      { k: "teknologi", l: T("Teknologi dan data lapangan matang", "Mature technology and field data") },
      { k: "perizinan", l: T("Perizinan dan kawasan hutan", "Permits and forest area") },
      { k: "sosial", l: T("Penerimaan warga", "Resident acceptance") },
      { k: "keselamatan", l: T("Keselamatan H2S dan prosedur", "H2S safety and procedures") },
    ], catatan: H("faktor keselamatan dan sosial muncul pada kasus gagal, sedangkan faktor risiko eksplorasi dan pendanaan muncul pada kasus berhasil. Ini pola dari sampel kecil (13 kasus), bukan bukti sebab-akibat.", "safety and social factors appear in the failed cases, while exploration risk and funding factors appear in the successful ones. This is a pattern from a small sample (13 cases), not evidence of causation.") },
  };

  const peran = [
    { k: "pengembang", l: T("Pengembang", "Developer") }, { k: "pendana", l: T("Investor dan pendana", "Investor and lender") }, { k: "pemda", l: T("Pemda", "Local government") },
    { k: "pusat", l: T("Pemerintah pusat", "Central government") }, { k: "pln", l: T("PLN", "PLN") }, { k: "meti", l: T("METI", "METI") },
  ];
  const tahap = [
    { k: "eksplorasi", l: T("Eksplorasi", "Exploration") }, { k: "kawasan", l: T("Perizinan kawasan hutan", "Forest area permitting") }, { k: "ppa", l: T("PPA", "PPA") },
    { k: "pengeboran", l: T("Pengeboran", "Drilling") }, { k: "sosial", l: T("Sosial", "Social") },
  ];
  const b = (p, t, id, en, dasar) => ({ peran: p, tahap: t, teks: T(id, en), dasar });
  bab[42] = { tipe: "periksa", peran, tahap, butir: [
    b("pengembang", "eksplorasi", "Pelajari data sumur dan survei yang ada di wilayah (termasuk data pengeboran pemerintah) sebelum menawar lelang.", "Study existing well and survey data for the area (including government drilling data) before bidding.", "smi"),
    b("pengembang", "eksplorasi", "Rancang program sumur eksplorasi berseri; satu sumur tidak menjawab risiko (peluang berhasil naik dengan jumlah sumur).", "Design a staged exploration well programme; one well does not settle the risk (success probability rises with the number of wells).", "stanford"),
    b("pengembang", "eksplorasi", "Pakai asumsi tingkat sukses eksplorasi sekitar 59% bukan 100% dalam model keuangan.", "Use an exploration success assumption of about 59%, not 100%, in the financial model.", "esmap"),
    b("pengembang", "kawasan", "Petakan irisan WKP dengan kawasan hutan dan konservasi sebelum menawar.", "Map the overlap of the WKP with forest and conservation areas before bidding.", "uu21"),
    b("pengembang", "kawasan", "Siapkan AMDAL dan izin penggunaan kawasan hutan sejak awal; jadwalkan sebagai jalur kritis.", "Prepare AMDAL and the forest area use permit early; schedule them as a critical path.", "pp7"),
    b("pengembang", "ppa", "Hitung kelayakan di bawah harga patokan tertinggi Perpres 112/2022 dengan faktor F wilayah, bukan di harga yang diharapkan.", "Test feasibility under the Perpres 112/2022 ceiling with the regional F factor, not at a hoped-for price.", "perpres112"),
    b("pengembang", "ppa", "Siapkan klausul PPA yang dapat disesuaikan agar bankable, seperti pada Rantau Dedap (2017).", "Prepare PPA clauses that can be adapted to be bankable, as at Rantau Dedap (2017).", "dedap_ppa"),
    b("pengembang", "pengeboran", "Tetapkan zona aman, sirene, dan detektor H2S di arah angin sebelum uji alir; umumkan jalur evakuasi ke desa.", "Set a buffer zone, sirens and downwind H2S detectors before discharge testing; announce the evacuation route to villages.", "sorik_esdm"),
    b("pengembang", "pengeboran", "Izin kerja, pemantau gas personel, dan pemicu berhenti kerja untuk workover pada sumur H2S.", "Work permit, personal gas monitors and a stop-work trigger for workover on H2S wells.", "dieng_kabar"),
    b("pengembang", "sosial", "Verifikasi materi sosialisasi bersama warga dan buka kunjungan ke PLTP yang berjalan.", "Verify briefing material with residents and open visits to operating plants.", "talang25"),
    b("pengembang", "sosial", "Cari persetujuan bebas, didahulukan, dan diinformasikan (FPIC) sebelum konstruksi; catat dan jawab tiap keberatan secara tertulis.", "Seek free, prior and informed consent (FPIC) before construction; log and answer every objection in writing.", "talang25"),
    b("pendana", "eksplorasi", "Nilai struktur risiko hulu: apakah ada dana PISP, hibah, atau jaminan yang menutup sumur eksplorasi.", "Assess the upstream risk structure: is there PISP money, grant or guarantee covering exploration wells.", "wbpisp"),
    b("pendana", "ppa", "Syaratkan PPA yang bankable dan jaminan risiko politik untuk proyek besar (pola Sarulla: JBIC).", "Require a bankable PPA and political risk cover for large projects (Sarulla pattern: JBIC).", "sarulla"),
    b("pendana", "pengeboran", "Periksa rencana keselamatan H2S dan asuransi sebelum pencairan fase pengeboran.", "Check the H2S safety plan and insurance before disbursing the drilling phase.", "sorik_esdm"),
    b("pendana", "sosial", "Tuntut laporan penerimaan warga dan mekanisme keluhan sebagai syarat pinjaman.", "Require a resident acceptance report and complaint mechanism as a loan condition.", "talang25"),
    b("pemda", "kawasan", "Ketahui status kawasan hutan dan tata ruang wilayah sebelum rekomendasi.", "Know the forest area status and spatial plan before issuing recommendations.", "uu21"),
    b("pemda", "sosial", "Adakan forum bersama warga dengan data lengkap; hindari sosialisasi hanya sisi positif.", "Hold a joint forum with residents with full data; avoid positives-only briefings.", "talang25"),
    b("pemda", "sosial", "Pastikan skema bonus produksi (PP 28/2016) dan serapan tenaga kerja lokal dijelaskan ke warga.", "Make sure the production bonus scheme (PP 28/2016) and local labour absorption are explained to residents.", "mataloko"),
    b("pusat", "eksplorasi", "Pertimbangkan pengeboran pemerintah di WKP yang berisiko tinggi sebelum lelang; model Waesano dan Jailolo sudah ada.", "Consider government drilling in high-risk WKP before auction; the Waesano and Jailolo models exist.", "waesano"),
    b("pusat", "ppa", "Perbarui harga patokan dan faktor F secara berkala berdasarkan biaya riil.", "Update ceiling prices and the F factor periodically from real costs.", "perpres112"),
    b("pusat", "pengeboran", "Pastikan inspektur panas bumi hadir dan standar zona aman wajib sebelum uji alir.", "Ensure geothermal inspectors are present and buffer zone standards are mandatory before discharge tests.", "sorik_esdm"),
    b("pusat", "sosial", "Umumkan status kajian dan izin selaras dengan sosialisasi (pelajaran Ungaran).", "Announce study and permit status in step with outreach (Ungaran lesson).", "ungaran1"),
    b("pln", "ppa", "Buka kalkulasi biaya penyediaan dan proses negosiasi PPA agar pengembang dan bank dapat merencanakan.", "Open the cost of supply calculation and PPA negotiation process so developers and banks can plan.", "perpres112"),
    b("pln", "pengeboran", "Untuk proyek PLN sendiri (Ungaran, Hululais, Mataloko), terapkan standar keselamatan H2S yang sama dengan swasta.", "For PLN's own projects (Ungaran, Hululais, Mataloko), apply the same H2S safety standard as the private sector.", "dieng_kabar"),
    b("meti", "sosial", "Sediakan formulir hak jawab dan koreksi dan muat tanggapan berdampingan dengan kasus.", "Provide a reply and correction form and publish responses alongside cases.", "talang25"),
    b("meti", "eksplorasi", "Perbarui daftar WKP dan hasil lelang begitu sumber resmi tersedia; tandai yang masih media.", "Update the WKP list and auction results as soon as official sources exist; mark those still media-based.", "wkp"),
  ] };

  return {
    id: "panas-bumi", versi: 1, diperbarui: TGL,
    judul: T("Panas bumi", "Geothermal"),
    lead: T("Panas bumi memberi Indonesia beban dasar bersih dengan kapasitas terpasang 2,7 GW, tetapi pertumbuhannya ditentukan oleh siapa yang menanggung risiko eksplorasi.", "Geothermal gives Indonesia clean baseload with 2.7 GW installed, but its growth is decided by who carries the exploration risk."),
    kunci: [
      { label: T("Kapasitas terpasang 2025", "Installed capacity 2025"), nilai: akhir.kapasitas_mw, d: 1, satuan: T("MW", "MW"), sumber: "irena", est: false },
      { label: T("Pembangkitan 2024", "Generation 2024"), nilai: thn2024.pembangkitan_gwh, d: 0, satuan: T("GWh", "GWh"), sumber: "irena", est: false },
      { label: T("Faktor kapasitas nasional 2024", "National capacity factor 2024"), nilai: f1(cf2024 * 100), d: 1, satuan: T("%", "%"), sumber: "irena", est: true },
      { label: T("Tingkat sukses sumur eksplorasi (ESMAP)", "Exploration well success rate (ESMAP)"), nilai: 59, d: 0, satuan: T("%", "%"), sumber: "esmap", est: false },
      { label: T("WKP dan PSPE dilelang 2025", "WKP and PSPE auctioned in 2025"), nilai: 10, d: 0, satuan: T("wilayah", "areas"), sumber: "lelang", est: false },
    ],
    penting: [
      T("Tarif PLTP dibatasi harga patokan tertinggi Perpres 112/2022 (mulai 9,76 sen US$/kWh untuk sampai 10 MW, sebelum faktor F), sehingga kelayakan bergantung pada biaya eksplorasi.", "PLTP prices are capped by the Perpres 112/2022 ceiling (from 9.76 US cents/kWh up to 10 MW, before the F factor), so feasibility depends on exploration cost."),
      T("Risiko hulu sebagian ditanggung negara lewat PISP/PT SMI (pengeboran pemerintah); proyek besar dibiayai JBIC, ADB, dan bank mitra.", "Upstream risk is partly carried by the state through PISP/PT SMI (government drilling); large projects are financed by JBIC, ADB and partner banks."),
      T("Kasus gagal di Indonesia berpusat pada keselamatan H2S dan penerimaan warga, bukan pada teknologi.", "Failed cases in Indonesia centre on H2S safety and resident acceptance, not technology."),
    ],
    posisi: T(`Kapasitas terpasang Indonesia (${akhir.kapasitas_mw} MW, IRENA 2025) lebih besar daripada Turki (1.691 MW, 2024), tetapi pertumbuhan 10 tahun terakhir sebesar ${f1(tambah10)} MW (EST) masih jauh di bawah potensi yang sering dikutip.`, `Indonesia's installed capacity (${akhir.kapasitas_mw} MW, IRENA 2025) is larger than Turkey's (1,691 MW, 2024), but the ${f1(tambah10)} MW (EST) added over the last 10 years is still far below the potential often cited.`),
    sumber, bab,
  };
}

/* ---------------- validasi ---------------- */
const LARANG = /[—–·→←⇒]|->|<-/;
export function periksa(n) {
  const m = []; const dua = (x, p) => { if (!x || typeof x.id !== "string" || typeof x.en !== "string" || !x.id || !x.en) m.push("bukan dua bahasa: " + p); };
  const ada = (k, p) => { if (!n.sumber[k]) m.push(`sumber ${k} tak ada (${p})`); };
  const u = (o, p) => {
    if (Array.isArray(o)) return o.forEach((x, i) => u(x, p + "[" + i + "]"));
    if (o && typeof o === "object") { if (typeof o.id === "string" && typeof o.en === "string") { for (const s of [o.id, o.en]) { if (LARANG.test(s)) m.push("karakter terlarang: " + p); if (/\b[A-Z]{4,}(\s+[A-Z]{4,}){2,}\b/.test(s)) m.push("kapital penuh: " + p); } return; } return Object.entries(o).forEach(([k, v]) => u(v, p + "." + k)); }
    if (typeof o === "string" && LARANG.test(o)) m.push("karakter terlarang: " + p);
  };
  u(n, "naskah");
  if (n.kunci.length !== 5) m.push("kunci harus 5");
  n.kunci.forEach((k, i) => { dua(k.label, "kunci" + i); ada(k.sumber, "kunci" + i); });
  Object.entries(n.sumber).forEach(([k, s]) => { if (!/^https?:\/\/|^\//.test(s.url) || !s.tanggal || !s.bukti) m.push("sumber cacat: " + k); });
  for (const [no, b] of Object.entries(n.bab)) {
    (b.sumber || []).forEach((k) => ada(k, "bab" + no));
    if (b.tipe === "kasus") for (const k of b.butir) {
      (k.sumber || []).forEach((s) => ada(s, k.id)); (k.angka || []).forEach((a) => ada(a.sumber, k.id));
      if (Number(no) === 40 && (!k.sumber?.length || k.hak_jawab !== true)) m.push("kasus gagal tanpa sumber/hak jawab: " + k.id);
    }
    if (b.tipe === "periksa") b.butir.forEach((x) => { ada(x.dasar, "periksa"); if (!b.peran.some((p) => p.k === x.peran) || !b.tahap.some((t) => t.k === x.tahap)) m.push("periksa rujukan salah"); });
  }
  const wajib = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 39, 40, 41, 42];
  for (const w of wajib) if (!n.bab[w]) m.push("bab " + w + " kosong");
  return m;
}

export const naskah = bangun;
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const n = bangun(); const m = periksa(n);
  if (m.length) { console.error(m.join("\n")); process.exit(1); }
  if (process.argv.includes("--selftest")) console.log("selftest ok: " + Object.keys(n.bab).length + " bab, " + Object.keys(n.sumber).length + " sumber");
  else { writeFileSync(new URL("public/data/topik/panas_bumi.json", AKAR), JSON.stringify(n, null, 1) + "\n"); console.log("tulis public/data/topik/panas_bumi.json (" + Object.keys(n.bab).length + " bab)"); }
}
