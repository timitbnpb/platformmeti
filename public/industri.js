/* /industri: dua tab. (1) Captive power: PLTU milik industri (GEM + Climate TRACE), peta, analisa MW EBT pengganti per kawasan.
   (2) Mineral kritis dan hilirisasi: smelter, prekursor, sel baterai, bauksit/tembaga, graf kawasan -> pembangkit -> smelter -> produk -> pembeli,
   intensitas emisi per ton (EST, rumus terbuka), ekspor UN Comtrade. Data = potret statis /data/captive_power.json dan /data/hilirisasi.json.
   INP: filter dan segmen mengubah chrome seketika, peta/tabel/grafik menyusul lewat nanti(). */
import { t, angka, bahasa } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml, galatHtml } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { tabHalaman } from "/inti/tab_halaman.js";
import { khUbin } from "/inti/kh.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas } from "/inti/peta_indonesia.js";
import { pilTek } from "/inti/ikon_tek.js";
import { exHtml, sumberHtml, pilihHtml, cariHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { geserPanel } from "/inti/panel_geser.js";
import { batangHtml, pasangBar } from "/analisis.js";
import "/inti/tip_grafik.js";

const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const ambil = (u) => fetch(u, { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
const nama = (iso) => { try { return new Intl.DisplayNames([bahasa()], { type: "region" }).of(iso.toUpperCase()); } catch { return iso; } };
const bdr = (iso, u = 20) => (iso ? `<img class="in3-bdr" src="/img/bendera/${esc(iso)}.svg" width="${u}" height="${Math.round(u * 0.7)}" alt="" title="${esc(nama(iso))}" loading="lazy" decoding="async">` : "");
const lambang = (kode, u = 20) => (kode ? `<img class="in3-lb" src="/img/provinsi/${esc(kode)}.png" width="${u}" height="${u}" alt="" loading="lazy" decoding="async">` : "");
const estPil = () => `<span class="jm-pil jm-pil-est">${esc(t("pj.est"))}</span>`;
const hipPil = () => `<span class="jm-pil jm-pil-warn">${esc(t("kl.hipotesis"))}</span>`;
const urlAman = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
const sumberLink = (arr) => arr.map((s) => (urlAman(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.judul)}</a>` : esc(s.judul))).join("<br>");
const kosong = `<span class="in3-nol" title="${esc("-")}">-</span>`;

/* pil berwarna per nilai (aturan pemilik: label kategori beda warna). k = token CSS. */
const WARNA_IND = { nikel: "--tp-hidro", aluminium: "--tp-bayu", "pulp-kertas": "--tp-bio", "kawasan-industri": "--tp-industri", kimia: "--tp-simpan", baja: "--tp-karbon", semen: "--tp-sampah", tekstil: "--tp-adil", "logam-lain": "--tp-biaya", lainnya: "--ink2" };
const WARNA_ST = { operasi: "--ok", konstruksi: "--warn", rencana: "--info", batal: "--bad" };
const WARNA_RT = { smelter: "--tp-panas", prekursor: "--tp-simpan", sel: "--tp-listrik", logam: "--tp-bayu" };
const WARNA_LS = { "captive-pltu": "--bad", jaringan: "--info", "ebt-hidro": "--tp-hidro" };
const IKON_RT = { smelter: "pabrik", prekursor: "jenis", sel: "tek-listrik", logam: "tag" };
const pil = (peta, kode, kunci, ik) => `<span class="in3-pil in3-k-${kode}" data-k="${esc(kode)}">${ik ? ikon(ik, 14) : `<i class="in3-titik" aria-hidden="true"></i>`}${esc(t(kunci))}</span>`;
const pilInd = (k) => pil(WARNA_IND, k, "in3.ind." + k);
const pilSt = (k) => pil(WARNA_ST, k, "in3.st." + k);
const pilRt = (k) => pil(WARNA_RT, k, "in3.rt." + k, IKON_RT[k]);
const pilLs = (k) => (k ? pil(WARNA_LS, k, "in3.ls." + k) : kosong);
const satuan = (s) => t("in3.sat." + (/MHP/.test(s) ? "mhp" : /GWh/.test(s) ? "gwh" : /konsentrat/.test(s) ? "konsentrat" : /Al\//.test(s) ? "al" : "ni"));
const un = (k) => `${N(k.nilai, k.nilai < 100 ? 1 : 0)} ${satuan(k.satuan)}`;
const kapasitas = (b) => { const k = b.kapasitas; if (!k) return ""; if (k.alternatif) return k.alternatif.map(un).join(` ${t("in3.atau")} `); if (k.rentang) return `${t("pel.rentang", { a: N(k.rentang[0], 1), b: N(k.rentang[1], 1) })} ${satuan(k.satuan)}`; return k.nilai == null ? "" : un(k); };
const ketKap = (b) => (b.kapasitas?.ket ? `<p class="in3-cat">${esc(b.kapasitas.ket)}${(b.kapasitas.alternatif || []).filter((a) => urlAman(a.url)).map((a) => ` <a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.ket)}</a>`).join("")}</p>` : "");
const orgChip = (o) => {
  const mk = o.logo ? `<img src="${esc(o.logo)}" width="20" height="20" alt="" loading="lazy" decoding="async" data-galat="hapus">` : `<span class="in3-ini" aria-hidden="true">${esc(String(o.nama).replace(/^(PT|CV)\s+/i, "").charAt(0).toUpperCase())}</span>`;
  const isi = `${mk}<span>${esc(o.nama)}</span>${bdr(o.negara, 16)}`;
  return o.org_id ? `<a class="in3-org" href="/o/${esc(o.org_id)}">${isi}</a>` : `<span class="in3-org">${isi}</span>`;
};

/* ---------- muat ---------- */
const isiC = $("inC"), isiH = $("inH");
isiC.innerHTML = hantuHtml(6);
await mulaiHalaman();
let CP, HI;
try { [CP, HI] = await Promise.all([ambil("/data/captive_power.json"), ambil("/data/hilirisasi.json")]); } catch (e) {
  isiC.innerHTML = exHtml({ isiHtml: galatHtml("jaringan") });
  isiC.querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw e;
}
const PL = CP.pembangkit, ZN = CP.kawasan, KV = CP.proyek_konversi, M = CP.meta, SM = HI.baris;
const ZN_ID = new Map(ZN.map((z) => [z.id, z]));
const PL_ID = new Map(PL.map((p) => [p.id, p]));
const pctNikel = Math.round(((M.per_industri.nikel || 0) / M.mw_operasi) * 100);
khUbin("inAngka", [
  { ikon: "petir", nilai: N(M.mw_operasi / 1000, 1), satuan: "GW", label: t("in3.kh.mw") },
  { ikon: "tek-panas", nilai: N(M.pct_batubara, 1), satuan: "%", label: t("in3.kh.batubara") },
  { ikon: "pabrik", nilai: N(HI.meta.jumlah_smelter_nikel), label: t("in3.kh.smelter") },
  { ikon: "grafik", nilai: N(HI.meta.nikel_ton_operasi / 1000), label: t("in3.kh.nikel") },
]);

/* ================= TAB 1: CAPTIVE POWER ================= */
const SK = { sk: "bauran", bauran: "seimbang" };
const BAURAN = { surya: { surya: 0.45, bayu: 0.15, firm: 0.4 }, seimbang: { surya: 0.3, bayu: 0.2, firm: 0.5 }, firm: { surya: 0.2, bayu: 0.1, firm: 0.7 } };
const FK = CP.parameter.fk_ebt;
const ebt = (mwh, b) => { const per = (k) => (mwh * b[k]) / (CP.parameter.jam * FK[k]); const s = per("surya"), y = per("bayu"), f = per("firm"); return { surya: s, bayu: y, firm: f, total: s + y + f }; };
const C = { ind: new Set(Object.keys(WARNA_IND)), st: new Set(["operasi", "konstruksi", "rencana"]), ebt: true, cari: "", fi: "", fs: "", urut: "mw", hal: 1, zona: "" };
const PER = 10;
const BATAS_C = [[97.5, -9], [132, 4.8]];
const padPeta = () => (innerWidth < 1000 ? { top: 16, bottom: 16, left: 12, right: 12 } : { top: 16, bottom: 16, left: 300, right: 380 });
let petaC, siapC = false, hoverC = null;
const warnaInd = (p) => p.industri[0] || "lainnya";

function fiturPL() {
  return { type: "FeatureCollection", features: PL.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lng, p.lat] }, properties: { id: p.id, ind: warnaInd(p), st: p.status, mw: p.mw_operasi || p.mw_konstruksi || p.mw_rencana || 1 } })) };
}
function fiturEbt() {
  return { type: "FeatureCollection", features: KV.filter((k) => Number.isFinite(k.lat)).map((k) => ({ type: "Feature", geometry: { type: "Point", coordinates: [k.lng, k.lat] }, properties: { id: k.id, mw: k.mw || 1 } })) };
}
function petaKerangka() {
  isiC.innerHTML = `
  <div id="inCPeta"></div>
  <div id="inCAnalisa"></div>
  <div id="inCTabel"></div>
  <div id="inCProyek"></div>
  <div id="inCMetode"></div>`;
  const j = hlHtml("in3.c.peta.j", N(M.mw_operasi) + " MW", { n: pctNikel });
  $("inCPeta").innerHTML = exHtml({ ikon: "peta", topik: t("in3.c.peta"), judulHtml: j, subHtml: `${esc(t("in3.c.peta.s", { n: N(M.jumlah_pembangkit), k: N(M.mw_konstruksi) }))} ${estPil()}`, aksiHtml: aksiHtml() + sumberHtml(sumberLink(CP.sumber)),
    isiHtml: `<div class="in3-peta"><div id="inCKanvas" class="in3-kanvas" role="application" aria-label="${esc(t("in3.c.peta.label"))}"></div><div id="inCTip" class="in3-tip" role="status" hidden></div>
      <details class="in3-lapis" id="inCLapis" open><summary><span>${esc(t("in3.lapis"))}</span></summary><div class="in3-lapis-isi" id="inCLapisIsi"></div></details>
      <details class="in3-panel" id="inCPanel" open><summary id="inCPanelJ"><span>${esc(t("in3.c.panel"))}</span></summary><div class="in3-panel-isi" id="inCPanelIsi"></div></details></div>` });
  lapisC(); panelZona(); bukaPetaC();
  geserPanel($("inCLapis"), { kunci: "lapis" }); geserPanel($("inCPanel"), { kunci: "panel" });
  if (innerWidth < 1000) { $("inCLapis").open = false; $("inCPanel").open = false; }
}
function lapisC() {
  const jum = {}; for (const p of PL) { const k = warnaInd(p); jum[k] = (jum[k] || 0) + 1; }
  const ind = Object.keys(WARNA_IND).filter((k) => jum[k]).map((k) => `<label class="in3-cek">${`<input type="checkbox" data-ind="${esc(k)}"${C.ind.has(k) ? " checked" : ""}>`}${pilInd(k)}<small>${N(jum[k])}</small></label>`).join("");
  const st = ["operasi", "konstruksi", "rencana"].map((k) => `<label class="in3-cek"><input type="checkbox" data-st="${k}"${C.st.has(k) ? " checked" : ""}>${pilSt(k)}</label>`).join("");
  $("inCLapisIsi").innerHTML = `<h4>${esc(t("in3.lapis.ind"))}</h4><div class="in3-cekdaftar">${ind}</div><h4>${esc(t("in3.lapis.st"))}</h4><div class="in3-cekdaftar">${st}</div>
    <label class="in3-cek in3-cek-ebt"><input type="checkbox" data-ebt${C.ebt ? " checked" : ""}><span class="in3-pil in3-k-ebt">${ikon("tek-surya", 14)}${esc(t("in3.lapis.ebt"))}</span><small>${N(KV.filter((k) => Number.isFinite(k.lat)).length)}</small></label>
    <p class="in3-cat">${esc(t("in3.lapis.ukuran"))}</p>`;
}
function filterC() {
  if (!petaC || !siapC) return;
  petaC.setFilter("pl", ["all", ["in", ["get", "ind"], ["literal", [...C.ind]]], ["in", ["get", "st"], ["literal", [...C.st]]]]);
  petaC.setLayoutProperty("ebt", "visibility", C.ebt ? "visible" : "none");
}
function lapisPeta() {
  rapikanPeta(petaC);
  petaC.addSource("pl", { type: "geojson", data: fiturPL() });
  petaC.addSource("ebt", { type: "geojson", data: fiturEbt() });
  const ms = ["match", ["get", "ind"]]; for (const [k, v] of Object.entries(WARNA_IND)) ms.push(k, warna(v)); ms.push(warna("--ink2"));
  const r = ["interpolate", ["linear"], ["sqrt", ["get", "mw"]], 1, 4, 30, 9, 70, 22, 120, 34];
  petaC.addLayer({ id: "pl", type: "circle", source: "pl", paint: { "circle-color": ms, "circle-radius": r, "circle-opacity": ["match", ["get", "st"], "operasi", 0.85, "konstruksi", 0.55, 0.3], "circle-stroke-color": warna("--card"), "circle-stroke-width": 1.5 } });
  petaC.addLayer({ id: "pl-sel", type: "circle", source: "pl", filter: ["==", ["get", "id"], ""], paint: { "circle-color": "rgba(0,0,0,0)", "circle-radius": r, "circle-stroke-color": warna("--sorot"), "circle-stroke-width": 3 } });
  petaC.addLayer({ id: "ebt", type: "circle", source: "ebt", paint: { "circle-color": warna("--ok"), "circle-radius": ["interpolate", ["linear"], ["sqrt", ["get", "mw"]], 1, 4, 30, 8, 60, 14], "circle-opacity": 0.9, "circle-stroke-color": warna("--card"), "circle-stroke-width": 2 } });
  pasangBatas(petaC, warna, undefined, "pl");
  siapC = true; filterC();
}
function bukaPetaC() {
  muatMapLibre().then(() => {
    petaC = new maplibregl.Map({ container: "inCKanvas", style: gaya(), bounds: BATAS_C, fitBoundsOptions: { padding: padPeta() }, minZoom: 2, maxZoom: 11, dragRotate: false, pitchWithRotate: false, attributionControl: false });
    petaC.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    petaC.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    petaC.on("style.load", () => { siapC = false; lapisPeta(); });
    new ResizeObserver(() => petaC.resize()).observe($("inCKanvas"));
    petaC.once("idle", () => { petaC.resize(); petaC.fitBounds(BATAS_C, { padding: padPeta(), duration: 0 }); });
    petaC.on("click", "pl", (e) => pilihPL(e.features[0].properties.id, false));
    petaC.on("click", "ebt", (e) => tipEbt(e.features[0].properties.id, e.point, true));
    for (const ly of ["pl", "ebt"]) {
      petaC.on("mousemove", ly, (e) => { petaC.getCanvas().style.cursor = "pointer"; ly === "pl" ? tipPL(e.features[0].properties.id, e.point) : tipEbt(e.features[0].properties.id, e.point); });
      petaC.on("mouseleave", ly, () => { petaC.getCanvas().style.cursor = ""; $("inCTip").hidden = true; });
    }
    new MutationObserver(() => { siapC = false; petaC.setStyle(gaya()); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }).catch(() => { $("inCKanvas").innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("in3.peta.galat"))}</p></div>`; });
}
function taruhTip(tip, wadah, pt) {
  tip.hidden = false;
  tip.style.left = Math.max(8, Math.min(wadah.clientWidth - tip.offsetWidth - 8, pt.x + 16)) + "px";
  tip.style.top = Math.max(8, Math.min(wadah.clientHeight - tip.offsetHeight - 8, pt.y + 16)) + "px";
}
function tipPL(id, pt) {
  const p = PL_ID.get(id); if (!p) return;
  const urut = PL.filter((x) => x.mw_operasi).sort((a, b) => b.mw_operasi - a.mw_operasi), rk = urut.indexOf(p) + 1;
  const rata = M.mw_operasi / PL.filter((x) => x.mw_operasi).length;
  const bd = p.mw_operasi ? t("in3.tip.rata", { x: N(p.mw_operasi / rata, 1) }) : "";
  $("inCTip").innerHTML = `<header><strong>${esc(p.nama)}</strong><small>${esc(p.wilayah || "")}${p.kota ? ", " + esc(p.kota) : ""}</small></header>
    <p>${p.industri.map(pilInd).join(" ") || pilInd("lainnya")} ${pilSt(p.status)}</p>
    <ul><li><span>${esc(t("in3.tip.mw"))}</span><b>${N(p.mw_operasi || p.mw_konstruksi || p.mw_rencana)} MW</b></li>${p.mw_operasi ? `<li><span>${esc(t("in3.tip.rank"))}</span><b>${rk}/${urut.length}</b></li>` : ""}
    ${p.emisi_tco2e ? `<li><span>${esc(t("in3.tip.emisi", { y: p.emisi_tahun }))}</span><b>${N(p.emisi_tco2e / 1e6, 2)} Mt</b></li>` : ""}</ul><small class="in3-bd">${esc(bd)}</small>`;
  taruhTip($("inCTip"), $("inCKanvas"), pt);
}
function tipEbt(id, pt, klik) {
  const k = KV.find((x) => x.id === id); if (!k) return;
  $("inCTip").innerHTML = `<header><strong>${esc(k.nama)}</strong><small>${esc(t("in3.tek." + k.teknologi))}</small></header><ul><li><span>${esc(t("in3.tip.mw"))}</span><b>${N(k.mw)} MW</b></li><li><span>${esc(t("in3.tip.status"))}</span><b>${esc(k.status)}</b></li></ul>`;
  taruhTip($("inCTip"), $("inCKanvas"), pt);
  if (klik && k.proyek_id) $("inCTip").insertAdjacentHTML("beforeend", `<a class="in3-tautan" href="/p/${esc(k.proyek_id)}">${esc(t("in3.buka"))}</a>`);
}
const sumberUnit = (p) => `<a href="${esc(p.url_wiki || "#")}" target="_blank" rel="noopener noreferrer">${esc(t("in3.sumber.gem"))}</a>`;
function pilihPL(id, terbang) {
  const p = PL_ID.get(id); if (!p) return;
  if (petaC && siapC) { petaC.setFilter("pl-sel", ["==", ["get", "id"], id]); if (terbang) petaC.flyTo({ center: [p.lng, p.lat], zoom: Math.max(petaC.getZoom(), 8), duration: 700 }); }
  const z = p.zona ? ZN_ID.get(p.zona) : null;
  $("inCPanelJ").firstElementChild.textContent = p.nama; $("inCPanel").open = true;
  $("inCPanelIsi").innerHTML = `<p>${p.industri.map(pilInd).join(" ") || pilInd("lainnya")} ${pilSt(p.status)}</p>
    <div class="in3-angka"><div class="in3-an"><span>${esc(t("in3.mw.op"))}</span><b>${N(p.mw_operasi)}</b><small>MW</small></div><div class="in3-an"><span>${esc(t("in3.mw.kon"))}</span><b>${N(p.mw_konstruksi + p.mw_rencana)}</b><small>MW</small></div>
    <div class="in3-an"><span>${esc(t("in3.emisi", { y: p.emisi_tahun || "" }))}</span><b>${p.emisi_tco2e ? N(p.emisi_tco2e / 1e6, 2) : "-"}</b><small>Mt CO2e</small></div><div class="in3-an"><span>${esc(t("in3.tahun"))}</span><b>${p.tahun_mulai ? p.tahun_mulai[0] : "-"}</b><small>${esc(t("in3.bakar"))}</small></div></div>
    <h4>${esc(t("in3.pemilik"))}</h4><div class="in3-chip">${p.pemilik_org.map((o) => orgChip({ ...o, negara: "" })).join("")}</div>
    ${z ? `<h4>${esc(t("in3.kawasan"))}</h4><p class="in3-p">${lambang(z.kode)} <b>${esc(z.nama)}</b> ${z.kawasan_id ? `<a class="in3-tautan" href="/lokasi-hijau">${esc(t("in3.hijau"))}</a>` : ""}</p>` : ""}
    <p class="in3-cat">${sumberUnit(p)} ${p.emisi_tco2e ? `<a class="in3-tautan" href="/topik?id=karbon">${esc(t("in3.karbon"))}</a>` : ""}</p>
    <button type="button" class="jm-tbl jm-tbl-kecil" data-aksi="zona">${ikon("peta", 16)}<span>${esc(t("in3.kembali"))}</span></button>`;
}
function panelZona() {
  $("inCPanelJ").firstElementChild.textContent = t("in3.c.panel"); C.zona = "";
  petaC && siapC && petaC.setFilter("pl-sel", ["==", ["get", "id"], ""]);
  $("inCPanelIsi").innerHTML = `<ol class="in3-rank">${ZN.map((z, i) => `<li><button type="button" data-zona="${esc(z.id)}"><span class="in3-no">${i + 1}</span>${lambang(z.kode, 22)}<span class="in3-rank-n"><b>${esc(z.nama)}</b><small>${esc(t("in3.rank.emisi", { e: N(z.emisi_tco2e / 1e6, 1) }))}</small></span><span class="in3-pil in3-k-captive-pltu"><i class="in3-titik" aria-hidden="true"></i>${N(z.mw_operasi + z.mw_konstruksi)} MW</span></button></li>`).join("")}</ol>`;
}
function terbangZona(id) {
  const z = ZN_ID.get(id); if (!z || !petaC) return;
  petaC.flyTo({ center: [z.lng, z.lat], zoom: 8.2, duration: 800 });
}

/* analisa: MW EBT pengganti */
function barisAnalisa() {
  const b = BAURAN[SK.bauran];
  return ZN.filter((z) => z.mw_operasi > 0).map((z) => ({ z, e: ebt(z.mwh_tahun, b) })).sort((a, c) => c.e.total - a.e.total);
}
function analisa() {
  const rows = barisAnalisa(), totalE = rows.reduce((s, r) => s + r.e.total, 0), totalP = rows.reduce((s, r) => s + r.z.mw_operasi, 0);
  const seg = ["surya", "seimbang", "firm"].map((k) => `<button type="button" data-bauran="${k}" aria-pressed="${SK.bauran === k}">${ikon(k === "surya" ? "tek-surya" : k === "firm" ? "petir" : "analisis", 18)}<span>${esc(t("in3.bauran." + k))}</span></button>`).join("");
  const batang = batangHtml(rows.map(({ z, e }) => ({ id: z.id, label: `${z.nama} (${t("in3.a.pltu")} ${N(z.mw_operasi)} MW, ${N(e.total / z.mw_operasi, 1)}x)`, labelHtml: `${lambang(z.kode, 22)}<span>${esc(z.nama)}</span>`, teks: `${N(e.total)} MW`, bagian: [{ nilai: e.surya, kelas: "in3-s-surya" }, { nilai: e.bayu, kelas: "in3-s-bayu" }, { nilai: e.firm, kelas: "in3-s-firm" }] })), { label: t("in3.a.label"), satuan: "MW" });
  const urut = rows.map(({ z, e }, i) => {
    const prop = KV.filter((k) => k.zona === z.id && ["operating", "construction", "konstruksi", "announced", "pre-construction", "rencana"].includes(k.status)).reduce((s, k) => s + (k.mw || 0), 0);
    return `<tr><td data-urut="${i + 1}">${i + 1}</td><td>${lambang(z.kode, 20)}<b>${esc(z.nama)}</b><small>${esc(z.prov)}</small></td><td>${N(z.mw_operasi)}</td><td>${N(z.emisi_tco2e / 1e6, 1)}</td><td>${N(e.total)}</td><td>${N(e.total / z.mw_operasi, 1)}x</td><td>${prop ? N(prop) : kosong}</td><td>${prop ? N(Math.min(100, (prop / e.total) * 100)) + "%" : kosong}</td></tr>`;
  }).join("");
  const top = rows[0];
  $("inCAnalisa").innerHTML = exHtml({ ikon: "kalkulator", topik: t("in3.a"), judulHtml: `${hlHtml("in3.a.j", N(totalE) + " MW", { p: N(totalP) })} ${estPil()} ${hipPil()}`, subHtml: esc(t("in3.a.s", { k: top.z.nama })), aksiHtml: aksiHtml({ csv: true }),
    isiHtml: `<div class="jm-seg in3-seg" role="group" aria-label="${esc(t("in3.bauran"))}" id="inSegBauran">${seg}</div><p class="in3-lg">${["surya", "bayu", "firm"].map((k) => `<span class="in3-lgi"><i class="in3-s-${k}" aria-hidden="true"></i>${esc(t("in3.s." + k))}</span>`).join("")}</p><div id="inABatang">${batang}</div>
      <h3 class="in3-h3">${esc(t("in3.a.rank"))} ${sumberHtml(`${esc(t("in3.a.rumus"))}<br>${esc(t("in3.a.catatan"))}`, t("in3.a.cara"))}</h3>
      <div class="jm-tabel-bungkus"><table class="jm-tabel in3-tabel in3-tabel-an"><thead><tr><th>#</th><th>${esc(t("in3.th.kawasan"))}</th><th>${esc(t("in3.th.pltu"))}</th><th>${esc(t("in3.th.emisi"))}</th><th>${esc(t("in3.th.ebt"))}</th><th>${esc(t("in3.th.rasio"))}</th><th>${esc(t("in3.th.proyek"))}</th><th>${esc(t("in3.th.cakup"))}</th></tr></thead><tbody>${urut}</tbody></table></div>`,
    kakiHtml: `<a class="in3-tautan" href="/metode#industri">${esc(t("in3.metode"))}</a>` });
  pasangBar($("inABatang"));
}

/* tabel pembangkit */
function saringPL() {
  const q = C.cari.trim().toLowerCase();
  const r = PL.filter((p) => (!C.fi || p.industri.includes(C.fi)) && (!C.fs || p.status === C.fs) && (!q || `${p.nama} ${p.kota || ""} ${p.pemilik.join(" ")}`.toLowerCase().includes(q)));
  const k = { mw: (p) => -(p.mw_operasi + p.mw_konstruksi + p.mw_rencana), emisi: (p) => -(p.emisi_tco2e || 0), tahun: (p) => p.tahun_mulai ? p.tahun_mulai[0] : 9999 };
  return r.sort((a, b) => (k[C.urut](a) - k[C.urut](b)) || a.nama.localeCompare(b.nama));
}
function tabelPL() {
  const r = saringPL(), hal = Math.min(C.hal, Math.max(1, Math.ceil(r.length / PER))), baris = r.slice((hal - 1) * PER, hal * PER);
  const isi = baris.map((p) => `<tr data-pl="${esc(p.id)}"><td><b>${esc(p.nama)}</b><small>${esc([p.kota, p.wilayah].filter(Boolean).join(", "))}</small></td><td><div class="in3-chip">${p.pemilik_org.slice(0, 2).map((o) => orgChip({ ...o, negara: "" })).join("")}</div></td><td>${(p.industri.length ? p.industri : ["lainnya"]).map(pilInd).join(" ")}</td><td>${pilSt(p.status)}</td><td>${N(p.mw_operasi + p.mw_konstruksi + p.mw_rencana)}</td><td>${p.tahun_mulai ? p.tahun_mulai[0] : kosong}</td><td>${p.emisi_tco2e ? N(p.emisi_tco2e / 1e6, 2) : kosong}</td></tr>`).join("");
  $("inPLIsi").innerHTML = r.length ? `<div class="jm-tabel-bungkus"><table class="jm-tabel in3-tabel in3-tabel-pl" data-urut="tidak"><thead><tr><th>${esc(t("in3.th.pembangkit"))}</th><th>${esc(t("in3.th.pemilik"))}</th><th>${esc(t("in3.th.industri"))}</th><th>${esc(t("in3.th.status"))}</th><th>MW</th><th>${esc(t("in3.th.tahun"))}</th><th>${esc(t("in3.th.emisi2"))}</th></tr></thead><tbody>${isi}</tbody></table></div>${paginasiHtml({ hal, total: r.length, per: PER, satuan: "in3.u.pembangkit" })}` : `<div class="jm-kosong"><p>${esc(t("in3.kosong"))}</p></div>`;
}
function kerangkaTabel() {
  const opsiInd = [["", t("in3.semua"), "tag"], ...Object.keys(WARNA_IND).filter((k) => PL.some((p) => warnaInd(p) === k)).map((k) => [k, t("in3.ind." + k), "pabrik"])];
  const opsiSt = [["", t("in3.semua"), "status"], ...["operasi", "konstruksi", "rencana"].map((k) => [k, t("in3.st." + k), "status"])];
  const opsiUr = [["mw", t("in3.urut.mw"), "grafik"], ["emisi", t("in3.urut.emisi"), "grafik"], ["tahun", t("in3.urut.tahun"), "tahun"]];
  $("inCTabel").innerHTML = exHtml({ ikon: "tabel", topik: t("in3.tabel"), judulHtml: hlHtml("in3.tabel.j", N(PL.length), { w: N(M.emisi_tco2e_terukur / 1e6) }), subHtml: esc(t("in3.tabel.s")), aksiHtml: aksiHtml({ csv: true }) + sumberHtml(sumberLink(CP.sources || CP.sumber)),
    isiHtml: `<div class="in3-alat">${cariHtml({ id: "inCari", label: t("in3.cari"), placeholder: t("in3.cari") })}${pilihHtml({ id: "inFi", ikon: "tag", label: t("in3.th.industri"), opsi: opsiInd })}${pilihHtml({ id: "inFs", ikon: "status", label: t("in3.th.status"), opsi: opsiSt })}${pilihHtml({ id: "inUr", ikon: "grafik", label: t("in3.urut"), opsi: opsiUr })}</div><div id="inPLIsi"></div>` });
  tabelPL();
}
function proyekC() {
  const kv = KV.filter((k) => !["cancelled", "retired", "shelved"].includes(k.status)).slice(0, 12);
  const stN = (x) => ({ operating: "operasi", construction: "konstruksi", konstruksi: "konstruksi", rencana: "rencana" })[x] || "rencana";
  const kartu = kv.map((k) => `<li class="in3-kt"><p class="in3-kt-a">${pilTek(k.teknologi)}<span class="in3-kt-mw">${N(k.mw)} MW</span></p><p class="in3-kt-n">${k.proyek_id ? `<a href="/p/${esc(k.proyek_id)}">${esc(k.nama)}</a>` : esc(k.nama)}</p><p class="in3-kt-a">${pilSt(stN(k.status))}<span class="in3-kt-s">${esc(k.zona_nama || "")}</span></p>${k.ppa ? `<p class="in3-kt-s">${esc(t("in3.ppa", { p: k.ppa.pembeli, m: k.ppa.mw }))}</p>` : ""}</li>`).join("");
  const mw = kv.reduce((s, k) => s + (k.mw || 0), 0);
  $("inCProyek").innerHTML = exHtml({ ikon: "proyek", topik: t("in3.proyek"), judulHtml: hlHtml("in3.proyek.j", N(mw) + " MW", { n: N(kv.length) }), subHtml: esc(t("in3.proyek.s")), aksiHtml: sumberHtml(sumberLink(CP.sumber.filter((s) => ["gem-ebt", "kor"].includes(s.id)))), isiHtml: `<ul class="in3-kartu">${kartu}</ul>` });
}
function metodeC() {
  const P = CP.parameter;
  const baris = [["fk_batubara", P.fk_batubara], ["fk.surya", P.fk_ebt.surya], ["fk.bayu", P.fk_ebt.bayu], ["fk.firm", P.fk_ebt.firm], ["jam", P.jam]].map(([k, v]) => `<li><span>${esc(t("in3.par." + k))}</span><b>${N(v, v < 10 ? 2 : 0)}</b></li>`).join("");
  $("inCMetode").innerHTML = exHtml({ ikon: "metode", topik: t("in3.metode"), judulHtml: `${esc(t("in3.metode.j"))} ${estPil()} ${hipPil()}`, isiHtml: `<div class="in3-metode"><div><code>${esc(t("in3.rumus.c"))}</code><p>${esc(t("in3.rumus.c2"))}</p><p>${esc(t("in3.a.catatan"))}</p></div><ul class="in3-par">${baris}</ul></div>` });
}
function pasangC() {
  const root = isiC;
  root.addEventListener("click", (e) => {
    const sg = e.target.closest("[data-bauran]");
    if (sg) { SK.bauran = sg.dataset.bauran; for (const b of sg.parentElement.children) b.setAttribute("aria-pressed", String(b === sg)); nanti(analisaUlang); return; }
    const zb = e.target.closest("[data-zona]"); if (zb) { C.zona = zb.dataset.zona; terbangZona(zb.dataset.zona); const z = ZN_ID.get(zb.dataset.zona); zonaDetail(z); return; }
    if (e.target.closest("[data-aksi=zona]")) { panelZona(); return; }
    const tr = e.target.closest("tr[data-pl]"); if (tr) { pilihPL(tr.dataset.pl, true); $("inCPeta").scrollIntoView({ block: "start", behavior: "smooth" }); return; }
    const pg = e.target.closest("#inCTabel .jm-pag [data-hal]");
    if (pg && !pg.disabled) { C.hal = +pg.dataset.hal; sorotHalaman(pg, C.hal); nanti(tabelPL); }
  });
  root.addEventListener("change", (e) => {
    const i = e.target;
    if (i.dataset.ind !== undefined) { i.checked ? C.ind.add(i.dataset.ind) : C.ind.delete(i.dataset.ind); nanti(filterC); }
    else if (i.dataset.st !== undefined) { i.checked ? C.st.add(i.dataset.st) : C.st.delete(i.dataset.st); nanti(filterC); }
    else if (i.dataset.ebt !== undefined) { C.ebt = i.checked; nanti(filterC); }
    else if (i.id === "inFi") { C.fi = i.value; C.hal = 1; nanti(tabelPL); }
    else if (i.id === "inFs") { C.fs = i.value; C.hal = 1; nanti(tabelPL); }
    else if (i.id === "inUr") { C.urut = i.value; C.hal = 1; nanti(tabelPL); }
  });
  root.addEventListener("input", (e) => { if (e.target.id === "inCari") { C.cari = e.target.value; C.hal = 1; nanti(tabelPL); } });
}
function zonaDetail(z) {
  const b = BAURAN[SK.bauran], e = ebt(z.mwh_tahun, b);
  const sm = SM.filter((s) => s.zona === z.id);
  $("inCPanelJ").firstElementChild.textContent = z.nama; $("inCPanel").open = true;
  $("inCPanelIsi").innerHTML = `<p class="in3-p">${lambang(z.kode, 28)} <b>${esc(z.prov)}</b> ${z.kawasan_id ? `<a class="in3-tautan" href="/lokasi-hijau">${esc(t("in3.hijau"))}</a>` : ""}</p>
    <div class="in3-angka"><div class="in3-an"><span>${esc(t("in3.mw.op"))}</span><b>${N(z.mw_operasi)}</b><small>MW</small></div><div class="in3-an"><span>${esc(t("in3.th.emisi"))}</span><b>${N(z.emisi_tco2e / 1e6, 1)}</b><small>Mt CO2e</small></div>
    <div class="in3-an"><span>${esc(t("in3.th.ebt"))}</span><b>${N(e.total)}</b><small>MW ${esc(t("pj.est"))}</small></div><div class="in3-an"><span>${esc(t("in3.th.rasio"))}</span><b>${z.mw_operasi ? N(e.total / z.mw_operasi, 1) : "-"}x</b><small>MW/MW</small></div></div>
    ${sm.length ? `<h4>${esc(t("in3.smelter.kawasan"))}</h4><ul class="in3-daftar">${sm.map((s) => `<li>${pilRt(s.rantai)} <span>${esc(s.nama)}</span></li>`).join("")}</ul>` : ""}
    <button type="button" class="jm-tbl jm-tbl-kecil" data-aksi="zona">${ikon("peta", 16)}<span>${esc(t("in3.kembali"))}</span></button>`;
}
function analisaUlang() { analisa(); }

/* ================= TAB 2: HILIRISASI ================= */
const H = { rt: "semua", cari: "", hal: 1, sel: "" };
const PERH = 8;
let petaH, siapH = false;
const barisH = () => { const q = H.cari.trim().toLowerCase(); return SM.filter((s) => (H.rt === "semua" || s.rantai === H.rt) && (!q || `${s.nama} ${s.pemilik.map((p) => p.nama).join(" ")}`.toLowerCase().includes(q))); };
const SM_ID = new Map(SM.map((s) => [s.id, s]));

function hilirKerangka() {
  isiH.innerHTML = `<div id="inHPeta"></div><div id="inHIntens"></div><div id="inHEkspor"></div><div id="inHTabel"></div>`;
  const seg = ["semua", "smelter", "prekursor", "sel", "logam"].map((k) => `<button type="button" data-rt="${k}" aria-pressed="${H.rt === k}">${ikon(IKON_RT[k] || "analisis", 18)}<span>${esc(t("in3.rt." + k))}</span><small>${N(k === "semua" ? SM.length : SM.filter((s) => s.rantai === k).length)}</small></button>`).join("");
  $("inHPeta").innerHTML = exHtml({ ikon: "rantai", topik: t("in3.h.peta"), judulHtml: hlHtml("in3.h.peta.j", N(HI.meta.nikel_ton_operasi / 1000) + " " + t("in3.rb2"), { n: N(HI.meta.jumlah) }), subHtml: `${esc(t("in3.h.peta.s"))} ${estPil()}`, aksiHtml: aksiHtml() + sumberHtml(sumberLink(HI.sumber)),
    isiHtml: `<div class="jm-seg in3-seg" id="inSegRt" role="group" aria-label="${esc(t("in3.h.seg"))}">${seg}</div>
      <div class="in3-peta"><div id="inHKanvas" class="in3-kanvas" role="application" aria-label="${esc(t("in3.h.peta.label"))}"></div><div id="inHTip" class="in3-tip" role="status" hidden></div>
      <details class="in3-lapis" id="inHLapis" open><summary><span>${esc(t("in3.lapis"))}</span></summary><div class="in3-lapis-isi" id="inHLapisIsi"></div></details>
      <details class="in3-panel" id="inHPanel" open><summary id="inHPanelJ"><span>${esc(t("in3.h.panel"))}</span></summary><div class="in3-panel-isi" id="inHPanelIsi"></div></details></div>` });
  const lg = ["smelter", "prekursor", "sel", "logam"].map((k) => `<div class="in3-lg-r">${pilRt(k)}</div>`).join("");
  $("inHLapisIsi").innerHTML = `<h4>${esc(t("in3.h.lapis.rt"))}</h4><div class="in3-cekdaftar">${lg}</div><label class="in3-cek"><input type="checkbox" data-hpl checked><span class="in3-pil in3-k-captive-pltu">${ikon("petir", 14)}${esc(t("in3.h.lapis.pl"))}</span></label><label class="in3-cek"><input type="checkbox" data-hgaris checked><span class="in3-pil in3-k-garis">${ikon("rantai", 14)}${esc(t("in3.h.lapis.garis"))}</span></label><p class="in3-cat">${esc(t("in3.h.lapis.cat"))}</p>`;
  panelH(); bukaPetaH();
  geserPanel($("inHLapis"), { kunci: "lapis" }); geserPanel($("inHPanel"), { kunci: "panel" });
  if (innerWidth < 1000) { $("inHLapis").open = false; $("inHPanel").open = false; }
  intensitas(); ekspor(); kerangkaTabelH(); proyekMetodeH();
}
function fiturH() {
  const ok = new Set(barisH().map((s) => s.id));
  return { type: "FeatureCollection", features: SM.filter((s) => ok.has(s.id)).map((s) => ({ type: "Feature", geometry: { type: "Point", coordinates: [s.lng, s.lat] }, properties: { id: s.id, rt: s.rantai, st: s.status, mw: s.mw_rata || 20 } })) };
}
function garisH() {
  const ok = new Set(barisH().map((s) => s.id)), f = [];
  for (const s of SM) { if (!ok.has(s.id)) continue; for (const id of s.pembangkit_ids) { const p = PL_ID.get(id); if (p) f.push({ type: "Feature", geometry: { type: "LineString", coordinates: [[s.lng, s.lat], [p.lng, p.lat]] }, properties: { s: s.id, jenis: s.tautan_listrik } }); } }
  return { type: "FeatureCollection", features: f };
}
function lapisPetaH() {
  rapikanPeta(petaH);
  petaH.addSource("gr", { type: "geojson", data: garisH() });
  petaH.addSource("plh", { type: "geojson", data: { type: "FeatureCollection", features: PL.filter((p) => p.mw_operasi).map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lng, p.lat] }, properties: { id: p.id, mw: p.mw_operasi } })) } });
  petaH.addSource("sm", { type: "geojson", data: fiturH() });
  petaH.addLayer({ id: "gr", type: "line", source: "gr", paint: { "line-color": warna("--bad"), "line-width": 1.5, "line-opacity": 0.6, "line-dasharray": [2, 2] } });
  petaH.addLayer({ id: "plh", type: "circle", source: "plh", paint: { "circle-color": warna("--bad"), "circle-opacity": 0.22, "circle-radius": ["interpolate", ["linear"], ["sqrt", ["get", "mw"]], 1, 4, 70, 26], "circle-stroke-color": warna("--bad"), "circle-stroke-width": 1 } });
  const ms = ["match", ["get", "rt"]]; for (const [k, v] of Object.entries(WARNA_RT)) ms.push(k, warna(v)); ms.push(warna("--ink2"));
  const r = ["interpolate", ["linear"], ["sqrt", ["get", "mw"]], 1, 7, 40, 12, 120, 20];
  petaH.addLayer({ id: "sm", type: "circle", source: "sm", paint: { "circle-color": ms, "circle-radius": r, "circle-opacity": ["match", ["get", "st"], "operasi", 0.95, "konstruksi", 0.65, 0.35], "circle-stroke-color": warna("--card"), "circle-stroke-width": 2 } });
  petaH.addLayer({ id: "sm-sel", type: "circle", source: "sm", filter: ["==", ["get", "id"], H.sel], paint: { "circle-color": "rgba(0,0,0,0)", "circle-radius": r, "circle-stroke-color": warna("--sorot"), "circle-stroke-width": 4 } });
  pasangBatas(petaH, warna, undefined, "gr");
  siapH = true;
}
function segarkanH() { // chrome sudah berubah; data berat menyusul
  if (petaH && siapH) { petaH.getSource("sm")?.setData(fiturH()); petaH.getSource("gr")?.setData(garisH()); }
  intensitas(); tabelH();
}
function bukaPetaH() {
  muatMapLibre().then(() => {
    petaH = new maplibregl.Map({ container: "inHKanvas", style: gaya(), bounds: BATAS_C, fitBoundsOptions: { padding: padPeta() }, minZoom: 2, maxZoom: 11, dragRotate: false, pitchWithRotate: false, attributionControl: false });
    petaH.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    petaH.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    petaH.on("style.load", () => { siapH = false; lapisPetaH(); });
    new ResizeObserver(() => petaH.resize()).observe($("inHKanvas"));
    petaH.once("idle", () => { petaH.resize(); petaH.fitBounds(BATAS_C, { padding: padPeta(), duration: 0 }); });
    petaH.on("click", "sm", (e) => pilihSM(e.features[0].properties.id, false));
    petaH.on("mousemove", "sm", (e) => { petaH.getCanvas().style.cursor = "pointer"; tipSM(e.features[0].properties.id, e.point); });
    petaH.on("mouseleave", "sm", () => { petaH.getCanvas().style.cursor = ""; $("inHTip").hidden = true; });
    new MutationObserver(() => { siapH = false; petaH.setStyle(gaya()); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }).catch(() => { $("inHKanvas").innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("in3.peta.galat"))}</p></div>`; });
}
function tipSM(id, pt) {
  const s = SM_ID.get(id); if (!s) return;
  const rata = SM.filter((x) => x.intensitas_tco2e_per_ton != null), nas = rata.reduce((a, x) => a + x.intensitas_tco2e_per_ton, 0) / (rata.length || 1);
  $("inHTip").innerHTML = `<header><strong>${esc(s.nama)}</strong><small>${esc(s.provinsi || "")}</small></header><p>${pilRt(s.rantai)} ${pilSt(s.status)}</p><ul><li><span>${esc(t("in3.th.kapasitas"))}</span><b>${kapasitas(s) || "-"}</b></li>${s.mw_rata ? `<li><span>${esc(t("in3.th.listrik"))}</span><b>${N(s.mw_rata)} MW</b></li>` : ""}${s.intensitas_tco2e_per_ton != null ? `<li><span>${esc(t("in3.th.intens"))}</span><b>${N(s.intensitas_tco2e_per_ton, 1)} t/t</b></li>` : ""}</ul>${s.intensitas_tco2e_per_ton != null ? `<small class="in3-bd">${esc(t("in3.tip.vsrata", { r: N(nas, 1) }))}</small>` : ""}`;
  taruhTip($("inHTip"), $("inHKanvas"), pt);
}
function alirHtml(s) {
  const z = s.zona ? ZN_ID.get(s.zona) : null, pls = s.pembangkit_ids.map((id) => PL_ID.get(id)).filter(Boolean);
  const kol = (judul, isi) => `<div class="in3-alir-k"><h5>${esc(t(judul))}</h5>${isi || `<span class="in3-nol">-</span>`}</div>`;
  const pembeli = [...s.pembeli.map((p) => `<span class="in3-chipb">${bdr(p.iso, 18)}<span>${esc(p.nama)}</span></span>`), ...s.ekspor_utama.map((i) => `<span class="in3-chipb">${bdr(i, 18)}<span>${esc(nama(i))}</span></span>`)].join("");
  const ebtp = s.ebt_ids.map((id) => KV.find((k) => k.id === id)).filter(Boolean).map((k) => `<span class="in3-chipb in3-chipb-ebt">${ikon("tek-surya", 14)}<span>${esc(k.nama)}</span></span>`).join("");
  return `<div class="in3-alir">${kol("in3.alir.kawasan", z || s.provinsi ? `<span class="in3-chipb">${lambang(z?.kode || s.kode_prov, 18)}<span>${esc(z?.nama || s.provinsi)}</span></span>` : "")}${kol("in3.alir.listrik", `${pls.slice(0, 3).map((p) => `<button type="button" class="in3-chipb in3-chipb-pl" data-lihatpl="${esc(p.id)}"><span>${esc(p.nama)}</span><small>${N(p.mw_operasi)} MW</small></button>`).join("")}${ebtp}${s.sumber_listrik === "jaringan" ? `<span class="in3-chipb">${pilLs("jaringan")}</span>` : ""}`)}${kol("in3.alir.smelter", `<span class="in3-chipb in3-chipb-sel">${esc(s.nama)}</span>`)}${kol("in3.alir.produk", `<span class="in3-chipb">${esc(s.produk)}</span>`)}${kol("in3.alir.pembeli", pembeli)}</div>`;
}
function pilihSM(id, terbang) {
  const s = SM_ID.get(id); if (!s) return; H.sel = id;
  if (petaH && siapH) { petaH.setFilter("sm-sel", ["==", ["get", "id"], id]); if (terbang) petaH.flyTo({ center: [s.lng, s.lat], zoom: Math.max(petaH.getZoom(), 7), duration: 700 }); }
  $("inHPanelJ").firstElementChild.textContent = s.nama; $("inHPanel").open = true;
  const fakta = [["in3.th.kapasitas", kapasitas(s)], ["in3.th.tek", s.teknologi], ["in3.th.tahun", s.tahun || ""], ["in3.th.listrik", s.mw_rata ? `${N(s.mw_rata)} MW` : ""], ["in3.th.intens", s.intensitas_tco2e_per_ton != null ? `${N(s.intensitas_tco2e_per_ton, 1)} t/t` : ""]].filter((f) => f[1]);
  $("inHPanelIsi").innerHTML = `<p>${pilRt(s.rantai)} ${pilSt(s.status)} ${pilLs(s.sumber_listrik)}</p>${s.ket_status ? `<p class="in3-cat">${esc(s.ket_status)}</p>` : ""}
    <dl class="in3-fakta">${fakta.map(([k, v]) => `<div><dt>${esc(t(k))}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
    ${ketKap(s)}<h4>${esc(t("in3.pemilik"))}</h4><div class="in3-chip">${s.pemilik.map(orgChip).join("")}</div>
    <h4>${esc(t("in3.alir"))}</h4>${alirHtml(s)}
    <div class="in3-tautans"><a class="in3-tautan" href="/rantai?cari=${encodeURIComponent(s.nama)}">${ikon("rantai", 14)}${esc(t("in3.rantai"))}</a><a class="in3-tautan" href="/korporat">${ikon("pabrik", 14)}${esc(t("in3.korporat"))}</a>${s.kawasan_id ? `<a class="in3-tautan" href="/lokasi-hijau">${ikon("lokasi", 14)}${esc(t("in3.hijau"))}</a>` : ""}<a class="in3-tautan" href="/topik?id=karbon">${ikon("tek-panas", 14)}${esc(t("in3.karbon"))}</a></div>
    <p class="in3-cat">${sumberLink(s.sumber)}${s.tingkat_bukti === "perlu-verifikasi" ? ` <span class="jm-pil jm-pil-warn">${esc(t("in3.verifikasi"))}</span>` : ""}</p>
    <button type="button" class="jm-tbl jm-tbl-kecil" data-aksi="daftarH">${ikon("daftar2", 16)}<span>${esc(t("in3.kembali.h"))}</span></button>`;
}
function panelH() {
  $("inHPanelJ").firstElementChild.textContent = t("in3.h.panel"); H.sel = "";
  petaH && siapH && petaH.setFilter("sm-sel", ["==", ["get", "id"], ""]);
  $("inHPanelIsi").innerHTML = `<ul class="in3-daftar in3-daftar-b">${barisH().map((s) => `<li><button type="button" data-sm="${esc(s.id)}">${pilRt(s.rantai)}<span><b>${esc(s.nama)}</b><small>${esc(s.provinsi || "")}${kapasitas(s) ? " | " + kapasitas(s) : ""}</small></span></button></li>`).join("")}</ul>`;
}
function intensitas() {
  const rows = barisH().filter((s) => s.intensitas_tco2e_per_ton != null).sort((a, b) => b.intensitas_tco2e_per_ton - a.intensitas_tco2e_per_ton);
  const kelas = { "captive-pltu": "in3-s-batu", jaringan: "in3-s-jar", "ebt-hidro": "in3-s-hid" };
  const el = $("inHIntens"); const mid = rows.length ? rows[0] : null;
  const batang = rows.length ? batangHtml(rows.map((s) => ({ id: s.id, label: `${s.nama} (${s.mwh_per_ton} MWh/t x ${N(s.faktor_emisi, 2)} t/MWh)`, labelHtml: `${bdr(s.pemilik[0]?.negara, 18)}<span>${esc(s.nama)}</span>`, teks: `${N(s.intensitas_tco2e_per_ton, 1)} t/t`, bagian: [{ nilai: s.intensitas_tco2e_per_ton, kelas: kelas[s.sumber_listrik] || "in3-s-jar" }] })), { label: t("in3.i.label"), satuan: "t" }) : `<div class="jm-kosong"><p>${esc(t("in3.kosong"))}</p></div>`;
  const P = HI.parameter, rum = Object.entries(P.mwh_per_ton).map(([k, v]) => `<li><span>${esc(t("in3.jenis." + k))}</span><b>${N(v, 1)} MWh/t</b></li>`).join("");
  el.innerHTML = exHtml({ ikon: "grafik", topik: t("in3.i"), judulHtml: `${mid ? hlHtml("in3.i.j", N(mid.intensitas_tco2e_per_ton, 1) + " t/t", { n: mid.nama }) : esc(t("in3.i.k"))} ${estPil()} ${hipPil()}`, subHtml: esc(t("in3.i.s")), aksiHtml: aksiHtml() + sumberHtml(`${esc(t("in3.i.rumus"))}<br>${esc(P.catatan_en && bahasa() === "en" ? P.catatan_en : t("in3.i.catatan"))}`, t("in3.a.cara")),
    isiHtml: `<p class="in3-lg">${Object.keys(kelas).map((k) => `<span class="in3-lgi"><i class="${kelas[k]}" aria-hidden="true"></i>${esc(t("in3.ls." + k))}</span>`).join("")}</p><div id="inHBatang">${batang}</div>
      <section class="in3-rumus"><h3 class="in3-h3">${ikon("kalkulator", 18)}${esc(t("in3.i.rumus.j"))}</h3><code>${esc(t("in3.i.rumus"))}</code><ul class="in3-par">${rum}<li><span>${esc(t("in3.par.mhp"))}</span><b>${N(P.kadar_ni_mhp, 2)}</b></li><li><span>${esc(t("in3.par.jar"))}</span><b>${N(P.faktor_emisi.jaringan, 2)}</b></li></ul></section>` });
  pasangBar($("inHBatang"));
}
function ekspor() {
  const E = HI.ekspor, kode = ["7202", "7501", "7502", "7601", "8507"];
  const blok = kode.map((c) => {
    const th = E.nilai[c] || {}, ys = Object.keys(th).sort(), last = th[ys.at(-1)];
    const maks = Math.max(1, ...ys.map((y) => th[y].usd));
    const bt = batangHtml(ys.map((y) => ({ id: y, label: `HS ${c} ${y}`, labelHtml: `<span>${y}</span>`, teks: `US$ ${N(th[y].usd / 1e9, 2)} ${t("in3.mi")}`, bagian: [{ nilai: th[y].usd, kelas: "in3-s-eks" }] })), { maks, label: t("in3.hs." + c) });
    const mt = last.mitra.slice(0, 5).map((m) => `<span class="in3-chipb">${bdr(m.iso, 18)}<span>${esc(m.iso ? nama(m.iso) : "#" + m.kode)}</span><small>${N((m.usd / last.usd) * 100)}%</small></span>`).join("");
    return `<article class="in3-eks"><h3>${esc(t("in3.hs." + c))} <small>HS ${c}</small></h3><div class="eks-bt">${bt}</div><div class="in3-chip">${mt}</div></article>`;
  }).join("");
  const n7202 = E.nilai["7202"], y = Object.keys(n7202).sort().at(-1), cn = n7202[y].mitra.find((m) => m.iso === "cn");
  $("inHEkspor").innerHTML = exHtml({ ikon: "globe", topik: t("in3.e"), judulHtml: hlHtml("in3.e.j", "US$ " + N(n7202[y].usd / 1e9, 1) + " " + t("in3.mi"), { y, p: N(cn ? (cn.usd / n7202[y].usd) * 100 : 0) }), subHtml: esc(t("in3.e.s")), aksiHtml: aksiHtml() + sumberHtml(`${esc(HI.ekspor.hs["7202"])}<br><a href="${esc(HI.sumber[1].url)}" target="_blank" rel="noopener noreferrer">${esc(HI.sumber[1].judul)}</a><br>${esc(t("in3.e.cat", { d: E.diambil }))}`), isiHtml: `<div class="in3-ekspor">${blok}</div>` });
  for (const e of $("inHEkspor").querySelectorAll(".eks-bt")) pasangBar(e);
}
function kerangkaTabelH() {
  $("inHTabel").innerHTML = exHtml({ ikon: "tabel", topik: t("in3.t"), judulHtml: hlHtml("in3.t.j", N(SM.length), { n: N(SM.filter((s) => s.status === "operasi").length) }), subHtml: esc(t("in3.t.s")), aksiHtml: aksiHtml({ csv: true }) + sumberHtml(sumberLink(HI.sumber)),
    isiHtml: `<div class="in3-alat in3-alat-1">${cariHtml({ id: "inHCari", label: t("in3.cari.h"), placeholder: t("in3.cari.h") })}</div><div id="inHTabelIsi"></div>` });
  tabelH();
}
function tabelH() {
  const r = barisH().sort((a, b) => (b.mw_rata ?? -1) - (a.mw_rata ?? -1) || a.nama.localeCompare(b.nama)), hal = Math.min(H.hal, Math.max(1, Math.ceil(r.length / PERH))), baris = r.slice((hal - 1) * PERH, hal * PERH);
  const isi = baris.map((s) => `<tr data-sm="${esc(s.id)}"><td><b>${esc(s.nama)}</b><small>${esc(s.provinsi || "")}</small></td><td><div class="in3-chip">${s.pemilik.slice(0, 2).map(orgChip).join("")}</div></td><td>${pilRt(s.rantai)}<small>${esc(s.produk)}</small></td><td>${kapasitas(s) || kosong}</td><td>${pilSt(s.status)}</td><td>${s.mw_rata ? N(s.mw_rata) : kosong}</td><td>${pilLs(s.sumber_listrik)}</td><td>${s.intensitas_tco2e_per_ton != null ? N(s.intensitas_tco2e_per_ton, 1) : kosong}</td></tr>`).join("");
  $("inHTabelIsi").innerHTML = r.length ? `<div class="jm-tabel-bungkus"><table class="jm-tabel in3-tabel in3-tabel-sm" data-urut="tidak"><thead><tr><th>${esc(t("in3.th.smelter"))}</th><th>${esc(t("in3.th.pemilik"))}</th><th>${esc(t("in3.th.jenis"))}</th><th>${esc(t("in3.th.kapasitas"))}</th><th>${esc(t("in3.th.status"))}</th><th>${esc(t("in3.th.listrik"))}</th><th>${esc(t("in3.th.sumberl"))}</th><th>${esc(t("in3.th.intens"))}</th></tr></thead><tbody>${isi}</tbody></table></div>${paginasiHtml({ hal, total: r.length, per: PERH, satuan: "in3.u.smelter" })}` : `<div class="jm-kosong"><p>${esc(t("in3.kosong"))}</p></div>`;
}
function proyekMetodeH() {
  const sk = HI.sumber.map((s) => s), k = SM.filter((s) => s.tingkat_bukti === "perlu-verifikasi").length;
  $("inH").insertAdjacentHTML("beforeend", `<div id="inHMetode">${exHtml({ ikon: "metode", topik: t("in3.metode"), judulHtml: `${esc(t("in3.hm.j"))} ${hipPil()}`, isiHtml: `<ol class="in3-langkah">${[1, 2, 3, 4].map((i) => `<li><span class="in3-lk-n">${i}</span><h3>${esc(t("in3.hm.t" + i))}</h3><p>${esc(t("in3.hm.p" + i, { n: k }))}</p></li>`).join("")}</ol>` })}</div>`);
  void sk;
}
function pasangH() {
  isiH.addEventListener("click", (e) => {
    const sg = e.target.closest("[data-rt]");
    if (sg && sg.dataset.rt !== H.rt) { H.rt = sg.dataset.rt; H.hal = 1; for (const b of sg.parentElement.children) b.setAttribute("aria-pressed", String(b === sg)); panelH(); nanti(segarkanH); return; }
    const sm = e.target.closest("[data-sm]"); if (sm) { pilihSM(sm.dataset.sm, true); if (sm.closest("tr")) $("inHPeta").scrollIntoView({ block: "start", behavior: "smooth" }); return; }
    if (e.target.closest("[data-aksi=daftarH]")) { panelH(); return; }
    const lp = e.target.closest("[data-lihatpl]"); if (lp) { const p = PL_ID.get(lp.dataset.lihatpl); if (p && petaH) petaH.flyTo({ center: [p.lng, p.lat], zoom: 8, duration: 700 }); return; }
    const pg = e.target.closest("#inHTabel .jm-pag [data-hal]");
    if (pg && !pg.disabled) { H.hal = +pg.dataset.hal; sorotHalaman(pg, H.hal); nanti(tabelH); }
  });
  isiH.addEventListener("change", (e) => {
    const i = e.target;
    if (i.dataset.hpl !== undefined && petaH && siapH) petaH.setLayoutProperty("plh", "visibility", i.checked ? "visible" : "none");
    if (i.dataset.hgaris !== undefined && petaH && siapH) petaH.setLayoutProperty("gr", "visibility", i.checked ? "visible" : "none");
  });
  isiH.addEventListener("input", (e) => { if (e.target.id === "inHCari") { H.cari = e.target.value; H.hal = 1; nanti(() => { panelH(); segarkanH(); }); } });
}

/* ================= tab ================= */
function mulaiC() { petaKerangka(); analisa(); kerangkaTabel(); proyekC(); metodeC(); pasangC(); }
const tab = tabHalaman("tabHal", {
  label: "in3.tab",
  tab: [
    { k: "captive", ikon: "petir", teks: "in3.tab.captive", panel: "panelCaptive", muat: async () => { if (!isiC.dataset.siap) { isiC.dataset.siap = "1"; mulaiC(); } } },
    { k: "hilirisasi", ikon: "rantai", teks: "in3.tab.hilir", panel: "panelHilir", muat: async () => { if (!isiH.dataset.siap) { isiH.dataset.siap = "1"; hilirKerangka(); pasangH(); } } },
  ],
});
void tab;
