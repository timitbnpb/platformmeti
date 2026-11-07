/* /peluang: celah potensi EBT per provinsi, peringkat, proyek terbuka untuk swasta, kalkulator tersemat (gelombang 3 butir H).
   Data = potret statis /data/*.json. Celah = potensi RUEN (2015) dikurangi terpasang HEESI (2025): indikasi (EST), bukan potensi teknis terbaru.
   INP: segmen teknologi berubah seketika (aria-pressed); peta, tabel, kartu menyusul lewat nanti(). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml, galatHtml } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas, geoProvinsi, BATAS_ID } from "/inti/peta_indonesia.js";
import { exHtml, sumberHtml, pilihHtml } from "/inti/komponen.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { ikonTek, pilTek, pilTekTaut } from "/inti/ikon_tek.js";
import { geserPanel } from "/inti/panel_geser.js";
import { PROV } from "/penerbit.js";
import { bukaKelayakan, daftarProvinsi, TEKNOLOGI } from "/inti/kelayakan.js";

const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi"];
const DK = (k) => k.replace("-", "_"); // kunci data peluang.json
const KALK = { surya: "plts", bayu: "pltb", hidro: "mikrohidro", "panas-bumi": "plts", bioenergi: "plts" };
const IK_KALK = { plts: "surya", terapung: "surya", pltb: "bayu", mikrohidro: "hidro" };
const BATAS_KARTU = 12;
const ambil = (u) => fetch(u, { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
const lambang = (kode) => `<img src="/img/provinsi/${esc(kode)}.png" width="20" height="20" alt="" loading="lazy" decoding="async">`;
const labTek = (k) => t("pj.tek." + k);
const urlAman = (u) => (/^https?:\/\//i.test(u || "") ? u : "");

await mulaiHalaman();
const isi = $("pelIsi");
isi.innerHTML = hantuHtml(6);

let PEL, RUPTL, WKP, ATAP, PROY;
try {
  [PEL, RUPTL, WKP, ATAP, PROY] = await Promise.all(["peluang", "ruptl", "wkp", "plts_atap", "proyek"].map((n) => ambil(`/data/${n}.json`)));
} catch (e) {
  isi.innerHTML = `<div class="jm-kartu">${galatHtml("jaringan")}</div>`;
  isi.querySelector("[data-aksi=ulang]").addEventListener("click", () => location.reload());
  throw e;
}

/* ---------- olah data ---------- */
const S = { tek: "semua", prov: "", cod: "", tekP: "" };
const PER_KODE = new Map(PEL.baris.map((b) => [b.kode, b]));
const KODE_NAMA = new Map(PEL.baris.map((b) => [b.nama.toLowerCase(), b.kode]));
const kodeProv = (nama) => (nama ? PROV[String(nama).trim().toLowerCase()] && String(PROV[String(nama).trim().toLowerCase()]) || KODE_NAMA.get(String(nama).toLowerCase()) || "" : "");

/* sel[kode][tek] = {pot, ter, rasio, celah, F} */
function selProv(b, k) {
  const d = DK(k), pot = b.potensi[d]?.mw ?? null, ter = b.terpasang[d]?.mw ?? null;
  return { pot, ter, rasio: b.rasio_pemanfaatan[d]?.persen ?? null, celah: pot !== null && ter !== null ? Math.max(0, pot - ter) : null };
}
const NILAI = new Map(PEL.baris.map((b) => [b.kode, Object.fromEntries(TEK.map((k) => [k, selProv(b, k)]))]));
const celahProv = (kode, tek) => {
  const v = NILAI.get(kode);
  if (tek !== "semua") return v[tek].celah;
  const a = TEK.map((k) => v[k].celah).filter((x) => x !== null);
  return a.length ? a.reduce((x, y) => x + y, 0) : null;
};

/* harga patokan efektif = koefisien tahun 1-10 x F, rentang antar tingkat kapasitas (sen USD/kWh) */
const rentangHarga = (k) => {
  const tk = PEL.harga_patokan.teknologi[DK(k)]?.tingkat || [];
  const v = tk.map((x) => x.koef_1_10).filter(Number.isFinite);
  return v.length ? [Math.min(...v), Math.max(...v)] : null;
};
const teksHarga = (k, F) => { const r = rentangHarga(k); return r ? t("pel.rentang", { a: N(r[0] * F, 1), b: N(r[1] * F, 1) }) : "-"; };

