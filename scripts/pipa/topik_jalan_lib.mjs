// Bab 43 (Jalan proyek) dan bab 44 (Model bisnis) untuk topik teknologi: dibangun dari topik_jalan_data.mjs + data repo, tanpa jaringan.
// Dipanggil dari susun/bangun tiap topik lewat tambahJalanModel(d, idTopik). Idempoten: menimpa bab 43 dan 44.
// Biaya per tahap dan arus kas dibaca dari public/data/biaya_bangun.json BILA ADA (bentuk di bawah); bila tidak, kunci dicatat dan biaya kosong (tidak dikarang).
//   biaya_bangun.json: { baris: [ { teknologi, skala, tahap?, min, maks, satuan, capex_rp_per_kw?, opex_persen_capex?, fk_persen?, umur_tahun?, sumber_id?, tingkat_bukti? } ] }
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TAHAP, TEK, MODEL, MODEL_TEK, DUNIA } from './topik_jalan_data.mjs';
import { oid, rid, jid } from './topik_dalam_lib.mjs';

const akar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (p) => { try { return JSON.parse(fs.readFileSync(path.join(akar, p), 'utf8')); } catch { return null; } };
const T = (p) => ({ id: p[0], en: p[1] });
const REG = baca('public/data/regulasi.json').baris;
const ORG = baca('public/data/organisasi.json').baris;
export const TGL = '2026-11-08';
const BIAYA = baca('public/data/biaya_bangun.json');
const LISTRIK = baca('public/data/biaya_listrik.json');
const HITUNG = baca('public/data/plts_atap_hitung.json');
const PSEL = baca('public/data/psel.json'), WTE = baca('public/data/global/pemasok_wte.json');
/* rujukan khusus sampah: jumlah dibaca dari berkas, bukan diketik */
const rujukWte = () => (PSEL && WTE ? [[`Rujukan data: berkas PSEL METI memuat ${PSEL.jumlah} lokasi PSEL beserta pengembangnya dan berkas pemasok teknologi WTE global memuat ${WTE.jumlah} pemasok (public/data/psel.json, public/data/global/pemasok_wte.json). Tarif di berkas PSEL adalah ketentuan regulasi, bukan harga PPA proyek; tipping fee proyek kosong sampai ada sumber.`, `Data references: the METI PSEL file holds ${PSEL.jumlah} PSEL sites with their developers and the global WTE technology supplier file holds ${WTE.jumlah} suppliers (public/data/psel.json, public/data/global/pemasok_wte.json). Tariffs in the PSEL file are regulatory provisions, not project PPA prices; project tipping fees are empty until sourced.`]] : []);

const KUNCI_SRC = {
  jm_p112: { judul: 'Perpres 112/2022 tentang Percepatan Pengembangan Energi Terbarukan untuk Penyediaan Tenaga Listrik (harga patokan, 90/180 hari, pasal 5 sampai 27)', penerbit: 'Pemerintah RI (BPK JDIH)', url: 'https://peraturan.bpk.go.id/Details/225308', tanggal: '2026-11-07', tahun: 2022, bukti: 'resmi' },
  jm_izin: { judul: 'Izin dan kontrak listrik EBT: IUPTLU 30 tahun, IUPTLS 10 tahun, ambang 500 kW (public/data/izin_kontrak.json; Permen ESDM 11/2021, 2/2024)', penerbit: 'Pemerintah RI via BPK JDIH', url: 'https://peraturan.bpk.go.id/Details/175261', tanggal: '2026-11-07', tahun: 2021, bukti: 'resmi' },
  jm_ed: { judul: 'Kisaran lama tahap dan penilaian model bisnis: analisis METI berdasarkan pola proyek (Hipotesis; bukan angka resmi)', penerbit: 'METI', url: 'https://platformmeti.timitbnpb.workers.dev/metode', tanggal: TGL, tahun: 2026, bukti: 'editorial' },
  jm_amdal: { judul: 'AMDALNET: pengumuman AMDAL tertaut proyek PLTA/PLTM (public/data/amdal.json, lead time ke COD target)', penerbit: 'Kementerian Lingkungan Hidup (AMDALNET)', url: 'https://amdalnet.kemenlh.go.id/', tanggal: '2026-11-08', tahun: 2026, bukti: 'resmi' },
  jm_psel: { judul: 'Basis PSEL dan pemasok teknologi WTE METI (public/data/psel.json, public/data/global/pemasok_wte.json)', penerbit: 'METI', url: 'https://platformmeti.timitbnpb.workers.dev/data', tanggal: '2026-11-08', tahun: 2026, bukti: 'editorial' },
  jm_biaya: { judul: 'Biaya bangun per teknologi dan skala (public/data/biaya_bangun.json)', penerbit: 'METI', url: 'https://platformmeti.timitbnpb.workers.dev/data', tanggal: TGL, tahun: 2026, bukti: 'editorial' },
  jm_tarif: { judul: 'Tarif tenaga listrik PLN triwulan dan BPP nasional (public/data/plts_atap_hitung.json, biaya_listrik.json)', penerbit: 'Kementerian ESDM dan PLN', url: 'https://www.esdm.go.id/', tanggal: '2026-11-08', tahun: 2026, bukti: 'resmi' },
};

