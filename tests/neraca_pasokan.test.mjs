import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { KOMPONEN, PLTS100, TAHUN, celah, kebutuhanTahunan, kapasitasModul } from '../scripts/panen/neraca_pasokan_lib.mjs';

const rd = (f) => JSON.parse(fs.readFileSync(new URL('../public/data/' + f, import.meta.url), 'utf8'));
const rantai = rd('rantai_pasok.json');
const n = rd('global/neraca_pasokan.json');

test('program PLTS 100 GWp berjumlah 100.000 MWp', () => {
  assert.equal(Object.values(PLTS100).reduce((a, b) => a + b, 0), 100000);
});
test('celah: kapasitas null tidak jadi nol; kelebihan kapasitas = impor 0', () => {
  assert.equal(celah(100, null).impor_tersirat_pct, null);
  assert.deepEqual(celah(100, 150), { kebutuhan: 100, kapasitas: 150, celah: 0, impor_tersirat_pct: 0 });
  assert.equal(celah(200, 50).impor_tersirat_pct, 75);
});
test('kebutuhan modul = MW surya RUPTL; skenario 100 GWp menambah tepat PLTS100', () => {
  const a = kebutuhanTahunan(rantai, false).modul, b = kebutuhanTahunan(rantai, true).modul;
  assert.equal(a[2025], 275.4);
  for (const th of TAHUN) assert.ok(Math.abs(b[th] - a[th] - (PLTS100[th] || 0)) < 0.2, String(th));
});
test('kapasitas modul domestik tidak memuat pabrik berorientasi ekspor', () => {
  const m = kapasitasModul(rantai);
  assert.equal(m.nameplate, m.domestik + m.ekspor);
  assert.ok(m.domestik < m.nameplate);
});
test('berkas keluaran: semua komponen, faktor berlabel, rincian bersumber, org_id nyata', () => {
  assert.equal(n.baris.length, KOMPONEN.length);
  const sid = new Set(n.sumber.map((s) => s.id));
  const org = new Set([...rd('organisasi.json').baris.map((o) => o.id), ...rd('global/pelaku_global.json').baris.map((o) => o.id)]);
  for (const b of n.baris) {
    assert.ok(b.faktor.tingkat_bukti && b.faktor.ket, b.id);
    for (const s of Object.values(b.skenario)) {
      assert.equal(s.length, TAHUN.length);
      for (const x of s) assert.ok(x.impor_tersirat_pct === null || (x.impor_tersirat_pct >= 0 && x.impor_tersirat_pct <= 100), b.id);
    }
    for (const r of b.kapasitas.rincian) { assert.ok(r.org_id === null || org.has(r.org_id), r.nama); if (b.id !== 'modul') assert.ok(sid.has(r.sumber_id), r.nama); }
    if (b.peluang) assert.equal(b.peluang.label, 'Hipotesis');
  }
  assert.ok(n.baris.find((b) => b.id === 'modul').skenario.ruptl_plts100.find((x) => x.tahun === 2029).impor_tersirat_pct > 50);
});
