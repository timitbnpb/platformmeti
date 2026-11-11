// JM-T01: pustaka bot dengan server HTTP lokal sebagai fixture (tanpa internet).
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buatBot, bolehRobots, bacaSinyal, jalankan, jatuhTempo, GalatBot, UA, tulisStatus, bacaStatus } from '../scripts/panen/_bot.mjs';

const hits = [];
let robotsTxt = 'User-agent: *\nDisallow: /dilarang\n', perilaku = {};
const server = http.createServer((q, r) => {
  hits.push({ url: q.url, ua: q.headers['user-agent'], method: q.method });
  if (q.url === '/robots.txt') { r.writeHead(200, { 'content-type': 'text/plain' }); return r.end(robotsTxt); }
  const f = perilaku[q.url];
  if (f) return f(q, r);
  r.writeHead(200, { etag: '"v1"', 'content-type': 'text/plain' }); r.end(q.method === 'HEAD' ? undefined : 'isi');
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const B = `http://127.0.0.1:${server.address().port}`;
test.after(() => server.close());
test.beforeEach(() => { hits.length = 0; perilaku = {}; robotsTxt = 'User-agent: *\nDisallow: /dilarang\n'; });

const bot = (o = {}) => { const tidur = []; let t = 1e6; const b = buatBot({ tidur: async (ms) => { tidur.push(ms); t += ms; }, sekarang: () => t, ...o }); return { ...b, tidur }; };

test('T01 robots melarang: ditolak tanpa permintaan ke jalur itu', async () => {
  const b = bot();
  await assert.rejects(b.ambilSopan(B + '/dilarang/x'), (e) => e instanceof GalatBot && e.kode === 'robots');
  assert.deepEqual(hits.map((h) => h.url), ['/robots.txt']);
  assert.equal((await b.ambilSopan(B + '/boleh')).teks(), 'isi');
});
test('T01 robots dibaca ulang tiap putaran, dan bot baru berhenti bila berubah melarang', async () => {
  const a = bot(); await a.ambilSopan(B + '/boleh'); await a.ambilSopan(B + '/boleh2');
  assert.equal(hits.filter((h) => h.url === '/robots.txt').length, 1);
  robotsTxt = 'User-agent: *\nDisallow: /\n';
  await assert.rejects(bot().ambilSopan(B + '/boleh'), (e) => e.kode === 'robots');
  assert.equal(hits.filter((h) => h.url === '/robots.txt').length, 2);
});
test('T01 UA jujur METI dan kelompok agen kita menang atas *', async () => {
  await bot().ambilSopan(B + '/boleh');
  assert.ok(hits.every((h) => h.ua === UA) && /METI/.test(UA) && /direktori\.metiires\.or\.id/.test(UA));
  assert.equal(bolehRobots('User-agent: *\nDisallow: /\n\nUser-agent: METI-Network-research\nAllow: /\n', '/a'), true);
  assert.equal(bolehRobots('User-agent: *\nDisallow: /a\nAllow: /a/b\n', '/a/b/c'), true);
  assert.equal(bolehRobots('User-agent: *\nDisallow: /*.pdf$\n', '/x.pdf'), false);
  assert.equal(bolehRobots('User-agent: *\nDisallow:\n', '/x'), true);
});
test('T01 jeda minimal 2 detik per host (jam palsu)', async () => {
  const b = bot();
  await b.ambilSopan(B + '/a'); await b.ambilSopan(B + '/b');
  assert.ok(b.tidur.length >= 2 && b.tidur.every((ms) => ms >= 2100 - 1), 'tiap permintaan setelah yang pertama menunggu >= 2,1 dtk: ' + b.tidur);
});
test('T01 403 menghentikan host: permintaan berikutnya tidak keluar', async () => {
  perilaku['/terlarang'] = (q, r) => { r.writeHead(403); r.end(); };
  const b = bot();
  await assert.rejects(b.ambilSopan(B + '/terlarang'), (e) => e.kode === 'blokir');
  const n = hits.length;
  await assert.rejects(b.ambilSopan(B + '/lain'), (e) => e.kode === 'blokir');
  assert.equal(hits.length, n);
});
test('T01 429: menghormati Retry-After sekali lalu berhenti', async () => {
  perilaku['/p'] = (q, r) => { r.writeHead(429, { 'retry-after': '7' }); r.end(); };
  const b = bot();
  await assert.rejects(b.ambilSopan(B + '/p'), (e) => e.kode === 'blokir');
  assert.ok(b.tidur.includes(7000));
  assert.equal(hits.filter((h) => h.url === '/p').length, 2);
  const c = bot(); perilaku['/q'] = (q, r) => { r.writeHead(429, { 'retry-after': '99999' }); r.end(); };
  await assert.rejects(c.ambilSopan(B + '/q'), (e) => e.kode === 'blokir');
  assert.equal(hits.filter((h) => h.url === '/q').length, 1, 'Retry-After berjam-jam tidak ditunggu');
});
test('T01 5xx satu percobaan ulang dengan backoff, lalu gagal (bukan blokir)', async () => {
  perilaku['/s'] = (q, r) => { r.writeHead(503); r.end(); };
  await assert.rejects(bot().ambilSopan(B + '/s'), (e) => e.kode === 'gagal');
  assert.equal(hits.filter((h) => h.url === '/s').length, 2);
});
test('T01 Antara, media sosial, SINTA, One Map ditolak sebelum fetch apa pun', async () => {
  let n = 0; const b = buatBot({ fetchFn: async () => { n++; return new Response('x'); }, tidur: async () => {} });
  for (const u of ['https://www.antaranews.com/rss/x', 'https://m.facebook.com/a', 'https://x.com/a', 'https://www.instagram.com/a', 'https://sinta.kemdiktisaintek.go.id/', 'https://geoportal.esdm.go.id/', 'https://siinas.kemenperin.go.id/'])
    await assert.rejects(b.ambilSopan(u), (e) => e.kode === 'daftar_hitam', u);
  assert.equal(n, 0);
});
test('T01 pengalihan ke host lain tetap lewat robots dan daftar hitam', async () => {
  perilaku['/alih'] = (q, r) => { r.writeHead(302, { location: 'https://www.antaranews.com/x' }); r.end(); };
  await assert.rejects(bot().ambilSopan(B + '/alih'), (e) => e.kode === 'daftar_hitam');
});
test('T01 sinyal ETag/panjang/hash', async () => {
  const b = bot();
  assert.equal(await bacaSinyal(b, B + '/s1', 'etag'), '"v1"');
  assert.match(await bacaSinyal(b, B + '/s1', 'hash'), /^[0-9a-f]{64}$/);
  assert.equal(await bacaSinyal(b, B + '/s1', 'tanpa'), null);
});
test('T01 jatuh tempo menurut frekuensi', () => {
  assert.equal(jatuhTempo({ frekuensi: 'harian' }, { diambil: '2026-11-10' }, '2026-11-11'), true);
  assert.equal(jatuhTempo({ frekuensi: 'mingguan' }, { diambil: '2026-11-10' }, '2026-11-11'), false);
  assert.equal(jatuhTempo({ frekuensi: 'statis' }, null, '2026-11-11'), false);
  assert.equal(jatuhTempo({ frekuensi: 'bulanan' }, null, '2026-11-11'), true);
});

// Putaran penuh
const S = (kode, o = {}) => ({ kode, nama: kode, host: `127.0.0.1:${server.address().port}`, url_sinyal: B + '/ok', jenis_sinyal: 'tanpa', frekuensi: 'harian', jadwal: 'harian', mode: 'otomatis', jenis_waktu: 'aliran', dataset: [], utama: false, skrip: 'x.mjs', butuh_kunci: null, robots_boleh: true, status: 'basi', ...o });
const putaran = async (registri, { jalan, env = {}, kini = '2026-11-11', st } = {}) => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bot-')), 'status.json');
  if (st) tulisStatus(f, st);
  const r = await jalankan({ jadwal: 'harian', kini, registri, env, berkasStatus: f, bot: bot(), jalan: jalan || (async () => ({ kode: 0, teks: 'ok' })) });
  return { ...r, st: bacaStatus(f), f };
};
test('T01 satu sumber gagal tidak menggagalkan putaran; yang lain tetap ok', async () => {
  const r = await putaran([S('a'), S('b'), S('c')], { jalan: async (s) => (s.kode === 'b' ? { kode: 1, teks: 'meledak' } : { kode: 0, teks: '' }) });
  assert.deepEqual(r.hasil.map((h) => h.status), ['ok', 'gagal', 'ok']);
  assert.equal(r.st.a.diambil, '2026-11-11'); assert.equal(r.st.b.gagal_beruntun, 1);
});
test('T01 tiga gagal berturut menandai isu; diambil lama dipertahankan; ok mereset', async () => {
  const gagal = async () => ({ kode: 1, teks: 'x' });
  let st = { a: { status: 'gagal', gagal_beruntun: 2, diambil: '2026-11-01' } };
  const r = await putaran([S('a')], { jalan: gagal, st });
  assert.deepEqual(r.isu, ['a']); assert.equal(r.st.a.diambil, '2026-11-01'); assert.equal(r.st.a.gagal_beruntun, 3);
  const r2 = await putaran([S('a')], { st: r.st });
  assert.equal(r2.st.a.gagal_beruntun, 0); assert.deepEqual(r2.isu, []);
});
test('T01 perlu_kunci dilewati tanpa menjalankan skrip', async () => {
  let n = 0; const j = async () => { n++; return { kode: 0, teks: '' }; };
  const r = await putaran([S('a', { butuh_kunci: 'BPS_KUNCI' })], { jalan: j });
  assert.equal(r.st.a.status, 'perlu_kunci'); assert.equal(n, 0);
  await putaran([S('a', { butuh_kunci: 'BPS_KUNCI' })], { jalan: j, env: { BPS_KUNCI: 'k' } }); assert.equal(n, 1);
});
test('T01 robots melarang = blokir, dilewati; blokir bertahan sampai orang meninjau, juga dengan paksa', async () => {
  const r = await putaran([S('a', { url_sinyal: B + '/dilarang/data', jenis_sinyal: 'etag' })]);
  assert.equal(r.st.a.status, 'blokir');
  let n = 0; await putaran([S('a')], { st: r.st, jalan: async () => { n++; return { kode: 0, teks: '' }; } });
  assert.equal(n, 0);
});
test('T01 skrip exit 2 (konvensi robots/403) = blokir; tanpa skrip = basi tercatat', async () => {
  const r = await putaran([S('a'), S('b', { skrip: null })], { jalan: async () => ({ kode: 2, teks: 'robots melarang' }) });
  assert.equal(r.st.a.status, 'blokir'); assert.equal(r.st.b.status, 'basi'); assert.equal(r.st.b.gagal_beruntun, 0);
});
test('T01 sinyal tak berubah: tidak menjalankan skrip; berubah: jalan dan menyimpan sinyal', async () => {
  const reg = [S('a', { url_sinyal: B + '/data', jenis_sinyal: 'etag' })];
  let n = 0; const j = async () => { n++; return { kode: 0, teks: '' }; };
  const r1 = await putaran(reg, { jalan: j }); assert.equal(n, 1); assert.equal(r1.st.a.sinyal, '"v1"');
  const r2 = await putaran(reg, { jalan: j, st: r1.st, kini: '2026-11-12' }); assert.equal(n, 1); assert.equal(r2.st.a.status, 'ok');
});
test('T01 belum jatuh tempo dilewati; dengan paksa jalan', async () => {
  let n = 0; const j = async () => { n++; return { kode: 0, teks: '' }; };
  const st = { a: { status: 'ok', gagal_beruntun: 0, diambil: '2026-11-11' } };
  await putaran([S('a')], { jalan: j, st }); assert.equal(n, 0);
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bot-')), 's.json'); tulisStatus(f, st);
  await jalankan({ jadwal: 'harian', kini: '2026-11-11', paksa: true, registri: [S('a')], env: {}, berkasStatus: f, bot: bot(), jalan: j }); assert.equal(n, 1);
});
