#!/usr/bin/env node
// Panen akar rumput EBET: organisasi mahasiswa (SRE, DEM, himpunan energi, BEM) dan tokoh/aktivis daerah. Node stdlib saja.
//   --selftest | --ambil=URL[,URL] | --teks=URL [--mulai= --maks=] | --tautan=URL [--cari=regex] | --bangun | --statistik
// Etika: UA jujur, jeda >= 2 dtk, robots dicek, 403/429 = berhenti. Tanpa Instagram/X/LinkedIn: akun sosial hanya sebagai `tautan` (URL), isinya tidak dipanen.
// Privasi: orang = nama + peran publik + wilayah saja. Surel pribadi/telepon/alamat/NIM/tgl lahir DITOLAK saring(). Surel organisasi boleh (kolom surel_org, domain bukan penyedia gratis pribadi tidak disyaratkan, tapi pola nama.orang@ ditandai).
// Seed: data-panen/akar/seed/*.json = {sumber_url, tanggal_sumber, jenis:'org'|'tokoh', baris:[...]} hasil baca halaman di raw/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const GAP_MS = 2200;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'data-panen/akar');
const RAW = path.join(OUT, 'raw');
const SEED = path.join(OUT, 'seed');
const HARI_INI = new Date().toISOString().slice(0, 10);
const LARANG_HOST = /(^|\.)(instagram|facebook|twitter|x|tiktok|linkedin|1001startup)\.(com|id)$/i;

// ---------- privasi ----------
const POLA = [
  ['surel', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ['telepon', /(?:\+62|\b62|\b0)\s?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,5}\b/],
  ['nik', /\b\d{16}\b/],
  ['nim', /\b(nim|npm)\b\s*:?\s*\d{6,}/i],
  ['tanggal-lahir', /\b(lahir|tgl\.? lahir|born|dob)\b|\b\d{1,2}[-/]\d{1,2}[-/](19|20)\d{2}\b/i],
  ['alamat', /\b(jl\.|jalan)\s+\w+.*\bno\.?\s*\d+/i],
  ['akun-sosial', /(instagram|facebook|twitter|tiktok|linkedin)\.com\/|(?:^|\s)@[a-z0-9_]{3,}\b/i],
];
const BOLEH_ORG = new Set(['nama', 'kategori', 'kampus', 'kota', 'provinsi', 'tingkat', 'induk', 'situs', 'tautan', 'surel_org', 'pengurus', 'program', 'sumber_url', 'tanggal_sumber', 'tanggal_ambil', 'tingkat_bukti', 'catatan']);
const BOLEH_TOKOH = new Set(['nama', 'kelompok', 'peran', 'wilayah', 'organisasi', 'capaian', 'kepakaran', 'sumber_url', 'tanggal_sumber', 'tanggal_ambil', 'tingkat_bukti', 'catatan']);
const KEPAKARAN_OK = new Set(['surya', 'bayu', 'hidro', 'panas-bumi', 'bioenergi', 'biomassa-sampah', 'nuklir', 'hidrogen', 'laut', 'penyimpanan', 'jaringan', 'efisiensi', 'elektrifikasi', 'karbon', 'pembiayaan', 'kebijakan', 'industri', 'transisi-adil', 'riset-data']);
const LEPAS = new Set(['surel_org', 'tautan', 'situs']); // URL/surel organisasi dikecualikan dari pola; diperiksa terpisah
export function saring(rec, boleh) {
  for (const k of Object.keys(rec)) if (!boleh.has(k)) return { ok: false, alasan: `kolom-terlarang:${k}` };
  const cek = (k, v) => { for (const [n, re] of POLA) if (re.test(String(v))) return `${n}:${k}`; return null; };
  for (const [k, v] of Object.entries(rec)) {
    if (v == null || k === 'sumber_url' || LEPAS.has(k)) continue;
    for (const x of Array.isArray(v) ? v : [v]) {
      const s = typeof x === 'object' ? JSON.stringify(Object.fromEntries(Object.entries(x).filter(([kk]) => kk !== 'sumber_url'))) : x;
      const g = cek(k, s); if (g) return { ok: false, alasan: g };
    }
  }
  if (rec.surel_org && /@(gmail|yahoo|outlook|hotmail|icloud)\./i.test(rec.surel_org)) return { ok: false, alasan: 'surel-penyedia-gratis' };
  if (rec.surel_org && /^\d|\./.test(rec.surel_org.split('@')[0]) && !/^(info|humas|sekretariat|contact|kontak|admin|official|hello|halo|bem|dem|sre)/i.test(rec.surel_org)) return { ok: false, alasan: 'surel-tampak-pribadi' };
  for (const u of [rec.situs, rec.tautan, rec.sumber_url].flat().filter(Boolean)) { try { const h = new URL(u).hostname; if (/(^|\.)(1001startup)\./i.test(h)) return { ok: false, alasan: 'host-terlarang' }; } catch { return { ok: false, alasan: 'url-rusak' }; } }
  return { ok: true };
}

