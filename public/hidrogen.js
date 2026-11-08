/* /hidrogen: hidrogen dan amonia hijau ujung ke ujung. Kerangka: kepala + ubin angka, sepuluh tab ujung ke ujung (?tab=...), tiap tab dimuat malas (h2_<nama>.js).
   Data baru: hidrogen.json; data lama dirujuk saat runtime (h2_umum.js). INP: tab berganti seketika (aria-selected + panel), isi berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khSisi } from "/inti/kh.js";
import { hantuHtml, nanti, galatHtml } from "/inti/umum.js";
import { H, muat, t, esc, ikon, num, urlGet, kosongTab, bukti, rentang, buktiS } from "/h2_umum.js";

const TAB = [
  { k: "sumber", ikon: "tek-surya" }, { k: "elektroliser", ikon: "labu" }, { k: "produksi", ikon: "pabrik" }, { k: "turunan", ikon: "industri" }, { k: "pemakaian", ikon: "mobil" },
  { k: "ekspor", ikon: "kapal" }, { k: "biaya", ikon: "tag" }, { k: "kebijakan", ikon: "regulasi" }, { k: "dunia", ikon: "globe" }, { k: "isu", ikon: "peringatan" },
].map((d) => ({ ...d, mod: "/h2_" + d.k + ".js" }));
const siap = new Set(), qsTab = {};
let kini = "";
const $ = (id) => document.getElementById(id);

function kepala() {
  const k = H.h2?.kunci;
  $("jawab").textContent = k ? t("h2.lead", { d: num(k.permintaan_mt_2024), p: num(k.pln_ton_tahun), l: rentang(k.lcoh_usd_kg, 1), t: num(k.target_2060_mt, 1) }) : t("h2.lead_kosong");
  if (!k) return;
  const ubin = [
    { ikon: "industri", nilai: num(k.permintaan_mt_2024), satuan: t("h2.u.juta_t"), label: t("h2.u.permintaan") },
    { ikon: "pabrik", nilai: num(k.pln_ton_tahun), satuan: t("h2.u.t_thn"), label: t("h2.u.pln") },
    { ikon: "tag", nilai: rentang(k.lcoh_usd_kg, 1), satuan: "USD/kg", label: t("h2.u.lcoh") },
    { ikon: "regulasi", nilai: num(k.target_2060_mt, 1), satuan: t("h2.u.juta_t"), label: t("h2.u.target") },
  ];
  const sisi = khSisi(".jm-kh", { ubin });
  const s = k.sumber_ids, lencana = [buktiS(s.permintaan, "resmi"), buktiS(s.pln, "media"), buktiS(s.lcoh, "resmi"), buktiS(s.target, "media")];
  sisi?.querySelectorAll(".jm-kh-ub").forEach((u, i) => u.insertAdjacentHTML("beforeend", `<div class="rg3-ub-bukti">${lencana[i] || ""}</div>`));
}
function tabAwal() { const k = urlGet("tab"); return TAB.some((x) => x.k === k) ? k : TAB[0].k; }
function bangunTab() {
  $("h2Tab").innerHTML = `<div class="jm-tab jm-tab-rata" role="tablist" aria-label="${esc(t("h2.tab"))}" data-i18n-attr="aria-label:h2.tab">${TAB.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-tab="${d.k}" aria-selected="false" aria-controls="p-${d.k}" tabindex="-1" title="${esc(t("h2.tab." + d.k))}">${ikon(d.ikon, 18)}<span data-i18n="h2.tab.${d.k}">${esc(t("h2.tab." + d.k))}</span></button>`).join("")}</div>`;
  $("isi").innerHTML = TAB.map((d) => `<section id="p-${d.k}" class="rg3-panel" role="tabpanel" aria-labelledby="tab-${d.k}" hidden></section>`).join("");
}
function buka(k, { ubahUrl = true } = {}) {
  const d = TAB.find((x) => x.k === k) || TAB[0];
  for (const b of $("h2Tab").querySelectorAll("[role=tab]")) { const on = b.dataset.tab === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
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
  if (!H.h2) { $("isi").innerHTML = kosongTab("h2.kosong"); return; }
  $("h2Tab").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) buka(b.dataset.tab); });
  $("h2Tab").addEventListener("keydown", (e) => {
    const i = TAB.findIndex((d) => d.k === document.activeElement?.dataset?.tab), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = $("h2Tab").querySelectorAll("[role=tab]")[(i + s + TAB.length) % TAB.length]; b.focus(); b.click();
  });
  buka(tabAwal(), { ubahUrl: false });
}
mulai();
