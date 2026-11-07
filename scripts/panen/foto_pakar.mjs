#!/usr/bin/env node
// Foto pakar -> public/img/pakar/<oa-id>.webp (240px) + public/data/foto_pakar.json {id:{foto_url,foto_kredit,foto_halaman}}.
//   node scripts/panen/foto_pakar.mjs --selftest | --jalan
// Jalur: OpenAlex (ORCID) -> Wikidata P496->P18 -> Commons (berlisensi bebas). SINTA (403 untuk UA jujur, 8 Nov 2026) dan halaman
// staf kampus TIDAK dipakai: SINTA berhenti total di 403. Tanpa login/CAPTCHA/medsos. Jeda >= 2 dtk per host. Unduhan di FOTO_TMP.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { UA } from './berita.mjs';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const TMP = process.env.FOTO_TMP || AKAR + 'data-panen/pakar-unduh/', OUT = AKAR + 'public/img/pakar/', JSON_OUT = AKAR + 'public/data/foto_pakar.json';
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const terakhir = new Map(), berhenti = new Set();
export async function ambil(url, biner = false) {
  const h = new URL(url).host; if (berhenti.has(h)) return null;
  const w = (terakhir.get(h) || 0) + 2100 - Date.now(); if (w > 0) await tidur(w);
  terakhir.set(h, Date.now());
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' }, signal: AbortSignal.timeout(20000) });
  if (r.status === 403 || r.status === 429) { berhenti.add(h); console.error('berhenti', h, r.status); return null; }
  if (!r.ok) return null;
  return biner ? Buffer.from(await r.arrayBuffer()) : r.text();
}
// Lisensi bebas saja (CC / domain publik); selain itu tolak.
export const lisensiBebas = (s) => /^(cc[ -]by|cc0|public domain|pd)/i.test(String(s || '').trim());

async function main() {
  const pakar = JSON.parse(fs.readFileSync(AKAR + 'public/data/pakar_riset.json', 'utf8'));
  const orcid = new Map();
  for (let i = 0; i < pakar.length; i += 50) {
    const ids = pakar.slice(i, i + 50).map((p) => p.id.replace(/^oa-/, '')).join('|');
    const j = JSON.parse(await ambil(`https://api.openalex.org/authors?filter=openalex:${ids}&per-page=50&select=id,orcid` + (process.env.OPENALEX_KEY ? '&api_key=' + process.env.OPENALEX_KEY : '')) || '{"results":[]}');
    for (const a of j.results) if (a.orcid) orcid.set(a.orcid.replace('https://orcid.org/', ''), 'oa-' + a.id.split('/').pop());
  }
  console.log('ORCID', orcid.size, '/', pakar.length);
  const q = `SELECT ?o ?img WHERE { VALUES ?o { ${[...orcid.keys()].map((o) => `"${o}"`).join(' ')} } ?p wdt:P496 ?o; wdt:P18 ?img }`;
  const wd = JSON.parse(await ambil('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q)) || '{"results":{"bindings":[]}}').results.bindings;
  console.log('Wikidata P18', wd.length);
  fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
  const hasil = fs.existsSync(JSON_OUT) ? JSON.parse(fs.readFileSync(JSON_OUT, 'utf8')) : {};
  for (const b of wd) {
    const id = orcid.get(b.o.value), nama = decodeURIComponent(b.img.value.split('/').pop()), halaman = 'https://commons.wikimedia.org/wiki/File:' + nama;
    const meta = JSON.parse(await ambil('https://commons.wikimedia.org/w/api.php?format=json&action=query&prop=imageinfo&iiprop=extmetadata|url&iiurlwidth=480&titles=' + encodeURIComponent('File:' + nama)) || '{}');
    const ii = Object.values(meta.query?.pages || {})[0]?.imageinfo?.[0]; const em = ii?.extmetadata || {};
    if (!ii || !lisensiBebas(em.LicenseShortName?.value)) { console.log('tolak (lisensi)', id, nama); continue; }
    const buf = await ambil(ii.thumburl || ii.url, true); if (!buf) continue;
    const src = TMP + id + '.jpg'; fs.writeFileSync(src, buf);
    execFileSync('cwebp', ['-quiet', '-q', '80', '-resize', '240', '0', src, '-o', OUT + id + '.webp']);
    hasil[id] = { foto_url: '/img/pakar/' + id + '.webp', foto_kredit: `${(em.Artist?.value || 'Wikimedia Commons').replace(/<[^>]*>/g, '').trim()}, ${em.LicenseShortName.value}, via Wikimedia Commons`, foto_halaman: halaman };
    console.log('ok', id, nama);
  }
  fs.writeFileSync(JSON_OUT, JSON.stringify(Object.fromEntries(Object.entries(hasil).sort()), null, 1) + '\n');
}
if (process.argv.includes('--selftest')) { assert.ok(lisensiBebas('CC BY-SA 4.0')); assert.ok(lisensiBebas('Public domain')); assert.ok(!lisensiBebas('Fair use')); console.log('selftest ok'); }
else if (process.argv.includes('--jalan')) await main();
