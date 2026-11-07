#!/usr/bin/env node
// Panen fakta energi dari 1001startup.id untuk Jaringan METI. Node stdlib saja.
//   node panen_1001.mjs --daftar            ukur kandidat saja (2 permintaan: search-index + sitemap)
//   node panen_1001.mjs                     panen penuh, resumable (raw/ yang ada tidak diunduh ulang)
//   node panen_1001.mjs --hanya=xurya       satu slug (company/<slug> + chain/<slug>)
//   node panen_1001.mjs --parse             tanpa jaringan: bangun ulang jsonl dari raw/
//   node panen_1001.mjs --selftest          uji parser tanpa jaringan
// Etika: UA jujur, 1 permintaan serentak, jeda >= 2 dtk, 429 dihormati, 403 = berhenti total.
// Tidak menyimpan: teks deskripsi, angka est, skor keyakinan, logo, surel/telepon. Path terlarang: /api/ /leads /map /stats.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const BASE = 'https://1001startup.id';
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const GAP_MS = 2200;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data-panen/1001');
const RAW = path.join(OUT, 'raw');
const FORBIDDEN = /^\/(api|leads|map|stats)(\/|$)/;
const ENERGI = /solar|plts|surya|energy|energi|\bev\b|electric|battery|baterai|charg|grid|hydrogen|biomass|geothermal|wind|renewable|listrik|\bpower\b|clean|panas bumi|bioenergi/i;
const ENERGI_FILTER = new RegExp(ENERGI.source.replace('|surya', ''), 'i'); // 'surya' = nama keluarga/PT, terlalu longgar untuk saringan akhir
const ENERGI_BUMD = /energi|energy|migas|petro|listrik|\bgas\b|hulu|power|minyak|pembangkit/i;
const BUMN_ENERGI = ['pertamina', 'pln', 'mind-id'];
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

// ---------- util teks ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const dec = (s) => s.replace(/&#x([0-9a-f]+);|&#(\d+);|&(\w+);/gi, (m, h, d, n) =>
  h ? String.fromCodePoint(parseInt(h, 16)) : d ? String.fromCodePoint(+d) : (ENT[n] ?? m));
