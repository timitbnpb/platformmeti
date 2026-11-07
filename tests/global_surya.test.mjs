import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validasiPerusahaan, gabungEntitasTambah, kelengkapan, kutip } from '../scripts/pipa/global_pemasok.mjs';
import { validasi as validasiTambah } from '../scripts/pipa/entitas_tambah.mjs';
import { SEGMEN, BENIH } from '../scripts/panen/global_surya_daftar.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const S = new Set(SEGMEN);
const ok = { nama: 'A', negara_iso2: 'CN', segmen: ['modul'], situs: 'https://a.cn', tahun_berdiri: 2000, sumber: [{ url: 'https://x.org/a', tingkat_bukti: 'via-pihak-ketiga', tanggal_periksa: '2026-11-08' }], fakta: [] };

test('pustaka: validasi menolak tanpa sumber/tanggal, segmen asing, negara salah', () => {
  assert.deepEqual(validasiPerusahaan(ok, S), []);
  assert.ok(validasiPerusahaan({ ...ok, sumber: [] }, S).length);
  assert.ok(validasiPerusahaan({ ...ok, sumber: [{ url: 'https://x.org', tingkat_bukti: 'resmi' }] }, S).length);
  assert.ok(validasiPerusahaan({ ...ok, segmen: ['nuklir'] }, S).length);
  assert.ok(validasiPerusahaan({ ...ok, negara_iso2: 'cn' }, S).length);
  assert.ok(validasiPerusahaan({ ...ok, fakta: [{ medan: 'x', sumber_url: 'https://x.org' }] }, S).length);
});
test('pustaka: gabungEntitasTambah idempoten, tidak menimpa entri bukan miliknya', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gs-')), 'e.json');
  fs.writeFileSync(f, JSON.stringify({ tanggal_periksa: '2026-11-01', baris: [{ nama: 'Lama', kategori: 'swasta', sumber: [{ url: 'https://l.id', tingkat_bukti: 'situs-sendiri' }] }] }));
  const opt = { kepakaran: ['plts'], peran: ['penyedia-teknologi-global'], tanggal: '2026-11-08', berkas: f };
  gabungEntitasTambah('t', [ok, { ...ok, nama: 'Lama' }], opt);
  const a = fs.readFileSync(f, 'utf8'); const r = gabungEntitasTambah('t', [ok, { ...ok, nama: 'Lama' }], opt);
  assert.equal(fs.readFileSync(f, 'utf8'), a); assert.deepEqual(r.lewat, ['Lama']);
  const d = JSON.parse(a); assert.equal(d.baris.length, 2); assert.equal(d.baris[0].nama, 'Lama'); assert.deepEqual(validasiTambah(d), []);
});
test('pustaka: kutip dan kelengkapan', () => {
  assert.equal(kutip('The firm has a capacity of 10 GW in total. Another sentence is here ok.', /GW/).length, 1);
  assert.deepEqual(kelengkapan([{ a: 1 }, {}], { a: (r) => r.a }), { a: 50 });
});
test('benih: cakupan minimum per segmen dan tanpa nama kembar', () => {
  const n = (s) => BENIH.filter((b) => b[2].includes(s)).length;
  assert.ok(n('modul') >= 30 && n('inverter-string') >= 15 && n('tracker-mounting') >= 10 && n('bess') >= 15 && n('polisilikon') >= 6);
  assert.equal(new Set(BENIH.map((b) => b[0])).size, BENIH.length);
});
test('data panen: tiap perusahaan bersumber, bertanggal, bertingkat bukti; salinan publik sama', () => {
  const d = J('data/global/surya/perusahaan.json');
  assert.deepEqual(d, J('public/data/global/pemasok_surya.json'));
  assert.equal(d.jumlah, d.baris.length); assert.ok(d.jumlah >= 90);
  for (const r of d.baris) {
    assert.deepEqual(validasiPerusahaan(r, S), []);
    for (const k of ['kapasitas', 'pangsa_pasar', 'pabrik_indonesia', 'isu_dagang']) for (const x of r[k]) assert.ok(x.kutipan && x.sumber_url && x.tanggal_periksa && x.tingkat_bukti, r.nama + ' ' + k);
    for (const x of r.fakta) assert.notEqual(x.tingkat_bukti, 'tinggi');
    if (r.logo) assert.ok(fs.existsSync(path.join(ROOT, 'public', r.logo.url)), r.nama + ' logo');
  }
});
test('entitas_tambah memuat pemasok global dan lolos validasi', () => {
  const d = J('data/direktori/entitas_tambah.json');
  assert.deepEqual(validasiTambah(d), []);
  const g = d.baris.filter((b) => b._asal === 'global_surya');
  assert.ok(g.length >= 80); assert.ok(g.every((b) => b.kategori === 'internasional' && b.peran_rantai.includes('penyedia-teknologi-global')));
});
