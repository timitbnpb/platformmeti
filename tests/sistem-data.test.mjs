import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { periksa, ubah, cariOrg, robotsMelarang, AKSES } from '../scripts/pipa/sistem_data.mjs';

const d = JSON.parse(fs.readFileSync(new URL('../public/data/sistem_data.json', import.meta.url), 'utf8'));
const org = new Set(JSON.parse(fs.readFileSync(new URL('../public/data/organisasi.json', import.meta.url), 'utf8')).baris.map((o) => o.id));

test('sistem_data.json: 40 sampai 60 sistem, skema lolos, id unik', () => {
  assert.ok(d.sistem.length >= 40 && d.sistem.length <= 60 && d.jumlah === d.sistem.length);
  assert.deepEqual(d.sistem.flatMap(periksa), []);
  assert.equal(new Set(d.sistem.map((b) => b.id)).size, d.sistem.length);
});
test('enam jenis akses dikenal, sumber terpakai ditandai, lembaga_id valid', () => {
  assert.ok(d.sistem.every((b) => AKSES.includes(b.akses)));
  assert.ok(d.sistem.some((b) => b.dipakai_pantau) && d.sistem.some((b) => !b.dipakai_pantau));
  assert.ok(d.sistem.every((b) => !b.lembaga_id || org.has(b.lembaga_id)));
  assert.ok(d.sistem.some((b) => b.cakupan_internasional) && d.sistem.some((b) => !b.cakupan_internasional));
});
test('tanpa 1001startup, tanpa em dash, diverifikasi kosong (isi belum dicocokkan)', () => {
  const s = JSON.stringify(d);
  assert.ok(!/1001startup/i.test(s) && !/[—–]/.test(s));
  assert.ok(d.sistem.every((b) => b.diverifikasi.length === 0));
});
test('periksa menolak: tanpa sumber, akses asing, http, tertutup berAPI', () => {
  const ok = d.sistem[0];
  assert.deepEqual(periksa(ok), []);
  assert.ok(periksa({ ...ok, sumber_url: '' }).length);
  assert.ok(periksa({ ...ok, akses: 'bebas' }).length);
  assert.ok(periksa({ ...ok, portal_url: 'http://a.id' }).length);
  assert.ok(periksa({ ...ok, akses: 'tertutup', api_url: 'https://a.id' }).length);
});
test('robotsMelarang dan cariOrg', () => {
  assert.equal(robotsMelarang('User-agent: *\nDisallow: /'), true);
  assert.equal(robotsMelarang('User-agent: *\nDisallow: /admin'), false);
  assert.equal(robotsMelarang('User-agent: Googlebot\nDisallow: /'), false);
  assert.equal(cariOrg('Badan Pusat Statistik', [{ id: 'x', nama: 'Badan Pusat Statistik' }]), 'x');
  assert.equal(cariOrg('Tak ada', [{ id: 'x', nama: 'A' }]), null);
  assert.equal(ubah({ id: 'a', nama: 'n', pemilik: 'p', uraian: 'u', sektor: ['surya'], jenis: ['j'], cakupan: 'c', frek: 'f', format: ['x'], lisensi: 'l', akses: 'terbuka', portal: 'https://a.id/', cara: 'c' }, [], '2026-11-08').tingkat_bukti, 'kata-pihak');
});
