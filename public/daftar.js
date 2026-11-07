/* /daftar (terbuka untuk tamu): formulir bertahap pendaftaran anggota. /daftar/lacak#<token>: status, iuran, rekening, unggah bukti.
   Tanpa NIK/KTP dan data keuangan. Token dikirim di BADAN permintaan. Teks lewat kamus i18n. */
import { t, angka, tanggal, tanggalDariUnix, bahasa } from "/i18n.js";
import { api, galatTeks, esc, pesanHtml, ikon } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { pilihHtml } from "/inti/komponen.js";
import { unggahHtml } from "/inti/unggah.js";
import { PROV } from "/inti/prov_singkat.js";
import { IKON_TEK } from "/inti/ikon_tek.js";

await mulaiHalaman();
const $ = (id) => document.getElementById(id);
const isi = $("dft-isi");
// Tarif resmi bersumber (public/data/keanggotaan.json): 6 kategori, manfaat, dokumen.
const D = await fetch("/data/keanggotaan.json").then((r) => (r.ok ? r.json() : null)).catch(() => null) || { kategori: [], manfaat: [], dokumen: [], sumber: {} };
const KAT = D.kategori, kat = (k) => KAT.find((x) => x.kode === k);
const L = (o) => (o && (o[bahasa()] ?? o.id)) || "";
const IK_LANGKAH = ["topik", "ubah", "kartu", "unduh", "perisai"];
const ukuran = (b) => (b >= 1048576 ? angka(b / 1048576, { desimal: 1 }) + " MB" : angka(Math.round(b / 1024)) + " KB");
const centang = '<svg class="dft-cek" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "nuklir", "penyimpanan"];
const SEKTOR = Array.from({ length: 14 }, (_, i) => i + 1);
const RE_SUREL = /^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/;
const RE_LACAK = /^[0-9a-f]{64}$/;
const tx = (k) => `data-i18n="${k}"`;
const medan = (id, kunci, { tipe = "text", maks = 120, auto = "off", perlu = false, mode = "" } = {}) =>
  `<div class="jm-medan jm-ambang"><input class="jm-isian" id="${id}" name="${id}" type="${tipe}" maxlength="${maks}" autocomplete="${auto}" placeholder=" "${mode ? ` inputmode="${mode}"` : ""}${perlu ? " required" : ""}><label for="${id}" ${tx(kunci)}>${esc(t(kunci))}</label></div>`;
const area = (id, kunci, maks) => `<div class="jm-medan jm-ambang"><textarea class="jm-isian dft-area" id="${id}" name="${id}" maxlength="${maks}" rows="3" placeholder=" "></textarea><label for="${id}" ${tx(kunci)}>${esc(t(kunci))}</label></div>`;
const pesan = (jenis, teks) => { const p = $("dft-pesan"); if (p) p.innerHTML = teks ? pesanHtml(jenis, teks) : ""; };
const rupiah = (n) => "Rp " + angka(n);

/* ======================================== formulir bertahap ======================================== */
const S = { langkah: 1, jenis: "ngo", kepakaran: new Set() };
const LANGKAH = ["dft.l1", "dft.l2", "dft.l3", "dft.l4"];

