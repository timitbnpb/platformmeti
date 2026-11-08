/* /cek-lokasi: induk dua tab. Cek titik (cek-lokasi.js) dan Kawasan hijau (lokasi_hijau.js, pencocok kawasan industri dan KEK); tiap modul dimuat malas saat tabnya dibuka.
   Alamat lama /lokasi-hijau dialihkan ke #kawasan-hijau. */
import { mulaiHalaman } from "/inti/kepala.js";
import { tabHalaman } from "/inti/tab_halaman.js";

await mulaiHalaman();
tabHalaman("tabHal", { label: "clh.tab", tab: [
  { k: "titik", ikon: "sasaran", teks: "clh.tab.titik", panel: "pnTitik", muat: () => import("/cek-lokasi.js") },
  { k: "kawasan-hijau", ikon: "denah", teks: "clh.tab.kawasan", panel: "pnKawasan", muat: () => import("/lokasi_hijau.js") },
] });
