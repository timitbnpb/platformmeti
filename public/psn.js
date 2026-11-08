/* Bagian PSN energi di /program#psn (dimuat program.js sesudah kartu program). Data = /data/psn.json (Permenko 16/2025, hanya energi dan EBT, pengayaan bersumber).
   Wadah #psnIsi dan #psnDlg disediakan program.js. Semua grafik SVG .jm-gx bertooltip (inti/tip_grafik.js).
   INP: kontrol (chip, pilih) berubah seketika; peta, grafik, dan tabel menyusul lewat nanti(). */
import { t, angka, tanggal } from "/i18n.js";
import "/inti/tip_grafik.js";
import "/inti/galat_gambar.js";
import { esc, nanti, ikon, hantuHtml, galatHtml, debounce } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { exHtml, pilihHtml, cariHtml, hapusHtml, sumberHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { buktiHtml } from "/inti/bukti.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas, BATAS_ID } from "/inti/peta_indonesia.js";
import { geserPanel } from "/inti/panel_geser.js";
import { pasangPilih } from "/inti/pilih.js";
import { logoOrg } from "/inti/logo_org.js";
import { PROV } from "/inti/prov_singkat.js";
import { SEKTOR, IKON_SEKTOR, STATUS, IKON_STATUS, DANA, IKON_DANA, NEGARA, saring, totalInvestasi, hitungPer, barisLinimasa, tahunDari, barisCsv } from "/psn_hitung.js";

const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const PER = 15, URL_AMAN = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
const WARNA_SEKTOR = { energi: "--tp-listrik", kawasan: "--tp-industri", teknologi: "--tp-hidrogen", program: "--tp-kebijakan" };
const bukti = (k) => buktiHtml(k === "resmi" ? "resmi" : k === "media" ? "media" : "est");
const ikonStatus = (s) => ikon(IKON_STATUS[s] || "tanya", 16);
const pilStatus = (s) => `<span class="jm-pil psn-st psn-st-${esc(s)}">${ikonStatus(s)}<span>${esc(t("psn.status." + s))}</span></span>`;
const pilSektor = (s) => `<span class="psn-sk psn-s-${esc(s)}">${ikon(IKON_SEKTOR[s], 16)}<span>${esc(t("psn.sektor." + s))}</span></span>`;
const nilaiInvest = (i) => (!i ? null : i.usd_miliar != null ? `US$ ${N(i.usd_miliar, i.usd_miliar < 10 ? 1 : 0)} ${t("psn.miliar")}` : i.rp_triliun != null ? `Rp ${N(i.rp_triliun, 1)} ${t("psn.triliun")}` : null);
const nilaiKap = (k) => (k ? `${N(k.nilai, k.nilai < 10 ? 1 : 0)} ${k.satuan}` : null);
const provNama = (k) => PROV[k]?.[0] || k;

const isi = $("psnIsi");
isi.innerHTML = hantuHtml(8);
let D, ORG;
try {
  D = await fetch("/data/psn.json", { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error("psn"); return r.json(); });
} catch (e) {
  isi.innerHTML = `<div class="psn-galat">${galatHtml("jaringan")}</div>`;
  isi.querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw e;
}
const SEMUA = D.baris, PROYEK = SEMUA.filter((b) => b.tipe === "proyek");
const S = { q: "", sektor: "", prov: "", status: "", energi: "", dana: "", lengkap: false, hal: 1, uk: "prio", ua: 1, sel: "" };
let HASIL = SEMUA;

const energiInti = SEMUA.filter((b) => b.energi === "inti");

/* ---------- kerangka ---------- */
const opsiSektor = [["", t("psn.f.semua"), "daftar2", SEMUA.length], ...SEKTOR.map((s) => [s, t("psn.sektor." + s), IKON_SEKTOR[s], SEMUA.filter((b) => b.sektor === s).length])];
const provAda = [...new Set(SEMUA.flatMap((b) => b.prov_kode))].sort();
const opsiProv = [["", t("psn.f.semua"), "wilayah"], ...provAda.map((k) => [k, provNama(k), "prov:" + k, SEMUA.filter((b) => b.prov_kode.includes(k)).length])];
const opsiStatus = [["", t("psn.f.semua"), "daftar2"], ...STATUS.map((s) => [s, t("psn.status." + s), IKON_STATUS[s], SEMUA.filter((b) => b.status === s).length])];
const opsiDana = [["", t("psn.f.semua"), "daftar2"], ...DANA.map((s) => [s, t("psn.dana." + s), IKON_DANA[s], SEMUA.filter((b) => b.dana.includes(s)).length])];
const ex = (o) => exHtml({ tingkat: "h2", ...o });

function rangka() {
  isi.innerHTML = [
    ex({ id: "psnSaring", ikon: "cari2", topik: t("psn.ey.saring"), judulHtml: hlHtml("psn.t.saring", t("psn.t.saring.hl")), subHtml: esc(t("psn.s.saring")),
      isiHtml: `<div class="jm-saring psn-saring">${cariHtml({ id: "psnQ", label: t("psn.f.q"), placeholder: t("psn.f.q") })}${pilihHtml({ id: "psnSek", ikon: "daftar2", label: t("psn.f.sektor"), opsi: opsiSektor })}${pilihHtml({ id: "psnProv", ikon: "wilayah", label: t("psn.f.prov"), opsi: opsiProv })}${pilihHtml({ id: "psnSt", ikon: "status", label: t("psn.f.status"), opsi: opsiStatus })}${pilihHtml({ id: "psnDn", ikon: "kartu", label: t("psn.f.dana"), opsi: opsiDana })}
        <button type="button" class="psn-chip" id="psnLengkap" aria-pressed="false">${ikon("centang", 16)}<span>${esc(t("psn.f.lengkap"))}</span></button>${hapusHtml({ id: "psnHapus", label: t("psn.f.hapus") })}</div><p class="psn-bantu" id="psnHitung" aria-live="polite"></p>` }),
    ex({ id: "psnPeta", ikon: "peta", topik: t("psn.ey.peta"), judulHtml: `<span id="psnJPeta"></span>`, subHtml: esc(t("psn.s.peta")), aksiHtml: aksiHtml({ csv: false, pdf: false, sajian: false }),
      isiHtml: `<div class="psn-peta" id="psnPetaW"><div id="psnKanvas" class="psn-kanvas" role="application" aria-label="${esc(t("psn.peta.label"))}"></div><div id="psnTip" class="psn-tip" role="status" hidden></div>
        <details class="psn-panel" id="psnPanel"${innerWidth >= 1000 ? " open" : ""}><summary><span>${esc(t("psn.panel"))}</span></summary><div class="psn-panel-isi" id="psnLegenda"></div></details></div>` }),
    ex({ id: "psnGantt", ikon: "linimasa", topik: t("psn.ey.gantt"), judulHtml: hlHtml("psn.t.gantt", t("psn.t.gantt.hl")), subHtml: esc(t("psn.s.gantt")), aksiHtml: aksiHtml({ csv: false, pdf: false, sajian: false }), isiHtml: `<div id="psnGanttIsi"></div>` }),
    ex({ id: "psnSebaran", ikon: "grafik", topik: t("psn.ey.sebaran"), judulHtml: hlHtml("psn.t.sebaran", t("psn.t.sebaran.hl")), subHtml: esc(t("psn.s.sebaran")), aksiHtml: aksiHtml({ csv: false, pdf: false, sajian: false }),
      isiHtml: `<div class="psn-tiga"><section><h3>${ikon("daftar2", 16)}<span>${esc(t("psn.h.sektor"))}</span></h3><div id="psnGrSek"></div></section><section><h3>${ikon("wilayah", 16)}<span>${esc(t("psn.h.prov"))}</span></h3><div id="psnGrProv"></div></section><section><h3>${ikon("kartu", 16)}<span>${esc(t("psn.h.dana"))}</span></h3><div id="psnGrDana"></div></section></div>` }),
    ex({ id: "psnTabel", ikon: "tabel", topik: t("psn.ey.tabel"), judulHtml: `<span id="psnJTabel"></span>`, subHtml: esc(t("psn.s.tabel")), aksiHtml: aksiHtml({ csv: true, png: false, pdf: false, sajian: false }), isiHtml: `<div id="psnTabelIsi"></div><div id="psnPag"></div>` }),
    ex({ id: "psnMetode", ikon: "metode", topik: t("psn.ey.metode"), judulHtml: hlHtml("psn.t.metode", String(D.regulasi.length)), subHtml: esc(t("psn.s.metode")),
      isiHtml: `<ul class="psn-reg">${D.regulasi.map((r) => `<li>${ikon("regulasi", 18)}<div><b>${esc(r.judul)}</b><small>${esc(r.tanggal || "")}${URL_AMAN(r.url) ? ` <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(t("psn.buka_sumber"))}</a>` : ""}</small></div></li>`).join("")}</ul>
        <div class="psn-celah"><h3>${ikon("peringatan", 18)}<span>${esc(t("psn.celah"))}</span></h3><ul><li>${ikon("info", 14)}<span>${esc(D.meta.catatan)}</span></li><li>${ikon("info", 14)}<span>${esc(D.meta.terbaru_dicek)}</span></li></ul></div>` }),
  ].join("");
  $("psnQ").addEventListener("input", debounce(() => { S.q = $("psnQ").value; terap(); }, 200));
  for (const [id, k] of [["psnSek", "sektor"], ["psnProv", "prov"], ["psnSt", "status"], ["psnDn", "dana"]]) $(id).addEventListener("change", () => { S[k] = $(id).value; terap(); });
  $("psnLengkap").addEventListener("click", () => { S.lengkap = !S.lengkap; $("psnLengkap").setAttribute("aria-pressed", String(S.lengkap)); terap(); });
  $("psnHapus").addEventListener("click", () => { Object.assign(S, { q: "", sektor: "", prov: "", status: "", energi: "", dana: "", lengkap: false }); $("psnQ").value = ""; for (const id of ["psnSek", "psnProv", "psnSt", "psnDn"]) { $(id).value = ""; $(id).dispatchEvent(new Event("jm:segar")); } $("psnLengkap").setAttribute("aria-pressed", "false"); terap(); });
  isi.addEventListener("click", (e) => {
    const b = e.target.closest("[data-buka]"); if (b) return bukaRincian(b.dataset.buka);
    const f = e.target.closest("[data-saring]"); if (f) { const [k, v] = f.dataset.saring.split(":"); S[k] = S[k] === v ? "" : v; const id = { sektor: "psnSek", prov: "psnProv", dana: "psnDn" }[k]; $(id).value = S[k]; $(id).dispatchEvent(new Event("change", { bubbles: true })); }
  });
  $("psnTabel").addEventListener("jm:csv", (e) => { e.detail.baris = barisCsv(HASIL, ["id", "tipe", "sektor", "nama", "lokasi", "kode_provinsi", "status", "progres_persen", "target_selesai", "investasi", "kapasitas", "sumber_dana", "pelaksana", "tingkat_bukti", "sumber"]); });
  $("psnPag").addEventListener("click", (e) => { const b = e.target.closest("[data-hal]"); if (b && !b.disabled) { S.hal = +b.dataset.hal; sorotHalaman(b, S.hal); nanti(() => { gambarTabel(); $("psnTabel").scrollIntoView({ block: "start" }); }); } });
  $("psnTabelIsi").addEventListener("click", (e) => { const u = e.target.closest(".jm-urut"); if (!u) return; const k = u.dataset.uk; S.ua = S.uk === k ? -S.ua : 1; S.uk = k; S.hal = 1; nanti(gambarTabel); });
  $("psnLegenda").addEventListener("click", (e) => { const b = e.target.closest("[data-saring]"); if (b) { const [, v] = b.dataset.saring.split(":"); S.sektor = S.sektor === v ? "" : v; $("psnSek").value = S.sektor; $("psnSek").dispatchEvent(new Event("change", { bubbles: true })); } });
  pasangPilih();
  geserPanel($("psnPanel"), { kunci: "psn", batas: $("psnPetaW") });
}
rangka();

/* ---------- grafik SVG (kelas .jm-gx, tooltip lewat data-tip) ---------- */
function batangSvg(rows, { aksi = "", label = "" } = {}) {
  const maks = Math.max(1, ...rows.map((r) => r.n)), W = 420, L = 150, R = 44, rh = 28, H = rows.length * rh + 6, X = (v) => (v / maks) * (W - L - R);
  const g = rows.map((r, i) => {
    const y = 4 + i * rh, on = aksi && S[aksi.split(":")[0]] === r.k;
    return `<g class="psn-gb${on ? " jm-gf-on" : ""}" data-saring="${esc(aksi)}${esc(r.k)}"><text class="jm-gf-t1" x="${L - 8}" y="${y + 15}" text-anchor="end">${esc(r.lbl.length > 22 ? r.lbl.slice(0, 21) + "…" : r.lbl)}</text>
      <rect class="psn-bar ${esc(r.kelas)}" x="${L}" y="${y + 3}" width="${Math.max(2, X(r.n)).toFixed(1)}" height="14" rx="3" data-tip="${esc(r.tip)}"/><text class="jm-gf-t1" x="${(L + X(r.n) + 6).toFixed(1)}" y="${y + 15}">${esc(N(r.n))}</text></g>`;
  }).join("");
  return `<svg class="jm-gx psn-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${g}</svg>`;
}
function gambarSebaran() {
  const sek = hitungPer(HASIL, (b) => b.sektor).map(({ k, n }) => ({ k, n, lbl: t("psn.sektor." + k), kelas: "psn-s-" + k, tip: `${t("psn.sektor." + k)}: ${N(n)} ${t("psn.butir")}` }));
  const prov = hitungPer(HASIL, (b) => b.prov_kode).slice(0, 12).map(({ k, n }) => ({ k, n, lbl: provNama(k), kelas: "psn-s-kawasan", tip: `${provNama(k)}: ${N(n)} ${t("psn.butir")}` }));
  const dana = hitungPer(HASIL, (b) => b.dana).map(({ k, n }) => ({ k, n, lbl: t("psn.dana." + k), kelas: "psn-d-" + k, tip: `${t("psn.dana." + k)}: ${N(n)} ${t("psn.butir_sumber")}` }));
  $("psnGrSek").innerHTML = batangSvg(sek, { aksi: "sektor:", label: t("psn.h.sektor") });
  $("psnGrProv").innerHTML = batangSvg(prov, { aksi: "prov:", label: t("psn.h.prov") });
  $("psnGrDana").innerHTML = dana.length ? batangSvg(dana, { aksi: "dana:", label: t("psn.h.dana") }) + `<p class="psn-bantu">${esc(t("psn.dana.catatan"))}</p>` : `<p class="psn-bantu">${esc(t("psn.kosong"))}</p>`;
}
function gambarGantt() {
  const L = barisLinimasa(HASIL), el = $("psnGanttIsi");
  if (!L.length) { el.innerHTML = `<p class="psn-bantu">${esc(t("psn.kosong"))}</p>`; return; }
  const th0 = Math.min(...L.map((r) => r.mulai), 2022), th1 = Math.max(...L.map((r) => r.selesai), 2030) + 1, W = 900, Lb = 230, rh = 34, T = 26, H = T + L.length * rh + 8, X = (y) => Lb + ((y - th0) / (th1 - th0)) * (W - Lb - 16);
  let g = "";
  for (let y = th0; y <= th1; y++) g += `<line class="psn-gr" x1="${X(y).toFixed(1)}" x2="${X(y).toFixed(1)}" y1="${T - 6}" y2="${H - 4}"/><text class="jm-gf-t1" x="${X(y).toFixed(1)}" y="14" text-anchor="middle">${y}</text>`;
  L.forEach((r, i) => {
    const y = T + i * rh, b = r.b, x0 = X(r.mulai), x1 = Math.max(X(r.selesai + 0.5), x0 + 8);
    g += `<g class="psn-gb" data-buka="${esc(b.id)}"><text class="jm-gf-t1" x="${Lb - 8}" y="${y + 18}" text-anchor="end">${esc(b.nama.length > 34 ? b.nama.slice(0, 33) + "…" : b.nama)}</text>
      <rect class="psn-bar psn-s-${esc(b.sektor)}" x="${x0.toFixed(1)}" y="${y + 7}" width="${(x1 - x0).toFixed(1)}" height="14" rx="3" data-tip="${esc(`${b.nama}: ${r.mulai} - ${r.selesai}${b.cod_ket ? " (" + b.cod_ket + ")" : ""}`)}"/>`
      + r.tonggak.map((x) => `<path class="psn-tg" d="M${X(tahunDari(x.tgl) + 0.5).toFixed(1)} ${y + 3} l5 5 -5 5 -5 -5z" data-tip="${esc(`${x.tgl}: ${x.teks}`)}"/>`).join("") + `</g>`;
  });
  el.innerHTML = `<svg class="jm-gx psn-svg psn-svg-g" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("psn.t.gantt.hl"))}">${g}</svg><p class="psn-bantu">${esc(t("psn.gantt.catatan"))}</p>`;
}

/* ---------- tabel ---------- */
const KOLOM = { prio: (b) => (b.energi === "inti" ? 0 : b.energi === "turunan" ? 1 : 2) * 100000 + (b.lengkap ? 0 : 50000) + b.no + (b.tipe === "proyek" ? 0 : 1000), no: (b) => b.no + (b.tipe === "proyek" ? 0 : 1000), nama: (b) => b.nama, sektor: (b) => b.sektor, status: (b) => STATUS.indexOf(b.status), invest: (b) => b.investasi?.usd_miliar ?? (b.investasi?.rp_triliun ? b.investasi.rp_triliun / 16 : -1), cod: (b) => b.cod ?? 9999 };
function gambarTabel() {
  const f = KOLOM[S.uk] || KOLOM.no, urut = [...HASIL].sort((a, c) => { const x = f(a), y = f(c); return (typeof x === "string" ? x.localeCompare(y, "id") : x - y) * S.ua || a.id.localeCompare(c.id); });
  const awal = (S.hal - 1) * PER, hal = urut.slice(awal, awal + PER);
  const th = (k, uk, kelas = "") => `<th class="${kelas}" aria-sort="${S.uk === uk ? (S.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-uk="${uk}">${esc(t(k))}</button></th>`;
  $("psnTabelIsi").innerHTML = hal.length ? `<div class="jm-gulir"><table class="jm-tabel psn-tabel" data-urut="tidak"><thead><tr>${th("psn.col.no", "no", "jm-no")}${th("psn.col.nama", "nama")}${th("psn.col.sektor", "sektor")}<th>${esc(t("psn.col.lokasi"))}</th>${th("psn.col.status", "status")}${th("psn.col.invest", "invest")}${th("psn.col.cod", "cod")}<th>${esc(t("psn.col.bukti"))}</th></tr></thead><tbody>${hal.map((b) => `<tr>
    <td class="jm-no">${b.tipe === "proyek" ? b.no : "P" + b.no}</td><td><button type="button" class="psn-nama" data-buka="${esc(b.id)}">${esc(b.nama)}</button></td><td>${pilSektor(b.sektor)}</td>
    <td>${b.prov_kode.length ? b.prov_kode.slice(0, 2).map((k) => `<span class="psn-prov"><img src="/img/provinsi/${esc(k)}.png" width="18" height="18" alt="" loading="lazy" decoding="async" data-galat="hapus">${esc(provNama(k))}</span>`).join(" ") + (b.prov_kode.length > 2 ? ` +${b.prov_kode.length - 2}` : "") : esc(b.lokasi.length > 28 ? b.lokasi.slice(0, 27) + "…" : b.lokasi)}</td>
    <td>${pilStatus(b.status)}</td><td class="psn-ang">${esc(nilaiInvest(b.investasi) || "-")}</td><td class="psn-ang">${b.cod ?? "-"}</td><td>${bukti(b.tingkat_bukti)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="jm-kosong">${ikon("cari2", 32)}<p>${esc(t("psn.kosong"))}</p></div>`;
  $("psnPag").innerHTML = paginasiHtml({ hal: S.hal, total: urut.length, per: PER, satuan: "psn.satuan" });
}

/* ---------- peta ---------- */
let peta = null, petaSiap = false;
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
const fitur = () => ({ type: "FeatureCollection", features: HASIL.filter((b) => b.lat != null).map((b) => ({ type: "Feature", geometry: { type: "Point", coordinates: [b.lng, b.lat] }, properties: { id: b.id, s: b.sektor, e: b.energi ? 1 : 0, p: b.presisi_titik === "kabupaten" ? 1 : 0 } })) });
function perbaruiPeta() { if (!peta || !petaSiap) return; peta.getSource("psn")?.setData(fitur()); peta.setFilter("psn-sel", ["==", ["get", "id"], S.sel]); }
function pasangLapisan() {
  const il = rapikanPeta(peta);
  peta.addSource("psn", { type: "geojson", data: fitur() });
  const warnaMatch = ["match", ["get", "s"], ...SEKTOR.flatMap((s) => [s, warna(WARNA_SEKTOR[s])]), warna("--ink2")];
  peta.addLayer({ id: "psn-titik", type: "circle", source: "psn", paint: { "circle-radius": ["case", ["==", ["get", "e"], 1], 8, 5], "circle-color": warnaMatch, "circle-stroke-color": warna("--card"), "circle-stroke-width": 1.5, "circle-opacity": ["case", ["==", ["get", "p"], 1], 0.95, 0.6] } }, il || undefined);
  peta.addLayer({ id: "psn-sel", type: "circle", source: "psn", filter: ["==", ["get", "id"], S.sel], paint: { "circle-radius": 13, "circle-color": warna("--card"), "circle-opacity": 0, "circle-stroke-color": warna("--sorot"), "circle-stroke-width": 3 } });
  pasangBatas(peta, warna, il, "psn-titik");
}
function tampilTip(id, pt) {
  const b = SEMUA.find((x) => x.id === id), tip = $("psnTip"); if (!b) return;
  tip.innerHTML = `<b>${esc(b.nama)}</b><span>${esc(t("psn.sektor." + b.sektor))}${b.prov_kode[0] ? ", " + esc(provNama(b.prov_kode[0])) : ""}</span><span>${esc(t("psn.status." + b.status))}${b.presisi_titik ? "; " + esc(t("psn.titik." + b.presisi_titik)) : ""}</span>`;
  tip.hidden = false;
  tip.style.left = Math.max(8, Math.min($("psnKanvas").clientWidth - tip.offsetWidth - 8, pt.x + 14)) + "px";
  tip.style.top = Math.max(8, Math.min($("psnKanvas").clientHeight - tip.offsetHeight - 8, pt.y + 14)) + "px";
}
function bukaPeta() {
  muatMapLibre().then(() => {
    peta = new maplibregl.Map({ container: "psnKanvas", style: gaya(), bounds: BATAS_ID, minZoom: 2, maxZoom: 12, dragRotate: false, pitchWithRotate: false, attributionControl: false });
    peta.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("style.load", () => { pasangLapisan(); petaSiap = true; });
    new ResizeObserver(() => peta.resize()).observe($("psnKanvas"));
    peta.on("click", "psn-titik", (e) => bukaRincian(e.features[0].properties.id));
    peta.on("mousemove", "psn-titik", (e) => { peta.getCanvas().style.cursor = "pointer"; tampilTip(e.features[0].properties.id, e.point); });
    peta.on("mouseleave", "psn-titik", () => { peta.getCanvas().style.cursor = ""; $("psnTip").hidden = true; });
    new MutationObserver(() => { petaSiap = false; peta.setStyle(gaya()); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }).catch(() => { $("psnKanvas").innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("psn.peta.galat"))}</p></div>`; });
}
function gambarLegenda() {
  const per = new Map(hitungPer(HASIL.filter((b) => b.lat != null), (b) => b.sektor).map((x) => [x.k, x.n]));
  $("psnLegenda").innerHTML = `<ul class="psn-leg">${SEKTOR.filter((s) => per.has(s)).map((s) => `<li><button type="button" class="psn-leg-b psn-s-${s}" data-saring="sektor:${s}" aria-pressed="${S.sektor === s}"><i class="psn-dot"></i>${ikon(IKON_SEKTOR[s], 16)}<span>${esc(t("psn.sektor." + s))}</span><small>${esc(N(per.get(s)))}</small></button></li>`).join("")}</ul>
    <p class="psn-bantu">${esc(t("psn.peta.titik", { n: N(HASIL.filter((b) => b.lat == null).length) }))}</p>`;
}

