#!/usr/bin/env node
// Panen direktori lembaga EBET (asosiasi, kementerian, pemda, think tank, kampus, donor). Node stdlib saja.
//   --selftest | --seed | --verifikasi [--hanya=teks] | --pengurus | --anggota | --statistik
// Etika: UA jujur, 1 permintaan, jeda >= 2 dtk, robots dicek, tanpa login. 403/429 = berhenti.
// Kontak: hanya surel generik lembaga (info@, humas@, ...) dan telepon kantor; tidak ada pribadi.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const GAP_MS = 2200;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'data-panen/lembaga');
const RAW = path.join(OUT, 'raw');
const F = (n) => path.join(OUT, n);
const HARI_INI = new Date().toISOString().slice(0, 10);

const baca = (f) => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
const tulis = (f, rows) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '')); };
const idL = (nama) => 'l_' + crypto.createHash('sha1').update(nama.toLowerCase()).digest('hex').slice(0, 10);
const norm = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// ---------- benih: [nama, singkatan, jenis, induk, kepakaran, situs, kota, provinsi] ----------
const J = 'Jakarta', DKI = 'DKI Jakarta';
const BENIH = [
  // asosiasi
  ['Masyarakat Energi Terbarukan Indonesia', 'METI', 'asosiasi', null, ['kebijakan', 'riset-data'], 'https://metiires.or.id', J, DKI],
  ['Asosiasi Energi Surya Indonesia', 'AESI', 'asosiasi', 'METI', ['surya'], 'https://aesi.or.id', J, DKI],
  ['Asosiasi Produsen Biofuel Indonesia', 'APROBI', 'asosiasi', 'METI', ['bioenergi'], 'https://aprobi.or.id', J, DKI],
  ['Asosiasi Panas Bumi Indonesia', 'API', 'asosiasi', 'METI', ['panas-bumi'], 'https://www.api.or.id', J, DKI],
  ['Asosiasi Pengusaha Pembangkit Listrik Tenaga Air', 'APPLTA', 'asosiasi', 'METI', ['hidro'], null, J, DKI],
  ['Asosiasi Produsen Modul Surya Indonesia', 'APAMSI', 'asosiasi', 'METI', ['surya', 'industri'], null, J, DKI],
  ['Asosiasi Energi Angin dan Surya Indonesia', 'AESKI', 'asosiasi', 'METI', ['bayu', 'surya'], null, J, DKI],
  ['Asosiasi Produsen Bioetanol Indonesia', 'PJCI', 'asosiasi', 'METI', ['bioenergi'], null, J, DKI],
  ['Asosiasi Pengusaha Batubara Indonesia', 'APBI', 'asosiasi', null, ['kebijakan'], 'https://www.apbi-icma.org', J, DKI],
  ['Asosiasi Biogas Indonesia', 'ABI', 'asosiasi', 'METI', ['bioenergi'], null, J, DKI],
  ['Asosiasi Pengembang Pembangkit Listrik Tenaga Mikrohidro', 'APPMI', 'asosiasi', 'METI', ['hidro'], null, J, DKI],
  ['Asosiasi Kendaraan Listrik Indonesia', 'AKLI', 'asosiasi', null, ['elektrifikasi'], null, J, DKI],
  ['Perkumpulan Ahli Konservasi Energi', 'PAKE', 'asosiasi', null, ['efisiensi'], null, J, DKI],
  ['Asosiasi Perusahaan Jasa Konservasi Energi Indonesia', 'APJKEI', 'asosiasi', null, ['efisiensi'], null, J, DKI],
  ['Indonesia Solar Association', 'ISA', 'asosiasi', null, ['surya'], null, J, DKI],
  ['Asosiasi Pengusaha Listrik Swasta Indonesia', 'APLSI', 'asosiasi', null, ['kebijakan', 'industri'], null, J, DKI],
  ['Asosiasi Pengembang Pembangkit Listrik Tenaga Bayu Indonesia', 'APPLTB', 'asosiasi', null, ['bayu'], null, J, DKI],
  ['Indonesia Hydrogen Association', 'IHA', 'asosiasi', null, ['hidrogen'], null, J, DKI],
  ['Asosiasi Pengusaha Waste to Energy Indonesia', 'APWTE', 'asosiasi', null, ['biomassa-sampah'], null, J, DKI],
  ['Masyarakat Ketenagalistrikan Indonesia', 'MKI', 'asosiasi', null, ['jaringan'], 'https://www.mki.or.id', J, DKI],
  ['Himpunan Ahli Teknik Hidraulik Indonesia', 'HATHI', 'asosiasi', null, ['hidro'], null, J, DKI],
  ['Kamar Dagang dan Industri Indonesia (Komite Tetap Energi Baru Terbarukan)', 'KADIN-EBT', 'asosiasi', null, ['kebijakan', 'pembiayaan'], 'https://kadin.id', J, DKI],
  // kementerian & lembaga
  ['Kementerian Energi dan Sumber Daya Mineral', 'ESDM', 'kementerian', null, ['kebijakan'], 'https://www.esdm.go.id', J, DKI],
  ['Direktorat Jenderal Energi Baru, Terbarukan dan Konservasi Energi', 'Ditjen EBTKE', 'kementerian', 'ESDM', ['kebijakan'], 'https://ebtke.esdm.go.id', J, DKI],
  ['Direktorat Aneka Energi Baru dan Energi Terbarukan', 'Dit. Bioenergi/Aneka EBT', 'kementerian', 'Ditjen EBTKE', ['bioenergi', 'surya', 'bayu'], 'https://ebtke.esdm.go.id', J, DKI],
  ['Direktorat Panas Bumi', 'Dit. Panas Bumi', 'kementerian', 'Ditjen EBTKE', ['panas-bumi'], 'https://ebtke.esdm.go.id', J, DKI],
  ['Direktorat Bioenergi', 'Dit. Bioenergi', 'kementerian', 'Ditjen EBTKE', ['bioenergi'], 'https://ebtke.esdm.go.id', J, DKI],
  ['Direktorat Konservasi Energi', 'Dit. Konservasi Energi', 'kementerian', 'Ditjen EBTKE', ['efisiensi'], 'https://ebtke.esdm.go.id', J, DKI],
  ['Direktorat Perencanaan dan Pembangunan Infrastruktur EBTKE', 'Dit. PPI EBTKE', 'kementerian', 'Ditjen EBTKE', ['kebijakan'], 'https://ebtke.esdm.go.id', J, DKI],
  ['Direktorat Jenderal Ketenagalistrikan', 'Ditjen Gatrik', 'kementerian', 'ESDM', ['jaringan'], 'https://gatrik.esdm.go.id', J, DKI],
  ['Pusat Penelitian dan Pengembangan Teknologi Ketenagalistrikan, EBT dan Konservasi Energi', 'P3TKEBTKE', 'kementerian', 'ESDM', ['riset-data'], 'https://p3tkebt.esdm.go.id', J, DKI],
  ['Balai Besar Survei dan Pengujian KEBTKE', 'BBSP KEBTKE', 'kementerian', 'ESDM', ['riset-data'], null, J, DKI],
  ['Dewan Energi Nasional', 'DEN', 'lembaga', null, ['kebijakan'], 'https://den.go.id', J, DKI],
  ['Kementerian Perencanaan Pembangunan Nasional/Bappenas', 'Bappenas', 'kementerian', null, ['kebijakan'], 'https://www.bappenas.go.id', J, DKI],
  ['Direktorat Energi, Telekomunikasi, dan Informatika Bappenas', 'Dit. Energi Bappenas', 'kementerian', 'Bappenas', ['kebijakan'], 'https://www.bappenas.go.id', J, DKI],
  ['Kementerian Perindustrian', 'Kemenperin', 'kementerian', null, ['industri'], 'https://kemenperin.go.id', J, DKI],
  ['Direktorat Jenderal Industri Logam, Mesin, Alat Transportasi, dan Elektronika', 'ILMATE', 'kementerian', 'Kemenperin', ['industri', 'elektrifikasi'], 'https://kemenperin.go.id', J, DKI],
  ['Kementerian Koordinator Bidang Perekonomian', 'Kemenko Perekonomian', 'kementerian', null, ['kebijakan'], 'https://ekon.go.id', J, DKI],
  ['Kementerian Keuangan', 'Kemenkeu', 'kementerian', null, ['pembiayaan'], 'https://www.kemenkeu.go.id', J, DKI],
  ['Badan Kebijakan Fiskal', 'BKF', 'kementerian', 'Kemenkeu', ['pembiayaan', 'karbon'], 'https://fiskal.kemenkeu.go.id', J, DKI],
  ['Kementerian Lingkungan Hidup/Badan Pengendalian Lingkungan Hidup', 'KLH', 'kementerian', null, ['karbon'], 'https://www.menlhk.go.id', J, DKI],
  ['Kementerian Kehutanan', 'Kemenhut', 'kementerian', null, ['karbon', 'bioenergi'], 'https://www.kehutanan.go.id', J, DKI],
  ['Kementerian Pertanian', 'Kementan', 'kementerian', null, ['bioenergi'], 'https://www.pertanian.go.id', J, DKI],
  ['Kementerian Investasi dan Hilirisasi/BKPM', 'BKPM', 'kementerian', null, ['kebijakan'], 'https://www.bkpm.go.id', J, DKI],
  ['Kementerian Badan Usaha Milik Negara', 'Kementerian BUMN', 'kementerian', null, ['kebijakan'], 'https://bumn.go.id', J, DKI],
  ['Kementerian Dalam Negeri', 'Kemendagri', 'kementerian', null, ['kebijakan'], 'https://www.kemendagri.go.id', J, DKI],
  ['Badan Pengelola Dana Perkebunan', 'BPDP', 'lembaga', null, ['bioenergi', 'pembiayaan'], 'https://www.bpdp.or.id', J, DKI],
  ['Badan Riset dan Inovasi Nasional', 'BRIN', 'lembaga', null, ['riset-data'], 'https://www.brin.go.id', J, DKI],
  ['Organisasi Riset Energi dan Manufaktur BRIN', 'OR EM BRIN', 'lembaga', 'BRIN', ['riset-data', 'industri'], 'https://www.brin.go.id', 'Tangerang Selatan', 'Banten'],
  ['Badan Pengelola Investasi Daya Anagata Nusantara', 'Danantara', 'lembaga', null, ['pembiayaan'], 'https://www.danantaraindonesia.com', J, DKI],
  ['Otoritas Jasa Keuangan', 'OJK', 'lembaga', null, ['pembiayaan'], 'https://www.ojk.go.id', J, DKI],
  ['Badan Standardisasi Nasional', 'BSN', 'lembaga', null, ['industri'], 'https://bsn.go.id', J, DKI],
  ['Badan Meteorologi, Klimatologi, dan Geofisika', 'BMKG', 'lembaga', null, ['surya', 'bayu', 'riset-data'], 'https://www.bmkg.go.id', J, DKI],
  ['Badan Pusat Statistik', 'BPS', 'lembaga', null, ['riset-data'], 'https://www.bps.go.id', J, DKI],
  ['Badan Pengawas Tenaga Nuklir', 'BAPETEN', 'lembaga', null, ['nuklir', 'kebijakan'], 'https://www.bapeten.go.id', J, DKI],
  ['Badan Pengkajian dan Penerapan Teknologi (arsip, kini BRIN)', 'BPPT', 'lembaga', 'BRIN', ['riset-data'], null, J, DKI],
  ['Dewan Perwakilan Rakyat RI Komisi XII', 'Komisi XII DPR', 'dpr', 'DPR RI', ['kebijakan'], 'https://www.dpr.go.id', J, DKI],
  ['Perusahaan Listrik Negara', 'PLN', 'lembaga', 'Danantara', ['jaringan'], 'https://web.pln.co.id', J, DKI],
  // think tank / LSM / riset
  ['Institute for Essential Services Reform', 'IESR', 'think-tank', null, ['transisi-adil', 'surya', 'riset-data'], 'https://iesr.or.id', J, DKI],
  ['Indonesia Climate Change Panel (IPCC Indonesia / Dewan Nasional Perubahan Iklim)', 'IPCC Indonesia', 'think-tank', null, ['karbon', 'riset-data'], null, J, DKI],
  ['World Resources Institute Indonesia', 'WRI Indonesia', 'think-tank', 'WRI', ['transisi-adil', 'karbon'], 'https://wri-indonesia.org', J, DKI],
  ['Climate Policy Initiative Indonesia', 'CPI', 'think-tank', 'CPI', ['pembiayaan'], 'https://www.climatepolicyinitiative.org', J, DKI],
  ['Indonesian Center for Environmental Law', 'ICEL', 'lsm', null, ['kebijakan'], 'https://icel.or.id', J, DKI],
  ['Purnomo Yusgiantoro Center', 'PYC', 'think-tank', null, ['kebijakan', 'riset-data'], 'https://purnomoyusgiantorocenter.org', J, DKI],
  ['Ember Indonesia', 'Ember', 'think-tank', 'Ember', ['riset-data', 'transisi-adil'], 'https://ember-energy.org', J, DKI],
  ['Koalisi Rakyat untuk Keadilan Iklim dan Energi (Koaksi Indonesia)', 'Koaksi', 'lsm', null, ['transisi-adil'], 'https://koaksi-indonesia.org', J, DKI],
  ['Trend Asia', 'Trend Asia', 'lsm', null, ['transisi-adil'], 'https://trendasia.org', J, DKI],
  ['Yayasan Indonesia Cerah', 'Indonesia Cerah', 'lsm', null, ['transisi-adil'], 'https://cerah.or.id', J, DKI],
  ['Center of Economic and Law Studies', 'CELIOS', 'think-tank', null, ['transisi-adil', 'pembiayaan'], 'https://celios.co.id', J, DKI],
  ['Institute for Economic and Social Research FEB UI (LPEM)', 'LPEM UI', 'think-tank', 'Universitas Indonesia', ['riset-data'], 'https://lpem.org', 'Depok', 'Jawa Barat'],
  ['Yayasan Mitra Hijau', 'Mitra Hijau', 'lsm', null, ['karbon'], null, J, DKI],
  ['Institut Teknologi Bandung - Pusat Studi Energi (Center for Renewable Energy Studies)', 'ITB PSE', 'universitas', 'ITB', ['riset-data'], 'https://www.itb.ac.id', 'Bandung', 'Jawa Barat'],
  ['Pusat Studi Energi Universitas Gadjah Mada', 'PSE UGM', 'universitas', 'UGM', ['riset-data'], 'https://pse.ugm.ac.id', 'Sleman', 'DI Yogyakarta'],
  ['Pusat Penelitian Energi Universitas Indonesia (Pusat Kajian Energi / Fakultas Teknik)', 'UI Energi', 'universitas', 'Universitas Indonesia', ['riset-data'], 'https://www.ui.ac.id', 'Depok', 'Jawa Barat'],
  ['Institut Teknologi Sepuluh Nopember - Pusat Studi Energi', 'ITS Energi', 'universitas', 'ITS', ['riset-data'], 'https://www.its.ac.id', 'Surabaya', 'Jawa Timur'],
  ['Universitas Diponegoro - Pusat Studi Energi dan Konversi', 'Undip Energi', 'universitas', 'Undip', ['riset-data'], 'https://www.undip.ac.id', 'Semarang', 'Jawa Tengah'],
  ['Universitas Brawijaya - Pusat Studi Energi', 'UB Energi', 'universitas', 'UB', ['riset-data'], 'https://ub.ac.id', 'Malang', 'Jawa Timur'],
  ['Institut Pertanian Bogor - Surfactant and Bioenergy Research Center', 'SBRC IPB', 'universitas', 'IPB', ['bioenergi'], 'https://ipb.ac.id', 'Bogor', 'Jawa Barat'],
  ['Universitas Hasanuddin - Pusat Studi Energi', 'Unhas Energi', 'universitas', 'Unhas', ['riset-data'], 'https://unhas.ac.id', 'Makassar', 'Sulawesi Selatan'],
  ['Institut Teknologi Del', 'IT Del', 'universitas', null, ['surya'], 'https://www.del.ac.id', 'Toba', 'Sumatera Utara'],
  ['Universitas Pertamina', 'UPER', 'universitas', 'Pertamina', ['riset-data'], 'https://universitaspertamina.ac.id', J, DKI],
  // donor
  ['Deutsche Gesellschaft für Internationale Zusammenarbeit Indonesia (GIZ)', 'GIZ', 'donor', null, ['kebijakan', 'efisiensi'], 'https://www.giz.de/en/worldwide/361.html', J, DKI],
  ['Asian Development Bank Indonesia Resident Mission', 'ADB', 'donor', null, ['pembiayaan'], 'https://www.adb.org/countries/indonesia/main', J, DKI],
  ['World Bank Indonesia', 'World Bank', 'donor', null, ['pembiayaan'], 'https://www.worldbank.org/en/country/indonesia', J, DKI],
  ['Sekretariat JETP Indonesia', 'JETP', 'donor', null, ['transisi-adil', 'pembiayaan'], 'https://jetp-id.org', J, DKI],
  ['United Nations Development Programme Indonesia', 'UNDP', 'donor', null, ['transisi-adil'], 'https://www.undp.org/indonesia', J, DKI],
  ['Agence Française de Développement Jakarta', 'AFD', 'donor', null, ['pembiayaan'], 'https://www.afd.fr/en/page-region-pays/indonesia', J, DKI],
  ['KfW Entwicklungsbank Jakarta', 'KfW', 'donor', null, ['pembiayaan'], 'https://www.kfw-entwicklungsbank.de', J, DKI],
  ['Japan International Cooperation Agency Indonesia', 'JICA', 'donor', null, ['pembiayaan', 'jaringan'], 'https://www.jica.go.jp/overseas/indonesia/english/office/index.html', J, DKI],
  ['USAID Indonesia (dibubarkan 2025, arsip)', 'USAID', 'donor', null, ['kebijakan'], 'https://www.usaid.gov/indonesia', J, DKI],
  ['Kedutaan Besar Selandia Baru di Jakarta', 'NZ Embassy', 'donor', null, ['panas-bumi'], 'https://www.mfat.govt.nz/en/countries-and-regions/south-east-asia/indonesia/new-zealand-embassy-jakarta', J, DKI],
  ['Kedutaan Besar Inggris di Jakarta (FCDO)', 'UK Embassy', 'donor', null, ['kebijakan', 'pembiayaan'], 'https://www.gov.uk/world/organisations/british-embassy-jakarta', J, DKI],
  ['International Renewable Energy Agency', 'IRENA', 'donor', null, ['riset-data'], 'https://www.irena.org', 'Abu Dhabi', 'Luar negeri'],
  ['International Energy Agency', 'IEA', 'donor', null, ['riset-data'], 'https://www.iea.org', 'Paris', 'Luar negeri'],
  ['Asian Infrastructure Investment Bank', 'AIIB', 'donor', null, ['pembiayaan'], 'https://www.aiib.org', 'Beijing', 'Luar negeri'],
  ['International Finance Corporation Indonesia', 'IFC', 'donor', 'World Bank', ['pembiayaan'], 'https://www.ifc.org', J, DKI],
  ['Kedutaan Besar Denmark di Jakarta', 'Denmark Embassy', 'donor', null, ['bayu'], 'https://indonesien.um.dk', J, DKI],
];
// 38 provinsi: [provinsi, ibu kota, domain kandidat]
const PROV = [['Aceh', 'Banda Aceh', 'esdm.acehprov.go.id'], ['Sumatera Utara', 'Medan', 'distamben.sumutprov.go.id'], ['Sumatera Barat', 'Padang', 'esdm.sumbarprov.go.id'], ['Riau', 'Pekanbaru', 'esdm.riau.go.id'], ['Kepulauan Riau', 'Tanjungpinang', 'esdm.kepriprov.go.id'], ['Jambi', 'Jambi', 'esdm.jambiprov.go.id'], ['Sumatera Selatan', 'Palembang', 'esdm.sumselprov.go.id'], ['Bangka Belitung', 'Pangkalpinang', 'esdm.babelprov.go.id'], ['Bengkulu', 'Bengkulu', 'esdm.bengkuluprov.go.id'], ['Lampung', 'Bandar Lampung', 'esdm.lampungprov.go.id'], ['DKI Jakarta', 'Jakarta', 'dsdm.jakarta.go.id'], ['Banten', 'Serang', 'esdm.bantenprov.go.id'], ['Jawa Barat', 'Bandung', 'esdm.jabarprov.go.id'], ['Jawa Tengah', 'Semarang', 'esdm.jatengprov.go.id'], ['DI Yogyakarta', 'Yogyakarta', 'esdm.jogjaprov.go.id'], ['Jawa Timur', 'Surabaya', 'esdm.jatimprov.go.id'], ['Bali', 'Denpasar', 'esdm.baliprov.go.id'], ['Nusa Tenggara Barat', 'Mataram', 'esdm.ntbprov.go.id'], ['Nusa Tenggara Timur', 'Kupang', 'esdm.nttprov.go.id'], ['Kalimantan Barat', 'Pontianak', 'esdm.kalbarprov.go.id'], ['Kalimantan Tengah', 'Palangka Raya', 'esdm.kalteng.go.id'], ['Kalimantan Selatan', 'Banjarbaru', 'esdm.kalselprov.go.id'], ['Kalimantan Timur', 'Samarinda', 'esdm.kaltimprov.go.id'], ['Kalimantan Utara', 'Tanjung Selor', 'esdm.kaltaraprov.go.id'], ['Sulawesi Utara', 'Manado', 'esdm.sulutprov.go.id'], ['Gorontalo', 'Gorontalo', 'esdm.gorontaloprov.go.id'], ['Sulawesi Tengah', 'Palu', 'esdm.sultengprov.go.id'], ['Sulawesi Barat', 'Mamuju', 'esdm.sulbarprov.go.id'], ['Sulawesi Selatan', 'Makassar', 'esdm.sulselprov.go.id'], ['Sulawesi Tenggara', 'Kendari', 'esdm.sultraprov.go.id'], ['Maluku', 'Ambon', 'esdm.malukuprov.go.id'], ['Maluku Utara', 'Sofifi', 'esdm.malutprov.go.id'], ['Papua', 'Jayapura', 'esdm.papua.go.id'], ['Papua Barat', 'Manokwari', 'esdm.papuabaratprov.go.id'], ['Papua Barat Daya', 'Sorong', 'esdm.papuabaratdayaprov.go.id'], ['Papua Selatan', 'Merauke', 'esdm.papuaselatanprov.go.id'], ['Papua Tengah', 'Nabire', 'esdm.papuatengahprov.go.id'], ['Papua Pegunungan', 'Wamena', 'esdm.papuapegununganprov.go.id']];

