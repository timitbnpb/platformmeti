// JM-T06: rangkaian pipa, gerbang tak-ada-yatim, dan job bot_pr (git nyata di repo sementara, gh palsu).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { periksaDaftar, bukaAman } from '../scripts/pipa/arsip_aman.mjs';
import { scrub } from '../scripts/panen/_bot.mjs';
import { rangkai, cariYatim, terpasang } from '../scripts/pipa/rangkai.mjs';
import { jalankanPr, jalurBoleh, tanpaCap, beritaBoleh, BERITA_BOLEH, apiAman, diffAman } from '../scripts/pipa/bot_pr.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
test('T06 rangkai.tak-ada-yatim: tiap skrip yatim terpasang atau tercatat pensiun', () => {
  const lepas = cariYatim().filter((f) => !terpasang().has(f));
  assert.deepEqual(lepas, [], 'daftarkan di data/rangkai.json (langkah atau pensiun) atau rujuk dari skrip lain');
});
test('T06 berkas rangkai.json: skrip ada, pensiun beralasan, tanpa ganda', () => {
  const rj = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/rangkai.json'), 'utf-8'));
  for (const [k, alasan] of Object.entries(rj.pensiun)) { assert.ok(fs.existsSync(path.join(ROOT, k)), k); assert.ok(alasan.length > 10, k); }
  for (const l of rj.langkah) for (const k of l.skrip) { assert.ok(fs.existsSync(path.join(ROOT, k.skrip)), k.skrip); assert.ok(!(k.skrip in rj.pensiun), 'pensiun dan terpasang sekaligus: ' + k.skrip); }
});
test('T06 satu langkah gagal tidak menggagalkan putaran; turunan berhenti; masukan hilang dilewati', async () => {
  const dipanggil = [];
  const lariFn = async (skrip, args) => { dipanggil.push(skrip); return skrip.endsWith('data_atlas.mjs') ? { kode: 1, teks: 'meledak' } : { kode: 0, teks: '' }; };
  const panenFn = async () => ({ hasil: [{ kode: 'a', status: 'gagal' }, { kode: 'b', status: 'ok' }], isu: [] });
  const lap = await rangkai({ jadwal: 'bulanan', kini: '2026-11-11', tulis: false, ada: () => false, lariFn, panenFn, log: () => {} });
  assert.deepEqual(lap.panen.gagal, ['a']);
  assert.match(lap['bangun:data_atlas.mjs'], /^gagal exit 1/);
  assert.match(lap['bangun:data_kelistrikan.mjs'], /dilewati|ok/);
  assert.ok(dipanggil.length === 0 || dipanggil.some((x) => x.endsWith('data_kelistrikan.mjs')), 'langkah bangun lain tetap jalan');
  assert.match(lap['sambung:data_direktori.mjs'], /dilewati: masukan tidak ada/, 'data-panen tidak ada di runner');
  assert.match(lap['potret:potret.mjs'], /dilewati/);
});
test('T06 jadwal harian tidak menjalankan langkah bulanan', async () => {
  const lap = await rangkai({ jadwal: 'harian', kini: '2026-11-11', kering: true, panenFn: async () => ({ hasil: [], isu: [] }), log: () => {} });
  assert.deepEqual(Object.keys(lap), ['panen', 'bangun:berita_turunan.mjs']);
});

