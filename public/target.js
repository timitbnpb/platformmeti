/* /target: pelacak target resmi pemerintah vs realisasi. Data: target_realisasi.json (dirakit scripts/pipa/target_realisasi.mjs dari target.json,
   ember_bulanan.json, program_analisis.json, rued_capaian.json, berita.json). Status = turunan EST (laju historis vs laju dibutuhkan).
   INP: saringan kategori mengubah chrome seketika; isi kisi menyusul lewat nanti(). Grafik SVG tanpa pustaka, tooltip crosshair satu pendengar bersama. */
import { t, bahasa, tanggal } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml } from "/inti/umum.js";
import { exHtml, sumberHtml, unduhRegHtml, pasangUrutTabel } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { khSisi } from "/inti/kh.js";
import { num, saatBahasa, tampilGalat, muatData, sumberLipat, amanUrl } from "/analisis.js";

const $ = (id) => document.getElementById(id);
const D = {};
const ST = { kat: "semua" };
const L = (o) => (o && (o[bahasa()] ?? o.id)) ?? "";
const KAT = ["bauran", "kapasitas", "emisi", "bahan-bakar", "kendaraan"];
const IK_KAT = { semua: "bendera", bauran: "grafik", kapasitas: "tek-surya", emisi: "pabrik", "bahan-bakar": "tek-bio", kendaraan: "petir", daerah: "wilayah" };
const IK_ST = { tercapai: "piala", "di-jalur": "centang", tertinggal: "peringatan", "jauh-tertinggal": "silang", "tidak-ada-data": "tanya" };
const BAIK = new Set(["tercapai", "di-jalur"]);

/* ---------- format ---------- */
const des = (v) => { const r2 = +v.toFixed(2); return Number.isInteger(r2) ? 0 : +v.toFixed(1) === r2 ? 1 : 2; };
function nt(sat, v) {
  if (v == null) return "-";
  switch (sat) {
    case "persen": return num(v, des(v)) + "%";
    case "mw": return v >= 1000 ? num(v / 1000, v >= 100000 ? 0 : 1) + " GW" : num(v) + " MW";
    case "unit": return v >= 1e6 ? num(v / 1e6, 1) + " " + t("tg2.sat.juta") : num(v);
    case "juta_ton": return num(v, v < 10 ? 2 : 1) + " " + t("tg2.sat.juta_ton");
    case "usd_miliar": return "US$" + num(v, 1) + " " + t("tg2.sat.miliar");
    case "pltu": return num(v) + " " + t("tg2.sat.pltu");
    default: return num(v);
  }
}
const lajuTeks = (sat, v) => (v == null ? "-" : (sat === "persen" ? num(v, 2) + " " + t("tg2.sat.poin") : nt(sat, v)) + t("tg2.per_th"));
const tglTeks = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || "") ? tanggal(s) : s || "");
const thn = (d) => String(d.tahunTampil ?? Math.floor(d.tahun));

/* ---------- pil ---------- */
const pilSt = (s) => `<span class="tg-pil tg-st-${s}">${ikon(IK_ST[s], 14)}<span>${esc(t("tg2.st." + s))}</span></span>`;
const pilKat = (k) => `<span class="tg-pil tg-k-${k}">${ikon(IK_KAT[k], 14)}<span>${esc(t("tg2.kat." + k))}</span></span>`;

