/* Tampilan profil anggota (dipakai /profil-saya sebagai kepala dan /anggota/<id> sebagai halaman penuh).
   Semua nilai dari server di-escape; tautan hanya http(s). Bagian yang tak dikirim server (privasi) tidak digambar. */
import { t, ada } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { IKON_TEK } from "/inti/ikon_tek.js";

export const JENIS = ["pendidikan", "pengalaman", "sertifikasi", "publikasi"];
const IK_JENIS = { pendidikan: "buku", pengalaman: "linimasa", sertifikasi: "perisai", publikasi: "regulasi" };

export const inisial = (nama) => ([...String(nama || "").trim().split(/\s+/).slice(0, 2).map((w) => [...w][0] || "")].join("") || "?").toUpperCase();

/** Isi lingkaran foto: inisial dulu, foto menimpa saat terbaca (galat = tetap inisial). v = penanda versi foto dari server (kosong = tanpa foto). */
export const fotoIsi = (id, nama, v) =>
  `<span class="pf-ini">${esc(inisial(nama))}</span>${v ? `<img src="/api/profil/${esc(id)}/foto?v=${esc(v)}" alt="" hidden>` : ""}`;
export const fotoHtml = (id, nama, v, kelas = "") => `<span class="pf-foto ${kelas}" aria-hidden="true">${fotoIsi(id, nama, v)}</span>`;

/** Satu kali per halaman: foto yang terbaca ditampilkan, yang gagal dibuang. */
export function pasangFoto(akar = document) {
  akar.addEventListener("load", (e) => { if (e.target.matches?.(".pf-foto img")) { e.target.hidden = false; e.target.previousElementSibling?.setAttribute("hidden", ""); } }, true);
  akar.addEventListener("error", (e) => { if (e.target.matches?.(".pf-foto img")) e.target.remove(); }, true);
}

let petaProv = null;
export async function namaProvinsi() {
  if (!petaProv) {
    petaProv = fetch("/data/meti-wilayah.json").then((r) => r.json()).then((d) => d.provinsi.map((p) => [p.kode, p.nama])).catch(() => []);
  }
  return petaProv;
}

export const labelKeahlian = (k) => (ada("pj.tek." + k) ? t("pj.tek." + k) : k);
export const pilKeahlian = (k) => `<span class="pf-pil">${IKON_TEK[k] || ikon("topik", 14)}<span>${esc(labelKeahlian(k))}</span></span>`;

