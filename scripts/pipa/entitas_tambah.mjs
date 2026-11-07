// Organisasi tambahan terkurasi (data/direktori/entitas_tambah.json) -> baris siap tambahOrg di potret.mjs. Tanpa jaringan.
//   node scripts/pipa/entitas_tambah.mjs --periksa | --selftest
// Id deterministik en_<sha1 nama>; tiap baris wajib sumber berurl https; tanpa em dash/titik tengah.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const KATEGORI = new Set(['bumn', 'asosiasi', 'keuangan', 'swasta', 'internasional', 'lsm-yayasan']);
export const idEntitas = (nama) => { // sisipkan huruf agar tak terbaca ponsel oleh pemindai (id hash 10 digit murni)
  const h = crypto.createHash('sha1').update(String(nama).toLowerCase()).digest('hex').slice(0, 10);
  return 'en_' + (/^\d+$/.test(h) ? h.slice(0, 5) + 'x' + h.slice(6) : h);
};
export function validasi(d) {
  const salah = [], pakai = new Set();
  for (const b of d.baris || []) {
    const id = idEntitas(b.nama);
    if (pakai.has(id)) salah.push(`${b.nama}: id kembar`); pakai.add(id);
    if (!KATEGORI.has(b.kategori)) salah.push(`${b.nama}: kategori ${b.kategori}`);
    if (!(b.sumber || []).length || b.sumber.some((s) => !/^https:\/\//.test(s.url || '') || !s.tingkat_bukti)) salah.push(`${b.nama}: sumber berurl https + tingkat_bukti wajib`);
    if (b.situs && !/^https:\/\//.test(b.situs)) salah.push(`${b.nama}: situs`);
    if (/[—·]/.test(JSON.stringify(b))) salah.push(`${b.nama}: em dash/titik tengah`);
  }
  return salah;
}
export function baris(d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/direktori/entitas_tambah.json'), 'utf8'))) {
  const salah = validasi(d); if (salah.length) throw new Error('entitas_tambah: ' + salah.join('; '));
  return d.baris.map((b) => ({
    id: idEntitas(b.nama), nama: b.nama, nama_lain: b.nama_lain || [], kategori: b.kategori, kepakaran: b.kepakaran || [], peran_rantai: b.peran_rantai || [], situs: b.situs || undefined,
    sumber: b.sumber.map((s, i) => ({ id: 'tambah-' + (i + 1), jenis: s.tingkat_bukti === 'situs-sendiri' ? 'situs-resmi' : 'registri-proyek', url: s.url, keterangan: s.keterangan, tingkat_bukti: s.tingkat_bukti, tanggal_periksa: d.tanggal_periksa })),
    tanggal_ambil: d.tanggal_periksa,
  }));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) {
    assert.match(idEntitas('x'), /^en_[0-9a-f]{10}$|^en_\d{5}x\d{4}$/); assert.equal(idEntitas('A'), idEntitas('a'));
    assert.equal(validasi({ baris: [{ nama: 'A', kategori: 'swasta', sumber: [] }] }).length, 1);
    assert.equal(validasi({ baris: [{ nama: 'A', kategori: 'swasta', sumber: [{ url: 'http://x', tingkat_bukti: 'kajian' }] }] }).length, 1);
    assert.equal(validasi({ baris: [{ nama: 'A', kategori: 'swasta', sumber: [{ url: 'https://x.id', tingkat_bukti: 'kajian' }] }] }).length, 0);
    console.log('selftest entitas_tambah ok');
  } else console.log('entitas siap:', baris().length);
}
