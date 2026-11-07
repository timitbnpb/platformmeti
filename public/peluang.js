/* /peluang: celah potensi EBT per provinsi, peringkat, proyek terbuka untuk swasta, tombol Hitung membuka tab Hitung kelayakan (kelayakan.js).
   Data = potret statis /data/*.json. Celah = potensi RUEN (2015) dikurangi terpasang HEESI (2025): indikasi (EST), bukan potensi teknis terbaru.
   INP: segmen teknologi berubah seketika (aria-pressed); peta, tabel, kartu menyusul lewat nanti(). */
import { t, angka, tanggal } from "/i18n.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { esc, nanti, ikon, hantuHtml, galatHtml } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas, geoProvinsi, BATAS_ID } from "/inti/peta_indonesia.js";
import { exHtml, sumberHtml, pilihHtml } from "/inti/komponen.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { ikonTek, pilTek, pilTekTaut } from "/inti/ikon_tek.js";
import { geserPanel } from "/inti/panel_geser.js";
import { PROV } from "/penerbit.js";

const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi"];
const DK = (k) => k.replace("-", "_"); // kunci data peluang.json
const KALK = { surya: "plts", bayu: "pltb", hidro: "mikrohidro", "panas-bumi": "plts", bioenergi: "plts" };
const BATAS_KARTU = 12;
const ambil = (u) => fetch(u, { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
const lambang = (kode, u = 20) => `<img src="/img/provinsi/${esc(kode)}.png" width="${u}" height="${u}" alt="" loading="lazy" decoding="async">`;
const labTek = (k) => t("pj.tek." + k);
const urlAman = (u) => (/^https?:\/\//i.test(u || "") ? u : "");

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
      <div id="pelTip" class="jm-pel-tip" role="status" hidden></div>
      <details class="jm-pel-lapis" id="pelLapis" open><summary><span>${esc(t("pel.legenda"))}</span></summary><div id="pelLegenda"></div></details>
      <details class="jm-pel-panel" id="pelPanel" open><summary id="pelPanelJ"><span>${esc(t("pel.panel"))}</span></summary><div id="pelPanelIsi" class="jm-pel-panel-isi"></div></details>
    </div>` })}</div>
  <div id="exTabel">${exHtml({ id: "", ikon: "tabel", topik: "", judulHtml: "", isiHtml: `<div id="pelTabel"></div>` })}</div>
  <div id="exProyek">${exHtml({ id: "", ikon: "proyek", topik: "", judulHtml: "", isiHtml: `<div class="jm-saring" id="pelSaring" role="group" aria-label="${esc(t("pel.saring"))}"></div><div id="pelKartu"></div>` })}</div>
  <div id="exMetode"></div>`;
  $("exPeta").querySelector(".jm-ex-bd").prepend($("pelSeg")); /* segmen satu wadah dengan kepala dan peta; lengket di dalam wadah */
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
  kepala("exTabel", { ikon: "tabel", topik: t("pel.ex.tabel"), judulHtml: `${hl(N(baris.length))} ${esc(t("pel.ex.tabel.j"))} ${hl(N(total) + " MW")}`, subHtml: `${esc(t("pel.ex.tabel.s"))} ${estPil()}`, aksiHtml: aksiHtml({ csv: true }) + sumberHtml(esc(t("pel.tabel.cat")), t("pel.cat.label")) + srcPeluang() });
  const p = daftarProyek();
  kepala("exProyek", { ikon: "proyek", topik: t("pel.ex.proyek"), judulHtml: `${hl(N(p.length))} ${esc(t("pel.ex.proyek.j"))} ${hl(N(p.reduce((a, r) => a + (r.mw ?? 0), 0)) + " MW")}`, subHtml: esc(t("pel.ex.proyek.s")), aksiHtml: aksiHtml({ csv: true }) + sumberHtml(`${esc(t("pel.sumber.proyek"))}<br>${esc(t("pel.sumber.ruptl"))}<br>${esc(t("pel.sumber.tgl", { tgl: tglData() }))}<br>${esc(PEL.meta.definisi_tanpa_pengembang)}`) });
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
let peta = null, petaSiap = false, GEO = null;
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
let MAKS = 1, BATAS_K = [];
/* kuantil (5 kelas sama banyak provinsi); BATAS_K = 6 batas dari minimum sampai maksimum */
function fitur() {
  const nilai = GEO.features.map((f) => celahProv(String(f.properties.kode), S.tek));
  const urut = nilai.filter((x) => x !== null).sort((x, y) => x - y);
  MAKS = Math.max(1, ...urut);
  BATAS_K = urut.length ? [0, 1, 2, 3, 4, 5].map((i) => urut[Math.min(urut.length - 1, Math.round((i * (urut.length - 1)) / 5))]) : [];
  const kelas = (x) => { let k = 0; for (let i = 1; i < 5; i++) if (x >= BATAS_K[i]) k = i; return k; };
  return { type: "FeatureCollection", features: GEO.features.map((f, i) => ({ type: "Feature", geometry: f.geometry, properties: { kode: String(f.properties.kode), nama: PER_KODE.get(String(f.properties.kode))?.nama || "", v: nilai[i] ?? -1, k: nilai[i] === null ? -1 : kelas(nilai[i]) } })) };
}
function tampilTip(kode, pt) {
  const b = PER_KODE.get(kode), tip = $("pelTip"); if (!b) return;
  const v = NILAI.get(kode), c = celahProv(kode, S.tek), urut = PEL.baris.map((x) => celahProv(x.kode, S.tek)).filter((x) => x !== null).sort((x, y) => y - x);
  const rk = c === null ? t("pel.tanpa_data") : t("pel.tip.peringkat", { r: urut.indexOf(c) + 1, n: urut.length });
  const tekTop = (S.tek === "semua" ? TEK : [S.tek]).filter((k) => v[k].pot !== null).sort((x, y) => v[y].pot - v[x].pot)[0];
  const kunci = tekTop ? `<li><span>${esc(t("pel.tip.terbesar"))}</span><b>${esc(labTek(tekTop))} ${esc(N(v[tekTop].pot))} MW</b></li><li><span>${esc(t("pel.tip.harga"))}</span><b>${esc(teksHarga(tekTop, b.faktor_lokasi.F))}</b></li>` : "";
  tip.innerHTML = `<header>${lambang(kode, 36)}<div><strong>${esc(b.nama)}</strong><small>${esc(rk)}</small></div></header><p><span>${esc(t("pel.celah"))}</span><b>${esc(c === null ? "-" : N(c) + " MW")}</b></p><ul>${kunci}</ul><small class="jm-pel-ajak">${esc(t("pel.tip.klik"))}</small>`;
  tip.hidden = false;
  const w = $("pelPeta").clientWidth, h = $("pelPeta").clientHeight;
  tip.style.left = Math.max(8, Math.min(w - tip.offsetWidth - 8, pt.x + 16)) + "px";
  tip.style.top = Math.max(8, Math.min(h - tip.offsetHeight - 8, pt.y + 16)) + "px";
}
function legenda() {
  const nama = ["jm-pel-k0", "jm-pel-k1", "jm-pel-k2", "jm-pel-k3", "jm-pel-k4"], v = BATAS_K;
  const baris = v.length ? nama.map((k, i) => `<li><i class="${k}" aria-hidden="true"></i><span>${esc(t("pel.rentang", { a: N(v[i]), b: N(v[i + 1]) }))}</span></li>`).join("") : "";
  $("pelLegenda").innerHTML = `<ul class="jm-pel-kuantil">${baris}<li><i class="jm-pel-nd" aria-hidden="true"></i><span>${esc(t("pel.legenda.tanpa"))}</span>${sumberHtml(esc(t("pel.legenda.cara")), t("pel.legenda.info"))}</li></ul>`;
}
function pasangLapisan() {
  const il = rapikanPeta(peta);
  peta.addSource("pel", { type: "geojson", data: fitur() });
  peta.addLayer({ id: "pel-isi", type: "fill", source: "pel", paint: { "fill-color": warna("--accent-isi"), "fill-opacity": ["match", ["get", "k"], 0, 0.2, 1, 0.38, 2, 0.56, 3, 0.74, 4, 0.92, 0.05] } }, il || undefined);
  peta.addLayer({ id: "pel-sel", type: "line", source: "pel", filter: ["==", ["get", "kode"], S.prov], paint: { "line-color": warna("--sorot"), "line-width": 3 } }, il || undefined);
  pasangBatas(peta, warna, il, "pel-sel");
}
function bukaPeta() {
  muatMapLibre().then(() => {
    peta = new maplibregl.Map({ container: "pelPeta", style: gaya(), bounds: BATAS_ID, fitBoundsOptions: { padding: padPanel() }, minZoom: 2, maxZoom: 9, dragRotate: false, pitchWithRotate: false, attributionControl: false });
    peta.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("style.load", () => { pasangLapisan(); petaSiap = true; });
    new ResizeObserver(() => peta.resize()).observe($("pelPeta"));
    peta.once("idle", () => { peta.resize(); peta.fitBounds(BATAS_ID, { padding: padPanel(), duration: 0 }); });
    peta.on("click", "pel-isi", (e) => pilihProv(e.features[0].properties.kode, true));
    peta.on("mousemove", "pel-isi", (e) => {
      peta.getCanvas().style.cursor = "pointer";
      tampilTip(e.features[0].properties.kode, e.point);
    });
    peta.on("mouseleave", "pel-isi", () => { peta.getCanvas().style.cursor = ""; $("pelTip").hidden = true; });
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
function panelProv() {
  const el = $("pelPanelIsi");
  const b = PER_KODE.get(S.prov);
  if (!b) { const top = PEL.baris.map((x) => [x, celahProv(x.kode, S.tek)]).filter((x) => x[1] !== null).sort((a, z) => z[1] - a[1]).slice(0, 5);
    el.innerHTML = `<h4>${esc(t("pel.panel.top"))}</h4><ol class="jm-pel-top">${top.map(([x, c], i) => `<li><button type="button" data-prov="${esc(x.kode)}"><span class="jm-pel-top-n">${i + 1}</span>${lambang(x.kode, 20)}<span class="jm-pel-top-p">${esc(x.nama)}</span><b>${esc(N(c))} MW</b></button></li>`).join("")}</ol>`;
    for (const bt of el.querySelectorAll("[data-prov]")) bt.addEventListener("click", () => pilihProv(bt.dataset.prov)); $("pelPanelJ").firstElementChild.textContent = t("pel.panel"); return; }
  $("pelPanelJ").firstElementChild.textContent = b.nama;
  const v = NILAI.get(b.kode), tek = S.tek, F = b.faktor_lokasi.F;
  const tekTampil = tek === "semua" ? TEK : [tek];
  const mx = Math.max(1, ...tekTampil.map((k) => v[k].celah ?? 0));
  const utama = celahProv(b.kode, tek);
  const baris = tekTampil.map((k) => { const c = v[k].celah, lebar = c === null ? 0 : Math.round((c / mx) * 100); return `<li class="jm-tek-${k}"><span class="jm-pel-tki">${ikonTek(k)}</span><div><p><span>${esc(labTek(k))}</span><b>${esc(c === null ? "-" : N(c))}${c === null ? "" : ` <small>MW</small>`}</b></p><i class="jm-pel-bt" data-w="${lebar}"></i><small>${esc(t("pel.panel.baris", { pot: v[k].pot === null ? "-" : N(v[k].pot), ter: v[k].ter === null ? "-" : N(v[k].ter), src: k === "panas-bumi" ? "HEESI 2025" : "RUEN 2015" }))}</small></div></li>`; }).join("");
  const harga = tekTampil.map((k) => `<tr><td>${pilTek(k)}</td><td class="jm-num">${esc(teksHarga(k, F))}</td></tr>`).join("");
  const atapR = regionalDari(b.kode), reg = ATAP.regional.find((r) => r.kode === atapR), kb = ATAP.baris.filter((r) => r.regional === atapR);
  const kuotaTotal = kb.reduce((a, r) => a + (r.kuota_mw || 0), 0), tahunIni = new Date().getFullYear(), kuotaNow = kb.find((r) => r.tahun === tahunIni)?.kuota_mw;
  const wkp = WKP.baris.filter((w) => kodeProv(w.provinsi) === b.kode);
  const tb = TERBUKA.filter((p) => p.kode === b.kode && (tek === "semua" || p.tek === tek));
  const sub = (ik, j, isiH) => `<section class="jm-pel-sub"><h4>${ikon(ik, 16)}<span>${esc(j)}</span></h4>${isiH}</section>`;
  el.innerHTML = `<div class="jm-pel-pj">${lambang(b.kode, 32)}<b>${esc(b.nama)}</b><a href="/wilayah/${esc(b.kode)}" class="jm-pel-tautan">${ikon("tautan", 14)}<span>${esc(t("pel.profil"))}</span></a></div>
    <p class="jm-pel-utama"><span>${esc(t("pel.celah"))}</span><b>${esc(utama === null ? "-" : N(utama))}</b>${utama === null ? "" : "<small>MW</small>"}${estPil()}</p>
    <ul class="jm-pel-tekl">${baris}</ul>
    ${sub("proyek", t("pel.panel.tanpa"), `<p class="jm-pel-p">${esc(t("pel.panel.tanpa.i", { n: N(tb.length), mw: N(tb.reduce((a, r) => a + (r.mw ?? 0), 0)) }))}</p>`)}
    ${sub("lokasi", t("pel.panel.wkp"), `<p class="jm-pel-p">${wkp.length ? wkp.map((w) => `${esc(w.nama)} (${esc(w.status)}${w.rencana_mw ? ", " + N(w.rencana_mw) + " MW" : ""})`).join("; ") : esc(t("pel.panel.wkp.kosong"))}</p>`)}
    ${sub("tek-surya", t("pel.panel.atap"), `<p class="jm-pel-p">${esc(t("pel.panel.atap.i", { sistem: reg?.nama || "-", total: N(kuotaTotal), tahun: tahunIni, ini: kuotaNow == null ? "-" : N(kuotaNow) }))}</p>`)}
    ${sub("tabel", t("pel.panel.harga", { f: N(F, 2) }), `<table class="jm-pel-ht"><thead><tr><th>${esc(t("pel.c.tek"))}</th><th class="jm-num">${esc(t("pel.panel.satuan"))}</th></tr></thead><tbody>${harga}</tbody></table><p class="jm-bantu">${esc(t("pel.panel.harga.k"))} ${estPil()}</p>`)}
    <button type="button" class="jm-tbl jm-tbl-utama" id="pelHitung">${ikon("analisis", 16)}<span>${esc(t("pel.hitung"))}</span></button>`;
  for (const i of el.querySelectorAll(".jm-pel-bt")) i.style.setProperty("--w", i.dataset.w + "%");
  $("pelHitung").addEventListener("click", () => document.dispatchEvent(new CustomEvent("jm:hitung", { detail: { kode: b.kode, tek: KALK[tek] || "plts" } }))); /* halaman /peluang membuka tab Hitung kelayakan */
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
const BATAS_TAB = 15;
const ST = { prov: "", uk: "grup", ua: -1, hal: 1 };
function barisTabel() {
  const out = [];
  for (const b of PEL.baris) for (const k of TEK) {
    if ((S.tek !== "semua" && S.tek !== k) || (ST.prov && ST.prov !== b.kode)) continue;
    const v = NILAI.get(b.kode)[k]; if (v.pot === null) continue;
    const tb = TERBUKA.filter((p) => p.kode === b.kode && p.tek === k);
    const h = rentangHarga(k);
    out.push({ b, k, ...v, F: b.faktor_lokasi.F, tb: tb.length, tbMw: tb.reduce((a, r) => a + (r.mw ?? 0), 0), h: h && [h[0] * b.faktor_lokasi.F, h[1] * b.faktor_lokasi.F], grup: celahProv(b.kode, "semua") ?? -1 });
  }
  const kunci = { prov: (r) => r.b.nama, tek: (r) => labTek(r.k), pot: (r) => r.pot, ter: (r) => r.ter, rasio: (r) => r.rasio, celah: (r) => r.celah, harga: (r) => r.h?.[0], tb: (r) => r.tb }[ST.uk];
  const lawan = (x, y) => (typeof x === "string" ? x.localeCompare(y, "id") : x - y);
  return out.sort((a, z) => {
    if (ST.uk === "grup") return z.grup - a.grup || a.b.nama.localeCompare(z.b.nama, "id") || (z.celah ?? -1) - (a.celah ?? -1);
    const x = kunci(a), y = kunci(z);
    if (x == null || x === "") return 1; if (y == null || y === "") return -1; /* sel kosong selalu di bawah */
    return lawan(x, y) * ST.ua || (z.celah ?? -1) - (a.celah ?? -1);
  });
}
const KOLOM = [["prov", "pel.c.prov", ""], ["tek", "pel.c.tek", ""], ["pot", "pel.potensi", "MW"], ["ter", "pel.terpasang", "MW"], ["rasio", "pel.rasio", "%"], ["celah", "pel.celah", "MW"], ["harga", "pel.c.harga", "pel.c.hargas"], ["tb", "pel.c.tb", "pel.c.tbs"]];
const satKol = (u) => (u.startsWith("pel.") ? t(u) : u);
const pilRasio = (x) => (x === null ? "-" : `<span class="jm-pil ${x < 1 ? "jm-pil-bad" : x <= 5 ? "jm-pil-warn" : "jm-pil-ok"}">${esc(N(x, 1))}%</span>`);
function tabel() {
  const semuaB = barisTabel(), maks = Math.max(1, Math.ceil(semuaB.length / BATAS_TAB));
  ST.hal = Math.min(ST.hal, maks);
  const rows = semuaB.slice((ST.hal - 1) * BATAS_TAB, ST.hal * BATAS_TAB);
  const hs = semuaB.map((r) => r.h).filter(Boolean), hMin = Math.min(...hs.map((x) => x[0]), 0), hMaks = Math.max(1, ...hs.map((x) => x[1]));
  const td = (i, h, kelas = "", urut = null) => `<td data-label="${esc(t(KOLOM[i][1]) + (KOLOM[i][2] ? " (" + satKol(KOLOM[i][2]) + ")" : ""))}"${kelas ? ` class="${kelas}"` : ""}${urut !== null ? ` data-urut="${urut}"` : ""}>${h}</td>`;
  const th = KOLOM.map(([k, lab, sat]) => `<th scope="col" class="jm-pel-c-${k}" aria-sort="${ST.uk === k ? (ST.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-uk="${k}">${esc(t(lab))}</button>${sat ? `<small>${esc(satKol(sat))}</small>` : ""}</th>`).join("");
  let sebelum = "";
  const isiB = rows.map((r) => {
    const ulang = r.b.kode === sebelum; sebelum = r.b.kode;
    const rh = r.h ? `<span class="jm-pel-rh" title="${esc(t("pel.tt.rentang", { a: N(r.h[0], 1), b: N(r.h[1], 1) }))}"><b>${esc(N(r.h[0], 1))}-${esc(N(r.h[1], 1))}</b><i class="jm-pel-rb" data-a="${((r.h[0] - hMin) / (hMaks - hMin)) * 100}" data-b="${((r.h[1] - hMin) / (hMaks - hMin)) * 100}"></i></span>` : "-";
    const tb = r.tb ? `<span class="jm-pel-tbx"><b>${esc(t("pel.t.lokasi", { n: N(r.tb) }))}</b><small>${esc(N(r.tbMw))} MW</small></span>` : "-";
    return `<tr>${td(0, `<span class="jm-pel-pj${ulang ? " jm-pel-ulang" : ""}">${lambang(r.b.kode)}<a href="/wilayah/${esc(r.b.kode)}">${esc(r.b.nama)}</a></span>`)}${td(1, pilTekTaut(r.k))}${td(2, N(r.pot), "jm-num")}${td(3, r.ter === null ? "-" : N(r.ter), "jm-num")}${td(4, pilRasio(r.rasio), "jm-num")}${td(5, r.celah === null ? "-" : N(r.celah), "jm-num jm-pel-celah")}${td(6, rh, "jm-num")}${td(7, tb, "jm-num")}</tr>`;
  }).join("");
  $("pelTabel").innerHTML = `<div class="jm-saring jm-pel-sr" id="pelSaringT" role="group" aria-label="${esc(t("pel.saring.tabel"))}">${saringTabelHtml()}<span class="jm-hitung" role="status">${esc(t("pel.hitung_t", { n: N(semuaB.length) }))}</span></div>
    <div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap jm-pel-tabel" data-urut="tidak"><thead><tr>${th}</tr></thead><tbody>${isiB || `<tr><td colspan="8">${esc(t("jm.kosong.cocok"))}</td></tr>`}</tbody></table></div>${paginasiHtml({ hal: ST.hal, total: semuaB.length, per: BATAS_TAB, satuan: "jm.pag.u.pasangan" })}`;
  for (const i of $("pelTabel").querySelectorAll(".jm-pel-rb")) { i.style.setProperty("--a", i.dataset.a + "%"); i.style.setProperty("--b", i.dataset.b + "%"); }
}
function saringTabelHtml() {
  return pilihHtml({ id: "ttek", ikon: "jenis", label: t("pj.f.tek"), opsi: [["", t("pel.semua")], ...TEK.map((k) => [k, labTek(k), "tek:" + k])], nilai: S.tek === "semua" ? "" : S.tek })
    + pilihHtml({ id: "tprov", ikon: "peta", label: t("pj.f.provinsi"), opsi: [["", t("pel.semua_prov")], ...PEL.baris.map((b) => [b.kode, b.nama, "prov:" + b.kode])], nilai: ST.prov });
}
$("pelIsi").addEventListener("click", (e) => {
  const u = e.target.closest("#exTabel .jm-urut");
  if (u) { const k = u.dataset.uk; ST.ua = ST.uk === k ? -ST.ua : (k === "prov" || k === "tek" ? 1 : -1); ST.uk = k; ST.hal = 1; for (const th of u.closest("tr").children) th.setAttribute("aria-sort", th.contains(u) ? (ST.ua > 0 ? "ascending" : "descending") : "none"); nanti(tabel); return; }
  const b = e.target.closest("#exTabel .jm-pag [data-hal]");
  if (b && !b.disabled) { ST.hal = +b.dataset.hal; sorotHalaman(b, ST.hal); nanti(tabel); }
});
$("pelIsi").addEventListener("jm:csv", (e) => {
  const ex = e.target.closest(".jm-ex"); if (!ex) return;
  if (ex.parentElement.id === "exTabel") e.detail.baris = [[t("pel.c.prov"), t("pel.c.tek"), t("pel.potensi") + " MW", t("pel.terpasang") + " MW", t("pel.rasio") + " %", t("pel.celah") + " MW", t("pel.c.harga") + " " + t("pel.c.hargas"), t("pel.c.tb")], ...barisTabel().map((r) => [r.b.nama, labTek(r.k), r.pot, r.ter ?? "", r.rasio ?? "", r.celah ?? "", teksHarga(r.k, r.F), r.tb])];
  else if (ex.parentElement.id === "exProyek") e.detail.baris = [[t("pel.k.nama"), t("pj.c.tek"), t("pj.c.kap"), t("pj.c.prov"), t("pj.c.cod"), t("pel.k.sumber")], ...daftarProyek().map((p) => [p.nama, labTek(p.tek), p.mw ?? "", p.prov, p.cod ?? "", p.sumber])];
}, true);

/* ---------- proyek terbuka ---------- */
const daftarProyek = () => TERBUKA.filter((p) => (S.tek === "semua" || p.tek === S.tek) && (!S.prov || p.kode === S.prov) && (!S.cod || String(p.cod) === S.cod)).sort((a, z) => (z.mw ?? -1) - (a.mw ?? -1));
let hKartu = 1;
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
  if (id === "tprov") { ST.prov = e.target.value; ST.hal = 1; nanti(() => { tabel(); judulSemua(); }); }
  else if (id === "ttek" || id === "ftek") { S.tek = e.target.value || "semua"; ST.hal = 1; for (const x of $("pelSeg").querySelectorAll("[data-tek]")) x.setAttribute("aria-pressed", String(x.dataset.tek === S.tek)); nanti(segarkanTek); }
  else if (id === "fprov") { if (e.target.value) pilihProv(e.target.value); else { S.prov = ""; peta && petaSiap && peta.setFilter("pel-sel", ["==", ["get", "kode"], ""]); panelProv(); nanti(() => { kartuProyek(); kepalaProyek(); }); } }
  else if (id === "fcod") { S.cod = e.target.value; nanti(() => { kartuProyek(); kepalaProyek(); }); }
});
function kepalaProyek() { judulSemua(); }
function kartuProyek() {
  const rows = daftarProyek(), el = $("pelKartu");
  hKartu = Math.min(hKartu, Math.max(1, Math.ceil(rows.length / BATAS_KARTU)));
  if ($("pelHitungP")) $("pelHitungP").textContent = t("pel.hitung_p", { n: N(rows.length), total: N(TERBUKA.length) });
  if (!rows.length) { el.innerHTML = `<div class="jm-kosong">${ikon("info", 32)}<p>${esc(t("jm.kosong.cocok"))}</p></div>`; return; }
  el.innerHTML = `<ul class="jm-pel-kartu">${rows.slice((hKartu - 1) * BATAS_KARTU, hKartu * BATAS_KARTU).map((p) => {
    const nama = esc(p.nama), tautan = p.href ? `<a href="${esc(p.href)}">${nama}</a>` : nama;
    return `<li class="jm-pel-pk"><div class="jm-pel-pk-a">${pilTek(p.tek)}<span class="jm-pel-pk-s">${esc(p.sumber === "ruptl" ? t("pel.src.ruptl", { hal: p.hal ?? "-" }) : t("pel.src.proyek"))}</span></div><b class="jm-pel-pk-n">${tautan}</b><dl><div><dt>${esc(t("pj.c.kap"))}</dt><dd>${p.mw === null ? "-" : esc(N(p.mw, p.mw % 1 ? 1 : 0) + " MW")}</dd></div><div><dt>${esc(t("pj.c.cod"))}</dt><dd>${p.cod ?? "-"}</dd></div><div class="jm-pel-pk-pr"><dt>${esc(t("pj.c.prov"))}</dt><dd>${p.kode ? lambang(p.kode) : ""}<span>${esc(p.prov)}</span></dd></div></dl></li>`;
  }).join("")}</ul>${paginasiHtml({ hal: hKartu, total: rows.length, per: BATAS_KARTU, satuan: "jm.pag.u.peluang" })}`;
}
$("pelIsi").addEventListener("click", (e) => { const b = e.target.closest("#exProyek .jm-pag [data-hal]"); if (b && !b.disabled) { hKartu = +b.dataset.hal; sorotHalaman(b, hKartu); nanti(kartuProyek); } });

/* ---------- metode ---------- */
const LANGKAH = [["analisis", "1", "surya"], ["tabel", "2", "bayu"], ["proyek", "3", "hidro"], ["analisis", "4", "bio"]];
function isiMetode() {
  const src = PEL.sumber.map((s) => (urlAman(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.judul)}</a>` : esc(s.judul))).join("<br>");
  const kartu = LANGKAH.map(([ik, i, w]) => `<li class="jm-pel-lg jm-pel-lg-${w}"><span class="jm-pel-lg-ik">${ikon(ik, 22)}</span><h3>${esc(t("pel.cara.t" + i))}</h3><code>${esc(t("pel.cara.f" + i))}</code><p>${esc(t("pel.cara" + i))}</p><span class="jm-pil jm-pil-est">${esc(t("pel.cara.b" + i))}</span></li>`).join("");
  const kutip = t("pel.kutip.teks", { tgl: tglData() });
  $("exMetode").innerHTML = exHtml({ id: "", ikon: "metode", topik: t("an.cara"), judulHtml: `${esc(t("an.cara"))} ${estPil()} ${hipPil()}`, tingkat: "h2", isiHtml: `<ol class="jm-pel-lgd">${kartu}</ol>
    <section class="jm-pel-celahk"><h3>${ikon("info", 18)}<span>${esc(t("pel.celah.judul"))}</span></h3><ul>${[1, 2, 3, 4].map((i) => `<li>${ikon("peringatan", 16)}<span>${esc(t("pel.data" + i))}</span></li>`).join("")}</ul></section>
    <div class="jm-pel-kutip"><b>${esc(t("pel.kutip"))}</b><span>${esc(kutip)}</span><button type="button" class="jm-tbl jm-tbl-kecil" data-aksi="salin" data-teks="${esc(kutip)}">${ikon("tautan", 16)}<span>${esc(t("pel.kutip.salin"))}</span></button>${sumberHtml(src)}</div>` });
}
$("pelIsi").addEventListener("click", (e) => {
  const b = e.target.closest("[data-aksi=salin]"); if (!b) return;
  navigator.clipboard?.writeText(b.dataset.teks).then(() => { b.lastElementChild.textContent = t("pel.kutip.tersalin"); setTimeout(() => { b.lastElementChild.textContent = t("pel.kutip.salin"); }, 1800); });
});

/* ---------- alur ---------- */
function segarkanTek() {
  const f = fitur();
  if (peta && petaSiap) peta.getSource("pel")?.setData(f);
  legenda();
  tabel(); panelProv(); hKartu = 1; saring(); kartuProyek(); judulSemua();
}
function semua() {
  hero(); segmen(); kerangka();
  geserPanel($("pelLapis"), { kunci: "lapis" }); geserPanel($("pelPanel"), { kunci: "panel" });
  for (const id of ["pelLapis", "pelPanel"]) { $(id).addEventListener("toggle", () => nanti(pasKan)); $(id).addEventListener("jm:geser", () => nanti(pasKan)); }
  if (innerWidth < 1000) { $("pelLapis").open = false; $("pelPanel").open = false; }
  isiMetode();
  bukaPeta();
  segarkanTek();
}
const pasKan = () => { if (peta && !S.prov) peta.fitBounds(BATAS_ID, { padding: padPanel(), duration: 300 }); };
GEO = await geoProvinsi();
if (!GEO) { isi.innerHTML = `<div class="jm-kartu">${galatHtml("jaringan")}</div>`; isi.querySelector("[data-aksi=ulang]").addEventListener("click", () => location.reload()); throw new Error("geo"); }
semua();
const q = new URLSearchParams(location.search);
if (PER_KODE.has(q.get("prov"))) pilihProv(q.get("prov"));
document.addEventListener("jm:bahasa", () => nanti(() => { peta?.remove(); peta = null; petaSiap = false; semua(); if (S.prov) panelProv(); }));
