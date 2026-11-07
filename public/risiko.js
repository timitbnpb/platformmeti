/* /risiko: peta risiko sosial dan lingkungan per proyek (F2). Data /data/risiko_proyek.json (scripts/pipa/risiko_proyek.mjs),
   lapisan /data/geo/risiko_{hutan,gambut,adat}.geojson (dimuat saat dinyalakan) dan /img/risiko/bahaya_multi.png (InaRISK).
   INP: saringan menyalakan chrome seketika, peta, grafik, tabel menyusul lewat nanti(). */
import { t, angka } from "/i18n.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { esc, nanti, ikon, hantuHtml, galatHtml } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { exHtml, sumberHtml, cariHtml, pilihHtml, hapusHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { pilTek } from "/inti/ikon_tek.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas } from "/inti/peta_indonesia.js";
import { geserPanel } from "/inti/panel_geser.js";
import { siapTautan, tautOrg, tautProvinsi } from "/inti/tautan.js";
import { batangHtml, pasangBar, saatBahasa } from "/analisis.js";
import { pasangTabel, labTek } from "/proyek_besar_umum.js";

const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const KELAS = ["sangat-tinggi", "tinggi", "sedang", "rendah"];
const WARNA = { "sangat-tinggi": "--bad", tinggi: "--warn", sedang: "--info", rendah: "--ok" };
const IK = {
  rendah: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  sedang: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  tinggi: '<path d="M12 3 2 20h20zM12 10v5M12 18h.01"/>',
  "sangat-tinggi": '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6zM12 8v5M12 16h.01"/>',
};
const svg = (d) => `<svg class="jm-ikt jm-ikt-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const IKK = { hutan: '<path d="M12 3 6 12h3l-3 5h12l-3-5h3zM12 17v4"/>', gambut: '<path d="M3 17c3-3 6 3 9 0s6 3 9 0M3 12c3-3 6 3 9 0s6 3 9 0M12 3v4"/>', adat: '<path d="M3 12 12 4l9 8M6 10v10h12V10M10 20v-5h4v5"/>', bahaya: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>' };
const pilKelas = (r) => `<span class="rs3-pil rs3-k-${r.kelas}">${svg(IK[r.kelas])}<span>${esc(t("rs3.kelas." + r.kelas))}</span><b>${r.skor}</b></span>`;
const pilKelasNama = (k) => `<span class="rs3-pil rs3-k-${k}">${svg(IK[k])}<span>${esc(t("rs3.kelas." + k))}</span></span>`;
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme:dark)").matches);
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
const S = { q: "", tek: "", kelas: "", pilih: -1, lapis: { hutan: false, gambut: false, adat: false, bahaya: false } };
const TABEL = { k: "skor", arah: -1, hal: 1, turun: ["skor", "mw"] };
const WARNA_HUTAN = { konservasi: "--ok", lindung: "--data4", produksi: "--warn", konversi: "--tp-biaya" };

await mulaiHalaman();
siapTautan("org");
const isi = $("rsIsi");
isi.innerHTML = hantuHtml(6);
let D, SEMUA;
try {
  D = await fetch("/data/risiko_proyek.json", { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error("data"); return r.json(); });
} catch (e) {
  isi.innerHTML = galatHtml("jaringan");
  isi.querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw e;
}
SEMUA = D.baris.filter((r) => r.skor != null);
SEMUA.forEach((r, i) => { r.i = i; r.pem = r.pemilik ? r.pemilik.nama : null; r.pemId = r.pemilik ? r.pemilik.org_id : null; });

const cocok = (r, abaikanKelas) => (!S.tek || r.tek === S.tek) && (abaikanKelas || !S.kelas || r.kelas === S.kelas) && (!S.q || `${r.nama} ${r.pem || ""} ${r.prov || ""}`.toLowerCase().includes(S.q));
const terpilih = (abaikanKelas) => SEMUA.filter((r) => cocok(r, abaikanKelas));
const jumlahMw = (a) => a.reduce((s, r) => s + (r.mw || 0), 0);
const labKomp = (k, c) => {
  if (k === "hutan") return t("rs3.kt.hutan." + c.ket);
  if (k === "gambut") return t("rs3.komp.gambut");
  if (k === "adat") return t("rs3.komp.adat");
  return `${t("rs3.komp.bahaya")} ${c.v}`;
};
const ringkasKomp = (r) => {
  const a = Object.entries(r.komponen).filter(([k, c]) => (k === "bahaya" || c.v >= (k === "gambut" ? 50 : 1)));
  return a.length ? `<span class="rs3-komp">${a.map(([k, c]) => `<span class="rs3-ch rs3-c-${k}">${svg(IKK[k])}${esc(labKomp(k, c))}</span>`).join("")}</span>` : `<span class="jm-bantu">-</span>`;
};
const selPem = (r) => {
  if (!r.pem) return `<span class="jm-bantu">-</span>`;
  const logo = logoOrgSatu(r.pemId, r.pem, r.pemilik && r.pemilik.logo);
  return `<span class="pb-pem">${logo ? `<img class="pb-logo" src="${esc(logo)}" alt="" width="22" height="22" loading="lazy" data-galat="hapus">` : ""}<span class="pb-pem-t"><span>${r.pemId ? tautOrg(r.pemId, r.pem) : esc(r.pem)}</span></span></span>`;
};
const selProv = (r) => (r.prov ? `<span class="pt2-prov">${r.prov_kode ? tautProvinsi(r.prov) : esc(r.prov)}</span>` : `<span class="jm-bantu">-</span>`);
const selNama = (r) => `<b>${r.profil ? `<a class="jm-pj-nm" href="/p/${esc(r.id)}">${esc(r.nama)}</a>` : esc(r.nama)}</b><div class="pb-prov">${selProv(r)}</div>`;
const KOLOM = [
  ["nama", "rs3.c.proyek", selNama],
  ["tek", "rs3.c.tek", (r) => pilTek(r.tek), "jm-tengah"],
  ["pem", "rs3.c.pemilik", selPem],
  ["skor", "rs3.c.skor", pilKelas, "jm-tengah"],
  [null, "rs3.c.komp", ringkasKomp, "pb-c-komp"],
  ["mw", "rs3.c.mw", (r) => (r.mw == null ? `<span class="jm-bantu">-</span>` : `${N(r.mw, r.mw < 10 ? 1 : 0)} <span class="jm-pj-sat">MW</span>`), "jm-num"],
];
const infoMetode = () => sumberHtml(`${esc(D.meta.metode)}<br>${D.meta.sumber.map((s) => `${/^https?:/.test(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.judul)}</a>` : esc(s.judul)} (${esc(s.penerbit)}; ${esc(s.lisensi)})`).join("<br>")}`);

