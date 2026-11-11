#!/usr/bin/env node
// K21 / JM-S04: buang rujukan Antara dari semua JSON terlacak di public/data dan data/. Idempotent.
//   node scripts/pipa/buang_antara.mjs [--kering]    (--kering: hanya hitung)
// Aturan: (1) elemen array berupa objek yang MEMILIKI medan skalar Antara (host antaranews.com, atau nilai persis "Antara"/"ANTARA") dibuang;
// (2) string URL Antara di array string dibuang; (3) objek bernilai-properti yang memilikinya dihapus dari induknya;
// (4) objek yang merujuk sumber_id/sumber yang baru dibuang ikut dibuang; (5) teks bebas: kurung "(ANTARA ...)" dibuang, "berita Antara" jadi "media".
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const HOST = /antaranews\.com/i;
export const NAMA = /^\s*(LKBN\s+)?antara(\s+news)?\s*$/i;
export const adaAntara = (s) => typeof s === 'string' && (HOST.test(s) || NAMA.test(s));
const PEMICU = /^(berita|artikel|foto|laporan|kutipan|menurut|via|dari|oleh)$/i;

export function scrubTeks(s) {
  if (typeof s !== 'string') return s;
  let t = s.replace(/\s*\((?:[^()]*\b)?ANTARA\b[^()]*\)/g, '').replace(/\s*\([^()]*antaranews[^()]*\)/gi, '');
  t = t.replace(/\b(berita|artikel|foto|laporan|kutipan|menurut|via|dari|oleh) Antara\b(?!\s+(Pemerintah|Negara|Uni|Majelis|Pertamina|Kementerian|lain))/gi, '$1 media');
  t = t.replace(/\bANTARA\b/g, 'media').replace(/https?:\/\/(?:[a-z]+\.)?antaranews\.com[^\s"')]*/gi, '');
  return t;
}
const REF = new Set(['sumber', 'sumber_ids', 'sumber_id', 'rujuk', 'ref', 'refs', 'src']);
const punyaSendiri = (o) => Object.values(o).some(adaAntara);

export function bersih(akar) {
  const dibuang = new Set(), stat = { elemen: 0, teks: 0 };
  // Putaran 1: buang elemen/properti berpenanda Antara; catat id-nya.
  const p1 = (n) => {
    if (Array.isArray(n)) {
      const lama = n.length, keluar = [];
      const sisa = n.filter((e) => {
        if (adaAntara(e)) { keluar.push(e); return false; }
        if (e && typeof e === 'object' && !Array.isArray(e) && punyaSendiri(e)) { keluar.push(e); return false; }
        return true;
      });
      for (const e of keluar) { stat.elemen++; if (e && typeof e === 'object') for (const k of ['id', 'sumber_id']) if (typeof e[k] === 'string') dibuang.add(e[k]); }
      if (sisa.length !== lama) { n.length = 0; n.push(...sisa); }
      n.forEach(p1); return;
    }
    if (n && typeof n === 'object') {
      for (const [k, v] of Object.entries(n)) {
        if (v && typeof v === 'object' && !Array.isArray(v) && punyaSendiri(v)) { delete n[k]; dibuang.add(k); if (typeof v.id === 'string') dibuang.add(v.id); stat.elemen++; continue; }
        if (adaAntara(v) && !NAMA.test(v)) { n[k] = null; stat.elemen++; continue; }   // properti skalar URL Antara -> null
        p1(v);
      }
    }
  };
  p1(akar);
  // Putaran 2: objek yang merujuk id sumber yang dibuang ikut dibuang (kecuali daftar sumber itu sendiri).
  const p2 = (n) => {
    if (Array.isArray(n)) {
      const sisa = n.filter((e) => !(e && typeof e === 'object' && !Array.isArray(e) && ['sumber_id'].some((k) => dibuang.has(e[k]))));
      if (sisa.length !== n.length) { stat.elemen += n.length - sisa.length; n.length = 0; n.push(...sisa); }
      n.forEach(p2); return;
    }
    if (n && typeof n === 'object') {
      for (const [k, v] of Object.entries(n)) {
        if (Array.isArray(v) && REF.has(k)) n[k] = v.filter((x) => typeof x !== 'string' || !dibuang.has(x));
        else if (typeof v === 'string' && REF.has(k) && dibuang.has(v)) { delete n[k]; stat.elemen++; continue; }
        p2(n[k]);
      }
    }
  };
  if (dibuang.size) p2(akar);
  // Putaran 3: teks bebas + sinkron jumlah.
  const p3 = (n) => {
    if (Array.isArray(n)) { for (let i = 0; i < n.length; i++) { if (typeof n[i] === 'string') { const t = scrubTeks(n[i]); if (t !== n[i]) { n[i] = t; stat.teks++; } } else p3(n[i]); } return; }
    if (n && typeof n === 'object') {
      for (const [k, v] of Object.entries(n)) {
        if (typeof v === 'string') { const t = scrubTeks(v); if (t !== v) { n[k] = t; stat.teks++; } } else p3(v);
      }
      if (Array.isArray(n.baris) && typeof n.jumlah === 'number' && n.jumlah !== n.baris.length && n._lama === undefined) n.jumlah = n.baris.length;
    }
  };
  p3(akar);
  return { akar, stat, dibuang };
}

// Pembungkus untuk pembangun data: panggil pada keluaran susun()/bangun() supaya keluaran skrip sama dengan berkas yang sudah dibersihkan.
export const tanpaAntara = (obj) => bersih(JSON.parse(JSON.stringify(obj))).akar;

export function berkasTerlacak(akar) {
  return execFileSync('git', ['ls-files', 'public/data', 'data'], { cwd: akar, encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n').filter((f) => /\.(json|geojson)$/.test(f));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const AKAR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..'), kering = process.argv.includes('--kering');
  let n = 0;
  for (const f of berkasTerlacak(AKAR)) {
    const p = path.join(AKAR, f), mentah = fs.readFileSync(p, 'utf8');
    if (!/antaranews|antara/i.test(mentah)) continue;
    const d = JSON.parse(mentah), { akar, stat } = bersih(d);
    const baru = JSON.stringify(akar) + (mentah.endsWith('\n') ? '\n' : '');
    if (baru === mentah.replace(/\n(?=.)/g, '\n') || JSON.stringify(JSON.parse(mentah)) + (mentah.endsWith('\n') ? '\n' : '') === baru) continue;
    n++; console.log(f, JSON.stringify(stat));
    if (!kering) fs.writeFileSync(p, baru);
  }
  console.log(n, 'berkas', kering ? '(kering)' : 'ditulis');
}
