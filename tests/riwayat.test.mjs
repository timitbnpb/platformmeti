// Riwayat perubahan (G1): diff pada fixture kecil, stabil terhadap urutan baris, kesegaran, rantai potret.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { potret, bandingkan, muatRantai, perubahanRantai, susunKeluaran, susunKesegaran } from '../scripts/pipa/riwayat.mjs';

const proyek = (baris) => ({ dibangun_pada: '2026-11-01', baris });
const A = { id: 'pj_1', nama: 'PLTS A', teknologi: 'surya', status: [{ nilai: 'rencana' }], kapasitas: [{ nilai: 10, satuan: 'MW' }], lokasi: { provinsi: 'Aceh' }, sumber: [{ url: 'https://a.example/x', tanggal: '2026-11-01' }], diperiksa: '2026-11-01' };
const B = { id: 'pj_2', nama: 'PLTB B', teknologi: 'bayu', status: [{ nilai: 'konstruksi' }], kapasitas: [{ nilai: 5, satuan: 'MW' }], lokasi: { provinsi: 'Bali' }, sumber: [{ url: 'https://b.example/y' }] };
const C = { id: 'pj_3', nama: 'PLTH C', teknologi: 'hidro', sumber: [] };

test('diff: tambah, hapus, ubah dengan nilai lama/baru dan sumber', () => {
  const lama = potret('proyek', proyek([A, B]), '2026-11-01');
  const baru = potret('proyek', proyek([{ ...A, status: [{ nilai: 'beroperasi' }], kapasitas: [{ nilai: 12, satuan: 'MW' }] }, C]), '2026-11-02');
  const d = bandingkan(lama, baru);
  assert.deepEqual(d.map((x) => [x.id, x.j, x.m || '']), [['pj_1', 'ubah', 'kapasitas'], ['pj_1', 'ubah', 'status'], ['pj_2', 'hapus', ''], ['pj_3', 'tambah', '']]);
  const st = d.find((x) => x.m === 'status');
  assert.deepEqual([st.a, st.b, st.u], ['rencana', 'beroperasi', 'https://a.example/x']);
  assert.deepEqual([d.find((x) => x.m === 'kapasitas').a, d.find((x) => x.m === 'kapasitas').b], ['10 MW', '12 MW']);
});

test('diff stabil terhadap urutan baris dan tidak peduli medan volatil (diperiksa, tanggal sumber)', () => {
  const x = potret('proyek', proyek([A, B, C]), 'x');
  const y = potret('proyek', proyek([C, B, { ...A, diperiksa: '2026-12-31', sumber: [{ url: 'https://a.example/x', tanggal: '2026-12-31' }] }]), 'y');
  assert.deepEqual(bandingkan(x, y), []);
  assert.deepEqual(Object.keys(x.baris), Object.keys(y.baris));
});

test('diff: perubahan isi di luar medan terpantau tercatat sebagai "lain"', () => {
  const x = potret('proyek', proyek([A]), 'x');
  const y = potret('proyek', proyek([{ ...A, catatan_baru: 'ada' }]), 'y');
  assert.deepEqual(bandingkan(x, y).map((c) => [c.j, c.m]), [['ubah', 'lain']]);
});

test('rantai potret dari berkas: urut tanggal, keluaran memuat jendela 30 hari dan indeks entitas', () => {
  const akar = mkdtempSync(join(tmpdir(), 'riwayat-'));
  const tulis = (tgl, baris) => { mkdirSync(join(akar, tgl)); writeFileSync(join(akar, tgl, 'proyek.json.gz'), gzipSync(JSON.stringify(potret('proyek', proyek(baris), tgl)))); };
  tulis('2026-09-01', [A]);
  tulis('2026-11-02', [A, B]);
  tulis('2026-11-03', [{ ...A, lokasi: { provinsi: 'Bali' } }, B]);
  const r = muatRantai('proyek', akar);
  assert.deepEqual(r.map((x) => x.tgl), ['2026-09-01', '2026-11-02', '2026-11-03']);
  assert.equal(perubahanRantai('proyek', r).length, 2);
  const { terbaru, entitas } = susunKeluaran({ proyek: r }, '2026-11-05', 30);
  assert.deepEqual(terbaru.perubahan.map((c) => [c.t, c.id, c.j, c.m || '']), [['2026-11-03', 'pj_1', 'ubah', 'provinsi'], ['2026-11-02', 'pj_2', 'tambah', '']]);
  assert.equal(terbaru.awal, '2026-09-01');
  assert.deepEqual(entitas.proyek.pj_1[0].slice(0, 5), ['2026-11-03', 'ubah', 'provinsi', 'Aceh', 'Bali']);
});

test('kesegaran: umur dan status segar/perlu/basi menurut ambang', () => {
  const baca = (f) => ({ 'proyek.json': proyek([A]), 'berita.json': { dibangun_pada: '2026-10-01', baris: [] } }[f] || (() => { throw new Error('tak ada'); })());
  const k = susunKesegaran('2026-11-10', baca);
  const per = Object.fromEntries(k.dataset.map((x) => [x.kunci, x]));
  assert.equal(per.proyek.umur, 9); assert.equal(per.proyek.status, 'segar');
  assert.equal(per.berita.status, 'basi');
  assert.deepEqual(per.proyek.sumber, [{ domain: 'a.example', baris: 1 }]);
});
