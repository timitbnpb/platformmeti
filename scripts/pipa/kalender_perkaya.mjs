#!/usr/bin/env node
// Gabung data/kalender_perkaya.json ke public/data/kalender.json (deskripsi, lokasi, poster, video, kandidat acara baru).
//   node scripts/pipa/kalender_perkaya.mjs            gabung ke public/data/kalender.json
//   node scripts/pipa/kalender_perkaya.mjs --selftest
// Aturan: baris tanpa sumber sah ditolak; kontak pribadi TIDAK PERNAH masuk lapis publik; poster hanya bila hak tercatat milik METI
// (foto Antara dibuang, tinggal tautan berita). Tiap acara memperoleh `slug` stabil (id /event/<slug> dan kunci pendaftaran).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BUKTI = new Set(['kata-pihak', 'cuplikan', 'dokumen-resmi', 'primer']);
const sumberSah = (s) => Array.isArray(s) && s.length > 0 && s.every((x) => x && x.url && x.tanggal_periksa && BUKTI.has(x.tingkat_bukti));
// ponytail: langit-langit bukti (media maks cuplikan; situs-* maks kata-pihak) dicek di sini; samakan dengan taksonomi.js bila daftarnya berubah.
const langit = (s) => s.every((x) => !(x.label === 'media' && x.tingkat_bukti !== 'cuplikan') && !(/^situs-/.test(x.label) && !['kata-pihak', 'cuplikan'].includes(x.tingkat_bukti)));
const KUNCI = ['deskripsi', 'lokasi', 'penyelenggara', 'mitra', 'organisasi_ids', 'keterbukaan', 'daftar_url', 'instagram', 'youtube', 'situs', 'tema', 'video_ids', 'berita', 'kapasitas', 'tanggal_catatan', 'jam', 'seri', 'sumber'];
export const bisaTayang = (g) => !!(g && g.file && /\bMETI\b/.test(g.hak || '') && !/antara/i.test(`${g.hak} ${g.url_gambar || ''}`));
export const slugDari = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
const EVENT = (b) => !['regulasi', 'tenggat'].includes(b.jenis);

export function gabung(kalender, perkaya) {
  const baris = kalender.baris.map((b) => ({ ...b }));
  let tolak = 0, tanpaCocok = 0, cocokN = 0;
  const terpakai = new Set();
  const tempel = (b, p) => {
    for (const k of KUNCI) if (p[k] !== undefined && p[k] !== null) b[k] = p[k];
    if (p.slug) b.slug = p.slug;
    if (bisaTayang(p.gambar)) b.poster = { file: '/' + p.gambar.file.replace(/^\//, ''), hak: p.gambar.hak, url_sumber: p.gambar.url_sumber };
  };
  for (const p of perkaya.perkaya || []) {
    if (!sumberSah(p.sumber) || !langit(p.sumber)) { tolak++; continue; }
    const b = baris.find((x) => x.tanggal === p.cocok.tanggal && x.judul.startsWith(p.cocok.judul_awal));
    if (!b) { tanpaCocok++; continue; }
    tempel(b, p); cocokN++;
  }
  for (const k of perkaya.kandidat || []) {
    if (!k.tanggal || !sumberSah(k.sumber) || !langit(k.sumber)) { tolak++; continue; }
    const b = { id: k.kandidat_id, tanggal: k.tanggal, judul: k.judul, mitra: (k.penyelenggara || []).join(', '), jenis: k.jenis, sumber: { label: k.sumber[0].label, url: k.sumber[0].url, tanggal: k.sumber[0].tanggal_periksa }, kandidat: k.tanda };
    tempel(b, k);
    baris.push(b);
  }
  baris.sort((x, y) => x.tanggal.localeCompare(y.tanggal) || x.judul.localeCompare(y.judul));
  for (const b of baris) {
    if (!EVENT(b)) continue;
    if (!b.slug) { let s = slugDari(b.judul) || b.id; if (!/\d{4}/.test(s)) s += '-' + b.tanggal.slice(0, 4); b.slug = s; }
    let s = b.slug, n = 2;
    while (terpakai.has(s)) s = `${b.slug}-${n++}`;
    b.slug = s; terpakai.add(s);
  }
  return { ...kalender, jumlah: baris.length, baris, perkaya_ringkas: { cocok: cocokN, tanpa_cocok: tanpaCocok, ditolak: tolak } };
}

export function selftest() {
  const kal = { baris: [{ tanggal: '2026-09-02', judul: 'IndoEBTKE ConEx ke-12', id: 'ac_1', jenis: 'konferensi' }, { tanggal: '2026-10-01', judul: 'Lain', id: 'ac_2', jenis: 'seminar' }, { tanggal: '2026-10-02', judul: 'PERMEN 1/2026', id: 'ac_3', jenis: 'regulasi' }] };
  const sumber = [{ url: 'https://a', label: 'media', tanggal_periksa: '2026-11-08', tingkat_bukti: 'cuplikan' }];
  const ok = { cocok: { tanggal: '2026-09-02', judul_awal: 'IndoEBTKE' }, deskripsi: 'x', slug: 'conex', kontak: { nama: 'A' }, gambar: { file: 'img/a.webp', hak: 'Foto ANTARA', url_gambar: 'https://img.antaranews.com/x.jpg' }, sumber };
  const buruk = { cocok: { tanggal: '2026-10-01', judul_awal: 'Lain' }, deskripsi: 'y', sumber: [{ url: 'https://a', label: 'media', tanggal_periksa: '2026-11-08' }] };
  const meti = { kandidat_id: 'kd_g', slug: 'golf', tanda: 'kandidat-mendatang', judul: 'Golf', jenis: 'seminar', tanggal: '2026-11-22', kontak: { nama: 'Pribadi' }, gambar: { file: 'img/g.webp', hak: 'Banner acara METI; hak METI' }, penyelenggara: ['METI'], sumber: [{ url: 'https://m', label: 'situs-meti', tanggal_periksa: '2026-11-08', tingkat_bukti: 'kata-pihak' }] };
  const h = gabung(kal, { perkaya: [ok, buruk], kandidat: [meti, { kandidat_id: 'kd_x', judul: 'Tanpa tanggal', tanggal: null }] });
  assert.equal(h.baris.find((b) => b.id === 'ac_1').deskripsi, 'x');
  assert.equal(h.baris.find((b) => b.id === 'ac_1').poster, undefined, 'foto Antara tidak tayang');
  assert.equal(h.baris.find((b) => b.id === 'ac_2').deskripsi, undefined);
  assert.equal(h.perkaya_ringkas.ditolak, 2);
  assert.ok(!JSON.stringify(h).includes('Pribadi') && !JSON.stringify(h).includes('kontak'), 'tanpa kontak pribadi');
  assert.equal(h.baris.find((b) => b.id === 'kd_g').poster.file, '/img/g.webp');
  assert.equal(h.baris.find((b) => b.id === 'ac_3').slug, undefined, 'regulasi bukan acara');
  assert.equal(slugDari('Sarasehan Nasional: Dewan'), 'sarasehan-nasional-dewan');
  assert.equal(kal.baris[0].deskripsi, undefined, 'masukan tidak dimutasi');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  selftest();
  if (process.argv.includes('--selftest')) console.log('selftest ok'); else {
    const kal = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/kalender.json'), 'utf8'));
    const per = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kalender_perkaya.json'), 'utf8'));
    const hasil = gabung(kal, per);
    fs.writeFileSync(path.join(ROOT, 'public/data/kalender.json'), JSON.stringify(hasil));
    console.log(JSON.stringify(hasil.perkaya_ringkas));
  }
}
