// Panen jaringan transmisi dan gardu induk dari OpenStreetMap (Overpass API) sebagai pengganti ESDM One Map (robots.txt Disallow).
// power=line bertegangan >= 150 kV dan power=substation >= 150 kV di Indonesia. Sopan: satu kueri per pulau, berurutan, jeda antar kueri,
// UA bernama. Lisensi ODbL 1.0: atribusi "© OpenStreetMap contributors" wajib tampil di peta dan sumber.
// Pakai: node scripts/panen/osm_jaringan.mjs [--cache=<dir>]   (cache = simpan jawaban mentah per pulau agar bisa dilanjutkan)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
export const ENDPOINT = 'https://overpass-api.de/api/interpreter';
export const JEDA_MS = 25000;
export const BATAS_BYTE = 3 * 1024 * 1024;
// [selatan, barat, utara, timur]; tumpang tindih antar pulau dibuang lewat id OSM
export const PULAU = {
  sumatera: [-6.2, 94.5, 6.2, 106.2],
  jawa_bali: [-9.0, 105.0, -5.8, 116.0],
  kalimantan: [-4.3, 108.5, 4.5, 119.5],
  sulawesi: [-6.0, 118.5, 2.0, 125.0],
  nusa_tenggara: [-11.2, 115.5, -8.0, 125.2],
  maluku: [-8.5, 125.0, 3.0, 135.5],
  papua: [-10.8, 130.0, 1.0, 141.2],
};

/** Tegangan tertinggi dalam kV dari tag voltage OSM ("150000", "275000;150000"); 0 bila tak terbaca. */
export function kvMaks(v) {
  const a = String(v || '').split(/[;,]/).map((x) => Number(x.trim())).filter((x) => Number.isFinite(x) && x > 0);
  return a.length ? Math.round(Math.max(...a) / 1000) : 0;
}

/** Douglas-Peucker pada [lng,lat]; eps dalam derajat. */
export function sederhana(pts, eps) {
  if (pts.length < 3) return pts;
  const jarak = (p, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
    if (!l) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l));
    return Math.hypot(p[0] - (a[0] + u * dx), p[1] - (a[1] + u * dy));
  };
  const simpan = new Uint8Array(pts.length); simpan[0] = simpan[pts.length - 1] = 1;
  const tumpuk = [[0, pts.length - 1]];
  while (tumpuk.length) {
    const [i, j] = tumpuk.pop(); let m = 0, k = -1;
    for (let x = i + 1; x < j; x++) { const d = jarak(pts[x], pts[i], pts[j]); if (d > m) { m = d; k = x; } }
    if (m > eps) { simpan[k] = 1; tumpuk.push([i, k], [k, j]); }
  }
  return pts.filter((_, i) => simpan[i]);
}

const bulat = (n) => Math.round(n * 1e4) / 1e4;
const panjangKm = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot((pts[i][0] - pts[i - 1][0]) * 111.3 * Math.cos((pts[i][1] * Math.PI) / 180), (pts[i][1] - pts[i - 1][1]) * 111.3); return s; };

/** Elemen Overpass (way geom / node / center) -> fitur GeoJSON ringkas, atau null. */
export function fitur(el, eps) {
  const kv = kvMaks(el.tags && el.tags.voltage);
  if (kv < 150) return null;
  if (el.type === 'way' && el.tags.power === 'line' && Array.isArray(el.geometry)) {
    const pts = sederhana(el.geometry.filter(Boolean).map((g) => [g.lon, g.lat]), eps).map(([x, y]) => [bulat(x), bulat(y)]);
    if (pts.length < 2 || panjangKm(pts) < 1) return null;
    return { type: 'Feature', properties: { v: kv }, geometry: { type: 'LineString', coordinates: pts } };
  }
  if (el.tags && el.tags.power === 'substation') {
    const lat = el.lat ?? (el.center && el.center.lat), lon = el.lon ?? (el.center && el.center.lon);
    if (lat == null || lon == null) return null;
    const p = { v: kv }; if (el.tags.name) p.n = el.tags.name.slice(0, 60);
    return { type: 'Feature', properties: p, geometry: { type: 'Point', coordinates: [bulat(lon), bulat(lat)] } };
  }
  return null;
}

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
export const kueri = ([s, w, n, e]) => `[out:json][timeout:240];way["power"="line"]["voltage"~"[0-9]{6}"](${s},${w},${n},${e});out geom tags qt;nwr["power"="substation"]["voltage"~"[0-9]{6}"](${s},${w},${n},${e});out center tags qt;`;

async function ambil(bbox, coba = 0) {
  const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: 'data=' + encodeURIComponent(kueri(bbox)), signal: AbortSignal.timeout(300000) });
  if ([429, 502, 503, 504].includes(r.status)) {
    if (coba >= 3) throw new Error('Overpass sibuk ' + r.status);
    await tidur(60000 * (coba + 1)); return ambil(bbox, coba + 1);
  }
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

export function rakit(mentah, tanggal) {
  const lihat = new Set(); let eps = 0.0015, out;
  for (;;) {
    const fs_ = []; lihat.clear();
    for (const [pulau, d] of Object.entries(mentah)) for (const el of d.elements || []) {
      const k = el.type + el.id; if (lihat.has(k)) continue; lihat.add(k);
      const f = fitur(el, eps); if (f) fs_.push(f);
    }
    out = { type: 'FeatureCollection', attribution: '© OpenStreetMap contributors', lisensi: 'ODbL 1.0 (https://opendatacommons.org/licenses/odbl/1-0/)', sumber: 'https://www.openstreetmap.org/copyright', diambil: tanggal, kueri: 'power=line dan power=substation, voltage >= 150 kV, Overpass API per pulau', penyederhanaan_derajat: eps, features: fs_ };
    const ukuran = Buffer.byteLength(JSON.stringify(out));
    if (ukuran <= BATAS_BYTE || eps > 0.05) return out;
    eps *= 1.8;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cache = (process.argv.find((a) => a.startsWith('--cache=')) || '').slice(8);
  const tanggal = new Date().toISOString().slice(0, 10);
  if (cache) fs.mkdirSync(cache, { recursive: true });
  const mentah = {}; let pertama = true;
  for (const [pulau, bbox] of Object.entries(PULAU)) {
    const f = cache && path.join(cache, pulau + '.json');
    if (f && fs.existsSync(f)) { mentah[pulau] = JSON.parse(fs.readFileSync(f, 'utf8')); console.log(pulau, 'cache', mentah[pulau].elements.length); continue; }
    if (!pertama) await tidur(JEDA_MS);
    pertama = false;
    mentah[pulau] = await ambil(bbox);
    if (f) fs.writeFileSync(f, JSON.stringify(mentah[pulau]));
    console.log(pulau, mentah[pulau].elements.length);
  }
  const out = rakit(mentah, tanggal);
  fs.mkdirSync('public/data/geo', { recursive: true });
  fs.writeFileSync('public/data/geo/jaringan_osm.geojson', JSON.stringify(out));
  const n = out.features;
  console.log('fitur', n.length, 'garis', n.filter((x) => x.geometry.type === 'LineString').length, 'gardu', n.filter((x) => x.geometry.type === 'Point').length, 'eps', out.penyederhanaan_derajat);
}
