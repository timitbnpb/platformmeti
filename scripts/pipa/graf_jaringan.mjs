// Kembaran jaringan (KJ-02, KJ-03, KJ-11): graf saluran/gardu/pembangkit dari mentah Overpass (OSM, ODbL).
//   node scripts/pipa/graf_jaringan.mjs bangun <dirMentah> <YYYY-MM-DD>
// Tulis public/data/kembaran/{ringkas,objek,energi}.json dan public/geo/kembaran.json. Tanpa jaringan, tanpa jam:
// tanggal dari argumen, urutan keluaran terurut id (dua jalan, masukan sama, byte sama). Kontrak: docs/perencanaan/KEMBARAN-JARINGAN.md.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { sederhanakan, panjangKm, tegMax, WILAYAH } from './data_transmisi.mjs';
import { sumberPelengkap, kotaTerdekat, bppSistem, ruptlProvinsi, ruptlSistem, ruptlJaringan, ruptlJaringanSistem, pendudukKapita, elektrifikasi, potensiProvinsi, ebtDekatGardu } from './kembaran_pelengkap.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const R = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
const mY = 110574, mX = (lat) => 111320 * Math.cos((lat * Math.PI) / 180);
export const jarakM = (a, b) => Math.hypot((a[0] - b[0]) * mX((a[1] + b[1]) / 2), (a[1] - b[1]) * mY);
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
// Operator kanonik: semua varian PLN (PT PLN, PT. PLN (Persero), PLN UIP/UIT/UP3, Perusahaan Listrik Negara) -> satu nama.
export const kanonOp = (n) => { const t = String(n || '').trim(); if (!t) return null; return /(^|[^a-z])pln([^a-z]|$)|perusahaan listrik negara/i.test(t) ? 'PT PLN (Persero)' : t.replace(/\s+/g, ' '); };
export const opId = (n) => (n === 'PT PLN (Persero)' ? 'op_pln' : 'op_' + slug(n));
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x';
const F = (k, v, sat, st, src, tgl, salah) => ({ k, v, sat, st, src, tgl, ...(salah ? { catatan: `tegangan tidak tercatat (tag voltage ${salah} kV di luar kelas 66/70/150/230/275/500, dianggap salah tag)` } : {}) });

// ---------- Faktor emisi per teknologi (g CO2/kWh). EF = IPCC 2006 V2 Bab 2 tabel 2.2 (kg CO2/TJ). Efisiensi = nilai tipikal (st est).
// Daur hidup = langsung (milik kita) + komponen non-langsung AR5 WG3 Annex III Tabel A.III.2 (median lifecycle - median direct: rantai pasok, infrastruktur, metana);
// null bila AR5 tak memuat teknologi itu. Median AR5 (lifecycle / direct): batu bara PC 820/760, gas CC 490/370, biomassa khusus 230/n.a., panas bumi 38/0, hidro 24/0, PV utilitas 48/0, bayu darat 11/0.
const TEKNOLOGI = [
  ['PLTU', 'batubara', 96100, 0.34, 820, 760, 'PLTU batu bara; EF batu bara sub-bituminus; efisiensi 34% tipikal PLTU Indonesia (est); non-langsung AR5 batu bara PC = 820-760'],
  ['PLTGU', 'gas', 56100, 0.5, 490, 370, 'PLTGU siklus gabungan; EF gas alam; efisiensi 50% tipikal (est); non-langsung AR5 gas siklus gabungan = 490-370'],
  ['PLTG', 'gas', 56100, 0.33, null, null, 'PLTG siklus terbuka; efisiensi 33% tipikal (est); AR5 tidak memuat siklus terbuka'],
  ['PLTMG', 'gas', 56100, 0.38, null, null, 'PLTMG mesin gas; efisiensi 38% tipikal (est); AR5 tidak memuat mesin gas'],
  ['PLTD', 'diesel', 74100, 0.35, null, null, 'PLTD; EF gas/diesel oil; efisiensi 35% tipikal (est); AR5 tidak memuat minyak'],
  ['PLTBm', 'bioenergi', 0, 1, 230, 0, 'Biomassa: CO2 biogenik tidak dihitung langsung (IPCC 2006); AR5 biomassa khusus 230 (seluruhnya non-langsung)'],
  ['PLTBg', 'bioenergi', 0, 1, null, null, 'Biogas: CO2 biogenik tidak dihitung langsung; AR5 tidak memuat biogas'],
  ['PLTSa', 'bioenergi', 0, 1, null, null, 'Sampah: fraksi biogenik tidak dipisah; AR5 tidak memuat sampah'],
  ['PLTP', 'panas-bumi', 0, 1, 38, 0, 'Tanpa pembakaran; AR5 panas bumi 38'],
  ['PLTA', 'hidro', 0, 1, 24, 0, 'AR5 hidro 24'],
  ['PLTM', 'hidro', 0, 1, 24, 0, 'AR5 hidro 24'],
  ['PLTMH', 'hidro', 0, 1, 24, 0, 'AR5 hidro 24'],
  ['PLTS', 'surya', 0, 1, 48, 0, 'AR5 PV skala utilitas 48'],
  ['PLTB', 'bayu', 0, 1, 11, 0, 'AR5 bayu darat 11'],
];
export const FAKTOR = TEKNOLOGI.map(([teknologi, jenis, ef, eta, lc, dir, ket]) => { const langsung = Math.round((ef * 3.6) / eta / 1000); return { teknologi, jenis, langsung, daur_hidup: lc == null ? null : langsung + (lc - dir), tambahan_rantai: lc == null ? null : lc - dir, satuan: 'gCO2/kWh', src_langsung: 'ipcc-2006', src_daur: 'ipcc-ar5', st: eta < 1 ? 'est' : 'sumber', ket }; }); // kg/TJ x 3,6 GJ/MWh / eta / 1000 = g/kWh
const FT = Object.fromEntries(FAKTOR.map((f) => [f.teknologi, f]));
const ALIAS_JENIS = { batubara: 'PLTU', gas: 'PLTGU', diesel: 'PLTD', hidro: 'PLTA', 'panas-bumi': 'PLTP', surya: 'PLTS', bayu: 'PLTB', bioenergi: 'PLTBm' };
const RENDAH = new Set(['hidro', 'bayu', 'bioenergi', 'panas-bumi', 'surya']);

// ---------- Graf murni
export function komponen(simpul, sisi) { // union-find; akar = id terkecil
  const p = new Map(simpul.map((s) => [s, s]));
  const cari = (x) => { while (p.get(x) !== x) { p.set(x, p.get(p.get(x))); x = p.get(x); } return x; };
  for (const [a, b] of sisi) { const ra = cari(a), rb = cari(b); if (ra !== rb) p.set(ra < rb ? rb : ra, ra < rb ? ra : rb); }
  return new Map(simpul.map((s) => [s, cari(s)]));
}

export function jembatan(n, sisi) { // Tarjan iteratif; kembalikan Set indeks sisi. Sisi paralel bukan jembatan.
  const adj = Array.from({ length: n }, () => []);
  sisi.forEach(([a, b], i) => { if (a !== b) { adj[a].push([b, i]); adj[b].push([a, i]); } });
  const tin = new Int32Array(n).fill(-1), low = new Int32Array(n), hasil = new Set(); let t = 0;
  for (let s = 0; s < n; s++) {
    if (tin[s] >= 0) continue;
    tin[s] = low[s] = t++; const st = [[s, -1, 0]];
    while (st.length) {
      const f = st[st.length - 1], v = f[0];
      if (f[2] < adj[v].length) {
        const [u, e] = adj[v][f[2]++]; if (e === f[1]) continue;
        if (tin[u] >= 0) low[v] = Math.min(low[v], tin[u]); else { tin[u] = low[u] = t++; st.push([u, e, 0]); }
      } else {
        st.pop();
        if (st.length) { const pr = st[st.length - 1][0]; low[pr] = Math.min(low[pr], low[v]); if (low[v] > tin[pr]) hasil.add(f[1]); }
      }
    }
  }
  return hasil;
}

// Sisi jembatan -> bobot di sisi LEBIH KECIL (jumlah gardu; seri: MW lebih kecil; seri: sisi anak). Kembalikan Map(sisi -> {gi, mva, mw, sisi:'kecil'}).
// akar hanya menentukan pohon rentang; hasilnya tak bergantung padanya.
export function diBelakang(n, sisi, akar, jemb, bobot) {
  const adj = Array.from({ length: n }, () => []);
  sisi.forEach(([a, b], i) => { if (a !== b) { adj[a].push([b, i]); adj[b].push([a, i]); } });
  const pe = new Int32Array(n).fill(-2), par = new Int32Array(n).fill(-1), urut = [akar]; pe[akar] = -1;
  for (let k = 0; k < urut.length; k++) for (const [u, e] of adj[urut[k]]) if (pe[u] === -2) { pe[u] = e; par[u] = urut[k]; urut.push(u); }
  const gi = new Float64Array(n), mw = new Float64Array(n), mva = new Float64Array(n), nm = new Float64Array(n);
  urut.forEach((v) => { const w = bobot[v] || {}; gi[v] = w.gi || 0; mw[v] = w.mw || 0; if (w.mva != null) { mva[v] = w.mva; nm[v] = 1; } });
  for (let k = urut.length - 1; k > 0; k--) { const v = urut[k], p = par[v]; gi[p] += gi[v]; mw[p] += mw[v]; mva[p] += mva[v]; nm[p] += nm[v]; }
  const T = { gi: gi[akar], mw: mw[akar], mva: mva[akar], nm: nm[akar] }, out = new Map();
  for (const v of urut) if (pe[v] >= 0 && jemb.has(pe[v])) {
    const sub = { gi: gi[v], mw: mw[v], mva: mva[v], nm: nm[v] }, lawan = { gi: T.gi - sub.gi, mw: T.mw - sub.mw, mva: T.mva - sub.mva, nm: T.nm - sub.nm };
    const pakai = sub.gi < lawan.gi || (sub.gi === lawan.gi && sub.mw <= lawan.mw) ? sub : lawan;
    out.set(pe[v], { gi: pakai.gi, mva: pakai.nm ? R(pakai.mva) : null, mw: R(pakai.mw), sisi: 'kecil' });
  }
  return out;
}

// ---------- Geometri provinsi
export function siapProv(geo) {
  return geo.features.map((f) => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    const bb = [Infinity, Infinity, -Infinity, -Infinity];
    for (const pl of polys) for (const [x, y] of pl[0]) { bb[0] = Math.min(bb[0], x); bb[1] = Math.min(bb[1], y); bb[2] = Math.max(bb[2], x); bb[3] = Math.max(bb[3], y); }
    return { kode: f.properties.kode, polys, bb };
  }).sort((a, b) => cmp(a.kode, b.kode));
}
function dalamRing(r, x, y) {
  let d = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > y) !== (r[j][1] > y) && x < ((r[j][0] - r[i][0]) * (y - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) d = !d;
  return d;
}
// Di dalam Indonesia: dalam poligon provinsi, atau dalam tolM dari titik poligon (pantai/kabel laut). Ekstrak Geofabrik memuat Timor Leste, Malaysia, PNG.
export function dalamIndonesia(idx, x, y, tolM = 8000) {
  if (provDi(idx, x, y)) return true;
  const d = tolM / 111320 * 1.2;
  for (const p of idx) { if (x < p.bb[0] - d || x > p.bb[2] + d || y < p.bb[1] - d || y > p.bb[3] + d) continue; for (const pl of p.polys) for (const q of pl[0]) if (jarakM([x, y], q) <= tolM) return true; }
  return false;
}
// Provinsi terdekat (titik poligon <= tolM) untuk titik pantai/kabel laut yang jatuh di luar poligon sederhana.
export function provDekat(idx, x, y, tolM = 8000) {
  const d = tolM / 111320 * 1.2; let best = null, bd = tolM;
  for (const p of idx) { if (x < p.bb[0] - d || x > p.bb[2] + d || y < p.bb[1] - d || y > p.bb[3] + d) continue; for (const pl of p.polys) for (const q of pl[0]) { const j = jarakM([x, y], q); if (j <= bd) { bd = j; best = p; } } }
  return best;
}
export function provDi(idx, x, y, hint) {
  const ok = (p) => x >= p.bb[0] && x <= p.bb[2] && y >= p.bb[1] && y <= p.bb[3] && p.polys.some((pl) => dalamRing(pl[0], x, y) && !pl.slice(1).some((h) => dalamRing(h, x, y)));
  if (hint && ok(hint)) return hint;
  return idx.find(ok) || null;
}

// ---------- Parse mentah
const angka = (v) => { const n = parseFloat(String(v || '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
const KV_SAH = new Set([66, 70, 150, 230, 275, 500]);
export const kvMax = (a) => { const v = a.filter((x) => x != null); return v.length ? Math.max(...v) : null; };
export function parseElemen(elemen, eps = 0.0015) {
  const uniq = new Map();
  for (const e of elemen) uniq.set(e.type + e.id, e);
  const ruas = [], gardu = [];
  for (const k of [...uniq.keys()].sort()) {
    const e = uniq.get(k), t = e.tags || {}, kvRaw = tegMax(t.voltage) / 1000; if (kvRaw < 66) continue;
    const kv = KV_SAH.has(kvRaw) ? kvRaw : null, kvSalah = kv == null ? kvRaw : null; // di luar {66,70,150,230,275,500}: salah tag, bukan tegangan
    if ((t.power === 'line' || t.power === 'cable') && e.type === 'way' && e.geometry?.length > 1) {
      const raw = e.geometry.map((g) => [g.lon, g.lat]);
      const c = sederhanakan(raw, eps).map(([x, y]) => [R(x, 5), R(y, 5)]);
      const cir = angka(t.circuits), cab = angka(t.cables);
      ruas.push({ id: 'rs_' + e.id, osm: e.id, kv, kvSalah, nama: t.name || null, op: kanonOp(t.operator), opAsli: (t.operator || '').trim() || null, sirkit: cir ? Math.round(cir) : cab ? Math.max(1, Math.round(cab / 3)) : null, km: panjangKm(raw), c, laut: t.power === 'cable' });
    } else if (t.power === 'substation') {
      let lat, lon, poly = null;
      if (e.type === 'node') { lat = e.lat; lon = e.lon; }
      else if (e.geometry?.length) { lat = e.geometry.reduce((s, g) => s + g.lat, 0) / e.geometry.length; lon = e.geometry.reduce((s, g) => s + g.lon, 0) / e.geometry.length; if (e.geometry.length > 3) poly = e.geometry.map((g) => [g.lon, g.lat]); }
      else continue;
      const mva = angka(t['transformer:rating'] || t.rating);
      gardu.push({ id: 'gi_' + e.type[0] + e.id, osm: e.type[0] + e.id, nama: t.name || null, kv, kvSalah, op: kanonOp(t.operator), opAsli: (t.operator || '').trim() || null, x: R(lon, 5), y: R(lat, 5), poly, mva: mva && mva > 1000 ? R(mva / 1e6) : mva, tahun: /^\d{4}/.test(t.start_date || '') ? +t.start_date.slice(0, 4) : null });
    }
  }
  return { ruas, gardu };
}

// Elemen konstruksi (mentah gf/osm-konstruksi, dari osm_geofabrik.mjs): ruas (power=construction+construction=line|cable, construction:power, line=construction) dan gardu.
// Tegangan hanya bila tercatat (kv kosong = 'tak-tercatat'); TIDAK masuk graf/jembatan.
export function parseKonstruksi(elemen, eps = 0.0015) {
  const uniq = new Map(); for (const e of elemen) uniq.set(e.type + e.id, e);
  const ruas = [], gardu = [];
  for (const k of [...uniq.keys()].sort()) {
    const e = uniq.get(k), t = e.tags || {}, kvRaw = tegMax(t.voltage) / 1000; if (t.voltage && kvRaw < 66) continue;
    const kv = KV_SAH.has(kvRaw) ? kvRaw : null, jenis = t.power === 'construction' ? t.construction : t['construction:power'] || (t.power === 'cable' ? 'cable' : 'line');
    const tahun = /^\d{4}/.test(t.start_date || '') ? +t.start_date.slice(0, 4) : null;
    if (jenis === 'substation') {
      const g = e.type === 'node' ? [e.lon, e.lat] : e.geometry?.length ? [e.geometry.reduce((s, q) => s + q.lon, 0) / e.geometry.length, e.geometry.reduce((s, q) => s + q.lat, 0) / e.geometry.length] : null; if (!g) continue;
      gardu.push({ id: 'kg_' + e.type[0] + e.id, osm: e.type[0] + e.id, nama: t.name || null, kv, x: R(g[0], 5), y: R(g[1], 5), tahun });
    } else if (e.type === 'way' && e.geometry?.length > 1) {
      const raw = e.geometry.map((q) => [q.lon, q.lat]);
      ruas.push({ id: 'kr_' + e.id, osm: e.id, jenis: jenis === 'cable' ? 'cable' : 'line', kv, nama: t.name || null, km: panjangKm(raw), c: sederhanakan(raw, eps).map(([x, y]) => [R(x, 5), R(y, 5)]), tahun });
    }
  }
  return { ruas, gardu };
}
// Ember Yearly Electricity Data (CSV global, CC BY 4.0): Indonesia per tahun -> pembangkitan TWh per bahan bakar, emisi MtCO2e, intensitas gCO2e/kWh.
const JENIS_EMBER = { Coal: 'batubara', Gas: 'gas', 'Other fossil': 'fosil-lain', Hydro: 'hidro', Bioenergy: 'bioenergi', 'Other renewables': 'terbarukan-lain', Solar: 'surya', Wind: 'bayu', 'Net imports': 'impor-bersih' };
export function barisEmber(csv) {
  const per = new Map(), n = (v) => (v === '' || v == null || !Number.isFinite(+v) ? null : +v);
  for (const r of parseCsv(csv).filter((x) => x['ISO 3 code'] === 'IDN' && x['Area type'] === 'Country or economy')) {
    const th = +r.Year, o = per.get(th) || { tahun: th, twh: {}, emisi_mt: {}, total_twh: null, emisi_total_mt: null, intensitas_g_kwh: null, fosil_persen: null, terbarukan_persen: null }, j = JENIS_EMBER[r['Electricity source']];
    if (j) { o.twh[j] = n(r['Generation (TWh)']); if (n(r['Emissions (MtCO2e)']) != null) o.emisi_mt[j] = n(r['Emissions (MtCO2e)']); }
    else if (r['Electricity source'] === 'Total generation') { o.total_twh = n(r['Generation (TWh)']); o.emisi_total_mt = n(r['Emissions (MtCO2e)']); o.intensitas_g_kwh = n(r['Emissions intensity (gCO2e/kWh)']); }
    else if (r['Electricity source'] === 'Fossil') o.fosil_persen = n(r['Share of generation (%)']);
    else if (r['Electricity source'] === 'Renewables') o.terbarukan_persen = n(r['Share of generation (%)']);
    per.set(th, o);
  }
  return [...per.values()].filter((o) => o.total_twh != null).sort((a, b) => a.tahun - b.tahun);
}

// ---------- Butir 1: simpul. Ujung dalam 400 m / poligon gardu -> gardu; ujung < 150 m sesama -> gabung.
export function tempelSimpul(ruas, gardu, o = {}) {
  const rG = o.rGardu ?? 400, rK = o.rGabung ?? 150, C = 0.01;
  const key = (x, y) => Math.floor(x / C) + ',' + Math.floor(y / C);
  const grid = new Map();
  const reg = (g) => { // daftarkan gardu pada sel yang tercakup bbox + 400 m
    const xs = (g.poly || [[g.x, g.y]]).map((p) => p[0]), ys = (g.poly || [[g.x, g.y]]).map((p) => p[1]), m = 0.0045;
    for (let i = Math.floor((Math.min(...xs) - m) / C); i <= Math.floor((Math.max(...xs) + m) / C); i++) for (let j = Math.floor((Math.min(...ys) - m) / C); j <= Math.floor((Math.max(...ys) + m) / C); j++) { const s = i + ',' + j; if (!grid.has(s)) grid.set(s, []); grid.get(s).push(g); }
  };
  gardu.forEach(reg);
  const ujung = []; // {ruas, i(0|1), p}
  for (const r of ruas) { ujung.push({ r: r.id, i: 0, p: r.c[0] }); ujung.push({ r: r.id, i: 1, p: r.c[r.c.length - 1] }); }
  const ke = new Map(), sambung = [], pos = new Map(gardu.map((g) => [g.id, [g.x, g.y]]));
  const sisa = [];
  for (const u of ujung) {
    let best = null, bd = Infinity;
    for (const g of grid.get(key(u.p[0], u.p[1])) || []) {
      const d = jarakM(u.p, [g.x, g.y]);
      const di = d <= rG || (g.poly && dalamRing(g.poly, u.p[0], u.p[1]));
      if (di && d < bd) { bd = d; best = g; }
    }
    if (best) { ke.set(u.r + ':' + u.i, best.id); sambung.push({ ruas: u.r, ujung: u.i, ke: best.id, jarak_m: Math.round(bd), jenis: 'gardu', st: 'hitung' }); } else sisa.push(u);
  }
  // gabung ujung bebas (union-find di sel 0,0015 deg)
  const P = new Map(sisa.map((u) => [u.r + ':' + u.i, u.r + ':' + u.i]));
  const cari = (x) => { while (P.get(x) !== x) { P.set(x, P.get(P.get(x))); x = P.get(x); } return x; };
  const g2 = new Map(), cs = 0.0015, ink = (u) => u.r + ':' + u.i;
  for (const u of sisa) { const s = Math.floor(u.p[0] / cs) + ',' + Math.floor(u.p[1] / cs); if (!g2.has(s)) g2.set(s, []); g2.get(s).push(u); }
  for (const u of sisa) {
    const cx = Math.floor(u.p[0] / cs), cy = Math.floor(u.p[1] / cs);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const v of g2.get(cx + a + ',' + (cy + b)) || []) {
      if (ink(v) <= ink(u) || v.r === u.r) continue;
      const d = jarakM(u.p, v.p); if (d < rK) { const ra = cari(ink(u)), rb = cari(ink(v)); if (ra !== rb) { P.set(ra < rb ? rb : ra, ra < rb ? ra : rb); sambung.push({ ruas: v.r, ujung: v.i, ke: ink(u), jarak_m: Math.round(d), jenis: 'gabung', st: 'hitung' }); } }
    }
  }
  const anggota = new Map();
  for (const u of sisa) { const a = cari(ink(u)); if (!anggota.has(a)) anggota.set(a, []); anggota.get(a).push(u.p); }
  for (const u of sisa) { const a = cari(ink(u)); ke.set(ink(u), 'n_' + a); if (!pos.has('n_' + a)) { const m = anggota.get(a); pos.set('n_' + a, [R(m.reduce((s, p) => s + p[0], 0) / m.length, 5), R(m.reduce((s, p) => s + p[1], 0) / m.length, 5)]); } }
  const ends = new Map(ruas.map((r) => [r.id, [ke.get(r.id + ':0'), ke.get(r.id + ':1')]]));
  sambung.sort((a, b) => cmp(a.ruas + a.ujung, b.ruas + b.ujung));
  return { ends, pos, sambung };
}

// ---------- Titik temu T: ujung ruas bebas yang jatuh di badan ruas lain (<= tolM) -> ruas sasaran dipecah di titik itu, ujung dipindah ke titik itu.
export function pecahT(ruas, gardu, tolM = 50, rGardu = 400) {
  const C = 0.002, key = (i, j) => i + ',' + j, grid = new Map(), gg = new Map();
  for (const g of gardu) { const k = key(Math.floor(g.x / 0.01), Math.floor(g.y / 0.01)); if (!gg.has(k)) gg.set(k, []); gg.get(k).push(g); }
  const dekatGardu = (p) => { const i = Math.floor(p[0] / 0.01), j = Math.floor(p[1] / 0.01); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const g of gg.get(key(i + a, j + b)) || []) if (jarakM(p, [g.x, g.y]) <= rGardu || (g.poly && dalamRing(g.poly, p[0], p[1]))) return true; return false; };
  const byId = new Map(ruas.map((r) => [r.id, r]));
  for (const r of ruas) for (let k = 0; k + 1 < r.c.length; k++) { const [x1, y1] = r.c[k], [x2, y2] = r.c[k + 1]; for (let i = Math.floor((Math.min(x1, x2) - 0.0006) / C); i <= Math.floor((Math.max(x1, x2) + 0.0006) / C); i++) for (let j = Math.floor((Math.min(y1, y2) - 0.0006) / C); j <= Math.floor((Math.max(y1, y2) + 0.0006) / C); j++) { const kk = key(i, j); if (!grid.has(kk)) grid.set(kk, []); grid.get(kk).push([r.id, k]); } }
  const sambung = new Map(); let n = 0;
  for (const r of ruas) for (const ujung of [0, 1]) {
    const P = ujung ? r.c[r.c.length - 1] : r.c[0]; if (dekatGardu(P)) continue;
    let best = null;
    for (const [qid, k] of grid.get(key(Math.floor(P[0] / C), Math.floor(P[1] / C))) || []) {
      if (qid === r.id) continue; const q = byId.get(qid), A = q.c[k], B = q.c[k + 1], m = mX(P[1]);
      const ax = (B[0] - A[0]) * m, ay = (B[1] - A[1]) * mY, l2 = ax * ax + ay * ay, t = l2 ? Math.max(0, Math.min(1, (((P[0] - A[0]) * m) * ax + ((P[1] - A[1]) * mY) * ay) / l2)) : 0;
      const F0 = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t], d = jarakM(P, F0);
      if (d <= tolM && (!best || d < best.d || (d === best.d && qid < best.qid))) best = { d, qid, k, t, F0 };
    }
    if (!best) continue; const q = byId.get(best.qid);
    if (jarakM(best.F0, q.c[0]) < 150 || jarakM(best.F0, q.c[q.c.length - 1]) < 150) continue; // dekat ujung sasaran: sudah ditangani gabung ujung
    const F0 = [R(best.F0[0], 5), R(best.F0[1], 5)]; if (ujung) r.c[r.c.length - 1] = F0; else r.c[0] = F0;
    if (!sambung.has(q.id)) sambung.set(q.id, []); sambung.get(q.id).push({ k: best.k, t: best.t, p: F0 }); n++;
  }
  const out = [];
  for (const r of ruas) {
    const js = sambung.get(r.id); if (!js) { out.push(r); continue; }
    js.sort((a, b) => a.k - b.k || a.t - b.t || cmp(a.p.join(), b.p.join()));
    const tot = panjangKm(r.c) || 1; let cur = [r.c[0]], ji = 0, piece = 0; const pieces = [];
    for (let k = 0; k + 1 < r.c.length; k++) { while (ji < js.length && js[ji].k === k) { cur.push(js[ji].p); pieces.push(cur); cur = [js[ji].p]; ji++; } cur.push(r.c[k + 1]); }
    pieces.push(cur);
    pieces.forEach((c, i) => { if (c.length < 2 || (c.length === 2 && c[0][0] === c[1][0] && c[0][1] === c[1][1])) return; out.push({ ...r, id: i ? r.id + '_' + (i + 1) : r.id, c, km: (r.km * panjangKm(c)) / tot }); piece++; });
  }
  out.pecahan = n; return out;
}

