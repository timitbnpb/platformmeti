// Pustaka kecil bersama enam naskah topik (jaringan, efisiensi, nuklir, energi-laut, transisi-berkeadilan, pembiayaan-hijau).
// Bentuk keluaran mengikuti docs/perencanaan/TOPIK-SKEMA.md; polanya sama dengan topik_surya.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const akar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const TGL = '2026-11-08';
export const baca = (p) => JSON.parse(fs.readFileSync(path.join(akar, p), 'utf8'));
export const T = (id, en) => ({ id, en });
export const HIP = 'Analisis METI (Hipotesis): ';
export const HIPE = 'METI analysis (Hypothesis): ';
export const H = (id, en) => T(HIP + id, HIPE + en);
export const hp = (a, b) => [HIP + a, HIPE + b];
export const S = (judul, penerbit, url, tanggal, tahun, bukti, lisensi) => ({ judul, penerbit, url, tanggal, tahun, bukti, ...(lisensi ? { lisensi } : {}) });
export const ED = { judul: 'Ringkasan editorial METI (penjelasan umum dan definisi; bukan kutipan pasal)', penerbit: 'METI', tanggal: TGL, tahun: 2026, bukti: 'editorial' };
export const PUBLIK = (judul, id) => S(judul, 'Pemerintah RI (BPK JDIH)', 'https://peraturan.bpk.go.id/Details/' + id, '2026-11-07', null, 'resmi');

/* pembangun bab; argumen s = daftar kunci sumber */
export const teks = (s, par, catatan) => ({ tipe: 'teks', sumber: s, paragraf: par.map(([a, b]) => T(a, b)), ...(catatan ? { catatan: T(...catatan) } : {}) });
export const faq = (s, butir) => ({ tipe: 'faq', sumber: s, butir: butir.map(([a, b, c, d]) => ({ t: T(a, b), j: T(c, d) })) });
export const glos = (s, butir) => ({ tipe: 'glosarium', sumber: s, butir: butir.map(([a, b, c, d]) => ({ istilah: T(a, b), arti: T(c, d) })) });
export const rumus = (s, r, c) => ({ tipe: 'rumus', sumber: s, rumus: r.map(([a, b]) => T(a, b)), contoh: c.map(([a, b]) => T(a, b)) });
export const langkah = (s, butir) => ({ tipe: 'langkah', sumber: s, butir: butir.map(([a, b, c, d, e, f]) => ({ judul: T(a, b), isi: T(c, d), pelaku: T(e, f) })) });
export const tabel = (s, per, kolom, baris, catatan) => ({ tipe: 'tabel', per, sumber: s, kolom, baris, ...(catatan ? { catatan: T(...catatan) } : {}) });
export const grafik = (s, jenis, label, satuan, d, seri, catatan) => ({ tipe: 'grafik', jenis, sumber: s, label: T(...label), satuan, d, seri: seri.map(([n, sorot, titik]) => ({ nama: T(...n), ...(sorot ? { sorot: true } : {}), titik })), ...(catatan ? { catatan: T(...catatan) } : {}) });
export const linimasa = (s, butir) => ({ tipe: 'linimasa', sumber: s, butir: butir.map(([tgl, a, b, url]) => ({ tanggal: tgl, judul: T(a, b), ...(url ? { url } : {}) })) });
export const kol = (k, a, b, extra = {}) => ({ k, l: T(a, b), ...extra });
export const L = (k, a, b) => ({ k, l: T(a, b) });
export const kunci = (a, b, nilai, d, su, su2, sumber, est = false) => ({ label: T(a, b), nilai, d, satuan: T(su, su2), sumber, est });

/* kartu kasus; f = { id, nama, jenis, negara, lokasi:[id,en], profil:[[id,en,nilai,satuan]], tindakan:[[id,en]], sebab, angka:[[id,en,nilai,d,satuan,sumber,est]], pelajaran, kronologi:[[tgl,id,en]], terdampak:[id,en], seharusnya:[id,en](hipotesis), tanda:[[id,en]], faktor, sumber } */
export function kas(f) {
  const bt = (a) => (a || []).map(([x, y]) => T(x, y));
  const gagal = f.jenis !== 'berhasil';
  return {
    id: f.id, nama: f.nama, jenis: f.jenis, negara: f.negara, lokasi: T(...f.lokasi),
    ...(f.profil ? { profil: f.profil.map(([a, b, n, su]) => ({ label: T(a, b), nilai: Array.isArray(n) ? T(...n) : n, ...(su ? { satuan: su } : {}) })) } : {}),
    ...(f.tindakan ? { tindakan: bt(f.tindakan) } : {}),
    sebab: bt(f.sebab),
    ...(f.angka ? { angka: f.angka.map(([a, b, n, d, su, s, est]) => ({ label: T(a, b), nilai: n, d, satuan: su, sumber: s, est: !!est })) } : {}),
    pelajaran: bt(f.pelajaran),
    kronologi: (f.kronologi || []).map(([tg, a, b]) => ({ tanggal: tg, teks: T(a, b) })),
    ...(gagal ? { terdampak: T(...f.terdampak), seharusnya: H(...f.seharusnya), tanda_bahaya: bt(f.tanda) } : {}),
    faktor: f.faktor, sumber: f.sumber, ...(gagal ? { hak_jawab: true } : {}),
  };
}

