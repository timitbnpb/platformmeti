#!/usr/bin/env node
// Panen profil publik 140 pengurus METI -> data-panen/orang/pengurus_profil.jsonl (satu baris per orang).
//   node scripts/pipa/pengurus_panen.mjs --tarik     ambil Wikipedia/Wikidata/Commons (checkpoint raw/pengurus/<slug>.json, bisa dilanjut)
//   node scripts/pipa/pengurus_panen.mjs --bangun    gabung raw + rekam_jejak/orang.jsonl yang ada -> pengurus_profil.jsonl + foto
//   node scripts/pipa/pengurus_panen.mjs --selftest
// Sumber: halaman METI sendiri, rekam_jejak.jsonl (halaman resmi lembaga yang sudah dipanen), id.wikipedia (API), Wikidata, Commons.
// Tanpa media sosial, tanpa kontak pribadi. Nama sama tapi tak pasti = lewati + perlu_tinjau. Jeda >= 2 dtk per host, timeout 10 dtk.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DP = path.join(ROOT, 'data-panen'), RAW = path.join(DP, 'orang/raw/pengurus'), OUT = path.join(DP, 'orang/pengurus_profil.jsonl');
const IMG = path.join(ROOT, 'public/img/pengurus');
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const HARI = process.env.TANGGAL_BANGUN || '2026-11-07';
const METI_URL = 'https://metiires.or.id/about/meettheteam';
const baca = (f) => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
export const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
export const slug = (s) => norm(s).replace(/ /g, '-');
export const idPotret = (nama) => 'pm_' + crypto.createHash('sha1').update(norm(nama)).digest('hex').slice(0, 8); // sama dengan potret.mjs
const GELAR = /^(prof|dr|drs|ir|h|hj|dra|ing|apt|mba|ph\.?d)\b\.?/i;
export const tanpaGelar = (s) => String(s || '').split(',')[0].split(/\s+/).filter((t, i, a) => !(i < a.length - 1 && GELAR.test(t))).join(' ');

// ---- HTTP sopan ----
const terakhir = new Map();
async function ambil(url, { biner = false } = {}) {
  const host = new URL(url).host; const tunggu = (terakhir.get(host) || 0) + 2100 - Date.now(); if (tunggu > 0) await new Promise((r) => setTimeout(r, tunggu));
  for (let i = 0; i < 2; i++) {
    terakhir.set(host, Date.now());
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'id,en' }, signal: AbortSignal.timeout(10000), redirect: 'follow' });
      if (r.status === 403) { console.error('BERHENTI 403', host); process.exit(3); }
      if (r.status === 429) { await new Promise((x) => setTimeout(x, Math.min(60, Number(r.headers.get('retry-after')) || 10) * 1000)); continue; }
      if (r.status !== 200) return null;
      return biner ? Buffer.from(await r.arrayBuffer()) : await r.json();
    } catch { await new Promise((x) => setTimeout(x, 3000)); }
  }
  return null;
}
const WP = 'https://id.wikipedia.org/w/api.php', WD = 'https://www.wikidata.org/w/api.php', CM = 'https://commons.wikimedia.org/w/api.php';
const q = (base, o) => base + '?' + new URLSearchParams({ format: 'json', formatversion: '2', ...o });
const KONTEKS = /energi|listrik|ketenagalistrikan|PLN|Pertamina|ESDM|menteri|guru besar|profesor|dewan|komisaris|direktur|lingkungan|ekonom|surya|panas bumi|geotermal|teknik|sekretaris jenderal|kementerian|badan usaha|pembangkit|pln|bumn|aktivis|peneliti/i;

