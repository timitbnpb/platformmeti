#!/usr/bin/env node
// Pustaka bot panen (K21, DESAIN-TEKNIS penyempurnaan-nov §bot B.3). Satu UA jujur, robots dibaca tiap putaran, jeda per host,
// berhenti di 403/429, tanpa login, tanpa Antara/media sosial, tanpa mengakali blokir.
//   node scripts/panen/_bot.mjs --jadwal harian|mingguan|bulanan|kuartalan|manual [--sumber=a,b] [--paksa] [--kering]
// Satu sumber gagal tidak menggagalkan putaran; hasil per sumber ditulis ke data/bot/status.json (status ok|basi|gagal|blokir|perlu_kunci).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const UA = 'METI-Network-research/0.1 (+https://direktori.metiires.or.id)';
export const STATUS = ['ok', 'basi', 'gagal', 'blokir', 'perlu_kunci'];
export const FREKUENSI = ['harian', 'mingguan', 'bulanan', 'kuartalan', 'tahunan', 'statis'];
export const JADWAL = ['harian', 'mingguan', 'bulanan', 'kuartalan', 'manual'];
const SINYAL = ['etag', 'last_modified', 'panjang', 'hash', 'tanpa'];
const HARI = { harian: 1, mingguan: 7, bulanan: 28, kuartalan: 85, tahunan: 330 };
const JAM_CEK = { harian: 12, mingguan: 72, bulanan: 168, kuartalan: 336, tahunan: 720, statis: 720 };
// Host yang tidak pernah diminta (K21): Antara, media sosial, ESDM One Map, SINTA, SIINAS.
const HITAM = /(^|\.)(antaranews\.com|antara\.co\.id|facebook\.com|instagram\.com|twitter\.com|x\.com|tiktok\.com|threads\.net|linkedin\.com|geoportal\.esdm\.go\.id|sinta\.kemdiktisaintek\.go\.id|sinta\.kemdikbud\.go\.id|siinas\.kemenperin\.go\.id)$/i;

export class GalatBot extends Error {
  constructor(kode, pesan) { super(pesan); this.kode = kode; } // kode: daftar_hitam | robots | blokir | gagal
}
export const hostTerlarang = (host) => HITAM.test(host);

