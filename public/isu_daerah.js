/* /isu, tab Daerah: peta koroplet MapLibre jumlah isu per provinsi + panel geser + peringkat + kasus terkurasi.
   Polanya sama dengan /risiko (muatMapLibre, rapikanPeta, pasangBatas, geserPanel). Jumlah mengikuti saringan aktif. */
import { t } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas, geoProvinsi, BATAS_ID } from "/inti/peta_indonesia.js";
import { geserPanel } from "/inti/panel_geser.js";
import { namaProvinsiKode } from "/inti/tautan.js";
import { batangHtml, pasangBar } from "/analisis.js";
import { N, saring, kartuIsu, pilTema, pilStatus } from "/isu_umum.js";

const $ = (id) => document.getElementById(id);
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme:dark)").matches);
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
const KELAS = [[1, 0.2], [2, 0.36], [3, 0.52], [5, 0.7], [8, 0.88]]; // [batas bawah jumlah, opasitas isi]
const lamb = (k) => `<img class="isu-lamb" src="/img/provinsi/${esc(k)}.png" alt="" width="20" height="20" loading="lazy" decoding="async" data-galat="hapus">`;

let peta, geo, pilih = "", bangun, info, ctx = {};

const jumlah = (D, S) => { const m = {}; for (const i of saring(D.baris, S)) for (const k of i.prov) m[k] = (m[k] || 0) + 1; return m; };

export async function mulai(akar, D, S, opsi) {
  info = opsi.info; ctx = { D, S };
  akar.innerHTML = [
    exHtml({ id: "isu-d-peta", ikon: "peta", topik: t("isu.ex.peta"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml() + info(), isiHtml: `<div class="pt2-peta isu-peta">
      <div id="isuPeta" class="pt2-kanvas" role="application" aria-label="${esc(t("isu.peta.label"))}"></div>
      <div id="isuTip" class="pt2-tip" role="status" hidden></div>
      <details class="pt2-lapis" id="isuLegenda" open><summary><span>${esc(t("isu.peta.legenda"))}</span></summary><div class="pt2-lapis-isi" id="isuLegendaIsi"></div></details>
      <details class="pt2-panel" id="isuPanel" open><summary><span>${esc(t("isu.panel"))}</span></summary><div class="pt2-panel-isi" id="isuPanelIsi" aria-live="polite"></div></details>
    </div>` }),
    exHtml({ id: "isu-d-rank", ikon: "grafik", topik: t("isu.ex.rank"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml({ csv: true }) + info(), isiHtml: `<div id="isuRank"></div>` }),
    exHtml({ id: "isu-d-kasus", ikon: "peringatan", topik: t("isu.ex.kasus"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml({ csv: true }) + info(), isiHtml: `<ul class="isu-kartu-daftar" id="isuKasus"></ul>` }),
  ].join("");
  $("isu-d-rank").addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) { pilihProv(b.dataset.id); $("isu-d-peta").scrollIntoView({ block: "start" }); } });
  $("isu-d-rank").addEventListener("jm:csv", (e) => { const m = jumlah(ctx.D, ctx.S); e.detail.baris = [[t("isu.d.wilayah"), t("isu.n", { n: "" }).trim()], ...Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, n]) => [namaProvinsiKode(k), n])]; });
  $("isu-d-kasus").addEventListener("jm:csv", (e) => { e.detail.baris = [["Judul", t("isu.f.tema"), t("isu.f.status"), "Ringkasan"], ...kasus().map((i) => [i.judul, t("isu.tema." + i.tema), t("isu.st." + i.status), i.ringkas])]; });
  $("isuPanelIsi").addEventListener("click", (e) => { const b = e.target.closest("[data-pilih]"); if (b) pilihProv(b.dataset.pilih); });
  if (innerWidth >= 1000) { geserPanel($("isuLegenda"), { kunci: "legenda" }); geserPanel($("isuPanel"), { kunci: "panel" }); }
  legenda(); isi();
  muatPeta(D, S);
}
const kasus = () => saring(ctx.D.baris.filter((i) => i.tingkat === "daerah" && !i.auto), ctx.S);

