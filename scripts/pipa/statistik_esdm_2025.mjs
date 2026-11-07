#!/usr/bin/env node
// Pemeriksa terbitnya "Statistik Ketenagalistrikan Tahun 2025" (ESDM Gatrik). Per 2026-11-08 BELUM terbit: indeks hanya sampai Tahun 2024.
// Bila terbit, skrip mencetak URL PDF-nya untuk statistik_pln.mjs (yang menambah medan; skema lama tidak diubah).
//   node scripts/pipa/statistik_esdm_2025.mjs --cek | --selftest
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ambil } from './_panen_sopan.mjs';

const INDEKS = 'https://gatrik.esdm.go.id/gatrik/gatrik-api/api/download-index?length=700';
const HOST = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/';
export function cariStatistik(data, tahun) {
  const t = data.filter((d) => d.is_active !== false && new RegExp(`^stati(s)?(k)?tik ketenagalistrikan tahun ${tahun}\\b`, 'i').test(String(d.judul).trim()));
  return t.length ? { judul: t[0].judul, url: HOST + t[0].dokumen } : null;
}
function selftest() {
  const d = [{ judul: 'Statistik Ketenagalistrikan Tahun 2024', dokumen: 'a.pdf' }, { judul: 'Laporan Kinerja 2025', dokumen: 'b.pdf' }];
  assert.equal(cariStatistik(d, 2025), null);
  assert.equal(cariStatistik(d, 2024).url, HOST + 'a.pdf');
  assert.ok(cariStatistik([{ judul: 'Statisktik Ketenagalistrikan Tahun 2020', dokumen: 'c.pdf' }], 2020));
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--selftest') selftest();
  else if (process.argv[2] === '--cek') { const h = cariStatistik((await ambil(INDEKS, { json: true })).data, 2025); console.log(h ? 'TERBIT ' + h.url : 'belum terbit (indeks Gatrik tanpa Statistik Ketenagalistrikan Tahun 2025)'); }
  else console.log('pakai: --cek | --selftest');
}
