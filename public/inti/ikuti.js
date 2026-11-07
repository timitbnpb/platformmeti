/* Tombol "Ikuti" bersama untuk halaman profil (proyek, organisasi, provinsi, regulasi, tender). Satu modul, satu daftar (/api/ikuti) per halaman.
   Tombol tersembunyi sampai daftar terbaca; fitur belum aktif (503) atau galat = tombol tetap tersembunyi (tidak ada tombol yang berpura-pura). */
import { t } from "/i18n.js";
import { api, esc, ikon } from "/inti/umum.js";

if (!document.getElementById("ikutiCss")) document.head.insertAdjacentHTML("beforeend", '<link id="ikutiCss" rel="stylesheet" href="/inti/ikuti.css">');

let daftar = null;
const muat = () => (daftar ||= api("/api/ikuti").then((d) => new Set(d.baris.map((x) => x.jenis + "|" + x.ref))).catch(() => null));

const isi = (b, ya) => {
  b.setAttribute("aria-pressed", String(ya));
  b.innerHTML = `${ikon("bintang", 16)}<span>${esc(t(ya ? "ik.diikuti" : "ik.ikuti"))}</span>`;
  b.title = t(ya ? "ik.lepas" : "ik.ikuti_ket", { nama: b.dataset.nama || "" });
};

/** jenis: proyek | organisasi | provinsi | regulasi | tender. */
export const tombolIkuti = ({ jenis, id, nama }) =>
  `<button type="button" class="jm-tbl jm-tbl-kecil jm-ikuti" data-ikuti="1" data-jenis="${esc(jenis)}" data-ref="${esc(id)}" data-nama="${esc(nama || "")}" aria-pressed="false" hidden>${ikon("bintang", 16)}<span>${esc(t("ik.ikuti"))}</span></button>`;

/** Panggil sesudah menyisipkan tombolIkuti ke DOM: mengungkap tombol dengan keadaan sebenarnya. */
export async function pasangIkuti(akar = document) {
  const set = await muat();
  if (!set) return;
  akar.querySelectorAll("[data-ikuti]").forEach((b) => { isi(b, set.has(b.dataset.jenis + "|" + b.dataset.ref)); b.hidden = false; });
}

document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-ikuti]");
  if (!b || b.disabled) return;
  const set = await muat();
  if (!set) return;
  const kunci = b.dataset.jenis + "|" + b.dataset.ref, ya = !set.has(kunci);
  b.disabled = true;
  try {
    if (ya) await api("/api/ikuti", { metode: "POST", badan: { jenis: b.dataset.jenis, ref: b.dataset.ref } });
    else await api(`/api/ikuti/${encodeURIComponent(b.dataset.jenis)}/${encodeURIComponent(b.dataset.ref)}`, { metode: "DELETE" });
    if (ya) set.add(kunci); else set.delete(kunci);
    document.querySelectorAll("[data-ikuti]").forEach((x) => { if (x.dataset.jenis + "|" + x.dataset.ref === kunci) isi(x, ya); });
    document.dispatchEvent(new CustomEvent("jm:ikuti", { detail: { jenis: b.dataset.jenis, ref: b.dataset.ref, ikut: ya } }));
  } catch (err) { b.title = t(err.status === 409 ? "ik.penuh" : "ik.gagal"); }
  b.disabled = false;
});
