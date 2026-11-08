/* Riwayat perubahan (G1). Komponen bersama:
   - diperbaruiHtml({jenis,id,nama,tgl}): "Diperbarui <tanggal>" + tombol Riwayat (dengan jumlah perubahan);
   - pasangRiwayat(akar): menghidupkan semua .jm-rw di dalam akar (jumlah + tanggal nyata dari indeks) dan membuka linimasa saat tombol diklik;
   - pasangPita(el): pita "Yang berubah minggu ini" (5 perubahan terpenting) untuk beranda.
   Data: /data/riwayat/entitas/<jenis>.json dan /data/riwayat/perubahan_terbaru.json (scripts/pipa/riwayat.mjs).
   INP: dialog terbuka seketika; isi linimasa menyusul setelah data datang. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { exHtml, sumberHtml } from "/inti/komponen.js";

if (!document.getElementById("rwCss")) document.head.append(Object.assign(document.createElement("link"), { id: "rwCss", rel: "stylesheet", href: "/inti/riwayat.css" }));

export const JENIS = ["organisasi", "orang", "proyek", "regulasi", "pendanaan", "berita", "inovasi", "program"];
export const IKON_DS = { organisasi: "gedung", orang: "orang", proyek: "proyek", regulasi: "regulasi", pendanaan: "kartu", berita: "berita", inovasi: "petir", program: "daftar" };
const IKON_MEDAN = { status: "status", kapasitas: "petir", kapasitas_mw: "petir", provinsi: "lokasi", kota: "lokasi", wilayah: "lokasi", logo: "gambar", foto: "gambar", pdf: "pdf", situs: "tautan", jabatan: "orang", pengurus: "orang", organisasi: "gedung", pemilik: "gedung", pemberi: "gedung", penerbit: "gedung", induk: "gedung", tanggal: "kalender", cod_target: "kalender", cod_aktual: "kalender", tahun: "tahun", tahun_berdiri: "tahun", selesai: "kalender", nama: "teks", judul: "teks", teknologi: "petir", nilai_usd: "kartu", kode_saham: "grafik" };
const BERKAS = new Set(["logo", "foto", "pdf"]); // nilainya alamat berkas: tampilkan ada/kosong, bukan alamatnya

const simpan = {};
const muat = (url) => (simpan[url] ||= fetch(url).then((r) => { if (!r.ok) throw new Error(url); return r.json(); }).catch((e) => { delete simpan[url]; throw e; }));
export const muatEntitas = (jenis) => muat(`/data/riwayat/entitas/${JENIS.includes(jenis) ? jenis : "proyek"}.json`);
export const muatTerbaru = () => muat("/data/riwayat/perubahan_terbaru.json");

const urlAman = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
/** Halaman profil sebuah entitas (null bila tidak ada halaman sendiri). */
export function hrefEntitas(jenis, id, u = "") {
  const e = encodeURIComponent(id);
  if (jenis === "organisasi") return "/o/" + e;
  if (jenis === "proyek") return "/p/" + e;
  if (jenis === "regulasi") return "/regulasi?id=" + e;
  if (jenis === "program") return "/program/" + e;
  if (jenis === "pendanaan") return "/investasi#peluang";
  if (jenis === "inovasi") return "/teknologi";
  if (jenis === "berita") return urlAman(u);
  return "";
}

const medanHtml = (m) => `<span class="jm-rw-medan">${ikon(IKON_MEDAN[m] || "tag", 16)}${esc(t(m === "lain" ? "rw.m.lain" : "rw.m." + m))}</span>`;
function nilaiHtml(m, a, b) {
  const v = (x) => (BERKAS.has(m) ? t(x ? "rw.v.ada" : "rw.v.kosong") : x || t("rw.v.kosong"));
  return `<p class="jm-rw-nilai"><del>${esc(v(a))}</del>${ikon("panah-kanan", 14)}<ins>${esc(v(b))}</ins></p>`;
}
/** Satu perubahan [tgl, jenis, medan, lama, baru, sumber] -> isi kartu (pil jenis + medan + nilai lama/baru + sumber). */
function perubahanHtml({ j, m, a, b, u }) {
  const sum = urlAman(u) ? `<a class="jm-rw-sum" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 14)}<span>${esc(t("rw.sumber"))}</span></a>` : "";
  const isi = j === "ubah" && m !== "lain" ? nilaiHtml(m, a, b) : `<p class="jm-rw-nilai">${esc(t(j === "tambah" ? "rw.j.tambah.d" : j === "hapus" ? "rw.j.hapus.d" : "rw.lain.d"))}</p>`;
  return `<div class="jm-rw-baris"><span class="jm-rw-j jm-rw-${esc(j)}">${esc(t("rw.j." + j))}</span>${j === "ubah" ? medanHtml(m) : ""}${sum}</div>${isi}`;
}
const dariLarik = ([tg, j, m, a, b, u]) => ({ t: tg, j, m, a, b, u });

