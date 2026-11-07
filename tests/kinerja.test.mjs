// public/data/kinerja_pembangkit.json: faktor kapasitas = produksi / (kapasitas x 8760); berkas = hasil bangun().
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun } from '../scripts/pipa/kinerja_pembangkit.mjs';

const D = JSON.parse(fs.readFileSync(new URL('../public/data/kinerja_pembangkit.json', import.meta.url), 'utf8'));
test('berkas sama dengan hasil bangun() (tak ada suntingan tangan)', () => assert.deepEqual(JSON.parse(JSON.stringify(bangun())), D));
test('rumus: fk = produksi / (kapasitas x 8760) dan masuk akal', () => {
  const ids = new Set(D.sumber.map((s) => s.id));
  for (const n of D.nasional) {
    for (const i of n.sumber_ids) assert.ok(ids.has(i));
    assert.ok(Math.abs(n.fk_aktual - (n.produksi_gwh * 1000) / (n.kapasitas_ruptl_mw * 8760) * 100) < 0.06, n.id);
    assert.ok(n.fk_aktual > 0 && n.fk_aktual < 100 && n.fk_batas_bawah <= n.fk_aktual + 0.05, n.id);
    assert.equal(n.fk_rencana == null, !!n.alasan_rencana_kosong, n.id);
  }
  for (const w of D.wilayah) for (const v of Object.values(w.tek)) assert.ok(v.fk == null || (v.fk >= 0 && v.fk <= 100));
});
test('anomali produksi > kapasitas tidak dihitung; celah tercatat; tanpa em dash', () => {
  const kb = D.wilayah.find((w) => w.provinsi === 'Kalimantan Barat').tek.air; assert.equal(kb.anomali, true); assert.equal(kb.fk, null);
  assert.ok(D.meta.celah.length >= 5); assert.doesNotMatch(JSON.stringify(D), /[—·]/);
  for (const s of D.sumber) assert.match(s.url, /^https:\/\//);
});
test('PLTB Sulawesi Selatan sama dengan contoh topik bayu (35,2 persen)', () => assert.ok(Math.abs(D.wilayah.find((w) => w.provinsi === 'Sulawesi Selatan').tek.bayu.fk - 35.2) < 0.1));
