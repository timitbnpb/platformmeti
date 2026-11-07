#!/usr/bin/env node
// Panen pengurus (direksi, komisaris, pimpinan) + foto resmi untuk organisasi di public/data/organisasi.json yang belum punya pengurus.
//   node scripts/panen/panen_pengurus.mjs --uji       uji parser, tanpa jaringan
//   node scripts/panen/panen_pengurus.mjs --ambil     situs resmi (beranda -> halaman direksi/manajemen/pimpinan) -> baris di
//                                                     data-panen/{perusahaan,lembaga}/pengurus.jsonl (format yang sudah dibaca potret.mjs)
//   node scripts/panen/panen_pengurus.mjs --bersih <dir>  saring ulang baris panen baru (dir = cadangan <perusahaan|lembaga>-pengurus.jsonl sebelum panen)
//   node scripts/panen/panen_pengurus.mjs --foto      foto_raw + foto lama -> public/img/orang/<orang_id>.webp (256px, <= 30 KB) + data/foto_orang_kredit.json
// Etika (sama dengan panen_perusahaan.mjs): UA jujur tanpa surel, robots.txt dibaca dulu + Crawl-delay, jeda >= 2 dtk per host,
// 403/429 = host dihentikan, tanpa login/CAPTCHA/medsos/LinkedIn/paywall. Foto hanya dari domain situs yang sama. Tanpa surel/HP orang.
// Ekstraksi heuristik teks halaman (ekstraksi:'heuristik', tingkat_bukti 'kata-pihak'). Daftar tolak: nama di daftar-tolak-calon.jsonl dilewati.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { teks, namaOk, kunciNama, jenisJabatan, fotoKandidat, uraiPengurus } from './panen_perusahaan.mjs';
import { namaBaku } from '../../public/inti/nama_baku.js';

const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DP = path.join(ROOT, 'data-panen');
const HARI_INI = new Date().toISOString().slice(0, 10);
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);
const baca = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const tulis = (f, rows) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '')); };
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const HOST_TOLAK = /(^|\.)(linkedin|facebook|instagram|twitter|x|tiktok|youtube|google|bing|pinterest)\.com$/i;

// ---------- parser murni ----------
// Jabatan pimpinan lembaga (kementerian, asosiasi, kampus, lembaga internasional) di luar RE_JAB direksi/komisaris milik panen_perusahaan.
const JAB_LEMBAGA = /^(?:(?:wakil|deputy|vice)\s+)?(?:menteri|kepala|ketua|sekretaris\s+(?:jenderal|umum|eksekutif|utama)|direktur(?:\s+(?:jenderal|eksekutif|utama))?|presiden|rektor|gubernur|bendahara|executive\s+director|director(?:\s+general)?|chair(?:man|person|woman)?|president|secretary[- ]general|head\s+of\s+\w+|country\s+director|ceo|chief\s+\w+\s+officer)\b[^.;:]*$/i;
const jabLembagaOk = (s) => { const t = s.trim(); return t.length >= 4 && t.length <= 80 && t.split(' ').length <= 10 && JAB_LEMBAGA.test(t) && !/\b(untuk|dalam|yang|adalah|memiliki|bertugas)\b/i.test(t); };
// Layout A (nama lalu jabatan) atau B (jabatan lalu nama), diputuskan dari jabatan pertama; juga "Nama - Jabatan" sebaris.
export function uraiLembaga(t) {
  const L = t.split('\n').map((s) => s.trim()).filter(Boolean); const hasil = []; const lihat = new Set();
  const tambah = (n, j) => { const k = kunciNama(n.nama); if (!lihat.has(k)) { lihat.add(k); hasil.push({ ...n, jabatan: j }); } };
  for (const l of L) for (const sep of [' - ', ' – ', ' | ', ', ']) { const p = l.split(sep); if (p.length === 2 && jabLembagaOk(p[1]) && namaOk(p[0])) tambah(namaOk(p[0]), p[1].trim()); }
  const idx = []; L.forEach((l, i) => { if (jabLembagaOk(l)) idx.push(i); });
  const A = idx.length && idx[0] > 0 && namaOk(L[idx[0] - 1]);
  for (const i of idx) { const n = A ? namaOk(L[i - 1] || '') : namaOk(L[i + 1] || ''); if (n) tambah(n, L[i]); }
  return hasil;
}
const rapiJab = (j) => { const t = j.replace(/[—–]/g, ', ').replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim(); return /[a-z]/.test(t) ? t : namaBaku(t).nama; };
// Penyaring mutu: kata menu/judul di kolom nama, jabatan beranggal atau bertempel organisasi lain, pejabat eselon bawah, direktur bidang di lembaga.
const KATA_BUKAN_NAMA = new Set('our structure research announcement program history main current lambang pimpinan universitas tinjau dari lhkpn komisi wakil ketua kepala direktur sekretaris menteri presiden rektor messages message profile profil organisasi struktur tentang visi misi sambutan berita pengumuman layanan unit biro bagian fakultas direksi komisaris dewan board management leadership representative member officer pejabat penghargaan pemerintah sebut ajak'.split(' '));
export function layak(x, lembaga) {
  const j = x.jabatan || '';
  if (x.nama.split(/\s+/).some((k) => KATA_BUKAN_NAMA.has(k.toLowerCase().replace(/[^a-z]/g, '')))) return false;
  if (/\d{4}|\bPT\b|\bat\b|\b(?:RS|Mall)\b|,\s*$/.test(j) || /\bof\s+[A-Z][A-Za-z]+(\s+[A-Z][A-Za-z]+)?$/.test(j) && /(vice president|chairman|president) of/i.test(j)) return false;
  if (lembaga && (/^(kepala|ketua)\s+(biro|bagian|unit|bidang|subbagian|sub|pusat|kantor|lembaga|program studi|departemen|divisi|seksi|laboratorium|lkst)\b/i.test(j) || (/^(direktur|director)\b/i.test(j) && !/utama|jenderal|eksekutif|executive|general/i.test(j)))) return false;
  return true;
}
// Tolak: daftar tolak, orang berjabatan "alm."/"almarhum", dan nama berpola menu/halaman.
export function bersihkan(hasil, tolak, teksHalaman, lembaga = false) {
  const lo = teksHalaman.toLowerCase();
  return hasil.map((x) => {
    const nm = namaBaku(x.nama.replace(/\s+/g, ' ')).nama;
    return { ...x, nama: nm, jabatan: rapiJab(x.jabatan) };
  }).filter((x) => {
    const k = kunciNama(x.nama); if (!k || tolak.has(k) || !layak(x, lembaga)) return false;
    const i = lo.indexOf(x.nama.toLowerCase()); const sekitar = i >= 0 ? lo.slice(Math.max(0, i - 8), i + x.nama.length + 20) : '';
    return !/\b(alm\.?|almarhum|almarhumah|late)\b|\b(tersangka|terdakwa|terpidana)\b/.test(sekitar);
  });
}

