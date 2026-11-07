// Gambar bertanda data-galat="hapus" dibuang bila gagal dimuat.
// Pengganti onerror inline, yang diblokir CSP (script-src 'self').
if (typeof document !== "undefined") {
  document.addEventListener("error", (e) => {
    const i = e.target;
    if (i?.tagName === "IMG" && i.dataset.galat === "hapus") i.remove();
  }, true);
}
