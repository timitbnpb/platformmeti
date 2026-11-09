/* Tab Daftar mendatang dan Arsip di /kalender: agenda mendatang (karusel), bulan berjalan (kartu poster), agenda sebelumnya (daftar horizontal, filter), kemitraan dan sponsor.
   INP: kontrol (panah, bulan, filter) berubah seketika; kisi dirender ulang lewat nanti(). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml, kosongHtml, galatHtml } from "/inti/umum.js";
import { pilihHtml, exHtml } from "/inti/komponen.js";
import { hlHtml } from "/inti/aksi_ex.js";
import { muat, label, urlAman } from "/publik.js";
import { uangHtml } from "/inti/uang.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { muatAcara, mendatang, lalu, hariIni, hariKe, utc, namaBulan, geserBulan, urlEvent, urlMutlak, posterHtml, pilJenis, pilStatus, lokasiTeks, jamTeks, tglRentang, JENIS_ACARA, IKON_JENIS, pasangSalin, unduhIcs } from "/event_umum.js";

const S = { bulan: "", tahun: "", jenis: "", hal: Math.max(1, Number(new URLSearchParams(location.search).get("hal")) || 1), slide: 0, mitra: "" };
const PER = 8;
const AKAR = () => document.getElementById("isiEvent");
let MODE = "depan", AWAL = null, SEMUA = [], KINI = "", MITRA = null, WAKTU = 0;

const tglBesar = (b) => { const d = b.tanggal, rg = b.akhir > d; return `<span class="ev-tgl"><b>${rg ? `${+d.slice(8)}-${+b.akhir.slice(8)}` : +d.slice(8)}</b><span>${esc(tanggal(d).split(" ")[1])} ${esc(d.slice(0, 4))}</span><small>${esc(t("kal.hari." + hariKe(d)))}</small></span>`; };
/** Lokasi bisa diklik: membuka Google Maps pada tab baru. */
const metaLokasi = (b) => { const l = lokasiTeks(b); return l ? `<li><a class="ev-lok" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l)}" target="_blank" rel="noopener noreferrer" title="${esc(t("ev.peta_buka"))}">${ikon("lokasi", 16)}<span>${esc(l)}</span>${ikon("tautan", 14)}</a></li>` : ""; };
/** Kartu fakta: ikon, label kecil, nilai. Lokasi = tautan peta. */
const fakta = (ik, label, isiHtml) => (isiHtml ? `<li class="ev-fk"><span class="ev-fk-ik">${ikon(ik, 20)}</span><span class="ev-fk-t"><small>${esc(label)}</small>${isiHtml}</span></li>` : "");
const faktaLokasi = (b) => { const l = lokasiTeks(b); return l ? `<a class="ev-lok" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l)}" target="_blank" rel="noopener noreferrer" title="${esc(t("ev.peta_buka"))}"><span>${esc(l)}</span>${ikon("tautan", 14)}</a>` : ""; };
const faktaAcara = (b) => { const pen = (b.daftarPen || []).join(", "); return `<ul class="ev-fakta">${fakta("kalender", t("ev.fakta.tanggal"), `<b>${esc(tglRentang(b))}</b>`)}${fakta("jam", t("ev.fakta.jam"), jamTeks(b) ? `<b>${esc(jamTeks(b))}</b>` : "")}${fakta("lokasi", t("ev.fakta.lokasi"), faktaLokasi(b))}${fakta("gedung", t("ev.fakta.penyelenggara"), pen ? `<b>${esc(pen)}</b>` : "")}</ul>`; };
/** Pil hitung mundur memakai hariIni() WIB (KINI). */
function pilHitung(b) {
  const d = Math.round((utc(b.tanggal) - utc(KINI)) / 864e5);
  const k = d <= 0 ? (b.tanggal <= KINI && b.akhir >= KINI && d < 0 ? "ev.hitung.jalan" : "ev.hitung.hari") : d === 1 ? "ev.hitung.besok" : "";
  return `<span class="ev-pil ev-hitung-pil">${ikon("jam", 14)}${esc(k ? t(k) : t("ev.hitung.n", { n: angka(d) }))}</span>`;
}