const uOrg = (id) => (id ? '/o/' + id : undefined);
const KODE_REG = { uu: 'UU', perppu: 'Perppu', pp: 'PP', perpres: 'Perpres', keppres: 'Keppres', inpres: 'Inpres', permen: 'Permen' };
const regRef = (id) => { const r = REG.find((x) => x.id === id); if (!r) return null; return { id, label: (KODE_REG[r.jenis] || r.jenis) + (r.jenis === 'permen' && /^permen-esdm/.test(id) ? ' ESDM' : '') + ' ' + r.nomor + '/' + r.tahun, u: '/regulasi?id=' + id, status: r.status }; };
const pihakRef = (p) => { // p = [id,en] nama bebas, atau [idOrg]
  if (p.length === 1) { const o = ORG.find((x) => x.id === p[0]); return o ? { nama: o.singkatan || o.nama, id: o.id, u: uOrg(o.id) } : null; }
  return { nama: { id: p[0], en: p[1] } };
};

/* ---------- biaya_bangun.json: pemetaan (teknologi, kunci skala topik) -> id skala di berkas; hanya angka bersumber, sisanya kosong ---------- */
const PETA_BIAYA = { 'surya/atap': 'plts-atap-rumah', 'surya/ci': 'plts-atap-industri', 'surya/utilitas': 'plts-utilitas-dunia', 'bayu/utilitas': 'pltb-dunia', 'panas-bumi/utilitas': 'pltp-indonesia', 'hidro/mikro': 'pltm-asia-lain', 'hidro/mini': 'pltm-asia-lain', 'hidro/besar': 'plta-dunia', 'bioenergi/biomassa': 'bioenergi-dunia', 'sampah-energi/psel': 'pltsa-psel-bandung', 'penyimpanan/utilitas': 'bess-global' };
// umur ekonomis: tidak ada di berkas biaya; asumsi Hipotesis METI, hanya untuk arus kas ilustratif
const UMUR = { surya: 25, bayu: 25, 'panas-bumi': 30, hidro: 40 };
const rata = (...v) => { const x = v.filter((n) => Number.isFinite(n)); return x.length ? x.reduce((a, c) => a + c, 0) / x.length : null; };
const buktiRp = (t) => (t === 'resmi' || t === 'EST' ? 'EST' : 'Hipotesis'); // kolom Rp = USD x kurs Hipotesis -> EST; sumber hipotesis tetap Hipotesis
const cariBiaya = (tek, skala) => {
  const sk = (BIAYA?.skala || []).find((x) => x.id === PETA_BIAYA[tek + '/' + skala]); if (!sk) return null;
  const c = sk.capex_rp_juta_kw; if (!c || c.tengah == null && c.rendah == null) return null;
  const kwUsd = sk.capex_usd_kw?.tengah, op = sk.opex || {};
  const opexPersen = op.persen_capex_per_tahun ? (op.persen_capex_per_tahun.nilai ?? rata(op.persen_capex_per_tahun.rendah, op.persen_capex_per_tahun.tinggi)) : op.usd_kw_tahun?.tengah != null && kwUsd ? (op.usd_kw_tahun.tengah / kwUsd) * 100 : null;
  return { id: sk.id, rendah: c.rendah ?? null, tengah: c.tengah ?? null, tinggi: c.tinggi ?? null, bukti: buktiRp(c.tingkat_bukti), sumber: c.sumber_id, cf: sk.cf_persen?.tengah ?? null, opexPersen, bulan: sk.waktu_bangun?.bulan ?? (sk.waktu_bangun?.bulan_rendah != null ? [sk.waktu_bangun.bulan_rendah, sk.waktu_bangun.bulan_tinggi] : null) };
};

