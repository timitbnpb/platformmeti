// Peta pemangku kepentingan per proyek -> public/data/pemangku.json (indeks) + public/data/pemangku/<id>.json (satu berkas per proyek).
//   node scripts/pipa/pemangku.mjs bangun [tanggal]     (tanpa jaringan; hanya membaca public/data/*.json dan data/pendanaan/tautan_proyek.json)
//   node scripts/pipa/pemangku.mjs --selftest
// Simpul: org (logo), orang, pemda (lambang), regulasi, pendana (logo atau bendera). Sisi berperan: pemilik, pengembang, epc, operator,
// pendana, pembeli, regulator, pemasok, pakar. Tiap sisi punya tingkat bukti (resmi, kajian, media, hipotesis) dan sumber.
// Pemasok dan pakar SELALU kandidat (hipotesis): pemasok = produsen teknologi sama di provinsi sama; pakar = kepakaran sama + wilayah sama.
// Tak ada pihak yang ditebak dari nama; pembeli listrik hanya dari RUPTL (IPP menjual ke PLN) dan ditandai kajian.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf-8'));
export const PERAN = ['pemilik', 'pengembang', 'epc', 'operator', 'pendana', 'pembeli', 'regulator', 'pemasok', 'pakar'];
const URUT_T = { resmi: 0, kajian: 1, media: 2, hipotesis: 3 };
const PLN_ID = 'su_ed074ff5';
const TEK_TOPIK = { surya: 'surya', bayu: 'angin', hidro: 'hidro', 'panas-bumi': 'panas_bumi', bioenergi: 'bioenergi', 'biomassa-sampah': 'bioenergi', penyimpanan: 'penyimpanan', hidrogen: 'hidrogen', nuklir: 'nuklir' };
const TEK_RANTAI = { surya: 'surya', bayu: 'bayu', hidro: 'hidro', 'panas-bumi': 'panas_bumi', bioenergi: 'bioenergi', penyimpanan: 'baterai', hidrogen: 'hidrogen' };
const TEK_TKDN = { surya: ['modul', 'inverter', 'struktur'], bayu: ['turbin'], penyimpanan: ['baterai'] };
const KODE_REG = { uu: 'UU', perppu: 'Perppu', pp: 'PP', perpres: 'Perpres', keppres: 'Keppres', inpres: 'Inpres', permen: 'Permen', perda: 'Perda', ojk: 'POJK' };
const MAKS = { pemilik: 6, pengembang: 6, epc: 4, operator: 4, pendana: 6, pembeli: 2, regulator: 8, pemasok: 4, pakar: 4 };

export const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
export const tingkat = (v) => (v === 'resmi' || v === 'media' || v === 'hipotesis' ? v : 'kajian');
const slug = (s) => norm(s).replace(/ /g, '-');
const httpOk = (u) => /^https?:\/\//i.test(String(u || ''));
const sumber = (u, n) => (httpOk(u) ? [{ u, n: n || null }] : []);