/* ---------- grafik ---------- */
const GF = new Map();
const langkahNice = (r) => [1, 2, 5, 10, 20, 25].find((s) => r / s <= 5) ?? 50;
function grafik(d, besar) {
  const W = besar ? 760 : 360, H = besar ? 320 : 150, Lm = besar ? 56 : 8, Rm = besar ? 22 : 8, Tm = besar ? 18 : 10, Bm = besar ? 34 : 6;
  const stg = (d.seriTarget || []).filter((x) => x[0] <= d.tahun), k = d.seri, tT = d.tahun, t0 = k.length ? k[0].t : tT - 5, akhir = k.length ? k[k.length - 1].t : tT;
  const tmin = Math.floor(Math.min(t0, ...stg.map((x) => x[0]))) - (k.length < 2 ? 1 : 0), tmax = Math.ceil(Math.max(tT, akhir));
  const vals = [...k.map((x) => x.v), d.nilai, d.maks ?? 0, ...stg.map((x) => x[1])];
  const bruto = Math.max(...vals) * 1.05 || 1, mag = 10 ** Math.floor(Math.log10(bruto)), ymax = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((v) => v >= bruto);
  const X = (v) => Lm + ((v - tmin) / (tmax - tmin)) * (W - Lm - Rm), Y = (v) => H - Bm - (v / ymax) * (H - Bm - Tm);
  const pts = (a) => a.map((p) => X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1)).join(" ");
  let g = "";
  const gy = [0, 0.5, 1];
  g += gy.map((f) => `<line class="tg-gr" x1="${Lm}" x2="${W - Rm}" y1="${Y(ymax * f).toFixed(1)}" y2="${Y(ymax * f).toFixed(1)}"/>${besar ? `<text class="tg-ax" x="${Lm - 8}" y="${(Y(ymax * f) + 4).toFixed(1)}" text-anchor="end">${esc(nt(d.satuan, ymax * f))}</text>` : ""}`).join("");
  if (besar) {
    const st = langkahNice(tmax - tmin);
    for (let y = Math.ceil(tmin / st) * st; y <= tmax; y += st) g += `<text class="tg-ax" x="${X(y).toFixed(1)}" y="${H - 10}" text-anchor="middle">${y}</text>`;
  } else g += `<text class="tg-ax" x="${Lm}" y="${H - 1}" text-anchor="start">${tmin}</text><text class="tg-ax" x="${W - Rm}" y="${H - 1}" text-anchor="end">${tmax}</text>`;
  if (stg.length > 1) g += `<polyline class="tg-sT" points="${pts(stg)}"/>`;
  g += `<line class="tg-tgt" x1="${Lm}" x2="${W - Rm}" y1="${Y(d.nilai).toFixed(1)}" y2="${Y(d.nilai).toFixed(1)}"/>`;
  if (d.maks) g += `<line class="tg-tgt tg-tgt-maks" x1="${Lm}" x2="${W - Rm}" y1="${Y(d.maks).toFixed(1)}" y2="${Y(d.maks).toFixed(1)}"/>`;
  if (d.jalur.length) g += `<polyline class="tg-jl" points="${pts(d.jalur)}"/>`;
  if (d.proyeksi.length) g += `<polyline class="tg-pr" points="${pts(d.proyeksi)}"/>`;
  if (k.length > 1) g += `<polyline class="tg-r" points="${pts(k.map((x) => [x.t, x.v]))}"/>`;
  g += `<circle class="tg-tp" cx="${X(tT).toFixed(1)}" cy="${Y(d.nilai).toFixed(1)}" r="${besar ? 6 : 4.5}"/>`;
  if (k.length <= 14) g += k.map((x) => `<circle class="tg-rp" cx="${X(x.t).toFixed(1)}" cy="${Y(x.v).toFixed(1)}" r="${besar ? 3.6 : 2.6}"/>`).join("");
  else { const z = k[k.length - 1]; g += `<circle class="tg-rp" cx="${X(z.t).toFixed(1)}" cy="${Y(z.v).toFixed(1)}" r="${besar ? 4.5 : 3.4}"/>`; }
  g += `<line class="tg-ch" y1="${Tm}" y2="${H - Bm}" hidden/><circle class="tg-chd" r="5" hidden/>`;
  const id = (besar ? "b-" : "m-") + d.id;
  GF.set(id, { d, W, H, Lm, Rm, Tm, Bm, tmin, tmax, X, Y });
  const ket = `${L(d.nama)}: ${nt(d.satuan, d.terbaru?.v)} / ${nt(d.satuan, d.nilai)} (${tT > 3000 ? "" : Math.floor(tT)})`;
  return `<svg class="tg-gf${besar ? " tg-gf-b" : ""}" data-g="${esc(id)}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ket)}" focusable="false">${g}</svg>`;
}