export function perbarui(D, S) {
  if (!$("isuRank")) return;
  ctx = { D, S }; isi();
  if (peta && geo) { const m = jumlah(D, S); for (const f of geo.features) f.properties.n = m[f.properties.kode] || 0; peta.getSource("isu")?.setData(geo); }
}
function legenda() {
  $("isuLegendaIsi").innerHTML = `<ul class="isu-leg">${[[0, 0.06], ...KELAS].map(([b, o], n, a) => `<li><i class="isu-leg-k isu-leg-${n}"></i><span>${n === 0 ? "0" : n === a.length - 1 ? esc(t("isu.peta.lebih", { n: b })) : b === a[n + 1][0] - 1 ? b : b + "-" + (a[n + 1][0] - 1)}</span></li>`).join("")}</ul>`;
}
function isi() {
  const { D, S } = ctx, m = jumlah(D, S), arr = Object.entries(m).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])), puncak = arr[0];
  const j = (id, a, b) => { const ex = $(id); ex.querySelector(".jm-ex-j").innerHTML = a; ex.querySelector(".jm-ex-sub").innerHTML = b; };
  j("isu-d-peta", puncak ? hlHtml("isu.ex.peta.j", namaProvinsiKode(puncak[0])) : esc(t("isu.kosong")), esc(t("isu.ex.peta.s")));
  j("isu-d-rank", hlHtml("isu.ex.rank.j", N(arr.length)), esc(t("isu.ex.rank.s")));
  const ks = kasus();
  j("isu-d-kasus", hlHtml("isu.ex.kasus.j", N(ks.length)), esc(t("isu.ex.kasus.s")));
  $("isuRank").innerHTML = arr.length ? batangHtml(arr.slice(0, 15).map(([k, n]) => ({ id: k, label: namaProvinsiKode(k), labelHtml: `<span class="isu-bar-l">${lamb(k)}<span>${esc(namaProvinsiKode(k))}</span></span>`, bagian: [{ nilai: n, kelas: "jm-an-c1" }], teks: N(n), pilih: k === pilih })), { label: t("isu.ex.rank"), aksi: true, satuan: "" }) : `<p class="jm-kosong-teks">${esc(t("isu.kosong"))}</p>`;
  pasangBar($("isuRank"));
  $("isuKasus").innerHTML = ks.length ? ks.map(kartuIsu).join("") : `<li class="jm-kosong">${ikon("info", 32)}<p>${esc(t("isu.kosong"))}</p></li>`;
  panel();
}
function panel() {
  const { D, S } = ctx, el = $("isuPanelIsi");
  if (!pilih) {
    const arr = Object.entries(jumlah(D, S)).sort((a, b) => b[1] - a[1]).slice(0, 8);
    el.innerHTML = `<p class="isu-panel-p">${esc(t("isu.panel.pilih"))}</p><ul class="isu-panel-top">${arr.map(([k, n]) => `<li><button type="button" class="isu-panel-b" data-pilih="${esc(k)}">${lamb(k)}<span>${esc(namaProvinsiKode(k))}</span><b>${N(n)}</b></button></li>`).join("")}</ul>`;
    return;
  }
  const ar = saring(D.baris, S).filter((i) => i.prov.includes(pilih));
  el.innerHTML = `<div class="isu-panel-k">${lamb(pilih)}<div><b>${esc(namaProvinsiKode(pilih))}</b><small>${esc(t("isu.panel.n", { n: N(ar.length) }))}</small></div><a class="jm-lihat" href="/wilayah/${esc(pilih)}">${ikon("wilayah", 16)}<span>${esc(t("isu.d.wilayah"))}</span></a></div>
    ${ar.length ? `<ul class="isu-panel-daftar">${ar.map((i) => `<li><a href="#${esc(i.id)}" class="isu-panel-i isu-t-${esc(i.tema)}"><span class="isu-pil-baris">${pilTema(i.tema)}${pilStatus(i.status)}</span><b>${esc(i.judul)}</b></a></li>`).join("")}</ul>` : `<p class="isu-panel-p">${esc(t("isu.panel.kosong"))}</p>`}`;
}
function pilihProv(k) {
  pilih = k === pilih ? "" : k;
  panel(); isiBatang();
  if (peta?.getLayer("isu-pilih")) peta.setFilter("isu-pilih", ["==", ["get", "kode"], pilih || "-"]);
  $("isuPanel").open = true;
}
function isiBatang() { for (const b of $("isuRank").querySelectorAll("[data-id]")) b.setAttribute("aria-pressed", String(b.dataset.id === pilih)); }

