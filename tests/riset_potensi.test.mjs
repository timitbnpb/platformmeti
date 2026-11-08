import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { SAWIT_2023, SAWIT_NASIONAL_2023 } from '../scripts/panen/riset_potensi.mjs';

const R = (n) => JSON.parse(fs.readFileSync(new URL(`../public/data/riset/${n}.json`, import.meta.url), 'utf8'));
const TEMA = ['jaringan', 'curtailment', 'permintaan_baru', 'plts_terapung', 'biomassa', 'pumped_storage_offshore', 'tenaga_kerja', 'daur_ulang'];
const wil = new Set(JSON.parse(fs.readFileSync(new URL('../public/data/wilayah.json', import.meta.url), 'utf8')).baris.map((b) => b.kode));
const sistem = new Set(JSON.parse(fs.readFileSync(new URL('../public/data/keandalan.json', import.meta.url), 'utf8')).sistem.map((s) => s.id));
const proyek = new Set(JSON.parse(fs.readFileSync(new URL('../public/data/proyek.json', import.meta.url), 'utf8')).baris.map((b) => b.id));
const gem = new Set(JSON.parse(fs.readFileSync(new URL('../public/data/gem_pembangkit.json', import.meta.url), 'utf8')).baris.map((b) => b.id));
const kawasan = new Set(JSON.parse(fs.readFileSync(new URL('../public/data/kawasan.json', import.meta.url), 'utf8')).baris.map((b) => b.id));
const orgU = new Set(Object.values(JSON.parse(fs.readFileSync(new URL('../public/data/cari/org.json', import.meta.url), 'utf8'))).map((o) => o.u.replace('/o/', '')));

test('selftest skrip panen dan pipa', () => {
  for (const f of ['panen', 'pipa']) assert.match(execFileSync('node', [`scripts/${f}/riset_potensi.mjs`, '--selftest'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }), /selftest ok/);
});

for (const t of TEMA) {
  test(`riset/${t}.json: kepala, sumber, celah, jumlah, tingkat bukti`, () => {
    const d = R(t);
    assert.equal(d.lapis, 'publik'); assert.equal(d.tema, t); assert.match(d.meta.diperbarui, /^\d{4}-\d\d-\d\d$/);
    assert.equal(d.meta.jumlah, d.baris.length); assert.ok(d.meta.celah.length > 0);
    const ids = new Set(d.sumber.map((s) => s.id)); assert.equal(ids.size, d.sumber.length);
    for (const s of d.sumber) for (const k of ['id', 'judul', 'penerbit', 'tahun', 'url', 'lisensi']) assert.ok(s[k], `${s.id}.${k}`);
    for (const b of d.baris) {
      if (b.sumber_id) assert.ok(ids.has(b.sumber_id) || b.sumber_id === 'rutovitz-2015', `${t}: sumber_id ${b.sumber_id}`);
      const tb = b.tingkat_bukti; for (const v of typeof tb === 'object' ? Object.values(tb) : [tb]) assert.ok(['Data', 'EST', 'Hipotesis'].includes(v), `${t}: tingkat ${JSON.stringify(tb)}`);
    }
    assert.ok(fs.statSync(new URL(`../public/data/riset/${t}.json`, import.meta.url)).size < 2e6);
  });
}

test('kunci tautan: kode BPS, sistem PLN, proyek, gem, kawasan, org valid', () => {
  for (const t of TEMA) for (const b of R(t).baris) {
    for (const k of [].concat(b.kode_prov ?? [])) assert.ok(wil.has(k), `${t} kode_prov ${k}`);
    if (b.sistem_id) assert.ok(sistem.has(b.sistem_id), `${t} sistem ${b.sistem_id}`);
    if (b.proyek_id && /^pj_/.test(b.proyek_id)) assert.ok(proyek.has(b.proyek_id), b.proyek_id);
    if (b.gem_id) assert.ok(gem.has(b.gem_id), b.gem_id);
    if (b.kawasan_id) assert.ok(kawasan.has(b.kawasan_id), b.kawasan_id);
  }
  for (const p of R('daur_ulang').pelaku) assert.ok(orgU.has(p.org_id), p.org_id);
});

