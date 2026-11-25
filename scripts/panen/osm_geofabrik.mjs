// Kembaran jaringan (KJ-01): saring ekstrak OSM Geofabrik (.osm.pbf, ODbL) jadi mentah berformat Overpass
// yang dibaca scripts/pipa/graf_jaringan.mjs. Pengganti panen Overpass per ubin yang lambat (502/504).
//   node scripts/panen/osm_geofabrik.mjs <berkas.osm.pbf> <dirKeluarJaringan> <dirKeluarPembangkit> [<dirKeluarKonstruksi>]
// Ekstrak diunduh manual sekali (izin pemilik 24 Nov 2026) dari https://download.geofabrik.de/asia/indonesia/ (ODbL, diperbarui harian) dengan curl biasa; skrip ini tidak mengunduh apa pun.
// Butuh ogr2ogr (GDAL >= 3, driver OSM). Keluaran: <dirJaringan>/u_-11_94_7_141.5.json (satu ubin seluruh Indonesia) (power=line|cable >= 66 kV,
// substation >= 66 kV) dan <dirPembangkit>/u_geofabrik.json (power=plant|generator semua bahan bakar).
// Bila dirKonstruksi diberikan: <dirKonstruksi>/u_geofabrik.json berisi fitur dalam pembangunan (power=construction + construction=line|cable|substation,
// construction:power=line|cable|substation, atau line=construction; tegangan < 66 kV dibuang, tanpa tegangan tetap masuk). Dibaca opsional oleh graf_jaringan.mjs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tegMax } from '../pipa/data_transmisi.mjs';

const KUNCI = ['name', 'power', 'voltage', 'circuits', 'cables', 'operator', 'frequency', 'line', 'location', 'substation',
  'plant:source', 'plant:output:electricity', 'plant:method', 'generator:source', 'generator:output:electricity', 'start_date', 'ref', 'construction', 'construction:power'];
const INI = `[general]
closed_ways_are_polygons=aeroway,amenity,boundary,building,craft,geological,historic,landuse,leisure,military,natural,office,place,shop,sport,tourism,highway=platform,public_transport=platform,power=substation,power=plant
report_all_nodes=no
report_all_ways=no
attribute_name_laundering=no
[points]
osm_id=yes
attributes=${KUNCI.join(',')}
other_tags=no
[lines]
osm_id=yes
attributes=${KUNCI.join(',')}
other_tags=no
[multipolygons]
osm_id=yes
osm_way_id=yes
attributes=${KUNCI.join(',')}
other_tags=no
[multilinestrings]
osm_id=yes
attributes=name
other_tags=no
[other_relations]
osm_id=yes
attributes=name
other_tags=no
`;

const bulat = (x) => Math.round(x * 1e6) / 1e6;
const tags = (p) => Object.fromEntries(KUNCI.filter((k) => p[k] != null && p[k] !== '').map((k) => [k, String(p[k])]));
function cincinLuar(g) {
  if (g.type === 'Polygon') return g.coordinates[0];
  if (g.type === 'MultiPolygon') return g.coordinates.reduce((a, p) => (p[0].length > a.length ? p[0] : a), []);
  return null;
}

