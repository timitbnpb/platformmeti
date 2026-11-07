// /risiko: skor risiko (komponen tanpa data dikeluarkan), pustaka ubin, dan invarian data/ukuran geometri.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { skor, BOBOT, kelasSkor } from '../scripts/pipa/risiko_proyek.mjs';
import { dalamFitur, uraiPng, ubinDari, lonLatUbin } from '../scripts/panen/risiko_lib.mjs';

test('skor: komponen tanpa data dikeluarkan dan bobot dinormalkan', () => {
  const h = skor({ hutan: [{ kelas: 'Hutan Lindung', desc: 'Hutan Lindung' }], gambut: false, adat: [], bahaya: { multi: 0.5, banjir: 0.2 } });
  const w = BOBOT.hutan + BOBOT.gambut + BOBOT.bahaya; // adat tak punya poligon: dikeluarkan
  assert.deepEqual(h.dikeluarkan, ['adat']);
  assert.equal(h.skor, Math.round((BOBOT.hutan * 100 + BOBOT.gambut * 0 + BOBOT.bahaya * 50) / w));
  assert.equal(h.kelas, kelasSkor(h.skor));
});
test('skor: kurang dari dua komponen = tidak dinilai', () => {
  const h = skor({ hutan: null, gambut: undefined, adat: [], bahaya: { multi: 0.9 } });
  assert.equal(h.skor, null); assert.equal(h.kelas, null);
});
test('skor: konservasi mengalahkan produksi bila poligon bertumpuk', () => {
  const h = skor({ hutan: [{ desc: 'Hutan Produksi Tetap' }, { desc: 'Taman Nasional' }], gambut: false, adat: [], bahaya: null });
  assert.equal(h.komponen.hutan.v, 100); assert.equal(h.komponen.hutan.ket, 'konservasi');
});
test('kelasSkor memakai ambang', () => {
  assert.equal(kelasSkor(10), 'rendah'); assert.equal(kelasSkor(25), 'sedang'); assert.equal(kelasSkor(45), 'tinggi'); assert.equal(kelasSkor(90), 'sangat-tinggi');
});
test('titik di dalam poligon dengan lubang (genap-ganjil)', () => {
  const luar = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]], lubang = [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]];
  assert.equal(dalamFitur([luar, lubang], 2, 2), true); assert.equal(dalamFitur([luar, lubang], 5, 5), false); assert.equal(dalamFitur([luar, lubang], 11, 5), false);
});
test('matematika ubin bolak-balik', () => {
  const u = ubinDari(101.5, -0.5, 8); const [lon, lat] = lonLatUbin(8, u.x, u.y, (u.xf - u.x) * 4096, (u.yf - u.y) * 4096);
  assert.ok(Math.abs(lon - 101.5) < 1e-6 && Math.abs(lat + 0.5) < 1e-6);
});
test('uraiPng membaca RGBA 2x1 berfilter Sub', () => {
  const crc = (b) => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let r = 0xffffffff; for (const x of b) r = t[(r ^ x) & 255] ^ (r >>> 8); return (r ^ 0xffffffff) >>> 0; };
  const chunk = (tp, d) => { const b = Buffer.concat([Buffer.from(tp), d]), o = Buffer.alloc(4); o.writeUInt32BE(d.length); const c = Buffer.alloc(4); c.writeUInt32BE(crc(b)); return Buffer.concat([o, b, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(2, 0); ih.writeUInt32BE(1, 4); ih[8] = 8; ih[9] = 6;
  const raw = Buffer.from([1, 10, 20, 30, 255, 5, 5, 5, 0]); // Sub: piksel 2 = piksel 1 + delta
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  const im = uraiPng(png); assert.deepEqual(im.ambil(0, 0), [10, 20, 30, 255]); assert.deepEqual(im.ambil(1, 0), [15, 25, 35, 255]);
});
test('data/risiko_proyek.json: bobot Hipotesis, geometri <= 5 MB total, tiap sumber https', { skip: !fs.existsSync('public/data/risiko_proyek.json') }, () => {
  const d = JSON.parse(fs.readFileSync('public/data/risiko_proyek.json', 'utf8'));
  assert.equal(d.meta.status_bobot, 'Hipotesis');
  assert.ok(Math.abs(Object.values(d.meta.bobot).reduce((a, b) => a + b, 0) - 1) < 1e-9);
  for (const r of d.baris) { assert.ok(r.presisi !== 'provinsi'); if (r.skor != null) assert.ok(r.skor >= 0 && r.skor <= 100 && r.kelas); }
  let byte = 0; for (const f of fs.readdirSync('public/data/geo')) if (f.startsWith('risiko_')) byte += fs.statSync('public/data/geo/' + f).size;
  assert.ok(byte <= 5 * 1024 * 1024, 'geometri ' + byte);
  for (const s of d.meta.sumber.filter((s) => s.id !== 'proyek')) assert.match(s.url, /^https:\/\//);
});
