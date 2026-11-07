// Pembantu uji bersama: muat dataset dan cek kepala (sumber, meta) seragam.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
export const D = (f) => JSON.parse(readFileSync(new URL('../public/data/' + f, import.meta.url), 'utf8'));
export const BYTES = (f) => readFileSync(new URL('../public/data/' + f, import.meta.url)).length;
export function cekKepala(d, { lisensi }) {
  assert.equal(d.lapis, 'publik');
  const ids = new Set(d.sumber.map((s) => s.id)); assert.equal(ids.size, d.sumber.length);
  for (const s of d.sumber) for (const k of ['id', 'judul', 'penerbit', 'tahun', 'url', 'lisensi']) assert.ok(s[k] != null && s[k] !== '', `${s.id}.${k}`);
  assert.ok(d.sumber.some((s) => lisensi.test(s.lisensi)));
  assert.match(d.meta.diperbarui, /^\d{4}-\d\d-\d\d$/);
  assert.equal(d.meta.jumlah, d.baris.length);
  assert.ok(Array.isArray(d.meta.celah) && d.meta.celah.length > 0);
  return ids;
}
