/* /langganan (terbuka untuk tamu) dan /berhenti?t=<token> (halaman yang sama, mode menurut jalur).
   Tamu: formulir lengkap. Akun masuk: terisi otomatis, satu klik. K19: belum ada layanan surel, hanya pesan terima kasih. */
import { t } from "/i18n.js";
import { api, galatTeks, esc, pesanHtml } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { sosmedHtml } from "/inti/sosmed.js";

const saya = await mulaiHalaman();
const $ = (id) => document.getElementById(id);
const isi = $("lg-isi");
$("lg-sos").innerHTML = sosmedHtml();
const MINAT = ["kebijakan", "proyek", "acara", "kajian", "lowongan"];
const RE_SUREL = /^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/;
const RE_TOKEN = /^[0-9a-f]{64}$/;

const tx = (kunci) => `data-i18n="${kunci}"`;
const pesan = (jenis, teks) => { const p = $("lg-pesan"); if (p) p.innerHTML = teks ? pesanHtml(jenis, teks) : ""; };
const sibuk = (tombol, ya, kunci) => {
  tombol.disabled = ya;
  tombol.setAttribute("aria-busy", String(ya));
  const lbl = tombol.querySelector("span");
  if (lbl) lbl.textContent = ya ? t("jm.memuat") : t(kunci); else tombol.textContent = ya ? t("jm.memuat") : t(kunci);
};
const IKON_MINAT = { kebijakan: "palu", proyek: "proyek", acara: "kalender", kajian: "kajian", lowongan: "orang" };
const ik = (n, z = 20) => `<svg class="jm-ik" width="${z}" height="${z}" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-${n}"/></svg>`;
const ubinMinat = (pilih) => MINAT.map((m) => `<label class="lg-ubin">${ik(IKON_MINAT[m])}<span class="lg-ubin-teks"><b ${tx("lg.minat." + m)}>${esc(t("lg.minat." + m))}</b><small ${tx("lg.minat." + m + ".d")}>${esc(t("lg.minat." + m + ".d"))}</small></span><input type="checkbox" name="minat" value="${m}"${pilih.includes(m) ? " checked" : ""}></label>`).join("");
const kolMinat = (pilih) => `<fieldset class="lg-minat"><legend>${ik("topik")}<span ${tx("lg.diterima")}>${esc(t("lg.diterima"))}</span></legend><div class="lg-ubin-kisi">${ubinMinat(pilih)}</div></fieldset>`;
const infoFrek = () => `<p class="lg-info lg-kotak">${ik("lonceng", 18)}<span ${tx("lg.info_frek")}>${esc(t("lg.info_frek"))}</span></p>`;
const minatTerpilih = () => [...isi.querySelectorAll('input[name="minat"]:checked')].map((x) => x.value);
const awal = (n) => (String(n || "?").trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("") || "?").toUpperCase();
const tombolKirim = (kunci) => `<button type="submit" class="jm-tbl jm-tbl-utama lg-kirim" id="kirim">${ik("surel", 18)}<span ${tx(kunci)}>${esc(t(kunci))}</span></button>`;

const terima = () => {
  isi.innerHTML = `<div class="lg-selesai" role="status">
    <svg class="jm-ik" width="40" height="40" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-centang"/></svg>
    <h2 ${tx("lg.terima.judul")}>${esc(t("lg.terima.judul"))}</h2>
    <p ${tx("lg.terima.isi")}>${esc(t("lg.terima.isi"))}</p>
    <a class="jm-tbl" href="/" ${tx("lg.kembali")}>${esc(t("lg.kembali"))}</a></div>`;
};