/* Pecah teks pemilik majemuk ("A, B", "A/B", "Konsorsium X (A, B)") jadi nama; koma di dalam kurung dibiarkan. */
export function pecahNama(s) {
  const t = String(s ?? '').replace(/\s*\((?:IPP|GEM)\)\s*/gi, ' ').trim();
  const out = []; let dalam = 0, cur = '';
  for (const c of t) {
    if (c === '(') dalam++; if (c === ')') dalam = Math.max(0, dalam - 1);
    if (!dalam && (c === ',' || c === ';' || c === '/')) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur);
  return out.map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

export function bangun(D, tanggal) {
  const { proyek, org, orang, regulasi, program, berita, terpadu, gem, rantai, tkdn, pendanaanInt, pendanaan, tautan, pakarRiset, wilayah } = D;
  const orgById = new Map(org.map((o) => [o.id, o]));
  const amb = new Set(), orgNama = new Map();
  for (const o of org) for (const n of [o.nama, ...(o.nama_lain || []), o.singkatan]) { const k = norm(n); if (k.length < 3) continue; if (orgNama.has(k) && orgNama.get(k) !== o.id) amb.add(k); else orgNama.set(k, o.id); }
  for (const k of amb) orgNama.delete(k);
  const kodeProv = new Map(wilayah.map((w) => [norm(w.nama), w.kode])); kodeProv.set('daerah khusus ibukota jakarta', '31');
  const namaProv = new Map(wilayah.map((w) => [w.kode, w.nama]));
  const regById = new Map(regulasi.map((r) => [r.id, r]));
  const progById = new Map(program.map((g) => [g.id, g]));
  const gemById = new Map(gem.map((g) => [g.id, g]));
  const terpaduById = new Map(terpadu.map((x) => [x.id, x]));
  const beritaPer = new Map();
  for (const b of berita) for (const id of b.proyek_ids || []) { if (!beritaPer.has(id)) beritaPer.set(id, []); beritaPer.get(id).push(b); }
  const orgProyek = new Map(); // proyek id -> [org]
  for (const o of org) for (const id of o.proyek_ids || []) { if (!orgProyek.has(id)) orgProyek.set(id, []); orgProyek.get(id).push(o); }
  const piPer = new Map();
  for (const x of pendanaanInt) if (x.proyek_id) { if (!piPer.has(x.proyek_id)) piPer.set(x.proyek_id, []); piPer.get(x.proyek_id).push(x); }
  const tautanPer = new Map();
  for (const [kunci, v] of Object.entries(tautan?.tautan || {})) { if (!tautanPer.has(v.proyek_id)) tautanPer.set(v.proyek_id, []); tautanPer.get(v.proyek_id).push({ kunci, ...v }); }
  const badanIso = new Map();
  for (const n of pendanaan?.negara || []) for (const b of n.badan || []) badanIso.set(norm(b.replace(/\(.*?\)/g, '')), n.iso2);
  const isoDariRef = (ref) => { const m = /^([A-Z]{2})-/.exec(ref || ''); return m && !['XM', 'XI', 'XK'].includes(m[1]) ? m[1] : null; };
  const rantaiPer = new Map();
  for (const tk of rantai.teknologi || []) {
    const per = new Map();
    for (const k of tk.komponen || []) for (const p of k.pemasok || []) per.set(p.id, { ...p, komponen: k.id });
    rantaiPer.set(tk.id, [...per.values()]);
  }
  const pakarOrang = orang.filter((o) => (o.kepakaran || []).length);
  const aturanDaerah = regulasi.filter((r) => r.jenis === 'perda' && r.status !== 'dicabut');

  const hasil = new Map();
  for (const p of proyek) {
    const pid = p.id, tek = p.teknologi, prov = p.lokasi?.provinsi || '', kp = kodeProv.get(norm(prov)) || null;
    const simpul = new Map(), sisi = [], petaSisi = new Set();
    const pusat = 'proyek:' + pid;
    simpul.set(pusat, { k: pusat, j: 'proyek', nama: p.nama, tek });
    const tambahSimpul = (n) => { if (!simpul.has(n.k)) simpul.set(n.k, n); return simpul.get(n.k); };
    const hitung = {};
    const tambahSisi = (peran, k, t, s, c, a = pusat) => {
      const kunci = a + '>' + k + '>' + peran;
      if (petaSisi.has(kunci)) { /* sisi sama dari sumber lain: naikkan tingkat bukti dan gabung sumber */
        const e = sisi.find((q) => q.a === a && q.b === k && q.p === peran);
        if (e && URUT_T[tingkat(t)] < URUT_T[e.t]) { e.t = tingkat(t); if (c) e.c = c; }
        if (e && s?.length) { const g = e.s || (e.s = []); for (const x of s) if (g.length < 3 && !g.some((y) => y.u === x.u)) g.push(x); }
        return false;
      }
      if ((a === pusat && (hitung[peran] || 0) >= MAKS[peran])) return false;
      petaSisi.add(kunci); if (a === pusat) hitung[peran] = (hitung[peran] || 0) + 1;
      sisi.push({ a, b: k, p: peran, t: tingkat(t), ...(s?.length ? { s: s.slice(0, 2) } : {}), ...(c ? { c } : {}) }); return true;
    };
    const inti = (x) => norm(x).replace(/\b(pt|tbk|persero|ltd|co|corp|inc|sa|plc)\b/g, '').replace(/\s+/g, ' ').trim();
    const mirip = (nama) => { const a = inti(nama); if (a.length < 6) return null; for (const s of simpul.values()) if (['org', 'pendana'].includes(s.j)) { const b = inti(s.nama); if (b.length >= 6 && (a === b || (a.length >= 8 && b.length >= 8 && (a.startsWith(b) || b.startsWith(a))))) return s; } return null; };
    const simpulOrg = (id, nama, jenis = 'org', extra = {}) => {
      const o = id && orgById.get(id);
      const sama = mirip(o ? o.nama : nama); if (sama) return sama;
      if (o) return tambahSimpul({ k: 'org:' + o.id, j: jenis, id: o.id, nama: o.nama, ...(o.logo ? { logo: o.logo } : {}), ...(o.kategori?.label ? { info: o.kategori.label } : {}), ...extra });
      return tambahSimpul({ k: 'org:~' + slug(nama), j: jenis, nama, ...extra });
    };
    const orgDariNama = (n) => { const i = orgNama.get(norm(n)); return i && orgById.get(i) ? i : null; };
    const adaGem = gemById.get(terpaduById.get(pid)?.gem_id || pid.replace(/^gem_([a-z]+)_L/, 'gem-$1-L'));
    const sumberProyek = (p.sumber || []).find((s) => httpOk(s.url));
    let ippTanpaNama = false;

    /* 1. pihak menurut proyek.json */
    const peranPihak = { pemilik: 'pemilik', peminjam: 'pemilik', pelaksana: 'pengembang' };
    for (const [r, daftar] of Object.entries(p.pihak || {})) for (const a of daftar || []) {
      const peran = peranPihak[r] || 'pemilik', nilai = String(a.nilai || '').trim();
      let id = a.organisasi_id || null, nama = nilai;
      if (!id && /^(sh-)?pln$/i.test(nilai)) id = PLN_ID;
      if (!id && /^ipp$/i.test(nilai)) { ippTanpaNama = true; continue; }
      if (!id && (!nilai || /^(republic of indonesia|unallocated|-)$/i.test(nilai))) continue;
      const bagian = id ? [nama] : pecahNama(nama);
      for (const b of bagian) {
        const oi = id || orgDariNama(b);
        const n = simpulOrg(oi, b);
        tambahSisi(peran, n.k, p.tingkat_bukti, sumber((p.sumber || []).find((s) => s.id === a.sumber_id)?.url || sumberProyek?.url, null), a.catatan && !/bukan nama perusahaan/.test(a.catatan) ? a.catatan : r === 'peminjam' ? 'peminjam' : '');
      }
    }
    /* 2. pemilik menurut registri GEM */
    if (adaGem) for (const nm of adaGem.pemilik || []) for (const b of pecahNama(nm)) {
      const n = simpulOrg(orgDariNama(b), b);
      tambahSisi('pemilik', n.k, 'kajian', sumber(adaGem.url_wiki, 'Global Energy Monitor'), '');
    }
    const tp = terpaduById.get(pid);
    if (tp?.pemilik?.nama && !adaGem) for (const b of pecahNama(tp.pemilik.nama)) { const n = simpulOrg(tp.pemilik.org_id || orgDariNama(b), b); tambahSisi('pemilik', n.k, 'kajian', sumber(tp.url, null), ''); }
    /* 3. organisasi yang mencatat proyek ini di proyek_ids, peran dari peran_rantai */
    for (const o of orgProyek.get(pid) || []) {
      const rantaiO = o.peran_rantai || [], s = sumber(o.sumber?.[0]?.url, o.sumber?.[0]?.keterangan), t = o.sumber?.[0]?.tingkat_bukti;
      const n = simpulOrg(o.id, o.nama);
      let dipakai = false;
      const sudah = sisi.some((e) => e.b === n.k && e.a === pusat);
      if (rantaiO.includes('EPC')) dipakai = tambahSisi('epc', n.k, t, s, '') || dipakai;
      if (rantaiO.includes('operator')) dipakai = tambahSisi('operator', n.k, t, s, '') || dipakai;
      if (rantaiO.some((x) => ['pendana', 'pembiaya'].includes(x)) || ['keuangan', 'donor'].includes(o.kategori?.kode)) { n.j = n.j === 'org' && sisi.some((e) => e.b === n.k) ? 'org' : 'pendana'; dipakai = tambahSisi('pendana', n.k, t, s, '') || dipakai; }
      if (!sudah && rantaiO.some((x) => ['pengembang', 'IPP'].includes(x))) dipakai = tambahSisi('pengembang', n.k, t, s, '') || dipakai;
      if (!sudah && rantaiO.some((x) => ['pemasok', 'manufaktur'].includes(x))) dipakai = tambahSisi('pemasok', n.k, t, s, '') || dipakai;
      if (!dipakai && !sudah) tambahSisi('pengembang', n.k, t, s, '');
    }
    /* 4. pendana: IATI/d-portal, tautan WB+AIIB, proyek WB */
    const tambahPendana = (nama, orgId, iso, t, s, c) => {
      const oi = orgId || orgDariNama(nama);
      const n = simpulOrg(oi, nama, 'pendana', iso ? { iso } : {});
      if (iso && !n.iso) n.iso = iso;
      tambahSisi('pendana', n.k, t, s, c);
    };
    const usd = (v) => (v ? `US$ ${(v / 1e6).toLocaleString('en-US', { maximumFractionDigits: 1 })} juta` : '');
    for (const x of piPer.get(pid) || []) tambahPendana(x.pemberi, x.pemberi_org_id, isoDariRef(x.pemberi_ref) || badanIso.get(norm(String(x.pemberi).replace(/\(.*?\)/g, ''))) || null, 'resmi', sumber(x.sumber_url, 'IATI d-portal'), [usd(x.nilai_usd), x.tahun].filter(Boolean).join(', '));
    for (const x of tautanPer.get(pid) || []) tambahPendana(x.pemberi === 'World Bank' ? 'World Bank' : x.pemberi, null, null, 'kajian', sumber(x.sumber_url, x.pemberi), x.bukti ? 'dicocokkan menurut nama' : '');
    if (/^wb_/.test(pid)) tambahPendana('World Bank', null, null, 'resmi', sumber(sumberProyek?.url, 'World Bank'), usd(p.nilai_investasi?.[0]?.nilai));
    /* 5. pembeli listrik: hanya dari RUPTL (IPP menjual ke PLN); bukan kontrak per proyek */
    const dariRuptl = (p.program_ids || []).includes('ruptl');
    const pemilikPln = sisi.some((e) => e.p === 'pemilik' && /^org:(su_ed074ff5|p_5a2e7d0c63|p_ff7a390a42|p_e0f3886341)$/.test(e.b));
    if (dariRuptl && !pemilikPln && (ippTanpaNama || sisi.some((e) => e.p === 'pemilik'))) {
      const n = simpulOrg(PLN_ID, 'PLN');
      tambahSisi('pembeli', n.k, 'kajian', sumber((p.sumber || []).find((s) => s.jenis === 'ruptl')?.url, 'RUPTL PLN 2025-2034'), 'pembeli menurut RUPTL; kontrak jual-beli per proyek tidak terbit');
    }
    /* 6. pemda: provinsi dan kabupaten/kota lokasi proyek */
    const pemdaProv = kp ? tambahSimpul({ k: 'pemda:' + kp, j: 'pemda', id: kp, kode: kp, nama: `Pemerintah Provinsi ${namaProv.get(kp) || prov}`, tingkat: 'provinsi', lambang: `/img/provinsi/${kp}.png`, href: '/wilayah/' + kp }) : null;
    if (pemdaProv) tambahSisi('regulator', pemdaProv.k, 'kajian', sumber(p.lokasi?.sumber?.url, 'lokasi proyek'), 'pemda lokasi proyek: perizinan daerah');
    const kabN = (Array.isArray(p.lokasi?.kabupaten_kota) ? p.lokasi.kabupaten_kota : []).map((x) => String(x.nilai || '').replace(/^(kabupaten|kab\.?|kota)\s+/i, '').trim()).filter(Boolean)[0];
    let pemdaKab = null;
    if (kabN && kp) {
      const sl = slug(kabN), file = ['kabupaten-', 'kota-'].map((a) => a + sl).find((f) => fs.existsSync(path.join(ROOT, 'public/img/kabkota', f + '.png')));
      pemdaKab = tambahSimpul({ k: 'pemda:' + kp + ':' + sl, j: 'pemda', id: kp, kode: kp, nama: file?.startsWith('kota-') ? `Pemerintah Kota ${kabN}` : `Pemerintah Kabupaten ${kabN}`, tingkat: 'kabupaten', ...(file ? { lambang: `/img/kabkota/${file}.png` } : { lambang: `/img/provinsi/${kp}.png` }), href: '/wilayah/' + kp });
      tambahSisi('regulator', pemdaKab.k, 'kajian', sumber(p.lokasi?.sumber?.url, 'lokasi proyek'), 'pemda lokasi proyek: izin lokasi dan PBG');
    }
    /* 7. regulasi: tertaut proyek/program (resmi), perda wilayah dan aturan nasional bertopik sama (kandidat) */
    const regSimpul = (r, t, c) => {
      const n = tambahSimpul({ k: 'regulasi:' + r.id, j: 'regulasi', id: r.id, nama: `${KODE_REG[r.jenis] || String(r.jenis).toUpperCase()} ${r.nomor}/${r.tahun}`, judul: r.judul, ...(httpOk(r.url_pdf) ? { pdf: r.url_pdf } : {}), ...(httpOk(r.url_sumber) ? { url: r.url_sumber } : {}), href: '/regulasi?id=' + encodeURIComponent(r.id) });
      if (!tambahSisi('regulator', n.k, t, sumber(r.url_sumber, r.instansi_penerbit), c)) return null;
      const pemda = [pemdaKab, pemdaProv].find((q) => q && norm(r.instansi_penerbit || '').endsWith(norm(q.nama.replace(/^Pemerintah /, ''))));
      if (pemda) tambahSisi('regulator', pemda.k, t, [], '', n.k);
      return n;
    };
    const ids = new Set([...(p.regulasi_ids || []), ...(p.program_ids || []).flatMap((g) => progById.get(g)?.regulasi_ids || [])]);
    [...ids].map((i) => regById.get(i)).filter(Boolean).sort((a, b) => String(b.tanggal_ditetapkan).localeCompare(String(a.tanggal_ditetapkan))).slice(0, 4).forEach((r) => regSimpul(r, 'resmi', ''));
    const topik = TEK_TOPIK[tek];
    const cocokTopik = (r) => (r.topik || []).includes(topik) || (r.topik || []).includes('perizinan');
    const terbaru = (a, b) => String(b.tanggal_ditetapkan).localeCompare(String(a.tanggal_ditetapkan));
    const namaPenerbit = (q) => norm(q.nama);
    aturanDaerah.filter((r) => [pemdaKab, pemdaProv].some((q) => q && norm(r.instansi_penerbit || '') === namaPenerbit(q)) && ((r.topik || []).some((x) => ['perizinan', 'jaringan', 'energi_umum', topik].includes(x)))).sort(terbaru).slice(0, 2).forEach((r) => regSimpul(r, 'hipotesis', 'perda wilayah: kandidat, belum terbukti mengatur proyek ini'));
    regulasi.filter((r) => ['uu', 'pp', 'perpres', 'permen'].includes(r.jenis) && r.status === 'berlaku' && topik && (r.topik || []).includes(topik)).sort(terbaru).slice(0, 2).forEach((r) => regSimpul(r, 'hipotesis', 'aturan nasional bertopik sama: kandidat'));
    /* 8. pemasok kandidat: produsen teknologi sama di provinsi sama (rantai pasok + TKDN) */
    const kandidatPemasok = [];
    for (const x of rantaiPer.get(TEK_RANTAI[tek]) || []) if (norm(x.provinsi) === norm(prov)) kandidatPemasok.push({ id: x.org_id, nama: x.nama, skor: (x.mwp || 0) + (x.tkdn || 0), info: [x.komponen, x.kota].filter(Boolean).join(', '), s: sumber(null) });
    for (const x of tkdn) if ((TEK_TKDN[tek] || []).includes(x.kategori) && x.aktif && norm(x.provinsi) === norm(prov)) kandidatPemasok.push({ id: x.pabrikan_org_id, nama: x.pabrikan, skor: x.tkdn_persen || 0, info: `${x.kategori}, TKDN ${x.tkdn_persen}%`, s: sumber(x.sumber_url, 'Sertifikat TKDN Kemenperin') });
    const lihatPemasok = new Set();
    kandidatPemasok.sort((a, b) => b.skor - a.skor).forEach((x) => {
      const kunci = norm(x.nama); if (lihatPemasok.has(kunci)) return; lihatPemasok.add(kunci);
      const n = simpulOrg(x.id && orgById.has(x.id) ? x.id : orgDariNama(x.nama), x.nama);
      tambahSisi('pemasok', n.k, 'hipotesis', x.s, `kandidat: ${x.info}`);
    });
    /* 9. pakar kandidat: kepakaran sama dan wilayah sama; nasional hanya bila tak ada yang sewilayah */
    const kepakaranOk = (o) => (o.kepakaran || []).some((k) => k.kode === tek || (tek === 'biomassa-sampah' && k.kode === 'bioenergi'));
    const pakarList = [];
    for (const o of pakarOrang) if (kepakaranOk(o) && o.wilayah?.provinsi && norm(o.wilayah.provinsi) === norm(prov)) pakarList.push({ id: o.id, nama: o.nama, info: [o.jabatan_terkini, o.organisasi_terkini].filter(Boolean).join(', '), u: o.sumber_url, skor: 3 });
    for (const x of pakarRiset) if (kp && String(x.prov) === kp && (x.sektor || []).includes(tek)) pakarList.push({ id: x.id, nama: x.nama, info: [x.kampus, `${x.karya} karya`].filter(Boolean).join(', '), u: x.sumber_url, skor: 2 + Math.min(1, (x.karya || 0) / 500) });
    if (!pakarList.length) for (const o of pakarOrang) if (kepakaranOk(o) && (o.kepakaran || []).some((k) => k.kode === tek && k.utama) && o.wilayah?.lingkup === 'nasional') pakarList.push({ id: o.id, nama: o.nama, info: [o.jabatan_terkini, o.organisasi_terkini].filter(Boolean).join(', '), u: o.sumber_url, skor: 1 });
    pakarList.sort((a, b) => b.skor - a.skor || a.nama.localeCompare(b.nama)).slice(0, MAKS.pakar).forEach((x) => {
      const n = tambahSimpul({ k: 'orang:' + x.id, j: 'orang', id: x.id, nama: x.nama, info: x.info, href: '/direktori?pakar=' + encodeURIComponent(x.id) });
      tambahSisi('pakar', n.k, 'hipotesis', sumber(x.u, null), 'kandidat menurut kepakaran dan wilayah');
    });
    /* 10. berita: bukti tambahan untuk simpul organisasi yang disebut */
    const bk = beritaPer.get(pid) || [];
    for (const b of bk) for (const oi of b.organisasi_ids || []) {
      const e = sisi.find((q) => q.b === 'org:' + oi && q.a === pusat); if (!e) continue;
      const s = e.s || (e.s = []); if (s.length < 3 && httpOk(b.url) && !s.some((q) => q.u === b.url)) s.push({ u: b.url, n: b.media || null });
    }
    if (sisi.length) hasil.set(pid, { id: pid, nama: p.nama, tek, tanggal, jumlah: simpul.size - 1, berita: bk.length, simpul: [...simpul.values()], sisi: sisi.sort((x, y) => PERAN.indexOf(x.p) - PERAN.indexOf(y.p) || URUT_T[x.t] - URUT_T[y.t]) });
  }
  const perPeran = Object.fromEntries(PERAN.map((r) => [r, 0]));
  const ada = {};
  for (const [id, h] of hasil) { ada[id] = h.jumlah; for (const r of new Set(h.sisi.map((e) => e.p))) perPeran[r]++; }
  const indeks = {
    lapis: 'publik', dibangun_pada: tanggal, jumlah_proyek: proyek.length, proyek_berpeta: hasil.size, per_peran: perPeran,
    metode: 'Pemilik, pengembang, EPC, operator dan pendana dari proyek.json, registri GEM, organisasi.json, IATI d-portal serta tautan Bank Dunia/AIIB; pembeli hanya dari RUPTL; regulator dari regulasi tertaut proyek/program dan pemda lokasi. Pemasok (produsen teknologi sama di provinsi sama), pakar (kepakaran dan wilayah sama) dan aturan bertopik sama adalah KANDIDAT berstatus hipotesis, bukan pernyataan keterlibatan.',
    tingkat: { resmi: 'sumber resmi', kajian: 'turunan data terkurasi atau registri', media: 'pemberitaan', hipotesis: 'kandidat, belum terbukti terlibat' },
    ada,
  };
  return { indeks, hasil };
}

const BACA = {
  proyek: 'public/data/proyek.json', org: 'public/data/organisasi.json', orang: 'public/data/orang.json', regulasi: 'public/data/regulasi.json', program: 'public/data/program.json', berita: 'public/data/berita.json',
  terpadu: 'public/data/proyek_terpadu.json', gem: 'public/data/gem_pembangkit.json', tkdn: 'public/data/tkdn_produk.json', pendanaanInt: 'public/data/pendanaan_internasional.json', wilayah: 'public/data/wilayah.json',
};
export function muat() {
  const D = {};
  for (const [k, f] of Object.entries(BACA)) D[k] = baca(f).baris;
  D.rantai = baca('public/data/rantai_pasok.json'); D.pendanaan = baca('public/data/pendanaan.json');
  D.tautan = fs.existsSync(path.join(ROOT, 'data/pendanaan/tautan_proyek.json')) ? baca('data/pendanaan/tautan_proyek.json') : { tautan: {} };
  const pr = baca('public/data/pakar_riset.json'); D.pakarRiset = Array.isArray(pr) ? pr : Object.values(pr);
  return D;
}
export function tulis(indeks, hasil) {
  const dir = path.join(ROOT, 'public/data/pemangku');
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.json') && !hasil.has(f.slice(0, -5))) fs.rmSync(path.join(dir, f));
  for (const [id, h] of hasil) fs.writeFileSync(path.join(dir, id + '.json'), JSON.stringify(h) + '\n');
  fs.writeFileSync(path.join(ROOT, 'public/data/pemangku.json'), JSON.stringify(indeks) + '\n');
}

function selftest() {
  assert.deepEqual(pecahNama('A Corp, B Ltd'), ['A Corp', 'B Ltd']);
  assert.deepEqual(pecahNama('Konsorsium X (A, B)'), ['Konsorsium X (A, B)']);
  assert.deepEqual(pecahNama('PT Pertamina, Chevron Geothermal Salak Ltd (IPP)'), ['PT Pertamina', 'Chevron Geothermal Salak Ltd']);
  assert.equal(tingkat('situs-sendiri'), 'kajian'); assert.equal(tingkat('resmi'), 'resmi');
  const D = {
    proyek: [{ id: 'pj_x', nama: 'PLTS X', teknologi: 'surya', program_ids: ['ruptl'], lokasi: { provinsi: 'Aceh' }, tingkat_bukti: 'resmi', pihak: { pemilik: [{ nilai: 'IPP' }, { nilai: 'Acme Solar' }] }, sumber: [{ id: 's1', jenis: 'ruptl', url: 'https://x.id/a' }] }],
    org: [{ id: 'o1', nama: 'Acme Solar', proyek_ids: [], kategori: { label: 'Swasta' } }, { id: PLN_ID, nama: 'PLN' }], orang: [], regulasi: [], program: [], berita: [], terpadu: [], gem: [], tkdn: [], pendanaanInt: [],
    wilayah: [{ kode: '11', nama: 'Aceh' }], rantai: { teknologi: [] }, pendanaan: {}, tautan: {}, pakarRiset: [],
  };
  const { hasil } = bangun(D, '2026-11-08');
  const h = hasil.get('pj_x');
  assert.ok(h.sisi.some((e) => e.p === 'pemilik' && e.b === 'org:o1'));
  assert.ok(h.sisi.some((e) => e.p === 'pembeli' && e.b === 'org:' + PLN_ID && e.t === 'kajian'));
  assert.ok(h.sisi.some((e) => e.p === 'regulator' && e.b === 'pemda:11'));
  console.log('pemangku selftest ok');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [aksi, tgl] = process.argv.slice(2);
  if (aksi === '--selftest') selftest();
  else if (aksi === 'bangun') {
    const tanggal = tgl || new Date().toISOString().slice(0, 10);
    const { indeks, hasil } = bangun(muat(), tanggal);
    tulis(indeks, hasil);
    console.log(`pemangku: ${hasil.size}/${indeks.jumlah_proyek} proyek berpeta`, JSON.stringify(indeks.per_peran));
  } else console.log('pakai: pemangku.mjs bangun [tanggal] | --selftest');
}
