// Uji indeks terbuka: normalisasi, bobot, data hilang, kesehatan proyek (fixture kecil).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalisasi, KOMPONEN, BOBOT_PROYEK, BOBOT_LENGKAP, indeksProvinsi, indeksProyek, bangun } from '../scripts/pipa/indeks.mjs';

test('bobot komponen provinsi dan proyek berjumlah 100', () => {
  assert.equal(KOMPONEN.reduce((s, k) => s + k.bobot, 0), 100);
  assert.equal(Object.values(BOBOT_PROYEK).reduce((s, x) => s + x, 0), 100);
  assert.equal(Object.values(BOBOT_LENGKAP).reduce((s, x) => s + x, 0), 100);
});

test('normalisasi persentil dan min-max; null tetap null; seri berbagi nilai', () => {
  const m = new Map([['a', 10], ['b', 20], ['c', 20], ['d', 30], ['e', null]]);
  const p = normalisasi(m, 'persentil');
  assert.deepEqual([p.get('a'), p.get('b'), p.get('c'), p.get('d'), p.get('e')], [0, 50, 50, 100, null]);
  const mm = normalisasi(new Map([['a', 90], ['b', 100], ['c', 95]]), 'minmax');
  assert.deepEqual([mm.get('a'), mm.get('b'), mm.get('c')], [0, 100, 50]);
  assert.equal(normalisasi(new Map([['a', 5], ['b', 5]]), 'minmax').get('a'), 50);
  assert.equal(normalisasi(new Map([['a', null]]), 'persentil').get('a'), null);
});

const pel = (kode, nama, surya, hidro) => ({ kode, nama, potensi: { surya: { mw: surya } }, terpasang: { hidro: { mw: hidro } }, bpp: { nilai_rp_kwh: 1000 } });
const MASUKAN = {
  peluang: { baris: [pel('11', 'Aceh', 100, 10), pel('12', 'Sumut', 300, 30)] },
  kelistrikan: { baris: [{ kode: '11', rasio_elektrifikasi_persen: 99 }, { kode: '12', rasio_elektrifikasi_persen: null }] },
  ruptl: { baris: [{ provinsi: 'Aceh', regional: 'sum', kapasitas_mw: 50 }] },
  wilayah: { baris: [{ kode: '11', organisasi: [{}, {}], rued: { perda: '2/2022' } }, { kode: '12', organisasi: [], rued: { perda: null } }] },
  proyek: { baris: [{ lokasi: { provinsi: 'Aceh' } }] },
  plts_atap: { baris: [{ regional: 'sum', kuota_mw: 5 }, { regional: 'sum', kuota_mw: 7 }] },
  wkp: { baris: [] },
};

test('data hilang ditandai, tidak diisi nol, bobot dinormalisasi ulang', () => {
  const [a, b] = ['11', '12'].map((k) => indeksProvinsi(MASUKAN).find((x) => x.kode === k));
  assert.equal(b.komponen.elektrifikasi.skor, null);
  assert.ok(b.kosong.includes('elektrifikasi') && b.kosong.includes('rued') && b.kosong.includes('wkp') && b.kosong.includes('plts_atap'));
  assert.ok(a.kosong.includes('wkp') && !a.kosong.includes('rued'));
  assert.equal(a.komponen.plts_atap.mentah, 12);
  assert.equal(b.komponen.ruptl.mentah, 0); // hitungan: tanpa baris = 0, bukan hilang
  assert.ok(b.kelengkapan < a.kelengkapan);
  assert.ok(b.skor >= 0 && b.skor <= 100);
});

test('peringkat hanya untuk kelengkapan cukup', () => {
  const m = { ...MASUKAN, peluang: { baris: [{ kode: '11', nama: 'Aceh' }, { kode: '12', nama: 'Sumut' }] }, kelistrikan: { baris: [] }, plts_atap: { baris: [] } };
  const out = indeksProvinsi(m);
  assert.ok(out.every((p) => p.kelengkapan < 0.6 && p.peringkat === null));
});

