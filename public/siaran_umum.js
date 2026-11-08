/* Siaran pers METI: pembantu bersama halaman daftar (/siaran-pers) dan rinci (/siaran-pers/<id>). Data: /data/siaran_pers.json. */
import { t, tanggal } from "/i18n.js";
import { esc, ikon, fotoBerita, api } from "/inti/umum.js";
import { bagikanHtml } from "/inti/komponen.js";
import { muat, label, urlAman } from "/publik.js";
import { logoLokal } from "/inti/nama_media.js";

export const JENIS = ["siaran_pers", "liputan_media", "liputan_kegiatan"];
export const IKON_JENIS = { siaran_pers: "siaran", liputan_media: "berita", liputan_kegiatan: "kalender" };
/* butir D1 (admin, /api/berita-meti): liputan media menuju tautan asli; selain itu isi dibuka di dialog halaman daftar (rute rinci hanya mengenal data statis) */
export const luar = (r) => !!(r._d1 && r.jenis === "liputan_media" && r.url_sumber);
export const urlRinci = (r) => (r._d1 ? (luar(r) ? urlAman(r.url_sumber) : "/siaran-pers?buka=" + encodeURIComponent(r.id)) : "/siaran-pers/" + encodeURIComponent(r.id));
export const atrTaut = (r) => (luar(r) ? ' target="_blank" rel="noopener noreferrer"' : r._d1 ? ` data-sp-buka="${esc(r.id)}"` : "");
/** Liputan media berjudul berawalan nama media: "Katadata | Judul". */
export const judulKartu = (r) => (r.jenis === "liputan_media" ? `${r.media} | ${r.judul}` : r.judul);
export const topikLabel = (k) => label("brt.tek.", k);

const kunciJudul = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const kunciUrl = (u) => String(u || "").toLowerCase().replace(/^https?:[/][/](www[.])?/, "").replace(/[?#].*$/, "").replace(/[/]+$/, "");
/** Butir terbit dari admin; galat API = diam (daftar statis tetap tampil). Butir yang sudah ada di data statis (url atau judul sama) dibuang. */
async function butirAdmin(statis) {
  let d;
  try { d = await api("/api/berita-meti"); } catch { return []; }
  const l = Array.isArray(d) ? d : (d && d.baris) || [];
  const u = new Set(statis.map((r) => kunciUrl(r.url_sumber)).filter(Boolean)), j = new Set(statis.map((r) => kunciJudul(r.judul)));
  return l.filter((x) => x && Number(x.terbit) === 1 && x.ref && JENIS.includes(x.jenis) && /^\d{4}-\d{2}-\d{2}/.test(x.tanggal || "")
    && !(x.url && u.has(kunciUrl(x.url))) && !j.has(kunciJudul(x.judul)))
    .map((x) => ({ id: String(x.ref), jenis: x.jenis, judul: x.judul, tanggal: x.tanggal.slice(0, 10), kota: x.kota || "", foto: x.foto || "", galeri: [], media: x.media || "METI", url_sumber: x.url || "",
      penulis: x.penulis || "", ringkasan: x.ringkasan || "", isi: [], topik: [], org_ids: [], _d1: true }));
}

export async function muatSiaran() {
  const [d, foto] = await Promise.all([muat("siaran_pers"), muat("berita_foto").catch(() => ({}))]);
  const tambahan = await butirAdmin(d.baris);
  const baris = [...d.baris, ...tambahan].map((r) => ({ ...r, _tahun: r.tanggal.slice(0, 4) })).sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.id.localeCompare(b.id));
  return { baris, foto: foto || {}, dibangun: d.dibangun_pada };
}

export const urlFoto = (r, foto) => r.foto || fotoBerita(foto, r.id);
/** Sampul cadangan bila tanpa foto atau foto gagal dimuat: logo plus nama media di atas gradasi. */
export const cadanganHtml = (r) => {
  const lg = r.jenis === "siaran_pers" ? "/img/logo-meti-tanda.png" : logoLokal(r.url_sumber || r.media);
  return `<span class="sp-cadangan"><span class="sp-cad-lg">${lg ? `<img src="${esc(lg)}" alt="" width="40" height="40" loading="lazy" data-galat="hapus">` : ""}<span class="sp-cad-ik">${ikon(IKON_JENIS[r.jenis] || "berita", 24)}</span></span><b>${esc(r.media)}</b></span>`;
};
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
  /* pemilik 8 Nov 2026: jenis dan tanggal menumpang di foto */
  const lapis = `<span class="sp-lapis">${jenisHtml(r)}<time class="sp-tgl" datetime="${esc(r.tanggal)}">${ikon("kalender", 14)}${esc(tanggal(r.tanggal))}</time></span>`;
  return `<li class="sp-kartu" data-sp-id="${esc(r.id)}"><div class="sp-foto-bk"><a class="sp-foto-a" href="${esc(href)}"${atrTaut(r)} tabindex="-1" aria-hidden="true">${sampulHtml(r, foto)}</a>${lapis}</div>
<div class="sp-isi"><h3 class="sp-judul"><a href="${esc(href)}"${atrTaut(r)}>${esc(j)}</a></h3>${r.kota ? `<p class="sp-meta"><span>${ikon("lokasi", 14)}${esc(r.kota)}</span></p>` : ""}<p class="sp-cuplikan">${esc(cuplikan(r))}</p>
<div class="sp-kaki"><a class="sp-lagi" href="${esc(href)}"${atrTaut(r)}>${esc(t("sp.selengkapnya"))}${ikon("panah-kanan", 16)}</a>${bagikanHtml({ url: href, judul: j, kelas: "kecil" })}</div></div></li>`;
}
