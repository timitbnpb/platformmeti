// Uji 0007_program: bangun ulang tabel (jenis program, kategori K19d, label kepakaran/jalur/kelompok, akun.telepon)
// di D1 lokal nyata. Data lama dipetakan, anak tidak ikut terhapus, FTS utuh, jalan ulang aman.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buatEnv, pecahSql } from './_bantu.mjs';

let DB, tutup;
const jalan = async (f) => { for (const s of pecahSql(fs.readFileSync(`migrations/${f}`, 'utf8'))) await DB.prepare(s).run(); };
const ok = (q, ...p) => DB.prepare(q).bind(...p).run();
const tolak = (q, ...p) => assert.rejects(() => DB.prepare(q).bind(...p).run(), q.slice(0, 60));
const hex = (n) => 'b'.repeat(n);
const semua = async (q, ...p) => (await DB.prepare(q).bind(...p).all()).results;
const LAMA = [['pt-ik', 'riset-kampus'], ['pt-lt', 'lsm-think-tank'], ['pt-pt', 'pengembang-teknologi'], ['pt-km', 'komunitas'],
  ['pt-bn', 'bumn'], ['pt-ps', 'pemerintah'], ['pt-gb', null]];

before(async () => {
  ({ env: { DB }, tutup } = await buatEnv({ migrasi: false }));
  await DB.exec('PRAGMA foreign_keys = ON');
  for (let i = 1; i <= 6; i++) await jalan(fs.readdirSync('migrations').find((f) => f.startsWith(String(i).padStart(4, '0'))));
  await ok("INSERT INTO sumber (url,domain,jenis,diperiksa) VALUES ('https://example.org/a','example.org','media','2026-11-01')");
  await ok("INSERT INTO akun (surel,nama,peran,status,garam,sandi,iterasi) VALUES ('s@example.org','S','super','aktif',?,?,100000)", hex(32), hex(64));
  await ok("INSERT INTO sesi (id_hash,akun_id,dibuat,sampai) VALUES (?,1,100,200)", hex(64));
  for (const [s, k] of LAMA) await ok("INSERT INTO entitas (kunci,slug,jenis,kategori,nama,sumber_id) VALUES (?,?,'lembaga',?,?,1)", `lembaga:${s}`, s, k, `Rumah Surya ${s}`);
  await ok("INSERT INTO entitas (kunci,slug,jenis,nama,sumber_id) VALUES ('orang:budi','budi','orang','Budi',1)");
  await ok("INSERT INTO entitas (kunci,slug,jenis,status,digabung_ke,nama,sumber_id) VALUES ('lembaga:lama','lama','lembaga','digabung',5,'Lama',1)");
  await ok("INSERT INTO alias (entitas_id,nama,norm) VALUES (1,'Nama Lain','nama lain')");
  await ok("INSERT INTO label (entitas_id,jenis,nilai) VALUES (1,'sektor','surya')");
  await ok("INSERT INTO fakta (entitas_id,kunci,nilai_teks,per_tanggal,tingkat_bukti,sumber_id) VALUES (1,'situs','x','2026-11-01','cuplikan',1)");
  await ok("INSERT INTO ikatan (dari,ke,jenis,per_tanggal,tingkat_bukti,sumber_id) VALUES (8,1,'bekerja-di','2026-11-01','cuplikan',1)");
  await ok("INSERT INTO riwayat (target_id,jenis,tanggal,judul,oleh) VALUES (1,'mou','2026-11-01','MoU',1)");
  await ok("INSERT INTO koreksi (entitas_id,jenis,usulan,pengaju_akun) VALUES (1,'keluar','hapus',1)");
  await jalan('0007_program.sql');
});
after(async () => tutup?.());

