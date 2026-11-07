// Kuadran pemain EBT (tiru "Indonesia's state companies, mapped" 1001startup.id; ALGORITMA §5). Hipotesis, bukan vonis.
// Membaca: organisasi.json, proyek.json, berita.json, pendanaan.json (kurs), data/gem/*.json, data/direktori/profil_org.json,
// data/kuadran/skor_kurasi.json. Menulis: public/data/kuadran.json. Aturan: tanpa sumber = null ("tanpa angka terbit"), bukan nol.
// Jalankan: node scripts/pipa/kuadran.mjs   (uji: node scripts/pipa/kuadran.mjs --selftest)
import fs from 'node:fs';
import { logoOrg } from '../../public/inti/logo_org.js';

const R = new URL('../../', import.meta.url).pathname;
const J = (p) => JSON.parse(fs.readFileSync(R + p, 'utf8'));
export const NMIN = 5;
export const TGL = '2026-11-08';
const bulat = (n, d = 2) => Math.round((n + Number.EPSILON) * 10 ** d) / 10 ** d;

/* ---------- fungsi murni (ALGORITMA §5.1) ---------- */
export const persentil = (vals, x) => {
  if (x == null || vals.length < NMIN) return null;
  const k = vals.filter((v) => v < x).length, s = vals.filter((v) => v === x).length;
  return (k + s / 2) / vals.length;
};
export const peringkat = (vals, x) => 1 + vals.filter((v) => v > x).length;
export const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null; };
export const norm = (s) => String(s || '').toLowerCase().replace(/\(persero\)|\(ipp\)|\btbk\b|\bpt\b|\bltd\b|\blimited\b|\bpte\b|\bcorp(oration)?\b|\bco\b|\binc\b|\bsa\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

const TEK_GEM = { solar: 'surya', wind: 'bayu', hydropower: 'hidro', geothermal: 'panas-bumi' };
const TEK_EBT = new Set(['surya', 'bayu', 'hidro', 'panas-bumi', 'bioenergi', 'biomassa-sampah']);
const PIPE = new Set(['construction', 'pre-construction', 'announced']);
const MANDEK = new Set(['cancelled', 'shelved']);
const GEM_URL = { solar: 'https://globalenergymonitor.org/projects/global-solar-power-tracker/', wind: 'https://globalenergymonitor.org/projects/global-wind-power-tracker/', hydropower: 'https://globalenergymonitor.org/projects/global-hydropower-tracker/', geothermal: 'https://globalenergymonitor.org/projects/global-geothermal-power-tracker/', coal: 'https://globalenergymonitor.org/projects/global-coal-plant-tracker/' };
const KAT = { bumn: 'bumn', swasta: 'swasta', internasional: 'internasional' };

/** Bagi MW proyek ke pemilik: persen tertulis dipakai apa adanya; yang kosong berbagi sisa rata (bertanda est). */
export function bagiPemilik(pemilik = []) {
  const tahu = pemilik.reduce((s, p) => s + (p.persen || 0), 0), kosong = pemilik.filter((p) => p.persen == null);
  const sisa = kosong.length && tahu < 100 ? (100 - tahu) / kosong.length : 0;
  return pemilik.map((p) => ({ nama: p.nama, org: p.organisasi_id, bagian: (p.persen ?? sisa) / 100, est: p.persen == null }));
}

export function bangun({ organisasi, proyek, berita, kurs, gem, profil, kurasi, adaLogo = () => true }) {
  const E = new Map(); // id -> entitas
  const alias = new Map(); // norm -> id
  const daftar = (e, ...ns) => { for (const n of [e.nama, ...(kurasi.alias[e.id] || []), ...ns]) { const k = norm(n); if (k && !alias.has(k)) alias.set(k, e.id); } };
  const baru = (o) => { const e = { id: o.id, nama: o.nama, kategori: o.kategori, di_direktori: !!o.di_direktori, peran: o.peran || [], o, op: {}, pipe: {}, mandek: 0, coal: 0, n_proy: 0, n_aktif: 0, prog: new Set(), n_prog: 0, n_ruptl: 0, baris: [], berita: [], est: false }; E.set(e.id, e); daftar(e, ...(o.alias || [])); return e; };
  const sertakan = new Set(kurasi.sertakan_id);
  for (const o of organisasi) {
    const p = o.peran_rantai || [];
    if (sertakan.has(o.id) || p.some((r) => /pengembang|IPP|operator/.test(r))) baru({ id: o.id, nama: o.nama, kategori: kurasi.kategori?.[o.id] || KAT[o.kategori.kode] || 'lainnya', di_direktori: true, peran: p, org: o });
  }
  for (const k of kurasi.entitas_tambahan) baru({ id: k.id, nama: k.nama, kategori: k.kategori, di_direktori: false, peran: k.peran, alias: k.alias });
  const cari = (nama, id) => (id && E.has(id) ? E.get(id) : E.get(alias.get(norm(nama))));

  // ---- GEM: kapasitas, pipeline, mandek, batubara ----
  const kand = new Map(); // norm -> {nama, mw}
  const pass = (fn) => { for (const [f, d] of Object.entries(gem)) for (const b of d.baris) fn(f, d, b); };
  pass((f, d, b) => {
    if (f === 'coal' || !(b.kapasitas_mw > 0) || !(b.status === 'operating' || PIPE.has(b.status))) return;
    for (const p of bagiPemilik(b.pemilik)) if (!cari(p.nama, p.org) && p.bagian > 0) { const k = norm(p.nama), c = kand.get(k) || { nama: p.nama, mw: 0 }; c.mw += b.kapasitas_mw * p.bagian; kand.set(k, c); }
  });
  const slug = (s) => norm(s).replace(/ /g, '-');
  for (const [k, c] of [...kand].sort((a, z) => z[1].mw - a[1].mw).slice(0, 18)) if (c.mw >= 60) baru({ id: 'g_' + slug(c.nama), nama: c.nama, kategori: 'lainnya', di_direktori: false, peran: ['pengembang'] });
  const sumberGem = {};
  pass((f, d, b) => {
    const tek = TEK_GEM[f], mw = b.kapasitas_mw;
    if (!(mw > 0)) return;
    for (const p of bagiPemilik(b.pemilik)) {
      const e = cari(p.nama, p.org); if (!e || p.bagian <= 0) continue;
      const x = mw * p.bagian;
      sumberGem[e.id] ||= new Set(); sumberGem[e.id].add(f);
      if (f === 'coal') { if (b.status === 'operating') e.coal += x; continue; }
      e.n_proy++;
      if (b.status === 'operating') { e.op[tek] = (e.op[tek] || 0) + x; e.n_aktif++; } else if (PIPE.has(b.status)) { e.pipe[tek] = (e.pipe[tek] || 0) + x; e.n_aktif++; } else if (MANDEK.has(b.status)) e.mandek += x;
      if (p.est) e.est = true;
      e.baris.push({ mw: x, url: b.url_wiki, f });
    }
  });
  const gemMw = (o) => Object.values(o).reduce((s, v) => s + v, 0);

  // ---- proyek.json (RUPTL, PSN, dsb) ----
  const sumProy = {};
  for (const pr of proyek) {
    const mw = (pr.kapasitas || []).find((k) => k.satuan === 'MW')?.nilai, st = pr.status?.[0]?.nilai;
    const pem = [...new Set((pr.pihak?.pemilik || []).map((x) => cari(x.nilai)).filter(Boolean))];
    for (const e of pem) {
      e.n_proy++;
      if (st) e.n_aktif += st === 'beroperasi' || st === 'konstruksi' || st === 'rencana' ? 1 : 0;
      for (const g of pr.program_ids || []) { e.prog.add(g); if (g === 'ruptl') e.n_ruptl++; else e.n_prog++; }
      (sumProy[e.id] ||= []).push(pr.sumber?.[0]?.url);
      if (!(mw > 0) || !TEK_EBT.has(pr.teknologi)) continue;
      const x = mw / pem.length, tek = pr.teknologi;
      e.pr ||= { op: 0, pipe: 0, mandek: 0 };
      if (st === 'beroperasi') e.pr.op += x; else if (st === 'konstruksi' || st === 'rencana') e.pr.pipe += x; else if (st === 'dibatalkan' || st === 'ditunda') e.pr.mandek += x;
      e.tekP ||= new Set(); e.tekP.add(tek);
    }
  }

  // ---- berita 24 bulan ----
  const batas = '2024-11-08';
  for (const b of berita) {
    if ((b.terbit || '') < batas) continue;
    const j = ' ' + norm(b.judul) + ' ';
    for (const e of E.values()) {
      const ks = [e.nama, ...(kurasi.alias[e.id] || []), ...(e.o.alias || [])].map(norm).filter((k) => k.length >= 3);
      if (ks.some((k) => j.includes(' ' + k + ' '))) e.berita.push({ judul: b.judul, url: b.url, tanggal: b.terbit.slice(0, 10) });
    }
  }

  // ---- keuangan ----
  const idr = (n, sat) => (sat === 'USD juta' ? n * 1e6 * kurs.usd_idr : sat === 'IDR juta' ? n * 1e6 : null) / 1e12;
  const METRIK = [['pendapatan', /^pendapatan$/], ['laba', /^laba bersih( diatribusikan)?( ke pemilik induk)?$/], ['aset', /^total aset$/]];
  for (const e of E.values()) {
    e.fin = [];
    for (const [k, re] of METRIK) {
      const m = (e.o.org?.keuangan || []).filter((x) => re.test(x.metrik) && x.nilai != null).sort((a, z) => z.tahun - a.tahun)[0];
      if (m) e.fin.push({ metrik: k, tahun: m.tahun, nilai: m.nilai, satuan: m.satuan, idr_t: bulat(idr(m.nilai, m.satuan), 2), sumber_url: m.sumber_url, tanggal: m.tanggal });
    }
  }

  // ---- skor mentah ----
  const A = [...E.values()];
  for (const e of A) {
    const op = Math.max(gemMw(e.op), e.pr?.op || 0), pipe = Math.max(gemMw(e.pipe), e.pr?.pipe || 0), mandek = Math.max(e.mandek, e.pr?.mandek || 0);
    e.m = {
      kapasitas: op > 0 ? op : null, pipeline: pipe > 0 ? pipe : null,
      porsi: op + e.coal > 0 && (e.n_proy > 0) ? op / (op + e.coal) : null,
      prioritas: e.n_prog + e.n_ruptl > 0 ? 2 * e.n_prog + e.n_ruptl : null,
      keaktifan: e.n_aktif + e.berita.length > 0 ? e.n_aktif + 2 * e.berita.length : null,
      risiko: e.n_proy > 0 ? mandek : null,
    };
    e.tek = [...new Set([...Object.keys(e.op), ...Object.keys(e.pipe), ...(e.tekP || [])])].filter((t) => TEK_EBT.has(t)).sort();
  }
  const sebaran = (k) => A.map((e) => e.m[k]).filter((v) => v != null);
  const SK = {};
  const set = (e, k, skor, mentah, satuan, id, en, sumber, est = false) => { (SK[e.id] ||= {})[k] = { skor: skor == null ? null : bulat(skor), mentah: mentah == null ? null : bulat(mentah, 4), satuan, alasan: { id, en }, sumber, est }; };
  const sumGem = (e) => { const s = [...(sumberGem[e.id] || [])].filter((f) => f !== 'coal').map((f) => ({ judul: 'Global Energy Monitor, ' + f + ' tracker (CC BY 4.0)', url: GEM_URL[f], tanggal: gem[f].rilis })); const w = e.baris.sort((a, z) => z.mw - a.mw).slice(0, 2).filter((r) => r.url).map((r) => ({ judul: 'Global Energy Monitor Wiki', url: r.url, tanggal: gem[r.f].rilis })); return [...s, ...w]; };
  const sumPr = (e) => [{ judul: 'Data proyek METI (RUPTL dan program)', url: '/data/proyek.json', tanggal: TGL }, ...[...new Set(sumProy[e.id] || [])].filter((u) => /^https:/.test(u || '')).slice(0, 2).map((u) => ({ judul: 'Dokumen sumber proyek', url: u, tanggal: TGL }))];
  const f1 = (n) => (Math.round(n * 10) / 10).toLocaleString('en-US');
  for (const e of A) {
    const m = e.m, gs = sumGem(e), est = e.est;
    for (const k of ['kapasitas', 'pipeline']) {
      const p = persentil(sebaran(k), m[k]);
      if (m[k] == null || p == null) set(e, k, null, null, 'MW', 'Tidak ada proyek EBT yang tercatat untuk pemain ini di GEM atau proyek.json; ini bukan bukti nol.', 'No renewable project is recorded for this player in GEM or proyek.json; this is not proof of zero.', []);
      else set(e, k, 5 * p, m[k], 'MW', `${f1(m[k])} MW ${k === 'kapasitas' ? 'terpasang' : 'dalam pipeline (konstruksi, pra-konstruksi, diumumkan, rencana)'}; skor 5 x persentil di antara ${sebaran(k).length} pemain.`, `${f1(m[k])} MW ${k === 'kapasitas' ? 'operating' : 'in pipeline (construction, pre-construction, announced, planned)'}; score 5 x percentile among ${sebaran(k).length} players.`, [...gs, ...(e.pr ? sumPr(e).slice(0, 1) : [])], est);
    }
    if (m.porsi == null) set(e, 'porsi', null, null, '%', 'Tidak ada pembangkit beroperasi tercatat (EBT atau batubara) untuk pemain ini.', 'No operating plant (renewable or coal) is recorded for this player.', []);
    else set(e, 'porsi', 5 * m.porsi, m.porsi * 100, '%', `EBT ${f1((m.kapasitas || 0))} MW dari ${f1((m.kapasitas || 0) + e.coal)} MW (EBT ditambah batubara) = ${f1(m.porsi * 100)} persen. Gas dan minyak belum tercatat.`, `Renewables ${f1(m.kapasitas || 0)} MW of ${f1((m.kapasitas || 0) + e.coal)} MW (renewables plus coal) = ${f1(m.porsi * 100)} percent. Gas and oil not yet recorded.`, [...gs, { judul: 'Global Energy Monitor, coal tracker (CC BY 4.0)', url: GEM_URL.coal, tanggal: gem.coal.rilis }], est);
    const pr = persentil(sebaran('prioritas'), m.prioritas);
    if (pr == null) set(e, 'prioritas', null, null, 'poin', 'Tidak ada proyek pemain ini yang tertaut ke RUPTL atau program prioritas (PSN, JETP, PLTS 100 GW, WTE) di proyek.json.', 'No project of this player is linked to RUPTL or a priority programme (PSN, JETP, 100 GW solar, WTE) in proyek.json.', []);
    else set(e, 'prioritas', 5 * pr, m.prioritas, 'poin', `${e.n_ruptl} proyek tertaut RUPTL (1 poin) dan ${e.n_prog} proyek tertaut program prioritas (2 poin) = ${m.prioritas} poin; skor 5 x persentil.`, `${e.n_ruptl} projects linked to RUPTL (1 point) and ${e.n_prog} to priority programmes (2 points) = ${m.prioritas} points; score 5 x percentile.`, sumPr(e));
    const ka = persentil(sebaran('keaktifan'), m.keaktifan);
    if (ka == null) set(e, 'keaktifan', null, null, 'poin', 'Tidak ditemukan proyek atau berita 24 bulan terakhir yang memuat nama pemain ini di data METI.', 'No project or news item in the last 24 months mentions this player in METI data.', []);
    else set(e, 'keaktifan', 5 * ka, m.keaktifan, 'poin', `${e.n_aktif} proyek berjalan atau berencana (1 poin) dan ${e.berita.length} berita 24 bulan (2 poin) = ${m.keaktifan} poin; skor 5 x persentil.`, `${e.n_aktif} active or planned projects (1 point) and ${e.berita.length} news items in 24 months (2 points) = ${m.keaktifan} points; score 5 x percentile.`, [...e.berita.slice(0, 3).map((b) => ({ judul: b.judul, url: b.url, tanggal: b.tanggal })), ...(gs.length ? gs.slice(0, 1) : sumPr(e).slice(0, 1))]);
    const ri = persentil(sebaran('risiko'), m.risiko);
    if (ri == null) set(e, 'risiko', null, null, 'MW', 'Belum ada portofolio proyek tercatat, risiko tidak bisa dihitung.', 'No recorded project portfolio, risk cannot be computed.', []);
    else set(e, 'risiko', m.risiko > 0 ? 5 * ri : 0, m.risiko, 'MW', `${f1(m.risiko)} MW dibatalkan atau ditunda dari ${e.n_proy} proyek tercatat; skor 5 x persentil, 0 bila tidak ada (tinggi = lebih bermasalah). Kasus hukum dan utang belum tercakup.`, `${f1(m.risiko)} MW cancelled or shelved across ${e.n_proy} recorded projects; score 5 x percentile, 0 if none (high = more problematic). Legal cases and debt are not yet covered.`, [...gs, ...sumPr(e).slice(0, 1)]);
  }
  // keuangan: sub-ukuran dengan >= NMIN pemain; pemain butuh >= 2 sub-ukuran
  const finVals = (k) => A.map((e) => e.fin.find((f) => f.metrik === k)?.idr_t).filter((v) => v != null);
  const pakai = METRIK.map(([k]) => k).filter((k) => finVals(k).length >= NMIN);
  for (const e of A) {
    const ps = pakai.map((k) => { const f = e.fin.find((x) => x.metrik === k); return f ? persentil(finVals(k), f.idr_t) : null; }).filter((v) => v != null);
    const src = e.fin.map((f) => ({ judul: 'Laporan keuangan emiten ' + f.metrik + ' ' + f.tahun, url: f.sumber_url, tanggal: f.tanggal }));
    if (ps.length < 2) set(e, 'keuangan', null, null, 'rp-t', 'Belum ada dua angka keuangan terbit (pendapatan, laba) yang bersumber untuk pemain ini.', 'Fewer than two sourced financial figures (revenue, profit) are published for this player.', src);
    else { const s = 5 * (ps.reduce((a, b) => a + b, 0) / ps.length); set(e, 'keuangan', s, null, 'rp-t', `Rata-rata persentil ${pakai.join(' dan ')} tahun terbit terbaru; USD dikonversi ke rupiah pada kurs ${kurs.usd_idr} (${kurs.tanggal}). Skor 5 x rata-rata.`, `Mean percentile of ${pakai.join(' and ')} for the latest published year; USD converted at ${kurs.usd_idr} IDR (${kurs.tanggal}). Score 5 x mean.`, src, true); }
    // keterbukaan
    const pf = profil[e.id], hal = pf?.halaman || {};
    if (!pf || !e.o.org) set(e, 'keterbukaan', null, null, 'poin', 'Situs resmi pemain ini belum diperiksa untuk halaman investor, keberlanjutan, dan manajemen.', "This player's official site has not been checked for investor, sustainability and management pages.", []);
    else {
      const b = [e.o.org.kode_saham ? 1 : 0, e.fin.length ? 1 : 0, hal.investor ? 1 : 0, hal.keberlanjutan ? 1 : 0, hal.manajemen ? 1 : 0], n = b.reduce((x, y) => x + y, 0);
      set(e, 'keterbukaan', n, n, 'poin', `${n} dari 5: tercatat di bursa ${b[0]}, angka keuangan terbit ${b[1]}, halaman investor ${b[2]}, halaman keberlanjutan ${b[3]}, halaman manajemen ${b[4]}.`, `${n} of 5: exchange-listed ${b[0]}, published financials ${b[1]}, investor page ${b[2]}, sustainability page ${b[3]}, management page ${b[4]}.`, [...Object.values(hal).filter((u) => typeof u === 'string' && /^https:/.test(u)).slice(0, 3).map((u) => ({ judul: 'Situs resmi', url: u, tanggal: pf.tanggal_periksa || TGL })), ...src.slice(0, 1)]);
    }
  }
  // peringkat
  const UK = ['kapasitas', 'pipeline', 'porsi', 'keuangan', 'prioritas', 'keaktifan', 'keterbukaan', 'risiko'];
  for (const k of UK) {
    const v = A.map((e) => SK[e.id][k].skor).filter((x) => x != null);
    for (const e of A) { const s = SK[e.id][k]; if (s.skor != null) { s.peringkat = peringkat(v, s.skor); s.dari = v.length; } }
  }

  // ---- kepemilikan: pohon ----
  const nm = (id) => E.get(id)?.nama || kurasi.simpul_luar[id]?.nama || id;
  const sisi = kurasi.kepemilikan.map((s) => ({ induk: s.induk, anak: s.anak, persen: s.persen, judul: s.judul, url: s.url, tanggal: s.tanggal }));
  const simpul_luar = {};
  for (const s of sisi) for (const id of [s.induk, s.anak]) if (!E.has(id)) simpul_luar[id] = { nama: nm(id), kategori: kurasi.simpul_luar[id]?.kategori || 'lainnya' };

  // ---- aliran pendapatan ----
  const aliran = {};
  for (const [id, a] of Object.entries(kurasi.aliran)) {
    const e = E.get(id); if (!e) continue;
    const f = e.o.org.keuangan.find((x) => x.metrik === 'pendapatan konsesi PLTA');
    if (!f) continue;
    const tot = e.o.org.keuangan.find((x) => x.metrik === 'pendapatan');
    aliran[id] = { tahun: tot.tahun, satuan: tot.satuan, total: tot.nilai, lini: [{ kunci: 'konsesi_plta', nilai: f.nilai, sumber_url: f.sumber_url, tanggal: f.tanggal }, { kunci: 'lain', nilai: bulat(tot.nilai - f.nilai, 2), est: true, sumber_url: tot.sumber_url, tanggal: tot.tanggal }] };
  }

  const entitas = A.map((e) => {
    const logo = logoOrg(e.id, e.nama).find((u) => adaLogo(u)) || null;
    return { id: e.id, nama: e.nama, kategori: e.kategori, di_direktori: e.di_direktori, peran: e.peran, teknologi: e.tek, logo, kapasitas_mw: e.m.kapasitas == null ? null : bulat(e.m.kapasitas, 1), pipeline_mw: e.m.pipeline == null ? null : bulat(e.m.pipeline, 1), keuangan: e.fin, aliran: aliran[e.id] || null, skor: SK[e.id] };
  }).sort((a, z) => (z.skor.kapasitas.skor ?? -1) - (a.skor.kapasitas.skor ?? -1) || a.nama.localeCompare(z.nama));

  const kunci = (b, i) => ({ id: b, en: i });
  return {
    lapis: 'publik', dibangun_pada: TGL, status_uji: 'hipotesis', jumlah: entitas.length, nmin: NMIN,
    kurs: { usd_idr: kurs.usd_idr, tanggal: kurs.tanggal, sumber: kurs.sumber },
    ukuran: [
      { kunci: 'kapasitas', arah: 'tinggi-baik', rumus: kunci('5 x persentil dari kapasitas EBT beroperasi (MW) milik pemain; bagian kepemilikan proyek menurut GEM atau proyek.json, ambil yang terbesar agar tidak dihitung dua kali. Pemilik tanpa persen berbagi sisa rata (EST).', '5 x percentile of operating renewable capacity (MW) attributed to the player; ownership shares from GEM or proyek.json, the larger of the two to avoid double counting. Owners without a stated share split the remainder equally (EST).') },
      { kunci: 'pipeline', arah: 'tinggi-baik', rumus: kunci('5 x persentil dari MW EBT berstatus konstruksi, pra-konstruksi, diumumkan, atau rencana (RUPTL).', '5 x percentile of renewable MW in construction, pre-construction, announced or planned (RUPTL) status.') },
      { kunci: 'porsi', arah: 'tinggi-baik', rumus: kunci('5 x (MW EBT beroperasi / (MW EBT + MW batubara beroperasi)). Gas dan minyak belum tercatat, jadi porsi condong tinggi.', '5 x (operating renewable MW / (renewable MW + operating coal MW)). Gas and oil are not yet recorded, so the share leans high.') },
      { kunci: 'keuangan', arah: 'tinggi-baik', rumus: kunci('5 x rata-rata persentil pendapatan, laba, dan aset tahun terbit terbaru; hanya ukuran yang punya sedikitnya 5 pemain, dan pemain butuh sedikitnya 2. USD dikonversi pada kurs di atas (EST).', '5 x mean percentile of revenue, profit and assets of the latest published year; only measures with at least 5 players, and a player needs at least 2. USD converted at the rate above (EST).') },
      { kunci: 'prioritas', arah: 'tinggi-baik', rumus: kunci('5 x persentil dari (2 x jumlah proyek tertaut PSN, JETP, PLTS 100 GW, atau WTE + jumlah proyek tertaut RUPTL).', '5 x percentile of (2 x number of projects linked to PSN, JETP, 100 GW solar or WTE + number of projects linked to RUPTL).') },
      { kunci: 'keaktifan', arah: 'tinggi-baik', rumus: kunci('5 x persentil dari (jumlah proyek berjalan atau berencana + 2 x jumlah berita 24 bulan yang judulnya memuat nama pemain).', '5 x percentile of (number of active or planned projects + 2 x number of news items in 24 months whose headline names the player).') },
      { kunci: 'keterbukaan', arah: 'tinggi-baik', rumus: kunci('Jumlah dari 5 butir: tercatat di bursa, angka keuangan terbit, halaman investor, halaman keberlanjutan, halaman manajemen di situs resmi.', 'Count of 5 items: exchange-listed, published financials, investor page, sustainability page, management page on the official site.') },
      { kunci: 'risiko', arah: 'tinggi-buruk', rumus: kunci('5 x persentil dari MW proyek EBT yang dibatalkan atau ditunda (GEM, proyek.json); 0 bila tidak ada. Skor tinggi = lebih bermasalah. Kasus hukum, gagal COD resmi, dan utang belum tercakup.', '5 x percentile of renewable project MW cancelled or shelved (GEM, proyek.json); 0 if none. High score = more problematic. Legal cases, official COD failures and debt are not yet covered.') },
    ],
    pasangan: [['kapasitas', 'pipeline'], ['porsi', 'kapasitas'], ['keuangan', 'prioritas'], ['keaktifan', 'keterbukaan'], ['risiko', 'prioritas']],
    entitas, sisi, simpul_luar,
    sumber: [
      ...Object.entries(GEM_URL).map(([f, url]) => ({ id: 'gem-' + f, judul: 'Global Energy Monitor, ' + f + ' tracker', url, lisensi: 'CC BY 4.0', rilis: gem[f].rilis })),
      { id: 'proyek', judul: 'Data proyek METI', url: '/data/proyek.json', tanggal: TGL }, { id: 'organisasi', judul: 'Sensus organisasi METI', url: '/data/organisasi.json', tanggal: TGL },
    ],
  };
}

export function muat() {
  const profilDasar = J('data/direktori/profil_org.json').baris, pend = J('public/data/pendanaan.json');
  const gem = {}; for (const f of ['solar', 'wind', 'hydropower', 'geothermal', 'coal']) gem[f] = J(`data/gem/${f}.json`);
  return { organisasi: J('public/data/organisasi.json').baris, proyek: J('public/data/proyek.json').baris, berita: J('public/data/berita.json').baris, kurs: pend.kurs, gem, profil: profilDasar, kurasi: J('data/kuadran/skor_kurasi.json'), adaLogo: (u) => fs.existsSync(R + 'public' + u) };
}

if (import.meta.url === 'file://' + process.argv[1]) {
  if (process.argv.includes('--selftest')) {
    const v = [0, 150, 150, 600, 2000]; // ALGORITMA §5.1
    const ok = persentil(v, 600) === 0.7 && persentil(v, 150) === 0.4 && persentil(v, 0) === 0.1 && persentil(v.slice(0, 3), 1) === null && peringkat(v, 150) === 3 && median([2, 1, 3]) === 2;
    if (!ok) throw new Error('selftest gagal');
    console.log('selftest ok');
  } else {
    const d = bangun(muat());
    fs.writeFileSync(R + 'public/data/kuadran.json', JSON.stringify(d));
    console.log('kuadran.json:', d.jumlah, 'pemain,', d.sisi.length, 'sisi kepemilikan');
  }
}
