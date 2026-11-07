#!/usr/bin/env node
// Panen web untuk tab Direktori anggota (pusat studi, aset riset, sistem data): memeriksa halaman resmi satu per satu.
//   node scripts/panen/panen_direktori.mjs --ambil     periksa REGISTRI ke jaringan, tulis data-panen/direktori/raw/web.json
//   node scripts/panen/panen_direktori.mjs --selftest  uji tanpa jaringan
// Etika (KPV §6): UA jujur, 1 permintaan serentak, jeda >= 2 dtk, robots.txt dicek per host (Disallow grup *),
// pengalihan diikuti manual dan robots host tujuan dicek juga, 403/429 = dicatat "menolak", tidak ditembus.
// Satu entri hanya lolos bila halaman menjawab 2xx DAN memuat kata kunci `harus` (nama resmi); jika tidak, dibuang.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const GAP_MS = 2300;
export const TGL = '2026-11-07';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../data-panen/direktori/raw/web.json');

// kode provinsi = kode BPS dua digit (sama dengan kampus.json dan PROV di direktori.js)
export const REGISTRI = {
  pusat_studi: [
    { id: 'ps-pse-ugm', nama: 'Pusat Studi Energi', singkatan: 'PSE UGM', induk: 'Universitas Gadjah Mada', kota: 'Yogyakarta', prov: '34', web: 'https://pse.ugm.ac.id/', harus: ['Pusat Studi Energi'] },
    { id: 'ps-sbrc-ipb', nama: 'Surfactant and Bioenergy Research Center', singkatan: 'SBRC', induk: 'Institut Pertanian Bogor', kota: 'Bogor', prov: '32', web: 'https://sbrc.ipb.ac.id/', harus: ['Surfactant and Bioenergy Research Center'], fokus: ['bioenergi'] },
    { id: 'ps-cbiore-undip', nama: 'Center of Biomass and Renewable Energy', singkatan: 'CBIORE', induk: 'Universitas Diponegoro', kota: 'Semarang', prov: '33', web: 'https://cbiore.id/', harus: ['CBIORE'], fokus: ['bioenergi'] },
    { id: 'ps-psdmbp-geologi', nama: 'Pusat Sumber Daya Mineral, Batubara dan Panas Bumi', singkatan: 'PSDMBP', induk: 'Badan Geologi, Kementerian ESDM', kota: 'Bandung', prov: '32', web: 'https://geologi.esdm.go.id/psdmbp', harus: ['Panas Bumi'], fokus: ['panas-bumi'] },
    { id: 'ps-orem-brin', nama: 'Organisasi Riset Energi dan Manufaktur', singkatan: 'OREM', induk: 'Badan Riset dan Inovasi Nasional', kota: 'Jakarta', prov: '31', web: 'https://brin.go.id/orem', harus: ['Organisasi Riset Energi dan Manufaktur'] },
    { id: 'ps-ortn-brin', nama: 'Organisasi Riset Tenaga Nuklir', singkatan: 'ORTN', induk: 'Badan Riset dan Inovasi Nasional', kota: 'Tangerang Selatan', prov: '36', web: 'https://brin.go.id/ortn', harus: ['Organisasi Riset Tenaga Nuklir'], fokus: ['nuklir'] },
  ],
  aset_riset: [
    { id: 'as-lemigas', nama: 'Balai Besar Pengujian Minyak dan Gas Bumi LEMIGAS', jenis: 'laboratorium uji', pemilik: 'Kementerian Energi dan Sumber Daya Mineral', unit: 'LEMIGAS', kota: 'Jakarta', prov: '31', web: 'https://www.lemigas.esdm.go.id/', harus: ['LEMIGAS'], layanan: 'Pengujian laboratorium, verifikasi alat, perawatan dan perbaikan peralatan pengujian (menurut situs resmi).' },
    // p3tkebt.esdm.go.id dialihkan resmi ke bbspkebtke.esdm.go.id; host tujuan melarang robot, jadi isinya TIDAK dibaca (hanya header pengalihan)
    { id: 'as-bbsp-kebtke', nama: 'Balai Besar Survei dan Pengujian Ketenagalistrikan, Energi Baru, Terbarukan dan Konservasi Energi', jenis: 'balai uji', pemilik: 'Kementerian Energi dan Sumber Daya Mineral', unit: 'BBSP KEBTKE', kota: 'Jakarta', prov: '31', web: 'https://p3tkebt.esdm.go.id/', harus: [], hanya_alih: 'bbspkebtke.esdm.go.id' },
  ],
  // sektor mengikuti SEKTOR di direktori.js; akses mengikuti AKSES; dipakai_pantau = sudah dipakai skrip panen METI
  sistem_data: [
    { id: 'sd-esdm-one-map', nama: 'ESDM One Map Indonesia', kepanjangan: 'Geoportal Kementerian ESDM', pemilik: 'Kementerian Energi dan Sumber Daya Mineral', portal_url: 'https://geoportal.esdm.go.id/', akses: 'terbuka', jenis_data: ['peta wilayah kerja', 'infrastruktur energi'], sektor: ['riset-data'], harus: [], uraian: 'Portal peta tematik sektor ESDM.' },
    { id: 'sd-gatrik', nama: 'Statistik Ketenagalistrikan', pemilik: 'Direktorat Jenderal Ketenagalistrikan, Kementerian ESDM', portal_url: 'https://gatrik.esdm.go.id/', akses: 'terbuka', jenis_data: ['statistik ketenagalistrikan'], sektor: ['jaringan', 'elektrifikasi'], harus: ['Ketenagalistrikan'], uraian: 'Situs resmi Ditjen Ketenagalistrikan; memuat publikasi statistik ketenagalistrikan.' },
    { id: 'sd-handbook-esdm', nama: 'Handbook of Energy & Economic Statistics of Indonesia', pemilik: 'Kementerian Energi dan Sumber Daya Mineral', portal_url: 'https://www.esdm.go.id/id/publikasi/handbook-of-energy-economic-statistics-of-indonesia', akses: 'terbuka', jenis_data: ['statistik energi', 'neraca energi'], format: ['pdf'], sektor: ['riset-data'], harus: ['Handbook'], uraian: 'Publikasi tahunan statistik energi dan ekonomi Indonesia.' },
    { id: 'sd-jdih-esdm', nama: 'JDIH Kementerian ESDM', kepanjangan: 'Jaringan Dokumentasi dan Informasi Hukum', pemilik: 'Kementerian Energi dan Sumber Daya Mineral', portal_url: 'https://jdih.esdm.go.id/', akses: 'terbuka', jenis_data: ['peraturan'], sektor: ['kebijakan'], harus: ['JDIH'], dipakai_pantau: true, uraian: 'Basis data peraturan sektor energi dan sumber daya mineral.' },
    { id: 'sd-ebtke', nama: 'Situs Direktorat Jenderal EBTKE', pemilik: 'Direktorat Jenderal EBTKE, Kementerian ESDM', portal_url: 'https://ebtke.esdm.go.id/', akses: 'terbuka', jenis_data: ['kebijakan EBT', 'siaran pers'], sektor: ['kebijakan'], harus: ['EBTKE'], uraian: 'Situs resmi Ditjen Energi Baru, Terbarukan dan Konservasi Energi.' },
    { id: 'sd-simebtke', nama: 'SIMEBTKE', kepanjangan: 'Sistem Informasi Manajemen EBTKE', pemilik: 'Direktorat Jenderal EBTKE, Kementerian ESDM', portal_url: 'https://simebtke.esdm.go.id/', akses: 'login', jenis_data: ['data proyek EBT'], sektor: ['riset-data'], harus: [], uraian: 'Sistem informasi manajemen Ditjen EBTKE.' },
    { id: 'sd-satu-data', nama: 'Portal Satu Data Indonesia', pemilik: 'Sekretariat Satu Data Indonesia, Bappenas', portal_url: 'https://data.go.id/', akses: 'terbuka', jenis_data: ['data terbuka pemerintah'], sektor: ['riset-data'], harus: ['Satu Data'], uraian: 'Portal resmi data terbuka Indonesia; mengumpulkan dataset instansi pusat dan daerah.' },
    { id: 'sd-bps', nama: 'Badan Pusat Statistik', pemilik: 'Badan Pusat Statistik', portal_url: 'https://www.bps.go.id/', akses: 'terbuka', jenis_data: ['statistik resmi', 'energi dan listrik rumah tangga'], sektor: ['riset-data'], harus: ['Badan Pusat Statistik'], dipakai_pantau: true, uraian: 'Statistik resmi nasional; tabel energi tersebar di subjek pertambangan, energi dan lingkungan.' },
    { id: 'sd-bmkg-dataonline', nama: 'Data Online BMKG', pemilik: 'Badan Meteorologi, Klimatologi, dan Geofisika', portal_url: 'https://dataonline.bmkg.go.id/', akses: 'login', jenis_data: ['iklim', 'cuaca'], sektor: ['surya', 'bayu'], harus: ['BMKG'], uraian: 'Data cuaca dan iklim historis; berguna untuk kajian sumber daya surya dan angin.' },
    { id: 'sd-idxcarbon', nama: 'IDXCarbon', kepanjangan: 'Bursa Karbon Indonesia', pemilik: 'Bursa Efek Indonesia', portal_url: 'https://www.idxcarbon.co.id/', akses: 'terbuka', jenis_data: ['perdagangan karbon', 'proyek karbon terdaftar'], sektor: ['karbon', 'pembiayaan'], harus: ['IDX Carbon'], dipakai_pantau: true, uraian: 'Penyelenggara perdagangan karbon; laporan bulanan ringkasan transaksi diterbitkan di situsnya.' },
    { id: 'sd-inaproc-katalog', nama: 'Katalog Elektronik INAPROC', pemilik: 'LKPP', portal_url: 'https://katalog.inaproc.id/', akses: 'terbuka', jenis_data: ['produk bersertifikat TKDN'], sektor: ['industri'], harus: ['Katalog'], uraian: 'Katalog elektronik pengadaan pemerintah; memuat produk bersertifikat TKDN.' },
    { id: 'sd-climate-trace', nama: 'Climate TRACE', pemilik: 'Koalisi Climate TRACE', portal_url: 'https://climatetrace.org/', api_url: 'https://api.climatetrace.org/v6/', akses: 'api-terbuka', jenis_data: ['emisi GHG per aset', 'pembangkit'], lisensi: 'CC BY 4.0', cakupan_internasional: true, dipakai_pantau: true, sektor: ['karbon'], harus: ['Climate TRACE'], uraian: 'Pelacakan emisi gas rumah kaca per aset berbasis satelit dan model.' },
    { id: 'sd-gem', nama: 'Global Energy Monitor', pemilik: 'Global Energy Monitor', portal_url: 'https://globalenergymonitor.org/', akses: 'terbuka', jenis_data: ['pelacak pembangkit dan infrastruktur energi'], cakupan_internasional: true, dipakai_pantau: true, sektor: ['riset-data'], harus: ['Global Energy Monitor'], uraian: 'Pelacak proyek pembangkit, pipa, dan tambang; unduhan data berlisensi per pelacak.' },
    { id: 'sd-irena', nama: 'IRENA Data and Statistics', pemilik: 'International Renewable Energy Agency', portal_url: 'https://www.irena.org/Data', akses: 'terbuka', jenis_data: ['kapasitas dan pembangkitan EBT', 'biaya'], cakupan_internasional: true, sektor: ['riset-data'], harus: ['IRENA'], uraian: 'Statistik kapasitas, pembangkitan, dan biaya energi terbarukan per negara.' },
    { id: 'sd-ember', nama: 'Ember Data', pemilik: 'Ember', portal_url: 'https://ember-energy.org/data/', akses: 'terbuka', jenis_data: ['pembangkitan listrik', 'emisi sektor listrik'], lisensi: 'CC BY 4.0', cakupan_internasional: true, sektor: ['jaringan', 'karbon'], harus: ['Ember'], uraian: 'Data terbuka pembangkitan listrik dan emisi sektor listrik.' },
    { id: 'sd-openalex', nama: 'OpenAlex', pemilik: 'OurResearch', portal_url: 'https://openalex.org/', api_url: 'https://api.openalex.org/', akses: 'api-terbuka', jenis_data: ['karya ilmiah', 'penulis', 'institusi'], lisensi: 'CC0', cakupan_internasional: true, dipakai_pantau: true, sektor: ['riset-data'], harus: ['OpenAlex'], uraian: 'Katalog terbuka karya ilmiah dunia; sumber data pakar dan riset direktori ini.' },
    { id: 'sd-iea', nama: 'IEA Data and Statistics', pemilik: 'International Energy Agency', portal_url: 'https://www.iea.org/data-and-statistics', akses: 'login', jenis_data: ['statistik energi dunia'], cakupan_internasional: true, sektor: ['riset-data'], harus: ['IEA'], uraian: 'Statistik energi dunia; sebagian gratis, sebagian perlu langganan.' },
    { id: 'sd-global-solar-atlas', nama: 'Global Solar Atlas', pemilik: 'World Bank Group dan ESMAP', portal_url: 'https://globalsolaratlas.info/', akses: 'terbuka', jenis_data: ['potensi surya'], lisensi: 'CC BY 4.0', cakupan_internasional: true, sektor: ['surya'], harus: ['Global Solar Atlas'], uraian: 'Ringkasan potensi tenaga surya dan sumber daya surya global.' },
    { id: 'sd-global-wind-atlas', nama: 'Global Wind Atlas', pemilik: 'Technical University of Denmark dan World Bank Group', portal_url: 'https://globalwindatlas.info/', akses: 'terbuka', jenis_data: ['potensi angin'], cakupan_internasional: true, sektor: ['bayu'], harus: ['Global Wind Atlas'], uraian: 'Aplikasi web gratis untuk mengenali wilayah berangin tinggi.' },
    { id: 'sd-worldbank', nama: 'World Bank Open Data: Indonesia', pemilik: 'World Bank', portal_url: 'https://data.worldbank.org/country/indonesia', akses: 'terbuka', jenis_data: ['indikator pembangunan', 'akses listrik'], lisensi: 'CC BY 4.0', cakupan_internasional: true, dipakai_pantau: true, sektor: ['riset-data'], harus: ['Indonesia'], uraian: 'Indikator pembangunan Indonesia dari Bank Dunia.' },
    { id: 'sd-wri-gppd', nama: 'Global Power Plant Database', pemilik: 'World Resources Institute', portal_url: 'https://datasets.wri.org/dataset/globalpowerplantdatabase', akses: 'terbuka', jenis_data: ['pembangkit listrik'], lisensi: 'CC BY 4.0', cakupan_internasional: true, dipakai_pantau: true, sektor: ['jaringan'], harus: ['Global Power Plant Database'], uraian: 'Basis data pembangkit listrik dunia berikut kapasitas dan bahan bakar.' },
    { id: 'sd-openinframap', nama: 'Open Infrastructure Map', pemilik: 'OpenStreetMap, Open Infrastructure Map', portal_url: 'https://openinframap.org/', akses: 'terbuka', jenis_data: ['jaringan listrik', 'pembangkit (OSM)'], lisensi: 'ODbL', cakupan_internasional: true, dipakai_pantau: true, sektor: ['jaringan'], harus: ['Open Infrastructure Map'], uraian: 'Peta infrastruktur dari data OpenStreetMap.' },
    { id: 'sd-owid-energy', nama: 'Our World in Data: Energy', pemilik: 'Our World in Data', portal_url: 'https://ourworldindata.org/energy', akses: 'terbuka', jenis_data: ['bauran energi', 'emisi'], lisensi: 'CC BY 4.0', cakupan_internasional: true, sektor: ['riset-data'], harus: ['Energy'], uraian: 'Data dan riset energi dunia dengan grafik yang bisa diunduh.' },
    { id: 'sd-eia-international', nama: 'EIA International: Indonesia', pemilik: 'U.S. Energy Information Administration', portal_url: 'https://www.eia.gov/international/overview/country/IDN', akses: 'terbuka', jenis_data: ['statistik energi per negara'], cakupan_internasional: true, sektor: ['riset-data'], harus: ['Energy Information Administration'], uraian: 'Ringkasan energi per negara dari badan statistik energi Amerika Serikat.' },
    { id: 'sd-nasa-power', nama: 'NASA POWER', pemilik: 'NASA', portal_url: 'https://power.larc.nasa.gov/', akses: 'api-terbuka', jenis_data: ['radiasi surya', 'meteorologi'], cakupan_internasional: true, sektor: ['surya', 'bayu'], harus: ['POWER'], uraian: 'Data observasi bumi NASA yang siap pakai untuk energi dan infrastruktur.' },
  ],
};

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
export function parseRobots(t) { // Disallow dari grup yang memuat User-agent: *
  const out = []; let aktif = false, awal = true;
  for (const l of t.split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Za-z-]+)\s*:\s*(.*?)\s*$/); if (!m) continue;
    const k = m[1].toLowerCase();
    if (k === 'user-agent') { if (!awal) aktif = false; if (m[2] === '*') aktif = true; awal = true; } else { awal = false; if (aktif && k === 'disallow' && m[2]) out.push(m[2]); }
  }
  return out;
}
export const bolehPath = (aturan, pathname) => !aturan.some((p) => p && pathname.startsWith(p));
const robots = new Map();
async function boleh(url) {
  const u = new URL(url);
  if (!robots.has(u.host)) {
    let a = [];
    try { const r = await fetch(u.origin + '/robots.txt', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) }); if (r.ok) a = parseRobots(await r.text()); } catch { /* tak terjangkau: tanpa aturan */ }
    await tidur(GAP_MS); robots.set(u.host, a);
  }
  return bolehPath(robots.get(u.host), u.pathname + u.search);
}
const teks = (h) => h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#8211;/g, '-').replace(/\s+/g, ' ');
// fokus dari kata kunci halaman: hanya kode SEKTOR direktori yang kata kuncinya benar-benar muncul
const KATA = { surya: /\b(solar|surya|photovoltaic|fotovoltaik)\b/i, bayu: /\b(wind|angin|bayu)\b/i, 'panas-bumi': /\b(geothermal|panas bumi)\b/i, bioenergi: /\b(bioenergy|bioenergi|biodiesel|biofuel|biomass|biomassa)\b/i, hidrogen: /\b(hydrogen|hidrogen)\b/i, nuklir: /\b(nuclear|nuklir)\b/i, penyimpanan: /\b(baterai|battery|energy storage)\b/i };
export const fokusDari = (t) => Object.entries(KATA).filter(([, re]) => re.test(t)).map(([k]) => k);

