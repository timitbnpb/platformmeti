#!/usr/bin/env node
/* aturan pemilik: tanpa em dash dan titik tengah di teks tayang */
const bersihTanda = (s) => s.replace(/\s*\u2014\s*/g, ", ").replace(/\s*\u00b7\s*/g, ", ");
// Potret per lapis dari SELURUH data-panen lokal -> data-panen/potret/{publik,anggota,pengurus}/<benda>.json.
// Bentuk: docs/perencanaan/SKEMA-POTRET.md. Tidak mengunggah (itu unggah_potret.mjs, dijalankan koordinator).
//   node scripts/pipa/potret.mjs            bangun (gagal bila pemindai data pribadi / ukuran > 2 MB melanggar)
//   node scripts/pipa/potret.mjs --periksa  pindai ulang berkas hasil (dipakai unggah_potret.mjs)
//   node scripts/pipa/potret.mjs --selftest
// Deterministik: tanggal bangun dari env TANGGAL_BANGUN atau tanggal_ambil terbaru di masukan, bukan jam.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { bangunSitemap } from './sitemap.mjs';
import { terapkan as terapkanMetiWilayah } from './meti_wilayah_orang.mjs';
import { gabung as gabungFoto, muat as muatFoto } from './foto_orang_gabung.mjs';
import { normWilayah } from '../panen/panen_proyek.mjs';
import { bangunKonteks, perkaya } from '../panen/berita_wilayah.mjs';
import { bangunOrang, orangDari, bangunLembaga, lembagaDari } from '../panen/berita_kenal.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DP = path.join(ROOT, 'data-panen');
const OUT = path.join(DP, 'potret');
const LAPIS = ['publik', 'anggota', 'pengurus'];
const MAKS = 2 * 1024 * 1024;

