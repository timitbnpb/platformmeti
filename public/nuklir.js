/* /nuklir: nuklir ujung ke ujung. Kerangka: kepala + ubin angka, sepuluh tab (?tab=...), tiap tab dimuat malas (nkl_<nama>.js).
   Data baru: nuklir.json (rujukan id + butir bersumber); data lama dirujuk saat runtime (nkl_umum.js). INP: tab berganti seketika (aria-selected + panel), isi berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khSisi } from "/inti/kh.js";
import { hantuHtml, nanti, galatHtml } from "/inti/umum.js";
import { B, muat, t, esc, ikon, num, urlGet, kosongTab, bukti, bab } from "/nkl_umum.js";

const TAB = [
  { k: "rencana", ikon: "sasaran" }, { k: "lembaga", ikon: "palu" }, { k: "riset", ikon: "labu" }, { k: "teknologi", ikon: "pabrik" }, { k: "tapak", ikon: "peta" },
  { k: "bahan", ikon: "beliung" }, { k: "opini", ikon: "survei" }, { k: "asean", ikon: "asean" }, { k: "biaya", ikon: "tag" }, { k: "selamat", ikon: "perisai" },
].map((d) => ({ ...d, mod: "/nkl_" + d.k + ".js" }));
const siap = new Set(), qsTab = {};
let kini = "";
const $ = (id) => document.getElementById(id);

function kepala() {
  const A = B.nk?.rencana?.angka || [], ruptl = A.find((x) => x.k === "ruptl"), den = A.find((x) => x.k === "den44"), tapak = bab("tapak")?.baris || [], R = B.nk?.riset?.reaktor || [];
  $("jawab").textContent = B.nk ? t("nkl.lead", { mw: num(ruptl.nilai, 0), gw: num(den.nilai, 0), n: num(R.length, 0) }) : t("nkl.lead_kosong");
  const ubin = [
    { ikon: "nuklir", nilai: ruptl ? num(ruptl.nilai, 0) : "-", satuan: "MW", label: t("nkl.u.ruptl", { th: ruptl?.tahun || "" }) },
    { ikon: "sasaran", nilai: den ? num(den.nilai, 0) : "-", satuan: "GW", label: t("nkl.u.den", { th: den?.tahun || "" }) },
    { ikon: "peta", nilai: tapak.length ? num(tapak.length, 0) : "-", satuan: t("nkl.u.wilayah_k"), label: t("nkl.u.tapak") },
    { ikon: "labu", nilai: R.length ? num(R.length, 0) : "-", satuan: t("nkl.u.reaktor_k"), label: t("nkl.u.riset") },
  ];
  const sisi = khSisi(".jm-kh", { ubin });
  const lencana = [bukti("resmi", { sumber: "RUPTL PLN 2025-2034", tanggal: "2026-11-08" }), bukti("media", { sumber: "CNBC Indonesia, DEN", tanggal: "2026-03-03" }), bukti("media", { sumber: "topik nuklir METI", tanggal: B.tp?.diperbarui || "2026-11-08" }), bukti("media", { sumber: "BRIN, RRI", tanggal: "2026-09-18" })];
  sisi?.querySelectorAll(".jm-kh-ub").forEach((u, i) => u.insertAdjacentHTML("beforeend", `<div class="rg3-ub-bukti">${lencana[i] || ""}</div>`));
}
function tabAwal() { const k = urlGet("tab"); return TAB.some((x) => x.k === k) ? k : TAB[0].k; }
function bangunTab() {
  $("nklTab").innerHTML = `<div class="jm-tab jm-tab-rata" role="tablist" aria-label="${esc(t("nkl.tab"))}" data-i18n-attr="aria-label:nkl.tab">${TAB.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-tab="${d.k}" aria-selected="false" aria-controls="p-${d.k}" tabindex="-1" title="${esc(t("nkl.tab." + d.k))}">${ikon(d.ikon, 18)}<span data-i18n="nkl.tab.${d.k}">${esc(t("nkl.tab." + d.k))}</span></button>`).join("")}</div>`;
  $("isi").innerHTML = TAB.map((d) => `<section id="p-${d.k}" class="rg3-panel" role="tabpanel" aria-labelledby="tab-${d.k}" hidden></section>`).join("");
}
function buka(k, { ubahUrl = true } = {}) {
  const d = TAB.find((x) => x.k === k) || TAB[0];
  for (const b of $("nklTab").querySelectorAll("[role=tab]")) { const on = b.dataset.tab === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
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
  if (!B.nk) { $("isi").innerHTML = kosongTab("nkl.kosong"); return; }
  $("nklTab").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) buka(b.dataset.tab); });
  $("nklTab").addEventListener("keydown", (e) => {
    const i = TAB.findIndex((d) => d.k === document.activeElement?.dataset?.tab), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = $("nklTab").querySelectorAll("[role=tab]")[(i + s + TAB.length) % TAB.length]; b.focus(); b.click();
  });
  buka(tabAwal(), { ubahUrl: false });
}
mulai();
