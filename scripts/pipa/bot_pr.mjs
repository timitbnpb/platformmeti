#!/usr/bin/env node
// Job bot_pr (K21, D23): satu-satunya pemegang izin tulis. Mendorong HANYA ke cabang data-bot dan membuka/memperbarui satu PR ke main.
// Tidak pernah push ke main, tidak auto-merge, tidak menjalankan skrip dari artefak (hanya menyalin jalur putih-daftar).
//   node scripts/pipa/bot_pr.mjs --jadwal harian   pulihkan isi data-bot lama, bandingkan, commit, dorong, PR, isu 3-gagal
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const CABANG = 'data-bot';
export const CABANG_BERITA = 'data-bot-berita'; // bukan data-bot/berita: git tidak bisa menyimpan ref data-bot dan data-bot/x bersamaan
// D25: satu-satunya berkas yang boleh digabung otomatis; daftar ini ditagih tests/t-bot-rangkai.test.mjs
export const BERITA_BOLEH = [/^public\/data\/berita\.json$/, /^public\/data\/berita_foto\.json$/, /^public\/data\/cari\/berita\.json$/,
  // turunan yang dibangun dari berita (berita_turunan.mjs); tanpa ini uji konsistensi di main merah setelah berita masuk
  /^public\/data\/(ringkas|isu|kuadran)\.json$/];
// Diff mentah git (:mode mode sha sha S\tjalur): hanya tambah/ubah berkas biasa (100644), tanpa rename/hapus/symlink/submodul.
export const diffAman = (raw) => raw.split('\n').filter(Boolean).every((l) => /^:(000000|100644) (100644) \S+ \S+ [AM]\t/.test(l));
// Daftar berkas PR dari API (status\tjalur): hanya added/modified dan semuanya dalam daftar berita.
export const apiAman = (tsv) => { const b = tsv.split('\n').filter(Boolean).map((l) => l.split('\t')); return b.length > 0 && b.every(([st, f]) => ['added', 'modified'].includes(st) && beritaBoleh(f)); };
export const beritaBoleh = (p) => BERITA_BOLEH.some((r) => r.test(p));
export const PUTIH = ['public/data/', 'data/direktori/', 'data/bot/', 'hukum/'];
export const jalurBoleh = (p) => !p.includes('..') && !path.isAbsolute(p) && PUTIH.some((x) => p.startsWith(x));
const CAP = ['dibangun_pada'], CAP_BOT = ['dibangun_pada', 'dicek', 'tanggal', 'rinci'];

// Isi JSON tanpa cap waktu, agar tulis-ulang tanpa perubahan nyata tidak membuat commit (riwayat git tidak bengkak).
export function tanpaCap(teks, jalur = '') {
  const buang = jalur.startsWith('data/bot/') ? CAP_BOT : CAP;
  try { return JSON.stringify(JSON.parse(teks), (k, v) => (buang.includes(k) ? undefined : v)); } catch { return teks; }
}

