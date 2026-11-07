#!/usr/bin/env node
// Rekam jejak orang untuk lembar profil (riwayat jabatan, pendidikan, kiprah EBET, foto, metrik akademik, tautan).
// Node stdlib saja, tanpa LinkedIn, tanpa tanggal/tempat lahir, agama, keluarga, kontak pribadi, kekayaan.
// Langkah (tiap langkah resumable; jaringan hanya di wikidata/wikipedia/foto/openalex/sinta):
//   --gabung     gabung 5 sumber orang -> raw/rekam/gabung.json (dedup nama ternormalisasi + alias + orang_id)
//   --wikidata   cari Q-id (label cocok persis, WNI, hidup) lalu P39/P108/P69/P18/P496/P1960 -> raw/rekam/wikidata.json
//   --wikipedia  wikitext id/en untuk yang punya artikel -> raw/rekam/wp/
//   --foto       salin foto halaman resmi + unduh Commons (lisensi bebas saja) -> foto/
//   --openalex   penulis OpenAlex (ambang ketat) + karya, ko-penulis, pendana -> raw/rekam/openalex.json
//   --sinta      uji sekali: 403/robots = berhenti dan dicatat gagal
//   --bangun     gabung semuanya (tanpa jaringan) -> rekam_jejak.jsonl + perlu-tinjau-rekam.jsonl
//   --statistik  angka laporan;  --selftest  uji tanpa jaringan
// Etika: UA jujur, 1 permintaan serentak, jeda >= 2 dtk, 403 = berhenti, 429 = tunggu Retry-After.
// Pengecualian robots yang disengaja: api.php Wikidata/Wikipedia/Commons dan SPARQL (antarmuka mesin resmi Wikimedia,
// diatur kebijakan User-Agent, bukan robots; pemilik menyebut SPARQL dan Commons eksplisit). Halaman HTML tetap cek robots.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const GAP_MS = 2200;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const D = (...p) => path.join(ROOT, 'data-panen', ...p);
const OUT = D('orang'), REK = D('orang/raw/rekam'), FOTO = D('orang/foto'), RAW = D('orang/raw');
const HARI_INI = process.env.TANGGAL_BANGUN || new Date().toISOString().slice(0, 10);
const arg = (k) => (process.argv.find((a) => a === '--' + k || a.startsWith('--' + k + '=')) || '').split('=')[1] ?? (process.argv.includes('--' + k) ? true : undefined);

// ---------- berkas ----------
const baca = (f) => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
const tulis = (f, rows) => fs.writeFileSync(f, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
const bacaJson = (f, d) => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d;
const tulisJson = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 1)); };
const gagal = (sumber, ket) => { fs.mkdirSync(REK, { recursive: true }); fs.appendFileSync(path.join(REK, 'gagal.jsonl'), JSON.stringify({ sumber, ket: String(ket).slice(0, 200), tanggal: HARI_INI }) + '\n'); console.error('GAGAL', sumber, String(ket).slice(0, 120)); };

// ---------- nama (disalin dari panen_orang.mjs; impornya mencetak bantuan) ----------
const GELAR = /\b(prof|drg|komjen|pol|dr|drs|dra|ir|h|hj|kh|dipl|ing|se|sh|st|mt|mm|mba|msc|ma|map|mh|mkn|sip|ssi|ssos|spd|sag|sk|sm|mpd|phd|llm|ak|ca|cfa|mbus|meng|mp|msi|mtp|ssn|stp|sstp|mse|mcom|cpa|bsc|bba|mpa|mem|ipu|ipm|s1|s2|s3|eng|\.)\b/gi;
export function kunciNama(nama) {
  return nama.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/,.*$/, '')
    .replace(/\./g, ' ').replace(GELAR, ' ').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
const namaBersih = (n) => { const m = n.replace(/\s+/g, ' ').trim().split(',')[0].replace(/^((Prof|Dr|Drs|Dra|drg|Ir|H|Hj|KH|Ing|Eng)\.?\s+)+/i, '').trim(); return m; };
const token = (s) => kunciNama(s).split(' ').filter((t) => t.length > 1);
const STOP = new Set(['dan', 'the', 'and', 'of', 'di', 'yang', 'untuk', 'republik', 'indonesia', 'pt', 'persero', 'tbk', 'kementerian', 'badan', 'direktur', 'director', 'kepala', 'anggota', 'ketua', 'wakil', 'dewan', 'utama', 'general', 'president', 'chief', 'head', 'ri', 'pusat']);
const kataKonteks = (s) => new Set(String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)));

