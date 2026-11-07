#!/usr/bin/env node
// Lengkapi orang.json dari Wikidata (CC0): P39 jabatan (+P580/P582/P1545), P69 pendidikan (+P512 gelar, P812 jurusan, P580/P582 tahun),
// P106 pekerjaan, P569 TAHUN lahir saja. Tanpa tempat lahir, tanggal lahir lengkap, kontak, medsos.
//   node scripts/pipa/orang_wikidata.mjs unduh      jaringan: cari Q-id untuk yang belum punya, tarik entitas -> cache (resumable)
//   node scripts/pipa/orang_wikidata.mjs terapkan   tanpa jaringan: cache -> orang.json (lalu orang_bersih)
//   node scripts/pipa/orang_wikidata.mjs --selftest
// Etika: UA jujur, 1 permintaan serentak, jeda >= 2 dtk, 403/429 = berhenti. api.php Wikidata = antarmuka mesin resmi (pengecualian robots
// yang sama dengan rekam_jejak.mjs). Cocok nama hanya diterima bila label PERSIS, manusia, WNI, dan >= 2 token bukti sama dengan jabatan/organisasi.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { bersihkan, labelJabatan, labelKampus } from './orang_bersih.mjs';

const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BERKAS = path.join(ROOT, 'public/data/orang.json');
const CACHE = path.join(ROOT, 'data-panen/orang/raw/rekam/wd_kaya.json');
const API = 'https://www.wikidata.org/w/api.php';
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
let terakhir = 0;
async function api(params) {
  await tidur(Math.max(0, 2200 - (Date.now() - terakhir))); terakhir = Date.now();
  const u = API + '?' + new URLSearchParams({ format: 'json', ...params });
  for (let i = 0; i < 2; i++) {
    const r = await fetch(u, { headers: { 'user-agent': UA } });
    if (r.status === 403) throw new Error('403 berhenti total');
    if (r.status === 429) { const w = Number(r.headers.get('retry-after') || 30); if (i) throw new Error('429 berhenti'); await tidur(w * 1000); continue; }
    if (r.ok) return r.json();
    if (r.status < 500 || i) throw new Error(r.status + ' ' + u); await tidur(5000);
  }
}
const lat = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const kata = (s) => lat(s).replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length >= 4);
const GENERIK = new Set(['indonesia', 'republik', 'energi', 'sumber', 'mineral', 'direktur', 'utama', 'komisaris', 'menteri', 'anggota', 'kementerian', 'persero', 'ketua', 'wakil', 'president', 'director', 'chief', 'officer', 'member', 'minister', 'dewan', 'badan']);
const kunciNama = (n) => lat(n).replace(/\b(prof|dr|ir|drs|dra|h|hj|mm|msc|ph\.?d|se|st|sh|mba)\b\.?/g, ' ').replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();
const nilai = (c) => { const v = c?.mainsnak?.datavalue?.value; return v == null ? null : v.id || v.time || (typeof v === 'string' ? v : null); };
const tahun = (t, presisi) => { const m = String(t || '').match(/^([+-])(\d{4})-(\d\d)-(\d\d)/); if (!m || m[1] === '-') return null; return !presisi || presisi >= 11 ? `${m[2]}-${m[3]}-${m[4]}` : presisi === 10 ? `${m[2]}-${m[3]}` : m[2]; };
const qual = (c, p) => (c.qualifiers?.[p] || []).map((s) => s.datavalue?.value).filter(Boolean);
const PROPS = ['P570', 'P31', 'P27', 'P39', 'P69', 'P106', 'P569', 'P108', 'P463'];

function ringkasEntitas(e) {
  const out = { l: { id: e.labels?.id?.value, en: e.labels?.en?.value }, d: { id: e.descriptions?.id?.value, en: e.descriptions?.en?.value }, idwiki: e.sitelinks?.idwiki?.title, enwiki: e.sitelinks?.enwiki?.title, c: {} };
  for (const p of PROPS) out.c[p] = (e.claims?.[p] || []).filter((c) => c.rank !== 'deprecated').map((c) => ({
    v: p === 'P569' ? { time: c.mainsnak?.datavalue?.value?.time, pr: c.mainsnak?.datavalue?.value?.precision } : nilai(c),
    q: Object.fromEntries(['P580', 'P582', 'P1545', 'P512', 'P812'].map((k) => [k, qual(c, k).map((v) => (v.time ? { time: v.time, pr: v.precision } : v.id || v))]).filter(([, a]) => a.length)) }));
  return out;
}
const cacheBaca = () => (fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : { cari: {}, ent: {}, label: {} });
const cacheTulis = (c) => { fs.mkdirSync(path.dirname(CACHE), { recursive: true }); fs.writeFileSync(CACHE, JSON.stringify(c), 'utf8'); };

