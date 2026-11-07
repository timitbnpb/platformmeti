import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { periksaBentuk, sahBaris, saring } from '../scripts/pipa/dataset_lib.mjs';
import * as M from '../scripts/pipa/dataset_pendanaan_int.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/pendanaan_internasional.json'), 'utf8'));

test('pendanaan_internasional: bentuk, sumber tiap baris, id unik, celah ada', () => {
  assert.deepEqual(periksaBentuk(d, { kunciWajib: ['pemberi','nilai_usd','status','proyek_id','pemberi_org_id'] }), []);
  assert.ok(d.jumlah >= 100);
});
test('baris tanpa sumber_url/tanggal/tingkat_bukti ditolak', () => {
  const { ok, ditolak } = saring([{ id: 'a' }, { id: 'b', sumber_url: 'http://x', tanggal: '2026-11-07', tingkat_bukti: 'resmi' }, { id: 'c', sumber_url: 'https://x', tanggal: '2026-11-07', tingkat_bukti: 'sedang' }]);
  assert.equal(ok.length, 0); assert.equal(ditolak, 3);
});
test('deterministik: bangun dua kali identik', () => {
  assert.deepEqual(M.bangun([{ aid: 'X-1', title: 'T', reporting: 'ADB', commitment: 5, sector_group: '232', sector_percent: 100, day_start: 19000, day_end: 20000 }]), M.bangun([{ aid: 'X-1', title: 'T', reporting: 'ADB', commitment: 5, sector_group: '232', sector_percent: 100, day_start: 19000, day_end: 20000 }]));
});

test('pembersihan: duplikat WB/AidData, porsi energi kecil, nilai 0 dibuang; baris dikumpulkan per aktivitas', () => {
  const r = (o) => ({ aid: 'A', title: 'Sarulla', reporting: 'Asian Development Bank', commitment: 10, sector_group: '232', sector_percent: 50, day_start: 19000, day_end: 20000, ...o });
  assert.equal(M.bangun([r({ reporting: 'World Bank' }), r({ reporting: 'AidData' }), r({ aid: 'B', commitment: 0 }), r({ aid: 'C', sector_percent: 5 }), r({ aid: 'D', sector_group: '233' })]).filter((b) => b.id.startsWith('pi_')).length, 0);
  const b = M.bangun([r({}), r({ sector_group: '236', sector_percent: 40 })]).filter((x) => x.id.startsWith('pi_'));
  assert.equal(b.length, 1); assert.equal(b[0].porsi_energi_persen, 90); assert.deepEqual(b[0].sektor_dac, ['232', '236']);
});
test('tautan proyek hanya bila id ada; org asing tak diada-adakan', () => {
  const b = M.bangun([{ aid: 'Z', title: 'Muara Laboh Geothermal', reporting: 'Asian Development Bank', commitment: 1, sector_group: '232', sector_percent: 100 }], { proyekIds: new Set(['pj_0265']) }).find((x) => x.id === 'pi_Z');
  assert.equal(b.proyek_id, 'pj_0265'); assert.equal(b.pemberi_org_id, null);
  assert.ok(d.baris.every((x) => x.satuan_nilai));
});
test('tidak ada baris World Bank ganda dengan keuangan.json', () => {
  assert.ok(d.baris.filter((x) => x.id.startsWith('pw_')).every((x) => x.sumber_url.includes('P')));
});