test('kategori lama dipetakan ke daftar K19, data anak utuh', async () => {
  const kat = Object.fromEntries((await semua('SELECT slug,kategori FROM entitas')).map((r) => [r.slug, r.kategori]));
  assert.deepEqual([kat['pt-ik'], kat['pt-lt'], kat['pt-pt'], kat['pt-km'], kat['pt-bn'], kat['pt-ps'], kat['pt-gb']],
    ['perguruan-tinggi', 'lsm-yayasan', 'swasta', 'lsm-yayasan', 'bumn', 'pemerintah', null]);
  assert.equal((await semua('SELECT * FROM entitas WHERE status = ?', 'digabung')).length, 1);
  for (const t of ['akun', 'sesi', 'alias', 'label', 'fakta', 'ikatan', 'riwayat', 'koreksi']) assert.equal((await semua(`SELECT * FROM ${t}`)).length, 1, t);
  assert.equal((await semua('SELECT * FROM _cad_akun').catch(() => 'tak ada')), 'tak ada');
  assert.deepEqual(await semua('SELECT * FROM pragma_foreign_key_check'), []);
});

test('FTS utuh: satu baris per entitas, alias tetap bisa dicari', async () => {
  assert.equal((await semua('SELECT rowid FROM entitas_cari')).length, 9);
  assert.equal((await semua("SELECT rowid FROM entitas_cari WHERE entitas_cari MATCH 'nama lain'")).length, 1);
  await ok('INSERT INTO alias (entitas_id,nama,norm) VALUES (2,?,?)', 'Baru Sekali', 'baru sekali');
  assert.equal((await semua("SELECT rowid FROM entitas_cari WHERE entitas_cari MATCH 'baru'")).length, 1);
});

test('kategori baru diterima, lama dan sembarang ditolak; program diterima', async () => {
  let n = 0;
  for (const k of ['bumn', 'bumd', 'swasta', 'internasional', 'pemerintah', 'pemda', 'perguruan-tinggi', 'think-tank', 'lsm-yayasan', 'donor', 'asosiasi', 'keuangan', 'organisasi-mahasiswa', 'koperasi']) {
    n++; await ok("INSERT INTO entitas (kunci,slug,jenis,kategori,nama,sumber_id) VALUES (?,?,'lembaga',?,'X',1)", `lembaga:k${n}`, `k${n}`, k);
  }
  for (const k of ['riset-kampus', 'lsm-think-tank', 'pengembang-teknologi', 'komunitas', 'dewa'])
    await tolak("INSERT INTO entitas (kunci,slug,jenis,kategori,nama,sumber_id) VALUES ('lembaga:z','zz','lembaga',?,'X',1)", k);
  await tolak("INSERT INTO entitas (kunci,slug,jenis,kategori,nama,sumber_id) VALUES ('orang:z','zz','orang','bumn','X',1)");
  await ok("INSERT INTO entitas (kunci,slug,jenis,nama,sumber_id) VALUES ('program:plts-100gw','plts-100gw','program','PLTS 100 GW',1)");
  await tolak("INSERT INTO entitas (kunci,slug,jenis,nama,sumber_id) VALUES ('program:q','qq','dewa','Q',1)");
});

test('akun.telepon: nullable, format dijaga', async () => {
  await ok("UPDATE akun SET telepon = '+628123456789' WHERE id = 1");
  await tolak("UPDATE akun SET telepon = '08 12' WHERE id = 1");
  await tolak("UPDATE akun SET telepon = 'abcdefghij' WHERE id = 1");
  await ok('UPDATE akun SET telepon = NULL WHERE id = 1');
  await tolak("UPDATE akun SET peran = 'anggota' WHERE id = 1"); // trigger super terakhir tetap hidup
});

