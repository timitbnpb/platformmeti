/* /jaringan, tab Peta jaringan: peta penuh lebar (MapLibre) dengan panel lapis dan panel detail yang bisa digeser.
   Lapis: transmisi dan gardu OSM (geo/transmisi.json, geo/gardu.json), interkoneksi antar-pulau dan lintas negara (garis skematik, bukan trase).
   INP: nyala/mati lapis hanya setLayoutProperty; sorot hover mengubah satu properti cat; berkas geo berat dimuat lewat nanti(). */
import { D, ex, t, esc, ikon, num, bendera, L, chipStatus, buktiSumber, catatan, daftarCelah, kosongTab, token, gelap, sumberBerkas } from "/jr_umum.js";
import { fiturSkematik, kelasKv } from "/jaringan_hitung.js";
import { nanti } from "/inti/umum.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { geserPanel } from "/inti/panel_geser.js";

let peta = null, ketemu = null;
const LAPIS = [
  { k: "transmisi", ik: "menara", lapisan: ["jr-tr"] },
  { k: "gardu", ik: "petir", lapisan: ["jr-gi"] },
  { k: "antarpulau", ik: "sambung", lapisan: ["jr-rc"] },
  { k: "lintas", ik: "asean", lapisan: ["jr-ln"] },
];
const SEMUA = () => [...(D.m.antar_pulau || []), ...(D.m.lintas_negara?.negara || [])];
const warnaStatus = () => ({ beroperasi: token("--ok"), konstruksi: token("--info"), "pra-konstruksi": token("--info"), rencana: token("--warn"), studi: token("--warn"), kajian: token("--warn"), "kajian-lanjut": token("--warn"), "tidak-layak": token("--bad") });
const exprStatus = () => ["match", ["get", "status"], ...Object.entries(warnaStatus()).flat(), token("--ink2")];

function detail(id) {
  const x = SEMUA().find((r) => r.id === id), el = document.getElementById("jr-pn-isi");
  if (!x || !el) return;
  const neg = x.negara ? `<span class="rg3-neg">${bendera(x.negara, 20)}<b>${esc(L(x.mitra))}</b></span>` : "";
  el.innerHTML = `<h3 class="jr-pn-j">${esc(L(x.nama))}</h3>${neg}<p class="jr-pn-m">${chipStatus(x.status)}${x.tegangan_kv ? `<span class="rg3-lain">${esc(num(x.tegangan_kv))} kV</span>` : ""}${x.kapasitas_mw ? `<span class="rg3-lain">${esc(num(x.kapasitas_mw))} MW</span>` : ""}${(x.cod || x.tahun) ? `<span class="rg3-lain">${esc(t("jr.cod"))} ${esc(String(x.cod || x.tahun))}</span>` : ""}</p><p class="jr-pn-t">${esc(L(x.ket))}</p><p class="jr-pn-b">${buktiSumber(x.bukti, x.sumber_id)}</p>`;
  document.getElementById("jr-pn").open = true;
}
function sorot(id) {
  if (!peta?.getLayer("jr-rc")) return;
  const op = id ? ["case", ["==", ["get", "id"], id], 1, 0.28] : 0.9;
  for (const l of ["jr-rc", "jr-ln"]) peta.setPaintProperty(l, "line-opacity", op);
}

