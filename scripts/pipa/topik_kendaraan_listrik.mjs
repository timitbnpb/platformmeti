// Naskah topik Kendaraan listrik dan SPKLU (kerangka 42 bab) mengikuti docs/perencanaan/TOPIK-SKEMA.md.
// Menyusun public/data/topik/kendaraan_listrik.json dari data repo (dihitung, bukan diketik) + sumber publik bertanggal.
// Pakai: node scripts/pipa/topik_kendaraan_listrik.mjs [--selftest]
// Aturan: tiap klaim bersumber (kunci peta sumber); analisis sendiri berlabel "Analisis METI (Hipotesis)"; bab tanpa data dikosongkan; kasus yang menyebut pihak wajib hak jawab.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validasi } from './topik_surya.mjs';
import { lengkapi } from './topik_dalam_lib.mjs';
import { perdalam } from './topik_kendaraan_listrik_dalam.mjs';
export { validasi };
const akar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ID = 'kendaraan-listrik';
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
  oto: S('Berapa jumlah ideal SPKLU di Indonesia untuk akselerasi elektrifikasi nasional (Mei 2025; data PLN Maret 2025: 3.772 SPKLU roda empat di 2.515 lokasi)', 'Otodriver', 'https://otodriver.com/berita/2025/berapa-jumlah-ideal-spklu-di-indonesia-untuk-akselerasi-elektrifikasi-nasional-ini-jawaban-ahlinya-berebidgnya', '2025-05-03', 'media'),
  nataru: S('PLN siagakan 4.516 SPKLU di 2.935 titik selama libur Nataru (24 Des 2025)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20251224/44/1939435/pln-siagakan-4516-spklu-di-2935-titik-selama-libur-nataru', '2025-12-24', 'media'),
  mesin: S('Sepanjang 2025, PLN hadirkan 4.655 mesin SPKLU', 'BCA Sekuritas (kutipan berita)', 'https://bcasekuritas.co.id/latest-news/news/sepanjang-2025-pln-hadirkan-4655-mesin-spklu', '2026-01-01', 'media'),
  kontanev: S('Pembangunan SPKLU kejar laju mobil listrik (penjualan mobil listrik 2022 sekitar 10.000, 2023 17.000, 2024 43.000 unit)', 'Kontan', 'https://insight.kontan.co.id/news/pembangunan-spklu-kejar-laju-mobil-listrik', '2025-04-01', 'media'),
  bakrie: S('Incentives removed: will the exponential rate of EV sales halt? (penjualan grosir BEV 2025 sebesar 103.931 unit menurut Gaikindo; belum diverifikasi ke rilis Gaikindo)', 'Bakrie Brothers', 'https://bakrie-brothers.com/announcements/incentives-removed-will-the-exponential-rate-of-ev-sales-halt/', '2026-01-01', 'media'),
  cbu: S('Industry Ministry to end CBU electric vehicle incentives in 2026 (enam perusahaan, kapasitas rencana 305.000 unit, investasi Rp15,52 triliun, produksi lokal 1:1 pada 2026 sampai 2027, TKDN 40 naik ke 60 persen)', 'Jakarta Globe', 'https://jakartaglobe.id/news/industry-ministry-to-end-cbu-electric-vehicle-incentives-in-2026', '2025-09-01', 'media'),
  cbujp: S('Analysis: RI to end CBU EV import incentives, domestic manufacturing boost (27 Sep 2025)', 'The Jakarta Post', 'https://www.thejakartapost.com/opinion/2025/09/27/analysis-ri-to-end-cbu-ev-import-incentives-domestic-manufacturing-boost.html', '2025-09-27', 'media'),
  pmk: S('PMK baru: pemerintah tanggung PPN mobil listrik dan PPnBM mobil hybrid (PMK 12/2025: PPN DTP 10 persen untuk TKDN minimal 40 persen, berlaku 4 Feb 2025, masa pajak Jan sampai Des 2025)', 'DDTC News', 'https://news.ddtc.co.id/berita/nasional/1808696/pmk-baru-pemerintah-tanggung-ppn-mobil-listrik-dan-ppnbm-mobil-hybrid', '2025-02-04', 'media'),
  motor23: S('Menperin: serapan subsidi motor listrik 2023 capai 11 ribu unit (kuota 200 ribu)', 'Antara', 'https://www.antaranews.com/berita/3898152/menperin-serapan-subsidi-motor-listrik-2023-capai-11-ribu-unit', '2024-01-01', 'media'),
  motor23b: S('Disediakan Rp1,4 triliun, subsidi motor listrik cuma terserap Rp80,7 miliar di 2023', 'Emitennews', 'https://www.emitennews.com/news/disediakan-rp14-triliun-subsidi-motor-listrik-cuma-terserap-rp807-miliar-di-2023', '2024-01-01', 'media'),
  motor23c: S('Realisasi subsidi motor listrik baru satu persen (3 Agu 2023)', 'Republika', 'https://ekonomi.republika.co.id/berita/ryt2vr502/realisasi-subsidi-motor-listrik-baru-satu-persen', '2023-08-03', 'media'),
  motor24: S('Kemenperin: subsidi motor listrik sudah tersalurkan 30.083 unit (60,1 persen target 2024)', 'Antara', 'https://www.antaranews.com/berita/4125147/kemenperin-subsidi-motor-listrik-sudah-tersalurkan-30083-unit', '2024-12-01', 'media'),
  iea: S('IEA, Global EV Outlook 2025, ringkasan eksekutif (2024: lebih dari 17 juta mobil listrik; Tiongkok lebih dari 11 juta; Asia Tenggara 9 persen pangsa)', 'IEA', 'https://www.iea.org/reports/global-ev-outlook-2025/executive-summary', '2025-05-01', 'resmi'),
  norway: S('Plug-in electric vehicles in Norway (ringkasan Wikipedia: pangsa plug-in 88,9 persen pada 2024; bebas PPN 25 persen, pajak pembelian, tol)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Plug-in_electric_vehicles_in_Norway', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  thstar: S('Analysis: China\'s intense EV rivalry tests Thailand\'s local production goals (5 Jul 2025)', 'The Star / Reuters', 'https://www.thestar.com.my/aseanplus/aseanplus-news/2025/07/05/analysis---china039s-intense-ev-rivalry-tests-thailand039s-local-production-goals', '2025-07-05', 'media'),
  thnation: S('China\'s intense EV rivalry tests Thailand\'s local production goals', 'The Nation Thailand', 'https://nationthailand.com/blogs/business/automobile/40052190', '2025-07-05', 'media'),
  hlitempo: S('Jokowi opens Southeast Asia\'s largest EV battery factory in Karawang (3 Jul 2024)', 'Tempo', 'https://en.tempo.co/amp/1886890/indonesias-jokowi-opens-southeast-asias-largest-ev-battery-factory-in-karawang', '2024-07-03', 'media'),
  hliauto: S('Hyundai and LG open battery cell plant in Indonesia (10 GWh per tahun; sel untuk Kona Electric)', 'Just Auto', 'https://www.just-auto.com/news/hyundai-lg-open-battery-cell-plant-in-indonesia', '2024-07-03', 'media'),
  lgjp: S('Govt says China\'s Huayou to replace LGES in EV battery project (24 Apr 2025)', 'The Jakarta Post', 'https://www.thejakartapost.com/business/2025/04/24/govt-says-chinas-huayou-to-replace-lges-in-ev-battery-project', '2025-04-24', 'media'),
  lgscmp: S('Huayou may step in as South Korea\'s LG abandons USD 8.45 billion Indonesia EV battery investment', 'South China Morning Post', 'https://www.scmp.com/business/companies/article/3309683/huayou-may-step-south-koreas-lg-abandons-us845-bn-indonesia-ev-battery-investment', '2025-04-24', 'media'),
  jagorawi: S('PLN dan HVT luncurkan SPKLU ultra fast charging di Tol Jagorawi', 'Listrik Indonesia', 'https://listrikindonesia.com/detail/18339/pln-dan-hvt-luncurkan-spklu-ultra-fast-charging-di-tol-jagorawi-waktu-isi-daya-kini-lebih-singkat', '2025-10-01', 'media'),
  waralaba: S('PLN dan swasta dorong SPKLU muncul di lokasi strategis', 'Listrik Indonesia', 'https://listrikindonesia.com/detail/17344/pln-dan-swasta-dorong-spklu-muncul-di-lokasi-strategis', '2025-08-01', 'media'),
};

