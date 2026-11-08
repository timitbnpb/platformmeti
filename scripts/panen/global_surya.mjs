// Panen ekosistem pemasok global SURYA -> data/global/surya/perusahaan.json (+ salinan public/data/global/pemasok_surya.json) dan entitas_tambah.json.
//   node scripts/panen/global_surya.mjs [--tmp=DIR] [--tanggal=YYYY-MM-DD] [--maks=N] [--tanpa-logo] [--offline]
// Sumber: Wikidata (CC0), Wikipedia en (CC BY-SA, kutipan kalimat), Wikimedia Commons (logo P154), sertifikat TKDN Kemenperin (public/data/tkdn_produk.json).
// Panen sopan: UA peneliti, robots, jeda >= 2 dtk per host, berhenti di 403/429. Kosong bila tak ada sumber; tak ada angka karangan.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { BENIH, SEGMEN, SITUS } from './global_surya_daftar.mjs';
import { ROOT, Penambang, wikidataCari, wikidataEntitas, klaim, labelQid, wikipediaTeks, kutip, urlLogoCommons, validasiPerusahaan, kelengkapan, tulisJson, bacaJson, gabungEntitasTambah } from '../pipa/global_pemasok.mjs';
import { idEntitas } from '../pipa/entitas_tambah.mjs';
import { perkaya } from '../pipa/global_surya_perkaya.mjs';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const TMP = arg('tmp', '/private/tmp/claude-501/-Users-priyankaalfatehan28-Documents-GitHub-platformmeti/b1682dc3-8a11-4d9d-90d7-82b836c30f0d/scratchpad/global-surya');
const TGL = arg('tanggal', new Date().toISOString().slice(0, 10));
const MAKS = Number(arg('maks', 1e9));
const OFFLINE = process.argv.includes('--offline');
const OUT = path.join(ROOT, 'data/global/surya/perusahaan.json');
const PUB = path.join(ROOT, 'public/data/global/pemasok_surya.json');
fs.mkdirSync(TMP, { recursive: true });

