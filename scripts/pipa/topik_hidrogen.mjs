// Naskah topik Hidrogen dan amonia hijau (kerangka 42 bab) mengikuti docs/perencanaan/TOPIK-SKEMA.md.
// Menyusun public/data/topik/hidrogen.json dari data repo (dihitung, bukan diketik) + sumber publik bertanggal.
// Pakai: node scripts/pipa/topik_hidrogen.mjs [--selftest]
// Aturan: tiap klaim bersumber (kunci peta sumber); analisis sendiri berlabel "Analisis METI (Hipotesis)"; bab tanpa data dikosongkan; kasus yang menyebut pihak wajib hak jawab.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validasi } from './topik_surya.mjs';
export { validasi };
const akar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ID = 'hidrogen';
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
  dpr: S('DPR RI Pusat Analisis, Info Singkat: Membangun ekosistem hidrogen hijau di Indonesia (Okt 2025; RHAN 2025, LCOH USD 4,3 sampai 8,3 per kg, permintaan 4 Mtpa pada 2024)', 'DPR RI', 'https://berkas.dpr.go.id/pusaka/files/info_singkat/Info%20Singkat-XVII-19-I-P3DI-Oktober-2025-245.pdf', '2025-10-01', 'resmi'),
  mc: S('Green hydrogen plant pertama di Indonesia resmi beroperasi (Muara Karang, 9 Okt 2023; 51 ton per tahun; PLTS ditambah REC dari PLTP Kamojang)', 'Kementerian ESDM', 'https://esdm.go.id/en/media-center/news-archives/green-hydrogen-plant-pertama-di-indonesia-resmi-beroperasi', '2023-10-11', 'resmi'),
  mcantara: S('Pertama di Indonesia, PLN produksi green hydrogen 100 persen dari EBT kapasitas 51 ton per tahun', 'Antara Babel', 'https://babel.antaranews.com/berita/373428/pertama-di-indonesia-pln-produksi-green-hydrogen-100-persen-dari-ebt-kapasitas-51-ton-per-tahun', '2023-10-10', 'media'),
  ghp21: S('PLN resmikan 21 unit green hydrogen plant (sekitar 191 sampai 199 ton per tahun menurut judul dan ringkasan berbeda)', 'Listrik Indonesia', 'https://listrikindonesia.com/detail/11939/pln-resmikan-21-unit-green-hydrogen-plant-memiliki-kapasitas-191-ton', '2023-11-22', 'media'),
  ghp199: S('Utilisasi pembangkit thermal, PLN produksi 199 ton hidrogen hijau (23 Nov 2023)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20231123/44/1717163/utilisasi-pembangkit-thermal-pln-produksi-199-ton-hidrogen-hijau', '2023-11-23', 'media'),
  hrs: S('Indonesia\'s first: PLN launches green hydrogen refueling station (Senayan; 203 ton per tahun dari 22 GHP, 128 ton untuk transportasi)', 'Indonesia Business Post', 'https://indonesiabusinesspost.com/2178/business-and-investment/indonesias-first-pln-launches-green-hydrogen-refueling-station', TGL, 'media'),
  hrsrri: S('RI launches first hydrogen refueling station, eyes green future', 'RRI', 'https://rri.co.id/en/national/1478128/ri-launches-first-hydrogen-refueling-station-eyes-green-future', TGL, 'media'),
  ulu: S('Proyek pilot plant green hydrogen di Ulubelu dimulai (groundbreaking 9 Sep 2025; 100 kg per hari; sekitar USD 3 juta; target operasi 2026)', 'Listrik Indonesia', 'https://listrikindonesia.com/detail/17800/proyek-pilot-plant-green-hydrogen-di-ulubelu-dimulai', '2025-09-09', 'media'),
  ghes: S('GHES 2026 buka peluang investasi hidrogen nasional (Strategi Hidrogen Nasional diluncurkan Desember 2023)', 'Listrik Indonesia', 'https://listrikindonesia.com/detail/19181/ghes-2026-buka-peluang-investasi-hidrogen-nasional', '2026-01-01', 'media'),
  ibp: S('Government outlines hydrogen adoption plan through 2060 (target 9,9 Mtpa pada 2060 menurut data ESDM; angka lain 11,7 juta ton dalam draf peta jalan)', 'Indonesia Business Post', 'https://indonesiabusinesspost.com/1952/Politics/government-outlines-hydrogen-adoption-plan-through-2060', TGL, 'media'),
  neom: S('Construction completed on USD 8.5bn Neom hydrogen project (komisioning, operasi komersial 2027)', 'MEED', 'https://guest.meed.com/acwa-completes-construction-of-85bn-hydrogen-project/', '2026-08-01', 'media'),
  neom80: S('Saudi Arabia\'s NEOM green hydrogen project hits 80 percent completion (Jun 2025)', 'Solar Quarter', 'https://solarquarter.com/2025/06/03/saudi-arabias-neom-green-hydrogen-project-hits-80-completion-paving-the-way-for-worlds-largest-carbon-free-fuel-facility-by-2026/', '2025-06-03', 'media'),
  neomceo: S('World\'s largest green hydrogen plant on track for 2026 launch in Saudi Arabia, CEO says (sekitar 600 ton per hari)', 'Arab News', 'https://www.arabnews.com/node/2579284/amp', TGL, 'media'),
  kuqa: S('China\'s Sinopec says world-leading green hydrogen project will take longer than expected to ramp up (Kuqa, 260 MW, 20.000 ton per tahun)', 'South China Morning Post', 'https://www.scmp.com/business/article/3247148/chinas-sinopec-says-world-leading-green-hydrogen-project-will-take-longer-expected-ramp', '2024-01-01', 'media'),
  kuqa2: S('Sinopec Xinjiang Kuqa green hydrogen pilot project, China (konstruksi Des 2021, operasi 30 Agu 2023)', 'Engineering News', 'https://www.engineeringnews.co.za/article/sinopec-xinjiang-kuqa-green-hydrogen-pilot-project-china-2023-05-05', '2023-05-05', 'media'),
  fh2r: S('Fukushima Hydrogen Energy Research Field (ringkasan Wikipedia: PLTS 10 MW, hingga 1.200 Nm3 per jam, diresmikan 2020)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Fukushima_Hydrogen_Energy_Research_Field', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  bp: S('BP backs out of 26 GW green hydrogen plan in Australia (28 Jul 2025; Fortescue batalkan PEM50 Gladstone dan proyek AS)', 'pv magazine', 'https://www.pv-magazine.com/2025/07/28/bp-backs-out-of-26-gw-green-hydrogen-plan-in-australia/', '2025-07-28', 'media'),
  fort: S('Cancelled post-FID: Fortescue abandons two green hydrogen projects it had previously signed off on', 'Hydrogen Insight', 'https://www.hydrogeninsight.com/production/fortescue-abandons-two-green-hydrogen-projects-which-had-both-passed-a-final-investment-decision/2-1-1849742', '2025-07-01', 'media'),
  fort2: S('Fortescue pulls plug on Queensland green hydrogen plant but insists real zero target still on track', 'RenewEconomy', 'https://reneweconomy.com.au/fortescue-pulls-plug-on-queensland-green-hydrogen-plant-but-insists-real-zero-target-still-on-track/', '2025-07-01', 'media'),
  cancel: S('Update: cancelled and postponed green hydrogen projects (Jul 2025)', 'Hydrocarbon Processing', 'https://www.hydrocarbonprocessing.com/news/2025/07/update-cancelled-and-postponed-green-hydrogen-projects/', '2025-07-01', 'media'),
  tville: S('No customers: plans for Townsville hydrogen project scrapped after failing to find buyers', 'Pulse', 'https://www.pulse.bot/energy/news/no-customers-plans-for-townsville-hydrogen-project-scrapped-after-failing-to-find-buyers-for-the-pro-89c9063f-bdd1-4bad-87a8-2561f74d05d4/', TGL, 'media'),
  repay: S('Albanese government tells Fortescue to repay hydrogen grant for dumped Gladstone project', 'BD Times', 'https://www.bdtimes.com.au/business/energy/hand-it-back-albanese-government-tells-fortescue-to-repay-hydrogen-grant-for-dumped-gladstone-project-c-19468162', TGL, 'media'),
};

