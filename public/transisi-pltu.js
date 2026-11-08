/* /transisi-pltu: transisi PLTU ujung ke ujung. Kerangka: kepala + ubin angka, sepuluh tab ujung ke ujung (?tab=...), tiap tab dimuat malas (tpl_<nama>.js).
   Data baru: transisi_pltu.json; data lama dirujuk saat runtime (tpl_umum.js). INP: tab berganti seketika (aria-selected + panel), isi berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khSisi } from "/inti/kh.js";
import { hantuHtml, nanti, galatHtml } from "/inti/umum.js";
import { B, muat, t, esc, ikon, num, urlGet, kosongTab, bukti, juta } from "/tpl_umum.js";

const TAB = [
  { k: "tambang", ikon: "beliung" }, { k: "armada", ikon: "industri" }, { k: "emisi", ikon: "karbon" }, { k: "pensiun", ikon: "linimasa" }, { k: "ganti", ikon: "tek-surya" },
  { k: "cofiring", ikon: "tek-bio" }, { k: "pekerja", ikon: "orang" }, { k: "dana", ikon: "kartu" }, { k: "kebijakan", ikon: "regulasi" }, { k: "isu", ikon: "peringatan" }, { k: "enb", ikon: "tek-panas" },
  { k: "dasar", ikon: "buku" },
].map((d) => ({ ...d, mod: d.k === "ringkasan" || d.k === "dasar" ? "/tek_" + d.k + ".js?k=" + ({ ringkasan: "", dasar: "transisi-berkeadilan" })[d.k] : "/tpl_" + d.k + ".js" }));
const siap = new Set(), qsTab = {};
let kini = "";
const $ = (id) => document.getElementById(id);

function kepala() {
  const m = B.pltu?.meta, p = B.tp?.tambang?.produksi?.at(-1), n = B.tp?.pengganti?.baris?.length || 0;
  const mati = B.pltu?.dampak?.nasional?.find((x) => x.id === "n1");
  $("jawab").textContent = B.tp && m ? t("tpl.lead", { mw: num(Math.round(m.mw_operasi / 1000), 0), n: num(m.unit_operasi, 0), mati: num(mati?.nilai || 0, 0) }) : t("tpl.lead_kosong");
  const ubin = [
    { ikon: "industri", nilai: m ? num(m.mw_operasi / 1000, 1) : "-", satuan: "GW", label: t("tpl.u.armada") },
    { ikon: "beliung", nilai: p ? num(p.produksi, 0) : "-", satuan: t("tpl.u.juta_t"), label: t("tpl.u.produksi", { th: p?.tahun || "" }) },
    { ikon: "peringatan", nilai: mati ? num(mati.nilai, 0) : "-", satuan: t("tpl.u.jiwa"), label: t("tpl.u.mati") },
    { ikon: "tek-surya", nilai: n ? String(n) : "-", satuan: t("tpl.u.pltu"), label: t("tpl.u.ganti") },
  ];
  const sisi = khSisi(".jm-kh", { ubin });
  const lencana = [bukti("via-pihak-ketiga", { sumber: "Global Energy Monitor", tanggal: "2026-11" }), bukti(p?.tingkat_bukti || "media", { sumber: "ESDM / MODI", tanggal: String(p?.tahun || "") }), bukti("kajian", { sumber: "CREA, IESR", tanggal: "2023" }), bukti("hipotesis", { sumber: "METI" })];
  sisi?.querySelectorAll(".jm-kh-ub").forEach((u, i) => u.insertAdjacentHTML("beforeend", `<div class="rg3-ub-bukti">${lencana[i] || ""}</div>`));
}
function tabAwal() { const k = urlGet("tab"); return TAB.some((x) => x.k === k) ? k : TAB[0].k; }
function bangunTab() {
  $("tplTab").innerHTML = `<div class="jm-tab jm-tab-rata" role="tablist" aria-label="${esc(t("tpl.tab"))}" data-i18n-attr="aria-label:tpl.tab">${TAB.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-tab="${d.k}" aria-selected="false" aria-controls="p-${d.k}" tabindex="-1" title="${esc(t("tpl.tab." + d.k))}">${ikon(d.ikon, 18)}<span data-i18n="tpl.tab.${d.k}">${esc(t("tpl.tab." + d.k))}</span></button>`).join("")}</div>`;
  $("isi").innerHTML = TAB.map((d) => `<section id="p-${d.k}" class="rg3-panel" role="tabpanel" aria-labelledby="tab-${d.k}" hidden></section>`).join("");
}
function buka(k, { ubahUrl = true } = {}) {
  const d = TAB.find((x) => x.k === k) || TAB[0];
  for (const b of $("tplTab").querySelectorAll("[role=tab]")) { const on = b.dataset.tab === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
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
  if (!B.tp) { $("isi").innerHTML = kosongTab("tpl.kosong"); return; }
  $("tplTab").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) buka(b.dataset.tab); });
  $("tplTab").addEventListener("keydown", (e) => {
    const i = TAB.findIndex((d) => d.k === document.activeElement?.dataset?.tab), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = $("tplTab").querySelectorAll("[role=tab]")[(i + s + TAB.length) % TAB.length]; b.focus(); b.click();
  });
  buka(tabAwal(), { ubahUrl: false });
}
mulai();
