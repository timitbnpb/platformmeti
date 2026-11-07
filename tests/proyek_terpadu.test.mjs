// Uji pelacak proyek terpadu (B1): skor dedup, keterlambatan COD, geometri OSM, dan konsistensi keluaran.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { skor, keterlambatan, AMBANG_GABUNG, AMBANG_RAGU } from '../scripts/pipa/proyek_terpadu.mjs';
import { kvMaks, sederhana, fitur, BATAS_BYTE } from '../scripts/panen/osm_jaringan.mjs';
const J = (f) => JSON.parse(readFileSync(new URL('../' + f, import.meta.url), 'utf8'));
const B = (o) => ({ nama: 'PLTP Ijen', tek: 'panas-bumi', mw: 110, prov: 'Jawa Timur', lat: null, lng: null, presisi: 'provinsi', ...o });

test('skor: teknologi beda = 0, nama+kapasitas+provinsi sama = gabung', () => {
  assert.equal(skor(B({}), B({ tek: 'surya' })), 0);
  assert.ok(skor(B({}), B({ nama: 'Ijen geothermal power plant' })) >= AMBANG_RAGU);
  assert.ok(skor(B({}), B({})) >= AMBANG_GABUNG);
  assert.ok(skor(B({}), B({ nama: 'PLTP Sarulla', prov: 'Sumatera Utara', mw: 330 })) < AMBANG_RAGU);
});
test('keterlambatan: aktual, perkiraan, lewat jadwal, batal', () => {
  const r = (o) => ({ status: 'rencana', cod_rencana: 2024, cod_terbaru: null, ...o });
  assert.deepEqual(keterlambatan(r({ status: 'beroperasi', cod_terbaru: 2026 }), 2026), { tahun: 2, jenis: 'aktual' });
  assert.deepEqual(keterlambatan(r({ cod_terbaru: 2028 }), 2026), { tahun: 4, jenis: 'perkiraan' });
  assert.deepEqual(keterlambatan(r({}), 2026), { tahun: 2, jenis: 'lewat' });
  assert.equal(keterlambatan(r({ status: 'dibatalkan' }), 2026), null);
  assert.equal(keterlambatan(r({ cod_rencana: null }), 2026), null);
});
test('OSM: tegangan, penyederhanaan, saring < 150 kV', () => {
  assert.equal(kvMaks('275000;150000'), 275);
  assert.equal(kvMaks('abc'), 0);
  assert.equal(sederhana([[0, 0], [1, 0.0001], [2, 0]], 0.01).length, 2);
  const g = (v) => ({ type: 'way', tags: { power: 'line', voltage: v }, geometry: [{ lon: 100, lat: 0 }, { lon: 100.5, lat: 0 }] });
  assert.equal(fitur(g('70000'), 0.001), null);
  assert.equal(fitur(g('150000'), 0.001).properties.v, 150);
});
test('keluaran proyek_terpadu.json konsisten', () => {
  const d = J('public/data/proyek_terpadu.json');
  const hitung = d.baris.filter((r) => !r.ragu);
  assert.equal(d.meta.jumlah, hitung.length);
  assert.ok(new Set(d.baris.map((r) => r.id)).size === d.baris.length, 'id unik');
  assert.ok(hitung.every((r) => r.status && r.tek && r.asal.length));
  assert.ok(d.antrean_tinjau.every((q) => q.alasan === 'ragu-pipeline-gem' || (q.skor >= AMBANG_RAGU && q.skor < AMBANG_GABUNG + 0.2)));
});
test('jaringan_osm.geojson: atribusi ODbL dan ukuran <= 3 MB', { skip: !existsSync(new URL('../public/data/geo/jaringan_osm.geojson', import.meta.url)) }, () => {
  const f = 'public/data/geo/jaringan_osm.geojson';
  assert.ok(statSync(f).size <= BATAS_BYTE);
  const d = J(f);
  assert.match(d.attribution, /OpenStreetMap contributors/);
  assert.match(d.lisensi, /ODbL/);
  assert.ok(d.features.every((x) => x.properties.v >= 150));
});
