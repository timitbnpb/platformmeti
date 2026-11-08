// Katalog data terbuka: tiap berkas public/data/**.json tercatat atau dikecualikan dengan alasan, tanpa kontak/akun, sama dengan keluaran skrip.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { bangun, periksa } from '../scripts/pipa/katalog_data.mjs';

const o = bangun();
const semua = (d, h = []) => { for (const n of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, n.name); if (n.isDirectory()) semua(p, h); else if (n.name.endsWith('.json')) h.push(path.relative('public/data', p)); } return h; };

test('keluaran lolos periksa', () => assert.deepEqual(periksa(o), []));
test('tiap berkas data tercatat atau dikecualikan (tidak ada yang lolos)', () => {
  const ada = new Set([...o.berkas.map((b) => b.berkas), ...o.dikecualikan.map((b) => b.berkas), 'katalog_data.json']);
  assert.deepEqual(semua('public/data').filter((f) => !ada.has(f)), []);
});
test('berkas berisi surel atau telepon tidak masuk katalog', () => {
  const re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[a-z]{2,}/;
  for (const b of o.berkas) assert.ok(!re.test(fs.readFileSync('public/data/' + b.berkas, 'utf8')), b.berkas);
  assert.ok(o.dikecualikan.some((b) => b.berkas === 'organisasi.json' && b.alasan === 'kontak-atau-akun'));
});
test('katalog sendiri tidak memuat kontak dan tanpa em dash', () => {
  const s = fs.readFileSync('public/data/katalog_data.json', 'utf8');
  assert.ok(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[a-z]{2,}/.test(s)); assert.ok(!s.includes('—'));
});
test('jalur CSV menunjuk larik nyata berisi objek', () => {
  for (const b of o.berkas.filter((x) => x.csv != null).slice(0, 80)) {
    const d = JSON.parse(fs.readFileSync('public/data/' + b.berkas, 'utf8')), r = b.csv === '' ? d : d[b.csv];
    assert.ok(Array.isArray(r) && r.length && typeof r[0] === 'object', b.berkas);
  }
});
test('daftar tolak lokal: bila ada, status diperiksa dicatat', { skip: !fs.existsSync('data-panen/orang/daftar-tolak-calon.jsonl') }, () => assert.equal(o.daftar_tolak_diperiksa, true));
test('berkas terbit sama dengan keluaran skrip (kecuali tanggal bangun)', { skip: !fs.existsSync('public/data/katalog_data.json') }, () => {
  const t = JSON.parse(fs.readFileSync('public/data/katalog_data.json', 'utf8'));
  assert.equal(t.jumlah, o.jumlah); assert.deepEqual(t.berkas.map((b) => b.berkas), o.berkas.map((b) => b.berkas));
});

import { keCsv, barisDari, bahanSitasi } from '../public/data_unduh.js';
test('keCsv: BOM, kutip koma dan tanda kutip, larik skalar digabung, objek bersarang dibuang', () => {
  const c = keCsv([{ a: 1, b: 'x,y', c: ['p', 'q'], d: { z: 1 } }, { a: 2, b: 'say "hi"', c: null }]);
  assert.equal(c, '﻿a,b,c\r\n1,"x,y",p; q\r\n2,"say ""hi""",\r\n');
});
test('barisDari: akar atau kunci; bahanSitasi memakai tanggal bangun dan tautan berkas', () => {
  assert.deepEqual(barisDari([1], ''), [1]); assert.deepEqual(barisDari({ baris: [2] }, 'baris'), [2]);
  const x = bahanSitasi({ berkas: 'a/b.json', judul: { id: 'Judul' }, sumber: { nama: 'ESDM' }, dibangun: '2026-11-08' }, { origin: 'https://x.test', akses: '2026-11-09' });
  assert.deepEqual(x, { sumber: 'ESDM', tahun: '2026', judul: 'Judul', tanggal: '2026-11-08', url: 'https://x.test/data/a/b.json', akses: '2026-11-09' });
});
