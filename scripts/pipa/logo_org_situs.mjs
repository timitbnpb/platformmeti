#!/usr/bin/env node
// Cari situs resmi organisasi yang belum punya logo (public/data/organisasi.json) -> data/rantai/logo_org_situs.json [{id,nama,situs,asal}]
// lalu: LOGO_KELUAR=<dir> node scripts/panen/panen_logo.mjs --daftar=data/rantai/logo_org_situs.json
// Urutan: situs di data (potret/rantai) -> tautan sumber "situs-sendiri" -> peta manual -> Wikidata P856 (nama persis) -> tebakan domain yang berandanya memuat nama (rantai_situs.cocok).
// Sopan: robots.txt, UA METI, jeda >= 2 dtk per host, berhenti di 403, tanpa medsos.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UA, bolehRobots } from './_panen_sopan.mjs';
import { norm, domain, cocok } from './rantai_situs.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'data/rantai/logo_org_situs.json');
const baca = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const MANUAL = { // nama (norm) -> situs resmi; hanya organisasi yang namanya berbeda dari label Wikidata
  giz: 'giz.de', cnooc: 'cnoocltd.com', chevron: 'chevron.com', siemens: 'siemens.com', abb: 'abb.com', 'united nations development programme': 'undp.org', 'asian development bank': 'adb.org',
  'us department of energy': 'energy.gov', 'us department of state': 'state.gov', 'us agency for international development usaid': 'usaid.gov', veolia: 'veolia.com', 'ge vernova': 'gevernova.com',
  temasek: 'temasek.com.sg', 'standard chartered': 'sc.com', 'wilmar international': 'wilmar-international.com', 'hyundai motor group': 'hyundaimotorgroup.com', proparco: 'proparco.fr',
  'agence francaise de developpement': 'afd.fr', finnfund: 'finnfund.fi', goodwe: 'goodwe.com', 'shanghai electric': 'shanghai-electric.com', 'tohoku electric power': 'tohoku-epco.co.jp',
  'kansai electric power': 'kepco.co.jp', tsingshan: 'tsingshan.com', 'electricity generating pcl egco': 'egco.com', mubadala: 'mubadala.com', 'sk on': 'skon.com', 'xinyi glass holdings': 'xinyiglass.com',
  'dongfang electric': 'dongfang.com', greenvolt: 'greenvolt.com', 'sunseap group': 'sunseap.com', 'lapp group jj lapp': 'lapp.com', 'posco e c': 'poscoenc.com', 'preformed line products': 'preformed.com',
  impsa: 'impsa.com', 'korea south east power koen': 'koenergy.kr', 'korea midland power komipo': 'komipo.co.kr', 'myclimate foundation': 'myclimate.org', 'gsma foundation': 'gsma.com',
  'star energy group': 'starenergy.co.id', 'china shenhua energy': 'csec.com', 'china datang': 'cdt-ep.com.cn',
};
const SOS = /linkedin|facebook|instagram|twitter|x\.com|youtube|wikipedia|tkdn|kemenperin|esdm\.go|bps\.go|github|google|openstreetmap|worldbank|idx\.co|ojk/i;
const gerbang = new Map(), robots = new Map();
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const henti = new Set();
async function ambil(url, json = false) { // sopan per host, null bila gagal/dilarang
  const u = new URL(url); if (henti.has(u.host)) return null;
  const tunggu = async () => { const p = gerbang.get(u.host) || Promise.resolve(); const n = p.then(() => tidur(2100)); gerbang.set(u.host, n.catch(() => {})); await p; };
  if (!/wikidata\.org$/.test(u.host)) {
    if (!robots.has(u.host)) { robots.set(u.host, (async () => { await tunggu(); try { const r = await fetch(u.origin + '/robots.txt', { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(8000) }); if (r.status === 403 || r.status === 429) { henti.add(u.host); return null; } return r.ok ? await r.text() : ''; } catch { return null; } })()); }
    const t = await robots.get(u.host); if (t === null || !bolehRobots(t, u.pathname)) return null;
  }
  await tunggu();
  try { const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(10000) }); if (r.status === 403 || r.status === 429) { henti.add(u.host); return null; } if (!r.ok) return null; return json ? await r.json() : (await r.text()).slice(0, 400000); } catch { return null; }
}
const bersih = (s) => norm(s).replace(/\b(group|holdings?|limited|ltd|inc|corporation|corp|co|company|plc|ag|sa|the)\b/g, ' ').replace(/\s+/g, ' ').trim();
async function wikidata(nama) {
  const q = String(nama).replace(/\([^)]*\)/g, '').replace(/^PT\.?\s+/i, '').trim(), k = bersih(nama); if (k.length < 3) return null;
  const s = await ambil('https://www.wikidata.org/w/api.php?' + new URLSearchParams({ action: 'wbsearchentities', format: 'json', search: q, language: 'en', limit: '5', type: 'item' }), true);
  const c = (s?.search || []).filter((e) => [e.label, ...(e.aliases || []), e.match?.text].filter(Boolean).some((x) => bersih(x) === k)).slice(0, 3); if (!c.length) return null;
  const e = await ambil('https://www.wikidata.org/w/api.php?' + new URLSearchParams({ action: 'wbgetentities', format: 'json', ids: c.map((x) => x.id).join('|'), props: 'claims' }), true);
  for (const x of c) { const v = e?.entities?.[x.id]?.claims?.P856?.[0]?.mainsnak?.datavalue?.value; if (v && !SOS.test(v)) return v; }
  return null;
}
const org = baca('public/data/organisasi.json').baris;
const pt = new Map(baca('data-panen/potret/publik/organisasi.json').baris.map((x) => [x.id, x]));
const rs = new Map(Object.values(baca('data/rantai/situs.json')).filter((x) => x.situs).map((x) => [norm(x.nama), x.situs]));
const tanpa = org.filter((x) => !x.logo && !fs.existsSync(path.join(ROOT, 'public/img/logo/org', x.id + '.png')));
const lama = fs.existsSync(OUT) ? new Map(JSON.parse(fs.readFileSync(OUT, 'utf8')).map((x) => [x.id, x])) : new Map();
const hasil = [];
await Promise.all(Array.from({ length: 8 }, async (_, w) => {
  for (let i = w; i < tanpa.length; i += 8) {
    const x = tanpa[i]; if (lama.has(x.id)) { hasil.push(lama.get(x.id)); continue; }
    let situs = pt.get(x.id)?.situs || rs.get(norm(x.nama)) || '', asal = situs ? 'data' : '';
    if (!situs) { const u = (x.sumber || []).find((z) => z.tingkat_bukti === 'situs-sendiri' && !SOS.test(z.url)); if (u) { situs = new URL(u.url).origin; asal = 'sumber'; } }
    if (!situs && MANUAL[norm(x.nama)]) { situs = MANUAL[norm(x.nama)]; asal = 'manual'; }
    if (!situs) { const v = await wikidata(x.nama); if (v) { situs = v; asal = 'wikidata-p856'; } }
    if (!situs && x.kategori?.kode !== 'internasional') for (const u of domain(x.nama).slice(0, 6)) { const h = await ambil(u); if (h && cocok(h, x.nama, null, u)) { situs = u; asal = 'tebak-domain'; break; } }
    hasil.push({ id: x.id, nama: x.nama, situs: situs || null, asal });
    console.log(situs ? 'OK' : '--', x.nama, situs, asal);
    fs.writeFileSync(OUT, JSON.stringify(hasil, null, 0));
  }
}));
fs.writeFileSync(OUT, JSON.stringify(hasil, null, 0));
console.log('selesai', hasil.length, 'bersitus', hasil.filter((x) => x.situs).length);
