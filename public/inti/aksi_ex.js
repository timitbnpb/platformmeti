/* Ikon aksi kepala seksi (.jm-ex): Bagikan, PNG, PDF, CSV. Satu pendengar klik pada document (pola sumber di komponen.js).
   Dipakai: aksiHtml({ csv: true, png: true, pdf: true, bagi: true }) di dalam aksiHtml milik exHtml(); seksi = .jm-ex terdekat (id = jangkar tautan).
   PNG: salinan seksi dibungkus SVG foreignObject lalu digambar ke kanvas (dari insight_bagi.js). PDF: window.print() dengan seluruh sisa halaman disembunyikan. */
import { t, tanggal } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";

const TOMBOL = { bagi: "bagikan", png: "gambar", pdf: "pdf", csv: "csv" };
export const aksiHtml = ({ csv = false, png = true, pdf = true, bagi = true } = {}) =>
  `<span class="jm-aksi" role="group" aria-label="${esc(t("aksi.grup"))}">${[["bagi", bagi], ["png", png], ["pdf", pdf], ["csv", csv]].filter((x) => x[1])
    .map(([k]) => `<button type="button" class="jm-aksi-b" data-jm-aksi="${k}" aria-label="${esc(t("aksi." + k))}" title="${esc(t("aksi." + k))}"${k === "bagi" ? ' aria-haspopup="menu" aria-expanded="false"' : ""}>${ikon(TOMBOL[k], 24)}</button>`).join("")}</span>`;

/** Judul satu kalimat: kunci kamus memakai {hl} untuk angka/nama kunci, dibungkus <span class="jm-hl">. */
export const hlHtml = (kunci, hl, param = {}) => esc(t(kunci, { ...param, hl: "\u0001" })).replace("\u0001", `<span class="jm-hl">${esc(hl)}</span>`);

let seq = 0;
const idSeksi = (ex) => ex.id || (ex.id = "ex-" + (++seq));
const judul = (ex) => ex.querySelector(".jm-ex-j")?.textContent.trim() ?? document.title;
const tautan = (ex) => `${location.origin}${location.pathname}#${idSeksi(ex)}`;
const hariIni = () => tanggal(new Date().toISOString().slice(0, 10));
const sumberTeks = (ex) => ex.querySelector(".jm-sumber-isi")?.textContent.trim().replace(/\s+/g, " ") ?? "";

export function kabar(teks) {
  let el = document.getElementById("jm-aksi-kabar");
  if (!el) { el = document.createElement("p"); el.id = "jm-aksi-kabar"; el.className = "jm-aksi-kabar"; el.setAttribute("role", "status"); document.body.append(el); }
  el.textContent = teks; el.classList.add("tampil");
  clearTimeout(kabar.w); kabar.w = setTimeout(() => el.classList.remove("tampil"), 2600);
}
const unduhBlob = (blob, nama) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = nama; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
};

