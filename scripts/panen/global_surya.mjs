// Panen ekosistem pemasok global SURYA -> data/global/surya/perusahaan.json (+ salinan public/data/global/pemasok_surya.json) dan entitas_tambah.json.
//   node scripts/panen/global_surya.mjs [--tmp=DIR] [--tanggal=YYYY-MM-DD] [--maks=N] [--tanpa-logo] [--offline]
// Sumber: Wikidata (CC0), Wikipedia en (CC BY-SA, kutipan kalimat), Wikimedia Commons (logo P154), sertifikat TKDN Kemenperin (public/data/tkdn_produk.json).
// Panen sopan: UA peneliti, robots, jeda >= 2 dtk per host, berhenti di 403/429. Kosong bila tak ada sumber; tak ada angka karangan.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { BENIH, SEGMEN } from './global_surya_daftar.mjs';
import { ROOT, Penambang, wikidataCari, wikidataEntitas, klaim, labelQid, wikipediaTeks, kutip, urlLogoCommons, validasiPerusahaan, kelengkapan, tulisJson, bacaJson, gabungEntitasTambah } from '../pipa/global_pemasok.mjs';
import { idEntitas } from '../pipa/entitas_tambah.mjs';

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
  kapasitas: /\b\d[\d,.]*\s*(GW|MW|GWh|MWh)\b/i, kapasitasKata: /capacity|production|produced|shipped|shipments|output|manufactur|annual/i,
  pangsa: /market share|world'?s (largest|biggest|second|third)|largest (manufacturer|producer|supplier|maker)|top[- ](\d+|ten|five|three)|ranked/i,
  tier1: /tier[ -]?1|bloomberg/i, indonesia: /Indonesia|Batam|Kendal|Jakarta|Surabaya|Java\b/, asean: /Vietnam|Malaysia|Thailand|Philippines|Cambodia|Laos|Myanmar|Singapore|Penang|Kedah|Sarawak|Batam|Indonesia/,
  pabrik: /factory|factories|plant|facility|facilities|manufactur|production|assembly/i, dagang: /UFLPA|Uyghur|Uighur|Xinjiang|anti-?dumping|countervailing|tariff|sanction|Entity List|forced labo/i,
  esg: /ESG|carbon[- ]neutral|RE100|net[- ]zero|emissions target|sustainab|science[- ]based/i, mitra: /distributor|reseller|joint venture|partnership|partnered|agreement|supply(ing)? (agreement|contract)/i,
};
const sbr = (tkp, aksen) => ({ medan: '', sumber_url: tkp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga', ...aksen });

async function main() {
  const p = new Penambang();
  // 1) Wikidata: cari QID (cache)
  const fq = path.join(TMP, 'qid.json'); const qid = bacaJson(fq, {});
  const daftar = BENIH.slice(0, MAKS);
  if (!OFFLINE) for (const [nama, , , o] of daftar) if (!(nama in qid)) { const r = await wikidataCari(p, [...new Set([o?.cari, nama, ...(o?.alias || [])].filter(Boolean))]); qid[nama] = r ? { id: r.id, desc: r.description || '', label: r.label } : null; tulisJson(fq, qid); }
  const ids = [...new Set(Object.values(qid).filter(Boolean).map((x) => x.id))];
  const fe = path.join(TMP, 'entitas.json'); let ent = bacaJson(fe, {});
  if (!OFFLINE && ids.some((i) => !ent[i])) { Object.assign(ent, await wikidataEntitas(p, ids)); tulisJson(fe, ent); }
  // label HQ & negara
  const refs = new Set(); for (const e of Object.values(ent)) for (const pr of ['P159', 'P17', 'P495']) for (const v of klaim(e, pr)) if (v?.id) refs.add(v.id);
  const fl = path.join(TMP, 'label.json'); let lab = bacaJson(fl, {});
  if (!OFFLINE && [...refs].some((r) => !lab[r])) { Object.assign(lab, await labelQid(p, [...refs])); tulisJson(fl, lab); }
  // 2) Wikipedia
  const judul = {}; for (const [nama] of daftar) { const e = ent[qid[nama]?.id]; const t = e?.sitelinks?.enwiki?.title; if (t) judul[nama] = t; }
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
    const wd = q ? `https://www.wikidata.org/wiki/${q.id}` : null; const wp = t ? `https://en.wikipedia.org/wiki/${encodeURIComponent(t.replace(/ /g, '_'))}` : null;
    const rec = { id: idEntitas(nama), nama, nama_lain: [...new Set([...(o?.alias || []), ...Object.values(e?.aliases || {}).flat().map((a) => a.value).filter((a) => /^[\x20-\x7e]+$/.test(a)).slice(0, 4)])].filter((a) => a.toLowerCase() !== nama.toLowerCase()),
      negara_iso2: iso, wikidata: q?.id || null, wikipedia: wp, segmen: [], segmen_belum_terbukti: [], tahun_berdiri: null, kantor_pusat: null, situs: null, logo: null,
      kapasitas: [], pangsa_pasar: [], status_tier1: [], pabrik_indonesia: [], pabrik_asean: [], mitra_indonesia: [], kantor_indonesia: [], tkdn: null, proyek_indonesia: [], isu_dagang: [], esg: [], sumber: [], fakta: [] };
    // segmen: terbukti bila kata kunci ada di teks Wikipedia atau deskripsi Wikidata; sisanya dicatat terpisah
    const bukti = (tk + ' ' + (q?.desc || '')).trim();
    for (const s of segmen) (bukti && KEYWORD[s]?.test(bukti) ? rec.segmen : rec.segmen_belum_terbukti).push(s);
    if (!rec.segmen.length) { rec.segmen = [...segmen]; rec.segmen_belum_terbukti = []; rec.segmen_catatan = 'segmen kurasi tim; tanpa teks sumber untuk diverifikasi'; }
    if (wd) { rec.sumber.push({ url: wd, tingkat_bukti: 'via-pihak-ketiga', tanggal_periksa: TGL, keterangan: 'Wikidata (CC0)' }); }
    if (wp) rec.sumber.push({ url: wp, tingkat_bukti: 'via-pihak-ketiga', tanggal_periksa: TGL, keterangan: 'Wikipedia (CC BY-SA)' });
    if (e) {
      const th = klaim(e, 'P571')[0]?.time?.match(/^\+?(\d{4})/); if (th) { rec.tahun_berdiri = +th[1]; rec.fakta.push(sbr(wd, { medan: 'tahun_berdiri', nilai: +th[1] })); }
      const hq = klaim(e, 'P159')[0]?.id; if (hq && lab[hq]?.label) { rec.kantor_pusat = { kota: lab[hq].label, negara_iso2: iso }; rec.fakta.push(sbr(wd, { medan: 'kantor_pusat', nilai: lab[hq].label })); }
      const web = klaim(e, 'P856')[0]; if (typeof web === 'string' && /^https:\/\//.test(web)) { rec.situs = web; rec.fakta.push(sbr(wd, { medan: 'situs', nilai: web })); } else if (typeof web === 'string' && /^http:\/\//.test(web)) { rec.situs = web.replace('http://', 'https://'); rec.fakta.push(sbr(wd, { medan: 'situs', nilai: rec.situs, catatan: 'http diubah ke https' })); }
      const lg = klaim(e, 'P154')[0]; if (typeof lg === 'string') rec._logoBerkas = lg;
      const neg = klaim(e, 'P17')[0]?.id || klaim(e, 'P495')[0]?.id; const wiso = neg && lab[neg]?.iso2; if (wiso && wiso !== iso) rec.catatan_negara = `Wikidata menyebut ${wiso}; kurasi ${iso}`;
    }
    if (tk) {
      const fk = (medan, kalimatList, tingkat = 'via-pihak-ketiga') => kalimatList.forEach((k) => rec.fakta.push(sbr(wp, { medan, nilai: k, tingkat_bukti: tingkat })));
      for (const k of kutip(tk, RE.kapasitas, 6).filter((k) => RE.kapasitasKata.test(k)).slice(0, 2)) { rec.kapasitas.push({ kutipan: k, sumber_url: wp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' }); }
      for (const k of kutip(tk, RE.pangsa, 2)) rec.pangsa_pasar.push({ kutipan: k, sumber_url: wp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' });
      for (const k of kutip(tk, RE.tier1, 2)) rec.status_tier1.push({ kutipan: k, sumber_url: wp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' });
      const id = kutip(tk, RE.indonesia, 6);
      for (const k of id) (RE.pabrik.test(k) ? rec.pabrik_indonesia : rec.mitra_indonesia).push({ kutipan: k, sumber_url: wp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' });
      for (const k of kutip(tk, RE.asean, 8).filter((k) => RE.pabrik.test(k) && !id.includes(k)).slice(0, 3)) rec.pabrik_asean.push({ kutipan: k, sumber_url: wp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' });
      for (const k of kutip(tk, RE.dagang, 3)) rec.isu_dagang.push({ kutipan: k, sumber_url: wp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' });
      for (const k of kutip(tk, RE.esg, 2)) rec.esg.push({ kutipan: k, sumber_url: wp, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' });
      void fk;
    }
    // TKDN (resmi) -> pabrik/produk/kantor Indonesia
    const kunci = [nama, ...rec.nama_lain].filter((a) => a.length >= 5).map(re);
    const cocok = tkdn.filter((r) => kunci.some((k) => k.test((r.pabrikan || '').toLowerCase()) || k.test((r.merk || '').toLowerCase())));
    if (cocok.length) {
      rec.tkdn = { jumlah_sertifikat: cocok.length, tkdn_persen_maks: Math.max(...cocok.map((r) => r.tkdn_persen || 0)) || null, sertifikat: cocok.slice(0, 12).map((r) => ({ id: r.id, kategori: r.kategori, produk: r.produk, merk: r.merk, tipe: r.tipe, tkdn_persen: r.tkdn_persen, pabrikan: r.pabrikan, lokasi: r.lokasi, provinsi: r.provinsi, sumber_url: r.sumber_url, tanggal_periksa: r.tanggal, tingkat_bukti: 'resmi' })) };
      const lok = new Map(); for (const r of cocok) if (/^PT/i.test(r.pabrikan) && r.lokasi) lok.set(r.pabrikan + '|' + r.lokasi, { pabrikan: r.pabrikan, lokasi: r.lokasi, provinsi: r.provinsi, kategori: r.kategori, sumber_url: r.sumber_url, tanggal_periksa: r.tanggal, tingkat_bukti: 'resmi' });
      rec.kantor_indonesia = [...lok.values()];
    }
    // proyek.json: pemasok disebut pada kolom pihak / nama
    rec.proyek_indonesia = proyek.filter((r) => kunci.some((k) => k.test(JSON.stringify(r.pihak || {}).toLowerCase()))).slice(0, 10).map((r) => ({ proyek_id: r.id, nama: r.nama, sumber_url: 'https://platformmeti.timitbnpb.workers.dev/proyek', tanggal_periksa: TGL, tingkat_bukti: 'kata-pihak' }));
    hasil.push(rec);
  }

  // 4) logo: Wikidata P154 via Commons
  if (!process.argv.includes('--tanpa-logo') && !OFFLINE) {
    const dir = path.join(ROOT, 'public/img/logo/org'); const sumberMd = path.join(dir, 'SUMBER.md'); let md = fs.existsSync(sumberMd) ? fs.readFileSync(sumberMd, 'utf8') : '# Sumber logo organisasi\n\n';
    for (const r of hasil) {
      if (!r._logoBerkas) continue; const f = path.join(dir, r.id + '.png'); const rel = `/img/logo/org/${r.id}.png`;
      if (!fs.existsSync(f)) {
        const u = await p.ambil(urlLogoCommons(r._logoBerkas, 256), { cekRobots: false });
        if (!u.ok || !/image/.test(u.tipe)) { r.logo_gagal = u.alasan || u.tipe; continue; }
        try { await sharp(u.buf).resize(128, 128, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png({ compressionLevel: 9 }).toFile(f); } catch (e) { r.logo_gagal = 'sharp ' + e.message; continue; }
        md += `- ${r.id}.png: ${r.nama}, berkas Wikimedia Commons "${r._logoBerkas}" (Wikidata P154 ${r.wikidata}), https://commons.wikimedia.org/wiki/File:${encodeURIComponent(r._logoBerkas.replace(/ /g, '_'))}; merek dagang milik pemiliknya, dipakai sebagai identifikasi (diambil ${TGL})\n`;
      }
      r.logo = { url: rel, sumber_url: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(r._logoBerkas.replace(/ /g, '_'))}`, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' };
    }
    fs.writeFileSync(sumberMd, md, 'utf8');
  } else for (const r of hasil) { const f = path.join(ROOT, 'public/img/logo/org', r.id + '.png'); if (r._logoBerkas && fs.existsSync(f)) r.logo = { url: `/img/logo/org/${r.id}.png`, sumber_url: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(r._logoBerkas.replace(/ /g, '_'))}`, tanggal_periksa: TGL, tingkat_bukti: 'via-pihak-ketiga' }; }
  for (const r of hasil) delete r._logoBerkas;

  // 5) keluaran
  const bersih = hasil.filter((r) => r.sumber.length);
  const tanpa = hasil.filter((r) => !r.sumber.length).map((r) => r.nama);
  const salah = bersih.flatMap((r) => validasiPerusahaan(r, new Set(SEGMEN)));
  if (salah.length) { console.error(salah.join('\n')); process.exitCode = 1; return; }
  bersih.sort((a, b) => a.nama.localeCompare(b.nama));
  const perSegmen = Object.fromEntries(SEGMEN.map((s) => [s, bersih.filter((r) => r.segmen.includes(s)).length]));
  const berkas = { _catatan: 'Pemasok global SURYA. Kutipan kalimat Wikipedia (CC BY-SA 4.0) dan data Wikidata (CC0); TKDN dari sertifikat Kemenperin. Kapasitas/pangsa hanya kutipan bersumber, bukan angka yang dihitung. Bukan via-pihak-ketiga tinggi: maks keyakinan Sedang.', diambil: TGL, jumlah: bersih.length, per_segmen: perSegmen, tanpa_sumber: tanpa, blokir: Object.fromEntries(p.blokir), baris: bersih };
  tulisJson(OUT, berkas); tulisJson(PUB, berkas);
  const g = gabungEntitasTambah('global_surya', bersih, { kepakaran: ['plts', 'penyedia-teknologi-global'], peran: ['penyedia-teknologi-global'], tanggal: TGL });
  const kel = kelengkapan(bersih, { situs: (r) => r.situs, tahun: (r) => r.tahun_berdiri, kantor_pusat: (r) => r.kantor_pusat, logo: (r) => r.logo, kapasitas: (r) => r.kapasitas.length, pangsa: (r) => r.pangsa_pasar.length, tier1: (r) => r.status_tier1.length, pabrik_id: (r) => r.pabrik_indonesia.length || r.kantor_indonesia.length, pabrik_asean: (r) => r.pabrik_asean.length, isu_dagang: (r) => r.isu_dagang.length, esg: (r) => r.esg.length, tkdn: (r) => r.tkdn });
  console.log(JSON.stringify({ jumlah: bersih.length, tanpa, perSegmen, kelengkapan_persen: kel, entitas_tambah: { baru: g.baru, lewat: g.lewat }, blokir: Object.fromEntries(p.blokir) }));
}
main().catch((e) => { console.error(e); process.exit(1); });