// ---------- jaringan ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let terakhir = 0;
const robotsCache = new Map();
const slug = (u) => u.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 120);
async function tunggu(u) {
  const d = Date.now() - terakhir; if (d < GAP_MS) await sleep(GAP_MS - d); terakhir = Date.now();
  return fetch(u, { headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
}
async function robotsOk(u) {
  const { origin, pathname } = new URL(u);
  if (!robotsCache.has(origin)) {
    const aturan = [];
    try {
      const r = await tunggu(origin + '/robots.txt');
      if (r.status === 200) { let ua = false; for (const b of (await r.text()).split(/\r?\n/)) { const m = b.match(/^\s*([a-z-]+)\s*:\s*(.*?)\s*(#.*)?$/i); if (!m) continue; const k = m[1].toLowerCase(); if (k === 'user-agent') ua = m[2] === '*'; else if (ua && k === 'disallow' && m[2]) aturan.push(m[2]); } }
    } catch {}
    robotsCache.set(origin, aturan);
  }
  return !robotsCache.get(origin).some((p) => pathname.startsWith(p.replace(/\*.*$/, '')));
}
const gagalList = [];
const catatGagal = (url, alasan) => { fs.mkdirSync(OUT, { recursive: true }); fs.appendFileSync(path.join(OUT, 'gagal-ambil.log'), JSON.stringify({ url, alasan, tanggal_ambil: HARI_INI }) + '\n'); };
async function ambil(u) {
  fs.mkdirSync(RAW, { recursive: true });
  const f = path.join(RAW, slug(u) + '.html');
  if (fs.existsSync(f)) return f;
  if (LARANG_HOST.test(new URL(u).hostname)) throw new Error('host dilarang (sosmed/1001startup)');
  if (!(await robotsOk(u))) { catatGagal(u, 'robots-tolak'); console.error('ROBOTS-TOLAK', u); return null; }
  const r = await tunggu(u);
  if (r.status === 429) { catatGagal(u, 'http-429'); console.error('BERHENTI 429', u); process.exit(3); }
  if (r.status === 403) { robotsCache.set(new URL(u).origin, ['/']); catatGagal(u, 'http-403-host-dihentikan'); console.error('403 host dihentikan', u); return null; }
  if (r.status !== 200) { catatGagal(u, 'http-' + r.status); console.error('HTTP', r.status, u); return null; }
  fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  return f;
}
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const dec = (s) => s.replace(/&#x([0-9a-f]+);|&#(\d+);|&(\w+);/gi, (m, h, d, n) => h ? String.fromCodePoint(parseInt(h, 16)) : d ? String.fromCodePoint(+d) : (ENT[n] ?? m));
export const teks = (h) => dec(h.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ').replace(/<\/(p|div|li|tr|h\d|br|section|article|td)>|<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t\f\r]+/g, ' ').replace(/\n\s*/g, '\n').trim();

const baca = (f) => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
const tulis = (f, rows) => fs.writeFileSync(f, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
const kunci = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const id = (p, s) => p + '_' + crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);

// ---------- bangun ----------
function bangun() {
  const orgs = new Map(), tokoh = new Map(), gagal = [];
  const tolak = (nama, alasan, u) => gagal.push({ nama, alasan, sumber_url: u, tanggal_ambil: HARI_INI });
  for (const f of fs.existsSync(SEED) ? fs.readdirSync(SEED).filter((x) => x.endsWith('.json')).sort() : []) {
    const S = JSON.parse(fs.readFileSync(path.join(SEED, f), 'utf8'));
    for (const b of S.baris) {
      const u = b.sumber_url ?? S.sumber_url;
      if (b.tolak) { tolak(b.nama, b.tolak, u); continue; }
      if (!u || !/^https?:\/\//.test(u)) { tolak(b.nama, 'tanpa-sumber', u); continue; }
      const dasar = { ...b, sumber_url: u, tanggal_sumber: b.tanggal_sumber ?? S.tanggal_sumber ?? null, tanggal_ambil: HARI_INI };
      if (S.jenis === 'org') {
        const rec = { ...dasar, kategori: 'organisasi-mahasiswa', tingkat_bukti: dasar.tingkat_bukti ?? 'situs-sendiri' };
        const s = saring(rec, BOLEH_ORG); if (!s.ok) { tolak(b.nama, s.alasan, u); continue; }
        if (!rec.nama || !['nasional', 'kampus'].includes(rec.tingkat)) { tolak(b.nama, 'skema', u); continue; }
        const k = kunci(rec.nama + ' ' + (rec.kampus ?? '')); if (orgs.has(k)) continue;
        orgs.set(k, { entitas_id: id('om', k), ...rec });
      } else {
        const rec = { ...dasar, kelompok: 'aktivis-tokoh-daerah', tingkat_bukti: dasar.tingkat_bukti ?? 'cuplikan' };
        const s = saring(rec, BOLEH_TOKOH); if (!s.ok) { tolak(b.nama, s.alasan, u); continue; }
        if (!rec.nama || rec.nama.trim().split(/\s+/).length < 2 || !rec.peran || !rec.wilayah) { tolak(b.nama, 'skema-atau-nama-satu-kata', u); continue; }
        if (!(rec.kepakaran ?? []).every((x) => KEPAKARAN_OK.has(x.kode) && x.bukti && x.sumber_url)) { tolak(b.nama, 'kepakaran-tanpa-bukti', u); continue; }
        if (/via-pihak-ketiga|media/.test(rec.tingkat_bukti) && rec.tingkat_bukti === 'tinggi') rec.tingkat_bukti = 'cuplikan';
        const k = kunci(rec.nama); const ada = tokoh.get(k);
        if (ada) { ada.capaian = [...new Set([...[].concat(ada.capaian ?? []), ...[].concat(rec.capaian ?? [])])]; ada.sumber_tambahan = [...(ada.sumber_tambahan ?? []), u]; continue; }
        tokoh.set(k, { orang_id: id('ot', k), ...rec });
      }
    }
  }
  fs.mkdirSync(OUT, { recursive: true });
  tulis(path.join(OUT, 'organisasi_mahasiswa.jsonl'), [...orgs.values()]);
  tulis(path.join(OUT, 'tokoh.jsonl'), [...tokoh.values()]);
  tulis(path.join(OUT, 'gagal.jsonl'), gagal);
  console.log(JSON.stringify({ organisasi: orgs.size, tokoh: tokoh.size, gagal: gagal.length }));
}

function selftest() {
  const o = { nama: 'HMT', kampus: 'X', tingkat: 'kampus', sumber_url: 'https://a.id/' };
  assert.equal(saring(o, BOLEH_ORG).ok, true);
  assert.equal(saring({ ...o, surel_org: 'info@hmt.ac.id' }, BOLEH_ORG).ok, true);
  assert.equal(saring({ ...o, surel_org: 'budi.santoso@gmail.com' }, BOLEH_ORG).ok, false);
  assert.equal(saring({ ...o, pengurus: [{ nama: 'A B', jabatan: 'Ketua', nim: 'NIM 1234567' }] }, BOLEH_ORG).ok, false);
  assert.equal(saring({ ...o, pengurus: [{ nama: 'A B', jabatan: 'Ketua, 0812-3456-7890' }] }, BOLEH_ORG).ok, false);
  assert.equal(saring({ ...o, foto: 'x' }, BOLEH_ORG).ok, false);
  assert.equal(saring({ ...o, program: 'ikuti @hmt_its' }, BOLEH_ORG).ok, false);
  assert.equal(saring({ ...o, tautan: ['https://instagram.com/hmt'] }, BOLEH_ORG).ok, true);
  assert.equal(saring({ nama: 'A B', peran: 'p', wilayah: 'w', catatan: 'lahir di Solo' }, BOLEH_TOKOH).ok, false);
  console.log('selftest OK');
}

const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=').slice(1).join('=');
if (process.argv.includes('--selftest')) selftest();
else if (process.argv.includes('--bangun')) bangun();
else if (arg('ambil') || arg('daftar')) {
  const daftar = arg('daftar') ? arg('daftar').split(',').flatMap((f) => baca(f).map((r) => r.url)) : arg('ambil').split(',');
  for (const u of [...new Set(daftar)]) {
    try { const f = await ambil(u); if (f) console.log(`ok ${u} (${teks(fs.readFileSync(f, 'utf8')).length} huruf)`); } catch (e) { catatGagal(u, e.cause?.code || e.message); console.error('GAGAL', u, e.cause?.code || e.message); }
  }
} else if (arg('teks')) {
  const t = teks(fs.readFileSync(path.join(RAW, slug(arg('teks')) + '.html'), 'utf8')); const o = +arg('mulai') || 0;
  console.log(t.slice(o, o + (+arg('maks') || 5000)));
} else if (arg('tautan')) {
  const h = fs.readFileSync(path.join(RAW, slug(arg('tautan')) + '.html'), 'utf8'); const b = new URL(arg('tautan')); const re = new RegExp(arg('cari') || '.', 'i');
  for (const m of h.matchAll(/<a\s[^>]*href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi)) { const t = teks(m[2]).replace(/\n/g, ' '); let u; try { u = new URL(m[1], b).href; } catch { continue; } if (re.test(t + ' ' + u)) console.log(t.slice(0, 60), '|', u); }
} else if (process.argv.includes('--statistik')) {
  const o = baca(path.join(OUT, 'organisasi_mahasiswa.jsonl')), t = baca(path.join(OUT, 'tokoh.jsonl')), g = baca(path.join(OUT, 'gagal.jsonl'));
  console.log(JSON.stringify({ organisasi: o.length, nasional: o.filter((x) => x.tingkat === 'nasional').length, tokoh: t.length, gagal: g.length }));
} else console.log('lihat komentar di kepala berkas');
