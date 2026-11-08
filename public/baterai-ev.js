/* /baterai-ev: ekosistem baterai dan kendaraan listrik ujung ke ujung. Delapan tab hulu ke hilir (?tab=...), tiap tab dimuat malas lewat be_tab.js.
   Pola sama dengan /rantai-global (tab ujung ke ujung, data dibaca runtime, tahan kosong). INP: tab berganti seketika (aria-selected + panel), isi berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khSisi } from "/inti/kh.js";
import { hantuHtml, nanti, galatHtml } from "/inti/umum.js";
import { X, muat, t, esc, ikon, num, bukti, urlGet, kosongTab, tahapData, buktiBe } from "/be_umum.js";

const TAB = [
  { k: "tambang", ikon: "beliung" }, { k: "olah", ikon: "pabrik" }, { k: "prekursor", ikon: "labu" }, { k: "sel", ikon: "baterai" },
  { k: "kendaraan", ikon: "mobil" }, { k: "pengisian", ikon: "colokan" }, { k: "bess", ikon: "sistem-listrik" }, { k: "daur", ikon: "daur" },
  { k: "ringkasan", ikon: "analisis" }, { k: "dasar", ikon: "buku" },
];
const siap = new Set(), qsTab = {};
let kini = "";
const $ = (id) => document.getElementById(id);

function kepala() {
  const P = X.be?.penjualan, kap = tahapData("tambang")?.kapasitas?.[0], sel = (X.hili?.baris || []).filter((b) => b.rantai === "sel" && b.status === "operasi" && b.kapasitas?.nilai).reduce((a, b) => a + b.kapasitas.nilai, 0);
  const bev = P?.bev?.at(-1), spklu = X.be?.pengisian?.spklu_titik?.at(-1), n = TAB.length;
  $("jawab").textContent = bev ? t("bev.lead", { n: num(n), b: num(bev.unit), s: num(spklu?.jumlah || 0), g: num(sel, 0) }) : t("bev.lead_kosong");
  const ubin = [
    { ikon: "beliung", nilai: kap ? num(kap.nilai, 1) : "-", satuan: kap ? "Mt Ni" : "", label: t("bev.u.nikel") },
    { ikon: "baterai", nilai: sel ? num(sel, 0) : "-", satuan: sel ? "GWh" : "", label: t("bev.u.sel") },
    { ikon: "mobil", nilai: bev ? num(bev.unit) : "-", label: t("bev.u.bev", { th: bev?.tahun || "" }) },
    { ikon: "colokan", nilai: spklu ? num(spklu.jumlah) : "-", label: t("bev.u.spklu") },
  ];
  const sisi = khSisi(".jm-kh", { ubin });
  const lencana = [kap ? buktiBe(kap) : bukti(""), bukti(sel ? "media" : "", { sumber: "hilirisasi.json" }), bev ? buktiBe(bev) : bukti(""), spklu ? buktiBe(spklu) : bukti("")];
  sisi?.querySelectorAll(".jm-kh-ub").forEach((u, i) => u.insertAdjacentHTML("beforeend", `<div class="rg3-ub-bukti">${lencana[i]}</div>`));
}
function tabAwal() { const k = urlGet("tab"); return TAB.some((x) => x.k === k) ? k : TAB[0].k; }
function bangunTab() {
  $("rg3Tab").innerHTML = `<div class="jm-tab jm-tab-rata" role="tablist" aria-label="${esc(t("bev.tab"))}" data-i18n-attr="aria-label:bev.tab">${TAB.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-tab="${d.k}" aria-selected="false" aria-controls="p-${d.k}" tabindex="-1" title="${esc(t("bev.tab." + d.k))}">${ikon(d.ikon, 18)}<span data-i18n="bev.tab.${d.k}">${esc(t("bev.tab." + d.k))}</span></button>`).join("")}</div>`;
  $("isi").innerHTML = TAB.map((d) => `<section id="p-${d.k}" class="rg3-panel" role="tabpanel" aria-labelledby="tab-${d.k}" hidden></section>`).join("");
}
function buka(k, { ubahUrl = true } = {}) {
  const d = TAB.find((x) => x.k === k) || TAB[0];
  for (const b of $("rg3Tab").querySelectorAll("[role=tab]")) { const on = b.dataset.tab === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
  for (const x of TAB) $("p-" + x.k).hidden = x.k !== d.k;
  if (ubahUrl) {
    if (kini) { const p = new URLSearchParams(location.search); p.delete("tab"); qsTab[kini] = p.toString(); }
    history.replaceState(null, "", location.pathname + "?tab=" + d.k + (qsTab[d.k] ? "&" + qsTab[d.k] : ""));
  }
  kini = d.k;
  const panel = $("p-" + d.k);
  if (siap.has(d.k)) { dispatchEvent(new Event("resize")); return; }
  siap.add(d.k);
  panel.innerHTML = hantuHtml(3);
  nanti(async () => {
    try { const m = await import("/be_tab.js"); panel.innerHTML = ""; await m.mulai(panel, d.k); }
    catch (e) { console.error(e); panel.innerHTML = galatHtml("layanan"); siap.delete(d.k); }
    dispatchEvent(new Event("resize"));
  });
}
async function mulai() {
  await mulaiHalaman();
  document.addEventListener("jm:bahasa", () => location.reload());
  $("isi").innerHTML = hantuHtml(3);
  await muat();
  kepala();
  bangunTab();
  if (!X.be) { $("isi").innerHTML = kosongTab("bev.kosong_data"); return; }
  $("rg3Tab").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) buka(b.dataset.tab); });
  $("isi").addEventListener("click", (e) => { const b = e.target.closest("[data-pindah]"); if (b) { buka(b.dataset.pindah); scrollTo({ top: 0 }); } });
  $("rg3Tab").addEventListener("keydown", (e) => {
    const i = TAB.findIndex((d) => d.k === document.activeElement?.dataset?.tab), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = $("rg3Tab").querySelectorAll("[role=tab]")[(i + s + TAB.length) % TAB.length]; b.focus(); b.click();
  });
  buka(tabAwal(), { ubahUrl: false });
}
mulai();
