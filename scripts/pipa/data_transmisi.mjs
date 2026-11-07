// Transmisi dan gardu dari OpenStreetMap (ODbL): public/geo/transmisi.json dan public/geo/gardu.json.
//   node scripts/pipa/data_transmisi.mjs ambil <dirMentah>   (jaringan: Overpass, satu kueri per wilayah besar, jeda, timeout)
//   node scripts/pipa/data_transmisi.mjs bangun <dirMentah> <tanggalAmbil YYYY-MM-DD>   (tanpa jaringan; sederhanakan geometri)
// Host: overpass.private.coffee (robots.txt tidak melarang; overpass-api.de melarang /api/ untuk agen *).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
export const HOST = 'https://overpass.private.coffee/api/interpreter';
// Ubin 6x8 derajat tanpa ubin laut murni (satu kueri per ubin; server publik lambat, 85 dtk untuk kueri kecil). S,W,N,E.
export const WILAYAH = {};
for (const s of [-5, -11, 1]) for (let w = 95; w < 141; w += 8) { // urutan: Sumatera-Kalimantan-Sulawesi dahulu
  if ((s === -11 && w === 95) || (s === 1 && w === 135)) continue;
  WILAYAH[`u_${s}_${w}`] = [s, w, s + 6, Math.min(w + 8, 141.1)];
}
const VOLT = '^((1[5-9]|[2-9][0-9])[0-9]{4}|[0-9]{7,})'; // >= 150000 V
export const kueri = (b) => `[out:json][timeout:280];(way["power"="line"]["voltage"~"${VOLT}"](${b.join(',')});way["power"="substation"]["voltage"~"${VOLT}"](${b.join(',')});node["power"="substation"]["voltage"~"${VOLT}"](${b.join(',')}););out geom tags;`;

export const tegMax = (v) => Math.max(0, ...String(v || '').split(';').map((x) => parseInt(x, 10)).filter(Number.isFinite));
const bulat = (x, d = 4) => Math.round(x * 10 ** d) / 10 ** d;

