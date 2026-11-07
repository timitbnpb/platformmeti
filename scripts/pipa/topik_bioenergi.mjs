// Naskah topik Bioenergi (kerangka 42 bab) mengikuti docs/perencanaan/TOPIK-SKEMA.md.
// Menyusun public/data/topik/bioenergi.json dari data repo (dihitung, bukan diketik) + sumber publik bertanggal.
// Pakai: node scripts/pipa/topik_bioenergi.mjs [--selftest]
// Aturan: tiap klaim bersumber (kunci peta sumber); analisis sendiri berlabel "Analisis METI (Hipotesis)"; bab tanpa data dikosongkan; kasus yang menyebut pihak wajib hak jawab.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validasi } from './topik_surya.mjs';
import { perdalam } from './topik_bioenergi_dalam.mjs';
export { validasi };
const akar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ID = 'bioenergi';
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
  cof24: S('PLN akui realisasi pemanfaatan biomassa masih di bawah target (target 2024 2,83 juta ton menurut Permen ESDM 12/2023, realisasi 1,62 juta ton; 2025 sekitar 2,2 juta ton; cangkang sawit sekitar Rp1,7 juta per ton)', 'Republika', 'https://ekonomi.republika.co.id/berita/t8wbqq416/pln-akui-realisasi-pemanfaatan-biomassa-masih-di-bawah-target', '2026-01-15', 'media'),
  cof25: S('PLN EPI targetkan pasokan biomassa co-firing naik pada 2027 (pasokan 2025 sekitar 2,35 juta ton)', 'Kontan', 'https://industri.kontan.co.id/news/pln-epi-targetkan-pasokan-biomassa-co-firing-naik-jadi-407-juta-ton-pada-2027', TGL, 'media'),
  cof48: S('Gebrakan PLN EPI bangun ekosistem biomassa dari hulu ke hilir (48 dari 52 lokasi PLTU terealisasi hingga kuartal II 2025)', 'Listrik Indonesia', 'https://listrikindonesia.com/detail/17676/gebrakan-pln-epi-bangun-ekosistem-biomassa-dari-hulu-ke-hilir', '2025-08-01', 'media'),
  cof26: S('PLN EPI targetkan pasok 3,65 juta ton biomassa ke 52 PLTU di 2026 (realisasi sekitar 1,4 juta ton hingga 26 Agustus 2026)', 'RCTI Plus / Okezone', 'https://www.rctiplus.com/news/detail/okezone/5466770/pln-epi-targetkan-pasok-3-65-juta-ton-biomassa-ke-52-pltu-di-2026', '2026-08-26', 'media'),
  cof10: S('PLN EPI bidik pemanfaatan biomassa 10 juta ton per tahun', 'Antara', 'https://www.antaranews.com/berita/5838399/pln-epi-bidik-pemanfaatan-biomassa-10-juta-ton-per-tahun', '2026-11-07', 'media'),
  cofjob: S('PLN EPI targetkan 10 juta ton biomassa per tahun, buka peluang 150 ribu lapangan kerja hijau', 'Ruang Energi', 'https://www.ruangenergi.com/pln-epi-targetkan-10-juta-ton-biomassa-per-tahun-buka-peluang-150-ribu-lapangan-kerja-hijau/', '2026-11-07', 'media'),
  cofneed: S('Targetkan co-firing 52 PLTU, PLN butuh 10,2 juta ton biomassa di 2025', 'Listrik Indonesia', 'https://listrikindonesia.com/detail/15551/targetkan-co-firing-52-pltu-pln-butuh-102-juta-ton-biomassa-di-2025', '2025-01-01', 'media'),
  mglabel: S('Mempertanyakan label transisi energi untuk PLTU co-firing', 'Mongabay Indonesia', 'https://mongabay.co.id/2024/02/03/merpetanyakan-label-transisi-energi-untuk-pltu-co-firing-2/', '2024-02-03', 'media'),
  mgpac: S('Ambisi tanaman energi untuk co-firing PLTU Pacitan (perkiraan Trend Asia: 10,23 juta ton biomassa untuk 10 persen co-firing di 107 PLTU memerlukan sekitar 2,3 juta hektare tanaman energi)', 'Mongabay Indonesia', 'https://mongabay.co.id/2024/04/15/ambisi-tanaman-energi-untuk-co-firing-pltu-pacitan/', '2024-04-15', 'media'),
  mgjawa: S('Ironi transisi bioenergi di Pulau Jawa (penelitian Trend Asia, JPIK, PPLH Mangkubumi tentang tanaman energi di wilayah Perhutani)', 'Mongabay Indonesia', 'https://mongabay.co.id/2025/05/06/ironi-transisi-bioenergi-di-pulau-jawa/', '2025-05-06', 'media'),
  mg22: S('Menyoal co-firing biomassa di PLTU (pemerintah dan PLN: murah, cepat, memakai PLTU yang ada)', 'Mongabay Indonesia', 'https://mongabay.co.id/2022/02/17/menyoal-co-firing-biomassa-di-pltu/', '2022-02-17', 'media'),
  epn: S('Co-firing with biomass in Indonesia: debunking emission reduction claims', 'Environmental Paper Network', 'https://environmentalpaper.org/2023/11/co-firing-with-biomass-in-indonesia-debunking-emission-reduction-claims/', '2023-11-01', 'kajian'),
  kata22: S('LSM soroti co-firing batu bara, khawatirkan potensi deforestasi', 'Katadata', 'https://katadata.co.id/amp/ameidyonasution/berita/630ce277823bf/lsm-soroti-co-firing-batu-bara-khawatirkan-potensi-deforestasi', '2022-08-01', 'media'),
  bd26: S('Alokasi biodiesel 2026 ditetapkan: 15.646.372 KL (PSO 7.454.600 KL, non-PSO 8.191.772 KL); ancaman ekspansi lahan', 'Kontan', 'https://industri.kontan.co.id/news/alokasi-biodiesel-2026-ditetapkan-ancaman-ekspansi-lahan-mengintai', '2026-01-01', 'media'),
  bdpet: S('Indonesia sets 2026 biodiesel allocation at 15.65 million kiloliters (konsumsi domestik 2025 sekitar 14,2 juta KL menurut data ESDM)', 'Petromindo', 'https://www.petromindo.com/news/article/indonesia-sets-2026-biodiesel-allocation-at-15-65-million-kiloliters', '2026-01-01', 'media'),
  bdhemat: S('Bahlil tetapkan kuota biodiesel 15,65 juta KL pada 2026, hemat devisa Rp139 triliun (klaim pemerintah)', 'Katadata', 'https://katadata.co.id/amp/finansial/bursa/694b4b1aadde7/bahlil-tetapkan-kuota-biodiesel-15-65-juta-kl-pada-2026-hemat-devisa-rp-139-t/', '2025-12-23', 'media'),
  b50: S('Indonesia delays B50 biodiesel mandate, maintains B40 and raises palm oil export levy (pungutan ekspor CPO 10 menjadi 12,5 persen mulai Maret 2026)', 'Petromindo', 'https://www.petromindo.com/news/article/indonesia-delays-b50-biodiesel-mandate-maintains-b40-and-raises-palm-oil-export-levy', '2026-01-01', 'media'),
  b50s: S('Indonesia keeps 2026 biodiesel quota flat, raising doubts over B50 target', 'S&P Global', 'https://www.spglobal.com/energy/en/news-research/latest-news/agriculture/122325-indonesia-keeps-2026-biodiesel-quota-flat-raising-doubts-over-b50-target', '2025-12-23', 'media'),
  e10: S('Mandatori E10 mulai 2027, Bahlil: butuh etanol 1,4 juta kiloliter', 'Bisnis.com', 'https://ekonomi.bisnis.com/read/20251024/44/1923128/mandatori-e10-mulai-2027-bahlil-butuh-etanol-14-juta-kiloliter', '2025-10-24', 'media'),
  e10gap: S('Indonesia\'s E10 plan stirs high-RON gasoline demand but ethanol supply gap looms', 'S&P Global', 'https://www.spglobal.com/energy/en/news-research/latest-news/agriculture/102925-indonesias-e10-plan-stirs-high-ron-gasoline-demand-but-ethanol-supply-gap-looms', '2025-10-29', 'media'),
  e20: S('Bahlil: pemerintah fokus terapkan E10 hingga 2027, E20 menunggu kesiapan industri etanol (28 Jul 2026)', 'Bisnis.com', 'https://kabar24.bisnis.com/read/20260728/15/1991787/bahlil-pemerintah-fokus-terapkan-e10-hingga-2027-e20-menunggu-kesiapan-industri-etanol', '2026-07-28', 'media'),
  pg95: S('Pertamina prepares for mandatory ethanol blended gasoline policy (Pertamax Green 95 E5 diluncurkan Juli 2023)', 'Antara', 'https://en.antaranews.com/news/430941/pertamina-prepares-for-mandatory-ethanol-blended-gasoline-policy', '2025-10-01', 'media'),
  pltbg1: S('Daur ulang limbah sawit, PKS Tandun hasilkan 1,5 MW listrik', 'Listrik Indonesia', 'https://listrikindonesia.com/detail/17487/daur-ulang-limbah-sawit-pks-tandun-hasilkan-15-mw-listrik', '2025-08-01', 'media'),
  pltbg2: S('PLTBg Sei Mangkei 2,4 MW olah limbah POME jadi energi hijau', 'Good News from Indonesia', 'https://www.goodnewsfromindonesia.id/2025/12/30/pltbg-sei-mangkei-24-mw-olah-limbah-pome-jadi-energi-hijau', '2025-12-30', 'media'),
  pomeits: S('Bukan sekadar limbah, POME kini jadi senjata baru transisi energi nasional (teknologi membran biogas, ITS)', 'Medcom', 'https://www.medcom.id/ekonomi/bisnis/nbw50mEK-bukan-sekadar-limbah-pome-kini-jadi-senjata-baru-transisi-energi-nasional', TGL, 'media'),
  pomeundip: S('Kajian potensi dan pemanfaatan POME sebagai sumber listrik (jurnal Undip: sebagian besar pabrik masih memakai kolam terbuka; potensi kasar 1 MW per pabrik 30 ton TBS per jam)', 'Universitas Diponegoro', 'https://ejournal2.undip.ac.id/index.php/jwl/article/download/12471/pdf', TGL, 'kajian'),
  brwiki: S('Ethanol fuel in Brazil (ringkasan Wikipedia: Pro-Alcool 1975; E25 sejak 2007, E27 sementara 2015; 94 persen mobil baru fleks-bahan bakar 2013; 26,72 miliar liter pada 2017; 41 pabrik tutup)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Ethanol_fuel_in_Brazil', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  drax: S('Drax Power Station (ringkasan Wikipedia: 4 x 660 MW, 3 unit dikonversi 2016 dan keempat 2018, biaya konversi sekitar GBP 700 juta, program Panorama Okt 2022)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Drax_Power_Station', TGL, 'via-pihak-ketiga', 'CC BY-SA 4.0'),
  ofgem: S('Ofgem Decision: investigation into Drax Power Limited (29 Agu 2024; GBP 25 juta ke dana ganti rugi; 9.279.992 ROC bernilai sekitar GBP 548 juta pada 2023/24)', 'Ofgem', 'https://www.ofgem.gov.uk/publications/ofgem-decision-investigation-drax-power-limited', '2024-08-29', 'resmi'),
};