const aman = (u) => (/^https?:\/\//i.test(u) ? esc(u) : "");
const taut = (u, ik, teks) => (aman(u) ? `<a class="pf-taut" href="${aman(u)}" target="_blank" rel="noopener noreferrer nofollow">${ikon(ik, 18)}<span>${esc(teks)}</span></a>` : "");

/** Satu baris riwayat sebagai teks bersih: [utama, sampingan]. */
export function riwayatBaris(jenis, x) {
  const th = (a) => (a ? String(a) : "");
  if (jenis === "pendidikan") return [[t("pf.jenjang." + x.jenjang), x.kampus].filter(Boolean).join(", "), [x.jurusan, th(x.tahun)].filter(Boolean).join(", ")];
  if (jenis === "pengalaman") return [x.jabatan, [x.organisasi, x.mulai ? `${x.mulai} - ${x.selesai || t("pf.sekarang")}` : ""].filter(Boolean).join(", ")];
  if (jenis === "sertifikasi") return [x.nama, [x.penerbit, th(x.tahun)].filter(Boolean).join(", ")];
  return [x.judul, th(x.tahun)];
}
const riwayatItem = (jenis, x) => {
  const [a, b] = riwayatBaris(jenis, x);
  const tautan = jenis === "publikasi" && x.proyek_id ? `<a class="pf-taut pf-taut-kecil" href="/p/${encodeURIComponent(x.proyek_id)}">${ikon("proyek", 14)}<span>${esc(t("pf.lihat_proyek"))}</span></a>` : "";
  return `<li><b>${esc(a)}</b>${b ? `<span>${esc(b)}</span>` : ""}${tautan}</li>`;
};
export const riwayatDaftarHtml = (jenis, daftar) =>
  daftar.length ? `<ul class="pf-riwayat">${daftar.map((x) => riwayatItem(jenis, x)).join("")}</ul>` : `<p class="pf-kosong">${esc(t("pf.riwayat.kosong"))}</p>`;

/** Kepala halaman: foto besar, nama, jabatan + instansi, lencana anggota METI. */
export function isiKepala(p, { judulTetap = false } = {}) {
  const el = (id) => document.getElementById(id);
  el("pfFotoKepala").innerHTML = fotoIsi(p.id, p.nama, p.foto);
  const h1 = el("judul");
  if (!judulTetap) { h1.removeAttribute("data-i18n"); h1.textContent = [p.gelar, p.nama].filter(Boolean).join(" "); document.title = `${h1.textContent} | ${t("ag.situs")}`; }
  const sub = [p.jabatan, p.instansi].filter(Boolean);
  const subEl = el("pfSub");
  if (sub.length || !judulTetap) { subEl.removeAttribute("data-i18n"); subEl.textContent = sub.join(", "); subEl.hidden = !sub.length; }
  el("pfLencana").innerHTML = p.kta
    ? `<span class="pf-lencana-meti" title="${esc(t("pf.lencana.ket"))}">${ikon("qr", 16)}<span>${esc(t("pf.lencana"))}${p.kta.tahun_masuk ? ` ${esc(t("pf.sejak", { th: p.kta.tahun_masuk }))}` : ""}</span></span>` : "";
}

const kartu = (ik, kunci, isi) => exHtml({ ikon: ik, judulHtml: esc(t(kunci)), isiHtml: isi, tingkat: "h2", kelas: "pf-ex" });

/** Isi halaman baca-saja. prov = [[kode, nama], ...]. Bagian yang tak ada di p tidak digambar. */
export function tampilHtml(p, prov) {
  const bagian = [];
  const namaProv = (prov.find(([k]) => k === p.kode_prov) || [])[1];
  if (p.bio) bagian.push(kartu("info", "pf.bag.bio", `<p class="pf-bio">${esc(p.bio)}</p>`));
  const kerja = [];
  if (p.jabatan || p.instansi || p.gelar) {
    const ins = p.instansi ? (p.organisasi_id ? `<a class="pf-taut" href="/o/${encodeURIComponent(p.organisasi_id)}">${ikon("direktori", 18)}<span>${esc(p.instansi)}</span></a>` : `<span>${esc(p.instansi)}</span>`) : "";
    kerja.push(`<div class="pf-baris"><b>${esc(p.jabatan || "")}</b>${ins}</div>`);
  }
  const lokasi = [p.kota, namaProv].filter(Boolean).join(", ");
  if (lokasi) kerja.push(`<p class="pf-baris pf-lokasi">${ikon("lokasi", 18)}<span>${esc(lokasi)}</span></p>`);
  if (kerja.length) bagian.push(kartu("direktori", "pf.bag.pekerjaan", kerja.join("")));
  if (p.keahlian?.length) bagian.push(kartu("topik", "pf.bag.keahlian", `<div class="pf-pils">${p.keahlian.map(pilKeahlian).join("")}</div>`));
  const tautan = p.tautan ? [taut(p.tautan.linkedin, "linkedin", "LinkedIn"), taut(p.tautan.situs, "tautan", t("pf.situs"))].filter(Boolean) : [];
  if (tautan.length) bagian.push(kartu("tautan", "pf.bag.tautan", `<div class="pf-tauts">${tautan.join("")}</div>`));
  if (p.kontak && (p.kontak.surel || p.kontak.telepon)) {
    const sur = p.kontak.surel ? `<a class="pf-taut" href="mailto:${esc(p.kontak.surel)}">${ikon("surel", 18)}<span>${esc(p.kontak.surel)}</span></a>` : "";
    const tel = p.kontak.telepon ? `<a class="pf-taut" href="tel:${esc(p.kontak.telepon.replace(/[^0-9+]/g, ""))}">${ikon("tautan", 18)}<span>${esc(p.kontak.telepon)}</span></a>` : "";
    bagian.push(kartu("surel", "pf.bag.kontak", `<div class="pf-tauts">${sur}${tel}</div>`));
  }
  if (p.riwayat) {
    for (const j of JENIS) if (p.riwayat[j]?.length) bagian.push(kartu(IK_JENIS[j], "pf.jenis." + j, riwayatDaftarHtml(j, p.riwayat[j])));
  }
  return bagian.join("") || `<p class="pf-kosong">${esc(t("ag.kosong"))}</p>`;
}