function kerangka() {
  const tekAda = [...new Set(SEMUA.map((r) => r.tek))].sort((a, b) => labTek(a).localeCompare(labTek(b), "id"));
  const cTek = SEMUA.reduce((m, r) => (m[r.tek] = (m[r.tek] || 0) + 1, m), {}), cKl = SEMUA.reduce((m, r) => (m[r.kelas] = (m[r.kelas] || 0) + 1, m), {});
  const saring = `<div class="jm-saring pt2-saring" role="group" aria-label="${esc(t("rs3.saring"))}">
    ${cariHtml({ id: "rsQ", label: t("rs3.cari"), placeholder: t("rs3.cari.ph") })}
    ${pilihHtml({ id: "rsTek", ikon: "jenis", label: t("rs3.f.tek"), opsi: [["", t("rs3.semua.tek")], ...tekAda.map((k) => [k, labTek(k), "tek:" + k, cTek[k]])], nilai: S.tek })}
    ${pilihHtml({ id: "rsKl", ikon: "status", label: t("rs3.f.kelas"), opsi: [["", t("rs3.semua.kelas")], ...KELAS.filter((k) => cKl[k]).map((k) => [k, t("rs3.kelas." + k), "peringatan", cKl[k]])], nilai: S.kelas })}
    ${hapusHtml({ id: "rsHapus", label: t("rs3.f.hapus") })}</div>`;
  const peta_ = `<div class="pt2-peta">
    <div id="rsPeta" class="pt2-kanvas" role="application" aria-label="${esc(t("rs3.peta.label"))}"></div>
    <div id="rsTip" class="pt2-tip" role="status" hidden></div>
    <details class="pt2-lapis" id="rsLapis" open><summary><span>${esc(t("rs3.lapis"))}</span></summary><div class="pt2-lapis-isi" id="rsLapisIsi"></div></details>
    <details class="pt2-panel" id="rsPanel" open><summary id="rsPanelJ"><span>${esc(t("rs3.panel"))}</span></summary><div class="pt2-panel-isi" id="rsPanelIsi" aria-live="polite"></div></details>
  </div>`;
  isi.innerHTML = [
    exHtml({ id: "rs-saring", ikon: "cari2", topik: t("rs3.ex.saring"), judulHtml: " ", subHtml: " ", isiHtml: saring }),
    exHtml({ id: "rs-peta", ikon: "peta", topik: t("rs3.ex.peta"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml() + infoMetode(), isiHtml: peta_ }),
    exHtml({ id: "rs-grafik", ikon: "grafik", topik: t("rs3.ex.grafik"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml() + infoMetode(), isiHtml: `<div id="rsGrafik"></div>` }),
    exHtml({ id: "rs-tabel", ikon: "tabel", topik: t("rs3.ex.tabel"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml({ csv: true }) + infoMetode(), isiHtml: `<div id="rsTabel"></div>` }),
  ].join("");
  import("/inti/pilih.js").then((m) => m.pasangPilih()).catch(() => {});
  $("rs-tabel").addEventListener("jm:csv", (e) => {
    const baris = terpilih().sort((a, b) => b.skor - a.skor);
    e.detail.baris = [[t("rs3.c.proyek"), t("rs3.c.tek"), t("rs3.c.pemilik"), t("rs3.c.skor"), t("rs3.c.kelas"), t("rs3.c.komp"), t("rs3.c.mw"), t("rs3.c.presisi")],
      ...baris.map((r) => [r.nama, labTek(r.tek), r.pem || "", r.skor, t("rs3.kelas." + r.kelas), Object.entries(r.komponen).filter(([k, c]) => k === "bahaya" || c.v >= (k === "gambut" ? 50 : 1)).map(([k, c]) => labKomp(k, c)).join("; "), r.mw ?? "", t("rs3.pr." + r.presisi)])];
  });
}
function judulEx(id, j, s) { const ex = $(id); if (!ex) return; ex.querySelector(".jm-ex-j").innerHTML = j; ex.querySelector(".jm-ex-sub").innerHTML = s; }
function gambarKepala() {
  const a = SEMUA, kena = (k, f) => a.filter((r) => r.komponen[k] && f(r.komponen[k])).length;
  khUbin("rsAngka", [
    { ikon: "proyek", nilai: N(a.length), label: t("rs3.kh.dinilai") },
    { ikon: "peringatan", nilai: N(a.filter((r) => r.kelas === "tinggi" || r.kelas === "sangat-tinggi").length), label: t("rs3.kh.tinggi") },
    { ikon: "tek-bio", nilai: N(kena("hutan", (c) => c.v >= 100)), label: t("rs3.kh.hutan") },
    { ikon: "tek-listrik", nilai: N(kena("gambut", (c) => c.v >= 50)), label: t("rs3.kh.gambut") },
  ]);
}
function gambarSemua() {
  const rows = terpilih();
  $("rsHapus").hidden = !(S.q || S.tek || S.kelas);
  judulEx("rs-saring", hlHtml("rs3.ex.saring.j", N(rows.length)), esc(t("rs3.ex.saring.s", { mw: N(jumlahMw(rows)) })));
  judulEx("rs-peta", hlHtml("rs3.ex.peta.j", N(rows.length)), esc(t("rs3.ex.peta.s", { n: N(D.meta.tak_dinilai || 0) })));
  gambarLapis();
  petaData(rows);
  gambarPanel();
  gambarGrafik();
  gambarTabel(rows);
}

/* ---------- lapisan ---------- */
function gambarLapis() {
  const per = {}; for (const r of terpilih(true)) per[r.kelas] = (per[r.kelas] || 0) + 1;
  const kl = KELAS.filter((k) => per[k] || S.kelas === k).map((k) => `<li><button type="button" class="pt2-leg" data-kl="${k}" aria-pressed="${S.kelas === k}"><i class="pt2-titik rs3-t-${k}" aria-hidden="true"></i><span>${esc(t("rs3.kelas." + k))}</span><b>${N(per[k] || 0)}</b></button></li>`).join("");
  const lp = (k) => `<li><button type="button" class="pt2-leg pt2-sak" data-lp="${k}" aria-pressed="${S.lapis[k]}"><i class="rs3-sw rs3-sw-${k}" aria-hidden="true"></i><span>${esc(t("rs3.lapis." + k))}</span></button></li>`;
  const hk = S.lapis.hutan ? `<ul class="rs3-hk">${["konservasi", "lindung", "produksi", "konversi"].map((k) => `<li><i class="rs3-hk-${k}" aria-hidden="true"></i>${esc(t("rs3.kt.hutan." + k))}</li>`).join("")}</ul>` : "";
  $("rsLapisIsi").innerHTML = `<p class="pt2-leg-j">${esc(t("rs3.lapis.kelas"))}</p><ul class="pt2-leg-daftar">${kl}</ul>
    <p class="pt2-leg-j">${esc(t("rs3.lapis.j"))}</p><ul class="pt2-leg-daftar">${["hutan", "gambut", "adat", "bahaya"].map(lp).join("")}</ul>${hk}
    <p class="pt2-attr">${esc(t("rs3.lapis.attr"))}</p>`;
}

/* ---------- peta ---------- */
let peta = null, petaSiap = false;
const GEO = {};
const fitur = (rows) => ({ type: "FeatureCollection", features: rows.map((r) => ({ type: "Feature", geometry: { type: "Point", coordinates: [r.lng, r.lat] }, properties: { i: r.i, k: r.kelas, mw: r.mw || 0 } })) });
const RAD = ["interpolate", ["linear"], ["sqrt", ["max", ["get", "mw"], 1]], 1, 4.5, 10, 7, 30, 11, 60, 16];
const petaData = (rows) => { if (peta && petaSiap) { peta.getSource("rs")?.setData(fitur(rows)); peta.setFilter("rs-sel", ["==", ["get", "i"], S.pilih]); } };
async function lapisGeo(k) {
  if (!peta || !petaSiap) return;
  const vis = S.lapis[k] ? "visible" : "none";
  if (k === "bahaya") {
    if (!peta.getSource("bahaya")) {
      peta.addSource("bahaya", { type: "image", url: "/img/risiko/bahaya_multi.png", coordinates: [[95, 6.1], [141.1, 6.1], [141.1, -11.1], [95, -11.1]] });
      peta.addLayer({ id: "bahaya", type: "raster", source: "bahaya", paint: { "raster-opacity": 0.7, "raster-fade-duration": 0 } }, "rs-titik");
    }
    peta.setLayoutProperty("bahaya", "visibility", vis); return;
  }
  if (!peta.getSource(k) && S.lapis[k]) {
    try { GEO[k] ||= await fetch(`/data/geo/risiko_${k}.geojson`, { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error(k); return r.json(); }); } catch (e) { S.lapis[k] = false; gambarLapis(); return; }
    const warnaFill = k === "hutan" ? ["match", ["get", "k"], ...Object.entries(WARNA_HUTAN).flatMap(([a, v]) => [a, warna(v)]), warna("--ink2")] : k === "gambut" ? warna("--lg-bronze") : warna("--tp-industri");
    peta.addSource(k, { type: "geojson", data: GEO[k] });
    peta.addLayer({ id: k, type: "fill", source: k, paint: { "fill-color": warnaFill, "fill-opacity": k === "hutan" ? 0.5 : 0.6 } }, "rs-titik");
  }
  if (peta.getLayer(k)) peta.setLayoutProperty(k, "visibility", vis);
}
function pasangLapisan() {
  const il = rapikanPeta(peta);
  peta.addSource("rs", { type: "geojson", data: fitur(terpilih()) });
  peta.addLayer({ id: "rs-titik", type: "circle", source: "rs", paint: {
    "circle-color": ["match", ["get", "k"], ...KELAS.flatMap((k) => [k, warna(WARNA[k])]), warna("--ink2")], "circle-radius": RAD,
    "circle-opacity": 0.9, "circle-stroke-color": warna("--card"), "circle-stroke-width": 1.5 } });
  peta.addLayer({ id: "rs-sel", type: "circle", source: "rs", filter: ["==", ["get", "i"], S.pilih], paint: { "circle-color": "rgba(0,0,0,0)", "circle-radius": ["+", RAD, 4], "circle-stroke-color": warna("--sorot"), "circle-stroke-width": 3 } });
  pasangBatas(peta, warna, il, "rs-titik");
  for (const k of Object.keys(S.lapis)) if (S.lapis[k]) lapisGeo(k);
}
const padPeta = () => {
  const box = $("rsPeta").getBoundingClientRect(), p = { top: 16, bottom: 16, left: 12, right: 12 };
  if (innerWidth < 1000) return p;
  for (const id of ["rsLapis", "rsPanel"]) {
    const r = $(id).getBoundingClientRect(), tengah = r.left + r.width / 2 - box.left;
    if (tengah < box.width / 2) p.left = Math.max(p.left, r.right - box.left + 16); else p.right = Math.max(p.right, box.right - r.left + 16);
  }
  return p;
};
function tampilTip(r, pt) {
  const tip = $("rsTip");
  tip.innerHTML = `<b>${esc(r.nama)}</b><span>${esc(labTek(r.tek))}${r.mw != null ? `, ${esc(N(r.mw, r.mw < 10 ? 1 : 0))} MW` : ""}</span>${pilKelas(r)}`;
  tip.hidden = false;
  const w = $("rsPeta").clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
  tip.style.left = Math.min(Math.max(pt.x + 14, 8), w - tw - 8) + "px";
  tip.style.top = Math.max(8, pt.y - th - 14) + "px";
}
function bukaPeta() {
  const lo = SEMUA.map((r) => r.lng), la = SEMUA.map((r) => r.lat), BD = [[Math.min(...lo) - 1, Math.min(...la) - 1], [Math.max(...lo) + 1, Math.max(...la) + 1]];
  muatMapLibre().then(() => {
    peta = new maplibregl.Map({ container: "rsPeta", style: gaya(), bounds: BD, fitBoundsOptions: { padding: padPeta() }, minZoom: 2, maxZoom: 11, dragRotate: false, pitchWithRotate: false, attributionControl: false });
    peta.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: t("rs3.attr") }), "bottom-left");
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("style.load", () => { petaSiap = true; pasangLapisan(); });
    new ResizeObserver(() => peta && peta.resize()).observe($("rsPeta"));
    peta.once("idle", () => { peta.resize(); peta.fitBounds(BD, { padding: padPeta(), duration: 0 }); });
    peta.on("click", "rs-titik", (e) => pilihProyek(e.features[0].properties.i, false));
    peta.on("mousemove", "rs-titik", (e) => { peta.getCanvas().style.cursor = "pointer"; const r = SEMUA[e.features[0].properties.i]; if (r) tampilTip(r, e.point); });
    peta.on("mouseleave", "rs-titik", () => { peta.getCanvas().style.cursor = ""; $("rsTip").hidden = true; });
    new MutationObserver(() => { petaSiap = false; peta && peta.setStyle(gaya()); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }).catch(() => { $("rsPeta").innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("rs3.peta.galat"))}</p></div>`; });
}

/* ---------- panel ---------- */
function pilihProyek(i, fokus) {
  S.pilih = i; gambarPanel(); petaData(terpilih());
  const r = SEMUA[i];
  if (fokus && peta && r) peta.flyTo({ center: [r.lng, r.lat], zoom: Math.max(peta.getZoom(), 6.5), padding: padPeta(), duration: 600 });
  $("rsPanel").open = true;
}
function barKomp(k, c) {
  return `<span class="rs3-ch rs3-c-${k}">${svg(IKK[k])}${esc(t("rs3.komp." + k))}</span><b>${c.v}</b>`;
}
function gambarPanel() {
  const el = $("rsPanelIsi"), r = SEMUA[S.pilih];
  if (r && cocok(r)) {
    const baris = (k, v) => `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>`;
    const komp = Object.entries(r.komponen).map(([k, c]) => `<div class="rs3-det-k">${barKomp(k, c)}<small class="jm-bantu">${esc(k === "bahaya" ? t("rs3.d.bahaya", { rinci: Object.entries(c.rinci || {}).map(([a, v]) => `${t("rs3.bh." + a)} ${N(v * 100)}`).join(", ") }) : labKomp(k, c))}</small></div>`).join("");
    el.innerHTML = `<button type="button" class="jm-tbl jm-tbl-kecil pt2-kembali" data-aksi="kembali">${ikon("panah-kiri", 16)}<span>${esc(t("pt2.d.kembali"))}</span></button>
      <p class="pt2-det-nama"><b>${r.profil ? `<a href="/p/${esc(r.id)}">${esc(r.nama)}</a>` : esc(r.nama)}</b></p>
      <div class="pt2-det-pil">${pilTek(r.tek)}${pilKelas(r)}</div>
      <div class="pt2-det">${komp}</div>
      <dl class="pt2-det">${baris("rs3.c.mw", r.mw == null ? "-" : `${esc(N(r.mw, r.mw < 10 ? 1 : 0))} MW`)}${baris("rs3.c.pemilik", selPem(r))}${baris("pj.c.prov", selProv(r))}${baris("rs3.c.presisi", esc(t("rs3.pr." + r.presisi)))}${r.dikeluarkan.length ? baris("rs3.d.keluar", esc(r.dikeluarkan.map((k) => t("rs3.komp." + k)).join(", "))) : ""}</dl>`;
    $("rsPanelJ").firstElementChild.textContent = t("rs3.panel.rinci");
    return;
  }
  S.pilih = -1;
  const top = terpilih().slice().sort((a, b) => b.skor - a.skor || (b.mw || 0) - (a.mw || 0)).slice(0, 8);
  el.innerHTML = top.length ? `<ol class="pt2-rank">${top.map((x, n) => `<li><button type="button" class="pt2-rank-b" data-i="${x.i}"><span class="jm-rank${n < 3 ? " jm-rank-top" : ""}">${n + 1}</span><span class="pt2-rank-t"><b>${esc(x.nama)}</b><span class="pt2-rank-s">${pilTek(x.tek)}</span></span><span class="pt2-rank-v">${pilKelas(x)}</span></button></li>`).join("")}</ol>` : `<div class="jm-kosong">${ikon("info", 24)}<p>${esc(t("jm.kosong.cocok"))}</p></div>`;
  $("rsPanelJ").firstElementChild.textContent = t("rs3.panel");
}

/* ---------- grafik: sebaran kelas risiko per teknologi ---------- */
function gambarGrafik() {
  const rows = terpilih(true), per = new Map();
  for (const r of rows) { const k = per.get(r.tek) || per.set(r.tek, { tek: r.tek, n: 0, jml: 0, kelas: { "sangat-tinggi": 0, tinggi: 0, sedang: 0, rendah: 0 } }).get(r.tek); k.n++; k.jml += r.skor; k.kelas[r.kelas]++; }
  const st = [...per.values()].sort((a, b) => (b.kelas["sangat-tinggi"] + b.kelas.tinggi) / b.n - (a.kelas["sangat-tinggi"] + a.kelas.tinggi) / a.n || b.n - a.n), el = $("rsGrafik");
  const tinggi = st.reduce((s, x) => s + x.kelas.tinggi + x.kelas["sangat-tinggi"], 0);
  judulEx("rs-grafik", hlHtml("rs3.ex.grafik.j", N(tinggi)), esc(t("rs3.ex.grafik.s", { n: N(rows.length) })));
  if (!st.length) { el.innerHTML = `<div class="jm-kosong">${ikon("info", 24)}<p>${esc(t("jm.kosong.cocok"))}</p></div>`; return; }
  const baris = st.map((x) => ({ id: x.tek, label: labTek(x.tek), labelHtml: pilTek(x.tek), sorot: S.tek === x.tek,
    bagian: KELAS.slice().reverse().map((k) => ({ nilai: x.kelas[k], kelas: "rs3-b-" + k })), teks: t("rs3.g.nilai", { a: N(x.kelas.tinggi + x.kelas["sangat-tinggi"]), b: N(x.n) }) }));
  el.innerHTML = `<ul class="rs3-g-leg">${KELAS.slice().reverse().map((k) => `<li><i class="rs3-b-${k}" aria-hidden="true"></i>${esc(t("rs3.kelas." + k))}</li>`).join("")}</ul>${batangHtml(baris, { label: t("rs3.ex.grafik") })}`;
  pasangBar(el);
  const lis = el.querySelectorAll(".jm-batang>li.jm-bar-b");
  st.forEach((x, i) => {
    const li = lis[i]; if (!li) return;
    li.removeAttribute("title");
    li.dataset.tip = `${labTek(x.tek)}: ${t("rs3.g.tip", { n: N(x.n), r: N(x.jml / x.n), a: N(x.kelas["sangat-tinggi"]), b: N(x.kelas.tinggi), c: N(x.kelas.sedang), d: N(x.kelas.rendah) })}`;
    li.tabIndex = 0;
  });
}

/* ---------- tabel ---------- */
function gambarTabel(rows) {
  judulEx("rs-tabel", hlHtml("rs3.ex.tabel.j", N(rows.length)), esc(t("rs3.ex.tabel.s", { mw: N(jumlahMw(rows)) })));
  const el = document.createElement("div"); $("rsTabel").replaceChildren(el);
  TABEL.hal = 1;
  pasangTabel(el, KOLOM, rows, TABEL, "jm.kosong.cocok");
}

function pasangEvent() {
  const seg = (fn) => { fn(); nanti(gambarSemua); };
  $("rsQ").addEventListener("input", (e) => seg(() => { S.q = e.target.value.trim().toLowerCase(); }));
  $("rsTek").addEventListener("change", (e) => seg(() => { S.tek = e.target.value; }));
  $("rsKl").addEventListener("change", (e) => seg(() => { S.kelas = e.target.value; }));
  $("rsHapus").addEventListener("click", () => { S.q = S.tek = S.kelas = ""; $("rsQ").value = ""; for (const id of ["rsTek", "rsKl"]) $(id).value = ""; nanti(gambarSemua); });
  $("rsLapis").addEventListener("click", (e) => {
    const k = e.target.closest("[data-kl]"), l = e.target.closest("[data-lp]");
    if (k) { S.kelas = S.kelas === k.dataset.kl ? "" : k.dataset.kl; $("rsKl").value = S.kelas; nanti(gambarSemua); }
    if (l) { const n = l.dataset.lp; S.lapis[n] = !S.lapis[n]; l.setAttribute("aria-pressed", String(S.lapis[n])); nanti(() => { lapisGeo(n); gambarLapis(); }); }
  });
  $("rsPanel").addEventListener("click", (e) => {
    const b = e.target.closest(".pt2-rank-b"), k = e.target.closest("[data-aksi=kembali]");
    if (b) pilihProyek(+b.dataset.i, true);
    if (k) { S.pilih = -1; gambarPanel(); petaData(terpilih()); }
  });
}
function mulai() {
  kerangka(); gambarKepala(); pasangEvent();
  if (innerWidth >= 1000) { geserPanel($("rsLapis"), { kunci: "lapis" }); geserPanel($("rsPanel"), { kunci: "panel" }); }
  gambarSemua(); bukaPeta();
}
mulai();
saatBahasa(() => { if (peta) { peta.remove(); peta = null; petaSiap = false; } mulai(); });
