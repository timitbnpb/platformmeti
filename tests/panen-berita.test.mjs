import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { urai, uraiGdelt, kueriGdelt, kueriGoogle, urlKanon, dedup, jadikanBaris, kepakaranDari, bangunPencocok, robotsBolehkan, norm, ATURAN, KUERI, UA } from '../scripts/panen/berita.mjs';
import { relevan, jenis, durasi, ringkas, gabungStatistik, kuota, BATAS_UNIT } from '../scripts/panen/video.mjs';

const f = (n) => readFileSync(new URL(`./fixture/${n}`, import.meta.url), 'utf-8');
const orang = [{ orang_id: 'o_1', nama: 'Bahlil Lahadalia' }, { orang_id: 'o_2', nama: 'Yuliot' }];

test('urai RSS: CDATA, entitas, sufiks media, tanggal rusak dibuang, tanpa isi artikel', () => {
  const xs = urai(f('berita/feed_id.xml'));
  assert.equal(xs.length, 4);
  assert.equal(xs[0].judul, 'Bahlil Lahadalia: PLTS 100 GW Dikebut Lewat Desa & Koperasi');
  assert.equal(xs[0].media, 'Kompas.com');
  assert.equal(xs[0].terbit, '2026-11-06T03:00:00.000Z');
  assert.equal(xs[3].media, 'CNBC Indonesia');
  assert.ok(!JSON.stringify(xs).includes('isi tidak disimpan'));
});

test('dedup menurut judul ternormalisasi, kepakaran dan kueri digabung', () => {
  const o = { bahasa: 'id', tanggal_ambil: '2026-11-07' };
  const baris = [
    ...jadikanBaris(urai(f('berita/feed_id.xml')), { ...o, kueri: 'surya:id' }),
    ...jadikanBaris(urai(f('berita/feed_id.xml')), { ...o, kueri: 'kebijakan:id' }),
  ];
  const hasil = dedup(baris);
  assert.equal(hasil.length, 3);
  assert.deepEqual(hasil[0].kueri, ['surya:id', 'kebijakan:id']);
  assert.match(hasil[0].id, /^[0-9a-f]{10}$/);
  assert.equal(new Set(hasil.map((a) => a.id)).size, 3);
});

test('penandaan kepakaran K16 lewat kata kunci', () => {
  assert.deepEqual(kepakaranDari('PLTS 100 GW dikebut'), ['surya']);
  assert.deepEqual(kepakaranDari('Panas Bumi dan Hidro Jadi Andalan RUPTL Baru').sort(), ['hidro', 'kebijakan', 'panas-bumi']);
  assert.ok(kepakaranDari('Bursa Karbon Dorong Pembiayaan Transisi Energi').includes('karbon'));
  assert.deepEqual(kepakaranDari('Cuaca cerah di Jakarta'), []);
  assert.ok(kepakaranDari('Green Hydrogen Pilot Draws JETP Funds').includes('hidrogen'));
  assert.equal(Object.keys(ATURAN).sort().join(), Object.keys(KUERI).sort().join());
});

test('entitas: nama persis dua kata ke atas saja, sebagai kandidat rujukan', () => {
  const cocok = bangunPencocok(orang);
  assert.deepEqual(cocok('Bahlil Lahadalia: PLTS dikebut'), [{ orang_id: 'o_1', nama: 'Bahlil Lahadalia', jenis: 'kandidat-rujukan' }]);
  assert.deepEqual(cocok('Bahlil bicara PLTS'), []);
  assert.deepEqual(cocok('Yuliot hadir'), []);
});

test('robots.txt: Google News melarang /rss/search untuk agen umum', () => {
  const robots = 'User-agent: *\nDisallow: /\nAllow: /$\nAllow: /topics/\n\nUser-agent: Googlebot\nDisallow: /\n';
  assert.equal(robotsBolehkan(robots, '/rss/search?q=a'), false);
  assert.equal(robotsBolehkan(robots, '/topics/x'), true);
  assert.equal(robotsBolehkan('User-agent: *\nDisallow: /privat\n', '/rss/search'), true);
});

test('UA jujur dengan tautan kontak platform, tanpa surel pribadi', () => { assert.match(UA, /^METI-Network-research\/0\.1 \(\+https:\/\/platformmeti\.timitbnpb\.workers\.dev\)$/); assert.doesNotMatch(UA, /@/); });

