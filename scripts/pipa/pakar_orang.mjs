// Perkaya orang.json dengan identitas akademik publik OpenAlex (CC0): openalex_id, orcid, afiliasi, bidang, jumlah karya, h-index.
//   node scripts/pipa/pakar_orang.mjs --cari       cari nama (bergelar Prof/Dr/PhD) di OpenAlex /authors; hasil di-cache data-panen/orang/raw/pakar/orang_cari.json
//   node scripts/pipa/pakar_orang.mjs terapkan     cocokkan orang.json dengan pakar.jsonl + cache; isi orang.akademik (tanpa jaringan)
//   node scripts/pipa/pakar_orang.mjs --selftest
// Cocok = nama persis (tanpa gelar, >= 2 kata) DAN afiliasi OpenAlex beririsan dengan organisasi orang itu (kata nama lembaga, sinonim ID/EN);
// nama persis tanpa irisan afiliasi -> dilewati (bisa orang lain). Tanpa kontak pribadi. Dipanggil juga oleh potret.mjs.
// Sopan: UA METI, jeda 2,1 dtk, 429/403 berhenti. OPENALEX_KEY dari env bila ada (tidak dicetak).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { normNama } from './foto_orang_gabung.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const PAKAR = path.join(ROOT, 'data-panen/orang/pakar.jsonl'), CACHE = path.join(ROOT, 'data-panen/orang/raw/pakar/orang_cari.json');
const SINONIM = [[/\besdm\b/g, 'energi sumber daya mineral'], [/institute of technology/g, 'institut teknologi'], [/\buniversity of\b/g, 'universitas'], [/\buniversity\b/g, 'universitas'], [/state\b/g, 'negeri'], [/\bgadjah mada\b/g, 'gadjah mada ugm'], [/bandung institute/g, 'institut teknologi bandung itb'], [/\bpln\b/g, 'pln perusahaan listrik negara'], [/\bpertamina\b/g, 'pertamina'], [/kementerian energi dan sumber daya mineral/g, 'kementerian energi sumber daya mineral'], [/\bdan\b|\bof\b|\bthe\b|\bpt\b|\btbk\b|\bpersero\b/g, ' ']];
const tok = (s) => { let t = ' ' + String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ') + ' '; for (const [re, r] of SINONIM) t = t.replace(re, ' ' + r + ' '); return new Set(t.split(' ').filter((x) => x.length > 2 && !['institut', 'universitas', 'indonesia', 'negeri', 'badan', 'republik'].includes(x) || /^(itb|ugm|ipb|its)$/.test(x))); };
export const irisan = (a, b) => { const A = tok(a), B = tok(b); return [...A].filter((x) => B.has(x)).length >= 1; };
const orgOrang = (o) => [o.organisasi_terkini, ...(o.jabatan || []).map((j) => j.organisasi)].filter(Boolean).join(' ; ');

export function akademikDari(p, tgl, tinjau) {
  const bidang = (p.kepakaran || []).filter((k) => k.kode && k.kode !== 'umum').sort((a, b) => b.karya - a.karya).slice(0, 3).map((k) => k.kode);
  return { openalex_id: p.openalex_id, orcid: p.orcid || null, afiliasi: p.afiliasi?.institusi || null, bidang, karya_ebet: p.karya_ebet_2015 ?? null, karya: p.karya ?? null, sitasi: p.sitasi ?? null, h_index: p.h_index ?? null, perlu_tinjau: tinjau, sumber_url: 'https://openalex.org/authors/' + p.openalex_id, tanggal_periksa: p.diperiksa || tgl, tingkat_bukti: 'via-pihak-ketiga', lisensi: 'CC0 (OpenAlex)' };
}
/** Mengisi o.akademik (tidak menimpa yang ada). Nama ambigu (>1 pakar) dilewati. Mengembalikan {baru, tinjau}. */
export function gabung(orang, pakar, tgl) {
  const per = new Map(); for (const p of pakar) { const k = normNama(p.nama); if (k.includes(' ')) (per.get(k) || per.set(k, []).get(k)).push(p); }
  let baru = 0;
  for (const o of orang) {
    if (o.akademik) continue; const c = per.get(normNama(o.nama)); if (!c) continue;
    const cocok = c.filter((p) => irisan(p.afiliasi?.institusi, orgOrang(o)));
    if (cocok.length !== 1) continue;   // nama sama tanpa irisan afiliasi = bisa orang lain: tidak diterbitkan
    o.akademik = akademikDari(cocok[0], tgl, false); baru++;
  }
  return { baru };
}
export function muatPakar() {
  const a = fs.existsSync(PAKAR) ? fs.readFileSync(PAKAR, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
  const c = fs.existsSync(CACHE) ? Object.values(JSON.parse(fs.readFileSync(CACHE, 'utf8'))).flat() : [];
  const ada = new Set(a.map((p) => p.openalex_id)); return [...a, ...c.filter((p) => !ada.has(p.openalex_id))];
}
async function cari(tgl) {
  const orang = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/orang.json'), 'utf8')).baris;
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
  const sudah = new Set(muatPakar().map((p) => normNama(p.nama)));
  const kand = orang.filter((o) => !o.akademik && /\b(prof|dr|ph\.?d)\b/i.test(o.gelar || o.nama || '') && !sudah.has(normNama(o.nama)) && normNama(o.nama).includes(' ') && !(normNama(o.nama) in cache));
  console.error('kandidat', kand.length); let n = 0;
  for (const o of kand) {
    await new Promise((r) => setTimeout(r, 2100));
    const u = 'https://api.openalex.org/authors?' + new URLSearchParams({ search: normNama(o.nama), per_page: '5', select: 'id,display_name,orcid,works_count,cited_by_count,summary_stats,last_known_institutions,topics', ...(process.env.OPENALEX_KEY ? { api_key: process.env.OPENALEX_KEY } : {}) });
    const r = await fetch(u, { headers: { 'User-Agent': UA } });
    if (r.status === 403 || r.status === 429) { console.error('berhenti', r.status); break; }
    if (!r.ok) continue;
    cache[normNama(o.nama)] = ((await r.json()).results || []).filter((a) => normNama(a.display_name) === normNama(o.nama) && (a.last_known_institutions || [])[0]?.country_code === 'ID').map((a) => ({ openalex_id: a.id.split('/').pop(), nama: a.display_name, orcid: (a.orcid || '').split('/').pop() || null, afiliasi: { institusi: a.last_known_institutions[0].display_name }, kepakaran: [], karya_ebet_2015: null, karya: a.works_count, sitasi: a.cited_by_count, h_index: a.summary_stats?.h_index ?? null, diperiksa: tgl }));
    n++;
  }
  fs.mkdirSync(path.dirname(CACHE), { recursive: true }); fs.writeFileSync(CACHE, JSON.stringify(cache)); console.error('dicari', n);
}
function selftest() {
  assert(irisan('Kementerian Energi dan Sumber Daya Mineral', 'Kementerian ESDM')); assert(irisan('Bandung Institute of Technology', 'Institut Teknologi Bandung'));
  assert(!irisan('Udayana University', 'Kementerian ESDM'));
  const o = [{ nama: 'Dr. Dadan Kusdiana', organisasi_terkini: 'Kementerian ESDM' }, { nama: 'Budi Santoso', organisasi_terkini: 'PLN' }, { nama: 'Satu' }];
  const p = [{ openalex_id: 'A1', nama: 'Dadan Kusdiana', afiliasi: { institusi: 'Kementerian Energi dan Sumber Daya Mineral' }, kepakaran: [{ kode: 'umum', karya: 9 }, { kode: 'surya', karya: 2 }], h_index: 11, karya: 40 }, { openalex_id: 'A2', nama: 'Budi Santoso', afiliasi: { institusi: 'Udayana University' } }];
  const r = gabung(o, p, '2026-11-08'); assert.deepEqual(r, { baru: 1 });
  assert.equal(o[0].akademik.perlu_tinjau, false); assert.deepEqual(o[0].akademik.bidang, ['surya']); assert(!o[1].akademik && !o[2].akademik);
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tgl = process.env.TANGGAL_BANGUN || new Date().toISOString().slice(0, 10);
  if (process.argv.includes('--selftest')) selftest();
  else if (process.argv.includes('--cari')) await cari(tgl);
  else if (process.argv.includes('terapkan')) {
    const f = path.join(ROOT, 'public/data/orang.json'), d = JSON.parse(fs.readFileSync(f, 'utf8'));
    const r = gabung(d.baris, muatPakar(), tgl); fs.writeFileSync(f, JSON.stringify(d)); console.log(r);
  } else console.log('pakai: --cari | terapkan | --selftest');
}
