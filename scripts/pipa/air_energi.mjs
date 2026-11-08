// Nexus air-energi -> public/data/air_energi.json + public/data/geo/das_hidro.geojson.
// Pembangkit hidro (proyek_terpadu.json) dipetakan ke sub-DAS HydroBASINS lev07, lalu diberi skor kerentanan air (bobot Hipotesis).
// Sumber terbuka: HydroBASINS v1c (Lehner & Grill 2013, lisensi HydroSHEDS), NASA POWER (hujan bulanan, domain publik),
// NOAA CPC ONI (domain publik), Ember tahunan (CC BY 4.0, lewat ember_bulanan.json), dan potret kekeringan Posko
// (SPI/HTH/kelembapan tanah per sel 0,5 derajat; hulu: NASA POWER, Open-Meteo CC BY 4.0, ERA5-Land Copernicus).
// Pakai:  POSKO_DIR=/jalur/ke/poskokarhutla node scripts/pipa/air_energi.mjs [--segar]
// Cache mentah: data-panen/air_energi/ (di-ignore git). Tanpa --segar memakai cache bila ada.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CACHE = path.join(ROOT, 'data-panen/air_energi');
const hari = () => new Date().toISOString().slice(0, 10);

/* ---------- konstanta model (bobot = Hipotesis, bisa disetel pemilik) ---------- */
export const BOBOT = { enso: 0.25, spi: 0.2, hth: 0.1, tanah: 0.1, tampungan: 0.25, tekanan: 0.1 };
export const AMBANG = { sedang: 25, tinggi: 45, 'sangat-tinggi': 65 };
export const kelasSkor = (s) => (s >= AMBANG['sangat-tinggi'] ? 'sangat-tinggi' : s >= AMBANG.tinggi ? 'tinggi' : s >= AMBANG.sedang ? 'sedang' : 'rendah');
export const RAWAN = 45; // skor >= ini = "rawan kering"
const klem = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const r1 = (v) => Math.round(v * 10) / 10;

/** Komponen -> skor 0-100; komponen tanpa data (null) dikeluarkan dan bobot dinormalkan ulang. */
export function skor(komp, bobot = BOBOT) {
  const ada = Object.entries(komp).filter(([, v]) => v != null && Number.isFinite(v));
  const w = ada.reduce((s, [k]) => s + bobot[k], 0);
  if (!w) return { skor: null, kelas: null, dikeluarkan: Object.keys(komp) };
  const s = ada.reduce((a, [k, v]) => a + (v * bobot[k]) / w, 0);
  return { skor: Math.round(s), kelas: kelasSkor(s), dikeluarkan: Object.keys(komp).filter((k) => komp[k] == null) };
}
/** Pemetaan mentah -> komponen 0-100. */
export const vEnso = (slopePct) => (slopePct == null ? null : klem((-slopePct / 80) * 100)); // -80 persen hujan kemarau per +1 ONI = 100 (median hidro -45)
export const vSpi = (s3, s6) => { const a = [s3, s6].filter((x) => x != null); return a.length ? klem(((0.5 - a.reduce((x, y) => x + y, 0) / a.length) / 2.5) * 100) : null; };
export const vHth = (h) => (h == null ? null : klem((Math.min(h, 60) / 60) * 100));
export const vTanah = (p) => (p == null ? null : klem(100 - p));
export const vTekanan = (nPlta, irigasiAirBaku) => klem(Math.min(60, 15 * (nPlta - 1)) + (irigasiAirBaku ? 40 : 0));
export const jenisPlt = (nama, mw) => (/PLTMH|micro|pico/i.test(nama) ? 'PLTMH' : /PLTM\b|mini[- ]?hydro/i.test(nama) ? 'PLTM' : mw != null && mw <= 1 ? 'PLTMH' : mw != null && mw <= 10 ? 'PLTM' : 'PLTA');

