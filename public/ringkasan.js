/* /ringkasan: ringkasan eksekutif nasional, satu halaman siap cetak, dari /data/ringkasan_eksekutif.json (scripts/pipa/ringkasan_eksekutif.mjs).
   Delapan angka kunci berlabel bukti dan sumber, perubahan bulan ini, lima temuan bernomor, peta mini provinsi; cetak/PDF dan bagikan.
   Semua teks dari kamus (re2.*). Angka tanpa sumber tidak tampil. INP: cetak hanya menandai kelas lalu memanggil print. */
import { khUbin } from "/inti/kh.js";
import "/inti/tip_grafik.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, hantuHtml } from "/inti/umum.js";
import { exHtml, bagikanHtml, sumberHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { jalurPerProvinsi } from "/inti/peta_indonesia.js";
import { muatData, tampilGalat, saatBahasa, amanUrl } from "/analisis.js";

const $ = (id) => document.getElementById(id);
const S = { d: null, geo: null };
const fmt = (v, d = 0) => angka(v, { desimal: d });
const KELAS_BUKTI = { resmi: "jm-pil-ok", "via-pihak-ketiga": "jm-pil", campuran: "jm-pil", riset: "jm-pil", est: "jm-pil-warn" };
const DESIMAL = { kapasitas: 0, bauran: 1, investasi: 1, proyek: 0, regulasi: 0, kerja: 0, modul: 2, emisi: 1 };

const urlSumber = (u) => (u && u.startsWith("/") ? u : amanUrl(u));
function sumberIsi(a) {
  const s = a.sumber, u = urlSumber(s.url);
  const judul = esc(s.judul), tautan = u ? `<a href="${esc(u)}"${u.startsWith("/") ? "" : ' target="_blank" rel="noopener noreferrer"'}>${judul}</a>` : judul;
  return [tautan, s.penerbit && esc(s.penerbit), s.halaman && esc(s.halaman), esc(t("re2.tahun", { tahun: a.tahun })), esc(t("re2.diperiksa", { tanggal: tanggal(S.d.dibangun_pada) }))].filter(Boolean).join("; ");
}
const buktiPil = (tingkat) => `<span class="jm-pil ${KELAS_BUKTI[tingkat] || "jm-pil"}">${esc(t("re2.bukti." + tingkat))}</span>`;

function kartuAngka(a) {
  const x = a.tambahan || {};
  const ekstra = a.kode === "proyek" ? `<span class="jm-pil jm-pil-warn">${ikon("peringatan", 14)}${esc(t("re2.lambat", { n: fmt(x.terlambat) }))}</span>`
    : a.kode === "regulasi" ? `<span class="jm-pil">${esc(t("re2.bulan_ini", { n: fmt(x.bulan_ini) }))}</span>`
    : a.kode === "modul" ? `<span class="jm-pil jm-pil-ok">${esc(t("re2.modul_ubah", { p: fmt(((a.nilai - x.sebelum) / x.sebelum) * 100, 1), tahun: x.tahun_sebelum }))}</span>` : "";
  return `<li class="re-ang"><div class="re-ang-k"><span class="re-ang-ik">${ikon(a.ikon, 20)}</span><h3 class="re-ang-l">${esc(t("re2.a." + a.kode))}</h3>${sumberHtml(sumberIsi(a))}</div>
    <p class="re-ang-n"><b>${esc(fmt(a.nilai, DESIMAL[a.kode] ?? 0))}</b><span>${esc(a.satuan)}</span></p>
    <p class="re-ang-s">${esc(t("re2.as." + a.kode, { tahun: a.tahun }))}</p>
    <div class="re-ang-b">${buktiPil(a.est ? "est" : a.tingkat)}${ekstra}</div></li>`;
}

function temuanHtml(f) {
  const a = f.angka, hl = (kunci, nilai, p = {}) => hlHtml(kunci, nilai, p);
  const isi = {
    celah: () => hl("re2.f.celah", fmt(a.celah_mw), { per: fmt(a.per_tahun), kali: fmt(a.kali, 1), laju: fmt(a.laju), tahun: a.tahun }),
    bauran: () => hl("re2.f.bauran", fmt(a.selisih, 1), { real: fmt(a.real, 1), tahun_real: a.tahun_real, target: fmt(a.target, 1), tahun_target: a.tahun_target }),
    lambat: () => hl("re2.f.lambat", fmt(a.lambat), { dari: fmt(a.dari), persen: fmt(a.persen), tahun: a.tahun }),
    modul: () => hl(a.ubah <= 0 ? "re2.f.modul_turun" : "re2.f.modul_naik", fmt(Math.abs(a.ubah), 1), { sekarang: fmt(a.sekarang, 2), tahun: a.tahun, sebelum: fmt(a.sebelum, 3), tahun_sebelum: a.tahun_sebelum }),
    sebaran: () => hl("re2.f.sebaran", fmt(a.persen), { n: fmt(a.n), teratas: a.teratas, dari: fmt(a.dari), tahun: a.tahun }),
  }[f.kode];
  return isi ? `<p class="re-t-isi">${isi()}${f.label_est ? ` <span class="jm-pil jm-pil-warn">${esc(t("re2.bukti.est"))}</span>` : ""}</p>` : "";
}

function berubahHtml(p) {
  const r = p.riwayat, per = Object.entries(r.per || {}).filter(([, n]) => n > 0).sort((x, y) => y[1] - x[1]);
  const ikJenis = { proyek: "proyek", regulasi: "regulasi", organisasi: "gedung", orang: "orang", program: "bintang", berita: "berita", keuangan: "kartu", karbon: "globe", video: "video" };
  const ubin = per.map(([k, n]) => `<li class="re-ub"><span class="re-ub-ik">${ikon(ikJenis[k] || "tabel", 18)}</span><b>${esc(fmt(n))}</b><span>${esc(t("re2.jenis." + k))}</span></li>`).join("");
  const rp = p.rapor, sel = (a) => (a[0] - a[1]);
  const baris = rp ? [["berita", "berita", rp.berita], ["regulasi", "regulasi", rp.regulasi], ["tender", "palu", rp.tender]].map(([k, ik, a]) => { const d = sel(a); return `<li class="re-rp">${ikon(ik, 16)}<span>${esc(t("re2.rapor." + k))}</span><b>${esc(fmt(a[0]))}</b><span class="jm-pil ${d > 0 ? "jm-pil-ok" : d < 0 ? "jm-pil-bad" : ""}">${d > 0 ? "+" : ""}${esc(fmt(d))}</span></li>`; }).join("") : "";
  const isi = `${ubin ? `<ul class="re-ubin">${ubin}</ul>` : `<p class="re-kosong">${ikon("info", 16)}<span>${esc(t("re2.berubah_kosong"))}</span></p>`}
    ${rp ? `<h3 class="re-sub">${ikon("kalender", 16)}<span>${esc(t("re2.rapor", { periode: rp.periode, lalu: rp.lalu }))}</span></h3><ul class="re-rps">${baris}</ul>` : ""}`;
  return exHtml({ id: "re-berubah", ikon: "linimasa", topik: t("re2.ey.berubah"), judulHtml: r.jumlah > 0 ? hlHtml("re2.j.berubah", fmt(r.jumlah), { hari: fmt(r.hari) }) : esc(t("re2.j.berubah_nol")), subHtml: esc(t("re2.sub.berubah", { awal: tanggal(r.awal || S.d.dibangun_pada) })), aksiHtml: aksiHtml({ png: true, pdf: false, bagi: false }), isiHtml: isi, tingkat: "h2" });
}

function petaHtml() {
  const pt = S.d.peta, g = S.geo;
  if (!pt.baris.length || !g) return "";
  const W = 760, H = 330, jalur = jalurPerProvinsi(g, W, H), mw = new Map(pt.baris.map((b) => [b.kode, b])), nilai = pt.baris.map((b) => b.mw).sort((a, z) => a - z);
  const kuantil = (v) => { const i = nilai.findIndex((x) => x >= v); return Math.min(4, Math.floor((i / nilai.length) * 5)); };
  const total = nilai.reduce((n, x) => n + x, 0);
  const atas = new Set(S.d.temuan.find((f) => f.kode === "sebaran")?.provinsi || []);
  const peta = jalur.map((j) => { const b = mw.get(j.kode); return `<path class="re-pv re-k${b ? kuantil(b.mw) : "x"}${atas.has(j.kode) ? " re-atas" : ""}" d="${j.d}" data-tip="${esc(b ? t("re2.peta_tip", { nama: b.nama, mw: fmt(b.mw), p: fmt((b.mw / total) * 100, 1) }) : t("re2.peta_kosong"))}" tabindex="0"/>`; }).join("");
  const legenda = [0, 1, 2, 3, 4].map((k) => `<i class="re-k${k}"></i>`).join("");
  const isi = `<svg class="jm-gf re-peta" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("re2.j.peta"))}">${peta}</svg>
    <div class="re-legenda"><span>${esc(t("re2.peta_rendah"))}</span><span class="re-lg">${legenda}</span><span>${esc(t("re2.peta_tinggi"))}</span></div>`;
  return exHtml({ id: "re-peta", ikon: "peta", topik: t("re2.ey.peta"), judulHtml: esc(t("re2.j.peta")), subHtml: esc(t("re2.sub.peta", { tahun: pt.tahun })), aksiHtml: aksiHtml({ png: true, pdf: false, bagi: false }), isiHtml: isi });
}

function gambar() {
  const d = S.d, n = d.angka.length;
  khUbin("reUbin", [
    { ikon: "grafik", nilai: fmt(n), label: t("re2.u.angka") },
    { ikon: "kajian", nilai: fmt(d.temuan.length), label: t("re2.u.temuan") },
    { ikon: "info", nilai: fmt(new Set(d.angka.map((a) => a.sumber.judul)).size), label: t("re2.u.sumber") },
    { ikon: "kalender", nilai: d.dibangun_pada.slice(0, 4), label: t("re2.u.data") },
  ]);
  const angkaEx = exHtml({ id: "re-angka", ikon: "grafik", topik: t("re2.ey.angka"), judulHtml: hlHtml("re2.j.angka", fmt(n)), subHtml: esc(t("re2.sub.angka")), aksiHtml: aksiHtml({ png: true, pdf: false, bagi: false }), isiHtml: `<ul class="re-angka">${d.angka.map(kartuAngka).join("")}</ul>` });
  const temuanEx = exHtml({ id: "re-temuan", ikon: "kajian", topik: t("re2.ey.temuan"), judulHtml: hlHtml("re2.j.temuan", fmt(d.temuan.length)), subHtml: esc(t("re2.sub.temuan")), aksiHtml: aksiHtml({ png: true, pdf: false, bagi: false }),
    isiHtml: `<ol class="re-temuan">${d.temuan.map((f, i) => `<li class="re-t"><span class="re-t-no">${i + 1}</span><span class="re-t-ik">${ikon(f.ikon, 18)}</span>${temuanHtml(f)}</li>`).join("")}</ol>` });
  const kop = `<div class="re-kop"><img src="/img/logo-meti-tanda.png" width="44" height="42" alt=""><div><b>${esc(t("jm.merek"))}</b><span>${esc(t("re2.judul"))}</span></div><span class="re-kop-tgl">${esc(tanggal(d.dibangun_pada))}</span></div>`;
  $("reIsi").innerHTML = `<div class="re-lembar" id="reLembar">${kop}${angkaEx}<div class="re-dua">${temuanEx}${petaHtml()}</div>${berubahHtml(d.perubahan)}
    <div class="re-sc"><h2>${esc(t("re2.sumber_cetak"))}</h2><ol>${d.angka.map((a) => `<li>${sumberIsi(a)}</li>`).join("")}</ol></div>
    <p class="re-kaki">${esc(t("re2.kaki", { tanggal: tanggal(d.dibangun_pada), host: location.host }))}</p></div>`;
  $("reAksi").innerHTML = `<button type="button" class="jm-tbl jm-tbl-utama" data-re="cetak">${ikon("pdf", 18)}<span>${esc(t("re2.pdf"))}</span></button><button type="button" class="jm-tbl" data-re="cetak">${ikon("tabel", 18)}<span>${esc(t("re2.cetak"))}</span></button>${bagikanHtml({ url: "/insight#ringkasan", judul: t("re2.judul"), lengkap: true })}`;
}

function cetak() {
  const tema = document.documentElement.dataset.theme;
  document.documentElement.dataset.theme = "light";
  document.documentElement.classList.add("re-cetak");
  const beres = () => { removeEventListener("afterprint", beres); document.documentElement.classList.remove("re-cetak"); tema === undefined ? delete document.documentElement.dataset.theme : (document.documentElement.dataset.theme = tema); };
  addEventListener("afterprint", beres);
  requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
}

async function mulai() {
  $("reIsi").innerHTML = hantuHtml(6);
  try {
    [S.d, S.geo] = await Promise.all([muatData("ringkasan_eksekutif.json"), fetch("/geo/provinsi.json").then((r) => (r.ok ? r.json() : null)).catch(() => null)]);
  } catch (e) { return tampilGalat($("reIsi"), mulai); }
  document.title = `${t("re2.judul")} | ${t("jm.merek")}`;
  gambar();
  $("reAksi").addEventListener("click", (e) => { if (e.target.closest("[data-re=cetak]")) cetak(); });
}
saatBahasa(() => { if (S.d) gambar(); });
mulai();
