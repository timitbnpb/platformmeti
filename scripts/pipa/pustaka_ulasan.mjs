#!/usr/bin/env node
// Pustaka: bangun public/data/pustaka_ulasan.json dari data/pustaka/ulasan.json (tulisan tangan) + berkas lokal.
//   - dokumen tambahan + overlay overview/insight/tautan/berkas per dokumen
//   - sampul = halaman pertama PDF (pdftoppm + cwebp, lebar 600) -> public/img/pustaka/<id>.webp
//   - salinan berkas untuk R2 -> data-panen/pustaka/berkas/ (diabaikan git) + data-panen/pustaka/unggah_r2.json (daftar untuk unggah_pustaka.mjs)
// Tidak mengunggah apa pun. Berkas sumber: env PANEN_BARU (bawaan ~/Developer/panen-baru) dan METI_LOKAL (bawaan ~/Documents/1. METI).
//   node scripts/pipa/pustaka_ulasan.mjs [--paksa]     |     node scripts/pipa/pustaka_ulasan.mjs --selftest
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUB = path.join(ROOT, 'public');
const DP = path.join(ROOT, 'data-panen/pustaka');
const PANEN_BARU = process.env.PANEN_BARU || path.join(os.homedir(), 'Developer/panen-baru');
const METI_LOKAL = process.env.METI_LOKAL || path.join(os.homedir(), 'Documents/1. METI');
const TEKNOLOGI = new Set(['surya', 'bayu', 'hidro', 'panas-bumi', 'bioenergi', 'biomassa-sampah', 'sampah', 'penyimpanan', 'hidrogen', 'nuklir']);
const TERLARANG = /rahasia|confidential|jangan terbit|tidak untuk dipublikasi/i;
const baca = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const ada = (f) => fs.existsSync(f);

export function selesaikanLokal(s) {
  if (s.startsWith('panen-baru:')) return path.join(PANEN_BARU, s.slice(11));
  if (s.startsWith('meti-lokal:')) return path.join(METI_LOKAL, s.slice(11));
  throw new Error('awalan lokal tidak dikenal: ' + s);
}

// Periksa satu entri ulasan: tautan ke data nyata, tanpa kata terlarang, tanpa em dash, tiap angka/temuan bernomor halaman.
export function periksaUlasan(id, u, ref) {
  const galat = [];
  const teks = JSON.stringify(u);
  if (TERLARANG.test(teks)) galat.push(`${id}: memuat kata terlarang (rahasia/confidential)`);
  if (/[–—]/.test(teks)) galat.push(`${id}: memuat em dash atau en dash`);
  for (const k of ['angka', 'temuan']) for (const x of u[k] || []) if (!x.hlm) galat.push(`${id}: ${k} tanpa nomor halaman`);
  for (const t of u.tautan || []) {
    if (t.jenis === 'regulasi' && !ref.regulasi.has(t.id)) galat.push(`${id}: regulasi ${t.id} tidak ada`);
    else if (t.jenis === 'proyek' && !ref.proyek.has(t.id)) galat.push(`${id}: proyek ${t.id} tidak ada`);
    else if (t.jenis === 'organisasi' && !ref.organisasi.has(t.id)) galat.push(`${id}: organisasi ${t.id} tidak ada`);
    else if (t.jenis === 'provinsi' && !ref.provinsi.has(t.id)) galat.push(`${id}: provinsi ${t.id} tidak ada`);
    else if (t.jenis === 'teknologi' && !TEKNOLOGI.has(t.id)) galat.push(`${id}: teknologi ${t.id} tidak dikenal`);
    else if (!['regulasi', 'proyek', 'organisasi', 'provinsi', 'teknologi'].includes(t.jenis)) galat.push(`${id}: jenis tautan ${t.jenis}`);
  }
  return galat;
}

