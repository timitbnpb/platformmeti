#!/usr/bin/env node
// public/data/tkdn_produk.json: sertifikat TKDN Kemenperin per produk/pabrikan untuk modul, inverter, baterai, turbin, kabel, trafo, struktur.
// Masukan: hasil rantai_teknologi_panen.mjs --ambil (data-panen/rantai/tkdn/*.json, di-.gitignore). Tidak ada permintaan HTTP di sini.
//   node scripts/pipa/tkdn_produk.mjs --bangun | --selftest
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ROOT, bungkus, tulis, saring, baca } from './dataset_lib.mjs';
import { indeksOrg, cocokOrg } from './_cocok.mjs';

export const TGL = '2026-11-08';
const RAWS = process.env.TKDN_RAW ? [process.env.TKDN_RAW] : [path.join(ROOT, 'data-panen/rantai/tkdn'), path.join(ROOT, 'data-panen/keuangan/raw/tkdn')];
const SUMBER = [{ id: 's-tkdn', judul: 'Sertifikat TKDN Barang (pencarian publik)', penerbit: 'Kementerian Perindustrian (P3DN)', tahun: 2026, url: 'https://tkdn.kemenperin.go.id/sertifikat', lisensi: 'Data publik pemerintah; hanya fakta sertifikat dan tautan', tanggal_akses: TGL }];
// urutan = prioritas bila satu produk cocok lebih dari satu kategori
export const KAT = [
  ['modul', /modul surya|panel surya|photovoltaic|pv module|solar (panel|module|cell)|sel surya/i],
  ['inverter', /inverter/i],
  ['baterai', /lithium|lifepo|battery energy|\bbess\b|baterai (sekunder|lithium|ion)|battery pack|akumulator/i],
  ['turbin', /turbin|turbine|mikrohidro|pltmh|generator sinkron|penstock|pipa pesat/i],
  ['trafo', /transformator|trafo|transformer/i],
  ['kabel', /kabel|cable|konduktor|conductor/i],
  ['struktur', /\btiang\b|menara|tower|mounting|struktur (baja|surya)|rangka (panel|surya)/i],
];
export const BUKAN = /pendingin|air conditioner|\bac\b|kendaraan|mobil|motor listrik|sepeda|ambulan|karoseri|forklift|kesehatan|pelumas|ventilator|serat optik|fiber optic|\boil\b|minyak|telepon|televisi|aki untuk|telemetry|data logger|training|praktikum|pompa|jembatan|spanner|gas turbine|lampu|traffic|dryer|turboklin|aluminium profil/i;
const BULAN = { jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, agu: 8, agt: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12 };
export function tanggalIso(t) { // "03 Sep 2027" -> "2027-09-03"
  const m = String(t || '').trim().match(/^(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})$/); const b = m && BULAN[m[2].toLowerCase()];
  return b ? `${m[3]}-${String(b).padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
}
export const kategori = (r) => { const t = [r.produk, r.tipe, ...(r.spesifikasi || [])].join(' '); if (BUKAN.test(t + ' ' + (r.kelompok_barang || ''))) return null; return (KAT.find(([, re]) => re.test(t)) || [])[0] || null; };

export function bangun(rowsDariBerkas, org = []) {
  const idx = indeksOrg(org), cache = new Map(), lihat = new Set(), out = [];
  const orgId = (n) => { if (!cache.has(n)) cache.set(n, cocokOrg(n, idx)?.id ?? null); return cache.get(n); };
  for (const { url, rows } of rowsDariBerkas) for (const r of rows) {
    const kat = kategori(r); if (!kat || !(r.tkdn_persen > 0) || !r.perusahaan) continue;
    const k = [r.perusahaan, r.produk, r.tipe, r.berlaku_sd].join('|'); if (lihat.has(k)) continue; lihat.add(k);
    const sd = tanggalIso(r.berlaku_sd);
    out.push({ kategori: kat, pabrikan: r.perusahaan, pabrikan_org_id: orgId(r.perusahaan), produk: r.produk, merk: r.merk, tipe: r.tipe, spesifikasi: (r.spesifikasi || []).slice(0, 3),
      tkdn_persen: r.tkdn_persen, bmp_persen: r.bmp_persen, diterbitkan: tanggalIso(r.diterbitkan), berlaku_sampai: sd, aktif: sd ? sd >= TGL : null,
      lokasi: r.lokasi, provinsi: r.provinsi, sumber_id: 's-tkdn', sumber_url: url, tanggal: TGL, tingkat_bukti: 'resmi' });
  }
  out.sort((a, b) => a.kategori.localeCompare(b.kategori) || a.pabrikan.localeCompare(b.pabrikan) || b.tkdn_persen - a.tkdn_persen || String(a.tipe).localeCompare(String(b.tipe)));
  return out.map((b, i) => ({ id: 'tkp_' + String(i + 1).padStart(4, '0'), ...b }));
}
export const CELAH = [
  'Hanya hasil pencarian kata kunci (rantai_teknologi_panen.mjs, hingga 8 halaman per kata); sertifikat yang namanya tidak memuat kata kunci tidak tercakup. Bukan sensus semua sertifikat.',
  'Nomor sertifikat tidak tampil di daftar hasil pencarian publik; halaman detail dan /api/ tidak dipanen (robots.txt). Kolom ini tidak ada.',
  'Kategori ditentukan dari kata kunci pada nama produk/tipe/spesifikasi: "struktur" hanya tiang/menara/mounting; bisa meleset pada nama ganjil. Pabrikan ditautkan ke organisasi hanya bila nama bersih cocok persis (atau Jaccard >= 0,8 tanpa pesaing).',
  'aktif dihitung terhadap tanggal akses data (2026-11-08), bukan jam saat ini.',
];
function selftest() {
  assert.equal(tanggalIso('03 Sep 2027'), '2027-09-03'); assert.equal(tanggalIso('8 Des 2025'), '2025-12-08'); assert.equal(tanggalIso('x'), null);
  assert.equal(kategori({ produk: 'Transformator Distribusi', spesifikasi: [] }), 'trafo');
  assert.equal(kategori({ produk: 'Kabel Serat Optik', spesifikasi: [] }), null);
  assert.equal(kategori({ produk: 'Inverter Pendingin Ruangan', spesifikasi: [] }), null);
  assert.equal(kategori({ produk: 'Modul Surya Inverter', spesifikasi: [] }), 'modul');
  const b = bangun([{ url: 'https://tkdn.kemenperin.go.id/sertifikat?q=x', rows: [{ perusahaan: 'PT Uji', produk: 'Kabel Listrik', tipe: 'A', berlaku_sd: '01 Jan 2020', tkdn_persen: 40, spesifikasi: [] }, { perusahaan: 'PT Uji', produk: 'Kabel Listrik', tipe: 'A', berlaku_sd: '01 Jan 2020', tkdn_persen: 40, spesifikasi: [] }] }], [{ id: 'o1', nama: 'PT Uji' }]);
  assert.equal(b.length, 1); assert.equal(b[0].aktif, false); assert.equal(b[0].pabrikan_org_id, 'o1');
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--selftest') selftest();
  else if (process.argv[2] === '--bangun') {
    const berkas = RAWS.filter((d) => fs.existsSync(d)).flatMap((d) => fs.readdirSync(d).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'))));
    const { ok, ditolak } = saring(bangun(berkas, baca('public/data/organisasi.json').baris));
    const per = {}; for (const b of ok) per[b.kategori] = (per[b.kategori] || 0) + 1;
    const o = bungkus({ baris: ok, sumber: SUMBER, celah: CELAH, ditolak, tambahMeta: { per_kategori: per, jumlah_pabrikan: new Set(ok.map((b) => b.pabrikan)).size } });
    o.dibangun_pada = TGL; o.meta.diperbarui = TGL;
    console.log(tulis('tkdn_produk', o), ok.length, JSON.stringify(per));
  } else console.log('pakai: --bangun | --selftest');
}
