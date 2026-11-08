/* /masuk, /aktivasi, /ganti-sandi (JM-B06). Satu skrip, cabang menurut <body data-halaman>. */
import { t, gantiBahasa, bahasa } from "/i18n.js";
import { SOSMED, sosmedHtml } from "/inti/sosmed.js";
import { api, galatTeks, amanKe, pesanHtml, nanti, esc } from "/inti/umum.js";
import { IKON_TEK } from "/inti/ikon_tek.js";
import { mulaiHalaman } from "/inti/kepala.js";

const saya = await mulaiHalaman();
const halaman = document.body.dataset.halaman;
const params = new URLSearchParams(location.search);
const ke = params.get("ke") ? amanKe(params.get("ke")) : "/saya"; // tanpa tujuan: halaman pertama setelah masuk = METI untuk saya
const $ = (id) => document.getElementById(id);
const form = $("form");
const pesan = $("pesan");
const kirim = $("kirim");
const MIN = 12, MAKS = 128;

const MI = "https://metiires.or.id";
// kerangka bersama tiga halaman akun: logo + bahasa, panggung kanan, kaki tipis (teks lewat data-i18n)
document.querySelector(".jm-ig-isi").insertAdjacentHTML("afterbegin", `<a href="${MI}" class="jm-ig-logo" aria-label="METI"><img src="/img/logo/meti-vertikal-611.png" alt="METI" width="611" height="835"></a>`);
$("atas").innerHTML = `<div class="jm-ig-bahasa" role="group" aria-label="${t("masuk.bahasa")}">${[["id", "Bahasa Indonesia", "id"], ["en", "English", "gb"]].map(([b, n, f]) => `<button type="button" data-b="${b}" aria-label="${n}" title="${n}" aria-pressed="${bahasa() === b}"><img src="/img/bendera/${f}.svg" alt="" width="24" height="24"></button>`).join("")}</div>`;
$("atas").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-b]"); if (!b) return;
  for (const x of $("atas").querySelectorAll("button[data-b]")) x.setAttribute("aria-pressed", String(x === b));
  nanti(() => gantiBahasa(b.dataset.b, { masuk: saya.masuk }));
});
/* satu pita per teknologi: [berkas, ikon IKON_TEK, kunci label, kunci lokasi, pencipta, lisensi, kunci judul kredit] (sama dengan img/beranda/KREDIT.md) */
const PITA = [
  ["surya-cirata", "surya", "beranda.tek.surya", "beranda.foto.surya", "indonesiagoid", "beranda.foto.lis.pd"],
  ["bayu-sidrap", "bayu", "beranda.tek.bayu", "beranda.foto.bayu", "USAID Indonesia", "beranda.foto.lis.pd"],
  ["hidro-saguling", "hidro", "beranda.tek.hidro", "beranda.foto.hidro", "NFarras", "CC BY-SA 4.0"],
  ["panas-bumi-sibayak", "panas-bumi", "beranda.tek.panas-bumi", "beranda.foto.panas-bumi", "Kenrick95", "CC BY-SA 3.0"],
  ["bioenergi-sawit", "bioenergi", "beranda.tek.bioenergi", "beranda.foto.bioenergi", "Ojiribeka Chidera", "CC BY-SA 4.0"],
];
const pitaHtml = () => PITA.map(([f, ik, lab, lok, pencipta, lis], i) => {
  const lisensi = lis.startsWith("beranda") ? t(lis) : lis;
  return `<div class="jm-pg-pita"><img src="/img/beranda/${f}.webp" alt="" width="800" height="600" loading="eager" decoding="async"><span class="jm-pg-pil">${IKON_TEK[ik]}<span>${esc(t(lab))}</span><small>${esc(t(lok))}</small></span><button type="button" class="jm-pg-info" aria-expanded="false" aria-controls="kr-${i}" aria-label="${esc(t("tn.kredit.judul"))}">i</button><p class="jm-pg-kredit" id="kr-${i}" hidden>${esc(t("tn.kredit.baris", { judul: t(lok), pencipta, lisensi }))}</p></div>`;
}).join("");
$("panggung").innerHTML = `<div class="jm-pg-pitas">${pitaHtml()}</div>
`;
$("kaki-akun").innerHTML = `<nav><a href="${MI}/about" target="_blank" rel="noopener noreferrer" data-i18n="masuk.k_tentang">${t("masuk.k_tentang")}</a><a href="${MI}/policy/membership" target="_blank" rel="noopener noreferrer" data-i18n="masuk.k_privasi">${t("masuk.k_privasi")}</a><a href="${MI}" target="_blank" rel="noopener noreferrer" data-i18n="masuk.k_kontak">${t("masuk.k_kontak")}</a></nav><div class="jm-ig-sosial">${sosmedHtml(SOSMED, 18)}</div><small>&copy; 2026 METI</small>`;

