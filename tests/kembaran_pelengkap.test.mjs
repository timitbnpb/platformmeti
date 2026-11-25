// KJ-05: uji kembaran_pelengkap.mjs (fungsi murni). Tiap uji berpasangan: yang benar diterima, yang salah DITOLAK.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sumberPelengkap, kotaTerdekat, bppSistem, ruptlProvinsi, ruptlSistem, ruptlJaringan, ruptlJaringanSistem, pendudukKapita, elektrifikasi, potensiProvinsi, ebtDekatGardu } from '../scripts/pipa/kembaran_pelengkap.mjs';
import { BIAYA, SISTEM, RUPTL, KODE_PROV, RUPTL_JARINGAN, PEL, PENJUALAN, AKSES, DESA, ATLAS, GARDU, KOTA } from './fixture/kembaran/pelengkap.mjs';

test('penjaga: fixture pelengkap terbaca (bukan hijau-kosong)', () => {
  assert.ok(BIAYA().bpp_sistem.length >= 4 && RUPTL().baris.length >= 5 && RUPTL_JARINGAN().provinsi.length >= 3, 'fixture BPP/RUPTL terlalu sedikit');
  assert.ok(KOTA().kota.length >= 4 && PEL().penduduk.length >= 5 && Object.keys(ATLAS().gardu).length >= 5, 'fixture kota/penduduk/atlas terlalu sedikit');
});

test('kotaTerdekat: kota terpadat dalam 25 km; tanpa penduduk -> terdekat; di luar radius, kosong, undefined DITOLAK (null)', () => {
  const r = kotaTerdekat(KOTA(), 107, -7);
  assert.equal(r.nama, 'Padat', `terpadat dalam 25 km, dapat ${r.nama}`); assert.equal(r.penduduk, 5000); assert.equal(r.kode_fitur, 'PPLA2');
  assert.ok(r.km > 10 && r.km < 12, `jarak 0,1 derajat bujur di -7 lintang ~11,0 km, dapat ${r.km}`);
  assert.notEqual(r.nama, 'Jauh', 'kota 9 juta jiwa di 44 km di luar radius 25 km tak boleh menang');
  assert.equal(kotaTerdekat(KOTA(), 107, -7, 60).nama, 'Jauh', 'radius 60 km menjangkau kota 44 km yang terpadat');
  // semua kandidat tanpa penduduk: yang terdekat, penduduk null
  const tanpa = { kota: [['Jauhan', -7.0, 107.1, 0, 'PPLA2'], ['Terdekat', -7.0, 107.005, 0, 'PPLA2']] };
  const t = kotaTerdekat(tanpa, 107, -7); assert.equal(t.nama, 'Terdekat'); assert.equal(t.penduduk, null);
  // yang berpenduduk menang atas yang lebih dekat tapi nol
  assert.equal(kotaTerdekat({ kota: [['Nol Dekat', -7.0, 107.005, 0, 'P'], ['Berpop Jauh', -7.0, 107.1, 1, 'P']] }, 107, -7).nama, 'Berpop Jauh');
  // seri penduduk: terdekat, lalu nama
  assert.equal(kotaTerdekat({ kota: [['B', -7.0, 107.1, 9, 'P'], ['A', -7.0, 107.05, 9, 'P']] }, 107, -7).nama, 'A');
  assert.equal(kotaTerdekat({ kota: [['Zed', -7.0, 107.05, 9, 'P'], ['Abe', -7.0, 107.05, 9, 'P']] }, 107, -7).nama, 'Abe');
  assert.equal(kotaTerdekat(KOTA(), 120, 0), null, 'tak ada kota dalam radius -> null');
  for (const g of [undefined, null, {}, { kota: [] }]) assert.equal(kotaTerdekat(g, 107, -7), null, `geonames ${JSON.stringify(g)} harus null`);
});

