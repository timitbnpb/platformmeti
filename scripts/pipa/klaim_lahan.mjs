#!/usr/bin/env node
// public/data/klaim_lahan.json: klaim karbon dan lahan per provinsi/kabupaten (kode Kemendagri/BPS). Offline: membaca public/data/geo/lahan_*.geojson,
// registri karbon, proyek terpadu. Rasterisasi 0,01 derajat (sekitar 1,1 km, ~120 ha/sel): luas dan tumpang tindih ADALAH PERKIRAAN (Hipotesis), bukan batas hukum.
//   node scripts/pipa/klaim_lahan.mjs siap    (sekali; salin geometri kabupaten dari repo poskokarhutla -> data/lahan/kabupaten.json)
//   node scripts/pipa/klaim_lahan.mjs bangun
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { daftarKabkota } from './radar_kabupaten.mjs';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const J = (f) => JSON.parse(fs.readFileSync(path.join(AKAR, f), 'utf8'));
const ada = (f) => fs.existsSync(path.join(AKAR, f));
const TGL = new Date().toISOString().slice(0, 10);
// POSKO_KAB: folder GeoJSON batas kabupaten per provinsi (<kode>.json). Wajib diisi; tanpa nilai bawaan.
const POSKO = process.env.POSKO_KAB || '';
export const RES = 0.01, LON0 = 94.8, LAT0 = 6.4, W = Math.ceil((141.1 - LON0) / RES), H = Math.ceil((6.4 + 11.2) / RES);
export const LAPIS = [
  { id: 'hti', bit: 1, ikon: 'tek-bio', warna: '#2E7D32' }, { id: 'hph', bit: 2, ikon: 'tek-bio', warna: '#00796B' }, { id: 're', bit: 4, ikon: 'tek-bio', warna: '#7CB342' },
  { id: 'sawit', bit: 8, ikon: 'pabrik', warna: '#EF6C00' }, { id: 'mangrove', bit: 16, ikon: 'wilayah', warna: '#0288D1' },
  { id: 'lindung', bit: 32, ikon: 'perisai', warna: '#6A1B9A' }, { id: 'produksi', bit: 64, ikon: 'kajian', warna: '#8D6E63' }, { id: 'adat', bit: 128, ikon: 'orang', warna: '#C62828' },
];
const BIT = Object.fromEntries(LAPIS.map((l) => [l.id, l.bit]));
const KONSESI = ['hti', 'hph', 'sawit'];
export const PASANG = [['hti', 'sawit'], ['hph', 'sawit'], ['hti', 'hph'], ['mangrove', 'hti'], ['mangrove', 'hph'], ['mangrove', 'sawit'], ['lindung', 'hti'], ['lindung', 'hph'], ['lindung', 'sawit'], ['adat', 'hti'], ['adat', 'hph'], ['adat', 'sawit'], ['adat', 'lindung']];
const kunci = (s) => String(s).toLowerCase().replace(/^(kabupaten|kab\.?)\s+/, '').replace(/[^a-z]/g, '');
const normOrg = (s) => String(s || '').toLowerCase().replace(/\b(pt|cv|tbk|persero|perseroan|terbatas|d\/h|dh)\b\.?/g, '').replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '');
const cosLat = (iy) => Math.cos(((LAT0 - (iy + 0.5) * RES) * Math.PI) / 180);
const haSel = (iy) => 111.32 * RES * 110.57 * RES * cosLat(iy) * 100;

