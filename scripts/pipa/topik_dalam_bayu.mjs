// Pendalaman naskah Bayu (8 Nov 2026): menggabungkan JSON repo dan menambah bab tulisan tangan. Dipanggil dari bangun() di topik_bayu.mjs.
import { pakaiDalam, G, FQ, LN, P, H, ke, pub, ringkasRuptl, proyeksi, proyeksiTeks, namaiLangkah, isoNegara, fmt, fmtE, T } from './topik_dalam.mjs';

const ISO_BARU = [['CHN', 'CN', 'Tiongkok', 'China'], ['DEU', 'DE', 'Jerman', 'Germany'], ['USA', 'US', 'Amerika Serikat', 'United States'], ['AUS', 'AU', 'Australia', 'Australia'], ['JPN', 'JP', 'Jepang', 'Japan'], ['KOR', 'KR', 'Korea Selatan', 'South Korea'], ['BRA', 'BR', 'Brasil', 'Brazil'], ['ZAF', 'ZA', 'Afrika Selatan', 'South Africa']];

export function perdalam(d, SUMBER) {
  return pakaiDalam(d, 'bayu', SUMBER, {
    pertahankan18: true, /* inovasi bertag bayu di basis hanya sertifikat TKDN turbin air (salah tag); tabel rantai pasok lama dipertahankan */
    bab7Tambah: () => {
      const rr = ringkasRuptl('bayu'); let c = 152.3; const titik = [['2024', c]];
      for (let y = 2025; y <= 2034; y++) { c += rr.per.find((x) => x.tahun === y)?.mw || 0; titik.push([String(y), Math.round(c * 10) / 10]); }
      return [{ nama: T('Jalur RUPTL 2025-2034 (kapasitas 2024 + proyek, EST)', 'RUPTL 2025-2034 path (2024 capacity + projects, EST)'), titik }];
    },
    isi: (d, { ambilSumber }) => isi(d, SUMBER, ambilSumber),
  });
}

