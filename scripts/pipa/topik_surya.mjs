// Topik Surya (42 bab A-K). Menyusun data/topik/surya.json dari data repo + sumber publik bertanggal.
// Pakai: node scripts/pipa/topik_surya.mjs [--selftest]
// Skema: TOPIK-SKEMA.md belum ada saat ditulis; bentuk di bawah sementara, mudah dipetakan ulang.
// Aturan: tiap klaim punya sumber (id -> SUMBER), bab tanpa sumber berstatus "kosong", tanpa em dash.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const akar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TGL = '2026-11-08';
const baca = (p) => JSON.parse(fs.readFileSync(path.join(akar, p), 'utf8'));

export const SUMBER = {
  'repo-irena-kap': { judul: 'IRENA, kapasitas terpasang surya Indonesia (diolah repo: public/data/kapasitas_tren.json)', penerbit: 'IRENA', url: 'https://www.irena.org/Data', tanggal: TGL, tingkat_bukti: 'resmi' },
  'repo-gsa': { judul: 'Global Solar Atlas 2.0, titik ibu kota provinsi (public/data/potensi_atlas.json)', penerbit: 'World Bank Group / ESMAP, Solargis', url: 'https://globalsolaratlas.info/', tanggal: TGL, tingkat_bukti: 'via-pihak-ketiga' },
  'repo-lcoe': { judul: 'IRENA LCOE dan harga modul via Our World in Data (public/data/biaya_listrik.json)', penerbit: 'IRENA via Our World in Data', url: 'https://ourworldindata.org/grapher/levelized-cost-of-energy', tanggal: TGL, tingkat_bukti: 'via-pihak-ketiga' },
  'repo-rantai': { judul: 'DJEBTKE ESDM, Daftar Pabrikan Modul Surya (public/data/rantai_plts.json)', penerbit: 'DJEBTKE ESDM', url: 'https://ebtke.esdm.go.id/', tanggal: '2026-11-07', tingkat_bukti: 'resmi' },
  'masdar-cirata': { judul: 'Masdar: President of Indonesia inaugurates floating solar plant (9 Nov 2023)', penerbit: 'Masdar', url: 'https://masdar.ae/en/news/newsroom/president-of-indonesia-inaugurates-floating-solar-plant', tanggal: TGL, tingkat_bukti: 'pemilik-proyek' },
  'cirata-kepemilikan': { judul: 'Pencarian berita: kepemilikan PLN NR 51% dan Masdar 49%, PPA Januari 2020, ekspansi 500 MWac (ringkasan hasil pencarian atas berita Indonesia)', penerbit: 'media Indonesia (Republika, Kompas, Antara, Warta Ekonomi)', url: 'https://www.antaranews.com/berita/5350241/masdar-uae-harap-ekspansi-plts-cirata-capai-kemajuan-konkret-tahun-ini', tanggal: TGL, tingkat_bukti: 'media' },
  'benban-wiki': { judul: 'Benban Solar Park (ringkasan Wikipedia; angka pembiayaan dari rujukannya)', penerbit: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Benban_Solar_Park', tanggal: TGL, tingkat_bukti: 'via-pihak-ketiga' },
  'aldhafra-pvtech': { judul: 'EDF, JinkoPower and partners close financing for 2GW solar project in Abu Dhabi', penerbit: 'PV Tech', url: 'https://www.pv-tech.org/edf-jinkopower-and-partners-close-financing-for-2gw-solar-project-in-abu-dhabi', tanggal: TGL, tingkat_bukti: 'media' },
  'aldhafra-masdar': { judul: 'Masdar, Al Dhafra Solar PV factsheet', penerbit: 'Masdar', url: 'https://masdar.ae/-/media/corporate-revamp/projects/downloads/al-dhafra-solar-pv/al-dhafra-factsheet-en.pdf', tanggal: TGL, tingkat_bukti: 'pemilik-proyek' },
  'bhadla-pvtech': { judul: 'Yet another India solar tariff record of 2.44 rupees in Rajasthan', penerbit: 'PV Tech', url: 'https://www.pv-tech.org/yet-another-india-solar-tariff-record-of-2-44-rupees-in-rajasthan/', tanggal: TGL, tingkat_bukti: 'media' },
  'bhadla-mercom': { judul: 'Mercom India, Bhadla Solar Park (tag)', penerbit: 'Mercom India', url: 'https://www.mercomindia.com/tag/bhadla-solar-park', tanggal: TGL, tingkat_bukti: 'media' },
  'vn-wiki': { judul: 'Solar power in Vietnam', penerbit: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Solar_power_in_Vietnam', tanggal: TGL, tingkat_bukti: 'via-pihak-ketiga' },
  'vn-vir-2025': { judul: 'FiTs now at risk through retroactive cuts', penerbit: 'Vietnam Investment Review', url: 'https://vir.com.vn/fits-now-at-risk-through-retroactive-cuts-131718.html', tanggal: TGL, tingkat_bukti: 'media' },
  'vn-allens': { judul: 'Allens, Renewables in Vietnam 2022', penerbit: 'Allens (firma hukum)', url: 'https://www.allens.com.au/globalassets/pdfs/insights/asia/allens-vietnam-renewables-in-vietnam-2022.pdf', tanggal: TGL, tingkat_bukti: 'analisis-profesional' },
  'es-wiki': { judul: 'Solar power in Spain', penerbit: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Solar_power_in_Spain', tanggal: TGL, tingkat_bukti: 'via-pihak-ketiga' },
  'es-pvmag-eiser': { judul: 'Spain loses its first renewable energy case in international courts', penerbit: 'pv magazine', url: 'https://www.pv-magazine.com/2017/05/05/spain-loses-its-first-renewable-energy-case-in-international-courts/', tanggal: TGL, tingkat_bukti: 'media' },
  'es-pvtech-nextera': { judul: 'Spain ordered to pay EUR290m-plus over subsidy u-turn (6 Jun 2019)', penerbit: 'PV Tech', url: 'https://www.pv-tech.org/spain-ordered-to-pay-290m-plus-over-subsidy-u-turn', tanggal: TGL, tingkat_bukti: 'media' },
  'detik-2016': { judul: 'Banyak PLTS Rusak, ESDM: SDM untuk Mengelola Kurang Siap (3 Feb 2016)', penerbit: 'detikFinance', url: 'https://finance.detik.com/energi/d-3134143/banyak-plts-rusak-esdm-sdm-untuk-mengelola-kurang-siap', tanggal: '2016-02-03', tingkat_bukti: 'media' },
  'mongabay-gajah': { judul: 'Padamnya Listrik Tenaga Surya di Gajah Makmur (3 Okt 2020)', penerbit: 'Mongabay Indonesia', url: 'https://mongabay.co.id/2020/10/03/padamnya-listrik-tenaga-surya-di-gajah-makmur/', tanggal: '2020-10-03', tingkat_bukti: 'media' },
  'katadata-kpk': { judul: 'KPK Wanti-wanti Program PLTS 100 GWp, Ingatkan Praktik Korupsi Proyek Serupa', penerbit: 'Katadata', url: 'https://katadata.co.id/ekonomi-hijau/investasi-hijau/6ae841b1b79c8/kpk-sorot-proyek-plts-100-gwp-ingatkan-praktik-korupsi-proyek-serupa', tanggal: '2026-11-02', tingkat_bukti: 'media' },
  'antara-towea': { judul: 'Warga di Towea Muna keluhkan sudah 5 tahun PLTS tidak berfungsi normal', penerbit: 'Antara Sultra', url: 'https://sultra.antaranews.com/berita/492426/warga-di-towea-muna-keluhkan-sudah-5-tahun-plts-tidak-berfungsi-normal', tanggal: TGL, tingkat_bukti: 'media' },
  'detik-karimun': { judul: 'Hampir Semua PLTS di Parang Karimunjawa Rusak Sejak 2019', penerbit: 'detikJateng', url: 'https://www.detik.com/jateng/berita/d-5979817/miris-hampir-semua-plts-di-parang-karimunjawa-rusak-sejak-2019', tanggal: TGL, tingkat_bukti: 'media' },
  'kompas-iesr-kopdes': { judul: 'Proyek PLTS untuk Koperasi Merah Putih, IESR ingatkan risiko mangkrak (3 Sep 2025)', penerbit: 'Kompas.com Lestari', url: 'https://lestari.kompas.com/read/2025/09/03/081400186/proyek-plts-untuk-koperasi-merah-putih-iesr-ingatkan-risiko-mangkrak', tanggal: '2025-09-03', tingkat_bukti: 'media' },
  'adb-sumba': { judul: 'ADB support for Sumba transformation to 100% renewable energy island', penerbit: 'Asian Development Bank', url: 'https://www.adb.org/news/adb-support-sumbas-transformation-100-renewable-energy-island', tanggal: TGL, tingkat_bukti: 'resmi' },
  'mongabay-sumba': { judul: 'Program Listrik Energi Terbarukan Sumba, Bagaimana Perkembangannya? (10 Nov 2017)', penerbit: 'Mongabay Indonesia', url: 'https://mongabay.co.id/2017/11/10/program-listrik-energi-terbarukan-sumba-bagaimana-perkembangannya/', tanggal: '2017-11-10', tingkat_bukti: 'media' },
};

const T = (id, en) => ({ id, en });
const K = (id, en, sumber, extra = {}) => ({ teks: T(id, en), sumber, ...extra });

// ---------- Data turunan repo (dihitung, bukan diketik) ----------
function dariRepo() {
  const kap = baca('public/data/kapasitas_tren.json').baris.filter((r) => r.taksonomi === 'surya').sort((a, b) => a.tahun - b.tahun);
  const pot = baca('public/data/potensi_atlas.json').baris.slice().sort((a, b) => a.pvout_kwh_per_kwp_tahun - b.pvout_kwh_per_kwp_tahun);
  const bl = baca('public/data/biaya_listrik.json');
  const modul = Object.fromEntries(bl.modul.map((m) => [m.tahun, m.usd_per_w]));
  const lc = (n, t) => bl.lcoe.find((x) => x.negara === n && x.teknologi === 'surya' && x.tahun === t)?.sen_usd_kwh;
  const rantai = baca('public/data/rantai_plts.json').ringkas;
  return { kap, pot, modul, lc, rantai };
}

export function susun() {
  const r = dariRepo();
  const k12 = r.kap.find((x) => x.tahun === 2012), k25 = r.kap.at(-1), k24 = r.kap.find((x) => x.tahun === 2024);
  const rendah = r.pot[0], tinggi = r.pot.at(-1);
  const kosong = (no, kel, jt, alasan) => ({ no, kelompok: kel, judul: jt, status: 'kosong', alasan: T(alasan, 'No sourced data collected yet; left empty rather than invented.'), klaim: [] });
  const bab = (no, kel, jt, klaim, ringkas) => ({ no, kelompok: kel, judul: jt, status: 'isi', ringkas, klaim });

  const babs = [];
  // A
  babs.push(bab(1, 'A', T('Ringkasan eksekutif', 'Executive summary'), [
    K(`Kapasitas surya terpasang Indonesia ${k25.kapasitas_mw} MW pada ${k25.tahun}, naik dari ${k12.kapasitas_mw} MW pada ${k12.tahun}.`, `Indonesia installed solar capacity was ${k25.kapasitas_mw} MW in ${k25.tahun}, up from ${k12.kapasitas_mw} MW in ${k12.tahun}.`, ['repo-irena-kap']),
    K(`Potensi PVOUT titik ibu kota provinsi berkisar ${rendah.pvout_kwh_per_kwp_tahun} (${rendah.provinsi}) sampai ${tinggi.pvout_kwh_per_kwp_tahun} (${tinggi.provinsi}) kWh/kWp per tahun.`, `Provincial-capital PVOUT ranges from ${rendah.pvout_kwh_per_kwp_tahun} (${rendah.provinsi}) to ${tinggi.pvout_kwh_per_kwp_tahun} (${tinggi.provinsi}) kWh/kWp per year.`, ['repo-gsa']),
    K(`Harga modul global turun dari ${r.modul[2010]} USD/W (2010) ke ${r.modul[2025]} USD/W (2025).`, `Global module price fell from ${r.modul[2010]} USD/W (2010) to ${r.modul[2025]} USD/W (2025).`, ['repo-lcoe']),
    K('PLTS Terapung Cirata 192 MWp (145 MWac) diresmikan 9 November 2023, PLTS apung terbesar di Asia Tenggara menurut pemiliknya.', 'Cirata Floating Solar 192 MWp (145 MWac) was inaugurated on 9 November 2023, the largest in Southeast Asia per its owner.', ['masdar-cirata']),
    K('KPK menilai sebagian besar dari 629 PLTS Kementerian ESDM (2023) tidak berjalan setelah selesai dibangun.', 'KPK found most of the 629 Energy Ministry solar plants (2023) not operating after construction.', ['katadata-kpk']),
  ], T('Surya tumbuh cepat dari basis kecil; proyek besar berhasil bila kontrak, jaringan, dan pengelola jelas, dan mangkrak bila serah terima tanpa pengelola dan anggaran O&M.', 'Solar is growing fast from a small base; large projects succeed with clear contracts, grid and operators, and stall when handed over without an operator and O&M budget.')));
  babs.push(kosong(2, 'A', T('Jawaban cepat (FAQ)', 'Quick answers (FAQ)'), 'FAQ disusun setelah tim mengurasi pertanyaan nyata anggota; belum ada sumber pertanyaan.'));
  babs.push(kosong(3, 'A', T('Glosarium', 'Glossary'), 'Istilah akan ditautkan ke GLOSARIUM.md oleh agen cetakan.'));
  babs.push(kosong(4, 'B', T('Apa dan kenapa penting', 'What and why it matters'), 'Belum ada sumber bertanggal yang dipanen untuk bab definisi.'));
  babs.push(kosong(5, 'B', T('Sains dan cara hitung', 'Science and calculation'), 'Rumus PVOUT dan faktor kapasitas menunggu sumber metodologi (Global Solar Atlas docs).'));
  babs.push(kosong(6, 'B', T('Peta rantai nilai', 'Value chain map'), 'Rantai nilai tersedia di rantai_plts.json; ditautkan oleh halaman, bukan disalin.'));
  // C
  babs.push(bab(7, 'C', T('Angka dan tren', 'Figures and trends'), [
    K(`Kapasitas surya Indonesia ${r.kap.filter((x) => x.tahun >= 2019).map((x) => `${x.tahun}: ${x.kapasitas_mw} MW`).join('; ')}.`, `Indonesia solar capacity ${r.kap.filter((x) => x.tahun >= 2019).map((x) => `${x.tahun}: ${x.kapasitas_mw} MW`).join('; ')}.`, ['repo-irena-kap']),
    K(`Pembangkitan surya ${k24.tahun}: ${k24.pembangkitan_gwh} GWh (IRENA).`, `Solar generation ${k24.tahun}: ${k24.pembangkitan_gwh} GWh (IRENA).`, ['repo-irena-kap']),
  ], T('Seri tahunan IRENA; pembangkitan 2025 belum tersedia.', 'IRENA annual series; 2025 generation not yet available.')));
  babs.push(bab(8, 'C', T('Peta sebaran', 'Distribution map'), [
    K(`PVOUT tertinggi ${tinggi.provinsi} ${tinggi.pvout_kwh_per_kwp_tahun} kWh/kWp/tahun; terendah ${rendah.provinsi} ${rendah.pvout_kwh_per_kwp_tahun}. Satu titik ibu kota per provinsi, bukan rata-rata provinsi.`, `Highest PVOUT ${tinggi.provinsi} ${tinggi.pvout_kwh_per_kwp_tahun} kWh/kWp/year; lowest ${rendah.provinsi} ${rendah.pvout_kwh_per_kwp_tahun}. One capital point per province, not a provincial mean.`, ['repo-gsa']),
  ], T('Data lengkap 38 provinsi di potensi_atlas.json.', 'Full 38-province data in potensi_atlas.json.')));
  babs.push(kosong(9, 'C', T('Pemain', 'Players'), 'Ditautkan ke Direktori; tidak disalin.'));
  babs.push(bab(10, 'C', T('Proyek', 'Projects'), [
    K('Cirata: 192 MWp / 145 MWac di waduk 250 ha, Jawa Barat; PLN NR 51% dan Masdar 49% (media).', 'Cirata: 192 MWp / 145 MWac on a 250 ha reservoir, West Java; PLN NR 51% and Masdar 49% (media).', ['masdar-cirata', 'cirata-kepemilikan']),
  ], T('Daftar lengkap proyek ada di proyek.json (548 baris); bab ini hanya mengutip kasus K.', 'Full list is in proyek.json (548 rows); this chapter only cites K cases.')));
  babs.push(kosong(11, 'C', T('Pasar dalam negeri', 'Domestic market'), 'Belum ada sumber bertanggal untuk ukuran pasar surya.'));
  // D
  for (const [n, a, e] of [[12, 'Kerangka hukum', 'Legal framework'], [13, 'Linimasa kebijakan', 'Policy timeline'], [14, 'Kewajiban dan insentif', 'Obligations and incentives'], [15, 'Cara mengikuti / perizinan', 'How to participate / permitting'], [16, 'Konsultasi dan RUU berjalan', 'Consultations and bills']])
    babs.push(kosong(n, 'D', T(a, e), 'Diisi dari regulasi.json dan konsultasi.json oleh agen regulasi; bukan wilayah topik ini.'));
  // E
  babs.push(kosong(17, 'E', T('Teknologi terbaru dunia', 'Latest technology worldwide'), 'Belum ada sumber bertanggal.'));
  babs.push(kosong(18, 'E', T('Inovasi Indonesia', 'Indonesian innovation'), 'Ditautkan ke inovasi.json.'));
  babs.push(bab(19, 'E', T('Biaya dan kurva belajar', 'Cost and learning curve'), [
    K(`Harga modul ${r.modul[2010]} USD/W (2010), ${r.modul[2020]} (2020), ${r.modul[2024]} (2024), ${r.modul[2025]} (2025), USD 2025.`, `Module price ${r.modul[2010]} USD/W (2010), ${r.modul[2020]} (2020), ${r.modul[2024]} (2024), ${r.modul[2025]} (2025), USD 2025.`, ['repo-lcoe']),
    K(`LCOE surya India ${r.lc('India', 2010)} sen USD/kWh (2010) ke ${r.lc('India', 2025)} (2025); Thailand ${r.lc('Thailand', 2025)} (2025); dunia ${r.lc('Dunia', 2025)} (2025). LCOE surya Indonesia tidak ada di rilis IRENA yang dibaca.`, `Solar LCOE India ${r.lc('India', 2010)} USc/kWh (2010) to ${r.lc('India', 2025)} (2025); Thailand ${r.lc('Thailand', 2025)} (2025); world ${r.lc('Dunia', 2025)} (2025). Indonesia solar LCOE is not in the IRENA release read.`, ['repo-lcoe']),
  ], T('Celah: LCOE Indonesia butuh PDF IESR/Agora.', 'Gap: Indonesia LCOE needs IESR/Agora PDFs.')));
  // F-J
  for (const [n, kel, a, e] of [[20, 'F', 'Tabel pembanding negara', 'Country comparison table'], [21, 'F', 'Studi kasus', 'Case studies'], [22, 'F', 'Posisi Indonesia', 'Indonesia position'], [23, 'F', 'Kerja sama internasional', 'International cooperation'], [24, 'G', 'Pembiayaan', 'Financing'], [25, 'G', 'Ekonomi proyek', 'Project economics'], [26, 'G', 'Investasi dan transaksi', 'Investment and deals'], [27, 'H', 'Lingkungan dan sosial', 'Environment and social'], [28, 'H', 'Tenaga kerja dan keterampilan', 'Jobs and skills'], [29, 'H', 'Isu dan kontroversi', 'Issues and controversies'], [30, 'I', 'Proyeksi dan skenario', 'Projections'], [31, 'I', 'Peluang dan tantangan untuk anggota METI', 'Opportunities and challenges for METI members'], [32, 'I', 'Yang perlu dipantau', 'What to watch'], [33, 'J', 'Pakar dan pusat studi', 'Experts and study centres'], [34, 'J', 'Acara', 'Events'], [35, 'J', 'Berita terbaru', 'Latest news'], [36, 'J', 'Bacaan lanjut', 'Further reading'], [37, 'J', 'Data unduhan', 'Downloadable data']])
    babs.push(kosong(n, kel, T(a, e), n === 21 || n === 25 ? 'Isi bab ini ada di bab 39-41 (K) agar tidak ganda.' : 'Belum ada sumber bertanggal yang dipanen; ditautkan ke modul repo terkait oleh halaman.'));
  babs.push(bab(38, 'J', T('Sumber dan metode', 'Sources and method'), [
    K('Sumber memakai UA METI-Network-research/0.1, robots, jeda >= 2 detik. Pembacaan 8 Nov 2026 lewat alat pembaca halaman dan pencarian; angka pembiayaan dan tarif yang tidak ditemukan di sumber dikosongkan.', 'Sources read with METI UA, robots, >= 2 s delay. Read 8 Nov 2026; financing and tariff figures not found in sources are left blank.', ['repo-irena-kap']),
  ], T('Lihat daftar sumber di bawah.', 'See source list below.')));

  // ---------- K ----------
  const mercusuar = [
    { id: 'cirata', negara: 'Indonesia', nama: 'PLTS Terapung Cirata', lokasi: T('Waduk Cirata, Jawa Barat', 'Cirata Reservoir, West Java'),
      kapasitas: '192 MWp / 145 MWac', pemilik: T('PLN Nusantara Renewables 51% dan Masdar 49% (media)', 'PLN Nusantara Renewables 51% and Masdar 49% (media)'),
      pendana: T('Standard Chartered dan SMBC disebut dalam koordinasi pendanaan sebelum selesai; pendana akhir belum terkonfirmasi', 'Standard Chartered and SMBC were reported in lender talks pre-completion; final lenders unconfirmed'),
      cod: '2023-11-09 (peresmian)', biaya: null, tarif: null, skema_pengadaan: T('Kerja sama investasi anak PLN dengan Masdar; PPA ditandatangani Januari 2020 (media). Tarif tidak ditemukan di sumber yang dibaca.', 'Investment partnership of a PLN subsidiary with Masdar; PPA signed January 2020 (media). Tariff not found in sources read.'),
      struktur_pendanaan: null,
      apa_dilakukan: T('Memakai 250 ha permukaan waduk PLTA yang sudah ada; menjual listrik ke PLN. Perubahan aturan menaikkan porsi permukaan waduk yang boleh dipakai energi terbarukan menjadi 20%.', 'Used 250 ha of an existing hydropower reservoir; sells power to PLN. A rule change raised usable reservoir surface for renewables to 20%.'),
      kenapa_berhasil: [
        K('Faktor yang dinyatakan pemilik: kemitraan global, teknologi, dan lahan terbatas diatasi dengan permukaan air.', 'Factors stated by the owner: global partnership, technology, and limited land addressed with water surface.', ['masdar-cirata']),
        K('Analisis METI (Hipotesis): waduk PLTA sudah punya jaringan transmisi dan pembeli tunggal (PLN) sehingga risiko jaringan dan offtake rendah. Belum diverifikasi dokumen proyek.', 'METI analysis (Hypothesis): the hydropower reservoir already has transmission and a single offtaker (PLN), lowering grid and offtake risk. Not verified against project documents.', ['masdar-cirata'], { tingkat_bukti: 'analisis-meti-hipotesis' }),
      ],
      angka_hasil: [K('Sekitar 50.000 rumah dan 214.000 ton CO2 terhindar (pemilik; tidak dinyatakan per tahun). Produksi tahunan tidak dinyatakan.', 'About 50,000 homes and 214,000 t CO2 offset (owner; not stated as annual). Annual generation not stated.', ['masdar-cirata'])],
      pelajaran: T('Waduk eksisting + mitra internasional + pembeli PLN mempercepat proyek; ekspansi tahap II sampai 500 MWac masih tahap studi (April 2025).', 'Existing reservoir + international partner + PLN offtake speeds delivery; phase II up to 500 MWac is still at study stage (April 2025).'),
      sumber: ['masdar-cirata', 'cirata-kepemilikan'] },
    { id: 'sumba', negara: 'Indonesia', nama: T('Sumba Iconic Island (hibrida/komunal)', 'Sumba Iconic Island (hybrid/community)'), lokasi: T('Pulau Sumba, NTT', 'Sumba, NTT'),
      kapasitas: null, pemilik: null, pendana: T('ADB memberi dukungan teknis sekitar USD 1 juta sejak Mei 2013; Hivos menginisiasi bersama Kementerian ESDM', 'ADB gave about USD 1 million technical support from May 2013; Hivos initiated with the Energy Ministry'), cod: null, biaya: null, tarif: null, skema_pengadaan: null, struktur_pendanaan: null,
      apa_dilakukan: T('Target 95% elektrifikasi dan 100% energi terbarukan pada 2025 (Mongabay 2017). Hasil 2025 dan kapasitas PLTS hibrida belum ditemukan di sumber; DIKOSONGKAN.', 'Targeted 95% electrification and 100% renewables by 2025 (Mongabay 2017). 2025 outcome and hybrid PLTS capacity not found; LEFT EMPTY.'),
      kenapa_berhasil: [], angka_hasil: [], pelajaran: T('Status sebagai mercusuar belum terbukti dari sumber yang dibaca; butuh dokumen ESDM/PLN NTT/ADB sebelum ditampilkan sebagai berhasil.', 'Lighthouse status not yet shown by sources read; needs ESDM/PLN NTT/ADB documents before being shown as a success.'),
      sumber: ['adb-sumba', 'mongabay-sumba'], perlu_riset: true },
    { id: 'benban', negara: 'Mesir', nama: 'Benban Solar Park', lokasi: T('Aswan, Mesir; 37,2 km2, 41 petak', 'Aswan, Egypt; 37.2 km2, 41 plots'),
      kapasitas: '1.800 MW (nominal)', pemilik: T('Banyak pengembang swasta (ib vogt, Infinity Solar, TAQA Arabia, Shapoorji, Acciona, dll.) di bawah program Nubian Suns FiT', 'Multiple private developers (ib vogt, Infinity Solar, TAQA Arabia, Shapoorji, Acciona, etc.) under the Nubian Suns FiT programme'),
      pendana: T('IFC memimpin konsorsium USD 653 juta untuk 13 pembangkit; MIGA asuransi risiko politik USD 210 juta untuk 12 proyek; EBRD, FMO, GCF, AIIB, CDC; BLB dan AAIB dengan jaminan Euler Hermes untuk fase pertama', 'IFC-led USD 653 million for 13 plants; MIGA USD 210 million political risk insurance for 12 projects; EBRD, FMO, GCF, AIIB, CDC; BLB and AAIB with Euler Hermes cover for first phase'),
      cod: '2019 (selesai November 2019; bagian pertama diresmikan 13 Maret 2018)', biaya: null, tarif: null, skema_pengadaan: T('Program feed-in tariff Nubian Suns; tingkat tarif tidak ada di sumber yang dibaca.', 'Nubian Suns feed-in tariff programme; tariff level not in sources read.'),
      struktur_pendanaan: T('Utang proyek multi-pemberi pinjaman dengan asuransi risiko politik dan jaminan kredit ekspor.', 'Multi-lender project debt with political risk insurance and export credit cover.'),
      apa_dilakukan: T('Satu kawasan, 41 petak untuk perusahaan berbeda; EETC membangun gardu dan sambungan 220 kV. Catatan: angka biaya USD 4 miliar di infobox Wikipedia tidak cocok dengan angka pembiayaan, tidak dipakai.', 'One zone, 41 plots to different companies; EETC builds substations and 220 kV link. Note: the USD 4 billion infobox cost does not match financing figures and is not used.'),
      kenapa_berhasil: [K('Analisis METI (Hipotesis): paket penjaminan (MIGA, ECA) dan pembiayaan bersama oleh lembaga pembangunan menurunkan risiko; infrastruktur bersama oleh EETC. Sumber yang dibaca tidak menyatakan faktor keberhasilan.', 'METI analysis (Hypothesis): guarantee package (MIGA, ECA) and development-bank co-lending lowered risk; shared EETC infrastructure. Sources read do not state success factors.', ['benban-wiki'], { tingkat_bukti: 'analisis-meti-hipotesis' })],
      angka_hasil: [K('Produksi tahunan sekitar 3,8 sampai 4,5 TWh; faktor kapasitas 26% (Wikipedia).', 'Annual output about 3.8 to 4.5 TWh; capacity factor 26% (Wikipedia).', ['benban-wiki'])],
      pelajaran: T('Kawasan terpadu dengan banyak pengembang dan penjaminan risiko politik. Perlu sumber primer (IFC/EBRD) untuk tarif dan masalah operasi.', 'Integrated zone with many developers and political risk cover. Primary sources (IFC/EBRD) needed for tariffs and operating issues.'),
      sumber: ['benban-wiki'] },
    { id: 'aldhafra', negara: 'Uni Emirat Arab', nama: 'Al Dhafra Solar PV', lokasi: T('Abu Dhabi, UEA', 'Abu Dhabi, UAE'),
      kapasitas: '2 GW', pemilik: T('TAQA 40%; Masdar, EDF Renewables, JinkoPower masing-masing 20% (PV Tech)', 'TAQA 40%; Masdar, EDF Renewables, JinkoPower 20% each (PV Tech)'),
      pendana: T('Tujuh bank internasional; penutupan pembiayaan Desember 2020', 'Seven international banks; financial close December 2020'),
      cod: 'Target 2022; satu sumber lemah menyebut operasi komersial 30 Jun 2023 (perlu konfirmasi)', biaya: null,
      tarif: T('Penawaran menang USD 1,35 sen/kWh (Mei 2020); Masdar menyebut turun jadi AED 4,85 (sekitar USD 1,32 sen)/kWh setelah penutupan pembiayaan', 'Winning bid USD 1.35 cents/kWh (May 2020); Masdar says it fell to AED 4.85 (about USD 1.32 cents)/kWh after financial close'),
      skema_pengadaan: T('Lelang kompetitif EWEC (IPP).', 'EWEC competitive IPP tender.'), struktur_pendanaan: T('Utang proyek dari 7 bank; jumlah tidak terkonfirmasi.', 'Project debt from 7 banks; amount unconfirmed.'),
      apa_dilakukan: T('Lelang IPP kompetitif dengan pembeli tunggal negara dan konsorsium pengembang berpengalaman.', 'Competitive IPP tender with a state single buyer and an experienced developer consortium.'),
      kenapa_berhasil: [K('Analisis METI (Hipotesis): tarif sangat rendah dimungkinkan oleh radiasi tinggi, lahan murah, pembeli negara berperingkat tinggi, dan biaya modal rendah. Sumber tidak menyatakan faktor.', 'METI analysis (Hypothesis): very low tariff enabled by high irradiance, cheap land, a highly rated state buyer and low cost of capital. Sources do not state factors.', ['aldhafra-pvtech'], { tingkat_bukti: 'analisis-meti-hipotesis' })],
      angka_hasil: [K('Tarif menang tercatat sebagai terendah saat diumumkan (PV Tech).', 'Winning tariff reported as the lowest at announcement (PV Tech).', ['aldhafra-pvtech'])],
      pelajaran: T('Lelang kompetitif dengan pembeli kredibel menghasilkan tarif rendah; kondisi UEA tidak otomatis berlaku di Indonesia.', 'Competitive tender with a credible buyer yields low tariffs; UAE conditions do not automatically transfer to Indonesia.'),
      sumber: ['aldhafra-pvtech', 'aldhafra-masdar'] },
    { id: 'bhadla', negara: 'India', nama: 'Bhadla Solar Park', lokasi: T('Distrik Jodhpur, Rajasthan, lebih dari 14.000 acre', 'Jodhpur district, Rajasthan, over 14,000 acres'),
      kapasitas: '2.245 MW terpasang (Mercom; Wikipedia menyebut 2.055 MW)', pemilik: T('Banyak pengembang: RSPDCL 745 MW, Adani JV 500 MW, ACME, SB Energy, dll.', 'Multiple developers: RSPDCL 745 MW, Adani JV 500 MW, ACME, SB Energy, etc.'),
      pendana: null, cod: '2020 (beroperasi penuh Maret 2020 per CleanTechnica)', biaya: null,
      tarif: T('Lelang Mei 2017: INR 2,44 dan 2,45/kWh; tahap Desember 2019: INR 2,47 dan 2,48/kWh', 'May 2017 auction: INR 2.44 and 2.45/kWh; December 2019 tranches: INR 2.47 and 2.48/kWh'),
      skema_pengadaan: T('Taman surya milik negara dengan lelang SECI per tahap; pengembang menawar tarif.', 'State solar park with SECI tranche auctions; developers bid tariffs.'), struktur_pendanaan: null,
      apa_dilakukan: T('Pemerintah menyiapkan lahan dan evakuasi di taman surya, pengembang hanya menawar tarif per tahap.', 'Government prepares land and evacuation in the park; developers only bid tariffs per tranche.'),
      kenapa_berhasil: [K('Analisis METI (Hipotesis): lahan dan sambungan disiapkan di muka sehingga lelang kompetitif dan oversubscribed. Sumber yang dibaca hanya menyebut hasil lelang.', 'METI analysis (Hypothesis): land and grid prepared upfront so auctions were competitive and oversubscribed. Sources read only report auction results.', ['bhadla-pvtech', 'bhadla-mercom'], { tingkat_bukti: 'analisis-meti-hipotesis' })],
      angka_hasil: [K('Rekor tarif INR 2,44/kWh (2017) disebut belum terlampaui menurut Mercom.', 'INR 2.44/kWh (2017) record not breached per Mercom.', ['bhadla-mercom'])],
      pelajaran: T('Model taman surya siap pakai dengan lelang bertahap menurunkan risiko lahan dan jaringan bagi pengembang.', 'Ready-made solar park with staged auctions removes land and grid risk for developers.'),
      sumber: ['bhadla-pvtech', 'bhadla-mercom'] },
  ];

  const gagal = [
    { id: 'plts-desa-esdm', negara: 'Indonesia', nama: T('PLTS desa/terpusat bantuan pemerintah yang mati setelah serah terima', 'Government-funded village/centralised PLTS dead after handover'),
      kronologi: [
        K('Gajah Makmur (Mukomuko, Bengkulu): dibangun 2016 dengan bantuan ESDM, beroperasi awal 2017, mati akhir 2017, masih mati sampai Sep 2020; kepemilikan dan tanggung jawab perawatan tidak jelas.', 'Gajah Makmur (Mukomuko, Bengkulu): built 2016 with ESDM aid, operating early 2017, dead by end 2017, still dead as of Sep 2020; ownership and maintenance duty unclear.', ['mongabay-gajah']),
        K('Pada 3 Feb 2016, Dirjen EBTKE mengakui SDM pengelola belum siap; UP3KN menyebut alih aset ke daerah tersendat dan daerah tak punya anggaran pemeliharaan.', 'On 3 Feb 2016 the EBTKE DG admitted operators were not ready; UP3KN said asset transfers to regions stalled and regions lacked maintenance budgets.', ['detik-2016']),
        K('Media melaporkan kasus lain: PLTS 100 kWp bantuan ESDM 2015 di Lakarama, Muna rusak baterai dan ditunjuk sudah diserahkan ke Pemkab; PLTS Parang, Karimunjawa hampir semua rusak sejak 2019.', 'Media report other cases: 100 kWp ESDM-aided PLTS (2015) in Lakarama, Muna with battery failure, said to be handed to the regency; Parang, Karimunjawa PLTS mostly broken since 2019.', ['antara-towea', 'detik-karimun']),
        K('KPK: dari 629 PLTS Kementerian ESDM (2023), sebagian besar tidak berjalan; potensi kerugian negara Rp2,5 triliun menurut perhitungan KPK; mark-up, kolusi TKDN; vendor terkonsentrasi pada 20 perusahaan, 4 di antaranya terlibat tindak pidana korupsi; revitalisasi mangkrak lagi.', 'KPK: of 629 Energy Ministry PLTS (2023), most not running; potential state loss Rp2.5 trillion per KPK; price mark-ups, TKDN collusion; vendors concentrated in 20 firms, 4 involved in corruption; revitalisation stalled again.', ['katadata-kpk']),
      ],
      penyebab: [
        K('Faktor yang dinyatakan sumber: SDM pengelola belum siap, alih aset tersendat, tanpa anggaran operasional daerah, tanpa koordinasi sejak awal, keluaran tidak sesuai kebutuhan PLN, tak ada interkoneksi.', 'Factors stated by sources: operators not ready, asset transfers stalled, no regional operating budget, no coordination from start, output not matching PLN needs, no interconnection.', ['detik-2016', 'katadata-kpk', 'mongabay-gajah']),
      ],
      terdampak: T('Warga desa yang kembali ke genset solar (Rp200 ribu sampai Rp500 ribu per bulan sebelum PLTS di Gajah Makmur) dan negara (potensi kerugian menurut KPK).', 'Villagers returning to diesel gensets (Rp200k to Rp500k per month before PLTS at Gajah Makmur) and the state (loss potential per KPK).'),
      seharusnya: T('Analisis METI (Hipotesis): serah terima baru sah bila ada operator terlatih, iuran/anggaran O&M, dan kepemilikan aset tertulis; pemantauan pascaserah terima. Selaras dengan rekomendasi KPK (tata kelola sejak perencanaan, ETGF) dan peringatan IESR untuk program Koperasi Merah Putih.', 'METI analysis (Hypothesis): handover only valid with trained operator, O&M fee/budget and written asset ownership; post-handover monitoring. Consistent with KPK recommendation (governance from planning, ETGF) and IESR warning for the Koperasi Merah Putih programme.'),
      tanda_bahaya: [T('Tidak ada nama pengelola dan anggaran O&M di dokumen serah terima', 'No named operator or O&M budget in handover documents'), T('Pengadaan terkonsentrasi pada sedikit vendor', 'Procurement concentrated on few vendors'), T('Tidak ada rencana interkoneksi PLN', 'No PLN interconnection plan')],
      sumber: ['detik-2016', 'mongabay-gajah', 'antara-towea', 'detik-karimun', 'katadata-kpk', 'kompas-iesr-kopdes'], hak_jawab: true,
      catatan: T('Sebagian laporan media; tidak ada temuan BPK yang ditemukan dalam pencarian ini. Angka kasus per desa bukan sampel nasional.', 'Mostly media reports; no BPK finding found in this search. Village cases are not a national sample.') },
    { id: 'vn-fit', negara: 'Vietnam', nama: T('Ledakan FiT surya 2019 sampai 2020 dan sengketa FiT', 'Solar FiT boom 2019-2020 and FiT disputes'),
      kronologi: [
        K('FiT USD 9,35 sen/kWh selama 20 tahun (Keputusan 11/2017/QD-TTg) untuk proyek beroperasi sebelum 30 Jun 2019; sekitar 4,46 GW (82 pembangkit) terhubung pada batas waktu itu.', 'FiT of USD 9.35 cents/kWh for 20 years (Decision 11/2017/QD-TTg) for projects operating by 30 Jun 2019; about 4.46 GW (82 plants) connected by the deadline.', ['vn-wiki', 'vn-allens']),
        K('Akhir 2019 sebagian proyek di Vietnam Selatan mengalami kurtailmen harian sampai 80% (firma hukum). Pembatasan kapasitas transmisi disebut Wikipedia sebagai sebab kurtailmen.', 'Late 2019 some Southern projects saw daily curtailment up to 80% (law firm). Wikipedia cites limited transmission capacity.', ['vn-allens', 'vn-wiki']),
        K('Akhir 2023 audit Inspektorat Pemerintah menemukan 14 proyek di Ninh Thuan menerima FiT tertinggi secara tidak tepat; 2025 investor mengeluh potensi pemotongan FiT retroaktif untuk proyek COD sebelum atau selama 2021 (sekitar 12 GW surya dan bayu menurut satu sumber).', 'Late 2023 a Government Inspectorate audit found 14 Ninh Thuan projects wrongly received the top FiT; in 2025 investors protested possible retroactive FiT cuts for projects with COD before or during 2021 (about 12 GW solar and wind per one source).', ['vn-vir-2025']),
      ],
      penyebab: [K('Faktor menurut sumber: transmisi tidak mengejar ledakan kapasitas, kebijakan berbalik arah antara kementerian dan kantor PM, sengketa penafsiran kelayakan FiT. Status akhir sengketa 2025 tidak terkonfirmasi.', 'Factors per sources: transmission lagged the capacity boom, policy reversals between ministry and PM office, FiT eligibility interpretation disputes. Final 2025 outcome unconfirmed.', ['vn-allens', 'vn-vir-2025'])],
      terdampak: T('Investor domestik dan asing, pemberi pinjaman; EVN sebagai pembeli.', 'Domestic and foreign investors, lenders; EVN as offtaker.'),
      seharusnya: T('Analisis METI (Hipotesis): tenggat FiT harus disinkronkan dengan kesiapan transmisi, dengan kuota bertahap; aturan penurunan tarif tidak berlaku surut.', 'METI analysis (Hypothesis): FiT deadlines should sync with grid readiness, with staged quotas; no retroactive tariff rules.'),
      tanda_bahaya: [T('Tenggat FiT pendek dengan target jauh di atas kapasitas jaringan', 'Short FiT deadline with volume far above grid capacity'), T('Kementerian berbeda tafsir tentang kelayakan tarif', 'Ministries interpreting tariff eligibility differently')],
      sumber: ['vn-wiki', 'vn-allens', 'vn-vir-2025'], hak_jawab: true },
    { id: 'es-retro', negara: 'Spanyol', nama: T('Pemotongan retroaktif tarif energi terbarukan 2010 sampai 2013', 'Retroactive renewable tariff cuts 2010-2013'),
      kronologi: [
        K('2008: Spanyol menambah rekor 2,6 GW PV, menjadi 3,5 GW (hampir lima kali rekor sebelumnya).', '2008: Spain added a record 2.6 GW PV, reaching 3.5 GW (almost five times the prior record).', ['es-wiki']),
        K('2010: pemerintah memotong subsidi proyek surya yang sudah ada secara retroaktif untuk menghemat miliaran euro; asosiasi PV memperingatkan ratusan operator bisa bangkrut.', '2010: government retroactively cut subsidies for existing solar to save billions of euros; PV association warned hundreds of operators could go bankrupt.', ['es-wiki']),
        K('4 Mei 2017: ICSID (Eiser v Spain) menyatakan perubahan 2013 melanggar Energy Charter Treaty (perlakuan adil), sekitar EUR 128 juta; 2019: NextEra EUR 290,4 juta. Spanyol dilaporkan menempuh pembatalan, bukan membayar (komentar 2019).', '4 May 2017: ICSID (Eiser v Spain) held the 2013 changes breached the Energy Charter Treaty (fair treatment), about EUR 128 million; 2019: NextEra EUR 290.4 million. Spain reportedly pursued annulment rather than paying (2019 commentary).', ['es-pvmag-eiser', 'es-pvtech-nextera']),
      ],
      penyebab: [K('Faktor menurut sumber: ledakan kapasitas di bawah tarif tetap tinggi lalu pemerintah memotong tarif yang sudah dijanjikan. Detail defisit tarif tidak ada di sumber yang dibaca.', 'Factors per sources: capacity boom under high fixed tariffs followed by cuts to promised tariffs. Tariff-deficit detail not in sources read.', ['es-wiki', 'es-pvmag-eiser'])],
      terdampak: T('Investor PV dan CSP (lebih dari 40 kasus sengketa dilaporkan 2017), kreditur.', 'PV and CSP investors (over 40 dispute cases reported in 2017), lenders.'),
      seharusnya: T('Analisis METI (Hipotesis): kuota tahunan dan degresi tarif otomatis di muka agar tidak perlu memotong tarif yang sudah dikunci.', 'METI analysis (Hypothesis): annual caps and automatic upfront tariff degression so locked tariffs need not be cut.'),
      tanda_bahaya: [T('Tarif tetap tanpa kuota dan tanpa degresi', 'Fixed tariff without cap or degression'), T('Defisit pembeli listrik melebar', 'Widening offtaker deficit')],
      sumber: ['es-wiki', 'es-pvmag-eiser', 'es-pvtech-nextera'], hak_jawab: true },
  ];

  babs.push({ no: 39, kelompok: 'K', judul: T('Proyek mercusuar (lighthouse)', 'Lighthouse projects'), status: 'isi', kasus: mercusuar.map((m) => ({ ...m, nama: m.nama })) });
  babs.push({ no: 40, kelompok: 'K', judul: T('Proyek gagal, mangkrak, atau mundur', 'Failed, stalled or delayed projects'), status: 'isi', kasus: gagal,
    catatan: T('Kasus yang belum dipanen: lelang IPP batal, program 1000 pulau. Tidak ditulis tanpa sumber.', 'Not yet harvested: cancelled IPP tenders, 1000-island programme. Not written without sources.'), hak_jawab_tautan: '/koreksi' });

  const faktor = ['Lahan/lokasi', 'Perizinan', 'PPA/tarif', 'Pendanaan', 'Jaringan/transmisi', 'Pengelola dan O&M', 'Kepastian kebijakan', 'Tata kelola pengadaan'];
  const sel = (v, s) => ({ nilai: v, sumber: s });
  babs.push({ no: 41, kelompok: 'K', judul: T('Pola keberhasilan dan kegagalan', 'Success and failure patterns'), status: 'isi',
    catatan: T('Seluruh isi sel adalah analisis METI (Hipotesis) atas fakta yang dinyatakan di bab 39-40; "-" berarti sumber tidak menyebut.', 'All cells are METI analysis (Hypothesis) on facts in chapters 39-40; "-" means sources do not say.'),
    tingkat_bukti: 'analisis-meti-hipotesis', faktor,
    proyek: {
      cirata: ['waduk eksisting (+)', '-', 'PPA PLN 2020 (+)', 'mitra asing (+)', '-', '-', 'aturan 20% waduk (+)', '-'],
      benban: ['kawasan terpadu (+)', '-', 'FiT (+)', 'penjaminan MIGA/ECA (+)', 'EETC bangun gardu (+)', '-', '-', '-'],
      aldhafra: ['-', '-', 'lelang EWEC (+)', '7 bank (+)', '-', '-', '-', 'lelang kompetitif (+)'],
      bhadla: ['taman surya (+)', '-', 'lelang SECI (+)', '-', 'evakuasi disiapkan (+, hipotesis)', '-', '-', 'lelang (+)'],
      'plts-desa-esdm': ['-', '-', '-', 'APBN tanpa O&M (-)', 'tanpa interkoneksi (-)', 'SDM tak siap, aset tak jelas (-)', '-', 'vendor terkonsentrasi, mark-up (-)'],
      'vn-fit': ['-', '-', 'FiT tenggat pendek (-)', '-', 'transmisi tertinggal (-)', '-', 'berbalik arah, retroaktif (-)', 'audit Ninh Thuan (-)'],
      'es-retro': ['-', '-', 'tarif tetap tanpa kuota (-)', 'kreditur terdampak (-)', '-', '-', 'pemotongan retroaktif (-)', '-'],
    }, sumber: ['masdar-cirata', 'benban-wiki', 'aldhafra-pvtech', 'bhadla-pvtech', 'katadata-kpk', 'detik-2016', 'vn-allens', 'es-wiki'] });

  const tahap = ['penyaringan lokasi', 'perizinan', 'PPA', 'pendanaan', 'konstruksi', 'operasi'];
  const peran = ['pengembang', 'investor', 'pemda', 'pemerintah pusat', 'PLN', 'METI'];
  const tugas = [
    ['pengembang', 'operasi', 'Tunjuk operator terlatih dan anggaran O&M tertulis sebelum serah terima.', 'Name a trained operator and a written O&M budget before handover.', ['detik-2016', 'katadata-kpk']],
    ['pemda', 'operasi', 'Catat kepemilikan aset dan alokasikan anggaran pemeliharaan sebelum menerima alih aset.', 'Record asset ownership and allocate maintenance budget before accepting transfer.', ['detik-2016', 'mongabay-gajah']],
    ['pemerintah pusat', 'PPA', 'Sinkronkan tenggat insentif dengan kesiapan jaringan; hindari perubahan tarif surut.', 'Align incentive deadlines with grid readiness; avoid retroactive tariff changes.', ['vn-allens', 'es-pvmag-eiser']],
    ['pemerintah pusat', 'konstruksi', 'Cegah konsentrasi vendor dan periksa kolusi TKDN sejak perencanaan (rekomendasi KPK: ETGF).', 'Prevent vendor concentration and check TKDN collusion from planning (KPK: ETGF).', ['katadata-kpk']],
    ['PLN', 'konstruksi', 'Pastikan rencana interkoneksi dan kebutuhan keluaran sebelum proyek dibangun.', 'Confirm interconnection plan and output needs before construction.', ['katadata-kpk']],
    ['pengembang', 'pendanaan', 'Pertimbangkan penjaminan risiko politik dan pembiayaan bersama lembaga pembangunan (contoh Benban).', 'Consider political risk cover and development-bank co-lending (Benban example).', ['benban-wiki']],
    ['investor', 'PPA', 'Periksa klausul perubahan hukum dan perlindungan investasi (Energy Charter Treaty bagi sebagian investor).', 'Check change-in-law clauses and investment protection (Energy Charter Treaty for some investors).', ['es-pvmag-eiser']],
    ['pengembang', 'penyaringan lokasi', 'Pertimbangkan permukaan waduk eksisting yang sudah punya transmisi (contoh Cirata).', 'Consider existing reservoir surfaces that already have transmission (Cirata example).', ['masdar-cirata']],
  ].map(([p, t, id, en, s]) => ({ peran: p, tahap: t, teks: T(id, en), sumber: s, tingkat_bukti: 'analisis-meti-hipotesis' }));
  babs.push({ no: 42, kelompok: 'K', judul: T('Daftar yang harus dilakukan', 'Things to do'), status: 'isi', peran, tahap, tugas, catatan: T('Daftar periksa awal; sel peran x tahap lain belum diisi karena belum ada sumber.', 'Initial checklist; other role x stage cells empty for lack of sources.'), unduh_csv: true });

  const dipakai = new Set(JSON.stringify(babs).match(/"(?:[a-z0-9-]+)"/g)?.map((s) => s.slice(1, -1)) || []);
  const sumber = Object.entries(SUMBER).filter(([id]) => dipakai.has(id)).map(([id, s]) => ({ id, ...s }));
  babs.sort((a, b) => a.no - b.no);
  return { topik: 'surya', judul: T('Surya', 'Solar'), bahasa: ['id', 'en'], diperbarui: TGL, skema_versi: 'sementara-0', bab: babs, sumber, diblokir: [] };
}

export function validasi(d) {
  const err = [];
  const SID = new Set(d.sumber.map((s) => s.id));
  if (d.bab.length !== 42) err.push('bab != 42');
  d.bab.forEach((b, i) => { if (b.no !== i + 1) err.push('urutan bab ' + b.no); });
  const cekT = (t, p) => { if (!t || !t.id || !t.en) err.push('teks id/en kosong ' + p); };
  const cekK = (k, p) => { cekT(k.teks, p); if (!k.sumber?.length) err.push('klaim tanpa sumber ' + p); k.sumber?.forEach((s) => { if (!SID.has(s)) err.push('sumber tak dikenal ' + s + ' di ' + p); }); };
  for (const b of d.bab) {
    cekT(b.judul, 'judul ' + b.no);
    if (b.status === 'kosong' && (b.klaim?.length || b.kasus?.length)) err.push('bab kosong berisi ' + b.no);
    (b.klaim || []).forEach((k) => cekK(k, 'bab' + b.no));
    for (const c of b.kasus || []) {
      for (const f of ['kenapa_berhasil', 'angka_hasil', 'kronologi', 'penyebab']) (c[f] || []).forEach((k) => cekK(k, c.id + '.' + f));
      if (!c.sumber?.length) err.push('kasus tanpa sumber ' + c.id);
      (c.sumber || []).forEach((s) => { if (!SID.has(s)) err.push('sumber tak dikenal ' + s); });
      if (b.no === 40 && !c.hak_jawab) err.push('hak jawab ' + c.id);
    }
    (b.tugas || []).forEach((t) => { cekT(t.teks, 'tugas'); t.sumber.forEach((s) => { if (!SID.has(s)) err.push('sumber tugas ' + s); }); });
  }
  for (const s of d.sumber) if (!/^https:\/\//.test(s.url) || !s.tanggal || !s.tingkat_bukti || !s.penerbit) err.push('sumber cacat ' + s.id);
  if (/—/.test(JSON.stringify(d))) err.push('em dash');
  const n39 = d.bab[38].kasus.length, n40 = d.bab[39].kasus.length;
  if (n39 < 1 || n40 < 1) err.push('kasus K kosong');
  return err;
}

export function selftest() {
  const d = susun(); const e = validasi(d);
  if (e.length) throw new Error(e.join('\n'));
  const buruk = structuredClone(d); buruk.bab[6].klaim[0].sumber = ['tidak-ada'];
  if (!validasi(buruk).length) throw new Error('validasi tidak menangkap sumber palsu');
  return d;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) { selftest(); console.log('selftest ok'); }
  else {
    const d = susun(); const e = validasi(d); if (e.length) { console.error(e.join('\n')); process.exit(1); }
    fs.mkdirSync(path.join(akar, 'data/topik'), { recursive: true });
    fs.writeFileSync(path.join(akar, 'data/topik/surya.json'), JSON.stringify(d, null, 1) + '\n');
    const isi = d.bab.filter((b) => b.status === 'isi').map((b) => b.no);
    console.log(`bab terisi ${isi.length}/42: ${isi.join(',')}; mercusuar ${d.bab[38].kasus.length}; gagal ${d.bab[39].kasus.length}; sumber ${d.sumber.length}`);
  }
}
