import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun, KOMPONEN } from '../scripts/pipa/rantai_pasok.mjs';

const j = JSON.parse(fs.readFileSync(new URL('../public/data/rantai_pasok.json', import.meta.url), 'utf8'));
test('rantai_pasok.json: 8 teknologi, komponen sesuai KOMPONEN, tanpa em dash', () => {
  assert.deepEqual(j.teknologi.map((t) => t.id), Object.keys(KOMPONEN));
  for (const t of j.teknologi) assert.deepEqual(t.komponen.map((k) => k.id), KOMPONEN[t.id]);
  assert.ok(!JSON.stringify(j).includes('—'));
});
test('celah = komponen tanpa pemasok; tipis = kurang dari 5 pemasok unik; tidak dikarang', () => {
  for (const t of j.teknologi) {
    assert.deepEqual(t.celah, t.komponen.filter((k) => !k.pemasok.length).map((k) => k.id));
    assert.equal(t.tipis, t.pemasok_unik < 5);
  }
  assert.equal(j.teknologi.find((t) => t.id === 'bayu').pemasok_unik, 1); // PT Kenertec Power System (menara), dari data tayang
});
test('bangun: pemasok luar negeri (tanpa provinsi) dibuang, urut kapasitas', () => {
  const peny = { dibangun_pada: '2026-01-01', baris: [] };
  const tkdn = { dibangun_pada: '2026-01-01', sumber: [{ judul: 'x', penerbit: 'y' }], baris: [] };
  const plts = { sumber: { judul: 's', tanggal: '2026-01-01' }, pabrikan: [
    { id: 'a', nama: 'A', kota: 'X', provinsi: null, mwp: 900 }, { id: 'b', nama: 'B', kota: 'Y', provinsi: 'Banten', mwp: 100 }, { id: 'c', nama: 'C', kota: 'Y', provinsi: 'Banten', mwp: 500 }] };
  const m = bangun({ plts, tkdn, peny }, '2026-01-01').teknologi.find((t) => t.id === 'surya').komponen[0];
  assert.deepEqual(m.pemasok.map((p) => p.id), ['c', 'b']);
});