/* tooltip crosshair: titik terdekat (pengamatan, tenggat, atau tahun seri target) + jalur dan proyeksi pada waktu itu */
let tip;
const kotak = () => tip || (tip = Object.assign(document.createElement("div"), { className: "jm-gf-tip tg-tip", hidden: true, role: "tooltip" }), document.body.append(tip), tip);
const antar = (a, x) => { if (a.length < 2 || x < a[0][0] || x > a[1][0]) return null; return a[0][1] + ((a[1][1] - a[0][1]) * (x - a[0][0])) / (a[1][0] - a[0][0] || 1); };
function kandidat(d) {
  const m = new Map();
  const ambil = (tt) => { const kk = tt.toFixed(3); if (!m.has(kk)) m.set(kk, { t: tt }); return m.get(kk); };
  d.seri.forEach((x) => { ambil(x.t).real = x; });
  (d.seriTarget || []).filter((x) => x[0] <= d.tahun).forEach((x) => { ambil(x[0]).st = x[1]; });
  ambil(d.tahun).tgt = d.nilai;
  return [...m.values()];
}
function tampilTip(svg, ev) {
  const gf = GF.get(svg.dataset.g); if (!gf) return;
  const { d, W, Lm, Rm, tmin, tmax, X, Y } = gf, r = svg.getBoundingClientRect();
  const tt = tmin + (((ev.clientX - r.left) / r.width) * W - Lm) / (W - Lm - Rm) * (tmax - tmin);
  const c = kandidat(d).reduce((a, b) => (Math.abs(b.t - tt) < Math.abs(a.t - tt) ? b : a));
  const jl = antar(d.jalur, c.t), pr = antar(d.proyeksi, c.t);
  const baris = [];
  if (c.real) baris.push([t("tg2.tip.real"), nt(d.satuan, c.real.v)]);
  if (jl != null && !c.real) baris.push([t("tg2.tip.jalur"), nt(d.satuan, jl)]);
  if (pr != null && !c.real) baris.push([t("tg2.tip.proy"), nt(d.satuan, pr)]);
  if (c.st != null) baris.push([t("tg2.tip.tahunan"), nt(d.satuan, c.st)]);
  if (c.tgt != null) baris.push([t("tg2.tip.target"), nt(d.satuan, c.tgt)]);
  const sel = c.real && d.nilai ? ` ${t("tg2.tip.capai", { p: num(c.real.v / d.nilai * 100, 0) })}` : "";
  const k = kotak(); k.replaceChildren();
  const b = document.createElement("b"); b.textContent = (c.real?.tgl ? tglTeks(c.real.tgl) : Number.isInteger(c.t) ? String(c.t) : tglTeks(c.real?.tgl) || String(Math.floor(c.t))) + " - " + L(d.nama); k.append(b);
  for (const [a, v] of baris) { const s = document.createElement("span"); s.textContent = `${a}: ${v}`; k.append(s); }
  if (sel) { const s = document.createElement("small"); s.textContent = sel.trim(); k.append(s); }
  k.hidden = false;
  const ch = svg.querySelector(".tg-ch"), dot = svg.querySelector(".tg-chd"), vy = c.real ? c.real.v : jl ?? pr ?? c.st ?? c.tgt;
  ch.setAttribute("x1", X(c.t).toFixed(1)); ch.setAttribute("x2", X(c.t).toFixed(1)); ch.removeAttribute("hidden");
  dot.setAttribute("cx", X(c.t).toFixed(1)); dot.setAttribute("cy", Y(vy).toFixed(1)); dot.removeAttribute("hidden");
  svg.classList.add("tg-fokus");
  const w = k.offsetWidth, h = k.offsetHeight, px = r.left + (X(c.t) / W) * r.width;
  k.style.left = Math.min(Math.max(px - w / 2, 8), innerWidth - w - 8) + "px";
  k.style.top = (r.top - h - 8 < 8 ? r.bottom + 8 : r.top - h - 8) + "px";
}
function sembunyiTip() {
  if (tip) tip.hidden = true;
  for (const s of document.querySelectorAll("svg.tg-fokus")) { s.classList.remove("tg-fokus"); s.querySelector(".tg-ch")?.setAttribute("hidden", ""); s.querySelector(".tg-chd")?.setAttribute("hidden", ""); }
}
document.addEventListener("pointermove", (e) => { const s = e.target.closest?.("svg.tg-gf"); if (s) tampilTip(s, e); else if (tip && !tip.hidden) sembunyiTip(); });
document.addEventListener("pointerdown", (e) => { const s = e.target.closest?.("svg.tg-gf"); if (s) tampilTip(s, e); });
addEventListener("scroll", sembunyiTip, { passive: true });

