/* /insight: temuan dan tren dihitung saat render dari /data/*.json. Kartu tanpa data disembunyikan. Grafik SVG tanpa pustaka. */
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, hantuHtml } from "/inti/umum.js";
import { t, ada, tanggal } from "/i18n.js";
import { muatData, sumberHtml, batangSvg, pil, num, saatBahasa } from "/analisis.js";

const $ = (id) => document.getElementById(id);
const NAMA = ["proyek", "program", "regulasi", "berita", "wilayah", "asean", "rantai_plts", "kalender"];
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
const sumberData = (kunci, berkas) => sumberHtml({ sumber: t(kunci), tanggal: D[berkas].dibangun_pada });
const terpasangTotal = () => { const w = (D.wilayah?.baris ?? []).map((b) => b.terpasang_mw?.nilai).filter(Number.isFinite); return w.length ? jumlah(w) : null; };
const pangsa = (m, k) => { const tot = jumlah(Object.values(m)); return tot ? (m[k] / tot) * 100 : 0; };

/* ---------- grafik SVG ---------- */
const W = 680, H = 190, L = 48, R = 12, T = 14, B = 26;

function kolomSvg(item, { label }) {
  const maks = Math.max(1, ...item.map((x) => x.v)), lebar = (W - L - R) / item.length, y = (v) => T + (1 - v / maks) * (H - T - B);
  const batang = item.map((x, i) => {
    const bx = L + i * lebar + lebar * 0.15, tinggi = H - B - y(x.v);
    return `<rect class="jm-an-b1" x="${bx.toFixed(1)}" y="${y(x.v).toFixed(1)}" width="${(lebar * 0.7).toFixed(1)}" height="${Math.max(0, tinggi).toFixed(1)}"><title>${esc(x.label)}: ${esc(num(x.v))}</title></rect>` +
      (item.length <= 14 ? `<text class="jm-ins-nilai" x="${(bx + lebar * 0.35).toFixed(1)}" y="${(y(x.v) - 4).toFixed(1)}" text-anchor="middle">${esc(num(x.v))}</text>` : "") +
      `<text x="${(bx + lebar * 0.35).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(x.label)}</text>`;
  }).join("");
  return `<svg class="jm-ins-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" focusable="false"><line class="jm-an-grid" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>${batang}</svg>`;
}

/* seri: [{nama, v:[...] (null = kosong), k:1..4}]; area hanya untuk seri pertama. */
function garisSvg(label, seri, { area = false, d = 0, label: ariaLabel } = {}) {
  const n = label.length, ymaks = Math.max(1, ...seri.flatMap((s) => s.v.filter((x) => x != null))) * 1.1;
  const x = (i) => L + (n > 1 ? (i / (n - 1)) * (W - L - R) : (W - L - R) / 2), y = (v) => T + (1 - v / ymaks) * (H - T - B);
  const grid = [0, 1, 2, 3].map((i) => { const v = (ymaks * i) / 3; return `<line class="jm-an-grid" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text x="${L - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(num(v, d))}</text>`; }).join("");
  const langkah = Math.max(1, Math.ceil(n / 6));
  const sb = label.map((l, i) => (i % langkah === 0 || i === n - 1 ? `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>` : "")).join("");
  const g = seri.map((s, si) => {
    const p = s.v.map((v, i) => (v == null ? null : [x(i), y(v), v, i])).filter(Boolean);
    if (!p.length) return "";
    const pts = p.map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" ");
    const ar = area && si === 0 ? `<polygon class="jm-ins-a1" points="${p[0][0].toFixed(1)},${H - B} ${pts} ${p[p.length - 1][0].toFixed(1)},${H - B}"/>` : "";
    const titik = p.map((q) => `<circle class="jm-ins-t${s.k === 2 ? 2 : 1}" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="3"><title>${esc(s.nama)}, ${esc(label[q[3]])}: ${esc(num(q[2], d))}</title></circle>`).join("");
    return `${ar}<polyline class="jm-ins-l${s.k}" points="${pts}"/>${p.length <= 14 ? titik : ""}`;
  }).join("");
  const kunci = seri.length > 1 || seri[0]?.nama ? `<p class="jm-an-kunci">${seri.map((s) => `<span class="jm-an-sw jm-an-b${s.k}"></span>${esc(s.nama)}`).join(" ")}</p>` : "";
  return `<svg class="jm-ins-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ariaLabel ?? "")}" focusable="false">${grid}${sb}${g}</svg>${kunci}`;
}

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
    chart: () => kolomSvg(th.map((y) => ({ label: String(y), v: Math.round(per.get(y)) })), { label: t("ins.pip.chart") }),
    sumber: [sumberData("ins.s.proyek", "proyek"), sumberHtml(terpasangMeta())],
    cara: t("ins.pip.cara"), penting: t("ins.pip.penting"), tgl: D.proyek.dibangun_pada,
  };
}

