// KJ-04: uji sumber baru pipa kembaran (WRI GPPD, GEM gas, Ember, konstruksi, statistik resmi, captive, batas, tautan organisasi).
// Tiap uji berpasangan: yang benar diterima, yang salah DITOLAK. Fixture: tests/fixture/kembaran/{dunia,sumber}.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, barisGppd, barisGemGas, barisEmber, parseKonstruksi, statResmi, bangun } from '../scripts/pipa/graf_jaringan.mjs';
import { elemen, ctx, P, CELAH_SUMATERA } from './fixture/kembaran/dunia.mjs';
import { GPPD, GEM_GAS, EMBER, KONSTRUKSI, SR } from './fixture/kembaran/sumber.mjs';

const dunia = (c = ctx(), el = elemen()) => bangun(el, c, '2026-11-25', CELAH_SUMATERA);
const pbDari = (o, re) => o.objek.pb.find((p) => re.test(p.nama));

test('penjaga: fixture sumber terbaca (bukan hijau-kosong)', () => {
  for (const [n, t] of [['GPPD', GPPD], ['GEM_GAS', GEM_GAS], ['EMBER', EMBER]]) assert.ok(parseCsv(t).length >= 5, `${n}: baris terbaca ${parseCsv(t).length}, minimal 5`);
  assert.ok(KONSTRUKSI.length >= 5 && SR().penjualan_provinsi.length >= 3);
});

test('parseCsv: kutip, "" di kutip, koma dalam kutip, CRLF; baris satu kolom DITOLAK', () => {
  const r = parseCsv(GPPD);
  assert.equal(r.length, 5, `5 baris data, baris "x" satu kolom harus dibuang; dapat ${r.length}`);
  assert.equal(r[0].name, 'PLTU Uji, Satu (contoh)'); assert.equal(r[0].owner, 'PT "Contoh" Energi');
  assert.equal(r[1].capacity_mw, '', 'sel kosong tetap string kosong'); assert.equal(r[1].url, '', 'kolom hilang diisi kosong');
});

test('barisGppd: hanya IDN + lima bahan bakar + bertitik; Solar, negara lain, tanpa koordinat DITOLAK', () => {
  const b = barisGppd(GPPD);
  assert.deepEqual(b.map((x) => x.id), ['IDN001', 'IDN002'], `id lolos ${JSON.stringify(b.map((x) => x.id))}`);
  assert.equal(b[0].jenis, 'batubara'); assert.equal(b[0].mw, 200.46); assert.equal(b[0].tahun, 2010); assert.equal(b[0].tglData, '2021');
  assert.equal(b[1].mw, null); assert.equal(b[1].tahun, null); assert.equal(b[1].tglData, '2021', 'tanpa tahun data: bawaan 2021'); assert.equal(b[1].pemilik, null);
});

test('barisGemGas: unit dijumlah per proyek; waste heat, retired, negara lain, batu bara DITOLAK; konstruksi bukan operasi', () => {
  const { operasi, proyek } = barisGemGas(GEM_GAS);
  const blok = operasi.find((x) => x.nama === 'Blok Uji');
  assert.equal(blok.mw, 150); assert.equal(blok.unit, 2); assert.equal(blok.tahun, 2008, 'tahun = unit tertua'); assert.equal(blok.jenis, 'gas');
  assert.equal(operasi.find((x) => x.nama === 'Blok Solar')?.jenis, 'diesel');
  for (const n of ['Blok Panas Buang', 'Blok Pensiun', 'Blok Seberang', 'Blok Batu']) assert.ok(![...operasi, ...proyek].some((x) => x.nama === n), `${n} tak boleh lolos`);
  assert.deepEqual(proyek.map((x) => x.status), ['construction']); assert.ok(operasi.every((x) => x.status === 'operating'));
});

test('barisEmber: hanya IDN tingkat negara, tahun tanpa total dibuang, kolom kosong = null', () => {
  const r = barisEmber(EMBER);
  assert.deepEqual(r.map((x) => x.tahun), [2023], `tahun lolos ${JSON.stringify(r.map((x) => x.tahun))}`);
  assert.equal(r[0].total_twh, 300, 'MYS dan baris Region tak boleh menimpa'); assert.equal(r[0].twh.batubara, 200); assert.equal(r[0].twh.hidro, null);
  assert.equal(r[0].emisi_mt.batubara, 190); assert.equal(r[0].fosil_persen, 80); assert.equal(r[0].intensitas_g_kwh, 666);
});