test('bppSistem: nama persis = sumber; cocok provinsi = hitung+ragu bila baris dipakai sistem lain; baris tanpa tahun dan sistem tak cocok DITOLAK', () => {
  const h = bppSistem(BIAYA(), SISTEM(), 2020);
  const a = h.get('a');
  assert.equal(a.st, 'sumber'); assert.equal(a.baris[0].cara_cocok, 'nama'); assert.equal(a.rp_kwh_min, 1000); assert.equal(a.rp_kwh_maks, 1000); assert.equal(a.nasional_rp_kwh, 1300); assert.equal(a.tgl, '2021-09-08'); assert.equal(a.src, 's-bpp');
  assert.deepEqual(a.per_tahun, { 2019: { min: 900, maks: 900, n: 1 }, 2020: { min: 1000, maks: 1000, n: 1 } });
  const b = h.get('b');
  assert.equal(b.st, 'hitung', 'cocok lewat provinsi bukan sumber'); assert.deepEqual(b.baris.map((x) => x.nama), ['Pulau Lain', 'Sistem Dua', 'Sistem Satu']);
  assert.ok(b.baris.every((x) => x.cara_cocok === 'provinsi')); assert.equal(b.rp_kwh_min, 1000); assert.equal(b.rp_kwh_maks, 2000);
  assert.equal(b.ragu, true, 'Sistem Satu juga dicocokkan ke sistem a'); assert.match(b.catatan, /Sistem Satu/);
  assert.equal(a.ragu, true, 'baris k1 juga dipakai sistem b: ragu walau nama persis');
  assert.equal(h.get('b').baris.find((x) => x.nama === 'Pulau Lain').cara_cocok, 'provinsi'); assert.equal(bppSistem(BIAYA(), [SISTEM()[0]], 2020).get('a').ragu, undefined, 'dipakai satu sistem saja: tidak ragu');
  assert.equal(h.has('c'), false, 'sistem tanpa baris cocok DITOLAK');
  assert.ok(![...h.values()].some((v) => v.baris.some((x) => x.nama === 'Tanpa Tahun')), 'baris tanpa tahun 2020 tak boleh ikut');
  assert.ok(bppSistem(BIAYA(), SISTEM(), 2019).get('a').rp_kwh_min === 900, 'tahun lain dipakai bila diminta');
  assert.equal(bppSistem({}, SISTEM()).size, 0); assert.equal(bppSistem(undefined, SISTEM()).size, 0);
  assert.equal(bppSistem({ bpp_sistem: [] }, SISTEM()).size, 0);
});

test('ruptlProvinsi: jumlah MW per teknologi/status/tahun COD; tanpa provinsi dan provinsi tak terpetakan DITOLAK dari kartu tetapi dilaporkan', () => {
  const { kartu, tanpaProvinsi, takTerpetakan } = ruptlProvinsi(RUPTL(), KODE_PROV());
  const k = kartu.get('32');
  assert.equal(k.proyek, 2); assert.equal(k.mw_total, 150); assert.deepEqual(k.per_teknologi, { PLTB: 50, PLTS: 100 }); assert.deepEqual(k.per_status, { rencana: 150 });
  assert.deepEqual(Object.keys(k.per_tahun_cod).sort(), ['2029', '2029/2030'], 'COD banyak tahun jadi kunci gabungan terurut'); assert.equal(k.st, 'hitung'); assert.equal(k.src, 'riset-ruptl-2025'); assert.equal(k.tgl, '2025');
  assert.equal(kartu.get('35').per_tahun_cod['tanpa-tahun'].PLTS, 20, 'cod_tahun kosong -> tanpa-tahun'); assert.equal(kartu.get('35').per_status.konstruksi, 20);
  assert.deepEqual(tanpaProvinsi, { proyek: 1, mw: 30 }); assert.deepEqual(takTerpetakan, ['Negeri Fiktif']);
  assert.equal(kartu.size, 2, 'baris tanpa provinsi dan provinsi fiktif tak boleh jadi kartu');
  assert.equal(ruptlProvinsi(undefined, KODE_PROV()).kartu.size, 0);
});

test('ruptlSistem: jumlah provinsi anggota yang punya rencana; tanpa anggota beryencana DITOLAK (null)', () => {
  const { kartu } = ruptlProvinsi(RUPTL(), KODE_PROV());
  const s = ruptlSistem(kartu, ['32', '35', '99']);
  assert.deepEqual(s.provinsi, ['32', '35'], 'provinsi tanpa rencana (99) tak ikut'); assert.equal(s.proyek, 3); assert.equal(s.mw_total, 170); assert.equal(s.per_teknologi.PLTS, 120); assert.equal(s.per_tahun_cod['tanpa-tahun'].PLTS, 20); assert.equal(s.st, 'hitung');
  assert.equal(ruptlSistem(kartu, ['99', '98']), null); assert.equal(ruptlSistem(kartu, []), null);
});

