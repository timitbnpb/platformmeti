// Pendalaman naskah topik teknologi (surya, panas-bumi, bayu, hidro): menggabungkan JSON repo secara otomatis
// dan menambahkan id rujukan (organisasi, proyek, regulasi, pendanaan, wilayah BPS, iso2) supaya halaman bisa menautkan.
// Konvensi tautan (sama dengan topik_dalam_lib.mjs): baris membawa "id" (id entitas) dan "u" (jalur internal /o/<id>, /proyek#<id>,
// /regulasi?id=<id>, /wilayah?prov=<kode BPS>); kolom nama memakai url:"u". Pendanaan: id + url sumber pemberi. Negara: iso2. Tanpa jaringan; deterministik. Teks tulisan tangan ada di topik_dalam_<id>.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (p) => JSON.parse(fs.readFileSync(path.join(akar, p), 'utf8'));
const pub = (n) => baca(`public/data/${n}.json`);
export const T = (id, en) => ({ id, en });
const S = (judul, penerbit, url, tanggal, bukti, lisensi) => ({ judul, penerbit, url, tanggal, tahun: Number(tanggal.slice(0, 4)), bukti, ...(lisensi ? { lisensi } : {}) });

export const SUMBER_DALAM = {
  d_proyek: S('Basis proyek METI (public/data/proyek.json: RUPTL 2025-2034, WRI GPPD, ESDM, berita; tiap proyek membawa sumbernya sendiri)', 'METI dan sumber primer per proyek', 'https://platformmeti.timitbnpb.workers.dev/direktori', '2026-11-07', 'via-pihak-ketiga'),
  d_org: S('Basis organisasi METI (public/data/organisasi.json; tiap organisasi membawa sumbernya sendiri)', 'METI', 'https://platformmeti.timitbnpb.workers.dev/direktori', '2026-11-08', 'via-pihak-ketiga'),
  d_reg: S('Basis regulasi METI (public/data/regulasi.json, naskah BPK JDIH)', 'BPK JDIH, METI', 'https://peraturan.bpk.go.id/', '2026-11-07', 'resmi'),
  d_stat: S('Statistik Ketenagalistrikan 2024: kapasitas terpasang per provinsi (public/data/statistik_pln.json)', 'Ditjen Ketenagalistrikan ESDM', 'https://gatrik.esdm.go.id/', '2026-11-07', 'resmi'),
  d_pot: S('Potensi per provinsi: RUEN (Perpres 22/2017) dan HEESI 2025 (public/data/peluang.json)', 'DEN, Kementerian ESDM', 'https://peraturan.bpk.go.id/Details/68772', '2026-11-07', 'resmi'),
  d_pend: S('Basis pendanaan METI (public/data/pendanaan.json: skema dan proyek pendana, tiap butir membawa tautan sumbernya)', 'METI, ADB, World Bank, AIIB, JICA dan lain-lain', 'https://platformmeti.timitbnpb.workers.dev/direktori', '2026-11-08', 'via-pihak-ketiga'),
  d_owid: S('Our World in Data energy-data (Ember Yearly Electricity Data), diiris ke data/topik_dunia/owid_negara.json', 'Ember via Our World in Data', 'https://github.com/owid/energy-data', '2026-11-08', 'via-pihak-ketiga', 'CC BY 4.0'),
};

const norm = (s) => String(s || '').toLowerCase().replace(/^provinsi\s+/, '').replace(/daerah istimewa/, 'di').replace(/[^a-z0-9]+/g, ' ').trim();
const mwProyek = (p) => { const k = (p.kapasitas || [])[0]; return k && /^mw$/i.test(k.satuan) && Number.isFinite(k.nilai) ? k.nilai : null; };
const statusP = (p) => (p.status || [])[0]?.nilai || 'tidak tercatat';
const urut = (a, f, arah = -1) => [...a].sort((x, y) => (f(x) > f(y) ? arah : f(x) < f(y) ? -arah : 0));
const pot = (x, n = 120) => (x.length > n ? x.slice(0, n - 3) + '...' : x);
const JENIS = { uu: 'UU', pp: 'PP', perpres: 'Perpres', permen: 'Permen', inpres: 'Inpres', keppres: 'Keppres', perda: 'Perda', lainnya: 'Peraturan' };
export const namaReg = (r) => `${JENIS[r.jenis] || r.jenis} ${r.nomor}/${r.tahun}`;

export const KONFIG = {
  surya: { tek: ['surya'], kep: ['surya'], regTopik: ['surya'], regKata: /surya|plts/i, pot: 'surya', pln: 'PLTS', pend: 'surya', nama: 'surya' },
  bayu: { tek: ['bayu'], kep: ['bayu'], regTopik: ['angin'], regKata: /bayu|angin|pltb/i, pot: 'bayu', pln: 'PLTB', pend: 'bayu', nama: 'bayu' },
  'panas-bumi': { tek: ['panas-bumi'], kep: ['panas-bumi'], regTopik: ['panas_bumi'], regKata: /panas bumi|pltp/i, pot: 'panas_bumi', pln: 'PLTP', pend: 'panas-bumi', nama: 'panas bumi' },
  hidro: { tek: ['hidro'], kep: ['hidro'], regTopik: ['hidro'], regKata: /hidro|plta|pltmh|bendungan/i, pot: 'hidro', pot2: 'mikrohidro', pln: 'PLTA/M', pend: 'hidro', nama: 'hidro' },
};
const UMUM = /energi terbarukan|ketenagalistrikan|tenaga listrik|energi baru|rencana umum|kebijakan energi|nilai ekonomi karbon|tingkat komponen dalam negeri|persetujuan lingkungan|perizinan berusaha|pengadaan tanah|kawasan hutan/i;

let cache;
function data() {
  if (cache) return cache;
  cache = { proyek: pub('proyek').baris, org: pub('organisasi').baris, reg: pub('regulasi').baris, wil: pub('wilayah').baris, stat: pub('statistik_pln').baris, pel: pub('peluang').baris, pend: pub('pendanaan').pendanaan, owid: baca('data/topik_dunia/owid_negara.json') };
  return cache;
}

