// public/data/global/pabrik_dunia.json (offline). Tiap pabrik: perusahaan (org_id bila ada di pemasok_surya.json), negara iso2, kota,
// koordinat pusat kota (bukan titik pabrik), kapasitas dengan satuan, status, tahun, sumber + tingkat bukti. Tanpa angka yang tak bersumber.
export const TANGGAL = '2026-11-08';
const S = (id, judul, penerbit, tahun, url) => ({ id, judul, penerbit, tahun, url, lisensi: 'Berita/ringkasan publik, fakta dikutip dengan atribusi', tingkat_bukti: 'media' });
export const SUMBER = [
  S('s-bernreuter', 'pv magazine: China dominates global polysilicon capacity, says Bernreuter Research (25 Nov 2025)', 'pv magazine (kutip Bernreuter Research)', 2025, 'https://www.pv-magazine.com/2025/11/25/china-dominates-global-polysilicon-capacity-says-bernreuter-research'),
  S('s-spw-poli', 'Solar Power World: China takes 9 of top 10 polysilicon manufacturer spots (Des 2025)', 'Solar Power World', 2025, 'https://www.solarpowerworldonline.com/2025/12/china-takes-9-of-top-10-polysilicon-manufacturer-spots-expanding-industry-dominance/'),
  S('s-trina-kendal', 'Investortrust: Trina Mas Agra injects US$100 million into landmark factory', 'Investortrust.id', 2026, 'https://investortrust.id/business/102043/indonesias-solar-ambitions-surge-as-trina-mas-agra-injects-100-million-into-landmark-factory'),
  S('s-thornova', 'pv-tech: Thornova Solar begins solar module production in Indonesia', 'pv-tech', 2026, 'https://www.pv-tech.org/thornova-solar-begins-solar-module-production-in-indonesia'),
  S('s-seg', 'Mercom: SEG Solar begins construction of 3 GW ingot and wafer facility in Indonesia', 'Mercom India', 2026, 'https://www.mercomindia.com/seg-solar-begins-construction-of-3-gw-ingot-and-wafer-facility-in-indonesia'),
  S('s-yingfa', 'pv magazine: Yingfa Ruineng establishes 7.5 GW PV manufacturing plant in Indonesia (3 Nov 2026)', 'pv magazine', 2026, 'https://pv-magazine.com/2026/11/03/yingfa-ruineng-establishes-7-5-gw-pv-manufacturing-plant-in-indonesia'),
  S('s-danantara', 'TaiyangNews: Indonesia secures $1.4 billion for 50 GW solar manufacturing', 'TaiyangNews', 2026, 'https://taiyangnews.info/markets/indonesia-secures-investment-for-50-gw-solar-manufacturing'),
  S('s-petromindo', 'Petromindo: Indonesia solar module capacity reaches 10.9 GW per year (34 produsen, paparan kementerian)', 'Petromindo', 2026, 'https://dev.petromindo.com/news/article/indonesia-s-solar-module-capacity-reaches-10-9-gw-per-year'),
  S('s-hli', 'Pemprov Jawa Barat: Karawang EV battery plant set to begin operations (HLI Green Power, 10 GWh per tahun)', 'Pemprov Jawa Barat', 2025, 'https://investasi.jabarprov.go.id/news/karawang-ev-battery-plant-set-to-begin-operations'),
  S('s-catib', 'Investortrust: giant CATL-IBC battery plant begins trial runs in West Java', 'Investortrust.id', 2026, 'https://investortrust.id/market/113741/indonesia-charges-its-ev-ambitions-as-giant-catl-ibc-battery-plant-begins-trial-runs-in-west-java'),
  S('s-fs-sea', 'pv-tech: First Solar reduces module production in Malaysia and Vietnam by 1GW', 'pv-tech', 2025, 'https://www.pv-tech.org/first-solar-reduces-module-production-in-malaysia-and-vietnam-by-1gw/'),
  S('s-catl-hu', 'CarNewsChina: CATL Hungarian plant with planned 100 GWh capacity begins trial production (22 Sep 2026)', 'CarNewsChina', 2026, 'https://carnewschina.com/2026/09/22/catls-hungarian-plant-with-a-planned-100-gwh-capacity-begins-trial-production-today/'),
  S('s-catl-hu2', 'The Star: CATL Hungary battery plant ready to launch, capacity fully booked (4 Des 2025)', 'The Star / Xinhua', 2025, 'https://www.thestar.com.my/news/world/2025/12/04/catl039s-hungary-battery-plant-ready-to-launch-capacity-fully-booked'),
  S('s-energytrend-sea', 'EnergyTrend: kapasitas manufaktur surya Asia Tenggara Q1 2024', 'EnergyTrend', 2024, 'https://www.energytrend.com/print/46880'),
];
export const CELAH = [
  'Koordinat adalah pusat kota/kabupaten (tingkat "pusat-kota"), bukan titik gerbang pabrik. Pabrik tanpa kota di sumber diberi koordinat kosong.',
  'Kapasitas polisilikon dalam ton per tahun (bukan GW); angka Tongwei, GCL, Wacker, Xinte dan Goens adalah kapasitas total perusahaan lintas pabrik/lokasi, kota tiap pabrik belum dibaca.',
  'Hemlock (AS), OCI, REC Silicon dan wafer/ingot global (LONGi, Zhonghuan, TCL) belum bersumber; Hemlock: tak ditemukan kapasitas terkini (rencana Clarksville ditunda sejak 2013). Daqo tanpa kota karena sumber menggabungkan Xinjiang dan Inner Mongolia.',
  'Pabrik sel baterai di luar Indonesia hanya CATL Debrecen; BYD, LGES dan pabrik turbin (Goldwind, Vestas, Siemens Gamesa, Mingyang, Envision) belum bersumber: liputan yang dibaca hanya memuat volume pasang, bukan kapasitas pabrik. Pabrik turbin belum ada sama sekali. Satu-satunya rincian per pabrik di ASEAN selain Indonesia adalah First Solar (Vietnam, Malaysia).',
  'Status "belum-dipastikan" dipakai bila liputan hanya menyebut "mendirikan/menanam modal" tanpa menyatakan produksi sudah berjalan.',
  'Ringkasan negara ASEAN berasal dari satu potret Q1 2024 dan berubah cepat (pemangkasan 2025 di Vietnam dan Malaysia); pakai sebagai gambaran, bukan angka terkini.',
];
const T = (sumber_id, tingkat_bukti = 'media') => ({ sumber_id, tingkat_bukti, tanggal: TANGGAL });
const F = (id, perusahaan, org_id, segmen, iso2, kota, lat, lon, kapasitas, status, tahun, bukti, catatan = null, kapasitas_rencana = null) => ({
  id, perusahaan, org_id, segmen: [].concat(segmen), negara_iso2: iso2, kota, koordinat: lat == null ? null : { lat, lon, tingkat: 'pusat-kota' }, kapasitas, kapasitas_rencana, status, tahun, bukti, catatan,
});
const poli = (id, nama, org, ton, ket, bukti) => F(id, nama, org, 'polisilikon', 'CN', null, null, null, { nilai: ton, satuan: 'ton/tahun', cakupan: 'total perusahaan' }, 'operasi', null, bukti, ket);
export const PABRIK = [
  poli('pd-tongwei-poli', 'Tongwei', 'en_155549601e', 910000, 'Kapasitas sekitar 910.000 ton lintas tiga pabrik; terbesar dunia.', [T('s-bernreuter')]),
  poli('pd-gcl-poli', 'GCL Technology', null, 480000, 'Kapasitas total 480.000 ton lintas empat pabrik. Org belum ada id di pemasok_surya.json (ada di daftar tanpa_sumber).', [T('s-bernreuter')]),
  poli('pd-xinte-poli', 'Xinte Energy (anak usaha TBEA)', 'en_caaca00333', 210000, 'Kapasitas 210.000 ton pada 2024 dengan utilisasi rendah; pabrik kedua 125.000 ton mulai uji coba Oktober 2025. org_id = TBEA (induk).', [T('s-bernreuter')]),
  F('pd-goens-poli', 'Goens Energy', null, 'polisilikon', 'CN', 'Xinjiang', null, null, { nilai: 65000, satuan: 'ton/tahun', cakupan: 'total perusahaan' }, 'tutup', 2025, [T('s-bernreuter')], 'Produksi dihentikan sementara pada musim gugur 2025 (suspend), belum tentu tutup permanen; status "tutup" dipakai sebagai "tidak beroperasi".'),
  F('pd-wacker-poli', 'Wacker Chemie', 'en_28ad81bf3e', 'polisilikon', 'DE', null, null, null, { nilai: 80000, satuan: 'ton/tahun', cakupan: 'total perusahaan' }, 'operasi', null, [T('s-bernreuter'), T('s-spw-poli')], 'Peringkat 8 produsen polisilikon; satu-satunya non-Tiongkok di 10 besar. Kapasitas sekitar 80.000 ton.'),
  F('pd-trina-kendal', 'PT Trina Mas Agra Indonesia', 'en_2684d348da', ['sel', 'modul'], 'ID', 'Kendal', -6.9189, 110.2030, { nilai: 1, satuan: 'GW/tahun', cakupan: 'sel dan modul masing-masing' }, 'belum-dipastikan', null, [T('s-trina-kendal')], 'Investasi lebih dari US$100 juta; org_id = Trina Solar. Lokasi Kendal berdasarkan nama proyek, bukan teks yang dibaca penuh.'),
  F('pd-thornova-id', 'Thornova Solar', null, 'modul', 'ID', null, null, null, { nilai: 2.5, satuan: 'GW/tahun', cakupan: 'modul' }, 'operasi', 2026, [T('s-thornova')], 'Mulai produksi modul di Indonesia, untuk pasar AS (liputan).'),
  F('pd-seg-batang', 'SEG Solar', null, 'ingot_wafer', 'ID', 'Batang', -6.9071, 109.7297, { nilai: 3, satuan: 'GW/tahun', cakupan: 'ingot dan wafer, tahap awal' }, 'bangun', 2026, [T('s-seg')], 'Konstruksi dimulai; rencana perluasan ke 5 GW ingot dan wafer. Lokasi Batang dari liputan.', { nilai: 5, satuan: 'GW/tahun', cakupan: 'ingot dan wafer' }),
  F('pd-yingfa-id', 'Yingfa Ruineng', null, 'sel', 'ID', null, null, null, { nilai: 7.5, satuan: 'GW/tahun', cakupan: 'sel' }, 'belum-dipastikan', 2026, [T('s-yingfa')], 'Judul liputan 3 Nov 2026: mendirikan pabrik manufaktur PV 7,5 GW di Indonesia; tahap produksi belum dibaca.'),
  F('pd-danantara-modul', 'Danantara (rencana perakitan modul nasional)', null, 'modul', 'ID', null, null, null, null, 'rencana', null, [T('s-danantara')], 'Dana US$1,4 miliar untuk perakitan modul sampai 50 GW/tahun, target rampung akhir 2026 (target, bukan jadwal pasti).', { nilai: 50, satuan: 'GW/tahun', cakupan: 'modul' }),
  F('pd-hli-karawang', 'PT HLI Green Power', null, 'sel_baterai', 'ID', 'Karawang', -6.3064, 107.3020, { nilai: 10, satuan: 'GWh/tahun', cakupan: 'sel baterai EV' }, 'operasi', 2025, [T('s-hli')], 'Pabrik sel EV pertama Indonesia (Hyundai, LG Energy Solution, IBC); kapasitas 10 GWh per tahun menurut pernyataan Kemenko (Nov 2025).'),
  F('pd-catib-karawang', 'CATL-IBC (CATIB)', 'en_eb7ac55bdd', 'sel_baterai', 'ID', 'Karawang', -6.3064, 107.3020, { nilai: 6.9, satuan: 'GWh/tahun', cakupan: 'awal, operasi bertahap sejak 21 Agu 2026' }, 'operasi', 2026, [T('s-catib')], 'org_id = CATL. Rencana bertahap ke 15 GWh; angka 40 GWh adalah wacana (termasuk baterai penyimpan surya), tidak dicatat sebagai rencana.', { nilai: 15, satuan: 'GWh/tahun', cakupan: 'target bertahap' }),
  F('pd-firstsolar-dongnam', 'First Solar (Dong Nam)', 'en_2adae77ad6', 'modul', 'VN', 'Dong Nam', null, null, { nilai: 2.8, satuan: 'GW/tahun', cakupan: 'modul CdTe' }, 'operasi', null, [T('s-fs-sea')], '2025: produksi Seri 6 di Vietnam dan Malaysia dipangkas gabungan 1 GW.'),
  F('pd-firstsolar-kulim', 'First Solar (Kulim)', 'en_2adae77ad6', 'modul', 'MY', 'Kulim', 5.3649, 100.5614, { nilai: 2.7, satuan: 'GW/tahun', cakupan: 'modul CdTe' }, 'operasi', null, [T('s-fs-sea')], 'Lihat catatan pemangkasan 2025 pada Dong Nam.'),
];
PABRIK.push(
  F('pd-daqo-poli', 'Daqo New Energy', 'en_8dc29e8ca8', 'polisilikon', 'CN', null, null, null, { nilai: 350000, satuan: 'ton/tahun', cakupan: 'Xinjiang dan Inner Mongolia gabungan' }, 'operasi', null, [T('s-spw-poli')], 'Peringkat Solar Power World memuat 350.000 ton; kota (Shihezi, Xinjiang) dan rincian per fase belum terkonfirmasi di teks yang dibaca.'),
  F('pd-catl-debrecen', 'CATL (Debrecen)', 'en_eb7ac55bdd', 'sel_baterai', 'HU', 'Debrecen', 47.53, 21.6244, { nilai: 34, satuan: 'GWh/tahun', cakupan: 'fase 1, uji coba produksi sejak 22 Sep 2026 (sumber lain: 40 GWh awal)' }, 'bangun', 2026, [T('s-catl-hu'), T('s-catl-hu2')], 'Perakitan modul sejak musim gugur 2024; sel masih tahap uji coba.', { nilai: 100, satuan: 'GWh/tahun', cakupan: 'target penuh' }),
);
export const RINGKASAN_ASEAN = {
  tingkat_bukti: 'media', tanggal: TANGGAL, sumber_id: 's-energytrend-sea', per: 'Q1 2024', satuan: 'GW',
  negara: [{ iso2: 'VN', modul: 54.8, sel: 36.45 }, { iso2: 'MY', modul: 15.6, sel: 16.5 }, { iso2: 'ID', modul: 8.5, sel: 6 }, { iso2: 'TH', modul: 7.25, sel: 7.65 }, { iso2: 'KH', modul: 6.4, sel: null }],
  indonesia_dalam_negeri: { produsen_modul: 34, kapasitas_mwp: 10944, sumber_id: 's-petromindo', tingkat_bukti: 'media', tanggal: TANGGAL, ket: 'paparan kementerian; berbeda dengan 8,5 GW Q1 2024 karena waktu dan cakupan' },
};
export function bangun() {
  return { lapis: 'publik', dibangun_pada: TANGGAL, sumber: SUMBER, ringkasan_asean: RINGKASAN_ASEAN, baris: PABRIK, meta: { diperbarui: TANGGAL, jumlah: PABRIK.length, celah: CELAH } };
}
