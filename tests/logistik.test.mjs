import test from 'node:test';
import assert from 'node:assert/strict';
import { bangun, PELABUHAN } from '../scripts/panen/logistik_lib.mjs';

const d = bangun();
test('logistik: tiap butir bersumber dan sumber_id dikenal', () => {
  const ada = new Set(d.sumber.map((s) => s.id));
  const cek = (o, p) => { if (o && typeof o === 'object') { if (typeof o.sumber_id === 'string') assert.ok(ada.has(o.sumber_id), p + ' ' + o.sumber_id); for (const [k, v] of Object.entries(o)) cek(v, p + '.' + k); } };
  cek(d, 'd');
  for (const t of d.biaya_angkut.titik) assert.ok(t.sumber_id && t.tingkat_bukti && t.tanggal, t.id);
  for (const r of d.rute) assert.ok(r.rumus && r.tingkat_bukti === 'estimasi');
});
test('logistik: koordinat sah, 13 pelabuhan, rute lengkap', () => {
  assert.equal(PELABUHAN.length, 13);
  for (const p of PELABUHAN) assert.ok(Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180, p.id);
  assert.equal(d.rute.length, 7 * 6);
  const r = d.rute.find((x) => x.id === 'shanghai-priok');
  assert.ok(r.jarak_garis_km > 4000 && r.jarak_garis_km < 5500, String(r.jarak_garis_km));
});
test('logistik: pangsa China masuk akal, pos tak bersumber null', () => {
  for (const k of d.risiko.konsentrasi) assert.ok(k.china_pangsa_persen >= 0 && k.china_pangsa_persen <= 100);
  for (const b of d.biaya_mendarat) assert.ok(b.pos.filter((p) => p.nilai == null).length >= 5);
});
test('logistik: durasi tanpa sumber ditandai, bukan tebakan', () => {
  for (const t of d.tahap) if (t.durasi_hari == null) assert.equal(t.durasi_status, 'belum-bersumber');
});
