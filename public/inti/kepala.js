/* Kepala situs navy bersama + pita draf + kaki (DS §5). Dipakai semua halaman buatan layar:
   const saya = await mulaiHalaman();
   Halaman memberi <header class="top" id="kepala"></header>, opsional <div id="pita"></div> dan <footer class="jm-kaki" id="kaki"></footer>. */
import { t, angka, mulaiBahasa, gantiBahasa, bahasa } from "/i18n.js";
import { api, ikon, nanti } from "/inti/umum.js";
import { subnavHtml, diBagianInsight } from "/inti/komponen.js";

export const PITA_DRAF = false; // pemilik 7 Nov 2026: pita draf tidak ditampilkan
const STAF = ["pengurus", "kurator", "admin", "super"];

/* Satu tabel halaman. Tambah baris saat halamannya benar-benar ada (F1, F2). hak: null = semua, "masuk", "staf". */
const TAB = [
  { href: "/", kunci: "nav.beranda", ikon: "beranda", hak: null },
  { kunci: "nav.insight", ikon: "insight", hak: null, grup: [
    { href: "/insight", kunci: "nav.insight_ringkasan", ikon: "insight" }, { href: "/wilayah", kunci: "nav.wilayah", ikon: "wilayah" },
    { href: "/rantai", kunci: "nav.rantai", ikon: "rantai" }, { href: "/asean", kunci: "nav.asean", ikon: "asean" }] },
  { href: "/proyek", kunci: "nav.proyek", ikon: "proyek", hak: null },
  { href: "/regulasi", kunci: "nav.regulasi", ikon: "regulasi", hak: null },
  { href: "/berita", kunci: "nav.berita", ikon: "berita", hak: null },
  { href: "/kalender", kunci: "nav.kalender", ikon: "kalender", hak: null },
  { href: "/direktori", kunci: "nav.direktori", ikon: "direktori", hak: "masuk" },
  { href: "/tentang", kunci: "nav.tentang", ikon: "info", hak: null },
  { href: "/admin", kunci: "nav.admin", ikon: "perisai", hak: "staf" },
];

