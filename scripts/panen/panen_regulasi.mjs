#!/usr/bin/env node
// Panen direktori peraturan EBET dari peraturan.bpk.go.id (JDIH BPK) untuk Jaringan METI. Node stdlib saja.
//   node panen_regulasi.mjs --cari      cari judul per kata kunci (halaman Search?tentang=...), resumable
//   node panen_regulasi.mjs --detail    unduh halaman Details/<id> kandidat relevan, resumable
//   node panen_regulasi.mjs --bangun    tanpa jaringan: raw/ + lokal/regulasi.jsonl -> regulasi.jsonl + ikatan_regulasi.jsonl
//   node panen_regulasi.mjs --selftest  uji parser tanpa jaringan
// Etika: robots.txt dicek (Disallow: /Admin/ /Identity/ /Account/ /Manage/ /health /Error), UA jujur,
// 1 permintaan serentak, jeda >= 2 dtk, 429/403 berulang = berhenti. Tidak menyentuh CAPTCHA.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const BASE = 'https://peraturan.bpk.go.id';
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const GAP_MS = 2200;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../data-panen/regulasi');
const RAW = path.join(OUT, 'raw');
const LOKAL = path.resolve(HERE, '../../data-panen/lokal/regulasi.jsonl');
const FORBIDDEN = /^\/(Admin|Identity|Account|Manage|health|Error)(\/|$)/;
const MAX_PAGES = 12; // 10 hasil/halaman; batas per kata kunci
const KATA = [
  'energi baru', 'energi terbarukan', 'panas bumi', 'tenaga surya', 'surya atap', 'pembangkit listrik tenaga',
  'bahan bakar nabati', 'biodiesel', 'bioetanol', 'bioenergi', 'biomassa', 'biogas', 'hidrogen', 'tenaga air',
  'mikrohidro', 'tenaga angin', 'tenaga bayu', 'energi laut', 'ketenagalistrikan', 'usaha penyediaan tenaga listrik',
  'harga pembelian tenaga listrik', 'jual beli tenaga listrik', 'rencana usaha penyediaan tenaga listrik',
  'rencana umum energi', 'kebijakan energi nasional', 'konservasi energi', 'efisiensi energi', 'nilai ekonomi karbon',
  'perdagangan karbon', 'gas rumah kaca', 'tingkat komponen dalam negeri', 'wilayah kerja panas bumi',
  'kendaraan bermotor listrik', 'penyimpanan energi', 'baterai', 'ketenaganukliran', 'pembangkit listrik tenaga nuklir',
  'energi', 'tenaga listrik', 'sampah energi listrik', 'keuangan berkelanjutan', 'taksonomi', 'pajak karbon',
  'pengurangan emisi', 'transisi energi', 'percepatan pengembangan', 'kelistrikan', 'perubahan iklim',
  'pembiayaan infrastruktur energi', 'insentif pajak energi', 'PLTS', 'PLTP', 'PLTA', 'PLTB', 'PLTBm',
  'pengusahaan panas bumi', 'pemanfaatan langsung panas bumi', 'rencana umum energi daerah', 'cipta kerja',
  'perizinan berusaha berbasis risiko', 'sistem registri unit karbon', 'bahan bakar minyak biodiesel',
];
// relevansi judul (lebih ketat dari kata kunci pencarian)
const RELEVAN = /energi (baru|terbarukan)|panas ?bumi|surya|bayu|tenaga angin|tenaga air|hidro|bio ?(energi|diesel|etanol|massa|gas|fuel)|nabati|hidrogen|ketenagalistrikan|tenaga listrik|ketenaganukliran|nuklir|pembangkit|kelistrikan|\blistrik\b|konservasi energi|efisiensi energi|kebijakan energi|rencana umum energi|\benergi\b.*(nasional|daerah)|karbon|gas rumah kaca|emisi|perubahan iklim|komponen dalam negeri|tkdn|baterai|penyimpanan energi|taksonomi|keuangan berkelanjutan|cipta kerja|berbasis risiko|transisi energi|energi laut|sampah.*(energi|listrik)|\bplt[a-z]{0,2}\b|konversi|bidang energi dan sumber daya mineral|perlindungan dan pengelolaan lingkungan hidup/i;
export const STRIKTIF = /energi|listrik|panas ?bumi|surya|\bbayu\b(?! asih)|tenaga angin|hidro(?!logi|meteo|geo|grafi)|bio ?(diesel|etanol|massa|gas|fuel)|nabati|hidrogen|nuklir|karbon|iklim|emisi|pembangkit|ketenaga|gas rumah kaca|baterai|komponen dalam negeri|taksonomi|keuangan berkelanjutan|pengadaan.*(pembangkit|energi)/i;
export const NEGATIF = /rumah sakit|uang rupiah|krimer|perlindungan dan pengelolaan lingkungan hidup|batas wilayah|pajak (barang|air)|hidrologi|dokter|pendelegasian|pengawasan intern|ozon|perizinan berusaha berbasis risiko subsektor kebudayaan|bantuan pendidikan|beasiswa|listrik dan air bagi rumah ibadah|perusahaan efek|pelaporan insidental|areal bernilai konservasi|pemilihan mitra kerja|barang hasil pekerjaan/i;
const TOPIK = [
  ['surya', /surya|\bplts\b/i], ['panas_bumi', /panas ?bumi|\bpltp\b/i],
  ['bioenergi', /bio ?(energi|diesel|etanol|massa|gas|fuel)|nabati|\bpltbm\b|sampah/i], ['hidro', /tenaga air|hidro|\bplta\b/i],
  ['angin', /bayu|tenaga angin|\bpltb\b/i], ['laut', /energi laut|arus laut/i], ['hidrogen', /hidrogen/i],
  ['penyimpanan', /baterai|penyimpanan energi|kendaraan bermotor (berbasis baterai|listrik)/i],
  ['jaringan', /ketenagalistrikan|tenaga listrik|jaringan|kelistrikan/i], ['efisiensi', /efisiensi|konservasi energi/i],
  ['karbon', /karbon|gas rumah kaca|emisi|perubahan iklim/i], ['harga', /harga|tarif|jual beli|pembelian tenaga/i],
  ['tkdn', /komponen dalam negeri|tkdn/i], ['perizinan', /izin|perizinan|wilayah kerja|berbasis risiko|cipta kerja/i],
  ['perencanaan', /rencana umum|kebijakan energi|ruen|rued|ruptl|rencana usaha penyediaan/i],
  ['insentif', /insentif|pajak|fasilitas|tax/i], ['nuklir', /nuklir|ketenaganukliran/i],
  ['energi_baru_umum', /energi baru|energi terbarukan|transisi energi/i],
];
const BULAN = { januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6, juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12 };

