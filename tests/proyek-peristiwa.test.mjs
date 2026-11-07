import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { jenis, siapkan, tautkan } from '../scripts/pipa/proyek_peristiwa.mjs';
import { irisan } from '../scripts/pipa/pakar_orang.mjs';
import { jendelaBulan, urlGdelt } from '../scripts/panen/berita.mjs';

test('selftest skrip peristiwa proyek dan pakar_orang', () => {
  for (const s of ['proyek_peristiwa', 'pakar_orang']) assert.match(execFileSync('node', [`scripts/pipa/${s}.mjs`, '--selftest'], { encoding: 'utf8' }), /selftest ok/);
});
test('peristiwa: rencana bukan peristiwa; lokasi bertentangan menolak cocok', () => {
  assert.equal(jenis('PLTS Saguling ditargetkan beroperasi April 2027'), null);
  assert.equal(jenis('Proyek PLTP dibatalkan'), 'pembatalan');
  const S = siapkan([{ id: 'a', nama: 'PLTS Terapung Gajah Mungkur', lokasi: { provinsi: 'Jawa Tengah' } }]);
  assert.equal(tautkan('PLTS Gajah Mungkur dibangun', new Set(['Aceh']), S).length, 0);
});
test('akademik: irisan afiliasi ID/EN', () => { assert(irisan('Kementerian Energi dan Sumber Daya Mineral', 'Kementerian ESDM')); assert(!irisan('Udayana University', 'PT PLN')); });
test('berita: jendela bulanan 12 bulan dan URL GDELT bertanggal', () => {
  const j = jendelaBulan(12, new Date('2026-11-08')); assert.equal(j.length, 10); assert.equal(j.at(-1)[0], '20251101000000');
  assert.match(urlGdelt('x', j[0]), /startdatetime=20260801000000/); assert.doesNotMatch(urlGdelt('x', j[0]), /timespan/); assert.match(urlGdelt('x'), /timespan=3m/);
});
