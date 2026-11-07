/* Rel navigasi seksi (pemilik 8 Nov 2026): dok bawah horizontal di tengah layar (kapsul kaca), butir ikon + label pendek,
   muncul setelah melewati kepala halaman, menyembunyi saat gulir cepat ke bawah. Otomatis di semua halaman:
   mengambil section/article ber-id yang punya judul. Minimal 3 seksi. */
import { esc, ikon } from "/inti/umum.js";
import { t } from "/i18n.js";

const PILIH = "main section[id], main article.jm-ex[id], main section.jm-ex[id], main .jm-ex[id]";
const judulPenuh = (el) => (el.dataset.relLabel || el.querySelector(".jm-ex-ey, .jm-kh-ey")?.textContent || el.querySelector("h2, .jm-ex-j, h3")?.textContent || "").trim().replace(/\s+/g, " ");
/* label butir rel: maksimal 3 kata bermakna (data-rel-label menang, apa adanya) */
const KATA_LEWAT = /^(di|ke|dari|yang|dan|untuk|pada|dengan|apa|mengapa|bagaimana|siapa|kapan|ini|itu|atau|serta|saja|ada|dalamnya)$/i;
const judul = (el) => {
  if (el.dataset.relLabel) return judulPenuh(el);
  const k = judulPenuh(el).replace(/[?!.:;,]+$/g, "").split(" ");
  const inti = k.filter((w) => !KATA_LEWAT.test(w));
  const h = (inti.length ? inti : k).slice(0, 3).join(" ");
  return h.charAt(0).toUpperCase() + h.slice(1);
};
/* ikon dari kata kunci judul bila seksi tak menyebut ikon sendiri, supaya tiap butir rel berbeda */
const KATA_IKON = [[/peta|lokasi|wilayah|provinsi|sebaran/i, "peta"], [/proyek|pembangkit/i, "proyek"], [/regulasi|aturan|hukum|kebijakan|perda/i, "regulasi"], [/berita|media/i, "berita"], [/kalender|agenda|acara|jadwal/i, "kalender"], [/tren|volume|waktu|tahun/i, "analisis"], [/rantai|pabrik|pasok/i, "rantai"], [/asean|negara/i, "asean"], [/metode|cara|sumber/i, "metode"], [/organisasi|pengurus|struktur|anggota|mitra|tim|orang|pakar|siapa/i, "orang"], [/tentang|mengapa|kontak|faq|pertanyaan/i, "info"], [/teknologi|surya|energi/i, "tek-surya"], [/emisi|karbon/i, "tek-panas"], [/data|dataset|angka|ringkas|kondisi|insight|temuan/i, "insight"], [/akses|gabung|daftar/i, "kunci"]];
const ikonSeksi = (el) => {
  const sv = el.querySelector(".jm-ex-ey svg, .jm-kh-ey svg");
  if (el.dataset.relIkon) return ikon(el.dataset.relIkon, 18);
  if (sv) return sv.outerHTML;
  const j = judulPenuh(el); const k = KATA_IKON.find(([re]) => re.test(j));
  return ikon(k ? k[1] : "daftar", 18);
};

function kumpul() {
  const lihat = new Set();
  return [...document.querySelectorAll(PILIH)].filter((el) => {
    if (lihat.has(el.id) || el.closest("dialog") || el.hidden || el.dataset.rel === "tidak") return false;
    // seksi bersarang: ambil yang terluar saja
    if ([...lihat].some((id) => document.getElementById(id)?.contains(el))) return false;
    const j = judul(el); if (!j) return false;
    lihat.add(el.id); return true;
  });
}

let rel, pengamat, lepas;
function bangun() {
  const seksi = kumpul();
  rel?.remove(); pengamat?.disconnect(); lepas?.();
  const H = document.documentElement;
  H.classList.toggle("jm-ada-rel", seksi.length >= 3);
  if (seksi.length < 3) { H.classList.remove("jm-rel-tampil"); return; }
  const item = (el) => `<a href="#${esc(el.id)}" data-rel="${esc(el.id)}" title="${esc(judul(el))}"><span class="jm-rel-ik">${ikonSeksi(el)}</span><span class="jm-rel-l">${esc(judul(el))}</span></a>`;
  rel = document.createElement("nav");
  rel.className = "jm-rel"; rel.setAttribute("aria-label", t("jm.rel"));
  rel.innerHTML = `<button type="button" class="jm-rel-p jm-rel-kr" aria-hidden="true" tabindex="-1">${ikon("panah-kiri", 16)}</button><div class="jm-rel-gulir">${seksi.map(item).join("")}</div><button type="button" class="jm-rel-p jm-rel-kn" aria-hidden="true" tabindex="-1">${ikon("panah-kanan", 16)}</button>`;
  document.body.append(rel);
  const gl = rel.querySelector(".jm-rel-gulir");
  const meluber = () => { rel.classList.toggle("kr", gl.scrollLeft > 4); rel.classList.toggle("kn", gl.scrollLeft + gl.clientWidth < gl.scrollWidth - 4); };
  rel.querySelector(".jm-rel-kr").onclick = () => gl.scrollBy({ left: -gl.clientWidth * 0.7, behavior: "smooth" });
  rel.querySelector(".jm-rel-kn").onclick = () => gl.scrollBy({ left: gl.clientWidth * 0.7, behavior: "smooth" });
  gl.addEventListener("scroll", meluber, { passive: true });
  let aktif;
  const tanda = (id) => {
    gl.querySelectorAll("a").forEach((a) => { const on = a.dataset.rel === id; a.toggleAttribute("aria-current", on); if (on) aktif = a; });
    aktif?.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
    meluber();
  };
  pengamat = new IntersectionObserver((es) => {
    const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (v) tanda(v.target.id);
  }, { rootMargin: "-30% 0px -60% 0px" });
  seksi.forEach((el) => pengamat.observe(el));
  // tampil setelah melewati kepala halaman; sembunyi saat gulir cepat ke bawah, muncul lagi saat berhenti/naik
  let y0 = scrollY, henti, rf = 0;
  const muncul = () => { const ya = scrollY > innerHeight * 0.6; H.classList.toggle("jm-rel-tampil", ya); rel.classList.remove("sembunyi"); };
  const garis = () => {
    rf = 0;
    const el = aktif && document.getElementById(aktif.dataset.rel);
    if (el) { const r = el.getBoundingClientRect(); aktif.style.setProperty("--kemajuan", Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - innerHeight * 0.5)))); }
    const dy = scrollY - y0; y0 = scrollY;
    if (dy > 40 && scrollY > innerHeight * 0.6) rel.classList.add("sembunyi"); else if (dy < 0) rel.classList.remove("sembunyi");
    H.classList.toggle("jm-rel-tampil", scrollY > innerHeight * 0.6);
    clearTimeout(henti); henti = setTimeout(muncul, 180);
  };
  const gulir = () => { rf ||= requestAnimationFrame(garis); };
  addEventListener("scroll", gulir, { passive: true });
  addEventListener("resize", meluber);
  lepas = () => { removeEventListener("scroll", gulir); removeEventListener("resize", meluber); clearTimeout(henti); };
  muncul(); meluber();
}

let tunda;
export function pasangRel() {
  const jalan = () => { clearTimeout(tunda); tunda = setTimeout(bangun, 300); };
  jalan();
  // halaman merender seksi secara malas; bangun ulang saat jumlah seksi berubah
  let n = 0;
  new MutationObserver(() => { const m = kumpul().length; if (m !== n) { n = m; jalan(); } }).observe(document.querySelector("main") || document.body, { childList: true, subtree: true });
}