/* ---------- bab 8: peta sebaran 38 provinsi ---------- */
export function bab8(id, lama) {
  const K = KONFIG[id], D = data();
  const lamaPer = new Map();
  const kp = lama?.kolom?.some((c) => c.k === 'provinsi') ? 'provinsi' : 'prov';
  if (lama?.tipe === 'tabel' && lama.kolom.some((c) => ['prov', 'provinsi'].includes(c.k))) for (const r of lama.baris) lamaPer.set(norm(r[kp]), r);
  const pj = D.proyek.filter((p) => K.tek.includes(p.teknologi));
  const wkpPer = new Map();
  if (id === 'panas-bumi' && lama?.tipe === 'tabel') for (const r of lama.baris) { const a = wkpPer.get(norm(r.provinsi)) || []; a.push(r.nama); wkpPer.set(norm(r.provinsi), a); }
  const baris = D.wil.map((w) => {
    const n = norm(w.nama);
    const mine = pj.filter((p) => norm(p.lokasi?.provinsi) === n);
    const st = D.stat.find((s) => s.kode === w.kode);
    const pe = D.pel.find((s) => s.kode === w.kode);
    const mw = mine.reduce((s, p) => s + (mwProyek(p) || 0), 0);
    const op = mine.filter((p) => /operasi/i.test(statusP(p))).reduce((s, p) => s + (mwProyek(p) || 0), 0);
    const pt = pe?.potensi?.[K.pot]?.mw ?? null, pt2 = K.pot2 ? pe?.potensi?.[K.pot2]?.mw ?? null : null;
    const row = { [kp]: w.nama, kode: w.kode, u: '/wilayah?prov=' + w.kode, proyek: mine.length, mw: Math.round(mw), operasi_mw: Math.round(op), terpasang_mw: st?.kapasitas_terpasang_mw?.[K.pln] ?? null, potensi_mw: pt, ...(K.pot2 ? { potensi2_mw: pt2 } : {}) };
    const l = lamaPer.get(n);
    if (l) for (const [k, v] of Object.entries(l)) if (!['prov', 'provinsi', 'n', 'mw', 'op'].includes(k) && (!(k in row) || ['potensi_mw', 'terpasang_mw'].includes(k))) row[k] = v;
    if (id === 'panas-bumi') row.wkp = (wkpPer.get(n) || []).join(', ') || '-';
    return row;
  });
  const kol = [
    { k: kp, l: T('Provinsi', 'Province'), url: 'u' },
    { k: 'kode', l: T('Kode BPS', 'BPS code') },
    { k: 'proyek', l: T('Proyek tercatat', 'Recorded projects'), num: true, d: 0 },
    { k: 'mw', l: T('Kapasitas proyek (MW)', 'Project capacity (MW)'), num: true, d: 0 },
    { k: 'operasi_mw', l: T('Beroperasi (MW)', 'Operating (MW)'), num: true, d: 0 },
    { k: 'terpasang_mw', l: T(`Terpasang ${K.pln} 2024 (MW)`, `Installed ${K.pln} 2024 (MW)`), num: true, d: 0 },
    { k: 'potensi_mw', l: T(`Potensi ${K.nama} (MW)`, `${K.nama} potential (MW)`), num: true, d: 0 },
    ...(K.pot2 ? [{ k: 'potensi2_mw', l: T('Potensi mikrohidro (MW)', 'Micro-hydro potential (MW)'), num: true, d: 0 }] : []),
  ];
  const pakai = new Set(kol.map((c) => c.k));
  const lamaKol = (lama?.kolom || []).filter((c) => !['prov', 'provinsi', 'n', 'mw', 'op', 'nama', 'jenis', 'pemegang', 'status', 'rencana_mw', 'bukti', 'url_sumber'].includes(c.k) && !pakai.has(c.k));
  kol.push(...lamaKol);
  for (const r of baris) for (const c of lamaKol) if (!(c.k in r)) r[c.k] = c.num ? null : '-';
  if (id === 'panas-bumi') kol.push({ k: 'wkp', l: T('WKP yang dilelang 2025', 'WKP tendered in 2025') });
  return { tipe: 'tabel', per: 10, judul: T(`Sebaran ${K.nama} di 38 provinsi`, `${K.nama} across 38 provinces`), sumber: [...new Set(['d_proyek', 'd_stat', 'd_pot', ...(lama?.sumber || [])])], kolom: kol, baris,
    catatan: T('Proyek dan MW dari basis proyek METI (status apa pun, bukan hanya beroperasi); terpasang dari Statistik Ketenagalistrikan 2024 (semua pengusaha); potensi dari RUEN 2015 atau HEESI 2025 (sumbernya tertera di basis peluang). Sel kosong berarti tidak ada angka terbuka.', 'Projects and MW come from the METI project base (any status, not only operating); installed from the 2024 Electricity Statistics (all operators); potential from RUEN 2015 or HEESI 2025 (source recorded in the opportunity base). An empty cell means no open figure.') };
}