function cTerlambat() {
  const ada_ = proyek().filter((p) => belumJalan(p) && cod(p) != null);
  if (!ada_.length) return null;
  const lewat = ada_.filter((p) => cod(p) < tahunIni()), mw = jumlah(lewat.map((p) => MW(p) ?? 0));
  const per = new Map();
  lewat.forEach((p) => (p.program_ids?.length ? p.program_ids : ["-"]).forEach((id) => per.set(id, (per.get(id) ?? 0) + 1)));
  const nama = (id) => D.program?.baris?.find((b) => b.id === id)?.nama ?? t("an.tanpa_data");
  const baris = [...per].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, n]) => ({ label: nama(id), bagian: [{ nilai: n, kelas: "jm-an-b3" }], teks: num(n) }));
  return {
    id: "terlambat", topik: "proyek", bobot: 95, est: true,
    judul: t("ins.tel.j", { n: lewat.length, mw: num(mw), tahun: tahunIni() }),
    nilai: num(lewat.length), satuan: t("ins.proyek"),
    penyebut: t("an.n_dari", { n: lewat.length, total: ada_.length }),
    chart: () => (baris.length ? batangSvg(baris, { label: t("ins.tel.chart") }) : `<p class="jm-bantu">${esc(t("ins.kosong"))}</p>`),
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
    chart: () => batangSvg(top.map((r) => ({ label: r.nama, bagian: [{ nilai: r.ter, kelas: "jm-an-b1" }, { nilai: r.gap, kelas: "jm-an-b3" }], teks: num(r.gap) + " MW" })), { maks, label: t("ins.cel.chart") }) +
      `<p class="jm-an-kunci"><span class="jm-an-sw jm-an-b1"></span>${esc(t("ins.cel.terpasang"))} <span class="jm-an-sw jm-an-b3"></span>${esc(t("ins.cel.sisa"))}</p>`,
    sumber: [sumberHtml({ sumber: a.meta.sumber, halaman: a.meta.halaman, tahun: a.meta.tahun, url: a.meta.url, tanggal: a.meta.tanggal }), sumberHtml(terpasangMeta())],
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
    chart: () => batangSvg([
      { label: t("ins.plt.butuh"), bagian: [{ nilai: butuh, kelas: "jm-an-b3" }], teks: num(butuh, 1) + " GWp" },
      { label: t("ins.plt.lokal"), bagian: [{ nilai: lokal, kelas: "jm-an-b1" }], teks: num(lokal, 1) + " GWp" },
    ], { label: t("ins.plt.chart") }),
    sumber: [sumberHtml({ sumber: D.rantai_plts.sumber.judul, tanggal: D.rantai_plts.sumber.tanggal }), sumberHtml({ sumber: pr.sumber, tanggal: pr.tanggal_sumber })],
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
  const baris = hasil.flatMap((h) => [
    { label: `${namaTek(h.k)}: ${t("ins.mix.pipeline")}`, bagian: [{ nilai: h.a, kelas: "jm-an-b1" }], teks: num(h.a, 1) + "%" },
    { label: `${namaTek(h.k)}: ${t("ins.mix.terpasang")}`, bagian: [{ nilai: h.b, kelas: "jm-an-b2" }], teks: num(h.b, 1) + "%" },
  ]);
  return {
    id: "bauran", topik: "proyek", bobot: 75, est: true,
    judul: t("ins.mix.j", { tek: namaTek(sorot.k), a: num(sorot.a, 0), b: num(sorot.b, 0) }),
    nilai: num(sorot.a, 0), satuan: "%",
    penyebut: t("an.n_dari", { n: kunci.length, total: Object.keys(pip).length }),
    chart: () => batangSvg(baris, { maks: 100, label: t("ins.mix.chart") }),
    sumber: [sumberData("ins.s.proyek", "proyek"), sumberHtml(terpasangMeta())],
    cara: t("ins.mix.cara"), penting: t("ins.mix.penting"), tgl: D.proyek.dibangun_pada,
  };
}

