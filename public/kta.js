/* /kta: kartu tanda anggota virtual. Tiga keadaan: belum terkait (klaim), klaim tertunda, dan kartu (depan/belakang, unduh PNG dan PDF, bagikan).
   INP: tombol berubah seketika; menggambar kanvas dan memuat berkas menyusul lewat nanti(). */
import { t, tanggal } from "/i18n.js";
import { api, galatTeks, galatHtml, esc, pesanHtml, ikon, nanti, debounce, hantuHtml } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { LEBAR, TINGGI, bikinQr, gambarDepan, gambarBelakang, labelJenis, muatGambar, pastikanFont, unduhPng, unduhPdf } from "/kta_kartu.js";
import { potongFoto } from "/kta_foto.js";

const saya = await mulaiHalaman();
const $ = (id) => document.getElementById(id);
const isi = $("kta-isi"), dlg = $("dlg");
const MAKS_BUKTI = 3 * 1024 * 1024;
const S = { k: undefined, versi: 0, pilih: null };
let tundaPasang = null;
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); tundaPasang = e; });

const kabari = (jenis, teks) => { $("kta-status").innerHTML = teks ? pesanHtml(jenis, teks) : ""; };
const sibuk = (tombol, ya) => { tombol.disabled = ya; tombol.setAttribute("aria-busy", String(ya)); };
const ikonAksi = (nama, kunci, a) => `<button type="button" class="jm-tbl" data-a="${a}">${ikon(nama, 18)}<span>${esc(t(kunci))}</span></button>`;
const nomorBerkas = () => "kta-meti-" + String(S.k.nomor_kta || S.k.id).toLowerCase();
const warnaStatus = { aktif: "ok", kedaluwarsa: "warn", dicabut: "bad", tertunda: "warn" };

async function simpanBinari(jalur, blob) {
  const r = await fetch(jalur, { method: "PUT", credentials: "same-origin", headers: { "x-pb": "1", "content-type": blob.type || "application/octet-stream" }, body: blob });
  if (!r.ok) {
    let kode = "umum";
    try { const d = await r.json(); if (typeof d.kode === "string") kode = d.kode; } catch (e) { /* tanpa badan */ }
    throw Object.assign(new Error(kode), { kode });
  }
}

async function muat() {
  isi.innerHTML = hantuHtml(4);
  try { S.k = (await api("/api/kta/saya")).kta; } catch (e) { isi.innerHTML = galatHtml(e.kode || "umum"); return; }
  tampil();
}
function tampil() {
  if (S.k === undefined) return;
  if (S.k === null) return klaim();
  if (S.k.status === "tertunda") return tertunda();
  if (S.k.status === "dicabut") return dicabut();
  kartu();
}

/* ---------- belum terkait: cari nama lalu ajukan klaim ---------- */
function klaim() {
  S.pilih = null;
  isi.innerHTML = `<form class="kta-klaim kta-panel" id="fKlaim" novalidate aria-labelledby="kJudul">
    <div class="kta-klaim-kiri"><h2 id="kJudul">${ikon("kartu", 24)}<span>${esc(t("kta.klaim.judul"))}</span></h2>
      <p>${esc(t("kta.klaim.lead"))}</p><p class="kta-klaim-pdp">${esc(t("kta.klaim.privasi"))}</p></div>
    <div class="kta-klaim-kanan"><div id="kPesan" aria-live="polite"></div>
    <div class="jm-medan"><label for="kCari">${esc(t("kta.klaim.cari"))}</label><input class="jm-isian" id="kCari" type="search" autocomplete="off" maxlength="60" aria-describedby="kBantu"><span class="jm-bantu" id="kBantu">${esc(t("kta.klaim.min"))}</span></div>
    <ul class="kta-hasil" id="kHasil"></ul>
    <div id="kDipilih"></div>
    <div class="jm-medan"><label for="kBukti">${esc(t("kta.klaim.bukti"))}</label><input class="jm-isian" id="kBukti" type="file" accept="image/*,application/pdf" aria-describedby="kBuktiBantu"><span class="jm-bantu" id="kBuktiBantu">${esc(t("kta.klaim.bukti_bantu"))}</span></div>
    <button type="submit" class="jm-tbl jm-tbl-utama" id="kKirim" disabled>${esc(t("kta.klaim.kirim"))}</button></div>
  </form>`;
  const pesan = (j, tk) => { $("kPesan").innerHTML = tk ? pesanHtml(j, tk) : ""; };
  let ctl = null;
  const cari = debounce(async () => {
    const q = $("kCari").value.trim();
    if (ctl) ctl.abort();
    if (q.length < 3) { $("kHasil").innerHTML = ""; $("kBantu").textContent = t("kta.klaim.min"); return; }
    ctl = new AbortController();
    try {
      const d = await api("/api/kta/anggota?cari=" + encodeURIComponent(q), { signal: ctl.signal });
      $("kBantu").textContent = d.baris.length ? "" : t("kta.klaim.kosong");
      $("kHasil").innerHTML = d.baris.map((r) => `<li><button type="button" data-id="${esc(r.id)}" data-nama="${esc(r.nama)}" aria-pressed="${S.pilih?.id === r.id}"><b>${esc(r.nama)}</b>${r.instansi ? `<small>${esc(r.instansi)}</small>` : ""}</button></li>`).join("");
    } catch (e) { if (e.name !== "AbortError") pesan("galat", galatTeks(e.kode || "umum")); }
  }, 250);
  $("kCari").addEventListener("input", cari);
  $("kHasil").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    S.pilih = { id: b.dataset.id, nama: b.dataset.nama };
    for (const x of $("kHasil").querySelectorAll("button")) x.setAttribute("aria-pressed", String(x === b)); // chrome urgent
    $("kDipilih").innerHTML = `<p class="kta-dipilih">${esc(t("kta.klaim.dipilih", { nama: S.pilih.nama }))}</p>`;
    $("kKirim").disabled = false;
  });
  $("fKlaim").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!S.pilih) return;
    const f = $("kBukti").files[0];
    if (f && f.size > MAKS_BUKTI) return pesan("galat", galatTeks("terlalu-besar"));
    sibuk($("kKirim"), true); pesan("galat", "");
    try {
      await api("/api/kta/klaim", { metode: "POST", badan: { anggota_id: S.pilih.id } });
    } catch (er) { sibuk($("kKirim"), false); return pesan("galat", galatTeks(er.kode || "umum")); }
    let galatBukti = null;
    if (f) { try { await simpanBinari("/api/kta/bukti", f); } catch (er) { galatBukti = er.kode; } }
    await muat();
    if (galatBukti) kabari("galat", galatTeks(galatBukti));
  });
}

