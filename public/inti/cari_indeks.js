/* Pemuat indeks cari (G2): /data/cari/<jenis>.json dimuat malas per jenis (dibangun scripts/pipa/indeks_cari.mjs), dinormalkan sekali di sini.
   Dipakai palet (cari_global.js) dan halaman /cari (cari.js). Peringkat ada di cari_rumus.js. */
import { t } from "/i18n.js";
import { norm, jerami } from "/inti/cari_rumus.js";

/* urutan tampil; kunci i18n literal agar terbaca gerbang-i18n: [jenis, kunci kamus, ikon sprite] */
export const JENIS = [
  ["proyek", "cari.g.proyek", "proyek"], ["org", "cari.g.org", "direktori"], ["orang", "cari.g.orang", "orang"], ["reg", "cari.g.reg", "regulasi"],
  ["hukum", "cari.g.hukum", "palu"], ["topik", "cari.g.topik", "topik"], ["pakar", "cari.g.pakar", "wisuda"], ["inovasi", "cari.g.inovasi", "petir"],
  ["pendanaan", "cari.g.pendanaan", "kartu"], ["istilah", "cari.g.istilah", "buku"], ["program", "cari.g.program", "kompas"], ["pustaka", "cari.g.pustaka", "buku"], ["berita", "cari.g.berita", "berita"],
  ["wilayah", "cari.g.wilayah", "wilayah"], ["halaman", "cari.g.halaman", "tautan"],
];
const sedia = new Map();   // jenis -> Promise<butir[]>
const ratakan = (a) => a.map((e) => { const judul = e.k ? t(e.k) : e.j; return { g: e.g, judul, sub: e.s || "", href: e.u, j: norm(judul), h: jerami(judul, e.s, e.x), tek: e.t, st: e.st, logo: !!e.l, lambang: e.p, luar: !!e.e, bukti: e.b }; });

/** Muat satu jenis (cache). Gagal -> Promise ditolak dan cache dibuang agar bisa dicoba lagi. */
export function muatJenis(g) {
  if (!sedia.has(g)) sedia.set(g, fetch(`/data/cari/${g}.json`).then((r) => { if (!r.ok) throw new Error(g); return r.json(); }).then((a) => ratakan(a.map((e) => ({ ...e, g })))).catch((x) => { sedia.delete(g); throw x; }));
  return sedia.get(g);
}
/** Muat beberapa jenis paralel; `tiap(g, butir)` dipanggil begitu satu jenis tiba (render bertahap). Mengembalikan butir yang berhasil dimuat. */
export async function muatBanyak(jenis, tiap) {
  const hasil = await Promise.allSettled(jenis.map((g) => muatJenis(g).then((a) => { tiap?.(g, a); return a; })));
  return { butir: hasil.flatMap((h) => (h.status === "fulfilled" ? h.value : [])), gagal: hasil.filter((h) => h.status === "rejected").length };
}
