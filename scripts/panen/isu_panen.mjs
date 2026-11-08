// Panen halaman sumber isu (data/isu/*.json) ke folder kerja untuk dibaca ulang: UA tetap, robots.txt, jeda >= 2 detik,
// berhenti per host saat 403/429, tanpa login/medsos/Antara. Bawaan tanpa jaringan; tambah --jalan untuk benar-benar mengambil.
// Pakai: node scripts/panen/isu_panen.mjs --jalan --keluar <folder> [--maks N]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { UA, JEDA_MS, hostBoleh, urajRobots, HENTI } from './isu_panen_lib.mjs';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = (k) => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1] ?? true; };
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

export function daftarUrl() {
  const url = new Set();
  for (const f of ['nasional', 'daerah']) {
    const d = JSON.parse(fs.readFileSync(path.join(AKAR, 'data/isu', f + '.json'), 'utf8'));
    for (const i of d.isu) for (const s of i.sumber) if (hostBoleh(s.u)) url.add(s.u);
  }
  return [...url];
}

async function utama() {
  const daftar = daftarUrl(), maks = +(arg('--maks') || daftar.length);
  if (!arg('--jalan')) { console.log(`${daftar.length} URL layak panen (kering; tambah --jalan).`); return; }
  const keluar = arg('--keluar'); if (!keluar || keluar === true) throw new Error('--keluar <folder> wajib');
  fs.mkdirSync(keluar, { recursive: true });
  const robots = new Map(), henti = new Set(), terakhir = new Map(), log = [];
  for (const url of daftar.slice(0, maks)) {
    const u = new URL(url);
    if (henti.has(u.host)) { log.push({ url, hasil: 'dilewati-host-berhenti' }); continue; }
    if (!robots.has(u.host)) {
      const r = await fetch(u.origin + '/robots.txt', { headers: { 'user-agent': UA } }).catch(() => null);
      robots.set(u.host, r && r.ok ? urajRobots(await r.text()) : () => true);
      await tidur(JEDA_MS);
    }
    if (!robots.get(u.host)(u.pathname + u.search)) { log.push({ url, hasil: 'ditolak-robots' }); continue; }
    const tunggu = JEDA_MS - (Date.now() - (terakhir.get(u.host) || 0)); if (tunggu > 0) await tidur(tunggu);
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, redirect: 'follow' }).catch((e) => ({ status: 0, galat: String(e) }));
    terakhir.set(u.host, Date.now());
    if (HENTI.has(r.status)) { henti.add(u.host); log.push({ url, hasil: 'berhenti-' + r.status }); continue; }
    if (!r.ok) { log.push({ url, hasil: 'galat-' + r.status }); continue; }
    const nama = crypto.createHash('sha1').update(url).digest('hex').slice(0, 12) + '.html';
    fs.writeFileSync(path.join(keluar, nama), await r.text());
    log.push({ url, hasil: 'ok', berkas: nama });
  }
  fs.writeFileSync(path.join(keluar, 'log.json'), JSON.stringify(log, null, 1));
  console.log(log.map((l) => l.hasil).reduce((a, h) => ((a[h] = (a[h] || 0) + 1), a), {}));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await utama();