test('ruptlJaringan: kartu per provinsi, kunci total dibuang, deret 10 tahun, total dari kolom ke-11; lampiran gabungan tanpa kode DITOLAK dari kartu', () => {
  const { kartu, gabungan } = ruptlJaringan(RUPTL_JARINGAN());
  const k = kartu.get('32');
  assert.equal(k.total_kms, 140); assert.equal(k.total_mva, 60); assert.deepEqual(Object.keys(k.kms_per_kv_per_tahun), ['150', '500'], 'kunci total tak boleh jadi kV');
  assert.ok(Object.values(k.kms_per_kv_per_tahun).every((v) => v.length === 10), 'deret per kV 10 tahun (kolom total terpotong)');
  assert.equal(k.st, 'sumber'); assert.equal(k.src, 'RUPTL-2025'); assert.equal(k.tgl, '2025'); assert.equal(k.catatan, 'Tabel X.1; Tabel X.2');
  const t = kartu.get('33'); assert.equal(t.total_mva, null, 'tanpa tabel mva -> null, bukan 0'); assert.deepEqual(t.mva_per_kv_per_tahun, {}); assert.equal(t.catatan, 'Tabel Y.1');
  assert.deepEqual(gabungan, ['Papua + Papua Barat']); assert.equal(kartu.size, 2, 'lampiran gabungan tak boleh jadi kartu'); assert.ok(![...kartu.keys()].includes(null));
  assert.equal(ruptlJaringan(undefined).kartu.size, 0);
});

test('ruptlJaringanSistem: jumlah elemen per tahun dan total provinsi (bukan dihitung ulang); tanpa anggota DITOLAK (null)', () => {
  const { kartu } = ruptlJaringan(RUPTL_JARINGAN());
  const s = ruptlJaringanSistem(kartu, ['32', '33', '99']);
  assert.deepEqual(s.provinsi, ['32', '33']); assert.equal(s.total_kms, 150); assert.equal(s.total_mva, 60, 'provinsi tanpa mva menyumbang 0 (null -> 0)');
  assert.equal(s.kms_per_kv_per_tahun['150'][0], 110, 'kV yang sama dijumlah antarprovinsi per tahun'); assert.equal(s.kms_per_kv_per_tahun['500'][0], 40); assert.equal(s.kms_per_kv_per_tahun['150'].length, 10);
  assert.equal(s.st, 'hitung'); assert.equal(s.src, 'RUPTL-2025');
  assert.equal(ruptlJaringanSistem(kartu, ['99']), null); assert.equal(ruptlJaringanSistem(kartu, []), null);
  // total memakai total provinsi, bukan jumlah baris: kartu dengan total sengaja beda dari jumlah baris tetap dipakai apa adanya
  const palsu = new Map([['1', { kms_per_kv_per_tahun: { 150: [1, 0] }, mva_per_kv_per_tahun: {}, total_kms: 99, total_mva: null }]]);
  assert.equal(ruptlJaringanSistem(palsu, ['1']).total_kms, 99);
});

test('pendudukKapita: kWh per kapita = GWh*1e6/jiwa; Papua menjumlah pemekaran; pemekaran tak lengkap, tanpa penduduk, tahun beda dicatat', () => {
  const h = pendudukKapita(PEL(), PENJUALAN(), 2024);
  const a = h.get('32').kwh_per_kapita;
  assert.equal(a.kwh, 2000); assert.equal(a.jiwa, 1000000); assert.equal(a.st, 'hitung'); assert.equal(a.src, 'BPS,pop'); assert.equal(a.catatan, undefined); assert.equal(a.catatan_tahun, undefined);
  assert.equal(h.get('32').penduduk.st, 'sumber');
  assert.equal(h.get('33').kwh_per_kapita.catatan_tahun, 'penjualan 2024, penduduk 2023'); assert.equal(h.get('33').penduduk.bukti, 'via-pihak-ketiga'); assert.equal(h.get('32').penduduk.bukti, undefined);
  const p = h.get('91').kwh_per_kapita; assert.equal(p.jiwa, 2000000, 'Papua induk + 93 + 94 + 95'); assert.equal(p.kwh, 1250); assert.match(p.catatan, /93, 94, 95/);
  assert.equal(h.has('77'), false, 'penjualan tanpa penduduk tak boleh membuat entri');
  // pemekaran tak lengkap (tanpa 95): kWh per kapita DITOLAK, penduduk induk tetap ada
  const pel = PEL(); pel.penduduk = pel.penduduk.filter((x) => x.kode !== '95');
  const h2 = pendudukKapita(pel, PENJUALAN(), 2024); assert.equal(h2.get('91').kwh_per_kapita, undefined, 'penduduk pemekaran tak lengkap'); assert.ok(h2.get('91').penduduk);
  assert.equal(pendudukKapita({}, PENJUALAN(), 2024).size, 0); assert.equal(pendudukKapita({ penduduk: [] }, PENJUALAN(), 2024).size, 0); assert.equal(pendudukKapita(undefined, [], 2024).size, 0);
});

