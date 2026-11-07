#!/usr/bin/env node
// Penyedia teknologi WTE global -> public/data/global/pemasok_wte.json (+ entitas_tambah, logo).
//   node scripts/panen/global_wte.mjs --selftest | --bangun | --entitas | --logo
// Masukan: data/global/wte/penyedia_seed.json, rantai_seed.json (tanggal dari masukan, bukan jam). Tanpa jaringan kecuali --logo
// (Wikidata P154 lewat Commons, lalu panen_logo.mjs untuk ikon resmi situs; UA METI, jeda >= 2 dtk, berhenti 403/429).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { idEntitas } from '../pipa/entitas_tambah.mjs';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const J = (f) => JSON.parse(fs.readFileSync(AKAR + f, 'utf8'));
export const bendera = (iso2) => String.fromCodePoint(...[...iso2.toUpperCase()].map((c) => 0x1F1E6 + c.charCodeAt(0) - 65));
export const idPenyedia = (p) => p.organisasi_id_ada || idEntitas(p.nama);

export function bangun(seed = J('data/global/wte/penyedia_seed.json'), rantai = J('data/global/wte/rantai_seed.json')) {
  const baris = seed.penyedia.map((p) => ({ id: idPenyedia(p), ...p, bendera: bendera(p.negara), negara_nama: rantai.negara_nama[p.negara] || p.negara }));
  const ids = new Set(); for (const b of baris) { assert.ok(!ids.has(b.id), 'id kembar ' + b.nama); ids.add(b.id); assert.ok(b.sumber.length || b.situs === null, b.nama + ': situs tanpa sumber'); }
  const negara = Object.keys(rantai.negara_nama).map((iso2) => {
    const ps = baris.filter((b) => b.negara === iso2); if (!ps.length) return null;
    const un = (k) => [...new Set(ps.flatMap((p) => p[k]))].sort();
    return { iso2, bendera: bendera(iso2), nama: rantai.negara_nama[iso2], penyedia_ids: ps.map((p) => p.id), teknologi: un('teknologi'), komponen: un('komponen'),
      proyek_indonesia: [...new Set(ps.flatMap((p) => p.indonesia.map((i) => i.proyek_id)))].sort(), pabrik_wte_dunia: null, pabrik_wte_asia: null,
      pendanaan_pendamping: rantai.pendanaan_pendamping[iso2] || [], alur_impor: null };
  }).filter(Boolean);
  return { lapis: 'publik', dibangun_pada: seed.tanggal_periksa, jumlah: baris.length, catatan: rantai.pendanaan_catatan, alur_impor: rantai.alur_impor, baris, negara, hulu: rantai.hulu };
}
export function tambahEntitas(seed, d) { // idempoten: lewati yang sudah ada (nama) atau sudah di direktori (organisasi_id_ada)
  const ada = new Set(d.baris.map((b) => b.nama.toLowerCase())); const baru = [];
  for (const p of seed.penyedia) {
    if (p.organisasi_id_ada || ada.has(p.nama.toLowerCase())) continue;
    const s = p.sumber.length ? p.sumber : p.indonesia.map((i) => i.sumber); if (!s.length) continue; // tanpa sumber berurl tidak masuk direktori
    baru.push({ nama: p.nama, nama_lain: p.nama_lain, kategori: 'internasional', kepakaran: ['bioenergi'], peran_rantai: ['manufaktur'], situs: p.situs, sumber: s.map((x) => ({ url: x.url, tingkat_bukti: x.tingkat_bukti, keterangan: 'Penyedia teknologi global WTE (' + p.negara + ')' })) });
  }
  return baru;
}
async function logo(seed) {
  const { ambil } = await import('./foto_pakar.mjs'); const OUT = AKAR + 'public/img/logo/org/'; const sisa = []; const baris = [];
  for (const p of seed.penyedia) {
    const id = idPenyedia(p); if (fs.existsSync(OUT + id + '.png')) continue;
    let f = null;
    if (p.qid) { const j = JSON.parse(await ambil('https://www.wikidata.org/w/api.php?format=json&action=wbgetentities&props=claims&ids=' + p.qid) || '{}'); f = j.entities?.[p.qid]?.claims?.P154?.[0]?.mainsnak?.datavalue?.value; }
    if (f && /\.(png|svg)$/i.test(f) && !/^Mitsubishi logo/i.test(f)) { // logo grup Mitsubishi bukan logo MHIEC
      const buf = await ambil('https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(f) + '?width=160', true);
      if (buf && buf.subarray(1, 4).toString() === 'PNG') { fs.writeFileSync(OUT + id + '.png', buf); baris.push(`| ${id}.png | ${p.nama} | Wikidata ${p.qid} P154 | https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f.replace(/ /g, '_'))} |`); continue; }
    }
    if (p.situs && !/martin-ag/.test(p.situs)) sisa.push({ id, nama: p.nama, situs: p.situs });
  }
  if (sisa.length) {
    const tmp = (process.env.FOTO_TMP || AKAR + 'data-panen/') + 'wte_logo_sisa.json'; fs.mkdirSync(tmp.replace(/[^/]*$/, ''), { recursive: true }); fs.writeFileSync(tmp, JSON.stringify(sisa));
    execFileSync('node', [AKAR + 'scripts/panen/panen_logo.mjs', '--daftar=' + tmp, '--tanpa-wikidata'], { env: { ...process.env, LOGO_KELUAR: OUT }, stdio: 'inherit' });
    for (const o of sisa) if (fs.existsSync(OUT + o.id + '.png')) baris.push(`| ${o.id}.png | ${o.nama} | ikon resmi situs | ${o.situs} |`);
  }
  if (baris.length) { const f = OUT + 'SUMBER.md'; const md = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trimEnd() + '\n' : '# Sumber logo organisasi\n\nLogo hanya untuk mengenali organisasi; hak cipta pada pemiliknya.\n\n| berkas | organisasi | cara | sumber |\n| --- | --- | --- | --- |\n'; fs.writeFileSync(f, md + baris.join('\n') + '\n'); }
  console.log('logo baru', baris.length);
}
const a = process.argv;
if (a.includes('--selftest')) {
  assert.equal(bendera('jp'), '🇯🇵'); const b = bangun();
  assert.ok(b.jumlah >= 25 && b.negara.length >= 8); assert.ok(b.baris.every((x) => x.id && x.negara && Array.isArray(x.sumber)));
  const d = { baris: [] }; const n1 = tambahEntitas(J('data/global/wte/penyedia_seed.json'), d); d.baris.push(...n1); assert.equal(tambahEntitas(J('data/global/wte/penyedia_seed.json'), d).length, 0); assert.ok(n1.length > 12); assert.ok(n1.every((x) => x.sumber.every((y) => /^https:/.test(y.url))));
  console.log('selftest ok', b.jumlah, 'penyedia', b.negara.length, 'negara');
} else if (a.includes('--bangun')) {
  const b = bangun(); fs.mkdirSync(AKAR + 'public/data/global', { recursive: true });
  fs.writeFileSync(AKAR + 'public/data/global/pemasok_wte.json', JSON.stringify(b) + '\n'); console.log('pemasok_wte', b.jumlah);
} else if (a.includes('--entitas')) {
  const f = AKAR + 'data/direktori/entitas_tambah.json'; const t = fs.readFileSync(f, 'utf8'); const d = JSON.parse(t); // baca ulang tepat sebelum tulis
  const baru = tambahEntitas(J('data/global/wte/penyedia_seed.json'), d); const i = t.lastIndexOf(']'); // sisip teks: baris orang lain tidak diformat ulang
  if (baru.length) fs.writeFileSync(f, t.slice(0, i).replace(/\s*$/, '') + ',\n' + baru.map((b) => '    ' + JSON.stringify(b)).join(',\n') + '\n  ' + t.slice(i)); console.log('entitas ditambah', baru.length);
} else if (a.includes('--logo')) await logo(J('data/global/wte/penyedia_seed.json'));
