#!/usr/bin/env node
// Panen sertifikat TKDN Kemenperin untuk komponen 7 teknologi di luar surya -> data-panen/rantai/tkdn/<slug>-<hal>.json (dapat dilanjutkan).
//   node scripts/pipa/rantai_teknologi_panen.mjs --ambil [--hanya=kata]   |   --selftest
// Cara sama dengan panen_keuangan.mjs --tkdn (parseTkdn dipakai ulang): /sertifikat?q=, robots dicek, jeda >= 2 dtk, UA METI, 403 = berhenti.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ambil } from './_panen_sopan.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const RAW = path.join(ROOT, 'data-panen/rantai/tkdn');
const TGL = process.env.TGL_PANEN || '2026-11-08';
// [kata kunci, halaman maks]. Hasil terurut nilai TKDN menurun; satu perusahaan sering berulang, jadi halaman dibatasi.
export const KUERI = [
  ['bilah turbin angin', 3], ['menara turbin angin', 2], ['wind turbine', 3], ['generator turbin angin', 2], ['nacelle', 2], ['gearbox', 3], ['pitch', 2],
  ['turbin air', 6], ['turbin pelton', 2], ['turbin kaplan', 2], ['turbin francis', 2], ['crossflow', 3], ['pipa pesat', 3], ['penstock', 3], ['governor', 2], ['generator sinkron', 4], ['guide vane', 2], ['katup', 4], ['valve', 4],
  ['panas bumi', 4], ['geothermal', 4], ['wellhead', 3], ['separator', 3], ['turbin uap', 5], ['demister', 2], ['cooling tower', 3], ['heat exchanger', 3], ['pipa baja', 4],
  ['boiler', 5], ['gasifikasi', 3], ['gasifier', 3], ['biogas', 4], ['digester', 3], ['biomassa', 4], ['pellet', 3], ['steam turbine', 3], ['ketel uap', 3],
  ['baterai lithium', 8], ['sel baterai', 4], ['battery energy storage', 4], ['battery management system', 3], ['pack baterai', 4], ['lifepo4', 4], ['baterai', 8], ['lithium ion', 4], ['power conversion system', 3],
  ['elektroliser', 3], ['electrolyzer', 3], ['hidrogen', 3], ['tangki bertekanan', 4], ['tabung gas', 3], ['pressure vessel', 3], ['bejana tekan', 3], ['kompresor', 3],
  ['transformator', 8], ['trafo distribusi', 8], ['trafo daya', 4], ['kabel', 8], ['kabel tegangan menengah', 8], ['kabel twisted', 6], ['kabel tanah', 4], ['konduktor', 4], ['inverter', 8], ['panel listrik', 8], ['switchgear', 5], ['recloser', 3], ['arrester', 3], ['isolator', 4], ['tiang', 5], ['kwh meter', 4], ['gardu', 4], ['busbar', 3], ['mccb', 2],
  ['cihanjuang', 3], ['boma bisma indra', 3], ['barata indonesia', 3], ['bukaka', 3], ['len industri', 3], ['pindad', 3], ['wijaya karya', 3], ['rekayasa industri', 3], ['trafo unindo', 3], ['sumi indo kabel', 3], ['supreme cable', 3], ['kabelindo', 3], ['sucaco', 3], ['voksel', 3], ['jembo', 3], ['gunanusa', 3], ['dirgantara indonesia', 3], ['krakatau engineering', 3], ['inka', 3], ['pal indonesia', 3], ['hyundai', 3], ['hli green power', 3], ['pertamina', 3], ['medco', 3], ['sinar mas', 3], ['tbea', 3], ['schneider', 3], ['abb', 3], ['siemens', 3], ['ge vernova', 3], ['hitachi energy', 3], ['mitsubishi', 3], ['toshiba', 3], ['wasa mitra', 3], ['pura barutama', 3], ['sky energi', 3], ['turbin', 3], ['generator', 3], ['pembangkit', 3], ['energi terbarukan', 3], ['pltmh', 3], ['pltb', 3], ['plts', 3], ['pltp', 3], ['pltbm', 3], ['biomassa', 3], ['hydrogen', 3],
  ['transformator 100 kva', 4], ['transformator 250 kva', 4], ['transformator 630 kva', 4], ['trafo 1600 kva', 4], ['transformator dry type', 4], ['cast resin', 4], ['trafo tiang', 4], ['transformator daya 60 mva', 4], ['kabel nyy', 4], ['kabel nym', 4], ['kabel nfa2x', 4], ['kabel acsr', 4], ['kabel xlpe', 4], ['kabel kontrol', 4], ['kabel tahan api', 4], ['kabel aluminium', 4], ['kabel tembaga', 4], ['kabel fleksibel', 4], ['kabel serat optik', 4], ['panel lvmdp', 4], ['panel mdp', 4], ['panel surya hybrid', 4], ['battery pack lifepo4', 4], ['ess lithium', 4], ['bess', 4], ['ups', 4], ['baterai lifepo4 lithium', 4], ['baterai ion lithium sistem penyimpanan', 4],
];
export const slug = (q) => q.replace(/\W+/g, '-').toLowerCase();

async function cmdAmbil(hanya) {
  const { parseTkdn } = await import('../panen/panen_keuangan.mjs');
  fs.mkdirSync(RAW, { recursive: true });
  for (const [q, maks] of KUERI) {
    if (hanya && !q.includes(hanya)) continue;
    for (let p = 1; p <= maks; p++) {
      const f = path.join(RAW, `${slug(q)}-${p}.json`);
      if (fs.existsSync(f)) { if (JSON.parse(fs.readFileSync(f, 'utf8')).rows.length < 10) break; continue; }
      const url = `https://tkdn.kemenperin.go.id/sertifikat?q=${encodeURIComponent(q)}${p > 1 ? '&page=' + p : ''}`;
      let html; try { html = await ambil(url); } catch (e) { console.log('GAGAL', url, e.message); if (/403/.test(e.message)) process.exit(2); break; }
      const r = parseTkdn(html);
      fs.writeFileSync(f, JSON.stringify({ url, kueri: q, halaman: p, tanggal: TGL, ...r }));
      console.log(q, p, r.rows.length, 'dari', r.total);
      if (r.rows.length < 10) break;
    }
  }
}
function selftest() {
  assert.ok(KUERI.every(([q, n]) => q && n > 0));
  assert.equal(slug('Turbin Air!'), 'turbin-air-');
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv[2];
  if (a === '--selftest') selftest();
  else if (a === '--ambil') await cmdAmbil((process.argv.find((x) => x.startsWith('--hanya=')) || '').slice(8));
  else console.log('pakai: --ambil [--hanya=kata] | --selftest');
}
