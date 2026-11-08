// produk.json, pabrik_dunia.json, teknologi_tren.json, bahan_baku.json: hasil bangun() tanpa suntingan tangan; tiap angka bersumber;
// org_id, tkdn, dan benchmark harga merujuk berkas lain yang nyata; angka masuk akal.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun as bProduk } from '../scripts/panen/produk_global_lib.mjs';
import { bangun as bPabrik } from '../scripts/panen/pabrik_dunia_lib.mjs';
import { bangunTren, bangunBahan } from '../scripts/panen/teknologi_tren_lib.mjs';

const baca = (f) => JSON.parse(fs.readFileSync(new URL('../public/data/' + f, import.meta.url), 'utf8'));
const P = baca('global/produk.json'), F = baca('global/pabrik_dunia.json'), T = baca('global/teknologi_tren.json'), M = baca('global/bahan_baku.json');
const TINGKAT = new Set(['resmi', 'via-pihak-ketiga', 'kata-pihak', 'media', 'EST']);
const rt = (x) => JSON.parse(JSON.stringify(x));
const idsSumber = (d) => { const s = new Set(d.sumber.map((x) => x.id)); assert.equal(s.size, d.sumber.length); for (const x of d.sumber) assert.match(x.url, /^https:\/\//); return s; };

test('berkas sama dengan hasil bangun() (tak ada suntingan tangan)', () => {
  assert.deepEqual(rt(bProduk()), P); assert.deepEqual(rt(bPabrik()), F); assert.deepEqual(rt(bangunTren()), T); assert.deepEqual(rt(bangunBahan()), M);
});
test('produk: sumber terdaftar, tingkat bukti sah, id unik, skema banding mencakup kolom spesifikasi', () => {
  const ids = idsSumber(P), seen = new Set();
  for (const p of P.baris) {
    assert.ok(!seen.has(p.id)); seen.add(p.id);
    assert.ok(ids.has(p.bukti.sumber_id), p.id); assert.ok(TINGKAT.has(p.bukti.tingkat_bukti)); assert.match(p.bukti.tanggal, /^\d{4}-\d\d-\d\d$/); assert.match(p.datasheet_url, /^https:\/\//);
    assert.ok(P.skema_banding[p.kategori], p.kategori);
    for (const k of P.skema_banding[p.kategori].map((c) => c.kolom)) assert.ok(k in p.spesifikasi, `${p.id}.${k}`);
  }
  assert.ok(P.baris.length >= 10);
});
test('produk: rujukan org_id, TKDN, dan harga nyata', () => {
  const orgs = new Set(baca('global/pemasok_surya.json').baris.map((r) => r.id));
  const tkdn = new Map(baca('tkdn_produk.json').baris.map((r) => [r.id, r]));
  const bench = new Set(baca('global/benchmark_harga.json').produk.map((r) => r.id));
  for (const p of P.baris) {
    if (p.org_id) assert.ok(orgs.has(p.org_id), `${p.id} ${p.org_id}`); else assert.ok(p.org_nama);
    for (const t of p.tkdn_rujukan) assert.ok(tkdn.has(t), t);
    if (p.tkdn_rujukan.length) { const v = p.tkdn_rujukan.map((t) => tkdn.get(t).tkdn_persen); assert.equal(p.spesifikasi.tkdn_persen, Math.max(...v)); assert.equal(p.spesifikasi.tkdn_persen_min, Math.min(...v)); }
    if (p.harga_rujukan) assert.ok(bench.has(p.harga_rujukan.benchmark_id), p.harga_rujukan.benchmark_id);
  }
  for (const s of P.sertifikasi_pihak_ketiga) if (s.org_id) assert.ok(orgs.has(s.org_id));
});
test('produk: angka masuk akal', () => {
  for (const p of P.baris.filter((x) => x.kategori === 'modul')) {
    const s = p.spesifikasi;
    if (s.daya_w_maks != null) { assert.ok(s.daya_w_maks >= 400 && s.daya_w_maks <= 900); assert.ok(s.daya_w_min <= s.daya_w_maks); }
    if (s.efisiensi_maks_persen != null) assert.ok(s.efisiensi_maks_persen > 18 && s.efisiensi_maks_persen < 30);
    if (s.koef_suhu_pmax_persen_per_c != null) assert.ok(s.koef_suhu_pmax_persen_per_c < 0 && s.koef_suhu_pmax_persen_per_c > -0.6);
  }
  const g = (id) => P.baris.find((p) => p.id === id).spesifikasi;
  assert.equal(g('trina-vertex-n-neg21c20q').efisiensi_maks_persen, 24.5); assert.equal(g('sungrow-sg350hx-us').efisiensi_maks_persen, 99.02);
  assert.ok(g('rec-solar-ne-solar-m10').tkdn_persen > 50);
});
test('pabrik: bersumber, iso2, koordinat dan kapasitas sah', () => {
  const ids = idsSumber(F), orgs = new Set(baca('global/pemasok_surya.json').baris.map((r) => r.id));
  const STATUS = new Set(['operasi', 'bangun', 'rencana', 'tutup', 'belum-dipastikan']), SEG = new Set(['polisilikon', 'ingot_wafer', 'sel', 'modul', 'sel_baterai', 'turbin']);
  for (const r of F.baris) {
    assert.match(r.negara_iso2, /^[A-Z]{2}$/); assert.ok(STATUS.has(r.status)); assert.ok(r.segmen.length && r.segmen.every((s) => SEG.has(s)));
    assert.ok(r.bukti.length && r.bukti.every((b) => ids.has(b.sumber_id) && TINGKAT.has(b.tingkat_bukti)));
    if (r.org_id) assert.ok(orgs.has(r.org_id), r.id);
    if (r.koordinat) { assert.ok(Math.abs(r.koordinat.lat) <= 90 && Math.abs(r.koordinat.lon) <= 180); assert.ok(r.kota); }
    for (const k of [r.kapasitas, r.kapasitas_rencana].filter(Boolean)) { assert.ok(k.nilai > 0); assert.ok(k.satuan); }
    if (r.status !== 'rencana') assert.ok(r.kapasitas, r.id);
  }
  assert.ok(F.baris.filter((r) => r.negara_iso2 === 'ID').length >= 5);
  assert.ok(F.baris.some((r) => r.negara_iso2 === 'ID' && r.status === 'rencana'));
});
test('teknologi: tiap titik bersumber; rekor NREL naik dan sejalan dengan tahun', () => {
  const ids = idsSumber(T);
  const semua = [...T.pangsa_teknologi_sel.titik, ...T.efisiensi_modul_produksi_massal.titik, ...T.daya_modul.titik, ...T.perak_per_watt.titik, ...T.turbin_angin.titik];
  for (const p of semua) { assert.ok(ids.has(p.sumber_id)); assert.ok(TINGKAT.has(p.tingkat_bukti)); assert.match(p.tanggal, /^\d{4}-\d\d-\d\d$/); }
  for (const p of T.pangsa_teknologi_sel.titik) assert.ok(p.persen > 0 && p.persen <= 100);
  const th = (t) => T.pangsa_teknologi_sel.titik.filter((p) => p.tahun === t && !p.jenis).reduce((a, p) => a + p.persen, 0);
  assert.ok(th(2025) > 99 && th(2025) <= 100.5, 'pangsa 2025 berjumlah sekitar 100');
  for (const [k, v] of Object.entries(T.rekor_efisiensi_sel_nrel)) { if (!Array.isArray(v)) continue; for (let i = 1; i < v.length; i++) { assert.ok(v[i].persen > v[i - 1].persen, k); assert.ok(v[i].tanggal >= v[i - 1].tanggal, k); } }
  assert.ok(T.rekor_efisiensi_sel_nrel.perovskit_di_atas_si_tandem.at(-1).persen > 35);
});
test('bahan baku: deret Pink Sheet bersumber dan sensitivitas perak dapat dihitung ulang', () => {
  const ids = idsSumber(M);
  for (const s of M.deret) { assert.ok(s.titik.length >= 6); for (const p of s.titik) { assert.ok(ids.has(p.sumber_id)); assert.ok(p.y > 0); } }
  const y = (id, x) => M.deret.find((s) => s.id === id).titik.find((p) => p.x === x).y;
  assert.equal(y('tembaga', 2023), 8490); assert.ok(y('perak', 2025) > y('perak', 2020));
  const s = M.sensitivitas.perak_ke_modul, r25 = s.per_tahun.find((p) => p.tahun === 2025);
  assert.ok(Math.abs(r25.topcon_10mg_w_usd_per_w - (y('perak', 2025) / 31.1034768) * 0.01) < 1e-5);
  assert.equal(s.tingkat_bukti, 'EST'); assert.ok(s.porsi_dari_harga_modul_2025_persen > 5 && s.porsi_dari_harga_modul_2025_persen < 30);
});
test('baru: PVEL resmi, litium USGS, YTD 2026, inverter bersertifikat, katalog >= 30 modul', () => {
  assert.equal(P.pvel_scorecard_2026.pabrikan.length, P.pvel_scorecard_2026.jumlah_nama_tercantum);
  assert.ok(P.baris.filter((p) => p.kategori === 'modul').length >= 20);
  assert.ok(P.baris.filter((p) => p.kategori === 'inverter').length >= 6);
  assert.ok(P.baris.filter((p) => p.kategori === 'inverter' && p.spesifikasi.sertifikat.length).length >= 4);
  assert.equal(P.baris.find((p) => p.id === 'trina-vertex-n-neg21c20q').pvel_2026_tercantum, true);
  assert.equal(M.litium_karbonat.titik.find((p) => p.x === 2022).y, 63700);
  for (const s of M.deret) assert.ok(s.ytd_2026.y > 0 && s.ytd_2026.periode.includes('Jan-Okt'));
  assert.ok(F.baris.some((r) => r.negara_iso2 === 'HU' && r.segmen.includes('sel_baterai')));
});
test('kepala: meta.celah wajib ada di keempat berkas', () => {
  for (const d of [P, F, T, M]) { assert.equal(d.lapis, 'publik'); assert.match(d.meta.diperbarui, /^\d{4}-\d\d-\d\d$/); assert.ok(d.meta.celah.length > 0); }
});
