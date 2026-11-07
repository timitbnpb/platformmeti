// Gelombang B2: tkdn_produk, insentif_fiskal, taksonomi_ojk, statistik_esdm_2025. Selftest tiap skrip + bentuk keluaran terbit.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { periksaBentuk } from '../scripts/pipa/dataset_lib.mjs';
import { tanggalIso, kategori } from '../scripts/pipa/tkdn_produk.mjs';

const baca = (n) => JSON.parse(fs.readFileSync(new URL('../public/data/' + n + '.json', import.meta.url), 'utf8'));
const ORG = new Set(baca('organisasi').baris.map((o) => o.id));

for (const s of ['tkdn_produk', 'insentif_fiskal', 'taksonomi_ojk', 'statistik_esdm_2025']) {
  test(`${s}: selftest`, () => { execFileSync('node', [`scripts/pipa/${s}.mjs`, '--selftest'], { cwd: new URL('..', import.meta.url).pathname, stdio: 'pipe' }); });
}
test('tkdn_produk: bentuk, kategori, tautan organisasi, tanggal kedaluwarsa', () => {
  const d = baca('tkdn_produk');
  assert.deepEqual(periksaBentuk(d), []);
  assert.ok(d.jumlah >= 500);
  for (const b of d.baris) {
    assert.ok(['modul', 'inverter', 'baterai', 'turbin', 'kabel', 'trafo', 'struktur'].includes(b.kategori), b.id);
    assert.ok(b.tkdn_persen > 0 && b.tkdn_persen <= 100, b.id);
    if (b.pabrikan_org_id) assert.ok(ORG.has(b.pabrikan_org_id), b.id);
    if (b.berlaku_sampai) assert.equal(b.aktif, b.berlaku_sampai >= '2026-11-08', b.id);
  }
});
test('tkdn_produk: parser tanggal dan penyaring', () => {
  assert.equal(tanggalIso('20 Apr 2031'), '2031-04-20');
  assert.equal(kategori({ produk: 'Pendingin Ruangan Inverter' }), null);
});
test('insentif_fiskal: bentuk, status dan dasar hukum dari JDIH', () => {
  const d = baca('insentif_fiskal');
  assert.deepEqual(periksaBentuk(d), []);
  const reg = new Set(baca('regulasi').baris.map((r) => r.id));
  for (const b of d.baris) {
    assert.ok(/^https:\/\/peraturan\.bpk\.go\.id\/Details\/\d+/.test(b.sumber_url), b.id);
    assert.ok(['berlaku', 'tidak berlaku'].includes(b.status_berlaku), b.id);
    if (b.regulasi_id) assert.ok(reg.has(b.regulasi_id), b.id);
  }
  assert.ok(d.baris.some((b) => b.jenis_insentif === 'tax-allowance') && d.baris.some((b) => b.jenis_insentif === 'ppn-dtp'));
});
test('taksonomi_ojk: ambang angka dan halaman bukti', () => {
  const d = baca('taksonomi_ojk');
  assert.deepEqual(periksaBentuk(d), []);
  assert.deepEqual(d.meta.kerangka.hasil_penilaian, ['Hijau', 'Transisi', 'Tidak Memenuhi Klasifikasi']);
  const plta = d.baris.find((b) => b.id === 'tk_plta');
  assert.match(plta.klasifikasi_hijau_eo1, /100 gCO2e\/kWh/);
  assert.match(plta.klasifikasi_transisi_eo1, /510 gCO2e\/kWh/);
  assert.ok(d.baris.every((b) => b.halaman_pdf > 80 && b.sumber_url.endsWith('#page=' + b.halaman_pdf)));
});
