/* Hitungan murni halaman /strategi (Kajian strategis EBT Indonesia). Tanpa DOM, tanpa AI, deterministik: masukan sama, keluaran sama.
   Semua keluaran TURUNAN dari data sumber di public/data; tampil berpil EST dan kesimpulan berlabel "Analisis METI (Hipotesis)".
   Diuji di tests/strategi.test.mjs dengan angka acuan. Tiap fungsi menerima paket data D (JSON apa adanya) dan acuan waktu ref ({ tahun }). */

export const TEK = ["surya", "bayu", "hidro", "mikrohidro", "panas-bumi", "bioenergi", "sampah", "penyimpanan"];
export const GRUP_EBT = ["hidro", "panas-bumi", "surya", "bayu", "bioenergi"];
const BOBOT = { sisa: 25, tarif: 15, ruptl: 20, atap: 10, rued: 10, risiko: 15, dana: 15 };
export const BOBOT_PETA = BOBOT;
const BATAS_MIKRO_MW = 10;
const SOSIAL = /\b(tolak|menolak|penolakan|protes|demo|konflik|sengketa|ganti rugi|ganti untung|lahan warga|dampak sosial|mangkrak|gagal)\b/i;
const BATAL = /\b(batal|dibatalkan|pembatalan|ditunda|penundaan|mundur|terhenti|mangkrak)\b/i;
const RESMI = /\b(peresmian|diresmikan|meresmikan|groundbreaking|peletakan batu pertama|beroperasi komersial|COD)\b/i;
const PPA = /\b(PPA|power purchase|jual beli listrik|perjanjian jual beli|kontrak)\b/i;
const LELANG = /\b(lelang|tender|penawaran|pengadaan)\b/i;

/* ---------- dasar ---------- */
export const bulatkan = (v, d = 1) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
export const jumlah = (a) => a.reduce((s, x) => s + (Number.isFinite(x) ? x : 0), 0);
export const median = (a) => {
  const u = a.filter(Number.isFinite).sort((x, z) => x - z);
  if (!u.length) return null;
  const m = u.length >> 1;
  return u.length % 2 ? u[m] : (u[m - 1] + u[m]) / 2;
};
/** Persentil 0-100 (definisi indeks.json): (jumlah lebih kecil + setengah jumlah seri lain) / (n - 1) x 100. */
export function persentil(v, daftar) {
  const a = daftar.filter(Number.isFinite);
  if (a.length < 2 || !Number.isFinite(v)) return null;
  let kecil = 0, sama = 0;
  for (const x of a) { if (x < v) kecil++; else if (x === v) sama++; }
  return ((kecil + (sama - 1) / 2) / (a.length - 1)) * 100;
}
/** Regresi linear kuadrat terkecil: { a, b } untuk y = a + b x. */
export function regresi(xs, ys) {
  const n = xs.length;
  if (n < 2) return null;
  const mx = jumlah(xs) / n, my = jumlah(ys) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  if (!sxx) return null;
  const b = sxy / sxx;
  return { a: my - b * mx, b };
}
/** Indeks Herfindahl-Hirschman 0-10000 dari daftar ukuran (MW) per pemain. */
export function hhi(ukuran) {
  const a = ukuran.filter((x) => x > 0), tot = jumlah(a);
  return tot ? bulatkan(jumlah(a.map((x) => (x / tot) * 100 * ((x / tot) * 100))), 0) : null;
}
export const kelasHhi = (h) => (h == null ? null : h >= 2500 ? "tinggi" : h >= 1500 ? "sedang" : "rendah");

export const mwProyek = (p) => {
  const k = (p.kapasitas || []).find((x) => x.satuan === "MW" || x.satuan === "MWp");
  return k && Number.isFinite(k.nilai) ? k.nilai : null;
};
/** Teknologi kolom matriks: hidro sampai 10 MW = mikrohidro (EST); biomassa-sampah = sampah; nuklir di luar matriks. */
export function tekPeta(tek, mw) {
  if (tek === "hidro") return mw != null && mw <= BATAS_MIKRO_MW ? "mikrohidro" : "hidro";
  if (tek === "biomassa-sampah") return "sampah";
  return TEK.includes(tek) ? tek : null;
}
const statusProyek = (p) => p.status?.[0]?.nilai || null;
export const codAkhir = (p) => { const y = (p.cod_target || []).map((c) => c.nilai).filter(Number.isFinite); return y.length ? Math.max(...y) : null; };
const provProyek = (p) => p.lokasi?.provinsi || null;
const PEMILIK_UMUM = /^(IPP|SH-PLN|PLN|swasta|belum|tidak diketahui)$/i;
export const pemilikNama = (p) => [...new Set((p.pihak?.pemilik || []).map((x) => x.nilai).filter((n) => n && !PEMILIK_UMUM.test(String(n).trim().replace(/\s*\(IPP\)$/i, "").trim()) && !/^IPP$/i.test(n)).map(namaBakuPemilik))];

/** Golongan pemilik dari nama (EST): bumn, asing, swasta. Daftar nama BUMN dan kata badan hukum asing bersifat heuristik dan terbuka. */
const BUMN = /\b(PLN|Perusahaan Listrik Negara|Indonesia Power|Pembangkitan Jawa Bali|PJB|Pertamina|Geo Dipa|Inalum|PGE|Antam|Bukit Asam)\b/i;
const ASING = /\b(Ltd|Pte|PCL|PLC|Inc|Corp|GmbH|S\.?A\.?|Co\.?,? Ltd|ENGIE|Masdar|Marubeni|Sumitomo|Kansai|Tohoku|Korea|Posco|Ormat|INPEX|ACEN|AC Energy|Vena|Solar Philippines|Sarulla|Sembcorp|Mitsubishi|Mitsui|Jera|Equis|Acwa|EDF|Total|Enel)\b/i;
/** Nama pemilik baku untuk menyatukan ejaan ("PT. PLN", "PT PLN (Persero)", "Perusahaan Listrik Negara" jadi satu). */
export function namaBakuPemilik(nama) {
  const n = String(nama).replace(/\s*\((IPP|Persero)\)/gi, "").replace(/^PT\.?\s+/i, "PT ").replace(/\.\s*$/, "").replace(/\s+/g, " ").trim();
  if (/^(PT )?PLN$|^Perusahaan Listrik Negara$/i.test(n)) return "PT PLN";
  return n.replace(/^PT (Pembangkitan Jawa Bali)$/i, "PT $1").replace(/^PT Indonesia Power$/i, "PT PLN Indonesia Power").replace(/^PT PLN Nusantara Power PT$/i, "PT PLN Nusantara Power").replace(/^Barito Renewables$/i, "Barito Renewables Energy");
}
export const golonganPemilik = (nama) => (BUMN.test(nama) ? "bumn" : ASING.test(nama) ? "asing" : "swasta");

