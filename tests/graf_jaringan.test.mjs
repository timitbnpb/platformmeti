// KJ-04: uji graf kembaran pada dunia kecil buatan (fixture/kembaran/dunia.mjs). Invarian, bukan potret data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { komponen, jembatan, diBelakang, tempelSimpul, bauran, neraca, alirkan, bangun, gerbang, FAKTOR } from '../scripts/pipa/graf_jaringan.mjs';
import { elemen, ctx, GI, CELAH_SUMATERA } from './fixture/kembaran/dunia.mjs';

const TGL = '2026-11-24';
const dunia = (c = ctx(), el = elemen()) => bangun(el, c, TGL, CELAH_SUMATERA);
const rs = (o, osm) => o.objek.rs.find((r) => r.id === 'rs_' + osm); // rs.osm dipangkas; id = rs_<id way OSM>
// sambungan terbitan skema asli (data/kembaran/terbitan.json meta.skema): ujung dicocokkan menurut nama gardu + provinsi
const SAMBUNGAN = { id: 'kabel-uji', nama: 'Kabel uji', jenis_saluran: 'kabel-tanah', tegangan_kv: 150, sirkit: 2, status: 'beroperasi', beroperasi_sejak: null, panjang_km: 80,
  ujung_a: { nama: 'Golf', provinsi: 'Provinsi Timur (contoh)', gardu: 'GI Golf', lat: null, lon: null }, ujung_b: { nama: 'Charlie', provinsi: 'Provinsi Barat (contoh)', gardu: 'GI Charlie', lat: null, lon: null }, src: 'uji', st: 'sumber' };

test('penjaga: dunia uji terbentuk (bukan hijau-kosong)', () => {
  const o = dunia();
  assert.ok(o.objek.rs.length >= 8, `ruas ${o.objek.rs.length}, minimal 8`);
  assert.ok(o.objek.gi.length === 7, `gardu ${o.objek.gi.length}, harapan 7`);
  assert.ok(o.objek.sis.some((s) => s.nama === 'Jawa-Bali'), 'sistem Jawa-Bali tak terbentuk dari fixture');
});

test('komponen: dua kelompok terpisah, akar = id terkecil', () => {
  const k = komponen([0, 1, 2, 3, 4], [[0, 1], [1, 2], [3, 4]]);
  assert.equal(k.get(2), 0); assert.equal(k.get(4), 3); assert.notEqual(k.get(0), k.get(3));
});

test('jembatan: cincin tanpa jembatan; rantai = semua jembatan; sisi paralel bukan jembatan', () => {
  assert.equal(jembatan(3, [[0, 1], [1, 2], [2, 0]]).size, 0, 'cincin 3 simpul tak boleh punya jembatan');
  const rantai = jembatan(4, [[0, 1], [1, 2], [2, 3]]);
  assert.deepEqual([...rantai].sort(), [0, 1, 2], 'rantai 4 simpul: 3 sisi, semuanya jembatan');
  assert.equal(jembatan(2, [[0, 1], [0, 1]]).size, 0, 'dua sisi paralel (jalur kedua) bukan jembatan');
  assert.deepEqual([...jembatan(3, [[0, 1], [0, 1], [1, 2]])], [2], 'hanya sisi tunggal 1-2 yang jembatan');
});

test('diBelakang: hitung gardu dan MW di sisi tanpa akar, mva null bila tak tercatat', () => {
  const sisi = [[0, 1], [1, 2], [2, 3]], jm = jembatan(4, sisi);
  const bobot = [{ gi: 1, mva: null, mw: 500 }, { gi: 1, mva: null, mw: 0 }, { gi: 1, mva: 40, mw: 30 }, { gi: 1, mva: null, mw: 20 }];
  const b = diBelakang(4, sisi, 0, jm, bobot);
  // sisi jembatan yang LEBIH KECIL (gardu; seri: MW lebih kecil), bukan sisi tanpa akar
  assert.deepEqual(b.get(0), { gi: 1, mva: null, mw: 500, sisi: 'kecil' }, 'sisi akar (1 gardu) lebih kecil dari 3 gardu lawan');
  assert.deepEqual(b.get(1), { gi: 2, mva: 40, mw: 50, sisi: 'kecil' }, 'seri 2 lawan 2 gardu: MW lebih kecil menang');
  assert.deepEqual(b.get(2), { gi: 1, mva: null, mw: 20, sisi: 'kecil' });
  for (const [i, v] of b) assert.ok(v.gi <= 2, `sisi besar (gi ${v.gi}) terpilih untuk jembatan ${i}`);
});

