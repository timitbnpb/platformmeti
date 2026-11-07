// Pembantu bersama panen C: angka format Indonesia, kode provinsi BPS, halaman PDF (pdftotext), UA/jeda sopan.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const AKAR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
export const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
export const TANGGAL = (process.argv.find(a => a.startsWith('--tanggal=')) || '--tanggal=2026-11-07').slice(10);
export const tidur = ms => new Promise(r => setTimeout(r, ms));

export const norma = s => String(s).toLowerCase().replace(/[^a-z]/g, '').replace(/^diy/, 'diy');
export const kodeProvinsi = (() => {
  const REF = process.env.REPO_REF || AKAR; // baca saja
  const ada = f => fs.existsSync(path.join(AKAR, f)) ? path.join(AKAR, f) : path.join(REF, f);
  const w = JSON.parse(fs.readFileSync(ada('public/data/wilayah.json'), 'utf-8')).baris;
  const m = new Map(w.map(b => [norma(b.nama), { kode: b.kode, nama: b.nama }]));
  return nama => m.get(norma(nama)) || null;
})();

// "3.946,11" -> 3946.11 ; "6.500" -> 6500 ; "-" -> 0 ; tak terbaca -> NaN
export function angka(t) {
  if (t === '-') return 0;
  if (!/^-?[\d.]+(,\d+)?$/.test(t)) return NaN;
  return Number(t.replace(/\./g, '').replace(',', '.'));
}

export function halamanPdf(pdf, h) {
  return execFileSync('pdftotext', ['-f', String(h), '-l', String(h), '-layout', pdf, '-'], { encoding: 'utf-8', maxBuffer: 1 << 26 });
}

// baris "no  Nama Provinsi  v1 v2 ..." -> [{nama, nilai:[...]}] ; nama berhenti di token pertama yang '-' atau angka
export function barisTabel(teks, jumlahNilai) {
  const keluar = [];
  for (const g of teks.split('\n')) {
    const t = g.trim().split(/\s+/);
    if (!/^\d{1,2}$/.test(t[0] || '')) continue;
    let i = 1; const nama = [];
    while (i < t.length && !/^(-|-?\d[\d.,]*)$/.test(t[i])) nama.push(t[i++]);
    const nilai = t.slice(i).filter(x => !/^[A-Za-z]+$/.test(x)).map(angka); // buang satuan nyasar (mis. 'MVA')
    if (!nama.length || nilai.length !== jumlahNilai || nilai.some(Number.isNaN)) continue;
    keluar.push({ nama: nama.join(' '), nilai });
  }
  return keluar;
}

export function tulis(berkas, objek) {
  fs.mkdirSync(path.dirname(berkas), { recursive: true });
  fs.writeFileSync(berkas, JSON.stringify(objek, null, 1) + '\n', 'utf-8');
}

export async function ambilJson(url, coba = 0) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(90000) });
  if (r.status === 403) throw new Error('403 berhenti total: ' + url);
  if (r.status === 429) { const e = new Error('429 ' + url); e.retryAfter = Number(r.headers.get('retry-after')) || 0; throw e; }
  if (r.status >= 500 && coba < 1) { await tidur(5000); return ambilJson(url, coba + 1); }
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  await tidur(2000);
  return r.json();
}

export const bacaRef = f => {
  const REF = process.env.REPO_REF || AKAR;
  const a = path.join(AKAR, f);
  return JSON.parse(fs.readFileSync(fs.existsSync(a) ? a : path.join(REF, f), 'utf-8'));
};