/* ---------- 1. kesenjangan target ---------- */
const IRENA = { hidro: ["air"], "panas-bumi": ["panas_bumi"], surya: ["surya"], bayu: ["bayu"], bioenergi: ["bioenergi_padat", "biogas", "sampah_terbarukan"] };
function seriIrena(kt, tek) {
  const per = {};
  for (const b of kt.baris) if ((IRENA[tek] || []).includes(b.teknologi)) per[b.tahun] = (per[b.tahun] || 0) + b.kapasitas_mw;
  return per;
}

export function kesenjangan(D, ref) {
  const T = D.target, laju = T.meta.laju_historis_mw_per_tahun_2015_2024;
  const real = [...T.realisasi.pembangkitan_ebt_persen].sort((a, b) => a.tahun - b.tahun);
  const rp = [...T.realisasi.energi_primer_ebt_persen_ei].sort((a, b) => a.tahun - b.tahun);
  const reg = regresi(real.map((r) => r.tahun), real.map((r) => r.nilai)), regP = regresi(rp.map((r) => r.tahun), rp.map((r) => r.nilai));
  const akhir = real.at(-1), akhirP = rp.at(-1);
  const rukn = T.target.find((x) => x.id === "rukn-2025-pembangkitan").seri;
  const tr = (T.target.find((x) => x.id === "ruptl-2034-bauran") || {});
  const defs = [
    { id: "rukn-2030", dok: "RUKN", tahun: 2030, target: rukn["2030"], ukuran: "pembangkitan" },
    { id: "ruptl-2034", dok: "RUPTL", tahun: 2034, target: tr.min, ukuran: "pembangkitan" },
    { id: "rukn-2040", dok: "RUKN", tahun: 2040, target: rukn["2040"], ukuran: "pembangkitan" },
    { id: "rukn-2050", dok: "RUKN", tahun: 2050, target: rukn["2050"], ukuran: "pembangkitan" },
    { id: "rukn-2060", dok: "NZE", tahun: 2060, target: rukn["2060"], ukuran: "pembangkitan" },
    ...["ken-2030-ebt-primer", "ken-2040-ebt-primer", "ken-2050-ebt-primer", "ken-2060-ebt-primer"].map((id) => { const g = T.target.find((x) => x.id === id); return { id, dok: "KEN", tahun: g.tahun_target, target: g.min, ukuran: "primer" }; }),
  ].filter((d) => d.target != null);
  const bauran = defs.map((d) => {
    const prim = d.ukuran === "primer", a = prim ? akhirP : akhir, r = prim ? regP : reg;
    const gap = d.target - a.nilai, sisaTahun = d.tahun - a.tahun, perlu = gap / sisaTahun;
    const tahunCapai = r && r.b > 0 ? a.tahun + Math.max(0, gap) / r.b : null;
    return { ...d, realisasi: a.nilai, tahun_real: a.tahun, gap: bulatkan(gap, 2), perlu_poin: bulatkan(perlu, 2), tren_poin: bulatkan(r?.b, 2), kali: r && r.b > 0 ? bulatkan(perlu / r.b, 1) : null, tahun_capai: tahunCapai == null ? null : Math.ceil(tahunCapai), terlambat: tahunCapai == null ? null : Math.ceil(tahunCapai) - d.tahun };
  });
  const kapasitas = T.celah.filter((c) => c.metode === "langsung").map((c) => {
    const g = T.target.find((x) => x.id === c.target_id), awal = c.tahun_awal ?? T.meta.tahun_dasar, per = c.per_tahun_mw;
    const butuh = c.celah_mw, tahunCapai = awal - 1 + butuh / laju;
    return { id: c.target_id, dok: g.dokumen.startsWith("ruptl") ? "RUPTL" : g.dokumen.startsWith("rukn") ? "RUKN" : "KEN", tahun: g.tahun_target ?? c.tahun_target, awal, celah_mw: butuh, perlu_mw: per, laju, kali: bulatkan(per / laju, 1), tahun_capai: Math.ceil(tahunCapai) };
  }).sort((a, b) => a.tahun - b.tahun);
  /* per teknologi: nilai RUPTL bernama (rencana + konstruksi) per teknologi vs laju historis IRENA 2015-2025 */
  const rup = D.ruptl.baris.filter((b) => b.status === "rencana" || b.status === "konstruksi");
  const namaMw = { hidro: 0, "panas-bumi": 0, surya: 0, bayu: 0, bioenergi: 0 };
  for (const b of rup) { const k = b.teknologi === "biomassa-sampah" ? "bioenergi" : b.teknologi; if (k in namaMw) namaMw[k] += b.kapasitas_mw || 0; }
  const periode = 10, tahunAwal = 2025;
  const perTek = GRUP_EBT.map((k) => {
    const s = seriIrena(D.kapasitas_tren, k), th = Object.keys(s).map(Number).sort((a, b) => a - b);
    const a = th.filter((y) => y >= 2015), z = th.at(-1), n = z - a[0];
    const laju10 = (s[z] - s[a[0]]) / n, lajuLima = (s[z] - s[z - 5]) / 5;
    const bernama = namaMw[k], perlu = bernama / periode;
    return { tek: k, kap_akhir: bulatkan(s[z], 0), tahun_akhir: z, laju10: bulatkan(laju10, 0), laju5: bulatkan(lajuLima, 0), bernama_mw: bulatkan(bernama, 0), perlu_mw: bulatkan(perlu, 0), kali: laju10 > 0 ? bulatkan(perlu / laju10, 1) : null, tahun_capai: laju10 > 0 ? Math.ceil(z + bernama / laju10) : null, tahun_target: tahunAwal + periode - 1 };
  }).sort((a, b) => (b.kali ?? 0) - (a.kali ?? 0));
  const totalEbt = T.celah.find((c) => c.target_id === "ruptl-2034-kapasitas")?.celah_mw ?? null;
  const bernamaTotal = jumlah(Object.values(namaMw));
  return { bauran, kapasitas, per_tek: perTek, laju, tren_bauran: bulatkan(reg?.b, 2), ruptl_total_mw: totalEbt, bernama_total_mw: bulatkan(bernamaTotal, 0), tidak_terperinci_mw: totalEbt == null ? null : bulatkan(totalEbt - bernamaTotal, 0), real };
}