// ---------- Butir 3: jalur = rantai ruas antara simpul kunci (gardu atau derajat != 2)
export function bangunJalur(ruas, ends) {
  const inc = new Map();
  for (const r of ruas) for (const n of ends.get(r.id)) { if (!inc.has(n)) inc.set(n, []); inc.get(n).push(r.id); }
  const byId = new Map(ruas.map((r) => [r.id, r]));
  const kunci = (n) => n.startsWith('gi_') || inc.get(n).length !== 2;
  const lain = (rid, n) => { const [a, b] = ends.get(rid); return a === n ? b : a; };
  const dipakai = new Set(), jalur = [];
  const jalan = (mulai, rid0) => {
    const rs = [rid0]; dipakai.add(rid0); let cur = lain(rid0, mulai);
    while (!kunci(cur)) { const nx = inc.get(cur).find((x) => x !== rs[rs.length - 1] && !dipakai.has(x)); if (!nx) break; rs.push(nx); dipakai.add(nx); cur = lain(nx, cur); }
    jalur.push({ a: mulai, b: cur, rs });
  };
  for (const n of [...inc.keys()].sort()) if (kunci(n)) for (const rid of inc.get(n).slice().sort()) if (!dipakai.has(rid)) jalan(n, rid);
  for (const r of ruas) if (!dipakai.has(r.id)) jalan(ends.get(r.id)[0], r.id); // siklus murni
  for (const j of jalur) {
    const rr = j.rs.map((x) => byId.get(x)); j.kv = kvMax(rr.map((r) => r.kv)); j.km = rr.reduce((s, r) => s + r.km, 0);
    const c = rr.map((r) => r.sirkit).filter((x) => x != null); j.sirkit = c.length ? Math.max(...c) : null;
    j.id = 'jl_' + j.rs.map((x) => x.slice(3)).sort((a, b) => a.length - b.length || cmp(a, b))[0];
  }
  return jalur.sort((a, b) => cmp(a.id, b.id));
}

// ---------- Butir 8-9: bauran, neraca, aliran (murni)
export function bauran(produksi) { // kunci teknologi Statistik (PLTU, PLTGU, ...) atau jenis bahan bakar -> gwh per jenis + intensitas per teknologi
  const gt = {}, g = {};
  for (const [k0, v] of Object.entries(produksi || {})) { if (k0 === 'total' || !(v > 0)) continue; const k = FT[k0] ? k0 : ALIAS_JENIS[k0]; if (!k) continue; gt[k] = (gt[k] || 0) + v; g[FT[k].jenis] = (g[FT[k].jenis] || 0) + v; }
  const total = Object.values(g).reduce((s, v) => s + v, 0);
  if (!(total > 0)) return { gwh: {}, total: 0, tidak_dihitung: true, alasan: 'Tanpa data produksi PLN' };
  const persen = {}; let la = 0, lc = 0, cov = 0, rk = 0;
  for (const [t, v] of Object.entries(gt)) { la += v * FT[t].langsung; if (FT[t].daur_hidup != null) { lc += v * FT[t].daur_hidup; cov += v; } }
  for (const [j, v] of Object.entries(g)) { persen[j] = R((v / total) * 100); if (RENDAH.has(j)) rk += v; }
  const gw = {}; for (const j of Object.keys(g).sort()) gw[j] = R(g[j]);
  const gwT = {}; for (const t of Object.keys(gt).sort()) gwT[t] = R(gt[t]);
  return { gwh: gw, gwh_teknologi: gwT, total: R(total), persen, langsung: Math.round(la / total), daur_hidup: cov / total >= 0.8 ? Math.round(lc / cov) : null, daur_hidup_cakupan_persen: R((cov / total) * 100), rendah_karbon_persen: R((rk / total) * 100), batubara_persen: R(((g.batubara || 0) / total) * 100) };
}
export function neraca(produksi, penjualan, susutPersen) { // GWh; kebutuhan = penjualan / (1 - susut)
  const keb = penjualan / (1 - susutPersen / 100), n = produksi - keb, p = keb ? (n / keb) * 100 : 0;
  return { produksi_gwh: R(produksi), penjualan_gwh: R(penjualan), kebutuhan_gwh: R(keb), neraca_gwh: R(n), persen: R(p), status: Math.abs(p) < 5 ? 'hampir-seimbang' : n > 0 ? 'surplus' : 'defisit' };
}
function selesaikan(A, b) { // Gauss pivot sebagian
  const n = b.length; for (let i = 0; i < n; i++) {
    let m = i; for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[m][i])) m = k;
    [A[i], A[m]] = [A[m], A[i]]; [b[i], b[m]] = [b[m], b[i]];
    for (let k = i + 1; k < n; k++) { const f = A[k][i] / A[i][i]; if (!f) continue; for (let c = i; c < n; c++) A[k][c] -= f * A[i][c]; b[k] -= f * b[i]; }
  }
  const x = new Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let c = i + 1; c < n; c++) s -= A[i][c] * x[c]; x[i] = s / A[i][i]; } return x;
}
// nodes: [{id, neraca_gwh, kebutuhan_gwh}], batas: [{a, b, bobot, maks_mw?}] -> [{a, b, gwh (a->b bila positif), mw, dibatasi?}].
// Per komponen, selisih total disebar menurut kebutuhan. Batas yang melampaui maks_mw dikunci pada maks_mw (arah tetap), lalu sisanya dihitung ulang tanpa sisi itu.
export function alirkan(nodes, batas) {
  const ids = nodes.map((n) => n.id).sort(), N = new Map(nodes.map((n) => [n.id, n])), tetap = new Map();
  let bebas = [], flows = [];
  for (let iter = 0; iter <= batas.length; iter++) {
    const adj = new Map(ids.map((i) => [i, N.get(i).neraca_gwh]));
    for (const [k, f] of tetap) { adj.set(batas[k].a, adj.get(batas[k].a) - f); adj.set(batas[k].b, adj.get(batas[k].b) + f); }
    bebas = batas.map((e, k) => [e, k]).filter(([, k]) => !tetap.has(k));
    const kom = komponen(ids, bebas.map(([e]) => [e.a, e.b])), th = new Map();
    for (const root of [...new Set(kom.values())].sort()) {
      const ang = ids.filter((i) => kom.get(i) === root); if (ang.length < 2) { th.set(ang[0], 0); continue; }
      const S = ang.reduce((s, i) => s + adj.get(i), 0), K = ang.reduce((s, i) => s + N.get(i).kebutuhan_gwh, 0) || 1;
      const P = ang.map((i) => adj.get(i) - (S * N.get(i).kebutuhan_gwh) / K), ix = new Map(ang.map((i, k) => [i, k]));
      const L = ang.map(() => ang.map(() => 0));
      for (const [e] of bebas) if (ix.has(e.a) && e.a !== e.b) { const a = ix.get(e.a), b = ix.get(e.b); L[a][a] += e.bobot; L[b][b] += e.bobot; L[a][b] -= e.bobot; L[b][a] -= e.bobot; }
      const x = selesaikan(L.slice(1).map((r) => r.slice(1)), P.slice(1)); // simpul pertama ditanahkan (theta 0)
      ang.forEach((i, k) => th.set(i, k ? x[k - 1] : 0));
    }
    flows = bebas.map(([e, k]) => ({ k, f: e.bobot * ((th.get(e.a) ?? 0) - (th.get(e.b) ?? 0)) }));
    const lewat = flows.filter(({ k, f }) => batas[k].maks_mw != null && Math.abs(f) / 8.76 > batas[k].maks_mw);
    if (!lewat.length) break;
    for (const { k, f } of lewat) tetap.set(k, Math.sign(f) * batas[k].maks_mw * 8.76);
  }
  const bebasF = new Map(flows.map(({ k, f }) => [k, f]));
  return batas.map((e, k) => { const f = tetap.has(k) ? tetap.get(k) : bebasF.get(k) ?? 0; return { a: e.a, b: e.b, gwh: R(f), mw: R(f / 8.76), ...(tetap.has(k) ? { dibatasi: true } : {}) }; });
}

// ---------- Pembangkit gabungan
const JENIS_GEM = { solar: 'surya', hydropower: 'hidro', geothermal: 'panas-bumi', wind: 'bayu' };
const JENIS_OSM = { solar: 'surya', hydro: 'hidro', geothermal: 'panas-bumi', wind: 'bayu', biomass: 'bioenergi' };
const JENIS_EKSTRA = { gas: 'gas', oil: 'diesel', diesel: 'diesel', solar: 'surya', hydro: 'hidro', wind: 'bayu', geothermal: 'panas-bumi', biomass: 'bioenergi', biogas: 'bioenergi', waste: 'bioenergi' };
const mwTag = (v) => { const m = String(v || '').match(/^([\d.,]+)\s*(k|m|g)?w/i); if (!m) return null; const n = parseFloat(m[1].replace(',', '.')); return R(n * ({ k: 0.001, m: 1, g: 1000 }[(m[2] || 'm').toLowerCase()]), 2); };
// Elemen Overpass power=plant|generator (osm-pembangkit/, opsional) -> baris setara pembangkit_osm.json.
export function barisDariOverpass(elemen) {
  const out = [];
  for (const e of elemen) {
    const t = e.tags || {}; if (t.power !== 'plant' && t.power !== 'generator') continue;
    const sumber = t['plant:source'] || t['generator:source']; const jenis = JENIS_EKSTRA[sumber]; if (!jenis) continue;
    const g = e.geometry?.length ? [e.geometry.reduce((s, q) => s + q.lon, 0) / e.geometry.length, e.geometry.reduce((s, q) => s + q.lat, 0) / e.geometry.length] : e.center ? [e.center.lon, e.center.lat] : e.lat != null ? [e.lon, e.lat] : null; if (!g) continue;
    out.push({ osm_id: e.type + '/' + e.id, jenis: t.power, sumber, jenis_kj: jenis, nama: t.name || null, kapasitas_mw: mwTag(t['plant:output:electricity'] || t['generator:output:electricity']), operator: t.operator || null, tahun: /^\d{4}/.test(t.start_date || '') ? +t.start_date.slice(0, 4) : null, lat: g[1], lng: g[0], ...(t.power === 'plant' && e.geometry?.length > 3 ? { poly: e.geometry.map((q) => [q.lon, q.lat]) } : {}) });
  }
  return out.sort((a, b) => cmp(a.osm_id, b.osm_id));
}
// power=plant dipertahankan; generator di dalam poligon plant digabung (MW dijumlahkan bila plant tanpa kapasitas); generator lain hanya bila >= 1 MW.
export function susunPembangkitOsm(rows) {
  const plant = rows.filter((b) => b.jenis === 'plant').map((b) => ({ ...b })), hasil = [...plant]; let gabung = 0, buang = 0;
  for (const g of rows.filter((b) => b.jenis !== 'plant')) {
    const di = plant.find((p) => p.poly && g.lng >= Math.min(...p.poly.map((q) => q[0])) && g.lng <= Math.max(...p.poly.map((q) => q[0])) && g.lat >= Math.min(...p.poly.map((q) => q[1])) && g.lat <= Math.max(...p.poly.map((q) => q[1])) && dalamRing(p.poly, g.lng, g.lat));
    if (di) { gabung++; if (di.kapasitas_mw == null && g.kapasitas_mw != null) di.kapasitas_mw = R((di.kapasitas_mw_gen = (di.kapasitas_mw_gen || 0) + g.kapasitas_mw), 2); } else if ((g.kapasitas_mw ?? 0) >= 1) hasil.push(g); else buang++;
  }
  hasil.stat = { plant: plant.length, generator_digabung: gabung, generator_dibuang: buang }; return hasil;
}
// CSV kecil (kutip ganda, "" di dalam kutip); tanpa dependensi.
export function parseCsv(t) {
  const rows = []; let r = [], c = '', q = false;
  for (let i = 0; i < t.length; i++) { const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { r.push(c); c = ''; } else if (ch === '\n') { r.push(c); c = ''; rows.push(r); r = []; } else if (ch !== '\r') c += ch; }
  if (c || r.length) { r.push(c); rows.push(r); }
  const [h, ...b] = rows; return b.filter((x) => x.length > 1).map((x) => Object.fromEntries(h.map((k, i) => [k, x[i] ?? ''])));
}
const JENIS_GPPD = { Gas: 'gas', Oil: 'diesel', Coal: 'batubara', Hydro: 'hidro', Geothermal: 'panas-bumi' };
// WRI Global Power Plant Database (CSV, opsional): hanya IDN dan lima bahan bakar di atas.
export function barisGppd(csv) {
  return parseCsv(csv).filter((r) => r.country === 'IDN' && JENIS_GPPD[r.primary_fuel] && r.latitude && r.longitude).map((r) => ({ id: r.gppd_idnr, nama: r.name, jenis: JENIS_GPPD[r.primary_fuel], mw: r.capacity_mw ? R(+r.capacity_mw, 2) : null, tahun: r.commissioning_year ? Math.floor(+r.commissioning_year) || null : null, x: +r.longitude, y: +r.latitude, pemilik: r.owner || null, tglData: String(Math.floor(+r.year_of_capacity_data) || 2021), url: r.url || null })).sort((a, b) => cmp(a.id, b.id));
}
// GEM Global Gas Plant Tracker (CSV peta GreenInfo, CC BY 4.0, Okt 2023): baris per unit dijumlah per proyek. Hanya Indonesia; bahan bakar gas -> gas, hanya diesel/minyak -> diesel; 'waste heat' bukan pembakaran gas.
// Hasil { operasi: [proyek status operating], proyek: [construction | pre-construction, tidak masuk daftar pembangkit] }.
export function barisGemGas(csv) {
  const per = new Map();
  for (const r of parseCsv(csv).filter((x) => x.country === 'Indonesia' && x.lat && x.lng && /^(operating|construction|pre-construction)$/.test(x.status) && !/waste heat/i.test(x.fuel_type))) {
    const jenis = /gas/i.test(r.fuel_type) ? 'gas' : /diesel|fuel oil/i.test(r.fuel_type) ? 'diesel' : null; if (!jenis) continue;
    const k = r.project + '|' + r.status, a = per.get(k) || { id: r.project.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + r.status, nama: r.project, status: r.status, jenis, mw: 0, tahun: null, x: +r.lng, y: +r.lat, pemilik: r.owner || null, url: r.url || null, unit: 0 };
    a.mw = R(a.mw + (+r.capacity || 0), 2); a.unit++; const th = Math.floor(+r.start_year) || null; if (th && (a.tahun == null || th < a.tahun)) a.tahun = th; if (jenis === 'gas') a.jenis = 'gas'; per.set(k, a);
  }
  const semua = [...per.values()].map((a) => ({ ...a, mw: a.mw || null })).sort((a, b) => cmp(a.id, b.id));
  return { operasi: semua.filter((a) => a.status === 'operating'), proyek: semua.filter((a) => a.status !== 'operating') };
}
export function kumpulPembangkit(pltu, gem, osm, ekstra = [], gppd = [], gemGas = []) {
  const unit = new Map(); for (const u of pltu.unit || []) if (u.st === 'operasi') { const a = unit.get(u.pid) || { pln: 0, cap: 0 }; if (u.captive) a.cap += u.mw; else a.pln += u.mw; unit.set(u.pid, a); }
  const L = [];
  for (const b of pltu.baris) if (b.st === 'operasi' && b.lat != null) {
    const a = unit.get(b.id) || { pln: b.mw_operasi, cap: 0 }, base = { grup: 'pltu', nama: b.nama, jenis: 'batubara', bb: ['batubara'], tahun: b.th_awal ?? null, x: b.lng, y: b.lat, pemilik: b.pemilik?.nama || null, op: kanonOp(b.pemilik?.nama), src: 'gem-gcpt', tglData: (pltu.sumber || []).find((x) => x.id === 'gem-gcpt')?.judul?.match(/rilis (\d{4}-\d\d)/)?.[1] ?? null, tautan: [{ jenis: 'pltu', id: b.id, url: '/transisi-pltu?tab=armada' }], org_id: b.pemilik?.org_id || null };
    if (a.pln > 0 || a.cap === 0) L.push({ ...base, id: 'pb_' + b.id, mw: a.pln, captive: false });
    if (a.cap > 0) L.push({ ...base, id: 'pb_' + b.id + '_cap', mw: a.cap, captive: true });
  }
  for (const b of gem.baris) if (b.status === 'operating' && JENIS_GEM[b.tracker] && b.lat != null) L.push({ id: 'pb_' + b.id, grup: 'gem', nama: b.nama, jenis: JENIS_GEM[b.tracker], bb: [JENIS_GEM[b.tracker]], tahun: b.tahun_mulai ?? null, mw: b.kapasitas_mw ?? null, captive: false, x: b.lon, y: b.lat, pemilik: b.pemilik?.[0] || null, op: kanonOp(b.pemilik?.[0]), src: 'gem', tglData: (gem.sumber || []).find((x) => x.tracker === b.tracker)?.rilis ?? null, tautan: [{ jenis: 'gem', id: b.id, url: b.url_wiki || null }] });
  const lama = new Map(osm.baris.map((b) => [b.osm_id, b])); ekstra = susunPembangkitOsm(ekstra); const idEkstra = new Set(ekstra.map((b) => b.osm_id)); // ekstra (mentah segar) menang; proyek_id dari berkas lama dibawa
  const osmBaris = [...osm.baris.filter((b) => JENIS_OSM[b.sumber] && !idEkstra.has(b.osm_id) && (b.jenis === 'plant' || (b.kapasitas_mw ?? 0) >= 1)).map((b) => ({ ...b, jenis_kj: JENIS_OSM[b.sumber] })), ...ekstra.map((b) => ({ ...b, proyek_id: lama.get(b.osm_id)?.proyek_id ?? null }))];
  for (const b of osmBaris) L.push({ id: 'pb_' + b.osm_id.replace('/', ''), grup: b.jenis === 'plant' ? 'osm-plant' : 'osm-gen', nama: b.nama, jenis: b.jenis_kj, bb: [b.jenis_kj], tahun: b.tahun ?? null, mw: b.kapasitas_mw ?? null, captive: false, x: b.lng, y: b.lat, pemilik: b.operator || null, op: kanonOp(b.operator), src: 'osm-pembangkit', tautan: b.proyek_id ? [{ jenis: 'proyek', id: b.proyek_id, url: '/proyek#' + encodeURIComponent(b.proyek_id) }] : [] });
  for (const b of gppd) L.push({ id: 'pb_gppd_' + b.id, grup: 'gppd', nama: b.nama, jenis: b.jenis, bb: [b.jenis], tahun: b.tahun, mw: b.mw, captive: false, x: b.x, y: b.y, pemilik: b.pemilik, op: kanonOp(b.pemilik), src: 'wri-gppd', tglData: b.tglData, catatan: 'data ' + b.tglData + ', bisa usang', tautan: [] });
  for (const b of gemGas) L.push({ id: 'pb_gemgas_' + b.id, grup: 'gem-gas', nama: b.nama, jenis: b.jenis, bb: [b.jenis], tahun: b.tahun, mw: b.mw, captive: false, x: b.x, y: b.y, pemilik: b.pemilik, op: kanonOp(b.pemilik), src: 'gem-ggpt-2023', tglData: '2023-10', catatan: 'GEM Global Gas Plant Tracker, rilis peta Okt 2023', tautan: b.url ? [{ jenis: 'gem', id: b.id, url: b.url }] : [] });
  const urut = { pltu: 0, gem: 1, 'osm-plant': 2, 'osm-gen': 3, 'gem-gas': 4, gppd: 5 }, tambah = (g) => g === 'gppd' || g === 'gem-gas'; // GEM gas sesudah OSM (OSM menang dulu, GEM gas mengisi MW/tahun yang kosong) tetapi sebelum WRI: GEM gas menang atas WRI
  L.sort((a, b) => urut[a.grup] - urut[b.grup] || cmp(a.id, b.id));
  const kept = []; let gppdDedup = 0, gppdLain = 0; // GPPD baru hanya gas/diesel, sisanya hanya mengisi pemenang (batas gzip objek-inti)
  for (const p of L) { // GPPD: cocok dengan captive atau bukan; bila terdedup, isi kapasitas/tahun yang kosong pada pemenang
    const k = kept.find((k) => k.grup !== p.grup && k.jenis === p.jenis && (tambah(p.grup) || k.captive === p.captive) && Math.abs(k.y - p.y) < 0.03 && jarakM([k.x, k.y], [p.x, p.y]) < 2000);
    if (!k) { if (!tambah(p.grup) || p.jenis === 'gas' || p.jenis === 'diesel') kept.push(p); else gppdLain++; } else if (tambah(p.grup)) { gppdDedup++; if (k.mw == null && p.mw != null) k.mw = p.mw; if (k.tahun == null && p.tahun != null) k.tahun = p.tahun; } }
  kumpulPembangkit.gppd = { dedup: gppdDedup, lainDibuang: gppdLain };
  const unik = new Set(); // id pembangkit unik (pertama menang)
  return kept.filter((p) => !unik.has(p.id) && unik.add(p.id)).sort((a, b) => cmp(a.id, b.id));
}

