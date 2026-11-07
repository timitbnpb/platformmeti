import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { D, BYTES, cekKepala } from './_umum.mjs';
import { luasHa, potensiMwp, titikDalam } from '../scripts/pipa/waduk.mjs';

test('luasHa: persegi ~1 km x 1 km di ekuator = ~100 ha', () => {
  const k = 1 / 111.32, g = [{ lat: 0, lon: 0 }, { lat: 0, lon: k }, { lat: k * 111.32 / 110.574, lon: k }, { lat: k * 111.32 / 110.574, lon: 0 }, { lat: 0, lon: 0 }];
  assert.ok(Math.abs(luasHa(g) - 100) < 1);
});
test('potensiMwp: 5% x 1 MWp/ha', () => assert.equal(potensiMwp(1000), 50));
test('titikDalam', () => {
  const g = { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] };
  assert.ok(titikDalam(5, 5, g)); assert.ok(!titikDalam(15, 5, g));
});
test('waduk.json: skema', { skip: !fs.existsSync(new URL('../public/data/waduk.json', import.meta.url)) && 'waduk.json belum dibangun (butuh --ambil Overpass)' }, () => {
  const d = D('waduk.json'); cekKepala(d, { lisensi: /ODbL/ });
  assert.ok(d.baris.length > 50); assert.ok(BYTES('waduk.json') < 3e6); assert.match(d.meta.asumsi_est, /5%.*1 MWp\/ha/);
  const ids = new Set(d.sumber.map((s) => s.id)); const o = new Set();
  for (const b of d.baris) {
    assert.ok(ids.has(b.sumber_id)); assert.ok(!o.has(b.osm_id)); o.add(b.osm_id);
    assert.ok(b.luas_ha >= d.meta.ambang_luas_ha, b.osm_id);
    assert.equal(b.potensi_plts_terapung_mwp_est, potensiMwp(b.luas_ha));
    assert.ok(b.lat > -12 && b.lat < 7 && b.lng > 94 && b.lng < 142, b.osm_id);
  }
  assert.ok(d.baris.some((b) => b.provinsi));
});
