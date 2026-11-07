import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangunData, statusBaku, tekVerra } from '../scripts/pipa/karbon_proyek.mjs';

const r = (n) => JSON.parse(fs.readFileSync(new URL('../mentah/' + n, import.meta.url), 'utf8'));
const proyek = [{ id: 'pj_x', nama: 'Musi hydro', teknologi: 'hidro', lokasi: { provinsi: 'Bengkulu' }, kapasitas: [{ nilai: 210, satuan: 'MW' }] }];
const org = [{ id: 'su_pln', nama: 'PLN' }];
test('status dan teknologi baku', () => { assert.equal(statusBaku('Late to Verify'), 'terdaftar_terlambat_verifikasi'); assert.equal(statusBaku('Registered'), 'terdaftar'); assert.equal(statusBaku('zzz'), 'lainnya'); assert.equal(tekVerra('Wayang Windu Geothermal', 'ACM0002'), 'panas-bumi'); });
test('data nyata: hanya EBT, tiap baris bersumber, volume Musi = jumlah Units', { skip: !fs.existsSync(new URL('../mentah/vrod_id.json', import.meta.url)) && 'mentah/ tidak ada' }, () => {
  const o = bangunData(r('vrod_id.json'), r('gs_id.json'), '2026-11-08', proyek, org);
  assert.ok(o.jumlah >= 20 && o.jumlah === o.baris.length);
  assert.ok(o.baris.every((b) => b.sumber_url.startsWith('https://') && b.tanggal && b.tingkat_bukti && b.sumber_id && b.teknologi));
  assert.ok(!o.baris.some((b) => b.registri_id === 'VCS243'), 'gas alam AM0029 bukan EBT');
  const musi = o.baris.find((b) => b.id === 'vcs_487'); assert.equal(musi.proyek_id, 'pj_x'); assert.equal(musi.organisasi_id, 'su_pln');
  const unit = r('vrod_id.json')['Verra VCS Issuances'].filter((x) => x['Project ID'] === 487).reduce((a, x) => a + x.Units, 0); assert.equal(musi.kredit.diterbitkan, unit);
  assert.ok(o.baris.filter((b) => b.registri === 'Verra VCS').every((b) => b.tingkat_bukti === 'via-pihak-ketiga'));
  assert.deepEqual(bangunData(r('vrod_id.json'), r('gs_id.json'), '2026-11-08', proyek, org), o);
});
