// Pembantu pendalaman naskah topik (dipakai topik_<id>_dalam.mjs). Hanya menambah ke bab yang sudah dibangun; tanpa jaringan.
// Koneksi data: id organisasi/regulasi/pustaka/inovasi/pendanaan dicari dari public/data saat build; tidak ketemu = dilewati (bukan dikarang).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const akar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const baca = (p) => JSON.parse(fs.readFileSync(path.join(akar, p), 'utf8'));
export const T = (id, en) => ({ id, en });
export const TGL = '2026-11-08';
export const S = (judul, penerbit, url, tanggal, bukti, lisensi) => ({ judul, penerbit, url, tanggal, tahun: Number(tanggal.slice(0, 4)), bukti, ...(lisensi ? { lisensi } : {}) });
export const HIP = 'Analisis METI (Hipotesis): ';
export const HIPE = 'METI analysis (Hypothesis): ';
export const G = (rows) => rows.map(([i, a, e]) => ({ istilah: T(i, i), arti: T(a, e) }));
export const FQ = (rows) => rows.map(([a, b, c, d]) => ({ t: T(a, b), j: T(c, d) }));
export const P = (...pp) => pp.map(([a, b]) => T(a, b));
export const sm = (...k) => k;

const ORG = baca('public/data/organisasi.json').baris;
const REG = baca('public/data/regulasi.json').baris;
const PUS = baca('public/data/pustaka.json').baris;
const INO = baca('public/data/inovasi.json').inovasi;
const PEND = baca('public/data/pendanaan.json').pendanaan;
const PROYEK = baca('public/data/proyek.json').baris;
const WIL = baca('public/data/wilayah.json').baris;

/* id organisasi dari nama/singkatan (regex, tanpa huruf besar kecil); null bila tak ada */
export const oid = (re) => { const r = new RegExp(re, 'i'); return ORG.find((o) => r.test(o.nama) || r.test(o.singkatan || '') || (o.nama_lain || []).some((n) => r.test(n)))?.id ?? null; };
export const rid = (nomorTahun) => REG.find((r) => `${r.jenis}-${r.nomor}-${r.tahun}`.toLowerCase() === nomorTahun.toLowerCase())?.id ?? null;
export const pid = (re) => PUS.find((p) => new RegExp(re, 'i').test(p.judul))?.id ?? null;
export const iid = (re) => INO.find((p) => new RegExp(re, 'i').test(p.nama))?.id ?? null;
export const did = (re) => PEND.find((p) => new RegExp(re, 'i').test(p.nama))?.id ?? null;
export const jid = (re, tek) => PROYEK.find((p) => new RegExp(re, 'i').test(p.nama) && (!tek || tek.includes(p.teknologi)))?.id ?? null;
export const kodeProv = (nama) => WIL.find((w) => w.nama.toLowerCase() === String(nama).toLowerCase())?.kode ?? null;

/* tautan internal dari id */
export const uOrg = (id) => (id ? '/o/' + id : null);

/* baris pemain: [regex nama, tahap/peran id, peran en] -> {nama, id, peran, u}; nama organisasi diambil dari data bila ada */
export const pemainRows = (rows) => {
  const hasil = [];
  for (const [re, pid_, pen, label] of rows) {
    const id = oid(re); const o = id ? ORG.find((x) => x.id === id) : null;
    hasil.push({ nama: label || o?.nama || re, id, peran: T(pid_, pen), ...(id ? { u: '/o/' + id } : {}) });
  }
  return hasil;
};
export const KOL_PEMAIN = [{ k: 'nama', l: T('Pihak', 'Party'), url: 'u' }, { k: 'peran', l: T('Peran', 'Role') }];

/* tambah ke bab: pasang(bab, SUMBER, n, {tipe, field: [..]}, sumberBaru, kunciSumber) */
export function tambahSumber(SUMBER, baru) { for (const [k, v] of Object.entries(baru)) SUMBER[k] = v; }
export function ke(bab, n, tipe, field, arr, srcKeys = []) {
  const b = (bab[n] ||= { tipe, sumber: [] });
  if (b.tipe !== tipe) throw new Error(`bab ${n} bertipe ${b.tipe}, bukan ${tipe}`);
  (b[field] ||= []);
  const kunci = (x) => JSON.stringify(x.dok ?? x.istilah?.id ?? x.t?.id ?? x.judul?.id ?? x.nama ?? x.id ?? x);
  const ada = new Set(b[field].map(kunci));
  for (const x of arr) if (!ada.has(kunci(x))) { b[field].push(x); ada.add(kunci(x)); }
  for (const s of srcKeys) if (!b.sumber.includes(s)) b.sumber.push(s);
  return b;
}
/* peta provinsi: tambah kode BPS dan tautan /wilayah?prov= ke bab 8 */
export function petaProv(bab) {
  const b = bab['8']; if (!b) return;
  if (!b.kolom.some((c) => c.k === 'kode')) b.kolom.splice(1, 0, { k: 'kode', l: T('Kode BPS', 'BPS code') });
  b.kolom[0].url = 'u';
  for (const r of b.baris) { const k = kodeProv(r.prov); if (k) { r.kode = k; r.u = '/wilayah?prov=' + k; } }
}
/* pemeriksaan jumlah minimum (dipakai uji): daftar bab yang masih di bawah target */
export const TARGET = { 2: 15, 3: 30 };