/* ---------- 2. peta peluang provinsi x teknologi ---------- */
const KUNCI_POTENSI = { surya: "surya", bayu: "bayu", hidro: "hidro", mikrohidro: "mikrohidro", "panas-bumi": "panas_bumi", bioenergi: "bioenergi" };
const KUNCI_TARIF = { surya: "surya", bayu: "bayu", hidro: "hidro", mikrohidro: "mikrohidro", "panas-bumi": "panas_bumi", bioenergi: "bioenergi" };

/** Tingkat tarif Perpres 112: batas atas MW dari label ("s.d. 5 MW", ">1 MW s.d. 3 MW", ">100 MW"). Daftar bertingkat ganda (varian) dipotong pada label berulang. */
export function tarifPatokan(harga, tek, mw) {
  const k = KUNCI_TARIF[tek];
  if (!k || !harga.teknologi[k]) return null;
  let def = harga.teknologi[k];
  if (def.rujuk) def = harga.teknologi[def.rujuk];
  const lihat = new Set(), tingkat = [];
  for (const x of def.tingkat) { if (lihat.has(x.kapasitas)) break; lihat.add(x.kapasitas); tingkat.push(x); }
  const batas = (x) => { const m = /s\.d\.\s*([\d.,]+)\s*MW/.exec(x.kapasitas); return m ? Number(m[1].replace(",", ".")) : Infinity; };
  const u = tingkat.find((x) => (mw ?? 0) <= batas(x)) || tingkat.at(-1);
  return { sen_kwh: u.koef_1_10, tingkat: u.kapasitas };
}

export function denganPendanaan(D) {
  const ids = new Set();
  for (const p of D.pendanaan.pendanaan) if (p.proyek_id) ids.add(p.proyek_id);
  for (const p of D.pendanaan_int.baris) if (p.proyek_id) ids.add(p.proyek_id);
  for (const p of D.jetp.baris) if (p.proyek_id) ids.add(p.proyek_id);
  for (const p of D.proyek.baris) if (p.pihak?.peminjam?.length) ids.add(p.id);
  return ids;
}

