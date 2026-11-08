#!/usr/bin/env node
// Inventaris PLTU + transisi + dampak udara -> public/data/pltu.json.
// Masukan lokal (tanpa jaringan): data/strategis/pltu.json (GEM Global Coal Plant Tracker 2026-07, CC BY 4.0, diunduh pemilik),
// public/data/karbon.json (Climate TRACE), organisasi.json (org_id), wilayah.json + geo/provinsi.json (provinsi dari koordinat).
// Angka dampak kesehatan = kutipan laporan CREA (publik) bertanggal; alokasi per provinsi = EST proporsional MW, BUKAN hasil CREA.
// Pakai: node scripts/panen/pltu.mjs --bangun | --selftest
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const j = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const TAHUN = 2026;
export const STATUS = { operating: 'operasi', construction: 'konstruksi', 'pre-construction': 'pra-konstruksi', announced: 'rencana', shelved: 'ditunda', retired: 'pensiun' };
export const kelasUmur = (u) => (u == null ? 'tak-diketahui' : u < 10 ? 'u0' : u < 20 ? 'u10' : u < 30 ? 'u20' : 'u30');
export const tingkatUmur = (u) => (u == null ? 'rendah' : u >= 25 ? 'tinggi' : u >= 15 ? 'sedang' : 'rendah');

// titik dalam poligon (ray casting); cincin luar saja, cukup untuk penentuan provinsi
function dalam(x, y, ring) {
  let c = false;
  for (let i = 0, k = ring.length - 1; i < ring.length; k = i++) {
    const [xi, yi] = ring[i], [xk, yk] = ring[k];
    if (yi > y !== yk > y && x < ((xk - xi) * (y - yi)) / (yk - yi) + xi) c = !c;
  }
  return c;
}
export function provDari(lon, lat, geo) {
  for (const f of geo.features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const p of polys) if (dalam(lon, lat, p[0])) return f.properties.kode;
  }
  // pesisir: titik di luar poligon kasar -> provinsi terdekat (pusat vertex)
  let best = null, bd = 1e9;
  for (const f of geo.features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const p of polys) for (const [x, y] of p[0]) { const d = (x - lon) ** 2 + (y - lat) ** 2; if (d < bd) { bd = d; best = f.properties.kode; } }
  }
  return bd < 0.25 ? best : null;
}

