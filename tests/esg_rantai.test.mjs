import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const J = (p) => JSON.parse(fs.readFileSync(new URL('../public/data/' + p, import.meta.url), 'utf8'));
const esg = J('global/esg_rantai.json'), pj = J('global/purnajual.json'), hil = J('hilirisasi.json');
const orgIds = new Set();
for (const f of ['global/pemasok_surya.json', 'global/pemasok_lain.json', 'organisasi.json', 'global/pelaku_global.json']) for (const b of J(f).baris) { orgIds.add(b.id); if (b.org_id) orgIds.add(b.org_id); }
const adaSumber = (d, id) => d.sumber.some((s) => s.id === id);

test('esg_rantai: semua sumber_id terdaftar dan ber-URL', () => {
  const ids = [...esg.jejak_modul, ...esg.jejak_baterai, ...esg.kerja_paksa.entitas, ...esg.sertifikasi, ...esg.rantai_mineral.tambahan].map((x) => x.sumber_id);
  for (const id of ids) assert.ok(adaSumber(esg, id), id);
  for (const s of esg.sumber) assert.match(s.url, /^https:\/\//);
});
test('esg_rantai: org_id tertaut ada di organisasi/pemasok', () => {
  for (const x of [...esg.kerja_paksa.entitas, ...esg.sertifikasi]) if (x.org_id) assert.ok(orgIds.has(x.org_id), x.org_id);
});
test('esg_rantai: jejak punya nilai atau rentang, satuan, dan tanggal data', () => {
  for (const r of [...esg.jejak_modul, ...esg.jejak_baterai]) { assert.ok(r.nilai != null || (r.rentang && r.rentang.min < r.rentang.max), r.id); assert.ok(r.satuan, r.id); }
  const cn = esg.jejak_modul.find((r) => r.id === 'jm-cn-gg'), eu = esg.jejak_modul.find((r) => r.id === 'jm-eu-gg');
  assert.ok(cn.nilai > eu.nilai); // bauran listrik Tiongkok lebih berkarbon
});
test('esg_rantai: UFLPA tidak duplikat dan tanggal valid', () => {
  const n = esg.kerja_paksa.entitas.map((e) => e.entitas.toLowerCase());
  assert.equal(new Set(n).size, n.length);
  for (const e of esg.kerja_paksa.entitas) assert.match(e.ditambahkan, /^\d{4}-\d{2}-\d{2}$/);
});
test('esg_rantai: rantai mineral merujuk id hilirisasi.json yang ada dan tahap berurut', () => {
  const ids = new Set(hil.baris.map((b) => b.id));
  for (const t of esg.rantai_mineral.tahap) for (const id of t.hilirisasi_ids ?? []) assert.ok(ids.has(id), id);
  for (const s of esg.rantai_mineral.sel_catatan) assert.ok(ids.has(s.hilirisasi_id), s.hilirisasi_id);
  assert.deepEqual(esg.rantai_mineral.tahap.map((t) => t.urut), [1, 2, 3, 4, 5]);
  const p = esg.rantai_mineral.tahap.find((t) => t.id === 'pcam').pemain;
  for (const id of p) assert.ok(esg.rantai_mineral.tambahan.some((x) => x.id === id));
});
test('esg_rantai: konflik kapasitas CATL-IBC ditampilkan dua angka, tidak dipilih', () => {
  const c = esg.rantai_mineral.sel_catatan.find((s) => s.hilirisasi_id === 'catl-ibc');
  assert.deepEqual(c.kapasitas_gwh_alternatif.map((a) => a.nilai), [6.9, 15]);
});

test('purnajual: sumber terdaftar, org_id ada, tanpa kontak pribadi', () => {
  for (const m of pj.merek) {
    if (m.org_id) assert.ok(orgIds.has(m.org_id), m.org_id);
    for (const x of [...m.layanan_lokal, ...m.garansi, ...m.kasus]) assert.ok(adaSumber(pj, x.sumber_id), x.sumber_id);
  }
  for (const k of pj.kasus_lintas) assert.ok(adaSumber(pj, k.sumber_id));
  const txt = JSON.stringify(pj);
  assert.doesNotMatch(txt, /@[a-z0-9-]+\.[a-z]{2,}/i); // surel
  assert.doesNotMatch(txt, /\+62|\b08\d{8,}/); // telepon
});
test('purnajual: garansi global tidak diklaim berlaku di Indonesia', () => {
  for (const m of pj.merek) for (const g of m.garansi) assert.notEqual(g.berlaku_indonesia, true);
});
test('purnajual: meta cocok isi', () => {
  assert.equal(pj.meta.jumlah_merek, pj.merek.length);
  assert.equal(pj.meta.jumlah_layanan, pj.merek.reduce((n, m) => n + m.layanan_lokal.length, 0));
});
