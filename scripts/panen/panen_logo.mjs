#!/usr/bin/env node
// Logo organisasi -> public/img/logo/org/<org_id>.png. Dapat dilanjutkan (checkpoint data-panen/logo/status.json).
//   node scripts/panen/panen_logo.mjs [--maks N] [--hanya=id1,id2] [--ulang] [--tanpa-wikidata]
//   node scripts/panen/panen_logo.mjs --tetap=<org_id>=<url gambar logo di situs resmi>   (ganti logo yang salah, mis. favicon terpotong)
// Urutan per organisasi dengan situs: (a) apple-touch-icon/icon >= 96, (b) <img> logo di kepala halaman (og:image dilarang: foto),
// (c) favicon >= 64. Tanpa situs / gagal: Wikidata P154 (logo) lewat Commons.
// Sopan: robots.txt dihormati (kecuali API Wikimedia, sesuai kebijakan Wikimedia), UA METI, jeda >= 2 dtk per host, timeout 8 dtk,
// tanpa login/formulir/CAPTCHA, gagal = dilewati. SVG dirasterkan (tanpa skrip yang lolos). Keluaran PNG <= 40 KB, 64-256 px.
// Perlu paket `sharp` (sudah terpasang sebagai dependensi wrangler) dan `sips`/`ffmpeg` hanya untuk ICO bukan-PNG.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { UA, robotsBolehkan, norm } from './berita.mjs';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const POTRET = AKAR + 'data-panen/potret/', DIR_CP = AKAR + 'data-panen/logo/', KELUAR = process.env.LOGO_KELUAR || AKAR + 'public/img/logo/org/';
const CP = DIR_CP + 'status.json', JSONL = DIR_CP + 'logo.jsonl', SUMBER_MD = AKAR + 'public/img/logo/SUMBER.md';
const arg = (k) => (process.argv.find((a) => a.startsWith(k + '=')) || '').slice(k.length + 1);
const MAKS = +(process.argv[process.argv.indexOf('--maks') + 1]) || 1e9, HANYA = arg('--hanya') ? new Set(arg('--hanya').split(',')) : null;
const ULANG = process.argv.includes('--ulang'), TANPA_WD = process.argv.includes('--tanpa-wikidata');
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const tgl = () => new Date().toISOString().slice(0, 10);

// ---------- HTTP sopan ----------
const WIKI = /(^|\.)(wikidata|wikimedia|wikipedia)\.org$/;
const terakhir = new Map(), robots = new Map(), blok = new Set(), antre = new Map();
function gerbang(host) { // serialisasi per host: >= 2 dtk antar permintaan
  const sebelum = antre.get(host) || Promise.resolve();
  const sekarang = sebelum.then(async () => { const w = (terakhir.get(host) || 0) + 2100 - Date.now(); if (w > 0) await tidur(w); terakhir.set(host, Date.now()); });
  antre.set(host, sekarang.catch(() => {})); return sekarang;
}
async function ambil(url, { biner = false, batas = 2_000_000, terima = '*/*' } = {}) {
  const u = new URL(url); if (!/^https?:$/.test(u.protocol) || blok.has(u.host)) return null;
  await gerbang(u.host);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: terima }, redirect: 'follow', signal: AbortSignal.timeout(8000) });
    if (r.status === 403 || r.status === 429) { blok.add(u.host); return null; }
    if (!r.ok) return { status: r.status, url: r.url };
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > batas) return null;
    return { status: 200, url: r.url, tipe: r.headers.get('content-type') || '', buf, teks: biner ? null : buf.toString('utf8') };
  } catch { return null; }
}
async function boleh(url) {
  const u = new URL(url); if (WIKI.test(u.hostname)) return true;
  if (!robots.has(u.host)) robots.set(u.host, (async () => {
    const r = await ambil(u.origin + '/robots.txt', { batas: 200000 });
    if (!r) return null; // galat jaringan: anggap tidak boleh
    return r.status === 200 ? r.teks : ''; // 404 dst = tidak ada aturan
  })());
  const t = await robots.get(u.host); if (t === null) return false;
  return robotsBolehkan(t, u.pathname + u.search);
}
const ambilBoleh = async (url, o) => ((await boleh(url)) ? ambil(url, o) : null);

