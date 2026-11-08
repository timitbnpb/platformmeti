// Uji data resmi HEESI 2025 (public/data/resmi): sumber wajib, jumlah kolom cocok dengan total, tautan ke wilayah.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baca = (n) => JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data', n), 'utf8'));
const idx = baca('resmi/indeks.json');

test('resmi: tiap dataset punya sumber https, tanggal, tingkat bukti, lisensi', () => {
  assert.ok(idx.dataset.length >= 8 && idx.celah.length >= 3);
  for (const { id } of idx.dataset) {
    const d = baca(`resmi/${id}.json`);
    assert.match(d.url, /^https:\/\/esdm\.go\.id\//); assert.match(d.tanggal_ambil, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(d.tingkat_bukti, 'resmi'); assert.ok(d.lisensi && d.sumber && d.tabel);
  }
});
test('kapasitas_pembangkit_provinsi: 38 provinsi, kode ada di wilayah.json, jumlah = total nasional', () => {
  const d = baca('resmi/kapasitas_pembangkit_provinsi.json'), w = new Set(baca('wilayah.json').baris.map((b) => b.kode));
  assert.equal(d.baris.length, 38);
  for (const b of d.baris) assert.ok(w.has(b.kode), b.provinsi);
  assert.ok(Math.abs(d.baris.reduce((a, b) => a + b.total, 0) - d.total.total) < 1);
});
test('konsumsi listrik: total PLN + non-PLN = total, 2015-2025', () => {
  const d = baca('resmi/konsumsi_listrik_sektor.json');
  assert.equal(d.baris.length, 11);
  for (const b of d.baris) assert.ok(Math.abs(b.pln_gwh.total + b.non_pln_gwh.total - b.total_gwh) <= 1, b.tahun);
});
test('spklu_provinsi: jumlah = total; harga_bbm_lpg dan seri punya 11 tahun', () => {
  const d = baca('resmi/spklu_provinsi.json');
  assert.equal(d.baris.reduce((a, b) => a + b.spklu, 0), d.total.spklu);
  assert.equal(baca('resmi/harga_bbm_lpg.json').baris.length, 11);
  assert.equal(Object.keys(baca('resmi/konsumsi_energi_final_sektor.json').seri.industri).length, 11);
});
test('obligasi_hijau: tranche ritel dan PBSG001 menjumlah ke agregat DJPPR; baris sertifikasi/terbit bertipe benar', () => {
  const d = baca('obligasi_hijau.json'), nilai = (re) => d.baris.filter((b) => re.test(b.id)).reduce((a, b) => a + b.nilai, 0);
  assert.equal(nilai(/^ob_ri_st\d+/), d.baris.find((b) => b.id === 'ob_ri_agregat_ritel_2018_2024').nilai);
  assert.equal(nilai(/^ob_ri_pbsg001_/), d.baris.find((b) => b.id === 'ob_ri_agregat_wholesale_2022_2024').nilai);
  for (const b of d.baris) { assert.ok('tanggal_terbit' in b && 'sertifikasi' in b, b.id); if (b.kupon_persen != null) assert.ok(b.tenor_tahun > 0, b.id); }
  assert.ok(d.baris.some((b) => b.penerbit_org_id === 'p_dda1e51dae'));
});
