/* /jaringan?tab=bauran (KJ-12): bauran energi dan intensitas karbon TAHUNAN per sistem. Data: /data/kembaran/energi.json (potret statis),
   geometri ruas: /geo/kembaran.json, peta ruas -> sistem: objek-rs.json, bbox sistem: objek-inti.json (dimuat sesudah bingkai pertama). Kontrak: KEMBARAN-JARINGAN.md §4 butir 8, §6 butir 4.
   INP: sakelar Langsung/Daur hidup dan pilih sistem memakai setPaintProperty; peta tidak dibangun ulang. */
import { ex, t, esc, num, token, kosongTab, sumberBerkas, daftarCelah } from "/jr_umum.js";
import { tanggal } from "/i18n.js";
import { muatKJ, chipSt, chipSrc, kakiFakta } from "/jr_kj.js";
import { nanti } from "/inti/umum.js";
import { URUT_BBM, namaBbm, rampIntensitas, SKALA, batangBbm, legendaBbm, pasangGaya, bukaPeta } from "/jr_bbm.js";

const S = { mode: "langsung", sel: null, E: null, peta: null, bbox: new Map() };
let akar;
const $ = (s) => akar.querySelector(s);
const kunci = () => (S.mode === "langsung" ? "langsung" : "daur_hidup");
const nilai = (s) => (s && s.tidak_dihitung !== true && s[kunci()] != null ? s[kunci()] : null);
const sistemUrut = () => [...S.E.bauran.sistem].sort((a, b) => (nilai(a) ?? 1e9) - (nilai(b) ?? 1e9) || String(a.nama).localeCompare(String(b.nama)));
const gi = (v) => (v == null ? "-" : num(v));

function batangPanel() { // baris angka nasional + batang + legenda
  const n = S.E.nasional;
  return `<div class="kj-angs kje-angs-2"><div class="kj-ang"><b>${gi(nilai(n))}<small>g/kWh</small></b><span>${esc(t("kj.ba.nas.int_" + S.mode))}</span></div>
    <div class="kj-ang"><b>${num(n.rendah_karbon_persen, 1)}<small>%</small></b><span>${esc(t("kj.ba.nas.rendah"))}</span></div>
    <div class="kj-ang"><b>${num(n.batubara_persen, 1)}<small>%</small></b><span>${esc(t("kj.ba.nas.batubara"))}</span></div></div>
    ${batangBbm(n.persen, "kje-bar-b")}${kakiFakta(n.st, n.src, n.tgl)}`;
}

function daftar() {
  return sistemUrut().map((s) => {
    const v = nilai(s);
    return `<li><button type="button" class="kje-sis" data-sis="${esc(s.id)}" aria-pressed="${s.id === S.sel}">
      <span class="kje-sis-n">${esc(s.nama)}</span><b>${v == null ? esc(t("kj.ba.tak")) : `${gi(v)}<small>g/kWh</small>`}</b>${v == null ? "" : batangBbm(s.persen)}</button></li>`;
  }).join("");
}