function cRegulasi() {
  const R_ = (D.regulasi?.baris ?? []).filter((r) => Date.parse(r.tanggal_ditetapkan));
  if (!R_.length) return null;
  const now = sekarang(), n1 = R_.filter((r) => { const d = Date.parse(r.tanggal_ditetapkan); return d > now - 365 * HARI && d <= now; }).length;
  const n0 = R_.filter((r) => { const d = Date.parse(r.tanggal_ditetapkan); return d > now - 730 * HARI && d <= now - 365 * HARI; }).length;
  const dicabut = D.regulasi.baris.filter((r) => r.status === "dicabut").length;
  const ruu = (D.kalender?.baris ?? []).filter((k) => /RUU EBET/i.test(k.judul)).sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0];
  return {
    id: "regulasi", topik: "regulasi", bobot: 70, est: true,
    judul: t("ins.reg.j", { n: num(n1), m: num(n0), dicabut: num(dicabut), total: num(D.regulasi.baris.length) }),
    nilai: num(n1), satuan: t("ins.regulasi"),
    penyebut: t("an.n_dari", { n: R_.length, total: D.regulasi.baris.length }),
    chart: () => batangSvg([
      { label: t("ins.reg.b1"), bagian: [{ nilai: n1, kelas: "jm-an-b1" }], teks: num(n1) },
      { label: t("ins.reg.b0"), bagian: [{ nilai: n0, kelas: "jm-an-b4" }], teks: num(n0) },
    ], { label: t("ins.reg.chart") }) + (ruu ? `<p class="jm-bantu">${esc(t("ins.reg.ruu", { judul: ruu.judul, tanggal: tanggal(ruu.tanggal) }))}</p>` : ""),
    sumber: [sumberData("ins.s.regulasi", "regulasi"), ...(ruu ? [sumberHtml({ sumber: t("ins.s.kalender"), tanggal: ruu.sumber?.tanggal ?? D.kalender.dibangun_pada })] : [])],
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
    chart: () => batangSvg(top.map(([kk, nn]) => ({ label: namaTek(kk), bagian: [{ nilai: nn, kelas: "jm-an-b1" }], teks: t("ins.ber.baris", { n: num(nn), m: num(lama[kk] ?? 0) }) })), { label: t("ins.ber.chart") }),
    sumber: [sumberData("ins.s.berita", "berita")],
    cara: t("ins.ber.cara"), penting: t("ins.ber.penting"), tgl: D.berita.dibangun_pada,
  };
}