function pasangGeo(skem) {
  const warna = warnaStatus();
  peta.addSource("jr-skem", { type: "geojson", data: skem });
  for (const [idL, jenis, lebar] of [["jr-rc", "antar-pulau", 2.5], ["jr-ln", "lintas", 3.5]])
    peta.addLayer({ id: idL, type: "line", source: "jr-skem", filter: ["==", ["get", "jenis"], jenis], layout: { "line-cap": "round" }, paint: { "line-color": exprStatus(), "line-width": lebar, "line-dasharray": [2, 1.6], "line-opacity": 0.9 } });
  void warna;
  const pop = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10, className: "rg3-pop", maxWidth: "300px" });
  for (const idL of ["jr-rc", "jr-ln"]) {
    peta.on("mousemove", idL, (e) => {
      const f = e.features?.[0]; if (!f) return;
      const x = SEMUA().find((r) => r.id === f.properties.id); if (!x) return;
      peta.getCanvas().style.cursor = "pointer"; sorot(x.id);
      pop.setLngLat(e.lngLat).setHTML(`<div class="rg3-tipm"><b>${x.negara ? bendera(x.negara, 20) : ""}${esc(L(x.nama))}</b><span><em>${esc(t("jr.status"))}</em><strong>${esc(t("jr.st." + x.status))}</strong></span>${x.kapasitas_mw ? `<span><em>${esc(t("jr.kap"))}</em><strong>${esc(num(x.kapasitas_mw))} MW</strong></span>` : ""}<small>${esc(t("jr.peta.skematik_pendek"))}</small></div>`).addTo(peta);
    });
    peta.on("mouseleave", idL, () => { peta.getCanvas().style.cursor = ""; pop.remove(); sorot(null); });
    peta.on("click", idL, (e) => { const id = e.features?.[0]?.properties?.id; if (id) detail(id); });
  }
  /* bendera negara mitra di ujung garis lintas negara */
  for (const x of D.m.lintas_negara?.negara || []) {
    if (!x.garis) continue;
    const m = document.createElement("button"); m.type = "button"; m.className = "jr-bd"; m.setAttribute("aria-label", `${L(x.mitra)}: ${L(x.nama)}`);
    m.innerHTML = `<img src="/img/bendera/${esc(x.negara)}.svg" alt="" width="28" height="28" data-galat="hapus">`;
    m.addEventListener("click", () => detail(x.id));
    new maplibregl.Marker({ element: m }).setLngLat(x.garis.at(-1)).addTo(peta);
  }
}

async function pasangOsm() {
  const [tr, gi] = await Promise.all(["/geo/transmisi.json", "/geo/gardu.json"].map((u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null)));
  if (!peta) return;
  if (tr?.garis) {
    peta.addSource("jr-tr", { type: "geojson", data: { type: "FeatureCollection", features: tr.garis.filter((g) => g.koordinat?.length > 1).map((g) => ({ type: "Feature", properties: { kv: g.teg_kv || 0, k: kelasKv(g.teg_kv || 0), n: g.nama || "" }, geometry: { type: "LineString", coordinates: g.koordinat } })) } });
    peta.addLayer({ id: "jr-tr", type: "line", source: "jr-tr", paint: { "line-color": ["match", ["get", "k"], "500", token("--bad"), "275", token("--warn"), "150", token("--data1"), token("--ink2")], "line-width": ["match", ["get", "k"], "500", 2.6, "275", 2.2, 1.4], "line-opacity": 0.8 } }, "jr-rc");
  }
  if (gi?.gardu) {
    peta.addSource("jr-gi", { type: "geojson", data: { type: "FeatureCollection", features: gi.gardu.filter((g) => g.lat != null && g.lng != null).map((g) => ({ type: "Feature", properties: { n: g.nama || "", kv: g.teg_kv || 0 }, geometry: { type: "Point", coordinates: [g.lng, g.lat] } })) } });
    peta.addLayer({ id: "jr-gi", type: "circle", source: "jr-gi", minzoom: 6, paint: { "circle-radius": 3.5, "circle-color": token("--card"), "circle-stroke-color": token("--ink"), "circle-stroke-width": 1.5 } }, "jr-rc");
  }
  const pop = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8, className: "rg3-pop" });
  for (const [idL, ket] of [["jr-tr", "jr.transmisi"], ["jr-gi", "jr.gardu"]]) {
    if (!peta.getLayer(idL)) continue;
    peta.on("mousemove", idL, (e) => { const p = e.features?.[0]?.properties; if (!p) return; peta.getCanvas().style.cursor = "pointer"; pop.setLngLat(e.lngLat).setHTML(`<div class="rg3-tipm"><b>${esc(p.n || t(ket))}</b><span><em>${esc(t(ket))}</em><strong>${p.kv ? esc(num(p.kv)) + " kV" : "-"}</strong></span><small>OpenStreetMap</small></div>`).addTo(peta); });
    peta.on("mouseleave", idL, () => { peta.getCanvas().style.cursor = ""; pop.remove(); });
  }
  const sudahMati = [...document.querySelectorAll("#jr-lapis [data-lp][aria-pressed=false]")].map((b) => b.dataset.lp);
  for (const k of sudahMati) nyala(k, false);
}
function nyala(k, on) {
  const l = LAPIS.find((x) => x.k === k);
  for (const id of l?.lapisan || []) if (peta?.getLayer(id)) peta.setLayoutProperty(id, "visibility", on ? "visible" : "none");
  if (k === "lintas") for (const b of document.querySelectorAll(".jr-bd")) b.hidden = !on;
}