const BENDERA = {
  id: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><clipPath id="bid"><circle cx="12" cy="12" r="11"/></clipPath><g clip-path="url(#bid)"><rect width="24" height="12" fill="#E70011"/><rect y="12" width="24" height="12" fill="#fff"/></g><circle cx="12" cy="12" r="10.75" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width=".5"/></svg>',
  en: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><clipPath id="ben"><circle cx="12" cy="12" r="11"/></clipPath><g clip-path="url(#ben)"><rect width="24" height="24" fill="#012169"/><path d="M0 0l24 24M24 0L0 24" stroke="#fff" stroke-width="4"/><path d="M0 0l24 24M24 0L0 24" stroke="#C8102E" stroke-width="1.6"/><path d="M12 0v24M0 12h24" stroke="#fff" stroke-width="6"/><path d="M12 0v24M0 12h24" stroke="#C8102E" stroke-width="3.2"/></g><circle cx="12" cy="12" r="10.75" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width=".5"/></svg>' };

const boleh = (hak, s) => hak === null || (hak === "masuk" && s.masuk) || (hak === "staf" && s.masuk && STAF.includes(s.peran));

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
    ? `<button type="button" class="iconbtn jm-bulat" id="keluar" data-i18n-attr="aria-label:jm.keluar;title:jm.keluar" aria-label="${t("jm.keluar")}" title="${t("jm.keluar")}">${ikon("keluar", 20)}</button>`
    : `<a class="iconbtn jm-akun" href="/masuk?ke=${encodeURIComponent(jalur === "/masuk" ? "/" : jalur)}" data-i18n-attr="aria-label:jm.masuk;title:jm.masuk" aria-label="${t("jm.masuk")}" title="${t("jm.masuk")}">${ikon("masuk", 22)}<span class="jm-teks" data-i18n="jm.masuk">${t("jm.masuk")}</span></a>`;
  el.innerHTML = `
    <button type="button" class="iconbtn" id="burger" aria-expanded="false" aria-controls="menu" data-i18n-attr="aria-label:jm.menu;title:jm.menu" aria-label="${t("jm.menu")}" title="${t("jm.menu")}">${ikon("burger", 22)}</button>
    <a class="jm-merek" href="/"><img src="/img/logo-meti-tanda.png" width="42" height="40" alt=""><span data-i18n="jm.merek">${t("jm.merek")}</span></a>
    <nav class="tabs" id="menu" data-i18n-attr="aria-label:jm.menu" aria-label="${t("jm.menu")}">${tab}</nav>
    <div class="jm-sisi">
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
    if (tbl.classList.contains("jm-grup-tbl")) { const sub = document.getElementById(tbl.getAttribute("aria-controls")), buka = tbl.getAttribute("aria-expanded") !== "true"; tbl.setAttribute("aria-expanded", String(buka)); sub.hidden = !buka; return; }
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
      api("/api/keluar", { metode: "POST" }).catch(() => {}).finally(() => location.assign("/"));
    }
  });
}


/* ---------- kaki situs (model metiires.or.id, diperbaiki): merek + angka bersumber + sosial, empat kolom, bilah bawah ---------- */
const MI = "https://metiires.or.id";
const SVG = (d, u = 18) => `<svg viewBox="0 0 24 24" width="${u}" height="${u}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const IK = { kunci: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', surel: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>', instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5v.01"/>', atas: '<path d="M12 19V5M5 12l7-7 7 7"/>' };
const KOLOM = [
  ["jm.kaki.tentang", [["jm.kaki.siapa", `${MI}/about`], ["jm.kaki.pengurus", `${MI}/about/meettheteam`], ["jm.kaki.gabung", `${MI}/membership`], ["jm.kaki.kemitraan", `${MI}/about/partnership`]]],
  ["jm.kaki.berita", [["jm.kaki.berita_l", `${MI}/news`], ["jm.kaki.event", `${MI}/news/events`], ["jm.kaki.evoting", `${MI}/login?redirect=/news/evoting`, 1], ["jm.kaki.materi", `${MI}/login?redirect=/news/materials`, 1]]],
  ["jm.kaki.direktori", [["jm.kaki.d_proyek", "/direktori?tampil=proyek"], ["jm.kaki.d_org", "/direktori?tampil=lembaga"], ["jm.kaki.d_orang", "/direktori?tampil=pakar"], ["jm.kaki.d_reg", "/direktori?tampil=regulasi"], ["jm.kaki.d_pustaka", "/direktori?tampil=pustaka"]]],
];
const KONTAK = [
  ["jm.kaki.kantor", "Taman Sari Parama Lt. 10, Jl. K.H. Wahid Hasyim No. 84-86, Kebon Sirih, Menteng, Jakarta Pusat 10340", IK.pin, "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Taman Sari Parama, Jl. K.H. Wahid Hasyim No. 84-86, Kebon Sirih, Menteng, Jakarta Pusat 10340")],
  ["jm.kaki.rumah", "Jl. Jatinegara Barat IV No. 3A, Balimester, Jatinegara, Jakarta Timur 13310", IK.pin, "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Jl. Jatinegara Barat IV No. 3A, Balimester, Jatinegara, Jakarta Timur 13310")],
  ["jm.kaki.surel", "meti.ires@gmail.com", IK.surel, "mailto:meti.ires@gmail.com"],
  ["jm.kaki.situs", "www.meti.or.id", IK.web, "https://www.meti.or.id"],
];
function kakiHtml() {
  const kol = KOLOM.map(([jd, ls]) => `<nav class="jm-kaki-kol" aria-labelledby="${jd.replace(/\./g, "-")}"><h2 id="${jd.replace(/\./g, "-")}" data-i18n="${jd}">${t(jd)}</h2><ul>${ls.map(([k, u, kunci]) => `<li><a href="${u}"${u.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}><span data-i18n="${k}">${t(k)}</span>${kunci ? `<span class="jm-kaki-kunci" title="${t("jm.kaki.perlu_masuk")}" data-i18n-attr="title:jm.kaki.perlu_masuk">${SVG(IK.kunci, 13)}<span class="sr" data-i18n="jm.kaki.perlu_masuk">${t("jm.kaki.perlu_masuk")}</span></span>` : ""}</a></li>`).join("")}</ul></nav>`).join("");
  const kontak = KONTAK.map(([k, v, ik, u]) => `<li><span class="jm-kaki-ik">${SVG(ik, 16)}</span><span><small data-i18n="${k}">${t(k)}</small><a href="${u}"${u.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}>${v}</a></span></li>`).join("");
  return `<div class="jm-kaki-isi jm-wadah">
    <div class="jm-kaki-k1"><div class="jm-kaki-merek"><span class="jm-kaki-logo"><img src="/img/logo-meti-tanda.png" width="40" height="38" alt=""></span><div><strong>METI</strong><span data-i18n="jm.kaki_org_pendek">${t("jm.kaki_org_pendek")}</span></div></div>
      <ul class="jm-kaki-stat" id="kakiStat"><li title="${t("jm.kaki.sumber_berdiri")}" data-i18n-attr="title:jm.kaki.sumber_berdiri"><b>1999</b><span data-i18n="jm.kaki.berdiri">${t("jm.kaki.berdiri")}</span></li></ul>
      <div class="jm-kaki-sos"><a href="https://www.linkedin.com/in/meti-ires-b06066a1/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn METI">${SVG(IK.linkedin, 20)}</a><a href="https://www.instagram.com/metiires/" target="_blank" rel="noopener noreferrer" aria-label="Instagram METI">${SVG(IK.instagram, 20)}</a></div></div>
    ${kol}
  </div>
  <div class="jm-kaki-kontak jm-wadah">
    <nav class="jm-kaki-kol jm-kaki-hub" aria-labelledby="jm-kaki-hubungi"><h2 id="jm-kaki-hubungi" data-i18n="jm.kaki.hubungi">${t("jm.kaki.hubungi")}</h2><ul>${kontak}</ul></nav>
  </div>
  <div class="jm-kaki-bawah jm-wadah"><p>&copy; 2026 METI</p><a href="${MI}/policy/membership" target="_blank" rel="noopener noreferrer" data-i18n="jm.kaki.kebijakan">${t("jm.kaki.kebijakan")}</a>
    <button type="button" class="jm-kaki-atas" id="kakiAtas" aria-label="${t("jm.kaki.atas")}" title="${t("jm.kaki.atas")}" data-i18n-attr="aria-label:jm.kaki.atas;title:jm.kaki.atas">${SVG(IK.atas, 16)}</button></div>`;
}
/* angka kaki: hanya yang bersumber; ringkas.json (lapis sesuai peran) bila sudah masuk; title = sumber dan tanggal bangun */
async function kakiIsi(kaki, saya) {
  kaki.querySelector("#kakiAtas")?.addEventListener("click", () => scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
  if (!saya?.masuk) return;
  try {
    const r = await api("/api/direktori/potret/ringkas"), h = r?.hitung || {}, ul = kaki.querySelector("#kakiStat"), sumber = (n) => t("jm.kaki.sumber_potret").replace("{tanggal}", r.dibangun_pada || "-").replace("{lapis}", r.lapis || "");
    const tambah = (n, kunci) => { if (Number.isFinite(n)) ul.insertAdjacentHTML("beforeend", `<li title="${sumber(n)}"><b>${angka(n)}</b><span data-i18n="${kunci}">${t(kunci)}</span></li>`); };
    tambah(h.proyek, "jm.kaki.proyek"); tambah(h.organisasi, "jm.kaki.organisasi");
  } catch (e) { /* tanpa potret: angka disembunyikan, bukan ditebak */ }
}

export async function mulaiHalaman() {
  const saya = await ambilSaya();
  await mulaiBahasa(saya.bahasa);
  const kepala = document.getElementById("kepala");
  if (kepala) { gambarKepala(kepala, saya); pasangPenangan(kepala, saya); }
  if (kepala && diBagianInsight(location.pathname) && !document.getElementById("subnav")) { kepala.insertAdjacentHTML("afterend", subnavHtml(location.pathname, location.hash)); addEventListener("hashchange", () => { const s = document.getElementById("subnav"); if (s) s.outerHTML = subnavHtml(location.pathname, location.hash); }); }
  const pita = document.getElementById("pita");
  if (pita && PITA_DRAF) {
    pita.className = "jm-pita";
    pita.setAttribute("role", "note");
    pita.innerHTML = `${ikon("info", 18)}<span data-i18n="jm.pita">${t("jm.pita")}</span>`;
  }
  const kaki = document.getElementById("kaki");
  if (kaki) { kaki.innerHTML = kakiHtml(); kakiIsi(kaki, saya); }
  return saya;
}
