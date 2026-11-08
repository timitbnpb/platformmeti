// public/data/pasar_listrik.json: HBA, DMO, tarif, subsidi, keandalan wilayah, analisis EST. Tiap angka bersumber + tanggal + tingkat bukti.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun } from '../scripts/panen/pasar_listrik_lib.mjs';

const baca = (f) => JSON.parse(fs.readFileSync(new URL('../public/data/' + f, import.meta.url), 'utf8'));
const D = baca('pasar_listrik.json');
const TINGKAT = new Set(['resmi', 'media', 'kata-pihak', 'via-pihak-ketiga', 'EST', 'hipotesis']);
const IDS = new Set(D.sumber.map((s) => s.id));

test('berkas sama dengan hasil bangun() (tak ada suntingan tangan)', () => assert.deepEqual(JSON.parse(JSON.stringify(bangun())), D));

test('tiap sumber sah dan tiap baris data menunjuk sumber terdaftar dengan tanggal dan tingkat bukti', () => {
  for (const s of D.sumber) { assert.match(s.url, /^https:\/\//); assert.ok(TINGKAT.has(s.tingkat_bukti), s.id); assert.ok(s.judul && s.penerbit && s.tahun, s.id); }
  const baris = [...D.hba.tahunan, ...D.hba.bulanan, ...D.hba.periode, ...D.dmo.aturan, ...D.dmo.volume, ...D.tarif.golongan, ...D.subsidi.realisasi, ...D.subsidi.pagu_vs_realisasi,
    ...D.subsidi.subsidi_dan_kompensasi, ...D.subsidi.pelanggan_bersubsidi_juta, ...D.subsidi.pelanggan_total, ...D.tarif.seri.flatMap((s) => s.peristiwa)];
  assert.ok(baris.length > 100);
  for (const r of baris) { assert.ok(IDS.has(r.sumber_id), JSON.stringify(r).slice(0, 80)); assert.match(r.tanggal, /^\d{4}-\d{2}-\d{2}$/); assert.ok(TINGKAT.has(r.tingkat_bukti)); }
});

test('HBA: rata-rata 12 bulan 2015 (siaran pers ESDM) = rata-rata tahunan Handbook 60,13; 2024 = 121,48', () => {
  const m = D.hba.bulanan.map((r) => r.usd_ton), rata = m.reduce((a, b) => a + b, 0) / m.length;
  assert.equal(m.length, 12); assert.ok(Math.abs(rata - D.hba.tahunan.find((r) => r.tahun === 2015).usd_ton) < 0.01);
  assert.equal(D.hba.tahunan.find((r) => r.tahun === 2024).usd_ton, 121.48);
  assert.deepEqual(D.hba.tahunan.map((r) => r.tahun), [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]);
  for (const r of D.hba.periode) assert.ok(r.usd_ton > 50 && r.usd_ton < 300 && /^\d{4}-\d{2}-(I|II)$/.test(r.periode));
});

test('DMO: harga USD 70 di semua aturan; volume ke pembangkit tidak melebihi penjualan dalam negeri', () => {
  assert.ok(D.dmo.aturan.every((a) => a.harga_usd_ton === 70));
  for (const v of D.dmo.volume.filter((x) => x.ke_pembangkit_listrik_t)) assert.ok(v.ke_pembangkit_listrik_t < v.penjualan_dalam_negeri_t, String(v.tahun));
  assert.equal(D.dmo.volume.find((v) => v.tahun === 2024).ke_pembangkit_listrik_t, 133470000);
});

test('tarif: disparitas buku statistik terulang dari tarif dan tarif keekonomian (R-1 450 VA 2024 = 76,58%)', () => {
  const g = D.tarif.golongan.find((x) => x.kode === 'R-1/450'), i = D.tarif.tahun.indexOf(2024);
  assert.ok(Math.abs((1 - g.tarif_rp_kwh[i] / g.keekonomian_rp_kwh[i]) * 100 - 76.58) < 0.01);
  const r3 = D.tarif.golongan.find((x) => x.kode === 'R-3');
  assert.ok(Math.abs((1 - r3.tarif_rp_kwh[i] / r3.keekonomian_rp_kwh[i]) * 100 - 4.11) < 0.01);
  for (const x of D.tarif.golongan) { assert.equal(x.tarif_rp_kwh.length, 5); assert.equal(x.keekonomian_rp_kwh.length, 5); }
});

test('tarif triwulan 2017-Q1..2026-Q3 sama dengan peristiwa dan cocok dengan tarif_harga.json (Q3 2026) lewat tarif_harga_id', () => {
  assert.equal(D.tarif.triwulan.length, 39); assert.equal(D.tarif.triwulan[0].periode, '2017-Q1'); assert.equal(D.tarif.triwulan.at(-1).periode, '2026-Q3');
  const th = new Map(baca('tarif_harga.json').baris.map((b) => [b.id, b]));
  const akhir = D.tarif.triwulan.at(-1).nilai_rp_kwh, q = (p) => D.tarif.triwulan.find((x) => x.periode === p).nilai_rp_kwh;
  for (const s of D.tarif.seri) for (const id of s.tarif_harga_id) { assert.ok(th.has(id), id); assert.equal(th.get(id).tarif_idr_per_kwh, akhir[s.id], id); }
  assert.equal(q('2020-Q3')['r1-b2-pju'], 1467.28); assert.equal(q('2020-Q4')['r1-b2-pju'], 1444.7);
  assert.equal(q('2022-Q2')['r2-r3-p1-p3'], 1444.7); assert.equal(q('2022-Q3')['r2-r3-p1-p3'], 1699.53); assert.equal(q('2022-Q3').p2, 1522.88);
  assert.deepEqual([q('2017-Q1')['r1m-900'], q('2017-Q2')['r1m-900'], q('2017-Q3')['r1m-900']], [791, 1034, 1352]);
});

test('subsidi: nilai per tahun naik 2020-2024 dan 2024 = 77,04; tak ada realisasi 2025 yang dikarang', () => {
  assert.deepEqual(D.subsidi.realisasi.map((r) => r.subsidi_rp_triliun), [47.99, 49.8, 58.83, 68.64, 77.04]);
  assert.equal(D.subsidi.pagu_vs_realisasi.find((r) => r.tahun === 2025).realisasi_rp_triliun, null);
  assert.ok(Math.abs(D.subsidi.pagu_vs_realisasi[0].pagu_rp_triliun - (73.24 + 2.58)) < 0.02);
});

test('keandalan wilayah: SAIDI/SAIFI kosong (tidak terbit), tertaut ke sistem_id dan kode BPS di keandalan.json', () => {
  const kea = baca('keandalan.json');
  assert.equal(D.keandalan.wilayah.length, kea.sistem.length);
  for (const w of D.keandalan.wilayah) { const s = kea.sistem.find((x) => x.id === w.sistem_id); assert.ok(s); assert.deepEqual(w.kode_bps, s.prov); assert.equal(w.saidi_jam, null); assert.equal(w.saifi_kali, null); }
  for (const n of D.keandalan.nasional) assert.deepEqual([n.saidi_jam, n.saifi_kali], (({ saidi_jam, saifi_kali }) => [saidi_jam, saifi_kali])(kea.tren_nasional.find((x) => x.tahun === n.tahun)));
});

test('tautan dua arah: org_id, regulasi_id, sistem_id ada di berkas induk', () => {
  const org = new Set(baca('organisasi.json').baris.map((o) => o.id)), reg = new Set(baca('regulasi.json').baris.map((r) => r.id)), kea = new Set(baca('keandalan.json').sistem.map((s) => s.id));
  for (const o of D.tautan.org_id) assert.ok(org.has(o), o);
  for (const r of [...D.tautan.regulasi_id, ...D.dmo.regulasi.map((x) => x.id)]) assert.ok(reg.has(r), r);
  for (const s of D.tautan.sistem_id) assert.ok(kea.has(s), s);
  for (const f of D.tautan.berkas_terkait) assert.ok(fs.existsSync(new URL('../public/data/' + f, import.meta.url)), f);
});

test('analisis EST: sen/kWh = USD/ton / (kWh termal per ton x efisiensi); subsidi tersirat = (HBA-70) x volume; DMO tak melewati HBA', () => {
  const A = D.analisis, p = A.parameter, kwh = p.kwh_termal_per_ton, eta = p.efisiensi.nilai;
  assert.equal(A.tingkat_bukti, 'EST'); assert.ok(Math.abs(kwh - (6322 * 4.1868) / 3.6) < 0.1);
  for (const r of A.tahunan) {
    assert.ok(Math.abs(r.biaya_bbm_hba_sen_kwh - (r.hba_usd_ton / (kwh * eta)) * 100) < 0.011, String(r.tahun));
    const gap = Math.max(r.hba_usd_ton - 70, 0);
    assert.ok(Math.abs(r.subsidi_tersirat_usd_miliar - (gap * r.volume_pembangkit_juta_t) / 1000) < 0.011, String(r.tahun));
    assert.ok(Math.abs(r.selisih_sen_kwh - (gap / (kwh * eta)) * 100) < 0.011);
  }
  assert.equal(A.tahunan.find((r) => r.tahun === 2020).subsidi_tersirat_usd_miliar, 0);
  assert.ok(A.tahunan.find((r) => r.tahun === 2022).subsidi_tersirat_usd_miliar > 20);
  const bb = baca('biaya_bangun.json');
  for (const e of A.ebt) assert.equal(e.lcoe_sen_kwh, Math.round(bb.skala.find((s) => s.id === e.skala_id).lcoe_usd_mwh.tengah) / 10);
});

test('celah tercatat dan tanpa em dash atau titik tengah', () => { assert.ok(D.meta.celah.length >= 8); assert.doesNotMatch(JSON.stringify(D), /[—·]/); });
