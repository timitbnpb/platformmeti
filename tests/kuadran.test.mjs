// Kuadran pemain EBT: rumus (ALGORITMA §5), aturan "tanpa sumber = null", kamus id/en, data terbit tidak basi.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { persentil, peringkat, median, bagiPemilik, bangun, muat, NMIN } from '../scripts/pipa/kuadran.mjs';

const j = (p) => JSON.parse(fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const D = j('public/data/kuadran.json');

test('persentil dan peringkat mengikuti contoh ALGORITMA §5.1', () => {
  const v = [0, 150, 150, 600, 2000];
  assert.equal(persentil(v, 600), 0.7); assert.equal(persentil(v, 150), 0.4); assert.equal(persentil(v, 0), 0.1);
  assert.equal(persentil(v.slice(0, NMIN - 1), 1), null);
  assert.equal(persentil(v, null), null);
  assert.equal(peringkat(v, 150), 3); assert.equal(peringkat(v, 2000), 1);
  assert.equal(median([5, 1, 3, 2]), 2.5);
});

test('bagiPemilik: persen tertulis dipakai, kosong berbagi sisa rata dan bertanda est', () => {
  const r = bagiPemilik([{ nama: 'A', persen: 60 }, { nama: 'B', persen: null }, { nama: 'C', persen: null }]);
  assert.deepEqual(r.map((x) => x.bagian), [0.6, 0.2, 0.2]);
  assert.deepEqual(r.map((x) => x.est), [false, true, true]);
  assert.deepEqual(bagiPemilik([{ nama: 'A', persen: 100 }, { nama: 'B', persen: null }]).map((x) => x.bagian), [1, 0]);
});

test('skor 0..5; tanpa angka = null (bukan nol) dan tanpa sumber; skor terisi wajib alasan, sumber bertanggal', () => {
  const UK = D.ukuran.map((u) => u.kunci);
  assert.equal(UK.length, 8);
  assert.equal(D.status_uji, 'hipotesis');
  for (const e of D.entitas) for (const u of UK) {
    const s = e.skor[u];
    assert.ok(s.alasan.id && s.alasan.en, `${e.id}.${u}: alasan`);
    if (s.skor == null) { assert.equal(s.mentah, null, `${e.id}.${u}: null harus tanpa mentah`); continue; }
    assert.ok(s.skor >= 0 && s.skor <= 5, `${e.id}.${u}: ${s.skor}`);
    assert.ok(s.sumber.length >= 1, `${e.id}.${u}: skor tanpa sumber`);
    for (const x of s.sumber) { assert.match(x.url, /^(https:\/\/|\/data\/)/); assert.ok(x.tanggal, `${e.id}.${u}: tanggal`); }
    assert.ok(s.peringkat >= 1 && s.peringkat <= s.dari);
  }
  for (const u of D.ukuran) assert.ok(u.rumus.id && u.rumus.en && u.rumus.id.length > 30, 'rumus tertulis');
});

test('ukuran berpersentil hanya terisi bila sedikitnya NMIN pemain bernilai', () => {
  for (const u of ['kapasitas', 'pipeline', 'prioritas', 'keaktifan', 'risiko']) assert.ok(D.entitas.filter((e) => e.skor[u].skor != null).length >= NMIN, u);
});

test('kepemilikan: tiap sisi bersumber https dan bertanggal; persen angka atau null; simpul dikenal', () => {
  const ada = new Set([...D.entitas.map((e) => e.id), ...Object.keys(D.simpul_luar)]);
  assert.ok(D.sisi.length >= 5);
  for (const s of D.sisi) {
    assert.match(s.url, /^https:\/\//); assert.match(s.tanggal, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(s.persen === null || (s.persen > 0 && s.persen <= 100));
    assert.ok(ada.has(s.induk) && ada.has(s.anak), `${s.induk} ${s.anak}`);
  }
});

test('aliran pendapatan: lini tidak melebihi total, bersumber', () => {
  for (const e of D.entitas.filter((x) => x.aliran)) {
    const a = e.aliran; assert.ok(a.lini.reduce((s, l) => s + l.nilai, 0) <= a.total + 1e-6);
    for (const l of a.lini) assert.match(l.sumber_url, /^https:\/\//);
  }
});

test('public/data/kuadran.json sama dengan hasil bangun terkini (jalankan node scripts/pipa/kuadran.mjs)', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(bangun(muat()))), D);
});

test('kamus /i18n/kuadran.json: id dan en setara, parameter sama, tanpa em dash/titik tengah; kunci yang dipakai kuadran.js ada', () => {
  const K = j('public/i18n/kuadran.json');
  assert.deepEqual(Object.keys(K.id).sort(), Object.keys(K.en).sort());
  const p = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const [k, v] of Object.entries(K.id)) { assert.ok(v && K.en[k], k); assert.equal(p(K.en[k]), p(v), k); assert.doesNotMatch(v + K.en[k], /[—·→]/); }
  const js = fs.readFileSync(new URL('../public/kuadran.js', import.meta.url), 'utf8');
  for (const m of js.matchAll(/\bk\(\s*"([\w.]+)"/g)) if (!m[1].endsWith(".")) assert.ok(m[1] in K.id || Object.keys(K.id).some((x) => x.startsWith(m[1])), `k("${m[1]}") tak ada`);
  for (const u of D.ukuran.map((x) => x.kunci)) for (const pre of ['u.', 'us.']) assert.ok(pre + u in K.id, pre + u);
  D.pasangan.forEach((_, i) => { assert.ok(`p.${i}` in K.id); for (const q of ['ka', 'ki', 'kb', 'kib']) assert.ok(`p.${i}.${q}` in K.id); });
  for (const e of D.entitas) assert.ok('sek.' + e.kategori in K.id, e.kategori);
  for (const e of D.entitas) for (const l of e.aliran?.lini || []) assert.ok('aliran.' + l.kunci in K.id);
});

test('kuadran.html: tanpa style=, memuat kuadran.js dan css', () => {
  const h = fs.readFileSync(new URL('../public/kuadran.html', import.meta.url), 'utf8');
  assert.doesNotMatch(h, /\sstyle\s*=/); assert.match(h, /kuadran\.js/); assert.match(h, /kuadran\.css/);
});