/* proyek terbuka: rencana tanpa pemilik (proyek.json) + baris RUPTL berstatus IPP yang belum ada di proyek.json */
const TERBUKA = [];
const idProyek = new Set();
for (const p of PROY.baris) {
  const st = (p.status || [])[0]?.nilai, prov = p.lokasi?.provinsi;
  if (st !== "rencana" || !prov) continue;
  const pm = (p.pihak || {}).pemilik || [];
  if (pm.length && !pm.every((x) => /^ipp$/i.test(String(x.nilai).trim()))) continue;
  const mw = p.kapasitas?.[0]?.nilai ?? null, cod = (p.cod_target || []).map((x) => x.nilai).filter(Number.isFinite);
  idProyek.add(p.id);
  TERBUKA.push({ id: p.id, nama: p.nama, tek: p.teknologi, kode: kodeProv(prov), prov, mw: Number.isFinite(mw) ? mw : null, cod: cod.length ? Math.min(...cod) : null, href: "/p/" + encodeURIComponent(p.id), sumber: "proyek", hal: null });
}
for (const r of RUPTL.baris) {
  if (r.pengembang_status !== "IPP" || r.status !== "rencana" || !r.provinsi || (r.proyek_id && idProyek.has(r.proyek_id))) continue;
  TERBUKA.push({ id: r.id, nama: r.nama, tek: r.teknologi, kode: kodeProv(r.provinsi), prov: r.provinsi, mw: r.kapasitas_mw ?? null, cod: (r.cod_tahun || [])[0] ?? null, href: r.proyek_id ? "/p/" + encodeURIComponent(r.proyek_id) : "", sumber: "ruptl", hal: r.halaman });
}

/* regional kuota PLTS atap menurut kode provinsi */
const regionalDari = (kode) => { const d = Number(String(kode).slice(0, 2)); return d >= 11 && d <= 21 ? "sum" : (d >= 31 && d <= 36) || d === 51 ? "jmb" : d >= 61 && d <= 65 ? "kal" : "smpnt"; };

/* ---------- kerangka ---------- */
const hl = (n) => `<span class="jm-hl">${esc(n)}</span>`;
const estPil = () => `<span class="jm-pil jm-pil-est">${esc(t("pj.est"))}</span>`;
const hipPil = () => `<span class="jm-pil jm-pil-warn">${esc(t("kl.hipotesis"))}</span>`;
const tglData = () => tanggal(PEL.meta.diperbarui, { gaya: "panjang" });
const srcPeluang = () => sumberHtml(`${esc(t("pel.sumber.ruen"))}<br>${esc(t("pel.sumber.heesi"))}<br>${esc(t("pel.sumber.perpres"))}<br>${esc(t("pel.sumber.tgl", { tgl: tglData() }))}`);

function kerangka() {
  isi.innerHTML = `
  <div id="exPeta">${exHtml({ id: "", ikon: "peta", topik: "", judulHtml: "", isiHtml: `<div class="jm-pel-penuh">
      <div id="pelPeta" class="jm-pel-kanvas" role="application" aria-label="${esc(t("pel.peta.label"))}"></div>
      <details class="jm-pel-lapis" id="pelLapis" open><summary><span>${esc(t("pel.legenda"))}</span></summary><div id="pelLegenda"></div></details>
      <details class="jm-pel-panel" id="pelPanel" open><summary id="pelPanelJ"><span>${esc(t("pel.panel"))}</span></summary><div id="pelPanelIsi" class="jm-pel-panel-isi"></div></details>
    </div>` })}</div>
  <div id="exTabel">${exHtml({ id: "", ikon: "tabel", topik: "", judulHtml: "", isiHtml: `<div id="pelTabel"></div>` })}</div>
  <div id="exProyek">${exHtml({ id: "", ikon: "proyek", topik: "", judulHtml: "", isiHtml: `<div class="jm-saring" id="pelSaring" role="group" aria-label="${esc(t("pel.saring"))}"></div><div id="pelKartu"></div>` })}</div>
  <div id="exKalk">${exHtml({ id: "pelKalkEx", ikon: "analisis", topik: "", judulHtml: "", isiHtml: `<div class="jm-pel-kalk-alat" id="pelKalkAlat"></div><div id="pelKalk" aria-live="polite"></div>` })}</div>
  <div id="exMetode"></div>`;
}
function kepala(id, d) {
  const m = $(id), tmp = document.createElement("div");
  tmp.innerHTML = exHtml({ ...d, isiHtml: "" });
  m.querySelector(".jm-ex-hd").replaceWith(tmp.querySelector(".jm-ex-hd"));
}