// ---------- util ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const dec = (s) => s.replace(/&#x([0-9a-f]+);|&#(\d+);|&(\w+);/gi, (m, h, d, n) =>
  h ? String.fromCodePoint(parseInt(h, 16)) : d ? String.fromCodePoint(+d) : (ENT[n] ?? m));
const txt = (s = '') => dec(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const tglIso = (s) => {
  const m = (s || '').match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  return m && BULAN[m[2].toLowerCase()] ? `${m[3]}-${String(BULAN[m[2].toLowerCase()]).padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
};
const tulis = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
const jsonl = (f, rows) => tulis(f, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
const bacaJsonl = (f) => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- parser ----------
export function parseCari(html) {
  const total = +((html.match(/fw-semibold text-gray-900">([\d.]+)<\/span>\s*peraturan/) || [])[1] || '0').replace(/\./g, '');
  const items = [];
  for (const blok of html.split('class="card-body p-xl-10').slice(1)) {
    const m = blok.match(/href="\/Details\/(\d+)\/([^"]+)"[^>]*>\s*([^<]+?)\s*<\/a>[\s\S]*?href="\/Details\/\d+\/[^"]+"[^>]*>\s*([^<]+?)\s*<\/a>/);
    if (!m) continue;
    items.push({ id: m[1], slug: m[2], judul_penuh: txt(m[3]), judul: txt(m[4]) });
  }
  return { total, items };
}
export function parseDetail(html) {
  const f = {};
  for (const m of html.matchAll(/<div class="col-lg-3 fw-bold">([^<]+)<\/div>\s*<div class="col-lg-9">([\s\S]*?)<\/div>/g)) f[txt(m[1])] = txt(m[2]);
  const rel = {};
  for (const m of html.matchAll(/bg-light-primary p-4">\s*([^<:]+?)\s*:\s*<\/div>[\s\S]*?<ol[^>]*>([\s\S]*?)<\/ol>/g)) {
    const lab = txt(m[1]).toLowerCase();
    rel[lab] = [...m[2].matchAll(/<li[^>]*>\s*<a[^>]*href="\/Details\/(\d+)\/([^"]+)"[^>]*>([^<]+)<\/a>\s*<span[^>]*>tentang<\/span>\s*([\s\S]*?)(?:<br|<\/li)/g)]
      .map((x) => ({ id: x[1], slug: x[2], ref: txt(x[3]), judul: txt(x[4]) }));
  }
  const pdf = (html.match(/href="(\/Download\/[^"]+)"/) || [])[1];
  const h1 = txt((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
  return { f, rel, pdf: pdf ? BASE + pdf : null, title: h1 };
}

// ---------- jaringan ----------
let robotsOk = false, gagal = 0;
async function ambil(pth) {
  if (FORBIDDEN.test(pth.split('?')[0])) throw new Error('path terlarang: ' + pth);
  if (!robotsOk) { // cek robots.txt sekali per proses
    const r = await fetch(BASE + '/robots.txt', { headers: { 'User-Agent': UA } });
    const t = await r.text();
    assert(r.ok && /User-agent: \*/i.test(t), 'robots.txt tak terbaca');
    robotsOk = true; await tidur(GAP_MS);
  }
  for (let t = 0; t < 3; t++) {
    const r = await fetch(BASE + pth, { headers: { 'User-Agent': UA, 'Accept-Language': 'id' } });
    await tidur(GAP_MS);
    if (r.status === 200) { gagal = 0; return r.text(); }
    if (r.status === 404) return null;
    if (r.status === 403 || r.status === 429) {
      if (++gagal >= 3) { console.error('BERHENTI: status', r.status, 'berulang pada', pth); process.exit(2); }
      await tidur(30000 * (t + 1)); continue;
    }
    await tidur(5000);
  }
  return null;
}
const TAHUN = ((process.argv.find((x) => x.startsWith('--tahun=')) || '').slice(8).split(',').filter(Boolean));   // mis. --tahun=2025,2026: sisir peraturan baru lewat filter tahun situs
const rawCari = (k, p, th) => path.join(RAW, 'cari', `${k.replace(/\W+/g, '_')}${th ? '_t' + th : ''}_p${p}.html`);
async function cari() {
  for (const th of TAHUN.length ? TAHUN : [null]) for (const k of KATA) {
    for (let p = 1; p <= MAX_PAGES; p++) {
      const f = rawCari(k, p, th);
      let html = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
      if (!html) {
        html = await ambil(`/Search?tentang=${encodeURIComponent(k)}${th ? '&tahun=' + th : ''}&p=${p}`);
        if (!html) break;
        tulis(f, html);
      }
      const { total, items } = parseCari(html);
      console.log(`cari "${k}" p${p}: ${items.length} (total ${total})`);
      if (!items.length || p * 10 >= total) break;
    }
  }
}
function kandidat() {
  const peta = new Map();
  const dir = path.join(RAW, 'cari');
  if (!fs.existsSync(dir)) return [];
  for (const n of fs.readdirSync(dir)) for (const it of parseCari(fs.readFileSync(path.join(dir, n), 'utf8')).items) peta.set(it.id, it);
  return [...peta.values()].filter((x) => RELEVAN.test(x.judul) || RELEVAN.test(x.judul_penuh));
}
const rawDet = (id) => path.join(RAW, 'detail', `${id}.html`);
async function detail() {
  const ks = kandidat();
  console.log('kandidat relevan:', ks.length);
  let n = 0;
  const antre = [...ks];
  const lihat = new Set(ks.map((k) => k.id));
  while (antre.length) {
    const k = antre.shift();
    if (!fs.existsSync(rawDet(k.id))) {
      const html = await ambil(`/Details/${k.id}/${k.slug}`);
      if (!html) continue;
      tulis(rawDet(k.id), html);
      if (++n % 25 === 0) console.log('detail terunduh', n, 'sisa', antre.length);
    }
    // ikuti rantai: peraturan yang diubah/dicabut oleh/mengubah juga dimuat (jejak sejarah)
    const d = parseDetail(fs.readFileSync(rawDet(k.id), 'utf8'));
    for (const arr of Object.values(d.rel)) for (const x of arr) if (!lihat.has(x.id) && (RELEVAN.test(x.judul))) { lihat.add(x.id); antre.push(x); }
  }
}

// ---------- bangun ----------
const JENIS = [[/^uu$|undang-undang nomor/i, 'uu'], [/perppu|perpu/i, 'perppu'], [/^pp\b|peraturan pemerintah/i, 'pp'], [/perpres|peraturan presiden/i, 'perpres'],
  [/inpres|instruksi presiden/i, 'inpres'], [/keppres|keputusan presiden/i, 'keppres'], [/kepmen|keputusan menteri/i, 'kepmen'], [/permen|peraturan menteri/i, 'permen'],
  [/perda|perbup|pergub|perwali|peraturan (daerah|bupati|gubernur|walikota|wali kota)/i, 'perda'], [/^pmk\b|peraturan menteri keuangan/i, 'permen'], [/ojk|otoritas jasa/i, 'ojk']];
const jenisDari = (s) => (JENIS.find(([re]) => re.test(s)) || [0, 'lainnya'])[1];
const slugId = (jenis, instansi, nomor, tahun, bpk) => {
  const unik = (jenis === 'perda' || jenis === 'lainnya') && bpk ? '-b' + bpk : '';
  const inst = (jenis === 'permen' || jenis === 'kepmen') ? (/energi|esdm/i.test(instansi) ? '-esdm' : /lingkungan|kehutanan/i.test(instansi) ? '-klhk' : /perindustrian/i.test(instansi) ? '-kemenperin' : /keuangan/i.test(instansi) ? '-kemenkeu' : /kelautan/i.test(instansi) ? '-kkp' : (bpk ? '-b' + bpk : '')) : unik;
  return `${jenis}${inst}-${String(nomor).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${tahun}`;
};
const topikDari = (j) => { const t = TOPIK.filter(([, re]) => re.test(j)).map(([k]) => k); return t.length ? t : ['energi_umum']; };
const RINGKAS_MANUAL = {
 "uu-30-2007": "Payung hukum energi nasional: penguasaan negara, kebijakan dan Dewan Energi Nasional, prioritas energi baru dan terbarukan dalam pengelolaan energi.",
 "uu-30-2009": "Mengatur usaha ketenagalistrikan: kewenangan, izin usaha, penyediaan oleh PLN dan swasta, harga jual serta pemanfaatan sumber energi primer, termasuk terbarukan.",
 "uu-21-2014": "Mengatur pengusahaan panas bumi: wilayah kerja, izin, eksplorasi dan eksploitasi, termasuk pemanfaatan langsung dan tidak langsung. Mengganti UU 27/2003.",
 "uu-6-2023": "Menetapkan Perppu Cipta Kerja menjadi UU; mengubah banyak aturan sektor energi, termasuk perizinan berusaha dan ketenagalistrikan.",
 "uu-16-2016": "Mengesahkan Persetujuan Paris tentang perubahan iklim; dasar komitmen penurunan emisi dan transisi energi Indonesia.",
 "uu-10-1997": "Mengatur ketenaganukliran: pemanfaatan, pengawasan, dan perizinan tenaga nuklir untuk tujuan damai, termasuk pembangkit.",
 "pp-40-2025": "Kebijakan Energi Nasional terbaru: sasaran bauran energi dan arah transisi sampai 2060; menggantikan PP 79/2014.",
 "pp-79-2014": "Kebijakan Energi Nasional lama dengan target bauran EBT 23 persen pada 2025; dicabut oleh PP 40/2025.",
 "perpres-22-2017": "Rencana Umum Energi Nasional: target bauran, kapasitas pembangkit, dan program per sektor sebagai penjabaran KEN sampai 2050.",
 "perpres-112-2022": "Mengatur percepatan pembangunan pembangkit EBT: harga patokan, penugasan PLN, penghentian PLTU bertahap, dan insentif.",
 "permen-esdm-2-2024": "Mengatur PLTS atap yang tersambung jaringan pemegang izin usaha; menghapus skema net metering lama dan mengatur kuota.",
 "permen-esdm-26-2021": "Aturan PLTS atap terdahulu dengan skema ekspor-impor energi; dicabut oleh peraturan yang lebih baru.",
 "pp-14-2012": "Mengatur kegiatan usaha penyediaan tenaga listrik: izin, wilayah usaha, jual beli listrik, dan peran swasta.",
 "pp-7-2017": "Mengatur panas bumi untuk pemanfaatan tidak langsung: lelang wilayah kerja, penugasan, dan hak serta kewajiban pengembang.",
 "pp-33-2023": "Mengatur konservasi energi: kewajiban manajemen energi, standar dan label efisiensi, serta sanksi bagi pengguna energi besar.",
 "perpres-98-2021": "Aturan nilai ekonomi karbon untuk capaian NDC dan pengendalian emisi; dicabut oleh Perpres 110/2025.",
 "perpres-110-2025": "Mengatur instrumen nilai ekonomi karbon dan sistem registri unit karbon; menggantikan Perpres 98/2021.",
 "perpres-55-2019": "Mendorong percepatan program kendaraan bermotor listrik berbasis baterai, termasuk insentif dan infrastruktur pengisian.",
 "pp-28-2025": "Mengatur penyelenggaraan perizinan berusaha berbasis risiko, dasar perizinan sektor energi dan ketenagalistrikan.",
 "permen-esdm-12-2023": "Mengatur pemanfaatan biomassa sebagai campuran bahan bakar (co-firing) di pembangkit listrik batu bara.",
 "permen-esdm-11-2021": "Mengatur pelaksanaan usaha ketenagalistrikan, termasuk izin usaha dan penggunaan jaringan.",
 "permen-esdm-10-2022": "Mengatur tata cara persetujuan harga jual tenaga listrik dan sewa jaringan tenaga listrik.",
 "permen-esdm-4-2025": "Mengatur kewajiban pencampuran bioetanol pada bahan bakar minyak oleh badan usaha.",
 "permen-esdm-5-2025": "Mengatur ketentuan deemed commissioning dan deemed dispatch pada perjanjian jual beli listrik.",
 "perpres-5-2006": "Kebijakan Energi Nasional lama yang menetapkan target bauran energi 2025; telah digantikan peraturan berikutnya.",
 "uu-27-2003": "UU panas bumi lama yang mengatur pengusahaan sektor panas bumi; digantikan UU 21/2014.",
 "pp-25-2021": "Mengatur penyelenggaraan bidang energi dan sumber daya mineral, termasuk kewenangan, perizinan, dan pengawasan.",
 "uu-32-2009": "Mengatur perlindungan dan pengelolaan lingkungan hidup, termasuk AMDAL dan izin lingkungan bagi proyek energi.",
 "uu-15-1985": "UU ketenagalistrikan lama; dicabut dan digantikan UU 30/2009.",
 "perpres-35-2018": "Mengatur percepatan pembangunan pengolah sampah menjadi energi listrik berbasis teknologi ramah lingkungan."
}; // parafrase penulis; sisanya templat dari judul
const ringkas = (jenis, nomor, tahun, judul, id) => {
  if (RINGKAS_MANUAL[id]) return RINGKAS_MANUAL[id];
  const kata = `${judul.toLowerCase()}`.split(/\s+/).slice(0, 18).join(' ');
  return `${jenis.toUpperCase()} ${nomor}/${tahun} mengatur ${kata}.`;
};
function bangun() {
  const today = new Date().toISOString().slice(0, 10);
  const cand = new Map(kandidat().map((k) => [k.id, k]));
  const dir = path.join(RAW, 'detail');
  const rows = [], ikat = [], idDariBpk = new Map();
  const ds = fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => n.endsWith('.html')) : [];
  const parsed = ds.map((n) => { const id = n.replace('.html', ''); return { id, d: parseDetail(fs.readFileSync(path.join(dir, n), 'utf8')) }; });
  for (const { id, d } of parsed) { // pass 1: id BPK -> slug stabil
    const f = d.f; if (!f.Nomor || !f.Tahun) continue;
    const jenis = jenisDari(f['Bentuk Singkat'] || f.Bentuk || '');
    idDariBpk.set(id, slugId(jenis, f.Lokasi || f['Bentuk Singkat'] || '', f.Nomor, f.Tahun, id));
  }
  for (const { id, d } of parsed) {
    const f = d.f; if (!f.Nomor || !f.Tahun) continue;
    if (/tunjangan kinerja|susunan organisasi|penyertaan modal|struktur kepemilikan saham/i.test((cand.get(id) || {}).judul || d.title)) continue; // kebisingan: kepegawaian/organisasi/modal
    const jenis = jenisDari(f['Bentuk Singkat'] || f.Bentuk || '');
    const judul = (cand.get(id) || {}).judul || (d.title.split(' - ')[0]);
    const rid = idDariBpk.get(id);
    const ref = (arr) => (arr || []).map((x) => {
      if (idDariBpk.has(x.id)) return idDariBpk.get(x.id);
      const m = x.ref.match(/^(.+?)\s+(?:No\.?|Nomor)\s*(\S+?)\s+Tahun\s+(\d{4})/i); // tujuan di luar set: id dari teks rujukan
      return m ? slugId(jenisDari(m[1]), m[1], m[2], m[3], x.id) : `bpk-${x.id}`;
    });
    const diubah = ref(d.rel['diubah dengan']), dicabut = ref(d.rel['dicabut dengan']);
    const mencabut = ref(d.rel['mencabut']), mengubah = ref(d.rel['mengubah']);
    const status = dicabut.length || /tidak berlaku/i.test(f.Status || '') ? 'dicabut' : diubah.length ? 'diubah' : /berlaku/i.test(f.Status || '') ? 'berlaku' : 'tidak-diketahui';
    rows.push({
      id: rid, jenis, nomor: f.Nomor, tahun: +f.Tahun, judul, tanggal_ditetapkan: tglIso(f['Tanggal Penetapan']), tanggal_diundangkan: tglIso(f['Tanggal Pengundangan']),
      instansi_penerbit: f.Lokasi || null, status, diubah_oleh: diubah, mencabut, mengubah, dicabut_oleh: dicabut[0] || null,
      topik: topikDari(judul), ringkasan: ringkas(jenis, f.Nomor, f.Tahun, judul, rid), pasal_kunci: null,
      url_sumber: `${BASE}/Details/${id}`, url_pdf: d.pdf, tanggal_ambil: today, posisi_meti: null, sumber_posisi: null,
    });
    const tambah = (arr, jn, balik) => arr.forEach((t) => ikat.push(balik ? { dari: t, ke: rid, jenis: jn } : { dari: rid, ke: t, jenis: jn }));
    tambah(mengubah, 'mengubah'); tambah(mencabut, 'mencabut'); tambah(diubah, 'mengubah', true); tambah(dicabut, 'mencabut', true);
  }
  // gabung masukan lokal (nomor "Perpres 112/2022"); baris tanpa padanan BPK ditambah apa adanya
  const idx = new Map(rows.map((r) => [`${r.jenis}|${r.nomor}|${r.tahun}`, r]));
  let nLokal = 0;   // id lokal stabil (dirujuk berita_wilayah, proyek, program): mulai 430 sesuai potret terbit, bukan rows.length yang bergeser tiap panen
  for (const l of bacaJsonl(LOKAL)) {
    const m = String(l.nomor).match(/^([A-Za-z ]+?)\s+(\S+?)\/(\d{4})/);
    const jenis = m ? jenisDari(m[1].replace(/ESDM/i, '').trim()) : l.jenis_regulasi;
    const r = m && idx.get(`${jenis}|${m[2]}|${m[3]}`);
    if (r) { r.posisi_meti = l.posisi_meti || r.posisi_meti; r.sumber_posisi = l.posisi_meti ? l.sumber_berkas : r.sumber_posisi; r.dari_lokal = true; continue; }
    const baru = { id: m ? slugId(jenis, /esdm/i.test(l.nomor) ? 'esdm' : '', m[2], m[3]) : 'lokal-' + (430 + nLokal++), jenis, nomor: m ? m[2] : l.nomor, tahun: m ? +m[3] : null, judul: l.judul,
      tanggal_ditetapkan: null, tanggal_diundangkan: null, instansi_penerbit: null, status: /draf/.test(l.status) ? 'rancangan' : l.status || 'tidak-diketahui', diubah_oleh: [], mencabut: [], mengubah: [], dicabut_oleh: null,
      topik: topikDari(l.judul), ringkasan: ringkas(jenis, m ? m[2] : l.nomor, m ? m[3] : '', l.judul), pasal_kunci: null, url_sumber: null, url_pdf: null, tanggal_ambil: today,
      posisi_meti: l.posisi_meti || null, sumber_posisi: l.posisi_meti ? l.sumber_berkas : null, dari_lokal: true };
    if (rows.some((x) => x.id === baru.id)) continue;
    rows.push(baru);
  }
  // Baris BARU (belum ada di regulasi.jsonl terbit) wajib lolos saring ketat: kata kunci "bayu"/"energi" menarik RSUD Bayu Asih, uang rupiah, RPPLH dst.
  const terbit = new Set(bacaJsonl(path.join(OUT, 'regulasi.jsonl')).map((r) => r.id));
  const ketat = (r) => terbit.has(r.id) || r.dari_lokal || (STRIKTIF.test(r.judul) && !NEGATIF.test(r.judul));
  const unik = [...new Map(rows.filter(ketat).map((r) => [r.id, r])).values()].sort((a, b) => a.tahun - b.tahun || String(a.id).localeCompare(b.id));
  jsonl(path.join(OUT, 'regulasi.jsonl'), unik);
  const kunci = new Set(); const ik = ikat.filter((x) => { const k = x.dari + '>' + x.ke + '>' + x.jenis; return kunci.has(k) ? false : (kunci.add(k), true); });
  jsonl(path.join(OUT, 'ikatan_regulasi.jsonl'), ik);
  console.log('regulasi', unik.length, 'ikatan', ik.length);
}

// ---------- selftest ----------
function selftest() {
  const c = parseCari('<span class="fw-semibold text-gray-900">8.416</span> peraturan<div class="card-body p-xl-10 p-8"><a href="/Details/142587/permen-esdm-no-10-tahun-2012">\n Peraturan Menteri X  Nomor 10 Tahun 2012 </a><a href="/Details/142587/permen-esdm-no-10-tahun-2012">\n Pelaksanaan EBT </a>');
  assert.equal(c.total, 8416); assert.equal(c.items[0].id, '142587'); assert.equal(c.items[0].judul, 'Pelaksanaan EBT');
  const d = parseDetail('<div class="col-lg-3 fw-bold">Nomor</div>\n<div class="col-lg-9">10</div><div class="col-lg-3 fw-bold">Tanggal Penetapan</div><div class="col-lg-9"><span>10 Mei 2012</span></div>' +
    '<div class="col-12 fw-semibold bg-light-primary p-4">\n Dicabut dengan :\n</div><ol type="a"><li class="mb-4"><a class="text-danger" href="/Details/142586/permen-esdm-no-39-tahun-2017">Permen ESDM No. 39 Tahun 2017</a>\n<span class="text-muted">tentang</span> Pelaksanaan EBT<br /></li></ol>');
  assert.equal(d.f.Nomor, '10'); assert.equal(tglIso(d.f['Tanggal Penetapan']), '2012-05-10');
  assert.equal(d.rel['dicabut dengan'][0].id, '142586');
  assert.equal(jenisDari('Permen ESDM'), 'permen'); assert.equal(jenisDari('Perpres'), 'perpres'); assert.equal(jenisDari('UU'), 'uu');
  assert.equal(slugId('permen', 'Kementerian Energi dan Sumber Daya Mineral', '2', 2024), 'permen-esdm-2-2024');
  assert(RELEVAN.test('Pemanfaatan Sumber Energi Terbarukan untuk Penyediaan Tenaga Listrik'));
  assert.ok(STRIKTIF.test('Pembangkit Listrik Tenaga Hibrida') && NEGATIF.test('Tarif RSUD Bayu Asih rumah sakit') && !STRIKTIF.test('Tarif RSUD Bayu Asih'));
  console.log('selftest ok');
}

const a = process.argv.slice(2);
if (a.includes('--selftest')) selftest();
else if (a.includes('--cari')) await cari();
else if (a.includes('--detail')) await detail();
else if (a.includes('--bangun')) bangun();
else console.log('pakai: --cari | --detail | --bangun | --selftest');
