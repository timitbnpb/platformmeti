// Uji migrasi di D1 LOKAL nyata (Miniflare lewat getPlatformProxy), persistensi ke direktori sementara. RU §3.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getPlatformProxy } from 'wrangler';

const DIR = path.resolve('migrations');
const BERKAS = fs.readdirSync(DIR).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();

// Pemecah pernyataan: trigger berisi ';' di dalam BEGIN ... END;
export function pecah(sql) {
  const hasil = []; let cur = [];
  for (const baris of sql.split('\n')) {
    if (/^\s*--/.test(baris)) continue;
    cur.push(baris);
    const s = cur.join('\n');
    const trigger = /\bCREATE\s+TRIGGER\b/i.test(s);
    if (trigger ? /\bEND;\s*$/i.test(s) : /;\s*$/.test(s)) { hasil.push(s.trim()); cur = []; }
  }
  assert.equal(cur.join('').trim(), '', 'pernyataan menggantung');
  return hasil;
}

let tmp, proxy, DB;
before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'meti-migrasi-'));
  const cfg = path.join(tmp, 'wrangler.jsonc');
  fs.writeFileSync(cfg, JSON.stringify({ name: 'uji', compatibility_date: '2026-11-01',
    d1_databases: [{ binding: 'DB', database_name: 'uji', database_id: '00000000-0000-0000-0000-000000000000' }] }));
  proxy = await getPlatformProxy({ configPath: cfg, persist: { path: path.join(tmp, 'state') } });
  DB = proxy.env.DB;
  await DB.exec('PRAGMA foreign_keys = ON');
});
after(async () => { await proxy?.dispose(); fs.rmSync(tmp, { recursive: true, force: true }); });

const jalan = async (f) => {
  for (const x of pecah(fs.readFileSync(path.join(DIR, f), 'utf8'))) {
    try { await DB.prepare(x).run(); } catch (e) { throw new Error(`${f}: ${e.message}\n${x.slice(0, 300)}`); }
  }
};
const skema = async () => (await DB.prepare("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'entitas_cari_%' ORDER BY name").all()).results;
const tolak = async (sql, ...p) => { await assert.rejects(() => DB.prepare(sql).bind(...p).run(), `harus ditolak: ${sql.slice(0, 70)}`); };
const ok = (sql, ...p) => DB.prepare(sql).bind(...p).run();
const hex = (n) => 'a'.repeat(n);

test('berkas bernomor urut tanpa lompatan', () => {
  BERKAS.forEach((f, i) => assert.ok(f.startsWith(String(i + 1).padStart(4, '0')), f));
  assert.equal(BERKAS.length, 9);
});

test('semua migrasi jalan di D1 kosong, lalu dua kali lagi tanpa galat dan tanpa baris ganda', async () => {
  for (const f of BERKAS) await jalan(f);
  const s1 = await skema();
  const n1 = (await DB.prepare('SELECT count(*) n FROM pasangan_ikatan').first()).n;
  for (const f of BERKAS) { await jalan(f); await jalan(f); }
  assert.deepEqual(await skema(), s1);
  assert.equal((await DB.prepare('SELECT count(*) n FROM pasangan_ikatan').first()).n, n1);
  assert.ok(n1 > 20);
  assert.deepEqual((await DB.prepare('SELECT * FROM pragma_foreign_key_check').all()).results, []);
  assert.ok(!s1.some((r) => /dummy/i.test(r.sql ?? '')), 'K15: tak ada kolom dummy');
});

let s, e1, e2, e3, akunId;
test('data dasar', async () => {
  const u = (await ok("INSERT INTO sumber (url,domain,jenis,diperiksa) VALUES ('https://example.org/a','example.org','media','2026-11-01')")).meta.last_row_id; s = u;
  const ent = (n, k, j, extra = '') => ok(`INSERT INTO entitas (kunci,slug,jenis,nama,sumber_id${extra ? ',' + extra.split('|')[0] : ''}) VALUES (?,?,?,?,?${extra ? ',' + extra.split('|')[1] : ''})`, k, n, j, n, s);
  e1 = (await ent('pt-a', 'lembaga:pt-a', 'lembaga')).meta.last_row_id;
  e2 = (await ent('pt-b', 'lembaga:pt-b', 'lembaga')).meta.last_row_id;
  e3 = (await ent('budi', 'orang:budi', 'orang')).meta.last_row_id;
  akunId = (await ok("INSERT INTO akun (surel,nama,peran,status,garam,sandi,iterasi) VALUES ('s@example.org','S','super','aktif',?,?,100000)", hex(32), hex(64))).meta.last_row_id;
});

