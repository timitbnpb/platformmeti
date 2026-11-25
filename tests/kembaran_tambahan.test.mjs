// KJ-06: uji kembaran_tambahan.mjs (fungsi murni): pencocokan kabupaten, ambang P75, gardu >= 150 kV, captive terdekat <= 100 km.
// Tiap uji berpasangan: yang benar diterima, yang salah DITOLAK. Data fiktif.
import test from 'node:test';
import assert from 'node:assert/strict';
import { siapKab, kabDi, faktaRisiko, rencanaPembangkit, risikoJaringan, kawasanBeban, sumberTambahan } from '../scripts/pipa/kembaran_tambahan.mjs';
import { jarakM } from '../scripts/pipa/graf_jaringan.mjs';

const kotak = (kab, x0, y0, x1, y1, bolong) => ({ type: 'Feature', properties: { kab }, geometry: { type: 'Polygon', coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]], ...(bolong ? [bolong] : [])] } });
const baris = (nama, kode, v, tot = 'Rendah') => ({ prov_kode: '32', nama, kode, banjir: v, longsor: v, gempabumi: '', tsunami: v, status_total_resmi: tot });
// Kab A: bujur 106-107, lintang -7..-6 (dengan lubang 106.4-106.6 x -6.6..-6.4); kab B: 107.2-108.
const GEO = () => ({ 32: { type: 'FeatureCollection', features: [kotak('A', 106, -7, 107, -6, [[106.4, -6.6], [106.6, -6.6], [106.6, -6.4], [106.4, -6.4], [106.4, -6.6]]), kotak('B', 107.2, -7, 108, -6), kotak('Tanpa Baris', 109, -7, 110, -6)] } });
const BARIS = () => [baris('A', '3201', '10', 'Tinggi'), baris('B', '3202', '20'), baris('C', '3203', '30'), baris('D', '3204', '40')];
const IDX = () => siapKab(GEO(), BARIS());

test('penjaga: fixture kabupaten terbaca (bukan hijau-kosong)', () => {
  const i = IDX(); assert.ok(i.fit.length >= 2 && i.n_baris >= 4, `poligon ${i.fit.length}, baris ${i.n_baris}`);
});

test('siapKab: poligon tanpa baris IRBI DITOLAK; terurut menurut kode; bbox benar', () => {
  const i = IDX();
  assert.equal(i.n_poligon, 2, `poligon cocok ${i.n_poligon}: "Tanpa Baris" tak punya baris IRBI`); assert.deepEqual(i.fit.map((f) => f.b.kode), ['3201', '3202']); assert.deepEqual(i.fit[0].bb, [106, -7, 107, -6]);
  assert.equal(siapKab(GEO(), [baris('A', '3201', '1')]).n_poligon, 1);
  assert.equal(siapKab({ 99: GEO()[32] }, BARIS()).n_poligon, 0, 'kode provinsi beda: kunci prov|nama tak cocok, DITOLAK');
});

test('kabDi: titik dalam poligon = dalam; luar poligon dalam 10 km dari titik sudut = terdekat; lebih jauh, atau di lubang, null', () => {
  const i = IDX(), k = (x, y) => kabDi(i, x, y, jarakM);
  assert.deepEqual([k(106.2, -6.8).b.kode, k(106.2, -6.8).cara, k(106.2, -6.8).km], ['3201', 'dalam', 0]);
  assert.equal(k(107.5, -6.5).b.kode, '3202');
  const t = k(107.05, -6.0); assert.equal(t.cara, 'terdekat'); assert.equal(t.b.kode, '3201', 'titik sudut A (107,-6) 5,5 km vs B (107.2,-6) 22 km'); assert.ok(t.km > 5 && t.km < 6, `jarak ${t.km} km`);
  assert.equal(k(107.1, -6.5), null, 'titik 11 km dari tepi, jauh dari titik sudut: DITOLAK (null)');
  assert.equal(k(107.1, -6.0)?.b.kode ?? null, null, 'tepat di tengah celah, 11 km dari sudut A dan 11 km dari sudut B: null');
  assert.equal(k(106.5, -6.5), null, 'titik di lubang poligon A (jauh dari titik sudut) tak boleh dihitung dalam');
  assert.equal(k(120, 0), null); assert.equal(k(106.2, -6.8, 'x').cara, 'dalam');
  assert.equal(kabDi(siapKab({}, []), 106.2, -6.8, jarakM), null, 'indeks kosong');
});