/* ---------- tamu ---------- */
function formTamu() {
  isi.innerHTML = `<form class="lg-form" id="lg-form" novalidate>
    <div class="lg-kol">${kolMinat([])}</div>
    <div class="lg-kol">
      <div id="lg-pesan" aria-live="polite"></div>
      <div class="lg-dua">
        <div class="jm-medan jm-ambang"><input class="jm-isian" id="depan" name="depan" autocomplete="given-name" maxlength="60" placeholder=" " required><label for="depan" ${tx("lg.depan")}>${esc(t("lg.depan"))}</label></div>
        <div class="jm-medan jm-ambang"><input class="jm-isian" id="belakang" name="belakang" autocomplete="family-name" maxlength="60" placeholder=" "><label for="belakang" ${tx("lg.belakang")}>${esc(t("lg.belakang"))}</label></div>
      </div>
      <div class="jm-medan jm-ambang"><input class="jm-isian" id="surel" name="surel" type="email" inputmode="email" autocomplete="email" maxlength="254" placeholder=" " required><label for="surel" ${tx("lg.surel")}>${esc(t("lg.surel"))}</label></div>
      <div class="jm-medan jm-ambang"><input class="jm-isian" id="instansi" name="instansi" autocomplete="organization" maxlength="160" placeholder=" "><label for="instansi" ${tx("lg.instansi")}>${esc(t("lg.instansi"))}</label></div>
      <label class="jm-cek lg-setuju"><input type="checkbox" id="setuju" required>${ik("perisai", 18)}<span ${tx("lg.setuju")}>${esc(t("lg.setuju"))}</span></label>
      <input class="lg-madu" type="text" id="situs_web" name="situs_web" tabindex="-1" autocomplete="off" aria-hidden="true">
      ${tombolKirim("lg.kirim")}
      ${infoFrek()}
    </div>
  </form>`;
  $("lg-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const depan = $("depan").value.trim(), surel = $("surel").value.trim();
    if (!depan) return pesan("galat", t("lg.salah.depan"));
    if (!RE_SUREL.test(surel)) return pesan("galat", t("lg.salah.surel"));
    if (!$("setuju").checked) return pesan("galat", t("lg.salah.setuju"));
    kirimDaftar({ depan, belakang: $("belakang").value.trim(), surel, instansi: $("instansi").value.trim(), minat: minatTerpilih(), setuju: true, situs_web: $("situs_web").value }, $("kirim"), "lg.kirim");
  });
}

async function kirimDaftar(badan, tombol, kunci, ok = terima) {
  pesan("galat", "");
  sibuk(tombol, true, kunci);
  try { await api("/api/langganan", { metode: "POST", badan }); ok(); } catch (e) {
    pesan("galat", galatTeks(e.kode || "umum"));
    sibuk(tombol, false, kunci);
  }
}

/* ---------- akun masuk: terisi otomatis, satu klik ---------- */
async function formAkun() {
  let s = { terdaftar: false };
  try { s = await api("/api/langganan/saya"); } catch (e) { /* tanpa status: tampilkan formulir daftar */ }
  if (s.terdaftar && s.aktif) return panelAktif(s);
  formAkunIsi(s, s.minat?.length ? s.minat : MINAT, "lg.kirim_akun", () => terima());
}

function formAkunIsi(s, pilih, kunci, ok) {
  const nama = s.nama || saya.nama || "";
  isi.innerHTML = `<form class="lg-form" id="lg-form" novalidate>
    <div class="lg-kol">${kolMinat(pilih)}</div>
    <div class="lg-kol">
      <div id="lg-pesan" aria-live="polite"></div>
      <div class="lg-akun"><span class="lg-avatar" aria-hidden="true">${esc(awal(nama))}</span><p><b>${esc(nama)}</b><span>${esc(s.surel || "")}</span><a href="/profil-saya">${ik("ubah", 16)}<span ${tx("lg.akun.ubah")}>${esc(t("lg.akun.ubah"))}</span></a></p></div>
      <p class="lg-pdp">${ik("perisai", 18)}<span ${tx("lg.setuju_klik")}>${esc(t("lg.setuju_klik"))}</span></p>
      ${tombolKirim(kunci)}
      ${infoFrek()}
    </div>
  </form>`;
  $("lg-form").addEventListener("submit", (e) => {
    e.preventDefault();
    kirimDaftar({ instansi: s.instansi || "", minat: minatTerpilih(), setuju: true }, $("kirim"), kunci, ok);
  });
}