const txt = (s = '') => dec(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const attr = (s, name) => (s.match(new RegExp(`${name}="([^"]*)"`)) || [])[1];
const isoDate = (s) => {
  if (!s) return null;
  let m = s.match(/(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  m = s.match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/);
  if (m) return `${m[3]}-${String(MONTHS[m[2].toLowerCase()]).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = s.match(/([A-Za-z]{3})[a-z]*\s+(\d{4})/);
  if (m && MONTHS[m[1].toLowerCase()]) return `${m[2]}-${String(MONTHS[m[1].toLowerCase()]).padStart(2, '0')}`;
  m = s.match(/\b(20\d\d|19\d\d)\b/);
  return m ? m[1] : null;
};
const TEKNIS = /~?\d[\d,.]*\s?(?:GWh|MWh|kWh|GWp|MWp|kWp|Wp|GW|MW|kW|kVA|MVA|panels?|units?|buses|vehicles|stations?|chargers?|sites?|km)\b/gi;

// ---------- parser /company/<slug> ----------
export function parseCompany(html, slug) {
  const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
    .map((m) => { try { return JSON.parse(m[1]); } catch { return null; } }).filter(Boolean);
  const org = ld.find((o) => o['@type'] === 'Organization');
  const page = ld.find((o) => o['@type'] === 'WebPage');
  const jsonLd = org ? Object.fromEntries(Object.entries(org).filter(([k]) => !['logo', 'image', 'email', 'telephone'].includes(k))) : null;
  const facts = {};
  for (const m of html.matchAll(/<div class="cp-fact">\s*<dt class="cp-k">(.*?)<\/dt>\s*<dd class="cp-v">(.*?)<\/dd>\s*<\/div>/gs)) facts[txt(m[1])] = m[2];
  const noEst = (dd) => dd && !/class="cp-est"/.test(dd);
  const srcOf = (dd) => (dd && (dd.match(/class="cp-srcl" href="([^"]+)"/) || [])[1]) || null;
  const plain = (dd) => txt((dd || '').replace(/<span class="cp-note">.*?<\/span>/gs, '').replace(/<a class="cp-srcl".*?<\/a>/gs, ''));

  const what = txt((html.match(/<p class="cp-what">(.*?)<\/p>/s) || [])[1]);
  let pendanaan = null;
  if (noEst(facts['Disclosed funding'])) {
    const t = plain(facts['Disclosed funding']);
    const m = t.match(/([≥>~<]|at least|over)?\s*US\$\s*([\d.,]+)\s*([MBK])?/i);
    if (m) {
      const n = parseFloat(m[2].replace(/,/g, ''));
      const mult = { M: 1, B: 1000, K: 0.001 }[(m[3] || 'M').toUpperCase()];
      pendanaan = { nilai_usd_juta: n * mult, penanda_min: m[1] ? m[1] : null, sumber_url: srcOf(facts['Disclosed funding']) };
    }
  }
  let valuasi = null;
  if (facts.Valuation && noEst(facts.Valuation)) valuasi = { nilai: plain(facts.Valuation), sumber_url: srcOf(facts.Valuation) };
  let pegawai = null;
  if (facts.People && noEst(facts.People)) {
    const n = plain(facts.People).match(/([\d,.]+)/);
    const note = (facts.People.match(/<span class="cp-note">(.*?)<\/span>/s) || [])[1] || '';
    if (n) pegawai = { jumlah: +n[1].replace(/,/g, ''), tanggal_baca: /not recorded/i.test(note) ? null : isoDate(txt(note)), sumber_url: srcOf(facts.People) };
  } else if (org?.numberOfEmployees?.value && !facts.People) pegawai = { jumlah: org.numberOfEmployees.value, tanggal_baca: null, sumber_url: null };
  let kantor = null;
  if (facts.Where) {
    const p = plain(facts.Where).split(',').map((s) => s.trim()).filter(Boolean);
    kantor = p.length > 1 ? { kecamatan: p[0], kota: p[p.length - 1] } : { kecamatan: null, kota: p[0] || null };
  }
  const rank = html.match(/Census #(\d+) of (\d+)/);
  const updated = html.match(/\(updated (\d{1,2} [A-Za-z]{3} \d{4})\)/);
  return {
    slug, jenis_entitas: 'startup',
    nama: txt((html.match(/<h1 class="cp-name">(.*?)<\/h1>/s) || [])[1]) || org?.name || null,
    nama_hukum: txt((html.match(/<div class="cp-legal">(.*?)<\/div>/s) || [])[1]) || org?.legalName || null,
    sektor: txt((html.match(/<a class="cp-tag cp-sector"[^>]*>(.*?)<\/a>/s) || [])[1]) || null,
    label_bidang: what ? what.split(/\s+/).slice(0, 10).join(' ') : null,
    peringkat_sensus: rank ? +rank[1] : null,
    tahun_berdiri: org?.foundingDate ? String(org.foundingDate) : null,
    pendiri: (org?.founder || []).map((f) => f.name).filter(Boolean),
    pendanaan_diumumkan: pendanaan,
    putaran_terakhir: facts['Last round'] ? plain(facts['Last round']) : null,
    valuasi, pegawai, kantor,
    investor: [...html.matchAll(/<a class="cp-chip"[^>]*>(.*?)<\/a>/gs)].map((m) => txt(m[1])),
    situs_resmi: org?.url || null,
    sumber_url: [...html.matchAll(/<span class="cp-srcu">(.*?)<\/span>/gs)].map((m) => txt(m[1])),
    sensus_updated: updated ? isoDate(updated[1]) : null,
    sensus_date_modified: page?.dateModified || null,
    json_ld: jsonLd,
  };
}

// ---------- parser rantai pasok (/chain/<slug>, /chain/x/<slug>, bagian rantai di /company/<slug>) ----------
export function parseChain(html, dariSlug) {
  const start = html.indexOf('class="ch-cols"');
  if (start < 0) return [];
  const body = html.slice(start);
  const rows = [];
  let arah = null, jenis = null;
  const tok = /class="ch-hd">([^<]+)<|class="ch-gh">([^<]+)<|<div class="ch-r">/g;
  const marks = [...body.matchAll(tok)];
  marks.forEach((mk, i) => {
    if (mk[1]) { arah = { suppliers: 'pemasok', customers: 'pelanggan' }[mk[1].trim().toLowerCase()] || mk[1].trim().toLowerCase(); jenis = null; return; }
    if (mk[2]) { jenis = txt(mk[2]); return; }
    const end = marks[i + 1] ? marks[i + 1].index : body.length;
    const blk = body.slice(mk.index, end);
    const l = blk.match(/<(a|span) class="ch-l"([^>]*)>/);
    if (!l) return;
    const nmHtml = (blk.match(/<span class="ch-nm">(.*?)<\/span>\s*(?:<span class="ch-w">|<\/(?:a|span)>)/s) || blk.match(/<span class="ch-nm">(.*?)<\/span>/s) || [])[1] || '';
    const em = txt((nmHtml.match(/<em>(.*?)<\/em>/s) || [])[1]);
    const href = attr(l[2], 'href') || '';
    const keSlug = (href.match(/^\/chain\/(x\/[^/?#]+)/) || href.match(/^\/company\/([^/?#]+)/) || [])[1] || null;
    const w = txt((blk.match(/<span class="ch-w">(.*?)<\/span>\s*(?=<\/(?:a|span)>|<a class="ch-ev")/s) || blk.match(/<span class="ch-w">(.*?)<\/span>/s) || [])[1]);
    const ev = blk.match(/<a class="ch-ev" href="([^"]+)"/);
    const tipe = (blk.match(/class="ch-t ch-t-([a-z-]+)"/) || [])[1] || null;
    const wTeknis = [...w.matchAll(TEKNIS)].map((m) => m[0].trim());
    const pct = /stake|owns?\b|owned|shareholding|equity|shares?\b/i.test(w) ? (w.match(/(\d+(?:\.\d+)?)\s?%/) || [])[1] : null;
    rows.push({
      dari_slug: dariSlug,
      ke_nama: txt(nmHtml.replace(/<em>.*?<\/em>/gs, '')),
      ke_slug: keSlug,
      arah, jenis,
      persen_kepemilikan: pct ? +pct : null,
      besaran_teknis: wTeknis.length ? [...new Set(wTeknis)].join('; ') : null,
      label_bukti: tipe === 'firstparty' ? 'first-party' : tipe,
      domain_sumber: txt((blk.match(/<span class="ch-h">(.*?)<\/span>/s) || [])[1]) || null,
      sumber_url: ev ? dec(ev[1]) : null,
      tanggal_dokumen: isoDate(txt((blk.match(/<span class="ch-d">(.*?)<\/span>/s) || [])[1])),
      status_sensus: /outside/i.test(em) ? 'outside' : /not in/i.test(em) ? 'not in' : 'in',
    });
  });
  return rows;
}

export function chainHeader(html) { // "42 technology & manufacturing links" untuk adu hitungan
  const m = txt(html).match(/(\d+) technology & manufacturing links/);
  return m ? +m[1] : null;
}

// ---------- halaman luar sensus /chain/x/<slug> ----------
export function parseExternal(html, slug) {
  const sum = txt((html.match(/<p class="ch-sum">(.*?)<\/p>/s) || [])[1]);
  const web = (html.match(/<a href="([^"]+)"[^>]*>Its website/) || [])[1];
  return {
    slug, jenis_entitas: 'luar-sensus',
    nama: txt((html.match(/<h1 class="ch-h1">(.*?)<\/h1>/s) || [])[1]) || null,
    nama_hukum: (sum.match(/^(.*?)\.\s+Not a census/) || [])[1] || null,
    sektor: null, situs_resmi: web ? dec(web) : null, sumber_url: [],
  };
}

// ---------- BUMN: peta grup (anak usaha + persen saham + sumber) ----------
export function parseBumn(html, slug) {
  const out = [];
  const tok = /<section class="sk-seg" id="co-([^"]+)"|<ul\b|<\/ul>|<li id="co-([^"]+)">\s*<div class="kr">\s*<span class="n">(.*?)<\/span>\s*<span class="p">(.*?)<\/span>/gs;
  const parentAt = {}; let depth = 0, seg = null;
  let cur = null;
  for (const m of html.matchAll(tok)) {
    if (m[1]) { seg = m[1]; depth = 0; parentAt[0] = seg;
      const hd = html.slice(m.index, m.index + 1200);
      const a = hd.match(/<span class="k">\s*<a href="([^"]+)"[^>]*>([^<]*)<\/a>/);
      const nm = txt((hd.match(/<h3>(.*?)<\/h3>/s) || [])[1]);
      out.push({ dari_slug: slug, ke_nama: nm, ke_slug: seg, arah: 'pemilik', jenis: 'Anak usaha',
        persen_kepemilikan: a ? parseFloat(a[2]) || null : null, sumber_url: a ? dec(a[1]) : null,
        status_operasi: a && /not yet operating/i.test(hd) ? 'belum-operasi' : null });
    } else if (m[0] === '<ul') depth++;
    else if (m[0] === '</ul>') depth--;
    else if (m[2]) {
      const a = m[4].match(/<a href="([^"]+)"[^>]*>([^<]*)<\/a>/);
      const p = parentAt[depth - 1] ?? seg ?? slug;
      parentAt[depth] = m[2];
      out.push({ dari_slug: p, ke_nama: txt(m[3].replace(/<em>.*?<\/em>|<span class="sk-mg".*?<\/span>/gs, '')), ke_slug: m[2], arah: 'pemilik', jenis: 'Anak usaha',
        persen_kepemilikan: a ? parseFloat(a[2]) || null : null, sumber_url: a ? dec(a[1]) : null,
        status_operasi: /not yet operating/i.test(m[3]) ? 'belum-operasi' : null });
    }
  }
  return out;
}

// ---------- pusat data: bagian "Power" ----------
export function parseDataCenter(html, slug) {
  const sec = html.match(/<b>Power<\/b>.*?<ul class="leaves">(.*?)<\/ul><\/section>/s);
  if (!sec) return [];
  const ev = { ok: 'confirmed', only: 'company-word', part: 'snippet-only', no: 'inferensi-1001' };
  return [...sec[1].matchAll(/<li>(.*?)<\/li>/gs)].map((m) => ({
    dari_slug: slug, ke_nama: txt((m[1].match(/class="nm">(.*?)<\/span>/s) || [])[1]),
    ke_slug: null, arah: 'pemasok', jenis: 'Power',
    relasi_teks: txt((m[1].match(/class="rw">(.*?)<\/span>/s) || [])[1]),
    lokasi_aset: txt((m[1].match(/class="sub">(.*?)<\/span>/s) || [])[1]) || null,
    label_bukti: ev[(m[1].match(/class="d (\w+)"/) || [])[1]] || null,
  }));
}

// ---------- jaringan ----------
let lastReq = 0;
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function get(url) {
  const p = new URL(url).pathname;
  if (FORBIDDEN.test(p)) throw new Error(`path terlarang robots: ${p}`);
  for (let attempt = 0; attempt < 5; attempt++) {
    const wait = lastReq + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastReq = Date.now();
    let res;
    try { res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/json' } }); }
    catch (e) { console.error(`  jaringan ${e.message}, ulang`); await sleep(5000 * (attempt + 1)); continue; }
    if (res.status === 403) { console.error(`BLOKIR 403 di ${url}. BERHENTI TOTAL.`); process.exit(3); }
    if (res.status === 429) {
      const ra = Math.min(+res.headers.get('retry-after') || 60, 600);
      console.error(`  429, tunggu ${ra}s`); await sleep(ra * 1000); continue;
    }
    if (res.status >= 500) { await sleep(5000 * (attempt + 1)); continue; }
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`); // 4xx lain: lempar, tidak diulang
    return await res.text();
  }
  throw new Error(`gagal setelah retry: ${url}`);
}

