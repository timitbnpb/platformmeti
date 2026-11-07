// Naskah topik Penyimpanan dan baterai (kerangka 42 bab) mengikuti docs/perencanaan/TOPIK-SKEMA.md.
// Menyusun public/data/topik/penyimpanan.json dari data repo (dihitung, bukan diketik) + sumber publik bertanggal.
// Pakai: node scripts/pipa/topik_penyimpanan.mjs [--selftest]
// Aturan: tiap klaim bersumber (kunci peta sumber); analisis sendiri berlabel "Analisis METI (Hipotesis)"; bab tanpa data dikosongkan; kasus yang menyebut pihak wajib hak jawab.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validasi } from './topik_surya.mjs';
import { lengkapi } from './topik_dalam_lib.mjs';
import { perdalam } from './topik_penyimpanan_dalam.mjs';
export { validasi };
const akar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ID = 'penyimpanan';
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
  aiib: S('AIIB, Project Implementation Monitoring Report: Development of Pumped Storage Hydropower in Java Bali System No.1 (Maret 2023)', 'AIIB', 'https://www.aiib.org/en/projects/details/2023/_download/indonesia/AIIB_PIMR_SBF_Indonesia_P000512_Development_of_Pumped_Storage_Hydropower_in_Java_Bali_System_No1_March_2023_Public_Version.pdf', '2023-03-01', 'resmi'),
  bisnis24: S('Kejar operasi proyek PLTA raksasa di Jawa Barat, PLN koordinasi isu TKDN (24 Jul 2024)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20240724/44/1784945/kejar-operasi-proyek-plta-raksasa-di-jawa-barat-pln-koordinasi-isu-tkdn', '2024-07-24', 'media'),
  iea74: S('IEA forecasts 74 GW increase in global pumped-storage hydropower capacity (6 Nov 2026)', 'Trend.az', 'https://www.trend.az/world/4243656.html', '2026-11-06', 'media'),
  seawater: S('PLN studies 1 GW seawater pumped storage project despite rising BESS competition', 'Petromindo', 'https://www.petromindo.com/news/article/pln-studies-1-gw-seawater-pumped-storage-project-despite-rising-bess-competition', '2026-08-01', 'media'),
  ibc: S('Indonesia government launching 5MW pilot BESS (PLN dan Indonesia Battery Corporation; IBC didirikan Pertamina, Antam, Inalum, PLN)', 'Energy-Storage.news', 'https://www.energy-storage.news/indonesia-government-launching-5mw-pilot-bess', TGL, 'media'),
  ikn: S('PLTS IKN 50 MW resmi beroperasi (BESS 14,2 MWh; diresmikan 20 Jan 2025)', 'Listrik Indonesia', 'https://listrikindonesia.com/detail/15447/plts-50-mw-resmi-beroperasi-di-ikn', '2025-01-20', 'media'),
  hlitempo: S('Jokowi opens Southeast Asia\'s largest EV battery factory in Karawang (3 Jul 2024)', 'Tempo', 'https://en.tempo.co/amp/1886890/indonesias-jokowi-opens-southeast-asias-largest-ev-battery-factory-in-karawang', '2024-07-03', 'media'),
  hliauto: S('Hyundai and LG open battery cell plant in Indonesia (10 GWh per tahun; usaha patungan Hyundai, LG Energy Solution, IBC)', 'Just Auto', 'https://www.just-auto.com/news/hyundai-lg-open-battery-cell-plant-in-indonesia', '2024-07-03', 'media'),
  hlijp: S('Indonesia bets on Southeast Asia\'s first battery plant to become EV hub', 'The Jakarta Post', 'https://www.thejakartapost.com/business/2024/10/27/indonesia-bets-on-southeast-asias-first-battery-plant-to-become-ev-hub', '2024-10-27', 'media'),
  dragon: S('Prabowo groundbreaking mega proyek baterai listrik CATL, Antam, IBC (29 Jun 2025; proyek Dragon, 6,9 GWh tahap I)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20250629/44/1888778/prabowo-groundbreaking-mega-proyek-baterai-listrik-catl-antam-antm-ibc', '2025-06-29', 'media'),
  dragon2: S('CATL breaks ground on USD 5.9 billion new battery plant in Indonesia', 'Reccessary', 'https://reccessary.com/en/news/catl-breaks-ground-new-battery-plant-indonesia', '2025-06-29', 'media'),
  lgjp: S('Govt says China\'s Huayou to replace LGES in EV battery project (24 Apr 2025)', 'The Jakarta Post', 'https://www.thejakartapost.com/business/2025/04/24/govt-says-chinas-huayou-to-replace-lges-in-ev-battery-project', '2025-04-24', 'media'),
  lgscmp: S('Huayou may step in as South Korea\'s LG abandons USD 8.45 billion Indonesia EV battery investment', 'South China Morning Post', 'https://www.scmp.com/business/companies/article/3309683/huayou-may-step-south-koreas-lg-abandons-us845-bn-indonesia-ev-battery-investment', '2025-04-24', 'media'),
  lgpet: S('Huayou takes over Indonesia\'s USD 9.8 billion battery project from LG', 'Petromindo', 'https://petromindo.com/news/article/huayou-takes-over-indonesia-s-9-8-billion-battery-project-from-lg', '2025-04-24', 'media'),
  hprwiki: S('Hornsdale Power Reserve (ringkasan Wikipedia: 100 MW / 129 MWh sejak 1 Des 2017, ekspansi 150 MW / 193,5 MWh pada 2 Sep 2020)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Hornsdale_Power_Reserve', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  hpraurecon: S('Aurecon, Hornsdale Power Reserve Impact Study year 2 (biaya jaringan turun sekitar A$116 juta pada 2019)', 'Aurecon via Hornsdale Power Reserve', 'https://hornsdalepowerreserve.com.au/2020/06/29/hpr-enabling-significant-cost-savings/', '2020-06-29', 'kajian'),
  vbb: S('Victorian Big Battery (ringkasan Wikipedia: 300 MW / 450 MWh, kebakaran Megapack 30 Jul 2021 saat uji)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Victorian_Big_Battery', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  ml: S('Moss Landing Power Plant (ringkasan Wikipedia: fase 1 300 MW / 1.200 MWh terbakar 16 Jan 2025, sekitar 1.200 warga dievakuasi, penyebab belum ditetapkan)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Moss_Landing_Power_Plant', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  mlnews: S('Fire rages at Vistra battery storage facility in Moss Landing (16 Jan 2025)', 'Cal Coast News', 'https://calcoastnews.com/2025/01/fire-rages-at-vistra-battery-storage-facility-in-moss-landing/', '2025-01-16', 'media'),
  cec: S('California Energy Commission, California energy storage system survey (500 MW pada 2018 menjadi lebih dari 16.900 MW pada pertengahan 2025)', 'California Energy Commission', 'https://www.energy.ca.gov/data-reports/energy-almanac/california-electricity-data/california-energy-storage-system-survey', '2025-11-01', 'resmi'),
  cec2: S('California reaches 16,942 MW of battery storage available (Nov 2025)', 'T&D World', 'https://tdworld.com/distributed-energy-resources/energy-storage/news/55331203/california-reaches-16942-mw-of-battery-storage-available', '2025-11-13', 'media'),
  korea: S('Korea\'s ESS fires: batteries not to blame but industry takes hit anyway (sekitar 30 kebakaran ESS dilaporkan setahun)', 'Energy-Storage.news', 'https://www.energy-storage.news/koreas-ess-fires-batteries-not-to-blame-but-industry-takes-hit-anyway/', TGL, 'media'),
};

export function susun() {
  const d0 = dasarJson();
  const ru = baca('public/data/ruptl.json');
  const st = ru.baris.filter((x) => x.teknologi === 'penyimpanan');
  const mw = (x) => x.kapasitas_mw || 0;
  const psh = st.filter((x) => /PS |pump|Cisokan|Grindulu|Matenggeng|Kali/i.test(x.nama));
  const bess = st.filter((x) => !psh.includes(x));
  const sum = (a) => Math.round(a.reduce((s, x) => s + mw(x), 0));
  const totalMW = sum(st), pshMW = sum(psh), bessMW = sum(bess);
  const prov = {}; for (const x of st) if (x.provinsi) { const o = (prov[x.provinsi] ||= { prov: x.provinsi, n: 0, mw: 0 }); o.n++; o.mw += mw(x); }
  const provRows = Object.values(prov).map((o) => ({ ...o, mw: Math.round(o.mw) })).sort((a, b) => b.mw - a.mw);
  const cod = {}; for (const x of st) if (x.cod_tahun) cod[x.cod_tahun] = (cod[x.cod_tahun] || 0) + mw(x);
  const codPts = Object.entries(cod).sort(([a], [b]) => a - b).map(([y, v]) => [String(y), Math.round(v)]);
  const bab = {};
  const rf = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
  const kwhEv = rf(10e6 / 150000, 1);

  const kunci = [
    { label: T('Penyimpanan bernama dalam RUPTL 2025-2034', 'Named storage in RUPTL 2025-2034'), nilai: totalMW, d: 0, satuan: T('MW (BESS dan PLTA pompa)', 'MW (BESS and pumped hydro)'), sumber: 'ruptl', est: false },
    { label: T('Di antaranya PLTA pompa', 'Of which pumped hydro'), nilai: pshMW, d: 0, satuan: T('MW (Cisokan, Matenggeng, Grindulu)', 'MW (Cisokan, Matenggeng, Grindulu)'), sumber: 'ruptl', est: true },
    { label: T('Pabrik sel baterai HLI Green Power', 'HLI Green Power cell factory'), nilai: 10, d: 0, satuan: T('GWh per tahun', 'GWh a year'), sumber: 'hliauto', est: false },
    { label: T('Penyimpanan baterai California (Nov 2025)', 'California battery storage (Nov 2025)'), nilai: 16942, d: 0, satuan: 'MW', sumber: 'cec2', est: false },
    { label: T('Target COD Upper Cisokan menurut laporan 2026', 'Upper Cisokan COD target per 2026 report'), nilai: 2030, d: 0, satuan: T('tahun', 'year'), sumber: 'petro', est: false },
  ];

  bab['2'] = { tipe: 'faq', sumber: sm('ed', 'ruptl', 'hliauto', 'hprwiki'), butir: FQ([
    ['Apa itu BESS?', 'What is a BESS?', 'Battery energy storage system: baterai skala jaringan (kebanyakan lithium-ion) yang mengisi saat listrik murah atau melimpah dan mengalirkan saat dibutuhkan. Dinyatakan dalam MW (daya) dan MWh (energi).', 'Battery energy storage system: grid-scale batteries (mostly lithium-ion) that charge when power is cheap or abundant and discharge when needed. Rated in MW (power) and MWh (energy).'],
    ['Berapa banyak penyimpanan yang direncanakan PLN?', 'How much storage does PLN plan?', `RUPTL 2025-2034 memuat ${st.length} proyek penyimpanan bernama dengan total ${totalMW} MW: sekitar ${bessMW} MW BESS dan ${pshMW} MW PLTA pompa (hitung sendiri dari tabel RUPTL).`, `The 2025-2034 RUPTL lists ${st.length} named storage projects totalling ${totalMW} MW: about ${bessMW} MW of BESS and ${pshMW} MW of pumped hydro (own calculation from the RUPTL tables).`],
    ['Apa itu IBC?', 'What is IBC?', 'Indonesia Battery Corporation, usaha patungan BUMN (Pertamina, Antam, Inalum, PLN) yang menjadi mitra Hyundai dan LG di HLI Green Power dan mitra CATL dan Antam di proyek Dragon.', 'Indonesia Battery Corporation, a state-owned joint venture (Pertamina, Antam, Inalum, PLN) that is partner to Hyundai and LG in HLI Green Power and to CATL and Antam in the Dragon project.'],
    ['Apakah ada pabrik sel baterai di Indonesia?', 'Is there a battery cell factory in Indonesia?', 'Ya. HLI Green Power di Karawang berkapasitas 10 GWh per tahun diresmikan 3 Juli 2024; proyek CATL, Antam, dan IBC dengan 6,9 GWh tahap I dimulai pembangunannya 29 Juni 2025.', 'Yes. HLI Green Power in Karawang with 10 GWh a year was inaugurated on 3 July 2024; the CATL, Antam and IBC project with 6.9 GWh in phase I broke ground on 29 June 2025.'],
    ['Apa beda BESS dan PLTA pompa?', 'What is the difference between BESS and pumped hydro?', 'BESS cepat dibangun dan merespons dalam milidetik, untuk durasi pendek; PLTA pompa lambat dan padat modal, tahan puluhan tahun, untuk durasi panjang.', 'BESS is fast to build and responds in milliseconds, for short durations; pumped hydro is slow and capital-heavy, lasts decades, for long durations.'],
    ['Apakah baterai aman dari kebakaran?', 'Are batteries safe from fire?', 'Risiko nyata: Moss Landing (California) terbakar pada 16 Januari 2025 dan Victorian Big Battery (Australia) terbakar saat uji pada 2021. Standar keselamatan dan jarak dari permukiman menentukan.', 'The risk is real: Moss Landing (California) burned on 16 January 2025 and the Victorian Big Battery (Australia) caught fire during testing in 2021. Safety standards and distance from settlements matter.'],
    ['Apa yang terjadi dengan LG di Indonesia?', 'What happened to LG in Indonesia?', 'LG Energy Solution keluar dari proyek ekosistem baterai bernilai sekitar USD 8,45 miliar pada April 2025; pemerintah menyatakan Huayou akan menggantikan. Lihat bab 40.', 'LG Energy Solution exited a battery ecosystem project worth about USD 8.45 billion in April 2025; government said Huayou would replace it. See chapter 40.'],
    ['Kapan Upper Cisokan beroperasi?', 'When will Upper Cisokan operate?', 'Laporan 2026 menyebut COD 2030; laporan lain sebelumnya menyebut 2025, 2027, atau 2028. Lihat bab 40.', 'A 2026 report states COD 2030; earlier reports said 2025, 2027 or 2028. See chapter 40.'],
  ]) };
  bab['3'] = { tipe: 'glosarium', sumber: sm('ed'), butir: G([
    ['BESS', 'Sistem penyimpanan energi baterai.', 'Battery energy storage system.'], ['MW dan MWh', 'MW adalah daya sesaat; MWh adalah energi yang tersimpan. Durasi = MWh dibagi MW.', 'MW is instantaneous power; MWh is stored energy. Duration = MWh divided by MW.'],
    ['PLTA pompa (PSH)', 'Pumped storage hydropower: menyimpan energi sebagai air di waduk atas.', 'Pumped storage hydropower: stores energy as water in an upper reservoir.'], ['IBC', 'Indonesia Battery Corporation.', 'Indonesia Battery Corporation.'],
    ['Sel baterai', 'Unit elektrokimia terkecil; dirakit menjadi modul dan paket.', 'Smallest electrochemical unit; assembled into modules and packs.'], ['Katoda / anoda', 'Elektroda baterai; katoda memakai nikel, kobalt, mangan atau besi fosfat.', 'Battery electrodes; the cathode uses nickel, cobalt, manganese or iron phosphate.'],
    ['Round-trip efficiency', 'Rasio energi keluar terhadap energi masuk dalam satu siklus.', 'Ratio of energy out to energy in over one cycle.'], ['FCAS', 'Frequency control ancillary services, jasa pengendalian frekuensi.', 'Frequency control ancillary services.'],
    ['Thermal runaway', 'Reaksi panas berantai di sel baterai yang memicu kebakaran.', 'Self-heating chain reaction in a cell that triggers fire.'], ['BMS', 'Battery management system.', 'Battery management system.'],
    ['Arbitrase energi', 'Membeli listrik saat murah dan menjual saat mahal.', 'Buying power when cheap and selling when expensive.'], ['Daur ulang baterai', 'Pemulihan nikel, kobalt, dan lithium dari baterai bekas.', 'Recovery of nickel, cobalt and lithium from used batteries.'],
    ['Hilirisasi', 'Peningkatan nilai tambah komoditas (nikel) di dalam negeri.', 'Domestic value addition on a commodity (nickel).'], ['RE Base', 'Skenario RUPTL yang menjadi dasar tahun COD pada tabel.', 'The RUPTL scenario used for COD years in the tables.'],
    ['ESMP', 'Rencana pengelolaan lingkungan dan sosial.', 'Environmental and social management plan.'], ['SLO', 'Sertifikat Laik Operasi.', 'Operation worthiness certificate.'],
  ]) };
  bab['4'] = { tipe: 'teks', sumber: sm('hprwiki', 'iea74', 'ruptl'), paragraf: P(
    ['Penyimpanan membuat listrik surya dan bayu dapat dipakai saat tak ada matahari dan angin, dan menjaga frekuensi jaringan. Hornsdale di Australia Selatan menunjukkan responsnya sekitar 100 milidetik dibanding 6.000 milidetik pada layanan frekuensi konvensional.', 'Storage lets solar and wind power be used when sun and wind are absent and keeps grid frequency stable. Hornsdale in South Australia showed a response of about 100 milliseconds versus 6,000 milliseconds for conventional frequency services.'],
    [`Indonesia merencanakan ${totalMW} MW penyimpanan dalam RUPTL 2025-2034, tetapi di basis METI belum ada yang berstatus beroperasi: pipeline besar, realisasi baru dimulai.`, `Indonesia plans ${totalMW} MW of storage in the 2025-2034 RUPTL, but none is marked operating in the METI base: a large pipeline with delivery only starting.`],
    ['Topik ini juga mencakup ekosistem baterai nikel (IBC, HLI Green Power, proyek CATL) karena sel baterai Indonesia dipasarkan terutama ke kendaraan listrik, dan BESS jaringan memakai teknologi yang sama.', 'This topic also covers the nickel battery ecosystem (IBC, HLI Green Power, the CATL project) because Indonesian cells are mainly marketed to electric vehicles and grid BESS uses the same technology.'],
  ) };
  bab['5'] = { tipe: 'rumus', sumber: sm('hprwiki', 'hliauto', 'ed'), rumus: P(
    ['Durasi (jam) = kapasitas energi (MWh) / daya (MW)', 'Duration (hours) = energy capacity (MWh) / power (MW)'],
    ['Energi keluar (MWh) = energi masuk (MWh) x efisiensi round-trip', 'Energy out (MWh) = energy in (MWh) x round-trip efficiency'],
    ['Pendapatan arbitrase = energi keluar x harga jual - energi masuk x harga beli', 'Arbitrage revenue = energy out x sell price - energy in x buy price'],
  ), contoh: [
    T('Hornsdale awal 100 MW / 129 MWh berdurasi 1,29 jam; setelah ekspansi 150 MW / 193,5 MWh juga 1,29 jam (EST, hitung sendiri).', 'Original Hornsdale at 100 MW / 129 MWh lasts 1.29 hours; after expansion 150 MW / 193.5 MWh it is also 1.29 hours (EST, own calculation).'),
    T(`Pabrik HLI 10 GWh per tahun disebut cukup untuk lebih dari 150.000 kendaraan listrik; itu setara sekitar ${kwhEv} kWh per kendaraan (EST, hitung sendiri dari angka pemberitaan).`, `The 10 GWh a year HLI plant is described as enough for over 150,000 electric vehicles; that is about ${kwhEv} kWh per vehicle (EST, own calculation from press figures).`),
    T(HIP + 'durasi 2 jam cocok untuk menggeser surya ke malam di sistem kecil; untuk Jawa-Bali durasi lebih panjang dari PLTA pompa tetap dibutuhkan.', HIPE + 'two-hour duration suits shifting solar to evening in small systems; for Java-Bali longer duration from pumped hydro is still needed.'),
  ] };
  bab['6'] = { tipe: 'langkah', sumber: sm('ibc', 'hliauto', 'dragon', 'dragon2'), butir: [
    { judul: T('Penambangan dan pengolahan nikel', 'Nickel mining and processing'), isi: T('Nikel Halmahera Timur diolah menjadi bahan baterai dalam proyek Dragon.', 'East Halmahera nickel is processed into battery materials in the Dragon project.'), pelaku: T('Antam, CBL (CATL/Brunp/Lygend)', 'Antam, CBL (CATL/Brunp/Lygend)') },
    { judul: T('Bahan katoda dan prekursor', 'Cathode and precursor materials'), isi: T('Peleburan dan pembuatan bahan baterai sebelum sel.', 'Smelting and battery materials production before cells.'), pelaku: T('Mitra Tiongkok, BUMN', 'Chinese partners, SOEs') },
    { judul: T('Sel dan paket baterai', 'Cells and packs'), isi: T('Pabrik sel Karawang: HLI Green Power 10 GWh dan proyek CATL 6,9 GWh tahap I.', 'Karawang cell plants: HLI Green Power 10 GWh and the CATL project 6.9 GWh in phase I.'), pelaku: T('Hyundai, LG, IBC, CATL', 'Hyundai, LG, IBC, CATL') },
    { judul: T('Integrasi: kendaraan dan BESS', 'Integration: vehicles and BESS'), isi: T('Sel masuk ke kendaraan listrik dan integrator BESS untuk jaringan PLN.', 'Cells go into EVs and BESS integrators for the PLN grid.'), pelaku: T('Pabrikan otomotif, integrator, PLN', 'Automakers, integrators, PLN') },
    { judul: T('Interkoneksi dan operasi', 'Interconnection and operation'), isi: T('PLN menempatkan BESS di sistem yang butuh penstabil atau pergeseran surya (contoh BESS 14,2 MWh di PLTS IKN).', 'PLN places BESS in systems needing stabilisation or solar shifting (example: 14.2 MWh BESS at the IKN solar plant).'), pelaku: T('PLN, pengembang', 'PLN, developers') },
    { judul: T('Daur ulang', 'Recycling'), isi: T('Proyek Dragon mencakup daur ulang baterai.', 'The Dragon project includes battery recycling.'), pelaku: T('Pengolah, pemerintah', 'Recyclers, government') },
  ] };
  bab['7'] = { tipe: 'grafik', jenis: 'kolom', sumber: sm('ruptl'), label: T('Penyimpanan RUPTL 2025-2034 menurut tahun COD (skenario RE Base)', 'RUPTL 2025-2034 storage by COD year (RE Base scenario)'), satuan: 'MW', d: 0, seri: [{ nama: T('MW per tahun COD', 'MW per COD year'), sorot: true, titik: codPts }], catatan: T('Hanya proyek yang tahun CODnya terbaca di RUPTL; sebagian baris tanpa tahun tidak ikut.', 'Only projects whose COD year is readable in the RUPTL; rows without a year are excluded.') };
  bab['8'] = { tipe: 'tabel', per: 10, sumber: sm('ruptl'), catatan: T('Penyimpanan bernama RUPTL 2025-2034 menurut provinsi (BESS dan PLTA pompa).', 'Named RUPTL 2025-2034 storage by province (BESS and pumped hydro).'), kolom: [{ k: 'prov', l: T('Provinsi', 'Province') }, { k: 'n', l: T('Proyek', 'Projects'), num: true, d: 0 }, { k: 'mw', l: T('Kapasitas (MW)', 'Capacity (MW)'), num: true, d: 0 }], baris: provRows };
  bab['11'] = { tipe: 'teks', sumber: sm('ruptl', 'ikn', 'ibc', 'proyek'), paragraf: P(
    [`Pasar domestik BESS pada dasarnya adalah pesanan PLN: ${st.length} proyek dalam RUPTL (${bessMW} MW BESS), dan di basis METI 0 proyek penyimpanan berstatus beroperasi (2 di antaranya konstruksi, yaitu tahap Cisokan).`, `The domestic BESS market is essentially PLN orders: ${st.length} projects in the RUPTL (${bessMW} MW BESS), and in the METI base 0 storage projects are operating (2 are under construction, the Cisokan phases).`],
    ['Contoh BESS beroperasi di luar basis proyek: 14,2 MWh di PLTS IKN 50 MW (diresmikan 20 Januari 2025) dan pilot 5 MW antara PLN dan IBC.', 'Examples of operating BESS outside the project base: 14.2 MWh at the 50 MW IKN solar plant (inaugurated 20 January 2025) and a 5 MW pilot between PLN and IBC.'],
  ) };
  const R = (id, dok, a, b) => regRow(d0, id, dok, a, b);
  bab['12'] = { tipe: 'tabel', per: 8, sumber: sm('regul', 'ruptl'), kolom: [{ k: 'dok', l: T('Peraturan', 'Regulation'), url: 'u' }, { k: 'ttg', l: T('Tentang', 'About') }, { k: 'st', l: T('Status', 'Status') }], baris: [
    R('perpres-55-2019', 'Perpres 55/2019', 'Percepatan program kendaraan bermotor listrik berbasis baterai (dasar ekosistem baterai)', 'Accelerating the battery electric vehicle programme (basis of the battery ecosystem)'),
    R('perpres-79-2023', 'Perpres 79/2023', 'Perubahan Perpres 55/2019', 'Amendment of Perpres 55/2019'),
    R('permen-klhk-12-2021', 'Permen LHK 12/2021', 'Baku mutu emisi daur ulang baterai lithium', 'Emission standards for lithium battery recycling'),
    R('permen-b160462-100-2020', 'Permen 100/2020', 'Impor baterai lithium tidak baru sebagai bahan baku (dicabut)', 'Import of non-new lithium batteries as raw material (revoked)'),
    R('permen-kemenperin-6-2022', 'Permenperin 6/2022', 'Spesifikasi, peta jalan, dan penghitungan TKDN kendaraan bermotor listrik', 'Specifications, roadmap and local content calculation for electric vehicles'),
    { dok: 'RUPTL 2025-2034', ttg: T('Rencana penyimpanan PLN (BESS dan PLTA pompa) sebagai dasar pengadaan', 'PLN storage plan (BESS and pumped hydro) as procurement basis'), st: 'berlaku', u: SUMBER.ruptl.url },
  ] };
  bab['13'] = { tipe: 'linimasa', sumber: sm('hprwiki', 'vbb', 'hlitempo', 'ml', 'lgjp', 'dragon', 'ruptl', 'petro'), butir: [
    { tanggal: '2017-12-01', judul: T('Hornsdale tersambung ke jaringan (100 MW / 129 MWh)', 'Hornsdale connects to the grid (100 MW / 129 MWh)'), url: SUMBER.hprwiki.url },
    { tanggal: '2020-09-02', judul: T('Ekspansi Hornsdale beroperasi (150 MW / 193,5 MWh)', 'Hornsdale expansion operational (150 MW / 193.5 MWh)'), url: SUMBER.hprwiki.url },
    { tanggal: '2021-07-30', judul: T('Megapack terbakar saat uji Victorian Big Battery', 'Megapack fire during Victorian Big Battery testing'), url: SUMBER.vbb.url },
    { tanggal: '2024-07-03', judul: T('HLI Green Power diresmikan di Karawang', 'HLI Green Power inaugurated in Karawang'), url: SUMBER.hlitempo.url },
    { tanggal: '2025-01-16', judul: T('Kebakaran fase 1 Moss Landing', 'Moss Landing phase 1 fire'), url: SUMBER.ml.url },
    { tanggal: '2025-04-24', judul: T('LG keluar, pemerintah menyebut Huayou pengganti', 'LG exits, government names Huayou replacement'), url: SUMBER.lgjp.url },
    { tanggal: '2025-05-26', judul: T('RUPTL 2025-2034 disahkan lewat Kepmen ESDM 188.K', 'RUPTL 2025-2034 approved through Energy Ministry Decree 188.K'), url: SUMBER.ruptl.url },
    { tanggal: '2025-06-29', judul: T('Groundbreaking proyek Dragon CATL, Antam, IBC', 'Groundbreaking of the CATL, Antam, IBC Dragon project'), url: SUMBER.dragon.url },
    { tanggal: '2030-01-01', judul: T('Target COD Upper Cisokan menurut laporan 2026 (tahun saja)', 'Upper Cisokan COD target per a 2026 report (year only)'), url: SUMBER.petro.url },
  ] };
  bab['14'] = { tipe: 'teks', sumber: sm('regul', 'dragon', 'ruptl'), paragraf: P(
    ['Dasar kebijakan ekosistem baterai adalah program kendaraan listrik berbasis baterai (Perpres 55/2019 dan perubahannya 79/2023), kewajiban TKDN, dan agenda hilirisasi; Bahlil menyebut proyek Dragon sebagai yang pertama dari 18 proyek hilirisasi prioritas.', 'The policy basis of the battery ecosystem is the battery electric vehicle programme (Perpres 55/2019 and amendment 79/2023), local content rules and the downstreaming agenda; Bahlil called the Dragon project the first of 18 priority downstreaming projects.'],
    ['Untuk BESS jaringan, insentif utama adalah pembelian oleh PLN lewat RUPTL; insentif fiskal khusus penyimpanan tidak ditemukan di sumber yang dibaca. Standar emisi daur ulang baterai ada di Permen LHK 12/2021.', 'For grid BESS the main incentive is PLN procurement through the RUPTL; no storage-specific fiscal incentive was found in the sources read. Battery recycling emission standards sit in Environment Ministry Reg. 12/2021.'],
  ) };
  bab['15'] = { tipe: 'langkah', sumber: sm('ed', 'ml', 'ruptl'), catatan: T('Ringkasan alur umum; durasi dan biaya belum bersumber sehingga sengaja tidak dicantumkan.', 'General flow summary; durations and costs are not sourced and are deliberately omitted.'), butir: [
    { judul: T('Penentuan lokasi dan studi interkoneksi', 'Siting and interconnection study'), isi: T('Pilih gardu induk atau PLTS yang butuh penyimpanan dan jauhkan dari permukiman.', 'Choose a substation or solar plant needing storage and keep clear of settlements.'), pelaku: T('Pengembang, PLN', 'Developer, PLN') },
    { judul: T('Perizinan dan persetujuan lingkungan', 'Permits and environmental approval'), isi: T('Izin berusaha, lingkungan, dan rencana keselamatan kebakaran.', 'Business and environmental permits and a fire safety plan.'), pelaku: T('Pengembang, pemda', 'Developer, local government') },
    { judul: T('Kontrak dengan PLN', 'Contract with PLN'), isi: T('Perjanjian layanan penyimpanan atau jual beli energi sesuai RUPTL.', 'Storage service or energy sale agreement per RUPTL.'), pelaku: T('PLN, pengembang', 'PLN, developer') },
    { judul: T('Pengadaan dan konstruksi', 'Procurement and construction'), isi: T('Pilih sel, integrator, dan sistem pemadam; uji bertahap (kasus Victorian Big Battery terbakar saat uji).', 'Choose cells, integrator and suppression; staged testing (Victorian Big Battery caught fire during testing).'), pelaku: T('Kontraktor EPC', 'EPC contractor') },
    { judul: T('SLO dan operasi', 'SLO and operation'), isi: T('Sertifikat laik operasi, pemantauan suhu, dan rencana darurat.', 'Operation certificate, temperature monitoring and emergency plan.'), pelaku: T('Operator', 'Operator') },
  ] };
  bab['16'] = { tipe: 'teks', sumber: sm('ruuebet', 'ml'), paragraf: P(
    ['RUU EBET sedang dibahas (arsip METI 8 September 2026; tahap belum dicek ke situs DPR). Standar keselamatan penyimpanan menjadi isu legislasi di tempat lain: California mengadopsi standar dan undang-undang baru setelah Moss Landing.', 'RUU EBET is under deliberation (METI archive 8 September 2026; stage not checked against the DPR site). Storage safety standards became a legislative issue elsewhere: California adopted new standards and legislation after Moss Landing.'],
    ['Masukan yang layak diajukan lewat forum Konsultasi: standar keselamatan BESS, definisi penyimpanan sebagai layanan jaringan, dan tarif layanan frekuensi.', 'Inputs worth submitting through the Consultation forum: BESS safety standards, defining storage as a grid service and tariffs for frequency services.'],
  ) };
  bab['17'] = { tipe: 'teks', sumber: sm('iea74', 'hprwiki', 'seawater', 'dragon', 'hliauto'), paragraf: P(
    ['PLTA pompa tumbuh lagi: IEA memperkirakan tambahan sekitar 74 GW kapasitas dunia. PLN dilaporkan mengkaji PLTA pompa air laut 1 GW (Puger), sementara persaingan BESS menguat.', 'Pumped hydro is growing again: the IEA forecasts about 74 GW of added global capacity. PLN is reported to study a 1 GW seawater pumped hydro (Puger) while BESS competition strengthens.'],
    ['Respons cepat baterai adalah inovasi terbukti: Hornsdale merespons dalam sekitar 100 milidetik dan memberi layanan frekuensi. Di sisi sel, pabrik Karawang berkapasitas 10 GWh dan 6,9 GWh tahap I menambah kemampuan produksi lokal.', 'Fast battery response is a proven innovation: Hornsdale responds in about 100 milliseconds and delivers frequency services. On cells, Karawang plants of 10 GWh and 6.9 GWh in phase I add local production ability.'],
    ['Jenis kimia sel (LFP, NMC, natrium-ion) dan biayanya belum bersumber di bab ini.', 'Cell chemistries (LFP, NMC, sodium-ion) and their cost are not sourced in this chapter.'],
  ) };
  bab['19'] = { tipe: 'tabel', per: 6, sumber: sm('hprwiki'), catatan: T('Satu-satunya data biaya penyimpanan bersumber di bab ini; angka biaya Hornsdale awal bertentangan di sumber (A$90 juta atau A$172 juta). Biaya BESS Indonesia belum bersumber.', 'The only sourced storage cost data in this chapter; the original Hornsdale cost conflicts in the source (A$90 million or A$172 million). Indonesian BESS cost is not sourced.'), kolom: [{ k: 'p', l: T('Proyek', 'Project') }, { k: 'b', l: T('Biaya (juta A$)', 'Cost (A$ million)'), num: true, d: 0 }, { k: 'e', l: T('Energi (MWh)', 'Energy (MWh)'), num: true, d: 1 }, { k: 'u', l: T('Biaya per MWh (juta A$, EST)', 'Cost per MWh (A$ million, EST)'), num: true, d: 2 }], baris: [
    { p: T('Hornsdale awal (angka latar)', 'Hornsdale original (background figure)'), b: 90, e: 129, u: rf(90 / 129) },
    { p: T('Hornsdale awal (angka kotak info)', 'Hornsdale original (infobox figure)'), b: 172, e: 129, u: rf(172 / 129) },
    { p: T('Ekspansi Hornsdale 2020', 'Hornsdale expansion 2020'), b: 82, e: 64.5, u: rf(82 / 64.5) },
  ] };
  bab['20'] = { tipe: 'tabel', per: 8, sumber: sm('hprwiki', 'cec', 'cec2', 'korea', 'ruptl'), catatan: T('Pembanding terpilih; bukan peringkat lengkap.', 'Selected comparators; not a full ranking.'), kolom: [{ k: 'n', l: T('Wilayah', 'Region') }, { k: 'f', l: T('Fakta kunci', 'Key fact') }, { k: 'h', l: T('Pelajaran', 'Lesson') }], baris: [
    { n: T('Australia Selatan', 'South Australia'), f: T('Hornsdale 150 MW / 193,5 MWh; biaya layanan frekuensi turun 91 persen pada 2019', 'Hornsdale 150 MW / 193.5 MWh; frequency service cost fell 91 percent in 2019'), h: T('Penyimpanan paling bernilai sebagai layanan jaringan', 'Storage is most valuable as a grid service') },
    { n: 'California', f: T('500 MW pada 2018 menjadi 16.942 MW pada November 2025', '500 MW in 2018 to 16,942 MW in November 2025'), h: T('Skala dibangun oleh penyimpanan di jam malam', 'Scale built by evening-hour storage') },
    { n: T('Korea Selatan', 'South Korea'), f: T('Sekitar 30 kebakaran ESS dilaporkan dalam satu tahun', 'About 30 ESS fires reported in one year'), h: T('Keselamatan dapat menghentikan pasar', 'Safety can halt a market') },
    { n: 'Indonesia', f: T(`${st.length} proyek ${totalMW} MW di RUPTL, belum ada yang beroperasi di basis`, `${st.length} projects ${totalMW} MW in RUPTL, none operating in the base`), h: T('Pipeline belum menjadi realisasi', 'Pipeline is not yet delivery') },
  ] };
  bab['21'] = { tipe: 'teks', sumber: sm('hprwiki', 'hpraurecon', 'cec', 'cec2', 'ml'), paragraf: P(
    ['Australia Selatan dan California menunjukkan dua jalur sukses: layanan frekuensi dengan pasar yang mengganjar kecepatan (Hornsdale menekan biaya jaringan sekitar A$116 juta pada 2019 menurut Aurecon), dan pergeseran surya ke malam dalam skala puluhan GW.', 'South Australia and California show two success paths: frequency services in a market that rewards speed (Hornsdale cut grid costs by about A$116 million in 2019 per Aurecon), and shifting solar to evening at tens of GW.'],
    ['Pelajaran gagalnya adalah keselamatan: kebakaran Moss Landing (2025) dan Victorian Big Battery (2021) memaksa aturan dan jeda uji. Indonesia sebaiknya menetapkan standar jarak, pemadam, dan uji bertahap sebelum memperbanyak BESS.', 'The failure lesson is safety: the Moss Landing (2025) and Victorian Big Battery (2021) fires forced rules and testing pauses. Indonesia should set distance, suppression and staged-testing standards before scaling BESS.'],
  ) };
  bab['22'] = { tipe: 'teks', sumber: sm('ruptl', 'cec2', 'proyek'), paragraf: P(
    [`Indonesia merencanakan ${totalMW} MW penyimpanan pada 2025-2034 sedangkan California sudah memiliki 16.942 MW baterai pada November 2025; dalam basis METI belum ada proyek penyimpanan yang berstatus beroperasi.`, `Indonesia plans ${totalMW} MW of storage over 2025-2034 while California already has 16,942 MW of batteries by November 2025; no storage project in the METI base is marked operating.`],
    ['Pada rantai nilai sel, Indonesia lebih maju: sudah memiliki pabrik sel 10 GWh (Karawang) dan membangun yang kedua.', 'On the cell value chain Indonesia is ahead: it already has a 10 GWh cell factory (Karawang) and is building a second.'],
  ) };
  bab['23'] = { tipe: 'teks', sumber: sm('aiib', 'hliauto', 'dragon', 'lgjp'), paragraf: P(
    ['Kerja sama internasional bersifat industri dan pendanaan: Korea (Hyundai dan LG Energy Solution di HLI), Tiongkok (CATL, Brunp, Lygend, Huayou), dan pinjaman AIIB serta Bank Dunia untuk Upper Cisokan.', 'International cooperation is industrial and financial: Korea (Hyundai and LG Energy Solution in HLI), China (CATL, Brunp, Lygend, Huayou), and AIIB and World Bank loans for Upper Cisokan.'],
    [HIP + 'perpindahan dari mitra Korea ke Tiongkok pada paket sekitar USD 8,45 miliar menunjukkan Indonesia menukar pemasok teknologi untuk mempertahankan peta jalan; pertanyaan terbuka adalah transfer teknologi dan TKDN.', HIPE + 'the shift from a Korean to a Chinese partner on a package of about USD 8.45 billion shows Indonesia swapping technology suppliers to keep its roadmap; open questions are technology transfer and local content.'],
  ) };
  const pr1 = pendRows((x) => /baterai|battery|storage|pump|penyimpan/i.test(x.nama), 10);
  bab['24'] = { tipe: 'tabel', per: 8, sumber: sm('pendanaan'), catatan: T('Skema dan proyek pendana yang namanya menyebut baterai atau penyimpanan di basis METI.', 'Funder schemes and projects whose names mention batteries or storage in the METI base.'), kolom: PEND_KOL, baris: pr1 };
  bab['25'] = { tipe: 'rumus', sumber: sm('hpraurecon', 'hprwiki', 'ed'), rumus: P(
    ['Pendapatan proyek = jasa kapasitas + jasa frekuensi + arbitrase energi', 'Project revenue = capacity service + frequency service + energy arbitrage'],
    ['Manfaat sistem = penghematan biaya layanan frekuensi dan biaya kurtailmen yang dihindari', 'System benefit = frequency service cost savings plus avoided curtailment cost'],
  ), contoh: [
    T('Hornsdale: biaya layanan frekuensi turun dari A$470 per MWh menjadi A$40 per MWh (turun 91 persen) pada 2019, dengan penghematan jaringan sekitar A$116 juta (Aurecon, via Wikipedia).', 'Hornsdale: frequency service cost fell from A$470 per MWh to A$40 per MWh (down 91 percent) in 2019, with grid savings of about A$116 million (Aurecon, via Wikipedia).'),
    T('Di Indonesia pasar layanan frekuensi dan kapasitas untuk BESS belum terbentuk; pendapatan bergantung kontrak PLN. Angka ekonomi proyek Indonesia belum bersumber.', 'In Indonesia a frequency and capacity service market for BESS is not formed; revenue depends on PLN contracts. Indonesian project economics are not yet sourced.'),
  ] };
  bab['26'] = { tipe: 'tabel', per: 8, sumber: sm('dragon2', 'lgscmp', 'hlitempo', 'ml'), catatan: T('Nilai dari pemberitaan yang kadang berbeda antar media; bukan audit.', 'Values from press that sometimes differ between outlets; not audited.'), kolom: [{ k: 'p', l: T('Proyek', 'Project') }, { k: 'n', l: T('Nilai', 'Value') }, { k: 'k', l: T('Keterangan', 'Note') }], baris: [
    { p: T('Proyek Dragon CATL, Antam, IBC', 'CATL, Antam, IBC Dragon project'), n: 'USD 5,9 sampai 6 miliar', k: T('Groundbreaking 29 Juni 2025; Karawang 6,9 GWh tahap I', 'Groundbreaking 29 June 2025; Karawang 6.9 GWh phase I') },
    { p: T('Paket proyek yang ditinggalkan LG', 'Package LG abandoned'), n: T('Sekitar USD 8,45 miliar', 'About USD 8.45 billion'), k: T('SCMP; sumber lain menyebut USD 9,8 miliar', 'SCMP; other sources say USD 9.8 billion') },
    { p: 'HLI Green Power', n: T('USD 1,1 miliar (sumber lain USD 3,1 miliar dari Tempo)', 'USD 1.1 billion (Tempo reports USD 3.1 billion)'), k: T('10 GWh per tahun; diresmikan 3 Juli 2024', '10 GWh a year; inaugurated 3 July 2024') },
    { p: 'Moss Landing (kebakaran)', n: T('Penghapusan buku USD 400 juta (Vistra)', 'USD 400 million write-off (Vistra)'), k: T('Menurut ringkasan Wikipedia', 'Per Wikipedia summary') },
  ] };
  bab['27'] = { tipe: 'teks', sumber: sm('ml', 'dragon', 'ml'), paragraf: P(
    ['Dampak kebakaran Moss Landing: sekitar 1.200 warga dievakuasi; sampel udara permukaan tidak menemukan hidrogen fluorida, tetapi peneliti melaporkan kadar nikel, magnesium, dan kobalt yang sangat meningkat di sekitar lokasi.', 'Moss Landing fire impacts: about 1,200 residents evacuated; ground air samples found no hydrogen fluoride, but researchers reported sharply elevated nickel, magnesium and cobalt near the site.'],
    ['Rantai pasok baterai Indonesia membawa isu tambang nikel di Halmahera Timur, peleburan, dan limbah; proyek Dragon juga mencakup daur ulang. Dampak lingkungan dan sosial tambang belum bersumber di bab ini dan perlu ditambah.', 'The Indonesian battery supply chain brings issues of nickel mining in East Halmahera, smelting and waste; the Dragon project also includes recycling. Environmental and social impacts of mining are not sourced in this chapter and need to be added.'],
  ) };
  bab['29'] = { tipe: 'teks', sumber: sm('korea', 'ml', 'lgjp', 'hpraurecon', 'dragon'), paragraf: P(
    ['Keselamatan: pendukung menunjuk bahwa studi Korea menyimpulkan baterai bukan penyebab satu-satunya kebakaran ESS (judul laporan), tetapi industri tetap terpukul; Moss Landing penyebabnya belum ditetapkan.', 'Safety: supporters point out Korean investigations concluded batteries were not the sole cause of ESS fires (report headline) yet the industry took a hit; the Moss Landing cause is still undetermined.'],
    ['Industrialisasi: pemerintah menyebut pergantian investor lazim dalam proyek besar dan peta jalan tetap; kritik menyoroti ketergantungan pada mitra asing dan keberanian mundur LG yang menyebut kondisi pasar dan lingkungan investasi.', 'Industrialisation: government says changing investors is common in large projects and the roadmap stays; critics note dependence on foreign partners and LG\'s willingness to exit citing market conditions and investment climate.'],
  ) };
  bab['30'] = { tipe: 'tabel', per: 8, sumber: sm('ruptl', 'iea74', 'cec', 'petro', 'dragon'), catatan: T('Target adalah rencana dan sering bergeser.', 'Targets are plans and often slip.'), kolom: [{ k: 'd', l: T('Rencana', 'Plan') }, { k: 'v', l: T('Nilai', 'Value'), num: true, d: 0 }, { k: 'sat', l: T('Satuan', 'Unit') }], baris: [
    { d: T('RUPTL 2025-2034: penyimpanan bernama', 'RUPTL 2025-2034: named storage'), v: totalMW, sat: 'MW' },
    { d: T('Dunia: tambahan PLTA pompa (perkiraan IEA)', 'World: added pumped hydro (IEA forecast)'), v: 74000, sat: 'MW' },
    { d: T('California: kebutuhan baterai pada 2045 (proyeksi negara bagian)', 'California: battery need by 2045 (state projection)'), v: 52000, sat: 'MW' },
    { d: T('Upper Cisokan: target COD menurut laporan 2026', 'Upper Cisokan: COD target per 2026 report'), v: 2030, sat: T('tahun', 'year') },
  ] };
  bab['31'] = { tipe: 'teks', sumber: sm('ed', 'ml', 'ruptl'), paragraf: P(
    [HIP + 'Pengembang: nilai BESS ada pada layanan jaringan yang dikontrakkan, bukan pada arbitrase. Pemasok: prioritaskan sertifikasi keselamatan dan rencana pemadam sebelum menawarkan harga. PLN: tetapkan jenis layanan (frekuensi, geser surya, kapasitas) di tender. Pemda: tentukan jarak aman dan rencana darurat. Akademisi: data degradasi sel di iklim tropis masih langka.', HIPE + 'Developers: BESS value lies in contracted grid services, not arbitrage. Suppliers: put safety certification and suppression plans before price. PLN: specify the service (frequency, solar shifting, capacity) in tenders. Local government: define safe distance and emergency plans. Academics: cell degradation data in tropical climates is scarce.'],
  ) };
  bab['32'] = { tipe: 'teks', sumber: sm('petro', 'dragon', 'lgjp', 'ruptl', 'ml'), paragraf: P(
    ['Yang perlu dipantau: (1) COD Upper Cisokan; (2) produksi pertama proyek Dragon di Karawang (laporan Juni 2026 menyebut pabrik selesai, belum terverifikasi); (3) penjelasan tentang pengganti LG di paket proyek; (4) BESS pertama RUPTL yang beroperasi; (5) hasil penyelidikan penyebab Moss Landing.', 'To watch: (1) Upper Cisokan COD; (2) first production of the Dragon project in Karawang (a June 2026 report says the plant is complete, unverified); (3) details of LG\'s replacement in the package; (4) the first RUPTL BESS in operation; (5) the Moss Landing cause investigation.'],
  ) };
  bab['38'] = { tipe: 'teks', sumber: sm('ed'), paragraf: P(
    ['Metode: proyek dan MW dari tabel RUPTL yang diolah repo (dihitung ulang, ditandai EST), kasus luar negeri dari ringkasan Wikipedia dan berita yang ditautkan, dan kebijakan dari basis regulasi METI. Beberapa halaman (Energy-Storage.news, Bisnis, ADB) memblokir pengambilan otomatis; isinya hanya dipakai lewat ringkasan pencarian dan ditandai tingkat bukti media. Sintesis berlabel Analisis METI (Hipotesis). Batas: biaya BESS Indonesia, tarif, dan tenaga kerja belum ditemukan; status produksi proyek Dragon belum terverifikasi.', 'Method: projects and MW from RUPTL tables processed by the repo (recomputed, marked EST), foreign cases from linked Wikipedia summaries and news, and policy from the METI regulation base. Some pages (Energy-Storage.news, Bisnis, ADB) block automated fetching; their content was used only through search summaries and marked media evidence level. Synthesis is labelled METI analysis (Hypothesis). Limits: Indonesian BESS cost, tariffs and employment were not found; production status of the Dragon project is unverified.'],
  ) };

  const cs = kasus;
  bab['39'] = { tipe: 'kasus', sumber: sm('hliauto', 'ikn', 'dragon', 'hprwiki', 'cec'), catatan: T('Biaya Indonesia yang tidak ditemukan sengaja dikosongkan. Proyek Dragon baru pada tahap awal dan belum terbukti berproduksi; ia dimuat sebagai pola struktur kemitraan.', 'Indonesian costs not found are deliberately blank. The Dragon project is at an early stage and not yet proven in production; it is included as a partnership-structure pattern.'), butir: [
    cs({ id: 'hli', nama: 'HLI Green Power (Karawang)', jenis: 'berhasil', lokasi: T('Karawang, Jawa Barat', 'Karawang, West Java'),
      profil: [{ label: T('Kapasitas sel', 'Cell capacity'), nilai: 10, satuan: T('GWh per tahun', 'GWh a year') }, { label: T('Pemilik', 'Owners'), nilai: T('Hyundai, LG Energy Solution, IBC', 'Hyundai, LG Energy Solution, IBC') }, { label: T('Diresmikan', 'Inaugurated'), nilai: '2024-07-03' }],
      tindakan: P(['Usaha patungan dimulai September 2021, produksi uji akhir 2022, produksi sel pada kuartal II 2024.', 'Joint venture started September 2021, trial production late 2022, cell production in Q2 2024.']),
      sebab: P(['Mitra teknologi (LG) dan pembeli yang sudah ada (pabrik mobil Hyundai di Indonesia memakai sel untuk Kona Electric).', 'A technology partner (LG) and an existing buyer (Hyundai\'s Indonesian car plant uses cells for the Kona Electric).'], ['IBC sebagai mitra BUMN yang menjangkau rantai nikel.', 'IBC as a state partner reaching the nickel chain.']),
      angka: [{ label: T('Kapasitas sel', 'Cell capacity'), nilai: 10, d: 0, satuan: T('GWh per tahun', 'GWh a year'), sumber: 'hliauto', est: false }],
      pelajaran: P(['Pabrik sel bekerja ketika mitra teknologi dan pembeli akhir sudah di lokasi; investasi dilaporkan USD 1,1 miliar atau USD 3,1 miliar tergantung media.', 'A cell factory works when the technology partner and end buyer are already on site; investment is reported at USD 1.1 billion or USD 3.1 billion depending on the outlet.']),
      faktor: { ppa_tarif: true, pendanaan: true, kepastian_kebijakan: true }, sumber: ['hlitempo', 'hliauto', 'hlijp'], hak_jawab: true }),
    cs({ id: 'iknbess', nama: 'PLTS IKN 50 MW dengan BESS 14,2 MWh', jenis: 'berhasil', lokasi: T('Ibu Kota Nusantara', 'Nusantara Capital'),
      profil: [{ label: T('PLTS', 'Solar'), nilai: 50, satuan: 'MW' }, { label: 'BESS', nilai: 14.2, satuan: 'MWh' }, { label: T('Diresmikan', 'Inaugurated'), nilai: '2025-01-20' }],
      tindakan: P(['PLTS dipasangkan dengan baterai sejak awal untuk menstabilkan pasokan.', 'Solar paired with a battery from the start to stabilise supply.']),
      sebab: P(['Sumber yang dibaca tidak merinci faktor keberhasilan selain bahwa proyek beroperasi.', 'The source read gives no further success factor beyond the project operating.']),
      angka: [{ label: 'BESS', nilai: 14.2, d: 1, satuan: 'MWh', sumber: 'ikn', est: false }],
      pelajaran: P(['Penyimpanan kecil yang dipasang bersama PLTS adalah titik awal praktis bagi sistem baru.', 'Small storage installed with the solar plant is a practical starting point for a new system.']),
      faktor: { jaringan: true }, sumber: ['ikn'], hak_jawab: true }),
    cs({ id: 'dragon', nama: 'Proyek Dragon: CATL, Antam, IBC', jenis: 'berhasil', lokasi: T('Halmahera Timur dan Karawang', 'East Halmahera and Karawang'),
      profil: [{ label: T('Nilai', 'Value'), nilai: T('USD 5,9 sampai 6 miliar', 'USD 5.9 to 6 billion') }, { label: T('Sel tahap I', 'Phase I cells'), nilai: 6.9, satuan: 'GWh' }, { label: T('Groundbreaking', 'Groundbreaking'), nilai: '2025-06-29' }],
      tindakan: P(['Mengintegrasikan tambang nikel, bahan baterai, sel, dan daur ulang dalam satu konsorsium.', 'Integrating nickel mining, battery materials, cells and recycling in one consortium.']),
      sebab: P(['Struktur hulu-hilir terintegrasi dengan mitra yang sudah mengendalikan bahan baku (Antam) dan teknologi (CATL).', 'An integrated upstream-downstream structure with partners already controlling raw material (Antam) and technology (CATL).']),
      angka: [{ label: T('Sel tahap I', 'Phase I cells'), nilai: 6.9, d: 1, satuan: 'GWh', sumber: 'dragon', est: false }],
      tanda_bahaya: P(['Status produksi belum terverifikasi; laporan tunggal Juni 2026 menyebut pabrik Karawang selesai.', 'Production status is unverified; a single June 2026 report says the Karawang plant is complete.']),
      pelajaran: P(['Struktur terintegrasi mengurangi risiko pasokan bahan, tetapi bukti keberhasilan baru muncul setelah produksi.', 'An integrated structure reduces material supply risk, but proof of success only appears after production.']),
      faktor: { kepastian_kebijakan: true, pendanaan: true }, sumber: ['dragon', 'dragon2'], hak_jawab: true }),
    cs({ id: 'hornsdale', nama: 'Hornsdale Power Reserve (Australia)', jenis: 'berhasil', negara: 'AU', lokasi: T('Australia Selatan', 'South Australia'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: T('150 MW / 193,5 MWh', '150 MW / 193.5 MWh') }, { label: T('Pemilik', 'Owner'), nilai: 'Neoen' }, { label: T('Tersambung', 'Connected'), nilai: '2017-12-01' }],
      tindakan: P(['Dibangun Tesla pada 2017 (100 MW / 129 MWh), diperluas 50 MW / 64,5 MWh pada 2020.', 'Built by Tesla in 2017 (100 MW / 129 MWh), expanded by 50 MW / 64.5 MWh in 2020.']),
      sebab: P(['Menjual layanan frekuensi dalam pasar yang menghargai kecepatan (respons sekitar 100 milidetik).', 'Sells frequency services in a market that rewards speed (about 100 millisecond response).'], ['Pembiayaan campuran: hibah pemerintah negara bagian, ARENA, dan pinjaman CEFC pada ekspansi.', 'Mixed financing: state government grant, ARENA and CEFC loans on the expansion.']),
      angka: [{ label: T('Penghematan jaringan 2019', 'Grid savings 2019'), nilai: 116, d: 0, satuan: T('juta A$', 'A$ million'), sumber: 'hpraurecon', est: false }, { label: T('Penurunan biaya layanan frekuensi', 'Fall in frequency service cost'), nilai: 91, d: 0, satuan: T('persen', 'percent'), sumber: 'hprwiki', est: false }],
      pelajaran: P(['Penyimpanan tampil pertama kali sebagai layanan jaringan; arbitrase hanya pelengkap.', 'Storage first shone as a grid service; arbitrage was only a complement.']),
      faktor: { ppa_tarif: true, pendanaan: true, jaringan: true, kepastian_kebijakan: true }, sumber: ['hprwiki', 'hpraurecon'], hak_jawab: true }),
    cs({ id: 'california', nama: 'Baterai California (AS)', jenis: 'berhasil', negara: 'US', lokasi: T('California', 'California'),
      profil: [{ label: T('2018', '2018'), nilai: 500, satuan: 'MW' }, { label: T('November 2025', 'November 2025'), nilai: 16942, satuan: 'MW' }],
      tindakan: P(['Baterai mengisi pada jam surya murah dan mengalir pada malam hari.', 'Batteries charge in cheap solar hours and discharge in the evening.']),
      sebab: P(['Kebijakan pengadaan penyimpanan negara bagian dan melimpahnya surya siang.', 'State storage procurement policy and abundant daytime solar.']),
      angka: [{ label: T('Pertumbuhan 2018 ke pertengahan 2025', 'Growth 2018 to mid-2025'), nilai: T('500 menjadi lebih dari 16.900 MW', '500 to over 16,900 MW'), d: 0, satuan: '', sumber: 'cec', est: false }],
      tanda_bahaya: P(['Kebakaran Moss Landing 2025 mendorong standar keselamatan baru.', 'The 2025 Moss Landing fire prompted new safety standards.']),
      pelajaran: P(['Skala puluhan GW bisa dicapai dalam tujuh tahun, tetapi keselamatan harus berjalan sejajar.', 'Tens of GW can be reached in seven years, but safety must keep pace.']),
      faktor: { kepastian_kebijakan: true, ppa_tarif: true }, sumber: ['cec', 'cec2'], hak_jawab: true }),
  ] };
  bab['40'] = { tipe: 'kasus', sumber: sm('lgjp', 'petro', 'ml', 'vbb', 'korea'), catatan: HAK, butir: [
    cs({ id: 'lgexit', nama: 'LG keluar dari paket baterai Indonesia', jenis: 'mundur', lokasi: T('Indonesia', 'Indonesia'),
      profil: [{ label: T('Nilai paket', 'Package value'), nilai: T('Sekitar USD 8,45 miliar (sumber lain USD 9,8 miliar)', 'About USD 8.45 billion (other sources USD 9.8 billion)') }, { label: T('Pengganti', 'Replacement'), nilai: 'Huayou' }],
      kronologi: [{ tanggal: '2025-04-24', teks: T('Pemerintah menyatakan Huayou akan menggantikan LG; LG menyebut kondisi pasar dan lingkungan investasi.', 'Government says Huayou will replace LG; LG cited market conditions and the investment environment.') }],
      sebab: P(['LG menyebut kondisi pasar dan lingkungan investasi.', 'LG cited market conditions and the investment environment.'], ['Huayou sendiri berhati-hati: partisipasinya bergantung pada syarat dan kolaborasi seluruh rantai pasok.', 'Huayou itself was cautious: participation depends on terms and collaboration across the whole supply chain.']),
      terdampak: T('Peta jalan hilirisasi baterai dan mitra Indonesia; pemerintah (Bahlil) menyebut pergantian investor lazim dan rencana tidak berubah. Tanggapan LG selain pernyataan awal tidak dimuat.', 'The battery downstreaming roadmap and Indonesian partners; government (Bahlil) says changing investors is common and plans do not change. LG responses beyond its initial statement are not carried.'),
      seharusnya: T('Struktur komitmen bersyarat dan mitra cadangan sejak awal paket, serta publikasi syarat yang menentukan keluar masuk investor.', 'Conditional commitment structures and standby partners from the package start, plus publishing the terms that govern investor entry and exit.'),
      tanda_bahaya: P(['Investor besar menyatakan kondisi pasar tidak mendukung.', 'A major investor says market conditions do not support the project.']),
      angka: [{ label: T('Nilai paket menurut SCMP', 'Package value per SCMP'), nilai: 8.45, d: 2, satuan: T('miliar USD', 'billion USD'), sumber: 'lgscmp', est: false }],
      faktor: { pendanaan: true, kepastian_kebijakan: true }, sumber: ['lgjp', 'lgscmp', 'lgpet'], hak_jawab: true }),
    cs({ id: 'cisokan', nama: 'Upper Cisokan pumped storage (1.040 MW)', jenis: 'mundur', lokasi: T('Bandung Barat dan Cianjur, Jawa Barat', 'West Bandung and Cianjur, West Java'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: 1040, satuan: 'MW' }, { label: T('Pendana', 'Lenders'), nilai: T('AIIB dan Bank Dunia', 'AIIB and World Bank') }],
      kronologi: [{ tanggal: '2023-03-01', teks: T('AIIB mencatat ESMP kontraktor di jalur kritis dan jalan akses longsor.', 'AIIB notes the contractor ESMP on the critical path and landslides on the access road.') }, { tanggal: '2024-07-24', teks: T('Bisnis melaporkan target 2028 dan isu TKDN.', 'Bisnis reports a 2028 target and TKDN issues.') }, { tanggal: '2026-05-01', teks: T('Laporan 2026 menyebut COD 2030.', 'A 2026 report states COD 2030.') }],
      sebab: P(['ESMP pemberi pinjaman di jalur kritis; jalan akses longsor; isu TKDN.', 'Lender ESMP on the critical path; access road landslides; TKDN issues.']),
      terdampak: T('Sistem Jawa-Bali yang menunggu penyimpanan skala besar. Lihat juga topik Hidro.', 'The Java-Bali system awaiting large-scale storage. See also the Hydro topic.'),
      seharusnya: T('Menyelesaikan syarat sosial-lingkungan dan akses sebelum kontrak mengikat.', 'Complete social-environmental conditions and access before binding contracts.'),
      tanda_bahaya: P(['Target COD bergeser beberapa kali.', 'COD target moves several times.']),
      angka: [{ label: T('Target COD terbaru', 'Latest COD target'), nilai: 2030, d: 0, satuan: T('tahun', 'year'), sumber: 'petro', est: false }],
      faktor: { sosial: true, kepastian_kebijakan: true }, sumber: ['aiib', 'bisnis24', 'petro'], hak_jawab: true }),
    cs({ id: 'mosslanding', nama: 'Kebakaran Moss Landing (California)', jenis: 'gagal', negara: 'US', lokasi: T('Monterey County, California', 'Monterey County, California'),
      profil: [{ label: T('Fasilitas', 'Facility'), nilai: T('Fase 1: 300 MW / 1.200 MWh', 'Phase 1: 300 MW / 1,200 MWh') }, { label: T('Pemilik', 'Owner'), nilai: 'Vistra' }],
      kronologi: [{ tanggal: '2021-09-01', teks: T('Insiden suhu tinggi tanpa api akibat selang pendingin bocor (bulan saja).', 'High-temperature incident without fire due to a leaking cooling hose (month only).') }, { tanggal: '2025-01-16', teks: T('Kebakaran fase 1; sekitar 80 persen bagian baterai terbakar; sekitar 1.200 warga dievakuasi; sistem pemadam tidak memadamkan api.', 'Phase 1 fire; roughly 80 percent of the battery section burned; about 1,200 residents evacuated; suppression did not extinguish the fire.') }],
      sebab: P(['Penyebab belum ditetapkan.', 'The cause remains undetermined.'], ['Insiden suhu tinggi sebelumnya (2021 dan 2022) menjadi pola peringatan.', 'Earlier high-temperature incidents (2021 and 2022) formed a warning pattern.']),
      terdampak: T('Warga yang dievakuasi dan ekosistem sekitar (kadar nikel, magnesium, kobalt meningkat); Vistra menghapus buku USD 400 juta menurut Wikipedia.', 'Evacuated residents and the surrounding ecosystem (elevated nickel, magnesium, cobalt); Vistra wrote off USD 400 million per Wikipedia.'),
      seharusnya: T('Menanggapi insiden suhu berulang sebagai tanda bahaya dan menguji sistem pemadam untuk skala ruang baterai.', 'Treat repeated high-temperature incidents as a warning sign and test suppression at battery-room scale.'),
      tanda_bahaya: P(['Insiden suhu tinggi berulang tanpa api.', 'Repeated high-temperature incidents without fire.']),
      angka: [{ label: T('Warga dievakuasi', 'Residents evacuated'), nilai: 1200, d: 0, satuan: '', sumber: 'ml', est: false }],
      faktor: { sosial: true, pengelola_om: true }, sumber: ['ml', 'mlnews'], hak_jawab: true }),
    cs({ id: 'vbb', nama: 'Kebakaran Victorian Big Battery (Australia)', jenis: 'mundur', negara: 'AU', lokasi: T('Victoria, Australia', 'Victoria, Australia'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: T('300 MW / 450 MWh', '300 MW / 450 MWh') }, { label: T('Pemilik', 'Owner'), nilai: 'HMC Capital' }],
      kronologi: [{ tanggal: '2021-07-30', teks: T('Megapack terbakar saat uji awal dan menghancurkan dua unit.', 'A Megapack caught fire in initial testing and destroyed two units.') }, { tanggal: '2021-12-08', teks: T('Mulai beroperasi setelah uji dilanjutkan akhir September 2021.', 'Began operating after testing resumed in late September 2021.') }],
      sebab: P(['Kebocoran fluida pendingin menyebabkan korsleting sel dan thermal runaway.', 'A cooling-fluid leak short-circuited cells and caused thermal runaway.']),
      terdampak: T('Jadwal operasi bergeser sekitar dua bulan lebih; tidak ada korban disebut di sumber.', 'The operation schedule slipped by about two months or more; no casualties are mentioned in the source.'),
      seharusnya: T('Uji bertahap dengan isolasi unit dan pemantauan kebocoran pendingin.', 'Staged testing with unit isolation and coolant leak monitoring.'),
      tanda_bahaya: P(['Kebocoran pendingin pada tahap uji.', 'Coolant leak during commissioning.']),
      angka: [{ label: T('Selang kebakaran ke operasi', 'From fire to operation'), nilai: 131, d: 0, satuan: T('hari', 'days'), sumber: 'vbb', est: true }],
      faktor: { pengelola_om: true }, sumber: ['vbb'], hak_jawab: true }),
    cs({ id: 'korea', nama: 'Kebakaran ESS Korea Selatan', jenis: 'mati', negara: 'KR', lokasi: T('Korea Selatan', 'South Korea'),
      profil: [{ label: T('Jumlah kebakaran dilaporkan', 'Fires reported'), nilai: T('Sekitar 30 dalam satu tahun', 'About 30 in one year') }],
      kronologi: [{ tanggal: '2019-01-01', teks: T('Tahun pasti tidak dikonfirmasi di ringkasan yang dibaca; dimuat sebagai gelombang kebakaran yang memukul industri.', 'The exact year is not confirmed in the summary read; carried as a fire wave that hit the industry.') }],
      sebab: P(['Judul laporan menyebut baterai bukan satu-satunya penyebab; rincian penyebab tidak dapat dibaca karena halaman memblokir pengambilan otomatis.', 'The report headline says batteries were not to blame alone; cause details could not be read because the page blocks automated fetching.']),
      terdampak: T('Industri ESS Korea Selatan terpukul walau baterai tidak disalahkan sepenuhnya. Judul "mati" dipakai terbatas pada gelombang pasar yang terhenti sementara.', 'The Korean ESS industry took a hit even though batteries were not fully blamed. The label "dead" is used loosely for a market wave that stalled temporarily.'),
      seharusnya: T('Standar instalasi, pemantauan, dan investigasi independen sebelum pasar diperluas.', 'Installation standards, monitoring and independent investigation before the market scales.'),
      tanda_bahaya: P(['Kebakaran berulang di banyak lokasi.', 'Repeated fires at many sites.']),
      faktor: { kepastian_kebijakan: true }, sumber: ['korea'], hak_jawab: true }),
  ] };
  bab['41'] = { tipe: 'pola', sumber: sm('ed'), catatan: T('Sel dibangun dari bendera faktor tiap kasus; pemetaan faktor ke kasus adalah analisis METI (Hipotesis) atas fakta di bab 39 dan 40.', 'Cells are built from each case factor flags; mapping factors to cases is METI analysis (Hypothesis) on facts in chapters 39 and 40.'), faktor: FAKTOR_STD.map(([k, a, e]) => L(k, a, e)) };
  bab['42'] = { tipe: 'periksa', sumber: sm('ed'), peran: PERAN, tahap: TAHAP, butir: [
    dasarP('pengembang', 'lokasi', 'Tetapkan jarak aman dari permukiman dan rencana evakuasi sebelum memilih lokasi BESS (Moss Landing).', 'Set safe distance from settlements and an evacuation plan before choosing a BESS site (Moss Landing).', 'ml'),
    dasarP('pengembang', 'ppa', 'Kontrakkan layanan jaringan (frekuensi, geser surya), bukan hanya arbitrase (Hornsdale).', 'Contract grid services (frequency, solar shifting), not only arbitrage (Hornsdale).', 'hpraurecon'),
    dasarP('pengembang', 'bangun', 'Uji bertahap dengan isolasi unit dan pemantauan kebocoran pendingin (Victorian Big Battery).', 'Commission in stages with unit isolation and coolant leak monitoring (Victorian Big Battery).', 'vbb'),
    dasarP('pengembang', 'operasi', 'Tanggapi insiden suhu tinggi berulang sebagai tanda bahaya (Moss Landing 2021, 2022).', 'Treat repeated high-temperature incidents as a warning (Moss Landing 2021, 2022).', 'ml'),
    dasarP('investor', 'dana', 'Siapkan mitra cadangan dan syarat keluar dalam paket investasi besar (kasus LG).', 'Prepare standby partners and exit terms in large investment packages (LG case).', 'lgjp'),
    dasarP('pemda', 'izin', 'Siapkan rencana darurat dan komunikasi risiko bagi warga sekitar BESS.', 'Prepare emergency plans and risk communication for residents near BESS.', 'ml'),
    dasarP('pusat', 'ppa', 'Tetapkan standar keselamatan BESS nasional dan jenis layanan jaringan yang dibayar.', 'Set national BESS safety standards and the grid services that are paid for.', 'korea'),
    dasarP('pusat', 'bangun', 'Pastikan syarat sosial-lingkungan PLTA pompa selesai sebelum kontrak mengikat (Cisokan).', 'Make sure social-environmental conditions for pumped hydro are complete before binding contracts (Cisokan).', 'aiib'),
    dasarP('pln', 'ppa', 'Tentukan layanan yang dibeli (frekuensi, kapasitas) dalam tender dan umumkan jadwal COD realistis.', 'Specify the services bought (frequency, capacity) in tenders and publish realistic COD schedules.', 'petro'),
    dasarP('pln', 'operasi', 'Mulai dengan BESS di PLTS yang sudah ada (contoh IKN) untuk membangun pengalaman operasi.', 'Start with BESS at existing solar plants (IKN example) to build operating experience.', 'ikn'),
    dasarP('meti', 'operasi', 'Pantau produksi Dragon dan BESS RUPTL pertama, serta beri hak jawab pada pihak yang disebut.', 'Monitor Dragon production and the first RUPTL BESS, and give named parties a right of reply.', 'dragon'),
  ] };
  const DERET_KUNCI = perdalam(bab, SUMBER);
  lengkapi({ kunci, bab }, { deret: DERET_KUNCI });
  return {
    id: ID, versi: 1, diperbarui: TGL,
    judul: T('Penyimpanan dan baterai', 'Storage and batteries'),
    lead: T('BESS, PLTA pompa, dan ekosistem baterai nikel: pipeline besar di RUPTL, pabrik sel pertama sudah berdiri, dan keselamatan menjadi syarat utama.', 'BESS, pumped hydro and the nickel battery ecosystem: a large RUPTL pipeline, the first cell factory standing, and safety as the main condition.'),
    kunci,
    penting: P(
      [`RUPTL 2025-2034 memuat ${totalMW} MW penyimpanan (sekitar ${pshMW} MW PLTA pompa), tetapi belum ada yang beroperasi di basis METI.`, `The 2025-2034 RUPTL lists ${totalMW} MW of storage (about ${pshMW} MW pumped hydro) but none is operating in the METI base.`],
      ['Pabrik sel HLI Green Power 10 GWh per tahun sudah berdiri dan proyek CATL, Antam, IBC dimulai; LG keluar dari paket lain pada April 2025.', 'The 10 GWh a year HLI Green Power cell factory stands and the CATL, Antam, IBC project has begun; LG exited another package in April 2025.'],
      ['Nilai baterai ada pada layanan jaringan, dan kebakaran Moss Landing 2025 menunjukkan keselamatan tidak boleh ditawar.', 'Battery value lies in grid services, and the 2025 Moss Landing fire shows safety is non-negotiable.'],
    ),
    posisi: T('Indonesia unggul di rantai sel tetapi tertinggal jauh di penyimpanan jaringan: 6.641 MW rencana dibanding 16.942 MW yang sudah dipasang California.', 'Indonesia leads in the cell chain but lags far in grid storage: 6,641 MW planned versus 16,942 MW already installed in California.'),
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
    fs.writeFileSync(path.join(akar, 'public/data/topik/penyimpanan.json'), JSON.stringify(d, null, 1) + '\n');
    console.log(`bab naskah ${Object.keys(d.bab).length}/41 (+bab 1); mercusuar ${d.bab['39'].butir.length}; gagal ${d.bab['40'].butir.length}; sumber ${Object.keys(d.sumber).length}`);
  }
}
