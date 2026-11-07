#!/usr/bin/env node
// Logo kampus -> public/img/logo/kampus/<slug>.png + public/data/logo_kampus.json (pemetaan nama Indonesia/Inggris OpenAlex -> logo).
//   node scripts/panen/logo_kampus.mjs --selftest | --jalan
// Urutan: Wikidata P154 (hanya png/svg, tembus pandang) lewat Commons; sisanya ikon resmi situs lewat panen_logo.mjs --daftar (robots, jeda 2 dtk).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { UA } from './berita.mjs';
import { ambil } from './foto_pakar.mjs';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const OUT = AKAR + 'public/img/logo/kampus/', PETA = AKAR + 'public/data/logo_kampus.json', SUMBER = AKAR + 'public/img/logo/SUMBER.md';
// slug: [nama pendek, nama lengkap, alias Inggris OpenAlex (selain nama lengkap), QID Wikidata, situs resmi]
export const KAMPUS = {
  um: ['UM', 'Universitas Negeri Malang', ['State University of Malang'], 'Q4250919', 'https://um.ac.id'],
  uns: ['UNS', 'Universitas Sebelas Maret', ['Sebelas Maret University'], 'Q7442749', 'https://uns.ac.id'],
  itb: ['ITB', 'Institut Teknologi Bandung', ['Bandung Institute of Technology'], 'Q1579397', 'https://itb.ac.id'],
  undip: ['Undip', 'Universitas Diponegoro', ['Diponegoro University'], 'Q4200627', 'https://undip.ac.id'],
  unri: ['Unri', 'Universitas Riau', ['Riau University'], 'Q7322177', 'https://unri.ac.id'],
  ugm: ['UGM', 'Universitas Gadjah Mada', ['Gadjah Mada University'], 'Q1145992', 'https://ugm.ac.id'],
  its: ['ITS', 'Institut Teknologi Sepuluh Nopember', ['Sepuluh Nopember Institute of Technology'], 'Q7452397', 'https://its.ac.id'],
  usk: ['USK', 'Universitas Syiah Kuala', ['Syiah Kuala University'], 'Q3958218', 'https://usk.ac.id'],
  usu: ['USU', 'Universitas Sumatera Utara', ['University of North Sumatra', 'North Sumatra University'], 'Q4200341', 'https://usu.ac.id'],
  ui: ['UI', 'Universitas Indonesia', ['University of Indonesia'], 'Q534515', 'https://ui.ac.id'],
  ub: ['UB', 'Universitas Brawijaya', ['Brawijaya University', 'University of Brawijaya'], 'Q1336952', 'https://ub.ac.id'],
  ipb: ['IPB', 'Institut Pertanian Bogor', ['IPB University', 'Bogor Agricultural University'], 'Q2306715', 'https://ipb.ac.id'],
  unand: ['Unand', 'Universitas Andalas', ['Andalas University'], 'Q280361', 'https://unand.ac.id'],
  unud: ['Unud', 'Universitas Udayana', ['Udayana University'], 'Q1573634', 'https://unud.ac.id'],
  unej: ['Unej', 'Universitas Jember', ['Jember University', 'University of Jember'], 'Q13098258', 'https://unej.ac.id'],
  unair: ['Unair', 'Universitas Airlangga', ['Airlangga University'], 'Q1494353', 'https://unair.ac.id'],
  polinema: ['Polinema', 'Politeknik Negeri Malang', ['State Polytechnic of Malang'], 'Q15292698', 'https://polinema.ac.id'],
  upi: ['UPI', 'Universitas Pendidikan Indonesia', ['Indonesia University of Education'], 'Q3213529', 'https://upi.edu'],
  unila: ['Unila', 'Universitas Lampung', ['Lampung University'], 'Q6482697', 'https://unila.ac.id'],
  unsri: ['Unsri', 'Universitas Sriwijaya', ['Sriwijaya University'], 'Q4200297', 'https://unsri.ac.id'],
  telkom: ['Telkom University', 'Universitas Telkom', ['Telkom University'], 'Q15057698', 'https://telkomuniversity.ac.id'],
  unhas: ['Unhas', 'Universitas Hasanuddin', ['Hasanuddin University'], 'Q478044', 'https://unhas.ac.id'],
  unnes: ['Unnes', 'Universitas Negeri Semarang', ['State University of Semarang', 'Semarang State University'], 'Q7603641', 'https://unnes.ac.id'],
  unpad: ['Unpad', 'Universitas Padjadjaran', ['Padjadjaran University'], 'Q3181122', 'https://unpad.ac.id'],
  unp: ['UNP', 'Universitas Negeri Padang', ['Padang State University', 'State University of Padang'], 'Q7603634', 'https://unp.ac.id'],
};
export const peta = (ada) => Object.fromEntries(Object.entries(KAMPUS).filter(([s]) => ada.has(s)).map(([s, [pendek, lengkap, alias]]) => [s, { nama: pendek, lengkap, alias, logo: `/img/logo/kampus/${s}.png` }]));

