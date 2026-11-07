import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kontakKantor, kuat, namaAesi, bangun } from '../scripts/pipa/penyedia_teknologi.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/penyedia_teknologi.json'), 'utf-8'));
const BUKTI = ['resmi', 'situs-sendiri', 'kata-pihak', 'media', 'sedang', 'cuplikan', 'via-pihak-ketiga'];

test('tiap baris punya sumber_url, tanggal_periksa, tingkat_bukti (KP D5)', () => {
  assert.equal(d.jumlah, d.baris.length);
  for (const b of d.baris) {
    assert.ok(b.sumber.length && b.sumber.every((s) => /^https?:\/\//.test(s.url)), b.id);
    assert.match(b.tanggal_periksa, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(BUKTI.includes(b.tingkat_bukti), b.id);
    assert.ok(b.kategori_layanan.length, b.id);
  }
});
test('id unik, nama tidak ganda, kandidat tanpa organisasi_id', () => {
  const ids = d.baris.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(d.baris.filter((b) => b.kandidat_baru).every((b) => b.organisasi_id === null));
  assert.ok(d.baris.filter((b) => !b.kandidat_baru).every((b) => b.organisasi_id));
});
test('kontak hanya surel kantor, tanpa pola nama pribadi', () => {
  assert.deepEqual(kontakKantor({ surel: ['budi.santoso@x.co.id', 'info@x.co.id'] }), { surel: ['info@x.co.id'] });
  assert.equal(kontakKantor({ surel: ['budi@x.co.id'] }), null);
  for (const b of d.baris) for (const e of b.kontak_kantor?.surel || []) assert.match(e.split('@')[0], /^(info|sales|contact|cs|hello|halo|admin|marketing|corporate|corcom|media|ir|support|office|sekretariat|humas|customer|enquiry|inquiry|hrd|recruitment|procurement|cso|csr)/i);
});
test('kuat memilih bukti terkuat, media di antara kata-pihak dan sedang', () => {
  assert.equal(kuat('media', 'resmi'), 'resmi');
  assert.equal(kuat('cuplikan', 'media'), 'media');
});

test('namaAesi membuang awalan merek dan sisa pengkodean', () => {
  assert.equal(namaAesi('Becis Pt Symbior Cahaya Indonesia'), 'PT Symbior Cahaya Indonesia');
  assert.equal(namaAesi('Pt Syntek Otomasi Indonesia 3'), 'PT Syntek Otomasi Indonesia');
  assert.equal(namaAesi('Hokuriku Electrical Construction Co Ltd %E5%8C%97'), 'Hokuriku Electrical Construction Co Ltd');
});
test('bangun: anggota AESI cocok nama jadi terhubung, sisanya kandidat; kebutuhan hanya dari teks', () => {
  const org = { baris: [{ id: 'p_1', nama: 'PT Contoh Surya', kategori: { kode: 'swasta' }, kepakaran: ['surya'], deskripsi: 'Pemasang PLTS atap rumah tangga, ISO 9001', sumber: [{ url: 'https://x.id', tingkat_bukti: 'situs-sendiri', tanggal: '2026-11-07' }] }] };
  const aesi = { url: 'https://aesi.or.id/anggota', tingkat_bukti: 'kata-pihak', diambil: '2026-11-08', baris: [{ nama: 'Pt Contoh Surya', kategori_aesi: 'EPC' }, { nama: 'Pt Baru Energi', kategori_aesi: 'BESS' }, { nama: 'Pak Praktisi', kategori_aesi: 'Praktisi' }] };
  const b = bangun(org, { baris: [] }, { pabrikan: [], pembanding: [], fasilitas_lain: [] }, '2026-11-08', aesi, { baris: [] });
  assert.equal(b.length, 2);
  const t = b.find((x) => x.organisasi_id === 'p_1');
  assert.deepEqual(t.kategori_layanan, ['EPC']);
  assert.deepEqual(t.kebutuhan_dilayani, ['PLTS atap', 'rumah tangga']);
  assert.deepEqual(t.iso_sni_disebut, ['ISO 9001']);
  assert.ok(t.keanggotaan.includes('AESI'));
  const k = b.find((x) => x.kandidat_baru);
  assert.deepEqual([k.nama, k.teknologi], ['PT Baru Energi', ['baterai/penyimpanan']]);
});
test('tiap baris punya bidang direktori baru', () => {
  for (const x of d.baris) for (const f of ['keanggotaan', 'kebutuhan_dilayani', 'layanan_terdeteksi', 'jangkauan_layanan', 'iso_sni_disebut', 'proyek_rujukan']) assert.ok(Array.isArray(x[f]), x.id + ' ' + f);
});
