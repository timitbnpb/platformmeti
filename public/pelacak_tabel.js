/* Tabel urut + berpaginasi bernomor untuk /pelacak. tabelHtml() mendaftarkan definisi dan mengembalikan kerangka;
   pasangTabel(akar) satu pendengar klik. INP: tombol urut/halaman menyala seketika, isi tabel menyusul lewat nanti(). */
import { t } from "/i18n.js";
import { esc, nanti, ikon } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";

const REG = new Map();
/* def: { kolom: [{ k, j (kunci i18n judul), sel(r) -> html, u(r) -> nilai urut, kelas }], baris, per, urut: kunci awal, arah, satuan } */
export function tabelHtml(id, def) {
  REG.set(id, { per: 10, arah: 1, hal: 1, ...def, k: def.urut ?? def.kolom[0].k });
  return `<div class="pl-tabel" id="${esc(id)}" data-tp></div>`;
}
const banding = (c, a) => (x, y) => {
  const u = c.u(x), v = c.u(y);
  if (u === v) return 0;
  if (u == null || u === "") return 1;
  if (v == null || v === "") return -1;
  return (typeof u === "number" && typeof v === "number" ? u - v : String(u).localeCompare(String(v), "id")) * a;
};
export function gambarTabel(id, fokus) {
  const T = REG.get(id), el = document.getElementById(id);
  if (!T || !el) return;
  const c = T.kolom.find((x) => x.k === T.k) || T.kolom[0];
  const rows = T.baris.slice().sort(banding(c, T.arah));
  if (!rows.length) { el.innerHTML = `<div class="jm-kosong">${ikon("info", 32)}<p>${esc(t("pl.kosong.tabel"))}</p></div>`; return; }
  T.hal = Math.min(T.hal, Math.max(1, Math.ceil(rows.length / T.per)));
  const kep = `<th scope="col" class="jm-num pl-no">${esc(t("pl.c.no"))}</th>` + T.kolom.map((x) => `<th scope="col" class="${x.kelas || ""}" aria-sort="${T.k === x.k ? (T.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-u="${esc(x.k)}">${esc(t(x.j))}</button></th>`).join("");
  const awal = (T.hal - 1) * T.per;
  const isi = rows.slice(awal, awal + T.per).map((r, i) => `<tr><td class="jm-num pl-no" data-label="${esc(t("pl.c.no"))}">${awal + i + 1}</td>${T.kolom.map((x) => `<td data-label="${esc(t(x.j))}"${x.kelas ? ` class="${x.kelas}"` : ""}>${x.sel(r)}</td>`).join("")}</tr>`).join("");
  el.innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-tabel--kartu" data-urut="tidak"><thead><tr>${kep}</tr></thead><tbody>${isi}</tbody></table></div>${paginasiHtml({ hal: T.hal, total: rows.length, per: T.per, satuan: T.satuan || "jm.pag.u.data" })}`;
  if (fokus) el.querySelector(fokus)?.focus();
}
export function pasangTabel(akar) {
  akar.addEventListener("click", (e) => {
    const el = e.target.closest("[data-tp]");
    if (!el) return;
    const T = REG.get(el.id), u = e.target.closest("[data-u]"), l = e.target.closest("[data-hal]");
    if (u && T) {
      const k = u.dataset.u, c = T.kolom.find((x) => x.k === k);
      T.arah = T.k === k ? -T.arah : c.desc ? -1 : 1; T.k = k; T.hal = 1;
      for (const th of el.querySelectorAll("th[aria-sort]")) th.setAttribute("aria-sort", th.contains(u) ? (T.arah > 0 ? "ascending" : "descending") : "none");
      nanti(() => gambarTabel(el.id, `[data-u="${k}"]`));
    } else if (l && !l.disabled && T) {
      T.hal = +l.dataset.hal; sorotHalaman(l, T.hal); nanti(() => gambarTabel(el.id));
    }
  });
}
export const gambarSemua = (akar) => { for (const el of akar.querySelectorAll("[data-tp]")) gambarTabel(el.id); };
