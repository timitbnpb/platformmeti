/* /pelacak-proyek: pelacak proyek terpadu (RUPTL + GEM + berita + proyek.json), data = /data/proyek_terpadu.json (scripts/pipa/proyek_terpadu.mjs).
   Peta titik berwarna status (MapLibre), lapisan opsional jaringan OSM (/data/geo/jaringan_osm.geojson, ODbL), grafik selisih COD per teknologi,
   tabel urut berpaginasi. INP: saringan menyalakan chrome seketika, isi berat (peta, grafik, tabel) menyusul lewat nanti(). */
import { t, ada, angka, tanggal } from "/i18n.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { esc, nanti, ikon, hantuHtml, galatHtml } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { exHtml, sumberHtml, cariHtml, pilihHtml, hapusHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { pilTek, pilStatus } from "/inti/ikon_tek.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas, BATAS_ID } from "/inti/peta_indonesia.js";
import { geserPanel } from "/inti/panel_geser.js";
import { siapTautan, tautOrg, tautProvinsi } from "/inti/tautan.js";
import { batangHtml, pasangBar, saatBahasa } from "/analisis.js";
import { pasangTabel, labTek, urlAman } from "/proyek_besar_umum.js";

const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const ST = ["beroperasi", "konstruksi", "izin", "rencana", "ditunda", "dibatalkan", "tidak-diketahui"];
const WARNA_ST = { beroperasi: "--ok", konstruksi: "--warn", izin: "--data5", rencana: "--info", ditunda: "--data3", dibatalkan: "--bad", "tidak-diketahui": "--ink2" };
const S = { q: "", tek: "", status: "", prov: "", pilih: -1, jaringan: { garis: false, gardu: false } };
const TABEL = { k: "mw", arah: -1, hal: 1, turun: ["mw", "telat", "cod_rencana", "cod_terbaru"] };
const PAUSE = '<svg class="jm-ikt jm-ikt-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/></svg>';
const pilSt = (k) => (k === "ditunda" ? `<span class="jm-pil-st jm-st-ditunda">${PAUSE}<span>${esc(t("pj.st.ditunda"))}</span></span>` : pilStatus(k));
const jenisKunci = (j) => { const k = String(j || "").replace(/^gem-.*/, "gem"); return ada("pt2.sj." + k) ? "pt2.sj." + k : "pt2.sj.proyek"; };
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme:dark)").matches);
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");

await mulaiHalaman();
siapTautan("org");
const isi = $("ptIsi");
isi.innerHTML = hantuHtml(6);
let D, SEMUA;
try {
  D = await fetch("/data/proyek_terpadu.json", { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error("data"); return r.json(); });
} catch (e) {
  isi.innerHTML = galatHtml("jaringan");
  isi.querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw e;
}
/* baris tampil: yang ragu belum digabung dan tidak dihitung; titik berpresisi provinsi disebar sekali di sekitar pusat provinsinya */
SEMUA = D.baris.filter((r) => !r.ragu);
SEMUA.forEach((r, i) => { r.i = i; r.pem = r.pemilik ? r.pemilik.nama : null; r.pemId = r.pemilik ? r.pemilik.org_id : null; });
{
  const grup = new Map();
  for (const r of SEMUA) {
    r.px = r.lng; r.py = r.lat;
    if (r.lat == null || r.presisi !== "provinsi") continue;
    const k = r.prov_kode || "x", n = grup.get(k) || 0; grup.set(k, n + 1);
    const a = n * 2.39996, d = n ? 0.16 * Math.sqrt(n) : 0;
    r.px = r.lng + d * Math.cos(a); r.py = r.lat + d * Math.sin(a);
  }
}
{
  const p = new URLSearchParams(location.search);
  if (ST.includes(p.get("status"))) S.status = p.get("status");
  if (SEMUA.some((r) => r.tek === p.get("tek"))) S.tek = p.get("tek");
  if (SEMUA.some((r) => r.prov_kode === p.get("prov"))) S.prov = p.get("prov");
}