/* ---------- bab 9: pemain (organisasi ber-id) ---------- */
export function bab9(id) {
  const K = KONFIG[id], D = data();
  const pj = D.proyek.filter((p) => K.tek.includes(p.teknologi));
  const hit = new Map();
  for (const p of pj) for (const arr of Object.values(p.pihak || {})) for (const x of arr) if (x.organisasi_id) hit.set(x.organisasi_id, (hit.get(x.organisasi_id) || 0) + 1);
  const rel = (o) => ((o.kepakaran || []).some((k) => K.kep.includes(k)) ? 'teknologi' : hit.has(o.id) ? 'pemilik proyek' : null);
  let daftar = D.org.filter((o) => rel(o)).map((o) => ({ o, rel: rel(o), n: Math.max((o.proyek_ids || []).length, hit.get(o.id) || 0) }));
  const ada = new Set(daftar.map((x) => x.o.id));
  const pemangku = D.org.filter((o) => !ada.has(o.id) && ['kementerian-lembaga', 'bumn', 'asosiasi', 'think-tank', 'donor'].includes(o.kategori?.kode) && (o.kepakaran || []).some((k) => ['kebijakan', 'jaringan', 'pembiayaan', 'riset-data'].includes(k)));
  for (const o of pemangku) daftar.push({ o, rel: 'pemangku kebijakan', n: (o.proyek_ids || []).length });
  const rank = { teknologi: 3, 'pemilik proyek': 2, 'pemangku kebijakan': 1 };
  daftar = urut(daftar, (x) => rank[x.rel] * 1e4 + x.n).slice(0, 60);
  const baris = daftar.map(({ o, rel: r, n }) => ({ nama: o.nama, id: o.id, u: '/o/' + o.id, singkatan: (o.singkatan && !/\b[A-Z]{2,}( [A-Z]{2,}){2,}\b/.test(o.singkatan) ? o.singkatan : '-'), kategori: o.kategori?.label || '-', peran: (o.peran_rantai || []).join(', ') || '-', relevansi: r, negara: o.internasional?.negara || 'ID', proyek: n }));
  return { tipe: 'tabel', per: 12, judul: T(`Pemain ${K.nama} di basis METI`, `${K.nama} players in the METI base`), sumber: ['d_org', 'd_proyek'], kolom: [
    { k: 'nama', l: T('Organisasi', 'Organisation'), url: 'u' }, { k: 'singkatan', l: T('Singkatan', 'Acronym') }, { k: 'kategori', l: T('Kategori', 'Category') }, { k: 'peran', l: T('Peran rantai', 'Chain role') },
    { k: 'relevansi', l: T('Kaitan dengan topik', 'Link to topic') }, { k: 'negara', l: T('Negara asal', 'Home country') }, { k: 'proyek', l: T('Proyek tercatat', 'Recorded projects'), num: true, d: 0 }],
  baris, catatan: T('Urutan: organisasi berkepakaran teknologi ini, lalu pemilik atau pengembang proyek di basis proyek, lalu pemangku kebijakan dan pendana lintas teknologi. Logo dan profil dibuka lewat id (jalur /o/<id>).', 'Order: organisations with expertise in this technology, then owners or developers of projects in the project base, then cross-technology policy bodies and financiers. Logo and profile open through id (path /o/<id>).') };
}

/* ---------- bab 10: proyek (ber-id proyek) ---------- */
export function bab10(id) {
  const K = KONFIG[id], D = data();
  const wil = new Map(D.wil.map((w) => [norm(w.nama), w.kode]));
  const pj = urut(D.proyek.filter((p) => K.tek.includes(p.teknologi)), (p) => mwProyek(p) || 0).slice(0, 80);
  const baris = pj.map((p) => {
    const org = Object.values(p.pihak || {}).flat().find((x) => x.organisasi_id);
    const cod = (p.cod_target || [])[0]?.nilai;
    return { nama: p.nama, id: p.id, u: '/proyek#' + p.id, prov: p.lokasi?.provinsi || '-', kode: wil.get(norm(p.lokasi?.provinsi)) || null, mw: mwProyek(p), status: statusP(p), cod: Number.isFinite(cod) ? cod : null, pemilik: org ? org.nilai : (p.pihak?.pemilik || [])[0]?.nilai || '-', id_organisasi: org?.organisasi_id || null, uo: org?.organisasi_id ? '/o/' + org.organisasi_id : null, bukti: p.tingkat_bukti || '-' };
  });
  return { tipe: 'tabel', per: 10, judul: T(`Proyek ${K.nama} terbesar di basis METI`, `Largest ${K.nama} projects in the METI base`), sumber: ['d_proyek'], kolom: [
    { k: 'nama', l: T('Proyek', 'Project'), url: 'u' }, { k: 'prov', l: T('Provinsi', 'Province') }, { k: 'kode', l: T('Kode BPS', 'BPS code') }, { k: 'mw', l: T('MW', 'MW'), num: true, d: 0 }, { k: 'status', l: T('Status', 'Status') }, { k: 'cod', l: T('Target COD', 'COD target'), num: true, d: 0 },
    { k: 'pemilik', l: T('Pemilik atau pengembang', 'Owner or developer'), url: 'uo' }, { k: 'bukti', l: T('Tingkat bukti', 'Evidence level') }],
  baris, catatan: T('Daftar diurutkan menurut kapasitas; "pemilik" dapat berupa status pengembang menurut RUPTL (PLN, IPP, SH-PLN), bukan nama perusahaan. Buka rincian dan sumber lewat id (jalur /proyek#<id>).', 'Sorted by capacity; "owner" may be a developer status per RUPTL (PLN, IPP, SH-PLN) rather than a company name. Open details and sources through id (path /proyek#<id>).') };
}

