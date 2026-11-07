#!/usr/bin/env node
// Daftar PAKAR EBET dari OpenAlex (karya -> penulis), seperti Direktori Jaringan Kebencanaan membangun pakarnya.
// Syarat: afiliasi terakhir lembaga Indonesia (country_code ID) dan >= 3 karya EBET sejak 2015 (topik OpenAlex dipetakan ke K16).
//   node scripts/pipa/pakar.mjs --irisan     1. group_by penulis per (kode K16 x tahun)  -> raw/pakar/irisan.json
//   node scripts/pipa/pakar.mjs --detail     2. profil penulis + institusi + hitung EBET persis -> raw/pakar/detail.json
//   node scripts/pipa/pakar.mjs --karya      3. karya teratas/terbaru, ko-penulis, pendana per pakar -> raw/pakar/karya.json
//   node scripts/pipa/pakar.mjs --bangun     4. pakar.jsonl + potret/anggota/induk.json (tanpa jaringan)
//   node scripts/pipa/pakar.mjs --statistik | --selftest
// Semua langkah resumable (berkas dicek per irisan/batch/pakar). Kunci OPENALEX_KEY dari env atau .dev.vars, tidak pernah dicetak.
// Jeda 1 dtk (API berkunci OpenAlex membolehkan 10 rps; sumber lain tetap >= 2 dtk di rekam_jejak.mjs). 429 = berhenti.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RAW = path.join(ROOT, 'data-panen/orang/raw/pakar'), OUT = path.join(ROOT, 'data-panen/orang');
const HARI_INI = process.env.TANGGAL_BANGUN || new Date().toISOString().slice(0, 10);
const TAHUN_AWAL = 2015, TAHUN_AKHIR = +HARI_INI.slice(0, 4), MIN_KARYA = 3, MAKS_PAKAR = 2000;
const GAP_MS = +process.env.OPENALEX_GAP_MS || 1000;

// ---------- taksonomi: topik OpenAlex -> kode K16 (KEPUTUSAN K16 sumbu 1). 'umum' = EBET lintas bidang, hanya ikut hitungan ----------
export const TOPIK_K16 = {
  surya: ['T10905', 'T10468', 'T11276', 'T12838', 'T10624', 'T10024', 'T12309', 'T10045'],
  bayu: ['T10680', 'T10740'],
  hidro: ['T13132'],
  'panas-bumi': ['T11225'],
  bioenergi: ['T10171', 'T10476', 'T10507', 'T11009', 'T10284'],
  'biomassa-sampah': ['T10088', 'T14256', 'T12118', 'T11108'],
  nuklir: ['T10597', 'T12560', 'T13923'],
  hidrogen: ['T10811', 'T10409', 'T10311', 'T10030'],
  laut: ['T11250'],
  penyimpanan: ['T10018', 'T10281', 'T11690', 'T10179', 'T10663'],
  jaringan: ['T10603', 'T10917', 'T12451', 'T10223', 'T10454', 'T10305', 'T14502', 'T10424'],
  efisiensi: ['T11954', 'T13263', 'T10121', 'T14098'],
  elektrifikasi: ['T10768', 'T10808'],
  karbon: ['T10967', 'T11302', 'T10471'],
  kebijakan: ['T12617', 'T12129', 'T13758', 'T10438'],
  'transisi-adil': ['T12503'],
  umum: ['T12271', 'T14444', 'T11007', 'T14481'],
};
export const SEKTOR_DARI_K16 = { surya: 'surya', bayu: 'bayu', hidro: 'air', 'panas-bumi': 'panas-bumi', bioenergi: 'bioenergi', 'biomassa-sampah': 'sampah-energi', nuklir: 'nuklir', hidrogen: 'hidrogen', laut: 'laut', penyimpanan: 'penyimpanan', jaringan: 'jaringan', efisiensi: 'efisiensi', elektrifikasi: 'kendaraan-listrik', karbon: 'ccs' };
const SEKTOR_URUT = ['surya', 'bayu', 'air', 'panas-bumi', 'bioenergi', 'laut', 'hidrogen', 'penyimpanan', 'jaringan', 'efisiensi', 'kendaraan-listrik', 'sampah-energi', 'nuklir', 'ccs'];
const SEMUA_TOPIK = Object.values(TOPIK_K16).flat();
const PROVINSI = { aceh: '11', 'north sumatra': '12', 'west sumatra': '13', riau: '14', jambi: '15', 'south sumatra': '16', bengkulu: '17', lampung: '18', 'bangka belitung islands': '19', 'riau islands': '21', jakarta: '31', 'special capital region of jakarta': '31', 'west java': '32', 'central java': '33', 'special region of yogyakarta': '34', yogyakarta: '34', 'east java': '35', banten: '36', bali: '51', 'west nusa tenggara': '52', 'east nusa tenggara': '53', 'west kalimantan': '61', 'central kalimantan': '62', 'south kalimantan': '63', 'east kalimantan': '64', 'north kalimantan': '65', 'north sulawesi': '71', 'central sulawesi': '72', 'south sulawesi': '73', 'southeast sulawesi': '74', gorontalo: '75', 'west sulawesi': '76', maluku: '81', 'north maluku': '82', papua: '91', 'west papua': '92', 'south papua': '93', 'central papua': '94', 'highland papua': '95', 'southwest papua': '96' };

