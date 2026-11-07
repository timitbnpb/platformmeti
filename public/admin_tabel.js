/* Tabel admin bersama: urut kolom pada data PENUH lalu paginasi bernomor (pemilik 7 Nov 2026).
   pasangTabel(el, { kolom: [{ k, judul, num, nilai(r), tampil(r) }], baris, per, kosong, satuan }) merender ke el dan menangani klik sendiri. */
import { t } from "/i18n.js";
import { esc, nanti, kosongHtml } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";

export function pasangTabel(el, { kolom, baris, per = 10, kosong = "sta.kosong", satuan, awal = null }) {
  const S = { k: awal?.k ?? null, arah: awal?.arah ?? -1, hal: 1 };
  const kunciUrut = (r, c) => { const v = c.nilai ? c.nilai(r) : r[c.k]; return v == null ? null : v; };
  const gambar = () => {
    if (!baris.length) { el.innerHTML = kosongHtml(kosong); return; }
    let isi = baris;
    const c = kolom.find((x) => x.k === S.k);
    if (c) isi = [...baris].sort((a, z) => {
      const x = kunciUrut(a, c), y = kunciUrut(z, c);
      return ((x === null) - (y === null)) || (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "id", { numeric: true })) * S.arah;
    });
    const dari = (S.hal - 1) * per, tampil = isi.slice(dari, dari + per);
    el.innerHTML = `<div class="jm-gulir"><table class="jm-tabel" data-urut-terpasang="1"><thead><tr>${kolom.map((x) => `<th scope="col"${x.num ? ' class="jm-num"' : ""} ${x.urut === false ? ' data-urut="tidak"' : ` aria-sort="${S.k === x.k ? (S.arah > 0 ? "ascending" : "descending") : "none"}"`}>${x.urut === false ? esc(x.judul) : `<button type="button" class="jm-urut" data-u="${esc(x.k)}">${esc(x.judul)}</button>`}</th>`).join("")}</tr></thead>
      <tbody>${tampil.map((r) => `<tr>${kolom.map((x) => `<td${x.num ? ' class="jm-num"' : ""} data-l="${esc(x.judul)}">${x.tampil ? x.tampil(r) : esc(r[x.k])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      ${paginasiHtml({ hal: S.hal, total: baris.length, per, satuan })}`;
  };
  el.addEventListener("click", (e) => {
    const u = e.target.closest(".jm-urut");
    if (u && el.contains(u)) {
      const k = u.dataset.u, c = kolom.find((x) => x.k === k);
      S.arah = S.k === k ? -S.arah : (c.num ? -1 : 1); S.k = k; S.hal = 1;
      for (const th of el.querySelectorAll("thead th")) th.setAttribute("aria-sort", th === u.parentNode ? (S.arah > 0 ? "ascending" : "descending") : "none");
      nanti(gambar);
      return;
    }
    const h = e.target.closest("[data-hal]");
    if (h && !h.disabled && el.contains(h)) { S.hal = +h.dataset.hal; sorotHalaman(h, S.hal); nanti(gambar); }
  });
  gambar();
}