async function p154(qid) {
  const j = JSON.parse(await ambil(`https://www.wikidata.org/w/api.php?format=json&action=wbgetentities&props=claims&ids=${qid}`) || '{}');
  const f = j.entities?.[qid]?.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
  return f && /\.(png|svg)$/i.test(f) ? f : null;
}
async function main() {
  fs.mkdirSync(OUT, { recursive: true }); const sumber = [], sisa = [];
  for (const [s, [, lengkap, , qid, situs]] of Object.entries(KAMPUS)) {
    if (fs.existsSync(OUT + s + '.png')) continue;
    const f = await p154(qid); const buf = f && await ambil('https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(f) + '?width=160', true);
    if (buf && buf.subarray(1, 4).toString() === 'PNG') { fs.writeFileSync(OUT + s + '.png', buf); sumber.push(`- kampus/${s}.png | ${lengkap} | wikidata-p154 | https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f.replace(/ /g, '_'))} (Wikidata ${qid})`); }
    else sisa.push({ id: s, nama: lengkap, situs });
  }
  if (sisa.length) {
    const tmp = process.env.FOTO_TMP ? process.env.FOTO_TMP + 'sisa.json' : AKAR + 'data-panen/logo/kampus_sisa.json'; fs.mkdirSync(tmp.replace(/[^/]*$/, ''), { recursive: true }); fs.writeFileSync(tmp, JSON.stringify(sisa));
    execFileSync('node', [AKAR + 'scripts/panen/panen_logo.mjs', '--daftar=' + tmp, '--tanpa-wikidata'], { env: { ...process.env, LOGO_KELUAR: OUT }, stdio: 'inherit' });
    for (const o of sisa) if (fs.existsSync(OUT + o.id + '.png')) sumber.push(`- kampus/${o.id}.png | ${o.nama} | ikon resmi situs | ${o.situs} (apple-touch-icon/favicon besar)`);
  }
  const ada = new Set(Object.keys(KAMPUS).filter((s) => fs.existsSync(OUT + s + '.png')));
  fs.writeFileSync(PETA, JSON.stringify(peta(ada), null, 1) + '\n');
  let md = fs.readFileSync(SUMBER, 'utf8'); const i = md.indexOf('## Logo kampus'); if (i >= 0) md = md.slice(0, i).trimEnd() + '\n';
  fs.writeFileSync(SUMBER, md + '\n## Logo kampus\n\nscripts/panen/logo_kampus.mjs (UA METI, jeda >= 2 dtk). Logo hanya untuk mengenali kampus; hak cipta pada pemiliknya. Pemetaan nama: public/data/logo_kampus.json.\n\n' + (sumber.join('\n') || '(tidak ada yang baru)') + '\n');
  console.log('logo', ada.size, '/', Object.keys(KAMPUS).length);
}
if (process.argv.includes('--selftest')) { assert.deepEqual(Object.keys(peta(new Set(['itb']))), ['itb']); assert.ok(peta(new Set(['itb'])).itb.alias.includes('Bandung Institute of Technology')); console.log('selftest ok'); }
else if (process.argv.includes('--jalan')) await main();
