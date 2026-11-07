/* Profil provinsi (/wilayah?prov=XX): kepala ringan (lambang, nama, satu kalimat, strip angka) lalu seksi exhibit .jm-ex.
   Data: /data/wilayah.json (baris provinsi) + /data/wilayah/<kode>.json (berita, kalender, emisi, pakar). Nilai kosong = "-" berpetunjuk; seksi kosong disembunyikan. */
import { esc, ikon, api } from "/inti/umum.js";
import { t, tanggal, ada } from "/i18n.js";
import { exHtml, unduhRegHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { batang } from "/grafik.js";
import { pilTek, pilTekTaut, pilStatus } from "/inti/ikon_tek.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, geoProvinsi, jalurPerProvinsi } from "/inti/peta_indonesia.js";
import { sumberLipat, amanUrl, muatData, num, pil, pasangBar } from "/analisis.js";
import { namaProyek } from "/inti/nama_proyek.js";

const ST0 = "tidak" + "-diketahui"; // slug data status, bukan teks layar
const TEK = ["hidro", "panas-bumi", "surya", "bayu", "bioenergi"];
const FOSIL = ["pltu", "pltg", "pltd"];
const EBT = ["plta", "pltb", "plt_bio", "pltp", "plts", "pltgb"];
let TGL = "";
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
  return { v: U.f(p) ?? null, r: i < 0 ? null : i + 1, n: semua.length, med: median(semua.map((x) => x.v)), top: semua[0] || null };
}
const satuan = (k) => (UKUR[k].satKey ? t(UKUR[k].satKey) : UKUR[k].sat);
const fmt = (k, v) => (v == null ? null : UKUR[k].juta ? juta(v) : num(v, UKUR[k].d)) ;

/* ---------- kepala: pita (breadcrumb, lambang, nama, chip fakta, peta mini) + strip angka ---------- */
const chip = (ik, teks) => (teks ? `<li class="jm-wp-chip">${ikon(ik, 16)}<span>${esc(teks)}</span></li>` : "");
const sel = (ik, nilai, sat, label, href, est) => (nilai == null ? "" : `<a class="jm-wp-sel" href="${href}"><span class="jm-wp-ub-ik">${ikon(ik, 20)}</span><span class="jm-wp-sel-t"><span class="jm-wp-ub-n"><b>${esc(nilai)}</b>${sat ? `<span>${esc(sat)}</span>` : ""}</span><span class="jm-wp-ub-l">${esc(label)}${est ? " " + pil("an.est") : ""}</span></span></a>`);
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
const seksi = (o) => exHtml({ tingkat: "h2", ...o });
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

