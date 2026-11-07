/* /kalender (Acara): tab Kalender (kalender.js), Daftar mendatang dan Arsip (event.js), dimuat malas saat tab pertama dibuka.
   Alamat lama /event dialihkan ke #daftar. #acara-<id> membuka tab Kalender. */
import { mulaiHalaman } from "/inti/kepala.js";
import { tabHalaman } from "/inti/tab_halaman.js";

const saya = await mulaiHalaman();
let kal;
const event = (mode) => () => import("/event.js").then((m) => m.tampil(mode));
tabHalaman("tabHal", {
  label: "kal.tab",
  tab: [
    { k: "kalender", ikon: "kalender", teks: "kal.tab.kalender", panel: "kal", muat: () => (kal ??= import("/kalender.js").then((m) => m.pasang(saya))), cocok: (h) => h === "#kalender" || h.startsWith("#acara-") || h === "" },
    { k: "daftar", ikon: "kalender-bintang", teks: "kal.tab.daftar", panel: "panelEvent", muat: event("depan") },
    { k: "arsip", ikon: "jejak", teks: "kal.tab.arsip", panel: "panelEvent", muat: event("lalu") },
  ],
});
