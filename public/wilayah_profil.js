/* Profil provinsi (/wilayah?prov=XX): kepala ringan (lambang, nama, satu kalimat, strip angka) lalu seksi exhibit .jm-ex.
   Data: /data/wilayah.json (baris provinsi) + /data/wilayah/<kode>.json (berita, kalender, emisi, pakar). Nilai kosong = "-" berpetunjuk; seksi kosong disembunyikan. */
import { esc, ikon, api } from "/inti/umum.js";
import { t, tanggal, ada } from "/i18n.js";
import { exHtml, unduhRegHtml, terkaitHtml, sumberHtml as infoIkon } from "/inti/komponen.js";
import { tautOrg } from "/inti/tautan.js";
import { tombolIkuti, pasangIkuti } from "/inti/ikuti.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { grafikRapat, labelTek } from "/wilayah_profil_grafik.js";
import { pilTek, pilTekTaut, pilStatus } from "/inti/ikon_tek.js";
import { geoProvinsi, jalurPerProvinsi } from "/inti/peta_indonesia.js";
import { sumberLipat, amanUrl, muatData, num, pil, pasangBar } from "/analisis.js";
import { namaProyek } from "/inti/nama_proyek.js";
import { kartu } from "/wilayah_profil_kartu.js";

const ST0 = "tidak" + "-diketahui"; // slug data status, bukan teks layar
const TEK = ["hidro", "panas-bumi", "surya", "bayu", "bioenergi"];
const FOSIL = ["pltu", "pltg", "pltd"];
const EBT = ["plta", "pltb", "plt_bio", "pltp", "plts", "pltgb"];
let TGL = "", PEL = null, PELTGL = "", DATA = null;
const kos = (alasan) => `<span class="jm-wp-kos" title="${esc(alasan || t("wp.kos"))}" aria-label="${esc(alasan || t("wp.kos"))}">-</span>`;
const nilaiAtau = (v, f) => (v == null ? kos() : f(v));
const median = (a) => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null; };
/* nama dengan token berulang persis ("Irianto Irianto") ditampilkan sekali */
const namaRapi = (n) => { const a = String(n).trim().split(/\s+/); return a.length === 2 && a[0].toLowerCase() === a[1].toLowerCase() ? a[0] : String(n); };
const tautan = (u, teks) => (amanUrl(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(teks)}</a>` : esc(teks));
const REG = new Map();
const tautanReg = (x, teks) => (REG.has(x.id) ? `<a href="/regulasi?id=${encodeURIComponent(x.id)}">${esc(teks)}</a>` : tautan(x.url, teks));
const lambang = (p, u = 64) => `<img class="jm-wl-lb" src="/img/provinsi/${esc(p.kode)}.png" width="${u}" height="${u}" alt="" decoding="async">`;
const juta = (v) => (v >= 1e6 ? t("wp.juta", { n: num(v / 1e6, 1) }) : num(v));

/* ---------- peringkat ---------- */
const UKUR = {
  ebt: { f: (p) => p.terpasang_mw?.nilai, d: 1, sat: "MW" },
  rasio: { f: (p) => p.rasio_elektrifikasi?.nilai, d: 2, sat: "%" },
  kap: { f: (p) => p.listrik?.kapasitas_jenis_mw?.total, d: 0, sat: "MW" },
  pb: { f: (p) => p.potensi_panas_bumi?.nilai, d: 0, sat: "MW" },
  proyek: { f: (p) => p.jumlah_proyek, d: 0, sat: "" },
  penduduk: { f: (p) => p.identitas?.penduduk, d: 0, sat: "", juta: true },
  pdrbk: { f: (p) => p.identitas?.pdrb_per_kapita_juta, d: 1, sat: "", satKey: "wp.jt_rp" },
  desa: { f: (p) => p.listrik?.desa_berlistrik?.persen, d: 2, sat: "%" },
};
function peringkat(data, p, k) {
  const U = UKUR[k], semua = data.baris.map((b) => ({ b, v: U.f(b) })).filter((x) => x.v != null && Number.isFinite(x.v));
  semua.sort((a, b) => b.v - a.v || a.b.nama.localeCompare(b.b.nama));
  const i = semua.findIndex((x) => x.b.kode === p.kode);
  return { v: U.f(p) ?? null, r: i < 0 ? null : i + 1, n: semua.length, med: median(semua.map((x) => x.v)), top: semua[0] || null, lo: semua.length ? semua[semua.length - 1].v : null, hi: semua.length ? semua[0].v : null };
}
const satuan = (k) => (UKUR[k].satKey ? t(UKUR[k].satKey) : UKUR[k].sat);
const fmt = (k, v) => (v == null ? null : UKUR[k].juta ? juta(v) : num(v, UKUR[k].d)) ;

/* ---------- kepala: pita (breadcrumb, lambang, nama, chip fakta, peta mini) + strip angka ---------- */
const chip = (ik, teks) => (teks ? `<li class="jm-wp-chip">${ikon(ik, 16)}<span>${esc(teks)}</span></li>` : "");
const sel = (ik, nilai, sat, label, href, est, pilTeks) => (nilai == null ? "" : `<a class="jm-wp-sel" href="${href}"><span class="jm-wp-ub-ik">${ikon(ik, 20)}</span><span class="jm-wp-sel-t"><span class="jm-wp-ub-n"><b>${esc(nilai)}</b>${sat ? `<span>${esc(sat)}</span>` : ""}${pilTeks ? `<em class="jm-pil jm-wp-pilb">${esc(pilTeks)}</em>` : ""}</span><span class="jm-wp-ub-l">${esc(label)}${est ? " " + pil("an.est") : ""}</span></span></a>`);
const strip = (cells) => `<div class="jm-wp-strip">${cells.join("")}</div>`;
function kepala(data, p) {
  const id = p.identitas || {}, rk = peringkat(data, p, "ebt");
  const chips = [chip("direktori", id.ibu_kota && t("wp.l.ibu", { ibu: id.ibu_kota })), chip("wilayah", id.kabupaten != null && t("wp.l.kab", { kab: num(id.kabupaten), kota: num(id.kota ?? 0) })), chip("peta", id.luas_km2 != null && t("wp.l.luas2", { luas: num(id.luas_km2, 0) })), chip("orang", id.penduduk != null && t("wp.l.pend", { n: juta(id.penduduk) })), chip("analisis", id.pdrb && t("wp.l.pdrb", { n: num(id.pdrb.triliun, 0) }))].join("");
  const pb = p.potensi_panas_bumi, rs = p.rasio_elektrifikasi;
  const band = `<section class="jm-ex jm-wp-band" id="band">
    <div class="jm-wp-crumb"><a class="jm-wp-pilbtn" href="/wilayah">${ikon("panah-kiri", 16)}<span>${esc(t("wl.semua"))}</span></a><span class="jm-wp-jejak"><a href="/wilayah">${esc(t("wp.band.wilayah"))}</a> <span aria-hidden="true">›</span> <span>${esc(p.nama)}</span></span><div class="jm-ex-aksi">${aksiHtml()}</div></div>
    <div class="jm-wp-isi">
      <div class="jm-wp-kiri"><span class="jm-wp-lb">${lambang(p, 88)}</span><div class="jm-wp-nama"><h1 class="jm-ex-j jm-wp-h1">${esc(p.nama)}</h1><ul class="jm-wp-chips">${chips}</ul></div></div>
      <figure class="jm-wp-mini"><svg id="wp-mini" viewBox="0 0 320 130" role="img" aria-label="${esc(t("wp.band.mini", { nama: p.nama }))}" focusable="false"></svg>${rk.r ? `<figcaption><b>${esc(t("wp.band.rank", { r: rk.r, n: rk.n }))}</b> <span>${esc(t("wp.band.rank_ket"))}</span></figcaption>` : ""}</figure>
    </div></section>`;
  return band + strip([
    sel("analisis", rk.r ? rk.r : null, rk.r ? t("wp.u.dari", { n: rk.n }) : "", t("wp.u.rank_l"), "#kelistrikan", true),
    sel("analisis", p.terpasang_mw ? num(p.terpasang_mw.nilai, 1) : null, "MW", t("wp.u.mw_l"), "#potensi"),
    sel("peta", pb ? num(pb.nilai, 0) : null, "MW", t("wp.u.pot_l"), "#potensi"),
    sel("proyek", p.jumlah_proyek ? num(p.jumlah_proyek) : null, "", t("wp.u.proyek_l"), "#proyek"),
    sel("status", rs ? num(rs.nilai, 2) : null, "%", t("wp.u.rasio_l"), "#kelistrikan"),
  ]);
}
async function petaMini(p) {
  const el = document.getElementById("wp-mini"); if (!el) return;
  const g = await geoProvinsi(); if (!g) return;
  const js = jalurPerProvinsi(g, 320, 130, undefined, 0.5), on = js.find((x) => x.kode === p.kode);
  el.innerHTML = js.filter((x) => x.kode !== p.kode).map((x) => `<path class="jm-wp-mp" d="${x.d}"/>`).join("") + (on ? `<path class="jm-wp-mp jm-wp-mp-on" d="${on.d}"/>` : "");
}

/* ---------- pembantu seksi ---------- */
const sumberDari = (...a) => sumberLipat(a.filter(Boolean).map((s) => ({ sumber: s.sumber, halaman: s.halaman, tahun: s.tahun, url: s.url || s.sumber_url, tanggal: s.tanggal || s.tanggal_periksa || TGL })));
/* catatan kaki (paragraf) tidak tampil: semuanya dilipat ke SATU ikon info di kepala (pemilik 8 Nov 2026) */
const seksi = (o) => {
  const { kakiHtml, ...sisa } = o, cat = [...String(kakiHtml || "").matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => `<span class="jm-an-catat">${m[1]}</span>`).join("");
  if (cat) {
    const a = sisa.aksiHtml || "", i = a.lastIndexOf("</span></span></span></div>");
    sisa.aksiHtml = i >= 0 ? a.slice(0, i) + cat + a.slice(i) : a + `<div class="jm-an-src">${infoIkon(`<span class="jm-an-srcl">${cat}</span>`, t("wp.info"))}</div>`;
  }
  return exHtml({ tingkat: "h2", ...sisa });
};
const dl = (baris) => `<dl class="jm-wp-dl">${baris.filter((r) => !String(r[1]).includes("jm-wp-kos")).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("")}</dl>`;

/* ---------- 1. ringkasan ---------- */
function ringkasan(p) {
  const id = p.identitas; if (!id) return "";
  const adaApa = [id.penduduk, id.luas_km2, id.pdrb, id.ibu_kota].some((x) => x != null);
  if (!adaApa) return "";
  const j = id.penduduk != null ? hlHtml("wp.j.ringkasan", juta(id.penduduk), { nama: p.nama }) : hlHtml("wp.j.ringkasan0", p.nama, {});
  const isi = dl([
    [t("wp.k.ibu"), nilaiAtau(id.ibu_kota, esc)],
    [t("wp.k.luas"), nilaiAtau(id.luas_km2, (v) => `${esc(num(v, 0))} km²`)],
    [t("wp.k.kab"), id.kabupaten != null ? esc(t("wp.k.kab_isi", { kab: num(id.kabupaten), kota: num(id.kota ?? 0) })) : kos()],
    [t("wp.k.pend"), nilaiAtau(id.penduduk, (v) => `${esc(num(v))}${id.penduduk_tahun ? ` <small>(${id.penduduk_tahun})</small>` : ""}`)],
    [t("wp.k.kepad"), id.penduduk != null && id.luas_km2 ? `${esc(num(id.penduduk / id.luas_km2, 0))} ${esc(t("wp.jiwa_km"))} <small>(${esc(t("an.est"))})</small>` : kos()],
    [t("wp.k.pdrb"), nilaiAtau(id.pdrb, (v) => `${esc(num(v.triliun, 0))} ${esc(t("wp.triliun"))} <small>(${v.tahun})</small>`)],
    [t("wp.k.pdrbk"), nilaiAtau(id.pdrb_per_kapita_juta, (v) => `${esc(num(v, 1))} ${esc(t("wp.jt_rp"))} <small>(${esc(t("an.est"))})</small>`)],
  ]);
  const kaki = `<p class="jm-bantu">${esc(t("wp.cat.identitas"))}</p>`;
  return seksi({ id: "ringkasan", ikon: "wilayah", topik: t("wp.ey.ringkasan"), judulHtml: j, aksiHtml: aksiHtml() + sumberDari(id.sumber, id.pdrb), isiHtml: isi, kakiHtml: kaki });
}

/* ---------- 2. kelistrikan: SATU sumber utama (Statistik Ketenagalistrikan); HEESI jadi pembanding di ikon info ---------- */
const JENIS_K = { plta: ["hidro", "hidro"], plt_bio: ["bioenergi", "bioenergi"], pltgb: ["bioenergi", "bioenergi"], pltp: ["panas-bumi", "panas-bumi"], plts: ["surya", "surya"], pltb: ["bayu", "bayu"], pltu: ["fosil", "industri"], pltg: ["fosil", "industri"], pltd: ["fosil", "industri"], plt_lain: ["lain", "jaringan"] };
function kelistrikan(p) {
  const L = p.listrik || {}, kj = L.kapasitas_jenis_mw, desa = L.desa_berlistrik, rs = p.rasio_elektrifikasi, pltp = L.pltp;
  if (!kj && !desa && !rs) return "";
  const fosil = kj ? FOSIL.reduce((s, k) => s + (kj[k] || 0), 0) : null, ebt = kj ? EBT.reduce((s, k) => s + (kj[k] || 0), 0) : null;
  const porsi = kj && kj.total ? (ebt / kj.total) * 100 : null, pp = porsi != null ? num(porsi, 1) : null;
  const j = kj ? hlHtml("wp.j.listrik", num(kj.total, 0) + " MW", { nama: p.nama, persen: pp }) : hlHtml("wp.j.listrik0", num(rs.nilai, 2) + "%", { nama: p.nama });
  const st = strip([
    sel("status", rs ? num(rs.nilai, 2) : null, "%", t("wp.k.rasio"), "#kelistrikan"),
    sel("orang", rs?.rumah_tangga_berlistrik != null ? num(rs.rumah_tangga_berlistrik) : null, "", t("wp.k.rt"), "#kelistrikan"),
    sel("wilayah", desa ? num(desa.jumlah) : null, t("wp.u.desa_sat"), t("wp.k.desa"), "#kelistrikan", false, desa ? t("wp.u.desa_pil", { p: num(desa.persen, 0) }) : null),
    sel("tek-listrik", kj ? num(kj.total, 0) : null, "MW", t("wp.k.kapt"), "#kelistrikan"),
    sel("tek-bio", pp, "%", t("wp.k.porsi"), "#kelistrikan"),
  ]);
  const jenis = kj ? Object.keys(JENIS_K).filter((k) => kj[k] > 0).sort((a, b) => kj[b] - kj[a]) : [];
  const C = 2 * Math.PI * 50, arc = porsi != null ? (porsi / 100) * C : 0;
  const donut = kj ? `<div class="jm-wp-box jm-wp-donut"><svg viewBox="0 0 140 140" role="img" aria-label="${esc(t("wp.donut", { persen: pp }))}" focusable="false"><circle class="jm-wp-dn-f" cx="70" cy="70" r="50"/><circle class="jm-wp-dn-e" cx="70" cy="70" r="50" stroke-dasharray="${arc.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 70 70)"/><text x="70" y="68" text-anchor="middle" class="jm-wp-dn-n">${esc(pp ?? "-")}%</text><text x="70" y="86" text-anchor="middle" class="jm-wp-dn-s">${esc(t("wp.donut_ebt"))}</text></svg>
    <ul class="jm-wp-leg"><li><i class="jm-wp-sw-e"></i><span>${esc(t("wp.k.ebt"))}</span><b>${esc(num(ebt, 0))} MW</b></li><li><i class="jm-wp-sw-f"></i><span>${esc(t("wp.k.fosil"))}</span><b>${esc(num(fosil, 0))} MW</b></li></ul></div>` : "";
  const grafik = jenis.length ? `<div class="jm-wp-box jm-wp-gbox">${grafikRapat(jenis.map((k) => ({ k: JENIS_K[k][0], ik: JENIS_K[k][1], label: t("wp.jenis." + k), a: kj[k] })), { satuan: "MW", label: t("wp.listrik.grafik") })}</div>` : "";
  const pl = pltp ? `<h3 class="jm-wp-h3">${esc(t("wp.pltp"))}</h3><ul class="jm-wp-pltp">${pltp.daftar.map((x) => `<li class="jm-wp-pk"><b>${esc(x.nama)}</b>${x.org ? `<a class="jm-wp-op" href="/o/${encodeURIComponent(x.org.id)}">${x.org.logo && /^\/img\//.test(x.org.logo) ? `<img src="${esc(x.org.logo)}" width="24" height="24" alt="" loading="lazy" decoding="async">` : ""}<span>${esc(x.org.nama)}</span></a>` : `<span class="jm-wp-op">${tautOrg(x.pemilik)}</span>`}${pilStatus("beroperasi")}</li>`).join("")}</ul>` : "";
  const kaki = kj ? `<p>${esc(t("wp.cat.dua_sumber", { a: kj.tahun, b: p.terpasang_mw?.tahun ?? "-", mw: p.terpasang_mw ? num(p.terpasang_mw.nilai, 1) : "-" }))}</p>` : "";
  return seksi({ id: "kelistrikan", ikon: "analisis", topik: t("wp.ey.listrik"), judulHtml: j, aksiHtml: aksiHtml() + sumberDari(kj, desa, rs, pltp), isiHtml: `${st}${donut || grafik ? `<div class="jm-wp-dua">${donut}${grafik}</div>` : ""}${pl}`, kakiHtml: kaki });
}

/* ---------- 3. potensi dan terpasang: satu tabel berikon + satu grafik kelompok (RUEN 2015 + HEESI 2025) ---------- */
const POT = [
  { k: "surya", pel: ["surya"], tp: "surya" }, { k: "bayu", pel: ["bayu"], tp: "bayu" }, { k: "hidro", pel: ["hidro", "mikrohidro"], tp: "hidro" },
  { k: "panas-bumi", pel: ["panas_bumi"], tp: "panas-bumi" }, { k: "bioenergi", pel: ["bioenergi"], tp: "bioenergi" }, { k: "laut", pel: ["laut"], tp: null },
];
const namaTek = (k) => (ada("an.tek." + k) ? t("an.tek." + k) : ada("wl.tek." + k.replace("-", "_")) ? t("wl.tek." + k.replace("-", "_")) : k);
/** alasan sel potensi kosong: kelompok RUEN, induk pra-pemekaran, atau memang tidak tercantum */
function alasanPot(cells) {
  const x = cells.find((c) => c.mw == null && c.kelompok_mw != null);
  if (x) return t("wl.cat.kel", { tek: "", mw: num(x.kelompok_mw, 0), grup: (x.kelompok || []).join(", ") || "-" }).replace(/^:\s*/, "");
  const y = cells.find((c) => c.mw == null && c.induk_mw != null);
  if (y) return t("wp.kos.induk", { induk: DATA?.baris.find((b) => b.kode === y.induk_kode)?.nama || "", mw: num(y.induk_mw, 0) });
  return t("wp.kos.potensi");
}
function potensi(p) {
  const pt = p.per_teknologi_mw || {}, pb = p.potensi_panas_bumi, atlas = p.surya_atlas, B = PEL?.get(p.kode);
  if (!p.terpasang_mw && !pb && !B) return "";
  const baris = POT.map((r) => {
    const cells = r.pel.map((x) => B?.potensi[x]).filter(Boolean), isi = cells.filter((c) => c.mw != null);
    let pot = isi.length ? isi.reduce((s, c) => s + c.mw, 0) : null;
    if (r.k === "panas-bumi" && pot == null && pb) pot = pb.nilai;
    const mw = r.tp ? pt[r.tp] ?? null : null, pra = cells.some((c) => c.pra_pemekaran), parsial = r.k === "hidro" && pot != null && cells.some((c) => c.mw == null);
    return { ...r, mw, pot, sisa: pot != null && mw != null && !parsial ? Math.max(0, pot - mw) : null, real: pot && mw != null && !parsial ? (mw / pot) * 100 : null, alasan: pot == null ? alasanPot(cells) : parsial ? alasanPot(cells) + ". " + t("wp.pot.parsial") : null, pra, parsial };
  });
  const totPot = baris.reduce((s, r) => s + (r.pot ?? 0), 0), adaPot = baris.some((r) => r.pot != null);
  const terpDiPot = baris.reduce((s, r) => s + (r.pot != null ? r.mw ?? 0 : 0), 0);
  const j = adaPot && totPot > 0 ? hlHtml("wp.j.pot2", num(totPot, 0) + " MW", { nama: p.nama, persen: num((terpDiPot / totPot) * 100, 1) + "%" })
    : pb && !(pt["panas-bumi"] > 0) ? hlHtml("wp.j.potensi_nol", num(pb.nilai, 0) + " MW", { nama: p.nama }) : hlHtml("wp.j.potensi0", num(p.terpasang_mw.nilai, 1) + " MW", { nama: p.nama });
  const grafik = grafikRapat(baris.map((r) => ({ k: r.k, label: namaTek(r.k), a: r.mw, b: r.pot })), { satuan: "MW", label: t("wp.pot.grafik"), dua: [t("wp.col.terpasang"), t("wp.col.potensi")] });
  const pilR = (v) => (v == null ? kos(t("wp.kos.real")) : `<span class="jm-pil ${v >= 50 ? "jm-pil-ok" : v >= 10 ? "jm-pil-warn" : ""}">${esc(num(v, 1))}%</span>`);
  const mwTd = (v, alasan) => (v == null ? kos(alasan) : `<span class="jm-wp-v">${esc(num(v, v < 10 ? 1 : 0))} MW</span>`);
  const L = (k) => esc(t(k));
  const tabel = `<div class="jm-gulir"><table class="jm-tabel jm-wp-tp"><colgroup><col class="jm-wp-tp-c1"><col><col><col><col></colgroup><thead><tr><th>${L("wl.col.tek")}</th><th class="jm-num">${L("wp.col.terpasang")}</th><th class="jm-num">${L("wp.col.potensi")}</th><th class="jm-num">${L("wp.col.sisa")}</th><th class="jm-num">${L("wp.col.real")}</th></tr></thead><tbody>${baris.map((r) =>
    `<tr><td data-label="${L("wl.col.tek")}">${r.tp ? pilTekTaut(r.tp) : labelTek(r.k, namaTek(r.k))}</td><td data-label="${L("wp.col.terpasang")}" class="jm-num">${mwTd(r.mw, r.tp ? t("wp.kos.terpasang") : t("wp.kos.laut"))}</td><td data-label="${L("wp.col.potensi")}" class="jm-num">${r.pot != null ? `<span class="jm-wp-v"${r.parsial ? ` title="${esc(r.alasan)}"` : ""}>${esc(num(r.pot, 0))} MW${r.parsial ? "*" : ""}</span>` : kos(r.alasan)}</td><td data-label="${L("wp.col.sisa")}" class="jm-num">${mwTd(r.sisa, r.alasan || t("wp.kos.sisa"))}</td><td data-label="${L("wp.col.real")}" class="jm-num">${pilR(r.real)}</td></tr>`).join("")}</tbody></table></div>`;
  const induk = Object.values(B?.potensi || {}).find((c) => c.induk_kode);
  const pita = baris.some((r) => r.pra) ? t("wl.pita.pra") : induk ? t("wp.pita.ind", { induk: DATA?.baris.find((b) => b.kode === induk.induk_kode)?.nama || "" }) : "";
  const sur = atlas?.pvout_kwh_per_kwp_tahun ? `<p>${esc(t("wp.surya_atlas", { pv: num(atlas.pvout_kwh_per_kwp_tahun), ghi: num(atlas.ghi_kwh_per_m2_tahun ?? 0) }))}</p>` : "";
  return seksi({ id: "potensi", ikon: "peta", topik: t("wp.ey.potensi"), judulHtml: j, aksiHtml: aksiHtml({ csv: true }) + sumberDari(p.terpasang_mw, B && { sumber: t("wl.src.gabung"), tanggal: PELTGL }, atlas && { sumber: atlas.sumber, url: atlas.url, tanggal: atlas.tanggal }), isiHtml: `${pita ? `<p class="jm-wl-pita jm-wp-pita">${esc(pita)}</p>` : ""}<div class="jm-wp-pt">${tabel}${grafik}</div>`, kakiHtml: sur + `<p>${esc(t("wp.cat.potensi"))} <a href="/metode#peta-wilayah">${esc(t("wl.cara_link"))}</a></p>` });
}

/* ---------- 4. RUED: kartu Perda + target + capaian dalam satu seksi ---------- */
function rued(p, C) {
  const r = p.rued, kj = p.listrik?.kapasitas_jenis_mw, c = C?.baris.find((x) => x.kode === p.kode);
  if (!r?.perda) return "";
  const porsi = c?.realisasi_persen ?? (kj && kj.total ? (EBT.reduce((s, k) => s + (kj[k] || 0), 0) / kj.total) * 100 : null);
  const [no, th] = r.perda.split("/"), x = p.perda.find((q) => q.nomor === no && String(q.tahun) === th), reg = x && REG.get(x.id);
  const kand = (r.kandidat || []), k2025 = r.target_ebt_persen ?? c?.target_2025_persen ?? kand.find((k) => k.tahun === 2025)?.persen ?? null;
  const akhir = c?.target_akhir ?? kand.filter((k) => k.tahun > 2025).sort((a, b) => b.tahun - a.tahun).map((k) => ({ persen: k.persen, tahun: k.tahun }))[0] ?? null;
  const tinjau = r.target_ebt_persen == null;
  const ST = { tercapai: "jm-pil-ok", "di-jalur": "jm-pil-warn", tertinggal: "jm-pil-bad" };
  const sub = c?.status ? `<span class="jm-pil ${ST[c.status]}">${esc(t("wp.cap.st." + c.status))}</span> <span class="jm-pil jm-pil-warn" title="${esc(t("wp.cap.hip_tip"))}">${esc(t("wp.cap.hip"))}</span>` : "";
  const j = c?.status ? esc(t("wp.cap.j", { nama: p.nama, status: t("wp.cap.st." + c.status).toLocaleLowerCase(), r: num(c.rasio_persen, 0) })) : r.target_ebt_persen != null ? hlHtml("wp.j.rued_t", num(r.target_ebt_persen, 0) + "%", { nama: p.nama, perda: r.perda }) : hlHtml("wp.j.rued", "Perda " + r.perda, { nama: p.nama });
  const dok = unduhRegHtml({ judul: r.perda, url_sumber: r.url, url_pdf: c?.url_pdf, ...(reg || {}) });
  const perda = `<div class="jm-wp-pd">${lambang(p, 56)}<div class="jm-wp-pd-t"><b>${esc(t("wl.rued_ada", { perda: r.perda }))}</b><span>${esc(x?.judul || t("wp.ey.rued"))}${th ? `, ${esc(th)}` : ""}</span></div><span class="jm-wp-pd-a">${dok}</span></div>`;
  const ubin = (v, sub2) => `<div class="jm-wp-tg"><b>${v == null ? kos(t("wp.kos.target")) : esc(num(v, 0)) + "%"}</b><span>${esc(sub2)}</span>${v != null && tinjau ? `<em class="jm-pil jm-pil-warn">${esc(t("wp.rued.belum_tinjau"))}</em>` : ""}</div>`;
  const target = `<div class="jm-wp-tgs">${ubin(k2025, t("wp.rued.tahun", { th: 2025 }))}${ubin(akhir?.persen ?? null, t("wp.rued.tahun", { th: akhir?.tahun ?? 2050 }))}</div>`;
  const rows = [{ k: "tgt", label: t("wp.rued.tahun", { th: 2025 }), a: k2025 }, { k: "tgt2", label: t("wp.rued.tahun", { th: akhir?.tahun ?? 2050 }), a: akhir?.persen ?? null }, { k: "real", label: t("wp.cap.real_p", { tahun: c?.realisasi_tahun ?? kj?.tahun ?? "" }), a: porsi }]
    .map((q) => ({ ...q, labelHtml: `<span class="jm-wp-tl jm-gb-${q.k}">${esc(q.label)}</span>`, aTeks: q.a == null ? null : num(q.a, 1) + "%" }));
  const gr = grafikRapat(rows, { satuan: "%", label: t("wp.cap.grafik"), maks: 100 });
  const kaki = [kand.length ? `<p>${esc(t("wl.rued_kand_judul"))} ${kand.map((k) => esc(t("wl.rued_kand", { tahun: k.tahun, persen: num(k.persen, 0) }))).join("; ")}</p>` : "", `<p>${esc(t("wp.cat.rued"))}</p>`, c ? `<p>${esc(C.metode)}</p>` : "", c?.realisasi_sumber_url ? `<p><a href="${esc(c.realisasi_sumber_url)}" target="_blank" rel="noopener noreferrer">${esc(t("wp.cap.stat"))}</a></p>` : ""].join("");
  return seksi({ id: "rued", ikon: "regulasi", topik: t("wp.ey.rued"), judulHtml: j + (sub ? " " + sub : ""), aksiHtml: aksiHtml() + sumberDari({ sumber: t("wl.sumber_rued"), url: r.url, tanggal: r.tanggal }, kj, c && { sumber: t("wl.sumber_capaian"), tanggal: C.dibangun_pada }), isiHtml: `<div class="jm-wp-rd">${perda}${target}</div>${gr}`, kakiHtml: kaki });
}

/* ---------- 6. daftar proyek ---------- */
const dedupe = (n) => String(n).replace(/\b(\S+)(\s+\1)+(?=\s|$)/gi, "$1");
const namaBersih = (x) => dedupe(namaProyek(x));
function proyek(p) {
  if (!p.proyek.length) return "";
  const A = [...p.proyek].sort((a, b) => (b.mw ?? -1) - (a.mw ?? -1) || namaBersih(a).localeCompare(namaBersih(b)));
  const mw = A.reduce((s, x) => s + (x.mw || 0), 0);
  const hit = (f) => { const m = new Map(); for (const x of A) m.set(f(x), (m.get(f(x)) || 0) + 1); return [...m].sort((a, b) => b[1] - a[1]); };
  const rinci = `<div class="jm-wp-pil">${hit((x) => x.teknologi).map(([k, n]) => `<span class="jm-wp-pilgrup">${pilTek(k)} <b>${n}</b></span>`).join("")}${hit((x) => x.status || ST0).map(([k, n]) => `<span class="jm-wp-pilgrup">${pilStatus(k)} <b>${n}</b></span>`).join("")}</div>`;
  const progPil = (a) => (a || []).map((g) => `<span class="jm-pil jm-wp-prog">${esc(ada("pj.pn." + g) ? t("pj.pn." + g) : g)}</span>`).join(" ");
  const pengTd = (x) => (x.peng ? (x.peng.id && !x.peng.generik ? `<a href="/o/${encodeURIComponent(x.peng.id)}">${esc(x.peng.nama)}</a>` : x.peng.generik ? `<span class="jm-wp-redup">${esc(x.peng.nama)}</span>` : esc(x.peng.nama)) : kos());
  const L = (k) => esc(t(k));
  const tb = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${L("wl.col.proyek")}</th><th>${L("wl.col.tek")}</th><th>${L("wp.col.program")}</th><th>${L("wp.col.peng")}</th><th class="jm-num">${L("wl.col.kap")}</th><th>${L("wl.col.status")}</th></tr></thead><tbody>${A.map((x) =>
    `<tr><td data-label="${L("wl.col.proyek")}"><a href="/p/${encodeURIComponent(x.id)}">${esc(namaBersih(x))}</a></td><td data-label="${L("wl.col.tek")}">${pilTekTaut(x.teknologi)}</td><td data-label="${L("wp.col.program")}">${x.program?.length ? progPil(x.program) : kos()}</td><td data-label="${L("wp.col.peng")}">${pengTd(x)}</td><td data-label="${L("wl.col.kap")}" class="jm-num">${x.mw == null ? kos() : esc(num(x.mw, 1) + " " + (x.satuan || "MW"))}</td><td data-label="${L("wl.col.status")}">${pilStatus(x.status || ST0)}</td></tr>`).join("")}</tbody></table></div>`;
  return seksi({ id: "proyek", ikon: "proyek", topik: t("wp.ey.proyek"), judulHtml: hlHtml("wp.j.proyek", num(A.length), { nama: p.nama, mw: num(mw, 0) }), aksiHtml: aksiHtml({ csv: true }) + sumberDari({ sumber: t("wl.sumber_proyek"), tanggal: "" }), isiHtml: rinci + tb, kakiHtml: `<p class="jm-bantu">${esc(t("wp.cat.proyek"))}</p>` });
}

/* ---------- 8. pakar ---------- */
function pakar(p, d) {
  const x = d?.pakar; if (!x?.daftar?.length) return "";
  const tb = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${esc(t("wp.col.nama"))}</th><th>${esc(t("wp.col.inst"))}</th><th>${esc(t("wp.col.topik"))}</th><th class="jm-num">${esc(t("wp.col.h"))}</th></tr></thead><tbody>${x.daftar.map((o) =>
    `<tr><td data-label="${esc(t("wp.col.nama"))}">${tautan(o.url, namaRapi(o.nama))}</td><td data-label="${esc(t("wp.col.inst"))}">${nilaiAtau(o.institusi, esc)}</td><td data-label="${esc(t("wp.col.topik"))}">${o.topik.length ? esc(o.topik.map((k) => (t("wp.topik." + k) === "wp.topik." + k ? k : t("wp.topik." + k))).join(", ")) : kos()}</td><td data-label="${esc(t("wp.col.h"))}" class="jm-num">${nilaiAtau(o.h, (v) => esc(num(v)))}</td></tr>`).join("")}</tbody></table></div>`;
  return seksi({ id: "pakar", ikon: "orang", topik: t("wp.ey.pakar"), judulHtml: hlHtml("wp.j.pakar", num(x.jumlah), { nama: p.nama, n: num(x.daftar.length) }), aksiHtml: aksiHtml({ csv: true }) + sumberDari({ sumber: x.sumber, url: x.url, tanggal: x.tanggal }), isiHtml: tb, kakiHtml: `<p class="jm-bantu">${esc(t("wp.cat.pakar"))}</p>` });
}

/* ---------- 9. regulasi daerah: kartu standar berlogo provinsi, status pil berikon ---------- */
function regulasi(p) {
  if (!p.perda.length) return "";
  const A = [...p.perda].sort((a, b) => (b.tahun || 0) - (a.tahun || 0));
  const stil = (v) => (!v ? kos() : `<span class="jm-pil ${/berlaku/i.test(v) ? "jm-pil-ok" : /cabut|batal|tidak/i.test(v) ? "jm-pil-bad" : "jm-pil-warn"}">${ikon(/cabut|batal|tidak/i.test(v) ? "blokir" : "status", 14)}<span>${esc(v)}</span></span>`);
  const kartuR = A.map((x) => `<li class="jm-wp-rg">${lambang(p, 44)}<div class="jm-wp-rg-t"><b>${tautanReg(x, t("wl.perda_item", { nomor: x.nomor, tahun: x.tahun }))}</b><span>${esc(x.judul)}</span><span class="jm-wp-rg-m">${stil(x.status)}<small>${esc(x.tahun ?? "")}</small></span></div><span class="jm-wp-rg-a">${unduhRegHtml({ judul: x.judul, url_sumber: x.url, ...REG.get(x.id) })}</span></li>`).join("");
  return seksi({ id: "regulasi", ikon: "regulasi", topik: t("wp.ey.reg"), judulHtml: hlHtml("wp.j.reg", num(A.length), { nama: p.nama }), aksiHtml: aksiHtml({ csv: true }) + sumberDari({ sumber: t("wl.sumber_perda"), tanggal: "" }), isiHtml: `<ul class="jm-wp-regs">${kartuR}</ul>` });
}

/* ---------- 11. berita dan agenda ---------- */
function berita(p, d) {
  const b = d?.berita || [], k = d?.kalender || [];
  if (!b.length && !k.length) return "";
  const lb = b.length ? `<ul class="jm-wp-daftar">${b.map((x) => `<li>${tautan(x.url, x.judul)} <small>${esc(x.media)}, ${esc(tanggal(x.terbit))}</small></li>`).join("")}</ul>` : "";
  const lk = k.length ? `<h3 class="jm-wp-h3">${esc(t("wp.agenda"))}</h3><ul class="jm-wp-daftar">${k.map((x) => `<li>${tautan(x.url, x.judul)} <small>${esc(tanggal(x.tanggal))}</small></li>`).join("")}</ul>` : "";
  return seksi({ id: "berita", ikon: "berita", topik: t("wp.ey.berita"), judulHtml: hlHtml("wp.j.berita", num(b.length + k.length), { nama: p.nama }), aksiHtml: aksiHtml(), isiHtml: lb + lk, kakiHtml: `<p class="jm-bantu">${esc(t("wp.cat.berita"))}</p>` });
}

/* ---------- kartu METI Wilayah (hanya bila provinsi punya status selain "belum") ---------- */
const ST_MW = { berdiri: "jm-pil jm-pil-ok", segera: "jm-pil", rencana: "jm-pil jm-pil-warn" };
async function isiMetiWilayah(p) {
  const el = document.getElementById("wp-meti");
  if (!el) return;
  try {
    const w = (await api("/api/meti-wilayah/" + encodeURIComponent(p.kode))).wilayah;
    if (!w || !ST_MW[w.status]) { el.remove(); return; }
    const isi = dl([[t("mw.status"), `<span class="${ST_MW[w.status]}">${esc(t("mw.st." + w.status))}</span>`], [t("mw.ketua"), w.ketua ? esc(w.ketua) : '<span class="jm-wp-kos">-</span>'], [t("mw.sekretariat"), w.sekretariat ? esc(w.sekretariat) : '<span class="jm-wp-kos">-</span>']])
      + `<p><a class="jm-tbl" href="/meti-wilayah/${esc(p.kode)}">${esc(t("mw.buka_profil"))}</a></p>`;
    el.outerHTML = seksi({ id: "meti-wilayah", ikon: "wilayah", topik: t("mw.ey.kartu"), judulHtml: esc(t("mw.nama", { prov: p.nama })), isiHtml: isi });
  } catch (e) { el.remove(); }
}

/* ---------- pasang ---------- */
export async function profilProvinsi(p, data, $) {
  const K = kartu({ seksi, sumberDari, namaBersih, peringkat, UKUR, fmt, satuan, kos, juta, hlHtml, aksiHtml });
  document.title = t("wl.profil_title", { nama: p.nama }); TGL = data.dibangun_pada; DATA = data;
  try { const pl = await muatData("peluang.json"); PELTGL = pl.meta.diperbarui; PEL = new Map(pl.baris.map((b) => [b.kode, b])); } catch (e) { /* tanpa RUEN: tabel potensi memakai panas bumi saja */ }
  try { for (const r of (await muatData("regulasi.json")).baris) REG.set(r.id, r); } catch (e) { /* tautan sumber saja */ }
  let d = null, cap = null;
  try { cap = await muatData("rued_capaian.json"); } catch (e) { /* kartu capaian disembunyikan */ }
  try { d = await muatData("wilayah/" + encodeURIComponent(p.kode) + ".json"); } catch (e) { /* bagian tambahan disembunyikan */ }
  $("profil-isi").innerHTML = kepala(data, p) + [ringkasan(p), kelistrikan(p), potensi(p), rued(p, cap), K.petaSeksi(p), proyek(p), K.organisasi(p), '<div id="wp-meti"></div>', pakar(p, d), regulasi(p), K.emisi(p, d), berita(p, d), K.banding(data, p), await terkaitHtml("provinsi", String(p.kode))].join("");
  $("cara").innerHTML = `<p>${esc(t("wl.cara_profil"))}</p>${["potensi", "sisa", "capaian", "peringkat", "emisi"].map((k) => `<p><b>${esc(t("met.pw." + k + ".j"))}.</b> ${esc(t("met.pw." + k))}</p>`).join("")}<p><a href="/metode#peta-wilayah">${esc(t("wl.cara_link"))}</a></p>`;
  $("profil-isi").querySelector(".jm-wp-chips")?.insertAdjacentHTML("afterend", `<p>${tombolIkuti({ jenis: "provinsi", id: p.kode, nama: p.nama })}</p>`);
  pasangIkuti($("profil-isi"));
  pasangBar($("profil-isi")); petaMini(p);
  isiMetiWilayah(p);
  K.pasang($("profil-isi"));
  K.bukaPeta(p);
}
