import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { jenisPendana, teknologiDariJudul, rakitPendana, JENIS_SKEMA, periksa, negaraDari, jagaNilai, rakitNegara, proyekDariIati, proyekDariObligasi, KURS } from '../scripts/pipa/pendanaan.mjs';

const d = JSON.parse(fs.readFileSync(new URL('../public/data/pendanaan.json', import.meta.url), 'utf8'));
const skema = d.pendanaan.filter((x) => x.jenis_entri === 'skema'), proyek = d.pendanaan.filter((x) => x.jenis_entri === 'proyek');

test('pendanaan.json: semua baris bersumber, id unik, tanpa em dash', () => {
  assert.deepEqual(d.pendanaan.flatMap(periksa), []);
  assert.equal(new Set(d.pendanaan.map((x) => x.id)).size, d.pendanaan.length);
  assert.ok(!/[—–]/.test(JSON.stringify(d)));
  assert.equal(d.kurs.usd_idr, KURS.usd_idr);
});
test('delapan jenis skema semuanya ada, tiap skema punya pemberi, sasaran, cara, tautan', () => {
  for (const j of JENIS_SKEMA) assert.ok(skema.some((s) => s.jenis === j), j);
  assert.equal(d.ringkasan.skema_per_jenis.reduce((a, r) => a + r.jumlah, 0), skema.length);
});
test('ringkasan: total proyek = jumlah nilai; tidak ada nilai di atas batas', () => {
  const t = proyek.reduce((a, p) => a + (p.nilai_usd || 0), 0);
  assert.equal(d.ringkasan.total_proyek_usd, t);
  assert.ok(proyek.every((p) => !(p.nilai_usd > 5e9)));
  assert.ok(d.ringkasan.nilai_per_pemberi.length <= 10);
});
test('negara donor: total sama dengan proyek tiap negara, tanpa lembaga multilateral', () => {
  assert.ok(d.negara.length >= 10);
  for (const n of d.negara) {
    const ps = proyek.filter((p) => n.proyek_pendanaan_ids.includes(p.id));
    assert.equal(n.total_usd, ps.reduce((a, p) => a + (p.nilai_usd || 0), 0));
    assert.equal(n.jumlah_proyek, ps.length);
    assert.ok(!n.badan.some((b) => /Asian Development Bank|Green Climate|World Bank/.test(b)));
  }
});
test('negaraDari, jagaNilai, fasilitas multinegara tidak dijumlahkan, obligasi IDR dikurs', () => {
  assert.deepEqual(negaraDari('DE-1'), ['Jerman', 'DE']);
  assert.deepEqual(negaraDari('XM-DAC-701-8'), ['Jepang', 'JP']);
  assert.equal(negaraDari('XM-DAC-46004'), null);
  assert.equal(jagaNilai({ nilai_usd: 6e9 }).nilai_usd, undefined);
  const r = { id: 'x', nama: 'Climate Investor One', pemberi: 'Green Climate Fund', nilai_usd: 8e8, satuan_nilai: 's', tahun: 2020, status: 'Pipeline', sumber_url: 'https://a.id', tanggal: '2026-11-08', tingkat_bukti: 'resmi' };
  assert.equal(proyekDariIati(r).nilai_usd, undefined);
  assert.equal(proyekDariIati({ ...r, nama: 'Proyek PLTS', pemberi: 'ADB', porsi_energi_persen: 50 }).nilai_usd, 4e8);
  assert.equal(proyekDariObligasi({ instrumen: 'o', penerbit: 'P', nilai: 1815, satuan_nilai: 'IDR miliar', tahun: 2024, sumber_url: 'https://a.id', tanggal: 't', tingkat_bukti: 'resmi' }).nilai_usd, 1815e9 / KURS.usd_idr | 0 || Math.round(1815e9 / KURS.usd_idr));
  assert.equal(rakitNegara([{ id: 'a', pemberi_ref: 'DE-1', pemberi: 'BMZ', nilai_usd: 5, nama: 'n', sumber_url: 'u' }])[0].iso2, 'DE');
});
test('pendana: peringkat urut, jumlah sama dengan proyek, MW hanya bila tertaut, tanpa angka karangan', () => {
  assert.ok(d.pendana.length >= 20);
  d.pendana.forEach((x, i) => { assert.equal(x.peringkat, i + 1); assert.equal(x.jumlah_proyek, x.proyek_ids.length); assert.ok(x.proyek_ids.every((id) => proyek.some((p) => p.id === id && p.pemberi))); });
  for (let i = 1; i < d.pendana.length; i++) assert.ok(d.pendana[i - 1].jumlah_proyek >= d.pendana[i].jumlah_proyek);
  assert.ok(d.pendana.every((x) => x.nilai_usd === x.proyek_ids.reduce((a, id) => a + (proyek.find((p) => p.id === id).nilai_usd || 0), 0)));
  assert.ok(d.pendana.every((x) => x.total_mw == null || x.mw_n > 0));
});
test('jenisPendana, teknologiDariJudul, rakitPendana memakai MW proyek tertaut', () => {
  assert.equal(jenisPendana('Asian Development Bank'), 'multilateral dan DFI');
  assert.equal(jenisPendana('Sweden'), 'pemerintah donor');
  assert.deepEqual(teknologiDariJudul('Floating Solar and Wind'), ['surya', 'bayu']);
  const r = rakitPendana([{ id: 'a', pemberi: 'X', nama: 'PLTS', nilai_usd: 5, proyek_id: 'pj1' }, { id: 'b', pemberi: 'X', nama: 'n' }], [{ id: 'pj1', teknologi: 'surya', kapasitas: [{ nilai: 60, satuan: 'MW' }] }]);
  assert.equal(r[0].total_mw, 60); assert.equal(r[0].jumlah_proyek, 2); assert.deepEqual(r[0].teknologi, ['surya']);
  assert.equal(rakitPendana([{ id: 'a', pemberi: 'Y', nama: 'n' }])[0].total_mw, null);
});