/* ---------- olah ---------- */
const cocok = (r, abaikanTek) => (abaikanTek || !S.tek || r.tek === S.tek) && (!S.status || r.status === S.status) && (!S.prov || r.prov_kode === S.prov)
  && (!S.q || `${r.nama} ${r.pem || ""} ${r.prov || ""}`.toLowerCase().includes(S.q));
const terpilih = (abaikanTek) => SEMUA.filter((r) => cocok(r, abaikanTek));
const labelTelat = (r) => (r.telat == null ? "-" : r.telat > 0 ? t("pt2.sel.telat", { n: N(r.telat) }) : r.telat === 0 ? t("pt2.sel.tepat") : t("pt2.sel.awal", { n: N(-r.telat) }));
const kelasTelat = (r) => (r.telat > 0 ? "pt2-sel-telat" : r.telat === 0 ? "pt2-sel-tepat" : "pt2-sel-awal");
const jenisTelat = (r) => t(r.telat_jenis === "lewat" && r.telat === 0 ? "pt2.jenis.tempo" : "pt2.jenis." + r.telat_jenis);
const pilSel = (r) => (r.telat == null ? `<span class="jm-bantu">-</span>` : `<span class="pt2-sel ${kelasTelat(r)}" title="${esc(jenisTelat(r))}">${esc(labelTelat(r))}</span><small class="pt2-sel-j">${esc(jenisTelat(r))}</small>`);
const pilSelKecil = (r) => (r.telat == null ? "" : `<span class="pt2-sel ${kelasTelat(r)}">${esc(labelTelat(r))}</span>`);
const selPem = (r) => {
  if (!r.pem) return `<span class="jm-bantu">-</span>`;
  const logo = logoOrgSatu(r.pemId, r.pem, r.pemilik && r.pemilik.logo);
  return `<span class="pb-pem">${logo ? `<img class="pb-logo" src="${esc(logo)}" alt="" width="22" height="22" loading="lazy" data-galat="hapus">` : ""}<span class="pb-pem-t"><span>${r.pemId ? tautOrg(r.pemId, r.pem) : esc(r.pem)}</span>${r.pemilik && r.pemilik.lainnya > 0 ? `<small class="jm-bantu">${esc(t("pt2.lainnya", { n: N(r.pemilik.lainnya) }))}</small>` : ""}</span></span>`;
};
const selProv = (r) => (r.prov ? `<span class="pt2-prov">${r.prov_kode ? tautProvinsi(r.prov) : esc(r.prov)}</span>` : `<span class="jm-bantu">-</span>`);
const selNama = (r) => `<b>${r.profil ? `<a class="jm-pj-nm" href="/p/${esc(r.id)}">${esc(r.nama)}</a>` : esc(r.nama)}</b><div class="pb-prov">${selProv(r)}</div>`;
const infoSumber = (r) => {
  const u = urlAman(r.status_sumber.url), j = t(jenisKunci(r.status_sumber.jenis)), media = r.status_sumber.media ? ` (${esc(r.status_sumber.media)})` : "";
  const tgl = r.status_sumber.tanggal ? ` ${esc(/^\d{4}-\d{2}-\d{2}$/.test(r.status_sumber.tanggal) ? tanggal(r.status_sumber.tanggal) : r.status_sumber.tanggal)}` : "";
  const cod = r.cod_rencana ? `<br>${esc(t("pt2.s.cod", { r: r.cod_rencana, t: r.cod_terbaru ?? "-" }))}` : "";
  return `<b>${esc(t("pt2.s.status"))}</b> ${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(j)}</a>` : esc(j)}${media}${tgl}${cod}<br>${esc(t("pt2.s.asal"))} ${esc(r.asal.map((a) => t(jenisKunci(a))).join(", "))}`;
};
const KOLOM = [
  ["nama", "pj.c.nama", selNama],
  ["tek", "pj.c.tek", (r) => pilTek(r.tek), "jm-tengah"],
  ["status", "pj.c.status", (r) => pilSt(r.status), "jm-tengah"],
  ["pem", "pj.c.pemilik", selPem],
  ["mw", "pj.c.kap", (r) => (r.mw == null ? `<span class="jm-bantu">-</span>` : `${N(r.mw, r.mw < 10 ? 1 : 0)} <span class="jm-pj-sat">MW</span>`), "jm-num"],
  ["cod_rencana", "pt2.c.rencana", (r) => r.cod_rencana ?? "-", "jm-tengah"],
  ["cod_terbaru", "pt2.c.terbaru", (r) => r.cod_terbaru ?? "-", "jm-tengah"],
  ["telat", "pt2.c.selisih", pilSel, "jm-tengah"],
  [null, "pj.c.sumber", (r) => sumberHtml(infoSumber(r)), "jm-tengah"],
];
const jumlahMw = (a) => a.reduce((s, r) => s + (r.mw || 0), 0);

/* ---------- kerangka ---------- */
let peta = null, petaSiap = false, JAR = null;
const SRC_IKON = () => sumberHtml(`${D.meta.sumber.map((s) => esc(s)).join("<br>")}<br>${esc(t("pt2.s.lisensi"))}`);
function kerangka() {
  const tekAda = [...new Set(SEMUA.map((r) => r.tek))].sort((a, b) => labTek(a).localeCompare(labTek(b), "id"));
  const provAda = new Map(); for (const r of SEMUA) if (r.prov_kode) provAda.set(r.prov_kode, r.prov);
  const hit = (f) => SEMUA.reduce((m, r) => (f(r) && (m[f(r)] = (m[f(r)] || 0) + 1), m), {});
  const cTek = hit((r) => r.tek), cSt = hit((r) => r.status), cPv = hit((r) => r.prov_kode);
  const saring = `<div class="jm-saring pt2-saring" id="ptSaring" role="group" aria-label="${esc(t("pt2.saring"))}">
    ${cariHtml({ id: "ptQ", label: t("pt2.cari"), placeholder: t("pt2.cari.ph") })}
    ${pilihHtml({ id: "ptTek", ikon: "jenis", label: t("pj.f.tek"), opsi: [["", t("pt2.semua.tek")], ...tekAda.map((k) => [k, labTek(k), "tek:" + k, cTek[k]])], nilai: S.tek })}
    ${pilihHtml({ id: "ptSt", ikon: "status", label: t("pj.f.status"), opsi: [["", t("pt2.semua.st")], ...ST.filter((k) => cSt[k]).map((k) => [k, t("pj.st." + k), k === "ditunda" ? "jam" : "st:" + k, cSt[k]])], nilai: S.status })}
    ${pilihHtml({ id: "ptPv", ikon: "lokasi", label: t("pt2.f.prov"), opsi: [["", t("pt2.semua.prov")], ...[...provAda].sort((a, b) => a[1].localeCompare(b[1], "id")).map(([k, n]) => [k, n, "prov:" + k, cPv[k]])], nilai: S.prov })}
    ${hapusHtml({ id: "ptHapus", label: t("pt2.f.hapus") })}</div>`;
  const peta_ = `<div class="pt2-peta">
    <div id="ptPeta" class="pt2-kanvas" role="application" aria-label="${esc(t("pt2.peta.label"))}"></div>
    <div id="ptTip" class="pt2-tip" role="status" hidden></div>
    <details class="pt2-lapis" id="ptLapis" open><summary><span>${esc(t("pt2.lapis"))}</span></summary><div class="pt2-lapis-isi" id="ptLapisIsi"></div></details>
    <details class="pt2-panel" id="ptPanel" open><summary id="ptPanelJ"><span>${esc(t("pt2.panel"))}</span></summary><div class="pt2-panel-isi" id="ptPanelIsi" aria-live="polite"></div></details>
  </div>`;
  isi.innerHTML = [
    exHtml({ id: "pt-saring", ikon: "cari2", topik: t("pt2.ex.saring"), judulHtml: " ", subHtml: " ", isiHtml: saring }),
    exHtml({ id: "pt-peta", ikon: "peta", topik: t("pt2.ex.peta"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml() + SRC_IKON(), isiHtml: peta_ }),
    exHtml({ id: "pt-grafik", ikon: "jam", topik: t("pt2.ex.grafik"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml() + sumberHtml(esc(t("pt2.s.metode")) + ` <a href="/metode#apa-isi-angka">${esc(t("pt2.metode"))}</a>`), isiHtml: `<div id="ptGrafik"></div>` }),
    exHtml({ id: "pt-tabel", ikon: "tabel", topik: t("pt2.ex.tabel"), judulHtml: " ", subHtml: " ", aksiHtml: aksiHtml({ csv: true }) + SRC_IKON(), isiHtml: `<div id="ptTabel"></div>` }),
  ].join("");
  import("/inti/pilih.js").then((m) => m.pasangPilih()).catch(() => {});
  $("pt-tabel").addEventListener("jm:csv", (e) => {
    const k = KOLOM.filter((c) => c[0]), baris = terpilih().sort(urutan(TABEL));
    e.detail.baris = [[...k.map((c) => t(c[1])), t("pt2.c.dasar")], ...baris.map((r) => [r.nama, labTek(r.tek), t("pj.st." + r.status), r.pem || "", r.mw ?? "", r.cod_rencana ?? "", r.cod_terbaru ?? "", r.telat == null ? "" : labelTelat(r), `${t(jenisKunci(r.status_sumber.jenis))} ${r.status_sumber.url || ""}`.trim()])];
  });
}
const urutan = (T) => (x, y) => {
  const u = x[T.k], v = y[T.k];
  if (u === v) return String(x.nama).localeCompare(String(y.nama));
  if (u == null) return 1;
  if (v == null) return -1;
  return (typeof u === "number" ? u - v : String(u).localeCompare(String(v), "id")) * T.arah;
};

/* ---------- isi yang bergantung saringan ---------- */
function judulEx(id, judulHtml, subHtml) {
  const ex = $(id); if (!ex) return;
  ex.querySelector(".jm-ex-j").innerHTML = judulHtml;
  ex.querySelector(".jm-ex-sub").innerHTML = subHtml;
}
function gambarKepala(rows) {
  khUbin("ptAngka", [
    { ikon: "proyek", nilai: N(rows.length), label: t("pt2.kh.proyek") },
    { ikon: "petir", nilai: N(jumlahMw(rows) / 1000, 1), satuan: "GW", label: t("pt2.kh.mw") },
    { ikon: "jam", nilai: N(rows.filter((r) => r.telat > 0).length), label: t("pt2.kh.telat") },
    { ikon: "tambah", nilai: N(rows.filter((r) => r.asal.length === 1 && r.asal[0] === "gem").length), label: t("pt2.kh.gem") },
  ]);
}
function gambarSemua() {
  const rows = terpilih();
  $("ptHapus").hidden = !(S.q || S.tek || S.status || S.prov);
  gambarKepala(rows);
  const berkoord = rows.filter((r) => r.px != null).length;
  judulEx("pt-saring", hlHtml("pt2.ex.saring.j", N(rows.length)), `${esc(t("pt2.ex.saring.s", { mw: N(jumlahMw(rows)) }))}`);
  judulEx("pt-peta", hlHtml("pt2.ex.peta.j", N(berkoord)), esc(t("pt2.ex.peta.s", { n: N(rows.length - berkoord) })));
  gambarLegenda(rows);
  petaData(rows);
  gambarPanel();
  gambarGrafik();
  gambarTabel(rows);
}

/* ---------- legenda dan lapisan ---------- */
function gambarLegenda(rows) {
  const per = {}; for (const r of terpilih(true).filter((x) => cocokTanpaStatus(x))) per[r.status] = (per[r.status] || 0) + 1;
  const st = ST.filter((k) => per[k] || S.status === k).map((k) => `<li><button type="button" class="pt2-leg" data-st="${k}" aria-pressed="${S.status === k}"><i class="pt2-titik pt2-t-${k}" aria-hidden="true"></i><span>${esc(t("pj.st." + k))}</span><b>${N(per[k] || 0)}</b></button></li>`).join("");
  const jar = (k, kunci, ik) => `<li><button type="button" class="pt2-leg pt2-sak" data-jar="${k}" aria-pressed="${S.jaringan[k]}">${ikon(ik, 16)}<span>${esc(t(kunci))}</span></button></li>`;
  $("ptLapisIsi").innerHTML = `<ul class="pt2-leg-daftar">${st}</ul>
    <p class="pt2-leg-j">${esc(t("pt2.jaringan"))}</p>
    <ul class="pt2-leg-daftar">${jar("garis", "pt2.jaringan.garis", "tek-listrik")}${jar("gardu", "pt2.jaringan.gardu", "petir")}</ul>
    <ul class="pt2-kv" aria-label="${esc(t("pt2.jaringan.kv"))}"><li><i class="pt2-kv-500" aria-hidden="true"></i>500 kV</li><li><i class="pt2-kv-275" aria-hidden="true"></i>275 kV</li><li><i class="pt2-kv-150" aria-hidden="true"></i>150 kV</li></ul>
    <p class="pt2-attr">${esc(t("pt2.osm"))}${JAR === "galat" ? ` <b>${esc(t("pt2.jaringan.galat"))}</b>` : ""}</p>`;
}
const cocokTanpaStatus = (r) => { const s = S.status; S.status = ""; const ok = cocok(r); S.status = s; return ok; };

/* ---------- peta ---------- */
function fitur(rows) {
  return { type: "FeatureCollection", features: rows.filter((r) => r.px != null).map((r) => ({ type: "Feature", geometry: { type: "Point", coordinates: [r.px, r.py] }, properties: { i: r.i, s: r.status, mw: r.mw || 0 } })) };
}
const petaData = (rows) => { if (peta && petaSiap) { peta.getSource("pt")?.setData(fitur(rows)); peta.setFilter("pt-sel", ["==", ["get", "i"], S.pilih]); } };
function pasangLapisan() {
  const il = rapikanPeta(peta);
  peta.addSource("pt", { type: "geojson", data: fitur(terpilih()) });
  peta.addLayer({ id: "pt-titik", type: "circle", source: "pt", paint: {
    "circle-color": ["match", ["get", "s"], ...ST.flatMap((k) => [k, warna(WARNA_ST[k])]), warna("--ink2")],
    "circle-radius": ["interpolate", ["linear"], ["sqrt", ["max", ["get", "mw"], 1]], 1, 4.5, 10, 7, 30, 11, 60, 16],
    "circle-opacity": 0.85, "circle-stroke-color": warna("--card"), "circle-stroke-width": 1.5 } });
  peta.addLayer({ id: "pt-sel", type: "circle", source: "pt", filter: ["==", ["get", "i"], S.pilih], paint: { "circle-color": "rgba(0,0,0,0)", "circle-radius": ["+", ["interpolate", ["linear"], ["sqrt", ["max", ["get", "mw"], 1]], 1, 4.5, 10, 7, 30, 11, 60, 16], 4], "circle-stroke-color": warna("--sorot"), "circle-stroke-width": 3 } });
  pasangBatas(peta, warna, il, "pt-titik");
  if (typeof JAR === "object" && JAR) lapisJaringan();
}
function lapisJaringan() {
  if (!peta || !petaSiap || !JAR || JAR === "galat") return;
  if (!peta.getSource("jar")) {
    peta.addSource("jar", { type: "geojson", data: JAR });
    const sebelum = peta.getLayer("pt-titik") ? "pt-titik" : undefined;
    peta.addLayer({ id: "jar-garis", type: "line", source: "jar", filter: ["==", ["geometry-type"], "LineString"], layout: { "line-cap": "round" }, paint: {
      "line-color": ["step", ["get", "v"], warna("--info"), 275, warna("--warn"), 500, warna("--bad")],
      "line-width": ["interpolate", ["linear"], ["zoom"], 4, ["step", ["get", "v"], 0.7, 275, 1.1, 500, 1.6], 9, ["step", ["get", "v"], 1.4, 275, 2, 500, 3]], "line-opacity": 0.85 } }, sebelum);
    peta.addLayer({ id: "jar-gardu", type: "circle", source: "jar", minzoom: 5.5, filter: ["==", ["geometry-type"], "Point"], paint: { "circle-color": warna("--card"), "circle-stroke-color": warna("--ink"), "circle-stroke-width": 1.4, "circle-radius": ["interpolate", ["linear"], ["zoom"], 5.5, 2.5, 10, 5] } }, sebelum);
  }
  peta.setLayoutProperty("jar-garis", "visibility", S.jaringan.garis ? "visible" : "none");
  peta.setLayoutProperty("jar-gardu", "visibility", S.jaringan.gardu ? "visible" : "none");
}
async function jaringanSiap() {
  if (JAR && JAR !== "galat") return lapisJaringan();
  try {
    JAR = await fetch("/data/geo/jaringan_osm.geojson", { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error("jar"); return r.json(); });
    lapisJaringan();
  } catch (e) { JAR = "galat"; S.jaringan = { garis: false, gardu: false }; }
  gambarLegenda();
}
const padPeta = () => {
  const box = $("ptPeta").getBoundingClientRect(), p = { top: 16, bottom: 16, left: 12, right: 12 };
  if (innerWidth < 1000) return p;
  for (const id of ["ptLapis", "ptPanel"]) {
    const r = $(id).getBoundingClientRect(), tengah = r.left + r.width / 2 - box.left;
    if (tengah < box.width / 2) p.left = Math.max(p.left, r.right - box.left + 16); else p.right = Math.max(p.right, box.right - r.left + 16);
  }
  return p;
};
function tampilTip(r, pt) {
  const tip = $("ptTip");
  tip.innerHTML = `<b>${esc(r.nama)}</b><span>${esc(labTek(r.tek))}, ${esc(t("pj.st." + r.status))}${r.mw != null ? `, ${esc(N(r.mw, r.mw < 10 ? 1 : 0))} MW` : ""}</span>${r.telat > 0 ? `<small>${esc(labelTelat(r))}</small>` : ""}`;
  tip.hidden = false;
  const w = $("ptPeta").clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
  tip.style.left = Math.min(Math.max(pt.x + 14, 8), w - tw - 8) + "px";
  tip.style.top = Math.max(8, pt.y - th - 14) + "px";
}
function bukaPeta() {
  muatMapLibre().then(() => {
    peta = new maplibregl.Map({ container: "ptPeta", style: gaya(), bounds: BATAS_ID, fitBoundsOptions: { padding: padPeta() }, minZoom: 2, maxZoom: 11, dragRotate: false, pitchWithRotate: false, attributionControl: false });
    peta.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: t("pt2.osm") }), "bottom-left");
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("style.load", () => { petaSiap = true; pasangLapisan(); });
    new ResizeObserver(() => peta && peta.resize()).observe($("ptPeta"));
    peta.once("idle", () => { peta.resize(); peta.fitBounds(BATAS_ID, { padding: padPeta(), duration: 0 }); });
    peta.on("click", "pt-titik", (e) => pilihProyek(e.features[0].properties.i, false));
    peta.on("mousemove", "pt-titik", (e) => { peta.getCanvas().style.cursor = "pointer"; const r = SEMUA[e.features[0].properties.i]; if (r) tampilTip(r, e.point); });
    peta.on("mouseleave", "pt-titik", () => { peta.getCanvas().style.cursor = ""; $("ptTip").hidden = true; });
    new MutationObserver(() => { petaSiap = false; peta && peta.setStyle(gaya()); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }).catch(() => { $("ptPeta").innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("pt2.peta.galat"))}</p></div>`; });
}

