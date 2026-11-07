/* Mode presentasi, ekspor PPT, dan kode sematan untuk exhibit (.jm-ex). Dimuat malas oleh aksi_ex.js; semua exhibit halaman memakai komponen ini.
   Slide = gambar isi exhibit (renderPng, renderer PNG yang sama) + judul besar + kaki logo/sumber. PPT: PptxGenJS (vendor lokal, CSP script-src 'self'). */
import { t, tanggal } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { renderPng, kabar, judul, sumberTeks, idSeksi, unduhBlob, dataUrl, jenisSematan } from "/inti/aksi_ex.js";

export const semua = () => [...document.querySelectorAll(".jm-ex")].filter((e) => e.querySelector(".jm-aksi") && e.querySelector(".jm-ex-j"));
const judulHalaman = () => document.querySelector("h1")?.textContent.trim() || document.title;

/* ---- Presentasi layar penuh ---- */
let buka = null;
export function presentasi(mulai = 0) {
  if (buka) return;
  const daftar = semua();
  if (!daftar.length) return kabar(t("pres.kosong"));
  const kembali = document.activeElement;
  const w = document.createElement("div");
  w.className = "jm-pres"; w.tabIndex = -1; w.setAttribute("role", "dialog"); w.setAttribute("aria-modal", "true"); w.setAttribute("aria-label", t("pres.mulai"));
  w.innerHTML = `<div class="jm-pres-slide"><p class="jm-pres-ey"></p><h2 class="jm-pres-j"></h2><p class="jm-pres-sub"></p><div class="jm-pres-gb"><img alt=""><p class="jm-pres-muat" role="status"></p></div>
<footer class="jm-pres-kaki"><img src="/img/logo-meti-tanda.png" width="36" height="36" alt=""><p class="jm-pres-sumber"></p><span class="jm-pres-no" aria-live="polite"></span></footer></div>
<button type="button" class="jm-pres-nav jm-pres-kiri" data-pres="-1" aria-label="${esc(t("pres.sebelum"))}">${ikon("panah-kiri", 24)}</button>
<button type="button" class="jm-pres-nav jm-pres-kanan" data-pres="1" aria-label="${esc(t("pres.sesudah"))}">${ikon("panah-kanan", 24)}</button>
<button type="button" class="jm-pres-nav jm-pres-tutup" data-pres="x" aria-label="${esc(t("pres.keluar"))}">${ikon("tutup", 24)}</button>`;
  document.body.append(w);
  const q = (k) => w.querySelector(k), cache = new Map();
  let i = Math.max(0, Math.min(mulai, daftar.length - 1)), tanda = 0;
  const gambar = async (n) => {
    if (!cache.has(n)) cache.set(n, renderPng(daftar[n], { isi: true, lebar: 1280, maksTinggi: 800 }).then((r) => URL.createObjectURL(r.blob)));
    return cache.get(n);
  };
  const tampil = async (n) => {
    i = (n + daftar.length) % daftar.length;
    const ex = daftar[i], ini = ++tanda;
    q(".jm-pres-ey").textContent = ex.querySelector(".jm-ex-ey")?.textContent.trim() ?? "";
    q(".jm-pres-j").replaceChildren(...[...ex.querySelector(".jm-ex-j").childNodes].map((x) => x.cloneNode(true)));
    q(".jm-pres-sub").textContent = ex.querySelector(".jm-ex-sub")?.textContent.replace(/\s+/g, " ").trim() ?? "";
    q(".jm-pres-sumber").textContent = sumberTeks(ex) || location.host + location.pathname;
    q(".jm-pres-no").textContent = `${i + 1} / ${daftar.length}`;
    const im = q(".jm-pres-gb img"), ms = q(".jm-pres-muat");
    im.hidden = true; ms.hidden = false; ms.textContent = t("aksi.menyiapkan");
    try {
      const u = await gambar(i);
      if (ini !== tanda) return;
      im.src = u; im.hidden = false; ms.hidden = true;
      if (daftar.length > 1) gambar((i + 1) % daftar.length).catch(() => {}); // prapemuat slide berikut
    } catch (e) { if (ini === tanda) ms.textContent = t("aksi.gagal"); }
  };
  const tutup = () => {
    if (!buka) return;
    buka = null;
    removeEventListener("keydown", tombol, true); document.removeEventListener("fullscreenchange", layar);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    cache.forEach((p) => p.then(URL.revokeObjectURL).catch(() => {}));
    w.remove(); kembali?.focus?.();
  };
  const layar = () => { if (!document.fullscreenElement) tutup(); };
  const tombol = (e) => {
    const k = e.key;
    if (k === "Escape") tutup();
    else if (["ArrowRight", "PageDown", " ", "Enter"].includes(k)) tampil(i + 1);
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(k)) tampil(i - 1);
    else if (k === "Home") tampil(0);
    else if (k === "End") tampil(daftar.length - 1);
    else return;
    e.preventDefault(); e.stopPropagation();
  };
  let x0 = null;
  w.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
  w.addEventListener("pointerup", (e) => {
    const n = e.target.closest("[data-pres]");
    if (n) return n.dataset.pres === "x" ? tutup() : tampil(i + Number(n.dataset.pres));
    const dx = e.clientX - (x0 ?? e.clientX);
    if (Math.abs(dx) > 50) tampil(i + (dx < 0 ? 1 : -1)); // geser
    else tampil(i + (e.clientX < innerWidth / 3 ? -1 : 1)); // klik: sepertiga kiri mundur, sisanya maju
  });
  addEventListener("keydown", tombol, true);
  buka = w;
  w.focus();
  w.requestFullscreen?.().then(() => document.addEventListener("fullscreenchange", layar)).catch(() => {}); // tanpa layar penuh tetap menutupi halaman
  tampil(i);
}

