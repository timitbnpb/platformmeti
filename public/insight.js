/* /insight: temuan dan tren dihitung saat render dari /data/*.json. Kartu tanpa data disembunyikan. Grafik SVG tanpa pustaka. */
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, hantuHtml, ikon } from "/inti/umum.js";
import { t, ada, tanggal } from "/i18n.js";
import { pasangBagi, IKON_BAGI } from "/insight_bagi.js";
import { kolom, batang, dumbbell, garis } from "/grafik.js";
import { pilihHtml } from "/inti/komponen.js";
import { muatData, sumberLipat, pil, num, saatBahasa } from "/analisis.js";

const $ = (id) => document.getElementById(id);
const NAMA = ["proyek", "program", "regulasi", "berita", "wilayah", "asean", "rantai_plts", "kalender", "karbon", "keuangan"];
const D = {};
let fTek = "", fProv = "", urut = "penting", tinjau = null;
const HARI = 86400000;

/* ---------- pembantu data ---------- */
const proyek = () => D.proyek?.baris ?? [];
const MW = (p) => { const k = p.kapasitas?.[0]; return k && Number.isFinite(k.nilai) ? k.nilai : null; };
const cod = (p) => { const a = (p.cod_target ?? []).map((c) => c.nilai).filter(Number.isFinite); return a.length ? Math.min(...a) : null; };
const belumJalan = (p) => p.status?.[0]?.nilai !== "beroperasi";
const prov = (p) => p.lokasi?.provinsi ?? null;
const jumlah = (a) => a.reduce((s, x) => s + x, 0);
const median = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const tahunIni = () => Number((D.proyek?.dibangun_pada ?? D.regulasi?.dibangun_pada ?? "").slice(0, 4)) || new Date().getFullYear();
const sekarang = () => Date.parse(D.berita?.dibangun_pada ?? D.regulasi?.dibangun_pada ?? "") || Date.now();
const namaTek = (k) => (ada("an.tek." + k) ? t("an.tek." + k) : null);
const terpasangMeta = () => { const m = D.wilayah?.baris?.find((b) => b.terpasang_mw)?.terpasang_mw; return m ? { sumber: m.sumber, halaman: m.halaman, tahun: m.tahun, url: m.url, tanggal: m.tanggal } : null; };
const S = (o) => o;
const sumberData = (kunci, berkas) => ({ sumber: t(kunci), tanggal: D[berkas].dibangun_pada });
const terpasangTotal = () => { const w = (D.wilayah?.baris ?? []).map((b) => b.terpasang_mw?.nilai).filter(Number.isFinite); return w.length ? jumlah(w) : null; };
const pangsa = (m, k) => { const tot = jumlah(Object.values(m)); return tot ? (m[k] / tot) * 100 : 0; };

/* ---------- kartu temuan ---------- */
/* Bentuk kartu: {id, topik, bobot, judul, nilai, satuan, est, hip, penyebut, chart(), sumber[], cara, penting, tgl} atau null (disembunyikan). */

function cPipeline() {
  const P = proyek().filter((p) => belumJalan(p) && cod(p) != null && MW(p) != null);
  if (!P.length) return null;
  const per = new Map();
  P.forEach((p) => per.set(cod(p), (per.get(cod(p)) ?? 0) + MW(p)));
  const th = [...per.keys()].sort((a, b) => a - b), total = jumlah([...per.values()]);
  const puncak = th.reduce((m, y) => (per.get(y) > per.get(m) ? y : m), th[0]), terpasang = terpasangTotal();
  return {
    id: "pipeline", topik: "proyek", bobot: 90, est: true,
    judul: t("ins.pip.j", { mw: num(total), a: th[0], b: th[th.length - 1], puncak, mwp: num(per.get(puncak)) }),
    nilai: num(total), satuan: "MW",
    penyebut: (terpasang ? t("ins.pip.vs", { persen: num((total / terpasang) * 100, 0), mw: num(terpasang) }) + " | " : "") + t("an.n_dari", { n: P.length, total: proyek().length }),
    chart: () => kolom(th.map((y) => ({ label: String(y), v: Math.round(per.get(y)) })), { rata: Math.round(total / th.length), teksRata: t("ins.g.rata", { v: num(total / th.length) }), label: t("ins.pip.chart") }),
    sumber: [sumberData("ins.s.proyek", "proyek"), S(terpasangMeta())],
    cara: t("ins.pip.cara"), penting: t("ins.pip.penting"), tgl: D.proyek.dibangun_pada,
  };
}

