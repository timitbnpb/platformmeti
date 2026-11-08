/* Tab Peluang per provinsi di /investasi (dimuat malas oleh investasi_halaman.js): tiga subtab, Peta peluang (peluang.js), Hitung kelayakan (kelayakan.js), dan PLTS atap (plts_atap.js).
   Tombol Hitung di panel provinsi (event jm:hitung dari peluang.js) membuka subtab Hitung untuk provinsi itu. Alamat lama /kelayakan dan /peluang dialihkan ke #hitung dan #peluang. */
import { tabHalaman } from "/inti/tab_halaman.js";

const tab = tabHalaman("tabHal", {
  label: "pel.tab",
  tab: [
    { k: "peta", hash: "peluang", ikon: "peta", teks: "pel.tab.peta", panel: "panelPeta", cocok: (h) => !/^#(hitung|plts-atap)$/.test(h), muat: () => import("/peluang.js") },
    { k: "hitung", ikon: "kalkulator", teks: "pel.tab.hitung", panel: "panelHitung", muat: () => import("/kelayakan.js") },
    { k: "plts-atap", ikon: "tek-surya", teks: "pel.tab.plts", panel: "panelPlts", muat: () => import("/plts_atap.js") },
  ],
});
document.addEventListener("jm:hitung", (e) => {
  history.replaceState(null, "", `${location.pathname}?prov=${encodeURIComponent(e.detail.kode)}&tek=${encodeURIComponent(e.detail.tek)}#hitung`);
  tab.buka("hitung");
});
