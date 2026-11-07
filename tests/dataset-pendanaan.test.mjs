// Skema keuangan.json (pendanaan), karbon.json (bursa, proyek SRN), tkdn.json: sumber_id terdaftar, tanggal, tingkat bukti, tautan ke organisasi/proyek valid.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { hargaRata, periodePdf } from '../scripts/pipa/dataset_pendanaan.mjs';

const baca = (p) => JSON.parse(fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const KEU = baca('public/data/keuangan.json'), KAR = baca('public/data/karbon.json'), TK = baca('public/data/tkdn.json');
const ORG = new Set(baca('public/data/organisasi.json').baris.map((o) => o.id));
const PRY = new Set(baca('public/data/proyek.json').baris.map((o) => o.id));
const TGL = /^\d{4}-\d\d-\d\d$/;

function cekBlok(d, baris) {
  const ids = new Set(d.sumber.map((s) => s.id));
  for (const s of d.sumber) for (const k of ['id', 'judul', 'penerbit', 'tahun', 'url']) assert.ok(s[k], `sumber ${s.id}.${k}`);
  assert.ok(TGL.test(d.meta.diperbarui) && Array.isArray(d.meta.celah) && d.meta.celah.length);
  for (const b of baris) {
    assert.ok(ids.has(b.sumber_id), `${b.id} sumber_id`);
    assert.ok(TGL.test(b.tanggal) && /^https:\/\//.test(b.sumber_url) && b.tingkat_bukti, `${b.id} sumber/tanggal/bukti`);
  }
}
test('pendanaan: skema, tautan org/proyek valid, media bertingkat media', () => {
  const p = KEU.baris.filter((b) => b.kelompok === 'pendanaan');
  assert.ok(p.length >= 20); cekBlok(KEU, p);
  for (const b of p) {
    assert.ok(b.nilai_usd > 0 || b.nilai_idr > 0, b.id);
    for (const k of ['pemberi_org_id', 'penerima_org_id']) if (b[k]) assert.ok(ORG.has(b[k]), `${b.id}.${k}`);
    if (b.proyek_id) assert.ok(PRY.has(b.proyek_id), `${b.id}.proyek_id`);
    if (b.jenis === 'investasi-diberitakan') assert.equal(b.tingkat_bukti, 'media');
  }
  assert.equal(KEU.jumlah, KEU.baris.length);
  for (const g of ['tarif', 'jetp', 'green_finance', 'idx', 'bpp', 'celah']) assert.ok(KEU.baris.some((b) => b.kelompok === g), 'kelompok lama hilang: ' + g);
});
test('bursa karbon: periode unik, YTD konsisten dengan volume bulanan, harga turunan', () => {
  const r = KAR.baris.filter((b) => b.kelompok === 'bursa_karbon'); cekBlok(KAR, r);
  assert.equal(new Set(r.map((b) => b.periode)).size, r.length);
  for (let i = 1; i < r.length; i++) if (r[i].periode.slice(0, 4) === r[i - 1].periode.slice(0, 4) && r[i].periode.slice(5) === String(+r[i - 1].periode.slice(5) + 1).padStart(2, '0'))
    assert.equal(r[i].volume_ytd_tco2e - r[i - 1].volume_ytd_tco2e, r[i].volume_tco2e, r[i].periode);
  for (const b of r) assert.equal(b.harga_rata_idr_per_tco2e, hargaRata(b.nilai_idr, b.volume_tco2e));
  assert.ok(KAR.baris.some((b) => b.kelompok === 'pembangkit'));
});
test('proyek SRN: volume total = jumlah per vintage; pemilik tertaut valid', () => {
  const r = KAR.baris.filter((b) => b.kelompok === 'proyek_srn'); assert.equal(r.length, 10); cekBlok(KAR, r);
  for (const b of r) { assert.equal(b.volume_listing_total_tco2e, Object.values(b.volume_listing_tco2e_per_vintage).reduce((a, c) => a + c, 0)); assert.match(b.srn_series, /^SPE-\d\d-PR-/); if (b.pemilik_org_id) assert.ok(ORG.has(b.pemilik_org_id)); }
});
test('TKDN: persen 0-100, kategori dikenal, tautan produsen valid', () => {
  assert.ok(TK.jumlah > 50 && TK.jumlah === TK.baris.length); cekBlok(TK, TK.baris);
  for (const b of TK.baris) { assert.ok(b.tkdn_persen > 0 && b.tkdn_persen <= 100); assert.ok(['modul_surya', 'inverter', 'turbin', 'baterai', 'menara'].includes(b.kategori)); if (b.produsen_org_id) assert.ok(ORG.has(b.produsen_org_id)); assert.ok(b.berlaku_sampai); }
});
test('parser: periode dari isi PDF, harga rata-rata', () => {
  assert.equal(periodePdf('CARBON MARKET - TRADING SUMMARY\n   Sep 2025   Aug 2025'), '2025-09');
  assert.equal(hargaRata(82736000, 1234), 67047); assert.equal(hargaRata(0, 0), null);
});