/* ---------- panel: peringkat kapasitas atau rincian satu proyek ---------- */
function pilihProyek(i, fokus) {
  S.pilih = i; gambarPanel(); petaData(terpilih());
  const r = SEMUA[i];
  if (fokus && peta && r && r.px != null) peta.flyTo({ center: [r.px, r.py], zoom: Math.max(peta.getZoom(), 6.5), padding: padPeta(), duration: 600 });
  $("ptPanel").open = true;
}
function gambarPanel() {
  const el = $("ptPanelIsi"), r = SEMUA[S.pilih];
  if (r && cocok(r)) {
    const pil = [pilTek(r.tek), pilSt(r.status)].join("");
    const baris = (k, v) => `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>`;
    const lok = r.presisi === "provinsi" ? ` <small class="jm-bantu">${esc(t("pt2.d.perkiraan"))}</small>` : "";
    el.innerHTML = `<button type="button" class="jm-tbl jm-tbl-kecil pt2-kembali" data-aksi="kembali">${ikon("panah-kiri", 16)}<span>${esc(t("pt2.d.kembali"))}</span></button>
      <p class="pt2-det-nama"><b>${r.profil ? `<a href="/p/${esc(r.id)}">${esc(r.nama)}</a>` : esc(r.nama)}</b></p>
      <div class="pt2-det-pil">${pil}</div>
      <dl class="pt2-det">${baris("pj.c.kap", r.mw == null ? "-" : `${esc(N(r.mw, r.mw < 10 ? 1 : 0))} MW`)}${baris("pj.c.pemilik", selPem(r))}${baris("pj.c.prov", selProv(r) + lok)}${baris("pt2.c.rencana", esc(r.cod_rencana ?? "-"))}${baris("pt2.c.terbaru", `${esc(r.cod_terbaru ?? "-")} ${r.cod_jenis ? `<small class="jm-bantu">${esc(t("pt2.jenis." + r.cod_jenis))}</small>` : ""} ${pilSelKecil(r)}`)}${baris("pt2.d.dasar", infoSumber(r))}</dl>`;
    $("ptPanelJ").firstElementChild.textContent = t("pt2.panel.rinci");
    return;
  }
  S.pilih = -1;
  const top = terpilih().slice().sort((a, b) => (b.mw || 0) - (a.mw || 0)).slice(0, 8);
  el.innerHTML = top.length ? `<ol class="pt2-rank">${top.map((x, n) => `<li><button type="button" class="pt2-rank-b" data-i="${x.i}"><span class="jm-rank${n < 3 ? " jm-rank-top" : ""}">${n + 1}</span><span class="pt2-rank-t"><b>${esc(x.nama)}</b><span class="pt2-rank-s">${pilTek(x.tek)}</span></span><span class="pt2-rank-v"><span class="pt2-mw">${esc(N(x.mw, 0))} MW</span></span></button></li>`).join("")}</ol>` : `<div class="jm-kosong">${ikon("info", 24)}<p>${esc(t("jm.kosong.cocok"))}</p></div>`;
  $("ptPanelJ").firstElementChild.textContent = t("pt2.panel");
}