// ---------- kandidat ----------
async function kandidat() {
  const si = JSON.parse(await get(`${BASE}/data/search-index.json`)).r;
  const sm = await get(`${BASE}/sitemap.xml`);
  const locs = [...sm.matchAll(/<loc>https:\/\/1001startup\.id([^<]*)<\/loc>/g)].map((m) => m[1]).filter((p) => !p.startsWith('/id/'));
  const chainSet = new Set(locs.filter((p) => /^\/chain\/[^/]+$/.test(p)).map((p) => p.slice(7)));
  const perusahaan = si.filter((r) => r[1] === 's' && (/^Climate & Sustainability/.test(r[2]) || ENERGI.test(`${r[0]} ${r[2]} ${r[5]}`)));
  const bumd = si.filter((r) => r[1] === 'r' && /^\/bumd\/[^#/]+$/.test(r[3]) && ENERGI_BUMD.test(r[0]));
  const dc = locs.filter((p) => /^\/data-center(\/[^/]+)?$/.test(p));
  return {
    perusahaan: perusahaan.map((r) => ({ slug: r[3], nama: r[0], sektor: r[2] })),
    chain: perusahaan.map((r) => r[3]).filter((s) => chainSet.has(s)),
    bumn: BUMN_ENERGI.filter((s) => locs.includes(`/bumn/${s}`)),
    bumd: [...new Set(bumd.map((r) => r[3].slice(6)))],
    dc, namaIndex: Object.fromEntries(si.map((r) => [r[3].replace(/^\/(bumn|bumd)[/#]/, ''), r[0]])),
  };
}

// ---------- main ----------
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const fileOf = (p) => path.join(RAW, p.replace(/^\//, '').replace(/\//g, '__') + '.html');
const writeAtomic = (f, s) => { fs.writeFileSync(f + '.tmp', s); fs.renameSync(f + '.tmp', f); };
const jsonl = (rows) => rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '');

async function main() {
  fs.mkdirSync(RAW, { recursive: true });
  const ckFile = path.join(OUT, 'checkpoint.json');
  const ck = fs.existsSync(ckFile) ? JSON.parse(fs.readFileSync(ckFile, 'utf8')) : { tanggal_ambil: {}, gagal: {} };
  let lastSave = 0;
  const save = (paksa) => { if (!paksa && Date.now() - lastSave < 10000) return; lastSave = Date.now(); writeAtomic(ckFile, JSON.stringify(ck)); };
  const today = new Date().toISOString().slice(0, 10);

  let kd;
  const kdFile = path.join(OUT, 'kandidat.json');
  if (args.parse && fs.existsSync(kdFile)) kd = JSON.parse(fs.readFileSync(kdFile, 'utf8'));
  else { kd = await kandidat(); writeAtomic(kdFile, JSON.stringify(kd, null, 1)); }
  let paths = [];
  if (args.hanya) {
    paths = [`/company/${args.hanya}`, ...(kd.chain.includes(args.hanya) ? [`/chain/${args.hanya}`] : [])];
  } else {
    paths = [...kd.perusahaan.map((c) => `/company/${c.slug}`), ...kd.chain.map((s) => `/chain/${s}`),
      ...kd.bumn.map((s) => `/bumn/${s}`), ...kd.bumd.map((s) => `/bumd/${s}`), ...kd.dc, '/chain/x/pln'];
  }
  console.log(`KANDIDAT: ${kd.perusahaan.length} profil, ${kd.chain.length} halaman chain, ${kd.bumn.length} BUMN, ${kd.bumd.length} BUMD, ${kd.dc.length} data-center; antrean awal ${paths.length} halaman (chain/x ditambah dinamis)`);
  if (args.daftar) { console.log(kd.perusahaan.map((c) => `${c.slug}\t${c.sektor}`).join('\n')); return; }

  const queue = [...paths]; const seen = new Set(queue);
  const pages = []; // {path, html}
  const xHint = /^x\//;
  while (queue.length) {
    const p = queue.shift();
    const f = fileOf(p);
    let html = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
    if (!html && !args.parse) {
      try { html = await get(BASE + p); } catch (e) { console.error(`  GAGAL ${p}: ${e.message}`); ck.gagal[p] = e.message; save(); continue; }
      if (html === null) { ck.gagal[p] = '404'; console.error(`  404 ${p}`); save(); continue; }
      writeAtomic(f, html); ck.tanggal_ambil[p] = today; save();
      console.log(`  ok ${p} (${html.length}) sisa ${queue.length}`);
    }
    if (!html) continue;
    pages.push({ p, html });
    const m = p.match(/^\/chain\/([^/]+)$/);
    if (m && !args.hanya) { // kutip pihak energi luar sensus dari rantai perusahaan energi
      for (const r of parseChain(html, m[1])) {
        const x = r.ke_slug && xHint.test(r.ke_slug) ? r.ke_slug : null;
        if (x && !seen.has(`/chain/${x}`) && (r.arah === 'pemasok' || ENERGI.test(r.ke_nama))) { seen.add(`/chain/${x}`); queue.push(`/chain/${x}`); }
      }
    }
  }
  save(true);

  // bangun ulang jsonl dari raw (tanpa duplikat, ilmu #13)
  const per = [], ikat = new Map();
  const add = (r, p) => { const k = [r.dari_slug, r.arah, r.ke_nama, r.sumber_url, r.relasi_teks].join('|');
    if (!ikat.has(k)) ikat.set(k, { ...r, url_halaman: BASE + p, tanggal_ambil: ck.tanggal_ambil[p] ?? null }); };
  const cmp = [], dilewati = [];
  for (const { p, html } of pages) {
    const base = { url_halaman: BASE + p, tanggal_ambil: ck.tanggal_ambil[p] ?? null };
    let m;
    if ((m = p.match(/^\/company\/(.+)$/))) {
      const co = parseCompany(html, m[1]);
      if (!/^Climate/.test(co.sektor || '') && !ENERGI_FILTER.test(`${co.nama} ${co.label_bidang}`)) { dilewati.push(m[1]); continue; } // salah cocok dari indeks
      per.push({ ...co, ...base });
      const rows = parseChain(html, m[1]); rows.forEach((r) => add(r, p));
      cmp.push({ slug: m[1], diurai: rows.length, header: chainHeader(html) });
    } else if ((m = p.match(/^\/chain\/x\/(.+)$/))) {
      per.push({ ...parseExternal(html, `x/${m[1]}`), ...base });
      parseChain(html, `x/${m[1]}`).forEach((r) => add(r, p));
    } else if ((m = p.match(/^\/chain\/([^/]+)$/))) {
      parseChain(html, m[1]).forEach((r) => add(r, p));
      cmp.push({ slug: `chain/${m[1]}`, diurai: parseChain(html, m[1]).length, header: chainHeader(html) });
    } else if ((m = p.match(/^\/bumn\/(.+)$/))) {
      per.push({ slug: `bumn/${m[1]}`, jenis_entitas: 'bumn', nama: kd.namaIndex[m[1]] ?? m[1], sektor: 'BUMN', sumber_url: [], ...base });
      parseBumn(html, m[1]).forEach((r) => add(r, p));
    } else if ((m = p.match(/^\/bumd\/(.+)$/))) {
      per.push({ slug: `bumd/${m[1]}`, jenis_entitas: 'bumd', nama: kd.namaIndex[m[1]] ?? m[1], sektor: 'BUMD', sumber_url: [], ...base });
    } else if ((m = p.match(/^\/data-center(?:\/(.+))?$/))) {
      const s = m[1] ?? 'index';
      per.push({ slug: `data-center/${s}`, jenis_entitas: 'data-center', nama: txt((html.match(/<a class="chip on"[^>]*>(.*?)<\/a>/s) || [])[1]) || s, sektor: 'Data center', sumber_url: [], ...base });
      parseDataCenter(html, s).forEach((r) => add(r, p));
    }
  }
  writeAtomic(path.join(OUT, 'perusahaan.jsonl'), jsonl(per));
  writeAtomic(path.join(OUT, 'ikatan.jsonl'), jsonl([...ikat.values()]));
  const bad = cmp.filter((c) => c.header != null && c.header !== c.diurai);
  console.log(`dilewati (bukan energi): ${dilewati.join(', ')}`);
  console.log(`SELESAI: ${per.length} entitas, ${ikat.size} ikatan, ${Object.keys(ck.gagal).length} gagal; hitungan chain tak cocok header: ${bad.length}`);
  bad.forEach((c) => console.log(`  TAK COCOK ${c.slug}: diurai ${c.diurai} vs header ${c.header}`));
}

// ---------- selftest ----------
function selftest() {
  assert.equal(isoDate('12 Aug 2022'), '2022-08-12');
  assert.equal(isoDate('Jun 2026'), '2026-06');
  assert.equal(isoDate('Read 2026-08-29'), '2026-08-29');
  assert.equal(dec('Arwana&#39;s &amp; co'), "Arwana's & co");
  const co = `<script type="application/ld+json">{"@type":"Organization","name":"X","legalName":"PT X","url":"https://x.com","logo":"https://l.png","numberOfEmployees":{"value":9},"founder":[{"name":"A B"}],"foundingDate":"2018"}</script>
<h1 class="cp-name">X</h1><div class="cp-legal">PT X</div><a class="cp-tag cp-sector" href="/s">Climate &amp; Sustainability</a><span class="cp-tag cp-rank">Census #48 of 558</span>
<p class="cp-what">solar leasing</p><p class="cp-sum">(updated 29 Oct 2026) deskripsi</p>
<div class="cp-fact"><dt class="cp-k">Disclosed funding</dt><dd class="cp-v"><span class="cp-u">US$</span> 88 <span class="cp-u">M</span><a class="cp-srcl" href="https://acv.vc/x">acv.vc</a></dd></div>
<div class="cp-fact"><dt class="cp-k">Output</dt><dd class="cp-v">IDR 74 bn <span class="cp-est">est</span></dd></div>
<div class="cp-fact"><dt class="cp-k">Where</dt><dd class="cp-v">Kebayoran Baru, Jakarta Selatan</dd></div>
<a class="cp-chip" href="/investor/a">East Ventures</a><span class="cp-srcu">https://x.com/a</span>
<div class="ch-cols"><div class="ch-hd">Suppliers<span>0</span></div><div class="ch-hd">Customers<span>1</span></div><div class="ch-g"><div class="ch-gh">Energy<span>1</span></div>
<div class="ch-r"><a class="ch-l" href="/chain/x/arwana"><span class="ch-nm">Arwana <em>outside the census</em></span><span class="ch-w">Supplies rooftop solar (4,554 panels, ~2.9 GWh a year) to plant</span></a><a class="ch-ev" href="https://x.com/n" title="q"><span class="ch-t ch-t-firstparty">first-party</span><span class="ch-h">x.com</span><span class="ch-d">12 Aug 2022</span></a></div></div></div>`;
  const c = parseCompany(co, 'x');
  assert.equal(c.peringkat_sensus, 48);
  assert.deepEqual(c.pendanaan_diumumkan, { nilai_usd_juta: 88, penanda_min: null, sumber_url: 'https://acv.vc/x' });
  assert.equal(c.kantor.kota, 'Jakarta Selatan');
  assert.equal(c.sensus_updated, '2026-10-29');
  assert.ok(!('logo' in c.json_ld));
  assert.equal(JSON.stringify(c).includes('74'), false, 'est tidak boleh bocor');
  const r = parseChain(co, 'x');
  assert.equal(r.length, 1);
  assert.equal(r[0].arah, 'pelanggan'); assert.equal(r[0].jenis, 'Energy'); assert.equal(r[0].ke_slug, 'x/arwana');
  assert.equal(r[0].status_sensus, 'outside'); assert.equal(r[0].besaran_teknis, '4,554 panels; ~2.9 GWh');
  assert.equal(r[0].label_bukti, 'first-party'); assert.equal(r[0].tanggal_dokumen, '2022-08-12');
  assert.equal(FORBIDDEN.test('/api/x') && FORBIDDEN.test('/map'), true);
  console.log('selftest OK');
}

if (args.selftest) selftest();
else if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
