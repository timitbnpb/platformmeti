// Uji pabrik ekstraksi PDF: pengurai angka, adapter dengan fixture potongan teks, validasi sitasi halaman, BPP OCR, kapasitas RUED, rapor, papan RUED.
import test from 'node:test';
import assert from 'node:assert/strict';
import { angkaId, angkaEn, barisAntara, validasiDokumen, susunDokumen, tautHalaman } from '../scripts/pipa/ekstrak_pdf.mjs';
import heesi, { barisTahun, barisProvinsi, barisTanpaTahun } from '../scripts/pipa/pdf/heesi.mjs';
import { barisTabelRuptl } from '../scripts/pipa/pdf/ruptl.mjs';
import { barisBpp, selesaikan } from '../scripts/pipa/pdf/bpp.mjs';
import { kandidatDariHalaman } from '../scripts/pipa/pdf/rued.mjs';
import { bangun as bangunCapaian, statusDari } from '../scripts/pipa/rued_capaian.mjs';
import { peringkatPengembang, peringkatPendana, keterbukaan, rapor } from '../scripts/pipa/rapor_bulanan.mjs';

test('angka Indonesia dan Inggris, tanda kosong jadi null, sampah jadi NaN', () => {
  assert.equal(angkaId('1.349,72'), 1349.72); assert.equal(angkaId('6.500'), 6500); assert.equal(angkaId('-'), null); assert.equal(angkaId('300*'), 300); assert.ok(Number.isNaN(angkaId('1.994,5ł')));
  assert.equal(angkaEn('5,068.59'), 5068.59); assert.equal(angkaEn('n.a'), null); assert.ok(Number.isNaN(angkaEn('abc')));
});

test('HEESI: baris tahun dengan catatan kaki, blok kanan tanpa tahun, provinsi dan total', () => {
  const teks = '  2023   4,642.07   49,756.37   4,453.27   16,065.76   2,597.51   4,638.31   2,689.32   151.82\n  20243)  4,929.16   41,245.00   4,228.43   18,297.61   2,638.05   4,380.29   2,655.55   151.82\n Off Grid\n  2025 1 2 3 4 5 6 7 8';
  const b = barisTahun(teks, 8, { sampai: /Off Grid/ });
  assert.deepEqual(b.map((x) => x.tahun), [2023, 2024]); assert.equal(b[1].nilai[1], 41245);
  assert.deepEqual(barisTanpaTahun('  n.a   40,097   8,381   120   120   n.a   n.a   1,251,558', 8)[0].slice(1, 3), [40097, 8381]);
  const prov = barisProvinsi('    11     Aceh        10.00   23.40   4.45   -   1.46   -   -   25.10\n  Total    6,372.41  940.46  281.52  2,757.38  1,534.11  151.91  181.78  3,432.46', 8);
  assert.equal(prov[0].nama, 'Aceh'); assert.equal(prov[0].nilai[3], null); assert.equal(prov[1].kode, 'total');
});

test('RUPTL: baris tabel 5.80 per kelompok, jumlah tahun harus sama dengan kolom Jumlah', () => {
  const potong = ['PLN', 'PLTP           -      -      -    110      -       -     -      -      -       -      110', 'PLTA PS        -      -      -     1.040     -       -     -      943     -       -     1.983', 'IPP', 'PLTS   301 107 73 157 93 577 133 219 653 827 3.140', 'PLTB   1 1 1 1 1 1 1 1 1 1 99'].map((baris, i) => ({ baris, halaman: 10 + i }));
  const b = barisTabelRuptl(potong);
  assert.equal(b.length, 4); assert.equal(b[0].kelompok, 'PLN'); assert.equal(b[1].jenis, 'PLTA PS'); assert.equal(b[1].y2028, 1040); assert.equal(b[2].jumlah, 3140);
  assert.equal(b[2].perlu_tinjau, undefined); assert.equal(b[3].perlu_tinjau, true); assert.equal(b[3].halaman, 15);
});