/* ---------- 2. kelistrikan ---------- */
function kelistrikan(p) {
  const L = p.listrik || {}, kj = L.kapasitas_jenis_mw, desa = L.desa_berlistrik, rs = p.rasio_elektrifikasi, pltp = L.pltp;
  if (!kj && !desa && !rs) return "";
  const fosil = kj ? FOSIL.reduce((s, k) => s + (kj[k] || 0), 0) : null, ebt = kj ? EBT.reduce((s, k) => s + (kj[k] || 0), 0) : null;
  const porsi = kj && kj.total ? (ebt / kj.total) * 100 : null;
  const j = kj ? hlHtml("wp.j.listrik", num(kj.total, 0) + " MW", { nama: p.nama, persen: num(porsi, 0) }) : hlHtml("wp.j.listrik0", num(rs.nilai, 2) + "%", { nama: p.nama });
  const st = strip([
    sel("status", rs ? num(rs.nilai, 2) : null, "%", t("wp.k.rasio"), "#kelistrikan"),
    sel("orang", rs?.rumah_tangga_berlistrik != null ? num(rs.rumah_tangga_berlistrik) : null, "", t("wp.k.rt"), "#kelistrikan"),
    sel("wilayah", desa ? num(desa.jumlah) : null, desa ? t("wp.u.desa", { p: num(desa.persen, 1) }) : "", t("wp.k.desa"), "#kelistrikan"),
    sel("analisis", kj ? num(kj.total, 0) : null, "MW", t("wp.k.kapt"), "#kelistrikan"),
    sel("analisis", porsi != null ? num(porsi, 1) : null, "%", t("wp.k.porsi"), "#kelistrikan"),
  ]);
  const jenis = kj ? ["pltu", "pltg", "pltd", "plta", "plt_bio", "pltp", "plts", "pltb", "pltgb", "plt_lain"].filter((k) => kj[k] > 0).sort((a, b) => kj[b] - kj[a]) : [];
  const C = 2 * Math.PI * 50, arc = porsi != null ? (porsi / 100) * C : 0;
  const donut = kj ? `<div class="jm-wp-box jm-wp-donut"><svg viewBox="0 0 140 140" role="img" aria-label="${esc(t("wp.donut", { persen: num(porsi, 1) }))}" focusable="false"><circle class="jm-wp-dn-f" cx="70" cy="70" r="50"/><circle class="jm-wp-dn-e" cx="70" cy="70" r="50" stroke-dasharray="${arc.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 70 70)"/><text x="70" y="70" text-anchor="middle" class="jm-wp-dn-n">${esc(num(porsi, 0))}%</text><text x="70" y="88" text-anchor="middle" class="jm-wp-dn-s">${esc(t("wp.donut_ebt"))}</text></svg>
    <ul class="jm-wp-leg"><li><i class="jm-wp-sw-e"></i><span>${esc(t("wp.k.ebt"))}</span><b>${esc(num(ebt, 0))} MW</b></li><li><i class="jm-wp-sw-f"></i><span>${esc(t("wp.k.fosil"))}</span><b>${esc(num(fosil, 0))} MW</b></li></ul></div>` : "";
  const mx = Math.max(1, ...jenis.map((k) => kj[k]));
  const bars = jenis.length ? `<div class="jm-wp-box"><ul class="jm-wp-bars" aria-label="${esc(t("wp.listrik.grafik"))}">${jenis.map((k, i) => `<li><span class="jm-wp-bl">${esc(t("wp.jenis." + k))}</span><span class="jm-wp-bt"><i class="${i === 0 ? "jm-wp-b1" : "jm-wp-b0"}" data-w="${((kj[k] / mx) * 100).toFixed(1)}"></i></span><b class="jm-wp-bv">${esc(num(kj[k], 0))} MW</b></li>`).join("")}</ul></div>` : "";
  const pl = pltp ? `<h3 class="jm-wp-h3">${esc(t("wp.pltp"))}</h3><ul class="jm-wp-pltp">${pltp.daftar.map((x) => `<li class="jm-wp-pk"><b>${esc(x.nama)}</b>${x.org ? `<a class="jm-wp-op" href="/o/${encodeURIComponent(x.org.id)}">${x.org.logo && /^\/img\//.test(x.org.logo) ? `<img src="${esc(x.org.logo)}" width="24" height="24" alt="" loading="lazy" decoding="async">` : ""}<span>${esc(x.org.nama)}</span></a>` : `<span class="jm-wp-op">${esc(x.pemilik)}</span>`}${pilStatus("beroperasi")}</li>`).join("")}</ul>` : "";
  return seksi({ id: "kelistrikan", ikon: "analisis", topik: t("wp.ey.listrik"), judulHtml: j, aksiHtml: aksiHtml() + sumberDari(kj, desa, rs, pltp), isiHtml: `${st}${donut || bars ? `<div class="jm-wp-dua">${donut}${bars}</div>` : ""}${pl}`, kakiHtml: kj && p.terpasang_mw ? `<p class="jm-bantu">${esc(t("wp.cat.dua_sumber", { a: kj.tahun, b: p.terpasang_mw.tahun }))}</p>` : "" });
}

