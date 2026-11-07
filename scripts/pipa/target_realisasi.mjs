// Pelacak target pemerintah vs realisasi -> public/data/target_realisasi.json (halaman /target).
// Pakai: node scripts/pipa/target_realisasi.mjs [--tanggal=YYYY-MM-DD]
// Hanya merakit data repo yang sudah bersumber (target.json, ember_bulanan, program_analisis, rued_capaian, berita) + definisi target bersumber di bawah.
// Status = turunan EST: laju historis (kemiringan kuadrat terkecil, maks 10 pengamatan terakhir) dibanding laju yang dibutuhkan ke target.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (f) => JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data', f), 'utf8'));

export const AMBANG = { dijalur: 0.9, tertinggal: 0.5 };

/* tahun pecahan dari tanggal ISO */
export const tahunPecahan = (iso) => {
  const d = new Date(iso + 'T00:00:00Z'), a = Date.UTC(d.getUTCFullYear(), 0, 1);
  return d.getUTCFullYear() + (d - a) / 864e5 / 365;
};

/* kemiringan kuadrat terkecil atas maks 10 titik terakhir; null bila kurang dari 2 titik */
export function lajuHistoris(seri) {
  const p = seri.slice(-10);
  if (p.length < 2) return null;
  const n = p.length, mt = p.reduce((s, x) => s + x.t, 0) / n, mv = p.reduce((s, x) => s + x.v, 0) / n;
  const sxx = p.reduce((s, x) => s + (x.t - mt) ** 2, 0);
  return sxx ? p.reduce((s, x) => s + (x.t - mt) * (x.v - mv), 0) / sxx : null;
}

/* status: tercapai | di-jalur | tertinggal | jauh-tertinggal | tidak-ada-data */
export function nilaiStatus({ seri, nilai, tahun, sebanding = true }, tSekarang) {
  const kosong = { status: 'tidak-ada-data', laju: null, butuh: null, rasio: null, capaian: null };
  if (!seri.length) return kosong;
  const k = seri[seri.length - 1], laju = lajuHistoris(seri), capaian = (k.v / nilai) * 100;
  const hasil = (status, butuh = null, rasio = null) => ({ status, laju, butuh, rasio, capaian });
  if (!sebanding) return { ...kosong, capaian };
  if (k.v >= nilai) return hasil('tercapai');
  const tutup = (r) => (r >= AMBANG.dijalur ? 'di-jalur' : r >= AMBANG.tertinggal ? 'tertinggal' : 'jauh-tertinggal');
  if (tahun <= k.t) return hasil(capaian / 100 < 0.6 ? 'jauh-tertinggal' : 'tertinggal');
  const butuh = (nilai - k.v) / (tahun - k.t);
  if (laju == null) return hasil('tidak-ada-data', butuh);
  if (tahun <= tSekarang) { // tenggat lewat tanpa pengamatan sesudahnya
    const proy = (k.v + laju * (tahun - k.t)) / nilai;
    return hasil(proy < 0.9 ? (proy < 0.6 ? 'jauh-tertinggal' : 'tertinggal') : 'tidak-ada-data', butuh, laju / butuh);
  }
  if (laju <= 0) return hasil('jauh-tertinggal', butuh, 0);
  return hasil(tutup(laju / butuh), butuh, laju / butuh);
}

const bil = (id, en) => ({ id, en });
const ST = (...a) => a.map(([t, v]) => ({ t, v }));