/* ---------- dialog linimasa ---------- */
function dialog() {
  let d = document.getElementById("rwDlg");
  if (d) return d;
  d = Object.assign(document.createElement("dialog"), { id: "rwDlg", className: "jm-rw-dlg" });
  d.setAttribute("aria-labelledby", "rwJudul");
  d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-rw-tutup]")) d.close(); });
  document.body.append(d);
  return d;
}
function linimasaHtml(daftar, awal) {
  if (!daftar.length) return `<div class="jm-rw-kosong" role="status">${ikon("linimasa", 32)}<p><strong>${esc(t("rw.kosong"))}</strong></p><p>${esc(t("rw.kosong.d", { tgl: tanggal(awal) }))}</p></div>`;
  const per = new Map();
  for (const c of daftar) per.set(c.t, [...(per.get(c.t) || []), c]);
  return `<ol class="jm-rw-lini">${[...per].map(([tg, cs]) => `<li class="jm-rw-hari"><h3><span>${esc(tanggal(tg))}</span><small>${esc(t("rw.hari", { n: angka(cs.length) }))}</small></h3><ol>${cs.map((c) => `<li>${perubahanHtml(c)}</li>`).join("")}</ol></li>`).join("")}</ol>`;
}
export async function bukaRiwayat({ jenis, id, nama }) {
  const d = dialog();
  d.innerHTML = `<header class="jm-rw-kep"><span class="jm-rw-ik jm-rw-d-${esc(jenis)}">${ikon(IKON_DS[jenis] || "linimasa", 20)}</span><div><h2 id="rwJudul">${esc(t("rw.judul"))}</h2><p>${esc(nama || "")}</p></div><button type="button" class="jm-rw-x" data-rw-tutup aria-label="${esc(t("rw.tutup"))}">${ikon("silang", 20)}</button></header><div class="jm-rw-isi" id="rwIsi" aria-live="polite"><div class="jm-hantu" role="status"><i></i><i></i><i></i></div></div>`;
  if (!d.open) d.showModal();
  let html;
  try {
    const idx = await muatEntitas(jenis);
    html = linimasaHtml((idx.entitas[id] || []).map(dariLarik), idx.awal);
  } catch { html = `<div class="jm-rw-kosong" role="alert">${ikon("peringatan", 32)}<p><strong>${esc(t("rw.galat"))}</strong></p></div>`; }
  const isi = d.querySelector("#rwIsi");
  if (isi) isi.innerHTML = html;
}

/* ---------- "Diperbarui <tanggal>" + tombol ---------- */
export const diperbaruiHtml = ({ jenis, id, nama = "", tgl = "" }) => `<p class="jm-rw" data-rw-jenis="${esc(jenis)}" data-rw-id="${esc(id)}" data-rw-nama="${esc(nama)}" data-rw-tgl="${esc(String(tgl).slice(0, 10))}"><span class="jm-rw-tgl">${ikon("jam", 16)}<span data-rw-teks>${esc(tgl ? t("rw.diperbarui", { tgl: tanggal(String(tgl).slice(0, 10)) }) : "")}</span></span><button type="button" class="jm-rw-tb" data-rw-buka aria-haspopup="dialog">${ikon("linimasa", 16)}<span>${esc(t("rw.tombol"))}</span><b class="jm-rw-n" data-rw-n hidden></b></button></p>`;

