#!/usr/bin/env node
// Entitas internasional (pengembang, pemasok, EPC, pendana, lembaga) yang tercatat di sumber METI. Node stdlib saja.
//   node scripts/pipa/data_internasional.mjs bukti      cocokkan CALON ke sumber berurl (tanpa jaringan) -> data/internasional/bukti.json
//   node scripts/pipa/data_internasional.mjs situs      baca beranda situs resmi (robots.txt, jeda >= 2,2 dtk, berhenti 403/429) -> data/internasional/situs.json
//   node scripts/pipa/data_internasional.mjs bangun     tulis data-panen/perusahaan/internasional.jsonl (dibaca potret.mjs)
//   node scripts/pipa/data_internasional.mjs --selftest
// Aturan: entitas tanpa sumber berurl TIDAK dibangun. Negara = inferensi (benih) sampai situs terbaca; situs wajib memuat nama.
// Tanpa LinkedIn/medsos/login/paywall; tanpa data pribadi; tanpa surel di UA.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { CALON, MULTI } from './internasional_seed.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const D = path.join(ROOT, 'data/internasional');
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const GAP = 2200;
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const norm = (s) => ' ' + String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);
const TGL = process.env.TGL || '2026-11-08'; // tanggal dari masukan, bukan jam (R12 §8.6)

export const parseCalon = () => CALON.trim().split('\n').map((l) => {
  const [nama, singkatan, iso, subjenis, tek, situs, pola, afil] = l.split('|');
  return { nama, singkatan, iso, subjenis, teknologi: tek.split(',').filter(Boolean).filter((x) => x !== 'multi'), situs, pola: pola.split(';').map(norm), afiliasi: (afil || '').split(';').filter(Boolean) };
});

