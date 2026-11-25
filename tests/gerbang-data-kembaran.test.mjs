// KJ-05: gerbang data kembaran (statis, tanpa DB): ruptl_jaringan.json dan statistik.json.
// Invarian, bukan potret: tiap baris punya src terdaftar + st sah; jumlah per provinsi = total bila tabelnya punya total,
// kecuali baris yang dicatat meta sebagai salah cetak sumber. Yang melanggar DITOLAK (kasus sintetis di bawah).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ruptlJaringan } from '../scripts/pipa/kembaran_pelengkap.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const baca = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const ST = new Set(['sumber', 'hitung', 'menunggu', 'est']);
const TOL_BULAT = 1; // sumber membulatkan per sel: selisih <= 1 kms/MVA wajar; lebih dari itu wajib tercatat di meta.gagal
const jum = (a) => a.reduce((t, x) => t + x, 0);

// ---- pemeriksa murni (diuji juga dengan kasus jahat)
export function periksaJaringan(rj) {
  const salah = [], gagal = rj.gagal || [], dicatat = (p, f) => gagal.some((g) => String(p.sumber_tabel?.[f] || '').includes('Tabel ' + g.tabel + ' '));
  const kode = new Set();
  for (const p of rj.provinsi) {
    if (p.kode) { if (kode.has(p.kode)) salah.push(`${p.lampiran}: kode ${p.kode} ganda`); kode.add(p.kode); }
    for (const f of ['kms', 'mva']) {
      const t = p[f]; if (!t) { salah.push(`${p.lampiran}.${f}: tabel hilang`); continue; }
      if (!p.sumber_tabel?.[f]) salah.push(`${p.lampiran}.${f}: tanpa sumber_tabel`);
      if (!t.total) { salah.push(`${p.lampiran}.${f}: tanpa baris total`); continue; }
      const baris = Object.entries(t).filter(([k]) => k !== 'total'), toleransi = dicatat(p, f) ? Infinity : TOL_BULAT;
      for (const [k, v] of [...baris, ['total', t.total]]) {
        if (v.length !== 11) { salah.push(`${p.lampiran}.${f}.${k}: ${v.length} angka, harus 11`); continue; }
        const d = Math.abs(jum(v.slice(0, 10)) - v[10]); if (d > toleransi) salah.push(`${p.lampiran}.${f}.${k}: jumlah 10 tahun ${jum(v.slice(0, 10))} != total ${v[10]} (selisih ${d})`);
      }
      for (let i = 0; i < 11; i++) { const d = Math.abs(jum(baris.map(([, v]) => v[i] ?? 0)) - (t.total[i] ?? 0)); if (d > toleransi) salah.push(`${p.lampiran}.${f}[${i}]: jumlah baris != total (selisih ${d})`); }
    }
  }
  return salah;
}

export function periksaBaris(tabel, baris, idSumber) {
  const salah = [];
  baris.forEach((r, i) => { if (!idSumber.has(r.src)) salah.push(`${tabel}[${i}]: src '${r.src}' tak terdaftar di sumber[]`); if (!ST.has(r.st)) salah.push(`${tabel}[${i}]: st '${r.st}' di luar ${[...ST]}`); });
  return salah;
}

// ---- penjaga pemeriksa: yang salah DITOLAK, yang benar lolos
const seri = (n) => [n, 0, 0, 0, 0, 0, 0, 0, 0, 0, n];
const prov = (o = {}) => ({ lampiran: 'X1', kode: '99', nama: ['X'], kms: { 150: seri(10), total: seri(10) }, mva: { '150/20': seri(5), total: seri(5) }, sumber_tabel: { kms: 'Tabel X1.1 (hal. 1)', mva: 'Tabel X1.2 (hal. 2)' }, ...o });
test('penjaga pemeriksa jaringan: jumlah salah, deret pendek, kode ganda, tanpa sumber_tabel DITOLAK; salah cetak tercatat dan pembulatan 1 lolos', () => {
  assert.deepEqual(periksaJaringan({ provinsi: [prov()], gagal: [] }), []);
  assert.equal(periksaJaringan({ provinsi: [prov({ kms: { 150: seri(10), total: seri(12) } })], gagal: [] }).length, 1 + 1, 'kolom 0 dan kolom total tak cocok: dua temuan');
  assert.ok(periksaJaringan({ provinsi: [prov({ kms: { 150: [1, 2, 3], total: seri(10) } })] }).some((s) => /3 angka/.test(s)));
  assert.ok(periksaJaringan({ provinsi: [prov(), prov()] }).some((s) => /ganda/.test(s)));
  assert.ok(periksaJaringan({ provinsi: [prov({ sumber_tabel: {} })] }).some((s) => /tanpa sumber_tabel/.test(s)));
  assert.ok(periksaJaringan({ provinsi: [prov({ mva: undefined })] }).some((s) => /tabel hilang/.test(s)));
  const bulat = [10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11]; // jumlah 10, total 11: pembulatan sumber
  assert.deepEqual(periksaJaringan({ provinsi: [prov({ kms: { 150: bulat, total: bulat } })] }), [], 'selisih 1 = pembulatan, lolos');
  const jauh = [10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 500];
  assert.ok(periksaJaringan({ provinsi: [prov({ kms: { 150: jauh, total: jauh } })], gagal: [] }).length >= 1, 'selisih 490 tanpa catatan meta DITOLAK');
  assert.deepEqual(periksaJaringan({ provinsi: [prov({ kms: { 150: jauh, total: jauh } })], gagal: [{ tabel: 'X1.1' }] }), [], 'selisih tercatat di meta.gagal lolos');
  assert.ok(periksaJaringan({ provinsi: [prov({ kms: { 150: jauh, total: jauh } })], gagal: [{ tabel: 'X1.2' }] }).length >= 1, 'catatan untuk tabel lain tak menolong');
});

