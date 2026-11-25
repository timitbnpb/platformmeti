// Panen BIG (geoservices.big.go.id, ArcGIS REST, RBI 1:25.000 utilitas) untuk kembaran jaringan (KJ-14).
//   node scripts/panen/big_satupeta.mjs <dirMentah>   (satu GeoJSON per layanan+lapis; lanjut bila diulang)
// robots.txt: 404 (tak ada larangan) saat dicek 24 Nov 2026. Jeda >= 2 dtk, UA proyek. geoportal.esdm.go.id TIDAK dipanen (robots: Disallow /).
// Skema BIG: FCODE/REMARK (kode KUGI), NAMOBJ, UPDATED (yyyymmdd). TIDAK ada MVA, tegangan, atau tahun operasi.
// Kode dipakai: HB002* gardu listrik, HB004* pembangkit (PLTx), HD014* jaringan listrik (garis); HB008* kantor PLN ikut diambil.
import fs from 'node:fs';
import path from 'node:path';
import { UA } from '../pipa/data_transmisi.mjs';

const dir = process.argv[2];
if (!dir) { console.log('pakai: node scripts/panen/big_satupeta.mjs <dirMentah>'); process.exit(1); }
const B = 'https://geoservices.big.go.id/rbi/rest/services';
const KODE = "REMARK LIKE 'HB002%' OR REMARK LIKE 'HB004%' OR REMARK LIKE 'HB008%' OR REMARK LIKE 'HD014%'";
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, params = {}) {
  for (let k = 0; k < 3; k++) {
    await tidur(2200);
    const r = await fetch(url + '?' + new URLSearchParams({ f: 'json', ...params }), { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(90000) }).catch((e) => ({ ok: false, status: String(e) }));
    if (r.status === 403) { console.log('403 -> berhenti'); process.exit(2); }
    if (r.ok) { const j = await r.json(); if (!j.error) return j; console.log('galat', url, JSON.stringify(j.error).slice(0, 120)); return null; }
    console.log('gagal', url, r.status); await tidur(r.status === 429 ? 60000 : 10000);
  }
  return null;
}
fs.mkdirSync(dir, { recursive: true });
const folder = 'TRANSPORTASIDANUTILITAS';
const daftar = (await get(`${B}/${folder}`)).services.filter((s) => s.type === 'MapServer');
for (const s of daftar) {
  const info = await get(`${B}/${s.name}/MapServer`); if (!info) continue;
  for (const l of info.layers || []) {
    const f = path.join(dir, `${s.name.split('/')[1]}__${l.id}.geojson`); if (fs.existsSync(f)) continue;
    const meta = await get(`${B}/${s.name}/MapServer/${l.id}`);
    if (!meta || !/Point|Polyline/.test(meta.geometryType) || !meta.fields.some((x) => x.name === 'REMARK')) continue;
    const feats = [];
    for (let off = 0; ; off += 1000) {
      const j = await get(`${B}/${s.name}/MapServer/${l.id}/query`, { where: KODE, outFields: '*', outSR: '4326', resultOffset: off, resultRecordCount: 1000, f: 'geojson' });
      if (!j) { console.log('lewati', s.name, l.id); break; }
      feats.push(...j.features); if (!j.exceededTransferLimit) break;
    }
    if (feats.length) fs.writeFileSync(f, JSON.stringify({ type: 'FeatureCollection', layanan: s.name, lapis: l.name, diambil: new Date().toISOString(), features: feats }));
    console.log(s.name, l.name, feats.length);
  }
}
console.log('selesai');
