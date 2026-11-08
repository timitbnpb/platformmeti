/* /angin: angin (PLTB darat dan lepas pantai) ujung ke ujung. Kerangka: kepala + ubin angka, sembilan tab (?tab=...), tiap tab dimuat malas (ang_<nama>.js).
   Data baru: angin.json (rujukan id + butir bersumber); data lama dirujuk saat runtime (ang_umum.js). INP: tab berganti seketika (aria-selected + panel), isi berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khSisi } from "/inti/kh.js";
import { hantuHtml, nanti, galatHtml } from "/inti/umum.js";
import { B, muat, t, esc, ikon, num, urlGet, kosongTab, bukti, buktiS, proyekBayu, jumlahMw } from "/ang_umum.js";

const TAB = [
  { k: "potensi", ikon: "peta" }, { k: "proyek", ikon: "proyek" }, { k: "rantai", ikon: "pabrik" }, { k: "biaya", ikon: "kalkulator" }, { k: "lelang", ikon: "lelang" },
  { k: "logistik", ikon: "kapal" }, { k: "kebijakan", ikon: "palu" }, { k: "isu", ikon: "peringatan" }, { k: "pemain", ikon: "gedung" },
  { k: "ringkasan", ikon: "analisis" }, { k: "dasar", ikon: "buku" },
].map((d) => ({ ...d, mod: d.k === "ringkasan" || d.k === "dasar" ? "/tek_" + d.k + ".js?k=" + ({ ringkasan: "bayu", dasar: "bayu" })[d.k] : "/ang_" + d.k + ".js" }));
const siap = new Set(), qsTab = {};
let kini = "";
const $ = (id) => document.getElementById(id);

function kepala() {
  const A = B.ang, P = proyekBayu(), op = P.filter((x) => x.status === "beroperasi"), pot = A ? A.potensi.darat_gw.nilai + A.potensi.lepas_gw.nilai : 0, terp = A?.potensi.terpasang_mw[0], rup = A?.potensi.target.find((x) => x.k === "ruptl");
  $("jawab").textContent = A ? t("ang.lead", { p: num(A.potensi.darat_gw.nilai, 1), l: num(A.potensi.lepas_gw.nilai, 1), t: num(terp.nilai, 0), r: num(rup.nilai_mw / 1000, 1) }) : t("ang.lead_kosong");
  const ubin = [
    { ikon: "angin", nilai: A ? num(pot, 0) : "-", satuan: "GW", label: t("ang.u.potensi") },
    { ikon: "petir", nilai: terp ? num(terp.nilai, 0) : "-", satuan: "MW", label: t("ang.u.terpasang", { th: terp?.tahun || "" }) },
    { ikon: "tabel", nilai: P.length ? num(P.length, 0) : "-", satuan: t("ang.u.proyek_k"), label: t("ang.u.proyek_l", { mw: num(jumlahMw(op), 0) }) },
    { ikon: "bendera", nilai: rup ? num(rup.nilai_mw / 1000, 1) : "-", satuan: "GW", label: t("ang.u.ruptl", { th: rup?.tahun || "" }) },
  ];
  const sisi = khSisi(".jm-kh", { ubin });
  const lencana = [bukti("resmi", { sumber: "RUEN, ETP", tanggal: "2026-11-08" }), A ? buktiS(terp.sumber_id, terp.tingkat_bukti) : bukti(""), bukti("via-pihak-ketiga", { sumber: "GEM, RUPTL, proyek.json", tanggal: "2026-11-08" }), A ? buktiS(rup.sumber_id, rup.tingkat_bukti) : bukti("")];
  sisi?.querySelectorAll(".jm-kh-ub").forEach((u, i) => u.insertAdjacentHTML("beforeend", `<div class="rg3-ub-bukti">${lencana[i] || ""}</div>`));
}
function tabAwal() { const k = urlGet("tab"); return TAB.some((x) => x.k === k) ? k : TAB[0].k; }
function bangunTab() {
  $("angTab").innerHTML = `<div class="jm-tab jm-tab-rata" role="tablist" aria-label="${esc(t("ang.tab"))}" data-i18n-attr="aria-label:ang.tab">${TAB.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-tab="${d.k}" aria-selected="false" aria-controls="p-${d.k}" tabindex="-1" title="${esc(t("ang.tab." + d.k))}">${ikon(d.ikon, 18)}<span data-i18n="ang.tab.${d.k}">${esc(t("ang.tab." + d.k))}</span></button>`).join("")}</div>`;
  $("isi").innerHTML = TAB.map((d) => `<section id="p-${d.k}" class="rg3-panel" role="tabpanel" aria-labelledby="tab-${d.k}" hidden></section>`).join("");
}
function buka(k, { ubahUrl = true } = {}) {
  const d = TAB.find((x) => x.k === k) || TAB[0];
  for (const b of $("angTab").querySelectorAll("[role=tab]")) { const on = b.dataset.tab === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
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
    try { const m = await import(d.mod); panel.innerHTML = ""; await m.mulai(panel); }
    catch (e) { console.error(e); panel.innerHTML = galatHtml("layanan"); siap.delete(d.k); }
    dispatchEvent(new Event("resize"));
  });
}
async function mulai() {
  await mulaiHalaman();
  document.addEventListener("jm:bahasa", () => location.reload());
  $("isi").innerHTML = hantuHtml(3);
  await muat(["ang", "pt"]);
  kepala();
  bangunTab();
  if (!B.ang) { $("isi").innerHTML = kosongTab("ang.kosong"); return; }
  $("angTab").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) buka(b.dataset.tab); });
  $("isi").addEventListener("click", (e) => { const b = e.target.closest("[data-pindah]"); if (b) { e.preventDefault(); buka(b.dataset.pindah); scrollTo({ top: 0 }); } });
  $("angTab").addEventListener("keydown", (e) => {
    const i = TAB.findIndex((d) => d.k === document.activeElement?.dataset?.tab), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = $("angTab").querySelectorAll("[role=tab]")[(i + s + TAB.length) % TAB.length]; b.focus(); b.click();
  });
  buka(tabAwal(), { ubahUrl: false });
}
mulai();
