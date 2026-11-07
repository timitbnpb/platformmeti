// Daftar pakar EBET dari OpenAlex (karya -> penulis berafiliasi Indonesia). Hanya membaca OpenAlex, menulis berkas lokal.
// Pakai: node scripts/pipa/pakar_openalex.mjs [--selftest] [--tarik] [--gabung] [--maks-hal=30] [--maks=2000]
// Tanpa bendera = tarik (bisa dilanjut dari checkpoint) lalu gabung. Rahasia OPENALEX_KEY dari env atau .dev.vars, tidak dicetak.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const AKAR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const RAW = path.join(AKAR, 'data-panen/orang/raw/pakar_oa');
const KELUAR_JSONL = path.join(AKAR, 'data-panen/orang/pakar.jsonl');
const KELUAR_INDUK = path.join(AKAR, 'data-panen/potret/anggota/induk.json');
const BASE = 'https://api.openalex.org';
const TAHUN_MIN = 2015, MIN_KARYA = 3, JEDA_MS = 400;

// kode K16 -> frasa pencarian judul/abstrak (tanda kutip = frasa)
export const KATEGORI = {
  surya: ['"solar photovoltaic"', '"solar cell"', '"solar energy"', '"solar PV"', '"photovoltaic system"', '"solar panel"', '"solar power"'],
  bayu: ['"wind turbine"', '"wind energy"', '"wind power"', '"wind farm"'],
  hidro: ['"hydropower"', '"micro hydro"', '"microhydro"', '"pico hydro"', '"hydroelectric"'],
  'panas-bumi': ['"geothermal"'],
  bioenergi: ['"biofuel"', '"biodiesel"', '"bioethanol"', '"bioenergy"', '"biogas"', '"biomethane"', '"bio-oil"'],
  'biomassa-sampah': ['"biomass energy"', '"biomass gasification"', '"waste to energy"', '"waste-to-energy"', '"co-firing"', '"biomass pellet"', '"municipal solid waste" energy'],
  hidrogen: ['"hydrogen production"', '"green hydrogen"', '"hydrogen energy"', '"fuel cell"', '"electrolyzer"'],
  penyimpanan: ['"energy storage"', '"lithium-ion battery"', '"battery energy storage"', '"supercapacitor"', '"pumped hydro storage"'],
  jaringan: ['"smart grid"', '"microgrid"', '"distributed generation"', '"renewable energy integration"', '"rural electrification"'],
  efisiensi: ['"energy efficiency"', '"energy conservation"', '"energy saving"'],
  karbon: ['"carbon capture"', '"CCUS"', '"carbon storage"', '"carbon pricing"', '"carbon trading"'],
  kebijakan: ['"energy policy"', '"energy transition"', '"renewable energy policy"', '"renewable energy development"', '"clean energy"', '"energy security"'],
};
const KODE = Object.keys(KATEGORI);

function baca_kunci() {
  if (process.env.OPENALEX_KEY) return process.env.OPENALEX_KEY;
  try {
    const m = fs.readFileSync(path.join(AKAR, '.dev.vars'), 'utf-8').match(/^OPENALEX_KEY=(.*)$/m);
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
  } catch { return ''; }
}
const KUNCI = baca_kunci();
const SUREL = process.env.OPENALEX_MAILTO || process.env.METI_KONTAK || '';
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)' + (SUREL ? ` mailto:${SUREL}` : '');
const tidur = ms => new Promise(r => setTimeout(r, ms));

async function ambil(url, coba = 0) {
  const u = new URL(url);
  if (KUNCI) u.searchParams.set('api_key', KUNCI);
  if (SUREL) u.searchParams.set('mailto', SUREL);
  let r;
  try { r = await fetch(u, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(90000) }); }
  catch (e) { if (coba < 4) { await tidur(3000 * (coba + 1)); return ambil(url, coba + 1); } throw e; }
  if (r.status === 429) { const w = Number(r.headers.get('retry-after')) || 10 * (coba + 1); if (coba < 6) { await tidur(w * 1000); return ambil(url, coba + 1); } }
  if (r.status >= 500 && coba < 4) { await tidur(3000 * (coba + 1)); return ambil(url, coba + 1); }
  if (!r.ok) throw new Error(`HTTP ${r.status} ${u.pathname}`);
  await tidur(JEDA_MS);
  return r.json();
}

const idPendek = s => String(s || '').replace('https://openalex.org/', '');