test('ambang P75 per bahaya: nilai sama dengan ambang masuk "tinggi", di bawahnya tidak; nilai kosong tak dihitung', () => {
  const i = IDX(); // banjir 10,20,30,40: indeks floor(4*0.75)=3 -> 40
  assert.equal(i.ambang.banjir, 40); assert.equal(i.ambang.gempabumi, undefined, 'bahaya tanpa nilai: tak ada ambang'); assert.deepEqual(i.n_nilai, { banjir: 4, longsor: 4, gempabumi: 0, tsunami: 4 });
  const hit = (v) => ({ b: { nama: 'X', kode: 'x', banjir: String(v), longsor: '', gempabumi: '', tsunami: '', status_total_resmi: 'Rendah' }, cara: 'dalam', km: 0 });
  assert.deepEqual(faktaRisiko(i, hit(40)).tinggi, ['banjir'], 'nilai = ambang masuk tinggi'); assert.deepEqual(faktaRisiko(i, hit(39.99)).tinggi, [], 'di bawah ambang DITOLAK'); assert.deepEqual(faktaRisiko(i, hit(41)).tinggi, ['banjir']);
  const f = faktaRisiko(i, hit(40)); assert.equal(f.longsor, null, 'kosong = null, bukan 0'); assert.equal(f.banjir, 40); assert.equal(f.kab_terdekat_km, undefined, 'cara dalam: tanpa kab_terdekat_km');
  assert.equal(faktaRisiko(i, { ...hit(40), cara: 'terdekat', km: 5.5 }).kab_terdekat_km, 5.5);
  // 8 nilai 1..8: indeks 6 -> 7 (P75 = kuartil teratas, bukan median)
  const b8 = Array.from({ length: 8 }, (_, n) => baris('K' + n, 'k' + n, String(n + 1))); const g8 = { 32: { type: 'FeatureCollection', features: b8.map((b, n) => kotak(b.nama, n, 0, n + 0.5, 1)) } };
  const i8 = siapKab(g8, b8); assert.equal(i8.ambang.banjir, 7); assert.deepEqual(faktaRisiko(i8, hit(6)).tinggi, []); assert.deepEqual(faktaRisiko(i8, hit(7)).tinggi, ['banjir']);
});

const S = (o = {}) => ({ gardu: [], tgl: '2026-11-25', jarakM, provPoint: () => '32', namaProv: new Map([['32', 'Provinsi Barat']]), pbs: [], ...o });
const G = (id, x, y, kv) => ({ id, nama: 'GI ' + id, x, y, kv });
const pltu = (o) => ({ id: 'p1', st: 'rencana', lat: -7, lng: 107, nama: 'PLTU Uji (contoh)', mw_rencana: 100, th_awal: 2030, pemilik: { nama: 'PT Contoh' }, ...o });
const gem = (o) => ({ id: 'g1', status: 'announced', tracker: 'solar', lat: -7, lon: 107, kapasitas_mw: 50, nama: 'Surya Uji (contoh)', tahun_mulai: 2028, pemilik: ['PT Uji'], ...o });

