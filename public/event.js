/* Tab Daftar mendatang dan Arsip di /kalender: agenda mendatang (karusel), bulan berjalan (kartu poster), agenda sebelumnya (daftar horizontal, filter), kemitraan dan sponsor.
   INP: kontrol (panah, bulan, filter) berubah seketika; kisi dirender ulang lewat nanti(). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml, kosongHtml, galatHtml } from "/inti/umum.js";
import { pilihHtml, exHtml } from "/inti/komponen.js";
import { hlHtml } from "/inti/aksi_ex.js";
import { muat, label, urlAman } from "/publik.js";
import { muatAcara, mendatang, lalu, hariIni, hariKe, namaBulan, geserBulan, urlEvent, urlMutlak, posterHtml, pilJenis, pilStatus, lokasiTeks, jamTeks, tglRentang, JENIS_ACARA, IKON_JENIS, pasangSalin } from "/event_umum.js";

const S = { bulan: "", tahun: "", jenis: "", tampil: 8, slide: 0 };
const AKAR = () => document.getElementById("isiEvent");
let MODE = "depan", AWAL = null, SEMUA = [], KINI = "", MITRA = null, WAKTU = 0;

const tglBesar = (b) => { const d = b.tanggal, rg = b.akhir > d; return `<span class="ev-tgl"><b>${rg ? `${+d.slice(8)}-${+b.akhir.slice(8)}` : +d.slice(8)}</b><span>${esc(tanggal(d).split(" ")[1])} ${esc(d.slice(0, 4))}</span><small>${esc(t("kal.hari." + hariKe(d)))}</small></span>`; };
const meta = (ik, teks) => (teks ? `<li>${ikon(ik, 16)}<span>${esc(teks)}</span></li>` : "");
const metaAcara = (b) => `<ul class="ev-meta">${meta("tahun", tglRentang(b))}${meta("jejak", jamTeks(b))}${meta("lokasi", lokasiTeks(b))}</ul>`;

/* ---------- 1. karusel mendatang ---------- */
function slideHtml(b, i, n) {
  return `<article class="ev-slide" data-i="${i}" role="group" aria-roledescription="${esc(t("ev.slide"))}" aria-label="${esc(t("ev.slide_n", { n: i + 1, total: n }))}">
    <div class="ev-slide-teks">${tglBesar(b)}<div class="ev-slide-isi">${pilJenis(b.jenis)}<h3 class="ev-slide-j">${esc(b.judulTampil)}</h3>${metaAcara(b)}
    <a class="jm-tbl jm-tbl-utama" href="${esc(urlEvent(b))}">${esc(t("ev.selengkapnya"))}${ikon("panah-kanan", 18)}</a></div></div>
    <a class="ev-slide-poster" href="${esc(urlEvent(b))}" tabindex="-1" aria-hidden="true">${posterHtml(b)}</a></article>`;
}
function karuselHtml() {
  const dep = mendatang(SEMUA, KINI).slice(0, 8);
  if (!dep.length) return exHtml({ id: "ev-depan", ikon: "kalender-bintang", topik: t("ev.depan.ey"), judulHtml: esc(t("ev.depan.j0")), subHtml: esc(t("ev.depan.sub")), isiHtml: kosongHtml("ev.depan.kosong") });
  const nav = dep.length > 1 ? `<button type="button" class="ev-bulat ev-panah ev-p-kiri" data-slide="-1" aria-label="${esc(t("kal.sebelumnya"))}">${ikon("panah-kiri", 22)}</button><button type="button" class="ev-bulat ev-panah ev-p-kanan" data-slide="1" aria-label="${esc(t("kal.berikutnya"))}">${ikon("panah-kanan", 22)}</button>
    <div class="ev-titik" role="group" aria-label="${esc(t("ev.slide"))}">${dep.map((b, i) => `<button type="button" data-ke="${i}" aria-label="${esc(t("ev.slide_n", { n: i + 1, total: dep.length }))}"></button>`).join("")}</div>` : "";
  return exHtml({ id: "ev-depan", ikon: "kalender-bintang", topik: t("ev.depan.ey"), judulHtml: hlHtml("ev.depan.j", angka(mendatang(SEMUA, KINI).length)), subHtml: esc(t("ev.depan.sub")),
    isiHtml: `<div class="ev-karusel" id="evKarusel" aria-roledescription="${esc(t("ev.karusel"))}" aria-label="${esc(t("ev.depan.ey"))}"><div class="ev-jalur" id="evJalur">${dep.map((b, i) => slideHtml(b, i, dep.length)).join("")}</div>${nav}</div>` });
}
function aturSlide(i) {
  const j = document.getElementById("evJalur");
  if (!j) return;
  const n = j.children.length;
  S.slide = (i + n) % n;
  j.dataset.i = S.slide;
  [...j.children].forEach((s, k) => { s.inert = k !== S.slide; s.classList.toggle("ev-aktif", k === S.slide); });
  document.querySelectorAll("#evKarusel [data-ke]").forEach((d, k) => d.setAttribute("aria-current", String(k === S.slide)));
}
function mulaiOtomatis() {
  clearInterval(WAKTU);
  const k = document.getElementById("evKarusel");
  if (!k || k.querySelectorAll(".ev-slide").length < 2 || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  let jeda = false;
  for (const ev of ["pointerenter", "focusin"]) k.addEventListener(ev, () => { jeda = true; });
  for (const ev of ["pointerleave", "focusout"]) k.addEventListener(ev, () => { jeda = false; });
  WAKTU = setInterval(() => { if (!jeda && !document.hidden && k.isConnected) aturSlide(S.slide + 1); }, 6500);
}

/* ---------- 2. bulan berjalan ---------- */
function bulanHtml() {
  const awal = S.bulan + "-01", akhirBln = S.bulan + "-31";
  const baris = SEMUA.filter((b) => b.tanggal <= akhirBln && b.akhir >= awal);
  const kartu = baris.map((b) => `<li><a class="ev-kartu-p" href="${esc(urlEvent(b))}">${posterHtml(b)}<span class="ev-pita"><b>${esc(tglRentang(b))}</b>${jamTeks(b) ? `<span>${esc(jamTeks(b))}</span>` : ""}</span>
    <span class="ev-kartu-j"><span class="ev-kartu-jt">${esc(b.judulTampil)}</span>${lokasiTeks(b) ? `<small>${ikon("lokasi", 14)}${esc(lokasiTeks(b))}</small>` : ""}</span></a></li>`).join("");
  const nav = `<div class="ev-bln-nav"><button type="button" class="ev-bulat" data-bln="-1" aria-label="${esc(t("kal.sebelumnya"))}">${ikon("panah-kiri", 20)}</button><span class="ev-bln-nama" aria-live="polite">${esc(namaBulan(S.bulan))} ${esc(S.bulan.slice(0, 4))}</span><button type="button" class="ev-bulat" data-bln="1" aria-label="${esc(t("kal.berikutnya"))}">${ikon("panah-kanan", 20)}</button>
    <button type="button" class="jm-tbl jm-tbl-kecil" data-bln="ini">${ikon("kalender", 16)}<span>${esc(t("kal.hariini"))}</span></button></div>`;
  return exHtml({ id: "ev-bulan", ikon: "kalender", topik: t("ev.bulan.ey"), judulHtml: hlHtml("ev.bulan.j", angka(baris.length), { bulan: `${namaBulan(S.bulan)} ${S.bulan.slice(0, 4)}` }), subHtml: esc(t("ev.bulan.sub")), aksiHtml: nav,
    isiHtml: baris.length ? `<ul class="ev-kisi">${kartu}</ul>` : kosongHtml("ev.bulan.kosong") });
}

/* ---------- 3. agenda sebelumnya ---------- */
function baruLalu() {
  const L = lalu(SEMUA, KINI), tahun = [...new Set(L.map((b) => b.tanggal.slice(0, 4)))].sort().reverse();
  return { L, tahun };
}
function kartuLaluHtml(b) {
  return `<li class="ev-lalu"><a class="ev-lalu-p" href="${esc(urlEvent(b))}" tabindex="-1" aria-hidden="true">${posterHtml(b)}</a>
    <div class="ev-lalu-isi"><div class="ev-lalu-kepala"><h4><a href="${esc(urlEvent(b))}">${esc(b.judulTampil)}</a></h4>${pilStatus(b)}</div>${b.deskripsi ? `<p>${esc(b.deskripsi)}</p>` : ""}</div>
    <ul class="ev-meta ev-lalu-meta">${meta("tahun", tglRentang(b))}${meta("jejak", jamTeks(b))}${meta("lokasi", lokasiTeks(b))}${meta(IKON_JENIS[b.jenis] || "jenis", label("kal.jenis.", b.jenis))}</ul>
    <div class="ev-lalu-kaki"><button type="button" class="jm-tbl jm-tbl-kecil" data-salin="${esc(urlMutlak(b))}">${ikon("bagikan", 16)}<span>${esc(t("ev.bagikan"))}</span></button><a class="jm-tbl jm-tbl-kecil jm-tbl-utama" href="${esc(urlEvent(b))}">${esc(t("ev.selengkapnya"))}${ikon("panah-kanan", 16)}</a></div></li>`;
}
function laluIsi() {
  const { L } = baruLalu();
  const rows = L.filter((b) => (!S.tahun || b.tanggal.startsWith(S.tahun)) && (!S.jenis || b.jenis === S.jenis));
  const tampil = rows.slice(0, S.tampil), g = new Map();
  for (const b of tampil) { const ym = b.tanggal.slice(0, 7); (g.get(ym) || g.set(ym, []).get(ym)).push(b); }
  const isi = [...g].map(([ym, r]) => `<section class="ev-grup"><h3>${esc(namaBulan(ym))} ${esc(ym.slice(0, 4))}<span>${esc(angka(r.length))}</span></h3><ul class="ev-daftar">${r.map(kartuLaluHtml).join("")}</ul></section>`).join("");
  return (rows.length ? isi : kosongHtml("ev.lalu.kosong")) + (rows.length > tampil.length ? `<div class="ev-lagi"><button type="button" class="jm-tbl" data-lagi>${esc(t("ev.lagi", { n: angka(rows.length - tampil.length) }))}</button></div>` : "");
}
function laluHtml() {
  const { L, tahun } = baruLalu();
  const saring = `<div class="jm-saring ev-saring">${pilihHtml({ id: "fTahun", ikon: "tahun", label: t("ev.f.tahun"), opsi: [["", t("ev.f.semua_tahun")], ...tahun.map((y) => [y, y])], nilai: S.tahun })}${pilihHtml({ id: "fJenis", ikon: "jenis", label: t("ev.f.jenis"), opsi: [["", t("kal.semua")], ...JENIS_ACARA.map((j) => [j, label("kal.jenis.", j), IKON_JENIS[j]])], nilai: S.jenis })}</div>`;
  return exHtml({ id: "ev-lalu", ikon: "jejak", topik: t("ev.lalu.ey"), judulHtml: hlHtml("ev.lalu.j", angka(L.length)), subHtml: esc(t("ev.lalu.sub")), aksiHtml: saring, isiHtml: `<div id="evLaluIsi">${laluIsi()}</div>` });
}

/* ---------- 4. kemitraan dan sponsor ---------- */
function mitraHtml() {
  const d = MITRA;
  if (!d) return "";
  const k = d.kontak || {};
  const acara = d.acara.map((a) => {
    const ev = a.event && SEMUA.find((b) => b.slug === a.event);
    const paket = (a.paket || []).map((p) => `<li class="ev-paket"><h4>${esc(p.nama)}</h4>${p.harga ? `<p class="ev-paket-h">${esc(p.harga)}</p>` : ""}<ul>${(p.manfaat || []).map((m) => `<li>${ikon("centang", 14)}<span>${esc(m)}</span></li>`).join("")}</ul></li>`).join("");
    return `<li class="ev-spons"><div class="ev-spons-kep"><span class="ev-spons-ik">${ikon("bintang", 22)}</span><h4>${esc(t("ev.mitra.acara." + a.id))}</h4></div>
      ${paket ? `<ul class="ev-pakets">${paket}</ul>` : `<p class="ev-spons-kosong">${esc(t("ev.mitra.paket_kosong"))}</p>`}
      <div class="ev-spons-aksi">${ev ? `<a class="jm-tbl jm-tbl-kecil" href="${esc(urlEvent(ev))}">${ikon("kalender-bintang", 16)}<span>${esc(t("ev.mitra.lihat_acara"))}</span></a>` : ""}${a.proposal_url && urlAman(a.proposal_url) ? `<a class="jm-tbl jm-tbl-kecil jm-tbl-utama" href="${esc(a.proposal_url)}" target="_blank" rel="noopener noreferrer">${ikon("unduh", 16)}<span>${esc(t("ev.mitra.unduh"))}</span></a>` : ""}</div></li>`;
  }).join("");
  const proposal = d.proposal_url && urlAman(d.proposal_url) ? `<a class="jm-tbl jm-tbl-utama" href="${esc(d.proposal_url)}" target="_blank" rel="noopener noreferrer">${ikon("unduh", 18)}<span>${esc(t("ev.mitra.unduh"))}</span></a>` : "";
  const surelP = k.surel ? `<p><a href="mailto:${esc(k.surel)}">${esc(k.surel)}</a></p>` : "";
  const hubungi = k.surel ? `<a class="jm-tbl" href="mailto:${esc(k.surel)}?subject=${encodeURIComponent(t("ev.mitra.subjek"))}">${ikon("surel", 18)}<span>${esc(t("ev.mitra.hubungi"))}</span></a>` : "";
  const cp = `<aside class="ev-cp"><h4>${ikon("orang", 18)}<span>${esc(t("ev.cp"))}</span></h4><p><b>${esc(k.nama || t("ev.cp.sekretariat"))}</b></p>${surelP}
    <div class="ev-spons-aksi">${proposal}${hubungi}</div></aside>`;
  return exHtml({ id: "ev-mitra", ikon: "bintang", topik: t("ev.mitra.ey"), judulHtml: esc(t("ev.mitra.j")), subHtml: esc(t("ev.mitra.sub")), isiHtml: `<div class="ev-mitra-bd"><ul class="ev-sponsor">${acara}</ul>${cp}</div>` });
}

function gambar() {
  AKAR().innerHTML = MODE === "lalu" ? laluHtml() : karuselHtml() + bulanHtml() + mitraHtml();
  nanti(() => { aturSlide(S.slide); mulaiOtomatis(); });
}

async function main() {
  KINI = hariIni();
  S.bulan = KINI.slice(0, 7);
  const isi = AKAR();
  const mulai = async () => {
    isi.innerHTML = hantuHtml(5);
    try { SEMUA = await muatAcara(); } catch { isi.innerHTML = galatHtml("layanan"); return; }
    muat("event_mitra").then((d) => { MITRA = d; if (SEMUA.length) nanti(gambar); }, () => {});
    gambar();
  };
  pasangSalin();
  await mulai();
  isi.addEventListener("click", (e) => {
    const q = (s) => e.target.closest(s);
    let b;
    if (q("[data-aksi=ulang]")) mulai();
    else if ((b = q("[data-slide]"))) aturSlide(S.slide + Number(b.dataset.slide));
    else if ((b = q("[data-ke]"))) aturSlide(Number(b.dataset.ke));
    else if ((b = q("[data-bln]"))) { S.bulan = b.dataset.bln === "ini" ? KINI.slice(0, 7) : geserBulan(S.bulan, Number(b.dataset.bln)); nanti(() => { const ex = document.getElementById("ev-bulan"); ex.outerHTML = bulanHtml(); }); document.querySelector(".ev-bln-nama").textContent = `${namaBulan(S.bulan)} ${S.bulan.slice(0, 4)}`; }
    else if (q("[data-lagi]")) { S.tampil += 8; nanti(() => { document.getElementById("evLaluIsi").innerHTML = laluIsi(); }); }
  });
  isi.addEventListener("change", (e) => {
    if (e.target.id === "fTahun") S.tahun = e.target.value; else if (e.target.id === "fJenis") S.jenis = e.target.value; else return;
    S.tampil = 8; nanti(() => { document.getElementById("evLaluIsi").innerHTML = laluIsi(); });
  });
  document.addEventListener("jm:bahasa", () => SEMUA.length && nanti(gambar));
}
/** Dipanggil kalender_halaman.js: "depan" (daftar mendatang) atau "lalu" (arsip); data dimuat sekali. */
export function tampil(mode) {
  MODE = mode;
  if (!AWAL) AWAL = main();
  else if (SEMUA.length) nanti(gambar);
  return AWAL;
}