const sh = (cmd, args, { toleran = false } = {}) => {
  try { return execFileSync(cmd, args, { encoding: 'utf-8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { if (toleran) return ''; throw e; }
};

export function ringkasan({ jadwal, kini, berubah, status, rangkai }) {
  const g = Object.entries(status).filter(([, s]) => s.status === 'gagal' || s.status === 'blokir' || s.status === 'perlu_kunci');
  return [
    `Panen bot ${jadwal} ${kini}. Tinjau lalu gabung manual; bot tidak pernah auto-merge.`, '',
    `Berkas berubah: ${berubah.length}`, ...berubah.slice(0, 60).map((p) => '- ' + p), '',
    'Sumber bermasalah (dilewati, tidak dipaksa):', ...(g.length ? g.map(([k, s]) => `- ${k}: ${s.status}, gagal berturut ${s.gagal_beruntun || 0}, terakhir diambil ${s.diambil || '-'}`) : ['- tidak ada']), '',
    'Langkah rangkai:', ...Object.entries((rangkai && rangkai.laporan) || {}).filter(([k]) => k !== 'panen').map(([k, v]) => `- ${k}: ${v}`), '',
    'Gerbang: `npm run uji` sudah lulus di job uji sebelum PR ini dibuka (PR dari GITHUB_TOKEN tidak memicu uji.yml).',
  ].join('\n');
}

export function jalankanPr({ jadwal, kini, jalan = sh, log = console.log, gabungBerita = false, ujiLulus = false }) {
  const dasar = jalan('git', ['rev-parse', 'HEAD']).trim();
  pulihkan({ jalan, hanya: (p) => !(gabungBerita && beritaBoleh(p)) });
  const baca = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf-8')) : null);
  const status = (baca('data/bot/status.json') || {}).sumber || {};
  // Isu: gagal 3 kali berturut-turut, hanya bila belum ada isu terbuka berjudul sama.
  const isu = Object.entries(status).filter(([, s]) => s.status === 'gagal' && s.gagal_beruntun >= 3).map(([k]) => k).sort();
  if (isu.length) jalan('gh', ['label', 'create', 'data-bot', '--color', '0E8A16', '--description', 'laporan bot panen'], { toleran: true });
  for (const k of isu) {
    const judul = `data-bot: ${k} gagal 3 kali berturut-turut`;
    const ada = JSON.parse(jalan('gh', ['issue', 'list', '--state', 'open', '--label', 'data-bot', '--json', 'title', '--limit', '200'], { toleran: true }) || '[]');
    if (!ada.some((i) => i.title === judul)) jalan('gh', ['issue', 'create', '--title', judul, '--label', 'data-bot', '--body', `Sumber ${k} gagal ${status[k].gagal_beruntun} kali berturut-turut (terakhir diambil ${status[k].diambil || 'belum pernah'}). Keluaran lama dipertahankan. Periksa data/bot/status.json dan skripnya.`]);
  }
  // Tulis hanya bila isi berubah.
  const baris = jalan('git', ['status', '--porcelain', '-uall']).split('\n').filter(Boolean).map((l) => l.slice(3).replace(/^"|"$/g, ''));
  const luar = baris.filter((p) => !jalurBoleh(p));
  if (luar.length) throw new Error('berkas di luar putih-daftar, ditolak:\n' + luar.join('\n'));
  const bukanBiasa = baris.filter((p) => { try { return !fs.lstatSync(p).isFile(); } catch { return false; } }); // symlink, direktori, perangkat; berkas terhapus lolos
  if (bukanBiasa.length) throw new Error('bukan berkas biasa (symlink dll), ditolak:\n' + bukanBiasa.join('\n'));
  for (const p of baris) {
    if (!p.endsWith('.json')) continue;
    const lama = jalan('git', ['show', 'HEAD:' + p], { toleran: true });
    if (lama && tanpaCap(lama, p) === tanpaCap(fs.readFileSync(p, 'utf-8'), p)) jalan('git', ['checkout', 'HEAD', '--', p]);
  }
  const berubah = jalan('git', ['status', '--porcelain', '-uall']).split('\n').filter(Boolean).map((l) => l.slice(3).replace(/^"|"$/g, ''));
  if (!berubah.length) { log('tidak ada perubahan nyata, tidak ada PR'); return { berubah: [], isu }; }
  const rangkai = baca('data/bot/rangkai.json');
  const berita = gabungBerita ? berubah.filter(beritaBoleh) : [], lain = berubah.filter((p) => !berita.includes(p));
  let digabung = null;
  const dorong = (cabang, files, judul) => { // satu PR bergulir per cabang; selalu dari dasar (main), tidak pernah push ke main
    if (cabang === 'main') throw new Error('menolak push ke main');
    jalan('git', ['switch', '-C', cabang, dasar]);
    jalan('git', ['add', '--', ...files]);
    jalan('git', ['-c', 'user.name=meti-data-bot', '-c', 'user.email=meti-data-bot@users.noreply.github.com', 'commit', '-m', `${cabang}: ${jadwal} ${kini}`]);
    jalan('git', ['push', '--force-with-lease', 'origin', cabang]);
    const badan = path.join(os.tmpdir(), `badan-pr-${cabang}.md`);
    fs.writeFileSync(badan, ringkasan({ jadwal, kini, berubah: files, status, rangkai }), 'utf-8');
    const daftar = () => JSON.parse(jalan('gh', ['pr', 'list', '--head', cabang, '--base', 'main', '--state', 'open', '--json', 'number']) || '[]');
    if (daftar().length) jalan('gh', ['pr', 'edit', String(daftar()[0].number), '--title', judul, '--body-file', badan]);
    else jalan('gh', ['pr', 'create', '--base', 'main', '--head', cabang, '--title', judul, '--body-file', badan]);
    return daftar()[0] && daftar()[0].number;
  };
  // D25: berita saja digabung otomatis (squash) bila uji lulus dan diff terbatas pada berkas berita yang diizinkan.
  if (berita.length) {
    const nomor = dorong(CABANG_BERITA, berita, `data-bot: berita (${kini})`);
    const api = nomor ? jalan('gh', ['api', `repos/{owner}/{repo}/pulls/${nomor}/files`, '--paginate', '--jq', '.[] | [.status, .filename] | @tsv'], { toleran: true }) : '';
    const mentah = jalan('git', ['diff', '--raw', '--no-renames', dasar, CABANG_BERITA], { toleran: true });
    if (nomor && ujiLulus && apiAman(api) && diffAman(mentah)) {
      try { jalan('gh', ['pr', 'merge', String(nomor), '--squash', '--delete-branch']); digabung = nomor; } catch (e) { log('gabung otomatis gagal, PR dibiarkan terbuka: ' + e.message.split('\n')[0]); }
    } else log('PR berita dibiarkan terbuka (uji belum lulus atau diff di luar daftar)');
  }
  if (lain.length) dorong(CABANG, lain, `data-bot: pembaruan data otomatis (${kini})`);
  return { berubah, isu, berita, lain, digabung };
}

// Putaran baru dibangun dari main, jadi isi data-bot yang belum digabung dipulihkan: berkas yang putaran ini TIDAK ubah
// (sama dengan main) diambil dari data-bot; yang putaran ini ubah dipertahankan. Dipanggil sesudah artefak ditimpakan.
export function pulihkan({ jalan = sh, hanya = () => true } = {}) {
  jalan('git', ['fetch', 'origin', CABANG], { toleran: true });
  if (!jalan('git', ['rev-parse', '--verify', '-q', 'origin/' + CABANG], { toleran: true })) return [];
  const file = jalan('git', ['diff', '--name-only', '--diff-filter=AM', 'origin/main', 'origin/' + CABANG], { toleran: true }).split('\n').filter((p) => jalurBoleh(p) && hanya(p));
  const pulih = file.filter((p) => {
    const lama = jalan('git', ['show', 'HEAD:' + p], { toleran: true });
    return !fs.existsSync(p) || (lama && tanpaCap(lama, p) === tanpaCap(fs.readFileSync(p, 'utf-8'), p));
  });
  if (pulih.length) jalan('git', ['checkout', 'origin/' + CABANG, '--', ...pulih]);
  return pulih;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  {
    const jadwal = a[a.indexOf('--jadwal') + 1] || 'manual', kini = process.env.TANGGAL_BANGUN || new Date().toISOString().slice(0, 10);
    try { const r = jalankanPr({ jadwal, kini, gabungBerita: process.env.GABUNG_BERITA === 'true', ujiLulus: process.env.UJI_HASIL === 'success' }); console.log(`bot_pr: ${r.berubah.length} berkas, isu ${r.isu.length}`); } catch (e) { console.error(e.message); process.exit(1); }
  }
}
