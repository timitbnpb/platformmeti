/* /jaringan: aplikasi peta layar penuh. Pil tab melayang: Kembaran, Bauran, Aliran (satu peta bersama, panel kiri) dan mode baca: Ontologi, Ringkasan, Sumber, Rencana dan kebijakan (sub-tab = sembilan tab lama).
   ?tab= tetap berlaku; nama tab lama (rencana, antar-pulau, ...) dipetakan ke Rencana dan kebijakan dengan sub-tab itu. Kontrak: KEMBARAN-JARINGAN.md §6b.
   INP: pil dan sub-tab berubah sinkron (aria-selected); modul dimuat malas lewat nanti(); peta tidak pernah dibangun ulang. */
import { mulaiHalaman } from "/inti/kepala.js";
import { khSisi } from "/inti/kh.js";
import { hantuHtml, nanti, galatHtml } from "/inti/umum.js";
import { D, muatSemua, berisi, t, esc, ikon, num, bukti, urlGet, kosongTab } from "/jr_umum.js";
import { nasional, ringkasAntarPulau, ringkasEkspor } from "/jaringan_hitung.js";
import { pasangPanel, ukuranUlang } from "/jr_app.js";

const TAB = [
  { k: "peta", ikon: "peta", mod: "/jr_peta.js", peta: 1 }, { k: "bauran", ikon: "karbon", mod: "/jr_bauran.js", peta: 1 }, { k: "aliran", ikon: "sambung", mod: "/jr_aliran.js", peta: 1 },
  { k: "ontologi", ikon: "sistem-listrik", mod: "/jr_ontologi.js" }, { k: "ringkasan", ikon: "ringkasan", mod: "/jr_ringkasan.js" }, { k: "sumber", ikon: "buku", mod: "/jr_sumber.js" },
  { k: "kebijakan", ikon: "kalender" },
];
const SUB = [
  { k: "rencana", ikon: "kalender", mod: "/jr_rencana.js" }, { k: "antar-pulau", ikon: "sambung", mod: "/jr_antarpulau.js" },
  { k: "lintas", ikon: "asean", mod: "/jr_lintas.js" }, { k: "simpan", ikon: "baterai", mod: "/jr_simpan.js" }, { k: "curtailment", ikon: "petir", mod: "/jr_curtailment.js" },
  { k: "keandalan", ikon: "jam", mod: "/jr_keandalan.js" }, { k: "dana", ikon: "kartu", mod: "/jr_dana.js" }, { k: "pemain", ikon: "gedung", mod: "/jr_pemain.js" },
];
const siap = new Set(), qsTab = {}, modul = {};
let kini = "", subKini = "";
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
  const sisi = khSisi("#p-kebijakan .jm-kh", { ubin });
  const lencana = [bukti(n ? "resmi" : "", { sumber: "RUPTL 2025-2034" }), bukti(n ? "resmi" : "", { sumber: "RUPTL 2025-2034" }), bukti(ap.n ? "resmi" : "", { sumber: "RUPTL 2025-2034" }), bukti(ek.n ? "media" : "", { sumber: "EMA Singapore, media" })];
  sisi?.querySelectorAll(".jm-kh-ub").forEach((u, i) => u.insertAdjacentHTML("beforeend", `<div class="rg3-ub-bukti">${lencana[i]}</div>`));
}