/* ---------- 3. potensi vs terpasang ---------- */
function potensi(p) {
  const pt = p.per_teknologi_mw || {}, pb = p.potensi_panas_bumi, atlas = p.surya_atlas;
  if (!p.terpasang_mw && !pb) return "";
  const baris = TEK.map((k) => ({ k, mw: pt[k] ?? null, pot: k === "panas-bumi" ? pb?.nilai ?? null : null }));
  const mxT = Math.max(1, ...baris.map((r) => r.mw || 0));
  const bars = baris.filter((r) => r.mw != null).map((r) => ({ label: t("an.tek." + r.k), w: r.pot ? (r.mw / r.pot) * 100 : (r.mw / mxT) * 100, on: r.pot != null, teks: r.pot != null ? (r.mw > 0 ? t("wp.pot.dari", { a: num(r.mw, 1), b: num(r.pot, 0) }) : t("wp.pot.nol")) : num(r.mw, 1) + " MW" }));
  const grafik = bars.length ? `<ul class="jm-wp-bars jm-wp-bars-l" aria-label="${esc(t("wp.pot.grafik"))}">${bars.map((b) => `<li><span class="jm-wp-bl">${esc(b.label)}</span><span class="jm-wp-bt"><i class="${b.on ? "jm-wp-b1" : "jm-wp-b0"}" data-w="${Math.min(100, b.w).toFixed(1)}"></i></span><b class="jm-wp-bv">${esc(b.teks)}</b></li>`).join("")}</ul>` : "";
  const j = pb && !(pt["panas-bumi"] > 0) ? hlHtml("wp.j.potensi_nol", num(pb.nilai, 0) + " MW", { nama: p.nama }) : pb ? hlHtml("wp.j.potensi", num(((pt["panas-bumi"] ?? 0) / pb.nilai) * 100, 1) + "%", { nama: p.nama, a: num(pt["panas-bumi"] ?? 0, 1), b: num(pb.nilai, 0) }) : hlHtml("wp.j.potensi0", num(p.terpasang_mw.nilai, 1) + " MW", { nama: p.nama });
  const tabel = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${esc(t("wl.col.tek"))}</th><th class="jm-num">${esc(t("wp.col.terpasang"))}</th><th class="jm-num">${esc(t("wp.col.potensi"))}</th><th class="jm-num">${esc(t("wp.col.real"))}</th></tr></thead><tbody>${baris.map((r) =>
    `<tr><td data-label="${esc(t("wl.col.tek"))}">${pilTekTaut(r.k)}</td><td data-label="${esc(t("wp.col.terpasang"))}" class="jm-num">${nilaiAtau(r.mw, (v) => esc(num(v, 1)) + " MW")}</td><td data-label="${esc(t("wp.col.potensi"))}" class="jm-num">${r.pot != null ? esc(num(r.pot, 0)) + " MW" : kos(t("wp.kos.potensi"))}</td><td data-label="${esc(t("wp.col.real"))}" class="jm-num">${r.pot ? esc(num((r.mw / r.pot) * 100, 1)) + "%" : kos()}</td></tr>`).join("")}</tbody></table></div>`;
  const sur = atlas?.pvout_kwh_per_kwp_tahun ? `<p class="jm-bantu">${esc(t("wp.surya_atlas", { pv: num(atlas.pvout_kwh_per_kwp_tahun), ghi: num(atlas.ghi_kwh_per_m2_tahun ?? 0) }))}</p>` : "";
  return seksi({ id: "potensi", ikon: "peta", topik: t("wp.ey.potensi"), judulHtml: j, aksiHtml: aksiHtml({ csv: true }) + sumberDari(p.terpasang_mw, pb, atlas && { sumber: atlas.sumber, url: atlas.url, tanggal: atlas.tanggal }), isiHtml: grafik + tabel, kakiHtml: sur + `<p class="jm-bantu">${esc(t("wp.cat.potensi"))}</p>` });
}

/* ---------- 4. RUED ---------- */
function rued(p) {
  const r = p.rued, kj = p.listrik?.kapasitas_jenis_mw;
  if (!r?.perda) return "";
  const porsi = kj && kj.total ? (EBT.reduce((s, k) => s + (kj[k] || 0), 0) / kj.total) * 100 : null;
  const j = r.target_ebt_persen != null ? hlHtml("wp.j.rued_t", num(r.target_ebt_persen, 0) + "%", { nama: p.nama, perda: r.perda }) : hlHtml("wp.j.rued", "Perda " + r.perda, { nama: p.nama });
  const kand = (r.kandidat || []).length ? `<p class="jm-bantu">${esc(t("wl.rued_kand_judul"))} ${(r.kandidat || []).map((k) => esc(t("wl.rued_kand", { tahun: k.tahun, persen: num(k.persen, 0) }))).join("; ")}</p>` : "";
  const isi = dl([
    [t("wp.k.perda"), (() => { const [no, th] = r.perda.split("/"), x = p.perda.find((q) => q.nomor === no && String(q.tahun) === th); return `${x ? tautanReg(x, t("wl.rued_ada", { perda: r.perda })) : tautan(r.url, t("wl.rued_ada", { perda: r.perda }))} ${unduhRegHtml({ judul: r.perda, url_sumber: r.url, ...(x && REG.get(x.id)) })}`; })()],
    [t("wp.k.target"), r.target_ebt_persen != null ? esc(num(r.target_ebt_persen, 1)) + "%" : kos(t("wp.kos.target"))],
    [t("wp.k.real"), porsi != null ? `${esc(num(porsi, 1))}% <small>(${esc(t("wp.k.real_ket", { tahun: kj.tahun }))})</small>` : kos(t("wp.kos.real"))],
  ]);
  const gr = r.target_ebt_persen != null && porsi != null ? batang([{ label: t("wp.k.target"), v: r.target_ebt_persen, teks: num(r.target_ebt_persen, 0) + "%" }, { label: t("wp.k.real"), v: porsi, teks: num(porsi, 1) + "%", sorot: true }], { maks: 100, label: t("wp.rued.grafik") }) : "";
  return seksi({ id: "rued", ikon: "regulasi", topik: t("wp.ey.rued"), judulHtml: j, aksiHtml: aksiHtml() + sumberDari({ sumber: t("wl.sumber_rued"), url: r.url, tanggal: r.tanggal }, kj), isiHtml: isi + gr, kakiHtml: kand + `<p class="jm-bantu">${esc(t("wp.cat.rued"))}</p>` });
}

/* ---------- 5. peta proyek ---------- */
function petaSeksi(p) {
  if (!p.proyek.length) return "";
  const tepat = p.proyek.filter((x) => x.lat != null && x.presisi !== "provinsi").length;
  const j = hlHtml("wp.j.peta", num(p.proyek.length), { nama: p.nama, tepat: num(tepat) });
  return seksi({ id: "peta", ikon: "peta", topik: t("wp.ey.peta"), judulHtml: j, aksiHtml: aksiHtml({ csv: false }) + sumberDari({ sumber: t("wl.sumber_proyek"), tanggal: "" }), isiHtml: `<div class="jm-wp-peta" id="wp-peta" role="region" aria-label="${esc(t("wp.peta_label"))}"></div>`, kakiHtml: `<p class="jm-bantu">${esc(t("wp.peta_cat", { tepat: num(tepat), n: num(p.proyek.length) }))}</p>` });
}
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
async function bukaPeta(p) {
  const el = document.getElementById("wp-peta"); if (!el) return;
  try {
    const [g] = await Promise.all([geoProvinsi(), muatMapLibre()]);
    const f = g?.features.find((x) => String(x.properties.kode) === p.kode); if (!f) throw new Error("geo");
    const b = new maplibregl.LngLatBounds();
    for (const poli of f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) for (const [x, y] of poli[0]) b.extend([x, y]);
    const peta = new maplibregl.Map({ container: el, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), bounds: b, fitBoundsOptions: { padding: 24 }, minZoom: 3, maxZoom: 14, dragRotate: false, pitchWithRotate: false, scrollZoom: false, cooperativeGestures: true, attributionControl: { compact: true } });
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("style.load", () => {
      rapikanPeta(peta);
      const luar = [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]];
      for (const poli of f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) luar.push(poli[0]);
      peta.addSource("luar", { type: "geojson", data: { type: "Feature", geometry: { type: "Polygon", coordinates: luar } } });
      peta.addSource("prov", { type: "geojson", data: f });
      peta.addLayer({ id: "luar", type: "fill", source: "luar", paint: { "fill-color": warna("--paper"), "fill-opacity": 0.72 } });
      peta.addLayer({ id: "prov", type: "line", source: "prov", paint: { "line-color": warna("--accent-isi"), "line-width": 2 } });
      const titik = p.proyek.filter((x) => x.lat != null).map((x) => ({ type: "Feature", geometry: { type: "Point", coordinates: [x.lng, x.lat] }, properties: { nama: namaBersih(x), mw: x.mw || 0, tepat: x.presisi === "provinsi" ? 0 : 1 } }));
      peta.addSource("titik", { type: "geojson", data: { type: "FeatureCollection", features: titik } });
      peta.addLayer({ id: "titik", type: "circle", source: "titik", paint: { "circle-color": warna("--accent-isi"), "circle-opacity": ["case", ["==", ["get", "tepat"], 1], 0.85, 0.25], "circle-radius": ["interpolate", ["linear"], ["sqrt", ["get", "mw"]], 0, 5, 10, 8, 30, 13], "circle-stroke-color": warna("--card"), "circle-stroke-width": 1.5 } });
      const pop = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });
      peta.on("mousemove", "titik", (e) => { const q = e.features[0].properties; peta.getCanvas().style.cursor = "pointer"; pop.setLngLat(e.lngLat).setText(q.nama + (q.mw ? ` (${num(q.mw, 1)} MW)` : "")).addTo(peta); });
      peta.on("mouseleave", "titik", () => { peta.getCanvas().style.cursor = ""; pop.remove(); });
    });
  } catch (e) { console.warn("peta profil", e); el.innerHTML = `<p class="jm-kosong">${esc(t("wl.peta_gagal"))}</p>`; }
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

/* ---------- 7. organisasi ---------- */
function organisasi(p) {
  if (!p.organisasi.length) return "";
  const kat = [...new Set(p.organisasi.map((o) => o.kategori).filter(Boolean))].length;
  const kartu = p.organisasi.map((o) => `<li><a class="jm-wp-org" href="/direktori?tampil=lembaga&amp;id=${encodeURIComponent(o.id)}" title="${esc(o.nama)}">${o.logo && /^\/img\//.test(o.logo) ? `<img src="${esc(o.logo)}" width="40" height="40" alt="" loading="lazy" decoding="async">` : `<span class="jm-wp-org-i" aria-hidden="true">${esc(o.nama.replace(/^(PT|CV|Pemerintah|Dinas|Universitas|Koperasi)\s+/i, "").slice(0, 2).toUpperCase())}</span>`}<span><b>${esc(o.nama)}</b>${o.kategori ? `<small>${esc(o.kategori)}</small>` : ""}</span></a></li>`).join("");
  return seksi({ id: "organisasi", ikon: "direktori", topik: t("wp.ey.org"), judulHtml: hlHtml("wp.j.org", num(p.organisasi.length), { nama: p.nama, kat: num(kat) }), aksiHtml: aksiHtml() + sumberDari({ sumber: t("wl.sumber_org"), tanggal: "" }), isiHtml: `<ul class="jm-wp-orgs">${kartu}</ul>` });
}

/* ---------- 8. pakar ---------- */
function pakar(p, d) {
  const x = d?.pakar; if (!x?.daftar?.length) return "";
  const tb = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${esc(t("wp.col.nama"))}</th><th>${esc(t("wp.col.inst"))}</th><th>${esc(t("wp.col.topik"))}</th><th class="jm-num">${esc(t("wp.col.h"))}</th></tr></thead><tbody>${x.daftar.map((o) =>
    `<tr><td data-label="${esc(t("wp.col.nama"))}">${tautan(o.url, namaRapi(o.nama))}</td><td data-label="${esc(t("wp.col.inst"))}">${nilaiAtau(o.institusi, esc)}</td><td data-label="${esc(t("wp.col.topik"))}">${o.topik.length ? esc(o.topik.map((k) => (t("wp.topik." + k) === "wp.topik." + k ? k : t("wp.topik." + k))).join(", ")) : kos()}</td><td data-label="${esc(t("wp.col.h"))}" class="jm-num">${nilaiAtau(o.h, (v) => esc(num(v)))}</td></tr>`).join("")}</tbody></table></div>`;
  return seksi({ id: "pakar", ikon: "orang", topik: t("wp.ey.pakar"), judulHtml: hlHtml("wp.j.pakar", num(x.jumlah), { nama: p.nama, n: num(x.daftar.length) }), aksiHtml: aksiHtml({ csv: true }) + sumberDari({ sumber: x.sumber, url: x.url, tanggal: x.tanggal }), isiHtml: tb, kakiHtml: `<p class="jm-bantu">${esc(t("wp.cat.pakar"))}</p>` });
}

/* ---------- 9. regulasi daerah ---------- */
function regulasi(p) {
  if (!p.perda.length) return "";
  const A = [...p.perda].sort((a, b) => (b.tahun || 0) - (a.tahun || 0));
  const tb = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${esc(t("wp.col.perda"))}</th><th>${esc(t("wp.col.judul"))}</th><th>${esc(t("wl.col.status"))}</th><th>${esc(t("pf.c.unduh"))}</th></tr></thead><tbody>${A.map((x) =>
    `<tr><td data-label="${esc(t("wp.col.perda"))}">${tautanReg(x, t("wl.perda_item", { nomor: x.nomor, tahun: x.tahun }))}</td><td data-label="${esc(t("wp.col.judul"))}">${esc(x.judul)}</td><td data-label="${esc(t("wl.col.status"))}">${nilaiAtau(x.status, esc)}</td><td data-label="${esc(t("pf.c.unduh"))}" class="jm-tengah">${unduhRegHtml({ judul: x.judul, url_sumber: x.url, ...REG.get(x.id) }) || "-"}</td></tr>`).join("")}</tbody></table></div>`;
  return seksi({ id: "regulasi", ikon: "regulasi", topik: t("wp.ey.reg"), judulHtml: hlHtml("wp.j.reg", num(A.length), { nama: p.nama }), aksiHtml: aksiHtml({ csv: true }) + sumberDari({ sumber: t("wl.sumber_perda"), tanggal: "" }), isiHtml: tb });
}

/* ---------- 10. emisi ---------- */
function emisi(p, d) {
  const e = d?.emisi; if (!e) return "";
  const rows = e.pembangkit.map((x, i) => ({ label: x.nama.replace(/ (power station|power plant|PLTU|plant)$/i, ""), v: x.emisi, sorot: i === 0, teks: t("wp.emisi.nilai", { n: juta(x.emisi) }) }));
  return seksi({ id: "emisi", ikon: "analisis", topik: t("wp.ey.emisi"), judulHtml: hlHtml("wp.j.emisi", t("wp.emisi.nilai", { n: juta(e.total_tco2e) }), { nama: p.nama, n: num(e.jumlah), tahun: e.tahun }), aksiHtml: aksiHtml() + sumberDari({ sumber: e.sumber, url: e.url, tahun: e.tahun, tanggal: e.tanggal }), isiHtml: batang(rows, { label: t("wp.emisi.grafik") }), kakiHtml: `<p class="jm-bantu">${esc(t("wp.cat.emisi"))}</p>` });
}

/* ---------- 11. berita dan agenda ---------- */
function berita(p, d) {
  const b = d?.berita || [], k = d?.kalender || [];
  if (!b.length && !k.length) return "";
  const lb = b.length ? `<ul class="jm-wp-daftar">${b.map((x) => `<li>${tautan(x.url, x.judul)} <small>${esc(x.media)}, ${esc(tanggal(x.terbit))}</small></li>`).join("")}</ul>` : "";
  const lk = k.length ? `<h3 class="jm-wp-h3">${esc(t("wp.agenda"))}</h3><ul class="jm-wp-daftar">${k.map((x) => `<li>${tautan(x.url, x.judul)} <small>${esc(tanggal(x.tanggal))}</small></li>`).join("")}</ul>` : "";
  return seksi({ id: "berita", ikon: "berita", topik: t("wp.ey.berita"), judulHtml: hlHtml("wp.j.berita", num(b.length + k.length), { nama: p.nama }), aksiHtml: aksiHtml(), isiHtml: lb + lk, kakiHtml: `<p class="jm-bantu">${esc(t("wp.cat.berita"))}</p>` });
}

/* ---------- 12. perbandingan ---------- */
function banding(data, p) {
  const K = ["ebt", "kap", "rasio", "desa", "pb", "proyek", "penduduk", "pdrbk"], R = K.map((k) => [k, peringkat(data, p, k)]);
  const ada = R.filter(([, r]) => r.v != null);
  if (!ada.length) return "";
  const utama = R[0][1];
  const j = utama.r ? hlHtml("wp.j.banding", t("wp.rank_ket", { r: utama.r, n: utama.n }), { nama: p.nama }) : hlHtml("wp.j.banding0", p.nama, {});
  const tb = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${esc(t("wp.col.ukuran"))}</th><th class="jm-num">${esc(p.nama)}</th><th class="jm-num">${esc(t("wp.col.rank"))}</th><th class="jm-num">${esc(t("wp.col.median"))}</th><th>${esc(t("wp.col.tertinggi"))}</th></tr></thead><tbody>${R.map(([k, r]) => {
    const sat = satuan(k) ? " " + satuan(k) : "";
    return `<tr><td data-label="${esc(t("wp.col.ukuran"))}">${esc(t("wp.uk." + k))}</td><td data-label="${esc(p.nama)}" class="jm-num">${r.v == null ? kos() : esc(fmt(k, r.v) + sat)}</td><td data-label="${esc(t("wp.col.rank"))}" class="jm-num">${r.r ? esc(t("wp.rank_ket", { r: r.r, n: r.n })) : kos()}</td><td data-label="${esc(t("wp.col.median"))}" class="jm-num">${r.med == null ? kos() : esc(fmt(k, r.med) + sat)}</td><td data-label="${esc(t("wp.col.tertinggi"))}">${r.top ? `<a href="/wilayah?prov=${esc(r.top.b.kode)}">${esc(r.top.b.nama)}</a> <small>${esc(fmt(k, r.top.v) + sat)}</small>` : kos()}</td></tr>`;
  }).join("")}</tbody></table></div>`;
  return seksi({ id: "banding", ikon: "tabel", topik: t("wp.ey.banding"), judulHtml: j, aksiHtml: aksiHtml({ csv: true }), isiHtml: tb, kakiHtml: `<p class="jm-bantu">${esc(t("wp.cat.banding"))}</p>` });
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
  document.title = t("wl.profil_title", { nama: p.nama }); TGL = data.dibangun_pada;
  try { for (const r of (await muatData("regulasi.json")).baris) REG.set(r.id, r); } catch (e) { /* tautan sumber saja */ }
  let d = null;
  try { d = await muatData("wilayah/" + encodeURIComponent(p.kode) + ".json"); } catch (e) { /* bagian tambahan disembunyikan */ }
  $("profil-isi").innerHTML = kepala(data, p) + [ringkasan(p), kelistrikan(p), potensi(p), rued(p), petaSeksi(p), proyek(p), organisasi(p), '<div id="wp-meti"></div>', pakar(p, d), regulasi(p), emisi(p, d), berita(p, d), banding(data, p)].join("");
  $("cara").innerHTML = `<p>${esc(t("wl.cara_profil"))}</p>`;
  pasangBar($("profil-isi")); petaMini(p);
  isiMetiWilayah(p);
  bukaPeta(p);
}