/* ---- rincian sistem ---- */
function terbit(s) {
  const p = (S.E.pembanding_emisi || []).filter((x) => (x.sis || x.id) === s.id || String(x.wilayah).toLowerCase() === String(s.nama).toLowerCase());
  const rows = p.map((x) => {
    const f = x.faktor_t_co2_mwh && Object.entries(x.faktor_t_co2_mwh).map(([th, v]) => `${th}: ${num(v * 1000)}`).join(", ");
    return `<li><span>${esc(x.wilayah || "")} ${esc(x.skenario || "")}</span><b>${f || "-"} <small>g/kWh</small></b><span>${esc(t("kj.ba.terbit.kami"))}: <b>${gi(nilai(s))} g/kWh</b></span>${chipSrc(x.src)}${x.tgl ? `<span class="kj-tgl">${esc(t("kj.per", { tgl: tanggal(x.tgl) }))}</span>` : ""}</li>`;
  });
  const pb = s.pembanding?.ebt_persen_terbit;
  if (pb != null) rows.push(`<li><span>${esc(t("kj.ba.terbit.ebt", { sis: s.pembanding.sistem_terbit || s.nama }))}</span><b>${num(pb, 1)} <small>%</small></b><span>${esc(t("kj.ba.terbit.kami"))}: <b>${num(s.rendah_karbon_persen, 1)} %</b></span>${chipSrc(s.pembanding.src)}</li>`);
  const pe = s.pembanding_esdm;
  if (pe) { const v = (x) => (x == null ? "-" : num(x, 2)); rows.push(`<li><span>${esc(t("kj.ba.esdm.grid", { grid: pe.grid, tahun: pe.tahun }))}</span><b>${esc(t("kj.ba.esdm.om"))} ${v(pe.om)}, ${esc(t("kj.ba.esdm.bm"))} ${v(pe.bm)}, ${esc(t("kj.ba.esdm.cm"))} ${v(pe.cm_ex_post_050)} <small>${esc(t("kj.ba.esdm.sat"))}</small></b><span>${esc(t("kj.ba.terbit.kami"))}: <b>${gi(nilai(s))} g/kWh</b></span><span class="kj-tgl">${esc(t("kj.ba.esdm.cocok." + pe.cara_cocok))}</span><span class="kj-kaki">${chipSt(pe.st)}${chipSrc(pe.src)}</span></li>`); }
  return `<section class="kje-blok"><h4>${esc(t("kj.ba.terbit.j"))}</h4>${rows.length ? `<ul class="kje-banding">${rows.join("")}</ul>` : `<p class="kj-cat">${chipSt("menunggu")} ${esc(t("kj.ba.terbit.kosong"))}</p>`}</section>`;
}
function faktor() {
  const f = S.E.faktor || [];
  return `<details class="kje-cara" open><summary>${esc(t("kj.ba.cara.j"))}</summary><p class="kj-cat">${esc(t("kj.ba.cara.isi"))}</p>
    <div class="kj-tabel"><table><thead><tr><th>${esc(t("kj.ba.cara.jenis"))}</th><th>${esc(t("kj.ba.cara.l"))}</th><th>${esc(t("kj.ba.cara.d"))}</th><th></th></tr></thead><tbody>${f.map((x) => `<tr><td><b>${esc(x.teknologi)}</b> <small>${esc(namaBbm(x.jenis))}</small></td><td>${num(x.langsung)}</td><td>${num(x.daur_hidup)}</td><td>${chipSt(x.st)}${chipSrc(x.src_langsung)}</td></tr>`).join("")}</tbody></table></div></details>`;
}
function rincian() {
  const s = S.E.bauran.sistem.find((x) => x.id === S.sel);
  if (!s) return `<p class="kj-cat">${esc(t("kj.ba.pilih"))}</p>`;
  if (s.tidak_dihitung || s.langsung == null) return `<h3 class="kje-j">${esc(s.nama)}</h3><p class="kj-cat">${chipSt("menunggu")} ${esc(t("kj.ba.tidak_dihitung"))}</p>`;
  const jenis = URUT_BBM.filter((j) => s.gwh?.[j] > 0).sort((a, b) => s.gwh[b] - s.gwh[a]);
  return `<h3 class="kje-j">${esc(s.nama)}</h3>
    <div class="kj-angs"><div class="kj-ang"><b>${gi(s.langsung)}<small>g/kWh</small></b><span>${esc(t("kj.ba.nas.int_langsung"))}</span></div>
    <div class="kj-ang"><b>${gi(s.daur_hidup)}<small>g/kWh</small></b><span>${esc(t("kj.ba.nas.int_daur_hidup"))}</span></div>
    <div class="kj-ang"><b>${num(s.total)}<small>GWh</small></b><span>${esc(t("kj.ba.total"))}</span></div></div>
    <ul class="kje-jenis">${jenis.map((j) => `<li><i class="kje-sw" data-bbm="${j}"></i><span>${esc(namaBbm(j))}</span><b>${num(s.persen?.[j] ?? 0, 1)}%</b><small>${num(s.gwh[j])} GWh</small></li>`).join("")}</ul>
    ${kakiFakta(s.st, s.src, s.tgl)}${terbit(s)}${faktor()}`;
}