function cTerlambat() {
  const ada_ = proyek().filter((p) => belumJalan(p) && cod(p) != null);
  if (!ada_.length) return null;
  const lewat = ada_.filter((p) => cod(p) < tahunIni()), mw = jumlah(lewat.map((p) => MW(p) ?? 0));
  const per = new Map();
  lewat.forEach((p) => per.set(p.teknologi, (per.get(p.teknologi) ?? 0) + 1));
  const baris = [...per].filter(([k]) => namaTek(k)).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => ({ label: namaTek(k).slice(0, 10), v: n, tip: `${namaTek(k)}: ${num(n)}` }));
  return {
    id: "terlambat", topik: "proyek", bobot: 95, est: true,
    judul: t("ins.tel.j", { n: lewat.length, mw: num(mw), tahun: tahunIni() }),
    nilai: num(lewat.length), satuan: t("ins.proyek"),
    penyebut: t("an.n_dari", { n: lewat.length, total: ada_.length }),
    chart: () => (baris.length ? kolom(baris, { label: t("ins.tel.chart") }) : `<p class="jm-bantu">${esc(t("ins.kosong"))}</p>`),
    sumber: [sumberData("ins.s.proyek", "proyek")],
    cara: t("ins.tel.cara", { tahun: tahunIni() }), penting: t("ins.tel.penting"), tgl: D.proyek.dibangun_pada,
  };
}

function cCelah() {
  const R_ = (D.wilayah?.baris ?? []).filter((b) => Number.isFinite(b.potensi_panas_bumi?.nilai) && Number.isFinite(b.per_teknologi_mw?.["panas-bumi"]))
    .map((b) => ({ nama: b.nama, pot: b.potensi_panas_bumi.nilai, ter: b.per_teknologi_mw["panas-bumi"], meta: b.potensi_panas_bumi }))
    .map((r) => ({ ...r, gap: r.pot - r.ter })).sort((a, b) => b.gap - a.gap);
  if (!R_.length || R_[0].gap <= 0) return null;
  const a = R_[0], top = R_.slice(0, 5), maks = Math.max(...top.map((r) => r.pot));
  return {
    id: "celah", topik: "wilayah", bobot: 80, est: true,
    judul: t("ins.cel.j", { prov: a.nama, gap: num(a.gap), persen: num((a.ter / a.pot) * 100, 1) }),
    nilai: num(a.gap), satuan: "MW",
    penyebut: t("an.n_dari", { n: R_.length, total: D.wilayah.baris.length }),
    chart: () => batang(top.map((r, i) => ({ label: r.nama, v0: r.ter, v: r.gap, sorot: i === 0, teks: `${num(r.gap)} MW` })), { maks, label: t("ins.cel.chart") }) +
      `<p class="jm-bantu">${esc(t("ins.cel.kunci"))}</p>`,
    sumber: [S({ sumber: a.meta.sumber, halaman: a.meta.halaman, tahun: a.meta.tahun, url: a.meta.url, tanggal: a.meta.tanggal }), S(terpasangMeta())],
    cara: t("ins.cel.cara"), penting: t("ins.cel.penting"), tgl: D.wilayah.dibangun_pada,
  };
}

function cPlts() {
  const r = D.rantai_plts?.ringkas, pr = D.rantai_plts?.program;
  if (!r || !pr?.target_gwp) return null;
  const butuh = pr.target_gwp / 10, lokal = r.lokal_mwp / 1000, persen = (lokal / butuh) * 100;
  return {
    id: "plts", topik: "rantai", bobot: 85, est: true, hip: true,
    judul: t("ins.plt.j", { persen: num(persen, 0), butuh: num(butuh, 1), lokal: num(lokal, 1) }),
    nilai: num(persen, 0), satuan: "%",
    penyebut: t("an.n_dari", { n: r.pabrikan - r.tanpa_kapasitas, total: r.pabrikan }),
    chart: () => batang([
      { label: t("ins.plt.butuh"), v: butuh, teks: num(butuh, 1) + " GWp" },
      { label: t("ins.plt.lokal"), v: lokal, teks: num(lokal, 1) + " GWp", sorot: true },
    ], { label: t("ins.plt.chart") }),
    sumber: [S({ sumber: D.rantai_plts.sumber.judul, tanggal: D.rantai_plts.sumber.tanggal }), S({ sumber: pr.sumber, tanggal: pr.tanggal_sumber })],
    cara: t("ins.plt.cara", { target: pr.target_gwp }), penting: t("ins.plt.penting"), tgl: D.rantai_plts.dibangun_pada,
  };
}

