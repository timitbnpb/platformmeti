/* /jaringan: Jaringan dan interkoneksi. Kerangka: kepala + ubin angka, sembilan tab ujung ke ujung (?tab=...), tiap tab dimuat malas dari jr_<nama>.js.
   Data: jaringan_modul.json (rencana RUPTL, interkoneksi, lintas negara) + berkas yang sudah ada dirujuk lewat id (lihat jr_umum.js).
   INP: tab berganti seketika (aria-selected + panel), isi berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khSisi } from "/inti/kh.js";
import { hantuHtml, nanti, galatHtml } from "/inti/umum.js";
import { D, muatSemua, berisi, t, esc, ikon, num, bukti, urlGet, kosongTab } from "/jr_umum.js";
import { nasional, ringkasAntarPulau, ringkasEkspor } from "/jaringan_hitung.js";

const TAB = [
  { k: "peta", ikon: "peta", mod: "/jr_peta.js" }, { k: "rencana", ikon: "kalender", mod: "/jr_rencana.js" }, { k: "antar-pulau", ikon: "sambung", mod: "/jr_antarpulau.js" },
  { k: "lintas", ikon: "asean", mod: "/jr_lintas.js" }, { k: "simpan", ikon: "baterai", mod: "/jr_simpan.js" }, { k: "curtailment", ikon: "petir", mod: "/jr_curtailment.js" },
  { k: "keandalan", ikon: "jam", mod: "/jr_keandalan.js" }, { k: "dana", ikon: "kartu", mod: "/jr_dana.js" }, { k: "pemain", ikon: "gedung", mod: "/jr_pemain.js" },
];
const siap = new Set(), qsTab = {};
let kini = "";
const $ = (id) => document.getElementById(id);

function kepala() {
  const n = nasional(D.m), ap = ringkasAntarPulau(D.m), ek = ringkasEkspor(D.m);
  $("jawab").textContent = n ? t("jr.lead", { kms: num(n.kms.total.jumlah), mva: num(n.mva.total.jumlah), p: num(ap.n) }) : t("jr.lead_kosong");
  const ubin = [
    { ikon: "menara", nilai: n ? num(n.kms.total.jumlah) : "-", satuan: n ? "kms" : "", label: t("jr.u.kms") },
    { ikon: "petir", nilai: n ? num(n.mva.total.jumlah) : "-", satuan: n ? "MVA" : "", label: t("jr.u.mva") },
    { ikon: "sambung", nilai: ap.n ? num(ap.n) : "-", label: t("jr.u.antarpulau") },
    { ikon: "globe", nilai: ek.n ? num(ek.total, 1) : "-", satuan: ek.n ? "GW" : "", label: t("jr.u.ekspor") },
  ];
  const sisi = khSisi(".jm-kh", { ubin });
  const lencana = [bukti(n ? "resmi" : "", { sumber: "RUPTL 2025-2034" }), bukti(n ? "resmi" : "", { sumber: "RUPTL 2025-2034" }), bukti(ap.n ? "resmi" : "", { sumber: "RUPTL 2025-2034" }), bukti(ek.n ? "media" : "", { sumber: "EMA Singapore, media" })];
  sisi?.querySelectorAll(".jm-kh-ub").forEach((u, i) => u.insertAdjacentHTML("beforeend", `<div class="rg3-ub-bukti">${lencana[i]}</div>`));
}

function tabAwal() { const k = urlGet("tab"); return TAB.some((x) => x.k === k) ? k : TAB[0].k; }
function bangunTab() {
  $("jrTab").innerHTML = `<div class="jm-tab jm-tab-rata" role="tablist" aria-label="${esc(t("jr.tab"))}" data-i18n-attr="aria-label:jr.tab">${TAB.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-tab="${d.k}" aria-selected="false" aria-controls="p-${d.k}" tabindex="-1" title="${esc(t("jr.tab." + d.k))}">${ikon(d.ikon, 18)}<span data-i18n="jr.tab.${d.k}">${esc(t("jr.tab." + d.k))}</span></button>`).join("")}</div>`;
  $("isi").innerHTML = TAB.map((d) => `<section id="p-${d.k}" class="rg3-panel" role="tabpanel" aria-labelledby="tab-${d.k}" hidden></section>`).join("");
}
function buka(k, { ubahUrl = true } = {}) {
  const d = TAB.find((x) => x.k === k) || TAB[0];
  for (const b of $("jrTab").querySelectorAll("[role=tab]")) { const on = b.dataset.tab === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
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
    dispatchEvent(new Event("resize")); // peta yang dibuat saat panel tersembunyi menyesuaikan ukuran
  });
}

async function mulai() {
  await mulaiHalaman();
  document.addEventListener("jm:bahasa", () => location.reload());
  $("isi").innerHTML = hantuHtml(3);
  await muatSemua();
  kepala();
  bangunTab();
  if (!berisi("m", "antar_pulau")) { $("isi").innerHTML = kosongTab("jr.kosong_semua"); return; }
  $("jrTab").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) buka(b.dataset.tab); });
  $("jrTab").addEventListener("keydown", (e) => {
    const i = TAB.findIndex((d) => d.k === document.activeElement?.dataset?.tab), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = $("jrTab").querySelectorAll("[role=tab]")[(i + s + TAB.length) % TAB.length]; b.focus(); b.click();
  });
  buka(tabAwal(), { ubahUrl: false });
}
mulai();