const PULAU = { 1: 'Sumatera', 2: 'Sumatera', 3: 'Jawa', 6: 'Kalimantan', 7: 'Sulawesi', 8: 'Maluku', 9: 'Papua' };
export const pulauProv = (kode) => (kode === '51' || kode === '52' || kode === '53' ? 'Bali dan Nusa Tenggara' : PULAU[kode[0]] || null);
const KAPTIF = /freeport|\bptfi\b|tambang|mining|smelter|nickel|nikel|\bvale\b|weda bay|\bimip\b|morowali|amman|newmont/i; // pemilik/operator tambang atau smelter: jaringan dan pembangkitnya captive
const norm = (n) => String(n || '').toLowerCase().replace(/\b(pt|persero|tbk|cv|perum|perseroan|terbuka)\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// ---------- Statistik resmi (data/kembaran/statistik.json): kartu sistem/provinsi, keandalan, pembanding emisi, tren bauran PLN nasional.
// Semua murni dan deterministik. Tiap baris membawa st/src/tgl dari baris sumbernya; hasil hitungan (jumlah) st 'hitung'.
const bersihNama = (n) => norm(String(n || '').replace(/\b(pt|pln|uid|uiw|uip3b|kota)\b/gi, ' '));
const jum = (a) => R(a.reduce((t, x) => t + x, 0), 2);
const JENIS_PRIMER = { 'BBM (+BBN)': 'bbm', Gas: 'gas', Batubara: 'batubara', BBN: 'bbn', Air: 'hidro', 'Panas Bumi': 'panas-bumi', Biomassa: 'bioenergi', 'EBT lainnya (angin, dll)': 'ebt-lain' };
const ALIAS_GRID = { jamali: 'jawa bali' }; // grid ESDM -> nama sistem kembaran (lainnya cocok hanya bila nama sama persis)
export function statResmi(SR, { sistem, namaProv, kodeProv, ruptl = [] }) {
  // sistem: [{id, nama}]; ruptl: angka_pln jenis beban-puncak; kodeProv: Map(norm(nama) -> kode)
  const kosong = (v) => v == null || Number.isNaN(v);
  // --- beban puncak SISTEM hanya dari RUPTL (nama sistem persis). Tabel 1 Neraca Daya PLN = puncak sisi PEMBANGKIT per satuan PLN (tumpang tindih), BUKAN beban sistem: hanya disimpan sebagai fakta berlabel, bukan ubin.
  const bp = SR.beban_puncak_sistem.filter((r) => !kosong(r.mw)), kartuSistem = [];
  for (const s of sistem) {
    const o = { id: s.id }, kn = bersihNama(s.nama), kata = kn.split(' ');
    const rp = ruptl.filter((x) => norm(x.wilayah) === norm(s.nama) && x.cakupan === 'sistem').sort((a, b) => b.tahun - a.tahun)[0];
    if (rp) o.beban_puncak = { tahun: rp.tahun, mw: rp.nilai, cara: 'nama', unit: rp.wilayah, st: 'sumber', src: rp.src, tgl: String(rp.tahun), id: rp.id, catatan: rp.catatan || null };
    const pu = bp.filter((r) => kata.every((w) => norm(r.sistem_pln).split(' ').includes(w))), tp = Math.max(...pu.map((r) => r.tahun), -Infinity);
    if (pu.length) o.puncak_pembangkit_unit = { label: 'puncak pembangkit unit PLN (Tabel 1), bukan beban sistem', tahun: tp, unit: pu.filter((r) => r.tahun === tp).map((r) => ({ unit: r.sistem_pln, mw: r.mw })).sort((a, b) => cmp(a.unit, b.unit)), st: 'sumber', src: [...new Set(pu.filter((r) => r.tahun === tp).map((r) => r.src))].sort().join(','), tgl: String(tp), catatan: 'Beban puncak pembangkit PLN, sewa, dan IPP per satuan; antar-unit tumpang tindih dan tidak serentak, jangan dijumlahkan atau dibaca sebagai beban sistem' };
    if (o.beban_puncak || o.puncak_pembangkit_unit) kartuSistem.push(o);
  }
  // --- kartu provinsi: MVA per kV (tahun terakhir) dan deret penjualan
  const mv = SR.mva_provinsi_tegangan.filter((r) => r.tingkat === 'provinsi' && r.prov_kode && !kosong(r.mva)), pj0 = SR.penjualan_provinsi.filter((r) => r.prov_kode && !kosong(r.gwh) && !['unit', 'induk'].includes(r.tingkat)), plnAda = new Set(pj0.filter((r) => /^PLN-STAT/.test(r.src)).map((r) => r.tahun + '|' + r.prov_kode)), pj = pj0.filter((r) => /^PLN-STAT/.test(r.src) || !plnAda.has(r.tahun + '|' + r.prov_kode)); // satu sumber per (tahun, provinsi): PLN-STAT bila ada baris provinsi, selain itu BPS; keduanya tak pernah dijumlah (nilai sama 2024 = ganda) // edisi Inggris bertanda tingkat unit/induk: jangan dijumlah sebagai provinsi
  const NAMA_LAIN = { 'west java': '32', 'north maluku': '82', 'central java': '33', 'east java': '35', 'south sulawesi': '73', 'north sumatra': '12', 'west sumatra': '13', 'south sumatra': '16', 'west kalimantan': '61', 'jakarta raya': '31' }; // nama edisi Inggris yang muncul di label unit
  const unitGabungan = (unit, k) => { let u = ' ' + norm(unit) + ' '; const sendiri = [norm(namaProv.get(k) || ''), ...Object.entries(NAMA_LAIN).filter(([, kk]) => kk === k).map(([n]) => n)].filter(Boolean).sort((a, b) => b.length - a.length); for (const n of sendiri) u = u.split(' ' + n + ' ').join('  '); for (const [kk, nm] of namaProv) { const n = norm(nm); if (kk !== k && n && u.includes(' ' + n + ' ')) return true; } return Object.entries(NAMA_LAIN).some(([n, kk]) => kk !== k && u.includes(' ' + n + ' ')); }; // label unit PLN memuat nama provinsi lain (setelah nama sendiri dibuang): baris gabungan, tak sebanding dengan tahun lain
  const keandalanAll = SR.saidi_saifi.filter((r) => r.prov_kode && r.tingkat === 'provinsi' && !kosong(r.saidi_jam)); // edisi unit/induk tak ikut deret provinsi
  const kodes = [...new Set([...mv, ...pj, ...keandalanAll].map((r) => r.prov_kode))].sort(), kartuProvinsi = [];
  for (const k of kodes) {
    const o = { kode: k, nama: namaProv.get(k) || k }, m = mv.filter((r) => r.prov_kode === k);
    if (m.length) { const th = Math.max(...m.map((r) => r.tahun)), mm = m.filter((r) => r.tahun === th), per = {}; for (const r of mm) { const x = per[r.kv] || { mva: 0, unit_trafo: 0, n: 0 }; x.mva += r.mva; x.unit_trafo += r.unit_trafo || 0; x.n++; per[r.kv] = x; } const kv = Object.keys(per).sort((a, b) => (b === '<30' ? -1 : a === '<30' ? 1 : b - a)); o.mva_per_kv = { tahun: th, per_kv: Object.fromEntries(kv.map((q) => [q, R(per[q].mva, 2)])), unit_trafo: Object.fromEntries(kv.map((q) => [q, per[q].unit_trafo])), total_mva: jum(kv.map((q) => per[q].mva)), st: mm.length > 1 ? 'hitung' : 'sumber', src: [...new Set(mm.map((r) => r.src))].sort().join(','), tgl: String(th), unit: [...new Set(mm.map((r) => r.unit))].sort(), catatan: 'Trafo gardu induk milik PLN (Tabel 30); kV "<30" = distribusi' }; }
    { const th = [...new Set(m.map((r) => r.tahun))].sort(); o.deret_total_mva = th.map((t) => { const mm = m.filter((r) => r.tahun === t); return { tahun: t, total_mva: jum(mm.map((r) => r.mva)), st: 'hitung', src: [...new Set(mm.map((r) => r.src))].sort().join(','), tgl: String(t) }; }); if (!o.deret_total_mva.length) delete o.deret_total_mva; }
    { const kk = keandalanAll.filter((r) => r.prov_kode === k).sort((a, b) => a.tahun - b.tahun); if (kk.length) o.keandalan_deret = kk.map((r, i) => { const rs = i && kk[i - 1].saidi_jam > 0 ? r.saidi_jam / kk[i - 1].saidi_jam : null, patah = i > 0 && (r.tahun === 2016 || (rs != null && (rs > 3 || rs < 1 / 3))); return { tahun: r.tahun, unit: r.unit, saidi: r.saidi_jam, saifi: r.saifi_kali, st: r.st, src: r.src, tgl: String(r.tahun), ...(patah ? { patah_edisi: true, alasan: r.tahun === 2016 ? 'edisi-2016' : 'lompat-3x' } : {}) }; }); }
    const dr = [...new Set(pj.filter((r) => r.prov_kode === k).map((r) => r.tahun))].sort().map((th) => { const rr = pj.filter((r) => r.prov_kode === k && r.tahun === th), gab = rr.some((r) => unitGabungan(r.unit, k)); return { tahun: th, gwh: jum(rr.map((r) => r.gwh)), ...(gab ? { patah_edisi: true, alasan: 'unit-gabungan' } : {}), st: rr.length > 1 ? 'hitung' : 'sumber', src: [...new Set(rr.map((r) => r.src))].sort().join(','), tgl: String(th), ...(rr.length > 1 ? { unit: rr.map((r) => r.unit || r.baris).sort() } : {}) }; });
    if (dr.length) o.penjualan_gwh = dr;
    if (o.mva_per_kv || o.penjualan_gwh || o.keandalan_deret) kartuProvinsi.push(o);
  }
  // --- keandalan
  const pecahProv = (unit) => { // "Sulawesi Utara, Tengah dan Gorontalo" -> kode provinsi; potongan tanpa pulau mewarisi kata pertama
    const bagian = String(unit).replace(/^(uid|uiw|pt pln)\s+/i, '').split(/,|\s+dan\s+/i).map((x) => x.trim()).filter(Boolean), pulau = bagian[0].split(' ')[0], hasil = [];
    for (const b of bagian) { const n = norm(b), k = kodeProv.get(n) ?? kodeProv.get(norm(pulau + ' ' + b)) ?? (n === 'yogyakarta' ? kodeProv.get('di yogyakarta') : null); if (k) hasil.push(k); }
    return hasil.sort();
  };
  const keandalan = SR.saidi_saifi.filter((r) => r.unit !== 'Nasional (ESDM)' && r.unit !== 'Indonesia').map((r) => ({ unit: r.unit, tingkat: r.tingkat, prov: r.prov_kode ? [r.prov_kode] : r.tingkat === 'unit' && /^(jawa|luar jawa)$/i.test(r.unit) ? [] : pecahProv(r.unit), tahun: r.tahun, saidi: r.saidi_jam, saifi: r.saifi_kali, st: r.st, src: r.src, tgl: String(r.tahun) })).sort((a, b) => a.tahun - b.tahun || cmp(a.unit, b.unit));
  const keandalanNasional = SR.saidi_saifi.filter((r) => r.unit === 'Nasional (ESDM)' || r.unit === 'Indonesia').map((r) => ({ pengukur: r.unit === 'Indonesia' ? 'PLN' : 'ESDM', tahun: r.tahun, saidi: r.saidi_jam, saifi: r.saifi_kali, st: r.st, src: r.src, tgl: String(r.tahun) })).sort((a, b) => a.tahun - b.tahun || cmp(a.pengukur, b.pengukur));
  // --- faktor emisi resmi: edisi terakhir per grid
  const fe = new Map(); for (const r of SR.faktor_emisi_resmi) { const kk = norm(r.sistem), g = fe.get(kk) || { th: -1, rows: [] }; if (r.tahun > g.th) { g.th = r.tahun; g.rows = []; } if (r.tahun === g.th) g.rows.push(r); fe.set(kk, g); } // nama grid beda huruf besar antar edisi (JAMALI/Jamali)
  const pembanding = [...fe].sort((a, b) => cmp(a[0], b[0])).map(([, g]) => { const r = g.rows[0], grid = r.sistem, n = (v) => (kosong(v) ? null : v); return { grid, provinsi: g.rows.some((x) => x.catatan_provinsi) ? [] : [...new Set(g.rows.map((x) => x.provinsi).filter(Boolean))].sort(), tahun: g.th, om: n(r.om), bm: n(r.bm), cm_ex_post_050: n(r.cm), cm_ex_post_075: n(r.cm_ex_post_075), cm_ex_ante_050: n(r.cm_ex_ante_050), cm_ex_ante_075: n(r.cm_ex_ante_075), ...(g.th <= 2016 ? { ket: 'Edisi 2011-2016 hanya memuat ex-ante/ex-post gabungan; kolom OM/BM kosong' } : {}), satuan: r.satuan, st: r.st, src: r.src, tgl: String(g.th), ket_sumber: 'OM=operating margin, BM=build margin, CM=combined margin; ex-post (realisasi) dan ex-ante (proyeksi) dari Gatrik ESDM' }; });
  // grid -> sistem: nama persis, alias (Jamali = Jawa-Bali), atau semua kata nama sistem ada di nama grid (heuristik); tiap sistem mengambil grid edisi TERBARU, sisanya ke daftar lain
  const cocok = new Map(), dipakai = new Set();
  for (const sis of sistem) {
    const kn = bersihNama(sis.nama), kata = kn.split(' '), cand = [];
    for (const p of pembanding) { const n = norm(p.grid), cara = n === kn ? 'nama' : ALIAS_GRID[n] === kn ? 'alias' : kata.every((w) => n.split(' ').includes(w)) ? 'kata' : null; if (cara) cand.push({ ...p, cara_cocok: cara, ...(cara === 'kata' ? { catatan_cakupan: 'Cocok per kata nama; grid ESDM "' + p.grid + '" bisa mencakup wilayah lebih luas dari sistem kita (mis. Batam-Tanjung Pinang memuat juga Bintan)' } : {}) }); }
    cand.sort((a, b) => b.tahun - a.tahun || cmp(a.grid, b.grid)); if (cand[0]) { cocok.set(sis.id, cand[0]); dipakai.add(cand[0].grid); }
  }
  const lain = pembanding.filter((p) => !dipakai.has(p.grid));
  // --- tren bauran energi primer PLN nasional (persen, ESDM): edisi terbaru menang per (tahun, jenis)
  const tp = new Map(); for (const r of SR.bauran_energi_primer_pln) { const k = r.tahun + '|' + r.jenis, o = tp.get(k); if (!o || r.src > o.src) tp.set(k, r); }
  const tren = [...new Set([...tp.values()].map((r) => r.tahun))].sort().map((th) => { const rr = [...tp.values()].filter((r) => r.tahun === th).sort((a, b) => cmp(a.jenis, b.jenis)); return { tahun: th, persen: Object.fromEntries(rr.map((r) => [JENIS_PRIMER[r.jenis] || r.jenis, r.persen])), jumlah_persen: R(rr.filter((r) => r.jenis !== 'BBN').reduce((t, r) => t + r.persen, 0), 2), catatan: 'BBM (+BBN) sudah memuat BBN; jangan dijumlahkan dua kali (jumlah_persen tanpa baris bbn)', cakupan: 'energi primer pembangkit PLN, nasional (persen)', st: 'sumber', src: [...new Set(rr.map((r) => r.src))].sort().join(','), tgl: String(th) }; });
  const produksiNasional = (SR.produksi_nasional_pln_esdm || []).slice().sort((a, b) => a.tahun - b.tahun).map((r) => ({ tahun: r.tahun, produksi_gwh: r.jumlah_produksi_gwh, pembelian_gwh: r.pembelian_gwh, jumlah_gwh: r.jumlah_gwh, st: r.st ?? 'sumber', src: r.src, tgl: String(r.tahun) }));
  return { produksiNasional, kartuSistem, kartuProvinsi, keandalan, keandalanNasional, pembandingSistem: cocok, pembandingLain: lain, trenPln: tren };
}

// ---------- Bangun semuanya
export function bangun(elemen, ctx, tgl, celahMasukan = []) {
  const provIdx = siapProv(ctx.provinsi);
  const mentah = parseElemen(elemen, ctx.eps), lintasNegara = [];
  const ruas = mentah.ruas.filter((r) => { const d = r.c.map(([x, y]) => dalamIndonesia(provIdx, x, y)); if (!d.some(Boolean)) return false; if (!d.every(Boolean)) lintasNegara.push({ id: r.id, nama: r.nama, kv: r.kv, km: R(r.km), st: 'hitung', src: 'osm-power', tgl }); return true; });
  const gardu = mentah.gardu.filter((g) => dalamIndonesia(provIdx, g.x, g.y));
  const dibuang = { ruas: mentah.ruas.length - ruas.length, gardu: mentah.gardu.length - gardu.length, pembangkit: 0 };
  const namaProv = new Map(ctx.statistik.baris.map((b) => [b.kode, b.provinsi]));
  const pbsSemua = kumpulPembangkit(ctx.pltu, ctx.gem, ctx.osm, ctx.osmEkstra || [], ctx.gppd || [], ctx.gemGas?.operasi || []), pbs = pbsSemua.filter((p) => dalamIndonesia(provIdx, p.x, p.y));
  dibuang.pembangkit = pbsSemua.length - pbs.length;
  const T = ctx.terbitan || {}, ragu = [];
  const lengkap = (x) => ({ ...x, src: x.src ?? 'terbitan', st: x.st ?? 'sumber', tgl: x.tanggal ?? x.tgl ?? (x.tahun ? String(x.tahun) : tgl) });
  const TP = { peristiwa: (T.peristiwa || []).map(lengkap), angka_pln: (T.angka_pln || []).map(lengkap), pembanding_emisi: (T.pembanding_emisi || []).map(lengkap) };
  const SUMBER = (() => { const seen = new Set(); return [
    { id: 'osm-power', judul: 'OpenStreetMap power=line|cable|substation >= 66 kV (ekstrak Geofabrik/Overpass)', lisensi: 'ODbL 1.0', tanggal_data: tgl },
    { id: 'gem', judul: 'Global Energy Monitor trackers (surya, hidro, panas bumi, bayu)', lisensi: 'CC BY 4.0', tanggal_ambil: ctx.gem.tanggal_akses ?? null },
    ...(ctx.gppd?.length ? [{ id: 'wri-gppd', judul: 'Global Power Plant Database v1.3 (WRI), Indonesia: gas, diesel, batu bara, hidro, panas bumi; data kapasitas ~2021', penerbit: 'World Resources Institute', url: 'https://datasets.wri.org/dataset/globalpowerplantdatabase', lisensi: 'CC BY 4.0', atribusi: 'World Resources Institute, Global Power Plant Database v1.3 (CC BY 4.0)' }] : []),
    ...(ctx.gemGas ? [{ id: 'gem-ggpt-2023', judul: 'Global Energy Monitor, Global Gas Plant Tracker (data CSV peta GreenInfo, rilis 31 Okt 2023), Indonesia: unit >= 50 MW, dijumlah per proyek', penerbit: 'Global Energy Monitor', url: 'https://greeninfo-network.github.io/global-gas-plant-tracker/static/data/data.csv', lisensi: 'CC BY 4.0', atribusi: 'Global Energy Monitor, Global Gas Plant Tracker (CC BY 4.0)', tanggal_data: '2023-10-31', tanggal_ambil: ctx.gemGas.tanggal_ambil ?? null }] : []),
    ...(ctx.ember?.length ? [{ id: 'ember-2025', judul: 'Ember, Yearly Electricity Data (global), Indonesia 2000-2025: pembangkitan TWh per bahan bakar, emisi dan intensitas', penerbit: 'Ember', url: 'https://ember-energy.org/data/yearly-electricity-data/', lisensi: 'CC BY 4.0', atribusi: 'Ember, Yearly Electricity Data (CC BY 4.0)', tanggal_ambil: ctx.emberTgl ?? null }] : []),
    { id: 'gem-gcpt', judul: 'Global Coal Plant Tracker', lisensi: 'CC BY 4.0' },
    { id: 'osm-pembangkit', judul: 'OpenStreetMap power=plant|generator', lisensi: 'ODbL 1.0', tanggal_data: tgl },
    { id: 'esdm-statistik-2024', judul: ctx.statistik.sumber, lisensi: 'publikasi pemerintah', tanggal_data: String(ctx.statistik.tahun), tanggal_ambil: ctx.statistik.tanggal_ambil ?? null },
    { id: 'ipcc-2006', judul: 'IPCC 2006 Guidelines for National GHG Inventories, Vol. 2 Energy, Bab 2, Tabel 2.2 (faktor emisi bawaan)', url: 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol2.html' },
    { id: 'ipcc-ar5', judul: 'IPCC AR5 WG3 Annex III Tabel A.III.2 (emisi daur hidup median)', url: 'https://www.ipcc.ch/report/ar5/wg3/' },
    ...(ctx.sistem_pln.sumber || []).filter((x) => x.id === 'riset-ruptl-2025').map((x) => ({ id: x.id, judul: x.judul, lisensi: 'publikasi pemerintah' })),
    { id: 'terbitan', judul: 'Fakta terbitan terkurasi (data/kembaran/terbitan.json) dari dokumen publik PLN/ESDM', lisensi: 'sesuai sumber asal' },
    { id: 'big', judul: 'BIG Satu Peta (RBI 1:25.000 utilitas): garis jaringan listrik tanpa tegangan/MVA/tahun, hanya Riau-Jambi 2018 dan Kalimantan 2016; dipakai membandingkan km OSM di cakupan itu', lisensi: 'sesuai BIG (atribusi Badan Informasi Geospasial)' },
    ...sumberPelengkap(ctx),
    ...(ctx.statResmi?.sumber || []).map((x) => ({ id: x.id, judul: x.judul, penerbit: x.penerbit, url: x.url, ...(x.arsip ? { arsip: x.arsip } : {}), lisensi: x.lisensi, tanggal_data: x.tanggal_terbit ?? null, tanggal_ambil: x.tanggal_baca ?? null })),
    ...(T.sumber || [])].filter((x) => !seen.has(x.id) && seen.add(x.id)); })();
  const garduBy = new Map(gardu.map((g) => [g.id, g]));
  let hint = null; const provPoint = (x, y) => { const h = provDi(provIdx, x, y, hint); if (h) { hint = h; return h.kode; } return provDekat(provIdx, x, y)?.kode ?? null; };
  for (const g of gardu) g.prov = provPoint(g.x, g.y);
  const kodeProv = new Map([...namaProv].map(([k, n]) => [norm(n), k]));
  const inti = (n) => norm(String(n || '').replace(/\d+([.,]\d+)?\s*(kv|mva|mw)\b/gi, ' ').replace(/\b(gitet|gis|gi|gardu induk|ext|new|tx|x|\d+)\b/gi, ' ')); // nama gardu tanpa awalan/tegangan/MVA
  const sisiKode = (u) => kodeProv.get(norm(u?.provinsi));
  const garduDekatNama = (u, kv) => { const k = sisiKode(u), c = inti(u?.gardu || u?.nama); if (!c) return null; const h = gardu.filter((g) => (g.kv ?? 0) >= kv && (!k || g.prov === k) && g.nama && inti(g.nama) === c); return h.sort((a, b) => b.kv - a.kv || cmp(a.id, b.id))[0] || null; };
  const sambunganDicatat = [];
  for (const sb of T.sambungan_diketahui || []) { // asal: terbitan; hanya status beroperasi; garis lurus antara dua gardu OSM
    if (sb.status && sb.status !== 'beroperasi') continue;
    const kv = sb.tegangan_kv ?? sb.kv ?? 0;
    // nama gardu persis (setelah normalisasi); bila hanya nama tempat: satu-satunya gardu di provinsi itu yang namanya memuat/dimuat nama tempat; selain itu ragu
    const cari = (u) => { const g = garduDekatNama(u, kv); if (g) return g; const k = sisiKode(u), c = inti(u?.nama); if (!c || c.length < 4) return null; const h = gardu.filter((q) => (q.kv ?? 0) >= kv && q.prov === k && q.nama && (inti(q.nama).includes(c) || c.includes(inti(q.nama)) && inti(q.nama).length >= 4)); return h.length === 1 ? h[0] : null; };
    const ga = cari(sb.ujung_a), gb = cari(sb.ujung_b), cara = 'nama';
    if (!ga || !gb || ga.id === gb.id) { ragu.push({ jenis: 'sambungan_terbitan', id: sb.id ?? null, alasan: 'ujung tidak cocok ke gardu OSM menurut nama (atau tak tunggal)' }); continue; }
    sambunganDicatat.push({ id: sb.id, a: ga.id, b: gb.id, cara, st: 'hitung', src: sb.src ?? 'terbitan', prov: [ga.prov, gb.prov] });
    ruas.push({ id: 'rs_t_' + slug(sb.id ?? ga.id + '-' + gb.id), osm: null, kv: kv || kvMax([ga.kv, gb.kv]), nama: sb.nama || null, op: null, sirkit: sb.sirkit ?? null, km: sb.panjang_km ?? jarakM([ga.x, ga.y], [gb.x, gb.y]) / 1000, c: [[ga.x, ga.y], [gb.x, gb.y]], laut: /laut/.test(sb.jenis_saluran || ''), asal: 'terbitan', srcT: sb.src ?? 'terbitan', sbId: sb.id });
  }
  { const hasil = pecahT(ruas, gardu); dibuang.titik_temu_t = hasil.pecahan; ruas.splice(0, ruas.length, ...hasil); }
  ruas.sort((a, b) => cmp(a.id, b.id));
  const { ends, pos, sambung } = tempelSimpul(ruas, gardu);
  const ruasBy = new Map(ruas.map((r) => [r.id, r]));

  // sistem (komponen ruas)
  const simpul = [...pos.keys()].filter((n) => [...ends.values()].some(() => true)), nodes = [...new Set([...ends.values()].flat())].sort();
  const kom = komponen(nodes, [...ends.values()]);
  const sisInfo = new Map();
  for (const r of ruas) { const root = kom.get(ends.get(r.id)[0]); const s = sisInfo.get(root) || { root, ruas: [], km: 0 }; s.ruas.push(r); s.km += r.km; sisInfo.set(root, s); }
  const semua = [...sisInfo.values()].sort((a, b) => b.km - a.km || cmp(a.root, b.root));
  const besar = semua.filter((s) => s.km >= 50), kecil = semua.filter((s) => s.km < 50);
  for (const s of besar) {
    s.nodes = nodes.filter((n) => kom.get(n) === s.root); s.gardu = s.nodes.filter((n) => n.startsWith('gi_')).map((n) => garduBy.get(n));
    const xs = s.nodes.map((n) => pos.get(n)[0]), ys = s.nodes.map((n) => pos.get(n)[1]);
    s.bbox = [R(Math.min(...xs), 3), R(Math.min(...ys), 3), R(Math.max(...xs), 3), R(Math.max(...ys), 3)]; s.cx = (s.bbox[0] + s.bbox[2]) / 2; s.cy = (s.bbox[1] + s.bbox[3]) / 2;
    s.kv_maks = kvMax(s.ruas.map((r) => r.kv));
  }
  // pembangkit -> gardu: bertegangan TERTINGGI dalam 15 km (seri: terdekat)
  const sisDariNode = new Map(); for (const s of besar) for (const n of s.nodes) sisDariNode.set(n, s);
  const gardu15 = gardu.slice().sort((a, b) => a.y - b.y);
  for (const p of pbs) {
    let best = null, bk = -1, bd = Infinity;
    for (const g of gardu15) { if (Math.abs(g.y - p.y) > 0.14) continue; const d = jarakM([p.x, p.y], [g.x, g.y]); if (d > 15000) continue; const k = g.kv ?? 0; if (k > bk || (k === bk && d < bd)) { bk = k; bd = d; best = g; } }
    p.gi = best ? best.id : null; p.jarak_gi_km = best ? R(bd / 1000, 1) : null;
  }
  { const keep = pbs.filter((p) => p.mw != null || p.gi); dibuang.pembangkit_tanpa_kapasitas_dan_gardu = pbs.length - keep.length; pbs.splice(0, pbs.length, ...keep); } // tanpa kapasitas dan tanpa gardu 15 km: tak berguna di graf, memberatkan potret
  for (const p of pbs) p.prov = provPoint(p.x, p.y);
  // pembangkit milik tambang/smelter/industri (mis. Freeport) = captive walau sumbernya (GEM gas, WRI, OSM) tak menandainya
  for (const p of pbs) if (!p.captive && KAPTIF.test(p.pemilik || '')) { p.captive = true; p.captive_dari_pemilik = true; }
  const hitungPre = () => { for (const s of besar) { s.mwPre = 0; s.capPre = 0; } for (const p of pbs) { const s = p.gi && sisDariNode.get(p.gi); if (s) { if (p.captive) s.capPre += p.mw || 0; else s.mwPre += p.mw || 0; } } };
  hitungPre();
  // captive = jaringan tambang/smelter: ditentukan dari operator jaringan (ruas/gardu beroperator tambang > 50% dari yang beroperator) ATAU captive jauh melebihi PLN
  const opKaptif = (s) => { const ops = [...s.ruas.map((r) => r.op), ...s.gardu.map((g) => g.op)].filter(Boolean); return ops.length > 0 && ops.filter((o) => KAPTIF.test(o)).length / ops.length > 0.5; };
  for (const s of besar) s.captive = (s.capPre > 0 && s.capPre > 5 * s.mwPre) || opKaptif(s);
  // pembangkit PLN tidak boleh tertempel ke gardu jaringan captive: cari gardu bukan-captive dalam 15 km (tegangan tertinggi, seri terdekat); selain itu tak tersambung
  const captiveGi = (id) => !!id && !!sisDariNode.get(id)?.captive; dibuang.pln_lepas_dari_captive = 0; dibuang.pln_tak_tersambung_captive = 0;
  for (const p of pbs) if (!p.captive && captiveGi(p.gi)) {
    let best = null, bk = -1, bd = Infinity;
    for (const g of gardu15) { if (Math.abs(g.y - p.y) > 0.14 || captiveGi(g.id)) continue; const d = jarakM([p.x, p.y], [g.x, g.y]); if (d > 15000) continue; const k = g.kv ?? 0; if (k > bk || (k === bk && d < bd)) { bk = k; bd = d; best = g; } }
    p.gi = best ? best.id : null; p.jarak_gi_km = best ? R(bd / 1000, 1) : null; if (best) dibuang.pln_lepas_dari_captive++; else dibuang.pln_tak_tersambung_captive++;
  }
  // pembangkit captive dalam 15 km dari gardu jaringan captive: tertempel ke gardu captive itu (terdekat) agar mw_captive jaringan captive terhitung
  dibuang.captive_ke_jaringan_captive = 0;
  for (const p of pbs) if (p.captive) {
    let best = null, bd = Infinity;
    for (const g of gardu15) { if (Math.abs(g.y - p.y) > 0.14 || !captiveGi(g.id)) continue; const d = jarakM([p.x, p.y], [g.x, g.y]); if (d <= 15000 && d < bd) { bd = d; best = g; } }
    if (best && p.gi !== best.id) { p.gi = best.id; p.jarak_gi_km = R(bd / 1000, 1); dibuang.captive_ke_jaringan_captive++; }
    else if (!best) { const sc = besar.find((q) => q.captive && p.x >= q.bbox[0] - 0.03 && p.x <= q.bbox[2] + 0.03 && p.y >= q.bbox[1] - 0.03 && p.y <= q.bbox[3] + 0.03); if (sc) { p.sis_captive = sc; p.gi = null; p.jarak_gi_km = null; dibuang.captive_ke_jaringan_captive++; } } // pembangkit captive di dalam kotak jaringan captive (gardu terdekat > 15 km atau milik jaringan PLN): dihitung ke jaringan captive itu
  }
  hitungPre();
  for (const s of besar) s.potongan = !s.captive && (s.gardu.length < 5 || s.mwPre === 0);
  const pakai = new Set(); const beri = (s, n) => { let nm = n, i = 2; while (pakai.has(nm)) nm = n + ' ' + i++; pakai.add(nm); s.nama = nm; };
  const bersih = (n) => n.replace(/^(gardu induk|gardu|gitet|gis|gi)\s+/i, '').replace(/\s*\d+\s*kv.*$/i, '').trim();
  // Nama sistem (aturan di meta.aturan_nama_sistem): Jawa-Bali, Sumatera menurut geografi (hanya sistem utama); nama RUPTL hanya bila >= 3 gardu, >= 100 km dan mayoritas GARDU
  // berada di provinsi sistem PLN itu; multi-provinsi: "<pulau> bagian <arah>"; satu provinsi lintas kota: "<provinsi> bagian <arah>"; satu kota: nama kabupaten/kota;
  // komponen < 5 gardu atau MW PLN 0: "Potongan <nama>"; jaringan captive: "Jaringan captive <nama>". Semua st hitung (pencocokan heuristik).
  const urutProv = (r) => (r.seq ??= (() => { const q = []; for (const [x, y] of r.c) { const k = provPoint(x, y); if (k && q[q.length - 1] !== k) q.push(k); } return q; })());
  const adm2 = ctx.pusat || [], plnSis = ctx.sistem_pln.baris;
  for (const s of besar) { s.provW = new Map(); for (const r of s.ruas) for (const k of new Set(urutProv(r))) s.provW.set(k, (s.provW.get(k) || 0) + 1); s.provG = new Map(); for (const g of s.gardu) if (g.prov) s.provG.set(g.prov, (s.provG.get(g.prov) || 0) + 1); }
  const terbesarProv = (s) => [...(s.provG.size ? s.provG : s.provW)].sort((a, b) => b[1] - a[1] || cmp(a[0], b[0]))[0]?.[0];
  const kotaMap = (s) => { const c = new Map(); for (const g of s.gardu) { if (!g.prov) continue; const pn = namaProv.get(g.prov); let best = null, bd = Infinity; for (const a of adm2) { if (a.provinsi !== pn) continue; const d = jarakM([g.x, g.y], [a.lng, a.lat]); if (d < bd) { bd = d; best = a; } } if (best) c.set(best.asli, (c.get(best.asli) || 0) + 1); } return c; };
  const kota = (s) => { const c = kotaMap(s), top = [...c].sort((a, b) => b[1] - a[1] || cmp(a[0], b[0]))[0]; const tot = [...c.values()].reduce((a, v) => a + v, 0); return { nama: top ? top[0] : null, tunggal: !!top && top[1] / tot >= 0.8 }; };
  const gardu0 = (s) => { const nm = s.gardu.filter((g) => g.nama && bersih(g.nama)).sort((a, b) => jarakM([a.x, a.y], [s.cx, s.cy]) - jarakM([b.x, b.y], [s.cx, s.cy]) || cmp(a.id, b.id))[0]; return nm ? bersih(nm.nama) : null; };
  const kotaGN = (s) => (ctx.geonames ? (kotaTerdekat(ctx.geonames, s.cx, s.cy) ?? kotaTerdekat(ctx.geonames, s.cx, s.cy, 60))?.nama ?? null : null); // GeoNames: kota/kabupaten terpadat dalam 25 km (kosong: 60 km) dari pusat sistem; tanpa GeoNames atau tanpa kota -> nama gardu terdekat
  const kotak = new Map(); const kotakDari = (f) => { const b = kotak.get(f.kode) || f.bb; kotak.set(f.kode, b); return b; };
  const pulauBox = new Map(); for (const f of provIdx) { const pl = pulauProv(f.kode); const b = pulauBox.get(pl) || [Infinity, Infinity, -Infinity, -Infinity]; pulauBox.set(pl, [Math.min(b[0], f.bb[0]), Math.min(b[1], f.bb[1]), Math.max(b[2], f.bb[2]), Math.max(b[3], f.bb[3])]); }
  const arahBox = (s, [x0, y0, x1, y1]) => { const fx = (s.cx - x0) / (x1 - x0), fy = (s.cy - y0) / (y1 - y0), dx = fx - 0.5, dy = fy - 0.5; if (Math.max(Math.abs(dx), Math.abs(dy)) < 0.17) return 'tengah'; return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'timur' : 'barat') : (dy > 0 ? 'utara' : 'selatan'); };
  const jb = besar.find((s) => !s.potongan && !s.captive && s.cx > 105 && s.cx < 116 && s.cy > -9 && s.cy < -5.5); if (jb) { beri(jb, 'Jawa-Bali'); jb.namaSumber = 'hitung'; }
  const sm = besar.find((s) => s !== jb && !s.potongan && !s.captive && s.cx > 95 && s.cx < 108 && s.cy > -6.5 && s.cy < 6); if (sm) { beri(sm, 'Sumatera'); sm.namaSumber = 'hitung'; }
  for (const s of besar) if (!s.nama) {
    const k = kota(s), g0 = kotaGN(s) || gardu0(s), pTop = terbesarProv(s), pn = namaProv.get(pTop) || null; let nm, sumber = 'hitung';
    if (s.captive) nm = `Jaringan captive ${k.nama || g0 || pn || s.root.replace(/^\D+/, '').slice(0, 8)}`;
    else if (s.potongan) nm = `Potongan ${g0 || k.nama || pn || s.root.replace(/^\D+/, '').slice(0, 8)}`;
    else {
      const nG = s.gardu.length || 1, cocok = plnSis.filter((x) => !['jawa-bali', 'sumbagut', 'sumbagselteng'].includes(x.id)).map((x) => [x, s.gardu.filter((g) => x.provinsi.some((q) => q.kode === g.prov)).length / nG]).sort((a, b) => b[1] - a[1] || cmp(a[0].id, b[0].id))[0];
      const multi = [...s.provG].filter(([, v]) => v / nG >= 0.15).length >= 2;
      if (s.gardu.length >= 3 && s.km >= 100 && cocok && cocok[1] > 0.5) { nm = cocok[0].nama.id.replace(/\s*\(.*\)/, ''); sumber = 'riset-ruptl-2025'; s.wilayahRuptl = nm; }
      else if (multi) { const pl = pulauProv(pTop); nm = pl && pulauBox.has(pl) ? `${pl} bagian ${arahBox(s, pulauBox.get(pl))}` : `Sistem ${g0 || pn}`; }
      else if (k.tunggal && k.nama) nm = k.nama;
      else if (pn) nm = `${pn} bagian ${arahBox(s, provIdx.find((f) => f.kode === pTop).bb)}`;
      else nm = `Sistem ${g0 || s.root.replace(/^\D+/, '').slice(0, 8)}`;
    }
    if (pakai.has(nm)) { const t = kota(s).nama || g0; if (t && !nm.includes(t)) nm = `${nm} (${t})`; }
    beri(s, nm); s.namaSumber = sumber;
  }
  { // beberapa sistem OSM berbagi satu wilayah RUPTL (mis. Nusa Tenggara = Flores, Timor, Lombok, Sumbawa): tak satu pun pantas memakai nama wilayah; pakai Sistem <kota> dan simpan wilayah RUPTL di field terpisah
    const grup = new Map(); for (const s of besar) if (s.wilayahRuptl) { if (!grup.has(s.wilayahRuptl)) grup.set(s.wilayahRuptl, []); grup.get(s.wilayahRuptl).push(s); }
    for (const [w, ss] of grup) if (ss.length > 1) for (const s of ss.sort((a, b) => b.km - a.km || cmp(a.root, b.root))) { pakai.delete(s.nama); s.namaSumber = 'hitung'; }
    for (const [, ss] of grup) if (ss.length > 1) for (const s of ss) beri(s, `Sistem ${kotaGN(s) || kota(s).nama || gardu0(s) || s.root.replace(/^\D+/, '').slice(0, 8)}`);
  }
  { const dipakai = new Set(); besar.forEach((s) => { let id = 'sis_' + slug(s.nama), n = 2; while (dipakai.has(id)) id = 'sis_' + slug(s.nama) + '-' + n++; dipakai.add(id); s.id = id; }); }

  const batasRaw = new Map();
  for (const r of ruas) {
    const seq = urutProv(r);
    r.prov = [...new Set(seq)].sort(); r.seq = seq;
    r.sis = sisDariNode.get(ends.get(r.id)[0])?.id || null;
    if (r.sis) for (let i = 1; i < seq.length; i++) if (seq[i] !== seq[i - 1]) { const [a, b] = [seq[i - 1], seq[i]].sort(); const k = a + '|' + b + '|' + r.sis; const o = batasRaw.get(k) || { a, b, sis: r.sis, sirkit: {}, ruas: 0, tanpa: 0 }; const kvk = r.kv ?? 'tak'; o.sirkit[kvk] = (o.sirkit[kvk] || 0) + (r.sirkit || 1); if (!r.sirkit) o.tanpa++; o.ruas++; batasRaw.set(k, o); }
  }

  // jalur, jembatan, di belakang
  const jalur = bangunJalur(ruas, ends);
  for (const s of besar) {
    s.jalur = jalur.filter((j) => sisDariNode.get(j.a) === s);
    const ix = new Map(); const nn = [...new Set(s.jalur.flatMap((j) => [j.a, j.b]))].sort(); nn.forEach((n, i) => ix.set(n, i));
    const sisi = s.jalur.map((j) => [ix.get(j.a), ix.get(j.b)]), jm = jembatan(nn.length, sisi);
    const bobot = nn.map(() => ({ gi: 0, mva: null, mw: 0 }));
    nn.forEach((n, i) => { if (n.startsWith('gi_')) { const g = garduBy.get(n); bobot[i].gi = 1; bobot[i].mva = g.mva; } });
    s.mw_pln = 0; s.mw_captive = 0;
    for (const p of pbs) if (p.gi && ix.has(p.gi)) { if (p.captive) { s.mw_captive += p.mw || 0; (s.pemilikCap ??= new Set()).add(p.pemilik || p.op || 'tanpa nama'); continue; } bobot[ix.get(p.gi)].mw += p.mw || 0; s.mw_pln += p.mw || 0; p.sis = s.id; }
    let akar = -1, mx = -1; nn.forEach((n, i) => { if (bobot[i].mw > mx) { mx = bobot[i].mw; akar = i; } });
    const bel = nn.length ? diBelakang(nn.length, sisi, Math.max(akar, 0), jm, bobot) : new Map();
    s.jalur.forEach((j, i) => { j.tunggal = jm.has(i); j.belakang = j.tunggal && bel.has(i) ? bel.get(i) : null; j.sis = s.id; });
    for (const p of pbs) if (p.captive && p.sis_captive === s) { s.mw_captive += p.mw || 0; (s.pemilikCap ??= new Set()).add(p.pemilik || p.op || 'tanpa nama'); }
    s.mw_pln = R(s.mw_pln); s.mw_captive = R(s.mw_captive);
  }
  for (const j of jalur) if (!j.sis) { j.tunggal = false; j.belakang = null; j.sis = null; }
  const kvT = (v) => (v == null ? 'tegangan tak tercatat' : v + ' kV');
  const namaGi = (n) => (n.startsWith('gi_') ? garduBy.get(n)?.nama || null : null);
  const dekat = (n, kecuali) => { const q = pos.get(n); let best = null, bd = Infinity; for (const g of gardu) { if (!g.nama || g.nama === kecuali || Math.abs(g.y - q[1]) > 1) continue; const d = jarakM(q, [g.x, g.y]); if (d < bd) { bd = d; best = g; } } return best?.nama || null; };
  for (const j of jalur) {
    const na = namaGi(j.a), nb = namaGi(j.b), fb = `Jalur ${kvT(j.kv)} ${j.id.slice(-6)}`;
    if (j.a === j.b && (na || nb)) j.nama = `Ruas ${kvT(j.kv)} dekat ${na || nb}`;
    else if (na && nb && na !== nb) j.nama = `${na} ke ${nb}`;
    else if (na || nb) { const g = na || nb, x = dekat(na ? j.b : j.a, g); j.nama = x ? `${g} ke titik cabang dekat ${x}` : `${g} ke titik cabang`; }
    else { const x = dekat(j.a) || dekat(j.b); j.nama = x ? `Ruas ${kvT(j.kv)} dekat ${x}` : fb; }
  }
  const jalurDariRuas = new Map(); for (const j of jalur) for (const r of j.rs) jalurDariRuas.set(r, j);
  for (const r of ruas) { const j = jalurDariRuas.get(r.id); r.jl = j.id; r.namaJl = j.nama; r.tunggal = j.tunggal; r.belakang = j.belakang; }
  const derajat = new Map(); for (const j of jalur) for (const n of new Set([j.a, j.b])) derajat.set(n, (derajat.get(n) || 0) + 1);

  // ------ objek.json
  for (const p of pbs) if (p.captive) p.gi = null; // captive: tak masuk relasi gardu/sistem (kartu: "tidak tersambung ke sistem mana pun")
  const kelas = (kv) => (kv >= 500 ? '500' : kv >= 230 ? '230-275' : kv >= 115 ? '115-150' : kv >= 66 ? '66-70' : 'tak-tercatat');
  const obj = { op: [], sis: [], prov: [], pb: [], gi: [], jl: [], rs: [], sambung_simpul: sambung.filter((s) => s.jenis === 'gabung' || s.jarak_m >= 100).map((s) => [s.ruas, s.ujung, s.ke, s.jarak_m, s.jenis]) }; // tempelan < 100 m ke gardu tak dicatat satu-satu (ukuran); jumlahnya di ringkas.angka
  const giIds = (r) => ends.get(r.id).map((n) => (n.startsWith('gi_') ? n : null));
  const rsDiGi = new Map(); for (const r of ruas) for (const n of new Set(ends.get(r.id))) if (n.startsWith('gi_')) { if (!rsDiGi.has(n)) rsDiGi.set(n, []); rsDiGi.get(n).push(r.id); }
  for (const g of gardu) if (!g.op) { const c = new Map(); for (const rid of (rsDiGi.get(g.id) || [])) { const o = ruasBy.get(rid).op; if (o) c.set(o, (c.get(o) || 0) + 1); } const [o] = [...c].sort((a, b) => b[1] - a[1] || cmp(a[0], b[0]))[0] || []; if (o) { g.op = o; g.opHitung = true; } }
  const jlDiGi = new Map(); for (const j of jalur) for (const n of new Set([j.a, j.b])) if (n.startsWith('gi_')) { if (!jlDiGi.has(n)) jlDiGi.set(n, []); jlDiGi.get(n).push(j.id); }
  const pbDiGi = new Map(); for (const p of pbs) if (p.gi) { if (!pbDiGi.has(p.gi)) pbDiGi.set(p.gi, []); pbDiGi.get(p.gi).push(p.id); }
  for (const r of ruas) obj.rs.push({ id: r.id, nama: r.nama, kv: r.kv, sirkit: r.sirkit, km: R(r.km), sis: r.sis, prov: r.prov, jl: r.jl, gi: giIds(r), tunggal: r.tunggal, belakang: r.belakang ? { gi: r.belakang.gi, mva: r.belakang.mva, mw: r.belakang.mw, sisi: 'kecil' } : null, asal: r.asal || 'osm', op: r.op ? opId(r.op) : null,
    fakta: [F('tegangan', r.kv, 'kV', r.kv == null ? 'menunggu' : 'sumber', r.asal ? r.srcT : 'osm-power', tgl, r.kvSalah), F('panjang', R(r.km), 'km', 'hitung', 'osm-power', tgl), F('sirkit', r.sirkit, 'sirkit', r.sirkit == null ? 'menunggu' : 'sumber', r.asal ? r.srcT : 'osm-power', tgl), ...(r.belakang ? [F('sisi_belakang', 'kecil', '', 'hitung', 'osm-power', tgl)] : [])] });
  for (const g of gardu) { const sis = sisDariNode.get(g.id); obj.gi.push({ id: g.id, nama: g.nama, kv: g.kv, sis: sis?.id || null, prov: g.prov, mva: g.mva, tahun: g.tahun, jl: jlDiGi.get(g.id) || [], pb: pbDiGi.get(g.id) || [], satu_masuk: derajat.get(g.id) === 1, op: g.op ? opId(g.op) : null,
    fakta: [F('tegangan', g.kv, 'kV', g.kv == null ? 'menunggu' : 'sumber', 'osm-power', tgl, g.kvSalah), F('kapasitas_trafo', g.mva, 'MVA', g.mva == null ? 'menunggu' : 'sumber', 'osm-power', tgl), F('tahun_operasi', g.tahun, 'tahun', g.tahun == null ? 'menunggu' : 'sumber', 'osm-power', tgl), ...(g.op ? [F('operator', g.op, '', g.opHitung ? 'hitung' : 'sumber', 'osm-power', tgl)] : []), ...(ctx.atlas?.gardu?.[g.id] ? [['pvout', 'kWh/kWp/tahun', 'gsa-pvout', 0], ['angin_100m', 'm/s', 'gwa-100m', 1]].filter(([, , , i]) => ctx.atlas.gardu[g.id][i] != null).map(([k, sat, src, i]) => F(k, ctx.atlas.gardu[g.id][i], sat, 'hitung', src, ctx.atlas.meta.tanggal_ambil)) : [])] }); }
  for (const j of jalur) obj.jl.push({ id: j.id, nama: j.nama, a: j.a, b: j.b, gi: [...new Set([j.a, j.b])].filter((n) => n.startsWith('gi_')), rs: j.rs, sis: j.sis, kv: j.kv, sirkit: j.sirkit, km: R(j.km), tunggal: j.tunggal, belakang: j.belakang, fakta: [F('panjang', R(j.km), 'km', 'hitung', 'osm-power', tgl), F('sirkit', j.sirkit, 'sirkit', j.sirkit == null ? 'menunggu' : 'sumber', 'osm-power', tgl), ...(j.belakang ? [F('sisi_belakang', 'kecil', '', 'hitung', 'osm-power', tgl)] : [])] });
  // tautan ke direktori (KJ-15): nama persis (setelah normalisasi) atau org_id; cocok ragu -> meta.ragu
  const orgIdx = new Map(); for (const o of ctx.organisasi?.baris || []) for (const n of [o.nama, ...(o.nama_lain || []), o.singkatan].filter(Boolean)) { const k = norm(n); if (k && !orgIdx.has(k)) orgIdx.set(k, o.id); }
  const urlOrg = (id) => '/o/' + encodeURIComponent(id); // profil organisasi: public/o.js (/o/<id>)
  const orgTautan = (nama, org_id) => { if (org_id) return [{ jenis: 'organisasi', id: org_id, url: urlOrg(org_id) }]; const k = norm(nama); if (!k) return []; if (orgIdx.has(k)) return [{ jenis: 'organisasi', id: orgIdx.get(k), url: urlOrg(orgIdx.get(k)) }]; const mirip = [...orgIdx].find(([n]) => n.length > 5 && k.length > 5 && (n.includes(k) || k.includes(n))); if (mirip) ragu.push({ jenis: 'operator', nama, kandidat: mirip[1], alasan: 'nama sebagian cocok' }); return []; };
  for (const p of pbs) obj.pb.push({ id: p.id, nama: p.nama, jenis: p.jenis, bb: p.bb, mw: p.mw, tahun: p.tahun, pemilik: p.pemilik, captive: p.captive, gi: p.gi, jarak_gi_km: p.jarak_gi_km, sis: p.sis || null, prov: p.prov, op: p.op ? opId(p.op) : null, tautan: [...p.tautan, ...orgTautan(p.pemilik, p.org_id)],
    ...(p.catatan ? { catatan: p.catatan } : {}), fakta: [F('kapasitas', p.mw, 'MW', p.mw == null ? 'menunggu' : 'sumber', p.src, p.tglData ?? tgl), F('tahun_operasi', p.tahun, 'tahun', p.tahun == null ? 'menunggu' : 'sumber', p.src, p.tglData ?? tgl)] });
  const sisPublik = (s) => { const kode = [...new Set(s.ruas.flatMap((r) => r.prov))]; const hit = new Map(); for (const k of kode) { const x = ctx.sistem_pln.baris.find((q) => q.provinsi.some((pp) => pp.kode === k)); if (x) hit.set(x.id, (hit.get(x.id) || 0) + 1); } const [id, n] = [...hit].sort((a, b) => b[1] - a[1] || cmp(a[0], b[0]))[0] || []; if (!id) return []; if (n / kode.length < 0.6) { ragu.push({ jenis: 'sistem', id: s.id, kandidat: id, alasan: 'provinsi tersebar di beberapa sistem PLN' }); return []; } return [{ jenis: 'sistem_pln', id, url: '/sistem/' + id }]; };
  for (const s of besar) obj.sis.push({ id: s.id, nama: s.nama, km: R(s.km), gi: s.gardu.length, mw_pln: s.mw_pln, mw_captive: s.mw_captive, ...(s.captive ? { catatan_captive: 'Status captive berdasar nama pemilik/operator (pola tambang/smelter: ' + [...(s.pemilikCap || [])].sort().join(', ') + ') dan/atau MW captive > 5x MW PLN, bukan bukti bahwa listriknya tak dijual ke PLN' } : {}), kv_maks: s.kv_maks, prov: [...new Set(s.ruas.flatMap((r) => r.prov))].sort(), bbox: s.bbox, warna_kelas: kelas(s.kv_maks), nama_sumber: s.namaSumber || 'hitung', ...(s.wilayahRuptl ? { wilayah_ruptl: s.wilayahRuptl } : {}), potongan: !!s.potongan, captive: !!s.captive, tautan: sisPublik(s),
    fakta: [F('nama', s.nama, '', 'hitung', s.namaSumber && s.namaSumber !== 'hitung' ? s.namaSumber : 'osm-power', tgl), F('panjang', R(s.km), 'km', 'hitung', 'osm-power', tgl), F('gardu', s.gardu.length, 'gardu', 'hitung', 'osm-power', tgl), F('pembangkit_pln', s.mw_pln, 'MW', 'hitung', 'gem', tgl), F('pembangkit_captive', s.mw_captive, 'MW', 'hitung', 'gem', tgl)] });
  const mvaJum = (a) => { const v = a.map((g) => g.mva).filter((x) => x != null); return v.length ? R(v.reduce((s, x) => s + x, 0)) : null; };
  const cmpKey = (n) => { const q = String(n || '').toLowerCase().replace(/[^a-z0-9]/g, ''); return q === 'jakartaraya' ? 'dkijakarta' : q; }, thnStat = String(ctx.statistik.tahun);
  const t32 = new Map(TP.angka_pln.filter((x) => /^AP-t32-/.test(x.id) && x.cakupan === 'provinsi').map((x) => [cmpKey(x.wilayah), x])), terbitProv = new Map(); // Tabel 32 Statistik 2024 (kms sirkit, MVA gardu PLN per provinsi); Papua/Papua Barat sebelum pemekaran
  for (const k of provIdx.map((p) => p.kode)) { const rr = ruas.filter((r) => r.prov.includes(k)), gg = gardu.filter((g) => g.prov === k), pp = pbs.filter((p) => p.prov === k && !p.captive), km = R(rr.reduce((s, r) => s + r.km, 0)), mw = R(pp.reduce((s, p) => s + (p.mw || 0), 0)), mva0 = mvaJum(gg), a32 = t32.get(cmpKey(namaProv.get(k))), mva = a32?.nilai.total_mva ?? mva0, kmsT = a32?.nilai.total_kms ?? null, mvaT = a32?.nilai.total_mva ?? null; terbitProv.set(k, { mva: mvaT, kms: kmsT });
    obj.prov.push({ id: 'prov_' + k, kode: k, nama: namaProv.get(k) || k, pulau: pulauProv(k), sis: [...new Set([...rr.map((r) => r.sis), ...gg.map((g) => sisDariNode.get(g.id)?.id), ...pp.map((p) => p.sis)].filter(Boolean))].sort(), gi: gg.length, rs: rr.length, pb: pp.length, km, mw, mva, tautan: [{ jenis: 'wilayah', id: k, url: '/wilayah?prov=' + k }], fakta: [F('ruas', rr.length, 'ruas', 'hitung', 'osm-power', tgl), F('panjang', km, 'km', 'hitung', 'osm-power', tgl), F('gardu', gg.length, 'gardu', 'hitung', 'osm-power', tgl), F('pembangkit_pln', mw, 'MW', 'hitung', 'gem', tgl), F('kapasitas_trafo', mva0, 'MVA', mva0 == null ? 'menunggu' : 'sumber', 'osm-power', tgl), F('mva_terbit', mvaT, 'MVA', mvaT == null ? 'menunggu' : 'sumber', 'esdm-statistik-2024', thnStat), F('kms_terbit', kmsT, 'kms', kmsT == null ? 'menunggu' : 'sumber', 'esdm-statistik-2024', thnStat)] }); }
  const ops = new Map(); const op0 = (n, org_id, asli) => { const id = opId(n); const o = ops.get(id) || { id, nama: n, rs: 0, km: 0, gi: 0, pb: 0, mw: 0, mvaL: [], sis: new Set(), org_id: null, alias: new Set() }; if (org_id) o.org_id = org_id; if (asli && asli !== n) o.alias.add(asli); ops.set(id, o); return o; };
  for (const r of ruas) if (r.op) { const o = op0(r.op, null, r.opAsli); o.rs++; o.km += r.km; if (r.sis) o.sis.add(r.sis); }
  for (const g of gardu) if (g.op) { const o = op0(g.op, null, g.opAsli); o.gi++; o.mvaL.push(g); const s = sisDariNode.get(g.id); if (s) o.sis.add(s.id); }
  for (const p of pbs) if (p.op) { const o = op0(p.op, p.org_id, p.pemilik); o.pb++; if (!p.captive) o.mw += p.mw || 0; if (p.sis) o.sis.add(p.sis); }
  for (const o of [...ops.values()].sort((a, b) => cmp(a.id, b.id))) { const mva = mvaJum(o.mvaL); obj.op.push({ id: o.id, nama: o.nama, alias: [...o.alias].sort(), sis: [...o.sis].sort(), rs: o.rs, gi: o.gi, pb: o.pb, km: R(o.km), mw: R(o.mw), mva, tautan: orgTautan(o.nama, o.org_id), fakta: [F('ruas', o.rs, 'ruas', 'hitung', 'osm-power', tgl), F('panjang', R(o.km), 'km', 'hitung', 'osm-power', tgl), F('gardu', o.gi, 'gardu', 'hitung', 'osm-power', tgl), F('pembangkit', R(o.mw), 'MW', 'hitung', 'gem', tgl), F('kapasitas_trafo', mva, 'MVA', mva == null ? 'menunggu' : 'sumber', 'osm-power', tgl)] }); }
  for (const k of ['op', 'sis', 'prov', 'pb', 'gi', 'jl', 'rs']) obj[k].sort((a, b) => cmp(a.id, b.id));

  // ------ energi.json (KJ-11)
  const susut = ctx.sistem_pln.susut_nasional.find((s) => s.tahun === ctx.statistik.tahun)?.jumlah ?? ctx.sistem_pln.susut_nasional.at(-1).jumlah;
  const thn = ctx.statistik.tahun, stat = ctx.statistik, ptgl = String(thn); // tgl = tanggal DATA (tahun statistik); tanggal ambil terpisah di meta
  const SR = ctx.statResmi, prov2 = !!SR, PEMEKARAN = { 93: '91', 94: '91', 95: '91', 96: '92' }; // pemekaran Papua belum ada di BPS 859: digabung ke induk lama (Papua Selatan/Tengah/Pegunungan -> Papua, Papua Barat Daya -> Papua Barat)
  // unit neraca: pemekaran Papua ke induk; wilayah PLN multi-provinsi yang faktor kapasitas implisit (produksi / (MW inventori non-captive x 8,76)) salah satu unitnya > 1 digabung utuh seperti sumbernya
  const mwInv = new Map(); for (const p of pbs) if (!p.captive && p.prov) mwInv.set(p.prov, (mwInv.get(p.prov) || 0) + (p.mw || 0));
  const basis = (b) => (prov2 ? PEMEKARAN[b.kode] ?? b.kode : b.wilayah_pln[0]), gabungMap = new Map(), unitGabung = [], cfTinggi = [];
  if (prov2) {
    const prodU = new Map(), mwU = new Map(), wilU = new Map();
    for (const b of stat.baris) { const u = basis(b); prodU.set(u, (prodU.get(u) || 0) + b.produksi_pln_gwh.total); mwU.set(u, (mwU.get(u) || 0) + (mwInv.get(b.kode) || 0)); wilU.set(u, b.wilayah_pln[0]); }
    const cfU = (u) => (mwU.get(u) > 0 ? prodU.get(u) / (mwU.get(u) * 8.76) : null), grup = new Map();
    for (const [u, w] of [...wilU].sort((a, b) => cmp(a[0], b[0]))) { if (!grup.has(w)) grup.set(w, []); grup.get(w).push(u); }
    for (const [w, us] of [...grup].sort((a, b) => cmp(a[0], b[0]))) {
      const tinggi = us.filter((u) => cfU(u) > 1);
      if (us.length > 1 && tinggi.length) { const id = us[0]; us.forEach((u) => gabungMap.set(u, id)); unitGabung.push({ id, nama: (stat.wilayah_pln.find((x) => x.id === w)?.nama || w).replace(/\s*\(wilayah PLN\)/, ''), unit_awal: us, faktor_kapasitas_awal: Object.fromEntries(us.map((u) => [u, cfU(u) == null ? null : R(cfU(u), 2)])), alasan: 'Faktor kapasitas implisit > 1 pada ' + tinggi.join(',') + ' (produksi PLN dicatat per wilayah PLN gabungan, bukan per provinsi); unit digabung seperti sumbernya' }); }
      else for (const u of tinggi) cfTinggi.push({ id: u, faktor_kapasitas: R(cfU(u), 2), ket: 'Wilayah PLN satu provinsi; inventori pembangkit OSM/GEM tak lengkap, tak bisa digabung' });
    }
  }
  const unitKode = (b) => gabungMap.get(basis(b)) ?? basis(b), tingkatNer = prov2 ? 'provinsi' : 'wilayah', gNama = new Map(unitGabung.map((g) => [g.id, g.nama]));
  const bpsRows = prov2 ? SR.penjualan_provinsi.filter((r) => r.tahun === thn && r.prov_kode && /^BPS/.test(r.src)) : [];
  const wil = new Map(); if (prov2) { for (const r of bpsRows) { const id = gabungMap.get(PEMEKARAN[r.prov_kode] ?? r.prov_kode) ?? PEMEKARAN[r.prov_kode] ?? r.prov_kode, o = wil.get(id) || { id, nama: gNama.get(id) || namaProv.get(id) || id, penjualan_gwh: 0 }; o.penjualan_gwh += r.gwh; wil.set(id, o); } } else for (const w of stat.wilayah_pln) wil.set(w.id, { ...w });
  const bt = wil.get('batam'), rk = wil.get('riau-kepri');
  if (bt && rk) { rk.penjualan_gwh += bt.penjualan_gwh; wil.delete('batam'); }
  const wilOf = new Map(stat.baris.map((b) => [b.kode, unitKode(b)]));
  const prodWil = new Map(), provWil = new Map(); for (const b of stat.baris) { const w = unitKode(b); prodWil.set(w, (prodWil.get(w) || 0) + b.produksi_pln_gwh.total); if (!provWil.has(w)) provWil.set(w, []); provWil.get(w).push(b.kode); }
  const nerWil = [...wil.values()].map((w) => ({ id: w.id, ...(prov2 ? { kode: w.id } : {}), nama: prov2 && !gNama.has(w.id) && (provWil.get(w.id) || []).length > 1 ? w.nama + ' (dengan provinsi pemekaran)' : w.nama, provinsi: (provWil.get(w.id) || []).sort(), ...neraca(prodWil.get(w.id) || 0, w.penjualan_gwh, susut), tingkat: tingkatNer, st: 'hitung', ket: prov2 ? 'Penjualan BPS 2024 per provinsi; kebutuhan = penjualan/(1 - susut nasional seragam). Selisih memuat susut beda dari rata-rata, pemakaian sendiri, dan listrik non-PLN; bukan aliran terukur.' : 'Selisih memuat susut jaringan dan pemakaian sendiri; bukan aliran terukur.', ...(prov2 ? { src_penjualan: 'BPS-859-2024' } : {}), src: 'esdm-statistik-2024', tgl: ptgl })).sort((a, b) => cmp(a.id, b.id));
  const produksiProv = stat.baris.map((b) => ({ kode: b.kode, nama: b.provinsi, produksi_gwh: R(b.produksi_pln_gwh.total), wilayah_pln: b.wilayah_pln[0], ...(prov2 ? { unit_neraca: unitKode(b) } : { tidak_dihitung: true, alasan: 'Penjualan listrik hanya terbit per wilayah PLN (Statistik 2024); neraca dan aliran dihitung di tingkat wilayah, bukan provinsi' }), st: 'hitung', src: 'esdm-statistik-2024', tgl: ptgl })).sort((a, b) => cmp(a.kode, b.kode));
  const nasional = bauran(stat.baris.reduce((m, b) => { for (const [k, v] of Object.entries(b.produksi_pln_gwh)) if (k !== 'total') m[k] = (m[k] || 0) + v; return m; }, {}));
  // bauran provinsi
  const sisPln = ctx.sistem_pln.baris, publik = (kode) => sisPln.find((s) => s.provinsi.some((p) => p.kode === kode));
  const bauranProv = stat.baris.map((b) => { const bo = bauran(b.produksi_pln_gwh), pub = publik(b.kode); return { kode: b.kode, nama: b.provinsi, ...bo, pembanding: pub && pub.bauran_ebt_persen != null ? { ebt_persen_terbit: pub.bauran_ebt_persen, sistem_terbit: pub.singkat, ket: 'Pangsa EBT sistem ' + pub.singkat + ' (Statistik 2024, dijumlah per sistem); bukan angka provinsi', src: 'esdm-statistik-2024' } : null, st: 'hitung', src: 'esdm-statistik-2024', tgl: ptgl }; }).sort((a, b) => cmp(a.kode, b.kode));
  // bauran sistem: hanya bila tiap provinsi anggota >= 90% MW PLN-nya ada di sistem ini; GWh provinsi utuh, tak pernah terhitung dua kali
  const mwProv = new Map(), mwDi = new Map();
  for (const p of pbs) if (!p.captive && p.prov) { mwProv.set(p.prov, (mwProv.get(p.prov) || 0) + (p.mw || 0)); if (p.sis) { const m = mwDi.get(p.prov) || new Map(); m.set(p.sis, (m.get(p.sis) || 0) + (p.mw || 0)); mwDi.set(p.prov, m); } }
  const baruProd = new Map(stat.baris.map((b) => [b.kode, b])), WIL_RUPTL = (k) => (/^3[1-6]$/.test(k) || k === '51' ? 'Jawa-Madura-Bali' : /^[12]/.test(k) ? 'Sumatera' : /^6/.test(k) ? 'Kalimantan' : /^7/.test(k) ? 'Sulawesi' : 'Maluku, Papua, Nusa Tenggara');
  const gProv = new Map(), gSis = new Map();
  for (const g of gardu) if (g.prov) { gProv.set(g.prov, (gProv.get(g.prov) || 0) + 1); const sd = sisDariNode.get(g.id); if (sd) { const m = gSis.get(g.prov) || new Map(); m.set(sd.id, (m.get(sd.id) || 0) + 1); gSis.set(g.prov, m); } }
  for (const so of obj.sis) { // MVA/kms terbit sistem = jumlah provinsi yang > 50% gardu OSM-nya ada di sistem ini (provinsi terbelah tak dihitung agar tak ganda)
    const pk = so.prov.filter((k) => (gSis.get(k)?.get(so.id) || 0) / (gProv.get(k) || 1) > 0.5 && terbitProv.get(k)?.mva != null), v = (f) => pk.length ? R(pk.reduce((t, k) => t + terbitProv.get(k)[f], 0), 2) : null;
    so.mva = v('mva'); so.kms_terbit = v('kms'); so.prov_terbit = pk;
    so.fakta.push(F('mva_terbit', so.mva, 'MVA', so.mva == null ? 'menunggu' : 'hitung', 'esdm-statistik-2024', thnStat), F('kms_terbit', so.kms_terbit, 'kms', so.kms_terbit == null ? 'menunggu' : 'hitung', 'esdm-statistik-2024', thnStat));
  }
  const provKeSis = new Map();
  for (const b of stat.baris) {
    const k = b.kode, m = mwDi.get(k), tot = mwProv.get(k) || 0; let pil = null;
    if (m && tot > 0) { const [sid, mw] = [...m].sort((a, b2) => b2[1] - a[1] || cmp(a[0], b2[0]))[0]; if (mw / tot > 0.5) pil = { sis: sid, f: mw / tot, dasar: 'mw' }; }
    if (!pil && gSis.get(k)) { const [sid, n] = [...gSis.get(k)].sort((a, b2) => b2[1] - a[1] || cmp(a[0], b2[0]))[0]; if (n / gProv.get(k) > 0.5) pil = { sis: sid, f: n / gProv.get(k), dasar: 'gardu' }; }
    if (pil) provKeSis.set(k, pil);
  }
  const bauranSis = besar.map((s) => {
    const dasar = { id: s.id, nama: s.nama, st: 'hitung', src: 'esdm-statistik-2024', tgl: ptgl };
    const tak = (alasan) => ({ ...dasar, ...bauran(null), tidak_dihitung: true, alasan });
    if (s.captive) return tak('Jaringan captive (pembangkit swasta jauh melebihi PLN): bukan sistem PLN, tanpa bauran PLN');
    if (s.potongan) return tak('Potongan jaringan (< 5 gardu atau tanpa pembangkit PLN tertempel): produksi tak dapat dipetakan');
    const anggota = [...provKeSis].filter(([, v]) => v.sis === s.id).map(([k, v]) => [k, v.f, v.dasar]).sort((a, b) => cmp(a[0], b[0])); // provinsi ditetapkan: > 50% MW PLN tertempel; bila tanpa mayoritas MW, > 50% gardu provinsi itu
    if (!anggota.length || !(s.mw_pln > 0)) return tak('Tak ada provinsi yang mayoritas (> 50%) MW PLN-nya tertempel ke sistem ini, atau tak ada MW PLN');
    const prod = {}; for (const [k] of anggota) for (const [t, v] of Object.entries(baruProd.get(k).produksi_pln_gwh)) if (t !== 'total') prod[t] = (prod[t] || 0) + v;
    const bo = bauran(prod), cap = anggota.reduce((t, [k]) => t + (baruProd.get(k).kapasitas_terpasang_mw.total || 0), 0), fk = cap ? bo.total / (cap * 8.76) : Infinity;
    if (!(fk <= 1)) return tak(`Faktor kapasitas ${R(fk, 2)} > 1 (produksi ${bo.total} GWh vs kapasitas terpasang provinsi anggota ${cap} MW): alokasi tak masuk akal`);
    const wr = WIL_RUPTL(terbesarProv(s)), pembanding_ruptl = TP.pembanding_emisi.filter((e) => e.wilayah === wr && e.faktor_t_co2_mwh).map((e) => ({ id: e.id, skenario: e.skenario, faktor_t_co2_mwh: e.faktor_t_co2_mwh, src: e.src, ket: 'Proyeksi RUPTL 2025-2034 per wilayah RUPTL (' + wr + '); bukan realisasi 2024' }));
    return { ...dasar, ...bo, provinsi: anggota.map(([k]) => k), dasar_penetapan: Object.fromEntries(anggota.map(([k, f, d]) => [k, d + ' ' + Math.round(f * 100) + '%'])), mw_pln: s.mw_pln, kapasitas_statistik_mw: R(cap), faktor_kapasitas: R(fk, 2), pembanding_ruptl };
  }).sort((a, b) => cmp(a.id, b.id));
  const dipakaiProv = new Set(bauranSis.flatMap((b) => (b.tidak_dihitung ? [] : b.provinsi))), provTak = stat.baris.filter((b) => !dipakaiProv.has(b.kode)).map((b) => ({ kode: b.kode, nama: b.provinsi, gwh: R(b.produksi_pln_gwh.total) }));
  const resmi = SR ? statResmi(SR, { sistem: besar.filter((s) => !s.captive && !s.potongan).map((s) => ({ id: s.id, nama: s.nama })), namaProv, kodeProv, ruptl: TP.angka_pln.filter((x) => x.jenis === 'beban-puncak') }) : null;
  if (resmi) for (const b of bauranSis) { const q = resmi.pembandingSistem.get(b.id); if (q) b.pembanding_esdm = q; }
  // pelengkap kartu (kembaran_pelengkap.mjs): BPP, RUPTL, penduduk/kapita, elektrifikasi, potensi surya/angin
  let kartuSisOut = null, kartuProvOut = null, pelengkapMeta = null, agregatRj = null;
  if (resmi) {
    const ksM = new Map(resmi.kartuSistem.map((o) => [o.id, { ...o }])), kpM = new Map(resmi.kartuProvinsi.map((o) => [o.kode, { ...o }]));
    const anggota = new Map(); for (const [k, v] of provKeSis) { if (!anggota.has(v.sis)) anggota.set(v.sis, []); anggota.get(v.sis).push(k); }
    const utama = besar.filter((s) => !s.captive && !s.potongan), bpp = bppSistem(ctx.biaya, utama.map((s) => ({ id: s.id, nama: s.nama, prov: (anggota.get(s.id) || []).sort() })));
    const rp = ruptlProvinsi(ctx.ruptl, kodeProv), pk = pendudukKapita(ctx.pelengkap, bpsRows, thn), el = elektrifikasi(ctx.akses, ctx.desa), pot = potensiProvinsi(ctx.atlas), rj = ruptlJaringan(ctx.ruptl_jaringan);
    for (const s of utama) { const o = ksM.get(s.id) || { id: s.id }, rs = ruptlSistem(rp.kartu, anggota.get(s.id) || []); if (bpp.has(s.id)) o.bpp = bpp.get(s.id); if (rs) o.ruptl_ebt = rs; const rjs = ruptlJaringanSistem(rj.kartu, anggota.get(s.id) || []); if (rjs) o.ruptl_jaringan = rjs; const bag = []; for (const [k, m] of gSis) { const n = m.get(s.id) || 0; if (n && !(anggota.get(s.id) || []).includes(k) && n / gProv.get(k) >= 0.2) bag.push({ kode: k, nama: namaProv.get(k) || k, gardu: n, dari: gProv.get(k) }); } if (bag.length) o.provinsi_bagian = { daftar: bag.sort((a, b) => cmp(a.kode, b.kode)), st: 'hitung', src: 'osm-power', tgl, catatan: 'Provinsi yang jaringannya terbagi ke beberapa sistem: angka RUPTL provinsi (kartu provinsi) tidak dibagi dan tidak dihitung ke sistem ini' }; if (Object.keys(o).length > 1) ksM.set(s.id, o); }
    for (const k of new Set([...namaProv.keys(), ...kpM.keys()])) {
      const o = kpM.get(k) || { kode: k, nama: namaProv.get(k) || k }, ph = pk.get(k);
      if (rp.kartu.has(k)) o.ruptl_ebt = rp.kartu.get(k); if (rj.kartu.has(k)) o.ruptl_jaringan = rj.kartu.get(k); if (ph?.penduduk) o.penduduk = ph.penduduk; if (ph?.kwh_per_kapita) { o.penjualan_per_kapita_kwh = ph.kwh_per_kapita; o.kwh_per_kapita = { tahun: ph.kwh_per_kapita.tahun, kwh: ph.kwh_per_kapita.kwh, usang: 'alias lama; pakai penjualan_per_kapita_kwh' }; } if (el.has(k)) o.elektrifikasi = el.get(k); if (pot.has(k)) o.potensi_ebt = pot.get(k);
      if (Object.keys(o).length > 2) kpM.set(k, o);
    }
    kartuSisOut = [...ksM.values()].sort((a, b) => cmp(a.id, b.id)); kartuProvOut = [...kpM.values()].sort((a, b) => cmp(a.kode, b.kode));
    { const diSis = new Set(utama.flatMap((x) => anggota.get(x.id) || [])), jp = (o, f) => o.reduce((t, x) => t + (x.ruptl_jaringan?.[f] ?? 0), 0), pr = kartuProvOut.filter((x) => x.ruptl_jaringan), ss = kartuSisOut.filter((x) => x.ruptl_jaringan), tak = pr.filter((x) => !diSis.has(x.kode));
      agregatRj = { total_kms_provinsi: R(jp(pr, 'total_kms'), 1), total_mva_provinsi: R(jp(pr, 'total_mva'), 1), total_kms_kartu_sistem: R(jp(ss, 'total_kms'), 1), total_mva_kartu_sistem: R(jp(ss, 'total_mva'), 1), provinsi_tanpa_sistem: tak.map((x) => ({ kode: x.kode, nama: x.nama, kms: x.ruptl_jaringan.total_kms, mva: x.ruptl_jaringan.total_mva })), st: 'hitung', src: 'RUPTL-2025', tgl: '2025', catatan: 'Selisih = provinsi yang tak mayoritas di sistem kembaran mana pun (kartu provinsi tetap memuatnya) dan provinsi terbagi; jumlah provinsi dari sumber, bukan angka nasional terbit.' };
      agregatRj.selisih_kms = R(agregatRj.total_kms_provinsi - agregatRj.total_kms_kartu_sistem, 1); agregatRj.selisih_mva = R(agregatRj.total_mva_provinsi - agregatRj.total_mva_kartu_sistem, 1); }
    pelengkapMeta = { ruptl_jaringan_provinsi: rj.kartu.size, ruptl_jaringan_gabungan_tak_dipecah: rj.gabungan, ruptl_tanpa_provinsi: rp.tanpaProvinsi, ruptl_provinsi_tak_terpetakan: rp.takTerpetakan, bpp_sistem_tercocok: [...bpp.keys()].sort(), penduduk_provinsi: ctx.pelengkap?.penduduk?.length ?? 0, atlas_gardu: ctx.atlas ? Object.keys(ctx.atlas.gardu).length : 0 };
  }
  const gwhTeralokasi = bauranSis.reduce((t, b) => t + (b.tidak_dihitung ? 0 : b.total), 0);
  // batas & aliran: tingkat WILAYAH PLN (penjualan hanya terbit per wilayah). Ruas kabel/laut dan sambungan terbitan ikut lewat urutan provinsi tiap ruas.
  const wilKode = (k) => wilOf.get(k);
  const bobotKv = (o) => Object.entries(o.sirkit).reduce((s, [kv, n]) => s + n * (+kv || 66), 0);
  const agg = new Map(); for (const o of [...batasRaw.values()].sort((a, b) => cmp(a.a + a.b + a.sis, b.a + b.b + b.sis))) { const wa = wilKode(o.a), wb = wilKode(o.b); if (!wa || !wb || wa === wb) continue; const [a, b] = [wa, wb].sort(); const k = a + '|' + b; const x = agg.get(k) || { a, b, sis: [], sirkit: {}, bobot: 0, ruas: 0 }; x.sis.push(o.sis); for (const [kv, n] of Object.entries(o.sirkit)) x.sirkit[kv] = (x.sirkit[kv] || 0) + n; x.bobot += bobotKv(o); x.ruas += o.ruas; agg.set(k, x); }
  const nerOk = new Map(nerWil.map((n) => [n.id, n]));
  const batasOk = [...agg.values()].filter((e) => nerOk.has(e.a) && nerOk.has(e.b));
  const ALIAS_WIL = { 'jawa tengah dan diy': prov2 ? '33' : 'jateng-diy', ...(prov2 ? { 'jawa tengah 500 kv': '33', 'jawa timur 500 kv': '35' } : {}) }, namaKeWil = (n) => ALIAS_WIL[norm(n)] ?? wilKode(kodeProv.get(norm(n)));
  // pembatas aliran HANYA kemampuan/rating terbit (transfer, stabilitas). Pasokan, rencana, dan puncak hanya pembanding.
  const capT = new Map();
  const puncakT = new Map(); // hanya pembanding: rata-rata tahunan seharusnya <= puncak; bila melebihi ditandai, tidak dikunci
  for (const k of T.kiriman_terbit || []) { if (!/puncak/.test(k.jenis || '') || k.nilai_mw == null || /500 kV/.test(k.dari + k.ke)) continue; const wa = namaKeWil(k.dari), wb = namaKeWil(k.ke); if (!wa || !wb || wa === wb) continue; const kk = [wa, wb].sort().join('|'), m = Math.abs(k.nilai_mw); if (!puncakT.has(kk) || m < puncakT.get(kk).mw) puncakT.set(kk, { mw: m, id: k.id, src: k.src ?? 'terbitan' }); }
  const infoT = new Map(); // semua batas berlaku per pasangan (termasuk kapasitas-pasokan) untuk ditampilkan; hanya transfer/stabilitas yang memotong aliran
  for (const c of T.batas_terbit || []) { if (c.status !== 'berlaku' || !['kapasitas-transfer', 'batas-stabilitas', 'kapasitas-pasokan'].includes(c.jenis_batas)) continue; const sj = sambunganDicatat.find((x) => x.id === c.sambungan_id) ?? (() => { const sb = (T.sambungan_diketahui || []).find((x) => x.id === c.sambungan_id && (!x.status || x.status === 'beroperasi')); return sb ? { prov: [sisiKode(sb.ujung_a), sisiKode(sb.ujung_b)] } : null; })(); /* sambungan yang ujung gardunya tak tertulis: wilayah dari nama provinsi ujung */ if (!sj || c.batas_mw == null) continue; const wa = wilKode(sj.prov[0]), wb = wilKode(sj.prov[1]); if (!wa || !wb || wa === wb) continue; const k = [wa, wb].sort().join('|'), o = capT.get(k), m = c.batas_mw; if (!infoT.has(k)) infoT.set(k, []); infoT.get(k).push({ id: c.id, jenis_batas: c.jenis_batas, batas_mw: m, nama: c.nama ?? null, src: c.src ?? 'terbitan', memotong: c.jenis_batas !== 'kapasitas-pasokan' }); if (c.jenis_batas === 'kapasitas-pasokan') continue; if (!o || m < o.mw) capT.set(k, { mw: m, jenis: c.jenis_batas, src: new Set([c.src ?? 'terbitan']) }); else if (m === o.mw) o.src.add(c.src ?? 'terbitan'); }
  const simp = [...new Set(batasOk.flatMap((e) => [e.a, e.b]))].map((k) => ({ id: k, neraca_gwh: nerOk.get(k).neraca_gwh, kebutuhan_gwh: nerOk.get(k).kebutuhan_gwh }));
  const peringatan = [], bebasAlir = alirkan(simp, batasOk), alir = alirkan(simp, batasOk.map((e) => ({ ...e, maks_mw: capT.get(e.a + '|' + e.b)?.mw })));
  const bawahList = [], lab = (k) => (prov2 ? namaProv.get(k) || k : k);
  const batas = batasOk.map((e, i) => { const f = alir[i], cp = capT.get(e.a + '|' + e.b), pk = puncakT.get(e.a + '|' + e.b), dr = f.mw >= 0 ? [e.a, e.b] : [e.b, e.a], lebih = pk && Math.abs(f.mw) > pk.mw, bawah = pk && !lebih && Math.abs(f.mw) < 0.8 * pk.mw; if (bawah) bawahList.push(`Aliran rata-rata tahunan ${lab(e.a)}-${lab(e.b)} ${Math.abs(f.mw)} MW di bawah 80 persen kiriman puncak terbitan ${pk.mw} MW (${pk.id}); model mungkin menaksir terlalu rendah`); if (lebih) peringatan.push(`Aliran rata-rata tahunan ${lab(e.a)}-${lab(e.b)} ${Math.abs(f.mw)} MW melebihi kiriman puncak terbitan ${pk.mw} MW (${pk.id}); rata-rata seharusnya di bawah puncak, tanda model kasar`); return { ...(cp ? { batas_mw: cp.mw, jenis_batas: cp.jenis, batas_src: [...cp.src].sort().join(',') } : {}), ...(infoT.has(e.a + '|' + e.b) ? { batas_info: infoT.get(e.a + '|' + e.b).sort((x, y) => cmp(x.id, y.id)).map((x) => ({ ...x, ...(x.memotong ? {} : { ket: 'Komposisi pasokan saat puncak, bukan rating penghantar; tidak memotong aliran' }) })) } : {}),  ...(f.dibatasi ? { dibatasi: true, mw_dihitung: Math.abs(bebasAlir[i].mw) } : {}), ...(bawah ? { jauh_di_bawah_terbit: true, puncak_mw: pk.mw, puncak_src: pk.src, alasan: 'Rata-rata tahunan model di bawah 80 persen kiriman puncak terbitan; model mungkin terlalu rendah (rata-rata memang di bawah puncak, tetapi selisih besar patut dicurigai)' } : {}), ...(lebih ? { melebihi_puncak: true, puncak_mw: pk.mw, puncak_src: pk.src, alasan: 'Rata-rata tahunan melebihi kiriman puncak terbitan; tanda model kasar' } : {}), a: e.a, b: e.b, tingkat: tingkatNer, sis: [...new Set(e.sis)].sort(), sirkit_per_kv: Object.fromEntries(Object.entries(e.sirkit).sort((x, y) => y[0] - x[0])), ruas: e.ruas, dari: dr[0], ke: dr[1], mw: Math.abs(f.mw), gwh: Math.abs(f.gwh), st: 'hitung', src: 'osm-power', tgl }; }).sort((x, y) => cmp(x.a + x.b, y.a + y.b));
  const sisAliran = new Set(besar.filter((s) => !s.potongan && !s.captive).map((s) => s.id));
  const aliranSis = besar.filter((s) => sisAliran.has(s.id)).map((s) => { const bb = batas.filter((e) => e.sis.includes(s.id)).sort((x, y) => y.mw - x.mw || cmp(x.a + x.b, y.a + y.b))[0]; return bb ? { sis: s.id, nama: s.nama, a: bb.dari, b: bb.ke, mw: bb.mw, tingkat: tingkatNer, st: 'hitung', src: 'osm-power', tgl } : null; }).filter(Boolean).sort((a, b) => cmp(a.sis, b.sis));
  // segmen per wilayah: lokal, keluar, masuk, tak tertutup
  for (const n of nerWil) {
    const keluar = batas.filter((e) => e.dari === n.id).reduce((t, e) => t + e.gwh, 0), masuk = batas.filter((e) => e.ke === n.id).reduce((t, e) => t + e.gwh, 0), lokal = Math.min(n.produksi_gwh, n.kebutuhan_gwh);
    n.segmen = Object.fromEntries(Object.entries({ lokal, keluar, masuk, tak_tertutup: Math.max(0, n.kebutuhan_gwh - lokal - masuk) }).map(([k, v]) => [k, { gwh: R(v), mw: R(v / 8.76) }]));
  }
  const tanda = (e, a) => (e.dari === a ? 1 : -1) * e.mw;
  const CATATAN_RATA = 'Rata-rata tahunan seharusnya lebih rendah dari puncak; selisih besar menandakan model kasar.';
  const bandingKiriman = (T.kiriman_terbit || []).map((k) => {
    const ka = namaKeWil(k.dari), kb = namaKeWil(k.ke), dasar = { id: k.id, dari: k.dari, ke: k.ke, terbit_mw: k.nilai_mw ?? null, jenis: k.jenis, tanggal_terbit: k.tanggal ?? null, src: k.src ?? 'terbitan', tgl: k.tanggal ?? tgl, catatan: CATATAN_RATA };
    const e = ka && kb && ka !== kb && batas.find((x) => x.a + '|' + x.b === [ka, kb].sort().join('|'));
    if (!e || k.nilai_mw == null) return { ...dasar, kami: null, sebanding: 'tidak', alasan: [k.alasan_sebanding, e ? null : 'Pasangan wilayah tidak dipetakan ke satu batas wilayah PLN di graf kami'].filter(Boolean).join(' '), st: 'hitung' };
    const kami = tanda(e, ka), selisih = R(kami - k.nilai_mw), persen = k.nilai_mw ? R((selisih / Math.abs(k.nilai_mw)) * 100) : null;
    const sebanding = k.sebanding_dengan_aliran_tahunan === 'tidak' ? 'tidak' : kami * k.nilai_mw < 0 ? 'berlawanan' : 'langsung';
    return { ...dasar, kami: { mw: R(kami), dari: e.dari, ke: e.ke }, selisih_mw: selisih, selisih_persen: persen, sebanding, alasan: k.alasan_sebanding ?? null, ...(e.dibatasi ? { tanpa_batas: { mw: e.mw_dihitung } } : {}), ...(k.jenis === 'aliran-terukur-beban-puncak' && kami * k.nilai_mw > 0 && Math.abs(kami) < 0.8 * Math.abs(k.nilai_mw) ? { jauh_di_bawah_terbit: true, alasan: [k.alasan_sebanding, 'Model kami di bawah 80 persen angka terbit searah (' + R(kami) + ' vs ' + k.nilai_mw + ' MW); rata-rata memang di bawah puncak, tetapi selisih besar patut dicurigai.'].filter(Boolean).join(' ') } : {}), ...(kami * k.nilai_mw < 0 ? { arah_berlawanan: true } : {}), ...(/500 kV/.test(k.dari + k.ke) ? { catatan_tegangan: 'Angka terbit hanya jalur 500 kV; model menjumlah semua tegangan pada batas provinsi itu: tidak sebanding' } : {}), ...(e.melebihi_puncak ? { melebihi_puncak: true, alasan: [k.alasan_sebanding, 'Rata-rata tahunan kami melebihi kiriman puncak terbitan (tanda model kasar).'].filter(Boolean).join(' ') } : {}), st: 'hitung' };
  });
  const kebNas = nerWil.reduce((t, n) => t + n.kebutuhan_gwh, 0), prodNas = nerWil.reduce((t, n) => t + n.produksi_gwh, 0);
  const energi = { meta: { peringatan, provinsi_tak_teralokasi: provTak, tahun_data: thn, tanggal: tgl, tgl_ambil: stat.tanggal_ambil ?? null, tingkat_aliran: tingkatNer, jauh_di_bawah_terbit: bawahList, ...(prov2 ? { unit_gabungan: unitGabung, faktor_kapasitas_tinggi_tak_digabung: cfTinggi } : {}), ...(prov2 ? { penjualan_bps_total_gwh: SR.penjualan_provinsi.find((r) => r.tahun === thn && !r.prov_kode && /^BPS/.test(r.src))?.gwh ?? null, penjualan_bps_jumlah_provinsi_gwh: R(bpsRows.reduce((t, r) => t + r.gwh, 0)) } : {}), susut_nasional_persen: susut, neraca_nasional: { produksi_gwh: R(prodNas), kebutuhan_gwh: R(kebNas), selisih_gwh: R(prodNas - kebNas), selisih_persen: R(((prodNas - kebNas) / kebNas) * 100), ket: 'Produksi PLN dikurangi penjualan/(1 - susut seragam); selisih memuat pemakaian sendiri, susut beda dari rata-rata, dan listrik non-PLN' }, gwh_tak_teralokasi: { gwh: R(nasional.total - gwhTeralokasi), dari: nasional.total, ket: 'Produksi nasional yang tidak masuk bauran sistem mana pun (provinsi terbelah, sistem tidak dihitung)' }, ket: 'Aliran = aproksimasi DC kasar dari neraca tahunan ' + (prov2 ? 'PROVINSI (penjualan BPS 859 tahun ' + thn + '; pemekaran Papua digabung ke induk lama)' : 'WILAYAH PLN (penjualan hanya terbit per wilayah PLN, sehingga neraca dan aliran tidak dibagi ke provinsi)') + ' dan topologi OSM; bukan aliran terukur. Susut nasional dipakai seragam. Produksi hanya PLN (termasuk beli IPP), tanpa captive. ' + CATATAN_RATA, sumber: SUMBER, celah: [SR ? 'Faktor emisi resmi ESDM (Gatrik) hanya terbit 2011-2019 dan hanya provinsi yang tercetak sebaris dengan angka; tak ada edisi resmi 2020-2024. Pembanding RUPTL 2025 adalah proyeksi per wilayah RUPTL, bukan realisasi 2024.' : 'Faktor emisi ESDM FE 2019 tidak terbuka; pembanding emisi hanya RUPTL 2025 (proyeksi per wilayah RUPTL, bukan realisasi 2024).', 'Efisiensi pembangkit fosil adalah nilai tipikal (st est), bukan data operator; daur hidup AR5 tidak memuat PLTG/PLTMG/PLTD/biogas/sampah (null, intensitas daur hidup hanya bila >= 80% GWh tercakup).', SR ? 'Tren per sistem hanya 2024: produksi per provinsi 2021-2023 (Statistik PLN Tabel 23) hanya memuat produksi sendiri PLN tanpa sewa genset dan pembelian IPP, dan hanya 24-26 provinsi yang terpisah per provinsi (sisanya unit multi-provinsi); membandingkannya dengan 2024 (termasuk IPP) menyesatkan. Tren bauran 2017-2023 hanya nasional (persen energi primer PLN, ESDM) di tren_pln_nasional; Ember (tren_nasional) tetap tren seluruh pembangkitan.' : 'Tren: hanya tahun 2024 yang punya produksi per provinsi di repo (HEESI 2025 hanya nasional); tahun lain tidak diisi.',
      ...(SR ? ['Statistik PLN 2024 tak terjangkau (snapshot terpotong); kartu MVA, beban puncak, keandalan, penjualan PLN berhenti di 2023; penjualan 2024 dari BPS 859.', ...SR.meta.celah.filter((c) => /^(BPS var|Statistik PLN: baris|Beban puncak:|SAIDI|ESDM 2023)/.test(c))] : []), 'Produksi PLN per provinsi memuat pembelian IPP tetapi bukan captive; bauran memakai PLTU sebagai batu bara.', 'Pemisahan provinsi oleh sistem OSM (mis. Bangka masuk Sumatera lewat SJ-01) memengaruhi sistem yang dihitung: provinsi terbelah tidak dialokasikan.'] },
    faktor: FAKTOR, kiriman_terbit: bandingKiriman, batas_terbit: (T.batas_terbit || []).map(lengkap), pembanding_emisi: TP.pembanding_emisi, nasional: { ...nasional, tahun: thn, st: 'hitung', src: 'esdm-statistik-2024', tgl: ptgl }, bauran: { sistem: bauranSis, provinsi: bauranProv }, ...(resmi ? { pembanding_esdm_lain: resmi.pembandingLain, kartu_sistem: kartuSisOut, kartu_provinsi: kartuProvOut, keandalan: resmi.keandalan, keandalan_nasional: resmi.keandalanNasional, tren_pln_nasional: resmi.trenPln, produksi_pln_nasional: resmi.produksiNasional } : {}), neraca: nerWil, produksi_provinsi: produksiProv, batas, aliran_sistem: aliranSis, ...(ctx.ember?.length ? { tren_nasional: ctx.ember.map((o) => ({ ...o, st: 'sumber', src: 'ember-2025', tgl: ctx.emberTgl ?? tgl })) } : {}), tren: [{ tahun: thn, sistem: bauranSis.map((b) => ({ id: b.id, persen: b.persen || null, langsung: b.langsung ?? null, daur_hidup: b.daur_hidup ?? null, tidak_dihitung: !!b.tidak_dihitung })) }] };

  if (pelengkapMeta) energi.meta.pelengkap = pelengkapMeta;
  if (resmi) energi.meta.keandalan_patah = 'SAIDI/SAIFI provinsi 2014-2015 memakai ukuran lama (nasional PLN 5,8 dan 5,3 jam) lalu melompat 2016 (nasional PLN 25,5 jam); nasional PLN = nasional ESDM mulai 2017 (19,33 jam). Lompatan ini karena definisi atau cakupan berubah antar edisi, bukan salah satuan, jadi garis grafik diputus di titik itu.';

  // ------ ringkas.json
  const kelasKm = new Map(); for (const r of ruas) { const k = kelas(r.kv); const o = kelasKm.get(k) || { kelas: k, km: 0, ruas: 0 }; o.km += r.km; o.ruas++; kelasKm.set(k, o); }
  const urutKelas = ['500', '230-275', '115-150', '66-70', 'tak-tercatat'];
  const jalurSah = new Set(besar.filter((s) => !s.potongan && !s.captive).map((s) => s.id)), sudah = new Set();
  const tunggal = jalur.filter((j) => j.tunggal && j.belakang && jalurSah.has(j.sis) && !(j.km < 2 && j.belakang.gi === 0)).sort((a, b) => b.belakang.gi - a.belakang.gi || b.belakang.mw - a.belakang.mw || cmp(a.id, b.id))
    .filter((j) => { const k = `${j.sis}|${j.belakang.gi}|${j.belakang.mw}|${j.belakang.mva}`; if (sudah.has(k)) return false; sudah.add(k); return true; }) // cabang yang sama (mis. segmen berantai) satu baris
    .slice(0, 20).map((j) => ({ id: j.id, sis: j.sis, kv: j.kv, sirkit: j.sirkit, km: R(j.km), gi: j.belakang.gi, mva: j.belakang.mva, mw: j.belakang.mw, sisi: 'kecil', nama: j.nama, st: 'hitung', src: 'osm-power', tgl }));
  const kmTot = R(ruas.reduce((s, r) => s + r.km, 0));
  const kmKv = new Map(besar.map((s) => { const o = { 500: 0, 275: 0, 230: 0, 150: 0, 70: 0, null: 0 }; for (const r of s.ruas) o[r.kv == null ? 'null' : r.kv >= 500 ? 500 : r.kv >= 275 ? 275 : r.kv >= 230 ? 230 : r.kv >= 150 ? 150 : 70] += r.km; return [s.id, Object.fromEntries(Object.entries(o).map(([k, v]) => [k, R(v)]))]; })); // km per kelas kV tepat; 66 dan 70 jadi 70; 115-149 jadi 70 tak ada di data (kv hanya 66/70/150/230/275/500)
  const ringkas = { meta: { tanggal: tgl, atribusi: 'Peta jaringan: kontributor OpenStreetMap (ODbL 1.0). Pembangkit: Global Energy Monitor dan World Resources Institute GPPD (CC BY 4.0). Tren nasional: Ember (CC BY 4.0). Neraca dan statistik: Ditjen Ketenagalistrikan ESDM.', sumber: SUMBER, celah: [...celahMasukan, 'Pembangkit gas dan diesel: lokasi dari OSM, GEM Global Gas Plant Tracker (rilis Okt 2023, unit >= 50 MW) dan WRI GPPD (data 2021, bisa usang); PLTD kecil < 50 MW tanpa koordinat belum ada.', 'Titik temu ruas di tengah garis (T) hanya dideteksi bila ruas lain berakhir dalam 50 m dari garis dan gardu terdekat <= 400 m; yang lebih jauh tidak disambung.', 'OSM dipetakan sukarelawan: tidak lengkap dan bukan data PLN.'] },
    angka: [F('ruas', ruas.length, 'ruas', 'hitung', 'osm-power', tgl), F('gardu', gardu.length, 'gardu', 'hitung', 'osm-power', tgl), F('pembangkit', pbs.length, 'pembangkit', 'hitung', 'gem', tgl), F('panjang_total', kmTot, 'km', 'hitung', 'osm-power', tgl), F('sistem', besar.length, 'sistem', 'hitung', 'osm-power', tgl), F('sistem_utama', besar.filter((s) => !s.potongan && !s.captive).length, 'sistem', 'hitung', 'osm-power', tgl), F('sistem_potongan', besar.filter((s) => s.potongan).length, 'sistem', 'hitung', 'osm-power', tgl), F('sistem_captive', besar.filter((s) => s.captive).length, 'sistem', 'hitung', 'osm-power', tgl), F('potongan_kecil', kecil.length, 'potongan', 'hitung', 'osm-power', tgl), F('jalur_tunggal', jalur.filter((j) => j.tunggal).length, 'jalur', 'hitung', 'osm-power', tgl), F('mw_pln_tertempel', R(pbs.reduce((s, p) => s + (p.gi && !p.captive ? p.mw || 0 : 0), 0)), 'MW', 'hitung', 'gem', tgl), F('gi_satu_masuk', obj.gi.filter((g) => g.satu_masuk).length, 'gardu', 'hitung', 'osm-power', tgl), F('rs_satu_sirkit_tunggal', obj.rs.filter((r) => r.tunggal && r.sirkit === 1).length, 'ruas', 'hitung', 'osm-power', tgl), F('jl_tunggal', jalur.filter((j) => j.tunggal).length, 'jalur', 'hitung', 'osm-power', tgl), F('rs_terbitan', ruas.filter((r) => r.asal).length, 'ruas', 'hitung', 'terbitan', tgl), F('tempelan_simpul', sambung.length, 'tempelan', 'hitung', 'osm-power', tgl)],
    lapis: [['op', obj.op.length], ['sis', obj.sis.length], ['prov', obj.prov.length], ['pb', obj.pb.length], ['gi', obj.gi.length], ['jl', obj.jl.length], ['rs', obj.rs.length]].map(([id, jumlah]) => ({ id, jumlah })),
    sistem: obj.sis.map((s) => ({ id: s.id, nama: s.nama, km: s.km, gi: s.gi, mw_pln: s.mw_pln, mw_captive: s.mw_captive, mva: s.mva, kv_maks: s.kv_maks, warna_kelas: s.warna_kelas, potongan: s.potongan, captive: s.captive, km_kv: kmKv.get(s.id) })).sort((a, b) => b.km - a.km || cmp(a.id, b.id)),
    tegangan: urutKelas.map((k) => { const o = kelasKm.get(k) || { km: 0, ruas: 0 }; return { kelas: k, km: R(o.km), ruas: o.ruas, st: 'hitung', src: 'osm-power', tgl }; }),
    tunggal_teratas: tunggal, neraca: nerWil,
    menunggu: [['rating_trafo', 'Kapasitas trafo (MVA) tiap gardu'], ['beban_ruas', 'Beban aktual tiap ruas'], ['kapasitas_penghantar', 'Kapasitas penghantar (ampere)'], ['gangguan', 'Riwayat gangguan dan padam']].map(([k, ket]) => ({ k, v: null, sat: '', st: 'menunggu', src: 'osm-power', tgl, ket })) };

  // ------ konstruksi (OSM, di luar graf) dan proyek gas GEM (bukan pembangkit operasi)
  const KV_K = [500, 275, 230, 150, 70], kelasK = (kv) => (kv == null ? 'tak-tercatat' : String(kv === 66 ? 70 : kv));
  const kons = ctx.konstruksi ? (() => {
    const k = parseKonstruksi(ctx.konstruksi, ctx.eps), r2 = k.ruas.filter((r) => r.c.some(([x, y]) => dalamIndonesia(provIdx, x, y))), g2 = k.gardu.filter((g) => dalamIndonesia(provIdx, g.x, g.y)), per = new Map();
    for (const r of r2) { const o = per.get(kelasK(r.kv)) || { kelas: kelasK(r.kv), km: 0, ruas: 0 }; o.km += r.km; o.ruas++; per.set(o.kelas, o); }
    const gk = new Map(); for (const g of g2) gk.set(kelasK(g.kv), (gk.get(kelasK(g.kv)) || 0) + 1);
    const urut = [...KV_K.map(String), 'tak-tercatat'];
    return { r2, g2, ringkas: { st: 'sumber', status: 'konstruksi', src: 'osm-power', tgl, ruas: r2.length, gardu: g2.length, km: R(r2.reduce((t, r) => t + r.km, 0)), km_per_kv: urut.map((u) => ({ kelas: u, km: R(per.get(u)?.km ?? 0), ruas: per.get(u)?.ruas ?? 0, gardu: gk.get(u) ?? 0 })), catatan: 'Fitur OSM dalam pembangunan (power=construction, construction:power, line=construction); tidak masuk graf, sistem, atau jembatan. Tegangan hanya bila tercatat; OSM tidak lengkap dan sebagian tag konstruksi usang.' } };
  })() : null;
  if (kons) ringkas.konstruksi = kons.ringkas;
  if (ctx.gemGas?.proyek?.length) { const dalam = ctx.gemGas.proyek.filter((p) => dalamIndonesia(provIdx, p.x, p.y)); ringkas.pembangkit_proyek = { st: 'sumber', src: 'gem-ggpt-2023', tgl: '2023-10-31', status: ['construction', 'pre-construction'].map((st) => { const a = dalam.filter((p) => p.status === st); return { status: st, n: a.length, mw: R(a.reduce((t, p) => t + (p.mw || 0), 0)), proyek: a.map((p) => ({ id: p.id, nama: p.nama, jenis: p.jenis, mw: p.mw, tahun: p.tahun })) }; }), catatan: 'Proyek gas/diesel yang belum beroperasi (rilis GEM Okt 2023, bisa usang); tidak dihitung dalam pembangkit, bauran, atau MW PLN.' }; }

  // ------ geo
  const tahunG = gardu.map((g) => g.tahun).filter((x) => x != null).sort((a, b) => a - b), bin = new Map();
  for (const t of tahunG) { const k = Math.floor(t / 5) * 5; bin.set(k, (bin.get(k) || 0) + 1); }
  ringkas.umur_gardu = tahunG.length ? { n: tahunG.length, dari: gardu.length, median: tahunG[Math.floor((tahunG.length - 1) / 2)], per_5_tahun: [...bin].sort((a, b) => a[0] - b[0]).map(([t, n]) => ({ mulai: t, n })), asal: 'osm-power', st: 'hitung', src: 'osm-power', tgl } : null;
  ringkas.bertambah = { tersedia: false, alasan: 'BIG Satu Peta tanpa tegangan/MVA/tahun dan hanya mencakup Riau-Jambi (2018) dan Kalimantan (2016) (laporan-KJ14); garis BIG tidak dimuat. Yang tampil: daftar peristiwa terbitan.', cakupan: ['Riau-Jambi 2018', 'Kalimantan 2016'], st: 'menunggu', src: 'big', tgl };
  if (ctx.bigGaris?.length) {
    const bg = bandingBig(ruas, ctx.bigGaris, provPoint, kelas, 300), grupGaris = [...new Set(ctx.bigGaris.map((g) => g.grup))].sort(), semuaGrup = [...new Set([...grupGaris, ...(ctx.bigGrupTanpaGaris || [])])].sort();
    if (bg.segmen) {
      const km = [...bg.per.values()].reduce((t, o) => t + o.km, 0), baru = [...bg.per.values()].reduce((t, o) => t + o.baru, 0);
      ringkas.bertambah = { tersedia: true, bukan_nasional: true, cakupan: semuaGrup, cakupan_garis: grupGaris, tanpa_garis: (ctx.bigGrupTanpaGaris || []).slice().sort(), bbox: bg.bbox, prov: bg.prov.map((k) => ({ kode: k, nama: namaProv.get(k) || k })), ambang_m: 300, garis_big: bg.garis, km_osm_dalam_cakupan: R(km), km_tak_tumpang_tindih: R(baru), persen: km ? R((baru / km) * 100) : null,
        per_prov: [...bg.per].sort((a, b) => cmp(a[0], b[0])).map(([k, o]) => ({ kode: k, nama: namaProv.get(k) || k, km_osm: R(o.km), km_baru: R(o.baru), kelas: urutKelas.filter((c) => o.kelas.has(c)).map((c) => ({ kelas: c, km_osm: R(o.kelas.get(c).km), km_baru: R(o.kelas.get(c).baru) })) })),
        catatan: 'BUKAN angka nasional: hanya saluran OSM yang berada di dalam kotak garis BIG dan di provinsi tempat garis BIG ada (Riau-Jambi 2018). Garis BIG di Kalimantan 2016 tidak ada (hanya titik), jadi Kalimantan tidak dibandingkan. "Tak tumpang tindih" = OSM lebih dari 300 m dari garis BIG; BIG tanpa tegangan (bisa memuat jaringan distribusi, sehingga angka ini cenderung terlalu kecil) dan 2018 versus OSM ' + tgl.slice(0, 4) + ': selisih memuat pemetaan OSM yang lebih lengkap, bukan hanya jaringan yang benar-benar baru dibangun. Nilai ini tidak bisa dibaca sebagai pertumbuhan.', st: 'hitung', src: ['big', 'osm-power'], tgl };
    }
  }
  if (agregatRj) ringkas.ruptl_jaringan_agregat = agregatRj;
  { const e = ebtDekatGardu(ctx.atlas, gardu.map((g) => ({ id: g.id, nama: g.nama, kv: g.kv, prov: g.prov, sis: sisDariNode.get(g.id)?.id || null })), 10); if (e) ringkas.ebt_dekat_gardu = e; }
  ringkas.peristiwa = TP.peristiwa; ringkas.angka_pln = TP.angka_pln; ringkas.sambungan_terbitan = sambunganDicatat.map((x) => ({ ...x, tgl: (T.sumber || []).find((q) => q.id === x.src)?.tanggal_terbit ?? tgl }));
  ringkas.meta.dibuang_luar_indonesia = dibuang; ringkas.meta.aturan_nama_sistem = 'Jawa-Bali dan Sumatera menurut geografi dua sistem utama terbesar; nama sistem PLN (RUPTL 2025, sistem_pln.json) hanya bila >= 3 gardu, >= 100 km dan mayoritas gardu berada di provinsi sistem itu; multi-provinsi lain: <pulau> bagian <arah> menurut pusat massa relatif bbox pulau; satu provinsi lintas kota: <provinsi> bagian <arah>; satu kota (>= 80% gardu): nama kabupaten/kota (pusat-wilayah.json); komponen < 5 gardu atau tanpa MW PLN: Potongan <kota>; jaringan captive (MW captive > 5x PLN): Jaringan captive <nama>; <kota> = tempat terpadat GeoNames (CC BY 4.0, penduduk >= 1000 atau ibu kota kabupaten/kota) dalam 25 km (bila kosong 60 km) dari pusat sistem, bila tak ada nama gardu terdekat. Semua pencocokan heuristik: st hitung.';  ringkas.lintas_negara = lintasNegara.sort((a, b) => cmp(a.id, b.id));
  ringkas.meta.ragu = [...new Set(ragu.map((x) => JSON.stringify(x)))].sort();
  ringkas.meta.ragu = ringkas.meta.ragu.map((x) => JSON.parse(x));
  const nJT = jalur.filter((j) => j.tunggal).length, ap_mva = TP.angka_pln.find((x) => x.id === 'AP-pln-gi-mva'); // total MVA gardu induk PLN, Statistik 2024 Tabel 20/30
  const bab = (n, id, src, ubin, teratas, total, ket) => ({ n, id, ubin: ubin.map((u) => ({ st: 'hitung', src: src[0], tgl, ...u })), teratas: teratas.map((t) => ({ src: src[0], ...t })), lainnya: Math.max(0, total - teratas.length), src, st: 'hitung', tgl, ...ket });
  ringkas.bab = [
    bab(1, 'sekilas', ['osm-power', 'gem', 'esdm-statistik-2024'], [...ringkas.tegangan.map((t) => ({ k: 'km_' + t.kelas, v: t.km, sat: 'km' })), { k: 'gardu', v: gardu.length, sat: 'gardu' }, { k: 'pembangkit', v: pbs.length, sat: 'pembangkit' }, { k: 'mw_pln', v: ringkas.angka.find((a) => a.k === 'mw_pln_tertempel').v, sat: 'MW' }, { k: 'mva', v: mvaJum(gardu), sat: 'MVA' }, ...(ap_mva ? [{ k: 'mva_terbit', v: ap_mva.nilai, sat: 'MVA', st: 'sumber', src: ap_mva.src, tgl: String(ap_mva.tahun) }] : [])], [], 0, { pembanding: TP.angka_pln }),
    bab(2, 'sistem', ['osm-power'], [{ k: 'sistem', v: besar.length, sat: 'sistem' }, { k: 'potongan_kecil', v: kecil.length, sat: 'potongan' }], ringkas.sistem.slice(0, 8), besar.length, {}),
    bab(3, 'tunggal', ['osm-power', 'terbitan'], [{ k: 'jalur_tunggal', v: nJT, sat: 'jalur' }, { k: 'sambungan_terbitan', v: ruas.filter((r) => r.asal).length, sat: 'ruas' }], tunggal.slice(0, 8), nJT, {}),
    bab(4, 'bertambah', ['osm-power', 'terbitan', 'big'], [], TP.peristiwa.slice(0, 8), TP.peristiwa.length, { bertambah: ringkas.bertambah }),
    bab(5, 'neraca', ['esdm-statistik-2024'], [], nerWil.slice().sort((a, b) => Math.abs(b.neraca_gwh) - Math.abs(a.neraca_gwh)).slice(0, 8), nerWil.length, {}),
    bab(6, 'tak-terlihat', ['osm-power'], ringkas.menunggu.map((m) => ({ k: m.k, v: null, sat: '', st: 'menunggu' })), [], 0, { umur_gardu: ringkas.umur_gardu }),
    bab(7, 'cara', ringkas.meta.sumber.map((x) => x.id), [], [], 0, { angka_pln: TP.angka_pln }),
  ];
  const geo = { meta: { tanggal: tgl, atribusi: 'OpenStreetMap (ODbL 1.0); Global Energy Monitor (CC BY 4.0)' }, rs: ruas.map((r) => ({ id: r.id, kv: r.kv, c: r.c.map(([x, y]) => [R(x, 4), R(y, 4)]) })).sort((a, b) => cmp(a.id, b.id)), gi: gardu.map((g) => ({ id: g.id, n: g.nama, kv: g.kv, x: R(g.x, 4), y: R(g.y, 4) })).sort((a, b) => cmp(a.id, b.id)), pb: pbs.map((p) => ({ id: p.id, j: p.jenis, mw: p.mw, x: R(p.x, 4), y: R(p.y, 4) })), ...(kons ? { konstruksi: [...kons.r2.map((r) => ({ id: r.id, j: r.jenis, kv: r.kv, st: 'sumber', status: 'konstruksi', c: r.c.map(([x, y]) => [R(x, 4), R(y, 4)]) })), ...kons.g2.map((g) => ({ id: g.id, j: 'substation', kv: g.kv, n: g.nama, st: 'sumber', status: 'konstruksi', x: R(g.x, 4), y: R(g.y, 4) }))].sort((a, b) => cmp(a.id, b.id)) } : {}) };
  return { ringkas, objek: obj, energi, geo };
}

// ---------- Pembanding BIG: km saluran OSM yang tak berada dalam `tolM` meter dari garis BIG, hanya di dalam bbox garis BIG dan provinsi tempat garis BIG berada.
// garis = [{ grup, c: [[x,y],...] }]; ruas = ruas OSM (tanpa sambungan terbitan). Pecahan <= 100 m diuji lewat titik tengahnya (indeks grid 0,01 derajat).
export function bandingBig(ruas, garis, provPoint, kelas, tolM = 300) {
  const seg = [], G = 0.01, grid = new Map(), kunci = (x, y) => Math.floor(x / G) + ',' + Math.floor(y / G);
  let bb = [Infinity, Infinity, -Infinity, -Infinity]; const provBig = new Set();
  for (const g of garis) for (let i = 0; i < g.c.length; i++) { const [x, y] = g.c[i]; bb = [Math.min(bb[0], x), Math.min(bb[1], y), Math.max(bb[2], x), Math.max(bb[3], y)]; const k = provPoint(x, y); if (k) provBig.add(k); if (i) seg.push([g.c[i - 1], g.c[i]]); }
  seg.forEach((sg, i) => { const [a, b] = sg; for (let x = Math.floor(Math.min(a[0], b[0]) / G); x <= Math.floor(Math.max(a[0], b[0]) / G); x++) for (let y = Math.floor(Math.min(a[1], b[1]) / G); y <= Math.floor(Math.max(a[1], b[1]) / G); y++) { const q = x + ',' + y; (grid.get(q) || grid.set(q, []).get(q)).push(i); } });
  const jarak = (p, [a, b]) => { const mx = mX(p[1]), ax = (a[0] - p[0]) * mx, ay = (a[1] - p[1]) * mY, bx = (b[0] - p[0]) * mx, by = (b[1] - p[1]) * mY, dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = l2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l2)) : 0; return Math.hypot(ax + t * dx, ay + t * dy); };
  const dekat = (p) => { const cx = Math.floor(p[0] / G), cy = Math.floor(p[1] / G), r = Math.ceil(tolM / (110574 * G)); for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) for (const i of grid.get(x + ',' + y) || []) if (jarak(p, seg[i]) <= tolM) return true; return false; };
  const per = new Map();
  if (seg.length) for (const r of ruas) { if (r.asal) continue; const kl = kelas(r.kv); for (let i = 1; i < r.c.length; i++) { const a = r.c[i - 1], b = r.c[i], L = jarakM(a, b), n = Math.max(1, Math.ceil(L / 100)); for (let j = 0; j < n; j++) { const f = (j + 0.5) / n, p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; if (p[0] < bb[0] || p[0] > bb[2] || p[1] < bb[1] || p[1] > bb[3]) continue; const k = provPoint(p[0], p[1]); if (!k || !provBig.has(k)) continue; const o = per.get(k) || { km: 0, baru: 0, kelas: new Map() }; const kk = o.kelas.get(kl) || { km: 0, baru: 0 }; const m = L / n / 1000; o.km += m; kk.km += m; if (!dekat(p)) { o.baru += m; kk.baru += m; } o.kelas.set(kl, kk); per.set(k, o); } } }
  return { bbox: seg.length ? bb.map((v) => R(v, 3)) : null, prov: [...provBig].sort(), per: per, garis: garis.length, segmen: seg.length };
}

