// Salinan bersih untuk serah terima (M1.2): git archive HEAD, buang berkas internal, git init + satu commit awal.
//   node scripts/serah/paket.mjs [folder] [--kering]     default folder ../platformmeti-serah
//   Wajib env SERAH_NAMA dan SERAH_SUREL (penulis commit awal), kecuali --kering.
//   --kering : hanya cetak daftar yang dibuang dan ukuran akhir; tidak menulis apa pun.
// Repo kerja tidak diubah. Sunting BUANG_TAMBAHAN di bawah untuk menambah pola.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const BUANG_DASAR = ['.claude/', 'AGENTS.md', 'CLAUDE.md', '*.bundle', 'artefak/', 'raw/', 'docs/ATURAN-PEMILIK.md', 'docs/internal/', 'Claude outputs/'];
// Tambahan mudah disunting: satu pola per elemen. "dir/" = folder (di mana pun), "*.ext" = akhiran nama, selain itu = jalur persis.
export const BUANG_TAMBAHAN = ['.dev.vars', '.env', '.DS_Store'];
// Kata yang tidak boleh tersisa di salinan (pemeriksaan pascasalin).
export const TEMUAN = [['/Users/', /\/Users\//], ['poskokarhutla', /poskokarhutla/i], ['pangantara', /pangantara/i], ['neraca-papua', /neraca-papua/i], ['timitbnpb', /timitbnpb/i], ['surel @gmail.com', /[A-Za-z0-9._%+-]+@gmail\.com/]];

export function cocok(p, pola) {
  if (pola.endsWith('/')) return p.startsWith(pola) || p.includes('/' + pola);
  if (pola.startsWith('*.')) return p.slice(p.lastIndexOf('/') + 1).endsWith(pola.slice(1));
  return p === pola;
}
// Murni: kembalikan { buang, simpan } dari daftar jalur.
export function pisah(berkas, pola = [...BUANG_DASAR, ...BUANG_TAMBAHAN]) {
  const buang = [], simpan = [];
  for (const f of berkas) (pola.some((x) => cocok(f, x)) ? buang : simpan).push(f);
  return { buang, simpan };
}
export function cariTemuan(nama, teks) {
  return TEMUAN.filter(([, re]) => re.test(teks)).map(([k]) => `${nama}: ${k}`);
}

const git = (args, opt = {}) => execFileSync('git', args, { maxBuffer: 1 << 30, ...opt });

function daftarHead() { // [{ jalur, ukuran }]
  return git(['ls-tree', '-r', '-l', '-z', 'HEAD']).toString('utf8').split('\0').filter(Boolean).map((l) => {
    const t = l.indexOf('\t'); return { jalur: l.slice(t + 1), ukuran: Number(l.slice(0, t).trim().split(/\s+/)[3]) || 0 };
  });
}
const mb = (n) => (n / 1048576).toFixed(1) + ' MB';

function utama() {
  const args = process.argv.slice(2), kering = args.includes('--kering');
  const tujuan = path.resolve(args.find((a) => !a.startsWith('--')) || '../platformmeti-serah');
  const semua = daftarHead(), ukuran = new Map(semua.map((x) => [x.jalur, x.ukuran]));
  const { buang, simpan } = pisah(semua.map((x) => x.jalur));
  const jml = (a) => a.reduce((n, f) => n + ukuran.get(f), 0);
  console.log(`Dibuang ${buang.length} berkas (${mb(jml(buang))}); disimpan ${simpan.length} berkas (${mb(jml(simpan))}).`);
  const ringkas = new Map();
  for (const f of buang) { const k = BUANG_DASAR.concat(BUANG_TAMBAHAN).find((x) => cocok(f, x)); ringkas.set(k, (ringkas.get(k) || 0) + 1); }
  for (const [k, n] of ringkas) console.log(`  ${k}: ${n}`);
  if (kering) { console.log(`Ukuran akhir (tanpa .git): ${mb(jml(simpan))}. --kering: tidak ada yang ditulis.`); return; }

  const nama = process.env.SERAH_NAMA, surel = process.env.SERAH_SUREL;
  if (!nama || !surel) { console.error('Gagal: set env SERAH_NAMA dan SERAH_SUREL (penulis commit awal).'); process.exit(1); }
  if (fs.existsSync(tujuan) && fs.readdirSync(tujuan).length) { console.error(`Gagal: ${tujuan} sudah ada dan tidak kosong.`); process.exit(1); }
  fs.mkdirSync(tujuan, { recursive: true });
  const tar = execFileSync('git', ['archive', 'HEAD'], { maxBuffer: 1 << 30 });
  execFileSync('tar', ['-x', '-C', tujuan], { input: tar, maxBuffer: 1 << 30 });
  for (const f of buang) fs.rmSync(path.join(tujuan, f), { force: true });
  const env = { ...process.env, GIT_AUTHOR_NAME: nama, GIT_AUTHOR_EMAIL: surel, GIT_COMMITTER_NAME: nama, GIT_COMMITTER_EMAIL: surel };
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: tujuan });
  execFileSync('git', ['add', '-A'], { cwd: tujuan });
  execFileSync('git', ['commit', '-q', '-m', 'Rilis awal serah terima'], { cwd: tujuan, env });
  console.log(`Salinan bersih: ${tujuan}`);

  const temuan = [];
  for (const f of simpan) {
    const p = path.join(tujuan, f);
    if (!fs.existsSync(p)) continue;
    const b = fs.readFileSync(p);
    if (b.subarray(0, 8000).includes(0)) continue; // biner
    temuan.push(...cariTemuan(f, b.toString('utf8')));
  }
  if (temuan.length) { console.log(`PERIKSA: ${temuan.length} temuan di salinan (bersihkan lewat M1.3/M1.4):`); for (const t of temuan.slice(0, 200)) console.log('  ' + t); }
  else console.log('Pemeriksaan pascasalin: bersih.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) utama();