test('parseKonstruksi: tiga bentuk tag diterima, < 66 kV DITOLAK, gardu konstruksi terpisah', () => {
  const k = parseKonstruksi(KONSTRUKSI);
  assert.deepEqual(k.ruas.map((r) => r.id), ['kr_901', 'kr_902', 'kr_903'], `ruas ${JSON.stringify(k.ruas.map((r) => r.id))}`);
  assert.deepEqual(k.ruas.map((r) => [r.kv, r.jenis]), [[500, 'line'], [150, 'cable'], [null, 'line']], 'tegangan hanya bila tercatat');
  assert.equal(k.gardu.length, 1); assert.equal(k.gardu[0].id, 'kg_n905'); assert.equal(k.gardu[0].kv, 150);
  assert.ok(k.ruas.every((r) => r.km > 0));
});

test('konstruksi tidak masuk graf, sistem, atau jembatan; tercatat di ringkas.konstruksi', () => {
  const dasar = dunia(), c = ctx(); c.konstruksi = KONSTRUKSI; const o = dunia(c);
  assert.ok(o.ringkas.konstruksi.ruas === 3 && o.ringkas.konstruksi.gardu === 1, `konstruksi ${JSON.stringify(o.ringkas.konstruksi).slice(0, 120)}`);
  assert.equal(o.objek.rs.length, dasar.objek.rs.length, 'ruas konstruksi bocor ke graf'); assert.equal(o.objek.gi.length, dasar.objek.gi.length, 'gardu konstruksi bocor ke graf');
  assert.equal(o.objek.sis.length, dasar.objek.sis.length);
  assert.deepEqual(o.objek.rs.filter((r) => r.tunggal).map((r) => r.id), dasar.objek.rs.filter((r) => r.tunggal).map((r) => r.id), 'jembatan berubah karena konstruksi');
  assert.ok(!o.objek.rs.some((r) => /^kr_/.test(r.id)) && !o.objek.gi.some((g) => /^kg_/.test(g.id)));
  assert.equal(dasar.ringkas.konstruksi, undefined, 'tanpa masukan konstruksi: tak ada lapis');
  assert.ok(o.geo.konstruksi.length === 4 && o.geo.konstruksi.every((f) => f.status === 'konstruksi'));
});

test('neraca provinsi (BPS) = produksi - penjualan/(1-susut); baris non-BPS, non-tahun, tanpa kode DITOLAK; jumlah neraca konsisten', () => {
  const c = ctx(); c.statResmi = SR(); const e = dunia(c).energi;
  assert.equal(e.meta.tingkat_aliran, 'provinsi');
  assert.deepEqual(e.neraca.map((n) => n.kode), ['32', '33'], 'baris 2021, baris tanpa kode, dan non-BPS tak boleh jadi neraca');
  const n32 = e.neraca.find((n) => n.kode === '32');
  assert.equal(n32.penjualan_gwh, 4000, 'baris PLN-STAT-2021 (123) tak boleh menimpa BPS 2024'); assert.equal(n32.kebutuhan_gwh, Math.round((4000 / 0.92) * 10) / 10); assert.equal(n32.produksi_gwh, 10000);
  for (const n of e.neraca) assert.ok(Math.abs(n.neraca_gwh - (n.produksi_gwh - n.kebutuhan_gwh)) < 0.2, `neraca ${n.kode}`);
  const nas = e.meta.neraca_nasional, jum = e.neraca.reduce((t, n) => t + n.neraca_gwh, 0);
  assert.ok(Math.abs(jum - nas.selisih_gwh) < 0.3, `jumlah neraca provinsi ${jum} != selisih nasional ${nas.selisih_gwh}`);
  assert.equal(dunia().energi.meta.tingkat_aliran, 'wilayah', 'tanpa statResmi: tingkat wilayah, bukan provinsi');
  for (const b of e.batas) assert.ok(b.mw >= 0 && Number.isFinite(b.mw), `aliran ${b.a}-${b.b} ${b.mw}`);
});

