// Panen pelaku global (IPP, EPC, uji/sertifikasi, konsultan, ECA/asuransi, pembeli): Wikidata + Wikipedia + beranda resmi + logo.
//   node scripts/panen/global_pelaku.mjs <tanggal> [--tmp=DIR] [--hanya=Nama] | --selftest
// Keluaran mentah data/global/pelaku/panen.json (tanpa jaringan: global_pelaku_bangun.mjs). Sopan: robots, jeda 2 dtk/host, stop 403/429.
// Yang tak ditemukan di sumber DIKOSONGKAN, tidak ditebak.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { Penambang, ROOT, klaim, labelQid, wikidataEntitas, wikipediaTeks, kalimat, tulisJson, bacaJson } from '../pipa/global_pemasok.mjs';
import { idEntitas } from '../pipa/entitas_tambah.mjs';
import { hostInti, urlCommons, bacaBeranda } from './global_lain.mjs';

const WD = 'https://www.wikidata.org/w/api.php';
const polos = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const RE_ID = /\bIndonesia(n)?\b|\bJakarta\b|\bJava\b|\bSumatra\b|\bSulawesi\b|\bKalimantan\b/;
export const RE_PORTO = /\b\d[\d,.]*\s?(GW|MW|GWh|MWh)\b|\bprojects?\b|\bportfolio\b|\bcapacity\b/i;
export const RE_KOMIT = /\bRE100\b|\bnet[- ]zero\b|\b100 ?%? (renewable|carbon[- ]free)|\bcommit(s|ted|ment)?\b|\bpower purchase\b/i;
/** pilih kalimat berkait Indonesia / portofolio / komitmen dari teks Wikipedia */
export function pilihKalimat(teks) {
  const k = kalimat(teks);
  return { indonesia: k.filter((s) => RE_ID.test(s)).slice(0, 3), portofolio: k.filter((s) => RE_PORTO.test(s) && !RE_ID.test(s)).slice(0, 2), komitmen: k.filter((s) => RE_KOMIT.test(s)).slice(0, 2) };
}
export function pilihKandidat(seed, ent) { // situs sama menang; jika tidak, label persis (tanpa diakritik)
  const list = Object.values(ent);
  const host = (u) => { try { return hostInti(u); } catch { return null; } };
  const bySitus = list.find((e) => klaim(e, 'P856').some((u) => host(u) === host(seed.situs)));
  if (bySitus) return { e: bySitus, cocok: 'situs' };
  const nm = polos(seed.cari || seed.nama);
  const byLabel = list.find((e) => polos(e.labels?.en?.value || '') === nm && (klaim(e, 'P856').length || klaim(e, 'P31').length));
  return byLabel ? { e: byLabel, cocok: 'label' } : null;
}

