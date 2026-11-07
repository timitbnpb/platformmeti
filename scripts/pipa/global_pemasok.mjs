// Pustaka bersama modul "global" (SURYA, WTE, dst): panen sopan, Wikidata/Wikipedia, validasi, kelengkapan, gabung ke entitas_tambah.json.
// Tanpa jaringan kecuali fungsi ambil*/wikidata*/wikipedia*/logo*. Tanggal berasal dari parameter, bukan jam, kecuali panen (tanggal ambil).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { idEntitas } from './entitas_tambah.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
export const TINGKAT = new Set(['resmi', 'situs-sendiri', 'kata-pihak', 'cuplikan', 'via-pihak-ketiga', 'kajian']);
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- panen sopan: robots per host, jeda >= 2 dtk per host, berhenti di 403/429 (host ditandai blokir) ----
export class Penambang {
  constructor({ jedaMs = 2000, tmp = null } = {}) { this.jeda = jedaMs; this.terakhir = new Map(); this.robots = new Map(); this.blokir = new Map(); this.tmp = tmp; }
  async #tunggu(host) { const w = this.jeda - (Date.now() - (this.terakhir.get(host) || 0)); if (w > 0) await tidur(w); this.terakhir.set(host, Date.now()); }
  async #robotsOk(u) {
    const { host, pathname, protocol } = new URL(u);
    if (!this.robots.has(host)) {
      let aturan = [];
      try {
        await this.#tunggu(host);
        const r = await fetch(`${protocol}//${host}/robots.txt`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
        if (r.status === 403 || r.status === 429) this.blokir.set(host, r.status);
        else if (r.ok) { let ua = false; for (const b of (await r.text()).split(/\r?\n/)) { const m = /^\s*(user-agent|disallow)\s*:\s*(.*)$/i.exec(b.split('#')[0]); if (!m) continue; if (m[1].toLowerCase() === 'user-agent') ua = m[2].trim() === '*' || /meti/i.test(m[2]); else if (ua && m[2].trim()) aturan.push(m[2].trim()); } }
      } catch { /* robots tak terbaca = tidak ada aturan */ }
      this.robots.set(host, aturan);
    }
    return !this.blokir.has(host) && !this.robots.get(host).some((a) => pathname.startsWith(a));
  }
  /** @returns {Promise<{ok:boolean,status?:number,buf?:Buffer,tipe?:string,alasan?:string}>} */
  async ambil(u, { cekRobots = true } = {}) {
    const host = new URL(u).host;
    if (this.blokir.has(host)) return { ok: false, alasan: 'blokir ' + this.blokir.get(host) };
    if (cekRobots && !(await this.#robotsOk(u))) return { ok: false, alasan: this.blokir.has(host) ? 'blokir ' + this.blokir.get(host) : 'robots' };
    for (let k = 0; k < 2; k++) {
      await this.#tunggu(host);
      try {
        const r = await fetch(u, { headers: { 'user-agent': UA, accept: '*/*' }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
        if (r.status === 403 || r.status === 429) { this.blokir.set(host, r.status); return { ok: false, status: r.status, alasan: 'blokir ' + r.status }; }
        if (!r.ok) { if (r.status >= 500 && k === 0) { await tidur(4000); continue; } return { ok: false, status: r.status, alasan: 'http ' + r.status }; }
        return { ok: true, status: r.status, buf: Buffer.from(await r.arrayBuffer()), tipe: r.headers.get('content-type') || '' };
      } catch (e) { if (k === 1) return { ok: false, alasan: String(e.message || e) }; await tidur(4000); }
    }
  }
  async json(u) { const r = await this.ambil(u, { cekRobots: false }); return r.ok ? JSON.parse(r.buf.toString('utf8')) : null; }
}

// ---- Wikidata / Wikipedia (API terbuka, CC0 / CC BY-SA) ----
const WD = 'https://www.wikidata.org/w/api.php';
const norm = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/** Cari entitas perusahaan di Wikidata: coba tiap istilah, ambil kandidat yang bercirikan perusahaan (situs/kantor pusat/tahun/enwiki) dan labelnya cocok. */
export async function wikidataCari(p, istilah) {
  for (const t of [].concat(istilah)) {
    const j = await p.json(`${WD}?action=wbsearchentities&search=${encodeURIComponent(t)}&language=en&type=item&limit=6&format=json`);
    const ids = (j?.search || []).map((x) => x.id); if (!ids.length) continue;
    const ent = await wikidataEntitas(p, ids); const n = norm(t);
    const skor = (id) => {
      const e = ent[id]; if (!e) return -1;
      if (klaim(e, 'P31').some((v) => ['Q5', 'Q16521', 'Q4167410', 'Q13442814'].includes(v?.id))) return -1; // manusia, taksa, disambiguasi, artikel
      const lab = [e.labels?.en?.value, ...Object.values(e.aliases || {}).flat().map((a) => a.value)].map(norm);
      const cocok = lab.some((l) => l === n || l.startsWith(n + ' ') || n.startsWith(l + ' ') && l.length > 3);
      const ciri = (e.sitelinks?.enwiki ? 3 : 0) + (klaim(e, 'P856').length ? 2 : 0) + (klaim(e, 'P571').length ? 1 : 0) + (klaim(e, 'P159').length ? 1 : 0) + (klaim(e, 'P452').length ? 1 : 0);
      return cocok && ciri >= 2 ? ciri : -1;
    };
    const best = ids.map((id) => [id, skor(id)]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1])[0];
    if (best) return { id: best[0], desc: ent[best[0]].descriptions?.en?.value || '', label: ent[best[0]].labels?.en?.value, istilah: t };
  }
  return null;
}
export async function wikidataEntitas(p, ids) {
  const out = {};
  for (let i = 0; i < ids.length; i += 40) {
    const j = await p.json(`${WD}?action=wbgetentities&ids=${ids.slice(i, i + 40).join('|')}&props=labels|aliases|claims|sitelinks|descriptions&languages=en|id|zh&format=json`);
    Object.assign(out, j?.entities || {});
  }
  return out;
}
export const klaim = (e, prop) => (e?.claims?.[prop] || []).filter((c) => c.rank !== 'deprecated' && c.mainsnak?.datavalue).map((c) => c.mainsnak.datavalue.value);
export async function labelQid(p, ids) { // QID -> label en
  const out = {}; const u = [...new Set(ids)];
  for (let i = 0; i < u.length; i += 40) { const j = await p.json(`${WD}?action=wbgetentities&ids=${u.slice(i, i + 40).join('|')}&props=labels|claims&languages=en&format=json`); for (const [k, v] of Object.entries(j?.entities || {})) out[k] = { label: v.labels?.en?.value, iso2: klaim(v, 'P297')[0] }; }
  return out;
}
export async function wikipediaTeks(p, judul) { // judul[] -> {judul: teks polos penuh}
  const out = {};
  for (let i = 0; i < judul.length; i += 20) {
    const j = await p.json(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&titles=${encodeURIComponent(judul.slice(i, i + 20).join('|'))}&format=json&formatversion=2`);
    const norm = new Map([...(j?.query?.normalized || []), ...(j?.query?.redirects || [])].map((x) => [x.from, x.to]));
    const pages = new Map((j?.query?.pages || []).map((x) => [x.title, x.extract || '']));
    for (const t of judul.slice(i, i + 20)) { let k = t; for (let n = 0; n < 3 && norm.has(k); n++) k = norm.get(k); out[t] = pages.get(k) || ''; }
  }
  return out;
}
export const kalimat = (teks) => teks.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter((s) => s.length > 25 && s.length < 400);
/** kalimat yang cocok regex; maksimum n; dipotong rapi */
export const kutip = (teks, re, n = 2) => kalimat(teks).filter((s) => re.test(s)).slice(0, n);

// ---- logo: Wikidata P154 (Commons Special:FilePath) ----
export const urlLogoCommons = (berkas, lebar = 256) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(berkas.replace(/ /g, '_'))}?width=${lebar}`;

// ---- validasi & kelengkapan ----
export function validasiPerusahaan(p, segmenValid) {
  const s = [];
  if (!p.nama) s.push('nama');
  if (!/^[A-Z]{2}$/.test(p.negara_iso2 || '')) s.push(`${p.nama}: negara_iso2`);
  if (!(p.segmen || []).length || p.segmen.some((x) => !segmenValid.has(x))) s.push(`${p.nama}: segmen`);
  if (p.situs && !/^https:\/\//.test(p.situs)) s.push(`${p.nama}: situs`);
  if (p.tahun_berdiri != null && !(p.tahun_berdiri > 1800 && p.tahun_berdiri < 2030)) s.push(`${p.nama}: tahun_berdiri`);
  if (!(p.sumber || []).length) s.push(`${p.nama}: sumber`);
  for (const x of p.sumber || []) if (!/^https:\/\//.test(x.url || '') || !TINGKAT.has(x.tingkat_bukti) || !x.tanggal_periksa) s.push(`${p.nama}: sumber tak lengkap ${x.url}`);
  for (const f of p.fakta || []) if (!f.medan || !f.sumber_url || !f.tanggal_periksa || !TINGKAT.has(f.tingkat_bukti)) s.push(`${p.nama}: fakta ${f.medan} tanpa sumber/tanggal/tingkat`);
  if (/[—·]/.test(JSON.stringify(p))) s.push(`${p.nama}: em dash/titik tengah`);
  return s;
}
/** persen perusahaan yang punya tiap medan (medan: fungsi p => bool) */
export function kelengkapan(daftar, medan) {
  const o = {}; for (const [k, f] of Object.entries(medan)) o[k] = daftar.length ? Math.round((100 * daftar.filter(f).length) / daftar.length) : 0; return o;
}
export const tulisJson = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 1) + '\n', 'utf8'); };
export const bacaJson = (f, d = null) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);

/** Gabung ke data/direktori/entitas_tambah.json, idempoten: baris ber-`_asal` sama diganti; nama yang sudah ada tanpa _asal dilewati. */
export function gabungEntitasTambah(asal, daftar, { kepakaran, peran, tanggal, berkas = path.join(ROOT, 'data/direktori/entitas_tambah.json') }) {
  const d = bacaJson(berkas);
  const lama = d.baris.filter((b) => b._asal !== asal);
  const ada = new Set(lama.map((b) => idEntitas(b.nama)));
  const baru = [], lewat = [];
  for (const p of daftar) {
    if (ada.has(idEntitas(p.nama))) { lewat.push(p.nama); continue; }
    ada.add(idEntitas(p.nama));
    baru.push({ _asal: asal, nama: p.nama, nama_lain: p.nama_lain || [], kategori: 'internasional', kepakaran, peran_rantai: [...peran, ...(p.segmen || [])], situs: p.situs || undefined,
      sumber: p.sumber.map((s) => ({ url: s.url, tingkat_bukti: s.tingkat_bukti, keterangan: s.keterangan || 'profil perusahaan' })) });
  }
  d.baris = [...lama, ...baru];
  if (!d.tanggal_periksa || d.tanggal_periksa < tanggal) d.tanggal_periksa = tanggal;
  tulisJson(berkas, d);
  return { baru: baru.length, lewat };
}