/* ---------- jadwal ---------- */
export function jadwal(tahap, skalaK, tingkat) {
  const ada = tahap.filter((t) => t.dur[skalaK]);
  const mn = {}, mx = {};
  for (const t of ada) {
    const dep = t.dep.filter((d) => mn[d] != null);
    const sm = dep.length ? Math.max(...dep.map((d) => mn[d].akhir)) : 0, sx = dep.length ? Math.max(...dep.map((d) => mx[d].akhir)) : 0;
    mn[t.id] = { mulai: sm, akhir: sm + t.dur[skalaK][0] }; mx[t.id] = { mulai: sx, akhir: sx + t.dur[skalaK][1] };
  }
  const akhirMin = Math.max(...Object.values(mn).map((x) => x.akhir)), akhirMax = Math.max(...Object.values(mx).map((x) => x.akhir));
  return { mn, mx, total: [akhirMin, akhirMax] };
}

/* ---------- arus kas ilustratif (dihitung hanya bila biaya_bangun memberi masukan) ---------- */
export function irr(arus) {
  let lo = -0.9, hi = 1; const f = (r) => arus.reduce((s, c, t) => s + c / (1 + r) ** t, 0);
  if (f(lo) * f(hi) > 0) return null;
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; }
  return (lo + hi) / 2;
}
export function arusKas({ capexRpKw, opexPersen, fk, umur, harga, degradasi = 0.005, eskalasi = 0, pajak = 0 }) {
  const arus = [-capexRpKw]; let kum = -capexRpKw; const kumulatif = [kum]; let payback = null;
  for (let t = 1; t <= umur; t++) {
    const kwh = 8760 * fk * (1 - degradasi) ** (t - 1);
    const pend = kwh * harga * (1 + eskalasi) ** (t - 1), opex = capexRpKw * opexPersen;
    const cf = (pend - opex) * (1 - pajak * (pend - opex > 0 ? 1 : 0));
    arus.push(cf); kum += cf; kumulatif.push(kum);
    if (payback == null && kum >= 0) payback = t - 1 + (kum - cf < 0 ? -(kum - cf) / cf : 0);
  }
  return { arus, kumulatif, irr: irr(arus), payback };
}
const tarifRef = () => {
  const bpp = (LISTRIK?.bpp_nasional || []).slice().sort((a, b) => b.tahun - a.tahun)[0];
  const tr = (HITUNG?.tarif || []);
  const cari = (re) => tr.find((x) => re.test(x.golongan));
  return { bpp: bpp?.rp_kwh ?? null, tarifB2: cari(/^B-2/)?.tarif_idr_per_kwh ?? null, tarifB3: cari(/^B-3/)?.tarif_idr_per_kwh ?? null, tarifR: cari(/^R-1/)?.tarif_idr_per_kwh ?? null };
};