/** Waduk serbaguna yang dikenali (kata kunci nama pembangkit). fungsi/tampungan: sekunder (PUPR, PLN, Wikipedia; tampungan Jawa dari Posko waduk.csv). */
export const WADUK = [
  { k: 'cirata', n: 'Cirata', f: ['plta', 'perikanan'], tj: 1900 }, { k: 'saguling', n: 'Saguling', f: ['plta', 'air-baku'], tj: 982 },
  { k: 'jatiluhur', n: 'Jatiluhur', f: ['plta', 'irigasi', 'air-baku', 'banjir'], tj: 2440 }, { k: 'jatigede', n: 'Jatigede', f: ['plta', 'irigasi', 'air-baku', 'banjir'] },
  { k: 'karangkates|sutami', n: 'Sutami (Karangkates)', f: ['plta', 'irigasi', 'air-baku', 'banjir'], tj: 178.16 }, { k: 'sudirman|mrica', n: 'Panglima Besar Soedirman (Mrica)', f: ['plta', 'irigasi'] },
  { k: 'wonogiri|gajah mungkur', n: 'Gajah Mungkur (Wonogiri)', f: ['plta', 'irigasi', 'air-baku', 'banjir'], tj: 375 }, { k: 'kedung ?ombo', n: 'Kedung Ombo', f: ['plta', 'irigasi', 'air-baku', 'banjir'], tj: 634.6 },
  { k: 'riam kanan', n: 'Riam Kanan', f: ['plta', 'irigasi', 'air-baku'] }, { k: 'koto ?panjang', n: 'Koto Panjang', f: ['plta', 'banjir'] },
  { k: 'singkarak', n: 'Danau Singkarak', f: ['plta', 'irigasi'] }, { k: 'maninjau', n: 'Danau Maninjau', f: ['plta', 'perikanan'] },
  { k: 'wlingi|lodoyo|brantas', n: 'Wlingi-Lodoyo (Brantas)', f: ['plta', 'irigasi', 'air-baku'] }, { k: 'besai', n: 'Way Besai', f: ['plta', 'irigasi'] },
  { k: 'bakaru', n: 'Bakaru', f: ['plta', 'irigasi'] }, { k: 'poso', n: 'Danau Poso', f: ['plta', 'irigasi'] },
  { k: 'larona|balambano|karebbe', n: 'Danau Towuti-Matano (Larona)', f: ['plta'] }, { k: 'asahan|sigura|tangga', n: 'Asahan (Danau Toba)', f: ['plta'] },
];
export const cocokWaduk = (nama) => WADUK.find((w) => new RegExp(w.k, 'i').test(nama)) || null;
/** Tampungan (0-100, tinggi = tanpa penyangga): run-of-river tertinggi, waduk besar terendah. */
export function vTampungan(jenis, waduk) {
  if (waduk) return waduk.tj >= 500 ? 20 : waduk.tj >= 100 ? 30 : 40;
  return jenis === 'PLTA' ? 60 : 90;
}

/** Dua baris pembangkit yang sama: berdekatan (0,03 derajat) atau bernama dasar sama, dengan MW selisih < 12 persen. */
export function duplikat(a, b) {
  const mw = a.mw == null || b.mw == null || Math.abs(a.mw - b.mw) / Math.max(a.mw, b.mw) < 0.12;
  const dekat = Math.abs(a.lat - b.lat) < 0.03 && Math.abs(a.lng - b.lng) < 0.03;
  const nama = bersihNama(a.nama).toLowerCase() === bersihNama(b.nama).toLowerCase();
  return mw && (dekat || nama);
}

/* ---------- regresi & statistik ---------- */
export function regresi(x, y) {
  const n = x.length, mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  const b = sxx ? sxy / sxx : 0, r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
  return { n, lereng: b, titik: my - b * mx, r, r2: r * r };
}

/* ---------- kebutuhan air pembangkit (koefisien Hipotesis; m3 per MWh listrik) ---------- */
export const KOEF = [
  { id: 'pltu', tek: 'batubara', m3_mwh: 2.6, rentang: [0.95, 2.6], fk: 0.65, label: 'rujukan', rumus: 'konsumsi pendingin menara 687 galon/MWh (median Macknick dkk. 2012, NREL/TP-6A20-50900) = 2,6 m3/MWh; sekali-lewat 0,95' },
  { id: 'pltp', tek: 'panas-bumi', m3_mwh: 1.5, rentang: [0.1, 3], fk: 0.8, label: 'hipotesis', rumus: 'uap yang terkondensasi menjadi air make-up menara, fluida diinjeksi balik; konsumsi bersih bergantung desain, kisaran kasar 0,1-3 m3/MWh, perlu data tiap lapangan' },
  { id: 'plts', tek: 'surya', m3_mwh: 0.1, rentang: [0.02, 0.15], fk: 0.17, label: 'rujukan', rumus: 'PV 26 galon/MWh (median Macknick dkk. 2012) = 0,1 m3/MWh, terutama pembersihan panel' },
];
export const H2 = { stoikiometri_l_kg: 9, praktis_l_kg: 15, label: 'rujukan', rumus: '2 H2O -> 2 H2 + O2: 9 kg air per kg H2 (stoikiometri); proses elektrolisis dan pemurnian praktis 15 L/kg (kisaran 15-20, IRENA dan IEA)' };
export const airTahun = (mw, fk, koef) => (mw * 8760 * fk * koef) / 1e6; // juta m3 per tahun

