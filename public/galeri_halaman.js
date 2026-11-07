/* /galeri: tab Foto (galeri.js), Video (video.js), Media sosial (sosmed_tab.js), dimuat malas saat tab pertama dibuka.
   Alamat lama /video dan /podcast dialihkan ke #video dan #sosmed. #foto-<id> membuka lightbox di tab Foto. */
import { mulaiHalaman } from "/inti/kepala.js";
import { tabHalaman } from "/inti/tab_halaman.js";

await mulaiHalaman();
tabHalaman("tabHal", {
  label: "gal.tab",
  tab: [
    { k: "foto", ikon: "gambar", teks: "gal.tab.foto", panel: "panelFoto", muat: () => import("/galeri.js"), cocok: (h) => h.startsWith("#foto") },
    { k: "video", ikon: "video", teks: "gal.tab.video", panel: "panelVideo", muat: () => import("/video.js") },
    { k: "sosmed", ikon: "tautan", teks: "gal.tab.sosmed", panel: "panelSosmed", muat: () => import("/sosmed_tab.js") },
  ],
});