// ---------- korpus bukti: {teks(norm), url, tanggal, tb, jenis, ket, proyek_id?} ----------
function korpus() {
  const k = []; const add = (teks, url, tanggal, tb, jenis, ket, extra = {}) => { if (/^https?:\/\//.test(url || '') && teks) k.push({ t: norm(teks), url, tanggal, tb, jenis, ket, ...extra }); };
  for (const b of J('public/data/berita.json').baris) add(b.judul, b.url, (b.terbit || b.tanggal_ambil || '').slice(0, 10) || TGL, 'media', 'berita', 'judul berita ' + b.media);
  const bid = new Map(J('public/data/berita.json').baris.map((b) => [b.id, b]));
  const rg = path.join(ROOT, 'data-panen/berita/ringkas.json');
  if (fs.existsSync(rg)) for (const [id, tx] of Object.entries(JSON.parse(fs.readFileSync(rg, 'utf8')))) { const b = bid.get(id); if (b) add(b.judul + ' ; ' + tx, b.url, (b.terbit || '').slice(0, 10) || TGL, 'media', 'berita', 'ringkasan berita ' + b.media); }
  for (const b of J('public/data/siaran_pers.json').baris) add(JSON.stringify([b.judul, b.ringkasan, b.isi, b.kategori]), b.url_sumber, b.tanggal, 'resmi', 'siaran-pers', 'siaran pers/liputan ' + (b.media || '') + ': ' + b.judul);
  for (const b of J('public/data/pustaka.json').baris) add([b.judul, b.penerbit, b.ringkasan, (b.poin_kunci || []).join(' ')].join(' ; '), b.url || b.url_sumber, b.tanggal, 'kata-pihak', 'pustaka', 'dokumen: ' + b.judul);
  for (const b of J('public/data/regulasi.json').baris) add([b.judul, b.ringkasan].join(' ; '), b.url_sumber, b.tanggal_ambil, 'resmi', 'regulasi', 'regulasi: ' + b.judul);
  for (const b of J('public/data/tkdn.json').baris) add([b.produsen, b.merk].join(' ; '), b.sumber_url, b.tanggal, 'resmi', 'tkdn', 'sertifikat TKDN Kemenperin: ' + b.produsen);
  for (const b of J('public/data/video.json').baris) add(b.judul, b.url, b.tanggal_ambil, 'media', 'video', 'video ' + b.kanal);
  const af = path.join(D, 'antara.json'); const KONTEKS_ID = /(indonesia|pertamina|\bpln\b|esdm|\bri\b|\bitb\b|barito|nusantara|jakarta|batam|jawa|sumatera|kalimantan|sulawesi|papua|bali)/i;
  if (fs.existsSync(af)) for (const rows of Object.values(JSON.parse(fs.readFileSync(af, 'utf8')).baris)) for (const r of rows) if (KONTEKS_ID.test(r.judul)) add(r.judul, r.url, r.tanggal, 'media', 'berita', 'judul berita Antara (pencarian)');
  const wf = path.join(D, 'wiki.json');
  if (fs.existsSync(wf)) for (const [h, tx] of Object.entries(JSON.parse(fs.readFileSync(wf, 'utf8')).halaman)) if (tx && !/^(Hydrogen_economy|Asia_Pacific)/.test(h)) for (const par of tx.split(/\n\n+/)) if (par.length > 40 && /(energy|power|solar|wind|geothermal|hydro|electric|renewable|battery|batteries|coal|nuclear|nickel|biofuel|biodiesel|hydrogen|lng|grid|turbine|jetp|loan|grant|fund|financ)/i.test(par)) add(par.replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1'), 'https://en.wikipedia.org/wiki/' + h, TGL, 'media', 'wikipedia', 'Wikipedia (CC BY-SA), artikel ' + h.replace(/_/g, ' ') + ', tentang Indonesia');
  const proyek = J('public/data/proyek.json').baris; const peta = new Map();
  for (const p of proyek) for (const s of p.sumber || []) if (/gem\.wiki/.test(s.url || '')) peta.set(s.url, p.id);
  for (const f of fs.readdirSync(path.join(ROOT, 'data/gem'))) {
    if (!f.endsWith('.json')) continue; const g = J('data/gem/' + f);
    for (const r of g.baris) {
      const nm = [...(r.pemilik || []), ...(r.operator || []), ...(r.pengembang || [])].map((x) => x.nama).join(' ; ');
      add(nm, r.url_wiki, TGL, 'kajian', 'gem', 'GEM ' + g.sumber + ' (' + g.rilis + '), pemilik/operator proyek ' + r.nama, { proyek_id: peta.get(r.url_wiki) });
    }
  }
  for (const p of proyek) for (const [kk, l] of Object.entries(p.pihak || {})) for (const v of l) { const s = (p.sumber || []).find((x) => x.id === v.sumber_id); add(v.nilai, s?.url, s?.tanggal || TGL, s?.tingkat_bukti || 'kajian', 'proyek', 'pihak ' + kk + ' pada ' + p.nama, { proyek_id: p.id }); }
  for (const b of J('public/data/pendanaan_internasional.json').baris) add([b.pemberi, b.penerima, b.nama, b.pelaksana].join(' ; '), b.sumber_url, b.tanggal, b.tingkat_bukti || 'kajian', 'pendanaan', 'pendanaan energi Indonesia: ' + b.nama, { proyek_id: b.proyek_id || undefined });
  for (const b of J('public/data/jetp_cipp.json').baris) add(JSON.stringify([b.pendana, b.pengembang, b.nama, b.deskripsi_singkat]), b.sumber_url, b.tanggal, b.tingkat_bukti, 'jetp', 'JETP/CIPP: ' + b.nama, { proyek_id: b.proyek_id || undefined });
  for (const b of J('public/data/karbon_proyek.json').baris) add([b.pengembang, b.nama].join(' ; '), b.sumber_url, b.tanggal, b.tingkat_bukti, 'karbon', 'proyek karbon ' + b.registri + ': ' + b.nama, { proyek_id: b.proyek_id || undefined });
  for (const b of J('public/data/obligasi_hijau.json').baris) add([b.penerbit, b.instrumen, b.catatan].join(' ; '), b.sumber_url, b.tanggal, b.tingkat_bukti, 'obligasi', 'obligasi hijau: ' + b.instrumen);
  for (const b of J('public/data/amdal.json').baris) add(b.pemrakarsa, b.sumber_url, b.tanggal, b.tingkat_bukti, 'amdal', 'pemrakarsa AMDAL ' + b.nama_kegiatan.slice(0, 80));
  for (const b of J('public/data/penyedia_teknologi.json').baris) add([b.nama, ...(b.produk_merek || [])].join(' ; '), b.sumber?.[0]?.url, b.sumber?.[0]?.tanggal || b.tanggal_periksa, b.sumber?.[0]?.tingkat_bukti || 'media', 'penyedia', 'penyedia teknologi: ' + b.nama);
  const tk = path.join(ROOT, 'data-panen/perusahaan/tambahan_tkdn.jsonl');
  if (fs.existsSync(tk)) for (const l of fs.readFileSync(tk, 'utf8').split('\n').filter(Boolean)) { const t = JSON.parse(l); add([t.perusahaan, t.merk].join(' ; '), t.sumber_url, t.tanggal, 'resmi', 'tkdn', 'sertifikat TKDN Kemenperin: ' + t.perusahaan); }
  for (const f of ['green_finance', 'jetp']) { const p = path.join(ROOT, 'data-panen/keuangan', f + '.jsonl'); if (fs.existsSync(p)) for (const l of fs.readFileSync(p, 'utf8').split('\n').filter(Boolean)) { const t = JSON.parse(l); add(JSON.stringify(t), t.sumber_url, t.tanggal, t.tingkat_bukti || 'kajian', 'keuangan', 'catatan keuangan ' + f); } }
  for (const o of J('public/data/organisasi.json').baris) for (const s of o.sumber || []) add(o.nama + ' ; ' + (o.induk || ''), s.url, s.tanggal || TGL, s.tingkat_bukti || 'kata-pihak', 'organisasi', 'direktori METI: ' + o.nama, { org_id: o.id });
  return k;
}

export function cocok(calon, k) {
  const out = [];
  for (const c of calon) {
    const hit = k.filter((e) => c.pola.some((p) => p.trim().length >= 3 && e.t.includes(p)));
    if (hit.length) out.push({ ...c, jumlah_bukti: hit.length, bukti: hit });
  }
  return out;
}
// pilih bukti beragam: satu per jenis dulu, maks 5 sumber unik
const pilih = (bukti) => { const seen = new Set(), jenis = new Set(), o = []; for (const b of [...bukti].sort((a, z) => (a.jenis === 'organisasi') - (z.jenis === 'organisasi'))) { if (seen.has(b.url) || jenis.has(b.jenis)) continue; seen.add(b.url); jenis.add(b.jenis); o.push(b); } for (const b of bukti) { if (o.length >= 5) break; if (!seen.has(b.url)) { seen.add(b.url); o.push(b); } } return o.slice(0, 5); };

function cmdBukti() {
  fs.mkdirSync(D, { recursive: true });
  const calon = parseCalon(); const k = korpus(); const m = cocok(calon, k);
  const hasil = m.map((c) => ({ nama: c.nama, jumlah_bukti: c.jumlah_bukti, jenis: [...new Set(c.bukti.map((b) => b.jenis))], proyek_ids: [...new Set(c.bukti.map((b) => b.proyek_id).filter(Boolean))].sort(), org_ids: [...new Set(c.bukti.map((b) => b.org_id).filter(Boolean))], bukti: pilih(c.bukti).map(({ t, ...b }) => b) }));
  const tanpa = calon.filter((c) => !m.some((x) => x.nama === c.nama)).map((c) => c.nama);
  fs.writeFileSync(path.join(D, 'bukti.json'), JSON.stringify({ dibangun: TGL, calon: calon.length, bersumber: hasil.length, tanpa_sumber: tanpa, baris: hasil }, null, 1) + '\n');
  console.log(`calon ${calon.length}, bersumber ${hasil.length}, tanpa sumber ${tanpa.length}`);
}

// ---------- situs ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const robotsCache = new Map();
async function bolehRobots(u) {
  const o = new URL(u); let r = robotsCache.get(o.origin);
  if (!r) {
    r = { all: false, dis: [] };
    try {
      const res = await fetch(o.origin + '/robots.txt', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000), redirect: 'follow' }); await sleep(GAP);
      if (res.status === 403 || res.status === 429) { r.stop = true; } else if (res.ok) {
        let cocokAgen = false; for (const line of (await res.text()).split('\n')) { const m = line.replace(/#.*/, '').trim().match(/^([a-z-]+)\s*:\s*(.*)$/i); if (!m) continue; const kk = m[1].toLowerCase(); if (kk === 'user-agent') cocokAgen = m[2].trim() === '*' || /meti/i.test(m[2]); else if (kk === 'disallow' && cocokAgen && m[2].trim()) r.dis.push(m[2].trim()); }
      }
    } catch { r.galat = true; }
    robotsCache.set(o.origin, r);
  }
  if (r.stop) return false;
  return !r.dis.some((d) => d === '/' || o.pathname.startsWith(d.replace(/\*.*$/, '')));
}
async function cmdSitus() {
  fs.mkdirSync(D, { recursive: true }); const f = path.join(D, 'situs.json');
  const lama = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { baris: {} };
  const b = JSON.parse(fs.readFileSync(path.join(D, 'bukti.json'), 'utf8')); const calon = new Map(parseCalon().map((c) => [c.nama, c]));
  const stop = new Set();
  for (const x of b.baris) {
    const c = calon.get(x.nama); if (!c.situs || lama.baris[x.nama]) continue;
    const host = new URL(c.situs).host; if (stop.has(host)) { lama.baris[x.nama] = { status: 'diblokir', alasan: 'host berhenti (403/429 sebelumnya)' }; continue; }
    let hasil;
    try {
      if (!(await bolehRobots(c.situs))) hasil = { status: 'diblokir', alasan: robotsCache.get(new URL(c.situs).origin)?.stop ? 'robots.txt 403/429' : 'robots.txt melarang' };
      else {
        const res = await fetch(c.situs, { headers: { 'User-Agent': UA, Accept: 'text/html' }, signal: AbortSignal.timeout(20000), redirect: 'follow' }); await sleep(GAP);
        if (res.status === 403 || res.status === 429) { stop.add(host); hasil = { status: 'diblokir', alasan: 'HTTP ' + res.status }; }
        else if (!res.ok) hasil = { status: 'gagal', alasan: 'HTTP ' + res.status };
        else { const h = (await res.text()).slice(0, 400000); const t = norm(h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')); const judul = (h.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.replace(/\s+/g, ' ').trim().slice(0, 120);
          const ok = c.pola.some((p) => t.includes(p)) || t.includes(norm(c.singkatan)); hasil = ok ? { status: 'ok', url_akhir: res.url, judul, tanggal: TGL } : { status: 'tak-memuat-nama', url_akhir: res.url, judul }; }
      }
    } catch (e) { hasil = { status: 'gagal', alasan: String(e.message || e).slice(0, 80) }; }
    lama.baris[x.nama] = hasil; fs.writeFileSync(f, JSON.stringify(lama, null, 1) + '\n'); console.error(x.nama, hasil.status);
  }
  fs.writeFileSync(f, JSON.stringify(lama, null, 1) + '\n');
}

// ---------- antara: judul berita Antara (robots.txt mengizinkan /search; jeda >= 2,2 dtk) untuk calon tanpa sumber ----------
const BULAN = { januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6, juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12 };
const KATA_ENERGI = /(energi|listrik|surya|angin|bayu|panas bumi|geotermal|pembangkit|plts|pltb|pltp|plta|hidrogen|baterai|investasi|pendanaan|hibah|pinjaman|kerja sama|kemitraan|jetp|transisi|karbon|kendaraan listrik|nikel|biodiesel|sampah|pabrik|modul)/i;
export function uraiAntara(html) {
  const out = []; const re = /<h2 class="h5"><a href="(https:\/\/www\.antaranews\.com\/berita\/[^"]+)" title="([^"]*)"[\s\S]*?<span class="text-dark text-capitalize">([^<]+)<\/span>/g;
  for (const m of html.matchAll(re)) { const d = m[3].trim().toLowerCase().match(/(\d{1,2}) ([a-z]+) (\d{4})/); out.push({ url: m[1], judul: m[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#0?39;/g, "'"), tanggal: d && BULAN[d[2]] ? `${d[3]}-${String(BULAN[d[2]]).padStart(2, '0')}-${d[1].padStart(2, '0')}` : TGL }); }
  return out;
}
async function cmdAntara() {
  const f = path.join(D, 'antara.json'); const lama = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { baris: {} };
  const b = JSON.parse(fs.readFileSync(path.join(D, 'bukti.json'), 'utf8')); const calon = parseCalon();
  const belum = calon.filter((c) => !b.baris.some((x) => x.nama === c.nama) && !lama.baris[c.nama]);
  if (!(await bolehRobots('https://www.antaranews.com/search?q=x'))) { console.error('robots melarang'); return; }
  for (const c of belum) {
    const q = encodeURIComponent(c.nama.replace(/\(.*?\)/g, '').trim() + ' energi');
    try {
      const res = await fetch('https://www.antaranews.com/search?q=' + q, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) }); await sleep(GAP);
      if (res.status === 403 || res.status === 429) { console.error('berhenti HTTP', res.status); break; }
      if (!res.ok) { lama.baris[c.nama] = []; continue; }
      lama.baris[c.nama] = uraiAntara(await res.text()).filter((r) => c.pola.some((p) => norm(r.judul).includes(p)) && KATA_ENERGI.test(r.judul));
    } catch (e) { console.error(c.nama, e.message); continue; }
    fs.writeFileSync(f, JSON.stringify(lama, null, 1) + '\n'); console.error(c.nama, lama.baris[c.nama].length);
  }
  fs.writeFileSync(f, JSON.stringify(lama, null, 1) + '\n');
}

// ---------- wiki: artikel Wikipedia tentang energi Indonesia lewat /wiki/Judul?action=raw (jalur yang dibolehkan robots.txt) ----------
const HALAMAN_WIKI = ['Geothermal_power_in_Indonesia', 'Wind_power_in_Indonesia', 'Solar_power_in_Indonesia', 'Renewable_energy_in_Indonesia', 'Electricity_sector_in_Indonesia', 'Energy_in_Indonesia', 'Hydroelectric_power_in_Indonesia', 'Just_Energy_Transition_Partnership', 'Cirata_Floating_Solar_Power_Station', 'Sidrap_Wind_Farm', 'Sarulla_Geothermal_Power_Station', 'Wayang_Windu_Geothermal_Power_Station', 'Salak_Geothermal_Power_Station', 'Darajat_Geothermal_Power_Station', 'Dieng_Geothermal_Power_Station', 'Patuha_Geothermal_Power_Station', 'Muara_Laboh_Geothermal_Power_Station', 'Rantau_Dedap_Geothermal_Power_Station', 'Sorik_Marapi_Geothermal_Power_Station', 'List_of_power_stations_in_Indonesia', 'Coal_in_Indonesia', 'Nuclear_power_in_Indonesia', 'Batang_Toru_Hydroelectric_Power_Plant', 'Upper_Cisokan_Pumped_Storage_Power_Station', 'Indonesia_Morowali_Industrial_Park', 'Indonesia_Battery_Corporation', 'Biofuel_in_Indonesia', 'Electric_vehicle_industry_in_Indonesia', 'Perusahaan_Listrik_Negara', 'Pertamina', 'Pertamina_Geothermal_Energy', 'Medco_Energi', 'Star_Energy_Geothermal', 'Paiton_Power_Station', 'Cirebon_Power_Station', 'Tanjung_Jati_B_Power_Station', 'Suralaya_Power_Station', 'Celukan_Bawang_Power_Station', 'Jawa_Power_Station', 'Tangguh_LNG', 'Donggi-Senoro_LNG', 'Weda_Bay_Industrial_Park', 'Vale_Indonesia', 'Freeport-McMoRan', 'Bintan_Industrial_Estate', 'Batam', 'Danantara', 'Indonesia_Investment_Authority', 'Java-Bali_Power_Grid', 'Pertamina_Energy_Tower', 'Muara_Karang_Power_Station', 'Gresik_Power_Station', 'Indonesia%E2%80%93Japan_relations', 'Indonesia%E2%80%93South_Korea_relations', 'Indonesia%E2%80%93China_relations', 'Indonesia%E2%80%93Singapore_relations', 'Indonesia%E2%80%93Germany_relations', 'Indonesia%E2%80%93United_States_relations', 'Nickel_industry_in_Indonesia', 'Energy_policy_of_Indonesia', 'Indonesia_Power', 'Pembangkitan_Jawa-Bali'];
async function cmdWiki() {
  const f = path.join(D, 'wiki.json'); const lama = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { halaman: {} };
  if (!(await bolehRobots('https://en.wikipedia.org/wiki/X?action=raw'))) { console.error('robots melarang'); return; }
  for (const h of HALAMAN_WIKI) {
    if (lama.halaman[h] !== undefined) continue; const u = 'https://en.wikipedia.org/wiki/' + h + '?action=raw';
    try { const res = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) }); await sleep(GAP);
      if (res.status === 403 || res.status === 429) { console.error('berhenti HTTP', res.status); break; }
      lama.halaman[h] = res.ok ? (await res.text()).replace(/\{\{[^{}]*\}\}/g, ' ').slice(0, 300000) : null; console.error(h, res.status);
    } catch (e) { console.error(h, e.message); }
    fs.writeFileSync(f, JSON.stringify(lama)); }
  fs.writeFileSync(f, JSON.stringify(lama));
}

// ---------- bangun ----------
function cmdBangun() {
  const b = JSON.parse(fs.readFileSync(path.join(D, 'bukti.json'), 'utf8')); const calon = new Map(parseCalon().map((c) => [c.nama, c]));
  const sf = path.join(D, 'situs.json'); const situs = fs.existsSync(sf) ? JSON.parse(fs.readFileSync(sf, 'utf8')).baris : {};
  const orgs = J('public/data/organisasi.json').baris; const idNama = new Map(orgs.map((o) => [norm(o.nama), o]));
  const rows = [];
  for (const x of b.baris) {
    const c = calon.get(x.nama); const s = situs[x.nama]; const sOk = s?.status === 'ok';
    const kunci = norm(c.nama);
    const multi = MULTI.has(c.iso);
    const afil = c.afiliasi.map((n) => idNama.get(norm(n))).filter(Boolean).map((o) => ({ organisasi_id: o.id, nama: o.nama }));
    const sumber = x.bukti.map((e, i) => ({ id: 'b' + (i + 1) + '-' + e.jenis, url: e.url, keterangan: e.ket, tanggal_periksa: TGL, tingkat_bukti: e.tb === 'resmi' ? 'resmi' : e.tb || 'kajian' }));
    if (sOk) sumber.push({ id: 'situs', url: c.situs, keterangan: 'situs resmi, beranda terbaca dan memuat nama', tanggal_periksa: TGL, tingkat_bukti: 'kata-pihak' });
    sumber.push({ id: 'benih', url: null, keterangan: 'negara markas dan subjenis: pengetahuan peneliti METI (inferensi)', tanggal_periksa: TGL, tingkat_bukti: 'inferensi' });
    rows.push({ perusahaan_id: 'in_' + sha(kunci), batch: 8, nama: c.nama, nama_lain: [...new Set([c.singkatan, ...x.bukti.length ? [] : []].filter((n) => n && norm(n) !== kunci))], jenis: 'asing', internasional: { subjenis: c.subjenis, negara: multi ? null : c.iso, markas: c.iso, multilateral: multi || undefined, afiliasi: afil.length ? afil : undefined },
      induk: null, kepakaran: c.teknologi.slice(0, 3), peran_rantai: [c.subjenis], kantor_pusat: { kota: null, provinsi: null }, situs: sOk ? c.situs : null, tahun_berdiri: null, proyek: [], proyek_ids: x.proyek_ids, kode_saham: null,
      sumber, sumber_field: { nama: 'b1-' + x.bukti[0].jenis, kantor_pusat: 'benih' }, verifikasi: { situs_ok: sOk, http: sOk ? 200 : null, judul: s?.judul || null, tanggal_periksa: s?.tanggal || null }, pengurus_status: 'tidak-dibaca' });
  }
  const f = path.join(ROOT, 'data-panen/perusahaan/internasional.jsonl'); fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, rows.map((r) => JSON.stringify(r)).join('\n') + '\n'); console.log('ditulis', rows.length, f);
}

function selftest() {
  const k = [{ t: norm('Kansai Electric Power Co'), url: 'https://x.test/a', tanggal: TGL, tb: 'kajian', jenis: 'gem', ket: 'k' }];
  const m = cocok(parseCalon().filter((c) => /Kansai/.test(c.nama)), k); assert.equal(m.length, 1);
  assert.equal(cocok(parseCalon().filter((c) => c.nama === 'Eni'), [{ t: norm('Engineering'), url: 'https://x', jenis: 'x' }]).length, 0); // kata utuh, bukan potongan
  assert(parseCalon().every((c) => c.nama && c.iso && c.subjenis && c.pola.length));
  assert(parseCalon().every((c) => ['pengembang', 'pemasok', 'EPC', 'pendana', 'lembaga'].includes(c.subjenis)));
  console.log('selftest ok');
}
const cmd = process.argv[2];
if (cmd === '--selftest') selftest(); else if (cmd === 'bukti') cmdBukti(); else if (cmd === 'situs') await cmdSitus(); else if (cmd === 'wiki') await cmdWiki(); else if (cmd === 'antara') await cmdAntara(); else if (cmd === 'bangun') cmdBangun(); else console.log('pakai: bukti | situs | bangun | --selftest');
