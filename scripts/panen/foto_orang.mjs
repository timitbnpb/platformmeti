#!/usr/bin/env node
// Foto orang tanpa foto -> data-panen/orang/foto/<id>.webp (256px) + baris foto_tambahan.jsonl (dibaca potret.mjs, lapis anggota).
//   node scripts/panen/foto_orang.mjs --selftest
//   node scripts/panen/foto_orang.mjs --cari            halaman sumber_url orang (situs resmi) -> data-panen/orang/foto_kandidat.json
//   node scripts/panen/foto_orang.mjs --ambil           kandidat yang disetujui (tidak ada "tolak") -> webp + foto_tambahan.jsonl + data/foto_orang_kredit.json
// Sumber diperbolehkan SAJA: situs resmi tempat orang menjabat / pemerintah / acara resmi / Commons berlisensi bebas.
// Bukan LinkedIn/medsos/media berita/mesin cari gambar. Identitas: nama orang harus berdekatan dengan gambar di halaman
// sumber jabatannya sendiri (nama + organisasi sudah dicocokkan oleh sumber_url jabatan). Foto tidak masuk public/ (lapis anggota, R2).
// Sopan: robots.txt per host, jeda >= 2 dtk (atau Crawl-delay), UA METI, 403/429 = host berhenti, tanpa login/CAPTCHA/formulir.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { UA, robotsBolehkan, norm } from './berita.mjs';
import { kotakCrop, deteksi } from '../pipa/foto_wajah.mjs';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const DP = AKAR + 'data-panen/orang/', KAND = DP + 'foto_kandidat.json', TAMB = DP + 'foto_tambahan.jsonl', KREDIT = AKAR + 'data/foto_orang_kredit.json';
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const hariIni = () => new Date().toISOString().slice(0, 10);
const HOST_TOLAK = /(^|\.)(linkedin|facebook|instagram|twitter|x|tiktok|youtube|google|bing|pinterest)\.com$|(^|\.)(wikipedia|wikidata)\.org$|antaranews|investortrust|kompas|detik|cnbc|liputan6|tempo\.co|bisnis\.com|kontan/i;

// ---------- murni, teruji ----------
const lepas = (s) => String(s).replace(/&amp;/g, '&').replace(/&#x2F;/gi, '/').replace(/&quot;/g, '"');
const GELAR = /\b(dr|drs|dra|ir|prof|hj?|ph d|ipu|ipm|mba|mm|msc|se|st|mt|msi|mpm|meng|sh|mhum|ak|ca|apec eng)\b/g;
export const kunciNama = (n) => norm(String(n).replace(/,.*$/, '').replace(/\([^)]*\)/g, '')).replace(GELAR, ' ').replace(/\s+/g, ' ').trim();
export function gambarDi(html, dasar) {
  const out = []; const re = /<img\b[^>]*>/gi; let m;
  while ((m = re.exec(html))) {
    const t = m[0]; const at = (k) => (t.match(new RegExp(`\\b${k}=["']([^"']*)["']`, 'i')) || [, ''])[1];
    let src = at('data-src') || at('data-lazy-src') || (at('srcset').split(',')[0] || '').trim().split(' ')[0] || at('src');
    if (!src || /^data:/.test(src)) src = at('data-src') || at('src');
    if (!src || /^data:|\.svg(\?|$)|logo|icon|sprite|banner|placeholder/i.test(src)) continue;
    try { out.push({ pos: m.index, url: new URL(lepas(src), dasar).href, alt: lepas(at('alt')) }); } catch { /* url rusak */ }
  }
  for (const u of html.matchAll(/url\(["']?([^"')]+\.(?:jpe?g|png|webp))["']?\)/gi)) { if (/logo|icon|banner|bg-/i.test(u[1])) continue; try { out.push({ pos: u.index, url: new URL(lepas(u[1]), dasar).href, alt: '' }); } catch { /* url rusak */ } }
  return out;
}
// Tiap gambar -> nama terdekat (jarak huruf di HTML, jendela 700; alt/nama berkas yang memuat nama menang). Mengembalikan Map kunciNama -> {url, jarak, alt}.
export function cocokkan(html, dasar, namaList) {
  const ims = gambarDi(html, dasar); const teks = html.toLowerCase(); const hasil = new Map();
  const kunci = namaList.map((n) => ({ n, k: kunciNama(n) })).filter((x) => x.k.split(' ').length >= 2);
  const posNama = [];
  for (const { k } of kunci) { const tok = k.split(' '); const re = new RegExp(tok.map((t) => t.replace(/[^a-z0-9]/g, '')).filter(Boolean).join('[^a-z0-9<>]{1,3}'), 'g'); for (const mm of teks.matchAll(re)) posNama.push({ k, pos: mm.index }); }
  for (const im of ims) {
    const nm = norm(decodeURIComponent(im.url.split('/').pop()) + ' ' + im.alt);
    let terbaik = null;
    for (const { k } of kunci) if (k.split(' ').every((t) => nm.split(' ').includes(t)) || (k.length >= 8 && nm.replace(/ /g, '').includes(k.replace(/ /g, '')))) terbaik = { k, jarak: 0, via: 'alt/berkas' };
    if (!terbaik) for (const p of posNama) { const j = Math.abs(p.pos - im.pos); if (j <= 700 && (!terbaik || j < terbaik.jarak)) terbaik = { k: p.k, jarak: j, via: 'dekat' }; }
    if (terbaik) { const lama = hasil.get(terbaik.k); if (!lama || terbaik.jarak < lama.jarak) hasil.set(terbaik.k, { url: im.url, jarak: terbaik.jarak, via: terbaik.via, alt: im.alt }); }
  }
  // satu gambar tidak boleh dipakai dua orang
  const dipakai = new Map(); for (const [k, v] of hasil) { const a = dipakai.get(v.url); if (!a || v.jarak < hasil.get(a).jarak) dipakai.set(v.url, k); }
  for (const [k, v] of [...hasil]) if (dipakai.get(v.url) !== k) hasil.delete(k);
  return hasil;
}