export function petaPeluang(D, ref) {
  const harga = D.peluang.harga_patokan, provs = D.peluang.baris;
  const rup = D.ruptl.baris.filter((b) => b.status === "rencana" || b.status === "konstruksi");
  const namaProv = new Set(provs.map((p) => p.nama));
  const tekRup = (b) => tekPeta(b.teknologi, b.kapasitas_mw);
  const ruptlMw = {}; // "prov|tek" -> MW
  const medianPerTek = {};
  for (const k of TEK) medianPerTek[k] = median(rup.filter((b) => tekRup(b) === k).map((b) => b.kapasitas_mw));
  for (const b of rup) { const k = tekRup(b); if (k && namaProv.has(b.provinsi)) ruptlMw[b.provinsi + "|" + k] = (ruptlMw[b.provinsi + "|" + k] || 0) + (b.kapasitas_mw || 0); }
  /* risiko mangkrak per sel dari proyek.json: proyek belum beroperasi yang dibatalkan, ditunda, atau lewat target COD */
  const risiko = {};
  const danaId = denganPendanaan(D);
  const dana = {};
  for (const p of D.proyek.baris) {
    const prov = provProyek(p), mw = mwProyek(p), k = tekPeta(p.teknologi, mw), st = statusProyek(p);
    if (!prov || !k || !namaProv.has(prov)) continue;
    const key = prov + "|" + k;
    if (st !== "beroperasi") {
      const r = risiko[key] || (risiko[key] = { n: 0, bermasalah: 0, mw: 0, mw_bermasalah: 0 });
      const cod = codAkhir(p), masalah = st === "dibatalkan" || st === "ditunda" || ((st === "rencana" || st === "konstruksi") && cod != null && cod < ref.tahun);
      r.n++; r.mw += mw || 0;
      if (masalah) { r.bermasalah++; r.mw_bermasalah += mw || 0; }
    }
    if (danaId.has(p.id)) dana[key] = (dana[key] || 0) + 1;
  }
  for (const p of D.pendanaan.pendanaan) if (!p.proyek_id && p.prov?.length) for (const pv of p.prov) for (const s of p.sektor || []) { const k = tekPeta(s, null) === "hidro" ? "hidro" : tekPeta(s, null); if (k && namaProv.has(pv)) dana[pv + "|" + k] = (dana[pv + "|" + k] || 0) + 1; }
  /* kedalaman dana nasional per teknologi (nilai_usd entri pendanaan dibagi rata ke sektornya), lalu persentil antarteknologi */
  const dalam = Object.fromEntries(TEK.map((k) => [k, 0]));
  for (const p of D.pendanaan.pendanaan) {
    if (!p.nilai_usd || !p.sektor?.length || p.status === "batal") continue;
    const ks = p.sektor.map((s) => tekPeta(s, null)).filter(Boolean);
    for (const k of ks) dalam[k] += p.nilai_usd / ks.length;
  }
  dalam.mikrohidro = dalam.hidro;
  const dalamPct = Object.fromEntries(TEK.map((k) => [k, persentil(dalam[k], Object.values(dalam))]));
  const rued = Object.fromEntries(D.rued.baris.map((r) => [r.kode, r.target ? 100 : 50]));
  const atap = Object.fromEntries(D.indeks.provinsi.map((p) => [p.nama, p.komponen.plts_atap]));
  const hargaTek = Object.fromEntries(TEK.map((k) => [k, tarifPatokan(harga, k, medianPerTek[k] ?? 5)]));

  const mentah = {}; // tek -> prov -> nilai per komponen
  for (const k of TEK) mentah[k] = {};
  for (const p of provs) {
    for (const k of TEK) {
      const m = {};
      const pot = KUNCI_POTENSI[k] ? p.potensi[KUNCI_POTENSI[k]] : null;
      const ter = KUNCI_POTENSI[k] ? p.terpasang[KUNCI_POTENSI[k]] : null;
      if (pot && pot.mw != null) m.sisa = { potensi: pot.mw, terpasang: ter?.mw ?? 0, nilai: Math.max(0, pot.mw - (ter?.mw ?? 0)) };
      const tf = hargaTek[k];
      if (tf && p.bpp?.nilai_sen_usd && p.faktor_lokasi?.F) {
        const tarif = tf.sen_kwh * p.faktor_lokasi.F;
        m.tarif = { bpp: p.bpp.nilai_sen_usd, tarif: bulatkan(tarif, 2), F: p.faktor_lokasi.F, tingkat: tf.tingkat, nilai: p.bpp.nilai_sen_usd / tarif };
      }
      m.ruptl = { nilai: ruptlMw[p.nama + "|" + k] || 0 };
      if (k === "surya" && atap[p.nama]?.mentah != null) m.atap = { nilai: atap[p.nama].mentah };
      if (rued[p.kode] != null) m.rued = { nilai: rued[p.kode] };
      const r = risiko[p.nama + "|" + k];
      if (r && r.n) m.risiko = { n: r.n, bermasalah: r.bermasalah, mw: bulatkan(r.mw, 1), mw_bermasalah: bulatkan(r.mw_bermasalah, 1), nilai: r.mw > 0 ? r.mw_bermasalah / r.mw : r.bermasalah / r.n };
      m.dana = { nasional: dalamPct[k], lokal: dana[p.nama + "|" + k] || 0, nilai: 0.5 * (dalamPct[k] ?? 0) + 0.5 * Math.min(100, 50 * (dana[p.nama + "|" + k] || 0)) };
      mentah[k][p.kode] = m;
    }
  }
  const sel = {};
  for (const k of TEK) {
    const daftar = (id) => provs.map((p) => mentah[k][p.kode][id]?.nilai).filter((v) => v != null);
    const ada = { sisa: daftar("sisa"), tarif: daftar("tarif"), ruptl: daftar("ruptl") };
    for (const p of provs) {
      const m = mentah[k][p.kode], komp = [];
      const tambah = (id, skor, extra = {}) => { if (skor != null) komp.push({ id, bobot: BOBOT[id], skor: bulatkan(skor, 1), ...extra }); };
      if (m.sisa) tambah("sisa", persentil(m.sisa.nilai, ada.sisa), m.sisa);
      if (m.tarif) tambah("tarif", persentil(m.tarif.nilai, ada.tarif), m.tarif);
      tambah("ruptl", persentil(m.ruptl.nilai, ada.ruptl), m.ruptl);
      if (m.atap) { const sem = D.indeks.provinsi.map((x) => x.komponen.plts_atap.mentah).filter((v) => v != null); tambah("atap", persentil(m.atap.nilai, sem), m.atap); }
      if (m.rued) tambah("rued", m.rued.nilai, m.rued);
      if (m.risiko) tambah("risiko", 100 * (1 - m.risiko.nilai), m.risiko);
      tambah("dana", m.dana.nilai, m.dana);
      const bobotTotal = jumlah(komp.map((c) => c.bobot));
      const skor = komp.length >= 3 && bobotTotal ? jumlah(komp.map((c) => c.skor * c.bobot)) / bobotTotal : null;
      sel[p.kode + "|" + k] = { kode: p.kode, prov: p.nama, tek: k, skor: bulatkan(skor, 1), komponen: komp, n: komp.length, bobot_ada: bobotTotal };
    }
  }
  const baris = provs.map((p) => ({ kode: p.kode, nama: p.nama, rata: (() => { const v = TEK.map((k) => sel[p.kode + "|" + k].skor).filter((x) => x != null); return v.length ? bulatkan(jumlah(v) / v.length, 1) : null; })() }));
  const semua = Object.values(sel).filter((s) => s.skor != null).sort((a, b) => b.skor - a.skor || a.prov.localeCompare(b.prov) || a.tek.localeCompare(b.tek));
  return { sel, provinsi: provs.map((p) => ({ kode: p.kode, nama: p.nama })), baris, top: semua.slice(0, 10), terisi: semua.length, total: Object.keys(sel).length, tarif_median: medianPerTek };
}

/* ---------- 3. radar risiko proyek pipeline ---------- */
const TEK_VARIABEL = new Set(["surya", "bayu"]);

export function sosialBerita(judul) { return SOSIAL.test(judul || ""); }

