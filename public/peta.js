/* /peta: peta nasional terpadu. Satu peta MapLibre, lapisan dinyalakan dari panel geser (inti/panel_geser.js), dimuat malas saat dinyalakan.
   Indeks lapisan = /data/peta_lapisan.json; adapter, legenda, dan pop-up = peta_lapis.js. Keadaan (lapisan, saringan, tampilan) ada di URL.
   INP: klik lapisan menyalakan chrome seketika, muat data + gambar peta menyusul lewat nanti(). */
import { t, ada } from "/i18n.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { esc, nanti, ikon, hantuHtml, galatHtml, debounce } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { exHtml, sumberHtml, cariHtml, pilihHtml, hapusHtml } from "/inti/komponen.js";
import { hlHtml, kabar } from "/inti/aksi_ex.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas, BATAS_ID, geoProvinsi } from "/inti/peta_indonesia.js";
import { geserPanel } from "/inti/panel_geser.js";
import { IKON_TEK } from "/inti/ikon_tek.js";
import { PROV } from "/inti/prov_singkat.js";
import { N, ST, TEK, WARNA, RAMP, paletDari, labTek, adapterDari, kosongKoro, teksNilai, popupProvinsiTanpaNilai } from "/peta_lapis.js";

const $ = (id) => document.getElementById(id);
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme:dark)").matches);
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
const HP = () => innerWidth < 700;
const S = { on: new Set(), tek: "", st: "", q: "" };
const L = new Map(); // id -> { def, status: idle|memuat|siap|galat|segera, rec, fc, koro, semua }
let IDX, peta = null, siap = false, popup = null, ctlAttr = null;
const GAMBAR = new Map();
const IKON_ADA = new Set(Object.keys(IKON_TEK).filter((k) => TEK.includes(k)));

await mulaiHalaman();
const isi = $("pnIsi");
isi.innerHTML = hantuHtml(6);
try {
  IDX = await fetch("/data/peta_lapisan.json", { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error("indeks"); return r.json(); });
} catch (e) {
  isi.innerHTML = galatHtml("jaringan");
  isi.querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw e;
}
for (const def of IDX.lapisan) L.set(def.id, { def, status: def.berkas ? "idle" : "segera" });
/* berkas yang diharapkan muncul belakangan: bila belum ada, lapisan tampil redup "segera" (tanpa galat) */
await Promise.all(IDX.lapisan.filter((d) => d.menanti && d.berkas).map((d) => fetch(d.berkas, { method: "HEAD", credentials: "same-origin" })
  .then((r) => { if (!r.ok || !/json/.test(r.headers.get("content-type") || "")) L.get(d.id).status = "segera"; })
  .catch(() => { L.get(d.id).status = "segera"; })));
const ADA = () => [...L.values()].filter((l) => l.status !== "segera");
let view = null;
{
  const p = new URLSearchParams(location.search);
  const awal = p.has("l") ? p.get("l").split(",") : IDX.lapisan.filter((d) => d.nyala).map((d) => d.id);
  for (const id of awal) if (L.has(id) && L.get(id).status !== "segera") S.on.add(id);
  if (TEK.includes(p.get("tek"))) S.tek = p.get("tek");
  if (ST.includes(p.get("st"))) S.st = p.get("st");
  const v = (p.get("v") || "").split(",").map(Number);
  if (v.length === 3 && v.every(Number.isFinite) && Math.abs(v[0]) <= 180 && Math.abs(v[1]) <= 90) view = v;
}
/* koroplet saling meniadakan: hanya satu yang aktif */
{ const kor = [...S.on].filter((id) => L.get(id).def.jenis === "koroplet"); for (const id of kor.slice(0, -1)) S.on.delete(id); }

