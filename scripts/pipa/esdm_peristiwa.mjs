#!/usr/bin/env node
// Peristiwa pembangkit EBT dari arsip berita resmi Kementerian ESDM (esdm.go.id, 24 bulan terakhir)
// -> public/data/peristiwa_ebt.json. Disimpan: judul, tautan, tanggal, jenis peristiwa, nama pembangkit, kapasitas, provinsi
// yang TERTULIS di judul/paragraf awal; teks artikel tidak disalin. Ekstraksi heuristik: tiap baris `perlu_tinjau`.
//   node scripts/pipa/esdm_peristiwa.mjs --ambil   daftar (arsip-berita?page=N) + artikel yang judulnya EBT -> data-panen/esdm/
//   node scripts/pipa/esdm_peristiwa.mjs           bangun dari cache;  --selftest uji murni
// Sopan: robots.txt dicek, jeda >= 2 dtk, UA METI, berhenti di 403/429. PLN (web.pln.co.id tak terjangkau) dan
// ebtke.esdm.go.id (SPA tanpa daftar) tidak dipanen: butuh unduhan pemilik.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { token, jaccard } from './cocok_proyek.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = path.join(ROOT, 'data-panen/esdm');
const HOST = 'https://www.esdm.go.id';
const LIST = HOST + '/id/media-center/arsip-berita';
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const BULAN = { januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6, juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12 };
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const lepas = (s) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/&(amp|quot|lt|gt|nbsp|#39|#x27);/g, (_, k) => ({ amp: '&', quot: '"', lt: '<', gt: '>', nbsp: ' ', '#39': "'", '#x27': "'" }[k])).replace(/\s+/g, ' ').trim();
const bersih = (s) => s.replace(/[–—]/g, '-');

export const RE_EBT = /\b(plt[a-z]{1,3}|energi (baru|terbarukan)|ebt|ebet|ebtke|panas bumi|surya|bayu|hidro|biomassa|biodiesel|bioetanol|baterai|green hydrogen|hidrogen|nuklir|ruptl|co-?firing|energi bersih|tenaga air)\b/i;
const PERISTIWA = [
  ['batal-tunda', /\b(batal|dibatalkan|ditunda|tertunda|mundur|molor|terhenti|mangkrak|dihentikan|menarik diri|cancel)/i],
  ['peresmian', /\b(resmikan|diresmikan|peresmian|inaugurasi|groundbreaking|peletakan batu pertama|pencanangan)/i],
  ['cod', /\b(cod|beroperasi komersial|operasi komersial|mulai beroperasi|energize|sinkron|tersambung ke jaringan|on grid)/i],
  ['ppa', /\b(ppa|perjanjian jual beli tenaga listrik|jual beli listrik|penandatanganan|teken|kontrak)/i],
  ['lelang', /\b(lelang|tender|penawaran wkp|wilayah kerja panas bumi|wkp)\b/i],
];
export const jenisPeristiwa = (t) => (PERISTIWA.find(([, re]) => re.test(t)) || [null])[0];

const PROV = ['Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi', 'Sumatera Selatan', 'Bengkulu', 'Lampung', 'Kepulauan Bangka Belitung', 'DKI Jakarta', 'Banten', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Maluku Utara', 'Maluku', 'Papua Barat Daya', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan', 'Papua'];
export const cariProvinsi = (t) => PROV.find((p) => new RegExp(`\\b${p}\\b`, 'i').test(t)) || null;

/** Nama pembangkit tertulis: "PLTS Cirata", "PLTP Muara Laboh Unit 2" (maks 3 kata kapital setelah jenis). */
export function namaPembangkit(t) {
  const out = new Set();
  const KATA_KERJA = /\s+(Mulai|Hadir|Mampu|Dipercepat|Jadi|Resmi|Siap|Akan|Segera|Beroperasi|Diresmikan|Dibangun|Terbesar|Dan|Di|Untuk|Dengan)\b.*$/;
  for (const m of t.matchAll(/\b(PLT[A-Z]{1,3})\s+((?:[A-Z][\w-]+)(?:\s+(?:Unit\s+\d+|(?!MW|GW|MWp|GWp|Tbk|PT\b)[A-Z][\w-]+)){0,2})/g)) out.add(`${m[1]} ${m[2]}`.replace(KATA_KERJA, '').trim());
  return [...out].filter((n) => ![...out].some((o) => o !== n && n.startsWith(o + ' '))).slice(0, 4);
}
/** Kapasitas tertulis dengan satuan (MW, GW, MWp, kW) -> MW; hanya angka yang disebut. */
export function kapasitasMw(t) {
  const out = [];
  for (const m of t.matchAll(/(\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:,\d+)?)\s*(GWp?|MWp?|kWp?|megawatt|gigawatt)\b/gi)) {
    const v = +m[1].replace(/\./g, '').replace(',', '.'); const u = m[2].toLowerCase();
    const mw = u.startsWith('g') ? v * 1000 : u.startsWith('k') ? v / 1000 : v;
    if (mw > 0) out.push({ mw: +mw.toFixed(3), teks: m[0] });
  }
  return out.slice(0, 3);
}
export function tanggalId(s) {
  const m = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec(s || ''); if (!m || !BULAN[m[2].toLowerCase()]) return null;
  return `${m[3]}-${String(BULAN[m[2].toLowerCase()]).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}
export function parseDaftar(html) {
  const out = [];
  for (const m of html.matchAll(/<small class="text-grey d-block pb-2">([^<]*)<\/small>\s*<a [^>]*href="(\/id\/media-center\/arsip-berita\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const tanggal = tanggalId(m[1]); if (tanggal) out.push({ tanggal, url: HOST + m[2], judul: bersih(lepas(m[3])) });
  }
  return out;
}
/** Paragraf awal artikel (<= 6 paragraf, teks polos) untuk ekstraksi saja; tidak disimpan ke keluaran. */
export function paragrafAwal(html) {
  return [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => lepas(m[1])).filter((s) => s.length > 40).slice(0, 6).join(' ');
}

export function bangunBaris(daftar, isi, proyek, tgl) {
  const tp = proyek.map((p) => ({ id: p.id, nama: p.nama, tok: token(p.nama), tek: p.teknologi }));
  return daftar.filter((d) => RE_EBT.test(d.judul)).map((d) => {
    const teks = d.judul + '. ' + (isi[d.url] || '');
    const nama = namaPembangkit(teks);
    let cocok = null;
    for (const n of nama) for (const p of tp) { const j = jaccard(token(n), p.tok); if (j >= 0.5 && (!cocok || j > cocok.j)) cocok = { j, id: p.id, nama: p.nama }; }
    return {
      id: 'esdm_' + d.url.split('/').pop().slice(0, 70), judul: d.judul, tanggal: d.tanggal, peristiwa: jenisPeristiwa(d.judul + ' ' + (isi[d.url] || '').slice(0, 400)),
      pembangkit: nama, kapasitas: kapasitasMw(teks), provinsi: cariProvinsi(teks),
      proyek_id: cocok ? cocok.id : null, proyek_nama: cocok ? cocok.nama : null, kecocokan: cocok ? 'nama-saja' : null,
      perlu_tinjau: true, sumber_url: d.url, tanggal_periksa: tgl, tingkat_bukti: 'situs-sendiri',
    };
  }).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

async function ambil() {
  fs.mkdirSync(DIR, { recursive: true });
  const get = async (u) => { await tidur(2100); const r = await fetch(u, { headers: { 'User-Agent': UA } }); if (r.status === 403 || r.status === 429) throw new Error(`${u} -> ${r.status}: berhenti`); if (!r.ok) throw new Error(`${u} -> ${r.status}`); return r.text(); };
  const rb = await get(HOST + '/robots.txt'); const blok = (rb.split(/user-agent:/i).find((b) => /^\s*\*/.test(b)) || '');
  if (/Disallow:\s*\/(id\/media-center|id)?\/?\s*$/m.test(blok)) throw new Error('robots melarang arsip-berita');
  const batas = new Date(); batas.setUTCMonth(batas.getUTCMonth() - 24); const iso = batas.toISOString().slice(0, 10);
  const daftar = []; const lihat = new Set();
  for (let p = 1; p <= 200; p++) {
    const baris = parseDaftar(await get(`${LIST}?page=${p}`)).filter((b) => !lihat.has(b.url));
    baris.forEach((b) => lihat.add(b.url)); daftar.push(...baris);
    if (!baris.length || baris.every((b) => b.tanggal < iso)) break;
  }
  const dalam = daftar.filter((d) => d.tanggal >= iso);
  const isi = fs.existsSync(path.join(DIR, 'isi.json')) ? JSON.parse(fs.readFileSync(path.join(DIR, 'isi.json'), 'utf8')) : {};
  for (const d of dalam.filter((x) => RE_EBT.test(x.judul) && !(x.url in isi))) isi[d.url] = paragrafAwal(await get(d.url));
  fs.writeFileSync(path.join(DIR, 'daftar.json'), JSON.stringify(dalam)); fs.writeFileSync(path.join(DIR, 'isi.json'), JSON.stringify(isi));
  console.error('daftar', dalam.length, 'artikel EBT', Object.keys(isi).length);
}

function selftest() {
  assert.equal(tanggalId('Senin, 2 November 2026'), '2026-11-02');
  const h = '<small class="text-grey d-block pb-2">Senin, 2 November 2026</small>\n<a title="x" class="b" href="/id/media-center/arsip-berita/pltp-muara-laboh-beroperasi">PLTP Muara Laboh &amp; Unit 2 Beroperasi</a>';
  const d = parseDaftar(h); assert.equal(d.length, 1); assert.equal(d[0].judul, 'PLTP Muara Laboh & Unit 2 Beroperasi');
  assert.deepEqual(kapasitasMw('kapasitas 1.250 MW dan 2,5 GW serta 500 kW').map((k) => k.mw), [1250, 2500, 0.5]);
  assert.deepEqual(namaPembangkit('Menteri meresmikan PLTS Cirata Terapung di Jawa Barat'), ['PLTS Cirata Terapung']);
  assert.deepEqual(namaPembangkit('Waduk PLTA Batang Toru Mulai Digenangi, PLTA Batang Toru'), ['PLTA Batang Toru']);
  assert.equal(jenisPeristiwa('Pemerintah resmikan PLTP'), 'peresmian'); assert.equal(jenisPeristiwa('PLTU ditunda'), 'batal-tunda'); assert.equal(jenisPeristiwa('Harga batu bara'), null);
  assert.equal(cariProvinsi('di Papua Barat'), 'Papua Barat');
  const b = bangunBaris([{ judul: 'Resmikan PLTS Cirata 145 MW', tanggal: '2026-01-01', url: HOST + '/id/media-center/arsip-berita/x' }, { judul: 'HBA turun', tanggal: '2026-01-01', url: HOST + '/y' }], {}, [{ id: 'pj_1', nama: 'PLTS Cirata', teknologi: 'surya' }], '2026-11-08');
  assert.equal(b.length, 1); assert.equal(b[0].proyek_id, 'pj_1'); assert.equal(b[0].kapasitas[0].mw, 145);
  assert.ok(b.every((x) => x.sumber_url && x.tanggal_periksa && x.tingkat_bukti));
  console.log('selftest ok');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else {
    if (process.argv.includes('--ambil')) await ambil();
    const daftar = JSON.parse(fs.readFileSync(path.join(DIR, 'daftar.json'), 'utf8')), isi = JSON.parse(fs.readFileSync(path.join(DIR, 'isi.json'), 'utf8'));
    const proyek = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/proyek.json'), 'utf8')).baris;
    const tgl = fs.statSync(path.join(DIR, 'daftar.json')).mtime.toISOString().slice(0, 10);
    const baris = bangunBaris(daftar, isi, proyek, tgl);
    if (daftar.length < 100) throw new Error('daftar terlalu pendek: ' + daftar.length);
    const out = { lapis: 'publik', dibangun_pada: tgl, jumlah: baris.length, sumber: [{ id: 's-esdm-berita', judul: 'Arsip Berita Kementerian ESDM (judul, tanggal, tautan; fakta diekstrak dari paragraf awal)', penerbit: 'Kementerian ESDM RI', url: LIST }], meta: { artikel_diperiksa: daftar.length, dari: daftar.at(-1).tanggal, sampai: daftar[0].tanggal, celah: ['Ekstraksi nama/kapasitas/provinsi heuristik dari teks: semua baris perlu_tinjau.', 'Cocok proyek hanya nama (kecocokan nama-saja), bukan bukti identitas.', 'Siaran PLN dan EBTKE tidak tercakup.'] }, baris };
    fs.writeFileSync(path.join(ROOT, 'public/data/peristiwa_ebt.json'), JSON.stringify(out) + '\n');
    console.error('peristiwa', baris.length, 'peristiwa-terklasifikasi', baris.filter((b) => b.peristiwa).length, 'cocok proyek', baris.filter((b) => b.proyek_id).length);
  }
}