export function radarRisiko(D, ref) {
  const sistemDariProv = {};
  for (const s of D.transisi.sistem) for (const k of s.provinsi) sistemDariProv[k] = s;
  const kodeProv = Object.fromEntries(D.peluang.baris.map((p) => [p.nama, p.kode]));
  const beritaId = new Map(D.berita.baris.map((b) => [b.id, b]));
  const sosialProvTek = {}; // prov|tek -> n
  const sosialProv = {};
  for (const b of D.berita.baris) {
    if (!sosialBerita(b.judul)) continue;
    for (const w of b.wilayah || []) {
      if (!w.prov) continue;
      sosialProv[w.prov] = (sosialProv[w.prov] || 0) + 1;
      for (const k of b.kepakaran || []) { const t2 = tekPeta(k, null); if (t2) sosialProvTek[w.prov + "|" + t2] = (sosialProvTek[w.prov + "|" + t2] || 0) + 1; }
    }
  }
  const dana = denganPendanaan(D);
  const idx = Object.fromEntries(D.indeks.proyek.map((p) => [p.id, p]));
  const baris = [];
  for (const p of D.proyek.baris) {
    const st = statusProyek(p);
    if (st !== "rencana" && st !== "konstruksi" && st !== "ditunda") continue;
    const mw = mwProyek(p), prov = provProyek(p), k = tekPeta(p.teknologi, mw), cod = codAkhir(p);
    const ruptl = (p.program_ids || []).includes("ruptl");
    const tanda = [];
    if (cod != null && cod < ref.tahun) tanda.push({ id: "cod", poin: 3, param: { cod, lewat: ref.tahun - cod } });
    if (st === "ditunda") tanda.push({ id: "tunda", poin: 3, param: {} });
    if (!pemilikNama(p).length) tanda.push({ id: "pengembang", poin: 2, param: {} });
    if (!dana.has(p.id)) tanda.push({ id: "dana", poin: 1, param: {} });
    const bi = (p.berita_ids || []).map((i) => beritaId.get(i)).filter((b) => b && sosialBerita(b.judul));
    if (bi.length) tanda.push({ id: "sosial", poin: 3, param: { n: bi.length, judul: bi[0].judul, url: bi[0].url } });
    const sw = prov ? sosialProv[prov] || 0 : 0;
    if (prov && k && (sosialProvTek[prov + "|" + k] || 0) >= 1 && !bi.length) tanda.push({ id: "sosial_wil", poin: 1, param: { n: sosialProvTek[prov + "|" + k], prov } });
    else if (sw >= 2 && !bi.length) tanda.push({ id: "konflik", poin: 1, param: { n: sw, prov } });
    const sis = prov && kodeProv[prov] ? sistemDariProv[kodeProv[prov]] : null;
    if (sis && mw != null) {
      const puncak = sis.beban_puncak_neto_mw[0], rm = sis.reserve_margin_persen[0], rasio = mw / puncak;
      if ((k && TEK_VARIABEL.has(k) && rasio > 0.1) || rm >= 50) tanda.push({ id: "serap", poin: 2, param: { sistem: sis.nama, rm, rasio: bulatkan(rasio * 100, 1) } });
    }
    const ik = idx[p.id];
    const skor = jumlah(tanda.map((t2) => t2.poin));
    baris.push({ id: p.id, nama: p.nama, tek: k || p.teknologi || null, prov, mw, status: st, cod, ruptl, skor, tingkat: skor >= 5 ? "tinggi" : skor >= 3 ? "sedang" : "rendah", tanda, kategori_indeks: ik?.kategori || null });
  }
  baris.sort((a, b) => b.skor - a.skor || (b.mw || 0) - (a.mw || 0) || a.nama.localeCompare(b.nama));
  const per = { tinggi: { n: 0, mw: 0 }, sedang: { n: 0, mw: 0 }, rendah: { n: 0, mw: 0 } };
  for (const b of baris) { per[b.tingkat].n++; per[b.tingkat].mw += b.mw || 0; }
  for (const k of Object.keys(per)) per[k].mw = bulatkan(per[k].mw, 0);
  const frek = {};
  for (const b of baris) for (const t2 of b.tanda) frek[t2.id] = (frek[t2.id] || 0) + 1;
  const mwCod = bulatkan(jumlah(baris.filter((b) => b.tanda.some((t2) => t2.id === "cod")).map((b) => b.mw)), 0);
  return { baris, per, frek, mw_lewat_cod: mwCod, total_mw: bulatkan(jumlah(baris.map((b) => b.mw)), 0) };
}
export const DAFTAR_PERIKSA = { cod: "jadwal", tunda: "jadwal", pengembang: "pihak", dana: "dana", sosial: "sosial", sosial_wil: "sosial", konflik: "sosial", serap: "jaringan" };

