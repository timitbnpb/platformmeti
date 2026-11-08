// public/data/biaya_bangun.json: hasil bangun(), tiap angka bersumber, bertanggal, bertingkat bukti; turunan Rp benar; id proyek ada di proyek.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun, KURS } from '../scripts/panen/biaya_bangun_lib.mjs';

const baca = (f) => JSON.parse(fs.readFileSync(new URL('../public/data/' + f, import.meta.url), 'utf8'));
const B = baca('biaya_bangun.json');
const TINGKAT = new Set(['resmi', 'kajian', 'media', 'kata-pihak', 'hipotesis', 'EST', 'via-pihak-ketiga']);
const ids = new Set(B.sumber.map((s) => s.id));
const S = (id) => B.skala.find((s) => s.id === id);

test('berkas sama dengan hasil bangun() (tak ada suntingan tangan)', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(bangun())), B);
});
test('sumber https; tiap objek berisi sumber_id merujuk sumber terdaftar, ada tanggal dan tingkat bukti sah', () => {
  for (const s of B.sumber) assert.match(s.url, /^https:\/\//);
  let n = 0;
  (function jalan(o) {
    if (Array.isArray(o)) return o.forEach(jalan);
    if (o && typeof o === 'object') {
      if ('sumber_id' in o) { n++; assert.ok(ids.has(o.sumber_id), o.sumber_id); assert.ok(TINGKAT.has(o.tingkat_bukti), JSON.stringify(o).slice(0, 80)); assert.match(o.tanggal || '2026-11-08', /^\d{4}-\d{2}-\d{2}$/); }
      Object.values(o).forEach(jalan);
    }
  })(B.skala.concat(B.komponen, B.kurva_skala, B.tren.baru));
  assert.ok(n > 60);
});
test('rendah <= tengah <= tinggi dan angka positif', () => {
  for (const s of B.skala) for (const k of ['capex_usd_kw', 'capex_rp_juta_kw', 'capex_usd_kwh']) {
    const c = s[k]; if (!c) continue;
    for (const v of [c.rendah, c.tengah, c.tinggi]) assert.ok(v == null || v > 0, s.id);
    if (c.tengah != null) { assert.ok(c.rendah <= c.tengah, s.id); assert.ok(c.tengah <= c.tinggi, s.id); }
  }
});
test('angka kunci sesuai sumber dan hitungan tangan', () => {
  assert.equal(S('plts-utilitas-dunia').capex_usd_kw.tengah, 691);
  assert.equal(S('pltp-indonesia').capex_usd_kw.tengah, 6042);
  assert.equal(S('plta-dunia').capex_usd_kw.tengah, 2267);
  assert.equal(S('plts-atap-industri').contoh_total_rp_miliar.rendah, 9); // 1 MW x Rp9 juta/kW = Rp9 miliar
  assert.equal(S('plts-atap-industri').contoh_total_rp_miliar.tinggi, 13);
  assert.equal(S('plts-program-100gwp').capex_rp_juta_kw.tengah, 11.4); // Rp1.140 T / 100 GWp
  assert.equal(S('plts-terapung-cirata').hitung.usd_per_kw, 672); // 129 juta / 192 MWp
  assert.equal(S('plts-terapung-cirata').hitung.rp_miliar, 2064);
  assert.equal(S('pltb-sidrap-1').hitung.usd_per_kw, 2000);
  assert.equal(S('plts-bess-hibrid-sulteng').hitung.rp_juta_per_kw, 55); // Rp3,3 T / 60 MWp
  assert.equal(KURS, B.kurs_rp_usd.nilai);
});
test('id proyek yang dirujuk ada di proyek.json; seri tren yang dirujuk ada di harga_komponen.json', () => {
  const P = new Set(baca('proyek.json').baris.map((r) => r.id));
  for (const s of B.skala) for (const id of s.rujukan_proyek || []) assert.ok(P.has(id), id);
  const H = new Set(baca('harga_komponen.json').deret.map((d) => d.id));
  for (const id of B.tren.rujukan_ada.deret) assert.ok(H.has(id), id);
});
test('hidrogen tidak diisi tanpa sumber dan tercatat sebagai celah', () => {
  assert.ok(!B.skala.some((s) => /hidrogen/i.test(s.teknologi + s.nama)));
  assert.ok(B.celah.some((c) => /Hidrogen/.test(c)));
});