function judulSemua() {
  const tek = S.tek, ranking = PEL.baris.map((b) => [b, celahProv(b.kode, tek)]).filter((x) => x[1] !== null).sort((a, z) => z[1] - a[1]);
  const [puncak, v] = ranking[0] || [null, 0];
  const nTek = tek === "semua" ? t("pel.semua_tek") : labTek(tek).toLowerCase();
  kepala("exPeta", { ikon: "peta", topik: t("pel.ex.peta"), judulHtml: puncak ? `${esc(puncak.nama)} ${esc(t("pel.ex.peta.j", { tek: nTek }))} ${hl(N(v) + " MW")}` : esc(t("pel.ex.peta.k")), subHtml: `${esc(t("pel.ex.peta.s"))} ${estPil()}`, aksiHtml: aksiHtml() + srcPeluang() });
  const baris = barisTabel();
  const total = baris.reduce((a, r) => a + (r.celah ?? 0), 0);
  kepala("exTabel", { ikon: "tabel", topik: t("pel.ex.tabel"), judulHtml: `${hl(N(baris.length))} ${esc(t("pel.ex.tabel.j"))} ${hl(N(total) + " MW")}`, subHtml: `${esc(t("pel.ex.tabel.s"))} ${estPil()}`, aksiHtml: aksiHtml({ csv: true }) + srcPeluang() });
  const p = daftarProyek();
  kepala("exProyek", { ikon: "proyek", topik: t("pel.ex.proyek"), judulHtml: `${hl(N(p.length))} ${esc(t("pel.ex.proyek.j"))} ${hl(N(p.reduce((a, r) => a + (r.mw ?? 0), 0)) + " MW")}`, subHtml: esc(t("pel.ex.proyek.s")), aksiHtml: aksiHtml({ csv: true }) + sumberHtml(`${esc(t("pel.sumber.proyek"))}<br>${esc(t("pel.sumber.ruptl"))}<br>${esc(t("pel.sumber.tgl", { tgl: tglData() }))}<br>${esc(PEL.meta.definisi_tanpa_pengembang)}`) });
  kepala("exKalk", { ikon: "analisis", topik: t("pel.ex.kalk"), judulHtml: esc(t("pel.ex.kalk.j")), subHtml: `${esc(t("pel.ex.kalk.s"))} ${hipPil()}`, aksiHtml: "" });
}

/* ---------- hero ---------- */
function hero() {
  const tanpa = PEL.baris.reduce((a, b) => a + b.proyek.rencana_tanpa_pengembang, 0), mwTanpa = PEL.baris.reduce((a, b) => a + b.proyek.mw_rencana_tanpa_pengembang, 0);
  const total = PEL.baris.reduce((a, b) => a + (celahProv(b.kode, "semua") ?? 0), 0);
  khUbin("pelAngka", [
    { ikon: "analisis", nilai: N(total / 1000, 0), satuan: "GW", label: t("pel.k.celah") },
    { ikon: "proyek", nilai: N(tanpa), label: t("pel.k.tanpa") },
    { ikon: "status", nilai: N(mwTanpa / 1000, 1), satuan: "GW", label: t("pel.k.mw") },
    { ikon: "peta", nilai: N(PEL.baris.length), label: t("pel.k.prov") },
  ]);
}
function segmen() {
  const daftar = ["semua", ...TEK];
  $("pelSeg").innerHTML = daftar.map((k) => `<button type="button" class="jm-kl-tb" data-tek="${k}" aria-pressed="${S.tek === k}">${k === "semua" ? ikon("analisis", 20) : ikonTek(k)}<span>${esc(k === "semua" ? t("pel.semua") : labTek(k))}</span></button>`).join("");
}
$("pelSeg").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tek]"); if (!b || b.dataset.tek === S.tek) return;
  S.tek = b.dataset.tek;
  for (const x of $("pelSeg").querySelectorAll("[data-tek]")) x.setAttribute("aria-pressed", String(x === b));
  nanti(segarkanTek);
});

