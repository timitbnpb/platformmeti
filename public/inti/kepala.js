/* Kepala situs navy bersama + pita draf + kaki (DS §5). Dipakai semua halaman buatan layar:
   const saya = await mulaiHalaman();
   Halaman memberi <header class="top" id="kepala"></header>, opsional <div id="pita"></div> dan <footer class="jm-kaki" id="kaki"></footer>. */
import { t, angka, mulaiBahasa, gantiBahasa, bahasa } from "/i18n.js";
import { api, ikon, nanti } from "/inti/umum.js";
import { subnavHtml, diBagianInsight } from "/inti/komponen.js";
import { pasangRel } from "/inti/rel.js";
import { pasangPilih } from "/inti/pilih.js";
import { pasangCari } from "/inti/cari_global.js";
import { pasangBukti } from "/inti/bukti.js";
import { catatHalaman } from "/inti/statistik.js";
import { sosmedHtml } from "/inti/sosmed.js";
import { teksLencana } from "/inti/pesan_umum.js";
import { akunMenuHtml, pasangAkunMenu } from "/inti/akun_menu.js";
import "/inti/mata_sandi.js";
import "/inti/galat_gambar.js";
import "/inti/sejajar.js";
import "/inti/istilah.js";

export const PITA_DRAF = false; // pemilik 7 Nov 2026: pita draf tidak ditampilkan
const STAF = ["pengurus", "kurator", "admin", "super"];

/* Satu tabel halaman. Tambah baris saat halamannya benar-benar ada (F1, F2). hak: null = semua, "masuk", "staf". */
const TAB = [
  /* Navigasi 7 menu (pemilik 8 Nov 2026, desain disetujui): Beranda, Tentang METI, EBT Indonesia, Bidang, Kewilayahan, Pustaka, Media. Ikon unik di seluruh nav (gerbang-ikon-nav). */
  { href: "/", kunci: "nav.beranda", ikon: "beranda", hak: null },
  { kunci: "n7.tentang", ikon: "perisai", hak: null, grup: [
    { href: "/tentang", kunci: "n7.profil", ikon: "info" }, { href: "/meti-wilayah", kunci: "nav.meti_wilayah", ikon: "lokasi" }, { href: "/kalender", kunci: "n7.agenda", ikon: "kalender" }, { href: "/galeri", kunci: "nav.foto", ikon: "gambar" }, { href: "/siaran-pers", kunci: "n7.meti_berita", ikon: "mikrofon" }] },
  { kunci: "n7.ebt", ikon: "insight", hak: null, grup: [
    { href: "/insight", kunci: "n7.gambaran", ikon: "kajian" }, { href: "/teknologi", kunci: "n7.teknologi", ikon: "tek-bio" }, { href: "/sistem", kunci: "sp2.nav", ikon: "sistem-listrik" }, { href: "/jaringan", kunci: "jr.nav", ikon: "menara" }, { href: "/target", kunci: "n7.target", ikon: "bendera" }, { href: "/energi-baru", kunci: "enb.nav", ikon: "energi-baru" }, { href: "/program", kunci: "n7.program_psn", ikon: "bintang" }, { href: "/industri", kunci: "in3.nav", ikon: "industri" }, { href: "/baterai-ev", kunci: "bev.nav", ikon: "baterai" }, { href: "/bioenergi", kunci: "bn.nav", ikon: "bioenergi" }, { href: "/lelang", kunci: "lel.nav", ikon: "lelang" }] },
  { kunci: "n7.bidang", ikon: "direktori", hak: null, grup: [
    { href: "/bidang/organisasi", kunci: "bid.n.organisasi", ikon: "gedung" }, { href: "/bidang/advokasi", kunci: "bid.n.advokasi", ikon: "parlemen" }, { href: "/bidang/sdm", kunci: "bid.n.sdm", ikon: "akademi" }, { href: "/bidang/pendanaan", kunci: "bid.n.pendanaan", ikon: "kartu" }, { href: "/bidang/umkm", kunci: "bid.n.umkm", ikon: "tag" }, { href: "/bidang/esg", kunci: "bid.n.esg", ikon: "karbon" }, { href: "/bidang/komunikasi", kunci: "bid.n.komunikasi", ikon: "presentasi" }, { href: "/bidang/internasional", kunci: "bid.n.internasional", ikon: "asean" }, { href: "/bidang/data", kunci: "bid.n.data", ikon: "tabel" }] },
  { kunci: "n7.wilayah", ikon: "wilayah", hak: null, grup: [
    { href: "/peta", kunci: "nav.peta_nasional", ikon: "globe" }, { href: "/wilayah", kunci: "nav.wilayah_peta", ikon: "peta" }, { href: "/proyek", kunci: "nav.proyek", ikon: "proyek" }, { href: "/kawasan", kunci: "kw2.nav", ikon: "kawasan" }, { href: "/cek-lokasi", kunci: "cl.nav", ikon: "sasaran" }] },
  { kunci: "nav.pustaka", ikon: "buku", hak: null, grup: [
    { href: "/pustaka", kunci: "nav.dokumen", ikon: "pdf" }, { href: "/direktori?tampil=riset", kunci: "nav.d_riset", ikon: "wisuda" }, { href: "/direktori?tampil=inovasi", kunci: "nav.d_inovasi", ikon: "tek-surya" }, { href: "/topik", kunci: "nav.topik", ikon: "topik" }, { href: "/regulasi", kunci: "nav.regulasi", ikon: "regulasi" }, { href: "/hukum", kunci: "nav.hukum", ikon: "palu" }, { href: "/sejarah", kunci: "sjr.nav", ikon: "linimasa" }, { href: "/panduan", kunci: "pdu.nav", ikon: "daftar2" }] },
  // Media = kabar EBT umum (/berita); siaran pers dan liputan METI ada di Tentang METI (pemilik 8 Nov 2026)
  { href: "/berita", kunci: "nav.media", ikon: "kamera", hak: null },
];