/* ---------- kartu ---------- */
const fakta = (lbl, nil, kls = "") => `<div class="tg-fk${kls ? " " + kls : ""}"><span class="tg-fk-l">${esc(lbl)}</span><b>${esc(nil)}</b></div>`;
function kartu(d) {
  const cap = d.capaianPersen == null ? "-" : num(d.capaianPersen, 0) + "%";
  return `<article class="tg-kartu tg-s-${d.status}" data-buka="${esc(d.id)}"><header class="tg-k-hd">${pilKat(d.kat)}${pilSt(d.status)}</header>
  <h3 class="tg-nama">${esc(L(d.nama))}</h3>
  <p class="tg-ang"><b>${esc(cap)}</b><span>${esc(t("tg2.capai"))}</span></p>
  ${grafik(d, false)}
  <div class="tg-fks">${fakta(t("tg2.real"), nt(d.satuan, d.terbaru?.v))}${fakta(t("tg2.target") + " " + thn(d), nt(d.satuan, d.nilai))}${fakta(t("tg2.butuh"), lajuTeks(d.satuan, d.butuhPerTahun))}${fakta(t("tg2.laju"), lajuTeks(d.satuan, d.lajuHistoris))}</div>
  <button type="button" class="tg-buka" data-buka-b="${esc(d.id)}">${ikon("grafik", 16)}<span>${esc(t("tg2.lihat"))}</span></button></article>`;
}
function isiKisi() {
  const a = D.o.target.filter((x) => ST.kat === "semua" || x.kat === ST.kat);
  $("tgKisi").innerHTML = a.map(kartu).join("");
  $("tgHit").textContent = t("tg2.hitung", { n: a.length });
}

/* ---------- modal ---------- */
function legenda(d) {
  const it = [["tg-lg-r", "tg2.leg.real"], ["tg-lg-t", "tg2.leg.target"]];
  if (d.jalur.length) it.push(["tg-lg-j", "tg2.leg.jalur"]);
  if (d.proyeksi.length) it.push(["tg-lg-p", "tg2.leg.proyeksi"]);
  if (d.seriTarget) it.push(["tg-lg-s", "tg2.leg.tahunan"]);
  return `<ul class="tg-leg">${it.map(([k, l]) => `<li><i class="${k}"></i>${esc(t(l))}</li>`).join("")}</ul>`;
}
function modal(d) {
  const pdf = /\.pdf(\?|$)/i.test(d.url) ? d.url : null;
  const s = d.sumberRealisasi;
  const pejabat = d.pejabat.length
    ? `<ol class="tg-pj">${d.pejabat.map((p) => `<li><time datetime="${esc(p.tanggal)}">${esc(tanggal(p.tanggal))}</time>${amanUrl(p.url) ? `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.judul)}</a>` : esc(p.judul)}<small>${esc(p.media)}</small></li>`).join("")}</ol>`
    : `<p class="jm-bantu">${esc(t("tg2.m.pj_kosong"))}</p>`;
  const lihat = [["/target#transisi", "nav.transisi", "tg2.lj.transisi", "tek-panas"], ["/target#strategi", "nav.strategi", "tg2.lj.strategi", "analisis"], ["/pelacak", "nav.pelacak", "tg2.lj.pelacak", "tingkat"]];
  return `<header class="tg-m-hd"><div class="tg-m-pil">${pilKat(d.kat)}${pilSt(d.status)}</div><button type="button" class="tg-tutup" data-tutup aria-label="${esc(t("tg2.m.tutup"))}">${ikon("silang", 20)}</button></header>
  <h2 id="tgMJ" class="tg-m-j">${esc(L(d.nama))}</h2>
  <div class="tg-fks tg-fks-m">${fakta(t("tg2.target") + " " + thn(d), nt(d.satuan, d.nilai) + (d.maks ? " - " + nt(d.satuan, d.maks) : ""))}${fakta(t("tg2.real") + " (" + tglTeks(d.terbaru?.tanggal) + ")", nt(d.satuan, d.terbaru?.v))}${fakta(t("tg2.capai_k"), d.capaianPersen == null ? "-" : num(d.capaianPersen, 1) + "%")}${fakta(t("tg2.m.rasio"), d.rasioLaju == null ? "-" : num(d.rasioLaju, 2) + "x")}</div>
  <div class="tg-m-gf">${grafik(d, true)}</div>${legenda(d)}
  <p class="tg-m-cat">${ikon("info", 16)}<span>${esc(L(d.catatan))}</span></p>
  <div class="tg-m-kol"><section><h3>${esc(t("tg2.m.dasar"))}</h3><p>${esc(d.dokumen)}</p><p class="jm-bantu">${esc(t("tg2.m.pasal"))}: ${esc(d.pasal)}</p><p class="tg-m-dl">${unduhRegHtml({ judul: d.dokumen, url_pdf: pdf, url_sumber: d.url })}</p>
  <h3>${esc(t("tg2.m.realisasi"))}</h3>${s ? sumberLipat([{ sumber: s.judul, url: s.url, tanggal: s.tgl }]) : ""}</section>
  <section><h3>${esc(t("tg2.m.pejabat"))}</h3>${pejabat}</section></div>
  <nav class="tg-lj" aria-label="${esc(t("tg2.lj.judul"))}">${lihat.map(([h, n, dk, ik]) => `<a href="${h}">${ikon(ik, 18)}<span><b>${esc(t(n))}</b><small>${esc(t(dk))}</small></span></a>`).join("")}</nav>`;
}
let terakhir;
function buka(id) {
  const d = D.o.target.find((x) => x.id === id); if (!d) return;
  terakhir = document.activeElement;
  const m = $("tgModal"); m.innerHTML = hantuHtml(3);
  if (!m.open) m.showModal();
  nanti(() => { m.innerHTML = `<div class="tg-m-in">${modal(d)}</div>`; });
}