// ---------- jaringan ----------
const terakhir = new Map(), robots = new Map(), blok = new Set(), jeda = new Map();
async function ambil(url, { biner = false, batas = 2e7 } = {}) {
  const u = new URL(url), h = u.host; if (blok.has(h)) return null;
  const tunggu = (terakhir.get(h) || 0) + (jeda.get(h) || 2000) - Date.now(); terakhir.set(h, Math.max(Date.now(), terakhir.get(h) || 0) + (jeda.get(h) || 2000)); if (tunggu > 0) await tidur(tunggu);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: biner ? 'image/*' : 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(45000) });
    if (r.status === 403 && u.pathname === '/robots.txt') return ''; // bucket tanpa robots.txt: tak ada larangan
    if (r.status === 403 || r.status === 429) { blok.add(h); return null; }
    if (!r.ok) return null;
    return biner ? Buffer.from(await r.arrayBuffer()).subarray(0, batas) : (await r.text()).slice(0, 2e6);
  } catch { // fetch Node gagal (mis. TLS host tertentu): coba sekali lewat curl, UA sama
    if (!biner) return null;
    try { return execFileSync('curl', ['-s', '-f', '-m', '40', '-A', UA, url], { maxBuffer: batas }); } catch { return null; }
  }
}
async function boleh(url) {
  const u = new URL(url);
  if (!robots.has(u.host)) { jeda.set(u.host, 0); const t = (await ambil(u.origin + '/robots.txt')) || ''; const cd = t.match(/crawl-delay:\s*(\d+)/i); jeda.set(u.host, Math.max(2000, cd ? +cd[1] * 1000 : 0)); robots.set(u.host, t); }
  return robotsBolehkan(robots.get(u.host), u.pathname + u.search);
}

function fotoProses(src, dst) { // potret: persegi dari atas; foto badan penuh (tinggi > 1,25 lebar) dipotong ke kepala-bahu (setengah tinggi), 256px, webp
  const py = `
import sys
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGB'); w,h=im.size; s=min(w,h) if h<=w*1.25 else int(min(w,h*0.5)); top=0 if h<=w else int(h*0.02) if h>w*1.25 else int((h-s)*0.12); left=(w-s)//2
im.crop((left,top,left+s,top+s)).resize((256,256),Image.LANCZOS).save(sys.argv[2],'WEBP',quality=82)`;
  execFileSync('python3', ['-c', py, src, dst]);
}

const baca = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);

function sasaran() { // orang tanpa foto (foto_peta potret + foto_tambahan), bukan pengurus METI (situs METI sudah habis dipanen)
  const orang = JSON.parse(fs.readFileSync(AKAR + 'public/data/orang.json', 'utf8')).baris;
  const punya = new Set(Object.keys(JSON.parse(fs.readFileSync(AKAR + 'data-panen/potret/foto_peta.json', 'utf8'))).map((k) => k.split('/')[1].split('.')[0]));
  for (const f of baca(TAMB)) punya.add(f.orang_id);
  return orang.filter((o) => !punya.has(o.id));
}