/* ---------- data per lapisan ---------- */
async function muat(id) {
  const l = L.get(id);
  if (!l || l.status === "segera" || l.status === "siap" || l.status === "memuat") return;
  l.status = "memuat"; gambarPanel();
  try {
    const d = await fetch(l.def.berkas, { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error("muat"); return r.json(); });
    const ad = adapterDari(l.def);
    if (l.def.jenis === "titik") { l.rec = ad.baca(d, l.def); l.rec.forEach((r, i) => { r.i = i; }); l.semua = ad.semua ? ad.semua(d) : null; l.ad = ad; if (!l.rec.length) throw new Error("kosong"); }
    else if (l.def.jenis === "garis") { l.fc = ad.baca(d, l.def); l.ad = ad; if (!l.fc.features.length) throw new Error("kosong"); }
    else { l.koro = ad.baca(d, l.def); l.ad = ad; if (kosongKoro(l.koro)) throw new Error("kosong"); }
    l.status = "siap";
  } catch (e) {
    l.status = e.message === "kosong" && l.def.menanti ? "segera" : "galat";
    S.on.delete(id);
  }
  gambarPanel(); gambarKepala(); simpanUrl();
}
const lolos = (r) => (!S.tek || r.tek === S.tek) && (!S.st || r.st === S.st);
const titikFitur = (l) => ({ type: "FeatureCollection", features: l.rec.filter((r) => l.ad.saring === false || lolos(r)).map((r) => ({ type: "Feature", geometry: { type: "Point", coordinates: [r.px ?? r.lng, r.py ?? r.lat] }, properties: { i: r.i, w: r.w, mw: r.mw || 0, ik: IKON_ADA.has(r.tek) ? "pn-" + r.tek : "" } })) });
const jumlahTitik = (l) => titikFitur(l).features.length;
const titikTerpadu = () => { const l = L.get("proyek_terpadu"); return l && l.rec ? jumlahTitik(l) : 0; };

