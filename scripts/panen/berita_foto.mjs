// Foto sampul berita: URL gambar saja (bukan berkas), dari media:content/thumbnail/enclosure RSS, lalu og:image halaman.
// Pakai: node scripts/panen/berita_foto.mjs [--maks N]. Menulis public/data/berita_foto.json {id: url https}. Gagal = dilewati.
// Sopan: robots.txt dihormati, UA METI, jeda 1,5 s per host, timeout 8 s, 6 host paralel, 403 = host dilewati.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FEEDS, UA, robotsBolehkan, urlKanon } from './berita.mjs';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const BERITA = AKAR + 'public/data/berita.json', KELUAR = AKAR + 'public/data/berita_foto.json';
const maks = +(process.argv[process.argv.indexOf('--maks') + 1]) || 1e9;
const baris = JSON.parse(readFileSync(BERITA, 'utf8')).baris.sort((a, b) => b.terbit.localeCompare(a.terbit));
const peta = existsSync(KELUAR) ? JSON.parse(readFileSync(KELUAR, 'utf8')) : {};
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const lepas = (s) => s.replace(/&amp;/g, '&').replace(/&#x2F;/gi, '/').replace(/&quot;/g, '"');
const https = (u, dasar) => { try { const x = new URL(lepas(u), dasar); x.protocol === 'http:' && (x.protocol = 'https:'); return x.protocol === 'https:' && !/\.(mp3|mp4|svg)(\?|$)/i.test(x.pathname) && x.href.length < 600 ? x.href : ''; } catch { return ''; } };

const terakhir = new Map(), robots = new Map(), blok = new Set();
async function ambil(url, { teks = true, batas = 400000 } = {}) {
  const h = new URL(url).host; if (blok.has(h)) return '';
  const tunggu = (terakhir.get(h) || 0) + 1500 - Date.now(); terakhir.set(h, Math.max(Date.now(), terakhir.get(h) || 0) + 1500); if (tunggu > 0) await tidur(tunggu);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/xml' }, redirect: 'follow', signal: AbortSignal.timeout(8000) });
    if (r.status === 403 || r.status === 429) { blok.add(h); return ''; }
    return r.ok ? (await r.text()).slice(0, batas) : '';
  } catch { return ''; }
}
async function boleh(url) {
  const u = new URL(url);
  if (!robots.has(u.host)) robots.set(u.host, ambil(u.origin + '/robots.txt', { batas: 100000 }));
  return robotsBolehkan(await robots.get(u.host), u.pathname + u.search);
}
const ogImage = (h) => { for (const p of [/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)/i, /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image/i, /<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)/i]) { const m = h.match(p); if (m) return m[1]; } return ''; };

// 1) RSS: gambar dari media:content, media:thumbnail, enclosure
const dariFeed = new Map();
for (const [, url] of FEEDS) {
  try {
    if (!(await boleh(url))) continue;
    for (const m of (await ambil(url)).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
      const b = m[1], link = (b.match(/<link>\s*(?:<!\[CDATA\[)?\s*([^<\s\]]+)/i) || [])[1]; if (!link) continue;
      const g = (b.match(/<media:content[^>]+url=["']([^"']+)/i) || b.match(/<media:thumbnail[^>]+url=["']([^"']+)/i) || b.match(/<enclosure[^>]+url=["']([^"']+)/i) || [])[1];
      const u = g && https(g, link); if (u) dariFeed.set(urlKanon(link), u);
    }
  } catch { /* lewati */ }
}
let dariRss = 0;
for (const a of baris) { const u = dariFeed.get(urlKanon(a.url)); if (u) { peta[a.id] = u; dariRss++; } }

// 2) og:image untuk sisanya, terbaru dulu, paralel antar host
const sisa = baris.filter((a) => !peta[a.id]).slice(0, maks); let og = 0, i = 0, tulis = 0;
async function kerja() {
  while (i < sisa.length) {
    const a = sisa[i++];
    try {
      if (!/^https:/.test(a.url) || !(await boleh(a.url))) continue;
      const u = https(ogImage(await ambil(a.url)), a.url); if (u) { peta[a.id] = u; og++; }
    } catch { /* lewati */ }
    if (++tulis % 25 === 0) writeFileSync(KELUAR, JSON.stringify(peta));
  }
}
await Promise.all(Array.from({ length: 6 }, kerja));
// Pangkas: hanya host dengan >= 3 foto (muat di batas 2000 karakter satu baris _headers; img-src daftar host eksplisit, bukan https:).
const hitung = {}; for (const u of Object.values(peta)) { const h = new URL(u).host; hitung[h] = (hitung[h] || 0) + 1; }
for (const [id, u] of Object.entries(peta)) if (hitung[new URL(u).host] < 3) delete peta[id];
const hosts = Object.keys(hitung).filter((h) => hitung[h] >= 3).sort();
writeFileSync(KELUAR, JSON.stringify(peta));
console.log('img-src host:', hosts.map((h) => 'https://' + h).join(' '));
console.log(`foto: ${Object.keys(peta).length} dari ${baris.length} (rss ${dariRss}, og ${og}); host diblok ${[...blok].join(',') || '-'}`);