export function susun() {
  const bab = {};
  const rf = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
  const LHV = 33.3; // kWh per kg, nilai fisika
  const gwh203 = rf(203000 * LHV / 1e6, 1), pang = rf(203 / 4e6 * 100, 4);
  const neomGwhDay = rf(600000 * LHV / 1e6, 1), neomTwh = rf(neomGwhDay * 365 / 1000, 1);
  const ulu = rf(100 * 365 / 1000, 1);
  const elektr = rf(50 * 0.05, 2);
  const pr1 = pendRows((x) => /hydrogen|hidrogen/i.test(x.nama), 10);

  const kunci = [
    { label: T('Produksi hidrogen hijau PLN (22 GHP)', 'PLN green hydrogen production (22 GHP)'), nilai: 203, d: 0, satuan: T('ton per tahun', 'tonnes a year'), sumber: 'hrs', est: false },
    { label: T('Permintaan hidrogen Indonesia (2024)', 'Indonesia hydrogen demand (2024)'), nilai: 4, d: 0, satuan: T('juta ton per tahun', 'million tonnes a year'), sumber: 'dpr', est: false },
    { label: T('Biaya hidrogen dari PLTS (batas bawah)', 'Hydrogen cost from solar (lower bound)'), nilai: 4.3, d: 1, satuan: T('USD per kg', 'USD per kg'), sumber: 'dpr', est: false },
    { label: T('Pilot Pertamina Ulubelu', 'Pertamina Ulubelu pilot'), nilai: 100, d: 0, satuan: T('kg per hari', 'kg a day'), sumber: 'ulu', est: false },
    { label: T('NEOM, Arab Saudi (kemampuan produksi)', 'NEOM, Saudi Arabia (production capability)'), nilai: 600, d: 0, satuan: T('ton per hari', 'tonnes a day'), sumber: 'neomceo', est: false },
  ];

  bab['2'] = { tipe: 'faq', sumber: sm('ed', 'dpr', 'hrs', 'ulu', 'mc'), butir: FQ([
    ['Apa itu hidrogen hijau?', 'What is green hydrogen?', 'Hidrogen yang dibuat dengan elektrolisis air memakai listrik terbarukan. Hidrogen abu-abu dibuat dari gas alam dan melepas CO2; hidrogen biru menambah penangkapan karbon.', 'Hydrogen made by electrolysing water with renewable power. Grey hydrogen comes from natural gas and releases CO2; blue hydrogen adds carbon capture.'],
    ['Sudah ada hidrogen hijau di Indonesia?', 'Is there green hydrogen in Indonesia yet?', 'Ya, kecil. PLN mengoperasikan 22 pabrik hidrogen hijau (GHP) dengan total sekitar 203 ton per tahun; yang pertama di Muara Karang (51 ton per tahun, 9 Oktober 2023).', 'Yes, small. PLN runs 22 green hydrogen plants (GHP) with about 203 tonnes a year in total; the first at Muara Karang (51 tonnes a year, 9 October 2023).'],
    ['Berapa permintaan hidrogen Indonesia?', 'How much hydrogen does Indonesia use?', `Sekitar 4 juta ton per tahun pada 2024 menurut DPR; produksi hijau PLN sekitar ${pang} persen dari itu (hitung sendiri).`, `About 4 million tonnes a year in 2024 per the DPR; PLN green output is about ${pang} percent of that (own calculation).`],
    ['Berapa biaya hidrogen hijau?', 'How much does green hydrogen cost?', 'DPR mencatat biaya dari PLTS sekitar USD 4,3 sampai 8,3 per kg, diperkirakan turun ke sekitar USD 2 per kg sebelum 2040.', 'The DPR records a cost from solar of about USD 4.3 to 8.3 per kg, expected to fall to about USD 2 per kg before 2040.'],
    ['Apa rencana pemerintah?', 'What is the government plan?', 'Strategi Hidrogen Nasional diluncurkan Desember 2023, dan Roadmap Hidrogen dan Amonia Nasional (RHAN) 2025 membagi tiga tahap: inisiasi 2025-2030, integrasi 2031-2044, akselerasi 2045-2060.', 'The National Hydrogen Strategy was launched in December 2023, and the 2025 National Hydrogen and Ammonia Roadmap (RHAN) has three stages: initiation 2025-2030, integration 2031-2044, acceleration 2045-2060.'],
    ['Apa itu pilot Ulubelu?', 'What is the Ulubelu pilot?', 'Pilot Pertamina Geothermal di PLTP Ulubelu, Lampung: groundbreaking 9 September 2025, 100 kg per hari, sekitar USD 3 juta, target operasi 2026.', 'A Pertamina Geothermal pilot at the Ulubelu geothermal plant, Lampung: groundbreaking 9 September 2025, 100 kg a day, about USD 3 million, operation targeted for 2026.'],
    ['Apakah ada stasiun pengisian hidrogen?', 'Is there a hydrogen refuelling station?', 'Ya, stasiun pertama PLN di Senayan, Jakarta, dipasok dari GHP PLN.', 'Yes, PLN\'s first station in Senayan, Jakarta, supplied from PLN GHPs.'],
    ['Kenapa proyek hidrogen dibatalkan di luar negeri?', 'Why are hydrogen projects cancelled abroad?', 'Contoh Australia: Fortescue membatalkan dua proyek pada Juli 2025, BP keluar dari hub 26 GW, dan proyek Townsville dihentikan karena tidak menemukan pembeli. Lihat bab 40.', 'Australian examples: Fortescue cancelled two projects in July 2025, BP exited a 26 GW hub, and the Townsville project was scrapped for lack of buyers. See chapter 40.'],
  ]) };
  bab['3'] = { tipe: 'glosarium', sumber: sm('ed'), butir: G([
    ['Hidrogen hijau', 'Hidrogen dari elektrolisis memakai listrik terbarukan.', 'Hydrogen from electrolysis using renewable power.'], ['Hidrogen abu-abu / biru', 'Dari gas alam tanpa / dengan penangkapan karbon.', 'From natural gas without / with carbon capture.'],
    ['Elektroliser', 'Alat pemecah air menjadi hidrogen dan oksigen (PEM, alkali, AEM).', 'Device splitting water into hydrogen and oxygen (PEM, alkaline, AEM).'], ['GHP', 'Green hydrogen plant milik PLN.', 'PLN green hydrogen plant.'],
    ['HRS / SPBH', 'Stasiun pengisian hidrogen.', 'Hydrogen refuelling station.'], ['Amonia hijau', 'Amonia dari hidrogen hijau, pembawa hidrogen dan pupuk.', 'Ammonia made from green hydrogen, a carrier and fertiliser.'],
    ['LCOH', 'Biaya hidrogen rata-rata per kilogram selama umur proyek.', 'Levelized cost of hydrogen per kilogram over the project life.'], ['REC', 'Sertifikat energi terbarukan yang menjadi dasar klaim listrik hijau.', 'Renewable energy certificate underpinning a green power claim.'],
    ['RHAN', 'Roadmap Hidrogen dan Amonia Nasional 2025.', 'National Hydrogen and Ammonia Roadmap 2025.'], ['Co-firing hidrogen', 'Mencampur hidrogen dengan gas di PLTG.', 'Blending hydrogen with gas in gas turbines.'],
    ['Nm3', 'Normal meter kubik, satuan volume gas.', 'Normal cubic metre, a gas volume unit.'], ['LHV', 'Nilai kalor bawah; hidrogen sekitar 33,3 kWh per kg.', 'Lower heating value; hydrogen is about 33.3 kWh per kg.'],
    ['Offtaker', 'Pembeli yang menandatangani kontrak pembelian jangka panjang.', 'Buyer signing a long-term purchase contract.'], ['FID', 'Keputusan investasi akhir.', 'Final investment decision.'],
    ['CCS', 'Penangkapan dan penyimpanan karbon.', 'Carbon capture and storage.'],
  ]) };
  bab['4'] = { tipe: 'teks', sumber: sm('dpr', 'mc', 'hrs'), paragraf: P(
    ['Hidrogen penting untuk sektor yang sulit dilistrikkan langsung: kilang, pupuk, baja, dan transportasi berat. Permintaan Indonesia sekitar 4 juta ton per tahun menurut DPR, hampir seluruhnya hidrogen yang belum hijau.', 'Hydrogen matters for sectors hard to electrify directly: refineries, fertiliser, steel and heavy transport. Indonesian demand is about 4 million tonnes a year per the DPR, almost all of it not yet green.'],
    ['Pasokan hijau Indonesia baru dimulai: PLN memulai dengan 51 ton per tahun di Muara Karang dan kini memiliki jaringan 22 GHP dengan sekitar 203 ton per tahun serta stasiun pengisian Senayan.', 'Indonesian green supply has just begun: PLN began with 51 tonnes a year at Muara Karang and now has a network of 22 GHP with about 203 tonnes a year and the Senayan refuelling station.'],
    ['Kunci ekonomi hidrogen hijau adalah harga listrik terbarukan dan pembeli jangka panjang; keduanya terbukti menentukan proyek di luar negeri.', 'The keys to green hydrogen economics are renewable power price and long-term buyers; both proved decisive in projects abroad.'],
  ) };
  bab['5'] = { tipe: 'rumus', sumber: sm('ed', 'dpr', 'neomceo'), rumus: P(
    ['Energi dalam hidrogen (kWh) = massa (kg) x 33,3 kWh per kg (nilai kalor bawah)', 'Energy in hydrogen (kWh) = mass (kg) x 33.3 kWh per kg (lower heating value)'],
    ['Biaya listrik per kg = konsumsi elektroliser (kWh per kg) x harga listrik', 'Electricity cost per kg = electrolyser consumption (kWh per kg) x power price'],
    ['LCOH = (biaya modal tahunan + biaya operasi + biaya listrik) / kg per tahun', 'LCOH = (annualised capital + operating + electricity cost) / kg per year'],
  ), contoh: [
    T(`PLN 203 ton per tahun setara sekitar ${gwh203} GWh energi hidrogen; NEOM 600 ton per hari setara sekitar ${neomGwhDay} GWh per hari atau ${neomTwh} TWh per tahun bila penuh (EST, hitung sendiri).`, `PLN's 203 tonnes a year equals about ${gwh203} GWh of hydrogen energy; NEOM at 600 tonnes a day is about ${neomGwhDay} GWh a day or ${neomTwh} TWh a year at full output (EST, own calculation).`),
    T(`Ulubelu 100 kg per hari berarti sekitar ${ulu} ton per tahun bila beroperasi penuh (EST).`, `Ulubelu at 100 kg a day is about ${ulu} tonnes a year at full operation (EST).`),
    T(`Dengan asumsi hipotesis konsumsi 50 kWh per kg dan listrik 5 sen USD per kWh, komponen listrik sekitar USD ${elektr} per kg; sisanya modal dan operasi menjelaskan LCOH USD 4,3 sampai 8,3 yang dicatat DPR (EST, konsumsi 50 kWh per kg adalah asumsi).`, `Assuming a hypothetical 50 kWh per kg and power at 5 US cents per kWh, the electricity component is about USD ${elektr} per kg; capital and operations explain the USD 4.3 to 8.3 LCOH the DPR records (EST, 50 kWh per kg is an assumption).`),
  ] };
  bab['6'] = { tipe: 'langkah', sumber: sm('ed', 'mc', 'hrs', 'ulu'), butir: [
    { judul: T('Listrik terbarukan', 'Renewable electricity'), isi: T('PLN memakai PLTS di PLTGU Muara Karang dan sertifikat REC dari PLTP Kamojang; Pertamina memakai PLTP Ulubelu.', 'PLN uses solar at the Muara Karang combined-cycle plant and RECs from the Kamojang geothermal plant; Pertamina uses the Ulubelu geothermal plant.'), pelaku: T('PLN, Pertamina Geothermal', 'PLN, Pertamina Geothermal') },
    { judul: T('Elektrolisis', 'Electrolysis'), isi: T('Elektroliser memecah air; pilot Ulubelu memakai elektroliser anion exchange membrane (AEM).', 'Electrolysers split water; the Ulubelu pilot uses an anion exchange membrane (AEM) electrolyser.'), pelaku: T('Pengembang, penyedia teknologi', 'Developer, technology provider') },
    { judul: T('Kompresi dan penyimpanan', 'Compression and storage'), isi: T('Penyimpanan dan transportasi masih terbatas menurut DPR.', 'Storage and transport are still limited per the DPR.'), pelaku: T('Pelaku logistik gas', 'Gas logistics players') },
    { judul: T('Pemakai', 'Users'), isi: T('Pendingin generator pembangkit, kendaraan sel bahan bakar lewat stasiun Senayan, industri, dan co-firing pembangkit.', 'Power plant generator cooling, fuel cell vehicles via the Senayan station, industry and plant co-firing.'), pelaku: T('PLN, industri, transportasi', 'PLN, industry, transport') },
    { judul: T('Amonia dan ekspor', 'Ammonia and export'), isi: T('Jalur pembawa untuk ekspor dan pupuk; belum ada proyek Indonesia yang bersumber.', 'A carrier route for export and fertiliser; no sourced Indonesian project yet.'), pelaku: T('Belum ada', 'None yet') },
  ] };
  bab['7'] = { tipe: 'grafik', jenis: 'kolom', sumber: sm('mc', 'ghp21', 'hrs'), label: T('Kapasitas produksi hidrogen hijau PLN', 'PLN green hydrogen production capacity'), satuan: T('ton per tahun', 'tonnes a year'), d: 0, seri: [{ nama: T('Ton per tahun', 'Tonnes a year'), sorot: true, titik: [['Okt 2023 (Muara Karang)', 51], ['Nov 2023 (21 GHP)', 199], ['Jaringan 22 GHP', 203]] }], catatan: T('Sumber memberi 191 sampai 199 ton untuk 21 GHP; 199 dipakai di grafik. Angka 203 ton untuk 22 GHP dari Indonesia Business Post.', 'Sources give 191 to 199 tonnes for 21 GHP; 199 is used in the chart. The 203 tonnes for 22 GHP is from Indonesia Business Post.') };
  bab['8'] = { tipe: 'tabel', per: 8, sumber: sm('mc', 'ghp21', 'hrs', 'ulu'), catatan: T('Lokasi bernama yang ditemukan; daftar lengkap 22 GHP tidak ditemukan.', 'Named locations found; the full list of 22 GHP was not found.'), kolom: [{ k: 'lok', l: T('Lokasi', 'Location') }, { k: 'pel', l: T('Pelaksana', 'Operator') }, { k: 'f', l: T('Fakta', 'Fact') }], baris: [
    { lok: 'Muara Karang, Jakarta', pel: 'PLN', f: T('GHP pertama, 51 ton per tahun, 9 Oktober 2023', 'First GHP, 51 tonnes a year, 9 October 2023') },
    { lok: T('Berbagai pembangkit PLN', 'Various PLN plants'), pel: 'PLN', f: T('21 GHP diresmikan November 2023, sekitar 191 sampai 199 ton per tahun', '21 GHP inaugurated November 2023, about 191 to 199 tonnes a year') },
    { lok: 'Kamojang, Jawa Barat', pel: 'PLN', f: T('GHP tambahan; jaringan menjadi sekitar 203 ton per tahun', 'Additional GHP; the network reaches about 203 tonnes a year') },
    { lok: 'Senayan, Jakarta', pel: 'PLN', f: T('Stasiun pengisian hidrogen pertama', 'First hydrogen refuelling station') },
    { lok: 'Ulubelu, Lampung', pel: 'Pertamina Geothermal', f: T('Pilot 100 kg per hari, groundbreaking 9 September 2025', 'Pilot of 100 kg a day, groundbreaking 9 September 2025') },
  ] };
  bab['11'] = { tipe: 'teks', sumber: sm('dpr', 'hrs'), paragraf: P(
    [`Pasar hidrogen Indonesia besar tetapi belum hijau: permintaan sekitar 4 juta ton per tahun (35 persen dari Asia Tenggara) menurut DPR, dibanding produksi hijau PLN sekitar 203 ton per tahun (${pang} persen, EST).`, `The Indonesian hydrogen market is large but not green: demand of about 4 million tonnes a year (35 percent of Southeast Asia) per the DPR, versus PLN green production of about 203 tonnes a year (${pang} percent, EST).`],
    ['Dari 203 ton, 128 ton dialokasikan untuk transportasi menurut Indonesia Business Post; sisanya untuk pendingin generator dan kebutuhan internal PLN. DPR mencatat belum ada kewajiban pemanfaatan hidrogen hijau di sektor tertentu sehingga pasar domestik belum berkembang.', 'Of the 203 tonnes, 128 are allocated to transport per Indonesia Business Post; the rest is for generator cooling and PLN internal needs. The DPR notes there is no mandatory use of green hydrogen in any sector so the domestic market has not developed.'],
  ) };
  bab['12'] = { tipe: 'tabel', per: 8, sumber: sm('dpr', 'ghes', 'regul'), catatan: T('Belum ditemukan undang-undang atau peraturan presiden khusus hidrogen; yang ada adalah dokumen strategi dan peta jalan.', 'No hydrogen-specific law or presidential regulation was found; what exists are strategy and roadmap documents.'), kolom: [{ k: 'dok', l: T('Dokumen', 'Document') }, { k: 'isi', l: T('Isi', 'Content') }, { k: 'st', l: T('Status', 'Status') }], baris: [
    { dok: T('Strategi Hidrogen Nasional', 'National Hydrogen Strategy'), isi: T('Diluncurkan Desember 2023 sebagai panduan percepatan', 'Launched December 2023 as an acceleration guide'), st: T('berlaku sebagai strategi', 'in force as strategy') },
    { dok: 'RHAN 2025', isi: T('Tiga tahap: 2025-2030, 2031-2044, 2045-2060; empat sektor (industri, transportasi, pembangkit, gas)', 'Three stages: 2025-2030, 2031-2044, 2045-2060; four sectors (industry, transport, power, gas)'), st: T('peta jalan', 'roadmap') },
    { dok: T('Standar sertifikasi hidrogen', 'Hydrogen certification standard'), isi: T('Belum ada menurut DPR Oktober 2025', 'Not yet in place per DPR October 2025'), st: T('belum ada', 'not yet') },
    { dok: T('Insentif fiskal hidrogen', 'Hydrogen fiscal incentive'), isi: T('Belum ada menurut DPR Oktober 2025', 'Not yet in place per DPR October 2025'), st: T('belum ada', 'not yet') },
  ] };
  bab['13'] = { tipe: 'linimasa', sumber: sm('mc', 'ghp21', 'ghes', 'ulu', 'bp', 'dpr', 'kuqa2', 'neom'), butir: [
    { tanggal: '2020-01-01', judul: T('Fukushima FH2R diresmikan (tahun saja)', 'Fukushima FH2R inaugurated (year only)'), url: SUMBER.fh2r.url },
    { tanggal: '2023-08-30', judul: T('Kuqa Sinopec 260 MW beroperasi', 'Sinopec Kuqa 260 MW in operation'), url: SUMBER.kuqa2.url },
    { tanggal: '2023-10-09', judul: T('GHP pertama PLN di Muara Karang diresmikan', 'PLN first GHP at Muara Karang inaugurated'), url: SUMBER.mc.url },
    { tanggal: '2023-11-22', judul: T('21 GHP PLN diresmikan', '21 PLN GHP inaugurated'), url: SUMBER.ghp21.url },
    { tanggal: '2023-12-01', judul: T('Strategi Hidrogen Nasional diluncurkan (bulan saja)', 'National Hydrogen Strategy launched (month only)'), url: SUMBER.ghes.url },
    { tanggal: '2025-07-28', judul: T('BP keluar dari hub 26 GW; Fortescue batalkan PEM50', 'BP exits the 26 GW hub; Fortescue cancels PEM50'), url: SUMBER.bp.url },
    { tanggal: '2025-09-09', judul: T('Groundbreaking pilot Ulubelu', 'Groundbreaking of the Ulubelu pilot'), url: SUMBER.ulu.url },
    { tanggal: '2025-10-01', judul: T('DPR menerbitkan Info Singkat tentang ekosistem hidrogen hijau (bulan saja)', 'DPR publishes brief on the green hydrogen ecosystem (month only)'), url: SUMBER.dpr.url },
    { tanggal: '2027-01-01', judul: T('Target operasi komersial NEOM (tahun saja)', 'NEOM commercial operation target (year only)'), url: SUMBER.neom.url },
  ] };
  bab['14'] = { tipe: 'teks', sumber: sm('dpr'), paragraf: P(
    ['Temuan DPR Oktober 2025: belum ada insentif fiskal hidrogen, belum ada standar sertifikasi, dan belum ada kewajiban pemanfaatan di sektor tertentu; ketiganya disebut sebagai penyebab minat investor rendah. Karena itu bab ini tidak memuat kewajiban atau sanksi.', 'DPR finding of October 2025: there is no hydrogen fiscal incentive, no certification standard and no mandatory use in any sector; all three are named as reasons for low investor interest. This chapter therefore carries no obligations or penalties.'],
    ['Rekomendasi DPR: memperkuat regulasi dan insentif fiskal, menetapkan target konsumsi hidrogen hijau untuk industri dan transportasi berat, dan membangun proyek dekat sumber energi dan pasar.', 'DPR recommendations: strengthen regulation and fiscal incentives, set green hydrogen consumption targets for industry and heavy transport, and build projects close to energy sources and markets.'],
  ) };
  bab['16'] = { tipe: 'teks', sumber: sm('dpr', 'ruuebet'), paragraf: P(
    ['DPR meminta Komisi XII menuntaskan RUU EBET dan mengawasi pelaksanaan RHAN. RUU EBET berada pada tahap pembahasan menurut arsip METI 8 September 2026 (tahap belum dicek ke situs DPR).', 'The DPR asks Commission XII to finish RUU EBET and oversee RHAN implementation. RUU EBET is in deliberation per the METI archive of 8 September 2026 (stage not checked against the DPR site).'],
    ['Masukan yang layak diajukan lewat forum Konsultasi: definisi hidrogen hijau yang tidak bergantung hanya pada REC, standar sertifikasi, dan jalur insentif.', 'Inputs worth submitting through the Consultation forum: a definition of green hydrogen not relying only on RECs, a certification standard and an incentive route.'],
  ) };
  bab['17'] = { tipe: 'teks', sumber: sm('ulu', 'dpr', 'kuqa', 'fh2r', 'neomceo'), paragraf: P(
    ['Elektroliser: pilot Ulubelu memakai AEM; Fortescue memakai PEM pada proyek PEM50 yang dibatalkan; Kuqa (Sinopec) berskala 260 MW; FH2R di Fukushima memakai PLTS 10 MW dan menghasilkan hingga 1.200 Nm3 per jam.', 'Electrolysers: the Ulubelu pilot uses AEM; Fortescue used PEM in its cancelled PEM50 project; Kuqa (Sinopec) is 260 MW; FH2R in Fukushima uses a 10 MW solar plant and makes up to 1,200 Nm3 an hour.'],
    ['Skala: NEOM menargetkan sekitar 600 ton per hari. Kuqa menunjukkan risiko ramp-up: laporan menyebut sekitar 35 persen dari output harapan pada 12 bulan pertama dan target 20.000 ton per tahun tertunda hingga 2025.', 'Scale: NEOM targets about 600 tonnes a day. Kuqa shows ramp-up risk: reports cite about 35 percent of expected output in the first 12 months and the 20,000 tonnes a year target delayed to 2025.'],
  ) };
  bab['19'] = { tipe: 'tabel', per: 6, sumber: sm('dpr'), catatan: T('Satu-satunya angka biaya hidrogen bersumber di bab ini; biaya modal elektroliser dan listrik Indonesia belum bersumber.', 'The only sourced hydrogen cost figure in this chapter; electrolyser capital cost and Indonesian power price are not yet sourced.'), kolom: [{ k: 'k', l: T('Keterangan', 'Description') }, { k: 'v', l: T('USD per kg', 'USD per kg') }], baris: [
    { k: T('Biaya hidrogen dari PLTS saat ini, batas bawah', 'Hydrogen cost from solar today, lower bound'), v: '4,3' },
    { k: T('Biaya hidrogen dari PLTS saat ini, batas atas', 'Hydrogen cost from solar today, upper bound'), v: '8,3' },
    { k: T('Perkiraan sebelum 2040', 'Expected before 2040'), v: T('sekitar 2', 'about 2') },
  ] };
  bab['20'] = { tipe: 'tabel', per: 8, sumber: sm('hrs', 'ulu', 'kuqa', 'neomceo', 'fh2r', 'bp'), catatan: T('Proyek terpilih sebagai pembanding, bukan peringkat negara.', 'Selected projects as comparators, not a country ranking.'), kolom: [{ k: 'n', l: T('Negara', 'Country') }, { k: 'f', l: T('Proyek dan fakta', 'Project and fact') }, { k: 'h', l: T('Catatan', 'Note') }], baris: [
    { n: 'Indonesia', f: T('PLN 22 GHP sekitar 203 ton per tahun; pilot Ulubelu 100 kg per hari', 'PLN 22 GHP about 203 tonnes a year; Ulubelu pilot 100 kg a day'), h: T('Skala kecil, pasar belum ada', 'Small scale, no market yet') },
    { n: T('Tiongkok', 'China'), f: T('Kuqa 260 MW, rencana 20.000 ton per tahun, hidrogen ke kilang Tahe', 'Kuqa 260 MW, plan of 20,000 tonnes a year, hydrogen to the Tahe refinery'), h: T('Pembeli ada (kilang) tetapi ramp-up lambat', 'Buyer exists (refinery) but ramp-up is slow') },
    { n: T('Arab Saudi', 'Saudi Arabia'), f: T('NEOM sekitar 600 ton per hari, USD 8,4 sampai 8,5 miliar, komisioning 2026-2027', 'NEOM about 600 tonnes a day, USD 8.4 to 8.5 billion, commissioning 2026-2027'), h: T('Skala terbesar, menunggu operasi komersial', 'Largest scale, awaiting commercial operation') },
    { n: T('Jepang', 'Japan'), f: T('FH2R Fukushima, PLTS 10 MW, hingga 1.200 Nm3 per jam, 2020', 'FH2R Fukushima, 10 MW solar, up to 1,200 Nm3 an hour, 2020'), h: T('Demonstrasi riset', 'Research demonstration') },
    { n: 'Australia', f: T('BP keluar dari hub 26 GW; Fortescue batalkan PEM50 dan proyek AS (Juli 2025)', 'BP exits the 26 GW hub; Fortescue cancels PEM50 and a US project (July 2025)'), h: T('Pembatalan massal setelah ekspektasi tinggi', 'Mass cancellations after high expectations') },
  ] };
  bab['21'] = { tipe: 'teks', sumber: sm('kuqa', 'neomceo', 'bp', 'tville'), paragraf: P(
    ['Dua proyek yang maju (Kuqa dan NEOM) sama-sama memiliki pembeli atau pemilik yang jelas: Kuqa memasok kilang Tahe yang mengganti hidrogen gas alam; NEOM dibiayai konsorsium dengan kontrak penjualan amonia. Dua negara berhasil, namun keduanya masih dalam ramp-up atau komisioning.', 'Two projects that advanced (Kuqa and NEOM) both have a clear buyer or sponsor: Kuqa feeds the Tahe refinery replacing gas-based hydrogen; NEOM is funded by a consortium with ammonia sales contracts. Two successes, yet both are still ramping or commissioning.'],
    ['Kegagalan Australia punya pola sama dari sisi sebaliknya: pembeli tidak ada (Townsville dihentikan karena tidak menemukan pembeli) dan strategi perusahaan berubah (BP).', 'The Australian failures share the same pattern from the other side: no buyers (Townsville was scrapped for lack of buyers) and changing corporate strategy (BP).'],
  ) };
  bab['22'] = { tipe: 'teks', sumber: sm('dpr', 'hrs', 'kuqa', 'neomceo'), paragraf: P(
    [`Produksi hijau Indonesia (203 ton per tahun) sekitar 1 persen dari rencana Kuqa (20.000 ton) dan jauh di bawah sehari NEOM (600 ton), namun Indonesia adalah pasar hidrogen terbesar di Asia Tenggara (35 persen dari permintaan kawasan menurut DPR).`, `Indonesian green production (203 tonnes a year) is about 1 percent of the Kuqa plan (20,000 tonnes) and far below one NEOM day (600 tonnes), yet Indonesia is the largest hydrogen market in Southeast Asia (35 percent of regional demand per the DPR).`],
    [HIP + 'keunggulan Indonesia ada pada permintaan besar yang sudah ada (pupuk, kilang) dan sumber panas bumi yang stabil, bukan pada skala elektroliser saat ini.', HIPE + 'Indonesia\'s edge is its existing large demand (fertiliser, refineries) and stable geothermal power, not its current electrolyser scale.'],
  ) };
  bab['23'] = { tipe: 'teks', sumber: sm('ghes', 'ibp'), paragraf: P(
    ['Kerja sama internasional dalam sumber yang dibaca terbatas pada undangan investasi: Indonesia Business Post mengutip data ESDM tentang target investasi hidrogen hijau sekitar USD 25,2 miliar sampai 2060, dan forum GHES 2026 membuka peluang investasi nasional.', 'International cooperation in the sources read is limited to investment invitations: Indonesia Business Post cites ESDM data on a green hydrogen investment target of about USD 25.2 billion to 2060, and the GHES 2026 forum opens national investment opportunities.'],
    ['Perjanjian pembelian ekspor atau kesepakatan antarpemerintah untuk amonia hijau tidak ditemukan.', 'Export purchase agreements or government-to-government deals for green ammonia were not found.'],
  ) };
  if (pr1.length) bab['24'] = { tipe: 'tabel', per: 8, sumber: sm('pendanaan'), catatan: T('Skema dan proyek pendana yang namanya menyebut hidrogen di basis METI.', 'Funder schemes and projects whose names mention hydrogen in the METI base.'), kolom: PEND_KOL, baris: pr1 };
  bab['25'] = { tipe: 'rumus', sumber: sm('dpr', 'ulu', 'neom'), rumus: P(
    ['Pendapatan = produksi (kg) x harga jual (USD per kg)', 'Revenue = production (kg) x selling price (USD per kg)'],
    ['Margin = harga jual - LCOH; margin negatif berarti perlu subsidi atau kewajiban pembeli', 'Margin = selling price - LCOH; a negative margin means subsidy or a buyer mandate is needed'],
  ), contoh: [
    T('Pilot Ulubelu bernilai sekitar USD 3 juta untuk 100 kg per hari (sekitar USD 82 ribu per kg per hari kapasitas, EST), sehingga sifatnya demonstrasi, bukan bisnis.', 'The Ulubelu pilot is about USD 3 million for 100 kg a day (about USD 82 thousand per kg-a-day of capacity, EST), so it is a demonstration, not a business.'),
    T('Dengan LCOH USD 4,3 sampai 8,3 per kg, hidrogen hijau baru kompetitif bila pembeli membayar premi hijau atau ada kewajiban; harga jual hidrogen abu-abu domestik belum bersumber.', 'With an LCOH of USD 4.3 to 8.3 per kg, green hydrogen is competitive only if buyers pay a green premium or there is a mandate; the domestic grey hydrogen price is not yet sourced.'),
  ] };
  bab['26'] = { tipe: 'tabel', per: 8, sumber: sm('neom', 'bp', 'fort', 'ulu'), catatan: T('Nilai dari pemberitaan; bukan audit.', 'Values from press; not audited.'), kolom: [{ k: 'p', l: T('Proyek', 'Project') }, { k: 'n', l: T('Nilai', 'Value') }, { k: 'k', l: T('Keterangan', 'Note') }], baris: [
    { p: 'NEOM Green Hydrogen', n: 'USD 8,4 sampai 8,5 miliar', k: T('Konstruksi selesai, komisioning, operasi komersial 2027', 'Construction complete, commissioning, commercial operation 2027') },
    { p: T('Australian Renewable Energy Hub', 'Australian Renewable Energy Hub'), n: T('Sekitar USD 55 miliar (perkiraan hub)', 'About USD 55 billion (hub estimate)'), k: T('BP (63,57 persen) keluar Juli 2025', 'BP (63.57 percent) exits July 2025') },
    { p: T('Fortescue PEM50 dan proyek AS', 'Fortescue PEM50 and US project'), n: T('Penghapusan buku sekitar USD 150 juta', 'Write-down of about USD 150 million'), k: T('Dibatalkan Juli 2025', 'Cancelled July 2025') },
    { p: T('Pilot Ulubelu', 'Ulubelu pilot'), n: 'USD 3 juta', k: T('100 kg per hari, target 2026', '100 kg a day, 2026 target') },
  ] };
  bab['27'] = { tipe: 'teks', sumber: sm('mc', 'dpr', 'ed'), paragraf: P(
    ['Klaim hijau PLN bersandar pada listrik surya di lokasi ditambah REC dari PLTP Kamojang (ESDM, 2023). REC adalah sertifikat, bukan listrik fisik ke elektroliser; definisi hidrogen hijau yang ketat perlu mempertimbangkan ketepatan waktu dan lokasi.', 'PLN\'s green claim rests on on-site solar power plus RECs from the Kamojang geothermal plant (ESDM, 2023). RECs are certificates, not physical power to the electrolyser; a strict definition of green hydrogen should consider time and location matching.'],
    [HIP + 'tanpa standar sertifikasi nasional (DPR, Oktober 2025), klaim hijau dapat berbeda-beda antar proyek; standar perlu hadir sebelum ekspor.', HIPE + 'without a national certification standard (DPR, October 2025), green claims may differ between projects; a standard is needed before exports.'],
    ['Risiko keselamatan, air, dan hak masyarakat sekitar proyek hidrogen Indonesia belum bersumber di bab ini.', 'Safety, water and community-rights risks around Indonesian hydrogen projects are not sourced in this chapter.'],
  ) };
  bab['28'] = { tipe: 'teks', sumber: sm('dpr', 'ulu'), paragraf: P(
    ['DPR mencatat keterbatasan teknologi dan SDM lokal dan merekomendasikan pelatihan dan sertifikasi. Pertamina menyebut pilot Ulubelu dapat menciptakan lapangan kerja (judul CNN Indonesia), tetapi jumlahnya tidak ditemukan.', 'The DPR notes limited local technology and human resources and recommends training and certification. Pertamina said the Ulubelu pilot can create jobs (CNN Indonesia headline), but the number was not found.'],
  ) };
  bab['29'] = { tipe: 'teks', sumber: sm('dpr', 'mc', 'fort2', 'repay', 'neom'), paragraf: P(
    ['Seberapa hijau: pendukung (ESDM, PLN) menyebut produksi PLN 100 persen hijau; kritik menekankan perlunya standar dan menilai klaim berbasis REC rawan. Kedua sisi menyepakati bahwa sertifikasi belum ada.', 'How green: supporters (ESDM, PLN) call PLN production 100 percent green; critics stress the need for standards and see REC-based claims as fragile. Both sides agree certification does not yet exist.'],
    ['Hype dan koreksi: Fortescue menyatakan target nol bersih tetap berjalan meski proyeknya dibatalkan, sementara pemerintah Australia dilaporkan meminta hibah proyek Gladstone dikembalikan. NEOM tetap berlanjut meski jadwalnya bergeser dari 2026 ke 2027.', 'Hype and correction: Fortescue says its real zero target stays on track despite cancelling projects, while the Australian government was reported to ask for the Gladstone grant to be repaid. NEOM continues although its schedule slipped from 2026 to 2027.'],
  ) };
  bab['30'] = { tipe: 'tabel', per: 8, sumber: sm('dpr', 'ibp', 'ghes'), catatan: T('Dua angka permintaan 2060 berbeda antar sumber (9,9 dan 11,7 juta ton); keduanya dimuat tanpa memilih.', 'Two 2060 demand numbers differ between sources (9.9 and 11.7 million tonnes); both are carried without choosing.'), kolom: [{ k: 'd', l: T('Target', 'Target') }, { k: 'v', l: T('Nilai', 'Value'), num: true, d: 1 }, { k: 'sat', l: T('Satuan', 'Unit') }], baris: [
    { d: T('Produksi hidrogen hijau 2030 (proyeksi IEA, dikutip DPR)', 'Green hydrogen production 2030 (IEA projection cited by DPR)'), v: 0.48, sat: T('juta ton', 'million tonnes') },
    { d: T('Co-firing hidrogen 60 persen di PLTG, 2045', 'Hydrogen co-firing 60 percent in gas turbines, 2045'), v: 60, sat: T('persen', 'percent') },
    { d: T('Pembangkit hidrogen murni 2060', 'Pure hydrogen power 2060'), v: 25.3, sat: 'GW' },
    { d: T('Permintaan 2060 menurut Indonesia Business Post (data ESDM)', '2060 demand per Indonesia Business Post (ESDM data)'), v: 9.9, sat: T('juta ton per tahun', 'million tonnes a year') },
    { d: T('Permintaan 2060 menurut draf peta jalan (Listrik Indonesia)', '2060 demand per roadmap draft (Listrik Indonesia)'), v: 11.7, sat: T('juta ton per tahun', 'million tonnes a year') },
  ] };
  bab['31'] = { tipe: 'teks', sumber: sm('ed', 'dpr', 'tville'), paragraf: P(
    [HIP + 'Pengembang: mulai dari pembeli yang sudah ada (pupuk, kilang, pendingin pembangkit) dan kontrak jangka panjang sebelum membangun elektroliser; proyek Townsville gagal karena tidak ada pembeli. Investor: tunggu standar sertifikasi dan kewajiban pemanfaatan. Pemda: lahan dan air dekat PLTP dan PLTS lebih menarik daripada ekspor jauh. Akademisi: elektrolisis AEM, penyimpanan, dan LCOH lokal.', HIPE + 'Developers: start with existing buyers (fertiliser, refineries, plant cooling) and long-term contracts before building electrolysers; the Townsville project failed for lack of buyers. Investors: wait for a certification standard and a use mandate. Local government: land and water near geothermal and solar plants are more attractive than distant export. Academics: AEM electrolysis, storage and local LCOH.'],
  ) };
  bab['32'] = { tipe: 'teks', sumber: sm('ulu', 'dpr', 'neom', 'ruuebet'), paragraf: P(
    ['Yang perlu dipantau: (1) operasi pilot Ulubelu pada 2026; (2) standar sertifikasi dan insentif fiskal hidrogen; (3) pembahasan RUU EBET; (4) operasi komersial NEOM 2027 sebagai ujian skala; (5) pembatalan atau FID baru di Australia dan Asia.', 'To watch: (1) Ulubelu pilot operation in 2026; (2) certification standard and hydrogen fiscal incentives; (3) RUU EBET deliberation; (4) NEOM commercial operation in 2027 as a scale test; (5) new cancellations or FIDs in Australia and Asia.'],
  ) };
  bab['38'] = { tipe: 'teks', sumber: sm('ed'), paragraf: P(
    ['Metode: data Indonesia dari ESDM, PLN, DPR, dan berita yang ditautkan; kasus luar negeri dari berita industri dan ringkasan Wikipedia; turunan fisika memakai 33,3 kWh per kg (nilai kalor bawah hidrogen). Beberapa laporan teknis (IESR, Tenggara) berbentuk PDF gambar yang tidak terbaca otomatis dan tidak dikutip isinya. Sintesis berlabel Analisis METI (Hipotesis). Batas: angka kapasitas PLN berbeda antar sumber (191, 199, 203 ton); biaya elektroliser dan harga listrik Indonesia belum bersumber; basis proyek METI belum memuat proyek hidrogen.', 'Method: Indonesian data from ESDM, PLN, DPR and linked news; foreign cases from industry news and Wikipedia summaries; physics derivations use 33.3 kWh per kg (lower heating value of hydrogen). Some technical reports (IESR, Tenggara) are image PDFs not readable automatically and their content is not quoted. Synthesis is labelled METI analysis (Hypothesis). Limits: PLN capacity figures differ between sources (191, 199, 203 tonnes); electrolyser cost and Indonesian power price are not sourced; the METI project base has no hydrogen projects yet.'],
  ) };

  const cs = kasus;
  bab['39'] = { tipe: 'kasus', sumber: sm('mc', 'hrs', 'kuqa', 'neom', 'fh2r'), catatan: T('Biaya yang tidak ditemukan sengaja dikosongkan. Keberhasilan di bidang ini relatif: hampir semua proyek masih skala demonstrasi atau menuju operasi.', 'Costs not found are deliberately blank. Success in this field is relative: nearly all projects remain at demonstration scale or heading to operation.'), butir: [
    cs({ id: 'plnghp', nama: 'Jaringan green hydrogen plant PLN', jenis: 'berhasil', lokasi: T('Jakarta, Jawa Barat, dan pembangkit PLN lain', 'Jakarta, West Java and other PLN plants'),
      profil: [{ label: T('GHP pertama', 'First GHP'), nilai: 51, satuan: T('ton per tahun (Muara Karang)', 'tonnes a year (Muara Karang)') }, { label: T('Jaringan', 'Network'), nilai: 203, satuan: T('ton per tahun (22 GHP)', 'tonnes a year (22 GHP)') }, { label: T('Pelaksana', 'Operator'), nilai: 'PLN' }],
      tindakan: P(['Memasang elektroliser kecil di pembangkit PLN yang ada, memakai PLTS di lokasi ditambah REC dari PLTP Kamojang.', 'Installing small electrolysers at existing PLN plants, using on-site solar plus RECs from the Kamojang geothermal plant.'], ['Menambah 21 GHP dalam sebulan setelah yang pertama, lalu stasiun pengisian Senayan.', 'Adding 21 GHP within a month of the first, then the Senayan refuelling station.']),
      sebab: P(['Pemakai internal sendiri (pendingin generator) sehingga ada permintaan awal tanpa pembeli luar.', 'Own internal users (generator cooling) give initial demand without external buyers.'], ['Memakai lahan, listrik, dan air pembangkit yang sudah ada.', 'Uses the land, power and water of existing plants.']),
      angka: [{ label: T('GHP pertama', 'First GHP'), nilai: 51, d: 0, satuan: T('ton per tahun', 'tonnes a year'), sumber: 'mc', est: false }, { label: T('Jaringan 22 GHP', '22-GHP network'), nilai: 203, d: 0, satuan: T('ton per tahun', 'tonnes a year'), sumber: 'hrs', est: false }],
      pelajaran: P(['Memulai dari pemakai sendiri menghindari masalah pembeli, tetapi skala 203 ton per tahun jauh dari permintaan 4 juta ton.', 'Starting from own users avoids the buyer problem, but 203 tonnes a year is far from a 4 million tonne demand.']),
      faktor: { lahan: true, pengelola_om: true, jaringan: true }, sumber: ['mc', 'mcantara', 'ghp21', 'hrs'], hak_jawab: true }),
    cs({ id: 'senayan', nama: 'Stasiun pengisian hidrogen Senayan', jenis: 'berhasil', lokasi: T('Senayan, Jakarta', 'Senayan, Jakarta'),
      profil: [{ label: T('Pasokan', 'Supply'), nilai: T('Dari GHP PLN', 'From PLN GHPs') }, { label: T('Alokasi transportasi', 'Transport allocation'), nilai: 128, satuan: T('ton per tahun dari 203', 'tonnes a year of 203') }],
      tindakan: P(['Membuka stasiun pengisian hidrogen pertama Indonesia yang dipasok dari jaringan GHP PLN.', 'Opening Indonesia\'s first hydrogen refuelling station supplied from the PLN GHP network.']),
      sebab: P(['Pasokan hijau milik sendiri dan lokasi di kota besar untuk demonstrasi kendaraan sel bahan bakar.', 'Own green supply and a big-city location for fuel cell vehicle demonstration.']),
      angka: [{ label: T('Alokasi transportasi', 'Transport allocation'), nilai: 128, d: 0, satuan: T('ton per tahun', 'tonnes a year'), sumber: 'hrs', est: false }],
      tanda_bahaya: P(['Jumlah kendaraan pengguna tidak ditemukan di sumber.', 'The number of user vehicles was not found in the sources.']),
      pelajaran: P(['Infrastruktur pengisian lebih dulu dari armada adalah risiko; pantau pemakaian riilnya.', 'Refuelling infrastructure ahead of fleet is a risk; monitor actual usage.']),
      faktor: { pengelola_om: true }, sumber: ['hrs', 'hrsrri'], hak_jawab: true }),
    cs({ id: 'kuqa', nama: 'Sinopec Kuqa (Tiongkok)', jenis: 'berhasil', negara: 'CN', lokasi: T('Xinjiang, Tiongkok', 'Xinjiang, China'),
      profil: [{ label: T('Elektroliser', 'Electrolysers'), nilai: 260, satuan: 'MW' }, { label: T('Rencana', 'Plan'), nilai: 20000, satuan: T('ton per tahun', 'tonnes a year') }, { label: T('Operasi', 'Operation'), nilai: '2023-08-30' }],
      tindakan: P(['Konstruksi dimulai Desember 2021; dioperasikan 30 Agustus 2023; hidrogen dipasok ke kilang Tahe menggantikan hidrogen berbasis gas alam.', 'Construction began in December 2021; operated 30 August 2023; hydrogen supplied to the Tahe refinery replacing gas-based hydrogen.']),
      sebab: P(['Pembeli dalam jarak dekat (kilang) dan listrik surya skala besar.', 'A nearby buyer (refinery) and large-scale solar power.']),
      angka: [{ label: T('Elektroliser', 'Electrolysers'), nilai: 260, d: 0, satuan: 'MW', sumber: 'kuqa', est: false }, { label: T('Output 12 bulan pertama dibanding harapan (laporan)', 'First 12 months output vs expected (report)'), nilai: 35, d: 0, satuan: T('persen', 'percent'), sumber: 'kuqa', est: false }],
      tanda_bahaya: P(['Ramp-up lebih lambat dari rencana; target 20.000 ton per tahun tertunda hingga 2025.', 'Ramp-up slower than planned; the 20,000 tonnes a year target was delayed to 2025.']),
      pelajaran: P(['Pembeli dekat membuat skala 260 MW layak dibangun, tetapi ramp-up bisa jauh lebih lambat daripada rencana.', 'A nearby buyer makes 260 MW buildable, but ramp-up can be far slower than planned.']),
      faktor: { jaringan: true, pendanaan: true, kepastian_kebijakan: true }, sumber: ['kuqa', 'kuqa2'], hak_jawab: true }),
    cs({ id: 'neomcase', nama: 'NEOM Green Hydrogen (Arab Saudi)', jenis: 'berhasil', negara: 'SA', lokasi: T('Oxagon, NEOM', 'Oxagon, NEOM'),
      profil: [{ label: T('Output', 'Output'), nilai: 600, satuan: T('ton hidrogen per hari', 'tonnes of hydrogen a day') }, { label: T('Biaya', 'Cost'), nilai: T('USD 8,4 sampai 8,5 miliar', 'USD 8.4 to 8.5 billion') }, { label: T('Status', 'Status'), nilai: T('Konstruksi selesai, komisioning, operasi komersial 2027', 'Construction complete, commissioning, commercial operation 2027') }],
      tindakan: P(['Membangun skala besar dengan konsorsium dan kontrak penjualan amonia (TotalEnergies 70.000 ton per tahun dari 2030 dalam satu laporan).', 'Building at large scale with a consortium and ammonia sales contracts (TotalEnergies 70,000 tonnes a year from 2030 in one report).']),
      sebab: P(['Pendanaan konsorsium kuat dan lahan surya-angin murah; kontrak penjualan sedang difinalkan.', 'Strong consortium funding and cheap solar-wind land; sales contracts being finalised.']),
      angka: [{ label: T('Kemampuan produksi', 'Production capability'), nilai: 600, d: 0, satuan: T('ton per hari', 'tonnes a day'), sumber: 'neomceo', est: false }, { label: T('Kemajuan konstruksi Juni 2025', 'Construction progress June 2025'), nilai: 80, d: 0, satuan: T('persen', 'percent'), sumber: 'neom80', est: false }],
      tanda_bahaya: P(['Jadwal bergeser dari awal 2026 ke 2027; kontrak pembeli akhir belum jelas di semua laporan.', 'Schedule moved from 2026 to 2027; final buyer contracts are not clear in all reports.']),
      pelajaran: P(['Skala besar dapat dibangun bila sponsor dan modal kuat; bukti ekonomi baru ada setelah operasi komersial.', 'Large scale can be built when sponsor and capital are strong; economic proof only comes after commercial operation.']),
      faktor: { pendanaan: true, lahan: true, kepastian_kebijakan: true }, sumber: ['neom', 'neom80', 'neomceo'], hak_jawab: true }),
    cs({ id: 'fh2r', nama: 'Fukushima Hydrogen Energy Research Field (Jepang)', jenis: 'berhasil', negara: 'JP', lokasi: T('Namie, Fukushima', 'Namie, Fukushima'),
      profil: [{ label: T('PLTS', 'Solar'), nilai: 10, satuan: 'MW' }, { label: T('Output', 'Output'), nilai: 1200, satuan: 'Nm3/jam' }, { label: T('Diresmikan', 'Inaugurated'), nilai: '2020' }],
      tindakan: P(['Konsorsium NEDO, Toshiba, Tohoku Electric, dan Iwatani membangun demonstrasi elektrolisis bertenaga surya.', 'A consortium of NEDO, Toshiba, Tohoku Electric and Iwatani built a solar-powered electrolysis demonstration.']),
      sebab: P(['Konsorsium negara dan industri dengan mandat riset, bukan model bisnis.', 'A state and industry consortium with a research mandate, not a business model.']),
      angka: [{ label: T('Output maksimum', 'Maximum output'), nilai: 1200, d: 0, satuan: 'Nm3/jam', sumber: 'fh2r', est: false }],
      pelajaran: P(['Demonstrasi riset membangun kompetensi tetapi tidak membuktikan ekonomi komersial.', 'Research demonstrations build competence but do not prove commercial economics.']),
      faktor: { pendanaan: true, kepastian_kebijakan: true }, sumber: ['fh2r'], hak_jawab: true }),
  ] };
  bab['40'] = { tipe: 'kasus', sumber: sm('dpr', 'bp', 'fort', 'tville'), catatan: HAK, butir: [
    cs({ id: 'pasarhijau', nama: 'Pasar hidrogen hijau domestik belum terbentuk', jenis: 'mundur', lokasi: T('Nasional', 'National'),
      profil: [{ label: T('Permintaan 2024', '2024 demand'), nilai: 4, satuan: T('juta ton per tahun', 'million tonnes a year') }, { label: T('Produksi hijau PLN', 'PLN green production'), nilai: 203, satuan: T('ton per tahun', 'tonnes a year') }],
      kronologi: [{ tanggal: '2023-12-01', teks: T('Strategi Hidrogen Nasional diluncurkan (bulan saja).', 'National Hydrogen Strategy launched (month only).') }, { tanggal: '2025-10-01', teks: T('DPR mencatat belum ada insentif fiskal, standar sertifikasi, atau kewajiban pemanfaatan (bulan saja).', 'The DPR notes no fiscal incentive, certification standard or use mandate (month only).') }],
      sebab: P(['Biaya produksi tinggi (USD 4,3 sampai 8,3 per kg).', 'High production cost (USD 4.3 to 8.3 per kg).'], ['Tidak ada kewajiban pemanfaatan sehingga tidak ada pembeli jangka panjang.', 'No use mandate so no long-term buyers.'], ['Infrastruktur penyimpanan dan distribusi belum memadai.', 'Storage and distribution infrastructure is inadequate.']),
      terdampak: T('Pengembang dan investor yang menunggu kepastian; ini belum proyek gagal, melainkan pasar yang tertahan.', 'Developers and investors waiting for certainty; this is not yet a failed project but a stalled market.'),
      seharusnya: T('Menetapkan kewajiban pemanfaatan awal (pupuk, kilang), standar sertifikasi, dan insentif sebelum membangun proyek besar.', 'Set an initial use mandate (fertiliser, refineries), a certification standard and incentives before building large projects.'),
      tanda_bahaya: P(['Rencana besar tanpa pembeli kontrak.', 'Large plans without contracted buyers.']),
      angka: [{ label: T('Pangsa produksi hijau PLN terhadap permintaan (hitung sendiri)', 'PLN green share of demand (own calculation)'), nilai: pang, d: 4, satuan: T('persen', 'percent'), sumber: 'dpr', est: true }],
      faktor: { ppa_tarif: true, kepastian_kebijakan: true, pendanaan: true }, sumber: ['dpr', 'hrs'], hak_jawab: true }),
    cs({ id: 'fortescue', nama: 'Fortescue membatalkan PEM50 Gladstone dan proyek AS', jenis: 'dibatalkan', negara: 'AU', lokasi: T('Gladstone, Queensland dan Arizona', 'Gladstone, Queensland and Arizona'),
      profil: [{ label: T('Ukuran PEM50', 'PEM50 size'), nilai: 50, satuan: 'MW' }, { label: T('Penghapusan buku', 'Write-down'), nilai: 150, satuan: T('juta USD', 'million USD') }],
      kronologi: [{ tanggal: '2025-07-28', teks: T('Fortescue membatalkan dua proyek yang sudah melewati keputusan investasi akhir setelah tinjauan rinci.', 'Fortescue cancels two projects that had passed final investment decision after a detailed review.') }],
      sebab: P(['Tinjauan rinci perusahaan; laporan juga mengaitkannya dengan perubahan iklim kebijakan energi terbarukan di AS.', 'A detailed company review; reports also link it to changed renewable policy climate in the US.']),
      terdampak: T('Karyawan dan pemasok; pemerintah Australia dilaporkan meminta hibah proyek Gladstone dikembalikan. Fortescue menyatakan target nol bersih nyata tetap berjalan.', 'Employees and suppliers; the Australian government was reported to ask for the Gladstone grant to be repaid. Fortescue says its real zero target stays on track.'),
      seharusnya: T('Menyelesaikan kontrak pembeli sebelum FID dan menahan persetujuan hibah penuh sampai pembeli terikat.', 'Complete buyer contracts before FID and hold full grant approval until buyers are bound.'),
      tanda_bahaya: P(['Pembatalan setelah FID.', 'Cancellation after FID.']),
      angka: [{ label: T('Perkiraan penghapusan buku', 'Expected write-down'), nilai: 150, d: 0, satuan: T('juta USD', 'million USD'), sumber: 'fort2', est: false }],
      faktor: { ppa_tarif: true, pendanaan: true, kepastian_kebijakan: true }, sumber: ['fort', 'fort2', 'repay', 'bp'], hak_jawab: true }),
    cs({ id: 'bparea', nama: 'BP keluar dari Australian Renewable Energy Hub', jenis: 'mundur', negara: 'AU', lokasi: T('Pilbara, Australia Barat', 'Pilbara, Western Australia'),
      profil: [{ label: T('Rencana', 'Plan'), nilai: 26, satuan: T('GW surya dan angin', 'GW solar and wind') }, { label: T('Saham BP', 'BP stake'), nilai: 63.57, satuan: T('persen', 'percent') }],
      kronologi: [{ tanggal: '2025-07-28', teks: T('BP keluar sebagai operator dan pemegang saham; InterContinental Energy (sekitar 26 persen) mengambil alih operasi.', 'BP exits as operator and equity holder; InterContinental Energy (about 26 percent) takes over operations.') }],
      sebab: P(['BP menyatakan proyek tidak lagi sejalan dengan strateginya setelah mengalihkan fokus ke hulu migas dan hilir.', 'BP said the project no longer aligns with its strategy after refocusing on upstream oil and gas and downstream.']),
      terdampak: T('Mitra InterContinental Energy dan CWP Global yang tetap ada; hub berstatus berlanjut dengan operator baru.', 'Remaining partners InterContinental Energy and CWP Global; the hub continues under a new operator.'),
      seharusnya: T('Struktur kepemilikan dengan pengganti operator yang jelas bila sponsor utama berubah strategi.', 'An ownership structure with a clear operator successor if the lead sponsor changes strategy.'),
      tanda_bahaya: P(['Sponsor besar mengubah prioritas strategi korporat.', 'A large sponsor changes corporate strategic priorities.']),
      angka: [{ label: T('Perkiraan nilai hub', 'Estimated hub value'), nilai: 55, d: 0, satuan: T('miliar USD', 'billion USD'), sumber: 'bp', est: false }],
      faktor: { pendanaan: true }, sumber: ['bp'], hak_jawab: true }),
    cs({ id: 'townsville', nama: 'Proyek hidrogen Townsville dihentikan', jenis: 'dibatalkan', negara: 'AU', lokasi: T('Townsville, Queensland', 'Townsville, Queensland'),
      profil: [{ label: T('Alasan di judul sumber', 'Reason in the source headline'), nilai: T('Tidak ada pembeli', 'No customers') }],
      kronologi: [{ tanggal: '2025-07-01', teks: T('Rencana dihentikan setelah gagal menemukan pembeli produk (menurut judul sumber).', 'Plans scrapped after failing to find buyers for the product (per the source headline).') }],
      sebab: P(['Tidak ada pembeli kontrak untuk hidrogen yang dihasilkan.', 'No contracted buyers for the hydrogen produced.']),
      terdampak: T('Pengembang dan pemerintah negara bagian; rincian lain tidak dapat dibaca karena halaman sumber tidak dapat diambil otomatis.', 'The developer and state government; other details could not be read because the source page could not be fetched automatically.'),
      seharusnya: T('Pembeli jangka panjang sebelum pembangunan.', 'Long-term buyers before construction.'),
      tanda_bahaya: P(['Proyek maju tanpa kontrak penjualan.', 'Project advances without a sales contract.']),
      faktor: { ppa_tarif: true }, sumber: ['tville'], hak_jawab: true }),
    cs({ id: 'kuqarampup', nama: 'Kuqa: ramp-up jauh di bawah rencana', jenis: 'mundur', negara: 'CN', lokasi: T('Xinjiang, Tiongkok', 'Xinjiang, China'),
      profil: [{ label: T('Rencana', 'Plan'), nilai: 20000, satuan: T('ton per tahun', 'tonnes a year') }],
      kronologi: [{ tanggal: '2024-01-11', teks: T('S&P menyebut produksi 20.000 ton per tahun tertunda hingga 2025.', 'S&P says 20,000 tonnes a year production is delayed to 2025.') }],
      sebab: P(['Output meningkat bertahap mengikuti perluasan kilang Tahe, pembeli satu-satunya.', 'Output rises in steps with the Tahe refinery expansion, the only buyer.'], ['Laporan menyebut sekitar 35 persen dari output harapan pada 12 bulan pertama.', 'Reports cite about 35 percent of expected output in the first 12 months.']),
      terdampak: T('Sinopec dan klaim skala terbesar di dunia; tanggapan Sinopec dimuat sebagian dalam laporan SCMP.', 'Sinopec and its world-largest claim; Sinopec\'s response is partly carried in the SCMP report.'),
      seharusnya: T('Menyelaraskan jadwal elektroliser dengan kesiapan pembeli.', 'Align the electrolyser schedule with buyer readiness.'),
      tanda_bahaya: P(['Satu pembeli menentukan seluruh penyerapan.', 'A single buyer determines all offtake.']),
      angka: [{ label: T('Output 12 bulan pertama dibanding harapan', 'First 12 months output vs expected'), nilai: 35, d: 0, satuan: T('persen', 'percent'), sumber: 'kuqa', est: false }],
      faktor: { ppa_tarif: true }, sumber: ['kuqa', 'kuqa2'], hak_jawab: true }),
  ] };
  bab['41'] = { tipe: 'pola', sumber: sm('ed'), catatan: T('Sel dibangun dari bendera faktor tiap kasus; pemetaan faktor ke kasus adalah analisis METI (Hipotesis) atas fakta di bab 39 dan 40.', 'Cells are built from each case factor flags; mapping factors to cases is METI analysis (Hypothesis) on facts in chapters 39 and 40.'), faktor: FAKTOR_STD.map(([k, a, e]) => L(k, a, e)) };
  bab['42'] = { tipe: 'periksa', sumber: sm('ed'), peran: PERAN, tahap: TAHAP, butir: [
    dasarP('pengembang', 'lokasi', 'Mulai dari pembeli yang sudah ada dan dekat (kilang, pupuk, pendingin pembangkit) sebelum memilih lokasi elektroliser (Kuqa, PLN).', 'Start from existing nearby buyers (refinery, fertiliser, plant cooling) before siting electrolysers (Kuqa, PLN).', 'kuqa'),
    dasarP('pengembang', 'ppa', 'Dapatkan kontrak pembelian jangka panjang sebelum FID (Townsville, Fortescue).', 'Secure long-term purchase contracts before FID (Townsville, Fortescue).', 'tville'),
    dasarP('pengembang', 'bangun', 'Rencanakan ramp-up bertahap yang sejalan dengan pembeli (Kuqa 35 persen pada tahun pertama).', 'Plan a staged ramp-up aligned with the buyer (Kuqa 35 percent in year one).', 'kuqa'),
    dasarP('pengembang', 'operasi', 'Dokumentasikan metode klaim hijau (fisik atau REC) agar dapat diaudit.', 'Document the green claim method (physical or REC) so it can be audited.', 'mc'),
    dasarP('investor', 'dana', 'Tunda komitmen besar sampai standar sertifikasi, insentif, dan kewajiban pemanfaatan jelas.', 'Defer large commitments until the certification standard, incentives and use mandate are clear.', 'dpr'),
    dasarP('pemda', 'lokasi', 'Tawarkan lahan dan air dekat PLTP atau PLTS dan dekat pembeli industri.', 'Offer land and water near geothermal or solar plants and near industrial buyers.', 'dpr'),
    dasarP('pusat', 'ppa', 'Tetapkan kewajiban pemanfaatan awal dan standar sertifikasi hidrogen hijau.', 'Set an initial use mandate and a green hydrogen certification standard.', 'dpr'),
    dasarP('pusat', 'dana', 'Kaitkan hibah dengan kontrak pembeli terikat, bukan hanya studi (Gladstone).', 'Tie grants to binding buyer contracts, not only studies (Gladstone).', 'repay'),
    dasarP('pln', 'operasi', 'Publikasikan pemakaian riil hidrogen PLN (pendingin, kendaraan) dan perbarui angka kapasitas yang berbeda antar sumber.', 'Publish PLN\'s actual hydrogen use (cooling, vehicles) and reconcile capacity figures that differ between sources.', 'ghp21'),
    dasarP('meti', 'operasi', 'Pantau pilot Ulubelu dan NEOM 2027, serta beri hak jawab pada pihak yang disebut.', 'Monitor the Ulubelu pilot and NEOM 2027, and give named parties a right of reply.', 'ulu'),
  ] };
  return {
    id: ID, versi: 1, diperbarui: TGL,
    judul: T('Hidrogen dan amonia hijau', 'Green hydrogen and ammonia'),
    lead: T('Pilot PLN dan Pertamina sudah jalan di skala ratusan ton, tetapi pasar domestik, standar, dan insentif belum terbentuk, dan dunia sedang memilah proyek yang layak.', 'PLN and Pertamina pilots run at hundreds of tonnes, but the domestic market, standards and incentives are not yet formed, and the world is sorting viable projects.'),
    kunci,
    penting: P(
      ['PLN memiliki 22 pabrik hidrogen hijau (sekitar 203 ton per tahun), sekitar 0,005 persen dari permintaan 4 juta ton.', 'PLN has 22 green hydrogen plants (about 203 tonnes a year), about 0.005 percent of the 4 million tonne demand.'],
      ['DPR mencatat belum ada insentif fiskal, standar sertifikasi, atau kewajiban pemanfaatan; biaya produksi USD 4,3 sampai 8,3 per kg.', 'The DPR notes no fiscal incentive, certification standard or use mandate; production cost is USD 4.3 to 8.3 per kg.'],
      ['Di luar negeri proyek dengan pembeli dekat (Kuqa, NEOM) maju; yang tanpa pembeli dibatalkan (Townsville, Fortescue).', 'Abroad, projects with nearby buyers (Kuqa, NEOM) advance; those without buyers are cancelled (Townsville, Fortescue).'],
    ),
    posisi: T('Indonesia adalah pasar hidrogen terbesar di Asia Tenggara (35 persen permintaan kawasan) tetapi produksi hijaunya masih skala demonstrasi.', 'Indonesia is the largest hydrogen market in Southeast Asia (35 percent of regional demand) but its green production is still demonstration scale.'),
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
    fs.writeFileSync(path.join(akar, 'public/data/topik/hidrogen.json'), JSON.stringify(d, null, 1) + '\n');
    console.log(`bab naskah ${Object.keys(d.bab).length}/41 (+bab 1); mercusuar ${d.bab['39'].butir.length}; gagal ${d.bab['40'].butir.length}; sumber ${Object.keys(d.sumber).length}`);
  }
}