/* ---------- rangkaian dari data repo ---------- */
function rangkaian(D) {
  const ember = D.ember.baris, jml = (th, nm) => ember.filter((b) => b.tahun === th && nm.includes(b.sumber_listrik)).reduce((s, b) => s + b.generasi_twh, 0);
  const tahunEmber = [...new Set(ember.map((b) => b.tahun))].sort();
  const bauranEmber = tahunEmber.map((th) => ({ t: th, v: +(jml(th, ['Bioenergy', 'Hydro', 'Solar', 'Wind', 'Other renewables']) / jml(th, ['Total generation']) * 100).toFixed(2) }));
  const emisiEmber = tahunEmber.map((th) => ({ t: th, v: ember.find((b) => b.tahun === th && b.sumber_listrik === 'Total generation')?.emisi_mtco2e })).filter((x) => x.v != null);
  const kap = D.target.kapasitas_ebt;
  return {
    primerEI: D.target.realisasi.energi_primer_ebt_persen_ei.map((x) => ({ t: x.tahun, v: x.nilai })),
    bauranEmber, emisiEmber,
    kapEbt: kap.map((x) => ({ t: x.tahun, v: x.total_ebt_mw })),
    kapSurya: kap.map((x) => ({ t: x.tahun, v: x.surya_mw })),
  };
}

const U = {
  ken79: 'https://peraturan.bpk.go.id/Details/5523', ken40: 'https://peraturan.bpk.go.id/Details/328789',
  rukn: 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/28dd4-rukn.pdf',
  ruptl: 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf',
  stat: 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/91fa8-buku-statistik-ketenagalistrikan-2024.pdf',
  owid: 'https://github.com/owid/energy-data', ember: 'https://ember-energy.org/data/yearly-electricity-data/',
  cipp: 'https://jetp-id.org/storage/executive-summary-jetp-cipp-2023-vshare_en-1700472885.pdf',
  sembur: 'https://www.jawapos.com/energi/2607200274/kementerian-esdm-targetkan-penyaluran-biodiesel-b50-capai-100-persen-pada-oktober-2026',
};

