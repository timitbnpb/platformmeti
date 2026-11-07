// Butir organisasi dari Wikidata (CC0) untuk organisasi yang punya padanan PASTI: label persis + (negara Indonesia ATAU situs resmi sama).
//   node scripts/pipa/wikidata_org.mjs ambil <tgl>     SPARQL query.wikidata.org + Commons api (lisensi logo); tulis data/direktori/wikidata_org.json
//   node scripts/pipa/wikidata_org.mjs terapkan        gabung ke public/data/organisasi.json (butir `wikidata`; tahun_berdiri hanya bila kosong)
//   node scripts/pipa/wikidata_org.mjs --selftest
// robots.txt query.wikidata.org melarang /sparql untuk agen *; dipakai di sini atas perintah tertulis pemilik (SPARQL disebut eksplisit),
// jeda >= 2 dtk, UA jujur, 403/429 panjang = berhenti. Ambigu (lebih dari satu kandidat lolos) dilewati. Tidak menimpa data bersumber lebih kuat.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const OUT = 'data/direktori/wikidata_org.json';
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
let terakhir = 0;
export const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; } };
export const qid = (u) => String(u || '').split('/').pop();
export const varianLabel = (o) => {
  const out = new Set();
  for (const n of [o.nama, ...(o.nama_lain || [])]) {
    if (!n) continue; out.add(n);
    const s = n.replace(/\s*\((persero|tbk|ipp)\)/gi, '').replace(/^(PT\.?|CV\.?)\s+/i, '').replace(/\s+Tbk\.?$/i, '').trim();
    if (s.length > 3) out.add(s);
  }
  return [...out].filter((x) => x.length > 3 && !/["\\\n]/.test(x));
};
// kandidat lolos bila negara Indonesia atau host situs sama dengan situs organisasi
export function pilih(org, kandidat) {
  const h = host(org.situs);
  const lolos = kandidat.filter((k) => k.negara.has('Q252') || (h && k.situs.some((s) => host(s) === h)));
  const unik = [...new Set(lolos.map((k) => k.q))];
  if (unik.length !== 1) return null; // nol atau ambigu
  const k = lolos.find((x) => x.q === unik[0]);
  return { ...k, cocok: k.negara.has('Q252') ? 'label+negara-Indonesia' : 'label+situs-resmi' };
}

async function http(url, opsi = {}) {
  for (let i = 0; i < 2; i++) {
    await tidur(Math.max(0, 2200 - (Date.now() - terakhir))); terakhir = Date.now();
    const r = await fetch(url, { ...opsi, headers: { 'User-Agent': UA, ...(opsi.headers || {}) }, signal: AbortSignal.timeout(90000) });
    if (r.status === 403) throw new Error('403 berhenti total ' + url);
    if (r.status === 429) { const w = +r.headers.get('retry-after') || 30; if (w > 300) throw new Error('429 berhenti ' + w + ' dtk'); await tidur(w * 1000); continue; }
    if (r.status >= 500 && i === 0) { await tidur(8000); continue; }
    if (!r.ok) throw new Error(r.status + ' ' + url);
    return r.json();
  }
  throw new Error('gagal ' + url);
}
const sparql = async (q) => (await http('https://query.wikidata.org/sparql', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json' }, body: new URLSearchParams({ query: q }).toString() })).results.bindings;
const v = (b, k) => b[k]?.value;
const potong = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

export async function ambil(orgs, tgl) {
  const peta = new Map(); // label -> [org]
  for (const o of orgs) for (const l of varianLabel(o)) (peta.get(l) || peta.set(l, []).get(l)).push(o);
  const kand = new Map(); // org.id -> Map(q -> kandidat)
  for (const grup of potong([...peta.keys()], 40)) {
    const vals = grup.map((l) => `"${l}"@en "${l}"@id`).join(' ');
    const rows = await sparql(`SELECT ?l ?q ?c ?s ?i WHERE { VALUES ?l { ${vals} } ?q rdfs:label ?l . OPTIONAL { ?q wdt:P17 ?c } OPTIONAL { ?q wdt:P856 ?s } OPTIONAL { ?q wdt:P571 ?i } }`);
    for (const b of rows) for (const o of peta.get(v(b, 'l')) || []) {
      const m = kand.get(o.id) || kand.set(o.id, new Map()).get(o.id), q = qid(v(b, 'q'));
      const k = m.get(q) || m.set(q, { q, negara: new Set(), situs: [], tahun: new Set() }).get(q);
      if (v(b, 'c')) k.negara.add(qid(v(b, 'c'))); if (v(b, 's') && !k.situs.includes(v(b, 's'))) k.situs.push(v(b, 's')); if (v(b, 'i')) k.tahun.add(String(v(b, 'i')).slice(0, 4));
    }
  }
  const pasti = new Map();
  for (const o of orgs) { const m = kand.get(o.id); const p = m && pilih(o, [...m.values()]); if (p) pasti.set(o.id, p); }
  const rel = new Map(); // q -> {induk, anak, bursa, kode, logo}
  for (const grup of potong([...new Set([...pasti.values()].map((p) => p.q))], 40)) {
    const rows = await sparql(`SELECT ?q ?p ?v ?vl WHERE { VALUES ?q { ${grup.map((q) => 'wd:' + q).join(' ')} } { ?q wdt:P749 ?v . BIND("induk" AS ?p) } UNION { ?q wdt:P355 ?v . BIND("anak" AS ?p) } UNION { ?q wdt:P414 ?v . BIND("bursa" AS ?p) } UNION { ?q wdt:P249 ?v . BIND("kode" AS ?p) } UNION { ?q wdt:P154 ?v . BIND("logo" AS ?p) } UNION { ?q wdt:P159 ?v . BIND("kantor" AS ?p) } OPTIONAL { ?v rdfs:label ?vl . FILTER(lang(?vl) = "en") } }`);
    for (const b of rows) { const r = rel.get(qid(v(b, 'q'))) || rel.set(qid(v(b, 'q')), { induk: [], anak: [], bursa: [], kode: [], logo: [], kantor: [] }).get(qid(v(b, 'q'))); const k = v(b, 'p'); const val = k === 'kode' ? v(b, 'v') : k === 'logo' ? decodeURIComponent(qid(v(b, 'v'))) : { qid: qid(v(b, 'v')), nama: v(b, 'vl') || null }; if (!r[k].some((x) => JSON.stringify(x) === JSON.stringify(val))) r[k].push(val); }
  }
  const logos = [...new Set([...rel.values()].map((r) => r.logo[0]).filter(Boolean))];
  const lisensi = new Map();
  for (const grup of potong(logos, 40)) {
    const j = await http('https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo', iiprop: 'extmetadata', titles: grup.map((f) => 'File:' + f).join('|') }));
    for (const pg of j.query?.pages || []) { const e = pg.imageinfo?.[0]?.extmetadata; if (e) lisensi.set(pg.title.replace(/^File:/, '').replace(/_/g, ' '), { lisensi: e.LicenseShortName?.value || null, lisensi_url: e.LicenseUrl?.value || null }); }
  }
  const baris = {};
  for (const o of orgs) {
    const p = pasti.get(o.id); if (!p) continue; const r = rel.get(p.q) || { induk: [], anak: [], bursa: [], kode: [], logo: [], kantor: [] };
    const th = [...p.tahun].sort()[0]; const f = r.logo[0];
    baris[o.id] = JSON.parse(JSON.stringify({
      qid: p.q, url: 'https://www.wikidata.org/wiki/' + p.q, cocok: p.cocok, tahun_berdiri: th && /^\d{4}$/.test(th) ? +th : undefined,
      situs: p.situs[0], induk: r.induk, anak_usaha: r.anak.slice(0, 30), bursa: r.bursa, kode_bursa: r.kode, kantor_pusat: r.kantor.slice(0, 1),
      logo: f ? { commons_url: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(f.replace(/ /g, '_')), ...(lisensi.get(f.replace(/_/g, ' ')) || { lisensi: null }) } : undefined,
      sumber: 'Wikidata', lisensi_data: 'CC0 1.0', tanggal_periksa: tgl,
    }));
  }
  return { meta: { diperbarui: tgl, sumber: 'Wikidata (query.wikidata.org)', lisensi: 'CC0 1.0', ditanya: orgs.length, cocok: Object.keys(baris).length, keterangan: 'Padanan pasti: label persis + negara Indonesia atau situs resmi sama; ambigu dilewati. Logo hanya URL Commons + lisensi, berkas tidak disalin.' }, baris };
}

// tidak menimpa: tahun_berdiri hanya bila kosong; selebihnya butir terpisah `wikidata` yang diberi label sumbernya
export function terapkan(org, w) {
  let tahun = 0;
  for (const o of org.baris) { const x = w.baris[o.id]; if (!x) continue; o.wikidata = x; if (!o.situs && x.situs) o.situs = x.situs; const kt = x.kantor_pusat?.[0]?.nama; if (kt && !o.lokasi?.kota) o.lokasi = { ...(o.lokasi || {}), kota: kt }; if (!o.tahun_berdiri && x.tahun_berdiri) { o.tahun_berdiri = x.tahun_berdiri; tahun++; } }
  return tahun;
}

function selftest() {
  assert.deepEqual(varianLabel({ nama: 'PT Foo Energi Tbk' }), ['PT Foo Energi Tbk', 'Foo Energi']);
  const o = { id: 'a', situs: 'https://www.foo.id/x' };
  assert.equal(pilih(o, [{ q: 'Q1', negara: new Set(['Q30']), situs: [], tahun: new Set() }]), null); // negara lain, tanpa situs
  assert.equal(pilih(o, [{ q: 'Q1', negara: new Set(['Q30']), situs: ['http://foo.id'], tahun: new Set() }]).cocok, 'label+situs-resmi');
  assert.equal(pilih(o, [{ q: 'Q1', negara: new Set(['Q252']), situs: [], tahun: new Set() }, { q: 'Q2', negara: new Set(['Q252']), situs: [], tahun: new Set() }]), null); // ambigu
  const org = { baris: [{ id: 'a', tahun_berdiri: 1990 }, { id: 'b' }] };
  assert.equal(terapkan(org, { baris: { a: { tahun_berdiri: 2000 }, b: { tahun_berdiri: 2001 } } }), 1);
  assert.equal(org.baris[0].tahun_berdiri, 1990); assert.equal(org.baris[1].tahun_berdiri, 2001);
  console.log('selftest wikidata_org ok');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , cmd, tgl] = process.argv;
  const fo = path.join(ROOT, 'public/data/organisasi.json');
  if (cmd === '--selftest') selftest();
  else if (cmd === 'ambil') {
    if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) { console.error('pakai: ambil <YYYY-MM-DD>'); process.exit(1); }
    const orgs = JSON.parse(fs.readFileSync(fo, 'utf-8')).baris;
    const h = await ambil(orgs, tgl);
    fs.writeFileSync(path.join(ROOT, OUT), JSON.stringify(h, null, 1) + '\n', 'utf-8'); console.log(JSON.stringify(h.meta));
  } else if (cmd === 'terapkan') {
    const org = JSON.parse(fs.readFileSync(fo, 'utf-8')), n = terapkan(org, JSON.parse(fs.readFileSync(path.join(ROOT, OUT), 'utf-8')));
    fs.writeFileSync(fo, JSON.stringify(org), 'utf-8'); console.log('tahun_berdiri terisi:', n, 'butir wikidata:', org.baris.filter((o) => o.wikidata).length);
  } else { console.error('pakai: ambil <tgl> | terapkan | --selftest'); process.exit(1); }
}
