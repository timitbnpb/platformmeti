#!/usr/bin/env node
// Panen lanjutan R25: proyek tambahan, orang tambahan (DPR Komisi XII, rotasi BUMN), inovasi. Node stdlib saja.
//   node panen_lanjutan.mjs --selftest
//   node panen_lanjutan.mjs --dprwiki        anggota Komisi XII dari Wikipedia id (dpr.go.id /gql butuh autentikasi, /api/ dilarang robots) -> orang/tambahan_dpr.jsonl
//   node panen_lanjutan.mjs --kurasi         baris kurasi tangan dari halaman raw/ (WKP 2025, JICA, rotasi PLN/Pertamina, lomba, BRIN)
//   node panen_lanjutan.mjs --wb             proyek energi Indonesia Bank Dunia (API terbuka) -> proyek/tambahan_worldbank.jsonl
//   node panen_lanjutan.mjs --url=URL        ambil satu URL ke raw/ (robots + jeda), untuk eksplorasi
//   node panen_lanjutan.mjs --semua          jalankan semua tahap yang terdaftar
// Aturan (AGENTS.md section 9, pipa.md): UA jujur, jeda >= 2 dtk, robots dicek, tanpa login/formulir/CAPTCHA,
// baris tanpa sumber ditolak, hanya jabatan publik. Keluaran di data-panen/ (di luar repo).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const GAP_MS = 2200;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DP = path.join(ROOT, 'data-panen');
const RAW = path.join(DP, 'lanjutan/raw');
const HARI_INI = process.env.TANGGAL_AMBIL || new Date().toISOString().slice(0, 10);
const arg = (k) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const flag = (k) => process.argv.includes(`--${k}`);

// ---------- jaringan sopan ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let terakhir = 0;
const robotsCache = new Map();
async function jeda() { const t = Date.now() - terakhir; if (t < GAP_MS) await sleep(GAP_MS - t); terakhir = Date.now(); }
export function robotsBolehDari(teks, p) {
  let agen = false; const dis = [];
  for (const g of String(teks).split(/\r?\n/)) {
    const l = g.replace(/#.*/, '').trim(); const m = l.match(/^([a-z-]+)\s*:\s*(.*)$/i); if (!m) continue;
    const k = m[1].toLowerCase();
    if (k === 'user-agent') agen = m[2].trim() === '*';
    else if (agen && k === 'disallow' && m[2].trim()) dis.push(m[2].trim());
    else if (agen && k === 'allow' && m[2].trim() && p.startsWith(m[2].trim())) return true;
  }
  return !dis.some((d) => p.startsWith(d));
}
async function robotsBoleh(u) {
  const x = new URL(u);
  if (!robotsCache.has(x.origin)) {
    await jeda();
    try { const r = await fetch(x.origin + '/robots.txt', { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
      robotsCache.set(x.origin, r.ok && /text|plain/.test(r.headers.get('content-type') || 'text/plain') ? await r.text() : ''); }
    catch { robotsCache.set(x.origin, ''); }
  }
  return robotsBolehDari(robotsCache.get(x.origin), x.pathname + x.search);
}
export const slug = (u) => u.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 120);
// ambil(url, {json, post, cacheKey}) -> teks | null (null = ditolak robots atau gagal; alasan di LOG)
export const LOG = [];
async function ambil(u, o = {}) {
  fs.mkdirSync(RAW, { recursive: true });
  const f = path.join(RAW, (o.cacheKey || slug(u)) + (o.json ? '.json' : '.html'));
  if (fs.existsSync(f) && !flag('segar')) return fs.readFileSync(f, 'utf8');
  if (!(await robotsBoleh(u))) { LOG.push({ url: u, hasil: 'ditolak-robots' }); return null; }
  await jeda();
  try {
    const r = await fetch(u, { method: o.body ? 'POST' : 'GET', headers: { 'user-agent': UA, accept: o.json ? 'application/json' : 'text/html,*/*', ...(o.body ? { 'content-type': 'application/json', origin: new URL(u).origin } : {}) },
      body: o.body, redirect: 'follow', signal: AbortSignal.timeout(45000) });
    const t = await r.text();
    if (!r.ok) { LOG.push({ url: u, hasil: 'http-' + r.status }); return null; }
    fs.writeFileSync(f, t); return t;
  } catch (e) { LOG.push({ url: u, hasil: 'gagal:' + e.message }); return null; }
}
const tulisJsonl = (rel, rows) => { const f = path.join(DP, rel); fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '')); return rows.length; };
const teks = (h) => String(h).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d)>/gi, '\n')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

