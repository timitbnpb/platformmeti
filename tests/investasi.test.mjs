/* /investasi "Ruang investasi": rumus murni dengan kasus hitung tangan, model otomatis, pencocokan pendana, dan keutuhan public/data/investasi.json. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BOBOT, MIN_KOMPONEN, komponenSkor, skorKesiapan, tingkatKesiapan, kelasUkuran, idModel, indeksLokasi, modelProyek, cocokPendana } from '../public/inti/investasi_rumus.js';
import { bangun, muat, negaraPemilik, bangunPendana } from '../scripts/pipa/investasi.mjs';

const dekat = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);
const J = (f) => JSON.parse(fs.readFileSync(new URL('../public/' + f, import.meta.url), 'utf8'));

test('bobot berjumlah 1 dan enam komponen', () => {
  dekat(Object.values(BOBOT).reduce((a, b) => a + b, 0), 1);
  assert.deepEqual(Object.keys(BOBOT).sort(), ['harga', 'izin', 'jaringan', 'lahan', 'pendanaan', 'sumber']);
});

test('komponen: izin = rata-rata status dan skor provinsi; tanpa skor provinsi = status saja', () => {
  assert.equal(komponenSkor({ status: 'izin', izinProv: 60, dana: 'tidak' }).izin, 0.8); // (1 + 0,6) / 2
  assert.equal(komponenSkor({ status: 'rencana', izinProv: null, dana: 'tidak' }).izin, 0.4);
  assert.equal(komponenSkor({ status: 'rencana', izinProv: 100, dana: 'tidak' }).izin, 0.7); // (0,4 + 1) / 2
});
test('komponen: harga = (rasio - 0,6) / 0,8 dijepit 0..1; lahan = 1 - risiko/100; jaringan = 1 - km/100', () => {
  const k = komponenSkor({ status: 'izin', rasioHarga: 1.0, risiko: 30, jarakKm: 25, sumber: 0.5, dana: 'pengembang' });
  assert.equal(k.harga, 0.5); assert.equal(k.lahan, 0.7); assert.equal(k.jaringan, 0.75); assert.equal(k.sumber, 0.5); assert.equal(k.pendanaan, 0.6);
  assert.equal(komponenSkor({ status: 'izin', rasioHarga: 2, dana: 'x' }).harga, 1);
  assert.equal(komponenSkor({ status: 'izin', rasioHarga: 0.3, dana: 'x' }).harga, 0);
  assert.equal(komponenSkor({ status: 'izin', jarakKm: 400, dana: 'x' }).jaringan, 0);
  const kosong = komponenSkor({ status: 'izin', dana: 'tidak' });
  assert.equal(kosong.harga, null); assert.equal(kosong.lahan, null); assert.equal(kosong.jaringan, null); assert.equal(kosong.sumber, null); assert.equal(kosong.pendanaan, 0);
});
test('skor: .25*.8 + .2*.5 + .15*.7 + .15*.5 + .15*.6 + .1*.75 = 0,645 -> 64,5', () => {
  const s = skorKesiapan({ izin: 0.8, harga: 0.5, lahan: 0.7, sumber: 0.5, pendanaan: 0.6, jaringan: 0.75 });
  assert.equal(s.skor, 64.5);
});
test('skor: komponen kosong dikeluarkan, bobot dihitung ulang (0,495 / 0,75 = 66,0)', () => {
  const s = skorKesiapan({ izin: 0.8, harga: 0.5, lahan: 0.7, sumber: null, pendanaan: 0.6, jaringan: null });
  assert.equal(s.skor, 66);
  dekat(s.bobot.izin, 0.25 / 0.75, 1e-12);
});
test(`skor null bila komponen kurang dari ${MIN_KOMPONEN}`, () => {
  assert.equal(skorKesiapan({ izin: 0.8, harga: 0.5, lahan: 0.7, sumber: null, pendanaan: null, jaringan: null }).skor, null);
});
test('tingkat: 60 tinggi, 40 sedang, di bawahnya rendah', () => {
  assert.deepEqual([60, 59.9, 40, 39.9, null].map(tingkatKesiapan), ['t', 's', 's', 'r', null]);
});
test('kelas ukuran: batas 20, 100, 500 MW', () => {
  assert.deepEqual([19.9, 20, 99.9, 100, 499, 500].map(kelasUkuran), ['kecil', 'menengah', 'menengah', 'besar', 'besar', 'sangat-besar']);
});
test('id model per teknologi; penyimpanan, nuklir, sampah tanpa model', () => {
  assert.equal(idModel('surya', 50, 'PLTS Cirata'), 'surya-utilitas');
  assert.equal(idModel('surya', 50, 'Cirata floating solar'), 'surya-terapung');
  assert.equal(idModel('hidro', 10, ''), 'plta'); assert.equal(idModel('hidro', 9.9, ''), 'pltm');
  assert.equal(idModel('bayu', 70, ''), 'bayu'); assert.equal(idModel('panas-bumi', 55, ''), 'panas-bumi'); assert.equal(idModel('bioenergi', 10, ''), 'biomassa');
  for (const t of ['penyimpanan', 'nuklir', 'biomassa-sampah']) assert.equal(idModel(t, 10, ''), null);
});
test('faktor lokasi: Jawa-Bali 0, Sumatera 1, Kalimantan 4, Papua 10', () => {
  assert.deepEqual([31, 51, 11, 18, 61, 71, 52, 94, 92].map(indeksLokasi), [0, 0, 1, 1, 4, 5, 6, 10, 9]);
});

test('model otomatis: PLTS 10 MW di Jawa Barat = capex 10.000 kW x USD 691, tarif = 8,26 sen x F 1 x Rp 16.000 / 100 = Rp 1.322', () => {
  const D = { peluang: J('data/peluang.json'), atap: J('data/plts_atap_hitung.json'), bangun: J('data/biaya_bangun.json'), karbon: J('data/karbon_pasar.json') };
  const m = modelProyek({ tek: 'surya', mw: 10, prov_kode: '32', nama: 'PLTS contoh' }, D);
  assert.equal(m.id, 'surya-utilitas'); assert.equal(m.lok, 0); assert.equal(m.acuan, 'perpres');
  assert.equal(m.capexUsdKw, 691); dekat(m.capexUsd, 10 * 1000 * 691, 1e-3);
  assert.equal(m.tarif, 1322); assert.equal(m.tarif11, 794); // tahun 11 dst: 4,96 sen x 16.000 / 100 = 793,6
  assert.ok(m.lcoe > 0 && m.irr > 0); dekat(m.rasioHarga, m.tarif / m.lcoe, 1e-12);
  assert.equal(modelProyek({ tek: 'penyimpanan', mw: 10, prov_kode: '32' }, D).galat[0], 'tek');
});

/* ---------- pendana yang cocok ---------- */
const P = { tek: 'surya', capexUsd: 100e6, negara: 'JP' };
test('pendana: teknologi dan tiket cocok = skor 1 (0,5 + 0,3 dari 0,8)', () => {
  const c = cocokPendana(P, { jenis: 'lembaga', tek: ['surya', 'bayu'], tiket: 50e6, negara: null });
  assert.equal(c.skor, 1); assert.deepEqual(c.alasan, ['tek', 'ukuran']);
});
test('pendana: tak membatasi teknologi (0,5), tiket 0,05x di luar band, negara sama: (0,25 + 0 + 0,2) / 1 = 0,45', () => {
  const c = cocokPendana(P, { jenis: 'skema', tek: [], tiket: 5e6, negara: 'JP' });
  assert.equal(c.skor, 0.45); assert.deepEqual(c.alasan, ['negara']);
});
test('pendana: teknologi tak cocok = null; ECA hanya bila negara sama; ECA tanpa tiket = (0,25 + 0,2) / 0,7', () => {
  assert.equal(cocokPendana(P, { jenis: 'lembaga', tek: ['hidro'], tiket: 50e6, negara: null }), null);
  assert.equal(cocokPendana(P, { jenis: 'eca', tek: [], tiket: null, negara: 'US' }), null);
  const c = cocokPendana(P, { jenis: 'eca', tek: [], tiket: null, negara: 'JP' });
  assert.equal(c.skor, 0.643); assert.deepEqual(c.alasan, ['negara']);
});
test('negara pemilik: dari pelaku global, atau badan hukum Indonesia', () => {
  const org = new Map([['p_1', { negara_iso2: 'SG' }]]);
  assert.equal(negaraPemilik({ nama: 'Sunseap', org_id: 'p_1' }, org), 'SG');
  assert.equal(negaraPemilik({ nama: 'PT Contoh Energi', org_id: null }, org), 'ID');
  assert.equal(negaraPemilik({ nama: 'Envision Group', org_id: null }, org), null);
  assert.equal(negaraPemilik(null, org), null);
});