/* ---------- peta ---------- */
let peta = null, petaSiap = false, GEO = null, popup = null;
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
let MAKS = 1;
function fitur() {
  const nilai = GEO.features.map((f) => celahProv(String(f.properties.kode), S.tek));
  MAKS = Math.max(1, ...nilai.filter((x) => x !== null));
  return { type: "FeatureCollection", features: GEO.features.map((f, i) => ({ type: "Feature", geometry: f.geometry, properties: { kode: String(f.properties.kode), nama: PER_KODE.get(String(f.properties.kode))?.nama || "", v: nilai[i] ?? -1, s: nilai[i] === null ? -1 : Math.sqrt(nilai[i] / MAKS) } })) };
}
function legenda() {
  $("pelLegenda").innerHTML = `<div class="jm-pel-grad" aria-hidden="true"></div><div class="jm-pel-grad-n"><span>0</span><span>${esc(N(MAKS))} MW</span></div><p class="jm-pel-nodata"><i aria-hidden="true"></i>${esc(t("pel.legenda.tanpa"))}</p><p class="jm-bantu">${esc(t("pel.legenda.cara"))}</p>`;
}
function pasangLapisan() {
  const il = rapikanPeta(peta);
  peta.addSource("pel", { type: "geojson", data: fitur() });
  peta.addLayer({ id: "pel-isi", type: "fill", source: "pel", paint: { "fill-color": warna("--accent-isi"), "fill-opacity": ["case", ["<", ["get", "s"], 0], 0.05, ["interpolate", ["linear"], ["get", "s"], 0, 0.12, 1, 0.88]] } }, il || undefined);
  peta.addLayer({ id: "pel-sel", type: "line", source: "pel", filter: ["==", ["get", "kode"], S.prov], paint: { "line-color": warna("--sorot"), "line-width": 3 } }, il || undefined);
  pasangBatas(peta, warna, il, "pel-sel");
}
function bukaPeta() {
  muatMapLibre().then(() => {
    peta = new maplibregl.Map({ container: "pelPeta", style: gaya(), bounds: BATAS_ID, fitBoundsOptions: { padding: padPanel() }, minZoom: 2, maxZoom: 9, dragRotate: false, pitchWithRotate: false, attributionControl: { compact: true } });
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("style.load", () => { pasangLapisan(); petaSiap = true; });
    new ResizeObserver(() => peta.resize()).observe($("pelPeta"));
    peta.once("idle", () => { peta.resize(); peta.fitBounds(BATAS_ID, { padding: padPanel(), duration: 0 }); });
    peta.on("click", "pel-isi", (e) => pilihProv(e.features[0].properties.kode, true));
    peta.on("mousemove", "pel-isi", (e) => {
      peta.getCanvas().style.cursor = "pointer";
      const p = e.features[0].properties;
      popup ??= new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10, className: "jm-pel-pop" });
      popup.setLngLat(e.lngLat).setHTML(`<b>${esc(p.nama)}</b><br>${esc(p.v < 0 ? t("pel.tanpa_data") : N(p.v) + " MW")}`).addTo(peta);
    });
    peta.on("mouseleave", "pel-isi", () => { peta.getCanvas().style.cursor = ""; popup?.remove(); });
    const ganti = () => { petaSiap = false; peta.setStyle(gaya()); };
    new MutationObserver(ganti).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }).catch(() => { $("pelPeta").innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("kl.peta.galat"))}</p></div>`; });
}
const padPanel = () => {
  const box = $("pelPeta").getBoundingClientRect(), p = { top: 16, bottom: 16, left: 12, right: 12 };
  if (innerWidth < 1000) return p;
  for (const id of ["pelLapis", "pelPanel"]) {
    const r = $(id).getBoundingClientRect(), tengah = r.left + r.width / 2 - box.left;
    if (tengah < box.width / 2) p.left = Math.max(p.left, r.right - box.left + 16); else p.right = Math.max(p.right, box.right - r.left + 16);
  }
  return p;
};

/* ---------- panel provinsi ---------- */
function kotakAngka(label, nilai, satuan) { return `<div class="jm-pel-an"><span>${esc(label)}</span><b>${esc(nilai)}</b>${satuan ? `<small>${esc(satuan)}</small>` : ""}</div>`; }
function panelProv() {
  const el = $("pelPanelIsi");
  const b = PER_KODE.get(S.prov);
  if (!b) { el.innerHTML = `<div class="jm-kosong jm-pel-kosong">${ikon("peta", 28)}<p>${esc(t("pel.panel.kosong"))}</p></div>`; $("pelPanelJ").firstElementChild.textContent = t("pel.panel"); return; }
  $("pelPanelJ").firstElementChild.textContent = b.nama;
  const v = NILAI.get(b.kode), tek = S.tek, F = b.faktor_lokasi.F;
  const ang = tek === "semua"
    ? [[t("pel.celah"), celahProv(b.kode, "semua"), "MW"], ...TEK.map((k) => [labTek(k), v[k].celah, "MW"])]
    : [[t("pel.celah"), v[tek].celah, "MW"], [t("pel.potensi"), v[tek].pot, "MW"], [t("pel.terpasang"), v[tek].ter, "MW"], [t("pel.rasio"), v[tek].rasio, "%"]];
  const sel = ang.map(([l, n, s]) => kotakAngka(l, n === null ? "-" : N(n, s === "%" ? 1 : 0), n === null ? "" : s)).join("");
  const tekTampil = tek === "semua" ? TEK : [tek];
  const harga = tekTampil.map((k) => `<li>${pilTek(k)}<b>${esc(teksHarga(k, F))}</b></li>`).join("");
  const atapR = regionalDari(b.kode), reg = ATAP.regional.find((r) => r.kode === atapR), kb = ATAP.baris.filter((r) => r.regional === atapR);
  const kuotaTotal = kb.reduce((a, r) => a + (r.kuota_mw || 0), 0), tahunIni = new Date().getFullYear(), kuotaNow = kb.find((r) => r.tahun === tahunIni)?.kuota_mw;
  const wkp = WKP.baris.filter((w) => kodeProv(w.provinsi) === b.kode);
  const tb = TERBUKA.filter((p) => p.kode === b.kode && (tek === "semua" || p.tek === tek));
  el.innerHTML = `<div class="jm-pel-pj">${lambang(b.kode)}<b>${esc(b.nama)}</b><a href="/wilayah/${esc(b.kode)}" class="jm-pel-tautan">${esc(t("pel.profil"))}</a></div>
    <div class="jm-pel-angka">${sel}</div>
    <h4>${esc(t("pel.panel.tanpa"))}</h4>
    <p class="jm-pel-p">${esc(t("pel.panel.tanpa.i", { n: N(tb.length), mw: N(tb.reduce((a, r) => a + (r.mw ?? 0), 0)) }))}</p>
    <h4>${esc(t("pel.panel.wkp"))}</h4>
    <p class="jm-pel-p">${wkp.length ? wkp.map((w) => `${esc(w.nama)} (${esc(w.status)}${w.rencana_mw ? ", " + N(w.rencana_mw) + " MW" : ""})`).join("; ") : esc(t("pel.panel.wkp.kosong"))}</p>
    <h4>${esc(t("pel.panel.atap"))}</h4>
    <p class="jm-pel-p">${esc(t("pel.panel.atap.i", { sistem: reg?.nama || "-", total: N(kuotaTotal), tahun: tahunIni, ini: kuotaNow == null ? "-" : N(kuotaNow) }))}</p>
    <h4>${esc(t("pel.panel.harga", { f: N(F, 2) }))}</h4>
    <ul class="jm-pel-harga">${harga}</ul>
    <p class="jm-bantu">${esc(t("pel.panel.harga.k"))} ${estPil()}</p>
    <button type="button" class="jm-tbl jm-tbl-utama" id="pelHitung">${ikon("analisis", 16)}<span>${esc(t("pel.hitung"))}</span></button>`;
  $("pelHitung").addEventListener("click", () => { kalkProv(b.kode, KALK[tek] || "plts"); $("pelKalkEx").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth", block: "start" }); });
}
function pilihProv(kode, dariPeta) {
  S.prov = String(kode);
  if (peta && petaSiap) peta.setFilter("pel-sel", ["==", ["get", "kode"], S.prov]);
  $("pelPanel").open = true;
  panelProv();
  const sp = $("fprov"); if (sp) { sp.value = S.prov; }
  nanti(() => { kartuProyek(); kepalaProyek(); });
  if (dariPeta && peta && innerWidth >= 1000) { /* peta tidak digeser: panel mengambang di tepi */ }
}

/* ---------- tabel peringkat ---------- */
function barisTabel() {
  const out = [];
  for (const b of PEL.baris) for (const k of TEK) {
    if (S.tek !== "semua" && S.tek !== k) continue;
    const v = NILAI.get(b.kode)[k]; if (v.pot === null) continue;
    const tb = TERBUKA.filter((p) => p.kode === b.kode && p.tek === k);
    out.push({ b, k, ...v, F: b.faktor_lokasi.F, tb: tb.length, tbMw: tb.reduce((a, r) => a + (r.mw ?? 0), 0) });
  }
  return out.sort((a, z) => (z.celah ?? -1) - (a.celah ?? -1));
}
function tabel() {
  const rows = barisTabel();
  const kolom = ["pel.c.prov", "pel.c.tek", "pel.potensi", "pel.terpasang", "pel.rasio", "pel.celah", "pel.c.harga", "pel.c.tb"];
  const td = (i, h, kelas = "", urut = null) => `<td data-label="${esc(t(kolom[i]))}"${kelas ? ` class="${kelas}"` : ""}${urut !== null ? ` data-urut="${urut}"` : ""}>${h}</td>`;
  $("pelTabel").innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-pel-tabel"><thead><tr>${kolom.map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => {
    const h = rentangHarga(r.k);
    return `<tr>${td(0, `<span class="jm-pel-pj">${lambang(r.b.kode)}<a href="/wilayah/${esc(r.b.kode)}">${esc(r.b.nama)}</a></span>`, "", r.b.nama)}${td(1, pilTekTaut(r.k), "jm-tengah", labTek(r.k))}${td(2, N(r.pot), "jm-num", r.pot)}${td(3, r.ter === null ? "-" : N(r.ter), "jm-num", r.ter ?? "")}${td(4, r.rasio === null ? "-" : N(r.rasio, 1) + "%", "jm-num", r.rasio ?? "")}${td(5, r.celah === null ? "-" : N(r.celah), "jm-num jm-pel-celah", r.celah ?? "")}${td(6, esc(teksHarga(r.k, r.F)), "jm-num", h ? h[0] * r.F : "")}${td(7, r.tb ? `${N(r.tb)} (${N(r.tbMw, 1)} MW)` : "-", "jm-num", r.tb)}</tr>`;
  }).join("")}</tbody></table></div><p class="jm-bantu jm-pel-cat">${esc(t("pel.tabel.cat"))}</p>`;
}
$("pelIsi").addEventListener("jm:csv", (e) => {
  const ex = e.target.closest(".jm-ex"); if (!ex) return;
  if (ex.parentElement.id === "exTabel") e.detail.baris = [[t("pel.c.prov"), t("pel.c.tek"), t("pel.potensi") + " MW", t("pel.terpasang") + " MW", t("pel.rasio") + " %", t("pel.celah") + " MW", t("pel.c.harga"), t("pel.c.tb")], ...barisTabel().map((r) => [r.b.nama, labTek(r.k), r.pot, r.ter ?? "", r.rasio ?? "", r.celah ?? "", teksHarga(r.k, r.F), r.tb])];
  else if (ex.parentElement.id === "exProyek") e.detail.baris = [[t("pel.k.nama"), t("pj.c.tek"), t("pj.c.kap"), t("pj.c.prov"), t("pj.c.cod"), t("pel.k.sumber")], ...daftarProyek().map((p) => [p.nama, labTek(p.tek), p.mw ?? "", p.prov, p.cod ?? "", p.sumber])];
}, true);

