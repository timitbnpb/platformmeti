import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { validasi, indeks, aliasPelaku, kategoriPelaku } from '../scripts/panen/global_pelaku_bangun.mjs';
import { pilihKalimat } from '../scripts/panen/global_pelaku.mjs';
import { idEntitas } from '../scripts/pipa/entitas_tambah.mjs';

const baca = (f) => JSON.parse(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'));

test('selftest skrip panen dan bangun', () => {
  for (const s of ['global_pelaku.mjs', 'global_pelaku_bangun.mjs']) execFileSync('node', [new URL('../scripts/panen/' + s, import.meta.url).pathname, '--selftest']);
});
test('alias tidak mencocokkan kata lain', () => {
  assert.ok(!new RegExp(aliasPelaku('Apple')).test('Pineapple Farm'));
  assert.equal(kategoriPelaku('Munich Re', 'asuransi', 'DE'), 'keuangan');
});
test('pilihKalimat memisahkan Indonesia, portofolio, komitmen', () => {
  const k = pilihKalimat('It operates in Indonesia with a 100 MW plant. Total capacity is 3 GW across projects. It committed to net-zero by 2040.');
  assert.ok(k.indonesia.length && k.komitmen.length);
});
test('pelaku_global.json: sumber, tautan, org di direktori', () => {
  const d = baca('public/data/global/pelaku_global.json');
  assert.ok(d.baris.length >= 40, 'jumlah pelaku');
  const org = new Set(baca('data/direktori/entitas_tambah.json').baris.map((b) => idEntitas(b.nama)));
  const orgPub = new Set(baca('public/data/organisasi.json').baris.map((o) => o.id));
  const proy = new Set(baca('public/data/proyek.json').baris.map((p) => p.id));
  for (const p of d.baris) {
    assert.deepEqual(validasi(p), [], p.nama);
    assert.ok(org.has(p.org_id) || orgPub.has(p.org_id), `${p.nama}: org_id ${p.org_id} tak ada di direktori`);
    for (const j of p.proyek_id) assert.ok(proy.has(j), `${p.nama}: proyek ${j}`);
    assert.ok(Array.isArray(p.topik) && /^[A-Z]{2}$/.test(p.negara_iso2));
  }
  assert.deepEqual(Object.keys(indeks(d.baris)), ['per_proyek', 'per_negara', 'per_topik', 'per_kelompok']);
  assert.deepEqual(d.per_proyek, indeks(d.baris).per_proyek);
});
test('tanpa daftar tolak/data pribadi: tidak ada surel atau telepon', () => {
  assert.ok(!/[\w.+-]+@[\w-]+\.[\w.]+|\+\d[\d\s-]{8,}/.test(fs.readFileSync(new URL('../public/data/global/pelaku_global.json', import.meta.url), 'utf8')));
});