/* ---------- 1. karusel mendatang ---------- */
const tglKotak = (b) => { const d = b.tanggal, rg = b.akhir > d; return `<span class="ev-tgl"><b>${rg ? `${+d.slice(8)}-${+b.akhir.slice(8)}` : +d.slice(8)}</b><span>${esc(tanggal(d).split(" ")[1])} ${esc(d.slice(0, 4))}</span></span>`; };
/** Poster utuh (contain) di atas latar blur dari poster yang sama; tanpa poster: foto teknologi. */
const posterUtuh = (b) => (b.poster ? `<img class="ev-lat" src="${esc(b.poster.file)}" alt="" aria-hidden="true" loading="lazy" decoding="async">` : "") + posterHtml(b, b.poster ? "ev-utuh" : "");
function slideHtml(b, i, n) {
  const u = esc(urlEvent(b));
  return `<article class="ev-slide" data-i="${i}" role="group" aria-roledescription="${esc(t("ev.slide"))}" aria-label="${esc(t("ev.slide_n", { n: i + 1, total: n }))}">
    <div class="ev-slide-teks"><div class="ev-slide-atas">${tglKotak(b)}<div class="ev-slide-judul"><div class="ev-pils">${pilJenis(b.jenis)}${pilHitung(b)}</div><h3 class="ev-slide-j">${esc(b.judulTampil)}</h3></div></div>${faktaAcara(b)}
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
const metaL = (ik, teks) => (teks ? `<li>${ikon(ik, 16)}<span>${esc(teks)}</span></li>` : "");
/** Tanpa poster: tanggal besar bergradien brand + ikon jenis (bukan foto stok berulang). */
const sampulLalu = (b) => (b.poster ? posterUtuh(b) : `<span class="ev-poster ev-ph ev-g-${esc(b.jenis)} ev-sampul"><b>${esc(String(+b.tanggal.slice(8)))}</b><span>${esc(tanggal(b.tanggal).split(" ")[1])} ${esc(b.tanggal.slice(0, 4))}</span>${ikon(IKON_JENIS[b.jenis] || "jenis", 22)}</span>`);
function kartuLaluHtml(b) {
  const u = esc(urlEvent(b)), lok = lokasiTeks(b);
  return `<li class="ev-lalu"><a class="ev-lalu-p" href="${u}" tabindex="-1" aria-hidden="true">${sampulLalu(b)}</a>
    <div class="ev-lalu-isi"><div class="ev-lalu-kep"><h4><a href="${u}">${esc(b.judulTampil)}</a></h4><div class="ev-lalu-aksi"><button type="button" class="ev-bulat" data-salin="${esc(urlMutlak(b))}" aria-label="${esc(t("ev.bagikan"))}" title="${esc(t("ev.bagikan"))}">${ikon("bagikan", 18)}</button><a class="ev-bulat" href="${u}" aria-label="${esc(t("ev.selengkapnya"))}" title="${esc(t("ev.selengkapnya"))}">${ikon("panah-kanan", 18)}</a></div></div>
    <ul class="ev-meta ev-meta-baris"><li>${pilStatus(b)}${pilJenis(b.jenis)}</li>${metaL("kalender", tglRentang(b))}${metaL("jam", jamTeks(b))}${lok ? metaLokasi(b) : ""}</ul>
    ${b.deskripsi ? `<p>${esc(b.deskripsi)}</p>` : ""}</div></li>`;
}
function laluIsi() {
  const { L } = baruLalu();
  const rows = L.filter((b) => (!S.tahun || b.tanggal.startsWith(S.tahun)) && (!S.jenis || b.jenis === S.jenis));
  const jml = Math.max(1, Math.ceil(rows.length / PER));
  S.hal = Math.min(Math.max(1, S.hal), jml);
  const tampil = rows.slice((S.hal - 1) * PER, S.hal * PER), g = new Map();
  for (const b of tampil) { const ym = b.tanggal.slice(0, 7); (g.get(ym) || g.set(ym, []).get(ym)).push(b); }
  const isi = [...g].map(([ym, r]) => `<section class="ev-grup"><h3><span class="ev-grup-ik">${ikon("kalender", 20)}</span><b>${esc(namaBulan(ym))} ${esc(ym.slice(0, 4))}</b><span>${esc(t("ev.grup.n", { n: angka(r.length) }))}</span></h3><ul class="ev-daftar">${r.map(kartuLaluHtml).join("")}</ul></section>`).join("");
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
const IKON_LG = { diamond: "berlian", platinum: "mahkota", ruby: "bintang", gold: "piala", silver: "medali", bronze: "lencana" };
const harga = (h) => { const n = Number(((/Rp\s*([\d.]+)/.exec(h || "") || [])[1] || "").replaceAll(".", "")); return { n, ppn: ((/\((.*)\)\s*$/.exec(h || "")) || [])[1] || "" }; };
/** Teks manfaat dari data dipilah ke baris pembanding yang sama untuk semua tingkat. */
function ciriPaket(manfaat) {
  const m = manfaat || [], cari = (re) => { for (const x of m) { const r = re.exec(x); if (r) return r; } return null; };
  const bo = cari(/Booth\s*([\d,.]+)\s*m2(?:,\s*listrik\s*([\d,.]+)\s*A)?/i), pe = cari(/Pembicara\s+(.+)/i), tv = cari(/TVC\s+(.+)/i), un = cari(/(\d+)\s+undangan/i), br = cari(/(\d+)\s+spanduk,\s*(\d+)\s+T-banner/i);
  return { m2: bo && Number(bo[1].replace(",", ".")), a: bo && bo[2], pembicara: pe && pe[1], tvc: tv && tv[1], pass: un && Number(un[1]), spanduk: br && br[1], tbanner: br && br[2], podcast: m.some((x) => /podcast/i.test(x)) };
}
const KAL_ROW = (ik, label, nilaiHtml, subHtml = "", visHtml = "") => `<li class="ev-bf"><span class="ev-bf-ik">${ikon(ik, 20)}</span><span class="ev-bf-t"><small>${esc(label)}</small>${nilaiHtml}${subHtml}</span>${visHtml}</li>`;
const angkaSatuan = (teks) => { const r = /^([\d.,]+)\s*(.*)$/.exec(teks || ""); return r ? `<b>${esc(r[1])}<span> ${esc(r[2])}</span></b>` : `<b>${esc(teks)}</b>`; };
/** Skema denah: kotak 72 m2 (tingkat tertinggi) sebagai bingkai, booth tingkat ini proporsional di dalamnya. */
const denahSvg = (m2) => { const w = Math.max(6, Math.round(40 * Math.sqrt(m2 / 72))); return `<svg class="ev-denah" viewBox="0 0 44 44" width="44" height="44" aria-hidden="true"><rect class="ev-denah-b" x="2" y="2" width="40" height="40" rx="3"/><rect class="ev-denah-i" x="${2 + (40 - w) / 2}" y="${2 + (40 - w) / 2}" width="${w}" height="${w}" rx="2"/></svg>`; };
function kartuPaket(p, i, id) {
  const nm = String(p.nama).toLowerCase(), lg = LOGAM.includes(nm) ? nm : "silver", h = harga(p.harga), c = ciriPaket(p.manfaat), nol = `<b class="ev-bf-nol">-</b>`;
  const nilaiHarga = h.n ? uangHtml("Rp", t(h.n >= 1e9 ? "ev.sp.m" : "ev.sp.jt", { n: angka(h.n >= 1e9 ? h.n / 1e9 : h.n / 1e6) }), p.harga) : esc(p.harga || "");
  const tiket = c.pass ? `<span class="ev-tiket" aria-hidden="true">${ikon("tiket", 16).repeat(Math.min(c.pass, 5))}</span>` : "";
  return `<li class="ev-paket ev-lg-${lg}${i === 0 ? " ev-sorot" : ""}">${i === 0 ? `<span class="ev-pita-top">${esc(t("ev.mitra.lengkap"))}</span>` : ""}
    <div class="ev-paket-kep"><h4><span class="ev-lg-ik">${ikon(IKON_LG[lg] || "lencana", 22)}</span><span>${esc(p.nama)}</span></h4><div class="ev-paket-h">${nilaiHarga}</div>${h.ppn ? `<small>${esc(h.ppn)}</small>` : ""}</div>
    <ul class="ev-paket-man">${KAL_ROW("denah", t("ev.sp.booth"), c.m2 ? `<b>${esc(t("ev.sp.m2", { n: angka(c.m2) }))}</b>` : nol, "", c.m2 ? denahSvg(c.m2) : "")}${KAL_ROW("petir", t("ev.sp.listrik"), c.a ? `<b>${esc(t("ev.sp.a", { n: c.a }))}</b>` : nol)}${KAL_ROW("mikrofon", t("ev.sp.pembicara"), c.pembicara ? `<b>${esc(c.pembicara)}</b>` : nol)}${KAL_ROW("putar", t("ev.sp.tvc"), c.tvc ? angkaSatuan(c.tvc) : nol)}${KAL_ROW("tiket", t("ev.sp.undangan"), c.pass ? `<b>${esc(angka(c.pass))} + ${esc(angka(c.pass))}</b>` : nol, tiket)}${KAL_ROW("bendera", t("ev.sp.branding"), c.spanduk ? `<b>${esc(t("ev.sp.spanduk", { n: c.spanduk }))}</b>` : nol, c.tbanner ? `<em>${esc(t("ev.sp.tbanner", { n: c.tbanner }))}</em>` : "")}${KAL_ROW("siaran", t("ev.sp.podcast"), c.podcast ? `<b>${esc(t("ev.sp.termasuk"))}</b>` : nol)}</ul>
    <a class="jm-tbl ev-paket-btn${i === 0 ? " jm-tbl-utama" : ""}" href="${esc(subjek(id))}">${ikon("surel", 16)}<span>${esc(t("ev.mitra.ajukan"))}</span></a></li>`;
}
const subjek = (id) => `mailto:${(MITRA.kontak || {}).surel || ""}?subject=${encodeURIComponent(t("ev.mitra.subjek") + " " + t("ev.mitra.acara." + id))}`;
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
/** Paket sponsor satu acara untuk /event/<slug> (event_detail.js); kosong bila acara tidak punya baris di event_mitra. */
export async function sponsorAcara(slug) {
  MITRA = MITRA || (await muat("event_mitra"));
  const a = MITRA.acara.find((x) => x.event === slug);
  return a ? panelMitra(a) : "";
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
  const surelA = k.surel ? `<a href="mailto:${esc(k.surel)}">${esc(k.surel)}</a>` : "";
  const cp = `<aside class="ev-cp"><span class="ev-spons-ik">${ikon("orang", 22)}</span><div class="ev-cp-teks"><small>${esc(t("ev.cp"))}</small><b>${esc(k.nama || t("ev.cp.sekretariat"))}</b>${surelA}</div><div class="ev-spons-aksi">${hubungi}${proposal}</div></aside>`;
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
