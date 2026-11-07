// Panen daftar PSN resmi: lampiran Permenko Perekonomian 16/2025 (Perubahan Kedelapan atas Permenko 7/2021), salinan JDIH BPK.
//   node scripts/panen/psn_permenko.mjs <dirUnduh>   -> <dirUnduh>/p16.pdf, lalu data/psn/permenko-16-2025.txt (pdftotext -layout)
// Aturan panen: UA proyek, robots.txt dibaca dulu (peraturan.bpk.go.id Disallow hanya /Admin /Identity /Account /Manage /health /Error), jeda >= 2 dtk, berhenti pada 403/429, tanpa login.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const HALAMAN = 'https://peraturan.bpk.go.id/Details/330372/permenko-perekonomian-no-16-tahun-2025';
const PDF = 'https://peraturan.bpk.go.id/Download/392383/2025PermenkoEkon016.pdf';
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

async function ambil(url, bin) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (r.status === 403 || r.status === 429) throw new Error(`berhenti: ${r.status} ${url}`);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return bin ? Buffer.from(await r.arrayBuffer()) : r.text();
}

export async function jalankan(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const robots = await ambil('https://peraturan.bpk.go.id/robots.txt');
  if (/Disallow:\s*\/Download/i.test(robots)) throw new Error('robots melarang /Download');
  await tidur(2200);
  await ambil(HALAMAN); // memastikan halaman rinci ada (tautan unduh dibaca dari sana)
  await tidur(2200);
  const buf = await ambil(PDF, true);
  const pdf = path.join(dir, 'p16.pdf');
  fs.writeFileSync(pdf, buf);
  const teks = execFileSync('pdftotext', ['-layout', pdf, '-'], { maxBuffer: 1 << 26 }).toString('utf8');
  fs.writeFileSync(path.join(ROOT, 'data/psn/permenko-16-2025.txt'), teks);
  return teks.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) { console.error('pakai: node scripts/panen/psn_permenko.mjs <dirUnduh>'); process.exit(2); }
  console.log('teks:', await jalankan(dir), 'karakter');
}
