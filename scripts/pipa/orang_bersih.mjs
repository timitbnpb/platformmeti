#!/usr/bin/env node
// Bersihkan public/data/orang.json di tempat (idempoten, tanpa jaringan): dedup jabatan, pendidikan, tautan; label bahasa Indonesia baku;
// buang teks rusak; tahun tak diketahui = null; tiap fakta bawa tanggal_akses; ringkasan 2-3 kalimat dari fakta (ditulis sendiri).
//   node scripts/pipa/orang_bersih.mjs terapkan     tulis orang.json
//   node scripts/pipa/orang_bersih.mjs --selftest   uji tanpa berkas
// Jalankan SESUDAH potret.mjs / foto_orang_gabung / meti_wilayah_orang / pakar_orang (mereka menulis ulang orang.json) dan sesudah orang_wikidata.mjs terapkan.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BERKAS = path.join(ROOT, 'public/data/orang.json');

// ---------- teks ----------
export const rapi = (s) => (s == null ? s : String(s).replace(/\s+/g, ' ').replace(/\s+,/g, ',').replace(/,(\s*,)+/g, ',').replace(/\band\s*,/gi, 'and').replace(/\bdan\s*,/gi, 'dan').replace(/^[\s,;:-]+|[\s,;:]+$/g, '').replace(/\s+([)\]])/g, '$1').replace(/([(\[])\s+/g, '$1').replace(/\s+/g, ' ').trim());
const lat = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const kata = (s) => lat(s).replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
const nul = (v) => (v == null || /^\s*(\?+|-|n\/?a|null|undefined)?\s*$/i.test(String(v)) ? null : v);

// ---------- jabatan ----------
const TERJEMAH = [ // pola Inggris -> Indonesia baku (urut: spesifik dulu)
  [/^(?:\d+(?:st|nd|rd|th)\s+)?Minister of Energy and,?\s*Mineral Resources$/i, 'Menteri ESDM'],
  [/^(?:\d+(?:st|nd|rd|th)\s+)?Minister of Finance$/i, 'Menteri Keuangan'],
  [/^(?:\d+(?:st|nd|rd|th)\s+)?Deputy Minister of Finance$/i, 'Wakil Menteri Keuangan'],
  [/^(?:\d+(?:st|nd|rd|th)\s+)?Minister of Investment and Downstream Policy$/i, 'Menteri Investasi dan Hilirisasi'],
  [/^(?:\d+(?:st|nd|rd|th)\s+)?Deputy Minister of State-Owned Enterprises$/i, 'Wakil Menteri BUMN'],
  [/^(?:\d+(?:st|nd|rd|th)\s+)?Deputy Minister of Higher Education, Science,? and Technology$/i, 'Wakil Menteri Pendidikan Tinggi, Sains, dan Teknologi'],
  [/^(?:\d+(?:st|nd|rd|th)\s+)?Ambassador of Indonesia to (?:the )?(.+)$/i, (m) => 'Duta Besar Indonesia untuk ' + ({ 'United States': 'Amerika Serikat', Japan: 'Jepang' }[m[1]] || m[1])],
  [/^(?:\d+(?:st|nd|rd|th)\s+)?Chairperson of Kadin Indonesia$/i, 'Ketua Umum Kadin Indonesia'],
  [/^(?:\d+(?:st|nd|rd|th)\s+)?Head of Danantara Indonesia$/i, 'Kepala Danantara Indonesia'],
  [/^Chief Executive Officer Danantara$/i, 'CEO Danantara'],
  [/^Deputy Speaker of the People's Consultative Assembly(?: of the Republic of Indonesia)?$/i, 'Wakil Ketua MPR RI'],
  [/^Member of the House of Representatives(?: of the Republic of Indonesia)?$/i, 'Anggota DPR RI'],
  [/^Secretary-General of Democratic Party$/i, 'Sekretaris Jenderal Partai Demokrat'],
  [/^President Commissioner of (.+)$/i, (m) => 'Komisaris Utama ' + m[1]],
  [/^Vice President Commissioner$/i, 'Wakil Komisaris Utama'],
  [/^President Commissioner$/i, 'Komisaris Utama'],
  [/^President Director$/i, 'Direktur Utama'],
  [/^Director$/i, 'Direktur'],
  [/^Member of Supervisory Board$/i, 'Anggota Dewan Pengawas'],
  [/^Chairman, Supervisory Board$/i, 'Ketua Dewan Pengawas'],
  [/^Vice Chairman, Supervisory Board$/i, 'Wakil Ketua Dewan Pengawas'],
  [/^Secretary General$/i, 'Sekretaris Jenderal'],
  [/^Deputy Secretary General$/i, 'Wakil Sekretaris Jenderal'],
  [/^Executive Director$/i, 'Direktur Eksekutif'],
  [/^Chairman$/i, 'Ketua'],
  [/^Director of (.+)$/i, (m) => 'Direktur ' + m[1]],
];
export function labelJabatan(s) {
  let t = rapi(s); if (!t) return t;
  const db = t.match(/^Daftar .*?((?:Duta Besar|Wakil Menteri|Menteri)\b(?:(?!Daftar ).)*)$/i); if (db) t = rapi(db[1].replace(/\bUntuk\b/g, 'untuk'));
  t = t.replace(/([a-z])(?=(?:Duta Besar|Wakil Menteri|Menteri) .*$)/, '$1\u0001').split('\u0001')[0];
  t = t.replace(/\s+ke-\d+$/i, '').replace(/Kamar Dagang dan Industri/g, 'Kadin').replace(/Badan Usaha Milik Negara/g, 'BUMN').replace(/^Chief Executive Officer$/i, 'CEO');
  for (const [re, to] of TERJEMAH) { const m = t.match(re); if (m) { t = typeof to === 'function' ? to(m) : to; break; } }
  t = t.replace(/\bEnergi dan Sumber Daya Mineral\b/g, 'ESDM').replace(/^(Menteri|Wakil Menteri) (.+?) Indonesia$/, '$1 $2');
  return t;
}
const kunciJab = (t) => {
  let s = lat(labelJabatan(t)).replace(/\(.*?\)/g, ' ').replace(/\bke ?-? ?\d+\b/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const db = s.match(/^duta besar (?:indonesia )?untuk ([a-z ]+?)(?: dan .*)?$/); if (db) return 'duta besar ' + db[1].trim();
  return s.replace(/\bindonesia\b/g, '').replace(/\bri\b/g, '').replace(/\s+/g, ' ').trim();
};
const ALIAS_ORG = [[/kementerian (energi dan sumber daya mineral|esdm)/, 'kementerian esdm'], [/dewan perwakilan rakyat( ri| republik indonesia)?( komisi xii)?/, (m) => 'dpr ri' + (m[2] ? ' komisi xii' : '')]];
const kunciOrg = (o) => { if (!o) return ''; let s = lat(o).replace(/\(persero\)|\btbk\b|\bpt\b/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); for (const [re, to] of ALIAS_ORG) { const m = s.match(re); if (m) return typeof to === 'function' ? to(m) : to; } return s; };

const bobotSumber = (u) => { // kecil = lebih tepercaya (resmi menang atas Wikipedia/Wikidata)
  const x = String(u || ''); if (/^lokal:/.test(x)) return 1; if (/en\.wikipedia/.test(x)) return 5; if (/wikidata/.test(x)) return 4; if (/id\.wikipedia/.test(x)) return 3; return 0;
};
const presisi = (d) => (d ? String(d).length : 0);
const thn = (d) => (d ? String(d).slice(0, 4) : null);
const tumpang = (a, b) => { // rentang waktu bersinggungan (tahun); tanpa tanggal = cocok
  const a1 = thn(a.mulai), a2 = thn(a.selesai) || (a.kini ? '9999' : a1), b1 = thn(b.mulai), b2 = thn(b.selesai) || (b.kini ? '9999' : b1);
  if (!a1 || !b1) return true; return a1 <= (b2 || '9999') && b1 <= (a2 || '9999') ? true : false;
};

export function gabungJabatan(daftar, tgl, labelOrg = (x) => x) {
  const baris = (daftar || []).map((j) => ({ ...j, jabatan: labelJabatan(j.jabatan), organisasi: j.organisasi ? rapi(labelOrg(j.organisasi)) : j.organisasi, mulai: nul(j.mulai), selesai: nul(j.selesai) })).filter((j) => j.jabatan);
  const hasil = [];
  for (const j of baris) {
    const k = kunciJab(j.jabatan), ko = kunciOrg(j.organisasi);
    const sama = hasil.find((h) => h._k === k && (!ko || !h._ko || ko === h._ko || (j.organisasi_id && j.organisasi_id === h.organisasi_id)) && tumpang(h, j));
    if (!sama) { hasil.push({ ...j, _k: k, _ko: ko, _src: [j.sumber_url].filter(Boolean), _mu: [j] }); continue; }
    sama._mu.push(j); if (j.sumber_url && !sama._src.includes(j.sumber_url)) sama._src.push(j.sumber_url);
  }
  return hasil.map((h) => {
    const mu = h._mu.sort((a, b) => bobotSumber(a.sumber_url) - bobotSumber(b.sumber_url) || (b.organisasi ? 1 : 0) - (a.organisasi ? 1 : 0));
    const utama = mu[0], lengkap = (f) => mu.map((x) => x[f]).filter(Boolean).sort((a, b) => presisi(b) - presisi(a));
    const out = { ...utama };
    out.organisasi_id = mu.find((x) => x.organisasi_id)?.organisasi_id ?? utama.organisasi_id;
    out.organisasi = mu.find((x) => x.organisasi)?.organisasi ?? utama.organisasi;
    // label: bentuk Indonesia yang paling lengkap ("(ke-N)" dan "dan Federasi ..." dipertahankan), asal sumber bukan Inggris
    const kand = mu.filter((x) => bobotSumber(x.sumber_url) < 5).map((x) => x.jabatan); out.jabatan = (kand.length ? kand : mu.map((x) => x.jabatan)).sort((a, b) => b.length - a.length)[0];
    for (const f of ['mulai', 'selesai']) { const s = lengkap(f); const pu = utama[f]; out[f] = pu && s.every((v) => thn(v) === thn(pu)) ? (presisi(pu) >= presisi(s[0]) ? pu : s[0]) : pu || s[0] || null; }
    out.kini = out.selesai ? false : mu.some((x) => x.kini);
    const urut = mu.find((x) => x.urutan)?.urutan; if (urut) out.urutan = urut; else delete out.urutan;
    out.sumber_url = utama.sumber_url ?? null; const lain = h._src.filter((u) => u !== out.sumber_url); if (lain.length) out.sumber_lain = lain; else delete out.sumber_lain;
    out.tanggal_akses = utama.tanggal_akses || tgl;
    for (const x of ['_k', '_ko', '_src', '_mu']) delete out[x];
    if (!out.organisasi) delete out.organisasi; if (!out.organisasi_id) delete out.organisasi_id;
    return out;
  }).sort((a, b) => (+b.kini - +a.kini) || String(b.mulai || '').localeCompare(String(a.mulai || '')) || (a.jabatan < b.jabatan ? -1 : 1));
}

// ---------- pendidikan ----------
const SINGKAT_KAMPUS = { itb: 'bandung', ui: 'indonesia', ugm: 'gadjah mada', its: 'sepuluh nopember', ipb: 'bogor', unair: 'airlangga', undip: 'diponegoro', unpad: 'padjadjaran', unhas: 'hasanuddin', ub: 'brawijaya', mit: 'massachusetts', anu: 'australian national' };
const UMUM = new Set(['universitas', 'university', 'universiteit', 'universitat', 'institut', 'institute', 'institut', 'of', 'the', 'technology', 'teknologi', 'de', 'dan', 'and', 'college', 'school', 'sekolah', 'tinggi', 'negeri', 'state', 'di', 'in', 'at']);
const tokKampus = (s) => { const t = kata(s).map((w) => SINGKAT_KAMPUS[w] || w).join(' ').split(' ').filter((w) => !UMUM.has(w)); return t; };
const sama = (a, b) => { if (!a.length || !b.length) return false; const A = new Set(a), B = new Set(b); return [...A].every((x) => B.has(x)) || [...B].every((x) => A.has(x)); };
const NAMA_KAMPUS = [[/^bandung institute of technology$|^itb$/i, 'Institut Teknologi Bandung'], [/^harvard university$/i, 'Universitas Harvard'], [/^university of indonesia$|^ui$/i, 'Universitas Indonesia'], [/^gadjah mada university$|^ugm$/i, 'Universitas Gadjah Mada'], [/^bogor agricultural university$|^ipb$/i, 'Institut Pertanian Bogor'], [/^sepuluh nopember institute of technology$|^its$/i, 'Institut Teknologi Sepuluh Nopember'], [/^waseda university$/i, 'Universitas Waseda'], [/^university of kansas$/i, 'Universitas Kansas'], [/^university of (.+)$/i, (m) => 'Universitas ' + m[1]], [/^(.+) university$/i, (m) => 'Universitas ' + m[1]]];
export const labelKampus = (s) => { const t = rapi(s); if (!t) return t; for (const [re, to] of NAMA_KAMPUS) { const m = t.match(re); if (m) return typeof to === 'function' ? to(m) : to; } return t; };
export function gabungPendidikan(daftar, tgl) {
  const out = [];
  for (const p of daftar || []) {
    const q = { jenjang: nul(p.jenjang), bidang: nul(rapi(p.bidang)), institusi: labelKampus(p.institusi), mulai: nul(p.mulai), lulus: nul(p.lulus), sumber_url: p.sumber_url ?? null, tanggal_akses: p.tanggal_akses || tgl };
    if (!q.institusi) continue; if (/^of\b/i.test(q.bidang || '')) q.bidang = null;
    const a = out.find((x) => sama(tokKampus(x.institusi), tokKampus(q.institusi)) && (!x.jenjang || !q.jenjang || x.jenjang === q.jenjang));
    if (!a) { out.push(q); continue; }
    if (bobotSumber(q.sumber_url) < bobotSumber(a.sumber_url)) { const asli = a.jenjang; Object.assign(a, { institusi: q.institusi, sumber_url: q.sumber_url, tanggal_akses: q.tanggal_akses }); a.jenjang = asli; }
    else if (q.sumber_url && q.sumber_url !== a.sumber_url) (a.sumber_lain ||= []).includes(q.sumber_url) || a.sumber_lain.push(q.sumber_url);
    for (const f of ['jenjang', 'bidang', 'mulai', 'lulus']) a[f] ??= q[f];
  }
  const URUT = { S3: 0, S2: 1, S1: 2, D4: 3, D3: 4 };
  return out.sort((a, b) => (URUT[a.jenjang] ?? 9) - (URUT[b.jenjang] ?? 9) || (a.institusi < b.institusi ? -1 : 1));
}

// ---------- tautan ----------
const BASIS = (u) => { try { const x = new URL(u); return x.host.replace(/^www\./, '').toLowerCase() + x.pathname.replace(/\/+$/, '') + x.search; } catch { return String(u).toLowerCase(); } };
export function gabungTautan(daftar, tgl) {
  const peta = new Map();
  for (const t of daftar || []) {
    if (!t?.url) continue; const k = BASIS(t.url); const lama = peta.get(k);
    if (lama) { if (t.sumber_url && t.sumber_url !== lama.sumber_url) (lama.sumber_lain ||= []).includes(t.sumber_url) || lama.sumber_lain.push(t.sumber_url); continue; }
    const o = { jenis: t.jenis, url: t.url, sumber_url: t.sumber_url ?? null, tanggal_akses: t.tanggal_akses || tgl };
    const w = String(t.url).match(/^https?:\/\/([a-z]{2,3})\.wikipedia\.org\//); if (w) { o.bahasa = w[1]; o.label = 'Wikipedia (' + w[1] + ')'; }
    peta.set(k, o);
  }
  const URUT = ['profil-resmi', 'situs', 'wikipedia', 'wikidata', 'orcid', 'openalex', 'scholar', 'profil-meti', 'linkedin'];
  return [...peta.values()].sort((a, b) => { const i = (x) => { const n = URUT.indexOf(x.jenis); return n < 0 ? 99 : n; }; return i(a) - i(b) || (a.bahasa === 'id' ? -1 : 0) - (b.bahasa === 'id' ? -1 : 0); });
}

// ---------- ringkasan (ditulis dari fakta terstruktur, bukan salinan) ----------
const JENJANG = { S1: 'S1', S2: 'S2', S3: 'S3' };
const rentang = (j) => { const a = thn(j.mulai), b = thn(j.selesai); return a && b ? (a === b ? ` (${a})` : ` (${a}-${b})`) : a ? (j.kini ? ` (sejak ${a})` : ` (${a})`) : b ? ` (hingga ${b})` : ''; };
const GENERIK_ORG = new Set(['kementerian', 'pt', 'dewan', 'badan', 'dinas', 'persero', 'tbk', 'republik', 'indonesia', 'ri', 'masyarakat']);
const dengan = (j) => { const tk = kata(j.organisasi).filter((w) => !GENERIK_ORG.has(w)), jt = kata(j.jabatan); return j.jabatan + (j.organisasi && !tk.some((w) => jt.includes(w)) ? ' di ' + j.organisasi : ''); };
export function ringkas(o) {
  const jb = o.jabatan || []; if (!jb.length && !(o.pendidikan || []).length) return o.ringkasan || null;
  const nama = rapi(o.nama); const s = [];
  const kini = jb.filter((j) => j.kini); const utama = kini[0] || jb[0];
  if (utama) {
    const ang = thn(utama.mulai);
    s.push(utama.kini ? `${nama} menjabat sebagai ${dengan(utama)}${ang ? ' sejak ' + ang : ''}.` : `${nama} pernah menjabat sebagai ${dengan(utama)}${rentang(utama)}.`);
  }
  const lain = jb.filter((j) => j !== utama).slice(0, 2);
  if (lain.length) s.push(`${utama?.kini ? 'Sebelumnya ia pernah menjabat' : 'Jabatan lainnya meliputi'} ${lain.map((j) => dengan(j) + rentang(j)).join(' dan ')}.`);
  const pd = (o.pendidikan || []).slice(0, 2);
  if (pd.length) s.push(`Pendidikan: ${pd.map((p) => [p.jenjang && JENJANG[p.jenjang], p.bidang, p.institusi].filter(Boolean).join(' ') + (p.lulus ? ` (${thn(p.lulus)})` : '')).join('; ')}.`);
  return s.slice(0, 3).join(' ');
}

// ---------- satu baris ----------
export function bersihkanOrang(o, tgl, labelOrg) {
  const t = o.tanggal || tgl; const x = { ...o };
  x.nama = rapi(x.nama);
  x.jabatan = gabungJabatan(x.jabatan, t, labelOrg);
  if (x.jabatan_terkini) x.jabatan_terkini = labelJabatan(x.jabatan_terkini);
  if (x.organisasi_terkini) x.organisasi_terkini = rapi(labelOrg ? labelOrg(x.organisasi_terkini) : x.organisasi_terkini);
  if (x.pendidikan) { x.pendidikan = gabungPendidikan(x.pendidikan, t); if (!x.pendidikan.length) delete x.pendidikan; }
  if (x.tautan) x.tautan = gabungTautan(x.tautan, t);
  if (x.ringkasan) x.ringkasan = rapi(x.ringkasan);
  return x;
}

export function bersihkan(d) {
  const label = new Map(); // kunci organisasi -> label terbanyak (bentuk baku seragam sedunia)
  const hit = new Map();
  for (const o of d.baris) for (const j of [...(o.jabatan || []), { organisasi: o.organisasi_terkini }]) { if (!j.organisasi) continue; const k = kunciOrg(j.organisasi), l = rapi(j.organisasi); const m = hit.get(k) || new Map(); m.set(l, (m.get(l) || 0) + 1); hit.set(k, m); }
  for (const [k, m] of hit) label.set(k, [...m].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0]);
  const labelOrg = (x) => label.get(kunciOrg(x)) || x;
  const stat = { jabatan_sebelum: 0, jabatan_sesudah: 0, pendidikan_sebelum: 0, pendidikan_sesudah: 0, tautan_sebelum: 0, tautan_sesudah: 0 };
  d.baris = d.baris.map((o) => {
    stat.jabatan_sebelum += (o.jabatan || []).length; stat.pendidikan_sebelum += (o.pendidikan || []).length; stat.tautan_sebelum += (o.tautan || []).length;
    const x = bersihkanOrang(o, d.dibangun_pada, labelOrg);
    // ringkasan: yang ditulis tangan/panjang dipertahankan; selainnya dibangun dari fakta
    if (!o.ringkasan || o.ringkasan.length < 160 || o.ringkasan_otomatis) { const r = ringkas(x); if (r) { x.ringkasan = r; x.ringkasan_otomatis = true; } }
    stat.jabatan_sesudah += x.jabatan.length; stat.pendidikan_sesudah += (x.pendidikan || []).length; stat.tautan_sesudah += (x.tautan || []).length;
    return x;
  });
  return stat;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) {
    assert.equal(labelJabatan('18th Minister of Energy and , Mineral Resources'), 'Menteri ESDM');
    assert.equal(labelJabatan('Menteri Energi dan Sumber Daya Mineral Indonesia'), 'Menteri ESDM');
    const j = gabungJabatan([
      { jabatan: '18th Minister of Energy and , Mineral Resources', mulai: '2019-10-23', selesai: '2024-08-19', kini: false, sumber_url: 'https://en.wikipedia.org/wiki/A' },
      { organisasi: 'Kementerian ESDM', jabatan: 'Menteri ESDM (ke-21)', mulai: '2019-10-23', selesai: '2024-08-19', kini: false, sumber_url: 'https://esdm.go.id/x' },
      { jabatan: 'Menteri Energi dan Sumber Daya Mineral Indonesia', mulai: '2019-10-23', selesai: '2024-08-19', sumber_url: 'https://www.wikidata.org/wiki/Q1' },
      { jabatan: 'Duta Besar Indonesia untuk Jepang dan Federasi Mikronesia', mulai: '2017-06-22', selesai: '2019-10-23', sumber_url: 'https://id.wikipedia.org/wiki/A' },
      { jabatan: '18th Ambassador of Indonesia to Japan', mulai: '2017-03-13', selesai: '2019-10-23', sumber_url: 'https://en.wikipedia.org/wiki/A' },
      { jabatan: 'Duta Besar Indonesia untuk Jepang', mulai: '2017', selesai: '2019', sumber_url: 'https://www.wikidata.org/wiki/Q1' }], '2026-11-07');
    assert.equal(j.length, 2); assert.equal(j[0].jabatan, 'Menteri ESDM (ke-21)'); assert.equal(j[0].sumber_lain.length, 2); assert.equal(j[1].jabatan, 'Duta Besar Indonesia untuk Jepang dan Federasi Mikronesia'); assert.equal(j[1].mulai, '2017-06-22');
    // jabatan sama di lembaga berbeda TIDAK digabung
    assert.equal(gabungJabatan([{ organisasi: 'A', jabatan: 'Direktur' }, { organisasi: 'B', jabatan: 'Direktur' }], 't').length, 2);
    const p = gabungPendidikan([{ institusi: 'Institut Teknologi Bandung', sumber_url: 'https://www.wikidata.org/wiki/Q1' }, { institusi: 'Bandung Institute of Technology', jenjang: 'S1', lulus: '1985', sumber_url: 'https://en.wikipedia.org/wiki/A' }], 't');
    assert.equal(p.length, 1); assert.equal(p[0].jenjang, 'S1'); assert.equal(p[0].lulus, '1985'); assert.equal(p[0].mutu, undefined);
    assert.equal(gabungPendidikan([{ institusi: 'Universitas Indonesia' }, { institusi: 'Universitas Gadjah Mada' }], 't').length, 2);
    const tl = gabungTautan([{ jenis: 'wikipedia', url: 'https://id.wikipedia.org/wiki/A', sumber_url: 'x' }, { jenis: 'wikipedia', url: 'https://en.wikipedia.org/wiki/A', sumber_url: 'x' }, { jenis: 'profil-resmi', url: 'https://www.esdm.go.id/a/', sumber_url: 'y' }, { jenis: 'profil-resmi', url: 'https://esdm.go.id/a', sumber_url: 'z' }], 't');
    assert.equal(tl.length, 3); assert.ok(tl.some((t) => t.label === 'Wikipedia (id)'));
    assert.equal(nul('?'), null); assert.equal(rapi('a ,  , b'), 'a, b');
    console.log('orang_bersih selftest ok'); process.exit(0);
  }
  if (process.argv[2] !== 'terapkan') { console.error('pakai: terapkan | --selftest'); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(BERKAS, 'utf8')); const s = bersihkan(d);
  fs.writeFileSync(BERKAS, JSON.stringify(d), 'utf8'); console.log('orang.json:', d.baris.length, 'orang', JSON.stringify(s));
}