test('setiap baris punya minimal satu kunci tautan (kecuali daur_ulang per tahun dan pembanding global)', () => {
  for (const t of TEMA.filter((x) => !['daur_ulang', 'curtailment'].includes(x))) for (const b of R(t).baris) {
    const ada = b.kode_prov != null || b.sistem_id || b.proyek_id || b.gem_id || b.keandalan_id || b.kunci_kerja || b.jenis === 'angin-lepas-pantai' || b.kawasan_id;
    assert.ok(ada, `${t}: ${b.id || b.nama || b.teknologi} tanpa kunci`);
  }
});

test('jaringan: 16 sistem cocok keandalan.json, rasio dan studi batas', () => {
  const d = R('jaringan'); assert.equal(d.baris.length, 16);
  for (const b of d.baris) assert.ok(Math.abs(b.rasio_ebt_beban_puncak_persen[2030] - b.ebt_dmn_mw[2030] / b.beban_puncak_neto_mw[2030] * 100) < 0.06);
  assert.equal(d.studi_batas_penetrasi.find((s) => s.id === 'tumiran-2021').batas_persen, 5.85);
});

test('biomassa: jumlah CPO BPS cocok total nasional, turunan konsisten', () => {
  const tot = Object.values(SAWIT_2023).reduce((a, [, t]) => a + t, 0); assert.ok(Math.abs(tot - SAWIT_NASIONAL_2023.cpo_ton) < 10);
  const luas = Object.values(SAWIT_2023).reduce((a, [l]) => a + l, 0); assert.ok(Math.abs(luas - SAWIT_NASIONAL_2023.luas_ha) < 10);
  for (const b of R('biomassa').baris) { assert.equal(b.tbs_ton_est, Math.round(b.cpo_ton / 0.2)); assert.ok(b.mw_termal_setara_est > 0); }
});

test('plts_terapung: jumlah waduk dan potensi sesuai RUPTL, jarak gardu proyek', () => {
  const d = R('plts_terapung'); assert.equal(d.ringkasan.jumlah_waduk, d.baris.filter((b) => b.jenis === 'waduk').length);
  assert.ok(Math.abs(d.ringkasan.potensi_mw_20persen_luas / 1000 - d.ringkasan.klaim_ruptl_gw) < 0.5);
  const cirata = d.baris.find((b) => b.gem_id === 'gem-solar-L100000800892'); assert.equal(cirata.proyek_id, 'pj_0334'); assert.ok(cirata.gardu_terdekat.jarak_km < 5);
});

test('permintaan_baru: butir ragu tidak masuk proyeksi, data center ada', () => {
  const d = R('permintaan_baru'); const dc = d.baris.filter((b) => b.kategori === 'Data Center');
  assert.ok(dc.length >= 15); assert.ok(d.proyeksi_2030['Data Center'].mva_sampai_2030 > 0);
  const ok = dc.filter((b) => !b.diurai_ragu && b.tahun_akhir && b.tahun_akhir <= 2030).reduce((a, b) => a + b.mva_akhir, 0);
  assert.ok(Math.abs(ok - d.proyeksi_2030['Data Center'].mva_sampai_2030) < 0.2);
});

test('pumped storage: kapasitas RUPTL Cisokan 1040, Matenggeng 943,2, Grindulu 1000', () => {
  const d = R('pumped_storage_offshore'); const k = (id) => d.baris.find((b) => b.id === id).kapasitas_mw_ruptl;
  assert.equal(k('ps-upper-cisokan'), 1040); assert.equal(k('ps-matenggeng'), 943.2); assert.equal(k('ps-grindulu'), 1000);
});

test('daur_ulang: pensiun kumulatif nondecreasing; tanpa tonase karangan', () => {
  const d = R('daur_ulang'); let p = 0;
  for (const b of d.baris) { assert.ok(b.kapasitas_pensiun_kumulatif_mw.umur_25 >= p); p = b.kapasitas_pensiun_kumulatif_mw.umur_25; assert.ok(!('ton' in b)); }
});