test('tempelSimpul: ujung 300 m menempel ke gardu, 600 m tidak; gabung < 150 m, bukan 200 m', () => {
  const gardu = [{ id: 'gi_x', x: 100, y: 0 }];
  const dLat = (m) => m / 110574;
  const ruas = [
    { id: 'r1', c: [[100, dLat(300)], [100.5, 0.5]] },
    { id: 'r2', c: [[100, dLat(600)], [100.5, -0.5]] },
    { id: 'r3', c: [[101, 1], [101.3, 1.3]] }, { id: 'r4', c: [[101, 1 + dLat(100)], [101.3, 1.6]] },
    { id: 'r5', c: [[102, 2], [102.3, 2.3]] }, { id: 'r6', c: [[102, 2 + dLat(200)], [102.3, 2.6]] },
  ];
  const { ends } = tempelSimpul(ruas, gardu);
  assert.equal(ends.get('r1')[0], 'gi_x', 'ujung 300 m harus menempel');
  assert.notEqual(ends.get('r2')[0], 'gi_x', 'ujung 600 m tak boleh menempel');
  assert.equal(ends.get('r3')[0], ends.get('r4')[0], 'ujung 100 m harus digabung');
  assert.notEqual(ends.get('r5')[0], ends.get('r6')[0], 'ujung 200 m tak boleh digabung');
});

test('bangun: jalur tunggal = rantai B-D-E-F; dua sirkit tetap tunggal; dua way paralel F-G bukan', () => {
  const o = dunia();
  for (const id of [204, 205, 206]) assert.equal(rs(o, id).tunggal, true, `way ${id} harus jalur tunggal`);
  assert.equal(rs(o, 205).sirkit, 2); // dua sirkit dalam satu way bukan jalur kedua (kontrak)
  for (const id of [201, 202, 203, 207, 208]) assert.equal(rs(o, id).tunggal, false, `way ${id} tak boleh tunggal`);
});

test('bangun: "di belakangnya" = sisi jembatan yang lebih kecil, dengan sisi:"kecil"', () => {
  const o = dunia();
  assert.deepEqual(rs(o, 204).belakang, { gi: 3, mva: null, mw: 1000, sisi: 'kecil' }, 'B-D: cincin A,B,C (3) lebih kecil dari D..G (4)');
  assert.deepEqual(rs(o, 205).belakang, { gi: 3, mva: 100, mw: 150, sisi: 'kecil' }, 'D-E: E,F,G (3) lebih kecil dari A..D (4)');
  assert.deepEqual(rs(o, 206).belakang, { gi: 2, mva: 100, mw: 50, sisi: 'kecil' }, 'E-F: F,G (2) lebih kecil dari A..E (5)');
  for (const id of [204, 205, 206]) assert.equal(rs(o, id).fakta.find((f) => f.k === 'sisi_belakang')?.v, 'kecil', `way ${id}: fakta sisi_belakang harus 'kecil'`);
  for (const id of [204, 205, 206]) assert.ok(rs(o, id).belakang.gi <= 3, `way ${id}: sisi besar (7 gardu total) tak boleh terpilih`);
});

test('bangun: sistem, potongan kecil, tempel pembangkit', () => {
  const o = dunia();
  assert.equal(o.objek.sis.length, 1, 'potongan < 50 km tak didaftar sebagai sistem');
  assert.equal(o.ringkas.angka.find((a) => a.k === 'potongan_kecil').v, 1);
  assert.equal(o.objek.sis[0].mw_pln, 1150);
  assert.equal(o.objek.gi.find((g) => g.id === GI.E).pb.length, 1);
});

test('sambungan terbitan menghapus jembatan palsu; ujung tak cocok masuk ragu[]', () => {
  const c = ctx();
  c.terbitan = { sambungan_diketahui: [SAMBUNGAN] };
  const o = dunia(c);
  assert.equal(o.objek.rs.filter((r) => r.tunggal).length, 0, 'semua jembatan harus hilang sesudah sambungan beroperasi');
  assert.equal(o.objek.rs.filter((r) => r.asal === 'terbitan').length, 1);
  const rencana = ctx(); rencana.terbitan = { sambungan_diketahui: [{ ...SAMBUNGAN, status: 'direncanakan' }] };
  const r = dunia(rencana);
  assert.equal(r.objek.rs.filter((x) => x.asal === 'terbitan').length, 0, 'status direncanakan TIDAK boleh masuk graf');
  assert.equal(r.objek.rs.filter((x) => x.tunggal).length, 3, 'jembatan harus tetap ada bila sambungan baru rencana');
  const c2 = ctx(); c2.terbitan = { sambungan_diketahui: [{ ...SAMBUNGAN, id: 'jauh', ujung_a: { nama: 'Tidak Ada', provinsi: 'Pulau Antah', gardu: null, lat: null, lon: null } }] };
  const d = dunia(c2);
  assert.equal(d.ringkas.meta.ragu.length, 1, 'ujung tak cocok ke gardu harus masuk ragu[], bukan ditebak');
  assert.equal(d.objek.rs.filter((x) => x.asal === 'terbitan').length, 0, 'ujung tak cocok tak boleh ditambahkan ke graf');
});

