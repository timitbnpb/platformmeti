/* Tab Daftar mendatang dan Arsip di /kalender: agenda mendatang (karusel), bulan berjalan (kartu poster), agenda sebelumnya (daftar horizontal, filter), kemitraan dan sponsor.
   INP: kontrol (panah, bulan, filter) berubah seketika; kisi dirender ulang lewat nanti(). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml, kosongHtml, galatHtml } from "/inti/umum.js";
import { pilihHtml, exHtml } from "/inti/komponen.js";
import { hlHtml } from "/inti/aksi_ex.js";
import { muat, label, urlAman } from "/publik.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { muatAcara, mendatang, lalu, hariIni, hariKe, namaBulan, geserBulan, urlEvent, urlMutlak, posterHtml, pilJenis, pilStatus, lokasiTeks, jamTeks, tglRentang, JENIS_ACARA, IKON_JENIS, pasangSalin, unduhIcs } from "/event_umum.js";

const S = { bulan: "", tahun: "", jenis: "", hal: Math.max(1, Number(new URLSearchParams(location.search).get("hal")) || 1), slide: 0, mitra: "" };
const PER = 8;
const AKAR = () => document.getElementById("isiEvent");
let MODE = "depan", AWAL = null, SEMUA = [], KINI = "", MITRA = null, WAKTU = 0;

const tglBesar = (b) => { const d = b.tanggal, rg = b.akhir > d; return `<span class="ev-tgl"><b>${rg ? `${+d.slice(8)}-${+b.akhir.slice(8)}` : +d.slice(8)}</b><span>${esc(tanggal(d).split(" ")[1])} ${esc(d.slice(0, 4))}</span><small>${esc(t("kal.hari." + hariKe(d)))}</small></span>`; };
const meta = (ik, teks) => (teks ? `<li>${ikon(ik, 16)}<span>${esc(teks)}</span></li>` : "");
const metaAcara = (b) => `<ul class="ev-meta">${meta("tahun", tglRentang(b))}${meta("jejak", jamTeks(b))}${meta("lokasi", lokasiTeks(b))}</ul>`;

/* ---------- 1. karusel mendatang ---------- */
const tglKotak = (b) => { const d = b.tanggal, rg = b.akhir > d; return `<span class="ev-tgl"><b>${rg ? `${+d.slice(8)}-${+b.akhir.slice(8)}` : +d.slice(8)}</b><span>${esc(tanggal(d).split(" ")[1])} ${esc(d.slice(0, 4))}</span></span>`; };
/** Poster utuh (contain) di atas latar blur dari poster yang sama; tanpa poster: foto teknologi. */
const posterUtuh = (b) => (b.poster ? `<img class="ev-lat" src="${esc(b.poster.file)}" alt="" aria-hidden="true" loading="lazy" decoding="async">` : "") + posterHtml(b, b.poster ? "ev-utuh" : "");
function slideHtml(b, i, n) {
  const u = esc(urlEvent(b));
  return `<article class="ev-slide" data-i="${i}" role="group" aria-roledescription="${esc(t("ev.slide"))}" aria-label="${esc(t("ev.slide_n", { n: i + 1, total: n }))}">
    <div class="ev-slide-teks"><div class="ev-slide-atas">${tglKotak(b)}<div class="ev-slide-judul">${pilJenis(b.jenis)}<h3 class="ev-slide-j">${esc(b.judulTampil)}</h3></div></div>${metaAcara(b)}
    <div class="ev-slide-aksi"><a class="jm-tbl jm-tbl-utama" href="${u}">${ikon("info", 18)}<span>${esc(t("ev.selengkapnya"))}</span></a><button type="button" class="jm-tbl" data-ics="${esc(b.slug)}">${ikon("kalender", 18)}<span>${esc(t("ev.kalender"))}</span></button></div></div>
    <a class="ev-slide-poster" href="${u}" tabindex="-1" aria-hidden="true">${posterUtuh(b)}</a></article>`;
}
function karuselHtml() {
  const dep = mendatang(SEMUA, KINI).slice(0, 8);
  if (!dep.length) return exHtml({ id: "ev-depan", ikon: "kalender-bintang", topik: t("ev.depan.ey"), judulHtml: esc(t("ev.depan.j0")), subHtml: esc(t("ev.depan.sub")), isiHtml: kosongHtml("ev.depan.kosong") });
  const nav = dep.length > 1 ? `<div class="ev-kar-nav"><button type="button" class="ev-bulat" data-slide="-1" aria-label="${esc(t("kal.sebelumnya"))}">${ikon("panah-kiri", 22)}</button>
    <div class="ev-titik" role="group" aria-label="${esc(t("ev.slide"))}">${dep.map((b, i) => `<button type="button" data-ke="${i}" aria-label="${esc(t("ev.slide_n", { n: i + 1, total: dep.length }))}"></button>`).join("")}</div>
    <span class="ev-hitung" data-total="${dep.length}" aria-hidden="true"></span><button type="button" class="ev-bulat" data-slide="1" aria-label="${esc(t("kal.berikutnya"))}">${ikon("panah-kanan", 22)}</button></div>` : "";
  return exHtml({ id: "ev-depan", ikon: "kalender-bintang", topik: t("ev.depan.ey"), judulHtml: hlHtml("ev.depan.j", angka(mendatang(SEMUA, KINI).length)), subHtml: esc(t("ev.depan.sub")),
    isiHtml: `<div class="ev-karusel" id="evKarusel" tabindex="-1" aria-roledescription="${esc(t("ev.karusel"))}" aria-label="${esc(t("ev.depan.ey"))}"><div class="ev-jalur" id="evJalur">${dep.map((b, i) => slideHtml(b, i, dep.length)).join("")}</div>${nav}</div>` });
}
/** Geser sentuh/penunjuk pada jalur dan panah papan ketik pada karusel. */
function pasangGeser() {
  const k = document.getElementById("evKarusel"), j = document.getElementById("evJalur");
  if (!k) return;
  let x0 = null;
  j.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
  j.addEventListener("pointerup", (e) => { if (x0 !== null && Math.abs(e.clientX - x0) > 50) aturSlide(S.slide + (e.clientX < x0 ? 1 : -1)); x0 = null; });
  j.addEventListener("pointercancel", () => { x0 = null; });
  k.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { aturSlide(S.slide + (e.key === "ArrowRight" ? 1 : -1)); e.preventDefault(); } });
}
function aturSlide(i) {
  const j = document.getElementById("evJalur");
  if (!j) return;
  const n = j.children.length;
  S.slide = (i + n) % n;
  j.dataset.i = S.slide;
  [...j.children].forEach((s, k) => { s.inert = k !== S.slide; s.classList.toggle("ev-aktif", k === S.slide); });
  document.querySelectorAll("#evKarusel [data-ke]").forEach((d, k) => d.setAttribute("aria-current", String(k === S.slide)));
  const h = document.querySelector("#evKarusel .ev-hitung");
  if (h) h.textContent = `${S.slide + 1} / ${h.dataset.total}`;
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
const tglPendek = (b) => (b.akhir > b.tanggal && b.akhir.slice(0, 7) === b.tanggal.slice(0, 7) ? `${+b.tanggal.slice(8)}-${tanggal(b.akhir)}` : tglRentang(b));
function bulanHtml() {
  const awal = S.bulan + "-01", akhirBln = S.bulan + "-31";
  const baris = SEMUA.filter((b) => b.tanggal <= akhirBln && b.akhir >= awal);
  const kartu = baris.map((b) => `<li><a class="ev-kartu-p" href="${esc(urlEvent(b))}">${posterHtml(b)}<span class="ev-pita"><b>${esc(tglPendek(b))}</b>${jamTeks(b) ? `<span>${esc(jamTeks(b))}</span>` : ""}</span>
    <span class="ev-kartu-j"><span class="ev-kartu-jt">${esc(b.judulTampil)}</span>${lokasiTeks(b) ? `<small>${ikon("lokasi", 14)}${esc(lokasiTeks(b))}</small>` : ""}</span></a></li>`).join("");
  const nav = `<div class="ev-bln-nav"><button type="button" class="ev-bulat" data-bln="-1" aria-label="${esc(t("kal.sebelumnya"))}">${ikon("panah-kiri", 20)}</button><span class="ev-bln-nama" aria-live="polite">${esc(namaBulan(S.bulan))} ${esc(S.bulan.slice(0, 4))}</span><button type="button" class="ev-bulat" data-bln="1" aria-label="${esc(t("kal.berikutnya"))}">${ikon("panah-kanan", 20)}</button>
    <button type="button" class="jm-tbl jm-tbl-kecil" data-bln="ini">${ikon("kalender", 16)}<span>${esc(t("kal.hariini"))}</span></button></div>`;
  return exHtml({ id: "ev-bulan", ikon: "kalender", topik: t("ev.bulan.ey"), judulHtml: hlHtml("ev.bulan.j", angka(baris.length), { bulan: `${namaBulan(S.bulan)} ${S.bulan.slice(0, 4)}` }), subHtml: esc(t("ev.bulan.sub")), aksiHtml: nav,
    isiHtml: baris.length ? `<ul class="ev-kisi ev-kisi-${Math.min(baris.length, 5)}">${kartu}</ul>` : kosongHtml("ev.bulan.kosong") });
}

/* ---------- 3. agenda sebelumnya ---------- */
function baruLalu() {
  const L = lalu(SEMUA, KINI), tahun = [...new Set(L.map((b) => b.tanggal.slice(0, 4)))].sort().reverse();
  return { L, tahun };
}
function kartuLaluHtml(b) {
  const u = esc(urlEvent(b));
  return `<li class="ev-lalu"><a class="ev-lalu-p" href="${u}" tabindex="-1" aria-hidden="true">${posterUtuh(b)}</a>
    <div class="ev-lalu-isi"><h4><a href="${u}">${esc(b.judulTampil)}</a></h4>
    <ul class="ev-meta ev-meta-baris">${pilStatus(b) ? `<li>${pilStatus(b)}</li>` : ""}${meta("tahun", tglRentang(b))}${meta("jejak", jamTeks(b))}${meta("lokasi", lokasiTeks(b))}${meta(IKON_JENIS[b.jenis] || "jenis", label("kal.jenis.", b.jenis))}</ul>
    ${b.deskripsi ? `<p>${esc(b.deskripsi)}</p>` : ""}</div>
    <div class="ev-lalu-kaki"><button type="button" class="jm-tbl jm-tbl-kecil" data-salin="${esc(urlMutlak(b))}">${ikon("bagikan", 16)}<span>${esc(t("ev.bagikan"))}</span></button><a class="jm-tbl jm-tbl-kecil jm-tbl-utama" href="${u}"><span>${esc(t("ev.selengkapnya"))}</span>${ikon("panah-kanan", 16)}</a></div></li>`;
}
function laluIsi() {
  const { L } = baruLalu();
  const rows = L.filter((b) => (!S.tahun || b.tanggal.startsWith(S.tahun)) && (!S.jenis || b.jenis === S.jenis));
  const jml = Math.max(1, Math.ceil(rows.length / PER));
  S.hal = Math.min(Math.max(1, S.hal), jml);
  const tampil = rows.slice((S.hal - 1) * PER, S.hal * PER), g = new Map();
  for (const b of tampil) { const ym = b.tanggal.slice(0, 7); (g.get(ym) || g.set(ym, []).get(ym)).push(b); }
  const isi = [...g].map(([ym, r]) => `<section class="ev-grup"><h3>${esc(namaBulan(ym))} ${esc(ym.slice(0, 4))}<span>${esc(angka(r.length))}</span></h3><ul class="ev-daftar">${r.map(kartuLaluHtml).join("")}</ul></section>`).join("");
  return (rows.length ? isi : kosongHtml("ev.lalu.kosong")) + paginasiHtml({ hal: S.hal, total: rows.length, per: PER, satuan: "ev.pag.u" });
}
function laluHtml() {
  const { L, tahun } = baruLalu();
  const saring = `<div class="jm-saring ev-saring">${pilihHtml({ id: "fTahun", ikon: "tahun", label: t("ev.f.tahun"), opsi: [["", t("ev.f.semua_tahun")], ...tahun.map((y) => [y, y])], nilai: S.tahun })}${pilihHtml({ id: "fJenis", ikon: "jenis", label: t("ev.f.jenis"), opsi: [["", t("kal.semua")], ...JENIS_ACARA.map((j) => [j, label("kal.jenis.", j), IKON_JENIS[j]])], nilai: S.jenis })}</div>`;
  return exHtml({ id: "ev-lalu", ikon: "jejak", topik: t("ev.lalu.ey"), judulHtml: hlHtml("ev.lalu.j", angka(L.length)), subHtml: esc(t("ev.lalu.sub")), aksiHtml: saring, isiHtml: `<div id="evLaluIsi">${laluIsi()}</div>` });
}

/* ---------- 4. kemitraan dan sponsor ---------- */
const IKON_MITRA = { golf: "lokasi", sarasehan: "kajian", award: "wisuda", indoebtke: "gedung" };
const FOTO_MITRA = { golf: "bayu-sidrap", sarasehan: "hidro-saguling", award: "nuklir-menara", indoebtke: "surya-cirata" };
const LOGAM = ["diamond", "platinum", "ruby", "gold", "silver", "bronze"];
/** "Rp 3.000.000.000 (belum termasuk PPN 11%)" -> { besar: "Rp 3 M", rinci: "Rp 3.000.000.000, belum termasuk PPN 11%" } */
function hargaTeks(h) {
  const n = Number(((/Rp\s*([\d.]+)/.exec(h || "") || [])[1] || "").replaceAll(".", ""));
  const besar = !n ? h : n >= 1e9 ? t("ev.mitra.harga_m", { n: angka(n / 1e9) }) : t("ev.mitra.harga_jt", { n: angka(n / 1e6) });
  return { besar, rinci: (h || "").replace(/\s*\((.*)\)\s*$/, ", $1") };
}
const subjek = (id) => `mailto:${(MITRA.kontak || {}).surel || ""}?subject=${encodeURIComponent(t("ev.mitra.subjek") + " " + t("ev.mitra.acara." + id))}`;
function kartuPaket(p, i, id) {
  const nm = String(p.nama).toLowerCase(), lg = LOGAM.includes(nm) ? nm : "silver", h = hargaTeks(p.harga);
  return `<li class="ev-paket ev-lg-${lg}">${i === 0 ? `<span class="ev-pita-top">${esc(t("ev.mitra.lengkap"))}</span>` : ""}
    <div class="ev-paket-kep"><h4>${ikon(i < 2 ? "bintang" : "perisai", 20)}<span>${esc(p.nama)}</span></h4><p class="ev-paket-h">${esc(h.besar)}</p><small>${esc(h.rinci)}</small></div>
    <ul class="ev-paket-man">${(p.manfaat || []).map((m) => `<li>${ikon("centang", 16)}<span>${esc(m)}</span></li>`).join("")}</ul>
    <a class="jm-tbl ev-paket-btn${i === 0 ? " jm-tbl-utama" : ""}" href="${esc(subjek(id))}">${ikon("surel", 16)}<span>${esc(t("ev.mitra.ajukan"))}</span></a></li>`;
}
function panelMitra(a) {
  const ev = a.event && SEMUA.find((b) => b.slug === a.event), nama = t("ev.mitra.acara." + a.id);
  const lihat = ev ? `<a class="jm-tbl" href="${esc(urlEvent(ev))}">${ikon("kalender-bintang", 18)}<span>${esc(t("ev.mitra.lihat_acara"))}</span></a>` : "";
  const hubungi = `<a class="jm-tbl jm-tbl-utama" href="${esc(subjek(a.id))}">${ikon("surel", 18)}<span>${esc(t("ev.mitra.hubungi"))}</span></a>`;
  const prop = a.proposal_url && urlAman(a.proposal_url) ? `<a class="jm-tbl" href="${esc(a.proposal_url)}" target="_blank" rel="noopener noreferrer">${ikon("unduh", 18)}<span>${esc(t("ev.mitra.unduh"))}</span></a>` : "";
  if (!(a.paket || []).length) {
    const foto = ev && ev.poster ? esc(ev.poster.file) : `/img/beranda/${FOTO_MITRA[a.id] || "surya-cirata"}.webp`;
    return `<div class="ev-kosong-p"><img src="${foto}" alt="" loading="lazy" decoding="async"><div class="ev-kosong-isi"><span class="ev-spons-ik">${ikon(IKON_MITRA[a.id] || "bintang", 24)}</span><h3>${esc(nama)}</h3><p><b>${esc(t("ev.mitra.disusun"))}</b></p><p>${esc(t("ev.mitra.disusun_sub"))}</p><div class="ev-spons-aksi">${hubungi}${lihat}</div></div></div>`;
  }
  return `<div class="ev-mitra-kep"><h3>${esc(nama)}</h3><div class="ev-spons-aksi">${lihat}${prop}</div></div><ul class="ev-harga">${a.paket.map((p, i) => kartuPaket(p, i, a.id)).join("")}</ul>`;
}
function pilihMitra(id) {
  const a = MITRA && MITRA.acara.find((x) => x.id === id);
  if (!a) return;
  S.mitra = id;
  document.querySelectorAll("#evSeg [data-mitra]").forEach((b) => { const on = b.dataset.mitra === id; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
  nanti(() => { const p = document.getElementById("evMitraPanel"); if (p) p.innerHTML = panelMitra(a); });
}
function mitraHtml() {
  const d = MITRA;
  if (!d) return "";
  const k = d.kontak || {};
  const a = d.acara.find((x) => x.id === S.mitra) || d.acara.find((x) => (x.paket || []).length) || d.acara[0];
  S.mitra = a.id;
  const seg = `<div class="ev-seg" id="evSeg" role="tablist" aria-label="${esc(t("ev.mitra.ey"))}">${d.acara.map((x) => `<button type="button" role="tab" data-mitra="${esc(x.id)}" aria-selected="${x.id === a.id}" tabindex="${x.id === a.id ? 0 : -1}">${ikon(IKON_MITRA[x.id] || "bintang", 20)}<span>${esc(t("ev.mitra.acara." + x.id))}</span></button>`).join("")}</div>`;
  const hubungi = k.surel ? `<a class="jm-tbl jm-tbl-utama" href="mailto:${esc(k.surel)}?subject=${encodeURIComponent(t("ev.mitra.subjek"))}">${ikon("surel", 18)}<span>${esc(t("ev.mitra.hubungi"))}</span></a>` : "";
  const proposal = d.proposal_url && urlAman(d.proposal_url) ? `<a class="jm-tbl" href="${esc(d.proposal_url)}" target="_blank" rel="noopener noreferrer">${ikon("unduh", 18)}<span>${esc(t("ev.mitra.unduh"))}</span></a>` : "";
  const cp = `<aside class="ev-cp"><span class="ev-spons-ik">${ikon("orang", 22)}</span><div class="ev-cp-teks"><small>${esc(t("ev.cp"))}</small><b>${esc(k.nama || t("ev.cp.sekretariat"))}</b>${k.surel ? `<a href="mailto:${esc(k.surel)}">${esc(k.surel)}</a>` : ""}</div><div class="ev-spons-aksi">${hubungi}${proposal}</div></aside>`;
  return exHtml({ id: "ev-mitra", ikon: "bintang", topik: t("ev.mitra.ey"), judulHtml: esc(t("ev.mitra.j")), subHtml: esc(t("ev.mitra.sub")), isiHtml: `<div class="ev-mitra-bd">${seg}<div class="ev-mitra-panel" id="evMitraPanel" role="tabpanel">${panelMitra(a)}</div>${cp}</div>` });
}

function gambar() {
  AKAR().innerHTML = MODE === "lalu" ? laluHtml() : karuselHtml() + bulanHtml() + mitraHtml();
  nanti(() => { aturSlide(S.slide); pasangGeser(); mulaiOtomatis(); });
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
    else if ((b = q("[data-ics]"))) { const a = SEMUA.find((x) => x.slug === b.dataset.ics); if (a) unduhIcs(a); }
    else if ((b = q("[data-mitra]"))) pilihMitra(b.dataset.mitra);
    else if ((b = q("[data-hal]"))) {
      const n = Number(b.dataset.hal); S.hal = n; sorotHalaman(b, n);
      const u = new URL(location.href); n > 1 ? u.searchParams.set("hal", n) : u.searchParams.delete("hal"); history.replaceState(null, "", u);
      nanti(() => { document.getElementById("evLaluIsi").innerHTML = laluIsi(); document.getElementById("ev-lalu")?.scrollIntoView({ block: "start" }); });
    }
    else if ((b = q("[data-ke]"))) aturSlide(Number(b.dataset.ke));
    else if ((b = q("[data-bln]"))) { S.bulan = b.dataset.bln === "ini" ? KINI.slice(0, 7) : geserBulan(S.bulan, Number(b.dataset.bln)); nanti(() => { const ex = document.getElementById("ev-bulan"); ex.outerHTML = bulanHtml(); }); document.querySelector(".ev-bln-nama").textContent = `${namaBulan(S.bulan)} ${S.bulan.slice(0, 4)}`; }
  });
  isi.addEventListener("change", (e) => {
    if (e.target.id === "fTahun") S.tahun = e.target.value; else if (e.target.id === "fJenis") S.jenis = e.target.value; else return;
    S.hal = 1; nanti(() => { document.getElementById("evLaluIsi").innerHTML = laluIsi(); });
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