/* definisi target. seri: array {t,v,tgl?,url?}; kat: bauran|kapasitas|emisi|bahan-bakar|kendaraan */
function definisi(R) {
  const rukn = D0.target.target.find((x) => x.id === 'rukn-2025-pembangkitan').seri;
  const seriRukn = Object.entries(rukn).filter(([y]) => +y <= 2034).map(([y, v]) => [+y, v]);
  const tglE = D0.ember.meta.diperbarui, tglT = D0.target.meta.diperbarui;
  const primer = { seri: R.primerEI, sumber: { judul: 'Energy Institute via Our World in Data (energi primer, metode substitusi)', url: U.owid, tgl: tglT }, sumberNilai: 'EI' };
  const embSum = { judul: 'Ember Yearly Electricity Data (porsi pembangkitan terbarukan, dihitung dari bioenergi+hidro+surya+bayu+terbarukan lain)', url: U.ember, tgl: tglE };
  const kapSum = { judul: 'Statistik Ketenagalistrikan 2024 (Tabel 3) dan 2020, Ditjen Ketenagalistrikan ESDM', url: U.stat, tgl: tglT };
  const catEI = bil('Realisasi memakai bauran energi primer metode substitusi Energy Institute (10,95 persen, 2024); bukan angka resmi ESDM yang memasukkan biofuel dan biomassa, jadi selisih ke target bisa lebih lebar dari kenyataan resmi.', 'Actuals use the Energy Institute substitution-method primary energy mix (10.95 percent, 2024); not the official ESDM figure, which includes biofuels and biomass, so the gap to target may be wider than the official one.');
  return [
    { id: 'ken-2025-lama', kat: 'bauran', nama: bil('KEN lama: bauran EBT energi primer 23% (2025)', 'Old KEN: 23% renewables in primary energy (2025)'), dokumen: 'PP 79/2014 tentang Kebijakan Energi Nasional (dicabut PP 40/2025)', pasal: 'Pasal 9 huruf f butir 1, hlm 8', url: U.ken79, satuan: 'persen', nilai: 23, tahun: 2025, ...primer, catatan: catEI, kunci: /bauran (energi|ebt)|kebijakan energi nasional/i },
    { id: 'ken-2030', kat: 'bauran', nama: bil('KEN 2025: bauran EBT energi primer 19-23% (2030)', 'KEN 2025: 19-23% renewables in primary energy (2030)'), dokumen: 'PP 40/2025 tentang Kebijakan Energi Nasional', pasal: 'Pasal 10 huruf a butir 1, hlm 16', url: U.ken40, satuan: 'persen', nilai: 19, maks: 23, tahun: 2030, ...primer, catatan: catEI, kunci: /bauran (energi|ebt)|kebijakan energi nasional/i },
    { id: 'ken-2050', kat: 'bauran', nama: bil('KEN 2025: bauran EBT energi primer 53-55% (2050)', 'KEN 2025: 53-55% renewables in primary energy (2050)'), dokumen: 'PP 40/2025 tentang Kebijakan Energi Nasional', pasal: 'Pasal 10 huruf a butir 3, hlm 16', url: U.ken40, satuan: 'persen', nilai: 53, maks: 55, tahun: 2050, ...primer, catatan: catEI, kunci: /bauran (energi|ebt)|kebijakan energi nasional/i },
    { id: 'rukn-2030', kat: 'bauran', nama: bil('RUKN: EBT 21% produksi listrik (2030)', 'RUKN: 21% renewables in power generation (2030)'), dokumen: 'RUKN, Kepmen ESDM 85.K/TL.01/MEM.L/2025', pasal: 'Tabel 8, hlm 177', url: U.rukn, satuan: 'persen', nilai: 21, tahun: 2030, seri: R.bauranEmber, sumber: embSum, seriTarget: seriRukn, catatan: bil('Realisasi dihitung dari data Ember (semua pembangkit termasuk captive); definisi RUKN menyangkut produksi listrik nasional.', 'Actuals computed from Ember data (all plants incl. captive); RUKN definition covers national power production.'), kunci: /RUKN|RUPTL|bauran/i },
    { id: 'rukn-2034', kat: 'bauran', nama: bil('RUKN: EBT 29,4% produksi listrik (2034)', 'RUKN: 29.4% renewables in power generation (2034)'), dokumen: 'RUKN, Kepmen ESDM 85.K/TL.01/MEM.L/2025', pasal: 'Tabel 8, hlm 177', url: U.rukn, satuan: 'persen', nilai: 29.4, tahun: 2034, seri: R.bauranEmber, sumber: embSum, seriTarget: seriRukn, catatan: bil('RUPTL 2025-2034 menargetkan 34,3 persen untuk 2034 (hlm 5), lebih tinggi dari RUKN.', 'RUPTL 2025-2034 targets 34.3 percent for 2034 (p. 5), above RUKN.'), kunci: /RUKN|RUPTL/i },
    { id: 'jetp-ebt', kat: 'bauran', nama: bil('JETP/CIPP: EBT 44% pembangkitan on-grid (2030)', 'JETP/CIPP: 44% on-grid renewable generation (2030)'), dokumen: 'JETP CIPP 2023, ringkasan eksekutif', pasal: 'Ringkasan eksekutif (target 2030)', url: U.cipp, satuan: 'persen', nilai: 44, tahun: 2030, seri: R.bauranEmber, sumber: embSum, catatan: bil('CIPP menaikkan target awal Joint Statement 2022 (34 persen) menjadi 44 persen; hanya jaringan on-grid, sedangkan realisasi Ember mencakup captive.', 'CIPP raised the 2022 Joint Statement target (34 percent) to 44 percent; on-grid only, while Ember actuals include captive.'), kunci: /JETP/i },
    { id: 'ruptl-ebt-2034', kat: 'kapasitas', nama: bil('RUPTL 2025-2034: tambah 42.569 MW EBT', 'RUPTL 2025-2034: add 42,569 MW renewables'), dokumen: 'RUPTL PLN 2025-2034 (Kepmen ESDM 188.K/TL.03/MEM.L/2025)', pasal: 'hlm 5', url: U.ruptl, satuan: 'mw', nilai: +(D0.target.meta.kapasitas_ebt_dasar_mw + 42569).toFixed(2), tahun: 2034, seri: R.kapEbt, sumber: kapSum, catatan: bil('Target ditampilkan sebagai kapasitas total (13.856 MW dasar 2024 + 42.569 MW tambahan). Realisasi 2025 belum ada dari sumber terbaca.', 'Target shown as total capacity (13,856 MW 2024 base + 42,569 MW addition). 2025 actuals are not yet available from a readable source.'), kunci: /RUPTL/i },
    { id: 'rukn-2060', kat: 'kapasitas', nama: bil('RUKN: 281.300 MW pembangkit terbarukan (2060)', 'RUKN: 281,300 MW renewable capacity (2060)'), dokumen: 'RUKN, Kepmen ESDM 85.K/TL.01/MEM.L/2025', pasal: 'hlm 134', url: U.rukn, satuan: 'mw', nilai: 281300, tahun: 2060, seri: R.kapEbt, sumber: kapSum, catatan: bil('Terbarukan = PLTS, PLTB, PLTA, PLTP, bio, laut (dihitung dari rincian RUKN).', 'Renewables = solar, wind, hydro, geothermal, bio, ocean (summed from RUKN breakdown).'), kunci: /RUKN/i },
    { id: 'plts-100gw', kat: 'kapasitas', nama: bil('Program PLTS 100 GW (2029)', '100 GW solar program (2029)'), dokumen: 'Program Presiden; Perpres PLTS 100 GWp masih disusun', pasal: 'belum ada pasal (rancangan)', url: 'https://industri.kontan.co.id/news/pemerintah-susun-perpres-demi-kawal-ambisi-prabowo-capai-target-kapasitas-plts-100-gw', satuan: 'mw', nilai: 100000, tahun: 2029, seri: R.kapSurya, sumber: kapSum, catatan: bil('Sumber target berupa berita (Kontan, 2026-09); realisasi kapasitas surya terpasang nasional 2024 dari Statistik Ketenagalistrikan.', 'Target source is a news report (Kontan, 2026-09); actual installed solar capacity 2024 from the electricity statistics.'), kunci: /PLTS 100|100 GW/i },
    { id: 'plts-atap-2025', kat: 'kapasitas', nama: bil('Kuota PLTS atap 2025: 1.004 MW', 'Rooftop solar 2025 quota: 1,004 MW'), dokumen: 'Permen ESDM 2/2024 (kuota nasional)', pasal: 'kuota 2025 menurut Bisnis.com 2024-06-04', url: 'https://ekonomi.bisnis.com/read/20240604/44/1771106/kuota-plts-atap-resmi-diketok-bauran-ebt-diharapkan-melesat', satuan: 'mw', nilai: 1004, tahun: 2026, seri: [{ t: 2025, v: 0, tgl: '2025-01-01' }, { t: tahunPecahan('2025-05-31'), v: 445, tgl: '2025-05', url: 'https://insight.kontan.co.id/news/rapor-setahun-permen-esdm-plts-atap-iklim-usaha-dinilai-jadi-lebih-pasti' }], sumber: { judul: 'Kontan: rapor setahun Permen ESDM PLTS atap (445 MW, 10.632 pelanggan)', url: 'https://insight.kontan.co.id/news/rapor-setahun-permen-esdm-plts-atap-iklim-usaha-dinilai-jadi-lebih-pasti', tgl: '2025-05-31' }, catatan: bil('Kuota tahunan bukan target kapasitas nasional; realisasi terakhir 445 MW per Mei 2025 (titik awal 0 diasumsikan 1 Januari 2025). Tenggat dihitung akhir 2025.', 'Annual quota, not a national capacity target; last actual 445 MW as of May 2025 (zero start assumed 1 Jan 2025). Deadline taken as end of 2025.'), kunci: /PLTS atap/i },
    { id: 'ndc-2030', kat: 'emisi', nama: bil('E-NDC: turun 31,89% emisi (2030, upaya sendiri)', 'E-NDC: 31.89% emission cut (2030, unconditional)'), dokumen: 'Enhanced NDC 2022 (dikutip RUKN)', pasal: 'RUKN hlm 89', url: U.rukn, satuan: 'persen', nilai: 31.89, maks: 43.2, tahun: 2030, seri: [], sebanding: false, catatan: bil('Realisasi penurunan emisi nasional resmi belum ada di data repo (laporan BUR/inventarisasi GRK tidak dipanen). Dengan dukungan internasional target 43,2 persen. Second NDC belum dipanen.', 'Official national emission-cut actuals are not in the repo data (BUR/GHG inventory not harvested). With international support the target is 43.2 percent. Second NDC not yet harvested.'), kunci: /NDC|penurunan emisi|net zero/i },
    { id: 'jetp-emisi', kat: 'emisi', nama: bil('JETP/CIPP: puncak emisi listrik on-grid maks 250 Mt (2030)', 'JETP/CIPP: on-grid power emissions peak at 250 Mt max (2030)'), dokumen: 'JETP CIPP 2023, ringkasan eksekutif', pasal: 'Ringkasan eksekutif (target 2030)', url: U.cipp, satuan: 'juta_ton', nilai: 250, tahun: 2030, arah: 'turun', seri: R.emisiEmber, sebanding: false, sumber: { judul: 'Ember Yearly Electricity Data (emisi pembangkitan, termasuk captive)', url: U.ember, tgl: tglE }, catatan: bil('Tidak sebanding: Ember menghitung seluruh pembangkitan termasuk captive (372,6 Mt, 2025), batas CIPP hanya on-grid. Ditampilkan sebagai konteks arah, tanpa status.', 'Not comparable: Ember counts all generation including captive (372.6 Mt, 2025), the CIPP cap is on-grid only. Shown as directional context, without a status.'), kunci: /JETP|emisi/i },
    { id: 'jetp-dana', kat: 'emisi', nama: bil('JETP: komitmen pendanaan US$21,4 miliar', 'JETP: US$21.4 billion funding commitment'), dokumen: 'JETP Indonesia (Joint Statement 2022, CIPP 2023)', pasal: 'angka 2026 menurut InvestorTrust', url: 'https://investortrust.id/esg/113579/why-bottlenecks-and-fiscal-realism-are-slowing-a-landmark-214-billion-clean-energy-transition', satuan: 'usd_miliar', nilai: 21.4, tahun: 2030, seri: ST([2026.08, 3.4]).map((x) => ({ ...x, tgl: '2026-01', url: 'https://www.merdeka.com/uang/read/8078535/menko-airlangga-sebut-realisasi-pendanaan-jetp-capai-usd34-miliar' })), sumber: { judul: 'Merdeka.com: realisasi pendanaan JETP US$3,4 miliar (Menko Airlangga)', url: 'https://www.merdeka.com/uang/read/8078535/menko-airlangga-sebut-realisasi-pendanaan-jetp-capai-usd34-miliar', tgl: '2026-01-31' }, catatan: bil('Satu pengamatan realisasi (US$3,4 miliar, Januari 2026), jadi laju belum bisa dihitung. Kebutuhan investasi sampai 2030 diperkirakan US$66,9 miliar.', 'A single actual (US$3.4 billion, January 2026), so no pace can be computed. Investment need to 2030 is estimated at US$66.9 billion.'), kunci: /JETP/i },
    { id: 'pensiun-pltu', kat: 'emisi', nama: bil('Pensiun dini PLTU: 15 unit kandidat', 'Early coal retirement: 15 candidate plants'), dokumen: 'Perpres 112/2022; identifikasi ESDM Feb 2026', pasal: 'Perpres 112/2022 (jadwal pensiun belum ditetapkan)', url: 'https://ekonomi.bisnis.com/read/20260203/44/1949836/esdm-identifikasi-15-pltu-yang-berpotensi-dipensiunkan-dini', satuan: 'pltu', nilai: 15, tahun: 2030, seri: [{ t: 2026.09, v: 0, tgl: '2026-02-03', url: 'https://ekonomi.bisnis.com/read/20260203/44/1949836/esdm-identifikasi-15-pltu-yang-berpotensi-dipensiunkan-dini' }], sumber: { judul: 'Bisnis.com: ESDM identifikasi 15 PLTU berpotensi dipensiunkan dini; kasus Cirebon-1 dibatalkan Des 2025', url: 'https://ekonomi.bisnis.com/read/20260203/44/1949836/esdm-identifikasi-15-pltu-yang-berpotensi-dipensiunkan-dini', tgl: '2026-02-03' }, catatan: bil('Belum ada PLTU yang resmi dipensiunkan; angka 15 adalah kandidat, bukan target resmi bertahun, dan 2030 hanya penanda horizon.', 'No plant has been officially retired; 15 is a candidate count, not an official dated target, and 2030 is only a horizon marker.'), kunci: /pensiun/i },
    { id: 'b50-campuran', kat: 'bahan-bakar', nama: bil('B50: campuran biodiesel 50% (2026)', 'B50: 50% biodiesel blend (2026)'), dokumen: 'Kepmen ESDM 257.K/EK.01/MEM.E/2026', pasal: 'mandatori B50 berlaku 1 Juli 2026', url: 'https://finance.detik.com/energi/d-8554850/b50-mulai-berlaku-hari-ini-diresmikan-prabowo-awal-juli', satuan: 'persen', nilai: 50, tahun: 2026, seri: [{ t: 2025, v: 40, tgl: '2025-01-01' }, { t: tahunPecahan('2026-07-01'), v: 50, tgl: '2026-07-01', url: 'https://finance.detik.com/energi/d-8554850/b50-mulai-berlaku-hari-ini-diresmikan-prabowo-awal-juli' }], sumber: { judul: 'Detik: B50 mulai berlaku (B40 sejak 1 Januari 2025)', url: 'https://finance.detik.com/energi/d-8554850/b50-mulai-berlaku-hari-ini-diresmikan-prabowo-awal-juli', tgl: '2026-07-01' }, catatan: bil('Kewajiban campuran berlaku sejak 1 Juli 2026; penyaluran di lapangan masih bertahap (lihat kartu berikut).', 'The blend mandate applies since 1 July 2026; field distribution is still phased (see next card).'), kunci: /B50|B40|biodiesel/i },
    { id: 'b50-sebar', kat: 'bahan-bakar', nama: bil('B50: penyaluran 100% SPBU (1 Okt 2026)', 'B50: 100% station distribution (1 Oct 2026)'), dokumen: 'Target ESDM (Kepmen 257.K/EK.01/MEM.E/2026)', pasal: 'target penyaluran penuh 1 Oktober 2026', url: U.sembur, satuan: 'persen', nilai: 100, tahun: tahunPecahan('2026-10-01'), seri: [{ t: tahunPecahan('2026-07-01'), v: 0, tgl: '2026-07-01' }, { t: tahunPecahan('2026-07-20'), v: 67, tgl: '2026-07-20', url: U.sembur }], sumber: { judul: 'Jawa Pos: ESDM targetkan penyaluran B50 100 persen Oktober 2026 (sekitar 67 persen)', url: U.sembur, tgl: '2026-07-20' }, catatan: bil('Realisasi terakhir yang ada 67 persen (Juli 2026); tenggat 1 Oktober sudah lewat dan belum ada angka sesudahnya di repo.', 'Last available figure is 67 percent (July 2026); the 1 October deadline has passed with no later figure in the repo.'), kunci: /B50/i },
    { id: 'cofiring-2026', kat: 'bahan-bakar', nama: bil('Co-firing biomassa PLTU: 3,65 juta ton (2026)', 'Biomass co-firing: 3.65 million tons (2026)'), dokumen: 'Permen ESDM 12/2023; target PLN EPI', pasal: 'target pasokan 2026 menurut InvestorTrust', url: 'https://investortrust.id/business/110828/pln-epi-targetkan-pasokan-biomassa-3-65-juta-ton-pada-2026-percepat-co-firing-di-52-pltu', satuan: 'juta_ton', nilai: 3.65, tahun: 2027, seri: [{ t: 2026, v: 0, tgl: '2026-01-01' }, { t: tahunPecahan('2026-08-26'), v: 1.4, tgl: '2026-08-26', url: 'https://insight.kontan.co.id/news/pln-kebut-biomassa-co-firing-pltu-masif' }], sumber: { judul: 'Kontan: PLN kebut biomassa co-firing PLTU (sekitar 1,4 juta ton, 26 Agustus 2026)', url: 'https://insight.kontan.co.id/news/pln-kebut-biomassa-co-firing-pltu-masif', tgl: '2026-08-26' }, catatan: bil('Tenggat dihitung akhir 2026; titik awal 0 diasumsikan 1 Januari 2026. Laju hingga Agustus belum cukup untuk target setahun.', 'Deadline taken as end of 2026; zero start assumed 1 Jan 2026. The pace through August is not enough for the full-year target.'), kunci: /co-?firing|biomassa/i },
    { id: 'kendaraan-15juta', kat: 'kendaraan', nama: bil('Kendaraan listrik: 15 juta unit (2030)', 'Electric vehicles: 15 million units (2030)'), dokumen: 'Perpres 55/2019 jo. Perpres 79/2023; angka dari Kemenko Marves', pasal: 'angka 2 juta mobil + 13 juta motor menurut Antara (bukan pasal)', url: 'https://manado.antaranews.com/berita/241950/pemerintah-target-15-juta-kendaraan-listrik-beroperasi-di-indonesia-hingga-2030', satuan: 'unit', nilai: 15000000, tahun: 2030, seri: [{ t: 2025.5, v: 274000, tgl: '2025', url: 'https://www.cnnindonesia.com/ekonomi/20260203131144-85-1324022/kendaraan-listrik-tembus-274-ribu-esdm-kebut-infrastruktur' }], sumber: { judul: 'CNN Indonesia: kendaraan listrik tembus 274 ribu (ESDM)', url: 'https://www.cnnindonesia.com/ekonomi/20260203131144-85-1324022/kendaraan-listrik-tembus-274-ribu-esdm-kebut-infrastruktur', tgl: '2026-02-03' }, catatan: bil('Satu pengamatan (sekitar 274 ribu kendaraan listrik berbasis baterai, 2025), jadi laju belum bisa dihitung. Pembanding target dan realisasi mungkin berbeda cakupan roda dua dan empat.', 'A single observation (about 274 thousand battery EVs, 2025), so no pace can be computed. Target and actuals may differ in two- and four-wheeler coverage.'), kunci: /kendaraan listrik|mobil listrik|motor listrik/i },
    { id: 'spklu-2030', kat: 'kendaraan', nama: bil('SPKLU nasional 62.000 unit (2030)', '62,000 public chargers (2030)'), dokumen: 'Target ESDM (Perpres 55/2019 jo. 79/2023)', pasal: 'angka menurut Jawa Pos 2026-05-11', url: 'https://www.jawapos.com/energi/2605110427/esdm-patok-target-fantastis-jumlah-spklu-62-ribu-hingga-2030-saat-ini-baru-4892-unit', satuan: 'unit', nilai: 62000, tahun: 2030, seri: [{ t: tahunPecahan('2026-05-11'), v: 4892, tgl: '2026-05-11', url: 'https://www.jawapos.com/energi/2605110427/esdm-patok-target-fantastis-jumlah-spklu-62-ribu-hingga-2030-saat-ini-baru-4892-unit' }], sumber: { judul: 'Jawa Pos: ESDM patok target SPKLU 62 ribu, kini baru 4.892 unit', url: 'https://www.jawapos.com/energi/2605110427/esdm-patok-target-fantastis-jumlah-spklu-62-ribu-hingga-2030-saat-ini-baru-4892-unit', tgl: '2026-05-11' }, catatan: bil('Satu pengamatan (4.892 unit, Mei 2026), jadi laju belum bisa dihitung; tambahan yang dibutuhkan sekitar 15.700 unit per tahun.', 'A single observation (4,892 units, May 2026), so no pace can be computed; about 15,700 additional units a year are required.'), kunci: /SPKLU/i },
  ];
}