export function bangunSeed() {
  const rows = BENIH.map(([nama, singkatan, jenis, induk, kepakaran, situs, kota, provinsi]) => ({ nama, singkatan, jenis, induk, kepakaran, situs, kota, provinsi }));
  for (const [prov, kota, dom] of PROV) rows.push({ nama: `Dinas ESDM Provinsi ${prov}`, singkatan: `ESDM ${prov}`, jenis: 'pemda', induk: `Pemerintah Provinsi ${prov}`, kepakaran: ['kebijakan'], situs: null, situs_kandidat: 'https://' + dom, kota, provinsi: prov });
  return rows.map((r) => ({
    lembaga_id: idL(r.nama), nama: r.nama, singkatan: r.singkatan, jenis: r.jenis, induk: r.induk, kepakaran: r.kepakaran,
    situs: r.situs, situs_kandidat: r.situs_kandidat ?? null,
    kontak: { alamat_kantor: null, kota: r.kota, provinsi: r.provinsi, telepon: [], surel: [], lat: null, lng: null, sumber_url: null },
    tahun_berdiri: null, dasar_hukum: null,
    sumber: [{ id: 'benih', url: null, keterangan: 'pengetahuan peneliti METI, belum diverifikasi sumber primer', tanggal_periksa: HARI_INI, tingkat_bukti: 'inferensi' }],
    verifikasi: { situs_ok: false, http: null, judul: null, tanggal_periksa: null },
    pengurus_status: 'belum-dibaca',
  }));
}

