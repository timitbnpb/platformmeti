/* /kelayakan: kalkulator kelayakan lokasi EBT. Peta koroplet sumber daya mengikuti teknologi; panel kontrol dan hasil mengambang di dalam peta.
   Hover provinsi = kartu tooltip berlambang; klik provinsi/titik atau pemilih provinsi = hitung (hasil di panel). Tautan dalam: ?lat=&lon=&tek=
   INP: pilihan teknologi mengubah chrome (aria-pressed) seketika; warna peta, legenda, dan hitung menyusul lewat nanti(). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, nanti } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas, geoProvinsi, BATAS_ID } from "/inti/peta_indonesia.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { geserPanel } from "/inti/panel_geser.js";
import { bukaKelayakan, daftarProvinsi, TEKNOLOGI } from "/inti/kelayakan.js";
import * as R from "/inti/kelayakan_rumus.js";

const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const IKON_PADA = { plts: "surya", terapung: "surya", pltb: "bayu", mikrohidro: "hidro" };
/* sumber daya per teknologi: kunci teks, asal data, skala warna (akar untuk MW) */
const SD = { plts: { k: "surya", u: "surya.u", dari: "atlas" }, terapung: { k: "surya", u: "surya.u", dari: "atlas" }, pltb: { k: "bayu", u: "mw", dari: "bayu" }, mikrohidro: { k: "mh", u: "mw", dari: "mikrohidro" } };
const ambil = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);
const q = new URLSearchParams(location.search);
const S = { lat: q.has("lat") ? Number(q.get("lat")) : null, lon: q.has("lon") ? Number(q.get("lon")) : null, tek: TEKNOLOGI.includes(q.get("tek")) ? q.get("tek") : "plts" };
let peta = null, penanda = null, petaSiap = false, GEO = null, PEL = null, ATLAS = null, PROV = [];
let NILAI = new Map(), RENTANG = [0, 1];
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
const lambang = (kode, u = 20) => `<img src="/img/provinsi/${esc(kode)}.png" width="${u}" height="${u}" alt="" loading="lazy" decoding="async">`;
const barisPel = (kode) => PEL?.baris?.find((b) => String(b.kode) === String(kode));

/** Nilai sumber daya per kode provinsi untuk teknologi aktif (Map kode -> angka | null). */
function hitungNilai() {
  const d = SD[S.tek].dari, m = new Map();
  for (const b of PEL?.baris || []) {
    const v = d === "atlas" ? ATLAS?.baris?.find((x) => String(x.kode) === String(b.kode))?.pvout_kwh_per_kwp_tahun : b.potensi?.[d]?.mw;
    m.set(String(b.kode), Number.isFinite(v) ? v : null);
  }
  NILAI = m;
  const ada = [...m.values()].filter((v) => v !== null);
  RENTANG = d === "atlas" ? [Math.min(...ada), Math.max(...ada)] : [0, Math.max(...ada)];
}
const skalaProv = (kode) => R.skala(NILAI.get(String(kode)), RENTANG[0], RENTANG[1], SD[S.tek].dari !== "atlas");

function warnaiPeta() {
  if (!peta || !petaSiap) return;
  const ekspr = ["match", ["to-string", ["get", "kode"]]];
  for (const kode of NILAI.keys()) { const s = skalaProv(kode); ekspr.push(kode, s < 0 ? 0.05 : 0.12 + 0.76 * s); }
  ekspr.push(0.05);
  peta.setPaintProperty("kl-isi", "fill-opacity", NILAI.size ? ekspr : 0.05);
}

function legenda() {
  const sd = SD[S.tek], satuan = t("kl.sd." + sd.u), sumber = sd.dari === "atlas" ? t("kl.leg.sumber.surya", { tgl: tanggal(ATLAS?.meta?.diperbarui || "") }) : t("kl.leg.sumber.ruen", { tgl: tanggal(PEL?.meta?.diperbarui || "") });
  const catat = S.tek === "terapung" || S.tek === "pltb" ? `<p class="jm-bantu">${esc(t("kl.leg.catat." + S.tek))}</p>` : "";
  $("klLegenda").innerHTML = `<h4>${esc(t("kl.sd." + sd.k))} (${esc(satuan)})</h4><div class="jm-pel-grad" aria-hidden="true"></div><div class="jm-pel-grad-n"><span>${esc(N(RENTANG[0]))}</span><span>${esc(N(RENTANG[1]))}</span></div><p class="jm-pel-nodata"><i aria-hidden="true"></i>${esc(t("pel.legenda.tanpa"))}</p><p class="jm-bantu">${esc(sumber)}</p>${catat}`;
}

