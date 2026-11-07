// Uji turunan /proyek-besar, /proyek-berhenti, tenaga kerja EST: bangun() murni + berkas keluaran terbaru.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bangun, tingkat, faktorKerja, AMBANG_MW } from '../scripts/pipa/proyek_besar.mjs';
const J = (f) => JSON.parse(readFileSync(new URL('../' + f, import.meta.url), 'utf8'));
const F = J('data/metode/faktor_kerja.json');
const P = (o) => ({ id: 'x', nama: 'PLTS X', teknologi: 'surya', kapasitas: [{ nilai: 200, satuan: 'MW' }], status: [{ nilai: 'rencana' }], tingkat_bukti: 'resmi', sumber: [{ url: 'https://a.test', tanggal: '2026-11-07', jenis: 'ruptl' }], ...o });

test('faktor kerja dikutip dengan url dan tahun', () => {
  for (const s of F.sumber) { assert.match(s.url, /^https:\/\//); assert.ok(Number.isInteger(s.tahun)); }
  assert.equal(F.faktor.surya.konstruksi, 13.0);
});
test('tingkat bukti: operasi, PPA, RUPTL, EST', () => {
  assert.equal(tingkat(P({ status: [{ nilai: 'beroperasi' }] })), 'beroperasi');
  assert.equal(tingkat(P({ status: [{ nilai: 'rencana', status_asli: 'PPA' }], program_ids: ['ruptl'] })), 'ppa');
  assert.equal(tingkat(P({ program_ids: ['ruptl'] })), 'ruptl');
  assert.equal(tingkat(P({})), 'est');
});
test('kerja EST = MW x faktor x pengali; penyimpanan tanpa faktor', () => {
  assert.deepEqual(faktorKerja(P({}), F), { konstruksi: Math.round(200 * 13 * 2.4), om: Math.round(200 * 0.7 * 2.4) });
  assert.equal(faktorKerja(P({ teknologi: 'penyimpanan' }), F), null);
});
test('ganda, baterai, berhenti, anak usaha dikeluarkan dari jumlah', () => {
  const o = [{ id: 'o1', induk: 'Induk' }];
  const d = bangun({ baris: [P({ id: 'a' }), P({ id: 'b' }), P({ id: 'c', nama: 'BESS', teknologi: 'penyimpanan' }), P({ id: 'd', nama: 'PLTS Y', status: [{ nilai: 'dibatalkan' }] }),
    P({ id: 'e', nama: 'PLTS Z', pihak: { pemilik: [{ nilai: 'Anak', organisasi_id: 'o1' }] } }), P({ id: 'f', nama: 'kecil', kapasitas: [{ nilai: AMBANG_MW - 1, satuan: 'MW' }] })] }, o, F, '2026-11-08');
  assert.equal(Object.values(d.besar).flat().length, 2);
  assert.deepEqual(d.dikeluarkan.map((x) => x.alasan).sort(), ['anak', 'berhenti', 'ganda', 'penyimpanan']);
  assert.equal(d.berhenti.baris.filter((b) => b.jenis === 'batal').length, 1);
});
test('berhenti wajib bersumber', () => {
  const d = bangun({ baris: [P({ id: 'z', status: [{ nilai: 'dibatalkan' }], sumber: [] })] }, [], F, '2026-11-08');
  assert.equal(d.berhenti.baris.length, 0);
});
test('keluaran public/data/proyek_besar.json konsisten', () => {
  const d = J('public/data/proyek_besar.json');
  assert.ok(Object.values(d.besar).flat().every((r) => r.mw >= d.ambang_mw));
  assert.ok(d.berhenti.baris.every((b) => /^https?:\/\//.test(b.sumber_url)));
});
