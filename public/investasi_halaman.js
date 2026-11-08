/* /investasi: induk lima tab. Proyek (investasi.js), Model keuangan (model_keuangan.js), Peluang per provinsi (peluang_halaman.js, tiga subtab),
   Pembiayaan hijau (keuangan_hijau.js), dan Biaya (biaya_halaman.js, dua subtab); tiap modul dimuat malas saat tabnya dibuka.
   Hash proyek (#<id proyek>) tetap membuka lembar proyek di tab Proyek; hash lama (#hitung, #plts-atap, #harga-komponen, #obligasi) menunjuk tab pemiliknya lewat cocok(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { tabHalaman } from "/inti/tab_halaman.js";

await mulaiHalaman();
tabHalaman("tabInv", { label: "ivh.tab", tab: [
  { k: "proyek", ikon: "proyek", teks: "ivh.tab.proyek", panel: "pnProyek", cocok: (h) => !/^#(model|peluang|hitung|plts-atap|pembiayaan|obligasi|jetp|insentif|taksonomi|biaya|harga-komponen)$/.test(h), muat: () => import("/investasi.js") },
  { k: "model", ikon: "kalkulator", teks: "ivh.tab.model", panel: "pnModel", muat: () => import("/model_keuangan.js") },
  { k: "peluang", ikon: "analisis", teks: "ivh.tab.peluang", panel: "pnPeluang", cocok: (h) => /^#(peluang|hitung|plts-atap)$/.test(h), muat: () => import("/peluang_halaman.js") },
  { k: "pembiayaan", ikon: "kartu", teks: "ivh.tab.pembiayaan", panel: "pnPembiayaan", cocok: (h) => /^#(pembiayaan|obligasi|jetp|insentif|taksonomi)$/.test(h), muat: () => import("/keuangan_hijau.js") },
  { k: "biaya", ikon: "tag", teks: "ivh.tab.biaya", panel: "pnBiaya", cocok: (h) => /^#(biaya|harga-komponen)$/.test(h), muat: () => import("/biaya_halaman.js") },
] });