// ---------- Cakupan ubin (celah)
// Potret objek dipecah demi waktu muat: inti (tanpa fakta dan ruas), ruas, fakta per id.
export function pecahObjek(objek) {
  const fakta = {}, rinci = {}, ramping = (x) => Object.fromEntries(Object.entries(x).filter(([, v]) => v !== null && v !== '' && v !== false)); // null/''/false dibuang dari objek-inti (klien memakai pengecekan truthy)
  const tanpa = (a) => a.map(({ fakta: f, ...x }) => { fakta[x.id] = f; return ramping(x); });
  // pb: pemilik, tautan, catatan pindah (tahun tetap: kolom tabel ontologi) ke objek-fakta.pb_rinci[id] (hanya kartu yang butuh)
  const tanpaPb = (a) => a.map(({ fakta: f, pemilik, tautan, catatan, ...x }) => { fakta[x.id] = f; const r = ramping({ pemilik, tautan: tautan?.length ? tautan : null, catatan }); if (Object.keys(r).length) rinci[x.id] = r; return ramping(x); });
  const jlRs = {}, inti = { op: tanpa(objek.op), sis: tanpa(objek.sis), prov: tanpa(objek.prov), pb: tanpaPb(objek.pb), gi: tanpa(objek.gi), jl: tanpa(objek.jl).map(({ rs: r, gi: _g, ...x }) => { jlRs[x.id] = r; return x; }) }, rs = { rs: tanpa(objek.rs), jl_rs: jlRs }; // jl.rs pindah ke objek-rs (jl_rs); jl.gi = a/b yang berawalan gi_
  return { inti, rs, fakta: { fakta, pb_rinci: rinci, sambung_simpul: objek.sambung_simpul } };
}
export function celahUbin(berkas) {
  const kotak = berkas.map((f) => f.match(/^u_(-?[\d.]+)_(-?[\d.]+)_(-?[\d.]+)_(-?[\d.]+)\.json$/)).filter(Boolean).map((m) => m.slice(1).map(Number));
  const hilang = [];
  for (const [s, w, n, e] of Object.values(WILAYAH)) {
    const luas = (n - s) * (e - w), melingkupi = kotak.some(([s2, w2, n2, e2]) => s2 <= s + 1e-6 && w2 <= w + 1e-6 && n2 >= n - 1e-6 && e2 >= e - 1e-6), isi = kotak.filter(([s2, w2, n2, e2]) => s2 >= s - 1e-6 && w2 >= w - 1e-6 && n2 <= n + 1e-6 && e2 <= e + 1e-6).reduce((t, [s2, w2, n2, e2]) => t + (n2 - s2) * (e2 - w2), 0);
    if (!melingkupi && isi < luas * 0.99) hilang.push([s, w, n, e]);
  }
  return hilang.length ? ['Ubin belum terpanen [S,W,N,E]: ' + hilang.map((b) => b.join(',')).join('; ') + '. Jaringan di ubin itu belum masuk.'] : [];
}

