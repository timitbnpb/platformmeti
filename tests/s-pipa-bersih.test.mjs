// JM-S04 (tanpa Antara), JM-S05 (angka proyek tunggal), JM-S06 (label internal, blok kosong), B-05 (indeks cari hukum).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FEEDS, bukanAntara } from '../scripts/panen/berita.mjs';
import { bangun as rekon } from '../scripts/pipa/proyek_rekon.mjs';

const R = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (f) => path.join(R, 'public/data', f);
const baca = (f) => JSON.parse(fs.readFileSync(P(f), 'utf8'));
const ANTARA = /antaranews\.com|"\s*ANTARA\s*"|"media":"Antara"|"penerbit":"ANTARA"|Antara News/i;

test('S04: feed dan penyaring panen berita menolak Antara', () => {
  assert.ok(FEEDS.every(([m, u]) => !/antara/i.test(m + u)));
  assert.equal(bukanAntara({ media: 'antaranews.com', url: 'https://x.id/a' }), false);
  assert.equal(bukanAntara({ media: 'Antara', url: 'https://x.id/a' }), false);
  assert.equal(bukanAntara({ media: 'x', url: 'https://en.antaranews.com/news/1' }), false);
  assert.equal(bukanAntara({ media: 'katadata.co.id', url: 'https://katadata.co.id/a' }), true);
});