test('statResmi: kartu provinsi menjumlah MVA per kV; mva null, beban puncak null, puncak provinsi kecil DITOLAK; keandalan nasional dipisah', () => {
  const S = [{ id: 's1', nama: 'UIW Barat', mw_pln: 1000 }];
  const r = statResmi(SR(), { sistem: S, anggota: new Map([['s1', ['32']]]), namaProv: new Map([['32', 'Provinsi Barat'], ['33', 'Provinsi Timur']]), kodeProv: new Map() });
  const p32 = r.kartuProvinsi.find((k) => k.kode === '32');
  assert.equal(p32.mva_per_kv.total_mva, 250); assert.deepEqual(Object.keys(p32.mva_per_kv.per_kv).sort(), ['150', '70']); // kunci bilangan bulat diurut naik oleh JS; urutan tampil bukan perilaku yang diuji
  assert.equal(p32.mva_per_kv.st, 'hitung', 'dua baris dijumlah = hitung');
  assert.equal(r.kartuProvinsi.find((k) => k.kode === '33')?.mva_per_kv, undefined, 'mva null tak boleh jadi kartu');
  // Tabel 1 = puncak pembangkit per unit, BUKAN beban sistem: tanpa baris RUPTL cocok, beban_puncak tak boleh ada
  assert.equal(r.kartuSistem.length, 1); assert.equal(r.kartuSistem[0].beban_puncak, undefined, 'angka Tabel 1 (900) tak boleh jadi beban_puncak');
  const pu = r.kartuSistem[0].puncak_pembangkit_unit;
  assert.deepEqual(pu.unit, [{ unit: 'UIW Barat', mw: 900 }]); assert.equal(pu.tahun, 2024); assert.match(pu.label, /bukan beban sistem/); assert.equal(pu.st, 'sumber');
  const rp = { id: 'AP-bp-uji', wilayah: 'UIW Barat', cakupan: 'sistem', tahun: 2024, nilai: 700, src: 'RUPTL' }, adaRp = statResmi(SR(), { sistem: S, namaProv: new Map(), kodeProv: new Map(), ruptl: [rp] });
  assert.equal(adaRp.kartuSistem[0].beban_puncak.mw, 700, 'beban_puncak dari RUPTL, bukan 900'); assert.equal(adaRp.kartuSistem[0].puncak_pembangkit_unit.unit[0].mw, 900);
  const lain = statResmi(SR(), { sistem: S, namaProv: new Map(), kodeProv: new Map(), ruptl: [{ ...rp, wilayah: 'Sistem Lain' }, { ...rp, cakupan: 'provinsi' }] });
  assert.equal(lain.kartuSistem[0].beban_puncak, undefined, 'RUPTL nama tak persis atau cakupan bukan sistem DITOLAK');
  const timur = statResmi(SR(), { sistem: [{ id: 's2', nama: 'UIW Timur', mw_pln: 100 }], anggota: new Map(), namaProv: new Map(), kodeProv: new Map() });
  assert.equal(timur.kartuSistem.length, 0, 'beban puncak null tak boleh jadi kartu');
  const kecil = statResmi(SR(), { sistem: [{ id: 's3', nama: 'Jawa-Bali', mw_pln: 10000 }], anggota: new Map([['s3', ['32']]]), namaProv: new Map(), kodeProv: new Map() });
  assert.equal(kecil.kartuSistem.length, 0, 'jumlah provinsi (900) < 20% MW PLN sistem (10000) bukan puncak sistem');
  assert.deepEqual(r.keandalanNasional.map((k) => k.pengukur), ['PLN']); assert.ok(!r.keandalan.some((k) => k.unit === 'Indonesia'));
  assert.equal(r.trenPln[0].jumlah_persen, 80, 'BBN tak boleh dijumlah dua kali'); assert.equal(r.pembandingLain.length + r.pembandingSistem.size, 1);
});

// ---------- captive
const gemBaru = (c, ...b) => { c.gem.baris.push(...b); return c; };
const PBK = { id: 'gemk', status: 'operating', tracker: 'hydropower', lat: P.E[1], lon: P.E[0], kapasitas_mw: 30, nama: 'PLTA Tambang (contoh)', tahun_mulai: 2020 };

