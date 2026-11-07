/* Exhibit "Klaim karbon dan lahan di wilayah ini" pada profil provinsi: ubin angka, peta klaim berlapis, pengklaim terbesar, tumpang tindih, proyek.
   Luas dan tumpang tindih = perkiraan raster (Hipotesis). Berkas besar (geojson) dimuat saat exhibit terlihat. */
import { esc, ikon } from "/inti/umum.js";
import { t } from "/i18n.js";
import { exHtml, sumberHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { geoProvinsi, rapikanPeta } from "/inti/peta_indonesia.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { geserPanel } from "/inti/panel_geser.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { WARNA, muatJson, fmt, warna, pilLapis, pasangCss } from "/klaim_lahan_ui.js";

const LAPIS_TAMPIL = ["hti", "hph", "sawit", "mangrove", "lindung", "produksi", "adat"];
const GRUP = { konsesi: { geo: "lahan_konsesi", ids: ["hti", "hph", "re", "sawit"] }, mangrove: { geo: "lahan_mangrove", ids: ["mangrove"] }, hutan: { geo: "lahan_hutan", ids: ["lindung", "produksi"] } };
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";

export const klaimTempat = () => '<div id="wp-klaim"></div>';

export async function isiKlaim(p) {
  const el = document.getElementById("wp-klaim"); if (!el) return;
  try {
    pasangCss();
    const K = await muatJson("/data/klaim_lahan.json"), P = K.provinsi[p.kode];
    if (!P) { el.remove(); return; }
    const proy = K.proyek.filter((x) => x.prov === p.kode);
    const ubin = LAPIS_TAMPIL.map((id) => `<div class="kl2-u">${pilLapis(id)}<b>${P.ha[id] ? fmt(P.ha[id]) : "-"}</b><small>${esc(t("kl2.ha"))}</small></div>`).join("");
    const nTum = Object.values(P.tumpang).reduce((a, b) => a + b, 0), konsesiHa = (P.ha.hti || 0) + (P.ha.hph || 0) + (P.ha.sawit || 0);
    const peng = P.pengklaim.length ? P.pengklaim.map((x, i) => `<div class="kl2-baris"><span class="kl2-no">${i + 1}</span><span class="kl2-nm"><b>${x.org ? (logoOrgSatu(x.org, x.nama) ? `<img src="${esc(logoOrgSatu(x.org, x.nama))}" alt="" loading="lazy">` : "") : ""}${esc(x.nama.replace(/\s+/g, " ").trim())}</b><span>${pilLapis(x.jenis)}</span></span><span class="kl2-ha">${fmt(x.ha)} ${esc(t("kl2.ha"))}</span></div>`).join("") : `<p class="kl2-kos">-</p>`;
    const tum = Object.entries(P.tumpang).sort((a, b) => b[1] - a[1]).map(([k, v]) => { const [a, b] = k.split("+"); return `<div class="kl2-pas"><span>${pilLapis(a)} <span class="kl2-x">&times;</span> ${pilLapis(b)}</span><b class="kl2-ha">${fmt(v)} ${esc(t("kl2.ha"))}</b></div>`; }).join("") || `<p class="kl2-kos">${esc(t("kl2.tum_kosong"))}</p>`;
    const pr = proy.length ? proy.slice(0, 12).map((x) => `<div class="kl2-pas"><span><b>${esc(x.nama)}</b><br><small class="kl2-x">${esc(t(x.jenis === "karbon" ? "kl2.jenis_karbon" : "kl2.jenis_ebt"))}${x.kab ? " - " + esc(K.kabupaten[x.kab]?.nama || "") : ""}</small></span><span>${Object.keys(x.hit).length ? Object.entries(x.hit).slice(0, 3).map(([k, v]) => pilLapis(k)).join(" ") : '<span class="kl2-x">-</span>'}</span></div>`).join("") : `<p class="kl2-kos">${esc(t("kl2.proyek_kosong"))}</p>`;
    const sumber = K.status.filter((s) => s.sumber || s.alasan).map((s) => `<p><b>${esc(t("kl2.l." + (s.id === "ps" || s.id === "tambang" ? s.id : s.id)))}</b>: ${esc(s.sumber || s.alasan)}${s.lisensi ? " (" + esc(s.lisensi) + ")" : ""}</p>`).join("") + `<p>${esc(K.metode.catatan)}</p>`;
    const seg = Object.keys(GRUP).map((g, i) => `<button type="button" data-g="${g}" aria-pressed="${g !== "hutan"}">${esc(t("kl2.g." + g))}</button>`).join("");
    el.outerHTML = exHtml({ id: "klaim", ikon: "peta", topik: t("kl2.ey"), judulHtml: hlHtml("kl2.j", fmt(konsesiHa), { nama: p.nama }), subHtml: `${esc(t("kl2.sub", { karbon: P.karbon, ebt: P.ebt, tum: fmt(nTum) }))} <span class="kl2-hip">${esc(t("kl2.hip"))}</span>`, aksiHtml: aksiHtml({ csv: false }) + sumberHtml(sumber, t("jm.sumber")),
      isiHtml: `<div class="kl2-ubin">${ubin}</div><div class="kl2-seg" role="group" aria-label="${esc(t("kl2.g.judul"))}">${seg}</div>
      <div class="kl2-peta-w" id="kl2-pw"><div class="kl2-peta" id="kl2-peta"></div><aside class="kl2-panel" id="kl2-panel"><h3>${esc(t("kl2.peng"))}</h3>${peng}</aside></div>
      <div class="kl2-dua"><section class="kl2-kartu"><h3>${ikon("banding", 18)}${esc(t("kl2.tum"))}</h3>${tum}</section><section class="kl2-kartu"><h3>${ikon("proyek", 18)}${esc(t("kl2.proyek"))} (${proy.length})</h3>${pr}</section></div>` });
    const wadah = document.getElementById("klaim"); if (!wadah) return;
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { io.disconnect(); bukaPeta(p, K, proy); } }, { rootMargin: "300px" });
    io.observe(wadah);
  } catch (e) { console.warn("klaim wilayah", e); el.remove(); }
}