// titik info kredit foto: satu popover terbuka; klik di luar atau Escape menutup
const tutupKredit = () => { for (const b of $("panggung").querySelectorAll(".jm-pg-info[aria-expanded=true]")) { b.setAttribute("aria-expanded", "false"); b.nextElementSibling.hidden = true; b.closest(".jm-pg-pita").classList.remove("buka"); } };
$("panggung").addEventListener("click", (e) => {
  const b = e.target.closest(".jm-pg-info"); const buka = b && b.getAttribute("aria-expanded") !== "true";
  tutupKredit();
  if (buka) { b.setAttribute("aria-expanded", "true"); b.nextElementSibling.hidden = false; b.closest(".jm-pg-pita").classList.add("buka"); }
});
document.addEventListener("click", (e) => { if (!e.target.closest("#panggung")) tutupKredit(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") tutupKredit(); });

// pesan: ikon + teks + tombol tutup; galat di /masuk menyarankan "Lupa sandi?"
const IKX = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const tampilPesan = (jenis, teks) => {
  pesan.innerHTML = pesanHtml(jenis, teks);
  const kotak = pesan.firstElementChild;
  if (jenis === "galat" && halaman === "masuk" && $("lupa")) kotak.querySelector("span").insertAdjacentHTML("beforeend", ` <button type="button" class="jm-tautan jm-pesan-lupa" data-lupa>${t("masuk.lupa")}</button>`);
  kotak.insertAdjacentHTML("beforeend", `<button type="button" class="jm-pesan-tutup" aria-label="${t("masuk.tutup_pesan")}">${IKX}</button>`);
};
pesan.addEventListener("click", (e) => {
  if (e.target.closest(".jm-pesan-tutup")) pesan.innerHTML = "";
  else if (e.target.closest("[data-lupa]")) { pesan.innerHTML = ""; if ($("lupa").getAttribute("aria-expanded") !== "true") $("lupa").click(); $("lupa").scrollIntoView({ block: "center" }); }
});
const sibuk = (ya) => {
  kirim.disabled = ya;
  kirim.setAttribute("aria-busy", String(ya));
  const lab = kirim.querySelector("[data-i18n]") || kirim;
  lab.textContent = ya ? t("jm.memuat") : t(lab.dataset.i18n);
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
// label mengambang: kelas .terisi sebagai cadangan CSS (autofill peramban, ganti type lewat tombol mata)
const tandai = (i) => i.closest(".jm-ambang")?.classList.toggle("terisi", i.value !== "");
for (const i of form.querySelectorAll(".jm-ambang .jm-isian")) {
  const t2 = () => tandai(i);
  i.addEventListener("input", t2); i.addEventListener("change", t2); i.addEventListener("animationstart", t2);
  new MutationObserver(t2).observe(i, { attributes: true, attributeFilter: ["type"] });
  t2(); setTimeout(t2, 400); setTimeout(t2, 1200);
}
// ringkasan keamanan: popover rincian
const aman = $("aman");
if (aman) aman.addEventListener("click", () => {
  const buka = aman.getAttribute("aria-expanded") !== "true";
  aman.setAttribute("aria-expanded", String(buka)); $("aman-isi").hidden = !buka;
});
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
  // persetujuan kebijakan privasi: diingat per peramban; tombol Masuk dan Google tampak nonaktif sampai dicentang
  const setuju = $("setuju"), KS = "meti_privasi";
  try { setuju.checked = localStorage.getItem(KS) === "1"; } catch (e) {}
  const segarkan = () => {
    for (const b of document.querySelectorAll("#kirim, .jm-tbl-google")) b.setAttribute("aria-disabled", String(!setuju.checked));
    try { setuju.checked ? localStorage.setItem(KS, "1") : localStorage.removeItem(KS); } catch (e) {}
    if (setuju.checked) pesan.innerHTML = "";
  };
  setuju.addEventListener("change", segarkan);
  document.addEventListener("click", (e) => { if (!setuju.checked && e.target.closest(".jm-tbl-google")) { e.preventDefault(); tampilPesan("galat", t("masuk.setuju_perlu")); } });
  segarkan();
  if (saya.masuk) {
    form.hidden = true;
    $("sudah").hidden = false;
    $("lanjut").href = ke;
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!setuju.checked) return tampilPesan("galat", t("masuk.setuju_perlu"));
    const surel = $("surel").value.trim();
    const sandi = $("sandi").value;
    if (!surel || !sandi) return tampilPesan("galat", t("masuk.kosong"));
    kirimForm(async () => {
      const d = await api("/api/masuk", { metode: "POST", badan: { surel, sandi } });
      location.assign(d && d.wajib_ganti ? "/ganti-sandi?ke=" + encodeURIComponent(ke) : ke);
    });
  });
  // Masuk dengan Google: tampil hanya bila server menyatakan aktif; galat balik dari Google lewat ?galat=
  const galatG = params.get("galat");
  if (params.get("keluar") === "1") tampilPesan("ok", t("masuk.sudah_keluar"));
  if (/^google_[a-z_]+$/.test(galatG || "") && t("masuk." + galatG) !== "masuk." + galatG) tampilPesan("galat", t("masuk." + galatG));
  fetch("/api/status").then((r) => r.json()).then((s) => {
    const sep = document.querySelector(".jm-atau");
    if (!s.google || !sep) return;
    sep.insertAdjacentHTML("beforebegin", `<a class="jm-tbl jm-tbl-google" href="/api/masuk/google?ke=${encodeURIComponent(ke)}"><svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true" focusable="false"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><span data-i18n="masuk.google">${t("masuk.google")}</span></a>`);
  }).catch(() => {});
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