function cBauran() {
  const inst = {};
  (D.wilayah?.baris ?? []).forEach((b) => Object.entries(b.per_teknologi_mw ?? {}).forEach(([k, v]) => { if (Number.isFinite(v)) inst[k] = (inst[k] ?? 0) + v; }));
  const pip = {};
  proyek().filter((p) => belumJalan(p) && MW(p) != null && p.teknologi in inst).forEach((p) => { pip[p.teknologi] = (pip[p.teknologi] ?? 0) + MW(p); });
  const kunci = Object.keys(inst).filter((k) => namaTek(k) && pip[k] != null);
  if (kunci.length < 2 || !jumlah(Object.values(inst))) return null;
  const hasil = kunci.map((k) => ({ k, a: pangsa(Object.fromEntries(kunci.map((x) => [x, pip[x]])), k), b: pangsa(Object.fromEntries(kunci.map((x) => [x, inst[x]])), k) }))
    .sort((x, y) => y.a - x.a);
  const sorot = [...hasil].sort((x, y) => (y.a - y.b) - (x.a - x.b))[0];
  const baris = [...hasil].sort((x, y) => (y.a - y.b) - (x.a - x.b)).map((h) => ({ label: namaTek(h.k), a: h.b, b: h.a, sorot: h.k === sorot.k, tekA: num(h.b, 0) + "%", tekB: num(h.a, 0) + "%" }));
  return {
    id: "bauran", topik: "proyek", bobot: 75, est: true,
    judul: t("ins.mix.j", { tek: namaTek(sorot.k), a: num(sorot.a, 0), b: num(sorot.b, 0) }),
    nilai: num(sorot.a, 0), satuan: "%",
    penyebut: t("an.n_dari", { n: kunci.length, total: Object.keys(pip).length }),
    chart: () => dumbbell(baris, { kepA: t("ins.mix.terpasang"), kepB: t("ins.mix.pipeline"), label: t("ins.mix.chart") }),
    sumber: [sumberData("ins.s.proyek", "proyek"), S(terpasangMeta())],
    cara: t("ins.mix.cara"), penting: t("ins.mix.penting"), tgl: D.proyek.dibangun_pada,
  };
}

function cRegulasi() {
  const R_ = (D.regulasi?.baris ?? []).filter((r) => Date.parse(r.tanggal_ditetapkan));
  if (!R_.length) return null;
  const now = sekarang(), n1 = R_.filter((r) => { const d = Date.parse(r.tanggal_ditetapkan); return d > now - 365 * HARI && d <= now; }).length;
  const n0 = R_.filter((r) => { const d = Date.parse(r.tanggal_ditetapkan); return d > now - 730 * HARI && d <= now - 365 * HARI; }).length;
  const dicabut = D.regulasi.baris.filter((r) => r.status === "dicabut").length;
  const tmax = Math.max(...R_.map((r) => r.tahun).filter(Number.isFinite)), thReg = Array.from({ length: 10 }, (_, i) => tmax - 9 + i), perReg = thReg.map((y) => D.regulasi.baris.filter((r) => r.tahun === y).length);
  const ruu = (D.kalender?.baris ?? []).filter((k) => /RUU EBET/i.test(k.judul)).sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0];
  return {
    id: "regulasi", topik: "regulasi", bobot: 70, est: true,
    judul: t("ins.reg.j", { n: num(n1), m: num(n0), dicabut: num(dicabut), total: num(D.regulasi.baris.length) }),
    nilai: num(n1), satuan: t("ins.regulasi"),
    penyebut: t("an.n_dari", { n: R_.length, total: D.regulasi.baris.length }),
    chart: () => kolom(thReg.map((y, i) => ({ label: String(y).slice(2), v: perReg[i], sorot: i === thReg.length - 1, tip: `${y}: ${num(perReg[i])}` })), { label: t("ins.reg.chart") }) + (ruu ? `<p class="jm-bantu">${esc(t("ins.reg.ruu", { judul: ruu.judul, tanggal: tanggal(ruu.tanggal) }))}</p>` : ""),
    sumber: [sumberData("ins.s.regulasi", "regulasi"), ...(ruu ? [S({ sumber: t("ins.s.kalender"), tanggal: ruu.sumber?.tanggal ?? D.kalender.dibangun_pada })] : [])],
    cara: t("ins.reg.cara"), penting: t("ins.reg.penting"), tgl: D.regulasi.dibangun_pada,
  };
}

/* hitungan berita per teknologi pada jendela [dari, sampai) */
function hitungBerita(dari, sampai) {
  const c = {};
  (D.berita?.baris ?? []).forEach((b) => {
    const d = Date.parse(b.terbit);
    if (!(d >= dari && d < sampai)) return;
    (b.kepakaran ?? []).forEach((k) => { if (namaTek(k)) c[k] = (c[k] ?? 0) + 1; });
  });
  return c;
}

