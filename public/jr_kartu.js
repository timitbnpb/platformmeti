/* /jaringan: blok kartu data tambahan (BPP, rencana EBT RUPTL, kependudukan, elektrifikasi, potensi EBT, keandalan, deret) untuk kartu sistem dan provinsi.
   Dipakai bersama oleh Kembaran (jr_peta), Bauran (jr_bauran), dan Aliran (jr_aliran). Tiap angka: status + sumber + tanggal; tren berupa sparkline SVG. */
import { t, esc, num } from "/jr_umum.js";
import { tanggal } from "/i18n.js";
import { chipSt, chipSrc } from "/jr_kj.js";

const n = (v, d) => (v == null ? "-" : num(v, d ?? (Number.isInteger(v) ? 0 : 1)));
const ids = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
const kaki = (st, src, tgl, ekstra = "") => `<p class="kj-kaki">${chipSt(st)}${ekstra}${ids(src).map(chipSrc).join("")}${tgl ? `<span class="kj-tgl">${esc(t("kj.per", { tgl: /^\d{4}$/.test(tgl) ? tgl : tanggal(tgl) }))}</span>` : ""}</p>`;
const cat = (x) => (x ? `<p class="kj-cat">${esc(x)}</p>` : "");
const ubin = (nilai, sat, label) => `<div class="kj-ang"><b>${nilai}${sat ? ` <small>${esc(sat)}</small>` : ""}</b><span>${esc(label)}</span></div>`;
const pihak3 = (x) => (x?.bukti === "via-pihak-ketiga" ? `<span class="kj-st kj-st-est">${esc(t("kj.kt.pihak3"))}</span>` : "");

/** Garis kecil dari titik {x: tahun, y}; null jika kurang dari dua titik. */
function spark(pts, nama) {
  const v = pts.filter((p) => p.y != null).sort((a, b) => a.x - b.x);
  if (v.length < 2) return "";
  const W = 120, H = 28, lo = Math.min(...v.map((p) => p.y)), r = Math.max(...v.map((p) => p.y)) - lo || 1, x0 = v[0].x, dx = v.at(-1).x - x0 || 1;
  const pt = v.map((p) => `${(((p.x - x0) / dx) * W).toFixed(1)},${(H - 2 - ((p.y - lo) / r) * (H - 4)).toFixed(1)}`).join(" ");
  return `<svg class="kj-spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("kj.kt.spark", { nama, dari: x0, ke: v.at(-1).x, a: n(v[0].y), b: n(v.at(-1).y) }))}"><polyline class="kje-gar" points="${pt}"/></svg>`;
}
const deret = (judul, pts, akhir, sat) => {
  const s = spark(pts, judul); if (!s) return "";
  return `<div class="kj-der"><span>${esc(judul)}</span>${s}<b>${n(akhir)} <small>${esc(sat)}</small></b></div>`;
};

