// Panen lapisan publik untuk /risiko (F2). Menjalankan: node scripts/panen/risiko_panen.mjs [titik|geo|gambar|semua]
// Sumber (semua terbuka, robots dicek, UA jujur, jeda 2 dtk lewat _panen_sopan.mjs; 403 = berhenti total):
//   - Kawasan hutan KLHK (via ubin vektor Global Forest Watch, dataset idn_forest_area v201709) dan wilayah adat/komunitas
//     (LandMark, CC BY-SA 4.0), gambut (GFW gfw_peatlands v20230302, CC BY 4.0), bahaya multi-bencana (BNPB InaRISK, ArcGIS ImageServer).
// Keluaran: data/risiko/mentah.json (nilai lapisan per titik proyek), public/data/geo/risiko_{hutan,gambut,adat}.geojson, public/img/risiko/bahaya_multi.png.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ambil } from '../pipa/_panen_sopan.mjs';
import { ubinDari, lonLatUbin, uraiMvt, dalamFitur, uraiPng } from './risiko_lib.mjs';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CACHE = process.env.RISIKO_CACHE || '/private/tmp/claude-501/-Users-priyankaalfatehan28-Documents-GitHub-platformmeti/b1682dc3-8a11-4d9d-90d7-82b836c30f0d/scratchpad/f2/cache';
fs.mkdirSync(CACHE, { recursive: true });
const TILES = 'https://tiles.globalforestwatch.org';
export const LAPIS = {
  hutan: { nama: 'idn_forest_area', ver: 'v201709', lisensi: 'Kawasan Hutan KLHK, diakses lewat Global Forest Watch (data portal KLHK)', url: 'https://data.globalforestwatch.org/' },
  adat: { nama: 'landmark_ip_lc_and_indicative_poly', ver: 'v20260612', lisensi: 'LandMark, CC BY-SA 4.0', url: 'https://www.landmarkmap.org/' },
  gambut: { nama: 'gfw_peatlands', ver: 'v20230302', lisensi: 'Global Peatlands (GFW), CC BY 4.0', url: 'https://data-api.globalforestwatch.org/dataset/gfw_peatlands/v20230302' },
};
const BNPB = 'https://gis.bnpb.go.id/server/rest/services/inarisk';
export const BAHAYA = { multi: 'INDEKS_MULTI_BAHAYA', banjir: 'INDEKS_BAHAYA_BANJIR', longsor: 'INDEKS_BAHAYA_TANAHLONGSOR', gempa: 'INDEKS_BAHAYA_GEMPABUMI', karhutla: 'INDEKS_BAHAYA_KARHUTLA', tsunami: 'INDEKS_BAHAYA_TSUNAMI', gunungapi: 'INDEKS_BAHAYA_GUNUNGAPI' };

async function lewatCache(kunci, ambilFn) {
  const f = path.join(CACHE, crypto.createHash('sha1').update(kunci).digest('hex'));
  if (fs.existsSync(f)) { const b = fs.readFileSync(f); return b.length === 1 && b[0] === 0 ? null : b; }
  let b = null;
  try { b = await ambilFn(); } catch (e) { if (!/^404 /.test(e.message)) throw e; }
  fs.writeFileSync(f, b ?? Buffer.from([0]));
  return b;
}
const unduh = (url, opsi = {}) => lewatCache(url + JSON.stringify(opsi.body || ''), () => ambil(url, { buf: true, ...opsi }));
async function mvt(lapis, z, x, y) {
  const b = await unduh(`${TILES}/${lapis.nama}/${lapis.ver}/default/${z}/${x}/${y}.pbf`);
  return b ? uraiMvt(b[0] === 0x1f ? zlib.gunzipSync(b) : b)[lapis.nama] : null;
}
const png = async (z, x, y) => { const b = await unduh(`${TILES}/${LAPIS.gambut.nama}/${LAPIS.gambut.ver}/mode_intensity/${z}/${x}/${y}.png`); return b ? uraiPng(b) : null; };