/* ---------- peta ---------- */
const lid = (id) => ({ src: "s-" + id, cl: id + "-c", n: id + "-n", t: id + "-t", ik: id + "-i", g: id + "-g" });
function gambarIkon() {
  return Promise.all([...IKON_ADA].map((k) => new Promise((ok) => {
    const im = new Image(); im.onload = () => { GAMBAR.set("pn-" + k, im); ok(); }; im.onerror = ok;
    im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(IKON_TEK[k].replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" ').replace(/currentColor/g, "#fff"));
  })));
}
const padPeta = () => {
  const box = $("pnPeta").getBoundingClientRect(), p = { top: 16, bottom: 16, left: 12, right: 12 }, el = $("pnLapis");
  if (HP()) { p.bottom = el.open ? Math.min(el.offsetHeight, box.height * 0.55) + 16 : 60; return p; }
  const r = el.getBoundingClientRect(), tengah = r.left + r.width / 2 - box.left;
  if (tengah < box.width / 2) p.left = Math.max(p.left, r.right - box.left + 16); else p.right = Math.max(p.right, box.right - r.left + 16);
  return p;
};
function terapkan(id) {
  const l = L.get(id);
  if (!peta || !siap || !l) return;
  if (l.status !== "siap") { muat(id).then(() => l.status === "siap" && S.on.has(id) && terapkan(id)); return; }
  const k = lid(id);
  if (l.def.jenis === "titik") {
    const fc = titikFitur(l);
    if (peta.getSource(k.src)) { peta.getSource(k.src).setData(fc); return; }
    peta.addSource(k.src, { type: "geojson", data: fc, cluster: true, clusterRadius: 38, clusterMaxZoom: 6 });
    const warnaTitik = ["match", ["get", "w"], ...Object.entries(WARNA).flatMap(([a, v]) => [a, warna(v)]), warna("--ink2")];
    const sqrtMw = ["sqrt", ["max", ["coalesce", ["get", "mw"], 1], 1]];
    peta.addLayer({ id: k.cl, type: "circle", source: k.src, filter: ["has", "point_count"], paint: { "circle-color": warna("--brand2"), "circle-opacity": 0.88, "circle-radius": ["step", ["get", "point_count"], 13, 10, 17, 40, 22], "circle-stroke-color": warna("--card"), "circle-stroke-width": 2 } });
    peta.addLayer({ id: k.n, type: "symbol", source: k.src, filter: ["has", "point_count"], layout: { "text-field": "{point_count_abbreviated}", "text-font": ["Noto Sans Bold"], "text-size": 12, "text-allow-overlap": true }, paint: { "text-color": "#ffffff" } });
    const gede = l.def.adapter === "gardu";
    peta.addLayer({ id: k.t, type: "circle", source: k.src, filter: ["!", ["has", "point_count"]], paint: { "circle-color": warnaTitik, "circle-opacity": 0.92, "circle-radius": gede ? ["interpolate", ["linear"], ["zoom"], 5, 3, 10, 6] : ["interpolate", ["linear"], sqrtMw, 1, 8, 10, 10, 30, 14, 60, 19], "circle-stroke-color": warna("--card"), "circle-stroke-width": 1.5 } });
    if (!gede) peta.addLayer({ id: k.ik, type: "symbol", source: k.src, filter: ["all", ["!", ["has", "point_count"]], ["!=", ["get", "ik"], ""]], layout: { "icon-image": ["get", "ik"], "icon-size": ["interpolate", ["linear"], sqrtMw, 1, 0.38, 30, 0.5, 60, 0.62], "icon-allow-overlap": true, "icon-ignore-placement": true } });
  } else if (l.def.jenis === "garis") {
    if (peta.getSource(k.src)) return;
    peta.addSource(k.src, { type: "geojson", data: l.fc });
    peta.addLayer({ id: k.g, type: "line", source: k.src, layout: { "line-cap": "round" }, paint: {
      "line-color": ["step", ["get", "v"], warna("--info"), 275, warna("--warn"), 500, warna("--bad")],
      "line-width": ["interpolate", ["linear"], ["zoom"], 4, ["step", ["get", "v"], 0.7, 275, 1.1, 500, 1.6], 9, ["step", ["get", "v"], 1.4, 275, 2, 500, 3]], "line-opacity": 0.88 } }, "pn-a-ln");
  } else terapKoro(l);
}
async function terapKoro(l) {
  const g = await geoProvinsi();
  if (!g || !peta || !siap || !S.on.has(l.def.id)) return;
  const k = l.koro, [a, b] = RAMP[k.ramp].map(warna), mn = k.min, mx = k.max > k.min ? k.max : k.min + 1;
  const fc = { type: "FeatureCollection", features: g.features.map((f) => { const x = k.peta.get(String(f.properties.kode)), p = { kode: f.properties.kode }; if (x && Number.isFinite(x.v)) p.v = x.v; return { type: "Feature", geometry: f.geometry, properties: p }; }) };
  for (const i of ["koro-fill"]) if (peta.getLayer(i)) peta.removeLayer(i);
  if (peta.getSource("s-koro")) peta.getSource("s-koro").setData(fc); else peta.addSource("s-koro", { type: "geojson", data: fc });
  peta.addLayer({ id: "koro-fill", type: "fill", source: "s-koro", paint: { "fill-color": ["case", ["has", "v"], ["interpolate", ["linear"], ["get", "v"], mn, a, mx, b], warna("--line-cell")], "fill-opacity": 0.82 } }, "pn-a-koro");
}
function lepas(id) {
  const l = L.get(id), k = lid(id);
  if (!peta || !siap) return;
  if (l.def.jenis === "koroplet") { if (peta.getLayer("koro-fill")) peta.removeLayer("koro-fill"); if (peta.getSource("s-koro")) peta.removeSource("s-koro"); return; }
  for (const i of [k.ik, k.t, k.n, k.cl, k.g]) if (peta.getLayer(i)) peta.removeLayer(i);
  if (peta.getSource(k.src)) peta.removeSource(k.src);
}
function pasangSemua() {
  siap = true;
  const il = rapikanPeta(peta);
  for (const a of ["koro", "garis", "ln"]) peta.addLayer({ id: "pn-a-" + a, type: "background", paint: { "background-opacity": 0 } }, il);
  pasangBatas(peta, warna, il, "pn-a-garis");
  for (const [n, im] of GAMBAR) if (!peta.hasImage(n)) peta.addImage(n, im, { pixelRatio: 2 });
  for (const id of S.on) terapkan(id);
  atribusi();
}
function atribusi() {
  if (!peta) return;
  if (ctlAttr) peta.removeControl(ctlAttr);
  const a = [...new Set([...S.on].map((id) => "pn2.a." + (id === "gardu" ? "transmisi" : id)).filter(ada).map((k) => t(k)))];
  ctlAttr = new maplibregl.AttributionControl({ compact: true, customAttribution: [t("pn2.a.dasar"), ...a] });
  peta.addControl(ctlAttr, "bottom-right");
}
function lapisKlik() {
  const a = [];
  for (const id of S.on) { const l = L.get(id), k = lid(id); if (l.status !== "siap") continue; if (l.def.jenis === "titik") a.push(k.t, k.cl); else if (l.def.jenis === "garis") a.push(k.g); else a.push("koro-fill"); }
  return a.filter((i) => peta.getLayer(i));
}
function kena(pt) {
  const ids = lapisKlik();
  if (!ids.length) return null;
  const f = peta.queryRenderedFeatures([[pt.x - 5, pt.y - 5], [pt.x + 5, pt.y + 5]], { layers: ids });
  const bobot = (x) => (x.layer.id === "koro-fill" ? 2 : x.layer.id.endsWith("-g") ? 1 : 0);
  return f.sort((a, b) => bobot(a) - bobot(b))[0] || null;
}
const lapisDari = (f) => L.get(f.layer.id === "koro-fill" ? [...S.on].find((i) => L.get(i).def.jenis === "koroplet") : f.layer.id.slice(0, f.layer.id.lastIndexOf("-")));
function bukaPop(html, ll) {
  popup?.remove();
  popup = new maplibregl.Popup({ maxWidth: "340px", offset: 10, closeButton: true, focusAfterOpen: false, className: "pn-popup" }).setLngLat(ll).setHTML(html).addTo(peta);
}
function bukaFitur(f, ll) {
  const l = lapisDari(f);
  if (!l) return;
  if (f.layer.id === "koro-fill") { const kode = String(f.properties.kode); return bukaPop(l.ad.popup(kode, l.koro), ll); }
  if (l.def.jenis === "garis") return bukaPop(l.ad.popup(f.properties), ll);
  const r = l.rec[f.properties.i];
  if (r) bukaPop(l.ad.popup(r), [r.px ?? r.lng, r.py ?? r.lat]);
}
function tip(f, pt) {
  const el = $("pnTip"), l = f && lapisDari(f);
  if (!l || (popup && popup.isOpen()) || (f.properties.cluster_id != null)) { el.hidden = true; return; }
  let h;
  if (f.layer.id === "koro-fill") { const kode = String(f.properties.kode), x = l.koro.peta.get(kode); h = `<b>${esc(PROV[kode] ? PROV[kode][0] : kode)}</b><span>${esc(x && x.v != null ? teksNilai(l.koro, x.v) : t("pn2.tanpa_data"))}</span>`; }
  else if (l.def.jenis === "garis") h = l.ad.tip(f.properties);
  else { const r = l.rec[f.properties.i]; h = r ? l.ad.tip(r) : ""; }
  if (!h) { el.hidden = true; return; }
  el.innerHTML = h; el.hidden = false;
  const w = $("pnPeta").clientWidth, tw = el.offsetWidth, th = el.offsetHeight;
  el.style.left = Math.min(Math.max(pt.x + 14, 8), w - tw - 8) + "px";
  el.style.top = Math.max(8, pt.y - th - 14) + "px";
}
function bukaPeta() {
  Promise.all([muatMapLibre(), gambarIkon()]).then(() => {
    const opsi = { container: "pnPeta", style: gaya(), minZoom: 2, maxZoom: 13, dragRotate: false, pitchWithRotate: false, attributionControl: false };
    peta = new maplibregl.Map(view ? { ...opsi, center: [view[0], view[1]], zoom: view[2] } : { ...opsi, bounds: BATAS_ID, fitBoundsOptions: { padding: padPeta() } });
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    peta.on("style.load", pasangSemua);
    new ResizeObserver(() => peta && peta.resize()).observe($("pnPeta"));
    peta.once("idle", () => { peta.resize(); if (!view) peta.fitBounds(BATAS_ID, { padding: padPeta(), duration: 0 }); });
    peta.on("click", (e) => {
      const f = kena(e.point);
      if (!f) return;
      if (f.properties.cluster_id != null) {
        const l = lapisDari(f);
        peta.getSource(lid(l.def.id).src).getClusterExpansionZoom(f.properties.cluster_id).then((z) => peta.easeTo({ center: f.geometry.coordinates, zoom: z + 0.4 }));
        return;
      }
      bukaFitur(f, e.lngLat);
    });
    peta.on("mousemove", (e) => { const f = kena(e.point); peta.getCanvas().style.cursor = f ? "pointer" : ""; tip(f, e.point); });
    peta.on("mouseout", () => { $("pnTip").hidden = true; });
    peta.on("moveend", debounce(simpanUrl, 300));
    new MutationObserver(() => { siap = false; peta && peta.setStyle(gaya()); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }).catch(() => { $("pnPeta").innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("pn2.peta.galat"))}</p></div>`; });
}

/* ---------- URL ---------- */
function simpanUrl() {
  const p = new URLSearchParams();
  p.set("l", [...S.on].join(","));
  if (S.tek) p.set("tek", S.tek);
  if (S.st) p.set("st", S.st);
  if (peta && siap) { const c = peta.getCenter(); p.set("v", [c.lng.toFixed(2), c.lat.toFixed(2), peta.getZoom().toFixed(1)].join(",")); }
  try { history.replaceState(null, "", location.pathname + "?" + p.toString()); } catch (e) { /* sandbox */ }
}

/* ---------- panel lapisan dan legenda ---------- */
const HITUNG = (l) => (l.def.jenis === "titik" ? jumlahTitik(l) : l.def.jenis === "garis" ? l.fc.features.length : l.koro.peta.size);
function legenda(l) {
  const d = l.def, ket = `<p class="pn-leg-j">${esc(t("pn2.l." + d.id + ".d"))}</p>`;
  if (d.jenis === "titik") {
    const per = {}; for (const r of l.rec) if (l.ad.saring === false || lolos(r)) per[r.w] = (per[r.w] || 0) + 1;
    const palet = paletDari(l.ad.palet).filter(([k]) => per[k]);
    const peri = l.rec.some((r) => r.perkiraan) ? `<p class="pn-leg-j">${esc(t("pn2.perkiraan.ket"))}</p>` : "";
    return `${ket}<ul class="pn-leg-d">${palet.map(([k, lab]) => `<li><i class="pn-d pn-d-${esc(k)}" aria-hidden="true"></i><span>${esc(lab || t("pn2.l." + d.id))}</span><b>${esc(N(per[k]))}</b></li>`).join("")}</ul>${peri}`;
  }
  if (d.jenis === "garis") return `${ket}<ul class="pn-leg-d">${[["500", "bad"], ["275", "warn"], ["150", "info"]].map(([kv, c]) => `<li><i class="pn-g pn-g-${c}" aria-hidden="true"></i><span>${kv} kV${kv === "150" ? " " + esc(t("pn2.kv.ke_bawah")) : kv === "500" ? " " + esc(t("pn2.kv.ke_atas")) : ""}</span></li>`).join("")}</ul>`;
  const k = l.koro;
  return `${ket}<div class="pn-ramp pn-ramp-${k.ramp}" aria-hidden="true"></div><div class="pn-ramp-n"><b>${esc(N(k.min, k.des))}</b><span>${esc(k.satuan || "")}</span><b>${esc(N(k.max, k.des))}</b></div><ul class="pn-leg-d"><li><i class="pn-d pn-d-kosong" aria-hidden="true"></i><span>${esc(t("pn2.tanpa_data"))}</span></li></ul>`;
}
function baris(l) {
  const d = l.def, nama = t("pn2.l." + d.id), on = S.on.has(d.id) && l.status !== "segera";
  const lencana = l.status === "segera" ? `<span class="pn-pil">${esc(t("pn2.segera"))}</span>` : l.status === "galat" ? `<span class="pn-pil pn-pil-galat">${esc(t("pn2.galat"))}</span>` : l.status === "memuat" ? `<span class="pn-pil">${esc(t("jm.memuat"))}</span>` : l.status === "siap" && on ? `<b>${esc(N(HITUNG(l)))}</b>` : "";
  return `<li class="pn-item${l.status === "segera" ? " pn-segera" : ""}"><button type="button" class="pn-lap" data-l="${esc(d.id)}" aria-pressed="${on}"${l.status === "segera" ? ' disabled aria-disabled="true"' : ""}>${ikon(d.ikon, 16)}<span>${esc(nama)}</span>${lencana}</button>${on && l.status === "siap" ? `<div class="pn-leg">${legenda(l)}</div>` : ""}</li>`;
}
function gambarPanel() {
  if (!$("pnLapisIsi")) return;
  const fokus = document.activeElement?.dataset?.l;
  $("pnLapisIsi").innerHTML = IDX.kelompok.map((g) => `<section class="pn-grup"><h3>${ikon(g.ikon, 16)}<span>${esc(t("pn2.k." + g.id))}</span></h3><ul>${IDX.lapisan.filter((d) => d.kelompok === g.id).map((d) => baris(L.get(d.id))).join("")}</ul></section>`).join("")
    + `<p class="pn-attr">${esc(t("pn2.a.dasar"))}</p>`;
  const nOn = [...S.on].filter((id) => L.get(id).status !== "segera").length;
  $("pnLapisN").textContent = t("pn2.aktif", { n: N(nOn), m: N(ADA().length) });
  if (fokus) $("pnLapisIsi").querySelector(`[data-l="${CSS.escape(fokus)}"]`)?.focus({ preventScroll: true });
}
function gambarKepala() {
  const tp = L.get("proyek_terpadu"), rows = tp && tp.semua ? tp.semua.filter((r) => (!S.tek || r.tek === S.tek) && (!S.st || r.status === S.st)) : null;
  const nOn = [...S.on].filter((id) => L.get(id).status === "siap").length;
  khUbin("pnAngka", [
    { ikon: "proyek", nilai: rows ? N(rows.length) : "-", label: t("pn2.kh.proyek") },
    { ikon: "petir", nilai: rows ? N(rows.reduce((s, r) => s + (r.mw || 0), 0) / 1000, 1) : "-", satuan: "GW", label: t("pn2.kh.mw") },
    { ikon: "peta", nilai: N(nOn), satuan: t("pn2.kh.dari", { m: N(ADA().length) }), label: t("pn2.kh.lapisan") },
    { ikon: "wilayah", nilai: rows ? N(new Set(rows.map((r) => r.prov_kode).filter(Boolean)).size) : "-", satuan: t("pn2.kh.dari", { m: N(Object.keys(PROV).length) }), label: t("pn2.kh.provinsi") },
  ]);
  const j = $("pn-peta") && $("pn-peta").querySelector(".jm-ex-j");
  if (j) j.innerHTML = hlHtml("pn2.ex.peta.j", N(titikTerpadu()));
}

/* ---------- kerangka ---------- */
function kerangka() {
  const tp = L.get("proyek_terpadu"), rows = (tp && tp.semua) || [];
  const cTek = {}, cSt = {}; for (const r of rows) { cTek[r.tek] = (cTek[r.tek] || 0) + 1; cSt[r.status] = (cSt[r.status] || 0) + 1; }
  const saring = `<div class="jm-saring pn-saring" id="pnSaring" role="group" aria-label="${esc(t("pn2.saring"))}">
    <div class="pn-cari">${cariHtml({ id: "pnQ", label: t("pn2.cari"), placeholder: t("pn2.cari.ph") })}<ul class="pn-hasil" id="pnHasil" role="listbox" aria-label="${esc(t("pn2.cari"))}" hidden></ul></div>
    ${pilihHtml({ id: "pnTek", ikon: "jenis", label: t("pj.f.tek"), opsi: [["", t("pt2.semua.tek")], ...TEK.filter((k) => cTek[k]).map((k) => [k, labTek(k), IKON_ADA.has(k) && k !== "batubara" ? "tek:" + k : "", cTek[k]])], nilai: S.tek })}
    ${pilihHtml({ id: "pnSt", ikon: "status", label: t("pj.f.status"), opsi: [["", t("pt2.semua.st")], ...ST.filter((k) => cSt[k]).map((k) => [k, t("pj.st." + k), k === "ditunda" ? "jam" : "st:" + k, cSt[k]])], nilai: S.st })}
    ${hapusHtml({ id: "pnHapus", label: t("pt2.f.hapus") })}</div>`;
  const bagi = `<button type="button" class="jm-aksi-b" id="pnBagi" aria-label="${esc(t("pn2.bagi"))}" title="${esc(t("pn2.bagi"))}">${ikon("bagikan", 24)}</button>`;
  const sumber = sumberHtml(`${[...new Set(IDX.lapisan.map((d) => "pn2.a." + (d.id === "gardu" ? "transmisi" : d.id)).filter(ada))].map((k) => esc(t(k))).join("<br>")}<br>${esc(t("pn2.a.dasar"))}`);
  const kanvas = `<div class="pn-peta">
    <div id="pnPeta" class="pn-kanvas" role="application" aria-label="${esc(t("pn2.peta.label"))}"></div>
    <div id="pnTip" class="pn-tip" role="status" hidden></div>
    <details class="pn-lapis" id="pnLapis"${HP() ? "" : " open"}><summary id="pnLapisJ"><span>${esc(t("pn2.lapis"))}</span><b id="pnLapisN" class="pn-n"></b></summary><div class="pn-lapis-isi" id="pnLapisIsi"></div></details>
  </div>`;
  isi.innerHTML = exHtml({ id: "pn-peta", ikon: "peta", topik: t("pn2.ex.peta"), judulHtml: hlHtml("pn2.ex.peta.j", N(titikTerpadu())), subHtml: esc(t("pn2.ex.peta.s")), aksiHtml: `<span class="jm-aksi">${bagi}</span>${sumber}`, isiHtml: saring + kanvas, kelas: "pn-ex" });
  import("/inti/pilih.js").then((m) => m.pasangPilih()).catch(() => {});
}

/* ---------- cari lokasi atau proyek ---------- */
let KOTAK = null;
async function kotakProv() {
  if (KOTAK) return KOTAK;
  const g = await geoProvinsi();
  KOTAK = new Map();
  for (const f of (g && g.features) || []) {
    let x0 = 999, y0 = 999, x1 = -999, y1 = -999;
    const jalan = (a) => { if (typeof a[0] === "number") { x0 = Math.min(x0, a[0]); x1 = Math.max(x1, a[0]); y0 = Math.min(y0, a[1]); y1 = Math.max(y1, a[1]); } else a.forEach(jalan); };
    jalan(f.geometry.coordinates);
    KOTAK.set(String(f.properties.kode), [[x0, y0], [x1, y1]]);
  }
  return KOTAK;
}
function cari(q) {
  const s = q.trim().toLowerCase(), el = $("pnHasil");
  if (s.length < 2) { el.hidden = true; return; }
  const urut = (a) => a.sort((x, y) => (x.nama.toLowerCase().startsWith(s) ? 0 : 1) - (y.nama.toLowerCase().startsWith(s) ? 0 : 1));
  const prov = urut(Object.entries(PROV).map(([k, v]) => ({ jenis: "p", k, nama: v[0] })).filter((x) => x.nama.toLowerCase().includes(s))).slice(0, 3);
  const proy = [];
  for (const [id, l] of L) if (l.rec && l.def.jenis === "titik" && l.ad.saring !== false) for (const r of l.rec) if (r.nama && r.nama.toLowerCase().includes(s) && !proy.some((x) => x.nama === r.nama)) proy.push({ jenis: "t", id, i: r.i, nama: r.nama, sub: [labTek(r.tek), r.prov].filter(Boolean).join(", ") });
  const hasil = [...prov, ...urut(proy).slice(0, 7)];
  el.innerHTML = hasil.length ? hasil.map((h, n) => `<li role="option"><button type="button" class="pn-h" data-h="${n}">${h.jenis === "p" ? `<img class="pn-lb" src="/img/provinsi/${esc(h.k)}.png" width="22" height="22" alt="" loading="lazy" data-galat="hapus">` : ikon("lokasi", 18)}<span><b>${esc(h.nama)}</b>${h.sub ? `<small>${esc(h.sub)}</small>` : `<small>${esc(t("pn2.provinsi"))}</small>`}</span></button></li>`).join("") : `<li class="pn-h-kosong">${esc(t("jm.kosong.cocok"))}</li>`;
  el.hidden = false; el._hasil = hasil;
}
async function pilihHasil(h) {
  $("pnHasil").hidden = true;
  if (!peta) return;
  if (h.jenis === "p") {
    const b = (await kotakProv()).get(h.k);
    if (!b) return;
    peta.fitBounds(b, { padding: padPeta(), maxZoom: 7, duration: 700 });
    const l = [...S.on].map((id) => L.get(id)).find((x) => x.def.jenis === "koroplet" && x.status === "siap");
    bukaPop(l ? l.ad.popup(h.k, l.koro) : popupProvinsiTanpaNilai(h.k), [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2]);
    return;
  }
  const r = L.get(h.id).rec[h.i];
  if (!S.on.has(h.id)) await aktifkan(h.id, true);
  if (S.tek && r.tek !== S.tek) S.tek = ""; if (S.st && r.st !== S.st) S.st = "";
  gambarSaringan();
  peta.flyTo({ center: [r.px ?? r.lng, r.py ?? r.lat], zoom: Math.max(peta.getZoom(), 8.5), padding: padPeta(), duration: 700 });
  peta.once("moveend", () => bukaPop(L.get(h.id).ad.popup(r), [r.px ?? r.lng, r.py ?? r.lat]));
}

/* ---------- peristiwa ---------- */
async function aktifkan(id, nyala) {
  const l = L.get(id);
  if (!l || l.status === "segera") return;
  if (nyala) {
    if (l.def.jenis === "koroplet") for (const o of [...S.on]) if (o !== id && L.get(o).def.jenis === "koroplet") { S.on.delete(o); lepas(o); }
    S.on.add(id);
    if (l.status === "galat") l.status = "idle";
    await muat(id);
    if (l.status === "siap") terapkan(id);
  } else { S.on.delete(id); lepas(id); popup?.remove(); }
  gambarPanel(); gambarKepala(); atribusi(); simpanUrl();
}
function gambarSaringan() {
  $("pnHapus").hidden = !(S.tek || S.st);
  $("pnTek").value = S.tek; $("pnSt").value = S.st;
  for (const id of S.on) { const l = L.get(id); if (l.status === "siap" && l.def.jenis === "titik") terapkan(id); }
  gambarPanel(); gambarKepala(); simpanUrl();
}
function pasangEvent() {
  const seg = (fn) => { fn(); nanti(gambarSaringan); };
  $("pnTek").addEventListener("change", (e) => seg(() => { S.tek = e.target.value; }));
  $("pnSt").addEventListener("change", (e) => seg(() => { S.st = e.target.value; }));
  $("pnHapus").addEventListener("click", () => seg(() => { S.tek = S.st = ""; }));
  const q = $("pnQ"), cariTunda = debounce(() => cari(q.value), 120);
  q.addEventListener("input", cariTunda);
  q.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $("pnHasil").hidden = true;
    if (e.key === "Enter") { const h = ($("pnHasil")._hasil || [])[0]; if (h) pilihHasil(h); }
  });
  $("pnHasil").addEventListener("click", (e) => { const b = e.target.closest("[data-h]"); if (b) pilihHasil($("pnHasil")._hasil[+b.dataset.h]); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".pn-cari")) $("pnHasil").hidden = true; });
  $("pnLapisIsi").addEventListener("click", (e) => {
    const b = e.target.closest("[data-l]");
    if (!b || b.disabled) return;
    const id = b.dataset.l, nyala = !S.on.has(id);
    b.setAttribute("aria-pressed", String(nyala));   // chrome seketika; muat + gambar menyusul
    nanti(() => aktifkan(id, nyala));
  });
  $("pnBagi").addEventListener("click", async () => {
    simpanUrl();
    try { await navigator.clipboard.writeText(location.href); kabar(t("pn2.disalin")); } catch (e) { kabar(t("aksi.gagal")); }
  });
  $("pnLapis").addEventListener("toggle", () => { if (peta) peta.easeTo({ padding: padPeta(), duration: 0 }); });
}
function pasangPanel() { if (!HP()) geserPanel($("pnLapis"), { kunci: "lapis" }); }

function mulai() {
  kerangka();
  pasangEvent();
  pasangPanel();
  gambarPanel();
  gambarKepala();
  bukaPeta();
}
/* terpadu selalu dimuat: kepala, saringan, dan pencarian bergantung padanya, walau lapisannya dimatikan */
await Promise.all([muat("proyek_terpadu"), ...[...S.on].map(muat)]);
mulai();
document.addEventListener("jm:bahasa", () => { if (peta) { peta.remove(); peta = null; siap = false; ctlAttr = null; popup = null; } mulai(); });
