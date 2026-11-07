// Pembangun public/data/global/logistik.json (offline). Angka ditranskripsi dari halaman yang diunduh 2026-11-08 (URL di SUMBER);
// pangsa impor dan kapasitas lokal dihitung dari public/data/dagang_komponen.json dan rantai_pasok.json. Yang tak bersumber = null + CELAH, bukan tebakan.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SUMBER as SUMBER_HARGA } from './harga_komponen_lib.mjs';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
export const TANGGAL = '2026-11-08';
const W = 'https://en.wikipedia.org/wiki/';
const BPK = 'https://peraturan.bpk.go.id/Details/';
export const SUMBER = [
  { id: 's-drewry-wci', judul: 'Drewry, World Container Index (penilaian Kamis 5 Nov 2026): komposit US$4.389 per 40ft, +124% YoY; Shanghai-Rotterdam 3.615, -Genoa 4.166, -New York 9.303, -Los Angeles 7.539; 60% kapasitas Asia-Eropa lewat Suez; antrean Shanghai 35 jam', penerbit: 'Drewry Supply Chain Advisors', url: 'https://www.drewry.co.uk/supply-chain-advisors/supply-chain-expertise/world-container-index-assessed-by-drewry', tingkat_bukti: 'resmi' },
  { id: 's-fbx', judul: 'Freightos Baltic Index, halaman indeks global: FBX global US$3.451,80 per 40ft (terbaca 8 Nov 2026)', penerbit: 'Freightos / Baltic Exchange', url: 'https://www.freightos.com/enterprise/terminal/freightos-baltic-index-global-container-pricing-index/', tingkat_bukti: 'resmi' },
  { id: 's-unctad-rmt24', judul: 'UNCTAD, Review of Maritime Transport 2024 (ringkasan): SCFI pertengahan 2024 lebih dari dua kali lipat akhir 2023; transit kanal turun separuh 2023, pengalihan lewat Tanjung Harapan', penerbit: 'UNCTAD', url: 'https://unctad.org/publication/review-maritime-transport-2024', tingkat_bukti: 'resmi' },
  { id: 's-iea-pv', judul: 'IEA, Solar PV Global Supply Chains (Executive summary): pangsa China di semua tahap manufaktur panel (polisilikon, ingot, wafer, sel, modul) melebihi 80%', penerbit: 'IEA', url: 'https://www.iea.org/reports/solar-pv-global-supply-chains/executive-summary', tingkat_bukti: 'resmi' },
  { id: 's-wiki-incoterms', judul: 'Wikipedia, Incoterms (definisi CIF dan DDP; DDP: penjual menanggung semua biaya sampai tempat tujuan termasuk bea dan pajak impor, tidak termasuk bongkar)', penerbit: 'Wikipedia', url: W + 'Incoterms', tingkat_bukti: 'via-pihak-ketiga' },
  { id: 's-wiki-redsea', judul: 'Wikipedia, Red Sea crisis (Bab el-Mandeb ~10% perdagangan dunia; pengalihan lewat Tanjung Harapan menambah sekitar sepuluh hari)', penerbit: 'Wikipedia', url: W + 'Red_Sea_crisis', tingkat_bukti: 'via-pihak-ketiga' },
  { id: 's-wiki-pelabuhan', judul: 'Wikipedia (API koordinat dan artikel pelabuhan: Shanghai, Ningbo-Zhoushan, Shenzhen, Xiamen, Busan, Saigon Port, Port Klang, Tanjung Priok, Tanjung Perak, Belawan, Makassar, Batam, Patimban Deep Sea Port)', penerbit: 'Wikipedia', url: W + 'List_of_ports_in_Indonesia', tingkat_bukti: 'via-pihak-ketiga' },
  { id: 's-bpk-esdm-2-2021', judul: 'Permen ESDM No. 2 Tahun 2021: Penerapan Standar Kualitas Modul Fotovoltaik Silikon Kristalin', penerbit: 'JDIH BPK', url: BPK + '163131/permen-esdm-no-2-tahun-2021', tingkat_bukti: 'resmi' },
  { id: 's-bpk-pmk66', judul: 'PMK No. 66/PMK.010/2015: Pembebasan Bea Masuk atas Impor Barang Modal dalam rangka Pembangunan/Pengembangan Industri Pembangkitan Tenaga Listrik untuk Kepentingan Umum', penerbit: 'JDIH BPK', url: BPK + '146740/pmk-no-66pmk0102015', tingkat_bukti: 'resmi' },
  { id: 's-bpk-pmk176', judul: 'PMK No. 176/PMK.011/2009: Pembebasan Bea Masuk atas Impor Mesin serta Barang dan Bahan untuk Pembangunan/Pengembangan Industri', penerbit: 'JDIH BPK', url: BPK + '167732/pmk-no-176pmk0112009', tingkat_bukti: 'resmi' },
  { id: 's-bpk-permendag118', judul: 'Permendag No. 118 Tahun 2018 dan perubahannya (76/2019, 37/2020, 44/2021): Ketentuan Impor Barang Modal Dalam Keadaan Tidak Baru', penerbit: 'JDIH BPK', url: BPK + '128503/permendag-no-118-tahun-2018', tingkat_bukti: 'resmi' },
  { id: 's-bpk-tkdn-modul', judul: 'Permenperin No. 34 Tahun 2024: Tata Cara Penghitungan Nilai TKDN Produk Modul Surya', penerbit: 'JDIH BPK', url: BPK + '296131/permenperin-no-34-tahun-2024', tingkat_bukti: 'resmi' },
  { id: 's-lokal', judul: 'public/data/dagang_komponen.json (UN Comtrade, HS 6 digit) dan public/data/rantai_pasok.json (DJEBTKE, TKDN Kemenperin), diolah', penerbit: 'METI (olahan)', url: 'https://platformmeti.timitbnpb.workers.dev', tingkat_bukti: 'resmi' },
];
const P = (id, nama, negara, peran, lat, lon, catatan) => ({ id, nama, negara, peran, lat, lon, sumber_id: 's-wiki-pelabuhan', tingkat_bukti: 'via-pihak-ketiga', tanggal: TANGGAL, ...(catatan ? { catatan } : {}) });
export const PELABUHAN = [
  P('shanghai', 'Shanghai', 'CN', 'asal', 30.62638889, 122.06472222),
  P('ningbo', 'Ningbo-Zhoushan', 'CN', 'asal', 29.93333333, 121.83333333),
  P('shenzhen', 'Shenzhen', 'CN', 'asal', 22.5, 113.88333333),
  P('xiamen', 'Xiamen', 'CN', 'asal', 24.502262, 118.084531),
  P('busan', 'Busan', 'KR', 'asal', 35.10388889, 129.07888889),
  P('hochiminh', 'Ho Chi Minh (Saigon Port)', 'VN', 'asal', 10.76833333, 106.7075, 'Koordinat Saigon Port; terminal laut dalam Cai Mep tidak bersumber.'),
  P('portklang', 'Port Klang', 'MY', 'asal', 3, 101.4, 'Koordinat kasar (dibulatkan) dari artikel kota/pelabuhan.'),
  P('priok', 'Tanjung Priok', 'ID', 'tujuan', -6.13333333, 106.9),
  P('perak', 'Tanjung Perak', 'ID', 'tujuan', -7.19833333, 112.72277778),
  P('belawan', 'Belawan', 'ID', 'tujuan', 3.78305556, 98.69055556),
  P('makassar', 'Makassar', 'ID', 'tujuan', -5.122, 119.408),
  P('batam', 'Batam', 'ID', 'tujuan', 1.13, 104.05305556, 'Koordinat pusat Kota Batam, bukan terminal tertentu.'),
  P('patimban', 'Patimban', 'ID', 'tujuan', -6.244034, 107.904066),
];
const km = (a, b) => { const r = Math.PI / 180, h = (x) => Math.sin(x / 2) ** 2; const d = h((b.lat - a.lat) * r) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * h((b.lon - a.lon) * r); return 2 * 6371 * Math.asin(Math.sqrt(d)); };
export const KNOT = 14;
export function rute() {
  const asal = PELABUHAN.filter((p) => p.peran === 'asal'), tuj = PELABUHAN.filter((p) => p.peran === 'tujuan');
  const out = [];
  for (const a of asal) for (const t of tuj) {
    const jarak = Math.round(km(a, t));
    out.push({ id: `${a.id}-${t.id}`, dari: a.id, ke: t.id, jarak_garis_km: jarak, hari_layar_est: Math.round((jarak / (KNOT * 1.852 * 24)) * 10) / 10, tingkat_bukti: 'estimasi', rumus: `jarak lingkaran besar antar koordinat / (${KNOT} knot x 1,852 km/jam x 24 jam)`, catatan: 'Batas bawah: rute laut lebih panjang dari garis lurus; tanpa waktu sandar, transshipment, antrean. Bukan jadwal pelayaran.', tanggal: TANGGAL });
  }
  return out;
}
const L = (id, nama, ket, sid, tgl = TANGGAL) => ({ id, nama, keterangan: ket, sumber_id: sid, tingkat_bukti: sid === 's-wiki-incoterms' ? 'via-pihak-ketiga' : 'resmi', tanggal: tgl });
export const ATURAN = [
  L('modul-sni', 'Standar kualitas modul fotovoltaik silikon kristalin', 'Aturan standar modul PV yang diterapkan ESDM; tepatnya SNI wajib/pemberlakuan dan pemeriksaan kepabeanan perlu dibaca di teks aturan.', 's-bpk-esdm-2-2021'),
  L('bea-masuk-pembangkit', 'Pembebasan bea masuk barang modal pembangkitan listrik', 'PMK 66/PMK.010/2015 (sejarah: 154/PMK.011/2008 dan perubahan). Daftar barang dan syarat (masterlist) ada di lampiran; belum ditranskripsi.', 's-bpk-pmk66'),
  L('bea-masuk-mesin', 'Pembebasan bea masuk mesin, barang, dan bahan industri', 'PMK 176/PMK.011/2009 (lihat insentif_fiskal.json: if_bea_masuk_mesin).', 's-bpk-pmk176'),
  L('barang-modal-bekas', 'Impor barang modal tidak baru', 'Permendag 118/2018 dan perubahan: relevan bila proyek mengimpor peralatan bekas.', 's-bpk-permendag118'),
  L('tkdn-modul', 'Penghitungan TKDN modul surya', 'Permenperin 34/2024; sertifikat TKDN produk ada di tkdn_produk.json.', 's-bpk-tkdn-modul'),
];
const T = (urut, id, nama, pelaku, uraian, sid, durasi) => ({ urut, id, nama, pelaku, uraian, durasi_hari: durasi ?? null, durasi_status: durasi == null ? 'belum-bersumber' : 'bersumber', ...(sid ? { sumber_id: sid } : { sumber_id: null }), tingkat_bukti: sid ? (sid === 's-wiki-incoterms' ? 'via-pihak-ketiga' : 'resmi') : 'belum-bersumber', tanggal: TANGGAL });
export const TAHAP = [
  T(1, 'po-incoterms', 'Pesanan (PO) dan penetapan Incoterms', 'Pembeli/EPC dan pabrikan', 'Kontrak menetapkan Incoterms: FOB (pembeli menanggung angkut laut), CIF (penjual membayar angkut dan asuransi sampai pelabuhan tujuan), DDP (penjual menanggung semua biaya termasuk bea dan pajak impor, tidak termasuk bongkar).', 's-wiki-incoterms'),
  T(2, 'produksi', 'Produksi dan uji pabrik (FAT)', 'Pabrikan, inspektur pihak ketiga', 'Lead time produksi per komponen: belum bersumber (lihat CELAH).', null),
  T(3, 'pengapalan', 'Pengemasan, muat, dan pengapalan', 'Pabrikan, forwarder, pelayaran', 'Tarif kontainer acuan: lihat biaya_angkut.', 's-drewry-wci'),
  T(4, 'layar', 'Pelayaran ke pelabuhan Indonesia', 'Pelayaran', 'Estimasi batas bawah per rute ada di rute[].hari_layar_est (bukan jadwal).', null),
  T(5, 'bea-cukai', 'Kepabeanan: PIB, pemeriksaan, standar/lartas, bea masuk', 'Importir, PPJK, Bea Cukai', 'Pembebasan bea masuk barang modal pembangkit: PMK 66/PMK.010/2015; standar modul PV: Permen ESDM 2/2021. Jalur merah/hijau, PIB/INSW, Persetujuan Impor, NPIK: belum diunduh dari sumber primer (lihat CELAH).', 's-bpk-pmk66'),
  T(6, 'darat-antarpulau', 'Angkutan darat dan antarpulau ke lokasi proyek', 'Kontraktor angkut, pelayaran nasional', 'Kapal perintis, tongkang, kargo khusus bilah/trafo: belum bersumber.', null),
  T(7, 'pasang', 'Gudang tapak, uji terima, pemasangan', 'EPC', 'Belum bersumber.', null),
];
export const CELAH = [
  'Lead time produksi per komponen (modul, inverter, trafo, turbin, baterai) tidak ditemukan di sumber terbuka yang diunduh; tahap produksi/FAT memakai durasi null.',
  'Durasi tahap kepabeanan (PIB, jalur merah/hijau), bongkar, dan antarpulau tidak bersumber; angka dari praktik forwarder tidak dimuat sebelum ada sumber.',
  'Tarif kontainer rute Asia-Indonesia (Shanghai-Jakarta dll.) tidak ada di WCI gratis (delapan lajur Timur-Barat); SCFI/FBX rinci dan seri 2020-2026 berbayar atau tidak boleh disebarkan ulang. Deret biaya_angkut hanya berisi titik yang terbaca.',
  'Pecahan biaya mendarat: hanya FOB yang bersumber (public/data/harga_komponen.json). Tarif bea masuk, PPN, premi asuransi, dan biaya lokal per komponen belum bersumber, sehingga bernilai null; antarmuka boleh meminta masukan pengguna dan menandainya sebagai asumsi.',
  'Aturan lartas, Persetujuan Impor, SNI wajib, NPIK, Masterlist: hanya judul aturan yang terverifikasi; isi pasal belum ditranskripsi.',
  'Forwarder/PPJK proyek energi tidak ada di direktori (peran_rantai logistik kosong); hanya EPC yang dirujuk. Tidak ada nama pribadi.',
  'Contoh kasus proyek Indonesia timur dengan biaya logistik tidak ditemukan bersumber; ditunda.',
  'COVID dan tarif dagang tidak diberi butir gangguan karena belum ada sumber yang diunduh; Laut Merah dan Suez dari Drewry/UNCTAD/Wikipedia.',
];
const RISIKO = [
  { id: 'laut-merah', nama: 'Laut Merah dan Suez', ringkas: 'Bab el-Mandeb ~10% perdagangan dunia; kapal dialihkan lewat Tanjung Harapan (sekitar +10 hari). Per 5 Nov 2026 Drewry mencatat transit Suez pulih, 60% kapasitas Asia-Eropa kembali lewat Suez. Lajur utama Asia-Indonesia tidak lewat Suez; dampak ke Indonesia lewat kapasitas dan tarif global.', sumber: ['s-wiki-redsea', 's-drewry-wci', 's-unctad-rmt24'] },
  { id: 'kemacetan-pelabuhan', nama: 'Antrean pelabuhan China', ringkas: 'Antrean kapal di Shanghai 35 jam pekan lalu, membaik (Drewry, 5 Nov 2026).', sumber: ['s-drewry-wci'] },
  { id: 'hormuz', nama: 'Selat Hormuz', ringkas: 'Drewry menyebut situasi Selat Hormuz tak pasti (5 Nov 2026).', sumber: ['s-drewry-wci'] },
  { id: 'tarif-spot', nama: 'Gejolak tarif spot', ringkas: 'WCI komposit US$4.389 per 40ft, 124% di atas setahun lalu (5 Nov 2026); SCFI pertengahan 2024 lebih dari dua kali akhir 2023 (UNCTAD).', sumber: ['s-drewry-wci', 's-unctad-rmt24'] },
].map((r) => ({ ...r, tanggal: TANGGAL, tingkat_bukti: 'resmi' }));
const KOM = [['surya', 'modul surya (HS 854143; 854140 sebelum 2022)'], ['inverter', 'inverter/konverter statis (HS 850440)'], ['baterai', 'baterai litium-ion (HS 850760)'], ['angin', 'set pembangkit angin (HS 850231)']];
export function bangun() {
  const D = JSON.parse(fs.readFileSync(AKAR + 'public/data/dagang_komponen.json', 'utf8'));
  const R = JSON.parse(fs.readFileSync(AKAR + 'public/data/rantai_pasok.json', 'utf8'));
  const H = JSON.parse(fs.readFileSync(AKAR + 'public/data/harga_komponen.json', 'utf8'));
  const O = JSON.parse(fs.readFileSync(AKAR + 'public/data/organisasi.json', 'utf8'));
  const konsentrasi = KOM.map(([k, ket]) => {
    const th = Math.max(...D.tahunan.filter((r) => r.komponen === k && r.alir === 'impor').map((r) => r.tahun));
    const bar = D.tahunan.filter((r) => r.komponen === k && r.alir === 'impor' && r.tahun === th);
    const hs = bar.sort((a, b) => b.usd - a.usd)[0]; // ponytail: kode HS dengan nilai terbesar di tahun terakhir
    const cn = (hs.mitra.find((m) => m.kode === 156) || {}).usd || 0;
    return { komponen: k, keterangan: ket, tahun: th, hs: hs.hs, impor_usd: hs.usd, china_usd: cn, china_pangsa_persen: Math.round((cn / hs.usd) * 1000) / 10, rumus: 'nilai impor dari China / total impor Indonesia (Comtrade, pelapor Indonesia)', sumber_id: 's-lokal', tingkat_bukti: 'resmi', tanggal: TANGGAL };
  });
  const lokal = [];
  for (const t of R.teknologi) for (const c of t.komponen) lokal.push({ teknologi: t.id, komponen: c.id, pemasok_terbaca: c.pemasok.length, kapasitas_mwp: c.pemasok.reduce((a, x) => a + (x.mwp || 0), 0) || null, sumber_id: 's-lokal', tingkat_bukti: 'resmi', tanggal: TANGGAL });
  const epc = O.baris.filter((r) => (r.peran_rantai || []).includes('EPC')).map((r) => ({ org_id: r.id, nama: r.nama, peran: 'EPC', catatan: 'Belum ada bukti ia mengurus impor sendiri; dirujuk sebagai pemain EPC di direktori.' }));
  const f = (id) => (H.deret.find((d) => d.id === id) || { titik: [] }).titik.slice(-1)[0];
  const fob = (komponen, deret, satuan) => { const t = f(deret); return { komponen, satuan, nilai: t ? t.y : null, tahun: t ? t.x : null, sumber_id: t ? t.sumber_id : null, tingkat_bukti: t ? t.tingkat_bukti : 'belum-bersumber' }; };
  const POS = ['fob', 'angkut', 'asuransi', 'bea_masuk', 'ppn', 'logistik_lokal'];
  const mendarat = [fob('modul', 'modul-eropa-2024', 'USD/W'), fob('baterai', 'pack', 'USD/kWh'), fob('turbin-di-luar-tiongkok', 'turbin-luar-tiongkok', 'USD/kW'), fob('turbin-tiongkok', 'turbin-tiongkok', 'USD/kW')]
    .map((b) => ({ komponen: b.komponen, satuan: b.satuan, catatan: 'FOB = harga komponen tolok (harga_komponen.json), bukan penawaran pabrik ke Indonesia.', pos: POS.map((p) => (p === 'fob' ? { pos: p, nilai: b.nilai, tahun: b.tahun, sumber_id: b.sumber_id, tingkat_bukti: b.tingkat_bukti } : { pos: p, nilai: null, tingkat_bukti: 'belum-bersumber' })), rumus: 'mendarat = fob + angkut + asuransi + bea_masuk + ppn + logistik_lokal (pos null = belum bersumber)' }));
  return {
    lapis: 'publik', dibangun_pada: TANGGAL, sumber: [...SUMBER, ...SUMBER_HARGA.filter((x) => !SUMBER.some((y) => y.id === x.id))],
    tahap: TAHAP, aturan: ATURAN, pelabuhan: PELABUHAN, rute: rute(),
    biaya_angkut: { satuan: 'USD per kontainer 40ft', catatan: 'Titik terbaca saja; bukan seri 2020-2026 (lihat celah).', titik: [
      { id: 'wci', label: 'WCI komposit', tanggal_data: '2026-11-05', usd_40ft: 4389, yoy_persen: 124, sumber_id: 's-drewry-wci', tingkat_bukti: 'resmi', tanggal: TANGGAL },
      { id: 'wci-yoy-est', label: 'WCI komposit setahun sebelumnya (turunan)', tanggal_data: '2025-11-06', usd_40ft: Math.round(4389 / 2.24), tingkat_bukti: 'estimasi', rumus: '4389 / (1 + 1,24)', sumber_id: 's-drewry-wci', tanggal: TANGGAL },
      { id: 'wci-sha-rtm', label: 'Shanghai-Rotterdam', tanggal_data: '2026-11-05', usd_40ft: 3615, sumber_id: 's-drewry-wci', tingkat_bukti: 'resmi', tanggal: TANGGAL },
      { id: 'wci-sha-gen', label: 'Shanghai-Genoa', tanggal_data: '2026-11-05', usd_40ft: 4166, sumber_id: 's-drewry-wci', tingkat_bukti: 'resmi', tanggal: TANGGAL },
      { id: 'wci-sha-nyc', label: 'Shanghai-New York', tanggal_data: '2026-11-05', usd_40ft: 9303, sumber_id: 's-drewry-wci', tingkat_bukti: 'resmi', tanggal: TANGGAL },
      { id: 'wci-sha-lax', label: 'Shanghai-Los Angeles', tanggal_data: '2026-11-05', usd_40ft: 7539, sumber_id: 's-drewry-wci', tingkat_bukti: 'resmi', tanggal: TANGGAL },
      { id: 'fbx-global', label: 'FBX global', tanggal_data: '2026-11-08', usd_40ft: 3451.8, sumber_id: 's-fbx', tingkat_bukti: 'resmi', tanggal: TANGGAL },
    ] },
    biaya_mendarat: mendarat,
    risiko: { gangguan: RISIKO, konsentrasi: [...konsentrasi, { komponen: 'surya-rantai-global', keterangan: 'pangsa China di semua tahap manufaktur panel surya dunia', china_pangsa_persen: 80, batas: 'lebih dari', sumber_id: 's-iea-pv', tingkat_bukti: 'resmi', tanggal: TANGGAL }], produksi_lokal: lokal },
    pemain: { epc, forwarder: [] },
    meta: { diperbarui: TANGGAL, kecepatan_kapal_knot: KNOT, celah: CELAH },
  };
}