// robots.txt: kelompok agen kita bila ada, selain itu '*'. Pola terpanjang menang, seri = boleh. Mendukung * dan $.
export function bolehRobots(txt, jalur, agen = 'meti-network-research') {
  const grup = []; let cur = null, baruAgen = false;
  for (const g of String(txt || '').split(/\r?\n/)) {
    const i = g.split('#')[0].indexOf(':'); if (i < 0) continue;
    const k = g.split('#')[0].slice(0, i).trim().toLowerCase(), v = g.split('#')[0].slice(i + 1).trim();
    if (k === 'user-agent') { if (!cur || !baruAgen) { cur = { agen: [], aturan: [] }; grup.push(cur); } cur.agen.push(v.toLowerCase()); baruAgen = true; }
    else if ((k === 'disallow' || k === 'allow') && cur) { baruAgen = false; if (v) cur.aturan.push([k, v]); }
    else baruAgen = false;
  }
  const g = grup.find((x) => x.agen.some((a) => a !== '*' && agen.includes(a))) || grup.find((x) => x.agen.includes('*'));
  if (!g) return true;
  let best = null;
  for (const [tipe, pola] of g.aturan) {
    const re = new RegExp('^' + pola.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    if (re.test(jalur) && (!best || pola.length > best[1].length || (pola.length === best[1].length && tipe === 'allow'))) best = [tipe, pola];
  }
  return !best || best[0] === 'allow';
}

// Satu bot = satu putaran: cache robots, jam jeda, dan host terblokir hidup selama objek ini.
export function buatBot({ fetchFn = globalThis.fetch, tidur = (ms) => new Promise((r) => setTimeout(r, ms)), sekarang = () => Date.now(), jedaMs = 2100, jedaLambatMs = 10000, hostLambat = [], retryAfterMaks = 120, backoffMs = 5000 } = {}) {
  const terakhir = new Map(), robots = new Map(), blokir = new Map();
  const tunggu = async (host) => {
    const jeda = hostLambat.includes(host) ? jedaLambatMs : jedaMs;
    if (terakhir.has(host)) await tidur(Math.max(0, jeda - (sekarang() - terakhir.get(host))));
    terakhir.set(host, sekarang());
  };
  const stop = (host, alasan) => { blokir.set(host, alasan); throw new GalatBot('blokir', `${host}: ${alasan}`); };
  async function minta(url, { method = 'GET', headers = {} } = {}, hop = 0) {
    const u = new URL(url);
    for (let coba = 0, tolak429 = false; ; coba++) {
      await tunggu(u.host);
      let r;
      try { r = await fetchFn(url, { method, headers: { 'user-agent': UA, ...headers }, redirect: 'manual' }); }
      catch (e) { if (coba >= 1) throw new GalatBot('gagal', `${u.host}: ${e.message}`); await tidur(backoffMs); continue; }
      if (r.status === 403) stop(u.host, '403, berhenti total');
      if (r.status === 429) {
        const s = Number(r.headers.get('retry-after') || 30);
        if (tolak429 || s > retryAfterMaks) stop(u.host, '429, berhenti');
        tolak429 = true; await tidur(s * 1000); continue;
      }
      if (r.status >= 500) { if (coba >= 1) throw new GalatBot('gagal', `${r.status} ${url}`); await tidur(backoffMs); continue; }
      if ([301, 302, 303, 307, 308].includes(r.status) && r.headers.get('location')) {
        if (hop >= 3) throw new GalatBot('gagal', 'terlalu banyak pengalihan ' + url);
        return ambilSopan(new URL(r.headers.get('location'), url).href, { method, headers }, hop + 1); // tiap lompatan lewat robots dan jeda host baru
      }
      const buf = Buffer.from(await r.arrayBuffer());
      return { status: r.status, ok: r.ok, headers: r.headers, buf, teks: () => buf.toString('utf-8') };
    }
  }
  async function boleh(url) { // daftar hitam, blokir, robots; tanpa mengambil URL-nya sendiri
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol) || hostTerlarang(u.hostname)) throw new GalatBot('daftar_hitam', 'host tidak boleh diminta: ' + u.hostname);
    if (blokir.has(u.host)) throw new GalatBot('blokir', `${u.host}: ${blokir.get(u.host)}`);
    if (!robots.has(u.host)) {
      const r = await minta(u.origin + '/robots.txt');
      if (r.ok) robots.set(u.host, r.teks()); else if (r.status === 404 || r.status === 410) robots.set(u.host, ''); else throw new GalatBot('gagal', `robots.txt ${u.host} ${r.status}`);
    }
    if (!bolehRobots(robots.get(u.host), u.pathname + u.search)) throw new GalatBot('robots', 'robots.txt melarang ' + url);
  }
  async function ambilSopan(url, opsi = {}, hop = 0) { await boleh(url); return minta(url, opsi, hop); }
  return { ambilSopan, boleh, hostBlokir: (h) => blokir.get(h) || null };
}

// Sinyal perubahan murah. null = tak diketahui, jadi sumber dianggap berubah.
export async function bacaSinyal(bot, url, jenis) {
  if (!url || jenis === 'tanpa') return null;
  const r = await bot.ambilSopan(url, { method: jenis === 'hash' ? 'GET' : 'HEAD' });
  if (!r.ok) return null;
  if (jenis === 'etag') return r.headers.get('etag');
  if (jenis === 'last_modified') return r.headers.get('last-modified');
  if (jenis === 'panjang') return r.headers.get('content-length');
  return crypto.createHash('sha256').update(r.buf).digest('hex');
}