// ---------- Gerbang: hasil yang bertentangan dengan fakta pemeriksa = galat (bukan peringatan)
export function gerbang(o, ctx, celah = []) {
  const galat = [], ada = (n) => o.objek.sis.some((s) => s.nama === n), hilang = celah.join(' ');
  const tutup = (b) => !hilang.includes(b); // ubin penutup wilayah itu sudah terpanen
  if (!ada('Jawa-Bali') && tutup('-11,103,-5,111') && tutup('-11,111,-5,119')) galat.push('sistem Jawa-Bali tidak terbentuk padahal ubin Jawa terpanen');
  if (!ada('Sumatera') && tutup('-5,95,1,103') && tutup('-5,103,1,111')) galat.push('sistem Sumatera tidak terbentuk padahal ubin Sumatera terpanen');
  const jb = o.objek.sis.find((s) => s.nama === 'Jawa-Bali');
  for (const sj of o.ringkas.sambungan_terbitan || []) { // sambungan terbit Jawa-Bali yang terpasang harus menyatukan Bali ke sistem Jawa
    const [p, q] = sj.prov.slice().sort(); if (!(p === '51' && /^3[1-6]$/.test(q) || q === '51' && /^3[1-6]$/.test(p))) continue;
    const bali = o.objek.gi.find((g) => g.prov === '51' && g.sis);
    if (jb && bali && bali.sis !== jb.id) galat.push('Bali terputus dari Jawa padahal sambungan terbitan ' + sj.id + ' terpasang');
  }
  for (const k of ['op', 'sis', 'prov', 'pb', 'gi', 'jl', 'rs']) {
    const ids = o.objek[k].map((x) => x.id), dup = ids.filter((x, i) => ids.indexOf(x) !== i); if (dup.length) galat.push(`id ganda di lapis ${k}: ${[...new Set(dup)].slice(0, 3).join(', ')} (${dup.length})`);
    const buruk = o.objek[k].filter((x) => /\b(undefined|null|NaN)\b/.test(String(x.nama ?? ''))); if (buruk.length) galat.push(`nama memuat undefined/null di lapis ${k}: ${buruk.slice(0, 3).map((x) => x.id).join(', ')}`);
  }
  // geo dan objek satu-satu
  for (const [g, k] of [['rs', 'rs'], ['gi', 'gi'], ['pb', 'pb']]) { const a = o.geo[g].map((x) => x.id).sort(), b = o.objek[k].map((x) => x.id).sort(); if (a.length !== b.length || a.some((x, i) => x !== b[i])) galat.push(`geo.${g} (${a.length}) tidak satu-satu dengan objek.${k} (${b.length})`); }
  // tiap id sumber yang dipakai wajib ada di meta.sumber (semua potret berbagi daftar yang sama)
  const idSumber = new Set(o.ringkas.meta.sumber.map((x) => x.id)), tidakAda = new Set();
  const telusur = (v) => { if (Array.isArray(v)) v.forEach(telusur); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if ((k === 'src' || k.startsWith('src_') || k === 'batas_src') && (typeof x === 'string' || Array.isArray(x))) for (const id of [].concat(x).flatMap((q) => String(q).split(','))) { if (id && !idSumber.has(id)) tidakAda.add(id); } else telusur(x); } };
  telusur(o.ringkas); telusur(o.objek); telusur(o.energi);
  if (tidakAda.size) galat.push('id sumber tak ada di meta.sumber: ' + [...tidakAda].slice(0, 8).join(', '));
  // aliran rata-rata tahunan di satu batas tidak boleh melebihi angka kiriman puncak terbitan untuk pasangan yang sama
  for (const k of o.energi.kiriman_terbit) if (!k.catatan_tegangan && k.kami && k.terbit_mw != null && Math.abs(k.kami.mw) > Math.abs(k.terbit_mw) && !k.melebihi_puncak) galat.push(`aliran ${k.dari} - ${k.ke} melebihi puncak terbitan tetapi tidak ditandai melebihi_puncak (${k.id})`); // melebihi puncak = peringatan (meta.peringatan), bukan galat
  // bauran: tak ada GWh dihitung dua kali; faktor kapasitas <= 1; potongan/captive tidak dihitung
  const sisBy = new Map(o.objek.sis.map((s) => [s.id, s])); let jum = 0;
  for (const b of o.energi.bauran.sistem) { const s = sisBy.get(b.id); if (b.tidak_dihitung) continue; jum += b.total; if (s.potongan || s.captive) galat.push(`bauran dihitung untuk sistem ${s.potongan ? 'potongan' : 'captive'} ${b.nama}`); if (b.daur_hidup != null && b.daur_hidup < b.langsung) galat.push(`daur hidup ${b.daur_hidup} < langsung ${b.langsung} di ${b.nama}`); if (!(b.faktor_kapasitas <= 1)) galat.push(`faktor kapasitas ${b.nama} ${b.faktor_kapasitas} > 1`); if (!(b.mw_pln > 0)) galat.push(`bauran ${b.nama} dihitung dengan MW PLN 0`); }
  if (jum > o.energi.nasional.total + 1) galat.push(`GWh bauran sistem ${R(jum)} melebihi produksi nasional ${o.energi.nasional.total} (terhitung dua kali)`);
  for (const k of o.energi.kartu_provinsi || []) { const d = k.penjualan_gwh || []; for (let i = 1; i < d.length; i++) { if (d[i].tahun !== d[i - 1].tahun + 1 || d[i].patah_edisi || d[i - 1].patah_edisi) continue; const r = d[i].gwh / d[i - 1].gwh; if (!(r >= 0.5 && r <= 1.6)) galat.push(`penjualan provinsi ${k.kode} ${k.nama} ${d[i - 1].tahun}->${d[i].tahun}: ${d[i - 1].gwh} -> ${d[i].gwh} GWh (rasio ${R(r, 2)} di luar 0,5-1,6; sumber ${d[i - 1].src} / ${d[i].src}; ganda atau unit berbeda?)`); } }
  const kap = new Map(ctx.statistik.baris.map((b) => [b.kode, b.kapasitas_terpasang_mw.total || 0]));
  for (const s of o.objek.sis) { const mx = s.prov.reduce((t, k) => t + (kap.get(k) || 0), 0); if (s.mw_pln > mx) galat.push(`MW PLN ${s.nama} ${s.mw_pln} > kapasitas terpasang Statistik ${mx} (provinsi ${s.prov.join(',')})`); }
  return galat;
}