/* ---------- bab 43 ---------- */
function bab43(id) {
  const k = TEK[id]; if (!k) return null;
  const skala = k.skala.map(([kk, tg, l, ket]) => ({ k: kk, tingkat: tg, l: T(l), ket: T(ket) }));
  const tahap = TAHAP.map((t) => {
    const o = k.ov[t.id] || {};
    const dur = {};
    for (const s of skala) { const dd = o.dur && s.tingkat in o.dur ? o.dur[s.tingkat] : t.dur[s.tingkat]; dur[s.k] = dd && !(t.id === 'cod') ? dd : t.id === 'cod' ? [0, 0] : null; }
    const bukti = o.bukti || 'Hipotesis';
    const pihak = (t.pihak || []).map(pihakRef).filter(Boolean);
    const regs = [...new Set([...(t.reg || []), ...(o.reg || [])])].map(regRef).filter(Boolean);
    return {
      id: t.id, nama: T(o.nama || t.nama), isi: T(o.isi || t.isi), pihak, reg: regs,
      risiko: T(o.risiko || t.risiko), mitigasi: T(o.mitigasi || t.mitigasi), bukti, dur,
      biaya: Object.fromEntries(skala.map((s) => { const b = t.id === 'epc' ? cariBiaya(id, s.k) : null; return [s.k, b ? { min: b.rendah ?? b.tengah, maks: b.tinggi ?? b.tengah, satuan: 'Rp juta per kW (biaya modal total, tidak dipisah per tahap)', bukti: b.bukti } : null]; })),
      kunciBiaya: `biaya_bangun:${id}:${t.id}`,
    };
  });
  // mulai/akhir per skala
  const total = {};
  for (const s of skala) {
    const j = jadwal(tahap.map((t) => ({ id: t.id, dep: TAHAP.find((x) => x.id === t.id).dep, dur: t.dur })), s.k, s.tingkat);
    total[s.k] = j.total;
    for (const t of tahap) if (t.dur[s.k]) { (t.mulai ||= {})[s.k] = [j.mn[t.id].mulai, j.mn[t.id].akhir, j.mx[t.id].akhir]; }
  }
  const ada = skala.map((s) => s.l.id.split(' (')[0]).join(', ');
  const intro = [
    [`Bab ini memetakan jalan sebuah proyek ${id.replace('-', ' ')} dari gagasan sampai operasi komersial (COD), tahap demi tahap, untuk skala: ${ada}. Setiap tahap memuat kisaran lama, biaya (dari berkas biaya bangun METI bila sudah tersedia), pihak terlibat, regulasi, risiko utama, dan cara mitigasinya. Bab 44 membahas model bisnis yang mengisi tahap pendanaan dan pendapatan.`, `This chapter maps the path of a ${id.replace('-', ' ')} project from idea to commercial operation (COD), stage by stage, for these scales: ${ada}. Each stage lists the duration range, cost (from the METI build-cost file when available), parties involved, regulations, main risks and mitigation. Chapter 44 covers the business models that fill the financing and revenue stages.`],
    ['Cara membaca lama tahap: kisaran bulan berlabel Hipotesis adalah penilaian METI dari pola proyek dan belum tervalidasi per proyek; label Data berarti batas yang tertulis di peraturan (misalnya 90 atau 180 hari kalender sampai PPA menurut Perpres 112/2022); label EST berarti hitungan dari data repo. Tahap tertentu berjalan paralel sehingga total bukan penjumlahan semua tahap.', 'How to read stage durations: month ranges labelled Hypothesis are METI judgement from project patterns and not yet validated per project; the Data label means a limit written in regulation (for example 90 or 180 calendar days to PPA under Presidential Reg. 112/2022); EST means a calculation from repository data. Some stages run in parallel so the total is not the sum of all stages.'],
  ].concat(id === 'sampah-energi' ? rujukWte() : []).map(T);
  const modal = Object.fromEntries(skala.map((s) => { const b = cariBiaya(id, s.k); return [s.k, b ? { rendah: b.rendah, tengah: b.tengah, tinggi: b.tinggi, satuan: 'Rp juta per kW', bukti: b.bukti, skala_biaya: b.id, bulan_bangun: b.bulan } : null]; }));
  return {
    tipe: 'jalan', sumber: ['jm_ed', 'jm_p112', 'jm_izin', ...(id === 'hidro' ? ['jm_amdal'] : []), 'jm_biaya'],
    intro, skala, tahap, total, modal, bukti: ['Data', 'EST', 'Hipotesis'],
    catatan: T(['Biaya per tahap diambil dari public/data/biaya_bangun.json dengan kunci teknologi, skala, dan tahap. Bila berkas atau barisnya belum ada, kolom biaya kosong; METI tidak mengisi angka karangan. Urutan dan ketergantungan tahap bersifat umum; proyek nyata sering menumpuk atau menukar tahap.', 'Costs per stage come from public/data/biaya_bangun.json by technology, scale and stage key. If the file or row is missing, the cost column stays empty; METI does not fill invented numbers. Stage order and dependencies are generic; real projects often overlap or swap stages.']),
  };
}

