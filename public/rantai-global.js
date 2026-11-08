/* /rantai-global: pusat rantai pasok global EBT. Kerangka: kepala + ubin angka, delapan tab ujung ke ujung (?tab=...), tiap tab dimuat malas.
   Semua berkas data dibaca saat runtime dan tahan kosong (rg3_umum.js). Tiap tab ada di rg3_<nama>.js. INP: tab berganti seketika (aria-selected + panel), isi berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khSisi } from "/inti/kh.js";
import { hantuHtml, nanti, galatHtml } from "/inti/umum.js";
import { D, muatSemua, berisi, t, esc, ikon, num, bukti, urlGet, kosongTab } from "/rg3_umum.js";

const TAB = [
  { k: "pemasok", ikon: "gedung", mod: "/rg3_pemasok.js" }, { k: "produk", ikon: "daftar2", mod: "/rg3_produk.js" }, { k: "harga", ikon: "tag", mod: "/rg3_harga.js" },
  { k: "logistik", ikon: "kapal", mod: "/rg3_logistik.js" }, { k: "kebijakan", ikon: "palu", mod: "/rg3_kebijakan.js" }, { k: "pabrik", ikon: "pabrik", mod: "/rg3_pabrik.js" },
  { k: "risiko", ikon: "peringatan", mod: "/rg3_risiko.js" }, { k: "wte", ikon: "tek-bio", mod: "/rg3_wte.js" },
];
const siap = new Set(), qsTab = {};
let kini = "";
const $ = (id) => document.getElementById(id);

function kepala() {
  const semua = [...(D.surya?.baris || []), ...(D.lain?.baris || []), ...(D.wte?.baris || [])];
  const negara = new Set(semua.map((b) => String(b.negara_iso2 || b.negara || "").toLowerCase()).filter(Boolean));
  const cn = (D.logistik?.risiko?.konsentrasi || []).find((k) => k.komponen === "surya");
  $("jawab").textContent = semua.length ? t("rg3.lead", { n: num(semua.length), m: num(negara.size), p: num((D.produk?.baris || []).length) }) : t("rg3.lead_kosong");
  const ubin = [
    { ikon: "gedung", nilai: semua.length ? num(semua.length) : "-", label: t("rg3.u.pemasok") },
    { ikon: "globe", nilai: negara.size ? num(negara.size) : "-", label: t("rg3.u.negara") },
    { ikon: "daftar2", nilai: berisi("produk") ? num(D.produk.baris.length) : "-", label: t("rg3.u.produk") },
    { ikon: "peringatan", nilai: cn ? num(cn.china_pangsa_persen, 1) : "-", satuan: cn ? "%" : "", label: t("rg3.u.cn") },
  ];
  const sisi = khSisi(".jm-kh", { ubin });
  const lencana = [
    bukti(semua.length ? "via-pihak-ketiga" : "", { sumber: "Wikidata, Wikipedia, situs resmi pemasok" }),
    bukti(negara.size ? "via-pihak-ketiga" : "", { sumber: "Wikidata, situs resmi pemasok" }),
    bukti(berisi("produk") ? "resmi" : "", { sumber: "Lembar data (datasheet) pabrikan" }),
    bukti(cn ? cn.tingkat_bukti : "", { sumber: "UN Comtrade", tanggal: cn?.tanggal, cara: cn?.rumus }),
  ];
  sisi?.querySelectorAll(".jm-kh-ub").forEach((u, i) => u.insertAdjacentHTML("beforeend", `<div class="rg3-ub-bukti">${lencana[i]}</div>`));
}

function tabAwal() { const k = urlGet("tab"); return TAB.some((x) => x.k === k) ? k : TAB[0].k; }
function bangunTab() {
  const el = $("rg3Tab");
  el.innerHTML = `<div class="jm-tab jm-tab-rata" role="tablist" aria-label="${esc(t("rg3.tab"))}" data-i18n-attr="aria-label:rg3.tab">${TAB.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-tab="${d.k}" aria-selected="false" aria-controls="p-${d.k}" tabindex="-1" title="${esc(t("rg3.tab." + d.k))}">${ikon(d.ikon, 18)}<span data-i18n="rg3.tab.${d.k}">${esc(t("rg3.tab." + d.k))}</span></button>`).join("")}</div>`;
  $("isi").innerHTML = TAB.map((d) => `<section id="p-${d.k}" class="rg3-panel" role="tabpanel" aria-labelledby="tab-${d.k}" hidden></section>`).join("");
}
function buka(k, { ubahUrl = true } = {}) {
  const d = TAB.find((x) => x.k === k) || TAB[0];
  for (const b of $("rg3Tab").querySelectorAll("[role=tab]")) { const on = b.dataset.tab === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
  for (const x of TAB) $("p-" + x.k).hidden = x.k !== d.k;
  if (ubahUrl) {
    /* URL berbagi: parameter tab lama disimpan, parameter tab tujuan dipulihkan (tab yang sudah terbuka tetap membawa saringannya) */
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
  $("jawab").insertAdjacentHTML("afterend", `<p class="jm-bantu"><a href="/bioenergi?tab=pelet">${esc(t("rg3.lihat_bio"))}</a> <a href="/surya">${esc(t("sur.dari_rantai"))}</a></p>`);
  $("jawab").insertAdjacentHTML("afterend", `<p class="jm-bantu"><a href="/hidrogen">${esc(t("rg3.lihat_h2"))}</a></p>`);
  bangunTab();
  const semuaKosong = TAB.length && Object.entries(D).every(([k, v]) => k === "orgAda" || v == null);
  if (semuaKosong) { $("isi").innerHTML = kosongTab("rg3.kosong_semua"); return; }
  $("rg3Tab").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) buka(b.dataset.tab); });
  $("rg3Tab").addEventListener("keydown", (e) => {
    const i = TAB.findIndex((d) => d.k === document.activeElement?.dataset?.tab), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = $("rg3Tab").querySelectorAll("[role=tab]")[(i + s + TAB.length) % TAB.length]; b.focus(); b.click();
  });
  buka(tabAwal(), { ubahUrl: false });
}
mulai();
