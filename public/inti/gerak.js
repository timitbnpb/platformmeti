/* Gerak halaman bersama: blok muncul halus saat terlihat, angka menghitung naik sekali, grafik tumbuh saat terlihat.
   Tanpa JS, atau dengan reduced-motion, semua isi langsung tampil. Hanya transform dan opacity, dan
   kelas dilepas sesudah selesai supaya elemen fixed/sticky di dalam blok tidak terganggu. */
const TANPA = new Set(["admin", "otorisasi", "aktivasi", "ganti-sandi", "kta", "kta-v", "masuk", "meti-wilayah-kelola"]);
const BLOK = "main > section, main .jm-ex, main .jm-kartu";
const ANGKA = "main .jm-kh-angka b, main .jm-angka";
const GRAFIK = "main .jm-gf svg, main svg[viewBox], main .jm-batang, main .jm-an-batang";
const MAKS_CALON = 1500;
const MAKS_BLOK = 80;

/* "1.234,5" pada progres f: angka digulir, pemisah tetap di posisinya */
export function bentukAngka(teks, f) {
  const digit = teks.replace(/\D/g, ""), n = Math.round(Number(digit) * f);
  const isi = String(n).padStart(digit.length, "0");
  let i = 0, sudah = false, hasil = "";
  for (const c of teks) {
    if (/\d/.test(c)) { const d = isi[i++]; sudah ||= d !== "0" || i === digit.length; if (sudah) hasil += d; }
    else if (sudah) hasil += c;
  }
  return hasil;
}

function hitung(el) {
  const simpul = el.firstChild, akhir = el.textContent.trim();
  if (!simpul || simpul.nodeType !== 3 || el.childNodes.length !== 1 || !/^\d[\d.,]*$/.test(akhir) || akhir === "0") return;
  const mulai = performance.now();
  let terakhir = simpul.data = bentukAngka(akhir, 0);
  const langkah = (kini) => {
    if (el.firstChild !== simpul || simpul.data !== terakhir) return; // halaman sudah menggambar ulang angkanya
    const p = Math.min(1, (kini - mulai) / 800);
    terakhir = simpul.data = p < 1 ? bentukAngka(akhir, 1 - (1 - p) ** 3) : akhir;
    if (p < 1) requestAnimationFrame(langkah);
  };
  requestAnimationFrame(langkah);
}

export function pasangGerak() {
  if (TANPA.has(document.body.dataset.halaman) || location.pathname.startsWith("/admin") || document.querySelector("main.rm")) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const main = document.querySelector("main");
  if (!main) return;
  const dilihat = new WeakSet();
  const selesai = (el) => el.classList.remove("gk-tunggu", "gk-masuk");
  const menunggu = new Set();
  const tampilkan = (el) => {
    menunggu.delete(el);
    el.classList.add("gk-masuk");
    el.classList.remove("gk-tunggu");
    setTimeout(() => selesai(el), 800);
  };
  const io = new IntersectionObserver((es) => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      if (e.target.matches(ANGKA) || e.target.dataset.gkAngka) { hitung(e.target); continue; }
      if (e.target.matches(GRAFIK)) { e.target.classList.add("gk-tumbuh"); continue; }
      tampilkan(e.target);
    }
  }, { rootMargin: "0px 0px -6% 0px" });
  let sisa = MAKS_BLOK;
  const pindai = () => {
    for (const el of main.querySelectorAll(BLOK)) {
      if (dilihat.has(el) || sisa <= 0) continue;
      dilihat.add(el);
      if (el.classList.contains("jm-kh") || el.closest("dialog") || el.parentElement.closest(BLOK)) continue;
      if (el.getBoundingClientRect().top < innerHeight) continue; // yang sudah terlihat tidak disembunyikan lagi
      sisa--; el.classList.add("gk-tunggu"); menunggu.add(el); io.observe(el);
    }
    for (const el of main.querySelectorAll(ANGKA)) if (!dilihat.has(el)) { dilihat.add(el); io.observe(el); }
    for (const el of main.querySelectorAll(GRAFIK)) {
      if (dilihat.has(el) || (el.matches("svg") && el.getBoundingClientRect().height < 90)) continue; // ikon dilewati
      dilihat.add(el); io.observe(el);
    }
    // angka besar di kartu mana pun; tabel dan dialog dilewati agar halaman data tetap ringan
    for (const el of [...main.querySelectorAll("b,strong,span,p")].slice(0, MAKS_CALON)) {
      if (dilihat.has(el) || el.children.length || !/^\d[\d.,]*$/.test(el.textContent.trim()) || el.closest("table,dialog,a[href^='/p'],.jm-rel")) continue;
      dilihat.add(el);
      if (parseFloat(getComputedStyle(el).fontSize) >= 22) { el.dataset.gkAngka = "1"; io.observe(el); }
    }
  };
  pindai();
  // jaring pengaman: blok tidak boleh tetap tersembunyi bila IntersectionObserver tertahan
  let tundaGulir;
  const periksa = () => { for (const el of menunggu) if (el.getBoundingClientRect().top < innerHeight) { io.unobserve(el); tampilkan(el); } };
  addEventListener("scroll", () => { clearTimeout(tundaGulir); tundaGulir = setTimeout(periksa, 150); }, { passive: true });
  addEventListener("resize", periksa);
  let tunda;
  new MutationObserver(() => { clearTimeout(tunda); tunda = setTimeout(pindai, 200); }).observe(main, { childList: true, subtree: true });
}