test('CHECK akun, sesi menolak nilai salah; super terakhir terlindung', async () => {
  await tolak("INSERT INTO akun (surel,nama,peran) VALUES ('x@example.org','X','dewa')");
  await tolak("INSERT INTO akun (surel,nama,peran) VALUES ('x@example.org','X','wilayah')"); // wilayah tanpa cakupan
  await tolak("INSERT INTO akun (surel,nama,status) VALUES ('y@example.org','Y','aktif')"); // aktif tanpa sandi
  await tolak("INSERT INTO akun (surel,nama,status,garam,sandi,iterasi) VALUES ('z@example.org','Z','aktif',?,?,1000)", hex(32), hex(64));
  await tolak("INSERT INTO sesi (id_hash,akun_id,dibuat,sampai) VALUES (?,?,100,50)", hex(64), akunId);
  await tolak("INSERT INTO sesi (id_hash,akun_id,sampai) VALUES (?,?,99999999999)", 'pendek', akunId);
  await tolak("UPDATE akun SET peran='admin' WHERE id=?", akunId);
  await tolak("DELETE FROM akun WHERE id=?", akunId);
  await ok("INSERT INTO sesi (id_hash,akun_id,dibuat,sampai) VALUES (?,?,100,200)", hex(64), akunId);
});

test('jejak: CHECK dan append-only (UPDATE/DELETE ditolak)', async () => {
  await tolak("INSERT INTO jejak (aksi,tabel) VALUES ('dummy-isi','akun')");
  await tolak("INSERT INTO jejak (aksi,tabel,dari) VALUES ('tambah','akun','bukan json')");
  const id = (await ok("INSERT INTO jejak (aksi,tabel,dari) VALUES ('tambah','akun','{\"a\":1}')")).meta.last_row_id;
  await tolak('UPDATE jejak SET tabel=? WHERE id=?', 'lain', id);
  await tolak('DELETE FROM jejak WHERE id=?', id);
});

