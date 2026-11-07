// Uji panen K: bentuk keluaran, kutipan target RUED ada di teks PDF, konsistensi angka, penguraian. Jalankan: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { bacaRef } from '../scripts/pipa/_panen_umum.mjs';
import { TARGET } from '../scripts/pipa/rued.mjs';
import { parseCsv, bangun as bangunAsean, ISO } from '../scripts/pipa/asean_energi.mjs';
import { parseGaruda } from '../scripts/pipa/riset_ebt.mjs';
import { parseRekap } from '../scripts/pipa/desa_energi.mjs';
import { POLA_EBT, slugs, parseLsp } from '../scripts/pipa/prodi_pelatihan.mjs';

const AKAR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const baca = n => JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data', n), 'utf-8'));
const wajibSumber = b => { assert.ok(b.sumber_url?.startsWith('http'), 'sumber_url'); assert.match(b.tanggal_periksa, /^\d{4}-\d{2}-\d{2}$/); assert.ok(b.tingkat_bukti); };
const rapat = s => s.toLowerCase().replace(/\s+/g, '');

test('rued: tiap kutipan target ada di teks PDF (bila PDF diunduh)', t => {
  let dicek = 0;
  for (const [id, x25, , , , kutipan] of TARGET) {
    const f = path.join(AKAR, 'pdf', id + '.txt');
    if (x25 == null || !fs.existsSync(f)) continue;
    const teks = rapat(fs.readFileSync(f, 'utf-8'));
    for (const bagian of kutipan.split('…')) assert.ok(teks.includes(rapat(bagian)), `${id}: "${bagian.trim()}" tak ada di PDF`);
    dicek++;
  }
  if (!dicek) t.skip('pdf/ tidak ada');
});

test('rued.json: sumber wajib, angka masuk akal, tiap perda unik', () => {
  const j = baca('rued.json');
  assert.equal(j.baris.length, TARGET.length);
  assert.equal(new Set(j.baris.map(b => b.perda_id)).size, j.baris.length);
  for (const b of j.baris) {
    wajibSumber(b);
    if (!b.target) { assert.equal(b.selisih_2025_poin, null); continue; }
    const { ebt_2025_persen: a, ebt_akhir: z } = b.target;
    assert.ok(a > 0 && a < 100 && z.persen > 0 && z.persen < 100, b.provinsi);
    assert.ok(z.persen >= a, `${b.provinsi}: target akhir < 2025`);
  }
  assert.ok(j.baris.find(b => b.provinsi === 'Riau').target.ebt_akhir.persen === 46.64);
  assert.ok(j.meta.celah.length >= 3);
});

test('asean_energi: 10 negara dari asean.json, bauran listrik berjumlah <= ~100', () => {
  const j = baca('asean_energi.json');
  assert.deepEqual(j.baris.map(b => b.iso3), ISO);
  assert.deepEqual(j.baris.map(b => b.iso3).sort(), bacaRef('public/data/asean.json').baris.map(b => b.iso3).sort());
  j.baris.forEach(wajibSumber);
  for (const b of j.baris) { const m = b.bauran_listrik_persen; const s = ['batubara', 'gas', 'minyak', 'nuklir'].reduce((a, k) => a + (m[k]?.nilai || 0), 0) + (m.ebt_total?.nilai || 0); assert.ok(s > 80 && s < 101, `${b.iso3} ${s}`); }
  assert.equal(j.sumber.regional.target[0].ebt_pasokan_energi_primer_persen, 23);
});
test('parseCsv + bangun memilih nilai terbaru yang tidak kosong', () => {
  const csv = 'country,year,iso_code,solar_share_elec,electricity_generation\nX,2023,IDN,1.5,10\nX,2024,IDN,,\nX,2022,IDN,0.5,9';
  const [b] = bangunAsean(parseCsv(csv), { baris: [{ iso3: 'IDN', nama: 'Indonesia' }] });
  assert.deepEqual(b.bauran_listrik_persen.surya, { tahun: 2023, nilai: 1.5 });
  assert.deepEqual(b.pembangkitan_twh, { tahun: 2023, nilai: 10 });
});