async function periksa(e) {
  const r = { id: e.id, url: e.web || e.portal_url, status: null, ok: false, diperiksa: TGL, catatan: '' };
  let url = r.url;
  for (let hop = 0; hop < 4; hop++) {
    if (!(await boleh(url))) { r.catatan = 'robots melarang ' + new URL(url).host; return r; }
    let res;
    try { res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'manual', signal: AbortSignal.timeout(25000) }); } catch (x) { r.catatan = 'gagal: ' + (x.cause?.code || x.message); await tidur(GAP_MS); return r; }
    await tidur(GAP_MS); r.status = res.status;
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location'), url).href;
      if (e.hanya_alih) { r.ok = new URL(url).host === e.hanya_alih; r.catatan = 'pengalihan resmi ke ' + new URL(url).host + '; isi tidak dibaca'; return r; }
      continue;
    }
    if (res.status === 403 || res.status === 429) { r.catatan = 'menolak pemeriksaan otomatis (' + res.status + ')'; return r; }
    if (res.status < 200 || res.status >= 300) return r;
    const t = teks(await res.text()); r.final = url;
    r.ok = (e.harus || []).every((k) => t.toLowerCase().includes(k.toLowerCase()));
    if (!r.ok) r.catatan = 'kata kunci nama tidak ada di halaman';
    r.fokus = fokusDari(t.slice(0, 60000));
    return r;
  }
  r.catatan = 'terlalu banyak pengalihan'; return r;
}