/* ---------- geometri ---------- */
export function bacaShp(file) {
  const b = fs.readFileSync(file), out = [];
  let o = 100;
  while (o + 8 <= b.length) {
    const len = b.readInt32BE(o + 4) * 2, c = o + 8; o = c + len;
    if (b.readInt32LE(c) !== 5) { out.push(null); continue; }
    const bbox = [b.readDoubleLE(c + 4), b.readDoubleLE(c + 12), b.readDoubleLE(c + 20), b.readDoubleLE(c + 28)];
    const np = b.readInt32LE(c + 36), npt = b.readInt32LE(c + 40), p0 = c + 44, q0 = p0 + np * 4;
    const parts = []; for (let i = 0; i < np; i++) parts.push(b.readInt32LE(p0 + i * 4));
    parts.push(npt);
    const rings = [];
    for (let i = 0; i < np; i++) { const r = []; for (let k = parts[i]; k < parts[i + 1]; k++) r.push([b.readDoubleLE(q0 + k * 16), b.readDoubleLE(q0 + k * 16 + 8)]); rings.push(r); }
    out.push({ bbox, rings });
  }
  return out;
}
export function bacaDbf(file) {
  const b = fs.readFileSync(file), n = b.readInt32LE(4), hl = b.readInt16LE(8), rl = b.readInt16LE(10), f = [];
  for (let o = 32; b[o] !== 0x0d; o += 32) f.push({ nama: b.toString('latin1', o, o + 11).replace(/\0.*$/, ''), len: b[o + 16] });
  const rows = [];
  for (let i = 0; i < n; i++) { let o = hl + i * rl + 1; const r = {}; for (const x of f) { r[x.nama] = b.toString('latin1', o, o + x.len).trim(); o += x.len; } rows.push(r); }
  return rows;
}
export function dalamCincin(x, y, ring) {
  let d = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
}
export const dalamPoligon = (x, y, rings) => { let d = false; for (const r of rings) if (dalamCincin(x, y, r)) d = !d; return d; };
/** Douglas-Peucker pada cincin tertutup. */
export function sederhana(ring, eps) {
  if (ring.length < 8) return ring;
  const jarak = (p, a, c) => { const dx = c[0] - a[0], dy = c[1] - a[1], l = dx * dx + dy * dy; if (!l) return Math.hypot(p[0] - a[0], p[1] - a[1]); const t = klem(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l, 0, 1); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  const jaga = new Uint8Array(ring.length); jaga[0] = jaga[ring.length - 1] = 1;
  const st = [[0, ring.length - 1]];
  while (st.length) {
    const [a, c] = st.pop(); let m = 0, mi = -1;
    for (let i = a + 1; i < c; i++) { const d = jarak(ring[i], ring[a], ring[c]); if (d > m) { m = d; mi = i; } }
    if (m > eps && mi > 0) { jaga[mi] = 1; st.push([a, mi], [mi, c]); }
  }
  const o = ring.filter((_, i) => jaga[i]);
  return o.length >= 4 ? o : ring;
}
const luasCincin = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2); };
const arahJam = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[i][0] - r[j][0]) * (r[i][1] + r[j][1]); return a > 0; };
export const bersihNama = (n) => n.replace(/hydroelectric (power )?plant|hydro(power)?( plant)?|power plant|\bPLT[AM]H?\b|\bdam\b/gi, '').replace(/\s+/g, ' ').trim() || n;
const q = (v) => Math.round(v * 1000) / 1000;

