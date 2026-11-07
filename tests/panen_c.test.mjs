// Uji panen C: bentuk keluaran + kekonsistenan angka. Jalankan: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { angka, barisTabel } from '../scripts/pipa/_panen_umum.mjs';
import { cocokkan, cocokOrang } from '../scripts/pipa/riset_kampus.mjs';

const AKAR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const baca = n => JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data', n), 'utf-8'));
const wajibSumber = b => { assert.ok(b.sumber_url?.startsWith('http')); assert.match(b.tanggal_periksa, /^\d{4}-\d{2}-\d{2}$/); assert.ok(b.tingkat_bukti); };

test('angka format Indonesia', () => {
  assert.equal(angka('3.946,11'), 3946.11);
  assert.equal(angka('6.500'), 6500);
  assert.equal(angka('-'), 0);
  assert.ok(Number.isNaN(angka('MVA')));
});

test('barisTabel membuang satuan nyasar dan menolak baris salah panjang', () => {
  assert.deepEqual(barisTabel(' 35 Papua Tengah 414 43 - 1 MVA', 4), [{ nama: 'Papua Tengah', nilai: [414, 43, 0, 1] }]);
  assert.deepEqual(barisTabel(' 35 Papua Tengah 414 43', 4), []);
});

test('desa_listrik: 38 provinsi, jumlah cocok total nasional', () => {
  const j = baca('desa_listrik.json');
  assert.equal(j.baris.length, 38);
  j.baris.forEach(wajibSumber);
  const jml = k => j.baris.reduce((a, b) => a + b[k], 0);
  assert.equal(jml('jumlah_desa'), j.nasional.jumlah_desa);
  assert.equal(jml('desa_berlistrik'), j.nasional.desa_berlistrik);
  assert.equal(jml('belum_berlistrik'), j.nasional.belum_berlistrik);
  assert.ok(j.meta.celah.length > 0);
});

test('statistik_pln: kapasitas dan produksi cocok total nasional sumber', () => {
  const j = baca('statistik_pln.json');
  assert.equal(j.baris.length, 38);
  j.baris.forEach(b => { wajibSumber(b); assert.ok(b.kapasitas_terpasang_mw && b.produksi_pln_gwh, b.provinsi); });
  const kap = j.baris.reduce((a, b) => a + b.kapasitas_terpasang_mw.total, 0);
  assert.ok(Math.abs(kap - 100649) <= 5, 'kapasitas nasional 100.649 MW, dapat ' + kap);
  const prod = j.baris.reduce((a, b) => a + b.produksi_pln_gwh.total, 0);
  assert.ok(Math.abs(prod - 343891.75) < 1, 'produksi ' + prod);
  const jual = j.wilayah_pln.reduce((a, w) => a + w.penjualan_gwh, 0);
  assert.ok(Math.abs(jual - 306219.424) < 1, 'penjualan ' + jual);
  assert.equal(j.baris.find(b => b.provinsi === 'Riau').beban_puncak_mw, null); // tidak dikarang
});

test('emisi_provinsi: tidak memalsukan emisi dari mitigasi', () => {
  const j = baca('emisi_provinsi.json');
  assert.deepEqual(j.provinsi, []);
  assert.equal(j.nasional.mitigasi_ketenagalistrikan.baris.length, 5);
  assert.ok(j.meta.celah.length >= 2);
});

test('riset_kampus: bentuk, sumber, tautan organisasi, usulan orang', () => {
  const j = baca('riset_kampus.json');
  assert.ok(j.baris.length > 0);
  for (const k of j.baris) {
    wajibSumber(k);
    assert.ok(k.karya_energi_2019_sekarang > 0);
    assert.ok(k.penulis_teratas.length <= 10);
    for (const p of k.penulis_teratas) assert.ok(p.orcid === null || /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(p.orcid), p.orcid);
  }
});

test('cocokkan kampus ke organisasi dan nama orang persis saja', () => {
  const org = [{ id: 'l_1', nama: 'Pusat Studi Energi Universitas Gadjah Mada', kategori: { kode: 'perguruan-tinggi' } }, { id: 'l_2', nama: 'Universitas Gadjah Mada Toko', kategori: { kode: 'swasta' } }];
  assert.deepEqual(cocokkan('Universitas Gadjah Mada', org), ['l_1']);
  assert.deepEqual(cocokOrang('Budi Santoso', [{ id: 'o1', nama: 'Prof. Dr. Budi Santoso, M.T.' }, { id: 'o2', nama: 'Budi Santoso Jaya' }]), ['o1']);
  assert.deepEqual(cocokOrang('Li', [{ id: 'o3', nama: 'Li' }]), []);
});
