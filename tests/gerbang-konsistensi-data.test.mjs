// Gerbang konsistensi lintas data. Gagal hanya untuk tautan id mati dan selisih
// hitungan ringkas; sisanya peringatan di public/data/konsistensi.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import { muat, periksa } from '../scripts/pipa/konsistensi.mjs';

test('data nyata: tidak ada tautan id mati', () => {
  const h = periksa(muat());
  assert.ok(h.hitung.proyek > 100, 'penjaga hijau-kosong: proyek terbaca');
  assert.ok(h.hitung.organisasi > 100 && h.hitung.orang > 100, 'penjaga: organisasi/orang terbaca');
  const ringkas = h.gagal.tautan_mati.map((x) => `${x.sumber} x${x.jumlah} mis. ${x.contoh[0]}`);
  assert.deepEqual(ringkas, [], 'tautan id mati per sumber');
});

test('data nyata: hitungan ringkas.json sama dengan panjang berkas', () => {
  assert.deepEqual(periksa(muat()).gagal.selisih_ringkas, []);
});

test('fixture jahat: pemeriksa MERAH untuk id mati, berkas hilang, dan selisih hitungan', () => {
  const b = (baris) => ({ baris });
  const d = {
    proyek: b([{ id: 'p1', nama: 'A', teknologi: 'surya', lokasi: { provinsi: 'Atlantis' }, kapasitas: [{ nilai: 5, satuan: 'MW' }], regulasi_ids: ['hantu'], pihak: { pemilik: [{ organisasi_id: 'o-hantu' }] } },
      { id: 'p2', nama: 'a', teknologi: 'surya', lokasi: { provinsi: 'Atlantis' }, kapasitas: [{ nilai: 5, satuan: 'MW' }] }]),
    organisasi: b([{ id: 'o1', nama: 'X', logo: '/img/logo/org/tak-ada.png', proyek_ids: ['p-hantu'] }]),
    orang: b([]), regulasi: b([]), program: b([]), berita: b([]), karbon: b([]), karbon_proyek: b([]),
    pendanaan: { pendanaan: [{ id: 'd1', iso2: 'ZZ' }], negara: [] }, inovasi: { inovasi: [] },
    wilayah: b([{ kode: '99', nama: 'Utara' }]), video: b([]), keuangan: b([]),
    ringkas: { hitung: { proyek: 3, organisasi: 1 }, kartu: [] }, topik: {},
  };
  const h = periksa(d, () => false);
  const s = new Set(h.gagal.tautan_mati.map((x) => x.sumber));
  for (const w of ['proyek', 'organisasi', 'pendanaan', 'wilayah']) assert.ok(s.has(w), `sumber ${w} harus merah`);
  assert.equal(h.gagal.selisih_ringkas.find((x) => x.kunci === 'proyek').selisih, 1);
  assert.equal(h.peringatan.duplikat.length, 1, 'duplikat nama+teknologi+MW+provinsi');
});
