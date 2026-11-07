// Tautan bagikan murni (tanpa DOM, bisa diuji di Node). Dipakai bagikanHtml di komponen.js.
export const urlMutlak = (u) => (/^https?:\/\//i.test(u) ? u : (typeof location !== "undefined" ? location.origin : "") + u);
export const tautanBagi = (url, judul) => {
  const u = encodeURIComponent(url), j = encodeURIComponent(judul);
  return {
    fb: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    x: `https://twitter.com/intent/tweet?url=${u}&text=${j}`,
    wa: `https://wa.me/?text=${encodeURIComponent(judul + " " + url)}`,
    tg: `https://t.me/share/url?url=${u}&text=${j}`,
    surel: `mailto:?subject=${j}&body=${u}`,
    li: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
  };
};
