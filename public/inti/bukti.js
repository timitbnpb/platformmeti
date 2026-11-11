/* Label kepercayaan bersama (G2): pil kecil Resmi / Media / EST / Hipotesis / Kata pihak (+ Kajian, Perlu tinjau) dengan ikon dan warna berbeda,
   tooltip berisi arti label, sumber, tanggal, cara hitung, dan tautan ke /metode#tingkat-bukti.
   Pakai: buktiHtml("resmi" | "media" | "est" | "hipotesis" | "kata-pihak" | "via-pihak-ketiga" ..., { sumber, tanggal, cara }).
   pasangBukti() (dipanggil kepala.js) memasang tooltip untuk SEMUA label di halaman, termasuk pil lama `.jm-pil-est` yang ditingkatkan otomatis. */
import { t, tanggal as tgl } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";

const PETA = { resmi: "resmi", media: "media", est: "est", hipotesis: "hip", hip: "hip", "kata-pihak": "kata", pihak: "kata", kata: "kata", kajian: "kajian", "via-pihak-ketiga": "kajian", tinjau: "tinjau", turunan: "turunan" };
export const IKON_BUKTI = { resmi: "perisai", media: "berita", est: "kalkulator", hip: "tanya", kata: "orang", kajian: "kajian", tinjau: "peringatan", turunan: "metode" };
export const kodeBukti = (k) => PETA[String(k || "").toLowerCase()] || "";
const URL_METODE = "/metode#tingkat-bukti";

/* tag "span" untuk dalam tautan/tombol lain (tooltip tetap lewat hover; tanpa elemen interaktif bersarang) */
export function buktiHtml(kode, { sumber = "", tanggal = "", cara = "", ukuran = 14, tag = "button" } = {}) {
  const k = kodeBukti(kode);
  if (!k) return kode ? `<span class="jm-pil">${esc(kode)}</span>` : "-";
  const d = (n, v) => (v ? ` data-${n}="${esc(v)}"` : "");
  return `<${tag}${tag === "button" ? ' type="button"' : ""} class="jm-bukti" data-b="${k}"${d("s", sumber)}${d("d", tanggal)}${d("c", cara)}>${ikon(IKON_BUKTI[k], ukuran)}<span>${esc(t("met.tb." + k + ".j"))}</span></${tag}>`;
}

let tip = null, jangkar = null;
function buat() {
  tip = document.createElement("div");
  tip.className = "jm-bukti-tip"; tip.setAttribute("role", "tooltip"); tip.hidden = true;
  tip.addEventListener("pointerleave", sembunyi);
  document.body.append(tip);
}
function konteksSumber(el) {
  const ex = el.closest(".jm-ex, .jm-kpi, section, article");
  const s = ex?.querySelector(".jm-sumber-isi")?.textContent?.replace(/\s+/g, " ").trim();
  return s ? s.slice(0, 220) : "";
}
function isi(el) {
  const k = el.dataset.b, baris = [];
  const sumber = el.dataset.s || konteksSumber(el), cara = el.dataset.c;
  if (sumber) baris.push([t("bukti.sumber"), sumber]);
  if (el.dataset.d) baris.push([t("bukti.tanggal"), tgl(String(el.dataset.d).slice(0, 10)) || el.dataset.d]);
  if (cara) baris.push([t("bukti.cara"), cara]);
  const dl = baris.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("");
  return `<b>${ikon(IKON_BUKTI[k], 16)}<span>${esc(t("met.tb." + k + ".j"))}</span></b><p>${esc(t("met.tb." + k))}</p>${dl ? `<dl>${dl}</dl>` : ""}<a href="${URL_METODE}">${esc(t("bukti.lihat"))}</a>`;
}
function tampil(el) {
  if (!tip) buat();
  const rumah = el.closest("dialog") || document.body; /* modal di lapisan atas: tooltip ikut di dalamnya */
  if (tip.parentNode !== rumah) rumah.append(tip);
  jangkar = el; tip.innerHTML = isi(el); tip.hidden = false;
  const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  const x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8);
  const y = r.bottom + 8 + h > innerHeight ? Math.max(8, r.top - h - 8) : r.bottom + 8;
  tip.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
}
const sembunyi = () => { if (tip) tip.hidden = true; jangkar = null; };
const sasaran = (e) => e.target.closest?.(".jm-bukti[data-b]");

/* pil EST lama (HTML literal di banyak halaman) -> label bukti berikon, tanpa menyunting tiap halaman */
function tingkatkan(akar = document) {
  for (const el of akar.querySelectorAll(".jm-pil-est:not([data-b])")) {
    el.dataset.b = "est"; el.classList.add("jm-bukti"); el.tabIndex = 0;
    el.insertAdjacentHTML("afterbegin", ikon("kalkulator", 12));
  }
}

export function pasangBukti() {
  if (window.__jmBukti) return;
  window.__jmBukti = true;
  document.addEventListener("pointerover", (e) => { const el = sasaran(e); if (el && el !== jangkar && e.pointerType !== "touch") tampil(el); });
  document.addEventListener("pointerout", (e) => { if (sasaran(e) && !e.relatedTarget?.closest?.(".jm-bukti-tip")) sembunyi(); });
  document.addEventListener("focusin", (e) => { const el = sasaran(e); if (el) tampil(el); });
  document.addEventListener("focusout", (e) => { if (sasaran(e) && !e.relatedTarget?.closest?.(".jm-bukti-tip")) sembunyi(); });
  document.addEventListener("click", (e) => { const el = sasaran(e); if (el?.closest("a")) return; if (el) { jangkar === el && !tip.hidden ? sembunyi() : tampil(el); } else if (!e.target.closest?.(".jm-bukti-tip")) sembunyi(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") sembunyi(); });
  addEventListener("scroll", sembunyi, { passive: true, capture: true });
  let h = 0;
  const jadwal = () => { if (!h) h = requestAnimationFrame(() => { h = 0; tingkatkan(); }); };
  new MutationObserver(jadwal).observe(document.body, { childList: true, subtree: true });
  tingkatkan();
}
