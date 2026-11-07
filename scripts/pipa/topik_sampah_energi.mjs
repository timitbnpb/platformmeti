// Naskah topik Sampah jadi energi (kerangka 42 bab) mengikuti docs/perencanaan/TOPIK-SKEMA.md.
// Menyusun public/data/topik/sampah_energi.json dari data repo (dihitung, bukan diketik) + sumber publik bertanggal.
// Pakai: node scripts/pipa/topik_sampah_energi.mjs [--selftest]
// Aturan: tiap klaim bersumber (kunci peta sumber); analisis sendiri berlabel "Analisis METI (Hipotesis)"; bab tanpa data dikosongkan; kasus yang menyebut pihak wajib hak jawab.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validasi } from './topik_surya.mjs';
export { validasi };
const akar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ID = 'sampah-energi';
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
  katmang: S('Mayoritas proyek PLTSa di Indonesia mangkrak, hanya dua yang beroperasi (13 Mar 2025; 12 kota menurut Perpres 35/2018)', 'Katadata', 'https://katadata.co.id/amp/ekonomi-hijau/ekonomi-sirkular/67d26893c5c42/mayoritas-proyek-pltsa-di-indonesia-mangkrak-hanya-dua-yang-beroperasi', '2025-03-13', 'media'),
  wekdm: S('PLTSa jalan di tempat 7 tahun, KESDM ungkap biang masalah dan solusinya (Rakornas PSEL 30 Sep 2025: 15 proyek di 12 kota, 2 COD; Benowo 9 MW dan Putri Cempo 5 MW)', 'Warta Ekonomi', 'https://wartaekonomi.co.id/read584694/pltsa-jalan-ditempat-7-tahun-kesdm-ungkap-biang-masalah-dan-solusinya', '2025-09-30', 'media'),
  ombud: S('Ombudsman ungkap penyebab banyak pembangkit listrik sampah mangkrak (29 Des 2023; harga beli USD 13,35 sen, Sunter Rp5,2 triliun)', 'Katadata', 'https://katadata.co.id/agustiyanti/berita/658ea2fdb4626/ombudsman-ungkap-penyebab-banyak-pembangkit-listrik-sampah-mangkrak', '2023-12-29', 'media'),
  ashurst: S('Accelerating waste-to-energy in Indonesia: Presidential Regulation 109/2025 (USD 0,20 per kWh tetap 30 tahun, minimum 1.000 ton per hari, cabut Perpres 35/2018)', 'Ashurst Perkins Coie', 'https://www.ashurstperkinscoie.com/en/insights/accelerating-waste-to-energy-in-indonesia-presidential-regulation-109-2025/', '2025-10-29', 'kajian'),
  metro109: S('Presiden Prabowo terbitkan Perpres tentang olah sampah jadi energi (8 bab, 33 pasal)', 'Metro TV', 'https://www.metrotvnews.com/read/kWDCnaVw-presiden-prabowo-terbitkan-perpres-tentang-olah-sampah-jadi-energi', '2025-10-10', 'media'),
  subs: S('Pemerintah gelontorkan subsidi kompensasi untuk PLN dalam program WTE', 'Warta Ekonomi', 'https://wartaekonomi.co.id/read584565/pemerintah-gelontorkan-subsidi-kompensasi-untuk-pln-dalam-program-wte', '2025-09-30', 'media'),
  empat: S('Danantara ungkap progres tender proyek WTE, baru 4 kota yang siap (19 Nov 2025)', 'Bisnis.com', 'https://market.bisnis.com/read/20251119/192/1930120/danantara-ungkap-progres-tender-proyek-wte-baru-4-kota-yang-siap', '2025-11-19', 'media'),
  tgr: S('Pembatalan proyek PSEL Tangerang dan Tangsel pukul harga saham OASA cs (28 Okt 2025)', 'Bisnis.com', 'https://market.bisnis.com/read/20251028/192/1923968/pembatalan-proyek-psel-tangerang-tangsel-pukul-harga-saham-oasa-cs', '2025-10-28', 'media'),
  bogor: S('Danantara tetapkan Zhejiang Weiming jadi mitra operator PSEL di Bogor Raya (13 Mar 2026)', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20260313/44/1960340/danantara-tetapkan-zhejiang-weiming-jadi-mitra-operator-psel-di-bogor-raya', '2026-03-13', 'media'),
  bali: S('Atasi darurat sampah, Danantara groundbreaking proyek PSEL Bali Rp3 triliun (8 Jul 2026; lebih dari 500.000 ton per tahun)', 'Investor Trust', 'https://www.investortrust.id/business/108816/atasi-darurat-sampah-danantara-groundbreaking-proyek-psel-bali-rp-3-triliun', '2026-07-08', 'media'),
  bekasi: S('Danantara mulai groundbreaking proyek PSEL Bekasi senilai Rp3 triliun, target beroperasi 2028 (26 Agu 2026; 1.500 ton per hari)', 'Investor Trust', 'https://investortrust.id/business/114145/danantara-mulai-groundbreaking-proyek-psel-bekasi-senilai-rp-3-triliun-target-beroperasi-2028', '2026-08-26', 'media'),
  tahap2: S('Danantara tunjuk 8 konsorsium pengembang PSEL tahap II (21 Jul 2026)', 'Investor Trust', 'https://investortrust.id/business/110165/danantara-tunjuk-8-konsorsium-pengembang-psel-tahap-ii', '2026-07-21', 'media'),
  teknologi: S('Danantara pastikan proyek PSEL pakai teknologi lebih canggih dari China (22 Jan 2026)', 'Kompas.com Lestari', 'https://lestari.kompas.com/read/2026/01/22/114604286/danantara-pastikan-proyek-psel-pakai-teknologi-lebih-canggih-dari-china', '2026-01-22', 'media'),
  kisi: S('Kisi-kisi nilai investasi jumbo proyek waste to energy Danantara (sekitar Rp91 triliun)', 'Bisnis.com', 'https://market.bisnis.com/read/20250930/192/1916066/kisi-kisi-nilai-investasi-jumbo-proyek-waste-to-energy-danantara', '2025-09-30', 'media'),
  tenggara: S('Diseminasi naskah kebijakan waste to energy (Sunter dan Gedebage batal beroperasi; bantuan tipping fee pusat maksimum Rp500.000 per ton)', 'Tenggara Strategics', 'https://asset.tenggara.id/assets/source/file-research/2026-wte/Diseminasi%20Naskah%20Kebijakan%20Waste%20to%20Energy%20-%20Tenggara%20Strategics.pdf', '2026-01-01', 'kajian'),
  apsn: S('Costly, dirty and unfair: Indonesia at the crossroads of embracing incinerators (sudut pandang kritik)', 'Asia Pacific Solidarity Network', 'https://www.asia-pacific-solidarity.net/news/2020-05-01/costly-dirty-and-unfair-indonesia-crossroads-embracing-incinerators.html', '2020-05-01', 'media'),
  jpwiki: S('Waste management in Japan (ringkasan Wikipedia: sekitar 1.200 fasilitas insinerasi 2017, 358 membangkitkan listrik 2014)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Waste_management_in_Japan', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  sgnea: S('NEA Singapura, waste management (insinerasi mengurangi volume hingga 90 persen; abu ke Semakau)', 'National Environment Agency Singapura', 'https://www.nea.gov.sg/our-services/waste-management/', TGL, 'resmi'),
  sg101: S('Singapore 101, waste management case study (panas insinerasi sekitar 2 persen pasokan listrik)', 'Pemerintah Singapura', 'https://www.sg101.gov.sg/environment/case-studies/wm/', TGL, 'resmi'),
  sg2026: S('Singapore\'s waste system: why recycling remains a challenge (Semakau diproyeksikan penuh 2035)', 'Seasia.co', 'https://seasia.co/2026/10/17/singapores-waste-system-why-recycling-remains-a-challenge', '2026-10-17', 'media'),
  timar: S('Timarpur waste-to-energy plant (Delhi): kasus dan pelajaran (300 ton per hari, 3,75 MW; nilai kalor sampah 600 sampai 700 kcal per kg vs desain 1.460)', 'Basel Action Network / no-burn.org', 'https://www.no-burn.org/wp-content/uploads/2021/03/Timarpur.pdf', '2021-03-01', 'kajian'),
  scroll: S('Waste-to-energy plants have mostly failed in India and yet governments are building more of them', 'Scroll.in', 'https://scroll.in/article/1027554/waste-to-energy-plants-have-mostly-failed-in-india-and-yet-governments-are-building-more-of-them', TGL, 'media'),
  reppie: S('Ethiopian incinerator misses output targets, report flags tech mismatch in African waste streams (GAIA: 396 sampai 650 ton per hari dari desain 1.400)', 'Packaging Insights', 'https://www.packaginginsights.com/news/reppie-waste-energy-failure.html', TGL, 'media'),
  reppie18: S('The Reppie project: Ethiopia opens Africa\'s first waste-to-energy facility (20 Agu 2018)', 'Africanews', 'https://www.africanews.com/2018/08/20/the-reppie-project-ethiopia-opens-africa-s-first-waste-to-energy-facility/', '2018-08-20', 'media'),
};

export function susun() {
  const d0 = baca('public/data/topik/dasar-bioenergi.json');
  const kp = tren('biomassa-sampah');
  const k25 = kp.at(-1), k24 = kp.find((x) => x.tahun === 2024);
  const ru = baca('public/data/ruptl.json').ringkasan;
  const bab = {};
  const rf = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
  const kwhBen = rf(9 * 24 / 1000 * 1000, 0), kwhSolo = rf(5 * 24 / 545 * 1000, 0);
  const kwhBenT = rf(9 * 24 / 1000 * 1000, 0);
  const usdTon = rf(kwhBenT * 0.2, 0), rev = rf(9000 * 8760 * 0.85 * 0.2 / 1e6, 1);
  const spj = dataProv(['biomassa-sampah']);

  const kunci = [
    { label: T('Kota prioritas Perpres 35/2018', 'Priority cities under Perpres 35/2018'), nilai: 12, d: 0, satuan: T('kota', 'cities'), sumber: 'katmang', est: false },
    { label: T('Proyek yang mencapai COD dari 15 proyek', 'Projects reaching COD out of 15'), nilai: 2, d: 0, satuan: T('proyek (Benowo 9 MW, Putri Cempo 5 MW)', 'projects (Benowo 9 MW, Putri Cempo 5 MW)'), sumber: 'wekdm', est: false },
    { label: T('Harga beli listrik PSEL baru', 'New PSEL electricity purchase price'), nilai: 0.2, d: 2, satuan: T('USD per kWh, tetap 30 tahun', 'USD per kWh, fixed 30 years'), sumber: 'ashurst', est: false },
    { label: T('Kapasitas listrik sampah terbarukan menurut IRENA (2025)', 'Renewable municipal waste capacity per IRENA (2025)'), nilai: k25.kapasitas_mw, d: 2, satuan: T('MW', 'MW'), sumber: 'kap', est: false },
    { label: T('Perkiraan investasi program Danantara', 'Estimated Danantara programme investment'), nilai: 91, d: 0, satuan: T('triliun rupiah', 'trillion rupiah'), sumber: 'kisi', est: false },
  ];

  bab['2'] = { tipe: 'faq', sumber: sm('ed', 'wekdm', 'ashurst', 'kap'), butir: FQ([
    ['Apa itu PSEL atau PLTSa?', 'What is PSEL or PLTSa?', 'Pengolahan sampah menjadi energi listrik: sampah perkotaan dibakar atau digasifikasi untuk membangkitkan listrik dan mengurangi volume yang masuk TPA.', 'Waste-to-electricity treatment: municipal waste is incinerated or gasified to generate power and cut the volume going to landfill.'],
    ['Berapa PSEL yang sudah beroperasi?', 'How many PSEL plants operate?', 'Dua: Benowo Surabaya (9 MW, 1.000 ton per hari, COD Mei 2021) dan Putri Cempo Surakarta (5 MW, 545 ton per hari, COD awal 2024), dari 15 proyek di 12 kota prioritas menurut KESDM.', 'Two: Benowo Surabaya (9 MW, 1,000 tonnes a day, COD May 2021) and Putri Cempo Surakarta (5 MW, 545 tonnes a day, COD early 2024), out of 15 projects in 12 priority cities per KESDM.'],
    ['Apa yang berubah dengan Perpres 109/2025?', 'What changed with Perpres 109/2025?', 'Harga beli PLN menjadi USD 0,20 per kWh tetap selama 30 tahun (sebelumnya USD 13,35 sen), tipping fee daerah diganti kompensasi negara ke PLN, Danantara memimpin pelaksanaan, dan Perpres 35/2018 dicabut.', 'PLN\'s purchase price becomes a fixed USD 0.20 per kWh for 30 years (previously USD 13.35 cents), local tipping fees are replaced by state compensation to PLN, Danantara leads implementation and Perpres 35/2018 is revoked.'],
    ['Apa itu tipping fee?', 'What is a tipping fee?', 'Biaya per ton sampah yang dibayar pemda kepada operator. Aturan lama membatasi bantuan pusat sampai Rp500.000 per ton; skema baru menghapusnya dari beban daerah.', 'A per-tonne fee paid by local government to the operator. The old rule capped central assistance at IDR 500,000 per tonne; the new scheme removes it from local budgets.'],
    ['Berapa minimum sampah per fasilitas?', 'What is the minimum waste per facility?', 'Perpres 109/2025 menetapkan pasokan minimum 1.000 ton per hari per fasilitas menurut ringkasan Ashurst.', 'Perpres 109/2025 sets a minimum supply of 1,000 tonnes a day per facility per the Ashurst summary.'],
    ['Kota mana yang sudah mulai membangun?', 'Which cities have started construction?', 'Bali (groundbreaking 8 Juli 2026, Rp3 triliun) dan Bekasi (26 Agustus 2026, 1.500 ton per hari, Rp3 triliun, target operasi pertengahan 2028); pemenang tahap I juga mencakup Bogor Raya dan Yogyakarta.', 'Bali (groundbreaking 8 July 2026, IDR 3 trillion) and Bekasi (26 August 2026, 1,500 tonnes a day, IDR 3 trillion, operation targeted mid-2028); phase I winners also include Greater Bogor and Yogyakarta.'],
    ['Kenapa banyak proyek lama mangkrak?', 'Why did so many old projects stall?', 'Ombudsman dan KESDM menyebut harga listrik rendah, daerah tak mampu membayar tipping fee, dan kepastian investasi lemah. Lihat bab 40.', 'The Ombudsman and KESDM cite low electricity price, local governments unable to pay tipping fees and weak investment certainty. See chapter 40.'],
    ['Apakah insinerasi aman?', 'Is incineration safe?', 'Debatnya nyata: pendukung menyebut pengurangan volume dan listrik; kritik menyebut biaya, emisi, dan ketidakadilan. Kualitas pemilahan dan kadar air sampah sangat menentukan. Lihat bab 29.', 'The debate is real: supporters cite volume reduction and power; critics cite cost, emissions and unfairness. Sorting quality and moisture decide much. See chapter 29.'],
  ]) };
  bab['3'] = { tipe: 'glosarium', sumber: sm('ed'), butir: G([
    ['PSEL', 'Pengolahan sampah menjadi energi listrik.', 'Waste-to-electricity treatment.'], ['PLTSa', 'Pembangkit Listrik Tenaga Sampah, istilah lama untuk PSEL.', 'Waste power plant, the older term for PSEL.'],
    ['WtE', 'Waste-to-energy.', 'Waste-to-energy.'], ['Tipping fee', 'Biaya per ton sampah dari pemda ke operator.', 'Per-tonne fee from local government to operator.'],
    ['BUPP', 'Badan Usaha Pengembang dan Pengelola PSEL.', 'PSEL developer and operator entity.'], ['Danantara (BPI)', 'Badan pengelola investasi negara yang memimpin PSEL menurut Perpres 109/2025.', 'State investment agency leading PSEL under Perpres 109/2025.'],
    ['Gasifikasi', 'Pengubahan sampah jadi gas sintetis pada suhu tinggi dengan oksigen terbatas.', 'Converting waste to syngas at high temperature with limited oxygen.'], ['Insinerasi (mass burn)', 'Pembakaran sampah langsung untuk uap dan listrik.', 'Direct burning of waste for steam and power.'],
    ['RDF', 'Refuse-derived fuel, bahan bakar dari sampah terpilah.', 'Refuse-derived fuel from sorted waste.'], ['Nilai kalor (LHV)', 'Energi per kilogram sampah; sampah basah bernilai rendah.', 'Energy per kilogram of waste; wet waste has a low value.'],
    ['TPA', 'Tempat pemrosesan akhir sampah.', 'Final waste disposal site (landfill).'], ['Abu dasar / abu terbang', 'Residu insinerasi yang perlu penanganan khusus.', 'Incineration residues needing special handling.'],
    ['PPA / PJBL', 'Perjanjian jual beli tenaga listrik dengan PLN.', 'Power purchase agreement with PLN.'], ['Take-or-pay', 'Pembeli membayar kapasitas yang disepakati walau tidak memakainya.', 'Buyer pays for agreed capacity even if not used.'],
    ['COD', 'Tanggal operasi komersial.', 'Commercial operation date.'], ['Semakau', 'Satu-satunya TPA Singapura di pulau lepas pantai untuk abu insinerasi.', 'Singapore\'s only landfill, an offshore island for incineration ash.'],
  ]) };
  bab['4'] = { tipe: 'teks', sumber: sm('wekdm', 'ashurst', 'sgnea'), paragraf: P(
    ['PSEL melayani dua tujuan sekaligus: mengurangi sampah yang masuk TPA dan membangkitkan listrik. Insinerasi dapat mengurangi volume hingga 90 persen menurut NEA Singapura, tetapi menyisakan abu yang harus dikelola.', 'PSEL serves two goals at once: cutting waste going to landfill and generating power. Incineration can cut volume by up to 90 percent per Singapore\'s NEA, but leaves ash to be managed.'],
    ['Di Indonesia dorongannya adalah darurat TPA: Perpres 109/2025 memuat perkiraan TPA penuh pada 2030 tanpa tindakan, dan Bekasi disebut sudah melebihi kapasitas.', 'In Indonesia the push is landfill emergency: Perpres 109/2025 coverage estimates landfills full by 2030 without action, and Bekasi is said to be over capacity.'],
    ['Karena itu PSEL lebih merupakan infrastruktur layanan sampah yang kebetulan menghasilkan listrik, bukan proyek energi murni; kunci keberhasilannya ada pada pasokan sampah, biaya layanan, dan kepatuhan lingkungan.', 'PSEL is therefore a waste-service infrastructure that happens to produce power, not a pure energy project; its keys are waste supply, service cost and environmental compliance.'],
  ) };
  bab['5'] = { tipe: 'rumus', sumber: sm('wekdm', 'ashurst', 'ed'), rumus: P(
    ['Listrik per ton (kWh) = daya (MW) x 24 jam x 1000 / ton per hari', 'Electricity per tonne (kWh) = power (MW) x 24 hours x 1000 / tonnes per day'],
    ['Pendapatan listrik tahunan = daya (kW) x 8.760 jam x faktor beban x harga (USD per kWh)', 'Annual electricity revenue = power (kW) x 8,760 hours x load factor x price (USD per kWh)'],
  ), contoh: [
    T(`Benowo (9 MW, 1.000 ton per hari) setara sekitar ${kwhBenT} kWh per ton dan Putri Cempo (5 MW, 545 ton per hari) sekitar ${kwhSolo} kWh per ton, dengan asumsi beban penuh (EST, hitung sendiri dari angka KESDM).`, `Benowo (9 MW, 1,000 tonnes a day) equals about ${kwhBenT} kWh per tonne and Putri Cempo (5 MW, 545 tonnes a day) about ${kwhSolo} kWh per tonne at full load (EST, own calculation from KESDM figures).`),
    T(`Pada USD 0,20 per kWh, ${kwhBenT} kWh per ton berarti sekitar USD ${usdTon} per ton sampah dari listrik; fasilitas 9 MW dengan beban 85 persen menghasilkan sekitar USD ${rev} juta per tahun (EST). Sebagai pembanding, bantuan tipping fee lama dibatasi Rp500.000 per ton atau sekitar USD 30.`, `At USD 0.20 per kWh, ${kwhBenT} kWh per tonne means about USD ${usdTon} per tonne of waste from electricity; a 9 MW facility at 85 percent load earns about USD ${rev} million a year (EST). For comparison the old tipping fee assistance was capped at IDR 500,000 per tonne, about USD 30.`),
    T(HIP + 'angka listrik per ton gasifikasi tidak otomatis berlaku untuk insinerasi; pengembang harus memakai nilai kalor sampah lokal yang terukur, sebab Timarpur (Delhi) gagal karena selisih nilai kalor.', HIPE + 'gasification kWh per tonne does not automatically apply to incineration; developers must use measured local waste calorific value, because Timarpur (Delhi) failed over a calorific mismatch.'),
  ] };
  bab['6'] = { tipe: 'langkah', sumber: sm('ed', 'ashurst', 'bekasi'), butir: [
    { judul: T('Pengumpulan dan pemilahan', 'Collection and sorting'), isi: T('Pemda mengumpulkan sampah dan menjamin pasokan minimum 1.000 ton per hari; kualitas pemilahan menentukan nilai kalor.', 'Local government collects waste and guarantees a minimum 1,000 tonnes a day; sorting quality sets calorific value.'), pelaku: T('Pemda, dinas lingkungan', 'Local government, environment office') },
    { judul: T('Verifikasi kesiapan kota', 'City readiness verification'), isi: T('Kementerian Lingkungan Hidup menilai kesiapan dan menetapkan kota layak.', 'The Environment Ministry assesses readiness and designates eligible cities.'), pelaku: T('KLH', 'Environment Ministry') },
    { judul: T('Studi dan pemilihan pengembang', 'Study and developer selection'), isi: T('Danantara melakukan studi teknis dan ekonomi lalu memilih mitra BUPP lewat tender.', 'Danantara conducts technical and economic study and selects the BUPP partner by tender.'), pelaku: T('Danantara, konsorsium', 'Danantara, consortia') },
    { judul: T('PPA dengan PLN', 'PPA with PLN'), isi: T('PLN wajib menandatangani PPA dalam 10 hari kerja setelah izin prakonstruksi.', 'PLN must sign the PPA within 10 working days after pre-construction licences.'), pelaku: T('PLN, BUPP', 'PLN, BUPP') },
    { judul: T('Konstruksi dan teknologi', 'Construction and technology'), isi: T('Pembangunan pabrik pembakaran atau gasifikasi, pengolahan gas buang, dan penanganan abu.', 'Building the incineration or gasification plant, flue gas treatment and ash handling.'), pelaku: T('Kontraktor, penyedia teknologi', 'Contractor, technology provider') },
    { judul: T('Operasi dan kompensasi', 'Operation and compensation'), isi: T('PLN membeli listrik USD 0,20 per kWh; negara mengompensasi PLN bila biaya pokoknya naik.', 'PLN buys power at USD 0.20 per kWh; the state compensates PLN if its average cost rises.'), pelaku: T('PLN, pemerintah', 'PLN, government') },
  ] };
  bab['7'] = { tipe: 'grafik', jenis: 'kolom', sumber: sm('kap'), label: T('Kapasitas listrik sampah terbarukan Indonesia menurut IRENA', 'Indonesian renewable municipal waste capacity per IRENA'), satuan: 'MW', d: 1, seri: [{ nama: T('Kapasitas (MW)', 'Capacity (MW)'), sorot: true, titik: kp.filter((x) => x.tahun >= 2010).map((x) => [String(x.tahun), x.kapasitas_mw]) }], catatan: T('Seri IRENA mencatat bagian terbarukan dari sampah kota; angka 18,24 MW pada 2025 selaras dengan dua PSEL yang beroperasi (14 MW) ditambah pembangkit kecil lain.', 'The IRENA series records the renewable part of municipal waste; 18.24 MW in 2025 is consistent with the two operating PSEL plants (14 MW) plus other small plants.') };
  bab['8'] = { tipe: 'tabel', per: 10, sumber: sm('proyek'), catatan: T('Proyek biomassa-sampah bernama di basis METI (RUPTL, media, resmi); titik pusat provinsi, bukan lokasi TPA.', 'Named waste-biomass projects in the METI base (RUPTL, media, official); province centroids, not landfill sites.'), kolom: KOL_PROV, baris: spj };
  bab['11'] = { tipe: 'teks', sumber: sm('kisi', 'empat', 'bogor', 'tahap2'), paragraf: P(
    ['Pasar PSEL baru dibentuk oleh negara: Danantara memperkirakan investasi sekitar Rp91 triliun untuk program 33 kota. Tender tahap I pada November 2025 dimulai dengan tujuh kota, tetapi pada 19 November 2025 baru empat kota siap.', 'The new PSEL market is created by the state: Danantara estimates about IDR 91 trillion of investment for a 33-city programme. Phase I tender in November 2025 began with seven cities, but by 19 November 2025 only four were ready.'],
    ['Pemenang tahap I diumumkan Maret 2026 untuk Denpasar Raya, Bekasi, Bogor Raya (Zhejiang Weiming sebagai mitra operator), dan Yogyakarta; tahap II menetapkan delapan konsorsium pada 21 Juli 2026.', 'Phase I winners were announced in March 2026 for Greater Denpasar, Bekasi, Greater Bogor (Zhejiang Weiming as operator partner) and Yogyakarta; phase II named eight consortia on 21 July 2026.'],
  ) };
  const R = (id, dok, a, b) => regRow(d0, id, dok, a, b);
  bab['12'] = { tipe: 'tabel', per: 8, sumber: sm('regul', 'ashurst'), kolom: [{ k: 'dok', l: T('Peraturan', 'Regulation'), url: 'u' }, { k: 'ttg', l: T('Tentang', 'About') }, { k: 'st', l: T('Status', 'Status') }], baris: [
    R('perpres-109-2025', 'Perpres 109/2025', 'Penanganan sampah perkotaan melalui pengolahan sampah menjadi energi terbarukan', 'Urban waste handling through waste-to-renewable-energy processing'),
    R('perpres-35-2018', 'Perpres 35/2018', 'Percepatan pembangunan instalasi pengolah sampah menjadi energi listrik di 12 kota', 'Accelerating waste-to-electricity plants in 12 cities'),
    R('perpres-18-2016', 'Perpres 18/2016', 'Percepatan pembangkit listrik berbasis sampah di Jakarta, Tangerang, Bandung, dan kota lain', 'Accelerating waste-based power in Jakarta, Tangerang, Bandung and other cities'),
    { dok: 'UU 18/2008', ttg: T('Pengelolaan sampah (kerangka induk pengelolaan sampah)', 'Waste management (parent framework)'), st: 'berlaku', u: SUMBER.regul.url },
  ] };
  bab['13'] = { tipe: 'linimasa', sumber: sm('wekdm', 'ombud', 'katmang', 'metro109', 'ashurst', 'empat', 'bogor', 'bali', 'tahap2', 'bekasi', 'regul'), butir: [
    { tanggal: '2016-01-01', judul: T('Perpres 18/2016 untuk tujuh kota (tahun saja)', 'Perpres 18/2016 for seven cities (year only)'), url: SUMBER.regul.url },
    { tanggal: '2018-01-01', judul: T('Perpres 35/2018 untuk 12 kota (tahun saja)', 'Perpres 35/2018 for 12 cities (year only)'), url: SUMBER.regul.url },
    { tanggal: '2021-05-01', judul: T('Benowo Surabaya COD (bulan saja)', 'Benowo Surabaya COD (month only)'), url: SUMBER.wekdm.url },
    { tanggal: '2023-12-29', judul: T('Ombudsman menyebut harga USD 13,35 sen terlalu rendah', 'Ombudsman says the USD 13.35 cent price is too low'), url: SUMBER.ombud.url },
    { tanggal: '2024-01-01', judul: T('Putri Cempo Surakarta COD (awal 2024)', 'Putri Cempo Surakarta COD (early 2024)'), url: SUMBER.wekdm.url },
    { tanggal: '2025-03-13', judul: T('Pemerintah akan mengevaluasi PLTSa di 12 kota', 'Government to evaluate waste plants in 12 cities'), url: SUMBER.katmang.url },
    { tanggal: '2025-09-30', judul: T('Rakornas PSEL di Wisma Danantara', 'National PSEL coordination meeting at Wisma Danantara'), url: SUMBER.wekdm.url },
    { tanggal: '2025-10-10', judul: T('Perpres 109/2025 ditandatangani', 'Perpres 109/2025 signed'), url: SUMBER.metro109.url },
    { tanggal: '2025-11-19', judul: T('Baru empat kota siap tender tahap I', 'Only four cities ready for phase I tender'), url: SUMBER.empat.url },
    { tanggal: '2026-07-08', judul: T('Groundbreaking PSEL Bali', 'Groundbreaking of PSEL Bali'), url: SUMBER.bali.url },
    { tanggal: '2026-08-26', judul: T('Groundbreaking PSEL Bekasi', 'Groundbreaking of PSEL Bekasi'), url: SUMBER.bekasi.url },
    { tanggal: '2027-12-31', judul: T('Target Danantara agar Bali beroperasi pada akhir 2027', 'Danantara target for Bali to operate by end 2027'), url: SUMBER.bali.url },
    { tanggal: '2028-06-30', judul: T('Target operasi PSEL Bekasi (pertengahan 2028)', 'Target operation of PSEL Bekasi (mid-2028)'), url: SUMBER.bekasi.url },
  ] };
  bab['14'] = { tipe: 'teks', sumber: sm('ashurst', 'subs', 'tenggara', 'wekdm'), paragraf: P(
    ['Insentif utama Perpres 109/2025: harga beli PLN tetap USD 0,20 per kWh untuk berapa pun kapasitas selama 30 tahun tanpa eskalasi (hanya pembangkitan, bukan sambungan jaringan), kompensasi negara untuk PLN, persetujuan AMDAL otomatis dalam dua bulan, dan PPA wajib ditandatangani PLN dalam 10 hari kerja setelah izin prakonstruksi.', 'Main incentives of Perpres 109/2025: PLN purchase price fixed at USD 0.20 per kWh for any capacity over 30 years without escalation (generation only, not grid connection), state compensation to PLN, automatic AMDAL approval within two months, and PLN must sign the PPA within 10 working days after pre-construction licences.'],
    ['Kewajiban: pemda menjamin pasokan minimum 1.000 ton per hari per fasilitas dan tidak lagi membayar tipping fee. Ashurst mencatat bahwa take-or-pay belum jelas dan tidak ada penalti PPA untuk kekurangan pasokan sampah.', 'Obligations: local government must guarantee at least 1,000 tonnes a day per facility and no longer pays a tipping fee. Ashurst notes take-or-pay is not clear and there is no PPA penalty for insufficient waste supply.'],
  ) };
  bab['15'] = { tipe: 'langkah', sumber: sm('ashurst', 'metro109'), catatan: T('Urutan menurut ringkasan Ashurst atas Perpres 109/2025; durasi total dan biaya belum bersumber.', 'Order per Ashurst\'s summary of Perpres 109/2025; total duration and cost are not sourced.'), butir: [
    { judul: T('Penetapan kota layak', 'Eligible city designation'), isi: T('KLH memverifikasi kesiapan pemda dan menetapkan kota atau kabupaten.', 'The Environment Ministry verifies local readiness and designates the city or regency.'), pelaku: T('KLH, pemda', 'Environment Ministry, local government') },
    { judul: T('Studi teknis dan ekonomi', 'Technical and economic study'), isi: T('Danantara melakukan studi setelah penetapan; daftar prakualifikasi (DPT) terbuka.', 'Danantara runs the study after designation; a pre-qualification list is open.'), pelaku: T('Danantara', 'Danantara') },
    { judul: T('Pemilihan mitra BUPP', 'BUPP partner selection'), isi: T('Tender mitra pengembang; tahap I lebih dari seratus investor tertarik pada tahap II menurut pemberitaan.', 'Developer partner tender; over a hundred investors were reported interested in phase II.'), pelaku: T('Danantara, investor', 'Danantara, investors') },
    { judul: T('Izin prakonstruksi dan AMDAL', 'Pre-construction licences and AMDAL'), isi: T('AMDAL disetujui otomatis dua bulan (contoh Bekasi: izin AMDAL terbit 24 Agustus 2026, dua hari sebelum groundbreaking).', 'AMDAL auto-approved in two months (Bekasi example: AMDAL permit issued 24 August 2026, two days before groundbreaking).'), pelaku: T('Pengembang, KLH', 'Developer, Environment Ministry') },
    { judul: T('PPA dan pembiayaan', 'PPA and financing'), isi: T('PLN menandatangani PPA dalam 10 hari kerja; pembiayaan dengan skema kompensasi PLN.', 'PLN signs the PPA within 10 working days; financing under the PLN compensation scheme.'), pelaku: T('PLN, pendana', 'PLN, lenders') },
    { judul: T('Konstruksi dan COD', 'Construction and COD'), isi: T('Bekasi menargetkan operasi pertengahan 2028; Bali berusaha akhir 2027.', 'Bekasi targets mid-2028 operation; Bali aims for end 2027.'), pelaku: T('Pengembang', 'Developer') },
  ] };
  bab['16'] = { tipe: 'teks', sumber: sm('ashurst', 'ruuebet'), paragraf: P(
    ['Perpres 109/2025 memerlukan aturan turunan untuk teknologi di luar PSEL dan untuk rincian kompensasi PLN; Ashurst mencatat rincian itu belum ditetapkan. Isu take-or-pay, kepemilikan fasilitas setelah PPA berakhir, dan peran ganda Danantara adalah bahan masukan yang layak diajukan.', 'Perpres 109/2025 needs implementing rules for technologies beyond PSEL and for PLN compensation details; Ashurst notes these are not yet set. Take-or-pay, facility ownership after the PPA ends and Danantara\'s dual role are worthwhile inputs.'],
    ['RUU EBET berada pada tahap pembahasan menurut arsip METI 8 September 2026 dan dapat diikuti lewat forum Konsultasi.', 'RUU EBET is in deliberation per the METI archive of 8 September 2026 and can be followed through the Consultation forum.'],
  ) };
  bab['17'] = { tipe: 'teks', sumber: sm('wekdm', 'bekasi', 'teknologi'), paragraf: P(
    ['Dua PSEL yang beroperasi memakai gasifikasi (Benowo 9 MW, Putri Cempo 5 MW dengan teknologi plasma menurut nama operator). Danantara menyatakan proyek barunya memakai teknologi yang lebih canggih daripada yang dipakai di Tiongkok, dan Bekasi akan bersinergi dengan teknologi pirolisis TNI AD.', 'The two operating PSEL plants use gasification (Benowo 9 MW, Putri Cempo 5 MW with plasma technology per the operator name). Danantara says new projects use more advanced technology than in China, and Bekasi will work with the Army pyrolysis technology.'],
    [HIP + 'pilihan teknologi harus diuji pada sampah Indonesia yang 55 sampai 60 persen organik dan basah; teknologi impor yang dirancang untuk sampah kering terbukti gagal di Delhi dan Addis Ababa (bab 40).', HIPE + 'technology choice must be tested on Indonesian waste that is 55 to 60 percent organic and wet; imported technology designed for dry waste failed in Delhi and Addis Ababa (chapter 40).'],
  ) };
  bab['19'] = { tipe: 'grafik', jenis: 'batang', sumber: sm('ombud', 'ashurst'), label: T('Harga beli listrik PSEL (sen USD per kWh)', 'PSEL electricity purchase price (US cents per kWh)'), satuan: 'sen/kWh', d: 2, seri: [{ nama: T('Harga beli PLN', 'PLN purchase price'), sorot: true, titik: [['Perpres 35/2018 (sampai 20 MW)', 13.35], ['Perpres 109/2025', 20]] }], catatan: T('Biaya modal: Sunter dihitung Rp5,2 triliun (Ombudsman); Bali dan Bekasi masing-masing Rp3 triliun, Bekasi 1.500 ton per hari sehingga sekitar Rp2 miliar per ton per hari (EST).', 'Capital cost: Sunter was estimated at IDR 5.2 trillion (Ombudsman); Bali and Bekasi IDR 3 trillion each, Bekasi at 1,500 tonnes a day so about IDR 2 billion per tonne per day (EST).') };
  bab['20'] = { tipe: 'tabel', per: 8, sumber: sm('jpwiki', 'sgnea', 'sg101', 'sg2026', 'timar', 'reppie', 'wekdm'), catatan: T('Pembanding terpilih, bukan peringkat lengkap negara.', 'Selected comparators, not a full country ranking.'), kolom: [{ k: 'n', l: T('Negara', 'Country') }, { k: 'f', l: T('Fakta kunci', 'Key fact') }, { k: 'h', l: T('Pelajaran', 'Lesson') }], baris: [
    { n: T('Jepang', 'Japan'), f: T('Sekitar 1.200 fasilitas insinerasi (2017); 358 membangkitkan listrik (2014)', 'About 1,200 incineration facilities (2017); 358 generated power (2014)'), h: T('Insinerasi sebagai tulang punggung layanan sampah, bukan proyek listrik', 'Incineration as the backbone of waste service, not a power project') },
    { n: T('Singapura', 'Singapore'), f: T('Panas insinerasi sekitar 2 persen listrik; abu ke Semakau yang diproyeksikan penuh 2035', 'Incineration heat about 2 percent of power; ash to Semakau projected full by 2035'), h: T('Insinerasi memperpanjang TPA tetapi tidak menghilangkannya', 'Incineration extends landfill life but does not remove it') },
    { n: T('India (Delhi)', 'India (Delhi)'), f: T('Timarpur 300 ton per hari, 3,75 MW; nilai kalor sampah 600 sampai 700 kcal per kg vs desain 1.460', 'Timarpur 300 tonnes a day, 3.75 MW; waste calorific value 600 to 700 kcal per kg vs design 1,460'), h: T('Teknologi harus cocok dengan sampah', 'Technology must match the waste') },
    { n: T('Ethiopia', 'Ethiopia'), f: T('Reppie dirancang 1.400 ton per hari; sekitar 396 sampai 650 menurut GAIA', 'Reppie designed for 1,400 tonnes a day; about 396 to 650 per GAIA'), h: T('Sampah basah memerlukan teknologi dan bahan bakar tambahan', 'Wet waste needs different technology and extra fuel') },
    { n: T('Indonesia', 'Indonesia'), f: T('2 dari 15 proyek COD; Benowo 9 MW, Putri Cempo 5 MW', '2 of 15 projects at COD; Benowo 9 MW, Putri Cempo 5 MW'), h: T('Harga dan kepastian kontrak lebih menentukan daripada mesin', 'Price and contract certainty matter more than machines') },
  ] };
  bab['21'] = { tipe: 'teks', sumber: sm('jpwiki', 'sgnea', 'sg2026', 'timar', 'reppie', 'ed'), paragraf: P(
    ['Jepang dan Singapura menunjukkan bahwa insinerasi bekerja ketika ia menjadi layanan publik jangka panjang dengan pemilahan, regulasi emisi, dan lahan akhir (abu). Keduanya tidak mengandalkan listrik sebagai sumber pendapatan utama: di Singapura panas insinerasi hanya sekitar 2 persen listrik.', 'Japan and Singapore show incineration works when it is a long-term public service with sorting, emission regulation and final disposal for ash. Neither relies on electricity as the main revenue: in Singapore incineration heat is only about 2 percent of power.'],
    ['Kegagalan Delhi 1987 dan Addis Ababa 2018 sama: teknologi dirancang untuk sampah berkalori tinggi sedangkan sampah lokal basah dan organik. Pelajarannya langsung relevan untuk Indonesia dengan sampah 55 sampai 60 persen organik.', 'The Delhi 1987 and Addis Ababa 2018 failures are the same: technology designed for high-calorific waste while local waste is wet and organic. The lesson applies directly to Indonesia with 55 to 60 percent organic waste.'],
  ) };
  bab['22'] = { tipe: 'teks', sumber: sm('kap', 'jpwiki', 'wekdm'), paragraf: P(
    [`Kapasitas listrik sampah terbarukan Indonesia ${k25.kapasitas_mw} MW (IRENA 2025) dengan pembangkitan ${k24.pembangkitan_gwh} GWh pada 2024, jauh lebih kecil daripada Jepang yang memiliki sekitar 1.200 fasilitas insinerasi.`, `Indonesia's renewable municipal waste capacity is ${k25.kapasitas_mw} MW (IRENA 2025) with ${k24.pembangkitan_gwh} GWh generation in 2024, far smaller than Japan with about 1,200 incineration facilities.`],
    ['Dua dari 15 proyek mencapai COD (16,7 persen) pada September 2025, jadi jarak ke negara berpengalaman bukan pada teknologi melainkan pada kelembagaan layanan sampah.', 'Two of 15 projects reached COD (16.7 percent) by September 2025, so the gap to experienced countries lies not in technology but in waste-service institutions.'],
  ) };
  bab['23'] = { tipe: 'teks', sumber: sm('bogor', 'tahap2', 'teknologi'), paragraf: P(
    ['Kemitraan teknologi dan modal luar negeri menonjol pada tahap I: Zhejiang Weiming ditetapkan sebagai mitra operator PSEL Bogor Raya, dan lebih dari seratus investor domestik dan asing disebut antre pada tahap II.', 'Foreign technology and capital partnerships stand out in phase I: Zhejiang Weiming was named operator partner for Greater Bogor, and over a hundred domestic and foreign investors were reported queuing for phase II.'],
    ['Perjanjian pemerintah ke pemerintah, pendanaan multilateral, dan standar emisi internasional untuk PSEL belum ditemukan di sumber yang dibaca.', 'Government-to-government agreements, multilateral funding and international emission standards for PSEL were not found in the sources read.'],
  ) };
  const pr1 = pendRows((x) => (x.sektor || []).includes('biomassa-sampah') || /sampah|waste/i.test(x.nama), 10);
  bab['24'] = { tipe: 'tabel', per: 8, sumber: sm('pendanaan'), catatan: T('Skema dan proyek pendana yang menyebut sampah atau biomassa-sampah di basis METI; pembiayaan PSEL utama saat ini dari Danantara dan bank pelaksana, belum ada di basis.', 'Schemes and funder projects naming waste in the METI base; the main PSEL financing now comes from Danantara and lenders and is not yet in the base.'), kolom: PEND_KOL, baris: pr1 };
  bab['25'] = { tipe: 'rumus', sumber: sm('ashurst', 'bekasi', 'bali', 'ombud'), rumus: P(
    ['Investasi per kapasitas = nilai investasi / ton per hari', 'Investment per capacity = investment / tonnes per day'],
    ['Titik impas harga listrik = (biaya modal tahunan + biaya operasi) / kWh per tahun', 'Break-even power price = (annualised capital cost + operating cost) / kWh per year'],
  ), contoh: [
    T('Bekasi: Rp3 triliun untuk 1.500 ton per hari berarti sekitar Rp2 miliar per ton per hari. Bali: Rp3 triliun untuk lebih dari 500.000 ton per tahun (sekitar 1.370 ton per hari) berarti sekitar Rp2,2 miliar per ton per hari (EST).', 'Bekasi: IDR 3 trillion for 1,500 tonnes a day means about IDR 2 billion per tonne a day. Bali: IDR 3 trillion for over 500,000 tonnes a year (about 1,370 a day) means about IDR 2.2 billion per tonne a day (EST).'),
    T('Sunter Jakarta diperkirakan Rp5,2 triliun dengan biaya proses Rp585.963 per ton dan tipping fee sekitar Rp476 miliar per tahun menurut Ombudsman; ini menjelaskan mengapa pemerintah memindahkan beban ke harga listrik dan kompensasi pusat.', 'Sunter Jakarta was estimated at IDR 5.2 trillion with a processing fee of IDR 585,963 per tonne and a tipping fee of about IDR 476 billion a year per the Ombudsman; this explains why government moved the burden to electricity price and central compensation.'),
  ] };
  bab['26'] = { tipe: 'tabel', per: 8, sumber: sm('kisi', 'bali', 'bekasi', 'ombud', 'tgr'), catatan: T('Nilai dari pemberitaan dan pernyataan; bukan nilai kontrak final.', 'Values from news and statements; not final contract values.'), kolom: [{ k: 'p', l: T('Proyek', 'Project') }, { k: 'n', l: T('Nilai', 'Value') }, { k: 'k', l: T('Keterangan', 'Note') }], baris: [
    { p: T('Program 33 kota (perkiraan Danantara)', '33-city programme (Danantara estimate)'), n: T('Sekitar Rp91 triliun', 'About IDR 91 trillion'), k: T('Pemberitaan Bisnis 30 Sep 2025', 'Bisnis report 30 Sep 2025') },
    { p: 'PSEL Bali', n: 'Rp3 triliun', k: T('Groundbreaking 8 Juli 2026; lebih dari 500.000 ton per tahun', 'Groundbreaking 8 July 2026; over 500,000 tonnes a year') },
    { p: 'PSEL Bekasi', n: 'Rp3 triliun', k: T('Groundbreaking 26 Agustus 2026; 1.500 ton per hari; operasi pertengahan 2028', 'Groundbreaking 26 August 2026; 1,500 tonnes a day; mid-2028 operation') },
    { p: 'PLTSa Sunter (batal)', n: T('Rp5,2 triliun (perkiraan)', 'IDR 5.2 trillion (estimate)'), k: T('Tidak ekonomis menurut Ombudsman 2023', 'Not economical per the Ombudsman 2023') },
    { p: T('PSEL Tangerang dan Tangsel (dibatalkan)', 'PSEL Tangerang and South Tangerang (cancelled)'), n: T('Tidak ditemukan nilainya', 'Value not found'), k: T('Berita pembatalan menekan saham emiten terkait (Bisnis, 28 Okt 2025)', 'Cancellation news hit related stocks (Bisnis, 28 Oct 2025)') },
  ] };
  bab['27'] = { tipe: 'teks', sumber: sm('bali', 'ashurst', 'sgnea', 'reppie', 'reppie18', 'apsn'), paragraf: P(
    ['Klaim manfaat: PSEL Bali disebut mengurangi emisi TPA hingga 80 persen dan 640.000 ton emisi karbon per tahun, serta melayani listrik sekitar 100.000 rumah tangga (klaim pemberitaan, belum diverifikasi independen).', 'Claimed benefits: PSEL Bali is said to cut landfill emissions by up to 80 percent and 640,000 tonnes of carbon emissions a year and serve electricity to about 100,000 households (press claims, not independently verified).'],
    ['Risiko: abu dan gas buang perlu pengolahan; Singapura memindahkan abu ke Semakau yang diproyeksikan penuh 2035; kandungan organik 55 sampai 60 persen menurunkan efisiensi; kritik masyarakat sipil menyebut insinerator mahal dan tidak adil.', 'Risks: ash and flue gas need treatment; Singapore ships ash to Semakau, projected full by 2035; 55 to 60 percent organic content lowers efficiency; civil-society critics call incinerators costly and unfair.'],
    ['Aspek pemulung dan komunitas sekitar TPA belum bersumber di bab ini. Pengingat dari Addis Ababa: longsor TPA Koshe pada 2017 menewaskan sekitar 114 sampai 116 orang menurut berbagai laporan.', 'The position of waste pickers and landfill communities is not sourced in this chapter. A reminder from Addis Ababa: the 2017 Koshe landfill landslide killed about 114 to 116 people in different reports.'],
  ) };
  bab['29'] = { tipe: 'teks', sumber: sm('ashurst', 'ombud', 'subs', 'apsn', 'wekdm'), paragraf: P(
    ['Tipping fee: pemerintah menilai beban daerah harus diganti subsidi PLN agar proyek jalan; sisi lain, Ashurst mencatat kompensasi ke PLN belum rinci dan takut menjadi beban fiskal dan listrik.', 'Tipping fee: government says the local burden must be replaced by PLN subsidy so projects can move; on the other side Ashurst notes PLN compensation is not detailed and may become a fiscal and tariff burden.'],
    ['Harga USD 0,20 per kWh: pendukung menyebutnya diperlukan karena USD 13,35 sen tidak bisa bersaing dengan batubara (Ombudsman); kritik mempertanyakan harga yang jauh di atas listrik lain. Peran ganda Danantara sebagai koordinator dan investor juga dicatat sebagai risiko tata kelola.', 'The USD 0.20 per kWh price: supporters say it is needed because USD 13.35 cents cannot compete with coal (Ombudsman); critics question a price far above other power. Danantara\'s dual role as coordinator and investor is also noted as a governance risk.'],
    ['Teknologi: pendukung menekankan solusi darurat TPA; kritik sipil menekankan emisi dan pilihan pengurangan serta daur ulang.', 'Technology: supporters stress the landfill emergency; civil-society critics stress emissions and reduction and recycling options.'],
  ) };
  bab['30'] = { tipe: 'tabel', per: 8, sumber: sm('ruptl', 'ashurst', 'bali', 'bekasi', 'kisi'), catatan: T('Target adalah rencana dan sudah bergeser sebelumnya (target Perpres 35/2018 berupa pengelolaan sampah 100 persen pada akhir 2025 tidak tercapai).', 'Targets are plans and have slipped before (the Perpres 35/2018 target of 100 percent waste management by end 2025 was not met).'), kolom: [{ k: 'd', l: T('Rencana', 'Plan') }, { k: 'v', l: T('Nilai', 'Value'), num: true, d: 1 }, { k: 'sat', l: T('Satuan', 'Unit') }], baris: [
    { d: T('Kota dalam program Danantara', 'Cities in the Danantara programme'), v: 33, sat: T('kota', 'cities') },
    { d: T('RUPTL 2025-2034: sampah bernama', 'RUPTL 2025-2034: named waste projects'), v: ru.mw_per_teknologi['biomassa-sampah'], sat: 'MW' },
    { d: T('Perkiraan investasi program', 'Estimated programme investment'), v: 91, sat: T('triliun rupiah', 'trillion rupiah') },
    { d: T('Perkiraan TPA penuh tanpa tindakan', 'Estimated landfill full without action'), v: 2030, sat: T('tahun', 'year') },
  ] };
  bab['31'] = { tipe: 'teks', sumber: sm('ed', 'ashurst', 'ombud'), paragraf: P(
    [HIP + 'Pengembang: nilai terbesar ada pada perjanjian pasokan sampah dan penanganan residu, bukan mesin. Investor: risiko take-or-pay dan kompensasi PLN harus dibaca di PPA, bukan di Perpres. Pemda: kualitas pemilahan dan jaminan 1.000 ton per hari adalah kewajiban nyata. Akademisi: ukur nilai kalor dan kadar air sampah per kota sebelum memilih teknologi.', HIPE + 'Developers: most value lies in waste supply agreements and residue handling, not machines. Investors: take-or-pay and PLN compensation risk must be read in the PPA, not the Perpres. Local government: sorting quality and the 1,000 tonnes a day guarantee are real obligations. Academics: measure waste calorific value and moisture per city before choosing technology.'],
  ) };
  bab['32'] = { tipe: 'teks', sumber: sm('bali', 'bekasi', 'tahap2', 'ashurst'), paragraf: P(
    ['Yang perlu dipantau: (1) aturan turunan Perpres 109/2025 dan rincian kompensasi PLN; (2) apakah Bali memenuhi target akhir 2027 dan Bekasi pertengahan 2028; (3) studi kelayakan tahap II yang ditargetkan selesai pertengahan November 2026; (4) hasil pengujian teknologi pada sampah basah; (5) kepastian pasokan sampah dari pemda.', 'To watch: (1) implementing rules for Perpres 109/2025 and PLN compensation details; (2) whether Bali meets end-2027 and Bekasi mid-2028; (3) phase II feasibility studies targeted for mid-November 2026; (4) technology performance on wet waste; (5) waste supply certainty from local governments.'],
  ) };
  bab['38'] = { tipe: 'teks', sumber: sm('ed'), paragraf: P(
    ['Metode: kapasitas dari IRENA, proyek dari basis METI dan RUPTL, dan sebagian besar fakta kebijakan serta proyek dari berita kredibel dan ringkasan hukum yang ditautkan. Beberapa halaman (Bisnis, WALHI) memblokir pengambilan otomatis sehingga hanya judul dan ringkasan pencarian yang dipakai; angka dari halaman tersebut ditandai tingkat bukti media. Sintesis berlabel Analisis METI (Hipotesis). Batas: status proyek berubah cepat; data kapasitas MW proyek baru, tenaga kerja, dan pemulung belum ditemukan.', 'Method: capacity from IRENA, projects from the METI base and RUPTL, and most policy and project facts from credible news and linked legal summaries. Some pages (Bisnis, WALHI) block automated fetching so only headlines and search summaries were used; figures from them carry media evidence level. Synthesis is labelled METI analysis (Hypothesis). Limits: project status changes fast; MW capacity of new projects, employment and waste-picker data were not found.'],
  ) };

  const cs = kasus;
  bab['39'] = { tipe: 'kasus', sumber: sm('wekdm', 'ombud', 'jpwiki', 'sgnea'), catatan: T('Keberhasilan operasional di sini tidak berarti bebas kritik: lihat bab 29. Kapasitas dan biaya yang tidak ditemukan sengaja dikosongkan.', 'Operational success here does not mean free of critique: see chapter 29. Capacity and costs not found are deliberately blank.'), butir: [
    cs({ id: 'benowo', nama: 'PLTSa Benowo (Surabaya)', jenis: 'berhasil', lokasi: T('Surabaya, Jawa Timur', 'Surabaya, East Java'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: 9, satuan: 'MW' }, { label: T('Sampah', 'Waste'), nilai: 1000, satuan: T('ton per hari', 'tonnes a day') }, { label: T('Operator', 'Operator'), nilai: 'PT Sumber Organik' }, { label: T('Teknologi', 'Technology'), nilai: T('Gasifikasi', 'Gasification') }, { label: 'COD', nilai: '2021-05' }],
      tindakan: P(['Dibangun di TPA Benowo milik kota dan beroperasi komersial Mei 2021.', 'Built at the city-owned Benowo landfill and in commercial operation from May 2021.']),
      sebab: P(['Salah satu dari hanya dua yang mencapai COD dari 15 proyek (16,7 persen).', 'One of only two reaching COD out of 15 projects (16.7 percent).'], ['Ombudsman menulis bahwa Surabaya dan Solo dapat berjalan, namun artikelnya tidak konsisten soal Surabaya sehingga faktor keberhasilan khususnya tidak dapat disimpulkan dari sumber ini.', 'The Ombudsman wrote that Surabaya and Solo can run, but its article is inconsistent about Surabaya, so specific success factors cannot be concluded from this source.']),
      angka: [{ label: T('Kapasitas', 'Capacity'), nilai: 9, d: 0, satuan: 'MW', sumber: 'wekdm', est: false }, { label: T('Listrik per ton (hitung sendiri)', 'Electricity per tonne (own calculation)'), nilai: kwhBenT, d: 0, satuan: 'kWh', sumber: 'wekdm', est: true }],
      pelajaran: P(['Skala 1.000 ton per hari dengan gasifikasi sudah terbukti beroperasi di Indonesia.', 'A 1,000 tonnes a day scale with gasification is proven to operate in Indonesia.']),
      faktor: { lahan: true, jaringan: true }, sumber: ['wekdm', 'ombud'], hak_jawab: true }),
    cs({ id: 'putricempo', nama: 'PLTSa Putri Cempo (Surakarta)', jenis: 'berhasil', lokasi: T('Surakarta, Jawa Tengah', 'Surakarta, Central Java'),
      profil: [{ label: T('Kapasitas', 'Capacity'), nilai: 5, satuan: 'MW' }, { label: T('Sampah', 'Waste'), nilai: 545, satuan: T('ton per hari', 'tonnes a day') }, { label: T('Operator', 'Operator'), nilai: 'PT Solo Citra Metro Plasma Power' }, { label: 'COD', nilai: T('Awal 2024', 'Early 2024') }],
      tindakan: P(['Gasifikasi di TPA Putri Cempo; tidak membebankan tipping fee kepada pemerintah kota menurut Ombudsman.', 'Gasification at the Putri Cempo landfill; no tipping fee charged to the city government per the Ombudsman.']),
      sebab: P(['Dibangun dengan orientasi komersial, bukan proyek percontohan, menurut penilaian Ombudsman.', 'Built with a commercial orientation, not as a pilot, per the Ombudsman\'s assessment.']),
      angka: [{ label: T('Kapasitas', 'Capacity'), nilai: 5, d: 0, satuan: 'MW', sumber: 'wekdm', est: false }, { label: T('Listrik per ton (hitung sendiri)', 'Electricity per tonne (own calculation)'), nilai: kwhSolo, d: 0, satuan: 'kWh', sumber: 'wekdm', est: true }],
      pelajaran: P(['Skema tanpa tipping fee dari pemda mengurangi hambatan fiskal daerah.', 'A no-tipping-fee scheme for local government reduces the local fiscal barrier.']),
      faktor: { ppa_tarif: true, pendanaan: true }, sumber: ['wekdm', 'ombud'], hak_jawab: true }),
    cs({ id: 'jepang', nama: 'Insinerasi layanan publik Jepang', jenis: 'berhasil', negara: 'JP', lokasi: T('Jepang', 'Japan'),
      profil: [{ label: T('Fasilitas insinerasi (2017)', 'Incineration facilities (2017)'), nilai: 1200 }, { label: T('Berlistrik (2014)', 'With power (2014)'), nilai: 358 }],
      tindakan: P(['Insinerasi menjadi metode pembuangan paling umum, dibangun sebagai layanan kota.', 'Incineration became the most common disposal method, built as a municipal service.']),
      sebab: P(['Insinerasi diperlakukan sebagai infrastruktur layanan dan bukan hanya pembangkit; sumber yang dibaca tidak merinci faktor lain.', 'Incineration treated as service infrastructure rather than only a power plant; the source read gives no further factor detail.']),
      angka: [{ label: T('Fasilitas insinerasi', 'Incineration facilities'), nilai: 1200, d: 0, satuan: '', sumber: 'jpwiki', est: false }, { label: T('Fasilitas berlistrik', 'Facilities with power'), nilai: 358, d: 0, satuan: '', sumber: 'jpwiki', est: false }],
      pelajaran: P(['Hanya sekitar sepertiga fasilitas Jepang membangkitkan listrik: listrik adalah efek sampingan layanan.', 'Only about a third of Japanese facilities generate power: electricity is a by-product of the service.']),
      faktor: { kepastian_kebijakan: true, pengelola_om: true }, sumber: ['jpwiki'], hak_jawab: true }),
    cs({ id: 'singapura', nama: 'Insinerasi dan Semakau (Singapura)', jenis: 'berhasil', negara: 'SG', lokasi: T('Singapura', 'Singapore'),
      profil: [{ label: T('Pengurangan volume', 'Volume reduction'), nilai: T('Hingga 90 persen', 'Up to 90 percent') }, { label: T('Listrik dari panas', 'Electricity from heat'), nilai: T('Sekitar 2 persen pasokan', 'About 2 percent of supply') }, { label: T('TPA', 'Landfill'), nilai: T('Semakau, dibuka 1 April 1999', 'Semakau, opened 1 April 1999') }],
      tindakan: P(['Abu insinerasi diangkut tongkang ke Semakau, satu-satunya TPA; target mengurangi sampah ke Semakau 30 persen pada 2030.', 'Incineration ash is barged to Semakau, the only landfill; the target is to cut waste sent to Semakau 30 percent by 2030.']),
      sebab: P(['Sistem terintegrasi pemilahan, insinerasi, dan lahan akhir yang dikelola satu otoritas.', 'An integrated system of sorting, incineration and final disposal managed by one authority.']),
      angka: [{ label: T('Perkiraan penuhnya Semakau', 'Projected Semakau full year'), nilai: 2035, d: 0, satuan: T('tahun', 'year'), sumber: 'sg2026', est: false }],
      tanda_bahaya: P(['Meski sistem berhasil, lahan akhir tetap terbatas (Semakau penuh 2035).', 'Even a successful system faces finite final disposal (Semakau full by 2035).']),
      pelajaran: P(['Insinerasi menunda, tidak menghilangkan, kebutuhan TPA; pengurangan di hulu tetap diperlukan.', 'Incineration delays, but does not remove, the need for landfill; upstream reduction is still required.']),
      faktor: { kepastian_kebijakan: true, pengelola_om: true, pendanaan: true }, sumber: ['sgnea', 'sg101', 'sg2026'], hak_jawab: true }),
  ] };
  bab['40'] = { tipe: 'kasus', sumber: sm('wekdm', 'katmang', 'ombud', 'tenggara', 'timar', 'reppie'), catatan: HAK, butir: [
    cs({ id: 'perpres35', nama: 'Program 12 kota Perpres 35/2018', jenis: 'mangkrak', lokasi: T('Jakarta, Tangerang, Tangsel, Bekasi, Bandung, Semarang, Surakarta, Surabaya, Makassar, Denpasar, Palembang, Manado', 'Jakarta, Tangerang, South Tangerang, Bekasi, Bandung, Semarang, Surakarta, Surabaya, Makassar, Denpasar, Palembang, Manado'),
      profil: [{ label: T('Proyek', 'Projects'), nilai: 15 }, { label: 'COD', nilai: 2 }, { label: T('Tingkat capaian', 'Achievement rate'), nilai: 16.7, satuan: T('persen', 'percent') }],
      kronologi: [{ tanggal: '2023-12-29', teks: T('Ombudsman: harga USD 13,35 sen terlalu rendah, PLN belum membeli sampai akhir 2019, pemda kekurangan dana.', 'Ombudsman: the USD 13.35 cent price is too low, PLN had not bought through end 2019, local governments lack funds.') }, { tanggal: '2025-03-13', teks: T('Pemerintah menyatakan akan mengevaluasi PLTSa di 12 kota.', 'Government says it will evaluate waste plants in 12 cities.') }, { tanggal: '2025-09-30', teks: T('KESDM: hanya 2 dari 15 proyek COD; hambatan regulasi, pembiayaan, kepastian investasi.', 'KESDM: only 2 of 15 projects at COD; barriers in regulation, financing and investment certainty.') }, { tanggal: '2025-10-10', teks: T('Perpres 109/2025 ditandatangani dan mencabut Perpres 35/2018.', 'Perpres 109/2025 signed and revokes Perpres 35/2018.') }],
      sebab: P(['Harga listrik terlalu rendah dibanding batubara.', 'Electricity price too low versus coal.'], ['Tipping fee membebani APBD yang terbatas.', 'Tipping fees burden limited local budgets.'], ['Kepastian investasi dan regulasi lemah.', 'Weak investment and regulatory certainty.']),
      terdampak: T('Pemda yang sampahnya tetap menumpuk di TPA, investor yang menunda, dan warga sekitar TPA.', 'Local governments whose waste keeps piling up, investors who delayed, and residents near landfills.'),
      seharusnya: T('Menetapkan harga, pembeli, dan sumber pembayaran layanan sampah sebelum menetapkan 12 kota sekaligus.', 'Fix price, buyer and waste-service payment source before designating 12 cities at once.'),
      tanda_bahaya: P(['PLN belum membeli listrik bertahun-tahun setelah perpres.', 'PLN had not bought power years after the regulation.'], ['Pemda tidak sanggup membayar tipping fee.', 'Local governments cannot pay the tipping fee.']),
      angka: [{ label: T('Capaian COD', 'COD achievement'), nilai: 16.7, d: 1, satuan: T('persen', 'percent'), sumber: 'wekdm', est: false }],
      faktor: { ppa_tarif: true, pendanaan: true, kepastian_kebijakan: true }, sumber: ['wekdm', 'katmang', 'ombud'], hak_jawab: true }),
    cs({ id: 'sunter', nama: 'PLTSa Sunter (Jakarta)', jenis: 'dibatalkan', lokasi: T('Jakarta Utara', 'North Jakarta'),
      profil: [{ label: T('Perkiraan investasi', 'Estimated investment'), nilai: 5.2, satuan: T('triliun rupiah', 'trillion rupiah') }, { label: T('Biaya proses per ton', 'Processing fee per tonne'), nilai: 585963, satuan: 'IDR' }],
      kronologi: [{ tanggal: '2023-12-29', teks: T('Ombudsman menyebut Sunter tidak ekonomis dibangun dengan tipping fee sekitar Rp476 miliar per tahun bagi Jakarta.', 'The Ombudsman says Sunter is not economical to build with a tipping fee of about IDR 476 billion a year for Jakarta.') }],
      sebab: P(['Biaya modal tinggi dan beban tipping fee besar bagi APBD DKI.', 'High capital cost and a large tipping fee burden on the DKI budget.']),
      terdampak: T('Pemerintah DKI dan warga Jakarta yang sampahnya bergantung pada Bantargebang.', 'The DKI government and Jakartans whose waste depends on Bantargebang.'),
      seharusnya: T('Membandingkan biaya layanan sampah dengan opsi pengurangan di hulu dan tempat pengolahan antara sebelum menetapkan proyek.', 'Compare waste-service cost with upstream reduction and intermediate treatment options before fixing the project.'),
      tanda_bahaya: P(['Biaya layanan per ton jauh di atas bantuan pusat maksimum Rp500.000.', 'Service cost per tonne far above the maximum central assistance of IDR 500,000.']),
      angka: [{ label: T('Tipping fee tahunan DKI (perkiraan)', 'Annual DKI tipping fee (estimate)'), nilai: 476, d: 0, satuan: T('miliar rupiah', 'billion rupiah'), sumber: 'ombud', est: false }],
      faktor: { pendanaan: true, ppa_tarif: true }, sumber: ['ombud', 'tenggara'], hak_jawab: true }),
    cs({ id: 'gedebage', nama: 'PLTSa Gedebage (Bandung)', jenis: 'mangkrak', lokasi: T('Bandung, Jawa Barat', 'Bandung, West Java'),
      profil: [{ label: T('Awal', 'Start'), nilai: T('2006 oleh Pemkot Bandung bersama PT Bandung Raya Indah Lestari', '2006 by Bandung city with PT Bandung Raya Indah Lestari') }],
      kronologi: [{ tanggal: '2006-01-01', teks: T('Proyek dimulai (tahun saja, menurut ringkasan sumber).', 'Project begins (year only, per source summary).') }],
      sebab: P(['Tenggara Strategics mencatat Gedebage batal beroperasi; rincian penyebab tidak ditemukan di sumber yang dapat dibaca otomatis.', 'Tenggara Strategics records that Gedebage did not come into operation; cause details were not found in sources readable automatically.']),
      terdampak: T('Pemkot Bandung dan investor. Tanggapan pemkot dan PT BRIL belum kami muat.', 'Bandung city and investors. Responses from the city and PT BRIL are not yet carried.'),
      seharusnya: T('Mempublikasikan alasan penghentian dan utang proyek agar kota lain belajar.', 'Publish the reasons for stopping and project liabilities so other cities can learn.'),
      tanda_bahaya: P(['Proyek berumur panjang tanpa COD.', 'A long-lived project without COD.']),
      angka: [{ label: T('Tahun mulai', 'Start year'), nilai: 2006, d: 0, satuan: '', sumber: 'tenggara', est: false }],
      faktor: {}, sumber: ['tenggara'], hak_jawab: true }),
    cs({ id: 'tangerang', nama: 'PSEL Tangerang dan Tangsel', jenis: 'dibatalkan', lokasi: T('Tangerang dan Tangerang Selatan, Banten', 'Tangerang and South Tangerang, Banten'),
      profil: [{ label: T('Sumber', 'Source'), nilai: T('Pemberitaan Bisnis, 28 Oktober 2025', 'Bisnis report, 28 October 2025') }],
      kronologi: [{ tanggal: '2025-10-28', teks: T('Pembatalan proyek PSEL Tangerang dan Tangsel diberitakan menekan saham emiten terkait.', 'Cancellation of the Tangerang and South Tangerang PSEL projects reported to hit related stocks.') }],
      sebab: P(['Halaman sumber memblokir pengambilan otomatis; rincian alasan pembatalan belum kami baca dan sengaja tidak ditulis.', 'The source page blocks automated fetching; cancellation reasons were not read and are deliberately not written.']),
      terdampak: T('Emiten dan pengembang yang terkait; pemda yang sampahnya belum tertangani. Tanggapan pihak terkait belum kami muat.', 'Related listed companies and developers; local governments whose waste remains unhandled. Responses from related parties are not yet carried.'),
      seharusnya: T('Menjelaskan secara terbuka kriteria kota yang masuk atau keluar program agar investor dapat menilai risiko.', 'Explain openly the criteria for cities entering or leaving the programme so investors can assess risk.'),
      tanda_bahaya: P(['Daftar kota program berubah antar tahap.', 'The programme city list changes between phases.']),
      faktor: { kepastian_kebijakan: true }, sumber: ['tgr'], hak_jawab: true }),
    cs({ id: 'timarpur', nama: 'Timarpur (Delhi, India)', jenis: 'gagal', negara: 'IN', lokasi: T('Delhi, India', 'Delhi, India'),
      profil: [{ label: T('Desain', 'Design'), nilai: T('300 ton per hari, 3,75 MW', '300 tonnes a day, 3.75 MW') }, { label: T('Pembiayaan', 'Financing'), nilai: T('Bantuan Pemerintah Denmark', 'Government of Denmark assistance') }],
      kronologi: [{ tanggal: '1987-03-01', teks: T('Uji operasi dimulai (Maret 1987 sampai April 1989 menurut jawaban parlemen).', 'Trial operation begins (March 1987 to April 1989 per a parliamentary answer).') }],
      sebab: P(['Kualitas sampah yang dipasok tidak sesuai desain: nilai kalor 600 sampai 700 kcal per kg dibanding desain 1.460.', 'Supplied waste did not match design: calorific value 600 to 700 kcal per kg versus design 1,460.'], ['Percobaan menambah solar tidak berhasil.', 'Attempts to add diesel failed.']),
      terdampak: T('Kota Delhi dan donor; sumber memberi tanggal penutupan yang berbeda (6 bulan sampai 1991).', 'Delhi and the donor; sources give different closure dates (6 months to 1991).'),
      seharusnya: T('Mengukur karakter sampah lokal sebelum memilih teknologi dan memilah sampah di sumber.', 'Measure local waste character before choosing technology and sort waste at source.'),
      tanda_bahaya: P(['Teknologi diimpor tanpa uji sampah lokal.', 'Technology imported without testing local waste.']),
      angka: [{ label: T('Nilai kalor sampah', 'Waste calorific value'), nilai: T('600 sampai 700', '600 to 700'), d: 0, satuan: 'kcal/kg', sumber: 'timar', est: false }],
      faktor: {}, sumber: ['timar', 'scroll'], hak_jawab: true }),
    cs({ id: 'reppie', nama: 'Reppie (Addis Ababa, Ethiopia)', jenis: 'mati', negara: 'ET', lokasi: T('Koshe, Addis Ababa', 'Koshe, Addis Ababa'),
      profil: [{ label: T('Desain', 'Design'), nilai: 1400, satuan: T('ton per hari', 'tonnes a day') }, { label: T('Dibuka', 'Opened'), nilai: '2018-08' }],
      kronologi: [{ tanggal: '2018-08-20', teks: T('Dibuka sebagai fasilitas listrik dari sampah pertama di Afrika.', 'Opened as Africa\'s first waste-to-energy facility.') }],
      sebab: P(['Teknologi impor tidak cocok dengan sampah basah dan organik sehingga memerlukan bahan bakar tambahan (GAIA).', 'Imported technology mismatched wet organic waste so extra fuel was needed (GAIA).']),
      terdampak: T('Kota yang masih membuang sekitar 3.000 ton ke Koshe; laporan GAIA memperkirakan pengolahan 396 sampai 650 ton per hari. Judul "mati" dipakai terbatas: pabrik beroperasi di bawah desain, bukan berhenti total.', 'The city still dumps about 3,000 tonnes at Koshe; GAIA estimates 396 to 650 tonnes a day processed. The label "dead" is used loosely: the plant runs below design, it has not fully stopped.'),
      seharusnya: T('Uji pilot pada sampah nyata dan kontrak kinerja berbasis tonase sebelum membangun skala penuh.', 'Pilot test on real waste and tonnage-based performance contracts before full-scale build.'),
      tanda_bahaya: P(['Pasokan nyata kurang dari separuh desain.', 'Actual throughput under half of design.']),
      angka: [{ label: T('Desain', 'Design'), nilai: 1400, d: 0, satuan: T('ton per hari', 'tonnes a day'), sumber: 'reppie', est: false }, { label: T('Perkiraan GAIA', 'GAIA estimate'), nilai: T('396 sampai 650', '396 to 650'), d: 0, satuan: T('ton per hari', 'tonnes a day'), sumber: 'reppie', est: false }],
      faktor: { pengelola_om: true }, sumber: ['reppie', 'reppie18'], hak_jawab: true }),
  ] };
  bab['41'] = { tipe: 'pola', sumber: sm('ed'), catatan: T('Sel dibangun dari bendera faktor tiap kasus; pemetaan faktor ke kasus adalah analisis METI (Hipotesis) atas fakta di bab 39 dan 40.', 'Cells are built from each case factor flags; mapping factors to cases is METI analysis (Hypothesis) on facts in chapters 39 and 40.'), faktor: FAKTOR_STD.map(([k, a, e]) => L(k, a, e)) };
  bab['42'] = { tipe: 'periksa', sumber: sm('ed'), peran: PERAN, tahap: TAHAP, butir: [
    dasarP('pengembang', 'lokasi', 'Ukur nilai kalor dan kadar air sampah lokal sebelum memilih teknologi (Timarpur, Reppie).', 'Measure local waste calorific value and moisture before choosing technology (Timarpur, Reppie).', 'timar'),
    dasarP('pengembang', 'ppa', 'Baca klausul take-or-pay, penalti pasokan, dan kepemilikan aset di PPA, bukan hanya di Perpres.', 'Read take-or-pay, supply penalty and asset ownership clauses in the PPA, not only the Perpres.', 'ashurst'),
    dasarP('pengembang', 'operasi', 'Siapkan rencana abu dan gas buang sebelum konstruksi (Singapura mengirim abu ke Semakau).', 'Prepare an ash and flue gas plan before construction (Singapore ships ash to Semakau).', 'sgnea'),
    dasarP('investor', 'dana', 'Uji sensitivitas terhadap kegagalan pasokan sampah dan perubahan kompensasi PLN.', 'Stress-test against waste supply failure and changes in PLN compensation.', 'ashurst'),
    dasarP('pemda', 'lokasi', 'Pastikan pemilahan dan jaminan 1.000 ton per hari sebelum mengajukan kota.', 'Secure sorting and a 1,000 tonnes a day guarantee before applying as a city.', 'ashurst'),
    dasarP('pemda', 'operasi', 'Tetapkan siapa yang membayar layanan sampah bila tipping fee dihapus.', 'Define who pays for waste service if the tipping fee is removed.', 'ombud'),
    dasarP('pusat', 'ppa', 'Terbitkan aturan turunan kompensasi PLN dan definisi take-or-pay.', 'Issue implementing rules for PLN compensation and the take-or-pay definition.', 'ashurst'),
    dasarP('pusat', 'izin', 'Jelaskan kriteria kota masuk dan keluar program secara terbuka.', 'Explain city entry and exit criteria for the programme openly.', 'tgr'),
    dasarP('pln', 'ppa', 'Tandatangani PPA dalam 10 hari kerja dan publikasikan biaya kompensasi yang dibutuhkan.', 'Sign the PPA within 10 working days and publish the compensation cost needed.', 'ashurst'),
    dasarP('pln', 'operasi', 'Catat realisasi listrik per ton dari Benowo dan Putri Cempo sebagai acuan.', 'Record actual electricity per tonne from Benowo and Putri Cempo as a benchmark.', 'wekdm'),
    dasarP('meti', 'operasi', 'Pantau groundbreaking Bali dan Bekasi terhadap target 2027 dan 2028, dan beri hak jawab pada pihak yang disebut.', 'Track Bali and Bekasi groundbreaking against 2027 and 2028 targets, and give named parties a right of reply.', 'bekasi'),
  ] };
  return {
    id: ID, versi: 1, diperbarui: TGL,
    judul: T('Sampah jadi energi', 'Waste to energy'),
    lead: T('PSEL atau PLTSa: layanan sampah kota yang menghasilkan listrik; dua dari 15 proyek lama beroperasi, dan Perpres 109/2025 mengubah aturan mainnya.', 'PSEL or PLTSa: a city waste service that makes power; two of 15 old projects operate, and Perpres 109/2025 changes the rules.'),
    kunci,
    penting: P(
      ['Hanya Benowo (9 MW) dan Putri Cempo (5 MW) yang beroperasi dari 15 proyek di 12 kota.', 'Only Benowo (9 MW) and Putri Cempo (5 MW) operate out of 15 projects in 12 cities.'],
      ['Perpres 109/2025 menetapkan harga USD 0,20 per kWh tetap 30 tahun dan mengganti tipping fee daerah dengan kompensasi negara ke PLN.', 'Perpres 109/2025 fixes USD 0.20 per kWh for 30 years and replaces local tipping fees with state compensation to PLN.'],
      ['Pelajaran global: teknologi harus cocok dengan sampah basah lokal dan listrik hanyalah hasil sampingan layanan sampah.', 'Global lesson: technology must match local wet waste and electricity is only a by-product of waste service.'],
    ),
    posisi: T('Indonesia baru memiliki 14 MW PSEL beroperasi, jauh di bawah Jepang dengan sekitar 1.200 fasilitas insinerasi.', 'Indonesia has only 14 MW of operating PSEL, far below Japan with about 1,200 incineration facilities.'),
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
    fs.writeFileSync(path.join(akar, 'public/data/topik/sampah_energi.json'), JSON.stringify(d, null, 1) + '\n');
    console.log(`bab naskah ${Object.keys(d.bab).length}/41 (+bab 1); mercusuar ${d.bab['39'].butir.length}; gagal ${d.bab['40'].butir.length}; sumber ${Object.keys(d.sumber).length}`);
  }
}
