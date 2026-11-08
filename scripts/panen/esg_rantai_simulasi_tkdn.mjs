#!/usr/bin/env node
// Pembangun public/data/global/simulasi_tkdn.json. Tanpa jaringan: node scripts/panen/esg_rantai_simulasi_tkdn.mjs
// Hanya MEMBACA tkdn_produk.json (sertifikat Kemenperin) dan benchmark_harga.json untuk sanity; asumsi lain ditranskripsi dengan sumbernya.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const P = (r) => fileURLToPath(new URL(r, import.meta.url));
const TKDN = JSON.parse(fs.readFileSync(P('../../public/data/tkdn_produk.json'), 'utf8'));
const aktif = (kat, produk) => TKDN.baris.filter((r) => r.kategori === kat && r.aktif && r.produk === produk && Number.isFinite(r.tkdn_persen));
const sertMod = aktif('modul', 'Modul Surya'), sertInv = aktif('inverter', 'Inverter');
const T = '2026-11-08';
const BM_MODUL = 0.05, BM_INV = 0.10; // benchmark_harga.json komponen_selisih bea_masuk (PMK 26/2022, MFN)
const a = (nilai, satuan, tingkat_bukti, sumber, catatan) => ({ nilai, satuan, tingkat_bukti, sumber, tanggal: T, ...(catatan ? { catatan } : {}) });
const d = {
  lapis: 'publik', dibangun_pada: T,
  _catatan: 'Asumsi bawaan simulasi kebijakan TKDN (rumus: public/inti/simulasi_tkdn_rumus.js). Hipotesis, bukan prakiraan. Semua nilai bisa diganti pengguna.',
  sumber: [
    { id: 's-benchmark', judul: 'public/data/global/benchmark_harga.json (InfoLink 4 Nov 2026; pv.index sun.store; kurs ECB 4 Nov 2026; BTKI)', penerbit: 'METI (turunan InfoLink, ECB, Kemenkeu)', tingkat_bukti: 'media' },
    { id: 's-biaya-bangun', judul: 'public/data/biaya_bangun.json, skala plts-atap-industri (Rp 9-13 juta/kW, tengah 11)', penerbit: 'METI', tingkat_bukti: 'hipotesis' },
    { id: 's-icres', judul: 'Investasi PLTS di Indonesia Terganjal Kebijakan TKDN (Kabar Bursa, 20 Mei 2024): modul buatan dalam negeri 30-45 persen lebih mahal dari impor; TKDN modul minimum 60 persen sejak 1 Jan 2025 (Permenperin 23/2023), ESDM mengusulkan 40 persen', penerbit: 'Kabar Bursa, narasumber Surya Darma (ICRES)', url: 'https://www.kabarbursa.com/market-hari-ini/investasi-plts-di-indonesia-terganjal-kebijakan-tkdn', tingkat_bukti: 'media' },
    { id: 's-kemenperin-kap', judul: 'Kapasitas modul surya Indonesia 10.944 MWp/tahun, 34 pabrikan, TKDN rata-rata 40-55 persen, Tier 1 44,11 persen, ambang minimum proyek 20 persen (dialog Target PLTS 100 GW, 13 Mei 2026)', penerbit: 'Petromindo mengutip Kementerian Perindustrian', url: 'https://dev.petromindo.com/news/article/indonesia-s-solar-module-capacity-reaches-10-9-gw-per-year', tingkat_bukti: 'media' },
    { id: 's-esdm-11-2024', judul: 'Permen ESDM 11/2024 Pasal 19: relaksasi TKDN PLTS COD paling lambat 30 Jun 2026 (PPA s.d. 31 Des 2024, impor s.d. 30 Jun 2025 bagi yang berkomitmen membangun pabrik modul)', penerbit: 'Investortrust, 13 Agu 2024', url: 'https://investortrust.id/national/37063/relaksasi-tkdn-proyek-plts-ini-syarat-dan-batas-waktunya', tingkat_bukti: 'media' },
    { id: 's-tkdn', judul: 'Sertifikat TKDN aktif Kemenperin (public/data/tkdn_produk.json, produk "Modul Surya" dan "Inverter")', penerbit: 'Kemenperin via METI', url: 'https://tkdn.kemenperin.go.id/', tingkat_bukti: 'resmi' },
    { id: 's-esdm-17gw', judul: 'Mei 2026 ESDM mengusulkan tahap awal 17 GW PLTS dengan penyimpanan dari target 100 GW (ringkasan pencarian SMM; tanpa tautan primer terbaca)', penerbit: 'SMM (via ringkasan pencarian)', tingkat_bukti: 'media' },
  ],
  syarat_uji: { modul: [0, 20, 40, 60], inverter: [0, 20, 40, 60], catatan: '0 = tanpa syarat (dasar)' },
  asumsi: {
    kurs_rp_usd: a(18129, 'Rp/USD', 'resmi', 's-benchmark', 'Kurs ECB 2026-11-04'),
    capex_dasar_rp_kwp: a(11000000, 'Rp/kWp', 'hipotesis', 's-biaya-bangun', 'Sudah memuat modul dan inverter impor; tengah PLTS atap C&I'),
    modul: {
      usd_w: a(Math.round(0.114 * (1 + BM_MODUL) * 1e4) / 1e4, 'USD/Wp', 'media', 's-benchmark', 'Kutipan non-Tiongkok 0,114 (InfoLink) x (1 + BM 5 persen); ongkos angkut belum termasuk (celah)'),
      premi_ref: a(0.375, 'pecahan', 'media', 's-icres', 'Titik tengah rentang 30-45 persen lebih mahal dari impor'),
      tkdn_ref: a(45, 'persen TKDN', 'media', 's-kemenperin-kap', 'Titik tengah rata-rata modul domestik 40-55 persen; premi dianggap berlaku pada TKDN ini'),
      kapasitas_gw_tahun: a(10.944, 'GW/tahun', 'media', 's-kemenperin-kap', 'Kapasitas terpasang 34 pabrikan, bukan produksi aktual'),
      kebutuhan_gw_tahun: a(Math.round((17 / 3) * 1000) / 1000, 'GW/tahun', 'hipotesis', 's-esdm-17gw', '17 GW tahap awal dibagi 3 tahun (pembagian 3 tahun adalah asumsi kami)'),
      kebutuhan_alternatif: [{ nama: 'Target 100 GW dalam 10 tahun', nilai: 10, satuan: 'GW/tahun', tingkat_bukti: 'hipotesis' }],
    },
    inverter: {
      usd_w: a(Math.round(0.0268 * (1 + BM_INV) * 1e4) / 1e4, 'USD/W', 'media', 's-benchmark', 'Inverter string besar Eropa 23,76 EUR/kW (pv.index Okt 2026) x 1,1267 / 1000 x (1 + BM 10 persen)'),
      premi_ref: a(0.15, 'pecahan', 'hipotesis', null, 'Tidak ada sumber terbuka premi inverter lokal; HIPOTESIS'),
      tkdn_ref: a(40, 'persen TKDN', 'hipotesis', 's-tkdn', 'Median sertifikat inverter aktif sekitar 38-40 persen'),
      kapasitas_gw_tahun: a(null, 'GW/tahun', 'celah', null, 'Kapasitas pabrik inverter lokal tidak ditemukan; analisis pasokan inverter hanya lewat pangsa sertifikat lolos'),
      kebutuhan_gw_tahun: a(Math.round((17 / 3) * 1000) / 1000, 'GW/tahun', 'hipotesis', 's-esdm-17gw'),
    },
    keuangan: { // masukan hitungModel (public/inti/model_keuangan_rumus.js); semuanya HIPOTESIS, ganti dengan data proyek
      mw: 1, opexUsdKwThn: 10, fk: 0.17, degr: 0.005, umur: 25, tarif: 1100, tarifTahun2: null, tarifGanti: 11, eskTarif: 0, eskOpex: 0.03,
      porsiBayar: 1, sewaRpKwp: 0, recRpMwh: 0, karbonRpT: 0, emisiTMwh: 0, utang: 0.7, bunga: 0.09, tenor: 12, pajak: 0.22, libur: 0, susut: 20,
      ppn: 0, ppnPorsi: 0, ppnDtp: false, gantiTahun: 0, gantiPersen: 0, diskonto: 0.10, kurs: 18129,
      tingkat_bukti: 'hipotesis', catatan: 'Tarif Rp 1.100/kWh, FK 17 persen, opex USD 10/kW/tahun, utang 70 persen bunga 9 persen: semuanya asumsi tipikal, bukan data proyek.',
    },
  },
  sertifikat: {
    modul: { jumlah: sertMod.length, tkdn_persen: sertMod.map((r) => r.tkdn_persen).sort((x, y) => x - y), sumber_id: 's-tkdn', ket: 'Sertifikat aktif produk "Modul Surya"; bobot sama per sertifikat (HIPOTESIS: kapasitas per pabrik tak terbuka)' },
    inverter: { jumlah: sertInv.length, tkdn_persen: sertInv.map((r) => r.tkdn_persen).sort((x, y) => x - y), sumber_id: 's-tkdn', ket: 'Sertifikat aktif produk "Inverter"' },
  },
  neraca_pasokan: { berkas: 'public/data/global/neraca_pasokan.json', ada: fs.existsSync(P('../../public/data/global/neraca_pasokan.json')), catatan: 'Belum ada saat dibangun: kapasitas dan kebutuhan memakai asumsi di atas; ganti saat berkas tersedia.' },
  celah: [
    'Premi harga modul lokal hanya rentang media 30-45 persen (Mei 2024); tidak ada seri harga lokal per Wp terbaca (e-katalog LKPP tak terjangkau).',
    'Kapasitas inverter lokal dan kapasitas per pabrik modul tidak terbuka; pangsa lolos memakai bobot sama per sertifikat.',
    'Nomor Permenperin yang berlaku untuk syarat TKDN modul/inverter pasca-relaksasi 2026 belum dibaca primer; 60 persen (Permenperin 23/2023) dan usul ESDM 40 persen berasal dari berita.',
    'Ongkos angkut, PPN, PPh 22 impor dan insentif tidak dimodelkan; capex dasar tunggal untuk semua skala.',
  ],
};
fs.writeFileSync(P('../../public/data/global/simulasi_tkdn.json'), JSON.stringify(d, null, 1) + '\n');
console.log('modul', sertMod.length, 'inverter', sertInv.length);