// ---------- jaringan sopan ----------
const robots = new Map(), gap = new Map(), terakhir = new Map(), blok = new Set(), antre = new Map();
async function tunggu(u, aksi) { // jeda per host, serial per host
  const host = new URL(u).host;
  const sebelum = antre.get(host) || Promise.resolve();
  const giliran = sebelum.then(async () => { const d = (terakhir.get(host) || 0) + Math.max(2200, gap.get(host) || 0) - Date.now(); if (d > 0) await tidur(d); terakhir.set(host, Date.now()); });
  antre.set(host, giliran.catch(() => {})); await giliran;
  return fetch(u, { headers: { 'User-Agent': UA, Accept: aksi }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
}
async function robotsOk(u) {
  const { origin, pathname, search, host } = new URL(u);
  if (!robots.has(origin)) {
    const aturan = [];
    try {
      const r = await tunggu(origin + '/robots.txt', 'text/plain');
      if (r.status === 403 || r.status === 429) blok.add(host);
      else if (r.status === 200) {
        let ua = false;
        for (const b of (await r.text()).split(/\r?\n/)) {
          const m = b.match(/^\s*([a-z-]+)\s*:\s*(.*?)\s*(#.*)?$/i); if (!m) continue; const k = m[1].toLowerCase();
          if (k === 'user-agent') ua = m[2] === '*'; else if (ua && k === 'crawl-delay' && +m[2] > 0) gap.set(host, Math.min(+m[2], 60) * 1000); else if (ua && (k === 'disallow' || k === 'allow') && m[2]) aturan.push([k, m[2]]);
        }
      }
    } catch { /* tak terjangkau: halaman berikutnya juga gagal sendiri */ }
    robots.set(origin, aturan);
  }
  let terbaik = null; const jalur = pathname + search;
  for (const [k, p] of robots.get(origin)) { const re = new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\?/g, '\\?').replace(/\*/g, '.*').replace(/\\\$$/, '$')); if (re.test(jalur) && (!terbaik || p.length > terbaik[1].length || (p.length === terbaik[1].length && k === 'allow'))) terbaik = [k, p]; }
  return !blok.has(host) && (!terbaik || terbaik[0] === 'allow');
}
async function halaman(u, log) { // -> {html, final} | null
  const host = new URL(u).host;
  if (HOST_TOLAK.test(host) || blok.has(host)) return null;
  try {
    if (!(await robotsOk(u))) { log.push({ url: u, alasan: blok.has(host) ? 'host-dihentikan' : 'robots-tolak' }); return null; }
    const r = await tunggu(u, 'text/html,application/xhtml+xml');
    if (r.status === 403 || r.status === 429) { blok.add(host); log.push({ url: u, alasan: 'http-' + r.status + '-host-dihentikan' }); return null; }
    if (r.status !== 200 || !/html/.test(r.headers.get('content-type') || 'html')) { log.push({ url: u, alasan: 'http-' + r.status }); return null; }
    return { html: (await r.text()).slice(0, 3e6), final: r.url || u };
  } catch (e) { log.push({ url: u, alasan: 'jaringan:' + (e.cause?.code || e.name) }); return null; }
}
async function unduhFoto(u, tujuan, log) {
  try {
    if (!(await robotsOk(u))) { log.push({ url: u, alasan: 'foto-robots-tolak' }); return false; }
    const r = await tunggu(u, 'image/*');
    if (r.status !== 200) { log.push({ url: u, alasan: 'foto-http-' + r.status }); return false; }
    const b = Buffer.from(await r.arrayBuffer());
    if (!/^image\/(jpe?g|png|webp)/.test(r.headers.get('content-type') || '') || b.length < 4000 || b.length > 6e6) { log.push({ url: u, alasan: 'foto-tipe-atau-ukuran:' + b.length }); return false; }
    fs.mkdirSync(path.dirname(tujuan), { recursive: true }); fs.writeFileSync(tujuan, b); return true;
  } catch (e) { log.push({ url: u, alasan: 'foto-jaringan:' + (e.cause?.code || e.name) }); return false; }
}

// ---------- panen ----------
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#x2F;/gi, '/');
function kandidatHalaman(html, base) {
  const dom = (h) => { const p = h.replace(/^www\./, '').split('.'); return /^(co|or|go|ac|web|sch)$/.test(p.at(-2)) ? p.slice(-3).join('.') : p.slice(-2).join('.'); };
  const cand = new Map();
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let u; try { u = new URL(dec(m[1]), base); } catch { continue; }
    if (!/^https?:$/.test(u.protocol) || dom(u.hostname) !== dom(base.hostname) || /\.(pdf|jpe?g|png|zip|docx?|xlsx?|pptx?)$/i.test(u.pathname)) continue;
    const s = teks(m[2]).replace(/\n/g, ' ') + ' ' + u.pathname;
    const skor = /(direksi|board of directors|dewan direksi|dewan komisaris|board of commissioners)/i.test(s) ? 4 : /(pimpinan|leadership|management|manajemen|executive team|our people|pejabat|pengurus|struktur-organisasi|struktur organisasi|susunan)/i.test(s) ? 3 : /(tata kelola|governance|profil|profile|tentang|about)/i.test(s) ? 1 : 0;
    if (skor && (cand.get(u.href) || 0) < skor) cand.set(u.href, skor);
  }
  return [...cand].sort((a, b) => b[1] - a[1]).slice(0, 4).map((x) => x[0]);
}

async function ambil() {
  const org = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/organisasi.json'), 'utf8')).baris;
  const sasaran = org.filter((o) => o.situs && !o.pengurus && !/^https?:\/\/(www\.)?(linkedin|facebook|instagram)/.test(o.situs));
  const tolak = new Set(baca(path.join(DP, 'orang/daftar-tolak-calon.jsonl')).map((x) => kunciNama(x.nama)));
  const orangIdx = new Map(); for (const o of baca(path.join(DP, 'orang/orang.jsonl'))) { const k = kunciNama(o.nama); orangIdx.set(k, orangIdx.has(k) ? 'ambigu' : o.orang_id); }
  const fPer = path.join(DP, 'perusahaan/pengurus.jsonl'), fLem = path.join(DP, 'lembaga/pengurus.jsonl');
  const per = baca(fPer), lem = baca(fLem); const log = []; const ringkas = { organisasi: sasaran.length, berhasil: 0, orang: 0, foto: 0, diblokir: [] };
  const kerja = async (o) => {
    const adaPer = o.id.startsWith('p_'), adaLem = o.id.startsWith('l_'); if (!adaPer && !adaLem) return;
    const lg = []; const h = await halaman(o.situs, lg); if (!h) { log.push(...lg.map((x) => ({ ...x, organisasi_id: o.id }))); return; }
    const base = new URL(h.final);
    const urut = [h.final, ...kandidatHalaman(h.html, base)].filter((u, i, a) => a.indexOf(u) === i);
    let dapat = [];
    for (const u of urut) {
      const hp = u === h.final ? h : await halaman(u, lg); if (!hp) continue;
      const t = teks(hp.html);
      let hasil = adaPer ? uraiPengurus(t) : [];
      if (hasil.length < 2) hasil = uraiLembaga(t);
      hasil = bersihkan(hasil, tolak, t, !adaPer).slice(0, 14);
      if (hasil.length < 2) continue;
      const fotoU = fotoKandidat(hp.html, hasil.map((x) => x.nama), hp.final);
      hasil.forEach((x, i) => { x.foto_url = fotoU[i] || null; x.sumber_url = hp.final; });
      dapat = hasil; break;
    }
    log.push(...lg.map((x) => ({ ...x, organisasi_id: o.id })));
    if (!dapat.length) { log.push({ organisasi_id: o.id, url: o.situs, alasan: 'halaman-pengurus-tak-terurai:' + urut.length + '-halaman' }); return; }
    ringkas.berhasil++;
    for (const x of dapat) {
      const kn = kunciNama(x.nama); const oid0 = orangIdx.get(kn); const orang_id = oid0 && oid0 !== 'ambigu' ? oid0 : 'o_' + sha(kn);
      let foto_berkas = null;
      if (x.foto_url) { const ext = (x.foto_url.split('?')[0].match(/\.(jpe?g|png|webp)$/i) || [, 'jpg'])[1].toLowerCase(); const f = path.join(DP, 'orang/foto_raw', orang_id + '.' + ext); if (fs.existsSync(f) || await unduhFoto(x.foto_url, f, log)) foto_berkas = 'foto_raw/' + orang_id + '.' + ext; }
      const dasar = { orang_id, nama: x.nama, jabatan: x.jabatan, sumber_url: x.sumber_url, tanggal_ambil: HARI_INI, tingkat_bukti: 'kata-pihak', ekstraksi: 'heuristik', foto_url: x.foto_url, foto_sumber: foto_berkas ? x.sumber_url : null, foto_berkas };
      if (adaPer) { const pid = 'g_' + sha(o.id + kn + x.jabatan.toLowerCase()); if (!per.some((p) => p.pengurus_id === pid)) per.push({ pengurus_id: pid, perusahaan_id: o.id, ...dasar, gelar: x.gelar, jenis_jabatan: jenisJabatan(x.jabatan), mulai: null, orang_baru: !(oid0 && oid0 !== 'ambigu'), hak_cipta: foto_berkas ? 'milik pemilik situs sumber, tampil dengan atribusi' : null }); }
      else if (!lem.some((p) => p.lembaga_id === o.id && p.orang_id === orang_id)) lem.push({ lembaga_id: o.id, ...dasar, periode: { mulai: null, selesai: null }, status: 'menjabat' });
      ringkas.orang++; if (foto_berkas) ringkas.foto++;
    }
    tulis(fPer, per); tulis(fLem, lem);
  };
  const antreO = [...sasaran]; await Promise.all(Array.from({ length: 6 }, async () => { while (antreO.length) { try { await kerja(antreO.shift()); } catch (e) { log.push({ alasan: 'galat:' + e.message }); } } }));
  tulis(fPer, per); tulis(fLem, lem);
  ringkas.diblokir = [...blok];
  const gagalF = path.join(DP, 'orang/pengurus_gagal.jsonl'); tulis(gagalF, [...baca(gagalF), ...log.map((x) => ({ ...x, tanggal: HARI_INI }))]);
  console.log(JSON.stringify(ringkas));
}

// Terapkan penyaring mutu ke baris heuristik hasil panen ini (yang tidak ada di cadangan sebelum panen); baris lama tak disentuh.
function bersihLama(cadangDir) {
  let buang = 0;
  for (const [f, id, lem] of [[path.join(DP, 'perusahaan/pengurus.jsonl'), 'perusahaan_id', false], [path.join(DP, 'lembaga/pengurus.jsonl'), 'lembaga_id', true]]) {
    const lama = new Set(baca(path.join(cadangDir, path.basename(path.dirname(f)) + '-' + path.basename(f))).map((x) => JSON.stringify(x)));
    const baru = baca(f).filter((x) => { if (lama.has(JSON.stringify(x))) return true; const ok = layak(x, lem) && !/^(Ketua Umum|Our Structure)$/.test(x.nama); if (ok) x.jabatan = rapiJab(x.jabatan); else buang++; return ok; });
    tulis(f, baru);
  }
  console.log(JSON.stringify({ dibuang: buang }));
}

// ---------- foto -> public/img/orang ----------
const PY = `
import sys
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGB'); w,h=im.size
if min(w,h)<90: sys.exit(2)
s=min(w,h) if h<=w*1.25 else int(min(w,h*0.5)); top=0 if h<=w else int(h*0.02); left=(w-s)//2
im=im.crop((left,top,left+s,top+s)).resize((256,256),Image.LANCZOS)
for q in (82,72,62,52,42):
    im.save(sys.argv[2],'WEBP',quality=q,method=6)
    import os
    if os.path.getsize(sys.argv[2])<=30000: break
else: sys.exit(3)`;
function foto() {
  const keluar = path.join(ROOT, 'public/img/orang'); fs.mkdirSync(keluar, { recursive: true });
  const fK = path.join(ROOT, 'data/foto_orang_kredit.json'); const kredit = JSON.parse(fs.readFileSync(fK, 'utf8')); const sudahK = new Set(kredit.baris.map((b) => b.orang_id));
  const sumber = []; // {orang_id, nama, berkas, sumber_url, foto_url, lisensi}
  for (const p of baca(path.join(DP, 'perusahaan/pengurus.jsonl'))) if (p.foto_berkas && p.orang_id) sumber.push({ orang_id: p.orang_id, nama: p.nama, berkas: path.join(DP, p.foto_berkas.startsWith('foto_raw') ? 'orang/' + p.foto_berkas : 'perusahaan/' + p.foto_berkas), sumber_url: p.foto_sumber || p.sumber_url, foto_url: p.foto_url, lisensi: p.hak_cipta });
  for (const p of baca(path.join(DP, 'lembaga/pengurus.jsonl'))) if (p.foto_berkas && p.orang_id) sumber.push({ orang_id: p.orang_id, nama: p.nama, berkas: path.join(DP, 'orang/' + p.foto_berkas), sumber_url: p.foto_sumber || p.sumber_url, foto_url: p.foto_url, lisensi: 'milik pemilik situs sumber, tampil dengan atribusi' });
  let n = 0, gagal = 0;
  for (const s of sumber) {
    const dst = path.join(keluar, s.orang_id + '.webp'); if (fs.existsSync(dst) || !fs.existsSync(s.berkas)) continue;
    try { execFileSync('python3', ['-c', PY, s.berkas, dst]); } catch { gagal++; fs.rmSync(dst, { force: true }); continue; }
    n++; if (!sudahK.has(s.orang_id)) { kredit.baris.push({ orang_id: s.orang_id, nama: s.nama, sumber_url: s.sumber_url, foto_url: s.foto_url, lisensi: s.lisensi || 'milik pemilik situs sumber, tampil dengan atribusi', diambil: HARI_INI }); sudahK.add(s.orang_id); }
  }
  kredit.baris.sort((a, b) => a.orang_id.localeCompare(b.orang_id));
  fs.writeFileSync(fK, JSON.stringify(kredit, null, 1) + '\n');
  console.log(JSON.stringify({ foto_baru: n, gagal, total_berkas: fs.readdirSync(keluar).length }));
}

function uji() {
  const t = 'Direksi\nBudi Santoso\nDirektur Utama\nSiti Aminah\nDirektur Keuangan\nHalaman lain\nKetua Umum\nANDI WIJAYA\nKepala Badan\nSri Rahayu';
  const h = uraiLembaga('Ketua Umum\nAndi Wijaya\nSekretaris Jenderal\nSri Rahayu, M.Sc.');
  assert.deepEqual(h.map((x) => x.nama), ['Andi Wijaya', 'Sri Rahayu']);
  const b = bersihkan(uraiLembaga('Menteri\nANDI WIJAYA\nKetua\nBudi Hartono\nSekretaris\nAlm. Joko Susilo'), new Set(['budi hartono']), 'menteri andi wijaya ketua budi hartono sekretaris alm. joko susilo');
  assert.deepEqual(b.map((x) => x.nama), ['Andi Wijaya'], t);
  assert.ok(!b.some((x) => /[—]/.test(x.jabatan)));
  console.log('uji ok');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--uji')) uji(); else if (process.argv.includes('--ambil')) await ambil(); else if (process.argv.includes('--foto')) foto(); else if (process.argv.includes('--bersih')) bersihLama(process.argv[process.argv.indexOf('--bersih') + 1]); else console.log('pakai --uji | --ambil | --foto');
}
