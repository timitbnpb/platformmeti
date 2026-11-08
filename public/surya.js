/* /surya: surya ujung ke ujung untuk program PLTS 100 GW. Kerangka: kepala + ubin angka, delapan tab hulu ke hilir (?tab=...), tiap tab dimuat malas (sy_tab.js).
   Data baru: surya_modul.json; berkas lain dirujuk saat runtime (sy_umum.js). INP: tab berganti seketika (aria-selected + panel), isi berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khSisi } from "/inti/kh.js";
import { hantuHtml, nanti, galatHtml } from "/inti/umum.js";
import { X, muat, t, esc, ikon, num, bukti, urlGet, kosongTab, buktiSy, bulanTeks } from "/sy_umum.js";

const TAB = [
  { k: "bahan", ikon: "beliung" }, { k: "rantai", ikon: "pabrik" }, { k: "proyek", ikon: "proyek" }, { k: "potensi", ikon: "peta" },
  { k: "biaya", ikon: "kartu" }, { k: "kebijakan", ikon: "palu" }, { k: "daur", ikon: "daur" }, { k: "isu", ikon: "peringatan" },
  { k: "ringkasan", ikon: "analisis" }, { k: "dasar", ikon: "buku" },
];
const siap = new Set(), qsTab = {};
let kini = "";
const $ = (id) => document.getElementById(id);

function kepala() {
  const A = X.sy?.atap, rl = A?.realisasi?.at(-1), kuota = A?.jumlah?.[A.tahun.indexOf(2026)], rp = X.rantaiPlts?.ringkas, P = X.sy?.program;
  $("jawab").textContent = X.sy ? t("sur.lead", { n: num(TAB.length), a: rl ? num(rl.mw, 0) : "-", g: rp ? num(rp.total_mwp / 1000, 1) : "-", t: P ? num(P.target.gw) : "-" }) : t("sur.lead_kosong");
  const ubin = [
    { ikon: "panel-surya", nilai: rl ? num(rl.mw, 0) : "-", satuan: rl ? "MWp" : "", label: t("sur.u.atap", { bln: rl ? bulanTeks(rl.tanggal) : "" }) },
    { ikon: "kalender", nilai: kuota ? num(kuota) : "-", satuan: kuota ? "MW" : "", label: t("sur.u.kuota") },
    { ikon: "pabrik", nilai: rp ? num(rp.total_mwp / 1000, 1) : "-", satuan: rp ? "GWp/th" : "", label: t("sur.u.modul", { n: rp ? num(rp.pabrikan) : "-" }) },
    { ikon: "bendera", nilai: P ? num(P.target.gw) : "-", satuan: P ? "GWp" : "", label: t("sur.u.target", { th: P?.target.tahun_selesai || "" }) },
  ];
  const sisi = khSisi(".jm-kh", { ubin });
  const lencana = [rl ? buktiSy(rl) : bukti(""), kuota ? buktiSy(A) : bukti(""), bukti(rp ? "resmi" : "", { sumber: "DJEBTKE ESDM", tanggal: X.rantaiPlts?.sumber?.tanggal }), P ? buktiSy(P.target) : bukti("")];
  sisi?.querySelectorAll(".jm-kh-ub").forEach((u, i) => u.insertAdjacentHTML("beforeend", `<div class="rg3-ub-bukti">${lencana[i]}</div>`));
}
function tabAwal() { const k = urlGet("tab"); return TAB.some((x) => x.k === k) ? k : TAB[0].k; }
function bangunTab() {
  $("sTab").innerHTML = `<div class="jm-tab jm-tab-rata" role="tablist" aria-label="${esc(t("sur.tab"))}" data-i18n-attr="aria-label:sur.tab">${TAB.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-tab="${d.k}" aria-selected="false" aria-controls="p-${d.k}" tabindex="-1" title="${esc(t("sur.tab." + d.k))}">${ikon(d.ikon, 18)}<span data-i18n="sur.tab.${d.k}">${esc(t("sur.tab." + d.k))}</span></button>`).join("")}</div>`;
  $("isi").innerHTML = TAB.map((d) => `<section id="p-${d.k}" class="rg3-panel" role="tabpanel" aria-labelledby="tab-${d.k}" hidden></section>`).join("");
}
function buka(k, { ubahUrl = true } = {}) {
  const d = TAB.find((x) => x.k === k) || TAB[0];
  for (const b of $("sTab").querySelectorAll("[role=tab]")) { const on = b.dataset.tab === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
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
    try { const m = await import("/sy_tab.js"); panel.innerHTML = ""; await m.mulai(panel, d.k); }
    catch (e) { console.error(e); panel.innerHTML = galatHtml("layanan"); siap.delete(d.k); }
    dispatchEvent(new Event("resize"));
  });
}
async function mulai() {
  await mulaiHalaman();
  document.addEventListener("jm:bahasa", () => location.reload());
  $("isi").innerHTML = hantuHtml(3);
  await muat(["sy", "rantaiPlts"]);
  kepala();
  bangunTab();
  if (!X.sy) { $("isi").innerHTML = kosongTab("sur.kosong_data"); return; }
  $("sTab").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) buka(b.dataset.tab); });
  $("isi").addEventListener("click", (e) => { const b = e.target.closest("[data-pindah]"); if (b) { buka(b.dataset.pindah); scrollTo({ top: 0 }); } });
  $("sTab").addEventListener("keydown", (e) => {
    const i = TAB.findIndex((d) => d.k === document.activeElement?.dataset?.tab), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = $("sTab").querySelectorAll("[role=tab]")[(i + s + TAB.length) % TAB.length]; b.focus(); b.click();
  });
  buka(tabAwal(), { ubahUrl: false });
}
mulai();
