#!/usr/bin/env node
// Kalender publik: data-panen/arsip-meti/agenda.jsonl + terbitan regulasi (public/data/regulasi.json) -> public/data/kalender.json.
//   node scripts/pipa/potret_kalender.mjs            bangun
//   node scripts/pipa/potret_kalender.mjs --selftest
// Lapis publik HANYA judul, tanggal, mitra, jenis, sumber. Tidak pernah peran_meti, catatan, atau nama dokumen internal.
// Tenggat regulasi dan jadwal ConEx berikutnya tidak ada di masukan; baris baru masuk lewat tenggat.jsonl bila pemilik menyediakannya.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { gabung } from './kalender_perkaya.mjs';
import { tenggatDari } from './data_konsultasi.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AGENDA = path.join(ROOT, 'data-panen/arsip-meti/agenda.jsonl'), TENGGAT = path.join(ROOT, 'data-panen/arsip-meti/tenggat.jsonl');
const REGULASI = path.join(ROOT, 'public/data/regulasi.json'), KELUAR = path.join(ROOT, 'public/data/kalender.json'), KONSUL = path.join(ROOT, 'public/data/konsultasi.json');
const baca = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);

/** Judul publik: sebelum titik dua pertama; bila terlalu pendek, sampai koma/titik koma pertama. Angka rinci di belakangnya ikut dibuang. */
export function judulPublik(topik) {
  const s = String(topik).trim(), a = s.split(':')[0].trim();
  const b = a.length >= 20 ? a : s.split(/[,;]/)[0].trim();
  return b.slice(0, 120);
}
export const mitraPublik = (m) => String(m).replace(/\s*\([^)]*\)/g, '').replace(/\s*\([^)]*$/, '').trim().slice(0, 90);
export function jenisAcara(topik) {
  if (/audiensi|courtesy|rdpu/i.test(topik)) return 'audiensi';
  if (/workshop|kick-off|scoping|fgd/i.test(topik)) return 'lokakarya';
  if (/conex|summit|cop\d|forum|sarasehan/i.test(topik)) return 'konferensi';
  return 'seminar';
}

export function bangun(agenda, regulasi, tenggat, tanggalBangun) {
  const baris = [];
  for (const a of agenda) baris.push({ tanggal: a.tanggal, judul: judulPublik(a.topik), mitra: mitraPublik(a.mitra), jenis: jenisAcara(a.topik), sumber: { label: 'arsip-meti', tanggal: tanggalBangun } });
  for (const r of regulasi) {
    if (!r.tanggal_ditetapkan || r.tanggal_ditetapkan < '2025-01-01' || !r.url_sumber) continue;
    baris.push({ tanggal: r.tanggal_ditetapkan, judul: `${String(r.jenis).toUpperCase()} ${r.nomor}/${r.tahun}: ${r.judul}`, mitra: r.instansi_penerbit, jenis: 'regulasi', regulasi_id: r.id, sumber: { label: 'bpk', url: r.url_sumber, tanggal: r.tanggal_ambil || tanggalBangun } });
  }
  for (const t of tenggat) baris.push({ tanggal: t.tanggal, judul: t.judul, mitra: t.mitra || '', jenis: 'tenggat', sumber: { label: 'tenggat', url: t.url, tanggal: tanggalBangun } });
  baris.sort((x, y) => x.tanggal.localeCompare(y.tanggal) || x.judul.localeCompare(y.judul));
  baris.forEach((b, i) => { b.id = 'ac_' + String(i + 1).padStart(3, '0'); });
  return { lapis: 'publik', dibangun_pada: tanggalBangun, jumlah: baris.length, baris };
}

export function selftest() {
  assert.equal(judulPublik('IndoEBTKE ConEx ke-12, JIEXPO, 2-4 Sep: 944 delegasi, 21 MoU'), 'IndoEBTKE ConEx ke-12, JIEXPO, 2-4 Sep');
  assert.equal(judulPublik('Courtesy call: peran METI, 22 usulan RUU EBET, rencana kerja 90 hari'), 'Courtesy call: peran METI');
  assert.equal(mitraPublik('METI (penyelenggara)'), 'METI');
  const h = bangun([{ tanggal: '2026-09-08', topik: 'Audiensi/RDPU: 22 substansi', mitra: 'Komisi XII DPR RI (pimpinan rapat)', peran_meti: 'RAHASIA', sumber: 'deck', catatan: 'RAHASIA' }], [], [], '2026-11-07');
  assert.doesNotMatch(JSON.stringify(h), /RAHASIA|deck/);
  assert.equal(h.baris[0].jenis, 'audiensi');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) { selftest(); console.log('selftest ok'); } else {
    selftest();
    const reg = JSON.parse(fs.readFileSync(REGULASI, 'utf8'));
    const hasil = bangun(baca(AGENDA), reg.baris, [...baca(TENGGAT), ...tenggatDari(fs.existsSync(KONSUL) ? JSON.parse(fs.readFileSync(KONSUL, 'utf8')) : { baris: [] }).map((t) => ({ tanggal: t.tanggal, judul: t.judul, mitra: t.mitra, url: t.sumber.url }))], process.env.TANGGAL_BANGUN || reg.dibangun_pada);
    const perkaya = path.join(ROOT, 'data/kalender_perkaya.json');
    const akhir = fs.existsSync(perkaya) ? gabung(hasil, JSON.parse(fs.readFileSync(perkaya, 'utf8'))) : hasil;
    fs.writeFileSync(KELUAR, JSON.stringify(akhir));
    console.log(`kalender.json: ${akhir.jumlah} baris`);
  }
}
