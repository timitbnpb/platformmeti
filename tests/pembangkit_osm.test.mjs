import test from 'node:test';
import assert from 'node:assert/strict';
import { D, BYTES, cekKepala } from './_umum.mjs';
import { kapasitasMw, ubahElemen } from '../scripts/pipa/pembangkit_osm.mjs';
import { cocokkan, siapkanProyek } from '../scripts/pipa/cocok_proyek.mjs';

test('kapasitasMw: satuan', () => {
  assert.equal(kapasitasMw('10 MW'), 10); assert.equal(kapasitasMw('500 kW'), 0.5); assert.equal(kapasitasMw('1,5 GW'), 1500);
  assert.equal(kapasitasMw('2000000'), 2); assert.equal(kapasitasMw('besar'), null); assert.equal(kapasitasMw(undefined), null);
});
test('ubahElemen: tolak sumber lain dan tanpa koordinat', () => {
  assert.equal(ubahElemen({ type: 'node', id: 1, lat: 1, lon: 2, tags: { power: 'generator', 'generator:source': 'nuclear' } }), null);
  assert.equal(ubahElemen({ type: 'way', id: 2, tags: { power: 'plant', 'plant:source': 'solar' } }), null);
  assert.equal(ubahElemen({ type: 'way', id: 3, center: { lat: 1, lon: 2 }, tags: { power: 'plant', 'plant:source': 'solar', name: 'X', 'plant:output:electricity': '5 MW' } }).kapasitas_mw, 5);
});
test('cocokkan: titik_persis butuh jarak < 5 km; presisi wilayah hanya nama kuat', () => {
  const d = siapkanProyek([
    { id: 'a', nama: 'PLTS Cirata', teknologi: 'surya', lokasi: { lat: -6.7, lng: 107.3, presisi: 'titik_persis' } },
    { id: 'b', nama: 'PLTB Sidrap', teknologi: 'bayu', lokasi: { lat: -3.0, lng: 120.0, presisi: 'provinsi' } }]);
  assert.equal(cocokkan({ nama: 'Cirata Floating Solar', lat: -6.71, lng: 107.31, tek: 'solar' }, d).kecocokan, 'nama+jarak');
  assert.equal(cocokkan({ nama: 'Cirata', lat: -7.5, lng: 107.3, tek: 'solar' }, d), null);
  assert.equal(cocokkan({ nama: 'Sidrap', lat: -3.9, lng: 119.7, tek: 'wind' }, d).kecocokan, 'nama-saja');
  assert.equal(cocokkan({ nama: 'Sidrap', lat: -3.9, lng: 119.7, tek: 'hydro' }, d), null);
});
test('pembangkit_osm.json: skema', () => {
  const d = D('pembangkit_osm.json'); cekKepala(d, { lisensi: /ODbL/ });
  assert.ok(d.baris.length > 100); assert.ok(BYTES('pembangkit_osm.json') < 3e6);
  const proyek = new Set(D('proyek.json').baris.map((p) => p.id)); const ids = new Set();
  for (const b of d.baris) {
    assert.ok(!ids.has(b.osm_id), b.osm_id); ids.add(b.osm_id);
    assert.match(b.osm_id, /^(node|way|relation)\/\d+$/);
    assert.ok(b.lat > -12 && b.lat < 7 && b.lng > 94 && b.lng < 142, b.osm_id);
    assert.ok(b.kapasitas_mw == null || b.kapasitas_mw > 0);
    if (b.proyek_id) { assert.ok(proyek.has(b.proyek_id), b.osm_id); assert.ok(['nama+jarak', 'nama-saja'].includes(b.kecocokan)); assert.ok(!b.kandidat_proyek_baru); }
    if (b.konteks) assert.ok(!b.proyek_id && !b.kandidat_proyek_baru);
  }
  assert.equal(d.meta.tertaut_proyek, d.baris.filter((b) => b.proyek_id).length);
  assert.equal(d.meta.kandidat_proyek_baru, d.baris.filter((b) => b.kandidat_proyek_baru).length);
});
