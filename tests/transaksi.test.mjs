// public/data/transaksi.json: tiap baris bersumber https, tingkat bukti sah, nilai hanya bila sumber menyebut, id organisasi/proyek menunjuk baris nyata.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun } from '../scripts/pipa/transaksi.mjs';

const baca = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), 'utf8'));
const D = baca('../public/data/transaksi.json'), ORG = new Set(baca('../public/data/organisasi.json').baris.map((o) => o.id)), PJ = new Set(baca('../public/data/proyek.json').baris.map((p) => p.id));
const JENIS = new Set(['ma', 'ipo', 'obligasi', 'pembiayaan', 'pma', 'jv']), STATUS = new Set(['selesai', 'diumumkan', 'batal']), BUKTI = new Set(['resmi', 'media', 'kata-pihak', 'via-pihak-ketiga']);
const SEMUA_I18N = ['id', 'en'].map((l) => baca(`../public/i18n/${l}.json`));

test('baris: sumber https, jenis/status/bukti sah, tanggal berpresisi, id unik', () => {
  assert.ok(D.baris.length >= 20);
  assert.equal(new Set(D.baris.map((r) => r.id)).size, D.baris.length);
  for (const r of D.baris) {
    assert.ok(JENIS.has(r.jenis) && STATUS.has(r.status) && BUKTI.has(r.tingkat_bukti), r.id);
    assert.match(r.sumber.url, /^https:\/\//, r.id); assert.ok(r.sumber.judul && r.sumber.penerbit, r.id);
    assert.match(r.tanggal, /^\d{4}(-\d{2}(-\d{2})?)?$/, r.id); assert.equal(r.presisi, { 4: 'tahun', 7: 'bulan', 10: 'hari' }[r.tanggal.length]);
    assert.ok(r.pihak.length >= 1 && r.pihak.every((p) => p.nama && typeof p.negara === 'string'), r.id);
    assert.ok(r.aset && r.aset.length < 200, r.id); assert.ok(r.mw == null || r.mw > 0);
    assert.ok(r.nilai == null || (r.nilai.jumlah > 0 && r.nilai.usd_juta > 0 && r.nilai.idr_miliar > 0), r.id);
  }
});
test('id organisasi dan proyek menunjuk baris nyata; bendera tersedia', () => {
  for (const r of D.baris) {
    for (const p of r.pihak) { assert.ok(p.org_id == null || ORG.has(p.org_id), p.nama); if (p.negara) assert.ok(fs.existsSync(new URL(`../public/img/bendera/${p.negara}.svg`, import.meta.url)), p.negara); }
    for (const id of r.proyek_id) assert.ok(PJ.has(id), id);
  }
});
test('nilai mata uang asing dari kurs ditandai EST; transaksi batal/diumumkan tidak punya status selesai', () => {
  for (const r of D.baris.filter((x) => x.nilai)) { const n = r.nilai; assert.equal(n.est, n.est_usd || n.est_idr); if (n.mu === 'USD') assert.equal(n.usd_juta, n.jumlah); }
  assert.ok(D.baris.filter((r) => r.status === 'batal').every((r) => r.jenis === 'ma'));
});
test('bangun() murni: kurs mengubah IDR ke USD, berita dicocokkan, id ganda ditolak', () => {
  const seed = [{ id: 'a', tanggal: '2026-01-02', jenis: 'obligasi', nilai: { jumlah: 1000, mu: 'IDR' }, status: 'selesai', bukti: 'media', pihak: [['penerbit', 'X', null, 'id']], aset: 'a', sumber: { judul: 'j', penerbit: 'p', url: 'https://x.id' } },
    { id: 'b', berita: 'Judul Contoh', jenis: 'jv', nilai: null, status: 'diumumkan', bukti: 'media', pihak: [['mitra', 'Y', null, 'sg']], aset: 'b' }];
  const o = bangun({ seed, kh: { instrumen_hijau: [] }, berita: [{ judul: 'Judul Contoh dua', media: 'M', url: 'https://m.id/1', terbit: '2026-03-04T00:00:00Z' }], organisasi: [], kurs: 20000, hariIni: '2026-11-08' });
  const a = o.baris.find((r) => r.id === 'a'); assert.equal(a.nilai.usd_juta, 50); assert.ok(a.nilai.est_usd && !a.nilai.est_idr);
  assert.equal(o.baris.find((r) => r.id === 'b').tanggal, '2026-03-04');
  assert.throws(() => bangun({ seed: [seed[0], seed[0]], kh: { instrumen_hijau: [] }, berita: [], organisasi: [], kurs: 1, hariIni: 'x' }), /ganda/);
});
test('i18n tr3.*: kunci id dan en setara, tanpa em dash, tanpa huruf kapital penuh', () => {
  const [id, en] = SEMUA_I18N, k = (m) => Object.keys(m).filter((x) => x.startsWith('tr3.')).sort();
  assert.deepEqual(k(id), k(en)); assert.ok(k(id).length > 80);
  for (const m of SEMUA_I18N) for (const x of k(m)) { assert.ok(!/[–—]/.test(m[x]), x); assert.ok(m[x].length < 4 || m[x] !== m[x].toUpperCase(), x); }
});