/* ---------- ambil data mentah ---------- */
async function unduh(url, tujuan) {
  if (fs.existsSync(tujuan) && !process.argv.includes('--segar')) return;
  fs.mkdirSync(path.dirname(tujuan), { recursive: true });
  const r = await fetch(url, { headers: { 'User-Agent': 'METI-Network-research/0.1' } });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  fs.writeFileSync(tujuan, Buffer.from(await r.arrayBuffer()));
}
async function siapkanHybas() {
  const dir = path.join(CACHE, 'hybas'); fs.mkdirSync(dir, { recursive: true });
  for (const w of ['as', 'au']) {
    const zip = path.join(dir, `hybas_${w}_lev07_v1c.zip`);
    await unduh(`https://data.hydrosheds.org/file/HydroBASINS/standard/hybas_${w}_lev07_v1c.zip`, zip);
    if (!fs.existsSync(path.join(dir, `hybas_${w}_lev07_v1c.shp`))) execFileSync('unzip', ['-o', '-q', zip, '-d', dir]);
  }
  return dir;
}
async function oni() {
  const f = path.join(CACHE, 'oni.txt'); await unduh('https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt', f);
  const m = {}; // tahun -> {JJA, JAS, ASO}
  for (const l of fs.readFileSync(f, 'utf8').split('\n').slice(1)) {
    const [s, y, , a] = l.trim().split(/\s+/); if (!y) continue;
    (m[+y] ||= {})[s] = +a;
  }
  const kemarau = (y) => { const v = m[y]; return v && v.JJA != null && v.JAS != null && v.ASO != null ? (v.JJA + v.JAS + v.ASO) / 3 : null; };
  return { m, kemarau };
}
async function hujanSel(lat, lon) {
  const f = path.join(CACHE, 'power', `${lat}_${lon}.json`);
  if (!fs.existsSync(f) || process.argv.includes('--segar')) {
    fs.mkdirSync(path.dirname(f), { recursive: true });
    const u = `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=PRECTOTCORR&community=AG&longitude=${lon}&latitude=${lat}&start=1991&end=2025&format=JSON`;
    for (let t = 0; t < 4; t++) {
      const r = await fetch(u); if (r.ok) { fs.writeFileSync(f, JSON.stringify((await r.json()).properties.parameter.PRECTOTCORR)); break; }
      await new Promise((s) => setTimeout(s, 1500 * (t + 1)));
      if (t === 3) return null;
    }
  }
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}
const HARI = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** Dari mm/hari bulanan: hujan kemarau (Jun-Okt) dan tahunan (mm) per tahun. */
export function hujanTahunan(p) {
  const out = {};
  for (let y = 1991; y <= 2025; y++) {
    let kem = 0, thn = 0, ok = true;
    for (let m = 1; m <= 12; m++) {
      const v = p[`${y}${String(m).padStart(2, '0')}`]; if (v == null || v < 0) { ok = false; break; }
      const mm = v * HARI[m - 1]; thn += mm; if (m >= 6 && m <= 10) kem += mm;
    }
    if (ok) out[y] = { kem, thn };
  }
  return out;
}
/** Lereng hujan kemarau (persen terhadap rerata) per +1 ONI kemarau. */
export function lerengEnso(ht, oniKem) {
  const ys = Object.keys(ht).map(Number).filter((y) => oniKem(y) != null);
  const mean = ys.reduce((a, y) => a + ht[y].kem, 0) / (ys.length || 1);
  if (ys.length < 20 || mean < 50) return null;
  // hapus tren linear tahun lebih dulu (seri reanalisis punya geseran), lalu regresikan sisanya terhadap ONI
  const tr = regresi(ys, ys.map((y) => ht[y].kem));
  const g = regresi(ys.map(oniKem), ys.map((y) => ((ht[y].kem - (tr.titik + tr.lereng * y)) / mean) * 100));
  return { lereng: g.lereng, r: g.r, n: ys.length };
}

/* ---------- Posko: potret kekeringan ---------- */
function bacaPosko() {
  const d = process.env.POSKO_DIR; if (!d) throw new Error('POSKO_DIR belum diisi (jalur repo poskokarhutla)');
  const j = (f) => JSON.parse(fs.readFileSync(path.join(d, 'public/data', f), 'utf8'));
  const g = j('kekeringan_grid.json'), h = j('kekeringan_hth.json'), m = j('kekeringan_meta.json');
  const ik = Object.fromEntries(g.kolom.map((k, i) => [k, i]));
  const sel = new Map();
  for (const r of g.grid) sel.set(`${r[0]},${r[1]}`, { spi3: r[ik.spi3], spi6: r[ik.spi6], tanah: r[ik.pct1] ?? r[ik.pct0], lat: r[0], lon: r[1] });
  for (const r of h.sel) { const s = sel.get(`${r[0]},${r[1]}`); if (s) s.hth = r[2]; }
  return { sel, tgl: m.hari_ini, enso: m.enso, hthTgl: h.hari, spiBulan: m.spi && m.spi.bulan };
}
const jarakKm = (a, b, c, d) => { const R = 6371, p = Math.PI / 180, x = (c - a) * p, y = (d - b) * p * Math.cos(((a + c) / 2) * p); return R * Math.hypot(x, y); };
function selTerdekat(sel, lat, lon, maks = 60) {
  let best = null, bd = Infinity;
  for (const s of sel.values()) { if (Math.abs(s.lat - lat) > 0.6 || Math.abs(s.lon - lon) > 0.6) continue; const d = jarakKm(lat, lon, s.lat, s.lon); if (d < bd) { bd = d; best = s; } }
  return best && bd <= maks ? best : null;
}
const tengah05 = (v) => Math.floor(v / 0.5) * 0.5 + 0.25;

