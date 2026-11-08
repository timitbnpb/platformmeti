// Menggabung semua kredit foto di repo jadi satu berkas tayang: public/data/kredit_foto.json (dipakai halaman /kredit-foto).
//   node scripts/pipa/kredit_foto.mjs          tulis berkas
//   node scripts/pipa/kredit_foto.mjs --cek    gagal (kode 1) bila berkas tayang tidak sama dengan hasil bangun ulang
// Sumber: data/foto_orang_kredit.json (tokoh), public/img/pengurus/SUMBER.md, public/img/beranda/KREDIT.md, public/data/tentang-kredit.json.
// Foto yang berkasnya tidak ada di public/ tidak ditampilkan (tidak tayang, tidak perlu kredit).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = 'public/data/kredit_foto.json';
const baca = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const ada = (u) => fs.existsSync(path.join(ROOT, 'public', u));

// Teks lisensi -> halaman lisensi resmi. Lisensi tanpa halaman baku (izin sumber) tidak ditautkan.
const CC = 'https://creativecommons.org/licenses/';
export function lisensiUrl(l) {
  const s = String(l || '');
  const m = s.match(/^CC (BY(?:-SA)?) (\d\.\d)$/);
  if (m) return `${CC}${m[1].toLowerCase()}/${m[2]}/`;
  if (/^CC0/.test(s)) return 'https://creativecommons.org/publicdomain/zero/1.0/';
  if (/PD-IDGov/.test(s)) return 'https://commons.wikimedia.org/wiki/Template:PD-IDGov';
  if (/domain publik|public domain/i.test(s)) return 'https://commons.wikimedia.org/wiki/Commons:Public_domain';
  return '';
}

// Baris tabel markdown -> sel. Menangani baris yang menempel pada pembatas header ("| --- || a | b |").
export function barisMd(teks) {
  return teks.replace(/\|\|/g, '|\n|').split('\n').filter((l) => /^\|.*\|\s*$/.test(l) && !/^\|[\s|:-]+\|?$/.test(l))
    .map((l) => l.replace(/^\||\|\s*$/g, '').split('|').map((c) => c.trim()));
}

const nama = (s) => s.replace(/\s*\(wikimedia\)\s*$/i, '');
export function dariBeranda(teks) {
  return barisMd(teks).filter((c) => c.length === 5 && /^https?:/.test(c[4]) && /\.webp$/.test(c[0]))
    .map(([berkas, subjek, penulis, lisensi, sumber]) => ({ foto: '/img/beranda/' + berkas, subjek, penulis, lisensi, sumber }));
}
export function dariPengurus(teks) {
  return barisMd(teks).filter((c) => c.length === 5 && /^https?:/.test(c[2]) && /\.webp$/.test(c[1]))
    .map(([n, berkas, sumber, penulis, lisensi]) => ({ foto: '/img/pengurus/' + berkas, subjek: nama(n), penulis, lisensi, sumber }));
}
export function dariTokoh(baris, petaFoto, ada) {
  const out = [];
  for (const b of baris) {
    let foto = b.orang_id && petaFoto[b.orang_id];
    if (!foto && b.pengurus) foto = ['-b.webp', '.webp'].map((x) => `/img/pengurus/${b.pengurus}${x}`).find(ada);
    if (!foto) continue;
    out.push({ foto, subjek: b.nama, penulis: b.penulis || '', lisensi: b.lisensi || '', sumber: b.sumber_url || '' });
  }
  return out;
}
export function dariTentang(arr) {
  return arr.map((k) => ({ foto: `/img/tentang/${k.kunci}.webp`, subjek: k.judul.replace(/\.[A-Za-z]+$/, ''), penulis: k.pencipta, lisensi: k.lisensi, lisensi_url: k.lisensi_url || '', sumber: k.sumber }));
}

// Gabung per kelompok; satu berkas foto hanya sekali; urut subjek.
export function gabung(kelompok) {
  const lihat = new Set();
  return kelompok.map(([kunci, baris]) => ({
    kunci,
    baris: baris.filter((b) => b.foto && b.subjek && !lihat.has(b.foto) && lihat.add(b.foto))
      .map((b) => ({ ...b, lisensi_url: b.lisensi_url || lisensiUrl(b.lisensi) }))
      .sort((a, b) => a.subjek.localeCompare(b.subjek, 'id')),
  })).filter((k) => k.baris.length);
}

export function bangun() {
  const peta = JSON.parse(baca('public/data/foto_orang.json'));
  const tokoh = dariTokoh(JSON.parse(baca('data/foto_orang_kredit.json')).baris, peta, ada);
  const k = gabung([
    ['teknologi', [...dariBeranda(baca('public/img/beranda/KREDIT.md')), ...dariTentang(JSON.parse(baca('public/data/tentang-kredit.json')))]],
    ['pengurus', dariPengurus(baca('public/img/pengurus/SUMBER.md'))],
    ['tokoh', tokoh],
  ]);
  for (const g of k) g.baris = g.baris.filter((b) => ada(b.foto));
  return { kelompok: k, jumlah: k.reduce((n, g) => n + g.baris.length, 0) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const isi = JSON.stringify(bangun(), null, 1) + '\n';
  if (process.argv.includes('--cek')) {
    if (!fs.existsSync(path.join(ROOT, OUT)) || baca(OUT) !== isi) { console.error(`${OUT} usang: jalankan node scripts/pipa/kredit_foto.mjs`); process.exit(1); }
  } else { fs.writeFileSync(path.join(ROOT, OUT), isi); console.log(`${OUT}: ${JSON.parse(isi).jumlah} foto`); }
}