const BENDERA = {
  id: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><clipPath id="bid"><circle cx="12" cy="12" r="11"/></clipPath><g clip-path="url(#bid)"><rect width="24" height="12" fill="#E70011"/><rect y="12" width="24" height="12" fill="#fff"/></g><circle cx="12" cy="12" r="10.75" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width=".5"/></svg>',
  en: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><clipPath id="ben"><circle cx="12" cy="12" r="11"/></clipPath><g clip-path="url(#ben)"><rect width="24" height="24" fill="#012169"/><path d="M0 0l24 24M24 0L0 24" stroke="#fff" stroke-width="4"/><path d="M0 0l24 24M24 0L0 24" stroke="#C8102E" stroke-width="1.6"/><path d="M12 0v24M0 12h24" stroke="#fff" stroke-width="6"/><path d="M12 0v24M0 12h24" stroke="#C8102E" stroke-width="3.2"/></g><circle cx="12" cy="12" r="10.75" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width=".5"/></svg>' };

const boleh = (hak, s) => hak === null || (hak === "masuk" && s.masuk) || (hak === "staf" && s.masuk && STAF.includes(s.peran)) || (hak === "admin" && s.masuk && ["admin", "super"].includes(s.peran));

async function ambilSaya() {
  try { return await api("/api/saya"); } catch (e) { return { masuk: false, galat: true }; }
}

const temaEfektif = () => document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function gambarKepala(el, saya) {
  const jalur = location.pathname;
  const cocok = (h) => (h === "/" ? jalur === "/" || jalur === "/index.html" : jalur === h || jalur.startsWith(h + "/"));
  const tab = TAB.filter((x) => boleh(x.hak, saya)).map((x) => {
    if (x.grup) {
      const aktif = x.grup.some((g) => cocok(g.href)), id = "grup-" + x.kunci.replace(/\./g, "-");
      return `<div class="jm-grup"><button type="button" class="jm-grup-tbl" aria-expanded="false" aria-controls="${id}"${aktif ? ' aria-current="page"' : ""}>${ikon(x.ikon, 18)}<span data-i18n="${x.kunci}">${t(x.kunci)}</span><svg class="jm-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="jm-sub" id="${id}" hidden>${x.grup.map((g) => `<a href="${g.href}"${cocok(g.href) ? ' aria-current="page"' : ""}>${ikon(g.ikon, 18)}<span data-i18n="${g.kunci}">${t(g.kunci)}</span></a>`).join("")}</div></div>`;
    }
    return `<a href="${x.href}" data-kunci="${x.kunci}" title="${t(x.kunci)}"${cocok(x.href) ? ' aria-current="page"' : ""}>${ikon(x.ikon, 18)}<span data-i18n="${x.kunci}">${t(x.kunci)}</span></a>`;
  }).join("");
  const b = bahasa();
  const akun = saya.masuk
    ? akunMenuHtml(saya)
    : `<a class="iconbtn jm-akun" href="/masuk?ke=${encodeURIComponent(jalur === "/masuk" ? "/" : jalur)}" data-i18n-attr="aria-label:jm.masuk;title:jm.masuk" aria-label="${t("jm.masuk")}" title="${t("jm.masuk")}">${ikon("masuk", 22)}<span class="jm-teks" data-i18n="jm.masuk">${t("jm.masuk")}</span></a>`;
  el.innerHTML = `
    <button type="button" class="iconbtn" id="burger" aria-expanded="false" aria-controls="menu" data-i18n-attr="aria-label:jm.menu;title:jm.menu" aria-label="${t("jm.menu")}" title="${t("jm.menu")}">${ikon("burger", 22)}</button>
    <a class="jm-merek" href="/"><img src="/img/logo-meti-tanda.png" width="42" height="40" alt=""><span data-i18n="jm.merek">${t("jm.merek")}</span></a>
    <nav class="tabs" id="menu" data-i18n-attr="aria-label:jm.menu" aria-label="${t("jm.menu")}">${tab}</nav>
    <div class="jm-sisi">
      <button type="button" class="iconbtn jm-bulat jm-cari-kotak" id="cari" aria-haspopup="dialog" data-i18n-attr="aria-label:cari.tombol;title:cari.tombol" aria-label="${t("cari.tombol")}" title="${t("cari.tombol")}">${ikon("cari", 20)}<span class="jm-cari-kotak-t" data-i18n="cari.kotak">${t("cari.kotak")}</span><span class="jm-cari-kotak-k" aria-hidden="true"><kbd>${/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || "") ? "⌘" : "Ctrl"}</kbd><kbd>K</kbd></span></button>
      <button type="button" class="iconbtn jm-bulat jm-bahasa" id="bahasa" data-i18n-attr="aria-label:jm.ganti_bahasa;title:jm.ganti_bahasa" aria-label="${t("jm.ganti_bahasa")}" title="${t("jm.ganti_bahasa")}">${BENDERA[b]}</button>
      <button type="button" class="iconbtn jm-bulat" id="tema" data-i18n-attr="aria-label:jm.tema;title:jm.tema" aria-label="${t("jm.tema")}" title="${t("jm.tema")}">${ikon("tema", 20)}</button>
      ${akun}
    </div>`;
}

function pasangPenangan(el, saya) {
  const tutupGrup = () => el.querySelectorAll(".jm-grup-tbl[aria-expanded=true]").forEach((b) => { b.setAttribute("aria-expanded", "false"); document.getElementById(b.getAttribute("aria-controls")).hidden = true; });
  document.addEventListener("click", (e) => { if (!e.target.closest(".jm-grup")) tutupGrup(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") tutupGrup(); });
  el.addEventListener("click", (e) => {
    const tbl = e.target.closest("button");
    if (!tbl) return;
    if (tbl.classList.contains("jm-grup-tbl")) { const sub = document.getElementById(tbl.getAttribute("aria-controls")), buka = tbl.getAttribute("aria-expanded") !== "true"; tutupGrup(); tbl.setAttribute("aria-expanded", String(buka)); sub.hidden = !buka; return; }   // satu menu terbuka sekaligus (pemilik 8 Nov 2026)
    if (tbl.id === "burger") {
      const buka = tbl.getAttribute("aria-expanded") !== "true";
      tbl.setAttribute("aria-expanded", String(buka));
      el.querySelector("#menu").classList.toggle("buka", buka);
    } else if (tbl.id === "bahasa") {
      // chrome urgent: bendera berganti seketika; kamus dan render menyusul sesudah satu bingkai tercat
      const baru = bahasa() === "id" ? "en" : "id";
      tbl.innerHTML = BENDERA[baru];
      nanti(() => gantiBahasa(baru, { masuk: saya.masuk }));
    } else if (tbl.id === "tema") {
      const baru = temaEfektif() === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = baru;
      try { localStorage.setItem("jm-tema", baru); } catch (err) {}
    } else if (tbl.id === "keluar") {
      tbl.setAttribute("aria-busy", "true");
      /* langsung ke /masuk dan GANTI riwayat: tombol Back tidak bisa membuka lagi halaman privat dari cache (pemilik 9 Nov 2026) */
      api("/api/keluar", { metode: "POST" }).catch(() => {}).finally(() => location.replace("/masuk?keluar=1"));
    }
  });
}


/* ---------- kaki situs (model metiires.or.id, diperbaiki): merek + angka bersumber + sosial, empat kolom, bilah bawah ---------- */
const MI = "https://metiires.or.id";
const SVG = (d, u = 18) => `<svg viewBox="0 0 24 24" width="${u}" height="${u}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const IK = { kunci: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', surel: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>', instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5v.01"/>', atas: '<path d="M12 19V5M5 12l7-7 7 7"/>' };
/* ikon tiap tautan kaki (pemilik 8 Nov 2026: "kasih icon semua") */
const IK_KAKI = { "jm.kaki.siapa": "info", "jm.kaki.pengurus": "orang", "jm.kaki.gabung": "tambah", "jm.kaki.kemitraan": "tautan", "jm.kaki.berita_l": "berita", "jm.kaki.event": "kalender-bintang", "jm.kaki.evoting": "centang", "jm.kaki.materi": "pdf", "jm.kaki.d_proyek": "proyek", "jm.kaki.d_org": "gedung", "jm.kaki.d_orang": "direktori", "jm.kaki.d_reg": "regulasi", "jm.kaki.d_pustaka": "buku" };
const KOLOM = [
  ["jm.kaki.tentang", [["jm.kaki.siapa", `${MI}/about`], ["jm.kaki.pengurus", `${MI}/about/meettheteam`], ["jm.kaki.gabung", `${MI}/membership`], ["jm.kaki.kemitraan", `${MI}/about/partnership`]]],
  ["jm.kaki.berita", [["jm.kaki.berita_l", `${MI}/news`], ["jm.kaki.event", `${MI}/news/events`], ["jm.kaki.evoting", `${MI}/login?redirect=/news/evoting`, 1], ["jm.kaki.materi", `${MI}/login?redirect=/news/materials`, 1]]],
  ["jm.kaki.direktori", [["jm.kaki.d_proyek", "/proyek"], ["jm.kaki.d_org", "/direktori?tampil=lembaga"], ["jm.kaki.d_orang", "/direktori?tampil=pakar"], ["jm.kaki.d_reg", "/regulasi"], ["jm.kaki.d_pustaka", "/pustaka"]]],
];
const KONTAK = [
  ["jm.kaki.kantor", "Taman Sari Parama Lt. 10, Jl. K.H. Wahid Hasyim No. 84-86, Kebon Sirih, Menteng, Jakarta Pusat 10340", IK.pin, "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Taman Sari Parama, Jl. K.H. Wahid Hasyim No. 84-86, Kebon Sirih, Menteng, Jakarta Pusat 10340")],
  ["jm.kaki.surel", "meti.ires@gmail.com", IK.surel, "mailto:meti.ires@gmail.com"],
  ["jm.kaki.situs", "www.meti.or.id", IK.web, "https://www.meti.or.id"],
];
function kakiHtml() {
  const kol = KOLOM.map(([jd, ls]) => `<nav class="jm-kaki-kol" aria-labelledby="${jd.replace(/\./g, "-")}"><h2 id="${jd.replace(/\./g, "-")}" data-i18n="${jd}">${t(jd)}</h2><ul>${ls.map(([k, u, kunci]) => `<li><a href="${u}"${u.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}>${IK_KAKI[k] ? ikon(IK_KAKI[k], 16) : ""}<span data-i18n="${k}">${t(k)}</span>${kunci ? `<span class="jm-kaki-kunci" title="${t("jm.kaki.perlu_masuk")}" data-i18n-attr="title:jm.kaki.perlu_masuk">${SVG(IK.kunci, 13)}<span class="sr" data-i18n="jm.kaki.perlu_masuk">${t("jm.kaki.perlu_masuk")}</span></span>` : ""}</a></li>`).join("")}</ul></nav>`).join("");
  const kontak = KONTAK.map(([k, v, ik, u]) => `<li><span class="jm-kaki-ik">${SVG(ik, 16)}</span><span><small data-i18n="${k}">${t(k)}</small><a href="${u}"${u.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}>${v}</a></span></li>`).join("");
  return `<div class="jm-kaki-isi jm-wadah">
    <div class="jm-kaki-k1"><div class="jm-kaki-merek"><span class="jm-kaki-logo"><img src="/img/logo-meti-tanda.png" width="40" height="38" alt=""></span><div><strong>METI</strong><span data-i18n="jm.kaki_org_pendek">${t("jm.kaki_org_pendek")}</span></div></div>
      <ul class="jm-kaki-stat" id="kakiStat"><li title="${t("jm.kaki.sumber_berdiri")}" data-i18n-attr="title:jm.kaki.sumber_berdiri"><i>${ikon("kalender", 18)}</i><b>1999</b><span data-i18n="jm.kaki.berdiri">${t("jm.kaki.berdiri")}</span></li></ul></div>
    ${kol}
  </div>
  <div class="jm-kaki-kontak jm-wadah">
    <nav class="jm-kaki-kol jm-kaki-hub" aria-labelledby="jm-kaki-hubungi"><h2 id="jm-kaki-hubungi" data-i18n="jm.kaki.hubungi">${t("jm.kaki.hubungi")}</h2><ul>${kontak}<li class="jm-kaki-lgli"><a class="jm-tbl jm-kaki-lg" href="/langganan">${SVG(IK.surel, 16)}<span data-i18n="jm.kaki.langganan">${t("jm.kaki.langganan")}</span></a><div class="jm-kaki-sos">${sosmedHtml()}</div></li></ul></nav>
  </div>
  <div class="jm-kaki-bawah jm-wadah"><p>&copy; 2026 METI</p><a href="${MI}/policy/membership" target="_blank" rel="noopener noreferrer" data-i18n="jm.kaki.kebijakan">${t("jm.kaki.kebijakan")}</a>
    <button type="button" class="jm-kaki-atas" id="kakiAtas" aria-label="${t("jm.kaki.atas")}" title="${t("jm.kaki.atas")}" data-i18n-attr="aria-label:jm.kaki.atas;title:jm.kaki.atas">${SVG(IK.atas, 16)}</button></div>`;
}
/* angka kaki: hanya yang bersumber; ringkas.json (lapis sesuai peran) bila sudah masuk; title = sumber dan tanggal bangun */
async function kakiIsi(kaki, saya) {
  kaki.querySelector("#kakiAtas")?.addEventListener("click", () => scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
  if (!saya?.masuk) return;
  try {
    /* angka milik METI sendiri (pemilik 8 Nov 2026): anggota, METI Wilayah berdiri, pengurus. Bukan proyek/organisasi ekosistem. */
    const ul = kaki.querySelector("#kakiStat"), ambil = (u) => fetch(u).then((x) => (x.ok ? x.json() : null)).catch(() => null);
    const [mw, pg] = await Promise.all([ambil("/data/meti-wilayah.json"), ambil("/data/pengurus-meti.json")]);
    const tambah = (n, kunci, ik, judul) => { if (Number.isFinite(n) && n > 0) ul.insertAdjacentHTML("beforeend", `<li title="${judul || ""}"><i>${ikon(ik, 18)}</i><b>${angka(n)}</b><span data-i18n="${kunci}">${t(kunci)}</span></li>`); };
    if (mw) {
      const anggota = (mw.provinsi || []).reduce((u, x) => u + (x.individu || 0) + (x.organisasi || 0), 0);
      const terbaru = [...(mw.versi_angka || [])].sort((x, y) => (y.tanggal || "").localeCompare(x.tanggal || ""))[0];
      tambah(anggota, "jm.kaki.anggota", "orang", mw.anggota_sumber?.label);
      tambah(terbaru?.berdiri, "jm.kaki.wilayah", "lokasi", terbaru?.sumber);
    }
    if (pg) tambah(new Set([...Object.values(pg.unit || {}).flat(), ...(pg.bidang || []).flatMap((b) => b.anggota || [])].filter((o) => o?.nama).map((o) => o.nama)).size, "jm.kaki.pengurus_n", "direktori");
  } catch (e) { /* tanpa potret: angka disembunyikan, bukan ditebak */ }
}

/* lencana pesan belum dibaca di ikon Admin (navbar); diperbarui oleh tab Pesan lewat peristiwa "pesan-belum" */
function lencanaAdmin(kepala, saya) {
  const a = kepala?.querySelector('a[href="/admin"]');
  if (!a || !boleh("admin", saya)) return;
  const tanda = (n) => { a.querySelector(".ps-lencana")?.remove(); if (n > 0) a.insertAdjacentHTML("beforeend", `<span class="ps-lencana ps-lencana-nav">${teksLencana(n)}</span>`); };
  document.addEventListener("pesan-belum", (e) => tanda(e.detail));
  api("/api/admin/pesan-belum").then((d) => tanda(d.belum || 0)).catch(() => {});
}

/* halaman yang dipulihkan dari cache riwayat (bfcache, mis. tombol Back sesudah keluar) bisa menampilkan keadaan masuk yang sudah basi:
   periksa ulang sesi, dan bila sudah keluar alihkan ke /masuk. */
if (typeof window !== "undefined" && !window.__jmPageshow) {
  window.__jmPageshow = true;
  addEventListener("pageshow", (e) => {
    if (!e.persisted || /^\/(masuk|aktivasi|ganti-sandi|daftar|berhenti|langganan|kta\/v\/)/.test(location.pathname)) return;
    fetch("/api/saya", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()).then((s) => {
      if (s && s.masuk === false) location.replace("/masuk?ke=" + encodeURIComponent(location.pathname + location.search));
    }).catch(() => {});
  });
}
export async function mulaiHalaman() {
  const saya = await ambilSaya();
  await mulaiBahasa(saya.bahasa);
  const kepala = document.getElementById("kepala");
  /* halaman akun (masuk, aktivasi, ganti sandi) dan tamu: tanpa menu dan kaki, fokus ke formulir */
  const fokusAkun = /^\/(masuk|aktivasi|ganti-sandi|berhenti|kta\/v\/)/.test(location.pathname) || (saya?.masuk === false && !saya?.galat && !/^\/langganan/.test(location.pathname));
  if (fokusAkun) {
    document.documentElement.classList.add("jm-fokus-akun");
    kepala?.remove(); document.getElementById("kaki")?.remove(); document.getElementById("pita")?.remove(); document.getElementById("subnav")?.remove();
    return saya;
  }
  if (kepala) { gambarKepala(kepala, saya); pasangPenangan(kepala, saya); pasangCari(kepala); if (saya.masuk) pasangAkunMenu(kepala, saya); }
  pasangBukti();
  if (kepala && diBagianInsight(location.pathname) && !document.getElementById("subnav")) { kepala.insertAdjacentHTML("afterend", subnavHtml(location.pathname, location.hash)); addEventListener("hashchange", () => { const s = document.getElementById("subnav"); if (s) s.outerHTML = subnavHtml(location.pathname, location.hash); }); }
  const pita = document.getElementById("pita");
  if (pita && PITA_DRAF) {
    pita.className = "jm-pita";
    pita.setAttribute("role", "note");
    pita.innerHTML = `${ikon("info", 18)}<span data-i18n="jm.pita">${t("jm.pita")}</span>`;
  }
  const kaki = document.getElementById("kaki");
  if (kaki) { kaki.innerHTML = kakiHtml(); kakiIsi(kaki, saya); }
  pasangRel();
  if (saya.masuk) { import("/pesan.js").then((m) => m.pasangPesan()).catch(() => {}); lencanaAdmin(kepala, saya); } // /pesan.js terkunci bagi tamu: impor dinamis hanya sesudah masuk
  pasangPilih();
  catatHalaman();
  if (document.querySelector(".jm-kh[data-kh-tautan]")) import("/inti/kh.js").then((m) => m.khTautanOtomatis()).catch(() => {});
  return saya;
}