function cBerita() {
  const now = sekarang(), baru = hitungBerita(now - 30 * HARI, now + HARI), lama = hitungBerita(now - 60 * HARI, now - 30 * HARI);
  const top = Object.entries(baru).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (!top.length) return null;
  const [k, n] = top[0], m = lama[k] ?? 0;
  return {
    id: "berita", topik: "berita", bobot: 72, est: true,
    judul: t("ins.ber.j", { tek: namaTek(k), n: num(n), m: num(m) }),
    nilai: num(n), satuan: t("ins.berita"),
    penyebut: t("an.n_dari", { n: jumlah(Object.values(baru)), total: D.berita.baris.length }),
    chart: () => dumbbell([...top].map(([kk, nn]) => ({ label: namaTek(kk), a: lama[kk] ?? 0, b: nn, sorot: kk === k })).sort((x, y) => (y.b - y.a) - (x.b - x.a)), { kepA: t("ins.ber.sebelum"), kepB: t("ins.ber.kini"), label: t("ins.ber.chart") }),
    sumber: [sumberData("ins.s.berita", "berita")],
    cara: t("ins.ber.cara"), penting: t("ins.ber.penting"), tgl: D.berita.dibangun_pada,
  };
}

const keu = (k) => (D.keuangan?.baris ?? []).filter((r) => r.kelompok === k);
const bursa = () => (D.karbon?.baris ?? []).filter((r) => r.kelompok === "bursa_karbon" && Number.isFinite(r.volume_tco2e)).sort((x, y) => x.periode.localeCompare(y.periode));
const blnPendek = (p) => `${p.slice(5)}/${p.slice(2, 4)}`;

function cJetp() {
  const re = keu("green_finance").find((r) => r.sektor === "Renewable Energy" && Number.isFinite(r.usd));
  if (!re) return null;
  const jetp = keu("jetp").find((r) => r.jenis === "komitmen")?.total_usd_miliar, lain = keu("green_finance").filter((r) => r.jenis === "alokasi_kumulatif_2018_2024" && Number.isFinite(r.usd));
  const jt = D.program?.baris?.find((b) => b.id === "jetp"), usdJt = (v) => Math.round(v / 1e6);
  const baris = lain.map((r) => ({ label: r.sektor ?? r.pemilik_proyek, v: usdJt(r.usd), teks: num(usdJt(r.usd)), sorot: r === re }));
  return {
    id: "jetp", anchor: "pembiayaan", topik: "pembiayaan", bobot: 60,
    judul: t("ins.fin.j", { usd: num(usdJt(re.usd)), persen: num(re.porsi_persen, 1), jetp: jetp != null ? num(jetp) : t("an.tanpa_data") }),
    nilai: num(usdJt(re.usd)), satuan: t("ins.fin.satuan"),
    penyebut: t("an.n_dari", { n: lain.length, total: keu("green_finance").length }) + (jt?.jumlah_proyek ? " | " + t("ins.fin.proyek", { n: jt.jumlah_proyek, mw: num(jt.kapasitas_mw) }) : ""),
    chart: () => batang(baris, { label: t("ins.fin.chart") }),
    sumber: [S({ sumber: re.dokumen, url: re.sumber_url, tanggal: re.tanggal }), S({ sumber: t("ins.s.jetp"), url: "https://jetp-id.org/", tanggal: D.keuangan.dibangun_pada })],
    cara: t("ins.fin.cara"), penting: t("ins.fin.penting"), tgl: D.keuangan.dibangun_pada,
  };
}

function cKarbon() {
  const B = bursa();
  if (!B.length) return null;
  const a = B[B.length - 1], tot = jumlah(B.map((r) => r.volume_tco2e));
  return {
    id: "karbon", topik: "karbon", bobot: 65, est: true,
    judul: t("ins.kar.j", { v: num(a.volume_tco2e), bulan: a.periode, ytd: num(a.volume_ytd_tco2e), nilai: num(a.nilai_idr / 1e6) }),
    nilai: num(a.volume_tco2e), satuan: "tCO2e",
    penyebut: t("ins.kar.bulan", { n: B.length, tot: num(tot) }),
    chart: () => kolom(B.map((r) => ({ label: blnPendek(r.periode), v: r.volume_tco2e })), { rata: Math.round(tot / B.length), teksRata: t("ins.g.rata", { v: num(tot / B.length) }), label: t("ins.kar.chart") }),
    sumber: [S({ sumber: a.sumber, url: a.halaman_sumber, tanggal: a.tanggal })],
    cara: t("ins.kar.cara"), penting: t("ins.kar.penting"), tgl: D.karbon.dibangun_pada,
  };
}