/* ---------- grafik: selisih COD per teknologi ---------- */
function statTek(rows) {
  const per = new Map();
  for (const r of rows) {
    if (r.telat == null) continue;
    const k = per.get(r.tek) || per.set(r.tek, { tek: r.tek, n: 0, telat: 0, jumlah: 0, maks: 0, jenis: { aktual: 0, perkiraan: 0, lewat: 0 } }).get(r.tek);
    k.n++;
    if (r.telat > 0) { k.telat++; k.jumlah += r.telat; k.maks = Math.max(k.maks, r.telat); k.jenis[r.telat_jenis]++; }
  }
  return [...per.values()].sort((a, b) => b.telat / b.n - a.telat / a.n || b.n - a.n);
}
function gambarGrafik() {
  const st = statTek(terpilih(true)), el = $("ptGrafik");
  const telat = st.reduce((s, x) => s + x.telat, 0), n = st.reduce((s, x) => s + x.n, 0);
  judulEx("pt-grafik", hlHtml("pt2.ex.grafik.j", N(telat)), esc(t("pt2.ex.grafik.s", { n: N(n) })));
  if (!st.length) { el.innerHTML = `<div class="jm-kosong">${ikon("info", 24)}<p>${esc(t("jm.kosong.cocok"))}</p></div>`; return; }
  const baris = st.map((x) => ({ id: x.tek, label: labTek(x.tek), labelHtml: pilTek(x.tek), sorot: S.tek === x.tek,
    bagian: [{ nilai: x.telat, kelas: "pt2-b-telat" }, { nilai: x.n - x.telat, kelas: "pt2-b-tepat" }], teks: t("pt2.g.nilai", { a: N(x.telat), b: N(x.n) }) }));
  el.innerHTML = `<ul class="pt2-g-leg"><li><i class="pt2-b-telat" aria-hidden="true"></i>${esc(t("pt2.g.telat"))}</li><li><i class="pt2-b-tepat" aria-hidden="true"></i>${esc(t("pt2.g.tepat"))}</li></ul>${batangHtml(baris, { label: t("pt2.ex.grafik") })}`;
  pasangBar(el);
  const lis = el.querySelectorAll(".jm-batang>li.jm-bar-b");
  st.forEach((x, i) => {
    const li = lis[i]; if (!li) return;
    li.removeAttribute("title");
    li.dataset.tip = `${labTek(x.tek)}: ${t("pt2.g.tip", { a: N(x.telat), b: N(x.n), p: N((x.telat / x.n) * 100), r: N(x.telat ? x.jumlah / x.telat : 0, 1), m: N(x.maks), j1: N(x.jenis.aktual), j2: N(x.jenis.perkiraan), j3: N(x.jenis.lewat) })}`;
    li.tabIndex = 0;
  });
}

