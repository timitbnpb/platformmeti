/* Siaran pers METI: pembantu bersama halaman daftar (/siaran-pers) dan rinci (/siaran-pers/<id>). Data: /data/siaran_pers.json. */
import { t, tanggal } from "/i18n.js";
import { esc, ikon, fotoBerita } from "/inti/umum.js";
import { bagikanHtml } from "/inti/komponen.js";
import { muat, label } from "/publik.js";

export const JENIS = ["siaran_pers", "liputan_media", "liputan_kegiatan"];
export const IKON_JENIS = { siaran_pers: "siaran", liputan_media: "berita", liputan_kegiatan: "kalender" };
export const urlRinci = (r) => "/siaran-pers/" + encodeURIComponent(r.id);
/** Liputan media berjudul berawalan nama media: "Katadata | Judul". */
export const judulKartu = (r) => (r.jenis === "liputan_media" ? `${r.media} | ${r.judul}` : r.judul);
export const topikLabel = (k) => label("brt.tek.", k);

export async function muatSiaran() {
  const [d, foto] = await Promise.all([muat("siaran_pers"), muat("berita_foto").catch(() => ({}))]);
  const baris = d.baris.map((r) => ({ ...r, _tahun: r.tanggal.slice(0, 4) })).sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.id.localeCompare(b.id));
  return { baris, foto: foto || {}, dibangun: d.dibangun_pada };
}

export const urlFoto = (r, foto) => r.foto || fotoBerita(foto, r.id);
/** Sampul cadangan bila tanpa foto atau foto gagal dimuat: logo plus nama media di atas gradasi. */
export const cadanganHtml = (r) => `<span class="sp-cadangan"><img src="/img/logo-meti-tanda.png" width="40" height="38" alt="" loading="lazy"><b>${esc(r.media)}</b></span>`;
export const sampulHtml = (r, foto, kelas = "sp-foto") => {
  const u = urlFoto(r, foto);
  return `<span class="${kelas}">${u ? `<img class="sp-img" src="${esc(u)}" alt="" loading="lazy" decoding="async">` : cadanganHtml(r)}</span>`;
};
/** Foto yang gagal dimuat (host media menolak, id kedaluwarsa) diganti sampul cadangan. */
export function pasangGalatFoto(akar = document) {
  akar.addEventListener("error", (e) => {
    const i = e.target;
    if (i.tagName !== "IMG" || !i.classList.contains("sp-img")) return;
    const kotak = i.closest("[data-sp-id]"), r = kotak && window.__spMedia?.get(kotak.dataset.spId);
    i.outerHTML = r ? cadanganHtml(r) : "";
  }, true);
}

export const cuplikan = (r) => {
  if (r.ringkasan) return r.ringkasan;
  const p = (r.isi || []).find((x) => x.p);
  return p ? p.p.slice(0, 220) : "";
};
export const metaHtml = (r) => `<p class="sp-meta"><time datetime="${esc(r.tanggal)}">${esc(tanggal(r.tanggal))}</time>${r.kota ? `<span>${esc(r.kota)}</span>` : ""}</p>`;
export const jenisHtml = (r) => `<span class="sp-jenis">${ikon(IKON_JENIS[r.jenis], 14)}${esc(t("sp.jenis." + r.jenis))}</span>`;

/** Kartu kisi: foto, jenis, judul, tanggal, cuplikan dua baris, Selengkapnya, bagikan. */
export function kartuHtml(r, foto) {
  const href = urlRinci(r), j = judulKartu(r);
  return `<li class="sp-kartu" data-sp-id="${esc(r.id)}"><a class="sp-foto-a" href="${esc(href)}" tabindex="-1" aria-hidden="true">${sampulHtml(r, foto)}</a>
<div class="sp-isi">${jenisHtml(r)}<h3 class="sp-judul"><a href="${esc(href)}">${esc(j)}</a></h3>${metaHtml(r)}<p class="sp-cuplikan">${esc(cuplikan(r))}</p>
<div class="sp-kaki"><a class="sp-lagi" href="${esc(href)}">${esc(t("sp.selengkapnya"))}${ikon("panah-kanan", 16)}</a>${bagikanHtml({ url: href, judul: j, kelas: "kecil" })}</div></div></li>`;
}