/* ---------- proyek terbuka ---------- */
const daftarProyek = () => TERBUKA.filter((p) => (S.tek === "semua" || p.tek === S.tek) && (!S.prov || p.kode === S.prov) && (!S.cod || String(p.cod) === S.cod)).sort((a, z) => (z.mw ?? -1) - (a.mw ?? -1));
let nKartu = BATAS_KARTU;
function saring() {
  const tekAdaList = TEK.filter((k) => TERBUKA.some((p) => p.tek === k));
  const cods = [...new Set(TERBUKA.map((p) => p.cod).filter(Boolean))].sort();
  $("pelSaring").innerHTML = pilihHtml({ id: "ftek", ikon: "jenis", label: t("pj.f.tek"), opsi: [["", t("pel.semua")], ...tekAdaList.map((k) => [k, labTek(k), "tek:" + k])], nilai: S.tek === "semua" ? "" : S.tek })
    + pilihHtml({ id: "fprov", ikon: "peta", label: t("pj.f.provinsi"), opsi: [["", t("pel.semua_prov")], ...PEL.baris.map((b) => [b.kode, b.nama, "prov:" + b.kode])], nilai: S.prov })
    + pilihHtml({ id: "fcod", ikon: "tahun", label: t("pj.c.cod"), opsi: [["", t("pel.semua_cod")], ...cods.map((c) => [String(c), String(c)])], nilai: S.cod })
    + `<span class="jm-hitung" id="pelHitungP" role="status" aria-live="polite"></span>`;
}
$("pelIsi").addEventListener("change", (e) => {
  const id = e.target.id;
  if (id === "ftek") { S.tek = e.target.value || "semua"; for (const x of $("pelSeg").querySelectorAll("[data-tek]")) x.setAttribute("aria-pressed", String(x.dataset.tek === S.tek)); nanti(segarkanTek); }
  else if (id === "fprov") { if (e.target.value) pilihProv(e.target.value); else { S.prov = ""; peta && petaSiap && peta.setFilter("pel-sel", ["==", ["get", "kode"], ""]); panelProv(); nanti(() => { kartuProyek(); kepalaProyek(); }); } }
  else if (id === "fcod") { S.cod = e.target.value; nanti(() => { kartuProyek(); kepalaProyek(); }); }
});
function kepalaProyek() { judulSemua(); }
function kartuProyek() {
  const rows = daftarProyek(), el = $("pelKartu");
  if ($("pelHitungP")) $("pelHitungP").textContent = t("pel.hitung_p", { n: N(rows.length), total: N(TERBUKA.length) });
  if (!rows.length) { el.innerHTML = `<div class="jm-kosong">${ikon("info", 32)}<p>${esc(t("jm.kosong.cocok"))}</p></div>`; return; }
  el.innerHTML = `<ul class="jm-pel-kartu">${rows.slice(0, nKartu).map((p) => {
    const nama = esc(p.nama), tautan = p.href ? `<a href="${esc(p.href)}">${nama}</a>` : nama;
    return `<li class="jm-pel-k"><div class="jm-pel-k-a">${pilTek(p.tek)}<span class="jm-pel-k-s">${esc(p.sumber === "ruptl" ? t("pel.src.ruptl", { hal: p.hal ?? "-" }) : t("pel.src.proyek"))}</span></div><b class="jm-pel-k-n">${tautan}</b><dl><div><dt>${esc(t("pj.c.kap"))}</dt><dd>${p.mw === null ? "-" : esc(N(p.mw, p.mw % 1 ? 1 : 0) + " MW")}</dd></div><div><dt>${esc(t("pj.c.cod"))}</dt><dd>${p.cod ?? "-"}</dd></div><div class="jm-pel-k-pr"><dt>${esc(t("pj.c.prov"))}</dt><dd>${p.kode ? lambang(p.kode) : ""}<span>${esc(p.prov)}</span></dd></div></dl></li>`;
  }).join("")}</ul><div class="jm-hal"><span>${esc(t("pj.tampil", { n: N(Math.min(nKartu, rows.length)), total: N(rows.length) }))}</span>${rows.length > nKartu ? `<button type="button" class="jm-tbl" id="pelLagi">${esc(t("pj.lagi"))}</button>` : ""}</div>`;
}
$("pelIsi").addEventListener("click", (e) => { if (e.target.closest("#pelLagi")) { nKartu += BATAS_KARTU; e.target.closest("#pelLagi").setAttribute("aria-busy", "true"); nanti(kartuProyek); } });