async function utama() {
  const tgl = process.argv[2]; if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) throw new Error('tanggal YYYY-MM-DD wajib');
  const tmp = (process.argv.find((a) => a.startsWith('--tmp=')) || '').slice(6) || path.join(ROOT, 'data-panen/global-pelaku');
  const hanya = (process.argv.find((a) => a.startsWith('--hanya=')) || '').slice(8);
  fs.mkdirSync(tmp, { recursive: true });
  const cf = path.join(tmp, 'cache.json'); const cache = bacaJson(cf, { wd: {}, wiki: {}, beranda: {}, logo: {} });
  const simpanCache = () => fs.writeFileSync(cf, JSON.stringify(cache));
  const seed = bacaJson(path.join(ROOT, 'data/global/pelaku/seed.json')).baris.filter((s) => !hanya || s.nama === hanya);
  const p = new Penambang({ jedaMs: 2100 });
  for (const s of seed) {
    if (!cache.wd[s.nama]) {
      const j = await p.json(`${WD}?action=wbsearchentities&search=${encodeURIComponent(s.cari || s.nama)}&language=en&type=item&limit=7&format=json`);
      const ids = (j?.search || []).map((x) => x.id); const ent = ids.length ? await wikidataEntitas(p, ids) : {};
      const c = pilihKandidat(s, ent);
      cache.wd[s.nama] = c ? { id: c.e.id, cocok: c.cocok, label: c.e.labels?.en?.value, desk: c.e.descriptions?.en?.value, situs: klaim(c.e, 'P856')[0], negara: [...klaim(c.e, 'P17'), ...klaim(c.e, 'P495')].map((x) => x.id), berdiri: (/^\+(\d{4})/.exec(klaim(c.e, 'P571')[0]?.time || '') || [])[1] || null, logo: klaim(c.e, 'P154')[0] || null, enwiki: c.e.sitelinks?.enwiki?.title || null } : { tidak: true };
      simpanCache();
    }
    const w = cache.wd[s.nama];
    if (w.enwiki && !cache.wiki[s.nama]) { const t = await wikipediaTeks(p, [w.enwiki]); cache.wiki[s.nama] = { judul: w.enwiki, url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(w.enwiki.replace(/ /g, '_')), ...pilihKalimat(t[w.enwiki] || '') }; simpanCache(); }
    if (!cache.beranda[s.nama]) {
      const r = await p.ambil(s.situs); let b = { ok: false, alasan: r.alasan };
      if (r.ok && /html/i.test(r.tipe)) { const h = bacaBeranda(r.buf.toString('utf8').slice(0, 2e6), r.url || s.situs); b = { ok: true, judul: h.judul, deskripsi: h.deskripsi, ikon: h.ikon.slice(0, 3), indonesia: h.indonesia }; }
      cache.beranda[s.nama] = b; simpanCache();
    }
    console.log(s.nama, w.id || 'tanpa-wikidata', w.cocok || '', cache.beranda[s.nama].ok ? 'beranda-ok' : cache.beranda[s.nama].alasan);
  }
  const lab = await labelQid(p, [...new Set(Object.values(cache.wd).flatMap((w) => w.negara || []))]);
  const logoDir = path.join(ROOT, 'public/img/logo/org'); fs.mkdirSync(logoDir, { recursive: true });
  for (const s of seed) {
    const id = idEntitas(s.nama), out = path.join(logoDir, id + '.png'); const w = cache.wd[s.nama], b = cache.beranda[s.nama];
    if (cache.logo[s.nama] && (cache.logo[s.nama].tanpa || fs.existsSync(out))) continue;
    if (fs.existsSync(out) && !cache.logo[s.nama]) { cache.logo[s.nama] = { berkas: id + '.png', ada: true }; continue; }
    let hasil = null;
    const simpan = async (buf) => sharp(buf).resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toFile(out);
    if (w.logo) { const u = urlCommons(w.logo); for (const url of [u.thumb, u.asli]) { const r = await p.ambil(url); if (r.ok) { try { await simpan(r.buf); hasil = { sumber: 'Wikidata P154 / Wikimedia Commons', url: u.halaman }; break; } catch { /* berikut */ } } } }
    if (!hasil && b.ok) for (const url of b.ikon) { const r = await p.ambil(url); if (r.ok) { try { await simpan(r.buf); hasil = { sumber: 'ikon resmi situs', url }; break; } catch { /* berikut */ } } }
    cache.logo[s.nama] = hasil ? { berkas: id + '.png', ...hasil } : { tanpa: true }; simpanCache();
  }
  const baris = seed.map((s) => { const w = cache.wd[s.nama], b = cache.beranda[s.nama];
    return { nama: s.nama, situs: s.situs, kelompok: s.kelompok, topik: s.topik, iso2_seed: s.iso2, wikidata: w.tidak ? null : { id: w.id, cocok: w.cocok, label: w.label, deskripsi: w.desk, situs: w.situs, tahun_berdiri: w.berdiri ? Number(w.berdiri) : null, enwiki: w.enwiki, logo_berkas: w.logo, iso2: [...new Set((w.negara || []).map((q) => lab[q]?.iso2).filter(Boolean))] },
      wikipedia: cache.wiki[s.nama] || null, beranda: b.ok ? { judul: b.judul, deskripsi: b.deskripsi, indonesia: b.indonesia } : { gagal: b.alasan }, logo: cache.logo[s.nama] }; });
  tulisJson(path.join(ROOT, 'data/global/pelaku/panen.json'), { sumber: 'Wikidata (CC0), Wikipedia (CC BY-SA), beranda resmi perusahaan', diambil: tgl, lisensi: 'Wikidata CC0; kalimat Wikipedia dikutip singkat dengan tautan', baris });
  const sumber = path.join(logoDir, 'SUMBER.md');
  const sudah = fs.existsSync(sumber) ? fs.readFileSync(sumber, 'utf8') : '# Sumber logo organisasi (pemasok global)\n\nLogo hanya untuk mengenali perusahaan; merek dagang milik pemiliknya.\n\n| berkas | perusahaan | sumber | diambil |\n| --- | --- | --- | --- |\n';
  const tambah = baris.filter((x) => x.logo?.url && !sudah.includes(`| ${x.logo.berkas} |`)).map((x) => `| ${x.logo.berkas} | ${x.nama} | ${x.logo.sumber}: ${x.logo.url} | ${tgl} |\n`).join('');
  fs.writeFileSync(sumber, sudah + tambah, 'utf8');
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  if (process.argv.includes('--selftest')) {
    const k = pilihKalimat('Acme builds a 150 MW solar plant in Indonesia for the grid. The company has a portfolio of 3 GW worldwide. It joined RE100 and set a net-zero goal.');
    assert.equal(k.indonesia.length, 1); assert.ok(k.portofolio.length >= 1); assert.ok(k.komitmen.length >= 1);
    const ent = { Q1: { id: 'Q1', labels: { en: { value: 'Ørsted' } }, claims: {} }, Q2: { id: 'Q2', labels: { en: { value: 'Orsted A/S' } }, claims: { P856: [{ rank: 'normal', mainsnak: { datavalue: { value: 'https://orsted.com/' } } }] } } };
    assert.equal(pilihKandidat({ nama: 'Orsted', situs: 'https://www.orsted.com/' }, ent).e.id, 'Q2');
    console.log('selftest ok');
  } else await utama();
}
