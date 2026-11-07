#!/usr/bin/env node
// Pustaka: gabung data-panen/pustaka/berkas.jsonl (dokumen yang sudah dibaca) + regulasi publik (tautan BPK saja)
// -> data-panen/pustaka/pustaka.jsonl, potret/<lapis>/pustaka.json (delta: tiap dokumen di SATU lapis, layar menggabung),
// potret/pustaka_unggah.json (daftar berkas untuk R2; TIDAK diunggah di sini, koordinator yang mengunggah).
//   node scripts/pipa/pustaka.mjs            bangun
//   node scripts/pipa/pustaka.mjs --selftest
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { tulisBerkas, periksaBerkas, pindai } from './potret.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DP = path.join(ROOT, 'data-panen');
const POT = path.join(DP, 'potret');
const LAPIS = ['publik', 'anggota', 'pengurus'];
const SUMBER_LOKAL = { 'meti-lokal': '/Users/priyankaalfatehan28/Documents/1. METI', 'arsip-zip': '/Users/priyankaalfatehan28/Downloads/METI-20261107T093342Z-1-001.zip' };
const JENIS = new Set(['kajian', 'paparan-konferensi', 'regulasi', 'surat', 'notulen', 'proposal', 'laporan', 'ad-art', 'panduan', 'data']);
const K16 = { surya: 'surya', angin: 'bayu', hidro: 'hidro', panas_bumi: 'panas-bumi', bioenergi: 'bioenergi', nuklir: 'nuklir', hidrogen: 'hidrogen', penyimpanan: 'penyimpanan', jaringan: 'jaringan', efisiensi: 'efisiensi', karbon: 'karbon', harga: 'pembiayaan', insentif: 'pembiayaan', perizinan: 'kebijakan', perencanaan: 'kebijakan', energi_umum: 'kebijakan', energi_baru_umum: 'kebijakan', tkdn: 'industri' };
const PROG = [['plts-100gw', /plts 100|100 gigawatt|100 gwp/i], ['b50', /biodiesel|bahan bakar nabati/i], ['e20', /bioetanol|etanol/i], ['wte', /sampah|pltsa/i], ['ruptl', /ruptl|rencana usaha penyediaan tenaga listrik/i], ['jetp', /jetp|just energy/i], ['ruu-ebet', /energi baru dan energi terbarukan.*(rancangan|ruu)|ruu ebet/i]];
const norm = (s) => String(s || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\b(pt|tbk|persero|cv)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const jsonl = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const potret = (n) => { const f = path.join(POT, 'publik', n + '.json'); if (!fs.existsSync(f)) return []; const j = JSON.parse(fs.readFileSync(f, 'utf8')); return j.bagian ? j.bagian.flatMap((b) => JSON.parse(fs.readFileSync(path.join(POT, 'publik', b), 'utf8')).baris) : j.baris; };
const tgl = (s) => s || null;

export function indeksNama(org, proy, orang, reg) {
  const m = new Map(); const taruh = (k, tipe, id) => { k = norm(k); if (k.length >= 3 && !m.has(k)) m.set(k, [tipe, id]); };
  for (const o of org) { taruh(o.nama, 'organisasi_ids', o.id); taruh(o.singkatan, 'organisasi_ids', o.id); }
  for (const p of proy) taruh(p.nama, 'proyek_ids', p.id);
  for (const o of orang) taruh(o.nama, 'orang_ids', o.id);
  const regIds = new Set(reg.map((r) => r.id));
  return { m, regIds };
}
// "Perpres 112/2022", "PP 14 Tahun 2012", "UU 30/2007" -> id regulasi bila ada
const RE_REG = /\b(perpres|pp|uu|permen\s?\w*|keppres|inpres|perppu|kepmen\s?\w*)\s*(?:no\.?|nomor)?\s*(\d{1,3})\s*(?:\/|tahun\s)\s*(\d{4})/gi;
export function cariTerkait(teks, nama, idx) {
  const t = { organisasi_ids: new Set(), proyek_ids: new Set(), orang_ids: new Set(), regulasi_ids: new Set() };
  for (const n of nama || []) { const h = idx.m.get(norm(n)); if (h) t[h[0]].add(h[1]); }
  for (const s of [...(nama || []), teks || '']) for (const x of String(s).matchAll(RE_REG)) {
    const jn = x[1].toLowerCase().replace(/\s+/g, ''); const kandidat = [`${jn}-${+x[2]}-${x[3]}`, `${jn.replace(/^permen|^kepmen/, (a) => a)}-${+x[2]}-${x[3]}`];
    for (const c of kandidat) if (idx.regIds.has(c)) t.regulasi_ids.add(c);
    if (/^(permen|kepmen)/.test(jn)) for (const id of idx.regIds) if (id.startsWith(jn.replace(/esdm|kemenperin|klhk/, '')) && id.endsWith(`-${+x[2]}-${x[3]}`) && id.includes(jn.replace(/^permen|^kepmen/, '') || '~')) t.regulasi_ids.add(id);
  }
  return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, [...v].sort()]).filter(([, v]) => v.length));
}
export function dokRegulasi(r, mentah) {
  const ik = (mentah && mentah[r.id]) || {};
  const topik = [...new Set((r.topik || []).map((t) => K16[t]).filter(Boolean))].slice(0, 3);
  const program = PROG.filter(([, re]) => re.test(r.judul)).map(([k]) => k);
  const nama = `${String(r.jenis).toUpperCase()} ${r.nomor}/${r.tahun}`;
  const st = { berlaku: 'masih berlaku', dicabut: 'sudah dicabut', diubah: 'berlaku dengan perubahan', rancangan: 'berstatus rancangan' }[r.status] || r.status;
  const pk = [{ teks: `Status: ${st}.`, hlm: null }, { teks: `Penerbit: ${r.instansi_penerbit || 'tidak tercatat'}.`, hlm: null }];
  if (r.tanggal_ditetapkan) pk.push({ teks: `Ditetapkan ${r.tanggal_ditetapkan}.`, hlm: null });
  if (ik.mencabut?.length) pk.push({ teks: `Mencabut ${ik.mencabut.length} peraturan: ${ik.mencabut.slice(0, 3).join(', ')}.`, hlm: null });
  if (ik.mengubah?.length) pk.push({ teks: `Mengubah ${ik.mengubah.length} peraturan: ${ik.mengubah.slice(0, 3).join(', ')}.`, hlm: null });
  if (ik.dicabut_oleh) pk.push({ teks: `Dicabut oleh ${ik.dicabut_oleh}.`, hlm: null });
  if (pk.length < 3) pk.push({ teks: `Topik: ${(r.topik || ['umum']).join(', ')}.`, hlm: null });
  const ring = `${nama} adalah ${String(r.jenis).toLowerCase()} yang mengatur ${String(r.judul).replace(/^./, (c) => c.toLowerCase())}. Peraturan ini diterbitkan oleh ${r.instansi_penerbit || 'instansi terkait'} dan ${st}. Naskah lengkap dapat dibaca langsung di basis data peraturan BPK lewat tautan, tanpa salinan di platform. Topik utamanya: ${(r.topik || ['energi umum']).join(', ')}.`;
  const terkait = [...new Set([...(ik.mencabut || []), ...(ik.mengubah || []), ...(ik.diubah_oleh || []), ...(ik.dicabut_oleh ? [ik.dicabut_oleh] : [])])];
  return { id: 'pk-reg-' + r.id, judul: `${nama}: ${r.judul}`, jenis: 'regulasi', penerbit: r.instansi_penerbit || null, tanggal: tgl(r.tanggal_ditetapkan) || String(r.tahun || '') || null, acara: null, kepakaran: topik.length ? topik : ['kebijakan'], program, ringkasan: ring, poin_kunci: pk.slice(0, 6), halaman: null, bahasa: 'id', ukuran: null, format: 'pdf', lapis: 'publik', rahasia: false, url: r.url_pdf || r.url_sumber || null, regulasi_id: r.id, terkait_regulasi: terkait };
}