/* ---------- RUED ---------- */
function tabelRued() {
  const kep = ["prov", "target", "real", "rasio", "status", "naskah"].map((k) => `<th scope="col"${k === "prov" || k === "naskah" ? "" : ' class="jm-num"'}>${esc(t("tg2.rued.c." + k))}</th>`).join("");
  const sel = (v) => (v == null ? `<span class="jm-kosong" title="${esc(t("tg2.rued.kosong"))}">-</span>` : esc(num(v, des(v)) + "%"));
  const baris = D.o.rued.map((r) => `<tr><td class="tg-prov"><span class="tg-pr-id"><img src="/img/provinsi/${esc(r.kode)}.png" width="28" height="28" alt="" loading="lazy" decoding="async"><span><b>${esc(r.provinsi)}</b><small>Perda ${esc(r.perda)}</small></span></span></td>
    <td data-label="${esc(t("tg2.rued.c.target"))}" class="jm-num">${sel(r.target)}</td><td data-label="${esc(t("tg2.rued.c.real"))}" class="jm-num">${sel(r.realisasi)}</td>
    <td data-label="${esc(t("tg2.rued.c.rasio"))}" class="jm-num" data-urut="${r.rasio ?? ""}">${r.rasio == null ? sel(null) : `<span class="tg-dot tg-d-${r.status}">${esc(num(r.rasio, 0))}%</span>`}</td>
    <td data-label="${esc(t("tg2.rued.c.status"))}" class="jm-num">${pilSt(r.status)}</td><td data-label="${esc(t("tg2.rued.c.naskah"))}" class="jm-num">${unduhRegHtml({ judul: "Perda RUED " + r.provinsi, url_pdf: r.pdf, url_sumber: r.url })}</td></tr>`).join("");
  return `<div class="jm-gulir"><table class="jm-tabel tg-tabel"><colgroup><col class="tg-c1"><col><col><col><col class="tg-c5"><col></colgroup><thead><tr>${kep}</tr></thead><tbody>${baris}</tbody></table></div>`;
}