/* ---------- tabel ---------- */
function gambarTabel(rows) {
  const ragu = D.meta.ragu_dikecualikan;
  judulEx("pt-tabel", hlHtml("pt2.ex.tabel.j", N(rows.length), { mw: N(jumlahMw(rows)) }), esc(t("pt2.ex.tabel.s", { n: N(ragu), q: N(D.antrean_tinjau.length) })));
  const box = $("ptTabel"), el = document.createElement("div");
  box.replaceChildren(el);
  TABEL.hal = 1;
  pasangTabel(el, KOLOM, rows.map((r) => r), TABEL, "jm.kosong.cocok");
}

/* ---------- peristiwa ---------- */
function pasangEvent() {
  const seg = (fn) => { fn(); nanti(gambarSemua); };
  $("ptQ").addEventListener("input", (e) => seg(() => { S.q = e.target.value.trim().toLowerCase(); }));
  $("ptTek").addEventListener("change", (e) => seg(() => { S.tek = e.target.value; }));
  $("ptSt").addEventListener("change", (e) => seg(() => { S.status = e.target.value; }));
  $("ptPv").addEventListener("change", (e) => seg(() => { S.prov = e.target.value; }));
  $("ptHapus").addEventListener("click", () => {
    S.q = S.tek = S.status = S.prov = ""; $("ptQ").value = ""; for (const id of ["ptTek", "ptSt", "ptPv"]) $(id).value = "";
    nanti(gambarSemua);
  });
  $("ptLapis").addEventListener("click", (e) => {
    const s = e.target.closest("[data-st]"), j = e.target.closest("[data-jar]");
    if (s) { S.status = S.status === s.dataset.st ? "" : s.dataset.st; $("ptSt").value = S.status; for (const b of $("ptLapis").querySelectorAll("[data-st]")) b.setAttribute("aria-pressed", String(b.dataset.st === S.status)); nanti(gambarSemua); }
    if (j) { const k = j.dataset.jar; S.jaringan[k] = !S.jaringan[k]; j.setAttribute("aria-pressed", String(S.jaringan[k])); nanti(jaringanSiap); }
  });
  $("ptPanel").addEventListener("click", (e) => {
    const b = e.target.closest(".pt2-rank-b"), k = e.target.closest("[data-aksi=kembali]");
    if (b) pilihProyek(+b.dataset.i, true);
    if (k) { S.pilih = -1; gambarPanel(); petaData(terpilih()); }
  });
}
function pasangPanel() {
  if (innerWidth >= 1000) { geserPanel($("ptLapis"), { kunci: "lapis" }); geserPanel($("ptPanel"), { kunci: "panel" }); }
}

function mulai() {
  kerangka();
  pasangEvent();
  pasangPanel();
  gambarSemua();
  bukaPeta();
}
mulai();
saatBahasa(() => { if (peta) { peta.remove(); peta = null; petaSiap = false; } mulai(); });
