#!/usr/bin/env node
// Penjajak daftar kawasan industri Kemenperin (SIINas) untuk menambah public/data/kawasan.json.
//   node scripts/panen/kawasan_industri.mjs <dirMentah>   (jaringan; cek robots, jeda 2 dtk, berhenti di 403/429)
// 8 Nov 2026: kemenperin.go.id membalas 502 dan siinas.kemenperin.go.id tidak terjangkau, jadi belum ada yang disimpan.
// Bila terbaca, HTML mentah disimpan ke <dirMentah> untuk diurai manual; skrip ini tidak menebak isi.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
export const TARGET = [
  { id: 'kemenperin-kawasan', url: 'https://www.kemenperin.go.id/kawasan-industri', robots: 'https://www.kemenperin.go.id/robots.txt' },
  { id: 'siinas-kawasan', url: 'https://siinas.kemenperin.go.id/kawasan', robots: 'https://siinas.kemenperin.go.id/robots.txt' },
];
export const dilarang = (robots, jalur) => { // robots.txt: aturan User-agent: * saja; Disallow terpanjang yang cocok
  let ber = false; const d = [];
  for (const g of String(robots).split(/\r?\n/)) {
    const m = g.match(/^\s*([A-Za-z-]+)\s*:\s*(.*?)\s*$/); if (!m) continue;
    if (/^user-agent$/i.test(m[1])) ber = m[2] === '*'; else if (ber && /^disallow$/i.test(m[1]) && m[2]) d.push(m[2]);
  }
  return d.some((p) => jalur.startsWith(p));
};
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
async function ambil(dir) {
  fs.mkdirSync(dir, { recursive: true }); const hasil = [];
  for (const t of TARGET) {
    try {
      const rb = await fetch(t.robots, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
      if (rb.ok && dilarang(await rb.text(), new URL(t.url).pathname)) { hasil.push([t.id, 'robots melarang']); continue; }
      await tunggu(2000);
      const r = await fetch(t.url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      if (r.status === 403 || r.status === 429) { hasil.push([t.id, 'HTTP ' + r.status + ', berhenti']); break; }
      if (!r.ok) { hasil.push([t.id, 'HTTP ' + r.status]); continue; }
      fs.writeFileSync(path.join(dir, t.id + '.html'), await r.text()); hasil.push([t.id, 'tersimpan']);
    } catch (e) { hasil.push([t.id, 'tak terjangkau: ' + (e.cause?.code || e.message)]); }
    await tunggu(2000);
  }
  for (const [i, s] of hasil) console.log(i, s);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) { if (!process.argv[2]) console.log('pakai: <dirMentah>'); else await ambil(process.argv[2]); }
