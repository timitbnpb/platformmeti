/* /galeri (Foto): karusel 3 foto terbaru, kisi masonry, lightbox berketerangan (acara, tanggal, tautan liputan). Hanya foto berhak METI (data/galeri.json). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml, kosongHtml, galatHtml } from "/inti/umum.js";
import { pilihHtml, exHtml } from "/inti/komponen.js";
import { hlHtml } from "/inti/aksi_ex.js";
import { muat, urlAman } from "/publik.js";
import { muatAcara, urlEvent } from "/event_umum.js";

const S = { tahun: "", acara: "", slide: 0, buka: -1 };
let FOTO = [], NAMA = new Map(), WAKTU = 0, LIHAT = [];
const ket = (f) => f.judul;

function ubin() {
  khUbin("khUbin", [{ ikon: "gambar", nilai: angka(FOTO.length), label: t("gal.n.foto") }, { ikon: "kalender-bintang", nilai: angka(new Set(FOTO.map((f) => f.event).filter(Boolean)).size), label: t("gal.n.acara") }, { ikon: "tahun", nilai: angka(new Set(FOTO.map((f) => f.tanggal.slice(0, 4))).size), label: t("gal.n.tahun") }]);
}
function karuselHtml() {
  const top = FOTO.slice(0, 3);
  if (!top.length) return "";
  const nav = top.length > 1 ? `<button type="button" class="ev-bulat ev-panah ev-p-kiri" data-slide="-1" aria-label="${esc(t("kal.sebelumnya"))}">${ikon("panah-kiri", 22)}</button><button type="button" class="ev-bulat ev-panah ev-p-kanan" data-slide="1" aria-label="${esc(t("kal.berikutnya"))}">${ikon("panah-kanan", 22)}</button>
    <div class="ev-titik">${top.map((f, i) => `<button type="button" data-ke="${i}" aria-label="${esc(t("ev.slide_n", { n: i + 1, total: top.length }))}"></button>`).join("")}</div>` : "";
  return `<div class="ev-karusel gal-karusel" id="galKarusel" aria-roledescription="${esc(t("ev.karusel"))}"><div class="ev-jalur" id="galJalur">${top.map((f, i) => `<figure class="gal-slide" data-i="${i}"><button type="button" class="gal-slide-b" data-foto="${esc(f.id)}"><img src="${esc(f.file)}" alt="" decoding="async"${i ? ' loading="lazy"' : ""}></button><figcaption><small>${esc(tanggal(f.tanggal))}</small><b>${esc(ket(f))}</b></figcaption></figure>`).join("")}</div>${nav}</div>`;
}
function aturSlide(i) {
  const j = document.getElementById("galJalur");
  if (!j) return;
  S.slide = (i + j.children.length) % j.children.length;
  j.dataset.i = S.slide;
  [...j.children].forEach((s, k) => { s.inert = k !== S.slide; });
  document.querySelectorAll("#galKarusel [data-ke]").forEach((d, k) => d.setAttribute("aria-current", String(k === S.slide)));
}
function otomatis() {
  clearInterval(WAKTU);
  const k = document.getElementById("galKarusel");
  if (!k || matchMedia("(prefers-reduced-motion:reduce)").matches || k.querySelectorAll("figure").length < 2) return;
  let jeda = false;
  for (const ev of ["pointerenter", "focusin"]) k.addEventListener(ev, () => { jeda = true; });
  for (const ev of ["pointerleave", "focusout"]) k.addEventListener(ev, () => { jeda = false; });
  WAKTU = setInterval(() => { if (!jeda && !document.hidden && k.isConnected) aturSlide(S.slide + 1); }, 6000);
}
function saring() { return FOTO.filter((f) => (!S.tahun || f.tanggal.startsWith(S.tahun)) && (!S.acara || f.event === S.acara)); }
function kisiHtml() {
  LIHAT = saring();
  return LIHAT.length ? `<ul class="gal-masonry">${LIHAT.map((f) => `<li><button type="button" class="gal-foto" data-foto="${esc(f.id)}" aria-label="${esc(t("gal.buka", { judul: ket(f) }))}"><img src="${esc(f.file)}" alt="" loading="lazy" decoding="async"><span class="gal-ket"><b>${esc(ket(f))}</b><small>${esc(tanggal(f.tanggal))}</small></span></button></li>`).join("")}</ul>` : kosongHtml("gal.kosong");
}
function badanHtml() {
  const tahun = [...new Set(FOTO.map((f) => f.tanggal.slice(0, 4)))].sort().reverse();
  const acara = [...new Set(FOTO.map((f) => f.event).filter(Boolean))].map((s) => [s, NAMA.get(s) || s]);
  const aksi = `<div class="jm-saring ev-saring">${pilihHtml({ id: "gTahun", ikon: "tahun", label: t("ev.f.tahun"), opsi: [["", t("ev.f.semua_tahun")], ...tahun.map((y) => [y, y])], nilai: S.tahun })}${pilihHtml({ id: "gAcara", ikon: "kalender-bintang", label: t("gal.f.acara"), opsi: [["", t("gal.f.semua_acara")], ...acara], nilai: S.acara })}</div>`;
  return exHtml({ id: "gal-kisi", ikon: "gambar", topik: t("gal.kisi.ey"), judulHtml: hlHtml("gal.kisi.j", angka(FOTO.length)), subHtml: esc(t("gal.kisi.sub")), aksiHtml: aksi, isiHtml: `<div id="galIsi">${kisiHtml()}</div><p class="jm-bantu">${esc(t("gal.hak"))}</p>` });
}

/* ---------- lightbox ---------- */
function dialog() {
  let d = document.getElementById("galDlg");
  if (d) return d;
  d = document.createElement("dialog");
  d.id = "galDlg"; d.className = "gal-dlg"; d.setAttribute("aria-labelledby", "galDlgJ");
  document.body.append(d);
  d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-tutup]")) d.close(); const g = e.target.closest("[data-geser]"); if (g) lompat(Number(g.dataset.geser)); });
  d.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") lompat(-1); else if (e.key === "ArrowRight") lompat(1); });
  d.addEventListener("close", () => { S.buka = -1; if (location.hash) history.replaceState(null, "", location.pathname + location.search); });
  return d;
}
function lightbox() {
  const f = LIHAT[S.buka];
  if (!f) return;
  const d = dialog(), judulAcara = f.event && NAMA.get(f.event);
  d.innerHTML = `<div class="gal-lb"><button type="button" class="ev-bulat gal-x" data-tutup aria-label="${esc(t("jm.tutup"))}">${ikon("tutup", 20)}</button>
    <div class="gal-lb-gambar"><button type="button" class="ev-bulat ev-panah ev-p-kiri" data-geser="-1" aria-label="${esc(t("kal.sebelumnya"))}">${ikon("panah-kiri", 22)}</button><img src="${esc(f.file)}" alt="${esc(ket(f))}"><button type="button" class="ev-bulat ev-panah ev-p-kanan" data-geser="1" aria-label="${esc(t("kal.berikutnya"))}">${ikon("panah-kanan", 22)}</button></div>
    <div class="gal-lb-ket"><h2 id="galDlgJ">${esc(ket(f))}</h2><p class="jm-bantu">${esc(tanggal(f.tanggal, { gaya: "panjang" }))} - ${esc(t("gal.n_dari", { n: angka(S.buka + 1), total: angka(LIHAT.length) }))}</p>
    <div class="gal-lb-aksi">${judulAcara ? `<a class="jm-tbl jm-tbl-kecil" href="${esc(urlEvent({ slug: f.event }))}">${ikon("kalender-bintang", 16)}<span>${esc(t("gal.ke_acara"))}</span></a>` : ""}${urlAman(f.liputan) ? `<a class="jm-tbl jm-tbl-kecil" href="${esc(f.liputan)}" target="_blank" rel="noopener noreferrer">${ikon("berita", 16)}<span>${esc(t("gal.liputan"))}</span></a>` : ""}</div>
    <p class="jm-bantu">${esc(f.hak)}</p></div></div>`;
  if (!d.open) d.showModal();
  history.replaceState(null, "", `${location.pathname}${location.search}#foto-${f.id}`);
}
function lompat(n) { S.buka = (S.buka + n + LIHAT.length) % LIHAT.length; lightbox(); }
function bukaId(id) {
  let i = LIHAT.findIndex((f) => f.id === id);
  if (i < 0) { S.tahun = ""; S.acara = ""; LIHAT = saring(); i = LIHAT.findIndex((f) => f.id === id); }
  if (i >= 0) { S.buka = i; lightbox(); }
}