function cTarif() {
  const T = keu("tarif").filter((r) => r.teknologi && Number.isFinite(r.thn_1_10_dasar));
  if (!T.length) return null;
  const per = {};
  T.forEach((r) => (per[r.teknologi] ??= []).push(r.thn_1_10_dasar));
  const baris = Object.entries(per).map(([k, v]) => ({ k, lo: Math.min(...v), hi: Math.max(...v) })).sort((x, y) => y.hi - x.hi);
  const lo = baris.reduce((m, r) => (r.lo < m.lo ? r : m)), hi = baris[0], r0 = T[0];
  return {
    id: "tarif", topik: "pembiayaan", bobot: 68, est: true,
    judul: t("ins.trf.j", { lo: num(lo.lo, 2), tlo: lo.k, hi: num(hi.hi, 2), thi: hi.k }),
    nilai: num(hi.hi, 2), satuan: t("ins.trf.satuan"),
    penyebut: t("an.n_dari", { n: T.length, total: keu("tarif").length }),
    chart: () => dumbbell(baris.map((r) => ({ label: r.k, a: r.lo, b: r.hi, sorot: r.k === hi.k })), { kepA: t("ins.trf.rendah"), kepB: t("ins.trf.tinggi"), d: 2, label: t("ins.trf.chart") }),
    sumber: [S({ sumber: r0.dasar_hukum, url: r0.sumber_url, tanggal: r0.tanggal })],
    cara: t("ins.trf.cara"), penting: t("ins.trf.penting"), tgl: D.keuangan.dibangun_pada,
  };
}

function cAsean() {
  const B = D.asean?.baris ?? [], nil = (n) => n.bauran_persen?.nilai ?? null;
  const ada_ = B.filter((n) => nil(n) != null).sort((a, b) => nil(b) - nil(a)), id = ada_.findIndex((n) => n.iso3 === "IDN");
  if (id < 0) return null;
  const idn = ada_[id], med = median(ada_.map(nil)), s = D.asean.sumber.bauran;
  return {
    id: "asean", topik: "asean", bobot: 78, est: true,
    judul: t("ins.asn.j", { r: id + 1, n: ada_.length, v: num(nil(idn), 1), med: num(med, 1) }),
    nilai: num(nil(idn), 1), satuan: "%",
    penyebut: t("an.n_dari", { n: ada_.length, total: B.length }) + " | " + t("as.tahun", { tahun: idn.bauran_persen.tahun }),
    chart: () => batang(ada_.map((n) => ({ label: n.nama, sorot: n.iso3 === "IDN", v: nil(n), teks: num(nil(n), 1) + "%" })), { maks: 100, ref: med, teksRef: t("ins.g.median", { v: num(med, 1) }), label: t("ins.asn.chart") }),
    sumber: [S({ sumber: s.sumber, halaman: s.keterangan, url: s.url, tanggal: s.tanggal })],
    cara: t("ins.asn.cara"), penting: t("ins.asn.penting"), tgl: D.asean.dibangun_pada,
  };
}

/* ---------- tren ---------- */
function tKapasitas() {
  const s = D.asean?.baris?.find((n) => n.iso3 === "IDN")?.tren_kapasitas;
  if (!s || s.length < 2) return null;
  const a = s[0], b = s[s.length - 1], m = D.asean.sumber.kapasitas;
  return {
    id: "t-kap", topik: "asean", est: true,
    judul: t("ins.tk.j", { a: a.tahun, b: b.tahun, va: num(a.nilai), vb: num(b.nilai) }),
    nilai: num(b.nilai - a.nilai), satuan: "MW",
    chart: () => garis(s.map((p) => String(p.tahun)), [{ nama: t("ins.tk.seri"), v: s.map((p) => p.nilai), sorot: true }], { area: true, label: t("ins.tk.chart"), teksAkhir: false }),
    sumber: [S({ sumber: m.sumber, halaman: m.keterangan, url: m.url, tanggal: m.tanggal })],
    cara: t("ins.tk.cara"), penting: t("ins.tk.penting"), tgl: D.asean.dibangun_pada,
  };
}

function tPipeline() {
  const P = proyek().filter((p) => belumJalan(p) && cod(p) != null && MW(p) != null && (!fTek || p.teknologi === fTek) && (!fProv || prov(p) === fProv));
  if (!proyek().length) return null;
  const per = new Map();
  P.forEach((p) => per.set(cod(p), (per.get(cod(p)) ?? 0) + MW(p)));
  const th = [...per.keys()].sort((a, b) => a - b), semua = th.length ? Array.from({ length: th[th.length - 1] - th[0] + 1 }, (_, i) => th[0] + i) : [];
  return {
    id: "t-pip", topik: "proyek", est: true,
    judul: t("ins.tp.j", { tek: fTek ? namaTek(fTek) : t("rt.semua"), prov: fProv || t("rt.semua"), n: P.length }),
    nilai: num(jumlah([...per.values()])), satuan: "MW",
    penyebut: t("an.n_dari", { n: P.length, total: proyek().length }),
    chart: () => (P.length ? kolom(semua.map((y) => ({ label: String(y), v: Math.round(per.get(y) ?? 0) })), { label: t("ins.tp.chart") }) : `<p class="jm-bantu">${esc(t("ins.kosong"))}</p>`),
    sumber: [sumberData("ins.s.proyek", "proyek")],
    cara: t("ins.tp.cara"), penting: t("ins.tp.penting"), tgl: D.proyek.dibangun_pada,
  };
}