function bentuk() {
  const prov = Object.entries(PROV).map(([k, v]) => [k, v[0]]);
  isi.innerHTML = `<ol class="dft-langkah" aria-label="${esc(t("dft.langkah"))}">${LANGKAH.map((k, i) => `<li data-l="${i + 1}"><b>${i + 1}</b><span ${tx(k)}>${esc(t(k))}</span></li>`).join("")}</ol>
  <form class="dft-form" id="dft-form" novalidate>
    <div id="dft-pesan" aria-live="polite"></div>
    <fieldset class="dft-set" data-langkah="1"><legend ${tx("dft.l1.j")}>${esc(t("dft.l1.j"))}</legend>
      <div class="dft-jenis">${KAT.map((k) => `<label class="dft-ubin"><input type="radio" name="jenis" value="${k.kode}"${k.kode === S.jenis ? " checked" : ""}><span class="dft-no">${esc(String(k.no).padStart(2, "0"))}</span><span class="dft-ubin-teks"><b>${esc(L(k.nama))}</b><small>${esc(t("dft.orang", { n: k.perwakilan }))}, ${esc(rupiah(k.iuran_awal))}</small></span></label>`).join("")}</div>
    </fieldset>
    <fieldset class="dft-set" data-langkah="2" hidden><legend ${tx("dft.l2.j")}>${esc(t("dft.l2.j"))}</legend>
      <div class="dft-dua">${medan("nama", "dft.nama", { auto: "name", perlu: true })}${medan("gelar", "dft.gelar", { maks: 40 })}</div>
      <div class="dft-dua">${medan("surel", "dft.surel", { tipe: "email", maks: 120, auto: "email", perlu: true, mode: "email" })}${medan("hp", "dft.hp", { tipe: "tel", maks: 20, auto: "tel", perlu: true, mode: "tel" })}</div>
      <div class="dft-dua">${medan("jabatan", "dft.jabatan", { auto: "organization-title" })}${medan("organisasi", "dft.organisasi", { maks: 160, auto: "organization" })}</div>
      <div class="dft-dua">${medan("kota", "dft.kota", { maks: 80, auto: "address-level2" })}${pilihHtml({ id: "prov", ikon: "wilayah", label: t("dft.prov"), opsi: [["", t("dft.prov.pilih"), "wilayah"], ...prov.map(([k, n]) => [k, n, "wilayah"])] })}</div>
      <p class="dft-wilayah" id="dft-mw" hidden>${ikon("wilayah", 16)}<span></span></p>
      ${medan("pendidikan", "dft.pendidikan", { maks: 120 })}
    </fieldset>
    <fieldset class="dft-set" data-langkah="3" hidden><legend ${tx("dft.l3.j")}>${esc(t("dft.l3.j"))}</legend>
      <div class="dft-org" id="dft-org" hidden>
        ${medan("badan_nama", "dft.badan.nama", { maks: 160 })}
        <div class="dft-dua">${pilihHtml({ id: "badan_sektor", ikon: "jenis", label: t("dft.badan.sektor"), opsi: [["", t("dft.badan.sektor"), "jenis"], ...SEKTOR.map((n) => [t("dft.sek." + n), t("dft.sek." + n), "jenis"])] })}${medan("badan_situs", "dft.badan.situs", { tipe: "url", maks: 200, mode: "url" })}</div>
        ${area("badan_alamat", "dft.badan.alamat", 300)}
        <div class="dft-dua">${medan("pj_nama", "dft.pj.nama")}${medan("pj_kontak", "dft.pj.kontak")}</div>
      </div>
      <p class="dft-sub" ${tx("dft.kepakaran")}>${esc(t("dft.kepakaran"))}</p>
      <div class="dft-tek">${TEK.map((k) => `<label class="dft-chip"><input type="checkbox" name="kepakaran" value="${k}">${IKON_TEK[k]}<span>${esc(t("pj.tek." + k))}</span></label>`).join("")}</div>
      ${area("pengalaman", "dft.pengalaman", 1000)}
      ${medan("tautan", "dft.tautan", { tipe: "url", maks: 200, mode: "url" })}
    </fieldset>
    <fieldset class="dft-set" data-langkah="4" hidden><legend ${tx("dft.l4.j")}>${esc(t("dft.l4.j"))}</legend>
      ${area("alasan", "dft.alasan", 1000)}
      <p class="dft-sub" ${tx("dft.foto")}>${esc(t("dft.foto"))}</p>
      ${unggahHtml({ id: "foto", terima: "image/jpeg,image/png,image/webp", maks: 2 * 1024 * 1024, bantu: t("dft.foto.bantu"), ikon: "gambar" })}
      <label class="jm-cek dft-setuju"><input type="checkbox" id="setuju" required>${ikon("perisai", 18)}<span ${tx("dft.setuju")}>${esc(t("dft.setuju"))}</span></label>
      <p class="dft-info">${ikon("info", 18)}<span ${tx("dft.tanpa_nik")}>${esc(t("dft.tanpa_nik"))}</span></p>
      <input class="dft-madu" type="text" id="situs_web" name="situs_web" tabindex="-1" autocomplete="off" aria-hidden="true">
    </fieldset>
    <div class="dft-aksi"><button type="button" class="jm-tbl" id="dft-balik" hidden>${ikon("panah-kiri", 18)}<span ${tx("dft.balik")}>${esc(t("dft.balik"))}</span></button><button type="button" class="jm-tbl jm-tbl-utama" id="dft-lanjut"><span ${tx("dft.lanjut")}>${esc(t("dft.lanjut"))}</span>${ikon("panah-kanan", 18)}</button><button type="submit" class="jm-tbl jm-tbl-utama" id="dft-kirim" hidden>${ikon("centang", 18)}<span ${tx("dft.kirim")}>${esc(t("dft.kirim"))}</span></button></div>
  </form>`;
  const f = $("dft-form");
  f.addEventListener("change", (e) => {
    if (e.target.name === "jenis") { S.jenis = e.target.value; org(); }
    if (e.target.id === "prov") mw();
  });
  $("dft-lanjut").addEventListener("click", () => { if (valid(S.langkah)) ke(S.langkah + 1); });
  $("dft-balik").addEventListener("click", () => ke(S.langkah - 1));
  f.addEventListener("submit", (e) => { e.preventDefault(); if (valid(4)) kirim(); });
  org(); ke(1); S.siap = true;
}
function org() {
  $("dft-org").hidden = !kat(S.jenis)?.organisasi;
  const lab = document.querySelector('label[for="organisasi"]');
  const kunci = S.jenis === "pelajar" ? "dft.kampus" : "dft.organisasi";
  lab.textContent = t(kunci); lab.setAttribute("data-i18n", kunci);
}
function mw() {
  const k = $("prov").value, p = $("dft-mw");
  p.hidden = !k;
  if (k) p.querySelector("span").textContent = t("dft.mw", { nama: PROV[k][0] });
}
function ke(n) {
  S.langkah = Math.min(4, Math.max(1, n));
  for (const s of isi.querySelectorAll("fieldset[data-langkah]")) s.hidden = +s.dataset.langkah !== S.langkah;
  for (const li of isi.querySelectorAll(".dft-langkah li")) { li.classList.toggle("on", +li.dataset.l === S.langkah); li.classList.toggle("selesai", +li.dataset.l < S.langkah); if (+li.dataset.l === S.langkah) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current"); }
  $("dft-balik").hidden = S.langkah === 1;
  $("dft-lanjut").hidden = S.langkah === 4;
  $("dft-kirim").hidden = S.langkah !== 4;
  pesan("galat", "");
  if (S.siap) isi.querySelector(".dft-langkah").scrollIntoView({ block: "nearest" });
}
const nilai = (id) => ($(id)?.value || "").trim();
function valid(n) {
  let salah = "";
  if (n === 2) {
    if (nilai("nama").length < 2) salah = "dft.salah.nama";
    else if (!RE_SUREL.test(nilai("surel"))) salah = "dft.salah.surel";
    else if (!/^\+?\d{6,18}$/.test(nilai("hp").replace(/[\s().-]/g, ""))) salah = "dft.salah.hp";
  } else if (n === 3 && kat(S.jenis)?.organisasi && (!nilai("badan_nama") || !nilai("pj_nama") || !nilai("pj_kontak"))) salah = "dft.salah.org";
  else if (n === 4) {
    if (nilai("alasan").length < 10) salah = "dft.salah.alasan";
    else if (!$("setuju").checked) salah = "dft.salah.setuju";
  }
  pesan("galat", salah ? t(salah) : "");
  if (salah) $("dft-pesan").scrollIntoView({ block: "nearest" });
  return !salah;
}
const nol = (v) => (v === "" ? null : v);
async function kirim() {
  const tombol = $("dft-kirim"), lbl = tombol.querySelector("span");
  tombol.disabled = true; lbl.textContent = t("jm.memuat");
  const badan = { jenis: S.jenis, nama: nilai("nama"), gelar: nol(nilai("gelar")), surel: nilai("surel"), hp: nilai("hp"), jabatan: nol(nilai("jabatan")), organisasi: nol(nilai("organisasi")), kota: nol(nilai("kota")),
    prov: nol($("prov").value), pendidikan: nol(nilai("pendidikan")), kepakaran: [...isi.querySelectorAll('input[name="kepakaran"]:checked')].map((x) => x.value), pengalaman: nol(nilai("pengalaman")), tautan: nol(nilai("tautan")),
    alasan: nilai("alasan"), setuju: true, situs_web: $("situs_web").value };
  if (kat(S.jenis)?.organisasi) Object.assign(badan, { badan_nama: nilai("badan_nama"), badan_sektor: nol($("badan_sektor").value), badan_situs: nol(nilai("badan_situs")), badan_alamat: nol(nilai("badan_alamat")), pj_nama: nilai("pj_nama"), pj_kontak: nilai("pj_kontak") });
  try {
    const { token } = await api("/api/daftar", { metode: "POST", badan });
    const berkas = $("foto").files[0];
    if (berkas) { const fd = new FormData(); fd.set("token", token); fd.set("berkas", berkas); await fetch("/api/daftar/foto", { method: "POST", credentials: "same-origin", headers: { "x-pb": "1" }, body: fd }).catch(() => {}); }
    location.assign("/daftar/lacak#" + token);
  } catch (e) {
    pesan("galat", galatTeks(e.kode || "umum"));
    tombol.disabled = false; lbl.textContent = t("dft.kirim");
  }
}

/* ======================================== lacak ======================================== */
async function lacak(token) {
  isi.innerHTML = `<div class="jm-hantu" role="status"><i></i><i></i><i></i></div>`;
  let d;
  try { d = await api("/api/daftar/lacak", { metode: "POST", badan: { token } }); } catch (e) {
    isi.innerHTML = `<div class="dft-selesai">${ikon("peringatan", 36)}<h2 ${tx("dft.lacak.tak")}>${esc(t("dft.lacak.tak"))}</h2><a class="jm-tbl" href="/daftar" ${tx("dft.daftar_baru")}>${esc(t("dft.daftar_baru"))}</a></div>`;
    return;
  }
  const p = d.pendaftaran, r = d.rekening;
  const pil = (k, v) => `<span class="jm-pil ${v === "ok" ? "jm-pil-ok" : v === "bad" ? "jm-pil-bad" : "jm-pil-warn"}">${esc(t(k))}</span>`;
  const st = { menunggu: "warn", disetujui: "ok", ditolak: "bad" }[p.status], by = { belum: "bad", menunggu: "warn", lunas: "ok" }[p.bayar];
  const rek = r.nomor
    ? `<dl class="dft-rek"><div><dt ${tx("dft.rek.bank")}>${esc(t("dft.rek.bank"))}</dt><dd>${esc(r.bank)}</dd></div><div><dt ${tx("dft.rek.nomor")}>${esc(t("dft.rek.nomor"))}</dt><dd class="dft-nomor"><b id="dft-no">${esc(r.nomor)}</b><button type="button" class="jm-tbl" id="dft-salin">${ikon("salin", 16)}<span ${tx("dft.salin")}>${esc(t("dft.salin"))}</span></button></dd></div><div><dt ${tx("dft.rek.nama")}>${esc(t("dft.rek.nama"))}</dt><dd>${esc(r.nama)}</dd></div>${r.catatan ? `<div><dt ${tx("dft.rek.catatan")}>${esc(t("dft.rek.catatan"))}</dt><dd>${esc(r.catatan)}</dd></div>` : ""}</dl>`
    : `<p class="dft-info">${ikon("info", 18)}<span ${tx("dft.rek.kosong")}>${esc(t("dft.rek.kosong"))}</span></p>`;
  const bisaBayar = p.status !== "ditolak" && p.bayar !== "lunas";
  const bukti = d.bukti.length ? `<ul class="dft-bukti">${d.bukti.map((b) => `<li>${ikon(b.tipe === "application/pdf" ? "pdf" : "gambar", 18)}<span>${esc(tanggalDariUnix(b.dibuat))}</span>${pil("dft.bukti." + b.status, { diterima: "ok", ditolak: "bad", menunggu: "warn" }[b.status])}${b.catatan ? `<small>${esc(b.catatan)}</small>` : ""}</li>`).join("")}</ul>` : "";
  isi.innerHTML = `<div class="dft-lacak">
    <section class="dft-blok"><h2>${ikon("centang", 20)}<span ${tx("dft.status")}>${esc(t("dft.status"))}</span></h2>
      <p class="dft-besar">${esc(p.nama)} ${pil("dft.st." + p.status, st)}</p>
      <p class="dft-info">${ikon("info", 18)}<span>${esc(t("dft.st." + p.status + ".d"))}</span></p>
      ${p.catatan ? `<p class="dft-info">${ikon("peringatan", 18)}<span>${esc(p.catatan)}</span></p>` : ""}
      <p class="dft-kecil"><span ${tx("dft.dibuat")}>${esc(t("dft.dibuat"))}</span> ${esc(tanggalDariUnix(p.dibuat))}</p></section>
    <section class="dft-blok"><h2>${ikon("kartu", 20)}<span ${tx("dft.iuran")}>${esc(t("dft.iuran"))}</span></h2>
      <p class="dft-besar">${p.iuran ? esc(rupiah(p.iuran)) : esc(t("dft.iuran.kosong"))} ${pil("dft.bayar." + p.bayar, by)}</p>
      <p class="dft-kecil">${esc(L(kat(p.jenis)?.nama))}${kat(p.jenis)?.iuran_tahunan ? `, ${esc(t("dft.tahunan.nilai", { n: rupiah(kat(p.jenis).iuran_tahunan) }))}` : ""}</p>
      ${p.status === "ditolak" ? "" : rek}
      ${bisaBayar ? `<div id="dft-pesan" aria-live="polite"></div>${unggahHtml({ id: "bukti", terima: "image/jpeg,image/png,image/webp,application/pdf", maks: 5 * 1024 * 1024, bantu: t("dft.bukti.bantu", { n: d.bukti_maks }), ikon: "unduh" })}
        <div class="dft-aksi"><button type="button" class="jm-tbl jm-tbl-utama" id="dft-unggah" disabled>${ikon("unduh", 18)}<span ${tx("dft.bukti.kirim")}>${esc(t("dft.bukti.kirim"))}</span></button>${d.online ? `<button type="button" class="jm-tbl" id="dft-online">${ikon("kartu", 18)}<span ${tx("dft.online")}>${esc(t("dft.online"))}</span></button>` : ""}</div>` : ""}
      ${bukti}</section></div>
    <p class="dft-kecil dft-simpan">${ikon("kunci", 14)}<span ${tx("dft.simpan_tautan")}>${esc(t("dft.simpan_tautan"))}</span></p>`;
  $("dft-salin")?.addEventListener("click", async (e) => {
    const b = e.currentTarget, no = $("dft-no").textContent;
    try { await navigator.clipboard.writeText(no); } catch { const r2 = document.createRange(); r2.selectNodeContents($("dft-no")); getSelection().removeAllRanges(); getSelection().addRange(r2); document.execCommand?.("copy"); }
    b.querySelector("span").textContent = t("dft.tersalin"); setTimeout(() => { b.querySelector("span").textContent = t("dft.salin"); }, 2000);
  });
  const unggah = $("dft-unggah");
  if (unggah) {
    document.addEventListener("unggah:ubah", (e) => { if (e.target.closest("#dft-isi")) unggah.disabled = !e.detail; });
    unggah.addEventListener("click", async () => {
      const f = $("bukti").files[0]; if (!f) return;
      unggah.disabled = true;
      const fd = new FormData(); fd.set("token", token); fd.set("berkas", f);
      const res = await fetch("/api/daftar/bukti", { method: "POST", credentials: "same-origin", headers: { "x-pb": "1" }, body: fd }).catch(() => null);
      if (res?.ok) return lacak(token);
      const j = await res?.json().catch(() => ({}));
      pesan("galat", res ? (j?.kode === "konflik" ? t("dft.bukti.penuh") : galatTeks(j?.kode || "umum")) : galatTeks("jaringan"));
      unggah.disabled = false;
    });
  }
  $("dft-online")?.addEventListener("click", async (e) => {
    e.currentTarget.disabled = true;
    try { const { url } = await api("/api/daftar/bayar-online", { metode: "POST", badan: { token } }); location.assign(url); } catch (er) { pesan("galat", galatTeks(er.kode || "umum")); e.currentTarget.disabled = false; }
  });
}

/* ======================================== halaman pilih kategori ======================================== */
const KUNCI_LANDING = { atas: "dft-atas", bawah: "dft-bawah" };
const P = { kat: "ngo" };
const rupiahKat = (n) => (n == null ? "-" : rupiah(n));
function detail(k) {
  const ada = new Set(k.manfaat), daftar = [L(k.hak_wakil), ...D.manfaat.filter((m) => ada.has(m.kunci)).map((m) => L(m.teks))];
  return `<article class="dft-detail" aria-label="${esc(L(k.nama))}">
    <header>${k.rekomendasi ? `<span class="jm-pil jm-pil-ok">${esc(t("dft.rek"))}</span>` : ""}<h3>${esc(L(k.nama))}</h3><p>${esc(L(k.deskripsi))}</p></header>
    <div class="dft-harga"><small>${esc(t("dft.awal"))}</small><b>${esc(rupiah(k.iuran_awal))}</b>${k.iuran_tahunan ? `<span>${esc(t("dft.tahunan.nilai", { n: rupiah(k.iuran_tahunan) }))}</span>` : ""}</div>
    <h4>${esc(t("dft.dapat"))}</h4>
    <ul class="dft-dapat">${daftar.map((x) => `<li>${centang}<span>${esc(x)}</span></li>`).join("")}</ul>
    <p class="dft-cocok">${ikon("orang", 18)}<span><b>${esc(t("dft.cocok"))}</b> ${esc(t("dft.orang", { n: k.perwakilan }))}</span></p>
    <p class="dft-kecil">${esc(t("dft.cocok.d"))}</p>
    <button type="button" class="jm-tbl jm-tbl-utama" data-daftar="${esc(k.kode)}">${ikon("centang", 18)}<span>${esc(t("dft.daftar"))}</span></button></article>`;
}
function pilih() {
  const sel = kat(P.kat);
  return `<section class="dft-bagian" aria-labelledby="dft-pilih-j"><header class="dft-bagian-kepala"><p class="jm-kh-ey">${ikon("kartu", 16)}<span ${tx("dft.pilih.ey")}>${esc(t("dft.pilih.ey"))}</span></p><h2 id="dft-pilih-j" ${tx("dft.pilih.j")}>${esc(t("dft.pilih.j"))}</h2><p ${tx("dft.pilih.d")}>${esc(t("dft.pilih.d"))}</p></header>
    <div class="dft-pilih"><ul class="dft-kat">${KAT.map((k) => `<li><button type="button" class="dft-kartu-kat" data-kat="${esc(k.kode)}" aria-expanded="${k.kode === P.kat}" aria-controls="dft-panel"><span class="dft-no">${esc(String(k.no).padStart(2, "0"))}</span>
        <span class="dft-kat-teks"><b>${esc(L(k.nama))}</b><small>${ikon("orang", 14)}${esc(t("dft.orang", { n: k.perwakilan }))}</small></span>
        <span class="dft-kat-harga">${k.rekomendasi ? `<span class="jm-pil jm-pil-ok">${esc(t("dft.rek"))}</span>` : ""}<b>${esc(rupiah(k.iuran_awal))}</b><small>${esc(t("dft.awal"))}</small></span></button>
        <div class="dft-akor">${k.kode === P.kat ? detail(k) : ""}</div></li>`).join("")}</ul>
      <div class="dft-panel" id="dft-panel" aria-live="polite">${sel ? detail(sel) : ""}</div></div></section>`;
}
function banding() {
  const baris = [
    { j: t("dft.awal"), v: (k) => k.iuran_awal, tampil: (k) => rupiah(k.iuran_awal) },
    { j: t("dft.tahunan"), v: (k) => k.iuran_tahunan ?? 0, tampil: (k) => rupiahKat(k.iuran_tahunan) },
    { j: t("dft.paket"), v: (k) => k.perwakilan, tampil: (k) => t("dft.orang", { n: k.perwakilan }) },
    ...D.manfaat.map((m) => ({ j: L(m.teks), v: (k) => (k.manfaat.includes(m.kunci) ? 1 : 0), cek: true }))];
  return `<section class="dft-bagian" aria-labelledby="dft-banding-j"><header class="dft-bagian-kepala"><p class="jm-kh-ey">${ikon("tabel", 16)}<span ${tx("dft.banding.ey")}>${esc(t("dft.banding.ey"))}</span></p><h2 id="dft-banding-j" ${tx("dft.banding.j")}>${esc(t("dft.banding.j"))}</h2><p ${tx("dft.banding.d")}>${esc(t("dft.banding.d"))}</p></header>
    <div class="jm-gulir"><table class="jm-tabel dft-tabel"><thead><tr><th scope="col">${esc(t("dft.banding.manfaat"))}</th>${KAT.map((k) => `<th scope="col" class="jm-tengah">${esc(L(k.nama))}</th>`).join("")}</tr></thead>
    <tbody>${baris.map((b) => `<tr><th scope="row" data-l="${esc(t("dft.banding.manfaat"))}">${esc(b.j)}</th>${KAT.map((k) => `<td class="jm-tengah" data-l="${esc(L(k.nama))}" data-urut="${b.v(k)}">${b.cek ? (b.v(k) ? `${centang}<span class="sr">${esc(t("dft.ya"))}</span>` : `<span class="dft-tidak" aria-hidden="true">-</span><span class="sr">${esc(t("dft.tidak"))}</span>`) : esc(b.tampil(k))}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`;
}
function alur() {
  return `<section class="dft-bagian" aria-labelledby="dft-alur-j"><header class="dft-bagian-kepala"><p class="jm-kh-ey">${ikon("linimasa", 16)}<span ${tx("dft.alur.ey")}>${esc(t("dft.alur.ey"))}</span></p><h2 id="dft-alur-j" ${tx("dft.alur.j")}>${esc(t("dft.alur.j"))}</h2><p ${tx("dft.alur.d")}>${esc(t("dft.alur.d"))}</p></header>
    <ol class="dft-alur">${[1, 2, 3, 4, 5].map((i) => `<li><span class="dft-alur-ik">${ikon(IK_LANGKAH[i - 1], 22)}<b>${i}</b></span><h3>${esc(t("dft.alur." + i))}</h3><p>${esc(t("dft.alur." + i + ".d"))}</p></li>`).join("")}</ol></section>`;
}
function dokumen() {
  if (!D.dokumen.length) return "";
  return `<section class="dft-bagian dft-gelap" aria-labelledby="dft-dok-j"><header class="dft-bagian-kepala"><p class="jm-kh-ey">${ikon("pdf", 16)}<span ${tx("dft.dok.ey")}>${esc(t("dft.dok.ey"))}</span></p><h2 id="dft-dok-j" ${tx("dft.dok.j")}>${esc(t("dft.dok.j"))}</h2><p ${tx("dft.dok.d")}>${esc(t("dft.dok.d"))}</p></header>
    <ul class="dft-dok">${D.dokumen.map((d) => `<li><span class="dft-dok-ik">${ikon("pdf", 26)}</span><h3>${esc(L(d.judul))}</h3><p>${esc(L(d.deskripsi))}</p><small>${esc(t("dft.dok.meta", { ukuran: ukuran(d.ukuran), tgl: tanggal(d.diubah) }))}</small>
      <a class="jm-tbl" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${ikon("unduh", 16)}<span>${esc(t("dft.dok.buka"))}</span></a></li>`).join("")}</ul></section>`;
}
function kepalaTarif() {
  const s = D.sumber || {};
  $("dft-tarif").innerHTML = `<span>${esc(t("dft.tarif"))}</span><button type="button" class="dft-dot" id="dft-dot" aria-expanded="false" aria-controls="dft-sumber" aria-label="${esc(t("dft.tarif.sumber_label"))}">${ikon("info", 16)}</button>
    <span class="dft-sumber" id="dft-sumber" hidden>${esc(t("dft.tarif.sumber"))} <a href="${esc(s.url || "https://metiires.or.id/membership")}" target="_blank" rel="noopener noreferrer">metiires.or.id/membership</a></span>`;
  $("dft-dot").addEventListener("click", (e) => { const b = e.currentTarget, buka = b.getAttribute("aria-expanded") !== "true"; b.setAttribute("aria-expanded", String(buka)); $("dft-sumber").hidden = !buka; });
}
function landing() {
  kepalaTarif();
  $(KUNCI_LANDING.atas).innerHTML = pilih();
  $(KUNCI_LANDING.bawah).innerHTML = banding() + alur() + dokumen();
  document.addEventListener("click", (e) => {
    const k = e.target.closest("[data-kat]");
    if (k && P.kat !== k.dataset.kat) { P.kat = k.dataset.kat; $(KUNCI_LANDING.atas).innerHTML = pilih(); $(KUNCI_LANDING.atas).querySelector(`[data-kat="${P.kat}"]`)?.focus({ preventScroll: true }); return; }
    const d = e.target.closest("[data-daftar]");
    if (d) {
      S.jenis = d.dataset.daftar;
      const r = isi.querySelector(`input[name="jenis"][value="${S.jenis}"]`); if (r) r.checked = true;
      org(); isi.hidden = false; ke(2); isi.scrollIntoView({ block: "start" });
    }
  });
}

const m = location.pathname === "/daftar/lacak" ? RE_LACAK.exec(location.hash.slice(1)) : null;
if (m) { $("dft-tarif").hidden = true; lacak(m[0]); } else { bentuk(); isi.hidden = true; landing(); }