test('video: relevansi, jenis kanal, durasi, statistik dari fixture', () => {
  const j = JSON.parse(f('video/search_surya.json'));
  const vs = j.search.items.map((i) => ringkas(i, j.kueri, '2026-11-07'));
  const lolos = vs.filter((v) => relevan(j.kueri, v.judul)).map((v) => v.video_id);
  assert.deepEqual(lolos, ['v1', 'v4']);
  assert.equal(vs[0].jenis, 'resmi');
  assert.equal(vs[3].jenis, 'media');
  assert.equal(vs[3].judul, 'Dialog Energi Surya Bersama KOMPAS TV & Pakar');
  assert.equal(jenis('PLN Pusat'), 'resmi');
  assert.equal(jenis('Dewan Energi Nasional'), 'resmi');
  assert.equal(durasi('PT1H2M'), 3720);
  assert.equal(gabungStatistik(vs[3], j.videos.items[1]).pendek, true);
  assert.equal(gabungStatistik(vs[0], j.videos.items[0]).tonton, 1200);
});

test('video: kuota harian berhenti di batas dan reset tiap hari', async () => {
  const { mkdtempSync } = await import('node:fs'); const { tmpdir } = await import('node:os'); const { join } = await import('node:path');
  const p = join(mkdtempSync(join(tmpdir(), 'kuota-')), 'k.json');
  const q = kuota(p, '2026-11-07');
  q.pakai(BATAS_UNIT - 100);
  assert.ok(q.boleh(100)); assert.ok(!q.boleh(101));
  assert.equal(kuota(p, '2026-11-07').k.unit, BATAS_UNIT - 100);
  assert.equal(kuota(p, '2026-11-08').k.unit, 0);
});

test('norm membuang diakritik dan tanda baca', () => assert.equal(norm('  Énergi, Surya!! '), 'energi surya'));

test('GDELT: petakan url/judul/domain/seendate/bahasa, buang bahasa lain dan tanggal rusak', () => {
  const xs = uraiGdelt(f('berita/gdelt_id.json'));
  assert.equal(xs.length, 3);
  assert.deepEqual(xs[0], { judul: 'PLTS Atap Naik 40 Persen di Kuartal Ketiga', url: 'https://www.antaranews.com/berita/111/plts-atap-naik?utm=x', media: 'antaranews.com', terbit: '2026-11-05T04:00:00.000Z', bahasa: 'id' });
  assert.equal(xs[1].judul, 'Bahlil Lahadalia: PLTS 100 GW dikebut lewat desa & koperasi');
  assert.equal(xs[2].bahasa, 'en');
  assert.throws(() => uraiGdelt('Please limit requests to one every 5 seconds'), /bukan JSON/);
});

test('sintaks kueri GDELT: kurung, frasa, filter bahasa', () => {
  assert.equal(kueriGdelt(['PLTS', 'energi surya'], 'id'), '(PLTS OR "energi surya") sourcelang:indonesian');
  assert.equal(kueriGdelt(['solar power'], 'en'), '"solar power" Indonesia sourcelang:english');
  for (const v of Object.values(KUERI)) for (const t of [...v.id, ...v.en]) assert.ok(t.length >= 3, t);
  assert.equal(kueriGoogle(['PLTA', 'tenaga air']), 'PLTA OR "tenaga air"');
});

test('RSS langsung: media tetap, judul dengan " - " tidak dipotong', () => {
  const xs = urai(f('berita/rss_Antara.xml'), { media: 'Antara' });
  assert.equal(xs.length, 3);
  assert.equal(xs[1].judul, 'Rupiah Menguat - Analis Optimistis');
  assert.equal(xs[0].media, 'Antara');
  assert.equal(xs[0].terbit, '2026-11-04T20:00:00.000Z');
});

test('dedup lintas sumber: judul sama ATAU URL kanonik sama, sumber_panen pertama bertahan', () => {
  const o = { tanggal_ambil: '2026-11-07' };
  const g = jadikanBaris(uraiGdelt(f('berita/gdelt_id.json')), { ...o, kueri: 'surya:id', sumber_panen: 'gdelt' });
  const r = jadikanBaris(urai(f('berita/rss_Antara.xml'), { media: 'Antara' }), { ...o, bahasa: 'id', kueri: 'feed', sumber_panen: 'rss:Antara' });
  const gg = jadikanBaris(urai(f('berita/feed_id.xml')), { ...o, bahasa: 'id', kueri: 'x', sumber_panen: 'google' });
  const h = dedup([...g, ...r, ...gg]);
  const atap = h.filter((a) => /plts atap/i.test(a.judul));
  assert.equal(atap.length, 1);                       // judul sama (huruf besar beda) + URL kanonik sama
  assert.equal(atap[0].sumber_panen, 'gdelt');
  assert.deepEqual(atap[0].kueri, ['surya:id', 'feed']);
  assert.equal(h.filter((a) => /desa & koperasi/i.test(a.judul)).length, 1);   // gdelt vs google, URL beda, judul sama
  assert.equal(urlKanon('https://www.X.com/a/?u=1#z'), 'x.com/a');
});
