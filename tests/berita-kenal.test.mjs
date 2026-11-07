import test from 'node:test';
import assert from 'node:assert/strict';
import { bangunOrang, orangDari, bangunLembaga, lembagaDari } from '../scripts/panen/berita_kenal.mjs';
import { wilayahDari, bangunKonteks, perkaya } from '../scripts/panen/berita_wilayah.mjs';

const orang = bangunOrang([
  { id: 'o1', nama: 'Bahlil Lahadalia', status: 'menjabat', jabatan_terkini: 'Menteri ESDM', organisasi_terkini: 'Kementerian ESDM' },
  { id: 'o2', nama: 'Suroso Isnandar', status: 'menjabat', jabatan_terkini: 'Direktur Utama', organisasi_terkini: 'PT PLN (Persero)' },
  { id: 'o3', nama: 'Ruly Firmansyah', status: 'menjabat', jabatan_terkini: 'Direktur Utama', organisasi_terkini: 'PT PLN Nusantara Power' },
  { id: 'o4', nama: 'Ahmad Yani', status: 'menjabat', jabatan_terkini: 'Direktur Utama', organisasi_terkini: 'PT Pertamina Geothermal Energy Tbk' },
  { id: 'o7', nama: 'Ahmad Rizal', status: 'mantan' },
  { id: 'o5', nama: 'Budi Santoso', status: 'menjabat', jabatan_terkini: 'Anggota', organisasi_terkini: 'X' },
  { id: 'o6', nama: 'Budi Santoso', status: 'menjabat', jabatan_terkini: 'Anggota', organisasi_terkini: 'Y' },
]);
test('orang: nama lengkap dan alias jabatan', () => {
  assert.deepEqual(orangDari('Bahlil Lahadalia buka rapat EBT', orang), ['o1']);
  assert.deepEqual(orangDari('Menteri ESDM soal PLTS 100 GW', orang), ['o1']);
  assert.deepEqual(orangDari('Dirut PLN: target listrik hijau', orang), ['o2']);
  assert.deepEqual(orangDari('Direktur Utama PLN Nusantara Power siap', orang), ['o3']);
  assert.deepEqual(orangDari('Bahlil ungkap harga', orang), ['o1']);
});
test('orang: negatif (ambigu, mantan, jalan, lanjutan nama lembaga)', () => {
  assert.deepEqual(orangDari('Budi Santoso hadir', orang), []);
  assert.deepEqual(orangDari('Mantan Menteri ESDM berbicara', orang), []);
  assert.deepEqual(orangDari('Tenaga Ahli Menteri ESDM: UU EBET', orang), []);
  assert.deepEqual(orangDari('Kemacetan di Jalan Ahmad Yani', orang), []);
  assert.deepEqual(orangDari('Dirut PLN IP siap ambil peran', orang), []);
  assert.deepEqual(orangDari('bahlil kecil huruf', orang), []);
});

const lem = bangunLembaga([
  { id: 'a', nama: 'PLN' }, { id: 'b', nama: 'PT PLN Indonesia Power' }, { id: 'c', nama: 'PT Pertamina Geothermal Energy Tbk', kode_saham: 'PGEO' },
  { id: 'd', nama: 'Badan Pengelola Investasi Daya Anagata Nusantara', singkatan: 'Danantara' }, { id: 'e', nama: 'PT Daya Energi Bersih Nusantara (Denera)' },
  { id: 'f', nama: 'Kementerian Energi dan Sumber Daya Mineral', singkatan: 'ESDM' }, { id: 'g', nama: 'Dinas ESDM Provinsi Bali', singkatan: 'ESDM Bali' },
  { id: 'h', nama: 'Alfa Satu', singkatan: 'ABC' }, { id: 'i', nama: 'Beta Dua', singkatan: 'ABC' },
]);
test('lembaga: singkatan, alias, kode saham, paren', () => {
  assert.deepEqual(lembagaDari('PLN siapkan PLTS', lem), ['a']);
  assert.deepEqual(lembagaDari('PLN Indonesia Power garap PLTS', lem), ['b']);
  assert.deepEqual(lembagaDari('PGE kantongi kesepakatan', lem), ['c']);
  assert.deepEqual(lembagaDari('Saham PGEO naik', lem), ['c']);
  assert.deepEqual(lembagaDari('Danantara ambil alih', lem), ['d']);
  assert.deepEqual(lembagaDari('Denera bangun PLTS', lem), ['e']);
  assert.deepEqual(lembagaDari('ESDM sebut kapasitas naik', lem), ['f']);
});
test('lembaga: negatif (singkatan ambigu, huruf kecil, bagian kata)', () => {
  assert.deepEqual(lembagaDari('ABC bicara', lem), []);
  assert.deepEqual(lembagaDari('plnx dan pln-like', lem), []);
  assert.deepEqual(lembagaDari('Esdm kecil', lem), []);
});

test('wilayah: lokasi terkenal sampai kabupaten', () => {
  assert.equal(wilayahDari('PLTA Cirata diperluas')[0].kab, 'Purwakarta');
  assert.equal(wilayahDari('Sampah Piyungan penuh')[0].kab, 'Bantul');
  assert.equal(wilayahDari('PSEL Bantargebang')[0].kab, 'Kota Bekasi');
  assert.equal(wilayahDari('Listrik di Jakarta')[0].prov, 'DKI Jakarta');
  assert.deepEqual(wilayahDari('Nutrien Q2 earnings'), []);
});
test('proyek: alias lokasi + teknologi; ambigu tidak dicocokkan', () => {
  const proyek = [
    { id: 'p1', nama: 'PLTP Mataloko (FTP2)', teknologi: 'panas-bumi', lokasi: { provinsi: 'Nusa Tenggara Timur', presisi: 'provinsi' } },
    { id: 'p2', nama: 'PLTS Bali Barat', teknologi: 'surya', lokasi: { provinsi: 'Bali', presisi: 'provinsi' } },
    { id: 'p3', nama: 'PLTS Karangkates', teknologi: 'surya', lokasi: { provinsi: 'Jawa Timur', presisi: 'provinsi' } },
    { id: 'p4', nama: 'PLTB Karangkates', teknologi: 'bayu', lokasi: { provinsi: 'Jawa Timur', presisi: 'provinsi' } },
  ];
  const ctx = bangunKonteks({ proyek, regulasi: [] });
  assert.deepEqual(perkaya('Panas bumi Mataloko dikebut', '', ctx).proyek_ids, ['p1']);
  assert.deepEqual(perkaya('PLTS Bali Barat groundbreaking', '', ctx).proyek_ids, ['p2']);
  assert.deepEqual(perkaya('Mataloko macet', '', ctx).proyek_ids, []); // tanpa kata teknologi
  assert.deepEqual(perkaya('PLTS Karangkates beroperasi', '', ctx).proyek_ids, ['p3']); // teknologi membedakan
});