// satu karya OpenAlex -> bentuk ramping untuk disimpan
export function ramping(w) {
  const pen = (w.authorships || []).map(a => ({
    id: idPendek(a.author?.id), nama: a.author?.display_name || '', orcid: a.author?.orcid || '',
    id_inst: (a.institutions || []).filter(i => i.country_code === 'ID').map(i => ({ id: idPendek(i.id), nama: i.display_name, ror: i.ror || '' })),
  })).filter(a => a.id);
  const lok = w.primary_location?.source?.display_name || '';
  const dana = [...new Set([...(w.funders || []).map(f => f.display_name)].filter(Boolean))];
  return { id: idPendek(w.id), judul: w.title || w.display_name || '', tahun: w.publication_year, tgl: w.publication_date || '', sitasi: w.cited_by_count || 0, doi: w.doi || '', venue: lok, dana, topik: (w.topics || []).slice(0, 3).map(t => t.display_name), pen };
}

async function tarik(maksHal) {
  fs.mkdirSync(RAW, { recursive: true });
  for (const kode of KODE) {
    const st = path.join(RAW, kode + '.state.json'), jl = path.join(RAW, kode + '.jsonl');
    let s = fs.existsSync(st) ? JSON.parse(fs.readFileSync(st, 'utf-8')) : { cursor: '*', hal: 0, selesai: false };
    if (s.selesai) { console.log(kode, 'sudah selesai'); continue; }
    const q = '(' + KATEGORI[kode].join(' OR ') + ')';
    while (s.hal < maksHal) {
      const url = `${BASE}/works?filter=${encodeURIComponent(`authorships.institutions.country_code:ID,publication_year:>${TAHUN_MIN - 1},title_and_abstract.search:${q}`.replace(/,/g, ',')).replace(/%2C/g, ',').replace(/%3A/g, ':')}&per-page=200&cursor=${encodeURIComponent(s.cursor)}&select=id,title,publication_year,publication_date,cited_by_count,doi,primary_location,authorships,funders,topics`;
      const j = await ambil(url);
      const hasil = j.results || [];
      if (hasil.length) fs.appendFileSync(jl, hasil.map(w => JSON.stringify(ramping(w))).join('\n') + '\n');
      s.hal++; s.cursor = j.meta?.next_cursor; s.total = j.meta?.count;
      if (!s.cursor || !hasil.length) s.selesai = true;
      fs.writeFileSync(st, JSON.stringify(s));
      console.log(kode, 'hal', s.hal, 'dari ~', Math.ceil((s.total || 0) / 200));
      if (s.selesai) break;
    }
    if (!s.selesai) { s.selesai = true; fs.writeFileSync(st, JSON.stringify(s)); } // tercapai batas halaman: dianggap cukup
  }
}

// Agregasi: karya ramping (dengan kategori) -> penulis Indonesia dengan >= MIN_KARYA karya EBET
export function agregasi(karya, minKarya = MIN_KARYA) {
  const A = new Map();
  for (const w of karya.values()) {
    for (const p of w.pen) {
      if (!p.id_inst.length) continue; // hanya penulis berafiliasi Indonesia pada karya ini
      let a = A.get(p.id);
      if (!a) { a = { id: p.id, nama: p.nama, orcid: '', karya: [], kat: {}, inst: {}, ko: {}, dana: {}, topik: {} }; A.set(p.id, a); }
      a.karya.push(w);
      if (p.orcid) a.orcid = p.orcid;
      for (const k of w.kat) a.kat[k] = (a.kat[k] || 0) + 1;
      for (const i of p.id_inst) { const e = a.inst[i.id] || (a.inst[i.id] = { ...i, n: 0 }); e.n++; }
      for (const q of w.pen) if (q.id !== p.id) { const e = a.ko[q.id] || (a.ko[q.id] = { id: q.id, nama: q.nama, n: 0 }); e.n++; }
      for (const d of w.dana) a.dana[d] = (a.dana[d] || 0) + 1;
      for (const t of w.topik) a.topik[t] = (a.topik[t] || 0) + 1;
    }
  }
  const atas = (o, n) => Object.values(o).sort((x, y) => y.n - x.n || String(x.nama).localeCompare(String(y.nama))).slice(0, n);
  return [...A.values()].filter(a => a.karya.length >= minKarya).map(a => {
    const kat = Object.entries(a.kat).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, 3);
    const ringkas = w => ({ judul: w.judul, tahun: w.tahun, sitasi: w.sitasi, doi: w.doi, venue: w.venue });
    const pt = {};
    for (const w of a.karya) pt[w.tahun] = (pt[w.tahun] || 0) + 1;
    return {
      openalex_id: a.id, nama: a.nama, orcid: a.orcid,
      inst: atas(a.inst, 1)[0],
      kepakaran: kat.map(([kode, n], i) => ({ kode, karya: n, utama: i === 0 })),
      karya_ebet: a.karya.length, sitasi_ebet: a.karya.reduce((s, w) => s + w.sitasi, 0), ebet_per_tahun: pt,
      top_karya: [...a.karya].sort((x, y) => y.sitasi - x.sitasi).slice(0, 5).map(ringkas),
      karya_terbaru: [...a.karya].sort((x, y) => (y.tgl || '').localeCompare(x.tgl || '') || y.sitasi - x.sitasi).slice(0, 5).map(ringkas),
      ko_penulis: atas(a.ko, 8).map(({ id, nama, n }) => ({ openalex_id: id, nama, karya_bersama: n })),
      pendana: Object.entries(a.dana).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, 5).map(([nama, n]) => ({ nama, karya: n })),
      topik: Object.entries(a.topik).sort((x, y) => y[1] - x[1]).slice(0, 3).map(x => x[0]),
    };
  }).sort((x, y) => y.karya_ebet - x.karya_ebet || y.sitasi_ebet - x.sitasi_ebet || x.openalex_id.localeCompare(y.openalex_id));
}