let D0;
const KATA_RESMI = /ESDM|Bahlil|Menteri|Menko|Presiden|Prabowo|PLN|Kemen|Dirjen|Wamen|Pemerintah|BKPM|Danantara|Airlangga|Eniya/i;

export function bangun(D, hariIni) {
  D0 = D;
  const tSek = tahunPecahan(hariIni), R = rangkaian(D);
  const hasil = definisi(R).map((d) => {
    const seri = d.seri.map((x) => ({ ...x, v: +x.v.toFixed(3) })), s = nilaiStatus({ seri, nilai: d.nilai, tahun: d.tahun, sebanding: d.sebanding !== false }, tSek);
    const k = seri[seri.length - 1];
    const jalur = k && d.tahun > k.t ? [[+k.t.toFixed(3), k.v], [+d.tahun.toFixed(3), d.nilai]] : [];
    const proyeksi = k && s.laju != null && d.tahun > k.t ? [[+k.t.toFixed(3), k.v], [+d.tahun.toFixed(3), +(k.v + s.laju * (d.tahun - k.t)).toFixed(3)]] : [];
    const pejabat = D.berita.baris.filter((b) => d.kunci.test(b.judul) && KATA_RESMI.test(b.judul)).sort((a, b) => b.terbit.localeCompare(a.terbit)).slice(0, 4)
      .map((b) => ({ judul: b.judul, url: b.url, media: b.media, tanggal: b.terbit.slice(0, 10) }));
    const { kunci, seri: _s, sumber, sumberNilai, ...sisa } = d; void kunci; void _s; void sumberNilai;
    return {
      ...sisa, seri, seriTarget: d.seriTarget ?? null, sumberRealisasi: sumber, jalur, proyeksi, pejabat,
      terbaru: k ? { t: k.t, v: k.v, tanggal: k.tgl ?? String(Math.floor(k.t)), url: k.url ?? sumber.url } : null,
      capaianPersen: s.capaian == null ? null : +s.capaian.toFixed(1), butuhPerTahun: s.butuh == null ? null : +s.butuh.toFixed(3),
      lajuHistoris: s.laju == null ? null : +s.laju.toFixed(3), rasioLaju: s.rasio == null ? null : +s.rasio.toFixed(2), status: s.status,
    };
  });
  const rued = D.rued.baris.map((r) => ({
    kode: r.kode, provinsi: r.provinsi, perda: r.perda, target: r.target_2025_persen, realisasi: r.realisasi_persen, tahunRealisasi: r.realisasi_tahun,
    rasio: r.rasio_persen, status: r.status === 'tercapai' ? 'tercapai' : r.status === 'di-jalur' ? 'di-jalur' : r.status === 'tertinggal' ? 'tertinggal' : 'tidak-ada-data',
    url: r.sumber_url, pdf: r.url_pdf, alasan: r.alasan_kosong,
  }));
  return {
    lapis: 'publik', dibangun_pada: hariIni, jumlah: hasil.length,
    metode: 'Status turunan EST: laju historis = kemiringan kuadrat terkecil atas maksimal 10 pengamatan terakhir; laju dibutuhkan = (target - realisasi terbaru) / sisa tahun. Rasio laju >= 0,9 di jalur; 0,5-0,9 tertinggal; < 0,5 jauh tertinggal. Satu pengamatan saja, tidak sebanding, atau tenggat lewat tanpa angka baru = tidak ada data.',
    ambang: AMBANG, ruedMetode: D.rued.metode, target: hasil, rued,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = process.argv.find((a) => a.startsWith('--tanggal='));
  const hari = arg ? arg.slice(10) : new Date().toISOString().slice(0, 10);
  const D = { target: baca('target.json'), ember: baca('ember_bulanan.json'), berita: baca('berita.json'), rued: baca('rued_capaian.json') };
  const o = bangun(D, hari);
  fs.writeFileSync(path.join(AKAR, 'public/data/target_realisasi.json'), JSON.stringify(o) + '\n');
  console.log('target_realisasi:', o.jumlah, 'target;', o.target.map((x) => x.id + '=' + x.status + (x.rasioLaju != null ? '(' + x.rasioLaju + ')' : '')).join(' '));
}