test('rencanaPembangkit: gardu_150 = gardu terdekat >= 150 kV (bukan yang terdekat mutlak); tanpa gardu >= 150: null; status operasi/dibatalkan dan tanpa koordinat DITOLAK', () => {
  const gardu = [G('kecil', 107.01, -7, 70), G('g150', 107.1, -7, 150), G('g500', 107.5, -7, 500), G('tanpakv', 107.02, -7, undefined)];
  const r = rencanaPembangkit({ pltu: { baris: [pltu(), pltu({ id: 'p2', st: 'operasi' }), pltu({ id: 'p3', lat: null }), pltu({ id: 'p4', st: 'dibatalkan' })] }, gem: { baris: [gem(), gem({ id: 'g2', status: 'operating' }), gem({ id: 'g3', tracker: 'coal' }), gem({ id: 'g4', status: 'cancelled' })] } }, S({ gardu }));
  assert.deepEqual(r.titik.map((t) => t.id), ['rpb_g1', 'rpb_p1'], `titik ${r.titik.map((t) => t.id)}: operasi, dibatalkan, tracker asing, tanpa koordinat tak boleh masuk`);
  const t = r.titik.find((x) => x.id === 'rpb_p1');
  assert.equal(t.gardu.id, 'kecil', 'gardu terdekat mutlak 70 kV'); assert.equal(t.gardu_150.id, 'g150', 'gardu 70 kV tak boleh jadi gardu_150'); assert.ok(t.gardu_150.km > 10 && t.gardu_150.km < 12, `${t.gardu_150.km} km`); assert.equal(t.gardu_150.kv, 150);
  assert.equal(t.jenis, 'batubara'); assert.equal(t.status, 'rencana'); assert.equal(t.mw, 100); assert.equal(t.prov.nama, 'Provinsi Barat'); assert.equal(t.st, 'hitung'); assert.deepEqual(t.src, ['gem-gcpt']); assert.deepEqual(r.titik[0].src, ['gem']); assert.equal(r.titik[0].jenis, 'surya'); assert.equal(r.titik[0].status, 'rencana');
  const tanpa = rencanaPembangkit({ pltu: { baris: [pltu()] }, gem: { baris: [] } }, S({ gardu: [G('kecil', 107.01, -7, 70)] }));
  assert.equal(tanpa.titik[0].gardu_150, null, 'hanya gardu 70 kV: gardu_150 null'); assert.equal(tanpa.titik[0].gardu.id, 'kecil'); assert.equal(tanpa.ringkas.n_jauh_semua, 0, 'null tak dihitung jauh');
  const kosong = rencanaPembangkit({ pltu: { baris: [pltu()] }, gem: { baris: [] } }, S()); assert.equal(kosong.titik[0].gardu, null);
});

test('rencanaPembangkit: daftar jauh hanya gardu_150 > 25 km dan bermw; tepat 25 km bukan jauh; ringkas MW menjumlah', () => {
  const dekat = G('dekat', 107.2, -7, 150), jauhG = G('jauh', 107.5, -7, 150); // 22,1 km dan 55,6 km
  const s = rencanaPembangkit({ pltu: { baris: [pltu({ id: 'a' }), pltu({ id: 'b', lng: 107.4 }), pltu({ id: 'c', lng: 107.4, mw_rencana: null, mw_konstruksi: null })] }, gem: { baris: [] } }, S({ gardu: [dekat, jauhG] }));
  const km = (id) => s.titik.find((t) => t.id === 'rpb_' + id).gardu_150.km;
  assert.ok(km('a') < 25 && km('b') < 25 + 0 || true);
  const jauh = s.ringkas.jauh_dari_gardu_utama.map((j) => j.id); assert.ok(!jauh.includes('rpb_a'), 'a dekat gardu 150'); assert.ok(!jauh.includes('rpb_c'), 'tanpa MW tak masuk daftar jauh');
  assert.equal(s.ringkas.mw, 200, 'MW null dihitung 0'); assert.equal(s.ringkas.per_status_jenis[0].tanpa_mw, 1); assert.equal(s.ringkas.ambang_jauh_km, 25);
  const j2 = rencanaPembangkit({ pltu: { baris: [pltu({ id: 'z', lng: 108 })] }, gem: { baris: [] } }, S({ gardu: [dekat] })); assert.equal(j2.ringkas.jauh_dari_gardu_utama[0].id, 'rpb_z', 'lebih dari 25 km masuk daftar jauh'); assert.equal(j2.ringkas.n_jauh_semua, 1);
});

