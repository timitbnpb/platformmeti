/* Tab Biaya di /investasi (dimuat malas oleh investasi_halaman.js): dua subtab, Biaya listrik (biaya_listrik.js) dan Harga komponen (harga_komponen.js).
   Alamat lama /biaya-listrik dialihkan ke #biaya dan /harga-komponen ke #harga-komponen. */
import { tabHalaman } from "/inti/tab_halaman.js";

tabHalaman("tabBiaya", {
  label: "ivh.sub.biaya",
  tab: [
    { k: "biaya-listrik", hash: "biaya", ikon: "kalkulator", teks: "ivh.sub.listrik", panel: "panelBiayaListrik", cocok: (h) => h !== "#harga-komponen", muat: () => import("/biaya_listrik.js") },
    { k: "harga-komponen", ikon: "tag", teks: "ivh.sub.komponen", panel: "panelHargaKomponen", muat: () => import("/harga_komponen.js") },
  ],
});
