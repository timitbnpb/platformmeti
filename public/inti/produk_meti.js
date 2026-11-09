/* Produk METI: dokumen dan keluaran kerja METI yang sudah publik (/data/produk_meti.json, dibangun scripts/pipa/produk_meti.mjs).
   Satu sumber, dua pemakai: halaman /produk-meti (daftar penuh) dan komponen "Produk METI terkait" yang disisipkan di halaman lain.
   Pencocokan: { j: "isu"|"program"|"reg"|"tek"|"bidang", k: kode } menurut topik, atau { halaman: "beranda"|... } menurut tempat.
   Pakai: pasangProdukTerkait("wadahId", { j: "isu", k: "ruu-ebet" }). INP: tanpa kontrol, hanya tautan. */
import { t, tanggal, bahasa, bahasaData } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { exHtml, lihatSemuaHtml } from "/inti/komponen.js";
import { rumahTek } from "/inti/rumah_tek.js";

export const JENIS = ["masukan", "roadmap", "siaran", "sikap", "profil"];
export const IKON_JENIS = { masukan: "palu", roadmap: "kompas", siaran: "siaran", sikap: "mikrofon", profil: "buku" };
const RUTE = { isu: (k) => "/isu#" + encodeURIComponent(k), program: (k) => "/program/" + encodeURIComponent(k), reg: (k) => "/regulasi?id=" + encodeURIComponent(k), tek: rumahTek, bidang: (k) => "/bidang/" + k };
const IKON_TAUT = { isu: "peringatan", program: "bintang", reg: "regulasi", tek: "tek-surya", bidang: "direktori" };
export const L = (o) => (o && (o[bahasaData()] ?? o.id)) || "";
const luar = (u) => /^https?:\/\//.test(u);
/* "2026-06" (bulan saja) tampil bulan dan tahun */
export const tgl = (s) => (/^\d{4}-\d{2}$/.test(s) ? tanggal(s + "-01", { gaya: "panjang" }).replace(/^\d+ /, "") : tanggal(s, { gaya: "panjang" }));
export const hrefProduk = (p) => p.buka || p.sumber.url;

let P = null;
export const muatProduk = () => (P ??= fetch("/data/produk_meti.json").then((r) => { if (!r.ok) throw new Error("produk_meti"); return r.json(); }).catch(() => { P = null; return { baris: [] }; }));
export const cocok = (p, { j, k, halaman }) => (halaman ? p.halaman.includes(halaman) : p.terkait.some((x) => x.j === j && x.k === k));

/* gaya komponen dimuat sekali oleh komponen sendiri, jadi halaman penyisip tidak perlu menautkannya */
let gayaP = null;
const gaya = () => (gayaP ??= new Promise((ok) => {
  if (document.querySelector('link[href="/inti/produk_meti.css"]')) return ok();
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = "/inti/produk_meti.css"; l.onload = l.onerror = () => ok();
  document.head.append(l);
  setTimeout(ok, 1500);
}));

const pilJenis = (p) => `<span class="jm-pil pm-pil">${ikon(IKON_JENIS[p.jenis], 14)}<span>${esc(t("prm.jenis." + p.jenis))}</span></span>${p.status ? `<span class="jm-pil jm-pil-warn">${esc(t("prm.status." + p.status))}</span>` : ""}`;
const sumberNama = (p) => (luar(p.sumber.url) ? p.sumber.label : t("prm.di_platform"));

/* kartu ringkas (satu tautan; komponen terkait) */
export const kartuRingkas = (p) => {
  const h = hrefProduk(p), kl = luar(h);
  return `<li class="pm-kt"><a class="pm-kt-a" href="${esc(h)}"${kl ? ' target="_blank" rel="noopener noreferrer"' : ""}>
    <span class="pm-meta">${pilJenis(p)}<time datetime="${esc(p.tanggal)}">${esc(tgl(p.tanggal))}</time></span>
    <b class="pm-j">${esc(L(p.judul))}</b>
    <span class="pm-sb">${esc(sumberNama(p))}${kl ? ikon("tautan", 14) : ""}</span></a></li>`;
};

export async function produkTerkaitHtml(spec, { maks = 6, tingkat = "h2" } = {}) {
  const [d] = await Promise.all([muatProduk(), gaya()]);
  const a = d.baris.filter((p) => cocok(p, spec)).slice(0, maks);
  if (!a.length) return "";
  return exHtml({ id: "produk-meti", ikon: "lencana", topik: t("prm.ey"), judulHtml: esc(t("prm.terkait")), subHtml: esc(t("prm.terkait.sub")), tingkat, kelas: "pm-ex",
    isiHtml: `<ul class="pm-kisi">${a.map(kartuRingkas).join("")}</ul>`, kakiHtml: lihatSemuaHtml("/produk-meti", t("prm.semua")) });
}

/* pasang di wadah (elemen atau id); kosong = wadah disembunyikan; ikut berganti bahasa */
export function pasangProdukTerkait(wadah, spec, opsi) {
  const el = typeof wadah === "string" ? document.getElementById(wadah) : wadah;
  if (!el) return;
  const gambar = async () => {
    if (!el.isConnected) { document.removeEventListener("jm:bahasa", gambar); return; }
    const h = await produkTerkaitHtml(spec, opsi);
    if (!el.isConnected) return;
    el.innerHTML = h; el.hidden = !h;
  };
  gambar();
  document.addEventListener("jm:bahasa", gambar);
}

/* label tautan topik; isu/reg/program memakai nama dari data, tek dan bidang dari kamus */
export function topikTaut(x) {
  const nama = x.j === "tek" ? t("tk.nama." + x.k) : x.j === "bidang" ? t("bid.n." + x.k) : L(x);
  return { href: RUTE[x.j](x.k), nama, ik: IKON_TAUT[x.j] };
}
export { bahasa };
