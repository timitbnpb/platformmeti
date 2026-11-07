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
  tombol.textContent = ya ? t("jm.memuat") : t(kunci);
};
const ubinMinat = (pilih) => MINAT.map((m) => `<label class="jm-cek lg-ubin"><input type="checkbox" name="minat" value="${m}"${pilih.includes(m) ? " checked" : ""}><span ${tx("lg.minat." + m)}>${esc(t("lg.minat." + m))}</span></label>`).join("");
const minatTerpilih = () => [...isi.querySelectorAll('input[name="minat"]:checked')].map((x) => x.value);

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
    <div id="lg-pesan" aria-live="polite"></div>
    <div class="lg-dua">
      <div class="jm-medan jm-ambang"><input class="jm-isian" id="depan" name="depan" autocomplete="given-name" maxlength="60" placeholder=" " required><label for="depan" ${tx("lg.depan")}>${esc(t("lg.depan"))}</label></div>
      <div class="jm-medan jm-ambang"><input class="jm-isian" id="belakang" name="belakang" autocomplete="family-name" maxlength="60" placeholder=" "><label for="belakang" ${tx("lg.belakang")}>${esc(t("lg.belakang"))}</label></div>
    </div>
    <div class="jm-medan jm-ambang"><input class="jm-isian" id="surel" name="surel" type="email" inputmode="email" autocomplete="email" maxlength="254" placeholder=" " required><label for="surel" ${tx("lg.surel")}>${esc(t("lg.surel"))}</label></div>
    <div class="jm-medan jm-ambang"><input class="jm-isian" id="instansi" name="instansi" autocomplete="organization" maxlength="160" placeholder=" "><label for="instansi" ${tx("lg.instansi")}>${esc(t("lg.instansi"))}</label></div>
    <fieldset class="lg-minat"><legend ${tx("lg.minat")}>${esc(t("lg.minat"))}</legend><div class="lg-ubin-kisi">${ubinMinat([])}</div></fieldset>
    <label class="jm-cek lg-setuju"><input type="checkbox" id="setuju" required><span ${tx("lg.setuju")}>${esc(t("lg.setuju"))}</span></label>
    <input class="lg-madu" type="text" id="situs_web" name="situs_web" tabindex="-1" autocomplete="off" aria-hidden="true">
    <button type="submit" class="jm-tbl jm-tbl-utama lg-kirim" id="kirim" ${tx("lg.kirim")}>${esc(t("lg.kirim"))}</button>
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

async function kirimDaftar(badan, tombol, kunci) {
  pesan("galat", "");
  sibuk(tombol, true, kunci);
  try { await api("/api/langganan", { metode: "POST", badan }); terima(); } catch (e) {
    pesan("galat", galatTeks(e.kode || "umum"));
    sibuk(tombol, false, kunci);
  }
}

/* ---------- akun masuk: terisi otomatis, satu klik ---------- */
async function formAkun() {
  let s = { terdaftar: false };
  try { s = await api("/api/langganan/saya"); } catch (e) { /* tanpa status: tampilkan formulir daftar */ }
  if (s.terdaftar && s.aktif) return panelAktif();
  isi.innerHTML = `<form class="lg-form" id="lg-form" novalidate>
    <div id="lg-pesan" aria-live="polite"></div>
    <p class="lg-akun"><b>${esc(s.nama || saya.nama || "")}</b><span>${esc(t("lg.akun.surel_info").replace("{surel}", s.surel || ""))}</span></p>
    <fieldset class="lg-minat"><legend ${tx("lg.minat")}>${esc(t("lg.minat"))}</legend><div class="lg-ubin-kisi">${ubinMinat(s.minat?.length ? s.minat : MINAT)}</div></fieldset>
    <p class="lg-pdp" ${tx("lg.setuju_klik")}>${esc(t("lg.setuju_klik"))}</p>
    <button type="submit" class="jm-tbl jm-tbl-utama lg-kirim" id="kirim" ${tx("lg.kirim_akun")}>${esc(t("lg.kirim_akun"))}</button>
  </form>`;
  $("lg-form").addEventListener("submit", (e) => {
    e.preventDefault();
    kirimDaftar({ instansi: s.instansi || "", minat: minatTerpilih(), setuju: true }, $("kirim"), "lg.kirim_akun");
  });
}

function panelAktif() {
  isi.innerHTML = `<div class="lg-selesai">
    <svg class="jm-ik" width="40" height="40" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-centang"/></svg>
    <h2 ${tx("lg.akun.aktif")}>${esc(t("lg.akun.aktif"))}</h2>
    <div id="lg-pesan" aria-live="polite"></div>
    <button type="button" class="jm-tbl jm-tbl-bahaya" id="berhenti" ${tx("lg.berhenti.tombol")}>${esc(t("lg.berhenti.tombol"))}</button></div>`;
  $("berhenti").addEventListener("click", () => kirimBerhenti({}, $("berhenti"), "lg.berhenti.tombol"));
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
