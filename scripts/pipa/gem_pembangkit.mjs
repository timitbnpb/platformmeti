#!/usr/bin/env node
// data/gem/*.json + data/proyek_gem.json -> public/data/gem_pembangkit.json (ringkas, publik, per lokasi/pembangkit).
// Tanpa jaringan. Pencocokan ke proyek.json: cocok (skor >= 0,8), ragu (< 0,8: ANTREAN TINJAU, tidak digabung otomatis),
// baru (kandidat hidup belum ada di proyek), dicatat (rencana/ditunda/batal). Pakai: --bangun | --selftest
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { kelompok } from './gem.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TRACKER = ['solar', 'wind', 'hydropower', 'geothermal', 'coal'];
export const AMBANG_COCOK = 0.8;
const j = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

export function statusCocok(skor) { return skor == null ? null : skor >= AMBANG_COCOK ? 'cocok' : 'ragu'; }

export function bangun() {
  const pg = j('data/proyek_gem.json');
  const cocok = new Map(pg.perkaya.map((x) => [x.tracker + x.gem_lokasi_id, x]));
  const baru = new Set(pg.baru.map((x) => x.id));
  const baris = []; const sumber = []; const hitung = { cocok: 0, ragu: 0, baru: 0, dicatat: 0, batubara: 0 };
  for (const t of TRACKER) {
    const d = j(`data/gem/${t}.json`);
    sumber.push({ tracker: t, nama: d.sumber, rilis: d.rilis, url: d.halaman, lisensi: d.lisensi, atribusi: d.atribusi });
    for (const g of kelompok(d.baris)) {
      const ut = d.baris.find((b) => b.lokasi_id === g.lokasi_id);
      const m = cocok.get(t + g.lokasi_id);
      let cocokan;
      if (t === 'coal') { cocokan = { status: 'tidak-berlaku' }; hitung.batubara++; }
      else if (m) { const s = statusCocok(m.skor); cocokan = { status: s, proyek_id: m.proyek_id, skor: m.skor }; hitung[s]++; }
      else if (baru.has(`gem_${t}_${g.lokasi_id}`)) { cocokan = { status: 'baru', proyek_id: `gem_${t}_${g.lokasi_id}` }; hitung.baru++; }
      else { cocokan = { status: 'dicatat' }; hitung.dicatat++; }
      const o = {
        id: `gem-${t}-${g.lokasi_id}`, tracker: t, nama: g.nama, kapasitas_mw: g.kapasitas_mw, status: g.status, jumlah_unit: g.fase.length,
        tahun_mulai: g.fase.map((f) => f.tahun_mulai).filter(Boolean).sort()[0], pemilik: (ut?.pemilik || []).slice(0, 4).map((x) => x.nama),
        provinsi: g.provinsi, lat: g.lat, lon: g.lon, akurasi: g.akurasi, url_wiki: g.url_wiki, pencocokan: cocokan,
      };
      baris.push(Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && !(Array.isArray(v) && !v.length))));
    }
  }
  baris.sort((a, b) => a.id.localeCompare(b.id));
  const hasil = { lapis: 'publik', tanggal_akses: '2026-11-08', lisensi: 'CC BY 4.0 (Global Energy Monitor; atribusi wajib)', sumber, ambang_cocok: AMBANG_COCOK,
    catatan: 'Satu baris per lokasi/pembangkit (unit digabung). ragu = antrean tinjau kurator, tidak digabung otomatis. Unit batubara per unit ada di data/strategis/pltu.json.',
    meta: { jumlah: baris.length, pencocokan: hitung }, baris };
  fs.writeFileSync(path.join(ROOT, 'public/data/gem_pembangkit.json'), JSON.stringify(hasil) + '\n', 'utf8');
  return hasil.meta;
}

function selftest() { assert.equal(statusCocok(0.79), 'ragu'); assert.equal(statusCocok(0.8), 'cocok'); assert.equal(statusCocok(null), null); console.log('selftest ok'); }
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest(); else console.log(JSON.stringify(bangun()));
}