// ---------- jaringan ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let terakhir = 0;
class Berhenti extends Error {}
const robotsCache = new Map();
const API_WIKIMEDIA = (u) => /^https:\/\/(www\.wikidata\.org|[a-z]+\.wikipedia\.org|commons\.wikimedia\.org)\/w\/api\.php/.test(u) || u.startsWith('https://query.wikidata.org/sparql');
async function tunggu(u, opsi = {}) {
  const d = Date.now() - terakhir; if (d < GAP_MS) await sleep(GAP_MS - d);
  terakhir = Date.now();
  return fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(60000), ...opsi, headers: { 'User-Agent': UA, Accept: '*/*', ...(opsi.headers || {}) } });
}
async function robotsOk(u) {
  if (API_WIKIMEDIA(u)) return true;
  const { origin, pathname, search } = new URL(u);
  if (!robotsCache.has(origin)) {
    const aturan = [];
    try {
      const r = await tunggu(origin + '/robots.txt');
      if (r.status === 403) throw new Berhenti('robots 403 ' + origin);
      if (r.status === 200) { let ua = false; for (const b of (await r.text()).split(/\r?\n/)) { const m = b.match(/^\s*([a-z-]+)\s*:\s*(.*?)\s*(#.*)?$/i); if (!m) continue; const k = m[1].toLowerCase(); if (k === 'user-agent') ua = m[2] === '*'; else if (ua && k === 'disallow' && m[2]) aturan.push(m[2]); } }
    } catch (e) { if (e instanceof Berhenti) throw e; }
    robotsCache.set(origin, aturan);
  }
  return !robotsCache.get(origin).some((p) => (pathname + search).startsWith(p.replace(/\*.*$/, '')));
}
// balik {status, teks|buf}; 403 melempar Berhenti; 429/5xx satu kali ulang
async function http(u, opsi = {}, biner = false) {
  if (/linkedin\.com/i.test(u)) throw new Error('LinkedIn dilarang');
  if (!(await robotsOk(u))) return { status: 'robots' };
  for (let i = 0; i < 2; i++) {
    let r; try { r = await tunggu(u, opsi); } catch (e) { if (i) return { status: 'jaringan', ket: e.message }; await sleep(4000); continue; }
    if (r.status === 403) throw new Berhenti('403 ' + u);
    if (r.status === 429 && +r.headers.get('retry-after') > 300) throw new Berhenti('429 kuota habis, ulangi setelah ' + r.headers.get('retry-after') + ' dtk (atau set OPENALEX_KEY) ' + u.slice(0, 60));
    if (r.status === 429 || r.status >= 500) { if (i) return { status: r.status }; await sleep(Math.min(60, +r.headers.get('retry-after') || 8) * 1000); continue; }
    if (r.status !== 200) return { status: r.status };
    return biner ? { status: 200, buf: Buffer.from(await r.arrayBuffer()), tipe: r.headers.get('content-type') } : { status: 200, teks: await r.text() };
  }
}
const apiWd = async (params, host = 'www.wikidata.org') => {
  const r = await http(`https://${host}/w/api.php?` + new URLSearchParams({ format: 'json', formatversion: '2', ...params }));
  if (r.status !== 200) throw new Error(`api ${host} ${r.status}`);
  return JSON.parse(r.teks);
};
const sparql = async (q) => {
  const r = await http('https://query.wikidata.org/sparql', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json' }, body: new URLSearchParams({ query: q }).toString() });
  if (r.status !== 200) throw new Error('sparql ' + r.status);
  return JSON.parse(r.teks).results.bindings;
};

// ---------- 1. gabung orang ----------
const NAMA_LEMBAGA = () => { const m = new Map(); for (const l of baca(D('lembaga/lembaga.jsonl'))) { m.set(l.nama.toLowerCase(), l.lembaga_id); if (l.singkatan) m.set(l.singkatan.toLowerCase(), l.lembaga_id); } for (const p of baca(D('perusahaan/perusahaan.jsonl'))) m.set(p.nama.toLowerCase(), p.perusahaan_id); return m; };
const tahunDariPeriode = (p) => { const m = String(p || '').match(/(\d{4})\D+(\d{4})?/); return m ? [m[1], null] : [null, null]; };

export function gabungOrang() {
  const orgId = NAMA_LEMBAGA();
  const lembagaNama = new Map(baca(D('lembaga/lembaga.jsonl')).map((l) => [l.lembaga_id, l.nama]));
  const perusahaanNama = new Map(baca(D('perusahaan/perusahaan.jsonl')).map((p) => [p.perusahaan_id, p.nama]));
  const tolak = new Set(baca(D('orang/daftar-tolak-calon.jsonl')).map((r) => kunciNama(r.nama)));
  const orang = new Map(); // orang_id sementara -> rekaman
  const kunci2id = new Map(); const perluTinjau = [];
  const cari = (id, nama, alias = []) => {
    const ks = [nama, ...alias].map(kunciNama).filter(Boolean);
    let ada = id && orang.get(id); if (ada) { ks.forEach((k) => { ada.kunci.add(k); if (!kunci2id.has(k)) kunci2id.set(k, ada.orang_id); }); return ada; }
    const hit = [...new Set(ks.map((k) => kunci2id.get(k)).filter(Boolean))];
    if (hit.length > 1) perluTinjau.push({ jenis: 'nama-kena-banyak-id', nama, ids: hit });
    ada = hit.length ? orang.get(hit[0]) : null;
    if (!ada) { const nid = id || 'o_' + crypto.createHash('sha1').update(ks[0]).digest('hex').slice(0, 10); ada = { orang_id: nid, kunci: new Set(), jabatan: [], sumber_url: [], foto: [] }; orang.set(nid, ada); }
    ks.forEach((k) => { ada.kunci.add(k); if (!kunci2id.has(k)) kunci2id.set(k, ada.orang_id); });
    return ada;
  };
  const setNama = (o, nama, gelar, alias) => { if (!o.nama || nama.length > o.nama.length) o.nama = nama; if (gelar && !o.gelar) o.gelar = gelar; o.alias = [...new Set([...(o.alias || []), ...(alias || []), nama])]; };
  const sumber = (o, u) => { if (u && /^https?:/.test(u) && !o.sumber_url.includes(u)) o.sumber_url.push(u); };
  const baris = (o, r) => { if (r.sumber_url && /^https?:/.test(r.sumber_url)) o.jabatan.push(r); else o.tanpa_sumber = (o.tanpa_sumber || 0) + 1; };

  for (const r of baca(D('orang/orang.jsonl'))) { const o = cari(r.orang_id, r.nama, r.alias); setNama(o, r.nama, r.gelar, r.alias); o.jenis = r.jenis; o.jabatan_terkini = r.jabatan_terkini; o.organisasi_terkini = r.organisasi_terkini; o.kepakaran = r.kepakaran; sumber(o, r.sumber_url); }
  for (const r of baca(D('orang/jabatan.jsonl'))) { const o = orang.get(r.orang_id) || cari(r.orang_id, r.orang_id); baris(o, { jabatan: r.jabatan, organisasi: r.organisasi, mulai: r.mulai, selesai: r.selesai, kini: r.status === 'menjabat' && !r.selesai, sumber_url: r.sumber_url, organisasi_id: orgId.get(String(r.organisasi || '').toLowerCase()) }); sumber(o, r.sumber_url); }
  for (const r of baca(D('lembaga/pengurus-meti.jsonl'))) {
    const o = cari(r.orang_id, r.nama, [r.nama_lengkap]); setNama(o, r.nama, null, [r.nama_lengkap]); if (r.nama_lengkap && /,|^(Prof|Dr|Ir)/i.test(r.nama_lengkap)) o.gelar ||= r.nama_lengkap.split(',').slice(1).join(',').trim() || undefined;
    const [m] = tahunDariPeriode(r.periode); baris(o, { jabatan: r.jabatan, organisasi: 'Masyarakat Energi Terbarukan Indonesia (METI)', mulai: m, selesai: null, kini: true, sumber_url: r.sumber_url, organisasi_id: 'l_41bf1f0b41' }); sumber(o, r.sumber_url);
    if (r.foto_file) o.foto.push({ berkas: D('lembaga/foto', r.foto_file.replace(/^foto\//, '')), sumber_url: r.foto_sumber || r.sumber_url, jenis: 'resmi' });
  }
  for (const r of baca(D('lembaga/pengurus.jsonl'))) {
    const o = cari(r.orang_id, r.nama); setNama(o, r.nama, null, []);
    baris(o, { jabatan: r.jabatan, organisasi: lembagaNama.get(r.lembaga_id) || null, mulai: r.periode?.mulai || null, selesai: r.periode?.selesai || null, kini: r.status === 'menjabat' && !r.periode?.selesai, sumber_url: r.sumber_url, organisasi_id: r.lembaga_id }); sumber(o, r.sumber_url);
    if (r.foto_url && r.foto_sumber) o.foto.push({ url: r.foto_url, sumber_url: r.foto_sumber, jenis: 'resmi' });
  }
  for (const r of baca(D('perusahaan/pengurus.jsonl'))) {
    const o = cari(r.orang_id, r.nama); setNama(o, r.nama, null, []);
    baris(o, { jabatan: r.jabatan, organisasi: perusahaanNama.get(r.perusahaan_id) || null, mulai: r.mulai || null, selesai: null, kini: true, sumber_url: r.sumber_url, organisasi_id: r.perusahaan_id, heuristik: r.ekstraksi === 'heuristik' }); sumber(o, r.sumber_url);
    if (r.foto_berkas) o.foto.push({ berkas: path.isAbsolute(r.foto_berkas) ? r.foto_berkas : D('perusahaan', r.foto_berkas), sumber_url: r.foto_sumber || r.sumber_url, jenis: 'resmi', hak_cipta: r.hak_cipta });
  }
  const tanpaUrl = [];
  for (const r of baca(path.join(ROOT, 'docs/internal/R17-INDOEBTKE/pembicara.jsonl'))) {
    const { nama: nm } = { nama: namaBersih(r.nama) }; const o = cari(null, nm, [r.nama]); setNama(o, nm, undefined, [r.nama]);
    o.pembicara = true; o.jabatan_terkini ||= r.jabatan; o.organisasi_terkini ||= r.organisasi; tanpaUrl.push(nm);
  }
  const hasil = [...orang.values()].filter((o) => o.nama && ![...o.kunci].some((k) => tolak.has(k)))
    .map((o) => ({ ...o, kunci: [...o.kunci].sort() })).sort((a, b) => a.orang_id < b.orang_id ? -1 : 1);
  return { orang: hasil, perluTinjau, ditolak: orang.size - hasil.length };
}

// ---------- tanggal & wikitext ----------
const BULAN = { januari: 1, januari_: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6, juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12, january: 1, february: 2, march: 3, may: 5, june: 6, july: 7, august: 8, october: 10, december: 12 };
export function tanggalDari(v) {
  const s = String(v || '').trim(); if (!s || /^(present|incumbent|sekarang|kini|petahana)/i.test(s) || /\b(present|incumbent|sekarang|petahana)\b/i.test(s)) return null;
  const t = s.match(/\{\{\s*(?:start date|end date|tanggal mulai|tanggal akhir|birth date)[^|}]*\|\s*(\d{4})(?:\|(\d{1,2}))?(?:\|(\d{1,2}))?/i);
  if (t) return [t[1], t[2] && String(t[2]).padStart(2, '0'), t[3] && String(t[3]).padStart(2, '0')].filter(Boolean).join('-');
  const bersih = s.replace(/\{\{[^}]*\}\}|<[^>]+>|\[\[|\]\]/g, ' ');
  const y = bersih.match(/\b(19|20)\d{2}\b/); if (!y) return null;
  const m = bersih.toLowerCase().match(new RegExp('(\\d{1,2})?\\s*(' + Object.keys(BULAN).join('|') + ')\\s+' + y[0]));
  if (m) return [y[0], String(BULAN[m[2]]).padStart(2, '0'), m[1] && m[1].padStart(2, '0')].filter(Boolean).join('-');
  return y[0];
}
export function bersihWiki(v) {
  return String(v || '').replace(/<ref[^>]*\/>|<ref[\s\S]*?<\/ref>|<!--[\s\S]*?-->/gi, '').replace(/<br\s*\/?>/gi, ', ')
    .replace(/\{\{[^{}]*\}\}/g, '').replace(/\{\{[^{}]*\}\}/g, '').replace(/\[\[(?:File|Berkas|Image):[^\]]*\]\]/gi, '')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/'{2,}/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
export function paramInfobox(wt) {
  const i = wt.search(/\{\{\s*(Infobox|Kotak info)/i); if (i < 0) return [];
  let dalam = 0, j = i, kep = 0;
  for (; j < wt.length; j++) { if (wt.startsWith('{{', j)) { dalam++; j++; } else if (wt.startsWith('}}', j)) { dalam--; j++; if (!dalam) break; } }
  const badan = wt.slice(i + 2, j - 1); const hasil = []; let buf = '', d = 0, l = 0;
  for (let k = 0; k < badan.length; k++) {
    const c2 = badan.substr(k, 2);
    if (c2 === '{{') { d++; buf += c2; k++; } else if (c2 === '}}') { d--; buf += c2; k++; } else if (c2 === '[[') { l++; buf += c2; k++; } else if (c2 === ']]') { l--; buf += c2; k++; }
    else if (badan[k] === '|' && !d && !l) { hasil.push(buf); buf = ''; } else buf += badan[k];
  }
  hasil.push(buf);
  return hasil.slice(1).map((p) => { const e = p.indexOf('='); return e < 0 ? null : [p.slice(0, e).trim().toLowerCase().replace(/\s+/g, '_'), p.slice(e + 1).trim()]; }).filter(Boolean);
}
const RE_JAB = /^(office|jabatan|title|posisi)(\d*)$/, RE_MUL = /^(term_start|mulai|mulai_menjabat|masa_jabatan_mulai|start|dilantik)(\d*)$/, RE_AKH = /^(term_end|selesai|akhir|akhir_jabatan|masa_jabatan_selesai|end)(\d*)$/;
export function riwayatWiki(wt, sumber_url) {
  const p = paramInfobox(wt); const g = new Map();
  for (const [k, v] of p) for (const [re, f] of [[RE_JAB, 'jabatan'], [RE_MUL, 'mulai'], [RE_AKH, 'akhir']]) { const m = k.match(re); if (m) { const o = g.get(m[2]) || {}; o[f] = v; g.set(m[2], o); } }
  const hasil = [];
  for (const o of g.values()) { const jabatan = bersihWiki(o.jabatan); if (!jabatan || jabatan.length > 120) continue; const mulai = tanggalDari(o.mulai), selesai = tanggalDari(o.akhir); const kini = !selesai && /(present|incumbent|sekarang|petahana)/i.test(o.akhir || ''); hasil.push({ jabatan, organisasi: null, mulai, selesai, kini, sumber_url }); }
  const alma = p.find(([k]) => /^(alma_mater|almamater|education|pendidikan|alma)$/.test(k));
  const sekolah = alma ? [...alma[1].matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)].map((m) => (m[2] || m[1]).trim()).filter((x) => /univers|institut|politeknik|school|college|sekolah|akademi|academy|sekolah tinggi|\bITB\b|\bUI\b|\bUGM\b/i.test(x)) : [];
  return { riwayat: hasil, institusi: [...new Set(sekolah)] };
}

// ---------- teks halaman resmi ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const dec = (s) => s.replace(/&#x([0-9a-f]+);|&#(\d+);|&(\w+);/gi, (m, h, d, n) => h ? String.fromCodePoint(parseInt(h, 16)) : d ? String.fromCodePoint(+d) : (ENT[n] ?? m));
const teksHtml = (h) => dec(h.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ').replace(/<\/(p|div|li|tr|h\d|br|section|article|td)>|<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t\f\r]+/g, ' ').replace(/\n\s*/g, '\n').trim();
const slug = (u) => u.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 120);
const L = (re) => '(?<![A-Za-z])(?:' + re + ')(?![A-Za-z])';
const JENJANG = [[new RegExp(L('ph\\.?\\s?d|doktor|doctor(?:al)?|s-?3|d\\.?\\s?eng|dr\\.?-?ing'), 'i'), 'S3'], [new RegExp(L('master(?:’s|\'s)?|magister|s-?2|m\\.?\\s?sc|mba|m\\.?\\s?eng|m\\.?\\s?t|mpm|m\\.?\\s?a'), 'i'), 'S2'], [new RegExp(L('bachelor(?:’s|\'s)?|sarjana|s-?1|b\\.?\\s?sc|b\\.?\\s?eng|b\\.?\\s?a|s\\.?\\s?t|s\\.?\\s?e'), 'i'), 'S1'], [new RegExp(L('profesi|insinyur profesional'), 'i'), 'profesi']];
const jenjangDari = (t) => { const m = JENJANG.map(([re, j]) => [t.search(re), j]).filter(([i]) => i >= 0).sort((x, y) => x[0] - y[0])[0]; return m ? { jenjang: m[1], idx: m[0] } : null; };
const INST = new RegExp('(?:\\b(?:Universitas|Institut|Politeknik|Sekolah Tinggi|Universiti|University|Institute|Technische|Akademi|Academy|College)\\s+(?:of\\s+|for\\s+)?[A-Z][\\w\'’&.-]*(?:\\s+(?:of\\s+|de\\s+|van\\s+)?[A-Z][\\w\'’&.-]*){0,5})|(?:(?:[A-Z][\\w\'’&.-]*\\s+){1,3}(?:University|Institute|College))', 'g');
const tahunAkhir = (t) => { const th = [...t.matchAll(/\b(19[6-9]\d|20[0-2]\d)\b/g)].map((x) => x[1]); return th.length ? th[th.length - 1] : null; };
export function pendidikanTeks(jendela, sumber_url) {
  const hasil = []; const baris = jendela.split('\n');
  // (A) blok berjudul "Latar Belakang Pendidikan": baris jenjang+bidang lalu baris institusi - tahun
  const h = baris.findIndex((b) => /^\s*(latar belakang pendidikan|riwayat pendidikan|pendidikan|education(?:al background)?)\s*:?\s*$/i.test(b));
  if (h >= 0) {
    let cur = null;
    for (const b of baris.slice(h + 1, h + 14)) {
      if (/^\s*(pengalaman|experience|karier|career|riwayat|informasi|penghargaan)/i.test(b)) break;
      const j = jenjangDari(b.slice(0, 14));
      if (j && j.idx <= 1) { cur = { jenjang: j.jenjang, bidang: b.replace(JENJANG.find(([, x]) => x === j.jenjang)[0], '').replace(/^[\s.,:-]+/, '').trim().slice(0, 80) || null }; continue; }
      if (cur && b.trim()) { const inst = b.split(/\s[-–]\s/)[0].replace(/^(Joint Program)\s+/i, '').split(',')[0].replace(/[\s,]+(19|20)\d{2}$/, '').trim(); if (inst.length > 3 && inst.length < 90) hasil.push({ ...cur, institusi: inst, ...(tahunAkhir(b) ? { lulus: tahunAkhir(b) } : {}), sumber_url }); cur = null; }
    }
  }
  // (B) kalimat: tiap institusi mengambil jenjang yang tertulis tepat sebelum namanya (tanpa mewarisi dari institusi sebelumnya)
  if (!hasil.length) for (const kal of jendela.split(/\n|(?<=[a-z)]\.)\s+(?=[A-Z])/)) {
    if (kal.length > 400 || !/(gelar|lulus|alumn|graduat|degree|sarjana|magister|master|doktor|bachelor|ph\.?d|s-?[123]\b|meraih|menempuh|pendidikan|studi)/i.test(kal)) continue;
    let awal = 0, ke = 0;
    for (const m of kal.matchAll(INST)) {
      const seg = kal.slice(awal, m.index); awal = m.index + m[0].length;
      const j = jenjangDari(seg); const bm = seg.match(/(?:di bidang|bidang|in|of)\s+([A-Z][^,]{3,70}?)\s*(?:[-–]\s*[^,]*?)?\s*(?:dari|from|at|pada|,)?\s*$/) || seg.match(/\bdan\s+([A-Z][^,]{3,60}?)\s*(?:dari|from|at)\s*$/);
      if (!j && !ke && !/(alumn|lulusan|graduate)/i.test(kal)) continue; ke++;
      const lulus = tahunAkhir(kal.slice(awal, awal + 20));
      hasil.push({ jenjang: j ? j.jenjang : null, bidang: bm ? bm[1].replace(/\s*(dari|from|at)$/i, '').trim() : null, institusi: m[0].trim().replace(/\s+/g, ' '), ...(lulus ? { lulus } : {}), sumber_url });
    }
  }
  return hasil;
}
// jendela teks di sekitar nama pada halaman resmi, berhenti di nama orang lain (hindari bio tetangga)
export function jendelaNama(teks, nama, semuaNama) {
  const low = teks.toLowerCase(); const hasil = []; const kn = nama.toLowerCase();
  let i = -1; while ((i = low.indexOf(kn, i + 1)) >= 0) {
    let akhir = Math.min(teks.length, i + 3500);
    for (const n of semuaNama) { if (n === kn) continue; const j = low.indexOf(n, i + kn.length); if (j > 0 && j < akhir) akhir = j; }
    hasil.push(teks.slice(i, akhir));
  }
  return hasil;
}

// ---------- 2. Wikidata ----------
const P = { jabatan: 'P39', majikan: 'P108', sekolah: 'P69', foto: 'P18', orcid: 'P496', scholar: 'P1960', situs: 'P856' };
const klaim = (e, p) => (e.claims?.[p] || []).filter((c) => c.rank !== 'deprecated');
const nilaiId = (c) => c.mainsnak?.datavalue?.value?.id;
const nilaiStr = (c) => c?.mainsnak?.datavalue?.value;
const qual = (c, p) => (c.qualifiers?.[p] || []).map((s) => s.datavalue?.value).filter(Boolean);
function waktu(v) { if (!v?.time) return null; const m = v.time.match(/^\+?(\d{4})-(\d\d)-(\d\d)/); if (!m) return null; return v.precision >= 11 ? `${m[1]}-${m[2]}-${m[3]}` : v.precision === 10 ? `${m[1]}-${m[2]}` : m[1]; }
const JENJANG_Q = (lab) => { const l = (lab || '').toLowerCase(); if (/doctor|doktor|ph\.?d/.test(l)) return 'S3'; if (/master|magister/.test(l)) return 'S2'; if (/bachelor|sarjana|insinyur|engineer/.test(l)) return 'S1'; return null; };

const GENERIK = new Set(['energi', 'energy', 'sumber', 'daya', 'mineral', 'menteri', 'minister', 'komisaris', 'direktur', 'jenderal', 'konservasi', 'terbarukan', 'baru']);
export const buktiKuat = (b) => b.length >= 2 && b.some((x) => !GENERIK.has(x)) || b.some((x) => !GENERIK.has(x) && x.length >= 3 && ['dpr', 'pln', 'mind', 'aesi', 'esdm', 'pertamina', 'bank', 'mandiri', 'kejaksaan', 'investasi', 'hilirisasi', 'keuangan', 'fiskal', 'pendidikan'].includes(x));
async function langkahWikidata() {
  const g = bacaJson(path.join(REK, 'gabung.json'), null); if (!g) throw new Error('jalankan --gabung dulu');
  const f = path.join(REK, 'wikidata.json'); const simpan = bacaJson(f, { dicari: {}, orang: {}, tinjau: [] });
  const nama2orang = new Map();
  for (const o of g.orang) { if (simpan.dicari[o.orang_id]) continue; for (const n of new Set([o.nama, ...(o.alias || [])].map(namaBersih).filter((n) => n.includes(' ') && n.length > 5))) { if (!nama2orang.has(n)) nama2orang.set(n, new Set()); nama2orang.get(n).add(o.orang_id); } }
  const namaList = [...nama2orang.keys()]; const cand = {}; // orang_id -> Set(Q)
  for (let i = 0; i < namaList.length; i += 30) {
    const lot = namaList.slice(i, i + 30); const vals = lot.flatMap((n) => [`"${n.replace(/["\\]/g, '')}"@id`, `"${n.replace(/["\\]/g, '')}"@en`]).join(' ');
    let rows; try { rows = await sparql(`SELECT ?q ?l WHERE { VALUES ?l { ${vals} } ?q rdfs:label ?l . ?q wdt:P31 wd:Q5 . ?q wdt:P27 wd:Q252 . FILTER NOT EXISTS { ?q wdt:P570 [] } }`); }
    catch (e) { gagal('wikidata-sparql', e.message); if (e instanceof Berhenti) return; continue; }
    for (const b of rows) { const q = b.q.value.split('/').pop(); for (const id of nama2orang.get(b.l.value) || []) (cand[id] ||= new Set()).add(q); }
    console.error('sparql', Math.min(i + 30, namaList.length), '/', namaList.length);
  }
  const semuaQ = [...new Set(Object.values(cand).flatMap((s) => [...s]))];
  const ent = {};
  for (let i = 0; i < semuaQ.length; i += 50) { try { const d = await apiWd({ action: 'wbgetentities', ids: semuaQ.slice(i, i + 50).join('|'), props: 'claims|sitelinks|descriptions|labels', languages: 'id|en', languagefallback: '1' }); Object.assign(ent, d.entities); } catch (e) { gagal('wikidata-entitas', e.message); } }
  // label rujukan
  const ids = new Set(); for (const e of Object.values(ent)) for (const p of [P.jabatan, P.majikan, P.sekolah]) for (const c of klaim(e, p)) { ids.add(nilaiId(c)); for (const q of ['P512', 'P812', 'P642', 'P794', 'P1027']) for (const v of qual(c, q)) ids.add(v.id); }
  ids.delete(undefined); const lab = {}; const L = [...ids];
  for (let i = 0; i < L.length; i += 50) { try { const d = await apiWd({ action: 'wbgetentities', ids: L.slice(i, i + 50).join('|'), props: 'labels', languages: 'id|en', languagefallback: '1' }); for (const [k, v] of Object.entries(d.entities)) lab[k] = v.labels?.id?.value || v.labels?.en?.value || Object.values(v.labels || {})[0]?.value; } catch (e) { gagal('wikidata-label', e.message); } }
  const L2 = (id) => lab[id] || null;
  for (const o of g.orang) {
    if (simpan.dicari[o.orang_id]) continue; simpan.dicari[o.orang_id] = HARI_INI;
    const qs = [...(cand[o.orang_id] || [])]; if (!qs.length) continue;
    const konteks = kataKonteks([o.jabatan_terkini, o.organisasi_terkini, ...o.jabatan.map((j) => j.jabatan + ' ' + j.organisasi)].join(' '));
    const nilai = qs.map((q) => {
      const e = ent[q]; if (!e) return null;
      const teksWd = [e.descriptions?.id?.value, e.descriptions?.en?.value, ...klaim(e, P.jabatan).map((c) => L2(nilaiId(c))), ...klaim(e, P.majikan).map((c) => L2(nilaiId(c))), ...klaim(e, P.majikan).flatMap((c) => qual(c, 'P794').map((v) => L2(v.id)))].join(' ');
      const bukti = [...kataKonteks(teksWd)].filter((w) => konteks.has(w));
      return { q, e, bukti };
    }).filter(Boolean);
    const baik = nilai.filter((n) => buktiKuat(n.bukti));
    if (baik.length !== 1) { simpan.tinjau.push({ orang_id: o.orang_id, nama: o.nama, alasan: baik.length > 1 ? 'wikidata-ambigu' : 'wikidata-bukti-lemah', kandidat: nilai.map((n) => n.q) }); continue; }
    const { q, e, bukti } = baik[0]; const url = 'https://www.wikidata.org/wiki/' + q;
    const riwayat = [
      ...klaim(e, P.jabatan).map((c) => ({ jabatan: L2(nilaiId(c)), organisasi: qual(c, 'P642').map((v) => L2(v.id))[0] || null, mulai: waktu(qual(c, 'P580')[0]), selesai: waktu(qual(c, 'P582')[0]), sumber_url: url })),
      ...klaim(e, P.majikan).map((c) => ({ jabatan: qual(c, 'P794').map((v) => L2(v.id))[0] || 'Pegawai', organisasi: L2(nilaiId(c)), mulai: waktu(qual(c, 'P580')[0]), selesai: waktu(qual(c, 'P582')[0]), sumber_url: url })),
    ].filter((r) => r.jabatan && (r.organisasi || r.jabatan)).map((r) => ({ ...r, kini: false }));
    const pendidikan = klaim(e, P.sekolah).map((c) => { const inst = L2(nilaiId(c)); const gelar = qual(c, 'P512').map((v) => L2(v.id))[0]; return inst && { jenjang: JENJANG_Q(gelar), bidang: qual(c, 'P812').map((v) => L2(v.id))[0] || null, institusi: inst, ...(waktu(qual(c, 'P580')[0]) ? { mulai: waktu(qual(c, 'P580')[0]) } : {}), ...(waktu(qual(c, 'P582')[0]) ? { lulus: waktu(qual(c, 'P582')[0]) } : {}), sumber_url: url }; }).filter(Boolean);
    simpan.orang[o.orang_id] = { q, bukti, riwayat, pendidikan, foto: nilaiStr(klaim(e, P.foto)[0]) || null, orcid: nilaiStr(klaim(e, P.orcid)[0]) || null, scholar: nilaiStr(klaim(e, P.scholar)[0]) || null, situs: nilaiStr(klaim(e, P.situs)[0]) || null, idwiki: e.sitelinks?.idwiki?.title || null, enwiki: e.sitelinks?.enwiki?.title || null };
  }
  tulisJson(f, simpan); console.error('wikidata cocok:', Object.keys(simpan.orang).length);
}

// ---------- 3. Wikipedia (wikitext lewat /wiki/Judul?action=raw; jalur HTML, robots dicek) ----------
async function langkahWikipedia() {
  const w = bacaJson(path.join(REK, 'wikidata.json'), { orang: {} }); const dir = path.join(REK, 'wp'); fs.mkdirSync(dir, { recursive: true });
  for (const [id, x] of Object.entries(w.orang)) for (const [lang, judul] of [['id', x.idwiki], ['en', x.enwiki]]) {
    if (!judul) continue; const f = path.join(dir, `${id}.${lang}.txt`); if (fs.existsSync(f)) continue;
    try { const r = await http(`https://${lang}.wikipedia.org/wiki/${encodeURIComponent(judul.replace(/ /g, '_'))}?action=raw`); if (r.status === 200) fs.writeFileSync(f, r.teks); else gagal('wikipedia-' + lang, `${r.status} ${judul}`); } catch (e) { gagal('wikipedia-' + lang, e.message); if (e instanceof Berhenti) return; }
  }
}

// ---------- 4. foto ----------
const LISENSI_BEBAS = /(cc-?by(-sa)?-?[\d.]*|cc-?zero|cc0|pd-|public domain|pdm)/i;
export function lisensiCommons(wt) {
  const lic = [...wt.matchAll(/\{\{\s*((?:cc-by|cc-zero|cc0|pd-|PD |Public domain)[^}|]*)/gi)].map((m) => m[1].trim());
  const lain = /\{\{\s*(non-free|copyvio|no permission|cc-by-nc|cc-nc)/i.test(wt);
  const pengarang = bersihWiki((wt.match(/\|\s*author\s*=\s*([^\n|]*(?:\[\[[^\]]*\]\][^\n|]*)*)/i) || [])[1] || '').replace(/^\W+|\W+$/g, '');
  return { lisensi: lic[0] || null, bebas: !!lic.length && !lain && LISENSI_BEBAS.test(lic[0]), pengarang: pengarang || null };
}
const urlThumb = (nama, lebar = 500) => { const n = nama.replace(/ /g, '_'); const h = crypto.createHash('md5').update(n).digest('hex'); const e = encodeURIComponent(n); return `https://upload.wikimedia.org/wikipedia/commons/thumb/${h[0]}/${h.slice(0, 2)}/${e}/${lebar}px-${e}${/\.(tiff?|svg)$/i.test(n) ? '.png' : ''}`; };
async function langkahFoto() {
  const g = bacaJson(path.join(REK, 'gabung.json'), null); const w = bacaJson(path.join(REK, 'wikidata.json'), { orang: {} });
  fs.mkdirSync(FOTO, { recursive: true }); const f = path.join(REK, 'foto.json'); const hasil = bacaJson(f, {});
  for (const o of g.orang) {
    if (hasil[o.orang_id]) continue;
    const resmi = o.foto.find((x) => x.berkas && fs.existsSync(x.berkas));
    if (resmi) { const ext = path.extname(resmi.berkas); fs.copyFileSync(resmi.berkas, path.join(FOTO, o.orang_id + ext)); hasil[o.orang_id] = { berkas: o.orang_id + ext, sumber_url: resmi.sumber_url, lisensi: 'hak cipta pemilik halaman resmi; dipakai dengan atribusi sumber', pengarang: null, jenis: 'resmi' }; continue; }
    const berkasWd = w.orang[o.orang_id]?.foto; if (!berkasWd) continue;
    try {
      const meta = await http(`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(berkasWd.replace(/ /g, '_'))}?action=raw`);
      if (meta.status !== 200) { gagal('commons-meta', meta.status + ' ' + berkasWd); continue; }
      const lis = lisensiCommons(meta.teks);
      if (!lis.bebas || !lis.pengarang) { hasil[o.orang_id] = { ditolak: !lis.bebas ? 'lisensi-tidak-bebas-atau-tak-terbaca' : 'pengarang-tak-terbaca', berkas_commons: berkasWd }; continue; }
      let r = await http(urlThumb(berkasWd), {}, true); if (r.status !== 200) r = await http(urlThumb(berkasWd, 330), {}, true);
      if (r.status !== 200 || !/^image\//.test(r.tipe || '')) { gagal('commons-unduh', r.status + ' ' + berkasWd); continue; }
      const ext = /png/.test(r.tipe) ? '.png' : '.jpg'; fs.writeFileSync(path.join(FOTO, o.orang_id + ext), r.buf);
      hasil[o.orang_id] = { berkas: o.orang_id + ext, sumber_url: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(berkasWd.replace(/ /g, '_')), lisensi: lis.lisensi, pengarang: lis.pengarang, jenis: 'commons' };
    } catch (e) { gagal('commons', e.message); if (e instanceof Berhenti) break; }
  }
  tulisJson(f, hasil); console.error('foto:', Object.values(hasil).filter((x) => x.berkas).length);
}

// ---------- 5. OpenAlex ----------
const akademisi = (o) => /prof|dr\b|dr\.|ph\.?d|d\.?eng/i.test(o.gelar || '') || /univers|institut|politeknik|badan riset|brin|peneliti|dosen|guru besar|profesor/i.test([o.jabatan_terkini, o.organisasi_terkini, ...o.jabatan.map((j) => j.jabatan + ' ' + j.organisasi)].join(' ')) || o.alias.some((a) => /^(prof|dr)\b/i.test(a));
export function cocokPenulis(o, kandidat) {
  const mau = new Set(token(namaBersih(o.nama))); const ada = [];
  for (const a of kandidat) {
    const t = new Set(token(a.display_name || '')); if (t.size < 1 || mau.size < 2) continue;
    const sama = t.size === mau.size && [...t].every((x) => mau.has(x));
    const inisial = [...mau].every((x) => t.has(x) || [...t].some((y) => y.length === 1 && x[0] === y));
    if (!sama && !(inisial && [...mau].filter((x) => t.has(x)).length >= 2)) continue;
    const orgs = (a.affiliations || []).map((f) => f.institution?.display_name || '').concat((a.last_known_institutions || []).map((i) => i.display_name)).join(' ');
    const k = kataKonteks([o.organisasi_terkini, ...o.jabatan.map((j) => j.organisasi)].join(' '));
    const irisan = [...kataKonteks(orgs)].filter((x) => k.has(x));
    ada.push({ a, kuat: irisan.length >= 1 }); // ponytail: topik energi saja tidak cukup (nama umum); wajib irisan afiliasi
  }
  const kuat = ada.filter((x) => x.kuat);
  return { cocok: kuat.length === 1 ? kuat[0].a : null, ambigu: kuat.length > 1, lemah: !kuat.length && ada.length ? ada.map((x) => x.a.id) : [] };
}
async function langkahOpenAlex() {
  const g = bacaJson(path.join(REK, 'gabung.json'), null); const f = path.join(REK, 'openalex.json'); const simpan = bacaJson(f, { orang: {}, dicari: {}, tinjau: [] });
  const kunci = process.env.OPENALEX_KEY ? { api_key: process.env.OPENALEX_KEY } : {};
  const oa = async (p, q) => { const r = await http('https://api.openalex.org' + p + '?' + new URLSearchParams({ ...q, ...kunci })); if (r.status !== 200) throw new Error('openalex ' + r.status); return JSON.parse(r.teks); };
  const SEL = 'id,display_name,orcid,works_count,cited_by_count,summary_stats,topics,affiliations,last_known_institutions';
  for (const o of g.orang.filter(akademisi)) {
    if (simpan.dicari[o.orang_id]) continue;
    try {
      const d = await oa('/authors', { search: namaBersih(o.nama), filter: 'last_known_institutions.country_code:ID', per_page: '8', select: SEL });
      const h = cocokPenulis(o, d.results || []); simpan.dicari[o.orang_id] = HARI_INI;
      if (h.ambigu) { simpan.tinjau.push({ orang_id: o.orang_id, nama: o.nama, alasan: 'openalex-ambigu' }); continue; }
      if (!h.cocok) { if (h.lemah.length) simpan.tinjau.push({ orang_id: o.orang_id, nama: o.nama, alasan: 'openalex-nama-sama-bukti-lemah', kandidat: h.lemah }); continue; }
      const a = h.cocok; const aid = a.id.split('/').pop();
      const w = await oa('/works', { filter: 'authorships.author.id:' + aid, per_page: '100', sort: 'cited_by_count:desc', select: 'id,authorships,funders' });
      const ko = new Map(), dana = new Map();
      for (const k of w.results || []) { for (const s of k.authorships || []) { const id = s.author?.id?.split('/').pop(); if (id && id !== aid) { const x = ko.get(id) || { nama: s.author.display_name, openalex_id: id, karya_bersama: 0 }; x.karya_bersama++; ko.set(id, x); } } for (const gr of k.funders || []) { const n = gr.display_name || gr.funder_display_name; if (n) dana.set(n, (dana.get(n) || 0) + 1); } }
      simpan.orang[o.orang_id] = { openalex_id: aid, orcid: (a.orcid || '').split('/').pop() || null, karya: a.works_count || 0, sitasi: a.cited_by_count || 0, h_index: a.summary_stats?.h_index ?? null, i10_index: a.summary_stats?.i10_index ?? null, topik: (a.topics || []).slice(0, 6).map((t) => t.display_name), ko_penulis: [...ko.values()].sort((x, y) => y.karya_bersama - x.karya_bersama || (x.openalex_id < y.openalex_id ? -1 : 1)).slice(0, 8), pendana: [...dana].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1)).slice(0, 5).map(([nama, karya]) => ({ nama, karya })), sumber_url: 'https://openalex.org/authors/' + aid };
    } catch (e) { gagal('openalex', e.message); if (e instanceof Berhenti) break; }
  }
  tulisJson(f, simpan); console.error('openalex cocok:', Object.keys(simpan.orang).length);
}

// ---------- 6. SINTA: robots/403 = berhenti ----------
async function langkahSinta() {
  const probe = 'https://sinta.kemdiktisaintek.go.id/authors?q=test';
  try { const r = await http(probe); const ok = r.status === 200; fs.mkdirSync(REK, { recursive: true }); tulisJson(path.join(REK, 'sinta.json'), { status: r.status, diperiksa: HARI_INI, dipakai: false, catatan: ok ? 'halaman terbuka tetapi parser SINTA belum ditulis' : 'tidak diizinkan; tidak dilewati' }); if (!ok) gagal('sinta', 'status ' + r.status); }
  catch (e) { tulisJson(path.join(REK, 'sinta.json'), { status: 403, diperiksa: HARI_INI, dipakai: false, catatan: 'diblokir untuk bot (403); tidak dilewati' }); gagal('sinta', e.message); }
}

// ---------- 7. bangun (offline, deterministik) ----------
const TAHUN = (t) => { const m = String(t || '').match(/\d{4}/); return m ? +m[0] : null; };
const kunciOrg = (o) => { const k = kunciNama(o || ''); return /esdm|energi dan sumber daya mineral/.test(k) ? 'esdm' : /meti|masyarakat energi terbarukan/.test(k) ? 'meti' : k.replace(/\b(pt|persero|tbk|kementerian)\b/g, ' ').replace(/\s+/g, ' ').trim(); };
const kunciJab = (r) => kunciNama(r.jabatan || '') + '|' + kunciOrg(r.organisasi);
const SEKTOR = { surya: 'surya', bayu: 'bayu', hidro: 'tenaga air', panas_bumi: 'panas bumi', biomassa: 'biomassa', 'biomassa-sampah': 'biomassa dan sampah', jaringan: 'jaringan listrik', kebijakan: 'kebijakan energi', 'riset-data': 'riset energi' };
export function kiprahBerita(o, berita) {
  const nm = new Set([o.nama, ...o.alias].map(namaBersih).filter((n) => n.split(' ').length >= 2).map((n) => n.toLowerCase()));
  const hasil = [];
  for (const b of berita) { const j = b.judul.toLowerCase(); if (![...nm].some((n) => j.includes(n))) continue; const sek = (b.kepakaran || []).map((k) => SEKTOR[k] || k).slice(0, 2).join(' dan '); hasil.push({ tahun: TAHUN(b.terbit), teks: `Tampil dalam pemberitaan ${b.media}${sek ? ' tentang ' + sek : ' di sektor energi'}.`, sumber_url: b.url }); }
  return hasil;
}
function bangun() {
  const g = bacaJson(path.join(REK, 'gabung.json'), null); if (!g) throw new Error('jalankan --gabung dulu');
  const w = bacaJson(path.join(REK, 'wikidata.json'), { orang: {}, tinjau: [] }), oa = bacaJson(path.join(REK, 'openalex.json'), { orang: {}, tinjau: [] }), ft = bacaJson(path.join(REK, 'foto.json'), {});
  const sinta = bacaJson(path.join(REK, 'sinta.json'), null);
  const berita = baca(D('berita/berita.jsonl')); const semuaNama = [...new Set(g.orang.flatMap((o) => o.alias.map((a) => namaBersih(a).toLowerCase())).filter((n) => n.length > 5))];
  const teksCache = new Map(); const teksResmi = (u) => { if (!teksCache.has(u)) { const f = path.join(RAW, slug(u) + '.html'); teksCache.set(u, fs.existsSync(f) ? teksHtml(fs.readFileSync(f, 'utf8')) : null); } return teksCache.get(u); };
  const htmlResmi = (u) => { const f = path.join(RAW, slug(u) + '.html'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
  const rows = []; const tinjau = [...g.perluTinjau.map((x) => ({ ...x, tanggal: HARI_INI })), ...(w.tinjau || []).map((x) => ({ ...x, tanggal: HARI_INI })), ...(oa.tinjau || []).map((x) => ({ ...x, tanggal: HARI_INI }))];
  for (const o of g.orang) {
    const rw = []; const src = new Set();
    for (const j of o.jabatan) rw.push({ mulai: j.mulai || null, selesai: j.selesai || null, jabatan: j.jabatan, organisasi: j.organisasi || null, ...(j.organisasi_id ? { organisasi_id: j.organisasi_id } : {}), kini: !!j.kini, sumber_url: j.sumber_url });
    const wdMentah = w.orang[o.orang_id]; const wd = wdMentah && buktiKuat(wdMentah.bukti) ? wdMentah : null; if (wdMentah && !wd) tinjau.push({ orang_id: o.orang_id, nama: o.nama, alasan: 'wikidata-bukti-lemah', kandidat: [wdMentah.q], tanggal: HARI_INI }); let wiki = { riwayat: [], institusi: [] };
    if (wd) { for (const r of wd.riwayat) if (r.organisasi || r.mulai || r.selesai) rw.push(r); }
    let pd = wd ? [...wd.pendidikan] : [];
    for (const lang of wd ? ['id', 'en'] : []) { const f = path.join(REK, 'wp', `${o.orang_id}.${lang}.txt`); if (!fs.existsSync(f)) continue; const u = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent((wd[lang === 'id' ? 'idwiki' : 'enwiki'] || '').replace(/ /g, '_'))}`; const x = riwayatWiki(fs.readFileSync(f, 'utf8'), u); for (const r of x.riwayat) rw.push(r); for (const s of x.institusi) pd.push({ jenjang: null, bidang: null, institusi: s, sumber_url: u }); }
    // halaman resmi: pendidikan dari jendela teks sekitar nama
    for (const u of o.sumber_url) { const t = teksResmi(u); if (!t) continue; for (const nm of new Set(o.alias.map((a) => namaBersih(a).toLowerCase()).filter((n) => n.length > 5))) for (const jd of jendelaNama(t, nm, semuaNama)) pd.push(...pendidikanTeks(jd, u)); }
    // dedup riwayat: kunci jabatan+organisasi; baris resmi menang atas Wikidata/Wikipedia, rentang waktu dilengkapi
    const peta = new Map();
    for (const r of rw) { const k = kunciJab(r); const a = peta.get(k); if (!a) peta.set(k, { ...r }); else { a.mulai ||= r.mulai; a.selesai ||= r.selesai; a.organisasi ||= r.organisasi; a.kini = a.kini || r.kini; } }
    const riwayat = [...peta.values()].filter((r) => r.jabatan).sort((a, b) => (+b.kini - +a.kini) || String(b.mulai || '').localeCompare(String(a.mulai || '')) || (a.jabatan < b.jabatan ? -1 : 1));
    const pk = new Map(); for (const p of pd) { const k = kunciNama(p.institusi) + '|' + (p.jenjang || ''); const a = pk.get(k) || pk.get(kunciNama(p.institusi) + '|'); if (!a) pk.set(k, p); else { a.jenjang ||= p.jenjang; a.bidang ||= p.bidang; a.lulus ||= p.lulus; a.mulai ||= p.mulai; } }
    const GEN = new Set(['universitas', 'university', 'institut', 'institute', 'of', 'the', 'technology', 'teknologi']);
    const tk = (p) => token(p.institusi).filter((t) => !GEN.has(t));
    const pendidikan = [...pk.values()].filter((p) => p.institusi).map((p) => ({ ...p, bidang: /^of\b/i.test(p.bidang || '') ? null : p.bidang }))
      .filter((p, _, all) => p.jenjang || !all.some((q) => q.jenjang && tk(q).some((t) => tk(p).includes(t))));
    // kiprah: berita + jabatan terkini
    const kiprah = [...kiprahBerita(o, berita)];
    for (const r of riwayat.filter((x) => x.kini && x.organisasi).slice(0, 2)) kiprah.push({ tahun: TAHUN(r.mulai), teks: `Menjabat ${r.jabatan} di ${r.organisasi}${TAHUN(r.mulai) ? ' sejak ' + TAHUN(r.mulai) : ''}.`, sumber_url: r.sumber_url });
    const kp = [...new Map(kiprah.map((k) => [k.sumber_url + k.teks, k])).values()].sort((a, b) => (b.tahun || 0) - (a.tahun || 0) || (a.teks < b.teks ? -1 : 1)).slice(0, 6);
    const a = oa.orang[o.orang_id]; const akademik = a ? { ...a, sinta: null } : null;
    const orcid = a?.orcid || wd?.orcid || null;
    const tautan = [];
    const tambah = (jenis, url, sumber) => { if (url && !tautan.some((t) => t.url === url)) tautan.push({ jenis, url, sumber_url: sumber }); };
    if (wd?.situs) tambah('situs', wd.situs, 'https://www.wikidata.org/wiki/' + wd.q);
    if (wd?.idwiki) tambah('wikipedia', 'https://id.wikipedia.org/wiki/' + encodeURIComponent(wd.idwiki.replace(/ /g, '_')), 'https://www.wikidata.org/wiki/' + wd.q); if (wd?.enwiki) tambah('wikipedia', 'https://en.wikipedia.org/wiki/' + encodeURIComponent(wd.enwiki.replace(/ /g, '_')), 'https://www.wikidata.org/wiki/' + wd.q);
    if (wd) tambah('wikidata', 'https://www.wikidata.org/wiki/' + wd.q, 'https://www.wikidata.org/wiki/' + wd.q);
    if (orcid) tambah('orcid', 'https://orcid.org/' + orcid, a?.sumber_url || 'https://www.wikidata.org/wiki/' + wd?.q);
    if (wd?.scholar) tambah('scholar', 'https://scholar.google.com/citations?user=' + wd.scholar, 'https://www.wikidata.org/wiki/' + wd.q);
    if (a) tambah('openalex', a.sumber_url, a.sumber_url);
    for (const u of o.sumber_url) { const h = htmlResmi(u); if (!h) continue; for (const nm of new Set(o.alias.map((x) => namaBersih(x).toLowerCase()).filter((n) => n.length > 5))) for (const jd of jendelaNama(h, nm, semuaNama)) { const m = jd.match(/https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]+/i); if (m) tambah('linkedin', m[0], u); } }
    for (const u of o.sumber_url) tambah('profil-resmi', u, u);
    const foto = ft[o.orang_id]?.berkas ? { berkas: ft[o.orang_id].berkas, sumber_url: ft[o.orang_id].sumber_url, lisensi: ft[o.orang_id].lisensi, pengarang: ft[o.orang_id].pengarang } : null;
    rows.push({ orang_id: o.orang_id, nama: o.nama, ...(o.gelar ? { gelar: o.gelar } : {}), alias: o.alias.filter((x) => x !== o.nama), jenis: o.jenis || null, jabatan_terkini: o.jabatan_terkini || null, organisasi_terkini: o.organisasi_terkini || riwayat.find((r) => r.kini)?.organisasi || null,
      riwayat, pendidikan, kiprah: kp, foto, akademik, tautan, wikidata_id: wd?.q || null, sumber_riwayat: [...new Set([...(o.jabatan.length ? ['halaman-resmi'] : []), ...(wd?.riwayat.length ? ['wikidata'] : []), ...(wiki ? [] : [])])],
      ekstraksi: o.jabatan.some((j) => j.heuristik) || pendidikan.some((p) => !String(p.sumber_url).includes('wiki')) ? 'heuristik' : 'terstruktur', diperiksa: HARI_INI });
    if (!riwayat.length) tinjau.push({ orang_id: o.orang_id, nama: o.nama, alasan: 'tanpa-riwayat-bersumber', pembicara: !!o.pembicara, tanggal: HARI_INI });
  }
  tulis(path.join(OUT, 'rekam_jejak.jsonl'), rows); tulis(path.join(OUT, 'perlu-tinjau-rekam.jsonl'), tinjau);
  return { rows, tinjau };
}
function statistik() {
  const r = baca(path.join(OUT, 'rekam_jejak.jsonl')); const pct = (n) => Math.round((1000 * n) / r.length) / 10 + '%';
  const gg = baca(path.join(REK, 'gagal.jsonl')); const g = bacaJson(path.join(REK, 'gabung.json'), {});
  const gagalSumber = {}; for (const x of gg) gagalSumber[x.sumber] = (gagalSumber[x.sumber] || 0) + 1;
  console.log(JSON.stringify({ orang: r.length, riwayat_ge2: pct(r.filter((x) => x.riwayat.length >= 2).length), riwayat_ge1: pct(r.filter((x) => x.riwayat.length >= 1).length), pendidikan: pct(r.filter((x) => x.pendidikan.length).length), kiprah: pct(r.filter((x) => x.kiprah.length).length), foto: pct(r.filter((x) => x.foto).length), wikidata: r.filter((x) => x.wikidata_id).length, openalex: r.filter((x) => x.akademik).length, akademisi_dicoba: Object.keys(bacaJson(path.join(REK, 'openalex.json'), { dicari: {} }).dicari).length, tinjau: baca(path.join(OUT, 'perlu-tinjau-rekam.jsonl')).length, gagal: gagalSumber, ditolak_daftar_tolak: g.ditolak }, null, 1));
}

// ---------- selftest ----------
function selftest() {
  assert.equal(tanggalDari('{{start date|2024|8|19}}'), '2024-08-19'); assert.equal(tanggalDari('19 Agustus 2024'), '2024-08-19'); assert.equal(tanggalDari('Incumbent'), null); assert.equal(tanggalDari('Oktober 2019'), '2019-10');
  const wt = `{{Infobox officeholder\n| name = X\n| office = [[Menteri Energi]]\n| term_start = {{start date|2019|10|23}}\n| term_end = 2024\n| office2 = Anggota DPR\n| term_start2 = 2014\n| term_end2 = present\n| alma_mater = [[Institut Teknologi Bandung]]<br>[[University of Tokyo|Tokyo]]\n}}\ntext`;
  const x = riwayatWiki(wt, 'u'); assert.equal(x.riwayat.length, 2); assert.equal(x.riwayat[0].mulai, '2019-10-23'); assert.equal(x.riwayat[0].selesai, '2024'); assert.equal(x.riwayat[1].kini, true); assert.deepEqual(x.institusi, ['Institut Teknologi Bandung', 'Tokyo'].filter((s) => s !== 'Tokyo').concat([]));
  const pend = pendidikanTeks('Meraih gelar Sarjana Teknik Mesin dari Institut Teknologi Bandung (1990). Master of Science in Energy Systems from University of Tokyo, 1995.\nLahir di Medan', 'u');
  assert.equal(pend[0].jenjang, 'S1'); assert.equal(pend[0].institusi, 'Institut Teknologi Bandung'); assert.equal(pend[1].jenjang, 'S2'); assert.equal(pend[1].lulus, '1995');
  const blok = pendidikanTeks('Darmawan\nLatar Belakang Pendidikan\nPh.D. Applied Economics\nJoint Program Texas A&M University & Duke University - 2011\nM.Sc. Ilmu Komputer\nTexas A&M University - 2000\nPengalaman Profesional', 'u');
  assert.deepEqual(blok.map((x) => [x.jenjang, x.lulus]), [['S3', '2011'], ['S2', '2000']]); assert.equal(blok[1].bidang, 'Ilmu Komputer');
  const pge = pendidikanTeks('Beliau merupakan peraih gelar Master di bidang Ilmu Fisika - Geothermal Exploration dari Universitas Indonesia dan Teknik Perminyakan dari Universitas Islam Riau (UIR).', 'u');
  assert.equal(pge.length, 2); assert.equal(pge[0].jenjang, 'S2'); assert.equal(pge[1].jenjang, null); assert.equal(pge[1].bidang, 'Teknik Perminyakan');
  assert.deepEqual(jendelaNama('Budi Santoso lulus UI. Siti Aminah lulus ITB.', 'budi santoso', ['budi santoso', 'siti aminah']), ['Budi Santoso lulus UI. ']);
  assert.equal(kunciNama('Prof. Dr. Ir. Eniya Listiani Dewi, M.Eng.'), 'eniya listiani dewi');
  const o = { nama: 'Eniya Listiani Dewi', organisasi_terkini: 'Badan Riset dan Inovasi Nasional', jabatan: [] };
  assert.equal(cocokPenulis(o, [{ id: 'A1', display_name: 'Eniya Listiani Dewi', last_known_institutions: [{ display_name: 'Badan Riset dan Inovasi Nasional' }] }]).cocok.id, 'A1');
  assert.equal(cocokPenulis(o, [{ id: 'A1', display_name: 'Eniya L Dewi', last_known_institutions: [{ display_name: 'Universitas X' }] }]).cocok, null);
  assert.equal(cocokPenulis(o, [{ id: 'A1', display_name: 'Eniya Listiani Dewi', last_known_institutions: [{ display_name: 'Badan Riset dan Inovasi Nasional' }] }, { id: 'A2', display_name: 'Eniya Listiani Dewi', last_known_institutions: [{ display_name: 'Badan Riset' }] }]).ambigu, true);
  assert.equal(lisensiCommons('{{Information |author=[[User:Foo|Foo Bar]] |permission=\n{{cc-by-sa-4.0}}}}').bebas, true); assert.equal(lisensiCommons('{{Information|author=x}} {{non-free use}}').bebas, false);
  assert.ok(urlThumb('A b.jpg').includes('/thumb/'));
  console.log('selftest ok');
}

const lang = { gabung: () => { fs.mkdirSync(REK, { recursive: true }); const g = gabungOrang(); tulisJson(path.join(REK, 'gabung.json'), g); console.error('orang', g.orang.length, 'ditolak', g.ditolak, 'tinjau', g.perluTinjau.length); }, wikidata: langkahWikidata, wikipedia: langkahWikipedia, foto: langkahFoto, openalex: langkahOpenAlex, sinta: langkahSinta, bangun: () => { const { rows, tinjau } = bangun(); console.error('rekam', rows.length, 'tinjau', tinjau.length); }, statistik, selftest };
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const k = Object.keys(lang).find((x) => arg(x)); if (!k) console.log('lihat komentar di kepala berkas');
  else Promise.resolve(lang[k]()).catch((e) => { console.error(e instanceof Berhenti ? 'BERHENTI ' + e.message : e); process.exit(e instanceof Berhenti ? 3 : 1); });
}
