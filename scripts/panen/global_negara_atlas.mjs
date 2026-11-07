// Potensi per kabupaten/kota: Global Solar Atlas (PVOUT dst, API lta resmi) dan Global Wind Atlas (kecepatan angin 100 m, GeoTIFF negara resmi).
// Titik = pusat kabupaten (data/geo/pusat-wilayah.json), BUKAN rata-rata luas kabupaten; kode BPS dari radar_kabupaten.json.
//   node scripts/panen/global_negara_atlas.mjs ambil <dirCache>             (jaringan: api.globalsolaratlas.info, jeda >= 2 dtk, stop 403/429)
//   node scripts/panen/global_negara_atlas.mjs bangun <dirCache> <tgl>      (tanpa jaringan; angin dari <dirCache>/gwa/IDN_wind-speed_100m.tif bila ada)
//   node scripts/panen/global_negara_atlas.mjs --selftest
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Penambang, ROOT } from '../pipa/global_pemasok.mjs';

const nk = (s) => String(s || '').toLowerCase().replace(/^(kabupaten|kota)\s+/, '').replace(/[^a-z0-9]/g, '');
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));

/** Cocokkan kode BPS (radar_kabupaten) ke pusat kabupaten (pusat-wilayah adm2): nama baku + jenis; provinsi memutus seri bila ada. */
export function cocokKabupaten(radar, wilayah, adm2) {
  const prov = new Map(wilayah.map((p) => [p.kode, p.nama]));
  const idx = new Map();
  for (const x of adm2) { const k = nk(x.asli) + '|' + (x.tipe === 'kota' ? 'kota' : 'kab'); (idx.get(k) || idx.set(k, []).get(k)).push(x); }
  const hasil = []; const tak = [];
  for (const b of radar) {
    const c = idx.get(nk(b.nama) + '|' + (b.jenis === 'kota' ? 'kota' : 'kab')) || [];
    const p = nk(prov.get(b.prov));
    const sama = c.filter((x) => nk(x.provinsi) === p);
    const pil = sama.length === 1 ? sama[0] : (c.length === 1 ? c[0] : (c.filter((x) => !x.provinsi).length === 1 && !sama.length ? c.find((x) => !x.provinsi) : null));
    if (pil) hasil.push({ kode: b.kode, nama: b.nama, jenis: b.jenis, kode_provinsi: b.prov, provinsi: prov.get(b.prov) || null, lat: pil.lat, lng: pil.lng });
    else tak.push(b.kode + ' ' + b.nama);
  }
  return { hasil, tak };
}

// ---- GeoTIFF BigTIFF + ZSTD + prediktor 3 (float32), tanpa pustaka ----
export function bukaTif(berkas) {
  const fd = fs.openSync(berkas, 'r'); const baca = (o, n) => { const b = Buffer.alloc(n); fs.readSync(fd, b, 0, n, o); return b; };
  const h = baca(0, 16); if (h.toString('latin1', 0, 2) !== 'II' || h.readUInt16LE(2) !== 43) throw new Error('bukan BigTIFF little-endian');
  let off = Number(h.readBigUInt64LE(8)); const n = Number(baca(off, 8).readBigUInt64LE(0)); const ent = baca(off + 8, n * 20); const tag = {};
  const UK = { 3: 2, 4: 4, 12: 8, 16: 8 };
  for (let i = 0; i < n; i++) {
    const e = ent.subarray(i * 20, i * 20 + 20); const id = e.readUInt16LE(0), typ = e.readUInt16LE(2), cnt = Number(e.readBigUInt64LE(4)); const tot = (UK[typ] || 1) * cnt;
    const raw = tot <= 8 ? e.subarray(12, 12 + tot) : baca(Number(e.readBigUInt64LE(12)), tot); const v = [];
    for (let k = 0; k < cnt; k++) v.push(typ === 3 ? raw.readUInt16LE(k * 2) : typ === 4 ? raw.readUInt32LE(k * 4) : typ === 12 ? raw.readDoubleLE(k * 8) : typ === 16 ? Number(raw.readBigUInt64LE(k * 8)) : raw[k]);
    tag[id] = v;
  }
  const t = { fd, baca, W: tag[256][0], H: tag[257][0], bits: tag[258][0], komp: tag[259][0], pred: tag[317]?.[0] ?? 1, tw: tag[322][0], th: tag[323][0], off: tag[324], len: tag[325], skala: tag[33550], ikat: tag[33922], cache: new Map() };
  if (t.komp !== 50000 || t.bits !== 32 || t.pred !== 3) throw new Error(`tak didukung: komp ${t.komp} bits ${t.bits} pred ${t.pred}`);
  t.tx = Math.ceil(t.W / t.tw); return t;
}
export function ubinTif(t, i) {
  if (t.cache.has(i)) return t.cache.get(i);
  const d = zlib.zstdDecompressSync(t.baca(t.off[i], t.len[i])); const w = t.tw, out = Buffer.alloc(w * t.th * 4);
  for (let r = 0; r < t.th; r++) {
    const row = Buffer.from(d.subarray(r * w * 4, (r + 1) * w * 4));
    for (let k = 1; k < row.length; k++) row[k] = (row[k] + row[k - 1]) & 255; // prediktor 3: akumulasi byte
    for (let x = 0; x < w; x++) for (let b = 0; b < 4; b++) out[(r * w + x) * 4 + (3 - b)] = row[b * w + x]; // MSB-dulu -> LE
  }
  if (t.cache.size > 24) t.cache.delete(t.cache.keys().next().value); t.cache.set(i, out); return out;
}
export function pikselTif(t, lng, lat) { // -> float atau NaN
  const x = Math.floor((lng - t.ikat[3]) / t.skala[0]), y = Math.floor((t.ikat[4] - lat) / t.skala[1]);
  if (x < 0 || y < 0 || x >= t.W || y >= t.H) return NaN;
  const buf = ubinTif(t, Math.floor(y / t.th) * t.tx + Math.floor(x / t.tw)); return buf.readFloatLE(((y % t.th) * t.tw + (x % t.tw)) * 4);
}
/** Rata-rata jendela (2r+1)^2 piksel (~278 m/piksel) di sekitar titik; hanya piksel sahih (> 0). */
export function angin100(t, lng, lat, r = 2) {
  const v = []; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const p = pikselTif(t, lng + dx * t.skala[0], lat + dy * t.skala[1]); if (Number.isFinite(p) && p > 0 && p < 40) v.push(p); }
  return v.length ? { ms: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100, piksel: v.length, maks: Math.round(Math.max(...v) * 100) / 100 } : null;
}

