// Gambar kartu berita: unduh og:image (URL dari berita_foto.json, hasil berita_foto.mjs), perkecil 480px webp q<=75 <=40KB,
// simpan public/img/berita/<id>.webp; isi medan gambar/gambar_sumber/gambar_kredit di berita.json. Yang sudah ada dilewati.
// Pakai: node scripts/panen/berita_gambar.mjs [--maks N]. Jalankan SETELAH panen berita + berita_foto.mjs.
// Antara dilarang (aturan pemilik) -> gambar:null. Sopan: robots.txt, jeda 2 s/host, 403/429 = host dihentikan.
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { UA, robotsBolehkan } from './berita.mjs';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const BERITA = AKAR + 'public/data/berita.json', FOTO = AKAR + 'public/data/berita_foto.json', KELUAR = AKAR + 'public/img/berita/';
const MENTAH = process.env.BERITA_GAMBAR_MENTAH || '/tmp/berita-gambar/';
const maks = +(process.argv[process.argv.indexOf('--maks') + 1]) || 1e9;
const dok = JSON.parse(readFileSync(BERITA, 'utf8'));
const foto = existsSync(FOTO) ? JSON.parse(readFileSync(FOTO, 'utf8')) : {};
mkdirSync(KELUAR, { recursive: true }); mkdirSync(MENTAH, { recursive: true });
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const antara = (b) => /antara/i.test(b.media + b.url);
const terakhir = new Map(), robots = new Map(), blok = new Set();
const tolak = {}, hitung = (k) => (tolak[k] = (tolak[k] || 0) + 1);

async function ambil(url, biner) {
  const h = new URL(url).host; if (blok.has(h)) return null;
  const tunggu = (terakhir.get(h) || 0) + 2000 - Date.now(); terakhir.set(h, Math.max(Date.now(), terakhir.get(h) || 0) + 2000); if (tunggu > 0) await tidur(tunggu);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: biner ? 'image/*' : 'text/plain' }, redirect: 'follow', signal: AbortSignal.timeout(10000) });
    if (r.status === 403 || r.status === 429) { blok.add(h); return null; }
    if (!r.ok) return null;
    const b = Buffer.from(await r.arrayBuffer()); return b.length < 3e6 ? b : null;
  } catch { return null; }
}
async function boleh(url) {
  const u = new URL(url);
  if (!robots.has(u.host)) robots.set(u.host, ambil(u.origin + '/robots.txt', true).then((b) => (b ? b.toString('utf8') : '')));
  return robotsBolehkan(await robots.get(u.host), u.pathname + u.search);
}
const lebarTinggi = (f) => { const o = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', f], { encoding: 'utf8' }); return [+o.match(/pixelWidth: (\d+)/)[1], +o.match(/pixelHeight: (\d+)/)[1]]; };

const urut = dok.baris.sort((a, b) => b.terbit.localeCompare(a.terbit));
const kerja = urut.filter((b) => b.gambar === undefined && (antara(b) || foto[b.id])).slice(0, maks);
// Hitung URL gambar yang dipakai banyak artikel (logo bawaan situs).
const pakai = {}; for (const b of urut) if (foto[b.id]) pakai[foto[b.id]] = (pakai[foto[b.id]] || 0) + 1;
const antri = new Map(); // host -> daftar; host paralel, dalam host berurutan
for (const b of kerja) { if (antara(b)) { b.gambar = null; hitung('antara'); continue; } const h = new URL(foto[b.id]).host; (antri.get(h) || antri.set(h, []).get(h)).push(b); }
const hash = {}; // sha1 -> jumlah artikel (deteksi logo/placeholder identik walau URL beda)
async function proses(b) {
  const u = foto[b.id];
  if ((pakai[u] || 0) >= 3) return hitung('url dipakai >=3 artikel (logo)');
  if (!(await boleh(u))) return hitung('robots');
  const buf = await ambil(u, true); if (!buf) return hitung(blok.has(new URL(u).host) ? 'host diblokir' : 'unduh gagal');
  const sha = createHash('sha1').update(buf).digest('hex');
  const f = MENTAH + b.id, hasil = KELUAR + b.id + '.webp';
  writeFileSync(f, buf);
  try {
    const [w, t] = lebarTinggi(f);
    if (w < 200 || t < 120) return hitung('kecil <200px');
    if (w / t > 3 || t / w > 2) return hitung('rasio ekstrem');
    hash[sha] = (hash[sha] || []).concat(b.id);
    for (const q of [75, 65, 55, 45]) {
      execFileSync('cwebp', ['-quiet', '-q', String(q), '-resize', '480', '0', f, '-o', hasil], { stdio: 'ignore' });
      if (statSync(hasil).size <= 40000) break;
    }
    if (statSync(hasil).size > 40000) { rmSync(hasil); return hitung('>40KB'); }
    Object.assign(b, { gambar: '/img/berita/' + b.id + '.webp', gambar_sumber: u, gambar_kredit: b.media });
  } catch { rmSync(hasil, { force: true }); hitung('format tak terbaca'); }
}
await Promise.all([...antri.values()].map(async (l) => { for (const b of l) await proses(b); }));
// Gambar byte-identik di >=3 artikel = logo/placeholder: cabut.
for (const [, ids] of Object.entries(hash)) if (ids.length >= 3) for (const id of ids) {
  const b = dok.baris.find((x) => x.id === id); rmSync(KELUAR + id + '.webp', { force: true });
  delete b.gambar; delete b.gambar_sumber; delete b.gambar_kredit; hitung('hash identik >=3 (logo)');
}
writeFileSync(BERITA, JSON.stringify(dok), 'utf8');
const ada = dok.baris.filter((b) => b.gambar).length;
console.log(JSON.stringify({ gambar: ada, dari: dok.baris.length, ditolak: tolak, host_diblokir: [...blok] }));
