#!/usr/bin/env node
// public/data/konsultasi.json: konsultasi publik regulasi energi + "Posisi METI", dan baris jenis "tenggat" di public/data/kalender.json.
//   node scripts/pipa/data_konsultasi.mjs              bangun konsultasi.json dan sisipkan tenggat ke kalender.json
//   node scripts/pipa/data_konsultasi.mjs --ekstrak    tulis data/konsultasi/posisi_meti_publik.json dari data-panen/arsip-meti/posisi_meti.jsonl
//   node scripts/pipa/data_konsultasi.mjs --selftest
// Posisi METI publik = hanya butir 1-22 (usulan yang disampaikan terbuka pada audiensi/RDPU Komisi XII DPR RI 8 Sep 2026). Butir 23+ (MPR, tim hukum,
// usulan asosiasi) internal dan tidak pernah keluar. Tanpa tenggat terverifikasi, butir tampil di /regulasi tetapi TIDAK masuk kalender.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ROOT, TGL, bacaAda } from './dataset_lib.mjs';

const MAKS_PUBLIK = 22, JENIS = ['ruu', 'rpp', 'rperpres', 'rpermen'];
const aman = (u) => typeof u === 'string' && /^https:\/\//.test(u);
const sah = (k) => JENIS.includes(k.jenis) && k.judul && k.instansi && k.tahap && aman(k.tautan) && /^\d{4}-\d{2}-\d{2}$/.test(k.tanggal_periksa || '') && ['primer', 'dokumen-resmi', 'cuplikan', 'kata-pihak'].includes(k.tingkat_bukti);

export function ekstrakPosisi(jsonl) {
  return jsonl.split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((x) => x.no <= MAKS_PUBLIK)
    .map((x) => ({ no: x.no, topik: x.topik, posisi: x.posisi_meti, pasal: x.rujukan_pasal || null, status: x.status }));
}
export function bangun(seed, posisi, tanggalBangun = TGL) {
  const baris = []; let ditolak = 0;
  for (const k of seed.baris || []) {
    if (!sah(k) || (k.tenggat && !/^\d{4}-\d{2}-\d{2}$/.test(k.tenggat))) { ditolak++; continue; }
    const { posisi_ref, ...isi } = k;
    baris.push({ ...isi, tenggat: k.tenggat || null, posisi_meti: posisi_ref ? { ringkas: k.posisi_ringkas || null, tanggal: '2026-09-08', sumber: 'Audiensi/RDPU Komisi XII DPR RI, 8 Sep 2026', butir: posisi } : null });
  }
  baris.sort((a, b) => (a.tenggat || '9').localeCompare(b.tenggat || '9') || a.id.localeCompare(b.id));
  return { lapis: 'publik', dibangun_pada: tanggalBangun, jumlah: baris.length, baris,
    meta: { ditolak, celah: ['JDIH ESDM (uji publik) 403 untuk bot, partisipasi.setkab.go.id tidak terjangkau, dan DPR belum dipanen: tenggat masukan hanya diisi bila ada sumber resmi; tidak ditebak.', 'Hanya RUU EBET yang punya sumber terverifikasi; RPP/RPerpres/RPermen lain belum dimuat.'] } };
}
/** Baris kalender jenis "tenggat" dari butir yang punya tenggat terverifikasi. Id tg_* supaya bisa diganti ulang. */
export const tenggatDari = (k) => k.baris.filter((b) => b.tenggat).map((b) => ({ id: 'tg_' + b.id, tanggal: b.tenggat, judul: `Tenggat masukan: ${b.judul}`, mitra: b.instansi, jenis: 'tenggat', sumber: { label: 'konsultasi', url: b.tautan, tanggal: b.tanggal_periksa } }));
export function sisipTenggat(kal, tg) {
  const baris = kal.baris.filter((b) => !String(b.id).startsWith('tg_')).concat(tg).sort((x, y) => x.tanggal.localeCompare(y.tanggal) || x.judul.localeCompare(y.judul));
  return { ...kal, jumlah: baris.length, baris };
}
export function selftest() {
  const seed = { baris: [{ id: 'a', jenis: 'ruu', judul: 'RUU X', instansi: 'DPR', tahap: 'pembahasan', tautan: 'https://dpr.go.id/x', tanggal_periksa: '2026-11-08', tingkat_bukti: 'primer', tenggat: '2026-12-01', posisi_ref: true }, { id: 'b', jenis: 'rpp', judul: 'tanpa sumber' }] };
  const h = bangun(seed, [{ no: 1 }], '2026-11-08');
  assert.equal(h.jumlah, 1); assert.equal(h.meta.ditolak, 1);
  const tg = tenggatDari(h); assert.equal(tg[0].jenis, 'tenggat');
  const k = sisipTenggat(sisipTenggat({ baris: [{ id: 'ac_1', tanggal: '2026-01-01', judul: 'z' }] }, tg), tg); assert.equal(k.jumlah, 2);
  const e = ekstrakPosisi('{"no":1,"topik":"T","posisi_meti":"P","status":"Prioritas"}\n{"no":23,"topik":"internal","posisi_meti":"R","status":"x"}'); assert.equal(e.length, 1);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  selftest();
  const posisiF = path.join(ROOT, 'data/konsultasi/posisi_meti_publik.json');
  if (process.argv.includes('--selftest')) console.log('selftest ok');
  else if (process.argv.includes('--ekstrak')) {
    const e = ekstrakPosisi(fs.readFileSync(path.join(ROOT, 'data-panen/arsip-meti/posisi_meti.jsonl'), 'utf8'));
    fs.writeFileSync(posisiF, JSON.stringify(e, null, 1) + '\n', 'utf8'); console.log('posisi publik:', e.length);
  } else {
    const h = bangun(bacaAda('data/konsultasi/seed.json') || {}, bacaAda('data/konsultasi/posisi_meti_publik.json') || []);
    fs.writeFileSync(path.join(ROOT, 'public/data/konsultasi.json'), JSON.stringify(h) + '\n', 'utf8');
    const kf = path.join(ROOT, 'public/data/kalender.json'), tg = tenggatDari(h);
    fs.writeFileSync(kf, JSON.stringify(sisipTenggat(JSON.parse(fs.readFileSync(kf, 'utf8')), tg)), 'utf8');
    console.log('konsultasi.json:', h.jumlah, 'butir; tenggat kalender:', tg.length);
  }
}