function tRegulasi() {
  const R_ = D.regulasi?.baris ?? [];
  if (!R_.length) return null;
  const maks = Math.max(...R_.map((r) => r.tahun).filter(Number.isFinite)), th = Array.from({ length: 15 }, (_, i) => maks - 14 + i);
  const terbit = th.map((y) => R_.filter((r) => r.tahun === y).length), cabut = th.map((y) => R_.filter((r) => r.tahun === y && r.status === "dicabut").length);
  return {
    id: "t-reg", topik: "regulasi", est: true,
    judul: t("ins.tr.j", { a: th[0], b: maks, n: num(jumlah(terbit)) }),
    nilai: num(jumlah(terbit)), satuan: t("ins.regulasi"),
    penyebut: t("an.n_dari", { n: jumlah(terbit), total: R_.length }),
    chart: () => garis(th.map((y) => String(y).slice(2)), [{ nama: t("ins.tr.terbit"), v: terbit, sorot: true }, { nama: t("ins.tr.dicabut"), v: cabut }], { label: t("ins.tr.chart") }),
    sumber: [sumberData("ins.s.regulasi", "regulasi")],
    cara: t("ins.tr.cara"), penting: t("ins.tr.penting"), tgl: D.regulasi.dibangun_pada,
  };
}

function tBerita() {
  const B = (D.berita?.baris ?? []).filter((b) => Date.parse(b.terbit));
  if (!B.length) return null;
  const bln = (b) => b.terbit.slice(0, 7), bulan = [...new Set(B.map(bln))].sort();
  if (bulan.length < 2) return null;
  const tot = {};
  B.forEach((b) => (b.kepakaran ?? []).forEach((k) => { if (namaTek(k)) tot[k] = (tot[k] ?? 0) + 1; }));
  const pilih = fTek ? [fTek] : Object.entries(tot).sort((a, b) => b[1] - a[1]).slice(0, 4).map((x) => x[0]);
  const seri = pilih.map((k, i) => ({ nama: namaTek(k), sorot: i === 0, v: bulan.map((m) => B.filter((b) => bln(b) === m && (b.kepakaran ?? []).includes(k)).length) }));
  const n = jumlah(seri.flatMap((s) => s.v));
  return {
    id: "t-ber", topik: "berita", est: true,
    judul: t("ins.tb.j", { tek: fTek ? namaTek(fTek) : t("rt.semua"), a: bulan[0], b: bulan[bulan.length - 1], n: num(n) }),
    nilai: num(n), satuan: t("ins.berita"),
    penyebut: t("an.n_dari", { n: B.filter((b) => (b.kepakaran ?? []).length).length, total: D.berita.baris.length }),
    chart: () => (n ? garis(bulan.map((m) => m.slice(2)), seri, { label: t("ins.tb.chart") }) : `<p class="jm-bantu">${esc(t("ins.kosong"))}</p>`),
    sumber: [sumberData("ins.s.berita", "berita")],
    cara: t("ins.tb.cara"), penting: t("ins.tb.penting"), tgl: D.berita.dibangun_pada,
  };
}

function tAsean() {
  const B = D.asean?.baris ?? [], idn = B.find((n) => n.iso3 === "IDN");
  if (!idn?.tren_bauran?.length) return null;
  const th = idn.tren_bauran.map((p) => p.tahun), s = D.asean.sumber.bauran;
  const med = th.map((y) => median(B.map((n) => n.tren_bauran?.find((p) => p.tahun === y)?.nilai).filter(Number.isFinite)));
  const a = idn.tren_bauran[0], b = idn.tren_bauran[th.length - 1];
  return {
    id: "t-asn", topik: "asean", est: true,
    judul: t("ins.ta.j", { a: th[0], b: th[th.length - 1], va: num(a.nilai, 1), vb: num(b.nilai, 1), med: num(med[med.length - 1], 1) }),
    nilai: num(b.nilai - a.nilai, 1), satuan: t("as.pp"),
    penyebut: t("an.n_dari", { n: B.filter((n) => n.tren_bauran?.length).length, total: B.length }),
    chart: () => garis(th.map((y) => String(y).slice(2)), [{ nama: "Indonesia", v: idn.tren_bauran.map((p) => p.nilai), sorot: true }, { nama: t("ins.ta.median"), v: med }], { d: 1, label: t("ins.ta.chart") }),
    sumber: [S({ sumber: s.sumber, halaman: s.keterangan, url: s.url, tanggal: s.tanggal })],
    cara: t("ins.ta.cara"), penting: t("ins.ta.penting"), tgl: D.asean.dibangun_pada,
  };
}