const SKIP = new Set(['ditolak_antara']);   // daftar tolak resmi (media_tier, sumber_katalog) boleh menyebut host
const HOST = /antaranews\.com/i, NAMA = /^\s*(LKBN\s+)?antara(\s+news)?\s*$/i, UCAP = /\bANTARA\b/;
function cari(n, jejak, hasil) {
  if (typeof n === 'string') { if (HOST.test(n) || NAMA.test(n) || UCAP.test(n)) hasil.push(jejak + ' ' + n.slice(0, 60)); return; }
  if (Array.isArray(n)) return n.forEach((x, i) => cari(x, jejak, hasil));
  if (n && typeof n === 'object') for (const [k, v] of Object.entries(n)) { if (SKIP.has(k)) continue; if (HOST.test(k)) hasil.push(jejak + ' kunci ' + k); cari(v, jejak + '.' + k, hasil); }
}
// RATCHET: berkas di bawah masih memuat rujukan Antara (hasil generator/uji sinkron yang belum dibersihkan; lihat tiket lanjutan).
// Daftar ini hanya boleh MENYUSUT: berkas baru yang memuat Antara gagal, dan berkas yang sudah bersih wajib dikeluarkan dari daftar.
const SISA = new Set(['data/internasional/antara.json','data/internasional/bukti.json','data/isu/daerah.json','data/kalender_perkaya.json','data/program_analisis.json','data/proyek_berita.json','data/psn/pengayaan.json','data/rantai/pemasok.json','data/rantai/seed.json','data/rantai_pasok_plts.json','public/data/baterai_ev.json','public/data/biaya_bangun.json','public/data/energi_baru.json','public/data/global/neraca_pasokan.json','public/data/global/radar_rantai.json','public/data/isu.json','public/data/kebijakan_info.json','public/data/keuangan.json','public/data/pendanaan.json','public/data/penyedia_teknologi.json','public/data/produk_meti.json','public/data/program_analisis.json','public/data/proyek_peristiwa.json','public/data/psn.json','public/data/rantai_pasok.json','public/data/rantai_plts.json','public/data/ruptl.json','public/data/sampah_energi.json','public/data/target_realisasi.json','public/data/topik/bayu.json','public/data/topik/bioenergi.json','public/data/topik/dasar-bioenergi.json','public/data/topik/dasar-efisiensi.json','public/data/topik/dasar-hidro.json','public/data/topik/dasar-jaringan.json','public/data/topik/dasar-karbon.json','public/data/topik/dasar-kendaraan-listrik.json','public/data/topik/dasar-nuklir.json','public/data/topik/dasar-panas-bumi.json','public/data/topik/dasar-pembiayaan-hijau.json','public/data/topik/dasar-penyimpanan.json','public/data/topik/dasar-sampah-energi.json','public/data/topik/dasar-surya.json','public/data/topik/dasar-transisi-berkeadilan.json','public/data/topik/hidrogen.json','public/data/topik/kendaraan_listrik.json','public/data/topik/panas_bumi.json','public/data/topik/pembiayaan_hijau.json','public/data/topik/surya.json','public/data/transaksi.json','public/data/wkp.json']);
test('S04: public/data dan data/ terlacak git: tidak ada rujukan Antara baru, daftar sisa hanya menyusut', async () => {
  const { execFileSync } = await import('node:child_process');
  const berkas = execFileSync('git', ['ls-files', 'public/data', 'data'], { cwd: R, encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n').filter((f) => /\.(json|geojson)$/.test(f) && fs.existsSync(path.join(R, f)));
  const baru = [], bersihTapiTercatat = [];
  for (const f of berkas) { const h = []; cari(JSON.parse(fs.readFileSync(path.join(R, f), 'utf8')), f, h); if (h.length && !SISA.has(f)) baru.push(f + ' ' + h[0]); if (!h.length && SISA.has(f)) bersihTapiTercatat.push(f); }
  assert.deepEqual(baru, []);
  assert.deepEqual(bersihTapiTercatat, []);
});

test('S04: keluaran berita, tarif, obligasi, dedieselisasi, plts_atap bebas Antara (tanpa pengecualian)', () => {
  for (const f of ['berita.json', 'berita_foto.json', 'cari/berita.json', 'tarif_harga.json', 'obligasi_hijau.json', 'dedieselisasi.json', 'plts_atap_hitung.json']) { const h = []; cari(baca(f), f, h); assert.deepEqual(h, [], f); }
  const b = baca('berita.json');
  assert.equal(b.jumlah, b.baris.length);
  assert.ok(b.baris.every((r) => bukanAntara(r)));
});

test('S04: tarif_harga hanya memuat baris bersumber dokumen resmi ESDM', () => {
  const d = baca('tarif_harga.json');
  assert.ok(d.baris.length > 0 && d.baris.every((b) => ['resmi', 'turunan'].includes(b.tingkat_bukti) && (b.kelompok !== 'tarif_listrik' || b.tingkat_bukti === 'turunan') && /^https:\/\/www\.esdm\.go\.id\/id\/media-center\/arsip-berita\/./.test(b.sumber_url)));
  assert.ok(!d.baris.some((b) => b.kelompok === 'harga_bbm'));
});

test('S05: angka proyek tunggal dan rekonsiliasi hitungan', () => {
  const r = baca('proyek_rekon.json'), t = baca('proyek_terpadu.json'), l = baca('proyek.json');
  assert.equal(r.angka_proyek.terlacak, t.meta.jumlah);
  assert.equal(r.angka_proyek.rincian.proyek_json_lama, l.jumlah);
  assert.equal(r.angka_proyek.rincian.proyek_json_masuk_terpadu + r.angka_proyek.rincian.proyek_json_tidak_masuk, l.jumlah);
  for (const [tek, k] of Object.entries(r.kapasitas)) {
    assert.match(k.sumber_nasional?.url ?? '', /^https:\/\//, tek); assert.ok(k.sumber_nasional.tahun_data >= 2020, tek);
    assert.ok(k.nasional_mw > 0 && k.cakupan_persen <= 100, tek);
    assert.equal(k.melebihi, k.terlacak_mw > k.nasional_mw, tek);
  }
  assert.deepEqual(rekon(t, l, baca('konsistensi.json')).angka_proyek, r.angka_proyek);   // deterministik
});

test('S06: label internal tidak ada di public/data (teks_*, biaya_listrik, transisi, dst.)', () => {
  const ada = [];
  const jalan = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) jalan(p); else if (/\.json$/.test(e.name) && /unduhan pemilik|manual download/i.test(fs.readFileSync(p, 'utf8'))) ada.push(path.relative(R, p)); } };
  jalan(P(''));
  assert.deepEqual(ada, []);
});

test('S06: blok kosong tercatat dan konsisten dengan isinya', () => {
  const k = baca('blok_kosong.json');
  assert.equal(k.alasan_baku.length, 4);
  assert.deepEqual(k.blok.map((b) => b.berkas).sort(), ['emisi_provinsi', 'paten', 'podcast', 'sosmed_pilihan']);
  assert.ok(k.blok.every((b) => k.alasan_baku.includes(b.alasan) && b.sembunyikan));
});

test('B-05/B-11: tiap kelompok pencarian punya berkas; rujukan logo panduan dan riwayat ada', () => {
  assert.ok(fs.existsSync(P('cari/hukum.json')));
  const salah = [];
  for (const f of ['panduan.json', 'riwayat/entitas/organisasi.json']) for (const m of fs.readFileSync(P(f), 'utf8').matchAll(/"(\/img\/[^"?#]+)/g)) if (!fs.existsSync(path.join(R, 'public', m[1]))) salah.push(m[1]);
  assert.deepEqual(salah, []);
});
