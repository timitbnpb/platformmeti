#!/usr/bin/env node
// Crop wajah otomatis (macOS Vision lewat wajah.swift + PIL; tanpa dependensi npm baru).
//   node scripts/pipa/foto_wajah.mjs            kering: hanya laporan
//   node scripts/pipa/foto_wajah.mjs --terapkan tulis crop (persegi, wajah di tengah, ruang atas 30% tinggi wajah, 256px) + data/foto_wajah.json
//   node scripts/pipa/foto_wajah.mjs --ulang    abaikan catatan lama
// Sasaran (pengurus *-b.webp potongan transparan TIDAK disentuh, 8 Nov 2026): public/img/orang/*, data-panen/orang/foto/* (sumber asli di foto_raw/<id>.* bila ada).
// Wajah tak terdeteksi: berkas dipindah ke data-panen/foto_tinjau/ (avatar kembali ke inisial) dan didaftar di data/foto_wajah.json.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AKAR = fileURLToPath(new URL('../..', import.meta.url)), CATAT = AKAR + 'data/foto_wajah.json', TINJAU = AKAR + 'data-panen/foto_tinjau/';
const GAMBAR = /\.(jpe?g|png|webp)$/i;

// Murni: kotak wajah [x,y,w,h] di gambar W x H -> {x,y,s} kotak persegi. Ruang atas kepala 30% tinggi wajah; wajah mengisi ~45% sisi.
export function kotakCrop(W, H, [fx, fy, fw, fh]) {
  let s = Math.round(Math.max(fh * 2.2, fw * 2.0));
  s = Math.min(s, W, H);
  let y = Math.round(fy - 0.3 * fh), x = Math.round(fx + fw / 2 - s / 2);
  x = Math.max(0, Math.min(x, W - s)); y = Math.max(0, Math.min(y, H - s));
  return { x, y, s };
}

function deteksi(berkas) {
  const bin = path.join(os.tmpdir(), 'meti-wajah');
  if (!fs.existsSync(bin)) execFileSync('swiftc', ['-O', fileURLToPath(new URL('./wajah.swift', import.meta.url)), '-o', bin]);
  return execFileSync(bin, berkas, { maxBuffer: 1 << 26 }).toString().trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
}
function potong(src, dst, { x, y, s }) {
  const py = 'import sys\nfrom PIL import Image\nx,y,s=map(int,sys.argv[3:6])\nim=Image.open(sys.argv[1]).convert("RGBA")\nfmt=sys.argv[2].rsplit(".",1)[1].lower()\nif fmt in ("jpg","jpeg"):\n  bg=Image.new("RGBA",im.size,"white")\n  im=Image.alpha_composite(bg,im).convert("RGB")\nim=im.crop((x,y,x+s,y+s)).resize((256,256),Image.LANCZOS)\nim.save(sys.argv[2],{"jpg":"JPEG","jpeg":"JPEG","png":"PNG","webp":"WEBP"}[sys.argv[2].rsplit(".",1)[1].lower()],quality=84)';
  const tmp = dst + '.tmp.' + dst.split('.').pop();
  execFileSync('python3', ['-c', py, src, tmp, x, y, s].map(String)); fs.renameSync(tmp, dst);
}
const daftar = (d, f) => (fs.existsSync(d) ? fs.readdirSync(d).filter(f).map((n) => d + n) : []);

function selftest() {
  assert.deepEqual(kotakCrop(1000, 1000, [400, 300, 100, 100]), { x: 340, y: 270, s: 220 });
  const k = kotakCrop(1460, 1200, [625, 157, 187, 187]); assert.ok(k.s <= 1200 && k.x >= 0 && k.y >= 0 && k.y <= 157);
  assert.deepEqual(kotakCrop(200, 100, [10, 10, 40, 40]), { x: 0, y: 0, s: 88 }); // tepi: terjepit di dalam gambar
  console.log('foto_wajah selftest ok');
}

if (process.argv.includes('--selftest')) selftest();
else if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const terapkan = process.argv.includes('--terapkan'), ulang = process.argv.includes('--ulang');
  const lama = fs.existsSync(CATAT) ? JSON.parse(fs.readFileSync(CATAT, 'utf8')) : { baris: [] };
  const peta = new Map(lama.baris.map((b) => [b.berkas, b]));
  const sasaran = [
    ...daftar(AKAR + 'public/img/orang/', (n) => GAMBAR.test(n)),
    ...daftar(AKAR + 'data-panen/orang/foto/', (n) => GAMBAR.test(n)),
  ];
  const rawDari = (f) => { const id = path.basename(f).replace(/\.[^.]+$/, ''); return daftar(AKAR + 'data-panen/orang/foto_raw/', (n) => n.replace(/\.[^.]+$/, '') === id)[0] || f; };
  const kerja = sasaran.filter((f) => ulang || peta.get(path.relative(AKAR, f))?.status !== 'ok');
  const sumber = kerja.map(rawDari), hasil = deteksi(sumber), cacah = { ok: 0, gagal: 0, tidak_terdeteksi: 0 };
  kerja.forEach((f, i) => {
    const rel = path.relative(AKAR, f), h = hasil[i]; let b;
    try {
      if (!h.w) b = { berkas: rel, status: 'gagal' };
      else if (!h.w1) b = { berkas: rel, status: 'tidak_terdeteksi', sumber_px: [h.w, h.h] };
      else { const c = kotakCrop(h.w, h.h, h.w1); b = { berkas: rel, status: 'ok', sumber_px: [h.w, h.h], crop: [c.x, c.y, c.s] }; if (terapkan) potong(sumber[i], f, c); }
      if (terapkan && b.status === 'tidak_terdeteksi' && (f.includes('/data-panen/') || f.includes('/public/img/orang/'))) { fs.mkdirSync(TINJAU, { recursive: true }); fs.renameSync(f, TINJAU + path.basename(f)); b.dipindah = 'data-panen/foto_tinjau/' + path.basename(f); }
    } catch (e) { b = { berkas: rel, status: 'gagal', galat: String(e.message).slice(0, 120) }; }
    cacah[b.status]++; peta.set(rel, b);
  });
  console.log(JSON.stringify({ diperiksa: kerja.length, dilewati: sasaran.length - kerja.length, ...cacah, terapkan }));
  if (terapkan) fs.writeFileSync(CATAT, JSON.stringify({ diperbarui: new Date().toISOString().slice(0, 10), aturan: 'persegi 256px, ruang atas 30% tinggi wajah; crop = [x,y,sisi] dalam piksel sumber', baris: [...peta.values()].sort((a, b) => a.berkas.localeCompare(b.berkas)) }, null, 1) + '\n');
  for (const b of peta.values()) if (b.status !== 'ok' && kerja.some((f) => path.relative(AKAR, f) === b.berkas)) console.log('tinjau:', b.status, b.berkas);
}
