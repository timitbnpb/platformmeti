/* /produk-meti: semua Produk METI yang sudah publik, dikelompokkan menurut jenis. Tiap kartu: tanggal, ringkasan, topik terkait (tautan dua arah
   dengan komponen "Produk METI terkait" di halaman lain), tautan sumber. Tanpa kontrol (hanya tautan dan <details> bawaan). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, hantuHtml, galatHtml } from "/inti/umum.js";
import { exHtml, sumberHtml } from "/inti/komponen.js";
import { JENIS, IKON_JENIS, L, tgl, muatProduk, topikTaut } from "/inti/produk_meti.js";

const TAMPIL = 6;
let D = null;

const chip = (x) => { const c = topikTaut(x); return `<li><a href="${esc(c.href)}">${ikon(c.ik, 14)}<span>${esc(c.nama)}</span></a></li>`; };
const luar = (u) => /^https?:\/\//.test(u);
function kartu(p) {
  const depan = p.terkait.slice(0, TAMPIL), sisa = p.terkait.slice(TAMPIL);
  const tautan = [`<a class="jm-tbl" href="${esc(p.sumber.url)}"${luar(p.sumber.url) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${ikon(luar(p.sumber.url) ? "tautan" : "panah-kanan", 16)}<span>${esc(t(luar(p.sumber.url) ? "prm.sumber" : "prm.baca", { media: p.sumber.label }))}</span></a>`];
  if (p.buka) tautan.push(`<a class="jm-tbl" href="${esc(p.buka)}">${ikon("panah-kanan", 16)}<span>${esc(t("prm.baca"))}</span></a>`);
  return `<li class="pm-kt"><article class="pm-kt-penuh">
    <p class="pm-meta"><span class="jm-pil pm-pil">${ikon(IKON_JENIS[p.jenis], 14)}<span>${esc(t("prm.jenis." + p.jenis))}</span></span>${p.status ? `<span class="jm-pil jm-pil-warn">${esc(t("prm.status." + p.status))}</span>` : ""}<time datetime="${esc(p.tanggal)}">${esc(tgl(p.tanggal))}</time></p>
    <h3>${esc(L(p.judul))}</h3><p class="pm-r">${esc(L(p.ringkas))}</p>
    ${p.butir ? `<p class="pm-butir">${esc(t("prm.butir", { n: angka(p.butir) }))}</p>` : ""}
    ${depan.length ? `<ul class="pm-chip" aria-label="${esc(t("prm.terkait_topik"))}">${depan.map(chip).join("")}</ul>` : ""}
    ${sisa.length ? `<details class="pm-lain"><summary>${esc(t("prm.lainnya", { n: angka(sisa.length) }))}</summary><ul class="pm-chip">${sisa.map(chip).join("")}</ul></details>` : ""}
    <div class="pm-aksi">${tautan.join("")}</div></article></li>`;
}

function gambar() {
  document.title = t("prm.title");
  const terbaru = D.baris.reduce((a, p) => (p.tanggal > a ? p.tanggal : a), "");
  khUbin("khUbin", [{ ikon: "lencana", nilai: angka(D.baris.length), label: t("prm.k.produk") }, { ikon: "kalender", nilai: tanggal(terbaru), label: t("prm.k.terbaru") }, { ikon: "palu", nilai: angka(D.baris.find((p) => p.jenis === "masukan")?.butir || 0), label: t("prm.k.butir") }]);
  const bagian = JENIS.map((j) => {
    const a = D.baris.filter((p) => p.jenis === j);
    return a.length ? exHtml({ id: "pm-" + j, ikon: IKON_JENIS[j], topik: t("prm.jenis." + j), judulHtml: esc(t("prm.jenis." + j + ".j")), subHtml: esc(t("prm.jenis." + j + ".s")), tingkat: "h2", isiHtml: `<ul class="pm-penuh">${a.map(kartu).join("")}</ul>` }) : "";
  }).join("");
  document.getElementById("pmIsi").innerHTML = `<p class="pm-catatan">${esc(t("prm.catatan"))}</p>${bagian}`
    + exHtml({ id: "pm-sumber", ikon: "info", topik: t("prm.celah.ey"), judulHtml: esc(t("prm.celah.j")), tingkat: "h2", isiHtml: `<p class="pm-catatan">${esc(t("prm.celah"))}</p>`, aksiHtml: sumberHtml(esc(t("prm.sumber_data", { tgl: tgl(D.dibangun_pada) }))) });
}

await mulaiHalaman();
document.getElementById("pmIsi").innerHTML = hantuHtml(4);
D = await muatProduk();
if (!D.baris.length) document.getElementById("pmIsi").innerHTML = galatHtml();
else { gambar(); document.addEventListener("jm:bahasa", gambar); }
