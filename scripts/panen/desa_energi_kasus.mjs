// Desa energi mandiri (F2 butir 7): daftar kasus pembangkit desa (PLTS komunal, PLTMH, biogas) berstatus hidup/rusak/mati beserta penyebab.
// Dikurasi tangan dari sumber terbuka (Mongabay Indonesia, detikJateng, listrikindonesia.com, Katadata); isi diparafrase, tiap baris punya tautan sumber.
// Daftar resmi per unit (ESDM DJEBTKE, Kemendes) tidak terbuka: geoportal.esdm.go.id robots Disallow /, ebtke.esdm.go.id melarang /simantaps/; dicatat di meta.celah.
// Titik = pusat kabupaten perkiraan (bukan lokasi desa). Jalankan: node scripts/panen/desa_energi_kasus.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const PENYEBAB = ['komponen', 'biaya', 'kelembagaan', 'sdm', 'bencana', 'jaringan_pln', 'beban', 'tak_diketahui'];
export const STATUS = ['hidup', 'rusak', 'mati'];
export const JENIS = ['plts-komunal', 'pltmh', 'biogas'];

const S = {
  halsel: { judul: 'Tidak hanya terpasang, PLTS di Halmahera Selatan perlu dirawat agar tidak rusak', penerbit: 'Mongabay Indonesia', tanggal: '2023-08-13', url: 'https://mongabay.co.id/2023/08/13/tidak-hanya-terpasang-plts-di-halmahera-selatan-perlu-dirawat-agar-tidak-rusak/' },
  gajah: { judul: 'Padamnya listrik tenaga surya di Gajah Makmur', penerbit: 'Mongabay Indonesia', tanggal: '2020-10-03', url: 'https://mongabay.co.id/2020/10/03/padamnya-listrik-tenaga-surya-di-gajah-makmur/' },
  sinjai: { judul: 'Rusak dan mangkraknya pembangkit surya di Kepulauan Sembilan Sinjai, di mana masalahnya?', penerbit: 'Mongabay Indonesia', tanggal: '2020-10-16', url: 'https://mongabay.co.id/2020/10/16/rusak-dan-mangkraknya-pembangkit-surya-di-kepulauan-sembilan-sinjai-dimana-masalahnya/' },
  penyalai: { judul: 'Berbagai tantangan hidupkan energi matahari di Pulau Penyalai', penerbit: 'Mongabay Indonesia', tanggal: '2023-08-15', url: 'https://mongabay.co.id/2023/08/15/berbagai-tantangan-hidupkan-energi-matahari-di-pulau-penyalai-2/' },
  enggelam: { judul: 'Muara Enggelam, desa role model PLTS komunal di Kalimantan Timur', penerbit: 'Mongabay Indonesia', tanggal: '2023-08-16', url: 'https://mongabay.co.id/2023/08/16/muara-enggelam-desa-role-model-plts-komunal-di-kalimantan-timur/' },
  aro: { judul: 'Berdaulat energi surya dari Dusun Talang Aro', penerbit: 'Mongabay Indonesia', tanggal: '2023-02-21', url: 'https://mongabay.co.id/2023/02/21/berdaulat-energi-surya-dari-dusun-talang-aro/' },
  parang: { judul: 'Miris! Hampir semua PLTS di Parang Karimunjawa rusak sejak 2019', penerbit: 'detikJateng', tanggal: '2022-03-12', url: 'https://www.detik.com/jateng/berita/d-5979817/miris-hampir-semua-plts-di-parang-karimunjawa-rusak-sejak-2019' },
  tunda: { judul: 'Minim tenaga teknis, PLTS Pulau Tunda Banten rusak', penerbit: 'listrikindonesia.com', tanggal: '2026-05-11', url: 'https://listrikindonesia.com/detail/20025/minim-tenaga-teknis-plts-pulau-tunda-banten-rusak' },
  tepal: { judul: 'Jalan terjal Desa Tepal wujudkan kemandirian energi', penerbit: 'Mongabay Indonesia', tanggal: '2026-04-02', url: 'https://mongabay.co.id/2026/04/02/jalan-terjal-desa-tepal-wujudkan-kemandirian-energi/' },
  meratus: { judul: 'Ketika upaya warga Meratus mandiri energi minim dukungan pemerintah', penerbit: 'Mongabay Indonesia', tanggal: '2026-02-26', url: 'https://mongabay.co.id/2026/02/26/ketika-upaya-warga-meratus-mandiri-energi-minim-dukungan-pemerintah/' },
  samirono: { judul: 'Cerita warga Samirono, Bantar, beralih ke biogas dan gas rawa', penerbit: 'Mongabay Indonesia', tanggal: '2022-08-12', url: 'https://www.mongabay.co.id/2022/08/12/cerita-warga-samirono-bantar-beralih-ke-biogas-dan-gas-rawa/' },
  karang: { judul: 'Cerita masyarakat Karangtengah mandiri energi dari aliran sungai', penerbit: 'Mongabay Indonesia', tanggal: '2022-08-26', url: 'https://mongabay.co.id/2022/08/26/cerita-masyarakat-karangtengah-mandiri-energi-dari-aliran-sungai/' },
};
// pusat kabupaten perkiraan (lat, lng); prov = kode provinsi BPS
const K = {
  halsel: { kab: 'Halmahera Selatan', provinsi: 'Maluku Utara', prov: '82', lat: -0.63, lng: 127.49, presisi: 'kabupaten' },
  mukomuko: { kab: 'Mukomuko', provinsi: 'Bengkulu', prov: '17', lat: -2.57, lng: 101.1, presisi: 'kabupaten' },
  sinjai: { kab: 'Sinjai', provinsi: 'Sulawesi Selatan', prov: '73', lat: -5.12, lng: 120.25, presisi: 'kabupaten' },
  pelalawan: { kab: 'Pelalawan', provinsi: 'Riau', prov: '14', lat: 0.35, lng: 102.3, presisi: 'kabupaten' },
  kukar: { kab: 'Kutai Kartanegara', provinsi: 'Kalimantan Timur', prov: '64', lat: -0.42, lng: 116.99, presisi: 'kabupaten' },
  batanghari: { kab: 'Batanghari', provinsi: 'Jambi', prov: '15', lat: -1.72, lng: 103.15, presisi: 'kabupaten' },
  jepara: { kab: 'Jepara', provinsi: 'Jawa Tengah', prov: '33', lat: -5.85, lng: 110.45, presisi: 'kabupaten' },
  serang: { kab: 'Serang', provinsi: 'Banten', prov: '36', lat: -5.8, lng: 106.28, presisi: 'kabupaten' },
  sumbawa: { kab: 'Sumbawa', provinsi: 'Nusa Tenggara Barat', prov: '52', lat: -8.55, lng: 117.35, presisi: 'kabupaten' },
  hss: { kab: 'Hulu Sungai Selatan', provinsi: 'Kalimantan Selatan', prov: '63', lat: -2.77, lng: 115.3, presisi: 'kabupaten' },
  kalsel: { kab: null, provinsi: 'Kalimantan Selatan', prov: '63', lat: -2.8, lng: 115.4, presisi: 'provinsi' },
  semarang: { kab: 'Semarang', provinsi: 'Jawa Tengah', prov: '33', lat: -7.14, lng: 110.4, presisi: 'kabupaten' },
  banyumas: { kab: 'Banyumas', provinsi: 'Jawa Tengah', prov: '33', lat: -7.43, lng: 109.24, presisi: 'kabupaten' },
};
// [id, desa, jenis, kab, kapasitas_kw, tahun_bangun, status, sejak, penyebab[], uraian, sumber]
const B = [
  ['laigoma', 'Laigoma', 'plts-komunal', 'halsel', null, 2018, 'rusak', 2020, ['komponen', 'beban', 'sdm'], 'Rusak sekitar 1,5 tahun setelah menyala; warga menduga inverter hangus, pemakaian melampaui kapasitas penerangan, tanpa perawatan di tapak.', 'halsel'],
  ['siko', 'Siko', 'plts-komunal', 'halsel', null, 2016, 'rusak', 2022, ['komponen', 'sdm'], 'Rusak sekitar setahun sebelum liputan dan belum diperbaiki; pemerintah desa menentukan apakah Dana Desa dipakai.', 'halsel'],
  ['bokimiake', 'Bokimiake (Pulau Moari)', 'plts-komunal', 'halsel', null, null, 'rusak', null, ['sdm', 'tak_diketahui'], 'Masuk daftar desa dengan PLTS rusak; perawatan tingkat tapak minim dan warga tidak tahu cara menangani gangguan.', 'halsel'],
  ['marituso', 'Marituso (Pulau Kasiruta)', 'plts-komunal', 'halsel', null, null, 'rusak', null, ['sdm', 'tak_diketahui'], 'Masuk daftar desa dengan PLTS rusak; perawatan tingkat tapak minim.', 'halsel'],
  ['wiring', 'Wiring (Pulau Tawabi)', 'plts-komunal', 'halsel', null, null, 'rusak', null, ['sdm', 'tak_diketahui'], 'Masuk daftar desa dengan PLTS rusak; komponen pulau kecil rentan korosi air laut.', 'halsel'],
  ['gajah-makmur', 'Gajah Makmur', 'plts-komunal', 'mukomuko', 60, 2016, 'mati', 2017, ['kelembagaan', 'biaya', 'sdm'], 'Padam sejak akhir 2017: pengisian air aki tak ditangani, kepemilikan dan tanggung jawab perawatan simpang siur, dana warga rendah.', 'gajah'],
  ['buhung-pitue', 'Buhung Pitue (Pulau Burunglo\'e)', 'plts-komunal', 'sinjai', 100, 2016, 'mati', 2018, ['komponen', 'biaya'], 'Tidak beroperasi sejak 2018: baterai dan inverter rusak, perbaikan ratusan juta rupiah tertahan dana.', 'sinjai'],
  ['sembilan-lain', 'Kepulauan Sembilan (Liang-liang, Kanalo I dan II, Batang Lampe, Persatuan)', 'plts-komunal', 'sinjai', null, null, 'rusak', null, ['komponen', 'biaya'], 'Lima unit 30 sampai 50 kWp dilaporkan tidak beroperasi karena peralatan rusak; satu unit lain hanya melayani lampu jalan.', 'sinjai'],
  ['sungai-solok', 'Sungai Solok (Pulau Penyalai)', 'plts-komunal', 'pelalawan', null, 2009, 'mati', 2019, ['komponen', 'biaya', 'jaringan_pln'], 'Berhenti total 2019, sekitar tiga bulan setelah listrik diesel masuk: baterai rusak, operator dan APBDes tak mampu menggantinya.', 'penyalai'],
  ['sungai-upih', 'Sungai Upih (Pulau Penyalai)', 'plts-komunal', 'pelalawan', 75, 2016, 'mati', 2016, ['bencana'], 'Bangunan terbakar sekitar delapan bulan setelah beroperasi; penyebab belum terungkap, kini tersisa pagar.', 'penyalai'],
  ['teluk-bakau', 'Teluk Bakau (Pulau Penyalai)', 'plts-komunal', 'pelalawan', null, null, 'mati', null, ['komponen', 'biaya'], 'Berhenti total setelah sekitar enam tahun: baterai menurun, iuran bulanan hanya cukup untuk gaji dan perbaikan kecil.', 'penyalai'],
  ['teluk-beringin', 'Teluk Beringin (Pulau Penyalai)', 'plts-komunal', 'pelalawan', 60, null, 'rusak', null, ['komponen', 'sdm'], 'Masih menyala tetapi menyusut: hanya pukul 05.00 sampai 07.00, enam dari sepuluh unit mati, tak ada teknisi lokal untuk perbaikan besar.', 'penyalai'],
  ['muara-enggelam', 'Muara Enggelam', 'plts-komunal', 'kukar', 42, 2015, 'hidup', null, [], 'Menyala delapan tahun lebih; dikelola BUMDes lewat peraturan desa dengan retribusi bulanan untuk operasional, gaji teknisi, dan tabungan ganti baterai.', 'enggelam'],
  ['talang-aro', 'Talang Aro (Desa Aro)', 'plts-komunal', 'batanghari', 20, 2015, 'hidup', null, ['bencana'], 'Sempat rusak disambar petir pada 2017, pulih sejak 2019; tiga teknisi warga merawat dan iuran Rp15.000 per bulan untuk 72 rumah.', 'aro'],
  ['sialang-pungguk', 'Sialang Pungguk', 'plts-komunal', 'batanghari', null, 2016, 'mati', 2018, ['komponen'], 'Inverter dan baterai rusak pada 2018 dan sistem dibiarkan terbengkalai; dibangun dari DAK energi skala kecil 2016.', 'aro'],
  ['parang', 'Parang (Karimunjawa)', 'plts-komunal', 'jepara', 75, 2014, 'rusak', 2019, ['komponen'], 'Hampir seluruh sistem 75 kWp tidak berfungsi sejak 2019 karena baterai dan peralatan lain; desa bertumpu pada genset.', 'parang'],
  ['pulau-tunda', 'Pulau Tunda', 'plts-komunal', 'serang', null, null, 'rusak', 2026, ['komponen', 'sdm'], 'Panel masih baik tetapi baterai dan instalasi rusak; teknisi terlatih terbatas sehingga gangguan kecil membesar, warga kembali ke PLTD.', 'tunda'],
  ['tepal', 'Tepal', 'pltmh', 'sumbawa', 40, 2009, 'hidup', null, ['komponen', 'bencana', 'beban'], 'Menyala lebih dari satu dekade dengan koperasi, namun pasokan sering goyah: runner turbin rusak, suku cadang dari luar daerah, banjir dan debit kemarau.', 'tepal'],
  ['juhu', 'Juhu (Meratus)', 'pltmh', 'kalsel', 4, null, 'mati', null, ['bencana', 'biaya'], 'Hancur diterjang banjir bandang; pembangunan ulang sekitar Rp300 juta belum terlaksana karena anggaran.', 'meratus'],
  ['loklahung', 'Loklahung', 'pltmh', 'hss', null, null, 'mati', null, ['tak_diketahui'], 'Bangunan telantar berlumut, kini menjadi bagian objek wisata air terjun.', 'meratus'],
  ['loksado', 'Loksado (Haratai dan sekitarnya)', 'pltmh', 'hss', null, null, 'mati', null, ['jaringan_pln'], 'Dari tujuh unit PLTMH, hanya satu (Balai Sulang Ai) yang masih menyala; peredupan dikaitkan dengan masuknya listrik PLN.', 'meratus'],
  ['mangkiki', 'Sungai Mangkiki (Meratus)', 'pltmh', 'kalsel', 17, null, 'mati', null, ['jaringan_pln'], 'Menyala 12 tahun tanpa kerusakan berarti, lalu tidak terawat setelah jaringan PLN tiba.', 'meratus'],
  ['karangtengah', 'Karangtengah', 'pltmh', 'banyumas', 15, 2015, 'hidup', null, [], 'Beroperasi mandiri untuk 75 rumah; warga membayar Rp500 per kWh untuk operator, perawatan, dan sewa lahan.', 'karang'],
  ['samirono', 'Samirono', 'biogas', 'semarang', null, 2001, 'mati', null, ['kelembagaan', 'komponen'], 'Biogas komunal dari pemerintah desa tak beroperasi: kompor dan lampu rusak, ternak berkurang dari delapan menjadi tiga ekor.', 'samirono'],
];
export function bangun() {
  const baris = B.map(([id, desa, jenis, kk, kw, th, status, sejak, penyebab, uraian, sk]) => {
    const k = K[kk];
    return { id: 'de-' + id, nama: desa, jenis, kabupaten: k.kab, provinsi: k.provinsi, kode_prov: k.prov, kapasitas_kw: kw, tahun_bangun: th, status, tahun_henti: sejak, penyebab, uraian,
      lokasi: { lat: k.lat, lng: k.lng, presisi: k.presisi, catatan: k.presisi === 'kabupaten' ? 'pusat kabupaten perkiraan, bukan lokasi desa' : 'pusat provinsi perkiraan, kabupaten tidak disebut sumber' },
      sumber: { ...S[sk] }, tingkat_bukti: 'berita' };
  });
  return {
    lapis: 'desa_energi_mandiri', tanggal_ambil: '2026-11-08', tingkat_bukti: 'berita', jumlah: baris.length,
    nasional: { sumber: { judul: 'Terkendala sumber daya manusia, beberapa pembangkit listrik EBT rusak', penerbit: 'Katadata', tanggal: '2018-12-10', url: 'https://katadata.co.id/berita/energi/5e9a558d01a63/terkendala-sumber-daya-manusia-beberapa-pembangkit-listrik-ebt-rusak' }, unit: 719, persen_rusak: 5, catatan: 'Pernyataan pejabat Ditjen EBTKE ESDM, Desember 2018: sekitar 5 persen dari 719 unit PLTMH dan PLTS desa rusak.' },
    meta: {
      metode: 'Kasus dikurasi dari liputan terbuka; bukan sensus dan bukan sampel acak. Kasus rusak/mati lebih sering diberitakan daripada yang menyala, jadi proporsi rusak di sini bukan angka nasional (EST).',
      tanpa: 'Tanpa Antara, tanpa media sosial, tanpa login; isi diparafrase.',
      celah: ['Daftar resmi PLTS terpusat dan PLTMH per desa (ESDM DJEBTKE) tidak terbit sebagai data terbuka; geoportal.esdm.go.id melarang robot dan ebtke.esdm.go.id melarang /simantaps/.', 'Data Kemendes (IDM) hanya menyebut status desa, bukan status pembangkit.', 'Kajian IESR/WRI tentang tingkat keberfungsian PLTS komunal belum ditemukan dalam bentuk angka publik.'],
      penyebab: PENYEBAB, status: STATUS, jenis: JENIS,
    },
    baris,
  };
}
export function periksa(d) {
  const salah = [];
  for (const r of d.baris) {
    if (!STATUS.includes(r.status)) salah.push(r.id + ' status');
    if (!JENIS.includes(r.jenis)) salah.push(r.id + ' jenis');
    if (r.penyebab.some((p) => !PENYEBAB.includes(p))) salah.push(r.id + ' penyebab');
    if (r.status !== 'hidup' && !r.penyebab.length) salah.push(r.id + ' tanpa penyebab');
    if (!/^https:\/\//.test(r.sumber.url) || /antaranews/.test(r.sumber.url)) salah.push(r.id + ' sumber');
    if (!(r.lokasi.lat < 7 && r.lokasi.lat > -12 && r.lokasi.lng > 94 && r.lokasi.lng < 142)) salah.push(r.id + ' koordinat');
  }
  return salah;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const d = bangun(), s = periksa(d);
  if (s.length) { console.error(s.join('\n')); process.exit(1); }
  fs.writeFileSync(path.join(AKAR, 'public/data/desa_energi_mandiri.json'), JSON.stringify(d, null, 1) + '\n');
  console.log('desa_energi_mandiri.json', d.jumlah, 'baris');
}
