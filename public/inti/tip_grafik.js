/* Tooltip grafik bersama (pemilik 8 Nov 2026): hover/sentuh/fokus pada batang/kolom/titik menampilkan label lengkap + nilai,
   pembanding terhadap rata-rata kelompok, elemen tersorot menonjol dan sisanya redup. Bekerja untuk SVG grafik.js (<title> di rect/circle)
   dan batang HTML analisis.js (li di .jm-batang). Satu pendengar bersama di dokumen, tanpa gaya inline. */
import { t, angka } from "/i18n.js";

const SEL = ".jm-gf :is(rect,circle,path)[data-tip],.jm-batang>li[data-tip]:not(.jm-bar-ax),.jm-an-batang>li[data-tip]";
let tip;
const kotak = () => tip || (tip = Object.assign(document.createElement("div"), { className: "jm-gf-tip", hidden: true, role: "tooltip", id: "jm-gf-tip" }), document.body.append(tip), tip);

/* ukuran relatif elemen: lebar/tinggi rect SVG, atau data-w batang HTML */
const ukur = (e) => e.matches("li") ? [...e.querySelectorAll("[data-w]")].reduce((s, i) => s + +i.dataset.w, 0) : Math.max(+e.getAttribute("width") || 0, +e.getAttribute("height") || 0);
const kelompok = (e) => e.matches("li") ? e.parentElement : e.closest("svg");
const saudara = (e) => [...kelompok(e).querySelectorAll(SEL)];

/* siapkan: pindahkan <title>/title jadi data-tip (cegah tooltip bawaan ganda), jadikan bisa difokus */
function siapkan(akar) {
  for (const ti of akar.querySelectorAll?.(".jm-gf title") ?? []) {
    const p = ti.parentElement;
    if (!p.matches("rect,circle,path")) continue;
    p.dataset.tip = ti.textContent; p.setAttribute("aria-label", ti.textContent); p.setAttribute("tabindex", "0"); ti.remove();
  }
  for (const li of akar.querySelectorAll?.(".jm-batang>li[title]:not(.jm-bar-ax),.jm-an-batang>li[title]") ?? []) {
    li.dataset.tip = li.getAttribute("title"); li.removeAttribute("title"); li.setAttribute("tabindex", "0");
  }
}

function banding(e) {
  const v = ukur(e), semua = saudara(e).map(ukur).filter((x) => x > 0);
  if (semua.length < 3 || !(v > 0)) return "";
  const rata = semua.reduce((a, b) => a + b, 0) / semua.length, p = Math.round((v / rata - 1) * 100);
  if (Math.abs(p) < 2) return t("gf.tip.sama");
  return t(p > 0 ? "gf.tip.atas" : "gf.tip.bawah", { p: angka(Math.abs(p), { desimal: 0 }) });
}

function tampil(e) {
  const k = kotak(), [judul, ...sisa] = e.dataset.tip.split(/:\s(.+)/s).filter(Boolean);
  k.replaceChildren();
  const b = document.createElement("b"); b.textContent = sisa.length ? judul : e.dataset.tip; k.append(b);
  if (sisa.length) { const s = document.createElement("span"); s.textContent = sisa.join(" "); k.append(s); }
  const c = banding(e); if (c) { const i = document.createElement("small"); i.textContent = c; k.append(i); }
  k.hidden = false;
  const r = e.getBoundingClientRect(), w = k.offsetWidth, h = k.offsetHeight;
  const x = Math.min(Math.max(r.left + r.width / 2 - w / 2, 8), innerWidth - w - 8), y = r.top - h - 10 < 8 ? r.bottom + 10 : r.top - h - 10;
  k.style.left = x + "px"; k.style.top = y + "px";
  e.setAttribute("aria-describedby", k.id);
  const g = kelompok(e); g.classList.add("jm-gf-fokus"); e.classList.add("jm-gf-on");
}
function sembunyi(e) {
  if (tip) tip.hidden = true;
  const g = e && kelompok(e); g?.classList.remove("jm-gf-fokus"); e?.classList.remove("jm-gf-on"); e?.removeAttribute("aria-describedby");
}
let kini = null;
const masuk = (ev) => { const e = ev.target.closest?.(SEL); if (!e || e === kini) return; sembunyi(kini); kini = e; tampil(e); };
const keluar = (ev) => { if (kini && !kini.contains(ev.relatedTarget)) { sembunyi(kini); kini = null; } };
document.addEventListener("pointerover", masuk); document.addEventListener("focusin", masuk);
document.addEventListener("pointerout", keluar); document.addEventListener("focusout", keluar);
document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && kini) { sembunyi(kini); kini = null; } });
addEventListener("scroll", () => { if (kini) { sembunyi(kini); kini = null; } }, { passive: true });

let tunda;
new MutationObserver(() => { clearTimeout(tunda); tunda = setTimeout(() => siapkan(document), 150); }).observe(document.body, { childList: true, subtree: true });
siapkan(document);