test('bauran: persen, intensitas berbobot, tanpa data = tidak dihitung', () => {
  const b = bauran({ PLTU: 100, PLTS: 100, total: 200 });
  const fj = Object.fromEntries(FAKTOR.map((f) => [f.jenis, f]));
  assert.equal(b.total, 200); assert.equal(b.persen.batubara, 50); assert.equal(b.rendah_karbon_persen, 50);
  assert.equal(b.langsung, Math.round(fj.batubara.langsung / 2));
  assert.ok(b.daur_hidup >= b.langsung, 'daur hidup tak boleh di bawah langsung');
  assert.equal(bauran({}).tidak_dihitung, true);
  assert.equal(bauran({ PLTX: 50 }).tidak_dihitung, true, 'jenis tak dikenal tak boleh dihitung');
});

test('neraca: kebutuhan = penjualan/(1-susut); status menurut ambang 5%', () => {
  const n = neraca(1000, 920, 8);
  assert.equal(n.kebutuhan_gwh, 1000); assert.equal(n.neraca_gwh, 0); assert.equal(n.status, 'hampir-seimbang');
  assert.equal(neraca(2000, 920, 8).status, 'surplus'); assert.equal(neraca(500, 920, 8).status, 'defisit');
});

test('alirkan: konservasi (jumlah neraca per sistem = 0, aliran bersih = sisa neraca)', () => {
  const nodes = [{ id: 'a', neraca_gwh: 300, kebutuhan_gwh: 100 }, { id: 'b', neraca_gwh: -100, kebutuhan_gwh: 200 }, { id: 'c', neraca_gwh: -50, kebutuhan_gwh: 100 }, { id: 'x', neraca_gwh: 40, kebutuhan_gwh: 50 }, { id: 'y', neraca_gwh: -40, kebutuhan_gwh: 50 }];
  const batas = [{ a: 'a', b: 'b', bobot: 2 }, { a: 'b', b: 'c', bobot: 1 }, { a: 'a', b: 'c', bobot: 1 }, { a: 'x', b: 'y', bobot: 1 }];
  const f = alirkan(nodes, batas);
  const keluar = (id) => f.reduce((t, e, i) => t + (batas[i].a === id ? e.gwh : 0) - (batas[i].b === id ? e.gwh : 0), 0);
  for (const [id, p] of [['a', 300 - (150 * 100) / 400], ['b', -100 - (150 * 200) / 400], ['c', -50 - (150 * 100) / 400], ['x', 40], ['y', -40]]) {
    assert.ok(Math.abs(keluar(id) - p) < 0.3, `simpul ${id}: aliran bersih keluar ${keluar(id)} != ${p}`);
  }
  assert.ok(Math.abs(keluar('a') + keluar('b') + keluar('c')) < 0.3, 'jumlah aliran bersih satu sistem harus 0');
});

test('bangun: batas_terbit dihormati; tanpa batas, aliran lebih besar', () => {
  const bebas = dunia().energi.batas[0];
  assert.ok(bebas.mw > 100 && !bebas.dibatasi, `aliran tanpa batas ${bebas.mw} MW harus > 100`);
  const BT = { id: 'bt-uji', sambungan_id: 'kabel-uji', nama: 'Kabel uji', batas_mw: 50, tegangan_kv: 150, jenis_batas: 'kapasitas-transfer', status: 'berlaku', tahun: 2025, src: 'uji', st: 'sumber' };
  const pakai = (bt) => { const c = ctx(); c.terbitan = { sambungan_diketahui: [SAMBUNGAN], batas_terbit: bt }; return dunia(c).energi.batas[0]; };
  const dasar = pakai([]);
  assert.ok(!dasar.dibatasi && dasar.mw > 100, `dasar dengan sambungan ${dasar.mw} MW harus > 100 dan tak dibatasi`);
  const b = pakai([BT]);
  assert.equal(b.dibatasi, true); assert.equal(b.mw, 50); assert.equal(b.mw_dihitung, dasar.mw);
  assert.equal(pakai([{ ...BT, jenis_batas: 'kapasitas-pasokan' }]).dibatasi, undefined, 'kapasitas-pasokan TIDAK membatasi aliran');
  assert.equal(pakai([{ ...BT, status: 'rencana' }]).mw, dasar.mw, 'batas berstatus rencana TIDAK membatasi aliran');
  assert.equal(pakai([{ ...BT, sambungan_id: 'tak-ada' }]).mw, dasar.mw, 'batas tanpa sambungan yang terpasang tak membatasi');
});

