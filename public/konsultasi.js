/* Tab "Konsultasi" di /regulasi: forum diskusi anggota atas naskah RUU/RPP dan dokumen "Masukan METI". Daftar dokumen di sini; penampil di konsultasi_naskah.js.
   Seluruh isi awalH D1 lewat /api/konsultasi (situs di balik login). Posisi METI butir 1-22 TIDAK ada di public/data: hanya dimuat admin ke D1, terbaca anggota yang masuk.
   TAMPIL_POSISI tetap false: blok posisi statis publik tidak dipakai lagi. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, api, ikon, hantuHtml, kosongHtml, galatHtml, nanti } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { tombolIkuti, pasangIkuti } from "/inti/ikuti.js";
import { label, urlAman } from "/publik.js";

export const TAMPIL_POSISI = false;
if (!document.getElementById("kfCss")) document.head.insertAdjacentHTML("beforeend", '<link id="kfCss" rel="stylesheet" href="/konsultasi.css">');

const HAL = 9;
const IK_JENIS = { ruu: "palu", rpp: "regulasi", rperpres: "perisai", rpermen: "gedung", masukan: "surel" };
const KELAS_TAHAP = { pembahasan: "jm-pil-warn", konsultasi: "jm-pil-warn", disahkan: "jm-pil-ok" };
const inisial = (n) => (String(n || "?").trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("") || "?").toLocaleUpperCase();
const akar = document.getElementById("panelKonsultasi");
const S = { hal: 1, d: null, buka: null };

/** Hari menuju tenggat (tanggal kalender lokal): >0 lagi, 0 hari ini, <0 lewat. */
export function hariKe(tenggat, kini = new Date()) {
  const [y, m, d] = tenggat.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(kini.getFullYear(), kini.getMonth(), kini.getDate())) / 86400000);
}
const mundur = (tg) => { const n = hariKe(tg); return n > 0 ? t("kf.mundur", { n: angka(n) }) : n === 0 ? t("kf.hari_ini") : t("kf.lewat", { n: angka(-n) }); };

function kartu(r, kelola) {
  const tenggat = r.tenggat ? `<span class="jm-pil ${hariKe(r.tenggat) < 0 ? "" : "jm-pil-warn"}">${ikon("kalender", 14)}${esc(t("kons.tenggat"))}: ${esc(tanggal(r.tenggat))} (${esc(mundur(r.tenggat))})</span>` : `<span class="jm-pil">${ikon("kalender", 14)}${esc(t("kons.tenggat_belum"))}</span>`;
  const src = urlAman(r.sumber_url) ? `<a class="jm-tbl jm-tbl-kecil" href="${esc(r.sumber_url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("kons.sumber"))}</span></a>` : "";
  const av = r.peserta.map((p) => `<span class="kf-av" title="${esc(p.nama)}">${esc(inisial(p.nama))}</span>`).join("") + (r.n_peserta > r.peserta.length ? `<span class="kf-av kf-av-lebih">+${angka(r.n_peserta - r.peserta.length)}</span>` : "");
  const tanpaNaskah = r.bentuk === "naskah" && !r.n_bagian;
  return `<article class="kf-kartu"><header><span class="jm-lm-jn">${ikon(IK_JENIS[r.jenis] || "regulasi", 14)}${esc(t("kons.jenis." + r.jenis))}</span><h3>${esc(r.judul)}</h3>
    <div class="kf-meta"><span class="jm-pil ${KELAS_TAHAP[r.tahap] || ""}">${esc(label("kons.tahap.", r.tahap))}</span>${tenggat}<span class="jm-pil">${ikon("gedung", 14)}${esc(r.instansi || "-")}</span>${r.status !== "terbit" ? `<span class="jm-pil jm-pil-warn">${esc(t("kf.status_dok." + r.status))}</span>` : ""}</div></header>
    ${r.catatan ? `<p class="jm-bantu">${esc(r.catatan)}</p>` : ""}
    ${tanpaNaskah ? `<p class="kf-kosong-naskah">${ikon("info", 18)}<span>${esc(t("kf.naskah_belum"))}</span></p>` : ""}
    <ul class="kf-hitung"><li><b>${angka(r.n_komentar)}</b><span>${ikon("berita", 14)}${esc(t("kf.n_komentar"))}</span></li><li><b>${angka(r.n_usulan)}</b><span>${ikon("ubah", 14)}${esc(t("kf.n_usulan"))}</span></li><li><b>${angka(r.n_peserta)}</b><span>${ikon("orang", 14)}${esc(t("kf.n_peserta"))}</span></li></ul>
    <footer><div class="kf-avatar" aria-label="${esc(t("kf.n_peserta"))}">${av}</div><div class="kf-aksi">${src}${tombolIkuti({ jenis: "regulasi", id: "kons:" + r.id, nama: r.judul })}
      ${kelola ? `<button type="button" class="jm-tbl jm-tbl-kecil" data-kelola="${esc(r.id)}">${ikon("kunci", 16)}<span>${esc(t("kf.kelola"))}</span></button>` : ""}
      <button type="button" class="jm-tbl jm-tbl-utama jm-tbl-kecil" data-buka="${esc(r.id)}">${ikon("buku", 16)}<span>${esc(t("kf.buka_naskah"))}</span></button></div></footer></article>`;
}