// ---------- nama ----------
const GELAR = /\b(prof|drg|komjen|pol|dr|drs|dra|ir|h|hj|kh|dipl|ing|se|sh|st|mt|mm|mba|msc|ma|map|mh|mkn|sip|ssi|ssos|spd|sag|sk|sm|mpd|phd|llm|ak|ca|cfa|mbus|meng|mp|msi|mtp|ssn|stp|sstp|mse|mcom|cpa|bsc|bba|mpa|mem|s1|s2|s3)\b/gi;
export function kunciNama(nama) {
  return nama.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/,.*$/, '').replace(/\./g, ' ').replace(GELAR, ' ').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
export function pisahGelar(raw) {
  const t = raw.replace(/\s+/g, ' ').trim(); const [nama, ...sisa] = t.split(',');
  const dep = (nama.match(/^((?:(?:Prof|Dr|Drs|Dra|drg|Ir|H|Hj|KH|Ing|Eng)\.?\s+)+)/i) || [])[1] || '';
  const gelar = (dep.trim() + (sisa.length ? ', ' + sisa.join(',').trim() : '')).replace(/^,\s*/, '').trim();
  return { nama: nama.slice(dep.length).trim(), gelar: gelar || undefined };
}
export const idOrang = (kunci) => 'o_' + crypto.createHash('sha1').update(kunci).digest('hex').slice(0, 10);

// ---------- DPR Komisi XII (GraphQL publik situs dpr.go.id, query sama dengan yang dipakai halamannya) ----------
const GQL = 'https://www.dpr.go.id/gql';
const Q_AKD = 'query($first:Int!){getDaftarAkd(first:$first,where:{column:STATUS operator:EQ value:"1"}){data{id akd}}}';
const Q_ANGGOTA = `query($page:Int,$first:Int!,$where:QueryGetDaftarRiwayatAnggotaWhereWhereConditions,$wherePeriode:QueryGetDaftarRiwayatAnggotaWherePeriodeWhereHasConditions,$whereAkd:QueryGetDaftarRiwayatAnggotaWhereAkdWhereHasConditions){
 getDaftarRiwayatAnggota(page:$page,first:$first,wherePeriode:$wherePeriode,whereAkd:$whereAkd,where:$where){
  paginatorInfo{lastPage total} data{idPeriode noAnggota dapil{id dapil} anggota{nama id photofileLink}
   riwayatFraksi{idFraksi fraksi{fraksi singkatan}} daftarRiwayatAkd(where:{column:STATUS value:1 operator:EQ},orderBy:{column:ID_AKD order:ASC}){idAkd akd{akd} posisi{data}}}}}`;
const gql = async (query, variables, key) => { const t = await ambil(GQL, { json: true, body: JSON.stringify({ query, variables }), cacheKey: key }); return t ? JSON.parse(t) : null; };

