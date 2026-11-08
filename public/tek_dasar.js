/* Tab "Dasar" di modul ujung ke ujung: laporan topik (dulu /topik?id=<id>) ditanam di panel. Dimuat modul lewat
   import("/tek_dasar.js?k=<id topik>"). Baterai dan kendaraan listrik berbagi modul: ?topik= memilih salah satunya.
   INP: dua tautan pilihan berpindah halaman penuh; sisanya kontrol bawaan laporan topik (topik_halaman.js). */
import { hantuHtml } from "/inti/umum.js";
import { tampilGalat } from "/analisis.js";
import { t } from "/i18n.js";
import { S, muat, pasangTabel, esc } from "/topik_umum.js";
import { halaman } from "/topik_halaman.js";

const K = new URL(import.meta.url).searchParams.get("k") || "";
const GANDA = { penyimpanan: ["penyimpanan", "kendaraan-listrik"] };

export async function mulai(el) {
  if (!document.querySelector('link[href="/topik.css"]')) document.head.insertAdjacentHTML("beforeend", '<link rel="stylesheet" href="/topik.css">');
  const pilihan = GANDA[K], pakai = pilihan?.includes(new URLSearchParams(location.search).get("topik")) ? new URLSearchParams(location.search).get("topik") : K;
  el.innerHTML = hantuHtml(6);
  S.ui = S.ui || (await muat("/data/topik/ui.json"));
  if (!S.ui) { el.innerHTML = ""; tampilGalat(el, () => location.reload()); return; }
  pasangTabel();
  const sakelar = pilihan ? `<p class="jm-tp-pilih-topik">${pilihan.map((id) => `<a class="jm-tbl" href="?tab=dasar${id === K ? "" : "&topik=" + id}"${id === pakai ? ' aria-current="page"' : ""}>${esc(t("tk.dasar." + id))}</a>`).join(" ")}</p>` : "";
  const isi = document.createElement("div");
  el.replaceChildren();
  el.insertAdjacentHTML("beforeend", sakelar);
  el.appendChild(isi);
  try { await halaman(pakai, isi); } catch (e) { console.error(e); isi.innerHTML = ""; tampilGalat(isi, () => location.reload()); }
}
