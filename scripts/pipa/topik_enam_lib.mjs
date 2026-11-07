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
    if (!(+n >= 2 && +n <= 44)) err.push('nomor bab ' + n);
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

/* ====== Pendalaman 8 Nov 2026: koneksi id ke data repo + penambahan bab. Tidak ada id karangan: id yang tak ada di JSON repo = galat. ====== */
const normNama = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/\(persero\)|\btbk\b|\bpt\b\.?|\bcv\b|[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
let _idx;
function indeksOrg() {
  if (_idx) return _idx;
  const m = new Map(), dobel = new Set();
  for (const o of baca('public/data/organisasi.json').baris) for (const n of [o.nama, o.singkatan, ...(o.nama_lain || [])]) {
    const k = normNama(n); if (k.length < 3) continue;
    if (m.has(k) && m.get(k) !== o.id) dobel.add(k); else m.set(k, o.id);
  }
  dobel.forEach((k) => m.delete(k));
  return (_idx = m);
}
const ALIAS_ORG = { 'pt pln': 'su_ed074ff5', pln: 'su_ed074ff5', 'kementerian esdm': 'l_7278e0528a', esdm: 'l_7278e0528a', 'kementerian keuangan': 'l_7b43a2574c', kemenkeu: 'l_7b43a2574c', brin: 'l_973f60de15', ojk: 'l_15e21f04fa', danantara: 'l_43f00f6a72', 'ditjen ebtke': 'l_38ba1d6f56', smi: 'p_a235c21f23', 'pln indonesia power': 'p_5a2e7d0c63', 'pln nusantara power': 'p_ff7a390a42', 'pln icon plus': 'p_e0f3886341', pertamina: 'p_b1c52ad7b0', adb: 'in_9a375db244', jica: 'in_eb327fef3a', 'world bank': 'l_18a9ec31f4' };
export const idOrg = (nama) => { const k = normNama(nama); return ALIAS_ORG[k] || indeksOrg().get(k) || null; };
const ORGS = () => new Set(baca('public/data/organisasi.json').baris.map((o) => o.id));
const PJS = () => new Set(baca('public/data/proyek.json').baris.map((o) => o.id));
export const cekId = (jenis, id) => {
  const peta = { org: ORGS, pj: PJS, pend: () => new Set(baca('public/data/pendanaan.json').pendanaan.map((x) => x.id)), reg: () => new Set(baca('public/data/regulasi.json').baris.map((x) => x.id)), riset: () => new Set(baca('public/data/riset.json').map((x) => x.id)), inov: () => new Set(baca('public/data/inovasi.json').inovasi.map((x) => x.id)), pus: () => new Set(baca('public/data/pustaka.json').baris.map((x) => x.id)), kal: () => new Set(baca('public/data/kalender.json').baris.map((x) => x.id)), ber: () => new Set(baca('public/data/berita.json').baris.map((x) => x.id)), gppd: () => new Set(baca('public/data/gppd.json').baris.map((x) => x.id)) };
  const h = (cekId._c ||= {}); const s = (h[jenis] ||= peta[jenis]());
  if (!s.has(id)) throw new Error(`id ${jenis} tidak ada di repo: ${id}`);
  return id;
};
export const SDIREKTORI = S('Direktori METI: organisasi, proyek, pendanaan, regulasi, riset (berkas public/data/*.json; tiap baris punya sumber sendiri di berkasnya)', 'METI', 'https://platformmeti.timitbnpb.workers.dev', '2026-11-08', 2026, 'via-pihak-ketiga');

/* sel teks: string atau [id,en] */
const sel = (v) => (Array.isArray(v) ? T(v[0], v[1]) : v);
/* bab 9: pemain. tambahan = [[nama, [peranId, peranEn], rujuk, idEksplisit?]]; baris lama dipertahankan dan diberi id bila nama cocok */
export function pemain(d, tambahan, dasarId, maks = 45) {
  const b = d.bab['9']; const ada = new Set();
  const baris = b.baris.map((r) => { const id = r.id || idOrg(r.nama); if (id) ada.add(id); return { nama: r.nama, ...(id ? { id, url: '/o/' + id } : {}), peran: r.peran, rujuk: r.rujuk }; });
  for (const [nama, peran, rujuk, ide] of tambahan) {
    const id = ide ? cekId('org', ide) : idOrg(nama);
    if (id && ada.has(id)) continue; if (id) ada.add(id);
    baris.push({ nama, ...(id ? { id, url: '/o/' + id } : {}), peran: sel(peran), rujuk });
  }
  const ds = baca(`public/data/topik/dasar-${dasarId}.json`).pemain || [];
  for (const o of ds) if (baris.length < maks && !ada.has(o.id)) { ada.add(o.id); baris.push({ nama: o.nama, id: o.id, url: '/o/' + o.id, peran: T(`${o.kategori || 'Organisasi'}; peran rantai: ${(o.peran || []).join(', ') || 'tercatat di direktori'}`, `${o.kategori || 'Organisation'}; chain role: ${(o.peran || []).join(', ') || 'listed in the directory'}`), rujuk: 'Direktori METI' }); }
  d.bab['9'] = { ...b, kolom: [kol('nama', 'Pelaku', 'Actor', { url: 'url' }), kol('peran', 'Peran di topik ini', 'Role in this topic'), kol('rujuk', 'Dasar', 'Basis')], baris, sumber: [...new Set([...b.sumber, 'direktori'])], per: 15, catatan: T('Tautan nama mengarah ke profil di direktori METI bila organisasinya tercatat; pelaku tanpa tautan belum ada di direktori dan dicatat dari sumber di kolom Dasar.', 'Names link to the METI directory profile when the organisation is listed; actors without a link are not yet in the directory and are noted from the source in the Basis column.') };
  d.sumber.direktori = SDIREKTORI;
}
/* bab 10: proyek. lama: peta kolom lama -> kanonik; tambahan = [[nama, wilayah, ukuran, status, rujuk, idProyekOpsional]] */
export function proyek(d, peta, tambahan, judulKol = ['Proyek', 'Project']) {
  const b = d.bab['10']; const ada = new Set();
  const ambil = (r, k) => { const v = peta[k] ? r[peta[k]] : r[k]; return v == null ? '-' : v; };
  const baris = b.baris.map((r) => { const nama = r[peta.nama || 'nama']; const id = r.id || null; return { nama, ...(id ? { id, url: '/p/' + id } : {}), wilayah: ambil(r, 'wilayah'), ukuran: ambil(r, 'ukuran'), status: ambil(r, 'status'), sumber: r.sumber || r.rujuk || '-' }; });
  for (const [nama, wil, uk, st, rujuk, idp] of tambahan) {
    const id = idp ? (idp.startsWith('WRI') ? cekId('gppd', idp) : cekId('pj', idp)) : null; if (id) ada.add(id);
    baris.push({ nama, ...(id ? (id.startsWith('WRI') ? { id } : { id, url: '/p/' + id }) : {}), wilayah: sel(wil), ukuran: sel(uk), status: sel(st), sumber: rujuk });
  }
  d.bab['10'] = { ...b, kolom: [kol('nama', judulKol[0], judulKol[1], { url: 'url' }), kol('wilayah', 'Wilayah', 'Region'), kol('ukuran', 'Ukuran', 'Size'), kol('status', 'Status menurut sumber', 'Status per source'), kol('sumber', 'Dasar', 'Basis')], baris, per: 15 };
}
/* bab 12: regulasi. cat = { idRegulasi: [id,en] } ditambahkan; baris lama diberi id */
export function regulasi(d, cat) {
  const R = baca('public/data/regulasi.json').baris;
  const b = d.bab['12']; const ada = new Set();
  const nm = (r) => `${JENIS[r.jenis] || r.jenis} ${r.nomor}/${r.tahun}`;
  const baris = b.baris.map((x) => { const r = R.find((q) => nm(q) === x.nama); if (r) ada.add(r.id); return { ...x, ...(r ? { id: r.id } : {}) }; });
  for (const [i, ring] of Object.entries(cat)) { if (ada.has(i)) continue; const t = tabelRegulasi({ [i]: ring })[0]; baris.push({ ...t, id: i }); ada.add(i); }
  d.bab['12'] = { ...b, baris, per: 10 };
}
/* ganti paragraf/butir: tambah ke daftar bab */
export const tambah = (d, n, kunciDaftar, butir) => { d.bab[n][kunciDaftar].push(...butir); };
export const pasang = (d, n, bab) => { d.bab[n] = bab; };
export function sumberBaru(d, peta) { Object.assign(d.sumber, peta); }
const BAB_FAQ = [[/regulasi|aturan|izin|wajib|sanksi|hukum|boleh/i, 12], [/biaya|harga|investasi|dana|danai|pembiaya/i, 19], [/proyek|lokasi|pltn|plta|reaktor/i, 10], [/siapa|pemain|operator|mengawasi/i, 9], [/target|proyeksi|kapan|berapa/i, 30], [/apa itu|apa beda|apa saja|apa bedanya/i, 3]];
const KAT_UANG = /biaya|pinjam|obligasi|sukuk|dana|kontrak kinerja|savings|payback|investasi|green|finance|pembiaya/i, KAT_ATURAN = /^(PP|UU|Perpres|Permen|SKEM|LTHE|RUPTL|RUKN|INIR|ISO|SNI|Aturan|Grid code|Milestones|Safeguards|Kuota|Kerugian|Proteksi)/i, KAT_SATUAN = /^(MVA|kms|TOE|SBM|MWt|MWe|kWh|GWh|MW|GW)\b|satuan|unit/i;
const MWORG = () => { const m = new Map(); for (const p of baca('public/data/proyek.json').baris) { const k = (p.kapasitas || [])[0]; const mw = k && /^mw$/i.test(k.satuan) && Number.isFinite(k.nilai) ? k.nilai : 0; for (const o of (p.pihak?.pemilik || [])) if (o.organisasi_id) m.set(o.organisasi_id, (m.get(o.organisasi_id) || 0) + mw); } return m; };
const judulKasus = (t) => (typeof t === 'string' && t.length > 12 && !/[a-z]/.test(t) && (t.match(/[A-Z]+/g) || []).length >= 3 ? t.toLowerCase().replace(/(^|\s)([a-z])/g, (m, a, b) => a + b.toUpperCase()) : t);
/* medan tambahan untuk cetakan topik baru (koordinator 8 Nov 2026): faq.bab, glosarium.kat, pemain.mw, langkah.peran, id baris tabel, normalisasi kapital penuh */
export function lengkapi(d) {
  const mw = MWORG();
  for (const [n, b] of Object.entries(d.bab)) {
    if (b.tipe === 'faq') b.butir.forEach((x) => { if (x.bab == null) x.bab = (BAB_FAQ.find(([re]) => re.test(x.t.id)) || [0, 4])[1]; });
    if (b.tipe === 'glosarium') b.butir.forEach((x) => { if (!x.kat) x.kat = KAT_SATUAN.test(x.istilah.id) ? 'satuan' : KAT_ATURAN.test(x.istilah.id) ? 'aturan' : KAT_UANG.test(x.istilah.id + ' ' + x.arti.id) ? 'uang' : 'teknis'; });
    if (b.tipe === 'langkah') b.butir.forEach((x) => { if (!x.peran) x.peran = x.pelaku; });
    if (b.tipe === 'tabel') {
      b.baris.forEach((r) => { if (!('id' in r) && (n === '9' || n === '10' || n === '12' || n === '24' || n === '18' || n === '36')) r.id = null; for (const k of ['nama', 'pos', 'judul', 'negara']) if (typeof r[k] === 'string') r[k] = judulKasus(r[k]); if (n === '9') r.mw = r.id && mw.has(r.id) ? Math.round(mw.get(r.id) * 10) / 10 : null; });
      if (n === '9' && !b.kolom.some((c) => c.k === 'mw')) b.kolom.push(kol('mw', 'Kapasitas proyek tercatat (MW)', 'Recorded project capacity (MW)', { num: true, d: 0 }));
    }
    if (b.tipe === 'linimasa') b.butir = b.butir.filter((x) => !/^perda\b/i.test(x.judul.id));
  }
  for (const k of d.bab['39'].butir.concat(d.bab['40'].butir)) { if (!('foto' in k)) k.foto = null; if (!('koordinat' in k)) k.koordinat = null; }
  const s7 = d.bab['7']?.seri?.[0]?.titik;
  d.kunci.forEach((x) => { if (!x.deret) x.deret = null; });
  if (s7 && s7.every((p) => /^\d{4}$/.test(String(p[0])) && typeof p[1] === 'number') && d.kunci[2] && /Beban puncak/.test(d.kunci[2].label.id) && !d.kunci[2].deret && Number.isFinite(d.kunci[2].nilai)) d.kunci[2].deret = s7.map((p) => [Number(p[0]), p[1]]);
  return d;
}
export function pangkas(d) {
  lengkapi(d);
  const dipakai = JSON.stringify({ ku: d.kunci, bab: d.bab });
  d.sumber = Object.fromEntries(Object.entries(d.sumber).filter(([k]) => dipakai.includes(`"${k}"`)));
  return d;
}
/* gabungkan sumber ke daftar bab */
export const pakaiSumber = (d, n, ...s) => { d.bab[n].sumber = [...new Set([...(d.bab[n].sumber || []), ...s])]; };

/* bab pembiayaan: skema dari public/data/pendanaan.json (id wajib ada). daftar = [[id, [ringkasId, ringkasEn]]] */
export function skema(daftar, catatan) {
  const P = new Map(baca('public/data/pendanaan.json').pendanaan.map((x) => [x.id, x]));
  const baris = daftar.map(([id, r]) => { const x = P.get(id); if (!x) throw new Error('pendanaan tidak ada: ' + id); return { nama: x.nama, id, url: x.url || x.sumber_url, pemberi: x.pemberi || '-', jenis: x.jenis || '-', bukti: x.tingkat_bukti || '-', ringkas: T(...r) }; });
  return { tipe: 'tabel', per: 8, sumber: ['direktori'], kolom: [kol('nama', 'Skema', 'Scheme', { url: 'url' }), kol('pemberi', 'Pemberi', 'Provider'), kol('jenis', 'Jenis', 'Type'), kol('bukti', 'Tingkat bukti', 'Evidence level'), kol('ringkas', 'Relevansi untuk topik ini', 'Relevance to this topic')], baris, ...(catatan ? { catatan: T(...catatan) } : {}) };
}
/* tabel riset kampus/peneliti dari irisan dasar (id OpenAlex). kata = regex judul, maks baris */
export function risetTabel(dasarId, kata, maks = 10, catatan) {
  const baris = (baca(`public/data/topik/dasar-${dasarId}.json`).riset || []).filter((r) => kata.test(r.judul)).sort((a, b) => (b.sitasi || 0) - (a.sitasi || 0)).slice(0, maks).map((r) => ({ judul: r.judul, id: cekId('riset', r.id), url: r.url, penulis: (r.penulis || []).join(', '), jurnal: `${r.jurnal || '-'} (${r.tahun || '-'})`, sitasi: r.sitasi ?? 0 }));
  return { tipe: 'tabel', per: 10, sumber: ['direktori'], kolom: [kol('judul', 'Karya', 'Work', { url: 'url' }), kol('penulis', 'Penulis', 'Authors'), kol('jurnal', 'Jurnal (tahun)', 'Journal (year)'), kol('sitasi', 'Sitasi', 'Citations', { num: true, d: 0 })], baris, ...(catatan ? { catatan: T(...catatan) } : {}) };
}
/* satu butir linimasa dari regulasi repo: tanggal dan url diambil dari JSON, teks ditulis tangan */
export function linReg(id, a, b) {
  const r = baca('public/data/regulasi.json').baris.find((x) => x.id === id); if (!r || !r.tanggal_ditetapkan) throw new Error('regulasi/tanggal tidak ada: ' + id);
  return [r.tanggal_ditetapkan, a, b, r.url_sumber];
}
/* sumber untuk proyek Bank Dunia di public/data/proyek.json */
export const SWB = S('World Bank Projects and Operations, ringkasan proyek Indonesia (diolah repo: public/data/proyek.json, id wb_P...)', 'The World Bank', 'https://projects.worldbank.org/en/projects-operations/projects-home', '2026-11-07', 2026, 'resmi', 'CC BY 4.0');
export const nilaiProyek = (id) => { const p = baca('public/data/proyek.json').baris.find((x) => x.id === id); if (!p) throw new Error('proyek tidak ada: ' + id); return p; };
export const juta = (usd) => nf(usd / 1e6, 0);

/* pasar listrik nasional: dihitung dari public/data/statistik_pln.json dan kelistrikan.json (tahun 2024), semua EST karena penjumlahan 38 provinsi */
export const SSTATPLN = S('Statistik Ketenagalistrikan 2024, Ditjen Ketenagalistrikan ESDM (diolah repo: public/data/statistik_pln.json dan kelistrikan.json, 38 provinsi)', 'Kementerian ESDM', 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/91fa8-buku-statistik-ketenagalistrikan-2024.pdf', '2026-11-07', 2024, 'resmi');
export function pasarListrik() {
  const sp = baca('public/data/statistik_pln.json').baris, kl = baca('public/data/kelistrikan.json').baris;
  const fm = (x, d = 0) => x.toLocaleString('id-ID', { maximumFractionDigits: d });
  const fe = (x, d = 0) => x.toLocaleString('en-US', { maximumFractionDigits: d });
  const jenis = (k) => sp.reduce((a, x) => a + (x.kapasitas_terpasang_mw[k] || 0), 0);
  const kap = jenis('total'), pltu = jenis('PLTU/MT'), terb = jenis('PLTS') + jenis('PLTB') + jenis('PLTA/M') + jenis('PLTP') + jenis('PLT Bio');
  const rt = kl.reduce((a, x) => a + (x.rumah_tangga_berlistrik_jumlah || 0), 0);
  const re = kl.filter((x) => Number.isFinite(x.rasio_elektrifikasi_persen)).sort((a, b) => a.rasio_elektrifikasi_persen - b.rasio_elektrifikasi_persen);
  return [
    T(`Kapasitas terpasang seluruh pengusaha (PLN dan nonPLN) 2024: ${fm(kap)} MW, jumlah 38 provinsi (EST; Statistik Ketenagalistrikan 2024).`, `Installed capacity of all operators (PLN and non-PLN) in 2024: ${fe(kap)} MW, the sum of 38 provinces (EST; Electricity Statistics 2024).`),
    T(`Komposisi: kategori PLTU/MT ${fm(pltu)} MW (${fm((pltu / kap) * 100, 1)} persen); hidro, panas bumi, surya, bayu, dan bio ${fm(terb)} MW (${fm((terb / kap) * 100, 1)} persen) (EST).`, `Mix: the PLTU/MT category ${fe(pltu)} MW (${fe((pltu / kap) * 100, 1)} percent); hydro, geothermal, solar, wind and bio ${fe(terb)} MW (${fe((terb / kap) * 100, 1)} percent) (EST).`),
    T(`Rumah tangga berlistrik (PLN dan nonPLN) 2024: ${fm(rt)} rumah tangga, jumlah 38 provinsi (EST).`, `Electrified households (PLN and non-PLN) in 2024: ${fe(rt)} households, the sum of 38 provinces (EST).`),
    T(`Rasio elektrifikasi 2024 terendah ${re[0].provinsi} (${fm(re[0].rasio_elektrifikasi_persen, 2)} persen) dan tertinggi ${re.at(-1).provinsi} (${fm(re.at(-1).rasio_elektrifikasi_persen, 2)} persen).`, `The 2024 electrification ratio was lowest in ${re[0].provinsi} (${fe(re[0].rasio_elektrifikasi_persen, 2)} percent) and highest in ${re.at(-1).provinsi} (${fe(re.at(-1).rasio_elektrifikasi_persen, 2)} percent).`),
  ];
}

/* kode provinsi BPS dari public/data/kelistrikan.json (38 provinsi); nama tak dikenal = galat */
export const kodeProv = (nama) => { const r = baca('public/data/kelistrikan.json').baris.find((x) => x.provinsi.toLowerCase() === String(nama).toLowerCase()); if (!r) throw new Error('provinsi tidak ada: ' + nama); return r.kode; };
/* tambah kolom kode BPS dan tautan /wilayah?prov= pada tabel yang kolom namanya k berisi nama provinsi (string atau {id,en}) */
export function denganKode(bab, k) {
  bab.kolom = [{ ...bab.kolom[0], url: 'url' }, kol('kode', 'Kode BPS', 'BPS code'), ...bab.kolom.slice(1)];
  bab.baris = bab.baris.map((r) => { const nm = typeof r[k] === 'string' ? r[k] : r[k].id; const kode = kodeProv(nm); return { ...r, kode, url: '/wilayah?prov=' + kode }; });
  return bab;
}
