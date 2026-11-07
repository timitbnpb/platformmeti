/* /kelayakan: halaman sementara kalkulator kelayakan lokasi EBT (nanti disematkan di /peluang).
   Peta MapLibre: klik titik atau pilih provinsi; teknologi lewat tombol. Tautan dalam: ?lat=&lon=&tek= */
import { t } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas, BATAS_ID } from "/inti/peta_indonesia.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { bukaKelayakan, daftarProvinsi, TEKNOLOGI } from "/inti/kelayakan.js";

const $ = (id) => document.getElementById(id);
const IKON_PADA = { plts: "surya", terapung: "surya", pltb: "bayu", mikrohidro: "hidro" };
const q = new URLSearchParams(location.search);
const S = { lat: q.has("lat") ? Number(q.get("lat")) : null, lon: q.has("lon") ? Number(q.get("lon")) : null, tek: TEKNOLOGI.includes(q.get("tek")) ? q.get("tek") : "plts" };
let peta = null, penanda = null;
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");

function tandai() {
  if (!peta || !Number.isFinite(S.lat) || !Number.isFinite(S.lon)) return;
  penanda ??= new maplibregl.Marker({ color: warna("--accent-isi") }).setLngLat([S.lon, S.lat]).addTo(peta);
  penanda.setLngLat([S.lon, S.lat]);
}

function jalan() {
  const ada = Number.isFinite(S.lat) && Number.isFinite(S.lon);
  bukaKelayakan({ lat: ada ? S.lat : NaN, lon: ada ? S.lon : NaN, tek: S.tek, wadah: $("kelayakanHasil") });
  if (ada) history.replaceState(null, "", `?lat=${S.lat.toFixed(3)}&lon=${S.lon.toFixed(3)}&tek=${S.tek}${location.hash}`);
  tandai();
}

function kontrol(prov) {
  $("klKontrol").innerHTML = `<div class="jm-kl-tek" role="group" aria-label="${esc(t("kl.tek"))}">${TEKNOLOGI.map((k) => `<button type="button" class="jm-kl-tb" data-tek="${k}" aria-pressed="${k === S.tek}">${ikonTek(IKON_PADA[k])}<span>${esc(t("kl.tek." + k))}</span></button>`).join("")}</div>
    <label class="jm-pil-pilih jm-kl-prov">${ikon("peta", 18)}<span class="sr">${esc(t("kl.provinsi"))}</span><select id="klProv"><option value="">${esc(t("kl.provinsi.pilih"))}</option>${prov.map((p) => `<option value="${p.kode}">${esc(p.nama)}</option>`).join("")}</select></label>`;
  $("klKontrol").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tek]"); if (!b) return;
    S.tek = b.dataset.tek;
    $("klKontrol").querySelectorAll("[data-tek]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    jalan();
  });
  $("klProv").addEventListener("change", (e) => {
    const p = prov.find((x) => x.kode === e.target.value); if (!p) return;
    S.lat = p.lat; S.lon = p.lon; peta?.flyTo({ center: [p.lon, p.lat], zoom: 6, duration: 500 }); jalan();
  });
}

function bukaPeta() {
  muatMapLibre().then(() => {
    const pusat = Number.isFinite(S.lat) && Number.isFinite(S.lon);
    peta = new maplibregl.Map({ container: "klPeta", style: gaya(), bounds: BATAS_ID, minZoom: 3, maxZoom: 14, dragRotate: false, pitchWithRotate: false, attributionControl: { compact: true }, ...(pusat ? { bounds: undefined, center: [S.lon, S.lat], zoom: 6 } : {}) });
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.addControl(new maplibregl.ScaleControl({ unit: "metric", maxWidth: 90 }), "bottom-left");
    peta.on("style.load", () => { const il = rapikanPeta(peta); pasangBatas(peta, warna, il, null); tandai(); });
    new ResizeObserver(() => peta.resize()).observe($("klPeta"));
    peta.on("click", (e) => { S.lat = e.lngLat.lat; S.lon = e.lngLat.lng; $("klProv") && ($("klProv").value = ""); jalan(); });
    new MutationObserver(() => peta.setStyle(gaya())).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }).catch(() => { $("klPeta").innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("kl.peta.galat"))}</p></div>`; });
}

(async () => {
  await mulaiHalaman();
  kontrol(await daftarProvinsi());
  bukaPeta();
  jalan();
})();