export function bangun({ berkas, regulasi, mentahReg, org, proy, orang }) {
  const idx = indeksNama(org, proy, orang, regulasi);
  const dok = []; const unggah = [];
  for (const b of berkas) {
    assert.ok(JENIS.has(b.jenis) && LAPIS.includes(b.lapis), 'jenis/lapis ' + b.id);
    const terkait = cariTerkait(b.ringkasan + ' ' + b.judul, b.terkait_nama, idx);
    const d = { ...b, terkait }; delete d.terkait_nama;
    if (b.lapis !== 'publik' && b.jenis !== 'regulasi') {
      d.berkas_r2 = `potret/${b.lapis}/pustaka/${b.id}.${b.format}`;
      const a = b.berkas_asal; const [rel, dalam] = a.rel.split('!/');
      unggah.push({ kunci: d.berkas_r2, ukuran: b.ukuran, sha1: b.sha1, ...(a.tag === 'arsip-zip' ? { zip: SUMBER_LOKAL[a.tag], entri: rel } : dalam ? { zip: path.join(SUMBER_LOKAL[a.tag], rel), entri: dalam } : { berkas: path.join(SUMBER_LOKAL[a.tag], rel) }) });
    }
    dok.push(d);
  }
  for (const r of regulasi) { const d = dokRegulasi(r, mentahReg); const t = cariTerkait(d.ringkasan, [], idx); const rt = d.terkait_regulasi.filter((x) => idx.regIds.has(x)); delete d.terkait_regulasi; d.terkait = { regulasi_ids: rt, ...t }; if (!d.terkait.regulasi_ids.length) delete d.terkait.regulasi_ids; dok.push(d); }
  return { dok, unggah };
}
const buang = (d) => { const o = { ...d }; delete o.berkas_asal; delete o.sha1; return o; };

