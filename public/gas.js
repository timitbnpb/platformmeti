/* /gas: gas jembatan transisi ujung ke ujung. Kerangka: kepala + ubin angka, sembilan tab (?tab=...), tiap tab dimuat malas (gsj_<nama>.js).
   Data baru: gas.json (rujukan id + butir bersumber); data lama dirujuk saat runtime (gsj_umum.js). INP: tab berganti seketika (aria-selected + panel), isi berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khSisi } from "/inti/kh.js";
import { hantuHtml, nanti, galatHtml } from "/inti/umum.js";
import { B, muat, t, esc, ikon, num, urlGet, kosongTab, bukti, src } from "/gsj_umum.js";

const TAB = [
  { k: "pembangkit", ikon: "petir" }, { k: "lng", ikon: "kapal" }, { k: "pipa", ikon: "sambung" }, { k: "harga", ikon: "tag" }, { k: "neraca", ikon: "grafik" },
  { k: "transisi", ikon: "linimasa" }, { k: "pemain", ikon: "gedung" }, { k: "kebijakan", ikon: "palu" }, { k: "isu", ikon: "peringatan" },
].map((d) => ({ ...d, mod: "/gsj_" + d.k + ".js" }));
const siap = new Set(), qsTab = {};
let kini = "";
const $ = (id) => document.getElementById(id);
const sb = (id) => { const s = src(id); return { sumber: s?.penerbit || "", tanggal: s?.tanggal_periksa || "" }; };

function kepala() {
  const G = B.gs, A = G?.pembangkit.angka[0], fk = G?.pembangkit.fk_2024, N = G?.neraca.pemanfaatan, hg = G?.harga.hitung.skenario[0];
  $("jawab").textContent = G ? t("gsj.lead", { gw: num(A.nilai, 1), fk: num(fk.nilai, 0), uses: num(N.total, 0), harga: num(hg.harga, 0) }) : t("gsj.lead_kosong");
  const ubin = [
    { ikon: "petir", nilai: A ? num(A.nilai, 1) : "-", satuan: "GW", label: t("gsj.u.ruptl") },
    { ikon: "grafik", nilai: fk ? num(fk.nilai, 0) : "-", satuan: "%", label: t("gsj.u.fk") },
    { ikon: "gas", nilai: N ? num(N.total, 0) : "-", satuan: "BBTUD", label: t("gsj.u.guna") },
    { ikon: "tag", nilai: hg ? num(hg.harga, 0) : "-", satuan: "US$/MMBTU", label: t("gsj.u.hgbt") },
  ];
  const sisi = khSisi(".jm-kh", { ubin });
  const lencana = G ? [bukti(A.tingkat_bukti, sb(A.sumber_id)), bukti(fk.tingkat_bukti, sb(fk.sumber_id)), bukti(N.tingkat_bukti, sb(N.sumber_id)), bukti(hg.tingkat_bukti, sb(hg.sumber_id))] : [];
  sisi?.querySelectorAll(".jm-kh-ub").forEach((u, i) => u.insertAdjacentHTML("beforeend", `<div class="rg3-ub-bukti">${lencana[i] || ""}</div>`));
}
function tabAwal() { const k = urlGet("tab"); return TAB.some((x) => x.k === k) ? k : TAB[0].k; }
function bangunTab() {
  $("gsjTab").innerHTML = `<div class="jm-tab jm-tab-rata" role="tablist" aria-label="${esc(t("gsj.tab"))}" data-i18n-attr="aria-label:gsj.tab">${TAB.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-tab="${d.k}" aria-selected="false" aria-controls="p-${d.k}" tabindex="-1" title="${esc(t("gsj.tab." + d.k))}">${ikon(d.ikon, 18)}<span data-i18n="gsj.tab.${d.k}">${esc(t("gsj.tab." + d.k))}</span></button>`).join("")}</div>`;
  $("isi").innerHTML = TAB.map((d) => `<section id="p-${d.k}" class="rg3-panel" role="tabpanel" aria-labelledby="tab-${d.k}" hidden></section>`).join("");
}
function buka(k, { ubahUrl = true } = {}) {
  const d = TAB.find((x) => x.k === k) || TAB[0];
  for (const b of $("gsjTab").querySelectorAll("[role=tab]")) { const on = b.dataset.tab === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
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
  if (!B.gs) { $("isi").innerHTML = kosongTab("gsj.kosong"); return; }
  $("gsjTab").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) buka(b.dataset.tab); });
  $("gsjTab").addEventListener("keydown", (e) => {
    const i = TAB.findIndex((d) => d.k === document.activeElement?.dataset?.tab), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = $("gsjTab").querySelectorAll("[role=tab]")[(i + s + TAB.length) % TAB.length]; b.focus(); b.click();
  });
  buka(tabAwal(), { ubahUrl: false });
}
mulai();