/* ---------- 4. konsentrasi pasar dan pemain ---------- */
export function konsentrasi(D, ref) {
  const beroperasi = D.proyek.baris.filter((p) => statusProyek(p) === "beroperasi");
  const pipeline = D.proyek.baris.filter((p) => ["rencana", "konstruksi"].includes(statusProyek(p)));
  const bagi = (p, mw) => { const n = pemilikNama(p); return n.length ? n.map((x) => [x, mw / n.length]) : []; };
  const perTek = {};
  for (const p of beroperasi) {
    const mw = mwProyek(p), k = tekPeta(p.teknologi, mw);
    if (!k || mw == null) continue;
    const e = perTek[k] || (perTek[k] = { tek: k, mw_total: 0, mw_bernama: 0, n: 0, n_bernama: 0, pemain: {} });
    e.mw_total += mw; e.n++;
    const b = bagi(p, mw);
    if (b.length) { e.n_bernama++; e.mw_bernama += mw; for (const [nm, v] of b) e.pemain[nm] = (e.pemain[nm] || 0) + v; }
  }
  const hasil = Object.values(perTek).map((e) => {
    const u = Object.entries(e.pemain).sort((a, b) => b[1] - a[1]);
    return { tek: e.tek, mw_total: bulatkan(e.mw_total, 0), mw_bernama: bulatkan(e.mw_bernama, 0), n: e.n, n_bernama: e.n_bernama, cakupan: e.mw_total ? bulatkan((e.mw_bernama / e.mw_total) * 100, 0) : null, pemain: u.length, hhi: hhi(u.map((x) => x[1])), kelas: kelasHhi(hhi(u.map((x) => x[1]))), terbesar: u[0]?.[0] || null, pangsa_terbesar: u[0] ? bulatkan((u[0][1] / e.mw_bernama) * 100, 0) : null };
  }).filter((h) => h.n_bernama >= 1).sort((a, b) => (b.hhi ?? 0) - (a.hhi ?? 0));
  /* pangsa golongan per tahun: kumulatif MW beroperasi bernama pemilik menurut tahun COD aktual */
  const per = [];
  for (const p of beroperasi) {
    const cod = (p.cod_aktual || []).map((c) => c.nilai).filter(Number.isFinite)[0], mw = mwProyek(p);
    if (!cod || mw == null) continue;
    for (const [nm, v] of bagi(p, mw)) per.push({ tahun: cod, gol: golonganPemilik(nm), nama: nm, mw: v });
  }
  const tahun = [...new Set(per.map((x) => x.tahun))].sort((a, b) => a - b);
  const awal = Math.max(Math.min(...tahun), 2000);
  const tahunSeri = [];
  for (let y = 2000; y <= ref.tahun - 1 + 0; y += 5) tahunSeri.push(y);
  const titik = [...new Set([...tahunSeri, 2015, 2018, 2020, 2021, 2022, 2023, 2024, 2025])].filter((y) => y <= ref.tahun - 1 + 1 && y >= awal).sort((a, b) => a - b);
  const pangsa = titik.map((y) => {
    const g = { bumn: 0, swasta: 0, asing: 0 };
    for (const x of per) if (x.tahun <= y) g[x.gol] += x.mw;
    const tot = jumlah(Object.values(g));
    return { tahun: y, total: bulatkan(tot, 0), bumn: tot ? bulatkan((g.bumn / tot) * 100, 1) : null, swasta: tot ? bulatkan((g.swasta / tot) * 100, 1) : null, asing: tot ? bulatkan((g.asing / tot) * 100, 1) : null };
  }).filter((x, i, a) => x.total > 0 && (i === 0 || i === a.length - 1 || x.total !== a[i - 1].total));
  /* pemain tumbuh tercepat: tambahan MW 2022 sampai tahun acuan (COD aktual) plus pipeline bernama pemilik */
  const tumbuh = {};
  const ambil = (nm) => tumbuh[nm] || (tumbuh[nm] = { nama: nm, gol: golonganPemilik(nm), dasar: 0, baru: 0, pipeline: 0 });
  for (const x of per) { const e = ambil(x.nama); if (x.tahun >= 2022) e.baru += x.mw; else e.dasar += x.mw; }
  for (const p of pipeline) { const mw = mwProyek(p); if (mw == null) continue; for (const [nm, v] of bagi(p, mw)) ambil(nm).pipeline += v; }
  const pemain = Object.values(tumbuh).map((e) => ({ ...e, dasar: bulatkan(e.dasar, 0), baru: bulatkan(e.baru, 0), pipeline: bulatkan(e.pipeline, 0), laju: e.dasar > 0 ? bulatkan((e.baru / e.dasar) * 100, 0) : null, total: bulatkan(e.dasar + e.baru, 0) }))
    .filter((e) => e.baru > 0 || e.pipeline > 0).sort((a, b) => (b.baru + b.pipeline) - (a.baru + a.pipeline) || a.nama.localeCompare(b.nama));
  return { per_tek: hasil, pangsa, pemain, n_bernama: beroperasi.filter((p) => pemilikNama(p).length).length, n_beroperasi: beroperasi.length };
}

/* ---------- 5. arus uang ---------- */
const TEK_KH = { "Renewable hydropower": "hidro", "Solar photovoltaic": "surya", "Solar thermal energy": "surya", "Wind energy": "bayu", "Onshore wind energy": "bayu", "Geothermal energy": "panas-bumi", "Solid biofuels": "bioenergi", "Non-renewable waste": null, "Multiple renewables": "campuran", "Marine energy": null };