async function bukaPeta(p, K, proy) {
  const el = document.getElementById("kl2-peta"), pw = document.getElementById("kl2-pw"); if (!el) return;
  try {
    const [g] = await Promise.all([geoProvinsi(), muatMapLibre()]);
    const f = g.features.find((x) => String(x.properties.kode) === p.kode);
    const b = new maplibregl.LngLatBounds(); for (const poli of f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) for (const [x, y] of poli[0]) b.extend([x, y]);
    const peta = new maplibregl.Map({ container: el, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), bounds: b, fitBoundsOptions: { padding: 24 }, minZoom: 3, maxZoom: 13, dragRotate: false, pitchWithRotate: false, cooperativeGestures: true, attributionControl: { compact: true } });
    new ResizeObserver(() => peta.resize()).observe(el);
    let cadang = false; // peta dasar tak terjangkau: tetap tampilkan lapisan di atas latar polos
    const polos = () => { if (cadang || peta.isStyleLoaded()) return; cadang = true; peta.setStyle({ version: 8, sources: {}, layers: [{ id: "latar", type: "background", paint: { "background-color": warna("--surface") || "#F2F8F5" } }] }); };
    peta.on("error", polos); setTimeout(polos, 5000);
    if (matchMedia("(min-width:761px)").matches) geserPanel(document.getElementById("kl2-panel"), { kunci: "kl2", batas: pw });
    const warnaMatch = ["match", ["get", "j"], ...Object.entries(WARNA).flatMap(([k, v]) => [k, warna(v)]), "#888"];
    const geoData = {};
    peta.on("style.load", () => {
      const idLabel = rapikanPeta(peta);
      peta.addSource("prov", { type: "geojson", data: f }); peta.addLayer({ id: "prov", type: "line", source: "prov", paint: { "line-color": warna("--accent-isi") || "#0A5C47", "line-width": 2 } }, idLabel);
      const pasang = async (gr) => {
        const d = (geoData[gr] ||= await muatJson(`/data/geo/${GRUP[gr].geo}.geojson`)); if (peta.getSource(gr)) return;
        peta.addSource(gr, { type: "geojson", data: d });
        peta.addLayer({ id: gr + "-isi", type: "fill", source: gr, paint: { "fill-color": warnaMatch, "fill-opacity": gr === "hutan" ? 0.22 : 0.4 } }, "prov");
        peta.addLayer({ id: gr + "-gr", type: "line", source: gr, paint: { "line-color": warnaMatch, "line-width": 0.8, "line-opacity": 0.8 } }, "prov");
        peta.on("click", gr + "-isi", (e) => { const s = e.features[0].properties, j = s.j; new maplibregl.Popup({ maxWidth: "280px" }).setLngLat(e.lngLat).setHTML(`<div class="kl2-pop"><b>${esc(s.n || t("kl2.l." + j))}</b>${pilLapis(j)}${s.ha ? `<span>${esc(fmt(s.ha))} ${esc(t("kl2.ha"))} (${esc(t("kl2.atribut"))})</span>` : ""}</div>`).addTo(peta); });
        peta.on("mouseenter", gr + "-isi", () => { peta.getCanvas().style.cursor = "pointer"; }); peta.on("mouseleave", gr + "-isi", () => { peta.getCanvas().style.cursor = ""; });
      };
      const tampil = (gr, on) => { if (!peta.getSource(gr)) return; for (const s of ["-isi", "-gr"]) peta.setLayoutProperty(gr + s, "visibility", on ? "visible" : "none"); };
      pasang("konsesi").catch(() => {}); pasang("mangrove").catch(() => {});
      peta.addSource("proy", { type: "geojson", data: { type: "FeatureCollection", features: proy.filter((x) => x.lat != null).map((x) => ({ type: "Feature", geometry: { type: "Point", coordinates: [x.lng, x.lat] }, properties: { n: x.nama, j: x.jenis, k: x.kab ? K.kabupaten[x.kab]?.nama || "" : "", h: Object.keys(x.hit).join(",") } })) } });
      peta.addLayer({ id: "proy", type: "circle", source: "proy", paint: { "circle-radius": 7, "circle-color": ["match", ["get", "j"], "karbon", warna("--tp-karbon") || "#3F4F45", warna("--tp-surya")], "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
      peta.on("click", "proy", (e) => { const s = e.features[0].properties; new maplibregl.Popup({ maxWidth: "280px" }).setLngLat(e.features[0].geometry.coordinates).setHTML(`<div class="kl2-pop"><b>${esc(s.n)}</b><span>${esc(t(s.j === "karbon" ? "kl2.jenis_karbon" : "kl2.jenis_ebt"))}${s.k ? " - " + esc(s.k) : ""}</span>${s.h ? s.h.split(",").map(pilLapis).join(" ") : ""}</div>`).addTo(peta); });
      document.getElementById("klaim").querySelector(".kl2-seg").addEventListener("click", async (e) => {
        const bt = e.target.closest("button[data-g]"); if (!bt) return; const on = bt.getAttribute("aria-pressed") !== "true"; bt.setAttribute("aria-pressed", on);
        if (on && !peta.getSource(bt.dataset.g)) await pasang(bt.dataset.g); tampil(bt.dataset.g, on);
      });
    });
  } catch (e) { console.warn("peta klaim", e); el.innerHTML = `<p class="kl2-kos">${esc(t("wl.peta_gagal"))}</p>`; }
}
