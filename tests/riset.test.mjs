import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { periksaKarya, provDalamTeks, cocokPakar, gabungKarya, bangunTopik, karyaDariGaruda, SEKTOR_SAH, POLA_TOPIK, RUMPUN } from '../scripts/pipa/riset.mjs';

const baca = (f) => JSON.parse(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'));
const riset = baca('public/data/riset.json'), pusat = baca('public/data/pusat_studi.json'), aset = baca('public/data/aset_riset.json'), topik = baca('public/data/topik_riset.json');
const wil = baca('public/data/wilayah.json').baris.map((b) => ({ kode: String(b.kode), nama: b.nama }));
const kodeSah = new Set(wil.map((w) => w.kode));
const KAPITAL = /\b[A-Z]{6,}\b/;

test('riset.json: skema, id unik, sumber wajib, dua sumber hadir', () => {
  assert.ok(riset.length >= 2000);
  assert.equal(new Set(riset.map((k) => k.id)).size, riset.length);
  assert.deepEqual(riset.flatMap(periksaKarya), []);
  assert.ok(riset.some((k) => k.sumber === 'openalex') && riset.filter((k) => k.sumber === 'garuda').length >= 400);
  for (const s of Object.keys(RUMPUN)) assert.ok(riset.some((k) => k.sektor.includes(s)), 'rumpun kosong: ' + s);
  for (const k of riset) for (const w of k.wilayah) assert.ok(kodeSah.has(w.prov), k.id);
});
test('tanpa data pribadi: surel, telepon, 1001startup di keempat berkas', () => {
  for (const d of [riset, pusat, aset, topik]) {
    const s = JSON.stringify(d);
    assert.ok(!/@[\w-]+\.\w{2,}/.test(s) && !/"(email|telepon|kontak)"/.test(s) && !/1001startup/i.test(s));
  }
});
test('pusat_studi.json: terverifikasi, bersumber, provinsi sah, tanpa KAPITAL', () => {
  assert.ok(pusat.length >= 10);
  for (const x of pusat) {
    assert.equal(x.nama_terverifikasi, true, x.nama);
    assert.ok(/^https:\/\//.test(x.web) && /^https:\/\//.test(x.sumber_url) && x.diperiksa && x.tingkat_bukti, x.nama);
    assert.ok(kodeSah.has(x.prov), x.nama);
    assert.ok(!KAPITAL.test(x.nama) && !/—/.test(x.nama), x.nama);
  }
});
test('aset_riset.json: tiap butir bersumber dan diperiksa; seed hanya yang terverifikasi', () => {
  assert.ok(aset.length >= 3);
  assert.equal(new Set(aset.map((a) => a.id)).size, aset.length);
  for (const a of aset) {
    assert.ok(a.nama && a.jenis && a.pemilik && /^https:\/\//.test(a.sumber_url) && a.diperiksa && a.tingkat_bukti, a.id);
    assert.ok(!a.prov || kodeSah.has(a.prov), a.id);
    assert.ok(a.sektor.every((s) => SEKTOR_SAH.has(s)), a.id);
    assert.ok(!/—/.test(JSON.stringify(a)), a.id);
  }
});
test('topik_riset.json: satu topik per program, tautan program hidup, hitungan konsisten', () => {
  const prog = baca('public/data/program_analisis.json').baris;
  assert.deepEqual(topik.kejadian.map((k) => k.program).sort(), prog.map((p) => p.kode).sort());
  for (const k of topik.kejadian) {
    assert.ok(SEKTOR_SAH.has(k.jenis) || k.jenis, k.id);
    assert.ok(k.riset.works_total >= k.riset.works.length && k.riset.works.length <= 10, k.id);
    for (const w of k.riset.works) assert.ok(riset.some((r) => r.id === w.id), w.id);
    assert.ok(!k.tanggal || /^\d{4}-\d\d-\d\d$/.test(k.tanggal), k.id);
    const pola = POLA_TOPIK[k.id]; if (pola) assert.equal(k.riset.works_total, riset.filter((r) => pola.test(r.judul)).length, k.id);
  }
  assert.deepEqual(bangunTopik({ baris: [] }, [], '2026-11-08').kejadian, []);
});
test('provDalamTeks: Papua tidak menempel di Papua Barat; cocokPakar menolak nama kembar', () => {
  const k = (t) => provDalamTeks(t, wil).map((c) => wil.find((w) => w.kode === c).nama);
  assert.deepEqual(k('Potensi surya di Papua Barat'), ['Papua Barat']);
  assert.deepEqual(k('PLTS di Papua dan Papua Barat'), ['Papua', 'Papua Barat']);
  assert.deepEqual(k('Energi di Indonesia'), []);
  const o = [{ id: 'a', nama: 'Budi Santoso' }, { id: 'b', nama: 'Dr. Budi Santoso, M.T.' }, { id: 'c', nama: 'Siti Aminah' }];
  assert.equal(cocokPakar('Budi Santoso', o), '');
  assert.equal(cocokPakar('Siti Aminah', o), 'c');
});
test('gabungKarya menyatukan rumpun; Garuda tanpa topik dikenal dibuang', () => {
  const x = { id: 'W1', judul: 'a', sektor: ['surya'], sitasi: 3, tahun: 2020 };
  assert.deepEqual(gabungKarya([x, { ...x, sektor: ['bayu'] }])[0].sektor, ['bayu', 'surya']);
  assert.equal(karyaDariGaruda({ garuda_id: '1', judul: 'j', topik: ['xx'] }, { wil, orang: [] }), null);
});
test('periksaKarya menolak: tanpa sumber_url, sektor asing, pola surel', () => {
  const ok = { id: 'W1', judul: 'a', sektor: ['surya'], sumber_url: 'https://openalex.org/W1' };
  assert.deepEqual(periksaKarya(ok), []);
  assert.equal(periksaKarya({ ...ok, sumber_url: '' }).length, 1);
  assert.equal(periksaKarya({ ...ok, sektor: ['zz'] }).length, 1);
  assert.equal(periksaKarya({ ...ok, penulis: ['a@b.id'] }).length, 1);
});
test('skrip panen sopan (UA METI, robots, jeda) dan kunci i18n tab Riset ada di id dan en', () => {
  const s = fs.readFileSync(new URL('../scripts/pipa/riset.mjs', import.meta.url), 'utf8');
  assert.match(s, /from '\.\/_panen_sopan\.mjs'/);
  assert.match(s, /mailto=/);
  for (const l of ['id', 'en']) { const d = baca(`public/i18n/${l}.json`); for (const k of ['dir.isu.satuan', 'dir.riset.ringkas_tunda', 'dir.topik.program']) assert.ok(d[k], l + ' ' + k); }
});

test('pakar_riset, hibah_riset, dataset_riset: bersumber, tanpa surel, sektor sah, orang_id nyata', () => {
  const pakar = baca('public/data/pakar_riset.json'), hibah = baca('public/data/hibah_riset.json'), ds = baca('public/data/dataset_riset.json');
  const orang = new Set(baca('public/data/orang.json').baris.map((o) => o.id));
  assert.ok(pakar.length >= 100 && hibah.length >= 50 && ds.length >= 5);
  for (const x of [...pakar, ...hibah, ...ds]) {
    assert.ok(/^https:\/\//.test(x.sumber_url) && x.tingkat_bukti, x.id);
    assert.ok(!(x.sektor || []).some((s) => !SEKTOR_SAH.has(s)), x.id);
    assert.ok(!/[—·]/.test(JSON.stringify(x)) && !/@[\w-]+\.\w{2,}/.test(JSON.stringify(x)), x.id);
  }
  for (const x of pakar) assert.ok(!x.orang_id || orang.has(x.orang_id), x.id);
  assert.equal(new Set(hibah.map((x) => x.id)).size, hibah.length);
  assert.ok(!ds.some((x) => /irena/i.test(x.id)), 'IRENA 403: harus terbuang');
});