async function cari() {
  const T = sasaran(); const namaPerUrl = new Map();
  for (const o of T) for (const j of o.jabatan || []) { const u = j.sumber_url; if (!/^https?:/.test(u || '') || HOST_TOLAK.test(new URL(u).host)) continue; (namaPerUrl.get(u) || namaPerUrl.set(u, new Map()).get(u)).set(o.id, o.nama); }
  const kand = fs.existsSync(KAND) ? JSON.parse(fs.readFileSync(KAND, 'utf8')) : {}; const log = [];
  for (const [url, ids] of namaPerUrl) {
    if (!(await boleh(url))) { log.push({ url, status: 'robots' }); continue; }
    const html = await ambil(url); if (!html) { log.push({ url, status: 'gagal' }); continue; }
    const kunciKeId = new Map([...ids].map(([id, n]) => [kunciNama(n), id]));
    const hit = cocokkan(html, url, [...ids.values()]); let n = 0;
    for (const [k, v] of hit) { const id = kunciKeId.get(k); if (id && !kand[id]) { kand[id] = { nama: ids.get(id), halaman: url, foto_url: v.url, via: v.via, jarak: v.jarak, alt: v.alt }; n++; } }
    log.push({ url, status: 'ok', orang: ids.size, kandidat: n });
  }
  fs.writeFileSync(KAND, JSON.stringify(kand, null, 1));
  console.log(JSON.stringify({ sasaran: T.length, halaman: namaPerUrl.size, kandidat: Object.keys(kand).length }));
  for (const l of log) console.error(JSON.stringify(l));
}

async function ambilFoto() {
  const kand = JSON.parse(fs.readFileSync(KAND, 'utf8')); const tmb = baca(TAMB); const ada = new Set(tmb.map((t) => t.orang_id));
  const kredit = fs.existsSync(KREDIT) ? JSON.parse(fs.readFileSync(KREDIT, 'utf8')) : { baris: [] }; const kk = new Set(kredit.baris.map((b) => b.orang_id));
  let baru = 0;
  for (const [id, c] of Object.entries(kand)) {
    if (c.tolak || ada.has(id)) continue;
    if (!(await boleh(c.foto_url))) continue;
    const b = await ambil(c.foto_url, { biner: true }); if (!b || b.length < 2000) continue;
    const tmp = DP + 'foto/' + id + '.img', dst = DP + 'foto/' + id + '.webp'; fs.writeFileSync(tmp, b);
    try { fotoProses(tmp, dst); } catch { fs.rmSync(tmp, { force: true }); continue; } fs.rmSync(tmp, { force: true });
    const hak = c.hak || 'milik pemilik situs sumber, tampil dengan atribusi';
    fs.appendFileSync(TAMB, JSON.stringify({ orang_id: id, nama: c.nama, foto_file: 'foto/' + id + '.webp', sumber_url: c.halaman, foto_url: c.foto_url, hak, diambil: hariIni() }) + '\n');
    if (!kk.has(id)) kredit.baris.push({ orang_id: id, nama: c.nama, sumber_url: c.halaman, foto_url: c.foto_url, lisensi: hak, diambil: hariIni() });
    baru++;
  }
  kredit.baris.sort((a, b) => a.orang_id.localeCompare(b.orang_id));
  fs.writeFileSync(KREDIT, JSON.stringify(kredit, null, 1) + '\n');
  console.log(JSON.stringify({ foto_baru: baru, total_kredit: kredit.baris.length }));
}


