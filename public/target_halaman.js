/* /target: induk empat tab. Target-Realisasi (target.js), Transisi (transisi.js), Strategi (strategi.js), Rapor (rapor.js); tiap modul dimuat malas saat tabnya dibuka.
   Jangkar dalam tab (#target #sistem #karbon, #ringkasan ..., periode rapor #2026-10) tetap menunjuk tab pemiliknya lewat cocok(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { tabHalaman } from "/inti/tab_halaman.js";

await mulaiHalaman();
tabHalaman("tabHal", { label: "tgh.tab", tab: [
  { k: "realisasi", ikon: "bendera", teks: "tgh.tab.realisasi", panel: "pnRealisasi", muat: () => import("/target.js") },
  { k: "transisi", ikon: "analisis", teks: "tgh.tab.transisi", panel: "pnTransisi", cocok: (h) => /^#(transisi|target|sistem|karbon)$/.test(h), muat: () => import("/transisi.js") },
  { k: "strategi", ikon: "kompas", teks: "tgh.tab.strategi", panel: "pnStrategi", cocok: (h) => /^#(strategi|ringkasan|kesenjangan|peta|radar|konsentrasi|uang|sinyal|metode)$/.test(h), muat: () => import("/strategi.js") },
  { k: "rapor", ikon: "presentasi", teks: "tgh.tab.rapor", panel: "pnRapor", cocok: (h) => /^#(rapor|\d{4}(-\d{2})?)$/.test(h), muat: () => import("/rapor.js") },
] });