/* ---------- bab 12 dan 13: regulasi dan linimasa ---------- */
function regRelevan(id) {
  const K = KONFIG[id], D = data();
  const khusus = D.reg.filter((r) => (r.topik || []).some((t) => K.regTopik.includes(t)) || (K.regKata.test(r.judul) && !/remisi|retribusi/i.test(r.judul)));
  const set = new Set(khusus.map((r) => r.id));
  const umum = D.reg.filter((r) => !set.has(r.id) && ['harga', 'insentif', 'perizinan', 'energi_umum', 'energi_baru_umum', 'perencanaan', 'tkdn', 'karbon'].some((t) => (r.topik || []).includes(t)) && UMUM.test(r.judul) && ['uu', 'pp', 'perpres', 'permen', 'inpres'].includes(r.jenis));
  return { khusus: urut(khusus, (r) => r.tanggal_ditetapkan || ''), umum: urut(umum, (r) => r.tanggal_ditetapkan || '') };
}
const teksT = (v) => (typeof v === 'string' ? v : v?.id || '');
export function bab12(id, lama, minimal = 14) {
  const D = data(), { khusus, umum } = regRelevan(id);
  const dipakai = new Set(), baris = [];
  for (const r0 of lama?.baris || []) {
    const r = { dok: r0.dok ?? r0.aturan ?? r0.instrumen, tgl: r0.tgl ?? r0.tanggal ?? null, judul: r0.judul ?? null, isi: r0.isi ?? r0.ttg ?? null, status: r0.status ?? r0.st ?? null, url: r0.url ?? (/^https:/.test(r0.u || '') ? r0.u : null) };
    const nm = teksT(r.dok);
    const m = nm.match(/(UU|PP|Perpres|Permen|Inpres|Keppres)\b[^\d]*(\d+)\/(\d{4})/i);
    let reg = null;
    if (m) reg = D.reg.find((x) => String(x.nomor) === m[2] && String(x.tahun) === m[3] && (JENIS[x.jenis] || '').toLowerCase() === m[1].toLowerCase());
    if (reg) dipakai.add(reg.id);
    baris.push({ dok: r.dok, tgl: r.tgl || reg?.tanggal_ditetapkan || '-', judul: r.judul || (reg ? pot(reg.judul, 140) : '-'), isi: r.isi || (reg ? T(pot(reg.ringkasan || reg.judul, 220), pot(reg.ringkasan || reg.judul, 220)) : '-'), status: r.status || reg?.status || '-', naskah: (r.url || reg?.url_sumber) ? 'BPK' : null, url: r.url || reg?.url_sumber || null, id: reg?.id || null, u: reg ? '/regulasi?id=' + reg.id : null });
  }
  for (const r of [...khusus, ...umum].filter((x) => !dipakai.has(x.id)).slice(0, Math.max(0, minimal + 6 - baris.length))) {
    baris.push({ dok: namaReg(r), id: r.id, u: '/regulasi?id=' + r.id, naskah: 'BPK', tgl: r.tanggal_ditetapkan || '-', judul: pot(r.judul, 140), isi: T(pot(r.ringkasan || r.judul, 220), pot(r.ringkasan || r.judul, 220) + ' (ringkasan resmi basis regulasi, bahasa Indonesia)'), status: r.status, url: r.url_sumber });
  }
  const kol = [{ k: 'dok', l: T('Peraturan', 'Regulation'), url: 'u' }, { k: 'tgl', l: T('Ditetapkan', 'Enacted') }, { k: 'judul', l: T('Tentang', 'Subject') }, { k: 'isi', l: T('Pokok untuk topik ini', 'Key point for this topic') }, { k: 'status', l: T('Status', 'Status') }, { k: 'naskah', l: T('Naskah', 'Text'), url: 'url' }];
  return { tipe: 'tabel', per: 8, sumber: [...new Set([...(lama?.sumber || []), 'd_reg'])], kolom: kol, baris,
    catatan: T('Baris ber-id terhubung ke basis regulasi METI (status dan naskah BPK). Pokok tulisan tangan hanya pada baris yang sudah diperiksa; baris lain memakai ringkasan resmi basis regulasi.', 'Rows with id link to the METI regulation base (status and BPK text). Hand-written points appear only on reviewed rows; other rows use the official summary in the regulation base.') };
}
export function linimasaTambah(id, lama, minimal = 15) {
  const { khusus } = regRelevan(id);
  const ada = new Set((lama?.butir || []).map((x) => x.reg).filter(Boolean));
  const tglAda = new Set((lama?.butir || []).map((x) => x.tanggal));
  const butir = [...(lama?.butir || [])];
  for (const r of urut(khusus, (x) => x.tanggal_ditetapkan || '', 1)) {
    if (butir.length >= minimal) break;
    if (!r.tanggal_ditetapkan || ada.has(r.id) || tglAda.has(r.tanggal_ditetapkan)) continue;
    tglAda.add(r.tanggal_ditetapkan);
    butir.push({ tanggal: r.tanggal_ditetapkan, judul: T(`${namaReg(r)} ditetapkan: ${pot(r.judul, 110)}`, `${namaReg(r)} enacted: ${pot(r.judul, 110)} (official title in Indonesian)`), reg: r.id, url: r.url_sumber });
  }
  butir.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  return { ...(lama || { tipe: 'linimasa' }), sumber: [...new Set([...(lama?.sumber || []), 'd_reg'])], butir };
}

/* ---------- bab 24: pembiayaan (ber-id pendanaan) ---------- */
export function bab24(id, lama) {
  const K = KONFIG[id], D = data();
  const projTek = new Map(D.proyek.map((p) => [p.id, p.teknologi]));
  const cocok = D.pend.filter((x) => (x.sektor || []).includes(K.pend) || K.tek.includes(projTek.get(x.proyek_id)));
  const sc = new Set(cocok.map((x) => x.id));
  const umum = D.pend.filter((x) => !sc.has(x.id) && x.jenis_entri === 'skema' && (x.sektor || []).some((s) => ['pembiayaan', 'kebijakan', 'karbon'].includes(s)));
  const pilih = [...urut(cocok, (x) => (x.jenis_entri === 'skema' ? 1e12 : 0) + (x.nilai_usd || 0)), ...umum].slice(0, 20);
  const baris = pilih.map((x) => ({ nama: x.nama, id: x.id, pemberi: x.pemberi || '-', jenis: x.jenis || x.jenis_entri || '-', status: x.status || '-', nilai_usd: Number.isFinite(x.nilai_usd) ? x.nilai_usd : null, iso2: x.iso2 || 'ID', url: x.url || x.sumber_url || null }));
  const kol = [{ k: 'nama', l: T('Skema atau proyek pendanaan', 'Funding scheme or project'), url: 'url' }, { k: 'pemberi', l: T('Pemberi', 'Provider') }, { k: 'jenis', l: T('Jenis', 'Type') }, { k: 'status', l: T('Status', 'Status') }, { k: 'nilai_usd', l: T('Nilai (USD)', 'Value (USD)'), num: true, d: 0 }, { k: 'iso2', l: T('Negara pemberi', 'Provider country') }];
  return { tipe: 'tabel', per: 8, sumber: ['d_pend'], kolom: kol, baris, catatan: T('Skema dan proyek pendanaan di basis METI yang bertag teknologi ini atau terhubung ke proyeknya, dilengkapi skema lintas teknologi. Nilai kosong berarti tidak diumumkan. Id pendanaan tersimpan di tiap baris.', 'Funding schemes and projects in the METI base tagged with this technology or linked to its projects, plus cross-technology schemes. An empty value means not disclosed. The funding id is kept on every row.') };
}