/* ---- tren tahunan: hanya tahun berdata ---- */
function tren() {
  const E = S.E, s = E.bauran.sistem.find((x) => x.id === S.sel);
  const nama = s ? s.nama : t("kj.ba.indonesia");
  const th = (E.tren || []).map((y) => {
    if (s) { const r = y.sistem.find((x) => x.id === s.id); return r && !r.tidak_dihitung && r.persen ? { tahun: y.tahun, persen: r.persen, v: r[kunci()] } : null; }
    return y.tahun === E.nasional.tahun ? { tahun: y.tahun, persen: E.nasional.persen, v: E.nasional[kunci()] } : null;
  }).filter(Boolean).sort((a, b) => a.tahun - b.tahun);
  if (!th.length) return `<p class="kj-cat">${esc(t("kj.ba.tren.kosong"))}</p>`;
  const L = 36, W = 320, H = 150, lb = Math.min(60, (W - L) / th.length - 12), g = (W - L) / th.length;
  const bars = th.map((y, i) => {
    let yy = H, x = L + g * i + (g - lb) / 2;
    const seg = URUT_BBM.filter((j) => y.persen[j] > 0).map((j) => { const h = (H * y.persen[j]) / 100; yy -= h; return `<rect data-bbm="${j}" x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${lb.toFixed(1)}" height="${h.toFixed(1)}"/>`; }).join("");
    return `${seg}<text class="kje-tx" x="${(x + lb / 2).toFixed(1)}" y="${H + 14}" text-anchor="middle">${y.tahun}</text><text class="kje-tx kje-tx-b" x="${(x + lb / 2).toFixed(1)}" y="-6" text-anchor="middle">${gi(y.v)} g</text>`;
  }).join("");
  return `<svg class="kje-tren" viewBox="0 -18 ${W} ${H + 36}" role="img" aria-label="${esc(t("kj.ba.tren.aria", { nama, tahun: th.map((y) => y.tahun).join(", ") }))}">
    <g class="kje-ax"><line x1="${L}" y1="${H}" x2="${W}" y2="${H}"/><text x="${L - 4}" y="${H}" text-anchor="end">0%</text><text x="${L - 4}" y="8" text-anchor="end">100%</text></g>${bars}</svg>
    <p class="kj-cat">${esc(t("kj.ba.tren.cat", { nama, tahun: th.map((y) => y.tahun).join(", ") }))}</p>`;
}

