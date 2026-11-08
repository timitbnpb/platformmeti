/* Penjelasan istilah di seluruh situs: pindai teks isi halaman (p, li, td, dd di dalam main) untuk singkatan/istilah dalam /data/istilah_hover.json,
   bungkus kemunculan PERTAMA per bagian dengan span bergaris titik, popover definisi singkat + "Selengkapnya" ke /panduan#istilah-id.
   Ringan: hanya saat idle, potongan kecil, batas jumlah per halaman, MutationObserver bertahan (throttle). Dimatikan pengguna lewat localStorage "jm.istilah".
   Dimuat dari inti/kepala.js (side effect); data diunduh sesudah halaman tercat dan hanya bila ada teks yang layak dipindai. */
import { t, bahasa } from "/i18n.js";
import { esc } from "/inti/umum.js";

const KUNCI = "jm.istilah", MAKS = 60, PER_BAGIAN = 1, JEDA = 500;
const LEWATI = "a,button,input,textarea,select,option,code,pre,kbd,h1,h2,h3,h4,h5,h6,th,summary,label,script,style,svg,noscript,[contenteditable],[data-no-ist],.jm-ist,.jm-ist-pop,.top,.jm-kaki,.jm-pag,.jm-kh-ey,.jm-kh-ubin,.jm-kh-sisi,[class*=kpi],[class*=-lb],[role=tab],[role=tablist],[role=button],[role=status]";
const BLOK = "p,li,td,dd,blockquote,figcaption";
const BAGIAN = "section,article,[role=region],.jm-tp-bab,details";

let D = null, RE = { sing: null, kata: null }, aktif = false, jumlah = 0, obs = null, jadwal = 0, antre = new Set(), pop = null, tutup = 0;
const sudah = new WeakSet(), bagian = new WeakMap();

export const hoverAktif = () => { try { return localStorage.getItem(KUNCI) !== "mati"; } catch (e) { return true; } };
export function aturHover(hidup) {
  try { hidup ? localStorage.removeItem(KUNCI) : localStorage.setItem(KUNCI, "mati"); } catch (e) { /* mode privat */ }
  if (hidup) mulai(); else berhenti();
}
const halamanLayak = () => !/^\/(panduan|admin|masuk|aktivasi|ganti-sandi|404)(\/|$|\.)/.test(location.pathname);

/* ---------- indeks ---------- */
const lolos = (s) => s.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
const BATAS = (isi) => new RegExp(`(?<![\\p{L}\\p{N}_-])(?:${isi})(?![\\p{L}\\p{N}_-])`, "gu");
function bangunIndeks(h) {
  const sing = [], kata = [], peta = new Map();
  for (const [a, id, peka] of h.m) { (peka ? sing : kata).push(lolos(a)); peta.set(peka ? a : a.toLowerCase(), id); }
  RE = { sing: sing.length ? BATAS(sing.join("|")) : null, kata: kata.length ? new RegExp(BATAS(kata.join("|")).source, "giu") : null, peta };
}
async function muatIndeks() {
  if (D) return true;
  try {
    const r = await fetch("/data/istilah_hover.json", { credentials: "same-origin" });
    if (!r.ok) return false;
    D = await r.json(); bangunIndeks(D); return true;
  } catch (e) { return false; }
}

/* ---------- pindai ---------- */
function layak(teks) {
  const p = teks.parentElement;
  const blok = p && p.closest(BLOK);
  return blok && !sudah.has(teks) && blok.textContent.length >= 60 && !blok.querySelector("p,div,ul,ol,li,table,section,h1,h2,h3,h4,dl") && !p.closest(LEWATI); // kalimat utuh saja; label dan sel pendek dilewati
}
function cocok(teks) {
  const s = teks.nodeValue, hit = [];
  for (const [re, peka] of [[RE.sing, true], [RE.kata, false]]) {
    if (!re) continue;
    re.lastIndex = 0;
    for (let m; (m = re.exec(s));) hit.push({ i: m.index, a: m[0], id: RE.peta.get(peka ? m[0] : m[0].toLowerCase()) });
  }
  return hit.filter((x) => x.id).sort((a, z) => a.i - z.i);
}
function bungkus(teks) {
  sudah.add(teks);
  const blok = teks.parentElement?.closest(BAGIAN) || document.querySelector("main") || document.body;
  let ada = bagian.get(blok); if (!ada) bagian.set(blok, (ada = new Set()));
  const pakai = [];
  let akhir = -1;
  for (const x of cocok(teks)) {
    if (jumlah + pakai.length >= MAKS) break;
    if (x.i < akhir || ada.has(x.id) || pakai.some((p) => p.id === x.id)) continue;
    pakai.push(x); akhir = x.i + x.a.length;
  }
  if (!pakai.length) return;
  const s = teks.nodeValue, frag = document.createDocumentFragment();
  let k = 0;
  for (const x of pakai) {
    ada.add(x.id);
    if (x.i > k) frag.append(s.slice(k, x.i));
    const el = document.createElement("span");
    el.className = "jm-ist"; el.tabIndex = 0; el.dataset.ist = x.id; el.textContent = x.a;
    frag.append(el); k = x.i + x.a.length; jumlah++;
  }
  if (k < s.length) frag.append(s.slice(k));
  teks.replaceWith(frag);
}
/* Pindai potongan kecil di waktu idle; sisanya dilanjutkan. */
function pindai(akar) {
  const jalan = (dl) => {
    const w = document.createTreeWalker(akar, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement && !n.parentElement.closest(LEWATI) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    const semua = [];
    for (let n; (n = w.nextNode());) if (layak(n)) semua.push(n);
    let i = 0;
    const lanjut = (d) => {
      while (i < semua.length && jumlah < MAKS && (!d || d.timeRemaining() > 2)) bungkus(semua[i++]);
      if (i < semua.length && jumlah < MAKS) idle(lanjut);
    };
    lanjut(dl);
  };
  idle(jalan);
}
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(() => fn(null), 60));