async function unduh() {
  const d = JSON.parse(fs.readFileSync(BERKAS, 'utf8')).baris; const c = cacheBaca();
  const tanpa = d.filter((o) => !o.wikidata_id && o.kelompok?.kode !== 'asing' && !(o.nama in c.cari));
  console.error('cari nama:', tanpa.length);
  for (const [i, o] of tanpa.entries()) {
    const r = await api({ action: 'wbsearchentities', search: o.nama.replace(/^(Prof\.?|Dr\.?|Ir\.?)\s+/i, ''), language: 'id', uselang: 'id', type: 'item', limit: '5' });
    c.cari[o.nama] = (r.search || []).filter((x) => kunciNama(x.label || x.match?.text) === kunciNama(o.nama)).map((x) => x.id);
    if (i % 25 === 24) { cacheTulis(c); console.error(i + 1, '/', tanpa.length); }
  }
  const ids = [...new Set([...d.map((o) => o.wikidata_id).filter(Boolean), ...Object.values(c.cari).flat()])].filter((q) => !c.ent[q]);
  for (let i = 0; i < ids.length; i += 50) {
    const r = await api({ action: 'wbgetentities', ids: ids.slice(i, i + 50).join('|'), props: 'claims|labels|descriptions|sitelinks', languages: 'id|en', sitefilter: 'idwiki|enwiki' });
    for (const [q, e] of Object.entries(r.entities || {})) c.ent[q] = ringkasEntitas(e);
    cacheTulis(c);
  }
  const acuan = new Set(); for (const e of Object.values(c.ent)) for (const p of ['P39', 'P69', 'P106', 'P108', 'P463', 'P512', 'P812']) for (const x of e.c[p] || []) { if (typeof x.v === 'string' && /^Q\d+$/.test(x.v)) acuan.add(x.v); for (const a of Object.values(x.q || {}).flat()) if (typeof a === 'string' && /^Q\d+$/.test(a)) acuan.add(a); }
  const butuh = [...acuan].filter((q) => !c.label[q]);
  for (let i = 0; i < butuh.length; i += 50) {
    const r = await api({ action: 'wbgetentities', ids: butuh.slice(i, i + 50).join('|'), props: 'labels', languages: 'id|en' });
    for (const [q, e] of Object.entries(r.entities || {})) c.label[q] = { id: e.labels?.id?.value, en: e.labels?.en?.value };
    cacheTulis(c);
  }
  console.error('entitas', Object.keys(c.ent).length, 'label', Object.keys(c.label).length);
}

// ---------- penerapan ----------
const JENJANG = [[/doctor|ph\.?d|doktor/i, 'S3'], [/master|magister/i, 'S2'], [/bachelor|sarjana/i, 'S1'], [/diploma/i, 'D3']];
const lbl = (c, q) => c.label[q]?.id || c.label[q]?.en || null;
const THN = (v) => (v?.time ? tahun(v.time, v.pr) : null);

export function pecahEntitas(e, c, tgl) {
  const src = (q) => 'https://www.wikidata.org/wiki/' + q;
  return (q) => {
    const jabatan = (e.c.P39 || []).map((x) => {
      const nama = lbl(c, x.v); if (!nama) return null;
      return { jabatan: labelJabatan(nama), mulai: THN(x.q.P580?.[0]), selesai: THN(x.q.P582?.[0]), urutan: Number(x.q.P1545?.[0]) || undefined, kini: false, sumber_url: src(q), tanggal_akses: tgl };
    }).filter(Boolean);
    const pendidikan = (e.c.P69 || []).map((x) => {
      const inst = lbl(c, x.v); if (!inst) return null; const g = lbl(c, x.q.P512?.[0]) || ''; const j = JENJANG.find(([re]) => re.test(g));
      return { jenjang: j ? j[1] : null, bidang: lbl(c, x.q.P812?.[0]), institusi: labelKampus(inst), mulai: THN(x.q.P580?.[0]), lulus: THN(x.q.P582?.[0]), sumber_url: src(q), tanggal_akses: tgl };
    }).filter(Boolean);
    const pekerjaan = [...new Set((e.c.P106 || []).map((x) => lbl(c, x.v)).filter(Boolean).map((s) => s.toLowerCase()))];
    const lahir = (e.c.P569 || []).map((x) => (x.v?.time ? tahun(x.v.time, 9) : null)).find(Boolean) || null;
    return { jabatan, pendidikan, pekerjaan, lahir_tahun: lahir ? Number(lahir) : null };
  };
}
const buktiTeks = (e, c) => [e.d.id, e.d.en, ...['P39', 'P108', 'P463', 'P106'].flatMap((p) => (e.c[p] || []).map((x) => lbl(c, x.v)))].filter(Boolean).join(' ');
export function cocok(o, q, c) { // kandidat diterima bila manusia, WNI, dan >= 2 token bukti bersama
  const e = c.ent[q]; if (!e) return false;
  if (!(e.c.P31 || []).some((x) => x.v === 'Q5') || !(e.c.P27 || []).some((x) => x.v === 'Q252')) return false;
  const orang = new Set(kata([o.jabatan_terkini, o.organisasi_terkini, ...(o.jabatan || []).flatMap((j) => [j.jabatan, j.organisasi])].join(' ')).filter((w) => !GENERIK.has(w)));
  const ent = new Set(kata(buktiTeks(e, c)).filter((w) => !GENERIK.has(w)));
  return [...orang].filter((w) => ent.has(w)).length >= 2;
}

