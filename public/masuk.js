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

// tombol mata di tiap isian sandi (aria-pressed); tombol dibuat di sini, ikon SVG tanpa inline style
const MATA = '<svg class="jm-mata-buka" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg><svg class="jm-mata-tutup" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.9 17.9A10.9 10.9 0 0 1 12 19c-6.5 0-10-7-10-7a18 18 0 0 1 5-5.9M9.9 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2M1 1l22 22"/></svg>';
for (const i of form.querySelectorAll('input[type="password"]')) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "jm-mata"; b.setAttribute("aria-pressed", "false");
  b.setAttribute("aria-label", t("masuk.tampil")); b.innerHTML = MATA;
  b.addEventListener("click", () => {
    const ya = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(ya));
    i.type = ya ? "text" : "password";
  });
  i.insertAdjacentElement("afterend", b);
}
// "Lupa sandi": panel penjelasan (alur surel belum ada; hubungi Admin)
const lupa = $("lupa");
if (lupa) lupa.addEventListener("click", () => {
  const buka = lupa.getAttribute("aria-expanded") !== "true";
  lupa.setAttribute("aria-expanded", String(buka));
  $("lupa-isi").hidden = !buka;
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