function panelAktif(s, info) {
  const minat = (s.minat?.length ? s.minat : MINAT);
  isi.innerHTML = `<div class="lg-aktif">
    <p class="lg-status" role="status">${ik("centang", 24)}<b ${tx("lg.akun.aktif")}>${esc(t("lg.akun.aktif"))}</b></p>
    <div id="lg-pesan" aria-live="polite">${info ? pesanHtml("ok", info) : ""}</div>
    <p class="lg-aktif-ket">${ik("surel", 16)}<span>${esc(t("lg.akun.surel_info").replace("{surel}", s.surel || ""))}</span></p>
    <h2 class="lg-aktif-h">${ik("topik")}<span ${tx("lg.topik_pilihan")}>${esc(t("lg.topik_pilihan"))}</span></h2>
    <ul class="lg-chip">${minat.map((m) => `<li>${ik(IKON_MINAT[m], 18)}<span ${tx("lg.minat." + m)}>${esc(t("lg.minat." + m))}</span></li>`).join("")}</ul>
    <div class="lg-aksi">
      <button type="button" class="jm-tbl jm-tbl-utama" id="ubah">${ik("ubah", 18)}<span ${tx("lg.ubah_topik")}>${esc(t("lg.ubah_topik"))}</span></button>
      <button type="button" class="jm-tbl" id="berhenti">${ik("keluar", 18)}<span ${tx("lg.berhenti.tombol")}>${esc(t("lg.berhenti.tombol"))}</span></button>
    </div></div>`;
  $("ubah").addEventListener("click", () => formAkunIsi(s, minat, "lg.simpan_topik", () => panelAktif({ ...s, minat: minatTerpilih() }, t("lg.tersimpan"))));
  $("berhenti").addEventListener("click", () => konfirmBerhenti(s));
}

function konfirmBerhenti(s) {
  isi.innerHTML = `<div class="lg-aktif" role="alertdialog" aria-labelledby="lg-kj">
    <h2 id="lg-kj" class="lg-aktif-h">${ik("peringatan")}<span ${tx("lg.berhenti.judul")}>${esc(t("lg.berhenti.judul"))}</span></h2>
    <p class="lg-aktif-ket" ${tx("lg.berhenti.isi")}>${esc(t("lg.berhenti.isi"))}</p>
    <div id="lg-pesan" aria-live="polite"></div>
    <div class="lg-aksi">
      <button type="button" class="jm-tbl jm-tbl-bahaya" id="ya">${ik("keluar", 18)}<span ${tx("lg.berhenti.ya")}>${esc(t("lg.berhenti.ya"))}</span></button>
      <button type="button" class="jm-tbl" id="batal"><span ${tx("jm.batal")}>${esc(t("jm.batal"))}</span></button>
    </div></div>`;
  $("ya").addEventListener("click", () => kirimBerhenti({}, $("ya"), "lg.berhenti.ya"));
  $("batal").addEventListener("click", () => panelAktif(s));
}

/* ---------- berhenti (tautan bertoken atau akun) ---------- */
async function kirimBerhenti(badan, tombol, kunci) {
  pesan("galat", "");
  sibuk(tombol, true, kunci);
  try {
    await api("/api/langganan/berhenti", { metode: "POST", badan });
    isi.innerHTML = `<div class="lg-selesai" role="status"><svg class="jm-ik" width="40" height="40" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-centang"/></svg>
      <h2 ${tx("lg.berhenti.selesai")}>${esc(t("lg.berhenti.selesai"))}</h2><a class="jm-tbl" href="/" ${tx("lg.kembali")}>${esc(t("lg.kembali"))}</a></div>`;
  } catch (e) {
    pesan("galat", e.status === 404 ? t("lg.berhenti.tak_sah") : galatTeks(e.kode || "umum"));
    sibuk(tombol, false, kunci);
  }
}

function halamanBerhenti() {
  const token = new URLSearchParams(location.search).get("t") || "";
  if (!RE_TOKEN.test(token)) {
    isi.innerHTML = `<div class="lg-selesai"><div id="lg-pesan" aria-live="polite">${pesanHtml("galat", t("lg.berhenti.tanpa_token"))}</div><a class="jm-tbl" href="/" ${tx("lg.kembali")}>${esc(t("lg.kembali"))}</a></div>`;
    return;
  }
  isi.innerHTML = `<div class="lg-selesai"><h2 ${tx("lg.berhenti.judul")}>${esc(t("lg.berhenti.judul"))}</h2>
    <p ${tx("lg.berhenti.isi")}>${esc(t("lg.berhenti.isi"))}</p><div id="lg-pesan" aria-live="polite"></div>
    <button type="button" class="jm-tbl jm-tbl-utama" id="ya" ${tx("lg.berhenti.ya")}>${esc(t("lg.berhenti.ya"))}</button>
    <a class="jm-tbl" href="/" ${tx("lg.kembali")}>${esc(t("lg.kembali"))}</a></div>`;
  $("ya").addEventListener("click", () => kirimBerhenti({ token }, $("ya"), "lg.berhenti.ya"));
}

if (location.pathname === "/berhenti") halamanBerhenti();
else if (saya.masuk) await formAkun();
else formTamu();