// ---------- normalisasi gambar ----------
let sharp; try { sharp = (await import('sharp')).default; } catch { console.error('paket sharp tidak ada'); process.exit(1); }
function icoTerbesar(buf) { // ambil PNG tertanam terbesar dari ICO; BMP tidak didukung
  if (buf.length < 22 || buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) return buf;
  let best = null;
  for (let i = 0; i < buf.readUInt16LE(4); i++) {
    const o = 6 + i * 16, w = buf[o] || 256, size = buf.readUInt32LE(o + 8), off = buf.readUInt32LE(o + 12);
    if (off + size <= buf.length && buf.slice(off, off + 4).toString('latin1') === '\x89PNG' && (!best || w > best.w)) best = { w, b: buf.slice(off, off + size) };
  }
  return best ? best.b : null;
}
async function jadikanPng(buf, { rasio = false, mentahMaks = 0 } = {}) {
  if (mentahMaks && buf.length > mentahMaks) return null;
  const kepala = buf.slice(0, 600).toString('latin1');
  if (/<svg/i.test(kepala) || /<svg/i.test(buf.slice(0, 5000).toString('utf8'))) buf = Buffer.from(buf.toString('utf8').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, ''));
  else if (buf[0] === 0 && buf[2] === 1) { buf = icoTerbesar(buf); if (!buf) return null; }
  try {
    const m0 = await sharp(buf, { density: 300, limitInputPixels: 40e6 }).metadata();
    if (rasio) { const r = m0.width / m0.height; if (r < 0.5 || r > 2) return null; }
    let img = await sharp(buf, { density: 300, limitInputPixels: 40e6 }).rotate().ensureAlpha().trim({ threshold: 12 }).toBuffer({ resolveWithObject: true }).catch(async () => ({ data: await sharp(buf, { density: 300 }).ensureAlpha().png().toBuffer() }));
    const base = img.data;
    const m = await sharp(base).metadata();
    if (Math.max(m.width, m.height) < 64 || Math.max(m.width, m.height) / Math.min(m.width, m.height) > 5) return null;
    const st = await sharp(base).stats();
    if (st.channels.slice(0, 3).every((c) => c.stdev < 5) && st.channels[3].min > 250) return null; // kotak polos
    for (const sisi of [256, 192, 144, 112, 80]) {
      const out = await sharp(base).resize(sisi, sisi, { fit: 'inside', withoutEnlargement: true }).png({ palette: true, quality: 85, compressionLevel: 9, effort: 8 }).toBuffer();
      const o = await sharp(out).metadata();
      if (Math.max(o.width, o.height) < 64) return null;
      if (out.length <= 40 * 1024) return out;
    }
  } catch { /* gambar rusak */ }
  return null;
}