const SUMBER = [
  { id: 'gem-gcpt', judul: 'Global Coal Plant Tracker (rilis 2026-07)', penerbit: 'Global Energy Monitor', url: 'https://globalenergymonitor.org/projects/global-coal-plant-tracker/', lisensi: 'CC BY 4.0', tingkat_bukti: 'via-pihak-ketiga', tanggal: '2026-11-08' },
  { id: 'ct', judul: 'Climate TRACE v6 (aset sektor listrik, tahun 2024)', penerbit: 'Climate TRACE', url: 'https://climatetrace.org/', lisensi: 'CC BY 4.0', tingkat_bukti: 'est', tanggal: '2026-11-07' },
  { id: 'crea-2023', judul: 'Health Benefits of Just Energy Transition and Coal Phase-out in Indonesia', penerbit: 'CREA dan IESR', url: 'https://energyandcleanair.org/wp/wp-content/uploads/2023/07/CREA_IESR_Health-Benefits-of-Just-Energy-Transition-and-Coal-Phase-out-in-Indonesia_EN_07.2023.pdf', tahun: 2023, tingkat_bukti: 'kajian', tanggal: '2026-11-08' },
  { id: 'crea-t20', judul: 'Toxic Twenty: Unmasking Indonesia\'s most toxic coal-fired power plants', penerbit: 'CREA, CELIOS, Trend Asia', url: 'https://energyandcleanair.org/publication/toxic-twenty-unmasking-indonesias-most-toxic-coal-fired-power-plants/', tahun: 2025, tingkat_bukti: 'kajian', tanggal: '2026-11-08' },
  { id: 'crea-captive', judul: 'Indonesia\'s captive coal on the uptick (CREA dan GEM; pembaruan Jan 2026)', penerbit: 'CREA, Global Energy Monitor', url: 'https://energyandcleanair.org/publication/indonesias-captive-coal-on-the-uptick/', tahun: 2026, tingkat_bukti: 'kajian', tanggal: '2026-11-08' },
  { id: 'crea-jetp', judul: 'Health and economic benefits from early phase out of Indonesia\'s first JETP coal power plants', penerbit: 'CREA', url: 'https://energyandcleanair.org/publication/health-and-economic-benefits-from-early-phase-out-of-indonesias-first-jetp-coal/', tingkat_bukti: 'kajian', tanggal: '2026-11-08' },
  { id: 'jetp-cipp', judul: 'JETP Indonesia CIPP (Nov 2023): dua PLTU prioritas pensiun dini', penerbit: 'Sekretariat JETP Indonesia', url: 'https://jetp-id.org/', tingkat_bukti: 'resmi', tanggal: '2026-11-08' },
  { id: 'petromindo-cir1', judul: 'Airlangga confirms Cirebon-1 early retirement canceled, ADB funds to be shifted', penerbit: 'Petromindo', url: 'https://www.petromindo.com/news/article/airlangga-confirms-cirebon-1-early-retirement-canceled-adb-funds-to-be-shifted', tahun: 2025, tingkat_bukti: 'media', tanggal: '2026-11-08' },
  { id: 'perpres-112', judul: 'Perpres 112/2022 Pasal 3 (peta jalan pengakhiran PLTU, larangan PLTU baru dan pengecualiannya)', penerbit: 'Pemerintah RI', url: 'https://peraturan.go.id/files/Salinan+Perpres+Nomor+112+Tahun+2022.pdf', tahun: 2022, tingkat_bukti: 'resmi', tanggal: '2026-11-08' },
];

