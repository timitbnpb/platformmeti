// /isu: invarian data (ID silang, tanggal, sumber, privasi), pustaka panen sopan, pipeline segar, i18n id/en, dan gerbang statis layar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bangun, cocokBerita, lengkapi, TEMA, STATUS } from '../scripts/pipa/isu_bangun.mjs';
import { urajRobots, hostBoleh, UA, JEDA_MS, HENTI } from '../scripts/panen/isu_panen_lib.mjs';
import { daftarUrl } from '../scripts/panen/isu_panen.mjs';

const baca = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const teks = (p) => fs.readFileSync(p, 'utf8');
const D = baca('public/data/isu.json');
const ID = (f) => new Set(baca(`public/data/${f}.json`).baris.map((b) => b.id));
const wilayah = new Set(baca('public/data/wilayah.json').baris.map((b) => b.kode));

test('isu.json segar: sama dengan hasil bangun dari seed dan lapis data', () => {
  assert.equal(JSON.stringify(bangun()), JSON.stringify(D), 'jalankan node scripts/pipa/isu_bangun.mjs');
});

test('cakupan: semua isu nasional dan kasus daerah yang diminta ada', () => {
  const id = new Set(D.baris.map((i) => i.id));
  for (const k of ['ruu-ebet', 'power-wheeling', 'tkdn-surya', 'harga-patokan-112', 'dmo-harga-batubara', 'pltu-captive', 'jetp-cipp', 'pensiun-dini-pltu', 'plts-atap', 'oversupply-take-or-pay', 'pendanaan-suku-bunga', 'perizinan-lahan', 'subsidi-tarif-listrik', 'co-firing-biomassa', 'nuklir-pltn', 'karbon-pajak-bursa', 'psel-tipping-fee', 'poco-leok', 'dieng-karangtengah', 'gunung-talang', 'wae-sano', 'mataloko', 'sorik-marapi', 'batang-toru', 'ungaran']) assert.ok(id.has(k), k);
  for (const pre of ['desa-energi-mati-', 'rued-tertinggal-', 'proyek-henti-', 'psel-']) assert.ok([...id].some((x) => x.startsWith(pre)), pre);
});

test('invarian: id unik, tema/status sah, tanggal ISO parsial terurut, ringkasan berisi', () => {
  const lihat = new Set();
  for (const i of D.baris) {
    assert.ok(!lihat.has(i.id), 'id ganda ' + i.id); lihat.add(i.id);
    assert.ok(TEMA.includes(i.tema), i.id + ' tema');
    assert.ok(STATUS.includes(i.status), i.id + ' status');
    assert.ok(['nasional', 'daerah'].includes(i.tingkat));
    assert.ok(['resmi', 'kajian', 'media'].includes(i.bukti), i.id + ' bukti');
    assert.ok(i.judul.length > 10 && i.ringkas.length > 60, i.id);
    let prev = '';
    for (const e of i.linimasa) {
      assert.match(e.tanggal, /^\d{4}(-\d{2}(-\d{2})?)?$/, i.id);
      assert.ok(lengkapi(e.tanggal) >= prev, i.id + ' linimasa tak urut'); prev = lengkapi(e.tanggal);
      assert.ok(e.sumber == null || i.sumber[e.sumber], i.id + ' indeks sumber linimasa');
      assert.ok(e.peristiwa.length > 10);
    }
    for (const p of i.pihak) assert.ok(p.sumber == null || i.sumber[p.sumber], i.id + ' indeks sumber pihak');
    assert.ok(i.sumber.length >= 1, i.id + ' tanpa sumber');
  }
  assert.ok(D.baris.filter((i) => i.tingkat === 'nasional').length >= 15);
});

test('ID silang: regulasi, proyek, organisasi, berita, provinsi, keterkaitan semua ada', () => {
  const reg = ID('regulasi'), pry = ID('proyek'), org = new Set(baca('public/data/organisasi.json').baris.map((b) => b.id)), ber = ID('berita'), isu = new Set(D.baris.map((i) => i.id));
  for (const i of D.baris) {
    for (const r of i.regulasi_ids) assert.ok(reg.has(r), `${i.id} regulasi ${r}`);
    for (const r of i.proyek_ids) assert.ok(pry.has(r), `${i.id} proyek ${r}`);
    for (const r of i.berita_ids) assert.ok(ber.has(r), `${i.id} berita ${r}`);
    for (const p of i.pihak) assert.ok(!p.org_id || org.has(p.org_id), `${i.id} org ${p.org_id}`);
    for (const w of i.wilayah) assert.ok(/^\d{2}(\d{2})?$/.test(w) && wilayah.has(w.slice(0, 2)), `${i.id} wilayah ${w}`);
    for (const k of i.prov) assert.ok(wilayah.has(k));
    for (const x of i.terkait) assert.ok(isu.has(x) && x !== i.id);
  }
  for (const [k, n] of Object.entries(D.meta.per_provinsi)) assert.equal(D.baris.filter((i) => i.prov.includes(k)).length, n);
});