/* ---------- pembanding negara dari OWID (surya, bayu, hidro) ---------- */
const NEGARA10 = ['CHN', 'IND', 'DEU', 'USA', 'AUS', 'JPN', 'KOR', 'BRA', 'ZAF', 'VNM'];
export const NAMA = { IDN: ['Indonesia', 'Indonesia'], CHN: ['Tiongkok', 'China'], IND: ['India', 'India'], DEU: ['Jerman', 'Germany'], USA: ['Amerika Serikat', 'United States'], AUS: ['Australia', 'Australia'], JPN: ['Jepang', 'Japan'], KOR: ['Korea Selatan', 'South Korea'], BRA: ['Brasil', 'Brazil'], ZAF: ['Afrika Selatan', 'South Africa'], VNM: ['Vietnam', 'Vietnam'] };
export function pembandingOwid(jenis) {
  const D = data().owid, iso2 = D.iso2;
  const sh = `${jenis}_share_elec`, el = `${jenis}_electricity`;
  const baris = ['IDN', ...NEGARA10].map((k) => {
    const s = D.seri[k] || {}; const th = Object.keys(s[sh] || {}).map(Number).sort((a, b) => a - b).at(-1);
    return { neg: T(...NAMA[k]), iso2: iso2[k], tahun: String(th), porsi: s[sh]?.[th] ?? null, twh: s[el]?.[th] ?? null, ebt: s.renewables_share_elec?.[th] ?? null, total_twh: s.electricity_generation?.[th] ?? null };
  });
  return { tipe: 'tabel', per: 11, sumber: ['d_owid'], kolom: [
    { k: 'neg', l: T('Negara', 'Country') }, { k: 'tahun', l: T('Tahun data', 'Data year') }, { k: 'porsi', l: T('Porsi dalam listrik (persen)', 'Share of electricity (percent)'), num: true, d: 1 }, { k: 'twh', l: T('Produksi (TWh)', 'Generation (TWh)'), num: true, d: 1 },
    { k: 'ebt', l: T('Porsi EBT total (persen)', 'Total renewable share (percent)'), num: true, d: 1 }, { k: 'total_twh', l: T('Total listrik (TWh)', 'Total electricity (TWh)'), num: true, d: 0 }], baris,
  catatan: T('Sepuluh negara pembanding dan Indonesia dari Ember via Our World in Data; tahun data terbaru yang tersedia per negara.', 'Ten comparison countries and Indonesia from Ember via Our World in Data; latest available data year per country.') };
}
export function deretOwid(jenis, negara = ['IDN', 'CHN', 'IND', 'VNM'], dari = 2015) {
  const D = data().owid;
  return negara.map((k) => [NAMA[k], k === 'IDN', Object.entries(D.seri[k]?.[`${jenis}_share_elec`] || {}).filter(([y]) => +y >= dari).map(([y, v]) => [y, v])]);
}

/* ---------- deret waktu (indeks 2015 = 100 atau 2010 = 100, EST) ---------- */
const indeks = (pairs, dasar) => { const b = pairs.find(([y]) => +y === dasar)?.[1]; return pairs.filter(([y, v]) => +y >= dasar && v != null).map(([y, v]) => [String(y), Math.round((v / b) * 1000) / 10]); };
export function bab7Indeks(id, lama) {
  const K = KONFIG[id], k = pub('kapasitas_tren').baris;
  const tek = k.filter((x) => x.taksonomi === K.pot.replace('_', '-')).sort((a, b) => a.tahun - b.tahun);
  const ebt = k.filter((x) => x.taksonomi === null && x.teknologi === 'total_ebt').sort((a, b) => a.tahun - b.tahun);
  const seri = [
    [T(`Kapasitas ${K.nama} (indeks)`, `${K.nama} capacity (index)`), true, indeks(tek.map((x) => [x.tahun, x.kapasitas_mw]), 2015)],
    [T(`Pembangkitan ${K.nama} (indeks)`, `${K.nama} generation (index)`), false, indeks(tek.map((x) => [x.tahun, x.pembangkitan_gwh]), 2015)],
    [T('Kapasitas seluruh EBT Indonesia (indeks)', 'Capacity of all Indonesian renewables (index)'), false, indeks(ebt.map((x) => [x.tahun, x.kapasitas_mw]), 2015)],
  ];
  const thn = new Set(seri.flatMap(([, , p]) => p.map(([y]) => y)));
  const lamaSeri = lama?.seri || [];
  return { tipe: 'grafik', jenis: 'garis', sumber: [...new Set([...(lama?.sumber || []), 'd_kap'])], label: T(`Tren ${K.nama}: kapasitas, pembangkitan, dan seluruh EBT (indeks 2015 = 100)`, `${K.nama} trend: capacity, generation and all renewables (index 2015 = 100)`), satuan: 'indeks', d: 0,
    seri: seri.filter(([, , p]) => p.length).map(([n, sorot, titik]) => ({ nama: n, ...(sorot ? { sorot: true } : {}), titik: titik.filter(([y]) => thn.has(y)) })),
    catatan: T(`Turunan hitung METI (EST) dari IRENA: tiap deret dibagi nilai 2015 dan dikali 100. Deret asli kapasitas (MW) ${lamaSeri.length ? 'tersimpan di grafik sebelumnya: ' + lamaSeri[0].titik.slice(-1)[0][1] + ' MW pada ' + lamaSeri[0].titik.slice(-1)[0][0] : 'ada di angka kunci'}. Pembangkitan 2025 belum terbit.`, `METI derived figures (EST) from IRENA: each series divided by its 2015 value times 100. The original capacity series (MW) is in the key figures. Generation for 2025 is not yet published.`) };
}
export function bab19Indeks(id, lama, lcoeKunci /* [[negara, teknologi, T nama]] */) {
  const B = pub('biaya_listrik'), seri = [];
  const modul = id === 'surya' ? B.modul.filter((m) => m.tahun >= 2010).map((m) => [m.tahun, m.usd_per_w]) : null;
  if (modul) seri.push([T('Harga modul surya (indeks 2010 = 100)', 'Solar module price (index 2010 = 100)'), true, indeks(modul, 2010)]);
  for (const [n, t, nama, sorot] of lcoeKunci) {
    const p = B.lcoe.filter((x) => x.negara === n && x.teknologi === t).sort((a, b) => a.tahun - b.tahun).map((x) => [x.tahun, x.sen_usd_kwh]);
    if (p.length) seri.push([nama, !!sorot && !modul, indeks(p, 2010)]);
  }
  return { tipe: 'grafik', jenis: 'garis', sumber: [...new Set([...(lama?.sumber || []), 'd_lcoe'])], label: T('Kurva biaya: LCOE rata-rata dunia (indeks 2010 = 100)', 'Cost curve: global average LCOE (index 2010 = 100)'), satuan: 'indeks', d: 0,
    seri: seri.map(([n, sorot, titik]) => ({ nama: n, ...(sorot ? { sorot: true } : {}), titik })),
    catatan: T('Turunan hitung METI (EST) dari IRENA via Our World in Data (USD tetap); nilai absolut LCOE ada di FAQ dan teks bab 4. Indeks di bawah 100 berarti lebih murah daripada 2010.', 'METI derived figures (EST) from IRENA via Our World in Data (constant USD); absolute LCOE values are in the FAQ and chapter 4 text. An index below 100 means cheaper than in 2010.') };
}

