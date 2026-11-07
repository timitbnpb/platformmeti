import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangunData, teknologi, mwDari } from '../scripts/pipa/amdal.mjs';

const a = (id, judul, extra = {}) => ({ id, cs_name: extra.pem ?? 'PT Surya Nusantara Energi', pic_name: 'X', project_result: 'UKL-UPL', project_scale: extra.skala ?? '10.00 MW', start_date: '2026-10-01 00:00:00', end_date: '2026-10-15 00:00:00', expired: true, project: { project_title: judul, description: '<p>pembangkit listrik</p>', location_desc: extra.lok ?? '<p>Desa A, Kab. B, Bengkulu</p>', project_year: 2026, project_type: 'Baru', authority: 'Pusat', required_doc: 'UKL-UPL' } });
test('teknologi: butuh kata pembangkit EBT dan konteks listrik', () => {
  assert.equal(teknologi('Pembangunan PLTS Atap 5 MW', ''), 'surya'); assert.equal(teknologi('PLTA Poso', ''), 'hidro'); assert.equal(teknologi('Pembuatan buket', 'penjualan bunga'), null); assert.equal(teknologi('Kolam air', 'perikanan'), null); assert.equal(teknologi('Penambangan batubara dan PLTU', 'dengan PLTS'), null);
});
test('skala kW dikonversi, judul sebagai cadangan', () => { assert.equal(mwDari('500 kW', ''), 0.5); assert.equal(mwDari(null, '1,5 MW PLTMH'), 1.5); assert.equal(mwDari('10 liter/detik', 'x'), null); });
test('bangun: dedup id, perseorangan disamarkan, tautan proyek, tanpa EBT dibuang', () => {
  const m = { total: 100, baris: [a(1, 'PLTMH Musi 2 MW', { lok: '<p>Bengkulu</p>' }), a(1, 'PLTMH Musi 2 MW'), a(2, 'PLTS Atap', { pem: 'BUDI SANTOSO' }), a(3, 'Pabrik tahu', {})] };
  const o = bangunData(m, '2026-11-08', [{ id: 'pj_1', nama: 'Musi hydro', teknologi: 'hidro', lokasi: { provinsi: 'Bengkulu' }, kapasitas: [] }]);
  assert.equal(o.jumlah, 2); const b2 = o.baris.find((b) => b.id === 'amdal_2'); assert.equal(b2.pemrakarsa, null); assert.equal(b2.pemrakarsa_dirahasiakan, true);
  assert.ok(o.baris.every((b) => b.sumber_url.startsWith('https://') && b.tingkat_bukti && b.tanggal));
  assert.equal(o.meta.total_pengumuman_disisir, 100);
});
test('data nyata (bila sudah diambil)', { skip: !fs.existsSync(new URL('../mentah/amdal_mentah.json', import.meta.url)) }, () => {
  const o = bangunData(JSON.parse(fs.readFileSync(new URL('../mentah/amdal_mentah.json', import.meta.url), 'utf8')), '2026-11-08', []);
  assert.ok(o.jumlah > 0); assert.ok(o.baris.every((b) => b.teknologi && b.sumber_url));
});