function tKarbon() {
  const B = bursa();
  if (B.length < 2) return null;
  const [a, z] = [B[0].periode, B[B.length - 1].periode], bln = [];
  for (let y = +a.slice(0, 4), m = +a.slice(5); `${y}-${String(m).padStart(2, "0")}` <= z; m === 12 ? (y++, (m = 1)) : m++) bln.push(`${y}-${String(m).padStart(2, "0")}`);
  const nilai = bln.map((p) => { const r = B.find((x) => x.periode === p); return r ? Math.round(r.nilai_idr / 1e6) : null; });
  return {
    id: "t-kar", topik: "karbon", est: true,
    judul: t("ins.tkar.j", { a, b: z, n: B.length, max: num(Math.max(...nilai.filter((v) => v != null))) }),
    nilai: num(jumlah(nilai.filter((v) => v != null))), satuan: t("ins.tkar.satuan"),
    penyebut: t("an.n_dari", { n: B.length, total: bln.length }),
    chart: () => garis(bln.map(blnPendek), [{ nama: t("ins.tkar.seri"), v: nilai, sorot: true }], { area: true, label: t("ins.tkar.chart"), teksAkhir: false }),
    sumber: [S({ sumber: B[0].sumber, url: B[0].halaman_sumber, tanggal: B[0].tanggal })],
    cara: t("ins.tkar.cara"), penting: t("ins.tkar.penting"), tgl: D.karbon.dibangun_pada,
  };
}

const TEMUAN = [cPipeline, cTerlambat, cCelah, cPlts, cBauran, cRegulasi, cBerita, cJetp, cKarbon, cTarif, cAsean];
const TREN = [tKapasitas, tPipeline, tRegulasi, tBerita, tKarbon, tAsean];
const URUT_TOPIK = ["proyek", "rantai", "wilayah", "regulasi", "berita", "pembiayaan", "karbon", "asean"];

/* ---------- render lazy ---------- */
const WARNA = { proyek: "a", rantai: "b", wilayah: "a", regulasi: "c", berita: "b", pembiayaan: "d", karbon: "d", asean: "c" };

/* Judul satu kalimat; angka kunci dibungkus .jm-hl (warna sorot). */
function judulSorot(c) {
  const j = esc(c.judul), n = esc(c.nilai), p = `${n} ${esc(c.satuan)}`;
  const kunci = j.includes(p) ? p : n;
  const i = kunci ? j.indexOf(kunci) : -1;
  return i < 0 ? j : j.slice(0, i) + `<span class="jm-hl">${kunci}</span>` + j.slice(i + kunci.length);
}

/* Bentuk kartu mengikuti "exhibit" Posko Karhutla: kepala (eyebrow, judul, sub tebal, satuan), badan grafik, kaki (catatan, sumber). */
function isiKartu(c) {
  const grafik = c.chart(), metrik = (grafik.match(/aria-label="([^"]*)"/) ?? [])[1] ?? "";
  return `<header class="jm-ex-hd"><button type="button" class="jm-ins-bagi" aria-haspopup="menu" aria-expanded="false" aria-label="${esc(t("ins.bagi"))}" title="${esc(t("ins.bagi"))}">${IKON_BAGI}</button>
    ${c.anchor ? `<span id="${esc(c.anchor)}"></span>` : ""}
    <span class="jm-ex-ey jm-ins-w-${WARNA[c.topik] ?? "a"}">${esc(t("ins.topik." + c.topik))}</span>
    <h3 class="jm-ins-j">${judulSorot(c)}</h3>
    <p class="jm-ex-sub">${metrik} ${c.est ? pil("an.est") : ""} ${c.hip ? pil("an.hipotesis") : ""}</p>
    <p class="jm-ex-unit">${esc(c.satuan)}</p></header>
  <div class="jm-ex-bd">${grafik}</div>
  <footer class="jm-ex-ft"><p class="jm-ex-fn"><b>${esc(t("ins.penting"))}</b> ${esc(c.penting)}</p>
    <p class="jm-ex-fn">${esc(c.penyebut ?? "")}</p>
    <div class="jm-ex-sum">${sumberLipat(c.sumber)}<a class="jm-ex-met" href="/metode#metode-${esc(c.id)}">${ikon("metode", 16)}${esc(t("ins.metode"))}</a></div></footer>`;
}