test('KAPTIF: pembangkit milik tambang/smelter jadi captive, keluar dari MW PLN dan tak tersambung; pemilik biasa tidak', () => {
  const dasar = dunia(), pln = dunia(gemBaru(ctx(), { ...PBK, pemilik: ['PT Contoh Energi'] }));
  assert.equal(pbDari(pln, /Tambang/).captive, false); assert.equal(pln.objek.sis[0].mw_pln, dasar.objek.sis[0].mw_pln + 30);
  for (const pemilik of ['PT Freeport Indonesia', 'Smelter Nikel Uji', 'PT Vale Indonesia', 'IMIP Morowali']) {
    const o = dunia(gemBaru(ctx(), { ...PBK, pemilik: [pemilik] })), p = pbDari(o, /Tambang/);
    assert.equal(p.captive, true, `${pemilik} harus captive`); assert.equal(p.gi, null, 'captive tak boleh tertempel ke gardu');
    assert.equal(o.objek.sis[0].mw_pln, dasar.objek.sis[0].mw_pln, `${pemilik}: MW captive bocor ke MW PLN`);
  }
});

test('KAPTIF: jaringan beroperator tambang = sistem captive tanpa bauran; pembangkit PLN tak tertempel ke gardu captive', () => {
  const t = (id, lng, lat, nama) => ({ type: 'node', id, lat, lon: lng, tags: { power: 'substation', voltage: '150000', name: nama, operator: 'PT Freeport Indonesia' } });
  const w = (id, a, b) => ({ type: 'way', id, tags: { power: 'line', voltage: '150000', circuits: '1', operator: 'PT Freeport Indonesia' }, geometry: [{ lat: a[1], lon: a[0] }, { lat: b[1], lon: b[0] }] });
  const T = [[107.0, -7.3], [107.3, -7.3], [107.3, -7.0], [107.0, -7.0], [107.15, -7.15]];
  const tambang = [...T.map((p, i) => t(300 + i, p[0], p[1], 'GI Tambang ' + i)), w(310, T[0], T[1]), w(311, T[1], T[2]), w(312, T[2], T[3]), w(313, T[3], T[0]), w(314, T[0], T[4]), w(315, T[4], T[2])];
  const c = ctx();
  c.gem.baris.push({ id: 'gp', status: 'operating', tracker: 'hydropower', lat: -7.15, lon: 107.15, kapasitas_mw: 40, nama: 'PLTA PLN Dekat Tambang (contoh)', tahun_mulai: 2010, pemilik: ['PT PLN (Persero)'] });
  const o = bangun([...elemen(), ...tambang], c, '2026-11-25', CELAH_SUMATERA), cap = o.objek.sis.filter((s) => s.captive);
  assert.equal(cap.length, 1, `sistem captive ${JSON.stringify(o.objek.sis.map((s) => [s.nama, s.captive]))}`);
  assert.match(cap[0].nama, /^Jaringan captive/); assert.equal(cap[0].gi, 5);
  const b = o.energi.bauran.sistem.find((x) => x.id === cap[0].id);
  assert.ok(!b || b.tidak_dihitung, 'sistem captive tak boleh dapat bauran PLN');
  const p = pbDari(o, /PLN Dekat Tambang/);
  assert.equal(p.captive, false);
  assert.ok(!/^gi_n30\d$/.test(p.gi || ''), `pembangkit PLN tertempel ke gardu captive ${p.gi}`);
  assert.equal(o.objek.sis.filter((s) => !s.captive && !s.potongan).length, 1, 'sistem PLN tetap satu');
});

// ---------- batas_mw dan melebihi_puncak
const SAMBUNGAN = { id: 'kabel-uji', nama: 'Kabel uji', jenis_saluran: 'kabel-tanah', tegangan_kv: 150, sirkit: 2, status: 'beroperasi', panjang_km: 80,
  ujung_a: { nama: 'Golf', provinsi: 'Provinsi Timur (contoh)', gardu: 'GI Golf', lat: null, lon: null }, ujung_b: { nama: 'Charlie', provinsi: 'Provinsi Barat (contoh)', gardu: 'GI Charlie', lat: null, lon: null }, src: 'uji', st: 'sumber' };