/* ---------- bangun ---------- */
async function bangun() {
  const baca = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data', f), 'utf8'));
  const terpadu = baca('proyek_terpadu.json'), ember = baca('ember_bulanan.json'), gem = baca('gem_pembangkit.json'), topikH2 = baca('topik/hidrogen.json');
  let risiko = null; try { risiko = baca('risiko_proyek.json'); } catch { /* lapisan F2 belum ada */ }
  const risikoPer = new Map((risiko ? risiko.baris : []).map((r) => [r.id, r]));
  const posko = bacaPosko(), on = await oni();

  /* 1. pembangkit hidro unik */
  const kode2nama = {}; for (const r of terpadu.baris) if (r.prov_kode && r.prov) kode2nama[r.prov_kode] = r.prov;
  const geoProv = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/geo/provinsi.json'), 'utf8'));
  const provDari = (lat, lon) => { for (const f of geoProv.features) { const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; for (const p of polys) if (dalamPoligon(lon, lat, p)) return f.properties.kode; } return null; };
  const hid = terpadu.baris.filter((r) => r.tek === 'hidro' && r.status !== 'dibatalkan' && r.lat != null).sort((a, b) => (b.mw || 0) - (a.mw || 0));
  const unik = [];
  for (const r of hid) if (!unik.some((u) => duplikat(u, r))) unik.push(r);

  /* 2. DAS */
  const dir = await siapkanHybas();
  const bas = [];
  for (const w of ['as', 'au']) {
    const shp = bacaShp(path.join(dir, `hybas_${w}_lev07_v1c.shp`)), dbf = bacaDbf(path.join(dir, `hybas_${w}_lev07_v1c.dbf`));
    shp.forEach((s, i) => { if (s && s.bbox[2] > 94 && s.bbox[0] < 142 && s.bbox[3] > -11.5 && s.bbox[1] < 6.5) bas.push({ ...s, pfaf: dbf[i].PFAF_ID, km2: +dbf[i].SUB_AREA }); });
  }
  const cariDas = (lat, lon) => bas.find((b) => lon >= b.bbox[0] && lon <= b.bbox[2] && lat >= b.bbox[1] && lat <= b.bbox[3] && dalamPoligon(lon, lat, b.rings)) || null;

  /* 3. hujan POWER per sel 0,5 */
  const kunciSel = (r) => `${tengah05(r.lat)},${tengah05(r.lng)}`;
  const sels = [...new Set(unik.map(kunciSel))];
  const hujan = new Map();
  for (let i = 0; i < sels.length; i += 4) {
    await Promise.all(sels.slice(i, i + 4).map(async (k) => { const [la, lo] = k.split(',').map(Number); const p = await hujanSel(la, lo); if (p) hujan.set(k, hujanTahunan(p)); }));
  }
  const lerengSel = new Map([...hujan].map(([k, ht]) => [k, lerengEnso(ht, on.kemarau)]));

  /* 4. skor per pembangkit */
  const peMw = unik.reduce((m, r) => ((m[r.id] = r.mw), m), {});
  const pem = unik.map((r) => {
    const das = r.presisi === 'provinsi' ? null : cariDas(r.lat, r.lng);
    const jenis = jenisPlt(r.nama, r.mw), wd = cocokWaduk(r.nama);
    const sk = selTerdekat(posko.sel, r.lat, r.lng), ls = lerengSel.get(kunciSel(r)) || null;
    const pk = r.prov_kode || provDari(r.lat, r.lng);
    return { r, das, jenis, wd, sk, ls, pk };
  });
  const perDas = new Map();
  for (const p of pem) if (p.das) (perDas.get(p.das.pfaf) || perDas.set(p.das.pfaf, []).get(p.das.pfaf)).push(p);
  const out = pem.map(({ r, das, jenis, wd, sk, ls, pk }) => {
    const kawan = das ? perDas.get(das.pfaf) : [];
    const irig = kawan.some((k) => k.wd && (k.wd.f.includes('irigasi') || k.wd.f.includes('air-baku')));
    const komp = {
      enso: vEnso(ls && ls.lereng), spi: vSpi(sk && sk.spi3, sk && sk.spi6), hth: vHth(sk && sk.hth), tanah: vTanah(sk && sk.tanah),
      tampungan: vTampungan(jenis, wd), tekanan: das ? vTekanan(kawan.length, irig) : null,
    };
    const s = skor(komp), rk = risikoPer.get(r.id);
    return {
      id: r.id, nama: r.nama, jenis, mw: r.mw, status: r.status, prov: r.prov || kode2nama[pk] || null, prov_kode: pk, lat: q(r.lat), lng: q(r.lng), presisi: r.presisi,
      pemilik: r.pemilik && r.pemilik.nama ? { nama: r.pemilik.nama, org_id: r.pemilik.org_id || null, logo: r.pemilik.logo || null } : null,
      profil: /^pj_/.test(r.id), das: das ? 'd' + das.pfaf : null,
      waduk: wd ? { nama: wd.n, fungsi: wd.f, tampungan_juta_m3: wd.tj ?? null } : null,
      skor: s.skor, kelas: s.kelas, dikeluarkan: s.dikeluarkan,
      komponen: Object.fromEntries(Object.entries(komp).filter(([, v]) => v != null).map(([k, v]) => [k, Math.round(v)])),
      mentah: { spi3: sk && sk.spi3, spi6: sk && sk.spi6, hth: sk && sk.hth, tanah: sk && sk.tanah, enso_pct: ls ? r1(ls.lereng) : null, enso_r: ls ? Math.round(ls.r * 100) / 100 : null },
      bahaya: rk && rk.komponen && rk.komponen.bahaya ? rk.komponen.bahaya.v : null,
    };
  });

  /* 5. DAS */
  const dasOut = [], fitur = [];
  for (const [pfaf, ps] of perDas) {
    const items = out.filter((o) => o.das === 'd' + pfaf), b = ps[0].das;
    const w = items.map((o) => o.mw || 1), sw = w.reduce((a, c) => a + c, 0);
    const bm = (k) => { const a = items.map((o, i) => [o.komponen[k], w[i]]).filter(([v]) => v != null); const ws = a.reduce((x, [, y]) => x + y, 0); return ws ? Math.round(a.reduce((x, [v, y]) => x + (v * y) / ws, 0)) : null; };
    const komp = { enso: bm('enso'), spi: bm('spi'), hth: bm('hth'), tanah: bm('tanah'), tampungan: bm('tampungan'), tekanan: bm('tekanan') };
    const s = skor(komp);
    const provN = {}; for (const o of items) if (o.prov) provN[o.prov] = (provN[o.prov] || 0) + (o.mw || 1);
    const prov = Object.entries(provN).sort((a, c) => c[1] - a[1])[0];
    const besar = items.slice().sort((a, c) => (c.mw || 0) - (a.mw || 0))[0];
    const mw = items.reduce((a, o) => a + (o.mw || 0), 0), mwOp = items.filter((o) => o.status === 'beroperasi').reduce((a, o) => a + (o.mw || 0), 0);
    const d = { id: 'd' + pfaf, pfaf, nama: `Sub-DAS ${bersihNama(besar.nama)}`, acuan: besar.nama, prov: prov ? prov[0] : null, prov_kode: (items.find((o) => o.prov === (prov && prov[0])) || {}).prov_kode || null, km2: Math.round(b.km2), n: items.length, mw: Math.round(mw), mw_op: Math.round(mwOp), skor: s.skor, kelas: s.kelas, komponen: Object.fromEntries(Object.entries(komp).filter(([, v]) => v != null)), serbaguna: items.filter((o) => o.waduk).map((o) => o.waduk.nama).filter((v, i, a) => a.indexOf(v) === i), lat: q(besar.lat), lng: q(besar.lng) };
    dasOut.push(d);
    // shapefile: cincin luar searah jarum jam; lubang (jarang di HydroBASINS) dibuang; tiap cincin luar = satu poligon
    const polys = b.rings.filter((rg) => arahJam(rg) && luasCincin(rg) > 1e-4).map((rg) => [sederhana(rg, 0.004).map(([x, y]) => [q(x), q(y)])]);
    fitur.push({ type: 'Feature', properties: { id: d.id, nama: d.nama, k: d.kelas, skor: d.skor, mw: d.mw, n: d.n }, geometry: { type: 'MultiPolygon', coordinates: polys } });
  }
  dasOut.sort((a, c) => (c.skor ?? -1) - (a.skor ?? -1) || c.mw - a.mw);

  /* 6. tren nasional: CF hidro (Ember) vs ONI kemarau vs hujan di sel hidro */
  const hy = ember.baris.filter((x) => x.sumber_listrik === 'Hydro');
  const tahun = hy.map((x) => x.tahun);
  const cf = hy.map((x) => (x.kapasitas_gw ? r1((x.generasi_twh / (x.kapasitas_gw * 8.76)) * 100) : null));
  const hujanIdx = tahun.map((y) => {
    let a = 0, ws = 0;
    for (const o of out) { const ht = hujan.get(kunciSel({ lat: o.lat, lng: o.lng })); if (!ht || !ht[y]) continue; const base = Object.entries(ht).filter(([yy]) => +yy >= 2015 && +yy <= 2025).map(([, v]) => v.thn); const bm = base.reduce((x, c) => x + c, 0) / base.length; const wt = o.mw || 1; a += (((ht[y].thn - bm) / bm) * 100) * wt; ws += wt; }
    return ws ? r1(a / ws) : null;
  });
  const oniK = tahun.map((y) => { const v = on.kemarau(y); return v == null ? null : Math.round(v * 100) / 100; });
  const idx = tahun.map((_, i) => i).filter((i) => cf[i] != null && oniK[i] != null);
  const reg = regresi(idx.map((i) => oniK[i]), idx.map((i) => cf[i]));
  const kini = on.m[2026] ? Object.entries(on.m[2026]).sort((a, c) => ['DJF', 'JFM', 'FMA', 'MAM', 'AMJ', 'MJJ', 'JJA', 'JAS', 'ASO', 'SON', 'OND', 'NDJ'].indexOf(c[0]) - ['DJF', 'JFM', 'FMA', 'MAM', 'AMJ', 'MJJ', 'JJA', 'JAS', 'ASO', 'SON', 'OND', 'NDJ'].indexOf(a[0]))[0] : null;
  const gwTotal = hy[hy.length - 2] ? hy.filter((x) => x.kapasitas_gw).slice(-1)[0] : null;
  const mwNas = gwTotal ? gwTotal.kapasitas_gw * 1000 : 0;
  const oniNow = posko.enso && posko.enso.oni != null ? posko.enso.oni : kini ? kini[1] : null;
  const dCF = oniNow == null ? null : reg.lereng * oniNow;
  const elnino = { oni_sekarang: oniNow, musim: posko.enso ? posko.enso.musim + ' ' + posko.enso.tahun : null, status: posko.enso ? posko.enso.status : null, lereng_cf_per_oni: r1(reg.lereng * 100) / 100, r: Math.round(reg.r * 100) / 100, n: reg.n, tahun_el_nino: tahun.filter((_, i) => oniK[i] != null && oniK[i] >= 0.5), delta_cf_poin: dCF == null ? null : r1(dCF), mw_nasional: Math.round(mwNas), delta_gwh: dCF == null ? null : Math.round((mwNas * 8.76 * dCF) / 100), label: 'est' };

  /* 7. kebutuhan air pembangkit lain */
  const mwTek = (tek, st) => Math.round(terpadu.baris.filter((r) => r.tek === tek && st.includes(r.status)).reduce((a, r) => a + (r.mw || 0), 0));
  const mwBatu = Math.round(gem.baris.filter((r) => r.tracker === 'coal' && r.status === 'operating').reduce((a, r) => a + (r.kapasitas_mw || 0), 0));
  const h2 = (topikH2.kunci || []).find((k) => /hidrogen hijau/i.test(k.label.id) && k.nilai);
  const h2Ton = h2 ? h2.nilai : null;
  const air = KOEF.map((k) => {
    const mwO = k.id === 'pltu' ? mwBatu : mwTek(k.tek, ['beroperasi']), mwR = k.id === 'pltu' ? null : mwTek(k.tek, ['konstruksi', 'izin']);
    return { id: k.id, tek: k.tek, koef_m3_mwh: k.m3_mwh, rentang: k.rentang, fk: k.fk, label: k.label, rumus: k.rumus, mw_op: mwO, mw_rencana: mwR, juta_m3_op: r1(airTahun(mwO, k.fk, k.m3_mwh) * 10) / 10, juta_m3_rentang: k.rentang.map((c) => r1(airTahun(mwO, k.fk, c) * 100) / 100), gwh_op: Math.round(mwO * 8.76 * k.fk) };
  });
  const h2Out = { ...H2, ton_per_tahun: h2Ton, juta_m3: h2Ton == null ? null : Math.round(((h2Ton * 1000 * H2.praktis_l_kg) / 1000 / 1e6) * 10000) / 10000, per_100kt_juta_m3: (100000 * 1000 * H2.praktis_l_kg) / 1000 / 1e6 };

  const tinggi = (o) => o.skor != null && o.skor >= RAWAN;
  const aktif = out.filter((o) => o.status !== 'dibatalkan');
  const ringkas = {
    mw_hidro: Math.round(aktif.reduce((a, o) => a + (o.mw || 0), 0)), n_hidro: aktif.length, mw_op: Math.round(aktif.filter((o) => o.status === 'beroperasi').reduce((a, o) => a + (o.mw || 0), 0)),
    das_terpetakan: dasOut.length, pembangkit_terpetakan: aktif.filter((o) => o.das).length, mw_rawan: Math.round(dasOut.filter((d) => d.skor >= RAWAN).reduce((a, d) => a + d.mw, 0)), das_rawan: dasOut.filter((d) => d.skor >= RAWAN).length,
    mw_pembangkit_rawan: Math.round(aktif.filter(tinggi).reduce((a, o) => a + (o.mw || 0), 0)),
    air_ebt_juta_m3: r1(air.filter((a) => a.id !== 'pltu').reduce((s, a) => s + a.juta_m3_op, 0) + (h2Out.juta_m3 || 0)),
  };

  const sumber = [
    { id: 'hybas', judul: 'HydroBASINS v1c, level 07 (Asia, Australasia)', penerbit: 'Lehner & Grill 2013, WWF HydroSHEDS', lisensi: 'HydroSHEDS (bebas pakai, atribusi)', url: 'https://www.hydrosheds.org/products/hydrobasins' },
    { id: 'power', judul: 'NASA POWER, curah hujan bulanan PRECTOTCORR 1991-2025, sel 0,5 derajat', penerbit: 'NASA LaRC POWER', lisensi: 'domain publik NASA', url: 'https://power.larc.nasa.gov/' },
    { id: 'oni', judul: 'Oceanic Nino Index (ONI)', penerbit: 'NOAA Climate Prediction Center', lisensi: 'domain publik NOAA', url: 'https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt' },
    { id: 'ember', judul: 'Ember Yearly Electricity Data, hidro Indonesia (lewat ember_bulanan.json)', penerbit: 'Ember', lisensi: 'CC BY 4.0', url: 'https://ember-energy.org/data/yearly-electricity-data/' },
    { id: 'posko', judul: `Potret kekeringan Centurisk97 Posko Karhutla (SPI-3 ${posko.spiBulan || ''}, HTH ${posko.hthTgl}, persentil kelembapan tanah), sel 0,5 derajat`, penerbit: 'Posko Karhutla (hulu: NASA POWER domain publik; Open-Meteo CC BY 4.0, API gratis non-komersial; ERA5-Land Copernicus, atribusi)', lisensi: 'turunan data terbuka; hanya nilai per sel yang disalin', url: 'https://open-meteo.com/' },
    { id: 'macknick', judul: 'Operational Water Consumption and Withdrawal Factors for Electricity Generating Technologies (NREL/TP-6A20-50900)', penerbit: 'Macknick dkk. 2012, NREL', lisensi: 'laporan publik pemerintah AS', url: 'https://www.nrel.gov/docs/fy11osti/50900.pdf' },
    { id: 'proyek', judul: 'Pelacak proyek METI (proyek_terpadu.json): RUPTL, Global Energy Monitor (CC BY 4.0), Wikipedia', penerbit: 'METI', lisensi: 'sesuai tiap sumber', url: '/proyek#terpadu' },
  ];
  const metode = 'Tiap pembangkit hidro ditempatkan pada sub-DAS HydroBASINS level 07 lewat titik koordinatnya (pembangkit berpresisi provinsi tidak dipetakan ke DAS). Skor kerentanan air 0-100 = rerata berbobot enam komponen: kepekaan hujan kemarau terhadap El Nino setempat (lereng regresi hujan Jun-Okt terhadap ONI 1991-2025 setelah tren dibuang, bobot 25), kekeringan kini (SPI-3 dan SPI-6, 20), hari tanpa hujan (10), kelembapan tanah rendah (10), ketiadaan tampungan (run-of-river tertinggi, waduk besar terendah, 25), dan tekanan pemakai lain di DAS (jumlah pembangkit dan waduk irigasi atau air baku, 10). Komponen tanpa data dikeluarkan dan bobot dinormalkan ulang. Skor DAS = rerata skor komponen pembangkit di dalamnya berbobot MW. Rawan kering = skor 45 atau lebih. Bobot dan ambang adalah Hipotesis, tidak dikalibrasi terhadap kejadian.';
  return {
    lapis: 'publik', dibangun_pada: hari(),
    meta: { metode, bobot: BOBOT, ambang: AMBANG, rawan: RAWAN, label: 'hipotesis', snapshot_posko: posko.tgl, sumber, tak_dinilai: unik.filter((r) => r.presisi === 'provinsi').length, rujukan_bahaya: risiko ? 'risiko_proyek.json' : null,
      celah: ['Debit sungai dan sedimentasi waduk tidak ada di berkas ini: tidak ada seri debit terbuka per pembangkit; catatan sedimen hanya untuk enam waduk Jawa dari Posko waduk.csv.', 'Fungsi serbaguna waduk dari sumber sekunder (PUPR, PLN, Wikipedia), bukan data operasi.', 'Lapisan risiko banjir dan longsor per proyek belum tersedia; kolom bahaya terisi bila public/data/risiko_proyek.json terbit.', 'Koefisien air PLTP bersifat Hipotesis (kisaran kasar), butuh data tiap lapangan.'] },
    ringkas, pembangkit: out, das: dasOut, waduk_catatan: [
      { nama: 'Gajah Mungkur (Wonogiri)', catatan: 'tampungan efektif turun dari 433 (1983) menjadi 375 juta m3 (2005) karena sedimen', sumber: 'JICA via Posko waduk.csv', label: 'sekunder' },
      { nama: 'Sutami (Karangkates)', catatan: 'tampungan 178 juta m3 (echosounding 2019), tersisa 51,94 persen dari desain 343', sumber: 'SNTI UGM via Posko waduk.csv', label: 'sekunder' }],
    tren: { tahun, cf_persen: cf, gen_twh: hy.map((x) => x.generasi_twh), kapasitas_gw: hy.map((x) => x.kapasitas_gw), hujan_idx_persen: hujanIdx, oni_kemarau: oniK, regresi: { lereng: r1(reg.lereng * 100) / 100, titik: r1(reg.titik), r: Math.round(reg.r * 100) / 100, n: reg.n } },
    elnino, air: { baris: air, h2: h2Out },
    _geo: { type: 'FeatureCollection', features: fitur },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const d = await bangun();
  const geo = d._geo; delete d._geo;
  fs.mkdirSync(path.join(ROOT, 'public/data/geo'), { recursive: true });
  const gs = JSON.stringify(geo);
  if (gs.length > 4 * 1024 * 1024) throw new Error('das_hidro.geojson > 4 MB: naikkan toleransi');
  fs.writeFileSync(path.join(ROOT, 'public/data/geo/das_hidro.geojson'), gs + '\n');
  fs.writeFileSync(path.join(ROOT, 'public/data/air_energi.json'), JSON.stringify(d) + '\n');
  console.log('air_energi.json', JSON.stringify(d.ringkas), 'geo', (gs.length / 1024).toFixed(0), 'KB', 'regresi', JSON.stringify(d.tren.regresi));
}
