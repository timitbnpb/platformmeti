/* Kepala halaman standar (.jm-kh): sisi kanan TIDAK BOLEH kosong (aturan pemilik). Prioritas: (a) ubin angka, (b) gambar halaman/entitas, (c) kartu fakta berikon.
   khUbin(id, items)  : isi wadah .jm-kh-ubin yang sudah ada. items: [{ikon, nilai, satuan?, label}]
   khSisi(kh, {ubin|gambar|fakta, aksi?}) : pasang sisi kanan ke dalam .jm-kh (elemen atau selector); membuang .jm-kh-satu. */
import { esc, ikon } from "/inti/umum.js";
import { t } from "/i18n.js";

export function khUbin(id, items) {
  const el = document.getElementById(id);
  if (el) el.style.gridTemplateColumns = `repeat(${items.length}, minmax(0, 1fr))`;
  if (el) el.innerHTML = items.map((u) => `<div class="jm-kh-ub"><span class="jm-kpi-ik">${ikon(u.ikon, 18)}</span><p class="jm-kh-angka"><b>${esc(u.nilai)}</b>${u.satuan ? `<span>${esc(u.satuan)}</span>` : ""}</p><p class="jm-kh-lbl">${esc(u.label)}</p></div>`).join("");
}

/** Gambar berlatar gradien brand + batik. {src?, alt?, logo?, judul?, cap?}: tanpa src tampil logo/judul di atas gradien. */
export const khGambarHtml = ({ src = "", alt = "", logo = "", judul = "", cap = "", poster = false }) =>
  `<figure class="jm-kh-gambar jm-batik${poster ? " jm-kh-poster" : ""}">${src ? `<img class="jm-kh-foto" src="${esc(src)}" alt="${esc(alt)}" data-galat="hapus" loading="eager" decoding="async">` : ""}${logo || judul ? `<span class="jm-kh-lencana${src ? " jm-kh-lencana-pojok" : ""}">${logo ? `<img src="${esc(logo)}" alt="" width="40" height="40" data-galat="hapus" loading="eager" decoding="async">` : ""}${judul ? `<b>${esc(judul)}</b>` : ""}</span>` : ""}${cap ? `<figcaption>${esc(cap)}</figcaption>` : ""}</figure>`;

/** Kartu fakta berikon. items: [{ikon, label, nilai, href?}] (nilai kosong dilewati). */
export const khFaktaHtml = (items) => `<dl class="jm-kh-fakta">${items.filter((f) => f && f.nilai).map((f) => `<div class="jm-kh-fk"><span class="jm-kpi-ik">${ikon(f.ikon, 18)}</span><div><dt>${esc(f.label)}</dt><dd>${f.href ? `<a href="${esc(f.href)}"${/^https?:/i.test(f.href) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(f.nilai)}</a>` : esc(f.nilai)}</dd></div></div>`).join("")}</dl>`;

/** Pasang sisi kanan. Pilih yang pertama ada: ubin, gambar, fakta. aksi = HTML tombol (bagikan, baca sumber) di bawah gambar/fakta. */
export function khSisi(kh, { ubin, gambar, fakta, aksi = "" } = {}) {
  const el = typeof kh === "string" ? document.querySelector(kh) : kh;
  if (!el) return null;
  el.querySelector(":scope > .jm-kh-sisi")?.remove();
  let isi = "";
  if (ubin && ubin.length) isi = `<div class="jm-kh-ubin">${ubin.map((u) => `<div class="jm-kh-ub"><span class="jm-kpi-ik">${ikon(u.ikon, 18)}</span><p class="jm-kh-angka"><b>${esc(u.nilai)}</b>${u.satuan ? `<span>${esc(u.satuan)}</span>` : ""}</p><p class="jm-kh-lbl">${esc(u.label)}</p></div>`).join("")}</div>`;
  else if (gambar) isi = khGambarHtml(gambar);
  else if (fakta && fakta.some((f) => f && f.nilai)) isi = khFaktaHtml(fakta);
  if (!isi && !aksi) return null;
  const s = document.createElement("div");
  s.className = "jm-kh-sisi";
  s.innerHTML = isi + (aksi ? `<div class="jm-kh-aksi">${aksi}</div>` : "");
  s.querySelector(".jm-kh-ubin")?.style.setProperty("grid-template-columns", `repeat(${ubin.length}, minmax(0, 1fr))`);
  el.append(s);
  el.classList.remove("jm-kh-satu");
  return s;
}

/* Kepala statis tanpa data sendiri: atribut data-kh-tautan="profil,kta" pada .jm-kh diisi kartu fakta tautan terkait (dipanggil kepala.js sesudah bahasa siap). */
const TAUTAN = {
  profil: ["orang", "kh.akun", "kh.t.profil", "/profil-saya"], kta: ["kartu", "kh.keanggotaan", "kh.t.kta", "/kta"],
  diikuti: ["lonceng", "kh.pembaruan", "kh.t.diikuti", "/diikuti"], langganan: ["surel", "kh.surel", "kh.t.langganan", "/langganan"],
  direktori: ["direktori", "kh.jelajah", "kh.t.direktori", "/direktori"], proyek: ["proyek", "kh.data", "kh.t.proyek", "/proyek"],
  mw: ["wilayah", "kh.jaringan", "kh.t.mw", "/meti-wilayah"], wilayah: ["peta", "kh.peta", "kh.t.wilayah", "/wilayah"],
  anggota: ["orang", "kh.orang", "kh.t.anggota", "/anggota"], kalender: ["kalender", "kh.agenda", "kh.t.kalender", "/kalender"],
  siaran: ["siaran", "kh.media", "kh.t.siaran", "/siaran-pers"], berita: ["berita", "kh.media", "kh.t.berita", "/berita"],
  pustaka: ["buku", "kh.data", "kh.t.pustaka", "/pustaka"], galeri: ["gambar", "kh.media", "kh.t.galeri", "/galeri"],
};
export function khTautanOtomatis() {
  for (const el of document.querySelectorAll(".jm-kh[data-kh-tautan]")) {
    const fakta = el.dataset.khTautan.split(",").map((k) => TAUTAN[k.trim()]).filter(Boolean).map(([ik, l, n, href]) => ({ ikon: ik, label: t(l), nilai: t(n), href }));
    khSisi(el, { fakta });
  }
}
