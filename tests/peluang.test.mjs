// Skema dan konsistensi public/data/peluang.json (dibangun scripts/pipa/peluang.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun, TEKNOLOGI } from '../scripts/pipa/peluang.mjs';

const baca = (p) => JSON.parse(fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const P = baca('public/data/peluang.json');
const W = baca('public/data/wilayah.json');
const PR = baca('public/data/proyek.json');
const RUEN = baca('data/peluang/ruen_potensi.json');

test('38 provinsi, kode sama dengan wilayah.json', () => {
  assert.equal(P.baris.length, 38);
  assert.deepEqual(P.baris.map((b) => b.kode), W.baris.map((b) => b.kode));
  assert.ok(P.meta.diperbarui && Array.isArray(P.meta.celah));
});

test('tiap angka berisi punya sumber_id terdaftar; tiap teknologi hadir', () => {
  const id = new Set(P.sumber.map((s) => s.id));
  for (const s of P.sumber) for (const k of ['id', 'judul', 'penerbit', 'tahun', 'url']) assert.ok(s[k], `sumber ${s.id}.${k}`);
  for (const b of P.baris) {
    for (const blok of ['potensi', 'terpasang']) {
      for (const t of TEKNOLOGI) {
        const x = b[blok][t];
        assert.ok(x, `${b.kode} ${blok}.${t}`);
        if (x.mw != null) { assert.ok(Number.isFinite(x.mw) && x.mw >= 0); assert.ok(id.has(x.sumber_id), `${b.kode} ${t} sumber`); assert.ok(Number.isInteger(x.tahun)); }
        else assert.ok(x.catatan, `${b.kode} ${blok}.${t} null tanpa catatan celah`);
      }
    }
    assert.ok(id.has(b.faktor_lokasi.sumber_id) && b.faktor_lokasi.F >= 1);
    assert.ok(b.bpp.nilai_rp_kwh != null ? id.has(b.bpp.sumber_id) : b.bpp.alasan_null); // BPP bersumber atau alasan null
  }
});

test('rasio = terpasang / potensi, kosong bila salah satu kosong', () => {
  for (const b of P.baris) for (const [t, r] of Object.entries(b.rasio_pemanfaatan)) {
    if (r.persen == null) continue;
    assert.ok(b.terpasang[t].mw != null && r.penyebut_mw > 0);
    assert.ok(Math.abs(r.persen - (b.terpasang[t].mw / r.penyebut_mw) * 100) < 0.01);
  }
});

test('transkripsi RUEN: jumlah baris sama dengan total tabel (tolok salah ketik)', () => {
  for (const [k, t] of Object.entries(RUEN.tabel)) {
    const s = t.baris.reduce((a, b) => a + b.nilai, 0);
    assert.ok(Math.abs(s - t.total) <= 1.5, `${k}: ${s} vs ${t.total}`);
  }
});

test('proyek: hitungan cocok dengan proyek.json dan tidak melebihi jumlah rencana', () => {
  let rencana = 0;
  for (const p of PR.baris) if (p.lokasi?.provinsi && p.status?.[0]?.nilai === 'rencana') rencana++;
  assert.equal(P.baris.reduce((a, b) => a + b.proyek.rencana, 0), rencana);
  for (const b of P.baris) assert.ok(b.proyek.rencana_tanpa_pengembang <= b.proyek.rencana);
  assert.equal(P.meta.proyek_tanpa_provinsi, PR.baris.filter((p) => !p.lokasi?.provinsi).length);
});

test('harga patokan: tiap teknologi berbunyi, laut null; berkas = hasil bangun (deterministik)', () => {
  const h = P.harga_patokan.teknologi;
  for (const t of ['hidro', 'surya', 'bayu', 'bioenergi', 'panas_bumi']) assert.ok(h[t].tingkat.length >= 3);
  assert.equal(h.laut, null);
  const ulang = bangun({ ruen: RUEN, harga: baca('data/peluang/harga_patokan.json'), wilayah: W, proyek: PR, bpp: baca('data/peluang/bpp.json') });
  assert.equal(JSON.stringify(ulang, null, 1) + '\n', fs.readFileSync(new URL('../public/data/peluang.json', import.meta.url), 'utf8'));
});

test('peluang.json: potensi per teknologi (tunggal + induk Papua + kelompok unik) = total tabel RUEN', async () => {
  const fs = await import('node:fs');
  const ruen = JSON.parse(fs.readFileSync(new URL('../data/peluang/ruen_potensi.json', import.meta.url), 'utf8'));
  const out = JSON.parse(fs.readFileSync(new URL('../public/data/peluang.json', import.meta.url), 'utf8'));
  for (const tek of ['surya', 'bayu', 'hidro', 'mikrohidro', 'bioenergi', 'laut']) {
    let s = 0; const kel = new Set();
    for (const b of out.baris) {
      const c = b.potensi[tek];
      if (c.mw != null) s += c.mw;
      else if (c.kelompok_mw != null) { const k = (c.kelompok || [c.catatan]).join(',') + c.kelompok_mw; if (!kel.has(k)) { kel.add(k); s += c.kelompok_mw; } }
    }
    assert.ok(Math.abs(s - ruen.tabel[tek].total) <= 1.5, `${tek}: ${s} vs ${ruen.tabel[tek].total}`);
  }
  const papua = out.baris.find((b) => b.kode === '91');
  assert.equal(papua.potensi.surya.mw, 2035);
  assert.equal(papua.potensi.surya.pra_pemekaran, true);
  assert.equal(out.baris.find((b) => b.kode === '93').potensi.surya.mw, null);
});
