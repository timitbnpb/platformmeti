#!/usr/bin/env node
// public/data/produk_meti.json: Produk METI = dokumen dan keluaran kerja METI yang SUDAH PUBLIK (masukan RUU EBET, roadmap, siaran dan sikap, profil).
// Dirangkai dari data yang sudah ada: siaran_pers.json, pustaka.json, kebijakan_info.json, roadmap.json, isu.json, program_analisis.json,
// konsultasi.json dan data/konsultasi/posisi_meti_publik.json. Tidak ada isi yang dikarang: judul, tanggal, tautan dan ringkasan datang dari baris sumber.
// BATAS KERAS: posisi METI butir 23 ke atas internal. Hanya berkas posisi_meti_publik.json (butir 1-22) yang dibaca, dan butirnya tidak disalin: hanya jumlahnya.
//   node scripts/pipa/produk_meti.mjs            bangun dan tulis
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
export const MAKS_BUTIR_PUBLIK = 22;
const TGL = /^\d{4}-\d{2}(-\d{2})?$/;
const potong = (s, n = 230) => { const x = String(s || '').replace(/\s+/g, ' ').trim(); if (x.length <= n) return x; const k = x.slice(0, n), i = Math.max(k.lastIndexOf('. '), 0); return i > 80 ? k.slice(0, i + 1) : k.replace(/\s+\S*$/, '') + '...'; };
const pertama = (s) => { const x = String(s || '').replace(/\s+/g, ' ').trim(), i = x.indexOf('. '); return i > 0 ? x.slice(0, i + 1) : x; };
const dua = (id, en = id) => ({ id, en });

// tek yang disebut butir 1-22 (kata kunci wajib muncul di salah satu butir; dijaga tests/produk-meti.test.mjs)
export const TEK_MASUKAN = { hidrogen: /hidrogen/i, bioenergi: /biofuel|bioenergi|SAF/i, 'panas-bumi': /panas bumi/i, bayu: /angin/i, penyimpanan: /BESS|pumped storage/i };

