/* /peluang: dua tab, Peta peluang (peluang.js) dan Hitung kelayakan (kelayakan.js), dimuat malas saat tab pertama dibuka.
   Tombol Hitung di panel provinsi (event jm:hitung dari peluang.js) membuka tab Hitung untuk provinsi itu. Alamat lama /kelayakan dialihkan ke #hitung. */
import { mulaiHalaman } from "/inti/kepala.js";
import { tabHalaman } from "/inti/tab_halaman.js";

await mulaiHalaman();
const tab = tabHalaman("tabHal", {
  label: "pel.tab",
  tab: [
    { k: "peta", ikon: "peta", teks: "pel.tab.peta", panel: "panelPeta", muat: () => import("/peluang.js") },
    { k: "hitung", ikon: "kalkulator", teks: "pel.tab.hitung", panel: "panelHitung", muat: () => import("/kelayakan.js") },
  ],
});
document.addEventListener("jm:hitung", (e) => {
  history.replaceState(null, "", `${location.pathname}?prov=${encodeURIComponent(e.detail.kode)}&tek=${encodeURIComponent(e.detail.tek)}#hitung`);
  tab.buka("hitung");
});
