#!/usr/bin/env node
// Potret orang per lapis dari data-panen/orang/rekam_jejak.jsonl -> data-panen/potret/orang-{publik,anggota,pengurus}.json.
// Tidak mengunggah ke R2 (itu tugas potret.yml setelah jaga_unggah). Deterministik: tanggal dari TANGGAL_BANGUN, bukan jam.
//   node scripts/pipa/potret_orang.mjs            bangun
//   node scripts/pipa/potret_orang.mjs --selftest
// Pembagian kolom (delta, ALG §13; KP C-04/C-11 menyempitkan lapis publik): publik = identitas + jabatan + riwayat + tautan;
// anggota = pendidikan, kiprah, foto, metrik akademik; pengurus = jejak penelusuran (asal sumber, ekstraksi, perlu tinjau).
// Ubah KOLOM_LAPIS bila pemilik memutuskan lain; tidak ada kolom kontak/lahir/agama/keluarga di masukan.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const IN = path.join(ROOT, 'data-panen/orang/rekam_jejak.jsonl'), TINJAU = path.join(ROOT, 'data-panen/orang/perlu-tinjau-rekam.jsonl');
const OUT = path.join(ROOT, 'data-panen/potret');
const BANGUN = process.env.TANGGAL_BANGUN || new Date().toISOString().slice(0, 10);
export const KOLOM_LAPIS = {
  publik: ['orang_id', 'nama', 'gelar', 'jenis', 'jabatan_terkini', 'organisasi_terkini', 'riwayat', 'tautan'],
  anggota: ['orang_id', 'pendidikan', 'kiprah', 'foto', 'akademik'],
  pengurus: ['orang_id', 'alias', 'wikidata_id', 'sumber_riwayat', 'ekstraksi', 'diperiksa', 'perlu_tinjau'],
};
const MAKS = 2 * 1024 * 1024;
const POLA = [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, /(?:\+62|\b62|\b0)\s?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,5}\b/, /\b\d{16}\b/];
const baca = (f) => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];

export function bagi(orang, tinjau = []) {
  const tj = new Map(); for (const t of tinjau) (tj.get(t.orang_id) || tj.set(t.orang_id, []).get(t.orang_id)).push(t.alasan);
  const hasil = {};
  for (const [lapis, kolom] of Object.entries(KOLOM_LAPIS)) {
    const baris = orang.map((o) => { const r = { ...o, perlu_tinjau: tj.get(o.orang_id) || [] }; return Object.fromEntries(kolom.filter((k) => r[k] !== undefined && r[k] !== null && !(Array.isArray(r[k]) && !r[k].length && k === 'perlu_tinjau')).map((k) => [k, r[k]])); });
    const json = JSON.stringify({ lapis, dibangun_pada: BANGUN, jumlah: baris.length, orang: baris });
    if (lapis !== 'pengurus') for (const re of POLA) assert.ok(!re.test(json.replace(/https?:\/\/[^"\s]+/g, '')), `pola pribadi di lapis ${lapis}: ${re}`);
    assert.ok(Buffer.byteLength(json) <= MAKS, `lapis ${lapis} > 2 MB: pecah per kelompok`);
    hasil[lapis] = json;
  }
  return hasil;
}
function selftest() {
  const h = bagi([{ orang_id: 'o_1', nama: 'A B', pendidikan: [], foto: null, riwayat: [{ jabatan: 'X' }], tautan: [{ url: 'https://x.org/a@b.co' }] }]);
  assert.ok(!JSON.parse(h.publik).orang[0].pendidikan); assert.ok(JSON.parse(h.anggota).orang[0].pendidikan); assert.ok(JSON.parse(h.pengurus).orang[0].orang_id);
  assert.throws(() => bagi([{ orang_id: 'o_2', nama: 'A', jabatan_terkini: 'hubungi x@y.org' }]));
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else {
    const orang = baca(IN); if (!orang.length) { console.error('rekam_jejak.jsonl kosong; jalankan rekam_jejak.mjs --bangun'); process.exit(1); }
    const h = bagi(orang, baca(TINJAU)); fs.mkdirSync(OUT, { recursive: true });
    for (const [lapis, json] of Object.entries(h)) { fs.writeFileSync(path.join(OUT, `orang-${lapis}.json`), json); console.log(`orang-${lapis}.json`, (json.length / 1024).toFixed(0) + ' KB'); }
  }
}