export function terapkanWd(d, c) {
  const stat = { cocok_baru: 0, tinjau: [], diperkaya: 0 };
  const tgl = d.dibangun_pada;
  d.baris = d.baris.map((o) => {
    let q = o.wikidata_id;
    if (!q) {
      const ok = (c.cari[o.nama] || []).filter((x) => cocok(o, x, c)); if (ok.length === 1) { q = ok[0]; stat.cocok_baru++; } else if ((c.cari[o.nama] || []).length) stat.tinjau.push(o.nama);
    }
    const e = q && c.ent[q]; if (!e || (e.c.P570 || []).length) return o; // wafat = dikecualikan
    const f = pecahEntitas(e, c, tgl)(q); const x = { ...o, wikidata_id: q }; stat.diperkaya++;
    // jabatan Wikidata tanpa akhir tidak dianggap "kini": ikut status lembaga lain; gabungJabatan menyatukan dengan yang sudah ada
    x.jabatan = [...(o.jabatan || []), ...f.jabatan];
    x.pendidikan = [...(o.pendidikan || []), ...f.pendidikan];
    if (f.pekerjaan.length) x.pekerjaan = f.pekerjaan.slice(0, 4);
    if (f.lahir_tahun) x.lahir_tahun = f.lahir_tahun;
    const tautan = [...(o.tautan || [])]; const wd = 'https://www.wikidata.org/wiki/' + q;
    if (e.idwiki) tautan.push({ jenis: 'wikipedia', url: 'https://id.wikipedia.org/wiki/' + encodeURIComponent(e.idwiki.replace(/ /g, '_')), sumber_url: wd });
    if (e.enwiki) tautan.push({ jenis: 'wikipedia', url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(e.enwiki.replace(/ /g, '_')), sumber_url: wd });
    tautan.push({ jenis: 'wikidata', url: wd, sumber_url: wd }); x.tautan = tautan;
    return x;
  });
  return stat;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2];
  if (cmd === '--selftest') {
    assert.equal(tahun('+2019-10-23T00:00:00Z', 11), '2019-10-23'); assert.equal(tahun('+2019-00-00T00:00:00Z', 9), '2019'); assert.equal(tahun('-0100-00-00T00:00:00Z', 9), null);
    const c = { ent: { Q1: { d: { id: 'menteri', en: '' }, c: { P31: [{ v: 'Q5' }], P27: [{ v: 'Q252' }], P39: [{ v: 'Q9' }], P106: [] } } }, label: { Q9: { id: 'Menteri Pertambangan Batubara' } } };
    assert.ok(!cocok({ jabatan_terkini: 'Menteri Pertambangan', jabatan: [] }, 'Q1', c)); // satu token bukan bukti
    assert.ok(cocok({ jabatan_terkini: 'Menteri Pertambangan Batubara', jabatan: [] }, 'Q1', c));
    console.log('orang_wikidata selftest ok');
  } else if (cmd === 'unduh') await unduh();
  else if (cmd === 'terapkan') {
    const d = JSON.parse(fs.readFileSync(BERKAS, 'utf8')); const s = terapkanWd(d, cacheBaca()); const b = bersihkan(d);
    fs.writeFileSync(BERKAS, JSON.stringify(d), 'utf8'); console.log(JSON.stringify({ ...s, tinjau: s.tinjau.length, ...b }));
    fs.writeFileSync(path.join(ROOT, 'data-panen/orang/raw/rekam/wd_tinjau.json'), JSON.stringify(s.tinjau), 'utf8');
  } else { console.error('pakai: unduh | terapkan | --selftest'); process.exit(1); }
}