// ---------- pemindai data pribadi (publik + anggota) ----------
const PERAN_GENERIK = /^(info|infopublik|information|office|admin|contact|hello|mail|sekretariat|secretariat|humas|corsec|corpsec|cs|customercare|customer\.care|ppid|ir|investor\.relation|press|media|media\.inquiries|layanan|sales|infosec|corporate\.communications|marketing|support|pengadaan[\w-]*)([.\-_][\w.\-]*)?$/i;
const PLACEHOLDER = /@(example\.(com|org)|mysite\.com)$/i;
const RE_SUREL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const RE_PONSEL = [/(?<![\d.])(?:\+62|62|0)8\d{8,11}(?!\d)/, /(?<![\d.])(?:\+62[\s-]?|0)8\d{1,3}[\s-]\d{3,4}[\s-]\d{3,5}(?!\d)/];
const RE_NIK = /(?<![\d.])\d{16}(?![\d.])/;
const RE_LAHIR = /(tanggal[_ ]lahir|tgl[_ .]?lahir|tempat[, ]+tanggal lahir|date[_ ]of[_ ]birth|"dob"|"ttl"|"lahir"|born\s+(on\s+)?\d|lahir\s*(pada|:)?\s*\d{1,2}[\s\/-])/i;
export const suratKorporat = (e) => !PLACEHOLDER.test(e) && PERAN_GENERIK.test(e.split('@')[0]);
export const ponselIndonesia = (t) => RE_PONSEL.some((re) => re.test(String(t)));
export function pindai(teks) {
  const s = String(teks).replace(/https?:\/\/[^"\s]+/g, '');
  const temu = [];
  for (const e of s.match(RE_SUREL) || []) if (!suratKorporat(e) && !PLACEHOLDER.test(e)) temu.push('surel pribadi: ' + e);
  for (const re of RE_PONSEL) { const m = s.match(re); if (m) temu.push('ponsel: ' + m[0]); }
  const nik = s.match(RE_NIK); if (nik) temu.push('NIK/16 digit: ' + nik[0]);
  const l = s.match(RE_LAHIR); if (l) temu.push('tanggal lahir: ' + l[0]);
  return temu;
}

// ---------- nama dan gelar ----------
const GELAR_DEPAN = new Set(['Prof', 'Dr', 'Dra', 'Drs', 'Ir', 'H', 'Hj', 'MSc', 'MT', 'ST', 'SE', 'SH', 'MBA', 'MM', 'MA', 'MPP', 'MIA', 'MEng', 'PhD', 'IPM', 'IPU', 'SSi', 'MSi', 'SKom', 'MKom', 'SIP', 'SSos', 'SPd', 'MPd', 'SKM', 'MKes', 'LLM', 'CFA', 'CPA', 'FRM', 'BEng', 'drg', 'dr']);
const GELAR_BELAKANG = new Set([...GELAR_DEPAN].filter((g) => !['H', 'Hj', 'Dr', 'Prof', 'Ir', 'Dra', 'Drs', 'drg', 'dr'].includes(g)));
const kunciG = (t) => t.replace(/[.,]/g, '');
export function pisahNama(teks, gelarAda) {
  const [depan, ...belakangKoma] = String(teks || '').split(','); const gelar = [];
  const t = depan.trim().split(/\s+/).filter(Boolean);
  while (t.length > 1 && GELAR_DEPAN.has(kunciG(t[0]))) gelar.push(t.shift());
  while (t.length > 1 && GELAR_BELAKANG.has(kunciG(t[t.length - 1]))) gelar.push(t.pop());
  const sisa = belakangKoma.join(',').trim(); if (sisa) gelar.push(sisa);
  const semua = [gelarAda, gelar.join(' ')].filter(Boolean).join(' ').trim();
  return { nama: t.join(' '), gelar: [...new Set(semua.split(/\s+/))].join(' ') || undefined };
}
// ---------- nama anggota METI (lapis pengurus) ----------
const SINGKATAN = new Set(['PT', 'CV', 'LTD', 'UD', 'PLN', 'BUMN', 'BUMD', 'PJB', 'LNG', 'PLTU', 'PLTS', 'PLTP', 'PLTA', 'EBT', 'GE', 'ABB', 'BP', 'ESDM', 'UI', 'ITB', 'IPB', 'UGM', 'BRIN', 'SKK', 'API', 'LLC', 'PTE', 'AG', 'SA', 'NV']);
const kapital = (w) => (w.length > 1 && !/[AIUEO]/.test(w) ? w : w[0] + w.slice(1).toLowerCase());
const judulHuruf = (n) => (/[a-z]/.test(n) ? n : n.replace(/[A-Za-z][A-Za-z'’]*\.?/g, (w) => { const k = w.replace(/\.$/, ''); return k.toUpperCase() === 'TBK' ? 'Tbk' + (w.endsWith('.') ? '.' : '') : SINGKATAN.has(k) || /^([A-Z]\.)+[A-Z]?$/.test(w) ? w : kapital(w); }));
/** "ANGGOTA UTAMA: PT. X akuisisi menjadi Y" -> { nama, jenis_awalan, nama_lama }. Murni, diuji di selftest. */
export function bersihkanNamaAnggota(mentah) {
  let nama = String(mentah || '').trim(), jenis_awalan;
  const m = nama.match(/^ANGGOTA\s+(UTAMA|INDIVIDU|PERUSAHAAN|ORGANISASI|KOPERASI)\b\s*:?\s*/i);
  if (m) { jenis_awalan = m[1].toLowerCase(); nama = nama.slice(m[0].length); }
  let nama_lama; const a = nama.match(/^(.*?)\s+akuisisi\s+(?:menjadi|oleh)\s+(.+)$/i);
  if (a) { nama_lama = judulHuruf(a[1].trim()); nama = a[2]; }
  return { nama: judulHuruf(nama.trim()), jenis_awalan, nama_lama };
}
/** Kontak anggota mentah -> bidang bertipe: situs[], surel, telepon, seluler, faks, hotline, pic (nama di depan nomor). Murni. */
export function rapikanKontak(a) {
  const situs = [], surel = [], hotline = []; let pic;
  const URL_RE = /(?:https?:\/\/|www\.)[^\s;,|]+/gi, EM_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
  const LABEL = /^(?:hotline|tel(?:p|epon)?|hp|wa|phone|mobile|fax|faks|ph)\s*[:.]?\s*/i;
  const lepas = (v) => {
    let t = String(v || '');
    t = t.replace(URL_RE, (u) => { situs.push(u.replace(/[.)]+$/, '')); return ' '; });
    t = t.replace(EM_RE, (e) => { surel.push(e.toLowerCase().replace(/\.$/, '')); return ' '; });
    return t;
  };
  const nomor = (v) => {
    const out = [];
    for (let seg of lepas(v).split(/[\/;|]/)) {
      seg = seg.trim(); if (!seg) continue;
      const hot = /^hotline/i.test(seg); seg = seg.replace(LABEL, '').trim();
      const m = seg.match(/^([A-Za-z][A-Za-z .'-]{2,}?)\s+(?=[+(\d])/); if (m) { pic = pic || m[1].trim(); seg = seg.slice(m[0].length).trim(); }
      if (!/\d/.test(seg)) continue;
      (hot ? hotline : out).push(seg);
    }
    return out.join(' / ') || undefined;
  };
  const telepon = nomor(a.telepon), seluler = nomor(a.seluler), faks = nomor(a.faks); lepas(a.surel);
  const u = (x) => [...new Set(x)];
  const web = u(situs.map((x) => (/^https?:/i.test(x) ? x : 'https://' + x)));
  return { telepon, seluler, faks, surel: u(surel).join(' / ') || undefined, hotline: u(hotline).join(' / ') || undefined, situs: web.length ? web : undefined, pic };
}
// ---------- util ----------
const baca = (rel) => { const f = path.join(DP, rel); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []; };
const norm = (s) => String(s || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\b(pt|tbk|persero|cv|perseroda|ud)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);
const bersih = (o) => { for (const k of Object.keys(o)) { const v = o[k]; if (v === null || v === undefined || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)) delete o[k]; } return o; };
const unik = (a) => [...new Set(a.filter(Boolean))];
const urut = (a, k = 'id') => a.sort((x, y) => (x[k] < y[k] ? -1 : x[k] > y[k] ? 1 : 0));
const adaUrl = (s) => typeof s === 'string' && /^https?:\/\//.test(s);

// ---------- taksonomi K19 ----------
export const KATEGORI = { bumn: 'BUMN', bumd: 'BUMD', swasta: 'Swasta', internasional: 'Perusahaan Internasional di Indonesia', 'kementerian-lembaga': 'Kementerian dan Lembaga Negara', pemda: 'Pemerintah Daerah', 'perguruan-tinggi': 'Perguruan Tinggi', 'think-tank': 'Think Tank dan Lembaga Riset', 'lsm-yayasan': 'LSM dan Yayasan', donor: 'Lembaga Donor', asosiasi: 'Asosiasi', keuangan: 'Lembaga Keuangan', ormawa: 'Organisasi Mahasiswa', koperasi: 'Koperasi' };
export const KELOMPOK = { profesional: 'Profesional', praktisi: 'Praktisi', akademisi: 'Akademisi', 'tokoh-publik': 'Tokoh Publik', 'aktivis-tokoh-daerah': 'Aktivis dan Tokoh Daerah' };
const JENIS_LEMBAGA = { asosiasi: 'asosiasi', kementerian: 'kementerian-lembaga', lembaga: 'kementerian-lembaga', dpr: 'kementerian-lembaga', 'think-tank': 'think-tank', lsm: 'lsm-yayasan', universitas: 'perguruan-tinggi', donor: 'donor', pemda: 'pemda' };
function kategoriPerusahaan(p) {
  if (p.jenis === 'asing' && !/\b(bank|bpd)\b/i.test(p.nama)) return 'internasional'; // perusahaan asing (termasuk pengembang pembiaya seperti Marubeni) tetap internasional
  if (/\b(bank|bpd)\b/i.test(p.nama) || (p.peran_rantai || []).includes('pembiaya')) return 'keuangan';
  if (/\bBUMD\b|\bPDAM\b|Perusahaan Daerah|Perseroda/i.test(p.nama)) return 'bumd';
  return { bumn: 'bumn', asing: 'internasional' }[p.jenis] || 'swasta';
}
const kat = (kode) => ({ kode, label: KATEGORI[kode] });

const PROGRAM = {
  'plts-100gw': { nama: 'PLTS 100 GWp', ringkas: 'Percepatan PLTS 100 gigawatt-peak (rancangan Perpres dan proyek turunannya).', re: /100 gigawatt|plts 100|100 gwp/i },
  wte: { nama: 'Pengolahan sampah menjadi energi (WtE/PLTSa)', ringkas: 'Pembangkit listrik berbasis sampah di kota-kota prioritas.', re: /sampah|pltsa/i, pelaksana: [['l_43f00f6a72', 'pengarah dan investor'], ['p_0ed65b38b8', 'pelaksana (unit WtE Danantara)']] }, // sumber: Jakarta Post 2026-03-08 dan 2026-07-14
  b50: { nama: 'Biodiesel B50', ringkas: 'Mandatori campuran biodiesel 50 persen.', re: /biodiesel|\bb50\b|bahan bakar nabati/i },
  e20: { nama: 'Bioetanol E5-E20 dan SAF', ringkas: 'Mandatori campuran etanol pada bensin dan bioavtur.', re: /bioetanol|etanol|\be20\b|\be10\b/i },
  ruptl: { nama: 'RUPTL 2025-2034', ringkas: 'Rencana Usaha Penyediaan Tenaga Listrik PLN: daftar pembangkit terencana.', re: /ruptl|rencana usaha penyediaan tenaga listrik/i },
  psn: { nama: 'Proyek Strategis Nasional energi', ringkas: 'Proyek energi dalam daftar PSN.', re: /proyek strategis nasional/i },
  jetp: { nama: 'JETP Indonesia', ringkas: 'Kemitraan Transisi Energi yang Adil (Just Energy Transition Partnership).', re: /jetp|just energy|transisi energi yang berkeadilan/i },
};
const MW = new Set(['MW', 'MWp', 'MWP']);

// ---------- pembangunan ----------

// ---------- titik peta tiap organisasi (lokasi.lat/lng/presisi) ----------
// Urutan: koordinat asli (tepat) > pusat kab/kota ADM2 (kota) > pusat provinsi ADM1 (provinsi) > teks alamat/nama > lokasi kampus untuk ormawa.
// Pusat wilayah = geoBoundaries (ADM1 ODbL, ADM2 CC BY 3.0 IGO), berkas statis data/geo/pusat-wilayah.json. Titik tidak tepat digeser deterministik <= 0,08 derajat (hash id) agar logo tak menumpuk.
let PUSAT = null;
const pusatWilayah = () => PUSAT || (PUSAT = (() => { for (const f of [path.join(ROOT, 'data/geo/pusat-wilayah.json'), path.join(DP, 'proyek/raw/geo/pusat.json')]) if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8')); return { adm1: {}, adm2: [] }; })());
const ALIAS_PROV = { 'bangka belitung': 'Kepulauan Bangka Belitung', 'yogyakarta': 'DI Yogyakarta', 'jakarta': 'DKI Jakarta', 'dki jakarta': 'DKI Jakarta', 'nad': 'Aceh', 'nanggroe aceh darussalam': 'Aceh' };
const tanpaAksen = (s) => String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
export function provinsiDari(teks) {
  const t = tanpaAksen(teks); if (!t) return null;
  const adm1 = pusatWilayah().adm1;
  for (const k of Object.keys(adm1)) if (tanpaAksen(k) === t) return k;
  if (ALIAS_PROV[t]) return ALIAS_PROV[t];
  return null;
}
function cariKota(kota, provinsi) {
  const mentah = String(kota || '').trim(); if (!mentah) return null;
  const kurung = mentah.match(/\(([^)]*)\)/); const utama = mentah.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  if (/\(.*(arab|tiongkok|prancis|jepang|uea|kanada|amerika|jerman|inggris|belanda|korea|singapura|india|australia|malaysia|thailand)/i.test(mentah)) return null; // kota luar negeri
  const adm2 = pusatWilayah().adm2;
  for (const cand of [utama, kurung && kurung[1]].filter(Boolean)) {
    const n = normWilayah(cand); if (!n.nama) continue;
    let k = adm2.filter((x) => x.nama === n.nama);
    if (n.tipe) { const t = k.filter((x) => x.tipe === n.tipe); k = t.length ? t : k; }
    if (k.length > 1 && provinsi) { const t = k.filter((x) => x.provinsi === provinsi); if (t.length) k = t; }
    if (k.length > 1 && !n.tipe) { const t = k.filter((x) => x.tipe === 'kota'); if (t.length) k = t; } // "Malang" tanpa penanda: kota lebih mungkin kantor
    if (k.length === 1) return { lat: k[0].lat, lng: k[0].lng, provinsi: k[0].provinsi };
  }
  return null;
}
// logo induk untuk unit kampus tanpa logo sendiri (singkatan kampus -> id organisasi yang logonya sudah dipanen dari situs kampus)
const LOGO_KAMPUS = { ui: 'l_2c27d00604', itb: 'l_07dd603a7c' };
const KOTA_KAMPUS = { ugm: 'Kota Yogyakarta', unair: 'Kota Surabaya', its: 'Kota Surabaya', untirta: 'Kota Serang', undip: 'Kota Semarang', ui: 'Kota Depok', itb: 'Kota Bandung', ipb: 'Kota Bogor', unpad: 'Kabupaten Sumedang', unhas: 'Kota Makassar', usu: 'Kota Medan' };
const geser = (id, nilai) => { const h = crypto.createHash('sha1').update(String(id)).digest(); return [nilai[0] + ((h[0] / 255) * 2 - 1) * 0.08, nilai[1] + ((h[1] / 255) * 2 - 1) * 0.08]; };
export function titikLokasi(o, indukKampus) {
  const L = o.lokasi || {}; const adm1 = pusatWilayah().adm1;
  const lat = Number(L.lat), lng = Number(L.lng);
  if (L.lat != null && L.lng != null && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { ...L, lat, lng, presisi: 'tepat' };
  const prov = provinsiDari(L.provinsi);
  const kt = cariKota(L.kota, prov);
  let r = null;
  if (kt) r = { pt: [kt.lat, kt.lng], presisi: 'kota', provinsi: prov || kt.provinsi };
  else if (prov === 'DKI Jakarta' && cariKota('Jakarta Pusat')) { const j = cariKota('Jakarta Pusat'); r = { pt: [j.lat, j.lng], presisi: 'kota', provinsi: prov }; } // Jakarta: pusat Jakarta, bukan pusat poligon provinsi
  else if (prov && adm1[prov]) r = { pt: [adm1[prov].lat, adm1[prov].lng], presisi: 'provinsi', provinsi: prov };
  if (!r) { // teks alamat: nama kota/kabupaten eksplisit (terpanjang menang), lalu Jakarta/provinsi
    const teks = tanpaAksen([L.alamat, L.kota, o.nama].join(' '));
    const kt2 = /\bjakarta\b/.test(teks) ? cariKota('Jakarta Pusat') : pusatWilayah().adm2.filter((x) => x.nama.length >= 5 && !/^(barat|timur|utara|selatan|tengah)/.test(x.nama) && new RegExp('\\b' + x.nama + '\\b').test(teks)).sort((a, b) => b.nama.length - a.nama.length || (a.tipe === 'kota' ? -1 : 1))[0];
    if (kt2) r = { pt: [kt2.lat, kt2.lng], presisi: 'kota', provinsi: kt2.provinsi };
  }
  if (!r) {
    const teks = tanpaAksen([L.alamat, L.kota, o.nama].join(' '));
    const pv = /\bjakarta\b/.test(teks) ? 'DKI Jakarta' : Object.keys(adm1).filter((k) => k !== 'Papua' && k !== 'Papua Barat' && new RegExp('\\b' + tanpaAksen(k) + '\\b').test(teks)).sort((a, b) => b.length - a.length)[0];
    if (pv && adm1[pv]) r = { pt: [adm1[pv].lat, adm1[pv].lng], presisi: 'provinsi', provinsi: pv };
  }
  if (!r && o.kategori === 'ormawa') { // singkatan kampus dikenal -> kota kampus (ormawa tak punya alamat sendiri)
    const kata = new Set(tanpaAksen(o.nama).split(' ')); const kp = Object.keys(KOTA_KAMPUS).find((k) => kata.has(k));
    const k2 = kp && cariKota(KOTA_KAMPUS[kp]); if (k2) r = { pt: [k2.lat, k2.lng], presisi: 'kota', provinsi: k2.provinsi };
  }
  if (!r && indukKampus?.lokasi?.lat != null) return { ...L, lat: indukKampus.lokasi.lat, lng: indukKampus.lokasi.lng, presisi: indukKampus.lokasi.presisi === 'tepat' ? 'tepat' : indukKampus.lokasi.presisi, provinsi: L.provinsi || indukKampus.lokasi.provinsi };
  if (!r) return L;
  // alamat jelas = pin di pusat kota/kab dari alamat itu, tanpa sebaran acak (sebaran membuat Grha Pertamina jatuh di Jakarta Utara); peta menyebar pin tumpuk
  const [a, b] = L.alamat && r.presisi === 'kota' ? r.pt : geser(o.id, r.pt);
  return bersih({ ...L, provinsi: L.provinsi || r.provinsi, lat: +a.toFixed(5), lng: +b.toFixed(5), presisi: r.presisi });
}
// ormawa memakai lokasi kampus bila kampusnya (perguruan-tinggi) dikenal dari nama; selain itu jatuh ke aturan biasa
function kampusUntuk(o, kampus) {
  const n = norm(o.nama); let terbaik = null;
  for (const [kn, k] of kampus) if (kn.length > 5 && n.includes(kn) && (!terbaik || kn.length > terbaik[0].length)) terbaik = [kn, k];
  if (!terbaik) { const kata = new Set(n.split(' ')); for (const [kn, k] of kampus) if (k.singkatan && kata.has(k.singkatan.toLowerCase())) terbaik = [kn, k]; }
  return terbaik && terbaik[1];
}
export function bangun(masukan = {}) {
  const M = (k, rel) => masukan[k] || baca(rel);
  const tanggalMax = [];
  const catatTgl = (rows) => rows.forEach((r) => r.tanggal_ambil && tanggalMax.push(r.tanggal_ambil));

  // --- organisasi ---
  const org = new Map(); const alias = new Map(); const nmap = new Map();
  const tambahOrg = (o) => {
    if (o.nama) o.nama = judulHuruf(String(o.nama).replace(/^ANGGOTA\s+(UTAMA|BIASA|LUAR\s+BIASA)\s*:\s*/i, '').trim()); // nama baku: tanpa awalan, tanpa KAPITAL PENUH
    const k = norm(o.nama); const ada = nmap.get(k);
    if (ada) { alias.set(o.id, ada.id); for (const f of ['internasional', 'proyek_ekstra', 'singkatan', 'induk', 'situs', 'tahun_berdiri', 'kode_saham', 'dasar_hukum', 'lokasi', 'kontak_mentah', 'via1001']) if (!ada[f] && o[f]) ada[f] = o[f]; ada.kepakaran = unik([...(ada.kepakaran || []), ...(o.kepakaran || [])]); ada.peran_rantai = unik([...(ada.peran_rantai || []), ...(o.peran_rantai || [])]); ada.sumber.push(...o.sumber); if (o.keuangan) ada.keuangan = [...(ada.keuangan || []), ...o.keuangan]; ada.teknis = { ...(o.teknis || {}), ...(ada.teknis || {}) }; ada.extra = { ...(o.extra || {}), ...(ada.extra || {}) }; return; }
    org.set(o.id, o); nmap.set(k, o); alias.set(o.id, o.id);
  };
  const sumberOrg = (arr) => (arr || []).map((s) => ({ id: s.id, jenis: s.jenis, url: s.url || null, keterangan: s.keterangan || s.judul || null, tingkat_bukti: s.tingkat_bukti, tanggal: s.tanggal_periksa || s.tanggal_ambil }));
  const lembaga = M('lembaga', 'lembaga/lembaga.jsonl'); catatTgl(lembaga);
  for (const l of lembaga) tambahOrg({ id: l.lembaga_id, nama: l.nama, singkatan: l.singkatan, kategori: JENIS_LEMBAGA[l.jenis] || 'kementerian-lembaga', induk: l.induk, kepakaran: l.kepakaran || [], peran_rantai: [], situs: l.situs, tahun_berdiri: l.tahun_berdiri, dasar_hukum: l.dasar_hukum, lokasi: bersih({ alamat: l.kontak?.alamat_kantor, kota: l.kontak?.kota, provinsi: l.kontak?.provinsi, lat: l.kontak?.lat, lng: l.kontak?.lng }), kontak_mentah: l.kontak || {}, sumber: sumberOrg(l.sumber), extra: { pengurus_status: l.pengurus_status, verifikasi: l.verifikasi } });
  { // asosiasi tambahan terkurasi dengan sumber resmi (data/direktori/asosiasi_tambahan.json)
    const ft = path.join(ROOT, 'data/direktori/asosiasi_tambahan.json');
    if (!masukan.perusahaan && fs.existsSync(ft)) for (const b of JSON.parse(fs.readFileSync(ft, 'utf8')).baris || []) if (adaUrl(b.sumber_url)) tambahOrg({ id: b.id, nama: b.nama, singkatan: b.singkatan, kategori: b.kategori, kepakaran: b.kepakaran || [], peran_rantai: [], situs: b.situs, sumber: [{ id: 'situs-resmi', jenis: 'situs-resmi', url: b.sumber_url, keterangan: 'situs resmi asosiasi', tingkat_bukti: b.tingkat_bukti, tanggal: b.tanggal }] });
  }
  const perusahaan = M('perusahaan', 'perusahaan/perusahaan.jsonl'); catatTgl(perusahaan);
  for (const p of perusahaan) tambahOrg({ id: p.perusahaan_id, nama: p.nama, nama_lain: p.nama_lain, kategori: kategoriPerusahaan(p), induk: p.induk, kepakaran: p.kepakaran || [], peran_rantai: p.peran_rantai || [], situs: p.situs, tahun_berdiri: p.tahun_berdiri, kode_saham: p.kode_saham, lokasi: bersih({ alamat: p.kontak?.alamat_kantor, kota: p.kantor_pusat?.kota || p.kontak?.kota, provinsi: p.kantor_pusat?.provinsi || p.kontak?.provinsi, lat: p.kontak?.lat, lng: p.kontak?.lng }), teknis: bersih({ kapasitas_mwp_tahun: p.kapasitas_mwp_tahun, pasar: p.pasar, apamsi: p.apamsi, tkdn: p.tkdn, bmp: p.bmp, kapasitas_portofolio: p.kapasitas_portofolio }), kontak_mentah: p.kontak || {}, sumber: sumberOrg(p.sumber), asosiasi: p.anggota_asosiasi || [], extra: { pengurus_status: p.pengurus_status, verifikasi: p.verifikasi, situs_keyakinan: p.situs_keyakinan, situs_catatan: p.situs_catatan, kandidat: p.kandidat } });
  // pemilik proyek yang belum ada di direktori (scripts/pipa/org_pemilik.mjs bangun); tiap baris punya sumber berurl
  for (const p of (masukan.perusahaan ? [] : M('pemilik_proyek', 'perusahaan/tambahan_pemilik.jsonl'))) { catatTgl([p]); tambahOrg({ id: p.perusahaan_id, nama: p.nama, nama_lain: p.nama_lain, kategori: kategoriPerusahaan(p), kepakaran: p.kepakaran || [], peran_rantai: p.peran_rantai || [], sumber: sumberOrg(p.sumber), extra: {} }); }
  // entitas internasional (scripts/pipa/data_internasional.mjs bangun): hanya yang punya sumber berurl; negara/subjenis/afiliasi/proyek dibawa ke baris publik
  for (const p of (masukan.perusahaan && !masukan.internasional ? [] : M('internasional', 'perusahaan/internasional.jsonl'))) { catatTgl([p]); tambahOrg({ id: p.perusahaan_id, nama: p.nama, nama_lain: p.nama_lain, singkatan: (p.nama_lain || [])[0], kategori: 'internasional', induk: p.induk, kepakaran: p.kepakaran || [], peran_rantai: p.peran_rantai || [], situs: p.situs, lokasi: bersih({ kota: p.kantor_pusat?.kota }), internasional: p.internasional, proyek_ekstra: p.proyek_ids || [], sumber: sumberOrg(p.sumber), extra: {} }); }
  // 1001startup.id (R13/D15): hanya nama, sektor, lokasi, relasi, sumber primer + atribusi; tanpa deskripsi/EST/skor/pegawai/valuasi/pendiri
  const slugOrg = new Map();
  for (const p of M('p1001', '1001/perusahaan.jsonl')) {
    const id = 'su_' + hash(p.slug); slugOrg.set(p.slug, id); tanggalMax.push(p.tanggal_ambil);
    tambahOrg({ id, nama: p.nama, nama_lain: p.nama_hukum ? [p.nama_hukum.replace(/\s*\(.*$/, '')] : [], kategori: { bumn: 'bumn', bumd: 'bumd' }[p.jenis_entitas] || 'swasta', kepakaran: [], peran_rantai: [], situs: adaUrl(p.situs_resmi) ? p.situs_resmi : null, tahun_berdiri: p.tahun_berdiri, lokasi: bersih({ kota: p.kantor?.kota, alamat: p.kantor?.kecamatan }), sumber: (p.sumber_url || []).filter((u) => adaUrl(u) && !/1001startup\.id/.test(u)).map((u) => ({ id: 'via-1001', jenis: 'sumber-primer-via-1001', url: u, tingkat_bukti: 'via-pihak-ketiga', tanggal: p.tanggal_ambil })), via1001: bersih({ sub: p.jenis_entitas, sektor: p.sektor, atribusi: `via 1001startup.id, diambil ${p.tanggal_ambil}` }), extra: {} });
  }
  const relasiMentah = M('i1001', '1001/ikatan.jsonl').filter((i) => adaUrl(i.sumber_url) && !/1001startup\.id/.test(i.sumber_url) && slugOrg.has(i.dari_slug));
  // sertifikat TKDN Kemenperin
  const tk = new Map();
  for (const t of M('tkdn', 'perusahaan/tambahan_tkdn.jsonl')) {
    if (!adaUrl(t.sumber_url)) continue; const k = norm(t.perusahaan);
    const g = tk.get(k) || tk.set(k, { nama: t.perusahaan, lokasi: t.lokasi, provinsi: t.provinsi, kep: new Set(), certs: [], urls: new Set(), tgl: t.tanggal }).get(k);
    (t.kepakaran_usulan || []).forEach((x) => g.kep.add(x)); g.urls.add(t.sumber_url);
    g.certs.push(bersih({ produk: t.produk, merk: t.merk, tipe: t.tipe, kelompok_barang: t.kelompok_barang === '—' ? null : t.kelompok_barang, tkdn_persen: t.tkdn_persen, bmp_persen: t.bmp_persen, diterbitkan: t.diterbitkan, berlaku_sd: t.berlaku_sd, sumber_url: t.sumber_url }));
  }
  for (const [k, g] of tk) tambahOrg({ id: 'tk_' + hash(k), nama: g.nama, kategori: 'swasta', kepakaran: [...g.kep], peran_rantai: ['manufaktur'], lokasi: bersih({ kota: g.lokasi, provinsi: g.provinsi }), teknis: { sertifikat_tkdn: g.certs }, sumber: [...g.urls].map((u) => ({ id: 'tkdn', jenis: 'sertifikat-tkdn', url: u, tingkat_bukti: 'resmi', tanggal: g.tgl })), extra: {} });
  // IDX: keuangan per emiten
  const idxRows = M('idx', 'keuangan/idx.jsonl').filter((x) => adaUrl(x.sumber_url)); const idxPer = new Map();
  for (const x of idxRows) (idxPer.get(x.kode) || idxPer.set(x.kode, []).get(x.kode)).push(x);
  for (const [kode, rows] of idxPer) tambahOrg({ id: 'ix_' + kode.toLowerCase(), nama: rows[0].perusahaan, kategori: 'swasta', kode_saham: kode, kepakaran: [], peran_rantai: [], sumber: unik(rows.map((r) => r.sumber_url)).map((u) => ({ id: 'idx', jenis: 'keuangan-emiten', url: u, tingkat_bukti: rows.find((r) => r.sumber_url === u).tingkat_bukti, tanggal: rows[0].tanggal })), keuangan: rows.map((r) => bersih({ tahun: r.tahun, metrik: r.metrik, nilai: r.nilai, satuan: r.satuan, pembanding_2023: r.pembanding_2023, sumber_url: r.sumber_url, tingkat_bukti: r.tingkat_bukti, tanggal: r.tanggal })), extra: {} });
  for (const k of M('koperasi', 'akar/koperasi.jsonl')) tambahOrg({ id: k.entitas_id, nama: k.nama, kategori: 'koperasi', kepakaran: k.jenis_ebt ? [k.jenis_ebt] : [], peran_rantai: [], lokasi: bersih({ kota: k.kabupaten, provinsi: k.provinsi, alamat: [k.desa, k.kecamatan].filter(Boolean).join(', ') }), teknis: bersih({ kapasitas_teks: k.kapasitas, jenis_koperasi: k.jenis_koperasi, status_teks: k.status, mitra: k.mitra, catatan: k.catatan }), sumber: [{ id: 'akar', url: k.sumber_url, tingkat_bukti: k.tingkat_bukti, tanggal: k.tanggal_sumber || k.tanggal_ambil }], extra: {} });
  const ormawaPengurus = new Map();
  for (const o of M('ormawa', 'akar/organisasi_mahasiswa.jsonl')) { tambahOrg({ id: o.entitas_id, nama: o.nama, kategori: 'ormawa', kepakaran: [], peran_rantai: [], lokasi: bersih({ provinsi: null }), teknis: bersih({ tingkat: o.tingkat, program: o.program }), sumber: [{ id: 'akar', url: o.sumber_url, tingkat_bukti: o.tingkat_bukti, tanggal: o.tanggal_sumber || o.tanggal_ambil }], extra: {} }); ormawaPengurus.set(o.entitas_id, o.pengurus || []); }
  // keanggotaan METI (arsip) -> lapis anggota; yang tak cocok jadi organisasi baru tanpa URL (ditahan)
  const anggotaMeti = new Map();
  for (const a of M('anggota_organisasi', 'arsip-meti/anggota_organisasi.jsonl')) {
    let o = nmap.get(norm(a.nama_organisasi));
    if (!o) { o = { id: 'am_' + hash(norm(a.nama_organisasi)), nama: a.nama_organisasi, kategori: /universitas|institut|politeknik/i.test(a.nama_organisasi) ? 'perguruan-tinggi' : 'swasta', kepakaran: [], peran_rantai: [], lokasi: bersih({ provinsi: a.provinsi }), sumber: [], extra: {} }; tambahOrg(o); }
    anggotaMeti.set(o.id, { jenis_keanggotaan: a.jenis_keanggotaan, sektor: a.sektor, sumber_berkas: a.sumber_berkas });
  }
  const anggotaLengkap = masukan.anggota_lengkap || baca('arsip-meti/anggota_lengkap.jsonl');
  const bersihPrefiks = (n) => String(n || '').replace(/^ANGGOTA\s+\w+\s*:\s*/i, '').trim();
  for (const a of anggotaLengkap) if (a.status === 'aktif' && ['perusahaan', 'organisasi', 'koperasi', 'utama'].includes(a.jenis) && /^ANGGOTA/i.test(a.nama || '')) { const o = nmap.get(norm(bersihPrefiks(a.nama))); if (o && !anggotaMeti.has(o.id)) anggotaMeti.set(o.id, { dari: 'anggota_lengkap' }); }
  for (const [dup, tujuan] of Object.entries(GABUNG_ORG)) { // duplikat nama gabungan -> organisasi baku; nama dup jadi nama_lain
    const d = org.get(dup), t = org.get(tujuan); if (!d || !t || d === t) continue;
    t.nama_lain = unik([...(t.nama_lain || []), d.nama]); t.sumber.push(...d.sumber); t.kepakaran = unik([...(t.kepakaran || []), ...(d.kepakaran || [])]); t.peran_rantai = unik([...(t.peran_rantai || []), ...(d.peran_rantai || [])]);
    org.delete(dup); nmap.set(norm(d.nama), t); for (const [k, v] of alias) if (v === dup) alias.set(k, tujuan); alias.set(dup, tujuan);
  }
  const idOrg = (id) => alias.get(id) || null;
  // keanggotaan antar-organisasi
  const keanggotaan = new Map(); const tambahKeang = (dari, ke, jenis) => { if (!dari || !ke || dari === ke) return; const l = keanggotaan.get(dari) || keanggotaan.set(dari, []).get(dari); if (!l.some((x) => x.organisasi_id === ke && x.jenis === jenis)) l.push({ organisasi_id: ke, jenis }); };
  for (const k of M('keanggotaan', 'lembaga/keanggotaan.jsonl')) tambahKeang(idOrg(k.dari), idOrg(k.ke), k.jenis);
  for (const o of org.values()) for (const a of o.internasional?.afiliasi || []) tambahKeang(idOrg(a.organisasi_id), o.id, 'bagian_dari');
  const singk = new Map(); for (const o of org.values()) if (o.singkatan) singk.set(o.singkatan.toUpperCase(), o.id);
  for (const o of [...org.values()]) for (const s of o.asosiasi || []) tambahKeang(o.id, singk.get(String(s).toUpperCase()), 'anggota_dari');

  // --- orang ---
  const orang = new Map(); const dapatOrang = (id, nama) => orang.get(id) || orang.set(id, { id, nama, jabatan: [], kepakaran: [], sumber_urls: [] }).get(id);
  for (const o of M('orang', 'orang/orang.jsonl')) { const r = dapatOrang(o.orang_id, o.nama); Object.assign(r, { jenis: o.jenis, status: o.status, jabatan_terkini: o.jabatan_terkini, organisasi_terkini: o.organisasi_terkini, kepakaran: o.kepakaran || [], jalur: o.jalur, pernah_birokrasi: o.pernah_birokrasi, sumber_url: o.sumber_url, tanggal: o.tanggal_ambil }); r.sumber_urls.push(o.sumber_url); }
  const jabKey = (j) => norm(j.organisasi) + '|' + norm(j.jabatan);
  for (const rj of M('rekam', 'orang/rekam_jejak.jsonl')) {
    const r = dapatOrang(rj.orang_id, rj.nama);
    Object.assign(r, { nama: rj.nama, gelar: rj.gelar, alias: rj.alias, jenis: r.jenis || rj.jenis, jabatan_terkini: rj.jabatan_terkini || r.jabatan_terkini, organisasi_terkini: rj.organisasi_terkini || r.organisasi_terkini, pendidikan: rj.pendidikan, kiprah: rj.kiprah, foto_rekam: rj.foto, akademik: rj.akademik, tautan: rj.tautan, wikidata_id: rj.wikidata_id, sumber_riwayat: rj.sumber_riwayat, ekstraksi: rj.ekstraksi, tanggal: r.tanggal || rj.diperiksa });
    for (const j of rj.riwayat || []) { r.jabatan.push({ organisasi: j.organisasi, jabatan: j.jabatan, mulai: j.mulai, selesai: j.selesai, kini: j.kini, sumber_url: j.sumber_url }); r.sumber_urls.push(j.sumber_url); }
    (rj.tautan || []).forEach((t) => r.sumber_urls.push(t.sumber_url));
  }
  // profil publik pengurus METI (pengurus_panen.mjs): fakta profesional bersumber; pendidikan + ringkasan ikut lapis publik hanya untuk mereka
  for (const pp of M('pprof', 'orang/pengurus_profil.jsonl')) {
    const r = dapatOrang(pp.id, pp.nama); r.pengurus_profil = true; r.nama = r.nama || pp.nama; r.ringkasan = pp.ringkasan;
    if (!r.jabatan_terkini && pp.jabatan_terkini) { r.jabatan_terkini = pp.jabatan_terkini; r.organisasi_terkini = pp.organisasi_terkini; }
    if (!(r.kepakaran || []).length && (pp.kepakaran || []).length) r.kepakaran = pp.kepakaran;
    for (const j of pp.rekam_jejak || []) if (!r.jabatan.some((x) => jabKey(x) === jabKey(j))) r.jabatan.push({ organisasi: j.organisasi, jabatan: j.jabatan, mulai: j.mulai, selesai: j.selesai, kini: !j.selesai && norm(j.jabatan) === norm(pp.jabatan_meti) || (!j.selesai && norm(j.jabatan) === norm(pp.jabatan_terkini)), sumber_url: j.sumber_url });
    const pend = r.pendidikan || []; for (const e of pp.pendidikan || []) if (!pend.some((x) => norm(x.institusi) === norm(e.institusi))) pend.push({ jenjang: e.jenjang, bidang: e.bidang, institusi: e.institusi, lulus: e.tahun, sumber_url: e.sumber_url }); r.pendidikan = pend;
    r.tautan = r.tautan || []; for (const t of pp.tautan_publik || []) if (!r.tautan.some((x) => x.url === t.url)) r.tautan.push({ jenis: t.jenis, url: t.url, sumber_url: t.url });
    for (const s of pp.sumber || []) r.sumber_urls.push(s.url); r.sumber_url = r.sumber_url || pp.sumber?.[0]?.url; r.tanggal = r.tanggal || pp.sumber?.[0]?.tanggal;
  }
  for (const j of M('jabatan', 'orang/jabatan.jsonl')) { const r = dapatOrang(j.orang_id); if (!r.nama) continue; if (!r.jabatan.some((x) => jabKey(x) === jabKey(j))) r.jabatan.push({ organisasi: j.organisasi, jabatan: j.jabatan, mulai: j.mulai, selesai: j.selesai, kini: j.status === 'menjabat', sumber_url: j.sumber_url }); r.sumber_urls.push(j.sumber_url); }
  for (const t of M('tokoh', 'akar/tokoh.jsonl')) { const r = dapatOrang(t.orang_id, t.nama); Object.assign(r, { jenis: 'tokoh-daerah', jabatan_terkini: t.peran, organisasi_terkini: t.organisasi, kepakaran: t.kepakaran || [], wilayah_tokoh: t.wilayah, kelompok: t.kelompok, sumber_url: t.sumber_url, tanggal: t.tanggal_ambil, kiprah: (t.capaian || []).map((c) => ({ teks: c, sumber_url: t.sumber_url })) }); r.sumber_urls.push(t.sumber_url); }
  const ketuaBaru = new Set(), dprIds = new Set();
  for (let d of M('dpr', 'orang/tambahan_dpr.jsonl')) { // Komisi XII DPR: menimpa guidebook lama (Ketua kini Bambang Patijaya)
    if (!orang.has(d.orang_id)) { const kn = norm(d.nama.replace(/,.*$/, '')).split(' ').slice(0, 2).join(' '); const lama = [...orang.values()].find((x) => x.jenis === 'anggota-dpr' && norm(x.nama).split(' ').slice(0, 2).join(' ') === kn); if (lama) d = { ...d, orang_id: lama.id }; } // id baru = orang lama bernama sama (gelar beda)
    const r = dapatOrang(d.orang_id, d.nama); dprIds.add(d.orang_id); if (/^Ketua /.test(d.jabatan)) ketuaBaru.add(d.orang_id);
    Object.assign(r, { nama: d.nama, gelar: d.gelar || r.gelar, jenis: 'anggota-dpr', status: d.status, jabatan_terkini: d.jabatan, organisasi_terkini: d.organisasi, dpr: bersih({ komisi: 'XII', fraksi: d.fraksi, dapil: d.dapil }), sumber_url: d.sumber_url, tanggal: d.tanggal_ambil });
    r.jabatan = r.jabatan.filter((j) => !/Komisi XII/i.test(j.organisasi || '')); r.jabatan.push({ organisasi: d.organisasi, jabatan: d.jabatan, mulai: d.mulai, selesai: d.selesai, kini: !d.selesai, sumber_url: d.sumber_url }); r.sumber_urls.push(d.sumber_url);
  }
  for (const r of orang.values()) if (r.jabatan_terkini === 'Ketua Komisi XII' && !ketuaBaru.has(r.id)) { r.jabatan_terkini = dprIds.has(r.id) ? r.jabatan_terkini : 'Mantan Ketua Komisi XII'; if (!dprIds.has(r.id)) r.status = 'mantan'; }
  for (const t of M('rotasi', 'orang/tambahan_rotasi.jsonl')) {
    if (t.publik === false) continue; const r = dapatOrang(t.orang_id, t.nama); if (!r.nama) r.nama = t.nama; r.jenis = r.jenis || t.jenis;
    if (!r.jabatan.some((x) => jabKey(x) === norm(t.organisasi) + '|' + norm(t.jabatan) && x.mulai === t.mulai)) r.jabatan.push({ organisasi: t.organisasi, jabatan: t.jabatan, mulai: t.mulai, selesai: t.selesai, kini: t.status === 'menjabat', sumber_url: t.sumber_url, catatan: t.catatan });
    if (t.status === 'menjabat') { r.jabatan_terkini = t.jabatan; r.organisasi_terkini = t.organisasi; r.status = 'menjabat'; } else if (norm(r.jabatan_terkini) === norm(t.jabatan) && norm(r.organisasi_terkini) === norm(t.organisasi)) r.status = 'mantan';
    r.sumber_urls.push(t.sumber_url); r.sumber_url = r.sumber_url || t.sumber_url; r.tanggal = r.tanggal || t.tanggal_ambil;
  }
  for (const f of M('foto_t', 'orang/foto_tambahan.jsonl')) { const r = orang.get(f.orang_id); const lokal = 'orang/' + f.foto_file; if (r && fs.existsSync(path.join(DP, lokal))) r.foto_tambahan = { lokal, sumber_url: f.sumber_url, hak_cipta: f.hak }; }
  // pengurus organisasi (3 sumber) -> keanggotaan jabatan + daftar pengurus per org
  // foto wajah pengurus: public/img/orang/<orang_id>.webp (panen_pengurus.mjs --foto), atau foto pengurus METI di public/img/pengurus/<nama>-b.webp (pencocokan nama)
  const fotoPengurus = (id, nama) => { const sl = norm(nama).replace(/ /g, '-'); for (const [rel, f] of [['/img/orang/' + id + '.webp', 'public/img/orang/' + id + '.webp'], ['/img/pengurus/' + sl + '-b.webp', 'public/img/pengurus/' + sl + '-b.webp']]) if (fs.existsSync(path.join(ROOT, f))) return rel; return undefined; };
  const pengOrg = new Map(); const foto = []; const tambahPengurus = (orgId, p) => { const l = pengOrg.get(orgId) || pengOrg.set(orgId, []).get(orgId); if (!l.some((x) => x.orang_id === p.orang_id && x.jabatan === p.jabatan)) l.push(p); };
  const pengurusRows = [];
  for (const p of M('p_pengurus', 'perusahaan/pengurus.jsonl')) pengurusRows.push({ org: p.perusahaan_id, orang_id: p.orang_id, nama: p.nama, jabatan: p.jabatan, jenis_jabatan: p.jenis_jabatan, mulai: p.mulai, sumber_url: p.sumber_url, fotoLokal: p.foto_berkas && 'perusahaan/' + p.foto_berkas, fotoSumber: p.foto_sumber || p.sumber_url, hak: p.hak_cipta });
  for (const p of M('l_pengurus', 'lembaga/pengurus.jsonl')) pengurusRows.push({ org: p.lembaga_id, orang_id: p.orang_id, nama: p.nama, jabatan: p.jabatan, mulai: p.periode?.mulai, selesai: p.periode?.selesai, sumber_url: p.sumber_url });
  const meti = [...org.values()].find((o) => o.singkatan === 'METI' && o.kategori === 'asosiasi');
  for (const p of M('meti', 'lembaga/pengurus-meti.jsonl')) pengurusRows.push({ org: meti?.id, orang_id: p.orang_id, nama: p.nama, jabatan: p.jabatan, jenis_jabatan: p.kelompok, mulai: p.periode && String(p.periode).split(/[–-]/)[0], sumber_url: p.sumber_url, fotoLokal: p.foto_file && 'lembaga/' + p.foto_file, fotoSumber: p.foto_sumber || p.sumber_url });
  for (const p of pengurusRows) {
    const oid = idOrg(p.org); if (!oid || !p.nama) continue;
    p.orang_id = p.orang_id || 'pm_' + hash(norm(p.nama));
    const r = dapatOrang(p.orang_id, p.nama); if (!r.nama) r.nama = p.nama;
    const on = org.get(oid).nama; if (!r.jabatan.some((x) => jabKey(x) === norm(on) + '|' + norm(p.jabatan))) r.jabatan.push({ organisasi: on, organisasi_id: oid, jabatan: p.jabatan, mulai: p.mulai, selesai: p.selesai, kini: !p.selesai, sumber_url: p.sumber_url });
    if (!r.jabatan_terkini) { r.jabatan_terkini = p.jabatan; r.organisasi_terkini = on; }
    if (!r.jenis) r.jenis = 'asosiasi';
    r.sumber_urls.push(p.sumber_url); r.sumber_url = r.sumber_url || p.sumber_url; r.tanggal = r.tanggal || '2026-11-07';
    tambahPengurus(oid, { orang_id: p.orang_id, nama: pisahNama(p.nama).nama, jabatan: p.jabatan, jenis_jabatan: p.jenis_jabatan, mulai: p.mulai, selesai: p.selesai, sumber_url: p.sumber_url, foto: fotoPengurus(p.orang_id, p.nama) });
    if (p.fotoLokal && fs.existsSync(path.join(DP, p.fotoLokal))) r.foto_pengurus = { lokal: p.fotoLokal, sumber_url: p.fotoSumber, hak_cipta: p.hak };
  }
  const nmapAll = new Map(); const petaNama = () => { nmapAll.clear(); for (const o of org.values()) { nmapAll.set(norm(o.nama), o.id); (o.nama_lain || []).concat(ALIAS_ORG[o.id] || []).forEach((n) => nmapAll.set(norm(n), o.id)); if (o.singkatan) nmapAll.set(norm(o.singkatan), o.id); } }; petaNama();
  const orgPerNama = (n) => nmapAll.get(norm(n)) || null;
  const kodeMax3 = (k) => (k || []).slice(0, 3).map((x) => (typeof x === 'string' ? { kode: x } : { kode: x.kode, utama: x.utama, bukti: x.bukti, sumber_url: x.sumber_url }));

  // --- regulasi ---
  const regRows = M('regulasi', 'regulasi/regulasi.jsonl'); catatTgl(regRows);
  const regById = new Map(regRows.map((r) => [r.id, r]));
  const ikatan = new Map(), diikat = new Map();
  for (const k of M('ikatan_regulasi', 'regulasi/ikatan_regulasi.jsonl')) { if (!regById.has(k.dari) || !regById.has(k.ke)) continue; (ikatan.get(k.dari) || ikatan.set(k.dari, []).get(k.dari)).push({ ke: k.ke, jenis: k.jenis }); (diikat.get(k.ke) || diikat.set(k.ke, []).get(k.ke)).push({ dari: k.dari, jenis: k.jenis }); }
  const progReg = {};
  for (const [pid, p] of Object.entries(PROGRAM)) progReg[pid] = regRows.filter((r) => r.status !== 'dicabut' && r.jenis !== 'perda' && p.re.test(r.judul + ' ' + r.nomor)).sort((a, b) => (b.tahun || 9999) - (a.tahun || 9999)).slice(0, 8).map((r) => r.id);

  // --- proyek ---
  const sumberProyek = new Map(M('sumber_proyek', 'proyek/sumber.jsonl').map((s) => [s.id, s]));
  const kelas = (id) => { const s = sumberProyek.get(id); if (!s) return 'publik'; if (s.publik === false) return 'tutup'; return /jangan terbitkan|confidential/i.test(s.lisensi || '') || s.jenis === 'materi-konferensi' ? 'internal' : 'publik'; };
  const KOL_PUBLIK = ['kapasitas', 'status', 'cod_target', 'cod_aktual', 'nilai_investasi', 'pemilik', 'epc', 'pembeli'];
  const KOL_ANGGOTA = ['skema_kerjasama', 'tanggal_ppa', 'financial_close', 'pemberi_dana', 'pihak_terlibat', 'tenaga_kerja'];
  const KOL_PENGURUS = ['catatan'];
  const bagiNilai = (arr, k) => (arr || []).filter((v) => kelas(v.sumber_id) === k);
  const konflik = M('konflik', 'proyek/konflik.jsonl'); const konflikPer = new Map();
  for (const k of konflik) (konflikPer.get(k.proyek_id) || konflikPer.set(k.proyek_id, []).get(k.proyek_id)).push(k);
  const proyekRows = M('proyek', 'proyek/proyek.jsonl'); catatTgl(proyekRows);
  const proyekPub = [], proyekAng = [], proyekPen = []; let proyekBuang = 0;
  const sumberPub = (ids) => unik(ids).filter((i) => kelas(i) === 'publik' && sumberProyek.has(i)).map((i) => { const s = sumberProyek.get(i); const lokal = !adaUrl(s.url); return bersih({ id: s.id, jenis: s.jenis, url: lokal ? null : s.url, dokumen: lokal ? String(s.url).replace(/^internal:/, '').split('/').pop() : null, halaman: lokal ? s.halaman : null, tingkat_bukti: s.tingkat_bukti, tanggal: s.tanggal_ambil, lisensi: s.lisensi, atribusi: s.atribusi }); });
  for (const p of proyekRows) {
    if (p.publik === false) { proyekBuang++; continue; }
    const namaPub = bagiNilai(p.nama, 'publik'), namaInt = bagiNilai(p.nama, 'internal');
    if (p.nama_perlu_tinjau === true) { const n = (namaPub[0] || namaInt[0] || {}).nilai; const d = bersih({ id: p.id, baru: true, ditahan: 'nama-perlu-tinjau', perlu_tinjau: true, nama: n, teknologi: p.teknologi }); proyekAng.push(d); proyekPen.push(d); continue; }
    if (!namaPub.length && !namaInt.length) { proyekBuang++; continue; }
    const semuaId = unik([...(p.sumber_ids || []), ...[...KOL_PUBLIK, ...KOL_ANGGOTA, ...KOL_PENGURUS].flatMap((k) => (p[k] || []).map((v) => v.sumber_id)), p.sumber_lokasi && null]);
    const sumber = sumberPub(semuaId);
    const dariMateri = {}; for (const k of [...KOL_PUBLIK, ...KOL_ANGGOTA, 'nama']) { const v = bagiNilai(p[k], 'internal'); if (v.length) dariMateri[k] = v; }
    const delta = {};
    if (!namaPub.length || !sumber.length) { // ditahan dari publik
      proyekAng.push(bersih({ id: p.id, baru: true, ditahan: !namaPub.length ? 'hanya-materi-internal' : 'tanpa-sumber-url', nama: (namaPub[0] || namaInt[0]).nilai, teknologi: p.teknologi, dari_materi: dariMateri })); continue;
    }
    const pihak = {}; for (const k of ['pemilik', 'epc', 'pembeli']) { const v = bagiNilai(p[k], 'publik').map((x) => bersih({ nilai: x.nilai, organisasi_id: orgPerNama(x.nilai), catatan: x.catatan, sumber_id: x.sumber_id })); if (v.length) pihak[k] = v; }
    const prog = unik([...(p.programs || []), p.program, ...(sumber.some((s) => s.jenis === 'ruptl') ? ['ruptl'] : []), ...(p.teknologi === 'biomassa-sampah' && /sampah|pltsa|waste|wte/i.test(namaPub[0].nilai) ? ['wte'] : [])]).sort();
    const lok = p.sumber_lokasi;
    proyekPub.push(bersih({ id: p.id, nama: judulHuruf(namaPub[0].nilai), nama_lain: unik(namaPub.slice(1).map((x) => x.nilai)), teknologi: p.teknologi, program_ids: prog, lokasi: bersih({ provinsi: p.provinsi, kabupaten_kota: p.kabupaten_kota, lat: p.lat, lng: p.lng, presisi: p.presisi_lokasi, sumber: lok && bersih({ jenis: lok.jenis, url: lok.url, lisensi: lok.lisensi, catatan: lok.catatan }) }), kapasitas: bagiNilai(p.kapasitas, 'publik'), status: bagiNilai(p.status, 'publik'), cod_target: bagiNilai(p.cod_target, 'publik'), cod_aktual: bagiNilai(p.cod_aktual, 'publik'), nilai_investasi: bagiNilai(p.nilai_investasi, 'publik'), pihak, regulasi_ids: unik(prog.flatMap((x) => progReg[x] || [])), tingkat_bukti: p.tingkat_bukti, asal: p.asal, kandidat: p.kandidat ? true : undefined, sumber }));
    for (const [lap, kol] of [[proyekAng, KOL_ANGGOTA], [proyekPen, KOL_PENGURUS]]) { const d = { id: p.id }; for (const k of kol) { const v = bagiNilai(p[k], 'publik'); if (v.length) d[k] = v; } if (lap === proyekAng && Object.keys(dariMateri).length) d.dari_materi = dariMateri; if (lap === proyekPen && konflikPer.has(p.id)) d.konflik = konflikPer.get(p.id).map((k) => bersih({ jenis: k.jenis, nama: k.nama, kapasitas_a: k.kapasitas_a, kapasitas_b: k.kapasitas_b, sumber_id: k.sumber_id })); if (Object.keys(d).length > 1) lap.push(d); }
    void delta;
  }
  // tambahan: Bank Dunia (pembiayaan) dan WKP/JICA
  const ket = (v) => (v == null ? [] : [{ nilai: v }]);
  for (const w of M('wb', 'proyek/tambahan_worldbank.jsonl')) {
    if (w.publik === false || !adaUrl(w.sumber_url)) continue; tanggalMax.push(w.tanggal_ambil);
    proyekPub.push(bersih({ id: w.id, nama: judulHuruf(w.nama), teknologi: w.teknologi, asal: 'worldbank', lokasi: bersih({ provinsi: w.provinsi }), status: [{ nilai: w.status, status_asli: w.status_asli }], nilai_investasi: w.nilai_komitmen_usd != null ? [{ nilai: w.nilai_komitmen_usd, satuan: 'USD', catatan: ('komitmen ' + (w.instrumen || '')).trim() }] : [], pihak: bersih({ peminjam: w.peminjam ? [{ nilai: w.peminjam, organisasi_id: orgPerNama(w.peminjam) }] : [], pelaksana: w.lembaga_pelaksana ? [{ nilai: w.lembaga_pelaksana, organisasi_id: orgPerNama(w.lembaga_pelaksana) }] : [] }), waktu: bersih({ persetujuan: w.tanggal_persetujuan, penutupan: w.tanggal_penutupan }), tingkat_bukti: w.tingkat_bukti, sumber: [bersih({ id: 'wb', jenis: w.sumber_jenis, url: w.sumber_url, tingkat_bukti: w.tingkat_bukti, tanggal: w.tanggal_ambil, lisensi: w.lisensi })] }));
    proyekAng.push(bersih({ id: w.id, pemberi_dana: ket(w.pemberi_dana) }));
  }
  for (const w of M('wkp', 'proyek/tambahan_wkp_jica.jsonl')) {
    if (w.publik === false || !adaUrl(w.sumber_url)) continue; tanggalMax.push(w.tanggal_ambil);
    proyekPub.push(bersih({ id: w.id, nama: judulHuruf(w.nama), teknologi: w.teknologi, asal: w.jenis_wilayah ? 'wkp' : 'jica', lokasi: bersih({ provinsi: w.provinsi }), kapasitas: w.kapasitas ? [w.kapasitas] : [], status: [{ nilai: w.status, status_asli: w.status_asli }], nilai_investasi: w.nilai_komitmen_yen_juta != null ? [{ nilai: w.nilai_komitmen_yen_juta, satuan: 'JPY juta', catatan: w.bunga }] : [], pihak: bersih({ pemilik: w.pemenang ? [{ nilai: w.pemenang, organisasi_id: orgPerNama(w.pemenang) }] : [], pelaksana: w.instansi_pelaksana && !/tidak disebut/.test(w.instansi_pelaksana) ? [{ nilai: w.instansi_pelaksana }] : [] }), waktu: bersih({ persetujuan: w.tanggal_persetujuan }), tingkat_bukti: w.tingkat_bukti, sumber: [w.sumber_url, ...(w.sumber_pendukung || [])].filter(adaUrl).map((u, i) => bersih({ id: 'wkp' + i, jenis: i ? 'pendukung' : 'utama', url: u, tingkat_bukti: w.tingkat_bukti, tanggal: w.tanggal_ambil })) }));
    proyekAng.push(bersih({ id: w.id, pemberi_dana: ket(w.pemberi_dana), pihak_terlibat: ket(w.catatan) }));
  }
  const pubProyekIds = new Set(proyekPub.map((p) => p.id));

  // --- berita ---
  const beritaRows = M('berita', 'berita/berita.jsonl'); catatTgl(beritaRows);
  // situs resmi (panen_situs.mjs): hanya mengisi yang kosong; kurasi/panen lama menang. Tingkat bukti situs-sendiri.
  for (const x of M('situs', 'situs/situs.jsonl')) {
    const o = org.get(alias.get(x.id) || x.id); if (!o || x.galat || !adaUrl(x.sumber_url)) continue; catatTgl([x]);
    if (!o.situs) o.situs = x.situs;
    if (!o.tahun_berdiri && x.tahun_berdiri) o.tahun_berdiri = x.tahun_berdiri;
    const L = o.lokasi || {};
    if (!L.alamat && x.alamat) o.lokasi = { ...L, alamat: x.alamat, ...(L.lat == null && x.lat != null ? { lat: x.lat, lng: x.lng } : {}) };
    else if (L.lat == null && x.lat != null && L.alamat) o.lokasi = { ...L, lat: x.lat, lng: x.lng };
    const km = o.kontak_mentah || {}; if (!(km.telepon || []).length && !(km.surel || []).length && (x.telepon || x.surel)) o.kontak_mentah = bersih({ ...km, telepon: x.telepon, surel: x.surel });
    if (x.deskripsi) o.deskripsi = x.deskripsi;
    if (x.bidang?.length && !(o.kepakaran || []).length) o.kepakaran = x.bidang.slice(0, 3);
    o.sumber.push({ id: 'situs-resmi', jenis: 'situs-resmi', url: x.sumber_url, keterangan: 'situs resmi lembaga (alamat, kontak, profil)', tingkat_bukti: 'situs-sendiri', tanggal: x.tanggal_ambil });
  }
  const orgPub = new Set(); // diisi setelah penentuan ditahan
  // organisasi: tentukan publik vs ditahan (D5: butuh sumber URL)
  const hitung = (o) => { // kontak korporat generik vs internal
    const k = o.kontak_mentah || {}; const pub = { telepon: [], surel: [] }, intr = { telepon: [], surel: [] };
    for (const t of k.telepon || []) { if (/123-456-7890/.test(t)) continue; (ponselIndonesia(t) ? intr : pub).telepon.push(t); }
    for (const e of k.surel || []) { if (PLACEHOLDER.test(e)) continue; (suratKorporat(e) ? pub : intr).surel.push(e); }
    return { pub: bersih(pub), intr: bersih(intr) };
  };
  const orgPubRows = [], orgAng = [], orgPen = [];
  const indukKampus = new Map(); // ormawa -> id kampus induk (logo dipinjam bila ormawa tak punya logo sendiri)
  { // kantor pusat hasil panen (data/direktori/lokasi_org.json): hanya mengisi organisasi yang provinsinya belum terbaca
    const fl = path.join(ROOT, 'data/direktori/lokasi_org.json');
    if (fs.existsSync(fl)) for (const [id, h] of Object.entries(JSON.parse(fs.readFileSync(fl, 'utf8')).baris || {})) {
      const o = org.get(alias.get(id) || id); if (!o || provinsiDari(o.lokasi?.provinsi)) continue;
      o.lokasi = bersih({ ...(o.lokasi || {}), kota: h.kota, provinsi: h.provinsi, alamat: h.alamat, sumber_url: h.sumber_url, tingkat_bukti: h.tingkat_bukti });
    }
  }
  { // alamat kantor yang diperiksa dari situs resmi (data/direktori/alamat_org.json) menimpa alamat hasil ekstraksi yang salah; koordinat lama dibuang agar dihitung ulang dari alamat
    const fa = path.join(ROOT, 'data/direktori/alamat_org.json');
    if (fs.existsSync(fa)) for (const [id, h] of Object.entries(JSON.parse(fs.readFileSync(fa, 'utf8')).baris || {})) {
      const o = org.get(alias.get(id) || id); if (!o) continue;
      const { lat, lng, presisi, ...sisa } = o.lokasi || {};
      o.lokasi = bersih({ ...sisa, alamat: h.alamat, kota: h.kota || sisa.kota, provinsi: h.provinsi || sisa.provinsi, sumber_url: h.sumber_url, tingkat_bukti: h.tingkat_bukti });
    }
  }
  { // sumber URL resmi yang diperiksa manusia/skrip (data/direktori/sumber_org.json): membuka organisasi yang tertahan tanpa-sumber-url
    const fs_ = path.join(ROOT, 'data/direktori/sumber_org.json');
    if (fs.existsSync(fs_)) for (const [id, h] of Object.entries(JSON.parse(fs.readFileSync(fs_, 'utf8')).baris || {})) {
      const o = org.get(alias.get(id) || id); if (!o || !adaUrl(h.url) || o.sumber.some((s) => s.url === h.url)) continue;
      o.sumber.push({ id: 'situs-resmi', jenis: 'situs-resmi', url: h.url, keterangan: 'situs resmi lembaga (diperiksa ' + h.tanggal + ')', tingkat_bukti: h.tingkat_bukti || 'situs-sendiri', tanggal: h.tanggal });
    }
  }
  { // titik peta: kampus dulu (ormawa meminjam), lalu sisanya
    for (const o of org.values()) if (o.kategori === 'perguruan-tinggi') o.lokasi = titikLokasi(o);
    const kampus = new Map([...org.values()].filter((o) => o.kategori === 'perguruan-tinggi' && o.lokasi?.lat != null).map((o) => [norm(o.nama), o]));
    for (const o of org.values()) if (o.kategori !== 'perguruan-tinggi') { const k = o.kategori === 'ormawa' ? kampusUntuk(o, kampus) : null; o.lokasi = titikLokasi(o, k); if (k) indukKampus.set(o.id, k.id); }
  }
  for (const o of [...org.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const url = o.sumber.some((s) => adaUrl(s.url)) || (o.kategori === 'koperasi' || o.kategori === 'ormawa') && o.sumber.some((s) => adaUrl(s.url));
    const ang = bersih({ id: o.id, meti: anggotaMeti.has(o.id) ? 'anggota' : null, pengurus_foto: [], pengurus_ormawa: ormawaPengurus.get(o.id) });
    const kk = hitung(o);
    const pen = bersih({ id: o.id, kontak_internal: kk.intr, catatan_kurator: bersih({ ...(o.extra || {}), verifikasi: o.extra?.verifikasi }), keanggotaan_meti: anggotaMeti.get(o.id) });
    if (!url) { orgPen.push(bersih({ ...pen, baru: true, ditahan: 'tanpa-sumber-url', nama: o.nama, kategori: kat(o.kategori), lokasi: o.lokasi })); if (ang.meti) orgAng.push(bersih({ id: o.id, baru: true, nama: o.nama, meti: ang.meti })); continue; }
    orgPub.add(o.id);
    orgPubRows.push({ o, kk, ang, pen });
  }
  petaNama(); for (const id of [...nmapAll.keys()]) if (!orgPub.has(nmapAll.get(id))) nmapAll.delete(id); // tautan hanya ke organisasi publik
  for (const p of proyekPub) if (p.pihak) { for (const l of Object.values(p.pihak)) for (const v of l) if (v.organisasi_id && !orgPub.has(v.organisasi_id)) delete v.organisasi_id; }
  const relasiPer = new Map();
  for (const i of relasiMentah) { const dari = idOrg(slugOrg.get(i.dari_slug)); if (!dari || !orgPub.has(dari)) continue; const ke = (slugOrg.has(i.ke_slug) && idOrg(slugOrg.get(i.ke_slug))) || orgPerNama(i.ke_nama); (relasiPer.get(dari) || relasiPer.set(dari, []).get(dari)).push(bersih({ arah: i.arah, jenis: i.jenis, nama: i.ke_nama, organisasi_id: ke && orgPub.has(ke) ? ke : null, persen_kepemilikan: i.persen_kepemilikan, besaran_teknis: i.besaran_teknis, label_bukti: i.label_bukti, sumber_url: i.sumber_url, tanggal_dokumen: i.tanggal_dokumen })); }
  // pasang tautan berita
  const regPola = /\b(uu|pp|perpres|permen|permen esdm|kepmen|perppu|inpres)\s*(?:no\.?|nomor)?\s*(\d{1,3})\s*(?:\/|tahun|th\.?)\s*(\d{4})/gi;
  const namaProyek = proyekPub.map((p) => ({ id: p.id, n: ' ' + norm(p.nama) + ' ' })).filter((x) => x.n.length >= 16);
  const orgKey = [...org.values()].filter((o) => orgPub.has(o.id)).flatMap((o) => (ALIAS_ORG[o.id] || []).map((a) => ({ id: o.id, n: ' ' + norm(a) + ' ', s: null }))).concat([...org.values()].filter((o) => orgPub.has(o.id)).map((o) => ({ id: o.id, n: norm(o.nama).length >= 8 ? ' ' + norm(o.nama) + ' ' : null, s: o.singkatan && o.singkatan.length >= 3 ? new RegExp('(?<![A-Za-z])' + o.singkatan.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z])') : null })));
  // ringkasan berita (og:description/RSS) hanya untuk mencocokkan wilayah/proyek/regulasi; dibaca dari data-panen, tidak pernah ditulis ke public
  const ringkasBerita = masukan.ringkasBerita || (() => { try { return JSON.parse(fs.readFileSync(path.join(DP, 'berita/ringkas.json'), 'utf8')); } catch { return {}; } })();
  const konteksBerita = bangunKonteks({ proyek: proyekPub, regulasi: regRows });
  const beritaPub = [], beritaPen = []; const revB = { organisasi: new Map(), proyek: new Map(), regulasi: new Map(), orang: new Map() };
  const orangIds = new Set(orang.keys());
  const idxOrang = bangunOrang([...orang.values()]);
  const idxLembaga = bangunLembaga([...org.values()].filter((o) => orgPub.has(o.id)).map((o) => ({ ...o, nama_lain: [].concat(o.nama_lain || [], ALIAS_ORG[o.id] || []) })));
  for (const b of beritaRows.sort((x, y) => (x.id < y.id ? -1 : 1))) {
    const nj = ' ' + norm(b.judul) + ' ';
    const o_ids = unik(lembagaDari(b.judul, idxLembaga));
    const kaya = perkaya(b.judul, ringkasBerita[b.id], konteksBerita);
    const p_ids = unik([...namaProyek.filter((k) => nj.includes(k.n)).map((k) => k.id), ...kaya.proyek_ids]);
    const r_ids = unik([...[...b.judul.matchAll(regPola)].map((m) => `${m[1].toLowerCase().split(' ')[0]}-${m[2]}-${m[3]}`).filter((id) => regById.has(id)), ...kaya.regulasi_ids]);
    const ent = b.entitas_disebut || []; const pasti = unik([...ent.filter((e) => e.jenis !== 'kandidat-rujukan' && orangIds.has(e.orang_id)).map((e) => e.orang_id), ...orangDari(b.judul, idxOrang)]); const kand = unik(ent.filter((e) => e.jenis === 'kandidat-rujukan' && orangIds.has(e.orang_id)).map((e) => e.orang_id));
    beritaPub.push(bersih({ id: b.id, judul: b.judul, url: b.url, media: b.media, terbit: b.terbit, bahasa: b.bahasa, kepakaran: b.kepakaran, organisasi_ids: o_ids, proyek_ids: p_ids, regulasi_ids: r_ids, orang_ids: pasti, wilayah: kaya.wilayah, sumber_panen: b.sumber_panen, tanggal_ambil: b.tanggal_ambil }));
    if (kand.length) beritaPen.push({ id: b.id, orang_kandidat_ids: kand });
    for (const [k, ids] of [['organisasi', o_ids], ['proyek', p_ids], ['regulasi', r_ids], ['orang', pasti]]) for (const i of ids) (revB[k].get(i) || revB[k].set(i, []).get(i)).push(b);
  }
  // video: resmi/media; kreator hanya bila judulnya menaut organisasi/proyek/regulasi
  const videoPub = []; const videoKreator = []; let videoBuang = 0;
  for (const v of M('video', 'video/video.jsonl').sort((x, y) => (x.video_id < y.video_id ? -1 : 1))) {
    if (!adaUrl(v.url)) continue; const nj = ' ' + norm(v.judul) + ' ';
    const o_ids = unik(orgKey.filter((k) => (k.n && nj.includes(k.n)) || (k.s && k.s.test(v.judul))).map((k) => k.id)); const p_ids = namaProyek.filter((k) => nj.includes(k.n)).map((k) => k.id);
    const r_ids = unik([...v.judul.matchAll(regPola)].map((m) => `${m[1].toLowerCase().split(' ')[0]}-${m[2]}-${m[3]}`).filter((id) => regById.has(id)));
    if (v.jenis === 'kreator' && !o_ids.length && !p_ids.length && !r_ids.length) { videoBuang++; continue; }
    videoPub.push(bersih({ id: v.video_id, judul: v.judul, kanal: v.kanal, jenis: v.jenis, terbit: v.terbit, url: v.url, durasi_detik: v.durasi_detik, tonton: v.tonton, suka: v.suka, komen: v.komen, organisasi_ids: o_ids, proyek_ids: p_ids, regulasi_ids: r_ids, tanggal_ambil: v.tanggal_ambil }));
  }
  // karbon: Climate TRACE (via-pihak-ketiga, CC BY 4.0) + IDXCarbon bulanan
  const GENERIK = new Set(['power', 'station', 'plant', 'pembangkit', 'listrik', 'tenaga', 'pltu', 'plta', 'pltp', 'plts', 'pltmh', 'pltm', 'pltg', 'pltgu', 'pltd', 'pltb', 'plt', 'pln', 'unit', 'geothermal', 'hydro', 'solar', 'wind', 'the', 'of', 'mill', 'ii', 'iii', 'iv']);
  const tok = (n) => new Set(norm(n).split(' ').filter((t) => t && !GENERIK.has(t) && !/^\d+$/.test(t)));
  const jarak = (a, b, c, d) => { const R = 6371, rad = Math.PI / 180, dl = (c - a) * rad, dn = (d - b) * rad; const x = Math.sin(dl / 2) ** 2 + Math.cos(a * rad) * Math.cos(c * rad) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
  const proyekTok = proyekPub.map((p) => ({ p, t: tok(p.nama) })).filter((x) => x.t.size);
  const karbonPub = []; const karbonPer = new Map();
  for (const c of M('ct', 'karbon/climatetrace.jsonl').sort((x, y) => (x.id < y.id ? -1 : 1))) {
    if (!adaUrl(c.sumber_url)) continue; const ct = tok(c.nama); const cocok = [];
    if (ct.size) for (const { p, t } of proyekTok) { const irisan = [...ct].filter((x) => t.has(x)).length; if (!irisan || irisan / (ct.size + t.size - irisan) < 0.5) continue; const pr = p.lokasi?.presisi; if ((pr === 'kabupaten' || pr === 'titik_persis') && p.lokasi.lat != null && c.lat != null && jarak(c.lat, c.lon, p.lokasi.lat, p.lokasi.lng) > 150) continue; cocok.push(p.id); }
    const pemilikIds = unik((c.pemilik || []).map(orgPerNama).filter((i) => i && orgPub.has(i)));
    for (const i of cocok) (karbonPer.get(i) || karbonPer.set(i, []).get(i)).push(c.id);
    karbonPub.push(bersih({ kelompok: 'pembangkit', id: c.id, nama: c.nama, jenis_aset: c.jenis_aset, kapasitas_mw: c.kapasitas_mw, aktivitas_mwh: c.aktivitas_mwh, emisi_tco2e: c.emisi_tco2e, faktor_emisi_tco2e_per_mwh: c.faktor_emisi_tco2e_per_mwh != null ? Math.round(c.faktor_emisi_tco2e_per_mwh * 1000) / 1000 : null, tahun: c.tahun, pemilik: c.pemilik, organisasi_ids: pemilikIds, proyek_ids: cocok, lat: c.lat, lng: c.lon, sumber: c.sumber, sumber_url: c.sumber_url, lisensi: c.lisensi, tingkat_bukti: c.tingkat_bukti, tanggal: c.tanggal_periksa, catatan: c.catatan }));
  }
  for (const p of proyekPub) if (karbonPer.has(p.id)) p.karbon_ids = karbonPer.get(p.id);
  for (const k of M('idxc', 'karbon/idxcarbon.jsonl').sort((x, y) => (x.id < y.id ? -1 : 1))) if (adaUrl(k.sumber_url)) karbonPub.push(bersih({ kelompok: 'bursa_karbon', ...k, tanggal: k.tanggal_periksa, tanggal_periksa: undefined }));
  // keuangan: tarif, BPP, green finance, JETP, IDX, celah perizinan
  const keuanganPub = []; let keuanganTolak = 0;
  for (const [kel, rel] of [['tarif', 'keuangan/tarif.jsonl'], ['bpp', 'keuangan/bpp.jsonl'], ['green_finance', 'keuangan/green_finance.jsonl'], ['jetp', 'keuangan/jetp.jsonl'], ['idx', 'keuangan/idx.jsonl'], ['celah', 'perusahaan/tambahan_iuptl.jsonl']]) for (const x of M('k_' + kel, rel)) { if (!adaUrl(x.sumber_url)) { keuanganTolak++; continue; } keuanganPub.push(bersih({ kelompok: kel, ...x, ...(kel === 'idx' ? { organisasi_id: (() => { const o = idOrg('ix_' + String(x.kode).toLowerCase()); return o && orgPub.has(o) ? o : null; })() } : {}) })); }
  const bbn = M('bubbn', 'perusahaan/tambahan_bubbn.jsonl').filter((x) => adaUrl(x.sumber_url)).map(bersih);
  const bTerbaru = (k, id) => (revB[k].get(id) || []).sort((a, b) => (b.terbit || '') < (a.terbit || '') ? -1 : 1).slice(0, 10).map((b) => b.id);
  for (const p of proyekPub) { const b = bTerbaru('proyek', p.id); if (b.length) p.berita_ids = b; }

  // --- organisasi publik ---
  const organisasi = { publik: [], anggota: orgAng, pengurus: orgPen };
  const proyekPerOrg = new Map(); for (const p of proyekPub) for (const k of ['pemilik', 'epc', 'pembeli']) for (const v of p.pihak?.[k] || []) if (v.organisasi_id) { const s = proyekPerOrg.get(v.organisasi_id) || proyekPerOrg.set(v.organisasi_id, new Set()).get(v.organisasi_id); s.add(p.id); }
  { // tautan organisasi-proyek turunan (scripts/pipa/tautan_proyek_org.mjs); dasar tiap tautan ada di berkasnya
    const ft = path.join(ROOT, 'data/direktori/tautan_proyek_org.json');
    if (fs.existsSync(ft)) for (const [oid, l] of Object.entries(JSON.parse(fs.readFileSync(ft, 'utf8')).baris || {})) for (const e of l) if (proyekPub.some((p) => p.id === e.proyek_id)) { const s = proyekPerOrg.get(oid) || proyekPerOrg.set(oid, new Set()).get(oid); s.add(e.proyek_id); }
  }
  for (const { o, kk, ang, pen } of orgPubRows) {
    const peng = (pengOrg.get(o.id) || []).filter((x) => true).map((x) => bersih({ ...x }));
    const ke = (keanggotaan.get(o.id) || []).filter((x) => orgPub.has(x.organisasi_id));
    const anggotaPub = []; for (const [dari, l] of keanggotaan) if (orgPub.has(dari)) for (const x of l) if (x.organisasi_id === o.id) anggotaPub.push({ organisasi_id: dari, jenis: 'anggota' });
    organisasi.publik.push(bersih({ id: o.id, nama: o.nama, singkatan: o.singkatan, nama_lain: o.nama_lain, kategori: kat(o.kategori), induk: o.induk, kepakaran: (o.kepakaran || []).slice(0, 3), peran_rantai: o.peran_rantai, lokasi: o.lokasi, situs: o.situs, tahun_berdiri: o.tahun_berdiri, deskripsi: o.deskripsi, kode_saham: o.kode_saham, dasar_hukum: o.dasar_hukum, teknis: o.teknis, via_1001: o.via1001, relasi: relasiPer.get(o.id), keuangan: o.keuangan, kontak: kk.pub, keanggotaan: ke, anggota: anggotaPub, pengurus: peng, internasional: o.internasional, proyek_ids: unik([...(proyekPerOrg.get(o.id) || []), ...(o.proyek_ekstra || []).filter((x) => proyekPub.some((p) => p.id === x))]).sort(), berita_ids: bTerbaru('organisasi', o.id), sumber: o.sumber.filter((s) => adaUrl(s.url)).map(bersih), diperiksa: o.sumber.map((s) => s.tanggal).filter(Boolean).sort().pop() }));
    const a = { ...ang }; // foto pengurus ke lapis anggota
    const fotos = []; for (const x of pengOrg.get(o.id) || []) { const r = orang.get(x.orang_id); if (r?.foto_pengurus) fotos.push(bersih({ orang_id: x.orang_id, berkas: null, jabatan: x.jabatan, jabatan_sumber_url: x.sumber_url, sumber_url: r.foto_pengurus.sumber_url, hak_cipta: r.foto_pengurus.hak_cipta })); }
    if (fotos.length) a.pengurus_foto = fotos; else delete a.pengurus_foto;
    if (Object.keys(a).length > 1) orgAng.push(a);
    if (Object.keys(pen).length > 1) orgPen.push(pen);
  }
  const orgPubSet = new Set(organisasi.publik.map((o) => o.id));
  { // profil lengkap hasil scripts/panen/profil_org.mjs (data/direktori/profil_org.json) + ringkasan disusun dari fakta (tanpa menyalin teks sumber)
    const fp = path.join(ROOT, 'data/direktori/profil_org.json'); const PO = fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, 'utf8')).baris || {} : {};
    const projById = new Map(proyekPub.map((p) => [p.id, p])); let anggotaPeta;
    const fw = path.join(ROOT, 'data/direktori/wikidata_org.json'); const WD = fs.existsSync(fw) ? JSON.parse(fs.readFileSync(fw, 'utf8')).baris || {} : {}; // Wikidata CC0: butir terpisah, tidak menimpa
    const ft = path.join(ROOT, 'public/data/tkdn.json'); const tkdnPer = new Map();
    if (fs.existsSync(ft)) for (const t of JSON.parse(fs.readFileSync(ft, 'utf8')).baris || []) if (t.produsen_org_id && adaUrl(t.sumber_url)) (tkdnPer.get(t.produsen_org_id) || tkdnPer.set(t.produsen_org_id, []).get(t.produsen_org_id)).push({ produk: t.produk, tkdn_persen: t.tkdn_persen, berlaku_sampai: t.berlaku_sampai, sumber_url: t.sumber_url });
    const namaUsaha = (n) => { const t = String(n).replace(/\s+(Work|Phone|Email|Website|Mobile)$/i, '').replace(/^PT\.\s*/i, 'PT ').trim(); return /^PT\s+\S+/i.test(t) && t.length < 80 ? judulHuruf(t) : null; };
    for (const o of organisasi.publik) {
      if (!o.kategori?.kode || ['pemda', 'koperasi', 'ormawa'].includes(o.kategori.kode)) continue;
      const s = PO[o.id] || {}; const pr = (o.proyek_ids || []).map((i) => projById.get(i)).filter(Boolean);
      const wil = unik(pr.map((p) => p.lokasi?.provinsi)).sort(); const tahun = o.tahun_berdiri || s.tahun_berdiri?.nilai || WD[o.id]?.tahun_berdiri;
      const bid = unik((o.kepakaran || []).map((k) => String(k).replace(/-/g, ' '))); const peran = unik(o.peran_rantai || []);
      const kalimat = [`${o.nama} adalah ${o.kategori.kode === 'bumn' ? 'badan usaha milik negara' : o.kategori.kode === 'internasional' ? 'perusahaan internasional yang beroperasi di Indonesia' : o.kategori.kode === 'keuangan' ? 'lembaga keuangan' : o.kategori.kode === 'swasta' ? 'perusahaan swasta' : String(o.kategori.label || 'lembaga').toLowerCase()}${o.lokasi?.kota ? ` berkantor pusat di ${o.lokasi.kota}` : ''}${tahun ? `, berdiri sejak ${tahun}` : ''}.`];
      if (bid.length || peran.length) kalimat.push(`Tercatat di direktori ini pada bidang ${bid.join(', ') || 'energi'}${peran.length ? ` dengan peran ${peran.join(', ')}` : ''}.`);
      if (pr.length) kalimat.push(`Terhubung dengan ${pr.length} proyek${wil.length ? ` di ${wil.length} provinsi` : ''}.`);
      if (o.kode_saham) kalimat.push(`Saham tercatat di bursa dengan kode ${o.kode_saham}.`);
      if (s.net_zero) kalimat.push(`Menyebut target net zero ${s.net_zero.tahun} di situs resminya.`);
      const orgNorm = anggotaPeta ||= new Map(organisasi.publik.map((x) => [norm(x.nama), x.id]));
      const faAs = path.join(ROOT, 'data/direktori/anggota_asosiasi.json'); const nmAs = o.nama.includes('Produsen Listrik Swasta') && fs.existsSync(faAs) ? JSON.parse(fs.readFileSync(faAs, 'utf8')).baris?.aplsi : null;
      const angDaftar = unik([...(nmAs?.anggota || []), ...(s.anggota_disebut || []).map(namaUsaha)]).slice(0, 120).map((n) => bersih({ nama: n, organisasi_id: orgNorm.get(norm(n)) !== o.id ? orgNorm.get(norm(n)) : undefined }));
      const angSumber = nmAs ? nmAs.sumber_url : s.halaman?.anggota;
      const wd = WD[o.id]; const wdData = wd ? bersih({ url: wd.url, tanggal_periksa: wd.tanggal_periksa, induk: (wd.induk || []).map((x) => x.nama), anak_usaha: (wd.anak_usaha || []).map((x) => x.nama) }) : undefined;
      const profil = bersih({ anggota: angDaftar.length ? { daftar: angDaftar, sumber_url: angSumber, ...(nmAs ? { tanggal_baca: nmAs.tanggal_baca } : {}) } : undefined, ringkasan: kalimat.join(' '), tahun_berdiri: s.tahun_berdiri || (wd?.tahun_berdiri ? { nilai: Number(String(wd.tahun_berdiri).slice(0, 4)), sumber_url: wd.url } : undefined), wikidata: wdData, visi: s.visi, misi: s.misi, alamat_situs: s.alamat, afiliasi: s.afiliasi, kapasitas: s.kapasitas, net_zero: s.net_zero, sertifikasi: s.sertifikasi, tkdn: tkdnPer.get(o.id), asosiasi: s.asosiasi, karyawan: s.karyawan, sosmed: s.sosmed, halaman: s.halaman, wilayah_operasi: wil, wikidata: WD[o.id], logo_url: s.logo_url, sumber: s.sumber, tanggal_periksa: s.tanggal_periksa });
      if (!o.tahun_berdiri && s.tahun_berdiri) o.tahun_berdiri = s.tahun_berdiri.nilai; else if (!o.tahun_berdiri && WD[o.id]?.tahun_berdiri) o.tahun_berdiri = WD[o.id].tahun_berdiri; { const w = WD[o.id]; if (w && !o.situs && w.situs) o.situs = w.situs; const kt = w?.kantor_pusat?.[0]?.nama; if (kt && !o.lokasi?.kota) o.lokasi = { ...(o.lokasi || {}), kota: kt }; }
      if (s.kontak && !(o.kontak?.telepon || []).length && !(o.kontak?.surel || []).length) o.kontak = bersih({ telepon: s.kontak.telepon, surel: s.kontak.surel });
      o.profil = profil;
    }
  }

  // --- orang publik ---
  const fotoPeta = {}; const fotoKey = new Map(); const orangOut = { publik: [], anggota: [], pengurus: [] };
  const katOrg = new Map([...org.values()].map((o) => [o.id, o.kategori]));
  const kelompokDari = (r) => {
    if (r.kelompok === 'think-tank-peneliti') return 'akademisi'; // pemilik 7 Nov 2026: think tank = organisasi, orangnya masuk Akademisi dan pakar
    if (r.kelompok && KELOMPOK[r.kelompok]) return r.kelompok;
    const oid = r.organisasi_terkini && orgPerNama(r.organisasi_terkini);
    if (oid && katOrg.get(oid) === 'think-tank') return 'akademisi';
    return { akademisi: 'akademisi', 'pejabat-publik': 'tokoh-publik', 'anggota-dpr': 'tokoh-publik', direksi: 'praktisi', komisaris: 'praktisi', 'direksi-komisaris-bumn': 'praktisi', 'tokoh-daerah': 'aktivis-tokoh-daerah' }[r.jenis] || 'profesional';
  };
  for (const r of orang.values()) if (r.nama) { const p = pisahNama(r.nama, r.gelar); r.nama = p.nama; r.gelar = p.gelar; }
  const orangList = [...orang.values()].filter((r) => r.nama).sort((a, b) => (a.id < b.id ? -1 : 1));
  const tinjau = new Map(); for (const t of M('tinjau', 'orang/perlu-tinjau-rekam.jsonl')) (tinjau.get(t.orang_id) || tinjau.set(t.orang_id, []).get(t.orang_id)).push(t.alasan);
  const orgNamaSemua = new Map(); for (const o of org.values()) orgNamaSemua.set(norm(o.nama), o.id);
  // status METI (hanya label): pengurus (pengurus-meti) > anggota (nama persis ke baris aktif; ambigu tidak ditandai)
  const metiPengurus = new Set(M('meti', 'lembaga/pengurus-meti.jsonl').filter((p) => p.nama).map((p) => p.orang_id || 'pm_' + hash(norm(p.nama))));
  const anggotaNama = new Map(); for (const a of anggotaLengkap) if (a.status === 'aktif' && ['individu', 'utama'].includes(a.jenis) && !/^ANGGOTA/i.test(a.nama || '') && a.nama) { const k = norm(pisahNama(a.nama).nama); (anggotaNama.get(k) || anggotaNama.set(k, new Set()).get(k)).add(norm(a.instansi || '')); }
  // afiliasi kerja anggota (instansi + jabatan dari daftar keanggotaan) -> lapis ANGGOTA saja, hanya bila nama unik di direktori dan satu instansi
  const rosterNama = new Map(); for (const a of anggotaLengkap) if (a.status === 'aktif' && ['individu', 'utama'].includes(a.jenis) && !/^ANGGOTA/i.test(a.nama || '') && a.nama && a.instansi) { const k = norm(pisahNama(a.nama).nama); if (!rosterNama.has(k)) rosterNama.set(k, a); }
  const bersihInstansi = (s) => { const m = String(s).trim().match(/^(.*?),\s*(PT|CV|UD)\.?$/i); return (m ? m[2].toUpperCase() + ' ' + m[1] : String(s)).replace(/\s+/g, ' ').trim(); };
  const jmlNama = new Map(); for (const r of orangList) jmlNama.set(norm(r.nama), (jmlNama.get(norm(r.nama)) || 0) + 1);
  const afilSk = new Map(); for (const a of M('afilSk', 'arsip-meti/afiliasi_sk.jsonl')) if (a.nama) afilSk.set(norm(pisahNama(a.nama).nama), a);
  const perluTinjauMeti = []; const metiOrang = new Map();
  for (const r of orangList) {
    if (metiPengurus.has(r.id)) { metiOrang.set(r.id, 'pengurus'); continue; }
    const k = norm(r.nama), inst = anggotaNama.get(k); if (!inst) continue;
    if (jmlNama.get(k) > 1 || inst.size > 1) perluTinjauMeti.push({ orang_id: r.id, nama: r.nama, alasan: jmlNama.get(k) > 1 ? 'nama sama dengan ' + (jmlNama.get(k) - 1) + ' orang lain di direktori; cocok anggota METI tidak ditandai' : 'nama sama pada ' + inst.size + ' baris anggota METI berinstansi beda; tidak ditandai' }); else metiOrang.set(r.id, 'anggota');
  }
  const tinjauMeti = new Map(perluTinjauMeti.map((t) => [t.orang_id, t.alasan]));
  // lingkup wilayah (provinsi/kabupaten saja, tidak pernah alamat rumah): tokoh = 2 bagian terakhir wilayahnya; lainnya menurut lokasi organisasi daerah
  const KAT_DAERAH = new Set(['pemda', 'bumd', 'koperasi', 'ormawa', 'lsm-yayasan']);
  const wilayahDari = (r, oid) => {
    if (r.wilayah_tokoh) { const b = String(r.wilayah_tokoh).split(',').map((x) => x.trim()).filter(Boolean); return bersih({ lingkup: 'daerah', label: b.slice(-2).join(', '), provinsi: b.at(-1), lengkap: r.wilayah_tokoh }); }
    const o = oid && org.get(oid), prov = o?.lokasi?.provinsi;
    return prov && KAT_DAERAH.has(katOrg.get(oid)) ? { lingkup: 'daerah', label: prov, provinsi: prov } : { lingkup: 'nasional', label: 'Nasional' };
  };
  const fotoLokal = (r) => { const sl = norm(r.nama).replace(/ /g, '-'); return ['/img/orang/' + r.id + '.webp', '/img/pengurus/' + sl + '-b.webp'].find((u) => fs.existsSync(path.join(ROOT, 'public', u))); }; // foto sudah di-crop wajah (foto_wajah.mjs)
  for (const r of orangList) {
    const ada = unik(r.sumber_urls).some(adaUrl) || adaUrl(r.sumber_url);
    const kel = kelompokDari(r);
    const fotoBerkas = r.foto_tambahan && !r.foto_rekam?.berkas ? { lokal: r.foto_tambahan.lokal, sumber_url: r.foto_tambahan.sumber_url, lisensi: r.foto_tambahan.hak_cipta } : r.foto_rekam?.berkas && fs.existsSync(path.join(DP, 'orang/foto', r.foto_rekam.berkas)) ? { lokal: 'orang/foto/' + r.foto_rekam.berkas, sumber_url: r.foto_rekam.sumber_url, lisensi: r.foto_rekam.lisensi, pengarang: r.foto_rekam.pengarang } : r.foto_pengurus ? { lokal: r.foto_pengurus.lokal, sumber_url: r.foto_pengurus.sumber_url, lisensi: r.foto_pengurus.hak_cipta } : null;
    let fotoOut = null; if (fotoBerkas) { const key = 'foto/' + r.id + path.extname(fotoBerkas.lokal); fotoPeta[key] = fotoBerkas.lokal; fotoKey.set(r.id, key); fotoOut = bersih({ berkas: key, sumber_url: fotoBerkas.sumber_url, lisensi: fotoBerkas.lisensi, pengarang: fotoBerkas.pengarang }); }
    const pen = bersih({ id: r.id, alias: r.alias, sumber_riwayat: r.sumber_riwayat, ekstraksi: r.ekstraksi, perlu_tinjau: [...(tinjau.get(r.id) || []), ...(tinjauMeti.has(r.id) ? [tinjauMeti.get(r.id)] : [])], berita_kandidat_ids: unik(beritaPen.filter((b) => b.orang_kandidat_ids.includes(r.id)).map((b) => b.id)) });
    if (!ada) { orangOut.pengurus.push(bersih({ ...pen, baru: true, ditahan: 'tanpa-sumber-url', nama: r.nama })); continue; }
    const oid = r.organisasi_terkini && orgPerNama(r.organisasi_terkini);
    const jab = r.jabatan.map((j) => bersih({ organisasi_id: j.organisasi_id || (j.organisasi && orgPerNama(j.organisasi)), organisasi: j.organisasi, jabatan: j.jabatan, mulai: j.mulai, selesai: j.selesai, kini: j.kini, catatan: j.catatan, sumber_url: j.sumber_url }));
    orangOut.publik.push(bersih({ id: r.id, nama: r.nama, gelar: r.gelar, kelompok: { kode: kel, label: KELOMPOK[kel] }, jenis: r.jenis, wilayah: wilayahDari(r, oid), status: r.status, jabatan_terkini: r.jabatan_terkini, organisasi_terkini: r.organisasi_terkini, organisasi_id: oid || (jab.find((j) => j.organisasi_id)?.organisasi_id), kepakaran: kodeMax3(r.kepakaran), ringkasan: r.ringkasan, pendidikan: r.pengurus_profil ? r.pendidikan : undefined, dpr: r.dpr, jalur: r.jalur, pernah_birokrasi: r.pernah_birokrasi, jabatan: jab, tautan: r.tautan, wikidata_id: r.wikidata_id, berita_ids: bTerbaru('orang', r.id), sumber_url: r.sumber_url || unik(r.sumber_urls).find(adaUrl), tanggal: r.tanggal, foto: fotoLokal(r) }));
    const ros = metiOrang.has(r.id) && jmlNama.get(norm(r.nama)) === 1 && anggotaNama.get(norm(r.nama))?.size === 1 ? rosterNama.get(norm(r.nama)) : null;
    const skAf = !ros && jmlNama.get(norm(r.nama)) === 1 ? afilSk.get(norm(pisahNama(r.nama).nama)) : null; // afiliasi dari SK/struktur METI (arsip lokal), nama unik saja
    const afil = skAf ? [bersih({ organisasi: skAf.organisasi || undefined, organisasi_id: skAf.organisasi ? orgPerNama(skAf.organisasi) || undefined : undefined, jabatan: skAf.jabatan, sumber: 'sk-meti' })] : ros ? [bersih({ organisasi: bersihInstansi(ros.instansi), organisasi_id: orgPerNama(bersihInstansi(ros.instansi)) || undefined, jabatan: ros.jabatan || undefined, sumber: 'daftar-keanggotaan-meti' })] : undefined;
    const ang = bersih({ id: r.id, meti: metiOrang.get(r.id) || null, afiliasi: afil, pendidikan: r.pendidikan, kiprah: r.kiprah, foto: fotoOut, akademik: r.akademik });
    if (Object.keys(ang).length > 1) orangOut.anggota.push(ang);
    if (Object.keys(pen).length > 1) orangOut.pengurus.push(pen);
  }
  { const f = path.join(ROOT, 'data/meti_wilayah.json'); if (fs.existsSync(f)) console.log('orang meti_wilayah:', terapkanMetiWilayah(orangOut.publik, JSON.parse(fs.readFileSync(f, 'utf8')))); }
  try { const m = muatFoto(); console.log('orang foto pengurus METI diisi:', gabungFoto(orangOut.publik, m.pengurus, m.berkas, m.ada)); } catch (e) { console.error('foto_orang_gabung dilewati:', e.message); }
  const orangPubSet = new Set(orangOut.publik.map((o) => o.id));
  for (const o of organisasi.publik) { o.pengurus = (o.pengurus || []).filter((x) => orangPubSet.has(x.orang_id)); if (!o.pengurus.length) delete o.pengurus; }
  for (const b of beritaPub) if (b.orang_ids) { b.orang_ids = b.orang_ids.filter((i) => orangPubSet.has(i)); if (!b.orang_ids.length) delete b.orang_ids; }
  // foto pengurus organisasi: berkas kunci
  for (const a of orgAng) if (a.pengurus_foto) { a.pengurus_foto = a.pengurus_foto.filter((f) => fotoKey.has(f.orang_id)).map((f) => ({ ...f, berkas: fotoKey.get(f.orang_id) })); if (!a.pengurus_foto.length) delete a.pengurus_foto; }

  // --- regulasi out ---
  const proyekPerReg = new Map(); for (const p of proyekPub) for (const r of p.regulasi_ids || []) (proyekPerReg.get(r) || proyekPerReg.set(r, []).get(r)).push(p.id);
  const progPerReg = new Map(); for (const [pid, ids] of Object.entries(progReg)) for (const r of ids) (progPerReg.get(r) || progPerReg.set(r, []).get(r)).push(pid);
  const regOut = { publik: [], anggota: [], pengurus: [] }; let ruuId = null;
  for (const r of regRows.sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const ruu = r.status === 'rancangan' && /Energi Baru dan Energi Terbarukan/i.test(r.judul); if (ruu) ruuId = r.id;
    if (!adaUrl(r.url_sumber) && !adaUrl(r.url_pdf) && !ruu) { regOut.pengurus.push(bersih({ id: r.id, baru: true, ditahan: 'tanpa-sumber-url', nama: r.judul, sumber_posisi: r.sumber_posisi })); if (r.posisi_meti) regOut.anggota.push({ id: r.id, baru: true, nama: r.judul, posisi_meti: r.posisi_meti }); continue; }
    regOut.publik.push(bersih({ id: r.id, tahap: ruu ? 'dalam pembahasan DPR' : null, catatan_sumber: ruu && !adaUrl(r.url_sumber) ? 'tanpa URL publik; tahap menurut arsip METI (audiensi Komisi XII 8 Sep 2026)' : null, jenis: r.jenis, nomor: r.nomor, tahun: r.tahun, judul: r.judul, instansi_penerbit: r.instansi_penerbit, status: r.status, tanggal_ditetapkan: r.tanggal_ditetapkan, tanggal_diundangkan: r.tanggal_diundangkan, topik: r.topik, ringkasan: r.ringkasan, pasal_kunci: r.pasal_kunci, url_sumber: r.url_sumber, url_pdf: r.url_pdf, ikatan: ikatan.get(r.id), diikat_oleh: diikat.get(r.id), program_ids: progPerReg.get(r.id), proyek_ids: proyekPerReg.get(r.id), berita_ids: bTerbaru('regulasi', r.id), tanggal_ambil: r.tanggal_ambil }));
    if (r.posisi_meti) regOut.anggota.push({ id: r.id, posisi_meti: r.posisi_meti });
    if (r.sumber_posisi) regOut.pengurus.push({ id: r.id, sumber_posisi: path.basename(String(r.sumber_posisi)) });
  }
  const posisi = M('posisi', 'arsip-meti/posisi_meti.jsonl').map((p) => bersih({ ...p, regulasi_id: ruuId && /RDPU|RUU/i.test(p.sumber || '') ? ruuId : null }));

  // --- program ---
  const progOut = Object.entries(PROGRAM).map(([id, p]) => {
    const ps = proyekPub.filter((x) => (x.program_ids || []).includes(id));
    const hit = (k) => ps.reduce((m, x) => { const v = x[k]; return m; }, null); void hit;
    const per = (f) => ps.reduce((m, x) => { const v = f(x) || 'tidak-diketahui'; m[v] = (m[v] || 0) + 1; return m; }, {});
    const mw = ps.reduce((s, x) => { const k = (x.kapasitas || []).find((c) => MW.has(c.satuan) && typeof c.nilai === 'number'); return s + (k ? k.nilai : 0); }, 0);
    return { id, nama: p.nama, ringkas: p.ringkas, regulasi_ids: progReg[id] || [], ...(p.pelaksana ? { pelaksana: p.pelaksana.filter(([oid]) => orgPub.has(oid)).map(([organisasi_id, peran]) => ({ organisasi_id, peran })) } : {}), proyek_ids: ps.map((x) => x.id), jumlah_proyek: ps.length, kapasitas_mw: Math.round(mw * 10) / 10, per_status: per((x) => x.status?.[0]?.nilai), per_teknologi: per((x) => x.teknologi), ...(id === 'b50' && bbn.length ? { alokasi_bbn: bbn } : {}) };
  });

  // --- angka rapat ---
  const angka = [...baca('../docs/internal/R17-INDOEBTKE/angka.jsonl'), ...baca('angka/outlook.jsonl')]; const angkaPub = [], angkaAng = [];
  for (const a of masukan.angka || angka) { const urls = [a.sumber_url, a.url, ...(a.sumber_tambahan || []).map((x) => (typeof x === 'string' ? x : x?.url))].filter(adaUrl); const baris = bersih({ ...a, sumber_berkas: a.sumber_berkas ? path.basename(String(a.sumber_berkas)) : undefined, sumber_tambahan: (a.sumber_tambahan || []).map((x) => (typeof x === 'string' ? path.basename(x) : x)) }); (urls.length ? angkaPub : angkaAng).push(baris); }

  // --- anggota METI (pengurus saja) ---
  // --- ringkas ---
  const bAll = beritaPub.slice().sort((a, b) => ((b.terbit || '') < (a.terbit || '') ? -1 : 1));
  const mwTot = Math.round(proyekPub.reduce((s, x) => { const k = (x.kapasitas || []).find((c) => MW.has(c.satuan) && typeof c.nilai === 'number'); return s + (k ? k.nilai : 0); }, 0));
  const cnt = (f) => proyekPub.reduce((m, x) => { const v = f(x) || 'tidak-diketahui'; m[v] = (m[v] || 0) + 1; return m; }, {});
  const hitungPub = { proyek: proyekPub.length, organisasi: organisasi.publik.length, orang: orangOut.publik.length, regulasi: regOut.publik.length, program: progOut.length, berita: beritaPub.length, video: videoPub.length, keuangan: keuanganPub.length, karbon: karbonPub.length };
  const berlaku = regOut.publik.filter((r) => r.status === 'berlaku').length;
  const dibangun = process.env.TANGGAL_BANGUN || tanggalMax.sort().pop() || '2026-11-07';
  const ringkasPub = { hitung: hitungPub, kartu: [
    { kode: 'proyek', label: 'Proyek terlacak', nilai: proyekPub.length, satuan: 'proyek', catatan: 'dari RUPTL, daftar komunitas, materi publik; belum lengkap' },
    { kode: 'kapasitas', label: 'Kapasitas tercatat', nilai: mwTot, satuan: 'MW', catatan: 'MW dan MWp, nilai pertama per proyek, rencana maupun terpasang' },
    { kode: 'organisasi', label: 'Organisasi', nilai: organisasi.publik.length, satuan: 'organisasi', catatan: 'hanya yang bersumber URL' },
    { kode: 'orang', label: 'Profesional dan tokoh', nilai: orangOut.publik.length, satuan: 'orang', catatan: 'jabatan publik bersumber' },
    { kode: 'regulasi', label: 'Regulasi berlaku', nilai: berlaku, satuan: 'aturan', catatan: `dari ${regOut.publik.length} aturan tercatat` },
  ], proyek_per_teknologi: cnt((x) => x.teknologi), proyek_per_status: cnt((x) => x.status?.[0]?.nilai), berita_terbaru: bAll.slice(0, 5).map((b) => b.id) };

  // logo organisasi hasil panen_logo.mjs (berkas ada = tautan); logo kurasi lama (public/img/logo/*.png) tetap dipakai beranda dan menang
  for (const o of [...organisasi.publik, ...orgAng, ...orgPen]) if (/^[A-Za-z0-9_-]+$/.test(o.id) && fs.existsSync(path.join(ROOT, 'public/img/logo/org', o.id + '.png'))) o.logo = `/img/logo/org/${o.id}.png`;
  for (const o of [...organisasi.publik, ...orgAng, ...orgPen]) { const ik = !o.logo && (indukKampus.get(o.id) || LOGO_KAMPUS[Object.keys(LOGO_KAMPUS).find((k) => tanpaAksen(o.nama).split(' ').includes(k))]); if (ik && fs.existsSync(path.join(ROOT, 'public/img/logo/org', ik + '.png'))) o.logo = `/img/logo/org/${ik}.png`; }
  const kosong = [];
  const idAng = new Map(); // id stabil baris anggota_meti; kembar nama+jenis+no diberi nomor urut
  const lapisan = {
    publik: { proyek: proyekPub, organisasi: organisasi.publik, orang: orangOut.publik, regulasi: regOut.publik, program: progOut, berita: beritaPub, angka: angkaPub, keuangan: keuanganPub, karbon: karbonPub, video: videoPub },
    anggota: { proyek: proyekAng, organisasi: orgAng, orang: orangOut.anggota, regulasi: regOut.anggota, program: kosong, berita: kosong, angka: angkaAng, keuangan: kosong, karbon: kosong, video: kosong },
    pengurus: { proyek: proyekPen, organisasi: orgPen, orang: orangOut.pengurus, regulasi: regOut.pengurus, program: kosong, berita: beritaPen, angka: kosong, keuangan: kosong, karbon: kosong, video: kosong, anggota_meti: anggotaLengkap.map((a) => { const b = bersihkanNamaAnggota(a.nama); const o = nmap.get(norm(b.nama)); const k0 = 'm_' + hash(norm(b.nama || a.nama) + '|' + (a.jenis || b.jenis_awalan || '') + '|' + (a.no_anggota || '')); const n = (idAng.get(k0) || 0) + 1; idAng.set(k0, n); return bersih({ id: n > 1 ? k0 + n : k0, ...a, ...rapikanKontak(a), nama: b.nama || a.nama, jenis: a.jenis || b.jenis_awalan, nama_lama: b.nama_lama, org_id: o && o.id }); }) },
  };
  const ekstra = { anggota: { regulasi: { posisi_topik: posisi } } };
  const ringkas = {
    publik: ringkasPub,
    anggota: { hitung: { meti_orang: Object.fromEntries([...metiOrang.values()].reduce((m, v) => m.set(v, (m.get(v) || 0) + 1), new Map())), meti_organisasi: orgAng.filter((o) => o.meti).length, delta_proyek: proyekAng.length, delta_organisasi: orgAng.length, delta_orang: orangOut.anggota.length, angka: angkaAng.length, posisi_meti: posisi.length } },
    pengurus: { hitung: { delta_proyek: proyekPen.length, delta_organisasi: orgPen.length, ditahan_organisasi: orgPen.filter((o) => o.ditahan).length, ditahan_orang: orangOut.pengurus.filter((o) => o.ditahan).length }, anggota_meti: { baris: anggotaLengkap.length } },
  };
  return { dibangun, lapisan, ringkas, ekstra, fotoPeta, proyekBuang, perluTinjauMeti };
}

// ---------- tulis + gerbang ----------
export function tulisBerkas(dir, lapis, nama, baris, dibangun, ekstra = {}) {
  const tulis = (n, obj) => { const s = bersihTanda(JSON.stringify(obj)); fs.writeFileSync(path.join(dir, n), s); return s; };
  const amplop = (b) => ({ lapis, dibangun_pada: dibangun, jumlah: b.length, ...ekstra, baris: b });
  let s = JSON.stringify(amplop(baris)); const hasil = [];
  s = bersihTanda(s);
  if (Buffer.byteLength(s) <= MAKS) { fs.writeFileSync(path.join(dir, nama + '.json'), s); return [{ berkas: nama + '.json', byte: Buffer.byteLength(s), isi: s }]; }
  const n = Math.ceil(Buffer.byteLength(s) / (MAKS * 0.8)); const per = Math.ceil(baris.length / n); const bagian = [];
  for (let i = 0; i < n; i++) { const f = `${nama}.${i + 1}.json`; const t = bersihTanda(JSON.stringify(amplop(baris.slice(i * per, (i + 1) * per)))); fs.writeFileSync(path.join(dir, f), t); bagian.push(f); hasil.push({ berkas: f, byte: Buffer.byteLength(t), isi: t }); }
  const idx = JSON.stringify({ lapis, dibangun_pada: dibangun, jumlah: baris.length, bagian }); fs.writeFileSync(path.join(dir, nama + '.json'), idx); hasil.push({ berkas: nama + '.json', byte: idx.length, isi: idx });
  return hasil;
}
export function periksaBerkas(berkas) { // berkas: [{lapis, berkas, byte, isi}]
  const galat = [];
  for (const b of berkas) {
    if (b.lapis !== 'pengurus') for (const t of pindai(b.isi)) galat.push(`${b.lapis}/${b.berkas}: ${t}`);
    if (b.lapis === 'publik' && b.byte > MAKS) galat.push(`${b.lapis}/${b.berkas}: ${b.byte} byte > 2 MB`);
  }
  return galat;
}
// public/data/pengurus-meti.json: struktur lama + orang_id (hanya bila orangnya ada di lapis publik) + foto bila berkas ada.
export function sambungPengurusMeti(tpl, pprof, idPublik, adaFoto) {
  const idDari = new Map(pprof.map((p) => [norm(p.nama), p.id])); const hasil = JSON.parse(JSON.stringify(tpl));
  const tiap = (o) => { const id = idDari.get(norm(o.nama)); if (id && idPublik.has(id)) o.orang_id = id; if (!o.foto) { const sl = norm(o.nama).replace(/ /g, '-'); if (adaFoto(sl)) o.foto = '/img/pengurus/' + sl + '.webp'; } };
  Object.values(hasil.unit).flat().forEach(tiap); (hasil.bidang || []).flatMap((b) => b.anggota).forEach(tiap);
  return hasil;
}
function tulisPengurusMeti(orangPublik, pprof) {
  const f = path.join(ROOT, 'public/data/pengurus-meti.json'); if (!fs.existsSync(f) || !pprof.length) return;
  const h = sambungPengurusMeti(JSON.parse(fs.readFileSync(f, 'utf8')), pprof, new Set(orangPublik.map((o) => o.id)), (sl) => fs.existsSync(path.join(ROOT, 'public/img/pengurus', sl + '.webp')));
  fs.writeFileSync(path.join(OUT, 'pengurus-meti.json'), JSON.stringify(h, null, 1) + '\n'); console.log('pengurus-meti.json: orang_id', JSON.stringify(h).split('"orang_id"').length - 1);
}
function jalankan() {
  const h = bangun(); const semua = [];
  const dirOut = (l) => { const d = path.join(OUT, l); fs.mkdirSync(d, { recursive: true }); return d; };
  for (const l of LAPIS) {
    const d = dirOut(l);
    for (const [nama, baris] of Object.entries(h.lapisan[l])) for (const b of tulisBerkas(d, l, nama, baris, h.dibangun, h.ekstra[l]?.[nama])) semua.push({ lapis: l, ...b });
    const r = JSON.stringify({ lapis: l, dibangun_pada: h.dibangun, ...h.ringkas[l] }); fs.writeFileSync(path.join(d, 'ringkas.json'), r); semua.push({ lapis: l, berkas: 'ringkas.json', byte: r.length, isi: r });
  }
  fs.writeFileSync(path.join(DP, 'orang/perlu-tinjau-meti.jsonl'), h.perluTinjauMeti.map((t) => JSON.stringify(t)).join('\n') + (h.perluTinjauMeti.length ? '\n' : ''));
  fs.writeFileSync(path.join(OUT, 'foto_peta.json'), JSON.stringify(h.fotoPeta, null, 1));
  tulisPengurusMeti(h.lapisan.publik.orang || [], baca('orang/pengurus_profil.jsonl'));
  const galat = periksaBerkas(semua);
  const tabel = {}; for (const l of LAPIS) tabel[l] = Object.fromEntries(Object.entries(h.lapisan[l]).map(([k, v]) => [k, v.length]));
  console.log('jumlah per lapis:', JSON.stringify(tabel)); console.log('proyek dibuang (publik:false / sumber tertutup):', h.proyekBuang);
  for (const b of semua) console.log(`${b.lapis}/${b.berkas}`.padEnd(34), (b.byte / 1024).toFixed(0).padStart(6) + ' KB');
  if (galat.length) { console.error('GAGAL pemindai/ukuran:\n' + galat.slice(0, 40).join('\n')); process.exit(1); }
  console.log('pemindai data pribadi: bersih (publik + anggota); semua berkas publik < 2 MB');
  try { fs.writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../public/sitemap.xml'), bangunSitemap()); console.log('sitemap.xml ditulis'); } catch (e) { console.error('sitemap dilewati:', e.message); }
}
function periksa() {
  const semua = [];
  for (const l of LAPIS) { const d = path.join(OUT, l); if (!fs.existsSync(d)) { console.error('potret belum dibangun: ' + d); process.exit(1); } for (const f of fs.readdirSync(d)) { const isi = fs.readFileSync(path.join(d, f), 'utf8'); semua.push({ lapis: l, berkas: f, byte: Buffer.byteLength(isi), isi }); } }
  const galat = periksaBerkas(semua); if (galat.length) { console.error('GAGAL:\n' + galat.slice(0, 40).join('\n')); process.exit(1); } console.log('periksa ok:', semua.length, 'berkas');
}
export // Alias nama organisasi (id -> sebutan lazim di berita/sumber) untuk pencocokan nama; tidak menebak pemilik proyek.
const GABUNG_ORG = { p_a3b5b106e6: 'p_10e0dde689' }; // 'PT Pertamina Power Indonesia Pertamina Nre' (nama hasil tempel) = PT Pertamina New & Renewable Energy
const ALIAS_ORG = { p_10e0dde689: ['Pertamina NRE', 'PT Pertamina NRE'], p_a3b5b106e6: ['Pertamina Power Indonesia'] };
export function selftest() {
  { const k = rapikanKontak({ telepon: '021 5551234 / Hotline: 021 5559999', seluler: 'Budi Santoso +62 812 3456 7890', surel: 'a@x.co.id / b@x.co.id;http://www.x.co.id/en', faks: '021 5550000' });
    assert.equal(k.telepon, '021 5551234'); assert.equal(k.hotline, '021 5559999'); assert.equal(k.pic, 'Budi Santoso'); assert.equal(k.seluler, '+62 812 3456 7890'); assert.equal(k.surel, 'a@x.co.id / b@x.co.id'); assert.deepEqual(k.situs, ['http://www.x.co.id/en']);
    assert.deepEqual(rapikanKontak({ surel: 'www.pln.co.id' }).situs, ['https://www.pln.co.id']); assert.equal(rapikanKontak({ surel: 'www.pln.co.id' }).surel, undefined); }
  assert.deepEqual(bersihkanNamaAnggota('ANGGOTA UTAMA: PT. INDIKA ENERGY'), { nama: 'PT. Indika Energy', jenis_awalan: 'utama', nama_lama: undefined });
  assert.deepEqual(bersihkanNamaAnggota('ANGGOTA UTAMA: CHEVRON GEOTHERMAL INDONESIA, LTD akuisisi menjadi STAR ENERGY GEOTHERMAL'), { nama: 'Star Energy Geothermal', jenis_awalan: 'utama', nama_lama: 'Chevron Geothermal Indonesia, LTD' });
  assert.equal(bersihkanNamaAnggota('PT PLN (Persero)').nama, 'PT PLN (Persero)'); assert.equal(bersihkanNamaAnggota("ABDI NAFI'").nama, "Abdi Nafi'"); assert.equal(bersihkanNamaAnggota('ANGGOTA PERUSAHAAN: PT. BANK X TBK').nama, 'PT. Bank X Tbk');
  assert.deepEqual(pindai('{"surel":"info@x.co.id","t":"humas@pln.co.id","ir":"investor.relation@mind.id","u":"https://a.b/c@d.com"}'), []);
  assert.ok(pindai('{"x":"budi.santoso@gmail.com"}').length, 'surel pribadi');
  assert.ok(pindai('{"x":"hubungi 081234567890"}').length, 'ponsel rapat');
  assert.ok(pindai('{"x":"+62 812-3456-7890"}').length, 'ponsel spasi');
  assert.ok(pindai('{"x":"NIK 3201234567890001"}').length, 'NIK');
  assert.ok(pindai('{"tanggal_lahir":"1970-01-01"}').length, 'lahir');
  assert.ok(pindai('lahir pada 17 Agustus 1970').length, 'lahir teks');
  assert.deepEqual(pindai('{"telepon":"+62 21 3983 3222","lat":-6.2088,"lng":106.8456,"tgl":"2026-08-19","k":0.8123456789}'), [], 'telepon tetap/ koordinat/ tanggal lolos');
  assert.deepEqual(pisahNama('MSc Elrika Hamdi'), { nama: 'Elrika Hamdi', gelar: 'MSc' }); assert.deepEqual(pisahNama('Dr. Ir. Budi Santoso, S.T., M.T.'), { nama: 'Budi Santoso', gelar: 'Dr. Ir. S.T., M.T.' }); assert.equal(pisahNama('Sugeng Suparwoto M.T.').nama, 'Sugeng Suparwoto'); assert.equal(pisahNama('Budi H Santoso').nama, 'Budi H Santoso');
  assert.ok(suratKorporat('sekretariat.lbaomu@plnindonesiapower.co.id') && !suratKorporat('budi@gmail.com') && !suratKorporat('mail@example.com'));
  assert.ok(ponselIndonesia('+628123456789') && !ponselIndonesia('+622139833222'));
  assert.equal(norm('PT Perusahaan Listrik Negara (Persero)'), 'perusahaan listrik negara');
  // pemecahan > 2 MB
  const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'potret-'));
  const besar = Array.from({ length: 3000 }, (_, i) => ({ id: 'x' + i, t: 'a'.repeat(1000) }));
  const r = tulisBerkas(tmp, 'publik', 'uji', besar, '2026-01-01'); assert.ok(r.length > 2 && r.every((b) => b.byte <= MAKS), 'pecah'); assert.ok(JSON.parse(fs.readFileSync(path.join(tmp, 'uji.json'))).bagian.length === r.length - 1);
  fs.rmSync(tmp, { recursive: true });
  // gerbang menolak berkas publik bocor
  assert.ok(periksaBerkas([{ lapis: 'publik', berkas: 'a.json', byte: 10, isi: '{"x":"a@gmail.com"}' }]).length);
  assert.equal(periksaBerkas([{ lapis: 'pengurus', berkas: 'a.json', byte: 10, isi: '{"x":"a@gmail.com 081234567890"}' }]).length, 0);
  // bangun kecil: sumber tertutup dibuang, materi internal hanya ke anggota, ponsel/surel pribadi tidak ke publik
  const mini = { lembaga: [], perusahaan: [{ perusahaan_id: 'p_1', nama: 'PT Contoh Energi', jenis: 'swasta', kepakaran: ['surya'], peran_rantai: [], kantor_pusat: { kota: 'Jakarta' }, sumber: [{ id: 'situs', url: 'https://contoh.co.id', tingkat_bukti: 'situs-sendiri', tanggal_periksa: '2026-11-07' }], kontak: { telepon: ['+622112345', '+6281234567890'], surel: ['info@contoh.co.id', 'budi@contoh.co.id'] } }],
    koperasi: [], ormawa: [], anggota_organisasi: [], keanggotaan: [], orang: [], rekam: [], jabatan: [], tokoh: [], p_pengurus: [], l_pengurus: [], meti: [], regulasi: [], ikatan_regulasi: [], tinjau: [], berita: [], posisi: [], angka: [{ id: 'E1', indikator: 'a', sumber_berkas: 'x.pdf' }, { id: 'E2', indikator: 'b', sumber_berkas: 'y.pdf', sumber_tambahan: ['https://esdm.go.id/z'] }], anggota_lengkap: [],
    sumber_proyek: [{ id: 's1', url: 'https://a.id', tingkat_bukti: 'resmi' }, { id: 's2', jenis: 'materi-konferensi', url: 'internal:x', tingkat_bukti: 'resmi' }, { id: 's3', url: 'internal:y', publik: false }],
    proyek: [{ id: 'pj_1', nama: [{ nilai: 'PLTS Contoh', sumber_id: 's1' }], teknologi: 'surya', sumber_ids: ['s1', 's2'], kapasitas: [{ nilai: 5, satuan: 'MW', sumber_id: 's1' }, { nilai: 9, satuan: 'MW', sumber_id: 's2' }], pemilik: [{ nilai: 'PT Contoh Energi', sumber_id: 's1' }], pemberi_dana: [{ nilai: 'Bank X', sumber_id: 's1' }], catatan: [{ nilai: 'c', sumber_id: 's1' }], programs: [], tingkat_bukti: 'resmi' }, { id: 'pj_2', nama: [{ nilai: 'Rahasia', sumber_id: 's3' }], publik: true }, { id: 'pj_3', nama: [{ nilai: 'X', sumber_id: 's1' }], publik: false }], konflik: [] };
  for (const k of ['p1001', 'i1001', 'tkdn', 'idx', 'dpr', 'rotasi', 'foto_t', 'wb', 'wkp', 'video', 'ct', 'idxc', 'k_tarif', 'k_bpp', 'k_green_finance', 'k_jetp', 'k_idx', 'k_celah', 'bubbn']) mini[k] = [];
  const h = bangun(mini);
  const o = h.lapisan.publik.organisasi[0]; assert.deepEqual(o.kontak, { telepon: ['+622112345'], surel: ['info@contoh.co.id'] }); assert.equal(o.kategori.kode, 'swasta');
  assert.ok(JSON.stringify(h.lapisan.pengurus.organisasi).includes('budi@contoh.co.id'));
  const p = h.lapisan.publik.proyek; assert.equal(p.length, 1); assert.deepEqual(p[0].kapasitas.map((k) => k.nilai), [5]); assert.equal(p[0].pihak.pemilik[0].organisasi_id, 'p_1');
  assert.deepEqual(h.lapisan.anggota.proyek[0].pemberi_dana.map((x) => x.nilai), ['Bank X']); assert.deepEqual(h.lapisan.anggota.proyek[0].dari_materi.kapasitas.map((x) => x.nilai), [9]);
  assert.equal(h.proyekBuang, 2); assert.equal(h.lapisan.publik.angka.length, 1); assert.equal(h.lapisan.anggota.angka.length, 1);
  assert.ok(!periksaBerkas(Object.entries(h.lapisan.publik).map(([k, v]) => ({ lapis: 'publik', berkas: k, byte: 1, isi: JSON.stringify(v) }))).length);
  console.log('selftest ok');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest(); else if (process.argv.includes('--periksa')) periksa(); else jalankan();
}