// ---------- klien ----------
const baca = (f, d) => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d;
const simpan = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f + '.tmp', JSON.stringify(o)); fs.renameSync(f + '.tmp', f); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let kunci = process.env.OPENALEX_KEY;
if (!kunci && fs.existsSync(path.join(ROOT, '.dev.vars'))) kunci = ((fs.readFileSync(path.join(ROOT, '.dev.vars'), 'utf8').match(/^OPENALEX_KEY=(.+)$/m) || [])[1] || '').trim().replace(/^["']|["']$/g, '');
let terakhir = 0;
async function oa(p, q) {
  const u = 'https://api.openalex.org' + p + '?' + new URLSearchParams({ ...q, ...(kunci ? { api_key: kunci } : {}) });
  for (let i = 0; i < 3; i++) {
    const d = Date.now() - terakhir; if (d < GAP_MS) await sleep(GAP_MS - d); terakhir = Date.now();
    let r; try { r = await fetch(u, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(60000) }); } catch { await sleep(4000 * (i + 1)); continue; }
    if (r.status === 429) { const ra = +r.headers.get('retry-after') || 30; if (ra > 300) throw new Error('BERHENTI 429 kuota habis, ulangi setelah ' + ra + ' dtk'); await sleep(ra * 1000); continue; }
    if (r.status >= 500) { await sleep(5000 * (i + 1)); continue; }
    if (r.status !== 200) throw new Error('openalex ' + r.status + ' ' + p);
    return r.json();
  }
  throw new Error('openalex gagal setelah ulang ' + p);
}
const pendek = (i) => (i || '').split('/').pop();
const FILTER_ID = 'authorships.institutions.country_code:ID';

// ---------- 1. irisan: karya -> penulis ----------
async function irisan() {
  const f = path.join(RAW, 'irisan.json'); const s = baca(f, { selesai: {}, penulis: {} });
  for (const [kode, ids] of Object.entries(TOPIK_K16)) for (let y = TAHUN_AWAL; y <= TAHUN_AKHIR; y++) {
    const k = kode + ':' + y; if (s.selesai[k] !== undefined) continue;
    const d = await oa('/works', { filter: `topics.id:${ids.join('|')},${FILTER_ID},publication_year:${y}`, group_by: 'authorships.author.id' });
    const g = d.group_by || [];
    for (const x of g) { const a = pendek(x.key); (s.penulis[a] ||= { n: 0, kode: {}, nama: x.key_display_name }); s.penulis[a].n += x.count; s.penulis[a].kode[kode] = (s.penulis[a].kode[kode] || 0) + x.count; }
    s.selesai[k] = g.length; simpan(f, s); // g.length === 200 = terpotong: irisan itu mungkin tak lengkap
  }
  console.error('irisan selesai; penulis unik', Object.keys(s.penulis).length, 'irisan terpotong', Object.values(s.selesai).filter((n) => n >= 200).length);
}

const KODE_TOPIK = Object.fromEntries(Object.entries(TOPIK_K16).flatMap(([k, v]) => v.map((t) => [t, k])));
export const kodeDariTopik = (topics) => (topics || []).reduce((m, t) => { const k = KODE_TOPIK[pendek(t.id)]; if (k) m[k] = (m[k] || 0) + (t.count || 1); return m; }, {});
// ---------- 1b. penulis ber-afiliasi ID menurut topik penulis (pola poskokarhutla/perbarui.py kandidat()): melengkapi irisan yang terpotong 200 ----------
async function penulisID() {
  const f = path.join(RAW, 'penulis_id.json'); const s = baca(f, { selesai: {}, id: {} });
  for (const [kode, ids] of Object.entries(TOPIK_K16)) {
    if (s.selesai[kode]) continue; let cur = s.kursor?.[kode] || '*';
    while (cur) {
      const d = await oa('/authors', { filter: 'last_known_institutions.country_code:ID,works_count:>2,topics.id:' + ids.join('|'), per_page: '200', cursor: cur, select: 'id' });
      for (const a of d.results || []) s.id[pendek(a.id)] = 1;
      cur = (d.results || []).length ? d.meta?.next_cursor : null; (s.kursor ||= {})[kode] = cur; simpan(f, s);
    }
    s.selesai[kode] = 1; simpan(f, s); console.error('penulis', kode, Object.keys(s.id).length);
  }
}

// ---------- 2. detail ----------
async function detail() {
  const s = baca(path.join(RAW, 'irisan.json'), null); if (!s) throw new Error('jalankan --irisan');
  const f = path.join(RAW, 'detail.json'); const dt = baca(f, { profil: {}, institusi: {}, ebet: {}, dicek: {}, bukanID: {} });
  const tambah = baca(path.join(RAW, 'penulis_id.json'), { id: {} }).id;
  const calon = [...new Set([...Object.entries(s.penulis).filter(([, v]) => v.n >= MIN_KARYA).map(([a]) => a), ...Object.keys(tambah)])].sort();
  const belum = calon.filter((a) => !dt.profil[a] && !dt.bukanID[a]);
  for (let i = 0; i < belum.length; i += 100) {
    const lot = belum.slice(i, i + 100);
    const d = await oa('/authors', { filter: 'ids.openalex:' + lot.join('|'), per_page: '100', select: 'id,display_name,orcid,works_count,cited_by_count,summary_stats,topics,last_known_institutions,counts_by_year' });
    const dapat = new Set();
    for (const a of d.results || []) { const id = pendek(a.id); dapat.add(id); const ins = (a.last_known_institutions || [])[0]; if (ins?.country_code === 'ID') dt.profil[id] = { nama: a.display_name, orcid: pendek(a.orcid) || null, karya: a.works_count, sitasi: a.cited_by_count, h: a.summary_stats?.h_index ?? null, i10: a.summary_stats?.i10_index ?? null, topik: (a.topics || []).slice(0, 8).map((t) => t.display_name), th: (a.counts_by_year || []).map((y) => ({ tahun: y.year, karya: y.works_count, sitasi: y.cited_by_count })).sort((x, y) => x.tahun - y.tahun).slice(-10), kt: kodeDariTopik(a.topics), inst: pendek(ins.id) }; else dt.bukanID[id] = 1; }
    for (const id of lot) if (!dapat.has(id)) dt.bukanID[id] = 1;
    simpan(f, dt); console.error('profil', Math.min(i + 100, belum.length), '/', belum.length);
  }
  const insId = [...new Set(Object.values(dt.profil).map((p) => p.inst))].filter((x) => !dt.institusi[x]);
  for (let i = 0; i < insId.length; i += 100) {
    const d = await oa('/institutions', { filter: 'ids.openalex:' + insId.slice(i, i + 100).join('|'), per_page: '100', select: 'id,display_name,ror,type,geo,country_code' });
    for (const x of d.results || []) dt.institusi[pendek(x.id)] = { nama: x.display_name, ror: x.ror || null, tipe: x.type || null, kota: x.geo?.city || null, region: x.geo?.region || null };
    simpan(f, dt);
  }
  console.error('profil ID:', Object.keys(dt.profil).length);
}

// ---------- 3. karya per pakar (satu panggilan: 100 karya EBET terbanyak disitir) ----------
const urutPakar = (dt, k) => Object.keys(k).filter((a) => dt.profil[a] && k[a].ebet >= MIN_KARYA).sort((x, y) => (dt.profil[y].sitasi - dt.profil[x].sitasi) || (x < y ? -1 : 1)).slice(0, MAKS_PAKAR);
async function karya() {
  const dt = baca(path.join(RAW, 'detail.json'), null); if (!dt) throw new Error('jalankan --detail');
  const f = path.join(RAW, 'karya.json'); const k = baca(f, {}); let n = 0;
  const kandidat = Object.keys(dt.profil).sort((x, y) => (dt.profil[y].sitasi - dt.profil[x].sitasi) || (x < y ? -1 : 1));
  let lolos = Object.values(k).filter((x) => x.ebet >= MIN_KARYA).length;
  // satu panggilan per penulis: meta.count = karya EBET sejak 2015 (persis); 100 karya terbanyak disitir untuk ko-penulis/pendana. Berhenti di MAKS_PAKAR lolos.
  for (const a of kandidat) {
    if (lolos >= MAKS_PAKAR) break; if (k[a]) continue;
    const d = await oa('/works', { filter: `authorships.author.id:${a},topics.id:${SEMUA_TOPIK.join('|')},publication_year:>${TAHUN_AWAL - 1}`, sort: 'cited_by_count:desc', per_page: '100', select: 'id,title,publication_year,cited_by_count,doi,authorships,funders' });
    const total = d.meta?.count || 0;
    if (total < MIN_KARYA) k[a] = { ebet: total };
    else {
      const ko = new Map(), dana = new Map(); const ws = d.results || [];
      for (const w of ws) { for (const x of w.authorships || []) { const id = pendek(x.author?.id); if (id && id !== a) { const e = ko.get(id) || { nama: x.author.display_name, openalex_id: id, karya_bersama: 0 }; e.karya_bersama++; ko.set(id, e); } } for (const g of w.funders || []) { const nm = g.display_name || g.funder_display_name; if (nm) dana.set(nm, (dana.get(nm) || 0) + 1); } }
      const ring = (w) => ({ judul: w.title, tahun: w.publication_year, sitasi: w.cited_by_count, doi: w.doi || null });
      k[a] = { ebet: total, teratas: ws.slice(0, 5).map(ring), terbaru: [...ws].sort((x, y) => (y.publication_year || 0) - (x.publication_year || 0) || y.cited_by_count - x.cited_by_count).slice(0, 5).map(ring), terbaru_lengkap: total <= 100, ko_penulis: [...ko.values()].sort((x, y) => y.karya_bersama - x.karya_bersama || (x.openalex_id < y.openalex_id ? -1 : 1)).slice(0, 8), pendana: [...dana].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1)).slice(0, 5).map(([nama, karya]) => ({ nama, karya })) };
      lolos++;
    }
    if (++n % 50 === 0) { simpan(f, k); console.error('karya diperiksa', n, 'lolos', lolos); }
  }
  simpan(f, k);
  const pakar = urutPakar(dt, k); const insId = [...new Set(pakar.map((a) => dt.profil[a].inst))].filter((x) => !dt.institusi[x]);
  for (let i = 0; i < insId.length; i += 100) {
    const d = await oa('/institutions', { filter: 'ids.openalex:' + insId.slice(i, i + 100).join('|'), per_page: '100', select: 'id,display_name,ror,type,geo,country_code' });
    for (const x of d.results || []) dt.institusi[pendek(x.id)] = { nama: x.display_name, ror: x.ror || null, tipe: x.type || null, kota: x.geo?.city || null, region: x.geo?.region || null };
  }
  simpan(path.join(RAW, 'detail.json'), dt); console.error('pakar lolos', pakar.length);
}