const KEYWORD = { // bukti segmen dalam teks Wikipedia
  polisilikon: /polysilicon|polycrystalline silicon/i, wafer: /wafer|ingot/i, sel: /solar cell|photovoltaic cell|\bcells?\b/i, modul: /solar (module|panel)|photovoltaic (module|panel)|\bPV modules?\b|solar power/i,
  'inverter-string': /inverter/i, 'inverter-sentral': /inverter|converter|power electronics/i, mikroinverter: /microinverter|micro-inverter/i, 'tracker-mounting': /tracker|mounting|racking|support structure/i,
  kaca: /glass/i, frame: /frame|aluminium|aluminum/i, eva: /EVA|encapsulant|film/i, backsheet: /backsheet|back sheet|film/i, bess: /battery|batteries|energy storage|lithium/i,
};
const RE = {
  kapasitas: /\b\d[\d,.]*\s*(GW|MW|GWh|MWh)\b/i, kapasitasKata: /annual|per year|yearly|production capacity|manufacturing capacity|nameplate|capacity of/i, bukanSurya: /vehicle|automobile|\bcars?\b|\bbus(es)?\b|\bEVs?\b|iPad|smartphone|lawsuit|libel|defamation|lobby/i,
  pangsa: /market share|world'?s (largest|biggest|second|third)|largest (manufacturer|producer|supplier|maker)|top[- ](\d+|ten|five|three)|ranked/i,
  tier1: /(tier[ -]?1.*(module|solar|panel|photovoltaic|PV)|(module|solar|panel|photovoltaic|PV).*tier[ -]?1)/i, indonesia: /Indonesia|Batam|Kendal|Jakarta|Surabaya|Java\b/, asean: /Vietnam|Malaysia|Thailand|Philippines|Cambodia|Laos|Myanmar|Singapore|Penang|Kedah|Sarawak|Batam|Indonesia/,
  pabrik: /factory|factories|plant|facility|facilities|manufactur|production|assembly/i, dagang: /UFLPA|Uyghur|Uighur|anti-?dumping|countervailing|tariff|sanction|Entity List|forced labo|circumvent/i,
  esg: /ESG|carbon[- ]neutral|RE100|net[- ]zero|emissions target|sustainab|science[- ]based/i, mitra: /distributor|reseller|joint venture|partnership|partnered|agreement|supply(ing)? (agreement|contract)/i,
};
const NEG = { Q148: 'CN', Q30: 'US', Q16: 'CA', Q884: 'KR', Q183: 'DE', Q17: 'JP', Q668: 'IN', Q865: 'TW', Q142: 'FR', Q29: 'ES', Q38: 'IT', Q20: 'NO', Q39: 'CH', Q40: 'AT', Q33: 'FI', Q55: 'NL', Q334: 'SG', Q801: 'IL', Q408: 'AU', Q881: 'VN', Q5785: 'KY', Q145: 'GB', Q159: 'RU' };
const TOLAK = new Set(['Q571813', 'Q185145', 'Q593143', 'Q1484081', 'Q3570980', 'Q110800693', 'Q137882902', 'Q1153219', 'Q136149129', 'Q96473813']); // Q1153219 bandara (bukan PV Hardware), Q136149129 Clear Energy Pty, Q96473813 kecamatan Antai
// item Wikidata yang sah untuk perusahaan lain tetapi salah untuk nama ini (induk/afiliasi/perusahaan tetangga)
const TOLAK_NAMA = { 'TCL Zhonghuan Renewable Energy Technology': ['Q121832886'], 'Adani Solar': ['Q83473736'], 'Envision AESC': ['Q24910394'] };
// terima entitas hanya bila negaranya cocok dengan kurasi (atau tak diketahui tetapi bercirikan perusahaan)
const WD_OK = { 'Canadian Solar': ['US'], JinkoSolar: ['KY'], 'Hanwha Qcells': ['DE'], 'REC Group': ['CZ'], 'Maxeon Solar Technologies': ['SG'] };
// PAKSA: dicek manual (deskripsi Wikidata Q134632225: "Under the CHINT Group, Astronergy ..."); SKIP_DASAR: tahun/kantor pusat pada item itu tak cocok, jadi tak diambil
const PAKSA = new Set(['Q5973509', 'Q134632225']), SKIP_DASAR = new Set(['Q134632225']);
const terimaNeg = (nama, iso) => (e, id) => { if (PAKSA.has(id)) return true; if (TOLAK.has(id) || (TOLAK_NAMA[nama] || []).includes(id)) return false; const c = [...klaim(e, 'P17'), ...klaim(e, 'P495')].map((v) => NEG[v?.id]).filter(Boolean); return !c.length ? klaim(e, 'P856').length > 0 : c.some((x) => x === iso || (WD_OK[nama] || []).includes(x)); };
// logo yang berasal dari item Wikidata salah (Maxeon untuk TCL, Envision Energy untuk AESC): berkas dibuang bila tak ada sumber baru
const LOGO_SALAH = new Set(['TCL Zhonghuan Renewable Energy Technology', 'Envision AESC']);
const sbr = (tkp, aksen) => ({ medan: '', sumber_url: tkp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga', ...aksen });

async function main() {
  const p = new Penambang();
  // 1) Wikidata: cari QID (cache)
  const fq = path.join(TMP, 'qid.json'); const qid = bacaJson(fq, {});
  const daftar = BENIH.slice(0, MAKS);
  { const e0 = bacaJson(path.join(TMP, 'entitas.json'), {}); for (const [nama, iso] of daftar) if (qid[nama] && e0[qid[nama].id] && !terimaNeg(nama, iso)(e0[qid[nama].id], qid[nama].id)) delete qid[nama]; }
  if (!OFFLINE) for (const [nama, iso, , o] of daftar) if (!(nama in qid)) { const r = await wikidataCari(p, [...new Set([o?.cari, nama, ...(o?.alias || [])].filter(Boolean))], terimaNeg(nama, iso)); qid[nama] = r ? { id: r.id, desc: r.description || '', label: r.label } : null; tulisJson(fq, qid); }
  const ids = [...new Set(Object.values(qid).filter(Boolean).map((x) => x.id))];
  const fe = path.join(TMP, 'entitas.json'); let ent = bacaJson(fe, {});
  if (!OFFLINE && ids.some((i) => !ent[i])) { Object.assign(ent, await wikidataEntitas(p, ids)); tulisJson(fe, ent); }
  // label HQ & negara
  const refs = new Set(); for (const e of Object.values(ent)) for (const pr of ['P159', 'P17', 'P495']) for (const v of klaim(e, pr)) if (v?.id) refs.add(v.id);
  const fl = path.join(TMP, 'label.json'); let lab = bacaJson(fl, {});
  if (!OFFLINE && [...refs].some((r) => !lab[r])) { Object.assign(lab, await labelQid(p, [...refs])); tulisJson(fl, lab); }
  // 2) Wikipedia
  const judul = {}; for (const [nama, , , o] of daftar) { const e = ent[qid[nama]?.id]; const t = e?.sitelinks?.enwiki?.title || o?.judul; if (t) judul[nama] = t; }
  const ft = path.join(TMP, 'teks.json'); const teks = bacaJson(ft, {});
  const perlu = [...new Set(Object.values(judul))].filter((t) => !(t in teks));
  if (!OFFLINE && perlu.length) { Object.assign(teks, await wikipediaTeks(p, perlu)); tulisJson(ft, teks); }

  // 3) data TKDN & proyek lokal
  const tkdn = bacaJson(path.join(ROOT, 'public/data/tkdn_produk.json'), { baris: [] }).baris;
  const proyek = bacaJson(path.join(ROOT, 'public/data/proyek.json'), { baris: [] }).baris;
  const re = (s) => new RegExp('(^|[^a-z0-9])' + s.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])');

  const hasil = [];
  for (const [nama, iso, segmen, o] of daftar) {
    const q = qid[nama]; const e = q ? ent[q.id] : null; const t = judul[nama]; const tk = t ? teks[t] || '' : '';
    const wd = q ? `https://www.wikidata.org/wiki/${q.id}` : null; const wp = t && (tk || !o?.judul) ? `https://en.wikipedia.org/wiki/${encodeURIComponent(t.replace(/ /g, '_'))}` : null;
    const rec = { id: idEntitas(nama), nama, nama_lain: [...new Set([...(o?.alias || []), ...Object.values(e?.aliases || {}).flat().map((a) => a.value).filter((a) => /^[\x20-\x7e]+$/.test(a)).slice(0, 4)])].filter((a) => a.toLowerCase() !== nama.toLowerCase()),
      negara_iso2: iso, wikidata: q?.id || null, wikipedia: wp, segmen: [], segmen_belum_terbukti: [], tahun_berdiri: null, kantor_pusat: null, situs: null, logo: null,
      kapasitas: [], pangsa_pasar: [], status_tier1: [], pabrik_indonesia: [], pabrik_asean: [], mitra_indonesia: [], kantor_indonesia: [], tkdn: null, proyek_indonesia: [], isu_dagang: [], esg: [], sumber: [], fakta: [] };
    // segmen: terbukti bila kata kunci ada di teks Wikipedia atau deskripsi Wikidata; sisanya dicatat terpisah
    const bukti = (tk + ' ' + (q?.desc || '')).trim();
    for (const s of segmen) (bukti && KEYWORD[s]?.test(bukti) ? rec.segmen : rec.segmen_belum_terbukti).push(s);
    if (!rec.segmen.length) { rec.segmen = [...segmen]; rec.segmen_belum_terbukti = []; rec.segmen_catatan = 'segmen kurasi tim; tanpa teks sumber untuk diverifikasi'; }
    if (wd) { rec.sumber.push({ url: wd, tingkat_bukti: 'via-pihak-ketiga', tanggal_periksa: TGL, keterangan: 'Wikidata (CC0)' }); }
    if (wp) rec.sumber.push({ url: wp, tingkat_bukti: 'via-pihak-ketiga', tanggal_periksa: TGL, keterangan: 'Wikipedia (CC BY-SA)' });
    if (e && !SKIP_DASAR.has(q.id)) {
      const th = klaim(e, 'P571')[0]?.time?.match(/^\+?(\d{4})/); if (th) { rec.tahun_berdiri = +th[1]; rec.fakta.push(sbr(wd, { medan: 'tahun_berdiri', nilai: +th[1] })); }
      const hq = klaim(e, 'P159')[0]?.id; if (hq && lab[hq]?.label) { rec.kantor_pusat = { kota: lab[hq].label, negara_iso2: iso }; rec.fakta.push(sbr(wd, { medan: 'kantor_pusat', nilai: lab[hq].label })); }
      const web = klaim(e, 'P856')[0]; if (typeof web === 'string' && /^https:\/\//.test(web)) { rec.situs = web; rec.fakta.push(sbr(wd, { medan: 'situs', nilai: web })); } else if (typeof web === 'string' && /^http:\/\//.test(web)) { rec.situs = web.replace('http://', 'https://'); rec.fakta.push(sbr(wd, { medan: 'situs', nilai: rec.situs, catatan: 'http diubah ke https' })); }
      const lg = klaim(e, 'P154')[0]; if (typeof lg === 'string') rec._logoBerkas = lg;
      const neg = klaim(e, 'P17')[0]?.id || klaim(e, 'P495')[0]?.id; const wiso = neg && lab[neg]?.iso2; if (wiso && wiso !== iso) rec.catatan_negara = `Wikidata menyebut ${wiso}; kurasi ${iso}`;
    }
    if (tk) {
      const fk = (medan, kalimatList, tingkat = 'via-pihak-ketiga') => kalimatList.forEach((k) => rec.fakta.push(sbr(wp, { medan, nilai: k, tingkat_bukti: tingkat })));
      for (const k of kutip(tk, RE.kapasitas, 8).filter((k) => RE.kapasitasKata.test(k) && !RE.bukanSurya.test(k)).slice(0, 2)) { rec.kapasitas.push({ kutipan: k, sumber_url: wp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' }); }
      for (const k of kutip(tk, RE.pangsa, 2)) rec.pangsa_pasar.push({ kutipan: k, sumber_url: wp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' });
      for (const k of kutip(tk, RE.tier1, 2)) rec.status_tier1.push({ kutipan: k, sumber_url: wp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' });
      const id = kutip(tk, RE.indonesia, 6).filter((k) => !RE.bukanSurya.test(k));
      for (const k of id.filter((k) => RE.pabrik.test(k) || RE.mitra.test(k))) (RE.pabrik.test(k) ? rec.pabrik_indonesia : rec.mitra_indonesia).push({ kutipan: k, sumber_url: wp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' });
      for (const k of kutip(tk, RE.asean, 8).filter((k) => RE.pabrik.test(k) && !id.includes(k) && !RE.bukanSurya.test(k)).slice(0, 3)) rec.pabrik_asean.push({ kutipan: k, sumber_url: wp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' });
      for (const k of kutip(tk, RE.dagang, 3).filter((k) => !/lawsuit|libel|defamation/i.test(k))) rec.isu_dagang.push({ kutipan: k, sumber_url: wp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' });
      for (const k of kutip(tk, RE.esg, 2)) rec.esg.push({ kutipan: k, sumber_url: wp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' });
      void fk;
    }
    // TKDN (resmi) -> pabrik/produk/kantor Indonesia
    const kunci = [nama, ...rec.nama_lain].filter((a) => a.length >= 5).map(re);
    const cocok = tkdn.filter((r) => kunci.some((k) => k.test((r.pabrikan || '').toLowerCase()) || k.test((r.merk || '').toLowerCase())));
    if (cocok.length) {
      rec.tkdn = { jumlah_sertifikat: cocok.length, tkdn_persen_maks: Math.max(...cocok.map((r) => r.tkdn_persen || 0)) || null, sertifikat: cocok.slice(0, 12).map((r) => ({ id: r.id, kategori: r.kategori, produk: r.produk, merk: r.merk, tipe: r.tipe, tkdn_persen: r.tkdn_persen, pabrikan: r.pabrikan, lokasi: r.lokasi, provinsi: r.provinsi, sumber_url: r.sumber_url, tanggal_periksa: r.tanggal, tingkat_bukti: 'resmi' })) };
      const lok = new Map(); for (const r of cocok) if (/^PT/i.test(r.pabrikan) && r.lokasi && kunci.some((k) => k.test((r.pabrikan || '').toLowerCase()))) lok.set(r.pabrikan + '|' + r.lokasi, { pabrikan: r.pabrikan, lokasi: r.lokasi, provinsi: r.provinsi, kategori: r.kategori, sumber_url: r.sumber_url, tanggal_periksa: r.tanggal, tingkat_bukti: 'resmi' });
      rec.kantor_indonesia = [...lok.values()];
    }
    // proyek.json: pemasok disebut pada kolom pihak / nama
    rec.proyek_indonesia = proyek.filter((r) => kunci.some((k) => k.test(JSON.stringify(r.pihak || {}).toLowerCase()))).slice(0, 10).map((r) => ({ proyek_id: r.id, nama: r.nama, sumber_url: 'https://platformmeti.timitbnpb.workers.dev/proyek', tanggal_periksa: TGL, tingkat_bukti: 'kata-pihak' }));
    hasil.push(rec);
  }

  // 3b) situs resmi dari kurasi (SITUS) bila belum ada situs: robots, jeda 2 dtk; diterima bila beranda memuat nama merek
  const ikonDari = (html, u, nama = '') => {
    const ik = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).filter((l) => /rel=["'][^"']*icon/i.test(l)).map((l) => ({ h: /href=["']([^"']+)/i.exec(l)?.[1], a: /apple-touch/i.test(l), v: /\.svg(\?|$)/i.test(/href=["']([^"']+)/i.exec(l)?.[1] || ''), z: Number(/sizes=["'](\d+)/i.exec(l)?.[1] || 0) })).filter((c) => c.h && !/\.ico(\?|$)/i.test(c.h) && !/^data:/.test(c.h)).sort((a, c) => (c.a - a.a) || (a.v - c.v) || (c.z - a.z))[0];
    if (ik) return new URL(ik.h, u).href;
    // cadangan: gambar berlogo di kepala beranda yang alt/src-nya memuat nama merek (bukan og:image)
    const merek = nama.toLowerCase().split(/[^a-z0-9]+/)[0]; if (merek.length < 3) return null;
    for (const m of html.slice(0, 60000).matchAll(/<img\b[^>]*>/gi)) { const t = m[0], src = /\bsrc=["']([^"']+)/i.exec(t)?.[1]; if (!src || /^data:/.test(src) || /\.(gif|webp)(\?|$)/i.test(src)) continue; if (/logo/i.test(t) && new RegExp(merek, 'i').test(src + ' ' + (/alt=["']([^"']*)/i.exec(t)?.[1] || ''))) return new URL(src, u).href; }
    return null;
  };
  if (!OFFLINE) for (const r of hasil) {
    if (r.situs || !SITUS[r.nama]) continue; const [u, tok] = SITUS[r.nama];
    const b = await p.ambil(u); if (!b.ok) { r.situs_gagal = b.alasan; continue; }
    const html = b.buf.toString('utf8'); if (!html.toLowerCase().includes(tok)) { r.situs_gagal = 'merek tak terlihat'; continue; }
    r.situs = u; r.sumber.push({ url: u, tingkat_bukti: 'situs-sendiri', tanggal_periksa: TGL, keterangan: 'beranda situs resmi (nama, segmen)' });
    r.fakta.push({ medan: 'situs', nilai: u, sumber_url: u, tanggal_periksa: TGL, tingkat_bukti: 'situs-sendiri' });
    r._ikon = ikonDari(html, u, r.nama);
  }
  // 3c) ikon situs resmi untuk yang punya situs tetapi belum berlogo (bukan og:image): apple-touch-icon / link rel=icon bukan svg/ico
  if (!OFFLINE && !process.argv.includes('--tanpa-logo')) for (const r of hasil) {
    if (r._ikon || r._logoBerkas || !r.situs || fs.existsSync(path.join(ROOT, 'public/img/logo/org', r.id + '.png'))) continue;
    const b = await p.ambil(r.situs); if (!b.ok) continue; r._ikon = ikonDari(b.buf.toString('utf8'), r.situs, r.nama);
  }
  // 4) logo: Wikidata P154 via Commons
  if (!process.argv.includes('--tanpa-logo') && !OFFLINE) {
    const dir = path.join(ROOT, 'public/img/logo/org'); const sumberMd = path.join(dir, 'SUMBER.md'); let md = fs.existsSync(sumberMd) ? fs.readFileSync(sumberMd, 'utf8') : '# Sumber logo organisasi\n\n';
    for (const r of hasil) {
      if (!r._logoBerkas && !r._ikon) continue; const f = path.join(dir, r.id + '.png'); const rel = `/img/logo/org/${r.id}.png`;
      if (!fs.existsSync(f)) {
        const u = await p.ambil(r._logoBerkas ? urlLogoCommons(r._logoBerkas, 256) : r._ikon, { cekRobots: !r._logoBerkas });
        if (!u.ok || !/image/.test(u.tipe)) { r.logo_gagal = u.alasan || u.tipe; continue; }
        try { await sharp(u.buf).resize(128, 128, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png({ compressionLevel: 9 }).toFile(f); } catch (e) { r.logo_gagal = 'sharp ' + e.message; continue; }
        md += r._ikon ? `- ${r.id}.png: ${r.nama}, ikon situs resmi ${r._ikon}; merek dagang milik pemiliknya, dipakai sebagai identifikasi (diambil ${TGL})\n` : `- ${r.id}.png: ${r.nama}, berkas Wikimedia Commons "${r._logoBerkas}" (Wikidata P154 ${r.wikidata}), https://commons.wikimedia.org/wiki/File:${encodeURIComponent(r._logoBerkas.replace(/ /g, '_'))}; merek dagang milik pemiliknya, dipakai sebagai identifikasi (diambil ${TGL})\n`;
      }
      r.logo = { url: rel, sumber_url: r._ikon || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(r._logoBerkas.replace(/ /g, '_'))}`, tanggal_periksa: TGL, tingkat_bukti: r._ikon ? 'situs-sendiri' : 'via-pihak-ketiga' };
    }
    fs.writeFileSync(sumberMd, md, 'utf8');
  } else for (const r of hasil) { const f = path.join(ROOT, 'public/img/logo/org', r.id + '.png'); if (r._logoBerkas && fs.existsSync(f)) r.logo = { url: `/img/logo/org/${r.id}.png`, sumber_url: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(r._logoBerkas.replace(/ /g, '_'))}`, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' }; }
  // logo lama yang sah dipertahankan bila panen ini tak menemukan sumbernya (kecuali nama yang item Wikidata-nya salah)
  const lama = new Map((bacaJson(OUT, { baris: [] }).baris || []).map((x) => [x.id, x]));
  for (const r of hasil) { const l = lama.get(r.id)?.logo; if (!r.logo && l && !LOGO_SALAH.has(r.nama) && fs.existsSync(path.join(ROOT, 'public', l.url))) r.logo = l; }
  for (const n of LOGO_SALAH) { const id = idEntitas(n); const f = path.join(ROOT, 'public/img/logo/org', id + '.png'); const r = hasil.find((x) => x.nama === n); if (r && !r.logo && fs.existsSync(f)) fs.rmSync(f); }
  for (const r of hasil) { delete r._logoBerkas; delete r._ikon; }

  // 5) keluaran
  perkaya(hasil, TGL);
  // tanpa Wikidata/situs tetapi disebut sumber pengayaan (daftar peringkat, siaran pers): sumber butir itu menjadi sumber profil
  for (const r of hasil) if (!r.sumber.length) { const u = new Map(); for (const f of ['kapasitas', 'pangsa_pasar', 'status_tier1', 'pabrik_asean', 'pabrik_indonesia', 'isu_dagang']) for (const x of r[f]) if (x.asal === 'pengayaan' && x.sumber_url && !u.has(x.sumber_url)) u.set(x.sumber_url, { url: x.sumber_url, tingkat_bukti: x.tingkat_bukti, tanggal_periksa: x.tanggal_periksa, keterangan: (x.sumber_penerbit || 'sumber pengayaan') + ' (menyebut perusahaan ini)' }); r.sumber = [...u.values()]; }
  const bersih = hasil.filter((r) => r.sumber.length);
  const tanpa = hasil.filter((r) => !r.sumber.length).map((r) => r.nama);
  const gagal = Object.fromEntries(hasil.filter((r) => r.situs_gagal && !r.sumber.length).map((r) => [r.nama, r.situs_gagal]));
  for (const r of bersih) { delete r.situs_gagal; delete r.logo_gagal; }
  const salah = bersih.flatMap((r) => validasiPerusahaan(r, new Set(SEGMEN)));
  if (salah.length) { console.error(salah.join('\n')); process.exitCode = 1; return; }
  bersih.sort((a, b) => a.nama.localeCompare(b.nama));
  const perSegmen = Object.fromEntries(SEGMEN.map((s) => [s, bersih.filter((r) => r.segmen.includes(s)).length]));
  const berkas = { _catatan: 'Pemasok global SURYA. Kutipan kalimat Wikipedia (CC BY-SA 4.0) dan data Wikidata (CC0); TKDN dari sertifikat Kemenperin. Kapasitas/pangsa hanya kutipan bersumber, bukan angka yang dihitung. Bukan via-pihak-ketiga tinggi: maks keyakinan Sedang.', diambil: TGL, jumlah: bersih.length, per_segmen: perSegmen, tanpa_sumber: tanpa, blokir: Object.fromEntries(p.blokir), baris: bersih };
  tulisJson(OUT, berkas); tulisJson(PUB, berkas);
  const g = gabungEntitasTambah('global_surya', bersih, { kepakaran: ['plts', 'penyedia-teknologi-global'], peran: ['penyedia-teknologi-global'], tanggal: TGL });
  const kel = kelengkapan(bersih, { situs: (r) => r.situs, tahun: (r) => r.tahun_berdiri, kantor_pusat: (r) => r.kantor_pusat, logo: (r) => r.logo, kapasitas: (r) => r.kapasitas.length, pangsa: (r) => r.pangsa_pasar.length, tier1: (r) => r.status_tier1.length, pabrik_id: (r) => r.pabrik_indonesia.length || r.kantor_indonesia.length, pabrik_asean: (r) => r.pabrik_asean.length, isu_dagang: (r) => r.isu_dagang.length, esg: (r) => r.esg.length, tkdn: (r) => r.tkdn, tier1_rinci: (r) => r.status_tier1.length, mitra_id: (r) => r.mitra_indonesia.length, proyek_ref: (r) => r.proyek_indonesia.length, pabrik_modul_id: (r) => r.pabrik_indonesia.length });
  console.log(JSON.stringify({ jumlah: bersih.length, tanpa, situs_gagal: gagal, perSegmen, kelengkapan_persen: kel, entitas_tambah: { baru: g.baru, lewat: g.lewat }, blokir: Object.fromEntries(p.blokir) }));
}
main().catch((e) => { console.error(e); process.exit(1); });