/* ---- Bagikan ---- */
function tutupMenu() { document.querySelectorAll(".jm-aksi-menu").forEach((m) => { m.__b?.setAttribute("aria-expanded", "false"); m.remove(); }); }
function bukaMenu(b, ex) {
  tutupMenu();
  const mi = (a, k) => `<button type="button" role="menuitem" class="jm-aksi-mi" data-jm-bagi="${a}">${esc(t("aksi." + k))}</button>`;
  const m = document.createElement("div");
  m.className = "jm-aksi-menu"; m.setAttribute("role", "menu"); m.setAttribute("aria-label", t("aksi.bagi")); m.__b = b; m.__ex = ex;
  m.innerHTML = (navigator.share ? mi("natif", "natif") : "") + mi("salin", "salin") + mi("wa", "wa") + mi("li", "li");
  document.body.append(m);
  const r = b.getBoundingClientRect();
  m.style.top = r.bottom + 6 + "px"; m.style.left = Math.max(8, Math.min(innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth)) + "px";
  b.setAttribute("aria-expanded", "true"); m.querySelector("button")?.focus();
}
async function bagikan(a, ex) {
  const url = tautan(ex), j = judul(ex), buka = (u) => window.open(u, "_blank", "noopener,noreferrer");
  if (a === "salin") { try { await navigator.clipboard.writeText(url); kabar(t("aksi.disalin")); } catch (e) { kabar(t("aksi.gagal")); } }
  else if (a === "wa") buka(`https://wa.me/?text=${encodeURIComponent(j + " " + url)}`);
  else if (a === "li") buka(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
  else if (a === "natif") { try { await navigator.share({ title: j, text: j, url }); } catch (e) { /* dibatalkan */ } }
}

/* ---- PNG ---- */
async function dataUrl(jalur) {
  const b = await (await fetch(jalur, { credentials: "same-origin" })).blob();
  return new Promise((ok, gagal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = gagal; r.readAsDataURL(b); });
}
function cssTeks() {
  let s = "";
  for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) s += r.cssText + "\n"; } catch (e) { /* lembar luar */ } }
  return s.replace(/:root/g, ".jm-snap").replace(/]]>/g, "");
}
export async function unduhPng(ex) {
  const lebar = 1080, tema = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const logo = await dataUrl("/img/logo-meti-tanda.png");
  const w = document.createElement("div");
  w.className = "jm-snap"; w.dataset.theme = tema; w.style.width = lebar + "px";
  const k = ex.cloneNode(true);
  k.querySelectorAll(".jm-ex-aksi, .jm-sumber, details, script").forEach((x) => x.remove());
  k.removeAttribute("id");
  const kaki = document.createElement("div");
  kaki.className = "jm-snap-kaki";
  kaki.innerHTML = `<img src="${logo}" width="40" height="40" alt=""><p><b>${esc(t("jm.merek"))}</b> ${esc(location.host + location.pathname)}<br>${esc(sumberTeks(ex))} ${esc(t("aksi.diunduh", { tanggal: hariIni() }))}</p>`;
  w.append(k, kaki);
  document.body.append(w);
  const h = Math.ceil(w.getBoundingClientRect().height) + 4;
  const xml = new XMLSerializer().serializeToString(w);
  w.remove();
  const isi = xml.replace(/^(<div[^>]*>)/, `$1<style><![CDATA[${cssTeks()}]]></style>`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${lebar}" height="${h}"><foreignObject width="100%" height="100%">${isi}</foreignObject></svg>`;
  const img = new Image();
  await new Promise((ok, gagal) => { img.onload = ok; img.onerror = gagal; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
  const c = document.createElement("canvas");
  c.width = lebar * 2; c.height = h * 2;
  const g = c.getContext("2d"); g.scale(2, 2); g.drawImage(img, 0, 0);
  const blob = await new Promise((ok) => c.toBlob(ok, "image/png"));
  if (!blob) throw new Error("png");
  unduhBlob(blob, `meti-${idSeksi(ex)}.png`);
}

/* ---- CSV: baris/kolom yang tampak, UTF-8 BOM, pemisah ';' (Excel Indonesia) ---- */
const sel = (c) => `"${c.innerText.replace(/\s+/g, " ").trim().replace(/"/g, '""')}"`;
export function unduhCsv(ex) {
  const d = {};
  ex.dispatchEvent(new CustomEvent("jm:csv", { detail: d })); // seksi tanpa tabel (mis. kalender) mengisi d.baris = [[sel, ...], ...]
  if (d.baris) return unduhBlob(new Blob(["\uFEFF" + d.baris.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" }), `meti-${idSeksi(ex)}.csv`);
  const tb = ex.querySelector("table.jm-tabel");
  if (!tb) throw new Error("csv");
  const baris = [...tb.rows].filter((r) => r.offsetParent !== null);
  const kolom = [...(baris[0]?.cells ?? [])].map((c, i) => (c.offsetParent !== null ? i : -1)).filter((i) => i >= 0);
  const out = baris.map((r) => kolom.map((i) => (r.cells[i] ? sel(r.cells[i]) : '""')).join(";"));
  unduhBlob(new Blob(["﻿" + out.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" }), `meti-${idSeksi(ex)}.csv`);
}

/* ---- PDF: sisa halaman disembunyikan lewat kelas (CSS @media print di jm.css), tema dipaksa terang selama cetak ---- */
function cetak(ex) {
  const sembunyi = [];
  for (let n = ex; n && n !== document.body; n = n.parentElement) for (const s of n.parentElement.children) if (s !== n && !s.matches("script,style,link")) { s.classList.add("jm-cetak-sembunyi"); sembunyi.push(s); }
  const kop = document.createElement("div"), kaki = document.createElement("div");
  kop.className = "jm-cetak-kop"; kaki.className = "jm-cetak-kaki";
  kop.innerHTML = `<img src="/img/logo-meti-tanda.png" width="36" height="36" alt=""><b>${esc(t("jm.merek"))}</b>`;
  kaki.textContent = `${location.host}${location.pathname}#${idSeksi(ex)} | ${sumberTeks(ex)} ${t("aksi.diunduh", { tanggal: hariIni() })}`.trim();
  ex.prepend(kop); ex.append(kaki); ex.classList.add("jm-cetak-aktif");
  const tema = document.documentElement.dataset.theme;
  document.documentElement.dataset.theme = "light";
  const beres = () => {
    removeEventListener("afterprint", beres);
    sembunyi.forEach((s) => s.classList.remove("jm-cetak-sembunyi")); kop.remove(); kaki.remove(); ex.classList.remove("jm-cetak-aktif");
    tema === undefined ? delete document.documentElement.dataset.theme : (document.documentElement.dataset.theme = tema);
  };
  addEventListener("afterprint", beres);
  requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
}

if (typeof document !== "undefined" && !window.__jmAksi) {
  window.__jmAksi = true;
  document.addEventListener("click", async (e) => {
    const mi = e.target.closest(".jm-aksi-mi");
    if (mi) { const m = mi.closest(".jm-aksi-menu"); const ex = m.__ex; tutupMenu(); bagikan(mi.dataset.jmBagi, ex); return; }
    const b = e.target.closest("[data-jm-aksi]");
    if (!b) { tutupMenu(); return; }
    const ex = b.closest(".jm-ex"), a = b.dataset.jmAksi;
    if (!ex) return;
    if (a === "bagi") { b.getAttribute("aria-expanded") === "true" ? tutupMenu() : bukaMenu(b, ex); return; }
    tutupMenu();
    if (a === "pdf") return cetak(ex);
    b.disabled = true;
    try {
      kabar(t("aksi.menyiapkan"));
      if (a === "png") await unduhPng(ex); else unduhCsv(ex);
      kabar(t("aksi.selesai"));
    } catch (err) { kabar(t(a === "csv" ? "aksi.csv.kosong" : "aksi.gagal")); }
    b.disabled = false;
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { const b = document.querySelector(".jm-aksi-menu")?.__b; tutupMenu(); b?.focus(); } });
  addEventListener("scroll", tutupMenu, { passive: true });
}