/** ?tab= -> {tab, sub}. Nama tab lama dipetakan ke Rencana dan kebijakan. */
function awal() {
  const k = urlGet("tab"), sub = urlGet("sub");
  if (SUB.some((x) => x.k === k)) return { tab: "kebijakan", sub: k };
  return { tab: TAB.some((x) => x.k === k) ? k : TAB[0].k, sub: SUB.some((x) => x.k === sub) ? sub : SUB[0].k };
}
function bangunPil() {
  $("jrTab").innerHTML = TAB.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-tab="${d.k}" aria-selected="false" aria-controls="p-${d.k}" tabindex="-1" title="${esc(t("jr.tab." + d.k))}">${ikon(d.ikon, 18)}<span data-i18n="jr.tab.${d.k}">${esc(t("jr.tab." + d.k))}</span></button>`).join("");
}
function bangunKebijakan(panel) {
  panel.innerHTML = `<section class="jm-kh" aria-labelledby="judul-kb"><div class="jm-kh-teks">
    <p class="jm-kh-ey"><svg class="jm-ik" width="16" height="16" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-menara"/></svg><span>${esc(t("jr.eyebrow"))}</span></p>
    <h2 id="judul-kb">${esc(t("jr.judul"))}</h2><p id="jawab" class="jm-kh-lead"></p></div></section>
    <div id="jrSub" class="rg3-tab"><div class="jm-tab jm-tab-rata" role="tablist" aria-label="${esc(t("jr.sub"))}">${SUB.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-sub="${d.k}" aria-selected="false" aria-controls="p-${d.k}" tabindex="-1" title="${esc(t("jr.tab." + d.k))}">${ikon(d.ikon, 18)}<span>${esc(t("jr.tab." + d.k))}</span></button>`).join("")}</div></div>
    <div class="rg3-isi">${SUB.map((d) => `<section id="p-${d.k}" class="rg3-panel" role="tabpanel" aria-labelledby="tab-${d.k}" hidden></section>`).join("")}</div>`;
  kepala();
  $("jrSub").addEventListener("click", (e) => { const b = e.target.closest("[data-sub]"); if (b) bukaSub(b.dataset.sub); });
  $("jrSub").addEventListener("keydown", (e) => {
    const i = SUB.findIndex((d) => d.k === document.activeElement?.dataset?.sub), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = $("jrSub").querySelectorAll("[role=tab]")[(i + s + SUB.length) % SUB.length]; b.focus(); b.click();
  });
}

/** Muat modul malas ke panelnya sekali; aktif(on) menyalakan lapis peta modul itu. */
function muat(d, panel, saatSiap) {
  if (siap.has(d.k)) return;
  siap.add(d.k);
  panel.innerHTML = hantuHtml(3);
  nanti(async () => {
    try { const m = await import(d.mod); modul[d.k] = m; panel.replaceChildren(); await m.mulai(panel); }
    catch (e) { console.error(e); panel.innerHTML = galatHtml("layanan"); siap.delete(d.k); }
    saatSiap?.();
  });
}
function ubahUrl(k, sub) {
  if (kini) { const q = new URLSearchParams(location.search); q.delete("tab"); q.delete("sub"); qsTab[kini] = q.toString(); }
  const q = qsTab[k] ? "&" + qsTab[k] : "";
  history.replaceState(null, "", location.pathname + "?tab=" + k + (k === "kebijakan" ? "&sub=" + sub : "") + q);
}
function selaraskanPeta() { for (const d of TAB) if (d.peta) modul[d.k]?.aktif?.(d.k === kini); }

function bukaSub(k, { url = true } = {}) {
  const d = SUB.find((x) => x.k === k) || SUB[0];
  for (const b of $("jrSub").querySelectorAll("[role=tab]")) { const on = b.dataset.sub === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
  for (const x of SUB) $("p-" + x.k).hidden = x.k !== d.k;
  subKini = d.k;
  if (url) { const q = new URLSearchParams(location.search); q.set("sub", d.k); history.replaceState(null, "", location.pathname + "?" + q); }
  muat(d, $("p-" + d.k), () => dispatchEvent(new Event("resize")));
}
function buka(k, { url = true, sub = "" } = {}) {
  const d = TAB.find((x) => x.k === k) || TAB[0];
  for (const b of $("jrTab").querySelectorAll("[role=tab]")) { const on = b.dataset.tab === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
  const app = $("jr-app"), mode = d.peta ? "peta" : "baca";
  app.dataset.mode = mode;
  $("jr-stage").hidden = mode !== "peta"; $("jr-baca").hidden = mode !== "baca";
  for (const x of TAB) $("p-" + x.k).hidden = x.k !== d.k;
  for (const x of TAB) { const b = $("bw-" + x.k); if (b) b.hidden = x.k !== d.k; }
  $("jr-pnl-j").textContent = t("jr.tab." + d.k);
  if (url) ubahUrl(d.k, sub || subKini || SUB[0].k);
  kini = d.k;
  selaraskanPeta();
  if (mode === "peta") ukuranUlang();
  const panel = $("p-" + d.k);
  if (d.k === "kebijakan") {
    if (!siap.has(d.k)) { siap.add(d.k); bangunKebijakan(panel); }
    bukaSub(sub || subKini || SUB[0].k, { url: false });
    return;
  }
  muat(d, panel, () => { selaraskanPeta(); dispatchEvent(new Event("resize")); });
}

async function mulai() {
  await mulaiHalaman();
  document.addEventListener("jm:bahasa", () => location.reload());
  bangunPil();
  pasangPanel();
  await muatSemua();
  if (!berisi("m", "antar_pulau")) { const b = $("jr-baca"); $("jr-stage").hidden = true; b.hidden = false; b.innerHTML = kosongTab("jr.kosong_semua"); return; }
  $("jrTab").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) buka(b.dataset.tab); });
  $("jrTab").addEventListener("keydown", (e) => {
    const i = TAB.findIndex((d) => d.k === document.activeElement?.dataset?.tab), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = $("jrTab").querySelectorAll("[role=tab]")[(i + s + TAB.length) % TAB.length]; b.focus(); b.click();
  });
  const a = awal();
  subKini = a.sub;
  buka(a.tab, { url: false, sub: a.sub });
}
mulai();