export function susun() {
  const d0 = dasarJson();
  const kp = tren('bioenergi');
  const k25 = kp.at(-1), k00 = kp[0], k24 = kp.find((x) => x.tahun === 2024);
  const idn = baca('public/data/asean_energi.json').baris.find((x) => x.iso3 === 'IDN');
  const ru = baca('public/data/ruptl.json').ringkasan;
  const bab = {};
  const rf = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
  // contoh co-firing 5 persen kalor pada PLTU 600 MW (asumsi hipotesis)
  const MW = 600, CF = 0.8, EFF = 0.36, SHARE = 0.05, KALOR = 17;
  const gwhE = MW * 8760 * CF / 1000, tj = gwhE / EFF * 3.6, ton = tj * SHARE * 1000 / KALOR;
  const dsl = rf(15.646372 / 0.4, 1), b50 = rf(dsl * 0.5, 1);

  const kunci = [
    { label: T('Kapasitas bioenergi terpasang Indonesia (2025)', 'Indonesia installed bioenergy capacity (2025)'), nilai: k25.kapasitas_mw, d: 0, satuan: T('MW', 'MW'), sumber: 'kap', est: false },
    { label: T('Porsi bioenergi dalam listrik Indonesia (2024)', 'Bioenergy share of Indonesia electricity (2024)'), nilai: idn.bauran_listrik_persen.bioenergi.nilai, d: 2, satuan: T('persen', 'percent'), sumber: 'owid', est: false },
    { label: T('Alokasi biodiesel 2026', 'Biodiesel allocation 2026'), nilai: 15.65, d: 2, satuan: T('juta kiloliter', 'million kilolitres'), sumber: 'bd26', est: false },
    { label: T('Biomassa untuk co-firing 52 PLTU (2025)', 'Biomass for co-firing at 52 PLTU (2025)'), nilai: 2.35, d: 2, satuan: T('juta ton', 'million tonnes'), sumber: 'cof25', est: false },
    { label: T('Etanol dibutuhkan untuk E10 (target 2027)', 'Ethanol needed for E10 (2027 target)'), nilai: 1.4, d: 1, satuan: T('juta kiloliter per tahun', 'million kilolitres per year'), sumber: 'e10', est: false },
  ];

  bab['2'] = { tipe: 'faq', sumber: sm('ed', 'kap', 'owid', 'cof24', 'bd26', 'e10'), butir: FQ([
    ['Apa saja yang termasuk bioenergi?', 'What counts as bioenergy?', 'Biomassa padat (cangkang, serpih kayu, pelet), biogas dari limbah cair sawit (POME) dan kotoran, serta bahan bakar nabati cair: biodiesel dan bioetanol. Sampah jadi energi dibahas di topik terpisah.', 'Solid biomass (shells, wood chips, pellets), biogas from palm oil mill effluent (POME) and manure, and liquid biofuels: biodiesel and bioethanol. Waste-to-energy has its own topic.'],
    ['Berapa kapasitas bioenergi Indonesia?', 'How much bioenergy capacity does Indonesia have?', `${k25.kapasitas_mw} MW pada ${k25.tahun} menurut IRENA, naik dari ${k00.kapasitas_mw} MW pada ${k00.tahun}; pembangkitan ${k24.pembangkitan_gwh} GWh pada 2024.`, `${k25.kapasitas_mw} MW in ${k25.tahun} per IRENA, up from ${k00.kapasitas_mw} MW in ${k00.tahun}; generation ${k24.pembangkitan_gwh} GWh in 2024.`],
    ['Apa itu co-firing?', 'What is co-firing?', 'Mencampur biomassa (cangkang sawit, serbuk kayu, pelet) dengan batubara di PLTU yang sudah ada. PLN menargetkan 52 PLTU; realisasi 2025 sekitar 2,2 sampai 2,35 juta ton, di bawah target 3 juta ton.', 'Blending biomass (palm shells, sawdust, pellets) with coal in existing coal plants. PLN targets 52 plants; 2025 actual was about 2.2 to 2.35 million tonnes, below the 3 million tonne target.'],
    ['Apa beda B35, B40, dan B50?', 'What is the difference between B35, B40 and B50?', 'Angka menunjukkan persen biodiesel sawit (FAME) dalam solar. Alokasi 2026 adalah 15,65 juta kiloliter pada B40; B50 ditunda dan statusnya berubah antar laporan.', 'The number is the percent palm biodiesel (FAME) in diesel. The 2026 allocation is 15.65 million kilolitres at B40; B50 was delayed and its status changed between reports.'],
    ['Apakah ada bensin campur etanol?', 'Is there ethanol-blended gasoline?', 'Pertamax Green 95 (E5) diluncurkan Juli 2023; pemerintah menargetkan mandatori E10 mulai 2027 dengan kebutuhan etanol sekitar 1,4 juta kiloliter per tahun.', 'Pertamax Green 95 (E5) launched in July 2023; government targets an E10 mandate from 2027 needing about 1.4 million kilolitres of ethanol a year.'],
    ['Apakah biogas sawit bisa jadi listrik?', 'Can palm biogas become electricity?', 'Bisa; contoh PLTBg PKS Tandun 1,5 MW dan Sei Mangkei 2,4 MW. Potensi nasional besar tetapi data kapasitas terpasang nasional belum ditemukan di sumber terbuka.', 'Yes; examples are the PKS Tandun 1.5 MW and Sei Mangkei 2.4 MW biogas plants. National potential is large but national installed capacity was not found in open sources.'],
    ['Apakah biomassa netral karbon?', 'Is biomass carbon neutral?', 'Diperdebatkan. Pemerintah dan PLN menyebutnya murah dan cepat; Trend Asia dan lembaga lain menilai klaim netral karbon tidak terbukti bila bahan baku berasal dari tanaman energi yang menggantikan hutan. Lihat bab 29.', 'Disputed. Government and PLN call it cheap and fast; Trend Asia and others say the carbon-neutral claim is unproven when feedstock comes from energy crops replacing forest. See chapter 29.'],
    ['Berapa proyek bioenergi di basis METI?', 'How many bioenergy projects are in the METI base?', `${ru.per_teknologi.bioenergi} proyek bioenergi bernama dalam RUPTL 2025-2034 (${ru.mw_per_teknologi.bioenergi} MW); lihat bab 8 untuk sebaran.`, `${ru.per_teknologi.bioenergi} named bioenergy projects in the 2025-2034 RUPTL (${ru.mw_per_teknologi.bioenergi} MW); see chapter 8 for distribution.`],
  ]) };
  bab['3'] = { tipe: 'glosarium', sumber: sm('ed'), butir: G([
    ['Biomassa', 'Bahan organik padat (cangkang sawit, kayu, sekam) sebagai bahan bakar.', 'Solid organic material (palm shells, wood, husk) used as fuel.'], ['Co-firing', 'Pembakaran campuran biomassa dan batubara di PLTU.', 'Burning a biomass and coal blend in a coal plant.'],
    ['POME', 'Palm oil mill effluent, limbah cair pabrik sawit yang menghasilkan metana.', 'Palm oil mill effluent, liquid mill waste that releases methane.'], ['PLTBg / PLTBm', 'Pembangkit listrik tenaga biogas / biomassa.', 'Biogas / biomass power plant.'],
    ['FAME', 'Fatty acid methyl ester, biodiesel dari minyak sawit.', 'Fatty acid methyl ester, biodiesel from palm oil.'], ['B40 / B50', 'Campuran 40 atau 50 persen biodiesel dalam solar.', 'A blend of 40 or 50 percent biodiesel in diesel.'],
    ['Bioetanol / E10', 'Etanol dari tebu, singkong, atau jagung; E10 berarti 10 persen etanol dalam bensin.', 'Ethanol from cane, cassava or corn; E10 means 10 percent ethanol in gasoline.'], ['BPDPKS', 'Badan Pengelola Dana Perkebunan Kelapa Sawit yang menutup selisih harga biodiesel.', 'Palm Oil Plantation Fund Agency that covers the biodiesel price gap.'],
    ['HTE', 'Hutan tanaman energi untuk memasok biomassa.', 'Energy plantation forest supplying biomass.'], ['PSO', 'Public service obligation, biodiesel bersubsidi.', 'Public service obligation, subsidised biodiesel.'],
    ['ISPO', 'Indonesian Sustainable Palm Oil, sertifikasi sawit berkelanjutan.', 'Indonesian Sustainable Palm Oil certification.'], ['Cangkang sawit (PKS)', 'Cangkang inti sawit, biomassa utama co-firing.', 'Palm kernel shell, the main co-firing biomass.'],
    ['Pelet kayu', 'Biomassa kayu dipadatkan untuk pembakaran.', 'Compressed wood biomass for burning.'], ['ROC / CfD', 'Skema subsidi Inggris: Renewables Obligation Certificate dan Contract for Difference.', 'UK subsidy schemes: Renewables Obligation Certificate and Contract for Difference.'],
    ['Molases', 'Hasil samping gula yang menjadi bahan baku etanol utama.', 'Sugar by-product that is the main ethanol feedstock.'],
  ]) };
  bab['4'] = { tipe: 'teks', sumber: sm('kap', 'owid', 'bd26', 'cof24'), paragraf: P(
    [`Bioenergi menyumbang ${idn.bauran_listrik_persen.bioenergi.nilai} persen listrik Indonesia 2024 dan kapasitasnya ${k25.kapasitas_mw} MW menurut IRENA, terbesar kedua setelah hidro di antara sumber terbarukan nonpanas bumi.`, `Bioenergy supplied ${idn.bauran_listrik_persen.bioenergi.nilai} percent of Indonesian electricity in 2024 and has ${k25.kapasitas_mw} MW per IRENA, the second largest renewable after hydro outside geothermal.`],
    ['Perannya lebih besar di luar listrik: biodiesel sawit menggantikan sebagian solar (alokasi 15,65 juta kiloliter pada 2026) dan pemerintah mengklaim penghematan devisa Rp139 triliun.', 'Its role is bigger outside power: palm biodiesel replaces part of diesel (15.65 million kilolitre allocation in 2026) and government claims forex savings of IDR 139 trillion.'],
    ['Bioenergi unik karena rantai pasoknya adalah pertanian dan kehutanan: keberhasilannya ditentukan oleh bahan baku, harga, dan lahan, bukan hanya mesin.', 'Bioenergy is unique because its supply chain is agriculture and forestry: success depends on feedstock, price and land, not only machines.'],
  ) };
  bab['5'] = { tipe: 'rumus', sumber: sm('ed', 'cof24', 'bd26'), rumus: P(
    ['Biomassa co-firing (ton) = energi panas PLTU (GJ) x porsi biomassa / nilai kalor (GJ per ton)', 'Co-firing biomass (t) = plant heat input (GJ) x biomass share / calorific value (GJ per t)'],
    ['Basis solar (kiloliter) = alokasi biodiesel / porsi campuran (misalnya 0,4 untuk B40)', 'Diesel base (kL) = biodiesel allocation / blend share (for example 0.4 for B40)'],
  ), contoh: [
    T(`PLTU contoh ${MW} MW, faktor kapasitas ${CF * 100} persen, efisiensi ${EFF * 100} persen menghasilkan ${rf(gwhE, 0)} GWh dan kalor masuk ${rf(tj, 0)} TJ. Co-firing ${SHARE * 100} persen kalor dengan cangkang 17 GJ per ton butuh sekitar ${rf(ton / 1000, 0)} ribu ton per tahun (EST, asumsi nilai kalor 17 GJ per ton adalah hipotesis).`, `Example ${MW} MW plant, ${CF * 100} percent capacity factor, ${EFF * 100} percent efficiency gives ${rf(gwhE, 0)} GWh and ${rf(tj, 0)} TJ heat input. Co-firing ${SHARE * 100} percent of heat with 17 GJ per tonne shells needs about ${rf(ton / 1000, 0)} thousand tonnes a year (EST, 17 GJ per tonne calorific value is a hypothesis).`),
    T(`Alokasi B40 15,65 juta kiloliter berarti basis solar sekitar ${dsl} juta kiloliter; pada B50 kebutuhan biodiesel menjadi sekitar ${b50} juta kiloliter, dekat angka 20,1 juta yang dikutip pemberitaan (EST, hitung sendiri).`, `A B40 allocation of 15.65 million kilolitres implies a diesel base of about ${dsl} million kilolitres; at B50 biodiesel need becomes about ${b50} million kilolitres, near the 20.1 million cited by news (EST, own calculation).`),
  ] };
  bab['6'] = { tipe: 'langkah', sumber: sm('ed', 'cof48', 'bd26', 'cofjob'), butir: [
    { judul: T('Pasokan bahan baku', 'Feedstock supply'), isi: T('Limbah pabrik sawit, serpih kayu, pelet dari hutan tanaman, dan koperasi desa; PLN EPI mengorganisasi pasokan untuk co-firing.', 'Mill residues, wood chips, plantation pellets and village cooperatives; PLN EPI organises supply for co-firing.'), pelaku: T('Petani, koperasi, pemasok, PLN EPI', 'Farmers, cooperatives, suppliers, PLN EPI') },
    { judul: T('Pengolahan dan logistik', 'Processing and logistics'), isi: T('Pengeringan, pencacahan, pelet, dan pengiriman ke PLTU atau kilang biodiesel.', 'Drying, chipping, pelletising and delivery to coal plants or biodiesel refineries.'), pelaku: T('Pemasok, pelabuhan', 'Suppliers, ports') },
    { judul: T('Konversi energi', 'Energy conversion'), isi: T('Boiler PLTU dengan biomassa, mesin gas biogas, kilang FAME, atau pabrik etanol.', 'Coal boiler with biomass, biogas gensets, FAME refineries or ethanol plants.'), pelaku: T('PLN, IPP, badan usaha BBN', 'PLN, IPPs, biofuel businesses') },
    { judul: T('Pencampuran dan distribusi BBN', 'Biofuel blending and distribution'), isi: T('Pertamina mencampur biodiesel ke solar dan etanol ke bensin sesuai alokasi menteri.', 'Pertamina blends biodiesel into diesel and ethanol into gasoline per ministerial allocation.'), pelaku: T('Pertamina, ESDM', 'Pertamina, Energy Ministry') },
    { judul: T('Pendanaan selisih harga', 'Price-gap financing'), isi: T('Dana BPDPKS menutup selisih biodiesel PSO dan harga solar; dana dipungut dari ekspor sawit.', 'The BPDPKS fund covers the gap between PSO biodiesel and diesel, collected from palm exports.'), pelaku: T('BPDPKS', 'BPDPKS') },
    { judul: T('Verifikasi keberlanjutan', 'Sustainability verification'), isi: T('Sertifikasi ISPO untuk usaha bioenergi sawit (Permen ESDM 3/2026).', 'ISPO certification for palm bioenergy businesses (Energy Ministry Reg. 3/2026).'), pelaku: T('Pelaku usaha, auditor', 'Businesses, auditors') },
  ] };
  bab['7'] = { tipe: 'grafik', jenis: 'kolom', sumber: sm('kap'), label: T('Kapasitas bioenergi terpasang Indonesia', 'Indonesia installed bioenergy capacity'), satuan: 'MW', d: 0, seri: [{ nama: T('Kapasitas (MW)', 'Capacity (MW)'), sorot: true, titik: kp.filter((x) => x.tahun >= 2010).map((x) => [String(x.tahun), x.kapasitas_mw]) }] };
  bab['8'] = { tipe: 'tabel', per: 10, sumber: sm('proyek'), catatan: T('Proyek bioenergi bernama di basis METI (RUPTL dan sumber lain), bukan semua pembangkit biomassa dan biogas kecil di pabrik.', 'Named bioenergy projects in the METI base (RUPTL and others), not every small mill biomass and biogas plant.'), kolom: KOL_PROV, baris: dataProv(['bioenergi']) };
  bab['11'] = { tipe: 'teks', sumber: sm('bd26', 'bdpet', 'cof26', 'e10'), paragraf: P(
    ['Pasar bioenergi didominasi biodiesel: alokasi 2026 sebesar 15.646.372 kiloliter (PSO 7.454.600 dan non-PSO 8.191.772), hampir sama dengan kuota B40 2025. Konsumsi domestik 2025 sekitar 14,2 juta kiloliter menurut data ESDM yang dikutip Petromindo.', 'The bioenergy market is dominated by biodiesel: the 2026 allocation is 15,646,372 kilolitres (PSO 7,454,600 and non-PSO 8,191,772), nearly equal to the 2025 B40 quota. 2025 domestic consumption was about 14.2 million kilolitres per ESDM data cited by Petromindo.'],
    ['Pasar kedua adalah biomassa untuk PLN: 52 PLTU dengan target 3,65 juta ton pada 2026 dan realisasi sekitar 1,4 juta ton hingga 26 Agustus 2026. Pasar etanol baru berupa Pertamax Green 95 dan akan membesar bila E10 2027 berjalan.', 'The second market is biomass for PLN: 52 coal plants with a 3.65 million tonne target in 2026 and about 1.4 million tonnes by 26 August 2026. The ethanol market is so far Pertamax Green 95 and will grow if E10 starts in 2027.'],
  ) };
  const R = (id, dok, a, b) => regRow(d0, id, dok, a, b);
  bab['12'] = { tipe: 'tabel', per: 8, sumber: sm('regul', 'perpres112'), kolom: [{ k: 'dok', l: T('Peraturan', 'Regulation'), url: 'u' }, { k: 'ttg', l: T('Tentang', 'About') }, { k: 'st', l: T('Status', 'Status') }], baris: [
    R('permen-esdm-12-2023', 'Permen ESDM 12/2023', 'Pemanfaatan bahan bakar biomassa sebagai campuran di PLTU (co-firing)', 'Using biomass as a blend fuel in coal plants (co-firing)'),
    R('permen-esdm-24-2021', 'Permen ESDM 24/2021', 'Penyediaan dan pemanfaatan biodiesel dengan pembiayaan BPDPKS', 'Supply and use of biodiesel financed by BPDPKS'),
    R('perpres-40-2023', 'Perpres 40/2023', 'Percepatan swasembada gula nasional dan penyediaan bioetanol sebagai bahan bakar nabati', 'Accelerating sugar self-sufficiency and bioethanol supply as biofuel'),
    R('keppres-15-2024', 'Keppres 15/2024', 'Satgas percepatan swasembada gula dan bioetanol di Merauke', 'Task force for sugar and bioethanol self-sufficiency in Merauke'),
    R('permen-esdm-3-2026', 'Permen ESDM 3/2026', 'Sertifikasi sawit berkelanjutan Indonesia untuk usaha bioenergi sawit', 'Indonesian sustainable palm certification for palm bioenergy businesses'),
    R('permen-esdm-21-2016', 'Permen ESDM 21/2016', 'Pembelian listrik dari PLT biomassa dan biogas oleh PLN (dicabut)', 'PLN purchase of biomass and biogas power (revoked)'),
    { dok: 'Perpres 112/2022', ttg: T('Harga patokan dan pembelian listrik energi terbarukan oleh PLN', 'Benchmark prices and PLN purchase of renewable power'), st: 'berlaku', u: SUMBER.perpres112.url },
  ] };
  bab['13'] = { tipe: 'linimasa', sumber: sm('pg95', 'ofgem', 'bd26', 'e10', 'b50', 'regul'), butir: [
    { tanggal: '2023-07-01', judul: T('Pertamax Green 95 (E5) diluncurkan (bulan saja)', 'Pertamax Green 95 (E5) launched (month only)'), url: SUMBER.pg95.url },
    { tanggal: '2023-01-01', judul: T('Permen ESDM 12/2023 tentang co-firing biomassa (tahun saja)', 'Energy Ministry Reg. 12/2023 on biomass co-firing (year only)'), url: SUMBER.regul.url },
    { tanggal: '2024-08-29', judul: T('Ofgem menutup penyelidikan Drax dengan pembayaran GBP 25 juta', 'Ofgem closes Drax investigation with a GBP 25 million payment'), url: SUMBER.ofgem.url },
    { tanggal: '2025-10-21', judul: T('Bahlil menargetkan mandatori E10 mulai 2027', 'Bahlil targets an E10 mandate from 2027'), url: SUMBER.e10.url },
    { tanggal: '2026-01-01', judul: T('B50 dilaporkan ditunda, B40 dipertahankan (bulan saja)', 'B50 reported delayed, B40 maintained (month only)'), url: SUMBER.b50.url },
    { tanggal: '2026-03-01', judul: T('Pungutan ekspor CPO naik dari 10 menjadi 12,5 persen (bulan saja)', 'CPO export levy rises from 10 to 12.5 percent (month only)'), url: SUMBER.b50.url },
    { tanggal: '2027-01-01', judul: T('Target awal mandatori E10 (tahun saja, dijadwalkan)', 'Target start of E10 mandate (year only, scheduled)'), url: SUMBER.e10.url },
  ] };
  bab['14'] = { tipe: 'teks', sumber: sm('cof24', 'bd26', 'e10', 'regul'), paragraf: P(
    ['Kewajiban utama: PLTU wajib co-firing menurut Permen ESDM 12/2023 (target 2024 sebesar 2,83 juta ton, realisasi 1,62 juta ton), badan usaha BBN wajib memasok sesuai alokasi menteri, dan pelaku sawit bioenergi wajib bersertifikat ISPO menurut Permen ESDM 3/2026.', 'Main obligations: coal plants must co-fire under Energy Ministry Reg. 12/2023 (2024 target 2.83 million tonnes, actual 1.62 million), biofuel businesses must supply per ministerial allocation, and palm bioenergy businesses must hold ISPO under Reg. 3/2026.'],
    ['Insentif utama bukan pajak tetapi dana: BPDPKS menutup selisih harga biodiesel PSO dan pemerintah memberi alokasi yang menjamin pasar. Sanksi kegagalan memasok tidak ditemukan di sumber yang dibaca.', 'The main incentive is funding rather than tax: BPDPKS covers the price gap for PSO biodiesel and government allocations guarantee the market. Penalties for supply failure were not found in the sources read.'],
  ) };
  bab['15'] = { tipe: 'langkah', sumber: sm('ed', 'regul'), catatan: T('Ringkasan alur umum; durasi dan biaya belum bersumber sehingga sengaja tidak dicantumkan.', 'General flow summary; durations and costs are not sourced and are deliberately omitted.'), butir: [
    { judul: T('Kontrak bahan baku', 'Feedstock contract'), isi: T('Pastikan pasokan limbah atau biomassa tertulis dengan harga dan kualitas (kadar air, nilai kalor).', 'Secure written feedstock supply with price and quality (moisture, calorific value).'), pelaku: T('Pengembang, pemasok', 'Developer, supplier') },
    { judul: T('Perizinan berusaha dan lingkungan', 'Business and environmental permits'), isi: T('Izin usaha penyediaan tenaga listrik atau badan usaha BBN, dan persetujuan lingkungan.', 'Power supply business licence or biofuel business licence, and environmental approval.'), pelaku: T('Pengembang, ESDM, KLH', 'Developer, Energy Ministry, Environment Ministry') },
    { judul: T('Sertifikasi keberlanjutan', 'Sustainability certification'), isi: T('ISPO untuk bioenergi sawit.', 'ISPO for palm bioenergy.'), pelaku: T('Pelaku usaha, lembaga sertifikasi', 'Businesses, certification bodies') },
    { judul: T('PJBL atau alokasi BBN', 'PPA or biofuel allocation'), isi: T('Listrik dibeli PLN; BBN lewat alokasi menteri dan Pertamina.', 'Power sold to PLN; biofuel through ministerial allocation and Pertamina.'), pelaku: T('PLN, ESDM, Pertamina', 'PLN, Energy Ministry, Pertamina') },
    { judul: T('Konstruksi dan operasi', 'Construction and operation'), isi: T('Pembangunan, uji, SLO, lalu operasi dengan pemantauan kualitas bahan baku.', 'Construction, testing, SLO, then operation with feedstock quality monitoring.'), pelaku: T('Pengembang', 'Developer') },
  ] };
  bab['16'] = { tipe: 'teks', sumber: sm('ruuebet', 'e20'), paragraf: P(
    ['RUU EBET berada pada tahap pembahasan menurut arsip METI per 8 September 2026. Tahap belum dicek ke situs DPR karena situs itu melarang perayap.', 'The RUU EBET bill is in deliberation per the METI archive as of 8 September 2026. The stage has not been checked against the DPR site, which blocks crawlers.'],
    ['Untuk bioenergi, hal yang layak diajukan lewat forum Konsultasi: kriteria keberlanjutan bahan baku, tata niaga biomassa, dan jalur E20 setelah E10.', 'For bioenergy, points worth submitting through the Consultation forum: feedstock sustainability criteria, biomass trade rules and the E20 path after E10.'],
  ) };
  bab['17'] = { tipe: 'teks', sumber: sm('pomeits', 'brwiki', 'e20'), paragraf: P(
    ['Biogas sawit kini diarahkan ke pemurnian: kajian ITS tentang teknologi membran mengubah biogas POME menjadi biometana yang bisa disalurkan atau dipakai sebagai bahan bakar.', 'Palm biogas is moving toward upgrading: ITS work on membrane technology turns POME biogas into biomethane that can be piped or used as fuel.'],
    ['Pada bahan bakar cair, Brasil menunjukkan jalur mesin fleks-bahan bakar (94 persen mobil baru pada 2013); Indonesia memilih tahapan E5 ke E10 dan E20 hanya setelah industri etanol siap (Bisnis, 28 Juli 2026).', 'For liquid fuels, Brazil shows the flex-fuel engine path (94 percent of new cars in 2013); Indonesia chose stages E5 to E10 with E20 only once the ethanol industry is ready (Bisnis, 28 July 2026).'],
  ) };
  const bw = lcoeSeri('bioenergi');
  bab['19'] = { tipe: 'grafik', jenis: 'garis', sumber: sm('lcoe'), label: T('LCOE bioenergi rata-rata global (sen USD 2025 per kWh)', 'Global average bioenergy LCOE (US cents 2025 per kWh)'), satuan: 'sen/kWh', d: 2, seri: [{ nama: T('Bioenergi, dunia', 'Bioenergy, world'), sorot: true, titik: bw.map((x) => [String(x.tahun), x.sen_usd_kwh]) }], catatan: T('Biaya bioenergi ditentukan harga bahan baku, bukan kurva belajar teknologi; tidak ada tren turun jelas.', 'Bioenergy cost is set by feedstock price, not a technology learning curve; there is no clear downward trend.') };
  const as = aseanTab('bioenergi');
  bab['20'] = { tipe: 'tabel', per: 10, sumber: sm('owid'), catatan: T('Porsi bioenergi dalam pembangkitan listrik 2024 (Ember via Our World in Data).', 'Bioenergy share of 2024 electricity generation (Ember via Our World in Data).'), kolom: KOL_ASEAN('Porsi bioenergi (persen)', 'Bioenergy share (percent)'), baris: as };
  bab['21'] = { tipe: 'teks', sumber: sm('brwiki', 'drax', 'ofgem', 'owid'), paragraf: P(
    ['Brasil memulai Pro-Alcool pada 1975, mewajibkan E25 sejak 2007, dan mencapai 94 persen mobil baru fleks-bahan bakar pada 2013; produksi etanol 26,72 miliar liter pada 2017. Inggris mengonversi PLTU Drax (4 x 660 MW) ke biomassa pada 2016 dan 2018 dengan biaya konversi sekitar GBP 700 juta dan subsidi ROC dan CfD.', 'Brazil began Pro-Alcool in 1975, mandated E25 from 2007 and reached 94 percent flex-fuel new cars in 2013; ethanol output was 26.72 billion litres in 2017. The UK converted Drax (4 x 660 MW) to biomass in 2016 and 2018 at about GBP 700 million with ROC and CfD subsidy.'],
    [HIP + 'dua negara itu sukses pada skala karena kebijakan jangka panjang dan pasar yang dijamin, tetapi keduanya juga menunjukkan retaknya: pasokan etanol Brasil terganggu 2010 sampai 2012 dan Drax didenda atas tata kelola data bahan baku. Indonesia, dengan sawit sebagai bahan baku utama, menghadapi pertanyaan lahan yang lebih besar.', HIPE + 'both countries succeeded at scale thanks to long-term policy and guaranteed markets, but both also show cracks: Brazilian ethanol supply faltered 2010 to 2012 and Drax was fined over feedstock data governance. Indonesia, with palm as the main feedstock, faces a bigger land question.'],
  ) };
  const li = as.find((x) => x.n === 'Indonesia');
  bab['22'] = { tipe: 'teks', sumber: sm('owid'), paragraf: P(
    [`Porsi bioenergi Indonesia ${idn.bauran_listrik_persen.bioenergi.nilai} persen berada di peringkat ${as.indexOf(li) + 1} dari ${as.length} negara ASEAN dalam tabel, di atas Thailand (5,41) dan Singapura (2,76), dan jauh di atas Vietnam (0,33).`, `Indonesia's bioenergy share of ${idn.bauran_listrik_persen.bioenergi.nilai} percent ranks ${as.indexOf(li) + 1} of ${as.length} ASEAN countries in the table, above Thailand (5.41) and Singapore (2.76), and far above Vietnam (0.33).`],
    ['Dalam bahan bakar cair Indonesia termasuk pelopor mandatori biodiesel tinggi (B40), tetapi data pembanding antarnegara belum dimuat di bab ini.', 'In liquid fuels Indonesia is a pioneer of high biodiesel mandates (B40), but cross-country comparison data is not carried in this chapter.'],
  ) };
  bab['23'] = { tipe: 'teks', sumber: sm('b50', 'ofgem', 'ed'), paragraf: P(
    ['Kerja sama internasional bioenergi lebih bersifat dagang dan regulasi daripada pendanaan: kebijakan biodiesel mempengaruhi ekspor sawit dan pungutan ekspor naik dari 10 ke 12,5 persen mulai Maret 2026.', 'International cooperation in bioenergy is more trade and regulation than funding: biodiesel policy affects palm exports and the export levy rises from 10 to 12.5 percent from March 2026.'],
    ['Kajian sertifikasi dan kriteria keberlanjutan negara pembeli (misalnya Uni Eropa) belum bersumber di bab ini dan perlu ditambah.', 'Certification and buyer-country sustainability criteria (for example the EU) are not sourced in this chapter and need to be added.'],
  ) };
  const pr1 = pendRows((x) => (x.sektor || []).includes('bioenergi'), 14);
  bab['24'] = { tipe: 'tabel', per: 8, sumber: sm('pendanaan'), catatan: T('Skema dan proyek pendana yang menyebut bioenergi di basis METI; nilai untuk seluruh program.', 'Schemes and funder projects naming bioenergy in the METI base; values are for whole programmes.'), kolom: PEND_KOL, baris: pr1 };
  bab['25'] = { tipe: 'rumus', sumber: sm('cof24', 'ed'), rumus: P(
    ['Biaya bahan bakar biomassa per GJ = harga per ton / nilai kalor (GJ per ton)', 'Biomass fuel cost per GJ = price per tonne / calorific value (GJ per tonne)'],
    ['Biaya listrik biomassa (per kWh) ~ biaya bahan bakar per GJ x 3,6 / efisiensi / 1000', 'Biomass electricity cost (per kWh) ~ fuel cost per GJ x 3.6 / efficiency / 1000'],
  ), contoh: [
    T(`Cangkang sawit sekitar Rp1,7 juta per ton (Republika, 2026) dengan nilai kalor asumsi 17 GJ per ton berarti sekitar Rp${rf(1700000 / 17 / 1000, 0)} ribu per GJ, atau bahan bakar sekitar Rp${rf(1700000 / 17 * 3.6 / 0.36 / 1000, 0)} per kWh listrik pada efisiensi 36 persen (EST, nilai kalor adalah hipotesis).`, `Palm kernel shell at about IDR 1.7 million per tonne (Republika, 2026) with an assumed 17 GJ per tonne is about IDR ${rf(1700000 / 17 / 1000, 0)} thousand per GJ, or fuel cost of about IDR ${rf(1700000 / 17 * 3.6 / 0.36 / 1000, 0)} per kWh at 36 percent efficiency (EST, calorific value is a hypothesis).`),
    T('Republika mencatat harga cangkang lebih tinggi daripada batubara yang harganya dibatasi kebijakan; selisih inilah yang membuat realisasi co-firing di bawah target.', 'Republika notes shell prices exceed policy-capped coal prices; this gap is why co-firing lags its target.'),
  ] };
  bab['26'] = { tipe: 'tabel', per: 8, sumber: sm('cofjob', 'cof10', 'bdhemat', 'drax', 'e10gap'), catatan: T('Angka dari pernyataan perusahaan, pemerintah, dan pemberitaan; bukan audit.', 'Figures from company, government and press statements; not audited.'), kolom: [{ k: 'p', l: T('Hal', 'Item') }, { k: 'n', l: T('Nilai', 'Value') }, { k: 'k', l: T('Keterangan', 'Note') }], baris: [
    { p: T('Klaim hemat devisa kuota biodiesel 2026', 'Claimed forex saving of 2026 biodiesel quota'), n: T('Rp139 triliun', 'IDR 139 trillion'), k: T('Klaim pemerintah (Katadata)', 'Government claim (Katadata)') },
    { p: T('Ambisi pasokan biomassa PLN EPI', 'PLN EPI biomass supply ambition'), n: T('10 juta ton per tahun', '10 million tonnes a year'), k: T('Disertai klaim 150 ribu lapangan kerja hijau', 'With a claim of 150,000 green jobs') },
    { p: T('Konversi Drax ke biomassa', 'Drax biomass conversion'), n: T('Sekitar GBP 700 juta', 'About GBP 700 million'), k: T('Dibiayai saham dan kredit; subsidi ROC dan CfD', 'Funded by equity and credit; ROC and CfD subsidy') },
    { p: T('Kesenjangan pasokan etanol Indonesia', 'Indonesian ethanol supply gap'), n: T('Kebutuhan E10 sekitar 1,4 juta kL', 'E10 need about 1.4 million kL'), k: T('Jauh di atas kapasitas saat ini menurut S&P', 'Far above current capacity per S&P') },
  ] };
  bab['27'] = { tipe: 'teks', sumber: sm('mgpac', 'mgjawa', 'bd26', 'pomeundip', 'epn'), paragraf: P(
    ['Risiko lingkungan utama adalah lahan: Trend Asia memperkirakan 10 persen co-firing di 107 PLTU membutuhkan sekitar 10,23 juta ton biomassa dan sekitar 2,3 juta hektare tanaman energi; kajian Environmental Paper Network membantah klaim pengurangan emisi co-firing. Angka luas ini adalah perkiraan pihak kritik dan metodologinya perlu diperiksa.', 'The main environmental risk is land: Trend Asia estimates 10 percent co-firing at 107 plants needs about 10.23 million tonnes of biomass and about 2.3 million hectares of energy plantation; an Environmental Paper Network study disputes co-firing emission-reduction claims. The area figure is a critic estimate and its method needs checking.'],
    ['Sosial: penelitian di Jawa menyebut tanaman energi di wilayah Perhutani merugikan petani; untuk biodiesel, Kontan mengingatkan ancaman ekspansi lahan sawit bila B50 berjalan.', 'Social: research in Java says energy plantations in Perhutani areas hurt farmers; for biodiesel, Kontan warns of palm land expansion if B50 proceeds.'],
    ['Peluang lingkungan: menangkap metana POME mengurangi emisi dari kolam terbuka, yang disebut sebagian besar pabrik masih pakai menurut kajian Undip.', 'Environmental upside: capturing POME methane reduces emissions from open ponds, which a Undip study says most mills still use.'],
  ) };
  bab['28'] = { tipe: 'teks', sumber: sm('cofjob', 'cof48'), paragraf: P(
    ['PLN EPI mengklaim ekosistem biomassa 10 juta ton per tahun dapat membuka sekitar 150 ribu lapangan kerja hijau dan melibatkan koperasi desa. Klaim ini dari perusahaan dan belum diverifikasi independen.', 'PLN EPI claims a 10 million tonne a year biomass ecosystem could open about 150,000 green jobs and involve village cooperatives. This is a company claim and not independently verified.'],
    ['Keterampilan yang dibutuhkan: operator boiler dan penanganan biomassa, teknisi biogas, auditor keberlanjutan, dan pengelola logistik pedesaan.', 'Skills needed: boiler and biomass handling operators, biogas technicians, sustainability auditors and rural logistics managers.'],
  ) };
  bab['29'] = { tipe: 'teks', sumber: sm('mg22', 'mglabel', 'bd26', 'b50', 'ofgem'), paragraf: P(
    ['Co-firing: KESDM dan PLN menyebutnya murah, cepat, dan memakai PLTU yang ada; Trend Asia menyebutnya solusi palsu yang memperpanjang umur PLTU dan menolak label transisi energi.', 'Co-firing: KESDM and PLN call it cheap, fast and using existing plants; Trend Asia calls it a false solution that extends coal plant life and rejects the energy transition label.'],
    ['Biodiesel: pemerintah mengklaim penghematan devisa Rp139 triliun dan keamanan energi; pengamat mengingatkan ekspansi lahan sawit dan beban dana BPDPKS serta pungutan ekspor 12,5 persen.', 'Biodiesel: government claims IDR 139 trillion forex saving and energy security; observers warn of palm land expansion and the burden on the BPDPKS fund and a 12.5 percent export levy.'],
    ['Drax (Inggris): Ofgem tidak menemukan bukti biomassa tidak berkelanjutan tetapi menemukan kontrol data yang tidak memadai; Drax menyatakan tidak ada pelanggaran yang disengaja dan Ofgem menyebut pelanggaran bersifat teknis.', 'Drax (UK): Ofgem found no evidence the biomass was unsustainable but found inadequate data controls; Drax says nothing was deliberate and Ofgem described a technical breach.'],
  ) };
  bab['30'] = { tipe: 'tabel', per: 8, sumber: sm('ruptl', 'cof26', 'e10', 'b50s'), catatan: T('Target adalah rencana dan sering bergeser; lihat bab 40 untuk realisasi.', 'Targets are plans and often slip; see chapter 40 for actual results.'), kolom: [{ k: 'd', l: T('Rencana', 'Plan') }, { k: 'v', l: T('Nilai', 'Value'), num: true, d: 2 }, { k: 'sat', l: T('Satuan', 'Unit') }], baris: [
    { d: T('RUPTL 2025-2034, bioenergi bernama', 'RUPTL 2025-2034, named bioenergy'), v: ru.mw_per_teknologi.bioenergi, sat: 'MW' },
    { d: T('Biomassa PLN EPI untuk 52 PLTU, target 2026', 'PLN EPI biomass for 52 plants, 2026 target'), v: 3.65, sat: T('juta ton', 'million tonnes') },
    { d: T('Etanol untuk E10, target mulai 2027', 'Ethanol for E10, target start 2027'), v: 1.4, sat: T('juta kL per tahun', 'million kL per year') },
    { d: T('Biodiesel alokasi 2026 (kuota B40 tetap)', 'Biodiesel allocation 2026 (flat B40 quota)'), v: 15.65, sat: T('juta kL', 'million kL') },
  ] };
  bab['31'] = { tipe: 'teks', sumber: sm('ed', 'cof24', 'e10gap'), paragraf: P(
    [HIP + 'Pengembang: nilai terbesar ada pada bahan baku yang bersertifikat dan terkontrak, bukan pada mesin. Investor: risiko harga dan kebijakan alokasi lebih besar daripada risiko teknologi. Pemda: koperasi pasokan biomassa desa perlu kontrak jangka panjang. Akademisi: hitung siklus karbon penuh agar klaim netral karbon dapat diuji.', HIPE + 'Developers: most value lies in certified, contracted feedstock rather than machines. Investors: price and allocation policy risk exceeds technology risk. Local government: village biomass supply cooperatives need long-term contracts. Academics: compute the full carbon cycle so carbon-neutral claims can be tested.'],
  ) };
  bab['32'] = { tipe: 'teks', sumber: sm('b50', 'e20', 'cof26', 'ruuebet'), paragraf: P(
    ['Yang perlu dipantau: (1) keputusan B50 dan alokasi biodiesel semester II 2026; (2) kesiapan pasokan etanol untuk E10 2027; (3) realisasi biomassa PLN EPI terhadap target 3,65 juta ton; (4) pembahasan RUU EBET; (5) harga cangkang sawit dibanding batubara.', 'To watch: (1) the B50 decision and second-half 2026 biodiesel allocation; (2) ethanol supply readiness for E10 2027; (3) PLN EPI biomass against the 3.65 million tonne target; (4) RUU EBET deliberation; (5) palm shell versus coal price.'],
  ) };
  bab['38'] = { tipe: 'teks', sumber: sm('ed'), paragraf: P(
    ['Metode: kapasitas dari IRENA, porsi listrik dari Ember via Our World in Data, proyek dari RUPTL dan basis METI, angka biodiesel, biomassa, dan etanol dari berita yang ditautkan. Banyak angka berasal dari pernyataan perusahaan atau pemerintah dan bertingkat bukti media. Sintesis berlabel Analisis METI (Hipotesis). Batas: status B50 dan realisasi 2026 berubah cepat; jumlah pabrik sawit dan kapasitas PLTBg nasional tidak ditemukan dalam sumber terbuka yang dibaca.', 'Method: capacity from IRENA, electricity share from Ember via Our World in Data, projects from the RUPTL and the METI base, biodiesel, biomass and ethanol figures from linked news. Many figures are company or government statements with media evidence level. Synthesis is labelled METI analysis (Hypothesis). Limits: B50 status and 2026 actuals change fast; the number of palm mills and national biogas capacity were not found in the open sources read.'],
  ) };

  const cs = kasus;
  bab['39'] = { tipe: 'kasus', sumber: sm('bd26', 'pltbg1', 'brwiki', 'drax'), catatan: T('Biaya dan faktor kapasitas yang tidak ditemukan di sumber sengaja dikosongkan. Keberhasilan di sini bersifat relatif dan disertai catatan kritik pada bab 29 dan 40.', 'Costs and capacity factors not found in sources are deliberately blank. Success here is relative and accompanied by critique in chapters 29 and 40.'), butir: [
    cs({ id: 'b40', nama: 'Program biodiesel B35 ke B40', jenis: 'berhasil', lokasi: T('Nasional', 'National'),
      profil: [{ label: T('Alokasi 2026', '2026 allocation'), nilai: 15.65, satuan: T('juta kL', 'million kL') }, { label: T('Pelaksana', 'Implementers'), nilai: T('ESDM, Pertamina, badan usaha BBN, BPDPKS', 'Energy Ministry, Pertamina, biofuel businesses, BPDPKS') }],
      tindakan: P(['Mandatori bertahap dengan alokasi menteri per badan usaha dan pendanaan selisih harga dari pungutan ekspor sawit.', 'Staged mandate with ministerial allocation per business and price-gap funding from palm export levies.']),
      sebab: P(['Pasar dijamin lewat kewajiban dan alokasi, sehingga volume stabil (15,6 juta kL pada 2025 dan 2026).', 'The market is guaranteed through mandate and allocation, so volume is stable (15.6 million kL in 2025 and 2026).'], ['Pendanaan selisih harga mandiri dari sektor sawit, bukan APBN langsung.', 'Price-gap funding from the palm sector itself, not directly from the state budget.']),
      angka: [{ label: T('Alokasi 2026', '2026 allocation'), nilai: 15.646372, d: 2, satuan: T('juta kL', 'million kL'), sumber: 'bd26', est: false }, { label: T('Klaim hemat devisa', 'Claimed forex saving'), nilai: 139, d: 0, satuan: T('triliun rupiah', 'trillion rupiah'), sumber: 'bdhemat', est: false }],
      pelajaran: P(['Mandat dengan pendanaan mandiri dan alokasi jelas menciptakan pasar pasti; beban ada pada dana sawit dan lahan.', 'A mandate with self-funding and clear allocation creates a firm market; the burden falls on palm funds and land.']),
      terdampak: T('Pekebun sawit, konsumen solar, dan pengelola dana BPDPKS; kritik lahan pada bab 29.', 'Palm growers, diesel consumers and BPDPKS fund managers; land critique in chapter 29.'),
      faktor: { ppa_tarif: true, pendanaan: true, kepastian_kebijakan: true }, sumber: ['bd26', 'bdpet', 'bdhemat'], hak_jawab: true }),
    cs({ id: 'pltbg', nama: 'PLTBg limbah sawit: PKS Tandun dan Sei Mangkei', jenis: 'berhasil', lokasi: T('Riau dan Sumatera Utara', 'Riau and North Sumatra'),
      profil: [{ label: T('PKS Tandun', 'PKS Tandun'), nilai: 1.5, satuan: 'MW' }, { label: T('Sei Mangkei', 'Sei Mangkei'), nilai: 2.4, satuan: 'MW' }, { label: T('Pemilik', 'Owner'), nilai: T('Anak usaha PTPN dan pengelola kawasan', 'PTPN subsidiary and zone operator') }],
      tindakan: P(['Menangkap metana dari POME untuk menghasilkan listrik di lokasi pabrik atau kawasan industri.', 'Capturing POME methane to generate power at the mill or industrial zone.']),
      sebab: P(['Bahan baku (limbah cair) tersedia gratis di lokasi pembangkit sehingga tidak ada risiko logistik.', 'Feedstock (effluent) is available free on site so there is no logistics risk.']),
      angka: [{ label: T('PKS Tandun', 'PKS Tandun'), nilai: 1.5, d: 1, satuan: 'MW', sumber: 'pltbg1', est: false }, { label: T('Sei Mangkei', 'Sei Mangkei'), nilai: 2.4, d: 1, satuan: 'MW', sumber: 'pltbg2', est: false }],
      pelajaran: P(['Skala kecil di lokasi limbah itu layak; penyebarannya terhambat bukan oleh teknologi tetapi oleh pembelian listrik dan modal pabrik swasta.', 'Small scale at the waste site is viable; spread is held back not by technology but by power purchase and private mill capital (METI hypothesis).']),
      faktor: { pengelola_om: true, jaringan: true }, sumber: ['pltbg1', 'pltbg2', 'pomeundip'], hak_jawab: true }),
    cs({ id: 'brasil', nama: 'Program etanol Brasil (Pro-Alcool)', jenis: 'berhasil', negara: 'BR', lokasi: T('Brasil', 'Brazil'),
      profil: [{ label: T('Mulai', 'Started'), nilai: '1975' }, { label: T('Produksi 2017', '2017 output'), nilai: 26.72, satuan: T('miliar liter', 'billion litres') }],
      tindakan: P(['Program nasional 1975, kewajiban campuran E25 sejak 2007, dan mesin fleks-bahan bakar.', 'National programme from 1975, an E25 blend mandate since 2007 and flex-fuel engines.']),
      sebab: P(['Kebijakan puluhan tahun, tebu sebagai bahan baku skala besar, dan armada mobil fleks.', 'Decades of policy, sugarcane as a large-scale feedstock and a flex-fuel car fleet.']),
      angka: [{ label: T('Mobil baru fleks-bahan bakar (2013)', 'Flex-fuel new cars (2013)'), nilai: 94, d: 0, satuan: T('persen', 'percent'), sumber: 'brwiki', est: false }, { label: T('Produksi etanol 2017', 'Ethanol production 2017'), nilai: 26.72, d: 2, satuan: T('miliar liter', 'billion litres'), sumber: 'brwiki', est: false }],
      tanda_bahaya: P(['Pangsa etanol dalam bahan bakar transportasi turun dari 55 persen (2008) menjadi 35 persen (2012) saat pasokan terganggu.', 'Ethanol share of transport fuel fell from 55 percent (2008) to 35 percent (2012) when supply faltered.']),
      pelajaran: P(['Skala dibangun oleh kebijakan jangka panjang dan teknologi kendaraan, tetapi harga dan pasokan tetap rentan.', 'Scale is built by long-term policy and vehicle technology, but price and supply stay vulnerable.']),
      faktor: { kepastian_kebijakan: true, ppa_tarif: true }, sumber: ['brwiki'], hak_jawab: true }),
    cs({ id: 'draxkonversi', nama: 'Konversi PLTU Drax ke biomassa (Inggris)', jenis: 'berhasil', negara: 'GB', lokasi: T('Yorkshire, Inggris', 'Yorkshire, England'),
      profil: [{ label: T('Unit', 'Units'), nilai: T('4 x 660 MW', '4 x 660 MW') }, { label: T('Konversi', 'Conversion'), nilai: T('Tiga unit 2016, unit keempat 2018', 'Three units 2016, fourth unit 2018') }],
      tindakan: P(['Mengganti batubara dengan pelet kayu di boiler yang sudah ada dengan dukungan ROC dan kemudian CfD.', 'Replacing coal with wood pellets in existing boilers with ROC and later CfD support.']),
      sebab: P(['Memakai aset transmisi dan boiler yang ada serta subsidi per MWh jangka panjang.', 'Reuses existing transmission and boilers with long-term per-MWh subsidy.']),
      angka: [{ label: T('Biaya konversi sekitar', 'Conversion cost about'), nilai: 700, d: 0, satuan: T('juta GBP', 'million GBP'), sumber: 'drax', est: false }, { label: T('ROC diterbitkan 2023/24', 'ROCs issued 2023/24'), nilai: 9279992, d: 0, satuan: 'ROC', sumber: 'ofgem', est: false }],
      tanda_bahaya: P(['Tata kelola data bahan baku: Ofgem menemukan kontrol tidak memadai dan Drax membayar GBP 25 juta.', 'Feedstock data governance: Ofgem found inadequate controls and Drax paid GBP 25 million.']),
      pelajaran: P(['Konversi cepat dan murah secara modal, tetapi bergantung pada subsidi dan kepercayaan atas bahan baku; lihat bab 40 untuk sisi sengketa.', 'Conversion is fast and capital-light but depends on subsidy and trust in feedstock; see chapter 40 for the dispute side.']),
      faktor: { ppa_tarif: true, jaringan: true, pendanaan: true }, sumber: ['drax', 'ofgem'], hak_jawab: true }),
  ] };
  bab['40'] = { tipe: 'kasus', sumber: sm('cof24', 'b50', 'mgpac', 'ofgem', 'brwiki', 'pomeundip'), catatan: HAK, butir: [
    cs({ id: 'cofiring', nama: 'Co-firing biomassa di 52 PLTU', jenis: 'mundur', lokasi: T('PLTU PLN di berbagai provinsi', 'PLN coal plants in various provinces'),
      profil: [{ label: T('Cakupan target', 'Target coverage'), nilai: T('52 PLTU', '52 coal plants') }, { label: T('Pemasok', 'Supplier'), nilai: 'PLN EPI' }],
      kronologi: [{ tanggal: '2024-12-31', teks: T('Target 2,83 juta ton menurut Permen ESDM 12/2023; realisasi 1,62 juta ton.', 'Target 2.83 million tonnes under Reg. 12/2023; actual 1.62 million tonnes.') }, { tanggal: '2025-12-31', teks: T('Pasokan 2025 sekitar 2,2 sampai 2,35 juta ton dari target 3 juta ton.', '2025 supply about 2.2 to 2.35 million tonnes against a 3 million target.') }, { tanggal: '2026-08-26', teks: T('Realisasi sekitar 1,4 juta ton dari target 3,65 juta ton setahun.', 'About 1.4 million tonnes against a 3.65 million tonne annual target.') }],
      sebab: P(['Pasokan masih dominan limbah dengan volume terbatas.', 'Supply is still dominated by waste with limited volume.'], ['Harga cangkang sekitar Rp1,7 juta per ton lebih mahal daripada batubara yang harganya dibatasi.', 'Shell price of about IDR 1.7 million per tonne exceeds policy-capped coal.']),
      terdampak: T('PLN dan target bauran EBT; petani dan koperasi pemasok yang bergantung kontrak; klaim pengurangan emisi dipersoalkan.', 'PLN and the renewables mix target; farmers and cooperatives depending on contracts; emission-reduction claims are disputed.'),
      seharusnya: T('Menetapkan harga bahan baku yang kompetitif atau skema kompensasi sebelum menaikkan target volume, dan mengaudit asal bahan baku.', 'Set a competitive feedstock price or compensation scheme before raising volume targets, and audit feedstock origin.'),
      tanda_bahaya: P(['Realisasi tahun-ke-tahun di bawah target.', 'Year after year actuals below target.'], ['Bahan baku bergantung pada limbah terbatas.', 'Feedstock depends on limited waste.']),
      angka: [{ label: T('Realisasi 2024', '2024 actual'), nilai: 1.62, d: 2, satuan: T('juta ton', 'million tonnes'), sumber: 'cof24', est: false }, { label: T('Target 2024', '2024 target'), nilai: 2.83, d: 2, satuan: T('juta ton', 'million tonnes'), sumber: 'cof24', est: false }],
      faktor: { ppa_tarif: true, kepastian_kebijakan: true, pengelola_om: true }, sumber: ['cof24', 'cof25', 'cof26', 'cof48'], hak_jawab: true }),
    cs({ id: 'b50', nama: 'B50: ditunda, dipertahankan di B40', jenis: 'mundur', lokasi: T('Nasional', 'National'),
      profil: [{ label: T('Basis', 'Base'), nilai: 'B40' }, { label: T('Dana', 'Funding'), nilai: T('BPDPKS dari pungutan ekspor', 'BPDPKS from export levy') }],
      kronologi: [{ tanggal: '2026-01-01', teks: T('Dilaporkan B50 ditunda, B40 dipertahankan dan pungutan ekspor naik (bulan saja).', 'B50 reported delayed, B40 maintained and export levy raised (month only).') }, { tanggal: '2026-03-01', teks: T('Pungutan ekspor CPO 12,5 persen berlaku (bulan saja).', 'The 12.5 percent CPO export levy takes effect (month only).') }],
      sebab: P(['Kuota 2026 hampir tidak berubah dari 2025 sehingga diragukan untuk mencapai B50 (S&P).', '2026 quota almost unchanged from 2025, raising doubt over reaching B50 (S&P).'], ['Beban dana dan risiko ekspansi lahan sawit.', 'Fund burden and palm land-expansion risk.']),
      terdampak: T('Pelaku biodiesel yang menyiapkan kapasitas; pekebun; konsumen solar. Status akhir B50 berubah-ubah antar laporan dan perlu dicek ke keputusan menteri.', 'Biodiesel businesses preparing capacity; growers; diesel consumers. The final B50 status varies between reports and must be checked against ministerial decisions.'),
      seharusnya: T('Mengumumkan jadwal bersyarat dengan syarat pasokan dan dana yang jelas agar investasi kapasitas tidak menganggur.', 'Announce a conditional schedule with clear supply and funding conditions so capacity investment does not sit idle.'),
      tanda_bahaya: P(['Jadwal diubah beberapa kali dalam setahun.', 'Schedule changed several times within a year.']),
      angka: [{ label: T('Kebutuhan B50 menurut hitung sendiri', 'B50 need by own calculation'), nilai: b50, d: 1, satuan: T('juta kL', 'million kL'), sumber: 'bd26', est: true }],
      faktor: { pendanaan: true, kepastian_kebijakan: true, lahan: true }, sumber: ['b50', 'b50s', 'bd26'], hak_jawab: true }),
    cs({ id: 'hte', nama: 'Tanaman energi untuk co-firing: konflik lahan', jenis: 'mundur', lokasi: T('Jawa Timur dan wilayah Perhutani', 'East Java and Perhutani areas'),
      profil: [{ label: T('Pihak kritik', 'Critics'), nilai: 'Trend Asia, JPIK, PPLH Mangkubumi' }, { label: T('Pihak pendukung', 'Supporters'), nilai: T('KESDM dan PLN', 'KESDM and PLN') }],
      kronologi: [{ tanggal: '2024-04-15', teks: T('Mongabay memuat perkiraan Trend Asia tentang luas tanaman energi untuk 10 persen co-firing.', 'Mongabay carries Trend Asia estimates of energy plantation area for 10 percent co-firing.') }, { tanggal: '2025-05-06', teks: T('Penelitian di Jawa menyebut tanaman energi di wilayah Perhutani merugikan petani.', 'Research in Java says energy plantations in Perhutani areas hurt farmers.') }],
      sebab: P(['Bahan baku kayu dari tanaman energi menggantikan penggunaan lahan petani atau hutan.', 'Wood feedstock from energy plantations displaces farmer or forest land use.']),
      terdampak: T('Petani penggarap di wilayah Perhutani. Tanggapan PLN dan KESDM yang dimuat Mongabay 2022 menyebut co-firing murah dan cepat; tanggapan atas temuan Jawa 2025 belum kami muat.', 'Tenant farmers in Perhutani areas. PLN and KESDM responses carried by Mongabay in 2022 call co-firing cheap and fast; responses to the 2025 Java findings are not yet carried.'),
      seharusnya: T('Pemetaan lahan dan persetujuan petani (FPIC) sebelum penetapan tanaman energi, serta batas bahwa bahan baku tidak berasal dari konversi hutan alam.', 'Land mapping and farmer consent (FPIC) before designating energy plantations, plus a rule that feedstock does not come from natural forest conversion.'),
      tanda_bahaya: P(['Kebutuhan bahan baku jauh di atas pasokan limbah.', 'Feedstock need far above waste supply.']),
      angka: [{ label: T('Perkiraan Trend Asia: luas tanaman energi (10 persen co-firing, 107 PLTU)', 'Trend Asia estimate: energy plantation area (10 percent co-firing, 107 plants)'), nilai: 2.3, d: 1, satuan: T('juta hektare', 'million hectares'), sumber: 'mgpac', est: false }],
      faktor: { lahan: true, sosial: true }, sumber: ['mgpac', 'mgjawa', 'mg22', 'mglabel'], hak_jawab: true }),
    cs({ id: 'pomegap', nama: 'Biogas POME: potensi besar, penangkapan kecil', jenis: 'mundur', lokasi: T('Sentra sawit', 'Palm belt'),
      profil: [{ label: T('Contoh beroperasi', 'Operating examples'), nilai: 'PKS Tandun 1,5 MW, Sei Mangkei 2,4 MW' }],
      kronologi: [{ tanggal: '2025-12-30', teks: T('Pemberitaan Sei Mangkei 2,4 MW sebagai contoh pertama kawasan industri hijau.', 'News on Sei Mangkei 2.4 MW as the first green industrial zone example.') }],
      sebab: P(['Kajian akademik menyebut sebagian besar pabrik masih memakai kolam terbuka yang melepas metana.', 'Academic work says most mills still use open ponds that release methane.'], ['Angka kapasitas terpasang nasional PLTBg tidak ditemukan di sumber terbuka sehingga kesenjangan ini sulit diukur.', 'No national PLTBg installed capacity figure was found in open sources so the gap is hard to measure.']),
      terdampak: T('Iklim (emisi metana), pabrik sawit, dan PLN sebagai calon pembeli. Karena data nasional tidak ditemukan, kasus ini adalah kesenjangan data, bukan proyek gagal tertentu.', 'The climate (methane emissions), palm mills and PLN as potential buyer. Because national data was not found, this case is a data gap, not a specific failed project.'),
      seharusnya: T('Membuka data pabrik, kapasitas penangkapan, dan tarif pembelian agar pengembang dapat menilai bisnis PLTBg.', 'Open mill, capture capacity and purchase tariff data so developers can assess PLTBg business cases.'),
      tanda_bahaya: P(['Potensi tersebut dikutip berulang tanpa data kapasitas terpasang.', 'Potential is quoted repeatedly without installed capacity data.']),
      angka: [{ label: T('Rasio kasar: 1 MW per pabrik 30 ton TBS per jam', 'Rough ratio: 1 MW per 30 tonnes FFB per hour mill'), nilai: 1, d: 0, satuan: 'MW', sumber: 'pomeundip', est: false }],
      faktor: { pendanaan: true, ppa_tarif: true }, sumber: ['pomeundip', 'pltbg2', 'pltbg1'], hak_jawab: true }),
    cs({ id: 'drax', nama: 'Drax: denda tata kelola data biomassa', jenis: 'gagal', negara: 'GB', lokasi: T('Inggris', 'England'),
      profil: [{ label: T('Regulator', 'Regulator'), nilai: 'Ofgem' }, { label: T('Pembayaran', 'Payment'), nilai: 25, satuan: T('juta GBP', 'million GBP') }],
      kronologi: [{ tanggal: '2023-05-31', teks: T('Ofgem membuka penyelidikan atas pelaporan data profil biomassa.', 'Ofgem opens an investigation into biomass profiling data reporting.') }, { tanggal: '2024-08-29', teks: T('Ofgem menutup kasus; Drax membayar GBP 25 juta ke dana ganti rugi sukarela.', 'Ofgem closes the case; Drax pays GBP 25 million to the voluntary redress fund.') }],
      sebab: P(['Kontrol dan tata kelola data bahan baku tidak memadai (periode April 2021 sampai Maret 2022).', 'Inadequate feedstock data governance and controls (April 2021 to March 2022).']),
      terdampak: T('Kepercayaan publik atas keberlanjutan biomassa dan pembayar subsidi. Ofgem tidak menemukan bukti biomassa di bawah ambang 70 persen berkelanjutan dan tidak menemukan ROC diterbitkan keliru; pelanggaran disebut teknis, bukan disengaja.', 'Public trust in biomass sustainability and subsidy payers. Ofgem found no evidence biomass fell below the 70 percent sustainable threshold nor that ROCs were wrongly issued; the breach was described as technical, not deliberate.'),
      seharusnya: T('Kontrol data bahan baku yang dapat diaudit sejak awal, bukan setelah tinjauan regulator.', 'Auditable feedstock data controls from the start, not after regulator review.'),
      tanda_bahaya: P(['Liputan investigatif media tentang asal kayu.', 'Investigative media coverage of wood origin.']),
      angka: [{ label: T('Pembayaran ke dana ganti rugi', 'Payment to redress fund'), nilai: 25, d: 0, satuan: T('juta GBP', 'million GBP'), sumber: 'ofgem', est: false }, { label: T('Nilai ROC 2023/24', 'ROC value 2023/24'), nilai: 548, d: 0, satuan: T('juta GBP', 'million GBP'), sumber: 'ofgem', est: false }],
      faktor: { kepastian_kebijakan: true, pengelola_om: true }, sumber: ['ofgem', 'drax'], hak_jawab: true }),
    cs({ id: 'brasil2010', nama: 'Brasil: krisis pasokan etanol 2010 sampai 2012', jenis: 'mundur', negara: 'BR', lokasi: T('Brasil', 'Brazil'),
      profil: [{ label: T('Pangsa etanol di bahan bakar transportasi', 'Ethanol share of transport fuel'), nilai: T('55 persen (2008) menjadi 35 persen (2012)', '55 percent (2008) to 35 percent (2012)') }],
      kronologi: [{ tanggal: '2010-01-01', teks: T('Kekurangan pasokan dan harga tinggi 2010 sampai 2011 (tahun saja).', 'Supply shortages and high prices 2010 to 2011 (year only).') }],
      sebab: P(['Hasil tebu turun dari 115 menjadi 69 ton per hektare (2008 ke 2012) dan 41 pabrik tutup.', 'Cane yield fell from 115 to 69 tonnes per hectare (2008 to 2012) and 41 plants closed.']),
      terdampak: T('Konsumen yang kembali ke bensin dan produsen etanol.', 'Consumers who returned to gasoline and ethanol producers.'),
      seharusnya: T('Insentif penanaman ulang tebu dan cadangan pasokan sebelum kewajiban campuran dinaikkan.', 'Cane replanting incentives and supply reserves before raising blend mandates.'),
      tanda_bahaya: P(['Harga etanol naik melebihi paritas dengan bensin.', 'Ethanol prices rise beyond parity with gasoline.']),
      angka: [{ label: T('Hasil tebu 2012', 'Cane yield 2012'), nilai: 69, d: 0, satuan: T('ton per hektare', 'tonnes per hectare'), sumber: 'brwiki', est: false }],
      faktor: { lahan: true, pendanaan: true }, sumber: ['brwiki'], hak_jawab: true }),
  ] };
  bab['41'] = { tipe: 'pola', sumber: sm('ed'), catatan: T('Sel dibangun dari bendera faktor tiap kasus; pemetaan faktor ke kasus adalah analisis METI (Hipotesis) atas fakta di bab 39 dan 40.', 'Cells are built from each case factor flags; mapping factors to cases is METI analysis (Hypothesis) on facts in chapters 39 and 40.'), faktor: FAKTOR_STD.map(([k, a, e]) => L(k, a, e)) };
  bab['42'] = { tipe: 'periksa', sumber: sm('ed'), peran: PERAN, tahap: TAHAP, butir: [
    dasarP('pengembang', 'lokasi', 'Kontrakkan bahan baku tertulis dengan kualitas (kadar air, nilai kalor) sebelum memilih lokasi pembangkit.', 'Contract feedstock in writing with quality (moisture, calorific value) before siting the plant.', 'cof24'),
    dasarP('pengembang', 'izin', 'Siapkan sertifikasi ISPO untuk bioenergi sawit (Permen ESDM 3/2026).', 'Prepare ISPO certification for palm bioenergy (Energy Ministry Reg. 3/2026).', 'regul'),
    dasarP('pengembang', 'ppa', 'Untuk PLTBg, pastikan tarif beli dan titik interkoneksi sebelum membangun (kasus kesenjangan POME).', 'For PLTBg, secure the purchase tariff and interconnection point before building (POME gap case).', 'pomeundip'),
    dasarP('pengembang', 'operasi', 'Bangun kontrol data asal bahan baku yang dapat diaudit (Drax).', 'Build auditable feedstock origin data controls (Drax).', 'ofgem'),
    dasarP('investor', 'dana', 'Uji sensitivitas terhadap harga bahan baku dan perubahan alokasi menteri.', 'Stress-test against feedstock price and changes in ministerial allocation.', 'b50'),
    dasarP('investor', 'ppa', 'Hindari bergantung pada target volume yang berulang tidak tercapai (co-firing).', 'Avoid relying on volume targets that are repeatedly missed (co-firing).', 'cof24'),
    dasarP('pemda', 'lokasi', 'Petakan lahan dan minta persetujuan petani sebelum menetapkan tanaman energi.', 'Map land and obtain farmer consent before designating energy plantations.', 'mgjawa'),
    dasarP('pemda', 'operasi', 'Dukung koperasi pasokan biomassa dengan kontrak jangka panjang.', 'Support biomass supply cooperatives with long-term contracts.', 'cofjob'),
    dasarP('pusat', 'ppa', 'Umumkan jadwal bersyarat untuk B50 dan E10 beserta syarat pasokan dan dana.', 'Announce conditional schedules for B50 and E10 with supply and funding conditions.', 'b50s'),
    dasarP('pusat', 'bangun', 'Terbitkan data pabrik sawit dan kapasitas penangkapan POME.', 'Publish palm mill and POME capture capacity data.', 'pomeundip'),
    dasarP('pln', 'ppa', 'Selaraskan harga biomassa dengan harga batubara agar target co-firing realistis.', 'Align biomass price with coal price so co-firing targets are realistic.', 'cof24'),
    dasarP('pln', 'operasi', 'Publikasikan asal dan sertifikasi biomassa per PLTU.', 'Publish origin and certification of biomass per plant.', 'mgpac'),
    dasarP('meti', 'operasi', 'Pantau realisasi target co-firing dan B50, serta beri hak jawab pada pihak yang disebut.', 'Monitor co-firing and B50 actuals and give named parties a right of reply.', 'cof26'),
  ] };
  perdalam(bab, SUMBER);
  return {
    id: ID, versi: 1, diperbarui: TGL,
    judul: T('Bioenergi', 'Bioenergy'),
    lead: T('Biomassa, biogas POME, co-firing PLN, biodiesel B40, dan bioetanol: terbarukan yang rantai pasoknya adalah pertanian dan kehutanan.', 'Biomass, POME biogas, PLN co-firing, B40 biodiesel and bioethanol: renewables whose supply chain is agriculture and forestry.'),
    kunci,
    penting: P(
      ['Biodiesel adalah pasar bioenergi terbesar (15,65 juta kiloliter pada 2026), jauh melampaui listrik bioenergi.', 'Biodiesel is the largest bioenergy market (15.65 million kilolitres in 2026), far beyond bioenergy power.'],
      ['Co-firing di 52 PLTU terus di bawah target (2024: 1,62 juta ton dari 2,83 juta) karena harga bahan baku dan pasokan limbah.', 'Co-firing at 52 plants keeps missing targets (2024: 1.62 million tonnes of 2.83 million) because of feedstock price and waste supply.'],
      ['Isu terbesar adalah lahan: tanaman energi dan ekspansi sawit untuk B50 menjadi sasaran kritik.', 'The biggest issue is land: energy plantations and palm expansion for B50 draw critique.'],
    ),
    posisi: T(`Porsi bioenergi ${idn.bauran_listrik_persen.bioenergi.nilai} persen listrik Indonesia berada di atas Thailand dan jauh di atas Vietnam, dan mandatori biodiesel B40 termasuk yang tertinggi di dunia.`, `Bioenergy's ${idn.bauran_listrik_persen.bioenergi.nilai} percent of Indonesian electricity is above Thailand and far above Vietnam, and the B40 biodiesel mandate is among the highest in the world.`),
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
    fs.writeFileSync(path.join(akar, 'public/data/topik/bioenergi.json'), JSON.stringify(d, null, 1) + '\n');
    console.log(`bab naskah ${Object.keys(d.bab).length}/41 (+bab 1); mercusuar ${d.bab['39'].butir.length}; gagal ${d.bab['40'].butir.length}; sumber ${Object.keys(d.sumber).length}`);
  }
}