function bacaKarya() {
  const karya = new Map();
  for (const kode of KODE) {
    const jl = path.join(RAW, kode + '.jsonl');
    if (!fs.existsSync(jl)) continue;
    for (const baris of fs.readFileSync(jl, 'utf-8').split('\n')) {
      if (!baris) continue;
      const w = JSON.parse(baris);
      const ada = karya.get(w.id) || (karya.set(w.id, { ...w, kat: [] }), karya.get(w.id));
      if (!ada.kat.includes(kode)) ada.kat.push(kode);
    }
  }
  return karya;
}

async function lotPerLot(ids, titik, select) {
  const hasil = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const j = await ambil(`${BASE}/${titik}?filter=openalex:${ids.slice(i, i + 50).join('|')}&per-page=100&select=${select}`);
    for (const r of j.results || []) hasil.set(idPendek(r.id), r);
  }
  return hasil;
}

async function gabung(maks) {
  const karya = bacaKarya();
  let daftar = agregasi(karya).slice(0, Math.round(maks * 1.3)); // cadangan untuk yang gugur
  console.log('karya unik', karya.size, 'penulis >=', MIN_KARYA, ':', daftar.length);
  const pen = await lotPerLot(daftar.map(a => a.openalex_id), 'authors', 'id,display_name,orcid,works_count,cited_by_count,summary_stats,counts_by_year,last_known_institutions,affiliations');
  const instIds = [...new Set(daftar.map(a => a.inst?.id).filter(Boolean))];
  const inst = await lotPerLot(instIds, 'institutions', 'id,display_name,ror,geo,type');
  const diperiksa = new Date().toISOString().slice(0, 10);
  const tahunIni = new Date().getUTCFullYear();
  const baris = [];
  for (const a of daftar) {
    const p = pen.get(a.openalex_id) || {}, i = inst.get(a.inst?.id) || {};
    const th = Object.fromEntries((p.counts_by_year || []).map(c => [c.year, c.works_count]));
    baris.push({
      openalex_id: a.openalex_id, nama: p.display_name || a.nama,
      afiliasi: { nama: a.inst.nama, ror: i.ror || a.inst.ror || '', kota: i.geo?.city || '', provinsi: i.geo?.region || '', jenis: i.type || '' },
      kepakaran: a.kepakaran, karya_ebet: a.karya_ebet, sitasi_ebet: a.sitasi_ebet,
      works_count: p.works_count ?? a.karya_ebet, cited_by_count: p.cited_by_count ?? a.sitasi_ebet, h_index: p.summary_stats?.h_index ?? 0,
      per_tahun: Array.from({ length: 10 }, (_, k) => { const t = tahunIni - 9 + k; return { tahun: t, ebet: a.ebet_per_tahun[t] || 0, semua: th[t] || 0 }; }),
      top_karya: a.top_karya, karya_terbaru: a.karya_terbaru, ko_penulis: a.ko_penulis, pendana: a.pendana, topik: a.topik,
      orcid: (p.orcid || a.orcid || '').replace('https://orcid.org/', ''),
      sumber_url: 'https://openalex.org/' + a.openalex_id, tanggal_periksa: diperiksa, tingkat_bukti: 'cuplikan',
    });
  }
  baris.sort((x, y) => y.karya_ebet - x.karya_ebet || y.sitasi_ebet - x.sitasi_ebet || x.openalex_id.localeCompare(y.openalex_id));
  const akhir = baris.slice(0, maks);
  fs.mkdirSync(path.dirname(KELUAR_JSONL), { recursive: true });
  fs.mkdirSync(path.dirname(KELUAR_INDUK), { recursive: true });
  fs.writeFileSync(KELUAR_JSONL, akhir.map(b => JSON.stringify(b)).join('\n') + '\n', 'utf-8');
  fs.writeFileSync(KELUAR_INDUK, JSON.stringify(keInduk(akhir, diperiksa)), 'utf-8');
  const per = {}; for (const b of akhir) { const k = b.kepakaran[0].kode; per[k] = (per[k] || 0) + 1; }
  const pi = {}; for (const b of akhir) pi[b.afiliasi.nama] = (pi[b.afiliasi.nama] || 0) + 1;
  console.log('pakar', akhir.length, 'utama per K16', JSON.stringify(per));
  console.log('top institusi', JSON.stringify(Object.entries(pi).sort((x, y) => y[1] - x[1]).slice(0, 10)));
}