// ---------- calon dari halaman ----------
const lepas = (s) => String(s).replace(/&amp;/g, '&').replace(/&#x2F;/gi, '/').replace(/&quot;/g, '"').trim();
const atr = (tag, k) => (tag.match(new RegExp(`\\b${k}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')) || []).slice(2).find((x) => x != null);
const mutlak = (u, dasar) => { try { if (!u || /^(data|javascript|blob):/i.test(u)) return null; const x = new URL(lepas(u), dasar); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } };
function calon(html, dasar) {
  const out = [], tags = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const sisi = (t) => Math.max(0, ...(String(atr(t, 'sizes') || '').match(/\d+/g) || []).map(Number));
  const a = tags.filter((t) => /apple-touch-icon/i.test(atr(t, 'rel') || '')).concat(tags.filter((t) => /(^|\s)(shortcut )?icon(\s|$)/i.test(atr(t, 'rel') || '') && sisi(t) >= 96))
    .sort((x, y) => sisi(y) - sisi(x));
  for (const t of a) out.push(['apple-touch-icon', mutlak(atr(t, 'href'), dasar), {}]);
  const kepala = (html.match(/<(header|nav)\b[\s\S]*?<\/\1>/i) || [html.slice(0, 60000)])[0].slice(0, 60000);
  for (const m of (kepala + html.slice(0, 80000)).matchAll(/<img\b[^>]*>/gi)) {
    const t = m[0], s = atr(t, 'src') || atr(t, 'data-src') || '', ciri = `${s} ${atr(t, 'alt') || ''} ${atr(t, 'class') || ''} ${atr(t, 'id') || ''}`;
    if (/logo/i.test(ciri) && !/sprite|partner|client|sponsor|mitra|footer-?logo|banner|slider|facebook|twitter|instagram|youtube|whatsapp/i.test(ciri)) out.push(['logo-header', mutlak(s, dasar), {}]);
    if (out.filter((x) => x[0] === 'logo-header').length >= 3) break;
  }
  // og:image TIDAK dipakai: hampir selalu foto/banner, bukan logo.
  for (const t of tags.filter((t) => /icon/i.test(atr(t, 'rel') || '') && !/apple/i.test(atr(t, 'rel') || ''))) out.push(['favicon', mutlak(atr(t, 'href'), dasar), {}]);
  out.push(['favicon', mutlak('/favicon.ico', dasar), {}]);
  return out.filter((x) => x[1]).filter((x, i, l) => l.findIndex((y) => y[1] === x[1]) === i);
}
async function dariSitus(situs) {
  const awal = /^https?:\/\//i.test(situs) ? situs : 'https://' + situs;
  const h = await ambilBoleh(awal, { terima: 'text/html' }); if (!h || h.status !== 200 || !h.teks) return null;
  for (const [metode, url, opsi] of calon(h.teks.slice(0, 600000), h.url).slice(0, 8)) {
    const g = await ambilBoleh(url, { biner: true });
    if (!g || g.status !== 200 || (g.tipe && /text\/html/i.test(g.tipe))) continue;
    const png = await jadikanPng(g.buf, opsi); if (png) return { png, metode, url_sumber: url };
  }
  return null;
}

// ---------- Wikidata P154 ----------
const bersihNama = (s) => norm(String(s).replace(/\([^)]*\)/g, ' ')).replace(/\b(pt|tbk|persero|cv|perum|perseroan|terbuka)\b/g, ' ').replace(/\s+/g, ' ').trim();
async function api(params) { const r = await ambil('https://www.wikidata.org/w/api.php?' + new URLSearchParams({ format: 'json', ...params }), { terima: 'application/json' }); try { return r?.teks ? JSON.parse(r.teks) : null; } catch { return null; } }
async function dariWikidata(o) {
  const nama = bersihNama(o.nama); if (nama.length < 4) return null;
  const s = await api({ action: 'wbsearchentities', search: String(o.nama).replace(/\([^)]*\)/g, '').replace(/^PT\.?\s+/i, '').trim(), language: 'id', uselang: 'id', limit: '6', type: 'item' });
  const cocok = (s?.search || []).filter((e) => [e.label, ...(e.aliases || []), e.match?.text].filter(Boolean).some((x) => bersihNama(x) === nama));
  if (!cocok.length) return null;
  const e = await api({ action: 'wbgetentities', ids: cocok.slice(0, 3).map((x) => x.id).join('|'), props: 'claims' });
  for (const x of cocok.slice(0, 3)) {
    const f = e?.entities?.[x.id]?.claims?.P154?.[0]?.mainsnak?.datavalue?.value; if (!f) continue;
    const g = await ambil('https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(f) + '?width=256', { biner: true });
    if (!g || g.status !== 200) continue;
    const png = await jadikanPng(g.buf); if (png) return { png, metode: 'wikidata-p154', url_sumber: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(f.replace(/ /g, '_')) + ' (Wikidata ' + x.id + ')' };
  }
  return null;
}

// ---------- masukan, checkpoint ----------
function muatOrg() {
  const m = new Map();
  for (const l of ['publik', 'anggota', 'pengurus']) {
    const b = JSON.parse(fs.readFileSync(`${POTRET}${l}/organisasi.json`, 'utf8')).baris || [];
    for (const o of b) { const x = m.get(o.id) || {}; m.set(o.id, { id: o.id, nama: o.nama || x.nama, situs: o.situs || x.situs, nama_lain: o.nama_lain || x.nama_lain }); }
  }
  return [...m.values()].filter((o) => o.nama && /^[A-Za-z0-9_-]+$/.test(o.id));
}
fs.mkdirSync(DIR_CP, { recursive: true }); fs.mkdirSync(KELUAR, { recursive: true });
const st = !ULANG && fs.existsSync(CP) ? JSON.parse(fs.readFileSync(CP, 'utf8')) : {};
const simpan = () => fs.writeFileSync(CP, JSON.stringify(st));
const sudahJsonl = new Set(fs.existsSync(JSONL) ? fs.readFileSync(JSONL, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).org_id) : []);
function catat(o, h) {
  fs.writeFileSync(KELUAR + o.id + '.png', h.png);
  st[o.id] = { ...st[o.id], hasil: 'ok', metode: h.metode, url_sumber: h.url_sumber };
  if (!sudahJsonl.has(o.id)) { fs.appendFileSync(JSONL, JSON.stringify({ org_id: o.id, url_sumber: h.url_sumber, metode: h.metode, tanggal: tgl() }) + '\n'); sudahJsonl.add(o.id); }
}
async function kolam(daftar, kerja, n = 16) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < daftar.length) { const o = daftar[i++]; try { await kerja(o); } catch (e) { console.error(o.id, String(e).slice(0, 100)); } simpan(); } })); }

const TETAP = arg('--tetap');
if (TETAP) { // satu organisasi, URL logo ditunjuk manusia dari situs resminya sendiri; tetap lewat robots.txt dan jeda
  const [id, url] = [TETAP.split('=')[0], TETAP.slice(TETAP.indexOf('=') + 1)];
  const g = await ambilBoleh(url, { biner: true }); const png = g?.status === 200 && await jadikanPng(g.buf);
  if (!png) { console.error('gagal', id); process.exit(1); }
  catat({ id }, { png, metode: 'logo-header', url_sumber: url }); simpan(); console.log('logo diganti', id);
}
const DAFTAR = arg('--daftar'); // berkas JSON [{id, nama, situs}] (mis. pemasok rantai yang belum punya organisasi di potret); situs dulu, Wikidata P154 bila tanpa situs/gagal
if (DAFTAR) {
  const l = JSON.parse(fs.readFileSync(DAFTAR, 'utf8')).filter((o) => /^[A-Za-z0-9_-]+$/.test(o.id) && (ULANG || !fs.existsSync(KELUAR + o.id + '.png')));
  console.log('daftar', l.length);
  await kolam(l, async (o) => { let h = o.situs ? await dariSitus(o.situs) : null; if (!h && !TANPA_WD) h = await dariWikidata(o); st[o.id] = { ...st[o.id], situs: h ? 'ok' : 'gagal' }; if (h) { catat(o, h); console.log('logo', o.id, o.nama, h.metode); } else console.log('tanpa logo', o.id, o.nama); }, 6);
  simpan(); process.exit(0);
}
let orgs = TETAP ? [] : muatOrg(); if (HANYA) orgs = orgs.filter((o) => HANYA.has(o.id)); orgs = orgs.slice(0, MAKS);
console.log('organisasi', orgs.length, 'bersitus', orgs.filter((o) => o.situs).length);
const baru = (o) => st[o.id]?.hasil !== 'ok';
await kolam(orgs.filter((o) => o.situs && baru(o) && !st[o.id]?.situs), async (o) => {
  const h = await dariSitus(o.situs); st[o.id] = { ...st[o.id], situs: h ? 'ok' : 'gagal' };
  if (h) catat(o, h);
});
console.log('fase situs selesai; ok =', Object.values(st).filter((x) => x.hasil === 'ok').length);
if (!TANPA_WD) {
  await kolam(orgs.filter((o) => baru(o) && !st[o.id]?.wd), async (o) => { const h = await dariWikidata(o); st[o.id] = { ...st[o.id], wd: h ? 'ok' : 'gagal' }; if (h) catat(o, h); }, 4);
  console.log('fase wikidata selesai');
}

// ---------- buang logo generik (sidik sama dipakai >= 4 organisasi) ----------
const sidik = new Map();
for (const [id, x] of Object.entries(st)) if (x.hasil === 'ok' && fs.existsSync(KELUAR + id + '.png')) { const h = crypto.createHash('sha1').update(fs.readFileSync(KELUAR + id + '.png')).digest('hex'); (sidik.get(h) || sidik.set(h, []).get(h)).push(id); }
for (const ids of sidik.values()) if (ids.length >= 4) for (const id of ids) { fs.rmSync(KELUAR + id + '.png', { force: true }); st[id] = { ...st[id], hasil: 'generik' }; }
simpan();

// ---------- SUMBER.md ----------
const nama = new Map(muatOrg().map((o) => [o.id, o.nama]));
const baris = Object.entries(st).filter(([, x]) => x.hasil === 'ok').sort(([a], [b]) => a.localeCompare(b)).map(([id, x]) => `- ${id} | ${nama.get(id) || id} | ${x.metode} | ${x.url_sumber}`);
const bagian = `## Logo organisasi (otomatis)\n\nDiambil oleh scripts/panen/panen_logo.mjs (UA METI, robots.txt dihormati, jeda >= 2 dtk per host). Berkas public/img/logo/org/<org_id>.png; catatan mentah data-panen/logo/logo.jsonl. Logo hanya untuk mengenali organisasi; hak cipta tetap pada pemiliknya. Metode wikidata-p154: logo di Wikimedia Commons.\n\n${baris.join('\n')}\n`;
let md = fs.readFileSync(SUMBER_MD, 'utf8'); const i = md.indexOf('## Logo organisasi (otomatis)');
fs.writeFileSync(SUMBER_MD, (i < 0 ? md.trimEnd() + '\n\n' : md.slice(0, i)) + bagian);
const per = {}; for (const x of Object.values(st)) if (x.hasil === 'ok') per[x.metode] = (per[x.metode] || 0) + 1;
console.log('SELESAI ok =', baris.length, JSON.stringify(per));