test('sumber: https, bukan media sosial; tanpa foto; berita hanya tautan', () => {
  for (const i of D.baris) for (const s of i.sumber) {
    assert.match(s.url, /^https:\/\//, i.id);
    assert.ok(!/facebook|instagram|twitter|tiktok|youtube|t\.me|linkedin/.test(new URL(s.url).hostname), i.id + ' medsos');
    assert.ok(s.judul && s.penerbit, i.id);
  }
  assert.ok(!/"(gambar|foto|image)"/.test(JSON.stringify(D)), 'isu.json tak boleh memuat foto');
});

test('privasi: tanpa orang_id/kasus KPK/butir internal, posisi METI hanya ringkasan publik', () => {
  const s = JSON.stringify(D);
  assert.ok(!/orang_id|\bKPK\b|Komisi Pemberantasan|"butir"/.test(s));
  assert.ok(!/\u2014|\u2013/.test(s), 'tanpa em/en dash');
  for (const i of D.baris) if (i.posisi_meti) { assert.ok(i.posisi_meti.ringkas.length > 20); assert.ok(!('butir' in i.posisi_meti)); }
  const ebet = D.baris.find((i) => i.id === 'ruu-ebet');
  assert.ok(ebet.posisi_meti && ebet.konsultasi.id === 'ruu-ebet', 'RUU EBET memuat posisi METI publik dari konsultasi');
});

test('cocokBerita: batas kata, huruf kecil', () => {
  assert.ok(cocokBerita(['ruu ebet'], 'DPR Bahas RUU EBET Pekan Ini'));
  assert.ok(!cocokBerita(['ebet'], 'Defisit debet menumpuk'));
  assert.ok(cocokBerita(['pltu captive'], 'Soal PLTU captive, ...'));
  assert.ok(!cocokBerita([], 'apa saja'));
});

test('panen: UA tetap, jeda >= 2 detik, 403 dan 429 menghentikan, Antara dan medsos ditolak, robots dihormati', () => {
  assert.equal(UA, 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)');
  assert.ok(JEDA_MS >= 2000);
  assert.ok(HENTI.has(403) && HENTI.has(429));
  assert.ok(!hostBoleh('https://www.antaranews.com/berita/1') && !hostBoleh('https://en.antaranews.com/x') && !hostBoleh('https://x.com/a') && !hostBoleh('http://mongabay.co.id/a'));
  assert.ok(hostBoleh('https://mongabay.co.id/a'));
  const boleh = urajRobots('User-agent: *\nDisallow: /privat\nAllow: /privat/umum\n\nUser-agent: BotLain\nDisallow: /');
  assert.ok(boleh('/berita/1') && !boleh('/privat/x') && boleh('/privat/umum/a'));
  assert.ok(!urajRobots('User-agent: *\nDisallow: /')('/apa-saja'));
  assert.ok(daftarUrl().length > 50 && daftarUrl().every(hostBoleh));
});

test('i18n: kunci isu.* setara id/en dan semua t("isu.*") yang dipakai ada', () => {
  const id = baca('public/i18n/id.json'), en = baca('public/i18n/en.json');
  const kunci = (o) => Object.keys(o).filter((k) => k.startsWith('isu.')).sort();
  assert.deepEqual(kunci(id), kunci(en));
  assert.ok(kunci(id).length > 100);
  const dipakai = new Set();
  for (const f of ['isu.js', 'isu_umum.js', 'isu_daerah.js', 'isu_detail.js']) for (const m of teks('public/' + f).matchAll(/\bt\("(isu\.[a-z0-9._-]+)"/g)) dipakai.add(m[1]);
  for (const m of teks('public/isu.js').matchAll(/hlHtml\("(isu\.[a-z0-9._-]+)"/g)) dipakai.add(m[1]);
  for (const m of teks('public/isu_daerah.js').matchAll(/hlHtml\("(isu\.[a-z0-9._-]+)"/g)) dipakai.add(m[1]);
  for (const k of [...dipakai].filter((x) => !x.endsWith("."))) assert.ok(k in id, 'kunci hilang ' + k);
  for (const k of TEMA) assert.ok(`isu.tema.${k}` in id && `isu.tema.${k}` in en, 'tema ' + k);
  for (const k of STATUS) assert.ok(`isu.st.${k}` in id && `isu.st.${k}` in en);
  for (const k of ["resmi", "kajian", "media"]) assert.ok(`isu.bukti.${k}` in id && `isu.bukti.${k}` in en);
  assert.ok('terkait.isu' in id && 'terkait.isu' in en);
});

test('layar: tanpa style=, tanpa hex, modul bersama dipakai, menu Insight dan graf tautan memuat isu', () => {
  for (const f of ['isu.html', 'isu.js', 'isu_umum.js', 'isu_daerah.js', 'isu_detail.js', 'isu.css']) {
    const s = teks('public/' + f);
    assert.ok(!/\sstyle="/.test(s) && !/style=\\?"/.test(s), f + ' style=');
    assert.ok(!/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/.test(f === 'isu.html' ? s.replace(/<meta name="theme-color"[^>]*>/, '') : s), f + ' hex');
  }
  const js = teks('public/isu.js') + teks('public/isu_daerah.js') + teks('public/isu_detail.js');
  for (const m of ['/inti/tab_halaman.js', '/inti/panel_geser.js', '/inti/maplibre.js', '/peta_koroplet.js', '/inti/tautan.js', '/inti/komponen.js']) assert.ok(js.includes(m), m);
  assert.match(teks('public/inti/kepala.js'), /href: "\/isu", kunci: "isu\.nav"/);
  assert.match(teks('public/inti/tautan.js'), /isu: "isu"/);
  assert.match(teks('public/inti/komponen.js'), /\["isu", "peringatan"\]/);
  assert.match(teks('public/isu.html'), /<h1 id="judul"/);
});
