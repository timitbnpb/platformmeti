/* Kepala situs navy bersama + pita draf + kaki (DS §5). Dipakai semua halaman buatan layar:
   const saya = await mulaiHalaman();
   Halaman memberi <header class="top" id="kepala"></header>, opsional <div id="pita"></div> dan <footer class="jm-kaki" id="kaki"></footer>. */
import { t, mulaiBahasa, gantiBahasa, bahasa } from "/i18n.js";
import { api, ikon, nanti } from "/inti/umum.js";

export const PITA_DRAF = true; // false bila C-01 dijawab "resmi"
const STAF = ["kurator", "admin", "super"];

/* Satu tabel halaman. Tambah baris saat halamannya benar-benar ada (F1, F2). hak: null = semua, "masuk", "staf". */
const TAB = [
  { href: "/", kunci: "nav.beranda", ikon: "beranda", hak: null },
  { href: "/direktori", kunci: "nav.direktori", ikon: "daftar", hak: "masuk" },
  { href: "/admin", kunci: "nav.admin", ikon: "kunci", hak: "staf" },
];

const boleh = (hak, s) => hak === null || (hak === "masuk" && s.masuk) || (hak === "staf" && s.masuk && STAF.includes(s.peran));

async function ambilSaya() {
  try { return await api("/api/saya"); } catch (e) { return { masuk: false, galat: true }; }
}

const temaEfektif = () => document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function gambarKepala(el, saya) {
  const jalur = location.pathname;
  const tab = TAB.filter((x) => boleh(x.hak, saya)).map((x) => {
    const aktif = x.href === "/" ? jalur === "/" || jalur === "/index.html" : jalur === x.href || jalur.startsWith(x.href + "/");
    return `<a href="${x.href}"${aktif ? ' aria-current="page"' : ""}>${ikon(x.ikon, 18)}<span data-i18n="${x.kunci}">${t(x.kunci)}</span></a>`;
  }).join("");
  const b = bahasa();
  const akun = saya.masuk
    ? `<button type="button" class="iconbtn jm-akun" id="keluar" data-i18n-attr="aria-label:jm.keluar;title:jm.keluar" aria-label="${t("jm.keluar")}" title="${t("jm.keluar")}">${ikon("keluar", 22)}<span class="jm-teks" data-i18n="jm.keluar">${t("jm.keluar")}</span></button>`
    : `<a class="iconbtn jm-akun" href="/masuk?ke=${encodeURIComponent(jalur === "/masuk" ? "/" : jalur)}" data-i18n-attr="aria-label:jm.masuk;title:jm.masuk" aria-label="${t("jm.masuk")}" title="${t("jm.masuk")}">${ikon("masuk", 22)}<span class="jm-teks" data-i18n="jm.masuk">${t("jm.masuk")}</span></a>`;
  el.innerHTML = `
    <button type="button" class="iconbtn" id="burger" aria-expanded="false" aria-controls="menu" data-i18n-attr="aria-label:jm.menu;title:jm.menu" aria-label="${t("jm.menu")}" title="${t("jm.menu")}">${ikon("burger", 22)}</button>
    <a class="jm-merek" href="/"><img src="/img/logo-meti.svg" width="40" height="40" alt=""><span data-i18n="jm.merek">${t("jm.merek")}</span></a>
    <nav class="tabs" id="menu" data-i18n-attr="aria-label:jm.menu" aria-label="${t("jm.menu")}">${tab}</nav>
    <div class="jm-sisi">
      <div class="jm-bahasa" role="group" data-i18n-attr="aria-label:jm.bahasa" aria-label="${t("jm.bahasa")}">
        <button type="button" data-b="id" aria-pressed="${b === "id"}">ID</button>
        <button type="button" data-b="en" aria-pressed="${b === "en"}">EN</button>
      </div>
      <button type="button" class="iconbtn" id="tema" data-i18n-attr="aria-label:jm.tema;title:jm.tema" aria-label="${t("jm.tema")}" title="${t("jm.tema")}">${ikon("tema", 22)}</button>
      ${akun}
    </div>`;
}

function pasangPenangan(el, saya) {
  el.addEventListener("click", (e) => {
    const tbl = e.target.closest("button");
    if (!tbl) return;
    if (tbl.id === "burger") {
      const buka = tbl.getAttribute("aria-expanded") !== "true";
      tbl.setAttribute("aria-expanded", String(buka));
      el.querySelector("#menu").classList.toggle("buka", buka);
    } else if (tbl.dataset.b) {
      // chrome urgent: tombol aktif berganti seketika; kamus dan render menyusul sesudah satu bingkai tercat
      for (const x of el.querySelectorAll(".jm-bahasa button")) x.setAttribute("aria-pressed", String(x === tbl));
      nanti(() => gantiBahasa(tbl.dataset.b, { masuk: saya.masuk }));
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

export async function mulaiHalaman() {
  const saya = await ambilSaya();
  await mulaiBahasa(saya.bahasa);
  const kepala = document.getElementById("kepala");
  if (kepala) { gambarKepala(kepala, saya); pasangPenangan(kepala, saya); }
  const pita = document.getElementById("pita");
  if (pita && PITA_DRAF) {
    pita.className = "jm-pita";
    pita.setAttribute("role", "note");
    pita.innerHTML = `${ikon("info", 18)}<span data-i18n="jm.pita">${t("jm.pita")}</span>`;
  }
  const kaki = document.getElementById("kaki");
  if (kaki) kaki.innerHTML = `<img src="/img/logo-meti.svg" width="32" height="32" alt=""><span data-i18n="jm.kaki">${t("jm.kaki")}</span>`;
  return saya;
}