const HREF = { regulasi: (id) => `/regulasi?id=${encodeURIComponent(id)}`, proyek: (id) => `/p/${id}`, organisasi: (id) => `/o/${id}`, provinsi: (id) => `/wilayah/${id}`, teknologi: (id) => `/teknologi/${id}` };
export function lengkapiTautan(tautan, ref) {
  return (tautan || []).map((t) => ({ jenis: t.jenis, id: t.id, href: HREF[t.jenis](t.id), label: t.label || ref.nama[`${t.jenis}:${t.id}`] || t.id }));
}

const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function halamanPdf(f) {
  try { return Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [f], { encoding: 'utf8' }))?.[1]) || null; } catch { return null; }
}
function sampul(pdf, keluar, paksa) {
  if (ada(keluar) && !paksa) return true;
  const tmp = path.join(os.tmpdir(), 'pu-' + process.pid + '-' + path.basename(keluar, '.webp'));
  try {
    execFileSync('pdftoppm', ['-f', '1', '-l', '1', '-scale-to-x', '600', '-scale-to-y', '-1', '-png', '-singlefile', pdf, tmp]);
    execFileSync('cwebp', ['-quiet', '-q', '72', '-m', '6', tmp + '.png', '-o', keluar]);
    fs.rmSync(tmp + '.png', { force: true });
    return true;
  } catch (e) { console.warn('sampul gagal', path.basename(pdf), e.message.split('\n')[0]); return false; }
}