export function validasiRegistri(daftar, { akar = ROOT } = {}) {
  const g = [], lihat = new Set();
  if (!Array.isArray(daftar) || !daftar.length) return ['registri bukan larik berisi'];
  for (const s of daftar) {
    const p = (m) => g.push(`${s && s.kode}: ${m}`);
    if (!s || !/^[a-z0-9_]{2,40}$/.test(s.kode || '')) { p('kode tidak sah'); continue; }
    if (lihat.has(s.kode)) p('kode ganda'); lihat.add(s.kode);
    if (!s.nama || !s.host) p('nama/host kosong');
    if (!FREKUENSI.includes(s.frekuensi)) p('frekuensi di luar enum');
    if (!JADWAL.includes(s.jadwal)) p('jadwal di luar enum');
    if (!SINYAL.includes(s.jenis_sinyal)) p('jenis_sinyal di luar enum');
    if (!['otomatis', 'semi_manual'].includes(s.mode)) p('mode di luar enum');
    if (!['aliran', 'rilisan'].includes(s.jenis_waktu)) p('jenis_waktu di luar enum');
    if (!STATUS.includes(s.status)) p('status di luar enum');
    if (!Array.isArray(s.dataset) || typeof s.utama !== 'boolean') p('dataset/utama salah bentuk');
    if (s.butuh_kunci != null && !/^[A-Z0-9_]+$/.test(s.butuh_kunci)) p('butuh_kunci salah bentuk');
    if (s.jenis_sinyal !== 'tanpa' && !s.url_sinyal) p('jenis_sinyal tanpa url_sinyal');
    if (s.url_sinyal) { try { const u = new URL(s.url_sinyal); if (u.protocol !== 'https:') p('url_sinyal bukan https'); if (hostTerlarang(u.hostname)) p('url_sinyal di daftar hitam'); if (u.hostname !== s.host) p('url_sinyal beda host dari host'); } catch { p('url_sinyal bukan URL'); } }
    if (hostTerlarang(s.host)) p('host di daftar hitam');
    if (s.skrip && !fs.existsSync(path.join(akar, s.skrip))) p('skrip tidak ada: ' + s.skrip);
  }
  return g;
}

export const bacaRegistri = (berkas = path.join(ROOT, 'data/sumber_jadwal.json')) => JSON.parse(fs.readFileSync(berkas, 'utf-8')).sumber;
export const bacaStatus = (berkas) => (fs.existsSync(berkas) ? JSON.parse(fs.readFileSync(berkas, 'utf-8')).sumber || {} : {});
export function tulisStatus(berkas, st) {
  const urut = Object.fromEntries(Object.keys(st).sort().map((k) => [k, st[k]]));
  fs.mkdirSync(path.dirname(berkas), { recursive: true });
  fs.writeFileSync(berkas, JSON.stringify({ sumber: urut }, null, 2) + '\n', 'utf-8');
}
export function catat(st, kode, status, rinci, kini, { ambil = false, sinyal } = {}) {
  const lama = st[kode] || {};
  const b = { ...lama, status, rinci: scrub(rinci || '').slice(0, 300), dicek: kini };
  b.gagal_beruntun = status === 'gagal' ? (lama.gagal_beruntun || 0) + 1 : status === 'ok' ? 0 : lama.gagal_beruntun || 0;
  if (ambil) b.diambil = kini;
  if (sinyal != null) b.sinyal = sinyal;
  st[kode] = b;
}
export const jatuhTempo = (s, lama, kini) => {
  if (s.frekuensi === 'statis') return false;
  if (!lama || !lama.diambil) return true;
  return (Date.parse(kini) - Date.parse(lama.diambil)) / 864e5 >= HARI[s.frekuensi];
};
export const bangunDenyut = (daftar) => daftar.map((s) => ({ kode: s.kode, nama: s.nama, host: s.host, url_sinyal: s.url_sinyal || null, jenis_sinyal: s.jenis_sinyal, frekuensi: s.frekuensi, interval_cek_jam: JAM_CEK[s.frekuensi], robots_boleh: s.robots_boleh }));