/* ---------- siap: geometri kabupaten ---------- */
function dp(p, tol) {
  if (p.length < 5) return p;
  const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1; const st = [[0, p.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let m = 0, mi = -1; const [x1, y1] = p[a], [x2, y2] = p[b], dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) { const [x, y] = p[i]; let d; if (!L) d = Math.hypot(x - x1, y - y1); else { const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / L)); d = Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)); } if (d > m) { m = d; mi = i; } }
    if (m > tol && mi > 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return p.filter((_, i) => keep[i]);
}
export function siap() {
  const daftar = daftarKabkota(), per = new Map(), semua = new Map(), hasil = {}, tanpa = [];
  for (const k of daftar) { const kk = (k.jenis === 'kota' ? 'kota' : '') + k.kunci; per.set(k.prov + '|' + kk, k); semua.set(kk, [...(semua.get(kk) || []), k]); }
  const pakai = new Set();
  if (!POSKO || !fs.existsSync(POSKO)) throw new Error('POSKO_KAB belum diisi: arahkan ke folder GeoJSON batas kabupaten per provinsi (<kode>.json).');
  for (const f of fs.readdirSync(POSKO).filter((x) => /^\d+\.json$/.test(x))) {
    const pv = f.replace('.json', '');
    for (const ft of J_abs(path.join(POSKO, f)).features) {
      const n = ft.properties.kab.replace(/\badministrasi\s+/i, '').replace(/^Toba$/, 'Toba Samosir'), kota = /^kota\s/i.test(n), kk = (kota ? 'kota' : '') + kunci(n.replace(/^kota\s+/i, ''));
      const k = per.get(pv + '|' + kk) || (semua.get(kk)?.length === 1 ? semua.get(kk)[0] : null);
      if (!k) { tanpa.push(pv + ' ' + n); continue; }
      const polys = ft.geometry.type === 'Polygon' ? [ft.geometry.coordinates] : ft.geometry.coordinates;
      const e = hasil[k.kode] || (hasil[k.kode] = { nama: k.nama, prov: k.prov, poli: [] });
      for (const po of polys) e.poli.push(po.map((c) => dp(c, 0.004).map(([x, y]) => [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000])).filter((c) => c.length >= 4));
      pakai.add(k.kode);
    }
  }
  fs.mkdirSync(path.join(AKAR, 'data/lahan'), { recursive: true });
  fs.writeFileSync(path.join(AKAR, 'data/lahan/kabupaten.json'), JSON.stringify({ sumber: 'Batas kabupaten dari repo poskokarhutla (public/geo/kabupaten), disederhanakan 0,004 derajat; kode dari daftar Kemendagri', hasil }));
  console.log('kab terpetakan', pakai.size, 'dari', daftar.length, 'tanpa kecocokan', tanpa.length, tanpa.slice(0, 10));
}
const J_abs = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

/* ---------- rasterisasi ---------- */
function isi(poli, fn) { // poli: [cincin,...] genap-ganjil; fn(ix, iy)
  let minY = 1e9, maxY = -1e9; const sisi = [];
  for (const c of poli) for (let i = 0, j = c.length - 1; i < c.length; j = i++) {
    const [x1, y1] = c[j], [x2, y2] = c[i]; if (y1 === y2) continue;
    sisi.push(y1 < y2 ? [x1, y1, x2, y2] : [x2, y2, x1, y1]); minY = Math.min(minY, y1, y2); maxY = Math.max(maxY, y1, y2);
  }
  const r0 = Math.max(0, Math.ceil((LAT0 - maxY) / RES - 0.5)), r1 = Math.min(H - 1, Math.floor((LAT0 - minY) / RES - 0.5));
  for (let iy = r0; iy <= r1; iy++) {
    const y = LAT0 - (iy + 0.5) * RES, xs = [];
    for (const [x1, y1, x2, y2] of sisi) if (y >= y1 && y < y2) xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.max(0, Math.ceil((xs[k] - LON0) / RES - 0.5)), b = Math.min(W - 1, Math.floor((xs[k + 1] - LON0) / RES - 0.5));
      for (let ix = a; ix <= b; ix++) fn(ix, iy);
    }
  }
}
const sel = (lng, lat) => [Math.floor((lng - LON0) / RES), Math.floor((LAT0 - lat) / RES)];