export function susun() {
  const d0 = dasarJson();
  const as = baca('public/data/asean_energi.json').baris;
  const idn = as.find((x) => x.iso3 === 'IDN');
  const ci = idn.intensitas_karbon_gco2_kwh.nilai;
  const bab = {};
  const rf = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
  const evG = rf(0.15 * ci, 0); // gCO2 per km pada 15 kWh per 100 km
  const iceG = rf(2310 / 12, 0); // gCO2 per km, 12 km per liter, 2,31 kg CO2 per liter bensin
  const ppn = 40;

  const kunci = [
    { label: T('SPKLU PLN roda empat (Maret 2025)', 'PLN four-wheel charging stations (March 2025)'), nilai: 3772, d: 0, satuan: T('unit di 2.515 lokasi', 'units at 2,515 locations'), sumber: 'oto', est: false },
    { label: T('SPKLU disiagakan saat Nataru 2025', 'Stations on standby for Christmas-New Year 2025'), nilai: 4516, d: 0, satuan: T('unit di 2.935 titik', 'units at 2,935 points'), sumber: 'nataru', est: false },
    { label: T('Penjualan grosir mobil listrik 2024', 'Wholesale electric car sales 2024'), nilai: 43000, d: 0, satuan: T('unit', 'units'), sumber: 'kontanev', est: false },
    { label: T('PPN ditanggung pemerintah untuk TKDN minimal 40 persen (2025)', 'Government-borne VAT for local content of at least 40 percent (2025)'), nilai: 10, d: 0, satuan: T('persen', 'percent'), sumber: 'pmk', est: false },
    { label: T('Kapasitas rencana enam perusahaan CBU yang wajib produksi lokal 1:1', 'Planned capacity of six CBU firms obliged to produce locally 1:1'), nilai: 305000, d: 0, satuan: T('unit per tahun', 'units a year'), sumber: 'cbu', est: false },
  ];

  bab['2'] = { tipe: 'faq', sumber: sm('ed', 'oto', 'pmk', 'cbu', 'kontanev'), butir: FQ([
    ['Berapa banyak SPKLU di Indonesia?', 'How many public chargers does Indonesia have?', 'Data PLN Maret 2025: 3.772 SPKLU roda empat di 2.515 lokasi (Jawa 2.667 unit); saat libur Nataru 2025 PLN menyiagakan 4.516 SPKLU di 2.935 titik.', 'PLN data for March 2025: 3,772 four-wheel stations at 2,515 locations (Java 2,667); for the 2025 Christmas-New Year holiday PLN put 4,516 stations at 2,935 points on standby.'],
    ['Berapa penjualan mobil listrik?', 'How many electric cars are sold?', 'Sekitar 10.000 unit pada 2022, 17.000 pada 2023, dan 43.000 pada 2024 menurut pemberitaan Kontan; satu sumber mengutip Gaikindo 103.931 unit grosir BEV pada 2025 (belum diverifikasi).', 'About 10,000 units in 2022, 17,000 in 2023 and 43,000 in 2024 per Kontan; one source citing Gaikindo gives 103,931 wholesale BEV units in 2025 (unverified).'],
    ['Apa insentif pembelian mobil listrik?', 'What incentives exist for buying an electric car?', 'Pada 2025: PPN ditanggung pemerintah 10 persen untuk mobil listrik dengan TKDN minimal 40 persen (PMK 12/2025, berlaku 4 Februari 2025 untuk masa pajak Januari sampai Desember 2025). Status 2026 belum terkonfirmasi.', 'In 2025: 10 percent of VAT borne by government for electric cars with at least 40 percent local content (PMK 12/2025, effective 4 February 2025 for tax periods January to December 2025). 2026 status is unconfirmed.'],
    ['Apakah mobil listrik impor masih berinsentif?', 'Do imported electric cars still get incentives?', 'Tidak. Insentif impor utuh (CBU) berakhir 31 Desember 2025 dan produsen penerima wajib memproduksi lokal 1:1 pada 2026 sampai 2027.', 'No. Incentives for fully built imports (CBU) ended on 31 December 2025 and recipient makers must produce locally 1:1 in 2026 to 2027.'],
    ['Bagaimana dengan motor listrik?', 'What about electric motorcycles?', 'Bantuan Rp7 juta per unit berlaku satu KTP satu unit sejak 19 September 2023, tetapi serapan 2023 hanya sekitar 11.532 dari kuota 200.000 unit; 2024 tersalur 30.083 unit atau 60,1 persen dari target.', 'The IDR 7 million aid applies one ID per unit since 19 September 2023, but 2023 uptake was only about 11,532 of a 200,000 quota; 2024 reached 30,083 units or 60.1 percent of target.'],
    ['Siapa memproduksi baterai kendaraan listrik di Indonesia?', 'Who makes EV batteries in Indonesia?', 'HLI Green Power (Hyundai, LG, IBC) di Karawang dengan 10 GWh per tahun sejak Juli 2024; proyek CATL, Antam, IBC menyusul. Lihat topik Penyimpanan.', 'HLI Green Power (Hyundai, LG, IBC) in Karawang with 10 GWh a year since July 2024; the CATL, Antam, IBC project follows. See the Storage topic.'],
    ['Seberapa hijau mobil listrik di Indonesia?', 'How green is an electric car in Indonesia?', `Bergantung pada jaringan: intensitas ${ci} gCO2 per kWh pada 2024 berarti mobil listrik 15 kWh per 100 km menghasilkan sekitar ${evG} gCO2 per km dibanding sekitar ${iceG} untuk mobil bensin 12 km per liter (EST, asumsi hipotesis). Lihat bab 27.`, `It depends on the grid: ${ci} gCO2 per kWh in 2024 means a 15 kWh per 100 km electric car emits about ${evG} gCO2 per km versus about ${iceG} for a 12 km per litre petrol car (EST, hypothetical assumptions). See chapter 27.`],
    ['Kenapa subsidi motor listrik sepi?', 'Why did the electric motorcycle subsidy lag?', 'Menperin menyebut kemampuan baterai dan lamanya pengisian sebagai salah satu penyebab. Lihat bab 40.', 'The Industry Minister cited battery capability and charging time as one cause. See chapter 40.'],
  ]) };
  bab['3'] = { tipe: 'glosarium', sumber: sm('ed'), butir: G([
    ['KBLBB', 'Kendaraan bermotor listrik berbasis baterai (BEV).', 'Battery electric vehicle (BEV).'], ['SPKLU', 'Stasiun pengisian kendaraan listrik umum.', 'Public electric vehicle charging station.'],
    ['SPBKLU', 'Stasiun penukaran baterai kendaraan listrik umum (swap).', 'Public battery swap station.'], ['CBU / CKD', 'Completely built-up (utuh) / completely knocked-down (terurai lengkap).', 'Completely built-up / completely knocked-down.'],
    ['TKDN', 'Tingkat komponen dalam negeri.', 'Local content level.'], ['PPN DTP', 'PPN ditanggung pemerintah.', 'VAT borne by government.'],
    ['PPnBM', 'Pajak penjualan atas barang mewah.', 'Luxury goods sales tax.'], ['BEV / PHEV / HEV', 'Mobil baterai penuh / hibrida colok / hibrida.', 'Battery-only / plug-in hybrid / hybrid cars.'],
    ['Pengisian cepat (DC)', 'Pengisian arus searah berdaya tinggi, puluhan menit.', 'High-power direct-current charging, tens of minutes.'], ['Pengisian lambat (AC)', 'Pengisian arus bolak-balik, beberapa jam, umumnya di rumah.', 'Alternating-current charging, several hours, usually at home.'],
    ['kWh per 100 km', 'Konsumsi energi kendaraan listrik.', 'Electric vehicle energy consumption.'], ['Intensitas karbon jaringan', 'gCO2 per kWh listrik jaringan.', 'gCO2 per kWh of grid electricity.'],
    ['Konversi motor', 'Mengganti mesin bakar sepeda motor menjadi penggerak listrik.', 'Replacing a motorcycle combustion engine with an electric drive.'], ['Gaikindo', 'Asosiasi Industri Automotif Indonesia.', 'Indonesian Automotive Industry Association.'],
    ['EV 3.0 (Thailand)', 'Program insentif Thailand yang mewajibkan produksi lokal.', 'Thai incentive programme requiring local production.'],
  ]) };
  bab['4'] = { tipe: 'teks', sumber: sm('iea', 'oto', 'kontanev'), paragraf: P(
    ['Kendaraan listrik menggeser konsumsi bahan bakar impor menjadi listrik dan menaikkan permintaan listrik, penyimpanan, dan pengisian. Dunia menjual lebih dari 17 juta mobil listrik pada 2024 (lebih dari 20 persen penjualan) menurut IEA.', 'Electric vehicles shift imported fuel use to electricity and raise demand for power, storage and charging. The world sold over 17 million electric cars in 2024 (over 20 percent of sales) per the IEA.'],
    ['Indonesia masih awal: penjualan mobil listrik naik dari sekitar 10.000 unit (2022) ke 43.000 (2024), dan pemerintah menargetkan 2 juta mobil listrik pada 2030.', 'Indonesia is early: electric car sales rose from about 10,000 units (2022) to 43,000 (2024), and government targets 2 million electric cars by 2030.'],
    ['Untuk METI, kendaraan listrik relevan karena beban pengisian dapat dipasangkan dengan surya, dan ekosistem baterainya bertemu dengan topik Penyimpanan.', 'For METI, electric vehicles matter because charging load can be paired with solar and the battery ecosystem meets the Storage topic.'],
  ) };
  bab['5'] = { tipe: 'rumus', sumber: sm('owid', 'oto', 'ed'), rumus: P(
    ['Emisi per km (g) = konsumsi (kWh per km) x intensitas jaringan (gCO2 per kWh)', 'Emissions per km (g) = consumption (kWh per km) x grid intensity (gCO2 per kWh)'],
    ['Rasio SPKLU = jumlah kendaraan listrik / jumlah SPKLU', 'Charger ratio = number of electric vehicles / number of chargers'],
    ['Biaya listrik per km = konsumsi (kWh per km) x tarif (Rp per kWh)', 'Electricity cost per km = consumption (kWh per km) x tariff (IDR per kWh)'],
  ), contoh: [
    T(`Intensitas jaringan Indonesia ${ci} gCO2 per kWh (2024). Mobil listrik 15 kWh per 100 km menghasilkan sekitar ${evG} gCO2 per km. Mobil bensin 12 km per liter dengan 2,31 kg CO2 per liter menghasilkan sekitar ${iceG} gCO2 per km (EST; konsumsi 15 kWh per 100 km dan 12 km per liter adalah asumsi hipotesis).`, `Indonesian grid intensity is ${ci} gCO2 per kWh (2024). A 15 kWh per 100 km electric car emits about ${evG} gCO2 per km. A 12 km per litre petrol car at 2.31 kg CO2 per litre emits about ${iceG} gCO2 per km (EST; 15 kWh per 100 km and 12 km per litre are hypothetical assumptions).`),
    T('Jakarta memiliki rasio sekitar satu SPKLU untuk 20 kendaraan listrik, sedangkan PLN dikabarkan menargetkan 1:5 di area publik pada 2030 dan Tiongkok disebut mencapai sekitar 1:1 (pernyataan pelaku industri dalam Otodriver).', 'Jakarta has roughly one charger for 20 electric vehicles, while PLN is reportedly targeting 1:5 in public areas by 2030 and China is said to reach about 1:1 (industry statements in Otodriver).'),
  ] };
  bab['6'] = { tipe: 'langkah', sumber: sm('ed', 'cbu', 'hliauto', 'oto'), butir: [
    { judul: T('Bahan baterai dan sel', 'Battery materials and cells'), isi: T('Nikel, katoda, dan sel dari Karawang (HLI Green Power 10 GWh per tahun).', 'Nickel, cathode and cells from Karawang (HLI Green Power 10 GWh a year).'), pelaku: T('IBC, Hyundai, LG, CATL, Antam', 'IBC, Hyundai, LG, CATL, Antam') },
    { judul: T('Perakitan kendaraan', 'Vehicle assembly'), isi: T('Enam perusahaan penerima insentif CBU merencanakan 305.000 unit per tahun dengan investasi Rp15,52 triliun.', 'Six CBU-incentive firms plan 305,000 units a year with IDR 15.52 trillion investment.'), pelaku: T('BYD, Geely, VinFast, Xpeng, GWM, Citroen/AION/Maxus', 'BYD, Geely, VinFast, Xpeng, GWM, Citroen/AION/Maxus') },
    { judul: T('Distribusi dan pembiayaan', 'Distribution and financing'), isi: T('Dealer, pembiayaan, dan insentif PPN DTP bagi TKDN minimal 40 persen.', 'Dealers, financing and VAT-borne incentives for local content of at least 40 percent.'), pelaku: T('Dealer, lembaga keuangan, DJP', 'Dealers, financiers, tax office') },
    { judul: T('Pengisian', 'Charging'), isi: T('PLN mengoperasikan SPKLU, rumah tangga memakai home charging (33.086 unit terintegrasi), dan ada SPBKLU penukaran baterai (2.240 unit).', 'PLN operates public chargers, households use home charging (33,086 integrated units), and there are battery swap stations (2,240 units).'), pelaku: T('PLN, swasta, pengguna', 'PLN, private operators, users') },
    { judul: T('Daur ulang dan akhir usia', 'Recycling and end of life'), isi: T('Baku mutu emisi daur ulang baterai lithium diatur Permen LHK 12/2021.', 'Emission standards for lithium battery recycling are in Environment Ministry Reg. 12/2021.'), pelaku: T('Pengolah, KLH', 'Recyclers, Environment Ministry') },
  ] };
  bab['7'] = { tipe: 'grafik', jenis: 'kolom', sumber: sm('kontanev', 'bakrie'), label: T('Penjualan grosir mobil listrik Indonesia', 'Indonesia wholesale electric car sales'), satuan: T('unit', 'units'), d: 0, seri: [{ nama: T('Unit', 'Units'), sorot: true, titik: [['2022', 10000], ['2023', 17000], ['2024', 43000], ['2025 (belum diverifikasi)', 103931]] }], catatan: T('Angka 2022 sampai 2024 dibulatkan dalam pemberitaan; angka 2025 dari satu sumber yang mengutip Gaikindo dan belum diverifikasi ke rilis Gaikindo.', 'Figures for 2022 to 2024 are rounded in press; the 2025 figure is from one source citing Gaikindo and unverified against a Gaikindo release.') };
  bab['8'] = { tipe: 'tabel', per: 8, sumber: sm('oto'), catatan: T('SPKLU roda empat milik PLN per wilayah, Maret 2025.', 'PLN four-wheel public chargers by region, March 2025.'), kolom: [{ k: 'w', l: T('Wilayah', 'Region') }, { k: 'u', l: T('Unit SPKLU', 'Charger units'), num: true, d: 0 }, { k: 'l', l: T('Lokasi', 'Locations'), num: true, d: 0 }], baris: [
    { w: 'Jawa', u: 2667, l: 1645 }, { w: 'Sumatera', u: 442, l: 364 }, { w: 'Bali dan Nusa Tenggara', u: 246, l: 167 }, { w: 'Kalimantan', u: 217, l: 170 }, { w: 'Sulawesi', u: 148, l: 125 }, { w: 'Papua', u: 27, l: 19 }, { w: 'Maluku', u: 25, l: 25 },
  ] };
  bab['11'] = { tipe: 'teks', sumber: sm('kontanev', 'oto', 'nataru', 'mesin', 'motor24'), paragraf: P(
    ['Penjualan mobil listrik 43.000 unit pada 2024 dan penjualan bulanan Maret 2025 mencapai 16.400 unit (Gaikindo via Otodriver). Pengisian: 3.772 SPKLU mobil, 9.956 SPKLU motor, 2.240 swap station, dan 33.086 home charging terintegrasi PLN (Maret 2025); PLN menambah 4.655 mesin SPKLU sepanjang 2025 menurut kutipan berita.', 'Electric car sales were 43,000 units in 2024 and March 2025 monthly sales reached 16,400 units (Gaikindo via Otodriver). Charging: 3,772 car chargers, 9,956 motorcycle chargers, 2,240 swap stations and 33,086 PLN-integrated home chargers (March 2025); PLN added 4,655 charger machines through 2025 per a news excerpt.'],
    ['Motor listrik bersubsidi: 30.083 unit tersalurkan pada 2024 (60,1 persen target).', 'Subsidised electric motorcycles: 30,083 units were delivered in 2024 (60.1 percent of target).'],
  ) };
  const R = (id, dok, a, b) => regRow(d0, id, dok, a, b);
  bab['12'] = { tipe: 'tabel', per: 8, sumber: sm('regul', 'pmk'), kolom: [{ k: 'dok', l: T('Peraturan', 'Regulation'), url: 'u' }, { k: 'ttg', l: T('Tentang', 'About') }, { k: 'st', l: T('Status', 'Status') }], baris: [
    R('perpres-55-2019', 'Perpres 55/2019', 'Percepatan program kendaraan bermotor listrik berbasis baterai untuk transportasi jalan', 'Accelerating the battery electric vehicle programme for road transport'),
    R('perpres-79-2023', 'Perpres 79/2023', 'Perubahan atas Perpres 55/2019', 'Amendment of Perpres 55/2019'),
    R('permen-kemenkeu-12-2025', 'PMK 12/2025', 'PPN ditanggung pemerintah atas mobil listrik roda empat dan bus listrik tertentu (2025)', 'Government-borne VAT on certain electric cars and buses (2025)'),
    R('permen-kemenperin-6-2022', 'Permenperin 6/2022', 'Spesifikasi, peta jalan, dan penghitungan TKDN kendaraan bermotor listrik', 'Specifications, roadmap and local content calculation for electric vehicles'),
    R('permen-esdm-1-2023', 'Permen ESDM 1/2023', 'Penyediaan infrastruktur pengisian listrik untuk kendaraan listrik', 'Provision of charging infrastructure for electric vehicles'),
    R('permen-kemenperin-6-2023', 'Permenperin 6/2023', 'Bantuan pemerintah untuk pembelian kendaraan listrik roda dua (diubah)', 'Government aid for buying electric two-wheelers (amended)'),
    R('inpres-7-2022', 'Inpres 7/2022', 'Penggunaan kendaraan listrik sebagai kendaraan dinas', 'Use of electric vehicles as official vehicles'),
    R('permen-kemenkeu-9-2024', 'PMK 9/2024', 'PPnBM atas impor dan penyerahan kendaraan listrik tertentu', 'Luxury sales tax on import and delivery of certain electric vehicles'),
  ] };
  bab['13'] = { tipe: 'linimasa', sumber: sm('regul', 'motor23', 'hlitempo', 'pmk', 'cbu', 'lgjp'), butir: [
    { tanggal: '2019-01-01', judul: T('Perpres 55/2019 tentang percepatan KBLBB (tahun saja)', 'Perpres 55/2019 on accelerating BEV (year only)'), url: SUMBER.regul.url },
    { tanggal: '2023-09-19', judul: T('Bantuan motor listrik berubah menjadi satu KTP satu unit', 'Motorcycle aid changes to one ID one unit'), url: SUMBER.motor23.url },
    { tanggal: '2024-07-03', judul: T('HLI Green Power diresmikan', 'HLI Green Power inaugurated'), url: SUMBER.hlitempo.url },
    { tanggal: '2025-02-04', judul: T('PMK 12/2025 berlaku untuk masa pajak Januari sampai Desember 2025', 'PMK 12/2025 takes effect for tax periods January to December 2025'), url: SUMBER.pmk.url },
    { tanggal: '2025-04-24', judul: T('LG keluar dari paket baterai, Huayou disebut pengganti', 'LG exits battery package, Huayou named replacement'), url: SUMBER.lgjp.url },
    { tanggal: '2025-12-31', judul: T('Insentif impor CBU berakhir', 'CBU import incentives end'), url: SUMBER.cbu.url },
    { tanggal: '2026-01-01', judul: T('Kewajiban produksi lokal 1:1 berlaku', 'The 1:1 local production obligation begins'), url: SUMBER.cbu.url },
    { tanggal: '2027-12-31', judul: T('Akhir periode kewajiban 1:1', 'End of the 1:1 obligation period'), url: SUMBER.cbu.url },
  ] };
  bab['14'] = { tipe: 'teks', sumber: sm('pmk', 'cbu', 'motor23', 'motor24'), paragraf: P(
    ['Insentif mobil: PPN DTP 10 persen untuk TKDN minimal 40 persen (bus listrik 5 persen untuk TKDN 20 sampai kurang dari 40 persen) pada 2025; faktur pajak wajib bertuliskan PPN ditanggung pemerintah sesuai PMK 12/2025. PPnBM DTP 3 persen berlaku untuk mobil hibrida tertentu.', 'Car incentives: VAT borne by government at 10 percent for local content of at least 40 percent (electric buses 5 percent for 20 to under 40 percent) in 2025; invoices must state VAT borne by government per PMK 12/2025. Luxury-tax relief of 3 percent applies to certain hybrid cars.'],
    ['Kewajiban penerima insentif impor CBU: produksi lokal setara jumlah impor (1:1) pada 1 Januari 2026 sampai 31 Desember 2027, dengan TKDN 40 persen yang naik bertahap ke 60 persen.', 'Obligation of CBU import incentive recipients: local production equal to imports (1:1) from 1 January 2026 to 31 December 2027, with local content of 40 percent rising gradually to 60 percent.'],
    ['Motor listrik: bantuan Rp7 juta per unit, satu KTP satu unit sejak 19 September 2023.', 'Electric motorcycles: aid of IDR 7 million per unit, one ID one unit since 19 September 2023.'],
  ) };
  bab['15'] = { tipe: 'langkah', sumber: sm('ed', 'waralaba', 'oto'), catatan: T('Ringkasan alur umum untuk pengelola SPKLU; biaya, durasi, dan detail izin belum bersumber.', 'General flow for charger operators; costs, durations and permit details are not sourced.'), butir: [
    { judul: T('Pilih lokasi dan mitra PLN', 'Choose a site and PLN partner'), isi: T('Lokasi strategis (jalan tol, pusat belanja) dan pola kemitraan atau waralaba dengan PLN yang disarankan pelaku industri.', 'Strategic sites (toll roads, malls) and a partnership or franchise pattern with PLN suggested by industry.'), pelaku: T('Pengelola, PLN', 'Operator, PLN') },
    { judul: T('Penyambungan daya dan izin', 'Power connection and permits'), isi: T('Daya dari PLN dan izin usaha penyediaan infrastruktur pengisian menurut Permen ESDM 1/2023.', 'Power from PLN and business permit for charging infrastructure under Energy Ministry Reg. 1/2023.'), pelaku: T('Pengelola, PLN, ESDM', 'Operator, PLN, Energy Ministry') },
    { judul: T('Pilih teknologi pengisian', 'Choose charging technology'), isi: T('Pengisian cepat DC di koridor jalan dan AC di tujuan; contoh SPKLU ultra fast di Tol Jagorawi.', 'DC fast charging on corridors and AC at destinations; example: ultra-fast chargers on the Jagorawi toll road.'), pelaku: T('Pengelola', 'Operator') },
    { judul: T('Operasi dan pembayaran', 'Operation and payment'), isi: T('Integrasi aplikasi pembayaran dan pemeliharaan, termasuk ketersediaan saat arus mudik.', 'Payment app integration and maintenance, including availability during holiday peaks.'), pelaku: T('Pengelola, PLN', 'Operator, PLN') },
  ] };
  bab['16'] = { tipe: 'teks', sumber: sm('pmk', 'ruuebet'), paragraf: P(
    ['PMK 12/2025 hanya berlaku untuk masa pajak 2025; status insentif PPN DTP mobil listrik untuk 2026 tidak dapat dikonfirmasi dari sumber yang dibaca, sehingga perlu dicek ke Kemenkeu atau DJP sebelum dipakai dalam rencana bisnis.', 'PMK 12/2025 applies only to 2025 tax periods; the 2026 status of the electric car VAT incentive could not be confirmed from the sources read, so it must be checked with the Finance Ministry or tax office before business planning.'],
    ['RUU EBET berada pada tahap pembahasan menurut arsip METI 8 September 2026; forum Konsultasi dapat dipakai untuk masukan tentang pengisian dan kendaraan listrik.', 'RUU EBET is in deliberation per the METI archive of 8 September 2026; the Consultation forum can be used for input on charging and electric vehicles.'],
  ) };
  bab['17'] = { tipe: 'teks', sumber: sm('iea', 'oto', 'jagorawi', 'hliauto'), paragraf: P(
    ['IEA mencatat penjualan mobil listrik Asia Tenggara naik hampir 50 persen pada 2024 dengan pangsa 9 persen, dan satu dari empat mobil terjual pada 2030 akan listrik. Teknologi pengisian bergerak ke arah ultra cepat (contoh SPKLU di Tol Jagorawi) dan penukaran baterai (2.240 swap station di Indonesia pada Maret 2025).', 'The IEA records Southeast Asian electric car sales rising almost 50 percent in 2024 with a 9 percent share, and one in four cars sold in 2030 being electric. Charging technology is moving toward ultra-fast (example: Jagorawi toll road chargers) and battery swapping (2,240 swap stations in Indonesia in March 2025).'],
    ['Produksi lokal sel (10 GWh per tahun di Karawang) memungkinkan Kona Electric dirakit dengan sel Indonesia.', 'Local cell production (10 GWh a year in Karawang) allows the Kona Electric to be built with Indonesian cells.'],
  ) };
  bab['20'] = { tipe: 'tabel', per: 8, sumber: sm('iea', 'norway', 'thstar', 'cbu', 'kontanev'), catatan: T('Pembanding terpilih; metrik tidak seragam antar negara.', 'Selected comparators; metrics are not uniform across countries.'), kolom: [{ k: 'n', l: T('Negara atau wilayah', 'Country or region') }, { k: 'f', l: T('Fakta kunci', 'Key fact') }, { k: 'h', l: T('Pendorong', 'Driver') }], baris: [
    { n: T('Norwegia', 'Norway'), f: T('Pangsa kendaraan plug-in 88,9 persen pada 2024', 'Plug-in share 88.9 percent in 2024'), h: T('Bebas PPN 25 persen, bebas pajak pembelian, bebas tol', '25 percent VAT exemption, purchase tax exemption, toll exemption') },
    { n: T('Tiongkok', 'China'), f: T('Lebih dari 11 juta mobil listrik pada 2024, hampir separuh penjualan', 'Over 11 million electric cars in 2024, almost half of sales'), h: T('Industri dan rantai pasok domestik', 'Domestic industry and supply chain') },
    { n: T('Asia Tenggara', 'Southeast Asia'), f: T('Pangsa 9 persen pada 2024, naik hampir 50 persen', '9 percent share in 2024, up almost 50 percent'), h: T('Thailand dan Vietnam lebih tinggi', 'Thailand and Viet Nam higher') },
    { n: 'Thailand', f: T('Merek Tiongkok lebih dari 70 persen pasar EV; subsidi hingga THB 150.000 per unit dengan produksi 1,5:1', 'Chinese brands over 70 percent of the EV market; subsidy up to THB 150,000 per unit with 1.5:1 production'), h: T('Program EV 3.0', 'EV 3.0 programme') },
    { n: 'Indonesia', f: T('43.000 unit grosir pada 2024; insentif CBU berakhir 2025 dengan produksi lokal 1:1', '43,000 wholesale units in 2024; CBU incentives end 2025 with 1:1 local production'), h: T('PPN DTP TKDN 40 persen', 'VAT relief at 40 percent local content') },
  ] };
  bab['21'] = { tipe: 'teks', sumber: sm('norway', 'iea', 'thstar', 'thnation'), paragraf: P(
    ['Norwegia berhasil lewat paket fiskal yang membuat mobil listrik lebih murah daripada mobil bensin (bebas PPN 25 persen, bebas pajak pembelian, tol, dan biaya lain) selama bertahun-tahun, dengan target semua penjualan baru nol emisi pada 2025. Tiongkok berhasil lewat industri dan rantai pasok: lebih dari 11 juta mobil listrik pada 2024.', 'Norway succeeded through a fiscal package making electric cars cheaper than petrol cars (25 percent VAT exemption, purchase tax, tolls and other fees) over many years, with a goal of all new sales zero-emission by 2025. China succeeded through industry and supply chain: over 11 million electric cars in 2024.'],
    ['Thailand menunjukkan sisi lain: insentif EV 3.0 menarik merek Tiongkok yang mendominasi (lebih dari 70 persen), lalu perang harga dan kelebihan pasokan, dan Neta gagal memenuhi komitmen produksi sebelum induknya bangkrut pada Juni 2025.', 'Thailand shows the other side: EV 3.0 incentives drew Chinese brands that dominate (over 70 percent), then a price war and oversupply, and Neta missed its production commitment before its parent went bankrupt in June 2025.'],
  ) };
  bab['22'] = { tipe: 'teks', sumber: sm('iea', 'bakrie', 'kontanev'), paragraf: P(
    ['Asia Tenggara berpangsa 9 persen mobil listrik pada 2024 (IEA); satu sumber menyebut pangsa mobil listrik nasional Indonesia sekitar 15 persen pada November 2025 (belum diverifikasi, tahun berbeda), sehingga Indonesia berada di kelompok atas kawasan tetapi jauh di bawah Tiongkok dan Norwegia.', 'Southeast Asia had a 9 percent electric car share in 2024 (IEA); one source puts Indonesia\'s national share at about 15 percent in November 2025 (unverified, different year), placing Indonesia in the upper group of the region but far below China and Norway.'],
    ['Perbandingan dengan Thailand dan Vietnam yang lebih tinggi menurut IEA tidak dapat dikuantifikasi karena angkanya tidak diberikan.', 'The comparison with Thailand and Viet Nam, said by the IEA to be higher, cannot be quantified because no figures are given.'],
  ) };
  bab['23'] = { tipe: 'teks', sumber: sm('cbu', 'hliauto', 'lgscmp'), paragraf: P(
    ['Kerja sama pabrikan bersifat investasi: enam perusahaan CBU (BYD, Geely, VinFast, Xpeng, GWM, Citroen/AION/Maxus) berkomitmen produksi lokal; Hyundai dan LG membangun sel; LG keluar dari paket lain dan CATL masuk lewat proyek baterai.', 'Maker cooperation is investment-based: six CBU firms (BYD, Geely, VinFast, Xpeng, GWM, Citroen/AION/Maxus) commit to local production; Hyundai and LG built cells; LG exited another package and CATL entered through a battery project.'],
    ['Perjanjian perdagangan atau standar pengisian bersama lintas ASEAN tidak ditemukan di sumber yang dibaca.', 'ASEAN-wide trade agreements or shared charging standards were not found in the sources read.'],
  ) };
  const pr1 = pendRows((x) => (x.sektor || []).includes('elektrifikasi') || /kendaraan|vehicle|e-mobility|charging|baterai/i.test(x.nama), 10);
  if (pr1.length) bab['24'] = { tipe: 'tabel', per: 8, sumber: sm('pendanaan'), catatan: T('Skema dan proyek pendana yang menyebut kendaraan atau elektrifikasi di basis METI.', 'Funder schemes and projects naming vehicles or electrification in the METI base.'), kolom: PEND_KOL, baris: pr1 };
  bab['25'] = { tipe: 'rumus', sumber: sm('pmk', 'ed'), rumus: P(
    ['Penghematan pembeli = harga jual x tarif PPN DTP', 'Buyer saving = selling price x VAT-borne rate'],
    ['Biaya total kepemilikan = harga + biaya energi + perawatan - nilai jual kembali', 'Total cost of ownership = price + energy cost + maintenance - resale value'],
  ), contoh: [
    T(`Untuk mobil listrik berharga Rp400 juta (angka ilustrasi), PPN DTP 10 persen dari harga jual setara penghematan sekitar Rp${ppn} juta (EST, harga adalah hipotesis).`, `For an electric car priced at IDR 400 million (illustrative), VAT borne at 10 percent of selling price equals a saving of about IDR ${ppn} million (EST, price is a hypothesis).`),
    T('Biaya total kepemilikan belum dapat dihitung dengan sumber karena tarif SPKLU, harga mobil, dan nilai jual kembali tidak ditemukan dalam sumber yang dibaca.', 'Total cost of ownership cannot yet be computed from sources because charger tariffs, car prices and resale values were not found in the sources read.'),
  ] };
  bab['26'] = { tipe: 'tabel', per: 8, sumber: sm('cbu', 'hlitempo', 'lgscmp'), catatan: T('Nilai dari pemberitaan; bukan audit.', 'Values from press; not audited.'), kolom: [{ k: 'p', l: T('Hal', 'Item') }, { k: 'n', l: T('Nilai', 'Value') }, { k: 'k', l: T('Keterangan', 'Note') }], baris: [
    { p: T('Enam perusahaan penerima insentif CBU', 'Six CBU incentive recipients'), n: 'Rp15,52 triliun', k: T('Kapasitas rencana 305.000 unit per tahun', 'Planned capacity 305,000 units a year') },
    { p: 'HLI Green Power', n: T('USD 1,1 miliar atau USD 3,1 miliar (Tempo)', 'USD 1.1 billion or USD 3.1 billion (Tempo)'), k: T('10 GWh per tahun; Juli 2024', '10 GWh a year; July 2024') },
    { p: T('Paket baterai yang ditinggalkan LG', 'Battery package LG abandoned'), n: T('Sekitar USD 8,45 miliar', 'About USD 8.45 billion'), k: T('Huayou disebut pengganti, April 2025', 'Huayou named replacement, April 2025') },
  ] };
  bab['27'] = { tipe: 'teks', sumber: sm('owid', 'ed', 'regul'), paragraf: P(
    [`Manfaat iklim kendaraan listrik di Indonesia bergantung pada jaringan yang masih ${ci} gCO2 per kWh: dengan asumsi hipotesis, mobil listrik sekitar ${evG} gCO2 per km berbanding sekitar ${iceG} untuk mobil bensin (EST). Manfaat meningkat bila pengisian memakai surya atau jaringan yang makin hijau.`, `The climate benefit of electric vehicles in Indonesia depends on a grid still at ${ci} gCO2 per kWh: under hypothetical assumptions an electric car emits about ${evG} gCO2 per km versus about ${iceG} for a petrol car (EST). The benefit rises as charging uses solar or a greener grid.`],
    [HIP + 'sepeda motor listrik (mayoritas kendaraan Indonesia) memberi manfaat per kilometer lebih besar daripada mobil, tetapi serapan subsidinya rendah; prioritas kebijakan mungkin perlu bergeser ke sana.', HIPE + 'electric motorcycles (most of Indonesia\'s vehicles) give a larger per-kilometre benefit than cars, but subsidy uptake was low; policy priority may need to shift there.'],
    ['Daur ulang baterai diatur baku mutu emisi Permen LHK 12/2021; dampak tambang nikel pada ekosistem baterai belum bersumber di bab ini.', 'Battery recycling emissions are governed by Environment Ministry Reg. 12/2021; nickel mining impacts of the battery ecosystem are not sourced in this chapter.'],
  ) };
  bab['29'] = { tipe: 'teks', sumber: sm('cbujp', 'cbu', 'motor23', 'thstar'), paragraf: P(
    ['Insentif: pendukung penghentian insentif impor menyebut perlunya mendorong manufaktur domestik; kekhawatirannya adalah laju penjualan melambat saat harga naik. Satu sumber mempertanyakan apakah penjualan tetap tumbuh eksponensial setelah insentif dicabut.', 'Incentives: supporters of ending import incentives say domestic manufacturing must be encouraged; the worry is that sales slow when prices rise. One source questions whether sales keep growing exponentially after incentives are removed.'],
    ['Motor listrik: Menperin menyebut daya baterai dan lama pengisian sebagai penyebab rendahnya serapan subsidi 2023; pihak lain menilai syarat penyaluran sebelum disederhanakan terlalu rumit. Tanggapan pelaku industri atas kritik ini belum kami muat.', 'Electric motorcycles: the Industry Minister cited battery capability and charging time for low 2023 subsidy uptake; others see pre-simplification eligibility rules as too complex. Industry responses to this critique are not yet carried.'],
    ['Thailand: pendukung EV 3.0 menyebut produksi lokal tumbuh; pengamat menyebut perang harga dan Neta yang gagal memenuhi kuota produksi.', 'Thailand: EV 3.0 supporters say local production grew; observers point to the price war and Neta missing its production quota.'],
  ) };
  bab['30'] = { tipe: 'tabel', per: 8, sumber: sm('oto', 'cbu', 'iea'), catatan: T('Target adalah rencana; target 60.000 unit 2025 dilampaui pada penjualan grosir menurut sumber yang belum diverifikasi.', 'Targets are plans; the 60,000-unit 2025 target was exceeded in wholesale sales per an unverified source.'), kolom: [{ k: 'd', l: T('Target atau jadwal', 'Target or schedule') }, { k: 'v', l: T('Nilai', 'Value'), num: true, d: 0 }, { k: 'sat', l: T('Satuan', 'Unit') }], baris: [
    { d: T('Target pemerintah mobil listrik 2025', 'Government electric car target 2025'), v: 60000, sat: T('unit', 'units') },
    { d: T('Target pemerintah mobil listrik 2030', 'Government electric car target 2030'), v: 2000000, sat: T('unit', 'units') },
    { d: T('Target rasio PLN di area publik 2030 (satu SPKLU untuk lima kendaraan)', 'PLN public-area ratio target 2030 (one charger per five vehicles)'), v: 5, sat: T('kendaraan per SPKLU', 'vehicles per charger') },
    { d: T('TKDN produksi lokal: awal 2026 sampai tujuan', 'Local-production TKDN: from early 2026 to goal'), v: 60, sat: T('persen (dari 40)', 'percent (from 40)') },
    { d: T('Asia Tenggara: porsi mobil baru listrik pada 2030 (IEA)', 'Southeast Asia: electric share of new cars by 2030 (IEA)'), v: 25, sat: T('persen', 'percent') },
  ] };
  bab['31'] = { tipe: 'teks', sumber: sm('ed', 'oto', 'waralaba'), paragraf: P(
    [HIP + 'Pengembang: surya atap atau PLTS di lokasi pengisian mengurangi biaya energi dan jejak karbon SPKLU. Investor: SPKLU di luar Jawa (Papua 27 unit) kekurangan pemakai, jadi bergantung pada kemitraan PLN. Pemda: tetapkan pengadaan kendaraan dinas listrik (Inpres 7/2022) dan izin SPKLU. Akademisi: ukur utilisasi SPKLU dan umur baterai tropis.', HIPE + 'Developers: rooftop or on-site solar at charging sites cuts charger energy cost and carbon. Investors: chargers outside Java (Papua 27 units) lack users, so depend on PLN partnership. Local government: set electric official-vehicle procurement (Inpres 7/2022) and charger permits. Academics: measure charger utilisation and tropical battery life.'],
  ) };
  bab['32'] = { tipe: 'teks', sumber: sm('pmk', 'cbu', 'oto', 'lgjp'), paragraf: P(
    ['Yang perlu dipantau: (1) status PPN DTP mobil listrik 2026; (2) realisasi produksi lokal 1:1 enam perusahaan; (3) penjualan setelah insentif CBU berakhir; (4) rasio SPKLU terhadap kendaraan, terutama di luar Jawa; (5) kelanjutan paket baterai setelah LG keluar.', 'To watch: (1) 2026 VAT-borne status for electric cars; (2) actual 1:1 local production by the six firms; (3) sales after CBU incentives end; (4) charger-to-vehicle ratio, especially outside Java; (5) continuation of the battery package after LG exit.'],
  ) };
  bab['38'] = { tipe: 'teks', sumber: sm('ed'), paragraf: P(
    ['Metode: SPKLU dari data PLN yang dikutip Otodriver dan Bisnis, penjualan dari Kontan dan satu sumber yang mengutip Gaikindo, kebijakan dari basis regulasi METI, DDTC, dan Jakarta Globe, perbandingan negara dari IEA dan ringkasan Wikipedia. Beberapa halaman (Bisnis, Kontan) memblokir pengambilan otomatis sehingga hanya judul dan ringkasan pencarian dipakai. Sintesis berlabel Analisis METI (Hipotesis). Batas: angka penjualan 2025 belum diverifikasi ke Gaikindo, status insentif 2026 tidak terkonfirmasi, tarif SPKLU dan harga mobil tidak ditemukan.', 'Method: chargers from PLN data quoted by Otodriver and Bisnis, sales from Kontan and one source citing Gaikindo, policy from the METI regulation base, DDTC and Jakarta Globe, country comparison from the IEA and Wikipedia summaries. Some pages (Bisnis, Kontan) block automated fetching so only headlines and search summaries were used. Synthesis is labelled METI analysis (Hypothesis). Limits: 2025 sales are not verified against Gaikindo, the 2026 incentive status is unconfirmed, charger tariffs and car prices were not found.'],
  ) };

  const cs = kasus;
  bab['39'] = { tipe: 'kasus', sumber: sm('oto', 'hliauto', 'cbu', 'norway', 'iea'), catatan: T('Biaya yang tidak ditemukan sengaja dikosongkan. Keberhasilan Indonesia di sini bersifat tahap awal dan relatif.', 'Costs not found are deliberately blank. Indonesia\'s success here is early-stage and relative.'), butir: [
    cs({ id: 'spklupln', nama: 'Jaringan SPKLU PLN', jenis: 'berhasil', lokasi: T('Nasional, terutama Jawa', 'National, mostly Java'),
      profil: [{ label: T('Maret 2025', 'March 2025'), nilai: 3772, satuan: T('unit di 2.515 lokasi', 'units at 2,515 locations') }, { label: T('Nataru 2025', 'Christmas-New Year 2025'), nilai: 4516, satuan: T('unit di 2.935 titik', 'units at 2,935 points') }, { label: T('Pelaksana', 'Operator'), nilai: T('PLN dan mitra swasta', 'PLN and private partners') }],
      tindakan: P(['PLN menambah SPKLU bertahap dan menyiapkan SPKLU mudik; juga SPKLU motor, swap station, dan home charging.', 'PLN added chargers in stages and prepared holiday chargers; also motorcycle chargers, swap stations and home charging.']),
      sebab: P(['PLN sebagai pemilik jaringan listrik dan lokasi sendiri (SPBU, kantor) mempercepat penyebaran.', 'PLN as grid owner with its own sites speeds up roll-out.'], ['Pola kemitraan atau waralaba disarankan industri untuk mempercepat.', 'A partnership or franchise pattern is suggested by industry to speed things up.']),
      angka: [{ label: T('SPKLU roda empat Maret 2025', 'Four-wheel chargers March 2025'), nilai: 3772, d: 0, satuan: T('unit', 'units'), sumber: 'oto', est: false }, { label: T('Nataru 2025', 'Christmas-New Year 2025'), nilai: 4516, d: 0, satuan: T('unit', 'units'), sumber: 'nataru', est: false }],
      tanda_bahaya: P(['Ketimpangan wilayah: Papua 27 unit dan Maluku 25 unit dibanding Jawa 2.667.', 'Regional imbalance: Papua 27 units and Maluku 25 versus Java 2,667.']),
      pelajaran: P(['Jaringan pengisian tumbuh lebih cepat bila pemilik jaringan listrik memimpin, tetapi pemerataan wilayah butuh skema khusus.', 'Charging networks grow faster when the grid owner leads, but regional balance needs a specific scheme.']),
      faktor: { pengelola_om: true, jaringan: true }, sumber: ['oto', 'nataru', 'mesin'], hak_jawab: true }),
    cs({ id: 'hlikona', nama: 'Ekosistem sel Hyundai dan LG untuk Kona Electric', jenis: 'berhasil', lokasi: T('Karawang, Jawa Barat', 'Karawang, West Java'),
      profil: [{ label: T('Sel', 'Cells'), nilai: 10, satuan: T('GWh per tahun', 'GWh a year') }, { label: T('Diresmikan', 'Inaugurated'), nilai: '2024-07-03' }],
      tindakan: P(['Pabrik sel HLI Green Power memasok pabrik mobil Hyundai di Indonesia untuk Kona Electric.', 'The HLI Green Power cell plant supplies Hyundai\'s car plant in Indonesia for the Kona Electric.']),
      sebab: P(['Pembeli sel dan pabrikan sudah berada di lokasi yang sama.', 'The cell buyer and carmaker are in the same location.']),
      angka: [{ label: T('Kapasitas sel', 'Cell capacity'), nilai: 10, d: 0, satuan: T('GWh per tahun', 'GWh a year'), sumber: 'hliauto', est: false }],
      pelajaran: P(['Rantai sel hingga kendaraan di satu lokasi mengurangi risiko pembeli; lihat topik Penyimpanan.', 'A cell-to-vehicle chain in one location lowers buyer risk; see the Storage topic.']),
      faktor: { ppa_tarif: true, pendanaan: true }, sumber: ['hliauto', 'hlitempo'], hak_jawab: true }),
    cs({ id: 'cbulokal', nama: 'Insentif CBU yang dikaitkan produksi lokal 1:1', jenis: 'berhasil', lokasi: T('Nasional', 'National'),
      profil: [{ label: T('Penerima', 'Recipients'), nilai: 6 }, { label: T('Kapasitas rencana', 'Planned capacity'), nilai: 305000, satuan: T('unit per tahun', 'units a year') }, { label: T('Investasi', 'Investment'), nilai: 15.52, satuan: T('triliun rupiah', 'trillion rupiah') }],
      tindakan: P(['Insentif impor utuh hingga 31 Desember 2025 diganti kewajiban produksi lokal setara impor (1:1) pada 2026 sampai 2027 dengan TKDN naik dari 40 ke 60 persen.', 'Import incentives through 31 December 2025 are replaced by an obligation to produce locally equal to imports (1:1) in 2026 to 2027 with local content rising from 40 to 60 percent.']),
      sebab: P(['Insentif dibuat bersyarat pada komitmen produksi, bukan hibah tanpa syarat.', 'The incentive was made conditional on production commitments, not an unconditional grant.']),
      angka: [{ label: T('Investasi komitmen', 'Committed investment'), nilai: 15.52, d: 2, satuan: T('triliun rupiah', 'trillion rupiah'), sumber: 'cbu', est: false }],
      tanda_bahaya: P(['Komitmen belum terbukti sampai produksi 2026-2027; Thailand menunjukkan risiko perusahaan gagal memenuhi kuota (Neta).', 'Commitments are unproven until 2026-2027 production; Thailand shows the risk of firms missing quotas (Neta).']),
      pelajaran: P(['Insentif bersyarat produksi menarik investasi; ujiannya adalah penegakan kewajiban 1:1.', 'Production-conditional incentives attract investment; the test is enforcement of the 1:1 obligation.']),
      faktor: { kepastian_kebijakan: true, pendanaan: true }, sumber: ['cbu', 'cbujp'], hak_jawab: true }),
    cs({ id: 'norwegia', nama: 'Norwegia: pangsa kendaraan plug-in 88,9 persen', jenis: 'berhasil', negara: 'NO', lokasi: T('Norwegia', 'Norway'),
      profil: [{ label: T('Pangsa 2024', '2024 share'), nilai: 88.9, satuan: T('persen kendaraan plug-in', 'percent plug-in vehicles') }, { label: T('Target', 'Goal'), nilai: T('Semua penjualan baru nol emisi pada 2025', 'All new sales zero-emission by 2025') }],
      tindakan: P(['Pembebasan PPN 25 persen, pajak pembelian, tol, dan biaya jalan; jalur bus dan pengisian publik.', 'Exemption from 25 percent VAT, purchase tax, tolls and road fees; bus lanes and public charging.']),
      sebab: P(['Insentif fiskal besar dan konsisten selama bertahun-tahun yang membuat mobil listrik lebih murah.', 'Large, consistent fiscal incentives over many years that made electric cars cheaper.']),
      angka: [{ label: T('Pangsa plug-in 2024', 'Plug-in share 2024'), nilai: 88.9, d: 1, satuan: T('persen', 'percent'), sumber: 'norway', est: false }, { label: T('Titik pengisian publik 2019', 'Public charging points 2019'), nilai: 13687, d: 0, satuan: '', sumber: 'norway', est: false }],
      pelajaran: P(['Insentif konsisten dan pengisian publik yang luas lebih penting daripada besaran satu kali; sebagian insentif dikurangi bertahap sejak 2018.', 'Consistent incentives and broad public charging matter more than one-off size; some incentives were phased down gradually from 2018.']),
      faktor: { kepastian_kebijakan: true, ppa_tarif: true, jaringan: true }, sumber: ['norway'], hak_jawab: true }),
    cs({ id: 'tiongkok', nama: 'Tiongkok: lebih dari 11 juta mobil listrik pada 2024', jenis: 'berhasil', negara: 'CN', lokasi: T('Tiongkok', 'China'),
      profil: [{ label: T('Penjualan 2024', '2024 sales'), nilai: 11, satuan: T('juta mobil listrik (lebih dari)', 'million electric cars (over)') }, { label: T('Pangsa', 'Share'), nilai: T('Hampir separuh penjualan mobil', 'Almost half of car sales') }],
      tindakan: P(['Industri baterai dan kendaraan domestik bersama kebijakan permintaan.', 'A domestic battery and vehicle industry together with demand policy.']),
      sebab: P(['Skala industri dan rantai pasok domestik; IEA memperkirakan sekitar 60 persen penjualan pada 2025.', 'Industrial scale and domestic supply chain; the IEA projects about 60 percent of sales in 2025.']),
      angka: [{ label: T('Mobil listrik 2024', 'Electric cars 2024'), nilai: 11, d: 0, satuan: T('juta (lebih dari)', 'million (over)'), sumber: 'iea', est: false }],
      tanda_bahaya: P(['Perang harga dan kelebihan kapasitas merembet ke pasar lain (Thailand).', 'Price war and overcapacity spill over to other markets (Thailand).']),
      pelajaran: P(['Skala industri menurunkan harga, namun pasar tujuan ekspor menanggung limpahan persaingan.', 'Industrial scale lowers prices, but export destination markets bear the competitive spillover.']),
      faktor: { pendanaan: true, kepastian_kebijakan: true }, sumber: ['iea', 'thstar'], hak_jawab: true }),
  ] };
  bab['40'] = { tipe: 'kasus', sumber: sm('motor23', 'lgjp', 'thstar', 'oto'), catatan: HAK, butir: [
    cs({ id: 'motorsubsidi', nama: 'Subsidi motor listrik: serapan rendah', jenis: 'mundur', lokasi: T('Nasional', 'National'),
      profil: [{ label: T('Kuota 2023', '2023 quota'), nilai: 200000, satuan: T('unit', 'units') }, { label: T('Anggaran', 'Budget'), nilai: 1.4, satuan: T('triliun rupiah', 'trillion rupiah') }],
      kronologi: [{ tanggal: '2023-08-03', teks: T('Republika: realisasi subsidi motor listrik baru sekitar satu persen.', 'Republika: electric motorcycle subsidy uptake only about one percent.') }, { tanggal: '2023-09-19', teks: T('Syarat disederhanakan: satu KTP satu unit.', 'Rules simplified: one ID one unit.') }, { tanggal: '2024-12-01', teks: T('Tersalur 30.083 unit atau 60,1 persen dari target 2024 (bulan saja).', '30,083 units delivered, 60.1 percent of the 2024 target (month only).') }],
      sebab: P(['Menperin menyebut kemampuan baterai dan lamanya pengisian.', 'The Industry Minister cited battery capability and charging time.'], ['Syarat penyaluran awal yang rumit sebelum diubah menjadi satu KTP satu unit.', 'Complex eligibility rules before changing to one ID one unit.']),
      terdampak: T('Produsen motor listrik dan calon pembeli; anggaran Rp1,4 triliun hanya terserap sekitar Rp80,7 miliar pada 2023 menurut Emitennews. Angka serapan 2023 berbeda antar sumber (11.532 unit menurut Menperin, 4.148 menurut SISAPIRa pertengahan November).', 'Electric motorcycle makers and buyers; of the IDR 1.4 trillion budget only about IDR 80.7 billion was absorbed in 2023 per Emitennews. 2023 uptake figures differ between sources (11,532 units per the Minister, 4,148 per SISAPIRa in mid-November).'),
      seharusnya: T('Menguji kesiapan baterai dan stasiun penukaran serta menyederhanakan syarat sebelum menetapkan kuota 200.000 unit.', 'Test battery readiness and swap stations and simplify rules before setting a 200,000 unit quota.'),
      tanda_bahaya: P(['Serapan satu persen setelah beberapa bulan.', 'One percent uptake after several months.']),
      angka: [{ label: T('Serapan 2023 menurut Menperin', '2023 uptake per the Minister'), nilai: 11532, d: 0, satuan: T('unit', 'units'), sumber: 'motor23', est: false }, { label: T('Serapan anggaran 2023', '2023 budget absorbed'), nilai: 80.7, d: 1, satuan: T('miliar rupiah', 'billion rupiah'), sumber: 'motor23b', est: false }],
      faktor: { kepastian_kebijakan: true, pengelola_om: true }, sumber: ['motor23', 'motor23b', 'motor23c', 'motor24'], hak_jawab: true }),
    cs({ id: 'lgev', nama: 'LG keluar dari paket baterai kendaraan listrik', jenis: 'mundur', lokasi: T('Indonesia', 'Indonesia'),
      profil: [{ label: T('Paket', 'Package'), nilai: T('Sekitar USD 8,45 miliar', 'About USD 8.45 billion') }],
      kronologi: [{ tanggal: '2025-04-24', teks: T('Pemerintah menyatakan Huayou menggantikan LG; LG menyebut kondisi pasar dan lingkungan investasi.', 'Government says Huayou replaces LG; LG cited market conditions and the investment environment.') }],
      sebab: P(['LG menyebut kondisi pasar dan lingkungan investasi.', 'LG cited market conditions and the investment environment.']),
      terdampak: T('Peta jalan baterai kendaraan listrik; pemerintah menyatakan pergantian investor lazim dan rencana tidak berubah. Detail lengkap di topik Penyimpanan.', 'The EV battery roadmap; government says changing investors is common and plans do not change. Full detail is in the Storage topic.'),
      seharusnya: T('Mitra cadangan dan syarat keluar yang jelas pada paket besar.', 'Standby partners and clear exit terms in large packages.'),
      tanda_bahaya: P(['Investor besar menyatakan kondisi pasar tidak mendukung.', 'A major investor says market conditions do not support the project.']),
      angka: [{ label: T('Nilai paket menurut SCMP', 'Package value per SCMP'), nilai: 8.45, d: 2, satuan: T('miliar USD', 'billion USD'), sumber: 'lgscmp', est: false }],
      faktor: { pendanaan: true, kepastian_kebijakan: true }, sumber: ['lgjp', 'lgscmp'], hak_jawab: true }),
    cs({ id: 'neta', nama: 'Thailand EV 3.0: Neta dan perang harga', jenis: 'gagal', negara: 'TH', lokasi: T('Thailand', 'Thailand'),
      profil: [{ label: T('Subsidi', 'Subsidy'), nilai: T('Hingga THB 150.000 per unit', 'Up to THB 150,000 per unit') }, { label: T('Syarat produksi', 'Production condition'), nilai: T('1,5 kendaraan lokal per kendaraan impor', '1.5 local vehicles per imported vehicle') }],
      kronologi: [{ tanggal: '2025-06-20', teks: T('Induk Neta, Zhejiang Hozon, memasuki proses kebangkrutan.', 'Neta\'s parent, Zhejiang Hozon, enters bankruptcy proceedings.') }],
      sebab: P(['Neta memproduksi sekitar 4.000 unit dari 19.000 yang diwajibkan; pangsa pasar turun dari sekitar 12 persen (2023) menjadi 4 persen.', 'Neta produced about 4,000 units of 19,000 required; share fell from about 12 percent (2023) to 4 percent.'], ['Perang harga: beberapa merek memotong harga lebih dari 20 persen.', 'Price war: some brands cut prices by over 20 percent.']),
      terdampak: T('Pembeli Neta dan pemasok Thailand. Dewan Investasi Thailand menyatakan masalah Neta berasal dari keuangan induknya dan tidak berdampak jangka panjang pada industri EV Thailand; pendapat itu dimuat berdampingan.', 'Neta buyers and Thai suppliers. Thailand\'s Board of Investment said Neta\'s problems came from its parent\'s finances and would not affect the Thai EV industry long-term; that view is carried alongside.'),
      seharusnya: T('Pemantauan komitmen produksi setiap dua bulan dan rencana kompensasi, seperti usulan Kementerian Thailand.', 'Bimonthly monitoring of production commitments and compensatory plans, as proposed by the Thai ministry.'),
      tanda_bahaya: P(['Produksi jauh di bawah komitmen.', 'Production far below commitment.'], ['Merek Tiongkok menguasai lebih dari 70 persen pasar.', 'Chinese brands hold over 70 percent of the market.']),
      angka: [{ label: T('Produksi Neta vs wajib', 'Neta output vs required'), nilai: T('4.000 dari 19.000', '4,000 of 19,000'), d: 0, satuan: T('unit', 'units'), sumber: 'thstar', est: false }],
      faktor: { kepastian_kebijakan: true, pendanaan: true }, sumber: ['thstar', 'thnation'], hak_jawab: true }),
    cs({ id: 'spkluimbang', nama: 'Ketimpangan SPKLU antarwilayah', jenis: 'mundur', lokasi: T('Luar Jawa, terutama Papua dan Maluku', 'Outside Java, especially Papua and Maluku'),
      profil: [{ label: T('Papua', 'Papua'), nilai: 27, satuan: T('unit', 'units') }, { label: T('Maluku', 'Maluku'), nilai: 25, satuan: T('unit', 'units') }, { label: T('Jawa', 'Java'), nilai: 2667, satuan: T('unit', 'units') }],
      kronologi: [{ tanggal: '2025-05-03', teks: T('Otodriver memuat data PLN Maret 2025: Jakarta sekitar 1:20, pelaku industri menyebut 2030 terlalu lama dan menyarankan waralaba.', 'Otodriver carries PLN March 2025 data: Jakarta about 1:20, an industry voice calls 2030 too slow and suggests franchising.') }],
      sebab: P(['Sebaran SPKLU mengikuti kepadatan kendaraan dan pelanggan, sehingga wilayah timur tertinggal (analisis dari data, bukan pernyataan sumber).', 'Charger distribution follows vehicle and customer density, so eastern regions lag (analysis from data, not a source statement).']),
      terdampak: T('Calon pengguna di luar Jawa. Kasus ini adalah kesenjangan data sebaran, bukan proyek gagal; PLN belum memberi tanggapan dalam sumber yang dibaca.', 'Prospective users outside Java. This case is a distribution data gap, not a failed project; PLN has not given a response in the sources read.'),
      seharusnya: T('Skema khusus wilayah (kemitraan, subsidi lokasi) dan target rasio per wilayah.', 'Region-specific schemes (partnerships, site subsidy) and per-region ratio targets.'),
      tanda_bahaya: P(['Rasio 1:20 di kota yang paling padat.', 'A 1:20 ratio in the densest city.']),
      angka: [{ label: T('Papua dibanding Jawa', 'Papua versus Java'), nilai: 27, d: 0, satuan: T('unit dari 3.772', 'units of 3,772'), sumber: 'oto', est: false }],
      faktor: { jaringan: true, pendanaan: true }, sumber: ['oto'], hak_jawab: true }),
  ] };
  bab['41'] = { tipe: 'pola', sumber: sm('ed'), catatan: T('Sel dibangun dari bendera faktor tiap kasus; pemetaan faktor ke kasus adalah analisis METI (Hipotesis) atas fakta di bab 39 dan 40.', 'Cells are built from each case factor flags; mapping factors to cases is METI analysis (Hypothesis) on facts in chapters 39 and 40.'), faktor: FAKTOR_STD.map(([k, a, e]) => L(k, a, e)) };
  bab['42'] = { tipe: 'periksa', sumber: sm('ed'), peran: PERAN, tahap: TAHAP, butir: [
    dasarP('pengembang', 'lokasi', 'Tempatkan SPKLU di koridor padat dan tujuan dengan PLTS di lokasi bila memungkinkan; uji utilisasi sebelum memperluas ke daerah sepi.', 'Place chargers on busy corridors and at destinations with on-site solar where possible; test utilisation before expanding to quiet areas.', 'oto'),
    dasarP('pengembang', 'izin', 'Ikuti Permen ESDM 1/2023 untuk infrastruktur pengisian dan gunakan pola kemitraan PLN.', 'Follow Energy Ministry Reg. 1/2023 for charging infrastructure and use the PLN partnership pattern.', 'waralaba'),
    dasarP('pengembang', 'operasi', 'Pastikan ketersediaan SPKLU pada arus mudik.', 'Ensure charger availability during holiday peaks.', 'nataru'),
    dasarP('investor', 'dana', 'Periksa penegakan kewajiban produksi 1:1 dan risiko kuota yang tidak terpenuhi (Neta).', 'Check enforcement of the 1:1 production obligation and the risk of missed quotas (Neta).', 'thstar'),
    dasarP('investor', 'ppa', 'Jangan mengandalkan insentif PPN DTP yang berlaku satu tahun fiskal.', 'Do not rely on a VAT-borne incentive that lasts one fiscal year.', 'pmk'),
    dasarP('pemda', 'lokasi', 'Tetapkan lahan SPKLU dan pengadaan kendaraan dinas listrik (Inpres 7/2022).', 'Designate charger sites and procure electric official vehicles (Inpres 7/2022).', 'oto'),
    dasarP('pusat', 'ppa', 'Umumkan kelanjutan insentif tahun berikutnya lebih awal agar pasar tidak menunggu.', 'Announce next-year incentive continuity earlier so the market does not wait.', 'pmk'),
    dasarP('pusat', 'bangun', 'Pantau komitmen produksi lokal setiap dua bulan (usulan Thailand).', 'Monitor local production commitments every two months (Thai proposal).', 'thstar'),
    dasarP('pusat', 'izin', 'Uji kesiapan baterai dan swap station sebelum menetapkan kuota bantuan motor.', 'Test battery readiness and swap stations before setting motorcycle aid quotas.', 'motor23'),
    dasarP('pln', 'operasi', 'Publikasikan utilisasi dan rasio SPKLU per wilayah, termasuk Papua dan Maluku.', 'Publish charger utilisation and ratio per region, including Papua and Maluku.', 'oto'),
    dasarP('meti', 'operasi', 'Pantau penjualan setelah insentif CBU berakhir, dan beri hak jawab pada pihak yang disebut.', 'Monitor sales after CBU incentives end, and give named parties a right of reply.', 'cbu'),
  ] };
  const DERET_KUNCI = perdalam(bab, SUMBER);
  lengkapi({ kunci, bab }, { deret: DERET_KUNCI });
  return {
    id: ID, versi: 1, diperbarui: TGL,
    judul: T('Kendaraan listrik dan SPKLU', 'Electric vehicles and chargers'),
    lead: T('Penjualan mobil listrik naik cepat dari 10.000 unit (2022) dan SPKLU PLN lebih dari 4.500 unit, tetapi insentif berubah tiap tahun dan ekosistem baterai masih diuji.', 'Electric car sales rose fast from 10,000 units (2022) and PLN chargers exceed 4,500 units, but incentives change yearly and the battery ecosystem is still being tested.'),
    kunci,
    penting: P(
      ['Insentif impor utuh berakhir 31 Desember 2025 dan digantikan kewajiban produksi lokal 1:1 pada 2026 sampai 2027.', 'Import incentives ended on 31 December 2025 and are replaced by a 1:1 local production obligation in 2026 to 2027.'],
      ['SPKLU PLN tumbuh dari 3.772 unit (Maret 2025) ke 4.516 (Nataru 2025), namun Papua hanya 27 unit dan Jawa 2.667.', 'PLN chargers grew from 3,772 units (March 2025) to 4,516 (Christmas-New Year 2025), yet Papua has only 27 and Java 2,667.'],
      ['Manfaat iklim bergantung pada jaringan listrik yang masih sekitar 680 gCO2 per kWh.', 'The climate benefit depends on a grid still at about 680 gCO2 per kWh.'],
    ),
    posisi: T('Indonesia berada di tahap awal adopsi: jauh di bawah Norwegia (88,9 persen kendaraan plug-in) dan Tiongkok (hampir separuh penjualan), dan di sekitar kelompok atas Asia Tenggara (pangsa kawasan 9 persen pada 2024).', 'Indonesia is at an early stage of adoption: far below Norway (88.9 percent plug-in) and China (almost half of sales), and around the upper group of Southeast Asia (regional share 9 percent in 2024).'),
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
    fs.writeFileSync(path.join(akar, 'public/data/topik/kendaraan_listrik.json'), JSON.stringify(d, null, 1) + '\n');
    console.log(`bab naskah ${Object.keys(d.bab).length}/41 (+bab 1); mercusuar ${d.bab['39'].butir.length}; gagal ${d.bab['40'].butir.length}; sumber ${Object.keys(d.sumber).length}`);
  }
}