function tampilTip(kode, pt) {
  const b = barisPel(kode), tip = $("klTip"); if (!b) return;
  const sd = SD[S.tek], v = NILAI.get(String(kode)), bpp = R.bppDari(b);
  const a = R.ASUMSI[S.tek], tabel = R.tabelDariData(PEL?.harga_patokan?.teknologi?.[{ surya: "surya", bayu: "bayu", mikrohidro: "hidro" }[a.patokan]]?.tingkat) || R.HARGA_PATOKAN[a.patokan];
  const pat = R.patokan(a.patokan, a.mw, tabel);
  tip.innerHTML = `<header>${lambang(kode, 36)}<div><strong>${esc(b.nama)}</strong><small>${esc(t("kl.tek." + S.tek))}</small></div></header>`
    + `<p><span>${esc(t("kl.sd." + sd.k))}</span><b>${esc(v === null || v === undefined ? "-" : N(v) + " " + t("kl.sd." + sd.u))}</b></p>`
    + `<ul><li><span>${esc(t("kl.tip.bpp"))}</span><b>${esc(bpp == null ? "-" : N(bpp))}</b></li><li><span>${esc(t("kl.tip.patokan"))}</span><b>${esc(pat == null ? "-" : N(pat, 2))}</b></li></ul><small class="jm-pel-ajak">${esc(t("kl.tip.klik"))}</small>`;
  tip.hidden = false;
  const w = $("klPeta").clientWidth, h = $("klPeta").clientHeight;
  tip.style.left = Math.max(8, Math.min(w - tip.offsetWidth - 8, pt.x + 16)) + "px";
  tip.style.top = Math.max(8, Math.min(h - tip.offsetHeight - 8, pt.y + 16)) + "px";
}

function tandai() {
  if (!peta || !Number.isFinite(S.lat) || !Number.isFinite(S.lon)) return;
  penanda ??= new maplibregl.Marker({ color: warna("--accent-isi") }).setLngLat([S.lon, S.lat]).addTo(peta);
  penanda.setLngLat([S.lon, S.lat]);
}

function panduan() {
  $("klPanelJ").querySelector("span").textContent = t("kl.pandu");
  $("kelayakanHasil").innerHTML = `<ol class="jm-kl-pandu">${[["jenis", 1], ["lokasi", 2], ["analisis", 3]].map(([ik, n]) => `<li>${ikon(ik, 40)}<div><b>${n}. ${esc(t("kl.pandu." + n))}</b><span>${esc(t("kl.pandu." + n + "d"))}</span></div></li>`).join("")}</ol>`;
}

function jalan() {
  const ada = Number.isFinite(S.lat) && Number.isFinite(S.lon);
  if (!ada) { panduan(); return; }
  $("klPanelJ").querySelector("span").textContent = t("kl.panel");
  $("klPanel").open = true;
  bukaKelayakan({ lat: S.lat, lon: S.lon, tek: S.tek, wadah: $("kelayakanHasil") });
  history.replaceState(null, "", `?lat=${S.lat.toFixed(3)}&lon=${S.lon.toFixed(3)}&tek=${S.tek}${location.hash}`);
  tandai();
}

function ubahTek(k) {
  S.tek = k;
  nanti(() => { hitungNilai(); warnaiPeta(); legenda(); jalan(); });
}

function kontrol() {
  $("klKontrolIsi").innerHTML = `<div class="jm-kl-tek" role="group" aria-label="${esc(t("kl.tek"))}">${TEKNOLOGI.map((k) => `<button type="button" class="jm-kl-tb" data-tek="${k}" aria-pressed="${k === S.tek}">${ikonTek(IKON_PADA[k])}<span>${esc(t("kl.tek." + k))}</span></button>`).join("")}</div>
    <label class="jm-pil-pilih jm-kl-prov">${ikon("peta", 18)}<span class="sr">${esc(t("kl.provinsi"))}</span><select data-ikon="peta" id="klProv"><option value="">${esc(t("kl.provinsi.pilih"))}</option>${PROV.map((p) => `<option value="${p.kode}" data-ikon="prov:${p.kode}">${esc(p.nama)}</option>`).join("")}</select></label>
    <div class="jm-kl-leg" id="klLegenda"></div>`;
  $("klKontrolIsi").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tek]"); if (!b || b.dataset.tek === S.tek) return;
    $("klKontrolIsi").querySelectorAll("[data-tek]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    ubahTek(b.dataset.tek);
  });
  $("klProv").addEventListener("change", (e) => pilihProv(e.target.value, true));
}