async function bangunPeta() {
  const el = document.getElementById("jr-kanvas"); if (!el) return;
  try { await muatMapLibre(); } catch { el.textContent = t("jr.peta.gagal"); return; }
  peta = new maplibregl.Map({ container: el, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), center: [108, -2.2], zoom: 4.1, minZoom: 3, maxZoom: 11, dragRotate: false, pitchWithRotate: false, attributionControl: false });
  peta.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: "© OpenStreetMap (ODbL)" }), "bottom-right");
  peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-left");
  peta.on("load", () => { pasangGeo(fiturSkematik(D.m)); nanti(pasangOsm); });
}

export function mulai(el) {
  if (!D.m) { el.innerHTML = kosongTab("jr.kosong_data"); return; }
  const n = { antarpulau: (D.m.antar_pulau || []).filter((x) => x.garis).length, lintas: (D.m.lintas_negara?.negara || []).length };
  const tombol = LAPIS.map((l) => `<li><button type="button" class="pt2-leg" data-lp="${l.k}" aria-pressed="true">${ikon(l.ik, 16)}<span>${esc(t("jr.lapis." + l.k))}</span>${l.k === "antarpulau" || l.k === "lintas" ? `<b>${esc(num(n[l.k]))}</b>` : ""}</button></li>`).join("");
  const leg = (kelas, teks) => `<li class="jr-leg"><i class="jr-sw ${kelas}" aria-hidden="true"></i><span>${esc(teks)}</span></li>`;
  const isi = `<div class="pt2-peta jr-petawrap">
    <div id="jr-kanvas" class="pt2-kanvas" role="application" aria-label="${esc(t("jr.peta.label"))}"></div>
    <details class="pt2-lapis jr-lapis" id="jr-lapis" ${innerWidth >= 1280 ? "open" : ""}><summary><span>${esc(t("jr.peta.lapis"))}</span></summary>
      <div class="pt2-lapis-isi"><ul class="pt2-leg-daftar">${tombol}</ul>
      <p class="pt2-leg-j">${esc(t("jr.peta.kv"))}</p><ul class="pt2-leg-daftar">${leg("jr-sw-500", "500 kV")}${leg("jr-sw-275", "275 kV")}${leg("jr-sw-150", "150 kV")}${leg("jr-sw-lain", t("jr.peta.lain"))}</ul>
      <p class="pt2-leg-j">${esc(t("jr.peta.status"))}</p><ul class="pt2-leg-daftar">${["beroperasi", "konstruksi", "rencana", "kajian"].map((s) => `<li class="jr-leg">${chipStatus(s)}</li>`).join("")}</ul>
      <p class="pt2-attr">${esc(t("jr.peta.skematik"))}</p></div></details>
    <details class="pt2-panel jr-panel" id="jr-pn" ${innerWidth >= 1280 ? "open" : ""}><summary><span>${esc(t("jr.peta.panel"))}</span></summary>
      <div class="pt2-panel-isi" id="jr-pn-isi" aria-live="polite"><p class="jr-pn-t">${esc(t("jr.peta.pilih"))}</p></div></details>
  </div>`;
  el.innerHTML = ex({ id: "jr-peta-ex", ikon: "peta", topik: t("jr.peta.ey"), judulHtml: esc(t("jr.peta.j")), subHtml: esc(t("jr.peta.s")), isiHtml: `${isi}${catatan("jr.peta.n")}${daftarCelah(D.m.meta?.celah?.slice(0, 2))}`, kakiHtml: sumberBerkas(D.m) });
  document.getElementById("jr-lapis").addEventListener("click", (e) => {
    const b = e.target.closest("[data-lp]"); if (!b) return;
    const on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", String(on)); nyala(b.dataset.lp, on);
  });
  if (innerWidth >= 1000) { geserPanel(document.getElementById("jr-lapis"), { kunci: "lapis" }); geserPanel(document.getElementById("jr-pn"), { kunci: "panel" }); }
  const q = new URLSearchParams(location.search).get("ruas");
  nanti(async () => { await bangunPeta(); if (q) detail(q); });
}
void ketemu;