async function muatPeta(D, S) {
  const kanvas = $("isuPeta");
  try {
    await muatMapLibre();
    geo = structuredClone(await geoProvinsi());
    if (!geo) throw new Error("geo");
    const m = jumlah(D, S);
    for (const f of geo.features) f.properties.n = m[f.properties.kode] || 0;
    peta = new maplibregl.Map({ container: kanvas, style: gaya(), bounds: BATAS_ID, fitBoundsOptions: { padding: 12 }, attributionControl: { compact: true }, cooperativeGestures: false });
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("load", () => {
      const idLabel = rapikanPeta(peta);
      peta.addSource("isu", { type: "geojson", data: geo, promoteId: "kode" });
      const dasar = warna("--brand");
      const op = ["step", ["get", "n"], 0.06, ...KELAS.flatMap(([b, o]) => [b, o])];
      peta.addLayer({ id: "isu-isi", type: "fill", source: "isu", paint: { "fill-color": dasar, "fill-opacity": op } }, idLabel);
      peta.addLayer({ id: "isu-garis", type: "line", source: "isu", paint: { "line-color": warna("--ink2"), "line-opacity": 0.35, "line-width": 0.6 } }, idLabel);
      peta.addLayer({ id: "isu-pilih", type: "line", source: "isu", filter: ["==", ["get", "kode"], "-"], paint: { "line-color": warna("--ink"), "line-width": 2.4 } }, idLabel);
      pasangBatas(peta, warna, idLabel, "isu-isi");
      lambang();
      const pas = () => { peta.resize(); peta.fitBounds(BATAS_ID, { padding: 8, animate: false }); };
      pas(); addEventListener("resize", pas);
      const lp = () => kanvas.classList.toggle("isu-tanpa-lamb", peta.getZoom() < 3.4);
      peta.on("zoom", lp); peta.on("resize", lp); lp();
    });
    const tip = $("isuTip");
    peta.on("mousemove", "isu-isi", (e) => {
      const p = e.features?.[0]?.properties; if (!p) return;
      peta.getCanvas().style.cursor = "pointer";
      tip.hidden = false; tip.textContent = t("isu.peta.tip", { prov: namaProvinsiKode(p.kode), n: N(p.n) });
      const r = kanvas.getBoundingClientRect(); tip.style.left = Math.min(e.point.x + 14, r.width - 200) + "px"; tip.style.top = e.point.y + 14 + "px";
    });
    peta.on("mouseleave", "isu-isi", () => { tip.hidden = true; peta.getCanvas().style.cursor = ""; });
    peta.on("click", "isu-isi", (e) => { const p = e.features?.[0]?.properties; if (p) pilihProv(String(p.kode)); });
  } catch {
    kanvas.innerHTML = `<p class="jm-kosong-teks isu-peta-galat">${esc(t("isu.peta.galat"))}</p>`;
  }
}
/* lambang provinsi: penanda HTML di tengah provinsi yang punya isu dan cukup lebar */
function lambang() {
  for (const f of geo.features) {
    if (!f.properties.n) continue;
    const poli = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    let best = null;
    for (const p of poli) { const xs = p[0].map((c) => c[0]), ys = p[0].map((c) => c[1]), w = Math.max(...xs) - Math.min(...xs); if (!best || w > best.w) best = { w, cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2 }; }
    if (!best || best.w < 2) continue;
    const el = document.createElement("img");
    el.className = "isu-lamb isu-lamb-peta"; el.src = `/img/provinsi/${f.properties.kode}.png`; el.alt = ""; el.width = 22; el.height = 22; el.setAttribute("aria-hidden", "true");
    new maplibregl.Marker({ element: el, pitchAlignment: "map" }).setLngLat([best.cx, best.cy]).addTo(peta);
  }
}
