// KJ-04 butir 5: invarian hitung-terkait ontologi (kontrak §6 butir 10) pada objek dari dunia fixture.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bangun } from '../scripts/pipa/graf_jaringan.mjs';
import { LAPIS, bangunIndeks, terkait, lapisBawaan, langkahJejak, potongJejak, cekInvarian } from '../public/jr_ontologi_hitung.js';
import { elemen, ctx, GI, CELAH_SUMATERA } from './fixture/kembaran/dunia.mjs';

const o = bangun(elemen(), ctx(), '2026-11-24', CELAH_SUMATERA).objek;
const ix = bangunIndeks(o);
const semua = LAPIS.flatMap((l) => o[l].map((x) => x.id));

test('penjaga: indeks memuat semua lapis dan objek dunia uji', () => {
  assert.ok(semua.length >= 25, `objek terindeks ${semua.length}, minimal 25`);
  for (const l of LAPIS) assert.ok(ix.per[l].size > 0, `lapis ${l} kosong`);
});

test('invarian: tiap objek lolos cekInvarian (ruas terkait > 0 => jalur terkait > 0, lapis sendiri = 1)', () => {
  const salah = semua.map((id) => [id, cekInvarian(ix, id)]).filter(([, s]) => s.length);
  assert.deepEqual(salah, [], `${salah.length} objek melanggar §6.10, contoh ${JSON.stringify(salah[0])}`);
});

test('invarian: pada tiap objek, ruas terkait > 0 maka jalur terkait > 0 (dihitung langsung, bukan lewat cekInvarian)', () => {
  for (const id of semua) {
    const h = terkait(ix, id);
    if (h.rs.length && ix.lap.get(id) !== 'rs') assert.ok(h.jl.length > 0, `${id}: ${h.rs.length} ruas terkait tetapi jalur 0`);
  }
});

test('terkait: sistem mencakup semua ruas dan jalurnya; gardu menarik ruas, jalur, pembangkit', () => {
  const s = terkait(ix, o.sis[0].id);
  assert.equal(s.rs.length, o.rs.length - 1, 'sistem harus memuat semua ruas kecuali potongan kecil');
  const g = terkait(ix, GI.E);
  assert.ok(g.rs.length >= 2 && g.jl.length >= 2 && g.pb.length === 1, `GI E: rs ${g.rs.length}, jl ${g.jl.length}, pb ${g.pb.length}`);
});

test('invarian DITOLAK: indeks yang merusak relasi jalur memicu pelanggaran', () => {
  const rusak = bangunIndeks({ ...o, jl: [], rs: o.rs.map((r) => ({ ...r, jl: null })), gi: o.gi.map((g) => ({ ...g, jl: [] })) });
  const salah = cekInvarian(rusak, o.sis[0].id);
  assert.ok(salah.some((s) => /jalur 0/.test(s)), `ruas terkait tanpa jalur seharusnya terdeteksi: ${JSON.stringify(salah)}`);
});

test('jejak: objek terkait menambah satu langkah; tak terkait mengganti jejak; klik langkah memotong', () => {
  const sis = o.sis[0].id, gi = GI.E;
  assert.deepEqual(langkahJejak(ix, [sis], gi), [sis, gi], 'gardu di sistem itu = terkait, tambah langkah');
  const op = o.op[0]?.id, lain = o.prov.find((p) => p.id === 'prov_32')?.id;
  assert.ok(lain, 'prov_32 harus ada di fixture');
  // pembangkit tak terhubung ke gardu lain: pilih dua objek satu lapis (sama lapis tak terkait) -> jejak baru
  assert.deepEqual(langkahJejak(ix, [GI.A], GI.G), [GI.G], 'objek satu lapis tidak menumpuk');
  assert.deepEqual(langkahJejak(ix, [sis, gi, 'x'], sis), [sis], 'memilih langkah yang sudah ada memotong');
  assert.deepEqual(potongJejak([1, 2, 3], 1), [1, 2]);
});

test('lapisBawaan: lapis terkait terdekat yang tidak kosong; objek sendiri bila semuanya kosong', () => {
  assert.equal(lapisBawaan({ op: [], sis: [], prov: [], pb: [], gi: ['g'], jl: [], rs: [] }, 'pb'), 'gi');
  const kosong = Object.fromEntries(LAPIS.map((l) => [l, []]));
  assert.equal(lapisBawaan(kosong, 'rs'), 'rs');
});