export function arusUang(D, ref) {
  /* Pendanaan publik EBT (CPI/IRENA, USD harga 2023) sepuluh tahun terakhir per teknologi vs sebaran MW pipeline RUPTL.
     Kebutuhan USD mutlak TIDAK dihitung: proyek bernilai investasi dan berkapasitas terlalu sedikit untuk tolok USD per MW. Yang dihitung: celah realokasi
     = MW pipeline x (total dana / total MW) dikurangi dana tercatat, yaitu dana yang bergeser bila dana mengikuti sebaran MW (EST). */
  const rup = D.ruptl.baris.filter((b) => b.status === "rencana" || b.status === "konstruksi");
  const mwRup = {};
  for (const b of rup) { const k = b.teknologi === "biomassa-sampah" ? "bioenergi" : b.teknologi; mwRup[k] = (mwRup[k] || 0) + (b.kapasitas_mw || 0); }
  const publikTek = {};
  let campuran = 0;
  const tahunKh = D.keuangan_hijau.investasi_publik.filter((r) => r.kelompok === "ebt").map((r) => r.tahun);
  const akhirKh = Math.max(...tahunKh), awalKh = akhirKh - 9;
  for (const r of D.keuangan_hijau.investasi_publik) {
    if (r.kelompok !== "ebt" || r.tahun < awalKh || r.tahun > akhirKh) continue;
    const k = TEK_KH[r.teknologi];
    if (k === "campuran") campuran += r.usd_juta_2023 * 1e6;
    else if (k) publikTek[k] = (publikTek[k] || 0) + r.usd_juta_2023 * 1e6;
  }
  const kunci = GRUP_EBT, totMw = jumlah(kunci.map((k) => mwRup[k] || 0)), totUsd = jumlah(kunci.map((k) => publikTek[k] || 0));
  const entri = Object.fromEntries(kunci.map((k) => [k, 0]));
  for (const p of D.pendanaan.pendanaan) if (p.jenis_entri === "proyek") for (const s of p.sektor || []) { const k = s === "biomassa-sampah" ? "bioenergi" : s; if (k in entri) entri[k]++; }
  const tek = kunci.map((k) => {
    const mw = mwRup[k] || 0, usd = publikTek[k] || 0, adil = totMw ? (mw / totMw) * totUsd : 0;
    return { tek: k, mw_ruptl: bulatkan(mw, 0), pangsa_mw: totMw ? bulatkan((mw / totMw) * 100, 1) : null, publik_usd: bulatkan(usd, 0), pangsa_dana: totUsd ? bulatkan((usd / totUsd) * 100, 1) : null, usd_per_mw: mw ? bulatkan(usd / mw, 0) : null, celah_usd: bulatkan(adil - usd, 0), rasio: adil ? bulatkan(usd / adil, 2) : null, entri: entri[k] };
  }).sort((a, b) => b.celah_usd - a.celah_usd);
  const kekurangan = jumlah(tek.filter((x) => x.celah_usd > 0).map((x) => x.celah_usd));
  /* per tahun: komitmen IATI berbobot porsi energi vs investasi publik EBT (USD) */
  const tahunan = {};
  for (const b of D.pendanaan_int.baris) {
    if (!b.tahun || !b.nilai_usd) continue;
    const e = tahunan[b.tahun] || (tahunan[b.tahun] = { tahun: b.tahun, iati_usd: 0, publik_usd: 0, n: 0 });
    e.iati_usd += b.nilai_usd * ((b.porsi_energi_persen ?? 100) / 100); e.n++;
  }
  for (const r of D.keuangan_hijau.investasi_publik) {
    if (r.kelompok !== "ebt") continue;
    const e = tahunan[r.tahun] || (tahunan[r.tahun] = { tahun: r.tahun, iati_usd: 0, publik_usd: 0, n: 0 });
    e.publik_usd += r.usd_juta_2023 * 1e6;
  }
  const seri = Object.values(tahunan).filter((e) => e.tahun >= 2010 && e.tahun <= ref.tahun).sort((a, b) => a.tahun - b.tahun).map((e) => ({ ...e, iati_usd: bulatkan(e.iati_usd, 0), publik_usd: bulatkan(e.publik_usd, 0) }));
  /* per provinsi (terbatas): proyek yang punya pendanaan tercatat menurut lokasi proyek, plus entri pendanaan berprovinsi */
  const danaId = denganPendanaan(D), prov = {};
  const peta = new Map(D.proyek.baris.map((p) => [p.id, p]));
  const ambilProv = (nm) => prov[nm] || (prov[nm] = { prov: nm, n: 0, usd: 0, mw: 0 });
  for (const id of danaId) { const p = peta.get(id), pv = p && provProyek(p); if (pv) { const e = ambilProv(pv); e.n++; e.mw += mwProyek(p) || 0; } }
  for (const p of D.pendanaan.pendanaan) {
    if (!p.nilai_usd) continue;
    const pp = p.proyek_id ? peta.get(p.proyek_id) : null, pv = pp ? provProyek(pp) : null;
    if (pv) ambilProv(pv).usd += p.nilai_usd;
    else if (p.prov?.length) for (const x of p.prov) ambilProv(x).usd += p.nilai_usd / p.prov.length;
  }
  const provinsi = Object.values(prov).map((e) => ({ ...e, mw: bulatkan(e.mw, 0), usd: bulatkan(e.usd, 0) })).sort((a, b) => b.usd - a.usd || b.n - a.n || a.prov.localeCompare(b.prov));
  const iati = jumlah(seri.map((x) => x.iati_usd));
  return { tek, seri, provinsi, awal_publik: awalKh, akhir_publik: akhirKh, campuran_usd: bulatkan(campuran, 0), total_mw: bulatkan(totMw, 0), total_usd: bulatkan(totUsd, 0), celah_total_usd: bulatkan(kekurangan, 0), iati_usd: bulatkan(iati, 0), jetp_usd: D.keuangan_hijau.jetp.komitmen_usd_miliar * 1e9 };
}

/* ---------- 6. sinyal pasar dari berita dan peristiwa ---------- */
export function topikBerita(judul) {
  const u = [];
  if (RESMI.test(judul)) u.push("resmi");
  if (PPA.test(judul)) u.push("ppa");
  if (LELANG.test(judul)) u.push("lelang");
  if (BATAL.test(judul)) u.push("batal");
  return u;
}
const bulanDari = (s) => String(s || "").slice(0, 7);
export const TOPIK = ["resmi", "ppa", "lelang", "batal"];