async function cmdAmbil() {
  const hasil = {};
  for (const [kelompok, daftar] of Object.entries(REGISTRI)) for (const e of daftar) { hasil[e.id] = await periksa(e); console.error(kelompok.padEnd(11), e.id.padEnd(22), hasil[e.id].status, hasil[e.id].ok ? 'ok' : 'TIDAK', hasil[e.id].catatan); }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ diambil: TGL, ua: UA, hasil }, null, 1) + '\n');
  console.log('tulis', OUT, Object.keys(hasil).length);
}
function selftest() {
  assert.deepEqual(parseRobots('User-agent: bot\nDisallow: /x\nUser-agent: *\nDisallow: /psbe/\nDisallow:'), ['/psbe/']);
  assert.equal(bolehPath(['/'], '/apa'), false); assert.equal(bolehPath(['/psbe/'], '/id/x'), true);
  assert.deepEqual(fokusDari('Pusat studi solar dan biodiesel'), ['surya', 'bioenergi']);
  const id = new Set(); for (const d of Object.values(REGISTRI)) for (const e of d) { assert(!id.has(e.id), 'id ganda ' + e.id); id.add(e.id); assert(/^https:\/\//.test(e.web || e.portal_url)); }
  console.log('selftest ok,', id.size, 'entri');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv[2];
  if (a === '--selftest') selftest(); else if (a === '--ambil') await cmdAmbil(); else console.log('pakai: --ambil | --selftest');
}
