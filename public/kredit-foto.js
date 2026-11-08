/* /kredit-foto: tabel kredit semua foto yang tayang. Data: /data/kredit_foto.json (scripts/pipa/kredit_foto.mjs). Teks dari kamus (kf.*). */
import { mulaiHalaman } from "/inti/kepala.js";
import { esc } from "/inti/umum.js";
import { t, angka } from "/i18n.js";
import { khUbin } from "/inti/kh.js";
import { muatData, saatBahasa } from "/analisis.js";
import { urlAman } from "/proyek_besar_umum.js";

const tautan = (u, teks) => (urlAman(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(teks)}</a>` : esc(teks));
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "-"; } };

const baris = (b) => `<tr>
  <td data-label="${esc(t("kf.k.foto"))}"><img class="kf-mini" src="${esc(b.foto)}" alt="" width="56" height="42" loading="lazy" decoding="async" data-galat="hapus"></td>
  <td data-label="${esc(t("kf.k.subjek"))}">${esc(b.subjek)}</td>
  <td data-label="${esc(t("kf.k.penulis"))}">${esc(b.penulis || "-")}</td>
  <td data-label="${esc(t("kf.k.lisensi"))}">${b.lisensi ? tautan(b.lisensi_url, b.lisensi) : "-"}</td>
  <td data-label="${esc(t("kf.k.sumber"))}">${tautan(b.sumber, host(b.sumber))}</td></tr>`;

const kelompok = (g) => `<section class="kf-grup" aria-labelledby="kf-${esc(g.kunci)}"><h2 id="kf-${esc(g.kunci)}">${esc(t("kf.g." + g.kunci))} <em class="kf-n">${angka(g.baris.length)}</em></h2>
  <p class="kf-cat">${esc(t("kf.g." + g.kunci + ".cat"))}</p>
  <div class="jm-gulir"><table class="jm-tabel"><caption class="sr">${esc(t("kf.g." + g.kunci))}</caption>
  <thead><tr>${["foto", "subjek", "penulis", "lisensi", "sumber"].map((k) => `<th scope="col">${esc(t("kf.k." + k))}</th>`).join("")}</tr></thead>
  <tbody>${g.baris.map(baris).join("")}</tbody></table></div></section>`;

await mulaiHalaman();
const d = await muatData("kredit_foto.json");
const gambar = () => {
  khUbin("kfUbin", [
    { ikon: "gambar", nilai: angka(d.jumlah), label: t("kf.ubin.foto") },
    { ikon: "regulasi", nilai: angka(new Set(d.kelompok.flatMap((g) => g.baris.map((b) => b.lisensi))).size), label: t("kf.ubin.lisensi") },
  ]);
  document.getElementById("kfIsi").innerHTML = d.kelompok.map(kelompok).join("") + `<p class="kf-cat">${esc(t("kf.catatan"))}</p>`;
};
gambar();
saatBahasa(gambar);
