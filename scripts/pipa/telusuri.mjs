// Telusuri laman resmi sistem data dan skema pendanaan: robots.txt, jeda >= 2 dtk, UA METI, 403/429 = berhenti untuk host itu.
//   node scripts/pipa/telusuri.mjs <tgl>   -> data/sistem_data/telusur.json dan data/pendanaan/telusur.json (hanya fakta yang terbaca dari laman)
// Hasil tiap butir: terjangkau, judul, deskripsi, nama_cocok, lisensi (kutipan pola CC/ODbL), api (tautan), unduhan (<= 3), kontak (halaman kontak), teks (cuplikan untuk dibaca manusia, tidak dipublikasikan).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { robotsMelarang } from './sistem_data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const jeda = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const bersih = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const meta = (h, n) => (h.match(new RegExp(`<meta[^>]+(?:name|property)=["']${n}["'][^>]*content=["']([^"']*)["']`, 'i')) || h.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${n}["']`, 'i')) || [])[1] || '';

export function ekstrak(html, basis, kunci) {
  const judul = bersih((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const teks = bersih(html);
  const ank = [...html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => { let u = null; try { u = new URL(m[1].replace(/&amp;/g, '&'), basis).href; } catch {} return { u, t: bersih(m[2]).slice(0, 70) }; }).filter((a) => a.u && /^https:/.test(a.u));
  const host = new URL(basis).host.replace(/^www\./, '');
  const sama = (a) => new URL(a.u).host.replace(/^www\./, '').endsWith(host.split('.').slice(-2).join('.'));
  const lisensi = (teks.match(/\bCC[ -]BY(?:[- ](?:SA|NC|ND))*(?:[ -]?\d\.\d)?\b|Creative Commons[^.]{0,60}|\bODbL\b|\bCC0\b/i) || [])[0] || null;
  const api = ank.find((a) => sama(a) && (/\bapi\b|developer|swagger|webapi/i.test(a.t) || /\/(api|developer|docs\/api)(\/|$)/i.test(new URL(a.u).pathname)));
  const unduhan = []; for (const a of ank) if (/\.(csv|xlsx?|zip|geojson|json|parquet)(\?|$)/i.test(a.u) && unduhan.length < 3 && !unduhan.some((x) => x.url === a.u)) unduhan.push({ label: a.t || a.u.split('/').pop(), url: a.u });
  const kontak = ank.find((a) => sama(a) && /contact|kontak|hubungi|help|support/i.test(a.t + ' ' + new URL(a.u).pathname));
  const cari = [norm(judul + ' ' + meta(html, 'description') + ' ' + teks.slice(0, 6000))];
  const cocok = kunci.map(norm).filter((k) => k.length >= 3).some((k) => cari[0].includes(k));
  return { judul: judul.slice(0, 160), deskripsi: bersih(meta(html, 'description') || meta(html, 'og:description')).slice(0, 300), nama_cocok: cocok, lisensi, api: api ? api.u : null, unduhan, kontak: kontak ? kontak.u : null, teks: teks.slice(0, 1800) };
}

async function ambilHalaman(u) {
  const r = await fetch(u, { headers: { 'user-agent': UA, accept: 'text/html,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(25000) }).catch(() => null);
  if (!r) return { status: 0 };
  return { status: r.status, html: r.status === 200 && /html|xml/.test(r.headers.get('content-type') || 'html') ? (await r.text().catch(() => '')).slice(0, 400000) : '', url: r.url };
}

async function telusuri(butir, keluar, tgl) {
  const robots = new Map(), henti = new Set(), hasil = {};
  for (const b of butir) {
    const u = new URL(b.url), host = u.host;
    if (henti.has(host)) { hasil[b.id] = { terjangkau: false, catatan: 'berhenti (403/429 pada host ini)', tanggal: tgl }; continue; }
    if (!robots.has(host)) { await jeda(2100); const r = await ambilHalaman(`${u.origin}/robots.txt`); robots.set(host, r.status === 200 && robotsMelarang(r.html) ? 'melarang' : 'boleh'); }
    if (robots.get(host) === 'melarang') { hasil[b.id] = { terjangkau: false, catatan: 'robots.txt melarang; butuh pemilik', tanggal: tgl }; console.log('robots melarang', b.id); continue; }
    await jeda(2100);
    const r = await ambilHalaman(b.url);
    if (r.status === 403 || r.status === 429) { henti.add(host); hasil[b.id] = { terjangkau: false, http: r.status, catatan: 'ditolak server; butuh pemilik', tanggal: tgl }; console.log('BERHENTI', host, r.status); continue; }
    if (!r.html) { hasil[b.id] = { terjangkau: false, http: r.status, catatan: r.status === 0 ? 'tidak terjangkau dari lingkungan ini; butuh pemilik' : 'bukan halaman teks', tanggal: tgl }; console.log(b.id, r.status); continue; }
    hasil[b.id] = { terjangkau: true, http: 200, url_akhir: r.url, tanggal: tgl, ...ekstrak(r.html, r.url, b.kunci) };
    console.log(b.id, 200, hasil[b.id].nama_cocok ? 'cocok' : 'nama tak ditemukan');
  }
  fs.writeFileSync(path.join(ROOT, keluar), JSON.stringify(hasil, null, 1) + '\n', 'utf8');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tgl = process.argv[2];
  if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) { console.log('telusuri.mjs <tgl> [sistem|skema]'); process.exit(1); }
  const baca = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const only = process.argv[3];
  if (!only || only === 'sistem') await telusuri(baca('data/sistem_data/kurasi.json').map((r) => ({ id: r.id, url: r.portal, kunci: [r.nama, r.kep, r.nama.split(' ')[0]].filter(Boolean) })), 'data/sistem_data/telusur.json', tgl);
  if (!only || only === 'skema') await telusuri(baca('data/pendanaan/skema_kurasi.json').map((r) => ({ id: r.id, url: r.url, kunci: [r.pemberi, r.nama] })), 'data/pendanaan/telusur.json', tgl);
}