const terpasang = new WeakSet();
/** Hidupkan semua .jm-rw di akar: klik membuka linimasa; jumlah dan tanggal terakhir diisi dari indeks entitas. */
export function pasangRiwayat(akar) {
  if (!akar) return Promise.resolve();
  if (!terpasang.has(akar)) {
    terpasang.add(akar);
    akar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-rw-buka]"), w = b?.closest(".jm-rw");
      if (w) bukaRiwayat({ jenis: w.dataset.rwJenis, id: w.dataset.rwId, nama: w.dataset.rwNama });
    });
  }
  const semua = [...akar.querySelectorAll(".jm-rw:not([data-rw-siap])")];
  return Promise.all(semua.map(async (w) => {
    w.dataset.rwSiap = "1";
    try {
      const idx = await muatEntitas(w.dataset.rwJenis), daftar = idx.entitas[w.dataset.rwId] || [];
      const tgl = daftar[0]?.[0] || w.dataset.rwTgl || idx.dibangun_pada;
      w.querySelector("[data-rw-teks]").textContent = t("rw.diperbarui", { tgl: tanggal(String(tgl).slice(0, 10)) });
      const n = w.querySelector("[data-rw-n]");
      if (daftar.length) { n.textContent = angka(daftar.length); n.hidden = false; }
    } catch { w.querySelector("[data-rw-buka]")?.setAttribute("hidden", ""); }
  }));
}

/* ---------- pita beranda ---------- */
const HARI_PITA = 7;
export function pilihPenting(perubahan, acuan, n = 5, hari = HARI_PITA) {
  const sejak = new Date(Date.parse(acuan) - hari * 86400000).toISOString().slice(0, 10);
  const calon = perubahan.filter((c) => c.t >= sejak && c.m !== "lain").sort((x, y) => y.w - x.w || y.t.localeCompare(x.t) || x.id.localeCompare(y.id));
  const hasil = [], pakai = new Set(), per = {};
  for (const c of calon) { if (hasil.length >= n) break; if ((per[c.d] || 0) >= 2 || pakai.has(c.d + c.id)) continue; hasil.push(c); pakai.add(c.d + c.id); per[c.d] = (per[c.d] || 0) + 1; }
  for (const c of calon) { if (hasil.length >= n) break; if (!hasil.includes(c)) hasil.push(c); }
  return { daftar: hasil, jumlah: calon.length };
}
export async function pasangPita(el) {
  if (!el) return;
  try {
    const d = await muatTerbaru(), { daftar, jumlah } = pilihPenting(d.perubahan, d.dibangun_pada);
    if (!daftar.length) { el.hidden = true; return; }
    const kartu = daftar.map((c) => {
      const h = hrefEntitas(c.d, c.id, c.u), nama = esc(c.n || c.id);
      return `<li class="jm-rw-d-${esc(c.d)}"><div class="jm-rw-atas"><span class="jm-rw-ik">${ikon(IKON_DS[c.d], 20)}</span><span class="jm-rw-j jm-rw-${esc(c.j)}">${esc(t("rw.j." + c.j))}</span></div>
        <div><p class="jm-rw-nama">${h ? `<a href="${esc(h)}">${nama}</a>` : nama}</p>${c.j === "ubah" ? `<p class="jm-rw-baris">${medanHtml(c.m)}</p>${nilaiHtml(c.m, c.a, c.b)}` : `<p class="jm-rw-nilai">${esc(t(c.j === "tambah" ? "rw.j.tambah.d" : "rw.j.hapus.d"))}</p>`}</div>
        <p class="jm-rw-ket">${ikon("jam", 14)}<span>${esc(tanggal(c.t))}</span><span>${esc(t("rw.d." + c.d))}</span></p></li>`;
    }).join("");
    const judul = esc(t("rw.pita.j", { n: "\u0001" })).replace("\u0001", `<span class="jm-hl">${esc(angka(jumlah))}</span>`);
    el.className = "jm-rw-pita";
    el.innerHTML = exHtml({ ikon: "linimasa", topik: t("rw.pita.ey"), judulHtml: judul, subHtml: esc(t("rw.pita.sub")), aksiHtml: sumberHtml(esc(t("rw.pita.sumber", { tgl: tanggal(d.dibangun_pada) }))), isiHtml: `<ul class="jm-rw-kisi">${kartu}</ul>` });
    el.hidden = false;
  } catch { el.hidden = true; }
}
