#!/usr/bin/env node
// Terapkan data/proyek_koordinat.json (titik pembangkit GPPD/Wikidata) ke data-panen/proyek/proyek.jsonl.
//   node scripts/pipa/proyek_koordinat.mjs            idempoten; hanya menimpa presisi provinsi/kabupaten/kosong
//   node scripts/pipa/proyek_koordinat.mjs --selftest
// Lalu bangun ulang potret. Tanpa jaringan; koordinat hanya yang tertulis di berkas masukan.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LEMAH = new Set(['provinsi', 'kabupaten', undefined, null]);

export function terapkan(data, proyek) {
  const per = new Map(proyek.map((p) => [p.id, p])); let n = 0;
  for (const b of data.baris) {
    const p = per.get(b.id); assert(p, 'proyek tidak ada: ' + b.id);
    if (!LEMAH.has(p.presisi_lokasi) && p.lat != null) continue;
    p.lat = b.lat; p.lng = b.lng; p.presisi_lokasi = b.presisi;
    p.sumber_lokasi = { jenis: b.jenis, url: b.url, lisensi: b.lisensi, catatan: `${b.nama_sumber} (${b.rujukan}); dicocokkan nama, teknologi, dan jarak; ${b.tingkat_bukti}` };
    n++;
  }
  return n;
}

if (process.argv.includes('--selftest')) {
  const P = [{ id: 'a', lat: 1, lng: 1, presisi_lokasi: 'provinsi' }, { id: 'b', lat: 5, lng: 5, presisi_lokasi: 'titik_persis' }];
  const d = { baris: [{ id: 'a', lat: 2, lng: 2, presisi: 'titik_persis', jenis: 'gppd', url: 'u', lisensi: 'l', nama_sumber: 'x', rujukan: 'r', tingkat_bukti: 'media' }, { id: 'b', lat: 9, lng: 9, presisi: 'titik_persis', jenis: 'gppd' }] };
  assert.equal(terapkan(d, P), 1); assert.equal(terapkan(d, P), 0); assert.equal(P[0].lat, 2); assert.equal(P[1].lat, 5);
  console.log('selftest ok');
} else {
  const f = path.join(ROOT, 'data-panen/proyek/proyek.jsonl');
  const proyek = fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const n = terapkan(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/proyek_koordinat.json'), 'utf8')), proyek);
  fs.writeFileSync(f, proyek.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
  console.log(JSON.stringify({ diubah: n }));
}