// ---------- ekstraksi kontak (hanya generik lembaga) ----------
const LOKAL_GENERIK = /^(info|humas|contact|kontak|sekretariat|secretariat|admin|office|press|media|hello|halo|layanan|redaksi|pr|ppid|cs|customer)([._-]|\d|@)/i;
export function ekstrak(html) {
  const surel = [...new Set([...html.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map((m) => m[0].toLowerCase()).filter((e) => LOKAL_GENERIK.test(e) && !/\.(png|jpg|svg|webp)$/.test(e)))].slice(0, 3);
  const telepon = [...new Set([...html.matchAll(/href="tel:([+\d\s().-]{7,20})"/gi)].map((m) => m[1].trim()))].slice(0, 3);
  const txt = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const a = txt.match(/\b(Jl\.|Jalan|Gedung)\s[^|]{8,150}?(?:\b\d{5}\b|Indonesia)/);
  const ld = html.match(/"streetAddress"\s*:\s*"([^"]{8,150})"/);
  const alamat = (ld ? ld[1] : a ? a[0] : null);
  const judul = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.replace(/\s+/g, ' ').trim().slice(0, 140) ?? null;
  return { surel, telepon, alamat: alamat ? alamat.trim() : null, judul };
}
const slug = (u) => u.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 120);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let terakhir = 0; const robots = new Map();
async function tunggu(u) { const d = Date.now() - terakhir; if (d < GAP_MS) await sleep(GAP_MS - d); terakhir = Date.now(); return fetch(u, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(20000) }); }
async function robotsOk(u) {
  const { origin, pathname } = new URL(u);
  if (!robots.has(origin)) {
    const aturan = [];
    try { const r = await tunggu(origin + '/robots.txt'); if (r.status === 200) { let ua = false; for (const b of (await r.text()).split(/\r?\n/)) { const m = b.match(/^\s*([a-z-]+)\s*:\s*(.*?)\s*(#.*)?$/i); if (!m) continue; const k = m[1].toLowerCase(); if (k === 'user-agent') ua = m[2] === '*'; else if (ua && k === 'disallow' && m[2]) aturan.push(m[2]); } } } catch {}
    robots.set(origin, aturan);
  }
  return !robots.get(origin).some((p) => pathname.startsWith(p.replace(/\*.*$/, '')));
}
const gagal = [];
async function ambil(u) { // -> {status, html} | null ; 403/429 = hentikan host (bukan seluruh proses; tiap host sekali)
  const f = path.join(RAW, slug(u) + '.html');
  if (fs.existsSync(f)) return { status: 200, html: fs.readFileSync(f, 'utf8') };
  const host = new URL(u).host;
  if (diblok.has(host)) return null;
  if (!(await robotsOk(u))) { gagal.push({ url: u, alasan: 'robots-tolak', tanggal: HARI_INI }); return null; }
  try {
    const r = await tunggu(u);
    if (r.status === 403 || r.status === 429) { diblok.add(host); gagal.push({ url: u, alasan: 'http-' + r.status + '-host-dihentikan', tanggal: HARI_INI }); return null; }
    if (r.status !== 200) { gagal.push({ url: u, alasan: 'http-' + r.status, tanggal: HARI_INI }); return null; }
    const html = Buffer.from(await r.arrayBuffer()).toString('utf8');
    fs.writeFileSync(f, html); return { status: 200, html };
  } catch (e) { gagal.push({ url: u, alasan: 'galat:' + (e.cause?.code || e.message).slice(0, 60), tanggal: HARI_INI }); return null; }
}
const diblok = new Set();

async function verifikasi(hanya) {
  fs.mkdirSync(RAW, { recursive: true });
  const rows = baca(F('lembaga.jsonl'));
  let n = 0;
  for (const r of rows) {
    if (hanya && !norm(r.nama).includes(norm(hanya))) continue;
    if (r.verifikasi.tanggal_periksa) continue; // resumable
    const base = r.situs || r.situs_kandidat;
    if (!base) { r.verifikasi.tanggal_periksa = HARI_INI; continue; }
    let h = await ambil(base);
    r.verifikasi.tanggal_periksa = HARI_INI;
    if (!h) { r.verifikasi.http = null; continue; }
    r.verifikasi.situs_ok = true; r.verifikasi.http = 200;
    let e = ekstrak(h.html); r.verifikasi.judul = e.judul;
    if (!r.situs) r.situs = base;
    // satu hop ke halaman kontak bila belum ada alamat/surel
    if (!e.alamat && !e.surel.length) {
      const m = h.html.match(/href="([^"#]*(?:kontak|contact|hubungi)[^"#]*)"/i);
      if (m) { try { const u = new URL(m[1], base).href; if (new URL(u).host === new URL(base).host) { const h2 = await ambil(u); if (h2) { const e2 = ekstrak(h2.html); e = { ...e, surel: e2.surel, telepon: e2.telepon.length ? e2.telepon : e.telepon, alamat: e2.alamat }; r.kontak.sumber_url = u; } } } catch {} }
    }
    if (e.alamat || e.surel.length || e.telepon.length) {
      r.kontak = { ...r.kontak, alamat_kantor: e.alamat, telepon: e.telepon, surel: e.surel, sumber_url: r.kontak.sumber_url || base };
    }
    r.sumber.push({ id: 'situs', url: base, keterangan: 'halaman situs resmi lembaga', tanggal_periksa: HARI_INI, tingkat_bukti: 'situs-sendiri' });
    if (++n % 10 === 0) { tulis(F('lembaga.jsonl'), rows); tulis(F('gagal.jsonl'), gagal); }
  }
  tulis(F('lembaga.jsonl'), rows); tulis(F('gagal.jsonl'), gagal);
  console.log('diverifikasi', n, 'gagal', gagal.length);
}

// ---------- pengurus: tautan orang_id hanya bila organisasi cocok persis dengan nama lembaga/singkatan ----------
const ALIAS_ORG = { 'masyarakat energi terbarukan indonesia (meti)': 'METI', 'dpr ri komisi xii': 'Komisi XII DPR', 'kementerian esdm': 'ESDM', 'asosiasi energi surya indonesia (aesi)': 'AESI', 'dewan energi nasional (den)': 'DEN', 'bappenas': 'Bappenas', 'kementerian koordinator bidang perekonomian': 'Kemenko Perekonomian', 'kementerian keuangan': 'Kemenkeu', 'kementerian bumn': 'Kementerian BUMN', 'kementerian lingkungan hidup/kehutanan': 'KLH' };
function pengurus() {
  const lemb = baca(F('lembaga.jsonl')); const bySing = new Map(lemb.map((l) => [l.singkatan, l]));
  const orang = new Map(baca(path.join(ROOT, 'data-panen/orang/orang.jsonl')).map((o) => [o.orang_id, o]));
  const out = []; const tak = new Set();
  for (const j of baca(path.join(ROOT, 'data-panen/orang/jabatan.jsonl'))) {
    const s = ALIAS_ORG[norm(j.organisasi).replace(/ /g, ' ') ] ?? ALIAS_ORG[j.organisasi.toLowerCase()];
    const l = s && bySing.get(s); const o = orang.get(j.orang_id);
    if (!l || !o) { if (!l) tak.add(j.organisasi); continue; }
    out.push({ lembaga_id: l.lembaga_id, orang_id: j.orang_id, nama: o.nama, jabatan: j.jabatan, periode: { mulai: j.mulai ?? null, selesai: j.selesai ?? null }, status: j.status, sumber_url: j.sumber_url, foto_url: null, foto_sumber: null });
  }
  tulis(F('pengurus.jsonl'), [...out, ...baca(F('pengurus.jsonl')).filter((p) => p.asal === 'dinas')]);
  const ada = new Set(out.map((p) => p.lembaga_id));
  for (const l of lemb) l.pengurus_status = ada.has(l.lembaga_id) ? 'terisi' : 'belum-dibaca';
  tulis(F('lembaga.jsonl'), lemb);
  console.log('pengurus', out.length, 'organisasi tak terpetakan:', [...tak].join(' | '));
}

// ---------- keanggotaan ----------
function anggota() {
  const lemb = baca(F('lembaga.jsonl')); const bySing = new Map(lemb.map((l) => [l.singkatan, l])); const byNama = new Map(lemb.map((l) => [l.nama, l]));
  const out = []; const ts = HARI_INI;
  for (const l of lemb) {
    if (l.jenis === 'asosiasi' && l.induk === 'METI') out.push({ dari: l.lembaga_id, ke: bySing.get('METI').lembaga_id, jenis: 'anggota_dari', sumber_url: null, tingkat_bukti: 'inferensi', tanggal_periksa: ts, catatan: 'asosiasi mitra/anggota kolektif METI menurut benih; belum diverifikasi' });
    const induk = l.induk && (bySing.get(l.induk) || byNama.get(l.induk));
    if (induk && l.jenis !== 'asosiasi') out.push({ dari: l.lembaga_id, ke: induk.lembaga_id, jenis: 'bagian_dari', sumber_url: null, tingkat_bukti: 'inferensi', tanggal_periksa: ts });
  }
  // anggota perusahaan: dari perusahaan.jsonl bila ada penanda keanggotaan eksplisit (apamsi)
  const pf = path.join(ROOT, 'data-panen/perusahaan/perusahaan.jsonl');
  let np = 0;
  for (const p of baca(pf)) if (p.apamsi) { out.push({ dari: p.perusahaan_id, ke: bySing.get('APAMSI').lembaga_id, jenis: 'anggota_dari', sumber_url: null, tingkat_bukti: 'via-pihak-ketiga', tanggal_periksa: ts, catatan: 'dari kolom apamsi direktori perusahaan' }); np++; }
  tulis(F('keanggotaan.jsonl'), [...out, ...baca(F('keanggotaan.jsonl')).filter((k) => k.asal === 'api')]);
  console.log('keanggotaan', out.length, 'perusahaan->APAMSI', np);
}

function statistik() {
  const l = baca(F('lembaga.jsonl')); const p = baca(F('pengurus.jsonl'));
  const per = {}; l.forEach((x) => per[x.jenis] = (per[x.jenis] || 0) + 1);
  const pct = (n) => (100 * n / l.length).toFixed(1) + '%';
  const pj = new Set(p.map((x) => x.lembaga_id));
  const s = { total: l.length, per_jenis: per, pengurus: pct(pj.size), alamat: pct(l.filter((x) => x.kontak.alamat_kantor).length), kota: pct(l.filter((x) => x.kontak.kota).length), foto: pct(p.filter((x) => x.foto_url).length ? new Set(p.filter((x) => x.foto_url).map((x) => x.lembaga_id)).size : 0), situs_ok: pct(l.filter((x) => x.verifikasi.situs_ok).length), surel: pct(l.filter((x) => x.kontak.surel.length).length), gagal: baca(F('gagal.jsonl')).length, keanggotaan: baca(F('keanggotaan.jsonl')).length };
  console.log(JSON.stringify(s, null, 1)); return s;
}

// ---------- pengurus METI dari halaman resmi (SSR) ----------
const GELAR = /\b(prof|drg|dr|drs|dra|ir|h|hj|ing|eng|se|sh|st|mt|mm|mba|msc|ma|mh|mkn|sip|ssi|spd|phd|ak|ipu|mpm|meng|mem|mse|ms|mpd|msi|cla|cra|s|bapak|ibu)\b/gi;
export const kunciNama = (n) => n.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/,.*$/, '').replace(/\./g, ' ').replace(GELAR, ' ').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
const bersihNama = (n) => n.replace(/^(Bapak|Ibu)\s+/, '').split(',')[0].replace(/^(?:(?:Prof|Dr|Drs|Dra|Ir|Ing|Eng|H|Hj)\.?\s+)+/i, '').trim();
export function uraiMeti(html) {
  const t = html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<img[^>]*src="([^"]*)"[^>]*>/g, ' [IMG:$1] ').replace(/<\/(div|p|h\d|li|section|span)>/g, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
  let L = t.split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const a = L.findIndex((s, i) => s === 'Dewan' && /^\d+ pengurus$/.test(L[i + 1]));
  const z = L.findIndex((s) => s.startsWith('Jejaring energi terbarukan'));
  L = L.slice(a, z);
  const out = []; let top = '', sub = '', jab = null, foto = null, no = 0;
  const tambah = (nama_lengkap, jabatan, bidang, foto_path) => out.push({ nama_lengkap, nama: bersihNama(nama_lengkap), jabatan, kelompok: top, subkelompok: sub, bidang: bidang || null, urutan: out.length + 1, foto_path: foto_path || null });
  for (let i = 0; i < L.length; i++) {
    const s = L[i];
    if (/^\d+ pengurus$/.test(s)) { const judul = L[i - 1]; if (/(^|\s)\d\d$/.test(L[i - 2] || '') || i === 1) { top = judul; sub = ''; } else sub = judul; continue; }
    const m = s.match(/^(?:\[IMG:(.+?)\] )?(\d\d)$/);
    if (m && L[i + 1] && !/pengurus$/.test(L[i + 2] || '')) {
      let foto_path = m[1] || null;
      if (!foto_path && L[i - 1] === 'Foto belum tersedia') foto_path = null;
      const jabatan = L[i + 1], nama = L[i + 2]; let bidang = null; let j = i + 3;
      if (/^Ketua Bidang/.test(jabatan) && !/^(Lihat|Foto|\[IMG|\d\d$)/.test(L[j])) bidang = L[j++];
      tambah(nama, jabatan, bidang, foto_path);
      let n = 0;
      if (/^Lihat \d+ anggota$/.test(L[j])) { n = +L[j].match(/\d+/)[0]; j += 2; // lewati "+"
        for (let k = 0; k < n; k++) { const raw = L[j + k]; const mm = raw.match(/^(Wakil [^:]+|Koordinator[^:]*): (.+)$/);
          if (mm) tambah(mm[2], mm[1], bidang, null);
          else { const [nm, peran] = raw.split(' – '); { tambah(nm, 'Anggota ' + jabatan.replace(/^Ketua /, '') + (/Ex-Officio/.test(raw) ? ' (Ex-Officio)' : ''), bidang, null); if (peran) out[out.length - 1].keterangan = peran.replace(/\s*\(Ex-Officio\)/, ''); } } }
        j += n; }
      i = j - 1;
    }
  }
  return out;
}
async function unduhFoto(u, tujuan) {
  if (fs.existsSync(tujuan)) return true;
  if (!(await robotsOk(u))) return false;
  try { const r = await tunggu(u); if (r.status === 403 || r.status === 429) { console.error('BERHENTI', r.status); process.exit(3); } if (r.status !== 200 || !/^image\//.test(r.headers.get('content-type') || '')) { gagal.push({ url: u, alasan: 'foto-http-' + r.status, tanggal: HARI_INI }); return false; } fs.mkdirSync(path.dirname(tujuan), { recursive: true }); fs.writeFileSync(tujuan, Buffer.from(await r.arrayBuffer())); return true; }
  catch (e) { gagal.push({ url: u, alasan: 'foto-galat', tanggal: HARI_INI }); return false; }
}
async function metiPengurus() {
  const SUMBER = 'https://metiires.or.id/about/meettheteam';
  const h = await ambil(SUMBER); if (!h) { console.error('halaman METI tak terambil'); return; }
  const rows = uraiMeti(h.html);
  const idx = new Map(); for (const o of baca(path.join(ROOT, 'data-panen/orang/orang.jsonl'))) { const k = kunciNama(o.nama); idx.set(k, [...(idx.get(k) || []), o.orang_id]); }
  for (const r of rows) {
    const ids = idx.get(kunciNama(r.nama)) || [];
    r.orang_id = ids.length === 1 ? ids[0] : null; if (ids.length > 1) r.catatan = 'nama ganda di orang.jsonl';
    r.periode = '2025–2028'; r.sumber_url = SUMBER; r.tanggal_ambil = HARI_INI;
    r.foto_url = r.foto_path ? new URL(r.foto_path, 'https://metiires.or.id').href : null; r.foto_sumber = r.foto_url ? SUMBER : null; r.foto_file = null;
    if (r.foto_url) { const fn = path.basename(r.foto_path); if (await unduhFoto(r.foto_url, path.join(OUT, 'foto/meti', fn))) r.foto_file = 'foto/meti/' + fn; }
    delete r.foto_path;
  }
  tulis(F('pengurus-meti.jsonl'), rows); tulis(F('gagal.jsonl'), [...baca(F('gagal.jsonl')), ...gagal]);
  const tp = rows.filter((r) => r.foto_file).length, to = rows.filter((r) => r.orang_id).length;
  console.log(`pengurus-meti ${rows.length} orang; foto ${tp} (${(100 * tp / rows.length).toFixed(0)}%); orang_id ${to}`);
}

// ---------- dinas ESDM provinsi (domain dari data-panen/temuan) + anggota API ----------
export function kepalaDinas(teksPolos) {
  const L = teksPolos.split('\n').map((s) => s.trim()).filter(Boolean);
  const namaOk = (s) => s && s.length < 70 && !/\d/.test(s) && s.split(' ').length >= 2 && s.split(' ').length <= 9 && /^[A-Z]/.test(s) && !/(dinas|provinsi|selamat|kepala|bidang|sekretaris|visi|misi|terima|struktur|organisasi|kasih)/i.test(s) && s !== s.toUpperCase();
  for (let i = 0; i < L.length; i++) {
    if (/^kepala dinas( energi dan sumber daya mineral)?( provinsi [\w\s]+)?$/i.test(L[i])) {
      for (const c of [L[i - 1], L[i + 1]]) if (namaOk(c)) return c.replace(/\s+/g, ' ');
    }
    const m = L[i].match(/^(.{5,60}?)\s*[-,–]\s*Kepala Dinas\b/i); if (m && namaOk(m[1])) return m[1];
  }
  return null;
}
async function dinas() {
  fs.mkdirSync(RAW, { recursive: true });
  const tem = baca(path.join(ROOT, 'data-panen/temuan/dinas_esdm.jsonl'));
  const rows = baca(F('lembaga.jsonl'));
  const orang = new Map(); for (const o of baca(path.join(ROOT, 'data-panen/orang/orang.jsonl'))) { const k = kunciNama(o.nama); orang.set(k, [...(orang.get(k) || []), o.orang_id]); }
  const peng = baca(F('pengurus.jsonl')).filter((p) => p.asal !== 'dinas'); let kepalaN = 0, ok = 0;
  for (const t of tem) {
    const r = rows.find((x) => x.jenis === 'pemda' && x.kontak.provinsi === t.provinsi); if (!r) { console.error('tak ada', t.provinsi); continue; }
    r.situs = t.url; r.situs_kandidat = null; r.sumber = r.sumber.filter((s) => s.id !== 'situs'); r.verifikasi.tanggal_periksa = HARI_INI;
    const h = await ambil(t.url); if (!h) { r.verifikasi.situs_ok = false; continue; }
    ok++; r.verifikasi.situs_ok = true; r.verifikasi.http = 200;
    let e = ekstrak(h.html); r.verifikasi.judul = e.judul; let teksSemua = h.html;
    const tautan = [...new Set([...h.html.matchAll(/href="([^"#]+)"/gi)].map((m) => m[1]).filter((u) => /(kontak|contact|hubungi|profil|pimpinan|pejabat|struktur|tentang|kepala-dinas|sambutan)/i.test(u)))].slice(0, 4);
    for (const u of tautan) { try { const abs = new URL(u, t.url).href; if (new URL(abs).host !== new URL(t.url).host) continue; const h2 = await ambil(abs); if (!h2) continue; teksSemua += '\n' + h2.html; const e2 = ekstrak(h2.html); if (!e.alamat && e2.alamat) { e.alamat = e2.alamat; r.kontak.sumber_url = abs; } if (!e.surel.length) e.surel = e2.surel; if (!e.telepon.length) e.telepon = e2.telepon; } catch {} }
    r.kontak = { ...r.kontak, alamat_kantor: e.alamat?.replace(/&amp;/g, '&') ?? null, telepon: e.telepon, surel: e.surel, sumber_url: r.kontak.sumber_url || t.url };
    r.sumber.push({ id: 'situs', url: t.url, keterangan: 'situs resmi dinas (temuan ' + t.keyakinan + ')', tanggal_periksa: HARI_INI, tingkat_bukti: 'situs-sendiri' });
    const plain = teksSemua.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<\/(p|div|li|h\d|td|tr|span|strong|b)>|<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ');
    const kd = kepalaDinas(plain);
    if (kd) { const id = orang.get(kunciNama(kd)) || []; kepalaN++; peng.push({ lembaga_id: r.lembaga_id, orang_id: id.length === 1 ? id[0] : null, nama: bersihNama(kd), nama_lengkap: kd, jabatan: 'Kepala Dinas', periode: null, status: 'menjabat', sumber_url: t.url, tingkat_bukti: 'situs-sendiri', foto_url: null, foto_sumber: null, asal: 'dinas' }); }
    r.pengurus_status = kd ? 'terisi' : 'belum-dibaca';
    tulis(F('lembaga.jsonl'), rows); tulis(F('pengurus.jsonl'), peng);
  }
  tulis(F('gagal.jsonl'), [...baca(F('gagal.jsonl')).filter((g) => !gagal.some((x) => x.url === g.url)), ...gagal]);
  console.log(`dinas: ${tem.length} domain, ${ok} terbaca, ${kepalaN} kepala dinas`);
}
function anggotaApi() {
  const h = fs.readFileSync(path.join(RAW, 'inaga_api_or_id_association_member.html'), 'utf8');
  const t = h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<\/(div|p|h\d|li|tr|td|a)>/g, '\n').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s*\n\s*/g, '\n');
  const L = t.split('\n').map((s) => s.trim()).filter(Boolean);
  const a = L.findIndex((s) => /^PT\. EDC Indonesia/.test(s)), z = L.findIndex((s) => /^Copyright/.test(s));
  const nama = L.slice(a, z).filter((s) => s !== 'details');
  const lemb = baca(F('lembaga.jsonl')); const api = lemb.find((l) => l.singkatan === 'API');
  const per = baca(path.join(ROOT, 'data-panen/perusahaan/perusahaan.jsonl'));
  const pk = (s) => norm(s).replace(/\b(pt|tbk|ltd|persero|indonesia|co)\b/g, '').replace(/\s+/g, ' ').trim();
  const idx = new Map(per.map((p) => [pk(p.nama), p.perusahaan_id]));
  const sisa = baca(F('keanggotaan.jsonl')).filter((k) => k.ke !== api.lembaga_id || k.jenis !== 'anggota_dari' || k.asal !== 'api');
  let cocok = 0;
  for (const n of nama) { const pid = idx.get(pk(n)) || null; if (pid) cocok++;
    sisa.push({ dari: pid, dari_nama: n, ke: api.lembaga_id, jenis: 'anggota_dari', sumber_url: 'https://inaga-api.or.id/association/member/', tingkat_bukti: 'situs-sendiri', tanggal_periksa: HARI_INI, asal: 'api' }); }
  tulis(F('keanggotaan.jsonl'), sisa);
  console.log('anggota API', nama.length, 'tertaut ke perusahaan_id', cocok);
}

function selftest() {
  const e = ekstrak('<title>X</title><a href="mailto:info@example.org">a</a>budi.santoso@example.org <a href="tel:+62 21 0000 0000">t</a>Jl. Merdeka No. 5, Jakarta 10110');
  assert.deepEqual(e.surel, ['info@example.org']); assert.equal(e.telepon.length, 1); assert.match(e.alamat, /Merdeka/);
  const s = bangunSeed(); assert.equal(new Set(s.map((x) => x.lembaga_id)).size, s.length);
  assert.ok(s.filter((x) => x.jenis === 'pemda').length === 38);
  console.log('selftest ok', s.length);
}

const arg = process.argv[2] || '';
if (arg === '--selftest') selftest();
else if (arg === '--seed') { const s = bangunSeed(); const lama = new Map(baca(F('lembaga.jsonl')).map((x) => [x.lembaga_id, x])); tulis(F('lembaga.jsonl'), s.map((x) => lama.get(x.lembaga_id) ?? x)); console.log('seed', s.length); }
else if (arg.startsWith('--verifikasi')) await verifikasi((process.argv.find((a) => a.startsWith('--hanya=')) || '').slice(8));
else if (arg === '--meti') await metiPengurus();
else if (arg === '--dinas') await dinas();
else if (arg === '--anggota-api') anggotaApi();
else if (arg === '--pengurus') pengurus();
else if (arg === '--anggota') anggota();
else if (arg === '--statistik') statistik();
else console.log('pakai: --selftest | --seed | --verifikasi | --pengurus | --anggota | --statistik');