/** Fitur GeoJSON (dari ogr2ogr) -> elemen gaya Overpass. Fungsi murni, diuji. */
export function keElemen(f) {
  const p = f.properties || {}, g = f.geometry; if (!g) return null;
  const t = tags(p);
  if (g.type === 'Point') return { type: 'node', id: Number(p.osm_id), lat: bulat(g.coordinates[1]), lon: bulat(g.coordinates[0]), tags: t };
  if (g.type === 'LineString') return { type: 'way', id: Number(p.osm_id), tags: t, geometry: g.coordinates.map(([x, y]) => ({ lat: bulat(y), lon: bulat(x) })) };
  const r = cincinLuar(g); if (!r?.length) return null;
  const id = p.osm_way_id ? Number(p.osm_way_id) : Number(p.osm_id);
  return { type: p.osm_way_id ? 'way' : 'relation', id, tags: t, geometry: r.map(([x, y]) => ({ lat: bulat(y), lon: bulat(x) })) };
}
export const masukJaringan = (e) => {
  const pw = e?.tags?.power; if (!pw) return false;
  if (pw === 'line' || pw === 'cable') return e.type === 'way' && tegMax(e.tags.voltage) >= 66000;
  if (pw === 'substation') return tegMax(e.tags.voltage) >= 66000;
  return false;
};
const JENIS_K = new Set(['line', 'cable', 'substation']);
/** Jenis fitur konstruksi ('line'|'cable'|'substation') atau null. Tegangan tercatat < 66 kV dibuang. */
export const jenisKonstruksi = (e) => {
  const t = e?.tags || {}; let j = null;
  if (t.power === 'construction' && JENIS_K.has(t.construction)) j = t.construction;
  else if (JENIS_K.has(t['construction:power'])) j = t['construction:power'];
  else if (t.line === 'construction' && (t.power == null || t.power === 'line' || t.power === 'cable')) j = t.power === 'cable' ? 'cable' : 'line';
  if (!j || (j !== 'substation' && e.type !== 'way')) return null;
  if (t.voltage && tegMax(t.voltage) < 66000) return null;
  return j;
};
export const masukKonstruksi = (e) => jenisKonstruksi(e) != null;
export const masukPembangkit = (e) => e?.tags?.power === 'plant' || e?.tags?.power === 'generator';

function jalankan(pbf, dirJ, dirP, dirK) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kj-gf-'));
  const ini = path.join(tmp, 'osmconf.ini'); fs.writeFileSync(ini, INI);
  const el = [];
  for (const lapis of ['points', 'lines', 'multipolygons']) {
    const out = path.join(tmp, lapis + '.geojsonl');
    const r = spawnSync('ogr2ogr', ['-f', 'GeoJSONSeq', out, pbf, lapis, '-where', `power IN ('line','cable','substation','plant','generator','construction') OR "construction:power" IS NOT NULL OR line = 'construction'`, '-oo', `CONFIG_FILE=${ini}`, '-oo', 'INTERLEAVED_READING=NO'],
      { stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, OSM_MAX_TMPFILE_SIZE: '4000' } });
    if (r.status !== 0) { console.error('ogr2ogr gagal pada lapis', lapis); process.exit(1); }
    for (const baris of fs.readFileSync(out, 'utf8').split('\n')) if (baris.trim()) { const e = keElemen(JSON.parse(baris)); if (e) el.push(e); }
  }
  el.sort((a, b) => (a.type + a.id).localeCompare(b.type + b.id));
  const J = el.filter(masukJaringan), P = el.filter(masukPembangkit);
  fs.mkdirSync(dirJ, { recursive: true }); fs.mkdirSync(dirP, { recursive: true });
  const asal = { sumber: 'Geofabrik ' + path.basename(pbf), lisensi: 'ODbL 1.0, (c) kontributor OpenStreetMap' };
  fs.writeFileSync(path.join(dirJ, 'u_-11_94_7_141.5.json'), JSON.stringify({ ...asal, elements: J }));
  fs.writeFileSync(path.join(dirP, 'u_geofabrik.json'), JSON.stringify({ ...asal, elements: P }));
  fs.rmSync(tmp, { recursive: true, force: true });
  if (dirK) { const K = el.filter(masukKonstruksi); fs.mkdirSync(dirK, { recursive: true }); fs.writeFileSync(path.join(dirK, 'u_geofabrik.json'), JSON.stringify({ ...asal, elements: K })); console.log(K.length, 'elemen konstruksi'); }
  console.log(J.length, 'elemen jaringan,', P.length, 'elemen pembangkit');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [pbf, dirJ, dirP, dirK] = process.argv.slice(2);
  if (!pbf || !dirJ || !dirP) { console.log('pakai: <berkas.osm.pbf> <dirJaringan> <dirPembangkit> [<dirKonstruksi>]'); process.exit(2); }
  jalankan(pbf, dirJ, dirP, dirK);
}
