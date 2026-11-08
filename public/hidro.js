/* /hidro: hidro ujung ke ujung. Kerangka: kepala + ubin angka, sembilan tab (?tab=...), tiap tab dimuat malas (hdr_<nama>.js).
   Data baru: hidro.json (rujukan id + butir bersumber); data lama dirujuk saat runtime (hdr_umum.js). INP: tab berganti seketika (aria-selected + panel), isi berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khSisi } from "/inti/kh.js";
import { hantuHtml, nanti, galatHtml } from "/inti/umum.js";
import { B, muat, t, esc, ikon, num, urlGet, kosongTab, bukti, proyekHidro, jumlahMw } from "/hdr_umum.js";

const TAB = [
  { k: "potensi", ikon: "peta" }, { k: "pembangkit", ikon: "petir" }, { k: "pumped", ikon: "baterai" }, { k: "bendungan", ikon: "air-energi" }, { k: "ruptl", ikon: "palu" },
  { k: "biaya", ikon: "kalkulator" }, { k: "pemasok", ikon: "pabrik" }, { k: "pendanaan", ikon: "kartu" }, { k: "isu", ikon: "peringatan" },
  { k: "ringkasan", ikon: "analisis" }, { k: "dasar", ikon: "buku" },
].map((d) => ({ ...d, mod: d.k === "ringkasan" || d.k === "dasar" ? "/tek_" + d.k + ".js?k=" + ({ ringkasan: "hidro", dasar: "hidro" })[d.k] : "/hdr_" + d.k + ".js" }));
const siap = new Set(), qsTab = {};
let kini = "";
const $ = (id) => document.getElementById(id);

function kepala() {
  const S = B.hd?.sumber_daya, p = S?.potensi_mw?.[0], terp = S?.terpasang_mw?.[0], P = proyekHidro(), nPs = B.hd?.rujukan?.ps_ids?.length || 0;
  $("jawab").textContent = B.hd ? t("hdr.lead", { p: num(p.nilai / 1000, 0), t: num(terp.nilai / 1000, 1), pc: num((terp.nilai / p.nilai) * 100, 1) }) : t("hdr.lead_kosong");
  const ubin = [
    { ikon: "air-energi", nilai: p ? num(p.nilai / 1000, 0) : "-", satuan: "GW", label: t("hdr.u.potensi") },
    { ikon: "petir", nilai: terp ? num(terp.nilai / 1000, 2) : "-", satuan: "GW", label: t("hdr.u.terpasang", { th: terp?.tahun || "" }) },
    { ikon: "tabel", nilai: P.length ? num(P.length, 0) : "-", satuan: t("hdr.u.proyek_k"), label: t("hdr.u.proyek", { mw: num(jumlahMw(P), 0) }) },
    { ikon: "baterai", nilai: nPs ? num(nPs, 0) : "-", satuan: t("hdr.u.ps_k"), label: t("hdr.u.ps") },
  ];
  const sisi = khSisi(".jm-kh", { ubin });
  const lencana = [bukti(p?.tingkat_bukti, { sumber: "Kementerian ESDM", tanggal: "2023" }), bukti("resmi", { sumber: "IRENA", tanggal: "2026-11-08" }), bukti("resmi", { sumber: "RUPTL PLN 2025-2034, GEM", tanggal: "2026-11-07" }), bukti("resmi", { sumber: "RUPTL PLN 2025-2034", tanggal: "2026-11-08" })];
  sisi?.querySelectorAll(".jm-kh-ub").forEach((u, i) => u.insertAdjacentHTML("beforeend", `<div class="rg3-ub-bukti">${lencana[i] || ""}</div>`));
}
function tabAwal() { const k = urlGet("tab"); return TAB.some((x) => x.k === k) ? k : TAB[0].k; }
function bangunTab() {
  $("hdrTab").innerHTML = `<div class="jm-tab jm-tab-rata" role="tablist" aria-label="${esc(t("hdr.tab"))}" data-i18n-attr="aria-label:hdr.tab">${TAB.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-tab="${d.k}" aria-selected="false" aria-controls="p-${d.k}" tabindex="-1" title="${esc(t("hdr.tab." + d.k))}">${ikon(d.ikon, 18)}<span data-i18n="hdr.tab.${d.k}">${esc(t("hdr.tab." + d.k))}</span></button>`).join("")}</div>`;
  $("isi").innerHTML = TAB.map((d) => `<section id="p-${d.k}" class="rg3-panel" role="tabpanel" aria-labelledby="tab-${d.k}" hidden></section>`).join("");
}
function buka(k, { ubahUrl = true } = {}) {
  const d = TAB.find((x) => x.k === k) || TAB[0];
  for (const b of $("hdrTab").querySelectorAll("[role=tab]")) { const on = b.dataset.tab === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
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
  if (!B.hd) { $("isi").innerHTML = kosongTab("hdr.kosong"); return; }
  $("hdrTab").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) buka(b.dataset.tab); });
  $("hdrTab").addEventListener("keydown", (e) => {
    const i = TAB.findIndex((d) => d.k === document.activeElement?.dataset?.tab), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = $("hdrTab").querySelectorAll("[role=tab]")[(i + s + TAB.length) % TAB.length]; b.focus(); b.click();
  });
  buka(tabAwal(), { ubahUrl: false });
}
mulai();