// Kutipan laporan CREA (angka persis dari ringkasan publik; rincian per PLTU TIDAK dipublikasikan di ringkasan, jadi tidak diisi)
const DAMPAK_NASIONAL = [
  { id: 'n1', sumber_id: 'crea-2023', tahun_data: 2022, label: { id: 'Kematian dini akibat PLTU batubara per tahun', en: 'Premature deaths from coal plants per year' }, nilai: 10500, satuan: { id: 'jiwa/tahun', en: 'deaths/year' }, catatan: { id: 'Selang kepercayaan 95% sekitar 6.500 sampai 16.400', en: '95% CI about 6,500 to 16,400' } },
  { id: 'n2', sumber_id: 'crea-2023', tahun_data: 2022, label: { id: 'Biaya kesehatan PLTU batubara per tahun', en: 'Annual health cost of coal plants' }, nilai: 7.4, satuan: { id: 'miliar USD/tahun', en: 'USD billion/year' }, catatan: { id: 'PLTU captive menyumbang sekitar seperlima dampak kesehatan', en: 'Captive plants account for about one fifth of health impacts' } },
  { id: 'n3', sumber_id: 'crea-t20', tahun_data: 2025, label: { id: 'Kematian dini 20 PLTU terburuk, 2026-2050 (proyeksi)', en: 'Premature deaths, 20 worst plants, 2026-2050 (projection)' }, nilai: 156000, satuan: { id: 'jiwa', en: 'deaths' }, catatan: { id: 'Daftar 20 PLTU dan angka per PLTU ada di laporan lengkap; ringkasan publik tidak merincinya', en: 'Plant list and per-plant figures are in the full report; the public summary does not break them out' } },
  { id: 'n4', sumber_id: 'crea-t20', tahun_data: 2025, label: { id: 'Kerugian ekonomi 20 PLTU terburuk, 2026-2050 (proyeksi)', en: 'Economic loss, 20 worst plants, 2026-2050 (projection)' }, nilai: 109, satuan: { id: 'miliar USD', en: 'USD billion' }, catatan: { id: 'Sekitar Rp 1.813 triliun; Rp 52,4 triliun per tahun', en: 'About IDR 1,813 trillion; IDR 52.4 trillion per year' } },
  { id: 'n5', sumber_id: 'crea-captive', tahun_data: 2030, label: { id: 'Kematian dini peleburan batubara dan PLTU captive terkait, 2030 (proyeksi)', en: 'Premature deaths, coal-based smelting and captive plants, 2030 (projection)' }, nilai: 5000, satuan: { id: 'jiwa', en: 'deaths' }, catatan: { id: 'Sekitar Rp 56 triliun (USD 3,42 miliar) beban ekonomi', en: 'About IDR 56 trillion (USD 3.42 billion) economic burden' } },
  { id: 'n6', sumber_id: 'crea-captive', tahun_data: 2026, label: { id: 'Kematian dini tambahan bila captive dikecualikan dari target 2040 (kumulatif)', en: 'Extra premature deaths if captive is excluded from 2040 phase-out (cumulative)' }, nilai: 27000, satuan: { id: 'jiwa', en: 'deaths' }, catatan: { id: 'Sekitar USD 20 miliar beban ekonomi kumulatif', en: 'About USD 20 billion cumulative economic burden' } },
  { id: 'n7', sumber_id: 'crea-jetp', tahun_data: 2037, label: { id: 'Kematian yang dicegah bila Pelabuhan Ratu pensiun dini 2037 (periode 2038-2043)', en: 'Deaths avoided if Pelabuhan Ratu retires 2037 (2038-2043)' }, nilai: 5409, satuan: { id: 'jiwa', en: 'deaths' }, catatan: { id: 'Sekitar USD 3,7 miliar kerugian ekonomi dihindari', en: 'About USD 3.7 billion economic loss avoided' } },
];
// Nama PLTU yang disebut media sebagai bagian Toxic Twenty (urutan peringkat TIDAK dipastikan; media menyebut 19 nama dari 20)
const TOXIC20 = ['Suralaya', 'Paiton', 'Cirebon', 'Tanjung Jati', 'Cilacap', 'Bukit Asam', 'Pacitan', 'Pelabuhan Ratu', 'Adipala', 'Indramayu', 'Banten Labuan', 'Ombilin', 'Jawa-7', 'Celukan Bawang', 'Pangkalan Susu', 'Awar-Awar', 'Rembang', 'Banten Serang', 'Labuhan Angin'];

