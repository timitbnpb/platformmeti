/* /masuk, /aktivasi, /ganti-sandi (JM-B06). Satu skrip, cabang menurut <body data-halaman>. */
import { t, gantiBahasa, bahasa, angka, tanggal } from "/i18n.js";
import { SOSMED, sosmedHtml } from "/inti/sosmed.js";
import { api, galatTeks, amanKe, pesanHtml, nanti, esc } from "/inti/umum.js";
import { IKON_TEK } from "/inti/ikon_tek.js";
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

const MI = "https://metiires.or.id";
// kerangka bersama tiga halaman akun: logo + bahasa, panggung kanan, kaki tipis (teks lewat data-i18n)
document.querySelector(".jm-ig-isi").insertAdjacentHTML("afterbegin", `<a href="${MI}" class="jm-ig-logo" aria-label="METI"><img src="/img/logo/meti-vertikal-611.png" alt="METI" width="611" height="835"></a>`);
$("atas").innerHTML = `<div class="jm-ig-bahasa" role="group" aria-label="${t("masuk.bahasa")}"><button type="button" data-b="id" aria-pressed="${bahasa() === "id"}"><img src="/img/bendera/id.svg" alt="" width="18" height="18">ID</button><button type="button" data-b="en" aria-pressed="${bahasa() === "en"}"><img src="/img/bendera/gb.svg" alt="" width="18" height="18">EN</button></div>`;
$("atas").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-b]"); if (!b) return;
  for (const x of $("atas").querySelectorAll("button[data-b]")) x.setAttribute("aria-pressed", String(x === b));
  nanti(() => gantiBahasa(b.dataset.b, { masuk: saya.masuk }));
});
const POTRET = { tgl: "2026-11-07", proyek: 548, organisasi: 363, orang: 550 }; // potret public/data/*.json; tampil dengan tanggal
const MITRA = [["pln-indonesia-power", "PLN Indonesia Power"], ["pertamina-nre", "Pertamina NRE"], ["medco-energi", "Medco Energi"], ["pge", "Pertamina Geothermal Energy"], ["brin", "BRIN"], ["esdm", "Kementerian ESDM"]];
/* satu pita per teknologi: [berkas, ikon IKON_TEK, kunci label, kunci lokasi, pencipta, lisensi, kunci judul kredit] (sama dengan img/beranda/KREDIT.md) */
const PITA = [
  ["surya-cirata", "surya", "beranda.tek.surya", "beranda.foto.surya", "indonesiagoid", "beranda.foto.lis.pd"],
  ["bayu-sidrap", "bayu", "beranda.tek.bayu", "beranda.foto.bayu", "USAID Indonesia", "beranda.foto.lis.pd"],
  ["hidro-saguling", "hidro", "beranda.tek.hidro", "beranda.foto.hidro", "NFarras", "CC BY-SA 4.0"],
  ["panas-bumi-sibayak", "panas-bumi", "beranda.tek.panas-bumi", "beranda.foto.panas-bumi", "Kenrick95", "CC BY-SA 3.0"],
  ["bioenergi-sawit", "bioenergi", "beranda.tek.bioenergi", "beranda.foto.bioenergi", "Ojiribeka Chidera", "CC BY-SA 4.0"],
  ["bioetanol-tebu", "bioenergi", "masuk.tek.etanol", "masuk.foto.etanol", "N.V. Photografisch Atelier Kurkdjian (KITLV)", "beranda.foto.lis.pd"],
  ["biomassa-bantargebang", "biomassa-sampah", "beranda.tek.biomassa-sampah", "beranda.foto.biomassa-sampah", "Kuncoro Widyo Rumpoko", "CC BY-SA 4.0"],
  ["sampah-psel", "biomassa-sampah", "beranda.prog.wte", "masuk.foto.psel", "O'Dea", "CC BY-SA 4.0"],
  ["penyimpanan-baterai", "penyimpanan", "beranda.tek.penyimpanan", "beranda.foto.cr.penyimpanan", "Kecko", "CC BY 2.0"],
  ["hidrogen-spbu", "hidrogen", "pj.tek.hidrogen", "masuk.foto.hidrogen", "Ogidya", "CC BY-SA 4.0"],
];
const pitaHtml = () => PITA.map(([f, ik, lab, lok, pencipta, lis], i) => {
  const lisensi = lis.startsWith("beranda") ? t(lis) : lis;
  return `<div class="jm-pg-pita"><img src="/img/beranda/${f}.webp" alt="" width="800" height="600" loading="${i < 3 ? "eager" : "lazy"}" decoding="async"><span class="jm-pg-pil">${IKON_TEK[ik]}<span>${esc(t(lab))}</span><small>${esc(t(lok))}</small></span><button type="button" class="jm-pg-info" aria-expanded="false" aria-controls="kr-${i}" aria-label="${esc(t("tn.kredit.judul"))}">i</button><p class="jm-pg-kredit" id="kr-${i}" hidden>${esc(t("tn.kredit.baris", { judul: t(lok), pencipta, lisensi }))}</p></div>`;
}).join("");
$("panggung").className += " jm-batik jm-batik-rata";
$("panggung").innerHTML = `<div class="jm-pg-pitas">${pitaHtml()}</div>
<div class="jm-pg-lapis"><blockquote class="jm-pg-kutip" data-i18n="masuk.kutipan">${t("masuk.kutipan")}</blockquote>
<dl class="jm-pg-stat">${[["proyek", "masuk.stat_proyek"], ["organisasi", "masuk.stat_org"], ["orang", "masuk.stat_orang"]].map(([k, l]) => `<div><dd>${angka(POTRET[k])}</dd><dt data-i18n="${l}">${t(l)}</dt></div>`).join("")}</dl>
<div class="jm-pg-mitra"><span class="jm-pg-tumpuk">${MITRA.map(([f, n]) => `<img src="/img/logo/${f}.png" alt="${n}" title="${n}" width="40" height="40" loading="lazy">`).join("")}</span><span data-i18n="masuk.mitra">${t("masuk.mitra")}</span></div>
<p class="jm-pg-sumber">${t("masuk.stat_sumber", { tanggal: tanggal(POTRET.tgl) })}</p></div>`;
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