export const LTA = (lat, lng) => `https://api.globalsolaratlas.info/data/lta?loc=${lat},${lng}`;
export function urai(j) { const a = j?.annual?.data; if (!a || a.PVOUT_csi == null) return null; const r = (v, n = 0) => (v == null ? null : Math.round(v * 10 ** n) / 10 ** n); return { pvout_kwh_per_kwp_tahun: r(a.PVOUT_csi), ghi_kwh_per_m2_tahun: r(a.GHI), dni_kwh_per_m2_tahun: r(a.DNI), gti_optimal_kwh_per_m2_tahun: r(a.GTI_opta), sudut_optimal_derajat: r(a.OPTA), suhu_udara_c: r(a.TEMP, 1), elevasi_m: r(a.ELE) }; }

export function muatKab() {
  const { hasil, tak } = cocokKabupaten(J('public/data/radar_kabupaten.json').baris, J('public/data/wilayah.json').baris, J('data/geo/pusat-wilayah.json').adm2); return { kab: hasil, tak };
}
export function bangun({ kab, tak }, gsa, tif, tgl) {
  const baris = kab.map((k) => {
    const s = gsa[k.kode] ? urai(gsa[k.kode]) : null; const w = tif ? angin100(tif, k.lng, k.lat) : null;
    return { kode: k.kode, nama: k.nama, jenis: k.jenis, kode_provinsi: k.kode_provinsi, provinsi: k.provinsi, titik: { lat: k.lat, lng: k.lng, keterangan: 'pusat kabupaten/kota (pusat-wilayah.json), BUKAN rata-rata luas' },
      surya: s ? { ...s, sumber_id: 'global-solar-atlas', url: `https://globalsolaratlas.info/map?c=${k.lat},${k.lng},10&s=${k.lat},${k.lng}`, tingkat_bukti: 'via-pihak-ketiga' } : null,
      angin: w ? { kecepatan_100m_ms: w.ms, maks_jendela_ms: w.maks, piksel_sahih: w.piksel, jendela: '5x5 piksel (~1,4 km)', sumber_id: 'global-wind-atlas', tingkat_bukti: 'via-pihak-ketiga' } : null };
  });
  return {
    lapis: 'publik', dibangun_pada: tgl, jumlah: baris.length,
    meta: { diperbarui: tgl, surya_terisi: baris.filter((b) => b.surya).length, angin_terisi: baris.filter((b) => b.angin).length, tanpa_pusat: tak,
      ukuran: 'satu titik per kabupaten/kota (pusat wilayah); angin = rata-rata jendela 5x5 piksel ~278 m. Indikasi relatif, bukan rata-rata luas dan bukan studi kelayakan.',
      kunci_tautan: ['kode (BPS kabupaten/kota, 4 digit) = radar_kabupaten.json baris.kode', 'kode_provinsi = wilayah.json baris.kode'],
      celah: ['Poligon kabupaten BPS tidak ada di repo: statistik zonal (rata-rata luas) tidak dihitung; titik pusat dapat jatuh di laut atau di dataran berbeda dari lokasi PLTS/PLTB nyata.', 'Pusat kabupaten yang tak cocok dengan kode BPS dikeluarkan (lihat tanpa_pusat).'] },
    sumber: [
      { id: 'global-solar-atlas', judul: 'Global Solar Atlas 2.0, data jangka panjang (api.globalsolaratlas.info/data/lta), versi data 1.7, model Solargis 2.2.68', penerbit: 'World Bank Group / ESMAP, data Solargis', tahun: 2026, url: 'https://globalsolaratlas.info/', lisensi: 'CC BY 4.0', tanggal: tgl },
      { id: 'global-wind-atlas', judul: 'Global Wind Atlas v4, kecepatan angin rata-rata 100 m, GeoTIFF negara IDN (unduhan resmi globalwindatlas.info/api/gis/country/IDN/wind-speed/100)', penerbit: 'Technical University of Denmark (DTU) / World Bank Group', tahun: 2025, url: 'https://globalwindatlas.info/en/download/gis-files', lisensi: 'CC BY 4.0', tanggal: tgl }],
    baris,
  };
}