function amati(akar) {
  obs = new MutationObserver((ms) => {
    for (const m of ms) for (const n of m.addedNodes) {
      if (n.nodeType === 1 && !n.classList.contains("jm-ist") && !n.closest?.(".jm-ist-pop")) antre.add(n);
      else if (n.nodeType === 3 && n.parentElement && !n.parentElement.classList.contains("jm-ist")) antre.add(n.parentElement);
    }
    if (antre.size && !jadwal) jadwal = setTimeout(() => { jadwal = 0; const a = [...antre]; antre = new Set(); for (const e of a) if (e.isConnected) pindai(e); }, JEDA);
  });
  obs.observe(akar, { childList: true, subtree: true });
}

/* ---------- popover ---------- */
function buatPop() {
  if (pop) return pop;
  pop = document.createElement("div");
  pop.id = "jm-ist-pop"; pop.className = "jm-ist-pop"; pop.setAttribute("role", "tooltip"); pop.hidden = true;
  pop.addEventListener("pointerenter", () => clearTimeout(tutup));
  pop.addEventListener("pointerleave", () => sembunyi());
  pop.addEventListener("click", (e) => { if (e.target.closest("[data-ist-mati]")) { aturHover(false); sembunyiSegera(); } });
  document.body.append(pop);
  return pop;
}
let pemicu = null;
function tampil(el) {
  const rek = D?.d?.[el.dataset.ist]; if (!rek) return;
  clearTimeout(tutup);
  const p = buatPop(), b = bahasa();
  p.innerHTML = `<p class="jm-ist-n"><b>${esc(rek[0])}</b>${rek[3] ? `<span class="jm-pil jm-pil-ok">${esc(t("is2.h.resmi"))}</span>` : ""}</p><p class="jm-ist-a">${esc(b === "id" ? rek[1] : rek[2] || rek[1])}</p><p class="jm-ist-aksi"><a href="/panduan#istilah-${encodeURIComponent(el.dataset.ist)}">${esc(t("is2.h.selengkapnya"))}</a><button type="button" data-ist-mati>${esc(t("is2.h.matikan"))}</button></p>`;
  p.hidden = false;
  if (pemicu && pemicu !== el) pemicu.removeAttribute("aria-describedby");
  pemicu = el; el.setAttribute("aria-describedby", p.id);
  const r = el.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight, vw = document.documentElement.clientWidth;
  const atas = r.bottom + ph + 12 > innerHeight && r.top > ph + 12;
  p.style.left = Math.max(8, Math.min(vw - pw - 8, r.left + r.width / 2 - pw / 2)) + "px";
  p.style.top = (atas ? r.top - ph - 8 : r.bottom + 8) + "px";
}
function sembunyiSegera() { clearTimeout(tutup); if (pop) pop.hidden = true; if (pemicu) { pemicu.removeAttribute("aria-describedby"); pemicu = null; } }
function sembunyi() { clearTimeout(tutup); tutup = setTimeout(sembunyiSegera, 160); }

function pasangEvent() {
  document.addEventListener("pointerover", (e) => { if (e.pointerType === "touch") return; const el = e.target.closest?.(".jm-ist"); if (el) tampil(el); });
  document.addEventListener("pointerout", (e) => { if (e.pointerType !== "touch" && e.target.closest?.(".jm-ist")) sembunyi(); });
  document.addEventListener("focusin", (e) => { const el = e.target.closest?.(".jm-ist"); if (el) tampil(el); });
  document.addEventListener("focusout", (e) => { if (e.target.closest?.(".jm-ist") && !pop?.contains(e.relatedTarget)) sembunyi(); });
  document.addEventListener("click", (e) => {
    const el = e.target.closest?.(".jm-ist");
    if (el) { if (pemicu === el && !pop.hidden && e.detail) return; tampil(el); return; }
    if (!e.target.closest?.(".jm-ist-pop")) sembunyiSegera();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") sembunyiSegera(); });
  addEventListener("scroll", () => { if (pop && !pop.hidden) sembunyiSegera(); }, { passive: true });
}

/* ---------- hidup / mati ---------- */
function berhenti() {
  aktif = false; obs?.disconnect(); obs = null; clearTimeout(jadwal); jadwal = 0; antre.clear(); sembunyiSegera();
  for (const s of document.querySelectorAll(".jm-ist")) s.replaceWith(document.createTextNode(s.textContent));
  document.querySelector("main")?.normalize(); jumlah = 0;
}
async function mulai() {
  if (aktif || !hoverAktif() || !halamanLayak()) return;
  aktif = true;
  if (!(await muatIndeks()) || !aktif) { aktif = false; return; }
  if (!document.getElementById("jm-ist-css")) {
    const l = document.createElement("link"); l.id = "jm-ist-css"; l.rel = "stylesheet"; l.href = "/inti/istilah.css"; document.head.append(l);
  }
  const akar = document.querySelector("main") || document.body;
  pindai(akar); amati(akar);
}
let terpasang = false;
function awal() {
  if (terpasang) return; terpasang = true;
  if (!halamanLayak()) return;
  pasangEvent();
  idle(() => mulai());
}
if (document.readyState === "complete") awal(); else addEventListener("load", awal, { once: true });