// bot_pr dengan git nyata
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf-8' });
function siapkan() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'botpr-')), asal = path.join(d, 'asal.git'), kerja = path.join(d, 'kerja');
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', asal]); fs.mkdirSync(kerja);
  git(kerja, 'init', '-q', '-b', 'main'); git(kerja, 'config', 'user.email', 't@t'); git(kerja, 'config', 'user.name', 't'); git(kerja, 'remote', 'add', 'origin', asal);
  fs.mkdirSync(path.join(kerja, 'public/data'), { recursive: true }); fs.mkdirSync(path.join(kerja, 'src'), { recursive: true });
  fs.writeFileSync(path.join(kerja, 'public/data/a.json'), JSON.stringify({ dibangun_pada: '2026-11-01', baris: [1] }));
  fs.writeFileSync(path.join(kerja, 'src/kode.js'), 'x');
  git(kerja, 'add', '-A'); git(kerja, 'commit', '-qm', 'awal'); git(kerja, 'push', '-q', 'origin', 'main');
  const gh = []; const sendiri = (cmd, args, o = {}) => { if (cmd === 'gh') { gh.push(args); if (args[0] === 'api') return (gh.diff || []).join('\n'); return args[0] === 'pr' && args[1] === 'list' ? (gh.some((x) => x[0] === 'pr' && x[1] === 'create' && x.includes(args[args.indexOf('--head') + 1])) ? '[{"number":7}]' : '[]') : args[0] === 'issue' && args[1] === 'list' ? JSON.stringify(gh.issueAda || []) : ''; } try { return execFileSync(cmd, args, { cwd: kerja, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { if (o.toleran) return ''; throw e; } };
  return { kerja, asal, gh, jalan: sendiri };
}
const dalam = (kerja, f) => { const lama = process.cwd(); process.chdir(kerja); try { return f(); } finally { process.chdir(lama); } };

test('T06 bot_pr: hanya cap dibangun_pada berubah = tidak ada commit dan tidak ada PR', () => {
  const t = siapkan(); fs.writeFileSync(path.join(t.kerja, 'public/data/a.json'), JSON.stringify({ dibangun_pada: '2026-11-11', baris: [1] }));
  const r = dalam(t.kerja, () => jalankanPr({ jadwal: 'harian', kini: '2026-11-11', jalan: t.jalan, log: () => {} }));
  assert.deepEqual(r.berubah, []); assert.equal(t.gh.filter((x) => x[0] === 'pr').length, 0);
  assert.equal(git(t.kerja, 'status', '--porcelain'), '');
});
test('T06 bot_pr: berkas di luar putih-daftar menggagalkan, tanpa commit', () => {
  const t = siapkan(); fs.writeFileSync(path.join(t.kerja, 'src/kode.js'), 'jahat');
  assert.throws(() => dalam(t.kerja, () => jalankanPr({ jadwal: 'harian', kini: '2026-11-11', jalan: t.jalan, log: () => {} })), /luar putih-daftar/);
  assert.equal(git(t.kerja, 'log', '--oneline').trim().split('\n').length, 1);
});
test('T06 bot_pr: perubahan nyata ke data-bot dan satu PR; main asal tidak tersentuh; tanpa PR ganda', () => {
  const t = siapkan(); fs.writeFileSync(path.join(t.kerja, 'public/data/a.json'), JSON.stringify({ dibangun_pada: '2026-11-11', baris: [1, 2] }));
  fs.mkdirSync(path.join(t.kerja, 'data/bot'), { recursive: true }); fs.writeFileSync(path.join(t.kerja, 'data/bot/status.json'), JSON.stringify({ sumber: { x: { status: 'gagal', gagal_beruntun: 3, diambil: '2026-10-01' } } }));
  const r = dalam(t.kerja, () => jalankanPr({ jadwal: 'harian', kini: '2026-11-11', jalan: t.jalan, log: () => {} }));
  assert.deepEqual(r.berubah.sort(), ['data/bot/status.json', 'public/data/a.json']);
  assert.match(git(t.asal, 'branch', '--list'), /data-bot/); assert.equal(git(t.asal, 'rev-parse', 'main').trim(), git(t.kerja, 'rev-parse', 'origin/main').trim());
  assert.equal(git(t.asal, 'log', '-1', '--format=%s', 'data-bot').trim(), 'data-bot: harian 2026-11-11');
  assert.equal(t.gh.filter((x) => x[0] === 'pr' && x[1] === 'create').length, 1);
  assert.ok(t.gh.some((x) => x[0] === 'issue' && x[1] === 'create' && /x gagal 3 kali berturut-turut/.test(x.join(' '))), 'isu 3-gagal dibuka');
  assert.ok(!t.gh.flat().includes('main') || t.gh.filter((x) => x[0] === 'pr').every((x) => !x.includes('--head') || x[x.indexOf('--head') + 1] === 'data-bot'));
});
test('T06 bot_pr: isu tidak dobel bila sudah terbuka; putaran kedua menumpuk di atas data-bot', () => {
  const t = siapkan(); t.gh.issueAda = [{ title: 'data-bot: x gagal 3 kali berturut-turut' }];
  fs.mkdirSync(path.join(t.kerja, 'data/bot'), { recursive: true }); fs.writeFileSync(path.join(t.kerja, 'data/bot/status.json'), JSON.stringify({ sumber: { x: { status: 'gagal', gagal_beruntun: 4 } } }));
  fs.writeFileSync(path.join(t.kerja, 'public/data/b.json'), '{"baris":[1]}');
  dalam(t.kerja, () => jalankanPr({ jadwal: 'harian', kini: '2026-11-11', jalan: t.jalan, log: () => {} }));
  assert.equal(t.gh.filter((x) => x[0] === 'issue' && x[1] === 'create').length, 0);
  // putaran kedua dari main bersih, hanya menyentuh berkas lain: b.json dari putaran pertama harus tetap ada di data-bot
  git(t.kerja, 'switch', '-q', 'main'); fs.writeFileSync(path.join(t.kerja, 'public/data/c.json'), '{"baris":[2]}');
  dalam(t.kerja, () => jalankanPr({ jadwal: 'mingguan', kini: '2026-11-12', jalan: t.jalan, log: () => {} }));
  const isi = git(t.asal, 'ls-tree', '-r', '--name-only', 'data-bot');
  assert.match(isi, /public\/data\/b\.json/); assert.match(isi, /public\/data\/c\.json/);
});
test('T06 jalur putih-daftar dan normalisasi cap', () => {
  assert.ok(jalurBoleh('public/data/a.json') && jalurBoleh('hukum/uu/2007/x.md') && !jalurBoleh('src/worker.js') && !jalurBoleh('public/data/../../src/x') && !jalurBoleh('.github/workflows/x.yml'));
  assert.equal(tanpaCap('{"dibangun_pada":"a","x":1}'), tanpaCap('{"x":1,"dibangun_pada":"b"}'.replace('"x":1,"dibangun_pada":"b"', '"dibangun_pada":"b","x":1')));
  assert.notEqual(tanpaCap('{"x":1}'), tanpaCap('{"x":2}'));
  assert.equal(tanpaCap('{"dicek":"1","status":"ok"}', 'data/bot/status.json'), tanpaCap('{"dicek":"2","status":"ok"}', 'data/bot/status.json'));
});

test('D25 daftar berkas yang boleh digabung otomatis: hanya berita', () => {
  for (const ok of ['public/data/berita.json', 'public/data/berita_foto.json', 'public/data/cari/berita.json']) assert.ok(beritaBoleh(ok), ok);
  for (const no of ['public/data/proyek.json', 'public/data/berita.json.bak', 'public/data/cari/hukum.json', 'public/data/cari/berita.json/../x', 'public/data/berita/x.json', 'src/worker.js', 'public/data/organisasi.json', 'data/bot/status.json', '.github/workflows/panen-harian.yml', 'hukum/uu/x.md']) assert.ok(!beritaBoleh(no), no);
  assert.equal(BERITA_BOLEH.length, 4); for (const ok of ['public/data/ringkas.json', 'public/data/isu.json', 'public/data/kuadran.json']) assert.ok(beritaBoleh(ok), ok); assert.ok(!beritaBoleh('public/data/cari/proyek.json'));
});
const putaranBerita = ({ lulus, diff, tambahan }) => {
  const t = siapkan(); t.gh.diff = diff;
  fs.writeFileSync(path.join(t.kerja, 'public/data/berita.json'), '{"baris":[1]}');
  if (tambahan) fs.writeFileSync(path.join(t.kerja, 'public/data/proyek.json'), '{"baris":[9]}');
  const r = dalam(t.kerja, () => jalankanPr({ jadwal: 'harian', kini: '2026-11-11', jalan: t.jalan, log: () => {}, gabungBerita: true, ujiLulus: lulus }));
  return { t, r };
};
test('D25 berita: cabang terpisah, digabung squash hanya bila uji lulus dan diff dalam daftar', () => {
  const { t, r } = putaranBerita({ lulus: true, diff: ['modified\tpublic/data/berita.json'] });
  assert.equal(r.digabung, 7); assert.ok(t.gh.some((x) => x[0] === 'pr' && x[1] === 'merge' && x.includes('--squash')));
  assert.match(git(t.asal, 'branch', '--list'), /data-bot-berita/); assert.doesNotMatch(git(t.asal, 'branch', '--list'), /data-bot\n/);
});
test('D25 berita: uji belum lulus atau diff menyentuh berkas lain = PR dibiarkan terbuka', () => {
  assert.equal(putaranBerita({ lulus: false, diff: ['modified\tpublic/data/berita.json'] }).t.gh.filter((x) => x[1] === 'merge').length, 0);
  assert.equal(putaranBerita({ lulus: true, diff: ['modified\tpublic/data/berita.json', 'modified\tsrc/worker.js'] }).t.gh.filter((x) => x[1] === 'merge').length, 0);
});
test('D25 data lain tetap PR biasa ke data-bot, tidak pernah digabung bot; berita tidak ikut masuk data-bot', () => {
  const { t, r } = putaranBerita({ lulus: true, diff: ['modified\tpublic/data/berita.json'], tambahan: true });
  assert.deepEqual(r.lain, ['public/data/proyek.json']); assert.deepEqual(r.berita, ['public/data/berita.json']);
  assert.equal(t.gh.filter((x) => x[1] === 'merge').length, 1, 'hanya PR berita');
  assert.equal(git(t.asal, 'ls-tree', '-r', '--name-only', 'data-bot').includes('berita.json'), false);
  assert.match(git(t.asal, 'ls-tree', '-r', '--name-only', 'data-bot'), /proyek\.json/);
});

test('D25 gabung otomatis menolak rename/hapus/mode aneh; berkas bukan biasa ditolak sebelum add', () => {
  assert.equal(apiAman('modified\tpublic/data/berita.json'), true);
  assert.equal(apiAman('renamed\tpublic/data/berita.json'), false); assert.equal(apiAman('removed\tpublic/data/berita.json'), false);
  assert.equal(apiAman('modified\tpublic/data/berita.json\nadded\tsrc/x.js'), false); assert.equal(apiAman(''), false);
  assert.equal(diffAman(':100644 100644 a b M\tpublic/data/berita.json'), true);
  assert.equal(diffAman(':000000 100644 a b A\tpublic/data/berita.json'), true);
  assert.equal(diffAman(':100644 120000 a b M\tpublic/data/berita.json'), false);
  assert.equal(diffAman(':100644 100644 a b R100\tpublic/data/a.json\tpublic/data/berita.json'), false);
  const t = siapkan(); fs.symlinkSync('/etc/passwd', path.join(t.kerja, 'public/data/berita.json'));
  fs.rmSync(path.join(t.kerja, 'public/data/a.json'));
  assert.throws(() => dalam(t.kerja, () => jalankanPr({ jadwal: 'harian', kini: '2026-11-11', jalan: t.jalan, log: () => {}, gabungBerita: true, ujiLulus: true })), /bukan berkas biasa/);
  assert.equal(t.gh.filter((x) => x[0] === 'pr').length, 0);
});
test('D25 rename di API menahan gabung otomatis', () => {
  const { t } = putaranBerita({ lulus: true, diff: ['renamed\tpublic/data/berita.json'] });
  assert.equal(t.gh.filter((x) => x[1] === 'merge').length, 0);
});
test('keamanan: rahasia di stderr anak tidak masuk rangkai.json maupun laporan', async () => {
  process.env.BPS_KUNCI = 'RAHASIA-PALSU-12345';
  try {
    const lap = await rangkai({ jadwal: 'bulanan', kini: '2026-11-11', tulis: false, ada: () => true, panenFn: async () => ({ hasil: [], isu: [] }), log: () => {},
      lariFn: async () => ({ kode: 1, teks: scrub('gagal RAHASIA-PALSU-12345 https://api.x.org/d?key=ABCDEF&token=tok123&a=1') }) });
    const teks = JSON.stringify(lap);
    assert.doesNotMatch(teks, /RAHASIA-PALSU|ABCDEF|tok123/); assert.match(teks, /\*\*\*/);
  } finally { delete process.env.BPS_KUNCI; }
});
test('keamanan: skrip anak sungguhan yang mencetak rahasia di stderr dibersihkan (lari nyata)', async () => {
  const sem = fs.mkdtempSync(path.join(os.tmpdir(), 'lari-')); const s = path.join(sem, 'x.mjs');
  fs.writeFileSync(s, "console.error('bocor ' + process.env.EIA_KUNCI + ' https://a.b/c?api_key=XYZ987'); process.exit(1);");
  const { jalankanSkrip } = await import('../scripts/panen/_bot.mjs');
  process.env.EIA_KUNCI = 'KUNCI-PALSU-98765';
  try { const r = await jalankanSkrip({ skrip: path.relative(ROOT, s) }, '2026-11-11'); assert.doesNotMatch(r.teks, /KUNCI-PALSU|XYZ987/); assert.match(r.teks, /\*\*\*/); } finally { delete process.env.EIA_KUNCI; }
});
test('keamanan: arsip artefak menolak symlink, hardlink, jalur absolut, .., dan di luar putih-daftar', () => {
  const v = (t, p) => `${t}rw-r--r-- u/g 1 2026-11-11 00:00 ${p}`;
  assert.deepEqual(periksaDaftar('public/data/a.json', v('-', 'public/data/a.json')), []);
  for (const [n, l] of [['public/data/l', v('l', 'public/data/l -> /etc/passwd')], ['public/data/h', v('h', 'public/data/h link to x')], ['/etc/x', v('-', '/etc/x')], ['public/data/../../src/x', v('-', 'x')], ['src/worker.js', v('-', 'src/worker.js')], ['.github/workflows/x.yml', v('-', 'x')]])
    assert.ok(periksaDaftar(n, l).length > 0, n);
  const sem = fs.mkdtempSync(path.join(os.tmpdir(), 'ar-')); const dalamDir = path.join(sem, 'isi'); fs.mkdirSync(path.join(dalamDir, 'public/data'), { recursive: true });
  fs.writeFileSync(path.join(dalamDir, 'public/data/a.json'), '{}'); fs.symlinkSync('/etc/passwd', path.join(dalamDir, 'public/data/jahat.json'));
  const bagus = path.join(sem, 'bagus.tgz'), jahat = path.join(sem, 'jahat.tgz');
  execFileSync('tar', ['-czf', bagus, '-C', dalamDir, 'public/data/a.json']); execFileSync('tar', ['-czf', jahat, '-C', dalamDir, 'public/data/a.json', 'public/data/jahat.json']);
  const tujuan = path.join(sem, 'tujuan'); fs.mkdirSync(tujuan);
  assert.equal(bukaAman(bagus, tujuan), 1); assert.ok(fs.existsSync(path.join(tujuan, 'public/data/a.json')));
  assert.throws(() => bukaAman(jahat, path.join(sem, 'lain')), /arsip ditolak/);
});