test('BPP OCR: baris, penomoran dibuang, angka terpecah digabung, periksa silang Rp terhadap sen', () => {
  const m = barisBpp('b   SUMATERA UTARA   1.247,24   8,56\nb.2.1   Bintan   1.833,55   12,58\nMerauke   2.349   ,75   16,12\nNatuna   1.972,24   13,53\nAnambas   1.994,5ł   13,69\nSabang   9.999,00   13,53');
  assert.deepEqual(m.map((x) => x.sistem), ['SUMATERA UTARA', 'Bintan', 'Merauke', 'Natuna', 'Anambas', 'Sabang']);
  assert.equal(m[2].rp, 2349.75);
  const s = selesaikan(m);
  assert.equal(s[0].tinjau, false); assert.equal(s[5].tinjau, true); // Rp tidak cocok dengan sen
});

test('RUED: kandidat MW dengan teknologi dari baris sendiri; PLTU dan potensi dibuang', () => {
  const k = kandidatDariHalaman('paling sedikit 20 MW pada tahun 2025 dan 200 MW pada tahun 2050 Tenaga Surya\nPLTU Palu 100 MW target\nPotensi PLTS 7.000 MW target');
  assert.deepEqual(k.map((x) => x.mw), [20, 200]); // PLTU dan baris Potensi tidak masuk
  const k2 = kandidatDariHalaman('Kapasitas PLTS paling sedikit 20 MW pada tahun 2025 dan 200 MW pada tahun 2050.');
  assert.deepEqual(k2.map((x) => [x.teknologi, x.mw, x.tahun]), [['surya', 20, 2025], ['surya', 200, 2050]]);
});

test('validasi: baris wajib punya halaman sah dan sumber https; sitasi halaman', () => {
  const spek = { id: 'x', judul: 'X', penerbit: 'P', tanggal_dokumen: '2025-01-01', versi: 'v1', sumber_url: 'https://contoh.go.id/x.pdf' };
  const tabel = (baris) => [{ id: 't', judul: 'T', kolom: [{ k: 'a', label: 'A', tipe: 'angka' }], baris }];
  assert.deepEqual(validasiDokumen(susunDokumen(spek, tabel([{ a: 1, halaman: 3 }]), { halamanTotal: 5, metode: 'pdftotext-layout' })), []);
  assert.ok(validasiDokumen(susunDokumen(spek, tabel([{ a: 1 }]), { halamanTotal: 5, metode: 'm' })).length);
  assert.ok(validasiDokumen(susunDokumen(spek, tabel([{ a: 1, halaman: 9 }]), { halamanTotal: 5, metode: 'm' })).length);
  assert.ok(validasiDokumen(susunDokumen({ ...spek, sumber_url: 'http://x' }, tabel([{ a: 1, halaman: 1 }]), { halamanTotal: 5, metode: 'm' })).length);
  assert.equal(tautHalaman('https://a/b.pdf#page=1', 7), 'https://a/b.pdf#page=7');
  const ba = barisAntara(['Daftar\nTabel 1 Judul\nTabel 2 Judul', 'Tabel 1 Judul\na\nb\nc\nd\ne\nTabel 2 Judul'], /Tabel 1 Judul/, /Tabel 2 Judul/);
  assert.equal(ba.length, 5); assert.equal(ba[0].halaman, 2); // daftar isi dilewati
});

test('keluaran terbit: tiap berkas dokumen lolos validasi dan tiap baris bersitasi halaman', async () => {
  const fs = await import('node:fs');
  if (!fs.existsSync(new URL('../public/data/dokumen_data.json', import.meta.url))) return;
  const idx = JSON.parse(fs.readFileSync(new URL('../public/data/dokumen_data.json', import.meta.url)));
  assert.ok(idx.jumlah_dokumen >= 5);
  for (const d of idx.dokumen) { const doc = JSON.parse(fs.readFileSync(new URL(`../public/data/dokumen/${d.id}.json`, import.meta.url))); assert.deepEqual(validasiDokumen(doc), []); }
  const h = JSON.parse(fs.readFileSync(new URL('../public/data/dokumen/heesi-2025.json', import.meta.url)));
  const prov = h.tabel.find((t) => t.id === 'kapasitas-provinsi-2025').baris, tot = prov.find((b) => b.kode === 'total');
  const jumlah = (k) => prov.filter((b) => b.kode !== 'total').reduce((n, b) => n + (b[k] || 0), 0);
  for (const k of ['hidro', 'surya', 'biomassa', 'panas_bumi']) assert.ok(Math.abs(jumlah(k) - tot[k]) < 1, `total ${k}`); // periksa silang jumlah provinsi = total buku
});