function pilihProv(kode, terbang) {
  const p = PROV.find((x) => x.kode === kode); if (!p) return;
  S.lat = p.lat; S.lon = p.lon; $("klProv").value = kode; sorot(kode);
  if (terbang) peta?.flyTo({ center: [p.lon, p.lat], zoom: 6, duration: 500 });
  nanti(jalan);
}
const sorot = (kode) => petaSiap && peta.setFilter("kl-sel", ["==", ["to-string", ["get", "kode"]], kode || ""]);

function pasangLapisan() {
  const il = rapikanPeta(peta);
  peta.addSource("kl", { type: "geojson", data: GEO });
  peta.addLayer({ id: "kl-isi", type: "fill", source: "kl", paint: { "fill-color": warna("--accent-isi"), "fill-opacity": 0.05 } }, il || undefined);
  peta.addLayer({ id: "kl-sel", type: "line", source: "kl", filter: ["==", ["get", "kode"], ""], paint: { "line-color": warna("--sorot"), "line-width": 3 } }, il || undefined);
  pasangBatas(peta, warna, il, "kl-sel");
  petaSiap = true; warnaiPeta(); tandai();
}

/* beri ruang di sisi yang tertutup panel mengambang */
const padPanel = () => {
  const box = $("klPeta").getBoundingClientRect(), p = { top: 16, bottom: 16, left: 12, right: 12 };
  if (innerWidth < 1000) return p;
  for (const id of ["klKontrol", "klPanel"]) {
    const r = $(id).getBoundingClientRect(), tengah = r.left + r.width / 2 - box.left;
    if (tengah < box.width / 2) p.left = Math.max(p.left, r.right - box.left + 16); else p.right = Math.max(p.right, box.right - r.left + 16);
  }
  return p;
};

function bukaPeta() {
  muatMapLibre().then(() => {
    const pusat = Number.isFinite(S.lat) && Number.isFinite(S.lon);
    peta = new maplibregl.Map({ container: "klPeta", style: gaya(), bounds: BATAS_ID, minZoom: 3, maxZoom: 14, dragRotate: false, pitchWithRotate: false, attributionControl: false, ...(pusat ? { bounds: undefined, center: [S.lon, S.lat], zoom: 6 } : {}) });
    peta.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("style.load", pasangLapisan);
    if (!pusat) peta.once("idle", () => { peta.resize(); peta.fitBounds(BATAS_ID, { padding: padPanel(), duration: 0 }); });
    new ResizeObserver(() => peta.resize()).observe($("klPeta"));
    peta.on("click", (e) => {
      S.lat = e.lngLat.lat; S.lon = e.lngLat.lng;
      const f = petaSiap ? peta.queryRenderedFeatures(e.point, { layers: ["kl-isi"] })[0] : null, kode = f ? String(f.properties.kode) : "";
      $("klProv").value = kode; sorot(kode); nanti(jalan);
    });
    peta.on("mousemove", "kl-isi", (e) => { peta.getCanvas().style.cursor = "pointer"; tampilTip(String(e.features[0].properties.kode), e.point); });
    peta.on("mouseleave", "kl-isi", () => { peta.getCanvas().style.cursor = ""; $("klTip").hidden = true; });
    new MutationObserver(() => { petaSiap = false; peta.setStyle(gaya()); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }).catch(() => { $("klPeta").innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("kl.peta.galat"))}</p></div>`; });
}

(async () => {
  await mulaiHalaman();
  [GEO, PEL, ATLAS, PROV] = await Promise.all([geoProvinsi(), ambil("/data/peluang.json"), ambil("/data/potensi_atlas.json"), daftarProvinsi()]);
  if (GEO) GEO = { ...GEO, features: GEO.features.map((f) => ({ ...f, properties: { ...f.properties, kode: String(f.properties.kode) } })) };
  hitungNilai();
  kontrol(); legenda(); panduan();
  if (innerWidth >= 1000) { geserPanel($("klKontrol"), { kunci: "kontrol" }); geserPanel($("klPanel"), { kunci: "panel" }); }
  else { $("klKontrol").open = false; $("klPanel").open = false; }
  bukaPeta();
  jalan();
})();
