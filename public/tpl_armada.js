/* /transisi-pltu, tab Armada PLTU: peta (MapLibre, panel penuh), umur armada, pemilik berlogo, captive lawan grid, tabel 118 pembangkit (pltu.json). INP: peta dimuat setelah nanti(). */
import { B, t, ex, num, esc, ikon, bukti, kakiSumber, tabel, batangSvg, kolomSvg, tipHtml, legendaHtml, siapTautan, naikkan, kosongTab, catatan, orgSel, orgLogo, tautProvinsi, pilJenis, chip } from "/tpl_umum.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas, BATAS_ID } from "/inti/peta_indonesia.js";

const KU = ["u0", "u10", "u20", "u30", "tak-diketahui"];
const KELAS = { u0: "a", u10: "b", u20: "c", u30: "d", "tak-diketahui": "x" };
const baris = () => (B.pltu?.baris || []).filter((b) => b.st === "operasi" && b.mw_operasi > 0);
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
const WARNA = { u0: "--ok", u10: "--info", u20: "--warn", u30: "--bad", "tak-diketahui": "--ink2" };
let peta = null, siapPeta = false;
function fitur() {
  return { type: "FeatureCollection", features: baris().map((b) => ({ type: "Feature", geometry: { type: "Point", coordinates: [b.lng, b.lat] }, properties: { id: b.id, mw: b.mw_operasi, ku: b.ku } })) };
}
function lapis() {
  rapikanPeta(peta);
  peta.addSource("pl", { type: "geojson", data: fitur() });
  const ms = ["match", ["get", "ku"]]; for (const [k, v] of Object.entries(WARNA)) ms.push(k, warna(v)); ms.push(warna("--ink2"));
  peta.addLayer({ id: "pl", type: "circle", source: "pl", paint: { "circle-color": ms, "circle-radius": ["interpolate", ["linear"], ["sqrt", ["get", "mw"]], 10, 4, 40, 8, 80, 16, 150, 26], "circle-opacity": 0.8, "circle-stroke-color": warna("--card"), "circle-stroke-width": 1.5 } });
  pasangBatas(peta, warna, undefined, "pl");
  siapPeta = true;
}
function tip(id, pt) {
  const b = baris().find((x) => x.id === id), el = document.getElementById("tpl-tip"), w = document.getElementById("tpl-kanvas"); if (!b || !el) return;
  el.innerHTML = `<strong>${esc(b.nama)}</strong><small>${esc(b.kab || "")}</small><ul><li><span>MW</span><b>${num(b.mw_operasi, 0)}</b></li><li><span>${esc(t("tpl.ar.umur"))}</span><b>${b.umur_maks ?? "-"}</b></li><li><span>${esc(t("tpl.ar.emisi"))}</span><b>${b.emisi_ct_t ? num(b.emisi_ct_t / 1e6, 1) + " Mt" : "-"}</b></li></ul><p>${esc(b.captive ? t("tpl.ar.captive") : t("tpl.ar.grid"))}</p>`;
  el.hidden = false;
  el.style.left = Math.max(8, Math.min(w.clientWidth - el.offsetWidth - 8, pt.x + 16)) + "px"; el.style.top = Math.max(8, Math.min(w.clientHeight - el.offsetHeight - 8, pt.y + 16)) + "px";
}
function bukaPeta() {
  muatMapLibre().then(() => {
    peta = new maplibregl.Map({ container: "tpl-kanvas", style: gaya(), bounds: BATAS_ID, fitBoundsOptions: { padding: 16 }, minZoom: 2, maxZoom: 11, dragRotate: false, pitchWithRotate: false, attributionControl: false });
    peta.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    peta.on("style.load", () => { siapPeta = false; lapis(); });
    new ResizeObserver(() => peta.resize()).observe(document.getElementById("tpl-kanvas"));
    peta.on("mousemove", "pl", (e) => { peta.getCanvas().style.cursor = "pointer"; tip(e.features[0].properties.id, e.point); });
    peta.on("mouseleave", "pl", () => { peta.getCanvas().style.cursor = ""; document.getElementById("tpl-tip").hidden = true; });
    new MutationObserver(() => { siapPeta = false; peta.setStyle(gaya()); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }).catch(() => { document.getElementById("tpl-kanvas").innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("tpl.ar.peta_galat"))}</p></div>`; });
}
function umur() {
  const g = document.getElementById("tpl-a-umur"); if (!g) return;
  const sum = Object.fromEntries(KU.map((k) => [k, 0]));
  for (const u of B.pltu.unit) if (u.st === "operasi") sum[u.ku] = (sum[u.ku] || 0) + u.mw;
  document.getElementById("tpl-a-umur-l").innerHTML = legendaHtml(KU.map((k) => ({ kelas: "tpl-u-" + KELAS[k], label: t("tpl.ku." + k) })));
  g.innerHTML = kolomSvg({ el: g, satuan: "GW", label: t("tpl.ar.j.umur"), seri: [{ k: "v", kelas: "tpl-s-mw" }],
    kategori: KU.map((k) => ({ label: t("tpl.ku." + k), nilai: { v: sum[k] / 1000 }, tip: t("tpl.ku." + k), th: tipHtml(t("tpl.ku." + k), [["MW", num(sum[k], 0)]]) })) });
}
function pemilik() {
  const g = document.getElementById("tpl-a-pem"); if (!g) return;
  const m = new Map();
  for (const b of baris()) { const k = b.pemilik?.org_id || b.pemilik?.nama || "-"; const e = m.get(k) || { nama: b.pemilik?.nama || "-", org: b.pemilik?.org_id, mw: 0, n: 0 }; e.mw += b.mw_operasi; e.n++; m.set(k, e); }
  const top = [...m.values()].sort((a, c) => c.mw - a.mw).slice(0, 10);
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: "MW", label: t("tpl.ar.j.pem"), seri: [{ k: "v", kelas: "tpl-s-mw" }],
    baris: top.map((p) => ({ label: p.nama, logo: p.org ? orgLogo(p.org) : "", tip: p.nama, th: tipHtml(p.nama, [["MW", num(p.mw, 0)], [t("tpl.ar.n_plt"), String(p.n)]]), bagian: [{ k: "v", nilai: p.mw }] })) });
}
function tabelPLTU() {
  const el = document.getElementById("tpl-a-tab"); if (!el) return;
  tabel(el, { satuan: "tpl.u.pltu", per: 10, urutAwal: 3, menurun: true, kolom: [
    { label: t("tpl.c.pltu"), v: (b) => b.nama, f: (b) => `<b>${esc(b.nama)}</b><small class="rg3-catat">${esc(b.kab || "")}</small>` },
    { label: t("tpl.c.prov"), v: (b) => b.prov_kode, f: (b) => tautProvinsi(b.prov_kode) },
    { label: t("tpl.c.status"), v: (b) => b.st, f: (b) => pilJenis("tpl.st.", b.st) },
    { label: "MW", num: true, v: (b) => b.mw_operasi || b.mw_konstruksi || b.mw_rencana || 0, f: (b) => esc(num(b.mw_operasi || b.mw_konstruksi || b.mw_rencana || 0, 0)) },
    { label: t("tpl.ar.umur"), num: true, v: (b) => b.umur_maks ?? -1, f: (b) => (b.umur_maks != null ? esc(String(b.umur_maks)) : "-") },
    { label: t("tpl.c.pemilik"), v: (b) => b.pemilik?.nama, f: (b) => orgSel(b.pemilik?.org_id, b.pemilik?.nama) },
    { label: t("tpl.c.jenis"), v: (b) => (b.captive ? 1 : 0), f: (b) => pilJenis("tpl.jenis.", b.captive ? "captive" : "grid") },
    { label: t("tpl.ar.emisi") + " (Mt)", num: true, v: (b) => b.emisi_ct_t || 0, f: (b) => (b.emisi_ct_t ? esc(num(b.emisi_ct_t / 1e6, 2)) : "-") },
  ], baris: B.pltu.baris });
  siapTautan("org", "provinsi").then(() => naikkan(el));
}
export function mulai(el) {
  if (!B.pltu) { el.innerHTML = kosongTab("tpl.kosong"); return; }
  const m = B.pltu.meta, cap = baris().filter((b) => b.captive).reduce((a, b) => a + b.mw_operasi, 0);
  el.innerHTML = [
    ex({ id: "tpl-a-petaex", ikon: "peta", topik: t("tpl.ar.ey.peta"), judulHtml: esc(t("tpl.ar.j.peta", { n: baris().length, mw: num(m.mw_operasi / 1000, 1) })), subHtml: esc(t("tpl.ar.s.peta")),
      isiHtml: `<div class="tpl-peta"><div id="tpl-kanvas" class="tpl-kanvas"></div><div id="tpl-tip" class="tpl-tip" hidden></div><div class="tpl-leg">${KU.map((k) => `<span class="tpl-u-${KELAS[k]}"><i></i>${esc(t("tpl.ku." + k))}</span>`).join("")}</div></div>${catatan("tpl.ar.n.peta")}`,
      kakiHtml: kakiSumber(["gem-gcpt", "ct"]) }),
    ex({ id: "tpl-a-umurex", ikon: "linimasa", topik: t("tpl.ar.ey.umur"), judulHtml: esc(t("tpl.ar.j.umur_n", { n: m.umur_rata_tertimbang })), subHtml: esc(t("tpl.ar.s.umur")), isiHtml: `<div id="tpl-a-umur-l"></div><div id="tpl-a-umur" class="ih-bagan"></div>` }),
    ex({ id: "tpl-a-capex", ikon: "industri", topik: t("tpl.ar.ey.cap"), judulHtml: esc(t("tpl.ar.j.cap", { c: num(cap / 1000, 1), g: num((m.mw_operasi - cap) / 1000, 1) })), subHtml: esc(t("tpl.ar.s.cap")), isiHtml: `<div id="tpl-a-pem" class="ih-bagan"></div><p class="jm-bantu"><a class="rg3-tautan" href="/industri">${esc(t("tpl.ar.lihat_industri"))}</a></p>` }),
    ex({ id: "tpl-a-tabex", ikon: "daftar2", topik: t("tpl.ar.ey.tab"), judulHtml: esc(t("tpl.ar.j.tab", { n: B.pltu.baris.length })), subHtml: esc(t("tpl.ar.s.tab")), isiHtml: `<div id="tpl-a-tab"></div>`, kakiHtml: kakiSumber(["gem-gcpt"]) }),
  ].join("");
  umur(); pemilik(); tabelPLTU();
  setTimeout(bukaPeta, 0); // ponytail: peta setelah paint pertama
}