/* ---------- registri karbon (Fase 1 bila ada, jika tidak karbon_proyek.json) ---------- */
export function muatKarbon() {
  const f = ada('public/data/karbon_registri.json') ? 'public/data/karbon_registri.json' : 'public/data/karbon_proyek.json';
  const d = J(f);
  const baris = (d.baris || d.proyek || []).map((r) => {
    const lat = Number(r.lokasi?.lat ?? r.lat), lng = Number(r.lokasi?.lng ?? r.lng);
    const luas = Number(r.luas_ha ?? r.lokasi?.luas_ha ?? r.kredit?.luas_ha ?? NaN);
    return { id: r.id, nama: r.nama, lat: Number.isFinite(lat) ? lat : null, lng: Number.isFinite(lng) ? lng : null, luas_ha: Number.isFinite(luas) ? luas : null, org: r.organisasi_id || null, pengembang: r.pengembang || null, raw: r };
  });
  return { berkas: f, baris };
}

export function bangun() {
  const K = J_abs(path.join(AKAR, 'data/lahan/kabupaten.json')).hasil, kodeKab = Object.keys(K);
  const kabId = new Uint16Array(W * H), bit = new Uint8Array(W * H), idLayer = { hti: new Uint16Array(W * H), hph: new Uint16Array(W * H), sawit: new Uint16Array(W * H) };
  kodeKab.forEach((kode, i) => { for (const po of K[kode].poli) isi(po, (x, y) => { kabId[y * W + x] = i + 1; }); });
  const berkasLapis = [], pengklaim = [], blokir = [];
  const nama = (kode) => J(`public/data/wilayah/${kode}.json`).nama;
  // konsesi
  const g = J('public/data/geo/lahan_konsesi.geojson');
  for (const f of g.features) {
    const jenis = f.properties.j, lap = jenis === 're' ? 'hph' : jenis, idx = pengklaim.push({ id: f.properties.id, n: f.properties.n, j: jenis, ha_atribut: f.properties.ha }) ;
    for (const po of f.geometry.coordinates) isi(po, (x, y) => { const k = y * W + x; bit[k] |= BIT[jenis]; if (lap in idLayer) { bit[k] |= BIT[lap]; idLayer[lap][k] = idx; } });
  }
  // mangrove, hutan, adat
  for (const f of J('public/data/geo/lahan_mangrove.geojson').features) for (const po of f.geometry.coordinates) isi(po, (x, y) => { bit[y * W + x] |= BIT.mangrove; });
  for (const f of J('public/data/geo/lahan_hutan.geojson').features) { const b = /konservasi|lindung/.test(f.properties.j) ? BIT.lindung : BIT.produksi; for (const po of f.geometry.coordinates) isi(po, (x, y) => { bit[y * W + x] |= b; }); }
  const adatN = J('public/data/geo/lahan_adat.geojson').features.length;
  for (const f of J('public/data/geo/lahan_adat.geojson').features) for (const po of f.geometry.coordinates) isi(po, (x, y) => { bit[y * W + x] |= BIT.adat; });
  // organisasi berlogo
  const org = new Map(); for (const o of J('public/data/organisasi.json').baris) { for (const n of [o.nama, ...(o.nama_lain || [])]) { const k = normOrg(n); if (k.length > 3 && !org.has(k)) org.set(k, o.id); } }

  // agregat per kab
  const akum = kodeKab.map(() => ({ ha: {}, tum: {}, pk: {} }));
  const pasangBit = PASANG.map(([a, b]) => [a + '+' + b, BIT[a], BIT[b]]);
  for (let y = 0; y < H; y++) { const h = haSel(y); for (let x = 0; x < W; x++) {
    const k = y * W + x, v = bit[k], ki = kabId[k]; if (!v || !ki) continue; const a = akum[ki - 1];
    for (const l of LAPIS) if (v & l.bit) a.ha[l.id] = (a.ha[l.id] || 0) + h;
    for (const [nm, b1, b2] of pasangBit) if ((v & b1) && (v & b2)) a.tum[nm] = (a.tum[nm] || 0) + h;
    for (const lay of KONSESI) { const id = idLayer[lay][k]; if (id) a.pk[id] = (a.pk[id] || 0) + h; }
  } }
  // proyek
  const { berkas, baris } = muatKarbon();
  const ebt = J('public/data/proyek_terpadu.json').baris.filter((r) => !r.ragu && r.lat != null && (r.presisi === 'kabupaten' || r.presisi === 'titik_persis'));
  const proyek = [];
  const cakram = (lng, lat, rKm) => { const [cx, cy] = sel(lng, lat), rs = Math.max(0, Math.round(rKm / 1.1)); const o = []; for (let dy = -rs; dy <= rs; dy++) for (let dx = -rs; dx <= rs; dx++) if (dx * dx + dy * dy <= rs * rs + 0.5) { const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < W && y < H) o.push(y * W + x); } return o.length ? o : (cx >= 0 && cy >= 0 && cx < W && cy < H ? [cy * W + cx] : []); };
  const kabDi = (cells) => { const c = {}; for (const k of cells) if (kabId[k]) c[kabId[k]] = (c[kabId[k]] || 0) + 1; const t = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; return t ? kodeKab[t[0] - 1] : null; };
  const tambah = (jenis, p, rKm, hip) => {
    const cells = cakram(p.lng, p.lat, rKm), kab = kabDi(cells), hit = {};
    for (const l of LAPIS) { const n = cells.filter((k) => bit[k] & l.bit).length; if (n) hit[l.id] = Math.round((n / cells.length) * 100) / 100; }
    const nm = {}; for (const lay of KONSESI) { const c = {}; for (const k of cells) { const id = idLayer[lay][k]; if (id) c[id] = (c[id] || 0) + 1; } const t = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; if (t) nm[lay] = pengklaim[t[0] - 1].n; }
    proyek.push({ id: p.id, jenis, nama: p.nama, kab, prov: kab ? K[kab].prov : p.prov_kode || null, lat: p.lat ?? p.lng, lng: p.lng, r_km: Math.round(rKm * 10) / 10, perkiraan: hip, hit, konsesi: nm });
  };
  for (const p of baris) if (p.lat != null) tambah('karbon', p, p.luas_ha ? Math.sqrt(p.luas_ha / Math.PI / 100) : 3, !p.luas_ha);
  for (const p of ebt) tambah('ebt', p, 1, true);

  // keluaran
  const bulat = (n) => Math.round(n);
  const ringkas = (a) => ({ ha: Object.fromEntries(Object.entries(a.ha).map(([k, v]) => [k, bulat(v)])), tumpang: Object.fromEntries(Object.entries(a.tum).map(([k, v]) => [k, bulat(v)])) });
  const topKlaim = (a, n) => Object.entries(a.pk).sort((x, y) => y[1] - x[1]).slice(0, n).map(([id, ha]) => { const p = pengklaim[id - 1]; return { id: p.id, nama: p.n, jenis: p.j, ha: bulat(ha), org: org.get(normOrg(p.n)) || null }; });
  const kabOut = {}, provOut = {};
  kodeKab.forEach((kode, i) => {
    const a = akum[i], pr = K[kode].prov, r = ringkas(a), kp = proyek.filter((p) => p.kab === kode);
    kabOut[kode] = { nama: K[kode].nama, prov: pr, ...r, pengklaim: topKlaim(a, 3), karbon: kp.filter((p) => p.jenis === 'karbon').length, ebt: kp.filter((p) => p.jenis === 'ebt').length };
    const P = provOut[pr] || (provOut[pr] = { nama: nama(pr), ha: {}, tumpang: {}, pk: {}, kab: 0 });
    for (const [k, v] of Object.entries(r.ha)) P.ha[k] = (P.ha[k] || 0) + v;
    for (const [k, v] of Object.entries(r.tumpang)) P.tumpang[k] = (P.tumpang[k] || 0) + v;
    for (const [id, ha] of Object.entries(a.pk)) P.pk[id] = (P.pk[id] || 0) + ha; P.kab++;
  });
  for (const [pr, P] of Object.entries(provOut)) {
    P.pengklaim = topKlaim({ pk: P.pk }, 8); delete P.pk;
    P.n_konsesi = new Set(Object.entries(akum.filter((_, i) => K[kodeKab[i]].prov === pr).reduce((m, a) => Object.assign(m, a.pk), {})).map((x) => x[0])).size;
    const pp = proyek.filter((p) => p.prov === pr);
    P.karbon = pp.filter((p) => p.jenis === 'karbon').length; P.ebt = pp.filter((p) => p.jenis === 'ebt').length;
  }
  const status = [
    { id: 'konsesi', ok: true, sumber: 'KLHK via Global Forest Watch (HTI gfw_wood_fiber v202106, HPH/IUPHHK gfw_logging v202106, sawit gfw_oil_palm v20191031)', lisensi: 'data portal KLHK/GFW, CC BY 4.0 di GFW', tahun: 2021 },
    { id: 'mangrove', ok: true, sumber: 'Global Mangrove Watch 2016', lisensi: 'CC BY 4.0', tahun: 2016 },
    { id: 'hutan', ok: true, sumber: 'KLHK Kawasan Hutan 2017 via Global Forest Watch', lisensi: 'data portal KLHK', tahun: 2017 },
    { id: 'adat', ok: false, alasan: 'LandMark (CC BY-SA 4.0) tidak memuat poligon Indonesia; BRWA (brwa.id) tidak dipanen karena robots.txt menolak crawler AI dan unduhan poligon butuh akun.', fitur: adatN },
    { id: 'ps', ok: false, alasan: 'Peta Perhutanan Sosial KLHK (pskl/geoportal.menlhk.go.id) tidak terjangkau dari lingkungan panen (koneksi gagal, 8 Nov 2026); poligon tidak dikarang.' },
    { id: 'tambang', ok: false, alasan: 'gfw_mining_concessions tidak punya ubin vektor publik (404).' },
    { id: 'gambut', ok: true, sumber: 'dipakai ulang oleh /risiko (public/data/geo/risiko_gambut.geojson), tidak digandakan di sini' },
  ];
  const nasional = { ha: {}, tumpang: {} }; for (const P of Object.values(provOut)) { for (const [k, v] of Object.entries(P.ha)) nasional.ha[k] = (nasional.ha[k] || 0) + v; for (const [k, v] of Object.entries(P.tumpang)) nasional.tumpang[k] = (nasional.tumpang[k] || 0) + v; }
  const out = { lapis: 'publik', dibangun_pada: TGL, tingkat_bukti: 'hipotesis', metode: { grid_derajat: RES, catatan: 'Luas dan tumpang tindih dihitung dari raster sel 0,01 derajat (sekitar 120 ha) atas poligon yang disederhanakan: PERKIRAAN, bukan batas hukum. Proyek berupa titik diberi radius perkiraan (karbon tanpa luas: 3 km; EBT: 1 km), label Hipotesis. Lubang poligon dibuang.' }, registri_karbon: berkas, status, lapis: LAPIS.map(({ id, ikon, warna }) => ({ id, ikon, warna })), nasional: { ha: Object.fromEntries(Object.entries(nasional.ha).map(([k, v]) => [k, bulat(v)])), tumpang: Object.fromEntries(Object.entries(nasional.tumpang).map(([k, v]) => [k, bulat(v)])) }, provinsi: provOut, kabupaten: kabOut, proyek: proyek.filter((p) => p.jenis === 'karbon' || Object.keys(p.hit).length) };
  fs.writeFileSync(path.join(AKAR, 'public/data/klaim_lahan.json'), JSON.stringify(out));
  console.log('klaim_lahan.json', (fs.statSync(path.join(AKAR, 'public/data/klaim_lahan.json')).size / 1024).toFixed(0), 'KB', 'prov', Object.keys(provOut).length, 'kab', kodeKab.length, 'proyek', out.proyek.length, 'nasional', out.nasional.ha);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) { const a = process.argv[2]; if (a === 'siap') siap(); else if (a === 'bangun') bangun(); else console.log('pakai: siap | bangun'); }