test('bangun: neraca provinsi dan bauran sistem memenuhi invarian', () => {
  const e = dunia().energi;
  for (const n of e.neraca) assert.ok(Math.abs(n.neraca_gwh - (n.produksi_gwh - n.kebutuhan_gwh)) < 0.2, `neraca ${n.kode} tak sama produksi - kebutuhan`);
  const s = e.bauran.sistem[0];
  assert.ok(Math.abs(Object.values(s.persen).reduce((t, v) => t + v, 0) - 100) < 0.3, 'persen bauran sistem harus berjumlah 100');
});

test('determinisme: dua kali bangun, dan urutan masukan dibalik, byte sama', () => {
  const a = JSON.stringify(dunia()), b = JSON.stringify(dunia());
  assert.equal(a, b, 'dua jalan dari masukan sama berbeda');
  assert.equal(JSON.stringify(dunia(ctx(), elemen().reverse())), a, 'urutan masukan memengaruhi keluaran');
});

test('gerbang: lolos pada dunia sehat; DITOLAK bila Jawa-Bali tak terbentuk dan bila MW melebihi kapasitas', () => {
  const c = ctx(), o = dunia(c);
  assert.deepEqual(gerbang(o, c, CELAH_SUMATERA), []);
  const geser = elemen().map((e) => ({ ...e, ...(e.lon != null ? { lon: e.lon + 20 } : {}), ...(e.geometry ? { geometry: e.geometry.map((g) => ({ ...g, lon: g.lon + 20 })) } : {}) }));
  const g = gerbang(dunia(c, geser), c, CELAH_SUMATERA);
  assert.ok(g.some((x) => /Jawa-Bali tidak terbentuk/.test(x)), `galat ${JSON.stringify(g)}`);
  const c2 = ctx(); c2.statistik.baris.forEach((b) => { b.kapasitas_terpasang_mw.total = 1; });
  assert.ok(gerbang(o, c2, CELAH_SUMATERA).some((x) => /kapasitas terpasang/.test(x)), 'MW PLN > kapasitas harus ditolak');
  assert.ok(gerbang(o, c, []).some((x) => /Sumatera tidak terbentuk/.test(x)), 'tanpa celah, Sumatera hilang harus ditolak');
});

// ---------- perilaku bauran dan aliran baru
const bauranSis = (o) => o.energi.bauran.sistem[0];

test('bauran sistem: faktor kapasitas > 1 atau MW 0 = tidak_dihitung beralasan; yang sehat dihitung', () => {
  const sehat = bauranSis(dunia());
  assert.ok(!sehat.tidak_dihitung && sehat.faktor_kapasitas > 0 && sehat.faktor_kapasitas <= 1, `fixture sehat: fk ${sehat.faktor_kapasitas}`);
  const c = ctx(); c.statistik.baris.forEach((b) => { b.kapasitas_terpasang_mw.total = 1; });
  const fk = bauranSis(dunia(c));
  assert.equal(fk.tidak_dihitung, true, 'produksi 10500 GWh pada kapasitas 2 MW (fk > 1) harus ditolak');
  assert.match(fk.alasan, /Faktor kapasitas/);
  const c0 = ctx(); c0.pltu.baris = []; c0.gem.baris = [];
  const nol = bauranSis(dunia(c0));
  assert.equal(nol.tidak_dihitung, true, 'sistem tanpa MW PLN tak boleh dihitung');
  assert.ok(nol.alasan && !('gwh' in nol && Object.keys(nol.gwh).length), `alasan ${nol.alasan}, gwh ${JSON.stringify(nol.gwh)}`);
});