test('sumber, entitas, fakta, ikatan, label, alias: CHECK menolak', async () => {
  await tolak("INSERT INTO sumber (url,domain,jenis,diperiksa) VALUES ('ftp://example.org/x','example.org','media','2026-11-01')");
  await tolak("INSERT INTO sumber (url,domain,jenis,diperiksa) VALUES ('https://example.org/b','example.org','blog','2026-11-01')");
  await tolak("INSERT INTO sumber (url,domain,jenis,diperiksa) VALUES ('https://example.org/c','example.org','media','2026-02-30')");
  await tolak("INSERT INTO entitas (kunci,slug,jenis,nama,sumber_id) VALUES ('lembaga:x','x','lembaga','X',9999)"); // FK
  await tolak("INSERT INTO entitas (kunci,slug,jenis,nama,sumber_id,sektor,di_sensus) VALUES ('lembaga:n','n','lembaga','N',?,'nuklir',1)", s);
  await tolak("INSERT INTO entitas (kunci,slug,jenis,nama,sumber_id,kategori) VALUES ('orang:k','k','orang','K',?,'swasta')", s);
  await tolak("INSERT INTO entitas (kunci,slug,jenis,nama,sumber_id) VALUES ('lembaga:Y','Y_','lembaga','Y',?)", s);
  await tolak("UPDATE entitas SET slug='baru' WHERE id=?", e1);
  await tolak("UPDATE entitas SET status='digabung', digabung_ke=? WHERE id=?", e1, e1);
  await ok("INSERT INTO entitas (kunci,slug,jenis,nama,sumber_id,sektor,di_sensus) VALUES ('lembaga:surya','surya','lembaga','Surya',?,'surya',1)", s);
  await tolak("INSERT INTO label (entitas_id,jenis,nilai) VALUES (?,'rantai','surya')", e1);
  await ok("INSERT INTO label (entitas_id,jenis,nilai) VALUES (?,'rantai','epc')", e1);
  await tolak("INSERT INTO alias (entitas_id,nama,norm,asal) VALUES (?,'A','a','acak')", e1);
  await ok("INSERT INTO alias (entitas_id,nama,norm) VALUES (?,'PT A','pt a')", e1);
  const f = (kunci, t, n, sat, bukti, extra = '', lapis = 'publik', sid = s) =>
    ok(`INSERT INTO fakta (entitas_id,kunci,nilai_teks,nilai_num,satuan,per_tanggal,tingkat_bukti,lapis,sumber_id${extra ? ',' + extra.split('|')[0] : ''}) VALUES (?,?,?,?,?,'2026-11-01',?,?,?${extra ? ',' + extra.split('|')[1] : ''})`, e1, kunci, t, n, sat, bukti, lapis, sid);
  await tolak("INSERT INTO fakta (entitas_id,kunci,nilai_teks,per_tanggal,tingkat_bukti,sumber_id) VALUES (?, 'pimpinan','A','2026-11-01','terkonfirmasi',NULL)", e1); // tanpa sumber
  await tolak("INSERT INTO fakta (entitas_id,kunci,nilai_teks,per_tanggal,tingkat_bukti,sumber_id) VALUES (?, 'pimpinan','A','2026-11-01','mungkin',?)", e1, s); // enum bukti
  await tolak("INSERT INTO fakta (entitas_id,kunci,per_tanggal,tingkat_bukti,sumber_id) VALUES (?, 'pimpinan','2026-11-01','terkonfirmasi',?)", e1, s); // kosong tanpa alasan
  await tolak("INSERT INTO fakta (entitas_id,kunci,nilai_num,per_tanggal,tingkat_bukti,sumber_id) VALUES (?, 'pekerja',5,'2026-11-01','terkonfirmasi',?)", e1, s); // num tanpa satuan
  await tolak("INSERT INTO fakta (entitas_id,kunci,nilai_num,satuan,est,per_tanggal,tingkat_bukti,sumber_id) VALUES (?, 'output_idr',5,'IDR',1,'2026-11-01','terkonfirmasi',?)", e1, s); // est tanpa rumus
  await tolak("INSERT INTO fakta (entitas_id,kunci,nilai_teks,per_tanggal,tingkat_bukti,sumber_id) VALUES (?, 'kontak_surel','a@example.org','2026-11-01','kata-pihak',?)", e1, s); // kontak di lapis publik
  await tolak("INSERT INTO fakta (entitas_id,kunci,nilai_teks,per_tanggal,tingkat_bukti,sumber_id) VALUES (?, 'pimpinan','hubungi a@example.org','2026-11-01','kata-pihak',?)", e1, s); // surel di publik
  await tolak("INSERT INTO fakta (entitas_id,kunci,nilai_teks,per_tanggal,tingkat_bukti,sumber_id) VALUES (?, 'pimpinan','id 123456789','2026-11-01','kata-pihak',?)", e1, s); // 9 angka
  await ok("INSERT INTO fakta (entitas_id,kunci,nilai_teks,per_tanggal,tingkat_bukti,lapis,sumber_id) VALUES (?, 'kontak_surel','a@example.org','2026-11-01','kata-pihak','pengurus',?)", e1, s);
  await ok("INSERT INTO fakta (entitas_id,kunci,alasan_kosong,per_tanggal,tingkat_bukti,sumber_id) VALUES (?, 'pimpinan','belum-dicari','2026-11-01','inferensi',?)", e1, s);
  const ik = (dari, ke, jenis, extra = '') => ok(`INSERT INTO ikatan (dari,ke,jenis,per_tanggal,tingkat_bukti,sumber_id${extra ? ',' + extra.split('|')[0] : ''}) VALUES (?,?,?,'2026-11-01','cuplikan',?${extra ? ',' + extra.split('|')[1] : ''})`, dari, ke, jenis, s);
  await tolak("INSERT INTO ikatan (dari,ke,jenis,per_tanggal,tingkat_bukti,sumber_id) VALUES (?,?,'memasok','2026-11-01','cuplikan',NULL)", e1, e2);
  await tolak("INSERT INTO ikatan (dari,ke,jenis,per_tanggal,tingkat_bukti,sumber_id) VALUES (?,?,'memasok','2026-11-01','cuplikan',?)", e1, e1, s); // dari=ke
  await tolak("INSERT INTO ikatan (dari,ke,jenis,per_tanggal,tingkat_bukti,sumber_id) VALUES (?,?,'terbang','2026-11-01','cuplikan',?)", e1, e2, s);
  await tolak("INSERT INTO ikatan (dari,ke,jenis,jenis_pasok,per_tanggal,tingkat_bukti,sumber_id) VALUES (?,?,'mendanai','energi','2026-11-01','cuplikan',?)", e1, e2, s);
  await tolak("INSERT INTO ikatan (dari,ke,jenis,per_tanggal,tingkat_bukti,sumber_id) VALUES (?,?,'bekerja-di','2026-11-01','cuplikan',?)", e1, e2, s); // pasangan jenis salah (lembaga->lembaga)
  await ik(e3, e1, 'bekerja-di');
  await ik(e1, e2, 'memasok');
  await tolak("INSERT INTO ikatan (dari,ke,jenis,per_tanggal,tingkat_bukti,sumber_id) VALUES (?,?,'memasok','2026-11-01','cuplikan',?)", e1, e2, s); // duplikat unik
  // penggabungan tidak berantai: target harus aktif
  await ok("UPDATE entitas SET status='ditarik' WHERE id=?", e2);
  await tolak("UPDATE entitas SET status='digabung', digabung_ke=? WHERE id=?", e2, e3);
});