export function validasi(d) {
  const err = [];
  const SID = new Set(Object.keys(d.sumber));
  const kar = /[—·→←]/;
  const cekT = (t, p) => { if (!t || typeof t.id !== 'string' || typeof t.en !== 'string' || !t.id || !t.en) err.push('teks id/en ' + p); };
  const cekS = (arr, p) => (arr || []).forEach((s) => { if (!SID.has(s)) err.push('sumber ' + s + ' di ' + p); });
  if (d.kunci.length !== 5) err.push('kunci != 5');
  d.kunci.forEach((k, i) => { cekT(k.label, 'kunci' + i); if (!SID.has(k.sumber)) err.push('sumber kunci ' + i); });
  if (d.penting.length !== 3) err.push('penting != 3');
  d.penting.forEach((t, i) => cekT(t, 'penting' + i)); cekT(d.posisi, 'posisi'); cekT(d.lead, 'lead');
  for (const [n, b] of Object.entries(d.bab)) {
    if (!(+n >= 2 && +n <= 42)) err.push('nomor bab ' + n);
    cekS(b.sumber, 'bab' + n);
    if (!b.sumber?.length) err.push('bab tanpa sumber ' + n);
    if (b.tipe === 'tabel') { if (!b.baris.length) err.push('tabel kosong ' + n); b.kolom.forEach((c) => cekT(c.l, 'kolom' + n)); }
    if (b.tipe === 'grafik') b.seri.forEach((s) => { cekT(s.nama, 'seri' + n); if (!s.titik.length) err.push('seri kosong ' + n); });
    for (const x of b.butir || []) {
      if (b.tipe === 'faq') { cekT(x.t, 'faq' + n); cekT(x.j, 'faq' + n); }
      if (b.tipe === 'glosarium') { cekT(x.istilah, 'glos' + n); cekT(x.arti, 'glos' + n); }
      if (b.tipe === 'langkah') { cekT(x.judul, 'langkah' + n); cekT(x.isi, 'langkah' + n); cekT(x.pelaku, 'langkah' + n); }
      if (b.tipe === 'linimasa') { cekT(x.judul, 'lini' + n); if (!/^\d{4}-\d{2}-\d{2}$/.test(x.tanggal)) err.push('tanggal lini ' + n); }
      if (b.tipe === 'kasus') {
        if (!x.sumber?.length) err.push('kasus tanpa sumber ' + x.id); cekS(x.sumber, x.id);
        if (n === '40' && x.hak_jawab !== true) err.push('hak_jawab ' + x.id);
        for (const a of x.angka || []) if (!SID.has(a.sumber)) err.push('angka tanpa sumber ' + x.id);
        for (const f of ['tindakan', 'sebab', 'pelajaran', 'tanda_bahaya']) (x[f] || []).forEach((t) => cekT(t, x.id + f));
        (x.kronologi || []).forEach((k) => { cekT(k.teks, x.id + 'kron'); if (!/^\d{4}(-\d{2}-\d{2})?$/.test(k.tanggal)) err.push('tanggal kronologi ' + x.id); });
        if (n === '39' && !x.pelajaran?.length) err.push('pelajaran ' + x.id);
        if (n === '40' && !(x.kronologi?.length && x.tanda_bahaya?.length)) err.push('kasus gagal tanpa kronologi/tanda ' + x.id);
      }
      if (b.tipe === 'periksa') { if (!SID.has(x.dasar)) err.push('dasar periksa'); cekT(x.teks, 'periksa' + n); }
    }
    (b.paragraf || []).forEach((t) => cekT(t, 'par' + n));
  }
  if (kar.test(JSON.stringify(d))) err.push('karakter terlarang (em dash, titik tengah, panah)');
  for (const [id, s] of Object.entries(d.sumber)) if (id !== 'ed' && (!/^https:\/\//.test(s.url) || !s.tanggal || !s.bukti)) err.push('sumber cacat ' + id);
  return err;
}

/* rakit naskah: sumber dipangkas ke yang dipakai */
export function rakit({ id, berkas, judul, lead, kunci: ku, penting, posisi, sumber, bab }) {
  const dipakai = JSON.stringify({ ku, bab });
  return {
    id, versi: 1, diperbarui: TGL, judul: T(...judul), lead: T(...lead), kunci: ku, penting: penting.map((p) => T(...p)), posisi: T(...posisi),
    sumber: Object.fromEntries(Object.entries(sumber).filter(([k]) => dipakai.includes(`"${k}"`))), bab,
  };
}

export function jalankan(modul, berkas, susun) {
  if (process.argv[1] !== fileURLToPath(modul)) return;
  const d = susun(); const e = validasi(d);
  if (e.length) { console.error(e.join('\n')); process.exit(1); }
  if (process.argv.includes('--selftest')) { console.log('selftest ok'); return; }
  fs.writeFileSync(path.join(akar, `public/data/topik/${berkas}.json`), JSON.stringify(d, null, 1) + '\n');
  console.log(`${berkas}: bab ${Object.keys(d.bab).length}; mercusuar ${d.bab['39'].butir.length}; gagal ${d.bab['40'].butir.length}; sumber ${Object.keys(d.sumber).length}`);
}

export function selftest(susun) {
  const d = susun(); const e = validasi(d);
  if (e.length) throw new Error(e.join('\n'));
  const b = structuredClone(d); b.bab['2'].sumber = ['tak-ada'];
  if (!validasi(b).length) throw new Error('validasi tidak menangkap sumber palsu');
  const c = structuredClone(d); c.penting[0].id = 'a — b';
  if (!validasi(c).length) throw new Error('validasi tidak menangkap em dash');
  return d;
}

/* tabel regulasi dari public/data/regulasi.json; id yang tak ada = galat (tak ada rujukan karangan). cat[id] = [id,en] isi pokok untuk topik ini */
const JENIS = { uu: 'UU', pp: 'PP', perpres: 'Perpres', permen: 'Permen', inpres: 'Inpres', keppres: 'Keppres', perda: 'Perda', lainnya: 'Peraturan' };
export function tabelRegulasi(cat) {
  const R = new Map(baca('public/data/regulasi.json').baris.map((r) => [r.id, r]));
  return Object.entries(cat).map(([i, [a, b]]) => {
    const r = R.get(i); if (!r) throw new Error('regulasi tidak ada di repo: ' + i);
    return { nama: `${JENIS[r.jenis] || r.jenis} ${r.nomor}/${r.tahun}`, judul: r.judul.length > 120 ? r.judul.slice(0, 117) + '...' : r.judul, status: r.status, tanggal: r.tanggal_ditetapkan || '-', ringkas: T(a, b), url: r.url_sumber };
  });
}
export const kolRegulasi = [
  kol('nama', 'Peraturan', 'Regulation', { url: 'url' }), kol('judul', 'Tentang', 'Subject'), kol('status', 'Status', 'Status'), kol('tanggal', 'Ditetapkan', 'Enacted'), kol('ringkas', 'Relevansi untuk topik ini', 'Relevance to this topic'),
];

/* sumber dari berkas regulasi repo (url BPK terverifikasi di repo) */
export function regS(id, judul) {
  const r = baca('public/data/regulasi.json').baris.find((x) => x.id === id); if (!r) throw new Error('regulasi tidak ada: ' + id);
  return S(judul || `${JENIS[r.jenis] || r.jenis} ${r.nomor}/${r.tahun} tentang ${r.judul}`, 'Pemerintah RI (JDIH BPK)', r.url_sumber, '2026-11-07', r.tahun, 'resmi');
}
export const nf = (x, d = 1) => String(Number(x.toFixed(d))).replace('.', ',');
export const SPUBFIN = S('IRENA Public Finance Database dan OECD DAC, penerima Indonesia, juta USD 2023 (public/data/keuangan_hijau.json)', 'IRENA dan OECD', 'https://pxweb.irena.org/pxweb/en/IRENASTAT/IRENASTAT__Finance/', '2026-11-08', 2026, 'resmi', 'IRENA: bebas dipakai dengan atribusi');

export const nfe = (x, d = 1) => String(Number(x.toFixed(d)));