function pasang(el, daftar) {
  const peta = new Map(daftar.map((c) => [c.id, c]));
  el.innerHTML = daftar.map((c) => `<article class="jm-kartu jm-ins-kartu" id="ins-${esc(c.id)}" data-id="${esc(c.id)}" data-belum="1">${hantuHtml(3)}</article>`).join("");
  const isi = (a) => { const c = peta.get(a.dataset.id); if (c && a.dataset.belum) { a.innerHTML = isiKartu(c); delete a.dataset.belum; } };
  if (!("IntersectionObserver" in window)) { el.querySelectorAll("article").forEach(isi); return; }
  tinjau ??= new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { tinjau.unobserve(e.target); e.target._isi?.(); } }), { rootMargin: "400px 0px" });
  el.querySelectorAll("article").forEach((a) => { a._isi = () => isi(a); tinjau.observe(a); });
}

/* tiga angka utama di hero, tiap ubin menaut ke kartunya */
function ubin() {
  const nilai = TEMUAN.map((f) => f()).filter(Boolean), U = ["terlambat", "pipeline", "plts"].map((id) => nilai.find((c) => c.id === id)).filter(Boolean);
  $("ubin").innerHTML = U.map((c) => `<a class="jm-ins-ub" href="#ins-${esc(c.id)}"><b>${esc(c.nilai)}<small>${esc(c.satuan)}</small></b><span>${esc(t("ins.hero." + c.id))}</span></a>`).join("");
}

function gambarTemuan() {
  const k = TEMUAN.map((f) => f()).filter(Boolean);
  k.sort(urut === "topik" ? (a, b) => URUT_TOPIK.indexOf(a.topik) - URUT_TOPIK.indexOf(b.topik) || b.bobot - a.bobot : (a, b) => b.bobot - a.bobot);
  pasang($("temuan"), k);
  ubin();
  return k.length;
}
const gambarTren = () => { const k = TREN.map((f) => f()).filter(Boolean); pasang($("tren-isi"), k); return k.length; };

function isiFilter() {
  const tek = [...new Set(proyek().map((p) => p.teknologi).filter(namaTek))].sort((a, b) => namaTek(a).localeCompare(namaTek(b)));
  const pv = [...new Set(proyek().map(prov).filter(Boolean))].sort(), semua = ["", t("rt.semua")];
  $("saring-urut").innerHTML = pilihHtml({ id: "urut", ikon: "status", label: t("ins.urut"), nilai: urut, opsi: [["penting", t("ins.urut.penting")], ["topik", t("ins.urut.topik")]] });
  $("saring-tren").innerHTML = pilihHtml({ id: "f-tek", ikon: "jenis", label: t("ins.f_tek"), nilai: fTek, opsi: [semua, ...tek.map((k) => [k, namaTek(k), "tek:" + k])] }) + pilihHtml({ id: "f-prov", ikon: "wilayah", label: t("ins.f_prov"), nilai: fProv, opsi: [semua, ...pv.map((v) => [v, v])] });
  $("urut").addEventListener("change", (e) => { urut = e.target.value; nanti(gambarTemuan); });
  $("f-tek").addEventListener("change", (e) => { fTek = e.target.value; nanti(gambarTren); });
  $("f-prov").addEventListener("change", (e) => { fProv = e.target.value; nanti(gambarTren); });
}

/* tautan #ins-<id>: gulir ke kartu (dirender dulu bila masih kerangka) dan sorot sebentar */
function sorotHash() {
  const a = location.hash.startsWith("#ins-") ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  if (!a) return;
  a._isi?.();
  a.scrollIntoView({ block: "start" });
  a.classList.add("jm-ins-sorot");
  setTimeout(() => a.classList.remove("jm-ins-sorot"), 3000);
}

function gambar() {
  const a = gambarTemuan(), b = gambarTren();
  $("jawab").textContent = t("ins.jawab", { n: a + b, tanggal: tanggal(D.proyek?.dibangun_pada ?? D.regulasi?.dibangun_pada) });
  sorotHash();
}

async function mulai() {
  await mulaiHalaman();
  $("temuan").innerHTML = hantuHtml(3);
  await Promise.all(NAMA.map(async (n) => { try { D[n] = await muatData(n + ".json"); } catch (e) { D[n] = null; } }));
  isiFilter();
  pasangBagi();
  gambar();
  addEventListener("hashchange", sorotHash);
  saatBahasa(() => { isiFilter(); gambar(); });
}
mulai();
