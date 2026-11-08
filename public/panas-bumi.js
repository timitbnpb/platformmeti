/* /panas-bumi: panas bumi ujung ke ujung. Kerangka: kepala + ubin angka, sembilan tab (?tab=...), tiap tab dimuat malas (pbm_<nama>.js).
   Data baru: panas_bumi.json (rujukan id + butir bersumber); data lama dirujuk saat runtime (pbm_umum.js). INP: tab berganti seketika (aria-selected + panel), isi berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khSisi } from "/inti/kh.js";
import { hantuHtml, nanti, galatHtml } from "/inti/umum.js";
import { B, muat, t, esc, ikon, num, urlGet, kosongTab, bukti, proyekPB, jumlahMw } from "/pbm_umum.js";

const TAB = [
  { k: "sumber", ikon: "peta" }, { k: "eksplorasi", ikon: "sasaran" }, { k: "pembangkit", ikon: "petir" }, { k: "teknologi", ikon: "pabrik" }, { k: "ppa", ikon: "tag" },
  { k: "langsung", ikon: "desa" }, { k: "pemain", ikon: "gedung" }, { k: "kebijakan", ikon: "palu" }, { k: "isu", ikon: "peringatan" },
].map((d) => ({ ...d, mod: "/pbm_" + d.k + ".js" }));
const siap = new Set(), qsTab = {};
let kini = "";
const $ = (id) => document.getElementById(id);

function kepala() {
  const S = B.pb?.sumber_daya, p = S?.potensi_mw?.[0], terp = S?.terpasang_mw?.[0], P = proyekPB(), op = P.filter((x) => x.status === "beroperasi"), baru = P.filter((x) => ["konstruksi", "izin", "rencana"].includes(x.status));
  $("jawab").textContent = B.pb ? t("pbm.lead", { p: num(p.nilai, 0), t: num(terp.nilai, 0), pc: num((terp.nilai / p.nilai) * 100, 1) }) : t("pbm.lead_kosong");
  const ubin = [
    { ikon: "tek-panas", nilai: p ? num(p.nilai / 1000, 1) : "-", satuan: "GW", label: t("pbm.u.potensi") },
    { ikon: "petir", nilai: terp ? num(terp.nilai / 1000, 2) : "-", satuan: "GW", label: t("pbm.u.terpasang", { th: terp?.tahun || "" }) },
    { ikon: "tabel", nilai: P.length ? num(P.length, 0) : "-", satuan: t("pbm.u.proyek_k"), label: t("pbm.u.proyek", { mw: num(jumlahMw(P), 0) }) },
    { ikon: "kawasan", nilai: B.wkp ? num(B.wkp.baris.length, 0) : "-", satuan: "WKP", label: t("pbm.u.wkp_l") },
  ];
  const sisi = khSisi(".jm-kh", { ubin });
  const lencana = [bukti(p?.tingkat_bukti, { sumber: "Metro TV, Badan Geologi/ESDM", tanggal: "2025" }), bukti("resmi", { sumber: "IRENA", tanggal: "2026-11-08" }), bukti("resmi", { sumber: "RUPTL PLN 2025-2034, GEM", tanggal: "2026-11-07" }), bukti("media", { sumber: "wkp.json (kurasi METI)", tanggal: B.wkp?.meta?.diperbarui || "" })];
  sisi?.querySelectorAll(".jm-kh-ub").forEach((u, i) => u.insertAdjacentHTML("beforeend", `<div class="rg3-ub-bukti">${lencana[i] || ""}</div>`));
}
function tabAwal() { const k = urlGet("tab"); return TAB.some((x) => x.k === k) ? k : TAB[0].k; }
function bangunTab() {
  $("pbmTab").innerHTML = `<div class="jm-tab jm-tab-rata" role="tablist" aria-label="${esc(t("pbm.tab"))}" data-i18n-attr="aria-label:pbm.tab">${TAB.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-tab="${d.k}" aria-selected="false" aria-controls="p-${d.k}" tabindex="-1" title="${esc(t("pbm.tab." + d.k))}">${ikon(d.ikon, 18)}<span data-i18n="pbm.tab.${d.k}">${esc(t("pbm.tab." + d.k))}</span></button>`).join("")}</div>`;
  $("isi").innerHTML = TAB.map((d) => `<section id="p-${d.k}" class="rg3-panel" role="tabpanel" aria-labelledby="tab-${d.k}" hidden></section>`).join("");
}
function buka(k, { ubahUrl = true } = {}) {
  const d = TAB.find((x) => x.k === k) || TAB[0];
  for (const b of $("pbmTab").querySelectorAll("[role=tab]")) { const on = b.dataset.tab === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
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
  if (!B.pb) { $("isi").innerHTML = kosongTab("pbm.kosong"); return; }
  $("pbmTab").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) buka(b.dataset.tab); });
  $("pbmTab").addEventListener("keydown", (e) => {
    const i = TAB.findIndex((d) => d.k === document.activeElement?.dataset?.tab), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = $("pbmTab").querySelectorAll("[role=tab]")[(i + s + TAB.length) % TAB.length]; b.focus(); b.click();
  });
  buka(tabAwal(), { ubahUrl: false });
}
mulai();
