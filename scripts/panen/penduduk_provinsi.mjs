#!/usr/bin/env node
// Penduduk per provinsi -> data/kembaran/pelengkap.json (dipakai kartu provinsi: penduduk, kWh per kapita).
// SUMBER SEMENTARA: public/data/kelistrikan.json (penduduk dari public/data/wilayah.json = Wikipedia id yang mengutip BPS; tahun
// tiap provinsi berbeda, 2023-2026). Tabel BPS langsung belum terjangkau tanpa kunci WebAPI: tabel dinamis 1886 (Proyeksi Penduduk
// per provinsi, SUPAS 2015) hanya menyajikan tahun 2020 di HTML; var 1975 hanya nasional. Ganti isi skrip ini bila tabel BPS 2024 ditemukan.
// Pakai: node scripts/panen/penduduk_provinsi.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const k = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/kelistrikan.json'), 'utf8'));
const w = k.sumber.find((s) => s.id === 'wilayah-json');
const penduduk = k.baris.filter((b) => b.penduduk > 0 && b.penduduk_tahun).map((b) => ({ kode: b.kode, nama: b.provinsi, tahun: b.penduduk_tahun, jiwa: b.penduduk, src: 'wilayah-json', bukti: 'via-pihak-ketiga' })).sort((a, b) => (a.kode < b.kode ? -1 : 1));
const out = { meta: { catatan: 'Tahun penduduk berbeda per provinsi (2023-2026); kWh per kapita memakai penjualan BPS 859 2024, selisih tahun dicatat di kartu.', dibuat_oleh: 'scripts/panen/penduduk_provinsi.mjs' }, sumber: [{ id: 'wilayah-json', judul: 'Penduduk provinsi (BPS, dikutip Wikipedia id; public/data/wilayah.json)', penerbit: w?.penerbit ?? 'METI Network (via Wikipedia, sumber asli BPS)', url: 'https://id.wikipedia.org/wiki/Daftar_provinsi_di_Indonesia', lisensi: 'CC BY-SA 4.0 (Wikipedia); data asal BPS', tanggal_data: '2025', tanggal_ambil: k.diperbarui ?? null }], penduduk };
fs.writeFileSync(path.join(ROOT, 'data/kembaran/pelengkap.json'), JSON.stringify(out) + '\n');
console.log('data/kembaran/pelengkap.json', penduduk.length, 'provinsi');
