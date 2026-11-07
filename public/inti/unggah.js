/* Zona unggah seret-lepas bersama. Input berkas asli tetap ada (disembunyikan, bisa difokus) sehingga pemanggil
   cukup membaca input.files. Pendengar didelegasikan ke document, jadi markup yang dirender ulang tetap hidup.
   Peristiwa "unggah:ubah" (bubbles) dikirim ke .jm-unggah setiap berkas berubah: detail = File atau null. */
import { t, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";

const ukuran = (b) => (b >= 1048576 ? angka(b / 1048576, { desimal: 1 }) + " MB" : angka(Math.max(1, Math.round(b / 1024))) + " KB");
const cocok = (f, terima) => !terima || terima.split(",").some((a) => {
  a = a.trim().toLowerCase();
  return a.startsWith(".") ? f.name.toLowerCase().endsWith(a) : a.endsWith("/*") ? f.type.startsWith(a.slice(0, -1)) : f.type === a;
});

/** opsi: { id, terima, maks (byte), bantu (teks), ikon, aria } */
export function unggahHtml({ id, terima, maks, bantu = "", ikon: ik = "unduh" }) {
  return `<div class="jm-unggah" data-maks="${maks}" data-terima="${esc(terima)}">
    <input class="sr" type="file" id="${id}" accept="${esc(terima)}"${bantu ? ` aria-describedby="${id}Bantu"` : ""}>
    <label class="jm-unggah-zona" for="${id}">${ikon(ik, 28)}<b>${esc(t("unggah.seret"))}</b><span>${esc(t("unggah.atau"))}</span></label>
    ${bantu ? `<small class="jm-bantu" id="${id}Bantu">${esc(bantu)}</small>` : ""}
    <div class="jm-unggah-isi" aria-live="polite"></div></div>`;
}

function terapkan(kotak, f, pesan) {
  const inp = kotak.querySelector("input[type=file]"), isi = kotak.querySelector(".jm-unggah-isi");
  if (f) {
    if (!cocok(f, kotak.dataset.terima)) pesan = t("unggah.tipe");
    else if (f.size > Number(kotak.dataset.maks)) pesan = t("unggah.besar", { maks: ukuran(Number(kotak.dataset.maks)) });
    if (pesan) f = null;
  }
  if (!f) inp.value = "";
  kotak.classList.toggle("ada", !!f);
  isi.innerHTML = pesan ? `<p class="jm-unggah-galat" role="alert">${ikon("peringatan", 16)}<span>${esc(pesan)}</span></p>`
    : f ? `<div class="jm-unggah-berkas">${ikon(f.type === "application/pdf" ? "pdf" : "gambar", 22)}<span class="jm-unggah-nama"><b>${esc(f.name)}</b><small>${esc(ukuran(f.size))}</small></span><button type="button" class="jm-unggah-hapus" data-hapus aria-label="${esc(t("unggah.hapus"))}">${ikon("tutup", 18)}</button></div>` : "";
  kotak.dispatchEvent(new CustomEvent("unggah:ubah", { bubbles: true, detail: f }));
}

document.addEventListener("change", (e) => {
  const kotak = e.target.closest?.(".jm-unggah");
  if (kotak && e.target.type === "file") terapkan(kotak, e.target.files[0] || null);
});
document.addEventListener("click", (e) => {
  const b = e.target.closest?.("[data-hapus]"), kotak = b?.closest(".jm-unggah");
  if (kotak) { terapkan(kotak, null); kotak.querySelector("input").focus(); }
});
document.addEventListener("dragover", (e) => {
  const z = e.target.closest?.(".jm-unggah-zona");
  if (z) { e.preventDefault(); z.classList.add("seret"); }
});
document.addEventListener("dragleave", (e) => e.target.closest?.(".jm-unggah-zona")?.classList.remove("seret"));
document.addEventListener("drop", (e) => {
  const z = e.target.closest?.(".jm-unggah-zona");
  if (!z) return;
  e.preventDefault(); z.classList.remove("seret");
  const f = e.dataTransfer.files[0], kotak = z.closest(".jm-unggah");
  if (!f) return;
  const dt = new DataTransfer(); dt.items.add(f);
  kotak.querySelector("input").files = dt.files;
  terapkan(kotak, f);
});
