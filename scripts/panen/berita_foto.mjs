// Foto sampul berita: URL gambar saja (bukan berkas), dari media:content/thumbnail/enclosure RSS, lalu og:image halaman.
// Pakai: node scripts/panen/berita_foto.mjs [--maks N]. Menulis public/data/berita_foto.json {id: url https}. Gagal = dilewati.
// Sopan: robots.txt dihormati, UA METI, jeda 2 s per host, timeout 8 s, 6 host paralel, 403 = host dilewati.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FEEDS, UA, robotsBolehkan, urlKanon } from './berita.mjs';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const BERITA = AKAR + 'public/data/berita.json', KELUAR = AKAR + 'public/data/berita_foto.json';
const maks = +(process.argv[process.argv.indexOf('--maks') + 1]) || 1e9;
const baris = JSON.parse(readFileSync(BERITA, 'utf8')).baris.sort((a, b) => b.terbit.localeCompare(a.terbit));
// Ringkasan (og:description / description RSS) HANYA untuk pencocokan wilayah dan regulasi; disimpan di data-panen (di luar repo), tidak pernah ke public.
const RINGKAS = AKAR + 'data-panen/berita/ringkas.json';
const ringkas = existsSync(RINGKAS) ? JSON.parse(readFileSync(RINGKAS, 'utf8')) : {};
const peta = existsSync(KELUAR) ? JSON.parse(readFileSync(KELUAR, 'utf8')) : {};
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const lepas = (s) => s.replace(/&amp;/g, '&').replace(/&#x2F;/gi, '/').replace(/&quot;/g, '"');
const https = (u, dasar) => { try { const x = new URL(lepas(u), dasar); x.protocol === 'http:' && (x.protocol = 'https:'); return x.protocol === 'https:' && !/\.(mp3|mp4|svg)(\?|$)/i.test(x.pathname) && x.href.length < 600 ? x.href : ''; } catch { return ''; } };

const terakhir = new Map(), robots = new Map(), blok = new Set();
async function ambil(url, { teks = true, batas = 400000 } = {}) {
  const h = new URL(url).host; if (blok.has(h)) return '';
  const tunggu = (terakhir.get(h) || 0) + 2000 - Date.now(); terakhir.set(h, Math.max(Date.now(), terakhir.get(h) || 0) + 2000); if (tunggu > 0) await tidur(tunggu);
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
const deskripsi = (h) => { for (const p of [/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']*)/i, /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description/i, /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)/i, /<meta[^>]+name=["']twitter:description["'][^>]*content=["']([^"']*)/i]) { const m = h.match(p); if (m && m[1].trim()) return lepas(m[1]).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&(nbsp|apos);/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600); } return ''; };
const ogImage = (h) => { for (const p of [/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)/i, /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image/i, /<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)/i]) { const m = h.match(p); if (m) return m[1]; } return ''; };

// 1) RSS: gambar dari media:content, media:thumbnail, enclosure
const dariFeed = new Map(), dariDesk = new Map();
for (const [, url] of FEEDS) {
  try {
    if (!(await boleh(url))) continue;
    for (const m of (await ambil(url)).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
      const b = m[1], link = (b.match(/<link>\s*(?:<!\[CDATA\[)?\s*([^<\s\]]+)/i) || [])[1]; if (!link) continue;
      const g = (b.match(/<media:content[^>]+url=["']([^"']+)/i) || b.match(/<media:thumbnail[^>]+url=["']([^"']+)/i) || b.match(/<enclosure[^>]+url=["']([^"']+)/i) || [])[1];
      const u = g && https(g, link); if (u) dariFeed.set(urlKanon(link), u);
      const d = (b.match(/<description>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/description>/i) || [])[1]; if (d) dariDesk.set(urlKanon(link), lepas(d.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 600));
    }
  } catch { /* lewati */ }
}
let dariRss = 0;
for (const a of baris) { const u = dariFeed.get(urlKanon(a.url)); if (u) { peta[a.id] = u; dariRss++; } const d = dariDesk.get(urlKanon(a.url)); if (d) ringkas[a.id] = d; }

// 2) og:image untuk sisanya, terbaru dulu, paralel antar host
const sisa = baris.filter((a) => !peta[a.id] || !(a.id in ringkas)).slice(0, maks); let og = 0, i = 0, tulis = 0;
async function kerja() {
  while (i < sisa.length) {
    const a = sisa[i++];
    try {
      if (!/^https:/.test(a.url) || !(await boleh(a.url))) continue;
      const h = await ambil(a.url); const u = peta[a.id] ? '' : https(ogImage(h), a.url); if (u) { peta[a.id] = u; og++; } if (!(a.id in ringkas)) ringkas[a.id] = deskripsi(h);
    } catch { /* lewati */ }
    if (++tulis % 25 === 0) { writeFileSync(KELUAR, JSON.stringify(peta)); mkdirSync(AKAR + 'data-panen/berita', { recursive: true }); writeFileSync(RINGKAS, JSON.stringify(ringkas)); }
  }
}
await Promise.all(Array.from({ length: 6 }, kerja));
// Hanya https, host bernama (bukan IP/localhost/port). Host foto -> img-src di public/_headers (diperbarui di bawah).
const layak = (u) => { try { const x = new URL(u); return x.protocol === 'https:' && !x.port && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(x.hostname) && !/^\d+(\.\d+)+$/.test(x.hostname); } catch { return false; } };
for (const [id, u] of Object.entries(peta)) if (!layak(u)) delete peta[id];
// Foto dilayani Worker (GET /api/foto-berita/:id): CSP img-src cukup 'self', tanpa daftar host.
writeFileSync(KELUAR, JSON.stringify(peta));
mkdirSync(AKAR + 'data-panen/berita', { recursive: true }); writeFileSync(RINGKAS, JSON.stringify(ringkas));
console.log(`foto: ${Object.keys(peta).length} dari ${baris.length} (rss ${dariRss}, og ${og}); host diblok ${[...blok].join(',') || '-'}`);