/* ---- tren nasional Ember 2000-2025 + persen bauran PLN ---- */
const EMB = { surya: "--tp-surya", bayu: "--tp-bayu", hidro: "--tp-hidro", bioenergi: "--tp-bio", "terbarukan-lain": "--tp-panas", batubara: "--tp-karbon", gas: "--tp-hidrogen", "fosil-lain": "--tp-sampah", "impor-bersih": "--line-ctl" };
const PLN = ["batubara", "gas", "bbm", "hidro", "panas-bumi", "bioenergi", "ebt-lain"];
function trenNasional() {
  const th = S.E.tren_nasional || []; if (!th.length) return "";
  const L = 40, W = 640, H = 170, g = (W - L - 36) / th.length, lb = Math.max(4, g - 3);
  const mx = Math.max(...th.map((y) => y.total_twh)), imx = Math.max(...th.map((y) => y.intensitas_g_kwh));
  const bars = th.map((y, i) => {
    let yy = H; const x = L + g * i + (g - lb) / 2;
    const seg = Object.keys(EMB).filter((j) => y.twh[j] > 0).map((j) => { const h = (H * y.twh[j]) / mx; yy -= h; return `<rect data-c="${EMB[j]}" x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${lb.toFixed(1)}" height="${h.toFixed(1)}"><title>${esc(y.tahun + " " + t("kj.ba.emb." + j) + " " + num(y.twh[j], 1) + " TWh")}</title></rect>`; }).join("");
    return seg + (y.tahun % 5 === 0 ? `<text class="kje-tx" x="${(x + lb / 2).toFixed(1)}" y="${H + 14}" text-anchor="middle">${y.tahun}</text>` : "");
  }).join("");
  const pts = th.map((y, i) => `${(L + g * i + g / 2).toFixed(1)},${(H - (H * y.intensitas_g_kwh) / imx).toFixed(1)}`).join(" ");
  const a = th[0], z = th.at(-1), ariaEmb = esc(t("kj.ba.emb.aria", { dari: a.tahun, ke: z.tahun }));
  return `<h4>${esc(t("kj.ba.emb.j"))}</h4><svg class="kje-tren kje-tren-w" viewBox="0 -22 ${W} ${H + 40}" role="img" aria-label="${ariaEmb}">
    <g class="kje-ax"><line x1="${L}" y1="${H}" x2="${W - 36}" y2="${H}"/>${[0, 1, 2, 3].map((i) => `<text x="${L - 4}" y="${(H - (H * i) / 3 + 4).toFixed(0)}" text-anchor="end">${num((mx * i) / 3)}</text><text x="${W - 32}" y="${(H - (H * i) / 3 + 4).toFixed(0)}">${num((imx * i) / 3)}</text>`).join("")}<text x="${L - 4}" y="-10" text-anchor="end">TWh</text><text x="${W - 32}" y="-10">g/kWh</text></g>${bars}<polyline class="kje-gar" points="${pts}"/></svg>
    <ul class="kje-leg">${Object.keys(EMB).map((j) => `<li><i class="kje-sw" data-c="${EMB[j]}"></i>${esc(t("kj.ba.emb." + j))}</li>`).join("")}<li><i class="kje-sw kje-sw-gar"></i>${esc(t("kj.ba.emb.int"))}</li></ul>
    <div class="kj-angs kje-angs-2"><div class="kj-ang"><b>${num(z.intensitas_g_kwh)}<small>g/kWh</small></b><span>${esc(t("kj.ba.emb.int_z", { tahun: z.tahun }))}</span></div><div class="kj-ang"><b>${num(z.terbarukan_persen, 1)}<small>%</small></b><span>${esc(t("kj.ba.emb.ebt_z", { tahun: z.tahun }))}</span></div><div class="kj-ang"><b>${num(z.fosil_persen, 1)}<small>%</small></b><span>${esc(t("kj.ba.emb.fosil_z", { tahun: z.tahun }))}</span></div></div>
    ${kakiFakta(z.st, z.src, z.tgl)}<p class="kj-cat">${esc(t("kj.ba.emb.cat"))}</p>`;
}
function trenPln() {
  const th = S.E.tren_pln_nasional || []; if (!th.length) return "";
  return `<h4>${esc(t("kj.ba.pln.j"))}</h4><div class="kj-tabel" tabindex="0" role="region" aria-label="${esc(t("kj.ba.pln.j"))}"><table><thead><tr><th scope="col">${esc(t("kj.ba.pln.tahun"))}</th>${PLN.map((j) => `<th scope="col" class="kj-rk-n">${esc(t("kj.ba.pln." + j))}</th>`).join("")}<th scope="col">${esc(t("kj.ba.pln.sumber"))}</th></tr></thead><tbody>${th.map((y) => `<tr><th scope="row">${esc(y.tahun)}</th>${PLN.map((j) => `<td class="kj-rk-n">${y.persen[j] == null ? "-" : num(y.persen[j], 1)}</td>`).join("")}<td>${chipSrc(y.src)}</td></tr>`).join("")}</tbody></table></div>
    <p class="kj-cat">${esc(t("kj.ba.pln.cat", { cakupan: th.at(-1).cakupan }))}</p>${kakiFakta(th.at(-1).st, th.at(-1).src, th.at(-1).tgl)}`;
}