function url(id) {
  const u = new URL(location.href);
  id ? u.searchParams.set("kd", id) : u.searchParams.delete("kd");
  u.searchParams.delete("kb");
  history.replaceState(null, "", u);
}

async function daftar() {
  S.buka = null; url(null);
  akar.innerHTML = hantuHtml(3);
  try { S.d = await api("/api/konsultasi"); }
  catch (e) { akar.innerHTML = e.kode === "fitur_belum_aktif" ? kosongHtml("kons.kosong") : galatHtml(e.kode || "layanan"); return; }
  gambar();
}
function gambar() {
  const { baris, kelola } = S.d, awalH = (S.hal - 1) * HAL;
  akar.innerHTML = `<p class="jm-bantu">${esc(t("kf.lead"))}</p>${kelola ? `<div class="kf-aksi"><button type="button" class="jm-tbl" data-kelola="">${ikon("tambah", 16)}<span>${esc(t("kf.dokumen_baru"))}</span></button></div>` : ""}`
    + (baris.length ? `<div class="kf-daftar">${baris.slice(awalH, awalH + HAL).map((r) => kartu(r, kelola)).join("")}</div><div class="kf-pag">${paginasiHtml({ hal: S.hal, total: baris.length, per: HAL, satuan: "kf.pag_dok" })}</div>` : kosongHtml("kons.kosong"));
  pasangIkuti(akar);
}
async function bukaDok(id, bagian = null) {
  S.buka = id; const u = new URL(location.href); u.searchParams.set("kd", id); history.replaceState(null, "", u);
  const { bukaDokumen } = await import("/konsultasi_naskah.js");
  await bukaDokumen(akar, id, { bagianAwal: bagian, tutup: daftar });
}

akar.addEventListener("click", async (e) => {
  let el;
  if ((el = e.target.closest("[data-hal]"))) { S.hal = Number(el.dataset.hal); sorotHalaman(el, S.hal); nanti(gambar); return; }
  if ((el = e.target.closest("[data-buka]"))) return bukaDok(el.dataset.buka);
  if ((el = e.target.closest("[data-kelola]"))) {
    const { bukaKelola } = await import("/konsultasi_kelola.js");
    return bukaKelola(S.d.baris.find((r) => r.id === el.dataset.kelola) || null, { selesai: daftar });
  }
  if (e.target.closest("[data-aksi=ulang]") && !S.buka) daftar();
});
document.addEventListener("jm:bahasa", () => { if (akar.isConnected && S.d && !S.buka) gambar(); });
const awal = new URLSearchParams(location.search);
if (awal.get("kd")) await bukaDok(awal.get("kd"), Number(awal.get("kb")) || null); else await daftar();