export function pilihKandidat(nama, namaLengkap, hits, ekstrak) {
  // hits [{title}], ekstrak {title: teks}. Kembalikan {title}|{perlu_tinjau:alasan}|null
  const kunci = new Set([norm(nama), norm(tanpaGelar(namaLengkap))].filter(Boolean));
  if (norm(nama).split(' ').length < 2) return { perlu_tinjau: 'nama-satu-kata' };
  const cocok = hits.filter((h) => kunci.has(norm(h.title)));
  if (!cocok.length) return null;
  const berkonteks = cocok.filter((h) => KONTEKS.test(ekstrak[h.title] || '') && !/dapat merujuk ke/i.test(ekstrak[h.title] || ''));
  if (berkonteks.length === 1) return { title: berkonteks[0].title };
  return { perlu_tinjau: cocok.length > 1 ? 'nama-ganda-di-wikipedia' : 'identitas-tak-terkonfirmasi' };
}

async function tarikSatu(p) {
  const f = path.join(RAW, slug(p.nama) + '.json'); if (fs.existsSync(f)) return;
  const out = { nama: p.nama, diambil: HARI };
  const s = await ambil(q(WP, { action: 'query', list: 'search', srsearch: `"${tanpaGelar(p.nama_lengkap || p.nama)}"`, srlimit: '5', srprop: '' }));
  const hits = s?.query?.search || [];
  const ekstrak = {};
  if (hits.length) {
    const e = await ambil(q(WP, { action: 'query', prop: 'extracts|pageprops', exintro: '1', explaintext: '1', exlimit: '5', ppprop: 'wikibase_item', titles: hits.map((h) => h.title).join('|') }));
    for (const pg of e?.query?.pages || []) { ekstrak[pg.title] = (pg.extract || '').slice(0, 600); (out.qid ||= {})[pg.title] = pg.pageprops?.wikibase_item; }
  }
  const k = pilihKandidat(p.nama, p.nama_lengkap, hits, ekstrak);
  out.hits = hits.map((h) => h.title);
  if (!k) out.hasil = 'tidak-ada'; else if (k.perlu_tinjau) { out.hasil = 'perlu_tinjau'; out.alasan = k.perlu_tinjau; }
  else {
    out.hasil = 'cocok'; out.title = k.title; out.ekstrak = ekstrak[k.title]; out.wp_url = 'https://id.wikipedia.org/wiki/' + encodeURIComponent(k.title.replace(/ /g, '_'));
    const qid = out.qid?.[k.title];
    if (qid) {
      const w = await ambil(q(WD, { action: 'wbgetentities', ids: qid, props: 'claims|sitelinks', }));
      const cl = w?.entities?.[qid]?.claims || {}; out.qid_pakai = qid;
      const wak = (c) => (c || []).map((x) => ({ v: x.mainsnak?.datavalue?.value, a: x.qualifiers?.P580?.[0]?.datavalue?.value?.time, b: x.qualifiers?.P582?.[0]?.datavalue?.value?.time, pa: x.qualifiers?.P580?.[0]?.datavalue?.value?.precision, pb: x.qualifiers?.P582?.[0]?.datavalue?.value?.precision, akhir: x.qualifiers?.P582?.[0]?.datavalue?.value?.time }));
      out.p39 = wak(cl.P39).map((x) => ({ ...x, v: x.v?.id })); out.p69 = wak(cl.P69).map((x) => ({ ...x, v: x.v?.id })); out.p108 = wak(cl.P108).map((x) => ({ ...x, v: x.v?.id }));
      out.p18 = cl.P18?.[0]?.mainsnak?.datavalue?.value || null;
      const ids = [...new Set([...out.p39, ...out.p69, ...out.p108].map((x) => x.v).filter(Boolean))];
      if (ids.length) { const l = await ambil(q(WD, { action: 'wbgetentities', ids: ids.slice(0, 50).join('|'), props: 'labels', languages: 'id|en' })); out.label = Object.fromEntries(Object.entries(l?.entities || {}).map(([i, e]) => [i, e.labels?.id?.value || e.labels?.en?.value])); }
      if (out.p18) {
        const c = await ambil(q(CM, { action: 'query', titles: 'File:' + out.p18, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '600' }));
        const ii = c?.query?.pages?.[0]?.imageinfo?.[0]; const em = ii?.extmetadata || {};
        if (ii) out.foto = { thumb: ii.thumburl, halaman: ii.descriptionurl, pengarang: (em.Artist?.value || '').replace(/<[^>]+>/g, '').trim().slice(0, 120), lisensi: em.LicenseShortName?.value || '' };
      }
    }
  }
  fs.writeFileSync(f, JSON.stringify(out, null, 1));
}