export function kumpulTitik() {
  const d = JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data/proyek_terpadu.json'), 'utf8'));
  return d.baris.filter((r) => !r.ragu && r.lat != null && (r.presisi === 'kabupaten' || r.presisi === 'titik_persis')).map((r) => ({ id: r.id, lat: r.lat, lng: r.lng, presisi: r.presisi }));
}

/* ---------- InaRISK: getSamples multititik, satu kali per lapis ---------- */
async function bahaya(titik) {
  const out = {};
  for (const [k, svc] of Object.entries(BAHAYA)) {
    try {
    for (let i = 0; i < titik.length; i += 150) {
      const bagian = titik.slice(i, i + 150);
      const body = new URLSearchParams({ geometry: JSON.stringify({ points: bagian.map((t) => [t.lng, t.lat]), spatialReference: { wkid: 4326 } }), geometryType: 'esriGeometryMultipoint', returnFirstValueOnly: 'true', f: 'json' });
      const b = await lewatCache(`${BNPB}/${svc}/getSamples/${body}`, async () => { // jangan simpan galat 503 ke cache; ulangi dengan jeda
        for (let k = 0; ; k++) {
          const r = await Promise.race([ambil(`${BNPB}/${svc}/ImageServer/getSamples`, { method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' }, buf: true }), new Promise((_, no) => setTimeout(() => no(new Error('waktu habis 90 dtk')), 90000))]);
          if (JSON.parse(r.toString('utf8')).samples) return r;
          if (k >= 3) throw new Error('InaRISK ' + svc + ': ' + r.toString('utf8').slice(0, 200));
          await new Promise((ok) => setTimeout(ok, 15000));
        }
      });
      const j = JSON.parse(b.toString('utf8'));
      for (const s of j.samples) { const v = parseFloat(s.value); (out[bagian[s.locationId].id] ||= {})[k] = Number.isFinite(v) ? Math.round(v * 1000) / 1000 : null; }
    }
    } catch (e) { console.log('lewati lapis bahaya', k, String(e.message).slice(0, 120)); if (k === 'multi') throw e; } // lapis tunggal boleh gagal; indeks multi wajib
  }
  return out;
}

/* ---------- titik x lapisan vektor (hutan, adat) ---------- */
async function tumpangVektor(titik, lapis, z, ambilSifat) {
  const per = new Map();
  for (const t of titik) { const u = ubinDari(t.lng, t.lat, z); const k = `${u.x}/${u.y}`; (per.get(k) || per.set(k, { x: u.x, y: u.y, t: [] }).get(k)).t.push([t, u]); }
  const out = {}; let n = 0;
  for (const g of per.values()) {
    const tile = await mvt(lapis, z, g.x, g.y); n++;
    if (n % 20 === 0) console.log(lapis.nama, n, '/', per.size);
    for (const [t, u] of g.t) {
      const px = (u.xf - g.x) * 4096, py = (u.yf - g.y) * 4096;
      const kena = tile ? tile.fitur.filter((f) => f.tipe === 3 && dalamFitur(f.geom, px, py)) : [];
      out[t.id] = kena.map((f) => ambilSifat(f.sifat));
    }
  }
  return out;
}
async function tumpangGambut(titik, z = 10) {
  const per = new Map();
  for (const t of titik) { const u = ubinDari(t.lng, t.lat, z); const k = `${u.x}/${u.y}`; (per.get(k) || per.set(k, { x: u.x, y: u.y, t: [] }).get(k)).t.push([t, u]); }
  const out = {}; let n = 0;
  for (const g of per.values()) {
    const im = await png(z, g.x, g.y); n++;
    if (n % 20 === 0) console.log('gambut', n, '/', per.size);
    for (const [t, u] of g.t) out[t.id] = im ? im.ambil(Math.min(255, Math.floor((u.xf - g.x) * 256)), Math.min(255, Math.floor((u.yf - g.y) * 256)))[3] > 0 : false;
  }
  return out;
}

async function langkahTitik() {
  const titik = kumpulTitik();
  console.log('titik', titik.length);
  const hutan = await tumpangVektor(titik, LAPIS.hutan, 8, (s) => ({ kelas: s.kelas, desc: s.desc_in, en: s.desc_en }));
  const adat = await tumpangVektor(titik, LAPIS.adat, 6, (s) => ({ nama: s.name, kat: s.category, status: s.doc_status, negara: s.country }));
  const gambut = await tumpangGambut(titik);
  const bhy = await bahaya(titik);
  const hasil = {};
  for (const t of titik) hasil[t.id] = { lat: t.lat, lng: t.lng, presisi: t.presisi, hutan: hutan[t.id], adat: adat[t.id], gambut: gambut[t.id], bahaya: bhy[t.id] || null };
  const tgl = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(AKAR, 'data/risiko/mentah.json'), JSON.stringify({ tanggal_ambil: tgl, lapis: LAPIS, bahaya: BAHAYA, bahaya_url: BNPB, titik: hasil }) + '\n');
  console.log('tertulis data/risiko/mentah.json');
}

/* ---------- geojson yang disederhanakan untuk peta ---------- */
function dp(p, tol) { // Douglas-Peucker iteratif
  if (p.length < 5) return p;
  const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1; const st = [[0, p.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let m = 0, mi = -1; const [x1, y1] = p[a], [x2, y2] = p[b], dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = p[i]; let d;
      if (!L) d = Math.hypot(x - x1, y - y1); else { const tt = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / L)); d = Math.hypot(x - (x1 + tt * dx), y - (y1 + tt * dy)); }
      if (d > m) { m = d; mi = i; }
    }
    if (m > tol && mi > 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return p.filter((_, i) => keep[i]);
}
const luas = (c) => { let s = 0; for (let i = 0, j = c.length - 1; i < c.length; j = i++) s += c[j][0] * c[i][1] - c[i][0] * c[j][1]; return s / 2; }; // rumus tali sepatu baku: cincin luar MVT bernilai positif
async function geoVektor(lapis, z, kelasDari, toleransi, minLuas) {
  const fitur = new Map(), n = 2 ** z, x0 = Math.floor(((95 + 180) / 360) * n), x1 = Math.floor(((141 + 180) / 360) * n), y0 = ubinDari(0, 6.5, z).y, y1 = ubinDari(0, -11.5, z).y;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
    const tile = await mvt(lapis, z, x, y); if (!tile) continue;
    for (const f of tile.fitur) {
      if (f.tipe !== 3) continue;
      const k = kelasDari(f.sifat); if (!k) continue;
      const poli = []; // cincin luar (arah +) membuka poligon baru, cincin dalam menempel
      for (const c of f.geom.map((c0) => dp(c0, toleransi)).filter((c) => c.length >= 4)) {
        const a = luas(c); if (Math.abs(a) < minLuas && a > 0) continue;
        const ll = c.map(([px, py]) => lonLatUbin(z, x, y, px, py).map((v) => Math.round(v * 1000) / 1000));
        if (a > 0) poli.push([ll]); else if (poli.length) poli[poli.length - 1].push(ll);
      }
      if (poli.length) (fitur.get(k) || fitur.set(k, []).get(k)).push(...poli);
    }
  }
  return fitur;
}
const tulisGeo = (nama, peta, sifatDari) => {
  const fc = { type: 'FeatureCollection', features: [...peta].map(([k, poli]) => ({ type: 'Feature', properties: sifatDari(k), geometry: { type: 'MultiPolygon', coordinates: poli } })) };
  const f = path.join(AKAR, 'public/data/geo', nama); fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(fc)); console.log(nama, (fs.statSync(f).size / 1024).toFixed(0), 'KB');
};
export const kelasHutan = (s) => {
  const t = `${s.desc_in || ''} ${s.kelas || ''}`.toLowerCase();
  if (/konservasi|suaka|taman nasional|cagar|taman (wisata|hutan raya|buru)/.test(t)) return 'konservasi';
  if (/lindung/.test(t)) return 'lindung';
  if (/konversi/.test(t)) return 'konversi';
  if (/produksi/.test(t)) return 'produksi';
  return null;
};
async function langkahGeo() {
  tulisGeo('risiko_hutan.geojson', await geoVektor(LAPIS.hutan, 5, kelasHutan, 2, 6), (k) => ({ k }));
  tulisGeo('risiko_adat.geojson', await geoVektor(LAPIS.adat, 5, () => 'adat', 2, 2), (k) => ({ k }));
  // gambut: ubin PNG z6 (piksel sekitar 2,4 km) -> persegi hasil gabungan lintas baris
  const z = 6, n = 2 ** z, x0 = Math.floor(((95 + 180) / 360) * n), x1 = Math.floor(((141 + 180) / 360) * n), y0 = ubinDari(0, 6.5, z).y, y1 = ubinDari(0, -11.5, z).y;
  const kotak = new Map(), aktif = new Map(); // aktif: kunci "a-b" -> {a,b,y0,y1}
  const sel = {};
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
    const im = await png(z, x, y); if (!im) continue;
    for (let py = 0; py < 256; py++) for (let px = 0; px < 256; px++) if (im.ambil(px, py)[3] > 0) sel[(y * 256 + py) * 100000 + x * 256 + px] = 1;
  }
  const baris = new Map();
  for (const k of Object.keys(sel)) { const v = +k, gy = Math.floor(v / 100000), gx = v % 100000; (baris.get(gy) || baris.set(gy, []).get(gy)).push(gx); }
  const hasil = []; let buka = new Map();
  for (const gy of [...baris.keys()].sort((a, b) => a - b)) {
    const xs = baris.get(gy).sort((a, b) => a - b), runs = []; let a = xs[0], p = xs[0];
    for (const x of xs.slice(1)) { if (x === p + 1) p = x; else { runs.push([a, p]); a = p = x; } } runs.push([a, p]);
    const baru = new Map();
    for (const [ra, rb] of runs) { const k = `${ra}-${rb}`, ada = buka.get(k); if (ada && ada.y1 === gy - 1) { ada.y1 = gy; baru.set(k, ada); buka.delete(k); } else baru.set(k, { a: ra, b: rb, y0: gy, y1: gy }); }
    for (const v of buka.values()) hasil.push(v); buka = baru;
  }
  for (const v of buka.values()) hasil.push(v);
  const ll = (gx, gy) => lonLatUbin(z, 0, 0, gx * 4096 / 256, gy * 4096 / 256).map((q) => Math.round(q * 100) / 100);
  const poli = hasil.map((r) => { const a = ll(r.a, r.y0), b = ll(r.b + 1, r.y1 + 1); return [[[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]], [a[0], a[1]]]]; });
  tulisGeo('risiko_gambut.geojson', new Map([['gambut', poli]]), (k) => ({ k }));
}

async function langkahGambar() {
  const f = path.join(AKAR, 'public/img/risiko/bahaya_multi.png'); fs.mkdirSync(path.dirname(f), { recursive: true });
  const q = new URLSearchParams({ bbox: '95,-11.1,141.1,6.1', bboxSR: '4326', imageSR: '4326', size: '1380,515', format: 'png32', f: 'image' });
  const b = await ambil(`${BNPB}/layer_bahaya_multi/ImageServer/exportImage?${q}`, { buf: true });
  fs.writeFileSync(f, b); console.log('bahaya_multi.png', (b.length / 1024).toFixed(0), 'KB');
}

const [langkah = 'semua'] = process.argv.slice(2);
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (langkah === 'titik' || langkah === 'semua') await langkahTitik();
  if (langkah === 'geo' || langkah === 'semua') await langkahGeo();
  if (langkah === 'gambar' || langkah === 'semua') await langkahGambar();
}