/* ---------- pembanding negara: tambahkan iso2 ke baris lama ---------- */
const ISO2 = { kamboja: 'KH', vietnam: 'VN', thailand: 'TH', singapura: 'SG', filipina: 'PH', malaysia: 'MY', myanmar: 'MM', indonesia: 'ID', brunei: 'BN', laos: 'LA', 'lao pdr': 'LA', 'viet nam': 'VN', 'brunei darussalam': 'BN', philippines: 'PH', singapore: 'SG', cambodia: 'KH', turki: 'TR', kenya: 'KE', islandia: 'IS', india: 'IN', inggris: 'GB', jerman: 'DE', tiongkok: 'CN', jepang: 'JP', 'selandia baru': 'NZ' };
export function isoNegara(r) { for (const k of ['neg', 'negara', 'n']) { const v = r[k]; const t = (typeof v === 'string' ? v : v?.id || '').toLowerCase(); if (ISO2[t]) return ISO2[t]; } return null; }

/* ---------- gabung ke naskah ---------- */
export const G = (rows) => rows.map(([i, ie, a, e]) => ({ istilah: T(i, ie || i), arti: T(a, e) }));
export const FQ = (rows) => rows.map(([a, b, c, d]) => ({ t: T(a, b), j: T(c, d) }));
export const LN = (rows) => rows.map(([a, b, c, d, e, f]) => ({ judul: T(a, b), isi: T(c, d), pelaku: T(e, f) }));
export const P = (rows) => rows.map(([a, b]) => T(a, b));
export const HIP = 'Analisis METI (Hipotesis): ';
export const HIPE = 'METI analysis (Hypothesis): ';
export const H = (a, b) => [HIP + a, HIPE + b];
const kunciButir = (x) => JSON.stringify(x.istilah?.id ?? x.t?.id ?? x.judul?.id ?? (x.tanggal ? x.tanggal + (x.judul?.id || '') : null) ?? x);
export function ke(d, nomor, tipe, field, arr, sumber = []) {
  const b = d.bab[nomor] || (d.bab[nomor] = { tipe, sumber: [], [field]: [] });
  if (b.tipe !== tipe) throw new Error(`bab ${nomor} bertipe ${b.tipe}, bukan ${tipe}`);
  b[field] ||= [];
  const ada = new Set(b[field].map(kunciButir));
  for (const x of arr) if (!ada.has(kunciButir(x))) { b[field].push(x); ada.add(kunciButir(x)); }
  b.sumber = [...new Set([...(b.sumber || []), ...sumber])];
  return b;
}
export function ambilSumber(d, SUMBER, ...kunci) { for (const k of kunci) if (SUMBER[k]) d.sumber[k] ||= SUMBER[k]; else if (!d.sumber[k]) throw new Error('sumber tak ada: ' + k); }


/* ---------- bab 14: kewajiban dan insentif umum (dari izin_kontrak.json dan insentif.json, tiap butir membawa pasalnya) ---------- */
export function kewajibanUmum() {
  return P([
    ['Badan usaha yang menjual listrik untuk kepentingan umum wajib memegang IUPTLU; izin ini berlaku paling lama 30 tahun dan dapat diperpanjang (Permen ESDM 11/2021 Pasal 11 dan 12).', 'A business selling electricity for the public interest must hold an IUPTLU licence, valid for up to 30 years and renewable (Energy Ministry Reg. 11/2021, Articles 11 and 12).'],
    ['Pembangkit untuk kepentingan sendiri dengan total kapasitas lebih dari 500 kW dalam satu sistem instalasi wajib IUPTLS (paling lama 10 tahun, perpanjangan diajukan paling lambat 60 hari kerja sebelum berakhir); sampai 500 kW cukup menyampaikan laporan satu kali (Pasal 39 dan 40).', 'A captive plant above 500 kW in one installation needs an IUPTLS licence (up to 10 years, renewal filed at least 60 working days before expiry); up to 500 kW only a one-time report is needed (Articles 39 and 40).'],
    ['Pembelian listrik PLN dari badan usaha memakai penunjukan langsung (paling lama 90 hari kalender) atau pemilihan langsung termasuk negosiasi harga (paling lama 180 hari kalender), dengan harga patokan tertinggi atau harga kesepakatan yang wajib disetujui Menteri (Perpres 112/2022 Pasal 5, 6, 15, 16).', 'PLN buys power from businesses by direct appointment (up to 90 calendar days) or direct selection including price negotiation (up to 180 calendar days), at the ceiling price or an agreed price that the Minister must approve (Presidential Reg. 112/2022, Articles 5, 6, 15 and 16).'],
    ['Insentif yang dijanjikan Perpres 112/2022 Pasal 22 dan 23: insentif fiskal (PPh, bea masuk dan pajak impor, PBB), fasilitas pembiayaan atau penjaminan lewat BUMN, dan insentif nonfiskal; pemerintah daerah wajib mendukung sesuai kewenangannya.', 'Presidential Reg. 112/2022 Articles 22 and 23 promise fiscal incentives (income tax, import duty and tax, property tax), financing or guarantee facilities through state enterprises, and non-fiscal incentives; local governments must support within their authority.'],
    ['Bea masuk barang modal pembangkit dapat dibebaskan (PMK 66/PMK.010/2015) bila barang belum diproduksi dalam negeri, belum memenuhi spesifikasi, atau belum mencukupi; permohonan lewat BKPM dengan rencana impor yang disahkan Dirjen Ketenagalistrikan dan realisasi impor paling lama 24 bulan.', 'Import duty on generation capital goods can be waived (MoF Reg. 66/PMK.010/2015) when goods are not made domestically, do not meet specifications, or are insufficient; applications go through BKPM with an import plan approved by the Director General of Electricity and imports must be realised within 24 months.'],
    ['Tax holiday (PMK 130/PMK.010/2020) mengurangi PPh badan bagi usaha pionir menurut nilai investasi; apakah usaha pembangkit termasuk sektor pionir harus dicek di naskah, dan rincian persentasenya belum terbaca METI karena PDF pindai.', 'Tax holiday (MoF Reg. 130/PMK.010/2020) reduces corporate income tax for pioneer businesses by investment value; whether power generation counts as a pioneer sector must be checked in the text, and the percentages are not yet read by METI because the PDF is a scan.'],
    ['Kewajiban penggunaan produk dalam negeri untuk infrastruktur ketenagalistrikan diatur Permen ESDM 11/2024; ambang TKDN per komponen belum dibaca METI sehingga proyek perlu memeriksa naskahnya sebelum menyusun penawaran.', 'Energy Ministry Reg. 11/2024 requires domestic products in electricity infrastructure; per-component TKDN thresholds are not yet read by METI, so projects must check the text before bidding.'],
  ]);
}