function cJetp() {
  const j = D.program?.baris?.find((b) => b.id === "jetp");
  if (!j?.jumlah_proyek) return null;
  const baris = Object.entries(j.per_teknologi ?? {}).filter(([k]) => namaTek(k)).map(([k, n]) => ({ label: namaTek(k), bagian: [{ nilai: n, kelas: "jm-an-b1" }], teks: num(n) }));
  return {
    id: "jetp", topik: "pembiayaan", bobot: 60,
    judul: t("ins.fin.j", { n: j.jumlah_proyek, mw: num(j.kapasitas_mw) }),
    nilai: num(j.kapasitas_mw), satuan: "MW",
    penyebut: t("an.n_dari", { n: j.jumlah_proyek, total: proyek().length }),
    chart: () => batangSvg(baris, { label: t("ins.fin.chart") }),
    sumber: [sumberData("ins.s.proyek", "program")],
    cara: t("ins.fin.cara"), penting: t("ins.fin.penting"), tgl: D.program.dibangun_pada,
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
    chart: () => batangSvg(ada_.map((n) => ({ label: n.nama, sorot: n.iso3 === "IDN", bagian: [{ nilai: nil(n), kelas: n.iso3 === "IDN" ? "jm-an-b1" : "jm-an-b4" }], teks: num(nil(n), 1) + " %" })), { maks: 100, label: t("ins.asn.chart") }),
    sumber: [sumberHtml({ sumber: s.sumber, halaman: s.keterangan, url: s.url, tanggal: s.tanggal })],
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
    chart: () => garisSvg(s.map((p) => String(p.tahun)), [{ nama: t("ins.tk.seri"), v: s.map((p) => p.nilai), k: 1 }], { area: true, label: t("ins.tk.chart") }),
    sumber: [sumberHtml({ sumber: m.sumber, halaman: m.keterangan, url: m.url, tanggal: m.tanggal })],
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
    chart: () => (P.length ? garisSvg(semua.map(String), [{ nama: t("ins.tp.seri"), v: semua.map((y) => Math.round(per.get(y) ?? 0)), k: 1 }], { area: true, label: t("ins.tp.chart") }) : `<p class="jm-bantu">${esc(t("ins.kosong"))}</p>`),
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
    chart: () => garisSvg(th.map(String), [{ nama: t("ins.tr.terbit"), v: terbit, k: 1 }, { nama: t("ins.tr.dicabut"), v: cabut, k: 3 }], { area: true, label: t("ins.tr.chart") }),
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
  const seri = pilih.map((k, i) => ({ nama: namaTek(k), k: i + 1, v: bulan.map((m) => B.filter((b) => bln(b) === m && (b.kepakaran ?? []).includes(k)).length) }));
  const n = jumlah(seri.flatMap((s) => s.v));
  return {
    id: "t-ber", topik: "berita", est: true,
    judul: t("ins.tb.j", { tek: fTek ? namaTek(fTek) : t("rt.semua"), a: bulan[0], b: bulan[bulan.length - 1], n: num(n) }),
    nilai: num(n), satuan: t("ins.berita"),
    penyebut: t("an.n_dari", { n: B.filter((b) => (b.kepakaran ?? []).length).length, total: D.berita.baris.length }),
    chart: () => (n ? garisSvg(bulan, seri, { label: t("ins.tb.chart") }) : `<p class="jm-bantu">${esc(t("ins.kosong"))}</p>`),
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
    chart: () => garisSvg(th.map(String), [{ nama: "Indonesia", v: idn.tren_bauran.map((p) => p.nilai), k: 1 }, { nama: t("ins.ta.median"), v: med, k: 2 }], { d: 1, label: t("ins.ta.chart") }),
    sumber: [sumberHtml({ sumber: s.sumber, halaman: s.keterangan, url: s.url, tanggal: s.tanggal })],
    cara: t("ins.ta.cara"), penting: t("ins.ta.penting"), tgl: D.asean.dibangun_pada,
  };
}

const TEMUAN = [cPipeline, cTerlambat, cCelah, cPlts, cBauran, cRegulasi, cBerita, cJetp, cAsean];
const TREN = [tKapasitas, tPipeline, tRegulasi, tBerita, tAsean];
const URUT_TOPIK = ["proyek", "rantai", "wilayah", "regulasi", "berita", "pembiayaan", "asean"];

/* ---------- render lazy ---------- */
function isiKartu(c) {
  return `<p class="jm-an-label">${esc(t("ins.topik." + c.topik))}</p>
    <h3 class="jm-ins-j">${esc(c.judul)}</h3>
    <p class="jm-an-angka">${esc(c.nilai)} <span>${esc(c.satuan)}</span> ${c.est ? pil("an.est") : ""} ${c.hip ? pil("an.hipotesis") : ""}</p>
    ${c.penyebut ? `<p class="jm-bantu">${esc(c.penyebut)}</p>` : ""}
    <div class="jm-ins-grafik">${c.chart()}</div>
    <p class="jm-ins-penting"><b>${esc(t("ins.penting"))}</b> ${esc(c.penting)}</p>
    ${c.sumber.join("")}
    <details${c.hip ? " open" : ""}><summary>${esc(t("an.cara"))}</summary><p>${esc(c.cara)}</p></details>
    <small class="jm-an-sumber">${esc(t("ins.tgl", { tanggal: tanggal(c.tgl) }))}</small>`;
}

function pasang(el, daftar) {
  const peta = new Map(daftar.map((c) => [c.id, c]));
  el.innerHTML = daftar.map((c) => `<article class="jm-kartu jm-ins-kartu" data-id="${esc(c.id)}" data-belum="1">${hantuHtml(3)}</article>`).join("");
  const isi = (a) => { const c = peta.get(a.dataset.id); if (c && a.dataset.belum) { a.innerHTML = isiKartu(c); delete a.dataset.belum; } };
  if (!("IntersectionObserver" in window)) { el.querySelectorAll("article").forEach(isi); return; }
  tinjau ??= new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { tinjau.unobserve(e.target); isi(e.target); } }), { rootMargin: "400px 0px" });
  el.querySelectorAll("article").forEach((a) => { a._isi = () => isi(a); tinjau.observe(a); });
}