export function barisDpr(d, akdId) {
  const a = d.anggota || {}; const { nama, gelar } = pisahGelar(a.nama || '');
  const ra = (d.daftarRiwayatAkd || []).find((x) => String(x.idAkd) === String(akdId));
  const posisi = ra?.posisi?.data || 'Anggota';
  const fr = d.riwayatFraksi?.[0]?.fraksi || d.riwayatFraksi?.fraksi || {};
  return { nama, gelar, posisi, fraksi: fr.singkatan || fr.fraksi || null, dapil: d.dapil?.dapil || null, noAnggota: d.noAnggota, idDpr: a.id, foto: a.photofileLink || null };
}
async function dpr() {
  const ak = await gql(Q_AKD, { first: 60 }, 'dpr_akd');
  const komisi = ak?.data?.getDaftarAkd?.data?.find((x) => /^komisi\s*xii$/i.test(x.akd.trim()));
  if (!komisi) { console.log('Komisi XII tidak ditemukan', JSON.stringify(ak)?.slice(0, 300)); return; }
  const semua = []; let hal = 1, akhir = 1;
  do {
    const r = await gql(Q_ANGGOTA, { page: hal, first: 30, wherePeriode: { column: 'ID', operator: 'EQ', value: 6 }, whereAkd: { AND: [{ column: 'ID_AKD', operator: 'EQ', value: +komisi.id }, { column: 'STATUS', operator: 'EQ', value: 1 }] }, where: { AND: [{ column: 'STATUS_OFF', operator: 'EQ', value: 'Dalam masa jabatan' }] } }, `dpr_k12_${hal}`);
    const g = r?.data?.getDaftarRiwayatAnggota; if (!g) { console.log('gagal hal', hal, JSON.stringify(r)?.slice(0, 300)); break; }
    akhir = g.paginatorInfo.lastPage; semua.push(...g.data); hal++;
  } while (hal <= akhir);
  const src = 'https://www.dpr.go.id/tentang-dpr/informasi-anggota-dewan';
  const rows = [];
  for (const d of semua) {
    const b = barisDpr(d, komisi.id); if (!b.nama) continue;
    rows.push({ orang_id: idOrang(kunciNama(b.nama)), nama: b.nama, gelar: b.gelar, jenis: 'anggota-dpr', status: 'menjabat',
      jabatan: `${b.posisi} Komisi XII`, organisasi: 'DPR RI Komisi XII', fraksi: b.fraksi, dapil: b.dapil, no_anggota: b.noAnggota,
      mulai: '2024-10', selesai: null, foto_url: b.foto, foto_atribusi: 'Foto: dpr.go.id (Sekretariat Jenderal DPR RI), dipakai dengan atribusi',
      sumber_url: src, tanggal_sumber: null, tanggal_ambil: HARI_INI, tingkat_bukti: 'resmi' });
  }
  console.log('dpr:', tulisJsonl('orang/tambahan_dpr.jsonl', rows), 'anggota; total situs', semua.length);
}


