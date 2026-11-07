/* /galeri: tab Foto (galeri.js), Video (video.js), Podcast (podcast.js), dimuat malas saat tab pertama dibuka.
   Alamat lama /video dan /podcast dialihkan ke #video dan #podcast. #foto-<id> membuka lightbox di tab Foto. */
import { mulaiHalaman } from "/inti/kepala.js";
import { tabHalaman } from "/inti/tab_halaman.js";

await mulaiHalaman();
tabHalaman("tabHal", {
  label: "gal.tab",
  tab: [
    { k: "foto", ikon: "gambar", teks: "gal.tab.foto", panel: "panelFoto", muat: () => import("/galeri.js"), cocok: (h) => h.startsWith("#foto") },
    { k: "video", ikon: "video", teks: "gal.tab.video", panel: "panelVideo", muat: () => import("/video.js") },
    { k: "podcast", ikon: "mikrofon", teks: "gal.tab.podcast", panel: "panelPodcast", muat: () => import("/podcast.js") },
  ],
});