function jalankan(paksa) {
  const dasar = baca(path.join(PUB, 'data/pustaka.json')).baris;
  const sumber = baca(path.join(ROOT, 'data/pustaka/ulasan.json'));
  const ref = { regulasi: new Set(), proyek: new Set(), organisasi: new Set(), provinsi: new Set(), nama: {} };
  for (const r of baca(path.join(PUB, 'data/regulasi.json')).baris) { ref.regulasi.add(r.id); ref.nama['regulasi:' + r.id] = `${String(r.jenis).replace(/^./, (c) => c.toUpperCase())} ${r.nomor}/${r.tahun}`; }
  for (const p of baca(path.join(PUB, 'data/proyek.json')).baris) { ref.proyek.add(p.id); ref.nama['proyek:' + p.id] = p.nama; }
  for (const o of baca(path.join(PUB, 'data/organisasi.json')).baris) { ref.organisasi.add(o.id); ref.nama['organisasi:' + o.id] = o.nama; }
  for (const f of fs.readdirSync(path.join(PUB, 'data/wilayah'))) ref.provinsi.add(f.replace(/\.json$/, ''));

  // Berkas lokal dokumen lapis publik yang sudah dibaca (berkas.jsonl); hanya baris tanpa tanda rahasia.
  const lokalDasar = {};
  const bj = path.join(DP, 'berkas.jsonl');
  if (ada(bj)) for (const l of fs.readFileSync(bj, 'utf8').split('\n').filter(Boolean)) {
    const d = JSON.parse(l);
    if (d.lapis === 'publik' && !d.rahasia && d.berkas_asal?.tag === 'meti-lokal' && !d.berkas_asal.rel.includes('!/')) lokalDasar[d.id] = 'meti-lokal:' + d.berkas_asal.rel;
  }

  const idDasar = new Set(dasar.map((d) => d.id));
  const semua = [...sumber.dokumen.map((d) => ({ ...d, baru: true })), ...dasar.filter((d) => lokalDasar[d.id] || sumber.ulasan[d.id]).map((d) => ({ ...d, lokal: lokalDasar[d.id] }))];
  const galat = [];
  for (const d of sumber.dokumen) if (idDasar.has(d.id)) galat.push(`dokumen baru ${d.id} sudah ada di pustaka.json`);
  for (const id of Object.keys(sumber.ulasan)) if (!idDasar.has(id) && !sumber.dokumen.some((d) => d.id === id)) galat.push(`ulasan untuk id tak dikenal: ${id}`);

  fs.mkdirSync(path.join(DP, 'berkas'), { recursive: true });
  fs.mkdirSync(path.join(PUB, 'img/pustaka'), { recursive: true });
  const unggah = [], ulasan = {}, dokumenBaru = [];
  for (const d of semua) {
    const u = { ...(sumber.ulasan[d.id] || {}) };
    galat.push(...periksaUlasan(d.id, u, ref));
    if (u.tautan) u.tautan = lengkapiTautan(u.tautan, ref);
    const berkas = [];
    const pasang = (bid, nama, lokal, formatBawaan) => {
      const f = lokal && selesaikanLokal(lokal);
      if (!f || !ada(f)) { if (lokal) console.warn('berkas lokal tidak ada, dilewati:', d.id, bid); return; }
      const ext = path.extname(f).slice(1).toLowerCase() || formatBawaan;
      const kunci = `pustaka/${d.id}${bid === 'utama' ? '' : '--' + bid}.${ext}`;
      const salin = path.join(DP, 'berkas', path.basename(kunci));
      if (!ada(salin) || paksa) fs.copyFileSync(f, salin);
      const b = { id: bid, nama: nama ?? null, format: ext, ukuran: fs.statSync(f).size, halaman: ext === 'pdf' ? halamanPdf(f) : null, r2: true };
      berkas.push(b);
      unggah.push({ kunci, berkas: path.relative(ROOT, salin), ukuran: b.ukuran, sha256: sha(f), tipe: ext });
      if (bid === 'utama' && ext === 'pdf' && sampul(f, path.join(PUB, 'img/pustaka', d.id + '.webp'), paksa)) u.sampul = `/img/pustaka/${d.id}.webp`;
    };
    pasang('utama', u.berkas_nama, d.lokal, d.format);
    for (const l of d.lampiran || []) pasang(l.id, l.nama, l.lokal, 'pdf');
    if (berkas.length) u.berkas = berkas;
    delete u.berkas_nama;
    if (Object.keys(u).length) ulasan[d.id] = u;
    if (d.baru) {
      const { lokal, lampiran, baru, ...bersih } = d;
      const b0 = berkas.find((b) => b.id === 'utama');
      bersih.ukuran = b0?.ukuran ?? null;
      if (b0?.halaman) bersih.halaman = b0.halaman;
      dokumenBaru.push(bersih);
    }
  }
  if (galat.length) { console.error('GAGAL:\n' + galat.join('\n')); process.exit(1); }
  const keluar = { lapis: 'publik', dibangun_pada: process.env.TANGGAL || new Date().toISOString().slice(0, 10), dokumen: dokumenBaru, ulasan };
  fs.writeFileSync(path.join(PUB, 'data/pustaka_ulasan.json'), JSON.stringify(keluar));
  fs.writeFileSync(path.join(DP, 'unggah_r2.json'), JSON.stringify(unggah, null, 1));
  console.log(`dokumen baru ${dokumenBaru.length}, ulasan ${Object.keys(ulasan).length}, berkas untuk R2 ${unggah.length}, sampul ${Object.values(ulasan).filter((x) => x.sampul).length}`);
}

export function selftest() {
  const ref = { regulasi: new Set(['a']), proyek: new Set(), organisasi: new Set(), provinsi: new Set(['32']), nama: {} };
  assert.deepEqual(periksaUlasan('x', { angka: [{ nilai: '1', hlm: 'hlm 1' }], tautan: [{ jenis: 'regulasi', id: 'a' }, { jenis: 'provinsi', id: '32' }] }, ref), []);
  assert.equal(periksaUlasan('x', { temuan: [{ teks: 'ini rahasia', hlm: 'hlm 1' }] }, ref).length, 1);
  assert.equal(periksaUlasan('x', { temuan: [{ teks: 'a — b' }] }, ref).length, 2);
  assert.equal(periksaUlasan('x', { tautan: [{ jenis: 'regulasi', id: 'zzz' }] }, ref).length, 1);
  assert.equal(lengkapiTautan([{ jenis: 'provinsi', id: '32', label: 'Jawa Barat' }], ref)[0].href, '/wilayah/32');
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) { if (process.argv.includes('--selftest')) selftest(); else jalankan(process.argv.includes('--paksa')); }
