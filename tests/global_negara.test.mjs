import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { bangunDeret, bangunPub, bangunBauran, parseCsv } from '../scripts/panen/global_negara.mjs';
import { teknologiDari, barisBu, tautkan, bersihTeks } from '../scripts/panen/global_negara_pembiayaan.mjs';
import { cocokKabupaten, urai, angin100 } from '../scripts/panen/global_negara_atlas.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const BUKTI = new Set(['resmi', 'situs-sendiri', 'kata-pihak', 'cuplikan', 'via-pihak-ketiga', 'kajian']);
const TGL = /^\d{4}-\d\d-\d\d$/;

test('pembanding: deret IRENA hanya grid All dan tahun >= 2010', () => {
  const r = (g, y, v) => ({ 'Country/area': 'India', Technology: 'Solar photovoltaic', 'Data Type': 'Electrical Installed Capacity (MW)', 'Grid connection': g, Year: String(y), nilai: v });
  assert.deepEqual(bangunDeret([r('All', 2020, 5), r('On-grid', 2020, 4), r('All', 2009, 1)]).IND.kapasitas_mw.surya, { 2020: 5 });
});
test('pembanding: investasi publik memisah EBT dan non-EBT; bauran memilih tahun terbaru', () => {
  const p = bangunPub([{ 'Country/area': 'China', Technology: 'Wind energy', Year: '2020', nilai: 3 }, { 'Country/area': 'China', Technology: 'Coal', Year: '2020', nilai: 1 }]);
  assert.equal(p.CHN[2020].ebt, 3); assert.equal(p.CHN[2020].non_ebt, 1);
  const b = bangunBauran(parseCsv('country,year,iso_code,renewables_share_elec\nChina,2023,CHN,30\nChina,2024,CHN,33'));
  assert.equal(b.CHN.tahun_terbaru, 2024); assert.equal(b.CHN.persen_terbaru.ebt_total, 33);
});
test('pembanding: berkas terbangun konsisten (12 negara, iso2 unik, tautan lelang tertaut, bukti sah)', () => {
  const d = J('public/data/global/negara_pembanding.json'), l = J('public/data/global/lelang_dunia.json');
  assert.equal(d.baris.length, 12); assert.equal(new Set(d.baris.map((b) => b.iso2)).size, 12);
  for (const n of ['VN', 'PH', 'TH', 'MY', 'IN', 'CN', 'AU', 'BR', 'ZA', 'CL', 'SA', 'ID']) assert.ok(d.baris.some((b) => b.iso2 === n), n);
  const idL = new Set(l.baris.map((b) => b.id)); assert.equal(idL.size, l.baris.length);
  for (const b of d.baris) { for (const id of b.lelang_ids) assert.ok(idL.has(id)); for (const t of [...b.target, ...b.skema, ...b.local_content]) { assert.match(t.sumber_url, /^https:\/\//); assert.ok(BUKTI.has(t.tingkat_bukti)); assert.match(t.tanggal, TGL); } }
  for (const x of l.baris) { assert.ok(d.baris.some((b) => b.iso2 === x.iso2), x.id); assert.match(x.sumber_url, /^https:\/\//); assert.ok(BUKTI.has(x.tingkat_bukti)); assert.match(x.tanggal, TGL); }
  const vn = d.baris.find((b) => b.iso2 === 'VN'); assert.ok(vn.kapasitas_mw.surya[2020] > 10000);
  assert.ok(d.baris.find((b) => b.iso2 === 'ID').tautan_internal);
});
test('pembiayaan: klasifikasi teknologi dan BU; tautan dua arah', () => {
  assert.equal(teknologiDari('Wind farm 75MW').teknologi, 'bayu'); assert.equal(teknologiDari('coal-fired').ebt, false);
  const b = barisBu([{ Date: '2013', CountryCode: 'IDN', Description: 'X Power', Lender: 'CDB', Borrower: 'PT PLN (Persero)', 'Amount ($m)': '100', EnergySource: 'Coal', Location: 'Riau' }], '2026-11-08'); assert.equal(b[0].provinsi, 'Riau');
  const t = tautkan(b, [], [{ id: 'en_1', nama: 'PLN (Persero)' }]); assert.deepEqual(t.per_organisasi, { en_1: [b[0].id] });
  assert.equal(bersihTeks({ a: 'x — y · z' }).a, 'x, y, z');
});
test('pembiayaan: berkas terbangun, kunci tautan ada di proyek.json / organisasi.json, tanpa em dash', () => {
  const d = J('public/data/global/pembiayaan_luar.json'); const pj = new Set(J('public/data/proyek.json').baris.map((p) => p.id)); const og = new Set(J('public/data/organisasi.json').baris.map((o) => o.id));
  assert.ok(d.jumlah >= 100); assert.equal(d.jumlah, d.baris.length); const ids = new Set(d.baris.map((b) => b.id)); assert.equal(ids.size, d.baris.length);
  for (const b of d.baris) { assert.ok(BUKTI.has(b.tingkat_bukti)); assert.match(b.tanggal, TGL); assert.match(b.sumber_url, /^https:\/\//); if (b.proyek_id) assert.ok(pj.has(b.proyek_id), b.proyek_id); for (const o of [b.pemberi_org_id, b.penerima_org_id]) if (o) assert.ok(og.has(o), o); }
  for (const [p, arr] of Object.entries(d.per_proyek)) { assert.ok(pj.has(p)); for (const i of arr) assert.equal(d.baris.find((b) => b.id === i).proyek_id, p); }
  for (const [o, arr] of Object.entries(d.per_organisasi)) { assert.ok(og.has(o)); for (const i of arr) assert.ok(ids.has(i)); }
  assert.ok(!/[—·]/.test(JSON.stringify(d)));
});
test('atlas: pencocokan kode BPS, uraian GSA, jendela angin', () => {
  const c = cocokKabupaten([{ kode: '1171', nama: 'Kota A', jenis: 'kota', prov: '11' }], [{ kode: '11', nama: 'Aceh' }], [{ asli: 'Kota A', tipe: 'kota', provinsi: 'Aceh', lat: 1, lng: 2 }]); assert.equal(c.hasil[0].kode, '1171');
  assert.equal(urai({ annual: { data: { PVOUT_csi: 1400.4, ELE: 747 } } }).elevasi_m, 747);
  const tif = { skala: [1, 1], ikat: [0, 0, 0, 0, 10], W: 10, H: 10, tw: 10, th: 10, tx: 1, cache: new Map([[0, (() => { const b = Buffer.alloc(400); for (let i = 0; i < 100; i++) b.writeFloatLE(5, i * 4); return b; })()]]) };
  assert.equal(angin100(tif, 5.5, 5.5, 1).ms, 5);
});
test('atlas: berkas terbangun, kode ada di radar_kabupaten.json, nilai wajar', () => {
  const f = path.join(ROOT, 'public/data/global/potensi_atlas.json'); if (!fs.existsSync(f)) return;
  const d = J('public/data/global/potensi_atlas.json'); const kode = new Set(J('public/data/radar_kabupaten.json').baris.map((b) => b.kode));
  assert.ok(d.jumlah >= 500); assert.equal(new Set(d.baris.map((b) => b.kode)).size, d.baris.length);
  for (const b of d.baris) { assert.ok(kode.has(b.kode)); if (b.surya) assert.ok(b.surya.pvout_kwh_per_kwp_tahun > 900 && b.surya.pvout_kwh_per_kwp_tahun < 2100, b.kode); if (b.angin) assert.ok(b.angin.kecepatan_100m_ms > 0 && b.angin.kecepatan_100m_ms < 15, b.kode); }
});