/* ---- peta ---- */
const lebar = () => { const p = ["==", ["get", "s"], S.sel || "-"]; return ["interpolate", ["linear"], ["zoom"], 3, ["case", p, 4, 1.4], 8, ["case", p, 7, 3]]; };
function warnaAbu() { return token("--line-ctl"); }
function pasangPeta(peta) {
  const d = S.geo; if (!d) return;
  if (!peta.getSource("kb")) peta.addSource("kb", { type: "geojson", data: d });
  const k = S.mode === "langsung" ? "l" : "h";
  const warna = (kk) => ["case", ["<", ["get", kk], 0], warnaAbu(), rampIntensitas(["get", kk])];
  peta.addLayer({ id: "kb-ln", type: "line", source: "kb", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": warna(k), "line-width": lebar(), "line-opacity": S.sel ? ["case", ["==", ["get", "s"], S.sel], 1, 0.3] : 1 } });
  peta.addLayer({ id: "kb-hit", type: "line", source: "kb", paint: { "line-color": token("--ink"), "line-opacity": 0, "line-width": 14 } });
}
function paint() {
  const peta = S.peta; if (!peta?.getLayer("kb-ln")) return;
  const k = S.mode === "langsung" ? "l" : "h";
  peta.setPaintProperty("kb-ln", "line-color", ["case", ["<", ["get", k], 0], warnaAbu(), rampIntensitas(["get", k])]);
  peta.setPaintProperty("kb-ln", "line-width", lebar());
  peta.setPaintProperty("kb-ln", "line-opacity", S.sel ? ["case", ["==", ["get", "s"], S.sel], 1, 0.3] : 1);
}
async function bangunPeta() {
  const el = $("#kb-kanvas"); if (!el) return;
  const [g, o, rsb] = await Promise.all([muatKJ("geo"), muatKJ("inti"), muatKJ("rs")]);
  if (!g || !o || !rsb) { el.innerHTML = `<p class="kj-cat">${esc(t("kj.ba.peta.kosong"))}</p>`; return; }
  const sisOf = new Map(rsb.rs.map((r) => [r.id, r.sis])), by = new Map(S.E.bauran.sistem.map((s) => [s.id, s]));
  for (const s of o.sis) S.bbox.set(s.id, s.bbox);
  S.geo = { type: "FeatureCollection", features: g.rs.map((r) => { const sid = sisOf.get(r.id) || "", s = by.get(sid), l = nilai0(s, "langsung"), h = nilai0(s, "daur_hidup"); return { type: "Feature", properties: { s: sid, l, h }, geometry: { type: "LineString", coordinates: r.c } }; }) };
  S.peta = await bukaPeta(el, (peta) => { pasangPeta(peta); }, { pusat: [113, -3.2], zoom: 4.2 });
  const peta = S.peta; if (!peta) { el.textContent = t("kj.ba.peta.gagal"); return; }
  const pop = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8, className: "rg3-pop" });
  peta.on("mousemove", "kb-hit", (e) => {
    const sid = e.features?.[0]?.properties?.s, s = by.get(sid); if (!s) { pop.remove(); return; }
    peta.getCanvas().style.cursor = "pointer";
    pop.setLngLat(e.lngLat).setHTML(`<div class="rg3-tipm"><b>${esc(s.nama)}</b><span><em>${esc(t("kj.ba.nas.int_" + S.mode))}</em><strong>${nilai(s) == null ? esc(t("kj.ba.tak")) : num(nilai(s)) + " g/kWh"}</strong></span></div>`).addTo(peta);
  });
  peta.on("mouseleave", "kb-hit", () => { peta.getCanvas().style.cursor = ""; pop.remove(); });
  peta.on("click", "kb-hit", (e) => { const sid = e.features?.[0]?.properties?.s; if (sid && by.has(sid)) pilih(sid); });
}
const nilai0 = (s, k) => (s && !s.tidak_dihitung && s[k] != null ? s[k] : -1);

