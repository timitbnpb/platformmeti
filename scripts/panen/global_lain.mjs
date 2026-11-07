// Panen pemasok global (bayu, panas bumi, hidro, hidrogen, jaringan, biomassa): Wikidata + beranda resmi + logo.
//   node scripts/panen/global_lain.mjs <tanggal> [--tmp=DIR] [--hanya=Nama] | --selftest
// Keluaran mentah data/global/lain/panen.json (tanpa jaringan: global_lain_bangun.mjs). Sopan: robots, jeda 2 dtk/host, stop 403/429.
// Apa yang tak ditemukan di sumber DIKOSONGKAN, tidak ditebak.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { Penambang, ROOT, klaim, labelQid, wikidataEntitas, tulisJson, bacaJson } from '../pipa/global_pemasok.mjs';
import { idEntitas } from '../pipa/entitas_tambah.mjs';

export const SEG_KATA = { // istilah teks beranda -> label produk; bukti segmen = istilah ini ditemukan
  bayu: [[/offshore wind|wind offshore/i, 'turbin angin lepas pantai'], [/onshore wind|wind turbine/i, 'turbin angin darat'], [/\bblades?\b/i, 'bilah turbin'], [/\btowers?\b/i, 'menara turbin'], [/\bwind\b/i, 'angin']],
  'panas-bumi': [[/geothermal/i, 'panas bumi'], [/organic rankine|\bORC\b/i, 'siklus ORC'], [/steam turbine/i, 'turbin uap'], [/drilling/i, 'pengeboran']],
  hidro: [[/hydro ?(power|electric)|hydropower|hydro\b/i, 'pembangkit hidro'], [/pelton|francis|kaplan/i, 'turbin Pelton/Francis/Kaplan'], [/pumped storage/i, 'pumped storage'], [/turbine/i, 'turbin']],
  hidrogen: [[/electroly[sz]er/i, 'elektroliser'], [/\bPEM\b/, 'elektroliser PEM'], [/alkaline/i, 'elektroliser alkalin'], [/hydrogen/i, 'hidrogen'], [/fuel cell/i, 'sel bahan bakar']],
  jaringan: [[/\bHVDC\b/i, 'HVDC'], [/transformer/i, 'transformator'], [/switchgear/i, 'switchgear'], [/substation/i, 'gardu induk'], [/energy storage|\bBESS\b|battery/i, 'penyimpanan baterai'], [/grid/i, 'jaringan listrik']],
  biogas: [[/biogas/i, 'biogas'], [/digester/i, 'digester'], [/gas engine|jenbacher|CHP|cogeneration/i, 'gas engine/CHP'], [/biomethane|upgrading|bio-?CNG/i, 'biometana']],
  biofuel: [[/biodiesel|\bFAME\b/i, 'biodiesel/FAME'], [/renewable diesel|\bHVO\b/i, 'renewable diesel'], [/sustainable aviation|\bSAF\b/i, 'bioavtur'], [/ethanol/i, 'bioetanol'], [/enzyme/i, 'enzim'], [/catalyst/i, 'katalis']],
  biomassa: [[/biomass/i, 'biomassa'], [/boiler/i, 'boiler'], [/circulating fluidized|\bCFB\b|fluidized/i, 'fluidized bed'], [/waste[- ]to[- ]energy/i, 'waste-to-energy'], [/gasif/i, 'gasifikasi']],
};
export const hostInti = (u) => { const h = new URL(u).hostname.replace(/^www\./, '').split('.'); return h.length > 2 && /^(co|com|org|net|gov)$/.test(h[h.length - 2]) ? h.slice(-3).join('.') : h.slice(-2).join('.'); };
export const hashCommons = (berkas) => { const f = berkas.replace(/ /g, '_'); const h = crypto.createHash('md5').update(f).digest('hex'); return { f, a: h[0], ab: h.slice(0, 2) }; };
export function urlCommons(berkas, lebar = 256) {
  const { f, a, ab } = hashCommons(berkas); const svg = /\.svg$/i.test(f);
  return { thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/${a}/${ab}/${encodeURIComponent(f)}/${lebar}px-${encodeURIComponent(f)}${svg ? '.png' : ''}`, asli: `https://upload.wikimedia.org/wikipedia/commons/${a}/${ab}/${encodeURIComponent(f)}`, halaman: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f)}` };
}
export function bacaBeranda(html, base) {
  const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
  const meta = (n) => { for (const m of html.matchAll(/<meta\b[^>]*>/gi)) if (new RegExp(`(name|property)=["']${n}["']`, 'i').test(m[0])) return /content=["']([^"']*)/i.exec(m[0])?.[1]; };
  const teks = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
  const ikon = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).filter((l) => /rel=["'][^"']*icon/i.test(l)).map((l) => ({ href: /href=["']([^"']+)/i.exec(l)?.[1], apple: /apple-touch/i.test(l), sz: Number(/sizes=["'](\d+)/i.exec(l)?.[1] || 0) })).filter((c) => c.href && !/\.svg(\?|$)/i.test(c.href)).sort((a, b) => b.apple - a.apple || b.sz - a.sz).map((c) => new URL(c.href, base).href);
  const idn = [...html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]{0,120}?)<\/a>/gi)].find((m) => /indonesia/i.test(m[2].replace(/<[^>]+>/g, '') + m[1]));
  return { judul: dec(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || ''), deskripsi: dec(meta('description') || meta('og:description') || ''), teks, ikon, indonesia: idn ? new URL(idn[1], base).href : null };
}
const tahunDari = (c) => { const m = /^\+(\d{4})/.exec(c?.time || ''); return m ? Number(m[1]) : null; };

async function utama() {
  const tgl = process.argv[2]; if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) throw new Error('tanggal YYYY-MM-DD wajib');
  const tmp = (process.argv.find((a) => a.startsWith('--tmp=')) || '').slice(6) || path.join(ROOT, 'data-panen/global-lain');
  const hanya = (process.argv.find((a) => a.startsWith('--hanya=')) || '').slice(8);
  fs.mkdirSync(tmp, { recursive: true });
  const cf = path.join(tmp, 'cache.json'); const cache = bacaJson(cf, { wd: {}, beranda: {}, logo: {} });
  const seed = bacaJson(path.join(ROOT, 'data/global/lain/seed.json')).baris.filter((s) => !hanya || s.nama === hanya);
  const p = new Penambang({ jedaMs: 2100 });
  const WD = 'https://www.wikidata.org/w/api.php';
  for (const s of seed) {
    // 1. Wikidata: kandidat dipilih hanya bila situs resmi (P856) sama dengan situs seed
    if (!cache.wd[s.nama]) {
      const j = await p.json(`${WD}?action=wbsearchentities&search=${encodeURIComponent(s.cari || s.nama)}&language=en&type=item&limit=6&format=json`);
      const ids = (j?.search || []).map((x) => x.id); const ent = ids.length ? await wikidataEntitas(p, ids) : {};
      const cocok = ids.map((i) => ent[i]).find((e) => klaim(e, 'P856').some((u) => { try { return hostInti(u) === hostInti(s.situs); } catch { return false; } }));
      cache.wd[s.nama] = cocok ? { id: cocok.id, label: cocok.labels?.en?.value, desk: cocok.descriptions?.en?.value, situs: klaim(cocok, 'P856')[0], negara: klaim(cocok, 'P17').map((x) => x.id), hq: klaim(cocok, 'P159').map((x) => x.id), logo: klaim(cocok, 'P154')[0] || null, berdiri: tahunDari(klaim(cocok, 'P571')[0]), enwiki: cocok.sitelinks?.enwiki?.title } : { tidak: true };
      fs.writeFileSync(cf, JSON.stringify(cache));
    }
    // 2. beranda resmi
    if (!cache.beranda[s.nama]) {
      const r = await p.ambil(s.situs); let b = { ok: false, alasan: r.alasan };
      if (r.ok && /html/i.test(r.tipe)) { const h = bacaBeranda(r.buf.toString('utf8').slice(0, 2e6), s.situs); b = { ok: true, judul: h.judul, deskripsi: h.deskripsi, ikon: h.ikon.slice(0, 3), indonesia: h.indonesia, produk: Object.fromEntries(Object.entries(SEG_KATA).map(([k, v]) => [k, v.filter(([re]) => re.test(h.teks)).map(([, l]) => l)])) }; }
      cache.beranda[s.nama] = b; fs.writeFileSync(cf, JSON.stringify(cache));
    }
    console.log(s.nama, cache.wd[s.nama].id || 'tanpa-wikidata', cache.beranda[s.nama].ok ? 'beranda-ok' : cache.beranda[s.nama].alasan);
  }
  // 3. negara (ISO2 dari Wikidata P297 entitas negara; HQ -> P17 bila P17 perusahaan kosong tidak dipakai: tidak ditebak)
  const qn = [...new Set(Object.values(cache.wd).flatMap((w) => w.negara || []))];
  const lab = await labelQid(p, qn);
  // 4. logo: P154 Commons, lalu ikon beranda
  const logoDir = path.join(ROOT, 'public/img/logo/org'); fs.mkdirSync(logoDir, { recursive: true });
  for (const s of seed) {
    const id = idEntitas(s.nama), out = path.join(logoDir, id + '.png'); const w = cache.wd[s.nama], b = cache.beranda[s.nama];
    if (cache.logo[s.nama] || fs.existsSync(out)) { cache.logo[s.nama] ||= { berkas: id + '.png', ada: true }; continue; }
    let hasil = null;
    const simpan = async (buf) => sharp(buf).resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toFile(out);
    if (w.logo) { const u = urlCommons(w.logo); for (const [k, url] of [['thumb', u.thumb], ['asli', u.asli]]) { const r = await p.ambil(url); if (r.ok) { try { await simpan(r.buf); hasil = { sumber: 'Wikidata P154 / Wikimedia Commons', url: u.halaman }; break; } catch { /* coba berikut */ } } if (p.blokir.has('upload.wikimedia.org')) break; } }
    if (!hasil && b.ok) for (const url of b.ikon) { const r = await p.ambil(url); if (r.ok) { try { await simpan(r.buf); hasil = { sumber: 'ikon resmi situs', url }; break; } catch { /* berikut */ } } }
    cache.logo[s.nama] = hasil ? { berkas: id + '.png', ...hasil } : { tanpa: true };
    fs.writeFileSync(cf, JSON.stringify(cache));
  }
  const baris = seed.map((s) => { const w = cache.wd[s.nama], b = cache.beranda[s.nama];
    return { nama: s.nama, situs: s.situs, segmen: s.segmen, sub: s.sub || [], alias: s.alias, wikidata: w.tidak ? null : { id: w.id, label: w.label, deskripsi: w.desk, tahun_berdiri: w.berdiri, enwiki: w.enwiki, logo_berkas: w.logo, iso2: [...new Set((w.negara || []).map((q) => lab[q]?.iso2).filter(Boolean))] },
      beranda: b.ok ? { judul: b.judul, deskripsi: b.deskripsi, indonesia: b.indonesia, produk: b.produk } : { gagal: b.alasan }, logo: cache.logo[s.nama] }; });
  tulisJson(path.join(ROOT, 'data/global/lain/panen.json'), { sumber: 'Wikidata (CC0) + beranda resmi perusahaan', diambil: tgl, lisensi: 'Wikidata CC0; fakta beranda dikutip singkat dengan tautan', baris });
  const sumber = path.join(logoDir, 'SUMBER.md');
  const sudah = fs.existsSync(sumber) ? fs.readFileSync(sumber, 'utf8') : '# Sumber logo organisasi (pemasok global)\n\nLogo hanya untuk mengenali perusahaan; merek dagang milik pemiliknya. Diambil dari Wikidata P154 (Wikimedia Commons) atau ikon resmi di situs perusahaan, bukan og:image. UA METI-Network-research/0.1. Maks 256 px.\n\n| berkas | perusahaan | sumber | diambil |\n| --- | --- | --- | --- |\n';
  const tambah = baris.filter((x) => x.logo?.url && !sudah.includes(`| ${x.logo.berkas} |`)).map((x) => `| ${x.logo.berkas} | ${x.nama} | ${x.logo.sumber}: ${x.logo.url} | ${tgl} |\n`).join('');
  fs.writeFileSync(sumber, sudah + tambah, 'utf8');
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  if (process.argv.includes('--selftest')) {
    assert.equal(hostInti('https://www.vestas.com/x'), 'vestas.com'); assert.equal(hostInti('https://www.hec.com.cn/'), 'hec.com.cn');
    assert.match(urlCommons('Vestas logo.svg').thumb, /thumb\/[0-9a-f]\/[0-9a-f]{2}\/Vestas_logo\.svg\/256px-Vestas_logo\.svg\.png$/);
    const h = bacaBeranda('<title>A &amp; B</title><meta name="description" content="x y"><a href="/id/">Indonesia</a><p>offshore wind turbine</p>', 'https://a.com/'); assert.equal(h.judul, 'A & B'); assert.equal(h.indonesia, 'https://a.com/id/'); assert.ok(SEG_KATA.bayu[0][0].test(h.teks));
    console.log('selftest ok');
  } else await utama();
}