test('bauran sistem: provinsi ditetapkan ke sistem > 50% MW, jatuh ke mayoritas gardu, selain itu tak teralokasi dan tercatat di meta', () => {
  const sehat = bauranSis(dunia());
  assert.match(sehat.dasar_penetapan['32'], /^mw 100%/); assert.match(sehat.dasar_penetapan['33'], /^mw 100%/);
  const c = ctx(); c.gem.baris = []; // provinsi 33 kehilangan MW: dasar jatuh ke gardu
  const g = bauranSis(dunia(c));
  assert.match(g.dasar_penetapan['33'], /^gardu 100%/, `dasar 33 ${g.dasar_penetapan['33']}`);
  assert.match(g.dasar_penetapan['32'], /^mw/);
  const t = ctx(); t.statistik.baris.push({ kode: '34', provinsi: 'Provinsi Tanpa Jaringan (contoh)', wilayah_pln: ['w1'], produksi_pln_gwh: { total: 777, PLTU: 777 }, kapasitas_terpasang_mw: { total: 5000 } });
  const o = dunia(t), s = bauranSis(o);
  assert.ok(!s.provinsi.includes('34'), 'provinsi tanpa mayoritas MW/gardu tak boleh dialokasikan ke sistem');
  assert.equal(s.total, sehat.total, 'GWh provinsi tak teralokasi tak boleh masuk bauran sistem');
  assert.deepEqual(o.energi.meta.provinsi_tak_teralokasi.map((p) => [p.kode, p.gwh]), [['34', 777]], 'GWh tak teralokasi harus tercatat di meta');
  assert.deepEqual(dunia().energi.meta.provinsi_tak_teralokasi, [], 'dunia sehat: semua provinsi teralokasi');
});

test('daur hidup: >= langsung bila ada; null bila teknologi tak ada di AR5 atau cakupan < 80%', () => {
  for (const f of FAKTOR) if (f.daur_hidup != null) assert.ok(f.daur_hidup >= f.langsung, `${f.teknologi}: daur hidup ${f.daur_hidup} < langsung ${f.langsung}`);
  assert.ok(FAKTOR.some((f) => f.daur_hidup == null), 'harus ada teknologi tanpa nilai AR5 (PLTG)');
  const u = bauran({ PLTU: 100 });
  assert.ok(u.daur_hidup >= u.langsung, `PLTU: daur hidup ${u.daur_hidup} < langsung ${u.langsung}`);
  assert.equal(bauran({ PLTG: 100 }).daur_hidup, null, 'teknologi tanpa AR5 tak boleh diisi tebakan');
  assert.equal(bauran({ PLTU: 50, PLTG: 50 }).daur_hidup, null, 'cakupan AR5 50% < 80%: daur hidup tak boleh dihitung dari sebagian');
  assert.ok(bauran({ PLTU: 90, PLTG: 10 }).daur_hidup != null, 'cakupan 90% >= 80% boleh dihitung');
});

test('aliran melebihi kiriman puncak terbitan: ditandai melebihi_puncak, TIDAK dipotong', () => {
  const dasar = dunia().energi.batas[0];
  const K = (nilai, jenis = 'aliran-terukur-beban-puncak') => ({ id: 'k-uji', dari: 'Provinsi Barat (contoh)', ke: 'Provinsi Timur (contoh)', nilai_mw: nilai, jenis, tanggal: '2025-01-01', sebanding_dengan_aliran_tahunan: 'ya', src: 'uji', st: 'sumber' });
  const jalan = (k) => { const c = ctx(); c.terbitan = { kiriman_terbit: [k] }; return dunia(c).energi; };
  const e = jalan(K(100));
  assert.equal(e.batas[0].melebihi_puncak, true, `aliran ${dasar.mw} MW > puncak 100 harus ditandai`);
  assert.equal(e.batas[0].mw, dasar.mw, 'aliran melebihi puncak TIDAK boleh dipotong');
  assert.equal(e.batas[0].puncak_mw, 100);
  assert.equal(e.meta.peringatan.length, 1, 'harus ada satu peringatan di meta');
  assert.equal(e.kiriman_terbit[0].melebihi_puncak, true);
  const longgar = jalan(K(5000));
  assert.equal(longgar.batas[0].melebihi_puncak, undefined, 'puncak di atas aliran: tak boleh ditandai');
  assert.deepEqual(longgar.meta.peringatan, []);
  assert.equal(jalan(K(100, 'komposisi-pasokan')).batas[0].melebihi_puncak, undefined, 'bukan kiriman puncak: bukan pembanding');
});