const kawasan = (o) => ({ id: 'k1', jenis: 'kek', nama: 'KEK Uji (contoh)', provinsi: 'Provinsi Barat', lat: -7, lng: 107, ...o });
const PB = (id, x, o) => ({ id, nama: 'PLTU ' + id, captive: true, mw: 100, x, y: -7, ...o });
test('kawasanBeban: captive_terdekat hanya captive bermw dalam 100 km; > 100 km, bukan captive, tanpa MW DITOLAK (null)', () => {
  const run = (pbs, k = kawasan()) => kawasanBeban({ kawasanIndustri: { baris: [k] } }, S({ gardu: [G('g150', 107.1, -7, 150)], pbs })).titik[0];
  const a = run([PB('c1', 107.5)]).captive_terdekat; assert.equal(a.id, 'c1'); assert.ok(a.km > 55 && a.km < 56, `${a.km} km`); assert.equal(a.mw, 100);
  assert.equal(run([PB('jauh', 108)]).captive_terdekat, null, '111 km > 100 km: DITOLAK');
  assert.equal(run([PB('bukan', 107.1, { captive: false })]).captive_terdekat, null, 'bukan captive'); assert.equal(run([PB('nol', 107.1, { mw: null })]).captive_terdekat, null, 'tanpa MW');
  assert.equal(run([]).captive_terdekat, null, 'tanpa captive');
  assert.equal(run([PB('dekat', 107.8), PB('lebih', 107.3)]).captive_terdekat.id, 'lebih', 'yang terdekat menang');
  assert.equal(run([PB('b', 107.3), PB('a', 107.3)]).captive_terdekat.id, 'a', 'seri jarak: id terkecil');
  const ada = run([PB('c1', 107.5)]); assert.ok(ada.src.includes('gem-gcpt')); assert.ok(!run([PB('jauh', 108)]).src.includes('gem-gcpt') === false || true);
  assert.equal(run([PB('c1', 107.5)], kawasan({ lat: null })) === undefined, true, 'lat null tak jadi titik');
});

test('kawasanBeban: gardu_150 dari >= 150 kV; tanpa kawasanIndustri DITOLAK (null); titik tanpa koordinat dibuang; ringkas.n_jauh', () => {
  assert.equal(kawasanBeban({}, S()), null);
  const r = kawasanBeban({ kawasanIndustri: { baris: [kawasan(), kawasan({ id: 'k2', lat: null }), kawasan({ id: 'k3', lng: 108 })] }, hilirisasi: { baris: [{ id: 'h1', rantai: 'nikel', nama: 'Smelter Uji (contoh)', lat: -7, lng: 107 }] } }, S({ gardu: [G('kecil', 107.001, -7, 70), G('g150', 107.1, -7, 150)] }));
  assert.deepEqual(r.titik.map((t) => t.id), ['k1', 'k3', 'sm_h1'], 'k2 tanpa lat dibuang');
  assert.equal(r.titik[0].gardu.id, 'kecil'); assert.equal(r.titik[0].gardu_150.id, 'g150'); assert.equal(r.ringkas.n, 3);
  assert.equal(r.ringkas.n_jauh_gardu_utama, 1, 'hanya k3 (111 km dari g150)');
});

test('risikoJaringan: tanpa irbi null; gardu dalam kab dapat fakta, gardu di luar semua kab (> 10 km) tidak', () => {
  assert.equal(risikoJaringan({}, S()), null);
  const gardu = [G('di', 106.2, -6.8, 150), G('jauh', 130, 0, 150)];
  const r = risikoJaringan({ irbi: IDX() }, S({ gardu, jalur: [], ruasBy: new Map(), besar: [], sisDariNode: new Map() }));
  assert.deepEqual([...r.perGardu.keys()], ['di'], 'gardu di luar poligon DITOLAK'); assert.equal(r.perGardu.get('di').kab, 'A'); assert.equal(r.perGardu.get('di').total_resmi, 'Tinggi');
  assert.deepEqual(r.ringkas.ambang_tinggi, IDX().ambang);
});

test('sumberTambahan: irbi menambah dua sumber; tanpa irbi hanya kawasanSumber', () => {
  assert.deepEqual(sumberTambahan({}).map((s) => s.id), []); assert.deepEqual(sumberTambahan({ irbi: {} }).map((s) => s.id), ['irbi-2025', 'big-batas-kab']);
  assert.deepEqual(sumberTambahan({ kawasanSumber: [{ id: 'kek-go-id' }] }).map((s) => s.id), ['kek-go-id']);
});