/* ---- PPT ---- */
let muat = null;
const muatPptx = () => (muat ??= new Promise((ok, gagal) => {
  if (window.PptxGenJS) return ok();
  const s = document.createElement("script");
  s.src = "/vendor/pptxgenjs/pptxgen.bundle.js"; s.onload = ok; s.onerror = () => { muat = null; gagal(new Error("pptx")); };
  document.head.append(s);
}));
const HIJAU = "0A5C47", GELAP = "0B3D31", LIME = "9DC94F", REDUP = "46594F", FONT = "Inter";

export async function unduhPpt(daftar) {
  if (!daftar.length) return kabar(t("pres.kosong"));
  kabar(t("aksi.menyiapkan"));
  await muatPptx();
  const logo = await dataUrl("/img/logo-meti-tanda.png");
  const p = new window.PptxGenJS();
  p.layout = "LAYOUT_WIDE"; // 13,33 x 7,5 inci
  p.title = judulHalaman(); p.author = t("jm.merek"); p.company = "METI";
  const s0 = p.addSlide();
  s0.background = { color: HIJAU };
  s0.addShape("rect", { x: 0, y: 6.9, w: 13.33, h: 0.6, fill: { color: LIME } });
  s0.addImage({ data: logo, x: 0.7, y: 0.6, w: 0.9, h: 0.9 });
  s0.addText(t("jm.merek"), { x: 1.8, y: 0.75, w: 8, h: 0.6, fontFace: FONT, fontSize: 18, color: "FFFFFF" });
  s0.addText(daftar.length === 1 ? judul(daftar[0]) : judulHalaman(), { x: 0.7, y: 2.4, w: 11.9, h: 2.2, fontFace: FONT, fontSize: 40, bold: true, color: "FFFFFF", valign: "middle", fit: "shrink" });
  s0.addText(`${location.host}${location.pathname} | ${tanggal(new Date().toISOString().slice(0, 10))}`, { x: 0.7, y: 4.8, w: 11.9, h: 0.5, fontFace: FONT, fontSize: 16, color: "DCE9E3" });
  for (const [n, ex] of daftar.entries()) {
    kabar(`${t("aksi.menyiapkan")} ${n + 1}/${daftar.length}`);
    const g = await renderPng(ex, { isi: true, lebar: 1280, tema: "light", maksTinggi: 800 });
    const s = p.addSlide();
    s.background = { color: "FFFFFF" };
    s.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: LIME } });
    s.addText(judul(ex), { x: 0.5, y: 0.3, w: 12.3, h: 1.0, fontFace: FONT, fontSize: 26, bold: true, color: GELAP, valign: "middle", fit: "shrink" });
    const aw = 12.33, ah = 5.1, r = g.h / g.w, iw = aw * r <= ah ? aw : ah / r, ih = iw * r;
    s.addImage({ data: g.canvas.toDataURL("image/png"), x: 0.5 + (aw - iw) / 2, y: 1.4 + (ah - ih) / 2, w: iw, h: ih });
    s.addImage({ data: logo, x: 0.5, y: 6.85, w: 0.4, h: 0.4 });
    s.addText(sumberTeks(ex) || `${location.host}${location.pathname}#${idSeksi(ex)}`, { x: 1.0, y: 6.8, w: 10.6, h: 0.5, fontFace: FONT, fontSize: 10, color: REDUP, valign: "middle", fit: "shrink" });
    s.slideNumber = { x: 12.3, y: 6.85, w: 0.5, h: 0.4, fontFace: FONT, fontSize: 10, color: REDUP };
  }
  const blob = await p.write({ outputType: "blob" });
  unduhBlob(blob, `meti-${(location.pathname.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "beranda")}.pptx`);
  kabar(t("aksi.selesai"));
}

/* ---- Sematan ---- */
export function kodeSematan() {
  const j = jenisSematan();
  if (!j) return kabar(t("aksi.gagal"));
  const src = `${location.origin}/sematan/${j.jenis}/${j.id}`;
  const kode = `<iframe src="${src}" width="600" height="360" frameborder="0" loading="lazy" title="${judulHalaman().replace(/["<>&]/g, "")}"></iframe>`;
  const d = document.createElement("dialog");
  d.className = "jm-sem";
  d.innerHTML = `<form method="dialog"><h2>${esc(t("sem.judul"))}</h2><p>${esc(t("sem.ket"))}</p><textarea readonly rows="4" aria-label="${esc(t("sem.judul"))}"></textarea>
<div class="jm-sem-aksi"><button type="button" class="jm-sem-salin">${esc(t("aksi.salin"))}</button><button value="x">${esc(t("sem.tutup"))}</button></div></form>`;
  d.querySelector("textarea").value = kode;
  d.addEventListener("click", async (e) => {
    if (e.target === d) d.close();
    if (e.target.closest(".jm-sem-salin")) { try { await navigator.clipboard.writeText(kode); kabar(t("aksi.disalin")); } catch (er) { d.querySelector("textarea").select(); } }
  });
  d.addEventListener("close", () => d.remove());
  document.body.append(d);
  d.showModal();
}