async function utama() {
  const [aksi, dir, tgl] = process.argv.slice(2); if (!dir) throw new Error('pakai: ambil|bangun <dirCache> [tgl]');
  fs.mkdirSync(dir, { recursive: true }); const cf = path.join(dir, 'gsa_kab.json'); const gsa = fs.existsSync(cf) ? JSON.parse(fs.readFileSync(cf, 'utf8')) : {};
  const m = muatKab();
  if (aksi === 'ambil') {
    const p = new Penambang({ jedaMs: 2100 }); let n = 0;
    for (const k of m.kab) {
      if (gsa[k.kode]) continue; const r = await p.ambil(LTA(k.lat, k.lng), { cekRobots: false });
      if (!r.ok) { console.error('berhenti', k.kode, r.alasan); if (/blokir/.test(r.alasan)) break; continue; }
      gsa[k.kode] = JSON.parse(r.buf.toString('utf8')); if (++n % 25 === 0) fs.writeFileSync(cf, JSON.stringify(gsa));
    }
    fs.writeFileSync(cf, JSON.stringify(gsa)); console.log('GSA', Object.keys(gsa).length, '/', m.kab.length);
  } else if (aksi === 'bangun') {
    if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) throw new Error('tanggal wajib');
    const tf = path.join(dir, 'gwa/IDN_wind-speed_100m.tif'); const tif = fs.existsSync(tf) ? bukaTif(tf) : null;
    const slim = Object.fromEntries(Object.entries(gsa).map(([k, v]) => [k, { annual: { data: v.annual?.data } }]));
    const o = bangun(m, slim, tif, tgl); fs.writeFileSync(path.join(ROOT, 'public/data/global/potensi_atlas.json'), JSON.stringify(o) + '\n');
    console.log(o.jumlah, 'kab; surya', o.meta.surya_terisi, 'angin', o.meta.angin_terisi, 'tanpa pusat', m.tak.length);
  }
}
if (process.argv[2] === '--selftest') {
  assert.equal(nk('Kabupaten Lima Puluh Kota'), 'limapuluhkota');
  const c = cocokKabupaten([{ kode: '1101', nama: 'Kabupaten A', jenis: 'kab', prov: '11' }, { kode: '1171', nama: 'Kota A', jenis: 'kota', prov: '11' }, { kode: '9999', nama: 'Kabupaten Z', jenis: 'kab', prov: '11' }], [{ kode: '11', nama: 'Aceh' }], [{ asli: 'A', tipe: 'kabupaten', provinsi: 'Aceh', lat: 1, lng: 2 }, { asli: 'Kota A', tipe: 'kota', provinsi: null, lat: 3, lng: 4 }]);
  assert.deepEqual(c.hasil.map((x) => x.kode), ['1101', '1171']); assert.deepEqual(c.tak, ['9999 Kabupaten Z']);
  assert.equal(urai({ annual: { data: { PVOUT_csi: 1404.56, GHI: 1733.7, TEMP: 22.81 } } }).pvout_kwh_per_kwp_tahun, 1405); assert.equal(urai({}), null);
  console.log('selftest ok');
} else if (process.argv[1] === fileURLToPath(import.meta.url)) await utama();
