// Lengkapi baris panen.json untuk perusahaan yang Wikidata-nya tak cocok: verifikasi beranda (situs di lengkapi.json), ambil ikon resmi.
//   node scripts/panen/global_lain_lengkapi.mjs <tanggal> [--tmp=DIR]   (jaringan; sopan: robots, jeda 2 dtk, stop 403/429)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { Penambang, ROOT, bacaJson, tulisJson } from '../pipa/global_pemasok.mjs';
import { idEntitas } from '../pipa/entitas_tambah.mjs';
import { bacaBeranda, SEG_KATA } from './global_lain.mjs';

const tgl = process.argv[2]; if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) throw new Error('tanggal YYYY-MM-DD wajib');
const f = path.join(ROOT, 'data/global/lain/panen.json'), panen = bacaJson(f), leng = bacaJson(path.join(ROOT, 'data/global/lain/lengkapi.json')).baris;
const p = new Penambang({ jedaMs: 2100 }), logoDir = path.join(ROOT, 'public/img/logo/org');
for (const r of panen.baris) {
  const l = leng[r.nama]; if (!l) continue;
  r.situs = l.situs; r.lengkapi = { iso2: l.iso2, tahun: l.tahun, sumber_url: l.sumber_url, tingkat: l.tingkat, ket: l.ket, portofolio: l.portofolio || null };
  const h = await p.ambil(l.situs); let ikon = [];
  if (h.ok && /html/i.test(h.tipe)) { const b = bacaBeranda(h.buf.toString('utf8').slice(0, 2e6), l.situs); ikon = b.ikon.slice(0, 3);
    r.beranda = { judul: b.judul, deskripsi: b.deskripsi, indonesia: b.indonesia, produk: Object.fromEntries(Object.entries(SEG_KATA).map(([k, v]) => [k, v.filter(([re]) => re.test(b.teks)).map(([, x]) => x)])) }; }
  else r.beranda = { gagal: h.alasan || 'bukan html' };
  const id = idEntitas(r.nama), out = path.join(logoDir, id + '.png');
  if (!r.logo?.berkas || !fs.existsSync(out)) {
    r.logo = { tanpa: true };
    for (const u of ikon) { const g = await p.ambil(u); if (g.ok) { try { await sharp(g.buf).resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toFile(out); r.logo = { berkas: id + '.png', sumber: 'ikon resmi situs', url: u }; break; } catch { /* berikut */ } } }
  }
  console.log(r.nama, r.beranda.gagal ? 'beranda: ' + r.beranda.gagal : 'beranda ok', r.logo.berkas ? 'logo' : 'tanpa-logo');
}
tulisJson(f, panen);
const sumber = path.join(logoDir, 'SUMBER.md'); let s = fs.readFileSync(sumber, 'utf8');
for (const r of panen.baris) if (r.logo?.url && r.lengkapi && !s.includes(`| ${r.logo.berkas} |`)) s += `| ${r.logo.berkas} | ${r.nama} | ${r.logo.sumber}: ${r.logo.url} | ${tgl} |\n`;
fs.writeFileSync(sumber, s);