/* ---------- klaim menunggu admin ---------- */
function tertunda() {
  isi.innerHTML = `<section class="kta-tertunda kta-panel" aria-labelledby="tJudul">
    <h2 id="tJudul">${ikon("kartu", 22)}<span>${esc(t("kta.tertunda.judul"))}</span></h2>
    <p>${esc(t("kta.tertunda.isi", { nama: S.k.nama_cetak }))}</p>
    <p class="kta-bantu">${esc(t(S.k.ada_bukti ? "kta.tertunda.bukti" : "kta.tertunda.tanpa_bukti"))}</p>
    <p class="jm-bantu">${esc(t("kta.foto.petunjuk"))}</p>
    ${ikonAksi("gambar", S.k.ada_foto ? "kta.aksi.foto" : "kta.aksi.foto_baru", "foto")}
  </section>`;
}
function dicabut() {
  isi.innerHTML = `<section class="kta-tertunda kta-panel" aria-labelledby="cJudul"><h2 id="cJudul">${ikon("blokir", 22)}<span>${esc(t("kta.dicabut.judul"))}</span></h2><p>${esc(t("kta.dicabut.isi"))}</p></section>`;
}

/* ---------- kartu ---------- */
function kartu() {
  const k = S.k, st = t("kta.kartu.status." + k.status);
  isi.innerHTML = `<div class="kta-grid">
    <div class="kta-pentas">
      <div class="kta-balik" id="balik" data-sisi="depan" role="button" tabindex="0" aria-label="${esc(t("kta.pentas"))}">
        <canvas class="kta-sisi kta-depan" id="cDepan" width="${LEBAR}" height="${TINGGI}" aria-hidden="true"></canvas>
        <canvas class="kta-sisi kta-belakang" id="cBelakang" width="${LEBAR}" height="${TINGGI}" aria-hidden="true"></canvas>
      </div>
      <button type="button" class="jm-tbl" data-a="balik">${ikon("balik", 18)}<span>${esc(t("kta.balik"))}</span></button>
      <p class="sr">${esc(t("kta.kartu.sr", { nama: k.nama_cetak, nomor: k.nomor_kta || "-", jenis: labelJenis(k.jenis), status: st, berlaku: tanggal(k.berlaku_sampai) }))}</p>
    </div>
    <aside class="kta-info kta-panel" aria-labelledby="rJudul">
      <h2 id="rJudul">${ikon("kartu", 22)}<span>${esc(t("kta.rincian"))}</span></h2>
      <dl class="kta-dl">
        <div><dt>${esc(t("kta.kartu.nomor"))}</dt><dd>${esc(k.nomor_kta || "-")}</dd></div>
        <div><dt>${esc(t("kta.kartu.jenis"))}</dt><dd>${esc(labelJenis(k.jenis))}</dd></div>
        <div><dt>${esc(t("kta.kartu.berlaku"))}</dt><dd>${esc(tanggal(k.berlaku_sampai, { gaya: "panjang" }))}</dd></div>
        <div><dt>${esc(t("adm.kta.k.status"))}</dt><dd><span class="jm-pil jm-pil-${warnaStatus[k.status]}">${esc(st)}</span></dd></div>
      </dl>
      ${k.ada_foto ? "" : `<p class="kta-bantu">${esc(t("kta.foto.petunjuk"))}</p>`}
      <div class="kta-aksi">
        ${ikonAksi("gambar", "kta.aksi.png", "png")}${ikonAksi("pdf", "kta.aksi.pdf", "pdf")}${ikonAksi("tambah", "kta.aksi.layar", "layar")}${ikonAksi("bagikan", "kta.aksi.bagikan", "bagikan")}${ikonAksi("orang", k.ada_foto ? "kta.aksi.foto" : "kta.aksi.foto_baru", "foto")}
      </div>
    </aside>
  </div>`;
  nanti(gambarSemua);
}