export function sinyalPasar(D) {
  const b = D.berita.baris.filter((x) => x.terbit);
  const bulan = [...new Set(b.map((x) => bulanDari(x.terbit)))].sort();
  const terakhir = b.map((x) => x.terbit.slice(0, 10)).sort().at(-1) || "";
  /* bulan penuh = bulan yang sudah lewat dari tanggal terbit terakhir dan memuat cukup berita (bulan berjalan tidak dibandingkan) */
  const penuh = bulan.filter((m) => m < terakhir.slice(0, 7) && b.filter((x) => bulanDari(x.terbit) === m).length >= 20);
  const tekB = (x) => (x.kepakaran || []).map((k) => tekPeta(k, null)).filter(Boolean);
  const perBulan = bulan.map((m) => {
    const isi = b.filter((x) => bulanDari(x.terbit) === m);
    const o = { bulan: m, n: isi.length, penuh: penuh.includes(m), tek: {}, topik: Object.fromEntries(TOPIK.map((t2) => [t2, 0])) };
    for (const x of isi) { for (const k of new Set(tekB(x))) o.tek[k] = (o.tek[k] || 0) + 1; for (const t2 of topikBerita(x.judul)) o.topik[t2]++; }
    return o;
  });
  /* peristiwa terverifikasi dari peristiwa_ebt per bulan */
  const per = {};
  for (const e of D.peristiwa.baris) { if (!e.peristiwa) continue; const m = bulanDari(e.tanggal); (per[m] || (per[m] = {}))[e.peristiwa] = (per[m][e.peristiwa] || 0) + 1; }
  /* momentum: perubahan pangsa teknologi dalam berita bertopik teknologi, dua bulan penuh terakhir lawan dua bulan penuh sebelumnya (pangsa, bukan jumlah, agar tidak bias laju panen) */
  const k = Math.min(2, penuh.length >> 1), akhir = k ? penuh.slice(-k) : [], awal = k ? penuh.slice(-2 * k, -k) : [];
  const pangsaPada = (ms) => {
    const isi = b.filter((x) => ms.includes(bulanDari(x.terbit))), c = {};
    let tot = 0;
    for (const x of isi) for (const k of new Set(tekB(x))) { c[k] = (c[k] || 0) + 1; tot++; }
    return { c, tot };
  };
  const A = pangsaPada(akhir), Z = pangsaPada(awal);
  const momentum = TEK.filter((k) => (A.c[k] || 0) + (Z.c[k] || 0) >= 5).map((k) => {
    const pa = Z.tot ? ((Z.c[k] || 0) / Z.tot) * 100 : 0, pz = A.tot ? ((A.c[k] || 0) / A.tot) * 100 : 0;
    return { tek: k, awal: bulatkan(pa, 1), akhir: bulatkan(pz, 1), selisih: bulatkan(pz - pa, 1), n_akhir: A.c[k] || 0, n_awal: Z.c[k] || 0 };
  }).sort((a, c) => c.selisih - a.selisih || c.n_akhir - a.n_akhir);
  const batalProyek = D.proyek.baris.filter((p) => ["dibatalkan", "ditunda"].includes(statusProyek(p))).length;
  return { per_bulan: perBulan, peristiwa: per, terakhir, momentum, bulan_penuh: penuh, jendela: { akhir, awal }, n_berita: b.length, n_batal_proyek: batalProyek };
}

/* ---------- 7. ringkasan eksekutif ---------- */
/** 10 temuan terpenting berangka. Tiap temuan: { id, bagian, kunci, param } dengan kunci kamus tr "st.f.*"; param angka mentah (diformat di layar). */
export function ringkasan(K) {
  const { kes, peta, radar, kons, uang, sinyal } = K;
  const f = [];
  const ru = kes.kapasitas.find((x) => x.id === "ruptl-2034-kapasitas");
  if (ru) f.push({ id: "kapasitas", bagian: "kesenjangan", param: { perlu: ru.perlu_mw, laju: Math.round(ru.laju), kali: ru.kali } });
  const b34 = kes.bauran.find((x) => x.id === "ruptl-2034") || kes.bauran[0];
  if (b34) f.push({ id: "bauran", bagian: "kesenjangan", param: { target: b34.target, tahun: b34.tahun, real: b34.realisasi, capai: b34.tahun_capai ?? 0, tren: b34.tren_poin ?? 0 } });
  const t1 = kes.per_tek.find((x) => x.kali != null);
  if (t1) f.push({ id: "tek_kejar", bagian: "kesenjangan", param: { tek: t1.tek, kali: t1.kali, perlu: t1.perlu_mw, laju: t1.laju10 } });
  const sel = peta.top[0];
  if (sel) f.push({ id: "sel_unggul", bagian: "peta", param: { prov: sel.prov, tek: sel.tek, skor: sel.skor } });
  const rata = [...peta.baris].filter((x) => x.rata != null).sort((a, b) => b.rata - a.rata)[0];
  if (rata) f.push({ id: "prov_unggul", bagian: "peta", param: { prov: rata.nama, skor: rata.rata } });
  if (radar.baris.length) f.push({ id: "radar", bagian: "radar", param: { tinggi: radar.per.tinggi.n, total: radar.baris.length, mw: radar.per.tinggi.mw } });
  f.push({ id: "cod", bagian: "radar", param: { n: radar.frek.cod || 0, mw: radar.mw_lewat_cod, total: radar.total_mw } });
  const k1 = kons.per_tek.filter((x) => x.pemain >= 2 && x.n_bernama >= 3 && x.cakupan >= 50)[0];
  if (k1) f.push({ id: "hhi", bagian: "konsentrasi", param: { tek: k1.tek, hhi: k1.hhi, terbesar: k1.terbesar, pangsa: k1.pangsa_terbesar } });
  const pa = kons.pangsa.at(-1), pz = kons.pangsa.find((x) => x.tahun >= 2015) || kons.pangsa[0];
  if (pa && pz) f.push({ id: "bumn", bagian: "konsentrasi", param: { dari: pz.bumn, ke: pa.bumn, a: pz.tahun, z: pa.tahun } });
  const u1 = uang.tek[0];
  if (u1 && u1.celah_usd > 0) f.push({ id: "celah_dana", bagian: "uang", param: { tek: u1.tek, celah: u1.celah_usd, pangsa_mw: u1.pangsa_mw, pangsa_dana: u1.pangsa_dana, total: uang.celah_total_usd } });
  const m = sinyal.momentum[0];
  if (m) f.push({ id: "momentum", bagian: "sinyal", param: { tek: m.tek, selisih: m.selisih, akhir: m.akhir } });
  return f.slice(0, 10);
}

/** Satu paket: semua analisis dari data mentah. */
export function analisis(D, ref) {
  const kes = kesenjangan(D, ref), peta = petaPeluang(D, ref), radar = radarRisiko(D, ref), kons = konsentrasi(D, ref), uang = arusUang(D, ref), sinyal = sinyalPasar(D);
  return { kes, peta, radar, kons, uang, sinyal, temuan: ringkasan({ kes, peta, radar, kons, uang, sinyal }) };
}