// Buang rahasia dari teks keluaran: nilai env berkunci (KUNCI/KEY/TOKEN/SECRET/PASSWORD) dan parameter ?key=/token= di URL.
export const scrub = (t) => Object.entries(process.env).filter(([k, v]) => v && v.length > 5 && /KUNCI|KEY|TOKEN|SECRET|PASSWORD/i.test(k)).reduce((a, [, v]) => a.split(v).join('***'), String(t))
  .replace(/([?&;](?:api[_-]?key|key|token|access[_-]?token|auth|secret|password|kunci|sig|signature)=)[^&\s"'<>]+/gi, '$1***');
export const jalankanSkrip = (s, kini, menit = 20) => new Promise((ok) => {
  const cmd = s.skrip.endsWith('.py') ? 'python3' : process.execPath;
  execFile(cmd, [path.join(ROOT, s.skrip), ...(s.args || [])], { cwd: ROOT, timeout: menit * 6e4, maxBuffer: 8e6, env: { ...process.env, TANGGAL_BANGUN: kini } }, (e, so, se) => {
    ok({ kode: e ? (typeof e.code === 'number' ? e.code : 1) : 0, teks: scrub((se || so || (e && e.message) || '').trim().split('\n').slice(-2).join(' ')) });
  });
});

// Satu putaran. Mengembalikan { hasil, isu } dan menulis status; tidak melempar karena satu sumber.
export async function jalankan({ jadwal, sumber, kini, paksa = false, kering = false, env = process.env, registri, berkasStatus = path.join(ROOT, 'data/bot/status.json'), bot = buatBot(), jalan = jalankanSkrip, log = () => {} }) {
  const daftar = registri || bacaRegistri(), st = bacaStatus(berkasStatus), hasil = [];
  const pilih = daftar.filter((s) => (sumber && sumber.length ? sumber.includes(s.kode) : s.jadwal === jadwal));
  for (const s of pilih) {
    const lama = st[s.kode], cat = (status, rinci, o) => { if (!kering) catat(st, s.kode, status, rinci, kini, o); hasil.push({ kode: s.kode, status, rinci }); log(`${s.kode}: ${status} ${rinci || ''}`); };
    try {
      if (lama && lama.status === 'blokir') { hasil.push({ kode: s.kode, status: 'blokir', rinci: 'menunggu tinjauan orang' }); continue; } // diam sampai orang menghapus blokir
      if (s.butuh_kunci && !env[s.butuh_kunci]) { cat('perlu_kunci', `${s.butuh_kunci} belum dipasang`); continue; }
      if (!paksa && !jatuhTempo(s, lama, kini)) continue;
      if (!s.skrip) { cat('basi', 'skrip belum ada'); continue; }
      if (kering) { hasil.push({ kode: s.kode, status: 'jatuh_tempo', rinci: s.skrip }); continue; }
      await bot.boleh(s.url_sinyal || `https://${s.host}/`); // robots dibaca tiap putaran; melarang = blokir, tidak dipaksa
      const sinyalBaru = await bacaSinyal(bot, s.url_sinyal, s.jenis_sinyal);
      if (!paksa && sinyalBaru != null && lama && lama.sinyal === sinyalBaru) { cat('ok', 'sinyal tak berubah, tidak diunduh', { sinyal: sinyalBaru }); continue; }
      const r = await jalan(s, kini);
      if (r.kode === 0) cat('ok', r.teks, { ambil: true, sinyal: sinyalBaru });
      else if (r.kode === 2) cat('blokir', r.teks || 'skrip berhenti: robots/403/429'); // konvensi skrip panen: exit 2 = dilarang, jangan dipaksa
      else cat('gagal', `exit ${r.kode} ${r.teks}`);
    } catch (e) {
      if (e instanceof GalatBot && ['robots', 'blokir', 'daftar_hitam'].includes(e.kode)) cat('blokir', e.message);
      else cat('gagal', e.message);
    }
  }
  if (!kering) tulisStatus(berkasStatus, st);
  const isu = Object.keys(st).filter((k) => st[k].gagal_beruntun >= 3 && st[k].status === 'gagal').sort();
  return { hasil, isu };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), nilai = (k) => { const i = a.findIndex((x) => x === k || x.startsWith(k + '=')); return i < 0 ? null : a[i].includes('=') ? a[i].split('=')[1] : a[i + 1]; };
  const jadwal = nilai('--jadwal'), sumber = (nilai('--sumber') || '').split(',').map((x) => x.trim()).filter(Boolean);
  const galat = validasiRegistri(bacaRegistri());
  if (galat.length) { console.error('registri rusak:\n' + galat.join('\n')); process.exit(1); }
  if (!JADWAL.includes(jadwal) && !sumber.length) { console.error('pakai --jadwal harian|mingguan|bulanan|kuartalan|manual atau --sumber=kode'); process.exit(1); }
  const kini = process.env.TANGGAL_BANGUN || new Date().toISOString().slice(0, 10);
  const { hasil, isu } = await jalankan({ jadwal, sumber, kini, paksa: a.includes('--paksa'), kering: a.includes('--kering'), log: console.log });
  console.log(`bot ${jadwal || 'sumber'}: ${hasil.length} sumber diproses, ${hasil.filter((h) => h.status === 'gagal').length} gagal, isu 3-gagal: ${isu.join(',') || '-'}`);
}