// ---------- tabel wikitable (Wikipedia, CC BY-SA 4.0) ----------
export function tabelWiki(h) {
  return [...h.matchAll(/<table[^>]*wikitable[\s\S]*?<\/table>/g)].map((m) => [...m[0].matchAll(/<tr[\s\S]*?<\/tr>/g)]
    .map((r) => [...r[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => c[1].replace(/<sup[\s\S]*?<\/sup>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#\d+;|&nbsp;/g, ' ').replace(/\s+/g, ' ').trim())));
}
const FRAKSI = { 'partai golongan karya': 'Golkar', 'partai demokrasi indonesia perjuangan': 'PDI Perjuangan', 'partai gerakan indonesia raya': 'Gerindra', 'partai nasdem': 'NasDem',
  'partai nasional demokrat': 'NasDem', 'partai kebangkitan bangsa': 'PKB', 'partai keadilan sejahtera': 'PKS', 'partai amanat nasional': 'PAN', 'partai demokrat': 'Demokrat' };
async function dprwiki() {
  const u = 'https://id.wikipedia.org/wiki/Komisi_XII_Dewan_Perwakilan_Rakyat_Republik_Indonesia';
  const h = await ambil(u); if (!h) return;
  const t = tabelWiki(h).find((x) => x[0]?.includes('Dapil'));
  const rows = (t || []).slice(1).filter((r) => r[1]).map((r) => { const { nama, gelar } = pisahGelar(r[1]);
    return { orang_id: idOrang(kunciNama(nama)), nama, gelar, jenis: 'anggota-dpr', status: 'menjabat', jabatan: `${r[2] === 'Anggota' ? 'Anggota' : r[2]} Komisi XII`,
      organisasi: 'DPR RI Komisi XII', fraksi: FRAKSI[r[3].toLowerCase()] || r[3], dapil: r[4] || null, catatan: r[5] || undefined, mulai: '2024-10', selesai: null,
      sumber_url: u, tanggal_sumber: null, tanggal_ambil: HARI_INI, tingkat_bukti: 'media',
      lisensi: 'CC BY-SA 4.0', catatan_sumber: 'Wikipedia id; dpr.go.id/gql menolak tanpa autentikasi dan /api/ dilarang robots.txt, jadi tidak dipakai; foto tidak diambil' }; });
  console.log('dprwiki:', tulisJsonl('orang/tambahan_dpr.jsonl', rows));
}

// ---------- Bank Dunia (API terbuka, CC BY 4.0) ----------
const WB = 'https://search.worldbank.org/api/v2/projects?format=json&countrycode_exact=ID&fl=id,project_name,totalcommamt,boardapprovaldate,closingdate,status,sector,mjsector_namecode,lendinginstr,borrower,impagency,url,project_abstract,regionname,countryname,theme_namecode,sector1,sector2,sector3,envassesmentcategorycode&rows=100&os=';
const ENERGI = /energy|power|electric|geotherm|solar|renewable|hydro|wind|biomass|grid|transmission|clean air|coal|\bPLN\b|rooftop|storage|battery|decarbon/i;
function teknologiDari(s) {
  const t = s.toLowerCase();
  if (/geotherm/.test(t)) return 'panas-bumi'; if (/solar|photovolt|rooftop/.test(t)) return 'surya'; if (/wind|bayu/.test(t)) return 'bayu';
  if (/hydro|hidro/.test(t)) return 'hidro'; if (/biomass|waste.to|bioenergy|biogas/.test(t)) return 'bioenergi'; if (/storage|battery|pumped/.test(t)) return 'penyimpanan';
  return null;
}
async function wb() {
  const all = []; let os = 0, total = Infinity;
  while (os < total) {
    const t = await ambil(WB + os, { json: true, cacheKey: 'wb_' + os }); if (!t) break;
    const j = JSON.parse(t); total = +j.total; for (const p of Object.values(j.projects || {})) all.push(p); os += 100;
  }
  const rows = [];
  for (const p of all) {
    const sek = (p.sector || []).map((x) => x.Name).filter(Boolean);
    const mj = (p.mjsector_namecode || []).map((x) => x.name);
    const nm = p.project_name.replace(/empower\w*|manpower/gi, ' ');
    const energi = mj.includes('Energy and Extractives') || sek.some((x) => /energy|power|geotherm|hydro|electric|solar|wind/i.test(x)) || (!sek.length && /\b(power|electrif\w*|geotherm\w*|hydroelectric|energy|solar|renewable)\b/i.test(nm));
    if (!energi || /coal (mining|exploration)|gas (distribution|utilization)|domestic gas|EITI|childcare|ERP|Enterprise Resource/i.test(nm)) continue;
    const blob = nm + ' ' + sek.join(' ');
    const tgl = (s) => (s ? String(s).slice(0, 10) : null);
    const closing = p.closingdate ? new Date(p.closingdate) : null;
    const status = { Active: 'konstruksi', Pipeline: 'rencana', Closed: 'beroperasi', Dropped: 'dibatalkan' }[p.status] || null;
    rows.push({ id: 'wb_' + p.id, nama: p.project_name, teknologi: /DPL|Development Policy|Empower/i.test(nm) ? null : teknologiDari(blob), sumber_jenis: 'pembiayaan-multilateral', pemberi_dana: 'Bank Dunia (IBRD/IDA)',
      peminjam: p.borrower || null, lembaga_pelaksana: p.impagency || null, nilai_komitmen_usd: p.totalcommamt ? +String(p.totalcommamt).replace(/,/g, '') : null,
      instrumen: p.lendinginstr || null, tanggal_persetujuan: tgl(p.boardapprovaldate), tanggal_penutupan: closing && !isNaN(closing) ? closing.toISOString().slice(0, 10) : null,
      status_asli: p.status || null, status, tujuan: (p.project_abstract?.cdata || '').slice(0, 400) || null, sektor_wb: sek, provinsi: null,
      sumber_url: p.url || `https://projects.worldbank.org/en/projects-operations/project-detail/${p.id}`, sumber_api: 'https://search.worldbank.org/api/v2/projects',
      lisensi: 'CC BY 4.0', tanggal_ambil: HARI_INI, tingkat_bukti: 'resmi', publik: true });
  }
  console.log('wb: total proyek ID', all.length, 'energi', tulisJsonl('proyek/tambahan_worldbank.jsonl', rows));
}

// ---------- kurasi tangan dari halaman yang SUDAH diambil ke raw/ (tiap baris menunjuk URL sumbernya) ----------
// Isi dibaca dari halaman berikut pada 7 Nov 2026; angka di luar halaman tidak ditambahkan.
const U_KONTAN = 'https://industri.kontan.co.id/news/investasi-capai-us-199-miliar-kementerian-esdm-lelang-3-wkp-panas-bumi-dan-7-psp';
const U_CNBC = 'https://www.cnbcindonesia.com/news/20250917184934-4-667921/bahlil-lelang-10-wilayah-panas-bumi-ri-tahun-2025-ini-daftarnya';
const U_JICA = 'https://www.jica.go.jp/english/information/press/2025/20260330_11.html';
const U_PLN25 = 'https://investortrust.id/business/69914/pln-ubah-susunan-direksi-dan-komisaris-di-rupslb-dirut-dan-komut-tetap';
const U_PLN26 = 'https://katadata.co.id/berita/energi/6acfaa041ad97/darmawan-prasodjo-diganti-suroso-isnandar-jadi-dirut-baru-pln';
const U_PTM = 'https://www.antaranews.com/berita/4897085/jajaran-komisaris-dan-direksi-baru-pertamina-usai-rups-juni-2025';
const U_TGE = 'https://www.thinkgeoenergy.com/indonesias-geothermal-fertiliser-project-wins-asean-award/';
const U_BRIN = 'https://www.brin.go.id/news/130964/brin-dan-swinburne-kembangkan-riset-daur-ulang-limbah-panel-surya';
const WKP = [['Danau Ranau', 'Lampung', 40, 'WKP'], ['Telaga Ranau', 'Maluku Utara', 40, 'WKP'], ['Songgoriti', 'Jawa Timur', 40, 'WKP'],
  ['Bandar Baru Sepa', 'Maluku', '25-40', 'PSPE'], ['Jenawi', 'Jawa Tengah', 86, 'PSPE'], ['Gunung Tampomas', 'Jawa Barat', 30, 'PSPE'], ['Kadidia', 'Sulawesi Tengah', 40, 'PSPE'],
  ['Cubudak-Panti', 'Sumatera Barat', 40, 'PSPE'], ['Cisurupan Kertasari', 'Jawa Barat', 20, 'PSPE'], ['Tuang', 'Sulawesi Selatan', 20, 'PSPE']];
const dasar = (u, bukti) => ({ sumber_url: u, tanggal_ambil: HARI_INI, tingkat_bukti: bukti, publik: true });
const org = (id, nama, jabatan, organisasi, mulai, selesai, status, u, cat) => ({ orang_id: idOrang(kunciNama(nama)), nama, jenis: 'direksi-komisaris-bumn', status, jabatan, organisasi, mulai, selesai, ...dasar(u, 'media'), catatan: cat });
function kurasi() {
  const proyek = WKP.map(([n, prov, mw, jenis]) => ({ id: 'wkp25_' + n.toLowerCase().replace(/[^a-z]+/g, '_'), nama: `${jenis === 'WKP' ? 'WKP' : 'PSPE'} panas bumi ${n}`, teknologi: 'panas-bumi', provinsi: prov, jenis_wilayah: jenis,
    kapasitas: { nilai: mw, satuan: 'MW', catatan: n === 'Jenawi' ? 'rencana awal sekitar 55 MW' : 'potensi menurut paparan Ditjen EBTKE' }, status: 'rencana', status_asli: 'dilelang (dibuka 17 Sep 2025, daring lewat platform GENESIS)',
    pemenang: null, catatan: 'pemenang belum ditemukan di sumber publik per 7 Nov 2026; WKP masuk hitungan RUPTL 2025-2034 menurut Dirjen EBTKE', ...dasar(U_KONTAN, 'media'), sumber_pendukung: [U_CNBC] }));
  proyek.push({ id: 'jica_hululais', nama: 'PLTP Hululais (dua pembangkit, transmisi, gardu induk)', teknologi: 'panas-bumi', provinsi: 'Bengkulu', pemberi_dana: 'JICA (pinjaman ODA Jepang)',
    nilai_komitmen_yen_juta: 29156, bunga: '0,3% proyek, 0,01% konsultan', tanggal_persetujuan: '2026-03-30', status: 'rencana', status_asli: 'perjanjian pinjaman ditandatangani 2026-03-30', instansi_pelaksana: 'tidak disebut di cuplikan', catatan: 'sub-proyek Geothermal Development Acceleration Program (E/N 2011); lingkup A pembangkit, B transmisi dan distribusi, C jasa konsultan', ...dasar(U_JICA, 'resmi') });
  const rot = [
    org(0, 'Bambang Eko Suhariyanto', 'Komisaris', 'PT PLN (Persero)', '2025-06-18', null, 'menjabat', U_PLN25, 'RUPSLB 18 Jun 2025, menggantikan Susiwijono Moegiarso'),
    org(0, 'Susiwijono Moegiarso', 'Komisaris', 'PT PLN (Persero)', null, '2025-06-18', 'selesai', U_PLN25, 'diberhentikan dengan hormat, RUPSLB 18 Jun 2025'),
    org(0, 'Edwin Nugraha Putra', 'Direktur Transmisi dan Perencanaan Sistem', 'PT PLN (Persero)', '2025-06-18', null, 'menjabat', U_PLN25, 'RUPSLB 18 Jun 2025'),
    org(0, 'Rizal Calvary Marimbo', 'Direktur Manajemen Pembangkitan', 'PT PLN (Persero)', '2025-06-18', null, 'menjabat', U_PLN25, 'RUPSLB 18 Jun 2025'),
    org(0, 'Arsyadany Ghana Akmalaputri', 'Direktur Distribusi', 'PT PLN (Persero)', '2025-06-18', null, 'menjabat', U_PLN25, 'RUPSLB 18 Jun 2025'),
    org(0, 'Edi Srimulyanti', 'Direktur Retail dan Niaga', 'PT PLN (Persero)', null, '2025-06-18', 'selesai', U_PLN25, 'diberhentikan dengan hormat, RUPSLB 18 Jun 2025'),
    org(0, 'Wiluyo Kusdwiharto', 'Direktur Manajemen Proyek dan Energi Baru Terbarukan', 'PT PLN (Persero)', null, '2025-06-18', 'selesai', U_PLN25, 'diberhentikan dengan hormat, RUPSLB 18 Jun 2025'),
    org(0, 'Suroso Isnandar', 'Direktur Utama', 'PT PLN (Persero)', '2026-10-14', null, 'menjabat', U_PLN26, 'RUPS 14 Okt 2026 menurut Komisaris Independen PLN kepada Katadata; sebelumnya Direktur Manajemen Proyek dan EBT, masih merangkap sampai ada pengganti; perlu dicek ke pengumuman resmi PLN'),
    org(0, 'Darmawan Prasodjo', 'Direktur Utama', 'PT PLN (Persero)', '2021-12', '2026-10-14', 'selesai', U_PLN26, 'diganti RUPS 14 Okt 2026 menurut Katadata; perlu dicek ke pengumuman resmi PLN'),
    org(0, 'Oki Muraza', 'Wakil Direktur Utama', 'PT Pertamina (Persero)', '2025-06-12', null, 'menjabat', U_PTM, 'RUPS 12 Jun 2025, menggantikan Wiko Migantoro'),
    org(0, 'Wiko Migantoro', 'Wakil Direktur Utama', 'PT Pertamina (Persero)', null, '2025-06-12', 'selesai', U_PTM, 'digantikan Oki Muraza, RUPS 12 Jun 2025'),
    org(0, 'Todotua Pasaribu', 'Wakil Komisaris Utama', 'PT Pertamina (Persero)', '2025-06-12', null, 'menjabat', U_PTM, 'formasi komisaris per 12 Jun 2025 menurut ANTARA'),
    org(0, 'Jaffee Arizon Suardin', 'Direktur Logistik dan Infrastruktur', 'PT Pertamina (Persero)', '2025-06-12', null, 'menjabat', U_PTM, 'RUPS 12 Jun 2025'),
    org(0, 'Agung Wicaksono', 'Direktur Transformasi dan Keberlanjutan Bisnis', 'PT Pertamina (Persero)', '2025-06-12', null, 'menjabat', U_PTM, 'RUPS 12 Jun 2025'),
    org(0, 'Andy Arvianto', 'Direktur Sumber Daya Manusia', 'PT Pertamina (Persero)', '2025-06-12', null, 'menjabat', U_PTM, 'RUPS 12 Jun 2025'),
  ];
  const lomba = [
    { id: 'lm_asean_re_2025_geofert', nama: 'GeO-Fert (pupuk organik berpanas bumi, Kamojang)', penghargaan: 'ASEAN Renewable Energy Project Awards 2025, pemenang kategori Off Grid Thermal', penerima: 'PT Pertamina Geothermal Energy Tbk', tanggal: '2025-10-16', penyelenggara: 'ASEAN Centre for Energy / Kementerian Tenaga dan Transformasi Air Malaysia', ...dasar(U_TGE, 'media') },
  ];
  const brin = [
    { id: 'brin_sizero', nama: 'Si-ZERO (Silicon Zero Emission Recycling, Refining and Production): daur ulang limbah panel surya', jenis: 'riset kolaborasi', mitra: 'Swinburne University of Technology (Australia)', unit: 'BRIN', tahap: 'riset', tanggal_berita: '2026-10-20', ...dasar(U_BRIN, 'resmi') },
  ];
  const n = [tulisJsonl('proyek/tambahan_wkp_jica.jsonl', proyek), tulisJsonl('orang/tambahan_rotasi.jsonl', rot), tulisJsonl('inovasi/lomba.jsonl', lomba), tulisJsonl('inovasi/brin.jsonl', brin), tulisJsonl('inovasi/paten.jsonl', []), tulisJsonl('inovasi/startup.jsonl', [])];
  console.log('kurasi:', n.join(' '));
}

// ---------- selftest ----------
function selftest() {
  assert.equal(robotsBolehDari('User-agent: *\nDisallow: /', '/a'), false);
  assert.equal(robotsBolehDari('User-agent: *\nDisallow: /api/', '/gql'), true);
  assert.equal(kunciNama('Dr. H. Bambang Patijaya, S.E., M.M.'), 'bambang patijaya');
  assert.equal(pisahGelar('Dr. H. Azikin Solthan, M.Si.').nama, 'Azikin Solthan');
  const b = barisDpr({ anggota: { nama: 'Ir. X Y, M.B.A.', id: 7, photofileLink: 'u' }, dapil: { dapil: 'Jawa I' }, riwayatFraksi: [{ fraksi: { singkatan: 'PAN' } }],
    daftarRiwayatAkd: [{ idAkd: 3, posisi: { data: 'Wakil Ketua' } }] }, 3);
  assert.equal(b.posisi, 'Wakil Ketua'); assert.equal(b.fraksi, 'PAN');
  assert.equal(teknologiDari('Geothermal Resource Risk'), 'panas-bumi');
  console.log('selftest ok');
}

const TAHAP = { dprwiki, wb, kurasi };
export { TAHAP };
const utama = async () => {
  if (flag('selftest')) return selftest();
  if (arg('url')) { const t = await ambil(arg('url')); console.log(t ? t.length + ' byte' : 'gagal', JSON.stringify(LOG)); return; }
  const daftar = flag('semua') ? Object.keys(TAHAP) : Object.keys(TAHAP).filter((k) => flag(k));
  if (!daftar.length) return console.log('lihat komentar di kepala berkas');
  for (const k of daftar) { console.log('==', k); await TAHAP[k](); }
  if (LOG.length) { fs.mkdirSync(path.join(DP, 'lanjutan'), { recursive: true }); fs.writeFileSync(path.join(DP, 'lanjutan/log.jsonl'), LOG.map((l) => JSON.stringify(l)).join('\n') + '\n'); console.log('log:', LOG.length); }
};
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await utama();
