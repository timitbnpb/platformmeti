// Pembangun public/data/global/purnajual.json (offline; ditranskripsi dari bacaan 2026-11-08).
// Hanya badan usaha dan kota; tanpa telepon/surel pribadi. Bila tak terbaca: null + CELAH. Garansi global tidak diklaim berlaku di Indonesia.
export const TANGGAL = '2026-11-08';
const S = (id, judul, penerbit, url, tingkat_bukti, catatan) => ({ id, judul, penerbit, url, tingkat_bukti, tanggal_akses: TANGGAL, ...(catatan ? { catatan } : {}) });
export const SUMBER = [
  S('s-sungrow-summit', 'Sungrow case: Summit Solar Indonesia, Core Distributor for Inverters & Storage Solutions (pra-penjualan sampai purnajual)', 'Sungrow', 'https://www.sungrowpower.com/en/case/distributors/Summit-Solar-Indonesia', 'resmi', 'Isi laman dari ringkasan pencarian, tidak dibuka.'),
  S('s-sungrow-glints', 'PT Sungrow Power Indonesia, kantor Sudirman Central Business District, Jakarta', 'Glints (lowongan kerja)', 'https://glints.com/id/en/companies/pt-sungrow-power-indonesia/83318d82-057a-432b-b96a-12340a339cb8', 'media', 'Sumber pihak ketiga; alamat tidak disalin.'),
  S('s-sungrow-hub', 'Sungrow Service Repair Hub and Training Center', 'Sungrow', 'https://en.sungrowpower.com/lineServiceDetail/197', 'resmi', 'Halaman umum; lokasi hub tidak disebut, tidak dikaitkan ke Indonesia.'),
  S('s-huawei-id', 'Huawei Smart PV Indonesia: dukungan online, hotline, permintaan layanan, tinjauan garansi', 'Huawei Digital Power', 'https://solar.huawei.com/id', 'resmi', 'Kanal dukungan resmi; tidak ada daftar pusat servis.'),
  S('s-huawei-warranty', 'HUAWEI Warranty and Service Conditions for Smart PV Products', 'Huawei Digital Power', 'https://solar.huawei.com/~/media/Solar/attachment/pdf/apac/service/download/HUAWEI_Warranty_and_Service_Conditions_for_Smart_PV_Products4.pdf', 'resmi', 'Dokumen kawasan APAC/EU; sebagian model 60 bulan dihitung mulai 180 hari setelah kirim. Berlaku untuk Indonesia tidak dikonfirmasi.'),
  S('s-huawei-jjlapp', 'Huawei Digital Power luncurkan FusionSolar terbaru (Selular.ID, Okt 2024): JJ-LAPP Indonesia Authorized Partner sejak 2020', 'Selular.ID', 'https://selular.id/2024/10/dorong-penggunaan-tenaga-surya-huawei-perkenalkan-solusi-fusionsolar-terbaru/', 'media', 'Dari ringkasan pencarian, artikel tidak dibuka.'),
  S('s-goodwe-id', 'GoodWe Empowers Indonesia\'s Renewable Future (Jakarta forum, SolarQuarter 4 Nov 2025); masuk Indonesia sejak 2011', 'SolarQuarter / GoodWe', 'https://solarquarter.com/2025/11/04/goodwe-empowers-indonesias-renewable-future-at-empowering-solar-solutions-jakarta-forum/', 'media', 'Menyebut manajer negara dan jaringan servis tumbuh; badan usaha tidak disebut.'),
  S('s-goodwe-krannich', 'GoodWe inverters are now available from Krannich Solar in Southeast Asia', 'pv magazine', 'https://www.pv-magazine.com/press-releases/goodwe-inverters-are-now-available-from-krannich-solar-in-southeast-asia', 'media', 'Krannich: grosir regional; merek utama termasuk SMA, SolarEdge, Fronius, JA Solar, LONGi. Representasi lokal Indonesia disebut dari ringkasan pencarian.'),
  S('s-longi-utomo', 'LONGi gandeng Utomo SolaRUV (Liputan6): Utomo SolaRUV distributor resmi panel LONGi, panel berlabel SNI', 'Liputan6', 'https://www.liputan6.com/on-off/read/5022658/longi-gandeng-utomo-solaruv-garap-potensi-energi-terbarukan-dan-lapangan-kerja-hijau', 'media', 'Isi dari ringkasan pencarian.'),
  S('s-longi-pertamina', 'Pabrik Panel Surya Pertamina NRE dan LONGi Resmi Diluncurkan (Deltamas, Jawa Barat, 1,6 GW/tahun)', 'Listrik Indonesia', 'https://listrikindonesia.com/detail/17030/pabrik-panel-surya-pertamina-nre-dan-longi-resmi-diluncurkan', 'media'),
  S('s-jinko-id', 'Tiger Neo N-Type, Modul Surya Anyar JinkoSolar (Listrik Indonesia): country manager Indonesia, performa >85 persen sampai 30 tahun (klaim)', 'Listrik Indonesia', 'https://listrikindonesia.com/detail/10675/tiger-neo-n-type-modul-surya-anyar-jinkosolar-ciptakan-power-lebih-besar', 'media', 'Klaim perwakilan perusahaan, bukan syarat garansi.'),
  S('s-jinko-warranty', 'JinkoSolar Global Limited Warranty (REV112219 LINEAR): jadwal keluaran daya 25 tahun', 'JinkoSolar', 'https://www.jinkosolar.com/uploads/5e0959af/JinkoSolar-Global%20Limited%20Warranty_(REV112219-LINEAR).pdf', 'resmi', 'Dokumen global, bukan khusus Indonesia; garansi produk (workmanship) tidak terbaca.'),
  S('s-jinko-karawang', 'JinkoSolar Tiger Neo modules boosting Indonesia\'s Karawang PV project (100,78 MW)', 'PV Tech', 'https://www.pv-tech.org/industry-updates/jinkosolar-tiger-neo-modules-boosting-indonesias-karawang-pv-project/', 'media'),
  S('s-trina-warranty', 'Trinasolar: garansi hanya berlaku untuk produk dari distributor resmi (pemberitahuan Thailand/Myanmar, AU, India)', 'Trina Solar', 'https://www.trinasolar.com/en-apac/resources/newsroom/apimportant-notice-unauthorized-sales-trina-solar-products-thailand-and-myanmar/', 'resmi', 'Tidak ada pemberitahuan Indonesia yang terbaca; kebijakan umum dikutip.'),
  S('s-trina-masagra', 'Investasi US$ 100 Juta, Trina Mas Agra Dukung Ambisi Pembangkit Surya di Indonesia', 'Investortrust', 'https://www.investortrust.id/business/102000/investasi-us-100-juta-trina-mas-agra-dukung-ambisi-pembangkit-surya-di-indonesia', 'media', 'Hanya judul dan tautan; isi tidak dibuka.'),
  S('s-lg-resu', 'LG Energy Solution Michigan Recalls Home Energy Storage Batteries Due to Fire Hazard (RESU 10H); recall Des 2020, Agu 2021, Okt 2022', 'U.S. Consumer Product Safety Commission', 'https://www.cpsc.gov/Recalls/2023/LG-Energy-Solution-Michigan-Recalls-Home-Energy-Storage-Batteries-Due-to-Fire-Hazard-Recall-Alert', 'resmi', 'Recall AS. Penjualan RESU 10H di Indonesia tidak dikonfirmasi; dicatat sebagai pembanding kelas kegagalan produk.'),
  S('s-reuters-inverter', 'Hidden devices found in Chinese-made inverters in the US, reports Reuters (pv magazine, 14 Mei 2025)', 'pv magazine meringkas Reuters', 'https://www.pv-magazine.com/2025/05/14/hidden-devices-found-in-chinese-made-inverters-in-the-us-reports-reuters/', 'media', 'Dua sumber anonim menolak menyebut produsen; tidak ada produsen terbukti. Sungrow dan Huawei tidak dinamai dalam laporan; jangan dikaitkan.'),
  S('s-ssi-ja-suspend', 'SSI suspends JA Solar membership following UFLPA listing (PV Tech, 16 Jan 2025)', 'PV Tech', 'https://www.pv-tech.org/ssi-suspends-ja-solar-membership-following-uflpa-listing', 'media'),
];
// Per merek. layanan_lokal: badan usaha + kota saja. garansi: {nilai, sumber_id, berlaku_indonesia: true|false|null}.
const L = (nama, peran, kota, sumber_id, tingkat_bukti = 'media', org_id = null, catatan = null) => ({ nama, peran, kota, org_id, sumber_id, tingkat_bukti, ...(catatan ? { catatan } : {}) });
const G = (jenis, uraian, sumber_id, berlaku_indonesia, tingkat_bukti = 'resmi') => ({ jenis, uraian, sumber_id, berlaku_indonesia, tingkat_bukti });
export const MEREK = [
  { id: 'sungrow', merek: 'Sungrow', org_id: 'en_e7d96993c7', kategori: ['inverter', 'bess'],
    layanan_lokal: [L('PT Sungrow Power Indonesia', 'perwakilan', 'Jakarta', 's-sungrow-glints', 'media'), L('Summit Solar (Indonesia)', 'distributor inti inverter dan penyimpanan', null, 's-sungrow-summit', 'resmi', null, 'Kota tidak disebut sumber.')],
    garansi: [], kasus: [] },
  { id: 'huawei', merek: 'Huawei Digital Power (FusionSolar)', org_id: 'en_25e3aa9b9d', kategori: ['inverter', 'bess'],
    layanan_lokal: [L('JJ-LAPP Indonesia', 'mitra resmi (Authorized Partner) sejak 2020', null, 's-huawei-jjlapp', 'media', null, 'Peran servis tidak dikonfirmasi.')],
    kanal_resmi: [{ nama: 'Huawei Smart PV Indonesia, dukungan online dan permintaan layanan', url: 'https://solar.huawei.com/id', sumber_id: 's-huawei-id' }],
    garansi: [G('produk', 'Banyak model string SUN2000 tercantum 60 bulan, mulai 180 hari setelah pengiriman atau saat permintaan layanan resmi (mana lebih dulu)', 's-huawei-warranty', null)],
    kasus: [] },
  { id: 'goodwe', merek: 'GoodWe', org_id: 'en_2f459b31a8', kategori: ['inverter', 'bess'],
    layanan_lokal: [L('Krannich Solar (regional Asia Tenggara)', 'distributor regional', null, 's-goodwe-krannich', 'media', null, 'Representasi lokal Indonesia dari ringkasan; badan usaha tidak tercatat.')],
    garansi: [], kasus: [], catatan: 'GoodWe menyebut masuk Indonesia sejak 2011 dan jaringan servis tumbuh; tanpa nama badan usaha atau kota.' },
  { id: 'longi', merek: 'LONGi', org_id: 'en_5812c37694', kategori: ['modul'],
    layanan_lokal: [L('Utomo SolaRUV', 'distributor resmi', null, 's-longi-utomo', 'media'), L('Pertamina NRE x LONGi (pabrik modul 1,6 GW/tahun)', 'fasilitas produksi lokal', 'Deltamas, Bekasi/Jawa Barat', 's-longi-pertamina', 'media', null, 'Kota diambil dari ringkasan; ketelitian wilayah tidak diverifikasi.')],
    garansi: [], kasus: [] },
  { id: 'jinko', merek: 'JinkoSolar', org_id: 'en_15a69db346', kategori: ['modul'],
    layanan_lokal: [], kasus: [],
    garansi: [G('keluaran daya', 'Jadwal linier 25 tahun (dokumen garansi global)', 's-jinko-warranty', null)],
    catatan: 'Ada country manager Indonesia dan modul di proyek Karawang 100,78 MW (s-jinko-karawang); distributor resmi dan garansi produk Indonesia tidak ditemukan.' },
  { id: 'trina', merek: 'Trina Solar', org_id: 'en_2684d348da', kategori: ['modul'],
    layanan_lokal: [L('Trina Mas Agra', 'investor/pabrik lokal (menurut judul berita)', null, 's-trina-masagra', 'media', null, 'Peran purnajual tidak diverifikasi.')],
    garansi: [G('umum', 'Garansi produk hanya berlaku untuk pembelian dari distributor resmi', 's-trina-warranty', null)], kasus: [],
    catatan: 'Daftar distributor resmi Indonesia tidak ditemukan; minta tertulis ke Trina.' },
  { id: 'ja-solar', merek: 'JA Solar', org_id: 'en_8ce6cc9a41', kategori: ['modul'],
    layanan_lokal: [], garansi: [],
    kasus: [{ id: 'ks-jasolar-uflpa', jenis: 'pencantuman-daftar', ringkas: 'Anak usaha Donghai JA Solar masuk UFLPA (15 Jan 2025); keanggotaan SSI ditangguhkan lalu dicabut.', tanggal: '2025-01-16', sumber_id: 's-ssi-ja-suspend', relevansi_indonesia: 'Tidak ada pelarangan di Indonesia; relevan untuk proyek berpembiayaan/ekspor AS.', tingkat_bukti: 'media' }] },
  { id: 'lg-es', merek: 'LG Energy Solution (RESU, penyimpanan rumah)', org_id: 'en_e1421af365', kategori: ['bess'],
    layanan_lokal: [], garansi: [],
    kasus: [{ id: 'ks-lg-resu', jenis: 'recall', ringkas: 'RESU 10H: risiko panas berlebih/kebakaran; recall AS Des 2020, Agu 2021 (sekitar 10.000 unit) dan Okt 2022 (sekitar 11.500 unit, perbaikan perangkat lunak).', tanggal: '2022-10-27', sumber_id: 's-lg-resu', relevansi_indonesia: 'Tidak dikonfirmasi dijual di Indonesia.', tingkat_bukti: 'resmi' }] },
  { id: 'sma', merek: 'SMA', org_id: 'en_ee9533b44d', kategori: ['inverter'], layanan_lokal: [], garansi: [], kasus: [], catatan: 'Hanya muncul sebagai merek utama Krannich Solar (s-goodwe-krannich); tidak ada badan usaha Indonesia ditemukan.' },
  { id: 'canadian-solar', merek: 'Canadian Solar', org_id: 'en_0c1bf31853', kategori: ['modul', 'bess'], layanan_lokal: [], garansi: [], kasus: [], catatan: 'Tidak ada distributor Indonesia ditemukan.' },
  { id: 'growatt', merek: 'Growatt', org_id: null, kategori: ['inverter'], layanan_lokal: [], garansi: [], kasus: [], catatan: 'Hanya informasi global ditemukan; bukan di pemasok_*.json.' },
];
export const KASUS_LINTAS = [
  { id: 'ks-reuters-inverter', jenis: 'keamanan-siber', ringkas: 'Laporan Reuters (14 Mei 2025): perangkat komunikasi tak terdokumentasi di sebagian inverter dan baterai buatan Tiongkok di AS; bisa mematikan/mengubah pengaturan dari jauh.', tanggal: '2025-05-14', sumber_id: 's-reuters-inverter', merek_ids: [], catatan: 'Produsen tidak disebut; tidak dikaitkan ke merek mana pun.', tingkat_bukti: 'media' },
];
export const CELAH = [
  'Daftar resmi pusat servis/distributor per merek di Indonesia hanya ada sebagian; yang disusun adalah badan usaha yang tersirat di berita atau laman resmi, bukan direktori yang diverifikasi.',
  'Garansi yang berlaku di Indonesia (produk dan kinerja) hampir tidak ada dokumen khusus Indonesia; dokumen global/APAC dicatat dengan berlaku_indonesia: null.',
  'Merek tanpa temuan: Growatt, SMA, Canadian Solar, Solis, Fronius, SolarEdge, Victron, Deye; kosong bukan berarti tidak ada layanan.',
  'Kasus kegagalan/recall di Indonesia (BPOM, Kemendag, ESDM) tidak ditemukan; yang tercatat adalah recall AS dan laporan siber global.',
  'Nama badan usaha mitra tidak disertai kota/alamat bila sumber tidak menyebutnya.',
];
export function bangun() {
  return { lapis: 'publik', dibangun_pada: TANGGAL, _catatan: 'Purnajual EBT per merek di Indonesia: badan usaha dan kota saja, tanpa kontak pribadi.', sumber: SUMBER, merek: MEREK, kasus_lintas: KASUS_LINTAS, meta: { diperbarui: TANGGAL, jumlah_merek: MEREK.length, jumlah_layanan: MEREK.reduce((n, m) => n + m.layanan_lokal.length, 0) }, celah: CELAH };
}