export function bangun() {
  const ps = baca('data/konsultasi/posisi_meti_publik.json');
  if (ps.some((x) => x.no > MAKS_BUTIR_PUBLIK)) throw new Error('posisi METI butir 23 ke atas tidak boleh masuk data publik');
  const kons = baca('public/data/konsultasi.json').baris.find((k) => k.id === 'ruu-ebet');
  const kb = baca('public/data/kebijakan_info.json');
  const isu = baca('public/data/isu.json').baris.find((i) => i.id === 'ruu-ebet');
  const prog = new Map(baca('public/data/program_analisis.json').baris.map((p) => [p.kode, p]));
  const regs = new Map(baca('public/data/regulasi.json').baris.map((r) => [r.id, r]));
  const siar = new Map(baca('public/data/siaran_pers.json').baris.map((s) => [s.id, s]));
  const pustaka = new Map(baca('public/data/pustaka.json').baris.map((p) => [p.id, p]));
  const rm = baca('public/data/roadmap.json');
  const sumberMasukan = kb.masukan.find((m) => /22 substansi/.test(m.judul));

  const T = (j, k) => {
    if (j === 'isu') { const i = k === 'ruu-ebet' ? isu : null; return { j, k, ...dua(i.judul) }; }
    if (j === 'program') { const p = prog.get(k); return { j, k, ...dua(p.nama.id, p.nama.en || p.nama.id) }; }
    if (j === 'reg') { const r = regs.get(k); return { j, k, ...dua(r.judul) }; }
    return { j, k };
  };
  const urut = (a) => a.filter((x, i) => a.findIndex((y) => y.j === x.j && y.k === x.k) === i);
  const halamanDari = (terkait, tambah = []) => [...new Set([...tambah, ...terkait.map((t) => ({ isu: 'isu', program: 'program', reg: 'regulasi', tek: 'teknologi', bidang: 'bidang' })[t.j])])];

  const baris = [];
  const tambah = (x) => baris.push(x);

  // 1. Masukan METI untuk RUU EBET: 22 butir publik. Program/tek dari butir 1-22 dan posisi RDPU; butir tidak disalin.
  {
    const progRdpu = kb.posisi.filter((p) => /RDPU Komisi XII|Aspirasi METI/.test(p.sumber)).map((p) => p.program);
    const terkait = urut([
      T('isu', 'ruu-ebet'), ...isu.regulasi_ids.map((r) => T('reg', r)), ...[...progRdpu, ...(ps.some((b) => /PLTS 100 GW/i.test(b.posisi)) ? ['plts-100gw'] : [])].filter((k) => prog.has(k)).map((k) => T('program', k)),
      ...Object.keys(TEK_MASUKAN).filter((k) => ps.some((b) => TEK_MASUKAN[k].test(b.topik + ' ' + b.posisi))).map((k) => T('tek', k)), T('bidang', 'advokasi'),
    ]);
    tambah({
      id: 'masukan-ruu-ebet', jenis: 'masukan', tanggal: kons.posisi_meti.tanggal,
      judul: dua('Masukan METI untuk RUU EBET: 22 butir dalam 5 pilar', 'METI input on the EBET Bill: 22 points in 5 pillars'),
      ringkas: dua(kons.posisi_ringkas, '22 core points in 5 pillars were presented by METI at the audience/public hearing (RDPU) with Commission XII of the DPR RI.'),
      butir: ps.length, pembuat: 'METI', sumber: { url: sumberMasukan.url, label: 'Antara' }, buka: '/regulasi#konsultasi',
      terkait, halaman: halamanDari(terkait, ['beranda']),
    });
  }

  // 2. Ajuan roadmap METI (halaman /roadmap)
  {
    const terkait = urut([T('isu', 'ruu-ebet'), T('bidang', 'advokasi')]);
    tambah({
      id: 'roadmap-meti', jenis: 'roadmap', tanggal: rm.versi, status: String(rm.status).toLowerCase(),
      judul: dua('Ajuan roadmap METI, K4 2026 sampai K4 2028', 'Proposed METI roadmap, Q4 2026 to Q4 2028'),
      ringkas: dua(`${rm.PROGRAM.filter((p) => p.kelas === 'Pasti').length} program pasti dan ${rm.PROGRAM.filter((p) => p.kelas === 'Bersyarat').length} program bersyarat, lengkap dengan linimasa, anggaran, dan tata kelola.`,
        `${rm.PROGRAM.filter((p) => p.kelas === 'Pasti').length} firm and ${rm.PROGRAM.filter((p) => p.kelas === 'Bersyarat').length} conditional programs, with timeline, budget, and governance.`),
      pembuat: 'METI', sumber: { url: '/roadmap', label: 'Roadmap' }, terkait, halaman: halamanDari(terkait, ['beranda']),
    });
  }

  // 3. Siaran pers METI (satu-satunya jenis siaran_pers di situs METI); program dan teknologi dari isi ringkasannya
  for (const s of [...siar.values()].filter((x) => x.jenis === 'siaran_pers')) {
    const teks = `${s.judul} ${s.ringkasan}`;
    const ps2 = [[/B50/, 'b50'], [/E20/, 'e20'], [/PLTS 100 GW/i, 'plts-100gw'], [/sampah menjadi energi/i, 'wte']].filter(([re]) => re.test(teks)).map(([, k]) => k);
    const terkait = urut([...ps2.map((k) => T('program', k)), ...(s.topik || []).map((k) => T('tek', k)), T('bidang', 'komunikasi')]);
    tambah({
      id: s.id.slice(0, 40), jenis: 'siaran', tanggal: s.tanggal, judul: dua(s.judul), ringkas: dua(potong(s.ringkasan)),
      pembuat: 'METI', sumber: { url: s.url_sumber, label: 'metiires.or.id' }, buka: '/siaran-pers/' + s.id, terkait, halaman: halamanDari(terkait, ['beranda']),
    });
  }

  // 4. Sikap METI yang dimuat media (judul dan tautan dari liputan; METI sebagai pihak yang bersikap)
  for (const [id, tags] of [['e91205b66a', [T('isu', 'ruu-ebet'), T('bidang', 'advokasi')]], ['d6ee13f24a', [T('bidang', 'advokasi')]]]) {
    const s = siar.get(id), terkait = urut(tags);
    tambah({
      id: 'sikap-' + id, jenis: 'sikap', tanggal: s.tanggal, judul: dua(s.judul), ringkas: dua(pertama(s.ringkasan)),
      pembuat: 'METI', sumber: { url: s.url_sumber, label: s.media }, terkait, halaman: halamanDari(terkait, id === 'e91205b66a' ? ['regulasi'] : []),
    });
  }

  // 5. Company profile METI (pustaka publik, bukan rahasia)
  {
    const p = pustaka.get('pk-company-profile-meti-2026-2028');
    if (p && p.lapis === 'publik' && !p.rahasia) {
      const terkait = urut(p.program.filter((k) => prog.has(k)).map((k) => T('program', k)));
      tambah({
        id: 'profil-meti-2026-2028', jenis: 'profil', tanggal: p.tanggal, judul: dua(p.judul), ringkas: dua(pertama(p.ringkasan)),
        pembuat: 'METI', sumber: { url: '/pustaka?id=' + encodeURIComponent(p.id), label: 'Pustaka' }, terkait, halaman: halamanDari(terkait, ['beranda']),
      });
    }
  }

  baris.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.id.localeCompare(b.id));
  return {
    lapis: 'publik', dibangun_pada: '2026-11-09', jumlah: baris.length, baris,
    catatan: 'Hanya dokumen dan pernyataan METI yang sudah publik, tiap butir dengan tanggal dan tautan sumber. Dokumen internal METI tidak dimuat; posisi METI hanya butir 1-22 (RDPU Komisi XII, 8 Sep 2026) dan hanya jumlahnya.',
    celah: ['Hanya dokumen yang sudah punya tautan publik yang dimuat; dokumen tanpa tautan publik tidak ditayangkan.', 'Tahap RUU EBET menurut arsip METI dan berita, belum dicek ke situs DPR (robots.txt melarang).'],
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const d = bangun();
  fs.writeFileSync(path.join(ROOT, 'public/data/produk_meti.json'), JSON.stringify(d) + '\n');
  console.log('produk_meti.json', d.jumlah, 'butir:', d.baris.map((b) => b.id).join(', '));
}
