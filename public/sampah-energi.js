/* /sampah-energi: sampah jadi energi ujung ke ujung. Kerangka: kepala + ubin angka, delapan tab (?tab=...), tiap tab dimuat malas (swe_<nama>.js).
   Data baru: sampah_energi.json (rujukan id + butir bersumber); data lama dirujuk saat runtime (swe_umum.js). INP: tab berganti seketika (aria-selected + panel), isi berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khSisi } from "/inti/kh.js";
import { hantuHtml, nanti, galatHtml } from "/inti/umum.js";
import { B, muat, t, esc, ikon, num, urlGet, kosongTab, bukti, pselRows, pertama, statusDari } from "/swe_umum.js";

const TAB = [
  { k: "sumber", ikon: "tabel" }, { k: "jalur", ikon: "pabrik" }, { k: "kota", ikon: "peta" }, { k: "konsorsium", ikon: "gedung" },
  { k: "aturan", ikon: "palu" }, { k: "tarif", ikon: "tag" }, { k: "pemasok", ikon: "globe" }, { k: "isu", ikon: "peringatan" },
  { k: "ringkasan", ikon: "analisis" }, { k: "dasar", ikon: "buku" },
].map((d) => ({ ...d, mod: d.k === "ringkasan" || d.k === "dasar" ? "/tek_" + d.k + ".js?k=" + ({ ringkasan: "biomassa-sampah", dasar: "sampah-energi" })[d.k] : "/swe_" + d.k + ".js" }));
const siap = new Set(), qsTab = {};
let kini = "";
const $ = (id) => document.getElementById(id);

function kepala() {
  const P = pselRows(), tm = B.sw?.timbulan, ton = P.reduce((s, r) => s + (pertama(r.kapasitas_ton_hari) || 0), 0), op = P.filter((r) => statusDari(r) === "beroperasi"), bangun = P.filter((r) => statusDari(r) === "konstruksi");
  $("jawab").textContent = B.sw ? t("swe.lead", { n: num(P.length, 0), op: num(op.length, 0), k: num(bangun.length, 0), kota: num(B.sw.program.ringkas.kota, 0) }) : t("swe.lead_kosong");
  const ubin = [
    { ikon: "tabel", nilai: tm ? num(tm.timbulan.nilai, 1) : "-", satuan: t("swe.u.juta_th"), label: t("swe.u.timbulan", { th: tm?.timbulan.tahun || "" }) },
    { ikon: "tek-bio", nilai: tm ? num(tm.tpa.open_dumping, 0) : "-", satuan: "TPA", label: t("swe.u.open_dumping", { n: tm?.tpa.total || "" }) },
    { ikon: "petir", nilai: P.length ? num(P.length, 0) : "-", satuan: t("swe.u.proyek_k"), label: t("swe.u.proyek", { ton: num(ton, 0) }) },
    { ikon: "kawasan", nilai: B.sw ? num(B.sw.program.ringkas.kota, 0) : "-", satuan: t("swe.u.kota_k"), label: t("swe.u.kota_l") },
  ];
  const sisi = khSisi(".jm-kh", { ubin });
  const lencana = [bukti(tm?.timbulan.tingkat_bukti, { sumber: "KLH/BPLH (SIPSN)", tanggal: "2025" }), bukti(tm?.tpa.tingkat_bukti, { sumber: "KLH/BPLH", tanggal: "2025" }), bukti("media", { sumber: "psel.json (kurasi METI)", tanggal: B.psel?.dibangun_pada || "" }), bukti("media", { sumber: "Detik, Bisnis.com", tanggal: "2025" })];
  sisi?.querySelectorAll(".jm-kh-ub").forEach((u, i) => u.insertAdjacentHTML("beforeend", `<div class="rg3-ub-bukti">${lencana[i] || ""}</div>`));
}
function tabAwal() { const k = urlGet("tab"); return TAB.some((x) => x.k === k) ? k : TAB[0].k; }
function bangunTab() {
  $("sweTab").innerHTML = `<div class="jm-tab jm-tab-rata" role="tablist" aria-label="${esc(t("swe.tab"))}" data-i18n-attr="aria-label:swe.tab">${TAB.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-tab="${d.k}" aria-selected="false" aria-controls="p-${d.k}" tabindex="-1" title="${esc(t("swe.tab." + d.k))}">${ikon(d.ikon, 18)}<span data-i18n="swe.tab.${d.k}">${esc(t("swe.tab." + d.k))}</span></button>`).join("")}</div>`;
  $("isi").innerHTML = TAB.map((d) => `<section id="p-${d.k}" class="rg3-panel" role="tabpanel" aria-labelledby="tab-${d.k}" hidden></section>`).join("");
}
function buka(k, { ubahUrl = true } = {}) {
  const d = TAB.find((x) => x.k === k) || TAB[0];
  for (const b of $("sweTab").querySelectorAll("[role=tab]")) { const on = b.dataset.tab === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
  for (const x of TAB) $("p-" + x.k).hidden = x.k !== d.k;
  if (ubahUrl) {
    if (kini) { const p = new URLSearchParams(location.search); p.delete("tab"); qsTab[kini] = p.toString(); }
    history.replaceState(null, "", location.pathname + "?tab=" + d.k + (qsTab[d.k] ? "&" + qsTab[d.k] : ""));
  }
  kini = d.k;
  const panel = $("p-" + d.k);
  if (siap.has(d.k)) return;
  siap.add(d.k);
  panel.innerHTML = hantuHtml(3);
  nanti(async () => {
    try { const m = await import(d.mod); panel.innerHTML = ""; await m.mulai(panel); }
    catch (e) { console.error(e); panel.innerHTML = galatHtml("layanan"); siap.delete(d.k); }
  });
}
async function mulai() {
  await mulaiHalaman();
  document.addEventListener("jm:bahasa", () => location.reload());
  $("isi").innerHTML = hantuHtml(3);
  await muat();
  kepala();
  bangunTab();
  if (!B.sw) { $("isi").innerHTML = kosongTab("swe.kosong"); return; }
  $("sweTab").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) buka(b.dataset.tab); });
  $("sweTab").addEventListener("keydown", (e) => {
    const i = TAB.findIndex((d) => d.k === document.activeElement?.dataset?.tab), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = $("sweTab").querySelectorAll("[role=tab]")[(i + s + TAB.length) % TAB.length]; b.focus(); b.click();
  });
  buka(tabAwal(), { ubahUrl: false });
}
mulai();