test('desa_energi: jumlah status = total, 37 provinsi, nasional cocok', () => {
  const j = baca('desa_energi.json');
  assert.equal(j.baris.length, 37);
  for (const b of j.baris) { wajibSumber(b); assert.equal(b.mandiri + b.maju + b.berkembang + b.tertinggal + b.sangat_tertinggal + b.desa_tidak_keluar_status, b.total_desa_lapor, b.provinsi); }
  assert.equal(j.nasional_2024.total_desa_lapor, j.baris.reduce((a, b) => a + b.total_desa_lapor, 0));
  assert.deepEqual(j.desa_energi, []);
});
test('parseRekap: urutan kolom bebas, baris total dibuang, provinsi tak dikenal gagal keras', () => {
  const h = ['PROVINSI', 'MAJU', 'MANDIRI', 'BERKEMBANG', 'TERTINGGAL', 'SANGAT TERTINGGAL', 'TOTAL DESA 2024'];
  const [r] = parseRekap([h, ['BALI', '80', '556', '0', '0', '0', '636'], ['TOTAL', '1', '1', '1', '1', '1', '5']], 2024);
  assert.equal(r.kode, '51'); assert.equal(r.mandiri, 556); assert.equal(r.maju, 80);
  assert.throws(() => parseRekap([h, ['NEGERI X', '1', '1', '1', '1', '1', '5']], 2024), /tak dikenali/);
});

test('riset_ebt: sumber wajib, tanpa duplikat id Garuda, provinsi unik', () => {
  const j = baca('riset_ebt.json');
  assert.equal(j.artikel_jurnal.length, j.jumlah_artikel);
  assert.equal(new Set(j.artikel_jurnal.map(a => a.garuda_id)).size, j.jumlah_artikel);
  j.artikel_jurnal.forEach(wajibSumber); j.per_provinsi.forEach(wajibSumber);
  assert.equal(new Set(j.per_provinsi.map(p => p.kode)).size, j.per_provinsi.length);
  for (const p of j.per_provinsi) assert.equal(p.karya_energi_2019_sekarang_jumlah_kampus, p.kampus.reduce((a, k) => a + k.karya, 0));
});
test('parseGaruda: judul/penulis/tahun/DOI dari blok contoh', () => {
  const h = 'Found 1,034 documents <div class="article-item"> <a class="title-article" href="/documents/detail/12"><xmp>Judul &amp; Uji </xmp></a><a class="author-article" href="/author/view/1"><xmp>A B</xmp></a><xmp class="subtitle-article"> Jurnal X Vol 1 (2023): Ed </xmp><i class="subtitle-article">Publisher : </i><xmp class="subtitle-article">Univ Y </xmp><a class="title-citation" href="https://doi.org/10.1/abc">DOI</a></div>';
  const r = parseGaruda(h);
  assert.equal(r.total, 1034);
  assert.deepEqual({ ...r.artikel[0], sumber_url: 0 }, { garuda_id: '12', judul: 'Judul & Uji', penulis: ['A B'], jurnal: 'Jurnal X Vol 1 (2023): Ed', tahun: 2023, penerbit: 'Univ Y', doi: '10.1/abc', sumber_url: 0 });
});

test('prodi_pelatihan: pola EBT menolak hidrolik/hidroponik, menerima PLTS/PLTMH/Manajer Energi', () => {
  for (const x of ['MEKANIK HIDROLIK ALAT BERAT', 'Pembudidayaan Sayuran Hidroponik', 'Ahli Madya Hidrografi']) assert.ok(!POLA_EBT.test(x), x);
  for (const x of ['Pemasangan PLTS Off Grid', 'Pembangkit Listrik Tenaga Mikro Hidro', 'Manajer Energi']) assert.ok(POLA_EBT.test(x), x);
  const j = baca('prodi_pelatihan.json');
  assert.ok(j.lsp.length > 10);
  for (const l of j.lsp) { wajibSumber(l); assert.ok(l.skema_ebt.length && l.skema_ebt.every(s => POLA_EBT.test(s))); assert.ok(!/[\w.]+@[\w.]+\.\w+/.test(JSON.stringify(l)), 'surel'); }
  assert.deepEqual(j.prodi, []);
});
test('prodi_pelatihan: slugs dan parseLsp dari HTML contoh', () => {
  assert.deepEqual(slugs('<a href="https://bnsp.go.id/lsp/a-b"></a><a href="https://bnsp.go.id/lsp/a-b"></a>'), ['a-b']);
  const l = parseLsp('<title>LSP - Uji &amp; Co</title><td>No Lisensi</td><td>:</td><td>BNSP-1</td><td>Status Lisensi</td><td>:</td><td> Aktif</td><b onclick="fetchDataUnitSkema(\'Manajer Energi\', \'1\')">', 'a-b');
  assert.equal(l.nama, 'Uji & Co'); assert.equal(l.no_lisensi, 'BNSP-1'); assert.equal(l.status_lisensi, 'Aktif'); assert.deepEqual(l.skema, ['Manajer Energi']);
});