// bentuk induk.json persis data/contoh/induk.json: baris [id,nama,kampus,[sektor],h,karya,sitasi,orcid,[topik],foto,idSinta,prodi,subjek,status,logo]
export function keInduk(baris, diperiksa) {
  return {
    sumber: { url: 'https://openalex.org', jenis: 'data-terbuka', diperiksa },
    sektor: KODE.filter(k => k !== 'kebijakan').concat(['kebijakan']),
    orang: baris.map(b => [b.openalex_id, b.nama, b.afiliasi.nama, b.kepakaran.map(k => k.kode), b.h_index, b.works_count, b.cited_by_count, b.orcid, b.topik, '', '', '', '', 'x', '']),
  };
}

function selftest() {
  const w = (id, kat, pen, th = 2020, c = 1) => ({ id, judul: id, tahun: th, tgl: `${th}-01-01`, sitasi: c, doi: '', venue: 'V', dana: ['F1'], topik: ['T'], kat, pen });
  const P = (id, inst = true) => ({ id, nama: id, orcid: '', id_inst: inst ? [{ id: 'I1', nama: 'Univ', ror: '' }] : [] });
  const m = new Map([['W1', w('W1', ['surya', 'bayu'], [P('A1'), P('A2')])], ['W2', w('W2', ['surya'], [P('A1'), P('A2', false)], 2022, 5)], ['W3', w('W3', ['surya'], [P('A1')], 2024, 9)], ['W4', w('W4', ['hidro'], [P('A2')])]]);
  const r = agregasi(m);
  assert.equal(r.length, 1); // A2 hanya 2 karya ber-afiliasi ID (W2 tanpa institusi ID)
  assert.equal(r[0].openalex_id, 'A1'); assert.equal(r[0].kepakaran[0].kode, 'surya'); assert.equal(r[0].kepakaran[0].utama, true);
  assert.equal(r[0].top_karya[0].judul, 'W3'); assert.equal(r[0].karya_terbaru[0].judul, 'W3');
  assert.equal(r[0].ko_penulis[0].openalex_id, 'A2'); assert.equal(r[0].pendana[0].nama, 'F1');
  const k = keInduk([{ openalex_id: 'A1', nama: 'x', afiliasi: { nama: 'U' }, kepakaran: [{ kode: 'surya' }], h_index: 1, works_count: 2, cited_by_count: 3, orcid: '', topik: ['t'] }], '2026-11-07');
  assert.equal(k.orang[0].length, 15);
  const contoh = JSON.parse(fs.readFileSync(path.join(AKAR, 'data/contoh/induk.json'), 'utf-8'));
  assert.equal(k.orang[0].length, contoh.orang[0].length); assert.deepEqual(Object.keys(k), Object.keys(contoh));
  console.log('selftest ok');
}

const arg = n => (process.argv.find(a => a.startsWith('--' + n + '=')) || '').split('=')[1];
if (process.argv.includes('--selftest')) selftest();
else if (import.meta.url === 'file://' + process.argv[1]) {
  if (!KUNCI) console.error('peringatan: OPENALEX_KEY kosong, laju terbatas');
  const hanyaGabung = process.argv.includes('--gabung'), hanyaTarik = process.argv.includes('--tarik');
  if (!hanyaGabung) await tarik(Number(arg('maks-hal')) || 30);
  if (!hanyaTarik) await gabung(Number(arg('maks')) || 2000);
}