test('penjaga pemeriksa baris: src tak terdaftar dan st di luar 4 nilai DITOLAK', () => {
  const id = new Set(['A']);
  assert.deepEqual(periksaBaris('t', [{ src: 'A', st: 'sumber' }], id), []);
  assert.equal(periksaBaris('t', [{ src: 'B', st: 'sumber' }], id).length, 1); assert.equal(periksaBaris('t', [{ st: 'sumber' }], id).length, 1, 'tanpa src');
  assert.equal(periksaBaris('t', [{ src: 'A', st: 'kira-kira' }], id).length, 1); assert.equal(periksaBaris('t', [{ src: 'A' }], id).length, 1, 'tanpa st');
});

// ---- data nyata
const RJ = 'data/kembaran/ruptl_jaringan.json', SS = 'data/kembaran/statistik.json', TB = 'data/kembaran/terbitan.json';
for (const f of [RJ, SS, TB]) test(`penjaga: ${f} ada dan terbaca`, () => assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} hilang`));

test('ruptl_jaringan.json: tiap provinsi punya kms dan mva 11 angka, jumlah baris = total, selisih > pembulatan hanya di meta.gagal', () => {
  const rj = baca(RJ);
  assert.ok(rj.provinsi.length >= 30, `provinsi terbaca ${rj.provinsi.length}, minimal 30 (bukan hijau-kosong)`);
  const salah = periksaJaringan(rj); assert.deepEqual(salah, [], `${salah.length} pelanggaran, contoh: ${salah[0]}`);
  for (const g of rj.gagal) assert.ok(rj.provinsi.some((p) => Object.values(p.sumber_tabel || {}).some((s) => s.includes('Tabel ' + g.tabel + ' '))), `meta.gagal ${g.tabel} basi: tak ada tabel itu`);
});

test('ruptl_jaringan.json: kartu pipa membawa st sumber dan src terdaftar di terbitan.json; tahun deret = meta.tahun', () => {
  const rj = baca(RJ), daftar = new Set(baca(TB).sumber.map((s) => s.id)), { kartu, gabungan } = ruptlJaringan(rj);
  assert.equal(kartu.size + gabungan.length, rj.provinsi.length, 'tiap provinsi jadi kartu atau tercatat gabungan');
  const salah = periksaBaris('kartu', [...kartu.values()], daftar); assert.deepEqual(salah, [], `kartu ${salah[0]}`);
  assert.equal(rj.meta.sumber, 'RUPTL-2025'); assert.ok(daftar.has(rj.meta.sumber), `${rj.meta.sumber} tak terdaftar di terbitan.json`);
  for (const [k, v] of kartu) for (const f of ['kms_per_kv_per_tahun', 'mva_per_kv_per_tahun']) for (const [kv, s] of Object.entries(v[f])) assert.equal(s.length, rj.meta.tahun.length, `${k}.${f}.${kv}: ${s.length} angka, harus ${rj.meta.tahun.length} tahun`);
});

test('statistik.json: tiap baris tabel punya src terdaftar di sumber[] dan st sah', () => {
  const ss = baca(SS), id = new Set(ss.sumber.map((s) => s.id));
  assert.ok(id.size >= 12, `sumber terdaftar ${id.size}, minimal 12`);
  const tabel = Object.entries(ss).filter(([k, v]) => Array.isArray(v) && k !== 'sumber');
  assert.ok(tabel.length >= 10 && tabel.every(([, v]) => v.length > 0), `tabel terbaca ${tabel.length}, minimal 10 dan tak ada yang kosong`);
  for (const [k, v] of tabel) { const salah = periksaBaris(k, v, id); assert.deepEqual([...new Set(salah.map((s) => s.replace(/\[\d+\]/, '[]')))], [], `${salah.length} baris melanggar di ${k}, contoh: ${salah[0]}`); }
});

test('statistik.json: jumlah provinsi BPS 859 = baris total Indonesia; cek_total meta konsisten dengan selisih yang dicatatnya', () => {
  const ss = baca(SS), bps = ss.penjualan_provinsi.filter((r) => r.src === 'BPS-859-2024');
  const total = bps.filter((r) => !r.prov_kode), kab = bps.filter((r) => r.prov_kode);
  assert.equal(total.length, 1, `baris total BPS ${total.length}, harus 1`); assert.ok(kab.length >= 30, `provinsi BPS ${kab.length}, minimal 30`);
  const j = jum(kab.map((r) => r.gwh)); assert.ok(Math.abs(j - total[0].gwh) < 0.5, `jumlah ${kab.length} provinsi ${j} GWh != total Indonesia ${total[0].gwh} GWh`);
  const cek = ss.meta.cek_total; assert.ok(cek.length >= ss.meta.tahun_pln_berhasil.length * 3, `cek_total ${cek.length} entri, minimal 3 tabel per tahun`);
  for (const c of cek) {
    if (c.status) { assert.match(c.status, /tanpa baris Indonesia/, `${c.tahun} ${c.tabel}: status tak dikenal '${c.status}'`); continue; } // sumber tak memuat total: tak ada yang dibandingkan
    assert.equal(c.kolom_tidak_cocok, c.tidak_cocok.length, `${c.tahun} ${c.tabel}: kolom_tidak_cocok ${c.kolom_tidak_cocok} != ${c.tidak_cocok.length} yang dirinci`);
    for (const m of c.tidak_cocok) assert.ok(Math.abs(m.jumlah_baris - m.total_indonesia - m.selisih) < 0.02, `${c.tahun} ${c.tabel} ${m.kolom}: selisih tercatat ${m.selisih} != ${m.jumlah_baris} - ${m.total_indonesia}`);
  }
  assert.deepEqual(ss.meta.tahun_pln_berhasil.filter((t) => !cek.some((c) => c.tahun === t)), [], 'tahun berhasil tanpa cek_total');
});

// atlas_sampel.mjs tak mengekspor fungsi (skrip top-level, butuh gdallocationinfo): yang diuji keluarannya, data/kembaran/atlas.json.
test('atlas.json: nilai dalam rentang wajar skrip sampel (PVOUT 300-2600, angin 0,05-40), persentil terurut, n > 0; yang di luar rentang DITOLAK', () => {
  const periksa = (a) => { const s = []; const ring = (k, o, lo, hi) => { if (!o) return; if (!(o.n > 0)) s.push(`${k}: n ${o.n}`); if (!(o.p10 <= o.p50 && o.p50 <= o.p90)) s.push(`${k}: persentil tak urut ${o.p10}/${o.p50}/${o.p90}`); for (const v of [o.rata, o.p10, o.p90]) if (v < lo || v > hi) s.push(`${k}: ${v} di luar ${lo}-${hi}`); };
    for (const [k, v] of Object.entries(a.provinsi)) { ring(k + '.pvout', v.pvout, 300, 2600); ring(k + '.angin', v.angin, 0.05, 40); }
    for (const [id, [pv, an]] of Object.entries(a.gardu)) { if (pv != null && (pv < 300 || pv > 2600)) s.push(`${id}: pvout ${pv}`); if (an != null && (an < 0.05 || an > 40)) s.push(`${id}: angin ${an}`); }
    return s; };
  const ok = { provinsi: { 1: { pvout: { n: 3, rata: 1400, p10: 1300, p50: 1400, p90: 1500 }, angin: null } }, gardu: { g: [1500, 3] } };
  assert.deepEqual(periksa(ok), []);
  assert.ok(periksa({ ...ok, gardu: { g: [9999, 3] } }).length === 1, 'PVOUT 9999 DITOLAK'); assert.ok(periksa({ ...ok, gardu: { g: [1500, 400] } }).length === 1, 'angin 400 m/s DITOLAK');
  assert.ok(periksa({ ...ok, provinsi: { 1: { pvout: { n: 3, rata: 1400, p10: 1500, p50: 1400, p90: 1300 } } } }).length >= 1, 'persentil terbalik DITOLAK');
  const a = baca('data/kembaran/atlas.json'); assert.ok(Object.keys(a.gardu).length >= 100 && Object.keys(a.provinsi).length >= 30, `gardu ${Object.keys(a.gardu).length}, provinsi ${Object.keys(a.provinsi).length}: terlalu sedikit`);
  const s = periksa(a); assert.deepEqual(s, [], `${s.length} pelanggaran, contoh: ${s[0]}`);
});

test('statistik.json: tiap baris tingkat provinsi punya prov_kode (invarian pemakai deret statResmi)', () => {
  const ss = baca(SS);
  for (const k of ['penjualan_provinsi', 'mva_provinsi_tegangan', 'saidi_saifi', 'beban_puncak_sistem']) for (const r of ss[k]) {
    if (r.tingkat === 'provinsi') assert.ok(r.prov_kode, `${k} ${r.tahun} ${r.unit ?? r.baris}: tingkat provinsi tanpa prov_kode`);
  }
});
