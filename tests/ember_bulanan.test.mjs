import test from 'node:test';
import assert from 'node:assert/strict';
import { D, cekKepala } from './_umum.mjs';

test('ember_bulanan.json: skema (resolusi tahunan karena bulanan IDN tidak ada)', () => {
  const d = D('ember_bulanan.json'); cekKepala(d, { lisensi: /CC BY/ });
  assert.equal(d.resolusi, 'tahunan'); assert.equal(d.meta.tahun_awal, 2015); assert.ok(d.meta.tahun_akhir >= 2024);
  assert.ok(d.meta.celah.some((c) => /Bulanan/.test(c)));
  const ids = new Set(d.sumber.map((s) => s.id)); const k = new Set();
  for (const b of d.baris) {
    assert.ok(ids.has(b.sumber_id)); assert.ok(b.tahun >= 2015); assert.ok(b.generasi_twh == null || isFinite(b.generasi_twh));
    const key = b.tahun + '|' + b.sumber_listrik; assert.ok(!k.has(key), key); k.add(key);
  }
  // konsistensi: komponen non-agregat (tanpa impor) ~ total pembangkitan tiap tahun
  for (let y = d.meta.tahun_awal; y <= d.meta.tahun_akhir; y++) {
    const r = d.baris.filter((b) => b.tahun === y), tot = r.find((b) => b.sumber_listrik === 'Total generation').generasi_twh;
    const jml = r.filter((b) => !b.agregat && b.sumber_listrik !== 'Net imports').reduce((s, b) => s + (b.generasi_twh || 0), 0);
    assert.ok(Math.abs(jml - tot) / tot < 0.03, `${y}: ${jml} vs ${tot}`);
  }
});
