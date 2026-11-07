/* Tampilan kertas posisi METI: lapisan penuh layar berkop METI; Cetak = simpan PDF lewat CSS cetak (konsultasi_kertas.css). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { susunKertas } from "/konsultasi_kertas.js";

export function kertasHtml(d, regs, nama) {
  const baris = susunKertas(d, regs), dk = d.dokumen;
  const ang = (ik, n, k) => `<li>${ikon(ik, 14)}<b>${esc(angka(n))}</b><span>${esc(t(k))}</span></li>`;
  const butir = baris.map((b) => `<article class="kt-butir"><header><span class="kt-no">${esc(b.label.replace(/^Butir\s*/, ""))}</span><h3>${esc(b.judul || b.label)}</h3></header>
    ${b.usulan ? `<p class="kt-l">${esc(t("re2.kp.usulan"))}</p><p>${esc(b.usulan)}</p>` : ""}${b.alasan ? `<p class="kt-l">${esc(t("re2.kp.alasan"))}</p><p>${esc(b.alasan)}</p>` : ""}
    <ul class="kt-ang">${ang("bintang", b.dukungan, "re2.kp.dukungan")}${ang("berita", b.komentar, "re2.kp.komentar")}${ang("ubah", b.usul, "re2.kp.usul")}</ul>
    ${b.kutipan.length ? `<p class="kt-l">${esc(t("re2.kp.tanggapan"))}</p>${b.kutipan.map((k) => `<blockquote>${esc(k)}</blockquote>`).join("")}` : ""}
    ${b.rujukan || b.regs.length ? `<p class="kt-l">${esc(t("re2.kp.dasar"))}</p><p>${esc(b.rujukan)}${b.regs.map((r) => ` <a href="${esc(r.url_sumber || "#")}">${esc(r.judul)}</a>`).join("")}</p>` : ""}</article>`).join("");
  return `<div class="kt-kertas" role="dialog" aria-modal="true" aria-label="${esc(t("re2.kp.judul"))}"><div class="kt-bar no-cetak"><button type="button" class="jm-tbl jm-tbl-utama" data-kt="cetak">${ikon("pdf", 16)}<span>${esc(t("re2.kp.cetak"))}</span></button><button type="button" class="jm-tbl" data-kt="tutup">${ikon("silang", 16)}<span>${esc(t("re2.kp.tutup"))}</span></button></div>
    <div class="kt-lembar"><div class="kt-kop"><img src="/img/logo-meti-tanda.png" width="44" height="42" alt=""><div><b>${esc(t("jm.merek"))}</b><span>${esc(t("re2.kp.judul"))}</span></div><span>${esc(tanggal(new Date().toISOString().slice(0, 10)))}</span></div>
    <h2>${esc(dk.judul)}</h2><p class="kt-meta">${esc([dk.instansi, nama].filter(Boolean).join(" | "))}</p>${butir || `<p>${esc(t("re2.kp.kosong"))}</p>`}
    <p class="kt-kaki">${esc(t("re2.kp.kaki"))}</p></div></div>`;
}

export async function bukaKertas(d, nama) {
  const regs = await fetch("/data/regulasi.json").then((r) => r.json()).then((j) => j.baris).catch(() => []);
  if (!document.getElementById("ktCss")) document.head.insertAdjacentHTML("beforeend", '<link id="ktCss" rel="stylesheet" href="/konsultasi_kertas.css">');
  const w = document.createElement("div");
  w.innerHTML = kertasHtml(d, regs, nama);
  const el = w.firstElementChild;
  document.body.append(el);
  document.documentElement.classList.add("kt-buka");
  const tutup = () => { el.remove(); document.documentElement.classList.remove("kt-buka"); };
  el.addEventListener("click", (e) => { const k = e.target.closest("[data-kt]")?.dataset.kt; if (k === "tutup") tutup(); else if (k === "cetak") window.print(); });
  el.addEventListener("keydown", (e) => { if (e.key === "Escape") tutup(); });
  el.querySelector("button")?.focus();
}