export function daftarPengurus() {
  const L = baca(path.join(DP, 'lembaga/pengurus-meti.jsonl'));
  return L.map((l) => ({ nama: l.nama, nama_lengkap: l.nama_lengkap, jabatan: l.jabatan, kelompok: l.kelompok, subkelompok: l.subkelompok, bidang: l.bidang, orang_id: l.orang_id, foto_url: l.foto_url }));
}
const tahun = (t, pr) => { const m = /^\+?(\d{4})-(\d\d)/.exec(t || ''); return m ? (pr >= 10 ? `${m[1]}-${m[2]}` : m[1]) : null; };
const LIS_OK = /^(CC[ -]|Public domain|PD|GFDL|Attribution)/i;

async function tarik() {
  fs.mkdirSync(RAW, { recursive: true });
  const L = daftarPengurus(); let i = 0;
  for (const p of L) { i++; await tarikSatu(p); if (i % 10 === 0) console.error(`${i}/${L.length}`); }
}

function fotoProses(src, dst) { // trim padding (fuzz 8%), potong persegi dari sepertiga atas, 256px, webp
  const py = `
import sys
from PIL import Image, ImageChops
im=Image.open(sys.argv[1]).convert('RGB'); bg=Image.new('RGB',im.size,im.getpixel((0,0)))
d=ImageChops.difference(im,bg).convert('L').point(lambda x:255 if x>20 else 0); b=d.getbbox()
if b and (b[2]-b[0])*(b[3]-b[1])>0.3*im.size[0]*im.size[1]: im=im.crop(b)
w,h=im.size; s=min(w,h); top=0 if h<=w else int((h-s)*0.15); left=(w-s)//2
im=im.crop((left,top,left+s,top+s)).resize((256,256),Image.LANCZOS); im.save(sys.argv[2],'WEBP',quality=82)`;
  execFileSync('python3', ['-I', '-c', py, src, dst]);
}