/* ---------- halaman ---------- */
const seg = () => `<div class="jm-tab" role="tablist" aria-label="${esc(t("tg2.saring"))}" data-seg="kat">${["semua", ...KAT, "daerah"].map((v) => `<button type="button" role="tab" data-v="${v}" aria-selected="${v === ST.kat}">${ikon(IK_KAT[v], 18)}<span>${esc(t("tg2.kat." + v))}</span></button>`).join("")}</div>`;
function tampil() {
  const o = D.o, a = o.target, baik = a.filter((x) => BAIK.has(x.status)).length, lag = a.filter((x) => x.status === "tertinggal" || x.status === "jauh-tertinggal").length;
  $("tgJawab").textContent = t("tg2.lead");
  khSisi("#tgKh", { ubin: [
    { ikon: "bendera", nilai: num(a.length), label: t("tg2.u1") },
    { ikon: "centang", nilai: num(baik), label: t("tg2.u2") },
    { ikon: "peringatan", nilai: num(lag), label: t("tg2.u3") },
  ] });
  const cara = sumberHtml(`${esc(o.metode)}`, t("tg2.cara"));
  const lj = [["/target#transisi", "nav.transisi", "tg2.lj.transisi", "tek-panas"], ["/target#strategi", "nav.strategi", "tg2.lj.strategi", "analisis"], ["/pelacak", "nav.pelacak", "tg2.lj.pelacak", "tingkat"], ["/target#rapor", "nav.rapor", "tg2.lj.rapor", "presentasi"], ["/indeks", "nav.indeks", "tg2.lj.indeks", "grafik"]];
  $("tgIsi").innerHTML =
    exHtml({ id: "tgTarget", ikon: "bendera", topik: t("tg2.ex.topik"), judulHtml: hlHtml("tg2.ex.judul", String(a.length)), subHtml: esc(t("tg2.ex.sub")), aksiHtml: aksiHtml({ csv: false }) + cara,
      isiHtml: `${seg()}<p id="tgHit" class="jm-hitung" role="status" aria-live="polite"></p><div id="tgKisi" class="tg-kisi"></div>` }) +
    exHtml({ id: "tgRued", ikon: "wilayah", topik: t("tg2.kat.daerah"), judulHtml: hlHtml("tg2.rued.judul", String(o.rued.filter((r) => r.status !== "tidak-ada-data").length), { n: o.rued.length }), subHtml: esc(t("tg2.rued.sub")), aksiHtml: aksiHtml({ csv: true }), isiHtml: tabelRued(), kakiHtml: `<p class="jm-bantu">${esc(o.ruedMetode)}</p>` }) +
    exHtml({ id: "tgLj", ikon: "tautan", topik: t("tg2.lj.topik"), judulHtml: esc(t("tg2.lj.judul")), isiHtml: `<div class="tg-ljs">${lj.map(([h, n, dk, ik]) => `<a class="tg-lj-k" href="${h}"><span class="jm-kpi-ik">${ikon(ik, 20)}</span><b>${esc(t(n))}</b><small>${esc(t(dk))}</small></a>`).join("")}</div>` }) +
    `<dialog class="tg-modal" id="tgModal" aria-labelledby="tgMJ"></dialog>`;
  isiKisi();
  pasangUrutTabel($("tgRued"));
  aturTampil();
}
function aturTampil() {
  $("tgRued").hidden = !(ST.kat === "semua" || ST.kat === "daerah");
  $("tgKisi").hidden = $("tgHit").hidden = ST.kat === "daerah";
}
function pasang() {
  document.addEventListener("click", (e) => {
    const sg = e.target.closest("[data-seg=kat] button[data-v]");
    if (sg) {
      if (ST.kat === sg.dataset.v) return;
      for (const x of sg.parentElement.children) x.setAttribute("aria-selected", String(x === sg));
      ST.kat = sg.dataset.v; aturTampil();
      nanti(isiKisi);
      return;
    }
    const m = $("tgModal");
    if (m && e.target === m) { m.close(); return; }
    if (e.target.closest("[data-tutup]")) { m.close(); return; }
    if (e.target.closest("a,.jm-sumber")) return;
    const k = e.target.closest("[data-buka]");
    if (k) buka(k.dataset.buka);
  });
  document.addEventListener("close", (e) => { if (e.target.id === "tgModal") { e.target.innerHTML = ""; sembunyiTip(); terakhir?.focus?.(); } }, true);
}
async function mulai() {
  $("tgIsi").innerHTML = hantuHtml(4);
  try { D.o = await muatData("target_realisasi.json"); } catch (e) { tampilGalat($("tgIsi"), mulai); return; }
  tampil();
  pasang();
  saatBahasa(() => { const buka2 = $("tgModal")?.open; if (buka2) $("tgModal").close(); tampil(); });
}
mulai();