/** Rencana pembangkit EBT RUPTL: total, per teknologi, per status. */
function ebt(r) {
  if (!r) return "";
  const tek = Object.entries(r.per_teknologi || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<li><span>${esc(t("kj.kt.tek." + k))}</span><b>${n(v)} MW</b></li>`).join("");
  const st = Object.entries(r.per_status || {}).map(([k, v]) => `<li><span>${esc(t("jr.st." + k))}</span><b>${n(v)} MW</b></li>`).join("");
  return `<section class="kj-enb"><h4>${esc(t("kj.kt.ebt.j", { periode: r.periode }))}</h4>
    <div class="kj-angs kj-angs-1">${ubin(n(r.mw_total), "MW", t("kj.kt.ebt.proyek", { n: num(r.proyek), skenario: r.skenario || "-" }))}</div>
    ${tek ? `<ul class="kj-mini">${tek}</ul>` : ""}${st ? `<ul class="kj-mini">${st}</ul>` : ""}${kaki(r.st, r.src, r.tgl)}${cat(r.catatan)}</section>`;
}

/** Batang kecil per tahun dari seri {kv: [nilai per tahun]}; dijumlahkan lintas tegangan. */
function batang(seri, awal, nama) {
  const th = Object.values(seri || {}); if (!th.length) return "";
  const tot = th[0].map((_, i) => th.reduce((a, r) => a + (r[i] || 0), 0)), mx = Math.max(1, ...tot), W = 160, H = 34, g = W / tot.length;
  const rect = tot.map((v, i) => `<rect x="${(g * i + 1).toFixed(1)}" y="${(H - (H * v) / mx).toFixed(1)}" width="${(g - 2).toFixed(1)}" height="${((H * v) / mx).toFixed(1)}"><title>${esc(awal + i + ": " + n(v))}</title></rect>`).join("");
  return `<svg class="kj-batang" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("kj.kt.rj.aria", { nama, dari: awal, ke: awal + tot.length - 1 }))}">${rect}</svg>`;
}
/** Rencana transmisi (kms) dan gardu (MVA) RUPTL per tahun. */
function jaringan(r) {
  if (!r) return "";
  return `<section class="kj-enb"><h4>${esc(t("kj.kt.rj.j", { periode: r.periode }))}</h4>
    <div class="kj-angs">${ubin(n(r.total_kms), "kms", t("kj.kt.rj.kms"))}${ubin(n(r.total_mva), "MVA", t("kj.kt.rj.mva"))}</div>
    <div class="kj-der2"><span>${esc(t("kj.kt.rj.kms"))}</span>${batang(r.kms_per_kv_per_tahun, r.tahun_awal, t("kj.kt.rj.kms"))}</div>
    <div class="kj-der2"><span>${esc(t("kj.kt.rj.mva"))}</span>${batang(r.mva_per_kv_per_tahun, r.tahun_awal, t("kj.kt.rj.mva"))}</div>
    <p class="kj-cat">${esc(t("kj.kt.rj.skenario", { skenario: r.skenario, awal: r.tahun_awal }))}</p>${kaki(r.st, r.src, r.tgl)}${cat(r.catatan)}</section>`;
}

/** Kartu sistem: BPP 2020 dan rencana EBT RUPTL. */
export function blokSistem(ks) {
  if (!ks) return "";
  const b = ks.bpp;
  const bpp = b ? `<section class="kj-enb"><h4>${esc(t("kj.kt.bpp.j"))}</h4>
    <div class="kj-angs">${ubin(b.rp_kwh_min === b.rp_kwh_maks ? n(b.rp_kwh_min, 0) : t("kj.kt.bpp.rentang", { min: n(b.rp_kwh_min, 0), maks: n(b.rp_kwh_maks, 0) }), "Rp/kWh", t("kj.kt.bpp.tahun", { tahun: b.tahun }))}${ubin(n(b.nasional_rp_kwh, 0), "Rp/kWh", t("kj.kt.bpp.nas"))}</div>
    ${deret(t("kj.kt.bpp.deret"), Object.entries(b.per_tahun || {}).map(([y, o]) => ({ x: +y, y: (o.min + o.maks) / 2 })), (b.rp_kwh_min + b.rp_kwh_maks) / 2, "Rp/kWh")}
    ${kaki(b.st, b.src, b.tgl, b.ragu ? `<span class="kj-st kj-st-est">${esc(t("kj.kt.ragu"))}</span>` : "")}${cat(b.catatan)}</section>` : "";
  return bpp + jaringan(ks.ruptl_jaringan) + ebt(ks.ruptl_ebt);
}

