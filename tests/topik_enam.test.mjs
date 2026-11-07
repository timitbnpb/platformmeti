// Naskah enam topik (jaringan, efisiensi, nuklir, energi-laut, transisi-berkeadilan, pembiayaan-hijau): bentuk, sumber, sinkron dengan skrip, bab K.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DAFTAR = ['jaringan', 'efisiensi', 'nuklir', 'energi_laut', 'transisi_berkeadilan', 'pembiayaan_hijau'];
for (const b of DAFTAR) {
  const m = await import(`../scripts/pipa/topik_${b}.mjs`);
  test(`topik ${b}: selftest lolos`, () => { m.selftest(); });
  test(`topik ${b}: valid, >= 30 bab, kasus berhasil dan gagal, kasus gagal berhak jawab`, () => {
    const d = m.susun();
    assert.deepEqual(m.validasi(d), []);
    assert.ok(Object.keys(d.bab).length >= 30, `bab ${Object.keys(d.bab).length}`);
    for (const n of ['39', '40', '41', '42']) assert.ok(d.bab[n], 'bab ' + n);
    assert.ok(d.bab['39'].butir.length >= 1 && d.bab['40'].butir.length >= 1);
    for (const k of d.bab['40'].butir) { assert.equal(k.hak_jawab, true); assert.ok(k.kronologi.length && k.tanda_bahaya.length && k.sumber.length, k.id); }
  });
  test(`public/data/topik/${b}.json sinkron dengan skrip`, () => {
    const f = new URL(`../public/data/topik/${b}.json`, import.meta.url);
    assert.deepEqual(JSON.parse(fs.readFileSync(f, 'utf8')), JSON.parse(JSON.stringify(m.susun())));
  });
}
