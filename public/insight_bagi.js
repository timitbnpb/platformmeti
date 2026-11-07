/* /insight: menu bagikan per kartu (salin tautan, WhatsApp, X, LinkedIn, bagikan bawaan, unduh PNG). Gambar PNG digambar dari salinan kartu lewat SVG foreignObject. */
import { t } from "/i18n.js";
import { esc } from "/inti/umum.js";

export const IKON_BAGI = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>`;
export const tautanKartu = (id) => `${location.origin}/insight#ins-${id}`;

const judulKartu = (art) => art.querySelector(".jm-ins-j")?.textContent.trim() ?? "";
const idKartu = (art) => art.id.replace(/^ins-/, "");

function menuHtml(art) {
  const b = (aksi, kunci) => `<button type="button" role="menuitem" class="jm-ins-mi" data-aksi="${aksi}">${esc(t(kunci))}</button>`;
  return `<div class="jm-ins-menu" role="menu" aria-label="${esc(t("ins.bagi"))}">${navigator.share ? b("natif", "ins.bagi.natif") : ""}${b("salin", "ins.bagi.salin")}${b("wa", "ins.bagi.wa")}${b("x", "ins.bagi.x")}${b("li", "ins.bagi.li")}${b("png", "ins.bagi.png")}<p class="jm-ins-stat jm-bantu" role="status"></p></div>`;
}

function tutup() { document.querySelectorAll(".jm-ins-menu").forEach((m) => { m.parentElement.querySelector(".jm-ins-bagi")?.setAttribute("aria-expanded", "false"); m.remove(); }); }

const buka = (u) => window.open(u, "_blank", "noopener,noreferrer");

async function dataUrl(jalur) {
  const b = await (await fetch(jalur, { credentials: "same-origin" })).blob();
  return new Promise((ok, gagal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = gagal; r.readAsDataURL(b); });
}

function cssTeks() {
  let s = "";
  for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) s += r.cssText + "\n"; } catch (e) { /* lembar luar tak terbaca */ } }
  return s.replace(/:root/g, ".jm-snap").replace(/]]>/g, "");
}

/* Salin kartu ke wadah luar layar, ukur, bungkus sebagai SVG foreignObject, gambar ke kanvas, unduh. */
export async function unduhPng(art) {
  const lebar = 1080, tema = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const logo = await dataUrl("/img/logo-meti-tanda.png");
  const w = document.createElement("div");
  w.className = "jm-snap"; w.dataset.theme = tema; w.style.width = lebar + "px";
  const k = art.cloneNode(true);
  k.querySelectorAll(".jm-ins-bagi, .jm-ins-menu, details:not([open])").forEach((x) => x.remove());
  k.removeAttribute("id"); k.classList.add("jm-ins-snap");
  const sumber = art.querySelector(".jm-an-sumber")?.textContent.trim() ?? "";
  const kaki = document.createElement("div");
  kaki.className = "jm-snap-kaki";
  kaki.innerHTML = `<img src="${logo}" width="40" height="40" alt=""><p><b>${esc(t("jm.merek"))}</b> ${esc(location.host)}/insight<br>${esc(sumber)}</p>`;
  w.append(k, kaki);
  document.body.append(w);
  const h = Math.ceil(w.getBoundingClientRect().height);
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
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `insight-${idKartu(art)}.png`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function aksi(nama, art, menu) {
  const url = tautanKartu(idKartu(art)), judul = judulKartu(art), stat = menu.querySelector(".jm-ins-stat");
  const kabar = (kunci) => { stat.textContent = t(kunci); };
  if (nama === "salin") { try { await navigator.clipboard.writeText(url); kabar("ins.bagi.disalin"); } catch (e) { kabar("ins.bagi.gagal"); } }
  else if (nama === "wa") buka(`https://wa.me/?text=${encodeURIComponent(judul + " " + url)}`);
  else if (nama === "x") buka(`https://twitter.com/intent/tweet?text=${encodeURIComponent(judul)}&url=${encodeURIComponent(url)}`);
  else if (nama === "li") buka(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
  else if (nama === "natif") { try { await navigator.share({ title: judul, text: judul, url }); } catch (e) { /* dibatalkan pengguna */ } }
  else if (nama === "png") { kabar("ins.bagi.menyiapkan"); try { await unduhPng(art); kabar("ins.bagi.selesai"); } catch (e) { kabar("ins.bagi.gagal"); } }
}

export function pasangBagi() {
  document.addEventListener("click", (e) => {
    const tombol = e.target.closest(".jm-ins-bagi"), item = e.target.closest(".jm-ins-mi");
    if (item) { const art = item.closest("article"); aksi(item.dataset.aksi, art, item.closest(".jm-ins-menu")); return; }
    if (tombol) {
      const ada = tombol.parentElement.querySelector(".jm-ins-menu");
      tutup();
      if (!ada) { tombol.insertAdjacentHTML("afterend", menuHtml(tombol.closest("article"))); tombol.setAttribute("aria-expanded", "true"); tombol.parentElement.querySelector(".jm-ins-mi")?.focus(); }
      return;
    }
    if (!e.target.closest(".jm-ins-menu")) tutup();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { const b = document.querySelector(".jm-ins-menu")?.parentElement.querySelector(".jm-ins-bagi"); tutup(); b?.focus(); } });
}