// ---------- foto pengurus METI: public/img/pengurus/<slug>.webp (640px HD, <= 60 KB, kualitas 82 turun bila perlu, persegi berpusat wajah, latar putih; alfa diratakan) ----------
//   node scripts/panen/foto_orang.mjs --pengurus   baca data-panen/orang/foto_pengurus.json [{nama, foto_url, halaman, hak, penulis?}] -> unduh (robots+jeda), crop wajah, tulis webp + kredit
//   lalu: node scripts/pipa/pengurus_foto_isi.mjs  (mengisi field foto lewat sambungPengurusMeti di potret.mjs)
export const slugPengurus = (n) => norm(n).replace(/ /g, '-');
const PENGURUS = DP + 'foto_pengurus.json', IMG = AKAR + 'public/img/pengurus/';
function cropPengurus(src, dst, { x, y, s }) {
  const py = `
import sys,io
from PIL import Image
x,y,s=map(int,sys.argv[3:6])
im=Image.open(sys.argv[1]).convert("RGBA")
bg=Image.new("RGBA",im.size,"white"); im=Image.alpha_composite(bg,im).convert("RGB")
im=im.crop((x,y,x+s,y+s)).resize((640,640),Image.LANCZOS)
for q in (82,78,74,70,66,62,56,50):
    b=io.BytesIO(); im.save(b,"WEBP",quality=q,method=6)
    if len(b.getvalue())<=60000: break
open(sys.argv[2],"wb").write(b.getvalue())`;
  execFileSync('python3', ['-c', py, src, dst, x, y, s].map(String));
}
async function pengurus() {
  const daftar = JSON.parse(fs.readFileSync(PENGURUS, 'utf8')); const kredit = JSON.parse(fs.readFileSync(KREDIT, 'utf8')); const lapor = { ok: [], gagal: [] };
  fs.mkdirSync(DP + 'foto_raw', { recursive: true });
  for (const c of daftar) {
    const sl = slugPengurus(c.nama), dst = IMG + sl + '.webp'; if (fs.existsSync(dst) && !process.argv.includes('--ulang')) continue;
    if (HOST_TOLAK.test(new URL(c.foto_url).host) && !/commons\.wikimedia|upload\.wikimedia/.test(c.foto_url)) { lapor.gagal.push([c.nama, 'host-tolak']); continue; }
    if (!(await boleh(c.foto_url))) { lapor.gagal.push([c.nama, 'robots']); continue; }
    const b = await ambil(c.foto_url, { biner: true, batas: 8e7 }); if (!b || b.length < 2000) { lapor.gagal.push([c.nama, 'unduh']); continue; }
    const raw = DP + 'foto_raw/pengurus-' + sl + '.img'; fs.writeFileSync(raw, b);
    try {
      const [h] = deteksi([raw]); if (!h?.w1) { lapor.gagal.push([c.nama, 'wajah-tak-terdeteksi']); continue; }
      const kt = kotakCrop(h.w, h.h, h.w1); cropPengurus(raw, dst, kt); const sisi = kt.s;
      kredit.baris = kredit.baris.filter((k) => k.pengurus !== sl);
      kredit.baris.push({ orang_id: c.orang_id || null, pengurus: sl, nama: c.nama, sumber_url: c.halaman, foto_url: c.foto_url, lisensi: c.hak, ...(c.penulis ? { penulis: c.penulis } : {}), sisi_sumber_px: sisi, diambil: c.diambil || hariIni() });
      lapor.ok.push([c.nama, sisi]);
    } catch (e) { lapor.gagal.push([c.nama, 'proses:' + String(e.message).slice(0, 60)]); }
  }
  kredit.baris.sort((a, b) => (a.orang_id || a.pengurus).localeCompare(b.orang_id || b.pengurus));
  fs.writeFileSync(KREDIT, JSON.stringify(kredit, null, 1) + '\n');
  console.log(JSON.stringify({ ok: lapor.ok.length, gagal: lapor.gagal }));
}

function selftest() {
  assert.equal(slugPengurus('Dr. Ir. A. Feiral Batubara'), 'dr-ir-a-feiral-batubara');
  assert.equal(kunciNama('Ir. Nur Pamudji, MPM., M.Eng., IPU'), 'nur pamudji');
  const h = '<div><img src="/a/p1.jpg" alt=""><h3>Budi Santoso</h3><p>Direktur</p></div><div><img data-src="/a/p2.jpg" alt="Siti Aminah"><h3>Siti Aminah</h3></div>';
  const r = cocokkan(h, 'https://x.id/t', ['Budi Santoso', 'Siti Aminah']);
  assert.equal(r.get('budi santoso').url, 'https://x.id/a/p1.jpg'); assert.equal(r.get('siti aminah').url, 'https://x.id/a/p2.jpg');
  assert.equal(cocokkan('<img src="/logo.png"><b>Budi Santoso</b>', 'https://x.id/', ['Budi Santoso']).size, 0);
  console.log('selftest ok');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else if (process.argv.includes('--cari')) await cari();
  else if (process.argv.includes('--ambil')) await ambilFoto();
  else if (process.argv.includes('--pengurus')) await pengurus();
  else console.log('pakai --selftest | --cari | --ambil | --pengurus');
}