const BT = { id: 'bt-uji', sambungan_id: 'kabel-uji', nama: 'Kabel uji', batas_mw: 50, jenis_batas: 'kapasitas-transfer', status: 'berlaku', tahun: 2025, src: 'uji', st: 'sumber' };
const KIRIM = { id: 'k-uji', jenis: 'puncak', dari: 'Provinsi Timur (contoh)', ke: 'Provinsi Barat (contoh)', nilai_mw: 10, tahun: 2025, src: 'uji', st: 'sumber' };
const batas1 = (terbitan) => { const c = ctx(); c.terbitan = { sambungan_diketahui: [SAMBUNGAN], ...terbitan }; return dunia(c); };

test('aliran: dipotong HANYA oleh batas kapasitas-transfer/stabilitas; kiriman puncak hanya menandai melebihi_puncak', () => {
  const dasar = batas1({}).energi.batas[0];
  assert.ok(dasar.mw > 50 && !dasar.dibatasi && !dasar.melebihi_puncak, `dasar ${dasar.mw} MW harus > 50 tanpa penanda`);
  const potong = batas1({ batas_terbit: [BT] }).energi.batas[0];
  assert.equal(potong.mw, 50); assert.equal(potong.batas_mw, 50); assert.equal(potong.dibatasi, true); assert.equal(potong.mw_dihitung, dasar.mw);
  assert.equal(batas1({ batas_terbit: [{ ...BT, jenis_batas: 'batas-stabilitas' }] }).energi.batas[0].mw, 50, 'batas-stabilitas juga membatasi');
  for (const salah of [{ jenis_batas: 'melebihi_puncak' }, { jenis_batas: 'kapasitas-pasokan' }, { status: 'rencana' }, { batas_mw: null }]) {
    const x = batas1({ batas_terbit: [{ ...BT, ...salah }] }).energi.batas[0];
    assert.equal(x.mw, dasar.mw, `${JSON.stringify(salah)} tak boleh memotong aliran`); assert.equal(x.batas_mw, undefined);
  }
  const puncak = batas1({ kiriman_terbit: [KIRIM] }).energi.batas[0];
  assert.equal(puncak.melebihi_puncak, true, `aliran ${dasar.mw} MW > puncak 10 MW harus ditandai`); assert.equal(puncak.puncak_mw, 10);
  assert.equal(puncak.mw, dasar.mw, 'kiriman puncak TIDAK boleh memotong aliran'); assert.equal(puncak.dibatasi, undefined);
  const longgar = batas1({ kiriman_terbit: [{ ...KIRIM, nilai_mw: 1e6 }] }).energi.batas[0];
  assert.equal(longgar.melebihi_puncak, undefined, 'aliran di bawah puncak tak boleh ditandai');
});

// ---------- tautan organisasi
test('tautan organisasi: /o/<id> untuk org_id dan nama cocok; nama tak dikenal DITOLAK; id di-encode', () => {
  const c = ctx(); c.organisasi = { baris: [{ id: 'org-contoh', nama: 'PT Contoh Energi', nama_lain: [], singkatan: null }] };
  c.pltu.baris[0].pemilik = { nama: 'PT Lain Sekali', org_id: 'org/aneh 1' };
  c.gem.baris[0].pemilik = ['PT Contoh Energi']; c.gem.baris[1].pemilik = ['PT Tak Dikenal Sama Sekali'];
  const o = dunia(c), org = (re) => pbDari(o, re).tautan.filter((t) => t.jenis === 'organisasi');
  assert.deepEqual(org(/PLTU Uji/), [{ jenis: 'organisasi', id: 'org/aneh 1', url: '/o/org%2Faneh%201' }], 'org_id eksplisit, di-encode');
  assert.deepEqual(org(/Surya Uji/), [{ jenis: 'organisasi', id: 'org-contoh', url: '/o/org-contoh' }], 'nama cocok persis (norm) ke direktori');
  assert.deepEqual(org(/Hidro Uji/), [], 'nama tak ada di direktori tak boleh ditautkan');
  for (const p of o.objek.pb) for (const t of p.tautan.filter((x) => x.jenis === 'organisasi')) assert.match(t.url, /^\/o\/[^/]+$/, `${p.id}: ${t.url}`);
});