export function bangun() {
  const gem = j('data/strategis/pltu.json'), kar = j('public/data/karbon.json'), org = j('public/data/organisasi.json').baris;
  const wil = j('public/data/wilayah.json').baris, geo = j('public/geo/provinsi.json');
  const namaProv = Object.fromEntries(wil.map((w) => [w.kode, w.nama]));
  const orgId = new Map(org.map((o) => [o.nama.toLowerCase(), o.id]));
  const ct = new Map(kar.baris.map((b) => [b.id, b]));
  const mapPlant = new Map(gem.pembangkit.map((p) => [p.id, p]));
  const pasBukti = [];
  const unit = [];
  let batal = 0;
  for (const u of gem.unit) {
    if (u.status === 'cancelled') { batal++; continue; }
    const st = STATUS[u.status] || 'rencana';
    const umur = st === 'operasi' && u.tahun_mulai ? TAHUN - u.tahun_mulai : null;
    const prov = provDari(u.lon, u.lat, geo);
    const pem = (u.pemilik || []).filter((p) => p.persen > 0 || (u.pemilik || []).length === 1).slice(0, 3).map((p) => ({ nama: p.nama, persen: p.persen, org_id: p.organisasi_id || orgId.get(p.nama.toLowerCase()) || null }));
    const o = {
      id: u.unit_id, pid: u.pembangkit_id, pn: u.pembangkit.replace(/ power station$/i, '').replace(/ Project$/i, ''), u: u.unit || null, mw: u.kapasitas_mw, st,
      th: u.tahun_mulai || null, umur, ku: kelasUmur(umur), tek: u.teknologi_pembakaran === 'unknown' ? null : u.teknologi_pembakaran, bb: u.jenis_batubara === 'unknown' ? null : u.jenis_batubara,
      captive: !!u.captive, industri: u.captive || null, chp: u.chp ? true : undefined, pulau: u.wilayah, prov, kab: u.kota || null, lat: u.lat, lng: u.lon, akurasi: u.akurasi,
      pemilik: pem, co2_gem_jt: u.co2_juta_t_per_tahun ? +u.co2_juta_t_per_tahun.toFixed(3) : null, sisa_umur: st === 'operasi' ? u.sisa_umur_tahun : null,
      rencana_pensiun: u.rencana_pensiun || null, ct: u.karbon_id || null, wiki: u.url_wiki,
    };
    unit.push(Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== false)));
  }
  // agregat per pembangkit (hanya yang punya unit non-batal)
  const per = new Map();
  for (const u of unit) { if (!per.has(u.pid)) per.set(u.pid, []); per.get(u.pid).push(u); }
  const pembangkit = [];
  for (const [pid, us] of per) {
    const p = mapPlant.get(pid), op = us.filter((x) => x.st === 'operasi');
    const aktif = op.length ? op : us;
    const umurMaks = op.length ? Math.max(...op.map((x) => x.umur ?? 0)) : null;
    const ctIds = [...new Set(us.map((x) => x.ct).filter(Boolean))];
    const ctAset = ctIds.map((i) => ct.get(i)).filter(Boolean);
    const emisi = ctAset.reduce((s, a) => s + (a.emisi_tco2e || 0), 0);
    const pem = us.flatMap((x) => x.pemilik || []);
    const utama = pem.sort((a, b) => (b.persen || 0) - (a.persen || 0))[0] || null;
    const nm = us[0].pn;
    const t20 = TOXIC20.some((k) => nm.toLowerCase().includes(k.toLowerCase()) || (p?.nama || '').toLowerCase().includes(k.toLowerCase()));
    const o = {
      id: pid, nama: nm, st: aktif[0].st, mw_operasi: op.reduce((s, x) => s + x.mw, 0), mw_konstruksi: us.filter((x) => x.st === 'konstruksi').reduce((s, x) => s + x.mw, 0),
      mw_rencana: us.filter((x) => ['pra-konstruksi', 'rencana', 'ditunda'].includes(x.st)).reduce((s, x) => s + x.mw, 0), jumlah_unit: us.length, th_awal: Math.min(...us.map((x) => x.th || 9999).filter((x) => x < 9999), 9999) === 9999 ? null : Math.min(...us.map((x) => x.th || 9999)),
      umur_maks: umurMaks, umur_tertua: umurMaks, ku: kelasUmur(umurMaks), tingkat: tingkatUmur(umurMaks), captive: us.some((x) => x.captive), industri: us.find((x) => x.industri)?.industri || null,
      pulau: us[0].pulau, prov: us[0].prov, kab: us[0].kab, lat: p?.lat ?? us[0].lat, lng: p?.lon ?? us[0].lng, pemilik: utama, emisi_ct_t: ctAset.length ? Math.round(emisi) : null, emisi_ct_tahun: ctAset.length ? ctAset[0].tahun : null,
      co2_gem_jt: +us.reduce((s, x) => s + (x.co2_gem_jt || 0), 0).toFixed(2) || null, toxic20: t20 || undefined, prov_kode: us[0].prov,
    };
    pembangkit.push(Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== false && v !== 0)));
  }
  pembangkit.sort((a, b) => (b.mw_operasi || 0) - (a.mw_operasi || 0));
  // kandidat pensiun dini
  const cari = (re, mw) => unit.filter((x) => re.test(x.pn) && x.st === 'operasi' && (!mw || x.mw === mw));
  const cir = cari(/^Cirebon$/, 660), pel = cari(/^Pelabuhan Ratu$/);
  const kandidat = [
    { id: 'k-cirebon1', nama: 'PLTU Cirebon-1', pid: cir[0]?.pid, unit_ids: cir.map((x) => x.id), mw: 660, jalur: ['jetp', 'etm'], status: 'dibatalkan', tahun_target: 2035, tahun_asal: 2042,
      catatan: { id: 'Pensiun dini lewat ADB Energy Transition Mechanism dibatalkan pemerintah (Des 2025) karena biaya kompensasi PLN sekitar Rp 60 triliun untuk percepatan 5 tahun; dana ETM akan dialihkan ke PLTU lebih tua di Jawa yang belum dipilih.', en: 'Early retirement under the ADB Energy Transition Mechanism was cancelled by the government (Dec 2025) over about IDR 60 trillion compensation for a 5-year acceleration; ETM funds are to move to an older Java plant not yet chosen.' },
      regulasi: ['perpres-112-2022'], sumber_ids: ['jetp-cipp', 'petromindo-cir1'], tingkat_bukti: 'media' },
    { id: 'k-pelabuhanratu', nama: 'PLTU Pelabuhan Ratu', pid: pel[0]?.pid, unit_ids: pel.map((x) => x.id), mw: 1050, jalur: ['jetp'], status: 'calon', tahun_target: 2037,
      catatan: { id: 'Prioritas kedua CIPP JETP. Kapasitas dilaporkan 1.050 MW (CREA) atau 969 MW (Katadata); GEM mencatat tiga unit 350 MW. CREA memperkirakan 5.409 kematian dihindari dan USD 3,7 miliar pada 2038-2043.', en: 'Second JETP CIPP priority. Capacity reported as 1,050 MW (CREA) or 969 MW (Katadata); GEM lists three 350 MW units. CREA estimates 5,409 deaths and USD 3.7 billion avoided in 2038-2043.' },
      regulasi: ['perpres-112-2022'], sumber_ids: ['jetp-cipp', 'crea-jetp'], tingkat_bukti: 'kajian' },
  ];
  const gemRencana = unit.filter((x) => x.rencana_pensiun && x.st === 'operasi').map((x) => ({ id: 'k-gem-' + x.id, nama: `${x.pn} ${x.u || ''}`.trim(), pid: x.pid, unit_ids: [x.id], mw: x.mw, jalur: ['gem'], status: 'tercatat', tahun_target: x.rencana_pensiun,
    catatan: { id: 'Tahun pensiun menurut data GEM (rencana pemilik atau perkiraan GEM), bukan keputusan pemerintah.', en: 'Retirement year per GEM data (owner plan or GEM estimate), not a government decision.' }, regulasi: [], sumber_ids: ['gem-gcpt'], tingkat_bukti: 'via-pihak-ketiga' }));
  // usia >= 30 tahun, jaringan (bukan captive): pengamatan mekanis, label EST
  const tua = unit.filter((x) => x.st === 'operasi' && !x.captive && (x.umur || 0) >= 30 && !x.rencana_pensiun);
  const tuaPer = new Map(); for (const x of tua) { if (!tuaPer.has(x.pid)) tuaPer.set(x.pid, []); tuaPer.get(x.pid).push(x); }
  const usia = [...tuaPer].map(([pid, us]) => ({ id: 'k-usia-' + pid, nama: us[0].pn, pid, unit_ids: us.map((x) => x.id), mw: us.reduce((s, x) => s + x.mw, 0), jalur: ['usia'], status: 'pengamatan', tahun_target: null,
    catatan: { id: 'EST METI: unit jaringan berumur 30 tahun atau lebih (kriteria mekanis, bukan keputusan atau daftar resmi). Perpres 112/2022 Pasal 3 mengatur peta jalan dan penetapan PLTU yang dipensiunkan oleh Menteri ESDM.', en: 'METI EST: grid units aged 30 years or more (mechanical criterion, not an official list). Perpres 112/2022 Article 3 sets the roadmap and ministerial designation of retired plants.' },
    regulasi: ['perpres-112-2022'], sumber_ids: ['gem-gcpt', 'perpres-112'], tingkat_bukti: 'est' }));
  // alokasi EST kematian dini nasional ke provinsi menurut MW operasi (kasar; bukan hasil CREA)
  const mwProv = {}; let mwTot = 0;
  for (const x of unit) if (x.st === 'operasi' && x.prov) { mwProv[x.prov] = (mwProv[x.prov] || 0) + x.mw; mwTot += x.mw; }
  const provinsi = Object.entries(mwProv).map(([k, mw]) => ({ kode: k, nama: namaProv[k] || k, mw_operasi: mw, pangsa: +(mw / mwTot).toFixed(4), kematian_est: Math.round((10500 * mw) / mwTot), biaya_est_musd: +((7400 * mw) / mwTot).toFixed(0),
    mw_captive: unit.filter((x) => x.prov === k && x.st === 'operasi' && x.captive).reduce((s, x) => s + x.mw, 0), emisi_ct_t: Math.round(pembangkit.filter((p) => p.prov === k).reduce((s, p) => s + (p.emisi_ct_t || 0), 0)) })).sort((a, b) => b.mw_operasi - a.mw_operasi);
  const op = unit.filter((x) => x.st === 'operasi');
  const meta = {
    jumlah_unit: unit.length, jumlah_pembangkit: pembangkit.length, dibatalkan_dikecualikan: batal, mw_operasi: op.reduce((s, x) => s + x.mw, 0), mw_captive_operasi: op.filter((x) => x.captive).reduce((s, x) => s + x.mw, 0),
    mw_konstruksi: unit.filter((x) => x.st === 'konstruksi').reduce((s, x) => s + x.mw, 0), unit_operasi: op.length, umur_rata_tertimbang: +(op.reduce((s, x) => s + (x.umur || 0) * x.mw, 0) / op.reduce((s, x) => s + x.mw, 0)).toFixed(1),
    emisi_ct_total_t: Math.round(pembangkit.reduce((s, p) => s + (p.emisi_ct_t || 0), 0)), tahun_acuan_umur: TAHUN,
    catatan: 'Unit berstatus cancelled tidak dimuat. Umur = 2026 dikurangi tahun operasi (hanya unit beroperasi). emisi_ct = jumlah aset Climate TRACE yang cocok per pembangkit (estimasi satelit/model, bukan laporan operator). co2_gem_jt = estimasi GEM per unit. kematian_est dan biaya_est per provinsi = alokasi kasar nasional CREA 2023 menurut MW operasi, label EST, bukan hasil CREA per wilayah.',
  };
  return { lapis: 'publik', dibangun_pada: '2026-11-08', jumlah: pembangkit.length, sumber: SUMBER, meta, baris: pembangkit, unit, kandidat: [...kandidat, ...gemRencana, ...usia], dampak: { nasional: DAMPAK_NASIONAL, provinsi, toxic20_nama: TOXIC20 } };
}

if (process.argv.includes('--bangun')) {
  const d = bangun();
  fs.writeFileSync(path.join(ROOT, 'public/data/pltu.json'), JSON.stringify(d) + '\n');
  console.log(JSON.stringify(d.meta, null, 1), 'kandidat', d.kandidat.length, 'prov', d.dampak.provinsi.length);
}
if (process.argv.includes('--selftest')) {
  assert.equal(kelasUmur(9), 'u0'); assert.equal(kelasUmur(30), 'u30'); assert.equal(tingkatUmur(25), 'tinggi');
  const geo = { features: [{ properties: { kode: '99' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] } }] };
  assert.equal(provDari(5, 5, geo), '99'); assert.equal(provDari(50, 50, geo), null);
  console.log('ok');
}