test('FTS5 entitas_cari tersinkron', async () => {
  const r = (await DB.prepare("SELECT rowid FROM entitas_cari WHERE entitas_cari MATCH 'surya'").all()).results;
  assert.equal(r.length, 1);
  const a = (await DB.prepare("SELECT rowid FROM entitas_cari WHERE entitas_cari MATCH 'alias:pt'").all()).results;
  assert.equal(a.length, 1);
});

test('koreksi, riwayat, laju: CHECK menolak', async () => {
  const k = (jenis, kunci, url, pk, status = 'baru', extra = '') =>
    ok(`INSERT INTO koreksi (entitas_id,jenis,kunci,usulan,sumber_url,pengaju_kontak,status${extra ? ',' + extra.split('|')[0] : ''}) VALUES (?,?,?,'u',?,?,?${extra ? ',' + extra.split('|')[1] : ''})`, e1, jenis, kunci, url, pk, status);
  await tolak("INSERT INTO koreksi (entitas_id,jenis,usulan) VALUES (?,'ubah','u')", e1); // tanpa sumber & kunci
  await tolak("INSERT INTO koreksi (entitas_id,jenis,usulan,pengaju_akun) VALUES (?,'sihir','u',?)", e1, akunId);
  await tolak("INSERT INTO koreksi (entitas_id,jenis,usulan) VALUES (?,'keluar','u')", e1); // tanpa pengaju
  await tolak("INSERT INTO koreksi (entitas_id,jenis,usulan,pengaju_kontak,status) VALUES (?,'keluar','u','k','ditolak')", e1);
  await k('keluar', null, null, 'k@example.org');
  await tolak("INSERT INTO koreksi (entitas_id,jenis,usulan,pengaju_kontak) VALUES (?,'keluar','u2','k@example.org')", e1); // terbuka unik
  const r = (jenis, tgl, oleh = akunId, target = e1) => ok("INSERT INTO riwayat (target_id,jenis,tanggal,judul,oleh) VALUES (?,?,?,'J',?)", target, jenis, tgl, oleh);
  await tolak("INSERT INTO riwayat (target_id,jenis,tanggal,judul,oleh) VALUES (?,'liburan','2026-11-01','J',?)", e1, akunId);
  await tolak("INSERT INTO riwayat (target_id,jenis,tanggal,judul,oleh) VALUES (?,'mou','2026-02-30','J',?)", e1, akunId);
  await tolak("INSERT INTO riwayat (target_id,jenis,tanggal,judul,oleh,penilaian) VALUES (?,'mou','2026-11-01','J',?,9)", e1, akunId);
  const wil = (await ok("INSERT INTO entitas (kunci,slug,jenis,nama,sumber_id) VALUES ('wilayah:jb','jb','wilayah','Jawa Barat',?)", s)).meta.last_row_id;
  await tolak("INSERT INTO riwayat (target_id,jenis,tanggal,judul,oleh) VALUES (?,'mou','2026-11-01','J',?)", wil, akunId); // target bukan orang/lembaga
  await r('mou', '2026-11-01');
  await tolak("INSERT INTO laju (kunci,aksi,jendela) VALUES ('k','sihir',1)");
  await tolak("INSERT INTO laju (kunci,aksi,jendela) VALUES ('k','cari',-1)");
  const up = "INSERT INTO laju (kunci,aksi,jendela) VALUES ('k','cari',5) ON CONFLICT (kunci,aksi,jendela) DO UPDATE SET jumlah = jumlah + 1 RETURNING jumlah";
  await DB.prepare(up).first();
  assert.equal((await DB.prepare(up).first()).jumlah, 2);
});

test('EXPLAIN QUERY PLAN: sesi by id_hash dan entitas by slug memakai indeks', async () => {
  const plan = async (q, ...p) => (await DB.prepare('EXPLAIN QUERY PLAN ' + q).bind(...p).all()).results.map((r) => r.detail).join(' | ');
  const a = await plan('SELECT * FROM sesi WHERE id_hash = ?', hex(64));
  assert.match(a, /USING (COVERING )?INDEX|PRIMARY KEY/i); assert.doesNotMatch(a, /SCAN sesi/);
  const b = await plan('SELECT * FROM entitas WHERE slug = ?', 'surya');
  assert.match(b, /USING (COVERING )?INDEX/i); assert.doesNotMatch(b, /SCAN entitas/);
});
