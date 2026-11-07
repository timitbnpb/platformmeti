// public/data/korporat.json: tiap baris bersumber berurl + tanggal + tingkat bukti; bangun() murni diuji dengan masukan kecil.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun } from '../scripts/panen/korporat_bangun.mjs';

const D = JSON.parse(fs.readFileSync(new URL('../public/data/korporat.json', import.meta.url), 'utf8'));
const TINGKAT = new Set(['resmi', 'via-pihak-ketiga', 'kata-pihak', 'media']);
test('perusahaan: sumber terdaftar, status sah, tanpa nama kapital penuh', () => {
  const ids = new Set(D.sumber.map((s) => s.id)); assert.ok(D.perusahaan.length >= 40);
  for (const p of D.perusahaan) {
    assert.ok(p.sumber_ids.length && p.sumber_ids.every((i) => ids.has(i)), p.id); assert.ok(TINGKAT.has(p.tingkat_bukti)); assert.match(p.tanggal, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(p.sbti || p.re100, p.id); if (p.sbti) assert.ok([null, 'disetujui', 'komitmen', 'dicabut'].includes(p.sbti.status));
    assert.ok(p.nama.length < 5 || p.nama !== p.nama.toUpperCase(), p.nama);
  }
  assert.equal(new Set(D.perusahaan.map((p) => p.id)).size, D.perusahaan.length);
});
test('PPA: sumber berurl https, angka hanya bila ada, perusahaan_id menunjuk baris nyata', () => {
  const pid = new Set(D.perusahaan.map((p) => p.id));
  for (const x of D.ppa) {
    assert.match(x.sumber.url, /^https:\/\//); assert.ok(TINGKAT.has(x.tingkat_bukti)); assert.ok(x.mw == null || x.mw > 0); assert.ok(x.tahun == null || (x.tahun >= 2015 && x.tahun <= 2027));
    assert.ok(x.perusahaan_id == null || pid.has(x.perusahaan_id), x.id); assert.ok(x.mw != null || x.mwh != null || x.skema === 'rec', x.id);
  }
  assert.ok(D.ppa.length >= 6);
});
test('bangun() murni: hanya HQ Indonesia dan duplikat SBTi + RE100 digabung', () => {
  const sb = [{ company_name: 'PT Contoh Tbk', location: 'Indonesia', sector: 'Mining - Coal', near_term_status: 'Validated Targets', near_term_target_year: '2030.0' }, { company_name: 'Foreign Inc', location: 'France', sector: 'X' }];
  const re = [{ nama: 'Contoh', hq: 'Indonesia', sektor: 'Materials', tahun_gabung: 2024, tahun_target: 2040 }];
  const o = bangun(sb, re, []);
  assert.equal(o.perusahaan.length, 1); assert.equal(o.perusahaan[0].sbti.tahun_sasaran, 2030); assert.equal(o.perusahaan[0].re100.tahun_target, 2040); assert.equal(o.perusahaan[0].sektor_grup, 'Mining');
});
test('celah tercatat dan tanpa em dash atau titik tengah', () => { assert.ok(D.meta.celah.length >= 3); assert.doesNotMatch(JSON.stringify(D), /[—·]/); });