// ---------- CLI
const baca = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
export function muatCtx() { return { pusat: baca('data/geo/pusat-wilayah.json').adm2, organisasi: baca('public/data/organisasi.json'), provinsi: baca('public/geo/provinsi.json'), pltu: baca('public/data/pltu.json'), gem: baca('public/data/gem_pembangkit.json'), osm: baca('public/data/pembangkit_osm.json'), statistik: baca('public/data/statistik_pln.json'), sistem_pln: baca('public/data/sistem_pln.json') }; }
const gz = (o) => zlib.gzipSync(JSON.stringify(o)).length;
const BATAS = { ringkas: 40e3, inti: 150e3, rs: 250e3, fakta: 300e3, energi: 60e3, geo: 900e3 };
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, dir, tgl] = process.argv.slice(2);
  if (cmd !== 'bangun' || !dir || !/^\d{4}-\d\d-\d\d$/.test(tgl || '')) { console.log('pakai: bangun <dirMentah> <YYYY-MM-DD>'); process.exit(1); }
  const berkas = fs.readdirSync(dir).filter((f) => /^u_.*\.json$/.test(f)).sort();
  const el = []; for (const f of berkas) el.push(...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).elements);
  const ctx = muatCtx();
  const mentahAdik = (n) => path.join(path.resolve(dir), '..', n);
  const sj = path.join(ROOT, 'data/kembaran/statistik.json'); if (fs.existsSync(sj)) ctx.statResmi = JSON.parse(fs.readFileSync(sj, 'utf8'));
  for (const [k, f] of [['biaya', 'public/data/biaya_listrik.json'], ['ruptl', 'public/data/ruptl.json'], ['akses', 'public/data/akses_energi.json'], ['desa', 'public/data/desa_listrik.json'], ['pelengkap', 'data/kembaran/pelengkap.json'], ['atlas', 'data/kembaran/atlas.json'], ['geonames', 'data/kembaran/geonames_kota.json'], ['ruptl_jaringan', 'data/kembaran/ruptl_jaringan.json']]) if (fs.existsSync(path.join(ROOT, f))) ctx[k] = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); // pelengkap kartu: tiap berkas opsional
  const tj = path.join(ROOT, 'data/kembaran/terbitan.json'); if (fs.existsSync(tj)) ctx.terbitan = JSON.parse(fs.readFileSync(tj, 'utf8'));
  const gp = process.env.GPPD_CSV || path.join(path.resolve(dir), '..', '..', 'wri-gppd', 'global_power_plant_database.csv'); if (fs.existsSync(gp)) ctx.gppd = barisGppd(fs.readFileSync(gp, 'utf8'));
  const dp = mentahAdik('osm-pembangkit'); if (fs.existsSync(dp)) { const e = []; for (const f of fs.readdirSync(dp).filter((x) => x.endsWith('.json')).sort()) e.push(...(JSON.parse(fs.readFileSync(path.join(dp, f), 'utf8')).elements || [])); ctx.osmEkstra = barisDariOverpass(e); }
  const gg = path.join(path.resolve(dir), '..', '..', 'gem-gas', 'data.csv'); if (fs.existsSync(gg)) { ctx.gemGas = barisGemGas(fs.readFileSync(gg, 'utf8')); ctx.gemGas.tanggal_ambil = '2026-11-25'; }
  const em = path.join(path.resolve(dir), '..', '..', 'ember', 'global.csv'); if (fs.existsSync(em)) { ctx.ember = barisEmber(fs.readFileSync(em, 'utf8')); ctx.emberTgl = '2026-11-25'; }
  const dk = mentahAdik('osm-konstruksi'); if (fs.existsSync(dk)) { const e = []; for (const f of fs.readdirSync(dk).filter((x) => x.endsWith('.json')).sort()) e.push(...(JSON.parse(fs.readFileSync(path.join(dk, f), 'utf8')).elements || [])); ctx.konstruksi = e; }
  ctx.big = fs.existsSync(mentahAdik('big')) && fs.readdirSync(mentahAdik('big')).length ? true : null;
  if (ctx.big) { // garis jaringan listrik BIG per lembar; grup dari nama berkas (RBI_<tahun>_25K_<wilayah>_...); grup tanpa garis dicatat saja
    const grupDari = (f) => { const m = f.match(/^RBI_(\d{4})_25K_(.+?)_(?:TRANSPORTASI)?(?:DAN)?UTILITAS/); return m ? m[2].replace(/\d+$/, '').split('_').filter(Boolean).map((w) => w[0] + w.slice(1).toLowerCase()).join('-') + ' ' + m[1] : f; };
    ctx.bigGaris = []; const adaGaris = new Set(), semuaGrup = new Set();
    for (const f of fs.readdirSync(mentahAdik('big')).filter((x) => x.endsWith('.geojson')).sort()) { const g = grupDari(f); semuaGrup.add(g); for (const ft of JSON.parse(fs.readFileSync(path.join(mentahAdik('big'), f), 'utf8')).features) { const t = ft.geometry?.type; if (t !== 'LineString' && t !== 'MultiLineString') continue; for (const ln of t === 'LineString' ? [ft.geometry.coordinates] : ft.geometry.coordinates) { ctx.bigGaris.push({ grup: g, c: ln.map((q) => [q[0], q[1]]) }); adaGaris.add(g); } } }
    ctx.bigGrupTanpaGaris = [...semuaGrup].filter((g) => !adaGaris.has(g));
  }
  let o = bangun(el, ctx, tgl, celahUbin(berkas));
  for (const eps of [0.0015, 0.003, 0.006]) { if (gz(o.geo) <= BATAS.geo) break; ctx.eps = eps; o = bangun(el, ctx, tgl, celahUbin(berkas)); } // geometri kebesaran: sederhanakan lagi
  const galat = gerbang(o, ctx, celahUbin(berkas)); if (galat.length) { console.error('GERBANG GAGAL:\n- ' + galat.join('\n- ')); process.exit(1); }
  const tulis = (f, v, kunci) => { const g = gz(v); if (g > BATAS[kunci]) { console.error(`GAGAL ${f}: gzip ${g} > batas ${BATAS[kunci]}`); process.exitCode = 1; } fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), JSON.stringify(v) + '\n'); console.log(f, 'gzip', g); };
  tulis('public/data/kembaran/ringkas.json', o.ringkas, 'ringkas'); const pc = pecahObjek(o.objek); tulis('public/data/kembaran/objek-inti.json', pc.inti, 'inti'); tulis('public/data/kembaran/objek-rs.json', pc.rs, 'rs'); tulis('public/data/kembaran/objek-fakta.json', pc.fakta, 'fakta'); fs.rmSync(path.join(ROOT, 'public/data/kembaran/objek.json'), { force: true }); tulis('public/data/kembaran/energi.json', o.energi, 'energi'); tulis('public/geo/kembaran.json', o.geo, 'geo');
  for (const w of o.energi.meta.peringatan) console.error('PERINGATAN: ' + w);
  console.log(o.ringkas.angka.map((a) => a.k + '=' + a.v).join(' '), 'ubin', berkas.length);
}