const BERITA = { baris: [{ id: 'b1', terbit: '2026-10-01T00:00:00Z', proyek_ids: ['p1'] }] };
const PROYEK = { baris: [
  { id: 'p1', nama: 'Sehat', status: [{ nilai: 'konstruksi' }], cod_target: [{ nilai: 2027 }], kapasitas: [{ nilai: 10 }], lokasi: { provinsi: 'Aceh' }, pihak: { pemilik: [{ nilai: 'X' }] }, sumber: [{ url: 'https://x.id' }] },
  { id: 'p2', nama: 'Telat', status: [{ nilai: 'rencana' }], cod_target: [{ nilai: 2024 }], lokasi: {}, sumber: [] },
  { id: 'p3', nama: 'Jalan', status: [{ nilai: 'beroperasi' }], kapasitas: [{ nilai: 1 }], lokasi: { provinsi: 'Aceh' }, pihak: { pemilik: [{ nilai: 'Y' }] }, sumber: [{ url: 'https://y.id' }] },
] };

const P4 = { id: 'p4', nama: 'Sepi', status: [{ nilai: 'rencana' }], cod_target: [{ nilai: 2030 }], kapasitas: [{ nilai: 5 }], lokasi: { provinsi: 'Aceh' }, pihak: { pemilik: [{ nilai: 'Z' }] }, sumber: [{ url: 'https://z.id' }] };
const P5 = { id: 'p5', nama: 'Mangkrak', status: [{ nilai: 'rencana', status_asli: 'Ditunda' }], cod_target: [{ nilai: 2030 }], kapasitas: [{ nilai: 5 }], lokasi: { provinsi: 'Aceh' }, pihak: { pemilik: [{ nilai: 'Z' }] }, sumber: [{ url: 'https://z.id' }] };

test('kesehatan proyek dan kelengkapan data dua dimensi terpisah', () => {
  const o = Object.fromEntries(indeksProyek({ proyek: { baris: [...PROYEK.baris, P4, P5] }, berita: BERITA }, '2026-11-08').map((p) => [p.id, p]));
  assert.equal(o.p1.kategori, 'sehat'); assert.equal(o.p1.skor, 100);
  assert.equal(o.p2.kategori, 'bermasalah'); assert.equal(o.p2.sinyal.jadwal, 20); // telat 2 tahun
  assert.match(o.p2.alasan_teks, /lewat COD rencana 2 tahun/);
  assert.equal(o.p2.data_tipis, true); // kelengkapan tipis tercatat terpisah
  assert.equal(o.p3.kategori, 'sehat'); assert.equal(o.p3.sinyal_lengkap.kabar, null); // beroperasi: kabar tak relevan
  // tanpa kabar saja BUKAN bermasalah: netral "data perlu diperbarui", skor kesehatan tidak turun
  assert.equal(o.p4.kategori, 'data_tipis'); assert.equal(o.p4.skor, 100); assert.equal(o.p4.alasan.length, 0);
  assert.match(o.p4.alasan_tipis_teks, /tidak ada kabar/);
  // status tertunda = sinyal nyata
  assert.equal(o.p5.kategori, 'bermasalah'); assert.equal(o.p5.sinyal.status, 0);
});

test('bangun deterministik dan memuat metode, versi, sumber', () => {
  const m = { ...MASUKAN, proyek: PROYEK, berita: BERITA };
  const a = JSON.stringify(bangun(m, '2026-11-08')), b = JSON.stringify(bangun(m, '2026-11-08'));
  assert.equal(a, b);
  const j = JSON.parse(a);
  assert.equal(j.label, 'Hipotesis'); assert.ok(j.versi && j.tanggal);
  assert.ok(j.metode.provinsi.komponen.every((k) => k.sumber.length && k.bobot > 0));
});

test('public/data/indeks.json ada dan 38 provinsi', { skip: !fs.existsSync(new URL('../public/data/indeks.json', import.meta.url)) }, () => {
  const j = JSON.parse(fs.readFileSync(new URL('../public/data/indeks.json', import.meta.url), 'utf8'));
  assert.equal(j.provinsi.length, 38);
});