/* bab 9: tabel pemain = pemain dasar-<id>.json + tambahan bernama ([regex, peran id, peran en]); semua ber-id organisasi bila ada */
export function pemainTabel(idDasar, extras, srcKeys = ['ed']) {
  const d = baca(`public/data/topik/dasar-${idDasar}.json`).pemain || [];
  const baris = new Map();
  for (const p of d) baris.set(p.id, { nama: p.nama, id: p.id, kategori: p.kategori || '-', peran: (p.peran || []).join(', ') || '-', proyek: p.proyek || 0, u: '/o/' + p.id });
  for (const [re, pi, pe] of extras) {
    const id = oid(re); if (!id || baris.has(id)) { if (id && pi) baris.get(id).peran = T(pi, pe); continue; }
    const o = ORG.find((x) => x.id === id);
    baris.set(id, { nama: o.nama, id, kategori: o.kategori?.label || '-', peran: T(pi, pe), proyek: (o.proyek_ids || []).length, u: '/o/' + id });
  }
  return { tipe: 'tabel', per: 10, sumber: srcKeys, catatan: T('Organisasi di basis METI yang berkepakaran pada topik ini atau disebut dalam rantai nilai; klik nama untuk profil. Pihak yang belum punya profil di basis tidak ditampilkan di sini.', 'Organisations in the METI base with expertise in this topic or named in the value chain; click a name for the profile. Parties without a profile in the base are not shown here.'),
    kolom: [{ k: 'nama', l: T('Organisasi', 'Organisation'), url: 'u' }, { k: 'kategori', l: T('Kategori', 'Category') }, { k: 'peran', l: T('Peran', 'Role') }, { k: 'proyek', l: T('Proyek di basis', 'Projects in base'), num: true, d: 0 }],
    baris: [...baris.values()].sort((a, z) => z.proyek - a.proyek || String(a.nama).localeCompare(z.nama)) };
}
/* linimasa dari id regulasi: tanggal dari data; judul bilingual dari penulis */
export function liniReg(rows) {
  return rows.flatMap(([id, a, e]) => { const r = REG.find((x) => x.id === id); return r?.tanggal_ditetapkan ? [{ tanggal: r.tanggal_ditetapkan, judul: T(a, e), reg: id }] : []; });
}
/* tabel regulasi (bab 12): tambahan baris ber-id; kolom dok, ttg, st, u */
export function regTabel(rows) {
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
  const label = (id) => { const p = id.split('-'); const th = p.pop(), no = p.pop(); const mid = p.slice(1).filter((x) => !/^b\d+$/.test(x)).map((x) => (x.length <= 4 ? x.toUpperCase() : cap(x))); return [cap(p[0]), ...mid].join(' ') + ` ${no}/${th}`; };
  return rows.flatMap(([id, ttg, ttgEn]) => { const r = REG.find((x) => x.id === id); return r ? [{ dok: label(id), ttg: T(ttg, ttgEn), st: r.status, u: '/regulasi?id=' + id, id }] : []; });
}
export const kasus = (o) => ({ negara: 'ID', ...o });

