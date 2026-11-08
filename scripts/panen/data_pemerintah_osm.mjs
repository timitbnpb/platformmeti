#!/usr/bin/env node
// Lengkapi public/geo/transmisi.json dan gardu.json dari OSM (Overpass, host pipa/data_transmisi.mjs) untuk ubin yang belum terpanen,
// lalu saring objek di luar Indonesia (Malaysia, Brunei, Timor Leste, PNG) dengan titik-dalam-poligon batas (public/geo/luar-indonesia.json).
//   PEMERINTAH_MENTAH=<dir> node scripts/panen/data_pemerintah_osm.mjs ambil     -> <dir>/osm/u_S_W_N_E.json (sopan: satu kueri, jeda, berhenti 403)
//   PEMERINTAH_MENTAH=<dir> node scripts/panen/data_pemerintah_osm.mjs gabung     -> perbarui public/geo/{transmisi,gardu}.json (tanpa jaringan)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UA, HOST, WILAYAH, kueri, bangun } from '../pipa/data_transmisi.mjs';
import { pembatasIndonesia, luarNegeri } from './data_pemerintah_lib.mjs';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const MENTAH = (process.env.PEMERINTAH_MENTAH || AKAR + 'data/pemerintah_mentah/').replace(/\/?$/, '/') + 'osm/';
const baca = (f) => JSON.parse(fs.readFileSync(AKAR + f, 'utf8'));
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const sama = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

/** Ubin WILAYAH yang belum ada di cakupan_bbox berkas yang sudah terbit. */
export function ubinBaru(cakupan) { return Object.values(WILAYAH).filter((b) => !cakupan.some((c) => sama(c, b))); }

/** Ubin belum terpanen dibelah empat (server publik lambat untuk ubin besar), sub-ubin tanpa simpul batas Indonesia (laut/negara lain) dibuang. */
export function ubinDarat(cakupan, luar) {
  const v = luar.geometry.coordinates.flatMap((p) => p.slice(1).flat());
  return ubinBaru(cakupan).flatMap(([s, w, n, e]) => { const ms = (s + n) / 2, mw = (w + e) / 2; return [[s, w, ms, mw], [s, mw, ms, e], [ms, w, n, mw], [ms, mw, n, e]]; })
    .filter(([s, w, n, e]) => v.some(([x, y]) => x >= w && x <= e && y >= s && y <= n));
}

/** Gabung berkas lama + elemen baru, buang yang di luar Indonesia; id lama menang. Murni (uji). */
export function gabung(transmisi, gardu, elemenBaru, tanggal, ubinTambah, luar) {
  const b = pembatasIndonesia(luar);
  const baru = bangun(elemenBaru, tanggal, undefined, []);
  const idT = new Set(transmisi.garis.map((l) => l.id)), idG = new Set(gardu.gardu.map((g) => g.id));
  const garis = [...transmisi.garis, ...baru.transmisi.garis.filter((l) => !idT.has(l.id))].filter((l) => !luarNegeri(l.koordinat, b)).sort((x, y) => x.id - y.id);
  const gd = [...gardu.gardu, ...baru.gardu.gardu.filter((g) => !idG.has(g.id))].filter((g) => !luarNegeri([[g.lng, g.lat]], b)).sort((x, y) => x.id.localeCompare(y.id));
  const cakupan = [...transmisi.meta.cakupan_bbox, ...ubinTambah.filter((u) => !transmisi.meta.cakupan_bbox.some((c) => sama(c, u)))];
  const celah = transmisi.meta.celah.map((c) => (c.startsWith('Cakupan panen:') ? `Cakupan panen: ${cakupan.length} ubin bbox [S,W,N,E] (lihat cakupan_bbox); wilayah di luar ubin belum terpanen.` : c));
  if (!celah.some((c) => c.startsWith('Objek di luar'))) celah.push('Objek di luar batas Indonesia (Malaysia, Brunei, Timor Leste, PNG) disaring dengan uji titik-dalam-poligon batas negara (toleransi ~8 km untuk kabel laut/pantai).');
  const km = Math.round(garis.reduce((s, l) => s + hitungKm(l.koordinat), 0));
  return { transmisi: { meta: { ...transmisi.meta, diperbarui: tanggal, cakupan_bbox: cakupan, celah, jumlah: garis.length, panjang_km_perkiraan: km }, garis }, gardu: { meta: { ...gardu.meta, diperbarui: tanggal, cakupan_bbox: cakupan, celah, jumlah: gd.length }, gardu: gd } };
}
const hitungKm = (c) => { let s = 0; for (let i = 1; i < c.length; i++) s += Math.hypot((c[i][0] - c[i - 1][0]) * 111.19 * Math.cos((c[i][1] * Math.PI) / 180), (c[i][1] - c[i - 1][1]) * 111.19); return s; };

// Gagal dua kali -> dibelah empat (sampai sisi < 1,5 derajat), seperti pipa/data_transmisi.mjs.
async function ambilUbin(b, minSisi = 1.5) {
  const f = `${MENTAH}u_${b.join('_')}.json`; if (fs.existsSync(f)) return;
  for (let k = 0; k < 2; k++) {
    const r = await fetch(HOST, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(kueri(b)), signal: AbortSignal.timeout(200000) }).catch((e) => ({ ok: false, status: String(e) }));
    if (r.ok) { const t = await r.text(); JSON.parse(t); fs.writeFileSync(f, t); console.log('ok', b.join(','), t.length); await tidur(10000); return; }
    console.log('gagal', b.join(','), r.status); if (r.status === 403 || r.status === 429) process.exit(2);
    await tidur(30000 * (k + 1)); // backoff 504/timeout
  }
  const [s, w, n, e] = b; if (Math.min(n - s, e - w) / 2 < minSisi) { console.log('menyerah', b.join(',')); return; }
  const ms = (s + n) / 2, mw = (w + e) / 2;
  for (const q of [[s, w, ms, mw], [s, mw, ms, e], [ms, w, n, mw], [ms, mw, n, e]]) await ambilUbin(q, minSisi);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tr = baca('public/geo/transmisi.json'), gd = baca('public/geo/gardu.json');
  fs.mkdirSync(MENTAH, { recursive: true });
  if (process.argv[2] === 'ambil') for (const b of ubinDarat(tr.meta.cakupan_bbox, baca('public/geo/luar-indonesia.json'))) await ambilUbin(b);
  else if (process.argv[2] === 'gabung') {
    const ada = fs.readdirSync(MENTAH).filter((f) => /^u_.*\.json$/.test(f));
    const elemen = ada.flatMap((f) => JSON.parse(fs.readFileSync(MENTAH + f, 'utf8')).elements);
    const tambah = ada.map((f) => f.slice(2, -5).split('_').map(Number));
    const o = gabung(tr, gd, elemen, new Date().toISOString().slice(0, 10), tambah, baca('public/geo/luar-indonesia.json'));
    fs.writeFileSync(AKAR + 'public/geo/transmisi.json', JSON.stringify(o.transmisi) + '\n');
    fs.writeFileSync(AKAR + 'public/geo/gardu.json', JSON.stringify(o.gardu) + '\n');
    console.log('garis', tr.garis.length, '->', o.transmisi.meta.jumlah, 'gardu', gd.gardu.length, '->', o.gardu.meta.jumlah);
  }
}