test('papan RUED: status dari rasio, tanpa target = tanpa status, selalu Hipotesis', () => {
  assert.equal(statusDari(1.2), 'tercapai'); assert.equal(statusDari(0.8), 'di-jalur'); assert.equal(statusDari(0.5), 'tertinggal'); assert.equal(statusDari(null), null);
  const o = bangunCapaian({ baris: [
    { kode: '11', provinsi: 'A', perda: '1/2020', target: { ebt_2025_persen: 20, ebt_akhir: { tahun: 2050, persen: 40 }, jenis: 'pasal' }, realisasi: { pangsa_kapasitas_persen: 10, ebt_mw: 1, total_mw: 10 } },
    { kode: '12', provinsi: 'B', perda: '2/2020', target: null, kutipan: 'tak ada angka', realisasi: { pangsa_kapasitas_persen: 10 } }] });
  assert.equal(o.baris[0].status, 'tertinggal'); assert.equal(o.baris[0].selisih_poin, -10); assert.equal(o.baris[0].rasio_persen, 50);
  assert.equal(o.baris[1].status, null); assert.equal(o.baris[1].alasan_kosong, 'tak ada angka'); assert.ok(o.baris.every((b) => b.hipotesis === true));
});

test('rapor: peringkat pengembang tanpa label IPP, pendana satu proyek, keterbukaan, bulanan tanpa MW karangan', () => {
  const P = (id, pemilik, mw, extra = {}) => ({ id, nama: id, kapasitas: [{ nilai: mw, satuan: 'MW' }], pihak: { pemilik: pemilik ? [{ nilai: pemilik, ...(pemilik === 'IPP' ? { catatan: 'status pengembang menurut RUPTL, bukan nama perusahaan' } : {}) }] : [] }, status: [{ nilai: 'rencana' }], ...extra });
  const proyek = [P('a', 'PT Satu', 100), P('b', 'PT. Satu', 100), P('c', 'PT Dua', 50), P('d', 'IPP', 500), P('e', null, 10, { nilai_investasi: [{ nilai: 1e6, satuan: 'USD', catatan: 'sekitar' }] })];
  const pg = peringkatPengembang(proyek, 1);
  assert.equal(pg.baris[0].mw, 200); assert.equal(pg.baris[0].proyek, 2); assert.equal(pg.jumlah_pengembang, 2); assert.equal(pg.porsi_atas_persen, 80);
  const pd = peringkatPendana([{ pemberi: 'X' }, { pemberi: 'X' }, { pemberi: 'Y', nilai_usd: 5 }]);
  assert.equal(pd.satu_saja, 1); assert.equal(pd.baris[0].nama, 'X');
  const k = keterbukaan(proyek); assert.equal(k.dengan_nilai, 1); assert.equal(k.dengan_ppa, 0); assert.equal(k.baris[0].jenis, 'perkiraan');
  const D = { proyek, berita: [{ id: 'b1', judul: 'x', terbit: '2026-10-02T00:00:00Z', media: 'm', url: 'https://m/1' }], regulasi: [], tender: [], pendanaan: [] };
  const r = rapor('bulanan', '2026-10', D);
  assert.equal(r.ubin.mw_baru, null); assert.equal(r.kapasitas_baru, null); assert.equal(r.ubin.berita, 1); assert.equal(r.banding.periode_lalu, '2026-09');
  const t = rapor('tahunan', '2025', { ...D, proyek: [P('f', 'PT Satu', 40, { teknologi: 'surya', status: [{ nilai: 'beroperasi' }], cod_aktual: [{ nilai: 2025 }] })] });
  assert.equal(t.ubin.mw_baru, 40); assert.equal(t.kapasitas_baru[0].teknologi, 'surya');
});