function gambarTemuan() {
  const k = TEMUAN.map((f) => f()).filter(Boolean);
  k.sort(urut === "topik" ? (a, b) => URUT_TOPIK.indexOf(a.topik) - URUT_TOPIK.indexOf(b.topik) || b.bobot - a.bobot : (a, b) => b.bobot - a.bobot);
  pasang($("temuan"), k);
  return k.length;
}
const gambarTren = () => { const k = TREN.map((f) => f()).filter(Boolean); pasang($("tren"), k); return k.length; };

function isiFilter() {
  const tek = new Set(proyek().map((p) => p.teknologi).filter(namaTek)), pv = [...new Set(proyek().map(prov).filter(Boolean))].sort();
  const opsi = (el, daftar, lab) => el.insertAdjacentHTML("beforeend", daftar.map((v) => `<option value="${esc(v)}">${esc(lab ? lab(v) : v)}</option>`).join(""));
  opsi($("f-tek"), [...tek].sort((a, b) => namaTek(a).localeCompare(namaTek(b))), namaTek);
  opsi($("f-prov"), pv);
}

function cara() {
  $("cara").innerHTML = ["ins.cara1", "ins.cara2", "ins.cara3", "ins.cara4"].map((k) => `<p>${esc(t(k))}</p>`).join("");
  $("kutip").textContent = t("ins.kutip", { tanggal: tanggal(D.proyek?.dibangun_pada ?? D.regulasi?.dibangun_pada, { gaya: "panjang" }) });
}

function gambar() {
  const a = gambarTemuan(), b = gambarTren();
  $("jawab").textContent = t("ins.jawab", { n: a + b, tanggal: tanggal(D.proyek?.dibangun_pada ?? D.regulasi?.dibangun_pada) });
  cara();
}

async function mulai() {
  await mulaiHalaman();
  $("temuan").innerHTML = hantuHtml(3);
  await Promise.all(NAMA.map(async (n) => { try { D[n] = await muatData(n + ".json"); } catch (e) { D[n] = null; } }));
  isiFilter();
  gambar();
  saatBahasa(() => { document.querySelectorAll("#f-tek option[value]:not([value=''])").forEach((o) => { o.textContent = namaTek(o.value); }); gambar(); });
  $("urut").addEventListener("change", (e) => { urut = e.target.value; nanti(gambarTemuan); });
  $("f-tek").addEventListener("change", (e) => { fTek = e.target.value; nanti(gambarTren); });
  $("f-prov").addEventListener("change", (e) => { fProv = e.target.value; nanti(gambarTren); });
}
mulai();