/* ---------- pelengkap cetakan baru (8 Nov 2026): bab pada FAQ, kat glosarium, mw pemain, id baris regulasi, peran rantai, kapital, linimasa ---------- */
const KATA_BAB = [[/harga|biaya|tarif|lcoe|lcos|rp\b|usd/i, 19], [/aturan|wajib|izin|perpres|permen|pojk|insentif|ppn|tkdn/i, 12], [/proyek|beroperasi|pabrik|stasiun|spklu/i, 10], [/risiko|aman|kebakaran|emisi|netral|lingkungan/i, 27], [/target|peta jalan|rencana|2030|2045|2060/i, 30], [/rumus|hitung|berapa lama|kwh|waktu/i, 5], [/negara|dunia|iea|global/i, 20]];
const KAT_ATURAN = /perpres|permen|\buu\b|pojk|inpres|keppres|mandatori|wajib|ispo|tkdn|\bpso\b|\bred\b|sertifikasi|standar|baku mutu|\bsni\b|jakstranas/i;
const KAT_UANG = /tarif|harga|cfd|capex|opex|lcos|lcoe|lcoh|pendanaan|tipping|fee|\bfid\b|offtake|pengikatan|dana\b|bpdp|investasi|kredit|pajak|ppn|insentif|kompensasi|anuitas|pembiayaan|take-or-pay|tco|\bppa\b/i;
const KAT_SATUAN = /^(mw|mwh|kwh|gwh|twh|mtpa|ktpa|nm3|tco2e?|kg|gj|tj|c-rate|kg per hari|mw dan mwh|nilai kalor|siklus|jangkauan|kapasitas baterai)/i;
const ROLE = [['pln', /pln|offtaker|pembeli listrik/i], ['pusat', /esdm|kemen|kemenperin|kemenkeu|kemenhub|ojk|klh|bpdp|regulator|pemerintah pusat|kemenperin/i], ['pemda', /pemda|daerah/i], ['investor', /investor|bank|danantara|pembiayaan|pendan/i], ['meti', /meti|akademisi|kampus|studi/i], ['pengembang', /.*/]];
const TITIK = new Set('PT CV TBK PLN ESDM BUMN BUMD UI UGM ITB IPB BRIN DPR RI KLH OJK IDX KSEI KPEI APROBI BPDP IBC CATL LG SK EV BESS PLTS PLTP PLTU PLTA PLTB'.split(' '));
export function normalKapital(s) {
  if (typeof s !== 'string') return s;
  const kata = s.match(/[A-Za-z]+/g) || [];
  if (kata.length < 3 || s !== s.toUpperCase()) return s;
  return s.replace(/[A-Za-z]+/g, (w) => (TITIK.has(w) ? w : w.charAt(0) + w.slice(1).toLowerCase()));
}
function mwOrg(id) {
  const o = ORG.find((x) => x.id === id); if (!o) return 0;
  let mw = 0; for (const pid_ of o.proyek_ids || []) { const p = PROYEK.find((x) => x.id === pid_); const k = p?.kapasitas?.[0]; if (k && /^mw$/i.test(k.satuan) && Number.isFinite(k.nilai)) mw += k.nilai; }
  return Math.round(mw);
}
export function lengkapi(d, { deret = {} } = {}) {
  const bab = d.bab, tx = (t) => (typeof t === 'string' ? t : t?.id || '');
  /* (1) deret kunci: indeks kunci -> [[tahun, nilai]] */
  for (const [i, serie] of Object.entries(deret)) if (d.kunci[i] && serie?.length) d.kunci[i].deret = serie;
  /* (2) faq.bab */
  for (const x of bab['2']?.butir || []) if (x.bab == null) x.bab = (KATA_BAB.find(([re]) => re.test(tx(x.t) + ' ' + tx(x.j))) || [0, 4])[1];
  /* (3) glosarium.kat */
  for (const x of bab['3']?.butir || []) { const s = tx(x.istilah), a = tx(x.arti); x.kat = x.kat || (KAT_SATUAN.test(s) ? 'satuan' : KAT_ATURAN.test(s + ' ' + a.slice(0, 60)) ? 'aturan' : KAT_UANG.test(s + ' ' + a.slice(0, 60)) ? 'uang' : 'teknis'); }
  /* (4) pemain mw */
  const b9 = bab['9']; if (b9?.baris) { for (const r of b9.baris) r.mw = r.id ? mwOrg(r.id) : 0; if (!b9.kolom.some((c) => c.k === 'mw')) b9.kolom.push({ k: 'mw', l: T('Kapasitas proyek (MW)', 'Project capacity (MW)'), num: true, d: 0 }); }
  /* (5) id baris regulasi dan pendanaan */
  for (const r of bab['12']?.baris || []) if (!r.id) { const m = REG.find((x) => x.url_sumber === r.u || x.url_pdf === r.u || '/regulasi?id=' + x.id === r.u); if (m) r.id = m.id; }
  for (const r of bab['24']?.baris || []) if (!r.id) { const m = PEND.find((x) => x.nama === r.nama); if (m) r.id = m.id; }
  /* (6) negara ISO2 pada kasus */
  for (const n of ['39', '40']) for (const k of bab[n]?.butir || []) if (!k.negara) k.negara = 'ID';
  /* (7) peran per tahap rantai */
  for (const x of bab['6']?.butir || []) if (!x.peran) { const s = tx(x.pelaku); x.peran = (ROLE.find(([, re]) => re.test(s)) || ['pengembang'])[0]; }
  /* (8) kapital penuh -> huruf biasa pada nama baris */
  for (const b of Object.values(bab)) for (const r of b.baris || []) for (const f of ['nama', 'pem', 'dok']) if (typeof r[f] === 'string') r[f] = normalKapital(r[f]);
  /* (9) linimasa: buang butir dari perda/lainnya (cocok kata saja) */
  if (bab['13']?.butir) bab['13'].butir = bab['13'].butir.filter((x) => !/^(perda|lainnya)/.test(x.reg || ''));
  return d;
}