// ---------- 4. bangun ----------
const kata = (s) => new Set(String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !['universitas', 'university', 'institut', 'institute', 'negeri', 'state', 'indonesia', 'of', 'the', 'dan', 'and'].includes(w)));
export function cocokLembaga(nama, daftar) { // Jaccard >= 0.6 pada kata bermakna; tidak menggabung yang ambigu
  const a = kata(nama); if (!a.size) return null; let terbaik = null, skor = 0, seri = false;
  for (const l of daftar) for (const n of [l.nama, l.singkatan].filter(Boolean)) { const b = kata(n); const j = [...a].filter((x) => b.has(x)).length / new Set([...a, ...b]).size; if (j > skor) { skor = j; terbaik = l; seri = false; } else if (j === skor && l !== terbaik) seri = true; }
  return skor >= 0.6 && !seri ? terbaik.lembaga_id : null;
}
export function k16Pakar(kode) { // kode -> {kode: n}; maks 3, yang utama = terbanyak; 'umum' tidak dihitung
  return Object.entries(kode).filter(([c]) => c !== 'umum').sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1)).slice(0, 3).map(([c, n], i) => ({ kode: c, utama: i === 0, karya: n }));
}
function bangun() {
  const s = baca(path.join(RAW, 'irisan.json'), null), dt = baca(path.join(RAW, 'detail.json'), null), k = baca(path.join(RAW, 'karya.json'), {}); if (!s || !dt) throw new Error('langkah sebelumnya belum jalan');
  const lemb = fs.existsSync(path.join(OUT, '../lembaga/lembaga.jsonl')) ? fs.readFileSync(path.join(OUT, '../lembaga/lembaga.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse).filter((l) => l.jenis === 'universitas') : [];
  const rows = [];
  for (const a of urutPakar(dt, k)) {
    const p = dt.profil[a], ins = dt.institusi[p.inst] || {}, kp = k16Pakar(s.penulis[a]?.kode && Object.keys(s.penulis[a].kode).some((c) => c !== 'umum') ? s.penulis[a].kode : p.kt || {}); if (!kp.length) continue;
    const prov = PROVINSI[String(ins.region || '').toLowerCase()] || PROVINSI[String(ins.kota || '').toLowerCase()] || null;
    const kar = k[a] || {};
    rows.push({ openalex_id: a, nama: p.nama, afiliasi: { institusi: ins.nama || null, openalex_institusi_id: p.inst, ror: ins.ror || null, tipe: ins.tipe || null, kota: ins.kota || null, provinsi: prov, lembaga_id: cocokLembaga(ins.nama, lemb) },
      kepakaran: kp, karya_ebet_2015: k[a].ebet, karya: p.karya, sitasi: p.sitasi, h_index: p.h, i10_index: p.i10, per_tahun: p.th, topik: p.topik,
      karya_teratas: kar.teratas || [], karya_terbaru: kar.terbaru || [], karya_terbaru_lengkap: kar.terbaru_lengkap ?? null, ko_penulis: kar.ko_penulis || [], pendana: kar.pendana || [], orcid: p.orcid, sumber_url: 'https://openalex.org/authors/' + a, diperiksa: HARI_INI });
  }
  fs.writeFileSync(path.join(OUT, 'pakar.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const sektorDari = (r) => [...new Set(r.kepakaran.map((x) => SEKTOR_DARI_K16[x.kode]).filter(Boolean))];
  const induk = { sumber: { url: 'https://openalex.org', jenis: 'data-terbuka', diperiksa: HARI_INI }, sektor: SEKTOR_URUT,
    orang: rows.filter((r) => sektorDari(r).length).map((r) => [r.openalex_id, r.nama, r.afiliasi.institusi || 'Afiliasi belum diketahui', sektorDari(r), r.h_index ?? 0, r.karya, r.sitasi, r.orcid || '', r.topik.slice(0, 4), '', '', '', '', '', '']) };
  fs.mkdirSync(path.join(ROOT, 'data-panen/potret/anggota'), { recursive: true });
  const j = JSON.stringify(induk); assert.ok(j.length < 2 * 1024 * 1024, 'induk.json > 2 MB');
  fs.writeFileSync(path.join(ROOT, 'data-panen/potret/anggota/induk.json'), j);
  console.error('pakar', rows.length, 'induk', induk.orang.length, (j.length / 1024).toFixed(0) + ' KB');
}
function statistik() {
  const r = fs.readFileSync(path.join(OUT, 'pakar.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse);
  const c = (f) => r.reduce((m, x) => { for (const v of f(x)) m[v] = (m[v] || 0) + 1; return m; }, {});
  const top = (m, n) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);
  const f = (p) => (fs.existsSync(p) ? (fs.statSync(p).size / 1024).toFixed(0) + ' KB' : '-');
  console.log(JSON.stringify({ pakar: r.length, k16_utama: c((x) => [x.kepakaran[0].kode]), k16_semua: c((x) => x.kepakaran.map((y) => y.kode)), institusi_top10: top(c((x) => [x.afiliasi.institusi]), 10), tertaut_lembaga: r.filter((x) => x.afiliasi.lembaga_id).length, dengan_provinsi: r.filter((x) => x.afiliasi.provinsi).length, dengan_karya_detail: r.filter((x) => x.karya_teratas.length).length, ukuran: { pakar: f(path.join(OUT, 'pakar.jsonl')), induk: f(path.join(ROOT, 'data-panen/potret/anggota/induk.json')) } }, null, 1));
}
function selftest() {
  assert.deepEqual(k16Pakar({ surya: 5, umum: 9, bayu: 5, hidro: 1, jaringan: 2 }).map((x) => x.kode), ['bayu', 'surya', 'jaringan']);
  assert.equal(k16Pakar({ surya: 2 })[0].utama, true);
  const d = [{ lembaga_id: 'l1', nama: 'Institut Teknologi Bandung', singkatan: 'ITB' }, { lembaga_id: 'l2', nama: 'Universitas Gadjah Mada', singkatan: 'UGM' }];
  assert.equal(cocokLembaga('Bandung Institute of Technology', d), null); assert.equal(cocokLembaga('Institut Teknologi Bandung', d), 'l1'); assert.equal(cocokLembaga('Gadjah Mada University', d), 'l2');
  assert.ok(Object.values(TOPIK_K16).flat().length === new Set(Object.values(TOPIK_K16).flat()).size, 'topik ganda lintas kode');
  console.log('selftest ok');
}
const langkah = { irisan, penulisID, detail, karya, bangun, statistik, selftest };
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const k = Object.keys(langkah).find((x) => process.argv.includes('--' + x.toLowerCase().replace('penulisid', 'penulis')) || process.argv.includes('--' + x));
  if (!k) console.log('lihat komentar di kepala berkas'); else Promise.resolve(langkah[k]()).catch((e) => { console.error(String(e.message || e)); process.exit(1); });
}