async function gambarSemua() {
  const k = S.k, depan = $("cDepan"), belakang = $("cBelakang");
  if (!depan || !k) return;
  await pastikanFont();
  const [logo, ttd, foto, qr] = await Promise.all([
    muatGambar("/img/logo-meti-tanda.png"),
    muatGambar("/img/kta/ttd-ketua.png"),
    k.ada_foto ? muatGambar(`/api/kta/foto/${k.id}?v=${S.versi}`) : null,
    k.url_verifikasi ? bikinQr(k.url_verifikasi).catch(() => null) : null,
  ]);
  if (!$("cDepan")) return;
  const d = { nama: k.nama_cetak, nomor: k.nomor_kta, jenis: k.jenis, instansi: k.instansi, berlaku: k.berlaku_sampai, status: k.status, qr, foto, logo, ttd };
  gambarDepan(depan.getContext("2d"), d);
  gambarBelakang(belakang.getContext("2d"), d);
}

const balik = () => { const b = $("balik"); if (b) b.dataset.sisi = b.dataset.sisi === "depan" ? "belakang" : "depan"; };

async function bagikan() {
  const url = S.k.url_verifikasi;
  if (navigator.share) {
    try { await navigator.share({ title: t("kta.bagi.judul"), url }); return; } catch (e) { if (e.name === "AbortError") return; }
  }
  try { await navigator.clipboard.writeText(url); kabari("ok", t("kta.salin.ok")); } catch (e) { kabari("galat", galatTeks("umum")); }
}
async function pasangLayar() {
  if (!tundaPasang) return kabari("ok", t("kta.layar.petunjuk"));
  tundaPasang.prompt();
  const r = await tundaPasang.userChoice.catch(() => null);
  tundaPasang = null;
  if (r?.outcome === "accepted") kabari("ok", t("kta.layar.ok"));
}
async function ekspor(jenis, tombol) {
  sibuk(tombol, true); kabari("ok", t("kta.menyiapkan"));
  try {
    await (jenis === "png" ? unduhPng : unduhPdf)($("cDepan"), $("cBelakang"), nomorBerkas());
    kabari("ok", t("kta.diunduh"));
  } catch (e) { kabari("galat", galatTeks("umum")); } finally { sibuk(tombol, false); }
}
async function ubahFoto(tombol) {
  const f = document.createElement("input");
  f.type = "file"; f.accept = "image/*";
  f.addEventListener("change", async () => {
    const berkas = f.files[0];
    if (!berkas) return;
    const h = await potongFoto(dlg, berkas);
    if (!h) return;
    if (h.galat) return kabari("galat", t("kta.foto.salah"));
    sibuk(tombol, true);
    try { await simpanBinari("/api/kta/foto", h.blob); S.versi++; S.k = (await api("/api/kta/saya")).kta; tampil(); kabari("ok", t("kta.foto.tersimpan")); }
    catch (e) { kabari("galat", galatTeks(e.kode || "umum")); } finally { sibuk(tombol, false); }
  }, { once: true });
  f.click();
}

isi.addEventListener("click", (e) => {
  const b = e.target.closest("[data-a]");
  if (b) {
    const a = b.dataset.a;
    if (a === "balik") balik(); else if (a === "png" || a === "pdf") nanti(() => ekspor(a, b)); else if (a === "layar") pasangLayar();
    else if (a === "bagikan") nanti(bagikan); else if (a === "foto") ubahFoto(b); else if (a === "ulang") muat();
    return;
  }
  if (e.target.closest("#balik")) balik();
});
isi.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.id === "balik") { e.preventDefault(); balik(); } });
document.addEventListener("jm:bahasa", () => nanti(tampil));

if (!saya.masuk) location.replace("/masuk?ke=" + encodeURIComponent("/kta"));
else muat();
