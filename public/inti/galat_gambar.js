// Gambar bertanda data-galat="hapus" dibuang bila gagal dimuat; data-ganti="<url>" diganti sekali ke url itu.
// Pengganti onerror inline, yang diblokir CSP (script-src 'self').
if (typeof document !== "undefined") {
  document.addEventListener("error", (e) => {
    const i = e.target;
    if (i?.tagName !== "IMG") return;
    if (i.dataset.ganti) { const g = i.dataset.ganti; delete i.dataset.ganti; i.src = g; } // pengganti sekali, lalu berhenti
    else if (i.dataset.galat === "hapus") i.remove();
  }, true);
}