// Douglas-Peucker (derajat; 0.0015 ~ 170 m)
export function sederhanakan(p, eps) {
  if (p.length < 3) return p;
  const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1;
  const st = [[0, p.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1;
    const [ax, ay] = p[a], [bx, by] = p[b], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = p[i]; let t = l2 ? ((x - ax) * dx + (y - ay) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(x - (ax + t * dx), y - (ay + t * dy)); if (d > md) { md = d; mi = i; }
    }
    if (md > eps) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return p.filter((_, i) => keep[i]);
}

export function bangun(elemen, tanggal, eps = 0.0015) {
  const garis = new Map(), gardu = new Map();
  for (const e of elemen) {
    const t = e.tags || {}; const kv = tegMax(t.voltage) / 1000; if (kv < 150) continue;
    if (t.power === 'line' && e.type === 'way' && e.geometry?.length > 1) {
      const c = sederhanakan(e.geometry.map((g) => [g.lon, g.lat]), eps).map(([x, y]) => [bulat(x), bulat(y)]);
      if (c.length > 1) garis.set(e.id, { id: e.id, teg_kv: kv, nama: t.name || null, operator: t.operator || null, koordinat: c });
    } else if (t.power === 'substation') {
      let lat, lon;
      if (e.type === 'node') { lat = e.lat; lon = e.lon; }
      else if (e.geometry?.length) { lat = e.geometry.reduce((s, g) => s + g.lat, 0) / e.geometry.length; lon = e.geometry.reduce((s, g) => s + g.lon, 0) / e.geometry.length; }
      else continue;
      gardu.set(e.type[0] + e.id, { id: e.type[0] + e.id, nama: t.name || null, operator: t.operator || null, teg_kv: kv, lat: bulat(lat, 5), lng: bulat(lon, 5) });
    }
  }
  const meta = {
    diperbarui: tanggal, sumber_id: 'osm-power', lisensi: 'ODbL 1.0',
    atribusi: '© kontributor OpenStreetMap, ODbL 1.0, https://www.openstreetmap.org/copyright',
    celah: ['OSM dipetakan sukarelawan: tidak lengkap dan tidak resmi; bukan data PLN. Jalur tegangan < 150 kV dan ganda-sirkuit tak dipecah.', 'Tegangan = nilai tertinggi pada tag voltage. Geometri disederhanakan (Douglas-Peucker ~170 m), koordinat 4 desimal.'],
    sumber: [{ id: 'osm-power', judul: 'OpenStreetMap power=line / power=substation, voltage >= 150000, via Overpass API', penerbit: 'OpenStreetMap contributors', tahun: Number(tanggal.slice(0, 4)), url: 'https://www.openstreetmap.org/copyright' }],
  };
  const L = [...garis.values()].sort((a, b) => a.id - b.id), G = [...gardu.values()].sort((a, b) => a.id.localeCompare(b.id));
  return {
    transmisi: { meta: { ...meta, jumlah: L.length, panjang_km_perkiraan: Math.round(L.reduce((s, l) => s + panjangKm(l.koordinat), 0)) }, garis: L },
    gardu: { meta: { ...meta, jumlah: G.length }, gardu: G },
  };
}
export function panjangKm(c) {
  let s = 0; for (let i = 1; i < c.length; i++) { const dy = (c[i][1] - c[i - 1][1]) * 111.19, dx = (c[i][0] - c[i - 1][0]) * 111.19 * Math.cos((c[i][1] * Math.PI) / 180); s += Math.hypot(dx, dy); } return s;
}

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
async function tarik(b) { // sekali coba; kembalikan teks JSON atau null
  const r = await fetch(HOST, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(kueri(b)), signal: AbortSignal.timeout(330000) }).catch((e) => ({ ok: false, status: String(e) }));
  if (r.ok) { const t = await r.text(); JSON.parse(t); return t; }
  console.log('gagal', b.join(','), r.status); if (r.status === 403) process.exit(2);
  await tidur(r.status === 429 ? 60000 : 20000); return null;
}
// Ubin gagal dua kali -> dibelah empat (sampai sisi < 1,5 derajat); hasil tiap ubin disimpan sendiri.
async function ubin(dir, b, minSisi = 1.5) {
  const f = path.join(dir, `u_${b.join('_')}.json`); if (fs.existsSync(f)) return;
  for (let k = 0; k < 2; k++) { const t = await tarik(b); if (t) { fs.writeFileSync(f, t); console.log('ok', b.join(','), t.length); await tidur(6000); return; } }
  const [s, w, n, e] = b; if (Math.min(n - s, e - w) / 2 < minSisi) { console.log('menyerah', b.join(',')); return; }
  const ms = (s + n) / 2, mw = (w + e) / 2;
  for (const q of [[s, w, ms, mw], [s, mw, ms, e], [ms, w, n, mw], [ms, mw, n, e]]) await ubin(dir, q, minSisi);
}
async function ambil(dir) {
  fs.mkdirSync(dir, { recursive: true });
  for (const b of Object.values(WILAYAH)) await ubin(dir, b);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, dir, tgl] = process.argv.slice(2);
  if (cmd === 'ambil') await ambil(dir);
  else if (cmd === 'bangun') {
    const el = []; for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) el.push(...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).elements);
    const o = bangun(el, tgl);
    fs.mkdirSync(path.join(ROOT, 'public/geo'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'public/geo/transmisi.json'), JSON.stringify(o.transmisi) + '\n');
    fs.writeFileSync(path.join(ROOT, 'public/geo/gardu.json'), JSON.stringify(o.gardu) + '\n');
    console.log(o.transmisi.meta.jumlah, 'garis', o.gardu.meta.jumlah, 'gardu');
  } else console.log('pakai: ambil <dir> | bangun <dir> <tgl>');
}
