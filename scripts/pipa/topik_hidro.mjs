// Naskah topik Hidro (kerangka 42 bab) mengikuti docs/perencanaan/TOPIK-SKEMA.md.
// Menyusun public/data/topik/hidro.json dari data repo (dihitung, bukan diketik) + sumber publik bertanggal.
// Pakai: node scripts/pipa/topik_hidro.mjs [--selftest]
// Aturan: tiap klaim bersumber (kunci peta sumber); analisis sendiri berlabel "Analisis METI (Hipotesis)"; bab tanpa data dikosongkan; kasus yang menyebut pihak wajib hak jawab.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validasi } from './topik_surya.mjs';
export { validasi };
const akar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ID = 'hidro';
const TGL = '2026-11-08';
const baca = (p) => JSON.parse(fs.readFileSync(path.join(akar, p), 'utf8'));
const T = (id, en) => ({ id, en });
const S = (judul, penerbit, url, tanggal, bukti, lisensi) => ({ judul, penerbit, url, tanggal, tahun: Number(tanggal.slice(0, 4)), bukti, ...(lisensi ? { lisensi } : {}) });
const HIP = 'Analisis METI (Hipotesis): ';
const HIPE = 'METI analysis (Hypothesis): ';
const L = (k, a, e) => ({ k, l: T(a, e) });
const dasarP = (peran, tahap, id, en, s) => ({ peran, tahap, teks: T(id, en), dasar: s });
const G = (rows) => rows.map(([i, a, e]) => ({ istilah: T(i, i), arti: T(a, e) }));
const FQ = (rows) => rows.map(([a, b, c, d]) => ({ t: T(a, b), j: T(c, d) }));
const P = (...pp) => pp.map(([a, b]) => T(a, b));
const dasarJson = () => baca(`public/data/topik/dasar-${ID}.json`);
const regRow = (d, id, dok, ttg, ttgEn) => { const r = d.regulasi.find((x) => x.id === id); if (!r) throw new Error('regulasi hilang ' + id); return { dok, ttg: T(ttg, ttgEn), st: r.status, u: r.url }; };
const PERAN = [L('pengembang', 'Pengembang', 'Developer'), L('investor', 'Investor', 'Investor'), L('pemda', 'Pemerintah daerah', 'Local government'), L('pusat', 'Pemerintah pusat', 'Central government'), L('pln', 'PLN', 'PLN'), L('meti', 'METI', 'METI')];
const TAHAP = [L('lokasi', 'Penyaringan lokasi', 'Site screening'), L('izin', 'Perizinan', 'Permitting'), L('ppa', 'PPA', 'PPA'), L('dana', 'Pendanaan', 'Financing'), L('bangun', 'Konstruksi', 'Construction'), L('operasi', 'Operasi', 'Operation')];
const FAKTOR_STD = [['lahan', 'Lahan dan lokasi siap', 'Land and site ready'], ['perizinan', 'Perizinan jelas', 'Permitting clear'], ['ppa_tarif', 'PPA dan tarif disepakati', 'PPA and tariff agreed'], ['pendanaan', 'Pendanaan dan penjaminan', 'Financing and guarantees'], ['jaringan', 'Jaringan, offtaker, dan interkoneksi', 'Grid, offtaker and interconnection'], ['pengelola_om', 'Pengelola dan O&M', 'Operator and O&M'], ['sosial', 'Dukungan masyarakat dan safeguard', 'Community support and safeguards'], ['kepastian_kebijakan', 'Kepastian kebijakan', 'Policy certainty']];
const sm = (...k) => k;
const HAK = T('Hak jawab: pihak yang disebut dapat mengirim koreksi atau tanggapan lewat formulir koreksi platform; tanggapan akan dimuat berdampingan.', 'Right of reply: named parties can send a correction or response through the platform correction form; responses will be published alongside.');
const kasus = (o) => ({ negara: 'ID', ...o });
const pendRows = (fn, n = 10) => baca('public/data/pendanaan.json').pendanaan.filter(fn).slice(0, n).map((x) => ({ nama: x.nama, pem: x.pemberi, jenis: x.jenis_entri === 'skema' ? T('skema', 'scheme') : T('proyek', 'project'), u: x.url }));
const PEND_KOL = [{ k: 'nama', l: T('Skema atau proyek', 'Scheme or project'), url: 'u' }, { k: 'pem', l: T('Pemberi', 'Provider') }, { k: 'jenis', l: T('Jenis', 'Type') }];
const dataProv = (tek) => { const m = {}; for (const p of baca('public/data/proyek.json').baris.filter((x) => tek.includes(x.teknologi))) { const pv = p.lokasi?.provinsi; if (!pv) continue; const o = (m[pv] ||= { prov: pv, n: 0, mw: 0, op: 0 }); o.n++; o.mw += p.kapasitas?.[0]?.nilai || 0; if (p.status?.[0]?.nilai === 'beroperasi') o.op++; } return Object.values(m).map((o) => ({ ...o, mw: Math.round(o.mw) })).sort((a, b) => b.mw - a.mw); };
const KOL_PROV = [{ k: 'prov', l: T('Provinsi', 'Province') }, { k: 'n', l: T('Jumlah proyek', 'Projects'), num: true, d: 0 }, { k: 'mw', l: T('Kapasitas (MW)', 'Capacity (MW)'), num: true, d: 0 }, { k: 'op', l: T('Beroperasi', 'Operating'), num: true, d: 0 }];
const tren = (tak) => baca('public/data/kapasitas_tren.json').baris.filter((r) => r.taksonomi === tak).sort((a, b) => a.tahun - b.tahun);
const lcoeSeri = (tek) => baca('public/data/biaya_listrik.json').lcoe.filter((x) => x.negara === 'Dunia' && x.teknologi === tek).sort((a, b) => a.tahun - b.tahun);
const aseanTab = (kunci) => baca('public/data/asean_energi.json').baris.map((r) => ({ n: r.nama, v: r.bauran_listrik_persen[kunci]?.nilai ?? null, ebt: r.bauran_listrik_persen.ebt_total?.nilai ?? null, ci: r.intensitas_karbon_gco2_kwh?.nilai ?? null })).sort((a, b) => (b.v ?? -1) - (a.v ?? -1));
const KOL_ASEAN = (lab, labEn) => [{ k: 'n', l: T('Negara', 'Country') }, { k: 'v', l: T(lab, labEn), num: true, d: 2 }, { k: 'ebt', l: T('Total EBT (persen)', 'Total renewables (percent)'), num: true, d: 1 }, { k: 'ci', l: T('Intensitas karbon (gCO2 per kWh)', 'Carbon intensity (gCO2 per kWh)'), num: true, d: 0 }];
const SUM_REPO = {
  ed: { judul: 'Ringkasan editorial METI (penjelasan umum; bukan kutipan pasal)', penerbit: 'METI', tanggal: TGL, tahun: 2026, bukti: 'editorial' },
  kap: S('IRENA, kapasitas terpasang dan pembangkitan Indonesia (diolah repo: public/data/kapasitas_tren.json)', 'IRENA', 'https://www.irena.org/Data', TGL, 'resmi', 'IRENA data terbuka'),
  owid: S('Our World in Data energy-data, memuat Ember Yearly Electricity Data (public/data/asean_energi.json)', 'Ember via Our World in Data', 'https://github.com/owid/energy-data', TGL, 'via-pihak-ketiga', 'CC BY 4.0'),
  lcoe: S('IRENA LCOE global via Our World in Data (public/data/biaya_listrik.json)', 'IRENA via Our World in Data', 'https://ourworldindata.org/grapher/levelized-cost-of-energy', TGL, 'via-pihak-ketiga', 'CC BY 4.0'),
  proyek: S('Direktori METI: proyek (public/data/proyek.json, RUPTL 2025-2034, GEM, OSM, media)', 'METI', 'https://platformmeti.timitbnpb.workers.dev', '2026-11-07', 'via-pihak-ketiga'),
  ruptl: S('RUPTL PT PLN (Persero) 2025-2034, lampiran Kepmen ESDM 188.K/TL.03/MEM.L/2025 (diolah repo: public/data/ruptl.json)', 'PLN, ESDM', 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf', '2025-05-26', 'resmi'),
  regul: S('Basis regulasi METI (public/data/regulasi.json, naskah BPK JDIH)', 'BPK JDIH, METI', 'https://peraturan.bpk.go.id/', '2026-11-07', 'resmi'),
  pendanaan: S('Basis pendanaan METI (public/data/pendanaan.json: skema dan proyek pendana)', 'METI, ADB, World Bank, AIIB dan lain-lain', 'https://www.adb.org/projects', TGL, 'via-pihak-ketiga'),
  perpres112: S('Perpres 112/2022 tentang Percepatan Pengembangan Energi Terbarukan untuk Penyediaan Tenaga Listrik', 'BPK JDIH', 'https://peraturan.bpk.go.id/Details/225308', '2022-09-13', 'resmi'),
  ruuebet: S('Pelacak RUU EBET di arsip METI (public/data/kebijakan_info.json; situs DPR melarang perayap sehingga tahap bukan dari DPR)', 'METI, Liputan6', 'https://www.liputan6.com/bisnis/read/6312024/meti-minta-ruu-ebet-segera-disahkan', '2026-09-08', 'media'),
  dak: S('Kemenkeu DJPK, Bidang Infrastruktur Energi Terbarukan (DAK-IET)', 'Kemenkeu DJPK', 'https://djpk.kemenkeu.go.id/wp-content/uploads/2024/04/Bidang-Infrastruktur-Energi-Terbarukan-IET.pdf', '2024-04-01', 'resmi'),
  jetp: S('Platform JETP Indonesia dan CIPP (public/data/jetp_cipp.json)', 'JETP Secretariat, METI', 'https://platformmeti.timitbnpb.workers.dev', '2026-11-07', 'via-pihak-ketiga'),
};
export const SUMBER = {
  ...SUM_REPO,
  petro: S('PLNE reports progress on 1,040 MW Upper Cisokan pumped storage project (COD 2030 menurut laporan 2026)', 'Petromindo', 'https://www.petromindo.com/news/article/plne-reports-progress-on-1-040-mw-upper-cisokan-pumped-storage-project', '2025-12-01', 'media'),
  rricis: S('Indonesia Speeds Up Pumped-Storage Power Project in West Java', 'RRI', 'https://rri.co.id/en/national/2445058/indonesia-speeds-up-pumped-storage-power-project-in-west-java', TGL, 'media'),
  bisnis24: S('Kejar operasi proyek PLTA raksasa di Jawa Barat, PLN koordinasi isu TKDN (24 Jul 2024)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20240724/44/1784945/kejar-operasi-proyek-plta-raksasa-di-jawa-barat-pln-koordinasi-isu-tkdn', '2024-07-24', 'media'),
  aiib: S('AIIB, Project Implementation Monitoring Report: Development of Pumped Storage Hydropower in Java Bali System No.1 (Maret 2023; ESMP di jalur kritis, jalan akses longsor)', 'AIIB', 'https://www.aiib.org/en/projects/details/2023/_download/indonesia/AIIB_PIMR_SBF_Indonesia_P000512_Development_of_Pumped_Storage_Hydropower_in_Java_Bali_System_No1_March_2023_Public_Version.pdf', '2023-03-01', 'resmi'),
  enerdata: S('Indonesia lends US$380m to PT PLN for 1 GW hydro pumped storage project', 'Enerdata', 'https://www.enerdata.net/publications/daily-energy-news/indonesia-lends-us380m-pt-pln-1-gw-hydro-pumped-storage-project.html', TGL, 'media'),
  seawater: S('PLN studies 1 GW seawater pumped storage project despite rising BESS competition', 'Petromindo', 'https://www.petromindo.com/news/article/pln-studies-1-gw-seawater-pumped-storage-project-despite-rising-bess-competition', '2026-08-01', 'media'),
  iea74: S('IEA forecasts 74 GW increase in global pumped-storage hydropower capacity (6 Nov 2026)', 'Trend.az', 'https://www.trend.az/world/4243656.html', '2026-11-06', 'media'),
  jgsync: S('PLN berhasil tuntaskan proyek pembangunan PLTA Jatigede 2 x 55 MW; sinkronisasi pertama 11 Mei 2024', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20240516/44/1766113/pln-berhasil-tuntaskan-proyek-pembangunan-plta-jatigede-2', '2024-05-16', 'media'),
  jgslo: S('PLN bakal operasikan PLTA Jatigede 110 MW (SLO diperoleh Juni 2024)', 'CNBC Indonesia', 'https://www.cnbcindonesia.com/news/20240905094121-4-569296/tambah-pasokan-listrik-ebt-pln-bakal-operasikan-plta-jatigede-110-mw', '2024-09-05', 'media'),
  jg2019: S('Operation of 110MW Jatigede hydropower dam delayed to 2020 (13 Des 2019)', 'The Jakarta Post', 'https://www.thejakartapost.com/news/2019/12/13/operation-of-110mw-jatigede-hydropower-dam-delayed-to-2020', '2019-12-13', 'media'),
  jg2021: S('Dikebut! Progres pembangunan PLTA Jatigede capai 85 persen (4 Apr 2021)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20210404/44/1376352/dikebut-progres-pembangunan-plta-jatigede-capai-85-persen', '2021-04-04', 'media'),
  jgwiki: S('Jatigede Dam (ringkasan Wikipedia: 110 MW, pengisian 31 Agu 2015, sekitar 70.000 warga direlokasi)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Jatigede_Dam', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  btboc: S('Bank of China to review funding of dam in orangutan habitat in Sumatra', 'Eco-Business', 'https://www.eco-business.com/news/bank-of-china-to-review-funding-of-dam-in-orangutan-habitat-in-sumatra/', '2019-03-14', 'media'),
  btjp: S('Bank of China to evaluate Batang Toru hydropower plant project (14 Mar 2019)', 'The Jakarta Post', 'https://www.thejakartapost.com/news/2019/03/14/bank-of-china-to-evaluate-batang-toru-hydropower-plant-project', '2019-03-14', 'media'),
  btbhr: S('Indonesia: environmental and social concerns over Batang Toru hydropower project', 'Business and Human Rights Resource Centre', 'https://business-humanrights.org/en/latest-news/indonesia-environmental-and-social-concerns-over-batang-toru-hydropower-project/', TGL, 'kajian'),
  btcgs: S('A China-backed dam in Indonesia tests the limits of compliance (kredit Eximbank USD 1,251 miliar, perjanjian Maret 2023; saham SDIC Power 2021)', 'China Global South Project', 'https://chinaglobalsouth.com/analysis/china-indonesia-hydropower-controversy/', TGL, 'kajian'),
  kybn: S('Indonesia\'s Kayan hydropower project forges ahead despite setbacks, director says (14 Jun 2024)', 'BenarNews', 'https://www.benarnews.org/english/news/indonesian/dam-setbacks-06142024161105.html', '2024-06-14', 'media'),
  kybhr: S('Indonesia: Kayan Cascade hydropower project advances amid partner exits, environmental and displacement concerns', 'Business and Human Rights Resource Centre', 'https://business-humanrights.org/en/latest-news/indonesia-kayan-cascade-hydropower-project-advances-amid-partner-exits-environmental-displacement-concerns', TGL, 'kajian'),
  kyjp: S('Kayan hydropower project forges ahead despite setbacks, director says (16 Jun 2024)', 'The Jakarta Post', 'https://www.thejakartapost.com/indonesia/2024/06/16/kayan-hydropower-project-forges-ahead-despite-setbacks-director-says', '2024-06-16', 'media'),
  kymin: S('Eight-year dam delay hinders Indonesia\'s move away from coal', 'Mining.com', 'https://www.mining.com/web/eight-year-dam-delay-hinders-indonesias-move-away-from-coal/', TGL, 'media'),
  katadata20: S('Terkendala sumber daya manusia, beberapa pembangkit listrik EBT rusak (sekitar 5 persen dari 719 PLTMH dan PLTS desa)', 'Katadata', 'https://katadata.co.id/amp/berita/energi/5e9a558d01a63/terkendala-sumber-daya-manusia-beberapa-pembangkit-listrik-ebt-rusak', '2020-04-17', 'media'),
  detikbpk: S('BPK temukan pembangkit EBT Rp467 M kondisinya rusak (12 Des 2017)', 'detikFinance', 'https://finance.detik.com/energi/d-3766759/bpk-temukan-pembangkit-ebt-rp-467-m-kondisinya-rusak', '2017-12-12', 'media'),
  meratus: S('Asa mikro hidro warga Pegunungan Meratus menanti aksi pemerintah (1 Mar 2026)', 'Mongabay Indonesia', 'https://mongabay.co.id/2026/03/01/asa-mikro-hidro-warga-pegunungan-meratus-menanti-aksi-pemerintah/', '2026-03-01', 'media'),
  mongntb: S('Menilik kondisi pembangkit energi terbarukan di Nusa Tenggara Barat (19 Apr 2020)', 'Mongabay Indonesia', 'https://mongabay.co.id/2020/04/19/menilik-kondisi-pembangkit-energi-terbarukan-di-nusa-tenggara-barat/', '2020-04-19', 'media'),
  cmundip: S('Eksistensi PLTMH Cinta Mekar dalam pemberdayaan masyarakat (Gema Teknologi, Undip)', 'Universitas Diponegoro', 'https://ejournal.undip.ac.id/index.php/gema_teknologi/article/download/19154/13328', TGL, 'kajian'),
  cmashden: S('Ashden Awards, IBEKA: Cinta Mekar grid-connected mikrohidro (dipasang 2005, sekitar USD 180.000)', 'Ashden', 'https://ashden.org/awards/winners/ibeka/', TGL, 'kajian'),
  cmwwf: S('Cinta Mekar adopts community-based microhydro power plant management system', 'WWF Indonesia', 'https://wwf.id/en/blog/cinta-mekar-adopts-community-based-microhydro-power-plant-management-system', TGL, 'media'),
  posobis: S('Kebut bauran EBT, Jokowi resmikan PLTA Poso dan Malea 605 MW (25 Feb 2022)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20220225/44/1504782/kebut-bauran-ebt-jokowi-resmikan-plta-poso-dan-malea-605-mw', '2022-02-25', 'media'),
  posoesdm: S('Presiden Joko Widodo resmikan PLTA di Kabupaten Poso', 'ESDM', 'https://esdm.go.id/id/media-center/arsip-berita/presiden-joko-widodo-resmikan-plta-di-kabupaten-poso', '2022-02-25', 'resmi'),
  posopeak: S('PLN: PLTA Poso jadi pembangkit peaker di Sulawesi (25 Feb 2022)', 'Republika', 'https://ekonomi.republika.co.id/berita/r7v1qc423/pln-plta-poso-jadi-pembangkit-peaker-di-sulawesi', '2022-02-25', 'media'),
  cirata: S('Cirata Dam (ringkasan Wikipedia: 1.008 MW)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Cirata_Dam', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  saguling: S('Saguling Dam (ringkasan Wikipedia: 700 MW)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Saguling_Dam', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  jatiluhur: S('Jatiluhur Dam (ringkasan Wikipedia: PLTA 186,5 MW)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Jatiluhur_Dam', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  masdar: S('Masdar: President of Indonesia inaugurates floating solar plant at Cirata (9 Nov 2023)', 'Masdar', 'https://masdar.ae/en/news/newsroom/president-of-indonesia-inaugurates-floating-solar-plant', '2023-11-09', 'media'),
  itaipu: S('Itaipu Dam (ringkasan Wikipedia: 14 GW, 103,1 TWh pada 2016, sekitar 10.000 keluarga dipindahkan)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Itaipu_Dam', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  xaya: S('Xayaburi Dam (ringkasan Wikipedia: 1.285 MW, operasi Okt 2019, 95 persen ke EGAT Thailand)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Xayaburi_Dam', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  tgd: S('Three Gorges Dam (ringkasan Wikipedia: 22.500 MW, penuh operasi 2012, 1,13 sampai 1,4 juta orang dipindahkan)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Three_Gorges_Dam', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  myit: S('Myitsone Dam (ringkasan Wikipedia: 6.000 MW direncanakan, ditangguhkan 30 Sep 2011, sekitar 11.800 orang direlokasi)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Myitsone_Dam', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
};

export function susun() {
  const d0 = dasarJson();
  const kp = tren('hidro');
  const k25 = kp.at(-1), k00 = kp[0], k24 = kp.find((x) => x.tahun === 2024);
  const idn = baca('public/data/asean_energi.json').baris.find((x) => x.iso3 === 'IDN');
  const pr = d0.proyek;
  const ru = baca('public/data/ruptl.json').ringkasan;
  const bab = {};
  const rf = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
  // rumus contoh
  const eta = 0.85, Q = 10, H = 100;
  const pMW = rf(eta * 9810 * Q * H / 1e6), gwh = rf(pMW * 8760 * 0.5 / 1000, 1);
  const pkW = rf(0.6 * 9810 * 0.4 * 20 / 1000, 0);

  const kunci = [
    { label: T('Kapasitas PLTA terpasang Indonesia (2025)', 'Indonesia installed hydropower capacity (2025)'), nilai: k25.kapasitas_mw, d: 0, satuan: T('MW', 'MW'), sumber: 'kap', est: false },
    { label: T('Porsi hidro dalam listrik Indonesia (2024)', 'Hydro share of Indonesia electricity (2024)'), nilai: idn.bauran_listrik_persen.hidro.nilai, d: 2, satuan: T('persen', 'percent'), sumber: 'owid', est: false },
    { label: T('Pembangkitan PLTA Indonesia (2024)', 'Indonesia hydropower generation (2024)'), nilai: k24.pembangkitan_gwh, d: 0, satuan: T('GWh', 'GWh'), sumber: 'kap', est: false },
    { label: T('PLTA dan PLTM dalam RUPTL 2025-2034', 'Hydro in PLN RUPTL 2025-2034'), nilai: ru.mw_per_teknologi.hidro, d: 0, satuan: T('MW (112 proyek bernama)', 'MW (112 named projects)'), sumber: 'ruptl', est: false },
    { label: T('Pumped storage Upper Cisokan', 'Upper Cisokan pumped storage'), nilai: 1040, d: 0, satuan: T('MW', 'MW'), sumber: 'petro', est: false },
  ];

  bab['2'] = { tipe: 'faq', sumber: sm('ed', 'kap', 'owid', 'proyek'), butir: FQ([
    ['Berapa kapasitas PLTA Indonesia?', 'How much hydropower capacity does Indonesia have?', `${k25.kapasitas_mw} MW pada ${k25.tahun} menurut IRENA, naik dari ${k00.kapasitas_mw} MW pada ${k00.tahun}.`, `${k25.kapasitas_mw} MW in ${k25.tahun} per IRENA, up from ${k00.kapasitas_mw} MW in ${k00.tahun}.`],
    ['Berapa porsi hidro di listrik Indonesia?', 'What share of Indonesian electricity is hydro?', `${idn.bauran_listrik_persen.hidro.nilai} persen pada 2024 menurut Ember; batubara masih ${idn.bauran_listrik_persen.batubara.nilai} persen.`, `${idn.bauran_listrik_persen.hidro.nilai} percent in 2024 per Ember; coal is still ${idn.bauran_listrik_persen.batubara.nilai} percent.`],
    ['Apa beda PLTA, PLTM, dan PLTMH?', 'What is the difference between PLTA, PLTM and PLTMH?', 'Pembagian umum menurut ukuran: PLTMH (mikrohidro) kecil, biasanya di bawah 1 MW untuk desa; PLTM (minihidro) sekitar 1 sampai 10 MW; PLTA di atas itu. Batas pastinya berbeda antar peraturan.', 'A common split by size: PLTMH (micro-hydro) small, usually below 1 MW for villages; PLTM (mini-hydro) about 1 to 10 MW; PLTA above that. Exact thresholds differ between regulations.'],
    ['Apa itu pumped storage?', 'What is pumped storage?', 'PLTA pompa memindahkan air ke waduk atas saat listrik murah, lalu mengalirkannya turun untuk membangkitkan listrik saat beban puncak. Ia berfungsi seperti baterai raksasa. Contoh Indonesia: Upper Cisokan 1.040 MW.', 'Pumped storage lifts water to an upper reservoir when power is cheap and releases it to generate at peak. It works like a giant battery. Indonesian example: Upper Cisokan, 1,040 MW.'],
    ['Berapa proyek hidro di basis METI?', 'How many hydro projects are in the METI database?', `${pr.jumlah} proyek dengan total ${pr.mw} MW (rencana, konstruksi, dan beroperasi); ${pr.beroperasi} berstatus beroperasi.`, `${pr.jumlah} projects totalling ${pr.mw} MW (planned, under construction and operating); ${pr.beroperasi} are operating.`],
    ['Siapa membeli listrik PLTA swasta?', 'Who buys power from private hydro?', 'Umumnya PLN lewat perjanjian jual beli tenaga listrik (PJBL). Poso Energy, misalnya, menandatangani PJBL ekspansi pada 2017 dan berfungsi sebagai pembangkit peaker.', 'Usually PLN through a power purchase agreement (PPA). Poso Energy, for example, signed an expansion PPA in 2017 and serves as a peaker plant.'],
    ['Kenapa Batang Toru kontroversial?', 'Why is Batang Toru controversial?', 'Lokasinya di habitat orangutan Tapanuli dan sejumlah bank meninjau ulang pendanaan. Lihat bab 40.', 'It sits in Tapanuli orangutan habitat and several banks reviewed funding. See chapter 40.'],
    ['Kenapa banyak PLTMH desa mati?', 'Why do many village micro-hydros die?', 'Sumber menyebut kurangnya pemeliharaan, pengelola yang tidak siap, dan dana desa yang tidak cukup untuk perbaikan. Lihat bab 40.', 'Sources cite lack of maintenance, unprepared operators and village funds too small for repairs. See chapter 40.'],
  ]) };
  bab['3'] = { tipe: 'glosarium', sumber: sm('ed'), butir: G([
    ['PLTA', 'Pembangkit Listrik Tenaga Air.', 'Hydropower plant.'], ['PLTM / PLTMH', 'Pembangkit listrik minihidro / mikrohidro.', 'Mini-hydro / micro-hydro power plant.'],
    ['Head', 'Tinggi jatuh air dari muka air atas ke turbin (meter).', 'Height water falls from upper level to the turbine (metres).'], ['Debit', 'Volume air per detik yang melewati turbin (meter kubik per detik).', 'Water volume per second through the turbine (cubic metres per second).'],
    ['Run-of-river', 'PLTA aliran sungai tanpa waduk besar; produksi mengikuti debit musiman.', 'River-flow plant without a large reservoir; output follows seasonal flow.'], ['Waduk', 'Tampungan air di belakang bendungan yang menyimpan energi dan meratakan debit.', 'Reservoir behind a dam that stores energy and smooths flow.'],
    ['Pumped storage', 'PLTA pompa: memompa air ke atas saat listrik murah dan membangkitkan saat puncak.', 'Pumped hydro: pumps water uphill when power is cheap and generates at peak.'], ['Peaker', 'Pembangkit yang dijalankan untuk beban puncak.', 'Plant dispatched for peak load.'],
    ['Faktor kapasitas', 'Produksi aktual dibagi produksi bila beroperasi penuh sepanjang tahun.', 'Actual output divided by output at full power all year.'], ['PJBL / PPA', 'Perjanjian jual beli tenaga listrik.', 'Power purchase agreement.'],
    ['AMDAL', 'Analisis mengenai dampak lingkungan.', 'Environmental impact assessment.'], ['ESMP', 'Rencana pengelolaan lingkungan dan sosial yang disyaratkan pemberi pinjaman.', 'Environmental and social management plan required by lenders.'],
    ['FPIC', 'Persetujuan atas dasar informasi di awal tanpa paksaan dari masyarakat terdampak.', 'Free, prior and informed consent of affected communities.'], ['SLO', 'Sertifikat Laik Operasi pembangkit.', 'Plant operation worthiness certificate.'],
    ['DAS', 'Daerah aliran sungai.', 'River basin.'], ['DAK-IET', 'Dana Alokasi Khusus bidang infrastruktur energi terbarukan.', 'Special allocation fund for renewable energy infrastructure.'],
  ]) };
  bab['4'] = { tipe: 'teks', sumber: sm('kap', 'owid', 'rricis'), paragraf: P(
    ['PLTA mengubah energi potensial air yang jatuh menjadi listrik lewat turbin dan generator. Ia merupakan sumber terbarukan terbesar Indonesia: 7,34 persen listrik 2024 menurut Ember, di depan surya dan bayu.', 'Hydropower turns the potential energy of falling water into electricity through turbines and generators. It is Indonesia\'s largest renewable source: 7.34 percent of 2024 electricity per Ember, ahead of solar and wind.'],
    ['Nilai khasnya adalah fleksibilitas: PLTA berwaduk dapat dinyalakan dalam menit untuk beban puncak, dan PLTA pompa menyimpan energi. PLN menggambarkan Upper Cisokan sebagai penjaga kestabilan pasokan di tengah naiknya surya dan bayu.', 'Its distinct value is flexibility: reservoir plants can start within minutes for peak load and pumped storage stores energy. PLN describes Upper Cisokan as protecting supply stability as solar and wind grow.'],
    ['Biayanya tertanam di depan (sipil, bendungan, relokasi) dan risikonya geologi, hidrologi, dan sosial. Karena itu cerita sukses dan gagal hidro sering ditentukan jauh sebelum turbin dipasang.', 'Costs are front-loaded (civil works, dam, resettlement) and risks are geological, hydrological and social. Success and failure are often decided long before turbines are installed.'],
  ) };
  bab['5'] = { tipe: 'rumus', sumber: sm('ed', 'lcoe'), rumus: P(
    ['Daya (W) = efisiensi x massa jenis air (1000 kg/m3) x percepatan gravitasi (9,81 m/s2) x debit Q (m3/s) x head H (m)', 'Power (W) = efficiency x water density (1000 kg/m3) x gravity (9.81 m/s2) x flow Q (m3/s) x head H (m)'],
    ['Energi tahunan (kWh) = daya (kW) x 8.760 jam x faktor kapasitas', 'Annual energy (kWh) = power (kW) x 8,760 hours x capacity factor'],
  ), contoh: [
    T(`PLTA contoh: head ${H} m, debit ${Q} m3/s, efisiensi ${eta * 100} persen menghasilkan sekitar ${pMW} MW. Dengan faktor kapasitas 50 persen, energi tahunan sekitar ${gwh} GWh (EST, angka ilustrasi hitung sendiri).`, `Example plant: ${H} m head, ${Q} m3/s flow, ${eta * 100} percent efficiency gives about ${pMW} MW. At a 50 percent capacity factor, annual energy is about ${gwh} GWh (EST, illustrative own calculation).`),
    T(`PLTMH desa: head 20 m, debit 0,4 m3/s, efisiensi 60 persen menghasilkan sekitar ${pkW} kW (EST, angka ilustrasi).`, `Village micro-hydro: 20 m head, 0.4 m3/s flow, 60 percent efficiency gives about ${pkW} kW (EST, illustrative).`),
    T(HIP + 'debit sungai musiman paling sering menjadi sumber kesalahan studi kelayakan; data debit multitahun lebih penting daripada head.', HIPE + 'seasonal river flow is the most common source of feasibility errors; multi-year flow records matter more than head.'),
  ] };
  bab['6'] = { tipe: 'langkah', sumber: sm('ed', 'aiib', 'posoesdm'), butir: [
    { judul: T('Data hidrologi dan studi awal', 'Hydrology data and pre-study'), isi: T('Pengukuran debit multitahun, pemetaan topografi, dan penilaian geologi menentukan lokasi bendung dan terowongan.', 'Multi-year flow records, topographic mapping and geological assessment fix the weir and tunnel sites.'), pelaku: T('Pengembang, konsultan, BBWS/BWS', 'Developer, consultants, river basin authority') },
    { judul: T('Izin lingkungan dan sosial', 'Environmental and social permits'), isi: T('AMDAL, pembebasan lahan, dan rencana relokasi; pemberi pinjaman internasional mensyaratkan ESMP yang dapat menjadi jalur kritis jadwal.', 'EIA, land acquisition and resettlement plans; international lenders require an ESMP that can become the schedule critical path.'), pelaku: T('Pengembang, pemda, KLH', 'Developer, local government, environment ministry') },
    { judul: T('PJBL dan pembiayaan', 'PPA and financing'), isi: T('PLN sebagai pembeli utama; pinjaman proyek dari bank pembangunan atau komersial.', 'PLN as main buyer; project loans from development or commercial banks.'), pelaku: T('PLN, pendana', 'PLN, lenders') },
    { judul: T('Konstruksi sipil dan elektromekanik', 'Civil and electromechanical construction'), isi: T('Bendungan, terowongan, rumah pembangkit, turbin, generator; sering bertahun-tahun dengan risiko geologi.', 'Dam, tunnels, powerhouse, turbines, generators; often years with geological risk.'), pelaku: T('Kontraktor EPC', 'EPC contractor') },
    { judul: T('Uji, SLO, dan COD', 'Testing, SLO and COD'), isi: T('Uji pembebanan, reliability run, SLO, lalu operasi komersial (contoh Jatigede: sinkronisasi 11 Mei 2024, SLO Juni 2024).', 'Load tests, reliability run, SLO, then commercial operation (Jatigede example: first sync 11 May 2024, SLO June 2024).'), pelaku: T('Pengembang/PLN', 'Developer/PLN') },
    { judul: T('Operasi, pemeliharaan, dan DAS', 'Operation, maintenance and basin management'), isi: T('Pengelola terlatih, anggaran O&M, dan pengelolaan sedimen serta daerah tangkapan air.', 'Trained operator, O&M budget, and sediment and catchment management.'), pelaku: T('Operator, pemda, komunitas', 'Operator, local government, community') },
  ] };
  bab['7'] = { tipe: 'grafik', jenis: 'kolom', sumber: sm('kap'), label: T('Kapasitas PLTA terpasang Indonesia', 'Indonesia installed hydropower capacity'), satuan: 'MW', d: 0, seri: [{ nama: T('Kapasitas (MW)', 'Capacity (MW)'), sorot: true, titik: kp.filter((x) => x.tahun >= 2010).map((x) => [String(x.tahun), x.kapasitas_mw]) }] };
  bab['8'] = { tipe: 'tabel', per: 10, sumber: sm('proyek'), catatan: T('Titik dan agregat per provinsi dari basis proyek METI (rencana, konstruksi, operasi); bukan lokasi bendungan tepat.', 'Province aggregates from the METI project base (planned, construction, operating); not exact dam locations.'), kolom: KOL_PROV, baris: dataProv(['hidro']) };
  bab['11'] = { tipe: 'teks', sumber: sm('posobis', 'posopeak', 'ruptl', 'kap'), paragraf: P(
    ['Pasar hidro Indonesia adalah pasar pembeli tunggal: PLN membeli dari pembangkitnya sendiri dan dari IPP. Contoh IPP besar adalah Poso Energy (515 MW) dan Malea Energy (90 MW), diresmikan bersama pada 25 Februari 2022.', 'The Indonesian hydro market is single-buyer: PLN buys from its own plants and from IPPs. Large IPP examples are Poso Energy (515 MW) and Malea Energy (90 MW), inaugurated together on 25 February 2022.'],
    [`RUPTL 2025-2034 memuat ${ru.per_teknologi.hidro} proyek hidro bernama (${ru.mw_per_teknologi.hidro} MW) dan ${ru.per_teknologi.penyimpanan} proyek penyimpanan (${ru.mw_per_teknologi.penyimpanan} MW), termasuk PLTA pompa; tahun COD memakai skenario RE Base.`, `The 2025-2034 RUPTL lists ${ru.per_teknologi.hidro} named hydro projects (${ru.mw_per_teknologi.hidro} MW) and ${ru.per_teknologi.penyimpanan} storage projects (${ru.mw_per_teknologi.penyimpanan} MW), including pumped storage; COD years follow the RE Base scenario.`],
  ) };
  const R = (id, dok, a, b) => regRow(d0, id, dok, a, b);
  bab['12'] = { tipe: 'tabel', per: 8, sumber: sm('regul', 'perpres112', 'dak'), kolom: [{ k: 'dok', l: T('Peraturan', 'Regulation'), url: 'u' }, { k: 'ttg', l: T('Tentang', 'About') }, { k: 'st', l: T('Status', 'Status') }], baris: [
    { dok: 'Perpres 112/2022', ttg: T('Percepatan pengembangan energi terbarukan untuk penyediaan tenaga listrik, memuat harga patokan dan pembelian oleh PLN', 'Accelerating renewable power, with benchmark prices and PLN purchase'), st: 'berlaku', u: SUMBER.perpres112.url },
    R('permen-esdm-19-2015', 'Permen ESDM 19/2015', 'Pembelian tenaga listrik dari PLTA kapasitas kecil (dicabut)', 'Power purchase from small hydro (revoked)'),
    R('permen-esdm-12-2014', 'Permen ESDM 12/2014', 'Pembelian tenaga listrik dari PLTA oleh PLN (dicabut)', 'Purchase of hydro power by PLN (revoked)'),
    R('perda-b120470-16-2019', 'Perda 16/2019', 'Tata kelola PLTMH berbasis masyarakat', 'Community-based micro-hydro governance'),
    R('permen-b159770-09-prt-m-2017-2017', 'Permen PUPR 09/PRT/M/2017', 'Pemilihan badan usaha mitra pemanfaatan BMN untuk infrastruktur', 'Selecting business partners for use of state property in infrastructure'),
    R('permen-b104458-09-prt-m-2016-2016', 'Permen PUPR 09/PRT/M/2016', 'Kerja sama pemerintah dan badan usaha dalam infrastruktur sumber daya air', 'Government-business cooperation in water resources infrastructure'),
    { dok: 'DAK-IET', ttg: T('Dana Alokasi Khusus bidang infrastruktur energi terbarukan untuk daerah', 'Special allocation fund for local renewable energy infrastructure'), st: 'tahunan', u: SUMBER.dak.url },
  ] };
  bab['13'] = { tipe: 'linimasa', sumber: sm('posobis', 'jgwiki', 'btboc', 'btcgs', 'jgsync', 'kybn', 'petro', 'perpres112'), butir: [
    { tanggal: '2012-12-01', judul: T('PLTA Poso tahap 1 (3 x 65 MW) beroperasi', 'Poso hydro phase 1 (3 x 65 MW) in operation'), url: SUMBER.posobis.url },
    { tanggal: '2015-08-31', judul: T('Waduk Jatigede mulai diisi', 'Jatigede reservoir impoundment begins'), url: SUMBER.jgwiki.url },
    { tanggal: '2019-03-14', judul: T('Bank of China meninjau pendanaan Batang Toru', 'Bank of China reviews Batang Toru funding'), url: SUMBER.btboc.url },
    { tanggal: '2022-02-25', judul: T('PLTA Poso dan Malea (605 MW) diresmikan', 'Poso and Malea hydro (605 MW) inaugurated'), url: SUMBER.posobis.url },
    { tanggal: '2022-09-13', judul: T('Perpres 112/2022 ditetapkan', 'Presidential Regulation 112/2022 issued'), url: SUMBER.perpres112.url },
    { tanggal: '2023-03-01', judul: T('Perjanjian kredit sindikasi Eximbank untuk Batang Toru (USD 1,251 miliar)', 'Eximbank syndicated loan agreement for Batang Toru (USD 1.251 billion)'), url: SUMBER.btcgs.url },
    { tanggal: '2024-05-11', judul: T('Sinkronisasi pertama PLTA Jatigede 2 x 55 MW', 'First synchronisation of Jatigede 2 x 55 MW'), url: SUMBER.jgsync.url },
    { tanggal: '2024-06-14', judul: T('Kayan Hydro Energy: mitra mundur, pembangunan berlanjut', 'Kayan Hydro Energy: partners exit, construction continues'), url: SUMBER.kybn.url },
    { tanggal: '2030-01-01', judul: T('Target COD Upper Cisokan menurut laporan 2026 (tahun saja)', 'Upper Cisokan COD target per 2026 report (year only)'), url: SUMBER.petro.url },
  ] };
  bab['14'] = { tipe: 'teks', sumber: sm('perpres112', 'dak', 'posopeak', 'ed'), paragraf: P(
    ['Kewajiban dan insentif hidro terutama datang dari tiga pintu: harga patokan dan pembelian oleh PLN (Perpres 112/2022), dana daerah untuk PLTMH (DAK Infrastruktur Energi Terbarukan), dan kewajiban lingkungan dan sosial (AMDAL, ESMP pemberi pinjaman). Besaran tarif per jenis PLTA perlu dibaca langsung di lampiran Perpres; belum dikutip di sini.', 'Obligations and incentives for hydro come mainly through three doors: benchmark prices and PLN purchase (Presidential Regulation 112/2022), regional funds for micro-hydro (renewable energy infrastructure DAK), and environmental and social duties (EIA, lender ESMP). Tariff levels by plant type must be read in the regulation annex and are not quoted here.'],
    [HIP + 'status peaker seperti Poso menunjukkan nilai kapasitas dan fleksibilitas dapat dinegosiasikan, bukan hanya harga per kWh.', HIPE + 'peaker status as at Poso shows capacity and flexibility value can be negotiated, not only a per-kWh price.'],
  ) };
  bab['15'] = { tipe: 'langkah', sumber: sm('ed', 'aiib', 'jgslo'), catatan: T('Ringkasan alur umum; durasi dan biaya belum bersumber sehingga sengaja tidak dicantumkan.', 'General flow summary; durations and costs are not sourced and are deliberately omitted.'), butir: [
    { judul: T('Studi awal dan pemilihan lokasi', 'Pre-study and site selection'), isi: T('Cek debit, head, kawasan hutan, lahan adat, dan jarak ke jaringan.', 'Check flow, head, forest estate, customary land and grid distance.'), pelaku: T('Pengembang', 'Developer') },
    { judul: T('Perizinan berusaha dan lingkungan', 'Business and environmental permits'), isi: T('Izin lewat sistem perizinan terintegrasi, persetujuan lingkungan, dan izin penggunaan sumber daya air.', 'Permits through the integrated licensing system, environmental approval and water-use permit.'), pelaku: T('Pengembang, pemerintah pusat/daerah', 'Developer, central/local government') },
    { judul: T('Negosiasi PJBL', 'PPA negotiation'), isi: T('Harga, kapasitas, dan peran (baseload atau peaker) dengan PLN.', 'Price, capacity and role (baseload or peaker) with PLN.'), pelaku: T('Pengembang, PLN', 'Developer, PLN') },
    { judul: T('Financial close dan konstruksi', 'Financial close and construction'), isi: T('Pemenuhan syarat pemberi pinjaman, termasuk ESMP dan jalan akses.', 'Meeting lender conditions, including ESMP and access roads.'), pelaku: T('Pengembang, pendana', 'Developer, lenders') },
    { judul: T('SLO dan COD', 'SLO and COD'), isi: T('Sertifikat laik operasi sebelum operasi komersial.', 'Operation worthiness certificate before commercial operation.'), pelaku: T('Pengembang, lembaga inspeksi', 'Developer, inspection body') },
  ] };
  bab['16'] = { tipe: 'teks', sumber: sm('ruuebet'), paragraf: P(
    ['RUU Energi Baru dan Energi Terbarukan (RUU EBET) berada pada tahap pembahasan menurut arsip METI per 8 September 2026 (audiensi 22 substansi pokok dengan Komisi XII DPR RI). Tahap ini belum dicek ke situs DPR karena situs tersebut melarang perayap.', 'The New and Renewable Energy Bill (RUU EBET) is in the deliberation stage per METI archive as of 8 September 2026 (hearing on 22 core substances with House Commission XII). The stage has not been checked against the DPR site, which blocks crawlers.'],
    ['Forum Konsultasi platform ini memuat RUU tersebut; posisi METI untuk hidro (khususnya PLTA pompa dan tata kelola PLTMH komunitas) bisa diajukan lewat sana.', 'The platform Consultation forum carries this bill; METI positions on hydro (especially pumped storage and community micro-hydro governance) can be submitted there.'],
  ) };
  bab['17'] = { tipe: 'teks', sumber: sm('iea74', 'seawater', 'masdar'), paragraf: P(
    ['Penyimpanan hidro tumbuh paling cepat: IEA memperkirakan tambahan sekitar 74 GW kapasitas PLTA pompa dunia (ringkasan berita 6 November 2026).', 'Pumped storage grows fastest: the IEA forecasts about 74 GW of added global pumped-storage capacity (news summary, 6 November 2026).'],
    ['Di Indonesia, PLN dilaporkan mengkaji PLTA pompa air laut 1 GW (Puger) sementara BESS makin bersaing; per Agustus 2026 lokasi itu belum masuk RUPTL 2025-2034.', 'In Indonesia PLN is reported to study a 1 GW seawater pumped-storage plant (Puger) while BESS competition rises; as of August 2026 it is not in the 2025-2034 RUPTL.'],
    ['Hibrida hidro-surya terapung juga berkembang: PLTS terapung Cirata (Masdar, diresmikan 9 November 2023) memanfaatkan waduk dan transmisi PLTA yang sudah ada.', 'Hydro-floating solar hybrids are also growing: the Cirata floating solar plant (Masdar, inaugurated 9 November 2023) reuses an existing reservoir and hydro transmission.'],
  ) };
  const w = lcoeSeri('air');
  bab['19'] = { tipe: 'grafik', jenis: 'garis', sumber: sm('lcoe'), label: T('LCOE hidro rata-rata global (sen USD 2025 per kWh)', 'Global average hydro LCOE (US cents 2025 per kWh)'), satuan: 'sen/kWh', d: 2, seri: [{ nama: T('Hidro, dunia', 'Hydro, world'), sorot: true, titik: w.map((x) => [String(x.tahun), x.sen_usd_kwh]) }], catatan: T('Berbeda dengan surya, biaya hidro tidak turun mengikuti kurva belajar; hidro adalah teknologi matang dengan biaya spesifik lokasi.', 'Unlike solar, hydro cost has not fallen along a learning curve; hydro is mature and site-specific.') };
  const as = aseanTab('hidro');
  bab['20'] = { tipe: 'tabel', per: 10, sumber: sm('owid'), catatan: T('Porsi hidro dalam pembangkitan listrik 2024 (Ember via Our World in Data).', 'Hydro share of 2024 electricity generation (Ember via Our World in Data).'), kolom: KOL_ASEAN('Porsi hidro (persen)', 'Hydro share (percent)'), baris: as };
  bab['21'] = { tipe: 'teks', sumber: sm('xaya', 'itaipu', 'tgd', 'owid', 'ed'), paragraf: P(
    ['Tiga model besar: Brasil dan Paraguay membangun Itaipu (14 GW) lewat perjanjian binasional 1973; Laos membangun bendungan Mekong untuk ekspor (Xayaburi menjual sekitar 95 persen ke EGAT Thailand) sehingga porsi hidro listrik Laos 76,47 persen; Tiongkok membangun Three Gorges (22,5 GW) dengan perpindahan 1,13 sampai 1,4 juta orang.', 'Three large models: Brazil and Paraguay built Itaipu (14 GW) under a 1973 binational treaty; Laos builds Mekong dams for export (Xayaburi sells about 95 percent to Thailand EGAT), so hydro is 76.47 percent of Laos electricity; China built Three Gorges (22.5 GW) displacing 1.13 to 1.4 million people.'],
    [HIP + 'keberhasilan teknis di ketiganya didahului kerangka kelembagaan yang kuat (perjanjian, pembeli pasti, pendanaan negara); beban sosial dan lintas batas dibayar belakangan. Indonesia berskala lebih kecil dan banyak sungai di pulau terpisah, sehingga model kaskade sedang (seperti Citarum) lebih relevan daripada bendungan raksasa.', HIPE + 'technical success in all three followed a strong institutional frame (treaty, firm buyer, state funding); social and cross-border costs were paid later. Indonesia is smaller with many rivers on separate islands, so medium cascades (like Citarum) are more relevant than mega-dams.'],
  ) };
  const l = as.find((x) => x.n === 'Indonesia');
  bab['22'] = { tipe: 'teks', sumber: sm('owid', 'kap'), paragraf: P(
    [`Porsi hidro Indonesia ${idn.bauran_listrik_persen.hidro.nilai} persen berada di tengah-bawah ASEAN: jauh di bawah Laos (76,47), Myanmar (46,06), Vietnam (33,02), Kamboja (29,90), dan Malaysia (17,52), tetapi di atas Thailand (4,05).`, `Indonesia's hydro share of ${idn.bauran_listrik_persen.hidro.nilai} percent is mid-to-low in ASEAN: far below Laos (76.47), Myanmar (46.06), Vietnam (33.02), Cambodia (29.90) and Malaysia (17.52), but above Thailand (4.05).`],
    [`Rank dalam tabel: ${as.indexOf(l) + 1} dari ${as.length}. Total EBT Indonesia ${idn.bauran_listrik_persen.ebt_total.nilai} persen.`, `Rank in the table: ${as.indexOf(l) + 1} of ${as.length}. Indonesia's total renewable share is ${idn.bauran_listrik_persen.ebt_total.nilai} percent.`],
  ) };
  bab['23'] = { tipe: 'teks', sumber: sm('aiib', 'enerdata', 'btcgs', 'jetp'), paragraf: P(
    ['Kerja sama internasional hidro Indonesia paling jelas pada pembiayaan: Upper Cisokan memakai pinjaman AIIB dan Bank Dunia (satu laporan menyebut pinjaman Kemenkeu USD 380 juta untuk PLN), sedangkan Batang Toru memakai kredit sindikasi bank Tiongkok dipimpin Eximbank (USD 1,251 miliar, perjanjian Maret 2023).', 'International cooperation in Indonesian hydro is clearest in financing: Upper Cisokan uses AIIB and World Bank loans (one report cites a USD 380 million Finance Ministry loan to PLN), while Batang Toru uses a Chinese syndicated loan led by Eximbank (USD 1.251 billion, agreement March 2023).'],
    ['Pendanaan multilateral membawa syarat lingkungan dan sosial yang ketat; pendanaan bilateral Tiongkok cenderung diperiksa lewat tekanan pemegang kepentingan, seperti kasus peninjauan Bank of China 2019.', 'Multilateral funding brings strict environmental and social conditions; Chinese bilateral funding tends to be scrutinised through stakeholder pressure, as in the 2019 Bank of China review.'],
  ) };
  const pr1 = pendRows((x) => (x.sektor || []).includes('hidro') || /pump|hydro|PLTA/i.test(x.nama), 10);
  bab['24'] = { tipe: 'tabel', per: 8, sumber: sm('pendanaan'), catatan: T('Skema dan proyek pendana yang menyebut hidro di basis METI; nilai untuk seluruh program, bukan hanya hidro.', 'Schemes and funder projects naming hydro in the METI base; values are for whole programmes, not hydro alone.'), kolom: PEND_KOL, baris: pr1 };
  bab['25'] = { tipe: 'rumus', sumber: sm('ed', 'lcoe'), rumus: P(
    ['Pendapatan tahunan = energi tahunan (kWh) x tarif (per kWh)', 'Annual revenue = annual energy (kWh) x tariff (per kWh)'],
    ['LCOE = (biaya modal tahunan + biaya O&M tahunan) / energi tahunan', 'LCOE = (annualised capital cost + annual O&M cost) / annual energy'],
  ), contoh: [
    T(`Untuk PLTA contoh ${pMW} MW dengan ${gwh} GWh per tahun, setiap perubahan tarif 1 sen USD per kWh mengubah pendapatan sekitar USD ${rf(gwh * 1e6 * 0.01 / 1000, 0)} ribu per tahun (EST, hitung sendiri; tanpa asumsi tarif karena tarif PJBL tidak dipublikasikan).`, `For the ${pMW} MW example plant with ${gwh} GWh per year, each 1 US cent per kWh tariff change shifts revenue by about USD ${rf(gwh * 1e6 * 0.01 / 1000, 0)} thousand per year (EST, own calculation; no tariff assumed because PPA tariffs are not published).`),
    T('LCOE hidro dunia 2025 sekitar 6,17 sen USD per kWh (IRENA via OWID); biaya lokasi Indonesia berbeda dan belum bersumber.', 'Global hydro LCOE in 2025 is about 6.17 US cents per kWh (IRENA via OWID); Indonesian site costs differ and are not yet sourced.'),
  ] };
  bab['26'] = { tipe: 'tabel', per: 8, sumber: sm('kybn', 'btcgs', 'enerdata', 'tgd', 'xaya'), catatan: T('Angka dari pemberitaan dan ringkasan; bukan nilai kontrak final.', 'Figures from news and summaries; not final contract values.'), kolom: [{ k: 'p', l: T('Proyek', 'Project') }, { k: 'n', l: T('Nilai', 'Value') }, { k: 'k', l: T('Keterangan', 'Note') }], baris: [
    { p: 'Kayan Cascade', n: T('USD 17,8 miliar (Rp 291 triliun)', 'USD 17.8 billion (IDR 291 trillion)'), k: T('Lima bendungan, hingga 9.000 MW; PowerChina dan Sumitomo mundur', 'Five dams, up to 9,000 MW; PowerChina and Sumitomo withdrew') },
    { p: 'Batang Toru (NSHE)', n: T('Kredit USD 1,251 miliar', 'Loan USD 1.251 billion'), k: T('510 MW; Eximbank memimpin; SDIC Power membeli saham 2021', '510 MW; Eximbank leads; SDIC Power bought shares in 2021') },
    { p: 'Upper Cisokan', n: T('Pinjaman Kemenkeu USD 380 juta untuk PLN', 'Finance Ministry loan USD 380 million to PLN'), k: T('1.040 MW; juga pinjaman AIIB dan Bank Dunia', '1,040 MW; also AIIB and World Bank loans') },
    { p: 'Xayaburi', n: T('Sekitar USD 3,5 miliar', 'About USD 3.5 billion'), k: T('1.285 MW; pengembang CH. Karnchang', '1,285 MW; developer CH. Karnchang') },
  ] };
  bab['27'] = { tipe: 'teks', sumber: sm('jgwiki', 'tgd', 'itaipu', 'myit', 'btbhr', 'kybhr', 'aiib'), paragraf: P(
    ['Dampak sosial hidro terbesar adalah perpindahan penduduk: Jatigede sekitar 70.000 orang (lima kecamatan, 30 desa; warga menyebut ganti rugi terlalu rendah), Three Gorges 1,13 sampai 1,4 juta orang, Itaipu sekitar 10.000 keluarga, Myitsone sekitar 11.800 orang di 47 desa.', 'The largest social impact of hydro is displacement: Jatigede about 70,000 people (five districts, 30 villages; residents said compensation was too low), Three Gorges 1.13 to 1.4 million, Itaipu about 10,000 families, Myitsone about 11,800 people in 47 villages.'],
    ['Dampak lingkungan: waduk Three Gorges diperkirakan melepas 359.000 ton CO2 dan 3.810 ton metana per tahun, dan menahan sedimen; Batang Toru terkait habitat satu-satunya orangutan Tapanuli; Kayan terkait desa Long Lejuh dan Long Pelban.', 'Environmental impact: the Three Gorges reservoir is estimated to emit 359,000 t CO2 and 3,810 t methane a year and traps sediment; Batang Toru concerns the only habitat of the Tapanuli orangutan; Kayan concerns Long Lejuh and Long Pelban villages.'],
    ['Pelajaran safeguard: ESMP pemberi pinjaman AIIB untuk Cisokan tercatat berada di jalur kritis jadwal pada Maret 2023, artinya kepatuhan sosial yang telat menunda pekerjaan fisik.', 'Safeguard lesson: the AIIB lender ESMP for Cisokan was on the schedule critical path in March 2023, meaning late social compliance delays physical works.'],
  ) };
  bab['28'] = { tipe: 'teks', sumber: sm('katadata20', 'detikbpk', 'meratus'), paragraf: P(
    ['Kebutuhan tenaga kerja hidro mencakup sipil bendungan, geoteknik, elektromekanik, dan operator terlatih. Untuk PLTMH desa, kesenjangan terbesar bukan pembangunan tetapi pemeliharaan: ESDM sendiri mengakui sebagian pembangkit EBT desa rusak karena SDM pengelola belum siap (sekitar 5 persen dari 719 PLTMH dan PLTS desa menurut Katadata 2020).', 'Hydro labour needs span dam civil works, geotechnics, electromechanics and trained operators. For village micro-hydro the largest gap is maintenance, not construction: the Energy Ministry itself acknowledged some village renewable plants broke because operators were unprepared (about 5 percent of 719 village micro-hydro and solar plants per Katadata 2020).'],
    ['Pelatihan teknisi desa dan skema honor pengelola adalah celah yang bisa diisi LSP, kampus, dan anggota METI; belum ada angka lowongan yang bersumber untuk bab ini.', 'Village technician training and operator stipends are a gap that certification bodies, universities and METI members can fill; no sourced vacancy figures exist for this chapter yet.'],
  ) };
  bab['29'] = { tipe: 'teks', sumber: sm('btbhr', 'btcgs', 'posopeak', 'rricis', 'kybn'), paragraf: P(
    ['Sisi kritik: organisasi masyarakat sipil menilai Batang Toru mengancam habitat tunggal orangutan Tapanuli dan menyoroti jejak pendanaan Tiongkok; pada Kayan, kelompok sipil menyoroti pemindahan desa dan lingkungan.', 'Critics: civil society groups say Batang Toru threatens the sole habitat of the Tapanuli orangutan and highlight Chinese funding; on Kayan they point to village displacement and environmental risk.'],
    ['Sisi pendukung: PLN dan pemerintah menekankan nilai PLTA sebagai pembangkit puncak dan penstabil jaringan di tengah naiknya surya dan bayu (Poso sebagai peaker, Cisokan untuk stabilitas). Tanggapan pengembang Batang Toru dan Kayan belum kami muat; pihak yang disebut dapat mengirim hak jawab.', 'Supporters: PLN and government stress hydro as peaker and grid stabiliser as solar and wind rise (Poso as peaker, Cisokan for stability). Responses from the Batang Toru and Kayan developers are not yet carried; named parties can send a right of reply.'],
  ) };
  bab['30'] = { tipe: 'tabel', per: 8, sumber: sm('ruptl', 'petro', 'kybn'), catatan: T('Target COD memakai skenario RE Base RUPTL; jadwal proyek besar sering bergeser (lihat bab 40).', 'COD targets use the RUPTL RE Base scenario; large project schedules often slip (see chapter 40).'), kolom: [{ k: 'd', l: T('Dokumen dan ukuran', 'Document and measure') }, { k: 'v', l: T('Nilai', 'Value'), num: true, d: 0 }, { k: 'sat', l: T('Satuan', 'Unit') }], baris: [
    { d: T('RUPTL 2025-2034, hidro bernama', 'RUPTL 2025-2034, named hydro'), v: ru.mw_per_teknologi.hidro, sat: 'MW' },
    { d: T('RUPTL 2025-2034, penyimpanan (termasuk PLTA pompa)', 'RUPTL 2025-2034, storage (incl. pumped hydro)'), v: ru.mw_per_teknologi.penyimpanan, sat: 'MW' },
    { d: T('Upper Cisokan, target COD menurut laporan 2026', 'Upper Cisokan, COD target per 2026 report'), v: 2030, sat: T('tahun', 'year') },
    { d: T('Kayan Cascade, rencana penuh', 'Kayan Cascade, full plan'), v: 9000, sat: 'MW' },
  ] };
  bab['31'] = { tipe: 'teks', sumber: sm('ed', 'posobis', 'dak', 'aiib'), paragraf: P(
    [HIP + 'Pengembang: kaskade sedang dan peaker (Poso) lebih layak dibiayai daripada megaproyek bersyarat. Investor: syarat safeguard internasional memberi disiplin tetapi menambah waktu. Pemda: PLTMH komunitas hanya hidup bila pemeliharaan dianggarkan sejak awal. Akademisi: data debit dan sedimen terbuka masih langka.', HIPE + 'Developers: medium cascades and peakers (Poso) are easier to finance than conditional mega-projects. Investors: international safeguards impose discipline but add time. Local government: community micro-hydro survives only if maintenance is budgeted from the start. Academics: open flow and sediment data remain scarce.'],
  ) };
  bab['32'] = { tipe: 'teks', sumber: sm('petro', 'iea74', 'ruuebet', 'kybn', 'ruptl'), paragraf: P(
    ['Yang perlu dipantau: (1) COD Upper Cisokan dan realisasi pencairan pinjaman AIIB/Bank Dunia; (2) pembahasan RUU EBET; (3) mitra baru dan izin Kayan Cascade; (4) kenaikan pumped storage dibanding BESS dalam revisi RUPTL; (5) status operasi komersial Jatigede.', 'To watch: (1) Upper Cisokan COD and AIIB/World Bank loan disbursement; (2) RUU EBET deliberation; (3) new partners and permits for Kayan Cascade; (4) pumped storage versus BESS in RUPTL revisions; (5) commercial operation status of Jatigede.'],
  ) };
  bab['38'] = { tipe: 'teks', sumber: sm('ed'), paragraf: P(
    ['Metode: angka kapasitas dari IRENA, porsi listrik dari Ember via Our World in Data, proyek dari basis METI, kasus dari berita dan ringkasan Wikipedia yang ditautkan. Kasus yang menyebut pihak diberi ruang hak jawab. Sintesis berlabel Analisis METI (Hipotesis). Batas: tarif PJBL, biaya spesifik lokasi, dan keadaan operasi terbaru banyak yang tidak dipublikasikan; sumber berita belum tentu mutakhir per 8 November 2026.', 'Method: capacity figures from IRENA, electricity shares from Ember via Our World in Data, projects from the METI base, cases from linked news and Wikipedia summaries. Cases naming parties carry a right of reply. Synthesis is labelled METI analysis (Hypothesis). Limits: PPA tariffs, site-specific costs and latest operating status are often unpublished; news sources may not be current as of 8 November 2026.'],
  ) };

  const cs = (o) => kasus(o);
  bab['39'] = { tipe: 'kasus', sumber: sm('posobis', 'cmashden', 'cirata', 'itaipu', 'xaya', 'tgd'), catatan: T('Biaya, tarif, dan faktor kapasitas yang tidak ditemukan di sumber sengaja dikosongkan. Kasus luar negeri membawa catatan sosial karena keberhasilan teknis tidak sama dengan keberhasilan sosial.', 'Costs, tariffs and capacity factors not found in sources are deliberately blank. Foreign cases carry social notes because technical success is not social success.'), butir: [
    cs({ id: 'poso', nama: 'PLTA Poso Energy dan Malea', jenis: 'berhasil', lokasi: T('Sulawesi Tengah dan Sulawesi Selatan', 'Central and South Sulawesi'),
      profil: [{ label: T('Kapasitas Poso', 'Poso capacity'), nilai: 515, satuan: 'MW' }, { label: T('Kapasitas Malea', 'Malea capacity'), nilai: 90, satuan: 'MW' }, { label: T('Pemilik', 'Owner'), nilai: T('Grup Kalla (swasta nasional)', 'Kalla Group (national private)') }, { label: T('Peran', 'Role'), nilai: T('Pembangkit peaker untuk sistem Sulawesi', 'Peaker plant for the Sulawesi system') }],
      tindakan: P(['Tahap 1 tiga unit 65 MW beroperasi sejak Desember 2012; ekspansi 4 x 30 MW dan 4 x 50 MW selesai Desember 2021.', 'Phase 1 of three 65 MW units operating since December 2012; expansion of 4 x 30 MW and 4 x 50 MW completed December 2021.'], ['PJBL ekspansi ditandatangani 2017 dan mengubah fungsi menjadi peaker.', 'The expansion PPA was signed in 2017 and changed the role to peaker.']),
      sebab: P(['Dibangun bertahap sehingga tahap awal sudah menghasilkan pendapatan sebelum ekspansi.', 'Built in phases so the first phase already earned revenue before expansion.'], ['Peran peaker memberi PLN nilai kapasitas yang jelas di sistem Sulawesi.', 'The peaker role gives PLN a clear capacity value in the Sulawesi system.'], ['Diresmikan Presiden bersama Malea pada 25 Februari 2022.', 'Inaugurated by the President with Malea on 25 February 2022.']),
      angka: [{ label: T('Kapasitas Poso', 'Poso capacity'), nilai: 515, d: 0, satuan: 'MW', sumber: 'posobis', est: false }, { label: T('Poso dan Malea gabungan', 'Poso and Malea combined'), nilai: 605, d: 0, satuan: 'MW', sumber: 'posobis', est: false }],
      pelajaran: P(['Ekspansi bertahap dengan PJBL jelas menurunkan risiko dibanding satu proyek raksasa.', 'Phased expansion with a clear PPA lowers risk compared with one giant project.'], ['Peran peaker adalah proposisi nilai yang dapat dinegosiasikan.', 'A peaker role is a negotiable value proposition.']),
      faktor: { ppa_tarif: true, jaringan: true, pengelola_om: true }, sumber: ['posobis', 'posoesdm', 'posopeak'], hak_jawab: true }),
    cs({ id: 'citarum', nama: 'Kaskade Citarum: Saguling, Cirata, Jatiluhur', jenis: 'berhasil', lokasi: T('Jawa Barat', 'West Java'),
      profil: [{ label: T('Saguling', 'Saguling'), nilai: 700, satuan: 'MW' }, { label: T('Cirata', 'Cirata'), nilai: 1008, satuan: 'MW' }, { label: T('Jatiluhur', 'Jatiluhur'), nilai: 186.5, satuan: 'MW' }],
      tindakan: P(['Tiga waduk serbaguna berurutan di Sungai Citarum menyalurkan listrik ke sistem Jawa-Bali.', 'Three consecutive multipurpose reservoirs on the Citarum feed the Java-Bali system.'], ['Waduk Cirata kemudian menampung PLTS terapung 192 MWp (Masdar, 2023).', 'The Cirata reservoir later hosts a 192 MWp floating solar plant (Masdar, 2023).']),
      sebab: P(['Waduk serbaguna (irigasi, air baku, listrik) membagi biaya bendungan.', 'Multipurpose reservoirs (irrigation, raw water, power) share dam costs.'], ['Dekat pusat beban Jawa dan transmisi 500 kV yang sudah ada, sehingga hibrida surya terapung bisa menumpang.', 'Close to the Java load centre and existing 500 kV transmission, so floating solar hybrids can piggyback.']),
      angka: [{ label: T('Cirata', 'Cirata'), nilai: 1008, d: 0, satuan: 'MW', sumber: 'cirata', est: false }, { label: T('Saguling', 'Saguling'), nilai: 700, d: 0, satuan: 'MW', sumber: 'saguling', est: false }, { label: T('Jatiluhur', 'Jatiluhur'), nilai: 186.5, d: 1, satuan: 'MW', sumber: 'jatiluhur', est: false }],
      pelajaran: P(['Pembangkit lama berumur panjang dan bernilai tambah bila waduknya dipakai ulang.', 'Old plants last long and add value when their reservoirs are reused.']),
      faktor: { jaringan: true, pengelola_om: true }, sumber: ['cirata', 'saguling', 'jatiluhur', 'masdar'], hak_jawab: true }),
    cs({ id: 'cintamekar', nama: 'PLTMH Cinta Mekar (Subang)', jenis: 'berhasil', lokasi: T('Kabupaten Subang, Jawa Barat', 'Subang Regency, West Java'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: 120, satuan: 'kW' }, { label: T('Pendamping', 'Facilitator'), nilai: T('Yayasan IBEKA', 'IBEKA Foundation') }, { label: T('Pengelola', 'Operator'), nilai: T('Koperasi desa dan investor', 'Village cooperative and investor') }],
      tindakan: P(['Dipasang pada 2005 dengan biaya sekitar USD 180.000 sebagai skema tersambung jaringan pertama IBEKA.', 'Installed in 2005 for about USD 180,000 as IBEKA\'s first grid-connected scheme.'], ['Hasil dibagi antara koperasi desa dan investor setelah biaya operasi.', 'Proceeds are shared between the village cooperative and the investor after operating costs.']),
      sebab: P(['Pengelolaan oleh koperasi desa dengan pembagian hasil yang jelas.', 'Management by a village cooperative with clear revenue sharing.'], ['Advokasi IBEKA disebut ikut mendorong aturan pembelian listrik mikrohidro oleh PLN.', 'IBEKA advocacy is cited as helping shape rules for PLN to buy micro-hydro power.']),
      angka: [{ label: T('Kapasitas umum dikutip', 'Commonly cited capacity'), nilai: 120, d: 0, satuan: 'kW', sumber: 'cmundip', est: false }, { label: T('Biaya pasang (2005)', 'Installation cost (2005)'), nilai: 180000, d: 0, satuan: 'USD', sumber: 'cmashden', est: false }],
      pelajaran: P(['Model usaha desa tersambung jaringan lebih tahan daripada pembangkit hibah tanpa pendapatan.', 'A grid-connected village business model lasts longer than a grant-funded plant with no revenue.'], ['Sumber lain mencatat kapasitas berbeda (116 sampai 156 kW); angka 120 kW paling umum dikutip.', 'Other sources record different capacity (116 to 156 kW); 120 kW is the most commonly cited.']),
      faktor: { ppa_tarif: true, sosial: true, pengelola_om: true }, sumber: ['cmundip', 'cmashden', 'cmwwf'], hak_jawab: true }),
    cs({ id: 'itaipu', nama: 'Itaipu (Brasil dan Paraguay)', jenis: 'berhasil', negara: 'BR', lokasi: T('Sungai Parana, perbatasan Brasil dan Paraguay', 'Parana River, Brazil-Paraguay border'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: 14000, satuan: 'MW' }, { label: T('Unit', 'Units'), nilai: T('20 x 700 MW', '20 x 700 MW') }, { label: T('Unit pertama', 'First unit'), nilai: '1984' }],
      tindakan: P(['Brasil dan Paraguay menandatangani Perjanjian Itaipu pada 26 April 1973 dan membentuk entitas binasional pada 1974.', 'Brazil and Paraguay signed the Itaipu Treaty on 26 April 1973 and created the binational entity in 1974.']),
      sebab: P(['Kerangka perjanjian dua negara dan pembeli pasti.', 'A two-country treaty framework and a firm buyer.'], ['Produksi Paraguay melebihi bebannya sehingga sebagian besar diekspor ke Brasil.', 'Paraguay\'s generation exceeds its load so most is exported to Brazil.']),
      angka: [{ label: T('Rekor produksi tahunan (2016)', 'Record annual output (2016)'), nilai: 103.1, d: 1, satuan: 'TWh', sumber: 'itaipu', est: false }],
      terdampak: T('Sekitar 10.000 keluarga dipindahkan dan Air Terjun Guaira terendam waduk.', 'About 10,000 families were displaced and the Guaira Falls were flooded by the reservoir.'),
      tanda_bahaya: P(['Relokasi besar tanpa kesepakatan sebelumnya menjadi beban sosial jangka panjang.', 'Large resettlement without prior agreement becomes a long-term social burden.']),
      pelajaran: P(['Kerangka kelembagaan dan pembeli pasti membuat proyek raksasa dapat dibiayai, namun biaya sosialnya ikut raksasa.', 'Institutional frame and a firm buyer make giant projects financeable, but social cost is giant too.']),
      faktor: { kepastian_kebijakan: true, ppa_tarif: true }, sumber: ['itaipu'], hak_jawab: true }),
    cs({ id: 'xayaburi', nama: 'Xayaburi (Laos)', jenis: 'berhasil', negara: 'LA', lokasi: T('Sungai Mekong, Laos', 'Mekong River, Laos'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: 1285, satuan: 'MW' }, { label: T('Operasi komersial', 'Commercial operation'), nilai: '2019-10' }, { label: T('Pengembang', 'Developer'), nilai: 'CH. Karnchang' }],
      tindakan: P(['Dibangun sebagai proyek ekspor listrik: sekitar 95 persen dijual ke EGAT Thailand.', 'Built as a power export project: about 95 percent sold to Thailand EGAT.'], ['Konsultasi lintas negara di bawah Mekong River Commission berakhir tanpa konsensus pada April 2011 dan pekerjaan dilanjutkan Juni 2011.', 'Cross-border consultation under the Mekong River Commission ended without consensus in April 2011 and work resumed in June 2011.']),
      sebab: P(['Pembeli pasti di Thailand dan kontraktor pengembang yang sama.', 'A firm buyer in Thailand and a developer-affiliated contractor.']),
      angka: [{ label: T('Biaya sekitar', 'Cost about'), nilai: 3.5, d: 1, satuan: T('miliar USD', 'billion USD'), sumber: 'xaya', est: false }],
      terdampak: T('Pakar WorldFish menyebut belum ada lorong ikan sukses di bendungan tropis sebesar ini; MRC meragukan waduk berfungsi jangka panjang karena sedimen.', 'A WorldFish expert said no successful fish passage exists on a tropical dam this size; the MRC doubted long-term reservoir function because of silt.'),
      tanda_bahaya: P(['Konsultasi lintas batas tanpa konsensus tetapi proyek tetap jalan.', 'Cross-border consultation without consensus but the project proceeds.']),
      pelajaran: P(['Model ekspor berhasil secara komersial; risiko ekologis sungai lintas negara tetap terbuka.', 'The export model is commercially successful; ecological risk on a transboundary river remains open.']),
      faktor: { ppa_tarif: true, jaringan: true, pendanaan: true }, sumber: ['xaya'], hak_jawab: true }),
    cs({ id: 'tgd', nama: 'Three Gorges (Tiongkok)', jenis: 'berhasil', negara: 'CN', lokasi: T('Sungai Yangtze, Hubei', 'Yangtze River, Hubei'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: 22500, satuan: 'MW' }, { label: T('Operasi penuh', 'Fully operational'), nilai: '2012' }],
      tindakan: P(['Proyek negara dengan pengendalian banjir, pelayaran, dan listrik.', 'A state project combining flood control, navigation and power.']),
      sebab: P(['Pendanaan dan keputusan negara terpusat.', 'Centralised state funding and decision.']),
      angka: [{ label: T('Warga dipindahkan (rentang perkiraan)', 'People displaced (estimate range)'), nilai: T('1,13 sampai 1,4 juta', '1.13 to 1.4 million'), d: 0, satuan: '', sumber: 'tgd', est: false }],
      terdampak: T('Perpindahan jutaan warga, longsor di tepi waduk, sedimen tertahan, dan punahnya lumba-lumba baiji.', 'Millions displaced, reservoir-bank landslides, trapped sediment and extinction of the baiji dolphin.'),
      tanda_bahaya: P(['Gempa terpicu waduk dan longsor berulang di tepi.', 'Reservoir-induced seismicity and repeated bank landslides.']),
      pelajaran: P(['Skala terbesar di dunia memperlihatkan biaya sosial dan ekologis yang terukur dan berjangka panjang.', 'The world\'s largest scale shows measurable, long-lived social and ecological costs.']),
      faktor: { kepastian_kebijakan: true, pendanaan: true }, sumber: ['tgd'], hak_jawab: true }),
  ] };
  bab['40'] = { tipe: 'kasus', sumber: sm('btcgs', 'kybn', 'jgsync', 'katadata20', 'petro', 'myit'), catatan: HAK, butir: [
    cs({ id: 'batangtoru', nama: 'PLTA Batang Toru (510 MW)', jenis: 'mundur', lokasi: T('Tapanuli, Sumatera Utara', 'Tapanuli, North Sumatra'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: 510, satuan: 'MW' }, { label: T('Pengembang', 'Developer'), nilai: 'PT North Sumatera Hydro Energy (NSHE)' }],
      kronologi: [{ tanggal: '2017-09-01', teks: T('NSHE menandatangani kredit sindikasi dengan Bank of China, Eximbank, dan bank lain.', 'NSHE signs a syndicated loan with Bank of China, Eximbank and other lenders.') }, { tanggal: '2019-03-14', teks: T('Bank of China menyatakan akan meninjau pendanaan setelah protes habitat orangutan.', 'Bank of China says it will review funding after habitat protests.') }, { tanggal: '2021-01-01', teks: T('Saham Zhefu dijual ke SDIC Power (tahun saja).', 'Zhefu shares sold to SDIC Power (year only).') }, { tanggal: '2023-03-01', teks: T('Perjanjian kredit USD 1,251 miliar dipimpin Eximbank.', 'USD 1.251 billion loan agreement led by Eximbank.') }],
      sebab: P(['Lokasi proyek berada di habitat satu-satunya populasi orangutan Tapanuli.', 'The site lies in the only habitat of the Tapanuli orangutan.'], ['Tekanan publik membuat bank pemberi kredit meninjau ulang dan sebagian mundur.', 'Public pressure led lenders to review and partly withdraw.']),
      terdampak: T('Populasi orangutan Tapanuli dan warga di sekitar lokasi; sumber juga menyebut kekhawatiran atas keselamatan aktivis yang menggugat.', 'The Tapanuli orangutan population and nearby residents; sources also cite concern for the safety of an activist who sued.'),
      seharusnya: T('Penilaian habitat independen dan FPIC dipublikasikan sebelum financial close, serta koridor satwa dalam desain.', 'An independent habitat assessment and FPIC published before financial close, and wildlife corridors in the design.'),
      tanda_bahaya: P(['Proyek di habitat spesies kritis.', 'Project in critical species habitat.'], ['Pemberi kredit utama menyatakan peninjauan.', 'A main lender announces a review.']),
      angka: [{ label: T('Kredit sindikasi Eximbank', 'Eximbank syndicated loan'), nilai: 1.251, d: 3, satuan: T('miliar USD', 'billion USD'), sumber: 'btcgs', est: false }],
      faktor: { sosial: true, pendanaan: true }, sumber: ['btboc', 'btjp', 'btbhr', 'btcgs'], hak_jawab: true }),
    cs({ id: 'kayan', nama: 'Kayan Cascade (hingga 9.000 MW)', jenis: 'mundur', lokasi: T('Kalimantan Utara', 'North Kalimantan'),
      profil: [{ label: T('Rencana', 'Plan'), nilai: T('Lima bendungan, hingga 9.000 MW', 'Five dams, up to 9,000 MW') }, { label: T('Pengembang', 'Developer'), nilai: 'PT Kayan Hydro Energy' }],
      kronologi: [{ tanggal: '2024-06-14', teks: T('Direktur menyatakan pembangunan berlanjut setelah PowerChina dan Sumitomo mundur; mencari mitra baru; PLTA pertama sedang dibangun dekat Long Peso.', 'The director says construction continues after PowerChina and Sumitomo withdrew; seeking new partners; first plant under construction near Long Peso.') }],
      sebab: P(['Mitra investor mundur.', 'Investor partners withdrew.'], ['Pembebasan lahan menjadi hambatan utama.', 'Land acquisition was a major hurdle.'], ['Kementerian ESDM menyebut proyek bukan proyek strategis nasional, bertentangan dengan klaim sebelumnya.', 'The Energy Ministry said it is not a national strategic project, contradicting earlier claims.']),
      terdampak: T('Desa Long Lejuh dan Long Pelban terkait perpindahan; lingkungan Sungai Kayan.', 'Long Lejuh and Long Pelban villages face displacement; Kayan River environment.'),
      seharusnya: T('Kepastian status proyek (strategis atau bukan) dan skema pembiayaan tahap pertama yang lebih kecil sebelum mengumumkan kapasitas penuh.', 'Clarity on project status (strategic or not) and a smaller first-phase financing before announcing full capacity.'),
      tanda_bahaya: P(['Mitra utama mundur.', 'Key partners exit.'], ['Pernyataan pemerintah tidak seragam.', 'Government statements are inconsistent.']),
      angka: [{ label: T('Nilai investasi dilaporkan', 'Reported investment'), nilai: 17.8, d: 1, satuan: T('miliar USD', 'billion USD'), sumber: 'kybhr', est: false }],
      faktor: { pendanaan: true, lahan: true, sosial: true, kepastian_kebijakan: true }, sumber: ['kybn', 'kybhr', 'kyjp', 'kymin'], hak_jawab: true }),
    cs({ id: 'jatigede', nama: 'PLTA Jatigede (2 x 55 MW)', jenis: 'mundur', lokasi: T('Sumedang, Jawa Barat', 'Sumedang, West Java'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: 110, satuan: 'MW' }, { label: T('Waduk mulai diisi', 'Reservoir filling began'), nilai: '2015-08-31' }],
      kronologi: [{ tanggal: '2015-08-31', teks: T('Pengisian waduk dimulai.', 'Reservoir impoundment begins.') }, { tanggal: '2019-12-13', teks: T('Laporan menyebut operasi PLTA tertunda ke 2020; progres 73 persen.', 'Report says plant operation delayed to 2020; 73 percent progress.') }, { tanggal: '2021-04-04', teks: T('Progres dilaporkan 85 persen.', 'Progress reported at 85 percent.') }, { tanggal: '2024-05-11', teks: T('Sinkronisasi pertama; SLO diperoleh Juni 2024.', 'First synchronisation; SLO obtained June 2024.') }],
      sebab: P(['Sumber yang dibaca tidak menyebut satu penyebab tunggal; yang tercatat adalah jadwal operasi yang bergeser dari 2019-2020 menjadi 2024, sembilan tahun setelah waduk terisi.', 'The sources read name no single cause; what is recorded is the operation schedule shifting from 2019-2020 to 2024, nine years after the reservoir filled.']),
      terdampak: T('Sekitar 70.000 warga direlokasi untuk waduk dan menyatakan ganti rugi terlalu rendah; listrik dari waduk tertunda bagi sistem.', 'About 70,000 residents were relocated for the reservoir and said compensation was too low; power from the reservoir was delayed for the system.'),
      seharusnya: T('Menjadwalkan unit pembangkit bersamaan dengan bendungan sejak awal agar aset waduk tidak lama menganggur.', 'Schedule the power unit together with the dam from the start so the reservoir asset is not idle for long.'),
      tanda_bahaya: P(['Progres berulang dilaporkan hampir selesai namun operasi bergeser.', 'Progress repeatedly reported near complete while operation slips.']),
      angka: [{ label: T('Selang waduk terisi hingga sinkronisasi', 'Gap from impoundment to synchronisation'), nilai: 9, d: 0, satuan: T('tahun', 'years'), sumber: 'jgsync', est: true }],
      faktor: {}, sumber: ['jgsync', 'jgslo', 'jg2019', 'jg2021', 'jgwiki'], hak_jawab: true }),
    cs({ id: 'pltmhmati', nama: 'PLTMH desa yang mati', jenis: 'mati', lokasi: T('Berbagai provinsi (Kalimantan Selatan, Nusa Tenggara Barat, dan lain-lain)', 'Various provinces (South Kalimantan, West Nusa Tenggara and others)'),
      profil: [{ label: T('Cakupan bukti', 'Evidence scope'), nilai: T('Laporan BPK 2017, Katadata 2020, Mongabay 2020 dan 2026', 'BPK report 2017, Katadata 2020, Mongabay 2020 and 2026') }],
      kronologi: [{ tanggal: '2017-12-12', teks: T('BPK menemukan pembangkit EBT senilai Rp467 miliar dalam kondisi rusak.', 'BPK finds renewable plants worth IDR 467 billion in damaged condition.') }, { tanggal: '2020-04-17', teks: T('ESDM menyebut sekitar 5 persen dari 719 PLTMH dan PLTS desa rusak dan menjalankan revitalisasi.', 'The Energy Ministry says about 5 percent of 719 village micro-hydro and solar plants are broken and runs revitalisation.') }, { tanggal: '2026-03-01', teks: T('Warga Meratus tidak mampu memperbaiki karena dana desa habis dan belum ada bendung permanen.', 'Meratus residents cannot repair because village funds ran out and there is no permanent weir.') }],
      sebab: P(['Tidak ada pemeliharaan dan anggaran perbaikan.', 'No maintenance and repair budget.'], ['Pengelola belum siap.', 'Operators were unprepared.'], ['Bendung sementara mudah rusak oleh banjir.', 'Temporary weirs are easily damaged by floods.']),
      terdampak: T('Warga desa yang kembali tanpa listrik; anggaran hibah yang terbuang.', 'Villagers back without power; wasted grant budgets.'),
      seharusnya: T('Serah terima hanya bersama pengelola terlatih, rencana keuangan O&M, dan bendung permanen.', 'Hand over only with a trained operator, an O&M financial plan and a permanent weir.'),
      tanda_bahaya: P(['Pembangkit hibah tanpa iuran pelanggan.', 'Grant-funded plant without customer fees.'], ['Alih aset ke daerah tanpa anggaran pemeliharaan.', 'Asset transfer to local government without maintenance budget.']),
      angka: [{ label: T('Nilai pembangkit EBT rusak temuan BPK', 'Value of damaged plants found by BPK'), nilai: 467, d: 0, satuan: T('miliar rupiah', 'billion rupiah'), sumber: 'detikbpk', est: false }],
      faktor: { pengelola_om: true, pendanaan: true }, sumber: ['detikbpk', 'katadata20', 'meratus', 'mongntb'], hak_jawab: true }),
    cs({ id: 'cisokan', nama: 'Upper Cisokan pumped storage (1.040 MW)', jenis: 'mundur', lokasi: T('Bandung Barat dan Cianjur, Jawa Barat', 'West Bandung and Cianjur, West Java'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: 1040, satuan: 'MW' }, { label: T('Pendana', 'Lenders'), nilai: T('AIIB dan Bank Dunia', 'AIIB and World Bank') }],
      kronologi: [{ tanggal: '2023-03-01', teks: T('AIIB mencatat ESMP kontraktor di jalur kritis dan jalan akses ke bendung atas perlu diperbaiki karena longsor.', 'AIIB notes the contractor ESMP is on the critical path and the upper dam access road needs repair due to landslides.') }, { tanggal: '2024-07-24', teks: T('Bisnis melaporkan target 2028 dan koordinasi isu TKDN.', 'Bisnis reports a 2028 target and TKDN coordination.') }, { tanggal: '2026-05-01', teks: T('Laporan 2026 menyebut COD 2030; proyek disebut dikembangkan sejak 1986.', 'A 2026 report states COD 2030; the project is described as developed since 1986.') }],
      sebab: P(['Syarat safeguard pemberi pinjaman di jalur kritis.', 'Lender safeguard conditions on the critical path.'], ['Jalan akses terkena longsor.', 'Landslide damage to the access road.'], ['Isu TKDN perlu dikoordinasikan.', 'TKDN issues needed coordination.']),
      terdampak: T('Sistem Jawa-Bali yang menunggu penyimpanan skala besar; warga sekitar (posko aduan PLN dibangun).', 'The Java-Bali system awaiting large-scale storage; nearby residents (PLN built a complaints post).'),
      seharusnya: T('Menyelesaikan ESMP dan akses sebelum kontrak mengikat, serta menetapkan TKDN di dokumen tender.', 'Complete the ESMP and access before binding contracts, and fix TKDN in tender documents.'),
      tanda_bahaya: P(['Target COD bergeser beberapa kali: 2025, 2027, 2028, 2030 menurut laporan berbeda.', 'COD target moves several times: 2025, 2027, 2028, 2030 per different reports.']),
      angka: [{ label: T('Target COD terbaru yang ditemukan', 'Latest COD target found'), nilai: 2030, d: 0, satuan: T('tahun', 'year'), sumber: 'petro', est: false }],
      faktor: { sosial: true, kepastian_kebijakan: true }, sumber: ['aiib', 'bisnis24', 'petro', 'rricis', 'enerdata'], hak_jawab: true }),
    cs({ id: 'myitsone', nama: 'Myitsone (Myanmar)', jenis: 'mangkrak', negara: 'MM', lokasi: T('Sungai Irrawaddy, Myanmar', 'Irrawaddy River, Myanmar'),
      profil: [{ label: T('Rencana', 'Plan'), nilai: 6000, satuan: 'MW' }, { label: T('Pengembang', 'Developer'), nilai: T('Usaha patungan China Power Investment, Kementerian Listrik Myanmar, Asia World', 'Joint venture of China Power Investment, Myanmar Ministry of Electric Power, Asia World') }],
      kronologi: [{ tanggal: '2009-01-01', teks: T('Konstruksi dimulai (tahun saja).', 'Construction begins (year only).') }, { tanggal: '2011-09-30', teks: T('Presiden Thein Sein menangguhkan proyek untuk menghormati kehendak rakyat.', 'President Thein Sein suspends the project to respect the people\'s will.') }],
      sebab: P(['Penolakan atas dampak lingkungan, risiko gempa, dan pembagian listrik yang timpang antara Myanmar dan Tiongkok.', 'Opposition over environmental impact, earthquake risk and the uneven electricity split between Myanmar and China.']),
      terdampak: T('Sekitar 11.800 orang di 47 desa direncanakan pindah; investor menanggung penangguhan.', 'About 11,800 people in 47 villages were to be relocated; investors bear the suspension.'),
      seharusnya: T('Konsultasi publik dan skema pembagian listrik disepakati sebelum konstruksi.', 'Public consultation and an electricity-sharing scheme agreed before construction.'),
      tanda_bahaya: P(['Pembagian manfaat yang dianggap timpang.', 'Benefit sharing seen as unequal.']),
      angka: [{ label: T('Kapasitas rencana', 'Planned capacity'), nilai: 6000, d: 0, satuan: 'MW', sumber: 'myit', est: false }],
      faktor: { sosial: true, kepastian_kebijakan: true }, sumber: ['myit'], hak_jawab: true }),
  ] };
  bab['41'] = { tipe: 'pola', sumber: sm('ed'), catatan: T('Sel dibangun dari bendera faktor tiap kasus; pemetaan faktor ke kasus adalah analisis METI (Hipotesis) atas fakta di bab 39 dan 40.', 'Cells are built from each case factor flags; mapping factors to cases is METI analysis (Hypothesis) on facts in chapters 39 and 40.'), faktor: FAKTOR_STD.map(([k, a, e]) => L(k, a, e)) };
  bab['42'] = { tipe: 'periksa', sumber: sm('ed'), peran: PERAN, tahap: TAHAP, butir: [
    dasarP('pengembang', 'lokasi', 'Cek keberadaan habitat spesies kritis dan lahan adat sebelum memilih lokasi (kasus Batang Toru).', 'Check for critical species habitat and customary land before choosing a site (Batang Toru case).', 'btbhr'),
    dasarP('pengembang', 'izin', 'Siapkan ESMP dan rencana akses lebih dulu; ESMP pemberi pinjaman dapat menjadi jalur kritis (Cisokan).', 'Prepare the ESMP and access plan first; a lender ESMP can become the critical path (Cisokan).', 'aiib'),
    dasarP('pengembang', 'ppa', 'Negosiasikan peran peaker atau baseload dan pembayaran kapasitas dalam PJBL (Poso).', 'Negotiate peaker or baseload role and capacity payment in the PPA (Poso).', 'posopeak'),
    dasarP('pengembang', 'bangun', 'Bangun bertahap bila memungkinkan agar tahap awal berpendapatan (Poso).', 'Build in phases where possible so early phases earn revenue (Poso).', 'posobis'),
    dasarP('investor', 'dana', 'Pastikan mitra utama terikat sebelum mengumumkan kapasitas penuh (Kayan).', 'Make sure key partners are committed before announcing full capacity (Kayan).', 'kybn'),
    dasarP('investor', 'ppa', 'Tinjau konsultasi lintas batas dan risiko reputasi pemberi kredit (Xayaburi, Batang Toru).', 'Review cross-border consultation and lender reputational risk (Xayaburi, Batang Toru).', 'btjp'),
    dasarP('pemda', 'lokasi', 'Siapkan rencana relokasi dan ganti rugi yang diterima warga sebelum pengisian waduk (Jatigede).', 'Prepare a resettlement and compensation plan acceptable to residents before reservoir filling (Jatigede).', 'jgwiki'),
    dasarP('pemda', 'operasi', 'Anggarkan pemeliharaan PLTMH sebelum menerima alih aset (BPK 2017, Meratus 2026).', 'Budget micro-hydro maintenance before accepting asset transfer (BPK 2017, Meratus 2026).', 'detikbpk'),
    dasarP('pusat', 'ppa', 'Selaraskan status proyek strategis dengan pernyataan resmi agar investor tidak menerima sinyal ganda (Kayan).', 'Align strategic project status with official statements so investors do not get mixed signals (Kayan).', 'kybn'),
    dasarP('pusat', 'bangun', 'Jadwalkan unit pembangkit bersama bendungan agar aset waduk tidak menganggur (Jatigede).', 'Schedule the power unit with the dam so reservoir assets do not sit idle (Jatigede).', 'jgsync'),
    dasarP('pln', 'ppa', 'Tetapkan kebutuhan sistem (peaker, penyimpanan) sebelum tender dan masukkan ke RUPTL.', 'Fix system needs (peaker, storage) before tendering and include them in the RUPTL.', 'ruptl'),
    dasarP('pln', 'operasi', 'Publikasikan jadwal COD yang realistis; Cisokan bergeser dari 2025 sampai 2030.', 'Publish realistic COD schedules; Cisokan moved from 2025 to 2030.', 'petro'),
    dasarP('meti', 'operasi', 'Pantau PLTMH desa yang diserahterimakan dan beri ruang hak jawab bagi pihak yang disebut.', 'Monitor handed-over village micro-hydro and give named parties a right of reply.', 'meratus'),
  ] };
  return {
    id: ID, versi: 1, diperbarui: TGL,
    judul: T('Hidro', 'Hydro'),
    lead: T('PLTA, PLTM, PLTMH, dan PLTA pompa: sumber terbarukan terbesar Indonesia, fleksibel, tetapi paling bergantung pada lahan, sosial, dan jadwal.', 'Large and small hydro and pumped storage: Indonesia\'s largest renewable, flexible, but most dependent on land, community and schedule.'),
    kunci,
    penting: P(
      ['Hidro menyumbang 7,34 persen listrik 2024 dan nilai uniknya adalah fleksibilitas puncak serta penyimpanan.', 'Hydro supplies 7.34 percent of 2024 electricity and its unique value is peaking flexibility and storage.'],
      ['Proyek besar sering bergeser: Jatigede sembilan tahun dari pengisian waduk ke sinkronisasi, Cisokan dari 2025 ke 2030.', 'Large projects often slip: Jatigede took nine years from impoundment to synchronisation, Cisokan moved from 2025 to 2030.'],
      ['PLTMH desa mati karena pemeliharaan, bukan karena teknologi.', 'Village micro-hydro dies from maintenance gaps, not technology.'],
    ),
    posisi: T(`Porsi hidro ${idn.bauran_listrik_persen.hidro.nilai} persen berada di tengah-bawah ASEAN, jauh di bawah Laos, Myanmar, dan Vietnam.`, `A hydro share of ${idn.bauran_listrik_persen.hidro.nilai} percent is mid-to-low in ASEAN, far below Laos, Myanmar and Vietnam.`),
    sumber: Object.fromEntries(Object.entries(SUMBER).filter(([id]) => JSON.stringify({ kunci, bab }).includes(`"${id}"`))),
    bab,
  };
}

export function selftest() {
  const d = susun(); const e = validasi(d);
  if (e.length) throw new Error(e.join('\n'));
  const b = structuredClone(d); b.bab['2'].sumber = ['tak-ada'];
  if (!validasi(b).length) throw new Error('validasi tidak menangkap sumber palsu');
  const c = structuredClone(d); c.penting[0].id = 'a — b';
  if (!validasi(c).length) throw new Error('validasi tidak menangkap em dash');
  const k = structuredClone(d); k.bab['40'].butir[0].hak_jawab = false;
  if (!validasi(k).length) throw new Error('validasi tidak menangkap hak jawab hilang');
  return d;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) { selftest(); console.log('selftest ok'); }
  else {
    const d = susun(); const e = validasi(d); if (e.length) { console.error(e.join('\n')); process.exit(1); }
    fs.writeFileSync(path.join(akar, 'public/data/topik/hidro.json'), JSON.stringify(d, null, 1) + '\n');
    console.log(`bab naskah ${Object.keys(d.bab).length}/41 (+bab 1); mercusuar ${d.bab['39'].butir.length}; gagal ${d.bab['40'].butir.length}; sumber ${Object.keys(d.sumber).length}`);
  }
}
