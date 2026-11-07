import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun, bendera, tambahEntitas } from '../scripts/panen/global_wte.mjs';
import { bangun as bangunPsel, statusTerjauh } from '../scripts/panen/psel.mjs';

const seed = JSON.parse(fs.readFileSync('data/global/wte/penyedia_seed.json', 'utf8'));

test('pemasok WTE: >= 25 penyedia, id unik, negara berbendera', () => {
  const b = bangun(); assert.ok(b.jumlah >= 25);
  assert.equal(new Set(b.baris.map((x) => x.id)).size, b.jumlah);
  assert.equal(bendera('DE'), '🇩🇪');
  for (const n of b.negara) assert.ok(n.bendera && n.penyedia_ids.length);
});
test('pemasok WTE: situs hanya https dan angka pabrik tidak dikarang', () => {
  for (const p of seed.penyedia) { assert.ok(!p.situs || p.situs.startsWith('https://'), p.nama); assert.equal(p.pabrik_referensi.dunia, null); }
  for (const p of seed.penyedia) for (const i of p.indonesia) assert.ok(i.sumber.url.startsWith('https://') && i.sumber.tingkat_bukti);
});
test('entitas_tambah idempoten dan hanya bersumber berurl', () => {
  const d = { baris: [] }; const n = tambahEntitas(seed, d); d.baris.push(...n);
  assert.equal(tambahEntitas(seed, d).length, 0);
  assert.ok(n.every((x) => x.kategori === 'internasional' && x.sumber.every((s) => s.url.startsWith('https://'))));
});
test('PSEL: 12 kota Perpres 35/2018 punya proyek dan kode BPS; tarif regulasi terpisah dari PPA', () => {
  const b = bangunPsel();
  assert.equal(b.kota_perpres_35_2018.length, 12);
  for (const k of b.kota_perpres_35_2018) assert.ok(k.proyek_ids.length && /^\d{2,4}$/.test(k.kode_bps), k.kota);
  assert.equal(b.regulasi[0].tarif[0].usd_sen_per_kwh, 13.35); assert.equal(b.regulasi[1].tarif[0].usd_sen_per_kwh, 20);
  assert.ok(b.baris.every((x) => x.harga_ppa === null && x.tipping_fee === null));
  assert.equal(statusTerjauh([{ nilai: 'rencana' }, { nilai: 'beroperasi' }]), 'beroperasi');
});