/* ---------- bab 44 ---------- */
function resolveContoh(id, mid) {
  const arr = MODEL_TEK[id]?.contoh?.[mid] || [];
  return arr.map((re) => {
    const pr = jid(re); if (pr) { const nm = baca('public/data/proyek.json').baris.find((x) => x.id === pr)?.nama; return { nama: nm || re, id: pr, u: '/p/' + pr }; }
    const o = oid(re); if (o) { const org = ORG.find((x) => x.id === o); return { nama: org?.nama || re, id: o, u: '/o/' + o }; }
    return null;
  }).filter(Boolean);
}
function bab44(id, bab43d) {
  const mt = MODEL_TEK[id]; if (!mt) return null;
  const ta = tarifRef();
  const skalaK = bab43d.skala;
  const models = mt.ada.map((mid) => {
    const m = MODEL.find((x) => x.id === mid);
    return {
      id: m.id, jenis: m.jenis, nama: T(m.nama), isi: T(m.isi), pembeli: T(m.pembeli), kontrak: T(m.kontrak), status: T(m.status),
      reg: (m.reg || []).map(regRef).filter(Boolean), untung: T(m.untung), rugi: T(m.rugi), kas: T(m.kas),
      skor: { modal: m.skor[0], risiko: m.skor[1], cepat: m.skor[2], skala: m.skor[3] },
      contoh: resolveContoh(id, mid), dunia: T(DUNIA[mid]),
    };
  });
  // arus kas ilustratif: hanya bila biaya_bangun memberi capex, fk, opex, umur
  const seri = []; const ringkas = [];
  const sk = [...skalaK].reverse().find((x) => { const b = cariBiaya(id, x.k); return b && b.tengah && b.cf && b.opexPersen != null && UMUR[id] && x.tingkat === 'L'; });
  if (sk) {
    const b = cariBiaya(id, sk.k);
    for (const m of models.filter((x) => x.jenis === 'pendapatan' && ['ipp', 'captive', 'wheeling'].includes(x.id))) {
      const def = MODEL.find((x) => x.id === m.id);
      const harga = def.anchor && ta[def.anchor] ? ta[def.anchor] * (1 - def.diskon) : null; if (!harga) continue;
      const r = arusKas({ capexRpKw: b.tengah * 1e6, opexPersen: b.opexPersen / 100, fk: b.cf / 100, umur: UMUR[id], harga });
      seri.push({ nama: m.nama, sorot: m.id === 'ipp', titik: r.kumulatif.map((v, t) => [String(t), Math.round(v / 1000)]) });
      ringkas.push({ id: m.id, irr: r.irr == null ? null : Math.round(r.irr * 1000) / 10, payback: r.payback == null ? null : Math.round(r.payback * 10) / 10 });
    }
  }
  const kasInfo = {
    skala: sk?.k || null,
    seri, ringkas,
    label: T(['Arus kas kumulatif ilustratif per model pendapatan (satuan Rp ribu per kW)', 'Illustrative cumulative cash flow per revenue model (Rp thousand per kW)']),
    asumsi: T([`Harga jual per model memakai jangkar tarif repo (BPP nasional ${ta.bpp ?? '-'} Rp per kWh; tarif B-2 ${ta.tarifB2 ?? '-'}, B-3 ${ta.tarifB3 ?? '-'}, R-1 ${ta.tarifR ?? '-'} Rp per kWh, EST), diskon sewa atap 15 persen dan ESCO 10 persen (Hipotesis), degradasi 0,5 persen per tahun, tanpa pajak dan utang (arus kas proyek sebelum pajak). Biaya modal, faktor kapasitas, dan biaya operasi dari biaya_bangun.json (skala ${sk?.k || '-'}); umur proyek ${UMUR[id] ?? '-'} tahun adalah Hipotesis METI karena berkas tidak memuat umur. Harga adalah jangkar acuan, bukan harga PPA proyek.`, `Selling price per model uses repository tariff anchors (national BPP ${ta.bpp ?? '-'} Rp per kWh; B-2 tariff ${ta.tarifB2 ?? '-'}, B-3 ${ta.tarifB3 ?? '-'}, R-1 ${ta.tarifR ?? '-'} Rp per kWh, EST), a 15 percent rooftop-rental and 10 percent ESCO discount (Hypothesis), 0.5 percent per year degradation, and no tax or debt (pre-tax project cash flow). Cost inputs (capex, capacity factor, operating cost) from biaya_bangun.json scale ${sk?.k ? 'the ' + sk.k + ' scale' : ''}; project life ${UMUR[id] ?? '-'} years is a METI Hypothesis because the file holds no life. Prices are reference anchors, not project PPA prices.`]),
    menunggu: T(['Grafik arus kas, IRR, dan payback belum dihitung karena public/data/biaya_bangun.json belum memuat biaya modal, faktor kapasitas, dan biaya operasi bersumber untuk skala utilitas teknologi ini (atau teknologinya tidak punya sumber terbuka yang terbaca). Begitu berkas itu terisi, bangun ulang topik dan angka muncul otomatis; METI tidak memasukkan angka karangan.', 'The cash-flow chart, IRR and payback are not computed because public/data/biaya_bangun.json does not yet hold sourced capital cost, capacity factor and operating cost for the utility scale of this technology (or no open source could be read). Once the file is filled, rebuild the topic and the numbers appear automatically; METI does not enter invented figures.']),
  };
  return {
    tipe: 'model', sumber: ['jm_ed', 'jm_p112', 'jm_izin', 'jm_tarif', 'jm_biaya'],
    intro: [
      [`Model bisnis menentukan siapa membayar apa, kapan, dan siapa menanggung risiko. ${mt.catatan[0]}`, `A business model decides who pays what, when, and who carries the risk. ${mt.catatan[1]}`],
      ['Dua golongan dibahas terpisah: model pendapatan (dari mana uang proyek datang) dan model pembiayaan (dari mana modal datang). Penilaian skor 1 sampai 5 pada matriks adalah Hipotesis METI untuk perbandingan cepat, bukan ukuran statistik.', 'Two groups are covered separately: revenue models (where project money comes from) and financing models (where capital comes from). The 1-to-5 scores in the matrix are METI Hypothesis for quick comparison, not statistical measures.'],
    ].concat(id === 'sampah-energi' ? rujukWte() : []).map(T),
    models, kas: kasInfo, bukti: 'Hipotesis',
    catatan: T(['Contoh Indonesia dipilih dari proyek dan organisasi di basis METI dan ditautkan bila ada; status regulasi mengikuti basis regulasi METI pada 8 November 2026. Power wheeling belum berlaku penuh: periksa status terbaru sebelum memakainya dalam model.', 'Indonesian examples are chosen from projects and organisations in the METI base and linked when present; regulatory status follows the METI regulation base as of 8 November 2026. Power wheeling is not yet fully in force: check the latest status before using it in a model.']),
  };
}

/* ---------- pintu masuk ---------- */
export function tambahJalanModel(d, id) {
  const b43 = bab43(id); if (!b43) return d;
  const b44 = bab44(id, b43);
  for (const k of ['jm_p112', 'jm_izin', 'jm_ed', 'jm_tarif', 'jm_biaya']) d.sumber[k] = { ...KUNCI_SRC[k] };
  if (id === 'sampah-energi') { d.sumber.jm_psel = { ...KUNCI_SRC.jm_psel }; b43.sumber.push('jm_psel'); b44.sumber.push('jm_psel'); }
  if (b43.sumber.includes('jm_amdal')) d.sumber.jm_amdal = { ...KUNCI_SRC.jm_amdal };
  d.bab['43'] = b43; d.bab['44'] = b44;
  return d;
}
export { rid };