/* ---------- kalkulator ---------- */
let provKalk = [];
const K = { kode: "", tek: "plts" };
function alatKalk() {
  $("pelKalkAlat").innerHTML = `<div class="jm-kl-tek" role="group" aria-label="${esc(t("kl.tek"))}">${TEKNOLOGI.map((k) => `<button type="button" class="jm-kl-tb" data-ktek="${k}" aria-pressed="${k === K.tek}">${ikonTek(IK_KALK[k])}<span>${esc(t("kl.tek." + k))}</span></button>`).join("")}</div>
    <label class="jm-pil-pilih jm-kl-prov">${ikon("peta", 18)}<span class="sr">${esc(t("kl.provinsi"))}</span><select data-ikon="peta" id="pelKProv"><option value="">${esc(t("kl.provinsi.pilih"))}</option>${provKalk.map((p) => `<option value="${p.kode}" data-ikon="prov:${p.kode}"${p.kode === K.kode ? " selected" : ""}>${esc(p.nama)}</option>`).join("")}</select></label>`;
}
function jalanKalk() {
  const p = provKalk.find((x) => x.kode === K.kode);
  bukaKelayakan({ lat: p ? p.lat : NaN, lon: p ? p.lon : NaN, tek: K.tek, wadah: $("pelKalk") });
}
function kalkProv(kode, tek) { K.kode = kode; K.tek = tek; alatKalk(); jalanKalk(); }
$("pelIsi").addEventListener("click", (e) => {
  const b = e.target.closest("[data-ktek]"); if (!b) return;
  K.tek = b.dataset.ktek;
  for (const x of $("pelKalkAlat").querySelectorAll("[data-ktek]")) x.setAttribute("aria-pressed", String(x === b));
  if (K.kode) jalanKalk();
});
$("pelIsi").addEventListener("change", (e) => { if (e.target.id !== "pelKProv") return; K.kode = e.target.value; if (K.kode && PER_KODE.has(K.kode)) pilihProv(K.kode); jalanKalk(); });