/* ---------- panel rinci ---------- */
const orang = (o) => { const u = logoOrg(o.org_id, o.nama)[0], neg = Object.entries(NEGARA).find(([k]) => o.nama.startsWith(k))?.[1]; return `<li class="psn-org">${u ? `<img src="${esc(u)}" width="28" height="28" alt="" loading="lazy" data-galat="hapus">` : ikon("gedung", 24)}<span>${esc(o.nama)}</span>${neg ? `<img class="psn-bd" src="/img/bendera/${neg}.svg" width="22" height="16" alt="" loading="lazy">` : ""}</li>`; };
function bukaRincian(id) {
  const b = SEMUA.find((x) => x.id === id); if (!b) return;
  S.sel = id; perbaruiPeta();
  const dlg = $("psnDlg"), sumberDari = (k) => b.sumber.find((s) => s.id === k);
  const sub = (kunci, html) => (html ? `<section class="psn-r"><h3>${esc(t(kunci))}</h3>${html}</section>` : "");
  const link = (kode) => { const s = sumberDari(kode); return s && URL_AMAN(s.url) ? ` <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.penerbit)}</a>` : ""; };
  const fakta = [["lokasi", t("psn.r.lokasi"), b.lokasi], ["wilayah", t("psn.r.prov"), b.prov_kode.map(provNama).join(", ") || "-"], ["kartu", t("psn.r.invest"), nilaiInvest(b.investasi) || "-"], ["tab", t("psn.r.kap"), nilaiKap(b.kapasitas) || "-"], ["kalender", t("psn.r.cod"), b.cod ? String(b.cod) + (b.cod_ket ? " (" + b.cod_ket + ")" : "") : "-"], ["kartu", t("psn.r.dana"), b.dana.map((d) => t("psn.dana." + d)).join(", ") || "-"]];
  dlg.innerHTML = `<header class="psn-r-h"><span class="psn-r-ik psn-s-${esc(b.sektor)}">${ikon(IKON_SEKTOR[b.sektor], 24)}</span><div><h2 id="psnDlgJ">${esc(b.nama)}</h2><p>${pilSektor(b.sektor)} ${pilStatus(b.status)} ${bukti(b.tingkat_bukti)}${b.energi ? ` <span class="jm-pil jm-pil-info">${ikon("petir", 14)}<span>${esc(t("psn.energi." + b.energi))}</span></span>` : ""}</p></div><button type="button" class="jm-tbl psn-x" data-tutup aria-label="${esc(t("psn.tutup"))}">${ikon("silang", 16)}</button></header>
    ${b.progres != null ? `<div class="psn-prog" role="img" aria-label="${esc(t("psn.r.progres", { n: b.progres }))}"><svg class="jm-gx" viewBox="0 0 200 12"><rect class="psn-prog-l" x="0" y="2" width="200" height="8" rx="4"/><rect class="psn-prog-i" x="0" y="2" width="${(b.progres * 2).toFixed(0)}" height="8" rx="4" data-tip="${esc(t("psn.r.progres", { n: b.progres }))}"/></svg><b>${esc(N(b.progres))}%</b></div>` : ""}
    <dl class="psn-r-fakta">${fakta.map(([ik, a, v]) => `<div>${ikon(ik === "tab" ? "tabel" : ik, 16)}<dt>${esc(a)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
    ${sub("psn.r.pemrakarsa", b.pemrakarsa.length ? `<ul class="psn-orgs">${b.pemrakarsa.map(orang).join("")}</ul>` : "")}${sub("psn.r.pelaksana", b.pelaksana.length ? `<ul class="psn-orgs">${b.pelaksana.map(orang).join("")}</ul>` : "")}
    ${sub("psn.r.listrik", b.listrik_ebt ? `<p>${esc(b.listrik_ebt)}</p>` : "")}
    ${sub("psn.r.tonggak", b.tonggak.length ? `<ol class="psn-tl">${b.tonggak.map((x) => `<li>${ikon("kalender", 14)}<b>${esc(x.tgl)}</b><span>${esc(x.teks)}${link(x.sumber)}</span></li>`).join("")}</ol>` : "")}
    ${sub("psn.r.isu", b.isu.length ? `<ul class="psn-isu">${b.isu.map((x) => `<li>${ikon("peringatan", 14)}<b>${esc(t("psn.isu." + x.jenis))}</b><span>${esc(x.teks)}${link(x.sumber)}</span></li>`).join("")}</ul>` : "")}
    ${sub("psn.r.kaitan", (b.proyek_gem.length || b.proyek_meti.length) ? `<p>${esc(t("psn.r.kaitan_n", { g: N(b.proyek_gem.length), m: N(b.proyek_meti.length) }))} <a href="/pelacak-proyek">${esc(t("psn.r.ke_pelacak"))}</a> <a href="/program">${esc(t("psn.r.ke_ruptl"))}</a></p>` : `<p class="psn-bantu">${esc(t("psn.r.kaitan_kosong"))}</p>`)}
    ${sub("psn.r.hukum", `<ul class="psn-orgs">${b.dasar_hukum.map((h) => `<li>${ikon("regulasi", 18)}<span>${esc(D.regulasi.find((r) => r.id === h)?.judul || h)}</span></li>`).join("")}</ul>`)}
    ${b.catatan ? `<p class="psn-bantu">${esc(b.catatan)}</p>` : ""}
    <section class="psn-r"><h3>${esc(t("psn.r.sumber"))}</h3><ul class="psn-sm">${b.sumber.map((s) => `<li>${bukti(s.bukti)}<span>${URL_AMAN(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.judul)}</a>` : esc(s.judul)}<small>${esc(s.penerbit)}${s.dibuka && s.dibuka !== 200 ? ` <em>${esc(t("psn.r.belum_dibuka"))}</em>` : ""}${s.tanggal ? ", " + esc(s.tanggal.length > 7 ? tanggal(s.tanggal) : s.tanggal) : ""}</small></span></li>`).join("")}</ul></section>`;
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
}
$("psnDlg").addEventListener("click", (e) => { if (e.target.closest("[data-tutup]") || e.target === $("psnDlg")) { $("psnDlg").close(); S.sel = ""; perbaruiPeta(); } });

/* ---------- terap saringan ---------- */
function terap() {
  S.hal = 1; HASIL = saring(SEMUA, S);
  $("psnHapus").hidden = !(S.q || S.sektor || S.prov || S.status || S.energi || S.dana || S.lengkap);
  $("psnHitung").textContent = t("psn.hitung", { a: N(HASIL.length), b: N(SEMUA.length) });
  $("psnJPeta").textContent = t("psn.j.peta", { n: N(HASIL.filter((b) => b.lat != null).length) });
  $("psnJTabel").textContent = t("psn.j.tabel", { n: N(HASIL.length) });
  nanti(() => { perbaruiPeta(); gambarLegenda(); gambarGantt(); gambarSebaran(); gambarTabel(); });
}
terap();
bukaPeta();
/* tautan dalam /program#psn-NNN membuka rincian butir itu */
const idHash = decodeURIComponent(location.hash.slice(1));
if (SEMUA.some((b) => b.id === idHash)) bukaRincian(idHash);
document.addEventListener("jm:bahasa", () => location.reload());