/* ---- interaksi ---- */
function pilih(id) {
  S.sel = S.sel === id ? null : id;
  for (const b of akar.querySelectorAll(".kj-sis")) b.setAttribute("aria-pressed", String(b.dataset.sis === S.sel)); // chrome urgent
  paint();
  const b = S.sel && S.bbox.get(S.sel); if (b && S.peta) S.peta.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 40, maxZoom: 7, duration: 400 });
  nanti(() => { $("#kb-rinci").innerHTML = rincian(); $("#kb-tren").innerHTML = tren(); pasangGaya(akar); });
}
function ganti(m) {
  if (m === S.mode) return;
  S.mode = m;
  for (const b of akar.querySelectorAll("[data-mode]")) b.setAttribute("aria-pressed", String(b.dataset.mode === m)); // chrome urgent
  paint();
  nanti(() => { $("#kb-nas").innerHTML = batangPanel(); $("#kb-daftar").innerHTML = daftar(); $("#kb-rinci").innerHTML = rincian(); $("#kb-tren").innerHTML = tren(); pasangGaya(akar); });
}

export async function mulai(el) {
  akar = el;
  const E = await muatKJ("energi");
  if (!E?.bauran?.sistem?.length) { el.innerHTML = kosongTab("kj.ba.kosong"); return; }
  S.E = E;
  const tahun = E.meta?.tahun_data ?? E.nasional?.tahun;
  const sakelar = ["langsung", "daur"].map((m) => { const mm = m === "daur" ? "daur_hidup" : m; return `<button type="button" class="kj-mb" data-mode="${mm}" aria-pressed="${mm === S.mode}">${esc(t("kj.ba.mode." + m))}</button>`; }).join("");
  const isi = `<div class="kje-bar-atas"><div class="kj-mode" role="group" aria-label="${esc(t("kj.ba.mode.j"))}">${sakelar}</div>
      <p class="kj-kaki">${chipSt("hitung")}<span class="kj-tgl">${esc(t("kj.ba.tahunan", { tahun }))}</span><span class="kj-tgl">${esc(t("kj.per", { tgl: tanggal(E.meta?.tanggal) }))}</span></p></div>
    <div class="kje-en">
      <div class="kje-peta"><div id="kb-kanvas" class="kje-kanvas" role="application" aria-label="${esc(t("kj.ba.peta.aria"))}"></div>
        <div class="kje-skala" role="img" aria-label="${esc(t("kj.ba.skala.aria", { min: SKALA.min, maks: num(SKALA.maks) }))}"><span>${num(SKALA.min)}</span><i class="kje-grad"></i><span>${num(SKALA.maks)}+ g/kWh</span><em><i class="kje-sw kje-sw-abu"></i>${esc(t("kj.ba.tak"))}</em></div></div>
      <div class="kje-sisi">
        <section class="kje-blok"><h3 class="kje-j">${esc(t("kj.ba.indonesia"))}</h3><div id="kb-nas">${batangPanel()}</div>${legendaBbm()}</section>
        <section class="kje-blok"><h3 class="kje-j">${esc(t("kj.ba.daftar.j"))}</h3><p class="kj-cat">${esc(t("kj.ba.daftar.cat"))}</p><ul class="kje-daftar" id="kb-daftar">${daftar()}</ul></section>
      </div>
    </div>
    <section class="kje-blok" id="kb-rinci" aria-live="polite">${rincian()}</section>
    <section class="kje-blok"><h3 class="kje-j">${esc(t("kj.ba.tren.j"))}</h3><div id="kb-tren">${tren()}</div>${legendaBbm()}</section>
    <section class="kje-blok" id="kb-nasional">${trenNasional()}${trenPln()}</section>
    <p class="kje-menunggu-b">${chipSt("menunggu")}<span>${esc(t("kj.ba.perjam"))}</span></p>
    <p class="kj-cat">${esc(t("kj.ba.catatan"))}</p>${daftarCelah(E.meta?.celah)}`;
  el.innerHTML = ex({ id: "kb-ex", ikon: "karbon", topik: t("kj.ba.ey"), judulHtml: esc(t("kj.ba.j")), subHtml: esc(t("kj.ba.s", { tahun })), isiHtml: isi, kakiHtml: sumberBerkas(E.meta) });
  pasangGaya(el);
  akar.addEventListener("click", (e) => {
    const m = e.target.closest("[data-mode]"); if (m) { ganti(m.dataset.mode); return; }
    const b = e.target.closest("[data-sis]"); if (b) pilih(b.dataset.sis);
  });
  nanti(bangunPeta);
}