function isi(d, SUMBER, ambilSumber) {
  ambilSumber('etp1', 'etp2', 'ruen', 'p112', 'ruptl', 'esdm_sidrap', 'esdm_tolo', 'bt_tl', 'irena_cost', 'gwec', 'konsul', 'ember', 'antara_sk', 'wiki_ltwp', 'ci_h4');
  const peluang = pub('peluang').baris.filter((r) => r.potensi?.bayu?.mw).sort((a, b) => b.potensi.bayu.mw - a.potensi.bayu.mw);
  const top3 = peluang.slice(0, 3), total = peluang.reduce((s, r) => s + r.potensi.bayu.mw, 0);

  ke(d, '2', 'faq', 'butir', FQ([
    ['Berapa lama dari konstruksi sampai COD?', 'How long from construction to COD?', 'PLTB Sidrap mulai dibangun Agustus 2015 dan beroperasi komersial 5 April 2018, sekitar 32 bulan (EST dari tanggal linimasa). Sebelum itu pengukuran angin minimal setahun, prakualifikasi DPT, izin lahan, dan PPA harus selesai (ETP).', 'The Sidrap wind farm started construction in August 2015 and entered commercial operation on 5 April 2018, about 32 months (EST from timeline dates). Before that a minimum of one year of wind measurement, DPT prequalification, land permits and a PPA must be completed (ETP).'],
    ['Bagaimana PLN membeli listrik dari PLTB?', 'How does PLN buy power from wind farms?', 'Lewat pemilihan langsung untuk semua kapasitas, dengan atau tanpa baterai; harga memakai harga patokan tertinggi atau harga kesepakatan yang disetujui Menteri, dan proses PPA paling lama 180 hari kalender untuk pemilihan langsung (Perpres 112/2022 Pasal 5, 6, 16).', 'Through direct selection for all capacities, with or without batteries; the price is the ceiling price or an agreed price approved by the Minister, and the PPA process takes up to 180 calendar days for direct selection (Presidential Reg. 112/2022 Articles 5, 6 and 16).'],
    ['Apakah PLTB membahayakan burung dan kelelawar?', 'Do wind farms harm birds and bats?', 'Risiko kematian burung dan kelelawar nyata di dunia dan harus ditelaah dalam studi lingkungan dengan pemantauan sebelum dan sesudah pembangunan; METI belum menemukan data kematian satwa terbuka dari Sidrap atau Tolo.', 'Bird and bat mortality is a real risk worldwide and must be assessed in the environmental study with monitoring before and after construction; METI has not found open wildlife mortality data from Sidrap or Tolo.'],
    ['Daerah mana yang punya potensi bayu terbesar?', 'Which regions have the largest wind potential?', `Menurut RUEN 2015 di basis peluang METI, tiga provinsi teratas ialah ${top3.map((r) => `${r.nama} (${fmt(r.potensi.bayu.mw)} MW)`).join(', ')}, dari total ${fmt(total)} MW yang tercatat per provinsi. Pengukuran terbuka per lokasi masih sangat terbatas.`, `Per RUEN 2015 in the METI opportunity base, the top three provinces are ${top3.map((r) => `${r.nama} (${fmtE(r.potensi.bayu.mw)} MW)`).join(', ')}, of ${fmtE(total)} MW recorded across provinces. Open per-site measurements remain very limited.`],
  ]), ['etp1', 'esdm_sidrap', 'p112', 'd_izin', 'd_pot']);

  ke(d, '3', 'glosarium', 'butir', G([
    ['Efek bayangan angin (wake)', 'Wake effect', 'Turbulensi dan penurunan kecepatan angin di belakang turbin yang mengurangi produksi turbin di belakangnya.', 'Turbulence and reduced wind speed behind a turbine that cuts the output of turbines downwind.'],
    ['Tinggi hub (hub height)', 'Hub height', 'Tinggi pusat rotor dari tanah; menara lebih tinggi menjangkau angin lebih kencang, misalnya 133 m di Tolo dibanding 80 m di Sidrap.', 'Height of the rotor centre above ground; a taller tower reaches stronger wind, for example 133 m at Tolo versus 80 m at Sidrap.'],
    ['Cut-in dan cut-out', 'Cut-in and cut-out', 'Kecepatan angin terendah saat turbin mulai menghasilkan listrik dan tertinggi saat turbin dihentikan demi keselamatan.', 'The lowest wind speed at which a turbine starts producing power and the highest at which it is stopped for safety.'],
    ['Kurva daya (power curve)', 'Power curve', 'Grafik keluaran turbin terhadap kecepatan angin dari pabrikan.', 'The manufacturer graph of turbine output against wind speed.'],
    ['Distribusi Weibull', 'Weibull distribution', 'Model statistik sebaran kecepatan angin yang dipakai menghitung produksi tahunan.', 'A statistical model of wind speed distribution used to compute annual yield.'],
    ['Geser angin (wind shear)', 'Wind shear', 'Kenaikan kecepatan angin terhadap ketinggian; menentukan manfaat menara yang lebih tinggi.', 'The rise of wind speed with height; it determines the benefit of taller towers.'],
    ['Intensitas turbulensi', 'Turbulence intensity', 'Ukuran fluktuasi angin yang memengaruhi beban dan umur turbin.', 'A measure of wind fluctuation that affects turbine loads and life.'],
    ['Penempatan mikro (micrositing)', 'Micrositing', 'Penentuan posisi tiap turbin di lahan untuk memaksimalkan produksi dan menekan efek bayangan.', 'Choosing the position of each turbine on site to maximise output and limit wake effects.'],
    ['LiDAR', 'LiDAR', 'Alat ukur angin berbasis laser dari tanah atau kapal yang melengkapi menara pengukur (met mast).', 'A laser-based wind measurement device on the ground or a vessel that complements the met mast.'],
    ['Repowering', 'Repowering', 'Mengganti turbin lama dengan turbin lebih besar di lokasi yang sama.', 'Replacing old turbines with larger ones at the same site.'],
    ['Pondasi monopile, jaket, terapung', 'Monopile, jacket, floating foundations', 'Tiga jenis dasar turbin lepas pantai menurut kedalaman laut; terapung untuk perairan dalam.', 'Three kinds of offshore turbine foundation by sea depth; floating for deep water.'],
  ]), ['ed']);

  ke(d, '4', 'teks', 'paragraf', P([
    [`Berbeda dari matahari, angin di khatulistiwa cenderung lemah dan bergantung lokasi. Basis peluang METI mencatat potensi RUEN terbesar di ${top3[0].nama} dan sisanya terkonsentrasi di sedikit provinsi, sehingga proyek bayu adalah proyek lokasi, bukan proyek nasional merata.`, `Unlike the sun, wind near the equator tends to be weak and site-dependent. The METI opportunity base records the largest RUEN potential in ${top3[0].nama} with the rest concentrated in a few provinces, so wind projects are site projects, not evenly spread national ones.`],
    H('bayu dan surya saling melengkapi karena puncak keluaran bayu sering terjadi di waktu berbeda dari matahari, tetapi pola itu belum diukur terbuka di Indonesia; ketersediaan data angin per jam adalah syarat membuktikannya.', 'wind and solar complement each other because wind output often peaks at different times than the sun, but the pattern has not been measured openly in Indonesia; hourly wind data are required to prove it.'),
  ]), ['d_pot', 'ed']);

  ke(d, '5', 'rumus', 'rumus', P([
    ['Kerapatan daya angin (W per m2) = 0,5 x kerapatan udara x v pangkat tiga; kerapatan udara baku sekitar 1,225 kg per m3 pada permukaan laut.', 'Wind power density (W per m2) = 0.5 x air density x v cubed; standard air density is about 1.225 kg per m3 at sea level.'],
    ['Produksi P90 = produksi P50 x (1 - 1,2816 x ketidakpastian relatif); pemberi pinjaman biasanya menguji kelayakan pada P90, bukan P50.', 'P90 output = P50 output x (1 - 1.2816 x relative uncertainty); lenders usually test viability at P90, not P50.'],
  ]), ['ed']);
  ke(d, '5', 'rumus', 'contoh', P([
    ['Contoh kerapatan daya: pada 6 m/s = 0,5 x 1,225 x 216 = 132,3 W per m2; pada 7 m/s = 0,5 x 1,225 x 343 = 210,1 W per m2, naik 58,8 persen untuk selisih kecepatan hanya 1 m/s (EST).', 'Power density example: at 6 m/s = 0.5 x 1.225 x 216 = 132.3 W per m2; at 7 m/s = 0.5 x 1.225 x 343 = 210.1 W per m2, up 58.8 percent for a speed difference of only 1 m/s (EST).'],
    ['Contoh P90 (asumsi Hipotesis ketidakpastian 10 persen): faktor kapasitas P50 35 persen menjadi 35 x (1 - 0,12816) = 30,5 persen pada P90 (EST).', 'P90 example (Hypothesis assumption of 10 percent uncertainty): a P50 capacity factor of 35 percent becomes 35 x (1 - 0.12816) = 30.5 percent at P90 (EST).'],
  ]));

  namaiLangkah(d, '6', 'bayu', [[/Pengembang dan pemilik/, /pengembang|IPP/], [/Pemasok turbin/, /pemasok|manufaktur/], [/Operasi dan pemeliharaan/, /IPP|pengembang/]]);

  ke(d, '17', 'teks', 'paragraf', P([
    ['Repowering: turbin generasi lama diganti turbin lebih besar di lokasi sama, memanfaatkan jaringan dan izin yang ada; relevan bagi Sidrap dan Tolo setelah umur ekonomis berakhir.', 'Repowering: older turbines are replaced with larger ones at the same site, reusing grid and permits; relevant to Sidrap and Tolo after their economic life ends.'],
    ['Pengukuran dengan LiDAR dan LiDAR apung melengkapi menara pengukur sehingga survei angin lebih cepat dan lebih murah; ETP mensyaratkan pengukuran minimal setahun.', 'LiDAR and floating LiDAR measurement complement met masts so wind surveys are faster and cheaper; ETP requires at least a year of measurement.'],
    ['PLTB berbaterai: Tanah Laut direncanakan dengan baterai 10 MW/10 MWh sebagai bagian PPA, menjadi rujukan pertama hibrida bayu-baterai di Indonesia.', 'Wind with batteries: Tanah Laut was planned with a 10 MW/10 MWh battery as part of the PPA, the first reference for wind-battery hybrids in Indonesia.'],
    ['Penggerak langsung (direct drive) dan bilah segmen memudahkan transportasi bilah panjang di jalan sempit pulau; logistik menjadi penentu biaya (ETP).', 'Direct-drive and segmented blades ease transport of long blades on narrow island roads; logistics decide the cost (ETP).'],
    ['Bilah komposit sulit didaur ulang; riset daur ulang bilah sedang berkembang di dunia dan belum ada kebijakan khusus di Indonesia (catatan pantauan).', 'Composite blades are hard to recycle; blade recycling research is developing worldwide and Indonesia has no specific policy yet (watch note).'],
  ]), ['etp1', 'bt_tl', 'ed']);

  // pembanding negara: tambahkan iso2 ke baris lama, lalu delapan negara dari OWID
  const O = JSON.parse(JSON.stringify(d.bab['20']));
  for (const r of O.baris) r.iso2 ||= isoNegara(r);
  const ada = new Set(O.baris.map((r) => r.iso2));
  const dunia = JSON.parse(require_json('data/topik_dunia/owid_negara.json'));
  for (const [i3, i2, a, e] of ISO_BARU) {
    if (ada.has(i2)) continue;
    const s = dunia.seri[i3].wind_share_elec, th = Object.keys(s).map(Number).sort((a, b) => a - b).at(-1);
    O.baris.push({ negara: T(a, e), iso2: i2, porsi: s[th], lcoe: null, mekanisme: T(`Porsi bayu ${th} dari Ember via Our World in Data; mekanisme dukungan belum dipanen METI`, `Wind share ${th} from Ember via Our World in Data; support scheme not yet harvested by METI`) });
  }
  O.sumber = [...new Set([...(O.sumber || []), 'd_owid'])];
  d.bab['20'] = O; d.sumber.d_owid ||= { judul: 'Our World in Data energy-data (Ember Yearly Electricity Data), diiris ke data/topik_dunia/owid_negara.json', penerbit: 'Ember via Our World in Data', url: 'https://github.com/owid/energy-data', tanggal: '2026-11-08', tahun: 2026, bukti: 'via-pihak-ketiga', lisensi: 'CC BY 4.0' };

  ke(d, '30', 'tabel', 'baris', (() => {
    const p = proyeksi('bayu');
    return [
      { dok: T('Hitungan METI 2030 (EST)', 'METI calculation 2030 (EST)'), target: T(`Sekitar ${fmt(p.mw30)} MW bila proyek RUPTL 2025-2034 yang ber-COD sampai 2030 terealisasi`, `About ${fmtE(p.mw30)} MW if RUPTL 2025-2034 projects reaching COD by 2030 are delivered`), realisasi: T('Belum terealisasi; 152,3 MW terpasang 2024', 'Not yet delivered; 152.3 MW installed in 2024') },
      { dok: T('Hitungan METI 2045 (EST)', 'METI calculation 2045 (EST)'), target: T(`Sekitar ${fmt(p.mw45)} MW (interpolasi lurus 2034 ke 2060); tidak ada target resmi 2045`, `About ${fmtE(p.mw45)} MW (straight-line interpolation 2034 to 2060); no official 2045 target`), realisasi: T('Tidak berlaku', 'Not applicable') },
      { dok: T('RUKN 2025 (Kepmen ESDM 85.K/2025)', 'RUKN 2025 (Energy Ministry Decree 85.K/2025)'), target: T(`${fmt(p.mw60)} MW bayu pada 2060 (hlm 134)`, `${fmtE(p.mw60)} MW of wind in 2060 (p. 134)`), realisasi: T('Belum terealisasi', 'Not yet delivered') },
    ];
  })(), ['d_target', 'd_rpasok']);

  ke(d, '32', 'tabel', 'baris', [
    { butir: T('Jadwal COD RUPTL', 'RUPTL COD schedule'), indikator: T('PPA dan financial close empat proyek 460 MW (2026 sampai 2030)', 'PPA and financial close of four projects totalling 460 MW (2026 to 2030)'), mengapa: T(HIP_ID('selisih jadwal dan realisasi adalah ukuran kesehatan pasar bayu'), HIP_EN('the gap between schedule and delivery measures the health of the wind market')) },
    { butir: T('Revisi Perpres 112/2022', 'Revision of Presidential Reg. 112/2022'), indikator: T('batas atas dan bawah tarif EBT yang baru', 'new upper and lower renewable tariff bounds'), mengapa: T(HIP_ID('tarif 11 sen per kWh di Sidrap dan Tolo tidak lagi menjadi acuan'), HIP_EN('the 11 cents per kWh at Sidrap and Tolo is no longer the reference')) },
    { butir: T('Pengukuran angin terbuka', 'Open wind measurement'), indikator: T('publikasi data kecepatan angin per lokasi oleh ESDM atau BRIN', 'publication of per-site wind speed data by ESDM or BRIN'), mengapa: T(HIP_ID('belum ada ukuran terbuka per provinsi sehingga pengembang mengukur sendiri'), HIP_EN('there is no open per-province measurement so developers measure on their own')) },
    { butir: T('Sertifikasi tenaga teknik', 'Technician certification'), indikator: T('skema BNSP bayu baru atau pelatihan pabrikan', 'new BNSP wind schemes or manufacturer training'), mengapa: T(HIP_ID('kompetensi lokal menentukan biaya konstruksi dan operasi'), HIP_EN('local competence decides construction and operations cost')) },
    { butir: T('Lepas pantai', 'Offshore'), indikator: T('kajian zona dan pedoman perizinan laut untuk bayu', 'zone studies and marine permitting guidance for wind'), mengapa: T(HIP_ID('potensi 94,2 GW tidak bisa dihitung tanpa aturan ruang laut'), HIP_EN('the 94.2 GW potential cannot be counted without marine spatial rules')) },
  ], ['ed']);
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
function require_json(rel) { return fs.readFileSync(path.join(AKAR, rel), 'utf8'); }
const HIP_ID = (x) => 'Analisis METI (Hipotesis): ' + x;
const HIP_EN = (x) => 'METI analysis (Hypothesis): ' + x;
