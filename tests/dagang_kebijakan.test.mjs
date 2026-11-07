import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BUTIR, SUMBER, sahkan, bangun } from '../scripts/panen/dagang_kebijakan_lib.mjs';

const j = JSON.parse(fs.readFileSync(new URL('../public/data/global/kebijakan_dagang.json', import.meta.url), 'utf8'));

test('tiap butir bersumber https, bertingkat bukti, dan lolos sahkan', () => {
  for (const b of BUTIR) assert.equal(sahkan(b), null, b.id);
  assert.equal(sahkan({ ...BUTIR[0], sumber_id: 'x' }), 'sumber_url');
  assert.equal(sahkan({ ...BUTIR[0], tingkat_bukti: '' }), 'tingkat_bukti');
});
test('tarif per perusahaan AD/CVD Indonesia sesuai Federal Register', () => {
  const t = (id, p) => BUTIR.find((b) => b.id === id).sasaran.find((x) => x.perusahaan === p).tarif_pct;
  assert.equal(t('us_ad_id_2026', 'PT REC Solar Energy Indonesia'), 94.36);
  assert.equal(t('us_cvd_id_2026', 'PT Blue Sky Solar Indonesia'), 173.7);
  assert.equal(t('us_cvd_id_2026', 'PT REC Solar Energy Indonesia'), 73.2);
});
test('berkas keluaran: id unik, sumber terdaftar, tanpa ditolak, dampak ekspor AS', () => {
  assert.equal(new Set(j.baris.map((b) => b.id)).size, j.baris.length);
  const sid = new Set(j.sumber.map((s) => s.id));
  for (const b of j.baris) assert.ok(sid.has(b.sumber_id) && b.sumber_url && b.tanggal && b.tingkat_bukti, b.id);
  assert.deepEqual(j.ditolak, []);
  assert.ok(j.dampak.ekspor_surya_ke_as.find((x) => x.tahun === 2024).usd_as > 5e8);
});
test('bangun menolak butir insentif yang tak ada', () => {
  const d = bangun({ komponen: {}, insentif: { baris: [] }, orgIds: new Set(), tanggal: '2026-11-08' });
  assert.equal(d.ditolak.length, 2);
});
