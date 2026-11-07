#!/usr/bin/env node
// Foto asli inovasi: halaman sumber (situs kampus) -> og:image -> unduhan -> public/img/inovasi/<id>.webp (maks 960px) + medan foto_url/foto_kredit/foto_halaman.
//   node scripts/panen/foto_inovasi.mjs --unduh   halaman -> gambar mentah di DIR (+ kandidat.json)
//   node scripts/panen/foto_inovasi.mjs --pasang  kandidat tak ditolak -> webp + inovasi.json (hash unik)
// Sopan: robots.txt per host, jeda >= 2 dtk per host, UA METI, 403/429 = host berhenti. Bukan Antara/medsos; tkdn (sertifikat) dilewati.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { UA, robotsBolehkan } from './berita.mjs';

const AKAR = new URL('../../', import.meta.url).pathname;
const DIR = process.env.FOTO_IN_DIR || AKAR + 'data-panen/inovasi-unduh/';
const JSON_IN = AKAR + 'public/data/inovasi.json', KAND = DIR + 'kandidat.json';
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const TOLAK = /antaranews|linkedin|facebook|instagram|twitter|x\.com|tiktok|youtube|doi\.org|tkdn\.kemenperin/i;
const KREDIT = { 'ipb.ac.id': 'IPB University', 'undip.ac.id': 'Universitas Diponegoro', 'its.ac.id': 'Institut Teknologi Sepuluh Nopember', 'pens.ac.id': 'Politeknik Elektronika Negeri Surabaya' };
const kredit = (h) => KREDIT[h.replace(/^www\./, '')] || null;
const henti = new Set(), terakhir = new Map(), robots = new Map();

async function ambil(url, biner) {
  const h = new URL(url).host; if (henti.has(h)) return null;
  if (!robots.has(h)) { await tidur(2000); try { const r = await fetch(`https://${h}/robots.txt`, { headers: { 'user-agent': UA } }); robots.set(h, r.ok ? await r.text() : ''); } catch { robots.set(h, ''); } }
  const u = new URL(url); if (!robotsBolehkan(robots.get(h), u.pathname + u.search)) return null;
  const w = 2100 - (Date.now() - (terakhir.get(h) || 0)); if (w > 0) await tidur(w);
  terakhir.set(h, Date.now());
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
    if (r.status === 403 || r.status === 429) { henti.add(h); return null; }
    if (!r.ok) return null;
    return biner ? Buffer.from(await r.arrayBuffer()) : await r.text();
  } catch { return null; }
}
const og = (html, dasar) => { const m = html.match(/<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]*>/i) || html.match(/<meta[^>]+content=[^>]*(?:property|name)=["']og:image["'][^>]*>/i); const c = m && m[0].match(/content=["']([^"']+)["']/i); try { return c ? new URL(c[1].replace(/&amp;/g, '&'), dasar).href : null; } catch { return null; } };
const jenis = (b) => b[0] === 0xff && b[1] === 0xd8 ? 'jpg' : b.slice(1, 4).toString() === 'PNG' ? 'png' : b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP' ? 'webp' : null;

const d = JSON.parse(fs.readFileSync(JSON_IN, 'utf8'));
if (process.argv.includes('--unduh')) {
  fs.mkdirSync(DIR, { recursive: true }); const kand = {};
  for (const x of d.inovasi) {
    const hal = (x.sumber || []).map((s) => s.url).find((u) => /^https?:/.test(u) && !TOLAK.test(u)); if (!hal) { kand[x.id] = { alasan: 'sumber bukan halaman artikel (sertifikat TKDN/DOI)' }; continue; }
    let img = x.foto_sumber?.url || null, via = img ? 'foto_sumber' : null;
    if (!img) { const html = await ambil(hal); if (html) { img = og(html, hal); via = 'og:image'; if (!img) { const ym = hal.match(/\/(20\d\d)\/(\d\d)\//); const m = ym && [...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']*\/uploads\/(\d{4})\/(\d\d)\/[^"']+\.(?:jpe?g|png|webp))["']/gi)].find((q) => q[2] === ym[1] && q[3] === ym[2] && !/logo|icon|banner/i.test(q[1])); img = m ? new URL(m[1], hal).href : null; via = 'gambar-artikel'; } } }
    if (!img || TOLAK.test(img)) { kand[x.id] = { alasan: 'tanpa gambar artikel', halaman: hal }; continue; }
    const b = await ambil(img, true), j = b && jenis(b);
    if (!j || b.length < 15000) { kand[x.id] = { alasan: 'unduhan gagal/bukan gambar/terlalu kecil', halaman: hal, img }; continue; }
    const f = `${DIR}${x.id}.${j}`; fs.writeFileSync(f, b);
    kand[x.id] = { halaman: hal, img, via, berkas: f, hash: crypto.createHash('sha1').update(b).digest('hex'), kredit: kredit(new URL(hal).host) };
    console.log(x.id, via, b.length);
  }
  fs.writeFileSync(KAND, JSON.stringify(kand, null, 1));
}
if (process.argv.includes('--pasang')) {
  const kand = JSON.parse(fs.readFileSync(KAND, 'utf8')), lihat = new Set(); fs.mkdirSync(AKAR + 'public/img/inovasi', { recursive: true });
  for (const x of d.inovasi) {
    const k = kand[x.id]; if (!k?.berkas || k.tolak || !k.kredit || lihat.has(k.hash)) { if (k?.berkas) console.log('lewat', x.id, k.tolak ? 'ditolak' : 'hash/kredit'); continue; }
    lihat.add(k.hash);
    execFileSync('cwebp', ['-quiet', '-q', '78', '-resize', '960', '0', k.berkas, '-o', `${AKAR}public/img/inovasi/${x.id}.webp`]);
    x.foto_url = `/img/inovasi/${x.id}.webp`; x.foto_kredit = k.kredit; x.foto_halaman = k.halaman;
  }
  fs.writeFileSync(JSON_IN, JSON.stringify(d));
}