/* ---------- potret ---------- */
const D = J('data/investasi.json');
test('potret: bobot, jumlah, urutan skor menurun, hanya status rencana atau izin', () => {
  assert.equal(D.jumlah, D.baris.length); assert.deepEqual(D.metode.bobot, BOBOT); assert.equal(D.metode.status_bobot, 'Hipotesis');
  for (let i = 1; i < D.baris.length; i++) assert.ok((D.baris[i - 1].skor ?? -1) >= (D.baris[i].skor ?? -1), `urutan ${i}`);
  for (const b of D.baris) { assert.ok(['rencana', 'izin'].includes(b.status), b.id); assert.ok(b.mw >= D.metode.saringan.mw_min, b.id); assert.ok(b.prov_kode, b.id); }
  assert.equal(new Set(D.baris.map((b) => b.id)).size, D.baris.length);
});
test('potret: skor tiap proyek dapat dihitung ulang dari masukannya', () => {
  for (const b of D.baris) {
    const k = komponenSkor(b.m);
    assert.deepEqual(k, b.k, b.id);
    assert.equal(skorKesiapan(k).skor, b.skor, b.id);
    assert.equal(tingkatKesiapan(b.skor), b.tingkat, b.id);
  }
});
test('potret: model per proyek konsisten (rasio harga, kebutuhan dana) dan pendana mengacu daftar', () => {
  const ada = new Set(D.pendana.map((p) => p.id));
  for (const b of D.baris) {
    if (b.model.galat) { assert.ok(b.model.galat.length, b.id); assert.equal(b.pendana.length, 0, b.id); continue; }
    dekat(b.model.capex_usd_juta, Math.round(b.mw * 1000 * b.model.capex_usd_kw / 1e5) / 10, 0.11 + b.mw * 1000 * 0.5 / 1e6);
    assert.ok(b.model.lcoe > 0 && b.model.tarif > 0, b.id);
    assert.ok(b.pendana.length <= 6);
    for (const p of b.pendana) { assert.ok(ada.has(p.i), p.i); assert.ok(p.s > 0 && p.s <= 1); }
  }
});
test('potret segar: dibangun ulang dari data sumber = berkas tersimpan', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(bangun(muat()))), D);
});
test('daftar pendana mencakup lembaga, skema, dan ECA', () => {
  const p = bangunPendana({ pendanaan: J('data/pendanaan.json'), pelaku: J('data/global/pelaku_global.json') });
  assert.deepEqual([...new Set(p.map((x) => x.jenis))].sort(), ['eca', 'lembaga', 'skema']);
});