/** Kartu provinsi: penduduk, kWh per kapita, elektrifikasi, potensi EBT, keandalan, deret MVA, rencana EBT; jual = sertakan deret penjualan. */
export function blokProvinsi(kp, { jual = false } = {}) {
  if (!kp) return "";
  const p = kp.penduduk, k = kp.kwh_per_kapita, e = kp.elektrifikasi, d = e?.desa, pe = kp.potensi_ebt;
  const demo = p || k ? `<section class="kj-enb"><h4>${esc(t("kj.kt.demo.j"))}</h4><div class="kj-angs">${p ? ubin(n(p.jiwa), "", t("kj.kt.penduduk", { tahun: p.tahun })) : ""}${k ? ubin(n(k.kwh), "kWh", t("kj.kt.kapita")) : ""}</div>
    ${p ? kaki(p.st, p.src, p.tgl, pihak3(p)) : ""}${k ? kaki(k.st, k.src, k.tgl, pihak3(k)) : ""}${cat(k?.catatan_tahun ? t("kj.kt.catatan_tahun", { c: k.catatan_tahun }) : "")}</section>` : "";
  const elek = e ? `<section class="kj-enb"><h4>${esc(t("kj.kt.elek.j", { tahun: e.tahun }))}</h4><div class="kj-angs">${ubin(n(e.rasio_persen, 2), "%", t("kj.kt.elek.rasio"))}${ubin(n(e.rumah_tangga_berlistrik), "", t("kj.kt.elek.rt"))}${d ? ubin(`${n(d.berlistrik_pln + d.berlistrik_non_pln)}/${n(d.jumlah)}`, "", t("kj.kt.elek.desa")) : ""}</div>
    ${kaki(e.st, e.src, e.tgl)}${d ? `${kaki(d.st, d.src, d.tgl)}${cat(d.catatan)}` : ""}</section>` : "";
  const pot = pe ? `<section class="kj-enb"><h4>${esc(t("kj.kt.pot.j"))}</h4><div class="kj-angs">${pe.pvout ? ubin(n(pe.pvout.rata), pe.pvout.sat, t("kj.kt.pot.surya")) : ""}${pe.angin_100m ? ubin(n(pe.angin_100m.rata, 1), pe.angin_100m.sat, t("kj.kt.pot.angin")) : ""}</div>
    ${["pvout", "angin_100m"].filter((x) => pe[x]).map((x) => `<p class="kj-cat">${esc(t("kj.kt.pot.sebar", { nama: t("kj.kt.pot." + (x === "pvout" ? "surya" : "angin")), p10: n(pe[x].p10, 1), p50: n(pe[x].p50, 1), p90: n(pe[x].p90, 1), n: num(pe[x].n) }))}</p>${kaki(pe[x].st, pe[x].src, pe[x].tgl)}`).join("")}${cat(pe.catatan)}</section>` : "";
  const ke = kp.keandalan_deret || [], mv = kp.deret_total_mva || [], jl = jual ? kp.penjualan_gwh || [] : [];
  const kea = ke.length ? `<section class="kj-enb"><h4>${esc(t("kj.kt.ke.j"))}</h4>${deret("SAIDI", ke.map((x) => ({ x: x.tahun, y: x.saidi })), ke.at(-1).saidi, t("kj.kt.ke.jam"))}${deret("SAIFI", ke.map((x) => ({ x: x.tahun, y: x.saifi })), ke.at(-1).saifi, t("kj.kt.ke.kali"))}${kaki(ke.at(-1).st, ke.at(-1).src, ke.at(-1).tgl)}<p class="kj-cat">${esc(t("kj.kt.ke.unit", { unit: ke.at(-1).unit }))}</p></section>` : "";
  const der = mv.length || jl.length ? `<section class="kj-enb">${mv.length ? `<h4>${esc(t("kj.kt.mva.j"))}</h4>${deret(t("kj.kt.mva.j"), mv.map((x) => ({ x: x.tahun, y: x.total_mva })), mv.at(-1).total_mva, "MVA")}${kaki(mv.at(-1).st, mv.at(-1).src, mv.at(-1).tgl)}` : ""}${jl.length ? `<h4>${esc(t("kj.peta.jual.j"))}</h4>${deret(t("kj.peta.jual.j"), jl.map((x) => ({ x: x.tahun, y: x.gwh })), jl.at(-1).gwh, "GWh")}${kaki(jl.at(-1).st, jl.at(-1).src, jl.at(-1).tgl)}` : ""}</section>` : "";
  return demo + elek + pot + kea + der + jaringan(kp.ruptl_jaringan) + ebt(kp.ruptl_ebt);
}
