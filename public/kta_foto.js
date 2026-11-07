/* Potong foto persegi di klien: geser dan perbesar di dalam bingkai, hasil 600 x 600 (webp, cadangan jpeg). Tanpa metadata EXIF karena digambar ulang di kanvas. */
import { t } from "/i18n.js";
import { esc } from "/inti/umum.js";

const S = 640, KELUAR = 600;

/** Mengembalikan { blob } bila disimpan, null bila dibatalkan, { galat: true } bila berkas tak terbaca. */
export async function potongFoto(dlg, berkas) {
  let img;
  try { img = await createImageBitmap(berkas, { imageOrientation: "from-image" }); } catch (e) { return { galat: true }; }
  const sisiDasar = Math.min(img.width, img.height);
  let z = 1, cx = img.width / 2, cy = img.height / 2;
  dlg.innerHTML = `<h2 id="dlgJudul">${esc(t("kta.foto.judul"))}</h2>
    <canvas class="kta-potong" id="potong" width="${S}" height="${S}" aria-label="${esc(t("kta.foto.geser"))}"></canvas>
    <p class="jm-bantu">${esc(t("kta.foto.geser"))}</p>
    <div class="kta-zoom"><label for="zoom">${esc(t("kta.foto.zoom"))}</label><input type="range" id="zoom" min="1" max="3" step="0.01" value="1"></div>
    <div class="jm-aksi-baris"><button type="button" class="jm-tbl" data-p="batal">${esc(t("jm.batal"))}</button><button type="button" class="jm-tbl jm-tbl-utama" data-p="simpan">${esc(t("kta.foto.simpan"))}</button></div>`;
  const kanvas = dlg.querySelector("#potong"), c = kanvas.getContext("2d");
  const jepit = () => {
    const sisi = sisiDasar / z;
    cx = Math.min(Math.max(cx, sisi / 2), img.width - sisi / 2);
    cy = Math.min(Math.max(cy, sisi / 2), img.height - sisi / 2);
    return sisi;
  };
  const gambar = () => { const sisi = jepit(); c.clearRect(0, 0, S, S); c.drawImage(img, cx - sisi / 2, cy - sisi / 2, sisi, sisi, 0, 0, S, S); };
  gambar();
  let tarik = null;
  kanvas.addEventListener("pointerdown", (e) => { tarik = { x: e.clientX, y: e.clientY }; kanvas.setPointerCapture(e.pointerId); });
  kanvas.addEventListener("pointermove", (e) => {
    if (!tarik) return;
    const skala = sisiDasar / z / kanvas.getBoundingClientRect().width;
    cx -= (e.clientX - tarik.x) * skala; cy -= (e.clientY - tarik.y) * skala;
    tarik = { x: e.clientX, y: e.clientY };
    gambar();
  });
  const lepas = () => { tarik = null; };
  kanvas.addEventListener("pointerup", lepas); kanvas.addEventListener("pointercancel", lepas);
  dlg.querySelector("#zoom").addEventListener("input", (e) => { z = Number(e.target.value); gambar(); });
  return new Promise((selesai) => {
    let hasil = null;
    const klik = async (e) => {
      const b = e.target.closest("[data-p]");
      if (!b) return;
      if (b.dataset.p === "simpan") {
        const sisi = jepit(), o = document.createElement("canvas");
        o.width = o.height = KELUAR;
        o.getContext("2d").drawImage(img, cx - sisi / 2, cy - sisi / 2, sisi, sisi, 0, 0, KELUAR, KELUAR);
        let blob = await new Promise((ok) => o.toBlob(ok, "image/webp", 0.85));
        if (!blob || blob.type !== "image/webp") blob = await new Promise((ok) => o.toBlob(ok, "image/jpeg", 0.88));
        hasil = blob ? { blob } : { galat: true };
      }
      dlg.close();
    };
    dlg.addEventListener("click", klik);
    dlg.addEventListener("close", () => { dlg.removeEventListener("click", klik); img.close?.(); selesai(hasil); }, { once: true });
    dlg.showModal();
  });
}
