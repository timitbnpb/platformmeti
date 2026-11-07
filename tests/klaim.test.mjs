// Klaim karbon dan lahan (Fase 2): invarian klaim_lahan.json dan aturan bendera integritas_karbon.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { uji, JENIS } from '../scripts/pipa/integritas_karbon.mjs';
const J = (f) => JSON.parse(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'));

test('klaim_lahan: tumpang tindih tidak melebihi luas lapis terkecil per provinsi, hasil berlabel hipotesis', () => {
  const K = J('public/data/klaim_lahan.json');
  assert.equal(K.tingkat_bukti, 'hipotesis');
  assert.ok(Object.keys(K.provinsi).length >= 34);
  for (const [kode, P] of Object.entries(K.provinsi)) for (const [k, v] of Object.entries(P.tumpang)) {
    const [a, b] = k.split('+'); assert.ok(v <= Math.min(P.ha[a] || 0, P.ha[b] || 0) + 1, `${kode} ${k}`);
  }
  assert.ok(K.status.some((s) => s.id === 'ps' && !s.ok && s.alasan), 'yang diblokir ditulis jujur');
});
test('integritas: bendera memuat fakta, sumber, tanggal; jenis dikenal; tanpa kata menuduh', () => {
  const D = J('public/data/integritas_karbon.json'), ids = new Set(JENIS.map((j) => j.id));
  assert.ok(D.baris.length > 0);
  for (const r of D.baris) for (const b of r.bendera) {
    assert.ok(ids.has(b.jenis)); assert.ok(b.fakta && b.sumber?.judul && b.tanggal);
    assert.doesNotMatch(b.fakta, /penipu|menipu|korupsi|ilegal|melanggar hukum/i);
  }
});
test('uji: dua registri berbeda dengan nama dan lokasi mirip ditandai ganda_registri', () => {
  const mk = (id, reg) => ({ id, nama: 'Kalimantan Mangrove Restoration Project', lat: -1, lng: 110, luas_ha: 100, pengembang: 'X', raw: { registri: reg, registri_id: id, metodologi: 'VM0033', status: 'terdaftar', kredit: { diterbitkan: 0 }, sumber_url: 'https://example.org' } });
  const baris = [mk('a', 'Verra VCS'), mk('b', 'Gold Standard')];
  const h = uji(baris, { proyek: [] });
  assert.ok(h[0].bendera.some((b) => b.jenis === 'ganda_registri'));
});