/* ---------- bab 18: inovasi Indonesia ber-id dari inovasi.json ---------- */
export function bab18(id, lama) {
  const K = KONFIG[id], D = pub('inovasi').inovasi;
  const cocok = D.filter((i) => (i.sektor || []).some((x) => K.kep.includes(x)));
  const baris = cocok.map((i) => ({ nama: i.nama, id: i.id, jenis: i.jenis || '-', status: i.status || '-', tahun: i.tahun ? String(i.tahun) : '-', pembuat: (i.pembuat || []).map((x) => x.nama).slice(0, 3).join(', ') || '-', trl: Number.isFinite(i.trl) ? i.trl : null, url: i.sumber?.[0]?.url || null }));
  return { tipe: 'tabel', per: 8, sumber: [...new Set([...(lama?.sumber || []), 'd_inov'])], kolom: [{ k: 'nama', l: T('Inovasi', 'Innovation'), url: 'url' }, { k: 'jenis', l: T('Jenis', 'Type') }, { k: 'status', l: T('Status', 'Status') }, { k: 'tahun', l: T('Tahun', 'Year') }, { k: 'pembuat', l: T('Pembuat', 'Maker') }, { k: 'trl', l: T('TRL', 'TRL'), num: true, d: 0 }], baris,
    catatan: T('Inovasi di basis METI yang bertag teknologi ini; id inovasi tersimpan di tiap baris, tautan membuka sumbernya. TRL kosong berarti belum dinilai.', 'Innovations in the METI base tagged with this technology; the innovation id is kept on every row and the link opens its source. An empty TRL means not yet assessed.') };
}

/* ---------- bab 26: investasi dan transaksi dari proyek pendanaan bernilai ---------- */
export function bab26Tambah(id, lama, minimal = 10) {
  const K = KONFIG[id], D = data();
  const projTek = new Map(D.proyek.map((p) => [p.id, p.teknologi]));
  const cocok = D.pend.filter((x) => Number.isFinite(x.nilai_usd) && x.nilai_usd > 0 && ((x.sektor || []).includes(K.pend) || K.tek.includes(projTek.get(x.proyek_id))));
  const baris = [...(lama?.baris || [])];
  for (const x of urut(cocok, (y) => y.nilai_usd)) {
    if (baris.length >= minimal + 2) break;
    baris.push({ p: x.nama, o: T(`${x.pemberi}${x.status ? ', status ' + x.status : ''}`, `${x.pemberi}${x.status ? ', status ' + x.status : ''}`), n: T(`USD ${Math.round(x.nilai_usd / 1e6).toLocaleString('id-ID')} juta (${x.nilai_catatan || 'menurut pemberi'})`, `USD ${Math.round(x.nilai_usd / 1e6).toLocaleString('en-US')} million (${x.nilai_catatan || 'per provider'})`), id: x.id, url: x.url || x.sumber_url || null, iso2: x.iso2 || 'ID' });
  }
  const kol = [...(lama?.kolom || [{ k: 'p', l: T('Proyek', 'Project') }, { k: 'o', l: T('Struktur kepemilikan', 'Ownership') }, { k: 'n', l: T('Nilai', 'Value') }])];
  if (!kol[0].url) kol[0] = { ...kol[0], url: 'url' };
  return { ...(lama || { tipe: 'tabel', per: 8 }), kolom: kol, baris, sumber: [...new Set([...(lama?.sumber || []), 'd_pend'])] };
}

/* ---------- pasar: kebutuhan RUPTL per tahun dan penjualan listrik PLN ---------- */
export function ringkasRuptl(id) {
  const t = pub('rantai_pasok').teknologi.find((x) => x.id === (id === 'panas-bumi' ? 'panas_bumi' : id));
  const per = t?.kebutuhan?.per_tahun || [];
  return { mw: Math.round(per.reduce((s, x) => s + x.mw, 0)), proyek: per.reduce((s, x) => s + x.proyek, 0), tahunPuncak: per.length ? per.reduce((a, b) => (b.mw > a.mw ? b : a)).tahun : null, mwPuncak: per.length ? Math.round(per.reduce((a, b) => (b.mw > a.mw ? b : a)).mw) : 0, per };
}
export function penjualanPln() {
  const w = pub('statistik_pln').wilayah_pln;
  return { gwh: Math.round(w.reduce((s, x) => s + x.penjualan_gwh, 0)), pelanggan: w.reduce((s, x) => s + x.pelanggan, 0) };
}
export function totalPendanaan(id) {
  const K = KONFIG[id], D = data(); const projTek = new Map(D.proyek.map((p) => [p.id, p.teknologi]));
  const c = D.pend.filter((x) => Number.isFinite(x.nilai_usd) && ((x.sektor || []).includes(K.pend) || K.tek.includes(projTek.get(x.proyek_id))));
  return { n: c.length, usd: c.reduce((s, x) => s + x.nilai_usd, 0) };
}
export const fmt = (n, d = 0) => Number(n).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtE = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });


