/* Pembantu bersama chat ke admin (widget publik + tab Pesan admin). Tanpa impor supaya bisa diuji di Node. */
export const TOPIK = ["umum", "koreksi", "keanggotaan", "kerja_sama", "wilayah", "teknis"];
export const MAKS_BERKAS = 5 * 1024 * 1024;
export const MAKS_ISI = 2000;
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Satu gelembung percakapan. o: { nama, waktu, status, url, lampLabel }. Semua nilai di-escape. */
export function gelembungHtml(m, o = {}) {
  const l = m.lampiran;
  const lamp = l && o.url
    ? (String(l.tipe).startsWith("image/")
      ? `<a class="psn-g-lamp" href="${esc(o.url)}" target="_blank" rel="noopener"><img class="psn-g-img" src="${esc(o.url)}" alt="${esc(l.nama)}" loading="lazy"></a>`
      : `<a class="psn-g-lamp psn-g-berkas" href="${esc(o.url)}" target="_blank" rel="noopener">${esc(l.nama)}</a>`)
    : "";
  return `<li class="psn-g psn-g-${m.dari === "admin" ? "admin" : "akun"}"><div class="psn-g-isi"><span class="psn-g-nama">${esc(o.nama)}</span><p class="psn-g-teks">${esc(m.isi)}</p>${lamp}<span class="psn-g-meta"><span>${esc(o.waktu)}</span>${o.status ? `<span>${esc(o.status)}</span>` : ""}</span></div></li>`;
}

/** Galat sisi klien sebelum kirim: kunci i18n atau null. */
export function periksaBerkas(f) {
  if (!f) return null;
  if (f.size > MAKS_BERKAS) return "ps.err.besar";
  if (!/^(image\/(png|jpeg|gif|webp)|application\/pdf)$/.test(f.type)) return "ps.err.tipe";
  return null;
}

/** Kirim ke rute pesan (multipart; x-pb untuk CSRF). Mengembalikan { ok, status, data }. */
export async function kirimForm(url, { isi, topik, utas, berkas }) {
  const fd = new FormData();
  fd.set("isi", isi);
  if (topik) fd.set("topik", topik);
  if (utas) fd.set("utas", utas);
  if (berkas) fd.set("berkas", berkas);
  let r;
  try { r = await fetch(url, { method: "POST", credentials: "same-origin", headers: { "x-pb": "1" }, body: fd }); } catch { return { ok: false, status: 0, data: null }; }
  let data = null;
  try { data = await r.json(); } catch { /* tanpa isi */ }
  return { ok: r.ok, status: r.status, data };
}
export const kunciGalat = (s) => (s === 413 ? "ps.err.besar" : s === 415 ? "ps.err.tipe" : s === 429 ? "ps.err.laju" : s === 422 ? "ps.err.isi" : "ps.err.umum");

/** Beritahu lencana (tab Pesan, ikon admin di navbar) bahwa jumlah belum dibaca berubah. */
export const umumkanBelum = (n) => document.dispatchEvent(new CustomEvent("pesan-belum", { detail: n }));
export const teksLencana = (n) => (n > 99 ? "99+" : String(n));