test('label kelompok, kepakaran, jalur: nilai, sumber, simpul, batas', async () => {
  const L = (e, j, n, extra = '') => ok(`INSERT INTO label (entitas_id,jenis,nilai${extra ? ',utama,sumber_id' : ''}) VALUES (?,?,?${extra ? ',' + extra : ''})`, e, j, n);
  const budi = 8;
  await L(budi, 'kelompok', 'profesional');
  await tolak("INSERT INTO label (entitas_id,jenis,nilai) VALUES (8,'kelompok','praktisi')"); // satu kelompok per orang
  await tolak("INSERT INTO label (entitas_id,jenis,nilai) VALUES (8,'kelompok','dewa')");
  await tolak("INSERT INTO label (entitas_id,jenis,nilai) VALUES (1,'kelompok','praktisi')"); // lembaga tak punya kelompok
  await L(budi, 'jalur', 'birokrasi', '0,1');
  await tolak("INSERT INTO label (entitas_id,jenis,nilai) VALUES (8,'jalur','swasta')"); // jalur tanpa sumber
  await tolak("INSERT INTO label (entitas_id,jenis,nilai,sumber_id) VALUES (8,'jalur','dewa',1)");
  await tolak("INSERT INTO label (entitas_id,jenis,nilai,sumber_id) VALUES (1,'jalur','swasta',1)");
  await L(budi, 'kepakaran', 'surya', '1,1');
  await tolak("INSERT INTO label (entitas_id,jenis,nilai,utama,sumber_id) VALUES (8,'kepakaran','bayu',1,1)"); // satu utama
  await L(budi, 'kepakaran', 'bayu', '0,1');
  await L(budi, 'kepakaran', 'transisi-adil', '0,1');
  await tolak("INSERT INTO label (entitas_id,jenis,nilai,sumber_id) VALUES (8,'kepakaran','karbon',1)"); // maks 3
  await tolak("INSERT INTO label (entitas_id,jenis,nilai) VALUES (1,'kepakaran','hidro')"); // tanpa sumber
  await tolak("INSERT INTO label (entitas_id,jenis,nilai,sumber_id) VALUES (8,'kepakaran','solar',1)");
  await tolak("INSERT INTO label (entitas_id,jenis,nilai,utama) VALUES (1,'sektor','air',1)"); // utama hanya kepakaran
  await ok("INSERT INTO label (entitas_id,jenis,nilai,sumber_id) VALUES (1,'kepakaran','hidro',1)"); // lembaga boleh, tanpa batas 3
});

test('jejak dan trigger lain tetap hidup; jalan ulang dua kali menjaga data dan skema', async () => {
  const skema = async () => semua("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'entitas_cari_%' ORDER BY name");
  await ok("UPDATE akun SET telepon = '+628111111111' WHERE id = 1");
  const s1 = await skema(), n1 = await semua('SELECT * FROM label ORDER BY jenis,nilai'), e1 = await semua('SELECT * FROM entitas ORDER BY id');
  await jalan('0007_program.sql'); await jalan('0007_program.sql');
  assert.deepEqual(await skema(), s1);
  assert.deepEqual(await semua('SELECT * FROM label ORDER BY jenis,nilai'), n1);
  assert.deepEqual(await semua('SELECT * FROM entitas ORDER BY id'), e1);
  assert.equal((await semua('SELECT telepon FROM akun'))[0].telepon, '+628111111111'); // telepon selamat dari rerun
  assert.equal((await semua('SELECT * FROM entitas_cari')).length, e1.length);
  await tolak("UPDATE entitas SET slug = 'ganti' WHERE id = 1"); // entitas_kunci_tetap
  await tolak("INSERT INTO ikatan (dari,ke,jenis,per_tanggal,tingkat_bukti,sumber_id) VALUES (1,8,'bekerja-di','2026-11-01','cuplikan',1)"); // pasangan
  await tolak("INSERT INTO riwayat (target_id,jenis,tanggal,judul,oleh) VALUES ((SELECT id FROM entitas WHERE slug='plts-100gw'),'mou','2026-11-01','x',1)"); // target bukan orang/lembaga
  assert.deepEqual(await semua('SELECT * FROM pragma_foreign_key_check'), []);
});

test('0008: pasangan ikatan program sah, lainnya ditolak, rerun tidak menggandakan', async () => {
  await jalan('0008_program_ikatan.sql'); await jalan('0008_program_ikatan.sql');
  assert.equal((await semua("SELECT * FROM pasangan_ikatan WHERE ke_jenis = 'program'")).length, 5);
  const p = (await semua("SELECT id FROM entitas WHERE slug='plts-100gw'"))[0].id;
  const ik = (dari, jenis) => ok("INSERT INTO ikatan (dari,ke,jenis,per_tanggal,tingkat_bukti,sumber_id) VALUES (?,?,?,'2026-11-01','cuplikan',1)", dari, p, jenis);
  await ik(1, 'mendanai'); await ik(1, 'memimpin'); await ik(1, 'anggota-dari');
  await tolak("INSERT INTO ikatan (dari,ke,jenis,per_tanggal,tingkat_bukti,sumber_id) VALUES (8,?,'mendanai','2026-11-01','cuplikan',1)", p); // orang tak mendanai
  await tolak("INSERT INTO ikatan (dari,ke,jenis,per_tanggal,tingkat_bukti,sumber_id) VALUES (1,?,'memasok','2026-11-01','cuplikan',1)", p);
});

