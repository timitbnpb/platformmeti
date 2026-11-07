import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangunData, uraiLokasi, uraiRingkasan } from '../scripts/pipa/jetp_cipp.mjs';

const r = (n) => fs.readFileSync(new URL('../mentah/' + n, import.meta.url), 'utf8');
const SKIP = { skip: !fs.existsSync(new URL('../mentah/jetp_portofolio.html', import.meta.url)) && 'mentah/ tidak ada (data pihak ketiga, tak masuk repo)' };
const keu = { baris: [{ kelompok: 'jetp', proyek: 'MRT Jakarta East-West Line' }] };
test('portofolio nyata: 4 lokasi, ringkasan 143 MW', SKIP, () => {
  assert.equal(uraiLokasi(r('jetp_portofolio.html')).length, 4); assert.equal(uraiRingkasan(r('jetp_portofolio.html')).energi_terbarukan_didukung_mw, 143);
});
test('bangun: Saguling berpendana USD 60 juta; MRT non-EBT dan tidak ganda dengan keuangan; kapasitas Muara Laboh = tambahan', SKIP, () => {
  const o = bangunData(r('jetp_portofolio.html'), r('jetp_saguling.html'), r('jetp_ikiflex.html'), '2026-11-08', [], keu);
  const by = (n) => o.baris.find((b) => b.nama.startsWith(n));
  assert.equal(by('Saguling').pendana.pembiayaan_jetp_usd, 60000000); assert.equal(by('Saguling').lokasi.provinsi, 'Jawa Barat');
  assert.equal(by('MRT Jakarta East').ebt, false); assert.match(by('MRT Jakarta East').keuangan_json, /sudah ada/);
  assert.equal(by('Muara Laboh').kapasitas_mw, 83); assert.match(by('Muara Laboh').kapasitas_catatan, /tambahan/);
  assert.equal(by('IKI-Flex').pendana.pembiayaan_usd, 1100000);
  assert.ok(o.baris.every((b) => b.sumber_url && b.tanggal && b.tingkat_bukti)); assert.ok(o.meta.celah.some((c) => /CIPP/.test(c)));
});
