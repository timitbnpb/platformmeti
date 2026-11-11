// JM-T01: registri sumber valid terhadap skema; 60 sumber; komposisi jadwal mengikuti TIKET T02-T05.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bacaRegistri, validasiRegistri } from '../scripts/panen/_bot.mjs';

const R = bacaRegistri(), per = (f, v) => R.filter((s) => s[f] === v).map((s) => s.kode);
test('T01 registri valid terhadap skema (enum, host, skrip ada, tanpa host terlarang)', () => assert.deepEqual(validasiRegistri(R), []));
test('T01 60 sumber: 32 otomatis, 28 semi-manual', () => {
  assert.equal(R.length, 60); assert.equal(per('mode', 'otomatis').length, 32); assert.equal(per('mode', 'semi_manual').length, 28);
});
test('T01 jadwal workflow memuat sumber yang disebut TIKET', () => {
  const j = (n) => R.filter((s) => s.jadwal === n).map((s) => s.katalog);
  for (const k of ['S60', 'S22', 'S11']) assert.ok(j('harian').includes(k), k);
  for (const k of ['S06', 'S62', 'S24', 'S01', 'S47', 'S48', 'S49', 'S82', 'S66', 'S03']) assert.ok(j('mingguan').includes(k), k);
  for (const k of ['S30', 'S34', 'S43', 'S52', 'S50', 'S33', 'S02', 'S05', 'S12', 'S73']) assert.ok(j('bulanan').includes(k), k);
  for (const k of ['S17', 'S20', 'S25', 'S26', 'S37', 'S38', 'S39', 'S21']) assert.ok(j('kuartalan').includes(k), k);
});
test('T01 C-25: sumber berkunci tanpa secret berstatus perlu_kunci; blokir tercatat dengan alasan', () => {
  for (const k of ['bps_api', 'eia', 'ember', 'comtrade']) { const s = R.find((x) => x.kode === k); assert.ok(s.butuh_kunci && s.status === 'perlu_kunci', k); }
  for (const s of R.filter((x) => x.status === 'blokir')) assert.ok(s.catatan, s.kode);
});
test('T01 tanpa Antara, media sosial, SINTA, One Map di host maupun skrip yang dipasang', () => {
  for (const s of R) assert.doesNotMatch(s.host + ' ' + (s.url_sinyal || ''), /antara|facebook|instagram|twitter|tiktok|sinta|geoportal/i, s.kode);
});
test('T01 validasi menolak registri rusak', () => {
  const baik = R[0];
  for (const rusak of [{ ...baik, status: 'aneh' }, { ...baik, frekuensi: 'sering' }, { ...baik, host: 'www.antaranews.com' }, { ...baik, skrip: 'scripts/tidak/ada.mjs' }, { ...baik, kode: 'A!' }, { ...baik, jenis_sinyal: 'etag', url_sinyal: null }])
    assert.ok(validasiRegistri([rusak]).length > 0, JSON.stringify(rusak).slice(0, 80));
  assert.ok(validasiRegistri([baik, baik]).some((m) => /ganda/.test(m)));
});