// ---- ketahanan: putus di tengah dan sqlite_sequence (DB sendiri, skema lama 0001-0006) ----
async function dbLama() {
  const b = await buatEnv({ migrasi: false });
  const d = b.env.DB;
  await d.exec('PRAGMA foreign_keys = ON');
  const lari = async (f, hingga) => {
    const st = pecahSql(fs.readFileSync(`migrations/${f}`, 'utf8'));
    const n = hingga ? st.findIndex((s) => s.startsWith(hingga)) + 1 : st.length;
    for (const s of st.slice(0, n)) await d.prepare(s).run();
  };
  for (let i = 1; i <= 6; i++) await lari(fs.readdirSync('migrations').find((f) => f.startsWith(String(i).padStart(4, '0'))));
  const q = (sql, ...p) => d.prepare(sql).bind(...p).run();
  const all = async (sql) => (await d.prepare(sql).all()).results;
  await q("INSERT INTO sumber (url,domain,jenis,diperiksa) VALUES ('https://example.org/a','example.org','media','2026-11-01')");
  await q("INSERT INTO akun (surel,nama,peran,status,garam,sandi,iterasi) VALUES ('s@example.org','S','super','aktif',?,?,100000)", hex(32), hex(64));
  for (const n of ['a', 'b', 'c']) await q("INSERT INTO entitas (kunci,slug,jenis,nama,sumber_id) VALUES (?,?,'lembaga',?,1)", `lembaga:${n}x`, `${n}x`, n);
  return { d, lari, q, all, tutup: b.tutup };
}

test('putus sesudah DROP akun: jalan ulang memakai cadangan, super selamat', async () => {
  const t = await dbLama();
  try {
    await t.lari('0007_program.sql', 'DROP TABLE IF EXISTS akun');
    assert.equal((await t.all("SELECT name FROM sqlite_master WHERE name IN ('akun','_cad_akun') ORDER BY name")).map((r) => r.name).join(), '_cad_akun');
    await t.lari('0007_program.sql');
    const a = await t.all('SELECT surel, peran FROM akun');
    assert.deepEqual(a, [{ surel: 's@example.org', peran: 'super' }]);
    assert.equal((await t.all('SELECT * FROM entitas')).length, 3);
    assert.equal((await t.all("SELECT name FROM sqlite_master WHERE name LIKE '\\_cad\\_%' ESCAPE '\\'")).length, 0);
  } finally { await t.tutup(); }
});

test('sqlite_sequence tidak mundur dan id terhapus tidak dipakai ulang', async () => {
  const t = await dbLama();
  try {
    await t.q("DELETE FROM entitas WHERE slug = 'cx'"); // id 3 dilepas, seq tetap 3
    const seq = async () => Object.fromEntries((await t.all('SELECT name, seq FROM sqlite_sequence')).map((r) => [r.name, r.seq]));
    const lama = await seq();
    assert.equal(lama.entitas, 3);
    await t.lari('0007_program.sql');
    const baru = await seq();
    for (const [k, v] of Object.entries(lama)) assert.ok(baru[k] >= v, `${k} mundur`);
    assert.equal(baru.entitas, 3);
    await t.q("INSERT INTO entitas (kunci,slug,jenis,nama,sumber_id) VALUES ('lembaga:dx','dx','lembaga','d',1)");
    assert.equal((await t.all("SELECT id FROM entitas WHERE slug = 'dx'"))[0].id, 4);
    await t.lari('0007_program.sql'); // rerun pada skema baru: seq tetap
    assert.equal((await seq()).entitas, 4);
  } finally { await t.tutup(); }
});
