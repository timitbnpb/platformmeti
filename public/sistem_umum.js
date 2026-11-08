/* Pembantu bersama /sistem, /kawasan, /dpr-energi: tabel urut berpaginasi (teks lewat kamus sp2.*), legenda warna, pil bukti, kartu sumber.
   Semua teks lewat t(); warna lewat kelas di sistem.css (token tema.css). */
import { t, angka } from "/i18n.js";
import { esc, ikon, nanti } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";

export const num = (v, n = 0) => (v == null ? "-" : angka(v, { desimal: n }));
export const L = (o, b) => (o && typeof o === "object" ? o[b === "zh" ? "en" : b] ?? o.id ?? "" : o ?? "");
export const urlAman = (u) => (/^https:\/\//.test(u || "") ? u : null);
export const tautan = (u, teks) => (urlAman(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(teks)}</a>` : esc(teks));
export const pilBukti = (tb) => `<span class="jm-pil jm-pil-${tb === "resmi" ? "ok" : "warn"}">${esc(t("sp2.bukti." + (tb || "media")))}</span>`;
export const legendaHtml = (butir) => `<ul class="sp-lg" aria-label="${esc(t("sp2.legenda"))}">${butir.map((b) => `<li><i class="${b.kelas}"></i>${esc(b.teks)}</li>`).join("")}</ul>`;
export const sumberKartu = (daftar, tgl) => `<ul class="sp-sumber">${daftar.map((s) => `<li>${ikon("buku", 16)}<span>${tautan(s.url, s.judul)}${s.penerbit || s.media ? ` <small>${esc(s.penerbit || s.media)}</small>` : ""} ${pilBukti(s.tingkat_bukti)}${s.tanggal || tgl ? ` <small>${esc(s.tanggal || tgl)}</small>` : ""}</span></li>`).join("")}</ul>`;

/* kolom: [{k, label, v(r) nilai urut, f(r)? html sel, num?, tengah?}]; urut dan halaman memakai seluruh data. */
export function tabelUrut(akar, { kolom, baris, per = 10, satuan = "jm.pag.u.data", urut = null, label = "" }) {
  const st = { k: urut?.k ?? null, arah: urut?.arah ?? 1, hal: 1 };
  const susun = () => {
    if (!st.k) return baris;
    const c = kolom.find((x) => x.k === st.k);
    return [...baris].sort((a, z) => { const x = c.v(a), y = c.v(z); return ((x == null) - (y == null)) || (x == null ? 0 : (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "id", { numeric: true })) * st.arah); });
  };
  const gambar = () => {
    const a = susun(), m = (st.hal - 1) * per;
    const th = kolom.map((c) => `<th aria-sort="${st.k === c.k ? (st.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-kol="${esc(c.k)}">${esc(c.label)}</button></th>`).join("");
    const tr = a.slice(m, m + per).map((r) => `<tr>${kolom.map((c) => `<td data-label="${esc(c.label)}"${c.num ? ' class="jm-num"' : c.tengah ? ' class="jm-tengah"' : ""}>${c.f ? c.f(r) : esc(c.v(r) ?? "-")}</td>`).join("")}</tr>`).join("");
    akar.innerHTML = `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak" aria-label="${esc(label)}"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>${a.length > per ? paginasiHtml({ hal: st.hal, total: a.length, per, satuan }) : ""}`;
  };
  akar.addEventListener("click", (e) => {
    const u = e.target.closest(".jm-urut"), h = e.target.closest("[data-hal]");
    if (u) {
      const k = u.dataset.kol; st.arah = st.k === k ? -st.arah : 1; st.k = k; st.hal = 1;
      for (const th of akar.querySelectorAll("th[aria-sort]")) th.setAttribute("aria-sort", th === u.parentElement ? (st.arah > 0 ? "ascending" : "descending") : "none");
      nanti(gambar);
    } else if (h && !h.disabled) { st.hal = Number(h.dataset.hal); sorotHalaman(h, st.hal); nanti(gambar); }
  });
  akar.closest(".jm-ex")?.addEventListener("jm:csv", (e) => { e.detail.baris = [kolom.map((c) => c.label), ...susun().map((r) => kolom.map((c) => c.v(r) ?? ""))]; });
  gambar();
  return { ulang: gambar, set: (b) => { baris = b; st.hal = 1; gambar(); } };
}
