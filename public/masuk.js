/* /masuk, /aktivasi, /ganti-sandi (JM-B06). Satu skrip, cabang menurut <body data-halaman>. */
import { t } from "/i18n.js";
import { api, galatTeks, amanKe, pesanHtml } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";

const saya = await mulaiHalaman();
const halaman = document.body.dataset.halaman;
const params = new URLSearchParams(location.search);
const ke = amanKe(params.get("ke"));
const $ = (id) => document.getElementById(id);
const form = $("form");
const pesan = $("pesan");
const kirim = $("kirim");
const MIN = 12, MAKS = 128;

const tampilPesan = (jenis, teks) => { pesan.innerHTML = pesanHtml(jenis, teks); };
const sibuk = (ya) => {
  kirim.disabled = ya;
  kirim.setAttribute("aria-busy", String(ya));
  kirim.textContent = ya ? t("jm.memuat") : t(kirim.dataset.i18n);
};

// tampilkan sandi: satu kotak centang untuk semua isian sandi di halaman
$("tampil").addEventListener("change", (e) => {
  for (const i of form.querySelectorAll('input[type="password"],input[data-sandi]')) {
    i.type = e.target.checked ? "text" : "password";
    i.dataset.sandi = "1";
  }
});

/* Cek sandi baru di klien; server tetap yang berwenang (KPV §4). Mengembalikan kunci galat atau "". */
function cekBaru(baru, ulang, lama) {
  if (baru.length < MIN) return "sandi.pendek";
  if (baru.length > MAKS) return "sandi.panjang";
  if (baru !== ulang) return "sandi.beda";
  if (lama !== undefined && baru === lama) return "sandi.sama_lama";
  return "";
}

async function kirimForm(fn) {
  pesan.innerHTML = "";
  sibuk(true);
  try { await fn(); } catch (e) {
    if (e.name !== "AbortError") tampilPesan("galat", galatTeks(e.kode || "umum") + (halaman === "aktivasi" && e.kode !== "jaringan" ? " " + t("aktivasi.petunjuk") : ""));
    sibuk(false);
  }
  // sukses: tombol tetap terkunci (navigasi sedang jalan atau formulir sudah disembunyikan)
}

if (halaman === "masuk") {
  if (saya.masuk) {
    form.hidden = true;
    $("sudah").hidden = false;
    $("lanjut").href = ke;
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const surel = $("surel").value.trim();
    const sandi = $("sandi").value;
    if (!surel || !sandi) return tampilPesan("galat", t("masuk.kosong"));
    kirimForm(async () => {
      const d = await api("/api/masuk", { metode: "POST", badan: { surel, sandi } });
      location.assign(d && d.wajib_ganti ? "/ganti-sandi?ke=" + encodeURIComponent(ke) : ke);
    });
  });
} else if (halaman === "aktivasi") {
  // token dari ?token= atau #t=; langsung dihapus dari bilah alamat supaya tidak tersimpan di riwayat
  const hash = new URLSearchParams(location.hash.slice(1));
  const token = hash.get("t") || hash.get("token") || params.get("token") || "";
  try { const u = new URL(location.href); u.searchParams.delete("token"); u.hash = ""; history.replaceState(null, "", u); } catch (e) {}
  if (!token) { form.querySelector("button").disabled = true; tampilPesan("galat", t("aktivasi.tanpa_token")); }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const baru = $("baru").value;
    const salah = cekBaru(baru, $("ulang").value);
    if (salah) return tampilPesan("galat", t(salah));
    kirimForm(async () => {
      await api("/api/aktivasi", { metode: "POST", badan: { token, sandi: baru } });
      form.hidden = true;
      $("selesai").hidden = false;
    });
  });
} else if (halaman === "ganti-sandi") {
  if (!saya.masuk) location.replace("/masuk?ke=" + encodeURIComponent("/ganti-sandi"));
  else form.hidden = false;
  $("lanjut").href = ke;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const lama = $("lama").value;
    const baru = $("baru").value;
    const salah = cekBaru(baru, $("ulang").value, lama);
    if (salah) return tampilPesan("galat", t(salah));
    kirimForm(async () => {
      await api("/api/ganti-sandi", { metode: "POST", badan: { lama, baru } });
      form.hidden = true;
      $("selesai").hidden = false;
    });
  });
}