/* ---------- metode ---------- */
function isiMetode() {
  $("exMetode").innerHTML = exHtml({ id: "", ikon: "metode", topik: t("an.cara"), judulHtml: `${esc(t("an.cara"))} ${estPil()} ${hipPil()}`, tingkat: "h2", isiHtml: `<div class="jm-an-cara">${[1, 2, 3, 4].map((i) => `<p>${esc(t("pel.cara" + i))}</p>`).join("")}</div>
    <h3 class="jm-pel-celah-j">${esc(t("pel.celah.judul"))}</h3><ul class="jm-pel-celah-l">${[1, 2, 3, 4].map((i) => `<li>${esc(t("pel.data" + i))}</li>`).join("")}</ul>
    <p class="jm-bantu">${esc(t("pel.cat.kutip", { tgl: tglData() }))} ${PEL.sumber.map((s) => urlAman(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.judul)}</a>` : esc(s.judul)).join("; ")}.</p>` });
}

/* ---------- alur ---------- */
function segarkanTek() {
  const f = fitur();
  if (peta && petaSiap) peta.getSource("pel")?.setData(f);
  legenda();
  tabel(); panelProv(); nKartu = BATAS_KARTU; saring(); kartuProyek(); judulSemua();
}
function semua() {
  hero(); segmen(); kerangka();
  geserPanel($("pelLapis"), { kunci: "lapis" }); geserPanel($("pelPanel"), { kunci: "panel" });
  for (const id of ["pelLapis", "pelPanel"]) { $(id).addEventListener("toggle", () => nanti(pasKan)); $(id).addEventListener("jm:geser", () => nanti(pasKan)); }
  if (innerWidth < 1000) { $("pelLapis").open = false; $("pelPanel").open = false; }
  isiMetode(); alatKalk(); jalanKalk();
  bukaPeta();
  segarkanTek();
}
const pasKan = () => { if (peta && !S.prov) peta.fitBounds(BATAS_ID, { padding: padPanel(), duration: 300 }); };
GEO = await geoProvinsi();
if (!GEO) { isi.innerHTML = `<div class="jm-kartu">${galatHtml("jaringan")}</div>`; isi.querySelector("[data-aksi=ulang]").addEventListener("click", () => location.reload()); throw new Error("geo"); }
provKalk = await daftarProvinsi();
semua();
const q = new URLSearchParams(location.search);
if (PER_KODE.has(q.get("prov"))) pilihProv(q.get("prov"));
document.addEventListener("jm:bahasa", () => nanti(() => { peta?.remove(); peta = null; petaSiap = false; semua(); if (S.prov) panelProv(); }));
