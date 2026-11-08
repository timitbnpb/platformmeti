/* Tab antarkonten satu halaman (Peluang, Acara, Galeri): .jm-tab berikon ujung ke ujung, tab aktif ada di hash (bisa dibagikan),
   isi tiap tab dimuat malas saat pertama dibuka. INP: aria-selected dan panel berganti seketika; muat() berat lewat nanti(). */
import { t } from "/i18n.js";
import { esc, ikon, nanti, galatHtml } from "/inti/umum.js";

/** tab: [{ k, hash?, ikon, teks (kunci i18n), panel (id elemen), muat: () => Promise, cocok?: (hash) => boolean }]. Mengembalikan { buka(k) }. */
export function tabHalaman(wadah, { label, tab }) {
  const el = typeof wadah === "string" ? document.getElementById(wadah) : wadah;
  el.className = "jm-tab jm-tab-rata";
  el.setAttribute("role", "tablist");
  el.setAttribute("aria-label", t(label));
  el.setAttribute("data-i18n-attr", "aria-label:" + label);
  el.innerHTML = tab.map((d) => `<button type="button" role="tab" id="tab-${d.k}" data-tab="${d.k}" aria-selected="false" tabindex="-1">${ikon(d.ikon, 18)}<span data-i18n="${d.teks}">${esc(t(d.teks))}</span></button>`).join("");
  const dariHash = () => {
    const h = location.hash;
    return tab.find((d) => (d.cocok ? d.cocok(h) : h === "#" + (d.hash || d.k))) || tab[0];
  };
  const buka = (k) => {
    const d = tab.find((x) => x.k === k) || tab[0];
    for (const b of el.querySelectorAll("[role=tab]")) { const on = b.dataset.tab === d.k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; } // chrome urgent
    for (const x of tab) { const p = document.getElementById(x.panel); if (p) p.hidden = x.panel !== d.panel; }
    return new Promise((selesai) => nanti(async () => {
      try { await d.muat(); } catch { const p = document.getElementById(d.panel); if (p && !p.firstElementChild) p.innerHTML = galatHtml("layanan"); }
      dispatchEvent(new Event("resize")); // peta yang dibuat saat panel tersembunyi menyesuaikan ukuran
      selesai();
    }));
  };
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]"); if (!b) return;
    const d = tab.find((x) => x.k === b.dataset.tab);
    history.replaceState(null, "", location.pathname + location.search + (d.hash ? "#" + d.hash : d === tab[0] ? "" : "#" + d.k));
    buka(b.dataset.tab);
  });
  el.addEventListener("keydown", (e) => {
    const i = tab.findIndex((d) => d.k === document.activeElement?.dataset?.tab), s = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (i < 0 || !s) return;
    const b = el.querySelectorAll("[role=tab]")[(i + s + tab.length) % tab.length];
    b.focus(); b.click();
  });
  addEventListener("hashchange", () => buka(dariHash().k));
  buka(dariHash().k);
  return { buka };
}