function gambar() {
  document.getElementById("isi").innerHTML = (FOTO.length ? exHtml({ id: "gal-sorot", ikon: "bintang", topik: t("gal.sorot.ey"), judulHtml: esc(t("gal.sorot.j")), subHtml: esc(t("gal.sorot.sub")), isiHtml: karuselHtml() }) : "") + badanHtml();
  ubin();
  nanti(() => { aturSlide(S.slide); otomatis(); });
}

async function main() {
  await mulaiHalaman();
  const isi = document.getElementById("isi"), p = new URLSearchParams(location.search);
  const mulai = async () => {
    isi.innerHTML = hantuHtml(5);
    try { FOTO = (await muat("galeri")).baris; } catch { isi.innerHTML = galatHtml("layanan"); return; }
    try { NAMA = new Map((await muatAcara()).map((b) => [b.slug, b.judulTampil])); } catch { NAMA = new Map(); }
    if (p.get("acara")) S.acara = p.get("acara");
    gambar();
    const h = /^#foto-(.+)$/.exec(location.hash);
    if (h) bukaId(decodeURIComponent(h[1]));
  };
  await mulai();
  isi.addEventListener("click", (e) => {
    const q = (s) => e.target.closest(s);
    let b;
    if (q("[data-aksi=ulang]")) mulai();
    else if ((b = q("[data-slide]"))) aturSlide(S.slide + Number(b.dataset.slide));
    else if ((b = q("[data-ke]"))) aturSlide(Number(b.dataset.ke));
    else if ((b = q("[data-foto]"))) { LIHAT = saring(); if (!LIHAT.some((f) => f.id === b.dataset.foto)) LIHAT = FOTO.slice(); S.buka = LIHAT.findIndex((f) => f.id === b.dataset.foto); lightbox(); }
  });
  isi.addEventListener("change", (e) => {
    if (e.target.id === "gTahun") S.tahun = e.target.value; else if (e.target.id === "gAcara") S.acara = e.target.value; else return;
    nanti(() => { document.getElementById("galIsi").innerHTML = kisiHtml(); });
  });
  document.addEventListener("jm:bahasa", () => FOTO.length && nanti(gambar));
}
main();