test('elektrifikasi: rasio dari akses, desa bila ada; rasio null DITOLAK; desa dari tabel lain berlabel hitung', () => {
  const h = elektrifikasi(AKSES(), DESA());
  const a = h.get('32');
  assert.equal(a.rasio_persen, 99.5); assert.equal(a.rumah_tangga_berlistrik, 1000); assert.equal(a.st, 'sumber'); assert.equal(a.src, 'gatrik-2024'); assert.equal(a.tgl, '2024');
  assert.deepEqual([a.desa.jumlah, a.desa.berlistrik_pln, a.desa.berlistrik_non_pln, a.desa.belum_berlistrik], [100, 90, 5, 5]); assert.equal(a.desa.st, 'hitung');
  assert.equal(a.desa.jumlah - a.desa.berlistrik_pln - a.desa.berlistrik_non_pln, a.desa.belum_berlistrik, 'invarian: belum = jumlah - PLN - non-PLN');
  assert.equal(h.has('33'), false, 're_persen null tak boleh jadi entri'); const c = h.get('34'); assert.equal(c.desa, undefined); assert.equal(c.rumah_tangga_berlistrik, null); assert.equal(c.tgl, '2023');
  assert.equal(elektrifikasi(undefined, undefined).size, 0); assert.equal(elektrifikasi({ provinsi: [] }, DESA()).size, 0);
});

test('potensiProvinsi dan ebtDekatGardu: hanya lapis yang ada; gardu tanpa nilai atau di luar atlas DITOLAK; urut menurun lalu id; n memotong', () => {
  const p = potensiProvinsi(ATLAS());
  assert.ok(p.get('32').pvout && !p.get('32').angin_100m, 'angin null tak boleh jadi kartu'); assert.ok(p.get('33').angin_100m && !p.get('33').pvout);
  assert.equal(p.get('32').pvout.sat, 'kWh/kWp/tahun'); assert.equal(p.get('33').angin_100m.sat, 'm/s'); assert.equal(p.get('32').pvout.src, 'gsa-pvout'); assert.equal(p.get('33').angin_100m.src, 'gwa-100m'); assert.equal(p.get('32').pvout.tgl, '2026-11-25');
  assert.match(p.get('32').catatan, /0\.05 derajat/);
  assert.equal(potensiProvinsi({}).size, 0); assert.equal(potensiProvinsi(undefined).size, 0);
  const e = ebtDekatGardu(ATLAS(), GARDU(), 3);
  assert.deepEqual(e.surya.map((x) => x.id), ['g4', 'g5', 'g2'], `surya terurut menurun, seri menurut id: ${e.surya.map((x) => x.id)}`);
  assert.deepEqual(e.angin.map((x) => x.id), ['g3', 'g4', 'g5'], 'g2 angin null dan g9 tak ada di atlas tak boleh masuk');
  assert.equal(e.surya[0].pvout, 1700); assert.equal(e.angin[0].angin_100m, 5); assert.equal(e.st, 'hitung'); assert.equal(e.src, 'gsa-pvout,gwa-100m');
  assert.equal(ebtDekatGardu(ATLAS(), GARDU(), 1).surya.length, 1);
  assert.ok(![...e.surya, ...e.angin].some((x) => x.id === 'g9'));
  assert.equal(ebtDekatGardu(undefined, GARDU()), null); assert.equal(ebtDekatGardu({ meta: {}, provinsi: {} }, GARDU()), null);
});

test('sumberPelengkap: hanya s-bpp, gatrik-2024, sumber pelengkap/atlas, GeoNames; sumber BPP lain dan tanpa masukan DITOLAK', () => {
  assert.deepEqual(sumberPelengkap({}), []);
  const s = sumberPelengkap({ biaya: { dibangun_pada: '2026-11-01', sumber: [{ id: 's-bpp', judul: 'j', penerbit: 'p', url: 'u', lisensi: 'l' }, { id: 's-lain', judul: 'x' }] }, akses: { sumber: { 'gatrik-2024': { judul: 'g', penerbit: 'e', url: 'u', tanggal_ambil: '2026-11-02' } } }, pelengkap: { sumber: [{ id: 'wilayah-json' }] }, atlas: { sumber: [{ id: 'gsa-pvout' }] }, geonames: KOTA() });
  assert.deepEqual(s.map((x) => x.id), ['s-bpp', 'gatrik-2024', 'wilayah-json', 'gsa-pvout', 'geonames-id']);
  assert.equal(s[0].tanggal_ambil, '2026-11-01'); assert.equal(s.at(-1).penerbit, 'GeoNames'); assert.equal(s.at(-1).tanggal_ambil, '2026-11-25');
});