async function bangun() {
  const L = daftarPengurus();
  const rj = new Map(baca(path.join(DP, 'orang/rekam_jejak.jsonl')).map((r) => [r.orang_id, r]));
  const oj = new Map(baca(path.join(DP, 'orang/orang.jsonl')).map((r) => [r.orang_id, r]));
  const rows = []; const sumberFoto = [];
  for (const p of L) {
    const raw = fs.existsSync(path.join(RAW, slug(p.nama) + '.json')) ? JSON.parse(fs.readFileSync(path.join(RAW, slug(p.nama) + '.json'), 'utf8')) : {};
    const id = p.orang_id || idPotret(p.nama), r = rj.get(p.orang_id) || {}, o = oj.get(p.orang_id) || {};
    const lbl = (x) => raw.label?.[x.v];
    const rek = []; const tambah = (x) => { if (x.jabatan && x.sumber_url && !rek.some((y) => norm(y.jabatan) === norm(x.jabatan) && norm(y.organisasi) === norm(x.organisasi))) rek.push(x); };
    tambah({ jabatan: p.jabatan, organisasi: 'Masyarakat Energi Terbarukan Indonesia (METI)', mulai: '2025', selesai: '2028', sumber_url: METI_URL });
    for (const x of r.riwayat || []) if (!/Masyarakat Energi Terbarukan/i.test(x.organisasi || '')) tambah({ jabatan: x.jabatan, organisasi: x.organisasi, mulai: x.mulai || null, selesai: x.selesai || null, sumber_url: x.sumber_url });
    const wdu = raw.qid_pakai && 'https://www.wikidata.org/wiki/' + raw.qid_pakai;
    for (const x of raw.p39 || []) if (lbl(x)) tambah({ jabatan: lbl(x), organisasi: null, mulai: tahun(x.a, x.pa), selesai: tahun(x.b, x.pb), sumber_url: wdu });
    for (const x of raw.p108 || []) if (lbl(x)) tambah({ jabatan: 'Pegawai/anggota', organisasi: lbl(x), mulai: tahun(x.a, x.pa), selesai: tahun(x.b, x.pb), sumber_url: wdu });
    const pen = []; for (const x of r.pendidikan || []) pen.push({ jenjang: x.jenjang || null, bidang: x.bidang || null, institusi: x.institusi, tahun: x.lulus || x.tahun || null, sumber_url: x.sumber_url });
    for (const x of raw.p69 || []) if (lbl(x) && !pen.some((y) => norm(y.institusi) === norm(lbl(x)))) pen.push({ jenjang: null, bidang: null, institusi: lbl(x), tahun: tahun(x.b, x.pb), sumber_url: wdu });
    const tautan = [{ jenis: 'profil-meti', url: METI_URL }]; for (const t of r.tautan || []) if (t.jenis === 'profil-resmi' && !tautan.some((x) => x.url === t.url)) tautan.push({ jenis: 'profil-resmi', url: t.url });
    if (raw.wp_url) tautan.push({ jenis: 'wikipedia', url: raw.wp_url }); if (wdu) tautan.push({ jenis: 'wikidata', url: wdu });
    const kini = r.jabatan_terkini || o.jabatan_terkini || null, org = r.organisasi_terkini || o.organisasi_terkini || null;
    const kiniSumber = (r.riwayat || []).find((x) => x.kini)?.sumber_url || o.sumber_url || (r.tautan || [])[0]?.url || null;
    const kal = [`${p.nama} menjabat ${p.jabatan}${p.bidang ? ' (' + p.bidang + ')' : ''} di METI periode 2025-2028.`];
    if (kini && org && kiniSumber) kal.push(`Jabatan terkininya ${kini} di ${org}.`);
    else if (pen[0]?.institusi) kal.push(`Pendidikannya mencakup ${pen[0].institusi}.`);
    const sumber = [{ url: METI_URL, tanggal: HARI }]; for (const u of new Set([...rek.map((x) => x.sumber_url), ...pen.map((x) => x.sumber_url), kiniSumber, raw.wp_url].filter(Boolean))) if (!sumber.some((x) => x.url === u)) sumber.push({ url: u, tanggal: HARI });
    // foto
    let fotoBaru = null; const sl = slug(p.nama);
    if (!p.foto_url && raw.foto?.thumb && LIS_OK.test(raw.foto.lisensi)) {
      const dst = path.join(IMG, sl + '.webp');
      if (!fs.existsSync(dst)) { const b = await ambil(raw.foto.thumb, { biner: true }); if (b) { const tmp = path.join(RAW, sl + '.img'); fs.writeFileSync(tmp, b); try { fotoProses(tmp, dst); } catch { /* gambar rusak: lewati */ } fs.rmSync(tmp, { force: true }); } }
      if (fs.existsSync(dst)) { fotoBaru = '/img/pengurus/' + sl + '.webp'; sumberFoto.push({ nama: p.nama, berkas: sl + '.webp', halaman: raw.foto.halaman, pengarang: raw.foto.pengarang, lisensi: raw.foto.lisensi }); }
    }
    const adaFakta = rek.length > 1 || pen.length || kini || raw.wp_url;
    const row = { id, nama: p.nama, jabatan_meti: p.jabatan, unit_meti: p.bidang || p.subkelompok || p.kelompok, jabatan_terkini: kini && kiniSumber ? kini : null, organisasi_terkini: kini && kiniSumber ? org : null,
      rekam_jejak: rek, pendidikan: pen, kepakaran: o.kepakaran?.length ? o.kepakaran : [], ringkasan: kal.join(' '), tautan_publik: tautan, foto_sumber: p.foto_url ? { url: p.foto_url, halaman: METI_URL } : fotoBaru ? { url: raw.foto.halaman, halaman: raw.foto.halaman, lisensi: raw.foto.lisensi } : null,
      foto_file: fotoBaru, sumber, perlu_tinjau: raw.hasil === 'perlu_tinjau' ? raw.alasan : (norm(p.nama).split(' ').length < 2 ? 'nama-satu-kata' : null), tanpa_fakta_tambahan: !adaFakta };
    rows.push(row);
  }
  fs.writeFileSync(OUT, rows.map((x) => JSON.stringify(x)).join('\n') + '\n');
  if (sumberFoto.length) {
    const f = path.join(IMG, 'SUMBER.md'); const lama = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter((l) => !/^\| .*\(wikimedia\)/.test(l)) : ['# Sumber foto pengurus', '', '| Nama | Berkas | Halaman sumber | Pemilik | Lisensi |', '| --- | --- | --- | --- | --- |'];
    fs.writeFileSync(f, lama.filter((l, i, a) => l || i < a.length - 1).join('\n').replace(/\n+$/, '\n') + sumberFoto.map((s) => `| ${s.nama} (wikimedia) | ${s.berkas} | ${s.halaman} | ${s.pengarang || '-'} | ${s.lisensi} |`).join('\n') + '\n');
  }
  const fakta = (x) => x.rekam_jejak.length + x.pendidikan.length + (x.jabatan_terkini ? 1 : 0) + x.kepakaran.length;
  const sumF = rows.reduce((a, x) => a + fakta(x), 0);
  console.log(JSON.stringify({ pengurus: rows.length, ada_fakta_tambahan: rows.filter((x) => !x.tanpa_fakta_tambahan).length, kosong: rows.filter((x) => x.tanpa_fakta_tambahan).length, perlu_tinjau: rows.filter((x) => x.perlu_tinjau).length, rata_fakta: +(sumF / rows.length).toFixed(2), foto_baru: sumberFoto.length }));
}
function selftest() {
  assert.equal(slug('Dr. Ir. Tri Mumpuni'), 'dr-ir-tri-mumpuni'); assert.equal(tanpaGelar('Ir. Nur Pamudji, MPM., M.Eng., IPU'), 'Nur Pamudji');
  assert.equal(pilihKandidat('Alexander', 'Alexander', [{ title: 'Alexander' }], {}).perlu_tinjau, 'nama-satu-kata');
  assert.equal(pilihKandidat('Tri Mumpuni', 'Tri Mumpuni', [{ title: 'Tri Mumpuni' }], { 'Tri Mumpuni': 'pelopor listrik desa' }).title, 'Tri Mumpuni');
  assert.equal(pilihKandidat('Budi Santoso', 'Budi Santoso', [{ title: 'Budi Santoso' }, { title: 'Budi Santoso (penyanyi)' }], { 'Budi Santoso': 'dosen teknik' }).title, 'Budi Santoso');
  assert.equal(pilihKandidat('Budi X', 'Budi X', [{ title: 'Budi X' }], { 'Budi X': 'seorang pemain bola' }).perlu_tinjau, 'identitas-tak-terkonfirmasi');
  assert.equal(pilihKandidat('Budi X', 'Budi X', [{ title: 'Orang Lain' }], {}), null);
  assert.match(idPotret('Kusetiadi Raharjo (PLTM)'), /^pm_[0-9a-f]{8}$/);
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else if (process.argv.includes('--tarik')) await tarik();
  else if (process.argv.includes('--bangun')) await bangun();
  else console.error('pakai --tarik | --bangun | --selftest');
}
