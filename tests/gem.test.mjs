// GEM (CC BY 4.0): skema ringkasan, jumlah cocok, atribusi, PLTU, kandidat lembaga. Selftest pencocokan ada di scripts/pipa/gem.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const j = (p) => JSON.parse(fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const TRACKER = ['solar', 'wind', 'hydropower', 'geothermal', 'coal'];
const STATUS = new Set(['operating', 'construction', 'pre-construction', 'announced', 'shelved', 'cancelled', 'retired']);
const JUMLAH = { solar: 110, wind: 54, hydropower: 78, geothermal: 119, coal: 548 };

test('gem.mjs --selftest', () => { assert.match(execFileSync('node', ['scripts/pipa/gem.mjs', '--selftest'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }), /selftest ok/); });

for (const t of TRACKER) {
  test(`data/gem/${t}.json: skema dan atribusi`, () => {
    const d = j(`data/gem/${t}.json`);
    assert.equal(d.lisensi, 'CC BY 4.0'); assert.match(d.atribusi, /Global Energy Monitor/); assert.match(d.rilis, /^2026-\d\d$/);
    assert.equal(d.jumlah, JUMLAH[t]); assert.equal(d.baris.length, JUMLAH[t]);
    const ids = new Set();
    for (const b of d.baris) {
      assert.ok(b.nama && b.gem_id && b.lokasi_id, 'nama + id GEM'); assert.ok(!ids.has(b.gem_id), 'id unik ' + b.gem_id); ids.add(b.gem_id);
      assert.ok(STATUS.has(b.status), 'status ' + b.status);
      assert.ok(b.kapasitas_mw == null || b.kapasitas_mw >= 0);
      assert.ok(b.lat >= -12 && b.lat <= 7 && b.lon >= 94 && b.lon <= 142, `koordinat Indonesia ${b.nama} ${b.lat},${b.lon}`);
      assert.match(b.url_wiki || '', /^https:\/\/www\.gem\.wiki\//);
    }
  });
}

test('proyek_gem.json: jumlah cocok, sumber kajian beratribusi, status beda tidak ditimpa', () => {
  const d = j('data/proyek_gem.json');
  assert.ok(d.perkaya.length >= 60, 'cocok ' + d.perkaya.length); assert.ok(d.baru.length >= 100);
  const sid = new Map(d.sumber.map((s) => [s.id, s]));
  for (const s of d.sumber) { assert.equal(s.tingkat_bukti, 'kajian'); assert.equal(s.lisensi, 'CC BY 4.0'); assert.match(s.url, /^https:\/\//); assert.match(s.atribusi, /Global Energy Monitor/); assert.match(s.tanggal_rilis, /^2026-\d\d$/); }
  for (const c of d.perkaya) { assert.ok(sid.has(c.sumber_id)); assert.ok(!c.perubahan.status || !d.beda_status.some((b) => b.proyek_id === c.proyek_id), 'status diisi hanya bila kosong'); }
  for (const b of d.baru) { assert.equal(b.kandidat, true); assert.equal(b.tingkat_bukti, 'kajian'); assert.ok(['beroperasi', 'konstruksi', 'rencana'].includes(b.status[0].nilai)); assert.ok(sid.has(b.sumber_ids[0])); }
  for (const x of d.dicatat) assert.ok(['announced', 'shelved', 'cancelled', 'retired'].includes(x.status));
  assert.equal(new Set(d.perkaya.map((c) => c.proyek_id)).size, d.perkaya.length, 'satu proyek satu cocokan');
});

test('potret publik membawa sumber GEM dan kandidat', () => {
  const p = j('public/data/proyek.json'); const g = p.baris.filter((x) => (x.sumber || []).some((s) => /^gem-/.test(s.jenis)));
  assert.ok(g.length >= 150, 'baris dengan sumber GEM ' + g.length);
  assert.ok(p.baris.filter((x) => x.kandidat).length >= 100);
  for (const x of g) for (const s of x.sumber.filter((s) => /^gem-/.test(s.jenis))) assert.ok(s.atribusi && s.url && s.lisensi === 'CC BY 4.0');
});

test('pltu.json: unit lengkap, tertaut karbon, pensiun terbaca', () => {
  const d = j('data/strategis/pltu.json'); const raw = j('data/gem/coal.json');
  assert.equal(d.jumlah_unit, raw.jumlah); assert.equal(d.unit.length, raw.jumlah); assert.match(d.atribusi, /Global Energy Monitor/);
  const pemb = new Map(d.pembangkit.map((p) => [p.id, p])); const karbon = new Set(j('public/data/karbon.json').baris.map((b) => b.id));
  for (const u of d.unit) { assert.ok(pemb.has(u.pembangkit_id)); assert.ok(STATUS.has(u.status)); if (u.karbon_id) assert.ok(karbon.has(u.karbon_id), u.karbon_id); }
  assert.ok(d.unit.filter((u) => u.status === 'operating').length > 200); assert.ok(d.unit.some((u) => u.rencana_pensiun)); assert.ok(d.pembangkit.filter((p) => p.karbon_id).length > 50);
});

test('kandidat lembaga GEM: tidak ada yang sudah di organisasi.json, tidak masuk potret publik', () => {
  const k = j('data/direktori/kandidat_lembaga_gem.json'); const norm = (s) => String(s).toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\b(pt|tbk|persero|cv|perseroda|ud|ltd|co|inc|corp)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
  const org = new Set(j('public/data/organisasi.json').baris.flatMap((o) => [o.nama, o.singkatan, ...(o.nama_lain || [])]).filter(Boolean).map(norm));
  assert.ok(k.jumlah > 100 && k.baris.length === k.jumlah);
  for (const b of k.baris) assert.ok(!org.has(norm(b.nama)), 'sudah ada: ' + b.nama);
  assert.ok(!JSON.stringify(j('public/data/organisasi.json')).includes('kandidat_lembaga_gem'));
});
