// Tombol mata (tampil/sembunyikan) untuk tiap isian sandi di semua halaman,
// termasuk yang dirender belakangan (MutationObserver). Halaman yang sudah
// memasang .jm-mata sendiri (masuk.js) dilewati.
import { t } from "/i18n.js";

const MATA = '<svg class="jm-mata-buka" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg><svg class="jm-mata-tutup" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.9 17.9A10.9 10.9 0 0 1 12 19c-6.5 0-10-7-10-7a18 18 0 0 1 5-5.9M9.9 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2M1 1l22 22"/></svg>';

function pasang(i) {
  if (i.dataset.mata || i.nextElementSibling?.classList.contains("jm-mata")) return;
  i.dataset.mata = "1";
  const bungkus = document.createElement("span");
  bungkus.className = "jm-sandi-bk";
  i.replaceWith(bungkus);
  bungkus.append(i);
  const b = document.createElement("button");
  b.type = "button"; b.className = "jm-mata"; b.setAttribute("aria-pressed", "false");
  b.setAttribute("aria-label", t("masuk.tampil")); b.innerHTML = MATA;
  b.addEventListener("click", () => {
    const ya = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(ya));
    i.type = ya ? "text" : "password";
  });
  bungkus.append(b);
}

export function pasangMataSandi(akar = document) {
  akar.querySelectorAll?.('input[type="password"]').forEach(pasang);
}

if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
  const mulai = () => {
    pasangMataSandi();
    new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.matches?.('input[type="password"]')) pasang(n); else pasangMataSandi(n);
      }
    }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) mulai(); else document.addEventListener("DOMContentLoaded", mulai);
}