function jalankan() {
  const berkas = jsonl(path.join(DP, 'pustaka/berkas.jsonl'));
  const regulasi = potret('regulasi');
  const mentahReg = Object.fromEntries(jsonl(path.join(DP, 'regulasi/regulasi.jsonl')).map((r) => [r.id, r]));
  const { dok, unggah } = bangun({ berkas, regulasi, mentahReg, org: potret('organisasi'), proy: potret('proyek'), orang: potret('orang') });
  const ids = new Set(); for (const d of dok) { assert.ok(!ids.has(d.id), 'id ganda ' + d.id); ids.add(d.id); }
  fs.writeFileSync(path.join(DP, 'pustaka/pustaka.jsonl'), dok.map((d) => JSON.stringify(d)).join('\n') + '\n');
  const dibangun = process.env.TANGGAL || new Date().toISOString().slice(0, 10);
  const semua = [];
  for (const l of LAPIS) {
    const dir = path.join(POT, l); fs.mkdirSync(dir, { recursive: true });
    for (const b of tulisBerkas(dir, l, 'pustaka', dok.filter((d) => d.lapis === l).map(buang), dibangun)) semua.push({ lapis: l, ...b });
  }
  const u = JSON.stringify(unggah, null, 1); fs.writeFileSync(path.join(POT, 'pustaka_unggah.json'), u);
  // pemindai: publik + anggota (aturan potret) dan pengurus (ringkasan/poin tidak boleh memuat data pribadi juga)
  const galat = periksaBerkas(semua); for (const s of semua.filter((x) => x.lapis === 'pengurus')) for (const t of pindai(s.isi)) galat.push(`pengurus/${s.berkas}: ${t}`);
  const hit = (k) => dok.reduce((a, d) => ((a[d[k]] = (a[d[k]] || 0) + 1), a), {});
  console.log('dokumen', dok.length, 'jenis', JSON.stringify(hit('jenis')), 'lapis', JSON.stringify(hit('lapis')), 'unggah', unggah.length);
  for (const s of semua) console.log(`${s.lapis}/${s.berkas}`.padEnd(30), (s.byte / 1024).toFixed(0).padStart(6) + ' KB');
  if (galat.length) { console.error('GAGAL pemindai/ukuran:\n' + galat.slice(0, 30).join('\n')); process.exit(1); }
  console.log('pemindai data pribadi: bersih');
}
export function selftest() {
  const idx = indeksNama([{ id: 'p_1', nama: 'PT Perusahaan Listrik Negara (Persero)', singkatan: 'PLN' }], [{ id: 'pj_1', nama: 'PLTS Pulau Sembur' }], [], [{ id: 'perpres-112-2022' }]);
  assert.deepEqual(cariTerkait('mengacu Perpres 112/2022', ['PLN', 'PLTS Pulau Sembur'], idx), { organisasi_ids: ['p_1'], proyek_ids: ['pj_1'], regulasi_ids: ['perpres-112-2022'] });
  const d = dokRegulasi({ id: 'pp-18-1959', jenis: 'pp', nomor: '18', tahun: 1959, judul: 'Penentuan Perusahaan Listrik', instansi_penerbit: 'Pemerintah Pusat', status: 'berlaku', tanggal_ditetapkan: '1959-05-02', topik: ['energi_umum'], url_pdf: 'https://peraturan.bpk.go.id/x.pdf' });
  assert.equal(d.lapis, 'publik'); assert.ok(d.poin_kunci.length >= 3 && d.url.startsWith('https://peraturan.bpk.go.id'));
  const h = bangun({ berkas: [{ id: 'pk-a', judul: 'A', jenis: 'kajian', lapis: 'anggota', ringkasan: 'x', format: 'pdf', ukuran: 5, sha1: 'h', terkait_nama: [], berkas_asal: { tag: 'meti-lokal', rel: 'a/b.pdf' } }, { id: 'pk-b', judul: 'B', jenis: 'kajian', lapis: 'publik', ringkasan: 'x', format: 'pdf', terkait_nama: [], berkas_asal: { tag: 'meti-lokal', rel: 'c.pdf' } }], regulasi: [], mentahReg: {}, org: [], proy: [], orang: [] });
  assert.equal(h.unggah.length, 1); assert.equal(h.dok[0].berkas_r2, 'potret/anggota/pustaka/pk-a.pdf'); assert.ok(!h.dok[1].berkas_r2);
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) { if (process.argv.includes('--selftest')) selftest(); else jalankan(); }
