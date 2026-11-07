// Pustaka panen lapisan lahan publik (Fase 2): ubin vektor Global Forest Watch -> geojson sederhana di public/data/geo/lahan_*.geojson.
// Sopan: UA jujur, robots, jeda 2 dtk, 403 berhenti (lewat _panen_sopan.mjs). Cache ubin dibagi dengan panen risiko (alamat sama = cache sama).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ambil } from '../pipa/_panen_sopan.mjs';
import { ubinDari, lonLatUbin, uraiMvt } from './risiko_lib.mjs';

export const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CACHE = process.env.RISIKO_CACHE || '/private/tmp/claude-501/-Users-priyankaalfatehan28-Documents-GitHub-platformmeti/b1682dc3-8a11-4d9d-90d7-82b836c30f0d/scratchpad/f2/cache';
fs.mkdirSync(CACHE, { recursive: true });
export const TILES = 'https://tiles.globalforestwatch.org';

async function lewatCache(kunci, fn) {
  const f = path.join(CACHE, crypto.createHash('sha1').update(kunci).digest('hex'));
  if (fs.existsSync(f)) { const b = fs.readFileSync(f); return b.length === 1 && b[0] === 0 ? null : b; }
  let b = null;
  try { b = await fn(); } catch (e) { if (!/^404 /.test(e.message)) throw e; }
  fs.writeFileSync(f, b ?? Buffer.from([0]));
  return b;
}
export async function mvt(nama, ver, z, x, y) {
  const url = `${TILES}/${nama}/${ver}/default/${z}/${x}/${y}.pbf`;
  const b = await lewatCache(url, () => ambil(url, { buf: true }));
  return b ? uraiMvt(b[0] === 0x1f ? zlib.gunzipSync(b) : b)[nama] : null;
}

function dp(p, tol) { // Douglas-Peucker iteratif
  if (p.length < 5) return p;
  const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1; const st = [[0, p.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let m = 0, mi = -1; const [x1, y1] = p[a], [x2, y2] = p[b], dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = p[i]; let d;
      if (!L) d = Math.hypot(x - x1, y - y1); else { const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / L)); d = Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)); }
      if (d > m) { m = d; mi = i; }
    }
    if (m > tol && mi > 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return p.filter((_, i) => keep[i]);
}
const luas = (c) => { let s = 0; for (let i = 0, j = c.length - 1; i < c.length; j = i++) s += c[j][0] * c[i][1] - c[i][0] * c[j][1]; return s / 2; };

/** cfg: { nama, ver, z, filter(sifat)->{id, sifat}|null, tol, minLuas, desimal } ; kembalikan Map id -> { sifat, poli[] } (cincin luar saja) */
export async function panenVektor(cfg) {
  const { nama, ver, z, filter, tol = 3, minLuas = 6, desimal = 3 } = cfg, hasil = new Map(), n = 2 ** z;
  const x0 = Math.floor(((94.8 + 180) / 360) * n), x1 = Math.floor(((141.1 + 180) / 360) * n), y0 = ubinDari(0, 6.4, z).y, y1 = ubinDari(0, -11.2, z).y;
  let i = 0; const total = (x1 - x0 + 1) * (y1 - y0 + 1), q = 10 ** desimal;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
    const tile = await mvt(nama, ver, z, x, y); if (++i % 20 === 0) console.log(nama, i, '/', total);
    if (!tile) continue;
    for (const f of tile.fitur) {
      if (f.tipe !== 3) continue;
      const k = filter(f.sifat); if (!k) continue;
      for (const c0 of f.geom) {
        const c = dp(c0, tol); if (c.length < 4) continue;
        const a = luas(c); if (a <= 0 || a < minLuas) continue; // luar saja (positif); lubang dibuang demi ukuran
        const ll = c.map(([px, py]) => lonLatUbin(z, x, y, px, py).map((v) => Math.round(v * q) / q));
        const e = hasil.get(k.id) || hasil.set(k.id, { sifat: k.sifat, poli: [] }).get(k.id);
        e.poli.push([ll]);
      }
    }
  }
  return hasil;
}
export function tulisGeo(berkas, peta, ket) {
  const fc = { type: 'FeatureCollection', ...ket, features: [...peta].map(([id, e]) => ({ type: 'Feature', properties: { id, ...e.sifat }, geometry: { type: 'MultiPolygon', coordinates: e.poli } })) };
  const f = path.join(AKAR, 'public/data/geo', berkas); fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(fc)); console.log(berkas, peta.size, 'fitur', (fs.statSync(f).size / 1024).toFixed(0), 'KB');
}
export const jalankan = (meta, fn) => { if (process.argv[1] === fileURLToPath(meta)) fn().catch((e) => { console.error(e); process.exit(1); }); };
