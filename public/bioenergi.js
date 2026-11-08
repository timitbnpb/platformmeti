/* /bioenergi: bioenergi dan bahan bakar nabati ujung ke ujung. Kerangka: kepala + ubin angka, sepuluh tab ujung ke ujung (?tab=...), tiap tab dimuat malas (bio_<nama>.js).
   Data baru: bioenergi.json; data lama dirujuk saat runtime (bio_umum.js). INP: tab berganti seketika (aria-selected + panel), isi berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khSisi } from "/inti/kh.js";
import { hantuHtml, nanti, galatHtml } from "/inti/umum.js";
import { B, muat, t, esc, ikon, num, urlGet, kosongTab, bukti, juta } from "/bio_umum.js";

const TAB = [
  { k: "bahan", ikon: "desa" }, { k: "biodiesel", ikon: "pabrik" }, { k: "bioetanol", ikon: "air-energi" }, { k: "saf", ikon: "kapal" }, { k: "listrik", ikon: "petir" },
  { k: "biogas", ikon: "tek-listrik" }, { k: "pelet", ikon: "koper" }, { k: "dana", ikon: "kartu" }, { k: "neraca", ikon: "grafik" }, { k: "isu", ikon: "peringatan" },
  { k: "ringkasan", ikon: "analisis" }, { k: "dasar", ikon: "buku" },
].map((d) => ({ ...d, mod: d.k === "ringkasan" || d.k === "dasar" ? "/tek_" + d.k + ".js?k=" + ({ ringkasan: "bioenergi", dasar: "bioenergi" })[d.k] : "/bio_" + d.k + ".js" }));
const siap = new Set(), qsTab = {};
let kini = "";
const $ = (id) => document.getElementById(id);

function kepala() {
  const a = B.bio?.alokasi?.at(-1), luas = B.bio?.bahan_baku?.komoditas?.find((k) => k.k === "sawit-luas"), tr = B.bio?.dana?.tarif?.[0];
  const kl = B.lain?.butir?.find((b) => b.jenis === "kebijakan" && b.segmen === "biofuel" && b.uraian?.includes("15.646.372"));
  $("jawab").textContent = B.bio ? t("bn.lead", { m: "B50", a: juta(a?.alokasi_kl || 15646372, 2), h: luas ? juta(luas.luas_ha, 1) : "-", p: tr ? num(tr.cpo_persen) : "-" }) : t("bn.lead_kosong");
  const ubin = [
    { ikon: "petir", nilai: "B50", label: t("bn.u.mandat") },
    { ikon: "pabrik", nilai: a ? juta(a.alokasi_kl, 2) : "-", satuan: t("bn.u.juta_kl"), label: t("bn.u.alokasi", { th: a?.tahun || "" }) },
    { ikon: "desa", nilai: luas ? juta(luas.luas_ha, 1) : "-", satuan: t("bn.u.juta_ha"), label: t("bn.u.sawit") },
    { ikon: "tag", nilai: tr ? num(tr.cpo_persen) : "-", satuan: tr ? "%" : "", label: t("bn.u.pungutan") },
  ];
  const sisi = khSisi(".jm-kh", { ubin });
  const lencana = [bukti("cuplikan", { sumber: "Kementerian ESDM, media" }), bukti(kl ? kl.tingkat_bukti : "cuplikan", { sumber: "Kementerian ESDM" }), bukti("cuplikan", { sumber: "BPS via Jawa Pos", tanggal: "2025" }), bukti("cuplikan", { sumber: "PMK 30/2025 via Kontan", tanggal: "2025-05" })];
  sisi?.querySelectorAll(".jm-kh-ub").forEach((u, i) => u.insertAdjacentHTML("beforeend", `<div class="rg3-ub-bukti">${lencana[i] || ""}</div>`));
}
function tabAwal() { const k = urlGet("tab"); return TAB.some((x) => x.k === k) ? k : TAB[0].k; }
function bangunTab() {
  $("bnTab").innerHTML = `<div class="jm-tab jm-tab-rata" role="tablist" aria-label="${esc(t("bn.tab"))}" data-i18n-attr="aria-label:bn.tab">${TAB.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-tab="${d.k}" aria-selected="false" aria-controls="p-${d.k}" tabindex="-1" title="${esc(t("bn.tab." + d.k))}">${ikon(d.ikon, 18)}<span data-i18n="bn.tab.${d.k}">${esc(t("bn.tab." + d.k))}</span></button>`).join("")}</div>`;
  $("isi").innerHTML = TAB.map((d) => `<section id="p-${d.k}" class="rg3-panel" role="tabpanel" aria-labelledby="tab-${d.k}" hidden></section>`).join("");
}
function buka(k, { ubahUrl = true } = {}) {
  const d = TAB.find((x) => x.k === k) || TAB[0];
  for (const b of $("bnTab").querySelectorAll("[role=tab]")) { const on = b.dataset.tab === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
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
  if (!B.bio) { $("isi").innerHTML = kosongTab("bn.kosong"); return; }
  $("bnTab").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) buka(b.dataset.tab); });
  $("bnTab").addEventListener("keydown", (e) => {
    const i = TAB.findIndex((d) => d.k === document.activeElement?.dataset?.tab), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = $("bnTab").querySelectorAll("[role=tab]")[(i + s + TAB.length) % TAB.length]; b.focus(); b.click();
  });
  buka(tabAwal(), { ubahUrl: false });
}
mulai();