/* ---------- bab 28: tenaga kerja dan sertifikasi (LSP BNSP dari prodi_pelatihan.json) ---------- */
const POLA_LSP = { surya: /surya|plts/i, bayu: /bayu|pltb/i, 'panas-bumi': /panas bumi/i, hidro: /hidro|plta|pltmh|mikro ?hidro/i };
export function tenagaKerja(id) {
  const lsp = pub('prodi_pelatihan').lsp, re = POLA_LSP[id];
  const cocok = lsp.map((l) => ({ nama: l.nama, skema: (l.skema_ebt || []).filter((x) => re.test(x)), aktif: l.status_lisensi })).filter((x) => x.skema.length);
  const nSkema = cocok.reduce((s, x) => s + x.skema.length, 0);
  const nama = cocok.slice(0, 6).map((x) => x.nama).join(', ');
  if (!cocok.length) return { par: P([['Skema sertifikasi BNSP khusus teknologi ini tidak ditemukan di 34 LSP ber-skema EBT yang diperiksa METI; kompetensi dibangun lewat pelatihan teknis umum, pelatihan pabrikan, dan sertifikasi lintas bidang.', 'No BNSP certification scheme specific to this technology was found among the 34 renewables-scheme LSPs checked by METI; skills are built through general technical training, manufacturer training and cross-field certification.']]), n: 0 };
  return { par: P([[`Sertifikasi kompetensi BNSP: ${cocok.length} lembaga sertifikasi profesi (LSP) memuat ${nSkema} skema terkait teknologi ini, antara lain ${nama}. Skema berjenjang dari teknisi, pelaksana, sampai engineer perencana (data prodi_pelatihan, diperiksa 2026).`, `BNSP competency certification: ${cocok.length} professional certification bodies (LSP) list ${nSkema} schemes related to this technology, including ${nama}. Schemes run from technician and installer up to planning engineer (prodi_pelatihan data, checked 2026).`]]), n: cocok.length };
}

export function pakaiDalam(d, id, SUMBER, opsi = {}) {
  Object.assign(d.sumber, SUMBER_DALAM, {
    d_kap: S('IRENA, kapasitas dan pembangkitan terpasang Indonesia (public/data/kapasitas_tren.json)', 'IRENA', 'https://www.irena.org/Data', '2026-11-08', 'resmi', 'IRENA data terbuka'),
    d_lcoe: S('IRENA LCOE dan harga modul via Our World in Data (public/data/biaya_listrik.json)', 'IRENA via Our World in Data', 'https://ourworldindata.org/grapher/levelized-cost-of-energy', '2026-11-08', 'via-pihak-ketiga', 'CC BY 4.0'),
    d_lsp: S('Lembaga sertifikasi profesi BNSP dan skema EBT (public/data/prodi_pelatihan.json, situs BNSP)', 'BNSP, METI', 'https://bnsp.go.id/', '2026-11-07', 'resmi'),
    d_inov: S('Basis inovasi METI (public/data/inovasi.json; tiap inovasi membawa sumbernya)', 'METI, kampus, BRIN dan startup', 'https://platformmeti.timitbnpb.workers.dev/direktori', '2026-11-08', 'via-pihak-ketiga'),
    d_ins: S('Basis insentif METI (public/data/insentif.json: PMK 66/2015, PMK 130/2020, Permen ESDM 11/2024, Perpres 112/2022)', 'BPK JDIH, METI', 'https://peraturan.bpk.go.id/Details/146740/pmk-no-66pmk0102015', '2026-11-07', 'resmi'),
    d_rpasok: S('Kebutuhan MW per tahun dari RUPTL 2025-2034 (public/data/rantai_pasok.json)', 'PLN, ESDM', 'https://gatrik.esdm.go.id/', '2026-11-07', 'resmi'),
    d_izin: S('Izin dan kontrak listrik EBT: pasal Permen ESDM 11/2021, 2/2024, Perpres 112/2022 (public/data/izin_kontrak.json, tiap jawaban membawa pasalnya)', 'Pemerintah RI via BPK JDIH', 'https://peraturan.bpk.go.id/Details/225308', '2026-11-07', 'resmi'),
  });
  d.bab['8'] = bab8(id, d.bab['8']);
  d.bab['9'] = bab9(id);
  d.bab['10'] = bab10(id);
  d.bab['12'] = bab12(id, d.bab['12']);
  d.bab['13'] = linimasaTambah(id, d.bab['13'], 15);
  d.bab['24'] = bab24(id, d.bab['24']);
  d.bab['18'] = bab18(id, d.bab['18']);
  d.bab['26'] = bab26Tambah(id, d.bab['26'], 10);
  { const tk = tenagaKerja(id); ke(d, '28', 'teks', 'paragraf', tk.par, ['d_lsp']); }
  ke(d, '14', 'teks', 'paragraf', kewajibanUmum(), ['d_izin', 'd_ins']);
  d.bab['7'] = bab7Indeks(id, d.bab['7']);
  if (opsi.lcoe) d.bab['19'] = bab19Indeks(id, d.bab['19'], opsi.lcoe);
  if (opsi.owid) { // negara pembanding: Indonesia + 10 negara dari OWID; baris ASEAN lama (opsi.owid.lama) dipetakan dan ditambahkan bila negaranya belum ada
    const t = pembandingOwid(opsi.owid.jenis), ada = new Set(t.baris.map((r) => r.iso2));
    for (const r of d.bab['20']?.baris || []) { const x = opsi.owid.lama(r); if (x && x.iso2 && !ada.has(x.iso2)) { t.baris.push(x); ada.add(x.iso2); } }
    t.sumber = [...new Set([...t.sumber, ...(d.bab['20']?.sumber || [])])];
    t.per = 11;
    d.bab['20'] = t;
  }
  opsi.isi?.(d, { SUMBER, ke, ambilSumber: (...k) => ambilSumber(d, SUMBER, ...k) });
  return d;
}
export { baca, pub, norm, urut, S };
